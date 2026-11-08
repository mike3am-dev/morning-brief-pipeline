# The Morning Brief — istruzioni operative

Questo progetto produce **una rassegna stampa Apple al giorno** e la pubblica sull'**app
sincronizzata** su GitHub Pages: appunti, salvati e diario seguono l'utente fra Mac e
iPhone. L'indirizzo è in `.app-url`.

La copia Artifact su claude.ai (`.artifact-url`) **non si aggiorna più**: da agosto 2026
Mike legge solo l'app online. `build.py` continua a generare `app/artifact.html`, ma
resta un file locale — non va ripubblicato, e l'indirizzo si tiene solo per storia.

I dati (edizioni, appunti, diario) vivono su Supabase. L'app è un file statico che li legge.

---

## Procedura della corsa giornaliera (ore 6:30)

Esegui **tutti** questi passi, in ordine, da `/Users/mike/Desktop/Tech_news`.

La routine è `trig_01J7324UefKViTdkDcvJeYEk` su claude.ai. Il suo orario è scritto in
**UTC** (`30 4 * * *` = 6:30 con l'ora legale): **il 25 ottobre 2026, quando torna l'ora
solare, va spostato a `30 5 * * *`**, e a fine marzo di nuovo a `30 4`. Alla fine di ogni
corsa `pipeline/costo.py` dice quanto è durata e quanti token ha consumato, e lo registra
in `data/corse.json` (`costo.py --storia` per l'andamento; `costo.py --fasi` scompone la
corsa di oggi passo per passo, con i buchi di tempo fra un comando e il successivo e la
durata di ogni sottoagente — usalo se una corsa va oltre il tetto sotto per capire dove).

**Il tetto è 30 minuti, dalla raccolta alla pubblicazione su Supabase.** Il 2 ottobre 2026
la corsa ne ha presi 98: 23 erano il visualista (risolto, vedi *Il visualista* più sotto,
che ora viene dopo `push.py` e non blocca più la pubblicazione), il resto si è perso fra
letture di articoli una alla volta e una prima stesura fuori misura rifatta dopo il lint.
Quindi: scarica tutti gli articoli da leggere in un solo comando (non uno alla volta), e
scrivi `sintesi`, `descrizione` e l'`approfondimento` già dentro le misure di `lint.py` —
il lint è il collaudo finale, non il primo editor. Se qualcosa non torna, pubblica quello
che c'è (anche senza audio o senza una visualizzazione) invece di far slittare l'uscita:
un'edizione in orario e incompleta su un dettaglio batte un'edizione completa e tardiva.

**Il 7 ottobre 2026** la corsa ha preso 41 minuti e riletto 31,5 milioni di token dalla
cache. La raccolta degli articoli era già in un comando solo, ma tutta la fase di ricerca
— scaricare e leggere ~20 articoli, interrogare `lab.py` e `missed.py`, controllare a mano
i doppioni col grezzo — è girata dentro la sessione principale invece che in un
sottoagente: ogni comando successivo si è portato dietro tutta la conversazione
precedente, e la conversazione cresceva a ogni lettura. Quindi, oltre a quanto sopra:

- **Delega raccolta e lettura a un sottoagente** (strumento Agent, tipo `Explore` o
  `general-purpose`): scarica gli articoli, legge i grezzi, torna con un riassunto delle
  notizie candidate e i dati verificati. La sessione che scrive l'edizione resta piccola
  per tutta la corsa, invece di accumulare decine di estratti d'articolo.
- **Mai stampare un file con immagini o audio incorporati senza filtrare i campi prima**:
  un `grep` o un `cat` su `data/briefs/*.json` rischia di riversare un base64 intero nella
  conversazione, dove resta e si ripaga a ogni passo successivo. Sempre python con
  un elenco esplicito dei campi da mostrare (mai `image`, `audio`).
- **Estrai il testo di tutti gli articoli scaricati con un solo script**, non uno alla
  volta: un ciclo che apre tutti gli HTML scaricati e stampa solo gli estratti utili.
- **Fidati dei verdetti di `threads.py recall` e di `verify.py`**: non ripetere a mano un
  controllo doppioni che lo script ha già fatto (vedi *«STESSO LINK» non sempre vuol dire
  lo stesso indirizzo* più sotto).
- **Non lanciare `audio.py` mentre il visualista non ha ancora salvato**: leggono e
  riscrivono la stessa edizione, e chi finisce dopo sovrascrive chi ha finito prima senza
  i suoi cambiamenti (successo il 7 ottobre: il visualista aveva scritto due `visivi`,
  `audio.py` li ha cancellati riscrivendo il file da una copia precedente). Aspetta la
  notifica di completamento di un passo prima di lanciare il successivo che tocca lo
  stesso file, invece di lanciarli in sequenza stretta.

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
| `primaria` | Apple Newsroom, Apple Developer, Apple Developer Releases | fra le notizie, e chiude i rumor; i rilasci portano `novita` |
| `redazionale` | 9to5Mac, MacRumors, Macitynet, iSpazio, BGR, Tom's, The Verge, AppleInsider, iClarified | fra le notizie |
| `larga` | Ars Technica, TechCrunch, Engadget, Gizmodo, TechRadar, Ars Technica Gadget | sonde del radar (l'hardware di consumo: il Kindle è il concorrente dell'iPad mini) |
| `ai` | OpenAI, Google DeepMind, Google AI Blog, Apple Machine Learning, NVIDIA, The Decoder, TechCrunch AI, Ars Technica AI, MIT Technology Review AI, The Verge AI, Wired AI, ZDNet AI, MIT News AI, Interconnects, Import AI | sezione *AI*, strato cronaca |
| `lab` | Simon Willison, One Useful Thing, Latent Space, Anthropic cookbook, Matt Wolfe, AI Explained | sezione *AI*, strato LAB |
| `banco` | DDay.it, HDblog, GSMArena, Android Authority, Andrea Galeazzi, MKBHD | sezione *Sul banco* |
| `games` | venti testate di giochi, PlayStation in testa, più due ricerche Google News per GTA VI | scheda *Games* (la compone `rubriche.py`; GTA VI l'agente `gta`) |
| `spazio` | venticinque fonti di scienza, da Nature e Science a Il Post, più tre Google News | scheda *Scienza* (`rubriche.py`; la chiave resta `spazio`) |

Le fonti di AI, Games e Scienza, con il perché di ognuna e quelle scartate, stanno in
`docs/schede/fonti-2026-11-05.md`. **La scheda Tech non c'è più** (5 novembre 2026, Mike:
«niente tech»): il girone `tech` è vuoto, le sue testate generaliste sono passate a `larga` e
le altre in panchina.

Il girone `ai` comprende anche **The Robot Report** e **IEEE Spectrum Robotica**: i robot stanno
nella scheda AI (lab `robot`), non in una scheda a parte.

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

#### Le schede GAMES e SCIENZA, e la sezione GTA VI

Dal 5 novembre 2026 la barra è **APPLE · AI · GAMES · SCIENZA** (Mike: «niente tech»; Spazio
è diventata Scienza lo stesso giorno: «ci mettiamo dentro tutto»). Il piano è
`docs/schede/proposta-2026-11-05.md`, le fonti `docs/schede/fonti-2026-11-05.md`. Le due schede
**non le scrive Claude**: le sceglie uno script, che parte in background mentre tu scrivi
l'edizione, e subito dopo lo stesso processo prepara il dossier di GTA VI.

```bash
nohup sh -c "python3 pipeline/rubriche.py; python3 pipeline/schede.py > /tmp/schede.log 2>&1; python3 pipeline/gta.py > /tmp/gta.log 2>&1" > /tmp/rubriche.log 2>&1 &
```

`rubriche.py` legge i gironi `games` e `spazio` del grezzo, toglie offerte e rumore, raggruppa
lo stesso fatto detto da più testate, dà un punteggio e sceglie; Gemini traduce i titoli e
scrive la riga di sintesi (solo dal sommario del feed). Scrive `data/rubriche/<giorno>.json`.
Prima delle immagini: `python3 pipeline/rubriche.py --merge` le ricopia nell'edizione (e
`push.py` lo rifà da solo), insieme alla sezione GTA VI se l'agente l'ha già scritta.

**Chi scrive la prosa: Opus** (5 novembre 2026, Mike: «basta che la prosa sia stesa da Opus,
che come scrive mi piace molto»). Lo script sceglie una **rosa** di candidati per scheda (fino
a 18, `candidati` nel file del giorno); `pipeline/schede.py` apre tutti gli articoli in un colpo
solo e prepara `/tmp/corsa/schede-dossier.txt`; l'agente **`schede`** (Opus,
`.claude/agents/schede.md`) sceglie fino a dieci voci per scheda, unisce i doppioni anche fra
lingue (`anche`: lo stesso telescopio dal NYT e dall'ANSA), e scrive titolo e riga in italiano
dall'articolo, con il dato che conta. Scrive **solo** `data/rubriche/<giorno>-scritte.json`;
`rubriche.merge` compone l'edizione da lì, prendendo dal candidato link, testata, ore e foto
(`scritta: "opus"` sulla voce). Gira in background in parallelo al redattore, con dieci minuti;
se non consegna, restano la scelta dello script e i titoli di Gemini, che è il ripiego.

**La traduzione** (5 novembre 2026: dal 4 Gemini risponde spesso 503, e i titoli uscivano in
inglese senza che nessuno se ne accorgesse). Una chiamata per scheda, in parallelo, con lo
schema della risposta imposto, 40 secondi a tentativo e **3 minuti in tutto**: si gira fra i
modelli finché non scade il tetto. L'esito resta nel file, `_traduzione: {games: {esito,
modello, voci, tradotte}, …}` (il log in `/tmp` sparisce con la sessione cloud). Un titolo
tradotto porta sempre `orig`, anche se uguale; senza, `lint.py` dà un **avviso** in maiuscolo
(non un errore: un errore fermerebbe la pubblicazione, e l'edizione esce comunque) (le voci da
fonti italiane portano `lingua: "it"` e non si traducono). `chiudi.py prepara` rilancia
`rubriche.py --traduci`, che rifà solo le traduzioni mancanti, e rilancia tutto `rubriche.py`
solo davanti a un `Traceback` vero (prima prendeva per crash anche «HTTP Error 503» e perdeva
fino a 7 minuti).

**Lo stesso fatto** si riconosce anche quando i titoli si somigliano poco: due titoli vanno
insieme se condividono un **nome raro del giorno** (meno del 3% dei titoli del grezzo, scritto
con la maiuscola a metà frase nei titoli in minuscolo: «Laufey», non «Update»; le case e le
piattaforme in `MARCHI` non contano) più un po' di somiglianza. I gruppi si fanno per catena, e
le testate si contano su tutto il grezzo, non solo sul girone della scheda. Le voci di **Google
News** arrivano come «Titolo - Testata»: la testata vera diventa la fonte (così conta come una
testata in più) e la voce prende un punto e mezzo, perché Google le ordina per quanto girano.

Le regole di Mike, che valgono per tutte e due:

- **Una decina di voci, non di più.** Tetto 10 per Games (GTA VI a parte) e 10 per Scienza.
- **Mai riempire.** Se le voci buone sono tre, sono tre. Se sono due, la terza viene «Dalla
  settimana» (era «Ti sei perso», e si confondeva con «Se te lo fossi perso» della scheda
  APPLE): la cosa più calda dei giorni scorsi non ancora uscita. Una scheda vuota («oggi
  niente che valga la tua attenzione») è un risultato onesto.
- **Al massimo due storie «di cui parlano tutti da giorni».** Il resto dev'essere nuovo.
- **Games**: almeno quattro voci PlayStation quando ci sono, il resto generico (Nintendo, le
  grandi case, le fiere, gli eventi); nell'app due gruppi, «PlayStation» e «Il resto». Le
  offerte travestite («for Less Than $7», «Try … Now») sono rumore, i titoli a domanda o in
  prima persona sono opinione (−3).
- **Scienza**: «una rivista che mette dentro un po' di tutto» — notizie, scoperte recenti, le
  cose di cui parlano tutti: dalla fisica dei motori all'analisi meteorologica di un
  incidente aereo, dalla medicina alla nutrizione. **Mai «lo sapevi che».** L'AI resta nella
  sua scheda (OpenAI che risolve problemi di matematica è AI). Ogni voce porta la
  `disciplina` (spazio, medicina, fisica, terra, tecnica, storia, natura) come occhiello, e non
  ce ne sono più di tre per disciplina né più di due per testata. La politica (midterm,
  elezioni, amministrazione) scende di 8 punti, gli affari della sanità di 4, i premi e le
  nomine di 3,5, i pezzi a pagamento di STAT di 3.
- Titolo in italiano, originale in piccolo sotto. Le prime tre voci hanno la foto
  (`images.py`), le altre sono schede brevi di solo testo.

**GTA VI** (5 novembre 2026, Mike: «voglio ogni giorno ciò che scovi in rete, specialmente da
Reddit, X, forum utenti… ufficiale e non, chicche, curiosità — la radio di The Weeknd per
esempio»). Una sezione tematizzata in cima alla scheda Games, coi colori di Vice City, che non
compone lo script ma **un agente su Opus che fa solo quello**, `.claude/agents/gta.md`, con la
qualità come priorità. `pipeline/gta.py` gli prepara il dossier (`/tmp/corsa/gta-dossier.txt`,
completo in `data/gta/<giorno>.json`): r/GTA6 (top del giorno, della settimana, novità, in
fila con una pausa perché Reddit risponde 429), r/GTA filtrato, i post su X linkati aperti
con fxtwitter, il canale YouTube di Rockstar, le notizie GTA trovate da `rubriche.py`, gli
appunti di Mike, lo storico dei 14 giorni. Il resto — X, GTAForums (dietro Cloudflare),
ResetEra — l'agente lo cerca dal web. Scrive **solo** `data/gta/<giorno>-sezione.json`, mai
l'edizione (la stanno scrivendo il redattore e la regia): la ricopia `rubriche.merge`, in
`chiudi.py prepara` se l'agente ha già finito, in `chiudi.py fine` (con le foto) se arriva
dopo. Gira in background in parallelo al redattore, con dieci minuti: non è mai sul percorso
critico, e l'edizione esce anche senza. Dall'uscita del gioco (19 novembre 2026, da
riverificare ogni giorno) la sezione racconta anche cosa dicono i giocatori.

```json
"gta": {"uscita": "2026-11-19", "sintesi": "il tema del giorno nella rete",
        "voci": [{"id": "gta-…", "tipo": "scoperta", "title": "…", "nota": "…",
                  "citazione": "…", "citazione_lingua": "en", "fonte": "r/GTA6",
                  "link": "…", "segnale": "4.200 voti su r/GTA6", "affidabilita": "voce"}]}
