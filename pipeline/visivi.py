#!/usr/bin/env python3
"""
Il kit delle visualizzazioni: cosa c'e', quando serve, cosa e' uscito di
recente, cosa manca.

Il 1 ottobre 2026 Mike ha visto due "esploso" nella stessa edizione, uno su
HomePad dove non spiegava niente: "assicurati che ogni volta siano sempre
diverse e soprattutto adatte a spiegare quello che stai spiegando". Questo
script e' lo strumento del visualista (.claude/agents/visualista.md): prima di
scegliere, si guarda il catalogo con il suo "quando si' / quando no" e lo
storico; quando nessun tipo calza, si scrive una richiesta invece di forzarne
uno.

    python3 pipeline/visivi.py                 catalogo + ultimi 7 giorni + richieste aperte
    python3 pipeline/visivi.py storia --giorni 14
    python3 pipeline/visivi.py richiesta NOTIZIA "idea" "interazione" "dati"
"""

import argparse
import os
import sys
from collections import Counter
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

RICHIESTE = os.path.join(C.ROOT, "data", "visivi", "richieste.json")

# Il catalogo. "si" e "no" sono il cuore: un tipo usato fuori dal suo "si'"
# e' un ripiego, e un ripiego e' peggio di nessuna visualizzazione.
KIT = {
    "stime": ("le stime che cambiano nel tempo contro il dato vero",
              "prezzi, vendite, date previste che i rumor hanno rivisto; una serie con almeno due punti",
              "un numero solo; dati senza data"),
    "barre": ("grandezze a confronto, con le forchette",
              "quote di mercato, prezzi di piu' modelli, stime min-max di fonti diverse",
              "un confronto di due cose a parole; numeri non omogenei"),
    "resa": ("una linea di montaggio: pezzi buoni e scarti",
             "rese produttive, problemi di fabbrica, colli di bottiglia",
             "qualsiasi cosa non sia produzione"),
    "esploso": ("un oggetto fisico scomposto nei suoi strati veri",
                "componenti interni impilati descritti dalla fonte: lo stack di uno schermo, l'interno di un AirPods",
                "oggetti descritti per forma o design esterno (usa supporto o chiedi un tipo nuovo); software; servizi"),
    "piega": ("il Duo in 3D che si apre e si chiude",
              "pieghevoli: cerniera, schermi interno/esterno, colori",
              "qualunque altro prodotto"),
    "anno": ("l'anno come quadrante con gli eventi",
             "calendari di lancio, cadenze, stagionalita'",
             "una data sola"),
    "raggio": ("una citta' di puntini e un raggio che avvisa",
               "funzioni basate sulla posizione: avvisi, tracciamento, copertura",
               "tutto cio' che non e' geografico"),
    "flusso": ("dove passano i soldi, oggi contro un'ipotesi",
               "commissioni, intermediari, agenti che spostano il valore",
               "flussi senza soldi o senza un'alternativa da confrontare"),
    "onde": ("rumore, antirumore, quello che resta",
             "cancellazione del rumore, audio adattivo",
             "tutto il resto"),
    "densita": ("i pixel visti da vicino, con un cursore per avvicinarsi",
                "densita' dei pixel, sensori sotto lo schermo, PPI, tecnologie di display",
                "schermi descritti solo per dimensione (usa supporto o barre)"),
    "supporto": ("uno schermo sul suo braccio o supporto, inclinabile, con le varianti",
                 "dispositivi da banco o da parete: HomePad, iMac, Studio Display; forma e varianti dichiarate",
                 "telefoni e portatili; oggetti senza un supporto"),
    "roadmap": ("linee di prodotto per periodi, con i chip usciti, previsti e saltati",
                "calendari di prodotto, generazioni di chip, cosa arriva quando e cosa si salta",
                "un singolo lancio"),
    "catena": ("un processo passo per passo e la condizione che lo spezza",
               "attacchi informatici, exploit, procedure, filiere: con una difesa da accendere",
               "cose senza una sequenza vera"),
    "chat": ("una conversazione d'esempio che si scrive da sola",
             "agenti e assistenti che funzionano in una chat, nuove funzioni di Messaggi o Siri",
             "notizie di affari sugli stessi servizi (lì serve flusso o barre)"),
}


def recent(days):
    out = []
    lim = (date.today() - timedelta(days=days)).isoformat()
    for _, b in C.briefs():
        d = b.get("date", "")
        if d < lim:
            continue
        for n in b.get("news", []):
            for v in (n.get("approfondimento") or {}).get("visivi") or []:
                out.append((d, v.get("tipo"), n.get("id")))
    return sorted(out)


def richieste():
    return C.load_json(RICHIESTE) if os.path.exists(RICHIESTE) else []


def main():
    ap = argparse.ArgumentParser(description="il kit delle visualizzazioni")
    ap.add_argument("cosa", nargs="?", default="tutto", choices=["tutto", "storia", "richiesta"])
    ap.add_argument("args", nargs="*")
    ap.add_argument("--giorni", type=int, default=7)
    a = ap.parse_args()

    if a.cosa == "richiesta":
        if len(a.args) < 2:
            sys.exit('uso: visivi.py richiesta NOTIZIA "idea" ["interazione"] ["dati"]')
        r = richieste()
        r.append({"data": C.today(), "notizia": a.args[0], "idea": a.args[1],
                  "interazione": a.args[2] if len(a.args) > 2 else "",
                  "dati": a.args[3] if len(a.args) > 3 else "", "stato": "aperta"})
        os.makedirs(os.path.dirname(RICHIESTE), exist_ok=True)
        C.save_json(RICHIESTE, r)
        print(f"Richiesta registrata ({len([x for x in r if x.get('stato') == 'aperta'])} aperte).")
        return 0

    if a.cosa == "tutto":
        print(C.rule("Il kit — quando si', quando no"))
        for t, (cosa, si, no) in KIT.items():
            print(f"{t:10} {cosa}\n{'':10} SI': {si}\n{'':10} NO: {no}")
        print()

    rec = recent(a.giorni)
    print(C.rule(f"Usate negli ultimi {a.giorni} giorni"))
    if not rec:
        print("nessuna")
    for d, t, nid in rec:
        print(f"{d}  {t:10} {nid}")
    cnt = Counter(t for _, t, _ in rec)
    if cnt:
        print("\nPiu' usate: " + ", ".join(f"{t} {n}" for t, n in cnt.most_common(5)))
        print("Mai usate:  " + ", ".join(t for t in KIT if t not in cnt))
    print()

    aperte = [x for x in richieste() if x.get("stato") == "aperta"]
    if aperte and a.cosa == "tutto":
        print(C.rule("Richieste aperte (tipi da costruire nell'app)"))
        for x in aperte:
            print(f"{x['data']}  {x['notizia']}: {x['idea']}")
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
