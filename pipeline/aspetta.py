#!/usr/bin/env python3
"""
Aspetta che un file sia pronto, senza guardarlo a vuoto.

Il 3 novembre 2026, mentre il sottoagente di lettura lavorava, la regia ha
controllato a mano una decina di volte (ls, ps, ListAgents, echo): ogni
controllo era un passo, e ogni passo rileggeva tutta la conversazione. Qui un
comando solo blocca finche' il file esiste e contiene il segno di fine che il
lettore scrive per ultimo, poi esce.

    python3 pipeline/aspetta.py /tmp/lettura-2026-11-05.md
    python3 pipeline/aspetta.py <file> --segno '<!-- fine lettura -->' --max 540

Esce 0 quando il segno c'e', 2 a tempo scaduto (e dice cosa manca: il file,
o il segno in un file che c'e'). Il tetto di default, 540 secondi, sta sotto i
10 minuti che Bash concede a un comando: oltre, si rilancia.
"""

import argparse
import os
import sys
import time

SEGNO = "<!-- fine lettura -->"


def main():
    ap = argparse.ArgumentParser(description="aspetta che un file contenga il segno di fine")
    ap.add_argument("file")
    ap.add_argument("--segno", default=SEGNO)
    ap.add_argument("--max", type=float, default=540, help="secondi al massimo (default 540)")
    ap.add_argument("--ogni", type=float, default=5, help="secondi fra un controllo e l'altro")
    args = ap.parse_args()

    t0 = time.time()
    while True:
        try:
            with open(args.file, encoding="utf-8", errors="replace") as fh:
                testo = fh.read()
        except OSError:
            testo = None
        if testo is not None and args.segno in testo:
            print(f"Pronto: {args.file} ({len(testo.encode('utf-8')) // 1024} KB) "
                  f"dopo {time.time() - t0:.0f}s.")
            return 0
        if time.time() - t0 >= args.max:
            if testo is None:
                print(f"Tempo scaduto dopo {args.max:.0f}s: {args.file} non esiste ancora.")
            else:
                print(f"Tempo scaduto dopo {args.max:.0f}s: {args.file} c'e' "
                      f"({len(testo.encode('utf-8')) // 1024} KB, modificato "
                      f"{time.time() - os.path.getmtime(args.file):.0f}s fa) "
                      f"ma senza il segno {args.segno!r}.")
            return 2
        time.sleep(min(args.ogni, max(0.1, args.max - (time.time() - t0))))


if __name__ == "__main__":
    sys.exit(main())
