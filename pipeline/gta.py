#!/usr/bin/env python3
"""
GTA VI: il dossier del giorno per l'agente `gta`.

Dal 5 novembre 2026 GTA VI ha una sezione sua, in cima alla scheda Games, coi colori di
Vice City (Mike: «voglio ogni giorno ciò che scovi in rete, specialmente da Reddit, X, forum
utenti… tutto quello che gli utenti scovano, ufficiale e non, chicche, curiosità — la radio
di The Weeknd per esempio»). Non la scrive uno script: la scrive un agente su Opus
(.claude/agents/gta.md), con la qualità come priorità. Questo script gli prepara la materia.

    python3 pipeline/gta.py              il dossier di oggi  ->  data/gta/<giorno>.json + testo
    python3 pipeline/gta.py --dry        stampa e basta

Cosa raccoglie, tutto senza chiave:

* **Reddit** — r/GTA6: il top del giorno, il top della settimana (le scoperte che continuano a
  girare), e le novità. Le richieste vanno in fila, con una pausa, perche' Reddit risponde 429
  a quelle ravvicinate. Dentro ogni post cerca i link in uscita: un post su X, un video, un
  articolo.
* **X** — non si raschia: si aprono i post che Reddit e i tuoi appunti (data/social/manual.md)
  linkano, con fxtwitter (autore, testo, mi piace, visualizzazioni).
* **YouTube di Rockstar Games** — il feed Atom pubblico, ultimi sette giorni.
* **Le notizie** che rubriche.py ha gia' trovato (data/rubriche/<giorno>.json, chiave `gta`).
* **Lo storico** — cosa e' gia' uscito nei quattordici giorni prima, per non ripetersi.

I forum (GTAForums) stanno dietro Cloudflare e da script non si aprono: li cerca l'agente
dal web. Lo stesso vale per tutto quello che qui non si trova.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
from fetch import parse_date, strip_html

DIR = os.path.join(C.ROOT, "data", "gta")
CONFIG = os.path.join(DIR, "config.json")
UA = "morning-brief/1.0 (rassegna stampa personale; contatto via GitHub)"
ATOM = {"atom": "http://www.w3.org/2005/Atom", "media": "http://search.yahoo.com/mrss/",
        "yt": "http://www.youtube.com/xml/schemas/2015"}
PAUSA = 12                       # secondi fra una richiesta a Reddit e la successiva
MANUAL = os.path.join(C.ROOT, "data", "social", "manual.md")
GTA_RX = re.compile(r"\bGTA\b|grand theft auto|rockstar|vice city|\bleonida\b|\blucia\b|\bjason\b|take-two", re.I)

# Una voce sicura sulla data di uscita non c'e' finche' Rockstar non la ripete: l'agente la
# verifica ogni giorno e la scrive in brief.gta.uscita; qui sta l'ultimo valore noto.
CONFIG_DEFAULT = {"uscita": "2026-11-19", "verificata_il": None,
                  "nota": "IGN, 5 novembre 2026: «due settimane prima dell'uscita». L'agente la conferma da Rockstar."}


def config():
    if os.path.exists(CONFIG):
        try:
            return C.load_json(CONFIG)
        except ValueError:
            pass
    return dict(CONFIG_DEFAULT)


def curl(url, timeout=25):
    return subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                          capture_output=True).stdout


def feed(url, retries=1):
    """Un feed Atom come lista di <entry>; ritenta una volta su un 429 (blob vuoto o HTML)."""
    for attempt in range(retries + 1):
        blob = curl(url)
        if blob:
            try:
                return ET.fromstring(blob.lstrip(b"\xef\xbb\xbf \t\r\n")).findall("atom:entry", ATOM)
            except ET.ParseError:
                pass
        if attempt < retries:
            time.sleep(PAUSA + 3)
    return None


def entry_text(e, tag):
    el = e.find(tag, ATOM)
    return (el.text or "").strip() if el is not None else ""


LINK_RX = re.compile(r'href="(https?://[^"]+)"')
IMG_RX = re.compile(r'<img[^>]+src="(https?://[^"]+)"')


def reddit(sub, ordine, cutoff, tenere, solo_gta=False):
    o, _, t = ordine.partition(":")
    url = f"https://www.reddit.com/r/{sub}/{o}/.rss" + (f"?t={t}" if t else "")
    entries = feed(url)
    if entries is None:
        print(f"  Reddit r/{sub} {ordine}: nessuna risposta (limite di frequenza?)", file=sys.stderr)
        return []
    out = []
    for i, e in enumerate(entries):
        title = strip_html(entry_text(e, "atom:title"))
        if solo_gta and not GTA_RX.search(title):
            continue
        when = parse_date(entry_text(e, "atom:updated") or entry_text(e, "atom:published"))
        if when and when < cutoff:
            continue
        link_el = e.find("atom:link", ATOM)
        link = link_el.get("href", "") if link_el is not None else ""
        html = entry_text(e, "atom:content")
        outs = [u for u in LINK_RX.findall(html)
                if "reddit.com" not in u and "redd.it" not in u and "redditmedia" not in u]
        imgs = IMG_RX.findall(html)
        cat = e.find("atom:category", ATOM)
        flair = ""
        thumb = e.find("media:thumbnail", ATOM)
        out.append({
            "fonte": f"Reddit r/{sub}", "ordine": ordine, "rank": i + 1, "title": title, "link": link,
            "autore": entry_text(e, "atom:author/atom:name"),
            "quando": when.isoformat() if when else None,
            "esterni": outs[:4], "immagine": (thumb.get("url") if thumb is not None else (imgs[0] if imgs else None)),
            "testo": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))[:420].strip(),
        })
        if len(out) >= tenere:
            break
    return out


def youtube(cutoff):
    entries = feed("https://www.youtube.com/feeds/videos.xml?user=RockstarGames", retries=0)
    out = []
    for e in entries or []:
        when = parse_date(entry_text(e, "atom:published"))
        if when and when < cutoff:
            continue
        link_el = e.find("atom:link", ATOM)
        thumb = e.find("media:group/media:thumbnail", ATOM)
        out.append({"fonte": "YouTube Rockstar Games", "title": entry_text(e, "atom:title"),
                    "link": link_el.get("href", "") if link_el is not None else "",
                    "quando": when.isoformat() if when else None,
                    "immagine": thumb.get("url") if thumb is not None else None})
    return out


def manuali():
    """Le righe di data/social/manual.md che parlano di GTA."""
    if not os.path.exists(MANUAL):
        return []
    out = []
    with open(MANUAL, encoding="utf-8") as fh:
        for line in fh:
            if GTA_RX.search(line) and re.search(r"https?://", line):
                out.append({"fonte": "appunto di Mike", "riga": line.strip()[:300],
                            "link": (re.search(r"https?://\S+", line) or [None])[0]})
    return out


def post_x(candidati):
    """Apre i post su X linkati nei post di Reddit e negli appunti."""
    visti, out = set(), []
    for c in candidati:
        for u in c.get("esterni", []) + ([c["link"]] if c.get("link") else []):
            m = C.X_STATUS.search(u or "")
            if not m or m.group(2) in visti:
                continue
            visti.add(m.group(2))
            x = C.xpost(u)
            if x:
                x["da"] = c.get("title") or c.get("riga")
                x["link"] = u
                out.append(x)
            if len(out) >= 12:
                return out
    return out


def storico(day, giorni=14):
    """Quello che e' gia' uscito nella sezione negli ultimi giorni: titoli e link."""
    out = []
    lim = (datetime.fromisoformat(day) - timedelta(days=giorni)).date().isoformat()
    for name in sorted(os.listdir(C.BRIEFS_DIR)):
        m = re.match(r"^(\d{4}-\d{2}-\d{2})\.json$", name)
        if not m or m.group(1) >= day or m.group(1) < lim:
            continue
        try:
            b = C.load_json(os.path.join(C.BRIEFS_DIR, name))
        except ValueError:
            continue
        for v in (b.get("gta") or {}).get("voci") or []:
            out.append({"data": m.group(1), "title": v.get("title"), "link": v.get("link"), "tipo": v.get("tipo")})
    return out


def notizie(day):
    p = os.path.join(C.ROOT, "data", "rubriche", f"{day}.json")
    if not os.path.exists(p):
        return []
    try:
        return [{k: v for k, v in it.items() if k in ("title", "orig", "nota", "source", "link", "ore", "testate")}
                for it in C.load_json(p).get("gta", [])]
    except ValueError:
        return []


def testo(d):
    """Il dossier in chiaro, per l'agente: tutto numerato, niente immagini incorporate."""
    L = [f"DOSSIER GTA VI — {d['giorno']}  (uscita nota: {d['config'].get('uscita')}, "
         f"verificata il {d['config'].get('verificata_il')})", ""]
    L.append(f"## GIA' USCITO negli ultimi 14 giorni ({len(d['storico'])}) — non ripetere")
    for v in d["storico"]:
        L.append(f"- {v['data']} [{v.get('tipo')}] {v.get('title')} <{v.get('link')}>")
    L += ["", f"## NOTIZIE gia' trovate da rubriche.py ({len(d['notizie'])})"]
    for n in d["notizie"]:
        L.append(f"- {n.get('source')} ({n.get('testate', 1)} testate, {n.get('ore')}h) {n.get('orig') or n.get('title')} <{n.get('link')}>")
    L += ["", f"## REDDIT ({len(d['reddit'])})"]
    for r in d["reddit"]:
        L.append(f"- [{r['fonte']} {r['ordine']} #{r['rank']}] {r['title']} <{r['link']}>"
                 + (f"  esterni: {', '.join(r['esterni'])}" if r["esterni"] else "")
                 + (f"\n    {r['testo'][:260]}" if r["testo"] and len(r["testo"]) > 40 else ""))
    L += ["", f"## POST SU X linkati ({len(d['x'])})"]
    for x in d["x"]:
        L.append(f"- @{x.get('author')} ({x.get('likes', '?')} mi piace, {x.get('views', '?')} visualizzazioni): "
                 f"{(x.get('text') or '')[:260]} <{x['link']}>")
    L += ["", f"## YOUTUBE Rockstar, ultimi 7 giorni ({len(d['youtube'])})"]
    for y in d["youtube"]:
        L.append(f"- {y['quando'][:10] if y.get('quando') else '?'} {y['title']} <{y['link']}>")
    L += ["", f"## APPUNTI DI MIKE su GTA ({len(d['manuali'])}) — hanno la precedenza"]
    for m in d["manuali"]:
        L.append(f"- {m['riga']}")
    L += ["", "## NON QUI: forum (GTAForums, dietro Cloudflare), ricerca su X, Reddit oltre il top.",
          "   Cercali dal web: sono quello che questo dossier non vede.", "",
          "<!-- fine lettura -->"]          # aspetta.py blocca finche' non c'e'
    return "\n".join(L) + "\n"


