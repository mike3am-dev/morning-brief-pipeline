#!/usr/bin/env python3
"""
Raccolta feed RSS per Apple Morning Brief.

Scarica tutte le fonti configurate, filtra gli articoli delle ultime N ore,
normalizza i campi e scrive un file grezzo in data/raw/YYYY-MM-DD.json.

Uso:
    python3 pipeline/fetch.py [--hours 24]
"""

import argparse
import concurrent.futures as cf
import gzip
import html
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, "data", "raw")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402  (qui serve solo la normalizzazione degli URL)
import sources  # noqa: E402  (registro delle fonti, con la panchina)

# Le fonti da raccogliere oggi. L'elenco vero sta in data/sources.json: qui
# arrivano solo quelle attive, mentre quelle in panchina restano scritte la'
# con il loro motivo e vengono riprovate da feedcheck.py --retest.
FEEDS = sources.active()

# Il girone di ognuna, ricopiato su ogni articolo: in scrittura serve sapere
# se un pezzo arriva dalle testate Apple, dal fronte AI o dal banco, perche'
# finiscono in tre posti diversi dell'edizione.
TIERS = sources.tiers()

# Quanto silenzio e' normale, per girone. Una testata quotidiana che tace da
# un giorno e' un sintomo; un laboratorio AI che tace da tre no, e un canale
# YouTube pubblica quando il video e' pronto. Senza questa distinzione il
# campanello suonerebbe ogni mattina e smetteremmo di guardarlo.
# Apple Machine Learning pubblica un paper ogni tanto: tre settimane di
# silenzio sono la norma, come per le fonti primarie (5 novembre 2026).
QUIET = sources.PRIMARY | {"Apple Machine Learning"}
QUIET_TOLERANCE_H = 24 * 21
TIER_TOLERANCE_H = {"primaria": 24 * 21, "ai": 24 * 7, "banco": 24 * 12, "lab": 24 * 12,
                    "games": 24 * 5, "tech": 24 * 5, "spazio": 24 * 5}
DEFAULT_TOLERANCE_H = 30

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "dc": "http://purl.org/dc/elements/1.1/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "media": "http://search.yahoo.com/mrss/",
}

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"


def strip_html(text):
    if not text:
        return ""
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def download(name, url):
    try:
        out = subprocess.run(
            ["curl", "-sL", "--compressed", "--max-time", "30", "-A", UA, url],
            capture_output=True, timeout=45,
        )
        # curl che esce male ha comunque scritto qualcosa a volte (una pagina di
        # errore, mezza risposta): senza questo controllo quel mezzo scarico
        # arrivava al parser e la fonte risultava "parse-error" invece che
        # irraggiungibile, che e' un'altra diagnosi e un altro rimedio
        if out.returncode != 0:
            return name, url, b""
        return name, url, out.stdout
    except Exception:  # rete assente, timeout, ecc.
        return name, url, b""


# I feed corti. Un feed da 10 voci copre la finestra di 26 ore solo se la
# testata pubblica meno di 10 pezzi in 26 ore: iSpazio ne fa di piu', e la
# voce piu' vecchia del suo feed aveva 15 ore. Il resto del giorno spariva in
# silenzio (misurato il 5 novembre 2026: troncati BGR, MacRumors, The Verge,
# iSpazio, Tom's Hardware IT fra le testate Apple, piu' meta' dei gironi
# games/tech). Quando la pagina 1 non arriva all'inizio della finestra si
# chiede la pagina 2 (e poi la 3) nel modo di WordPress, ?paged=N: chi non
# lo capisce rimanda la stessa pagina, e non porta niente di nuovo. Qui gli
# indirizzi che WordPress da' solo in un'altra forma: iSpazio ignora ?paged
# sul feed RSS ma lo rispetta su quello Atom, che ha lo stesso ordine.
PAGINE = {
    "iSpazio": "https://www.ispazio.net/feed/atom/?paged={n}",
}
MAX_PAGINE = 3

# Chi non ha pagine: MacRumors da' sempre le stesse 20 voci (circa 21 ore) a
# qualunque indirizzo, MacRumors-All, -Front, ?paged=2. Ha pero' la mappa delle
# notizie per Google News, con titolo e ora degli ultimi due giorni (57 voci,
# 46 ore, misurato il 5 novembre 2026): quando il feed resta corto si prende il
# resto da li'. Il sommario manca, il titolo e l'ora bastano per selezionare.
MAPPE = {
    "MacRumors": "https://www.macrumors.com/sitemap/newsmap.xml.gz",
}


