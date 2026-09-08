#!/usr/bin/env python3
"""
Arricchisce un'edizione con le immagini degli articoli.

Legge l'og:image di ogni notizia, la ridimensiona e la incorpora nel JSON
come data URI. Incorporare invece di linkare serve a due cose: le immagini
funzionano offline, e la copia su Artifact le mostra (la sua CSP blocca
qualunque richiesta verso l'esterno).

    python3 pipeline/images.py                    edizione di oggi
    python3 pipeline/images.py 2026-08-08         una data precisa
    python3 pipeline/images.py --prune 60         toglie le immagini dalle
                                                  edizioni più vecchie di 60 giorni
"""

import argparse
import base64
import concurrent.futures as cf
import glob
import io
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIEFS = os.path.join(ROOT, "data", "briefs")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402  (serve a x_image() per leggere i post via fxtwitter)

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# quante notizie ricevono la miniatura, e con che ingombro.
# 480px perche' sul telefono la foto occupa tutta la colonna (~341 punti):
# a 300px si vedeva la sgranatura. Sono ~25 KB l'una invece di ~10.
THUMBS = 8
THUMB_PX, THUMB_Q = 480, 60
HERO_PX, HERO_Q = 880, 70

OG_PATTERNS = (
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
    r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',
)


def fetch(url, timeout=25):
    try:
        out = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                             capture_output=True, timeout=timeout + 10)
        return out.stdout
    except Exception:
        return b""


# Le immagini "di servizio" che un sito manda quando non ha niente da mostrare:
# il logo di X sulle pagine che non rende ai bot, il cartello di Reddit.
GENERIC = re.compile(r"abs\.twimg\.com/rweb/ssr/default|redditstatic\.com/.*(logo|icon)", re.I)


def x_image(page_url):
    """La miniatura di un post su X, via common.xpost (fxtwitter)."""
    post = C.xpost(page_url)
    return post["thumb"] if post and post.get("thumb") else None


def find_image_url(page_url):
    # YouTube: la miniatura ha un indirizzo fisso, niente da cercare
    m = re.search(r"youtube\.com/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,})", page_url)
    if m:
        return f"https://i.ytimg.com/vi/{m.group(1)}/hqdefault.jpg"
    if re.search(r"https?://(www\.)?(x|twitter)\.com/", page_url):
        return x_image(page_url)
    # Reddit: al browser non da' l'og:image, ma l'anteprima ufficiale del post
    # ha un indirizzo fisso e risponde con un JPEG (e' quella che X e Slack
    # mostrano). Per i post con immagine e' il risultato stesso.
    m = re.search(r"reddit\.com/r/[^/]+/comments/([a-z0-9]+)", page_url)
    if m:
        return f"https://share.redd.it/preview/post/{m.group(1)}"
    html = fetch(page_url).decode("utf-8", "replace")
    for pat in OG_PATTERNS:
        m = re.search(pat, html, re.I)
        if m:
            src = m.group(1).strip()
            if src.startswith("//"):
                src = "https:" + src
            if GENERIC.search(src):
                return None
            return src if src.startswith("http") else None
    return None


