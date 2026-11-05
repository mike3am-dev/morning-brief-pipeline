#!/usr/bin/env python3
"""
Il collaudo dell'edizione.

Le regole editoriali stanno scritte in CLAUDE.md, e valgono finche' qualcuno
le fa rispettare. Dopo cento edizioni lo standard scivola senza che nessuno se
ne accorga: le descrizioni si accorciano, le virgolette perdono l'attribuzione,
il rank smette di seguire l'importanza e comincia a seguire l'ordine in cui
sono state scritte. Questo script legge un'edizione e la mette alla prova
contro le sue stesse regole.

Due livelli:

  ERRORE   l'edizione e' rotta o contraddice una regola non negoziabile.
           Va sistemata prima di pubblicare.
  AVVISO   qualcosa e' fuori misura. Spesso e' voluto, ma va guardato.

    python3 pipeline/lint.py                 l'edizione di oggi
    python3 pipeline/lint.py 2026-08-08      una data precisa
    python3 pipeline/lint.py --all           tutto l'archivio
    python3 pipeline/lint.py --links         controlla anche che i link aprano

Esce con 1 se trova errori, cosi' si puo' mettere in coda a un comando.
"""

import argparse
import concurrent.futures as cf
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C

TAGS = {"CONFERMATO", "RUMOR", "DATI", "ANALISI", "OPINIONE",
        "CONTORNO", "CONTESTO", "SERVIZIO"}
RELIABILITY = {"alta", "media", "bassa"}

# le misure dichiarate in CLAUDE.md
NEWS_MIN, NEWS_MAX = 15, 20
RADAR_MIN, RADAR_MAX = 0, 5
SOCIAL_MAX = 5
BANCO_MIN, BANCO_MAX = 3, 5
BANCO_KINDS = {"recensione", "video", "confronto", "curiosità", "guida"}
RECAP_MAX = 2
AI_MIN, AI_MAX = 6, 12
AI_LABS = {"anthropic", "openai", "google", "meta", "apple", "robot", "altri"}
# cronaca: cosa fanno i laboratori. LAB: cosa ci fa la gente.
AI_CRONACA = {"modello", "funzione", "affari", "regole", "ricerca"}
AI_LAB = {"uso", "demo", "trucco", "sapevi"}
# "Se te lo fossi perso" guarda indietro: sotto i due giorni e' la rassegna di
# ieri, oltre il mese non se l'e' perso, l'ha dimenticato
RECAP_MIN_AGE, RECAP_MAX_AGE = 2, 10
SINTESI_MAX = 200
DESCR_MIN, DESCR_MAX = 200, 950
INTRO_MIN, INTRO_MAX = 180, 700

# due titoli oltre questa somiglianza raccontano la stessa cosa
DUP = 0.45

# "Tono: giornalistico, asciutto. Niente hype, niente entusiasmo da creator."
HYPE = re.compile(
    r"\b(incredibil\w+|clamoros\w+|pazzesc\w+|rivoluzionar\w+|stupefacent\w+|"
    r"spettacolar\w+|da urlo|boom|imperdibil\w+|sensazional\w+|epic\w+|"
    r"assurd\w+|mostruos\w+|bomba)\b", re.I)

# una descrizione senza cifre e senza virgolette non porta niente di concreto
NUMBER = re.compile(r"\d")
QUOTE = re.compile(r"[\"«»“”]")
# chi l'ha detto: serve accanto a una citazione
ATTRIB = re.compile(
    r"\b(second\w+|scriv\w+|dichiar\w+|afferm\w+|spieg\w+|ricord\w+|riferisc\w+|"
    r"sostien\w+|ha detto|racconta|nota|osserva|conferma)\b", re.I)


class Report:
    def __init__(self, day):
        self.day, self.errors, self.warnings = day, [], []

    def error(self, where, msg):
        self.errors.append((where, msg))

    def warn(self, where, msg):
        self.warnings.append((where, msg))

    def show(self):
        print(C.rule(f"Edizione del {self.day}"))
        if not self.errors and not self.warnings:
            print("Nessun rilievo.")
            return
        for where, msg in self.errors:
            print(f"  ERRORE  {where}: {msg}")
        for where, msg in self.warnings:
            print(f"  avviso  {where}: {msg}")
        print(f"\n{len(self.errors)} errori, {len(self.warnings)} avvisi.")


# ---------------------------------------------------------------- struttura

