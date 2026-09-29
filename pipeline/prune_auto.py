#!/usr/bin/env python3
"""Alleggerisce le edizioni vecchie ogni 15 giorni: images.py --prune 15 + push.py --all.
Ricorda l'ultima volta in data/prune.json, quindi si puo' lanciare ogni giorno."""
import json, os, subprocess, sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAMP = os.path.join(ROOT, "data", "prune.json")
OGNI, TIENI = 15, 15

def main():
    oggi = date.today()
    ultima = None
    if os.path.exists(STAMP):
        ultima = date.fromisoformat(json.load(open(STAMP))["ultima"])
    if ultima and (oggi - ultima).days < OGNI and "--force" not in sys.argv:
        print(f"Alleggerimento fatto il {ultima}: prossimo fra {OGNI - (oggi - ultima).days} giorni.")
        return
    for cmd in (["images.py", "--prune", str(TIENI)], ["push.py", "--all"]):
        r = subprocess.run([sys.executable, os.path.join(ROOT, "pipeline", cmd[0])] + cmd[1:])
        if r.returncode != 0:
            sys.exit(f"{cmd[0]} fallito: alleggerimento non registrato, si riprova alla prossima corsa.")
    json.dump({"ultima": oggi.isoformat()}, open(STAMP, "w"))
    print(f"Alleggerimento completato: immagini tenute per {TIENI} giorni.")

if __name__ == "__main__":
    main()
