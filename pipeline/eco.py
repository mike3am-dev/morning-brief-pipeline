#!/usr/bin/env python3
"""
L'eco: quanto gira davvero una notizia, fuori dalle nostre sette testate.

Fino al 2 novembre 2026 "una testata sola" voleva dire "una sola fra quelle
che leggiamo". La modalita' telecamera di HomeView, data come notizia di The
Verge da una testata sola, alle 6 del mattino l'avevano gia' scritta una
dozzina di siti — HomeKit News per primo, poi iClarified, AppleInsider,
Digital Trends, Times of India — e a mezzogiorno erano trenta. Mike lo
sentiva: "non puo' essere una testata ad averlo detto".

Questo script chiede ai due aggregatori di notizie che si leggono senza
chiave, Google News (per il conteggio e l'ora) e Bing News (per gli
indirizzi diretti), chi ha scritto lo stesso fatto negli ultimi tre giorni.
Ne escono tre cose:

  - quante testate lo raccontano, nostre e no: il "quanto gira" dell'app;
  - chi l'ha dato per primo, con l'ora: spesso non e' la testata che leggiamo;
  - gli articoli da leggere per scrivere la notizia mettendo insieme piu'
    racconti, invece di riscriverne uno.

    python3 pipeline/eco.py                  le notizie Apple del grezzo di oggi,
                                             ordinate per quanto girano
    python3 pipeline/eco.py "titolo" ...     solo questi titoli (o link del grezzo)
    python3 pipeline/eco.py --json           stesso risultato in JSON
    python3 pipeline/eco.py --leggi "titolo o link" ...
                                             per le notizie scelte: scarica in un colpo
                                             il nostro articolo e quelli da leggere, e ne
                                             stampa il testo, notizia per notizia

I risultati restano in data/eco/<giorno>.json: verify.py li riusa senza
richiedere niente, e la seconda corsa dello stesso giorno non rifa' le domande.
"""

import argparse
import concurrent.futures as cf
import html
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qs, quote_plus, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C
from fetch import UA

ECO_DIR = os.path.join(C.ROOT, "data", "eco")

# quanti giorni indietro guardare: un fatto di tre giorni fa e' ancora lo stesso
# fatto, uno di una settimana fa e' un'altra notizia sullo stesso oggetto
DAYS = 3
# parole che stanno in un titolo su due e non distinguono un fatto dall'altro;
# messe nella ricerca la restringono senza renderla piu' precisa
WEAK = C.STOPWORDS | {
    "apple", "apples", "says", "said", "report", "reportedly", "rumor", "rumored",
    "leak", "leaked", "launch", "launches", "ships", "shipping", "coming", "soon",
    "first", "latest", "update", "updates", "heres", "theres", "just", "finally",
    "deal", "deals", "price", "review", "hands", "look", "best", "every",
    "secondo", "arriva", "arrivano", "ecco", "nuovo", "nuova", "nuovi", "ufficiale",
}
# sotto questa somiglianza col titolo di partenza un risultato e' un vicino di
# argomento (un altro pezzo su HomeView), non lo stesso fatto
SAME = 0.3
# i pezzi da leggere per scrivere la notizia: abbastanza da avere piu' racconti,
# non tanti da far durare la corsa un'ora
READ_MAX = 4


_DF = None


def df():
    """In quanti titoli della settimana compare ogni parola: le parole rare sono
    quelle che distinguono un fatto ("camera", "2027"), le comuni no ("features")."""
    global _DF
    if _DF is None:
        _DF = {}
        for path in C.raw_paths()[-7:]:
            for it in C.load_json(path).get("items", []):
                for w in set(re.findall(r"[a-z0-9]+", C.deaccent(it.get("title", "")).lower())):
                    _DF[w] = _DF.get(w, 0) + 1
    return _DF


