# La ricerca sulla redazione — la sintesi

11 novembre 2026, sera. Sette ricercatori (cinque sui temi generali, un sesto sugli «Agents Office» di YouTube, un settimo sul look del video) hanno
letto in tutto più di un centinaio di fonti: uffici di agenti già fatti, strumenti per osservare gli
agenti, redazioni vere e giochi, tecnica e stile, conversazione con gli agenti. In più il video che
Mike ha mandato. I rapporti interi sono in questa cartella (`0-` … `6-`); qui c'è quello che conta,
già passato al setaccio della regola **«tutto quello che si legge è vero»**.

**Dopo il 12 novembre.** Mike ha deciso: **niente moviola né differita** come modo di vivere la
stanza (la redazione lavora 24 ore, in modo realistico: `progetto.md` §5), agenti **con un nome**,
e ogni agente **come una persona vera** col suo lavoro sulla scrivania (§9). Dove questa sintesi
propone la moviola o i soli mestieri, vale il progetto. Le due modifiche alla corsa (gli orari e il
testo prima della revisione) sono state fatte il 12 sera.

---

## La lezione comune

Tutti i progetti simili sbagliano nello stesso punto: **indovinano**. Ricavano lo stato degli agenti
dal silenzio («tace da un po', avrà finito»), mettono in bocca agli agenti frasi a caso («sto pensando
a come aprire»), fanno camminare la gente per riempire la scena. Chi li usa se ne accorge e smette di
fidarsi. Le tre regole che ne escono valgono per tutto il resto:

1. **La scena si calcola dai dati, non si simula.** Ogni personaggio ha uno stato e l'ora in cui è
   cominciato; posa, posto e animazione si ricavano da lì e dall'orologio. Aprendo la pagina sul Mac
   e su un altro schermo nello stesso minuto si vede la stessa scena (le piccole variazioni partono da un seme:
   data, ora, agente).
2. **Gli oggetti-segnale e gli oggetti-scena non si mescolano.** Il monitor acceso, la spia, il
   cronometro, la cartella che passa di mano si muovono **solo** quando c'è un dato scritto. La luce
   dell'alba, le piante, la tazza di caffè si muovono per conto loro e non vogliono dire niente.
3. **Il fumetto cita, non pensa.** Sopra la testa l'ultima cosa prodotta davvero («12 voci AI», il
   titolo dell'apertura). Se l'agente non ha consegnato niente, il fumetto non c'è.

## Tre scoperte che cambiano il progetto

**1. Gli orari di inizio e fine ci sono già, e si buttano via.** `pipeline/costo.py` legge il primo e
l'ultimo orario del registro di ogni agente, fa la sottrazione e tiene solo i minuti
(`fasi_subagenti`; verificato sul codice). Poche righe che salvino `inizio` e `fine` in
`data/corse.json` darebbero, a costo zero in token e in tempo: la moviola della corsa con i tempi veri,
il foglio dei turni, il passaggio delle carte all'ora giusta, il tabellone delle uscite. **È una
modifica alla corsa: si propone a Mike, non si fa da soli.** Gli hook di Claude Code (per vedere la
stanza muoversi dal vivo alle 5:34) sono un passo dopo, con limiti noti; il rapporto `2-` ha l'esempio
completo.

**2. Dentro claude.ai, Safari va a 30 fotogrammi al secondo finché non tocchi la pagina** (bug WebKit
170534 e 213344, il secondo aperto). Vale anche per Safari sul Mac, e con «Basso consumo» resta a 30
anche dopo il clic. **Chrome e l'app desktop di Claude non hanno il limite.** Quindi la redazione si
apre nell'app Claude sul Mac (che serve anche per la voce e per leggere i file in locale, vedi
`mappa-dati.md`) o in Chrome; e comunque la scena sta quasi sempre ferma e si ridisegna solo quando
qualcosa cambia.

**3. Il video di Mike** (`0-il-video-di-mike.md`) aggiunge quattro cose che i progetti tecnici non
avevano, e che sono il modo di usarla:
- **la frase di benvenuto**: «Buongiorno Mike. Il visualista e l'archivista ti aspettano. La corsa è
  finita alle 6:00, in 26 minuti.» Prima di guardare la stanza sai già cosa fare;
- **il vassoio «da guardare»**: le consegne di stamattina in fila, con «Guarda»;
- **«Round 1 contro Round 2»**: da noi il testo del redattore accanto a quello del revisore. Oggi la
  foto del «prima» sta in `/tmp/corsa` e sparisce: salvarla è un'altra piccola modifica alla corsa,
  da proporre;
- **quattro schede**: Sala · Calendario · Risultati · Messaggi.

## La tecnica e lo stile

