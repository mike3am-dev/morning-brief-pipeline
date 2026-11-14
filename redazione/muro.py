"""
Il muro delle notizie della redazione: i dati per la mappa, i mercati, i feed e i canali.

Tutto viene dai file della corsa (si legge soltanto):

- la mappa: da dove scrivono le testate che oggi hanno portato articoli (il grezzo), e dove nascono
  le notizie in apertura (il campo `origine`). Le sedi sono quelle note delle testate; le raccolte
  di Google News e le testate di cui non so la sede restano «senza luogo», e lo si dice;
- la borsa: la chiusura di AAPL che la corsa mette nell'edizione;
- le discussioni: la sezione «social» dell'edizione;
- i canali: i primi titoli delle altre schede (AI, Games, Scienza, GTA VI).
"""
import re

LUOGHI = {   # nome sul muro: (longitudine, latitudine)
    "Silicon Valley": (-122.2, 37.5), "Seattle": (-122.2, 47.6), "Los Angeles": (-118.3, 34.0),
    "New York": (-74.0, 40.7), "Boston": (-71.1, 42.4), "Washington": (-77.0, 38.9),
    "Virginia": (-77.5, 37.6), "Carolina del Nord": (-78.8, 35.8), "Minneapolis": (-93.3, 45.0),
    "Regno Unito": (-0.5, 51.6), "Parigi": (2.3, 48.9), "Germania": (12.4, 51.3),
    "Milano": (9.2, 45.5), "Roma": (12.5, 41.9), "Sofia": (23.3, 42.7),
    "Tokyo": (139.7, 35.7), "Kyoto": (135.8, 35.0), "Seul": (127.0, 37.5),
    "Taipei": (121.5, 25.0), "Shenzhen": (114.1, 22.5), "Pechino": (116.4, 39.9),
}

SEDI = {   # testata (come in data/sources.json): luogo
    "OpenAI": "Silicon Valley", "Anthropic cookbook": "Silicon Valley", "Apple Developer": "Silicon Valley",
    "Apple Developer Releases": "Silicon Valley", "Apple Machine Learning": "Silicon Valley",
    "Apple Newsroom": "Silicon Valley", "NVIDIA Blog": "Silicon Valley", "Google AI Blog": "Silicon Valley",
    "TechCrunch": "Silicon Valley", "TechCrunch AI": "Silicon Valley", "Wired AI": "Silicon Valley",
    "Wired Science": "Silicon Valley", "GameSpot": "Silicon Valley", "IGN": "Silicon Valley",
    "PlayStation Blog": "Silicon Valley", "Simon Willison": "Silicon Valley", "Latent Space": "Silicon Valley",
    "Import AI": "Silicon Valley", "ZDNet AI": "Silicon Valley",
    "BGR": "Los Angeles",
    "The Verge": "New York", "The Verge AI": "New York", "Engadget": "New York", "Gizmodo": "New York",
    "Kotaku": "New York", "Polygon": "New York", "Ars Technica": "New York", "Ars Technica AI": "New York",
    "Ars Technica Gadget": "New York", "Ars Technica Scienza": "New York", "Scientific American": "New York",
    "NYT Science": "New York", "NYT Health": "New York", "IEEE Spectrum Robotica": "New York",
    "Quanta Magazine": "New York", "MKBHD": "New York",
    "STAT": "Boston", "MIT News": "Boston", "MIT News AI": "Boston", "MIT Technology Review AI": "Boston",
    "NASA": "Washington", "NASA APOD": "Washington", "Science": "Washington", "Science News": "Washington",
    "MacRumors": "Virginia", "Game Informer": "Minneapolis",
    "Guardian Environment": "Regno Unito", "Guardian Science": "Regno Unito", "BBC Science": "Regno Unito",
    "BBC Health": "Regno Unito", "Nature": "Regno Unito", "Google DeepMind": "Regno Unito",
    "GamesRadar": "Regno Unito", "TechRadar": "Regno Unito", "Eurogamer": "Regno Unito",
    "Rock Paper Shotgun": "Regno Unito", "GamesIndustry.biz": "Regno Unito", "VGC": "Regno Unito",
    "Push Square": "Regno Unito", "Nintendo Life": "Regno Unito",
    "ESA": "Parigi", "The Decoder": "Germania", "GSMArena": "Sofia",
    "DDay.it": "Milano", "Tom's Hardware IT": "Milano", "Macitynet": "Milano", "Il Post Scienza": "Milano",
    "ANSA Scienza": "Roma", "Media INAF": "Roma",
}

