#!/usr/bin/env python3
"""La guardia del revisore (11 novembre 2026).

Il revisore (`.claude/agents/revisore.md`) rilegge la prosa scritta dal redattore e la corregge
secondo `docs/stile/linee-editoriali.md`. Può cambiare le parole, non i fatti. Questo script lo
tiene onesto:

    python3 pipeline/revisione.py prima  [giorno]   # fotografa i testi prima della revisione
    python3 pipeline/revisione.py controlla [giorno] # confronta, ripristina, stampa il rapporto
    python3 pipeline/revisione.py formule [giorno]   # solo le formule vietate rimaste

`controlla`:
- ripristina da solo i campi protetti se il revisore li ha toccati (id, link, fonti, citazioni
  delle voci, citazione, previsioni, numeri seguiti, novità);
- segnala ogni numero comparso in un testo riscritto che non c'era nella notizia di partenza:
  è il segno di un'aggiunta, e un'aggiunta il revisore non la può fare;
- segnala le formule da evitare rimaste (la lista è in `FORMULE`).
Esce sempre con 0: è un rapporto, non un cancello (il cancello resta lint.py).
"""
import copy
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOTO = Path("/tmp/corsa")

# I campi di prosa che il revisore può riscrivere.
NEWS_TESTO = ("title", "sintesi", "descrizione")
DEEP_TESTO = ("titolo", "punto", "sotto")
# I campi che non deve toccare: se cambiano, si rimettono come erano.
NEWS_PROTETTI = ("id", "rank", "link", "sources", "extra_links", "origine", "tag", "reliability",
                 "claim", "resolves", "facts", "novita", "thread", "reparto", "verifica")
DEEP_PROTETTI = ("numeri", "voci", "approfondire", "visivi")

FORMULE = [
    r"\bal banco\b", r"\bper chi sta al banco\b", r"una scelta che racconta",
    r"è qui che entra in gioco", r"non si tratta (semplicemente|solo) di",
    r"un aspetto interessante riguarda", r"la vera novità è", r"cambio di paradigma",
    r"da una parte[^.]{0,120}dall'altra", r"non solo[^.]{0,80}ma anche",
    r"spiega (la scelta )?meglio del comunicato", r"ed è la nostra lettura",
    r"\bcade\b", r"in due ondate",
]

NUM = re.compile(r"\d+(?:[.,]\d+)*")


def giorno(argv):
    return argv[0] if argv else dt.date.today().isoformat()


def percorso(g):
    return ROOT / "data" / "briefs" / f"{g}.json"


def carica(g):
    return json.loads(percorso(g).read_text())


def salva(g, d):
    percorso(g).write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n")


def testi(d):
    """Solo la prosa, senza immagini: è la fotografia che si confronta."""
    out = {"intro": d.get("intro"), "top3": d.get("top3"), "editoriale": d.get("editoriale"),
           "news": {}}
    for n in d.get("news", []):
        x = {k: n.get(k) for k in NEWS_TESTO + NEWS_PROTETTI}
        a = n.get("approfondimento")
        if a:
            x["approfondimento"] = {k: a.get(k) for k in DEEP_TESTO + DEEP_PROTETTI}
        out["news"][n.get("id")] = x
    return out


def piatto(v):
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    return json.dumps(v, ensure_ascii=False)


def numeri(s):
    return {m.group().replace(".", "").replace(",", "") for m in NUM.finditer(s or "")}


def prima(g):
    FOTO.mkdir(parents=True, exist_ok=True)
    f = FOTO / f"revisione-{g}.json"
    f.write_text(json.dumps(testi(carica(g)), ensure_ascii=False))
    n = len(carica(g).get("news", []))
    print(f"fotografia della prosa salvata: {f} ({n} notizie)")


def formule_in(d):
    trovate = []
    def guarda(dove, s):
        for pat in FORMULE:
            if re.search(pat, s or "", re.I):
                trovate.append((dove, pat))
    guarda("intro", piatto(d.get("intro")))
    guarda("editoriale", piatto(d.get("editoriale")))
    for n in d.get("news", []):
        for k in NEWS_TESTO:
            guarda(f"{n.get('id')}/{k}", piatto(n.get(k)))
        a = n.get("approfondimento") or {}
        for k in DEEP_TESTO:
            guarda(f"{n.get('id')}/approfondimento/{k}", piatto(a.get(k)))
    return trovate


