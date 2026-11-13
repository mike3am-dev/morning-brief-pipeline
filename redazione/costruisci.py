#!/usr/bin/env python3
"""
Compone la pagina della redazione di TMB.

La pagina è un file solo (redazione/app/redazione.html), ma si scrive a pezzi in
redazione/src/, in ordine di nome: così ogni pezzo resta piccolo. I pezzi .js stanno tutti
dentro la stessa funzione `avvia()`, quindi si vedono fra loro: non sono moduli.

Dove un pezzo contiene il segnaposto /*__STATO__*/ entra lo stato del giorno, quello che
redazione/stato.py ricava dai file della corsa (sola lettura).

    python3 redazione/costruisci.py               # con l'ultimo giorno che ha un'edizione
    python3 redazione/costruisci.py 2026-11-13    # con un giorno preciso
"""
import glob
import json
import os
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import stato as S  # noqa: E402


def main():
    giorno = sys.argv[1] if len(sys.argv) > 1 else (S.giorni_disponibili() or [None])[-1]
    pezzi = sorted(glob.glob(os.path.join(QUI, "src", "*")))
    testo = "".join(open(p, encoding="utf-8").read() for p in pezzi)
    if "/*__STATO__*/" in testo:
        if not giorno:
            sys.exit("Nessuna edizione in data/briefs.")
        dati = json.dumps(S.stato(giorno), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        testo = testo.replace("/*__STATO__*/", "const STATO = " + dati + ";")
    uscita = os.path.join(QUI, "app", "redazione.html")
    with open(uscita, "w", encoding="utf-8") as f:
        f.write(testo)
    print(f"{os.path.relpath(uscita, S.ROOT)}: {len(pezzi)} pezzi, {len(testo) // 1024} KB"
          + (f", stato del {giorno}" if "const STATO = " in testo else ""))


if __name__ == "__main__":
    main()
