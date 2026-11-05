#!/usr/bin/env python3
"""
Le rubriche: GAMES, TECH, SPAZIO.

Dal 2 ottobre 2026 l'app ha tre schede oltre ad APPLE e AI. Mike le ha
volute cosi':

* **Mai riempire.** Se le notizie buone sono tre, sono tre. Se sono due, la
  terza viene «dalla settimana»: la cosa piu' calda della settimana che non e' gia'
  uscita. Mai oltre il tetto di ogni rubrica (Spazio 5, Tech 8, Games 10).
* **Non solo quello che dicono tutti.** Al massimo 1-2 storie di cui si parla
  da giorni; il resto deve essere nuovo.
* **Quelle che fanno aprire.** Non il comunicato, non l'offerta: la cosa che
  un nerd apre. Games in testa PlayStation 5, poi Nintendo, Apple Arcade, le
  grandi case, le fiere. Tech e' tutto l'hardware e quello che affiora (il
  Kindle nuovo, la console portatile, il progetto che sale su Hacker News).

Lo script non usa Claude: legge il grezzo (i gironi games, tech e spazio di
data/raw/), toglie offerte e rumore, raggruppa lo stesso fatto detto da piu'
testate, assegna un punteggio e sceglie. Gemini traduce i titoli e scrive la
riga di sintesi — solo dal sommario del feed, senza inventare. Un redattore
Claude puo' rivedere dopo la pubblicazione (vedi CLAUDE.md), ma l'edizione
non lo aspetta.

    python3 pipeline/rubriche.py                 oggi, da data/raw/<oggi>.json
    python3 pipeline/rubriche.py --dry           stampa la scelta, non scrive
    python3 pipeline/rubriche.py --debug         anche i punteggi dei candidati
    python3 pipeline/rubriche.py --merge         ricopia nell'edizione di oggi

Scrive data/rubriche/<giorno>.json (le tre liste) e data/rubriche/pool.json
(i candidati buoni degli ultimi otto giorni, da cui pesca «dalla settimana»).
push.py ricopia le liste dentro l'edizione prima di caricarla.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

DIR = os.path.join(C.ROOT, "data", "rubriche")
POOL = os.path.join(DIR, "pool.json")
KEYS = ("games", "tech", "spazio")

# ---------------------------------------------------------------- le regole

# Rumore comune a tutte: offerte, liste, guide, giochini del giorno.
RUMORE = re.compile(
    r"\b(deal|deals|discount|discounted|sale|coupon|promo code|% off|price drop|prime day|"
    r"black friday|cheapest|bundle|save \$|\$\d+ off|best [\w ]+ (of|for|to|in) |"
    r"buying guide|walkthrough|how to|guide:|tips|where to find|every [\w ]+ (location|collectible)|"
    r"wordle|connections|hints|answers|today'?s|quiz|giveaway|sweepstakes|where to buy|in stock|stock updates|"
    r"lowest price|lowest ever|just dropped|dropped to|price cut|"
    # le offerte travestite da notizia (5 novembre 2026: «for Less Than $7 Each
    # With This One Easy Step», «Try … on PS Plus Premium Now»)
    r"for less than|less than \$\d|one easy (step|trick)|this one (simple |easy )?(step|trick)|"
    r"(try|play|grab|claim) [^.]{2,60} (now|today|for free)$|free (this|next) (week|weekend)|"
    r"offerta|sconto|coupon|miglior[ei] )", re.I)
# il titolo-domanda e il pezzo in prima persona sono opinione, non notizia
# («can Bethesda recapture the magic?», «had me captivated»)
OPINIONE = re.compile(r"\?\s*$|\b(i|i'm|i've|i'd|me|my|we|our)\b|\b(opinion|column|editorial|essay)\b", re.I)
# Tech e Scienza: la politica e lo spettacolo arrivano alla soglia con la sola
# testata e la freschezza (Musk e le elezioni, la serie Marvel «VisionQuest»)
FUORI_TEMA = re.compile(
    r"\b(elections?|midterms?|senate|congress|campaign|ballot|voters?|republicans?|democrats?|"
    r"trump|musk|episode|season finale|tv series|the series|showrunner|netflix|disney\+|hbo|marvel|"
    r"box office|movie|film|trailer|cast)\b", re.I)
APPLE = re.compile(r"\b(apple|iphone|ipad|macbook|ios \d|macos|airpods|vision pro|apple watch)\b", re.I)
AI_WORDS = re.compile(r"\b(ai|a\.i\.|gpt|openai|chatgpt|llm|chatbot|claude|gemini|copilot|anthropic)\b", re.I)

RUBRICHE = {
    "games": {
        "nome": "Games", "max": 10, "soglia": 6.0,
        # il peso della testata: PlayStation prima, poi chi guarda l'industria
        "fonti": {"PlayStation Blog": 2.4, "Push Square": 1.6, "VGC": 2.2, "Eurogamer": 2.0,
                  "GamesIndustry.biz": 2.2, "IGN": 1.6, "Nintendo Life": 1.6, "Kotaku": 1.2,
                  "Rock Paper Shotgun": 1.0},
        "boost": [
            (r"\b(ps5|ps5 pro|playstation|state of play|ps plus|psvr|sony interactive|naughty dog|"
             r"santa monica|insomniac|guerrilla|bluepoint|bend studio|astro bot|god of war|ghost of|horizon|"
             r"spider-man|gran turismo|the last of us|returnal|ratchet|death stranding|intergalactic|"
             r"wolverine|marathon|uncharted|bungie)\b", 3.0),
            (r"\b(nintendo|switch 2|zelda|mario|pokemon|pok[eé]mon|metroid|kirby|splatoon|direct)\b", 1.6),
            (r"\b(apple arcade|mac gaming|game porting|ios game|iphone game)\b", 2.5),
            (r"\b(xbox|microsoft|capcom|square enix|ubisoft|electronic arts|ea |rockstar|gta|"
             r"cd projekt|witcher|bethesda|valve|steam|konami|sega|bandai|fromsoftware|kojima|take-two)\b", 1.6),
            (r"\b(lucca|gamescom|tokyo game show|game awards|summer game fest|showcase|e3|pax|"
             r"bit summit|gdc|evo|esport|world cup)\b", 2.5),
            (r"\b(announce|announced|reveal|revealed|release date|delayed|delay|layoffs?|laid off|"
             r"shut(s|ting)? down|closing|acquires?|acquisition|leak|rumou?r|remake|remaster|"
             r"sequel|trailer|exclusive|free-to-play|price hike|price increase|anniversary)\b", 1.0),
            (r"\b(adaptation|anime|game adaptation|based on the game)\b", 0.6),
            (r"\b(indie|retro|collector|limited edition|speedrun|record|italian|italiano)\b", 0.8),
        ],
        "penalita": [
            (r"\b(review|recensione|hands-on|impressions)\b", -1.0),
            (r"\b(patch|patch notes|hotfix|fixes|update \d|maintenance|bug)\b", -2.5),
            (r"\b(dlc|demo|free upgrade|free ps5 upgrade|pre-?order bonus)\b", -1.5),
            (r"\b(skin|cosmetic|battle pass|season \d|loot|mod[s]? )\b", -1.5),
        ],
    },
    "tech": {
        "nome": "Tech", "max": 8, "soglia": 6.0,
        # senza almeno una di queste parole non e' una voce di Tech
        "tema": r"\b(kindle|e-?readers?|e-?ink|handhelds?|consoles?|cameras?|drones?|headphones|earbuds|"
                r"watch(es)?|smartwatch|speakers?|projectors?|printers?|3d print\w*|keyboards?|mouse|tablets?|"
                r"laptops?|notebooks?|pc|desktop|monitors?|displays?|screens?|tvs?|oled|glasses|rings?|"
                r"wearables?|phones?|smartphones?|pixel|galaxy|chips?|cpus?|gpus?|processors?|ram|ssd|"
                r"batter(y|ies)|chargers?|solar|e-?bikes?|scooters?|cars?|ev|robots?|vacuum|router|wi-?fi|"
                r"raspberry pi|esp32|arduino|hardware|gadgets?|devices?|prototype|teardown|diy|kickstarter|"
                r"steam deck|rog ally|gopro|dji|insta360|sonos|bose|framework|nothing|telescopes?|lego|"
                r"satellite|starlink|vinyl|radio|synth\w*|retro)\b",
        "fonti": {"Hacker News": 1.8, "Liliputing": 1.6, "Hackaday": 2.4, "Engadget": 2.2,
                  "Ars Technica Gadget": 2.2, "Gizmodo": 1.6, "TechRadar": 0.6, "Product Hunt": 1.2},
        "boost": [
            (r"\b(launch|launches|launched|announces?|introduces?|unveil(s|ed)?|debuts?|hands-on|first look|"
             r"new [\w-]+ (reader|handheld|console|camera|drone|headphones|earbuds|watch|speaker|"
             r"projector|printer|keyboard|tablet|laptop|glasses|ring))\b", 1.8),
            (r"\b(kindle|e-?reader|e-?ink)\b", 2.6),
            (r"\b(steam deck|handheld|rog ally|switch 2 dock|gopro|dji|insta360|"
             r"drone|3d print|smart glasses|wearable|headphones|earbuds|sonos|bose|nothing|"
             r"framework|raspberry pi|esp32|arduino|open[- ]source hardware|retro)\b", 1.6),
            (r"\b(world'?s first|prototype|diy|homemade|built|open[- ]source|teardown|"
             r"modded?|hacked?|crowdfund|kickstarter|backers?)\b", 1.6),
            (r"\b(battery|solid-state|ev |charger|solar|e-?bike|scooter|telescope)\b", 0.8),
        ],
        "penalita": [
            (r"\b(review|recensione)\b", -1.2),
            (r"\b(best|top \d+|ranked)\b", -2.5),
            (r"\b(linux|kernel|rust|python|javascript|api|sdk|framework \d|vulnerabilit|cve)\b", -1.5),
            (r"\b(windows|android \d+|chrome|firefox|microsoft)\b", -1.0),
            (r"\b(roundup|news roundup|weekly|podcast|newsletter)\b", -2.5),
            (r"\b(git|sveltekit|svelte|react|database|vector|serverless|cloudflare|postgres|sql|compiler|"
             r"typescript|kubernetes|docker|devops|startup|funding|raises|series [a-d]|valuation)\b", -3.0),
        ],
    },
    "spazio": {
        # la chiave resta "spazio" (gironi, archivio, segnali), la scheda si chiama Scienza
        "nome": "Scienza", "max": 5, "soglia": 6.0,
        "tema": r"\b(space|spazio|nasa|esa|spacex|rocket|razzo|orbit\w*|launch\w*|lancio|satellit\w*|"
                r"astronaut\w*|moon|luna|mars|marte|planet\w*|pianet\w*|star|stell\w*|galax\w*|galassi\w*|"
                r"nebula|nebulosa|comet\w*|asteroid\w*|black hole|buco nero|universe|universo|cosmic|cosmo|"
                r"telescope|telescopio|hubble|webb|jwst|artemis|starship|eclipse|eclissi|aurora|sun|sole|"
                r"science|scienz\w*|scientists?|scienziat\w*|study|studio|research\w*|ricerca|discover\w*|"
                r"scopert\w*|species|specie|fossil\w*|dinosaur\w*|evolution|evoluzione|animals?|animal[ei]|"
                r"brain|cervello|cells?|cellul\w*|genes?|gene|dna|virus|vaccin\w*|cancer|cancro|tumor\w*|"
                r"trial|drug|farmac\w*|physics|fisica|quantum|quantistic\w*|particle\w*|chemistry|chimica|"
                r"molecul\w*|climate|clima|ocean\w*|volcan\w*|vulcan\w*|earthquake|terremoto|glacier\w*)\b",
        "fonti": {"NASA APOD": 3.0, "Media INAF": 2.4, "Universe Today": 1.6, "Ars Technica Scienza": 2.4,
                  "SpaceNews": 1.8, "NASA": 1.2},
        "boost": [
            (r"\b(launch|launches|launched|lancio|lancia|decolla|liftoff|crew|astronaut|equipaggio)\b", 2.0),
            (r"\b(webb|hubble|artemis|starship|starliner|spacex|blue origin|new glenn|vulcan|ariane|"
             r"rocket lab|chandrayaan|perseverance|curiosity|voyager|parker|juno|europa|titan|jwst)\b", 2.6),
            (r"\b(black hole|buco nero|exoplanet|esopianeta|asteroid|asteroide|comet|cometa|supernova|"
             r"galax(y|ies)|galassi[ae]|nebula|nebulosa|mars|marte|moon|luna|venus|venere|jupiter|"
             r"saturn|solar flare|aurora|eclipse|eclissi|dark matter|materia oscura|big bang)\b", 1.6),
            (r"\b(first|primo|prima|record|discover(s|ed|y)?|scoperta|mystery|mistero|never before|"
             r"unprecedented|image|immagine|photo|foto|video|mysteri\w+|collisions?|shatter\w*)\b", 1.2),
        ],
        "penalita": [
            (r"\b(awards?|contract|procurement|appalt|agreements?|partner(s|ship)?|strategy|"
             r"quarter|manifest|budget|workforce|logistics|services? (agreement|contract))\b", -3.0),
            (r"\b(10 things|rains|flood|wildfire|earth observation|landsat|hurricane|climate)\b", -3.0),
            (r"\b(world space week|skywatching tips|what'?s up)\b", -0.5),
        ],
    },
}
# i feed che portano ore e punti: scritti in un modo che solo noi capiamo
HN = re.compile(r"Points:\s*(\d+)", re.I)
HN_C = re.compile(r"#\s*Comments:\s*(\d+)", re.I)
MAX_SATURI = 2          # storie "di cui parlano tutti da giorni": al massimo due
MIN_TOP = 3             # sotto questa soglia di voci buone, si completa con "ti sei perso"
POOL_DAYS = 8
LANG_IT = {"Media INAF"}


# ---------------------------------------------------------------- punteggio

def fresh(age):
    return 3.0 if age < 6 else 2.0 if age < 12 else 1.0 if age < 24 else 0.0 if age < 36 else -1.0


def score(rub, a):
    cfg = RUBRICHE[rub]
    t = a["title"]
    low = t.lower()
    if RUMORE.search(t) and rub != "spazio":
        return -9.0
    if rub == "tech" and APPLE.search(t):
        return -9.0            # sta gia' nell'edizione Apple
    # Tech e Scienza: senza una parola del tema non e' una voce della scheda
    if cfg.get("tema") and not re.search(cfg["tema"], low, re.I):
        return -9.0
    s = cfg["fonti"].get(a["source"], 0.8) + fresh(a["age_hours"])
    for rx, w in cfg["boost"]:
        if re.search(rx, low, re.I):
            s += w
    for rx, w in cfg["penalita"]:
        if re.search(rx, low, re.I):
            s += w
    if rub == "tech" and AI_WORDS.search(t):
        s -= 3.0               # l'AI ha la sua scheda
    if rub == "tech" and a["source"] == "Hacker News":
        # su Hacker News sale soprattutto software: senza un segno di hardware o
        # di oggetto reale (nessun boost che scatta) non e' una "scoperta"
        if not any(re.search(rx, low, re.I) for rx, _ in cfg["boost"]):
            s -= 5.0
    if a["source"] == "Hacker News":
        m = HN.search(a.get("summary", ""))
        if m:
            s += min(4.0, int(m.group(1)) / 150)
    # un titolo vuoto di fatti — un elenco — fa meno aprire; una domanda o un
    # pezzo in prima persona e' un'opinione, e scende di piu'
    if re.match(r"^\d+ ", t):
        s -= 1.0
    if OPINIONE.search(t):
        s -= 3.0
    if rub in ("tech", "spazio") and FUORI_TEMA.search(t):
        s -= 4.0
    return round(s, 2)


RARO = 0.03     # un nome che sta in meno del 3% dei titoli del giorno
# le case e le piattaforme non sono mai un nome raro: stanno in una notizia su
# tre della loro scheda anche quando oggi ne parlano in pochi
MARCHI = {"nintendo", "xbox", "sony", "playstation", "microsoft", "samsung", "google", "nasa", "apple",
          "steam", "valve", "switch", "marvel", "amazon", "meta", "netflix", "disney", "ubisoft", "capcom",
          "sega", "konami", "bandai", "namco", "tencent", "epic", "spacex", "esa", "garmin", "sonos", "dji"}


def _parole(title):
    return re.findall(r"[A-Za-zÀ-ÿ0-9][\w'’-]*", title or "")


def _maiuscolo(title):
    """Titolo all'inglese, con tutte le parole in maiuscolo: li' la maiuscola
    non dice se una parola e' un nome."""
    ws = [w for w in _parole(title) if len(w) > 3]
    return bool(ws) and sum(w[0].isupper() for w in ws) / len(ws) > 0.6


