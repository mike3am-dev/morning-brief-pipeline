# The Morning Brief — istruzioni operative

Questo progetto produce **una rassegna stampa Apple al giorno** e la pubblica sull'**app
sincronizzata** su GitHub Pages: appunti, salvati e diario seguono l'utente fra Mac e
iPhone. L'indirizzo è in `.app-url`.

La copia Artifact su claude.ai (`.artifact-url`) **non si aggiorna più**: da agosto 2026
Mike legge solo l'app online. `build.py` continua a generare `app/artifact.html`, ma
resta un file locale — non va ripubblicato, e l'indirizzo si tiene solo per storia.

I dati (edizioni, appunti, diario) vivono su Supabase. L'app è un file statico che li legge.

---

## Procedura della corsa giornaliera (ore 07:00)

Esegui **tutti** questi passi, in ordine, da `/Users/mike/Desktop/Tech_news`.

### 1. Raccolta

```bash
python3 pipeline/fetch.py --hours 26
```

Scrive `data/raw/YYYY-MM-DD.json` con gli articoli delle ultime 26 ore (finestra un po' più
larga di 24h per non perdere i pezzi a cavallo). Segnala i feed irraggiungibili o fermi.

Le fonti attive stanno in `data/sources.json`, non più in `fetch.py`: quelle in panchina
non vengono raccolte (vedi *Manutenzione delle fonti*).

Ogni articolo si porta dietro il **girone** della sua fonte (`tier`), e il girone dice in
che parte dell'edizione finirà:

| Girone | Chi c'è | Dove finisce |
|---|---|---|
| `primaria` | Apple Newsroom, Apple Developer | fra le notizie, e chiude i rumor |
| `redazionale` | 9to5Mac, MacRumors, Macitynet, iSpazio, BGR, Tom's, The Verge | fra le notizie |
| `larga` | Ars Technica, TechCrunch | sonde del radar |
| `ai` | OpenAI, Google DeepMind, The Decoder, TechCrunch AI, Ars Technica AI, MIT Technology Review AI | sezione *AI*, strato cronaca |
| `lab` | Simon Willison, One Useful Thing, Latent Space, Anthropic cookbook, Matt Wolfe, AI Explained | sezione *AI*, strato LAB |
| `banco` | DDay.it, HDblog, GSMArena, Android Authority, Andrea Galeazzi, MKBHD | sezione *Sul banco* |

`ai`, `lab` e `banco` pubblicano a strappi: un laboratorio annuncia quando ha finito, un canale
quando il video è montato. Il campanello dei feed muti per loro suona dopo una settimana
(dodici giorni per i video), non dopo un giorno, e `feedcheck.py` non li manda in panchina
per una settimana di silenzio.

```bash
python3 pipeline/social.py --hours 30
```

