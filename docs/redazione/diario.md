# La redazione di TMB — diario dei lavori

Cosa è stato costruito, giorno per giorno, e quello che serve sapere per riprendere. Le decisioni
di Mike stanno in `progetto.md`; qui c'è il lavoro.

## 12 novembre 2026 — la prima sera

**La pagina**: `redazione/app/redazione.html`, pubblicata come artifact privato:
https://claude.ai/artifact/1bbSgKiM4HHmx2zTxUWhDK (stesso indirizzo a ogni ripubblicazione dello
stesso file: è l'indirizzo che Mike apre dal Mac).

**Cosa c'è (prova di look, primo angolo)**: un angolo della stanza in 3D con il look del video di
Mike e il tema TMB.

- Ettore, il redattore, alla scrivania: scrive a raffiche, ogni tanto si gira. Sul monitor il titolo
  d'apertura vero.
- Ivo, il revisore, in piedi con le bozze corrette a penna rossa: legge, poi alza gli occhi. Sul suo
  monitor un prima e dopo vero.
- Lo schermo gigante col marchio ricalcato dalla testata dell'app (THE / M-sole-RNING / BRIEF, la
  falce azzurra), la data, «in onda dalle 05:56» e il sottopancia con l'apertura; la spia IN ONDA.
- Il menabò di oggi sulla lavagna, con l'apertura cerchiata a pennarello, e i post-it.
- Il merchandising: le quattro tazze col sole, il cappellino, le edizioni stampate, la macchina del
  caffè, la lampada gialla, il tappeto tondo giallo (il sole), due prime pagine vere incorniciate.
