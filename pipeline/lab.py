#!/usr/bin/env python3
"""
Il LAB: cosa ci fa la gente con i modelli.

I laboratori raccontano cosa hanno costruito; il LAB racconta cosa ci fa
la gente. Un utente che ha fatto tenere la contabilita' a Claude, una demo
messa in piedi in un pomeriggio, un trucco di prompt, una funzione che c'e'
da mesi e nessuno usa. E' lo strato della sezione AI che sblocca, non quello
che informa — e vive in posti diversi dai feed delle testate:

  Reddit          il top del giorno delle bacheche AI (r/ClaudeAI, r/OpenAI,
                  r/ChatGPT, r/LocalLLaMA, r/artificial): gente che mostra.
  Show HN         le demo con trazione su Hacker News. In missed.py sono
                  rumore, qui sono il segnale.
  Appunti a mano  data/social/manual.md, dove incolli il thread visto su X.
                  E' l'unico modo onesto per X, e funziona: tre parole di
                  contesto e il link, al giro dopo e' in edizione.

Le fonti del LAB con un feed (Simon Willison, Mollick, Latent Space, il
cookbook di Anthropic, Matt Wolfe, AI Explained) arrivano invece da fetch.py,
marcate "tier": "lab" nel file grezzo: questo script le rilegge e le
mette in fila con il resto, cosi' la mattina si guarda un mucchio solo.

    python3 pipeline/lab.py               raccolta di oggi
    python3 pipeline/lab.py --hours 36
    python3 pipeline/lab.py --show        rilegge l'ultimo file raccolto
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C
from fetch import UA, download, parse_date, strip_html
from social import REDDIT_UA, REDDIT_RETRY_S, RITUAL_RE, manual

LAB_DIR = os.path.join(C.ROOT, "data", "lab")
ATOM = {"atom": "http://www.w3.org/2005/Atom"}

SUBS = ["ClaudeAI", "OpenAI", "ChatGPT", "LocalLLaMA", "artificial"]
KEEP_REDDIT = 16
KEEP_HN = 8
# sotto questi punti una Show HN non ha ancora fatto il giro
HN_MIN_POINTS = 60

# I post che non sono LAB: lamentele, assistenza, meme, "il modello e'
# diventato stupido". Si mettono da parte, non si buttano: se la stessa
# lamentela torna per giorni e' cronaca, non LAB.
NOISE_RE = re.compile(
    r"\b(rate limit|limits?|banned|refund|subscription|cancel(led)?|down\b|outage|"
    r"nerf(ed)?|dumber|worse|broken|bug|error|help|why (is|does|won)|"
    r"unpopular opinion|rant|meme|petition|lawsuit)\b", re.I)

# Le parole che fanno LAB: qualcuno ha fatto, costruito, scoperto.
MAKE_RE = re.compile(
    r"\b(i (built|made|used|got|asked|let|had|created|trained|generated)|"
    r"built|made|making|building|created|generated?|workflow|prompt|"
    r"trick|tip|hack|how i|how to|guide|tutorial|use case|automat\w+|"
    r"agents?|sub.?agents?|skill|mcp|tool|plugin|extension|demo|open.?source|"
    r"codebase|day \d+ of|with no|from scratch|in (an|one) (afternoon|hour|day|weekend)|"
    r"did you know|you can|turns out|discovered|figured out)\b", re.I)


# ---------------------------------------------------------------- raccolta

def reddit(cutoff):
    url = "https://www.reddit.com/r/" + "+".join(SUBS) + "/top/.rss?t=day"
    root = None
    for attempt in (0, 1):
        blob = subprocess.run(["curl", "-sL", "--max-time", "25", "-A", REDDIT_UA, url],
                              capture_output=True).stdout
        if blob:
            try:
                root = ET.fromstring(blob.lstrip(b"\xef\xbb\xbf \t\r\n"))
                break
            except ET.ParseError:
                pass
        if attempt == 0:
            time.sleep(REDDIT_RETRY_S)
    if root is None:
        print("  Reddit non ha risposto (limite di frequenza): riprova fra "
              "qualche minuto.", file=sys.stderr)
        return []
    out = []
    for i, entry in enumerate(root.findall("atom:entry", ATOM)):
        def txt(tag):
            el = entry.find(tag, ATOM)
            return (el.text or "").strip() if el is not None else ""
        link_el = entry.find("atom:link", ATOM)
        cat = entry.find("atom:category", ATOM)
        sub = cat.get("label") if cat is not None else "Reddit"
        when = parse_date(txt("atom:updated") or txt("atom:published"))
        if when and when < cutoff:
            continue
        title = strip_html(txt("atom:title"))
        if RITUAL_RE.search(title):
            continue
        out.append({
            "platform": f"Reddit {sub}",
            "rank": i + 1,
            "title": title,
            "link": link_el.get("href", "") if link_el is not None else "",
            "when": when.isoformat() if when else None,
            "tipo": "rumore" if NOISE_RE.search(title) else
                    ("lab" if MAKE_RE.search(title) else "discussione"),
            "signal": f"{i + 1}º fra i più votati del giorno su {sub}",
            "source": f"Reddit {sub}",
        })
        if len(out) >= KEEP_REDDIT:
            break
    return out


def show_hn(cutoff):
    since = int(cutoff.timestamp())
    url = ("https://hn.algolia.com/api/v1/search_by_date?tags=show_hn"
           f"&numericFilters=created_at_i%3E{since},points%3E{HN_MIN_POINTS}"
           "&hitsPerPage=40")
    _, _, blob = download("hn", url)
    if not blob:
        return []
    try:
        hits = json.loads(blob.decode("utf-8", "replace")).get("hits", [])
    except ValueError:
        return []
    out = []
    for h in hits:
        title = strip_html(h.get("title") or "")
        points, comments = h.get("points") or 0, h.get("num_comments") or 0
        out.append({
            "platform": "Show HN",
            "rank": None,
            "title": re.sub(r"^\s*show hn:\s*", "", title, flags=re.I),
            "link": h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}",
            "discussion": f"https://news.ycombinator.com/item?id={h.get('objectID')}",
            "when": h.get("created_at"),
            "points": points, "comments": comments,
            "tipo": "lab",
            "signal": f"{points} punti, {comments} commenti su Hacker News",
            "source": C.domain(h.get("url") or "") or "Hacker News",
        })
    out.sort(key=lambda x: -(x["points"] + x["comments"]))
    return out[:KEEP_HN]


def from_raw():
    """Le fonti del LAB con un feed, gia' scaricate da fetch.py oggi."""
    paths = C.raw_paths()
    if not paths:
        return []
    out = []
    for it in C.load_json(paths[-1]).get("items", []):
        if it.get("tier") != "lab":
            continue
        out.append({
            "platform": it.get("source"),
            "rank": None,
            "title": it.get("title", ""),
            "link": it.get("link", ""),
            "when": it.get("date"),
            "tipo": "lab",
            "signal": "dal feed",
            "source": it.get("source"),
            "summary": (it.get("summary") or "")[:200],
        })
    return out