def check_shape(brief, r):
    for field in ("date", "title", "top3", "intro", "news"):
        if not brief.get(field):
            r.error("edizione", f"manca il campo {field}")

    top3 = brief.get("top3") or []
    if len(top3) != 3:
        r.error("top3", f"{len(top3)} voci invece di 3")
    for i, t in enumerate(top3):
        if len(t) > 190:
            r.warn(f"top3[{i+1}]", f"{len(t)} caratteri: e' un titolo, non un riassunto")

    intro = brief.get("intro") or ""
    if intro and not (INTRO_MIN <= len(intro) <= INTRO_MAX):
        r.warn("intro", f"{len(intro)} caratteri, attese 3-4 righe "
                        f"({INTRO_MIN}-{INTRO_MAX})")

    news = brief.get("news") or []
    if not (NEWS_MIN <= len(news) <= NEWS_MAX):
        r.warn("news", f"{len(news)} notizie, la misura dichiarata e' "
                       f"{NEWS_MIN}-{NEWS_MAX}")

    radar = brief.get("radar") or []
    if radar and not (RADAR_MIN <= len(radar) <= RADAR_MAX):
        r.warn("radar", f"{len(radar)} voci, attese {RADAR_MIN}-{RADAR_MAX}")
    check_radar_home(brief, radar, r)
    # senza id la voce non e' votabile, senza topic il radar non impara
    for v in radar:
        titolo = (v.get("title") or "")[:46]
        if not v.get("id"):
            r.warn("radar", f"voce senza id, non votabile: {titolo}")
        if not v.get("topic"):
            r.warn("radar", f"voce senza topic, il radar non impara: {titolo}")

    banco = brief.get("banco") or []
    if banco and not (BANCO_MIN <= len(banco) <= BANCO_MAX):
        r.warn("banco", f"{len(banco)} voci, attese {BANCO_MIN}-{BANCO_MAX}")
    for v in banco:
        titolo = (v.get("title") or "")[:46]
        if not v.get("id"):
            r.warn("banco", f"voce senza id, non votabile: {titolo}")
        if v.get("kind") not in BANCO_KINDS:
            r.warn("banco", f"genere non ammesso ({v.get('kind')!r}): {titolo}")
        # senza il "perche'" la sezione non esiste: e' una recensione qualsiasi
        if not v.get("perche"):
            r.error("banco", f"voce senza il perche' serve al banco: {titolo}")
        if not v.get("link"):
            r.error("banco", f"voce senza link: {titolo}")

    check_recap(brief, r)

    ai = brief.get("ai") or []
    if ai and not (AI_MIN <= len(ai) <= AI_MAX):
        r.warn("ai", f"{len(ai)} voci, attese {AI_MIN}-{AI_MAX}")
    for v in ai:
        titolo = (v.get("title") or "")[:46]
        if not v.get("id"):
            r.warn("ai", f"voce senza id, non votabile: {titolo}")
        if (v.get("lab") or "").lower() not in AI_LABS:
            r.warn("ai", f"laboratorio non ammesso ({v.get('lab')!r}): {titolo}")
        kind = (v.get("kind") or "").lower()
        if kind in AI_LAB and not v.get("prova"):
            # senza "come lo provi tu" e' una curiosita'; con quella e' lo sblocco
            r.error("ai", f"voce LAB senza il come provarlo: {titolo}")
        if kind in AI_LAB and not v.get("image"):
            # la foto del LAB e' il risultato: senza, l'occhio non si ferma
            r.warn("ai", f"voce LAB senza foto (lancia images.py, o scegli un link "
                         f"che mostri il risultato): {titolo}")
        elif kind in AI_CRONACA and not v.get("apple"):
            r.warn("ai", f"cronaca senza la riga su Apple (anche «niente, per ora»): {titolo}")
        elif kind not in AI_CRONACA | AI_LAB:
            r.warn("ai", f"genere non ammesso ({v.get('kind')!r}): {titolo}")
        if not v.get("link"):
            r.error("ai", f"voce senza link: {titolo}")
        # la riga che si legge a voce chiusa: una frase intera, mai un
        # troncamento. Sulla cronaca e' obbligatoria; sul LAB fa il lavoro
        # la riga "prova".
        sin = (v.get("sintesi") or "").strip()
        if kind in AI_CRONACA and not sin:
            r.warn("ai", f"cronaca senza sintesi (la riga a voce chiusa): {titolo}")
        if sin and (sin.endswith("…") or sin.endswith("...")):
            r.warn("ai", f"la sintesi finisce con i puntini, dev'essere una frase intera: {titolo}")
        if len(sin) > 190:
            r.warn("ai", f"sintesi di {len(sin)} caratteri: dev'essere una riga: {titolo}")
    if ai and not any((v.get("kind") or "").lower() in AI_LAB for v in ai):
        r.warn("ai", "solo cronaca, niente LAB: la sezione e' meta' di quello che deve essere")

    social = brief.get("social") or []
    if len(social) > SOCIAL_MAX:
        r.warn("social", f"{len(social)} voci, il massimo dichiarato e' {SOCIAL_MAX}")
    for s in social:
        if not s.get("note"):
            r.warn("social", f"voce senza contesto: {(s.get('title') or '')[:50]}")
        if s.get("origine") not in (None, "eco", "nuovo"):
            r.warn("social", f"origine non ammessa: {s.get('origine')!r}")

    if not brief.get("feed_notes"):
        r.warn("feed_notes", "assente: lo stato delle fonti va sempre dichiarato")

    ranks = [n.get("rank") for n in news]
    if sorted(r_ for r_ in ranks if isinstance(r_, int)) != list(range(1, len(news) + 1)):
        r.error("news", "i rank non sono 1..n senza buchi ne' doppioni")

    ids = [n.get("id") for n in news]
    for i in set(ids):
        if i and ids.count(i) > 1:
            r.error("news", f"id ripetuto: {i}")

    if news and not news[0].get("hero"):
        r.warn("news[1]", "la notizia di apertura non ha l'immagine grande "
                          "(lancia images.py)")


_ARCHIVIO = None


def archivio():
    """Titoli e indirizzi gia' usciti, con la loro data: (data, titolo, url).

    Si costruisce una volta per corsa. Prima lo faceva check_recap a ogni
    edizione, e con --all su un anno di rassegne erano trecentosessantacinque
    ricostruzioni dello stesso indice."""
    global _ARCHIVIO
    if _ARCHIVIO is None:
        rows = []
        for _, b in C.briefs():
            day = b.get("date", "")
            for n in b.get("news", []):
                rows.append((day, n.get("title", ""),
                             C.norm_url(n["link"]) if n.get("link") else None))
            for sec in ("ai", "radar", "banco", "recap"):
                for v in b.get(sec) or []:
                    rows.append((day, v.get("title", ""),
                                 C.norm_url(v["link"]) if v.get("link") else None))
        _ARCHIVIO = rows
    return _ARCHIVIO