**Il look l'ha deciso Mike, la sera stessa, dopo aver visto queste pagine: è quello del suo video.**
3D vero, con volume, luce calda, ombre leggere, legno chiaro e personaggi tondi; non le campiture
piatte della sigla. TMB entra nel **tema**: lo schermo gigante col logo e il sole, il merchandising
(tazze, magliette nei quattro colori, gadget), le prime pagine incorniciate, i colori della casa
negli arredi. Il rapporto `4-` era scritto per lo stile piatto: le sue regole sullo stile non valgono
più, quelle sulle prestazioni sì. Come si ottiene il look del video sul Mac, e con quali oggetti 3D
gratuiti, lo dice il rapporto `7-il-look-del-video.md`.

**La ricetta del look, dal rapporto `7-`** (tarata sul Mac; i nomi di Three.js verificati sulla
0.186.1):

1. **La luce è tutta generata in codice**, senza file: un ambiente `RoomEnvironment` a mezza
   intensità, una `HemisphereLight` calda e una `DirectionalLight` calda che proietta l'ombra.
   Tone mapping `NeutralToneMapping`: ACES e AgX spengono il giallo del marchio.
2. **Un'ombra morbida e leggera**, mappa da 2048 o 4096, `shadow.intensity` intorno a 0,6, calcolata
   una volta sola (`autoUpdate = false`). In questa versione `PCFSoftShadowMap` è stata tolta (la
   libreria avvisa e ripiega): si usa `PCFShadowMap` con `radius` 3–5, o `VSMShadowMap`.
3. **Personaggi e sedie** non entrano nella mappa d'ombra: sotto hanno una macchia morbida. Il buio
   negli angoli viene da `GTAOPass`, che costa solo quando la scena si ridisegna.
4. **Materiali `MeshStandardMaterial` opachi**, spigoli arrotondati (`RoundedBoxGeometry`),
   **personaggi fatti di forme semplici** con la maglietta ricolorabile per agente. Se serve un arredo
   già pronto, la raccolta più vicina al look è **KayKit Furniture Bits** (licenza CC0, libera).
5. **Logo, schermi, prime pagine** disegnati in codice sulle superfici (`CanvasTexture`), nitidi sul
   Retina. Se è tutto in codice la pagina pesa 0,1–0,3 MB.

Da provare nell'artifact vero: se la CSP lascia passare `blob:` e WebAssembly (servono solo per i
modelli compressi; con tutto in codice non servono).

Quello che resta valido:

- **Three.js 0.186.1** (uscita il 24 settembre 2026; indirizzo verificato:
  `https://cdn.jsdelivr.net/npm/three@0.186.1/+esm`), camera ortografica ferma in isometrica, disegno
  solo quando serve, pixel ratio al massimo 2. I testi, i fumetti e i pulsanti in HTML sopra la scena,
  mai dentro il 3D. È anche la tecnica più usata dagli «Agents Office» di YouTube (rapporto `6-`).
- **La luce segue Milano**: l'alba e il tramonto veri, calcolati nella pagina senza rete; di notte le
  lampade e i monitor.
- **Toccare**: sopra ogni personaggio un pulsante HTML invisibile da 44×44 punti con nome e stato
  (dito, tastiera, VoiceOver).
- **Riduci movimento**: la posa dell'ora, dissolvenze, camera ferma, spie accese.
- **Due o tre inquadrature fisse** con uno stacco netto, e un clic su un personaggio che avvicina la
  camera alla sua scrivania (come nel video); niente camera che gira libera.
