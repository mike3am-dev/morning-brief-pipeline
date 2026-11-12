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
    python3 pipeline/costo.py --confronto 2026-11-06
                                           le corse prima e dopo quella data, in media

Dal 5 novembre 2026 il conto e' anche diviso per registro (la sessione principale e
ogni sottoagente, col suo nome) e per modello (Opus e Sonnet a parte): il piano di
risparmio dei token (docs/risparmio-token/) si dimostra solo cosi'. Le due tabelle
vanno in data/corse.json nei campi `registri` e `modelli`; le righe vecchie non le
hanno, e --storia e --confronto le leggono lo stesso.

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
    r"pipeline/(fetch|social|lab|taste|missed|threads|claims|facts|verify|eco|rubriche|"
    r"borsa|accenti|images|audio|push|lint|prune_auto|build|publish_site|costo|"
    r"mattino|chiudi|salva|aspetta|campi|qualita)\.py")


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
            out.append((nome_registro(f, main_file), dur))
    return out


VOCI = ("nuovi", "in_cache", "scritti_cache", "scritti", "risposte", "ricerche_web")


def zero():
    return {k: 0 for k in VOCI}


def modello(nome):
    """Il nome breve del modello: Opus e Sonnet pesano in modo diverso sui
    limiti, e mescolati nello stesso totale non si capisce chi ha speso."""
    n = (nome or "").lower()
    for k in ("opus", "sonnet", "haiku", "fable"):
        if k in n:
            return k.capitalize()
    return nome or "?"


def nome_registro(f, main_file):
    """Chi ha scritto questo registro: «principale», o il sottoagente col suo
    tipo e la descrizione data alla chiamata. Claude Code la scrive accanto, in
    agent-<id>.meta.json; se manca, la prima riga del compito ricevuto."""
    if f == main_file:
        return "principale"
    meta = f[:-6] + ".meta.json"
    try:
        with open(meta, encoding="utf-8") as fh:
            m = json.load(fh)
        tipo, desc = m.get("agentType") or "", m.get("description") or ""
        if tipo and desc:
            return f"{tipo}: {desc}"
        if tipo or desc:
            return tipo or desc
    except (OSError, ValueError):
        pass
    try:
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                d = json.loads(line)
                if d.get("type") != "user":
                    continue
                c = (d.get("message") or {}).get("content")
                if isinstance(c, list):
                    c = " ".join(b.get("text", "") for b in c if isinstance(b, dict))
                c = re.sub(r"\s+", " ", str(c or "")).strip()
                if c:
                    return "sottoagente: " + c[:60]
                break
    except (OSError, ValueError):
        pass
    return os.path.basename(f)[:-6]


