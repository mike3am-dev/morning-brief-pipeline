#!/usr/bin/env python3
"""
Quanto e' costata la corsa: tempo e token, letti dal registro di Claude Code.

Mike ha chiesto (1 ottobre 2026) di sapere ogni mattina quanto ci mette la
corsa e quanto consuma. Claude Code scrive ogni messaggio della sessione in
~/.claude/projects/<cartella>/<sessione>.jsonl, con l'uso di token di ogni
risposta: questo script prende la sessione piu' recente di questa cartella
(cioe' la corsa che lo sta lanciando), somma, e stampa una riga da mettere
nel messaggio di chiusura. La riga va anche in data/corse.json, cosi' si vede
l'andamento giorno per giorno.

    python3 pipeline/costo.py              stampa e registra
    python3 pipeline/costo.py --dry        stampa e basta
    python3 pipeline/costo.py --storia     le ultime corse registrate
    python3 pipeline/costo.py --fasi       quanto ha preso ogni passo della corsa di oggi

Il 2 ottobre 2026 la corsa ha messo 98 minuti contro un tetto di 30, e per capire dove si
era perso il tempo è servita una ricostruzione a mano. `--fasi` lo fa da solo: guarda quando
compare nel registro ogni comando `pipeline/*.py` e quanto passa dall'uno al successivo, più
la durata di ogni sottoagente (il visualista, soprattutto) preso dal suo registro separato.

Il tempo va dal primo messaggio della sessione a adesso. I token sono quattro
voci diverse, che pesano in modo diverso sui limiti dell'abbonamento:
  nuovi     testo letto per la prima volta (prompt, file, pagine scaricate)
  in cache  testo gia' letto e riletto a ogni passo: costa circa un decimo
  scritti   quello che il modello scrive (l'edizione, i comandi): il piu' caro
"""

import argparse
import glob
import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

LOG = os.path.join(C.ROOT, "data", "corse.json")


def project_dir():
    """La cartella dei registri di Claude Code per questo repository: il
    percorso con le barre sostituite da trattini."""
    base = os.path.expanduser("~/.claude/projects")
    want = os.path.join(base, C.ROOT.replace("/", "-").replace(".", "-"))
    if os.path.isdir(want):
        return want
    # ripiego: la cartella che contiene il registro scritto per ultimo
    files = glob.glob(os.path.join(base, "*", "*.jsonl"))
    return os.path.dirname(max(files, key=os.path.getmtime)) if files else None


def session_files(pdir):
    main = max(glob.glob(os.path.join(pdir, "*.jsonl")), key=os.path.getmtime)
    sid = os.path.basename(main)[:-6]
    # gli eventuali sottoagenti scrivono accanto, in <sessione>/subagents/
    subs = glob.glob(os.path.join(pdir, sid, "**", "*.jsonl"), recursive=True)
    return sid, [main] + subs


PASSI = re.compile(
    r"pipeline/(fetch|social|lab|taste|missed|threads|claims|facts|verify|"
    r"images|audio|push|lint|prune_auto|build|publish_site|costo)\.py")