Raccoglie le discussioni — Reddit, Hacker News e quello che hai incollato a mano in
`data/social/manual.md` — e le divide in due mucchi: **eco** (si parla di una notizia che
abbiamo già) e **nuovo** (se ne parla e da noi non c'è). Il secondo mucchio è il motivo
per cui esiste il passo: a volte lì dentro c'è una cosa che le testate non hanno ancora.

```bash
python3 pipeline/lab.py --hours 30
```

Raccoglie **cosa ci fa la gente** con i modelli: il top del giorno di r/ClaudeAI, r/OpenAI,
r/ChatGPT, r/LocalLLaMA; le Show HN con trazione; le fonti LAB già scaricate da
`fetch.py`; le liste curate «awesome» su GitHub; e i link che hai incollato in
`data/social/manual.md`. Ogni link a X viene aperto con fxtwitter: testo, autore, mi piace,
visualizzazioni, miniatura. È la materia dello strato *LAB* della sezione AI (vedi *La
sezione AI* e *La caccia LAB*).

### 2. Selezione e scrittura

Prima di scrivere, guarda cosa è rimasto aperto dalle edizioni precedenti:

```bash
python3 pipeline/threads.py list && python3 pipeline/claims.py open --due 30 && python3 pipeline/facts.py moving
python3 pipeline/missed.py
```

Le storie in corso, le previsioni che stanno per scadere, i numeri che si sono mossi.
Se una notizia di oggi continua un filo, chiude una previsione o rivede una stima, va
detto: è il motivo per cui esistono. L'ultimo comando propone i candidati per «Se te lo
fossi perso» (vedi *Il ripescaggio*): quasi sempre non se ne prende nessuno, e va bene.

Poi guarda cosa hanno detto i pollici, che è il modo in cui la selezione si tara:

```bash
python3 pipeline/taste.py
```

Stampa i declassamenti attivi e le cinque caselle del radar di oggi (vedi *Il gusto*).

Leggi il file grezzo. Per le 8–12 notizie più importanti scarica l'articolo completo
(`curl -sL` + strip dei tag) per avere dettagli e citazioni verificabili: **non scrivere
descrizioni basandoti solo sull'abstract RSS**.

Poi scrivi `data/briefs/YYYY-MM-DD.json` seguendo esattamente lo schema di
`data/briefs/2026-08-08.json`. Regole editoriali:

- **Perimetro**: Apple al centro. Ammesso il contorno che la tocca da vicino (rivali diretti,
  AI, chip, regolamentazione UE/USA), da tenere però in coda o nel blocco `radar`. Il
  materiale dei gironi `ai` e `banco` **non entra fra le notizie**: ha le sue sezioni, e ci
  finisce solo se tocca Apple direttamente (un accordo Apple-Gemini è una notizia, il
  lancio di un modello no).
- **15–20 notizie** in `news`, ordinate per importanza reale (rank 1 = la più rilevante).
- **Niente duplicati**: se più testate coprono lo stesso fatto, un solo blocco con `sources`
  multiple e gli altri URL in `extra_links`.
- **Top 3**: una riga secca ciascuna, stile headline.
- **Intro**: 3–4 righe sul quadro della giornata, non un riassunto delle notizie.
- **Sintesi**: una riga. **Descrizione**: 3–4 righe con dati concreti, virgolette dove ci sono
  dichiarazioni, contesto utile.
- **Tono**: giornalistico, asciutto, tipo Bloomberg. Niente hype, niente entusiasmo da creator.
- **Non inventare nulla.** Se un dato non è nell'articolo, non va nel brief.

Campo `tag` (determina il colore della pastiglia):
`CONFERMATO` (blu) · `RUMOR` (giallo) · `DATI` (arancio) · `ANALISI` / `OPINIONE` (rosso) ·
`CONTORNO` / `CONTESTO` / `SERVIZIO` (nero).

Campo `reliability`: `alta` | `media` | `bassa`, con `reliability_note` che spiega **perché**.

| Fonte | Affidabilità |
|---|---|
| Documenti ufficiali, atti giudiziari, newsroom Apple | alta |
| Gurman (Bloomberg), Kuo, Ross Young, Counterpoint, IDC | alta |
| Digitimes, ETNews, catena di fornitura anonima | media |
| Leaker Weibo/X senza track record, Reddit, forum | bassa |

Rumor e gossip **si includono**, ma sempre marcati con `tag: "RUMOR"` e una nota sulla fonte.

`radar`: **5 voci** brevi di contorno tech non-Apple, ognuna con `id` (slug stabile, serve
al voto) e `topic` (l'unità su cui il radar impara). Tre vengono da temi già graditi, due
sono **sonde** su temi da provare: la composizione la propone `taste.py` (vedi *Il gusto*).
**L'AI non passa dal radar**: ha la sua sezione (sotto), e i topic marcati `"axis": "ai"`
in `data/radar_topics.json` stanno fuori dalla rotazione.

```json
{"id": "pebble-ritorno", "topic": "hardware-indipendente",
 "title": "…", "note": "…", "link": "…", "source": "Tom's Hardware IT"}
```

`feed_notes`: segnala i feed muti o fermi rilevati al passo 1. **Non compare più
nell'app** — è diagnostica della pipeline, non roba da leggere a colazione: resta
nell'edizione e si guarda dal Mac con `lint.py` e `feedcheck.py`.

#### Il filo — `thread`

La scheda «Fili» **non esiste più** dal 6 settembre 2026 (Mike non la guardava; al suo
posto c'è la scheda AI). Il campo resta, e serve *dentro* la notizia: la pastiglia
«3ª puntata di 5» porta alla puntata precedente. Se la notizia è una puntata di una storia
che va avanti nel tempo, aggiungi lo slug del filo:

```json
"thread": "silicio-mac"
```

I fili esistenti sono in `data/threads.json` (slug, etichetta, nota). Per capire a quale
agganciare le notizie di oggi:

```bash
python3 pipeline/threads.py suggest
```

È solo una proposta per somiglianza: la decisione è editoriale. Un filo nuovo si apre
scrivendo uno slug che non esiste ancora — `threads.py sync` lo registra con
un'etichetta provvisoria, che poi va corretta a mano in `data/threads.json`. Meglio
pochi fili larghi e duraturi che tanti fili da una puntata sola.

#### La previsione — `claim` e `resolves`

Ogni rumor sostiene che succederà qualcosa. Scritta per esteso, prima o poi si può
verificare. **Ogni notizia con `tag: "RUMOR"` deve avere un `claim`**, e possono averlo
anche le altre quando contengono una previsione datata:

```json
"claim": {
  "id": "m6-pro-autunno",
  "text": "In autunno arriva un MacBook Pro con chip M6 Pro",
  "source": "9to5Mac",
  "horizon": "2026-11-30"
}
```

`text` deve essere **falsificabile**: una cosa che a una certa data o è successa o no.
Niente "Apple lavora a…". `horizon` è la data entro cui si saprà. `source` è chi l'ha
detta, non chi l'ha ripresa: se Macitynet riporta Gurman, la fonte è Gurman.

Quando una notizia chiude una previsione aperta, glielo si dice addosso:

```json
"resolves": [
  {"claim": "m6-pro-autunno", "verdict": "smentito",
   "note": "Gurman: M6 Pro e Max cancellati, si passa direttamente all'M7."}
]
```

Verdetti: `confermato` · `parziale` · `smentito`. Una previsione il cui `horizon` passa
senza che nessuno l'abbia chiusa diventa da sola `scaduta`, e nelle pagelle pesa come
un errore. In alternativa al campo scritto a mano:

```bash
python3 pipeline/claims.py resolve m6-pro-autunno smentito --story m7-accelerazione --note "..."
```

Fili e previsioni **vivono dentro le edizioni**, non in una tabella a parte: viaggiano
da soli con `push.py`, senza bisogno di query aggiuntive dall'app.

#### I numeri — `facts`

Quasi tutto in questo mestiere è un numero che qualcuno rivede: un prezzo stimato, una
data d'uscita, una quota di mercato. Preso una volta è un dettaglio, seguito nel tempo
è una deriva — e la deriva è spesso la notizia vera. Quando una notizia porta un numero
che vale la pena seguire, si scrive:

```json
"facts": [
  {"key": "iphone18-pro-prezzo", "value": 1299, "unit": "USD",
   "kind": "stima", "source": "9to5Mac (stime di analisti)"}
]
```

`value` è un numero o una data ISO. `kind` è `dato` (è successo, è misurato, è a
listino) oppure `stima` (qualcuno prevede che sarà così) — **non confonderli mai**:
tutto il senso della serie sta nel distinguere il previsto dall'accaduto.

Etichetta e unità stanno una volta sola in `data/facts.json`; `facts.py sync` le
ricopia dentro le letture. Se una metrica non esiste ancora, la chiave nuova la crea —
poi l'etichetta va corretta a mano nel registro.

Regole: la stessa metrica sempre con la **stessa chiave e la stessa unità**, altrimenti
non è una serie. Un valore va scritto solo se è nell'articolo. Se la fonte dà una
forchetta ("fra 1.299 e 1.399"), si registra l'estremo basso e la forchetta si racconta
nella descrizione.

Nell'app le serie compaiono dentro la notizia e, raggruppate, dentro il filo.

#### Le pagelle — strumento tuo, non dell'app

Il conto di chi ci prende **non compare nella rassegna**: nessuno vuole leggere una
classifica delle fonti a colazione. Serve a te, prima di scrivere, per decidere che
`reliability` mettere:

```bash
python3 pipeline/claims.py score
```

Se una fonte ha un tasso basso su un campione decente, il suo prossimo rumor non è
`alta` per definizione, per quanto blasonata sia — la tabella in cima a questo file è il
punto di partenza, le pagelle la correggono con i fatti. Nell'app resta solo la parte
che è notizia: sulla vecchia notizia compare "Come è andata a finire", su quella nuova
"Chiude una previsione".

#### La sezione social — `social`

Un blocco a parte, dopo il radar, per quello che si dice. Regole strette:

- **Non sono fatti.** Se una cosa vista lì diventa una notizia, va nel blocco `news` con
  la sua fonte vera, `tag: "RUMOR"` e `reliability: "bassa"`, non qui.
- **Si cita la discussione, non si spaccia per verificata.** "Un utente sostiene",
  "il thread più votato", "36 punti e 69 commenti": il segnale è la misura, non il merito.
- **Niente assistenza e niente vetrina.** `social.py` mette già da parte i post di
  supporto e le foto degli acquisti. Un guasto singolo non è mai una notizia; lo stesso
  guasto per giorni sì, e allora si verifica e diventa una notizia vera.
- 3–5 voci, mai di più. `origine: "nuovo"` segna quelle che le testate non hanno dato:
  nell'app prendono la pastiglia rossa.

Su **X** non c'è modo legittimo di raccogliere in automatico: niente RSS, niente API
gratuita, e raschiare le pagine viola le condizioni. Il percorso è manuale e funziona
bene: quando vedi un thread che conta, incolla il link in `data/social/manual.md` con
una riga di contesto, e al giro dopo entra nella raccolta come tutto il resto.

#### La sezione AI — `ai`

Non è «notizie AI»: è **cronaca e LAB insieme**. Cosa fanno i laboratori, e cosa ci fa
la gente. **6–12 voci** al giorno, una decina come misura giusta, e almeno un terzo deve
essere LAB — solo cronaca è metà sezione, e il lint lo dice.

Nell'app le voci AI stanno **solo nella scheda AI**, non nell'edizione: sarebbero un doppione.
E la scheda mostra **una sola edizione per volta, come le notizie Apple nella home**: segue
il giorno che stai leggendo, e i giorni prima si raggiungono dall'archivio. Fino all'11
settembre 2026 impilava tutto l'archivio di seguito, così sotto le voci di oggi
ricomparivano quelle di ieri: una scheda che si allungava da sola invece di svuotarsi ogni
mattina.

La scheda ha **due blocchi con due forme**. «Cosa è successo» (la cronaca) è un
dispaccio: righe fitte, laboratorio e titolo, con una **miniatura quadrata a destra** come
in un lettore di feed. Quella foto non racconta il fatto — spesso è l'illustrazione del
pezzo — e non deve pretendere di farlo: serve a dare un appiglio all'occhio in una colonna
di soli titoli. Se manca, la riga sta in piedi lo stesso. «Cosa puoi provare» (il LAB) è
una galleria: **la foto è il risultato** — la città in 3D, la casa ricostruita da una foto,
il render del pellicano — e sotto c'è la riga «prova». È la foto che fa dire «ah, si può
fare questo?», che è esattamente quello che funziona su X.

Quindi **ogni voce LAB ha bisogno di un'immagine che mostri il risultato**: `images.py` la
ricava dal link (og:image, miniatura YouTube, anteprima ufficiale del post Reddit, media del post su X via
fxtwitter). Un link il cui og:image è un'illustrazione generica o un logo è un
motivo per preferirne un altro sullo stesso fatto — il post su X con il video, la pagina
del progetto, il thread Reddit con l'immagine. Il lint avvisa quando una voce LAB resta
senza foto. Sulla cronaca `images.py` prende la stessa og:image ma la ritaglia **quadrata a
240px** (~6 KB): lì il criterio è più largo, perché quella miniatura non deve dimostrare
niente, e una voce senza foto non è un problema — il blog di Simon Willison non ne ha, e va
benissimo così.

```json
{"id": "gpt-6-astra", "lab": "openai", "kind": "modello",
 "title": "…", "sintesi": "Una frase intera, con un dato: è la riga che si legge a voce chiusa",
 "note": "3 righe: cos'è, che numeri porta",
 "apple": "Una riga: cosa c'entra con Apple, o «niente, per ora»",
 "link": "…", "source": "OpenAI"}

{"id": "claude-contabilita", "lab": "anthropic", "kind": "uso",
 "title": "…", "note": "3 righe: cosa ha fatto, come, cosa ne è uscito",
 "prova": "Come lo provi tu, in una riga: il prompt, la funzione, il primo passo",
 "link": "…", "source": "Reddit r/ClaudeAI"}
```

`lab` ∈ `anthropic` · `openai` · `google` · `meta` · `apple` · `altri`.
`kind` decide lo strato: **cronaca** = `modello` · `funzione` · `affari` · `regole` ·
`ricerca`; `modello` è **solo per i modelli di punta**, quelli che cambiano il fronte — un
modello per la musica, il meteo o la voce è `funzione` o `ricerca`; **LAB** = `uso` (qualcuno risolve una cosa vera) · `demo` (una cosa
costruita che puoi provare) · `trucco` (un prompt, una funzione, un modo d'uso) ·
`sapevi` («sai che puoi…»: c'è già e nessuno la usa).

**`sintesi` è la riga che si legge a voce chiusa** sulle notizie: una frase intera che
sta in piedi da sola, con il dato che conta — mai un troncamento con i puntini, che il
lint segnala. **`prova` è la sezione** sul LAB: ogni voce LAB deve dire come lo provi tu,
in una riga — nella galleria è la riga gialla sotto il titolo, sempre visibile.

Nella scheda AI dell'app ci sono due schede, **Notizie** e **LAB**: Mike tocca una delle
due e scorre. Niente filtri per laboratorio: i pollici decidono chi pesa di più.
Senza è una curiosità, con quella è lo sblocco; il lint la respinge come errore. Sulla
cronaca la riga `apple` è attesa (anche «niente, per ora»): è il motivo per cui l'AI sta
in una rassegna Apple.

**Il fronte.** L'app mostra in testa alla scheda AI l'ultimo modello di ogni laboratorio:
lo ricava da sola dalle voci `kind: "modello"` dell'archivio, la più recente per `lab`.
Quindi **ogni modello nuovo va scritto come voce `modello` con il nome del modello nel
titolo**, altrimenti il fronte resta indietro. Niente registro a parte.

Da dove viene: la cronaca dal girone `ai` del grezzo; il LAB da `lab.py`
(Reddit, Show HN, le fonti `lab`, i tuoi appunti da X in `manual.md`). Quello che cattura
Mike su X è esattamente questo: «GPT-6 Astra mi ha ricreato Sydney in 3D», «una casa in
3D da una foto», «un sito di anatomia in 2.234 pezzi» — cose fatte, con un'immagine.
Ogni post così incollato in `manual.md` è una voce `demo` o `uso` già pronta. Un thread su X
che ti ha colpito è già una voce `uso`: incolla il link con tre parole, il resto lo fa la
corsa del mattino.

**La caccia LAB — come si trovano queste cose.** Il 6 settembre 2026 Mike ha portato
cinque post da X che sono il modello esatto della sezione: la Notte stellata di Van Gogh
resa mondo 3D percorribile, un paesaggio urbano modellato in Blender da una sola foto, un
gioco di pigmenti per indovinare la tinta, un atlante 3D dell'anatomia dentale, Pong neon
su Apple TV da un prompt di tre righe. Hanno tutti la stessa forma, ed è quella da cercare:

- **prima persona e verbo fatto**: «ho usato Astra per…», «I built…», «gli ho passato una
  foto e…». Non «Astra può», non un articolo che ne parla: la persona che l'ha fatto.
- **un risultato che si vede**: video o immagine del prodotto finito, non del prompt.
- **il come**: il prompt, il setup (Codex + Blender MCP), quanto è costato — è la riga
  `prova` già scritta.
- **il segnale**: mi piace e visualizzazioni. Un post da 300.000 visualizzazioni è già
  passato al vaglio di molta gente.

Dove si cerca, in ordine di resa:

1. **Le liste curate** su GitHub (`AWESOME` in `lab.py`): a ogni lancio grosso qualcuno
   apre un repository «awesome-<modello>» con i post originali e i nomi degli autori.
   `lab.py` le legge, apre ogni post con fxtwitter e li ordina per visualizzazioni. È il
   modo onesto di arrivare a X senza raschiare X: la selezione l'ha già fatta qualcuno.
2. **Reddit e Show HN**, che `lab.py` già raccoglie: lì i post di X vengono ripostati.
3. **La ricerca web**, che la routine ha: `"GPT-6 Astra" "I used"`, `"I built" site:x.com
   Astra`, il nome del modello più *Blender*, *3D*, *game*, *app*. I risultati su x.com si
   leggono con `common.xpost`, che dà testo, autore, numeri e miniatura.
4. **`data/social/manual.md`**: quello che Mike ha visto lui. Ha la precedenza su tutto:
   se c'è un link lì, entra, con la foto del post.

Un post su X **si cita con il suo indirizzo `x.com/<autore>/status/<id>`**, mai con il
profilo: senza l'id non c'è foto e non c'è verifica. Se l'indirizzo non si trova, la voce
non si scrive.

#### La sezione da lavoro — `banco`

Mike sta dietro il banco di un Apple Store. Metà delle domande che riceve non riguardano
Apple: riguardano quello che il cliente ha visto ieri sera in un video. Il pieghevole
Samsung, il Pixel, la cover che costa quanto il telefono. Questa sezione è materiale da
lavoro, non rassegna: **3–5 voci** fra recensioni, video e confronti della concorrenza.

```json
{"id": "fold8-mkbhd", "kind": "video", "topic": "pieghevoli",
 "title": "Galaxy Z Fold 8 Review: Honeymoon's Over",
 "note": "Cosa dice il pezzo, due righe.",
 "perche": "È il video che ha visto il cliente che entra a chiedere del pieghevole.",
 "link": "…", "source": "MKBHD"}
```

`kind` è `recensione` · `video` · `confronto` · `curiosità` · `guida`, e determina il
colore della pastiglia. **`perche` è la sezione**: senza quella riga è una recensione
qualsiasi, e il lint la respinge come errore. Deve dire perché quella cosa serve *al
banco* — la domanda che arriverà, il confronto che ti chiederanno, il dettaglio che non
sai. Non "è interessante".

Il materiale arriva dal girone `banco` del file grezzo (`"tier": "banco"`): DDay.it,
HDblog, GSMArena, Android Authority e i due canali YouTube, Andrea Galeazzi e MKBHD.
I video si riconoscono dal link `youtube.com/watch`.

#### Il ripescaggio — `recap`

«Se te lo fossi perso»: **0–3 voci**, e lo zero è un risultato onesto. La rassegna guarda
26 ore e il perimetro Apple, ed è il suo buco: una cosa che esplode di martedì fuori
perimetro non entra mai più, perché ogni giorno guarda solo il proprio. Questa sezione
guarda indietro da 3 a 14 giorni e ripesca quello che ha girato e che noi non abbiamo dato.

```bash
python3 pipeline/missed.py
```

Incrocia due segnali: la **copertura** (quante testate diverse fra le nostre hanno
raccontato lo stesso fatto) e la **trazione** (punti e commenti su Hacker News, posizione
nel top della settimana di Reddit). Toglie tutto quello che è già passato in edizione — è
il senso del nome — e stampa i candidati ordinati, marcati `COPERTURA`, `SOLO ONLINE` o
`COMMENTO`. La scelta resta editoriale: escono candidati, non voci.

```json
{"id": "anthropic-open-weights", "when": "2026-07-27",
 "title": "…", "note": "3-4 righe: cos'era e perché ne hanno parlato tutti",
 "signal": "1.180 punti e 1.747 commenti su Hacker News",
 "link": "…", "source": "Anthropic"}
```

`when` è la data d'origine, non quella di oggi: l'app la mostra come «2 settimane fa».
Sotto i due giorni non è un ripescaggio, è la rassegna di ieri, e il lint dà errore. Stessa
cosa se la voce è già uscita in una vecchia edizione: quello svuota la sezione del suo
senso, e il collaudo la blocca.

`signal` è obbligatorio ed è la misura, non il giudizio: quanti punti, quante testate,
quale posizione. È il motivo per cui la voce sta lì.

#### Controllo prima di pubblicare

```bash
python3 pipeline/threads.py sync && python3 pipeline/facts.py sync
python3 pipeline/lint.py
```

I due `sync` registrano fili e metriche nuove e ne ricopiano le etichette dentro le
edizioni — **vanno lanciati sempre**, altrimenti l'app mostra lo slug al posto del nome.

`lint.py` collauda l'edizione contro le regole di questo file: campi obbligatori, rank
senza buchi, descrizioni senza un solo dato concreto, citazioni senza attribuzione,
doppioni, tono da creator, rumor senza previsione. Distingue **errori** (l'edizione è
rotta, si sistema prima di pubblicare) da **avvisi** (fuori misura, spesso voluto, ma
da guardare), ed esce con 1 se trova errori. Con `--links` controlla anche che ogni
indirizzo apra davvero.

Per i controlli più fini, che il lint non ripete:

```bash
python3 pipeline/threads.py check && python3 pipeline/claims.py check && python3 pipeline/facts.py check
```

#### Il gusto — i pollici, `taste.py`

Ogni notizia e ogni voce di radar, banco e ripescaggio hanno due pollici nell'app. Il voto
**non dice "mi piace l'argomento"**, dice *questa voce meritava di stare in rassegna*: è il
segnale con cui si tara la selezione, non il perimetro.

```bash
python3 pipeline/taste.py            # il digest, prima di scrivere
python3 pipeline/taste.py report     # il briefing, ogni 14 giorni
```

I voti stanno nella colonna `vote` di `brief_marks` (migrazione in
`supabase/migrazioni.sql`, da lanciare una volta sola). `taste.py` li rilegge, li incrocia
con l'archivio locale e ne ricava i pattern lungo sette assi: **categoria**, **tag**,
**fonte**, **banco** (il genere: recensione, video, confronto…), **lab** e **ai** (il
laboratorio e il genere delle voci AI) e **sezione**.

L'asse `sezione` è quello che tiene onesto l'impianto: se «Se te lo fossi perso» prende tre
pollici giù di fila, la sezione non serve e va tolta, non difesa. Vale per tutte e tre le
sezioni non-notizia — radar, banco, ripescaggio.

Tre regole non negoziabili:

- **Si declassa, non si cancella.** Un pattern confermato manda la notizia in coda o nel
  radar. Non la fa sparire.
- **Il nucleo Apple non si tocca.** I voti agiscono su contorno, ordine e radar. Se Apple
  prende una multa UE quella notizia entra, quanti pollici giù ci siano stati. Nella
  sezione AI i pollici scelgono quale laboratorio e quale genere pesano di più, non se
  la sezione esiste.
- **Il silenzio non è un no.** Contano solo i voti espressi, e servono 3 voti concordi
  sullo stesso asse (75% di concordia) prima di dare retta a un pattern.

**Il radar impara per topic.** Ogni topic ha uno stato in `data/radar_topics.json`:

| Stato | Come ci si arriva | Cosa comporta |
|---|---|---|
| `nuovo` | mai mostrato | candidato per una sonda |
| `in prova` | mostrato, nessun verdetto | può tornare |
| `confermato` | +2 di scarto fra su e giù | casella fissa nella rotazione |
| `in pausa` | 1 pollice giù, o 3 uscite mute | torna fra 6 settimane |
| `archiviato` | 2 pollici giù | non torna |

**La pausa si sconta una volta sola.** Un pollice giù resta scritto per sempre, quindi
finita la pausa quel voto non rimanda più il topic in panchina: rientra `in prova` e ha
una seconda occasione vera. A bocciarlo è il *secondo* pollice giù. Lo stesso per le
uscite mute, che si ricontano da zero al rientro (`pausa_finita` e `seen_a_fine_pausa` nel
file tengono il segno). Senza questa regola il topic non tornava mai: ogni corsa rivedeva
lo stesso pollice giù e rimandava la scadenza di altre sei settimane.

Un pollice su vale un **seguito il giorno dopo**: il digest lo segna come "da riprendere
per forza". I topic candidati si aggiungono a mano nel file, con stato `nuovo`.

**Il briefing ogni 14 giorni** non è un rapporto da archiviare, è una conversazione: si
mostra cosa sta sparendo e perché, con due o tre titoli d'esempio di quello che è stato
declassato, lo stato dei topic e i voti che si contraddicono. Poi si chiede a Mike se
quello che è uscito gli manca. Il digest avvisa da solo quando è il momento.

### 3. Immagini

```bash
python3 pipeline/images.py
```

Legge l'og:image di ogni articolo fra i primi otto e di ogni voce AI, e la incorpora
nell'edizione come data URI. Tre formati: 16:9 da 480px per le notizie e per il LAB, 880px
per la notizia di apertura, e **quadrata da 240px per la cronaca AI** (la miniatura di
fianco al titolo). Incorporare invece di linkare serve perché le immagini funzionino
offline e perché la copia su Artifact le mostri — la sua CSP blocca ogni richiesta esterna.

480px perché sul telefono la foto occupa tutta la colonna (~341 punti): a 300px si vedeva
la sgranatura. Se un giorno cambi di nuovo il formato, `--refresh` riscarica anche le
immagini già presenti e `--all` lavora su tutto l'archivio; una fonte che non risponde
lascia al suo posto l'immagine vecchia invece di cancellarla.

```bash
python3 pipeline/images.py --all --refresh && python3 pipeline/push.py --all
```

Costo: circa 400 KB per edizione — otto notizie, la foto grande di apertura, le schede LAB
e le miniature della cronaca AI. Fa un centinaio di MB l'anno, quindi `--prune` non è un
vezzo: toglie le immagini (notizie e AI) alle edizioni oltre i giorni indicati. Ogni tanto
alleggerisci l'archivio, poi ricaricalo:

```bash
python3 pipeline/images.py --prune 60 && python3 pipeline/push.py --all
```

### 4. Pubblicazione sull'app sincronizzata

```bash
python3 pipeline/push.py
```

Carica l'edizione di oggi nella tabella `brief_editions` di Supabase. L'app la vede al successivo
avvio o cambio di scheda: **il file dell'app non va ritoccato**.

### 5. Il commit della continuità

L'edizione è su Supabase, ma i file che tengono la memoria fra una corsa e l'altra — fili
aperti, previsioni, stato del radar, pollici — vivono in `data/`. Senza commit, la corsa di
domani riparte da zero.

```bash
git checkout -b claude/rassegna-$(date +%F)
git add data/ && git commit && git push -u origin claude/rassegna-$(date +%F)
```

**Il prefisso `claude/` non è un vezzo: è l'unica cosa che fa scattare il merge.** Il
workflow `.github/workflows/merge-claude-branches.yml` ascolta solo `claude/**` e unisce da
sé su `main`. Un branch chiamato `rassegna-2026-09-08` viene spinto, sembra andato a buon
fine, e resta lì per sempre: è successo l'8 e il 9 settembre 2026, e quelle due edizioni
sono rimaste fuori da `main` finché non le si è unite a mano. Niente pull request: ci pensa
il workflow.

### 6. Chiusura

Un messaggio breve: data dell'edizione, le tre notizie di apertura, quante notizie selezionate
su quanti articoli letti, eventuali feed muti. Se una previsione è stata chiusa, una riga anche
su quella. Nient'altro.

---

## Manutenzione delle fonti (una volta a settimana, il lunedì)

```bash
python3 pipeline/feedcheck.py
```

Misura ogni feed su due assi che a occhio non si vedono: quanto arriva **primo** e quanto
**insegue** (stessa notizia, ore dopo qualcun altro), e quanti dei suoi articoli finiscono
davvero in edizione. Un feed può essere vivissimo e inutile — se ripubblica in ritardo
quello che hanno già dato gli altri è eco, non una fonte, e va tolto: costa lettura e non
aggiunge niente.

Il verdetto in fondo (`TIENI` · `SORVEGLIA` · `PANCHINA`) è una proposta, mai
un'esecuzione, e non si decide mai sotto le due settimane di dati.

### La panchina

**Una fonte non si cancella.** Se smette di servire va in panchina: esce dalla raccolta
quotidiana ma resta scritta in `data/sources.json` con la sua data e il suo motivo, e
ogni sette giorni si riprova.

```bash
python3 pipeline/feedcheck.py --bench "Wired Italia" --reason "fermo da 39 giorni"
python3 pipeline/feedcheck.py --retest      # riprova quelle scadute
python3 pipeline/feedcheck.py --restore "Wired Italia"
```

`--retest` scarica il feed e guarda tre cose: se risponde, se ha ripreso a pubblicare, e
se porta roba che le nostre fonti attive non hanno già dato. Se ne trova almeno un paio,
propone di rimetterla in campo. Altrimenti aspetta un'altra settimana. Un giornale che
cambia direzione, un feed spostato, un sito rinato: succede, e la panchina è quello che
permette di accorgersene senza tenerselo in casa nel frattempo.

Il rapporto normale mostra in fondo chi è in panchina e a chi tocca la riprova.

Per il verso opposto — cosa non stiamo leggendo:

```bash
python3 pipeline/feedcheck.py --discover
```

Prova una ventina di fonti candidate e per ognuna misura quanto è nel perimetro Apple e
quanta roba porta che le nostre non hanno già dato. **Attenzione al punteggio**: premia il
volume, quindi una fonte primaria che pubblica due volte a settimana finisce in fondo pur
valendo più di un sito che ne sforna venti al giorno. Guarda `quota` insieme a `punti`.

Le fonti con `QUIET` in `fetch.py` (le due ufficiali Apple) tacciono per settimane senza
che sia un problema: il campanello suona solo dopo tre.

---

## Quando cambia l'app (non ogni giorno)

Solo se hai modificato `pipeline/template.html`:

```bash
python3 pipeline/build.py && python3 pipeline/publish_site.py
```

`publish_site.py` copia il file in `site/index.html` e lo carica da solo su GitHub
(repository `mike3am-dev/morning-brief`, API Contents). Per autenticarsi prova prima
`GITHUB_TOKEN` in `.env.local`, e se manca usa il login della CLI `gh`, che su questo Mac
è quello di `mike3am-dev` (scope `repo` e `workflow`): oggi è la strada in uso, e non c'è
nessun token da tenere aggiornato.

**Tutto vive sull'account `mike3am-dev`** dal 6 settembre 2026: prima stava su
`c4gv4kf4d7-dev`, un account condiviso, e il Mac non aveva diritto di scrittura sulla
pipeline. I due repository sono `morning-brief-pipeline` (questa cartella: ci gira la
routine delle 7:00) e `morning-brief` (un solo file, `index.html`: **è l'app**, servita da
GitHub Pages — non è un doppione e non si cancella).

**Solo `mike3am-dev`, nessun altro account.** The Morning Brief non tocca e non passa da
altre identità GitHub: né account condivisi, né organizzazioni, né connettori di terzi.
Prima di scrivere qualsiasi cosa su GitHub, una corsa in cloud verifica con chi è
autenticata:

```bash
curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

Se il login che torna non è `mike3am-dev`, **non si spinge niente da nessuna parte**: non si
cerca un'altra strada, non si apre una pull request da un altro account, non si crea un
repository di appoggio. Si ferma, si dice a Mike qual è l'identità sbagliata che ha
risposto, e l'edizione del giorno resta comunque pubblicata su Supabase — quello è il
canale che conta per l'app. Il 12 settembre 2026 la sessione in cloud si è trovata il
connettore GitHub autenticato come `8BitStudios-dev`, senza diritto di scrittura qui: il
commit della continuità è stato consegnato a mano e applicato dal Mac.

Lo script salta il caricamento se online c'è già lo stesso file, e distingue gli errori:
401 token scaduto, 403 permessi mancanti. In ogni caso il ripiego è il caricamento dal
browser (Add file → Upload files). `--local` copia in `site/` senza toccare la rete.

Le edizioni quotidiane **non** richiedono niente di tutto questo: viaggiano sul database.

### Perché non Supabase

Supabase serve HTML come `text/plain` alle navigazioni da browser, su `*.supabase.co` —
misura anti-phishing, valida sia per Storage sia per il gateway delle Edge Functions, e non
aggirabile. Attenzione al modo in cui si verifica: **curl riceve `text/html`, un browser no**.
Un controllo fatto solo con curl dà un falso positivo. La Edge Function `app` e il bucket
`brief-app` sono resti di quel tentativo: inutilizzati, si possono eliminare.

---

## Struttura

```
pipeline/fetch.py        raccolta RSS, filtro temporale, dedup per URL
pipeline/sources.py      il registro delle fonti: attive, in panchina, riprove
pipeline/social.py       Reddit + Hacker News + appunti a mano  ->  data/social/
pipeline/common.py       lettura/scrittura archivio, somiglianza fra titoli, tabelle
pipeline/threads.py      i fili delle storie: registro, sync, proposte, cronologia
pipeline/claims.py       le previsioni: aperte, verdetti, pagelle per fonte
pipeline/facts.py        i numeri seguiti nel tempo: serie, derive, registro
pipeline/taste.py        i pollici  ->  declassamenti + caselle del radar + briefing
pipeline/missed.py       copertura + trazione online  ->  candidati per il ripescaggio
pipeline/lab.py          Reddit AI + Show HN + fonti LAB + appunti  ->  data/lab/
pipeline/lint.py         il collaudo dell'edizione contro le regole di questo file
pipeline/feedcheck.py    salute delle fonti + ricerca di candidate nuove
pipeline/images.py       og:image  ->  data URI incorporati nell'edizione
pipeline/icon.py         disegna app/icon.png (monogramma + pallini). --check la prova piccola
pipeline/publish_site.py app  ->  site/index.html  ->  GitHub Pages (API Contents, GITHUB_TOKEN)
pipeline/build.py        archivio  →  app/index.html (cloud). Genera anche app/artifact.html,
                         che però non si pubblica più: resta un file locale.
pipeline/push.py         edizioni  →  tabella brief_editions su Supabase
pipeline/upload_app.py   app/index.html  →  Supabase Storage
pipeline/template.html   la web app: stile, markup, accesso, sincronizzazione.
                         I segnaposto /*__MODE__*/ /*__CONFIG__*/ /*__BRIEFS__*/ /*__APP_URL__*/
                         vengono sostituiti da build.py.
supabase/functions/app/  la Edge Function che serve la pagina come HTML
supabase/config.toml     configurazione CLI per la distribuzione della funzione
supabase/migrazioni.sql  i ritocchi allo schema, da lanciare a mano nell'editor SQL.
                         Idempotenti: rilanciarle non fa danno.
supabase/schema.sql      tabelle e regole di sicurezza (già eseguito una volta).
                         Tre tabelle prefissate: brief_editions, brief_marks, brief_diary.
                         Convivono in un progetto Supabase usato anche da altre app.
supabase/config.json     url + anon key. Pubblici, ma non versionarli per abitudine.
.env.local               SUPABASE_SERVICE_KEY + GITHUB_TOKEN. Segreti, restano solo sul Mac.
data/raw/                scarichi grezzi per data
data/briefs/             le edizioni scritte — l'archivio locale, fonte di verità per push.py
data/threads.json        il registro dei fili: slug, etichetta, nota, apertura, chiusura
data/facts.json          il registro delle metriche: chiave, etichetta, unità, nota
data/sources.json        le fonti: stato, da quando, perché, ultima riprova
data/taste.json          l'ultimo scarico dei voti + le regole ricavate + data del briefing
data/radar_topics.json   i temi del radar e il loro stato (nuovo, in prova, confermato…)
data/social/             le discussioni raccolte per data
data/missed/             i candidati al ripescaggio, per data
data/lab/                cosa ci fa la gente con i modelli, per data
data/social/manual.md    dove incolli a mano i link da X e affini
app/                     output generato, non modificare a mano
```

## Come funziona la sincronizzazione

Local-first. Ogni modifica va prima in `localStorage`, marcata `dirty`, e viene spinta su
Supabase entro un paio di secondi. In lettura l'app chiede solo le righe con
`updated_at > lastPull`. In conflitto vince la scrittura più recente, con una sola eccezione:
una modifica locale non ancora spinta non viene mai sovrascritta da una lettura.

Offline l'app funziona lo stesso — legge dalla cache e accumula le modifiche, che partono
appena torna la rete. Il pallino nella testata dice lo stato: verde sincronizzato, blu in corso,
grigio offline, rosso errore.

## Note di stile

Riferimento dichiarato alla sigla di *The Morning Show* (Elastic, art direction Hazel Baird):
fondo osso, campiture piatte, campo di pallini, condensato pesante, quattro colori saturi con
ruolo semantico. Il marchio in testata è tutto giallo. Se tocchi lo stile, resta dentro
questo sistema.

## Fonti monitorate

**Primarie** (parlano di rado, ma è la parola di Apple e chiude i rumor invece di aprirne):
Apple Newsroom · Apple Developer

**Redazionali**: 9to5Mac · MacRumors · BGR · Macitynet · iSpazio · Tom's Hardware IT ·
The Verge

**Larghe** (non parlano di Apple: sono la materia prima delle sonde del radar):
Ars Technica · TechCrunch

**AI** (i laboratori quando parlano in prima persona, più chi li segue di mestiere):
OpenAI · Google DeepMind · The Decoder · TechCrunch AI · Ars Technica AI ·
MIT Technology Review AI

> **Anthropic non ha un feed.** Il sito non espone RSS a nessun indirizzo noto: provati
> `news/rss.xml`, `rss.xml`, `feed.xml`, `index.xml`, tutti 404 al 9 agosto 2026. Passa
> dalle sei fonti qui sopra, che la coprono tutte, e dai suoi annunci quando finiscono su
> Hacker News — che è come li ha trovati `missed.py` la prima volta. Se un giorno aprono
> un feed, va aggiunto al `SEED` con `tier: "ai"`.

**LAB** (cosa ci fa la gente con i modelli, per lo strato LAB della sezione AI):
Simon Willison · One Useful Thing (Ethan Mollick) · Latent Space · Anthropic cookbook (i
commit su GitHub) · Matt Wolfe (YouTube) · AI Explained (YouTube). Provate e scartate il
6 settembre 2026 perché senza feed: Ben's Bites, The Neuron, Every.to.

**Banco** (la concorrenza e chi la prova, per la sezione *Sul banco*): DDay.it · HDblog ·
GSMArena · Android Authority · Andrea Galeazzi (YouTube) · MKBHD (YouTube)

I due canali YouTube passano dal feed Atom pubblico, che non richiede chiave:
`youtube.com/feeds/videos.xml?channel_id=UC…`. L'id del canale si ricava dalla pagina del
canale cercando `channelId` nell'HTML — l'handle `@nome` da solo non basta.

**In panchina**: Wired Italia, dal 9 agosto 2026 — feed fermo al 1° luglio. Si riprova
da sola ogni sette giorni con `--retest`.

L'elenco che comanda è `data/sources.json`; `SEED` in `pipeline/sources.py` serve solo a
ricordare gli indirizzi e a far entrare le fonti nuove. Il candidato italiano più pulito
emerso da `--discover` è Il Post — Tecnologia: poco volume, ma verificato.
