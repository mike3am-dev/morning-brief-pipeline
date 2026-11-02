#!/usr/bin/env python3
"""Gli accenti scritti con l'apostrofo: «meta'», «gia'», «perche'».

La corsa del 2 novembre 2026 ha scritto l'edizione con gli apostrofi al posto
delle lettere accentate, e in apertura si leggeva «nella prima meta' del
2027». In italiano e' un errore che salta all'occhio. Questo script li trova e,
con --fix, li corregge: «metà», «già», «perché», «è».

Distingue l'accento dalle altre cose che usano lo stesso segno: l'elisione
(«dell'Air», fra due lettere) e le virgolette semplici («'Switch to Safari'»,
dove l'apostrofo dopo la «i» chiude una citazione aperta prima). Non tocca i
link, le immagini, l'audio.

    python3 pipeline/accenti.py            controlla l'edizione di oggi
    python3 pipeline/accenti.py --fix      la corregge
    python3 pipeline/accenti.py 2026-11-02 --fix
"""
import argparse
import os
import re
import sys

import common as C

LETTER = re.compile(r"[A-Za-zÀ-ÿ]")
ACUTE = {"perche", "poiche", "benche", "affinche", "finche", "purche", "nonche",
         "sicche", "giacche", "cosicche", "anziche", "fuorche", "ne", "se"}
GRAVE = {"a": "à", "e": "è", "i": "ì", "o": "ò", "u": "ù",
         "A": "À", "E": "È", "I": "Ì", "O": "Ò", "U": "Ù"}
SKIP = {"link", "url", "image", "hero", "audio", "src", "id", "key", "slug"}


def fix_text(s):
    """Ritorna (testo corretto, quante correzioni)."""
    out, n, quote_open = [], 0, False
    for i, ch in enumerate(s):
        if ch != "'":
            out.append(ch)
            continue
        prev = s[i - 1] if i else ""
        nxt = s[i + 1] if i + 1 < len(s) else ""
        before, after = bool(LETTER.match(prev)), bool(LETTER.match(nxt))
        if before and after:            # elisione: dell'Air
            out.append(ch)
        elif not before and after:      # apre una citazione
            quote_open = True
            out.append(ch)
        elif before and not after:
            if quote_open:              # chiude la citazione
                quote_open = False
                out.append(ch)
            elif prev in GRAVE:         # l'accento
                m = re.search(r"([A-Za-zÀ-ÿ]+)$", "".join(out))
                word = (m.group(1) if m else prev).lower()
                acc = "é" if (word in ACUTE or word.endswith("che")) and prev in "eE" else GRAVE[prev]
                if prev == "E" and acc == "é":
                    acc = "É"
                out[-1] = acc
                n += 1
            else:
                out.append(ch)
        else:
            out.append(ch)
    return "".join(out), n


def walk(obj, fix):
    """Percorre l'edizione; ritorna il numero di accenti trovati (e corretti, con fix)."""
    total = 0
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in SKIP:
                continue
            if isinstance(v, str):
                new, n = fix_text(v)
                total += n
                if fix and n:
                    obj[k] = new
            else:
                total += walk(v, fix)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                new, n = fix_text(v)
                total += n
                if fix and n:
                    obj[i] = new
            else:
                total += walk(v, fix)
    return total


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?")
    ap.add_argument("--fix", action="store_true", help="corregge l'edizione")
    args = ap.parse_args()
    day = args.date or C.today()
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not os.path.exists(path):
        print(f"Nessuna edizione per il {day}.", file=sys.stderr)
        return 1
    brief = C.load_json(path)
    n = walk(brief, args.fix)
    if args.fix and n:
        C.save_json(path, brief)
        print(f"{n} accenti corretti nell'edizione del {day}.")
    elif n:
        print(f"{n} accenti scritti con l'apostrofo nell'edizione del {day}: lancia con --fix.")
        return 1
    else:
        print(f"Nessun accento con l'apostrofo nell'edizione del {day}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