- L'orologio a muro segna l'ora vera. Quattro luci da provare: alba, giorno, sera, notte.
- Tocco su una persona (o sull'etichetta «Guarda ▸»): la camera si avvicina e si apre la scheda con
  i fatti di oggi. Rotella per avvicinarsi, trascinamento per spostarsi, doppio clic per tornare.

**I dati** sono scritti dentro la pagina (oggetto `DATI`), presi da `redazione/stato/2026-11-12.json`.
Il passo dopo è farli arrivare da soli.

**La ricetta che ha funzionato** (provata nel browser, su Mac):

- Three.js 0.186.1 da jsDelivr con una `importmap` (`three` e `three/addons/`); dagli addons solo
  `RoundedBoxGeometry` e `RoomEnvironment`. Camera ortografica ferma, direzione (1, 0.8, 1).
- `NeutralToneMapping`; ambiente `RoomEnvironment` a 0,3; `HemisphereLight` a 0,55; una
  `DirectionalLight` a 2,4 che fa l'ombra. **Con valori più alti il pavimento si brucia e le ombre
  spariscono**: è stato il primo errore.
- Ombre: `PCFShadowMap`, mappa 4096, `shadow.radius = 11`, `shadow.intensity` 0,6, calcolate una
  volta (`autoUpdate = false`, `needsUpdate` quando cambia la luce). **Dopo aver cambiato i bordi
  della camera dell'ombra va chiamato `shadow.camera.updateProjectionMatrix()`**, se no resta il
  cono di default. `VSMShadowMap` con raggio 10 le sfuma fino a farle sparire: scartata.
- Le pareti non gettano ombra (`castShadow = false`): la luce entra come in un plastico.
- Tutto è fatto di forme semplici in codice (nessun modello esterno); schermi, lavagna, prime
  pagine e tazze sono `CanvasTexture`. I testi sopra la scena (etichette, scheda) sono HTML.
- La sera e la notte: `PointLight` senza ombre per la piantana, la lampada da tavolo e il chiarore
  dello schermo; i paralumi diventano emissivi.
- `window.redazione` è una maniglia per le prove: `redazione.guarda(x, y, z, zoom)`,
  `redazione.luce('sera')`, `redazione.apri('ivo')`.

**Per provarla in locale**: l'anteprima dell'app non può servire file dalla Scrivania, quindi la
pagina si copia nello scratchpad della sessione con in testa `<!doctype html><meta charset="utf-8">`
(su claude.ai lo mette lo scheletro) e si serve da lì con `python3 -m http.server` (configurazione
`redazione` in `.claude/launch.json`, che non è nel repository).

**Anche oggi**: i nomi e il prima/dopo del revisore in `redazione/stato.py`; le due modifiche alla
corsa (`revisione.py` archivia in `data/revisione/`, `costo.py` salva gli orari); il prima/dopo del
12 novembre ricostruito dai commit (Ivo, al debutto: 11 testi riscritti).

**Il passo dopo** (quando Mike ha detto cosa cambiare del look): la stanza intera con tutti e nove,
i dati dallo stato del giorno, la frase di benvenuto, la conversazione con gli agenti («come una
persona vera», `progetto.md` §9) e la giornata di 24 ore (§5).

## 13 novembre 2026 — la seconda prova, dopo gli appunti di Mike

La corsa del mattino è andata bene con le due aggiunte del 12 sera: 30 minuti, edizione uscita alle
6:00, `data/revisione/2026-11-13.json` scritto dalla corsa (10 testi riscritti), `inizio` e `fine`
di ogni agente e `passi` in `corse.json`.

**La pagina** (stesso indirizzo, versione 2) è stata riscritta sugli appunti di Mike (`progetto.md`
§3). Sempre un angolo, con Ettore e Ivo:

- **il fondale**: solo marchio e visual (il sole dietro la falce, il campo di pallini), niente data
  né notizie; via la spia «in onda»;
- **il conto alla rovescia** verso le 6:00 (ora di Roma), a tessere; nell'ultima mezz'ora diventa
  rosso e dice «si chiude l'edizione». L'ora di uscita è `DATI.prossimaUscita`;
- **New York** dalla finestra, disegnata per alba, giorno, sera e notte (Empire State, Chrysler, One
  World Trade Center, le cisterne sui tetti, le finestre accese);
- **la lavagna** come studio in corso, scritta a mano: l'apertura cerchiata, una correzione vera di
  Ivo, i minuti delle ultime sette corse col tetto, le voci aperte da Mike per edizione
  (`data/taste.json`), chi passa le carte a chi con gli orari veri, due foto appuntate, quattro
  post-it con numeri veri;
- **sei manifesti** sulla storia di Apple, disegnati in canvas: Macintosh 1984, Think different
  1997, iMac 1998, iPod 2001, il primo Apple Store 2001, iPhone 2007;
- **gli iMac** con tastiera e mouse; il mobiletto con la stampante; il cestino; l'annaffiatoio;
- **le persone** rifatte con proporzioni adulte e giunture (spalla, gomito, anca, ginocchio), il
  busto è un solido tornito (`LatheGeometry`);
- **le etichette** sono piccole (solo il nome) e si allargano al passaggio del mouse;
- **la luce «Adesso»** segue l'ora di Roma; restano i quattro pulsanti per provare le altre.

**La vita.** Un giro di 168 secondi, legato all'orologio (`Date.now() % GIRO`): ricaricando si vede
la stessa scena. Ettore scrive, va a prendere il caffè con la sua tazza, butta una bozza nel
cestino, riceve le correzioni, va alla lavagna. Ivo segna le bozze, stampa, porta il foglio a
Ettore, riordina la scrivania, annaffia la pianta. La scheda dice «In questo momento» con le stesse
parole dell'orologio della scena.

Come è fatto: ogni persona ha una `Traccia` di segmenti (`seduto`, `alza`, `va`, `sta`); ogni
segmento, dato il tempo, mette la persona al suo posto e in posa, senza stato: si può saltare a
qualunque secondo. Una posa è un elenco di angoli (`IN_PIEDI`, `SEDUTO`, `passo()`), e fra due pose
si sfuma con `mix`. `inMano()` tiene dritti gli oggetti portati. Per aggiungere un gesto: un
percorso (punti `[x, z]` che girano intorno ai mobili) e un segmento nella traccia, controllando che
i due non si incrocino negli stessi secondi.

**Per le prove**: `redazione.tempo(52)` ferma la scena a quel secondo del giro (`null` la fa
ripartire), `redazione.tempi()` dà i secondi degli eventi, `redazione.guarda(x, y, z, zoom)` sposta
la camera.

**Due cose imparate.** Con `globalCompositeOperation = 'source-in'` ogni riempimento cancella il
resto della tela: per colorare a strisce una sagoma serve `source-atop`. E il browser di prova,
quando il pannello è nascosto, non fa girare `requestAnimationFrame`: la pagina ora disegna subito
il primo fotogramma, e ridisegna subito dopo un ridimensionamento.

## 13 novembre 2026, pomeriggio — la terza prova: i personaggi scolpiti

Mike ha mandato una tavola di statuine 3D da redazione come traguardo per i personaggi
(`progetto.md` §3; l'immagine è in `riferimenti/`, solo sul Mac). La pagina (versione 3, stesso
indirizzo) li rifà così:

- **lo scalpello**: `fondi`, `scava`, `uovo`, `tubo` sono funzioni di distanza; `scolpisci(sdf,
  centro, mezzo)` riempie il campo di `MarchingCubes` (addon di three, risoluzione 72, usato solo
  come calcolatore: non entra in scena) e ne ricava una geometria con le normali. Così la testa
  (`cranio`: cranio, mandibola, guance, orecchie, naso, collo) e i capelli (`CHIOME.onda`,
  `CHIOME.stempiato`: calotta, volumi, viso e orecchie scavati, solchi del pettine) sono forme
  fuse, non sfere accostate. Una chioma si scolpisce una volta e si riusa;
- **il viso** (`viso`): occhi neri lucidi con due riflessi, sopracciglia, sorriso, guance rosate
  (un disco trasparente sfumato), occhiali e baffi a richiesta. Gli occhi battono le palpebre;
- **il vestito** è disegnato sul busto tornito (`vestito`, `VESTITI`): il davanti del busto sta ai
  due bordi della tela, quindi gli aiutanti `davanti`, `scollo`, `bordoScollo`, `bottone` disegnano
  due volte, a specchio. Per ora: `quadri` (camicia a quadri su maglietta) e `cardigan` (con
  camicia azzurra nello scollo);
- **le proporzioni** da statuina (testa scalata 1,12, tre teste e mezza): per questo le scrivanie
  sono a 0,70 (`TAV`) e le sedute a 0,415 (`SED`), il passo è più corto e i punti dove ci si ferma
  sono più vicini ai mobili;
- **il primo piano** nella scheda (`primoPiano`): un secondo `WebGLRenderer` su una tela piccola
  disegna la stessa scena con una camera prospettica a tre quarti, dal lato aperto della stanza; se
  la persona ha il viso contro una parete la riprende di profilo. Ha il suo ambiente (`env2`),
  perché quello dell'altro renderer non si può condividere.

**Un personaggio nuovo** è una riga: `persona({ id, vestito, chioma, pelle, capelli, calzoni,
scarpe, occhiali?, baffi? })`. Servono una chioma (una funzione in `CHIOME`) e un vestito (una voce
in `VESTITI`).

**Quanto ci si avvicina.** Il riferimento è un'immagine finita, con luci e materiali da rendering;
questi sono modelli che si muovono dal vivo, fatti in codice. Lo stile c'è (testa grande, occhi,
capelli a volumi, vestiti riconoscibili); il dettaglio fine (pieghe dei tessuti, ciocche, mani con
le dita) no. Per arrivarci servono modelli scolpiti veri in formato GLB, con l'ossatura: la pagina
li può caricare come file accanto, al posto di `persona()`.

