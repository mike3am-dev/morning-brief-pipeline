#!/usr/bin/env python3
"""
Il gusto: cosa dice il modo in cui Mike legge, e cosa farne.

Fino al 30 settembre 2026 la taratura usava due pollici, su e giu'. Mike non li
premeva ("non li uso"): dal 1 ottobre l'app registra invece come si legge —
quali voci si vedono e si saltano, quali si aprono, quanto ci si resta, cosa
si approfondisce, si ascolta, si apre alla fonte — e resta solo il pollice giu',
per dire "questo proprio no". Qui i segnali diventano voti con un peso:

    pollice giu'                                   -2
    vista e saltata (solo le edizioni dei giorni prima)  -0,5
    aperta e chiusa subito                         +0,25
    aperta e letta (12 secondi o piu')             +0,5
    approfondita, ascoltata, aperta alla fonte,
    o letta a lungo (40 secondi o piu')            +1
    (i vecchi pollici su restano: +1)

Una voce mai arrivata a schermo non dice niente: non e' un salto. Il voto non
giudica l'argomento, giudica la **presenza in rassegna**.

    python3 pipeline/taste.py            il digest da leggere prima di scrivere
    python3 pipeline/taste.py report     il briefing quindicinale, da discutere
    python3 pipeline/taste.py --offline  senza rete, usa l'ultimo scarico

Due regole che tengono onesto il meccanismo:

* **Il silenzio non e' un no.** Una voce che non si e' vista non conta. Un
  topic del radar va in pausa solo dopo tre uscite *viste* e saltate, e lo
  archivia solo il pollice giu', mai il salto.
* **Si declassa, non si cancella.** Un pattern confermato sposta la notizia in
  coda o nel radar. Il nucleo Apple non si tocca mai: se Apple prende una
  multa UE quella notizia entra, quanti pollici giu' ci siano stati.
"""

import argparse
import json
import os
import subprocess
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common                                    # noqa: E402
from push import load_config, service_key        # noqa: E402

ROOT = common.ROOT
TASTE_FILE = os.path.join(ROOT, "data", "taste.json")
TOPICS_FILE = os.path.join(ROOT, "data", "radar_topics.json")

# quante voci con un segnale servono prima di dare retta a un pattern
MIN_VOTES = 3
# quanto un gruppo deve stare sotto (o sopra) la media per diventare regola,
# e quante voci "medie" si aggiungono a ogni gruppo prima di confrontarlo
MARGIN, SHRINK = 0.1, 5
# ogni quanti giorni il briefing
REPORT_EVERY = 14
# quanto resta in pausa un topic bocciato una volta
PAUSE_DAYS = 42
# quante apparizioni mute prima di liberare lo slot
MUTE_LIMIT = 3
# quante voci ha il radar, e quante di queste sono sonde
RADAR_SLOTS, RADAR_PROBES = 5, 2

# L'AI non passa piu' dal radar: dal 6 settembre 2026 ha una sezione sua, con
# i suoi pollici. I topic marcati "axis": "ai" in data/radar_topics.json
# restano scritti per storia ma stanno fuori dalla rotazione — altrimenti la
# stessa cosa uscirebbe due volte nella stessa edizione.
AI_AXIS = "ai"


# ------------------------------------------------------------------ lettura

# i pesi dei segnali di lettura (vedi in cima)
W_DOWN, W_SKIP, W_GLANCE, W_READ, W_DEEP = -2, -0.5, 0.25, 0.5, 1
READ_SECS, LONG_SECS = 12, 40
SIG_PREFIX = "segnali/"


def score(e):
    """Da segnali di una voce a un peso. None se non dice niente."""
    if e.get("d") or e.get("a") or e.get("l") or e.get("t", 0) >= LONG_SECS:
        return W_DEEP
    if e.get("o"):
        return W_READ if e.get("t", 0) >= READ_SECS else W_GLANCE
    if e.get("v"):
        return W_SKIP
    return None


SIG_START = "2026-10-01"


