# Uffici e città di agenti: cosa esiste e cosa prendere

Ricerca dell'11 novembre 2026. Pagine aperte e lette una per una: i repository, i README, i
thread di Hacker News (letti dall'archivio Algolia), Product Hunt e le copie dei post Reddit. Dove
un dato viene da una recensione e non dalla pagina del progetto, lo dico. Le stelle su GitHub sono
quelle viste oggi.

Una premessa che torna in tutti i progetti: **lo stato degli agenti si legge in due modi**, o dai
segnali espliciti (gli hook di Claude Code: `SessionStart`, `PreToolUse`, `PermissionRequest`,
`Stop`) o indovinandolo dai log. Chi indovina sbaglia, e lo ammette. Per noi, che abbiamo la regola
«tutto quello che si legge è vero», è la prima cosa da decidere.

---

## I progetti

### 1. Pixel Agents (VS Code e browser)
[github.com/pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents) · circa 10.200 stelle

Ogni sessione di Claude Code diventa un personaggio in pixel art in un piccolo ufficio: batte sulla
tastiera quando modifica file, legge quando cerca, e quando aspetta un permesso o una risposta gli
compare un fumetto. I sottoagenti entrano e escono come personaggi a parte. C'è un editor della
pianta (pavimenti, muri, mobili, «aree» preferite da una cartella di progetto) e un suono a fine
turno. Lo stato arriva dagli hook; se mancano, lo ricava dai file di trascrizione. Nel post di
lancio su Reddit (febbraio 2026) l'autore ammetteva che il timer d'inattività con cui indovina la
fine del turno a volte sbaglia. Il catalogo completo dei mobili usa un tileset a pagamento. Una
critica uscita su [UC Strategies](https://ucstrategies.com/news/this-viral-ai-tool-does-nothing-but-developers-cant-stop-watching-it/)
lo chiama teatro motivazionale: si guarda e basta, non si governa niente.

### 2. Claude Office Visualizer
[github.com/paulrobello/claude-office](https://github.com/paulrobello/claude-office) · 615 stelle, v0.25.1

L'agente principale è il capo, i sottoagenti sono impiegati che camminano alle scrivanie. È il
progetto con più oggetti che portano un dato: il **cestino che si riempie di carta** man mano che
cresce il contesto (il capo lo calpesta quando il contesto si compatta), il **cartello «giorni
senza incidenti»** che conta gli strumenti usati dall'ultima compattazione, la **stampante** che si
anima quando esce un rapporto, la **finestra sulla città** con giorno e notte all'ora locale, un
orologio a muro, una lavagna con dodici modalità (cose da fare, kanban, linea del tempo, mappa dei
file toccati, ma anche «borsa», meteo e un contatore dei caffè). Il centro di comando divide gli
agenti in Ti serve, Al lavoro, Fatto, Chiuso. Due cose stonano con la nostra regola: frasi casuali
di accettazione e consegna messe in bocca agli impiegati, e nomi e riassunti generati da un altro
modello (senza chiave si vedono gli id grezzi).

### 3. whatsmyagentdoing — l'ufficio isometrico
[github.com/Charonyuu/whatsmyagentdoing](https://github.com/Charonyuu/whatsmyagentdoing) · 398 stelle

È il più vicino all'idea del video: un comando `/myoffice` apre in locale un ufficio **isometrico**
(una versione 2D disegnata su canvas senza dipendenze, e una 3D con luci e ombre). Chi pensa ha la
nuvoletta; chi sta usando uno strumento batte e **sul monitor scorre il codice**; chi aspetta te
**si alza e saluta con la mano**; chi ha finito da poco lascia la scrivania e va in dispensa, sul
divano, al biliardino (solo se gli agenti liberi sono due); chi ha finito da tempo è «andato a
casa». Le finestre seguono l'ora del giorno. Accanto c'è una **vista a lista** in tre gruppi (Ti
serve, Al lavoro, Finiti) con il cronometro del turno, e un clic apre stato, modello, cartella,
consumo e conversazione recente. Segnala «nessun progresso» dopo 10 minuti di strumento o 8 di
silenzio. Onesto sui limiti: i permessi non finiscono nei log, quindi senza l'hook un agente
bloccato risulta «al lavoro». Ha una modalità privata (solo stato, niente testi) e una dimostrativa
con una squadra inventata, con cui sono girate le immagini del README.

### 4. OfficeAI
[dykyi-roman.github.io — articolo dell'autore](https://dykyi-roman.github.io/pages/articles/18.html)

App desktop: ogni agente in esecuzione è un dipendente con la sua postazione in un ufficio
isometrico; chi è inattivo lascia la scrivania e va al distributore d'acqua, in cucina, in sala
riunioni. Non tocca gli agenti: legge i processi del sistema e i log che già scrivono. Passando
sopra un agente, un fumetto mostra l'anteprima della risposta in corso; un pannello a tabella dà
modello, stato, progetto, durata. L'autore dichiara i consumi (fino al 5% di CPU con 20 agenti) e
dice che lo scopo era vedere il lavoro di più agenti «come un luogo e non come un elenco di
finestre». Progetto amatoriale, senza impegni.

### 5. Cubicle
[producthunt.com/products/cubicle-2](https://www.producthunt.com/products/cubicle-2)

Ufficio dal vivo, in sola lettura per scelta. Chi lavora batte con il compito scritto sopra la
testa; chi ha bisogno di te **alza la mano o si mette in fila davanti alla tua scrivania**; chi ha
finito va in sala relax; un errore fa diventare **rosso lo schermo**. L'autore precisa che la mano
alzata vuol dire una cosa sola: l'agente si è già fermato su una richiesta di permesso o su una
domanda. Ha una vista per il telefono e una modalità chiosco per il televisore. Nei commenti la cosa
più interessante: un utente teme che si prenda un ufficio silenzioso per la prova che va tutto bene,
e l'autore risponde che le scrivanie quiete dicono solo che nessuno è bloccato, non che il lavoro è
buono. Un altro: la fila di sedie mostra chi è bloccato prima dei log del terminale.

### 6. Munder Difflin
[github.com/HarnessMD/munder-difflin](https://github.com/HarnessMD/munder-difflin) (prima chaitanyagiri) · 9.500 stelle ·
[thread su Hacker News, 312 punti e 145 commenti](https://news.ycombinator.com/item?id=49398152)

Un'app che fa girare più agenti da terminale come processi veri e li disegna come l'ufficio di
*The Office*: gli avatar (quindici, disegnati in codice) vanno alle postazioni mentre lavorano, e
quando si scrivono **una busta vola da una scrivania all'altra**. L'orchestratore smista e manda
all'umano solo spese, operazioni distruttive e cambi di perimetro, in una **coda di approvazioni**;
un clic sulla scrivania apre il terminale vivo. Una recensione sottolinea che il pavimento mostra
gli eventi veri degli hook e non un secondo modello che racconta. Il thread di HN è la critica più
utile di tutta la ricerca: chi lo trova imbarazzante, chi non vuole mezzo schermo di interfaccia da
videogioco, chi dice che il terminale basta e che un ufficio è la mappa sbagliata. E l'utente più
impegnato lamenta che nella scheda delle domande non c'è nessun segno che qualcosa lo aspetti, che
le notifiche partono per niente e non partono quando servono, e che si sente comunque perso: chiede
ruoli invece di personaggi, e sotto ogni nome una riga su cosa sta facendo.

### 7. Pixel Office
[github.com/KalebKE/PixelOffice](https://github.com/KalebKE/PixelOffice)

Una macchina a stati esplicita costruita sugli hook: inattivo, pensa, pianifica (alla lavagna, solo
in modalità piano), ricerca, scrive codice, esegue, aspetta, successo, fallimento. Quando un test
passa il personaggio esulta, quando fallisce si dispera; un sottoagente è un collega che entra.
Due principi da copiare: l'hook manda solo lo stato, mai prompt, argomenti o contenuti dei file;
e il programma **non indovina l'intenzione del modello** («scrive codice» comincia quando lo
strumento di modifica parte davvero, prima è «pensa»). Il README stesso ammette che l'ufficio mostra
solo i confini delle fasi, non quello che l'agente sta pensando. Il resto (giri di pattuglia,
chiacchiere fra colleghi, gatto e cane) è scenografia dichiarata.

### 8. Star Office UI (per OpenClaw)
[github.com/ringhyacinth/Star-Office-UI](https://github.com/ringhyacinth/Star-Office-UI)

Sei stati, tre luoghi: inattivo va sul divano della sala relax; scrive, cerca, esegue, sincronizza
stanno alla scrivania; l'errore va nell'**angolo dei bachi**. Lo stato lo dichiara l'agente stesso
con una riga (`set_state.py error "Trovato un problema"`), all'inizio e alla fine di ogni compito.
C'è un **«promemoria di ieri»** ricavato dall'ultimo diario giornaliero, e gli agenti ospiti
possono unirsi con una chiave e mandare il loro stato ogni 15 secondi. Pensato anche per il
telefono. Codice libero, disegni solo per uso non commerciale.

### 9. L'ufficio 3D sulla RTX 4090
[hackernoon.com — articolo dell'autore](https://hackernoon.com/i-built-a-3d-office-where-local-ai-agents-share-one-rtx-4090)

Il progetto più vicino alla nostra regola, e il meno famoso. Agenti seduti in un ufficio isometrico
3D, ma con un database come unica fonte di verità: posizione e attività di ogni figura si
calcolano dallo stato e dall'ora in cui è cominciato, così un ricaricamento o una seconda scheda
mostrano la stessa scena. In una frase dell'autore: «The scene is a view, not a simulation». Quando
un agente aspetta la scheda grafica per più di 30 secondi si alza e va alla macchina del caffè: **la
fila al caffè è la coda vera**, e un'attesa di mezzo minuto smette di sembrare un guasto. Una sala
server mostra modello, memoria e chi ha la scheda. L'autore: la scena 3D è stata la parte facile,
l'affidabilità quella difficile.

### 10. Claw3D
[github.com/iamlukethedev/Claw3D](https://github.com/iamlukethedev/Claw3D) · circa 1.400 stelle

Ufficio 3D «rétro» (React Three Fiber) per OpenClaw e altri: gli agenti si muovono in un mondo
condiviso, con stanze per le **riunioni in piedi** con agenti collegati a GitHub e Jira, per la
revisione delle modifiche, per il monitoraggio. Si chatta con gli agenti e si approva dall'app.
C'è un editor della pianta e una modalità dimostrativa con agenti finti. Il README non dice come si
vede lo stato di un agente: la scena c'è, il linguaggio degli stati è ancora da fare.

### 11. Generative Agents / Smallville (Stanford, 2023)
[github.com/joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) ·
[l'articolo](https://arxiv.org/abs/2304.03442)

Il capostipite: venticinque abitanti di un paese in sprite 2D, con le zone etichettate. L'azione di
ogni agente compare come **una fila di emoji in un fumetto sopra la testa**: una lettura dall'alto,
astratta, che regge anche con tanti personaggi a schermo. Cliccando un abitante se ne vedono stato
e memoria. La dimostrazione è **una replica registrata**: si sceglie il passo di partenza e la
velocità (da 1 a 5), e ogni passo vale dieci secondi del mondo. L'utente può parlare a un agente
come la sua «voce interiore». Far girare la simulazione costava, ed era lenta.

### 12. AI Town (a16z)
[github.com/a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) · circa 10.800 stelle ·
[le novità della v2](https://stack.convex.dev/ai-town-v2)

Il kit aperto ispirato a Smallville: una città in pixel art (PixiJS) dove i personaggi vivono e
parlano fra loro. Nella v2 l'utente entra: cammina cliccando, invita o viene invitato a parlare con
chi gli sta vicino. Secondo le recensioni, toccando un personaggio se ne leggono la biografia e le
conversazioni avute. Un dettaglio istruttivo: il mondo **si ferma dopo cinque minuti senza nessuno
che guarda**, perché è una simulazione che costa a ogni passo. Una scena che si calcola dai dati non
ha questo problema.

### 13. ChatDev (OpenBMB)
[github.com/OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) · ramo `chatdev1.0` per la versione storica

L'«azienda di software virtuale»: amministratore, direttore tecnico, programmatore, revisore,
tester, grafico, ognuno con la sua icona, che lavorano per fasi (progetto, codice, prove,
documentazione). Il visualizzatore locale ha tre pagine: il registro dal vivo, lo schema della
catena delle fasi, e la **riproduzione della conversazione** a partire dal file di log. C'è anche
una modalità in cui l'umano entra nella squadra **come revisore** e manda osservazioni al
programmatore. La 2.0 è diventata una console con l'editor dei flussi, i log, i prodotti intermedi
e il riscontro umano: niente più ufficio.

### 14. MGX (MetaGPT X)
[recensione su Woshipm](https://www.woshipm.com/ai/6277746.html)

Una squadra con nomi e colori fissi: il capo squadra giallo, l'ingegnere blu, la responsabile di
prodotto viola, l'analista verde, l'architetto bianco, disegnati come macchie colorate. La pagina
del compito ha due colonne: a sinistra cosa fa ciascuno, a destra l'anteprima del lavoro. Nella prova
della recensione, chiamando tutti e cinque su un gioco i ruoli si sono confusi (l'analista è finito
a scrivere codice) e il gioco non è partito; l'ingegnere da solo l'ha fatto funzionare. Una squadra
messa in scena non è una squadra che lavora.

### 15. Gather e WorkAdventure (gli uffici virtuali per persone)
[Gather, stato e disponibilità](https://support.help.gather.town/articles/9785009882) ·
[WorkAdventure, agenti virtuali](https://docs.workadventu.re/admin/bots/)

Gather non ha agenti, ma ha risolto bene la presenza: stati Attivo, Occupato (le cuffie), Assente,
Non disturbare; un **testo di stato** accanto al nome; un'**icona dell'applicazione** in cui la
persona sta lavorando (GitHub, Figma, Notion); e con la riunione esterna attiva l'avatar **si sposta
da solo in una sala riunioni vuota**. Il movimento lo decide un segnale vero, non un'animazione.
WorkAdventure mette invece agenti veri sulla mappa (testo o voce), come guide o per accogliere chi
arriva quando tu non ci sei; sono in beta e solo nella versione ospitata.

### Altri visti di passaggio
- [Outworked](https://hn.svelte.dev/item/47545642): ufficio in pixel (Phaser), nuvolette di
  pensiero solo mentre un agente lavora, e un utente le voleva sempre visibili. Su HN gli hanno
  contestato il titolo «stile Animal Crossing», che con la grafica non c'entrava.
- [Viberia](https://hunted.space/product/viberia): mappa isometrica alla *Civilization*, da lontano
  l'organizzazione con le icone (bloccato, chiede, fatto), da vicino la chat con l'agente. Un utente
  temeva che con più di dieci agenti un ritardo rendesse la mappa inaffidabile.
- [Cursouls](https://github.com/wunderlabs-dev/cursouls): un caffè nella barra laterale; sei stati,
  fra cui l'ingresso, la confusione quando serve una risposta, lo sconforto sull'errore; una
  finestra di dialogo che annuncia gli eventi lettera per lettera.
- [Uncanny Office](https://www.everydev.ai/tools/uncanny-office): la scheda della scrivania mostra
  token consumati, sottoagenti avviati e **che cosa sta aspettando**.
- [OpenClaw Office](https://github.com/WW-AI-Lab/openclaw-office): ufficio isometrico **in SVG**,
  avatar SVG generati in modo deterministico, linee fra chi si parla.
- [Il cruscotto di osservabilità di disler](https://github.com/disler/claude-code-hooks-multi-agent-observability):
  l'alternativa non spaziale, una linea del tempo degli hook con un'emoji per tipo d'evento.
- [Howard Lerman, Roam](https://ro.am/ideas/ai-agents-need-an-office): il saggio che teorizza
  l'ufficio degli agenti: vedere chi gira, su cosa, chi ha bisogno di una persona, chi è bloccato.

---

## Idee da prendere

Ogni idea è passata dal filtro: **i movimenti sono scenografia, quello che si legge è vero**. Dove
un'idea richiede di inventare un dialogo o uno stato, lo dico.

**1. La scena si calcola dai dati, non si simula** — dall'ufficio sulla RTX 4090.
Ogni figura ha due valori, lo stato e l'ora in cui è cominciato; posizione, posa e animazione si
ricavano da lì e dall'orologio. Ricaricando, o aprendo la pagina sul Duo e sul Mac insieme, si vede
la stessa scena. È la regola «tutto vero» trasformata in architettura: non c'è un motore che decide
dove va il redattore, c'è un dato. Ed è quello che permette alla redazione di «vivere 24 ore» senza
che giri niente. **Subito.**

**2. Stati dichiarati, mai indovinati** — da Pixel Agents (gli hook) e dai limiti dichiarati di
whatsmyagentdoing e Pixel Office.
Chi ricava lo stato dai log sbaglia: il timer di Pixel Agents, il permesso che a whatsmyagentdoing
sembra lavoro. Da noi ogni passo della corsa sa quando comincia e quando finisce, e `costo.py
--fasi` già lo ricostruisce: basta che la corsa scriva una riga per evento (chi, stato, da quando,
cosa ha consegnato) in un file che la pagina legge. Star Office UI fa esattamente questo con una
riga per compito. Se un dato manca, la scrivania lo dice («nessun segnale dalle 7:12»), non inventa
un'attività. **Subito.**

**3. Ogni stato ha il suo posto** — da Star Office UI, whatsmyagentdoing, OfficeAI, Cubicle.
Al lavoro: alla scrivania, monitor acceso. Ha consegnato: in piedi, alla macchina del caffè o al
divano. Ti aspetta: in fila davanti alla scrivania del CEO. Errore: lo schermo diventa rosso, o
l'agente va all'angolo dei guasti. Fuori turno: sedia vuota, monitor spento. Si capisce dalla
posizione prima di leggere, e sul telefono, dove i fumetti non ci stanno, la posizione basta.
**Subito.**

**4. La mano alzata vuol dire una domanda vera** — da Cubicle.
«Ti aspetta da 5 giorni» si scrive solo se c'è una richiesta reale con la sua data: le decisioni in
cima al rapporto delle fonti del lunedì, le richieste aperte del visualista (`visivi.py
richiesta`), il briefing del gusto ogni 14 giorni, il prompt della routine da aggiornare a mano.
Le sedie in fila davanti al CEO sono tante quante le richieste aperte, e il conto dei giorni parte
dalla data in cui la richiesta è stata scritta. Nessuna richiesta, nessuna fila. **Subito.**

**5. La fila al caffè è un'attesa vera** — dall'ufficio sulla RTX 4090.
Chi aspetta il lavoro di un altro si alza e va al caffè: il revisore finché il redattore non
consegna, il visualista finché `push.py` non ha pubblicato, la regia mentre i tre cronisti in
background non hanno finito. Le attese ci sono già nei tempi di `costo.py --fasi`, e sono
esattamente quello che Mike vuole capire quando una corsa sfora il tetto. **Subito**, per le attese
che i dati registrano; le altre no.

**6. Un pittogramma sopra la testa** — da Smallville (le emoji nel fumetto).
Al posto di una frase, un segno: l'occhio per chi legge, la penna per chi scrive, la matita rossa
per chi rivede, le barre per il visualista, la lente per l'archivista delle fonti. Piatti, nei
quattro colori, leggibili a 600 punti con otto personaggi a schermo. Il segno dice il tipo di
lavoro, vero per definizione, e il pannello dice il resto. **Subito.**

**7. Il fumetto cita, non pensa** — da Pixel Office (non indovina le intenzioni), contro le frasi
casuali di Claude Office.
«Guarda ▸» mostra l'ultima cosa prodotta davvero: il titolo della notizia appena scritta, «18
articoli letti», la riga del lint, il nome della voce GTA consegnata. Mai «Sto pensando a come
aprire», mai una battuta da impiegato. Se l'agente non ha ancora consegnato niente, il fumetto non
c'è. **Subito.**

**8. La consegna vola da una scrivania all'altra** — dalle buste di Munder Difflin e dalla
stampante di Claude Office.
I passaggi della corsa sono file veri con un'ora vera: la lettura va al redattore, il redattore al
revisore, le sezioni AI, Games e GTA tornano alla regia, `push.py` manda l'edizione sullo schermo
gigante. Un foglio che parte da una scrivania e arriva all'altra all'ora in cui il file è stato
scritto. **Subito** nella riproduzione della corsa (idea 9), **più avanti** dal vivo.

**9. La riproduzione della corsa di stamattina** — da Smallville (passo e velocità) e dalla
riproduzione dei log di ChatDev.
Un cursore dalle 6:30 alla fine della corsa, con la velocità: si vede chi ha lavorato quando, dove
si è aspettato, quando è uscita l'edizione. È anche la risposta onesta a «vivere 24 ore»: fuori
dalla corsa la redazione è vuota, ma la registrazione di stamattina è lì, dichiarata con la sua
ora. Serve che `costo.py --fasi` esporti le fasi in JSON. **Più avanti.**

**10. L'ora vera alla finestra, e la sera si va a casa** — dalla città di Claude Office e dalle
finestre di whatsmyagentdoing (chi ha finito da tempo «è andato a casa»).
La luce segue l'ora di Milano; le scrivanie si riempiono quando parte la routine e si svuotano
quando finisce; l'archivista compare solo il lunedì; di notte resta accesa solo la lampada di chi
ha ancora una richiesta aperta per Mike. Tutto ricavato dall'orario della routine e dagli eventi,
niente di inventato. **Subito.**

**11. Il cronometro, con il tetto** — dal cronometro del turno e dall'avviso «nessun progresso» di
whatsmyagentdoing.
Accanto a ogni agente al lavoro, da quanto tempo. I tetti ci sono già: dieci minuti per i cronisti
e per il revisore, otto per il visualista, 45 per la corsa intera. Oltre il tetto il cronometro
diventa rosso. L'orologio a muro della sala può segnare la corsa con lo spicchio dei 45 minuti.
**Subito.**

**12. La lavagna è il menabò vero** — dalla lavagna a più modalità di Claude Office.
La lavagna mostra le caselle dell'edizione (15–20 notizie, le cinque con l'approfondimento) che si
riempiono mentre il redattore scrive, e i post-it sono le previsioni in scadenza (`claims.py open
--due`) e i fili aperti. Delle dodici modalità di Claude Office si prende solo il principio: una
modalità esiste se ha un dato dietro. Niente «borsa» e niente contatore dei caffè. **Subito** il
menabò, **più avanti** le altre facce.

**13. Gli oggetti d'ufficio portano un numero** — dal cestino del contesto e dal cartello
«giorni senza incidenti» di Claude Office.
Un cartello sopra la porta: «Corse in orario di fila: 12», o «Edizioni senza errori di lint», da
`data/corse.json`. Una pila di carta accanto alla regia alta quanto i token riletti nella corsa,
che è la preoccupazione vera del progetto. Sono le chicche del Brief applicate alla redazione:
oggetti veri che si comportano da oggetti veri e portano un'informazione. **Subito** il cartello,
**più avanti** la pila (serve una scala che non inganni).

**14. Da lontano la sala, da vicino la scrivania** — dallo zoom di Viberia, dalla scheda della
scrivania di Uncanny Office, dal clic di whatsmyagentdoing.
Il pannello dell'agente, con le voci già previste («Sta facendo adesso», «Ti aspetta da», il lavoro
consegnato, la casella per rispondere), più quello che gli altri mostrano e serve: il modello (Opus
o Sonnet), la durata dell'ultima corsa, cosa sta aspettando. **Subito.**

**15. La risposta del CEO va dove l'agente la legge, e la pagina lo dice** — dalla sola lettura di
Cubicle (la risposta diventa un commento), dalla coda di approvazioni di Munder Difflin, dall'umano
revisore di ChatDev.
La casella non finge una conversazione dal vivo: scrive in una casella postale che l'agente legge
alla corsa successiva, e sotto il messaggio c'è scritto «lo legge domani alle 6:30», poi «letto»
solo quando la corsa l'ha letto davvero. Se un giorno la pagina sarà condivisa, la casella e i
testi non pubblicati si nascondono (la modalità privata di whatsmyagentdoing). **Subito**, con la
dicitura onesta.

**16. Accanto alla scena, la lista** — dalla lista di whatsmyagentdoing (Ti serve, Al lavoro,
Finiti) e dalla vista telefono di Cubicle.
Sul Duo chiuso, o quando serve una risposta in tre secondi, la stessa redazione in tre gruppi:
Ti aspetta, Al lavoro, Ha finito. Stessi dati, stesso pannello al tocco. È anche la versione che
regge «Riduci movimento». **Subito.**

**17. La riunione del mattino** — dalle riunioni in piedi di Claw3D e dall'avatar di Gather che va
da solo in sala riunioni quando comincia una riunione vera.
A corsa finita gli agenti si radunano al desk circolare sotto l'anello di schermi, e ognuno porta
i suoi numeri: «15 notizie, 0 errori», «3 visualizzazioni», «7 voci GTA», «2 feed muti». Solo
numeri che escono dagli script; nessuna frase scritta per l'occasione. **Più avanti.**

**18. Il disegno in SVG isometrico, fatto in casa** — da OpenClaw Office (ufficio e avatar in SVG),
dagli avatar disegnati in codice di Munder Difflin, dalla versione su canvas senza dipendenze di
whatsmyagentdoing.
Niente tileset comprati (Pixel Agents) né disegni con licenza non commerciale (Star Office UI):
mobili e personaggi in SVG, nei colori del Brief, nitidi a ogni larghezza, con elementi che si
possono toccare e leggere dallo screen reader. Il 3D con luci e ombre di whatsmyagentdoing o Claw3D
è l'opposto dello stile piatto della sigla. **Subito.**

**19. La striscia degli eventi** — dalla finestra che annuncia gli eventi lettera per lettera di
Cursouls.
Lo schermo gigante usa la grammatica dell'Ultim'ora che l'app ha già: «06:41 · lettura consegnata,
18 articoli», «06:58 · lint, 0 errori», «07:03 · edizione online». Ogni riga è un evento del
registro con la sua ora. **Subito.**

**20. Una squadra di prova con dati finti** — dalla modalità dimostrativa di whatsmyagentdoing,
Claw3D e Uncanny Office.
**No, perché** viola la regola: whatsmyagentdoing ha girato le immagini del suo README con una
squadra inventata, e chi le guarda non lo sa. Se serve per costruire la pagina prima che ci siano
gli eventi, si usa il registro di una corsa vera già passata, con la data bene in vista.

---

## Cosa evitare

- **Indovinare lo stato.** Pixel Agents indovina la fine del turno con un timer e a volte sbaglia;
  whatsmyagentdoing mostra «al lavoro» un agente fermo su un permesso. Un errore così, da noi,
  vuol dire scrivere una cosa falsa.
- **Frasi messe in bocca agli agenti.** Le battute casuali di Claude Office e i nomi e riassunti
  generati da un altro modello sono testo inventato. Da noi si cita solo quello che è stato
  prodotto.
- **Personaggi invece di ruoli.** Su HN hanno chiesto se serva davvero dare nomi umani agli agenti,
  e se non fossero meglio i ruoli; MGX con nomi e colori fissi ha mostrato una collaborazione che
  non c'era. Da noi si chiamano per mestiere: il redattore, il revisore, l'archivista.
- **Credere che un ufficio quieto sia un ufficio che va bene.** Il dubbio sollevato su Cubicle:
  nessuno in fila non vuol dire lavoro buono. La redazione dice chi lavora e chi aspetta; la
  qualità (lint, `qualita.py`) va detta a parte, con i suoi numeri.
- **Nascondere che qualcosa ti aspetta.** La lamentela più concreta su Munder Difflin: la scheda
  delle domande non dava nessun segno. Le cose che aspettano Mike devono essere la prima cosa che
  si vede entrando, non un pannello da aprire.
- **Notifiche a caso.** Nello stesso thread su Munder Difflin: partivano per ogni sciocchezza e mancavano quando servivano.
  Meglio nessuna notifica che una notifica sbagliata.
- **Mezzo schermo di videogioco.** Su HN chi lo provava si distraeva di più e voleva lo spazio
  indietro. Sul Duo la scena deve rendere più di quanto occupa: la lista a un tocco, la scena che
  non si mangia la pagina.
- **Promettere più di quello che c'è.** Outworked si è preso le critiche per un titolo che con la
  grafica non c'entrava. Il nome e la presentazione della redazione devono dire che cosa è: una
  vista della corsa, non un'intelligenza che vive in ufficio.
- **Simulazioni che costano anche a pagina chiusa.** AI Town ferma il mondo dopo cinque minuti
  perché ogni passo si paga. Una scena calcolata dai dati (idea 1) non ha questo problema.
- **Il peso.** ccworkspace sotto WSL arrivava al 60% della CPU secondo un utente; l'ufficio sulla
  RTX 4090 ha dovuto ridurre le chiamate di disegno da 893 a 117. Sul telefono le animazioni devono
  fermarsi quando la pagina non si vede, e rispettare «Riduci movimento».
- **Chiavi in chiaro e porte aperte.** Pixel Agents mette la chiave d'accesso nell'indirizzo; Pixel Office
  riceve eventi senza autenticazione. Da noi la pagina non fa richieste fuori, e la casella delle
  risposte passa solo dalle funzioni dell'artifact.
- **Disegni con la licenza sbagliata.** Il tileset a pagamento di Pixel Agents, i disegni non
  commerciali di Star Office UI: meglio disegnare tutto in casa, che è anche l'unico modo di restare
  nello stile della sigla.
- **Lo «stile cruscotto».** Il 3D con luci e ombre in tempo reale è il contrario del fondo osso e
  delle campiture piatte. Si prende l'idea dell'isometria, non la resa.
