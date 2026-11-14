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

## 14 novembre 2026 — la sesta prova: il registro delle decisioni

Mike: «Sì, le decisioni». La pagina (versione 6, stesso indirizzo, composta con l'edizione del 14)
dichiara anche la capacità `db`.

**Dove stanno.** Nell'archivio della pagina, collezione `decisioni`, un documento per decisione:

```json
{"agente": "visualista", "tipo": "preferenza", "testo": "…", "quando": "2026-11-14T08:12:00Z",
 "giorno": "2026-11-14", "origine": "conversazione", "stato": "aperta", "postit": "visivi-…"}
```

`agente` è l'id di chi la riceve, o `tutti`. `tipo`: `preferenza` (un gusto di Mike), `regola` (una
cosa che la corsa dovrebbe fare diversamente), `incarico` (un lavoro per chi costruisce). `origine`:
`conversazione` o `registro` (annotata a mano). `postit` c'è quando risponde a un post-it della
bacheca. **Una sessione di lavoro le legge con lo strumento `ArtifactData`** (`action: "list"`,
`collection: "decisioni"`, l'indirizzo della pagina): è così che una regola o un incarico arrivano a
chi li può fare. La corsa del mattino non le legge.

**Come nascono** (`src/84-registro.js`, e le regole in `82-parla.js`):

- parlando: chi risponde, se Mike dà un'indicazione che deve valere anche dopo, chiude con una riga
  «DECISIONE [tipo]: …». La pagina la mostra come un foglietto tratteggiato con **«Salva nel
  registro»**: finché Mike non lo tocca non è salvata. Una già nel registro mostra «Nel registro ✓»;
- a mano: nella scheda del registro, scegliendo per chi è e di che tipo;
- da un post-it: ogni post-it ha «Rispondi a …» (apre la conversazione già sull'argomento, e la
  decisione che ne esce porta l'id del post-it) oppure, se chi l'ha lasciato oggi non c'è,
  «Annota la tua decisione» (apre il registro già compilato).

**Dove si vedono.** Sul tavolo di Mike c'è **il registro**, un libro verde: si tocca il tavolo (o
l'etichetta, che porta il numero) e si apre l'elenco, dal più recente, con «Ritira» in due tocchi.
Nella scheda di ognuno, «Deciso con …». E soprattutto **le ritrova chi le ha ricevute**: entrano
nelle sue regole a ogni domanda («Le decisioni che Mike ha già preso con te»), con la consegna di
rispettarle e di dire chiaro che la corsa non le legge ancora.

**Cose tecniche.** Un solo ascolto sulla collezione (`onSnapshot`, ordinata per `quando`, 300 al
massimo), con il timer di dieci secondi per dire «tarda a rispondere»; chi cambia qualcosa lo fa
sapere con `quandoCambiaRegistro`. Regole d'accesso predefinite: la pagina è privata, scrive solo
Mike. **In locale `?finto=1`** dà anche un registro di prova nel browser.

**Provato e non provato.** In locale, col registro di prova: il foglietto nella risposta, il
salvataggio, l'etichetta col numero, l'elenco, l'annotazione a mano partita da un post-it, il
ritiro, le decisioni che entrano nelle regole di chi le riceve. Dopo la pubblicazione ho letto la
collezione vera con `ArtifactData`: risponde, ed è vuota. **Non provata la scrittura vera dalla
pagina**: la fa Mike su claude.ai alla prima decisione.

## 14 novembre 2026, mattina — la redazione si aggiorna dall'archivio

Mike: «si deve aggiornare in tempo reale, quando l'edizione esce tutti lo sanno». La pagina
(versione 7) non dipende più dal giorno in cui è stata composta:

- **all'apertura** (`src/05-dati.js`) chiede all'archivio il documento `stato/corrente` (lo stesso
  JSON di `redazione/stato.py`) e, se è più nuovo dello stato di composizione (`STATO_FISSO`,
  confronto su `scritto`), parte da quello. Aspetta poco (2 secondi l'archivio, 2,5 la lettura):
  se non risponde parte con quello che ha;
- **mentre è aperta** ascolta lo stesso documento: quando ne arriva uno più nuovo compare la fascia
  gialla «È uscita l'edizione di …» e la pagina si ricarica da sola, se non c'è una scheda aperta
  né una risposta in arrivo; altrimenti c'è il pulsante «Aggiorna la redazione». Una sola
  ricarica automatica per stato (`sessionStorage`), così non può andare in ciclo.

**Per aggiornare la redazione basta quindi scrivere lo stato nell'archivio**, senza ricomporre né
ripubblicare: `python3 redazione/stato.py <giorno>` e poi `ArtifactData` con `action: "set"`,
`collection: "stato"`, `doc_id: "corrente"`, `file_path: redazione/stato/<giorno>.json` (su un
documento che esiste già serve `if_version`, quello dell'ultima lettura). Fatto a mano il 14
novembre, e riletto: l'archivio ha lo stato del 14. Uno stato si accetta solo se è completo
(`valido`: corsa, agenti, lavagna, schermo, macchine): a metà corsa non si scrive.

Nel benvenuto ora c'è anche il promemoria «Nel registro hai N decisioni».

**Quello che manca è chi lo scrive da solo**, e chi porta le decisioni alla corsa: serve che una
sessione in cloud arrivi all'archivio (`ArtifactData`). La routine del mattino gira in modalità
automatica con gli strumenti di base; usa già strumenti fuori dal suo elenco (`PushNotification`),
quindi l'elenco non è un limite, ma se `ArtifactData` ci sia è da provare con una routine a parte.

## 14 novembre 2026 — la redazione collegata alla corsa, da sola

Mike: «o che tu prima della stampa mattutina, in automatico vada a leggere cosa è stato deciso.
Ancora meglio». E ha detto sì a un'automazione in cloud accanto a quella del mattino.

**La prova.** Una routine di una volta sola ha mostrato che **da una sessione in cloud
`ArtifactData` c'è** (è differito: si carica con `ToolSearch`, `select:ArtifactData`) e arriva
all'archivio della pagina di Mike in lettura e in scrittura. Sedici secondi.

**La routine**: «The Morning Brief — la redazione: registro e modellino»,
`trig_01KDe8UemP2NtpCnuZwnZsQE`, ogni giorno alle **04:15, 05:15 e 06:15 UTC** (5:15, 6:15, 7:15
con l'ora solare). Il suo prompt è `routine/redazione-registro.md`. Non ha connettori, non manda
notifiche. Fa due lavori, tutti e due senza effetto se non c'è niente di nuovo:

1. **le decisioni arrivano alla corsa**: legge la collezione `decisioni`, la passa a
   `pipeline/decisioni.py --importa`, che rifà `data/redazione/decisioni.json` e dice CAMBIATO o
   UGUALE; se è cambiato fa commit e push su un branch `claude/decisioni-…`, che il workflow unisce
   a `main`. Il giro delle 04:15 UTC sta 19 minuti prima della corsa (04:34 UTC);
2. **il modellino si aggiorna**: legge `stato/corrente`, lancia `redazione/aggiorna.py`, che
   compone lo stato dell'ultima edizione e dice SCRIVI, UGUALE o INCOMPLETO; se serve lo scrive
   (con `if_version`). INCOMPLETO finché la corsa non ha chiuso il suo conto in `data/corse.json`:
   quindi il modellino cambia dopo «Fine corsa», non a metà.

**Nella corsa.** `mattino.py` stampa le decisioni in fondo alla raccolta, per la regia (che passa
al lettore le sue). Redattore, revisore, visualista, `ai`, `schede` e `gta` hanno nel loro file,
come secondo paragrafo, la riga che gli fa lanciare `python3 pipeline/decisioni.py --per <id>`
(il primo paragrafo resta la loro voce: lo legge `stato.py`). Arrivano `preferenza` e `regola`;
gli `incarico` no. Chi non è un agente della redazione viene ignorato. Se il file manca o è rotto
nessuno stampa niente: la corsa va come sempre.

**Nel registro** ogni decisione dice dov'è: «Letta dalla corsa ✓» (il suo id è in
`STATO.registro.ids`, cioè era nel file quando è stato composto lo stato), «La corsa la legge
domattina», oppure «Per chi costruisce l'app».

**La prova di tutto il giro** (14 novembre, 08:37 UTC): una decisione finta per un agente che non
esiste, la routine lanciata a mano. In 19 secondi: importata, spinta, unita a `main`, stato
scritto nell'archivio (versione 2). Poi la decisione finta è stata tolta e la routine rilanciata
per ripulire il file.

**Da sapere.**
- Per lanciarla a mano: `RemoteTrigger` con `action: "run"` e il suo id; il registro di un giro
  con `list_runs` e `get_run_log`.
- Se un giorno si sposta l'orario della corsa del mattino, questa va spostata insieme: un giro
  deve stare prima della corsa e uno dopo la fine.
- Le decisioni finiscono in un file del repository, che è pubblico.
- È rimasta la routine della prova, «TMB redazione — prova tecnica (una volta sola)»: è già
  spenta da sola, e si cancella solo da claude.ai/code/routines.
- Il modellino si aggiorna a ore fisse, non al minuto: un aggancio al push su GitHub
  (`create_webhook_trigger`) lo renderebbe immediato. Non provato.