def rari(titles):
    """I nomi rari del giorno: parole che nel grezzo stanno in meno del 3% dei
    titoli e che, nei titoli scritti in minuscolo, compaiono con la maiuscola
    a meta' frase («Laufey», «Dogma» si'; «Update», «Patch» o «Nintendo» no).
    Un titolo all'inglese tutto in maiuscolo non prova niente."""
    from collections import Counter
    df = Counter(w for t in titles for w in C.tokens(t))
    lim = max(2, RARO * len(titles))
    nome, minuscolo = set(), set()
    for t in titles:
        if _maiuscolo(t):
            continue
        for k, w in enumerate(_parole(t)):
            for tk in C.tokens(re.sub(r"['’]s$", "", w)):
                if any(c.isdigit() for c in tk):
                    continue
                if w[0].isupper() and k > 0:
                    nome.add(tk)
                elif w[0].islower():
                    minuscolo.add(tk)
    return {w for w, n in df.items() if n < lim and w in nome and w not in minuscolo and w not in MARCHI}


def _nomi(title, rare):
    """Le parole rare del giorno che stanno nel titolo."""
    return C.tokens(title) & rare


def stesso_fatto(a, b, rare):
    """Due titoli raccontano lo stesso fatto: o si somigliano (0,4), o hanno
    in comune un nome raro del giorno piu' un'altra parola. Il 5 novembre 2026
    God of War Laufey di Eurogamer e di Push Square stava a 0,383 e usciva due
    volte."""
    if C.similarity(a, b, cross_language=False) >= 0.4:
        return True
    comuni = _nomi(a, rare) & _nomi(b, rare)
    if not comuni:
        return False
    # due nomi rari bastano; con uno solo serve che i titoli si somiglino almeno
    # un po' (un «Call of Duty» citato di passaggio non fa lo stesso fatto)
    if len(comuni) >= 2:
        return True
    return len(C.tokens(a) & C.tokens(b)) >= 2 and C.similarity(a, b, cross_language=False) >= 0.22


