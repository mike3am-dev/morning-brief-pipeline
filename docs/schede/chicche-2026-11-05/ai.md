# Scheda AI — proposte del reparto creativo (5 novembre 2026)

Colore: **rosso**. Oggetti veri da cui partire, perché l'AI si riconosca prima di leggere: il
**tabellone delle partenze** (la gara fra laboratori), il **campo di pallini** (i numeri dell'AI
sono quasi sempre proporzioni), il **cursore dell'agente** che fa le cose al posto tuo, la
**casella del prompt** con la risposta che arriva. Niente cervelli luminosi, niente reti neurali
blu, niente gradienti viola: quello è lo stile dei laboratori, non il nostro.

Cosa dicono i dati veri (ultime 20 edizioni, 201 voci AI): 7 voci `modello`, ma **solo una**
(Kimi K3.1 Pro, oggi) ha il campo strutturato `modello: {nome, famiglia}`; **0 voci** su 201 hanno
`prompt`; 3 hanno `segnale`, 3 hanno `thread`. OpenAI ha 90 voci, Meta 3, Aperti 1. Quindi ogni
idea che vive di campi nuovi dipende dall'agente `ai`: le segno così, con il costo.

---

## 1. Il tabellone Solari
**«Quando un laboratorio cambia modello, il tabellone gira le palette come in stazione: sai chi
ha lanciato prima di leggere una riga.»**

- **Cosa si vede.** Il fronte di oggi resta com'è (fascia nera, una colonna per laboratorio, il
  nome del modello in condensato pesante, i pallini delle settimane in carica), ma i nomi stanno
  su **palette a ribalta**, le tessere nere col taglio orizzontale a metà del tabellone delle
  partenze. Lettere osso su nero, la colonna di chi ha lanciato oggi con la paletta rossa.
- **Cosa si muove, quando, perché.** **Solo la colonna cambiata oggi**: quando il tabellone sale
  oltre il terzo inferiore, le palette di quella colonna sfogliano dal nome vecchio al nuovo
  (oggi: «Large 4» → «K3.1 Pro» sotto Aperti), con il clac-clac visivo di 0,8 s, poi i pallini
  delle settimane si azzerano e ripartono da uno. Il movimento **è** la notizia: chi ha cambiato,
  da cosa a cosa. Nei giorni senza lanci non gira niente, e anche questo è un'informazione (il
  fronte è fermo). Se la voce è a pesi aperti, sotto il nome scatta un piccolo **lucchetto che si
  apre** — l'unica differenza che conta fra Kimi e GPT.
- **Dove sta.** Al posto del fronte attuale, stessa posizione dopo «In apertura».
- **Dati.** Esistono quasi: serve il nome **precedente** del laboratorio, che l'app ricava da sola
  dall'archivio (`fronteTab` lo sa già: è la penultima voce `modello` del lab). Serve però che
  l'agente `ai` scriva **sempre** `modello: {nome, famiglia}` sulle voci di punta (oggi 1 su 7):
  costo zero in token, una riga nel suo file. Il lucchetto usa `famiglia: "aperto"`.
- **Costo** piccolo. **Rischi**: sul telefono a 390 punti sette colonne non stanno — le palette
  vanno su due file da quattro e tre, e il nome lungo («Gemini 4 Carbon») si abbrevia
  (`nome_breve`, o l'app taglia la famiglia); un tabellone che gira tutti i giorni diventa
  rumore, per questo gira solo la casella cambiata.
- **Verdetto:** la firma della scheda; è il radar dell'AI — un oggetto vero, si muove solo quando
  c'è una notizia.

## 2. Il conto in pallini
**«I numeri dell'AI sono quasi sempre "tanti su quanti": li vedi come pallini che si accendono,
non come una cifra da immaginare.»**

- **Cosa si vede.** Un riquadro su campitura rossa, il campo di pallini della sigla in osso. Una
  sola grandezza al giorno, la più parlante dell'edizione. Oggi: Uber, **4 corse prenotate da un
  agente su ~320 milioni** — un campo di pallini dove ne sono accesi quattro, e la cifra in
  condensato pesante sotto. Altri giorni: Liber-0 che riesce in **22 compiti su 60** (36%); Gemma
  con l'**85% dei pesi tolti**; ChatGPT a **4 miliardi di immagini a settimana**.
- **Cosa si muove.** Quando sale, i pallini si accendono uno dopo l'altro **fino alla quota vera**
  e si fermano lì (il linguaggio «si accendono come pallini» di `Motion`). Per Uber è il colpo di
  scena: il campo resta spento e i quattro pallini accesi si cercano — la proporzione è
  l'informazione (quando la scala è troppo grande, il riquadro lo dice: «ogni pallino = 1 milione»
  e i quattro diventano una scheggia di un pallino, cerchiata in giallo).
