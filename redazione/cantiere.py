#!/usr/bin/env python3
"""
Il cantiere: le notizie arrivate dopo l'ultima edizione, su cui la redazione di TMB «lavora in avanti».

Mike, 16 novembre 2026: «l'ufficio dovrebbe lavorare in avanti… sta costruendo la prossima edizione. Piuttosto sono
io che li interrogo sull'edizione passata». Fino a quel giorno ogni scrivania parlava solo dell'edizione già uscita.
Questo script raccoglie dai feed quello che è uscito DOPO la raccolta del mattino, toglie quello che abbiamo già
dato, mette insieme le testate che raccontano lo stesso fatto e divide per reparto: le notizie Apple candidate per
domani, l'AI, la concorrenza, i giochi, la scienza, GTA VI, le discussioni. La pagina della redazione ci costruisce
il lavoro di ognuno (redazione/src/79-cantiere.js) e lo dà a chi risponde a Mike.

Tutto vero: titoli, testate, orari e sommari sono quelli dei feed. Di simulato c'è solo il gesto («la sta
verificando»): la corsa vera resta quella delle 6:30.

Non fa parte della corsa del mattino e non scrive niente in data/: legge i feed in memoria, e il risultato va in
redazione/stato/ (fuori da git) e poi nell'archivio della pagina, documento `stato/cantiere`.

    python3 redazione/cantiere.py                      # raccoglie; stampa i titoli da tradurre
    python3 redazione/cantiere.py --tradotti FILE      # aggiunge i titoli italiani ({id: titolo}) e compone
    python3 redazione/cantiere.py --archivio FILE      # (con uno dei due) non riscrive se nell'archivio è uguale

Stampa una riga che comincia con SCRIVI (seguita dal file da mettere nell'archivio), UGUALE o VUOTO.
"""
import argparse
import concurrent.futures as cf
import datetime as dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "pipeline"))
OUT = os.path.join(ROOT, "redazione", "stato")
GREZZO = os.path.join(OUT, "cantiere-grezzo.json")
FILE = os.path.join(OUT, "cantiere.json")

# quante voci per reparto: il cantiere è una scrivania, non un archivio
TETTI = {"notizie": 10, "ai": 5, "lab": 3, "banco": 3, "games": 4, "scienza": 4, "gta": 3, "radar": 3, "discussioni": 4}
# offerte e servizio: non sono lavoro per l'edizione di domani
RUMORE = re.compile(r"(?i)\b(offert[ae]|sconto|sconti|scontat[oaie]|deal[s]?|% off|black friday|cyber monday|coupon|prezzo più basso|"
                    r"lowest price|save \$|giveaway|sponsor(ed|izzato)?|how to watch|dove vedere|wallpaper|sfondi|imperdibil[ei]|"
                    r"costa solo|a soli|minimo storico|migliori .{3,40}\(20\d\d\)|best .{3,40} (of|in) 20\d\d|funniest|quiz|oroscopo)\b|€")
# le testate che parlano solo di Apple: le altre entrano fra le notizie solo se nominano Apple nel titolo
SOLO_APPLE = {"Apple Newsroom", "Apple Developer", "Apple Developer Releases", "9to5Mac", "MacRumors", "Macitynet", "iSpazio",
              "AppleInsider", "iClarified", "iPhone Italia"}
APPLE_FORTE = re.compile(r"(?i)\b(apple|iphone|ipad|macbook|imac|mac (mini|studio|pro)|macos|ipados|watchos|visionos|airpods|airtag|homepod|"
                         r"homeview|vision\s?pro|siri|tim\s?cook|ternus|cupertino|wwdc)\b")
APPLE_IN_PIU = re.compile(r"(?i)\b(homeview|iphone duo|macbook neo|ternus|federighi|apple tv|beats|apple intelligence|wwdc|apple silicon)\b")
# parole che stanno in una notizia Apple su due: da sole non dicono che due titoli parlano della stessa cosa
GENERICHE = {"apple", "iphone", "ipad", "mac", "ios", "app", "nuovo", "nuova", "nuovi", "nuove", "ai", "smart", "pro", "max", "anche", "come", "cosa",
             "anno", "anni", "new", "the", "with", "from", "that", "this", "prima", "dopo", "ora", "oggi", "arriva", "può", "puo", "vuole", "usare"}
