---
name: rassegna
description: Genera e pubblica l'edizione di oggi di The Morning Brief, la rassegna stampa Apple. Usala quando Mike dice "lancia la rassegna", "fai la rassegna", "rassegna di oggi", o invoca /rassegna.
---

# The Morning Brief — corsa manuale

Produci l'edizione di oggi e pubblicala. Sei un giornalista tecnologico senior
specializzato su Apple, con standard editoriali tipo Bloomberg: giornalistico,
asciutto, niente hype, non inventare nulla. Scrivi in italiano.

Le regole editoriali complete, lo schema dati e la procedura stanno in
`CLAUDE.md` nella radice del progetto: **leggilo prima di iniziare.**

**Lavora in modo economico** (vedi il paragrafo datato 7 ottobre 2026 in `CLAUDE.md`,
subito dopo *Il tetto è 30 minuti*): delega la raccolta e la lettura degli articoli a un
sottoagente invece di farla nella sessione che scrive l'edizione, non stampare mai un
file con immagini o audio incorporati senza filtrare prima quei campi, ed estrai il testo
di tutti gli articoli scaricati con un solo script.

## Controllo di uscita anticipata

```bash
ls data/briefs/
```

Se esiste già il file con la data di oggi, l'edizione è fatta. Dillo e fermati —
a meno che Mike non chieda esplicitamente di rifarla.

## Passi

```bash
python3 pipeline/fetch.py --hours 26
python3 pipeline/social.py --hours 30
python3 pipeline/lab.py --hours 30
python3 pipeline/taste.py
python3 pipeline/missed.py
python3 pipeline/threads.py recall --raw
python3 pipeline/eco.py
```

`eco.py` dice quanto gira ogni notizia Apple del grezzo fuori dalle nostre testate
(Google News e Bing News), chi l'ha data per prima e quali altri articoli leggere: è un
segnale di selezione. Scelte le notizie, `eco.py --leggi "titolo" ...` le scarica tutte
in un colpo, il nostro articolo più gli altri. **Mai riscrivere una notizia da un
articolo solo quando ce ne sono altri**: le prime cinque da almeno tre testate, le altre
da almeno due, la descrizione fonde quello che ciascuna aggiunge, `sources` dice chi hai
letto davvero (vedi *Quanto gira, e più racconti per notizia* in `CLAUDE.md`).

Leggi il file grezzo appena scritto. Scegli le notizie che contano e leggile intere
con `eco.py --leggi` (non con un `curl` alla volta): servono dati e citazioni
verificabili, l'abstract RSS non basta. **Prendi gli
URL dal file grezzo, non ricostruirli dal titolo** — cambiano.

Ogni articolo grezzo ha un `tier` che dice dove va a finire: `ai` e `lab`
alimentano la sezione *AI* (cronaca e LAB), `banco` la sezione *Sul banco*,
e nessuno entra fra le notizie se non tocca Apple direttamente. `taste.py`
propone le cinque caselle del radar, `missed.py` i candidati per *Se te lo fossi perso* — quasi
sempre non se ne prende nessuno, e va bene così.

`threads.py recall --raw` è la memoria: gli articoli del grezzo che raccontano
cose già uscite nei 14 giorni prima, notizie e sezione AI. Per ognuno scegli —
doppione (lo scarti) o seguito (stesso `thread`, e nel testo dici cosa è cambiato).
Il filo vale anche per le voci AI.

Scrivi `data/briefs/YYYY-MM-DD.json` seguendo lo schema di
`data/briefs/2026-08-09.json`. Le **prime cinque notizie** hanno il campo
`approfondimento`, che è un articolo che va **oltre** la notizia, non la ripete: un
titolo suo, il testo, i numeri che contano e le **voci** degli altri — analisti,
testate, dirigenti, i commenti più votati su Reddit, Hacker News, GSMArena — con chi
l'ha detto e il link. Leggi gli articoli interi e le discussioni, verifica ogni link
(vedi *L'approfondimento* in `CLAUDE.md`: esempio completo in
`data/briefs/2026-11-01.json`). Tappe, «chi lo dice» e «cosa aspettarsi» non si
scrivono più.

Per la vista Magazine scrivi anche `citazione` («L'ultima parola»: una frase con nome e
cognome che porta dentro un approfondimento) ed `editoriale` («Il punto»: il commento della
redazione, 2–3 paragrafi che tengono insieme le notizie del giorno, mai un riassunto) — vedi
*La vista Magazine* in `CLAUDE.md`, esempio in `data/briefs/2026-11-02.json`. E per la plancia
del mattino `prossimo` (il lancio o l'evento confermato più vicino, con la data esatta; mai un
rumor) e, prima di `push.py`, `python3 pipeline/borsa.py` — vedi *La plancia del mattino*. Leggi l'edizione del giorno prima e non ripetere
le stesse notizie senza sviluppi nuovi.

```bash
python3 pipeline/verify.py
python3 pipeline/threads.py sync && python3 pipeline/facts.py sync
python3 pipeline/lint.py
python3 pipeline/images.py
python3 pipeline/push.py
```

`verify.py` risale la catena delle fonti di ogni notizia e segnala dove tag e
affidabilità non tornano — tipicamente un `CONFERMATO` che poggia su un'esclusiva
sola. Non cambia i tag: guarda gli avvisi e decidi. Più testate che riprendono la
stessa fonte **non** sono conferme.

`lint.py` esce con 1 se trova errori: sistemali prima di pubblicare. Fra gli
errori ora c'è anche il link già uscito in una vecchia edizione.

**Poi, e solo dopo questo `push.py`**, il visualista (sottoagente `visualista`, con i
`visivi` ancora vuoti nell'edizione pubblicata), e di nuovo lint e pubblicazione:

```bash
python3 pipeline/lint.py && python3 pipeline/push.py      # dopo il visualista
```

**L'audio non si fa più** (1 novembre 2026: Mike non ha mai usato *Ascolta*, e il pulsante
è stato tolto dall'app). Non lanciare `audio.py`: vedi CLAUDE.md, *La voce degli
approfondimenti — sospesa*.

**Non serve toccare l'app**: le edizioni viaggiano sul database, e la copia
Artifact non si aggiorna più da agosto 2026 (vedi `CLAUDE.md`). `build.py` e
`publish_site.py` si lanciano solo se hai modificato `pipeline/template.html`.

Poi il commit della continuità, senza cui domani si riparte da zero — e il
prefisso `claude/` è l'unica cosa che fa scattare il merge su `main`:

```bash
git checkout -b claude/rassegna-$(date +%F)
git add data/ && git commit && git push -u origin claude/rassegna-$(date +%F)
```

TMB sta su `mike3am-dev` e su nessun altro account: se la sessione è
autenticata su GitHub con un'altra identità, non cercare strade alternative —
fermati e dillo a Mike (vedi *Solo `mike3am-dev`* in `CLAUDE.md`).

## Chiusura

Un messaggio breve: data, le tre notizie di apertura, quante notizie
selezionate su quanti articoli letti, eventuali feed muti. Nient'altro.