- **Si progetta per il Mac** (Mike: in redazione entra dal Mac nel 90% dei casi; l'iPhone è per
  leggere l'edizione). Più avanti, per iPhone e Duo, una tavola semplice con gli stessi stati veri
  (rapporto `6-`). I vincoli di prestazioni dei rapporti `4-` e `7-` pensati per l'iPhone valgono
  per quel momento, non per il primo giro.

## Dagli «Agents Office» di YouTube

Il sesto ricercatore ha trovato 54 video e un centinaio di progetti (rapporto `6-`): quasi tutti in
Three.js, quasi tutti con stati simulati. Quattro cose da prendere:

- **un'etichetta di verità sempre in scena**: «dal vivo», «replica delle 5:34» o «dimostrazione». Chi
  non la mette viene accusato di finzione nei commenti;
- **la moviola come vista principale**: quando Mike entra la corsa è finita, quindi la stanza parte
  dalla replica di stamattina (con gli orari veri: serve la scoperta 1);
- **le scrivanie che dormono**: fra una corsa e l'altra, sul monitor «prossimo turno: domani 5:34»;
- **la portineria** all'ingresso: chi ha lavorato, la durata contro il tetto, i token, chi non ha
  consegnato, la prossima corsa.

## La stanza: cosa si aggiunge, oggetto per oggetto

Tutti con un dato vero dietro; quasi tutti già disponibili in `redazione/stato.py` o a un passo.

| Oggetto | Cosa dice | Dato | Quando |
|---|---|---|---|
| **Il posto dice lo stato** | alla scrivania = al lavoro; in piedi al caffè = ha consegnato; in fila davanti al tavolo del CEO = ti aspetta (tante sedie quante le richieste); sedia vuota = non oggi | `stato.agenti[].stato`, `postit` | subito |
| **Il pittogramma sopra la testa** | il tipo di lavoro: l'occhio, la penna, la matita rossa, le barre, la lente | il ruolo | subito |
| **Il pallino sopra la scrivania** | verde dentro il tetto, ambra oltre il 60%, rosso se l'ha passato o è «saltato», grigio «non oggi» | minuti contro i tetti scritti (visualista 8, revisore 10, cronisti 10, corsa 45) | subito |
| **L'orologio da studio** | l'arco dei 45 minuti dall'ora vera di partenza, pieno per i minuti della corsa: «26 di 45». Di notte conta le ore alla prossima partenza | `corsa.inizio`, `minuti`, `tetto` | subito |
| **La spia IN ONDA** sopra la porta | rossa con l'ora quando l'edizione è pubblicata | il commit «Pubblica l'edizione» | subito |
| **La scaletta al desk** | una riga per agente: previsto, effettivo, scarto; in fondo «SOTTO di 19 minuti» | `corse.json` e i tetti | subito |
| **Il timone sulla lavagna** | le sezioni dell'edizione come pagine, col numero di voci e chi le ha scritte («oggi l'ha scritta la regia» se sostituito) | `stato.lavagna`, `agenti` | subito |
| **Il muro dei cinque** | i cinque approfondimenti appesi, ciascuno col tipo di grafico: due uguali si vedono | `lavagna[].visivo` | subito |
| **Il mosaico «quanto gira»** sull'anello di schermi | le notizie come tessere grandi quanto le testate che le hanno date, nel colore del tag | `verifica.testate` | subito |
| **Il cartello sopra la porta** | «Corse in orario di fila: 12» | `corse.json` | subito |
| **La pianta che cresce** | una foglia per ogni edizione uscita nel tetto negli ultimi 30 giorni, una gialla per ogni sforamento | `corse.json` | subito |
| **Lo scontrino dell'agente** | letto nuovo, riletto, scritto; una cifra in dollari con scritto «a listino» (Mike è in abbonamento) | i token per registro | subito |
| **Il tabellone delle uscite** | le ultime due settimane come in stazione: giorno, ora di uscita, «in orario» | `corse.json`, commit | subito |
| **Il biglietto di fine turno** sul tavolo del CEO | data, le tre d'apertura, notizie su articoli letti, feed muti, la previsione chiusa | l'edizione | subito |
| **Il cervello condiviso** (dal video) | le regole della casa: `CLAUDE.md`, le linee editoriali, la memoria; quante, l'ultima aggiunta e quando | `git log` di quei file | subito |
| **Il vassoio «da guardare»** (dal video) | le consegne di stamattina, con «Guarda» che apre l'app sulla notizia | `lavagna`, `agenti[].dettagli` | subito |
| **Il ritaglio** | quando una notizia chiude una previsione: «confermato» o «smentito», con la notizia di allora | `resolves` nell'edizione | subito |
| **La moviola** sullo schermo gigante | la corsa rigiocata in un minuto, «×30» dichiarato | serve la scoperta 1 | più avanti |
| **Il foglio dei turni** | una striscia per agente sulla stessa scala del tempo | serve la scoperta 1 (senza orari, niente scala) | più avanti |
| **Le spie che restano** (alla Factorio) | «titoli non tradotti», «LAB senza foto», «foto stretta», finché non si risolve; frecce ai bordi se la scrivania è fuori inquadratura | gli avvisi del lint dentro `stato.py` | più avanti |
| **Ieri hai letto** | cosa Mike ha aperto davvero dell'edizione di ieri (detto così, mai «il pubblico») | `data/taste.json` | più avanti |
| **Gli eventi del calendario** | il lunedì dell'archivista con lo scatolone, il conto alla rovescia nel giorno di un evento Apple, le lucine a dicembre | il calendario e `prossimo` | più avanti |

Più avanti, sul telefono, **al posto della scena la lista**: Ti aspetta · Al lavoro · Ha finito, con
lo stesso pannello al tocco. È anche la versione per «Riduci movimento».

## Gli agenti e la conversazione

- **La scheda di ogni agente in sette parti**, sotto le quaranta righe: chi sono, cosa mi importa, cosa
  non vedo, come parlo, quando non sono d'accordo, tre esempi di risposta (uno è «non lo so»), note.
  Mai una lista di aggettivi («preciso, curioso»): produce sette agenti uguali.
