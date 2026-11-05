# Scienza — proposte del reparto creativo (5 novembre 2026)

La scheda oggi è la grammatica delle notizie Apple con un altro colore: «In apertura», due
affiancate, «Anche oggi» in schede brevi, l'occhiello `disciplina` in blu. Funziona, ma non si
riconosce prima di leggere. Le idee sotto prendono **strumenti veri del laboratorio e
dell'osservatorio** — il righello, la tavola periodica, il cilindro graduato, la carota di
ghiaccio, il contatore, il microscopio, il planisfero, il sismografo — e a ognuno fanno portare
un dato della giornata.

Gli esempi usano l'edizione vera di oggi (`spazio` in `data/briefs/2026-11-05.json`, 10 voci):
Marte vulcanico (ESA), Swift rientrato (NYT, 4 testate), i globuli rossi di un dinosauro di 115
milioni di anni (ANSA, PNAS), lo «zeptoverso» al CERN, lo iodio nei latticini vegetali, i Goti
dalla Scandinavia, i temporali più brevi e più carichi, i cubi di uranio di Heisenberg, il tumore
del colon e la placenta, le oscillazioni di Webb.

Chi scrive i dati nuovi: **l'agente Opus `schede`**, che già legge gli articoli e scrive titolo,
`nota` e `disciplina`. Ogni campo nuovo proposto qui è una manciata di caratteri per voce,
scritto nella stessa passata: non aggiunge letture né minuti alla corsa, e non sta sul percorso
critico (l'agente gira in parallelo al redattore).

---

## 1. La scala delle cose

**«Ogni mattina la scienza va dallo zeptometro alle galassie: qui vedi dove è successa ognuna
delle notizie di oggi.»**

**Cosa si vede.** In testa alla scheda, prima di «In apertura», un righello da tecnico su fondo
azzurro: una sola riga orizzontale con le tacche delle potenze di dieci, da 10⁻²¹ m a 10²⁶ m,
con pochi riferimenti fissi stampati in grigio sotto (atomo, cellula, persona, Everest, Terra,
Sole, Via Lattea). Sopra la riga i pallini delle voci di oggi, ognuno al suo ordine di grandezza,
con un'etichetta breve: «lo zeptoverso» tutto a sinistra, poi «un atomo di iodio», «un globulo
rosso» e «una cellula» (impilati, sono lo stesso ordine), «un cubo di uranio», «un telescopio»,
«un temporale», «la strada dei Goti», «Marte», e tutto a destra «un pianeta di un'altra stella».
Oggi la scheda copre 38 ordini di grandezza: è la notizia nella notizia.

**Cosa si muove.** Quando il righello sale oltre il terzo inferiore, un cursore (la finestrella
di un regolo calcolatore) parte dall'universo e scorre fino al nucleo; ogni pallino si accende
quando il cursore ci passa, come la testina di «Se te lo fossi perso». Una volta sola. Il
movimento dice la cosa: la scheda di oggi va da quanto a quanto. Al tocco su un pallino si apre la
voce; tenendo il dito si legge il titolo in un cartellino.

**Dove sta.** In cima alla scheda, a tutta larghezza. Sul telefono (390) le etichette si alternano
sopra e sotto la riga per non accavallarsi; sul Duo aperto stanno tutte sopra.

**Dati.** `scala: {metri: 1e-5, etichetta: "un globulo rosso"}` su ogni voce che ha una
grandezza. Non esiste: lo scrive l'agente `schede`. È un ordine di grandezza, non una misura: la
regola per l'agente è «di che taglia è la cosa di cui parla la notizia», e il pallino si mette
sulla potenza di dieci, mai su un valore preciso. Voci senza taglia sensata (lo iodio nella
dieta? la migrazione?) possono non averla. **Esce solo con almeno tre pallini.** I riferimenti
fissi stanno nell'app.

**Costo.** Medio (un SVG, la scala logaritmica, l'anti-accavallamento delle etichette).
**Rischi.** Leggibilità a 390 punti con 10 etichette: servono etichette di 2–3 parole e la regola
dell'alternanza. Un ordine di grandezza sbagliato dall'agente è un errore visibile: l'agente lo
scrive solo se la cosa ha una taglia evidente.

**Verdetto.** È la firma della scheda, quello che il radar è per Apple: da fare per primo.

---

## 2. La tavola delle discipline

**«Prima di leggere sai cosa c'è oggi: tre caselle di spazio, due di medicina, niente chimica.»**

**Cosa si vede.** Sotto il righello, una fila di caselle come quelle della tavola periodica:
quadrate, angoli vivi, il simbolo di due lettere grande in condensato pesante (**Sp** spazio,
**Md** medicina, **Na** natura, **Fi** fisica, **Ch** chimica, **Te** Terra, **St** storia,
**Tc** tecnica), sotto il nome per esteso e in alto a sinistra, dove sta il numero atomico, il
numero di voci di oggi. Le discipline presenti sono campite in azzurro; le assenti restano un
bordo sottile vuoto, come i buchi della tavola di Mendeleev: dice anche cosa oggi non c'è.
L'occhiello di ogni scheda (`disciplina`) diventa la stessa casellina in piccolo, con il
simbolo: l'occhio collega la voce alla sua casella.

**Cosa si muove.** Le caselle presenti si accendono una dopo l'altra, come pallini, quando la
fila entra. Al tocco su una casella la pagina scende alla prima voce di quella disciplina, e la
casellina sulla scheda dà un battito. Niente filtri (Mike non li usa).

**Dove sta.** Fra il righello e «In apertura». Su 390 punti otto caselle stanno in una fila da
~44 punti; sul Duo crescono.

**Dati.** Esiste già: `disciplina` su ogni voce (oggi spazio ×3, medicina ×2, storia ×2, natura,
fisica, terra). L'app conta da sola. Costo zero per la corsa.

**Costo.** Piccolo. **Rischi.** Il cattivo gusto della tavola «decorativa»: la si evita tenendola
sobria, monocroma azzurra, senza otto colori diversi (la sigla ne ha quattro). La lista delle
discipline va fissata con l'agente (oggi c'è «storia», nel piano no).

**Verdetto.** Poco lavoro, riconoscibile a colpo d'occhio, dati già pronti: seconda solo al righello.

---

## 3. Il cilindro della prova

**«Uno studio sui topi e un farmaco approvato non sono la stessa notizia: il cilindro ti dice
quanto è piena la prova.»**

**Cosa si vede.** Sulle schede che raccontano uno studio, a destra del titolo, un cilindro
graduato stretto, disegnato a linee piatte, con le tacche: *osservazione · modello · preprint ·
rivista* e, per la medicina, *cellule · animali · persone · approvato*. Il liquido azzurro arriva
alla tacca giusta. Sull'etichetta del vetro, il nome della rivista («PNAS», «Nature», «Science
Advances», «Earth's Future» — oggi sono sei voci su dieci a citarla nella nota) e, se c'è, il
campione («19.000 pluviometri», «24 topi»). Lo iodio di oggi si ferma a «modello»: è una
simulazione dell'Università del Surrey, non una misura su ragazze vere. È esattamente la cosa che
il lettore non vede nel titolo.

**Cosa si muove.** Il liquido sale dalla base fino alla tacca, una volta, quando la scheda entra:
la durata è proporzionale al livello, così una prova debole si ferma subito e una solida sale a
lungo. Il movimento è il dato.

**Dove sta.** Sulle prime tre (grande) e sulle brevi (in piccolo, solo la tacca e la rivista).
Mai sulle voci che non sono uno studio (Swift che rientra, i cubi di uranio).

**Dati.** `prova: {livello: "osservazione|modello|preprint|rivista|cellule|animali|persone|approvato", rivista, campione}`.
Non esiste: lo scrive l'agente `schede`, che ha già l'articolo aperto. Regola: si scrive solo se
l'articolo lo dice; nel dubbio niente cilindro. Serve anche come freno editoriale già nel piano
(uno studio su topi non va mai in apertura): il lint può avvisare se l'apertura è «cellule» o
«animali».

**Costo.** Medio (il disegno, due scale diverse per medicina e il resto). **Rischi.** Un livello
sbagliato è peggio di niente; e due scale nello stesso oggetto confondono — si può tenere una
scala sola di sette tacche, con «cellule/animali/persone» come icona sotto.

**Verdetto.** La più utile per chi legge: rende visibile la differenza fra scoperta e ipotesi.

---

## 4. La carota

**«Il dinosauro sta a 115 milioni di anni, i Goti a duemila, Heisenberg a ottanta: la carota ti
mostra quanto in fondo scava la scienza di oggi.»**

**Cosa si vede.** Il gemello del righello, per il tempo: una carota di ghiaccio (o di roccia)
verticale, a strati sottili di grigi e azzurri, con la profondità in scala logaritmica: *oggi ·
10 anni · 100 · mille · un milione · 100 milioni · la Terra · il Big Bang*. Le voci che guardano
al passato sono pallini infilati nello strato giusto, con l'etichetta: «Swift, lanciato nel 2004»,
«i pluviometri dal 1980», «i cubi di Heisenberg, 1945», «i Goti, 2.000 anni fa», «Aratasaurus,
115 milioni di anni».

**Cosa si muove.** Quando entra, la carota viene «estratta»: sale di poco dal basso come se la
tirassero fuori dal pozzo, e i pallini si accendono dall'alto (oggi) al fondo (il passato più
lontano). Una volta. Al tocco, la voce.

