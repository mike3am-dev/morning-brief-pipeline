#!/usr/bin/env python3
"""
La qualita' dell'edizione, misurata: le soglie che non si scendono e le misure
che non devono calare.

Il piano di risparmio dei token (docs/risparmio-token/decisione.md, sezione 4)
toglie passi alla regia, non al giornale. Per dimostrarlo ogni corsa si misura
contro il 3 novembre 2026, la prima edizione scritta dal redattore su Opus, che
fa da pavimento. La base non e' scritta a mano: si ricalcola ogni volta
dall'edizione del 3 novembre.

    python3 pipeline/qualita.py               l'edizione di oggi
    python3 pipeline/qualita.py 2026-11-05    un giorno preciso

Soglie dure (una mancata = esce 1: si corregge, poi si pubblica comunque):
  lint senza errori; 15-20 notizie; le prime cinque scritte da almeno tre
  testate quando ce ne sono almeno tre; origine, reparto e (sui RUMOR) claim
  al 100%; cinque approfondimenti, ciascuno con il testo e almeno due voci;
  AI fra 6 e 12 voci, LAB almeno un terzo, ogni LAB con foto e «prova»; radar
  pulito; ripescaggio al massimo 2 con ref valido; nessun link gia' uscito;
  citazione, editoriale (almeno due notizie) e prossimo (con le date di ieri
  ancora future).

Misure morbide (media mobile delle ultime tre edizioni, mai sotto l'80% della
base; gli avvisi del lint mai sopra la base di oltre un quarto): testate dalla
sesta notizia in giu', voci per approfondimento, notizie con filo, lunghezza
media della descrizione, avvisi del lint.

«Testate lette» sono quelle in `sources`: CLAUDE.md le definisce «le testate
lette davvero». `verifica.testate` dice quante ce n'erano in tutto: la soglia
chiede tre solo se tre ce n'erano.
"""

import argparse
import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import lint as L    # noqa: E402

BASE = "2026-11-03"
MOBILE = 3          # quante edizioni nella media mobile
SOGLIA = 0.8        # le misure morbide non scendono sotto l'80% della base
LAB = {"uso", "demo", "trucco", "sapevi"}


def carica(day):
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    return C.load_json(path) if os.path.exists(path) else None


def precedente(day):
    """L'edizione prima di questa (ieri, o l'ultima uscita)."""
    days = sorted(f[:-5] for f in os.listdir(C.BRIEFS_DIR)
                  if f.endswith(".json") and f[:-5] < day and len(f) == 15)
    return carica(days[-1]) if days else None


def collaudo(brief):
    """Il lint, senza la sua stampa: errori e avvisi come liste."""
    with contextlib.redirect_stdout(io.StringIO()):
        r = L.lint(brief, False)
    return r.errors, r.warnings


def lette(n):
    return len({s.strip() for s in n.get("sources") or [] if s and s.strip()})


def disponibili(n):
    v = n.get("verifica") or {}
    return max(v.get("testate") or 0, lette(n))


# ------------------------------------------------------------- soglie dure

def dure(brief, errori):
    """Elenco di (nome, ok, dettaglio)."""
    out = []
    news = sorted(brief.get("news") or [], key=lambda n: n.get("rank") or 99)
    add = lambda nome, ok, det="": out.append((nome, bool(ok), det))  # noqa: E731

    add("lint senza errori", not errori, f"{len(errori)} errori" if errori else "")
    add("15-20 notizie", 15 <= len(news) <= 20, f"{len(news)}")

    corte = [f"#{n.get('rank')} {lette(n)}/{min(3, disponibili(n))}" for n in news[:5]
             if lette(n) < min(3, disponibili(n))]
    add("prime 5 da ≥3 testate (se c'erano)", not corte,
        "lette/attese " + ", ".join(corte) if corte else
        ", ".join(str(lette(n)) for n in news[:5]))

    for campo in ("origine", "reparto"):
        manca = [n.get("id") for n in news if not n.get(campo)]
        add(f"{campo} 100%", not manca, ", ".join(manca[:4]))
    manca = [n.get("id") for n in news if n.get("tag") == "RUMOR" and not n.get("claim")]
    add("claim sui RUMOR 100%", not manca, ", ".join(manca[:4]))

    deep = [n for n in news[:5] if n.get("approfondimento")]
    povere = [n.get("id") for n in deep
              if not (n["approfondimento"].get("sotto")) or len(n["approfondimento"].get("voci") or []) < 2]
    add("5 approfondimenti con testo e ≥2 voci", len(deep) == 5 and not povere,
        f"{len(deep)} approfondimenti" + (f"; scarsi: {', '.join(povere)}" if povere else ""))

    ai = brief.get("ai") or []
    lab = [a for a in ai if (a.get("kind") or "").lower() in LAB]
    add("AI fra 6 e 12 voci", 6 <= len(ai) <= 12, f"{len(ai)}")
    add("LAB ≥1/3 dell'AI", ai and len(lab) * 3 >= len(ai), f"{len(lab)}/{len(ai)}")
    senza = [a.get("id") for a in lab if not a.get("image") or not (a.get("prova") or "").strip()]
    add("LAB con foto e prova", not senza, ", ".join(senza[:4]))

    radar = [e for e in errori if e[0] == "radar"]
    add("radar pulito", not radar, "; ".join(m for _, m in radar)[:200])
    recap = brief.get("recap") or []
    rerr = [e for e in errori if e[0] == "recap"]
    add("recap ≤2 con ref valido", len(recap) <= 2 and not rerr,
        f"{len(recap)} voci" + (f"; {rerr[0][1][:120]}" if rerr else ""))
    usciti = [e for e in errori if "gia' uscita" in e[1] or "gia' pubblicata" in e[1]]
    add("nessun link già uscito", not usciti, "; ".join(f"{w}" for w, _ in usciti)[:200])

    add("citazione", (brief.get("citazione") or {}).get("testo"), "")
    ed = brief.get("editoriale") or {}
    add("editoriale con ≥2 notizie", ed.get("testo") and len(ed.get("notizie") or []) >= 2,
        f"{len(ed.get('notizie') or [])} notizie" if ed else "manca")
    pross = brief.get("prossimo") or []
    oggi = brief.get("date") or C.today()
    ieri = precedente(oggi)
    attese = [p for p in (ieri or {}).get("prossimo") or [] if (p.get("data") or "") >= oggi]
    chiavi = {((p.get("titolo") or "").lower(), p.get("data")) for p in pross}
    perse = [f"{p.get('titolo')} {p.get('data')}" for p in attese
             if ((p.get("titolo") or "").lower(), p.get("data")) not in chiavi]
    add("prossimo, con le date di ieri ancora future", pross and not perse,
        f"{len(pross)} voci" + (f"; perse: {', '.join(perse)}" if perse else ""))
    return out