- **Ogni dato ha un indirizzo, e ogni risposta lo cita.** Quello che non ha indirizzo l'agente non lo
  dice. Il modello sa molte cose su Apple; il visualista sa solo cosa c'è nell'edizione di oggi, e la
  scheda lo dice alla voce «cosa non vedo».
- **Il diritto al disaccordo**, scritto: «se il capo propone una cosa che i dati smentiscono, lo dici e
  porti il dato». I modelli tendono a dare ragione a chi parla.
- **Risposte corte**: quattro o cinque righe, poi «vuoi i dettagli?». Conversazioni brevi
  su un argomento solo: la deriva si vede già entro otto scambi.
- **La prima frase** quando Mike si avvicina è il fatto più notevole della giornata dell'agente, in
  quest'ordine: è stato sostituito, ha sforato, ha fatto un record, oppure la consegna.
- **Un agente per conversazione**, e il passaggio di mano detto: «questo è del redattore: glielo passo
  con questo riassunto?».
- **La carta decisione**: quando si decide qualcosa, l'agente propone una scheda (tipo, le parole esatte
  di Mike, perché, come si verifica) che Mike conferma con un tocco. Il registro sono le carte, non la
  chat; numerate, mai cancellate («superata da», «ritirata»).
- **Tre tipi, tre destini**: il gusto entra nella scheda dell'agente; l'incarico diventa un compito
  con la sua definizione di «fatto»; la regola è «fatta» solo quando un controllo (`lint.py`) la fa
  rispettare.
- **Onestà sui tempi**: sotto il messaggio, «lo legge la corsa di domani», poi «letto» solo quando è
  vero. Finché la corsa non legge la redazione, la frase dice chi lo farà (una sessione di lavoro).
- **I post-it sono domande con le risposte già scritte** (due o tre pulsanti, «rispondi a parole»,
  «lascia stare»), scadono dopo sette giorni e si spengono se il dato cambia. **Al massimo uno o due per
  agente**: chi riceve troppe richieste approva senza leggere (il 93% dei permessi di Claude Code viene
  accettato). Le 70 richieste del visualista sono un mazzo, non 70 post-it.
- **«Cosa so di te»**: nella scheda dell'agente l'elenco esatto di quello che gli arriva di Mike, e lo
  si può togliere.

## I no

Ogni voce è una cosa che altri hanno fatto e che da noi sarebbe falsa o pesante:

- agenti che chiacchierano fra loro per fare atmosfera (testo inventato, e costa);
- fame, stanchezza, umore degli agenti; il Tamagotchi che si intristisce se Mike non passa;
- un timbro «approvato» che non cambia niente; un pubblico disegnato che sale e scende;
- il ticker che scorre tutto il giorno: TMB è un'edizione, il momento è l'uscita;
- la classifica degli agenti per costo o minuti: si confronta ognuno con se stesso;
- il voto «utile / inutile» sotto ogni risposta: i pollici, nell'app, non li premeva nessuno;
- l'agente che riscrive da sé la propria scheda dalla chat: i file li cambia una sessione di lavoro;
- musica, ombre ricalcolate a ogni fotogramma, camera libera, filtri pesanti e «bloom»;
- mettere le durate su una linea del tempo senza gli orari: sarebbero posizioni inventate;
- notifiche per ogni sciocchezza; mezzo schermo di videogioco che si mangia la pagina.

## Da verificare prima di scriverlo

- **Quanto costa un token riletto**: il rapporto `2-` riporta dalla pagina dei prezzi un ventesimo di
  uno nuovo; `CLAUDE.md` dice «circa un decimo». Prima di stamparlo sullo scontrino si controlla.
- **L'ora della corsa**: la routine parte alle 5:34 italiane, non alle 6:30 (l'orario non è stato
  spostato all'ora solare). La stanza usa sempre l'ora vera di `corse.json`.

## Da decidere con Mike

1. **Salvare gli orari della corsa** (poche righe in `costo.py`) e **la foto del «prima» del revisore**:
   due piccole modifiche alla corsa che sbloccano la moviola e il «Round 1 contro Round 2».
2. **Nomi o mestieri**: chi ha provato gli uffici con nomi umani su Hacker News si è chiesto a cosa
   servissero; la ricerca pende per «il redattore», «il revisore». La scelta è sua.
3. **La pianta**: la fila della prosa (dice l'ordine del lavoro) o gli anelli concentrici di La Stampa
   (dicono quanto ciascuno è vicino alla pubblicazione).
4. **Dove si apre**: nell'app Claude sul Mac (niente limite dei 30 fotogrammi, voce, e la possibilità
   di leggere i file del progetto in locale) o in Chrome. Per leggere i file in locale serve
   aggiungere un piccolo server MCP alla configurazione di Claude sul Mac: si decide con Mike.
5. Le quattro domande che stanno già in `progetto.md` §10.
