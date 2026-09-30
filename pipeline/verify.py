#!/usr/bin/env python3
"""
La verifica: chi l'ha detto davvero, e quanti l'hanno solo ripreso.

Cinque siti che scrivono la stessa cosa sembrano cinque conferme. Quasi mai lo
sono: se 9to5Mac, MacRumors, Macitynet, iSpazio e BGR citano tutti Gurman, la
fonte e' una — Bloomberg — e le altre quattro sono rimbalzi. Contare le testate
gonfia proprio i rumor, che sono le notizie che rimbalzano di piu'.

Questo script, per ogni notizia dell'edizione, risale la catena:

  1. mette insieme gli articoli che raccontano quel fatto — il link, gli
     extra_links, e quelli del grezzo di oggi che gli somigliano;
  2. apre ogni articolo e cerca da dove dice di averlo preso: i link a una
     testata d'origine (bloomberg.com, theinformation.com, apple.com…) e le
     attribuzioni scritte ("secondo Mark Gurman", "according to The Elec");
  3. conta le **origini indipendenti**, separa le **riprese**, e segnala le
     testate che non dicono da dove viene.

Il risultato si scrive dentro la notizia, nel campo `verifica`:

    "verifica": {"testate": 5, "origini": ["Bloomberg"], "ufficiale": false,
                 "riprese": 4, "senza_fonte": 1, "il": "2026-09-30"}

Poi stampa le notizie dove tag e affidabilita' non tornano con quello che ha
trovato: un CONFERMATO che ha dietro una fonte sola e nessuna parola di Apple,
un RUMOR che invece ha gia' la pagina ufficiale. Decide chi scrive: lo script
dice cosa ha visto, non cambia i tag.

    python3 pipeline/verify.py                  l'edizione di oggi
    python3 pipeline/verify.py 2026-09-30       una data precisa
    python3 pipeline/verify.py --dry            stampa e basta, non scrive
    python3 pipeline/verify.py --refresh        riapre anche gli articoli gia' letti

Gli articoli letti restano in data/verify/cache.json per un mese: la seconda
corsa dello stesso giorno non riapre niente.
"""

import argparse
import concurrent.futures as cf
import html
import os
import re
import subprocess
import sys
from urllib.parse import urljoin, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C
from fetch import UA

VERIFY_DIR = os.path.join(C.ROOT, "data", "verify")
CACHE_FILE = os.path.join(VERIFY_DIR, "cache.json")
CACHE_DAYS = 30

# quanti articoli aprire per notizia: oltre, sono rimbalzi di rimbalzi
MAX_PER_STORY = 7
# sopra questa somiglianza un articolo del grezzo racconta lo stesso fatto
SAME = 0.50

# ---------------------------------------------------------------------------
# Le testate d'origine: chi fa notizia invece di riprenderla. Un link verso uno
# di questi domini dentro un articolo e' quasi sempre la citazione della fonte.
# "Apple" e i documenti pubblici valgono come ufficiali.
# ---------------------------------------------------------------------------
ORIGIN_DOMAINS = {
    "bloomberg.com": "Bloomberg",
    "theinformation.com": "The Information",
    "wsj.com": "Wall Street Journal",
    "ft.com": "Financial Times",
    "nytimes.com": "New York Times",
    "reuters.com": "Reuters",
    "cnbc.com": "CNBC",
    "nikkei.com": "Nikkei",
    "asia.nikkei.com": "Nikkei",
    "digitimes.com": "Digitimes",
    "digitimes.com.tw": "Digitimes",
    "etnews.com": "ETNews",
    "thelec.kr": "The Elec",
    "thelec.net": "The Elec",
    "counterpointresearch.com": "Counterpoint",
    "idc.com": "IDC",
    "canalys.com": "Canalys",
    "9to5mac.com": "9to5Mac",
    "macrumors.com": "MacRumors",
    "theverge.com": "The Verge",
    "appleinsider.com": "AppleInsider",
    "macworld.com": "Macworld",
    "techcrunch.com": "TechCrunch",
    "arstechnica.com": "Ars Technica",
    "apple.com": "Apple",
    "developer.apple.com": "Apple",
    "sec.gov": "documenti SEC",
    "courtlistener.com": "atti giudiziari",
    "ec.europa.eu": "Commissione europea",
}

