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


# ------------------------------------------------------------------ l'edizione com'è uscita
# Mike legge l'edizione nell'app e poi ne parla con chi capita («spesso scrivi "parafrasi: …"», detto a Ivo il 15
# novembre 2026: le voci le scrive Ettore, Ivo sulla scrivania aveva solo le sue correzioni e non ha capito di cosa
# si parlava). Chi risponde deve poter trovare il passo anche se non è lavoro suo, e dire di chi è. Due cose:
# `uscita`, un quadro breve dell'edizione così come si legge nell'app, che va sulla scrivania di tutti; e `passi`,
# tutti i testi uno per uno, dentro cui la pagina cerca le parole che Mike usa.

def e_parafrasi(v):
    """Una voce riportata con parole nostre, non una citazione alla lettera."""
    return bool(v.get("parafrasi")) or bool(re.match(r"\s*(?:\(\s*parafrasi\s*\)\s*[:—–-]?|parafrasi\s*[:—–-])", v.get("testo") or "", re.I))


def ultima_parola(b):
    """«L'ultima parola» come la mostra l'app (citazioneDi in pipeline/template.html): quella scritta dal redattore;
    se manca, la voce più forte fra quelle degli approfondimenti, mai un anonimo e mai una parafrasi."""
    c = (b or {}).get("citazione") or {}
    if c.get("testo"):
        return {"testo": c["testo"], "chi": c.get("chi"), "dove": c.get("dove"), "scelta": "redattore"}
    pesi = {"apple": 4, "esperto": 3, "analista": 3, "testata": 2, "storia": 1}
    scelta, voto = None, 0
    for n in ((b or {}).get("news") or [])[:5]:
        for v in (n.get("approfondimento") or {}).get("voci") or []:
            t, chi, peso = v.get("testo") or "", v.get("chi") or "", pesi.get(v.get("tipo"), 0)
            if not peso or not chi or re.match(r"(un|una) ", chi, re.I) or not t or len(t) > 220 or e_parafrasi(v):
                continue
            if peso > voto:
                scelta, voto = {"testo": t, "chi": chi, "dove": v.get("dove"), "scelta": "app"}, peso
    return scelta