**Dove sta.** In fondo alla scheda, prima di «Dalla settimana». Sul telefono è naturalmente
verticale e stretta (~80 punti) con le etichette a destra; sul Duo sta accanto alle brevi.

**Dati.** `tempo: {anni_fa: 115000000, etichetta: "Aratasaurus"}`, scritto dall'agente `schede`
solo quando la notizia ha un «quando» nel passato e l'articolo lo dice. **Esce solo con almeno due
pallini**: le giornate tutte al presente non ce l'hanno.

**Costo.** Piccolo-medio. **Rischi.** Due scale logaritmiche nella stessa scheda (spazio e tempo)
possono sembrare lo stesso giocattolo: per questo una è orizzontale e da tecnico, l'altra
verticale e materica. Nelle giornate senza storia/paleontologia non esce mai, e va bene.

**Verdetto.** Oggi sarebbe bellissima; vale la pena se le giornate «col passato» sono almeno una
su tre. Da provare dopo il righello.

---

## 5. Il contatore

**«1 su 10 miliardi: i rulli girano finché non ci arrivano, e capisci quanto è raro.»**

**Cosa si vede.** Sulla prima voce (e al massimo sulle prime tre) il numero che conta, grande, in
un contatore a rulli meccanico — quello dei vecchi Geiger e dei contachilometri: cifre nere su
rulli osso, dentro una finestrella. Sotto, l'etichetta in maiuscoletto: «decadimenti di un mesone
B», «anni fa, Aratasaurus», «la probabilità che i detriti di Swift ferissero qualcuno: 1 su
2.100», «cubi di uranio rimasti al mondo: 14».