BANCO = re.compile(r"(?i)\b(samsung|galaxy|pixel|xiaomi|redmi|poco|oneplus|oppo|honor|huawei|motorola|nothing|android|smartphone|"
                   r"pieghevol\w+|foldable|tablet|smartwatch|cuffie|earbuds|recensione|review|hands.on|anteprima|vs\.?)\b")
ITALIANE = {"Macitynet", "iSpazio", "Tom's Hardware IT", "DDay.it", "HDblog", "Andrea Galeazzi", "Il Post", "ANSA Scienza",
            "iPhone Italia", "Wired Italia", "Multiplayer.it", "Everyeye", "Le Scienze", "Focus", "MEDIA INAF"}


def carica(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def ultima_edizione():
    """(giorno, da quando si raccoglie): la raccolta del mattino dell'ultima edizione, o le 6 di quel giorno."""
    giorni = sorted(os.path.basename(f)[:10] for f in os.listdir(os.path.join(ROOT, "data", "briefs")) if re.match(r"\d{4}-\d\d-\d\d\.json$", f))
    if not giorni:
        return None, None
    g = giorni[-1]
    raw = carica(os.path.join(ROOT, "data", "raw", g + ".json")) or {}
    try:
        dal = dt.datetime.fromisoformat(str(raw.get("fetched_at")).replace("Z", "+00:00"))
    except ValueError:
        dal = dt.datetime.fromisoformat(g + "T05:00:00+00:00")
    return g, dal


def gia_usciti(g):
    """I link dell'ultima edizione (e di quella prima): quello che abbiamo già dato non è lavoro nuovo."""
    import common as C
    visti = set()
    giorni = sorted(os.path.basename(f)[:10] for f in os.listdir(os.path.join(ROOT, "data", "briefs")) if re.match(r"\d{4}-\d\d-\d\d\.json$", f))
    for giorno in giorni[-3:]:
        b = carica(os.path.join(ROOT, "data", "briefs", giorno + ".json")) or {}
        for chiave in ("news", "ai", "banco", "radar", "social", "recap", "games", "spazio"):
            for x in b.get(chiave) or []:
                for l in [x.get("link")] + list(x.get("extra_links") or []):
                    if l:
                        visti.add(C.norm_url(l if isinstance(l, str) else (l.get("link") or l.get("url") or "")))
        for x in (b.get("gta") or {}).get("voci") or []:
            if x.get("link"):
                visti.add(C.norm_url(x["link"]))
    return visti


def raccogli(dal, adesso):
    """Tutti i feed attivi, in memoria: le voci uscite dopo `dal`, e lo stato di ogni feed."""
    import fetch as F
    with cf.ThreadPoolExecutor(max_workers=min(len(F.FEEDS), 24)) as pool:
        esiti = list(pool.map(lambda kv: F.download(*kv), F.FEEDS.items()))
    voci, stato = [], {}
    for nome, _url, blob in esiti:
        if not blob:
            stato[nome] = "muta"
            continue
        try:
            items, _nuova, esito, _vecchia = F.parse_feed_full(nome, blob, dal, adesso)
        except Exception:
            stato[nome] = "rotta"
            continue
        stato[nome] = "ok" if esito in ("ok", "empty") else "rotta"
        voci.extend(items)
    return voci, stato


def discussioni(dal):
    """Reddit e Hacker News, con le stesse funzioni della corsa (pipeline/social.py). Se non rispondono, niente."""
    out = []
    try:
        import social as S
        for f in (S.hackernews, S.reddit):
            try:
                out.extend(f(dal) or [])
            except Exception:
                pass
    except Exception:
        pass
    return out


def utc(iso):
    try:
        return dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(dt.timezone.utc).isoformat(timespec="seconds")
    except ValueError:
        return ""


def di_apple(v, solo_titolo=False):
    from social import APPLE_WORDS
    testo = v.get("title") or ""
    if not solo_titolo:
        testo += " " + (v.get("summary") or "")[:300]
    return bool(APPLE_WORDS.search(testo) or APPLE_IN_PIU.search(testo))


def breve(t, n):
    t = " ".join((t or "").split())
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0] + "…"


