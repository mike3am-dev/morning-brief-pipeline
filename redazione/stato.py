#!/usr/bin/env python3
"""
Lo stato della redazione di TMB per un giorno: chi ha lavorato, quanto, cosa ha consegnato,
cosa c'è sulla lavagna, sugli schermi e sui post-it.

Legge soltanto i file che la corsa del mattino lascia nel repository (data/corse.json,
data/briefs/<g>.json, data/raw, data/ai, data/rubriche, data/gta, data/eco, data/social,
data/lab, data/visivi, data/taste.json, docs/fonti, i commit della corsa) e scrive un solo
file: redazione/stato/<g>.json. Non tocca niente della corsa, dell'edizione o dell'app.

Il progetto che spiega ogni campo è docs/redazione/progetto.md.

    python3 redazione/stato.py                 l'ultimo giorno con un'edizione
    python3 redazione/stato.py 2026-11-11      un giorno preciso
    python3 redazione/stato.py --tutti         tutti i giorni con un registro della corsa
    python3 redazione/stato.py --stampa        stampa il JSON invece di scriverlo

Regola: tutto quello che esce di qui è vero. Se un dato non c'è, il campo è null o manca:
non si stima e non si riempie.
"""

import argparse
import datetime as dt
import glob
import json
import os
import re
import subprocess
import sys

try:
    from zoneinfo import ZoneInfo
    ROMA = ZoneInfo("Europe/Rome")
except Exception:  # pragma: no cover
    ROMA = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "redazione", "stato")

# Chi c'è in redazione. L'ordine è quello della procedura (routine/prompt.md).
# I nomi li ha voluti Mike il 12 novembre 2026 («diamogli dei nomi, fai tu, oltre al ruolo»).
ROSTER = [
    {"id": "regia", "nome": "Olivia", "mestiere": "caporedattrice", "ruolo": "la regia, al desk circolare",
     "file": None, "colore": "apple"},
    {"id": "lettura", "nome": "Tobia", "mestiere": "lettore", "ruolo": "legge gli articoli, notizia per notizia",
     "file": None, "colore": "apple"},
    {"id": "redattore", "nome": "Ettore", "mestiere": "redattore", "ruolo": "scrive la prosa dell'edizione",
     "file": ".claude/agents/redattore.md", "colore": "apple", "dal": "2026-11-03"},
    {"id": "revisore", "nome": "Ivo", "mestiere": "revisore", "ruolo": "rilegge e corregge le parole, mai i fatti",
     "file": ".claude/agents/revisore.md", "colore": "apple", "dal": "2026-11-12"},
    {"id": "visualista", "nome": "Lea", "mestiere": "visualista", "ruolo": "i grafici degli approfondimenti",
     "file": ".claude/agents/visualista.md", "colore": "apple"},
    {"id": "ai", "nome": "Ada", "mestiere": "cronista AI", "ruolo": "la scheda AI: cronaca e LAB",
     "file": ".claude/agents/ai.md", "colore": "ai", "dal": "2026-11-05"},
    {"id": "schede", "nome": "Rita", "mestiere": "redattrice di Games e Scienza", "ruolo": "le schede Games e Scienza",
     "file": ".claude/agents/schede.md", "colore": "games-scienza", "dal": "2026-11-05"},
    {"id": "gta", "nome": "Vito", "mestiere": "cronista di GTA VI", "ruolo": "la sezione GTA VI",
     "file": ".claude/agents/gta.md", "colore": "vice-city", "dal": "2026-11-05"},
    {"id": "fonti", "nome": "Zeno", "mestiere": "archivista delle fonti", "ruolo": "il controllo delle fonti, il lunedì",
     "file": "routine/fonti-settimanale.md", "colore": "apple"},
]

CRONACA = {"modello", "funzione", "affari", "regole", "ricerca"}
LAB = {"uso", "demo", "trucco", "sapevi"}

# I commit fissi della corsa (pipeline/salva.py e chiudi.py): l'unico orario vero delle fasi.
FASI_COMMIT = [
    ("Sezioni dell'edizione del", "sezioni della regia salvate"),
    ("Dossier e sezioni intermedie del", "dossier e sezioni delle schede salvati"),
    ("Pubblica l'edizione del", "edizione pubblicata"),
    ("Fine corsa del", "fine corsa"),
]


