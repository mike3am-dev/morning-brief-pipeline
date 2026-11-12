# Le redazioni vere e i giochi di redazione

Ricerca dell'11 novembre 2026 per la redazione in 3D isometrico. Il compito: trovare oggetti, rituali
e ritmi delle redazioni vere e dei giochi di gestione da portare nella stanza, ognuno legato a un
dato che la corsa produce davvero.

**Come è fatta.** Ogni fonte citata qui è stata aperta e letta; dove una pagina non si apriva
(403, file binario) l'ho detto o l'ho lasciata fuori. I dati della corsa nominati sono quelli
elencati in `docs/redazione/mappa-dati.md` e `progetto.md`: niente è stato letto in `data/`.
Le citazioni sono brevi e nella lingua originale; il resto è parafrasi.

Legenda delle etichette nelle idee: **subito** (il dato c'è già, nei file che `stato.py` legge),
**più avanti** (serve un dato in più o una decisione di Mike), **no, perché…**

---

## 1. La redazione vera, oggetto per oggetto

### Il desk centrale: «hub and spoke» e anelli concentrici

**Cosa fa.** Mette chi decide al centro e chi esegue intorno, in modo che le decisioni passino a voce
invece che per email. Due varianti documentate:

- **Il raggio** (The Telegraph, Victoria, 2007): i reparti partono dal centro come raggi di una
  ruota, e al centro si riuniscono i capi dei reparti e gli specialisti del giorno. Intorno al centro
  quattro televisori su Sky News e una parete video lunga circa trenta metri con i canali all-news, la
  homepage e una classifica a rotazione delle notizie più lette del giorno.
  Fonte: [Press Gazette, «At the heart of the hub: the Telegraph on Budget day»](https://pressgazette.co.uk/at-the-heart-of-the-hub-the-telegraph-on-budget-day-37194/).
- **Gli anelli** (La Stampa, via Lugaro, Torino): pianta a cerchi concentrici. Al centro i capi
  della redazione, l'art director, il photo editor e il web editor; nel secondo anello i redattori
  dei settori più veloci (politica, cronaca, economia); nell'anello esterno il personale tecnico che
  prepara i testi per carta e web. Lo scopo dichiarato: da ogni posto si vede tutto il processo,
  dalla carta al digitale.
  Fonti: [Eidosmedia, caso La Stampa](https://eidosmedia.com/customers/case-studies/redesigning-the-newsroom),
  [Sabiana, uffici La Stampa di via Lugaro](https://www.sabiana.it/en/references/la-stampa-offices-di-lugaro).
- **L'anello di schermi** (The Washington Post, One Franklin Square, 2015): un «hub» aperto
  ventiquattr'ore, circondato da 21 monitor che trasmettono notizie dal vivo e i dati del sito in
  tempo reale. È il riferimento più vicino all'immagine che Mike ha in mente.
  Fonte: [Digiday, «The Washington Post goes modern»](https://digiday.com/media/inside-washington-post-goes-modern-new-office-space/).

**Da noi.** La distanza dal centro può dire una cosa vera: quanto un agente è vicino alla decisione
di pubblicare. Al centro la regia (che pubblica con `push.py`), nel secondo anello chi scrive
(redattore, revisore, ai, schede, gta, lettura), fuori le macchine (telescrivente, quadro dei feed,
radio, telefono, antenna). Il progetto attuale ha invece «la fila della prosa», che racconta un'altra
cosa vera: l'ordine in cui le carte passano di mano. Le due piante non stanno insieme; vedi l'idea 16.

### Il big board: lo schermo con i dati di lettura

**Cosa fa.** Mostra a tutta la stanza quali articoli stanno andando, in una forma leggibile da lontano.

- **Chartbeat Big Board**: classifica delle notizie con link, lettori connessi in quel momento, tempo
  di lettura, ricircolo e provenienza. Molte redazioni la mettono al centro, su un televisore grande
  o un proiettore. La variante **Mosaic** disegna le pagine come tessere: più grande la tessera, più
  grande la quota di traffico.
  Fonte: [Chartbeat, «Put your data on display with Big Board»](https://chartbeat.com/?p=3376).
- **Ophan** (The Guardian, interno): la vista principale elenca gli ultimi 50 articoli pubblicati,
  colorati per provenienza del traffico (verde Google, acquamarina Twitter), con dove sono già stati
  rilanciati; circa 900 persone lo usano ogni mese; i dati durano una settimana.
  Fonte: [VentureBeat, «Ophan: inside the Guardian's data-driven newsroom»](https://venturebeat.com/media/ophan-inside-the-guardians-data-driven-newsroom/).
  Il grafico minuto per minuto delle provenienze è, per l'audience editor Chris Moran, «the most
  important graph»; sul tempo di attenzione ammette che non sanno ancora quale valore sia buono.
  Fonte: [journalism.co.uk, «Ophan: key metrics informing editorial»](https://www.journalism.co.uk/how-ophan-offers-bespoke-data-to-inform-content-at-the-guardian/).
  Prima di Ophan, per capire se una modifica funzionava servivano ore
  ([Digiday, 2015](https://digiday.com/media/guardian-uses-attention-data-goose-traffic)).

**Da noi.** Non abbiamo lettori connessi: abbiamo un lettore solo, e un dato che le redazioni non
mettono sul big board, cioè **quante testate raccontano ogni notizia** (`verifica.testate`, la riga
«quanto gira» dell'app). Il Mosaic con le tessere grandi quanto le testate è un big board vero. I
segnali di lettura di Mike (`taste.py`) sono l'equivalente di Ophan, ma per un lettore: vanno detti
così (idee 7 e 8).

### La riunione

**Cosa fa.** Decide cosa si fa oggi e in che ordine.

- **New York Times**: riunione delle 10 del mattino, 39 capiservizio nella sala del terzo piano;
  il «verdetto» della prima pagina alle 4:30 del pomeriggio
  ([IJNet](https://ijnet.org/en/story/how-new-york-times-refocused-its-morning-news-meeting-digital-reporting)).
  Le riunioni della prima pagina erano due al giorno; nel 2015 Dean Baquet le ha spostate sul
  digitale: ne escono tre o quattro pezzi da mettere in vetrina, la «Dean's List»
  ([Columbia Journalism Review](https://www.cjr.org/behind_the_news/page_one_meetings_symbolism_re.php)).
- **Guardian**: la riunione delle 10 è aperta a qualunque dipendente. Trasferita a Kings Place nel
  2008, si guarda anche dalla scrivania e dagli schermi del palazzo; ci vanno da 50 a 130 persone
  ([journalism.co.uk, 2009](https://www.journalism.co.uk/guardian-staff-could-report-to-morning-conference-via-video-links/)).
- **Corriere della Sera** (proposta presentata da Luciano Fontana il 24 giugno 2026): la riunione del
  mattino decide e programma i contenuti del giorno, che vanno prima sul digitale; una seconda
  riunione nel primo pomeriggio sceglie il materiale per la carta
  ([ItaliaOggi, 25 giugno 2026](https://www.italiaoggi.it/marketing-e-media/media/corriere-della-sera-in-redazione-dalle-6-del-mattino-dorsi-locali-da-ripensare-r5hh7e49)).

**Da noi.** La sala riunioni resta vuota finché le riunioni non esistono (regola già scritta in
`progetto.md` §6). Due cose prese da qui: la riunione del Guardian **si guarda da fuori** (Mike dal
tablet), e quella del Times produce **una lista corta** (la Dean's List), che da noi esiste già:
`top3` e le cinque approfondite.

### Il timone, il menabò, il «budget»

**Cosa fa.** Il **timone** è la rappresentazione di tutte le pagine del giornale, con la sequenza
degli articoli e quante pagine prende ciascuno; si aggiorna mentre il giornale si fa
([Focus Junior, «Come si fa un giornale»](https://www.focusjunior.it/progetti-scuola/progetti-scuola-primaria/diventa-giornalista-2016/come-si-fa-un-giornale-la-guida-di-focus-junior-al-giornalino-della-scuola-parte-1/)).
Nei giornali americani lo stesso ruolo lo fa il **budget**: l'elenco di tutte le storie del numero,
su una pagina sola, con lo stato aggiornato da chi le scrive
([Columbia, «News Budget»](https://ccnmtl.columbia.edu/portfolio/journalism/news_budget.html)).
Nelle riviste il timone sta **sul muro**: le pagine stampate appese in ordine, perché vedendole tutte
insieme si capisce dove due storie o due immagini si scontrano
([Offscreen, «How to plan a magazine», 2015](https://www.offscreenmag.com/blog/how-to-plan-a-magazine)).
Nei programmi di impaginazione ogni pagina del timone ha **un semaforo**: rosso se la scadenza della
sua fase è passata, ambra se resta poco tempo rispetto alla durata della fase, verde altrimenti
([Stibo, Flatplanner, «Publication milestones»](https://doc.stibosystems.com/doc/version/8.1/web/content/publisher/stepflatplanner/flatplanner_workflows/publication_milestones.html)).

**Da noi.** La lavagna è il timone dell'edizione: le sezioni in fila, ognuna con il suo numero di
voci e chi l'ha scritta. Il muro serve al visualista: i cinque approfondimenti appesi in fila con il
loro tipo di grafico, così lo scontro (due «esploso» nello stesso giorno, che il lint segnala) si vede.
Il semaforo serve alle scrivanie (idea 2).

### La scaletta e il cronometro (la televisione)

**Cosa fa.** La scaletta («rundown») è la tabella del programma riga per riga. Nel sistema ENPS le
colonne sono pagina, sigla della storia, segmento, effetti, conduttore, camera, autore, durata
effettiva, durata prevista e **back time**. Quando si va in onda la riga corrente diventa gialla, la
barra in basso dice in grande rosso quanto si è sotto o sopra il tempo («Under 02:15»), e il timer di
ogni pezzo conta alla rovescia la durata prevista, poi riparte in avanti per dire di quanto si sfora
([Syracuse University, guida ENPS «Putting your rundown on air»](https://nccnewslinks.syr.edu/wp-content/uploads/2012/07/ENPS-8-Backtiming-Within-a-Rundown-NCC-News.pdf)).
Il **front time** dice quando un pezzo deve cominciare, il **back time** quando deve finire perché
il programma chiuda in orario
([Scripto, «Rundown timing»](https://help.scripto.live/en/articles/8230722-rundown-timing)).
Nei TG italiani la notizia «classica» è lancio più servizio; le notizie si misurano in brevi (fino a
60 secondi), medie e lunghe (oltre i 120), e si raggruppano in **grappoli** tematici
([Osservatorio di Pavia, «Profilo dei telegiornali nazionali»](https://www.osservatorio.it/wp-content/uploads/2017/02/ProfiloTG.pdf)).

**Da noi.** La corsa ha esattamente questi numeri: per ogni agente i minuti effettivi
(`corse.json`, registri) e, per alcuni, una durata prevista scritta in `CLAUDE.md` (visualista 8
minuti, revisore 10, ai, schede e gta 10; la corsa intera 45 dall'11 novembre). La scaletta ENPS è
l'oggetto più fedele che si possa mettere al desk della regia (idea 1).

### La spia «ON AIR»

**Cosa fa.** La «tally light» è la lampada rossa sulla camera che è in onda; il verde, dove c'è, vuol
dire «sta per andare in onda», il giallo che si sta registrando a parte. La stessa spia sta fuori
dalle porte degli studi per tenere lontano chi entrerebbe durante la diretta
([Wikipedia, «Tally light»](https://en.wikipedia.org/wiki/Tally_light)).

**Da noi.** Una spia sopra la porta della redazione: rossa «IN ONDA» quando l'edizione di oggi è
pubblicata, spenta prima. Il verde no: non c'è un dato per «pronta ma non ancora in onda».

### Lo spillone

**Cosa fa.** Lo «spike» era un ago di metallo sulla scrivania del caporedattore, su cui si
infilzavano i pezzi scartati; da lì «to spike a story», non pubblicarla
([Wikipedia, «Spike (journalism)»](https://en.wikipedia.org/wiki/Spike_(journalism))).

**Da noi.** Lo scarto è un numero vero e grande: 1.119 articoli raccolti l'11 novembre
(`raw.count`) contro le notizie in pagina; per le schede, fino a 18 candidati contro al massimo 10
scelti (`rubriche` contro `-scritte`). Lo spillone è il posto per quel rapporto.

### La macchina che segnala, l'uomo che decide

**Cosa fa.** Reuters ha messo in redazione nel 2018 Lynx Insight, che cerca nei dati tendenze,
anomalie e fatti notevoli e li passa ai giornalisti; non scrive gli articoli. Reg Chua l'ha chiamata
«cybernetic newsroom»: la macchina trova, il giudizio resta umano
([journalism.co.uk, 12 marzo 2018](https://www.journalism.co.uk/new-automated-tool-at-reuters-helps-its-cybernetic-newsrooms-find-stories-in-data/)).

**Da noi.** È la stessa divisione che `progetto.md` fa fra **agenti** (persone alle scrivanie) e
**script** (oggetti che si accendono): `eco.py`, `verify.py`, `lint.py` segnalano, gli agenti
scrivono. Conferma la scelta, non aggiunge oggetti.

### Lo spazio intorno

**Cosa fa.** Un rapporto dell'American Press Institute su una ventina di redazioni ridisegnate
(2017) trova, al Washington Post, squadre così vicine che ci si raggiunge spingendo indietro la
sedia; altrove luce naturale e colori chiari per il morale,
e la necessità di posti tranquilli dove lavorare senza distrazioni; avverte che l'open space non è
una tendenza universale
([Nieman Lab, 18 ottobre 2017](https://niemanlab.org/2017/10/modern-media-modern-newsroom-a-new-report-looks-at-the-how-and-why-of-newsroom-redesigns)).

**Da noi.** Piante e luce stanno nella stanza come nelle redazioni vere, ma qui ogni oggetto porta
un dato (idea 17 per le piante; la luce segue già l'ora vera in `progetto.md` §5).

---

## 2. I rituali e la giornata

### Come scorre il giorno in una redazione vera

| Quando | Dove | Cosa succede | Fonte |
|---|---|---|---|
| 4:45 | Il Post, *Morning* | Francesco Costa si sveglia, legge fino a dieci quotidiani in un'ora e mezza, registra da casa, taglia, esporta; l'obiettivo è pubblicare alle 8, con qualche minuto di scarto in un senso o nell'altro | [Il Post sul New Yorker, 2022](https://www.ilpost.it/2022/09/23/new-yorker-costa-morning/); [lancio, 2021](https://www.ilpost.it/2021/05/13/morning-francesco-costa-podcast-rassegna-stampa/) |
| 6:00–7:00 | Corriere (proposta 2026) | una piccola squadra apre il sito alle 6; circa il 30% della redazione arriva alle 7 | [ItaliaOggi](https://www.italiaoggi.it/marketing-e-media/media/corriere-della-sera-in-redazione-dalle-6-del-mattino-dorsi-locali-da-ripensare-r5hh7e49) |
| prima mattina, 9, 12, 17 | The Times (dal 2016) | un'edizione digitale al mattino presto e tre aggiornamenti a orari fissi, quando i lettori arrivano; la notizia urgente aspetta il prossimo aggiornamento salvo i casi grossi | [Nieman Lab, marzo 2016](https://www.niemanlab.org/2016/03/the-uks-times-and-sunday-times-are-structuring-their-new-apps-and-website-around-peak-traffic-times/) |
| 10:00 | NYT, Guardian | la riunione del mattino (NYT: 39 capiservizio; Guardian: aperta a tutti, anche dagli schermi) | [IJNet](https://ijnet.org/en/story/how-new-york-times-refocused-its-morning-news-meeting-digital-reporting); [journalism.co.uk](https://www.journalism.co.uk/guardian-staff-could-report-to-morning-conference-via-video-links/) |
| 11:00 | Corriere (proposta) | un altro 30% arriva subito dopo la riunione generale | ItaliaOggi |
| primo pomeriggio | Corriere (proposta) | seconda riunione: cosa va sulla carta | ItaliaOggi |
| 12:30–19:00 | Telegraph, giorno del Bilancio 2007 | il centro guarda il discorso alle 12:30; verso le 14 i conti; alle 15 audio e video; alle 16 i calcolatori online; fra le 16:15 e le 19 l'edizione pomeridiana di quattro pagine distribuita nelle stazioni | [Press Gazette](https://pressgazette.co.uk/at-the-heart-of-the-hub-the-telegraph-on-budget-day-37194/) |
| 15:00 | Corriere (proposta) | il restante 40% | ItaliaOggi |
| 16:30 | NYT | il verdetto sulla prima pagina | IJNet |
| 22:30 | Corriere | si va in stampa | ItaliaOggi |

Una ricerca dell'Università di Leeds su un quotidiano londinese (2015–16) aggiunge il rovescio della
medaglia: tolta l'unica chiusura della carta, il tempo si frantuma in tante scadenze mobili, la
pubblicazione smette di essere la fine del lavoro, e le redazioni rimettono ordine con turni più
rigidi e **passaggi di consegne più curati**
([Leeds University Business School, luglio 2026](https://business.leeds.ac.uk/dir-record/research-blog/2559/new-rhythms-new-rules-time-and-work-in-the-digital-newsroom)).

### Il conto alla rovescia verso l'uscita

Tre modi in cui le redazioni vere contano il tempo:

1. **La chiusura fissa** (la carta): un'ora sola, uguale ogni giorno (Corriere: 22:30). Tutto il
   giorno si misura a ritroso da lì.
2. **Il back time** (la televisione): ogni pezzo ha l'ora entro cui deve finire, e la barra dice in
   ogni momento quanti secondi si hanno in più o in meno (ENPS). È un conto alla rovescia che si
   corregge da solo quando un pezzo sfora o salta.
3. **L'appuntamento col lettore** (The Times, *Morning*): l'ora non la decide la tipografia, la
   decide l'abitudine di chi legge. *Morning* punta alle 8 e lo dice: a volte qualche minuto prima,
   a volte dopo.

La corsa di TMB è del terzo tipo con i numeri del secondo: un appuntamento (Mike vuole l'edizione
online entro le 7) e un tetto per fase. Cosa si può contare **senza toccare la corsa**, secondo
`mappa-dati.md`: l'inizio e la durata (`corse.json`), i minuti di ogni agente, gli orari di
`fetched_at` di raccolta, LAB e discussioni, l'ora dei commit di `salva.py`. Cosa no: le fasi minuto
per minuto e qualunque cosa *durante* la corsa. Quindi il conto alla rovescia vero oggi è:

- **di notte**: quanto manca alla prossima partenza della routine (l'ora vera, che oggi è 5:34 e
  non 6:30, come nota `progetto.md` §5);
- **a corsa finita**: quanto ha preso rispetto al tetto («26 di 45») e a che ora l'edizione è andata
  in onda rispetto alle 7.

---

## 3. Dai giochi

Qui conta la soluzione d'interfaccia, non il gioco. Per ognuna: cosa fa, la fonte, cosa ne
prenderemmo.

**The Republia Times** (Lucas Pope, 2012). Una giornata di lavoro, dalle 6 alle 18, dura poco più di
un minuto vero; la pagina è una griglia di 20 celle esagonali e gli articoli ne occupano 9, 4 o 2 a
seconda di quanto pesano
([Games Like Finder](https://gameslikefinder.com/review/the-republia-times/)). A fine giornata un
breve rapporto dice come sta la famiglia
([MediaShift, 2012](https://mediashift.org/2012/05/what-the-republia-times-game-can-teach-us-about-propaganda121/)).
*Da prendere*: la giornata compressa (è il «Rivedi la corsa» di `progetto.md`) e la pagina in cui la
grandezza dice il peso.

**Papers, Please** (Lucas Pope, 2013). Ogni turno ha un tempo vero limitato; gli errori arrivano come
una multa via fax poco dopo che il viaggiatore è uscito; a fine giornata un conto da far quadrare
(affitto, cibo, riscaldamento) e una schermata sulla famiglia
([Wikipedia](https://en.wikipedia.org/wiki/Papers,_Please)). Il giornale del giorno dopo racconta che
fine ha fatto chi hai lasciato passare
([RPGFan](https://www.rpgfan.com/review/papers-please/)).
*Da prendere*: il libro dei conti a fine turno, e il ritaglio del giorno dopo che chiude una storia.

**Headliner: NoviNews** (Unbound Creations). Ogni giorno una pila di notizie da timbrare
«approvato» o «respinto»; poi si torna a casa a piedi e per strada la gente dice cosa è cambiato
([Gaming Trend](https://gamingtrend.com/reviews/you-cant-have-it-both-ways-headliner-novinews-review/)).
*Da prendere*: il giro nella stanza dopo l'edizione, in cui si vedono le conseguenze. *Da lasciare*:
il timbro, che da noi non deciderebbe niente.

**Not For Broadcast** (NotGames). Sul muro due schermi grandi: quello che va al pubblico e la regia,
qualche secondo avanti; sotto quattro schermi piccoli, uno per camera; una levetta per l'interferenza;
il pubblico cresce o cala con gli errori
([UploadVR](https://uploadvr.com/not-for-broadcast-vr-review/)). Ogni trasmissione dura circa mezz'ora
vera, con pubblicità da lanciare e parolacce da coprire con due secondi di ritardo
([KeenGamer](https://www.keengamer.com/articles/reviews/pc-reviews/not-for-broadcast-review-stress-tested-pc)).
*Da prendere*: la distinzione fra «quello che vede il lettore» e «quello che vede la regia».
*Da lasciare*: il pubblico che sale e scende.

**News Tower** (Sparrow Night, versione finale 18 novembre 2025). Un giornale di Brooklyn negli anni
Trenta, visto come un palazzo in sezione; ogni settimana ha un obiettivo e ogni domenica una nuova
scadenza; più di trenta mestieri; macchine del caffè, manifesti e piante per il morale
([Steam](https://store.steampowered.com/app/1649950/News_Tower/)). Le notizie arrivano dal telegrafo e
passano di piano in piano; una pagina contiene tre storie; l'interfaccia è giudicata affollata
([Siliconera](https://www.siliconera.com/review-news-tower-offers-a-satisfying-newspaper-management-loop/)).
Esce la domenica: niente ciclo quotidiano
([Nieman Lab, febbraio 2026](https://www.niemanlab.org/2026/02/in-the-video-game-news-tower-as-in-real-life-running-a-newspaper-isnt-easy/)).
*Da prendere*: la notizia che passa fisicamente di posto in posto. *Da lasciare*: i bisogni dei
dipendenti e le piante come semplice arredo.

**Two Point Hospital** (Two Point Studios). Icone sopra le stanze per «coda troppo lunga» e «serve
personale»; un'icona ambigua (freccia blu su croce verde) costringe i giocatori a chiedere sul forum,
e vuol dire «priorità alta»
([Steam, discussione](https://steamcommunity.com/app/535930/discussions/0/1737715419906034596)).
Guarigione, visita importante e morte hanno ciascuna un'icona e un suono; un annunciatore
all'altoparlante dice dove manca qualcuno; ma se sei ingrandito su un'altra zona, del problema non
ti accorgi
([Can I Play That?, 2019](https://caniplaythat.com/2019/02/24/deaf-game-review-two-point-hospital/)).
Le sovrapposizioni colorano la pianta per un aspetto solo (per esempio la gradevolezza)
([Magic Game World](https://www.magicgameworld.com/two-point-hospital-ui-and-reading-your-menus/)).
*Da prendere*: l'altoparlante. *Da evitare*: le icone senza parole e gli avvisi che spariscono fuori
inquadratura.

**Game Dev Tycoon** (Greenheart Games). Durante il lavoro salgono bolle con i punti di design e di
tecnologia, con un suono che i recensori trovano perfetto
([PC Invasion](https://www.pcinvasion.com/incgamers-vs-game-dev-tycoon-the-collective-review/2)); i
bug compaiono e si correggono a intervalli; quando le bolle sono troppe insieme i giocatori chiedono
di limitarle
([Steam, discussione](https://steamcommunity.com/app/239820/discussions/0/864977564346123827)).
*Da prendere*: il numero vero che sale dalla scrivania nel momento in cui viene prodotto. *Da
evitare*: la pioggia di bolle.

**Factorio** (Wube). Due livelli di avviso: un'icona **sulla macchina** che resta finché la sua
condizione non cambia (manca carburante, uscita piena), e una **barra degli avvisi** che dura da 5 a
30 secondi; passando sull'avviso compaiono frecce ai bordi dello schermo verso le macchine che non si
vedono, e un clic le inquadra
([Factorio Wiki, «Alerts»](https://wiki.factorio.com/Alerts)).
*Da prendere*: tutto. È la risposta al difetto di Two Point.

**The Sims 4.** Un solo indicatore sopra la testa, il plumbob, il cui colore è quello **dell'umore
peggiore**: verde se tutto va, giallo o arancio, rosso se qualcosa è critico
([The Sims Wiki](https://www.thesimswiki.com/wiki/Plumbob)).
*Da prendere*: un pallino sopra ogni scrivania, del colore della cosa peggiore della giornata. È anche
il pallino della sigla.

**RimWorld e Prison Architect.** La giornata come griglia di 24 caselle: in RimWorld una riga per
abitante, un'attività per ora (qualsiasi, lavoro, svago, sonno, meditazione)
([RimWorld Wiki, «Schedule»](https://rimworldwiki.com/wiki/Schedule)); in Prison Architect il
«regime» della prigione con la precisione di un'ora
([Gamepressure](https://www.gamepressure.com/prisonarchitect/regime/z95202)).
*Da prendere*: la striscia delle 24 ore, ma riempita solo con quello che è successo davvero.

**Hades** (Supergiant). Il gioco guarda lo stato della partita (per esempio: incontri un personaggio
con poca vita) e sceglie una battuta scritta per quella situazione; Greg Kasavin cerca i momenti in
cui senti che il gioco «is paying attention»
([Game Developer](https://gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death)).
*Da prendere*: la prima frase di ogni agente nasce dal fatto più notevole della sua giornata.

**Orwell** (Osmotic Studios). In un episodio si possono caricare solo 20 frammenti d'informazione,
perché il sistema ha bisogno di tempo per elaborarli
([Wikipedia](https://en.wikipedia.org/wiki/Orwell_(video_game))). La scarsità obbliga a scegliere.
*Da prendere*: un mazzo grosso si mostra come mazzo, con in cima le poche cose che contano (le 70
richieste del visualista sono già trattate così in `progetto.md` §7).

**Cercati e non usati.** Per *Software Inc.*, *Mad Games Tycoon 2* e *Good Company* non ho trovato
descrizioni affidabili di come mostrano lo stato dei dipendenti (solo forum e pagine di vendita):
restano fuori, per non attribuire soluzioni non verificate.

---

## 4. Idee da prendere

1. **La scaletta della corsa, alla ENPS** — **subito.** Al desk della regia una tabella, una riga per
   agente nell'ordine della procedura: sigla, «previsto» (il tetto scritto in `CLAUDE.md`, vuoto
   per chi non ce l'ha), «effettivo» (`corse.json`), scarto. In fondo la barra rossa: «SOTTO 19:00»
   (45 meno i minuti veri). Durante «Rivedi la corsa» la riga corrente diventa gialla. È l'oggetto più
   vero che una redazione televisiva possa prestarci.
2. **Il semaforo e il pallino sopra ogni scrivania** — **subito.** Un pallino solo per agente, del
   colore della cosa peggiore (logica del plumbob): verde se ha consegnato dentro il tetto, ambra se
   ne ha usato più del 60%, rosso se l'ha superato o se è «saltato», grigio se «non oggi».
   Le soglie alla Stibo, sui minuti di `corse.json`; per chi non ha un tetto scritto, solo
   consegnato/saltato. La parola accanto al pallino, sempre.
3. **La spia IN ONDA sopra la porta** — **subito.** Rossa con l'ora quando l'edizione di oggi è
   pubblicata, spenta prima. Niente verde.
4. **L'orologio da studio con l'arco del tetto** — **subito.** Un quadrante con l'arco dei 45 minuti a
   partire dall'`inizio` vero, riempito per i `minuti` della corsa: «26 di 45». Di notte lo stesso
   quadrante conta le ore alla prossima partenza.
5. **Il timone sulla lavagna** — **subito.** Le sezioni dell'edizione in fila come pagine di un
   timone (Apple, AI, Games, Scienza, GTA VI, radar, «Di cosa si parla», discussioni, «Se te lo
   fossi perso»), ciascuna nel colore della sua scheda, con il numero di voci e chi l'ha scritta;
   «oggi l'ha scritta la regia» quando l'agente è `sostituito`. È il menabò vero del giorno.
6. **Il muro dei cinque** — **subito.** Accanto alla lavagna i cinque approfondimenti appesi in fila,
   ciascuno con il titolo e il tipo di grafico (`visivi`). Due tipi uguali si toccano e lo si vede.
7. **Il mosaico «quanto gira»** — **subito.** Sull'anello di schermi le notizie di oggi come tessere
   grandi quanto `verifica.testate`, nel colore del `tag`, con l'origine. Un big board vero, con
   l'unico dato di diffusione che abbiamo.
8. **Il big board del lettore unico** — **più avanti.** Cosa Mike ha aperto, letto, approfondito
   dell'edizione di ieri, dai segnali che `taste.py` già scarica. Serve che `stato.py` li porti nel
   suo JSON (dal Mac). Va detto per quello che è: «ieri hai letto», mai un pubblico.
9. **L'altoparlante** — **subito.** Una riga in cima alla stanza che annuncia i fatti con l'ora:
   raccolta (`fetched_at`), commit di `salva.py`, edizione in onda. Solo orari veri.
10. **Le spie che restano (Factorio)** — **più avanti.** Un'icona sulla scrivania che resta finché la
    condizione non cambia: «titoli non tradotti» su schede quando `_traduzione` dice che Gemini non
    ha risposto, «LAB senza foto» su ai, «foto stretta» sulla regia. Servono gli avvisi del lint nel
    JSON di `stato.py`. Con le frecce ai bordi quando la scrivania è fuori inquadratura sul telefono.
11. **Il biglietto di fine turno** — **subito.** Sul tavolo del CEO il passaggio di consegne: la data,
    le tre notizie d'apertura, quante notizie su quanti articoli letti, i feed muti, la previsione
    chiusa se c'è. È il messaggio di chiusura che `CLAUDE.md` §6 chiede alla corsa, ricostruito
    dall'edizione.
12. **Il libro dei conti** — **subito.** Una pagina di registro: minuti e token della corsa, per
    modello, le ultime sette corse (`corse.json`). Asciutto come il conto di fine giornata di
    *Papers, Please*.
13. **Il tabellone delle uscite** — **subito.** Le ultime due settimane come un tabellone di
    stazione: giorno, ora in cui l'edizione è andata in onda, «in orario» se prima delle 7. Da
    verificare quale ora usare (`inizio` + `minuti` di `corse.json`, o il commit di `salva.py` dopo
    `push.py`).
14. **La striscia delle 24 ore** — **subito**, ma vuota dove non c'è niente. Una riga per agente e
    un'ora per casella, alla RimWorld: si colorano solo le ore con un fatto vero (la corsa, la
    raccolta, l'archivista il lunedì). Le riunioni restano caselle tratteggiate con scritto «non
    esiste ancora».
15. **Il numero che sale dalla scrivania** — **subito**, dentro «Rivedi la corsa». Quando una
    scrivania si accende sale un solo numero vero («12 voci AI», «5 grafici», «1.119 articoli»),
    come le bolle di Game Dev Tycoon, uno per volta.
16. **Gli anelli di La Stampa** — **più avanti, da decidere con Mike.** Pianta alternativa: la regia
    al centro, chi scrive nel secondo anello, le macchine fuori. Dice quanto ciascuno è vicino alla
    pubblicazione; perde però «la fila della prosa», che dice l'ordine del lavoro.
17. **La pianta che cresce con le edizioni in orario** — **subito.** Una foglia per ogni edizione
    uscita dentro il tetto negli ultimi trenta giorni, una foglia gialla per ogni sforamento. Le
    piante di *News Tower* tengono su il morale; le nostre portano un fatto.
18. **La prima frase dell'agente** — **subito.** Alla Hades: quando Mike si avvicina, l'agente parte
    dal fatto più notevole della sua giornata, in quest'ordine: è stato sostituito, ha sforato, ha
    fatto un record (meno minuti, più voci), oppure la consegna. Mai una battuta generica.
19. **Il ritaglio del giorno dopo** — **subito.** Quando una notizia di oggi chiude una previsione
    (`resolves`), sul pannello compare il ritaglio: «confermato» o «smentito», con la notizia di
    allora. È *Papers, Please* che ti dice come è andata a finire.
20. **La riunione che si guarda dal tablet** — **più avanti.** Quando le riunioni esisteranno, Mike
    le segue dal tablet come i dipendenti del Guardian dagli schermi, e il proiettore in sala mostra
    l'edizione di cui si parla.

E quattro **no**:

- **Il timbro «approvato / respinto»** (Headliner) — **no, perché** la redazione guarda e non tocca:
  un timbro che non cambia l'edizione sarebbe una finzione. Le decisioni passano dai post-it.
- **Il pubblico che sale e scende** (Not For Broadcast, Chartbeat) — **no, perché** il lettore è uno
  e i suoi segnali hanno già il loro posto (idea 8). Un pubblico disegnato sarebbe inventato.
- **Fame, stanchezza, caffè degli agenti** (News Tower, Two Point) — **no, perché** gli agenti non si
  stancano: un bisogno sullo schermo sarebbe un dato falso.
- **Il ticker delle ultime notizie a ciclo continuo** — **no, perché** TMB è un'edizione, come quella
  del Times: il momento è l'uscita, e il resto del giorno la stanza è quieta.

---

## 5. Cosa evitare

- **L'animazione che finge il lavoro.** Una scrivania che «lavora» quando la corsa non gira dice il
  falso. Il turno di notte acceso mostra l'ultima consegna, non un lavoro in corso (già in
  `progetto.md` §5); «Rivedi» non si chiama mai «dal vivo».
- **Numeri senza un perché.** Ophan ammette di non sapere quale tempo di attenzione sia buono, e il
  rapporto dell'API riporta chi dubita che i dati sugli schermi siano sempre utili. Ogni numero nella
  stanza deve rispondere a una domanda di Mike (è uscita in orario? chi ha tardato? cosa mi aspetta?).
- **Le icone senza parole.** La freccia blu di Two Point ha costretto i giocatori a chiedere sul
  forum. Il menu dell'app ha già le parole scritte accanto alle icone: nella stanza ogni pallino ha la
  sua parola accanto.
- **Gli avvisi che spariscono fuori inquadratura.** Sul telefono si vede una parte della stanza: un
  problema deve avere una freccia o una riga in cima (Factorio), non solo un'icona sulla scrivania.
- **Troppe cose che si muovono insieme.** Le bolle di Game Dev Tycoon a un certo punto infastidiscono;
  le chicche dell'app partono una volta, quando arrivano a schermo. Stessa regola qui.
- **La classifica degli agenti.** Il big board ordina le notizie, non le persone. Mettere gli agenti
  in fila per token o minuti trasformerebbe uno strumento in una gara, e il costo dipende dal modello
  più che dal lavoro.
- **Il gioco da copiare.** Palazzo in sezione, fazioni, multe, punteggi: sono la struttura di un gioco
  che deve essere vinto. La redazione di TMB non si vince; si guarda e si decide.
- **Il suono come unico segnale.** Two Point affida al suono avvisi che non hanno un equivalente
  visivo; sul Duo la voce delle pagine non c'è (`mappa-dati.md` §1). Il suono, se c'è, si aggiunge a
  una cosa che si vede già.