def encode(raw, width, quality):
    """Ridimensiona, ritaglia in 16:9 e restituisce un data URI JPEG."""
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return None
    img = img.convert("RGB")

    target = 16 / 9
    w, h = img.size
    if w / h > target:                       # troppo larga: taglio ai lati
        new_w = int(h * target)
        img = img.crop(((w - new_w) // 2, 0, (w + new_w) // 2, h))
    else:                                    # troppo alta: taglio sopra e sotto
        new_h = int(w / target)
        top = int((h - new_h) * 0.35)        # leggermente più alto del centro:
        img = img.crop((0, top, w, top + new_h))   # nelle foto il soggetto sta in alto

    if img.width > width:
        img = img.resize((width, int(width / target)), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def harvest(job):
    idx, news = job
    src = find_image_url(news.get("link", ""))
    if not src:
        return idx, None, None
    raw = fetch(src)
    if not raw:
        return idx, None, None
    thumb = encode(raw, THUMB_PX, THUMB_Q)
    hero = encode(raw, HERO_PX, HERO_Q) if idx == 0 else None
    return idx, thumb, hero


def enrich(path, refresh=False):
    with open(path, encoding="utf-8") as fh:
        brief = json.load(fh)

    jobs = [(i, n) for i, n in enumerate(brief.get("news", [])[:THUMBS])
            if refresh or not n.get("image")]
    # Nella sezione AI la foto va solo alle voci LAB (uso, demo, trucco,
    # sapevi): li' e' il risultato — la citta' in 3D, il render — ed e' lei
    # che fa aprire la voce. Sulla cronaca sarebbe il logo del laboratorio,
    # e un logo non dice niente: meglio niente.
    LAB = {"uso", "demo", "trucco", "sapevi"}
    ai_jobs = [(i, a) for i, a in enumerate(brief.get("ai", []))
               if (a.get("kind") or "").lower() in LAB and (refresh or not a.get("image"))]
    for a in brief.get("ai", []):
        if (a.get("kind") or "").lower() not in LAB:
            a.pop("image", None)
    if not jobs and not ai_jobs:
        print("Immagini già presenti, niente da fare.")
        return 0

    got = 0
    with cf.ThreadPoolExecutor(max_workers=6) as pool:
        for idx, thumb, hero in pool.map(harvest, jobs):
            news = brief["news"][idx]
            # in --refresh una fonte muta non deve cancellare quel che c'era
            if thumb:
                news["image"] = thumb
                got += 1
            if hero:
                news["hero"] = hero
            print(f"  {news['id']:22} {'immagine acquisita' if thumb else 'nessuna immagine'}")
        for idx, thumb, _ in pool.map(harvest, [(1000 + i, a) for i, a in ai_jobs]):
            a = brief["ai"][idx - 1000]
            if thumb:
                a["image"] = thumb
                got += 1
            print(f"  ai/{a['id']:19} {'immagine acquisita' if thumb else 'nessuna immagine'}")

    with open(path, "w", encoding="utf-8") as fh:
        json.dump(brief, fh, ensure_ascii=False, indent=1)

    size = os.path.getsize(path) // 1024
    print(f"{got} immagini su {len(jobs) + len(ai_jobs)} voci · edizione ora {size} KB")
    return 0


def prune(days):
    limit = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    touched = 0
    for path in sorted(glob.glob(os.path.join(BRIEFS, "*.json"))):
        day = os.path.basename(path)[:-5]
        if day >= limit:
            continue
        with open(path, encoding="utf-8") as fh:
            brief = json.load(fh)
        before = os.path.getsize(path)
        stripped = False
        for n in brief.get("news", []):
            for k in ("image", "hero"):
                if n.pop(k, None) is not None:
                    stripped = True
        if stripped:
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(brief, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
            print(f"  {day}: {before // 1024} KB -> {os.path.getsize(path) // 1024} KB")
            touched += 1
    print(f"Alleggerite {touched} edizioni oltre i {days} giorni.")
    print("Ricaricale su Supabase con: python3 pipeline/push.py --all")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("date", nargs="?", help="data dell'edizione (YYYY-MM-DD)")
    ap.add_argument("--prune", type=int, metavar="GIORNI",
                    help="toglie le immagini dalle edizioni più vecchie di N giorni")
    ap.add_argument("--refresh", action="store_true",
                    help="riscarica anche le immagini già presenti (dopo un cambio di formato)")
    ap.add_argument("--all", action="store_true",
                    help="lavora su tutte le edizioni dell'archivio, non solo su una")
    args = ap.parse_args()

    # "is not None" e non la verita' del numero: --prune 0 vuol dire "togli le
    # immagini a tutto l'archivio", ed e' un comando legittimo che il controllo
    # sulla verita' buttava via in silenzio
    if args.prune is not None:
        return prune(args.prune)

    if args.all:
        for name in sorted(os.listdir(BRIEFS)):
            if name.endswith(".json"):
                print(name[:-5])
                enrich(os.path.join(BRIEFS, name), refresh=args.refresh)
        return 0

    day = args.date or datetime.now().strftime("%Y-%m-%d")
    path = os.path.join(BRIEFS, f"{day}.json")
    if not os.path.exists(path):
        sys.exit(f"Nessuna edizione per il {day}.")
    return enrich(path, refresh=args.refresh)


if __name__ == "__main__":
    sys.exit(main())