# ---------------------------------------------------------------- lettura sicura

def p(*parti):
    return os.path.join(ROOT, *parti)


def carica(percorso):
    try:
        with open(percorso, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def data(s):
    return dt.date.fromisoformat(s[:10])


def ora_locale(iso):
    """'2026-11-11T04:34:47+00:00' -> '05:34' (ora di Milano)."""
    if not iso:
        return None
    try:
        t = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=dt.timezone.utc)
        if ROMA:
            t = t.astimezone(ROMA)
        return t.strftime("%H:%M")
    except ValueError:
        return None


def taglia(s, n):
    s = re.sub(r"\s+", " ", (s or "").strip())
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def senza_markdown(s):
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s or "")
    s = re.sub(r"`([^`]+)`", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    return s


def chi_e(file_rel):
    """Il primo paragrafo del file dell'agente, dopo il frontmatter: la sua voce."""
    if not file_rel:
        return None
    try:
        testo = open(p(file_rel), encoding="utf-8").read()
    except OSError:
        return None
    testo = re.sub(r"\A---\n.*?\n---\n", "", testo, flags=re.S)
    for blocco in re.split(r"\n\s*\n", testo):
        b = blocco.strip()
        if b and not b.startswith("#"):
            return taglia(senza_markdown(b), 700)
    return None


# ---------------------------------------------------------------- la corsa

def corsa_del(giorno):
    corse = carica(p("data", "corse.json")) or []
    return next((c for c in corse if c.get("giorno") == giorno), None), corse


def token(r):
    return sum(r.get(k, 0) or 0 for k in ("nuovi", "in_cache", "scritti_cache", "scritti"))


def registri_per_agente(corsa):
    """{id: {minuti, modello, token_milioni}} dai registri di corse.json (dal 5 novembre)."""
    if not corsa or "registri" not in corsa:
        return None
    out = {}
    for r in corsa["registri"]:
        nome = r.get("nome", "")
        testa = nome.split(":")[0].strip()
        if testa == "principale":
            ident = "regia"
        elif testa == "general-purpose":
            ident = "lettura" if "lettura" in nome.lower() else None
        else:
            ident = testa
        if not ident:
            continue
        x = out.setdefault(ident, {"minuti": 0, "modello": r.get("modello"), "token": 0})
        x["minuti"] += r.get("minuti") or 0
        if r.get("inizio"):
            x["inizio"] = min(x.get("inizio") or r["inizio"], r["inizio"])
            x["fine"] = max(x.get("fine") or r["fine"], r["fine"])
        x["token"] += token(r)
    for x in out.values():
        x["token_milioni"] = round(x.pop("token") / 1e6, 1)
    return out


def fasi(giorno, raw, social, lab, missed):
    righe = []
    for cosa, doc, campo in (("raccolta degli articoli", raw, "fetched_at"),
                             ("discussioni raccolte", social, "fetched_at"),
                             ("LAB raccolto", lab, "fetched_at"),
                             ("ripescaggio preparato", missed, "generated_at")):
        if doc and doc.get(campo):
            righe.append({"cosa": cosa, "quando": doc[campo], "ora": ora_locale(doc[campo]),
                          "fonte": "file"})
    try:
        log = subprocess.run(
            ["git", "log", "--all", "--format=%aI|%s", "--grep", "del " + giorno],
            cwd=ROOT, capture_output=True, text=True, timeout=20).stdout
    except Exception:
        log = ""
    visti = set()
    for riga in log.splitlines():
        quando, _, msg = riga.partition("|")
        for testa, cosa in FASI_COMMIT:
            if msg.startswith(testa) and giorno in msg and cosa not in visti:
                visti.add(cosa)
                righe.append({"cosa": cosa, "quando": quando, "ora": ora_locale(quando),
                              "fonte": "commit"})
    righe.sort(key=lambda r: r["quando"])
    return righe


# ---------------------------------------------------------------- i post-it

CAMPI = {"title": "titolo", "sintesi": "sintesi", "descrizione": "descrizione",
         "titolo": "titolo dell'approfondimento", "punto": "sommario dell'approfondimento",
         "sotto": "testo dell'approfondimento"}


def piatto(v):
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, list):
        return "\n\n".join(piatto(x) for x in v)
    if isinstance(v, dict):
        return "\n\n".join(piatto(x) for k, x in v.items() if k != "notizie")
    return str(v)


