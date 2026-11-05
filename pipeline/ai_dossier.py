#!/usr/bin/env python3
"""
Il dossier della scheda AI per l'agente `ai` (Opus).

Dal 5 novembre 2026 la sezione AI non la scrive piu' la regia (Sonnet) ma un agente su Opus,
come le notizie, le schede e GTA VI (Mike: «basta che la prosa sia stesa da Opus»). Questo
script gli prepara tutta la materia in un file solo, senza immagini:

* la **cronaca**: le voci dei gironi `ai` del grezzo, con l'estratto dell'articolo, aperti
  tutti insieme in parallelo;
* il **LAB**: le fonti `lab` del grezzo e quello che ha trovato `lab.py` (Reddit, Show HN, le
  liste awesome, i post su X aperti con fxtwitter), piu' gli appunti di Mike in manual.md;
* la **memoria**: le voci AI dei 14 giorni prima (per non ripetersi e per i seguiti, con il
  filo) e il fronte di oggi (l'ultimo modello per laboratorio).

    python3 pipeline/ai_dossier.py            /tmp/corsa/ai-dossier.txt
    python3 pipeline/ai_dossier.py 2026-11-05
"""

import argparse
import concurrent.futures as cf
import os
import re
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
from schede import scarica, estratto

OUT = "/tmp/corsa/ai-dossier.txt"
MANUAL = os.path.join(C.ROOT, "data", "social", "manual.md")
MAX_CRONACA = 45          # le piu' fresche: oltre e' rumore, e il dossier diventa un libro


def storico(day, giorni=14):
    out = []
    lim = (date.fromisoformat(day) - timedelta(days=giorni)).isoformat()
    for name in sorted(os.listdir(C.BRIEFS_DIR)):
        m = re.match(r"^(\d{4}-\d{2}-\d{2})\.json$", name)
        if not m or m.group(1) >= day or m.group(1) < lim:
            continue
        try:
            b = C.load_json(os.path.join(C.BRIEFS_DIR, name))
        except ValueError:
            continue
        for a in b.get("ai") or []:
            out.append((m.group(1), a))
    return out


def fronte(day):
    """L'ultimo modello per laboratorio, da tutto l'archivio fino a ieri."""
    ultimo = {}
    for name in sorted(os.listdir(C.BRIEFS_DIR)):
        m = re.match(r"^(\d{4}-\d{2}-\d{2})\.json$", name)
        if not m or m.group(1) >= day:
            continue
        try:
            b = C.load_json(os.path.join(C.BRIEFS_DIR, name))
        except ValueError:
            continue
        for a in b.get("ai") or []:
            if (a.get("kind") or "").lower() == "modello":
                ultimo[(a.get("lab") or "altri").lower()] = (m.group(1), a)
    return ultimo


def run(day):
    raw_path = os.path.join(C.ROOT, "data", "raw", f"{day}.json")
    if not os.path.exists(raw_path):
        sys.exit(f"Nessun grezzo per il {day}: lancia prima fetch.py.")
    raw = C.load_json(raw_path)
    arts = raw.get("items", []) if isinstance(raw, dict) else raw
    cron = sorted([a for a in arts if a.get("tier") == "ai"], key=lambda a: a.get("age_hours", 99))[:MAX_CRONACA]
    labsrc = [a for a in arts if a.get("tier") == "lab"]
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        testi = list(ex.map(lambda a: estratto(scarica(a.get("link"))), cron))

    L = [f"DOSSIER AI — {day}", ""]
    L.append(f"## CRONACA: il girone ai del grezzo ({len(cron)}, le piu' fresche)")
    for a, t in zip(cron, testi):
        L.append(f"\n### {a.get('source')} · {a.get('age_hours')}h")
        L.append(f"TITOLO: {a.get('title')}")
        if a.get("summary"):
            L.append(f"SOMMARIO: {a['summary'][:400]}")
        L.append(f"ARTICOLO: {t}" if t else "ARTICOLO: (non si apre: solo il sommario)")
        L.append(f"LINK: {a.get('link')}")

    L += ["", f"## LAB: le fonti lab del grezzo ({len(labsrc)})"]
    for a in labsrc:
        L.append(f"- {a.get('source')} · {a.get('age_hours')}h · {a.get('title')} <{a.get('link')}>"
                 + (f"\n    {a['summary'][:300]}" if a.get("summary") else ""))

    lab_path = os.path.join(C.ROOT, "data", "lab", f"{day}.json")
    lab = C.load_json(lab_path).get("items", []) if os.path.exists(lab_path) else []
    L += ["", f"## LAB: quello che ha trovato lab.py ({len(lab)}) — Reddit, Show HN, liste awesome, X"]
    for x in lab:
        riga = f"- [{x.get('source') or x.get('platform')}] {x.get('title')} <{x.get('link')}>"
        if x.get("signal"):
            riga += f"  · {x['signal']}"
        L.append(riga)
        for k in ("text", "summary", "note"):
            if x.get(k):
                L.append(f"    {str(x[k])[:300]}")
                break

    man = []
    if os.path.exists(MANUAL):
        with open(MANUAL, encoding="utf-8") as fh:
            man = [l.strip() for l in fh if re.search(r"https?://", l)]
    L += ["", f"## APPUNTI DI MIKE in manual.md ({len(man)}) — hanno la precedenza su tutto"]
    L += [f"- {m[:300]}" for m in man[-30:]]

    st = storico(day)
    L += ["", f"## GIA' USCITO nella scheda AI nei 14 giorni prima ({len(st)}) — non ripetere; un seguito si dichiara col filo"]
    for d, a in st:
        L.append(f"- {d} [{a.get('lab')}/{a.get('kind')}] {a.get('title')} <{a.get('link')}>"
                 + (f"  filo: {a['thread']}" if a.get("thread") else ""))

    fr = fronte(day)
    L += ["", "## IL FRONTE fino a ieri (l'ultimo modello per laboratorio)"]
    for lab_, (d, a) in sorted(fr.items()):
        nome = (a.get("modello") or {}).get("nome") or a.get("title")
        fam = (a.get("modello") or {}).get("famiglia") or "?"
        L.append(f"- {lab_}: {nome} ({fam}), {d}")

    fili = "/tmp/corsa/threads-list.txt"
    if os.path.exists(fili):
        with open(fili, encoding="utf-8") as fh:
            L += ["", "## FILI APERTI (threads.py list)"] + [l.rstrip() for l in fh.readlines()[:60]]

    L += ["", f"Articoli di cronaca aperti: {sum(bool(t) for t in testi)} su {len(cron)}.", "", "<!-- fine lettura -->"]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(L) + "\n")
    print(f"dossier AI: {len(cron)} di cronaca ({sum(bool(t) for t in testi)} aperti), {len(labsrc)} fonti lab, "
          f"{len(lab)} da lab.py, {len(man)} appunti, {len(st)} voci nello storico -> {OUT}")
    return 0


def main():
    ap = argparse.ArgumentParser(description="il dossier della scheda AI per Opus")
    ap.add_argument("date", nargs="?")
    a = ap.parse_args()
    return run(a.date or C.today())


if __name__ == "__main__":
    sys.exit(main())
