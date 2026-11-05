#!/usr/bin/env python3
"""
Solo i campi che servono, di un'edizione o di un file della raccolta.

Il 3 novembre 2026 la regia ha stampato due volte un'edizione intera per
guardarne tre campi: 43 e 58 KB entrati nella conversazione e ripagati a ogni
passo successivo. Qui si chiede quello che serve e si vede solo quello. I
campi con le immagini e l'audio (image, hero, audio) non si stampano mai: al
loro posto c'e' solo la misura, che basta a dire se la foto c'e'.

    python3 pipeline/campi.py 2026-11-05 news id,rank,title,origine
    python3 pipeline/campi.py data/briefs/2026-11-05.json news approfondimento.titolo,verifica.testate
    python3 pipeline/campi.py 2026-11-05 news --id homeview-prezzo
    python3 pipeline/campi.py data/raw/2026-11-05.json items source,title,link --tier redazionale
    python3 pipeline/campi.py data/lab/2026-11-05.json items title,signal,link
    python3 pipeline/campi.py 2026-11-05 .           le sezioni del file e quante voci hanno
    python3 pipeline/campi.py 2026-11-05 news        i campi presenti e id/titolo di ogni voce

Il primo argomento e' un percorso, o una data (allora l'edizione di quel giorno).
La sezione e' una chiave di primo livello (news, ai, radar, items...). I campi si
separano con la virgola e possono scendere con il punto (verifica.testate).
--id filtra per id; sulle voci senza id (il grezzo) cerca nel titolo e nel link.
"""

import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PESANTI = {"image", "hero", "audio"}


def pulisci(v):
    """Lo stesso valore senza i campi pesanti, a qualunque profondita'."""
    if isinstance(v, dict):
        return {k: (peso(x) if k in PESANTI else pulisci(x)) for k, x in v.items()}
    if isinstance(v, list):
        return [pulisci(x) for x in v]
    return v


def peso(x):
    if not x:
        return None
    return f"<{len(str(x)) // 1024} KB>"


def prendi(voce, campo):
    cur = voce
    for parte in campo.split("."):
        if isinstance(cur, dict):
            if parte in PESANTI:
                return peso(cur.get(parte))
            cur = cur.get(parte)
        elif isinstance(cur, list) and parte.isdigit() and int(parte) < len(cur):
            cur = cur[int(parte)]
        elif isinstance(cur, list):
            # news.approfondimento.voci.chi: il campo di ogni elemento
            cur = [x.get(parte) if isinstance(x, dict) else None for x in cur]
        else:
            return None
    return pulisci(cur)


def mostra(v, tronca):
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    if tronca and len(s) > tronca:
        s = s[:tronca] + f"… (+{len(s) - tronca})"
    return s


def apri(arg):
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", arg):
        arg = os.path.join(ROOT, "data", "briefs", f"{arg}.json")
    with open(arg, encoding="utf-8") as fh:
        return arg, json.load(fh)


def main():
    ap = argparse.ArgumentParser(description="solo i campi chiesti di un file JSON della pipeline")
    ap.add_argument("file", help="percorso, o una data per l'edizione di quel giorno")
    ap.add_argument("sezione", nargs="?", default=".", help="news, ai, radar, items... ('.' = panoramica)")
    ap.add_argument("campi", nargs="?", default="", help="campi separati da virgola")
    ap.add_argument("--id", help="solo la voce con questo id (o titolo/link che lo contiene)")
    ap.add_argument("--tier", help="sul grezzo: solo un girone")
    ap.add_argument("--fonte", help="solo le voci di questa fonte (source)")
    ap.add_argument("--tronca", type=int, default=0, help="taglia ogni valore a N caratteri")
    args = ap.parse_args()

    try:
        path, data = apri(args.file)
    except (OSError, ValueError) as e:
        print(f"Non riesco ad aprire {args.file}: {e}")
        return 1

    if args.sezione == ".":
        if not isinstance(data, dict):
            print(f"{path}: un elenco di {len(data)} voci")
            return 0
        for k, v in data.items():
            if k in PESANTI:
                print(f"{k}: {peso(v)}")
            elif isinstance(v, list):
                print(f"{k}: {len(v)} voci")
            elif isinstance(v, dict):
                print(f"{k}: {{{', '.join(list(v)[:8])}{', …' if len(v) > 8 else ''}}}")
            else:
                print(f"{k}: {mostra(v, 120)}")
        return 0

    sez = data.get(args.sezione) if isinstance(data, dict) else data
    if sez is None:
        print(f"{args.sezione}: non c'è in {path}. Sezioni: {', '.join(data) if isinstance(data, dict) else '-'}")
        return 1
    if isinstance(sez, dict) and not any(isinstance(v, dict) for v in sez.values()):
        sez = [sez]  # un oggetto solo (citazione, editoriale, borsa)
    elif isinstance(sez, dict):
        sez = [dict(v, _chiave=k) if isinstance(v, dict) else {"_chiave": k, "valore": v}
               for k, v in sez.items()]
    if not isinstance(sez, list):
        print(mostra(pulisci(sez), args.tronca))
        return 0

    voci = [v for v in sez if isinstance(v, dict)]
    if args.tier:
        voci = [v for v in voci if v.get("tier") == args.tier]
    if args.fonte:
        voci = [v for v in voci if args.fonte.lower() in str(v.get("source", "")).lower()]
    if args.id:
        esatte = [v for v in voci if v.get("id") == args.id]
        voci = esatte or [v for v in voci if args.id.lower() in
                          (str(v.get("title", "")) + " " + str(v.get("link", ""))).lower()]

    campi = [c.strip() for c in args.campi.split(",") if c.strip()]
    if not campi:
        if args.id and len(voci) == 1:
            campi = list(voci[0])  # una voce sola: tutta, senza i pesanti
        else:
            presenti = {}
            for v in voci:
                for k in v:
                    presenti[k] = presenti.get(k, 0) + 1
            print(f"{len(voci)} voci. Campi: " + ", ".join(f"{k} ({n})" for k, n in presenti.items()))
            campi = [c for c in ("rank", "id", "title") if c in presenti] or list(presenti)[:2]

    for v in voci:
        if len(campi) == 1:
            print(mostra(prendi(v, campi[0]), args.tronca))
            continue
        parti = [f"{c}: {mostra(prendi(v, c), args.tronca)}" for c in campi]
        print(" | ".join(parti))
    return 0


if __name__ == "__main__":
    sys.exit(main())
