#!/usr/bin/env python3
"""
Le rubriche: GAMES, TECH, SPAZIO.

Dal 2 ottobre 2026 l'app ha tre schede oltre ad APPLE e AI. Mike le ha
volute cosi':

* **Mai riempire.** Se le notizie buone sono tre, sono tre. Se sono due, la
  terza e' "ti sei perso": la cosa piu' calda della settimana che non e' gia'
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
(i candidati buoni degli ultimi otto giorni, da cui pesca "ti sei perso").
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
    r"offerta|sconto|coupon|miglior[ei] )", re.I)
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
             r"santa monica|insomniac|guerrilla|bluepoint|bend studio|astro bot)\b", 3.0),
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
        "nome": "Spazio", "max": 5, "soglia": 6.0,
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
    # un titolo vuoto di fatti — una domanda, un elenco — fa meno aprire
    if t.endswith("?") or re.match(r"^\d+ ", t):
        s -= 1.0
    return round(s, 2)


def cluster(items):
    """Lo stesso fatto detto da piu' testate. Il primo del gruppo e' il piu'
    alto di punteggio, e ogni testata in piu' vale 2,5 punti: e' il segno che
    la cosa ha girato."""
    items = sorted(items, key=lambda x: -x["_s"])
    groups = []
    for it in items:
        for g in groups:
            # stesso fatto raccontato con parole diverse: 0,4 contro ogni titolo del gruppo
            if any(C.similarity(it["title"], m["title"], cross_language=False) >= 0.4 for m in g):
                g.append(it)
                break
        else:
            groups.append([it])
    out = []
    for g in groups:
        rep = dict(g[0])
        fonti = {x["source"] for x in g}
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

def choose(rub, items, hist, pool, day, debug=False):
    cfg = RUBRICHE[rub]
    cand = []
    for a in items:
        s = score(rub, a)
        if s <= -5:
            continue
        a = dict(a)
        a["_s"] = s
        cand.append(a)
    groups = cluster(cand)
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


def gemini(items):
    key = ""
    try:
        import audio
        key = audio.secret("GEMINI_API_KEY")
    except Exception:
        pass
    if not key or not items:
        return {}
    body = PROMPT + "\n".join(
        json.dumps({"i": i, "titolo_originale": it["orig"], "sommario": (it.get("summary") or "")[:380]},
                   ensure_ascii=False) for i, it in enumerate(items))
    payload = json.dumps({"contents": [{"parts": [{"text": body}]}],
                          "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}).encode()
    import time
    for model in GEMINI_MODELS:
        for attempt in range(2):          # un 503 passa da solo: si riprova una volta
            try:
                req = urllib.request.Request(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    data=payload, headers={"x-goog-api-key": key, "Content-Type": "application/json"})
                d = json.load(urllib.request.urlopen(req, timeout=120))
                txt = d["candidates"][0]["content"]["parts"][0]["text"]
                arr = json.loads(txt)
                return {int(x["i"]): x for x in arr if isinstance(x, dict) and "i" in x}
            except Exception as e:
                print(f"  (traduzione: {model} non ha risposto: {str(e)[:60]})", file=sys.stderr)
                if "503" in str(e) or "429" in str(e):
                    time.sleep(6)
                else:
                    break
    return {}


def first_sentence(txt, n=150):
    txt = re.sub(r"\s+", " ", txt or "").strip()
    m = re.match(r"(.{20,%d}?[.!?])(\s|$)" % n, txt)
    return (m.group(1) if m else txt[:n].rsplit(" ", 1)[0] + ("…" if len(txt) > n else "")).strip()


def shape(rub, g, tr, top):
    orig = g.get("orig") or g["title"]
    title = (tr.get("titolo") or "").strip() or orig
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
        "title": title, "orig": orig if orig != title else None, "nota": nota,
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

def run(raw_path, day, dry=False, debug=False):
    raw = C.load_json(raw_path)
    arts = raw.get("items", []) if isinstance(raw, dict) else raw
    # Hacker News non e' una testata: porta l'argomento di cui discute e i punti
    hist, pool = history(day), load_pool(day)
    result, plan, newpool = {}, {}, []
    for rub in KEYS:
        items = [dict(a, orig=a["title"]) for a in arts if a.get("tier") == rub]
        # il titolo che cerchiamo e' quello originale, che resta
        good, persi, groups = choose(rub, items, hist, pool, day, debug)
        plan[rub] = (good, persi)
        for g in groups:
            if g["_s"] >= RUBRICHE[rub]["soglia"] - 1:
                newpool.append({"rub": rub, "title": g["title"], "orig": g["orig"], "link": g["link"],
                                "source": g["source"], "score": g["_s"], "date": day,
                                "summary": (g.get("summary") or "")[:380], "age_hours": g["age_hours"]})
    flat = [(rub, g) for rub in KEYS for g in plan[rub][0] + plan[rub][1]]
    need = [g for rub, g in flat if g["source"] not in LANG_IT]
    tr = gemini(need)
    by_id = {id(g): tr.get(i, {}) for i, g in enumerate(need)}
    if need and not tr:
        print("  Gemini non ha risposto: titoli e note restano nella lingua della fonte.", file=sys.stderr)
    for rub in KEYS:
        good, persi = plan[rub]
        rows = [shape(rub, g, by_id.get(id(g), {}), top=i < 3) for i, g in enumerate(good)]
        rows += [shape(rub, g, by_id.get(id(g), {}), top=False) for g in persi]
        result[rub] = rows

    for rub in KEYS:
        print(f"\n== {RUBRICHE[rub]['nome']} — {len(plan[rub][0])} buone" +
              (f" + {len(plan[rub][1])} «ti sei perso»" if plan[rub][1] else "") + " ==")
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


def merge(day):
    """Ricopia le liste dentro l'edizione del giorno. Idempotente."""
    src = os.path.join(DIR, f"{day}.json")
    dst = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not (os.path.exists(src) and os.path.exists(dst)):
        return False
    d, b = C.load_json(src), C.load_json(dst)
    changed = False
    for k in KEYS:
        if k in d and b.get(k) != d[k]:
            b[k] = d[k]
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
    a = ap.parse_args()
    day = a.date or C.today()
    if a.merge:
        print("ricopiate nell'edizione" if merge(day) else "niente da ricopiare")
        return 0
    raw = a.raw or os.path.join(C.ROOT, "data", "raw", f"{day}.json")
    if not os.path.exists(raw):
        sys.exit(f"Nessun grezzo per il {day}: lancia prima fetch.py.")
    run(raw, day, a.dry, a.debug)
    if not a.dry:
        merge(day)
    return 0


if __name__ == "__main__":
    sys.exit(main())
