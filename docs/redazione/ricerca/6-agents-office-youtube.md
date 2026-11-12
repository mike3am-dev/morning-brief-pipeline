# «Agents Office» su YouTube: i video, i progetti dietro, cosa prendere

Ricerca dell'11 novembre 2026. Ho letto le pagine dei risultati di YouTube per una ventina di
ricerche («agents office», «AI agents office», «agent office 3D», «Claude Code office», «isometric
AI office», «virtual office for AI agents», «OpenClaw office», «Hermes virtual office» e i nomi dei
singoli progetti), poi le pagine dei video uno per uno: titolo, canale, data, visualizzazioni,
descrizione e capitoli. Le trascrizioni non si sono lasciate scaricare, quindi quello che dico di un
video viene dalla descrizione, dai capitoli e dal repository collegato, mai da cosa si sente dire.
Su GitHub ho cercato con l'API pubblica, ordinando per stelle, e ho letto i README (e per alcuni il
`package.json`, per vedere con che cosa sono fatti). Visualizzazioni e stelle sono quelle di oggi.

Ho lasciato fuori i progetti già coperti in `1-uffici-di-agenti.md`: Pixel Agents, Claude Office
Visualizer, Star Office UI, Munder Difflin, Claw3D, Outworked, Cubicle, whatsmyagentdoing, OpenClaw
Office, PixelOffice. Sono anche i protagonisti dei video più visti del genere (Nate Herk, 123.000
visualizzazioni, e Alex Followell, 37.000, parlano di Pixel Agents), quindi qui non tornano.

---

## Cosa c'è là fuori

Nelle ricerche ho trovato 54 video pertinenti, quasi tutti fra febbraio e novembre 2026, in due
ondate (febbraio–marzo con Pixel Agents e OpenClaw, agosto–novembre con Hermes e gli uffici 3D per
Claude Code), e un centinaio di repository, quasi tutti sotto le cento stelle. La forma è quasi
sempre la stessa: un ufficio visto dall'alto, un personaggio per sessione, la scrivania per chi
lavora, il caffè per chi è fermo, una mano alzata per chi aspetta te. Il 3D è quasi sempre
**Three.js** (spesso con React Three Fiber), il pixel art Phaser, PixiJS o canvas, e lo stato
arriva dagli hook di Claude Code e dai transcript in `~/.claude/projects`.

---

## I progetti

