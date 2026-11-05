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
KEYS = ("games", "spazio")        # la scheda Tech e' stata tolta il 5 novembre 2026

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

SCIENZA_TEMA = (
    r"\b(space|spazio|nasa|esa|spacex|rocket|razzo|orbit\w*|launch\w*|lancio|satellit\w*|astronaut\w*|moon|luna|mars|marte|"
    r"planet\w*|pianet\w*|star|stell\w*|galax\w*|galassi\w*|nebula|nebulosa|comet\w*|asteroid\w*|black hole|buco nero|"
    r"universe|universo|cosmic\w*|cosmo|telescop\w*|hubble|webb|jwst|artemis|starship|eclipse|eclissi|aurora\w*|sun|sole|swift|"
    r"science|scienz\w*|scientists?|scienziat\w*|study|studio|research\w*|ricerca|ricercator\w*|discover\w*|scopert\w*|"
    r"species|specie|fossil\w*|dinosaur\w*|evol\w+|animal\w*|dna|gene\w*|genom\w*|brain|cervello|cells?|cellul\w*|"
    r"virus|vaccin\w*|cancer|cancro|tumou?r\w*|trial|drug|farmac\w*|heart|cuore|health|salute|disease|patient\w*|medic\w*|"
    r"alzheimer|diabet\w*|obesity|ozempic|aging|ageing|sleep|nutrition|diet|milk|latte|meat|dairy|plant-based|"
    r"physic\w*|fisic\w*|quantum|quantist\w*|particle\w*|cern|nuclear|uranium|laser|fusion|atom\w*|chemi\w*|chimic\w*|molecul\w*|"
    r"climate|clima|weather|el ni[nñ]o|storm|typhoon|volcan\w*|vulcan\w*|earthquake|terremoto|glacier\w*|flood\w*|rain\w*|"
    r"ocean\w*|seas?|polar|ancient|archaeolog\w*|archeolog\w*|roman|tribe|mummy|tomb|"
    r"aircraft|flight|plane|aereo|volo|crash|engine|motore|battery|batteria|reactor|robot\w*|energy|energia|"
    r"dog|dogs|cats?|bird\w*|whale\w*|dolphin\w*|insect\w*|bee|bees|chihuahua\w*|coyote|wildlife|ecosystem\w*|pollution|plastic)\b")

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
    "spazio": {
        # la chiave resta "spazio" (gironi, archivio, segnali), la scheda si chiama Scienza:
        # «una rivista che mette dentro un po' di tutto» — notizie e scoperte recenti, le cose
        # di cui parlano tutti. Mai «lo sapevi che». L'AI ha la sua scheda.
        "nome": "Scienza", "max": 10, "soglia": 4.2,
        "fonti": {"Nature": 2.5, "Science": 2.5, "Quanta Magazine": 2.4, "Science News": 2.2,
                  "Scientific American": 1.8, "Guardian Science": 2.2, "Guardian Environment": 1.4,
                  "BBC Science": 2.0, "BBC Health": 1.2, "NYT Science": 2.4, "NYT Health": 1.6,
                  "STAT": 0.8, "MIT News": 1.2, "The Conversation": 1.0, "Wired Science": 2.0,
                  "Ars Technica Scienza": 2.4, "Il Post Scienza": 2.2, "ANSA Scienza": 2.0,
                  "Media INAF": 2.0, "ESA": 2.0, "NASA": 1.0, "NASA APOD": 2.0},
        "tema": SCIENZA_TEMA,
        "boost": [
            (r"\b(discover(s|ed|y|ies)?|reveal(s|ed)?|found|finds?|first|record|never before|unexpected|surpris\w+|"
             r"mystery|hidden|evolv\w+|breakthrough|new study|researchers?|scientists?|"
             r"scopert\w+|rivela\w*|primo|prima|record|inatteso|mistero|ricercatori|studio)\b", 1.6),
            (r"\b(trial|clinical|journal|peer-reviewed|phase [123]|fda approv\w+|approved)\b", 1.0),
            (r"\b(dinosaur\w*|dinosaur[oi]|fossil\w*|ancient|archaeolog\w+|dna|genom\w+|species|specie|extinct\w*)\b", 1.4),
            (r"\b(webb|hubble|jwst|artemis|starship|mars|marte|moon|luna|black hole|buco nero|exoplanet|esopianeta|"
             r"asteroid\w*|comet\w*|supernova|galax\w+|nebula|eclipse|aurora|telescope|telescopio|swift)\b", 1.4),
            (r"\b(particle|quantum|cern|physics|fisic\w+|quantist\w+|nuclear|uranium|laser|fusion|superconduct\w+)\b", 1.4),
            (r"\b(el ni[nñ]o|volcan\w+|vulcan\w+|supervolc\w+|earthquake|terremoto|storm|typhoon|glacier|"
             r"ghiacciai\w*|flood|wettest|heatwave|polar vortex|meteo\w*)\b", 1.2),
            (r"\b(brain|cervello|heart|cuore|cancer|tumou?r\w*|alzheimer|diabet\w+|obesity|ozempic|vaccin\w+|"
             r"antibiotic\w*|aging|ageing|sleep|nutrition|diet|milk|latte|meat)\b", 1.0),
        ],
        "penalita": [
            # politica e potere: i midterm riempiono STAT, The Conversation e Scientific American
            (r"\b(midterms?|election\w*|elezion\w+|trump|biden|harris|democrat\w*|republican\w*|congress|senate|"
             r"white house|administration|maha|blue wave|voters?|super pac|lame duck|sanders|wyden|iran|war)\b", -8.0),
            # affari della sanita' e della farma, che non sono scoperte
            (r"\b(medicare|medicaid|cvs|insurer\w*|reimbursement|merger|stock market|stocks|share price|earnings|layoffs?|"
             r"funding bill|startup|raises|valuation|commercial debut|cuts staff|executive|alleges)\b", -4.0),
            (r"\b(awards? |contract|procurement|appalt|premio|prin |nomin\w+|student[si]?\b|inspiration tour|"
             r"space grant|remembrances|has died|obituary|podcast|opinion:|country diary|video)\b", -3.5),
            (r"\b(nhs|midwives|trust buildings|health trust|care home|council)\b", -3.0),
            (r"stat\+:", -3.0),                      # articoli a pagamento di STAT
            (r"\b(10 things|what'?s up|skywatching tips)\b", -1.0),
        ],
    },
}
# la disciplina: l'occhiello della voce in Scienza
DISCIPLINE = [
    ("spazio", r"\b(space|spazio|nasa|esa|mars|marte|moon|luna|telescop\w+|orbit\w*|asteroid\w*|galax\w+|planet\w*|pianet\w+|"
               r"exoplanet|esopianet\w+|comet\w*|black hole|buco nero|jwst|hubble|webb|swift|artemis|star|stell\w+|nebula|eclips\w+|"
               r"aurora\w*|meteor\w*|satellit\w+|astronom\w+|astrofisic\w+|universe|universo|cosmic\w*|enceladus|sun|sole)\b"),
    ("medicina", r"\b(cancer|tumou?r\w*|drug|trial|vaccin\w+|disease|patient\w*|health|brain|cervello|heart|cuore|"
                 r"alzheimer|diabet\w+|fda|surgery|clinical|antibiotic\w*|ozempic|obesity|estrogen|aging|ageing|sleep|"
                 r"nutrition|deficienc\w+|micronutrient\w*|diagnos\w+|farmac\w+|salute|medic\w+|measles|cocaine|childbirth|"
                 r"iron|milk|latte|dairy|diet)\b"),
    ("fisica", r"\b(particle|quantum|physic\w*|fisic\w+|quantist\w+|cern|zeptovers\w*|nuclear|uranium|laser|atom\w*|fusion|superconduct\w+|einstein)\b"),
    ("terra", r"\b(climate|clima|weather|el ni[nñ]o|storm|typhoon|volcan\w+|vulcan\w+|supervolc\w+|earthquake|terremoto|"
              r"glacier|ghiacciai\w*|flood|rain\w*|wettest|ocean\w*|sea|seas|polar|vortex|heatwave|drought|meteo\w*|fish kill|pollution|plastic)\b"),
    ("tecnica", r"\b(aircraft|flight|plane|aereo|volo|crash|engine|motore|battery|batteria|reactor|reattore|robot\w*|energy|energia|"
                r"x-70|navigation|car|auto|vehicle|rocket|razzo|chip|computer)\b"),
    ("storia", r"\b(ancient|archaeolog\w+|archeolog\w+|roman\w*|medieval|history|historians?|tribe|barbarian|king|queen|mummy|"
               r"tomb|bronze age|neolithic|civili[sz]ation)\b"),
    ("natura", r"\b(species|specie|animal\w*|dinosaur\w*|dinosaur[oi]|fossil\w*|evolv\w+|evolution|dna|genom\w+|gene|genes|bird\w*|"
               r"dog|dogs|cats?|chihuahua\w*|coyote|wildlife|plant\w*|forest\w*|insect\w*|bee|bees|whale\w*|dolphin\w*|"
               r"extinct\w*|ecosystem\w*|marine|fauna|flora|snake\w*|fungi|fungus|mushroom\w*|earwax)\b"),
]


