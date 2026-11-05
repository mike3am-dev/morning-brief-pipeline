#!/usr/bin/env python3
"""
La raccolta del mattino in un comando solo.

Fino al 5 novembre 2026 la regia lanciava a mano, uno per passo, una dozzina di
script: fetch, social, lab, eco, rubriche, i fili, le previsioni, i numeri, il
ripescaggio, il gusto, la memoria. Ogni passo rileggeva tutta la conversazione,
e le uscite (40-50 KB in tutto) restavano nel contesto fino alla fine della
corsa, ripagate a ogni passo successivo. Qui girano gli STESSI comandi, nello
STESSO ordine; l'uscita di ognuno va INTERA in un file (mai troncata: lo
leggono il lettore e la regia quando serve), e a schermo resta un riassunto:
conteggi, feed muti o rotti, errori, il percorso di ogni file.

    python3 pipeline/mattino.py              tutta la raccolta
    python3 pipeline/mattino.py --dir /tmp/x le uscite altrove (default /tmp/corsa)

Prima di tutto controlla Pillow: il 3 novembre 2026 nel cloud `python3` era la
3.11 e `pip` installava per la 3.13, e images.py e' caduto a meta' corsa. Se
`import PIL.Image` fallisce lo reinstalla con lo stesso interprete che gira qui.

Se un comando fallisce o va oltre il suo tempo lo dice e passa al successivo: la
raccolta e' fatta di pezzi indipendenti, e un ripescaggio che non risponde non
deve fermare le notizie. rubriche.py parte in background (log in
/tmp/rubriche.log) come prima, e chiudi.py prepara lo aspetta prima del merge.
"""

import argparse
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPE = os.path.join(ROOT, "pipeline")
OUT = "/tmp/corsa"
RUBRICHE_LOG = "/tmp/rubriche.log"

# nome del file, comando, tempo massimo in secondi. L'ordine e' quello della
# procedura in CLAUDE.md (passo 1 e inizio del passo 2). missed.py il 3
# novembre ha superato i 60 secondi: i tempi sono larghi apposta, il tetto
# serve solo a non restare appesi a un sito che non risponde.
PASSI = [
    ("fetch", ["fetch.py", "--hours", "26"], 300),
    ("social", ["social.py", "--hours", "30"], 300),
    ("lab", ["lab.py", "--hours", "30"], 360),
    ("eco", ["eco.py"], 480),
    ("rubriche", None, 0),  # in background, vedi sotto
    ("threads-list", ["threads.py", "list"], 90),
    ("claims-open", ["claims.py", "open", "--due", "30"], 90),
    ("facts-moving", ["facts.py", "moving"], 90),
    ("missed", ["missed.py"], 300),
    ("taste", ["taste.py"], 180),
    ("recall", ["threads.py", "recall", "--raw"], 240),
]


