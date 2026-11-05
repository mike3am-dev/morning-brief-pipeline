# Decisione: come alleggerire la corsa del mattino

**In breve.** Quasi tutti i token della corsa vanno nella conversazione, non nel giornale. La sessione di regia costa da sola l'80% e fa lavori che non le spettano: scrive le sezioni minori, aspetta, ripete il lint. Ogni suo passo rilegge tutto quello che c'è prima. Togliamo questi lavori in **due fasi**, e la seconda parte solo dopo una prova. Lettura, verifica, prosa di Opus e visualista non cambiano.

Previsione più probabile:
- token riletti: **da 41 a circa 17 milioni** (−58%);
- finestra di 5 ore: **da ~40% a ~23%**;
- settimana: **da ~8 a ~4,5–5 punti**.

## 1. I conti rifatti (passi × contesto medio)

Il totale è di 208 risposte e 41,4 M token riletti, sottoagenti compresi. Ogni agente parte da ~50 k, sistema e strumenti più i 28 k di CLAUDE.md, che **entra in automatico anche nei sottoagenti**.

| Oggi | passi | contesto medio | M |
|---|---|---|---|
| lettura | 55 | ~140 k (da 50 a 230) | 7,7 |
| redattore (Opus) | 10 | ~100 k | 1,0 |
| visualista | 8 | ~70 k | 0,6 |
| **principale** | **~135** | **~237 k** | **~32** |

Dentro la principale:

| Fase della principale | passi × contesto | M |
|---|---|---|
| raccolta | 13 × 93 k | 1,2 |
| sezioni | 38 × 158 k | 6 |
| attese e hook | 16 × 220 k | 3,5 |
| **coda dopo il redattore** | ~68 × 290 k | **~20** |

Le sezioni aggiungono ~115 k, ripagati in ogni passo della coda.

**Le tre proposte**
- **Architetto (−80%): troppo ottimista.**
  - Una principale di 28 passi a 55 k ignora i 10–15 passi di giudizio che servono dopo verify e lint.
  - Il cronista a 70 k dimentica che CLAUDE.md entra anche lì, e che il primo passo si paga a freddo.
- **Pipeline (−30/35%): troppo prudente.** Somma gli interventi al contesto medio di oggi e perde l'effetto principale: tolte le sezioni, **tutta la coda costa meno**.
- **Garante: ha ragione** sulle uscite troncate e sul radar che deve vedere le rubriche. Sull'estratto delle regole che invecchia, il rischio sparisce se **non si divide** CLAUDE.md: ogni sottoagente lo riceve già intero e aggiornato.

## 2. Il piano

**Fase 1: rischio nullo, stessi comandi e stessi autori.**
1. `costo.py` divide il conto per registro e per modello. Senza, nessun risparmio è dimostrabile.
2. Pillow nel setup, installato con `python3 -m pip`: −6 passi.
3. Il prompt non chiede più di rileggere CLAUDE.md, che è già nel contesto. Se il registro conferma che oggi lo rilegge, sono −28 k a ogni passo.
4. `mattino.py`: la raccolta in un comando solo, le uscite in file, a schermo solo i conteggi.
5. `aspetta.py` blocca fino al segno di fine della lettura. `salva.py` fa il commit in tre punti fissi, così l'hook tace: −12 passi.
6. `chiudi.py` riduce la coda a tre comandi.
   - Stampa **per intero** gli errori e gli avvisi del lint.
   - verify resta a parte: dopo verify decide il modello.
7. `campi.py` al posto dei dump JSON.

**Fase 2, dopo la verifica della fase 1.**

8. Un **cronista** (Sonnet) per AI, banco, social, radar e ripescaggio.
   - Parte in parallelo alla lettura.
   - Riceve il pacchetto `sezioni.py`: un soprainsieme con le escluse elencate, le uscite **complete** di lab, social, missed, taste e recall, e i link delle rubriche. Prima si aspetta che `rubriche.py` abbia finito.
   - Scrive su un file suo, e lo fonde uno script.
   - Si accende solo con un richiamo ≥95% sulle 10 edizioni passate e dopo la prova del 3 novembre.

**Da NON fare**
- **Dividere CLAUDE.md**: si risparmiano ~2,5 M, ma cambia ciò che legge Opus, si espongono le regole aggiunte ogni giorno e la regia perde i casi limite.
- **Toccare il redattore**: ~0,1 M di risparmio in cambio dell'ingresso di Opus cambiato.
- **Comprimere la lettura**: è ricerca.
- **Chiudere il turno per aspettare**: la routine può finire, e scatta l'hook.
- **Modificare CLAUDE.md o gli agenti durante la corsa**: rompe la cache.

## 3. Stime

- **Prudente**: la rilettura di CLAUDE.md non c'era, e la coda scende solo a 50 passi.
- **Ottimista**: la coda scende a 32 passi.

| | riletti (M) | finestra 5 h | settimana |
|---|---|---|---|
| oggi | 41,4 | ~40% | ~8 |
| fase 1 (prudente / **probabile** / ottimista) | 30 / **25** / 22 | 32 / **28** / 26% | 6,4 / **5,7** / 5,3 |
| fase 2 (prudente / **probabile** / ottimista) | 21 / **17** / 14 | 26 / **23** / 21% | 5,3 / **4,6** / 4,2 |

La fase 2 probabile, voce per voce:
- principale ~6 M: la coda, ~38 passi, scende a ~133 k di contesto medio;
- cronista ~2 M: 20 passi a 110 k;
- lettura, redattore e visualista come oggi.

I riletti sono ~65% del costo: output, Opus e scritture calano poco, per questo la quota scende meno dei token.

## 4. Verifica e ritorno indietro

**Prima di cambiare**: il tag `corsa-pre-risparmio` e il prompt della routine versionato nel repo.

**Ogni corsa**, con `qualita.py`:
- soglie dure:
  - lint senza errori, 15–20 notizie;
  - ≥3 testate lette per ciascuna delle prime cinque;
  - `origine`, `reparto` e `claim` al 100%;
  - 5 approfondimenti con ≥2 voci;
  - AI fra 6 e 12 voci, con LAB ≥1/3, foto e `prova`;
  - radar pulito;
  - recap ≤2 con `ref` valido;
  - zero link già usciti;
  - citazione, editoriale e prossimo presenti;
- misure morbide in media mobile, mai sotto l'80% del 3 novembre;
- `costo.py` diviso per agente.

**Passaggio di fase**:
- si va in fase 2 dopo cinque corse pulite in fase 1, con `--fasi` che mostra gli stessi comandi meno i doppioni;
- la fase 2 parte dalla prova sul 3 novembre in un branch, senza push, e da due giorni letti da Mike.

**Ritorno indietro**:
- una soglia dura mancata: si corregge e si ripubblica in giornata;
- due giorni sotto l'80%, o una regola persa che il lint non vede: `git revert` della fase e il prompt di prima, poi un pezzo al giorno;
- dopo due settimane, le notizie aperte in `taste.py` non devono calare.