def passi(brief):
    """Tutti i testi dell'edizione uscita, uno per uno: [{d: dove sta, a: chi lo scrive, r: 1 se il revisore lo
    rilegge, t: il testo}]. Solo testo: niente immagini, niente link."""
    b = brief or {}
    out = []

    def metti(dove, autore, testo, rivisto=False):
        t = " ".join(str(testo or "").split())
        if t:
            out.append({"d": dove, "a": autore, "r": 1 if rivisto else 0, "t": t})

    for i, t in enumerate(b.get("top3") or [], 1):
        metti(f"i tre titoli d'apertura, il {i}°", "redattore", t, True)
    metti("il quadro della giornata", "redattore", b.get("intro"), True)
    for n in sorted(b.get("news") or [], key=lambda n: n.get("rank", 99)):
        qui = f"notizia {n.get('rank')}, «{taglia(n.get('title'), 56)}»"
        metti(qui + " · il titolo", "redattore", n.get("title"), True)
        metti(qui + " · la riga di sintesi", "redattore", n.get("sintesi"), True)
        metti(qui + " · il pezzo", "redattore", n.get("descrizione"), True)
        for x in n.get("novita") or []:
            metti(qui + " · «Tutte le novità»", "redattore", f"{x.get('sistema') or ''}, {x.get('area') or ''}: {x.get('cosa') or ''}. {x.get('dettaglio') or ''}")
        ap = n.get("approfondimento") or {}
        if not ap:
            continue
        qui += " · approfondimento"
        metti(qui + " · il titolo", "redattore", ap.get("titolo"), True)
        metti(qui + " · il sommario", "redattore", ap.get("punto"), True)
        for k, par in enumerate(ap.get("sotto") or [], 1):
            metti(qui + f" · il testo, paragrafo {k}", "redattore", par, True)
        for x in ap.get("numeri") or []:
            metti(qui + " · i numeri in fascia", "redattore", f"{x.get('valore')}: {x.get('etichetta') or ''} ({x.get('fonte') or 'senza fonte'})")
        for v in ap.get("voci") or []:
            metti(qui + f" · «Cosa ne dicono», la voce di {v.get('chi') or v.get('dove') or '?'}", "redattore", v.get("testo"))
        for x in ap.get("approfondire") or []:
            metti(qui + " · «Per andare oltre»", "redattore", f"{x.get('titolo') or ''} ({x.get('fonte') or ''}): {x.get('perche') or ''}")
        for v in ap.get("visivi") or []:
            metti(qui + f" · il grafico «{v.get('tipo')}»", "visualista", f"{v.get('titolo') or ''}. {v.get('didascalia') or ''}")
    u = ultima_parola(b)
    if u:
        metti("«L'ultima parola», la frase grande a metà pagina" + ("" if u["scelta"] == "redattore" else " (oggi il redattore non l'ha scritta: l'app ha ripescato da sola una voce degli approfondimenti)"),
              "redattore", f"{u['testo']} — {u.get('chi') or ''}, {u.get('dove') or ''}")
    ed = b.get("editoriale") or {}
    metti("«Il punto», il titolo", "redattore", ed.get("titolo"), True)
    for k, par in enumerate(ed.get("testo") or [], 1):
        metti(f"«Il punto», paragrafo {k}", "redattore", par, True)
    for x in b.get("banco") or []:
        metti("«Di cosa si parla» · " + taglia(x.get("title"), 56), "regia", f"{x.get('title') or ''}. {x.get('note') or ''}")
        metti("«Di cosa si parla» · il foglietto «La risposta» di «" + taglia(x.get("title"), 56) + "»", "regia", x.get("perche"))
    for nome, chiave in (("le discussioni", "social"), ("il radar", "radar")):
        for x in b.get(chiave) or []:
            metti(f"{nome} · " + taglia(x.get("title"), 56), "regia", f"{x.get('title') or ''}. {x.get('note') or ''}")
    for x in b.get("recap") or []:
        metti("«Se te lo fossi perso» · " + taglia(x.get("title"), 56), "regia", f"{x.get('title') or ''}. {x.get('note') or ''} ({x.get('signal') or ''})")
    for x in b.get("ai") or []:
        qui = "scheda AI · " + taglia(x.get("title"), 56)
        metti(qui, "ai", f"{x.get('title') or ''}. {x.get('sintesi') or ''} {x.get('note') or ''}")
        metti(qui + " · «E Apple?»", "ai", x.get("apple"))
        metti(qui + " · il foglietto «Prova»", "ai", x.get("prova"))
    for nome, chiave in (("scheda Games", "games"), ("scheda Scienza", "spazio")):
        for x in b.get(chiave) or []:
            metti(f"{nome} · " + taglia(x.get("title"), 56), "schede", f"{x.get('title') or ''}. {x.get('nota') or ''}")
    g = b.get("gta") or {}
    metti("GTA VI · il tema del giorno", "gta", g.get("sintesi"))
    for x in g.get("voci") or []:
        metti("GTA VI · " + taglia(x.get("title"), 56), "gta", f"{x.get('title') or ''}. {x.get('nota') or ''} {x.get('citazione') or ''}")
    return out