# ----------------------------------------------------------- misure morbide

MORBIDE = [
    # nome, funzione, verso (+1: piu' e' meglio, -1: meno e' meglio)
    ("testate lette dalla 6ª (media)", lambda b, w: media([lette(n) for n in rank_da(b, 6)]), +1),
    ("voci per approfondimento", lambda b, w: media(
        [len((n.get("approfondimento") or {}).get("voci") or []) for n in rank_da(b, 1)[:5]]), +1),
    ("notizie con filo (%)", lambda b, w: 100 * media(
        [1 if n.get("thread") else 0 for n in b.get("news") or []]), +1),
    ("lunghezza media descrizione", lambda b, w: media(
        [len(n.get("descrizione") or "") for n in b.get("news") or []]), +1),
    ("avvisi del lint", lambda b, w: len(w), -1),
]


def media(xs):
    return sum(xs) / len(xs) if xs else 0.0


def rank_da(brief, r):
    return [n for n in sorted(brief.get("news") or [], key=lambda n: n.get("rank") or 99)
            if (n.get("rank") or 99) >= r]


def misure(brief):
    _, avvisi = collaudo(brief)
    return [f(brief, avvisi) for _, f, _ in MORBIDE]


def main():
    ap = argparse.ArgumentParser(description="soglie dure e misure morbide dell'edizione")
    ap.add_argument("date", nargs="?", default=None)
    args = ap.parse_args()
    day = args.date or C.today()
    brief = carica(day)
    if not brief:
        print(f"Nessuna edizione per il {day}.")
        return 1
    base = carica(BASE)

    errori, avvisi = collaudo(brief)
    print(f"Qualità dell'edizione del {day}")
    mancate = 0
    for nome, ok, det in dure(brief, errori):
        mancate += not ok
        print(f"  {'ok  ' if ok else 'MANCA'} {nome}" + (f" — {det}" if det else ""))

    # media mobile: questa e le due edizioni prima
    giorni = sorted(f[:-5] for f in os.listdir(C.BRIEFS_DIR)
                    if f.endswith(".json") and len(f) == 15 and f[:-5] <= day)[-MOBILE:]
    serie = [misure(carica(g)) for g in giorni]
    oggi = serie[-1]
    mob = [media([s[i] for s in serie]) for i in range(len(MORBIDE))]
    vb = misure(base) if base else None
    print(f"\n  misure morbide: oggi · media {len(giorni)} edizioni · base {BASE} (soglia)")
    sotto = 0
    for i, (nome, _, verso) in enumerate(MORBIDE):
        if vb is None:
            print(f"    {nome}: {oggi[i]:.1f} · {mob[i]:.1f}")
            continue
        soglia = vb[i] * SOGLIA if verso > 0 else (vb[i] / SOGLIA if vb[i] else 0)
        ok = mob[i] >= soglia if verso > 0 else mob[i] <= max(soglia, 1)
        sotto += not ok
        print(f"    {'ok  ' if ok else 'SOTTO'} {nome}: {oggi[i]:.1f} · {mob[i]:.1f} · "
              f"{vb[i]:.1f} ({'≥' if verso > 0 else '≤'}{soglia:.1f})")

    # per chi guarda: le sezioni minori, contate
    conta = {k: len(brief.get(k) or []) for k in ("banco", "social", "radar", "recap")}
    visivi = sum(1 for n in (brief.get("news") or [])[:5]
                 if (n.get("approfondimento") or {}).get("visivi"))
    print("\n  " + " · ".join(f"{k} {v}" for k, v in conta.items())
          + f" · visivi {visivi}/5 · avvisi lint {len(avvisi)}")
    print(f"\n{'Tutte le soglie dure rispettate' if not mancate else f'{mancate} SOGLIE DURE MANCATE'}"
          f"; {sotto} misure morbide sotto la soglia.")
    return 1 if mancate else 0


if __name__ == "__main__":
    sys.exit(main())