# Le schede che hanno una casa per il loro materiale: quello che spetta a
# loro non va nel radar, altrimenti la stessa cosa esce due volte.
OTHER_HOMES = {"ai": "AI", "games": "GAMES", "tech": "TECH", "spazio": "SPAZIO"}


def check_radar_home(brief, radar, r):
    """Il radar e' per quello che non ha un'altra scheda (31 ottobre 2026).

    Due prove. Il tema: se in data/radar_topics.json ha una "axis" di AI,
    GAMES, TECH o SPAZIO, la voce spetta a quella scheda — errore. Il link:
    se la stessa pagina sta gia' fra le voci AI o nelle rubriche della stessa
    edizione, e' un doppione dentro il giorno — errore."""
    if not radar:
        return
    topics = {}
    path = os.path.join(C.ROOT, "data", "radar_topics.json")
    if os.path.exists(path):
        topics = C.load_json(path)
    altrove = {}
    for sec, nome in OTHER_HOMES.items():
        for v in brief.get(sec) or []:
            if isinstance(v, dict) and v.get("link"):
                altrove[C.norm_url(v["link"])] = nome
    for v in radar:
        titolo = (v.get("title") or "")[:46]
        casa = OTHER_HOMES.get((topics.get(v.get("topic") or "") or {}).get("axis") or "")
        if casa:
            r.error("radar", f"{titolo}: il tema «{v.get('topic')}» spetta alla scheda {casa}")
        doppio = altrove.get(C.norm_url(v["link"])) if v.get("link") else None
        if doppio:
            r.error("radar", f"{titolo}: c'e' gia' nella scheda {doppio} di oggi")


def check_recap(brief, r):
    """"Se te lo fossi perso" ha una sola regola vera: che tu non l'abbia
    gia' avuto. Una voce gia' passata in edizione svuota la sezione del suo
    senso, quindi si confronta con tutto l'archivio prima di lasciarla."""
    recap = brief.get("recap") or []
    if not recap:
        return
    if len(recap) > RECAP_MAX:
        r.error("recap", f"{len(recap)} voci, il massimo e' {RECAP_MAX}: "
                         "oltre diventa un doppione della rassegna")

    oggi = brief.get("date") or C.today()
    vecchi = [t for day, t, _ in archivio() if day != oggi and t]
    urls = {u for day, _, u in archivio() if day != oggi and u}

    # le notizie dell'archivio per id, per controllare le voci "perse da te"
    per_id = {}
    for _, b in C.briefs():
        for n in b.get("news", []):
            per_id[(b.get("date", ""), n.get("id"))] = n

    for v in recap:
        titolo = (v.get("title") or "")[:46]
        if not v.get("id"):
            r.warn("recap", f"voce senza id, non votabile: {titolo}")
        if not v.get("signal"):
            r.error("recap", f"voce senza la misura di quanto ha girato: {titolo}")
        when = v.get("when")
        if not when:
            r.error("recap", f"voce senza data d'origine: {titolo}")
        else:
            eta = C.days_between(oggi, when)
            if eta is None:
                r.error("recap", f"data d'origine illeggibile ({when!r}): {titolo}")
            elif eta < RECAP_MIN_AGE:
                r.error("recap", f"{titolo}: ha {eta} giorni, non e' un ripescaggio "
                                 f"ma la rassegna di ieri")
            elif eta > RECAP_MAX_AGE:
                r.warn("recap", f"{titolo}: ha {eta} giorni, oltre il mese non se "
                                "l'e' perso, l'ha dimenticato")
        # Una voce "persa da te" (dal 31 ottobre 2026) e' per definizione gia'
        # uscita: rimanda alla notizia originale con ref {date, id}, che deve
        # esistere davvero. Le regole contro i doppioni valgono per le altre.
        ref = v.get("ref")
        if ref:
            orig = per_id.get((ref.get("date"), ref.get("id"))) if isinstance(ref, dict) else None
            if not orig:
                r.error("recap", f"{titolo}: ref non trova la notizia originale ({ref!r})")
            elif when and ref.get("date") != when:
                r.warn("recap", f"{titolo}: when ({when}) diverso dalla data dell'originale "
                                f"({ref.get('date')})")
            continue
        if v.get("link") and C.norm_url(v["link"]) in urls:
            r.error("recap", f"gia' pubblicata in una vecchia edizione: {titolo}")
            continue
        for t in vecchi:
            if C.similarity(v.get("title", ""), t) >= DUP:
                r.error("recap", f"{titolo}: gliel'abbiamo gia' data — «{t[:50]}»")
                break


# ---------------------------------------------------------------- memoria

# Per somiglianza di titolo si guarda solo ai giorni appena prima: e' li' che
# nasce il doppione ("ieri Dots, oggi di nuovo Dots"). Il link identico invece
# non ha scadenza — un post uscito tre settimane fa e' uscito.
MEMORY_DAYS = 3
SEC_NAME = {"news": "notizie", "ai": "AI", "radar": "radar", "banco": "banco",
            "social": "discussioni", "recap": "ripescaggio"}