def words(title, n=2):
    """Le parole con cui chiedere: le n piu' rare del titolo. Poche apposta —
    Google le vuole tutte, e una parola in piu' ("features") faceva sparire chi
    la notizia l'aveva data per primo con un titolo diverso. La precisione la
    fa poi same() sui titoli che tornano."""
    clean = re.sub(r"\s[-–—|]\s[^-–—|]+$", "", title or "")  # " - MacRumors"
    raw = re.findall(r"[A-Za-z0-9][A-Za-z0-9'’-]*[A-Za-z0-9]|[0-9]+", C.deaccent(clean))
    out = []
    for w in raw:
        low = re.sub(r"['’]s$", "", w.lower()).replace("’", "'")
        if low in WEAK or low in out or (len(low) < 4 and not any(c.isdigit() for c in low)):
            continue
        out.append(low)
    freq = df()
    keep = set(sorted(out, key=lambda w: (freq.get(re.sub(r"[^a-z0-9]", "", w), 0), -len(w)))[:n])
    return [w for w in out if w in keep]


def curl(url):
    try:
        out = subprocess.run(["curl", "-sL", "--compressed", "--max-time", "20", "-A", UA, url],
                             capture_output=True, timeout=30)
        return out.stdout.decode("utf-8", "replace") if out.returncode == 0 else ""
    except Exception:
        return ""


def tag(item, name):
    m = re.search(rf"<{name}[^>]*>(.*?)</{name}>", item, re.S)
    return html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", m.group(1))).strip() if m else ""


def when(raw):
    try:
        dt = parsedate_to_datetime(raw)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def when_iso(raw):
    """Un'ora ISO qualsiasi (con o senza fuso) confrontabile con le altre."""
    try:
        dt = datetime.fromisoformat(re.sub(r"[Zz]$", "+00:00", raw))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.max.replace(tzinfo=timezone.utc)


def google(query, lang):
    hl, gl = ("it", "IT") if lang == "it" else ("en-US", "US")
    url = (f"https://news.google.com/rss/search?q={quote_plus(query)}+when:{DAYS}d"
           f"&hl={hl}&gl={gl}&ceid={gl}:{hl.split('-')[0]}")
    out = []
    for it in re.findall(r"<item>(.*?)</item>", curl(url), re.S):
        source = tag(it, "source")
        title = re.sub(r"\s-\s[^-]+$", "", tag(it, "title"))
        out.append({"testata": source, "titolo": title, "ora": when(tag(it, "pubDate")), "url": None, "src": "g"})
    return out


def bing(query):
    url = f"https://www.bing.com/news/search?q={quote_plus(query)}&format=rss"
    out = []
    for it in re.findall(r"<item>(.*?)</item>", curl(url), re.S):
        link = tag(it, "link")
        link = parse_qs(urlparse(link).query).get("url", [link])[0]
        source = re.sub(r"\s+on MSN$", "", tag(it, "News:Source"))
        out.append({"testata": source, "titolo": tag(it, "title"), "ora": when(tag(it, "pubDate")), "url": link, "src": "b"})
    return out


def key(name):
    name = C.deaccent(name or "").lower().replace("the ", "")
    name = re.sub(r"\.(com|it|net|org|co\.uk|io|de|fr)$", "", name.strip())  # "macitynet.it"
    name = re.sub(r"\s(it|italia)$", "", name)                              # "Tom's Hardware IT"
    return re.sub(r"[^a-z0-9]", "", name)


# "Apple" sta in tutti i titoli: condividere Apple e HomeView fa di un tour del
# software e di una modalita' telecamera lo stesso fatto, ed e' falso
GENERIC = {C.stem(w) for w in ("apple", "apples", "apple's")}


APPLE = re.compile(
    r"\b(apple|iphone|ipad|mac|macbook|imac|watch ?os|apple watch|airpods|airtag|homepod|"
    r"homeview|vision pro|ios|ipados|macos|tvos|siri|safari|app store|icloud|tim cook|ternus|"
    r"cupertino|m[5-9]( pro| max)?|a[12][0-9])\b", re.I)


def same(a, b):
    """Lo stesso fatto, non lo stesso oggetto: almeno due parole in comune oltre
    al marchio, e una somiglianza che separa i fatti dai vicini di argomento."""
    ta, tb = C.tokens(a) - GENERIC, C.tokens(b) - GENERIC
    shared = ta & tb
    if len(shared) < 2:
        return False
    return (len(shared) / len(ta | tb) + len(shared) / min(len(ta), len(tb))) / 2 >= SAME


