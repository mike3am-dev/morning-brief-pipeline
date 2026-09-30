#!/usr/bin/env python3
"""
I fili delle storie: dare memoria alla rassegna.

Ogni notizia — e ogni voce della sezione AI — puo' dichiarare un filo, cioe'
la storia lunga di cui e' una puntata:

    "thread": "silicio-mac"

Le etichette leggibili stanno in data/threads.json, il registro dei fili, e
questo script le ricopia dentro ogni edizione nel campo "threads", limitato ai
fili usati quel giorno:

    "threads": {"silicio-mac": "La roadmap del silicio Mac"}

Cosi' l'app non ha bisogno di scaricare niente d'altro: raggruppa da sola le
puntate leggendo l'archivio che ha gia' in memoria, e la copia Artifact — che
non puo' fare rete — funziona identica.

Comandi:
    python3 pipeline/threads.py sync            allinea registro ed edizioni
    python3 pipeline/threads.py list            i fili aperti, per recenza
    python3 pipeline/threads.py show <slug>     la cronologia di un filo
    python3 pipeline/threads.py suggest [data]  a quale filo agganciare le notizie di oggi
    python3 pipeline/threads.py recall --raw    prima di scrivere: cosa del grezzo abbiamo gia' raccontato
    python3 pipeline/threads.py recall [data]   dopo: quali voci dell'edizione riprendono cose gia' uscite
    python3 pipeline/threads.py close <slug>    chiude un filo (resta consultabile)
    python3 pipeline/threads.py check           controlli di integrita'
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C

# sotto questa soglia la proposta e' rumore, sopra vale la pena guardarla
SUGGEST_FLOOR = 0.16
# un filo con una sola puntata e fermo da tanto non e' un filo
STALE_DAYS = 45


def load_registry():
    if not os.path.exists(C.THREADS_FILE):
        return {}
    return C.load_json(C.THREADS_FILE)


def save_registry(reg):
    C.save_json(C.THREADS_FILE, dict(sorted(reg.items())))


SECTION_NAME = {"news": "notizie", "ai": "AI"}


def episodes():
    """Tutte le puntate raccolte per filo, in ordine cronologico.

    Ogni puntata e' (data, voce, sezione): un filo puo' passare dalle notizie
    Apple alla sezione AI e ritorno — l'accordo Apple-Gemini e' tutte e due."""
    out = {}
    for day, sec, item in C.items():
        slug = item.get("thread")
        if not slug:
            continue
        out.setdefault(slug, []).append((day, item, sec))
    for slug in out:
        out[slug].sort(key=lambda x: x[0])
    return out


# ---------------------------------------------------------------- sync

def cmd_sync(args):
    reg = load_registry()
    eps = episodes()
    added, relabelled = [], []

    for slug, items in sorted(eps.items()):
        first_day, first_news, _ = items[0]
        if slug not in reg:
            reg[slug] = {
                "label": first_news.get("title", slug)[:70],
                "note": "",
                "opened": first_day,
                "closed": None,
            }
            added.append(slug)
        else:
            entry = reg[slug]
            entry.setdefault("note", "")
            entry.setdefault("closed", None)
            if (entry.get("opened") or "9999") > first_day:
                entry["opened"] = first_day

    touched = 0
    for path, brief in C.briefs():
        used = {}
        for news in [it for sec in C.MEMORY_SECTIONS for it in brief.get(sec) or []]:
            slug = news.get("thread")
            if slug and slug in reg:
                # etichetta secca se basta, etichetta piu' nota quando c'e':
                # l'app accetta le due forme e la seconda le fa da sommario
                note = (reg[slug].get("note") or "").strip()
                used[slug] = ({"label": reg[slug]["label"], "note": note}
                              if note else reg[slug]["label"])
        current = brief.get("threads") or {}
        if used == current:
            continue
        if used:
            brief["threads"] = dict(sorted(used.items()))
        else:
            brief.pop("threads", None)
        C.save_json(path, brief)
        touched += 1
        relabelled.append(brief.get("date"))

    save_registry(reg)

    print(f"Registro: {len(reg)} fili, {len(eps)} con almeno una puntata.")
    if added:
        print("Nuovi fili registrati (l'etichetta e' provvisoria, correggila "
              f"in data/threads.json):")
        for slug in added:
            print(f"  {slug}  ->  {reg[slug]['label']}")
    print(f"Edizioni riscritte: {touched}"
          + (f" ({', '.join(relabelled)})" if relabelled else ""))
    return 0


# ---------------------------------------------------------------- list

def cmd_list(args):
    reg, eps = load_registry(), episodes()
    today = C.today()
    rows = []
    for slug, entry in reg.items():
        items = eps.get(slug, [])
        if not items:
            continue
        closed = entry.get("closed")
        if closed and not args.all:
            continue
        last = items[-1][0]
        gap = C.days_between(today, last)
        dove = sorted({SECTION_NAME.get(x[2], x[2]) for x in items})
        rows.append((last, [
            slug,
            entry.get("label", "")[:46],
            " + ".join(dove),
            str(len(items)),
            items[0][0],
            last,
            "oggi" if gap == 0 else f"{gap}g fa",
            "chiuso" if closed else "",
        ]))
    rows.sort(key=lambda x: x[0], reverse=True)
    if not rows:
        print("Nessun filo ancora. Assegna 'thread' alle notizie e lancia sync.")
        return 0
    print(C.table([r[1] for r in rows],
                  ["filo", "etichetta", "dove", "punt.", "aperto", "ultima", "distanza", ""]))
    return 0


# ---------------------------------------------------------------- show

def cmd_show(args):
    reg, eps = load_registry(), episodes()
    slug = args.slug
    if slug not in eps:
        print(f"Nessuna puntata per il filo {slug!r}.", file=sys.stderr)
        return 1
    entry = reg.get(slug, {})
    print(C.rule(entry.get("label", slug)))
    if entry.get("note"):
        print(entry["note"])
    print()
    for day, news, sec in eps[slug]:
        tag = news.get("tag") or ("AI · " + str(news.get("kind", "")))
        print(f"{day}  [{tag}] {news.get('title','')}")
        if news.get("sintesi"):
            print(f"            {news['sintesi']}")
    return 0


# ---------------------------------------------------------------- suggest

def cmd_suggest(args):
    reg, eps = load_registry(), episodes()
    day = args.date or C.today()
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not os.path.exists(path):
        print(f"Nessuna edizione per il {day}.", file=sys.stderr)
        return 1
    brief = C.load_json(path)

    # per ogni filo, il testo accumulato delle sue puntate
    corpus = {}
    for slug, items in eps.items():
        if reg.get(slug, {}).get("closed"):
            continue
        blob = " ".join((n.get("title", "") + " " + n.get("sintesi", ""))
                        for d, n, _ in items if d != day)
        if blob.strip():
            corpus[slug] = blob

    todo = [n for sec in C.MEMORY_SECTIONS for n in brief.get(sec) or []
            if not n.get("thread")]
    if not todo:
        print(f"Tutte le voci del {day} hanno gia' un filo.")
        return 0

    print(f"Notizie e voci AI del {day} senza filo: {len(todo)}\n")
    for news in todo:
        text = news.get("title", "") + " " + news.get("sintesi", "")
        scored = sorted(((C.similarity(text, blob), slug)
                         for slug, blob in corpus.items()), reverse=True)
        print(f"- {news.get('id')}: {news.get('title','')[:76]}")
        hits = [(s, g) for s, g in scored[:3] if s >= SUGGEST_FLOOR]
        if not hits:
            print("      nessun filo esistente somiglia — se la storia avra' "
                  "un seguito, aprine uno nuovo")
        for score, slug in hits:
            print(f"      {score:.2f}  {slug}  ({reg.get(slug,{}).get('label','')[:50]})")
    print("\nLa proposta e' solo un promemoria: il filo lo decidi tu, e va "
          "scritto nel campo \"thread\" della voce.")
    return 0


# ---------------------------------------------------------------- recall

# sopra questa somiglianza due titoli parlano dello stesso fatto o della sua
# puntata successiva: a quel punto si sceglie, doppione o seguito
RECALL_FLOOR = 0.34
RECALL_DAYS = 14


def published(before, days=RECALL_DAYS):
    """Le voci uscite nei giorni prima di `before`: (data, sezione, voce)."""
    out = []
    for day, sec, it in C.items():
        gap = C.days_between(before, day)
        if gap is not None and 0 < gap <= days:
            out.append((day, sec, it))
    return out


def best_match(title, url, pool, cross=True):
    """La voce gia' uscita che piu' somiglia: (punteggio, data, sezione, voce)."""
    nu = C.norm_url(url) if url else None
    best = None
    for day, sec, it in pool:
        if nu and C.norm_url(it.get("link")) == nu:
            return (1.0, day, sec, it)
        # col grezzo in inglese serve la scorciatoia fra lingue; fra le
        # nostre voci, tutte in italiano, no (vedi C.similarity)
        s = C.similarity(title, it.get("title", ""), cross_language=cross)
        if s >= RECALL_FLOOR and (best is None or s > best[0]):
            best = (s, day, sec, it)
    return best


def cmd_recall(args):
    """La memoria editoriale, detta prima di scrivere.

    Con --raw legge il grezzo di oggi e segnala gli articoli che raccontano
    una cosa gia' uscita in edizione: o e' un doppione (e si scarta), o e' la
    puntata successiva (e si dice, con lo stesso filo). Senza --raw fa lo
    stesso sulle voci gia' scritte dell'edizione."""
    day = args.date or C.today()
    pool = published(day, args.days)
    if not pool:
        print(f"Niente in archivio nei {args.days} giorni prima del {day}.")
        return 0

    if args.raw:
        path = os.path.join(C.RAW_DIR, f"{day}.json")
        if not os.path.exists(path):
            print(f"Nessun grezzo per il {day}: lancia prima fetch.py.", file=sys.stderr)
            return 1
        cands = [(i.get("title", ""), i.get("link"), i.get("source", ""))
                 for i in C.load_json(path).get("items", [])
                 if i.get("tier") in (None, "primaria", "redazionale", "ai", "lab")]
    else:
        path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
        if not os.path.exists(path):
            print(f"Nessuna edizione per il {day}.", file=sys.stderr)
            return 1
        brief = C.load_json(path)
        cands = [(it.get("title", ""), it.get("link"),
                  SECTION_NAME.get(sec, sec) + (" · filo " + it["thread"] if it.get("thread") else ""))
                 for sec in C.MEMORY_SECTIONS for it in brief.get(sec) or []]

    hits = []
    for title, url, where in cands:
        m = best_match(title, url, pool, cross=args.raw)
        if m:
            hits.append((m, title, where))
    if not hits:
        print(f"Niente di gia' raccontato fra le {len(cands)} voci del {day}.")
        return 0

    hits.sort(key=lambda h: -h[0][0])
    print(C.rule(f"Gia' raccontato — {len(hits)} su {len(cands)}"))
    for (score, pday, psec, pit), title, where in hits:
        same = "STESSO LINK" if score == 1.0 else f"{score:.2f}"
        filo = pit.get("thread")
        print(f"\n  oggi   {title[:88]}")
        print(f"         {where}")
        print(f"  {pday[5:]}  {pit.get('title','')[:88]}")
        print(f"         {SECTION_NAME.get(psec, psec)} · {same}"
              + (f" · filo {filo}" if filo else " · nessun filo"))
    print("\nPer ognuna si sceglie: doppione (si scarta) o seguito (stesso "
          "\"thread\", e nel testo si dice\ncosa e' cambiato rispetto a "
          "allora). Lo stesso link gia' uscito il lint lo blocca.")
    return 0


# ---------------------------------------------------------------- close

def cmd_close(args):
    reg = load_registry()
    if args.slug not in reg:
        print(f"Filo {args.slug!r} non nel registro.", file=sys.stderr)
        return 1
    reg[args.slug]["closed"] = args.date or C.today()
    save_registry(reg)
    print(f"Filo {args.slug} chiuso il {reg[args.slug]['closed']}. "
          "Resta consultabile nell'app, sparisce dai fili aperti.")
    return 0


# ---------------------------------------------------------------- check

def cmd_check(args):
    reg, eps = load_registry(), episodes()
    today = C.today()
    problems = 0

    for slug in sorted(eps):
        if slug not in reg:
            print(f"  usato ma non registrato: {slug}  (risolve: threads.py sync)")
            problems += 1

    for slug, entry in sorted(reg.items()):
        items = eps.get(slug, [])
        if not items:
            print(f"  registrato ma mai usato: {slug}")
            problems += 1
            continue
        if entry.get("closed"):
            continue
        gap = C.days_between(today, items[-1][0])
        if len(items) == 1 and gap is not None and gap > STALE_DAYS:
            print(f"  una sola puntata e fermo da {gap} giorni: {slug} "
                  "— valuta 'threads.py close'")
            problems += 1

    for path, brief in C.briefs():
        labels = brief.get("threads") or {}
        for news in [it for sec in C.MEMORY_SECTIONS for it in brief.get(sec) or []]:
            slug = news.get("thread")
            if slug and slug not in labels:
                print(f"  {brief.get('date')}/{news.get('id')}: filo {slug} "
                      "senza etichetta nell'edizione (risolve: threads.py sync)")
                problems += 1

    print(f"\n{problems} segnalazioni." if problems else "\nTutto in ordine.")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    sub = ap.add_subparsers(dest="cmd")

    sub.add_parser("sync", help="allinea registro ed edizioni")
    p = sub.add_parser("list", help="i fili aperti")
    p.add_argument("--all", action="store_true", help="mostra anche i chiusi")
    p = sub.add_parser("show", help="la cronologia di un filo")
    p.add_argument("slug")
    p = sub.add_parser("suggest", help="proposte di aggancio per un'edizione")
    p.add_argument("date", nargs="?")
    p = sub.add_parser("recall", help="cosa abbiamo gia' raccontato")
    p.add_argument("date", nargs="?")
    p.add_argument("--raw", action="store_true", help="sul grezzo, prima di scrivere")
    p.add_argument("--days", type=int, default=RECALL_DAYS)
    p = sub.add_parser("close", help="chiude un filo")
    p.add_argument("slug")
    p.add_argument("--date")
    sub.add_parser("check", help="controlli di integrita'")

    args = ap.parse_args()
    fn = {"sync": cmd_sync, "list": cmd_list, "show": cmd_show,
          "suggest": cmd_suggest, "recall": cmd_recall, "close": cmd_close,
          "check": cmd_check}
    if not args.cmd:
        return cmd_list(argparse.Namespace(all=False))
    return fn[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