def to_votes(rows, today, idx=None):
    """Le righe di brief_marks -> voti pesati, uno per voce.

    Il pollice giu' comanda su tutto. I segnali valgono dal 1 ottobre 2026;
    prima c'era solo read_at sulle notizie aperte, che si legge come
    "aperta" (+0,25): niente tempo, niente salti, perche' non si misuravano.
    Un salto conta solo sulle edizioni dei giorni prima: la mattina stessa
    una voce non aperta puo' ancora esserlo.

    Per l'archivio prima dei segnali si ricostruisce il salto delle sole
    notizie: nei giorni in cui Mike ne ha aperta almeno una, i titoli li ha
    scorsi tutti (stanno in fila, uno sotto l'altro), quindi quelle non
    aperte sono saltate. Senza questo, quaranta giorni di letture dicevano
    solo "si'" e ogni categoria risultava gradita."""
    out, explicit, signals, opened = {}, {}, {}, set()
    for r in rows:
        k = r.get("story") or ""
        if k.startswith(SIG_PREFIX):
            day = k[len(SIG_PREFIX):]
            try:
                obj = json.loads(r.get("note") or "{}")
            except ValueError:
                continue
            for item, e in obj.items():
                signals[f"{day}/{item}"] = e
            continue
        if r.get("vote"):
            explicit[k] = r["vote"]
        if r.get("read_at") and ":" not in k.split("/", 1)[-1]:
            opened.add(k)          # notizie aperte, anche prima dei segnali
    if idx:
        read_days = {k[:10] for k in opened if k[:10] < SIG_START}
        for k, meta in idx.items():
            if meta["kind"] == "news" and k[:10] in read_days and k not in opened:
                signals.setdefault(k, {"v": 1})
    for k in set(signals) | opened:
        e = dict(signals.get(k, {}))
        if k in opened:
            e["o"] = 1
        w = score(e)
        if w is None or (w == W_SKIP and k[:10] >= today):
            continue
        out[k] = {"story": k, "vote": w, "seen": bool(e.get("v") or e.get("o")),
                  "how": "lettura"}
    for k, v in explicit.items():
        out[k] = {"story": k, "vote": W_DOWN if v < 0 else 1, "seen": True,
                  "how": "pollice"}
    return sorted(out.values(), key=lambda r: r["story"])


def pull_votes(cfg, key):
    """Pollici e segnali di lettura da Supabase, gia' tradotti in voti pesati.

    Solo quelli del proprietario: l'app la leggono anche altri, e la service
    key salta l'RLS, quindi senza il filtro i pollici di un lettore ospite
    entrerebbero nella taratura — e sulla stessa notizia ne sovrascriverebbero
    uno dei due. `owner_id` sta in supabase/config.json.
    """
    owner = cfg.get("owner_id")
    if not owner:
        sys.exit("Manca 'owner_id' in supabase/config.json: senza, i voti "
                 "degli altri lettori sporcherebbero la taratura.")
    url = (cfg["url"] + "/rest/v1/brief_marks"
           "?select=story,vote,read_at,note,updated_at"
           "&or=(vote.neq.0,read_at.not.is.null,story.like.segnali/*)"
           f"&user_id=eq.{owner}&limit=20000")
    out = subprocess.run(
        ["curl", "-sS", "-w", "\n%{http_code}", url,
         "-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}"],
        capture_output=True, text=True)
    body, _, code = out.stdout.rpartition("\n")
    if code.strip() != "200":
        if "vote" in body and "column" in body:
            sys.exit("La colonna 'vote' non esiste ancora su brief_marks.\n"
                     "Lancia la riga in supabase/migrazioni.sql dall'editor SQL di Supabase.")
        sys.exit(f"Supabase ha risposto {code.strip()}: {body[:200]}")
    return json.loads(body)


def load_state(path, default):
    if os.path.exists(path):
        return common.load_json(path)
    return default


# --------------------------------------------------------------- incrocio

