# Dossier: ridurre i token della corsa quotidiana di The Morning Brief

## Obiettivo e vincoli (non negoziabili, dettati dal proprietario)
- UNICO obiettivo: l'edizione deve restare al livello qualitativo di oggi. Nessun cambiamento percepibile nel risultato.
- Vogliamo un costo in token sensibilmente più basso.
- NON si toccano: (a) i token di Opus nella scrittura (il sottoagente `redattore` su claude-opus-5-5 scrive la prosa: 15–20 notizie, 5 approfondimenti, citazione, editoriale); (b) la struttura di ricerca delle fonti: `eco.py` (quanto gira, Google/Bing News), la lettura di 3+ testate per le prime cinque e 2+ per le altre con `eco.py --leggi`, i commenti social, `verify.py`, `lint.py`, il visualista.
- Si può toccare: tutto l'overhead — orchestrazione, istruzioni rilette, passi inutili, output dei comandi, divisione del lavoro fra sessione principale e sottoagenti, script deterministici.

## Il contesto
- Piano Claude Pro. Limiti a percentuale (finestra 5 ore, settimana). Extra usage disattivato.
- Una corsa ≈ 40% della finestra di 5 ore e ~7–9 punti della settimana (misura del 3 nov 2026). Settimana ora al 79%.
- La routine gira in cloud (Claude Code), cron 04:30 UTC, modello della sessione principale `claude-sonnet-5`. Strumenti: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent. Repository clonato da GitHub. Un hook di Stop dell'ambiente cloud, a ogni fine turno con modifiche non committate, rimanda indietro «There are uncommitted changes… commit and push».
- Costo = per ogni passo (risposta del modello) si rilegge tutta la conversazione (dalla cache, ~0,1× il prezzo d'ingresso). Totale ≈ passi × lunghezza media del contesto.

## Numeri della corsa del 3 novembre 2026 (sessione principale, da `costo.py`)
- 37 minuti, 208 risposte, 41,4 M token riletti dalla cache, 834 k scritti in cache, 239 k di output.
- Media ≈ 199 k token di contesto per passo. Storico ultimi 14 giorni: 172–279 passi, 31,7–61,9 M riletti, ~45–55 M tipico.
- Sottoagenti (contati a parte, NON si sa se `costo.py` li include — da verificare in `pipeline/costo.py`):
  - lettura (general-purpose, Sonnet): 55 operazioni, 230 k token, 15 minuti; scrive `/tmp/lettura-<giorno>.md` (48 KB, 14 notizie, 31 articoli letti).
  - redattore (Opus): 10 operazioni, 149 k token, 8 minuti.
  - visualista (Sonnet): 8 operazioni, 92 k token, 4 minuti.

## Base fissa del contesto principale (riletta a ogni passo)
- `CLAUDE.md`: 98,6 KB (~28 k token). Il prompt della routine dice di leggerlo «per intero». Metà del file è storia datata («il 2 ottobre la corsa…»), stile dell'app, Duo, Magazine: cose che la corsa non usa.
- Prompt della routine: ~2.200 parole (~6 k token).
- Prompt di sistema + definizioni degli strumenti: ~25–30 k token (stima).
- Totale base ≈ 60–65 k token × 208 passi ≈ 13 M.

## Cronologia osservata nel log (ore UTC; il log mescola eventi della sessione principale e dei sottoagenti, l'attribuzione di alcuni passi è incerta)
- 04:44–04:48 raccolta: fetch, social, lab, threads, claims, missed, taste, eco (comandi separati).
- ~04:49 parte il sottoagente di lettura (finisce 05:04).
- 04:49–05:02 la principale scrive le sezioni ai/banco/social/radar/recap: decine di passi di consultazione del grezzo con python (un titolo alla volta), RSS di Reddit, API di Hacker News, una WebSearch, un curl di un articolo; legge campi dell'edizione di ieri; grep in lint.py per le misure; scrive le sezioni con uno script python da 18 KB.
- 05:00–05:05 attesa attiva del lettore: `ls` del file ×5, `ps aux`, `ListAgents` ×2, `echo waiting`, `ScheduleWakeup` avviato e cancellato. Due interruzioni del hook di Stop → commit intermedi.
- 05:04 parte il redattore (lanciato in background dall'harness anche se il prompt chiedeva una chiamata normale). Il redattore rilancia threads recall/claims/facts/taste/eco in un comando, legge `/tmp/lettura` (48 KB) per intero, fa un `eco.py --leggi` aggiuntivo, scrive tutto con uno script da ~48 KB.
- 05:12 il redattore consegna. Poi la principale: lint (6 volte in tutto nella corsa), verify, ispezioni con python, un declassamento a RUMOR, accenti.py ×2, rubriche --merge, images.py fallisce perché Pillow è rotto nell'ambiente (python3 è 3.11, pip installa per 3.13) → ~6 passi e ~2 minuti per reinstallare, images di nuovo, una correzione di link, threads/facts sync, correzione etichette facts, lint, push, commit, visualista (05:17–05:21), lint, push, prune, costo, costo --fasi, commit, verifica identità GitHub, messaggio finale.
- Output grandi: due dump JSON da 43–58 KB troncati dall'harness a un'anteprima di 2 KB (quindi entrati solo in parte).

## Architettura attuale (file nel repo, cartella /Users/mike/Desktop/Tech_news)
- `.claude/agents/redattore.md` (Opus), `.claude/agents/visualista.md`, `.claude/skills/rassegna/SKILL.md`.
- `pipeline/*.py`: fetch, social, lab, eco (anche `--leggi`), threads, claims, facts, taste, missed, rubriche, verify, images, lint, accenti, borsa, push, prune_auto, costo.
- Il prompt della routine (passi): 1 raccolta + rubriche in background; 2 lettura delegata; 2b la principale scrive le sezioni; 2c redattore Opus; 3 verify; 4 rubriche --merge + images; 5 sync + lint; 6 push + commit; 7 visualista, lint, push; 9 prune; costo; commit finale; messaggio.

## Domanda
Quale riorganizzazione riduce di più i token totali (sessione principale + sottoagenti, misurati dal contatore del piano) senza cambiare il risultato editoriale e rispettando i vincoli? Con stime numeriche motivate e i rischi.
