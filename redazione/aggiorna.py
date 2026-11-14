#!/usr/bin/env python3
"""
Prepara lo stato da scrivere nell'archivio della redazione (documento stato/corrente).

La pagina della redazione, quando si apre e mentre resta aperta, guarda in quel documento: se lì
c'è uno stato più nuovo del suo, si aggiorna. Quindi «aggiornare la redazione» vuol dire scrivere
lì lo stato dell'ultima edizione uscita. Questo script lo compone, controlla che sia completo e,
se gli si passa la copia che c'è adesso nell'archivio, dice se serve riscriverla.

    python3 redazione/aggiorna.py [--archivio FILE]

Stampa una riga sola, che comincia con una di queste parole:

    SCRIVI redazione/stato/2026-11-14.json   va scritto: edizione nuova, o stesso giorno con novità
    UGUALE                                   nell'archivio c'è già: non si fa niente
    INCOMPLETO …                             l'edizione non è ancora uscita del tutto: non si scrive

Si legge soltanto: dei file della corsa non tocca niente.
"""
import argparse
import json
import os
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import stato as S  # noqa: E402


def manca(s):
    """Cosa manca perché lo stato sia completo (lo stesso controllo che fa la pagina, `valido`)."""
    m = []
    if not s.get("corsa"):
        m.append("la corsa non ha ancora chiuso il suo conto (data/corse.json)")
    if not s.get("lavagna"):
        m.append("l'edizione non c'è")
    if not s.get("schermo"):
        m.append("manca lo schermo (top3, intro)")
    if not s.get("macchine"):
        m.append("mancano le macchine")
    if not s.get("agenti"):
        m.append("mancano gli agenti")
    return m


def senza_ora(s):
    return {k: v for k, v in (s or {}).items() if k != "scritto"}


def main():
    ap = argparse.ArgumentParser(description="lo stato da scrivere nell'archivio della redazione")
    ap.add_argument("--archivio", help="la copia di stato/corrente letta dall'archivio (un file JSON)")
    a = ap.parse_args()

    giorni = S.giorni_disponibili()
    if not giorni:
        print("INCOMPLETO nessuna edizione in data/briefs")
        return
    g = giorni[-1]
    s = S.stato(g)
    m = manca(s)
    if m:
        print(f"INCOMPLETO l'edizione del {g}: " + "; ".join(m))
        return

    vecchio = None
    if a.archivio:
        try:
            with open(a.archivio, encoding="utf-8") as f:
                vecchio = json.load(f)
            if isinstance(vecchio.get("data"), dict) and "giorno" not in vecchio:
                vecchio = vecchio["data"]
        except (OSError, ValueError):
            vecchio = None
    if vecchio and (vecchio.get("giorno") or "") > g:
        print(f"UGUALE nell'archivio c'è già un giorno più avanti ({vecchio.get('giorno')})")
        return
    if vecchio and senza_ora(vecchio) == senza_ora(json.loads(json.dumps(s))):
        print(f"UGUALE l'edizione del {g} è già nell'archivio")
        return

    os.makedirs(S.OUT, exist_ok=True)
    f = os.path.join(S.OUT, g + ".json")
    with open(f, "w", encoding="utf-8") as h:
        json.dump(s, h, ensure_ascii=False, indent=1)
        h.write("\n")
    print(f"SCRIVI {os.path.relpath(f, S.ROOT)}  (edizione del {g}, {os.path.getsize(f) // 1024} KB)")


if __name__ == "__main__":
    main()
