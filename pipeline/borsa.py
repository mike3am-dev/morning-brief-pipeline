#!/usr/bin/env python3
"""Apple in borsa per la plancia del mattino: la chiusura dell'ultima seduta.

La plancia della vista Magazine (2 novembre 2026) mostra il titolo AAPL. Un
prezzo davvero dal vivo vorrebbe un servizio con una chiave, e una chiave nella
pagina la vedrebbe chiunque: si e' scelto l'onesto, la chiusura dell'ultima
seduta conclusa, con la variazione sul giorno prima e la curva degli ultimi
sette giorni di borsa. La corsa delle 6:30 la scrive nell'edizione (`borsa`).

Fonte: Yahoo Finance, il grafico giornaliero pubblico. Se la seduta di oggi a
New York e' ancora aperta (lanciato di pomeriggio dal Mac), la barra di oggi
non e' una chiusura e si scarta.

    python3 pipeline/borsa.py              scrive nell'edizione di oggi
    python3 pipeline/borsa.py 2026-11-02   in un'altra
    python3 pipeline/borsa.py --dry        stampa e basta
"""
import argparse
import datetime as dt
import json
import os
import subprocess
import sys

import common as C

URL = "https://query1.finance.yahoo.com/v8/finance/chart/{s}?range=15d&interval=1d"
# con l'intestazione completa di Safari Yahoo risponde «Too Many Requests»; con
# quella corta no (2 novembre 2026). Se cambia, prova query2 al posto di query1
UA = "Mozilla/5.0"
GIORNI = 7


def scarica(simbolo):
    for host in ("query1", "query2"):
        out = subprocess.run(["curl", "-sL", "--max-time", "20", "-A", UA,
                              URL.format(s=simbolo).replace("query1", host)],
                             capture_output=True, timeout=30)
        try:
            return json.loads(out.stdout.decode("utf-8", "replace"))
        except ValueError:
            continue
    raise RuntimeError("Yahoo non risponde con dati leggibili")


def chiusure(simbolo):
    data = scarica(simbolo)
    res = data["chart"]["result"][0]
    meta = res["meta"]
    ts = res.get("timestamp") or []
    closes = res["indicators"]["quote"][0].get("close") or []
    off = meta.get("gmtoffset", -18000)
    now = dt.datetime.now(dt.timezone.utc).timestamp()
    reg = (meta.get("currentTradingPeriod") or {}).get("regular") or {}
    aperta = reg.get("start", 0) <= now < reg.get("end", 0)
    righe = []
    for t, c in zip(ts, closes):
        if c is None:
            continue
        giorno = dt.datetime.fromtimestamp(t + off, dt.timezone.utc).date().isoformat()
        righe.append((giorno, round(float(c), 2)))
    if aperta and righe:
        oggi_ny = dt.datetime.fromtimestamp(now + off, dt.timezone.utc).date().isoformat()
        if righe[-1][0] == oggi_ny:
            righe.pop()
    return righe


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?")
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()
    day = args.date or C.today()
    try:
        righe = chiusure("AAPL")
    except Exception as e:
        print(f"Borsa non disponibile: {e}", file=sys.stderr)
        return 0          # la plancia fa a meno del riquadro: non si ferma la corsa
    if len(righe) < 2:
        print("Borsa: troppo poche sedute.", file=sys.stderr)
        return 0
    ultimo, prima = righe[-1], righe[-2]
    borsa = {
        "simbolo": "AAPL",
        "chiusura": ultimo[1],
        "variazione": round((ultimo[1] - prima[1]) / prima[1] * 100, 2),
        "data": ultimo[0],
        "serie": [c for _, c in righe[-GIORNI:]],
        "fonte": "Yahoo Finance",
    }
    print(f"AAPL {borsa['chiusura']} $ ({borsa['variazione']:+.2f}%) chiusura del {borsa['data']}")
    if args.dry:
        return 0
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not os.path.exists(path):
        print(f"Nessuna edizione per il {day}.", file=sys.stderr)
        return 1
    brief = C.load_json(path)
    brief["borsa"] = borsa
    C.save_json(path, brief)
    return 0


if __name__ == "__main__":
    sys.exit(main())
