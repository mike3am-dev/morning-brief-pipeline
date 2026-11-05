#!/usr/bin/env python3
"""
Il commit della continuita', in un comando e senza rumore.

    python3 pipeline/salva.py "Pubblica l'edizione del 5 novembre"
    python3 pipeline/salva.py "..." --giorno 2026-11-05

Fa quello che la procedura chiede al passo 5 di CLAUDE.md: `git add data/`,
commit e push sul branch claude/rassegna-<giorno> (lo crea se manca, ci si
sposta se si e' altrove). Il prefisso claude/ e' quello che fa scattare il
merge automatico su main. Idempotente: se non c'e' niente da salvare non
committa, e se il commit c'e' gia' ma non e' stato spinto, lo spinge.

Perche' esiste: la routine in cloud ha un hook di Stop che scatta quando la
sessione chiude un turno con modifiche non salvate, e la corsa lo pagava in
passi (una dozzina il 3 novembre 2026). Chiamato in tre punti fissi — dopo le
sezioni, dopo la pubblicazione, alla fine — l'hook tace.

Prima di spingere, se c'e' GITHUB_TOKEN, controlla con chi e' autenticato: se
non e' mike3am-dev non spinge niente (CLAUDE.md, «Solo mike3am-dev»), lascia il
commit locale e lo dice. Con CORSA_PROVA=1 committa ma non spinge.
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNT = "mike3am-dev"


def git(*args, check=False):
    r = subprocess.run(["git"] + list(args), cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {(r.stderr or r.stdout).strip()[:300]}")
    return r


def identita():
    """Il login GitHub del token, o None se non c'e' token da controllare."""
    tok = os.environ.get("GITHUB_TOKEN")
    if not tok:
        return None
    try:
        req = urllib.request.Request("https://api.github.com/user",
                                     headers={"Authorization": f"Bearer {tok}",
                                              "User-Agent": "morning-brief-salva"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r).get("login") or "?"
    except Exception as e:
        return f"? ({type(e).__name__})"


def main():
    ap = argparse.ArgumentParser(description="commit e push di data/ sul branch della corsa")
    ap.add_argument("messaggio", nargs="?", default=None)
    ap.add_argument("--giorno", default=date.today().isoformat())
    args = ap.parse_args()
    prova = os.environ.get("CORSA_PROVA") == "1"
    branch = f"claude/rassegna-{args.giorno}"
    msg = args.messaggio or f"Corsa del {args.giorno}: dati della continuita'"

    try:
        cur = git("rev-parse", "--abbrev-ref", "HEAD", check=True).stdout.strip()
        if cur != branch:
            if git("rev-parse", "--verify", "--quiet", branch).returncode == 0:
                git("checkout", "-q", branch, check=True)
            else:
                git("checkout", "-q", "-b", branch, check=True)
        git("add", "data/", check=True)
        fatto = git("diff", "--cached", "--quiet").returncode != 0
        if fatto:
            git("commit", "-q", "-m", msg, check=True)
        sha = git("rev-parse", "--short", "HEAD").stdout.strip()

        # da spingere: il branch non ha ancora un remoto, o e' avanti
        up = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
        avanti = (up.returncode != 0 or
                  git("rev-list", "--count", "@{u}..HEAD").stdout.strip() not in ("", "0"))
        if not fatto and not avanti:
            print(f"Niente da salvare: {branch} è già allineato ({sha}).")
            return 0
        if prova:
            print(f"PROVA: {'commit ' + sha if fatto else 'nessun commit nuovo'} su {branch}; "
                  f"avrei fatto git push -u origin {branch}.")
            return 0
        chi = identita()
        if chi is not None and chi != ACCOUNT:
            print(f"NON spinto: GitHub risponde come {chi!r}, non {ACCOUNT}. "
                  f"Il commit {sha} resta locale su {branch}: dillo a Mike.")
            return 1
        r = git("push", "-q", "-u", "origin", branch)
        if r.returncode != 0:
            # una sessione precedente di oggi ha gia' spinto lo stesso branch
            git("pull", "-q", "--rebase", "origin", branch)
            r = git("push", "-q", "-u", "origin", branch)
        if r.returncode != 0:
            print(f"Push FALLITO su {branch}: {(r.stderr or r.stdout).strip()[:300]}")
            return 1
        print(f"Salvato: {'commit ' + sha if fatto else 'commit già fatto'} spinto su {branch}.")
        return 0
    except RuntimeError as e:
        print(f"Salvataggio FALLITO: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