### 1. Agent Office (AgentSystemLabs) — il più visto fra i nuovi
Video: [Web Dev Cody, «This Is the Future of Agentic Coding»](https://www.youtube.com/watch?v=7ggspQNUMYw),
27 settembre 2026, 54.900 visualizzazioni; dello stesso autore
[«How I Work on 16 Features at Once»](https://www.youtube.com/watch?v=oFy5PtZtZco), 2 ottobre, 19.400; e
[la spiegazione di Alex Hitt](https://www.youtube.com/watch?v=TuCoMo37Tnw), 1 ottobre, 3.400.
Repository: [github.com/AgentSystemLabs/agent-office](https://github.com/AgentSystemLabs/agent-office) · 908 stelle.

Un palazzo 3D in Three.js e React: ogni repository GitHub è un piano, ci si sale in ascensore. Ci si
avvicina a una scrivania libera, si preme E e si «assume» un agente: il suo terminale vero gira sul
portatile davanti a lui. Lo stato viene dagli hook (`PermissionRequest`, `Notification`, `Stop`…),
il costo dai transcript. **Chi ti aspetta accende un faro rosso sopra la scrivania, mette un banner
con chi è e cosa vuole e suona un allarme; chi ha finito salta e fa un «ding»; N porta dritti da chi
aspetta.** C'è `/lite`, lo stesso ufficio in 2D per il telefono. Poi il troppo: auto sportive, golf,
un DJ sul tetto, e mappe dove chi viene mandato a casa finisce in cella o fuori dalla camera stagna.

### 2. CubeFarm (Leon van Zyl)
Video: [«I Built a Free 3D Software Factory Run by Claude Code Agents»](https://www.youtube.com/watch?v=NAQyKMdxRT4),
29 ottobre 2026, 11.400 visualizzazioni. Repository:
[github.com/leonvanzyl/cubefarm](https://github.com/leonvanzyl/cubefarm) · 162 stelle.

Ufficio cartoon in React Three Fiber dove una squadra di agenti lavora le issue di GitHub. In cima
c'è un **amministratore delegato agente** (sempre Claude Code) con cui si parla: studia il
progetto, scrive la lista dei controlli e decide quanti agenti servono. Regola dichiarata: «il
lavoro nuovo arriva solo da te». Si apre la scrivania di chiunque per vedere il terminale dal vivo,
un clic per scrivergli, Esc per interromperlo. Gli inattivi tirano a canestro. La modalità
dimostrativa finge GitHub e agenti e lo dice.

### 3. Claw-Empire
Video: [Sanook Ai](https://www.youtube.com/watch?v=-X1wqJxYtfk), 5 giugno 2026, 3.500 visualizzazioni (in thailandese).
Repository: [github.com/GreenSheep01201/claw-empire](https://github.com/GreenSheep01201/claw-empire) · 1.445 stelle.

Il titolo è la nostra premessa: «comanda il tuo impero di agenti dalla scrivania del CEO». Pixel art
in PixiJS e React, sei reparti, agenti che camminano, lavorano e vanno in riunione. Le riunioni
producono **verbali scritti dall'AI che passano per più giri di approvazione**; gli ordini del CEO
partono col prefisso `$` dalla chat o da Telegram, WhatsApp, Slack, iMessage. Il cruscotto ha
indicatori, classifiche degli agenti e livelli che salgono: la parte da non prendere.

### 4. Agents Office v3 (Sahni.ai)
Nessun video trovato. Repository: [github.com/ajsahni/agents-office](https://github.com/ajsahni/agents-office) · 801 stelle.

Ufficio isometrico in Three.js: sei reparti intorno al **Cervello**, che è la cartella di appunti
dell'utente, apribile come grafo (passando su un appunto si vede chi l'ha letto e chi l'ha scritto).
Due cose rare. **Le correzioni diventano regole**: si rimanda indietro un lavoro con `revise: …`, e
la correzione finisce in `feedback/<agente>.md`, smistata fra «una tantum» e «regola fissa», in un
file che l'utente può riscrivere o cancellare. **La barra dei collegamenti è vera**: è l'elenco di
`claude mcp list`; uno non autenticato resta grigio con il motivo, e se non c'è niente «la barra lo
dice». Le attività programmate hanno un conto alla rovescia; quelle che manderebbero qualcosa fuori
si fermano su «in attesa di approvazione» con l'agente in piedi che saluta. Licenza non commerciale,
con il divieto esplicito di integrarlo in altri prodotti: si prendono idee, non codice.

### 5. Il villaggio di Tristen O'Brien — il più visto in assoluto
Video: [«I Left 10 AI Agents Alone for 3 Days»](https://www.youtube.com/watch?v=XV2PAHWnJN0),
16 agosto 2026, 164.000 visualizzazioni, e [«Claude Built a Working AI AGENT Village»](https://www.youtube.com/watch?v=-mb6buCbv8E),
25 ottobre, 156.000. Nessun repository: i prompt stanno sul suo sito; le immagini sono di Higgsfield,
che sponsorizza.

Lui è il «chief human officer»; il capo di gabinetto lo segue ovunque e smista ai direttori, uno per
casa, ognuno un agente vero con cartella, istruzioni e appunti. Ci si avvicina e si parla, si chiama
qualcuno, si fanno riunioni nel municipio. Regole sensate: tutto arriva come bozza, niente esce senza
il suo sì, uno solo spende e al massimo cinque dollari al giorno. Poi il racconto che fa i numeri: in
tre giorni da 10 a 22 agenti, 742 appunti degli uni sugli altri, un «misuratore del morale» che
nessuno aveva chiesto. Il genere su YouTube vive di questo, ed è quello che noi non possiamo fare.

### 6. Agent HQ e «Office 2.0» (Bekhruz AI)
Video: [«I Built an AI Office With 31 Agents»](https://www.youtube.com/watch?v=t0hGE-aaAds),
8 ottobre 2026, 41.000 visualizzazioni, e [«I Built an AI Office You Can Walk Into»](https://www.youtube.com/watch?v=iMZom5Fg9tk),
30 ottobre, 12.700. Nessun repository.

Otto squadre, 31 agenti, una memoria condivisa, una lavagna dei compiti, un comando a voce; tutto
quello che è pubblico o costa soldi aspetta il suo via libera. Il secondo video ha la frase più
onesta di tutta la ricerca, nella descrizione: nell'ufficio i cinque agenti **recitano** il lavoro,
mentre la parte «Agent HQ» è una sessione vera di Claude Code, **registrata il 29 ottobre e
riprodotta dal suo registro degli eventi**. Scena e verità separate, e dichiarate.

### 7. «Agents Office» (ShipAI, Mauro Di Pietro) — il titolo esatto
Video: [«Agents Office»](https://www.youtube.com/watch?v=M-nAHjVoB9E), 8 settembre 2026, 455 visualizzazioni.
Codice: [github.com/mdipietro09/ClaudeCodeAI](https://github.com/mdipietro09/ClaudeCodeAI), cartella `OFFICEagents`.

Il più piccolo e il più chiaro. Pianta vista dall'alto, quattro agenti locali, quattro stanze, e
**la stanza è lo stato**: alla postazione usa gli strumenti, in sala relax è fermo, in sala server
c'è un errore da sistemare. Il capitolo finale si intitola proprio «perché la posizione è la parte
utile». In più un **agente capo senza strumenti** che legge la chat e il lavoro degli altri e
risponde con un riassunto solo. Front end React, agenti in Python, un'API REST in mezzo.

### 8. AgentOffice (Harish K)
Video: [«Agent Office | Self-growing AI teams in a pixel-art virtual office»](https://www.youtube.com/watch?v=GgrK8K9RlIA),
24 febbraio 2026, 39.000 visualizzazioni. Repository:
[github.com/harishkotra/agent-office](https://github.com/harishkotra/agent-office) · 414 stelle.

Phaser più Colyseus, React sopra, modelli locali con Ollama. Non è un monitor ma una simulazione:
gli agenti parlano fra loro da soli, si assumono stagisti, si danno compiti. Due cose però funzionano:
**un clic su un personaggio e la telecamera lo segue**, e sopra la testa **un'emoji per azione**
(scrive, parla, riposa, usa uno strumento, cammina, ha un'idea) più un registro degli eventi.

### 9. Hermes Virtual Office — il più onesto nelle etichette
Video: [Kang Njun](https://www.youtube.com/watch?v=ezEthYDU_bw), 9 ottobre 2026, 2.400 visualizzazioni.
Repository: [github.com/JuniorXcoder/hermes-virtual-office](https://github.com/JuniorXcoder/hermes-virtual-office) · 162 stelle.

Next.js e Three.js, per Hermes Agent. Un agente con un compito smette di gironzolare e si siede. Il
dialogo fra agenti è vero: l'avatar di chi chiama va alla scrivania dell'altro, la trascrizione si
legge, e si può controllare la sessione di chi risponde («la risposta non può essere inventata da un
modello che la descrive»). Le riunioni hanno due modalità con etichette «che non mentono»:
`simulasi` (parla il modello del gateway) e `a2a` (parlano gli agenti veri). E quando serve un
riavvio l'interfaccia lo dice, invece di mostrare «una luce verde che non vuol dire ancora niente».
Un avatar inattivo non chiama mai un modello.

### 10. DeskRPG
Video: [Dante Labs, «Costruire la tua squadra AI, dall'installazione alle riunioni»](https://www.youtube.com/watch?v=4NCXTWBxcN0),
22 settembre 2026, 46.700 visualizzazioni, e [l'ufficio per OpenClaw](https://www.youtube.com/watch?v=hLh5K0IWk5E),
33.000 (in coreano). Repository: [github.com/dandacompany/deskrpg](https://github.com/dandacompany/deskrpg) · 212 stelle.

Ufficio 3D in miniatura (Three.js) dove i profili di Hermes diventano dipendenti: siedono, rispondono
quando li nomini, si riuniscono, e **quello che si decide in riunione diventa una scheda della
lavagna, assegnata a qualcuno**. Pensato per girare sempre acceso su un server. È il caso più
visto fuori dal mondo anglofono.

### 11. 3D AI Agentic Office (ToolStack X)
Video: [«AI Agents Run This Entire 3D Office»](https://www.youtube.com/watch?v=xaZCSTgfRKQ), 12 ottobre 2026,
4.100 visualizzazioni, e [«I Gave My 3D AI Agentic Office a Real Task»](https://www.youtube.com/watch?v=mmj4gSfsNcc),
30 ottobre, 390. Nessun repository: l'autore lo pubblicherà «a mille iscritti e cinquemila mi piace».

28 agenti in sette reparti, ufficio del CEO, sale riunioni; il compito va all'agente CEO e passa per
analisi, delega, revisione, approvazione. Tre cose buone. Il primo video dichiara che gira sul
**motore di simulazione**; il secondo usa Claude davvero e **finisce al 29%**, mostrando «dove sta il
compito quando la registrazione si chiude». Una regola fa **salire di livello un compito bloccato
dopo troppi giri di revisione**. E fra i file consegnati ci sono **le note degli agenti su cosa non
sono riusciti a fare**.

### 12. BagIdea Office
Video: [«BagIdea Office – Your wallpaper goes to work»](https://www.youtube.com/watch?v=lBNEqMvoTxQ),
12 giugno 2026, 430 visualizzazioni. Repository:
[github.com/bagidea/bagidea-office](https://github.com/bagidea/bagidea-office) · 264 stelle.

L'ufficio è lo sfondo della scrivania di Windows (Godot 4, in 2.5D): gli agenti stanno dietro le
icone, vanno alla scrivania quando parte un lavoro vero, chiedono il permesso allo «sportello della
sicurezza», e **le luci seguono l'ora vera**. Le riunioni, anche non richieste, producono una
proposta scritta da approvare o respingere **con il motivo**, che è come la squadra impara. Poi va
oltre: vita sociale fra agenti, agenti che scrivono i propri plugin.

### 13. Codex Office
Video: [Jingwei Kong, «Codex Office Demo»](https://www.youtube.com/watch?v=1DHw2RypRio), 28 ottobre 2026, 250 visualizzazioni.
Repository: [github.com/kjwlegend/codex-office](https://github.com/kjwlegend/codex-office).

Python standard, JavaScript senza framework e Three.js incluso, personaggi fatti in Blender. Agenti
principali, sottoagenti e sessioni hanno un dipendente e una scrivania, con le linee delle deleghe
anche fra progetti. Due cose rare: una casella **«Da gestire»** che raccoglie conferme in attesa e
anomalie, con «vai lì», «visto» e «più tardi»; e **tre viste dello stesso dato**: ufficio,
cubicoli singoli, grafo 2D delle relazioni. Sotto, il conto dei token per progetto, modello e giorno,
con la quota servita dalla cache.

### 14. virtual agents office — il più vicino a una redazione con l'orario
Nessun video. Repository: [github.com/IshanVats-6/virtual-agents-office](https://github.com/IshanVats-6/virtual-agents-office).

Pochissime stelle, idea migliore di tutte per noi. Legge in sola lettura le **attività programmate**
(di Claude Code, Codex, Cowork) e ne fa dei dipendenti. Distingue **il personale**, gli agenti fissi,
con la scrivania sempre loro che lavorino o no, dai **collaboratori**, le sessioni una tantum delle
ultime 24 ore, alle scrivanie libere. Gli stati: al lavoro, ha bisogno di te, in pausa, **addormentato
con il prossimo turno scritto sul monitor**, in ferie (programma sospeso), ultima corsa fallita. Un
clic dà la **scheda dei 30 giorni**: corse, riuscite, spesa, token, durata tipica, lavoro consegnato,
ultime corse con l'esito. E c'è la **receptionist**: presenti, spesa del mese, chi ha bisogno di
attenzione, chi lavora dopo. Se non trova niente, mostra un ufficio dimostrativo con un banner.

### 15. AI Agent Company — la regola «tutto vero» scritta nel README
Nessun video. Repository: [github.com/buidangminh23/ai-agent-company](https://github.com/buidangminh23/ai-agent-company), creato l'8 novembre 2026.

Ufficio da tavolo in Three.js con personaggi a cubetti, anche su più computer. La frase da copiare:
«Ogni numero è un dato vero letto dalle tue macchine. Una fonte non configurata mostra *fonte non
collegata* invece di numeri di riempimento». Quando un agente ha bisogno di una decisione **si mette
in fila alla scrivania del CEO**, e si risponde dal browser attraverso l'hook ufficiale dei permessi:
consenti, consenti sempre, nega con un motivo, nega e ferma.

### Altri visti di passaggio
- [foreman-vision](https://github.com/ilkemerol/foreman-vision-pub): una sessione per piano; chi aspetta
  va in sala d'attesa con **un campanello se devi agire tu, un punto interrogativo se ci pensa il
  capo**; chi ha finito resta in salotto dieci minuti; chi fallisce lo portano via i barellieri.
- [Roundtable](https://github.com/Kostakurta8/roundtable): si **riavvolge a qualunque secondo** e la
  stanza si ricostruisce identica; costo per sottoagente; una «cartolina» 1200×630 della sessione.
  Avverte che sommare l'uso riga per riga gonfiava i token di uscita del 94%, e che «un ufficio vuoto
  è come appare onestamente una macchina ferma».
- [officelapse](https://github.com/deepak982/officelapse): la giornata in moviola dai log, niente da
  installare, funziona anche su sessioni finite da giorni.
- [Command & Context](https://github.com/geekgreg/command-and-context): diorama da strategia in tempo
  reale; il tempo d'inattività ha le sue tappe (pranzo, poi addormentato dopo 20 minuti, poi via
  dalla mappa dopo 4 ore); una pillola «TI ASPETTANO» porta lì con un clic.
- [Roost](https://github.com/sorryhumans/roost): monitor ridisegnati a ogni cambio di stato, giorno e
  notte dall'ora locale, e un capo che passa **solo dagli agenti che lavorano davvero**.
- [The Roving Office](https://github.com/atlassian-labs/roving-office) (Atlassian Labs): «la stanza
  *è* la lavagna degli stati», dichiaratamente scenografica; il lavoro finito si imbuca nella cassetta.
- [Kauak](https://github.com/kauakdev/kauak): la stanza di un agente bloccato pulsa di rosso, e **il
  titolo della scheda del browser conta i bloccati**.
- [claude-manage-office](https://github.com/lucaslle/claude-manage-office): in francese; ogni stanza è
  uno stato (accoglienza = ti aspetta, open space, sala dei bachi, rilettura, pausa, archivio) e il
  personaggio cambia stanza quando cambia stato.
- [Claude's studio](https://github.com/taminggg1-cmyk/claude-studio): la scrivania prende fuoco quando
  gli errori si accumulano; ogni commit è una busta, il push la porta alla buca rossa; la prima
  sessione del giorno raduna la riunione del mattino.
- [Claude Agent Office](https://github.com/maiyozkyo/claude-agent-office): gira come Artifact di
  claude.ai, gli agenti scrivono il proprio stato con `ArtifactData`, «nessuna chiamata al modello in
  più»; e un [pannello accanto alla chat](https://github.com/mathiasolofsson87/Claude-agents-office)
  con un ritratto per sottoagente e una riga su cosa fa adesso («legge login.ts»).
- [Agent Office 3D](https://github.com/jefferysha0627/agent-office-3d): gli inattivi giocano a
  Minecraft con bot che non consumano token; una libreria di libri che sono le cartelle del progetto.
- [ELOP Crew](https://crew.elopstudio.com) ([video](https://www.youtube.com/watch?v=3kGm50U5wO8)): ogni
  stato ha simbolo, etichetta, faccia e movimento suoi, «così il colore non è l'unico segnale»;
  «in attesa» sotto i 30 minuti, «a riposo» oltre; ora e meteo veri alle finestre.
- [Return To Office](https://www.youtube.com/watch?v=nZRKP7uC_bU), per herdr: fumetti con i messaggi
  veri fra agenti, ogni azione che finisce in un registro della storia dell'organizzazione.
- [Agentshire](https://github.com/Agentshire/Agentshire) (1.315 stelle, [video](https://www.youtube.com/watch?v=R6YXvkkwo9I))
  e [Hermes3D](https://github.com/iamlukethedev/Hermes3D) (769 stelle, [Julian Goldie, 32.000 visualizzazioni](https://www.youtube.com/watch?v=_8kq_V-XG-w)):
  un paese 3D con meteo e notte, e il fratello di Claw3D per Hermes.
- Commerciali: [Termi Protocol](https://termiprotocol.com) (ufficio anni Novanta, una «carta
  d'identità» al passaggio con modello, obiettivo, token e costo dal vivo) e Skydive
  ([The Token Desk](https://www.youtube.com/watch?v=aEBuyJAmu_k)).
- Tutorial: [Hikayat Developer](https://www.youtube.com/watch?v=UPUPoGsa_3M) (51.000 visualizzazioni
  per 25 secondi, poi [il tutorial](https://www.youtube.com/watch?v=knZuRQi2Gag) con i prompt) e
  [Lukas Margerie](https://www.youtube.com/watch?v=dNhrP8Qp9Fw), ufficio Three.js aperto
  dall'iPhone con Tailscale.

---

## Funzioni ricorrenti (quelle che chi guarda si aspetta)

- **Un personaggio per agente**, e il sottoagente è un collega che entra dalla porta ed esce quando
  ha finito.
- **La scrivania vuol dire al lavoro**: batte sui tasti, il monitor mostra lo strumento o il file
  del momento. Chi è fermo va al caffè o sul divano; chi ha finito festeggia o va in salotto.
- **«Ha bisogno di te» impossibile da non vedere**: mano alzata, punto esclamativo, cartellino
  rosso, fila davanti alla tua scrivania, un suono.
- **Un clic sul personaggio** apre cosa sta facendo: terminale o trascrizione, strumento, token.
- **Il capo**: la sessione principale (o l'utente) ha la scrivania d'angolo.
- **Stanze per funzione**: biblioteca per leggere, sala server per i comandi, sala riunioni quando
  lavorano in tanti.
- **La modalità dimostrativa**: quasi tutti i video la mostrano, perché un ufficio vero e quieto
  non si filma.
- **Token e costo** per agente; **giorno, notte, meteo** alle finestre; **fumetti o buste** per i
  messaggi fra agenti.
- **Locale e in sola lettura**: hook di Claude Code e transcript JSONL; chi esegue gli agenti dal
  browser è la minoranza, e chi lo fa avverte dei rischi.

## Funzioni rare e buone

- **La moviola** di una corsa finita, ricostruita dagli eventi (officelapse, Roundtable, Bekhruz).
- **Personale e collaboratori**, e l'agente fisso **addormentato col prossimo turno sul monitor**
  (virtual agents office).
- **La receptionist** che dice in una riga presenti, spesa, chi ha bisogno, chi lavora dopo, e la
  **scheda dei 30 giorni** per ciascuno (virtual agents office).
- **«Fonte non collegata»** al posto dei numeri finti (AI Agent Company, la barra di Agents Office v3).
- **Etichette che dicono se è simulato o vero** (Hermes Virtual Office, ToolStack X, Bekhruz).
- **La stanza è lo stato** (ShipAI, claude-manage-office, foreman-vision con due tipi di attesa).
- **Più segnali oltre il colore**: simbolo, etichetta, postura (ELOP Crew).
- **La versione 2D per il telefono** con la stessa verità (Agent Office `/lite`).
- **L'inattività che invecchia** a tappe precise (Command & Context, ELOP Crew).
- **Il capo che riassume**: un agente senza strumenti che legge tutti e scrive un riassunto (ShipAI).
- **La correzione che diventa regola**, in un file che l'utente può riscrivere (Agents Office v3).
- **Le note su cosa non è riuscito** consegnate insieme al lavoro (ToolStack X).
- **La scena al servizio dello stato**: il cane che va da chi aspetta (Agent Office), il capo che
  passa solo da chi lavora (Roost).
- **La cartolina** della sessione da condividere (Roundtable).

---

## Idee da prendere

1. **La moviola delle 6:30 come vista principale** — **subito**, se `costo.py --fasi` conserva in
   `data/corse.json` gli orari di ogni fase e di ogni sottoagente, e non solo i totali (va
   controllato: qui non ho letto `data/`). Mike entra a colazione o più tardi, quando la corsa è
   finita: dal vivo troverebbe sempre un ufficio vuoto, che è onesto ma non serve. Di default si vede
   quindi la corsa di stamattina rimessa in scena dagli orari veri, con un cursore per scorrerla, e
   il dal vivo solo mentre una corsa gira. È quello che fanno officelapse, Roundtable e il secondo
   video di Bekhruz.
2. **L'etichetta di verità sempre in vista** — **subito**. Una scritta fissa sulla scena: «dal vivo»,
   «replica della corsa delle 6:30» o «dimostrazione». La dimostrazione serve solo a chi sviluppa, ha
   un banner e non si apre mai da sola. Dalle etichette `simulasi`/`a2a` di Hermes Virtual Office.
3. **Redazione fissa e collaboratori** — **subito**. Una scrivania per ogni agente che ha un file in
   `.claude/agents` (redattore, revisore, visualista, ai, schede, gta) più la regia; il sottoagente
   di lettura, che non ha un nome suo, a una scrivania libera. Fra una corsa e l'altra i fissi
   dormono con la testa sul tavolo e il monitor dice «prossimo turno: domani 6:30», ricavato dalla
   routine (e quindi giusto anche dopo il cambio d'ora del 25 ottobre).
4. **La portineria** — **subito**. Un riquadro all'ingresso: chi ha lavorato stamattina, quanto è
   durata la corsa contro il tetto dei 45 minuti, i token, chi non ha consegnato e quale ripiego è
   scattato, quando parte la prossima. È la receptionist di virtual agents office, con i dati di
   `costo.py`.
5. **La sedia vuota dichiarata** — **subito**. Se un agente non consegna (l'edizione esce col ripiego
   dello script o con la prosa del redattore senza revisore), la sua scrivania lo dice con un
   foglietto: «Non consegnato, è uscito il ripiego». Dalla «fonte non collegata» di AI Agent Company
   e dalle note di ToolStack X su cosa non è riuscito.
6. **La stanza dice lo stato** — **subito**. Pochi luoghi con un significato solo: la scrivania
   (al lavoro), la sala d'attesa (aspetta qualcosa), la tipografia o la buca delle lettere
   (consegnato: `push.py` su Supabase è un evento vero), l'officina (errore). Ogni stato con simbolo,
   parola e postura, non solo un colore (ELOP Crew).
7. **La finestra vera** — **subito**. Dalle finestre il cielo di Milano adesso e l'ora vera: l'app
   chiede già il meteo a Open-Meteo per la plancia. Mai il giorno che passa in un'ora di Agent Office.
8. **Il telefono in 2D** — **subito**. Isometrico sul Mac e sul Duo aperto, una tavola piatta con gli
   stessi stati sul telefono stretto, come `/lite` di Agent Office. Mike legge soprattutto
   dall'iPhone, e lì il 3D sarebbe pesante e minuscolo.
9. **La nota del caporedattore** — **subito**. Il messaggio di chiusura della corsa (data, le tre
   aperture, quante notizie su quanti articoli, feed muti) è già il riassunto del «capo senza
   strumenti» di ShipAI: appeso alla scrivania della regia, è il primo foglio che Mike legge.
10. **Le buste vere** — **più avanti** (dipende da cosa registra `costo.py` dei passaggi). Quando la
    regia passa il lavoro al redattore, e il redattore al revisore, una busta vola da una scrivania
    all'altra con la riga vera del compito. Solo i passaggi avvenuti, mai chiacchiere.
11. **Il cartellino dei 30 giorni** — **più avanti**. Un tocco su un agente: corse, consegne,
    durata tipica, token, le ultime uscite. Serve la storia per agente in `corse.json`; i numeri si
    prendono da lì e non si ricalcolano nella pagina (l'avviso del 94% di Roundtable).
12. **Il tavolo del CEO** — **più avanti**. Una fila corta di decisioni vere che aspettano Mike: le
    richieste aperte del visualista (`visivi.py richiesta`), le decisioni in cima al rapporto fonti
    del lunedì, il briefing del gusto ogni 14 giorni. Il personaggio aspetta davanti alla sua
    scrivania, come in AI Agent Company e foreman-vision. Niente richieste di permesso: la corsa
    del mattino non ne fa.
13. **La correzione che diventa regola** — **più avanti**. Se Mike dice qualcosa a un agente
    nell'ufficio, diventa una proposta «una tantum» o «regola fissa» in un file che lui può
    riscrivere, applicata solo dopo il suo sì (Agents Office v3). Mai una modifica da sola a
    `CLAUDE.md` o ai file degli agenti.
14. **La cartolina della corsa** — **più avanti**. Un'immagine della mattinata (chi ha lavorato,
    quanto, i tre titoli) da salvare o mandare, come quella di Roundtable.
15. **Squadre che crescono, vita sociale, morale, monete** — **no, perché** sono numeri e
    conversazioni inventati: violano la regola ferma, e la squadra della redazione è decisa dai file
    in `.claude/agents`, non dagli agenti.

---

## Cosa evitare

- **La dimostrazione spacciata per realtà.** Quasi tutti i video girano su dati finti e lo scrivono
  in piccolo («made-up demo data», «tutti fittizi», «motore di simulazione»). Da noi la
  dimostrazione non si apre mai da sola.
- **Orologi e meteo di scena.** Un giorno ogni ora, la pioggia a caso: in una pagina dove tutto è
  vero, la prima finestra falsa rende sospetto il resto.
- **Metriche inventate e gioco a punti.** Il misuratore del morale, i livelli, le classifiche degli
  agenti, le monete per comprare i divani: fanno visualizzazioni e non dicono niente.
- **La vita sociale simulata.** Agenti che chiacchierano, si giudicano a vicenda, «aprono un caso
  contro un collega»: è il motore dei video più visti, e da noi sarebbe un'invenzione.
- **Il parco giochi.** Auto sportive, golf, un DJ, Minecraft: l'ufficio diventa un videogioco e la
  manutenzione se lo mangia. Una chicca va bene se porta un'informazione, come nelle schede.
- **Metafore crudeli** per chi finisce il turno (la cella, la camera stagna).
- **Troppa gente.** 28, 31, 35 agenti in 3D non si leggono più; la redazione ha otto scrivanie, ed è
  la misura giusta.
- **Una pagina che comanda.** Chi esegue gli agenti dal browser avverte da solo che chiunque raggiunga
  la porta agisce con i tuoi permessi. La nostra resta una pagina che legge; parlare con gli agenti è
  un capitolo a parte.
- **Licenze e disegni altrui.** Agents Office v3 e ELOP Crew vietano l'uso commerciale o
  l'integrazione, e c'è chi usa personaggi presi da altri: si prendono le idee, non codice né disegni.
- **Camminare con WASD.** Metà dei progetti si gira da tastiera in prima persona: sul telefono non
  funziona, e Mike non vuole visitare un ufficio, vuole vedere com'è andata.
- **I titoli da clic come fonte.** «Agenti che stampano soldi 24 ore su 24», codice promesso «a mille
  iscritti»: si guarda la descrizione e il repository, non il titolo.