def check_memory(brief, r):
    """Quello che abbiamo gia' raccontato non si racconta di nuovo per sbaglio.

    Due casi. Stesso link di una vecchia edizione: e' un doppione e basta,
    errore. Titolo molto simile a una voce dei giorni appena prima: puo' essere
    un doppione o la puntata successiva — se ha lo stesso filo e' un seguito
    dichiarato e va bene, altrimenti e' un avviso che chiede di scegliere.

    Il ripescaggio ha il suo controllo (check_recap), qui non si ripete."""
    oggi = brief.get("date") or C.today()
    gia = C.published_links(before=oggi)
    recent = [(d, sec, it) for d, sec, it in C.items()
              if 0 < (C.days_between(oggi, d) or 0) <= MEMORY_DAYS]

    for sec in ("news", "ai", "radar", "banco", "social"):
        for it in brief.get(sec) or []:
            where = f"{sec}/{it.get('id') or '?'}"
            title = it.get("title", "")
            hit = gia.get(C.norm_url(it["link"])) if it.get("link") else None
            if hit:
                r.error(where, f"gia' uscita il {hit[0]} ({SEC_NAME.get(hit[1], hit[1])}): "
                               f"«{hit[2][:56]}»")
                continue
            for extra in it.get("extra_links") or []:
                prev = gia.get(C.norm_url(extra.get("url", "")))
                if prev:
                    r.warn(where, f"fra i link c'e' un articolo gia' uscito il {prev[0]}: "
                                  "se e' la stessa notizia e' un doppione, se e' un seguito "
                                  "dagli un filo")
                    break
            if sec not in C.MEMORY_SECTIONS:
                continue
            for d, psec, p in recent:
                if C.similarity(title, p.get("title", ""), cross_language=False) < DUP:
                    continue
                if it.get("thread") and it.get("thread") == p.get("thread"):
                    break                      # seguito dichiarato: e' la memoria che funziona
                r.warn(where, f"somiglia a «{p.get('title','')[:50]}» del {d} "
                              f"({SEC_NAME.get(psec, psec)}): se e' un seguito dagli lo "
                              "stesso filo e di' cosa e' cambiato, se no e' un doppione")
                break


# ---------------------------------------------------------------- approfondimento

DEEP_TOP = 5
DEEP_KINDS = {"leggi", "ascolta", "guarda"}
# le visualizzazioni che l'app sa disegnare, e cosa serve a ognuna. Un tipo
# che l'app non conosce non si vede e non da' errore: per questo lo blocca qui
VISIVI = {
    "stime": lambda v: len(v.get("punti") or []) >= 2 or bool(v.get("chiave")),
    "barre": lambda v: bool(v.get("voci")),
    "resa": lambda v: isinstance(v.get("resa"), (int, float)),
    "esploso": lambda v: len(v.get("strati") or []) >= 2,
    "piega": lambda v: True,
    "anno": lambda v: bool(v.get("eventi")),
    "raggio": lambda v: isinstance(v.get("raggio_km"), (int, float)),
    "flusso": lambda v: bool(v.get("oggi")) and bool(v.get("agente")),
    "onde": lambda v: True,
    "densita": lambda v: True,
    "supporto": lambda v: bool(v.get("varianti")),
    "roadmap": lambda v: bool(v.get("periodi")) and bool(v.get("linee")),
    "catena": lambda v: len(v.get("passi") or []) >= 3,
    "chat": lambda v: len(v.get("messaggi") or []) >= 3,
}
# la varieta': lo stesso tipo due volte nella stessa edizione e' quasi sempre
# un ripiego (1 ottobre 2026: due "esploso", e su HomePad non spiegava niente)
DATA_OK = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")
# le misure dell'approfondimento sul telefono: oltre, si scorre troppo
# (30 settembre 2026, "scorro scorro tante sezioni"). Dal 1 novembre 2026 e'
# un articolo: titolo suo, sommario, numeri, testo, voci degli altri, letture.
DEEP_MAX = {"titolo": 80, "punto": 200, "sotto_par": 3, "sotto_len": 450, "numeri": 3,
            "voci": 4, "voce_len": 240, "letture": 3, "perche_len": 70}
DEEP_VOCI = {"analista", "testata", "apple", "social", "storia", "esperto"}
# il titolo dell'approfondimento che somiglia a quello della notizia la ripete
DEEP_TITLE_SAME = 0.5


RUBRICHE_MAX = {"games": 10, "tech": 8, "spazio": 5}


def check_rubriche(brief, r):
    """GAMES, TECH, SPAZIO (rubriche.py): mai oltre il tetto, mai voci senza
    titolo o link. Il vuoto e' legittimo: meglio una scheda vuota che di riempitivi."""
    for k, tetto in RUBRICHE_MAX.items():
        voci = brief.get(k) or []
        if len([v for v in voci if not v.get("perso")]) > tetto:
            r.warn(k, f"{len(voci)} voci, il tetto e' {tetto}")
        if len([v for v in voci if v.get("top")]) > 3:
            r.warn(k, "piu' di tre voci grandi")
        for v in voci:
            if not (v.get("id") and v.get("title") and v.get("link")):
                r.error(k, f"voce senza id, titolo o link: {v.get('title') or v.get('orig')}")


# il reparto: la parola sopra il titolo nella lista del Duo (2 novembre 2026)
REPARTI = {"Mac", "iPhone", "iPad", "Watch", "Casa", "Servizi", "Software", "Mercato",
           "Regole", "Azienda", "Eventi", "Accessori", "AI"}


def check_accenti(brief, r):
    """«meta'», «gia'», «perche'»: gli accenti scritti con l'apostrofo (2 novembre
    2026, in apertura). Si correggono con pipeline/accenti.py --fix."""
    import accenti
    n = accenti.walk(brief, False)
    if n:
        r.error("accenti", f"{n} accenti scritti con l'apostrofo (meta', gia', perche'): "
                           "lancia python3 pipeline/accenti.py --fix")