**Cosa si muove.** I rulli girano da zero e si fermano uno alla volta, dalle unità alle cifre più
alte, quando la scheda entra. Più cifre, più rulli che girano, più tempo: la grandezza si sente
prima di leggerla. Una volta.

**Dove sta.** Dentro la scheda «In apertura», sopra la foto o a cavallo del suo bordo basso; in
piccolo sulle due affiancate.

**Dati.** `numero: {valore: "10.000.000.000", prima: "1 su", etichetta: "…"}` — previsto nel piano
come «Il numero», non esiste ancora. Lo scrive l'agente `schede`, **solo se la cifra è
nell'articolo**. Solo le cifre girano; «1 su», «%», «anni» stanno fermi.

**Costo.** Piccolo. **Rischi.** Somiglia ai numeri che contano da zero dell'approfondimento:
per distinguerlo i rulli devono avere la loro finestra fisica. Numeri lunghi (dieci cifre) a 390
punti: oltre otto cifre si passa a «10 miliardi» con un rullo solo per «10».

**Verdetto.** Poco costo, molto effetto, e un oggetto che nessun'altra scheda ha.

---

## 6. La messa a fuoco

**«La foto d'apertura arriva come al microscopio: sfocata, poi la manopola gira e la vedi nitida,
con la barra della scala nell'angolo.»**

**Cosa si vede.** La foto di «In apertura» a tutta larghezza (resta entro i 320 punti di altezza
della Magazine), con in basso a sinistra la **barra della scala** dei vetrini e delle foto
scientifiche («10 µm», «100 km», «1 anno luce») e il credito («ESA/TGO», «NASA/APOD»). Al tocco
va a schermo pieno, su nero, con lo zoom a due dita.

**Cosa si muove.** Quando entra, la foto è appena morbida e in un secondo va a fuoco, mentre una
piccola manopola zigrinata sul bordo fa un quarto di giro. La foto c'è sempre, dal primo istante:
si anima solo la nitidezza. Una volta.

**Dove sta.** «In apertura» soltanto.

**Dati.** L'immagine c'è già (`image` delle voci top, da `images.py`). Nuovo e facoltativo:
`immagine: {credito, scala}` dall'agente `schede`; la barra della scala esce solo se c'è. Quando
NASA APOD o ESO è nel grezzo, la foto vale da sola l'apertura (come già nel piano: «L'immagine»).

**Costo.** Piccolo. **Rischi.** Una sfocatura su una foto da 1280 px è un filo di lavoro per il
telefono, ma dura un secondo. Senza barra della scala l'effetto resta solo decorativo: va tenuto
breve.

**Verdetto.** Buona e economica; dà all'apertura uno strumento senza cambiarne la forma.

---

## 7. Il planisfero di Milano

**«Stanotte, alzando gli occhi dal balcone: la Luna al 40%, Giove a est dopo le 21, le Tauridi.
E se è coperto, te lo dice.»**

**Cosa si vede.** In fondo alla scheda un planisfero girevole vero — il disco di cartone delle
stelle sotto la finestra ovale dell'orizzonte — in blu notte con le stelle osso: la Luna con la
sua fase, i pianeti visibili come pallini pieni coi nomi, lo sciame di meteore se è attivo, e una
riga sotto: «Sereno dalle 22» oppure «Coperto tutta la notte: niente da vedere». Unica concessione
al blu notte nella scheda azzurra, perché è il cielo.