## 13 novembre 2026, sera — la quarta prova: tutta la redazione

Mike, visti Ettore e Ivo scolpiti: «Sì, continua così». La pagina (versione 4, stesso indirizzo) ora
è la stanza grande con tutti e nove.

**La pagina si scrive a pezzi.** `redazione/src/` tiene ventisei pezzi in ordine di nome;
`python3 redazione/costruisci.py [AAAA-MM-GG]` li incolla in `redazione/app/redazione.html` e al
posto di `/*__STATO__*/` mette lo stato del giorno (`redazione/stato.py`). I pezzi `.js` stanno
tutti dentro la stessa funzione `avvia()`: si vedono fra loro, non sono moduli. **Non si modifica
più `redazione.html` a mano**: si tocca il pezzo e si ricompone.

| Pezzo | Cosa c'è |
|---|---|
| `00-testa.html`, `99-coda.html` | stile, markup, importmap |
| `05-dati.js`, `08-avvio.js`, `10-mattoni.js` | lo stato, il renderer, i mattoni (box, tela, marchio) |
| `20-tele.js` … `26-cartelli.js` | le tele: fondale, schermi di ognuno e della regia, lavagna, manifesti, bacheca |
| `30-stanza.js`, `40-mobili.js`, `42-angoli.js` | pareti e arredi, scrivanie e anello della regia, bacheca, archivio, tavolo di Mike |
| `50-persone.js` … `56-volti.js` | lo scalpello, le chiome, i vestiti, i posti, l'aspetto dei nove |
| `60-strade.js` … `68-vita.js` | la mappa e le strade, i gesti, il copione, la giornata, la scena a un dato secondo |
| `70-luci-camera.js` … `90-giro.js` | luci, camera, etichette e schede, comandi, il ciclo |