- **Dove sta.** Fra «In apertura» e il fronte, oppure fra «Cosa puoi provare» e «In breve» per
  rompere la colonna.
- **Dati.** Nuovo, sulla voce: `conto: {parte, tutto, etichetta, fonte}` (oppure `quota` 0–1).
  Lo scrive l'agente `ai`, **solo se i due numeri sono nell'articolo**; una voce al giorno al
  massimo. Costo: poche righe di output, nessuna lettura in più. Senza `conto` il riquadro non
  esce.
- **Costo** piccolo. **Rischi**: la tentazione di forzare un numero ogni giorno (regola: mai
  riempire); le scale enormi (1 su 80 milioni) vanno dichiarate, non disegnate a pallini veri.
- **Verdetto:** l'idea più «TMB» della lista — il campo di pallini al servizio di un dato vero.

## 3. Il cursore che lavora
**«Il "Prova" non te lo spiega: un cursore lo fa davanti a te, passo per passo, e tu sai già dove
cliccare.»**

- **Cosa si vede.** Sotto la foto della scheda LAB, il foglietto giallo «Prova» diventa una
  lista di **2–4 passi** numerati, ognuno un'azione («Apri agent.datasette.io» · «Entra con
  GitHub» · «Chiedi a parole qualcosa sui dati»), con le parti da toccare sottolineate.
- **Cosa si muove.** Quando la scheda sale, una **freccia del mouse nera** (l'oggetto degli
  agenti che usano il computer) entra da sinistra, va sul primo passo, «clicca» (un pallino rosso
  che si allarga), il passo si spunta con una lineetta; poi il secondo, il terzo. Una volta sola,
  ~3 s in tutto. Porta l'ordine delle cose e il punto di partenza: chi la guarda sa quale bottone
  cercare per primo. Il tasto Copia resta per il prompt, quando c'è.