def index_archive():
    """Ogni chiave votabile con quel che serve per capirla: da che edizione
    viene, che tag e categoria aveva, chi l'ha scritta, che topic era."""
    idx = {}
    for path, b in common.briefs():
        day = b.get("date", os.path.basename(path)[:-5])
        for n in b.get("news", []):
            idx[f"{day}/{n['id']}"] = {
                "kind": "news", "date": day, "title": n.get("title", ""),
                "tag": (n.get("tag") or "").upper(),
                "category": (n.get("category") or "").lower(),
                "sources": n.get("sources") or [],
                "thread": n.get("thread"),
            }
        for r in b.get("radar", []):
            if not r.get("id"):
                continue
            idx[f"{day}/radar:{r['id']}"] = {
                "kind": "radar", "date": day, "title": r.get("title", ""),
                "topic": r.get("topic") or "senza-topic",
                "sources": [r.get("source")] if r.get("source") else [],
            }
        # "Sul banco" impara su due cose: il genere (recensione, video,
        # confronto, curiosita') e chi l'ha fatto. Il topic serve solo a
        # raggruppare, non entra nella macchina a stati del radar.
        for v in b.get("banco", []):
            if not v.get("id"):
                continue
            idx[f"{day}/banco:{v['id']}"] = {
                "kind": "banco", "date": day, "title": v.get("title", ""),
                "genere": (v.get("kind") or "").lower(),
                "sources": [v.get("source")] if v.get("source") else [],
            }
        # la sezione AI impara su due cose: il laboratorio e il genere
        # (modello, uso, trucco...). Lo strato — cronaca o LAB — si
        # ricava dal genere.
        for a in b.get("ai", []):
            if not a.get("id"):
                continue
            idx[f"{day}/ai:{a['id']}"] = {
                "kind": "ai", "date": day, "title": a.get("title", ""),
                "lab": (a.get("lab") or "altri").lower(),
                "genere": (a.get("kind") or "").lower(),
                "sources": [a.get("source")] if a.get("source") else [],
            }
        # GAMES, TECH, SPAZIO: si impara sulla fonte e sulla sezione
        for sec in ("games", "tech", "spazio"):
            for v in b.get(sec, []):
                if not v.get("id"):
                    continue
                idx[f"{day}/{sec}:{v['id']}"] = {
                    "kind": sec, "date": day, "title": v.get("title", ""),
                    "sources": [v.get("source")] if v.get("source") else [],
                }
        for m in b.get("recap", []):
            if not m.get("id"):
                continue
            idx[f"{day}/recap:{m['id']}"] = {
                "kind": "recap", "date": day, "title": m.get("title", ""),
                "sources": [m.get("source")] if m.get("source") else [],
            }
    return idx


def radar_appearances():
    """Quante volte un topic e' passato dal radar, e quando l'ultima."""
    seen = defaultdict(lambda: {"n": 0, "last": ""})
    for _, b in common.briefs():
        day = b.get("date", "")
        for r in b.get("radar", []):
            t = r.get("topic")
            if not t:
                continue
            seen[t]["n"] += 1
            seen[t]["last"] = max(seen[t]["last"], day)
    return seen


# ---------------------------------------------------------------- pattern

def tally(votes, idx):
    """Somma i voti lungo gli assi che so usare quando scelgo: categoria,
    tag, fonte, genere da banco e sezione. Un asse conta solo se ha abbastanza
    voti concordi.

    L'asse "sezione" e' quello che tiene onesto l'impianto: se "Se te lo fossi
    perso" prende tre pollici giu' di fila, la sezione non serve e va tolta,
    non difesa."""
    axes = {"categoria": defaultdict(list), "tag": defaultdict(list),
            "fonte": defaultdict(list), "banco": defaultdict(list),
            "lab": defaultdict(list), "ai": defaultdict(list),
            "sezione": defaultdict(list)}
    unknown = 0
    for row in votes:
        meta = idx.get(row["story"])
        if not meta:
            unknown += 1
            continue
        v = row["vote"]
        # una sezione si giudica su come si legge, non sui pollici sparsi:
        # i pollici su del radar e del banco erano pochi e tutti positivi
        if meta["kind"] != "news" and row.get("how") == "lettura":
            axes["sezione"][meta["kind"]].append(v)
        if meta["kind"] == "banco":
            if meta.get("genere"):
                axes["banco"][meta["genere"]].append(v)
            for s in meta["sources"]:
                axes["fonte"][s].append(v)
            continue
        if meta["kind"] in ("games", "tech", "spazio"):
            for s_ in meta["sources"]:
                axes["fonte"][s_].append(v)
            continue
        if meta["kind"] == "ai":
            axes["lab"][meta.get("lab") or "altri"].append(v)
            if meta.get("genere"):
                axes["ai"][meta["genere"]].append(v)
            for s in meta["sources"]:
                axes["fonte"][s].append(v)
            continue
        if meta["kind"] != "news":
            continue
        if meta.get("category"):
            axes["categoria"][meta["category"]].append(v)
        if meta.get("tag"):
            axes["tag"][meta["tag"]].append(v)
        for s in meta["sources"]:
            axes["fonte"][s].append(v)
    return axes, unknown


NEWS_AXES = ("categoria", "tag", "fonte")