def controlla(g):
    f = FOTO / f"revisione-{g}.json"
    if not f.exists():
        print("nessuna fotografia: lanciare prima `revisione.py prima` (salto il confronto)")
        return
    vecchio = json.loads(f.read_text())
    d = carica(g)
    ripristinati, cambiati, nuovi_num = [], 0, []

    for n in d.get("news", []):
        v = vecchio["news"].get(n.get("id"))
        if v is None:
            continue
        for k in NEWS_PROTETTI:
            if n.get(k) != v.get(k) and not (n.get(k) is None and v.get(k) is None):
                if v.get(k) is None:
                    n.pop(k, None)
                else:
                    n[k] = copy.deepcopy(v[k])
                ripristinati.append(f"{n['id']}/{k}")
        origine = " ".join(piatto(v.get(k)) for k in NEWS_TESTO)
        a, va = n.get("approfondimento"), v.get("approfondimento")
        if a and va:
            for k in DEEP_PROTETTI:
                if a.get(k) != va.get(k) and k != "visivi":
                    a[k] = copy.deepcopy(va[k])
                    ripristinati.append(f"{n['id']}/approfondimento/{k}")
            origine += " " + " ".join(piatto(va.get(k)) for k in DEEP_TESTO + ("numeri", "voci"))
        base = numeri(origine)
        for k in NEWS_TESTO:
            if piatto(n.get(k)) != piatto(v.get(k)):
                cambiati += 1
                for x in numeri(piatto(n.get(k))) - base:
                    nuovi_num.append(f"{n['id']}/{k}: {x}")
        if a and va:
            for k in DEEP_TESTO:
                if piatto(a.get(k)) != piatto(va.get(k)):
                    cambiati += 1
                    for x in numeri(piatto(a.get(k))) - base:
                        nuovi_num.append(f"{n['id']}/approfondimento/{k}: {x}")

    tutto_prima = " ".join(piatto(x) for x in vecchio["news"].values())
    for k in ("intro", "editoriale", "top3"):
        if piatto(d.get(k)) != piatto(vecchio.get(k)):
            cambiati += 1
            prima_k = numeri(piatto(vecchio.get(k)) + " " + tutto_prima)
            for x in numeri(piatto(d.get(k))) - prima_k:
                nuovi_num.append(f"{k}: {x}")
    # l'editoriale deve continuare a puntare alle stesse notizie
    if isinstance(vecchio.get("editoriale"), dict) and isinstance(d.get("editoriale"), dict):
        if d["editoriale"].get("notizie") != vecchio["editoriale"].get("notizie"):
            d["editoriale"]["notizie"] = vecchio["editoriale"].get("notizie")
            ripristinati.append("editoriale/notizie")

    if ripristinati:
        salva(g, d)
    print(f"revisione del {g}: {cambiati} testi riscritti")
    if ripristinati:
        print("RIPRISTINATI (il revisore non doveva toccarli):", ", ".join(ripristinati))
    if nuovi_num:
        print("NUMERI NUOVI nei testi riscritti (da controllare: il revisore non aggiunge fatti):")
        for x in nuovi_num:
            print("  ", x)
    rimaste = formule_in(d)
    if rimaste:
        print("FORMULE DA EVITARE rimaste:")
        for dove, pat in rimaste:
            print(f"   {dove}: /{pat}/")
    if not (ripristinati or nuovi_num or rimaste):
        print("niente da segnalare")


def main():
    cmd, resto = (sys.argv[1], sys.argv[2:]) if len(sys.argv) > 1 else ("controlla", [])
    g = giorno(resto)
    if cmd == "prima":
        prima(g)
    elif cmd == "controlla":
        controlla(g)
    elif cmd == "formule":
        for dove, pat in formule_in(carica(g)):
            print(f"{dove}: /{pat}/")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