def revisione(giorno):
    """Cosa ha cambiato il revisore: una voce per testo riscritto, con il prima e il dopo."""
    doc = carica(p("data", "revisione", giorno + ".json"))
    if not doc or "prima" not in doc:
        return None
    if "dopo" not in doc:
        return {"fatta": False, "cambi": []}
    prima, dopo, cambi = doc["prima"], doc["dopo"], []

    def guarda(dove, cosa, notizia, a, b):
        a, b = piatto(a), piatto(b)
        if a != b:
            cambi.append({"dove": dove, "cosa": cosa, "notizia": notizia, "prima": a, "dopo": b})

    for ident, v in (dopo.get("news") or {}).items():
        o = (prima.get("news") or {}).get(ident)
        if o is None:
            continue
        for k in ("title", "sintesi", "descrizione"):
            guarda(f"{ident}/{k}", CAMPI[k], v.get("title"), o.get(k), v.get(k))
        a, oa = v.get("approfondimento") or {}, o.get("approfondimento") or {}
        for k in ("titolo", "punto", "sotto"):
            guarda(f"{ident}/approfondimento/{k}", CAMPI[k], v.get("title"), oa.get(k), a.get(k))
    guarda("intro", "il quadro della giornata", None, prima.get("intro"), dopo.get("intro"))
    guarda("editoriale", "«Il punto»", None, prima.get("editoriale"), dopo.get("editoriale"))
    guarda("top3", "i tre titoli d'apertura", None, prima.get("top3"), dopo.get("top3"))
    return {"fatta": True, "riscritti": len(cambi), "cambi": cambi,
            "ricostruito": doc.get("ricostruito")}


def titolo_notizia(giorno, ident):
    """Il titolo di una notizia di un'edizione, letto senza immagini (carica e scarta)."""
    b = carica(p("data", "briefs", giorno + ".json")) or {}
    for n in b.get("news") or []:
        if n.get("id") == ident:
            return n.get("title")
    return None


def postit(giorno, brief):
    oggi = data(giorno)
    out = []

    rich = carica(p("data", "visivi", "richieste.json")) or []
    aperte = [r for r in rich if r.get("stato") == "aperta" and r.get("data", "") <= giorno]
    if aperte:
        aperte.sort(key=lambda r: r.get("data", ""))
        piu_vecchia = aperte[0]["data"]
        out.append({"id": "visivi-mazzo", "da": "visualista",
                    "titolo": f"{len(aperte)} richieste di grafici nuovi, ancora aperte",
                    "testo": "La più vecchia è del " + piu_vecchia + ".",
                    "dal": piu_vecchia, "giorni": (oggi - data(piu_vecchia)).days,
                    "mazzo": len(aperte), "fonte": "data/visivi/richieste.json"})
        for r in aperte[-3:][::-1]:
            out.append({"id": "visivi-" + r.get("data", "") + "-" + (r.get("notizia") or "")[:40],
                        "da": "visualista", "notizia": r.get("notizia"),
                        "titolo": "Un grafico per: " + taglia(titolo_notizia(r.get("data", ""), r.get("notizia"))
                                                              or r.get("notizia") or "?", 90),
                        "testo": taglia(r.get("interazione") or r.get("idea"), 260),
                        "dal": r.get("data"), "giorni": (oggi - data(r["data"])).days,
                        "fonte": "data/visivi/richieste.json"})

    rapporti = sorted(f for f in glob.glob(p("docs", "fonti", "*.md"))
                      if os.path.basename(f)[:10] <= giorno)
    if rapporti:
        f = rapporti[-1]
        dal = os.path.basename(f)[:10]
        testo = open(f, encoding="utf-8").read()
        m = re.search(r"^## Da decidere\s*\n(.*?)(?=^## |\Z)", testo, flags=re.S | re.M)
        if m:
            punti = re.split(r"\n(?=- )", m.group(1).strip())
            for i, punto in enumerate(x for x in punti if x.startswith("- ")):
                corpo = senza_markdown(punto[2:])
                tit = re.match(r"\*\*(.+?)\*\*", punto[2:])
                out.append({"id": f"fonti-{dal}-{i + 1}", "da": "fonti",
                            "titolo": taglia(senza_markdown(tit.group(1)) if tit else corpo, 90),
                            "testo": taglia(corpo, 300), "dal": dal,
                            "giorni": (oggi - data(dal)).days,
                            "fonte": os.path.relpath(f, ROOT)})

    taste = carica(p("data", "taste.json")) or {}
    if taste.get("last_report"):
        scade = data(taste["last_report"]) + dt.timedelta(days=14)
        if scade <= oggi:
            out.append({"id": "gusto-briefing", "da": "regia",
                        "titolo": "Il briefing del gusto è scaduto",
                        "testo": "Ogni 14 giorni si guarda insieme cosa sta sparendo dalla "
                                 "rassegna e perché (taste.py report). L'ultimo è del "
                                 + taste["last_report"] + ".",
                        "dal": scade.isoformat(), "giorni": (oggi - scade).days,
                        "fonte": "data/taste.json"})
    return out