def check_magazine(brief, r):
    """La vista Magazine (2 novembre 2026) vuole due pezzi in piu': la
    citazione che porta dentro un approfondimento e il commento della
    redazione, ancorato alle notizie del giorno. Mancano? L'app regge (la
    citazione la ripesca dalle voci, il commento non esce), ma e' un avviso."""
    ids = {n.get("id") for n in brief.get("news") or []}
    c = brief.get("citazione")
    if not c:
        r.warn("citazione", "manca: nella vista Magazine «L'ultima parola» la ripesca dalle voci")
    else:
        if not c.get("testo") or not c.get("chi"):
            r.error("citazione", "senza testo o senza chi l'ha detta")
        if c.get("notizia") not in ids:
            r.error("citazione", f"la notizia {c.get('notizia')!r} non e' in questa edizione")
        if len(c.get("testo") or "") > 200:
            r.warn("citazione", f"{len(c['testo'])} caratteri: «L'ultima parola» regge fino a 200")
        if c.get("chi") and re.match(r"(?i)^(un|una|gli|alcuni) ", c["chi"]):
            r.warn("citazione", "un anonimo non e' «L'ultima parola»: serve una persona con nome")
    e = brief.get("editoriale")
    if not e:
        r.warn("editoriale", "manca «Il punto»: nella vista Magazine il commento non esce")
    else:
        if not e.get("titolo") or not e.get("testo"):
            r.error("editoriale", "senza titolo o senza testo")
        testo = e.get("testo") or []
        if len(testo) > 3 or any(len(x) > 480 for x in testo):
            r.warn("editoriale", "al massimo 3 paragrafi da 480 caratteri")
        if len(e.get("titolo") or "") > 70:
            r.warn("editoriale", f"titolo di {len(e['titolo'])} caratteri, massimo 70")
        mancanti = [x for x in e.get("notizie") or [] if x not in ids]
        if mancanti:
            r.error("editoriale", f"notizie collegate che non sono in edizione: {', '.join(mancanti)}")
        if len(e.get("notizie") or []) < 2:
            r.warn("editoriale", "collegato a meno di due notizie: il commento deve tenerle insieme")


def check_plancia(brief, r):
    """La plancia del mattino nella Magazine: `borsa` la scrive pipeline/borsa.py,
    `prossimo` lo scrive la corsa (il lancio o l'evento piu' vicino, con la data)."""
    if not brief.get("borsa"):
        r.warn("borsa", "manca: lancia python3 pipeline/borsa.py (la plancia fa a meno del riquadro)")
    ids = {n.get("id") for n in brief.get("news") or []}
    prossimi = brief.get("prossimo") or []
    if not prossimi:
        r.warn("prossimo", "manca il prossimo lancio o evento per la plancia")
    for x in prossimi:
        if not x.get("titolo") or not DATA_OK.match(str(x.get("data", ""))) or len(str(x.get("data"))) != 10:
            r.error("prossimo", f"voce senza titolo o senza data AAAA-MM-GG: {x}")
        elif (C.days_between(x["data"], brief.get("date", C.today())) or 0) < 0:
            r.warn("prossimo", f"«{x['titolo']}» e' gia' passato ({x['data']})")
        if len(x.get("titolo") or "") > 14:
            r.warn("prossimo", f"«{x['titolo']}»: nella plancia va a capo oltre 14 caratteri (solo il prodotto o l'evento)")
        if re.match(r"(?i)(uscita|lancio|arriva|in negozio)\b", x.get("titolo") or ""):
            r.warn("prossimo", f"«{x['titolo']}»: solo il nome del prodotto o dell'evento, senza «uscita»")
        if x.get("notizia") and x["notizia"] not in ids:
            r.warn("prossimo", f"la notizia {x['notizia']!r} non e' in questa edizione: il riquadro non si potra' toccare")


def check_origine(brief, r):
    """`origine` e' il riferimento supremo della notizia: chi l'ha detta o dichiarata
    per primo (Bloomberg, Apple, AppleDB, un leaker), non chi l'ha ripresa. Nella
    Magazine e' la testata in cima alla scheda, da sola, senza «via»."""
    for n in brief.get("news") or []:
        o = n.get("origine")
        if not o:
            r.warn(f"news/{n.get('id')}", "manca `origine`: chi l'ha detta per primo (la testata in cima alla scheda)")
        elif re.search(r"\bvia\b|,|\(", o):
            r.warn(f"news/{n.get('id')}", f"origine {o!r}: un nome solo, senza «via» e senza parentesi")


def check_foto(brief, r):
    """Le prime cinque stanno in schede grandi: una foto stretta si vede sgranata.
    images.py cerca gia' fra le altre testate; qui si guarda cosa ne e' uscito."""
    try:
        import base64, io
        from PIL import Image
    except Exception:
        return
    for i, n in enumerate((brief.get("news") or [])[:5]):
        src = (n.get("hero") if i == 0 else None) or n.get("image")
        if not src or not src.startswith("data:"):
            r.warn(f"news/{n.get('id')}", "nessuna foto fra le prime cinque: lancia python3 pipeline/images.py")
            continue
        try:
            w = Image.open(io.BytesIO(base64.b64decode(src.split(",", 1)[1]))).width
        except Exception:
            continue
        need = 1100 if i == 0 else 700
        if w < need:
            r.warn(f"news/{n.get('id')}", f"foto larga {w}px, sgranata nella scheda (servono {need}): cercane una migliore fra le altre testate")


