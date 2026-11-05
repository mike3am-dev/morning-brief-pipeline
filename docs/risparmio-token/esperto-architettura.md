# Proposta: la sessione principale fa la regia, non il lavoro

## Diagnosi in numeri

`pipeline/costo.py` somma **anche i sottoagenti**: `tally()` legge il registro principale più `<sessione>/subagents/**.jsonl`. Quindi i 41,4 M e le 208 risposte sono il totale. Stima della divisione:

- lettura: ~56 passi × ~130 k di contesto medio ≈ 7,3 M
- redattore: ~11 × 110 k ≈ 1,2 M
- visualista: ~9 × 70 k ≈ 0,6 M
- **principale: ~132 passi × ~245 k ≈ 32 M (circa il 78%)**

I 230 k, 149 k e 92 k del dossier li prendo come contesto finale dei sottoagenti, non come totale cumulato.

La regola che spiega tutto: ogni token che entra nella principale al passo *k* si paga una volta in scrittura (1,25×) e poi a 0,1× per ognuno dei passi che restano. Un dump da 15 k entrato al passo 20 costa ~185 k-equivalenti, cioè circa 12 volte la sua misura. Il costo non viene dalla lettura o dalla scrittura in sé: viene dal fatto che **succedono nella conversazione più lunga**.

La base fissa pesa due volte. `CLAUDE.md` entra da solo nel contesto (sessione principale **e** ogni sottoagente), e il prompt chiede di rileggerlo per intero.

## Gli interventi

### 1. CLAUDE.md operativo, manuale a parte
- `CLAUDE.md` diventa ~5 k token: procedura, identità GitHub, prefisso `claude/`, mai stampare base64.
- Il testo editoriale passa **senza cambiare una parola** in `docs/manuale-redazione.md`.
- Storia, app, Duo e Magazine vanno in `docs/app.md`.
- Il prompt della routine passa da ~6 k a ~1,5 k e non dice più «leggilo per intero».
- Effetto: base principale da ~60–90 k a ~32 k. I sottoagenti leggono le sezioni del manuale che li riguardano.

### 2. `pipeline/corsa.py`: regia deterministica, un solo comando per fase
- `corsa.py prepara`:
  - controlla l'ambiente (`python3 -m pip install Pillow` con l'interprete giusto: basta con i 6 passi persi);
  - lancia fetch, social, lab, taste, missed, threads list/recall, claims, facts, eco, e rubriche in background;
  - le uscite vanno in `/tmp/corsa/<giorno>/*.txt`, a schermo ≤ 30 righe di conteggi e feed muti.
  - Stessi script, stessi argomenti: la ricerca resta quella di oggi.
- `corsa.py pubblica`:
  - verify → rubriche --merge → borsa → sync → accenti --fix → images → lint → push → prune → commit;
  - si ferma al primo errore e stampa per intero solo gli errori e gli avvisi di verify, gli altri avvisi come conteggio.
- `corsa.py chiudi`: lint, push, costo, verifica identità, commit.

### 3. Nuovo sottoagente `cronista` (Sonnet) per ai, banco, social, radar e recap
- Oggi sono ~40 passi nella principale a ~200–245 k di contesto (≈ 8–10 M), un titolo alla volta.
- `sezioni_input.py` prepara un solo file compatto (~30 k) con:
  - i gironi ai/lab/banco con titolo, fonte, link, sommario e ora;
  - `lab.py`, social (nuovo ed eco), missed e le caselle del radar di `taste.py`;
  - i link già usati, le misure di `lint.py`.
- Il cronista legge le sezioni del manuale, fa le stesse verifiche mirate di oggi (RSS Reddit, HN, WebSearch) e scrive con uno script solo.
- Costo: ~20 passi × 70 k ≈ 1,4 M. Parte **in parallelo alla lettura** (due Agent nello stesso messaggio).