def cluster(items, rare=frozenset(), altri=()):
    """Lo stesso fatto detto da piu' testate. Il primo del gruppo e' il piu'
    alto di punteggio, e ogni testata in piu' vale 2,5 punti: e' il segno che
    la cosa ha girato.

    I gruppi si fanno per catena (se A sta con B e B con C, stanno insieme
    tutti e tre), non col primo gruppo che capita. Le testate si contano su
    tutto il grezzo (`altri`): una notizia di giochi data anche da The Verge
    gira di piu' di una data solo da Push Square."""
    items = sorted(items, key=lambda x: -x["_s"])
    n = len(items)
    padre = list(range(n))

    def radice(i):
        while padre[i] != i:
            padre[i] = padre[padre[i]]
            i = padre[i]
        return i
    for i in range(n):
        for j in range(i + 1, n):
            if radice(i) != radice(j) and stesso_fatto(items[i]["title"], items[j]["title"], rare):
                padre[radice(j)] = radice(i)
    bucket = {}
    for i in range(n):
        bucket.setdefault(radice(i), []).append(items[i])
    groups = sorted(bucket.values(), key=lambda g: -g[0]["_s"])
    out = []
    for g in groups:
        rep = dict(g[0])
        fonti = {x["source"] for x in g}
        links = {x["link"] for x in g}
        for a in altri:
            if a["source"] in fonti or a["link"] in links:
                continue
            if any(stesso_fatto(a["title"], x["title"], rare) for x in g):
                fonti.add(a["source"])
        rep["_n"] = len(fonti)
        rep["_s"] = round(rep["_s"] + 2.5 * min(3, len(fonti) - 1), 2)
        out.append(rep)
    return sorted(out, key=lambda x: -x["_s"])


