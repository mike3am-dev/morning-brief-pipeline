#!/usr/bin/env python3
"""
La coda della corsa in tre comandi.

Dopo il redattore, fino al 5 novembre 2026, la regia lanciava una quindicina di
comandi uno per passo (merge delle rubriche, borsa, immagini, i due sync, gli
accenti, il lint ripetuto sei volte, push, commit, prune, costo): una
settantina di passi, ognuno con tutta la conversazione da rileggere, nella
parte della corsa in cui la conversazione e' piu' lunga. Qui gli STESSI
comandi, nello STESSO ordine, in tre blocchi. verify.py resta fuori, fra il
primo e il secondo: i suoi avvisi vanno letti e decisi dal modello.

    python3 pipeline/chiudi.py prepara     rubriche --merge, borsa, images, threads sync,
                                           facts sync, accenti --fix, lint
    python3 pipeline/verify.py             (a mano: si guarda e si decide)
    python3 pipeline/chiudi.py pubblica    lint (0 errori, se no si ferma), push, salva
    (il visualista)
    python3 pipeline/chiudi.py fine        lint, push, prune_auto, costo, salva

Ognuno accetta una data (default: oggi). Gli errori e gli avvisi del lint si
stampano sempre per intero; di images.py solo le righe di problema (foto
mancanti o sgranate). L'uscita completa di ogni comando sta in /tmp/corsa/.

Con CORSA_PROVA=1 push.py e prune_auto.py non partono (si dice cosa avrebbero
fatto), costo.py non registra, salva.py non spinge.

Se uno di questi comandi fallisce, il ripiego e' lanciare a mano il comando di
prima corrispondente: sono gli stessi script, con gli stessi argomenti.
"""

import argparse
import os
import re
import subprocess
import sys
import time
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPE = os.path.join(ROOT, "pipeline")
OUT = "/tmp/corsa"
RUBRICHE_LOG = "/tmp/rubriche.log"
PROVA = os.environ.get("CORSA_PROVA") == "1"


