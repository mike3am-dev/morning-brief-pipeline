# Games — proposta del reparto creativo (5 novembre 2026)

Scheda **Games**, colore viola, con in cima la sezione **GTA VI** (tramonto di Vice City, conto alla
rovescia turchese). Com'è oggi: GTA VI → «In apertura» → due affiancate → «PlayStation» → «Il resto»
(`renderRubricaMag`, `renderGta`, `gtaCard` in `pipeline/template.html`).

Dati guardati: `data/briefs/2026-11-05.json`. `games` ha 10 voci con `gruppo`, `testate`, `top`,
`orig`, `extra_links`; `gta` ha `uscita: 2026-11-19`, `sintesi` e 6 `voci` con `tipo`
(ufficiale/scoperta/curiosita/notizia), `affidabilita`, `segnale`, `citazione`. Oggi c'è materia vera
per quasi tutte le idee qui sotto: Laufey rinviato al 20 maggio 2027 (7 testate), il precaricamento
di GTA dal 10 novembre (fino a 212 GB), le copie fisiche il 12, Ocarina of Time Remake in uscita oggi,
Wolverine a 2,4 milioni in 50 giorni.

Il filo di tutte: **oggetti che un giocatore riconosce al primo colpo d'occhio** (la barra di
caricamento, i quattro tasti, il suggerimento della schermata di caricamento, la radio dell'auto), che
**portano un dato del giorno**. Niente pixel art, niente caratteri a 8 bit, niente colori PlayStation
veri: campiture TMB, condensato pesante, pallini. Per GTA, le idee **aggiungono** alla testata che
Mike ha trovato «bellissima»: il tramonto, il nome e il turchese restano dove sono.

---

## 1. In caricamento

> «I giochi che aspetti, come barre di caricamento: quanto manca, e la tacca rossa ogni volta che
> qualcuno ha spostato la data.»

**Cosa si vede.** Sotto «In apertura» (o subito sotto la sezione GTA), 4–6 barre piatte una sotto
l'altra, a tutta larghezza. Per ognuna: a sinistra il nome del gioco nel condensato, a destra la data
d'arrivo in condensato pesante («20 MAG 2027»), sotto la barra osso con il riempimento viola dal giorno
dell'annuncio a oggi, e la percentuale piccola all'estremità («71%»). Ogni rinvio lascia sulla barra
una **tacca rossa** verticale dove stava la vecchia data, con la data barrata sotto in piccolo. GTA VI
ne avrebbe due (autunno 2025, 26 maggio 2026): è la storia del gioco detta in un'occhiata.

**Cosa si muove.** Una volta, quando la barra sale oltre il terzo inferiore: il riempimento corre da
zero alla percentuale vera (come una vera barra che carica), il numero conta con lui. Il giorno di un
rinvio, sulla barra di quel gioco la fine **scivola a destra** e la tacca rossa si accende come un
pallino al suo vecchio posto: il movimento *è* la notizia (oggi: Laufey, 16 febbraio → 20 maggio).
Il giorno dell'uscita la barra arriva al 100% e la scritta diventa «USCITO» (poi esce dalla lista
dopo una settimana). Il tocco apre la notizia del giorno su quel gioco, se c'è.

**Dove sta.** Fra «In apertura» e le due affiancate, o subito sotto GTA: è la firma della scheda,
deve stare in alto.