# ---------------------------------------------------------------- memoria

def history(day, days=POOL_DAYS):
    """Le voci uscite nei giorni prima, per rub: [(orig, link, data)]."""
    out = {k: [] for k in KEYS}
    if not os.path.isdir(DIR):
        return out
    lim = (datetime.fromisoformat(day) - timedelta(days=days)).date().isoformat()
    for name in sorted(os.listdir(DIR)):
        m = re.match(r"^(\d{4}-\d{2}-\d{2})\.json$", name)
        if not m or m.group(1) >= day or m.group(1) < lim:
            continue
        try:
            d = C.load_json(os.path.join(DIR, name))
        except ValueError:
            continue
        for k in KEYS:
            for it in d.get(k, []):
                out[k].append((it.get("orig") or it.get("title", ""), it.get("link", ""), m.group(1)))
    return out


def load_pool(day):
    if not os.path.exists(POOL):
        return []
    lim = (datetime.fromisoformat(day) - timedelta(days=POOL_DAYS)).date().isoformat()
    return [p for p in C.load_json(POOL) if p.get("date", "") >= lim]


# ---------------------------------------------------------------- scelta

def choose(rub, items, hist, pool, day, debug=False, rare=frozenset(), altri=()):
    cfg = RUBRICHE[rub]
    cand = []
    for a in items:
        s = score(rub, a)
        if s <= -5:
            continue
        a = dict(a)
        a["_s"] = s
        cand.append(a)
    groups = cluster(cand, rare, [a for a in altri if a.get("tier") != rub])
    if debug:
        for g in groups[:14]:
            print(f"      {g['_s']:5.1f} n{g['_n']} {g['source'][:14]:14} {g['title'][:78]}")
    shown_links = {l for _, l, _ in hist[rub]}
    prev_titles = [t for t, _, _ in hist[rub]]
    good, saturi = [], 0
    for g in groups:
        if g["_s"] < cfg["soglia"] or C.norm_url(g["link"]) in {C.norm_url(l) for l in shown_links}:
            continue
        # "ne parlano tutti da giorni": gia' uscita nei giorni scorsi sotto un'altra veste
        if any(C.similarity(g["title"], t, cross_language=False) >= 0.5 for t in prev_titles):
            if saturi >= MAX_SATURI:
                continue
            saturi += 1
            g["_s"] = round(g["_s"] - 2.0, 2)
            g["_continua"] = True
        good.append(g)
    good = sorted(good, key=lambda x: -x["_s"])[:cfg["max"]]

    # il pool dei giorni prima: tutto cio' che e' passato la soglia, per "ti sei perso"
    persi = []
    if len(good) < MIN_TOP:
        used = {C.norm_url(g["link"]) for g in good} | {C.norm_url(l) for l in shown_links}
        for p in sorted(pool, key=lambda x: -x.get("score", 0)):
            if p.get("rub") != rub or C.norm_url(p["link"]) in used:
                continue
            if p.get("score", 0) < cfg["soglia"] + 1.0:       # per "ti sei perso" si chiede di piu'
                continue
            if any(C.similarity(p["title"], g["title"], cross_language=False) >= 0.5 for g in good + persi):
                continue
            age = (datetime.fromisoformat(day + "T09:00:00+00:00") -
                   datetime.fromisoformat(p["date"] + "T09:00:00+00:00")).days
            q = dict(p)
            q["_s"] = p["score"]
            q["_perso"] = True
            q["age_hours"] = age * 24
            persi.append(q)
            if len(good) + len(persi) >= MIN_TOP:
                break
    return good, persi, groups