def run(day, dry=False):
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=40)
    wk = now - timedelta(days=8)
    red = []
    # in fila e con una pausa: Reddit risponde 429 a chi insiste
    for n, (sub, ordine, tenere, solo) in enumerate([("GTA6", "top:day", 25, False),
                                                      ("GTA6", "top:week", 12, False),
                                                      ("GTA6", "new", 25, False),
                                                      ("GTA", "top:day", 20, True)]):
        if n:
            time.sleep(PAUSA)
        red += reddit(sub, ordine, wk if ordine == "top:week" else cutoff, tenere, solo)
    # lo stesso post puo' stare in due liste: si tiene la posizione migliore
    visti, unici = set(), []
    for r in red:
        if r["link"] in visti:
            continue
        visti.add(r["link"])
        unici.append(r)
    man = manuali()
    d = {"giorno": day, "config": config(), "reddit": unici, "manuali": man,
         "x": post_x(unici + man), "youtube": youtube(now - timedelta(days=7)),
         "notizie": notizie(day), "storico": storico(day)}
    txt = testo(d)
    print(txt)
    if dry:
        return d
    os.makedirs(DIR, exist_ok=True)
    C.save_json(os.path.join(DIR, f"{day}.json"), d)
    out = os.path.join("/tmp", "corsa")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "gta-dossier.txt"), "w", encoding="utf-8") as fh:
        fh.write(txt)
    return d


def main():
    ap = argparse.ArgumentParser(description="il dossier di GTA VI per l'agente")
    ap.add_argument("date", nargs="?")
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    run(a.date or C.today(), a.dry)
    return 0


if __name__ == "__main__":
    sys.exit(main())