# ------------------------------------------------------------ tutte le novita'
# Quando Apple rilascia un sistema, una notizia fra le prime cinque porta
# l'elenco completo di quello che cambia (5 novembre 2026, Mike: «sapere tutto,
# non quattro notizie sparse»). Ogni voce: sistema, area, cosa, dettaglio, fonte, link.
NOVITA_MAX = {"sistema": 40, "area": 40, "cosa": 120, "dettaglio": 220, "fonte": 40}
# il titolo di un rilascio nel feed Apple Developer Releases: «iOS 27.3 beta
# (24C5037i)», «macOS 27.2 (26B52)». Xcode, TestFlight e App Store Connect non
# sono sistemi: per loro l'elenco non serve.
RILASCIO = re.compile(r"^(iOS|iPadOS|macOS|watchOS|tvOS|visionOS|HomePod Software)\s+\d+(\.\d+)*"
                      r"(\s+(beta(\s+\d+)?|RC(\s+\d+)?|Release Candidate))?\s*\(", re.I)


def check_novita(brief, r):
    """Il campo `novita` e' ben fatto; e se nel grezzo del giorno c'e' un rilascio
    di sistema, una delle prime cinque notizie lo racconta con l'elenco completo."""
    news = brief.get("news") or []
    for n in news:
        nov = n.get("novita")
        if nov is None:
            continue
        where = f"news/{n.get('id')}/novita"
        if not isinstance(nov, list) or not nov:
            r.error(where, "`novita` e' una lista non vuota di {sistema, area, cosa, dettaglio, fonte, link}")
            continue
        seen = set()
        for i, v in enumerate(nov, 1):
            w = f"{where}[{i}]"
            if not isinstance(v, dict):
                r.error(w, "ogni voce e' un oggetto {sistema, area, cosa, dettaglio, fonte, link}")
                continue
            for f in ("sistema", "area", "cosa", "fonte", "link"):
                if not isinstance(v.get(f), str) or not v.get(f).strip():
                    r.error(w, f"manca `{f}`")
            if "dettaglio" in v and v["dettaglio"] is not None and not isinstance(v["dettaglio"], str):
                r.error(w, "`dettaglio` e' un testo")
            for f, lim in NOVITA_MAX.items():
                val = v.get(f)
                if isinstance(val, str) and len(val) > lim:
                    r.error(w, f"`{f}` di {len(val)} caratteri (massimo {lim})")
            link = v.get("link")
            if isinstance(link, str) and link and not re.match(r"^https?://", link):
                r.error(w, f"link non valido: {link!r}")
            k = (str(v.get("sistema", "")).lower(), C.deaccent(str(v.get("cosa", "")).lower()))
            if k in seen:
                r.warn(w, f"voce ripetuta: {v.get('cosa')!r}")
            seen.add(k)

    # il rilascio nel grezzo del giorno, uscito nella finestra
    path = os.path.join(C.RAW_DIR, f"{brief.get('date')}.json")
    if not os.path.exists(path):
        return
    try:
        raw = C.load_json(path)
    except Exception:
        return
    window = float(raw.get("window_hours") or 26)
    rel = []
    for it in raw.get("items") or []:
        if it.get("source") != "Apple Developer Releases":
            continue
        try:
            if float(it.get("age_hours") or 0) > window:
                continue
        except ValueError:
            pass
        if RILASCIO.match(it.get("title") or ""):
            rel.append(it.get("title"))
    if rel and not any(n.get("novita") for n in news[:5]):
        r.warn("news", f"nel grezzo c'e' un rilascio ({'; '.join(rel[:3])}{'…' if len(rel) > 3 else ''}) "
                       "e nessuna delle prime cinque ha `novita`: serve l'elenco completo di cosa cambia")


def check_reparto(brief, r):
    """Ogni notizia dice il suo reparto, uno della lista: nell'app del Duo e'
    quello che fa capire che notizia aspettarsi prima di aprirla."""
    for n in brief.get("news") or []:
        rep = n.get("reparto")
        if not rep:
            r.warn(f"news/{n.get('id')}", "manca il reparto (Mac, iPhone, Mercato, Regole…)")
        elif rep not in REPARTI:
            r.warn(f"news/{n.get('id')}", f"reparto {rep!r} fuori lista: {', '.join(sorted(REPARTI))}")