# Chi fa esclusive: se la catena porta a uno di questi e basta, la notizia e'
# la sua parola — autorevole quanto si vuole, ma non ancora confermata. Le
# agenzie (Reuters, CNBC, NYT) qui non ci sono: raccontano anche fatti
# avvenuti, e un loro pezzo su un lancio e' cronaca, non un'indiscrezione.
SCOOP = {"Bloomberg", "The Information", "Wall Street Journal", "Financial Times",
         "Nikkei", "Digitimes", "ETNews", "The Elec", "Ming-Chi Kuo", "Ross Young",
         "Jeff Pu", "Sonny Dickson", "Majin Bu", "Instant Digital",
         "Fixed Focus Digital", "Digital Chat Station", "Weibo"}


def is_scoop(origin):
    return origin in SCOOP or origin.startswith("X @")


# Chi vale come parola ufficiale: non e' una fonte in piu', e' la fine del rumor.
OFFICIAL = {"Apple", "documenti SEC", "atti giudiziari", "Commissione europea"}

# I nomi con cui le fonti compaiono nel testo, quando il link non c'e' — i siti
# italiani citano spesso a parole. Il nome di una persona porta alla sua testata.
NAMES = {
    "mark gurman": "Bloomberg", "gurman": "Bloomberg", "bloomberg": "Bloomberg",
    "the information": "The Information",
    "wall street journal": "Wall Street Journal", "wsj": "Wall Street Journal",
    "financial times": "Financial Times", "reuters": "Reuters", "nikkei": "Nikkei",
    "digitimes": "Digitimes", "etnews": "ETNews", "the elec": "The Elec",
    "ming-chi kuo": "Ming-Chi Kuo", "kuo": "Ming-Chi Kuo",
    "ross young": "Ross Young", "jeff pu": "Jeff Pu",
    "counterpoint": "Counterpoint", "idc": "IDC", "canalys": "Canalys",
    "9to5mac": "9to5Mac", "macrumors": "MacRumors", "the verge": "The Verge",
    "appleinsider": "AppleInsider", "macworld": "Macworld",
    "sonny dickson": "Sonny Dickson", "majin bu": "Majin Bu",
    "instant digital": "Instant Digital", "fixed focus digital": "Fixed Focus Digital",
    "digital chat station": "Digital Chat Station",
}

# un'attribuzione vera ha un verbo davanti al nome: "secondo Gurman", "according
# to The Elec". Il solo nome in pagina non basta — sta anche nei menu
ATTRIB = re.compile(
    r"\b(?:secondo|stando a|come riport\w+|riportat\w+ da|riferisce|rivelat\w+ da|"
    r"scoop di|anticipat\w+ da|scrive|according to|reported by|report(?:s|ed)? from|"
    r"citing|via|told)\s+(?:(?:il|la|lo|l'|i|gli|the|a|an|analista|"
    r"giornalista|analyst|reporter|leaker|quotidiano|newsletter|testata|sito)\s+){0,3}"
    r"(?P<who>" + "|".join(sorted((re.escape(n) for n in NAMES), key=len, reverse=True))
    + r")\b", re.I)

# La parola di Apple si riconosce solo in forme strette. "Apple ha annunciato"
# da solo non basta: sta in ogni pezzo come contesto ("Apple ha presentato il
# Duo a settembre, e ora la produzione…"), e trasformava i rumor in ufficiali.
APPLE_STATEMENT = re.compile(
    r"\b(?:(?:comunicato|press release|statement|nota|dichiarazione)\s+(?:stampa\s+)?"
    r"(?:di|della|from|by)\s+apple|portavoce di apple|apple spokesperson|"
    r"(?:a |an )?spokesperson for apple|apple'?s spokesperson|"
    r"apple (?:ha )?(?:confirmed|confermato|told|detto|dichiarato)\s+(?:a |to )?"
    r"(?:\w+ ){0,2}?(?:9to5mac|macrumors|the verge|bloomberg|techcrunch|cnbc|reuters|"
    r"the information|wsj|wall street journal|financial times|axios|nbc|cbs))\b", re.I)
