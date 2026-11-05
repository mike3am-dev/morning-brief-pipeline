#!/usr/bin/env python3
"""
I giochi attesi: il registro dietro le barre «In caricamento» della scheda Games.

Mike, 5 novembre 2026, ha scelto fra le idee del reparto creativo le barre che si riempiono
dall'annuncio all'uscita, con una tacca rossa a ogni rinvio. Come per i numeri di facts.py,
ogni data annunciata e' una stima finche' il gioco non esce: il registro ne tiene la storia.

    data/games/attese.json   {id: {gioco, casa, piattaforme, annuncio, uscita, precisione,
                                   storia: [{il, uscita, fonte, link}], uscito, notizia}}

Chi lo aggiorna: l'agente `schede` (Opus) scrive in data/rubriche/<giorno>-scritte.json la chiave
`attese` quando un articolo letto annuncia o sposta una data; rubriche.merge chiama aggiorna(),
che aggiunge una tappa alla storia solo se la data cambia. Niente token in piu': l'agente ha gia'
l'articolo aperto.

    python3 pipeline/attese.py            il registro, in chiaro
"""

import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

PATH = os.path.join(C.ROOT, "data", "games", "attese.json")
PRECISIONI = {"giorno", "mese", "trimestre", "anno"}


def carica():
    if not os.path.exists(PATH):
        return {}
    try:
        return C.load_json(PATH)
    except ValueError:
        return {}


def aggiorna(day, voci):
    """Mette nel registro le date che l'agente ha letto oggi. Torna quante sono cambiate."""
    reg = carica()
    cambiate = 0
    for v in voci or []:
        gid = (v.get("id") or "").strip()
        uscita = (v.get("uscita") or "").strip()
        if not gid or not uscita or not v.get("gioco"):
            continue
        e = reg.get(gid) or {"gioco": v["gioco"], "storia": []}
        for k in ("gioco", "casa", "piattaforme", "annuncio", "notizia"):
            if v.get(k):
                e[k] = v[k]
        prec = v.get("precisione") if v.get("precisione") in PRECISIONI else e.get("precisione", "giorno")
        if e.get("uscita") != uscita:
            e["storia"] = (e.get("storia") or []) + [{"il": day, "uscita": uscita, "precisione": prec,
                                                     "fonte": v.get("fonte", ""), "link": v.get("link", "")}]
            e["uscita"], e["precisione"] = uscita, prec
            cambiate += 1
        if v.get("uscito"):
            e["uscito"] = True
        reg[gid] = e
    if cambiate or voci:
        os.makedirs(os.path.dirname(PATH), exist_ok=True)
        C.save_json(PATH, reg)
    return cambiate


def per_edizione(day):
    """Quello che l'app disegna: i giochi non ancora usciti a quella data, il piu' vicino prima."""
    out = []
    for gid, e in carica().items():
        if e.get("uscito") or not e.get("uscita") or e["uscita"][:10] < day:
            continue
        out.append(dict(e, id=gid))
    return sorted(out, key=lambda e: e["uscita"])[:6]


def main():
    for gid, e in sorted(carica().items(), key=lambda kv: kv[1].get("uscita", "")):
        tappe = " → ".join(s["uscita"] for s in e.get("storia") or [])
        print(f"{gid:24} {e.get('gioco','')[:28]:28} uscita {e.get('uscita')} ({e.get('precisione')})  storia: {tappe}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