def coverage(title, until=None):
    """Chi ha scritto lo stesso fatto: una voce per testata, la piu' vecchia."""
    q = " ".join(words(title))
    if not q:
        return {"query": "", "testate": 0, "voci": []}
    until = until or datetime.now(timezone.utc)
    since = until - timedelta(days=DAYS)
    with cf.ThreadPoolExecutor(3) as ex:
        found = sum(ex.map(lambda f: f(), (lambda: google(q, "en"), lambda: google(q, "it"),
                                            lambda: bing(q))), [])
    by = {}
    for r in found:
        if not r["testata"] or not same(title, r["titolo"]):
            continue
        # una notizia Apple ripresa da chi non nomina niente di Apple non e' ripresa:
        # "come dormire col cambio dell'ora" non e' il bug dell'Apple Watch
        if APPLE.search(title) and not APPLE.search(r["titolo"]):
            continue
        if r["ora"] and not (since <= r["ora"] <= until):
            continue
        k = key(r["testata"])
        cur = by.get(k)
        if cur is None:
            by[k] = dict(r)
            continue
        # la stessa testata da due aggregatori: l'ora di Google (quella di Bing e'
        # l'ora locale spacciata per GMT, sbaglia di otto ore) e l'indirizzo di Bing
        if r["ora"] and (cur["ora"] is None or (r["src"] == "g" and (cur["src"] != "g" or r["ora"] < cur["ora"]))):
            cur["ora"], cur["src"] = r["ora"], r["src"]
        cur["url"] = cur["url"] or r["url"]
    voci = sorted(by.values(), key=lambda r: r["ora"] or until)
    for v in voci:
        v.pop("src", None)
        v["ora"] = v["ora"].astimezone(timezone.utc).isoformat() if v["ora"] else None
    return {"query": q, "testate": len(voci), "voci": voci}


def reading_list(cov, skip=()):
    """Gli articoli da leggere oltre al nostro: chi l'ha data per prima, poi gli
    altri in ordine d'arrivo, una testata ciascuno, solo con l'indirizzo diretto."""
    skip = {key(s) for s in skip}
    out = []
    for v in cov.get("voci", []):
        if v.get("url") and key(v["testata"]) not in skip:
            out.append({"testata": v["testata"], "url": v["url"], "titolo": v["titolo"]})
        if len(out) >= READ_MAX:
            break
    return out


# ------------------------------------------------------------------ cache

def cache_path(day):
    return os.path.join(ECO_DIR, f"{day}.json")


def load_cache(day):
    p = cache_path(day)
    return C.load_json(p) if os.path.exists(p) else {}


def lookup(titles, day=None, refresh=False, workers=6):
    """coverage() per piu' titoli insieme, con la cache del giorno."""
    day = day or C.today()
    cache = load_cache(day)
    todo = [t for t in dict.fromkeys(titles) if t and (refresh or t not in cache)]
    if todo:
        with cf.ThreadPoolExecutor(workers) as ex:
            for t, cov in zip(todo, ex.map(coverage, todo)):
                cache[t] = cov
        os.makedirs(ECO_DIR, exist_ok=True)
        C.save_json(cache_path(day), cache)
    return {t: cache.get(t) for t in titles}


# ------------------------------------------------------------------ lettura

# quanto testo stampare per articolo: abbastanza per dati e virgolette, non tanto
# da riempire la conversazione di chi scrive (il 7 ottobre 2026 e' costato caro)
TEXT_MAX = 2500


def text_of(url):
    page = curl(url)
    page = re.sub(r"(?is)<(script|style|nav|footer|aside|header|figure)[^>]*>.*?</\1>", " ", page)
    paras = re.findall(r"(?is)<(?:p|blockquote|h2|li)\b[^>]*>(.*?)</(?:p|blockquote|h2|li)>", page)
    out = []
    for p in paras:
        t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", p))).strip()
        if len(t) >= 60:
            out.append(t)
    return "\n".join(out)[:TEXT_MAX]


def read_stories(groups, covs):
    """Il nostro articolo piu' quelli da leggere, tutti in parallelo."""
    jobs = []
    for g in groups:
        cov = covs.get(g["title"]) or {}
        mine = [{"testata": s, "url": u} for s, u in zip(sorted(g["nostre"]), g["links"])]
        jobs.append((g, cov, mine + reading_list(cov, skip=g["nostre"])))
    urls = sorted({a["url"] for _, _, arts in jobs for a in arts})
    with cf.ThreadPoolExecutor(12) as ex:
        texts = dict(zip(urls, ex.map(text_of, urls)))
    return [(g, cov, [dict(a, testo=texts.get(a["url"], "")) for a in arts]) for g, cov, arts in jobs]