# ---------------------------------------------------------------- italiano

GEMINI_MODELS = ("gemini-3.8-flash", "gemini-3.7-flash", "gemini-flash-latest", "gemini-3.5-flash")
PROMPT = """Sei il redattore di una rassegna tech in italiano. Per ogni voce qui sotto scrivi:
- "titolo": il titolo in italiano, naturale e asciutto da giornale, massimo 95 caratteri.
  Deve dire ESATTAMENTE le stesse cose del titolo originale: e' una traduzione, non una
  riscrittura, e il sommario non serve a cambiarlo. Non tradurre i nomi propri, i titoli di giochi e film, i nomi di prodotto e le sigle.
  Niente clickbait, niente punto finale.
- "nota": UNA riga, massimo 150 caratteri, che dice il fatto. Usa SOLO quello che c'e' nel
  sommario: se non c'e' abbastanza, lascia "nota" vuota. Mai aggiungere dettagli tuoi.
Rispondi con un array JSON: [{"i": <numero>, "titolo": "...", "nota": "..."}], nessun altro testo.

VOCI:
"""


SCHEMA = {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
    "i": {"type": "INTEGER"}, "titolo": {"type": "STRING"}, "nota": {"type": "STRING"}},
    "required": ["i", "titolo", "nota"]}}