# ------------------------------------------------------------------ stampa

def report(payload):
    items = payload["items"]
    lab = [i for i in items if i.get("tipo") == "lab"]
    talk = [i for i in items if i.get("tipo") == "discussione"]
    noise = [i for i in items if i.get("tipo") == "rumore"]

    print(C.rule(f"LAB — cosa ci fa la gente ({len(lab)})"))
    for i in lab:
        print(f"\n  [{i['platform']}] {i['title'][:96]}")
        print(f"    {i['signal']}")
        if i.get("summary"):
            print(f"    {i['summary'][:120]}")
        print(f"    {i['link']}")
    print(C.rule(f"Se ne parla, ma non e' LAB ({len(talk)})"))
    for i in talk[:10]:
        print(f"  [{i['platform']}] {i['title'][:80]}")
    if noise:
        print(C.rule(f"Messi da parte: lamentele e assistenza ({len(noise)})"))
        for i in noise[:6]:
            print(f"  {i['title'][:76]}")
    print("\nOgni voce che entra in edizione ha bisogno del campo «prova»: come lo "
          "provi tu,\nin una riga. Senza, e' una curiosita'. Con quella, e' lo sblocco.")


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("--hours", type=float, default=30.0)
    ap.add_argument("--show", action="store_true")
    args = ap.parse_args()
    os.makedirs(LAB_DIR, exist_ok=True)

    if args.show:
        files = sorted(f for f in os.listdir(LAB_DIR) if f.endswith(".json"))
        if not files:
            print("Ancora niente in data/lab/.", file=sys.stderr)
            return 1
        report(C.load_json(os.path.join(LAB_DIR, files[-1])))
        return 0

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=args.hours)
    items = reddit(cutoff) + show_hn(cutoff) + from_raw() + manual()
    for it in items:
        it.setdefault("tipo", "lab")

    seen, deduped = set(), []
    for it in items:
        k = C.norm_url(it.get("link"))
        if k and k in seen:
            continue
        seen.add(k)
        deduped.append(it)

    payload = {"fetched_at": now.isoformat(), "window_hours": args.hours,
               "count": len(deduped), "items": deduped}
    out = os.path.join(LAB_DIR, f"{now.astimezone().strftime('%Y-%m-%d')}.json")
    C.save_json(out, payload)
    print(f"Raccolte {len(deduped)} voci in {out}")
    report(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