**Cosa si muove.** Il disco gira dall'ora attuale alle 22 di stasera, una volta, quando entra:
il movimento è il passare delle ore. Con le nuvole previste, un velo grigio passa sulla finestra.

**Dove sta.** In fondo alla scheda, dopo «Anche oggi». (Il piano lo propone anche come quarto
riquadro della plancia: lì sarebbe un'icona, qui è l'oggetto intero.)

**Dati.** Nessuno dalla corsa. L'app calcola da sola fase lunare e posizione approssimata dei
pianeti (formule brevi, precisione da «a est, alto»), gli sciami annuali stanno in una tabella
fissa, la nuvolosità notturna arriva da Open-Meteo, che la plancia chiama già per il meteo.

**Costo.** Medio-grande (i calcoli astronomici, ~un modulo dell'app). **Rischi.** Un pianeta
messo nel posto sbagliato si vede: si scrive solo «visibile / a est / dopo le 21», mai gradi. È un
widget fisso, non una notizia: **esce solo se c'è qualcosa da vedere** (Luna, un pianeta
luminoso o uno sciame) e il cielo non è coperto; altrimenti una riga sola o niente.

**Verdetto.** Il più amato in potenza (Milano, stasera), ma è il più lavoro: dopo le prime tre.

---

## 8. Il sismografo

**«Il pennino traccia la giornata: ogni picco è una notizia, alto quanto se ne parla.»**

**Cosa si vede.** Una striscia di carta da sismografo a quadretti fini sotto «Anche oggi», con un
pennino rosso che traccia una linea continua. Lungo la linea, un picco per voce: l'altezza è
quanto gira (`testate`, oppure `score`), e sotto ogni picco la sigla della disciplina. Oggi Swift
(4 testate) è la scossa grande; il resto è un tremolio.

**Cosa si muove.** In loop, piano: la carta scorre e il pennino oscilla sulla linea di fondo
(come il radar, non aspetta). Quando entra, una volta, il pennino ripassa i picchi del giorno.
Variante con un dato in più: il **terremoto più forte in Italia nelle ultime 24 ore** da INGV
(servizio pubblico gratuito, senza chiave), che esce solo sopra magnitudo 3.

**Dove sta.** In fondo, sopra il planisfero, o al posto dell'intestazione di «Anche oggi».

**Dati.** `testate` e `score` ci sono già. La variante INGV: o l'app lo chiede da sé (se il
servizio accetta richieste dal browser, da verificare), o un `sisma: {magnitudo, luogo, ora}`
scritto da uno script di pochi secondi nella corsa.

**Costo.** Piccolo (la versione con le notizie), medio (con INGV). **Rischi.** «Quanto se ne
parla» è già nei pallini delle testate di ogni scheda: è un doppione più bello, ma un doppione. La
versione INGV è un widget più che una notizia.

**Verdetto.** Bello da vedere, il meno informativo: ultimo della lista, a meno che Mike non voglia
i terremoti.

---

## L'idea folle — Potenze di dieci

**«Apri Scienza e cadi: dall'universo osservabile allo zeptoverso, e le notizie di oggi passano
mentre scendi.»**

Il film degli Eames come impaginato. Toccando «Viaggia» sul righello (idea 1) la scheda diventa
un'unica caduta: scorrere col dito è zoomare di una potenza di dieci alla volta, il numero
dell'esponente grande in condensato nell'angolo (10²⁶… 10¹⁷… 10⁷…), lo sfondo che cambia
dall'azzurro al blu notte dello spazio, al bianco osso della scala umana, al grigio del
microscopio. A ogni ordine di grandezza dove c'è una voce, la sua scheda si ferma al centro: a
10¹⁷ il pianeta di Webb, a 10⁷ Marte, a 10⁰ Swift, a 10⁻⁵ il globulo rosso del dinosauro, a
10⁻²¹ il mesone B. In fondo, «Torna in superficie».

**Dati:** gli stessi `scala` del righello, nient'altro. **Costo:** grande (scorrimento
legato allo zoom, transizioni, Duo e telefono). **Rischi:** rompe l'ordine per importanza (si
legge per taglia, non per rilievo) e chi vuole solo le notizie si perde: per questo è una modalità
che si apre dal righello, non la scheda. **Verdetto:** folle, ma con il righello in casa costa solo
la regia; da tenere per una domenica.

---

**Le mie tre migliori**
1. La scala delle cose — la firma, il radar della scheda Scienza.
2. Il cilindro della prova — dice quello che il titolo non dice: quanto è solida la scoperta.
3. La tavola delle discipline — costo quasi zero, dati già pronti, la scheda si riconosce al primo sguardo.