- **Dove sta.** In «Cosa puoi provare», dentro ogni scheda LAB che ha i passi.
- **Dati.** Nuovo: `passi: ["…", "…", "…"]` (≤ 60 caratteri l'uno), scritti dall'agente `ai` dal
  `prova` che già scrive — e solo per `uso`, `demo`, `sapevi` dove i passi sono davvero lineari.
  Costo trascurabile. Senza `passi` resta il foglietto di oggi.
- **Costo** medio (il percorso del cursore va calcolato sulle righe vere, che vanno a capo diverse
  sul telefono e sul Duo). **Rischi**: con quattro schede LAB, quattro cursori sono troppi — parte
  solo sulla prima scheda che sale, le altre restano con i passi già spuntati; non deve sembrare
  un tutorial da app.
- **Verdetto:** l'agente che agisce, detto con un oggetto che tutti conoscono; e rende il LAB
  più utile, non solo più vivo.

## 4. Dal prompt al risultato
**«La foto del LAB non compare: si sviluppa, come esce da un generatore — dal rumore all'immagine
che qualcuno ha davvero ottenuto.»**

- **Cosa si vede.** La foto del LAB al suo posto e della sua misura **dal primo istante**, ma resa
  come retino di pallini grossi della sigla (la stessa immagine, in mezzatinta rossa e osso).
  Sopra, in un fumetto squadrato, la riga `prova` (o il `prompt` vero quando c'è) come messaggio
  inviato.
- **Cosa si muove.** Quando la scheda sale, i pallini rimpiccioliscono in tre-quattro passi e la
  foto si «denoisa» fino a nitida (~1,2 s), con una riga in piccolo che conta «passaggi 1/4 …
  4/4». Il movimento dice che quella foto è **il risultato di un'istruzione**, che è il senso del
  LAB.
- **Dove sta.** «Cosa puoi provare».
- **Dati.** Esistono: `image`, `prova`, `prompt` facoltativo. Nessun lavoro per la corsa.
- **Costo** medio (un canvas per scheda, una volta sola; con «Riduci movimento» la foto è nitida
  subito). **Rischi**: onestà — non tutte le foto LAB sono generate (oggi una è la miniatura di
  Matt Wolfe, una un thread Reddit): l'effetto va **solo** sulle voci `demo` con immagine generata,
  e serve un campo `generata: true` dall'agente `ai`, altrimenti è decorazione bugiarda. Le
  miniature YouTube col faccione si prestano male.
- **Verdetto:** bellissima dove è vera, falsa dove non lo è: tenerla stretta alle `demo` generate.

## 5. Il duello
**«Il giorno di un modello nuovo, due barre a specchio: dove batte il rivale e dove no, con i
numeri dei laboratori dichiarati come tali.»**

- **Cosa si vede.** Già in coda nel piano. Due nomi in condensato pesante ai lati (Kimi K3.1 Pro
  in rosso, Claude Opus 5.5 in nero), al centro 3–4 metriche, le barre che crescono verso
  l'esterno; il vincitore di ogni riga col pallino pieno. Didascalia fissa: «benchmark dichiarati
  dai laboratori».
- **Cosa si muove.** Le barre si allungano dal centro quando sale, una riga per volta (salgono di
  poco, poi si allungano); un tocco su una riga mostra la fonte. Porta il confronto, che a parole
  («si avvicina a Opus») non si misura.
- **Dove sta.** Sotto la voce `modello` in «In apertura», solo nei giorni di un modello di punta
  (7 in 20 giorni).
- **Dati.** Nuovo tipo in `VISUALS`, dati sulla voce: `duello: {a, b, righe: [{metrica, a, b,
  unita, meglio: su|giu, fonte}]}` scritto dall'agente `ai` **solo dai numeri dell'annuncio o
  dell'articolo**. Costo: una lettura che l'agente fa già.
- **Costo** medio. **Rischi**: diventare una classifica (il piano dice «non fare classifiche con
  punteggi»): mai più di due modelli, mai un totale, mai il duello senza numeri veri; benchmark
  diversi fra laboratori non si mettono a specchio.
- **Verdetto:** buona e rara, quindi preziosa; va sul fronte dei giorni grandi, non tutti i giorni.

## 6. La settimana come pista
**«La griglia dei sette giorni diventa una pista: ogni laboratorio corre nella sua corsia, e chi
ha fatto di più questa settimana è più avanti.»**

- **Cosa si vede.** Sostituisce la tabella dei segni sotto il fronte: una corsia per laboratorio,
  tratteggiata come una pista, con un segnalino pieno che avanza di una tacca per ogni voce della
  settimana (pieno = modello, anello = funzione, quadrato = affari, come oggi). OpenAI lontano in
  fondo, Meta fermo all'inizio: il disequilibrio delle fonti diventa visibile (90 voci OpenAI su
  201 è anche un nostro limite, e la pista lo mostra onestamente).
- **Cosa si muove.** I segnalini partono dalla linea e corrono fino alla loro tacca, una volta,
  all'arrivo; il segno di oggi entra per ultimo e lampeggia una volta in rosso.
- **Dove sta.** Sotto il tabellone del fronte, al posto della «settimana dei laboratori».
- **Dati.** Esistono: l'app li ricava dall'archivio come oggi. Zero lavoro per la corsa.
- **Costo** piccolo. **Rischi**: la pista suggerisce un vincitore, ma conta quanto **scriviamo** di
  un laboratorio, non quanto vale; la didascalia lo deve dire («voci uscite qui»). Se pare una
  classifica, si torna alla griglia.
- **Verdetto:** migliora quello che c'è senza dati nuovi; utile, non indispensabile.

## 7. «E Apple?» col semaforo
**«Tre luci: Apple c'entra, c'entrerà, non c'entra — e la domanda di Mike ha una risposta prima di
leggere.»**

- **Cosa si vede.** Il riquadro «E Apple?» ha in testa un piccolo semaforo verticale a tre
  pallini (i colori della sigla). Oggi nessuna voce ha `apple` scritto, quindi il riquadro
  semplicemente non esce — è giusto così.
- **Cosa si muove.** Quando sale, si accende la luce giusta: **verde-blu** «la tocca oggi»
  (accordo Apple–Gemini, Apple Intelligence), **giallo** «la toccherà» (un concorrente di Siri,
  le regole UE sull'AI), e niente rosso: se non c'entra, il riquadro non esce.
- **Dove sta.** Dove sta oggi «E Apple?».
- **Dati.** Nuovo, piccolo: `apple_quando: oggi|presto` accanto ad `apple`, dall'agente `ai`.
- **Costo** piccolo. **Rischi**: un'etichetta in più che decide per Mike; da tenere solo se il
  riquadro esce spesso (oggi, no).
- **Verdetto:** chicca minore; fare solo insieme ad altro.

## 8. Il dispaccio in streaming (sconsigliata)
**«Le righe di "In breve" arrivano a pezzi di parola, come un modello che risponde.»**

- **Cosa si vede / si muove.** Le sintesi di «In breve» compaiono a gruppi di 2–4 caratteri,
  irregolari, con un cursore a blocco rosso: lo streaming dei token.
- **Dati.** Esistono.
- **Costo** piccolo. **Rischi**: è la stessa magia di «L'ultima parola» (lettera per lettera) e di
  «Il punto» (parola per parola), quindi la scheda AI perderebbe identità invece di guadagnarla; e
  rallenta la lettura della parte più fitta della scheda.
- **Verdetto:** no — la segno perché è la prima idea che viene a tutti, e va scartata apposta.

---

## L'idea folle — La prova su strada
**«Ogni mattina in cui esce un modello di punta, gli facciamo la stessa domanda che abbiamo fatto a
tutti gli altri, e le risposte arrivano affiancate alla loro velocità vera.»**

- **Cosa si vede.** Una fascia nera come il fronte: in alto la domanda fissa della rassegna
  (sempre la stessa, es. «In tre righe: cosa deve fare Apple con Siri nel 2027?»), sotto due-tre
  colonne, una per modello (il nuovo e i due rivali di punta), ognuna con la sua risposta.
- **Cosa si muove.** Al tocco su «Via», le tre risposte partono insieme e si scrivono **al ritmo
  misurato** di ciascun modello (token al secondo e attesa del primo token, registrati la mattina):
  chi è più rapido finisce prima, ed è un dato vero, non un effetto. Sotto ogni colonna, quanti
  token e quanto è costata la risposta.
- **Dati.** `prova_strada: {domanda, risposte: [{modello, testo, token, token_s, primo_ms,
  costo_usd, il}]}`, scritto da uno script della corsa che chiama le API dei laboratori — **chiavi
  di OpenAI, Google, Anthropic, Moonshot**, qualche centesimo a giorno, solo nei giorni di un
  modello di punta. Nessun codice dal database: solo testo e numeri.
- **Costo** grande (chiavi, script, un passo in più nella corsa — da mettere in background dopo
  `push.py` come il visualista). **Rischi**: è una prova nostra, non un benchmark; la domanda
  sbagliata la rende ridicola; i modelli cambiano risposta a ogni chiamata.
- **Verdetto:** folle ma vera: l'unico modo di far «sentire» un modello nuovo invece di leggerne.

---

**Le mie tre migliori:**
1. **Il tabellone Solari** — la firma della scheda, gira solo quando un laboratorio cambia davvero.
2. **Il conto in pallini** — il campo di pallini della sigla al servizio del numero del giorno.
3. **Il cursore che lavora** — l'agente che agisce, e il LAB che diventa più utile, non solo più vivo.