def gruppi(voci):
    """Lo stesso fatto raccontato da più testate diventa una voce sola, con chi l'ha data per primo."""
    import common as C
    voci = sorted(voci, key=lambda v: v["date"])
    out = []
    for v in voci:
        for g in out:
            if v["source"] not in g["testate"] and any(C.similarity(v["title"], w["title"]) >= 0.5 for w in g["voci"][:4]):
                g["voci"].append(v)
                g["testate"].add(v["source"])
                break
        else:
            out.append({"voci": [v], "testate": {v["source"]}})
    return out


def voce(g, i, chiave):
    """Una voce del cantiere da un gruppo di articoli: il titolo in italiano se una testata italiana l'ha data."""
    try:
        from rubriche import LANG_IT
    except Exception:
        LANG_IT = set()
    italiane = ITALIANE | set(LANG_IT)
    prima = g["voci"][0]
    it = next((v for v in g["voci"] if v["source"] in italiane), None)
    mostra = it or prima
    import hashlib
    x = {"id": chiave + "-" + hashlib.sha1((prima.get("link") or prima["title"]).encode("utf-8")).hexdigest()[:8], "t": breve(mostra["title"], 140), "f": prima["source"], "ora": utc(prima["date"]), "n": len(g["testate"]),
         "s": breve(mostra.get("summary") or prima.get("summary"), 300), "l": prima["link"], "it": 1 if it else 0}
    if len(g["testate"]) > 1:
        x["altre"] = sorted(g["testate"] - {prima["source"]})[:6]
    return x


def segna_riprese(doc):
    """Le testate italiane riprendono a metà mattina quello che noi abbiamo dato alle sei: non è lavoro nuovo, è la
    nostra notizia che gira. Si riconosce dal titolo (già in italiano: per questo si fa dopo la traduzione) e si
    segna `seg`, con il titolo della notizia di stamattina. Le riprese della stessa notizia diventano una voce sola,
    e le notizie nuove vanno in testa."""
    import common as C
    stamattina = [n.get("title") or "" for n in (carica(os.path.join(ROOT, "data", "briefs", str(doc.get("edizione")) + ".json")) or {}).get("news") or []]
    parole = lambda t: {w for w in C.tokens(t) if w not in GENERICHE and len(w) > 2}   # noqa: E731
    di = [parole(t) for t in stamattina]
    for x in doc.get("notizie") or []:
        meglio, voto = None, 0.0
        for t, pt in zip(stamattina, di):
            comuni = parole(x["t"]) & pt
            rare = [w for w in comuni if len(w) >= 6 and sum(1 for q in di if w in q) == 1]
            # senza la scorciatoia fra lingue: lì due nomi propri in comune («Apple», «iPhone») danno già 1
            punti = C.similarity(x["t"], t, cross_language=False) + 0.2 * len(comuni) + 0.25 * len(rare)
            if punti > voto and (len(comuni) >= 2 or rare or punti >= 0.45):
                meglio, voto = t, punti
        if meglio:
            x["seg"] = breve(meglio, 90)
    uniche, per_seg = [], {}
    for x in doc.get("notizie") or []:
        prima = per_seg.get(x.get("seg")) if x.get("seg") else None
        if prima:
            testate = {prima["f"], *prima.get("altre", []), x["f"], *x.get("altre", [])}
            prima["n"], prima["altre"] = len(testate), sorted(testate - {prima["f"]})[:6]
            continue
        if x.get("seg"):
            per_seg[x["seg"]] = x
        uniche.append(x)
    doc["notizie"] = [x for x in uniche if not x.get("seg")] + [x for x in uniche if x.get("seg")]