ORIGINI = [   # chi ha dato la notizia per primo (il campo `origine`), a pezzi di nome: luogo
    ("apple", "Silicon Valley"), ("google", "Silicon Valley"), ("nvidia", "Silicon Valley"),
    ("openai", "Silicon Valley"), ("anthropic", "Silicon Valley"), ("meta", "Silicon Valley"),
    ("cnet", "Silicon Valley"), ("techcrunch", "Silicon Valley"), ("the information", "Silicon Valley"),
    ("wired", "Silicon Valley"), ("tesla", "Silicon Valley"), ("qualcomm", "Los Angeles"),
    ("microsoft", "Seattle"), ("amazon", "Seattle"), ("valve", "Seattle"),
    ("bloomberg", "New York"), ("gurman", "New York"), ("the verge", "New York"),
    ("new york times", "New York"), ("wall street journal", "New York"), ("engadget", "New York"),
    ("rockstar", "New York"), ("take-two", "New York"), ("idc", "Boston"),
    ("macrumors", "Virginia"), ("epic", "Carolina del Nord"),
    ("reuters", "Regno Unito"), ("financial times", "Regno Unito"), ("bbc", "Regno Unito"), ("arm", "Regno Unito"),
    ("commissione", "Parigi"), ("hdblog", "Milano"), ("dday", "Milano"), ("macitynet", "Milano"),
    ("samsung", "Seul"), ("lg", "Seul"), ("the elec", "Seul"), ("etnews", "Seul"),
    ("sony", "Tokyo"), ("nikkei", "Tokyo"), ("nintendo", "Kyoto"), ("kuo", "Taipei"),
    ("tsmc", "Taipei"), ("foxconn", "Taipei"), ("digitimes", "Taipei"),
    ("huawei", "Shenzhen"), ("weibo", "Pechino"), ("digital chat station", "Pechino"), ("xiaomi", "Pechino"),
]


def _luogo_di_origine(origine):
    o = (origine or "").lower()
    for pezzo, luogo in ORIGINI:
        if re.search(r"(?<![a-zà-ù])" + re.escape(pezzo) + r"(?![a-zà-ù])", o):
            return luogo
    return None


def mappa(raw, news):
    """I punti sul muro: i luoghi da cui scrivono le testate (con quanti articoli oggi) e le
    notizie in apertura messe sul luogo da cui vengono."""
    per, senza = {}, 0
    for x in (raw or {}).get("items") or []:
        luogo = SEDI.get(x.get("source"))
        if not luogo:
            senza += 1
            continue
        p = per.setdefault(luogo, {"articoli": 0, "testate": {}})
        p["articoli"] += 1
        p["testate"][x["source"]] = p["testate"].get(x["source"], 0) + 1
    luoghi = []
    for nome, p in sorted(per.items(), key=lambda kv: -kv[1]["articoli"]):
        lon, lat = LUOGHI[nome]
        primi = [k for k, _ in sorted(p["testate"].items(), key=lambda kv: -kv[1])[:3]]
        luoghi.append({"luogo": nome, "lon": lon, "lat": lat, "articoli": p["articoli"],
                       "testate": len(p["testate"]), "nomi": primi})
    calde = []
    for n in (news or [])[:6]:
        luogo = _luogo_di_origine(n.get("origine"))
        if luogo:
            lon, lat = LUOGHI[luogo]
            calde.append({"rank": n.get("rank"), "luogo": luogo, "lon": lon, "lat": lat,
                          "origine": n.get("origine"), "titolo": n.get("title")})
    return {"luoghi": luoghi, "calde": calde, "senza_luogo": senza,
            "nota": "le sedi note delle testate; Google News e le testate senza una sede nota restano fuori"}


def borsa(brief):
    b = (brief or {}).get("borsa") or {}
    if b.get("chiusura") is None:
        return None
    return {k: b.get(k) for k in ("simbolo", "chiusura", "variazione", "data", "serie", "fonte")}


def discussioni(brief):
    return [{"titolo": x.get("title"), "dove": x.get("source"), "nuovo": x.get("origine") == "nuovo"}
            for x in (brief or {}).get("social") or [] if x.get("title")]


def canali(brief):
    """I primi titoli delle altre schede dell'app: sono i «canali» sugli schermi appesi."""
    b = brief or {}
    primi = lambda voci, n=3: [x.get("title") for x in (voci or []) if x.get("title")][:n]   # noqa: E731
    return {"ai": primi(b.get("ai")), "games": primi(b.get("games")), "scienza": primi(b.get("spazio")),
            "gta": primi((b.get("gta") or {}).get("voci"))}