def uscita(brief, stato):
    """Il quadro dell'edizione così come Mike la legge nell'app, con accanto a ogni pezzo chi lo scrive."""
    b = brief or {}
    news = sorted(b.get("news") or [], key=lambda n: n.get("rank", 99))
    if not news:
        return ""
    nome = {a["id"]: a["nome"] for a in (stato or {}).get("agenti") or []}
    N = lambda k: nome.get(k, k)   # noqa: E731
    r = [f"LE NOTIZIE ({len(news)}) [le scrive {N('redattore')}; {N('revisore')} ne rilegge le parole: titoli, sintesi, pezzi, titolo, sommario "
         f"e testo degli approfondimenti, quadro della giornata, «Il punto». {N('revisore')} non tocca mai citazioni, voci, numeri e link]"]
    for n in news:
        r.append(f"{n.get('rank')}. {n.get('title')} [{n.get('reparto')} · {n.get('tag')}]")
    con = [n for n in news if n.get("approfondimento")]
    if con:
        r.append(f"\nGLI APPROFONDIMENTI (le prime {len(con)}) [{N('redattore')}; i grafici sono di {N('visualista')}]. Nell'app, sotto il testo, c'è «Cosa ne dicono»: "
                 "le voci, cioè frasi di altri, mostrate fra virgolette «» con il nome sotto. Ecco le voci di oggi, parola per parola come sono uscite:")
        for n in con:
            ap = n["approfondimento"]
            r.append(f"{n.get('rank')}. «{ap.get('titolo')}»")
            for v in ap.get("voci") or []:
                r.append(f"   - {v.get('chi') or v.get('dove')}: «{taglia(v.get('testo'), 150)}»")
    u = ultima_parola(b)
    if u:
        r.append(f"\n«L'ULTIMA PAROLA» (la frase grande a metà pagina) [{N('redattore')}]: «{taglia(u['testo'], 220)}» — {u.get('chi')}"
                 + ("" if u["scelta"] == "redattore" else f". Oggi {N('redattore')} non l'ha scritta: l'app ha ripescato da sola questa voce dagli approfondimenti."))
    else:
        r.append(f"\n«L'ULTIMA PAROLA» [{N('redattore')}]: oggi non c'è.")
    ed = b.get("editoriale") or {}
    r.append(f"«IL PUNTO» (il commento) [{N('redattore')}, riletto da {N('revisore')}]: " + (ed.get("titolo") or "oggi non c'è"))
    r.append("\nLE ALTRE SEZIONI")
    for etichetta, chiave, chi in (("«Di cosa si parla», ognuna con il foglietto «La risposta»", "banco", N("regia")),
                                   ("Le discussioni", "social", f"{N('regia')}, da quello che raccoglie {N('rete')}"),
                                   ("«Se te lo fossi perso»", "recap", f"{N('regia')}, da quello che propone {N('memoria')}"),
                                   ("Il radar", "radar", N("regia"))):
        voci = [taglia(x.get("title"), 80) for x in b.get(chiave) or [] if x.get("title")]
        r.append(f"{etichetta} [{chi}] ({len(voci)}): " + (" | ".join(voci) if voci else "oggi niente"))
    for etichetta, chiave, chi in (("La scheda AI", "ai", N("ai")), ("La scheda Games", "games", N("schede")), ("La scheda Scienza", "spazio", N("schede"))):
        voci = [taglia(x.get("title"), 70) for x in b.get(chiave) or [] if x.get("title")]
        r.append(f"{etichetta} [{chi}] ({len(voci)}): " + (" | ".join(voci) if voci else "oggi niente"))
    g = (b.get("gta") or {}).get("voci") or []
    r.append(f"GTA VI, in cima a Games [{N('gta')}] ({len(g)}): " + (" | ".join(taglia(x.get("title"), 70) for x in g) if g else "oggi niente"))
    r.append(f"Le foto le sceglie {N('foto')}; «quanto gira» una notizia lo conta {N('verifica')}; le fonti le tiene {N('fonti')}; la scaletta e la pubblicazione sono di {N('regia')}.")
    return "\n".join(r)


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

    # ---- Zeno: le fonti di oggi, e l'ultimo rapporto
    r = []
    feed = (stato.get("macchine") or {}).get("feed")
    if feed:
        r.append(f"LE FONTI DI STAMATTINA: rispondono {feed['ok']} su {feed['totale']}. Mute o rotte: {', '.join(feed.get('rotti') or []) or 'nessuna'}.")
        if b.get("feed_notes"):
            r.append("Le note sui feed scritte nell'edizione: " + "; ".join(b["feed_notes"][:14]))
        r.append("")
    rapporti = sorted(f for f in glob.glob(p("docs", "fonti", "*.md")) if os.path.basename(f)[:10] <= giorno)
    if rapporti:
        testo = open(rapporti[-1], encoding="utf-8").read()
        r.append(f"IL MIO ULTIMO RAPPORTO SULLE FONTI, del {os.path.basename(rapporti[-1])[:10]}")
        pulito = re.sub(r"[`*]", "", testo).strip()
        r.append(pulito if len(pulito) <= 6000 else pulito[:6000].rsplit("\n", 1)[0] + "\n(il rapporto continua)")
    out["fonti"] = "\n".join(r) or "Non ho ancora scritto un rapporto."

    # ---- Nora: la verifica, notizia per notizia
    r = ["LA VERIFICA DI STAMATTINA", "Per ogni notizia: quante testate la raccontano, quali sono state lette, da dove dicono di averla presa, se c'è la parola di Apple, chi l'ha data per primo."]
    for n in news:
        r.append(f"{n.get('rank')}. [{n.get('tag')} · affidabilità {n.get('reliability')} · origine scelta dalla redazione: {n.get('origine') or '?'}] {n.get('title')} — {_testate(n)}")
    out["verifica"] = "\n".join(r) if news else "Di stamattina non ho la verifica sulla scrivania."

    # ---- Bruno: le foto
    r = ["LE FOTO DELL'EDIZIONE", "Di ogni foto so solo se c'è e quanto pesa: da quale testata l'ho presa e se ho tagliato un logo lo dico durante la corsa, ma non resta scritto nell'edizione."]
    for n in news[:8]:
        r.append(f"{n.get('rank')}. {n.get('title')} — " + (f"foto incorporata, circa {round(len(n['image']) * 0.75 / 1024)} KB" if n.get("image") else "senza foto") + f" (testate lette: {', '.join(n.get('sources') or []) or '—'})")
    for nome, chiave in (("Scheda AI", "ai"), ("Games", "games"), ("Scienza", "spazio")):
        voci = b.get(chiave) or []
        if voci:
            r.append(f"{nome}: {sum(1 for v in voci if v.get('image'))} voci con la foto su {len(voci)}")
    out["foto"] = "\n".join(r) if b else "Di stamattina non ho le foto sulla scrivania."

    # ---- Dario: le discussioni
    r = []
    disc = b.get("social") or []
    if disc:
        r.append(f"LE DISCUSSIONI ENTRATE IN EDIZIONE ({len(disc)})")
        for i, d in enumerate(disc, 1):
            tipo = "non l'avevano le testate" if d.get("origine") == "nuovo" else "eco di una notizia"
            r.append(f"{i}. [{tipo}] {d.get('title')} — {taglia(d.get('note'), 300)} ({d.get('source')})")
    raccolta = carica(p("data", "social", giorno + ".json")) or {}
    if raccolta.get("items"):
        r.append(f"\nLA RACCOLTA DI STAMATTINA: {raccolta.get('count')} discussioni nelle ultime {raccolta.get('window_hours')} ore. Le prime:")
        for x in raccolta["items"][:14]:
            r.append(f"- {taglia(x.get('title'), 110)} ({x.get('source') or x.get('where') or ''}" + (f", {x.get('score')} punti" if x.get("score") is not None else "") + (f", {x.get('comments')} commenti" if x.get("comments") is not None else "") + ")")
    lab = carica(p("data", "lab", giorno + ".json")) or {}
    if lab.get("count") is not None:
        r.append(f"\nPER IL LAB DI ADA ho raccolto {lab.get('count')} cose fatte con i modelli.")
    out["rete"] = "\n".join(r) or "Di stamattina non ho la raccolta sulla scrivania."

    # ---- Clio: i fili, le previsioni, i numeri, i ripescaggi
    r = []
    registro = carica(p("data", "threads.json")) or {}
    con_filo = [n for n in news if n.get("thread")]
    if con_filo:
        r.append("LE STORIE CHE OGGI VANNO AVANTI")
        for n in con_filo:
            f = registro.get(n["thread"]) or {}
            r.append(f"{n.get('rank')}. {n.get('title')} — filo «{f.get('label') or n['thread']}»" + (f", aperto il {f.get('opened')}" if f.get("opened") else "") + (f": {taglia(f.get('note'), 160)}" if f.get("note") else ""))
    aperti = [k for k, v in registro.items() if isinstance(v, dict) and not v.get("closed")]
    if registro:
        r.append(f"\nNel registro ci sono {len(registro)} fili, {len(aperti)} ancora aperti.")
    prev = [n for n in news if n.get("claim")]
    if prev:
        r.append("\nLE PREVISIONI NUOVE DI OGGI")
        for n in prev:
            c = n["claim"]
            r.append(f"- {c.get('text')} — la dice {c.get('source')}, si saprà entro il {c.get('horizon')} (notizia {n.get('rank')})")
    chiuse = [(n, x) for n in news for x in (n.get("resolves") or [])]
    if chiuse:
        r.append("\nLE PREVISIONI CHIUSE OGGI")
        for n, x in chiuse:
            r.append(f"- {x.get('claim')}: {x.get('verdict')}. {taglia(x.get('note'), 200)}")
    numeri = [(n, x) for n in news for x in (n.get("facts") or [])]
    if numeri:
        r.append("\nI NUMERI SEGUITI OGGI")
        for n, x in numeri:
            r.append(f"- {x.get('label') or x.get('key')}: {x.get('value')} {x.get('unit') or ''} ({x.get('kind')}, {x.get('source')})")
    rec = b.get("recap") or []
    if rec:
        r.append("\nSE TE LO FOSSI PERSO (i ripescaggi di oggi)")
        for x in rec:
            r.append(f"- {x.get('title')} — del {x.get('when')}, {x.get('signal')}. {taglia(x.get('note'), 220)}")
    out["memoria"] = "\n".join(r) or "Di stamattina non ho niente sulla scrivania."

    return {k: (v if len(v) <= TETTO else v[:TETTO].rsplit("\n", 1)[0] + "\n(il resto è rimasto fuori per brevità)") for k, v in out.items()}