def fasi_main(main_file):
    """I comandi pipeline/*.py lanciati nella sessione principale, con il
    tempo passato da un comando al successivo: dove va il tempo, passo per
    passo, senza doverlo ricostruire a mano."""
    passi = []
    with open(main_file, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get("type") != "assistant":
                continue
            ts = d.get("timestamp")
            if not ts:
                continue
            for block in (d.get("message") or {}).get("content") or []:
                if block.get("type") != "tool_use" or block.get("name") != "Bash":
                    continue
                m = PASSI.search(block.get("input", {}).get("command") or "")
                if m:
                    passi.append((ts, m.group(1)))
    passi.sort()
    # raggruppa le chiamate consecutive allo stesso script: quello che conta
    # e' quando inizia un passo nuovo e quanto e' durato il buco prima
    gruppi = []
    for ts, nome in passi:
        if gruppi and gruppi[-1][1] == nome:
            gruppi[-1] = (gruppi[-1][0], nome, ts)  # aggiorna l'ultima vista
        else:
            gruppi.append((ts, nome, ts))
    out = []
    for i, (inizio, nome, fine) in enumerate(gruppi):
        t = datetime.fromisoformat(inizio.replace("Z", "+00:00"))
        buco = ""
        if i > 0:
            prima = datetime.fromisoformat(gruppi[i - 1][2].replace("Z", "+00:00"))
            gap = round((t - prima).total_seconds() / 60)
            if gap >= 1:
                buco = f"(buco di {gap} min prima)"
        out.append((t.strftime("%H:%M:%S"), nome, buco))
    return out


def fasi_subagenti(files, main_file):
    """Durata di ogni sottoagente (inizio-fine del suo registro separato):
    il visualista, soprattutto, che non lascia traccia nel registro principale
    mentre lavora."""
    out = []
    for f in files:
        if f == main_file:
            continue
        primi, ultimi = None, None
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                ts = d.get("timestamp")
                if not ts:
                    continue
                if primi is None or ts < primi:
                    primi = ts
                if ultimi is None or ts > ultimi:
                    ultimi = ts
        if primi and ultimi:
            dur = round((datetime.fromisoformat(ultimi.replace("Z", "+00:00")) -
                         datetime.fromisoformat(primi.replace("Z", "+00:00"))).total_seconds() / 60)
            nome = os.path.basename(os.path.dirname(f)) or os.path.basename(f)[:-6]
            out.append((nome, dur))
    return out


def tally(files):
    seen, first = set(), None
    t = {"nuovi": 0, "in_cache": 0, "scritti_cache": 0, "scritti": 0, "risposte": 0, "ricerche_web": 0}
    for f in files:
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                ts = d.get("timestamp")
                if ts and (first is None or ts < first):
                    first = ts
                msg = d.get("message") or {}
                u = msg.get("usage")
                if d.get("type") != "assistant" or not u:
                    continue
                mid = msg.get("id") or d.get("uuid")
                if mid in seen:      # la stessa risposta compare una riga per blocco
                    continue
                seen.add(mid)
                t["risposte"] += 1
                t["nuovi"] += u.get("input_tokens", 0)
                t["in_cache"] += u.get("cache_read_input_tokens", 0)
                t["scritti_cache"] += u.get("cache_creation_input_tokens", 0)
                t["scritti"] += u.get("output_tokens", 0)
                t["ricerche_web"] += (u.get("server_tool_use") or {}).get("web_search_requests", 0)
    return first, t


def human(n):
    return f"{n / 1e6:.1f} M" if n >= 1e6 else f"{n / 1e3:.0f} k"


def line(r):
    return (f"Corsa: {r['minuti']} min, {r['risposte']} passi · token: "
            f"{human(r['nuovi'] + r['scritti_cache'])} nuovi, {human(r['in_cache'])} riletti dalla cache, "
            f"{human(r['scritti'])} scritti")


def main():
    ap = argparse.ArgumentParser(description="tempo e token della corsa")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--storia", action="store_true")
    ap.add_argument("--fasi", action="store_true")
    args = ap.parse_args()

    if args.storia:
        for r in (C.load_json(LOG) if os.path.exists(LOG) else [])[-14:]:
            print(r["giorno"], "·", line(r))
        return 0

    if args.fasi:
        pdir = project_dir()
        if not pdir:
            print("Registro di Claude Code non trovato.")
            return 0
        sid, files = session_files(pdir)
        main_file = os.path.join(pdir, sid + ".jsonl")
        print("Comandi pipeline, nell'ordine in cui sono partiti:")
        for ora, nome, dt in fasi_main(main_file):
            print(f"  {ora}  {nome:<14} {dt}")
        sub = fasi_subagenti(files, main_file)
        if sub:
            print("\nSottoagenti (durata inizio-fine del loro registro):")
            for nome, dur in sub:
                print(f"  {nome}: {dur} min")
        return 0

    pdir = project_dir()
    if not pdir:
        print("Registro di Claude Code non trovato: tempo e consumo non misurabili.")
        return 0
    sid, files = session_files(pdir)
    first, t = tally(files)
    start = datetime.fromisoformat(first.replace("Z", "+00:00")) if first else datetime.now(timezone.utc)
    r = dict(t, giorno=C.today(), sessione=sid, inizio=start.isoformat(timespec="seconds"),
             minuti=round((datetime.now(timezone.utc) - start).total_seconds() / 60))
    print(line(r))
    if not args.dry:
        log = C.load_json(LOG) if os.path.exists(LOG) else []
        log = [x for x in log if x.get("sessione") != sid] + [r]
        C.save_json(LOG, log[-120:])
    return 0


if __name__ == "__main__":
    sys.exit(main())
