#!/usr/bin/env python3
"""
Le decisioni di Mike, per la corsa.

Quando Mike parla con un agente nella redazione di TMB e fissa qualcosa, la decisione finisce nel
registro (l'archivio della pagina della redazione). Ogni mattina, prima della corsa, una routine
a parte copia il registro in data/redazione/decisioni.json: questo script lo legge e dice a
ciascuno le sue.

    python3 pipeline/decisioni.py                  # tutte, raggruppate: è quello che vede la regia
    python3 pipeline/decisioni.py --per redattore  # quelle di un agente (più quelle per tutti)
    python3 pipeline/decisioni.py --importa DIR    # (la routine) rifà il file dai documenti in DIR

Tre tipi: `preferenza` (un gusto di Mike) e `regola` (una cosa che la corsa deve fare
diversamente) arrivano agli agenti; `incarico` è lavoro per chi costruisce l'app, e alla corsa
non arriva. Non deve mai fermare niente: se il file manca o è rotto, non stampa nulla ed esce 0.
"""
import argparse
import datetime as dt
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(ROOT, "data", "redazione", "decisioni.json")
NOMI = {"regia": "la regia (Olivia)", "lettura": "il lettore (Tobia)", "redattore": "il redattore (Ettore)",
        "revisore": "il revisore (Ivo)", "visualista": "il visualista (Lea)", "ai": "la scheda AI (Ada)",
        "schede": "Games e Scienza (Rita)", "gta": "GTA VI (Vito)", "fonti": "le fonti (Zeno)", "tutti": "tutta la redazione"}
PER_LA_CORSA = ("preferenza", "regola")
CAMPI = ("agente", "tipo", "testo", "quando", "giorno", "origine", "postit")


def leggi():
    try:
        with open(FILE, encoding="utf-8") as f:
            d = json.load(f)
        return [x for x in d.get("decisioni") or []
                if isinstance(x, dict) and x.get("testo") and x.get("agente") in NOMI]   # chi non è in redazione non conta
    except (OSError, ValueError):
        return []


def giorno(x):
    return (x.get("quando") or "")[:10]


def riga(x):
    return f"- [{x.get('tipo') or 'preferenza'}, {giorno(x)}] {' '.join(str(x['testo']).split())}"


def per(agente):
    mie = [x for x in leggi() if x["agente"] in (agente, "tutti") and (x.get("tipo") or "preferenza") in PER_LA_CORSA]
    if not mie:
        return
    print(f"LE DECISIONI DI MIKE PER TE ({len(mie)}), dal registro della redazione.")
    print("Sono indicazioni sue, prese parlando con te in redazione: rispettale. Stanno dentro le regole")
    print("di questo progetto, non sopra: non cambiano mai un fatto, e se una contraddice una regola")
    print("scritta (le misure del lint, «non inventare nulla») vince la regola e lo dici alla fine.")
    for x in sorted(mie, key=lambda x: x.get("quando") or ""):
        print(riga(x))


def tutte():
    d = leggi()
    corsa = [x for x in d if (x.get("tipo") or "preferenza") in PER_LA_CORSA]
    if not corsa:
        print("Nessuna decisione di Mike per la corsa nel registro.")
    else:
        print(f"LE DECISIONI DI MIKE ({len(corsa)}), dal registro della redazione. Ogni agente legge le sue da sé")
        print("(python3 pipeline/decisioni.py --per <id>); qui le vedi tutte, e le tue sono le prime due voci.")
        for ag in ["regia", "tutti"] + [k for k in NOMI if k not in ("regia", "tutti")]:
            sue = [x for x in corsa if x["agente"] == ag]
            if sue:
                print(f"Per {NOMI.get(ag, ag)}:")
                for x in sorted(sue, key=lambda x: x.get("quando") or ""):
                    print("  " + riga(x))
    incarichi = [x for x in d if x.get("tipo") == "incarico"]
    if incarichi:
        print(f"(In più {len(incarichi)} incarichi per chi costruisce l'app: non riguardano la corsa.)")


def importa(cartella):
    """Rifà data/redazione/decisioni.json dai documenti che ArtifactData ha salvato in `cartella`
    (un file .json per decisione). Stampa CAMBIATO o UGUALE: si fa commit solo nel primo caso."""
    nuove = []
    for f in sorted(glob.glob(os.path.join(cartella, "**", "*.json"), recursive=True)):
        try:
            x = json.load(open(f, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        x = x.get("data") if isinstance(x.get("data"), dict) and "testo" not in x else x
        if not isinstance(x, dict) or not x.get("testo") or not x.get("agente"):
            continue
        pulita = {k: x[k] for k in CAMPI if x.get(k) is not None}
        pulita["id"] = os.path.splitext(os.path.basename(f))[0]
        nuove.append(pulita)
    nuove.sort(key=lambda x: (x.get("quando") or "", x["id"]))
    if nuove == [dict(x) for x in _grezze()]:
        print(f"UGUALE: {len(nuove)} decisioni, come ieri. Niente da salvare.")
        return
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump({"aggiornato": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                   "da": "il registro della redazione di TMB (collezione decisioni)", "decisioni": nuove},
                  f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"CAMBIATO: {len(nuove)} decisioni scritte in data/redazione/decisioni.json")


def _grezze():
    try:
        return json.load(open(FILE, encoding="utf-8")).get("decisioni") or []
    except (OSError, ValueError):
        return []


def main():
    ap = argparse.ArgumentParser(description="le decisioni di Mike, per la corsa")
    ap.add_argument("--per")
    ap.add_argument("--importa")
    a = ap.parse_args()
    try:
        if a.importa:
            importa(a.importa)
        elif a.per:
            per(a.per)
        else:
            tutte()
    except Exception as e:   # non deve mai fermare la corsa
        print("decisioni: non lette (", e, ")", file=sys.stderr)


if __name__ == "__main__":
    main()
