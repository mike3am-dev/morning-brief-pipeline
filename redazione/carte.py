"""
Le carte sulla scrivania di ciascuno: il materiale vero del giorno, in testo semplice.

Quando Mike parla con un agente della redazione, la pagina manda a Claude queste carte insieme
alla domanda: così chi risponde ha davanti il lavoro di stamattina (i pezzi, le correzioni
parola per parola, le voci scelte e quelle scartate) e non deve inventare niente.

Si legge soltanto. Niente immagini: dei file dell'edizione si prendono solo i campi di testo.
"""
import datetime as dt
import difflib
import glob
import json
import os
import re

GIORNI = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]
TETTO = 14000   # caratteri: oltre, le carte di un agente si tagliano


def taglia(t, n):
    t = " ".join((t or "").split())
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0] + "…"


def carica(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def giorno_corto(iso):
    try:
        d = dt.date.fromisoformat(iso[:10])
    except ValueError:
        return iso
    return f"{GIORNI[d.weekday()]} {d.day}"


def ritocchi(prima, dopo, quanti=14, intorno=5):
    """Le differenze fra due testi, parola per parola: «prima» → «dopo», con un po' di contesto."""
    a, b = (prima or "").split(), (dopo or "").split()
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        capo = " ".join(a[max(0, i1 - intorno):i1])
        coda = " ".join(a[i2:i2 + intorno])
        vecchio, nuovo = " ".join(a[i1:i2]), " ".join(b[j1:j2])
        if op == "insert":
            riga = f"…{capo} [aggiunto: «{nuovo}»] {coda}…"
        elif op == "delete":
            riga = f"…{capo} [tolto: «{vecchio}»] {coda}…"
        else:
            riga = f"…{capo} [«{vecchio}» → «{nuovo}»] {coda}…"
        out.append(taglia(riga, 420))
    piu = len(out) - quanti
    return out[:quanti] + ([f"(e altri {piu} ritocchi nello stesso testo)"] if piu > 0 else [])


def _testate(n):
    v = n.get("verifica") or {}
    pezzi = []
    if v.get("testate") is not None:
        pezzi.append(f"{v['testate']} testate in tutto")
    if v.get("lette") is not None:
        pezzi.append(f"{v['lette']} lette ({', '.join(n.get('sources') or []) or '—'})")
    if v.get("web"):
        pezzi.append(f"{v['web']} trovate fuori dalle nostre")
    pezzi.append("origini dichiarate: " + (", ".join(v.get("origini") or []) or "nessuna"))
    if v.get("ufficiale"):
        pezzi.append("c'è la parola di Apple")
    if (v.get("primo") or {}).get("testata"):
        pezzi.append("la prima a darla: " + v["primo"]["testata"])
    return "; ".join(pezzi)


def carte(giorno, root, brief, rev, stato):
    """{id dell'agente: testo}. `stato` è lo stato del giorno già composto (corsa, agenti, post-it…)."""
    p = lambda *a: os.path.join(root, *a)   # noqa: E731
    b = brief or {}
    news = sorted(b.get("news") or [], key=lambda n: n.get("rank", 99))
    out = {}

    # ---- Olivia: la corsa e la scaletta
    r = []
    c = stato.get("corsa") or {}
    if c:
        r.append("LA CORSA DI STAMATTINA")
        r.append(f"Inizio alle {c.get('ora_inizio')}, edizione pubblicata alle {c.get('ora_uscita')}, fine alle "
                 f"{c.get('ora_fine')}: {c.get('minuti')} minuti dalla raccolta alla pubblicazione (il tetto è {c.get('tetto')}).")
        r.append("Le ultime corse, in minuti: " + " · ".join(f"{giorno_corto(u['giorno'])}: {u['minuti']}" for u in c.get("ultime") or [] if u.get("minuti") is not None))
        r.append("Chi ha lavorato, da quando a quando: " + "; ".join(
            f"{a['nome']} ({a['mestiere']}) {a['entrata']}–{a['uscita']}, {a['minuti']} min" for a in stato.get("agenti") or [] if a.get("entrata") and a["id"] != "regia"))
    if news:
        r.append(f"\nLA SCALETTA ({len(news)} notizie)")
        for n in news:
            v = n.get("verifica") or {}
            r.append(f"{n.get('rank')}. [{n.get('reparto')} · {n.get('tag')} · origine {n.get('origine') or '?'} · {v.get('testate', '?')} testate] {n.get('title')}")
        r.append("\nLE ALTRE SEZIONI, CHE HO SCRITTO IO")
        for nome, chiave in (("Radar", "radar"), ("Di cosa si parla", "banco"), ("Discussioni", "social"), ("Se te lo fossi perso", "recap")):
            voci = [x.get("title") for x in b.get(chiave) or [] if x.get("title")]
            r.append(f"{nome} ({len(voci)}): " + (" | ".join(voci) if voci else "oggi niente"))
    m = stato.get("macchine") or {}
    if m.get("telescrivente") or m.get("feed"):
        r.append("\nLE MACCHINE")
        if m.get("telescrivente"):
            r.append(f"Dai feed sono arrivati {m['telescrivente'].get('articoli')} articoli, nella finestra delle ultime {m['telescrivente'].get('finestra_ore')} ore.")
        if m.get("feed"):
            r.append(f"Rispondono {m['feed']['ok']} fonti su {m['feed']['totale']}. Mute o rotte: {', '.join(m['feed'].get('rotti') or []) or 'nessuna'}.")
    if stato.get("letture"):
        r.append("\nQUANTE VOCI HA APERTO MIKE, edizione per edizione: " + " · ".join(f"{giorno_corto(x['giorno'])}: {x['aperte']} su {x['viste']} viste" for x in stato["letture"]))
    out["regia"] = "\n".join(r)

    # ---- Tobia: cosa ha letto, notizia per notizia
    r = ["COSA HO LETTO STAMATTINA",
         "Per ogni notizia scelta ho aperto gli articoli interi, di più testate. Qui sotto: quante la raccontano, quali ho letto, da dove viene."]
    sole = []
    for n in news:
        r.append(f"{n.get('rank')}. {n.get('title')} — {_testate(n)}")
        if (n.get("verifica") or {}).get("testate") == 1:
            sole.append(str(n.get("rank")))
    r.append("\nNotizie raccontate da una testata sola: " + (", ".join("la " + s for s in sole) if sole else "nessuna"))
    if b.get("feed_notes"):
        r.append("\nFONTI CHE OGGI NON HANNO PARLATO O ERANO ROTTE: " + "; ".join(b["feed_notes"][:14]))
    out["lettura"] = "\n".join(r)

    # ---- Ettore: i suoi pezzi
    r = ["I MIEI PEZZI DI STAMATTINA"]
    if b.get("intro"):
        r.append("Il quadro della giornata: " + b["intro"])
    if b.get("top3"):
        r.append("I tre titoli d'apertura: " + " | ".join(b["top3"]))
    for n in news:
        r.append(f"\n{n.get('rank')}. [{n.get('reparto')} · {n.get('tag')} · affidabilità {n.get('reliability')} · origine {n.get('origine') or '?'}] {n.get('title')}")
        r.append("   In una riga: " + (n.get("sintesi") or ""))
        ap = n.get("approfondimento") or {}
        if ap:
            r.append("   Il pezzo: " + taglia(n.get("descrizione"), 900))
            r.append(f"   L'approfondimento: «{ap.get('titolo')}». Sommario: {ap.get('punto')}")
            for v in (ap.get("voci") or [])[:3]:
                r.append(f"   Voce citata: {v.get('chi')} ({v.get('dove')}): «{taglia(v.get('testo'), 200)}»")
    ed = b.get("editoriale") or {}
    if ed:
        r.append(f"\n«IL PUNTO»: {ed.get('titolo')}\n" + "\n".join(ed.get("testo") or []))
    cit = b.get("citazione") or {}
    if cit:
        r.append(f"\n«L'ULTIMA PAROLA»: «{cit.get('testo')}» — {cit.get('chi')}, {cit.get('dove') or ''}")
    if rev and rev.get("fatta"):
        r.append(f"\nCOSA MI HA CORRETTO IVO ({rev['riscritti']} testi)")
        for x in rev["cambi"]:
            r.append(f"- {x['cosa']}" + (f" di «{taglia(x['notizia'], 70)}»" if x.get("notizia") else "") + ": " + " ".join(ritocchi(x["prima"], x["dopo"], 3)))
    out["redattore"] = "\n".join(r)

    # ---- Ivo: il prima e il dopo
    r = []
    if rev and rev.get("fatta"):
        r.append(f"LE MIE CORREZIONI DI STAMATTINA: {rev['riscritti']} testi di Ettore ritoccati. Fra parentesi quadre il cambio, intorno le parole vicine.")
        for i, x in enumerate(rev["cambi"], 1):
            r.append(f"\n{i}. {x['cosa'].upper()}" + (f" — notizia: «{x['notizia']}»" if x.get("notizia") else ""))
            if x["cosa"] in ("titolo", "sintesi", "i tre titoli d'apertura", "titolo dell'approfondimento"):
                r.append("   PRIMA: " + x["prima"]); r.append("   DOPO: " + x["dopo"])
            r.extend("   " + t for t in ritocchi(x["prima"], x["dopo"]))
        doc = carica(p("data", "revisione", giorno + ".json")) or {}
        rap = doc.get("rapporto") or {}
        r.append("\nIL CONTROLLO DOPO LA REVISIONE: campi protetti ripristinati: " + (", ".join(map(str, rap.get("ripristinati") or [])) or "nessuno")
                 + "; numeri comparsi che prima non c'erano: " + (", ".join(map(str, rap.get("numeri_nuovi") or [])) or "nessuno")
                 + "; formule vietate rimaste: " + (", ".join(map(str, rap.get("formule") or [])) or "nessuna") + ".")
        if rev.get("ricostruito"):
            r.append("(Questo prima-e-dopo è stato ricostruito a posteriori: " + str(rev["ricostruito"]) + ")")
    elif rev:
        r.append("Stamattina ho riletto, ma il prima-e-dopo dei testi non è stato salvato.")
    else:
        r.append("Di stamattina non ho sulla scrivania il prima-e-dopo dei testi.")
    out["revisore"] = "\n".join(r)

    # ---- Lea: i grafici di oggi, e le richieste
    r = ["I GRAFICI DELLE PRIME CINQUE"]
    for n in news[:5]:
        vis = (n.get("approfondimento") or {}).get("visivi") or []
        if vis:
            for v in vis:
                r.append(f"{n.get('rank')}. {n.get('title')} — grafico «{v.get('tipo')}»: {v.get('titolo')}. {taglia(v.get('didascalia'), 220)}")
        else:
            r.append(f"{n.get('rank')}. {n.get('title')} — senza grafico")
    rich = carica(p("data", "visivi", "richieste.json")) or []
    aperte = sorted((x for x in rich if x.get("stato") == "aperta" and x.get("data", "") <= giorno), key=lambda x: x.get("data", ""))
    if aperte:
        r.append(f"\nLE RICHIESTE DI GRAFICI CHE NON ESISTONO ANCORA: {len(aperte)} aperte, la più vecchia del {aperte[0].get('data')}.")
        r.append("Quando nessun tipo di grafico calza non ne forzo uno: lascio la notizia senza e scrivo una richiesta per chi tocca l'app.")
        for x in aperte[-8:][::-1]:
            r.append(f"- {x.get('data')}, per «{x.get('notizia')}»: {taglia(x.get('idea'), 260)} Come si userebbe: {taglia(x.get('interazione'), 220)}")
    out["visualista"] = "\n".join(r)

    # ---- Ada: la scheda AI
    r = []
    ai = (carica(p("data", "ai", giorno + "-sezione.json")) or {}).get("ai") or []
    if ai:
        r.append(f"LA SCHEDA AI DI OGGI ({len(ai)} voci)")
        for i, v in enumerate(ai, 1):
            riga = f"{i}. [{v.get('lab')} · {v.get('kind')}] {v.get('title')} — {taglia(v.get('sintesi') or v.get('note'), 260)}"
            if v.get("apple"):
                riga += " E Apple: " + taglia(v["apple"], 160)
            if v.get("prova"):
                riga += " Come si prova: " + taglia(v["prova"], 160)
            r.append(riga + f" (fonte: {v.get('source')})")
    else:
        r.append("Oggi la scheda AI non l'ho scritta io.")
    out["ai"] = "\n".join(r)

    # ---- Rita: Games e Scienza, scelte e scartate
    r = []
    scritte = carica(p("data", "rubriche", giorno + "-scritte.json")) or {}
    rosa = (carica(p("data", "rubriche", giorno + ".json")) or {}).get("candidati") or {}
    for nome, chiave in (("GAMES", "games"), ("SCIENZA", "spazio")):
        voci = scritte.get(chiave) or []
        if not voci:
            continue
        r.append(f"{nome}: {len(voci)} voci scelte")
        presi = set()
        for i, v in enumerate(voci, 1):
            presi.add(v.get("id")); presi.update(v.get("anche") or [])
            etichetta = v.get("disciplina") or v.get("gruppo") or ""
            r.append(f"{i}. [{etichetta}] {v.get('title')} — {taglia(v.get('nota'), 220)}")
        fuori = [x for x in rosa.get(chiave) or [] if x.get("id") not in presi]
        if fuori:
            r.append(f"Scartate dalla rosa ({len(fuori)}): " + " | ".join(f"{taglia(x.get('title'), 80)} ({x.get('source')})" for x in fuori[:12]))
        r.append("")
    if not r:
        r.append("Oggi le schede Games e Scienza non le ho scritte io.")
    out["schede"] = "\n".join(r)

    # ---- Vito: GTA VI
    r = []
    gta = carica(p("data", "gta", giorno + "-sezione.json")) or {}
    if gta:
        r.append("LA SEZIONE GTA VI DI OGGI")
        if gta.get("uscita"):
            r.append(f"Uscita: {gta['uscita']}. Tema del giorno: {gta.get('sintesi') or ''}")
        for i, v in enumerate(gta.get("voci") or [], 1):
            r.append(f"{i}. [{v.get('tipo')} · {v.get('affidabilita')}] {v.get('title')} — {taglia(v.get('nota'), 320)}"
                     + (f" Citazione: «{taglia(v['citazione'], 160)}»." if v.get("citazione") else "")
                     + f" (fonte: {v.get('fonte')}" + (f"; {v['segnale']}" if v.get("segnale") else "") + ")")
        if gta.get("tappe"):
            r.append("Le tappe del lancio: " + " · ".join(f"{t.get('data')}: {t.get('etichetta')}" for t in gta["tappe"]))
        if gta.get("problemi"):
            r.append("I problemi segnalati: " + " · ".join(taglia(json.dumps(x, ensure_ascii=False), 160) for x in gta["problemi"]))
    else:
        r.append("Oggi la sezione GTA VI non l'ho scritta io.")
    out["gta"] = "\n".join(r)

    # ---- Zeno: l'ultimo rapporto sulle fonti
    r = []
    rapporti = sorted(f for f in glob.glob(p("docs", "fonti", "*.md")) if os.path.basename(f)[:10] <= giorno)
    if rapporti:
        testo = open(rapporti[-1], encoding="utf-8").read()
        r.append(f"IL MIO ULTIMO RAPPORTO SULLE FONTI, del {os.path.basename(rapporti[-1])[:10]}")
        pulito = re.sub(r"[`*]", "", testo).strip()
        r.append(pulito if len(pulito) <= 6000 else pulito[:6000].rsplit("\n", 1)[0] + "\n(il rapporto continua)")
    out["fonti"] = "\n".join(r) or "Non ho ancora scritto un rapporto."

    return {k: (v if len(v) <= TETTO else v[:TETTO].rsplit("\n", 1)[0] + "\n(il resto è rimasto fuori per brevità)") for k, v in out.items()}