def check_approfondimento(brief, r):
    """Le prime cinque notizie hanno l'approfondimento, e l'approfondimento e'
    un articolo che va oltre la notizia (1 novembre 2026): un titolo suo che
    non la ripete, il testo, le voci degli altri con chi le ha dette, letture
    vere e — se c'e' — una visualizzazione che l'app sa disegnare. Tappe, «chi
    lo dice» e «cosa aspettarsi» non si scrivono piu': l'app non li mostra."""
    news = sorted(brief.get("news") or [], key=lambda n: n.get("rank") or 99)
    tipi_usati = []
    for n in news[:DEEP_TOP]:
        if not n.get("approfondimento"):
            r.warn(f"news/{n.get('id')}", f"fra le prime {DEEP_TOP} ma senza approfondimento")
    for n in news:
        a = n.get("approfondimento")
        if not a:
            continue
        where = f"news/{n.get('id')}/approfondimento"
        for field in ("titolo", "sotto"):
            if not a.get(field):
                r.error(where, f"manca {field}")
        if a.get("titolo") and C.similarity(a["titolo"], n.get("title", ""), cross_language=False) >= DEEP_TITLE_SAME:
            r.warn(where, "il titolo ripete quello della notizia: l'approfondimento deve guardarla da un altro lato")
        for k in ("tappe", "fonti", "dopo"):
            if a.get(k):
                r.warn(where, f"«{k}» non si mostra piu' nell'app: non serve scriverlo")
        voci = a.get("voci") or []
        if not voci:
            r.warn(where, "nessuna voce: senza pareri, commenti o reazioni l'approfondimento non va oltre la notizia")
        for v in voci:
            if not v.get("testo") or not (v.get("chi") or v.get("dove")):
                r.error(where, "voce senza testo o senza chi l'ha detta")
            if v.get("tipo") and v["tipo"] not in DEEP_VOCI:
                r.warn(where, f"tipo di voce non previsto: {v['tipo']!r} (ammessi: {', '.join(sorted(DEEP_VOCI))})")
            if v.get("link") and not str(v["link"]).startswith(("http://", "https://")):
                r.error(where, f"voce con link non valido: {v.get('chi', '')}")
        for x in a.get("numeri") or []:
            if not x.get("valore") or not x.get("etichetta"):
                r.error(where, "numero senza valore o etichetta")
        letture = a.get("approfondire") or []
        if len(letture) < 2:
            r.warn(where, "meno di due letture in «Per andare oltre»")
        for x in letture:
            if not str(x.get("link", "")).startswith(("http://", "https://")):
                r.error(where, f"lettura senza link valido: {x.get('titolo', '')[:40]}")
            if x.get("tipo") not in DEEP_KINDS:
                r.error(where, f"tipo di lettura non ammesso: {x.get('tipo')!r}")
            if x.get("link") and x.get("link") == n.get("link"):
                r.warn(where, "una lettura e' l'articolo della notizia: c'e' gia' «Leggi su»")
        M = DEEP_MAX
        if len(a.get("titolo") or "") > M["titolo"]:
            r.warn(where, f"titolo di {len(a['titolo'])} caratteri, massimo {M['titolo']}")
        if len(a.get("punto") or "") > M["punto"]:
            r.warn(where, f"sommario di {len(a['punto'])} caratteri, massimo {M['punto']}")
        sotto = a.get("sotto") or []
        if len(sotto) > M["sotto_par"] or any(len(x) > M["sotto_len"] for x in sotto):
            r.warn(where, f"testo troppo lungo: al massimo {M['sotto_par']} paragrafi da {M['sotto_len']} caratteri")
        if len(a.get("numeri") or []) > M["numeri"]:
            r.warn(where, f"piu' di {M['numeri']} numeri: l'app mostra i primi {M['numeri']}")
        if len(voci) > M["voci"] or any(len(v.get("testo", "")) > M["voce_len"] for v in voci):
            r.warn(where, f"voci: al massimo {M['voci']}, da {M['voce_len']} caratteri l'una")
        if len(letture) > M["letture"] or any(len(x.get("perche", "")) > M["perche_len"] for x in letture):
            r.warn(where, f"«Per andare oltre»: al massimo {M['letture']} voci, «perché» entro {M['perche_len']} caratteri")
        visivi = a.get("visivi") or []
        if not visivi:
            r.warn(where, "nessuna visualizzazione: un approfondimento senza e' mezzo approfondimento")
        for v in visivi:
            tipi_usati.append(v.get("tipo"))
            check = VISIVI.get(v.get("tipo"))
            if not check:
                r.error(where, f"visualizzazione sconosciuta all'app: {v.get('tipo')!r}")
            elif not check(v):
                r.error(where, f"visualizzazione «{v.get('tipo')}» senza i dati che le servono")
            if not v.get("didascalia"):
                r.warn(where, f"visualizzazione «{v.get('tipo')}» senza didascalia (e' anche quello che legge la voce)")
    doppi = sorted({t for t in tipi_usati if t and tipi_usati.count(t) > 1})
    for t in doppi:
        r.warn("approfondimento", f"«{t}» usata {tipi_usati.count(t)} volte in questa edizione: "
                                  "ogni notizia vuole la sua visualizzazione (vedi pipeline/visivi.py)")


# ---------------------------------------------------------------- verifica

def check_verifica(brief, r):
    """La catena delle fonti, riletta: verify.py la scrive nell'edizione, qui
    si ripetono i suoi avvisi, cosi' non si perdono se chi scrive ha lanciato
    verify.py e poi e' andato avanti senza guardare."""
    news = brief.get("news") or []
    if not news:
        return
    if not any(n.get("verifica") for n in news):
        r.warn("verifica", "nessuna notizia ha la catena delle fonti: lancia verify.py")
        return
    import verify
    for n in news:
        v = n.get("verifica")
        if not v:
            continue
        for w in verify.mismatch(n, v):
            r.warn(f"news/{n.get('id') or '?'}", w)


# ---------------------------------------------------------------- notizie