def esegui(nome, args, tmax=600):
    """Lancia pipeline/<script> e salva l'uscita intera. Torna (codice, testo)."""
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    try:
        r = subprocess.run([sys.executable, os.path.join(PIPE, args[0])] + args[1:], cwd=ROOT,
                           capture_output=True, text=True, timeout=tmax)
        code, out = r.returncode, r.stdout + (("\n--- stderr ---\n" + r.stderr) if r.stderr.strip() else "")
    except subprocess.TimeoutExpired:
        code, out = 124, f"tempo scaduto dopo {tmax}s"
    with open(os.path.join(OUT, f"chiudi-{nome}.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"$ python3 pipeline/{' '.join(args)}\n# uscita {code}, {time.time() - t0:.0f}s\n\n{out}")
    return code, out, round(time.time() - t0)


def riga(nome, code, sec, extra=""):
    stato = "ok" if code == 0 else f"USCITA {code}"
    print(f"- {nome}: {stato}, {sec}s" + (f" · {extra}" if extra else ""))


def ultima(out):
    ls = [l.strip() for l in out.split("\n--- stderr ---\n")[0].splitlines() if l.strip()]
    return ls[-1][:160] if ls else ""


def errore_breve(out):
    ls = [l.strip() for l in out.splitlines() if l.strip()]
    return ls[-1][:200] if ls else "(nessuna uscita)"


def lint(day):
    """Il lint, con errori e avvisi stampati per intero. Torna il numero di errori."""
    code, out, sec = esegui("lint", ["lint.py"] + day)
    rilievi = [l for l in out.splitlines() if l.startswith(("  ERRORE", "  avviso"))]
    n_err = sum(1 for l in rilievi if l.startswith("  ERRORE"))
    m = re.search(r"(\d+) errori, (\d+) avvisi", out)
    riga("lint", code, sec, m.group(0) if m else ("nessun rilievo" if "Nessun rilievo" in out else ultima(out)))
    for l in rilievi:
        print("  " + l.strip())
    if code != 0 and not n_err:  # e' caduto, non ha trovato errori
        print("    ! " + errore_breve(out))
        n_err = 1
    return n_err


def rubriche_in_corsa():
    """rubriche.py partito in background da mattino.py e non ancora finito."""
    try:
        ps = subprocess.run(["ps", "-eo", "pid,args"], capture_output=True, text=True).stdout
    except OSError:
        return False
    return any("pipeline/rubriche.py" in l and "--merge" not in l and str(os.getpid()) not in l.split()[:1]
               for l in ps.splitlines())


def prepara(day):
    # 1. le rubriche: se rubriche.py lavora ancora, si aspetta fino a 2 minuti
    t0 = time.time()
    while rubriche_in_corsa() and time.time() - t0 < 120:
        time.sleep(3)
    if rubriche_in_corsa():
        print(f"- rubriche.py ancora in corsa dopo 2 minuti: merge di quello che c'e'")
    giorno = day[0] if day else date.today().isoformat()
    log = ""
    if os.path.exists(RUBRICHE_LOG):
        with open(RUBRICHE_LOG, encoding="utf-8", errors="replace") as fh:
            log = fh.read()
    manca = not os.path.exists(os.path.join(ROOT, "data", "rubriche", f"{giorno}.json"))
    if not rubriche_in_corsa() and (manca or re.search(r"Traceback|Error\b", log)):
        # come prima: se il log mostra un errore, si rilancia una volta e si va avanti
        code, out, sec = esegui("rubriche", ["rubriche.py"] + day, tmax=300)
        riga("rubriche (rilanciato: " + ("mancava il file" if manca else "errore nel log") + ")",
             code, sec, "" if code == 0 else errore_breve(out))
    code, out, sec = esegui("rubriche-merge", ["rubriche.py", "--merge"] + day)
    riga("rubriche --merge", code, sec, ultima(out) if code == 0 else errore_breve(out))

    # 2. la borsa, 3. le immagini
    code, out, sec = esegui("borsa", ["borsa.py"] + day, tmax=120)
    riga("borsa", code, sec, ultima(out))
    code, out, sec = esegui("images", ["images.py"] + day, tmax=600)
    riga("images", code, sec, ultima(out) if code == 0 else errore_breve(out))
    for l in out.splitlines():
        if re.search(r"nessuna immagine|sgranat|Traceback|Error\b", l):
            print("    " + l.strip())

    # 4. i due sync, 5. gli accenti
    for nome, args in (("threads-sync", ["threads.py", "sync"]), ("facts-sync", ["facts.py", "sync"]),
                       ("accenti", ["accenti.py"] + day + ["--fix"])):
        code, out, sec = esegui(nome, args, tmax=180)
        riga(" ".join(args).replace(".py", ""), code, sec, ultima(out) if code == 0 else errore_breve(out))

    # 6. il collaudo
    return 1 if lint(day) else 0


def push(day):
    if PROVA:
        print(f"- push: PROVA, avrei lanciato python3 pipeline/push.py {' '.join(day)}".rstrip())
        return 0
    code, out, sec = esegui("push", ["push.py"] + day, tmax=300)
    riga("push", code, sec, ultima(out) if code == 0 else errore_breve(out))
    return code


def salva(msg):
    r = subprocess.run([sys.executable, os.path.join(PIPE, "salva.py"), msg], cwd=ROOT,
                       capture_output=True, text=True)
    print("- salva: " + (r.stdout.strip() or r.stderr.strip()[-200:]))
    return r.returncode


def pubblica(day):
    if lint(day):
        print("Errori nel lint: correggili nell'edizione e rilancia chiudi.py pubblica. Non pubblicato.")
        return 1
    if push(day):
        print("push.py fallito: rilancialo a mano (python3 pipeline/push.py). Il commit si fa lo stesso.")
        salva(f"Edizione del {day[0] if day else date.today().isoformat()} (push fallito)")
        return 1
    giorno = day[0] if day else date.today().isoformat()
    salva(f"Pubblica l'edizione del {giorno} su Supabase")
    return 0


def fine(day):
    giorno = day[0] if day else date.today().isoformat()
    if lint(day):
        print("Errori nel lint dopo il visualista: correggili (o togli il visivo che li fa) "
              "e rilancia chiudi.py fine. Su Supabase resta l'edizione pubblicata prima.")
        return 1
    stato = push(day)
    if PROVA:
        print("- prune_auto: PROVA, avrei lanciato python3 pipeline/prune_auto.py")
    else:
        code, out, sec = esegui("prune", ["prune_auto.py"], tmax=600)
        riga("prune_auto", code, sec, ultima(out) if code == 0 else errore_breve(out))
    code, out, sec = esegui("costo", ["costo.py"] + (["--dry"] if PROVA else []), tmax=120)
    print(out.split("\n--- stderr ---\n")[0].rstrip())
    salva(f"Fine corsa del {giorno}: visivi e costo della corsa")
    return 1 if stato else 0


def main():
    ap = argparse.ArgumentParser(description="la coda della corsa: prepara, pubblica, fine")
    ap.add_argument("fase", choices=["prepara", "pubblica", "fine"])
    ap.add_argument("date", nargs="?", help="data dell'edizione (default: oggi)")
    args = ap.parse_args()
    day = [args.date] if args.date else []
    if PROVA:
        print("CORSA_PROVA=1: niente push su Supabase, niente prune, niente push su GitHub.")
    return {"prepara": prepara, "pubblica": pubblica, "fine": fine}[args.fase](day)


if __name__ == "__main__":
    sys.exit(main())