TENTATIVO = 40          # secondi per una chiamata
TETTO = 180             # secondi in tutto, per tutte e tre le schede insieme


def _chiave():
    try:
        import audio
        return audio.secret("GEMINI_API_KEY")
    except Exception:
        return ""


def gemini(items, deadline=None, key=None):
    """Traduce una lista di voci. Torna (traduzioni per indice, modello o None).

    Dal 4 novembre 2026 Gemini risponde spesso 503: il 5 la traduzione e'
    riuscita all'ottavo tentativo dopo 5'46". Quindi: 40 secondi a tentativo,
    si gira fra i modelli finche' non scade il tetto comune, e lo schema della
    risposta e' imposto (niente JSON da indovinare)."""
    import time
    key = key if key is not None else _chiave()
    if not key or not items:
        return {}, None
    deadline = deadline or time.time() + TETTO
    body = PROMPT + "\n".join(
        json.dumps({"i": i, "titolo_originale": it["orig"], "sommario": (it.get("summary") or "")[:380]},
                   ensure_ascii=False) for i, it in enumerate(items))
    payload = json.dumps({"contents": [{"parts": [{"text": body}]}],
                          "generationConfig": {"responseMimeType": "application/json",
                                               "responseSchema": SCHEMA, "temperature": 0.2}}).encode()
    giro = 0
    while time.time() < deadline - 5:
        model = GEMINI_MODELS[giro % len(GEMINI_MODELS)]
        giro += 1
        left = deadline - time.time()
        try:
            req = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                data=payload, headers={"x-goog-api-key": key, "Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(req, timeout=max(5, min(TENTATIVO, left))))
            arr = json.loads(d["candidates"][0]["content"]["parts"][0]["text"])
            out = {int(x["i"]): x for x in arr if isinstance(x, dict) and "i" in x and (x.get("titolo") or "").strip()}
            if out:
                return out, model
        except Exception as e:
            print(f"  (traduzione: {model} non ha risposto: {str(e)[:60]})", file=sys.stderr)
            if "404" in str(e) and giro > len(GEMINI_MODELS) * 2:
                break
            time.sleep(min(3, max(0, deadline - time.time() - 5)))
    return {}, None


def traduci(per_scheda):
    """Una chiamata per scheda, in parallelo, con un tetto comune. Torna le
    traduzioni per scheda e l'esito da scrivere nel file (`_traduzione`)."""
    import time
    from concurrent.futures import ThreadPoolExecutor
    key = _chiave()
    deadline = time.time() + TETTO
    esiti, trad = {}, {}
    todo = {r: v for r, v in per_scheda.items() if v}
    for r in per_scheda:
        if not per_scheda[r]:
            esiti[r] = {"esito": "non serve", "modello": None}
            trad[r] = {}
    if todo and not key:
        for r in todo:
            esiti[r] = {"esito": "senza chiave", "modello": None, "voci": len(todo[r]), "tradotte": 0}
            trad[r] = {}
        return trad, esiti
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max(1, len(todo))) as ex:
        futs = {r: ex.submit(gemini, v, deadline, key) for r, v in todo.items()}
        for r, f in futs.items():
            try:
                tr, model = f.result()
            except Exception:
                tr, model = {}, None
            n = len(todo[r])
            fatte = sum(1 for i in range(n) if i in tr)
            esiti[r] = {"esito": "ok" if fatte == n else "parziale" if fatte else "fallita",
                        "modello": model, "voci": n, "tradotte": fatte}
            trad[r] = tr
    print(f"  traduzione: {round(time.time() - t0)} s — " +
          ", ".join(f"{RUBRICHE[r]['nome']} {e['esito']}" for r, e in esiti.items()), file=sys.stderr)
    return trad, esiti