# un comunicato della newsroom: apple.com/newsroom/2026/09/… (anche /it/newsroom)
NEWSROOM = re.compile(r"apple\.com/(?:[a-z]{2}(?:-[a-z]{2})?/)?newsroom/(\d{4})/(\d{2})/")

X_POST = re.compile(r"https?://(?:www\.)?(?:x|twitter)\.com/([A-Za-z0-9_]+)/status/\d+")
WEIBO = re.compile(r"https?://(?:www\.)?weibo\.(?:com|cn)/\d+/\w+")


def feed_domains():
    """Le nostre fonti, per dominio: servono a dare un nome a ogni articolo."""
    out = {}
    try:
        reg = C.load_json(os.path.join(C.ROOT, "data", "sources.json"))
    except (OSError, ValueError):
        reg = {}
    for name, e in reg.items():
        d = C.domain(e.get("url", ""))
        d = re.sub(r"^(feeds?|rss)\.", "", d)
        if d:
            out[d] = name
    return out


def outlet_of(url, feeds):
    d = C.domain(url)
    for table in (feeds, ORIGIN_DOMAINS):
        if d in table:
            return table[d]
        parent = ".".join(d.split(".")[-2:])
        if parent in table:
            return table[parent]
    return d or "?"


# ------------------------------------------------------------------ lettura

def fetch_html(url):
    try:
        out = subprocess.run(["curl", "-sL", "--max-time", "20", "-A", UA, url],
                             capture_output=True, timeout=30)
        return out.stdout.decode("utf-8", "replace") if out.returncode == 0 else ""
    except Exception:
        return ""


def article_region(page):
    """I paragrafi dell'articolo, e solo quelli.

    Le citazioni stanno nel testo: "secondo Bloomberg", con il link sopra la
    parola. Menu, colonne laterali e schede "leggi anche" citano mezzo mondo,
    ma quasi mai dentro un <p> con un link a un'altra testata. Isolare il tag
    <article> non basta: 9to5Mac ne usa uno per ogni scheda della colonna
    laterale, e il primo che si trova e' quasi sempre quello sbagliato."""
    page = re.sub(r"(?is)<(script|style|nav|footer|aside|header)[^>]*>.*?</\1>", " ", page)
    parts = re.findall(r"(?is)<(?:p|blockquote)\b[^>]*>.*?</(?:p|blockquote)>", page)
    return "\n".join(parts)