def rules_from(axes, base):
    """Da conteggio a regola scritta. Solo declassamenti e conferme, niente
    sparizioni.

    Il metro e' relativo: Mike apre circa una notizia su tre, quindi "saltata
    due volte su tre" e' la media, non un rifiuto. Una categoria si declassa
    quando si legge sensibilmente MENO della media delle altre, e si tiene alta
    quando si legge sensibilmente di piu'. La media di ogni gruppo e' tirata
    verso quella generale (SHRINK voci finte nella media), cosi' tre salti di
    fila su un gruppo piccolo non bastano a condannarlo."""
    out = []
    for axis, buckets in axes.items():
        b = base.get(axis, base.get("*", 0))
        for value, vs in sorted(buckets.items()):
            vs = [v for v in vs if v]
            n = len(vs)
            if n < MIN_VOTES:
                continue
            up, down = sum(1 for v in vs if v > 0), sum(1 for v in vs if v < 0)
            m = (sum(vs) + SHRINK * b) / (n + SHRINK)
            quota = f"aperta {up} {'volta' if up == 1 else 'volte'} su {n}"
            if m <= b - MARGIN:
                out.append({"asse": axis, "valore": value, "verso": "declassa",
                            "su": up, "giu": down, "scarto": round(m - b, 2),
                            "nota": f"{axis} «{value}»: {quota}, sotto la media"})
            elif m >= b + MARGIN:
                out.append({"asse": axis, "valore": value, "verso": "promuovi",
                            "su": up, "giu": down, "scarto": round(m - b, 2),
                            "nota": f"{axis} «{value}»: {quota}, sopra la media"})
    out.sort(key=lambda r: r["scarto"])
    return out


def topic_states(votes, idx, topics):
    """La macchina a stati del radar. Il voto piu' recente comanda."""
    seen = radar_appearances()
    tv = defaultdict(list)          # (giorno, peso, come) per topic
    last_up = {}
    for row in votes:
        meta = idx.get(row["story"])
        if not meta or meta["kind"] != "radar":
            continue
        t = meta["topic"]
        tv[t].append((meta["date"], row["vote"], row.get("how", "pollice")))
        if row["vote"] >= 1:
            last_up[t] = max(last_up.get(t, ""), meta["date"])

    today = date.today().isoformat()
    for t in set(list(seen) + list(tv) + list(topics)):
        e = topics.setdefault(t, {"state": "nuovo", "since": today,
                                  "up": 0, "down": 0, "seen": 0, "last": ""})
        # su: ogni segno d'interesse; giu': solo il pollice, mai il salto
        e["up"] = sum(1 for _, v, _h in tv[t] if v > 0)
        e["down"] = sum(1 for _, v, h in tv[t] if v < 0 and h == "pollice")
        e["seen"] = seen[t]["n"] if t in seen else 0
        e["last"] = seen[t]["last"] if t in seen else e.get("last", "")

        # Una pausa gia' scontata non si riapre per lo stesso motivo. Il pollice
        # giu' resta scritto per sempre, quindi la regola "1 giu' = in pausa"
        # tornava vera a ogni corsa e rimandava avanti la scadenza di altre sei
        # settimane: il topic non rientrava mai. La pausa si sconta una volta,
        # poi il topic riprova — a bocciarlo davvero e' il secondo pollice giu'.
        # 1 ottobre 2026, una volta sola: le pause decise quando l'app non
        # vedeva se il radar si leggeva si annullano. Erano silenzi, non no.
        if not e.get("ripresa_segnali"):
            e["ripresa_segnali"] = today
            if e["state"] == "in pausa" and e["down"] == 0:
                e.update(state="in prova", since=today, pausa_finita=today,
                         seen_a_fine_pausa=e["seen"])
                e.pop("paused_until", None)

        scontata = bool(e.get("pausa_finita"))
        # mute = uscite viste e saltate, da quando e' rientrato. Fino al 30
        # settembre 2026 contava le uscite senza pollice, e l'app non sapeva
        # se il radar l'avevi letto: 22 topic su 36 erano finiti in pausa
        # per un silenzio che non era un no.
        ripresa = e.get("pausa_finita", "")
        recenti = [(d, v) for d, v, _h in tv[t] if d >= ripresa]
        mute = sum(1 for _, v in recenti if v < 0)
        mute = 0 if any(v > 0 for _, v in recenti) else mute

        was = e["state"]
        if e["down"] >= 2:
            e["state"] = "archiviato"
        elif e["up"] - e["down"] >= 2:
            e["state"] = "confermato"
        elif e["down"] == 1 and not scontata:
            e["state"] = "in pausa"
        elif mute >= MUTE_LIMIT:
            e["state"] = "in pausa"
        elif e["seen"] > 0:
            e["state"] = "in prova"

        if e["state"] != was:
            e["since"] = today
            if e["state"] == "in pausa":
                e["paused_until"] = (date.today() + timedelta(days=PAUSE_DAYS)).isoformat()
            else:
                e.pop("paused_until", None)

        # la pausa scade da sola, e lascia il segno di essere stata fatta
        if e["state"] == "in pausa" and e.get("paused_until", "") < today:
            e["state"] = "in prova"
            e["since"] = today
            e["pausa_finita"] = today
            e["seen_a_fine_pausa"] = e["seen"]
            e.pop("paused_until", None)
    return topics, last_up