def first_sentence(txt, n=150):
    txt = re.sub(r"\s+", " ", txt or "").strip()
    m = re.match(r"(.{20,%d}?[.!?])(\s|$)" % n, txt)
    return (m.group(1) if m else txt[:n].rsplit(" ", 1)[0] + ("…" if len(txt) > n else "")).strip()


def shape(rub, g, tr, top):
    orig = g.get("orig") or g["title"]
    tradotto = (tr.get("titolo") or "").strip()
    title = tradotto or orig
    nota = (tr.get("nota") or "").strip()
    if g["source"] == "Hacker News":
        pts, com = HN.search(g.get("summary", "")), HN_C.search(g.get("summary", ""))
        if pts:
            nota = f"{int(pts.group(1)):,} punti".replace(",", ".") + \
                   (f" e {com.group(1)} commenti" if com else "") + " su Hacker News"
    if g["source"] in LANG_IT:
        title, nota = orig, first_sentence(g.get("summary"))
    it = {
        "id": hashlib.sha1(g["link"].encode()).hexdigest()[:8],
        # `orig` c'e' sempre quando il titolo e' tradotto (anche se uguale, un nome
        # proprio): senza, la voce e' ancora da tradurre e il lint lo dice
        "title": title, "orig": orig if tradotto and g["source"] not in LANG_IT else None, "nota": nota,
        "source": g["source"], "link": g["link"],
        "ore": int(g.get("age_hours", 0)), "score": g["_s"],
    }
    if g.get("_n", 1) > 1:
        it["testate"] = g["_n"]
    if g.get("_continua"):
        it["continua"] = True
    if g.get("_perso"):
        it["perso"] = True
    if top:
        it["top"] = True
    return {k: v for k, v in it.items() if v is not None}


# ---------------------------------------------------------------- corsa

def run(raw_path, day, dry=False, debug=False, tradurre=True):
    raw = C.load_json(raw_path)
    arts = raw.get("items", []) if isinstance(raw, dict) else raw
    # Hacker News non e' una testata: porta l'argomento di cui discute e i punti
    hist, pool = history(day), load_pool(day)
    rare = rari([a.get("title", "") for a in arts])
    result, plan, newpool = {}, {}, []
    for rub in KEYS:
        items = [dict(a, orig=a["title"]) for a in arts if a.get("tier") == rub]
        # il titolo che cerchiamo e' quello originale, che resta
        good, persi, groups = choose(rub, items, hist, pool, day, debug, rare, arts)
        plan[rub] = (good, persi)
        for g in groups:
            if g["_s"] >= RUBRICHE[rub]["soglia"] - 1:
                newpool.append({"rub": rub, "title": g["title"], "orig": g["orig"], "link": g["link"],
                                "source": g["source"], "score": g["_s"], "date": day,
                                "summary": (g.get("summary") or "")[:380], "age_hours": g["age_hours"]})
    need = {rub: [g for g in plan[rub][0] + plan[rub][1] if g["source"] not in LANG_IT] for rub in KEYS}
    if tradurre:
        tr, esiti = traduci(need)
    else:
        tr, esiti = {r: {} for r in KEYS}, {r: {"esito": "saltata", "modello": None} for r in KEYS}
    by_id = {id(g): tr[rub].get(i, {}) for rub in KEYS for i, g in enumerate(need[rub])}
    if any(need.values()) and not any(tr.values()):
        print("  Gemini non ha risposto: titoli e note restano nella lingua della fonte "
              "(chiudi.py prepara riprova con rubriche.py --traduci).", file=sys.stderr)
    result["_traduzione"] = dict(esiti, il=datetime.now(timezone.utc).isoformat(timespec="seconds"))
    for rub in KEYS:
        good, persi = plan[rub]
        rows = [shape(rub, g, by_id.get(id(g), {}), top=i < 3) for i, g in enumerate(good)]
        rows += [shape(rub, g, by_id.get(id(g), {}), top=False) for g in persi]
        result[rub] = rows

    for rub in KEYS:
        print(f"\n== {RUBRICHE[rub]['nome']} — {len(plan[rub][0])} buone" +
              (f" + {len(plan[rub][1])} «dalla settimana»" if plan[rub][1] else "") + " ==")
        for it in result[rub]:
            tag = "★" if it.get("top") else ("↺" if it.get("perso") else " ")
            print(f" {tag} {it['score']:5.1f} {it['source'][:13]:13} {it['title'][:80]}"
                  + (f"  [{it['testate']} testate]" if it.get("testate") else "")
                  + ("  [continua]" if it.get("continua") else ""))
    if dry:
        return result
    os.makedirs(DIR, exist_ok=True)
    C.save_json(os.path.join(DIR, f"{day}.json"), result)
    seen = {p["link"] for p in newpool}
    C.save_json(POOL, newpool + [p for p in load_pool(day) if p["link"] not in seen and p.get("date") != day])
    return result