def tally(files, main_file=None):
    """Somma l'uso di token di tutti i registri. Oltre al totale, lo stesso
    conto per registro (in ordine di file) e per modello."""
    seen, first = set(), None
    t = zero()
    registri, modelli = [], {}
    for f in files:
        r = dict(zero(), nome=nome_registro(f, main_file), modelli=[])
        primi, ultimi = None, None
        with open(f, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                ts = d.get("timestamp")
                if ts and (first is None or ts < first):
                    first = ts
                if ts:
                    primi = ts if primi is None or ts < primi else primi
                    ultimi = ts if ultimi is None or ts > ultimi else ultimi
                msg = d.get("message") or {}
                u = msg.get("usage")
                if d.get("type") != "assistant" or not u:
                    continue
                mid = msg.get("id") or d.get("uuid")
                if mid in seen:      # la stessa risposta compare una riga per blocco
                    continue
                seen.add(mid)
                mod = modello(msg.get("model"))
                if mod == "<synthetic>":   # messaggi di servizio, non risposte vere
                    continue
                m = modelli.setdefault(mod, zero())
                if mod not in r["modelli"]:
                    r["modelli"].append(mod)
                for acc in (t, r, m):
                    acc["risposte"] += 1
                    acc["nuovi"] += u.get("input_tokens", 0)
                    acc["in_cache"] += u.get("cache_read_input_tokens", 0)
                    acc["scritti_cache"] += u.get("cache_creation_input_tokens", 0)
                    acc["scritti"] += u.get("output_tokens", 0)
                    acc["ricerche_web"] += (u.get("server_tool_use") or {}).get("web_search_requests", 0)
        if primi and ultimi:
            r["minuti"] = round((datetime.fromisoformat(ultimi.replace("Z", "+00:00")) -
                                 datetime.fromisoformat(primi.replace("Z", "+00:00"))).total_seconds() / 60)
            # dal 13 novembre 2026 restano anche i due orari (UTC): la redazione di TMB
            # (docs/redazione/) ci timbra il cartellino di ogni agente
            r["inizio"], r["fine"] = primi, ultimi
        r["modello"] = "+".join(r.pop("modelli")) or "?"
        if r["risposte"]:
            registri.append(r)
    return first, t, registri, modelli


def human(n):
    return f"{n / 1e6:.1f} M" if n >= 1e6 else f"{n / 1e3:.0f} k"


def line(r):
    return (f"Corsa: {r['minuti']} min, {r['risposte']} passi · token: "
            f"{human(r['nuovi'] + r['scritti_cache'])} nuovi, {human(r['in_cache'])} riletti dalla cache, "
            f"{human(r['scritti'])} scritti")


def parte(r):
    """La riga breve di un registro o di un modello."""
    return (f"{r['risposte']} passi, {human(r['nuovi'] + r['scritti_cache'])} nuovi, "
            f"{human(r['in_cache'])} riletti, {human(r['scritti'])} scritti")


def dettaglio(r):
    """Le righe per registro e per modello, sotto la riga della corsa."""
    out = []
    if r.get("modelli"):
        out.append("Per modello: " + " · ".join(
            f"{k} {parte(v)}" for k, v in sorted(r["modelli"].items(), key=lambda kv: -kv[1]["in_cache"])))
    if r.get("registri"):
        out.append("Per registro:")
        for g in r["registri"]:
            dur = f", {g['minuti']} min" if g.get("minuti") is not None else ""
            out.append(f"  {g['nome'][:58]:<58} [{g.get('modello', '?')}{dur}] {parte(g)}")
    return out


def confronto(log, giorno):
    """Le corse prima e dopo una data, in media: il prima/dopo del risparmio.
    Una corsa per giorno (l'ultima registrata), i giorni con piu' sessioni non
    contano doppio."""
    per_giorno = {}
    for r in log:
        per_giorno[r["giorno"]] = r
    prima = [r for g, r in sorted(per_giorno.items()) if g < giorno]
    dopo = [r for g, r in sorted(per_giorno.items()) if g >= giorno]
    campi = (("minuti", "minuti", lambda r: r.get("minuti", 0)),
             ("passi", "passi", lambda r: r.get("risposte", 0)),
             ("nuovi", "tok", lambda r: r.get("nuovi", 0) + r.get("scritti_cache", 0)),
             ("riletti", "tok", lambda r: r.get("in_cache", 0)),
             ("scritti", "tok", lambda r: r.get("scritti", 0)))

    def media(rs, f):
        return sum(f(r) for r in rs) / len(rs) if rs else None

    def fmt(v, kind):
        if v is None:
            return "—"
        return human(v) if kind == "tok" else f"{v:.0f}"

    print(f"Corse prima del {giorno}: {len(prima)}"
          + (f" ({prima[0]['giorno']} … {prima[-1]['giorno']})" if prima else "")
          + f" · dal {giorno}: {len(dopo)}"
          + (f" ({dopo[0]['giorno']} … {dopo[-1]['giorno']})" if dopo else ""))
    print(f"  {'':10} {'prima':>9} {'dopo':>9} {'diff':>7}")
    for nome, kind, f in campi:
        a, b = media(prima, f), media(dopo, f)
        diff = f"{(b - a) / a * 100:+.0f}%" if a and b is not None else "—"
        print(f"  {nome:10} {fmt(a, kind):>9} {fmt(b, kind):>9} {diff:>7}")
    # la principale da sola, dove le corse nuove la registrano
    princ = [g for r in dopo for g in r.get("registri") or [] if g.get("nome") == "principale"]
    if princ:
        print(f"  principale, dopo: {sum(g['risposte'] for g in princ) / len(princ):.0f} passi e "
              f"{human(sum(g['in_cache'] for g in princ) / len(princ))} riletti in media")
    return 0


def main():
    ap = argparse.ArgumentParser(description="tempo e token della corsa")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--storia", action="store_true")
    ap.add_argument("--fasi", action="store_true")
    ap.add_argument("--confronto", metavar="AAAA-MM-GG",
                    help="media delle corse prima e dopo quella data")
    args = ap.parse_args()

    if args.confronto:
        return confronto(C.load_json(LOG) if os.path.exists(LOG) else [], args.confronto)

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
        _, _, registri, _ = tally(files, main_file)
        if registri:
            print()
            print("\n".join(dettaglio({"registri": registri})))
        return 0

    pdir = project_dir()
    if not pdir:
        print("Registro di Claude Code non trovato: tempo e consumo non misurabili.")
        return 0
    sid, files = session_files(pdir)
    main_file = os.path.join(pdir, sid + ".jsonl")
    first, t, registri, modelli = tally(files, main_file)
    start = datetime.fromisoformat(first.replace("Z", "+00:00")) if first else datetime.now(timezone.utc)
    r = dict(t, giorno=C.today(), sessione=sid, inizio=start.isoformat(timespec="seconds"),
             minuti=round((datetime.now(timezone.utc) - start).total_seconds() / 60),
             registri=registri, modelli=modelli)
    try:   # quando è partito ogni passo della regia (ora UTC), per la redazione di TMB
        r["passi"] = [{"ora_utc": o, "passo": n} for o, n, _ in fasi_main(main_file)]
    except Exception:
        pass
    print(line(r))
    print("\n".join(dettaglio(r)))
    if not args.dry:
        log = C.load_json(LOG) if os.path.exists(LOG) else []
        log = [x for x in log if x.get("sessione") != sid] + [r]
        C.save_json(LOG, log[-120:])
    return 0


if __name__ == "__main__":
    sys.exit(main())