def componi(tradotti=None):
    grezzo = carica(GREZZO)
    if not grezzo:
        return None
    doc = grezzo["doc"]
    for chiave in TETTI:
        for x in doc.get(chiave) or []:
            t = (tradotti or {}).get(x["id"])
            if t and not x.get("it"):
                x["o"], x["t"], x["it"] = x["t"], breve(str(t), 150), 1
    try:
        segna_riprese(doc)
    except Exception as e:   # senza, le riprese restano fra le nuove: pazienza
        print("riprese non segnate:", e, file=sys.stderr)
    return doc


def senza_ora(d):
    return {k: v for k, v in (d or {}).items() if k != "scritto"}


def main():
    ap = argparse.ArgumentParser(description="il cantiere della redazione: le notizie arrivate dopo l'edizione")
    ap.add_argument("--tradotti", help="un file JSON {id: titolo in italiano}: compone senza raccogliere di nuovo")
    ap.add_argument("--archivio", help="la copia di stato/cantiere letta dall'archivio (un file JSON)")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    if not a.tradotti:
        g, dal = ultima_edizione()
        if not g:
            print("VUOTO nessuna edizione in data/briefs")
            return
        adesso = dt.datetime.now(dt.timezone.utc)
        dal = max(dal, adesso - dt.timedelta(hours=30))
        voci, feed = raccogli(dal, adesso)
        visti = gia_usciti(g)
        import common as C
        voci = [v for v in voci if v.get("title") and C.norm_url(v.get("link") or "") not in visti and not RUMORE.search(v["title"])]
        try:
            import rubriche as R
        except Exception:
            R = None
        if R:
            voci = [R.gn_prepara(v) for v in voci]   # Google News: «Titolo - Testata» diventa titolo e fonte
        per = lambda *gironi: [v for v in voci if v.get("tier") in gironi]   # noqa: E731
        gta = [v for v in voci if re.search(r"(?i)\bgta\b|grand theft auto", v["title"])]
        # le notizie Apple candidate per domani: dalle testate che parlano solo di Apple quando parlano di Apple, e da
        # tutte le altre quando Apple è nel titolo. Il resto delle testate Apple va all'AI o al radar
        apple = [v for v in voci if v not in gta and v.get("tier") not in ("ai", "lab", "games", "spazio")
                 and (di_apple(v) if v["source"] in SOLO_APPLE else bool(APPLE_FORTE.search(v["title"])))]
        fuori = [v for v in voci if v["source"] in SOLO_APPLE and v not in apple and v not in gta]
        ai_parole = getattr(R, "AI_WORDS", None) if R else None
        ai_in_piu = [v for v in fuori if ai_parole and ai_parole.search(v["title"])]

        def con_punti(rub, lista):   # giochi e scienza: stesso punteggio dello script del mattino, un filo più largo
            if not R:
                return lista
            tenute = []
            for v in lista:
                try:
                    if R.score(rub, v) >= R.RUBRICHE[rub]["soglia"] - 1.5:
                        tenute.append(v)
                except Exception:
                    tenute.append(v)
            return tenute
        doc = {"scritto": adesso.isoformat(timespec="seconds"), "edizione": g, "dal": dal.isoformat(timespec="seconds")}

        def reparto(chiave, lista, ordine):
            gg = sorted(gruppi(lista), key=ordine, reverse=True)[:TETTI[chiave]]
            doc[chiave] = [voce(x, i + 1, chiave) for i, x in enumerate(gg)]

        fresca = lambda x: x["voci"][0]["date"]                                                            # noqa: E731
        pesa = lambda x: (len(x["testate"]) + (2 if any(v.get("tier") == "primaria" for v in x["voci"]) else 0), x["voci"][0]["date"])   # noqa: E731
        reparto("notizie", apple, pesa)
        reparto("ai", per("ai") + ai_in_piu, pesa)
        reparto("lab", per("lab"), fresca)
        reparto("banco", [v for v in per("banco") if v not in apple and (BANCO.search(v["title"]) or "youtube.com" in (v.get("link") or ""))], pesa)
        reparto("games", con_punti("games", [v for v in per("games") if v not in gta]), pesa)
        reparto("scienza", con_punti("spazio", per("spazio")), pesa)
        reparto("gta", gta, pesa)
        reparto("radar", [v for v in per("larga") + fuori if v not in apple and v not in ai_in_piu and not (ai_parole and ai_parole.search(v["title"]))], pesa)
        # le discussioni: una di Reddit e una di Hacker News a turno, le più votate; niente assistenza né vetrine
        tutte = [d for d in discussioni(adesso - dt.timedelta(hours=24)) if d.get("title") and d.get("tipo", "discussione") == "discussione" and not RUMORE.search(d["title"])]
        rd = [d for d in tutte if str(d.get("platform", "")).startswith("Reddit")]
        hn = sorted((d for d in tutte if d not in rd), key=lambda d: -(d.get("points") or 0))
        turno = [x for coppia in zip(rd, hn) for x in coppia] + rd[len(hn):] + hn[len(rd):]
        import hashlib
        doc["discussioni"] = [{"id": "discussioni-" + hashlib.sha1((d.get("link") or d["title"]).encode("utf-8")).hexdigest()[:8], "t": breve(d["title"], 140), "f": d.get("platform") or "in rete", "ora": utc(d.get("when") or ""),
                               "s": breve(d.get("signal") or "", 160), "l": d.get("discussion") or d.get("link") or "", "it": 0}
                              for i, d in enumerate(turno[:TETTI["discussioni"]], 1)]
        if not doc["discussioni"]:   # Reddit ogni tanto non risponde: restano le discussioni dell'ultima raccolta, se è dello stesso giorno
            for vecchio in (carica(a.archivio) if a.archivio else None, carica(FILE)):
                if isinstance(vecchio, dict) and isinstance(vecchio.get("data"), dict) and "scritto" not in vecchio:
                    vecchio = vecchio["data"]
                if isinstance(vecchio, dict) and vecchio.get("edizione") == g and vecchio.get("discussioni"):
                    doc["discussioni"] = vecchio["discussioni"]
                    break
        ok = sum(1 for v in feed.values() if v == "ok")
        doc["feed"] = {"ok": ok, "totale": len(feed), "muti": sorted(n for n, v in feed.items() if v != "ok")[:8]}
        with open(GREZZO, "w", encoding="utf-8") as f:
            json.dump({"doc": doc}, f, ensure_ascii=False)
        da_tradurre = [(x["id"], x["t"]) for chiave in TETTI for x in doc.get(chiave) or [] if not x.get("it")]
        if da_tradurre:
            print(f"DA TRADURRE ({len(da_tradurre)} titoli: scrivi un file JSON {{id: titolo in italiano}} e rilancia con --tradotti)")
            for ident, t in da_tradurre:
                print(f"{ident}\t{t}")
            return

    tradotti = carica(a.tradotti) if a.tradotti else None
    doc = componi(tradotti if isinstance(tradotti, dict) else None)
    if not doc:
        print("VUOTO niente da comporre: lancia prima senza --tradotti")
        return
    quante = sum(len(doc.get(k) or []) for k in TETTI)
    vecchio = carica(a.archivio) if a.archivio else None
    if isinstance(vecchio, dict) and isinstance(vecchio.get("data"), dict) and "scritto" not in vecchio:
        vecchio = vecchio["data"]
    if vecchio and senza_ora(vecchio) == senza_ora(json.loads(json.dumps(doc))):
        print("UGUALE nel cantiere non è arrivato niente di nuovo")
        return
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"SCRIVI {os.path.relpath(FILE, ROOT)}  ({quante} voci dopo l'edizione del {doc['edizione']}, {os.path.getsize(FILE) // 1024} KB)")


if __name__ == "__main__":
    main()
