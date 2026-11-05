# Fase 1 — rapporto (5 novembre 2026)

## Cosa c'è

- **costo.py**: il conto è diviso per registro (nome da `agent-*.meta.json`) e per modello, nei campi nuovi `registri` e `modelli` di `corse.json`. `PASSI` riconosce anche eco, rubriche, borsa, accenti e gli script nuovi. In più c'è `--confronto`.
- **mattino.py**: Pillow per l'interprete giusto, poi gli 11 comandi nello stesso ordine. Ogni uscita va intera in `/tmp/corsa/<nome>.txt`; a schermo restano conteggi e allarmi.
- **aspetta.py**, **salva.py** (controlla `mike3am-dev`, rispetta `CORSA_PROVA`), **chiudi.py** (prepara, pubblica, fine), **campi.py**, **qualita.py**.
- `.claude/scheduled_tasks.lock` è fuori dal tracciamento (rimozione già in stage) e in `.gitignore`.
- **routine/prompt.md**: cambia solo l'orchestrazione, con un RIPIEGO esplicito. Il resto è parola per parola.

## Due ritocchi fuori elenco

- **common.py**: `similarity` tiene in memoria i token dei titoli. `missed.py` superava i 300 s di CPU; ora ci mette 6–12 s. Su 400.000 confronti a caso, vecchio e nuovo danno 0 differenze.
- **verify.py**: una riga. «Apple Developer Releases» ha lo stesso dominio di Apple Developer e, senza la riga, `ufficiale` sarebbe diventato falso.

## Prove (worktree, `CORSA_PROVA=1`)

- **mattino.py**, rete vera: `Raccolta finita in 40s; nessun errore.` 611 articoli, 2 da Releases.
- **aspetta.py**: senza file esce 2, senza segno esce 2, col segno aggiunto dopo 3 s esce 0 con «Pronto … dopo 3s».
- **chiudi.py prepara** sulla copia del 5 novembre: `0 errori, 7 avvisi`, stampati per intero. Le immagini di notizie e AI hanno gli stessi hash di prima.
- **pubblica, fine, salva.py**, provati in un clone con origin su un repository bare:
  - `PROVA: commit e7c8c77 su claude/rassegna-2026-11-05; avrei fatto git push`;
  - un secondo giro risponde «Niente da salvare»;
  - con un errore nel lint, `exit 1` e «Non pubblicato».
- **costo.py --confronto 2026-11-04**: riletti 42,4 → 31,3 M, passi 197 → 177.
- **qualita.py**, soglie dure mancate:

| Edizione | Mancate | Quali |
|---|---|---|
| 2 nov | 4 | — |
| 3 nov | 2 | un accento; #2 e #4 da 2 testate |
| 4 nov | 1 | LAB senza foto |
| 5 nov | 2 | #2 da una testata; **manca la citazione** |

La base del 3 novembre non supera tutte le sue soglie. Testate lette = `sources`, soglia `min(3, verifica.testate)`.

## Feed troncati

| Testata | Voci | Copre |
|---|---|---|
| iSpazio | 10 | 14,7 h |
| MacRumors | 20 | 20,6 h |
| BGR | 20 | 20 h |
| The Verge | 10 | 14,9 h |
| Tom's HW IT | 20 | 1 h (solo `<updated>`) |

Negli altri gironi altri otto, fra cui HDblog, IGN e TechRadar.

`fetch.py` ora:
- legge `?paged=2` e poi `3` quando la pagina 1 non copre la finestra, e tiene solo i link nuovi;
- per iSpazio usa `/feed/atom/?paged=N`, perché quello RSS ignora `paged`;
- recupera iSpazio (da 10 a 20 voci), Gizmodo, Hackaday, Kotaku, TechCrunch; HDblog migliora ma resta troncato;
- segnala «feed troncato» nel riepilogo, prima le testate Apple.

## Cosa non ho fatto

- Nessun commit, nessun push, la routine non è toccata. Worktree e clone sono rimossi.
- MacRumors e The Verge restano troncati. Proposta da decidere: il feed `theverge.com/rss/apple/index.xml`, che copre 58 h. L'ho lasciato fuori perché cambierebbe le etichette di `verify.py`.
- Il tag `corsa-pre-risparmio` va messo da te.

## Stima

| Voce | Passi in meno |
|---|---|
| raccolta | ~9 |
| Pillow | ~6 |
| attese | ~8 |
| hook | ~6 |
| coda (da ~68 a ~25) | ~40 |
| dump | ~3 |

**50–70 passi in meno** su ~135 della regia (prudente 40).