**Dati.** Mancano. Registro `data/games/attese.json` come già previsto nel piano: `{id, gioco, casa,
piattaforme, annuncio, uscita, precisione: giorno|mese|anno, storia: [{il, data, fonte}], notizia}`.
Lo scrive uno script (`rubriche.py` o uno nuovo) che riconosce «delayed / release date» nei titoli e
accetta una data solo se è scritta nel titolo o nel sommario; la lista dei giochi seguiti la tiene
Mike a mano. Nell'edizione arriva `games_attese: [{gioco, annuncio, uscita, precisione, rinvii:
[date], notizia}]`, già calcolato. Zero token Claude, pochi secondi di corsa. Con precisione «anno»
(«2027») la barra finisce sfumata, non su un giorno preciso: non si finge una data che non c'è.

**Costo** medio (registro + script + una funzione nell'app). **Rischi**: la lista invecchia se nessuno
la cura; le barre di giochi annunciati 6 anni fa sembrano quasi piene anche se non esce niente
(→ la percentuale va detta come «tempo passato», non come avanzamento dello sviluppo).

**Verdetto:** la firma della scheda; si riconosce prima di leggere ed è l'unica che ricorda i rinvii.

---

## 2. Le tappe del lancio (GTA VI)

> «Il conto alla rovescia di GTA non è più un numero solo: è il caricamento del lancio, con le tappe
> che si accendono una dopo l'altra fino al 19.»

**Cosa si vede.** Sotto la sintesi della testata GTA, una striscia sottile turchese con 5–7 pallini:
*Preordini* · *Galleria* · *Precaricamento 10 nov* · *Copie fisiche 12 nov* · *Recensioni* · *Uscita 19
nov*. Le tappe passate sono pallini pieni turchesi, la prossima pulsa piano, le future sono anelli.
Sopra la tappa di oggi una lineetta gialla «sei qui». Accanto al precaricamento, quando c'è, il
dato che conta: «212 GB».

**Cosa si muove.** All'arrivo, una volta: la linea si riempie fino a oggi e i pallini passati si
accendono uno dopo l'altro (il linguaggio dei pallini di `Motion`). Il giorno in cui una tappa cade
(il 10 novembre), quel pallino si accende **per ultimo**, con un piccolo scoppio giallo: è la versione
onesta del «trofeo sbloccato» — si sblocca un fatto, non un traguardo di lettura (il piano ha bocciato
trofei e platino come premi a Mike, e qui non lo sono). Dopo il 19 la striscia si chiude e il conto
diventa «GIORNO 3» (già previsto da `gtaCountdown`).

**Dove sta.** Dentro la testata GTA, sotto la sintesi, sopra la prima scheda.

**Dati.** Oggi stanno sparsi nella prosa delle voci (precaricamento 10, fisiche 12, uscita 19, 212
GB). Serve un campo `gta.tappe: [{il, cosa, dato, fonte, link}]` che **scrive l'agente `gta`**:
già verifica ogni mattina `uscita`, aggiungere le tappe costa una manciata di righe del suo JSON e
nessuna ricerca in più. Si porta avanti da un giorno all'altro come `prossimo`. Solo date confermate
(niente embargo recensioni se non è annunciato: quella tappa non esce).

**Costo** piccolo. **Rischi**: sette etichette su 390 punti — sul telefono si scrivono solo la
tappa passata, quella di oggi e la prossima; le altre restano pallini.

**Verdetto:** il modo più naturale di far crescere ciò che Mike ama già, senza toccarlo.

---

## 3. I quattro tasti

> «Prima di leggere sai che notizia è: croce un'uscita, cerchio un rinvio, triangolo un rumor,
> quadrato i soldi.»

**Cosa si vede.** Al posto della pastiglia di testo, sulla scheda: un tasto rotondo piatto col segno
disegnato a tratto (✕ ○ △ □) e accanto la parola. **Colori TMB, non quelli Sony**: ✕ blu = uscita,
annuncio, aggiornamento confermato; ○ rosso = rinvio, chiusura, licenziamenti; △ giallo = rumor, leak;
□ arancione = conti, vendite, affari, fiere. Oggi: Laufey ○, PS6 «as scheduled» □, Wolverine □,
PlayStation utenti □, Valhalla ✕, Nintendo □, BioWare/Arkane ○.

**Cosa si muove.** Una volta, quando la scheda sale: il tasto **si preme** — scende di un punto e si
accende come un pallino. Nient'altro. Il colore del tasto porta l'informazione; la pressione dice solo
«arrivato».

**Dove sta.** Nel piede o in testa a ogni scheda di Games (non nella sezione GTA, che ha i suoi tipi).

**Dati.** Campo `tasto: uscita|rinvio|rumor|affari`. Lo scrive `rubriche.py` con le regex che ha già
per offerte e opinioni, oppure l'agente `schede` (che legge gli articoli: una parola in più per voce,
costo trascurabile). Senza `tasto` la scheda non mostra niente: mai un tasto indovinato.

**Costo** piccolo. **Rischi**: quattro colori sono già il sistema TMB, e il viola della scheda li deve
reggere tutti; il ○ rosso non deve sembrare un errore dell'app.

**Verdetto:** piccolo, leggibile, è proprio «roba da giocatori».

---

## 4. Il registro dei problemi (dal 19 novembre)

> «Il giorno dopo l'uscita la domanda è una sola: funziona? Ogni problema che gira, e a che punto è
> Rockstar.»

**Cosa si vede.** Dentro la sezione GTA, dopo il lancio, un blocco scuro a righe: ogni riga un
problema che i giocatori segnalano (il crash all'avvio su PS5 Pro, i 30 fps in città, il salvataggio
che si perde), con tre pallini di stato in fila — **segnalato** (rosa) → **riconosciuto da Rockstar**
(giallo) → **corretto** (turchese, con la patch: «1.02»). Accanto, la misura: «il thread più votato
del giorno su r/GTA6, 18.000 voti». In fondo, l'ultima patch uscita con la data.

**Cosa si muove.** Il giorno in cui un problema cambia stato, il suo pallino nuovo si accende come
pallino e la riga sale in cima: è la notizia del giorno su quel problema. Il resto sta fermo.

**Dove sta.** In GTA, sotto le tappe (che dopo il 19 si chiudono), sopra le schede `reazione`.

**Dati.** `gta.problemi: [{id, cosa, piattaforme, stato: segnalato|riconosciuto|corretto, patch,
il, segnale, link}]`. Lo scrive l'agente `gta`, che dopo l'uscita fa già le voci `reazione` dai
thread più votati: è la stessa ricerca, ordinata. Si porta avanti di giorno in giorno; un problema
corretto da più di sette giorni esce. Lo «riconosciuto» vale solo con un link a Rockstar (supporto,
X ufficiale, note della patch).

**Costo** medio (lavoro dell'agente, una lista nell'app). **Rischi**: diventare un bollettino di
lamentele; tenere solo i problemi con una misura vera (votati, ripresi da testate).

**Verdetto:** la risposta giusta a «cosa farà GTA dopo l'uscita»: un oggetto che segue una storia vera.

---

## 5. Questa settimana esce

> «La settimana dei giochi in una striscia: cosa esce, su cosa, e cosa è già uscito.»

**Cosa si vede.** Una striscia lun–dom di sette caselle piatte; nelle caselle i giochi in uscita con
la sigla della piattaforma (PS5 · Switch 2 · Arcade · PC) in condensato, i giorni passati con la
spunta, oggi con il bordo viola pieno. Oggi, giovedì 5: Ocarina of Time Remake (Switch 2), il grosso
aggiornamento di Valhalla. La settimana prossima: martedì 10 il precaricamento di GTA. È anche **il
posto per Apple Arcade**, che altrimenti in Games non entra mai.

**Cosa si muove.** All'arrivo, la casella di oggi si accende per prima, poi le spunte sui giorni
passati da sinistra come una banda. Sul telefono la striscia scorre di lato col dito, e si apre già
centrata su oggi.

**Dove sta.** Dopo «PlayStation», prima de «Il resto».

**Dati.** `games_settimana: [{giorno, gioco, piattaforme, tipo: uscita|psplus|arcade|aggiornamento,
link}]`. Lo script della raccolta, da Gematsu (RSS, da aggiungere) e dalle pagine del PlayStation
Blog che il girone `games` ha già; nessun token Claude. Una settimana con meno di due uscite non
esce.

**Costo** medio. **Rischi**: le date dei giochi piccoli sono rumorose; tenere solo PS5, Switch 2,
Arcade e i grossi multipiattaforma.

**Verdetto:** utile ogni giorno, e risolve il buco di Apple Arcade.

---

## 6. Il verdetto

> «Una recensione in un'occhiata: un pallino per voto, la media che si posa sulla riga da 0 a 10.»

**Cosa si vede.** Sotto la scheda di una recensione o di un'uscita grossa, una riga da 0 a 10 con le
tacche, un pallino per testata (Eurogamer, IGN, Push Square, VGC…) alla sua altezza, e sopra la media
in condensato pesante («8,4»). Il tocco su un pallino mostra testata e voto originale («4/5»).
**Il 18–19 novembre è il giorno di GTA VI**: lì il verdetto sta nella testata GTA, grande, sotto il
conto alla rovescia.

**Cosa si muove.** Una volta: i pallini cadono sulla riga uno per testata, poi la media scivola al
suo posto. Il movimento mostra la dispersione — pallini tutti vicini o sparsi — che è l'informazione
che una media sola nasconde.

**Dove sta.** Dentro la scheda (Games), o nella testata GTA il giorno delle recensioni.

**Dati.** `verdetto: {gioco, media, voti: [{testata, voto, su, link}]}`. Lo script legge i
`reviewRating` (schema.org) nelle pagine delle nostre testate, senza chiave; solo con almeno 3 voti,
e mai un voto stimato. Per GTA lo può raccogliere l'agente `gta` il giorno dell'embargo.

**Costo** medio. **Rischi**: le scale diverse (5 stelle, 10, 100) vanno riportate a 10 con onestà e
dette nel tocco; poche testate fanno voti (Eurogamer usa le stelle, alcune nessun voto).

**Verdetto:** forte nei giorni giusti; bello per GTA, inutile nei giorni senza recensioni (e allora
non esce).

---

## 7. Il suggerimento del caricamento (GTA VI)

> «Come nella schermata di caricamento di GTA: in fondo alla testata, una riga "Lo sapevi?" con una
> curiosità vera della settimana.»

**Cosa si vede.** Una riga sottile in fondo alla testata GTA, sopra le schede: a sinistra un piccolo
cerchio turchese che gira (quello di caricamento dei giochi Rockstar, disegnato piatto), poi
«LO SAPEVI?» in condensato giallo e una frase: «Nel gioco gli Stati Uniti si chiamano "United States
of Paranola"». Il tocco apre la voce da cui viene.

**Cosa si muove.** In loop, come nelle schermate di caricamento (e come il nastro di «Ultim'ora»):
ogni 7 secondi la frase esce a sinistra come una banda e ne entra un'altra; si ferma col dito sopra.
Il cerchio gira solo mentre la riga è a schermo. Con «Riduci movimento» resta la prima frase, ferma.

**Dove sta.** In fondo alla testata GTA.

**Dati.** Ci sono già: l'app le prende da sola dall'archivio, dalle voci `curiosita` e `scoperta` di
`gta.voci` degli ultimi 14 giorni, usando il `title` (già in italiano, già verificato). Nessun campo
nuovo, nessun costo per la corsa. Meno di tre curiosità nell'archivio → la riga non esce.

**Costo** piccolo. **Rischi**: un testo che cambia da solo è più difficile da leggere; 7 secondi, una
frase corta, e mai la stessa due volte in un giro.

**Verdetto:** riconoscibilissimo per chi gioca, non costa niente, rimette in circolo l'archivio.

---

## 8. Radio Leonida

> «L'autoradio di GTA: ogni stazione è un genere di voce, e la lancetta si ferma dove oggi c'è più
> roba.»

**Cosa si vede.** Nella testata GTA, una scala di sintonia piatta, osso su viola scuro, con le tacche
come una vecchia autoradio e sopra cinque «stazioni» — Ufficiale · Scoperte · Curiosità · Leak · Dai
giocatori — con il numero di voci di oggi accanto. Le stazioni vuote sono grigie. Il tocco su una
stazione scorre alla prima scheda di quel tipo.

**Cosa si muove.** Una volta, all'arrivo: la lancetta rossa parte da sinistra, sfiora le stazioni e si
ferma su quella con più voci (oggi «Ufficiale» e «Curiosità», 2 ciascuna). Dice com'è fatta la
giornata di GTA: un giorno di leak, un giorno di Rockstar, un giorno di giocatori. Niente nomi delle
stazioni vere del gioco (sono marchi, e non dicono niente).

**Dove sta.** Nella testata GTA, fra la sintesi e le schede (alternativa al punto 7, o accanto sul Duo).

**Dati.** Ci sono già: `gta.voci[].tipo`. L'app conta da sola.

**Costo** piccolo. **Rischi**: con sei voci il conteggio dice poco; rischia di essere un giocattolo
se le voci sono sempre dello stesso tipo. Da provare dopo l'uscita, quando `reazione` cresce.

**Verdetto:** carino e GTA al cento per cento, ma porta meno informazione delle altre: ottava.

---

## L'idea folle — La minimappa che gira col telefono

> «In cima a GTA, la minimappa rotonda di Leonida: i puntini sono le voci di oggi, e se giri il
> telefono gira la mappa.»

**Cosa si vede.** Un cerchio piatto in basso a sinistra della testata GTA, come la minimappa del
gioco: le sagome di Leonida dalla mappa ufficiale (Vice City, Leonida Keys, Grassrivers, Port
Gellhorn, Ambrosia, Mount Kalaga) in campiture piatte del tramonto, e un puntino per ogni voce di
oggi che ha un luogo (il ponte levatoio della galleria, la zona della scoperta). Fuori dal cerchio,
sul bordo, una freccia per le voci che stanno nel mondo vero (il bus di Miami).

**Cosa si muove.** Con il permesso del giroscopio la minimappa ruota con il telefono, come nel gioco
quando l'auto gira; il puntino della voce aperta pulsa. Il tocco su un puntino apre la scheda.

**Dati.** Campo `luogo` per voce (`{zona, x, y}` sulla mappa ufficiale), scritto dall'agente `gta`
solo quando la fonte lo dice. Una mappa SVG di Leonida disegnata a mano una volta, in stile piatto.

**Costo** grande. **Rischi**: la mappa intera non è ufficiale prima dell'uscita (i luoghi vanno presi
solo da Rockstar); il permesso del giroscopio su iOS va chiesto con un tocco; dopo il 19 la mappa vera
cambia tutto. Prima dell'uscita le voci con un luogo sono una o due al giorno: rischio riempitivo.

**Verdetto:** folle, ma dopo l'uscita — quando ogni scoperta ha un posto sulla mappa — potrebbe
diventare la cosa più GTA dell'app.

---

## Le mie tre migliori

1. **In caricamento** — la firma della scheda, e l'unico oggetto che ricorda i rinvii (oggi Laufey).
2. **Le tappe del lancio** — fa crescere la testata GTA che Mike ama verso il 19, senza toccarla.
3. **Il registro dei problemi** — la sezione GTA dopo l'uscita: cosa dicono i giocatori, con uno stato vero.