def letture(giorno, quante=6):
    """Quante voci Mike ha aperto in ciascuna delle ultime edizioni (i segnali di lettura)."""
    per = {}
    for v in (carica(p("data", "taste.json")) or {}).get("votes") or []:
        if v.get("how") != "lettura":
            continue
        d = (v.get("story") or "").split("/")[0]
        if len(d) != 10 or d >= giorno:
            continue
        x = per.setdefault(d, {"viste": 0, "aperte": 0})
        x["viste"] += 1
        if (v.get("vote") or 0) > 0:
            x["aperte"] += 1
    return [{"giorno": d, **per[d]} for d in sorted(per)[-quante:]]


# ---------------------------------------------------------------- lo stato del giorno

def stato(giorno):
    brief = carica(p("data", "briefs", giorno + ".json"))
    corsa, corse = corsa_del(giorno)
    raw = carica(p("data", "raw", giorno + ".json"))
    social = carica(p("data", "social", giorno + ".json"))
    lab = carica(p("data", "lab", giorno + ".json"))
    missed = carica(p("data", "missed", giorno + ".json"))
    eco = carica(p("data", "eco", giorno + ".json"))
    ai_file = carica(p("data", "ai", giorno + "-sezione.json"))
    scritte = carica(p("data", "rubriche", giorno + "-scritte.json"))
    gta_file = carica(p("data", "gta", giorno + "-sezione.json"))
    reg = registri_per_agente(corsa)
    rev = revisione(giorno)
    news = sorted((brief or {}).get("news") or [], key=lambda n: n.get("rank", 99))
    b = brief or {}

    # --- la corsa
    c = None
    if corsa:
        inizio = corsa.get("inizio")
        fine = None
        if inizio and corsa.get("minuti") is not None:
            t0 = dt.datetime.fromisoformat(inizio)
            fine = (t0 + dt.timedelta(minutes=corsa["minuti"])).isoformat()
        prima = [x for x in corse if x.get("giorno", "") <= giorno][-7:]
        c = {"inizio": inizio, "ora_inizio": ora_locale(inizio), "fine": fine,
             "ora_fine": ora_locale(fine), "minuti": corsa.get("minuti"),
             "tetto": 45 if giorno >= "2026-11-11" else 30,
             "token_milioni": round(token(corsa) / 1e6, 1),
             # stesso formato dell'ora su ogni macchina (git la scrive con Z o con +00:00): se no lo stato
             # composto sul Mac e quello composto in cloud sembrano diversi, e il modellino si riscrive a vuoto
             "fasi": [dict(f, quando=str(f.get("quando") or "").replace("Z", "+00:00"))
                      for f in fasi(giorno, raw, social, lab, missed)],
             "ultime": [{"giorno": x["giorno"], "minuti": x.get("minuti")} for x in prima]}
        uscita = next((f for f in c["fasi"] if f["cosa"] == "edizione pubblicata"), None)
        c["ora_uscita"] = uscita["ora"] if uscita else c["ora_fine"]

    # --- le consegne, agente per agente
    lunedi = data(giorno).weekday() == 0
    pi = postit(giorno, brief)
    da_chi = {x["da"] for x in pi}
    agenti = []
    for a in ROSTER:
        r = (reg or {}).get(a["id"])
        x = {"id": a["id"], "nome": a["nome"], "mestiere": a["mestiere"], "ruolo": a["ruolo"],
             "colore": a["colore"],
             "modello": r["modello"] if r else None, "minuti": r["minuti"] if r else None,
             "token_milioni": r["token_milioni"] if r else None,
             "entrata": ora_locale(r.get("inizio")) if r else None,
             "uscita": ora_locale(r.get("fine")) if r else None,
             "chi": chi_e(a["file"]), "consegna": None, "dettagli": [],
             "ti_aspetta": a["id"] in da_chi}
        st = None

        if a.get("dal") and giorno < a["dal"]:
            st = "non oggi"
            x["consegna"] = "non era ancora in squadra: arriva il " + a["dal"]
            if brief and a["id"] != "revisore":
                x["dettagli"] = ["quel giorno il suo lavoro l'ha fatto la regia"]
        elif a["id"] == "regia":
            if brief:
                st = "consegnato"
                x["consegna"] = (f"{len(news)} notizie in edizione; radar {len(b.get('radar') or [])}, "
                                 f"banco {len(b.get('banco') or [])}, discussioni "
                                 f"{len(b.get('social') or [])}, ripescaggi {len(b.get('recap') or [])}")
        elif a["id"] == "lettura":
            letti = (b.get("stats") or {}).get("articoli_letti")
            if r:
                st = "consegnato"
            elif brief:
                st = "saltato" if reg is not None else "consegnato"
            if letti is not None:
                x["consegna"] = f"{letti} articoli letti"
            x["dettagli"] = [f"{n['rank']}. {taglia(n.get('title'), 90)} — {n['verifica']['lette']} testate lette"
                             for n in news[:5] if (n.get("verifica") or {}).get("lette")]
        elif a["id"] == "redattore":
            if brief:
                st = "consegnato" if (r or reg is None) else "sostituito"
                appr = sum(1 for n in news if n.get("approfondimento"))
                x["consegna"] = f"{len(news)} notizie scritte, {appr} approfondimenti"
                x["dettagli"] = list(b.get("top3") or [])
                if (b.get("editoriale") or {}).get("titolo"):
                    x["dettagli"].append("Il punto: " + b["editoriale"]["titolo"])
        elif a["id"] == "revisore":
            if r:
                st = "consegnato"
                x["consegna"] = "prosa riletta"
                if rev and rev.get("fatta"):
                    x["consegna"] = f"{rev['riscritti']} testi riscritti a penna rossa"
                    x["dettagli"] = [c["cosa"] + (": " + taglia(c["notizia"], 70) if c["notizia"] else "")
                                     for c in rev["cambi"][:8]]
            elif brief:
                st = "saltato"
        elif a["id"] == "visualista":
            primi = news[:5]
            tipi = [v.get("tipo") for n in primi for v in ((n.get("approfondimento") or {}).get("visivi") or [])]
            senza = sum(1 for n in primi if not (n.get("approfondimento") or {}).get("visivi"))
            if r or tipi:
                st = "consegnato"
            elif brief:
                st = "saltato" if reg is not None else None
            if brief:
                x["consegna"] = (f"{len(tipi)} grafici sulle prime cinque"
                                 + (f", {senza} senza" if senza else ""))
                x["dettagli"] = [f"{n['rank']}. {v.get('tipo')}: {taglia(v.get('titolo'), 80)}"
                                 for n in primi for v in ((n.get("approfondimento") or {}).get("visivi") or [])]
        elif a["id"] == "ai":
            voci = (ai_file or {}).get("ai")
            if voci is not None:
                st = "consegnato"
                cr = sum(1 for v in voci if v.get("kind") in CRONACA)
                lb = sum(1 for v in voci if v.get("kind") in LAB)
                x["consegna"] = f"{len(voci)} voci: {cr} di cronaca, {lb} LAB"
                x["dettagli"] = [taglia(v.get("title"), 90) for v in voci[:6]]
            elif b.get("ai"):
                st = "sostituito"
                x["consegna"] = "la scheda AI l'ha scritta la regia"
        elif a["id"] == "schede":
            if scritte:
                st = "consegnato"
                g, s = scritte.get("games") or [], scritte.get("spazio") or []
                x["consegna"] = f"{len(g)} voci Games, {len(s)} Scienza"
                x["dettagli"] = ([taglia(v.get("title"), 80) for v in g[:3]]
                                 + [taglia(v.get("title"), 80) for v in s[:3]])
            elif b.get("games") or b.get("spazio"):
                st = "sostituito"
                x["consegna"] = "oggi la scelta e i titoli li ha fatti lo script, con Gemini"
        elif a["id"] == "gta":
            if gta_file:
                st = "consegnato"
                voci = gta_file.get("voci") or []
                x["consegna"] = f"{len(voci)} voci su GTA VI"
                if gta_file.get("sintesi"):
                    x["dettagli"].append(gta_file["sintesi"])
                if gta_file.get("uscita"):
                    giorni = (data(gta_file["uscita"]) - data(giorno)).days
                    if giorni >= 0:
                        x["dettagli"].append(f"mancano {giorni} giorni all'uscita ({gta_file['uscita']})")
                x["dettagli"] += [taglia(v.get("title"), 80) for v in voci[:4]]
            elif b.get("gta_notizie"):
                st = "sostituito"
                x["consegna"] = "oggi solo le notizie GTA trovate dallo script"
        elif a["id"] == "fonti":
            rapporti = sorted(os.path.basename(f)[:10] for f in glob.glob(p("docs", "fonti", "*.md"))
                              if os.path.basename(f)[:10] <= giorno)
            ultimo = rapporti[-1] if rapporti else None
            n_dec = sum(1 for y in pi if y["da"] == "fonti")
            if ultimo == giorno:
                st = "consegnato"
                x["consegna"] = f"rapporto delle fonti, {n_dec} cose da decidere"
            else:
                st = "non oggi"
                x["consegna"] = (f"lavora il lunedì; l'ultimo rapporto è del {ultimo}" if ultimo
                                 else "lavora il lunedì")
            x["dettagli"] = [] if not lunedi else ["oggi è lunedì"]

        x["stato"] = st or "fuori"
        agenti.append(x)

    # --- le macchine
    fs = (raw or {}).get("feed_status") or {}
    rotti = sorted(k for k, v in fs.items() if v.get("state") != "ok")
    macchine = {
        "telescrivente": {"articoli": (raw or {}).get("count"), "ora": ora_locale((raw or {}).get("fetched_at")),
                          "finestra_ore": (raw or {}).get("window_hours")} if raw else None,
        "feed": {"totale": len(fs), "ok": len(fs) - len(rotti), "rotti": rotti} if fs else None,
        "radio": {"discussioni": (social or {}).get("count"), "lab": (lab or {}).get("count")}
                 if (social or lab) else None,
        "telefono": {"notizie_chieste": len(eco)} if isinstance(eco, dict) else None,
        "antenna": {"edizione": bool(brief)},
    }

    # --- la lavagna e lo schermo
    lavagna = []
    for n in news:
        ap = n.get("approfondimento") or {}
        vis = ap.get("visivi") or []
        lavagna.append({"rank": n.get("rank"), "id": n.get("id"), "titolo": n.get("title"),
                        "sintesi": n.get("sintesi"),
                        "reparto": n.get("reparto"), "tag": n.get("tag"),
                        "origine": n.get("origine"),
                        "testate": (n.get("verifica") or {}).get("testate"),
                        "approfondita": bool(ap), "visivo": vis[0].get("tipo") if vis else None})

    schermo = None
    if brief:
        prossimi = sorted((x for x in (b.get("prossimo") or []) if x.get("data", "") >= giorno),
                          key=lambda x: x["data"])
        cit = b.get("citazione") or {}
        schermo = {"top3": b.get("top3") or [], "intro": b.get("intro"),
                   "punto": (b.get("editoriale") or {}).get("titolo"),
                   "citazione": {"testo": cit.get("testo"), "chi": cit.get("chi")} if cit else None,
                   "prossimo": prossimi[0] if prossimi else None}

    s = {"giorno": giorno, "scritto": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
         "corsa": c, "agenti": agenti, "macchine": macchine, "lavagna": lavagna,
         "schermo": schermo, "postit": pi, "revisione": rev, "letture": letture(giorno),
         "gta": ({"uscita": gta_file["uscita"], "giorni": (data(gta_file["uscita"]) - data(giorno)).days}
                 if gta_file and gta_file.get("uscita") else None)}
    # il muro delle notizie: la mappa, la borsa, le discussioni, i canali delle altre schede (redazione/muro.py)
    try:
        import muro as _muro
        s["mappa"] = _muro.mappa(raw, news)
        s["borsa"] = _muro.borsa(brief)
        s["discussioni"] = _muro.discussioni(brief)
        s["canali"] = _muro.canali(brief)
    except Exception as e:   # il muro non deve mai fermare lo stato
        print("muro non composto:", e, file=sys.stderr)
    # quali decisioni del registro sono arrivate alla corsa: quelle copiate in data/redazione/decisioni.json
    dec = carica(p("data", "redazione", "decisioni.json")) or {}
    s["registro"] = {"aggiornato": dec.get("aggiornato"),
                     "ids": [x.get("id") for x in dec.get("decisioni") or [] if x.get("id")]}
    # le carte sulla scrivania di ognuno: il materiale per quando Mike gli parla (redazione/carte.py)
    try:
        import carte as _carte
        s["carte"] = _carte.carte(giorno, ROOT, brief, rev, s)
    except Exception as e:   # le carte non devono mai fermare lo stato
        s["carte"] = {}
        print("carte non composte:", e, file=sys.stderr)
    return s