def da_tradurre(it):
    return not it.get("orig") and it.get("source") not in LANG_IT


def traduci_mancanti(day):
    """Rifa' solo le traduzioni che mancano nel file del giorno (chiudi.py
    prepara la lancia quando `_traduzione` non e' «ok»). Il sommario si
    riprende dal grezzo, per link."""
    src = os.path.join(DIR, f"{day}.json")
    if not os.path.exists(src):
        print("nessun file delle rubriche per il giorno")
        return 1
    d = C.load_json(src)
    raw_path = os.path.join(C.ROOT, "data", "raw", f"{day}.json")
    summ = {}
    if os.path.exists(raw_path):
        raw = C.load_json(raw_path)
        for a in (raw.get("items", []) if isinstance(raw, dict) else raw):
            summ[a.get("link")] = a.get("summary") or ""
    for p in load_pool(day):
        summ.setdefault(p.get("link"), p.get("summary") or "")
    need = {k: [dict(it, orig=it.get("title"), summary=summ.get(it.get("link"), ""))
                for it in d.get(k, []) if da_tradurre(it)] for k in KEYS}
    if not any(need.values()):
        print("tutte tradotte")
        return 0
    tr, esiti = traduci(need)
    for k in KEYS:
        byid = {x["id"]: tr[k].get(i) for i, x in enumerate(need[k]) if tr[k].get(i)}
        for it in d.get(k, []):
            t = byid.get(it.get("id"))
            if not t:
                continue
            it["orig"] = it["title"]
            it["title"] = t["titolo"].strip()
            if not it.get("nota") and (t.get("nota") or "").strip() and it.get("source") != "Hacker News":
                it["nota"] = t["nota"].strip()
    rest = sum(1 for k in KEYS for it in d.get(k, []) if da_tradurre(it))
    prima = d.get("_traduzione") or {}
    for k in KEYS:
        if need[k]:
            prima[k] = dict(esiti[k], ripresa=True)
    prima["il"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    d["_traduzione"] = prima
    C.save_json(src, d)
    merge(day)
    print(f"tradotte {sum(len(need[k]) for k in KEYS) - rest}, ne restano {rest}")
    return 0 if not rest else 2


def merge(day):
    """Ricopia le liste dentro l'edizione del giorno. Idempotente.

    Le immagini (images.py) vivono solo nella copia dentro l'edizione, mai nel
    file sorgente di rubriche.py: un merge che si limitasse a sovrascrivere
    cancellerebbe quelle immagini a ogni push.py successivo (il 7 ottobre 2026
    e' successo cosi': tre push.py di seguito hanno ripulito le foto di GAMES,
    TECH e SPAZIO una dopo l'altra). Si riapplicano per id dopo la copia.
    """
    src = os.path.join(DIR, f"{day}.json")
    dst = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not (os.path.exists(src) and os.path.exists(dst)):
        return False
    d, b = C.load_json(src), C.load_json(dst)
    changed = False
    for k in KEYS:
        if k not in d:
            continue
        images = {it["id"]: it["image"] for it in b.get(k) or [] if it.get("image")}
        new_list = d[k]
        for it in new_list:
            img = images.get(it.get("id"))
            if img and not it.get("image"):
                it["image"] = img
        if b.get(k) != new_list:
            b[k] = new_list
            changed = True
    if changed:
        C.save_json(dst, b)
    return changed


def main():
    ap = argparse.ArgumentParser(description="le rubriche GAMES, TECH, SPAZIO")
    ap.add_argument("date", nargs="?")
    ap.add_argument("--raw", help="file grezzo da usare (default data/raw/<giorno>.json)")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--debug", action="store_true")
    ap.add_argument("--merge", action="store_true", help="ricopia nell'edizione e basta")
    ap.add_argument("--traduci", action="store_true", help="rifa' solo le traduzioni che mancano")
    ap.add_argument("--senza-traduzione", action="store_true", help="non chiama Gemini (prove)")
    a = ap.parse_args()
    day = a.date or C.today()
    if a.merge:
        print("ricopiate nell'edizione" if merge(day) else "niente da ricopiare")
        return 0
    if a.traduci:
        return traduci_mancanti(day)
    raw = a.raw or os.path.join(C.ROOT, "data", "raw", f"{day}.json")
    if not os.path.exists(raw):
        sys.exit(f"Nessun grezzo per il {day}: lancia prima fetch.py.")
    run(raw, day, a.dry, a.debug, tradurre=not a.senza_traduzione)
    if not a.dry:
        merge(day)
    return 0


if __name__ == "__main__":
    sys.exit(main())