def radar_plan(topics, last_up, archive_last_day):
    """Le cinque caselle di oggi: le confermate a rotazione, piu' le sonde.
    Un pollice su ieri vale un seguito oggi — e' la reazione che si sente."""
    topics = {t: e for t, e in topics.items() if e.get("axis") != AI_AXIS}
    follow = [t for t, day in last_up.items() if day == archive_last_day and t in topics]
    confirmed = sorted([t for t, e in topics.items() if e["state"] == "confermato"],
                       key=lambda t: topics[t].get("last", ""))
    trial = sorted([t for t, e in topics.items() if e["state"] == "in prova"],
                   key=lambda t: topics[t].get("last", ""))
    fresh = sorted([t for t, e in topics.items() if e["state"] == "nuovo"])

    plan, used = [], set()

    def prendi(pool, quanti, etichetta):
        for t in pool:
            if quanti <= 0:
                return
            if t in used:
                continue
            plan.append((t, etichetta(t)))
            used.add(t)
            quanti -= 1

    # le caselle sicure: il seguito di ieri, poi i confermati, e finche' non
    # ce ne sono abbastanza i topic gia' visti ma ancora senza verdetto
    prendi(follow + confirmed + trial, RADAR_SLOTS - RADAR_PROBES - len(plan),
           lambda t: "seguito" if t in follow else
                     ("confermato" if t in confirmed else "in prova"))
    # le sonde: prima i mai provati, poi i vecchi incerti da ritentare
    prendi(fresh + trial, RADAR_PROBES, lambda t: "sonda")
    # se qualcosa e' avanzato (archivio giovane), si riempie con quel che c'e'
    prendi(confirmed + trial + fresh, RADAR_SLOTS - len(plan),
           lambda t: "in prova" if t in trial else "sonda")
    return plan, follow


# ----------------------------------------------------------------- stampe

def digest(state, topics, plan, follow, axes, rules, votes, idx):
    print(common.rule("Il gusto — come legge Mike"))
    voted = len(votes)
    if not voted:
        print("Ancora nessun voto. Il meccanismo è pronto, serve solo che qualcuno")
        print("cominci a premere i pollici: le prime indicazioni arrivano con una")
        print(f"ventina di voti, le regole vere sopra i {MIN_VOTES} concordi per asse.\n")
    else:
        n_down = sum(1 for v in votes if v.get("how") == "pollice" and v["vote"] < 0)
        print(f"{voted} voci con un segnale di lettura ({n_down} pollici giù).\n")

    if rules:
        print("Indicazioni per la selezione di oggi:")
        giu = [r for r in rules if r["verso"] == "declassa"]
        su = [r for r in rules if r["verso"] != "declassa"][::-1][:6]
        for r in giu + su:
            verso = "declassa (in coda o nel radar)" if r["verso"] == "declassa" else "tieni alto"
            print(f"  · {r['nota']} → {verso}")
        print("  Il nucleo Apple resta fuori da queste regole.\n")
    elif voted:
        print("Nessun gruppo si stacca dalla media: la selezione resta com'è.\n")

    print(f"Radar di oggi — {RADAR_SLOTS} caselle:")
    for t, why in plan:
        e = topics.get(t, {})
        marker = {"seguito": "↑ seguito di ieri", "confermato": "confermato",
                  "in prova": "in prova", "sonda": "sonda"}.get(why, why)
        n_out = e.get('seen', 0)
        conto = f"{e.get('up',0)}↑ {e.get('down',0)}↓ · {n_out} uscit" + ("a" if n_out == 1 else "e")
        print(f"  · {t:26} {marker:18} {conto}")
    if follow:
        print(f"  Da riprendere per forza: {', '.join(follow)} (letta a fondo ieri).")
    print()

    parked = [t for t, e in topics.items() if e["state"] in ("in pausa", "archiviato")]
    if parked:
        print("Fuori rotazione: " + ", ".join(
            f"{t} ({topics[t]['state']})" for t in sorted(parked)))
    print()


