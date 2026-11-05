#!/usr/bin/env python3
"""
Il dossier delle schede Games e Scienza per l'agente `schede` (Opus).

Dal 5 novembre 2026 la prosa delle due schede la scrive Opus, non Gemini (Mike: «basta che
la prosa sia stesa da Opus»). rubriche.py sceglie una rosa di candidati per scheda (fino a
18, nel file data/rubriche/<giorno>.json, chiave `candidati`); questo script apre **tutti**
gli articoli in un colpo solo, in parallelo, ne tiene il testo utile e prepara il dossier.

    python3 pipeline/schede.py              /tmp/corsa/schede-dossier.txt
    python3 pipeline/schede.py 2026-11-05

L'agente sceglie le dieci, unisce i doppioni (anche fra lingue: lo stesso telescopio dal NYT e
dall'ANSA) e scrive data/rubriche/<giorno>-scritte.json; rubriche.merge lo porta nell'edizione.
Le pagine di Google News sono rinvii che senza un browser non si seguono: per quelle resta il
sommario, e il dossier lo dice.
"""

import argparse
import concurrent.futures as cf
import html as H
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

DIR = os.path.join(C.ROOT, "data", "rubriche")
OUT = "/tmp/corsa/schede-dossier.txt"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
TESTO = 1600              # caratteri di articolo per candidato: abbastanza per un dato, non un romanzo
NOMI = {"games": "GAMES", "spazio": "SCIENZA"}


def scarica(url):
    if not url or "news.google.com" in url:
        return ""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "it,en;q=0.8"})
        raw = urllib.request.urlopen(req, timeout=15).read(1_500_000)
    except Exception:
        return ""
    return raw.decode("utf-8", "replace")


def estratto(page):
    """I paragrafi veri dell'articolo: niente menu, script, didascalie corte."""
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form|figure)[^>]*>.*?</\1>", " ", page)
    paras = []
    for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", page):
        t = re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", " ", p))).strip()
        if len(t) >= 60 and not re.search(r"(?i)cookie|newsletter|subscribe|iscriviti|all rights reserved|advertis", t):
            paras.append(t)
    out, n = [], 0
    for t in paras:
        out.append(t)
        n += len(t)
        if n >= TESTO:
            break
    return " ".join(out)[:TESTO]


def run(day):
    src = os.path.join(DIR, f"{day}.json")
    if not os.path.exists(src):
        sys.exit(f"Nessuna rosa per il {day}: lancia prima rubriche.py.")
    d = C.load_json(src)
    cand = d.get("candidati") or {}
    jobs = [(k, c) for k in NOMI for c in cand.get(k) or []]
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        testi = list(ex.map(lambda j: estratto(scarica(j[1].get("link"))), jobs))
    L = [f"DOSSIER SCHEDE — {day}", "",
         "Per ogni candidato: id, gruppo o disciplina proposti dallo script, testata, ore, quante",
         "testate, titolo originale, sommario del feed, e l'estratto dell'articolo quando si apre.", ""]
    letti = 0
    for k, nome in NOMI.items():
        L.append(f"## {nome} — {len(cand.get(k) or [])} candidati (tetto in edizione: 10)")
        for (kk, c), t in zip(jobs, testi):
            if kk != k:
                continue
            letti += bool(t)
            meta = c.get("gruppo") or c.get("disciplina") or ""
            L.append(f"\n### [{c['id']}] {meta} · {c.get('source')} · {c.get('ore')}h · "
                     f"{c.get('testate', 1)} testate" + (" · italiano" if c.get("lingua") == "it" else ""))
            L.append(f"TITOLO: {c.get('orig') or c.get('title')}")
            if c.get("summary"):
                L.append(f"SOMMARIO: {c['summary'][:500]}")
            L.append(f"ARTICOLO: {t}" if t else "ARTICOLO: (non si apre: solo il sommario)")
            L.append(f"LINK: {c.get('link')}")
        L.append("")
    L += [f"Articoli aperti: {letti} su {len(jobs)}.", "", "<!-- fine lettura -->"]
    txt = "\n".join(L) + "\n"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(txt)
    print(f"dossier schede: {len(jobs)} candidati, {letti} articoli aperti -> {OUT}")
    return 0


def main():
    ap = argparse.ArgumentParser(description="il dossier delle schede Games e Scienza per Opus")
    ap.add_argument("date", nargs="?")
    a = ap.parse_args()
    return run(a.date or C.today())


if __name__ == "__main__":
    sys.exit(main())