```

`tipo` ∈ `ufficiale` · `scoperta` · `curiosita` · `leak` · `reazione` · `notizia`;
`affidabilita` ∈ `confermato` · `voce` · `da verificare`. Da 3 a 8 voci; il lint dà errore
oltre le 8 e su tipi sconosciuti, e avvisa su un link già uscito nei 14 giorni prima. Se l'agente non ha
girato, l'app mostra come ripiego le notizie GTA che `rubriche.py` ha trovato
(`gta_notizie`).

**Nella Magazine** (5 novembre 2026) le due schede hanno la grammatica delle notizie Apple
(`renderRubricaMag` in `pipeline/template.html`). **Niente testatina né data in cima** (5
novembre 2026, Mike: «siamo già dentro, è una ripetizione»): la scheda parte come Apple. In
Games prima la sezione GTA VI (`renderGta`: sfondo da tramonto di Vice City, «GTA VI» col VI in sfumatura
gialla-arancio-rosa, il conto alla rovescia turchese, ogni voce con il filo del colore del suo
tipo); poi «In apertura» con la prima voce grande, due affiancate, i gruppi in schede brevi,
«Dalla settimana».
Ogni scheda: testata, disciplina (in Scienza), titolo, la riga, l'originale in corsivo, il
piede con il tempo, quanto gira e la stellina. Il tocco apre l'articolo (segnali `o` e `l`).

**Le chicche delle schede** (5 novembre 2026). Mike: «mi fa impazzire il radar che si muove da
solo, i post-it che svolazzano, la citazione che si scrive come una macchina da scrivere». Il
reparto creativo (tre agenti, uno per scheda) ha proposto otto idee ciascuno
(`docs/schede/chicche-2026-11-05/`), e Mike ne ha scelte tredici. Sono oggetti veri che si
comportano da oggetti veri e **portano un'informazione**; partono una volta, quando arrivano
(`alArrivo`, che usa `Motion.seen`), e con «Riduci movimento» mostrano subito lo stato finale.
**Ognuna esce solo se ci sono i dati**: i campi li scrivono gli agenti che leggono già gli
articoli, solo se l'articolo li dà.

| Scheda | Chicca | Cosa fa | Dati (chi li scrive) |
|---|---|---|---|
| AI | Tabellone Solari | nel fronte, le palette girano dal modello di prima al nuovo; il lucchetto si apre sui pesi aperti | `modello` (agente `ai`) |
| AI | Il conto | la parte e il tutto in un campo di 200 pallini, quelli accesi in rosso | `conto: {parte, tutto, etichetta, fonte}`, una voce al giorno (`ai`) |
| AI | Il cursore che lavora | nel foglietto «Prova» una freccia clicca e spunta i passi | `passi` sul LAB (`ai`) |
| Games | In caricamento | una barra per gioco atteso, dall'annuncio all'uscita; una tacca rossa per rinvio | registro `data/games/attese.json` (`pipeline/attese.py`), aggiornato da `attese` nelle scritte di `schede` |
| Games | I quattro tasti | ✕ uscita · ○ rinvio · △ rumor · □ affari, premuti quando arrivano | `tasto` (`rubriche.py` dal titolo, `schede` corregge) |
| Games | Questa settimana esce | lunedì–domenica, i giorni passati barrati | `settimana` nelle scritte di `schede`, solo se un articolo elenca le uscite |
| Games | Il verdetto | un pallino per recensione sulla riga 0–10, e la media | `verdetto`, solo con 3 voti dichiarati (schema.org nelle pagine, letti da `schede.py`) |
| GTA VI | Le tappe del lancio | la striscia turchese, la tappa di oggi rosa che si accende | `gta.tappe` (agente `gta`), solo date verificate |
| GTA VI | Il registro dei problemi | dall'uscita: segnalato, riconosciuto, corretto | `gta.problemi` (`gta`) |
| Scienza | Il cilindro della prova | il liquido sale fino alla tacca della prova, con rivista e campione | `prova: {livello, rivista, campione}` (`schede`) |

**Tolte la sera stessa** (Mike, 5 novembre 2026): in Scienza la tavola delle discipline, la scala
delle cose e la carota del tempo («inutili»: resta solo la provetta accanto alla notizia); in AI la
settimana dei laboratori a cubetti sotto il fronte («incomprensibile»: restano i modelli con le
settimane in carica). Le foto delle schede si prendono a 800 pixel, e una foto più stretta di 640
all'origine non entra (`MIN_SCHEDE` in `images.py`): le foto AI erano miniature da 240 tirate a
tutta larghezza, «sgranatissime».

Il lint controlla i valori ammessi (`check_chicche`) con avvisi: un valore che l'app non
conosce non si disegna, e non vale la pena di fermare la pubblicazione. Il codice è nel blocco «LE CHICCHE DELLE
SCHEDE» di `pipeline/template.html`.

I pesi stanno in `pipeline/rubriche.py` (`RUBRICHE`): si ritoccano lì, guardando
`rubriche.py --dry --debug`. Un redattore Claude per rubrica, dopo la pubblicazione, è
l'evoluzione prevista: sceglie le top 3 e scrive il «perché apri». I segnali di lettura di
Mike (vedi *Il gusto*) dicono col tempo quali fonti e quali rubriche apre davvero.

### 2. Selezione e scrittura

Prima di scrivere, guarda cosa è rimasto aperto dalle edizioni precedenti:

```bash
python3 pipeline/threads.py list && python3 pipeline/claims.py open --due 30 && python3 pipeline/facts.py moving
python3 pipeline/missed.py
```

Le storie in corso, le previsioni che stanno per scadere, i numeri che si sono mossi.
Se una notizia di oggi continua un filo, chiude una previsione o rivede una stima, va
detto: è il motivo per cui esistono.

Poi la memoria vera e propria — cosa del grezzo di oggi abbiamo già raccontato:

```bash
python3 pipeline/threads.py recall --raw
```

Per ogni articolo che somiglia a una voce uscita nei 14 giorni prima (notizie **e**
sezione AI) stampa le due righe affiancate. Per ognuna si sceglie: **doppione** (si
scarta) o **seguito** (stesso `thread`, e nel testo si dice cosa è cambiato: «ieri
presentato, oggi le prime prove»). Lo stesso link già uscito il lint lo blocca comunque. L'ultimo comando propone i candidati per «Se te lo
fossi perso» (vedi *Il ripescaggio*): le non date e le perse da te, al massimo due in
edizione.

**«STESSO LINK» non sempre vuol dire lo stesso indirizzo.** Il punteggio arriva a 1.0 anche
quando due titoli condividono solo due nomi propri (es. «iPhone», «Duo») e nient'altro: è una
scorciatoia del confronto fra lingue (titolo grezzo in inglese, voce già scritta in italiano),
non un errore da andare a capire nel codice ogni volta. Se i due articoli raccontano fatti
diversi, è un falso positivo: trattalo come tale e vai avanti, non serve ripercorrere
`common.similarity` per confermarlo.

Poi guarda cosa hanno detto i pollici, che è il modo in cui la selezione si tara:

```bash
python3 pipeline/taste.py
```

Stampa i declassamenti attivi e le cinque caselle del radar di oggi (vedi *Il gusto*).

Leggi il file grezzo. Per le 8–12 notizie più importanti scarica l'articolo completo
(`curl -sL` + strip dei tag) per avere dettagli e citazioni verificabili: **non scrivere
descrizioni basandoti solo sull'abstract RSS**. **Scarica tutti gli articoli in un solo
comando** (un ciclo bash con i `curl` lanciati in background e un `wait` finale, o `xargs -P`),
non uno alla volta in chiamate separate: leggerli uno dopo l'altro, in sequenza, è il modo più
lento di passare questa fase — il 2 ottobre 2026 ci sono voluti da soli una ventina di minuti.

#### Quanto gira, e più racconti per notizia — `eco.py`

**Il 2 novembre 2026 Mike ha detto la cosa giusta**: «tu apri 9to5Mac e mi schiaffi dentro
le notizie; io ne leggo una decina "riportate da una testata" e hai finito il compitino».
Era vero. Dodici notizie su tredici erano riscritte da un articolo solo, e «una testata
sola» voleva dire «una sola fra le sette che leggiamo»: la modalità telecamera di HomeView,
data da The Verge come voce isolata, alle 6 del mattino l'avevano già scritta una dozzina di
siti (il primo un sito francese, poi iClarified, AppleInsider, Digital Trends) e a
mezzogiorno erano venticinque. Il software vecchio di HomeView, «di MacRumors», MacRumors
l'aveva preso da AppleDB. Quindi, subito dopo la raccolta:

```bash
python3 pipeline/eco.py
```

Per ogni notizia Apple del grezzo chiede a Google News e Bing News (senza chiave) chi altro
l'ha scritta negli ultimi tre giorni, e stampa le notizie **ordinate per quanto girano**:
quante testate, nostre e no; chi l'ha data per prima, con l'ora; gli articoli da leggere
oltre al nostro. È un segnale di selezione: una notizia ripresa da venti siti non sta al
rank 10, e una che sta solo da noi va detta come tale («lo scrive solo MacRumors»).

Scelte le notizie, **si leggono tutte insieme in un comando solo**:

```bash
python3 pipeline/eco.py --leggi "titolo o link del grezzo" "altro titolo" ...
```

scarica in parallelo il nostro articolo e quelli da leggere e ne stampa il testo, notizia per
notizia (va fatto nel sottoagente di lettura: è tanto testo). Le regole della stesura:

- **Mai una notizia riscritta da un articolo solo quando ce ne sono altri.** Le prime cinque
  si scrivono da almeno tre racconti di testate diverse, le altre da almeno due quando
  `eco.py` ne trova. La descrizione mette insieme quello che ciascuno aggiunge — il dato che
  ha uno solo, la dichiarazione raccolta da un altro, il dettaglio che contraddice — e
  `sources` elenca le testate **lette davvero**, gli altri link in `extra_links`.
- **All'origine, non alla ripresa.** Se l'articolo dice da dove l'ha preso (AppleDB, un
  codice trovato da Aaron Perris, Gurman), è quella la fonte da nominare e, se si apre, da
  leggere.
- **Una stesura nostra, non una traduzione.** L'ordine dei fatti, l'attacco e il contesto
  sono nostri; si traduce solo quello che va fra virgolette.

`verify.py` poi rifà il conto dentro l'edizione: `verifica.testate` sono **tutte** le testate
(quelle che l'app mostra in «quanto gira»), `lette` quelle delle nostre, `web` quelle trovate
fuori, e `primo` è chi l'ha data per primo fra tutte — ma non un'anteprima («What analysts
expect from Apple's Q4»: il 3 novembre 2026 faceva scrivere «2 giorni fa» su conti usciti la sera
prima), e non una testata trovata fuori più di 36 ore prima di tutte le nostre (`ANTICIPO` in
`verify.py`). Le risposte restano in
`data/eco/<giorno>.json`: la seconda corsa non rifà le domande.

#### Chi scrive la prosa — il redattore su Opus

**Dal 3 novembre 2026 le notizie le scrive un sottoagente su Opus**, `.claude/agents/redattore.md`
(Mike, 2 novembre: «usiamo Opus per la scrittura»; la rilettura dei token si affronta dopo). In un
confronto alla pari su una stessa notizia Opus era più prudente nel separare fatto e ipotesi,
Sonnet più incisivo nel titolo: la differenza è piccola, e se Opus non ripaga si torna a Sonnet
cancellando una riga dal prompt della routine. La regia resta alla sessione principale (Sonnet):

1. la **lettura** va a un sottoagente, che scrive `/tmp/lettura-<giorno>.md` (non è nel repo);
2. la regia scrive nell'edizione `date`, `title`, `window`, `stats`, `feed_notes` e le sezioni
   `ai`, `banco`, `social`, `radar`, `recap`;
3. il **redattore** aggiunge `news`, `top3`, `intro`, gli approfondimenti, `citazione`,
   `editoriale`, `prossimo`, senza cancellare niente di quello che c'è;
4. se non consegna, la regia scrive le notizie da sé: un'edizione in Sonnet batte nessuna.

Il resto della procedura (verify, immagini, lint, push, visualista) non cambia. Le regole di
scrittura che seguono valgono per il redattore; stanno anche, in forma breve, nel suo file.

#### La corsa in tre script — risparmio token, fase 1 (dal 6 novembre 2026)

Ogni passo della regia rilegge tutta la conversazione: il 3 novembre 2026 la corsa ha riletto
41 M di token, quattro quinti nella regia, quasi tutti in passi meccanici (comandi uno alla
volta, attese a vuoto, lint ripetuti, commit forzati dall'hook di Stop del cloud). Da qui tre
script che fanno **gli stessi comandi di prima, nello stesso ordine**, e stampano solo l'utile:
`mattino.py` (raccolta, uscite intere in `/tmp/corsa/*.txt`), `chiudi.py prepara | pubblica |
fine` (la coda; `verify.py` resta fuori perché dopo decide il modello) e `salva.py` (commit in
tre punti fissi). In più `aspetta.py` blocca finché la lettura non scrive `<!-- fine lettura -->`,
`campi.py` stampa solo i campi chiesti di un JSON, e `qualita.py` controlla le soglie dure
dell'edizione (base: 3 novembre 2026). `costo.py` divide il conto per registro e per modello,
e `costo.py --confronto 2026-11-06` mostra il prima e il dopo. Il prompt della routine sta in
`routine/prompt.md` (quello di prima in `routine/prompt-pre-risparmio.md`, e il codice nel tag
`corsa-pre-risparmio`). Piano, pareri e stime: `docs/risparmio-token/`. La fase 2 (un
sottoagente «cronista» per ai, banco, social, radar e recap) parte solo dopo cinque corse
pulite e una prova a vuoto.

Lo stesso giorno, due correzioni alle fonti: il feed ufficiale dei rilasci Apple («Apple
Developer Releases», girone primaria: ogni iOS/macOS, beta o finale, entra nel grezzo) e la
pagina 2–3 dei feed troncati per profondità (iSpazio ne dava 10, cioè poche ore nelle serate
piene). `fetch.py` segnala «feed troncato» per quelli che non si possono sfogliare: MacRumors
e The Verge, per ora.

Poi scrivi `data/briefs/YYYY-MM-DD.json` seguendo esattamente lo schema di
`data/briefs/2026-08-08.json`. **Scrivi `sintesi`, `descrizione` e i campi
dell'`approfondimento` già dentro le misure che `lint.py` controlla** (vedi le tabelle
`SINTESI_MAX`/`DEEP_MAX` in `pipeline/lint.py`: sintesi ≤200 caratteri nelle notizie e ≤190
nell'AI, `punto` ≤220, ogni paragrafo di `sotto` ≤450, ogni `tappa`/voce di `dopo` ≤90) —
contare i caratteri mentre scrivi costa niente, riscrivere tutto dopo un giro di lint costa un
passaggio intero. Il lint resta il collaudo finale, non la prima bozza. Regole editoriali:

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
- **Gli accenti sono accenti**: «metà», «già», «perché», «è» — mai «meta'», «gia'», «perche'».
  Il 2 novembre 2026 l'edizione è uscita con gli apostrofi al posto degli accenti, apertura
  compresa. Il lint lo blocca come errore; `python3 pipeline/accenti.py --fix` corregge.
- **Non inventare nulla.** Se un dato non è nell'articolo, non va nel brief.

Campo `origine`: **il riferimento supremo** della notizia — chi l'ha detta o dichiarata per
primo, in un nome solo: «Bloomberg» (Gurman), «Apple», «AppleDB», «Digital Chat Station»,
«Reddit» se l'ha trovata un utente, «The Verge» se è la sua prova. Non chi l'ha ripresa: si
leggono più testate per scrivere (vedi *eco.py*), ma da dove viene la notizia è una cosa sola
(2 novembre 2026, Mike: «se è 9to5Mac via The Verge, mettiamo The Verge direttamente»). Nella
Magazine è la testata in cima alla scheda, senza «via»; nella notizia aperta «All'origine:»
quando è diversa dalla testata che si legge. La decide la corsa, non `verify.py`, che sbaglia
quando un articolo linka un'altra testata per contesto (la prova di HomePod mini 2 di The
Verge risultava «via 9to5Mac»). Il lint avvisa se manca.

Campo `reparto`: l'argomento in una parola, uno fra `Mac` · `iPhone` · `iPad` · `Watch` ·
`Casa` · `Servizi` · `Software` · `Mercato` · `Regole` · `Azienda` · `Eventi` · `Accessori` ·
`AI`. Nella lista del Duo sta sopra il titolo e dice che notizia aspettarsi (vedi
*L'impaginato del Duo*); il lint avvisa se manca. `category` resta, libero, per la taratura.

Campo `tag` (determina il colore della pastiglia):
`CONFERMATO` (blu) · `RUMOR` (giallo) · `DATI` (arancio) · `ANALISI` / `OPINIONE` (rosso) ·
`CONTORNO` / `CONTESTO` / `SERVIZIO` (nero).

Campo `reliability`: `alta` | `media` | `bassa`, con `reliability_note` che spiega **perché**.
La nota **non si mostra più nell'app** (1 novembre 2026: Mike non la leggeva): resta
nell'edizione, perché serve a te e alle pagelle.

| Fonte | Affidabilità |
|---|---|
| Documenti ufficiali, atti giudiziari, newsroom Apple | alta |
| Gurman (Bloomberg), Kuo, Ross Young, Counterpoint, IDC | alta |
| Digitimes, ETNews, catena di fornitura anonima | media |
| Leaker Weibo/X senza track record, Reddit, forum | bassa |

Rumor e gossip **si includono**, ma sempre marcati con `tag: "RUMOR"` e una nota sulla fonte.

`radar`: **da 0 a 5 voci** brevi, ognuna con `id` (slug stabile, serve al voto) e
`topic` (l'unità su cui il radar impara). **Il radar è per quello che non ha una scheda
sua** (31 ottobre 2026, Mike: «se no è un mega doppione»): niente che spetti ad AI, GAMES
o SCIENZA. La robotica e i capitali dell'AI vanno nella scheda AI, Hubble in SCIENZA, i
videogiochi in GAMES. Al radar restano regole e antitrust, sicurezza e sorveglianza,
piattaforme e social, telecomunicazioni, energia, auto, e **dal 5 novembre 2026 l'hardware di
consumo** che fa concorrenza ad Apple (il Kindle nuovo contro l'iPad mini, i visori, le
cuffie): la scheda Tech non c'è più. In `data/radar_topics.json` i temi delle
altre schede hanno `"axis"` (`ai`, `games`, `spazio`) e stanno fuori dalla
rotazione; il lint dà errore su una voce con uno di quei temi, o con un link già presente
fra le voci AI o nelle rubriche dello stesso giorno. **Cinque è un tetto, non una quota**:
se oggi c'è materiale per due voci, sono due; se non ce n'è, il radar non esce. Mai
riempire. La composizione la propone `taste.py` (vedi *Il gusto*), e nell'app il radar
sta **in fondo**, dopo le discussioni.

```json
{"id": "pebble-ritorno", "topic": "hardware-indipendente",
 "title": "…", "note": "…", "link": "…", "source": "Tom's Hardware IT"}
```

`feed_notes`: segnala i feed muti o fermi rilevati al passo 1. **Non compare più
nell'app** — è diagnostica della pipeline, non roba da leggere a colazione: resta
nell'edizione e si guarda dal Mac con `lint.py` e `feedcheck.py`.

#### Le pastiglie della notizia

Una riga sola: il **tag**, e sui soli `RUMOR` **tre pallini** per l'affidabilità (blu alta,
gialli media, rossi bassa). Su una notizia confermata «affidabilità alta» è ovvio. Categoria
e «14ª puntata di 14» non si mostrano più: erano scritte in più (30 settembre 2026). I campi
restano nell'edizione, perché servono a `taste.py` e alla memoria. Chi ha l'approfondimento
porta la pastiglia gialla *approfondita*.

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

**Il filo vale anche per le voci AI**, con lo stesso campo e lo stesso registro, e può
attraversare le due sezioni: Muse di Meta è nata nella scheda AI ed è arrivata fra le
notizie quando Bank of America l'ha messa fra i rischi per Apple (filo
`agenti-personali`). Nella scheda AI la voce che ha una puntata precedente porta la riga
«Segue · 2 giorni fa — …», che tocca e porta lì. È la memoria che mancava alla sezione:
fino al 30 settembre 2026 si svegliava ogni mattina senza ricordi.

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

#### I rilasci Apple — `novita`

Quando Apple rilascia un sistema (iOS, iPadOS, macOS, watchOS, tvOS, visionOS; beta o finale),
Mike vuole sapere **tutto** quello che cambia, non quattro notizie sparse (5 novembre 2026). Il
rilascio arriva nel grezzo dal feed «Apple Developer Releases» (girone `primaria`). Allora una
notizia fra le prime cinque — **l'apertura** se è un x.y finale o una beta 1 — racconta il
rilascio con l'elenco **completo** delle novità:

```json
"novita": [{"sistema": "iOS 27.3 beta 1", "area": "Fotocamera", "cosa": "Modalità notte nei video 4K",
            "dettaglio": "Facoltativo: dove si trova, cosa comporta", "fonte": "MacRumors", "link": "…"}]
```

- Si raccoglie da **tutte** le testate che hanno trovato novità (9to5Mac, MacRumors, iSpazio,
  Macitynet, AppleInsider…), lette per intero dal sottoagente di lettura: una voce per novità,
  senza doppioni, con la fonte di chi l'ha trovata.
- Le beta successive e i giorni dopo aggiungono **solo le novità nuove**, come seguito sullo
  stesso filo del rilascio. Le novità grosse possono avere anche la loro notizia, ma l'elenco
  completo c'è sempre.
- Misure: `cosa` ≤ 120, `dettaglio` ≤ 220, `link` sempre. Il lint le controlla, e **avvisa** se
  nel grezzo c'è un rilascio uscito nella finestra e nessuna delle prime cinque ha `novita`.

Nell'app è il blocco «Tutte le novità» dentro la notizia aperta, fra la descrizione e
l'approfondimento: il numero grande, un pallino per sistema, poi per sistema e per area una
riga a voce; oltre le dodici se ne vedono otto e il resto sta dietro «Mostra tutte». Sulla
scheda della Magazine il piede dice «N novità».

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
che è notizia: sulla vecchia notizia compare "Come è andata a finire". "Chiude una
previsione" sulla notizia nuova non si mostra più (1 novembre 2026: Mike la saltava), ma
`resolves` si scrive come sempre: chiude la previsione nei dati.

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

**Dal 5 novembre 2026 la scrive un agente su Opus**, `.claude/agents/ai.md` (Mike: «basta che
la prosa sia stesa da Opus»), non più la regia. `pipeline/ai_dossier.py` (lanciato da
`mattino.py` appena finito `lab.py`) prepara `/tmp/corsa/ai-dossier.txt`: la cronaca del girone
`ai` con gli articoli aperti, il LAB del grezzo e di `lab.py`, gli appunti di Mike, le voci dei 14
giorni prima con il loro filo, il fronte fino a ieri. L'agente gira in background in parallelo
alla lettura, fa anche la caccia LAB sul web, e scrive **solo** `data/ai/<giorno>-sezione.json`;
`rubriche.merge` lo porta nell'edizione (in `chiudi.py prepara`, o in `fine` se arriva dopo). Se
non consegna, `prepara` lo dice e la regia scrive la sezione da sé: è il ripiego. Le regole che
seguono valgono per l'agente.

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

`lab` ∈ `anthropic` · `openai` · `google` · `meta` · `apple` · `aperti` · `robot` · `altri`
(`robot`: umanoidi, braccia, Boston Dynamics — i robot vivono nella scheda AI; `aperti`: i
laboratori dei pesi aperti, Mistral, Kimi, Qwen, DeepSeek, che prima finivano in `altri`).
`kind` decide lo strato: **cronaca** = `modello` · `funzione` · `affari` · `regole` ·
`ricerca`; `modello` è **solo per i modelli di punta**, quelli che cambiano il fronte — un
modello per la musica, il meteo o la voce è `funzione` o `ricerca`; **LAB** = `uso` (qualcuno risolve una cosa vera) · `demo` (una cosa
costruita che puoi provare) · `trucco` (un prompt, una funzione, un modo d'uso) ·
`sapevi` («sai che puoi…»: c'è già e nessuno la usa).

**`sintesi` è la riga che si legge a voce chiusa** sulle notizie: una frase intera che
sta in piedi da sola, con il dato che conta — mai un troncamento con i puntini, che il
lint segnala. **`prova` è la sezione** sul LAB: ogni voce LAB deve dire come lo provi tu,
in una riga — nella galleria è la riga gialla sotto il titolo, sempre visibile.

**Nella Magazine la scheda AI è un feed solo, con la grammatica di Apple** (5 novembre 2026;
le due schede Notizie/LAB restano nella Classica; la prima versione, con l'apertura sul rosso
pieno e il dispaccio nel condensato, Mike l'ha bocciata: «non leggo, e sotto è morto»): niente
testatina; **«In apertura»** con la prima voce di cronaca in una scheda grande su carta (il
laboratorio come testata, il genere, il titolo, la riga intera), due affiancate; **il fronte come
tabellone** (vedi sotto); **«E Apple?»**, una volta sola, con le voci la cui riga `apple` dice
qualcosa; **«Cosa puoi provare»**, il LAB con la foto del risultato e il **foglietto giallo
«Prova»**; **«In breve»**, il resto della cronaca in schede brevi a due colonne.
Il codice è `renderAIMag` in `pipeline/template.html`. Niente filtri per laboratorio: i segnali
decidono chi pesa di più. Senza `prova` una voce LAB è una curiosità; il lint la respinge.

**La riga `apple` si scrive solo quando c'entra davvero** (5 novembre 2026): 69 voci su 138
dicevano «niente, per ora», e ripetuta su ogni riga non diceva niente. Ora sta una volta sola in
cima, nel riquadro «E Apple?», e la voce che non tocca Apple la lascia vuota (il lint avvisa
su un «niente…»).

**Il foglietto «Prova»** sulle voci LAB: oltre a `prova` (la riga, sempre), quando l'autore
li ha pubblicati, `prompt` (il prompt vero, letterale, nella lingua originale, con
`prompt_lingua`: nell'app è in monospazio col tasto **Copia**), `strumento` («Codex + Blender
MCP»), `costo` («4 $ di API»), `segnale` («1,2 milioni di visualizzazioni su X»). **Mai un
prompt ricostruito**: se l'autore non l'ha scritto, il campo non c'è.

**Il fronte.** L'app mostra nella scheda AI **un tabellone nero**, una colonna per laboratorio
(Anthropic · OpenAI · Google · Meta · Apple · Aperti · Altri · Robot): il **nome breve** del
modello in condensato pesante, i pallini delle settimane in carica, e la colonna di chi ha
rilasciato oggi in rosso. Lo ricava da solo dalle voci
`kind: "modello"` dell'archivio: per ogni laboratorio **il più recente di punta**, non il più
recente e basta (prima Anthropic mostrava Haiku); se l'ultimo che conosce non è di punta, la
colonna lo dice («veloce»). Quindi ogni modello nuovo va scritto come voce `modello` con:

```json
"modello": {"nome": "GPT-6.1 Terra", "famiglia": "punta"}
```

`nome` è il nome breve, entro 22 caratteri (mai una frase); `famiglia` ∈ `punta` · `veloce` ·
`aperto`. Il lint avvisa se manca il nome. Per le voci vecchie senza il campo, l'app ricava il
nome dal titolo. Niente registro a parte.

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
   Le liste però sono **ferme**: ogni mattina la stessa pagina, con gli stessi post più
   visti in cima. Fra il 10 e il 30 settembre 2026 trentanove voci LAB sono uscite due o
   tre volte, cinque solo il 30. Da allora `lab.py` salta tutto quello che è già uscito
   in edizione *prima* di riempire la quota, e lo elenca in fondo come «escluse».
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
 "title": "Galaxy Z Fold 8 alla prova: la luna di miele è finita",
 "orig": "Galaxy Z Fold 8 Review: Honeymoon's Over",
 "note": "Cosa dice il pezzo, due righe.",
 "perche": "È il video che ha visto il cliente che entra a chiedere del pieghevole.",
 "link": "…", "source": "MKBHD"}
```

**Il titolo è sempre in italiano**, anche quando la recensione o il video sono in inglese:
l'originale va in `orig`. Vale per tutto quello che scrive la regia (banco, radar, discussioni,
ripescaggio). L'8 novembre 2026 due voci del banco sono uscite col titolo inglese, perché
questo esempio ne aveva uno: ora il lint lo blocca come errore (`check_italiano`).

`kind` è `recensione` · `video` · `confronto` · `curiosità` · `guida`, e determina il
colore della pastiglia. **`perche` è la sezione**: senza quella riga è una recensione
qualsiasi, e il lint la respinge come errore.

**Nell'app la sezione si chiama «Di cosa si parla» e il foglietto giallo «La risposta»**
(8 novembre 2026, Mike: «Sul banco» non si capiva; nella barra di vetro è «Se ne parla»). Il
campo resta `perche`, ma da allora è **la risposta pronta da dare al cliente**, fra
virgolette, in seconda persona di cortesia, riparafrasata dall'articolo: «Sì, adesso lo fa
anche Google, in vista del suo Pixel Tag. Con iPhone e AirTag gli avvisi per gli oggetti
dimenticati ci sono già da tempo.» Non più il perché serve a te («È la domanda di chi ha
Android…»). **Solo i fatti dell'articolo**: se il pezzo non dice quali funzioni mancano, la
risposta non le elenca; niente procedure o rimedi che l'articolo non dà.

Il materiale arriva dal girone `banco` del file grezzo (`"tier": "banco"`): DDay.it,
HDblog, GSMArena, Android Authority e i due canali YouTube, Andrea Galeazzi e MKBHD.
I video si riconoscono dal link `youtube.com/watch`.

#### Il ripescaggio — `recap`

«Se te lo fossi perso»: **al massimo 2 voci** (31 ottobre 2026: Mike ha chiesto le
notizie che hanno fatto clamore negli ultimi 10 giorni, e due invece di tre «così meno
ridondante»). «Perso» ha due sensi, e si sceglie in quest'ordine:

1. **Le non date** — il senso di sempre. La rassegna guarda 26 ore e il perimetro Apple, ed
   è il suo buco: una cosa che esplode di martedì fuori perimetro non entra mai più. Questi
   candidati vengono prima, ma sono rari: fino a fine ottobre la sezione è rimasta vuota 28
   giorni su 30, perché quasi tutto quello che fa rumore lo abbiamo già dato.
2. **Le perse da te** — il senso letterale, «se *te* lo fossi perso». Notizie uscite in
   edizione fra 2 e 10 giorni fa, che hanno fatto rumore, e che Mike **non ha aperto**: lo
   dicono i segnali di lettura dell'app (gli stessi della taratura). Il rumore si misura su
   tre cose: testate che l'hanno raccontata (`verifica.testate`), seguiti sullo stesso filo
   nei giorni dopo, discussioni che l'hanno ripresa (il mucchio «eco» di `social.py`).

```bash
python3 pipeline/missed.py
```

Stampa i due mucchi: i candidati `COPERTURA` / `SOLO ONLINE` / `COMMENTO` (le non date) e
i `PERSA DA TE`, ciascuno con il suo `ref`. La scelta resta editoriale, e zero voci resta un
risultato onesto: se Mike ha aperto tutto quello che contava, non si riempie.

Una non data si scrive come sempre:

```json
{"id": "anthropic-open-weights", "when": "2026-07-27",
 "title": "…", "note": "3-4 righe: cos'era e perché ne hanno parlato tutti",
 "signal": "1.180 punti e 1.747 commenti su Hacker News",
 "link": "…", "source": "Anthropic"}
```

Una persa da te **rimanda all'originale** con `ref`, e `when` è la data di quell'edizione:

```json
{"id": "persa-iphone-duo-crepe", "when": "2026-10-24",
 "ref": {"date": "2026-10-24", "id": "iphone-duo-crepe-memo"},
 "title": "il titolo dell'originale", "note": "2-3 righe: cos'era e, se c'è, cosa è successo dopo",
 "signal": "7 testate, 2 seguiti nei giorni dopo", "link": "…", "source": "9to5Mac"}
```

Nell'app la voce con `ref` porta la riga «uscita qui il 24 ott» e il titolo **riapre la
notizia originale** al suo posto nell'archivio, invece di mandare fuori all'articolo. La nota
non riscrive la notizia: dice cos'era, e se il filo è andato avanti, cosa è successo dopo.

Il lint: più di 2 voci è un errore; sotto i 2 giorni non è un ripescaggio ma la rassegna di
ieri (errore); oltre i 10 giorni è un avviso. Per le non date un link già uscito resta un
errore — svuoterebbe la sezione del suo senso. Per le perse da te il `ref` deve trovare la
notizia originale nell'archivio.

`signal` è obbligatorio ed è la misura, non il giudizio.

#### La verifica — `verifica`

Cinque siti che scrivono la stessa cosa sembrano cinque conferme. Quasi mai lo sono: se
9to5Mac, MacRumors, iSpazio e Macitynet citano tutti Gurman, la fonte è **una** e le altre
sono riprese. Scrivere «ripresi e confermati da 9to5Mac, iSpazio e Macitynet» — è
successo, nella nota della notizia d'apertura del 30 settembre 2026 — è esattamente
l'errore da non fare.

Scritta l'edizione, prima del collaudo:

```bash
python3 pipeline/verify.py
```

Per ogni notizia mette insieme gli articoli che la raccontano (link, `extra_links`, e quelli
del grezzo che somigliano), li apre e cerca **da dove dicono di averla presa**: i link nel
testo verso una testata d'origine (bloomberg.com, theinformation.com…), le attribuzioni
scritte («secondo Mark Gurman», «according to The Elec»), i comunicati della newsroom
Apple di questo mese o del precedente, le dichiarazioni di un portavoce. Poi scrive nella
notizia:

```json
"verifica": {"testate": 4, "origini": ["Bloomberg"], "ufficiale": false,
             "riprese": 2, "senza_fonte": 2, "il": "2026-09-30"}
```

e stampa le notizie da riguardare. Gli avvisi scattano **solo su prove positive**:
- `CONFERMATO` quando la catena porta a un'esclusiva sola (Bloomberg, The Information,
  un leaker su X…) e nessuna parola di Apple → autorevole, ma è un `RUMOR` ad affidabilità alta;
- `RUMOR` quando una testata riporta un comunicato o un portavoce di Apple → forse non lo è più;
- `RUMOR` ad affidabilità alta senza che nessuno dica da chi viene;
- `RUMOR` con due esclusive indipendenti → l'affidabilità può salire.

Una testata che non cita nessuno **non è sospetta**: spesso è la fonte di se stessa (ha
provato la beta, era in sala). Per questo «origine non dichiarata» non fa scattare niente
e nell'app non compare.

**Nell'app, «quanto gira»** (1 novembre 2026). In fondo alla notizia non c'è più l'elenco
dei nomi delle testate né i titoli dei link in più: Mike non li leggeva. Vuole capire la
**rarità** — una voce sola, una speculazione, o una cosa ripresa da tutti — e **chi l'ha
detta per primo**. Quindi: dieci pallini, tanti accesi quante le testate (`testate`), una
riga che lo dice a parole («Una testata sola», «Ripresa da 5 testate», «Ne parlano tutti»,
«C'è la parola di Apple»), sotto l'origine se c'è («All'origine: Bloomberg», «Fonti
indipendenti: …») e altrimenti **chi l'ha data per primo** fra le nostre testate
(`primo`, che `verify.py` ricava dall'ora degli articoli nel grezzo), poi «Leggi su
9to5Mac →». Gli `extra_links` restano nell'edizione: contano nel numero.

Lo script **non cambia i tag**: dice cosa ha visto, la decisione è tua. Il lint ripete i
suoi avvisi, così non si perdono. Gli articoli già letti restano in
`data/verify/cache.json` per un mese.

#### L'approfondimento — `approfondimento`

Le **prime cinque notizie** hanno un approfondimento già scritto: nell'app c'è il pulsante
giallo *Approfondisci* sotto la notizia. **Dal 1 novembre 2026 è un articolo, non un
modulo a schede.** Mike leggeva solo «Cosa c'è sotto»: tappe, «chi lo dice» e «cosa
aspettarsi» li saltava, e il punto ripeteva il titolo — «lo vedo inconsistente e inutile».
Ha chiesto un pezzo che **vada in profondità senza ripetere quanto letto sopra**: che
spieghi, illumini, allarghi, con altri pareri, commenti social, grafici, statistiche, e che
consigli altri articoli, nomi, testate.

**Quali cinque.** Il rank segue l'importanza, e le prime cinque sono quelle che la meritano.
Se due delle cinque raccontano lo stesso fatto, i due approfondimenti devono guardarlo da
lati diversi (il 30 settembre: la produzione del Duo *come fabbrica*, i preordini *come
acquisto*).

```json
"approfondimento": {
  "titolo": "Il Mac touch non vuole cambiare il Mac",
  "punto": "Il sommario: una frase che apre l'angolo, non riassume la notizia",
  "numeri": [ {"valore": "2.899 $", "etichetta": "il 14 pollici, 400 più del mini-LED", "fonte": "MacRumors"} ],
  "sotto": ["Il testo: 2–3 paragrafi che spiegano, collegano, allargano"],
  "visivi": [ {"tipo": "stime", "titolo": "…", "didascalia": "…", …} ],
  "voci": [ {"chi": "Nabila Popal", "dove": "IDC", "tipo": "analista",
             "testo": "Il peggio deve ancora venire.", "link": "…", "segnale": "…"} ],
  "approfondire": [ {"tipo": "leggi|ascolta|guarda", "titolo": "…", "fonte": "…",
                     "durata": "85 min", "link": "…", "perche": "una riga: perché aprirlo"} ],
  "scritto": "2026-11-01"
}
```

Nell'app si legge dall'alto in basso, senza schede: il titolo grande, il sommario, i
numeri in una fascia (al massimo tre, grandi, con la fonte), il testo con il capolettera e
i grafici dopo il primo paragrafo, «Cosa ne dicono» con le voci, «Per andare oltre» con le
letture. L'esempio completo è l'edizione del 1 novembre 2026.

- **`titolo`** è suo, e non è il titolo della notizia detto in un altro modo: è l'angolo.
  «Perché Apple sfoca Area 51 ma lascia in chiaro Pearl Harbor», non «Apple Maps sfoca le
  basi». Il lint avvisa quando i due si somigliano troppo.
- **`sotto`** non ripete la descrizione della notizia: parte da dove quella finisce. Il
  meccanismo, il precedente, il confronto, le domande che restano.
- **`voci`** è quello che mancava: chi altro ne parla e cosa dice. `tipo` è `analista` ·
  `testata` · `apple` (un dirigente, un portavoce) · `esperto` (un recensore, uno
  sviluppatore) · `social` (un commento, un post) · `storia` (una frase del passato che
  torna). `testo` è una citazione vera **nella lingua originale, mai tradotta** (2 novembre
  2026: una frase di Ternus resta in inglese), o la sua parafrasi stretta in italiano
  dichiarata come tale — mai un'invenzione, mai un'attribuzione a chi l'ha solo ripresa. I commenti si prendono
  dove ci sono: il thread di Reddit (il suo RSS, `…/comments/<id>/.rss`, si legge senza
  chiave), Hacker News, i commenti di GSMArena e di 9to5Mac; `segnale` dice quanto pesa
  («il thread più discusso di r/apple», «1.180 punti su HN»). Un commento è un parere,
  non un fatto: «un lettore di GSMArena», mai «gli utenti».
- **`numeri`**: le cifre che fanno capire la scala, non quelle già nella notizia.
  `valore` è breve («+550%», «15 → 66 $», «20 mesi»), `etichetta` dice cosa misura.
- **`approfondire`**: 2–3 voci, **ogni link aperto e verificato**, mai l'articolo della
  notizia (c'è già «Leggi su»). Il precedente storico, l'inchiesta originale, il podcast
  sull'argomento preciso — puntata specifica, mai la home.

**Asciutto.** Si legge sul telefono: le misure, che il lint controlla.

| Campo | Massimo |
|---|---|
| `titolo` | 80 caratteri |
| `punto` | 200 caratteri |
| `sotto` | 3 paragrafi da 450 |
| `numeri` | 3 |
| `voci` | 4, da 240 caratteri |
| `approfondire` | 3 voci, `perche` entro 70 |

Accorciare non autorizza ad arrotondare: «poco sopra il 60%» non diventa «al 60%», e la
stima della fonte di Jiemian non diventa la stima di Jiemian. **Non inventare nulla**, qui
più che altrove: ogni numero e ogni citazione devono stare negli articoli e nelle
discussioni letti. Si leggono **interi**. Tappe, «chi lo dice» e «cosa aspettarsi» non si
scrivono più: nelle edizioni vecchie restano nei dati, l'app non li mostra.

**Le visualizzazioni — il kit.** Il codice sta nell'app, l'edizione passa solo il tipo e i
numeri: dal database non arriva mai codice da eseguire. Almeno una per approfondimento,
quando c'è qualcosa da far vedere. Il lint respinge un tipo che l'app non conosce.

| `tipo` | Cosa mostra | Dati |
|---|---|---|
| `stime` | le stime nel tempo contro il dato vero (anelli e pallino pieno) | `punti: [{data, valore, tipo: stima\|dato, fonte}]`, `unita` |
| `barre` | grandezze a confronto, con le forchette min–max | `voci: [{etichetta, min, max, colore, nota}]`, `unita` |
| `resa` | una linea di montaggio: pezzi buoni e scarti, cursore della resa | `resa: 0.6`, `obiettivo`, `etichetta_obiettivo` |
| `esploso` | l'oggetto scomposto a strati, un tocco per strato | `strati: [{nome, nota, colore, stato: problema}]`, `invito` |
| `piega` | il Duo in 3D che si apre e si chiude, si trascina per girarlo | `interno`, `esterno`, `colori: [{nome, hex}]` |
| `anno` | l'anno come quadrante, con gli eventi e un obiettivo | `eventi: [{data, etichetta}]`, `obiettivo`, `centro` |
| `raggio` | una città di puntini: tocchi e il raggio avvisa chi c'è dentro | `raggio_km`, `lato_km`, `etichetta_raggio` |
| `flusso` | dove passano i soldi, oggi contro un'ipotesi | `oggi` e `agente`: `{etichetta, centro, incassa, nota}` |
| `onde` | la cancellazione del rumore: rumore, antirumore, quello che resta | — (pronta per la prima notizia sugli AirPods) |
| `densita` | i pixel visti da vicino, con un cursore per avvicinarsi e l'infrarosso che passa dai vuoti | `rapporto` (0,5 = metà densità), `zona`, `compensa` |
| `supporto` | uno schermo sul suo braccio, inclinabile, con le varianti (da banco, da parete) | `pollici`, `varianti: [{nome, base: semisfera\|piatta, nota}]`, `inclinazione` |
| `roadmap` | linee di prodotto per periodi: chip usciti, previsti, saltati (sul telefono diventa una linea del tempo) | `periodi`, `linee: [{nome, tappe: [{quando, chip, stato, nota}]}]` |
| `catena` | un processo passo per passo e la condizione che lo spezza (la patch, l'aggiornamento) | `passi: [{titolo, nota}]`, `rottura: {dopo, senza, etichetta, nota}`, `azione` |
| `chat` | una conversazione d'esempio che si scrive da sola | `contatto`, `messaggi: [{da: tu\|agente, testo, carrello, pulsante}]` |

Tutte vogliono `titolo` e `didascalia`, `fonte` quando i numeri vengono da qualcuno. Una
visualizzazione **illustrativa** lo dichiara nella didascalia («schema illustrativo»,
«puntini simulati»). I dati di `stime` si scrivono nell'edizione, non si prendono dal
registro: l'approfondimento deve stare in piedi da solo.

**Il visualista viene dopo la pubblicazione, mai prima.** Il 2 ottobre 2026 la corsa lo ha
aspettato 23 minuti prima di pubblicare e l'edizione è uscita con un'ora di ritardo. L'ordine è:
edizione scritta, immagini, lint, **`push.py`** (con i `visivi` vuoti) → visualista (chiamata
normale, non in background, senza `sleep` né `ListAgents` per aspettarlo; massimo 8 minuti) →
lint → `push.py`. Se il visualista non risponde in tempo, l'edizione è già
online senza grafici: meglio di un'edizione che non c'è.

**Il visualista.** Le visualizzazioni non le sceglie chi scrive l'edizione: le sceglie un agente
che fa solo questo, `.claude/agents/visualista.md`, chiamato dopo che gli approfondimenti sono
scritti. Il 1 ottobre 2026 Mike ha visto due «esploso» nella stessa edizione, uno su HomePad
dove non spiegava niente: «assicurati che siano sempre diverse e soprattutto adatte a
spiegare quello che stai spiegando». Il visualista parte da `python3 pipeline/visivi.py`
(ogni tipo con il suo **sì** e il suo **no**, cosa è uscito di recente) e segue tre regole:
la visualizzazione risponde alla domanda che a parole si capisce male; mai lo stesso tipo due
volte nella stessa edizione (il lint lo segnala); **se nessun tipo calza non se ne forza uno**,
si registra una richiesta con `visivi.py richiesta` e la notizia resta senza. Le richieste
aperte sono il lavoro per chi tocca l'app.

**Quando serve una visualizzazione che non c'è**, si costruisce nell'app: una funzione
`vis<Nome>` in `pipeline/template.html`, registrata in `VISUALS`, poi il tipo in `VISIVI`
dentro `lint.py` e una riga in questa tabella. Idee già pronte da fare quando arriverà la
notizia giusta: la resistenza del vetro, un chip che si scompone per core, la mappa dei
paesi di un lancio.

#### La vista Magazine — `citazione` e `editoriale`

Dal 2 novembre 2026 la scheda APPLE ha due vesti, e Mike passa dall'una all'altra con il
pulsante in testata (vedi *La vista Magazine* più sotto). La Magazine vuole due pezzi che la
Classica non mostra, e la corsa li scrive ogni mattina:

```json
"citazione": {"testo": "Con la magia di Siri AI, tutto si tiene in un modo che prima non eravamo in grado di offrire.",
              "chi": "Kaiann Drance", "dove": "vicepresidente marketing Home, Apple — a The Verge, 20 ottobre",
              "notizia": "homeview-sei-mesi-software",
              "contesto": "Perché HomeView esce con sei mesi di software indietro", "link": "…"},
"editoriale": {"titolo": "Le scatole sono pronte, l'intelligenza no",
               "testo": ["…", "…", "…"],
               "notizie": ["homeview-sei-mesi-software", "homepod-mini2-prova-pratica", "…"]}
```

- **`citazione`** — «L'ultima parola», la frase grande a metà del feed. Una persona con nome
  (Ternus, Gurman, Brownlee, un'analista, una recensora), mai «un utente»; una frase che
  cattura rispetto alla notizia e fa venire voglia di aprirla, entro 200 caratteri. Viene
  da una delle voci degli approfondimenti o dagli articoli letti, **nella lingua in cui è
  stata detta: mai tradotta** (Mike, 2 novembre 2026). Gurman in inglese, Galeazzi in italiano.
  `notizia` è l'id della notizia in cui porta: al tocco l'app apre quell'approfondimento
  dritto sulle voci. `contesto` è la riga che lo dice («Perché HomeView…»).
- **`editoriale`** — «Il punto», il commento della redazione: lo scrive Claude, e l'app lo
  firma come commento. **Non è un riassunto**: è il filo che tiene insieme le notizie del
  giorno e dice al lettore cosa significano — per chi compra, e per chi sta al banco.
  Titolo in graziato entro 70 caratteri, 2–3 paragrafi entro 480, `notizie` con gli id che
  collega (almeno due). Ogni fatto viene dall'edizione; l'opinione si dichiara come tale.
  Se l'edizione non ha un filo che valga un commento, non si scrive: meglio niente che un
  riempitivo.

Il lint avvisa se mancano e dà errore se puntano a notizie che non ci sono.

#### La plancia del mattino — `prossimo` e `borsa`

A destra della testata della Magazine ci sono tre riquadri (vedi *La plancia del mattino* più
sotto): il meteo di Milano, che l'app chiede da sola, e due che scrive la corsa.

```json
"prossimo": [{"titolo": "MacBook Pro", "data": "2026-11-06", "tipo": "lancio"},
             {"titolo": "HomeView", "data": "2026-11-13", "tipo": "lancio",
              "notizia": "homeview-sei-mesi-software"}],
"borsa": {"simbolo": "AAPL", "chiusura": 344.63, "variazione": -1.23, "data": "2026-10-30",
          "serie": [348.22, 347.73, 343.91, 347.1, 343.83, 348.91, 344.63], "fonte": "Yahoo Finance"}
```

- **`prossimo`**: il lancio o l'evento Apple **confermato** più vicino, con la data esatta — un
  prodotto che arriva nei negozi, un evento annunciato, un aggiornamento con la sua data. Mai
  un rumor: la plancia conta i giorni, e contarli verso una data che nessuno ha confermato
  sarebbe spacciarla per certa. **`titolo` è solo il nome**: il prodotto («MacBook Pro»,
  «HomeView») o l'evento («WWDC», «Keynote») — niente «Uscita», niente «in negozio», che
  fa credere a un paese (2 novembre 2026, Mike). Entro 14 caratteri, se no nel riquadro va a
  capo (il lint avvisa). `notizia` è l'id della notizia di oggi che ne parla (toccando il
  riquadro si apre), se c'è. **Il campo si porta avanti da un giorno all'altro**: la corsa
  riprende le voci di ieri, toglie quelle passate e aggiunge quelle nuove che l'edizione di
  oggi o l'archivio confermano (il MacBook Pro touch del 6 novembre stava nell'edizione del
  29 ottobre e il 2 novembre mancava: Mike se n'è accorto prima della corsa). Si scrivono
  tutte le date confermate in vista; l'app mostra la più vicina non ancora passata. Quando il
  riquadro cambia, il messaggio di chiusura lo dice in una riga, così Mike può correggere. Se
  non c'è niente di confermato in vista, il campo resta vuoto e il riquadro non esce.
- **`borsa`** la scrive lo script, dopo la scrittura e prima della pubblicazione:

```bash
python3 pipeline/borsa.py
```

  È la chiusura dell'ultima seduta conclusa di AAPL, con la variazione sul giorno prima e
  la curva degli ultimi sette giorni di borsa (Yahoo Finance). Non è un prezzo dal vivo, e la
  plancia lo dice («chiusura ven»). Se Yahoo non risponde lo script lo dice ed esce senza
  errore: il riquadro manca, la corsa no.

#### Controllo prima di pubblicare

```bash
python3 pipeline/threads.py sync && python3 pipeline/facts.py sync
python3 pipeline/lint.py
```

I due `sync` registrano fili e metriche nuove e ne ricopiano le etichette dentro le
edizioni — **vanno lanciati sempre**, altrimenti l'app mostra lo slug al posto del nome.

Prima del collaudo, la verifica delle fonti: `python3 pipeline/verify.py` (vedi *La verifica*).

`lint.py` collauda l'edizione contro le regole di questo file: campi obbligatori, rank
senza buchi, descrizioni senza un solo dato concreto, citazioni senza attribuzione,
doppioni, tono da creator, rumor senza previsione. **Anche fra un giorno e l'altro**: una
voce (notizie, AI, radar, banco, discussioni) con un link già uscito in una vecchia
edizione è un errore; un titolo molto simile a una voce dei tre giorni prima è un avviso,
a meno che le due non abbiano lo stesso `thread` — allora è un seguito dichiarato. Distingue **errori** (l'edizione è
rotta, si sistema prima di pubblicare) da **avvisi** (fuori misura, spesso voluto, ma
da guardare), ed esce con 1 se trova errori. Con `--links` controlla anche che ogni
indirizzo apra davvero.

Per i controlli più fini, che il lint non ripete:

```bash
python3 pipeline/threads.py check && python3 pipeline/claims.py check && python3 pipeline/facts.py check
```

#### Il gusto — come legge Mike, `taste.py`

**Dal 1 ottobre 2026 la rassegna impara da come si legge, non dai pollici.** Mike non li
premeva. L'app registra per ogni voce: se è arrivata a schermo (`v`), se è stata aperta
(`o`), quanti secondi è rimasta aperta e a schermo (`t`), se l'approfondimento è stato aperto
(`d`), se è stata ascoltata (`a`), se l'articolo è stato aperto alla fonte (`l`). Resta solo il
**pollice giù**, «Non mi interessa»: il segnale esplicito più forte.

I segnali stanno in **una riga al giorno per lettore** in `brief_marks` (chiave
`segnali/AAAA-MM-GG`, il JSON nel campo `note`): niente migrazioni, e la tabella non cresce
di una riga per voce. Due dispositivi sulla stessa giornata si sommano, non si sovrascrivono.
`taste.py` legge solo quelli del proprietario (`owner_id`): gli altri lettori non tarano niente.

| Segnale | Peso |
|---|---|
| pollice giù | −2 |
| vista e saltata (solo edizioni dei giorni prima) | −0,5 |
| aperta e chiusa subito | +0,25 |
| aperta e letta, 12 secondi o più | +0,5 |
| approfondita, ascoltata, aperta alla fonte, o letta 40 secondi o più | +1 |

Una voce mai arrivata a schermo non dice niente: non è un salto. Per l'archivio prima dei
segnali c'era solo «notizia aperta»: nei giorni in cui Mike ne ha aperta almeno una, le
altre notizie dell'edizione si contano come saltate (i titoli stanno in fila, li ha scorsi).

**Il metro è relativo.** Mike apre circa una notizia su tre, quindi «saltata due volte su
tre» è la media, non un rifiuto. Un gruppo (una categoria, un tag, una fonte) diventa regola
quando si legge sensibilmente meno — o più — della media della sua sezione: `MARGIN` in
`taste.py`, con la media di ogni gruppo tirata verso quella generale (`SHRINK`) perché tre
salti su un gruppo piccolo non bastino a condannarlo.

```bash
python3 pipeline/taste.py            # il digest, prima di scrivere
python3 pipeline/taste.py report     # il briefing, ogni 14 giorni
```

Gli assi sono sette: **categoria**, **tag**, **fonte**, **banco** (il genere: recensione,
video, confronto…), **lab** e **ai** (il laboratorio e il genere delle voci AI) e
**sezione**. L'asse `sezione` tiene onesto l'impianto: se «Se te lo fossi perso» si salta
sempre, la sezione non serve e va tolta, non difesa. Si giudica solo sui segnali di
lettura, non sui vecchi pollici.

Tre regole non negoziabili:

- **Si declassa, non si cancella.** Un pattern confermato manda la notizia in coda o nel
  radar. Non la fa sparire.
- **Il nucleo Apple non si tocca.** I segnali agiscono su contorno, ordine e radar. Se Apple
  prende una multa UE quella notizia entra, per quante volte si sia saltata la categoria.
  Nella sezione AI scelgono quale laboratorio e quale genere pesano di più, non se la
  sezione esiste.
- **Quello che non si è visto non conta.** Un salto vale solo su una voce arrivata a
  schermo, e servono almeno 3 voci con un segnale sullo stesso gruppo.

**Il radar impara per topic.** Ogni topic ha uno stato in `data/radar_topics.json`:

| Stato | Come ci si arriva | Cosa comporta |
|---|---|---|
| `nuovo` | mai mostrato | candidato per una sonda |
| `in prova` | mostrato, nessun verdetto | può tornare |
| `confermato` | +2 di scarto fra voci lette e pollici giù | casella fissa nella rotazione |
| `in pausa` | 1 pollice giù, o 3 uscite viste e saltate | torna fra 6 settimane |
| `archiviato` | 2 pollici giù | non torna |

**La pausa si sconta una volta sola.** Un pollice giù resta scritto per sempre, quindi
finita la pausa quel voto non rimanda più il topic in panchina: rientra `in prova` e ha
una seconda occasione vera. A bocciarlo è il *secondo* pollice giù. Lo stesso per le
uscite mute, che si ricontano da zero al rientro (`pausa_finita` e `seen_a_fine_pausa` nel
file tengono il segno). Senza questa regola il topic non tornava mai: ogni corsa rivedeva
lo stesso pollice giù e rimandava la scadenza di altre sei settimane.

Una voce del radar letta a fondo (articolo aperto, o approfondita) vale un **seguito il
giorno dopo**: il digest la segna come "da riprendere per forza". Fino al 30 settembre 2026
la pausa scattava dopo tre uscite *senza pollice*, e l'app non sapeva nemmeno se il radar
l'avevi letto: 21 topic su 35 erano in pausa per un silenzio che non era un no. Il 1 ottobre
sono rientrati tutti `in prova` (il campo `ripresa_segnali` segna il passaggio).

**Il briefing ogni 14 giorni** non è un rapporto da archiviare, è una conversazione: si
mostra cosa sta sparendo e perché, con due o tre titoli d'esempio di quello che è stato
declassato, lo stato dei topic e i voti che si contraddicono. Poi si chiede a Mike se
quello che è uscito gli manca. Il digest avvisa da solo quando è il momento.

### 3. Immagini

```bash
python3 pipeline/images.py
```

Legge l'og:image di ogni articolo fra i primi otto e di ogni voce AI, e la incorpora
nell'edizione come data URI. Quattro formati: 16:9 da 480px per le notizie dalla sesta in
giù e per il LAB, **800px per le prime cinque e 1280 per la notizia di apertura** (nelle
schede della Magazine a 480 si vedevano sgranate), e **quadrata da 240px per la cronaca AI**
(la miniatura di fianco al titolo). Incorporare invece di linkare serve perché le immagini
funzionino offline e perché la copia su Artifact le mostri — la sua CSP blocca ogni
richiesta esterna.

**Niente loghi sulle foto, niente foto sgranate** (2 novembre 2026, Mike: il «9TO5MAC» in un
angolo, la fascia di GSMArena col nome gigante). Per le prime cinque `images.py` prova la
notizia e poi le altre testate in `extra_links`, e tiene la prima foto senza marchio e larga
abbastanza (1100px d'origine per l'apertura, 700 per le altre); se c'è solo quella col
marchio, taglia la striscia in basso dove sta il logo (`WATERMARK`: i siti che firmano le
foto, con quanto tagliare). Stampa da dove ha preso la foto, se ha tagliato e se è rimasta
sgranata, e il lint lo ripete: una foto stretta fra le prime cinque si sostituisce prima di
pubblicare, con quella di un'altra testata della stessa notizia. Un sito nuovo che firma le
foto si aggiunge a `WATERMARK`.

480px perché sul telefono la foto occupa tutta la colonna (~341 punti): a 300px si vedeva
la sgranatura. Se un giorno cambi di nuovo il formato, `--refresh` riscarica anche le
immagini già presenti e `--all` lavora su tutto l'archivio; una fonte che non risponde
lascia al suo posto l'immagine vecchia invece di cancellarla.

```bash
python3 pipeline/images.py --all --refresh && python3 pipeline/push.py --all
```

Costo: circa 550 KB per edizione (400 prima delle foto grandi) — otto notizie, la foto grande di apertura, le schede LAB
e le miniature della cronaca AI. Fa un centinaio di MB l'anno, quindi `--prune` non è un
vezzo: toglie le immagini (notizie e AI) alle edizioni oltre i giorni indicati. Ogni tanto
alleggerisci l'archivio, poi ricaricalo:

```bash
python3 pipeline/images.py --prune 60 && python3 pipeline/push.py --all
```

### 3b. La voce degli approfondimenti — sospesa

**Dal 1 novembre 2026 la corsa non lancia `audio.py`.** Mike non ha mai usato *Ascolta*, e
il pulsante è stato tolto dall'app: produrre l'audio costava quattro minuti a corsa per
niente. Il modulo `Voice` dell'app e lo script restano, pronti: per riaccendere basta
rimettere un pulsante che chiami `Voice.play(brief, n)` e tornare a lanciare lo script qui.
Quello che segue racconta come funziona, per quel giorno.

```bash
python3 pipeline/audio.py   # sospeso: non lanciarlo nella corsa
```

Legge ad alta voce i cinque approfondimenti e ne fa file audio veri. **Dal 1 ottobre 2026 la
voce è Gemini** (Google AI Studio, modello `gemini-3.8-flash-tts`, voce «Kore»): Mike trovava
robotica la voce open source di prima (Piper «paola») e non vuole passare da Microsoft.
Serve la chiave `GEMINI_API_KEY`, in `.env.local` sul Mac e nell'ambiente della routine; il
livello gratuito basta. Un approfondimento è una richiesta sola, con un'istruzione di tono
da giornale radio (`GEMINI_STYLE`), scritta come un'unica frase che finisce con i due punti
e porta dritta al testo fra virgolette (`"Leggi con tono X: \"<testo>\""`) — è la sintassi
che Gemini TTS **non** legge ad alta voce. Scritta come paragrafo separato, Gemini la legge
come se fosse il primo paragrafo dell'approfondimento: è successo il 2 ottobre 2026, corretto
lo stesso giorno. Altre voci: `--voce aoede|leda|charon|puck`. Se la chiave manca o Gemini
non risponde, quell'audio si fa con Piper: non manca mai.

**Il campanello di chiusura** (dal 2 ottobre 2026): tre note in coda a ogni audio, Gemini o
Piper che sia — la richiesta di Mike per farlo sembrare davvero un'edizione radiofonica.
Sintetizzato in `append_jingle()`, non scaricato: tre toni puri con un filo di fade, nessuna
sigla esistente. Se cambi le note o i tempi, alza `RESA` come per ogni altra modifica al
modo in cui l'audio viene prodotto.

I file vanno nel bucket pubblico `brief-audio` di Supabase Storage e l'indirizzo finisce
nell'approfondimento (`audio`). Nell'app *Ascolta* suona quelli: continuano a schermo
bloccato, con i comandi sulla schermata di blocco, e non tacciono col telefono in silenzioso.
Se il file manca, l'app legge con la voce del browser; se c'è ma non arriva (niente rete),
lo dice e passa alla voce del telefono al tocco su ▶.

Circa quattro minuti per cinque approfondimenti, un MB ciascuno. Se il testo non cambia il
file non si rifà. L'impronta del testo (e della voce) sta **nel nome del file**
(`…/2026-09-30/<id>-<impronta>.m4a`): i file si tengono in cache per un anno, quindi un testo
corretto deve avere un indirizzo nuovo. La versione sostituita si toglie da Storage da sola.
Se cambi il modo in cui il testo viene detto (`speakable`, le pause), alza `RESA` in
`audio.py`. Se un approfondimento fallisce lo script esce con 1, e rilanciarlo rifà solo quello.

### 4. Pubblicazione sull'app sincronizzata

```bash
python3 pipeline/push.py
```

Carica l'edizione di oggi nella tabella `brief_editions` di Supabase. L'app la vede al successivo
avvio o cambio di scheda: **il file dell'app non va ritoccato**.

Subito dopo, l'alleggerimento automatico: ogni 15 giorni toglie le immagini alle edizioni
più vecchie di 15 giorni e gli audio a quelle oltre i 30, e le ricarica su Supabase (altrimenti l'app scarica troppi MB e
può andare in timeout senza avvisare). Ricorda l'ultima volta in `data/prune.json`, quindi
va lanciato **ogni giorno**: salta da solo se non è ancora ora.

```bash
python3 pipeline/prune_auto.py
```

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

Dal 9 novembre 2026 la fa una routine in cloud, col prompt in `routine/fonti-settimanale.md`:
lancia i controlli qui sotto, giudica, applica da sola solo quello che è sicuro e reversibile, e
scrive il rapporto in `docs/fonti/AAAA-MM-GG.md` con le decisioni da prendere in cima.

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
pipeline/missed.py       ripescaggio: le non date (copertura + trazione) e le perse da te (segnali)
pipeline/rubriche.py     le schede GAMES e SCIENZA: raccolta, punteggio, Gemini  ->  data/rubriche/
pipeline/ai_dossier.py   il dossier della scheda AI per l'agente `ai` (cronaca con gli articoli, LAB, storico, fronte)
pipeline/schede.py       il dossier delle schede Games e Scienza per l'agente `schede` (gli articoli aperti)
pipeline/attese.py       il registro dei giochi attesi (barre «In caricamento»)  ->  data/games/attese.json
pipeline/gta.py          il dossier di GTA VI per l'agente `gta` (Reddit, X, YouTube)  ->  data/gta/
pipeline/lab.py          Reddit AI + Show HN + fonti LAB + appunti  ->  data/lab/
                         (salta tutto quello che è già uscito in edizione)
pipeline/verify.py       la catena delle fonti: origini, riprese, parola di Apple
pipeline/eco.py          quanto gira una notizia fuori dalle nostre testate (Google/Bing News),
                         chi l'ha data per prima, e gli altri articoli da leggere (--leggi)
pipeline/audio.py        gli approfondimenti letti ad alta voce (Piper) -> Supabase Storage
pipeline/lint.py         il collaudo dell'edizione contro le regole di questo file
pipeline/accenti.py      gli accenti scritti con l'apostrofo (meta', gia'): li trova, --fix li corregge
pipeline/borsa.py        la chiusura di AAPL per la plancia della Magazine (Yahoo Finance)  ->  `borsa`
pipeline/feedcheck.py    salute delle fonti + ricerca di candidate nuove
pipeline/images.py       og:image  ->  data URI incorporati nell'edizione
pipeline/icon.py         disegnava app/icon.png (monogramma + pallini); dall'8 nov 2026 l'icona è
                         l'alba di Mike, in app/icone/ (chiara, scura, e il monogramma di prima)
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
data/verify/cache.json   gli articoli già letti da verify.py, per un mese
data/eco/                le risposte di Google/Bing News per giorno, riusate da verify.py
data/social/manual.md    dove incolli a mano i link da X e affini (anche quelli su GTA VI)
data/gta/                il dossier del giorno e la sezione scritta dall'agente (<giorno>-sezione.json)
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

## L'impaginato del Duo

Fra 601 e 1.039 punti di larghezza — lo schermo interno di iPhone Duo, in verticale e in
orizzontale, e per giunta l'iPad mini in verticale — la scheda **APPLE** è lista a sinistra
e notizia a destra, come Mail su iPad (31 ottobre 2026, chiesto da Mike, che il Duo ce
l'ha). Sotto i 600 resta il telefono, dai 1.040 le colonne del Mac: lì non cambia niente.
Solo la scheda APPLE, per scelta: AI e le rubriche restano a colonna unica.

Il codice è il modulo `Reader` in `pipeline/template.html`. Tre cose da sapere prima di
toccarlo:

- **La notizia si sposta, non si copia.** Corpo e pulsanti passano nel pannello e tornano
  nell'`<article>` quando ne scegli un'altra. Così approfondimento e appunti sono
  gli stessi oggetti, e i segnali di lettura — che si agganciano all'`<article>` con i
  pulsanti — contano una volta sola: il pannello è anch'esso un `<article>`.
- **Aprire e chiudere il telefono non perde il punto.** La notizia aperta a telefono
  chiuso finisce nel pannello quando lo apri; quella nel pannello resta aperta nella lista
  quando lo chiudi.
- **All'apertura il pannello mostra la prima pagina** (vedi sotto), non una notizia: niente
  conta come aperta né come tempo di lettura finché Mike non tocca qualcosa. Altrimenti la
  taratura crederebbe che la prima notizia la legge sempre.

**La prima pagina** (1 novembre 2026). Aprendo il Duo, l'apertura del telefono — pallini,
data, i tre titoli, l'intro — si prendeva tutta la prima schermata prima della prima notizia,
e Mike l'ha bocciata. Sul Duo quell'apertura non c'è più: la colonna di sinistra parte subito
con l'indice, in cima la voce **Prima pagina**, e il pannello di destra, finché non scegli una
notizia, mostra la prima pagina dell'edizione (`frontPage`): la data in grande; la fila dei pallini, uno per notizia, spenti quelli già letti; la
notizia d'apertura con il **sottopancia** televisivo sulla foto (fascia gialla, titolo su
nero — è un programma del mattino, e il riferimento grafico è la sua sigla); seconda e terza
affiancate; il quadro della giornata con la prima frase in nero. Ogni tocco apre la notizia
accanto; «Prima pagina» a sinistra ci riporta. La prima pagina non porta pulsanti né segnali:
non conta come lettura, e ha preso il posto dell'anteprima della prima notizia. Sul pannello
stretto (Duo in verticale) il sottopancia scende sotto la foto. Telefono e Mac non cambiano.

**Lo stile della lista**, seconda versione (1 novembre 2026, sera). La prima — pallini numerati
colorati, titoli in condensato sottile, il tag sotto — Mike l'ha trovata piccola, poco
leggibile, anonima, e con i colori che non tornavano (pallino giallo, tag rosso, barra
arancione sulla stessa voce). Ora:

- **due sezioni**: «In primo piano», le prime cinque (quelle con l'approfondimento), con la
  foto quadrata accanto al titolo; «In breve», le altre, solo testo;
- **i titoli nel carattere di sistema**, pieno e grande (semibold nelle prime cinque, medium
  nelle brevi): il condensato resta alle testate;
- sopra ogni titolo **il reparto** (Mac, iPhone, Mercato…): niente numeri, niente
  confermato/analisi/dati. Il giallo «rumor» resta, perché è un avvertimento;
- **un colore solo**: l'arancione di «sei qui», come la scheda attiva in testata — la barra
  verticale sulla voce aperta, il reparto che diventa arancione, e lo stesso reparto in
  arancione come occhiello del pannello. Niente fondo campito.

**Le sezioni sotto le notizie** prendono sul Duo una forma ciascuna, dal materiale che
portano (Mike: «così proprio scarne», 31 ottobre 2026): il **radar** è una griglia di
segnali a due colonne sotto barre blu, con il tema come occhiello (e la prima voce larga
quando sono in numero dispari); **sul banco** affianca alla cosa il foglietto giallo «Al
banco» con il campo `perche`; **se te lo fossi perso** mette il «quando» in grande sulla
barra arancione, come una linea del tempo; **nelle discussioni** sono fumetti campiti su due
colonne. Nel pannello non c'è la barra «Chiudi / Prossima notizia» dell'approfondimento: la prossima
si sceglie a sinistra, e Mike ha scartato anche una «Prossima» in fondo al pannello. Il margine della pagina sul Duo è 20 punti (`--gutter`), non il 4,5% pensato per
il Mac. Telefono e Mac restano a colonna di righe.

**Lo zoom non lo inganna.** Con la pagina rimpicciolita (Safari al 75%) il Duo dichiara più
di 1.040 punti e prendeva le colonne del Mac: è successo il 1 novembre 2026. Da allora
`Reader` guarda anche lo schermo, che lo zoom non cambia: uno schermo touch largo fra 601 e
1.039 punti nel verso in cui lo tieni è il Duo a qualunque zoom, e la classe
`html.duo-forzato` spegne le colonne del Mac.

**Il Duo aperto in verticale** ha un po' d'aria in più in cima alla testata (`.np-inner`, 2,6rem):
sotto la barra di sistema iOS sfuma il bordo alto della pagina, e il giorno a destra del logo
usciva «mezzo sfumato» (4 novembre 2026). Solo `(orientation:portrait)` fra 601 e 1.039 punti.
L'altezza che la barra di sistema occupa in cima (circa 96 punti sul Duo) è di iOS: la pagina
non ci disegna, e la barra delle sezioni, quando si scorre, si ferma sotto.

**Il Duo chiuso** (3 novembre 2026). Lo schermo esterno è largo circa 562 punti, quindi sta
nel telefono (sotto i 600). Lì, nella Magazine: il timbro con giorno, data e tre pallini sta a
destra del logo come sul Duo aperto, la plancia sotto a tutta larghezza con più aria, le righe
sottili (2 e 1 punto invece di 4 e 2); le sei pillole delle sezioni ci stanno tutte — si
rimpiccioliscono con la larghezza, il numero delle novità è un esponente, «Più tardi» è la
stellina, la lente passa nel menu come «Cerca»; la barretta di vetro dorme finché non cominci a
scorrere. Tutto dentro `@media (max-width:600px)`: **il Duo aperto non va toccato** (Mike: «è
perfetto, assicurati che nei cambiamenti non venga modificato alcunché»). All'apertura dalla Home
iOS a volte lascia la pagina qualche centimetro più giù fino al primo scorrimento: `assesta()` in
`MagNav` fa da sé quello scorrimento di un punto.

Per provarlo nel browser del Mac: l'emulatore di larghezza non manda alla pagina l'evento
di ridimensionamento, quindi dopo aver cambiato misura serve
`window.dispatchEvent(new Event('resize'))`. Un telefono vero lo manda da solo.

## Note di stile

Riferimento dichiarato alla sigla di *The Morning Show* (Elastic, art direction Hazel Baird):
fondo osso, campiture piatte, campo di pallini, condensato pesante, quattro colori saturi con
ruolo semantico. Il marchio in testata è tutto giallo. Se tocchi lo stile, resta dentro
questo sistema.


**La testata della Magazine** (2 novembre 2026). Nella Magazine il nome del giornale è
in cima, grande, come una testata vera: i tre pallini, *The Morning Brief* **ricalcato sulla
sigla** — il carattere di sistema nel peso più pesante (largo e massiccio, non il
condensato), le righe strette, THE e BRIEF grandi metà di MORNING, la O sostituita da un sole
poco più alto delle maiuscole — con **la falce azzurra** dell'orizzonte: sottile ai lati e
piena al centro, scura ai bordi e chiara in mezzo, parte prima della M e finisce sotto la
I — il logo a sinistra e, a destra, centrati in altezza sul logo, i tre pallini e la data
come un timbro (il giorno grande, la data sotto; sul telefono scendono sotto il logo) —,
davanti al sole che all'apertura **le sorge dietro come un'alba vera**: parte nascosto
sotto l'orizzonte, sale in quattro secondi abbondanti e passa dall'arancione al giallo (un
ritaglio tiene nascosta la parte ancora sotto la falce mentre sale); subito sotto
la data, una volta sola; poi una riga nera spessa. Prima la Magazine sembrava chiamarsi
«2 novembre», e il nome stava appiccicato nell'angolo. La testata grande scorre via; nella
barra che resta in cima compare allora il marchio piccolo e le sezioni si spostano.

**Le sezioni sono pillole** col pallino del loro colore (Apple arancione, AI rosso, Games
viola, Scienza azzurro, Più tardi la stellina: un colore per scheda, mai due simili — 5
novembre 2026, Mike: l'arancione di Apple e il giallo di Games si confondevano), e una **pillola nera scivola**
sotto quella attiva; nella barra stretta si rimpiccioliscono. A destra tre pulsanti: la
**vista** (Classica / Magazine, con la sua icona — un elenco puntato o quattro quadrati), la
**lente**, e **il menu** di vetro col pallino della sincronizzazione: Tema, Archivio, Diario,
Esporta e Importa gli appunti, Esci, con le parole scritte. Il menu si apre sotto il pulsante
se c'è posto, altrimenti sale finché sta tutto a schermo. Nella Classica la testata resta
quella di sempre.

**La stellina vuol dire «Leggi più tardi»** (2 novembre 2026, Mike: «la clicco se mi
interessa e al lavoro quell'articolo lo devo riprendere»). Nella Magazine c'è la scheda
**Più tardi** subito dopo Scienza, col numero, e dentro le notizie messe da parte come schede
che si aprono a tutto schermo. Nella Classica restano i Salvati nei tre puntini.

**La plancia del mattino** (2 novembre 2026). Nella Magazine, a destra del logo sotto la
data, tre riquadri che fanno «dal vivo» («qualcosa che dia live, quasi dei widget, visto che
è un'edizione del mattino», Mike): **il meteo di Milano** — sempre Milano — chiesto a
Open-Meteo (gratuito, senza chiave) all'apertura e ogni venti minuti, con l'icona disegnata
che si muove (il sole che gira, la luna con la sua stella, le nuvole che passano, la pioggia e
la neve che cadono, il lampo, il vento che soffia) e il pallino rosso del dal vivo — la riga
sotto dice **la cosa che conta oggi**: se piove, nevica, c'è nebbia o temporale, quello; se no
la pioggia probabile dal 40% («Pioggia 65%»), poi il vento (oltre 30 km/h o raffiche oltre 50,
«Ventoso»); solo se non c'è niente, il cielo con minima e massima; **Apple in borsa**, la
chiusura con il triangolo e la variazione; **il prossimo**, giallo pieno, i
giorni che mancano al lancio o all'evento più vicino, che toccato apre la notizia. Il modulo è
`Plancia` in `pipeline/template.html`. Un riquadro senza dati non esce. Sul Duo in verticale e
sul telefono la plancia scende sotto il logo, a tutta larghezza.

**Lo stile della plancia è la sigla, non un cruscotto** (2 novembre 2026, sera: «tutti e 3 sono
proprio Claude style, li vorrei più TMB style»). Riquadri piatti, angoli quasi vivi, nessuna
ombra né vetro: il meteo è campitura blu col sole giallo della O del marchio, il prossimo è
giallo pieno col numero in condensato pesante, **la borsa in negativo rispetto alla pagina**
(nero sull'osso, osso sul nero): AAPL, la chiusura grande, sotto il triangolo con la
percentuale nel suo colore. Niente grafico — la curva in stile widget Azioni di iOS l'ha
bocciata la sera stessa: «solo il numero grande, la percentuale col triangolino e AAPL. Stop».
Tutti e tre con lo stesso passo: etichetta, numero grande, riga sotto. I tre
pallini della sigla non stanno più soli nell'angolo: sono **un timbro verticale accanto alla
data**, come la firma del giorno. Il logo sta un filo dentro dal bordo (la T non tocca
l'angolo) e centrato in altezza fra il bordo in alto e la riga nera.

**La vista Magazine** (2 novembre 2026). Mike ha letto Apple News+ e se n'è innamorato: lo
stile, la pulizia, il ritmo. Il pulsante in testata (quattro quadratini / tre righe) passa
dalla vista **Classica** — quella del 1 novembre, salvata nel tag git
`app-amata-2026-11-02` — alla **Magazine**. **Dal 3 novembre 2026 c'è solo la Magazine**
(Mike: «via il pulsante, da domani solo modern»): il pulsante non c'è più e l'app si apre
sempre lì. La Classica resta nel codice, spenta: `VISTA_PULSANTE = true` in
`pipeline/template.html` riaccende il pulsante e la riporta; il suo stato amato è nel tag
`app-amata-2026-11-02`. Quello che segue sulla Classica vale per quel giorno. Solo la
scheda APPLE. Cosa prende da News+ e cosa no:

- **Schede su carta** (`--paper`) sul fondo osso, angoli tondi, ombra leggera. Il fondo
  grigio freddo e il bianco puro di Apple restano ad Apple: l'osso e i pallini sono nostri.
- **Una costruzione sola**: la testata nel condensato (la sua «voce»), il reparto, il
  titolo, e **sotto le due-tre righe della sintesi, intere** — la cosa che a Mike piace di
  noi e che a News+ manca: troppo spazio vuoto. La testata è **chi l'ha detta per primo**,
  da sola: il campo `origine` (es. «Bloomberg»), senza «via 9to5Mac» (tolto il 2 novembre
  2026). In fondo il piede: **da quanto è uscita** («3 ore
  fa», dall'ora in cui l'ha data la prima delle nostre testate: Mike lo preferisce
  all'orario), i cinque pallini e **il numero delle testate**, e
  **solo la stellina**: appunti e «non mi interessa» stanno nella notizia aperta. Su un
  `RUMOR` non si scrive mai «parola di Apple», anche se `verify.py` ha trovato una
  dichiarazione: le due cose si contraddicono (2 novembre 2026). Il titolo di una notizia
  letta non si sbiadisce.
- **Il ritmo**: «In apertura» grande, due affiancate, **«L'ultima parola»** su campitura
  piena, «In primo piano» con una scheda orizzontale, **«Il punto»** in graziato, «In breve»
  in due colonne. Poi le sezioni di sempre (Sul banco, discussioni, ripescaggio, radar).
- **La notizia si apre a tutto schermo** e scivola da destra, con il tasto «‹ Edizione» di
  vetro (modulo `Sheet`): come il pannello del Duo, sposta corpo e pulsanti dell'`<article>`
  della lista, quindi approfondimento, appunti e segnali restano gli stessi. Le schede
  portano la loro barra dei segnali (`card-foot.tools[data-sig]`): «vista» si conta sulla
  scheda, «aperta» al tocco.
- **Nella notizia a tutto schermo l'approfondimento è già aperto**, parte della notizia, senza
  pulsante (2 novembre 2026). Non conta come «approfondita» (`d`): non è un gesto di Mike.
  **Si torna indietro anche col dito**: trascinando la notizia verso destra ricompare
  l'edizione; oltre un quarto di schermo, o con uno strattone, si chiude. Un gesto verticale,
  o sopra un grafico o un carosello, non la tocca.
- **Il capolettera**: la descrizione della notizia aperta comincia con la lettera grande
  arancione, come «Il punto» (in rosso) e il testo dell'approfondimento. Vale in tutte e due
  le viste.
- **«Il punto»** è solo titolo e testo, giustificato, su due colonne pari: i link alle notizie
  e la firma facevano un muro di parole, e che sia il commento lo dice già l'intestazione.
- **«Sul banco»** nella Magazine prende la forma delle schede, tutte della stessa altezza: il
  genere come occhiello col suo pallino, «Al banco» dentro la scheda su un velo giallo, non
  più il foglietto giallo accanto («sembra un'altra rivista», Mike).
- **Nessuna foto più alta di 320 punti o del 40% dello schermo**: una scheda sola a tutta
  larghezza con la foto sopra diventava una foto grande quanto il Duo (HomePod, 2 novembre
  2026). Per questo la quinta notizia è un'orizzontale a specchio della quarta.
- **Le schede normali hanno la foto sopra**, a tutta larghezza; **le brevi sono solo testo**
  (le fotine nell'angolo erano «orrende»). Nelle sezioni in fondo (banco, perso, radar) il
  piede ha **solo la stellina**.
- **Le tre sezioni in fondo hanno ciascuna la sua forma**, perché l'occhio le riconosca
  prima di leggere (2 novembre 2026): **«Se te lo fossi perso»** sta su una linea del tempo
  — un righello degli ultimi dieci giorni con i pallini arancioni dove cadono le voci
  (impilati se sono dello stesso giorno) e la data sotto, e a sinistra di ogni voce **la data
  in cui è uscita, come un foglio di calendario** («27 / ott»), non un numero; **il radar** è un radar — un quadrante scuro con i cerchi e il fascio
  blu che gira, ogni voce un puntino numerato che si accende quando il fascio ci passa, con
  la scheda accanto; **le discussioni** sono un pannello scuro con la barra coi tre
  pallini e le piattaforme, e ogni discussione è un post a sé con l'avatar della sua
  piattaforma (r/ arancione per Reddit, Y per Hacker News, X) — voci diverse, non un botta
  e risposta, che entrano una dopo l'altra.
- **Altre chicche della Magazine** (2 novembre 2026, scelte da Mike fra sette proposte):
  «In breve» si apre con **la scritta che scorre del telegiornale** (fascia nera, etichetta
  gialla «Ultim'ora» col pallino rosso — non «In breve», che è già il nome della sezione —, i
  titoli che passano piano a 90 px al secondo, si ferma solo mentre ci tieni il dito sopra e riparte
da dove era; il titolo toccato apre la notizia. Lo muove `tickerRun()` con `requestAnimationFrame`,
non un'animazione CSS: con `:hover`/`:focus-within` il nastro, su touch, restava fermo per sempre
dopo un tocco — 4 novembre 2026);
  **«L'ultima parola» si scrive da sola**, lettera per lettera come una mano che scrive
  (circa 36 millisecondi a lettera), poi il cursore giallo lampeggia e arriva il nome; in **«Se te lo fossi perso»** una testina
  riavvolge il righello da «oggi» all'indietro e ogni pallino si accende quando ci passa;
  **la stellina vola** dalla scheda fino alla pillola «Più tardi», che sobbalza; nelle
  **discussioni** ogni post è preceduto dai tre puntini «sta scrivendo»; la foto di **«In
  apertura» respira**, con uno zoom lentissimo come una ripresa in studio — e così **tutte
  le foto della Magazine**, ognuna col suo passo, tanto piano che se non ci fai caso non si
  vede. I foglietti **«Al banco» sono vivi**: «Al banco» si sottolinea da solo a pennarello
  rosso quando arrivi, il foglietto è un filo storto, e scorrendo la pagina ondeggia e
  l'angolo in basso si solleva, come col vento (la velocità dello scorrimento in `--wind`,
  sulla sola lista del banco). In «Se te lo fossi perso» niente «6 giorni fa»: la data è già
  a sinistra. Scartata la barra di lettura per «Il punto»: sta in una schermata, non si scorre.
- **Il vetro** che Mike ha amato in News+: la barretta galleggiante in basso che salta fra
  le sezioni e dice dove sei, il tasto indietro, il menu dei «•••».
- Le chicche restano: le schede salgono quando arrivano, la data e la citazione entrano
  come una banda, la stella scoppia.

Sul Duo la Magazine occupa tutta la larghezza (niente lista e pannello); le sezioni sotto
tengono la loro forma da Duo. Se la prova non convince, si torna alla Classica col
pulsante, e se Mike vuole togliere la Magazine del tutto si ripristina il template dal tag.

**Le chicche** (1 novembre 2026). Mike ha visto i pallini della prima pagina che entrano e il
sottopancia che scorre, e li vuole «qua e là in tutto l'editoriale, senza che risultino
troppo». Il modulo `Motion` in `pipeline/template.html` ha un linguaggio solo, preso dalla
sigla: le cose **entrano come una banda** da sinistra (il titolo dell'approfondimento, i
titoli di sezione), **si accendono come pallini** (i tre dell'approfondimento, i dieci di
«quanto gira», lo scoppio di colori quando salvi) o **salgono di poco** (la notizia che
cambia nel pannello, il corpo che si apre sul telefono, i numeri, le voci, le foto che
sfumano). I numeri dell'approfondimento contano da zero; la lineetta sotto le schede scivola
da una all'altra col colore della scheda; il cambio di tema si allarga a cerchio dal
pulsante. **I pallini delle sezioni nella Magazine sono vivi** (2 novembre 2026): un'onda del
loro colore parte e si allarga, come il «dal vivo» della plancia, ognuno col suo passo.
Accanto ai titoli di sezione non ci sono più i commentini («la notizia che pesa di più», «le
altre con l'approfondimento»…, «orrendi»): restano solo «il commento della redazione» e «il
resto, in due righe». Nella Classica restano. Regole: ogni cosa parte **una volta**, quando ha superato **un margine dal basso**
(il terzo inferiore dello schermo non conta: chi scorre piano leggendo, quando arrivava con
gli occhi trovava l'animazione già finita — Mike, 2 novembre 2026); quello che sta in fondo
alla pagina o alla notizia aperta, e lassù non sale mai, parte quando si arriva in fondo. Le
animazioni in loop (radar, Ultim'ora, foto che respirano, vento) non aspettano niente.
**L'impaginato c'è sempre, dal primo istante**: schede, foto, titoli, riquadri non aspettano di
essere visti per esistere (2 novembre 2026, Mike davanti a uno spazio nero sotto «Ultim'ora»:
«sembra non abbia caricato la pagina»). Aspettano solo le cose che ci stanno sopra — i
pallini, le sottolineature, la testina, i numeri che contano — e il testo che si scrive da
solo: «L'ultima parola» lettera per lettera e **«Il punto» parola per parola**, con la scheda
già al suo posto, lo spazio già tenuto e un cursore che lampeggia finché non ci arrivi; nelle
discussioni i post ci sono con il loro avatar, e il testo arriva dopo i tre puntini; con «Riduci movimento» non parte niente; un elemento in attesa è trasparente, mai
ritagliato (ritagliato del tutto, l'osservatore non lo vede mai e resta nascosto). Una
chicca nuova si aggiunge a quel linguaggio, non ne inventa un altro.

## Fonti monitorate

**Primarie** (parlano di rado, ma è la parola di Apple e chiude i rumor invece di aprirne):
Apple Newsroom · Apple Developer

**Redazionali**: 9to5Mac · MacRumors · BGR · Macitynet · iSpazio · Tom's Hardware IT ·
The Verge · AppleInsider · iClarified (questi due dal 5 novembre 2026, iClarified in prova fino
al 19). The Verge passa dal feed Apple (`/rss/apple/index.xml`), che copre più di due giorni;
MacRumors dà sempre 20 voci e `fetch.py` completa la finestra con la sua mappa delle notizie
(`MAPPE`). Le motivazioni stanno in `docs/fonti/2026-11-05.md`.

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