# ------------------------------------------------------------------ grezzo

def candidates(raw, everything=False):
    """Le notizie Apple del grezzo, una per fatto: il primo titolo di ogni
    gruppo di titoli che si somigliano, con le nostre testate che l'hanno data."""
    groups = []
    for it in raw:
        if it.get("tier") not in ("primaria", "redazionale"):
            continue
        # The Verge e BGR scrivono di tutto: Binance e Hubble non sono notizie Apple
        if not everything and not APPLE.search(f"{it.get('title', '')} {it.get('summary', '')[:300]}"):
            continue
        for g in groups:
            if same(it["title"], g["title"]):
                g["nostre"].add(it["source"])
                g["links"].append(it["link"])
                break
        else:
            groups.append({"title": it["title"], "nostre": {it["source"]}, "links": [it["link"]]})
    return groups


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("titles", nargs="*", help="titoli o link del grezzo (default: tutto il grezzo Apple)")
    ap.add_argument("--date")
    ap.add_argument("--refresh", action="store_true", help="rifa' le domande gia' in cache")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--leggi", action="store_true", help="scarica e stampa il testo degli articoli")
    ap.add_argument("--tutto", action="store_true", help="anche i pezzi non Apple delle testate redazionali")
    args = ap.parse_args()

    day = args.date or C.today()
    raw_path = os.path.join(C.RAW_DIR, f"{day}.json")
    raw = C.load_json(raw_path).get("items", []) if os.path.exists(raw_path) else []
    by_link = {C.norm_url(i["link"]): i for i in raw}

    if args.titles:
        groups = []
        for t in args.titles:
            it = by_link.get(C.norm_url(t)) if t.startswith("http") else None
            groups.append({"title": it["title"] if it else t,
                           "nostre": {it["source"]} if it else set(),
                           "links": [it["link"]] if it else []})
    else:
        groups = candidates(raw, args.tutto)

    covs = lookup([g["title"] for g in groups], day, args.refresh)

    if args.leggi:
        for g, cov, arts in read_stories(groups, covs):
            voci = cov.get("voci") or []
            p = voci[0] if voci else None
            print(C.rule(g["title"][:100]))
            print(f"{cov.get('testate', 0)} testate fuori dalle nostre"
                  + (f" · prima {p['testata']} {(p['ora'] or '')[:16].replace('T', ' ')} UTC" if p else ""))
            for a in arts:
                print(f"\n--- {a['testata']} · {a['url']}\n{a['testo'] or '(non si lascia leggere)'}")
            print()
        return 0
    rows = []
    for g in groups:
        cov = covs[g["title"]] or {"testate": 0, "voci": []}
        names = {key(n) for n in g["nostre"]} | {key(v["testata"]) for v in cov["voci"]}
        primo = cov["voci"][0] if cov["voci"] else None
        rows.append({"titolo": g["title"], "testate": len(names), "nostre": sorted(g["nostre"]),
                     "primo": {"testata": primo["testata"], "ora": primo["ora"]} if primo else None,
                     "query": cov.get("query"), "link": g["links"][:1],
                     "leggi": reading_list(cov, skip=g["nostre"])})
    rows.sort(key=lambda r: -r["testate"])

    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return 0

    print(C.rule(f"Quanto gira — {len(rows)} notizie Apple del grezzo, {day}"))
    for r in rows:
        p = r["primo"]
        first = f"prima {p['testata']} {p['ora'][5:16].replace('T', ' ')} UTC" if p and p["ora"] else ""
        print(f"\n{r['testate']:>3}  {r['titolo'][:90]}")
        print(f"     nostre: {', '.join(r['nostre']) or '—'}   {first}")
        for x in r["leggi"]:
            print(f"     leggi  {x['testata'][:22]:<22} {x['url']}")
    print("""
  Il numero e' quante testate diverse l'hanno scritta negli ultimi tre giorni,
  nostre comprese (Google News + Bing News). Una notizia che gira molto non puo'
  stare in fondo all'edizione; una che sta solo da noi va detta come tale.
  "leggi" sono gli articoli da aprire insieme al nostro per scriverla.""")
    return 0


if __name__ == "__main__":
    sys.exit(main())
