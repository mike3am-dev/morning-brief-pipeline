# Proposta: meno passi, stesso giornale (taglio pipeline)

## Principio
Ogni passo della principale rilegge tutto (~199 k medi). Due leve: **togliere passi** (150–250 k l'uno) e **non far entrare testo presto** (1 KB entrato al passo 20 ≈ 280 token × ~190 passi ≈ 50 k). Il meccanico agli script, il giudizio al modello. Opus, eco.py, letture multiple, verify, lint e visualista invariati.

## costo.py: cosa misura
- Righe 56–61: `session_files` prende il registro principale **più tutti i `.jsonl` sotto `<sessione>/`** (ricorsivo, cioè `subagents/`); riga 217 `tally(files)` li somma. **I sottoagenti sono già nei 41,4 M**, se i loro registri esistono quando costo.py parte (il visualista ha finito prima: sì).
- Righe 143–170: nessuna distinzione per modello o agente. Opus pesa come Sonnet, e `risposte` (208) mescola principale e sottoagenti: «208 passi della principale» è probabilmente il totale.
- Righe 64–66: `PASSI` non include eco, rubriche, borsa, accenti, quindi `--fasi` non li vede.
- **Da fare:** in `tally` raggruppare per `msg["model"]` e per file, e scriverlo in `corse.json`. Senza, non si misura se un intervento funziona.

## Interventi

**1. `pipeline/mattino.py`, la raccolta in un comando.** Lancia fetch, social, lab, rubriche (background), threads list, claims open, facts moving, missed, recall --raw, taste, eco, borsa. Le uscite complete vanno in `data/run/<giorno>/<script>.txt`; a schermo ≤3 KB: conteggi per girone, feed muti, errori. I file li leggono lettore e sezionista, non la principale.
- −9 passi; ~2,5–3,5 M (passi più 30–50 KB di uscite che oggi restano nel contesto fino alla fine).
- Rischio nullo (stessi comandi). Verifica: `diff` fra le uscite attuali e i file salvati.

**2. `pipeline/sezioni.py`, il pacchetto sezioni.** In `data/run/<giorno>/sezioni.md` i candidati già filtrati, con titolo, sommario, link del grezzo, fonte, ora, foto sì/no:
- ai: cronaca e LAB, con lab.py;
- banco: video segnati;
- social: i mucchi «nuovo» ed «eco», con l'RSS dei commenti dei primi tre thread;
- radar: caselle di taste.py e girone larga, senza i temi `axis` e senza i link di AI e rubriche;
- recap: i candidati di missed.py con `ref`.

I link già usciti sono marcati e in testa ci sono le misure lette da lint.py. Scrive un sottoagente Sonnet che legge solo quel file (~50 k di contesto).
- −35 passi nella principale (04:49–05:02); ~4–5 M, contro ~0,4 M del sottoagente.
- Rischio: un filtro che scarta una voce buona. Per questo il pacchetto è un soprainsieme, con le escluse elencate, e la WebSearch per il LAB resta.
- Verifica, prima di toccare la corsa: si fa girare sulle 10 edizioni passate e si conta il richiamo, cioè quante voci pubblicate stanno nel pacchetto (obiettivo ≥95%).

**3. Attesa del lettore che blocca.** Oggi ls ×5, ps, ListAgents ×2, echo e ScheduleWakeup fanno ~10 passi. Al loro posto: il lettore chiude il file con `<!-- fine -->` e `pipeline/aspetta.py <file> --max 540` blocca fino a quella riga (sotto il tetto di 10 minuti di Bash).
- −8 passi; ~1,4 M; rischio nullo. Verifica: `costo.py --fasi`.

**4. Hook di Stop.** Scatta quando la principale chiude un turno con modifiche non salvate, cioè mentre aspetta: con il punto 3 non succede più. `pipeline/salva.py` (add, commit e push su `claude/rassegna-<giorno>`, idempotente, con il controllo `mike3am-dev`) si chiama in tre punti fissi: dopo mattino.py, dopo il primo push e alla fine. `data/run/` va in `.gitignore`.
- −6 passi; ~1 M; rischio nullo. Verifica: zero «uncommitted changes» nel registro.

**5. `pipeline/chiudi.py`, la chiusura in tre comandi.**
- `--prepara`: merge delle rubriche, borsa, i due sync, accenti --fix, images, lint. Mostra solo gli errori.
- `--pubblica`: push e salva.
- `--finale`: dopo il visualista, lint, push, prune, costo, salva.

verify.py resta a parte, perché i suoi avvisi vanno decisi. La coda (~40 passi a ~230 k, il contesto più pesante) scende a ~12.
- ~5–6 M.
- Rischio basso: il lint blocca come prima e gli errori li corregge il modello.
- Verifica: due corse in parallelo sullo stesso giorno, con un `diff` delle edizioni.

**6. Pillow, sistemato per sempre.** In testa a mattino.py: se `import PIL` fallisce, `subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--user", "-r", "requirements.txt"])`, con lo stesso interprete 3.11 (oggi `pip` è il 3.13). Lo stesso `python3 -m pip install` va nel setup dell'ambiente cloud.
- −6 passi; ~1,4 M e 2 minuti; rischio nullo. Verifica: il riassunto stampa la versione di Python e quella di PIL.

**7. Uscite compatte.** `pipeline/campi.py <giorno> news id,title,sources` mostra solo i campi chiesti, mai `image` o `audio`, entro 4 KB. Sostituisce i dump da 43–58 KB.
- −3 passi; ~0,6 M.

**8. (Minore)** Il redattore legge `data/run/` invece di rilanciare recall, claims, facts, taste ed eco: input identico, scrittura invariata.

## Conto
| | passi | M token |
|---|---|---|
| 1 raccolta | −9 | 2,5–3,5 |
| 2 sezioni | −35 | 4–5 |
| 3 attesa | −8 | 1,4 |
| 4 hook | −6 | 1 |
| 5 chiusura | −28 | 5–6 |
| 6 Pillow | −6 | 1,4 |
| 7 uscite | −3 | 0,6 |

Contando le sovrapposizioni, la stima prudente è **−12/15 M su 41 M (30–35%)**, con i passi da ~208 a ~120: la corsa scende da ~40% a ~27% della finestra di 5 ore.

**Ordine:** prima il 6 e il fix di costo.py (rischio zero, misura vera), poi 1, 3, 4 e 5, per ultimo il 2 dopo la prova sull'archivio.