# ---------------------------------------------------------------- main

def giorni_disponibili():
    return sorted(os.path.basename(f)[:10] for f in glob.glob(p("data", "briefs", "*.json"))
                  if re.match(r"\d{4}-\d{2}-\d{2}\.json$", os.path.basename(f)))


def main():
    ap = argparse.ArgumentParser(description="lo stato della redazione di TMB per un giorno")
    ap.add_argument("giorno", nargs="?")
    ap.add_argument("--tutti", action="store_true")
    ap.add_argument("--stampa", action="store_true")
    a = ap.parse_args()

    if a.tutti:
        corse = carica(p("data", "corse.json")) or []
        giorni = [c["giorno"] for c in corse if c.get("giorno")]
    else:
        g = a.giorno or (giorni_disponibili() or [None])[-1]
        if not g:
            sys.exit("Nessuna edizione in data/briefs.")
        giorni = [g]

    for g in giorni:
        s = stato(g)
        if a.stampa:
            print(json.dumps(s, ensure_ascii=False, indent=1))
            continue
        os.makedirs(OUT, exist_ok=True)
        f = os.path.join(OUT, g + ".json")
        with open(f, "w", encoding="utf-8") as h:
            json.dump(s, h, ensure_ascii=False, indent=1)
            h.write("\n")
        c = s["corsa"] or {}
        stati = ", ".join(f"{x['id']} {x['stato']}" for x in s["agenti"])
        print(f"{g}: corsa {c.get('ora_inizio') or '?'}–{c.get('ora_fine') or '?'} "
              f"({c.get('minuti') or '?'} min) · {len(s['lavagna'])} notizie · "
              f"{len(s['postit'])} post-it · {stati}")
        print(f"   -> {os.path.relpath(f, ROOT)} ({os.path.getsize(f) // 1024} KB)")


if __name__ == "__main__":
    main()