def sitemap_items(name, cutoff, now, seen):
    """Le voci della mappa delle notizie (sitemap-news) dentro la finestra e non
    gia' viste. Torna le voci e la data della piu' vecchia."""
    _, _, blob = download(name, MAPPE[name])
    if not blob:
        return [], None
    try:
        blob = gzip.decompress(blob)
    except OSError:
        pass  # curl --compressed l'ha gia' aperta, o non era compressa
    text = blob.decode("utf-8", "replace")
    out, oldest = [], None
    for block in re.findall(r"<url>(.*?)</url>", text, re.S):
        link = re.search(r"<loc>\s*(.*?)\s*</loc>", block, re.S)
        when = re.search(r"<news:publication_date>\s*(.*?)\s*</news:publication_date>", block, re.S)
        title = re.search(r"<news:title>\s*(.*?)\s*</news:title>", block, re.S)
        if not (link and when and title):
            continue
        dt = parse_date(when.group(1))
        if dt is None:
            continue
        oldest = dt if oldest is None or dt < oldest else oldest
        link = html.unescape(link.group(1))
        if dt < cutoff or dt > now or C.norm_url(link) in seen:
            continue
        out.append({
            "source": name, "tier": TIERS.get(name, "redazionale"),
            "title": strip_html(title.group(1).replace("<![CDATA[", "").replace("]]>", "")),
            "link": link, "date": dt.isoformat(),
            "age_hours": round((now - dt).total_seconds() / 3600, 1),
            "summary": "", "categories": [],
        })
    return out, oldest


def page_url(name, url, n):
    if name in PAGINE:
        return PAGINE[name].format(n=n)
    return url + ("&" if "?" in url else "?") + f"paged={n}"


def deepen(name, url, blob, cutoff, now):
    """Le pagine successive di un feed troncato. Torna le voci nuove (gia'
    filtrate per finestra), quante pagine in piu' sono servite, e se il feed
    resta troncato anche dopo."""
    extra, seen = [], set()
    items, _, _, oldest = parse_feed_full(name, blob, cutoff, now)
    seen.update(C.norm_url(i["link"]) for i in items)
    pagine = 0
    for n in range(2, MAX_PAGINE + 1):
        if oldest is None or oldest < cutoff:
            break
        _, _, more = download(name, page_url(name, url, n))
        if not more:
            break
        got, _, state, old2 = parse_feed_full(name, more, cutoff, now)
        nuovi = [i for i in got if C.norm_url(i["link"]) not in seen]
        if state != "ok" or not nuovi and (old2 is None or old2 >= oldest):
            break  # stessa pagina di prima: il sito non capisce ?paged
        pagine += 1
        extra.extend(nuovi)
        seen.update(C.norm_url(i["link"]) for i in nuovi)
        oldest = min(oldest, old2) if old2 else oldest
    if name in MAPPE and oldest is not None and oldest >= cutoff:
        nuovi, old3 = sitemap_items(name, cutoff, now, seen)
        if nuovi or old3:
            pagine += 1
            extra.extend(nuovi)
            oldest = min(oldest, old3) if old3 else oldest
    return extra, pagine, oldest is not None and oldest >= cutoff, oldest


def parse_date(raw):
    if not raw:
        return None
    # la "Z" finale e' UTC, ma fromisoformat non la digerisce prima di Python
    # 3.11 e su questo Mac gira la 3.9: senza questa riga i feed Atom che la
    # usano (Apple Newsroom, Daring Fireball) sembrano vuoti
    raw = re.sub(r"[Zz]$", "+00:00", raw.strip())
    for parser in (parsedate_to_datetime, datetime.fromisoformat):
        try:
            dt = parser(raw)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


def categories(item):
    """Le categorie di una voce, sia in forma RSS che Atom."""
    out = []
    for tag in ("category", "atom:category"):
        for c in item.findall(tag, NS):
            name = strip_html(c.text) or (c.get("term") or c.get("label") or "").strip()
            if name and name not in out:
                out.append(name)
    return out[:8]


def parse_feed(source, blob, cutoff, now):
    items, newest, state, _ = parse_feed_full(source, blob, cutoff, now)
    return items, newest, state