def citations(url, page):
    """Da chi dice di averlo preso: un insieme di etichette d'origine."""
    own = C.domain(url)
    body = article_region(page)
    found = set()

    for href in re.findall(r'(?i)<a\s[^>]*href=["\']([^"\'#]+)', body):
        href = html.unescape(urljoin(url, href))
        d = C.domain(href)
        if not d or d == own or d.endswith("." + own) or own.endswith("." + d):
            continue
        m = X_POST.match(href)
        if m and m.group(1).lower() not in ("intent", "share", "home"):
            found.add("X @" + m.group(1))
            continue
        if WEIBO.match(href):
            found.add("Weibo")
            continue
        parent = ".".join(d.split(".")[-2:])
        label = ORIGIN_DOMAINS.get(d) or ORIGIN_DOMAINS.get(parent)
        if label == "Apple":
            # di Apple vale solo il comunicato, con il suo mese: una pagina di
            # supporto e' un indizio (e il rumor resta rumor), un vecchio
            # comunicato linkato per contesto non dice niente di oggi
            m = NEWSROOM.search(href)
            if m:
                found.add(f"Apple newsroom {m.group(1)}-{m.group(2)}")
            continue
        if label:
            found.add(label)

    text = C.deaccent(re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ",
                        re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", body)))))
    for m in ATTRIB.finditer(text):
        label = NAMES.get(m.group("who").lower())
        if label:
            found.add(label)
    if APPLE_STATEMENT.search(text):
        found.add("Apple")

    # l'articolo non e' fonte di se stesso
    me = outlet_of(url, {})
    found.discard(me)
    return found


def read_all(urls, cache, refresh):
    """Apre gli articoli che non sono gia' in cache, in parallelo."""
    todo = [u for u in urls if refresh or C.norm_url(u) not in cache]
    if todo:
        with cf.ThreadPoolExecutor(max_workers=8) as pool:
            pages = dict(zip(todo, pool.map(fetch_html, todo)))
        for u, page in pages.items():
            cache[C.norm_url(u)] = {
                "cita": sorted(citations(u, page)) if page else None,
                "il": C.today(),
            }
    return {u: (cache.get(C.norm_url(u)) or {}).get("cita") for u in urls}


# ------------------------------------------------------------------ catena

def cluster_for(news, raw_items):
    """Gli articoli che raccontano questa notizia: prima quelli che la notizia
    stessa dichiara (link, extra_links), poi quelli del grezzo che somigliano
    ai titoli di questi — i titoli inglesi del grezzo col titolo italiano della
    notizia non si confrontano bene, fra loro si'."""
    urls = [news.get("link")] + [e.get("url") for e in news.get("extra_links") or []]
    urls = [u for u in urls if u and u.startswith("http")]
    known = {C.norm_url(u) for u in urls}
    by_url = {C.norm_url(i.get("link")): i for i in raw_items}
    seeds = [by_url[k]["title"] for k in known if k in by_url] or [news.get("title", "")]
    for it in raw_items:
        k = C.norm_url(it.get("link"))
        if k in known or it.get("tier") not in ("primaria", "redazionale"):
            continue
        # niente scorciatoia fra lingue: "iPhone Duo" sta in meta' dei titoli
        # della settimana, e bastava a mettere nel mucchio pezzi di altro
        if any(C.similarity(it.get("title", ""), s, cross_language=False) >= SAME for s in seeds):
            urls.append(it["link"])
            known.add(k)
    return urls[:MAX_PER_STORY]


def fresh_labels(labels, day):
    """"Apple newsroom 2026-09" diventa "Apple" se il comunicato e' di questo
    mese o del precedente; altrimenti era contesto, e si lascia cadere."""
    y, m = int(day[:4]), int(day[5:7])
    ok = {f"{y}-{m:02d}", f"{y - (m == 1)}-{(m - 2) % 12 + 1:02d}"}
    out = set()
    for l in labels or []:
        if l.startswith("Apple newsroom "):
            if l.split()[-1] in ok:
                out.add("Apple")
        else:
            out.add(l)
    return out


def verdict(news, urls, cited, feeds, day):
    """Mette insieme quello che ha letto: origini, riprese, silenzi."""
    cited = {u: (None if c is None else fresh_labels(c, day)) for u, c in cited.items()}
    outlets = {}
    for u in urls:
        outlets.setdefault(outlet_of(u, feeds), []).append(u)

    origins, echoes, silent = set(), set(), set()
    for outlet, us in outlets.items():
        cs = set()
        for u in us:
            cs |= set(cited.get(u) or [])
        if cs:
            origins |= cs
            echoes.add(outlet)
        elif any(cited.get(u) is not None for u in us):
            silent.add(outlet)

    # una testata del mucchio citata dalle altre e' un'origine, non un silenzio
    for outlet in list(silent):
        if outlet in origins:
            silent.discard(outlet)

    # se nessun articolo si e' lasciato leggere, le fonti dichiarate nella
    # notizia che non sono nostri feed sono il meglio che si ha
    if not origins and all(cited.get(u) is None for u in urls):
        ours = set(feeds.values())
        origins = {s for s in news.get("sources") or [] if s not in ours}

    official = bool(origins & OFFICIAL) or any(
        outlet_of(u, feeds) in ("Apple Newsroom", "Apple Developer", "Apple") for u in urls)
    independent = sorted(o for o in origins if o not in OFFICIAL)
    return {
        "testate": len(outlets),
        "origini": ([o for o in sorted(origins & OFFICIAL)] + independent),
        "ufficiale": official,
        "riprese": len(echoes),
        "senza_fonte": len(silent),
        "il": C.today(),
    }


def mismatch(news, v):
    """Dove tag e affidabilita' dicono una cosa e la catena un'altra.

    Solo i casi in cui la catena dice qualcosa di positivo. Una testata che
    non cita nessuno spesso e' la fonte di se stessa — ha provato la beta, era
    all'evento — e trattarla da sospetta riempirebbe il rapporto di falsi
    allarmi, che e' il modo piu' veloce per insegnare a ignorarlo."""
    tag, rel = news.get("tag"), news.get("reliability")
    indip = [o for o in v["origini"] if o not in OFFICIAL]
    out = []
    if tag == "CONFERMATO" and not v["ufficiale"] and len(indip) == 1 and is_scoop(indip[0]):
        out.append(f"CONFERMATO, ma la catena porta a un'esclusiva sola ({indip[0]}) e "
                   "nessuna parola di Apple: autorevole, ma e' un RUMOR ad affidabilita' alta")
    if tag == "RUMOR" and v["ufficiale"]:
        out.append("RUMOR, ma una delle testate riporta un comunicato o una "
                   "dichiarazione di Apple: forse non e' piu' un rumor")
    if tag == "RUMOR" and rel == "alta" and not indip and v["testate"] > 1:
        out.append(f"RUMOR ad affidabilita' alta, ma nessuna delle {v['testate']} testate "
                   "dice da chi viene")
    scoops = [o for o in indip if is_scoop(o)]
    if tag == "RUMOR" and len(scoops) >= 2 and rel != "alta":
        out.append(f"due origini indipendenti ({', '.join(scoops)}): l'affidabilita' "
                   "puo' salire")
    return out


# ------------------------------------------------------------------ corsa

def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?")
    ap.add_argument("--dry", action="store_true", help="stampa e basta, non scrive")
    ap.add_argument("--refresh", action="store_true", help="riapre gli articoli in cache")
    args = ap.parse_args()

    day = args.date or C.today()
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not os.path.exists(path):
        print(f"Nessuna edizione per il {day}.", file=sys.stderr)
        return 1
    brief = C.load_json(path)

    raw_path = os.path.join(C.RAW_DIR, f"{day}.json")
    raw = C.load_json(raw_path).get("items", []) if os.path.exists(raw_path) else []

    os.makedirs(VERIFY_DIR, exist_ok=True)
    cache = C.load_json(CACHE_FILE) if os.path.exists(CACHE_FILE) else {}
    cache = {k: v for k, v in cache.items()
             if (C.days_between(C.today(), v.get("il", "")) or 0) <= CACHE_DAYS}
    feeds = feed_domains()

    news = brief.get("news") or []
    clusters = {n.get("id"): cluster_for(n, raw) for n in news}
    all_urls = sorted({u for us in clusters.values() for u in us})
    print(f"Leggo {len(all_urls)} articoli per {len(news)} notizie...\n")
    cited = read_all(all_urls, cache, args.refresh)
    C.save_json(CACHE_FILE, cache)

    rows, warnings = [], []
    for n in news:
        v = verdict(n, clusters[n.get("id")], cited, feeds, day)
        if not args.dry:
            n["verifica"] = v
        indip = [o for o in v["origini"] if o not in OFFICIAL]
        if v["ufficiale"]:
            chain = "UFFICIALE" + (f" + {', '.join(indip)}" if indip else "")
        elif indip:
            chain = f"{len(indip)} origine: {indip[0]}" if len(indip) == 1 else \
                    f"{len(indip)} origini: {', '.join(indip)}"
        else:
            chain = "origine non dichiarata"
        rows.append([str(n.get("rank", "")), (n.get("tag") or "")[:10],
                     (n.get("reliability") or "")[:5], str(v["testate"]),
                     str(v["riprese"]), str(v["senza_fonte"]), chain[:48],
                     (n.get("title") or "")[:44]])
        for w in mismatch(n, v):
            warnings.append((n.get("id"), w))

    print(C.table(rows, ["#", "tag", "affid.", "test.", "rip.", "muti", "catena", "notizia"]))
    print("""
  test.   testate che la raccontano (le nostre, piu' i link della notizia)
  rip.    testate che la riprendono citando qualcun altro
  muti    testate che la raccontano senza dire da dove viene
  catena  chi l'ha detto per primo: le origini indipendenti, o la parola ufficiale""")

    if warnings:
        print(C.rule(f"Da riguardare — {len(warnings)}"))
        for sid, w in warnings:
            print(f"  {sid}: {w}")
        print("\nLo script dice cosa ha visto, non cambia i tag: la decisione e' tua.")
    else:
        print("\nTag e affidabilita' tornano con quello che dicono le fonti.")

    if not args.dry:
        C.save_json(path, brief)
        print(f"\nVerifica scritta nell'edizione del {day}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