def disciplina(title):
    low = (title or "").lower()
    for nome, rx in DISCIPLINE:
        if re.search(rx, low, re.I):
            return nome
    return "scienza"


# ---- Games: PlayStation, il resto, e GTA VI a parte (5 novembre 2026)
PS_RX = re.compile(
    r"\b(ps5|ps6|ps4|playstation|state of play|ps plus|psvr\w*|sony interactive|naughty dog|santa monica|insomniac|"
    r"guerrilla|bluepoint|bend studio|astro bot|god of war|ghost of|horizon|spider-man|gran turismo|"
    r"the last of us|returnal|ratchet|death stranding|intergalactic|wolverine|marathon|uncharted|bungie|pssr)\b", re.I)
GTA_RX = re.compile(r"\bGTA\b|grand theft auto|rockstar|vice city|\bleonida\b|\blucia\b|take-two|zelnick", re.I)
# titoli su GTA che non sono notizie
GTA_NO = re.compile(r"unlocked \d+|makeover|club space|podcast|reaction|meme|mod\b|fan[- ]?made|wallpaper|"
                    r"giveaway|tier list|where to buy|price of|preorder bonus", re.I)
GTA_FORTI = {"IGN", "GamesIndustry.biz", "VGC", "Eurogamer", "GameSpot", "Insider Gaming", "GamesRadar", "Polygon",
             "Kotaku", "PlayStation Blog", "Game Informer", "Push Square", "Everyeye"}