def check_story(n, r):
    where = f"news/{n.get('id') or '?'}"

    for field in ("id", "title", "sintesi", "descrizione", "link"):
        if not n.get(field):
            r.error(where, f"manca {field}")

    tag = n.get("tag")
    if tag and tag not in TAGS:
        r.error(where, f"tag non ammesso: {tag!r}")
    rel = n.get("reliability")
    if rel and rel not in RELIABILITY:
        r.error(where, f"reliability non ammessa: {rel!r}")
    # la nota sulla fonte serve dove il sourcing e' in gioco: su un annuncio di
    # servizio o su un pezzo di contesto sarebbe burocrazia
    if rel and not n.get("reliability_note") and tag in ("RUMOR", "DATI", "CONFERMATO"):
        r.warn(where, "affidabilita' dichiarata senza spiegare perche'")

    link = n.get("link") or ""
    if link and not link.startswith(("http://", "https://")):
        r.error(where, f"link non valido: {link[:50]}")

    sintesi = n.get("sintesi") or ""
    if len(sintesi) > SINTESI_MAX:
        r.warn(where, f"sintesi di {len(sintesi)} caratteri: dev'essere una riga")

    d = n.get("descrizione") or ""
    if d and len(d) < DESCR_MIN:
        r.warn(where, f"descrizione di {len(d)} caratteri: troppo poco per "
                      "dare contesto")
    if len(d) > DESCR_MAX:
        r.warn(where, f"descrizione di {len(d)} caratteri: attese 3-4 righe")
    if d and not NUMBER.search(d) and not QUOTE.search(d):
        r.warn(where, "descrizione senza un solo dato concreto ne' una citazione")
    if QUOTE.search(d) and not ATTRIB.search(d):
        r.warn(where, "c'e' una citazione ma non si capisce chi l'ha detta")

    hype = HYPE.findall(" ".join([n.get("title", ""), sintesi, d]))
    if hype:
        r.warn(where, f"tono da creator: {', '.join(sorted(set(h.lower() for h in hype)))}")

    if tag == "RUMOR" and not n.get("claim"):
        r.warn(where, "rumor senza previsione verificabile (campo claim)")

    for f in n.get("facts") or []:
        if not f.get("key") or f.get("value") is None:
            r.error(where, "lettura numerica incompleta (servono key e value)")


def check_duplicates(news, r):
    for i in range(len(news)):
        for j in range(i + 1, len(news)):
            s = C.similarity(news[i].get("title", ""), news[j].get("title", ""))
            if s >= DUP:
                r.warn("news", f"{news[i].get('id')} e {news[j].get('id')} "
                               f"sembrano la stessa notizia ({s:.0%})")


def check_ranking(news, r):
    """Il rank dovrebbe seguire l'importanza, non l'ordine di scrittura.

    L'unico segnale automatico onesto e' quante testate hanno coperto il fatto,
    ed e' un segnale debole: una pagina di offerte ha due fonti e sta giusta in
    fondo. Quindi il controllo e' volutamente timido — salta le categorie che
    per regola vanno in coda (contorno, contesto, servizio) e parla solo dei
    casi grossi: tre fonti o piu' relegate nella meta' bassa."""
    tail = {"CONTORNO", "CONTESTO", "SERVIZIO"}
    core = [(i, n) for i, n in enumerate(news) if n.get("tag") not in tail]
    if len(core) < 6:
        return
    half = len(news) / 2
    top_thin = [n for i, n in core if i < half and len(n.get("sources") or []) <= 1]
    if not top_thin:
        return
    for i, n in core:
        if i >= half and len(n.get("sources") or []) >= 3:
            r.warn("news", f"{n.get('id')} ha {len(n['sources'])} fonti ed e' al "
                           f"posto {i+1}, mentre in alto ci sono notizie con una "
                           "fonte sola: l'ordine merita un'occhiata")


# ---------------------------------------------------------------- link

def head(url):
    out = subprocess.run(
        ["curl", "-sIL", "--max-time", "20", "-o", "/dev/null",
         "-w", "%{http_code}", "-A",
         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
         "(KHTML, like Gecko) Chrome/120 Safari/537.36", url],
        capture_output=True)
    return url, out.stdout.decode().strip()


def check_links(brief, r):
    urls = []
    for n in brief.get("news", []):
        if n.get("link"):
            urls.append((f"news/{n.get('id')}", n["link"]))
        for extra in n.get("extra_links") or []:
            if extra.get("url"):
                urls.append((f"news/{n.get('id')}", extra["url"]))
    for sec in ("radar", "banco", "recap", "ai", "social"):
        for s in brief.get(sec) or []:
            if s.get("link"):
                urls.append((sec, s["link"]))

    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        results = dict(pool.map(lambda u: head(u[1]), urls))
    for where, url in urls:
        code = results.get(url, "000")
        if code in ("000", ""):
            r.warn(where, f"link che non risponde: {url[:70]}")
        elif not code.startswith(("2", "3")):
            r.warn(where, f"link con HTTP {code}: {url[:70]}")


# ---------------------------------------------------------------- corsa

def lint(brief, with_links):
    r = Report(brief.get("date", "?"))
    news = brief.get("news") or []
    check_shape(brief, r)
    for n in news:
        check_story(n, r)
    check_duplicates(news, r)
    check_memory(brief, r)
    check_verifica(brief, r)
    check_reparto(brief, r)
    check_novita(brief, r)
    check_origine(brief, r)
    check_foto(brief, r)
    check_accenti(brief, r)
    check_magazine(brief, r)
    check_plancia(brief, r)
    check_approfondimento(brief, r)
    check_rubriche(brief, r)
    check_ranking(news, r)
    if with_links:
        check_links(brief, r)
    return r


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?", help="data da collaudare (YYYY-MM-DD)")
    ap.add_argument("--all", action="store_true", help="tutto l'archivio")
    ap.add_argument("--links", action="store_true",
                    help="controlla che i link aprano davvero (va in rete)")
    args = ap.parse_args()

    if args.all:
        briefs = [b for _, b in C.briefs(reverse=True)]
    else:
        day = args.date or C.today()
        path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
        if not os.path.exists(path):
            print(f"Nessuna edizione per il {day}.", file=sys.stderr)
            return 1
        briefs = [C.load_json(path)]

    errors = 0
    for brief in briefs:
        r = lint(brief, args.links)
        r.show()
        errors += len(r.errors)

    if len(briefs) > 1:
        print(f"\n{len(briefs)} edizioni collaudate, {errors} errori in tutto.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