def pillow():
    """Pillow per l'interprete che gira davvero la pipeline. Torna una riga."""
    def prova():
        r = subprocess.run([sys.executable, "-c", "import PIL, PIL.Image; print(PIL.__version__)"],
                           capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None

    ver = prova()
    py = f"Python {sys.version.split()[0]}"
    if ver:
        return f"{py}, Pillow {ver}"
    r = subprocess.run([sys.executable, "-m", "pip", "install", "--force-reinstall",
                        "--no-cache-dir", "-q", "Pillow"], capture_output=True, text=True)
    ver = prova()
    if ver:
        return f"{py}, Pillow {ver} (reinstallato)"
    err = (r.stderr or r.stdout).strip().splitlines()[-1:] or ["?"]
    return f"{py}, Pillow ASSENTE dopo la reinstallazione: {err[0][:160]}"


def run(nome, cmd, tmax, outdir):
    path = os.path.join(outdir, nome + ".txt")
    t0 = time.time()
    try:
        r = subprocess.run([sys.executable, os.path.join(PIPE, cmd[0])] + cmd[1:], cwd=ROOT,
                           capture_output=True, text=True, timeout=tmax,
                           env=dict(os.environ, PYTHONUNBUFFERED="1"))
        out = r.stdout + (("\n--- stderr ---\n" + r.stderr) if r.stderr.strip() else "")
        stato = "ok" if r.returncode == 0 else f"USCITA {r.returncode}"
    except subprocess.TimeoutExpired as e:
        def txt(b):
            return b.decode("utf-8", "replace") if isinstance(b, bytes) else (b or "")
        out = txt(e.stdout) + (("\n--- stderr ---\n" + txt(e.stderr)) if e.stderr else "")
        stato = f"TEMPO SCADUTO dopo {tmax}s"
    except Exception as e:  # interprete o file mancante: si dice e si va avanti
        out, stato = f"{type(e).__name__}: {e}", "NON PARTITO"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(f"$ python3 pipeline/{' '.join(cmd)}\n# {stato}, {time.time() - t0:.0f}s\n\n{out}")
    return stato, round(time.time() - t0), out, path


# ------------------------------------------------------------ i riassunti

def righe(out, *pattern):
    rx = re.compile("|".join(pattern))
    return [l.rstrip() for l in out.splitlines() if rx.search(l)]


def errori(out):
    """Le righe che sembrano un guasto: traceback, Error, stderr."""
    tail = out.split("\n--- stderr ---\n", 1)
    err = righe(out, r"Traceback|Error\b|Errore|ERRORE|Exception")
    if len(tail) > 1:
        last = [l for l in tail[1].strip().splitlines() if l.strip()][-1:]
        err += [l for l in last if l not in err]
    return err[:4]


def conta(out, rx):
    return sum(1 for l in out.splitlines() if re.search(rx, l))


def sommario(nome, out):
    """Le poche righe che servono a schermo per ogni comando: conteggi e
    allarmi. Il resto e' nel file, intero."""
    corpo = out.split("\n--- stderr ---\n")[0]
    if nome == "fetch":
        apple = r"feed troncato .*\((primaria|redazionale)\)"
        altri = conta(corpo, r"feed troncato") - conta(corpo, apple)
        return righe(corpo, r"^Scritti \d+", r"^Per girone", r"ATTENZIONE", apple, r"Pagine in piu'") + (
            [f"  (+{altri} feed troncati negli altri gironi, elenco nel file)"] if altri else [])
    if nome in ("social", "lab"):
        # «Raccolte N ...» e le intestazioni dei mucchi con il loro numero
        return [l.strip() for l in righe(corpo, r"^Raccolte \d+", r"^\S.*(— \d+|\(\d+\))\s*$")]
    if nome == "eco":
        return [l.strip() for l in righe(corpo, r"^Quanto gira")][:1]
    if nome == "threads-list":
        fili = [l for l in corpo.splitlines() if re.search(r"\s(oggi|\d+g fa)\s*$", l)]
        vivi = [l for l in fili if re.search(r"\s(oggi|[1-3]g fa)\s*$", l)]
        return [f"{len(fili)} fili, {len(vivi)} toccati negli ultimi 3 giorni"]
    if nome == "claims-open":
        return [l.strip() for l in righe(corpo, r"^\d+ previsioni")] + (
            [f"di cui {conta(corpo, r'SCADUTA')} scadute senza verdetto"] if conta(corpo, r"SCADUTA") else [])
    if nome == "facts-moving":
        return [f"{conta(corpo, '→')} numeri che si sono mossi negli ultimi 60 giorni"]
    if nome == "missed":
        return [l.strip()[:150] for l in righe(corpo, r"^\d+ candidati", r"^\(Perse da te", r"PERSA DA TE")][:3]
    if nome == "taste":
        return [l.strip()[:150] for l in righe(corpo, r"^\d+ voci con un segnale", r"※")] + [
            f"{conta(corpo, r'→ declassa')} declassamenti, {conta(corpo, r'→ tieni alto')} da tenere alti; "
            f"radar: {conta(corpo, r'^  · [a-z0-9-]+ +(in prova|sonda|confermato|nuovo)')} caselle"]
    if nome == "recall":
        return [l.strip() for l in righe(corpo, r"^Gia' raccontato")][:1] + [
            f"{conta(corpo, r'^  oggi ')} coppie da decidere (doppione o seguito)"]
    last = [l.strip() for l in corpo.splitlines() if l.strip()]
    return [last[-1][:150]] if last else ["(nessuna uscita)"]


def avvisi(out):
    """Le righe di stderr di un comando andato bene: di solito un sito che non
    ha risposto (Reddit col suo limite), da sapere ma non un guasto."""
    if "\n--- stderr ---\n" not in out:
        return []
    return [l.strip()[:160] for l in out.split("\n--- stderr ---\n", 1)[1].splitlines() if l.strip()][:2]


def main():
    ap = argparse.ArgumentParser(description="la raccolta del mattino in un comando")
    ap.add_argument("--dir", default=OUT, help="dove scrivere le uscite (default /tmp/corsa)")
    args = ap.parse_args()
    os.makedirs(args.dir, exist_ok=True)
    # le uscite di una corsa precedente confonderebbero chi legge
    for f in os.listdir(args.dir):
        if f.endswith(".txt"):
            os.remove(os.path.join(args.dir, f))

    try:
        sys.stdout.reconfigure(line_buffering=True)  # le righe escono mentre la raccolta va
    except AttributeError:
        pass
    t0 = time.time()
    print("Ambiente:", pillow())
    falliti = []
    for nome, cmd, tmax in PASSI:
        if nome == "rubriche":
            # come prima: nohup python3 pipeline/rubriche.py > /tmp/rubriche.log 2>&1 &
            # GTA VI (5 novembre 2026): gta.py viene subito dopo, nello stesso processo in
            # background, perche' il suo dossier usa le notizie GTA che rubriche.py ha trovato.
            # Scrive /tmp/corsa/gta-dossier.txt, che l'agente `gta` aspetta con aspetta.py.
            catena = (f'"{sys.executable}" pipeline/rubriche.py; '
                      f'"{sys.executable}" pipeline/gta.py > /tmp/gta.log 2>&1')
            with open(RUBRICHE_LOG, "w") as log:
                p = subprocess.Popen(["/bin/sh", "-c", catena], cwd=ROOT,
                                     stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            print(f"- rubriche + gta: partiti in background (pid {p.pid}), log {RUBRICHE_LOG} e /tmp/gta.log")
            continue
        stato, sec, out, path = run(nome, cmd, tmax, args.dir)
        kb = len(out.encode("utf-8")) / 1024
        print(f"- {nome}: {stato}, {sec}s, {kb:.0f} KB -> {path}")
        if stato != "ok":
            falliti.append(nome)
            for e in errori(out):
                print(f"    ! {e[:200]}")
        else:
            for a in avvisi(out):
                print(f"    ~ {a}")
        for s in sommario(nome, out):
            print(f"    {s}")
    print(f"Raccolta finita in {time.time() - t0:.0f}s"
          + (f"; FALLITI: {', '.join(falliti)} (rilanciali a mano, vedi i file)" if falliti else "; nessun errore."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