**Niente più numeri scritti a mano.** Schermi, lavagna, bacheca, benvenuto e schede leggono `STATO`:
i titoli, gli orari di entrata e uscita di ognuno, i minuti delle ultime corse, le letture di Mike,
la correzione di Ivo (la lavagna mostra le parole cambiate nel primo titolo ritoccato), i post-it,
i giorni all'uscita di GTA VI. `stato.py` ha in più `letture`, `gta` e `corsa.ora_uscita`.
**La pagina mostra il giorno con cui è stata composta**: se Mike la apre un altro giorno, il
benvenuto lo dice («l'ultima edizione che vedo…»). Il passo che manca è ricomporla e ripubblicarla
ogni mattina da sola.

**La stanza** (11,6 × 8,6): parete di fondo con fondale e credenza, galleria e conto alla
rovescia, stampante, manifesto di GTA VI; parete di sinistra con finestra, lavagna, **bacheca di
sughero «Per Mike»** (i post-it veri: si tocca e si apre l'elenco), **archivio di Zeno**. In mezzo:
la fila della prosa (Tobia, Ettore | Ivo, Lea), **la regia** (un anello aperto verso di noi, cinque
iMac: tre li vediamo di fronte con edizione, corsa, macchine), l'isola di destra (Vito sotto il suo
manifesto, Ada e Rita faccia a faccia), **il tavolo di Mike** con il segnaposto.

**I sette nuovi.** Chiome in `52-chiome.js` (`caschetto`, `frangia`, `spettinato`, `ricci`,
`lunghi`, `corti`, `pelato`; una chioma può dichiarare il suo volume con `{centro, mezzo, f}`), due
barbe (`barbaGeo`: la testa gonfiata di poco e tenuta solo intorno alla mandibola), vestiti in
`53-vestiti.js` (`giacca`, `denim`, `dolcevita`, `maglione`, `righe`, `bomber`, `gilet`) e accessori
(orecchini, spilla, cuffie, cerchietto, farfallino). L'aspetto di ognuno è una riga in `ASPETTO`
(`56-volti.js`). **Zeno c'è solo il lunedì** (`LUNEDI`; per provarlo: `?lunedi=1` in fondo
all'indirizzo, in locale); gli altri giorni resta la targhetta «torna lunedì», che si tocca.

**Le strade si trovano da sole.** `60-strade.js` chiude su una griglia da 10 cm le caselle dei
mobili (con 20 cm di margine) e `strada(da, a)` cerca il percorso (A*) e tiene solo le svolte. Un
mobile nuovo va aggiunto anche lì (`rett`, `tondo`), se no ci passano attraverso.

**Il copione** (`64-copione.js`): `attore(id, gestoDiBase, nota)`, poi `parte(c, T, nota)`,
`cammina(c, punto, verso)`, `fa(c, secondi, gesto)`, `rientra(c)`; `caffe(c, T)` e
`allaStampante(c, T, foglio, nota)` sono già pronti. `guardami(id, t0, t1, dove)` fa alzare gli
occhi a chi lavora quando qualcuno gli si avvicina. Il giro dura 300 secondi (`66-giornata.js`):
cinque caffè sfalsati, Rita e Ivo alla stampante, Ivo da Ettore e alla pianta, Ettore e Olivia alla
lavagna, Olivia da Ettore e da Lea, Lea in bacheca, Tobia alla finestra, Vito da Rita, Ada alla regia.

**Per provare** (`window.redazione`): `tempo(s)` ferma la scena a quel secondo, `guarda(x, y, z,
zoom)` e `casa()` muovono la camera, `apri(id)` + `grande()` mostrano il primo piano a tutto
schermo, `orario()` dà gli orari di ognuno, e **`controlla()` passa tutto il giro e dice chi cammina
dentro un mobile e chi si pesta i piedi**: deve tornare vuoto. Schermate: `prova/schermate/look-4-*`.

**Quanto pesa.** Circa un milione di triangoli e 860 chiamate; si accende in due secondi. Sul Mac
va; se un giorno servisse alleggerire, le chiome a risoluzione 56 e l'ombra a 2048.

## 13 novembre 2026, sera — la quinta prova: si parla con la redazione

Mike: «Sì, la conversazione». La pagina (versione 5, stesso indirizzo) dichiara la capacità
`sample` e nella scheda di ognuno c'è **«Parla con …»**.

**Le carte** (`redazione/carte.py`, chiamato da `stato.py`, campo `carte` dello stato): per ogni
agente un testo semplice con il suo lavoro vero del giorno. Olivia: la corsa, la scaletta, le sue
sezioni, le macchine, le letture di Mike. Tobia: per ogni notizia quante testate, quali lette, da
dove viene. Ettore: i suoi pezzi (righe, descrizioni delle prime cinque, «Il punto») e cosa gli ha
corretto Ivo. **Ivo: le correzioni parola per parola** (`ritocchi`: `difflib` sulle parole, il
cambio fra parentesi quadre con cinque parole intorno; per i titoli anche il prima e il dopo
interi). Lea: i grafici di oggi, le notizie senza, le richieste aperte. Ada, Rita (con le voci
scartate dalla rosa), Vito: le loro voci. Zeno: l'ultimo rapporto. Al massimo 14.000 caratteri a
testa. Si legge soltanto, e se le carte non si compongono lo stato esce lo stesso.

**La conversazione** (`src/82-parla.js`). Claude non ricorda niente fra un messaggio e l'altro: a
ogni domanda la pagina manda un primo turno con `regole(id)` (chi è, il carattere, il suo incarico
vero dal file dell'agente, l'ora, cosa ha consegnato, cosa sta facendo in scena, le carte, i suoi
post-it, come rispondere) e poi gli ultimi 16 turni. Le regole che contano: solo i fatti delle
carte, «non lo so» è una risposta; **non ricorda cosa pensava stamattina**, ragiona adesso sulle
carte e lo dice; non può cambiare l'edizione né promettere che domani sarà diverso; un'indicazione
di Mike per ora resta nella conversazione. Per far vedere un testo cambiato scrive due righe
«PRIMA:» e «DOPO:», che la pagina mostra come una correzione (`scriviIn`).

- Livello del modello: `modelTier: 'default'` per tutti (Mike non ha ancora scelto; si cambia lì).
- Le conversazioni del giorno restano nel browser (`localStorage`, chiave col giorno): comodità di
  chi guarda, non un archivio. L'archivio delle decisioni (collezione `db`) è il passo dopo.
- Fuori da claude.ai la conversazione non c'è e la scheda lo dice. **Per provare la scheda in
  locale: `?finto=1`**, risponde un pappagallo (anche con un PRIMA/DOPO).
- Gli errori hanno ciascuno la sua frase (`SCUSA`); quelli definitivi spengono il campo.
- Zeno, quando non c'è, non risponde: «gli parli lunedì».

**In scena** (`versoMike` in `62-gesti.js`, `ascolto`): chi è al suo posto e viene interpellato
gira la sedia verso di noi (chi è in piedi si volta), toglie le mani dalla tastiera; mentre
aspetta la risposta porta la mano al mento («Ci pensa»), mentre arriva gesticola («Ti risponde»).
Se è in giro per la stanza continua quello che fa e la scheda dice «ti risponde da lì».

**Provato e non provato.** In locale, col pappagallo: apertura, spunti, invio, risposta che
arriva a pezzi, «Ferma», ripresa dopo aver ricaricato, PRIMA/DOPO, le pose. **Non provata la
risposta vera di Claude**: si può fare solo aprendo la pagina su claude.ai (al primo messaggio
chiede il permesso). Lo stato del giorno ora pesa 87 KB, la pagina 261.