def report(state, topics, rules, axes, idx, votes):
    last = state.get("last_report")
    print(common.rule(f"Briefing — dal {last or 'primo giorno'} a oggi"))

    if not rules:
        print("Nessun declassamento attivo: la selezione non si è ancora stretta.\n")
    else:
        print("Cosa sto declassando, e perché:\n")
        for r in rules:
            if r["verso"] != "declassa":
                continue
            print(f"  {r['asse']} «{r['valore']}» — {r['giu']} giù su {r['su'] + r['giu']}")
            def colpita(meta):
                if r["asse"] == "fonte":
                    return r["valore"] in (meta.get("sources") or [])
                campo = "category" if r["asse"] == "categoria" else "tag"
                return meta.get(campo) == r["valore"]

            esempi = [idx[row["story"]]["title"] for row in votes
                      if row["vote"] < 0 and row["story"] in idx
                      and colpita(idx[row["story"]])]
            for t in esempi[:3]:
                print(f"      ↓ {t[:72]}")
        print()

    print("Radar:")
    for stato in ("confermato", "in prova", "in pausa", "archiviato"):
        righe = [t for t, e in topics.items() if e["state"] == stato]
        if righe:
            print(f"  {stato:12} {', '.join(sorted(righe))}")
    print()

    contro = [r for r in rules if 0 < min(r["su"], r["giu"])]
    if contro:
        print("Voti che si contraddicono — da sciogliere a voce:")
        for r in contro:
            print(f"  · {r['asse']} «{r['valore']}»: {r['su']}↑ e {r['giu']}↓")
        print()

    print("Da chiedere: quello che è uscito dalla rassegna ti manca, o va bene così?")
    print()


# ------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("modo", nargs="?", default="digest", choices=["digest", "report"])
    ap.add_argument("--offline", action="store_true",
                    help="non interroga Supabase, usa l'ultimo scarico in data/taste.json")
    args = ap.parse_args()

    state = load_state(TASTE_FILE, {"votes": [], "pulled": None, "last_report": None})
    # al primo giro il contatore del briefing parte da oggi, altrimenti
    # scatterebbe subito e ogni mattina
    primo_giro = state.get("last_report") is None
    if primo_giro:
        state["last_report"] = date.today().isoformat()
    if args.offline:
        votes = state.get("votes", [])
    else:
        cfg = load_config()
        votes = to_votes(pull_votes(cfg, service_key()), date.today().isoformat(), index_archive())
        state["votes"] = votes
        state["pulled"] = datetime.now().isoformat(timespec="seconds")

    idx = index_archive()
    topics = load_state(TOPICS_FILE, {})
    axes, unknown = tally(votes, idx)
    # la media di confronto: per le notizie quella delle notizie, per le
    # altre sezioni quella di ciascun asse (il radar non si legge come le notizie)
    def media(vs):
        vs = [v for v in vs if v]
        return sum(vs) / len(vs) if vs else 0
    news_w = [v["vote"] for v in votes if (idx.get(v["story"]) or {}).get("kind") == "news"]
    base = {a: media(news_w) for a in NEWS_AXES}
    for a, buckets in axes.items():
        if a not in base:
            base[a] = media([v for vs in buckets.values() for v in vs])
    rules = rules_from(axes, base)
    topics, last_up = topic_states(votes, idx, topics)
    days = [b.get("date", "") for _, b in common.briefs()]
    plan, follow = radar_plan(topics, last_up, max(days) if days else "")

    state["rules"] = rules
    common.save_json(TOPICS_FILE, dict(sorted(topics.items())))

    if args.modo == "report":
        report(state, topics, rules, axes, idx, votes)
        state["last_report"] = date.today().isoformat()
    else:
        digest(state, topics, plan, follow, axes, rules, votes, idx)
        due = state.get("last_report")
        if not primo_giro and (common.days_between(date.today().isoformat(), due) or 0) >= REPORT_EVERY:
            print(f"※ Sono passati {REPORT_EVERY} giorni o più dall'ultimo briefing: "
                  f"lancia `python3 pipeline/taste.py report` e parlane con Mike.")
        if unknown:
            print(f"({unknown} voti su notizie non più in archivio, ignorati.)")

    common.save_json(TASTE_FILE, state)
    return 0


if __name__ == "__main__":
    sys.exit(main())