GTA_MAX = 5
# i feed che portano ore e punti: scritti in un modo che solo noi capiamo
HN = re.compile(r"Points:\s*(\d+)", re.I)
HN_C = re.compile(r"#\s*Comments:\s*(\d+)", re.I)
CANDIDATI = 18          # quanti candidati per scheda passano al redattore Opus
MAX_SATURI = 2          # storie "di cui parlano tutti da giorni": al massimo due
MIN_TOP = 3             # sotto questa soglia di voci buone, si completa con "ti sei perso"
POOL_DAYS = 8
LANG_IT = {"Media INAF", "Il Post Scienza", "ANSA Scienza", "Everyeye"}


# ---------------------------------------------------------------- Google News

def gn_prepara(a):
    """Le voci di Google News arrivano come «Titolo - Testata» con un indirizzo di
    rinvio. La testata vera diventa la fonte (cosi' conta come una testata in piu'
    quando altri la raccontano), il titolo si ripulisce. Segna se e' italiana."""
    if not str(a.get("source", "")).startswith("Google News"):
        return a
    a = dict(a)
    t = a.get("title", "")
    m = re.match(r"^(.*\S)\s+[-–—]\s+([^-–—]{2,40})$", t)
    if m:
        a["title"], a["source"] = m.group(1).strip(), m.group(2).strip()
    else:
        a["source"] = "Google News"
    a["_gn"] = True
    a["_it"] = str(a.get("_origine", "")).endswith("Scienza")
    return a


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
    if rub == "spazio" and AI_WORDS.search(t) and not re.search(r"\b(brain|cervello|drug|cancer|dna|protein\w*|climate|physics)\b", low):
        return -9.0            # l'AI ha la sua scheda
    # Tech e Scienza: senza una parola del tema non e' una voce della scheda
    if cfg.get("tema") and not re.search(cfg["tema"], low, re.I):
        return -9.0
    # la scienza invecchia piano: una scoperta di ieri e' ancora una notizia
    h = a["age_hours"]
    s = cfg["fonti"].get(a["source"], 0.8) + (fresh(h) if rub != "spazio" else 3.0 if h < 12 else 2.2 if h < 24 else 1.2 if h < 36 else 0.0)
    if a.get("_gn"):
        s += 1.5               # Google News ordina per quanto gira: e' il segnale «ne parlano tutti»
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
    if rub == "tech" and FUORI_TEMA.search(t):
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
        rep["_links"] = [x["link"] for x in g if x["link"] != rep["link"]][:4]
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