### 4. Lettura: stessi articoli, meno giri
- Le regole su testate e commenti restano intatte. `eco.py --leggi` resta, ma con un solo elenco.
- Un helper `commenti.py` scarica in un colpo i thread Reddit/HN dei link scelti.
- Gli articoli lunghi si leggono per ultimi.
- Il formato di `/tmp/lettura-<giorno>.md` **non cambia**: è l'ingresso del redattore.
- Stima: 56 → ~30 passi, contesto medio da 130 k a ~115 k (via ~23 k di CLAUDE.md) ≈ 3,5 M.

### 5. Redattore e visualista: intoccati
- Per non spostare un token di Opus, la prima riga del redattore diventa «leggi `docs/manuale-redazione.md` e `docs/app.md`». Così il suo contesto contiene lo stesso testo di oggi (±1%).
- Il visualista legge la sezione «Le visualizzazioni» del manuale. La sua definizione non cambia.

### 6. Attese, cache e hook di Stop
- In questo ambiente i sottoagenti partono comunque in background, e non si può imporre il contrario. Quindi: lanciarli, fare il commit dei `data/`, **chiudere il turno** e lasciarsi svegliare dalla notifica.
  - Niente `ls`, `ps`, `ListAgents`, `ScheduleWakeup`: oggi ~10 passi × 245 k ≈ 2,5 M.
- L'hook di Stop scatta solo se ci sono modifiche non committate. Il commit prima di ogni attesa lo zittisce. `rubriche.py` va atteso (il pid) dentro quel commit, se no sporca l'albero.
- Una pausa oltre il TTL della cache (5 minuti) fa riscrivere a 1,25× tutto il contesto: oggi ~245 k × 3 attese ≈ 0,9 M-equivalenti, dopo ~40 k × 3.
- Nel corso della corsa **non si toccano** `CLAUDE.md` né le definizioni degli agenti: cambierebbero il prefisso e romperebbero la cache.

## Bilancio (token riletti dalla cache)

| | prima | dopo |
|---|---|---|
| principale | ~132 passi × 245 k ≈ 32 M | ~28 passi × 55 k ≈ 1,5 M |
| lettura | 7,3 M | 3,5 M |
| cronista (nuovo) | — | 1,4 M |
| redattore (Opus) | 1,2 M | 1,2 M |
| visualista | 0,6 M | 0,5 M |
| **totale** | **~41 M** | **~8 M (−80%)** |

- Scritture in cache: da 834 k a ~450 k (restano gli avvii a freddo dei sottoagenti).
- Output: ~invariato (lo script delle sezioni cambia solo autore).
- Peso sul piano: da ~40% della finestra a circa 12–15%. Il resto è soprattutto Opus, che non si tocca.

## Rischi per la qualità e come si verifica

- **Cronista** (rischio medio, l'unico che cambia chi scrive). Stesso modello, stesso testo delle regole, stesso materiale. Cambia solo la forma dell'ingresso: digest invece di una consultazione a pezzi.
  - Verifica: riprodurre il 3 novembre sugli ingressi congelati (`data/raw`, `data/eco`, cache di verify) e confrontare le sezioni con quelle uscite.
  - Cosa si confronta: numero di voci, quota LAB ≥ 1/3, voci LAB con foto, link nuovi, esito di lint e verify.
  - Il controllo lo fa uno script `confronto.py`, poi una lettura di Mike su due giorni.
- **CLAUDE.md diviso** (basso): nessuna regola cambia testo. `grep` incrociato per controllare che ogni frase di oggi stia in uno dei tre file.
- **corsa.py** (basso): stessi comandi. Si confronta il registro dei comandi lanciati (`costo.py --fasi`) prima e dopo.
- **Lettura** (basso): `/tmp/lettura` deve avere le stesse notizie candidate, lo stesso numero di articoli letti (31) e ≥ 3 testate per le prime cinque.
- **Redattore** (nullo): stesso ingresso. Si confrontano i token Opus per corsa in `costo.py`.
- **Misura:** aggiungere a `costo.py` la divisione per registro (principale e ogni sottoagente). Oggi dà solo il totale, quindi nessun risparmio è dimostrabile.