def parse_feed_full(source, blob, cutoff, now):
    """Come parse_feed, e in piu' la data della voce piu' vecchia del feed
    (dentro o fuori la finestra). Con cutoff None non filtra niente."""
    items, newest, oldest = [], None, None
    # qualche feed antepone una riga vuota o il BOM alla dichiarazione XML,
    # e il parser si rifiuta di partire (capita a Il Post)
    blob = blob.lstrip(b"\xef\xbb\xbf \t\r\n")
    # Google DeepMind manda il feed compresso senza dirlo nell'intestazione, e
    # --compressed non basta: dal 2 novembre 2026 risultava "parse-error"
    if blob[:2] == b"\x1f\x8b":
        try:
            blob = gzip.decompress(blob).lstrip(b"\xef\xbb\xbf \t\r\n")
        except Exception:
            pass
    try:
        root = ET.fromstring(blob)
    except Exception:
        # una pagina al posto del feed e' un muro (consenso, anti-bot, limite di
        # richieste), non un feed rotto: si cura in un altro modo
        head = blob[:600].lower()
        if b"<html" in head or b"<!doctype html" in head:
            return items, newest, "html-not-feed", oldest
        return items, newest, "parse-error", oldest

    entries = root.findall(".//item") or root.findall(".//atom:entry", NS)
    for it in entries:
        def field(*tags):
            """Il primo tag che ha davvero del testo.

            Fermarsi al primo tag *presente* non basta: parecchi feed mandano
            una <description> vuota accanto a un <content:encoded> pieno, e la
            notizia arrivava senza sommario."""
            for tag in tags:
                el = it.find(tag, NS)
                if el is not None and (el.text or "").strip():
                    return el.text.strip()
            return ""

        link = field("link")
        if not link:
            # Atom mette l'indirizzo nell'attributo href, e in una voce ce n'e'
            # piu' d'uno: "alternate" e' la pagina da leggere, gli altri sono i
            # commenti, la modifica, l'allegato. Senza la scelta si prendeva il
            # primo che capitava.
            links = it.findall("atom:link", NS)
            chosen = next((e for e in links if e.get("rel", "alternate") == "alternate"),
                          links[0] if links else None)
            link = chosen.get("href", "") if chosen is not None else ""

        dt = parse_date(field("pubDate", "published", "atom:published", "atom:updated", "dc:date"))
        if dt is None:
            continue
        if newest is None or dt > newest:
            newest = dt
        if oldest is None or dt < oldest:
            oldest = dt
        if cutoff is not None and dt < cutoff:
            continue

        # "atom:content" non e' un di piu': e' dove Apple Newsroom mette il
        # testo. Senza quella voce la fonte primaria — quella che chiude i
        # rumor invece di aprirne — arrivava in edizione con il sommario vuoto,
        # e in scrittura restava il solo titolo su cui decidere.
        summary = strip_html(field("description", "atom:summary",
                                   "content:encoded", "atom:content"))
        if not summary:
            # i feed video non hanno description: hanno media:description, che
            # e' meta' testo e meta' link affiliati. Tiene il primo paragrafo,
            # l'unico scritto per chi guarda.
            el = it.find("media:group/media:description", NS)
            if el is not None and el.text:
                summary = strip_html(el.text.split("\n\n")[0])

        items.append({
            "source": source,
            "tier": TIERS.get(source, "redazionale"),
            "title": strip_html(field("title", "atom:title")),
            "link": link,
            "date": dt.isoformat(),
            "age_hours": round((now - dt).total_seconds() / 3600, 1),
            "summary": summary[:900],
            # In RSS la categoria e' il testo del tag e sta senza namespace; in
            # Atom e' l'attributo "term" e sta dentro il namespace. Cercando
            # solo la prima forma, i feed Atom davano una fila di stringhe vuote.
            "categories": categories(it),
        })

    return items, newest, "ok" if entries else "empty", oldest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hours", type=float, default=26.0, help="finestra temporale in ore")
    ap.add_argument("--out", default=None, help="percorso file di output")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=args.hours)

    if not FEEDS:
        print("Nessuna fonte attiva in data/sources.json: la raccolta non ha "
              "niente da leggere.", file=sys.stderr)
        return 1

    with cf.ThreadPoolExecutor(max_workers=min(len(FEEDS), 24)) as pool:
        results = list(pool.map(lambda kv: download(*kv), FEEDS.items()))

    all_items, status, corti = [], {}, []
    for name, url, blob in results:
        if not blob:
            status[name] = {"state": "unreachable", "items": 0, "newest": None,
                            "stale_hours": None}
            continue
        items, newest, state, oldest = parse_feed_full(name, blob, cutoff, now)
        all_items.extend(items)
        status[name] = {
            "state": state,
            "items": len(items),
            "newest": newest.isoformat() if newest else None,
            "stale_hours": round((now - newest).total_seconds() / 3600, 1) if newest else None,
        }
        if state == "ok" and oldest is not None and oldest >= cutoff:
            corti.append((name, url, blob))

    # i feed che non arrivano all'inizio della finestra: pagina 2 e 3, in parallelo
    if corti:
        with cf.ThreadPoolExecutor(max_workers=min(len(corti), 12)) as pool:
            deep = list(pool.map(lambda c: (c[0],) + deepen(c[0], c[1], c[2], cutoff, now), corti))
        for name, extra, pagine, troncato, oldest in deep:
            all_items.extend(extra)
            st = status[name]
            st["items"] += len(extra)
            st["pagine"] = 1 + pagine
            st["troncato"] = troncato
            st["oldest_hours"] = round((now - oldest).total_seconds() / 3600, 1) if oldest else None

    # dedup per URL normalizzato. Alcuni feed si sovrappongono (TechCrunch e
    # TechCrunch AI danno lo stesso pezzo): a parita' di data vince il girone
    # piu' specifico, cosi' l'articolo resta marcato "ai" e non "larga".
    order = {"primaria": 0, "ai": 1, "lab": 1, "banco": 2, "games": 2, "tech": 2, "spazio": 2,
             "redazionale": 3, "larga": 4}
    all_items.sort(key=lambda x: order.get(x.get("tier"), 9))
    all_items.sort(key=lambda x: x["date"], reverse=True)

    seen, deduped = set(), []
    for it in all_items:
        key = C.norm_url(it["link"])
        if key and key in seen:
            continue
        seen.add(key)
        deduped.append(it)

    payload = {
        "fetched_at": now.isoformat(),
        "window_hours": args.hours,
        "feed_status": status,
        "count": len(deduped),
        "items": deduped,
    }

    os.makedirs(RAW_DIR, exist_ok=True)
    out = args.out or os.path.join(RAW_DIR, f"{now.astimezone().strftime('%Y-%m-%d')}.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)

    print(f"Scritti {len(deduped)} articoli in {out}")
    per_tier = Counter(i.get("tier", "?") for i in deduped)
    print("Per girone: " + ", ".join(
        f"{t} {per_tier[t]}" for t in ("primaria", "redazionale", "larga", "ai", "lab", "banco", "games", "tech", "spazio")
        if per_tier[t]))
    print("Per fonte:", dict(Counter(i["source"] for i in deduped)))
    for name, st in status.items():
        if st["items"]:
            continue
        stale = st.get("stale_hours")
        tol = TIER_TOLERANCE_H.get(TIERS.get(name), DEFAULT_TOLERANCE_H)
        if name in QUIET:
            tol = QUIET_TOLERANCE_H
        if st["state"] == "ok" and (stale or 0) < tol:
            continue
        # una fonte irraggiungibile non ha un "ultimo articolo": diceva
        # "ultimo articolo None h fa", che non e' una diagnosi
        quando = f"ultimo articolo {stale}h fa" if stale is not None else "nessuna data leggibile"
        print(f"  ATTENZIONE {name}: {st['state']}, {quando}")
    # i feed troncati: lo sono anche dopo le pagine in piu', quindi una parte
    # della finestra manca. Le testate Apple prima, perche' pesano di piu'.
    tronchi = sorted((n for n, st in status.items() if st.get("troncato")),
                     key=lambda n: (TIERS.get(n) not in ("primaria", "redazionale"), n))
    for name in tronchi:
        st = status[name]
        print(f"  feed troncato {name} ({TIERS.get(name)}): {st['items']} voci, la piu' vecchia "
              f"di {st['oldest_hours']}h su una finestra di {args.hours:g}h"
              + (f", lette {st['pagine']} pagine" if st.get("pagine", 1) > 1 else ""))
    letti = [n for n, st in status.items() if st.get("pagine", 1) > 1 and not st.get("troncato")]
    if letti:
        print("  Pagine in piu' lette, ora coprono la finestra: " + ", ".join(sorted(letti)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