def compose(rub, good, tetto):
    """Dalla lista ordinata per punteggio alla scelta finale.

    Games: almeno quattro voci PlayStation se ci sono (la scheda ha PS5 in testa), il resto
    generico. Scienza: mai piu' di tre per disciplina e di due per testata, cosi' non diventa
    la scheda di un solo argomento."""
    if rub == "games":
        ps = [g for g in good if PS_RX.search(g["title"])]
        resto = [g for g in good if not PS_RX.search(g["title"])]
        scelti = ps[:4] + resto[:max(0, tetto - len(ps[:4]))]
        if len(scelti) < tetto:
            scelti += [g for g in ps[4:]][:tetto - len(scelti)]
        return sorted(scelti, key=lambda x: -x["_s"])[:tetto]
    if rub == "spazio":
        da, per_testata, out = {}, {}, []
        for g in good:
            d = disciplina(g["title"])
            if da.get(d, 0) >= 3 or per_testata.get(g["source"], 0) >= 2:
                continue
            da[d] = da.get(d, 0) + 1
            per_testata[g["source"]] = per_testata.get(g["source"], 0) + 1
            out.append(g)
            if len(out) >= tetto:
                break
        return out
    return good[:tetto]


def gta_scelta(items, hist, rare, altri):
    """GTA VI a parte: fino a cinque voci, solo se c'e' una notizia (mai riempire).
    Esce l'11 novembre 2026 +8: oggi ne parlano tutti, quindi si chiede che la cosa sia
    detta da piu' testate, o da una forte e fresca; e non e' gia' uscita nei giorni prima."""
    cand = []
    for a in items:
        if not GTA_RX.search(a["title"]) or GTA_NO.search(a["title"]):
            continue
        a = dict(a)
        a["_s"] = round(RUBRICHE["games"]["fonti"].get(a["source"], 1.0) + fresh(a["age_hours"]) +
                        (1.0 if a["source"] in GTA_FORTI else 0.0), 2)
        cand.append(a)
    prev = [t for t, _, _ in hist["games"]]
    shown = {C.norm_url(l) for _, l, _ in hist["games"]}
    out = []
    for g in cluster(cand, rare, []):
        if g["_n"] < 2 and not (g["source"] in GTA_FORTI and g["age_hours"] < 12):
            continue
        if C.norm_url(g["link"]) in shown or any(C.similarity(g["title"], t, cross_language=False) >= 0.5 for t in prev):
            continue
        g["_gta"] = True
        out.append(g)
    return sorted(out, key=lambda x: -x["_s"])[:GTA_MAX]


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
    ordinati = sorted(good, key=lambda x: -x["_s"])
    good = compose(rub, ordinati, cfg["max"])

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
    # la rosa per il redattore delle schede (agente `schede`, Opus): piu' larga della scelta,
    # perche' sia lui a decidere le dieci leggendo gli articoli
    choose.candidati = ordinati[:CANDIDATI]
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
    if g["source"] in LANG_IT or g.get("_it"):
        title, nota = orig, first_sentence(g.get("summary"))
    it = {
        "id": hashlib.sha1(g["link"].encode()).hexdigest()[:8],
        # `orig` c'e' sempre quando il titolo e' tradotto (anche se uguale, un nome
        # proprio): senza, la voce e' ancora da tradurre e il lint lo dice
        "title": title, "orig": orig if tradotto and not (g["source"] in LANG_IT or g.get("_it")) else None, "nota": nota,
        "source": g["source"], "link": g["link"],
        "ore": int(g.get("age_hours", 0)), "score": g["_s"],
    }
    if rub == "spazio":
        it["disciplina"] = disciplina(orig)
    if rub == "games":
        it["gruppo"] = "gta" if g.get("_gta") else ("playstation" if PS_RX.search(orig) else "generico")
    if g["source"] in LANG_IT or g.get("_it"):
        it["lingua"] = "it"
    if g.get("_links"):
        it["extra_links"] = g["_links"]
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
    # Google News: la testata vera al posto di «Google News», titolo ripulito
    arts = [gn_prepara(dict(a, _origine=a.get("source"))) for a in arts]
    rare = rari([a.get("title", "") for a in arts])
    result, plan, newpool = {}, {}, []
    gta, rosa = [], {}
    for rub in KEYS:
        items = [dict(a, orig=a["title"]) for a in arts if a.get("tier") == rub]
        if rub == "games":
            # GTA VI ha la sua sezione: via dalla lista, e si sceglie a parte
            gta = gta_scelta(items, hist, rare, arts)
            items = [a for a in items if not GTA_RX.search(a["title"])]
        # il titolo che cerchiamo e' quello originale, che resta
        good, persi, groups = choose(rub, items, hist, pool, day, debug, rare, arts)
        plan[rub] = (good, persi)
        rosa[rub] = list(choose.candidati)
        for g in groups:
            if g["_s"] >= RUBRICHE[rub]["soglia"] - 1:
                newpool.append({"rub": rub, "title": g["title"], "orig": g["orig"], "link": g["link"],
                                "source": g["source"], "score": g["_s"], "date": day,
                                "summary": (g.get("summary") or "")[:380], "age_hours": g["age_hours"]})
    need = {rub: [g for g in plan[rub][0] + plan[rub][1] + (gta if rub == "games" else [])
                  if g["source"] not in LANG_IT and not g.get("_it")] for rub in KEYS}
    if tradurre:
        tr, esiti = traduci(need)
    else:
        tr, esiti = {r: {} for r in KEYS}, {r: {"esito": "saltata", "modello": None} for r in KEYS}
    by_id = {id(g): tr[rub].get(i, {}) for rub in KEYS for i, g in enumerate(need[rub])}
    if any(need.values()) and not any(tr.values()):
        print("  Gemini non ha risposto: titoli e note restano nella lingua della fonte "
              "(chiudi.py prepara riprova con rubriche.py --traduci).", file=sys.stderr)
    result["_traduzione"] = dict(esiti, il=datetime.now(timezone.utc).isoformat(timespec="seconds"))
    # la rosa, non tradotta: la scrive l'agente `schede` (vedi merge)
    result["candidati"] = {rub: [dict(shape(rub, g, {}, top=False), summary=(g.get("summary") or "")[:500])
                                 for g in rosa[rub]] for rub in KEYS}
    for rub in KEYS:
        good, persi = plan[rub]
        rows = [shape(rub, g, by_id.get(id(g), {}), top=i < 3) for i, g in enumerate(good)]
        rows += [shape(rub, g, by_id.get(id(g), {}), top=False) for g in persi]
        result[rub] = rows
        if rub == "games":
            # GTA VI ha la sua sezione: le notizie sono solo i candidati per l'agente `gta`
            # (pipeline/gta.py) e il ripiego se l'agente non gira
            result["gta"] = [shape(rub, g, by_id.get(id(g), {}), top=False) for g in gta]

    for rub in KEYS:
        print(f"\n== {RUBRICHE[rub]['nome']} — {len(plan[rub][0])} buone" +
              (f" + {len(plan[rub][1])} «dalla settimana»" if plan[rub][1] else "") + " ==")
        for it in result[rub]:
            tag = "★" if it.get("top") else ("↺" if it.get("perso") else " ")
            print(f" {tag} {it['score']:5.1f} {it['source'][:13]:13} {(it.get('gruppo') or it.get('disciplina') or '')[:11]:11} {it['title'][:76]}"
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
    return not it.get("orig") and it.get("source") not in LANG_IT and it.get("lingua") != "it"


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


def scritte_opus(day, d):
    """La prosa dell'agente `schede` (Opus), se c'e': data/rubriche/<giorno>-scritte.json.

    L'agente sceglie fra i candidati per id, nell'ordine in cui li vuole, e scrive titolo e
    riga in italiano dall'articolo letto. Puo' unire due candidati che raccontano lo stesso
    fatto (`anche`: gli id degli altri), anche in lingue diverse: i loro link diventano
    extra_links e contano come testate. Tutto il resto (link, fonte, ore, disciplina, gruppo)
    viene dal candidato: l'agente non lo riscrive. Torna {scheda: lista} o {}."""
    p = os.path.join(DIR, f"{day}-scritte.json")
    if not os.path.exists(p):
        return {}
    try:
        w = C.load_json(p)
    except ValueError:
        print("  scritte di Opus illeggibili: resta la scelta dello script", file=sys.stderr)
        return {}
    cand = d.get("candidati") or {}
    out = {}
    for k in KEYS:
        if not isinstance(w.get(k), list):
            continue
        pool = {c["id"]: c for c in (cand.get(k) or []) + (d.get(k) or []) if c.get("id")}
        lista = []
        for i, v in enumerate(w[k]):
            base = dict(pool.get(v.get("id")) or {})
            if not base or not (v.get("title") or "").strip():
                continue
            base.pop("summary", None)
            if not base.get("orig") and base.get("lingua") != "it":
                base["orig"] = base["title"]          # l'originale resta, in piccolo
            base["title"] = v["title"].strip()
            base["nota"] = (v.get("nota") or "").strip()
            if v.get("gruppo") in ("playstation", "generico"):
                base["gruppo"] = v["gruppo"]
            if v.get("disciplina"):
                base["disciplina"] = v["disciplina"]
            extra = list(base.get("extra_links") or [])
            for a in v.get("anche") or []:
                o = pool.get(a)
                if o and o.get("link") and o["link"] not in extra:
                    extra.append(o["link"])
            if extra:
                base["extra_links"] = extra[:6]
            if v.get("anche"):
                base["testate"] = max(base.get("testate") or 1, 1) + len(v["anche"])
            base["top"] = i < 3 or None
            base["scritta"] = "opus"
            lista.append({kk: vv for kk, vv in base.items() if vv is not None})
        out[k] = lista[:RUBRICHE[k]["max"]]
    return out


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
    if not os.path.exists(dst):
        return False
    d, b = (C.load_json(src) if os.path.exists(src) else {}), C.load_json(dst)
    changed = False
    scritte = scritte_opus(day, d)
    for k, dst_key in [(k, k) for k in KEYS] + [("gta", "gta_notizie")]:
        if k in scritte:
            d = dict(d, **{k: scritte[k]})
        if k not in d:
            continue
        images = {it["id"]: it["image"] for it in b.get(dst_key) or [] if it.get("image")}
        new_list = d[k]
        for it in new_list:
            img = images.get(it.get("id"))
            if img and not it.get("image"):
                it["image"] = img
        if b.get(dst_key) != new_list:
            b[dst_key] = new_list
            changed = True
    # GTA VI: la sezione la scrive l'agente `gta` in un file suo (data/gta/<giorno>-sezione.json),
    # per non toccare l'edizione mentre la scrivono il redattore e la regia. Qui entra, con le
    # foto gia' messe da images.py ritrovate per id.
    sez = os.path.join(C.ROOT, "data", "gta", f"{day}-sezione.json")
    if os.path.exists(sez):
        try:
            g = C.load_json(sez)
        except ValueError:
            g = None
        if isinstance(g, dict):
            # la foto vera di un post Reddit e' la miniatura del feed, che sta nel dossier
            try:
                dos = C.load_json(os.path.join(C.ROOT, "data", "gta", f"{day}.json"))
                foto = {C.norm_url(r.get("link", "")): r.get("immagine") for r in dos.get("reddit", []) if r.get("immagine")}
            except (OSError, ValueError):
                foto = {}
            for v in g.get("voci") or []:
                f = foto.get(C.norm_url(v.get("link", "")))
                if f and not v.get("image_src"):
                    v["image_src"] = f.replace("&amp;", "&")
            prima = {v.get("id"): v.get("image") for v in (b.get("gta") or {}).get("voci") or [] if v.get("image")}
            for v in g.get("voci") or []:
                if not v.get("image") and prima.get(v.get("id")):
                    v["image"] = prima[v["id"]]
            if b.get("gta") != g:
                b["gta"] = g
                changed = True
    # La scheda AI (dal 5 novembre 2026): la scrive l'agente `ai` in data/ai/<giorno>-sezione.json.
    # Prende il posto di quella della regia, che resta solo come ripiego; le foto gia' prese
    # si ritrovano per id o per link.
    ai_p = os.path.join(C.ROOT, "data", "ai", f"{day}-sezione.json")
    if os.path.exists(ai_p):
        try:
            nuova = (C.load_json(ai_p) or {}).get("ai")
        except ValueError:
            nuova = None
        if isinstance(nuova, list) and nuova:
            # l'agente lavora in parallelo al redattore e non vede le notizie: una voce AI che
            # ripete una notizia Apple dell'edizione (stesso link, o lo stesso fatto) si toglie qui
            notizie = b.get("news") or []
            link_news = set()
            for n in notizie:
                link_news.add(C.norm_url(n.get("link", "")))
                for x in n.get("extra_links") or []:
                    link_news.add(C.norm_url(x.get("url") if isinstance(x, dict) else x))
            tenute = []
            for v in nuova:
                doppia = C.norm_url(v.get("link", "")) in link_news or any(
                    C.similarity(v.get("title", ""), n.get("title", ""), cross_language=False) >= 0.30
                    and re.search(r"\bapple\b", (v.get("title", "") + " " + (v.get("apple") or "")).lower())
                    for n in notizie)
                if doppia:
                    print(f"  AI: tolta «{v.get('title', '')[:60]}», c'e' gia' fra le notizie", file=sys.stderr)
                else:
                    tenute.append(v)
            nuova = tenute
            foto = {}
            for v in b.get("ai") or []:
                if v.get("image"):
                    foto[v.get("id")] = v["image"]
                    foto[C.norm_url(v.get("link", ""))] = v["image"]
            for v in nuova:
                img = foto.get(v.get("id")) or foto.get(C.norm_url(v.get("link", "")))
                if img and not v.get("image"):
                    v["image"] = img
            if b.get("ai") != nuova:
                b["ai"] = nuova
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
