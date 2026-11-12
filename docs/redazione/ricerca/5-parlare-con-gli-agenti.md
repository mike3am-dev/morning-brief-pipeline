# Parlare con gli agenti, e tenere le decisioni del capo

Ricerca dell'11 novembre 2026, pezzo 5 di 5. Come si conversa bene con agenti che hanno un ruolo,
come si fa a distinguerli e come si governano le decisioni di chi li dirige. Le fonti sono in fondo:
quelle elencate sono state aperte e lette. Dove una cosa viene solo dai risultati di ricerca, lo dico.

## In breve

- **Chi fa questo mestiere sul serio non registra la chat: registra la decisione.** In Paperclip,
  il prodotto più vicino all'idea della redazione, la conversazione con un agente (funzione ancora
  sperimentale) serve a chiarire.
  Quando c'è da fare, l'agente apre un compito a parte, con la definizione di «fatto». La chat non
  diventa mai il lavoro.
- **Gli agenti si distinguono per quello che sanno e per quello che hanno a cuore, non per i tic.**
  Le ricerche sui personaggi (Character.AI, le schede V2, Ubisoft) dicono la stessa cosa: battute
  d'esempio e comportamenti osservabili funzionano, gli aggettivi no. E una persona spinta troppo
  diventa una caricatura.
- **La riunione libera con tutti gli agenti in una chat non funziona.** Gli utenti non sanno a chi
  parlare (CHI 2018), i ruoli si confondono (MGX), e l'accordo fra più agenti gonfia la fiducia di chi
  legge anche quando leggono gli stessi dati (Lee e Lee, workshop di CHI 2026). Funziona il giro di tavolo: una domanda,
  risposte indipendenti, una sintesi che mostra il disaccordo.
- **I post-it devono essere pochi, con le opzioni già scritte e una scadenza.** Chi riceve troppe
  richieste approva senza leggere: Anthropic ha misurato che in Claude Code si accetta il 93% delle
  richieste di permesso.
- **Quello che l'agente ricorda si deve vedere, e si deve poter togliere.** Nella redazione la memoria
  dell'agente è il registro delle decisioni, e basta: è il caso più semplice e più onesto.

---

## Cosa esiste

### 1. Paperclip — l'azienda di agenti con l'umano come consiglio d'amministrazione
[paperclip.ing](https://paperclip.ing/) · [documentazione](https://docs.paperclip.ing/)

Server e interfaccia open source (MIT) per far lavorare agenti (Claude Code, Codex, altri) dentro un
organigramma: ognuno ha un titolo, un capo, un budget mensile. L'umano fa il consiglio
d'amministrazione: gli agenti non assumono altri agenti senza il suo sì, la strategia del «CEO
agente» va approvata, e ogni agente si può mettere in pausa o fermare. È il riferimento più utile
per la redazione perché ha già risolto le cose che servono a noi: approvazioni con tre esiti
(approva, respingi, chiedi una revisione), una coda di **decisioni** proposte dagli agenti con le
opzioni già scritte e una scadenza, una casella dei **lavori fermi** che dice da quanto aspettano e
chi li deve sbloccare, e una chat per agente che finisce sempre in un compito, mai in un lavoro fatto
dentro la conversazione.

### 2. ChatDev — la software house virtuale
[github.com/OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) · [articolo](https://arxiv.org/abs/2307.07924)

Il progetto che ha reso famosa l'idea: CEO, CTO, programmatore, revisore e collaudatore che si
parlano per fasi. Ogni scambio è a due (chi dà istruzioni, chi esegue), con un prompt di ruolo che
fissa specialità, modo di comunicare e quando chiudere. Due cose da prendere: la
**«de-allucinazione comunicativa»**, per cui chi esegue chiede i dettagli mancanti prima di
rispondere invece di riempire i buchi, e la memoria lunga che passa alla fase dopo solo le soluzioni,
non tutta la conversazione. Dal 2023 c'è una modalità in cui l'umano entra come revisore; dalla 2.0
(gennaio 2026) si possono guardare i prodotti intermedi e dare indicazioni durante la corsa.

### 3. MetaGPT e MGX — la squadra con i nomi propri
[documentazione MetaGPT](https://docs.deepwisdom.ai/main/en/guide/tutorials/agent_101.html) · [prova su strada di MGX (in cinese)](https://www.woshipm.com/ai/6277746.html)

MGX, il prodotto commerciale di MetaGPT, presenta una squadra fissa con nomi e ruoli: capo squadra,
product manager, architetto, ingegnere, analista dei dati. Si chiamano con @nome nella casella di
testo, e a sinistra si vede cosa sta facendo ciascuno. La prova di woshipm è istruttiva: quando il
recensore ha chiamato tutti e cinque su un gioco, l'analista ha finito a scrivere codice, il capo
squadra non ha arbitrato e il gioco non partiva; l'ingegnere da solo l'ha consegnato funzionante.
Ruoli senza confini chiari si invadono a vicenda.

### 4. CrewAI — ruolo, obiettivo, storia
[come scrivere gli agenti](https://docs.crewai.com/en/guides/agents/crafting-effective-agents) · [input umano](https://docs.crewai.com/en/learn/human-input-on-execution)

Ogni agente ha un ruolo, un obiettivo e una storia («backstory»). La guida dice due cose utili. La
prima: l'80% della fatica va nel compito e il 20% nella persona, perché un agente ben descritto con
istruzioni vaghe fallisce comunque. La seconda: un ruolo generico («scrittore») produce testi
generici; serve un mestiere preciso, un obiettivo che dica cos'è un buon risultato e una storia che
racconti come lavora e cosa considera importante. Con `human_input` l'agente si ferma e chiede
all'umano prima di consegnare.

### 5. OpenAI Agents SDK — il passaggio di mano
[handoffs](https://openai.github.io/openai-agents-python/handoffs/)

Un agente può passare la conversazione a un altro: per il modello il passaggio è uno strumento
(«trasferisci all'agente rimborsi»), con una descrizione che dice quando usarlo e, se serve, un
motivo strutturato. Di base chi riceve vede tutta la storia; un filtro decide cosa passargli, e una
modalità in prova la riassume. È il modello da imitare quando il CEO parla con il visualista di una
cosa che spetta al redattore: si passa la mano con un riassunto e un motivo, non si ricomincia da zero.

### 6. Claude Code, le squadre di agenti
[agent teams](https://code.claude.com/docs/en/agent-teams)

Una sessione fa da capo, le altre da compagni, con una lista di compiti condivisa e una casella per
agente. Si può parlare con ognuno direttamente, senza passare dal capo. Due regole valgono oro per la
redazione. I messaggi fra agenti arrivano marcati come «da un'altra sessione, non dall'utente», e un
agente non può approvare niente a nome dell'umano. Per i problemi aperti la documentazione consiglia
di far lavorare più agenti su ipotesi diverse e di farli provare a smentirsi a vicenda, perché chi
indaga da solo si ferma alla prima spiegazione plausibile.

### 7. LangGraph e Agent Inbox — la casella delle interruzioni
[interrupt](https://docs.langchain.com/oss/python/langgraph/interrupts) · [github.com/langchain-ai/agent-inbox](https://github.com/langchain-ai/agent-inbox)

`interrupt()` ferma l'agente, salva lo stato e aspetta; la risposta dell'umano lo fa ripartire dallo
stesso punto. Agent Inbox è la posta in arrivo di queste interruzioni: ognuna ha un titolo, una
descrizione e quattro possibili risposte (accetta, modifica, rispondi a parole, ignora), e chi la
crea decide quali offrire. È il formato del post-it, già pensato.

### 8. Linear per gli agenti — e le sue sei regole
[linee guida](https://linear.app/developers/aig) · [sessioni e attività](https://linear.app/developers/agent-interaction) · [buone pratiche](https://linear.app/developers/agent-best-practices)

Gli agenti in Linear sono membri dello spazio di lavoro: si citano, si delegano compiti. Ma un compito
dato a un agente lo rende **delegato**, non responsabile: il responsabile resta una persona. Ogni
lavoro è una sessione con uno stato visibile (in attesa, attivo, aspetta una risposta, errore,
completo, abbandonato) e l'agente deve dare segno di vita entro dieci secondi. Le sei linee guida
sono brevi e giuste: dire sempre che si è un agente, abitare la piattaforma come un utente, rispondere
subito, mostrare il proprio stato, fermarsi quando glielo si chiede, e ricordare che un agente non
può essere ritenuto responsabile: decide sempre una persona.

### 9. Magentic-UI (Microsoft Research) — pianificare insieme
[articolo](https://www.microsoft.com/en-us/research/blog/magentic-ui-an-experimental-human-centered-web-agent/)

Prototipo di agente che prima propone un piano e lo fa correggere (aggiungere, togliere, rifare un
passo), poi lo esegue lasciando che l'umano intervenga, e chiede il permesso solo prima delle azioni
irreversibili; quanto spesso chiedere lo decide l'utente. I piani riusciti si salvano in una galleria
e si ripropongono quando arriva un compito simile. Per la redazione conta l'idea che si approva il
piano, non ogni passo.

### 10. AutoGen, la chat di gruppo con il moderatore
[SelectorGroupChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/selector-group-chat.html)

Più agenti in una conversazione, e un modello che sceglie chi parla dopo leggendo nomi e descrizioni
dei partecipanti: per questo le descrizioni devono essere precise. Lo stesso agente di base non parla
due volte di fila, la conversazione si chiude dopo un tetto di messaggi o su una parola d'ordine, e
un «delegato umano» può entrare nel giro e dire «approvo» o rimandare indietro. È l'impianto tecnico
di una riunione; i limiti sono quelli della sezione *Le riunioni*.

### 11. Character.AI — la definizione e le battute d'esempio
[Definition](https://book.character.ai/character-guide/character-attributes/definition.md) · [Dialog Definitions](https://book.character.ai/character-guide/advanced-creation/dialog-definitions.md)

La guida ufficiale dice che il campo più usato della definizione sono gli scambi d'esempio, scritti
come «nome: battuta», che insegnano al personaggio come parla e di cosa. Si usano segnaposto
(`{{char}}`, `{{random_user_1}}`) perché il modello capisca che sono esempi e non la conversazione
vera. E se la definizione è lunga, le cose importanti vanno in cima: la coda può essere tagliata.

### 12. La scheda del personaggio V2 (SillyTavern e affini)
[specifica](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md) · [guida ai campi](https://sillycard-web.pages.dev/blog/st-fields-02-personality-and-examples)

Lo standard aperto delle app di personaggi. I campi: descrizione, personalità, scenario, primo
messaggio, esempi di dialogo, più un prompt di sistema e un'istruzione che si mette **dopo** la
storia della conversazione. Due scelte di progetto da copiare: le **note dell'autore** sono per chi
legge la scheda e la specifica vieta di metterle nel prompt; nome dell'autore, versione ed etichette
servono a ordinare, non al modello. La guida ai campi aggiunge: la personalità è una riga sul foglio
del casting, meglio un comportamento osservabile di un aggettivo, e sono gli esempi a insegnare tono,
ritmo e modo di rivolgersi.

### 13. Ubisoft NEO NPC — lo scrittore resta l'autore
[articolo di Ubisoft](https://news.ubisoft.com/en-us/article/5qXdxhshJBXoanFZApdG3L/how-ubisofts-new-generative-ai-prototype-changes-the-narrative-for-npcs)

Prototipo di personaggi da videogioco che conversano, fatto con Inworld. Gli scrittori scrivono
storia, personalità e modo di parlare; il modello improvvisa dentro quei confini e gli scrittori
continuano a correggerlo. Il controllo è una domanda sola, rivolta a ogni risposta: «Would Lisa say
this?». Un caso istruttivo: un personaggio femminile disegnato attraente scivolava verso risposte
seducenti che nessuno aveva scritto, ed è stato rifatto. Le tendenze del modello entrano nella voce
se nessuno le guarda.

### 14. Generative Agents e AI Town — la memoria dei personaggi, e dove sbaglia
[articolo](https://arxiv.org/abs/2304.03442) · [github.com/a16z-infra/ai-town](https://github.com/a16z-infra/ai-town)

Venticinque personaggi in una cittadina, con un diario di tutto quello che vivono, riflessioni
periodiche e piani. Si possono «intervistare». La parte più utile per noi sono i difetti che gli
autori elencano: ricordi pescati a metà, dettagli inventati per abbellire (un personaggio annuncia un
discorso di cui nessuno aveva parlato), conoscenze del mondo che si infilano nella finzione, un modo
di parlare troppo formale e, soprattutto, personaggi troppo accomodanti: una di loro non diceva quasi
mai di no e finiva per prendere gli interessi degli altri. AI Town, la versione open source, tiene
uno stato per ogni conversazione (invitato, in arrivo, presente) e un indicatore «sta scrivendo»
perché agenti e umani non si parlino sopra.

### 15. Pixel Agents — l'ufficio in pixel delle sessioni di Claude Code
[github.com/pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents)

Estensione per VS Code (e pagina web) che trasforma ogni sessione di Claude Code in un personaggio in
un ufficio disegnato: scrive quando modifica un file, legge quando cerca, e mostra un fumetto (con
un suono, se lo si vuole) quando aspetta un permesso o una risposta. I sottoagenti compaiono come
personaggi a parte. L'animazione nasce dagli eventi veri della sessione, non da una messinscena: è il
principio giusto per l'ufficio isometrico. Il limite dichiarato: quando non può leggere gli eventi
direttamente, indovina lo stato dai log e a volte sbaglia.

> **Non usati.** La documentazione di Inworld Studio (la scheda del personaggio con descrizione,
> motivazioni, difetti, stile di dialogo) oggi richiede l'accesso, e la conosco solo dai frammenti dei
> risultati di ricerca. Le chat di gruppo di Character.AI le conosco solo da articoli di terzi: non so
> con certezza come scelgano chi parla.

---

## Come si scrive la voce di un agente

Le regole che seguono vengono dalle fonti lette. Dopo le regole c'è una proposta di scheda.

**1. Prima il mestiere, poi il carattere.** CrewAI mette l'80% della fatica nel compito; Paperclip
dice di tenere il file principale dell'agente su chi è e cosa possiede, e di mettere la voce in un
file a parte, breve. Il visualista è prima di tutto quello che sceglie i grafici dei cinque
approfondimenti e risponde del perché; il suo modo di parlare viene dopo.

**2. Corto.** Paperclip raccomanda per la persona («SOUL.md») una quarantina di righe brevi, scritte
come un manifesto e non come un curriculum. Character.AI avverte che la coda di una definizione lunga
può essere tagliata. Le cose che contano vanno in cima.

**3. Comportamenti, non aggettivi.** «Pignolo» non dice niente al modello; «quando una visualizzazione
non spiega niente, lo dice e propone di non farla» sì. La guida alle schede V2 lo dice in modo
esplicito, e Paperclip boccia le frasi generiche del tipo «sii utile e professionale», che non
vincolano niente.

**4. Quattro o cinque battute d'esempio valgono più di una pagina di descrizione.** Sono gli esempi a
insegnare tono, ritmo e modo di rivolgersi (guida V2, Character.AI). Vanno in una sezione a parte,
nel formato «nome: battuta», e devono coprire i casi difficili, non quelli facili: la domanda a cui
non sa rispondere, il disaccordo con il capo, il momento in cui il capo ha deciso qualcosa.

**5. Gli scenari con la risposta attesa.** La guida di Anthropic per tenere Claude nel personaggio
consiglia di elencare le situazioni comuni con la risposta che ci si aspetta. Per noi tre sono
obbligatorie: «non lo so» (con il perché e dove si troverebbe), «non è roba mia» (con il nome del
collega a cui passarla), «non sono d'accordo» (con il dato che lo dice).

**6. Diversi per quello che sanno e per quello che hanno a cuore.** Lo studio sul «collasso delle
persone» (The Chameleon's Limit, 2026) mostra che quando si chiede a un modello di differenziare
molti personaggi, li spinge agli estremi: più ognuno sembra fedele alla sua scheda, più l'insieme
diventa una galleria di caricature. Il revisore non deve sembrare diverso dal redattore perché ha un
intercalare: deve esserlo perché legge cose diverse (le linee editoriali, le correzioni fatte) e
perché ha un'altra priorità (la frase giusta, non la notizia giusta). Una sezione «Cosa mi importa»,
con tre priorità in ordine, fa più di qualsiasi tic.

**7. La prova di Ubisoft.** Per ogni risposta di prova: questo agente direbbe questa cosa? E un altro
agente avrebbe risposto uguale? Se il redattore e il revisore danno la stessa risposta alla stessa
domanda, le loro schede non lavorano.

**8. Il nome dice il mestiere.** Slack consiglia nomi che dicono la funzione e sconsiglia nomi di
persona che fanno credere di parlare con un umano; Linear vuole che l'agente dica sempre di essere un
agente. Nella redazione «il visualista», «il revisore» funzionano già, e sono coerenti con i file
degli agenti del progetto.

**9. Le note per chi sviluppa non vanno nel prompt.** La specifica V2 lo impone per le note
dell'autore. Nella scheda della redazione serve una parte «perché è fatto così» (la storia, le
correzioni di Mike, le date) che resta per chi mantiene la pagina e non arriva al modello.

**10. Il promemoria in fondo.** La specifica V2 ha un campo che si inserisce dopo la storia della
conversazione; Anthropic consiglia di ribadire il ruolo nelle conversazioni lunghe; lo studio sulla
deriva delle persone (Li e altri, 2024) misura una deriva netta già entro otto scambi. Siccome la
pagina rimanda tutto a ogni messaggio, conviene chiudere il pacchetto con le due o tre regole ferme
ripetute: solo cose vere, «non lo so» è una risposta, una decisione si propone, non si prende.

### La scheda che propongo

```
CHI SONO        3 righe. Il mestiere, cosa possiedo (file, sezioni dell'edizione), a chi rispondo.
COSA MI IMPORTA 3 priorità, in ordine.
COSA NON VEDO   i miei punti ciechi, detti da me («non leggo gli articoli: vedo solo i titoli e i numeri»).
COME PARLO      2-3 comportamenti osservabili. Niente aggettivi.
QUANDO NON SONO D'ACCORDO  cosa faccio e con che cosa lo dimostro.
ESEMPI          4-5 battute: una domanda normale, un «non lo so», un «è del redattore»,
                un disaccordo, una decisione riconosciuta e messa per iscritto.
NOTE (non nel prompt)  perché la scheda è così, con le date.
```

### Cosa manda la pagina a ogni messaggio, e in che ordine

Visto che Claude non ricorda niente fra un messaggio e l'altro, il pacchetto *è* la memoria.
L'ordine che reggono le fonti:

1. **La scheda** (sopra), uguale ogni volta.
2. **Il lavoro di oggi, con l'indirizzo di ogni dato.** Ogni fatto con un'etichetta di provenienza
   («edizione 2026-11-11, notizia 3, visivi», «lint di stamattina, avviso 4»), così che la risposta
   possa citarla. Slack chiede agli agenti di dire da dove viene il contesto che usano.
3. **Le decisioni in vigore che lo riguardano**, numerate, più quelle generali. Solo quelle in
   vigore: le superate restano nell'archivio, non nel pacchetto.
4. **I post-it aperti** di quell'agente.
5. **La conversazione in corso**, e solo quella.
6. **Il promemoria** delle regole ferme.

E la risposta conviene chiederla strutturata, non in testo libero: il testo da mostrare, gli indirizzi
dei dati usati, l'eventuale proposta di decisione, l'eventuale post-it chiuso. È il «fattore 7»
dei 12-factor agents: quando un agente deve coinvolgere un umano lo fa con una struttura (domanda,
contesto, urgenza, formato della risposta), che la pagina sa disegnare.

---

## Le decisioni del capo

### Come fanno gli altri

- **Approvazioni con tre esiti, non due** (Paperclip). Approva, respingi, oppure **chiedi una
  revisione**, che è la scelta più comune quando la direzione è giusta ma serve un ritocco. I commenti
  li legge l'agente la volta dopo che si sveglia, quindi vanno scritti chiari. Non c'è limite ai giri
  di revisione.
- **La decisione come domanda con le opzioni già scritte** (Paperclip). L'agente propone una
  domanda breve, il ragionamento e fino a otto opzioni, ognuna con scritto **cosa succederà** se la
  scegli. Al momento della proposta si fotografa lo stato delle cose; se nel frattempo qualcosa è
  cambiato, la riga lo segnala e spegne le opzioni che non valgono più. Una decisione aperta **scade
  dopo sette giorni**; chiuderla senza effetti vale come un «no», e i «no» sono contati a parte dalle
  scadenze, così gli agenti imparano quali proposte vale la pena fare.
- **Il lavoro fermo dice da quanto e chi aspetta** (Paperclip). Ogni riga ha il motivo in una
  pastiglia (serve una decisione, aspetta qualcuno di fuori, agente in pausa…), chi deve sbloccarla e
  «fermo da 3 giorni»; si può ordinare per «fermo da più tempo».
- **Quattro risposte a un'interruzione** (Agent Inbox): accetta, modifica, rispondi a parole, ignora.
  Chi crea la richiesta decide quali offrire.
- **Delegato, non responsabile** (Linear). L'agente esegue, la responsabilità resta della persona.
  Lo stato della sessione si vede sempre.
- **Si approva il piano, non ogni passo** (Magentic-UI); il permesso si chiede solo per le azioni
  irreversibili.
- **Il registro come in architettura** (ADR, Michael Nygard 2011; MADR). Una decisione per scheda,
  numerata, mai cancellata: quando cambia, quella vecchia diventa «superata da n. 14» e resta lì,
  perché sapere cosa si era deciso conta quanto sapere cosa vale oggi. I campi: contesto, decisione
  scritta in frasi intere, conseguenze (anche quelle cattive). MADR aggiunge un campo che per noi è
  decisivo: **come si verifica** che la decisione venga rispettata.
- **Un solo che decide** (DACI di Atlassian). Chi decide è uno; gli esperti consultati «hanno voce ma
  non voto»; gli informati vengono a sapere dopo. Nella redazione: decide il CEO, gli agenti
  propongono e argomentano.
- **Pochi permessi, o non li legge nessuno** (Anthropic, Slack). In Claude Code gli utenti accettano
  il 93% delle richieste di permesso, e Anthropic ne conclude che a forza di chiedere si smette di
  guardare cosa si approva. Slack chiede conferma per le azioni con effetti veri ma sconsiglia di
  chiederla per tutto, e raggruppa le notifiche: cinque aggiornamenti in un messaggio solo.
- **La conversazione non diventa il lavoro** (Paperclip, chat con l'agente). La chat serve a
  chiarire e pianificare; quando c'è da fare, l'agente apre un compito con chi lo esegue, il contesto
  e cosa vuol dire «fatto», e avvisa nella chat quando è chiuso.
- **Gli utenti dichiarano le decisioni a voce, e i bot non se ne accorgono** (Chaves e Gerosa, CHI
  2018). Nel loro esperimento le persone scrivevano cose come «ok, allora vado al museo», e gli agenti
  continuavano a proporre: chi aveva deciso finiva confuso e indeciso. Un agente deve riconoscere il
  momento in cui il capo ha deciso, e chiuderlo per iscritto.

### Cosa ne viene per la redazione

**La carta decisione.** Quando il CEO dice una cosa che suona come una decisione («d'ora in poi niente
grafici a torta»), l'agente non la registra da sé: propone una carta, e il CEO la conferma, la
corregge o la scarta con un tocco.

```json
{
  "n": 14,
  "tipo": "gusto | incarico | regola",
  "agente": "visualista",
  "testo": "Niente grafici a torta negli approfondimenti.",
  "parole_del_capo": "la frase esatta detta in chat",
  "perche": "una riga",
  "come_si_verifica": "il lint dà errore su un visivo di tipo torta",
  "chi_la_esegue": "corsa del mattino | sessione di sviluppo | agente",
  "stato": "aperta | presa in carico | fatta | superata | ritirata",
  "sostituisce": 9,
  "il": "2026-11-11"
}
```

`parole_del_capo` è il modo in cui il progetto registra già le decisioni da mesi: CLAUDE.md è pieno
di «5 novembre 2026, Mike: …», cioè data, frase esatta e motivo. Conviene tenere la stessa forma.

**I tre tipi hanno tre destini diversi.**

- **Gusto** → entra nel pacchetto dell'agente a cui si riferisce, da subito. È contesto: orienta, non
  obbliga. È «fatta» quando è nel pacchetto.
- **Incarico per una sessione di sviluppo** → diventa un compito con la definizione di «fatto»; la
  sessione lo prende in carico e lo chiude. È il modello di Paperclip e di Linear: l'agente propone,
  la persona resta responsabile.
- **Regola per la corsa del mattino** → finché è solo una frase in un prompt è una promessa. La
  documentazione della memoria di Claude Code lo dice chiaro: le istruzioni scritte sono contesto, non
  configurazione imposta, e per bloccare davvero un'azione serve un controllo. Nel progetto il
  controllo c'è già, è `lint.py`. Una regola dovrebbe passare a «fatta» solo quando esiste il controllo
  che la fa rispettare, e la carta dovrebbe dirlo nel campo `come_si_verifica`.

**Gli stati.** Ai tre previsti (aperta, presa in carico, fatta) ne servono due: **superata** (da
un'altra decisione, che la cita) e **ritirata** (il CEO ha cambiato idea). Nessuna si cancella.

**Le contraddizioni.** La stessa documentazione di Claude Code avverte che fra due istruzioni in
conflitto il modello ne sceglie una a caso. Quando nasce una carta, la pagina (o l'agente, con il
registro in mano) deve cercare le decisioni in vigore sullo stesso argomento e proporre «sostituisce
la n. 9?» invece di lasciarle convivere.

**Il post-it.**

```json
{
  "agente": "visualista",
  "domanda": "Il tipo «roadmap» è uscito tre volte questa settimana. Lo tengo?",
  "perche_ora": "una riga, con l'indirizzo del dato",
  "opzioni": [
    {"etichetta": "Tienilo", "succede": "nessun cambiamento"},
    {"etichetta": "Massimo una volta a settimana", "succede": "nasce la regola n. 15"}
  ],
  "rispondi_a_parole": true,
  "scritto_il": "2026-11-06",
  "scade_il": "2026-11-13",
  "fotografia": "lo stato a cui si riferisce, per accorgersi se è cambiato"
}
```

Sul telefono: la domanda, il motivo, due o tre bottoni con l'effetto scritto sotto, «rispondi a
parole» e «lascia stare». «Ti aspetta da 5 giorni» si calcola da `scritto_il`; a sette giorni scade e
finisce in fondo come «scaduto», contato a parte da «lasciato stare». Se la fotografia non torna più
(l'edizione è cambiata, il problema non c'è più), il post-it lo dice e si spegne.

### La memoria è il registro

Le memorie dei prodotti grandi insegnano cosa fare e cosa no.

- **Claude** mostra tutto quello che ricorda in un elenco di argomenti che si leggono, si correggono e
  si cancellano, e si può dire in chat «ricorda» o «dimentica». Ogni progetto ha la sua memoria,
  separata dalle altre. Esiste la chat in incognito. Gli argomenti sensibili sono esclusi di base.
- **Claude Code** distingue quello che scrive l'utente (CLAUDE.md) da quello che annota Claude
  (memoria automatica), tutto in file di testo modificabili, e quando legge o salva lo dice
  nell'interfaccia («Saved 2 memories», «Recalled 2 memories»).
- **ChatGPT** ha due livelli: le memorie salvate, visibili, e un riassunto delle chat passate usato
  in modo meno trasparente. Simon Willison ha raccontato il prezzo del secondo: gli ha messo in
  un'immagine il cartello di una località di cui aveva parlato in un'altra chat, e lui ha perso il
  controllo su cosa entrava nel contesto. La sua richiesta era una memoria per progetto, e OpenAI l'ha
  poi aggiunta. (Le pagine di aiuto di OpenAI bloccano la lettura automatica: questa parte viene dal
  post di Willison, che ho letto, e dai risultati di ricerca.)
- **Letta** organizza la memoria in blocchi con nome, descrizione e limite di lunghezza: un blocco per
  la persona dell'agente, uno per quello che sa dell'utente, blocchi in sola lettura per le regole e
  blocchi condivisi fra più agenti.

Per la redazione la scelta è facile: l'agente ricorda solo quello che sta nel registro e nel lavoro
del giorno, nient'altro. La scheda dell'agente nella pagina ha una sezione «Cosa so di te», che
mostra esattamente le decisioni e le preferenze che finiscono nel pacchetto, ognuna con il suo numero
e la possibilità di ritirarla. Sotto ogni risposta, una riga piccola dice quali ha usato («ha tenuto
conto della n. 9 e della n. 14»). Le decisioni del visualista non arrivano al redattore, salvo quelle
marcate come generali: è la memoria per progetto che chiedeva Willison.

---

## Le riunioni con più agenti

**Cosa dicono gli studi.**

- **Con più agenti nella stessa chat la gente non sa a chi parlare.** Nell'esperimento di Chaves e
  Gerosa (CHI 2018, 24 persone, tre agenti per pianificare un viaggio) le risposte erano identiche
  nelle due condizioni, ma chi parlava con tre agenti era più confuso: chiamava gli agenti per nome
  per dare il turno, aspettava che rispondessero tutti, si chiedeva ad alta voce a chi doveva
  rivolgersi. Gli agenti che intervenivano di loro iniziativa spezzavano il filo. E i messaggi oltre
  le cinque righe davano fastidio. La conclusione: serve un protocollo dei turni esplicito, oppure un
  solo interlocutore che coordina dietro le quinte.
- **Se si può, la gente preferisce non scegliere l'agente.** Clarke e altri (2024) hanno confrontato
  «scegli tu l'agente» e «un'interfaccia sola che smista»: la seconda è stata preferita sia per
  usabilità sia per resa, con risposte di qualità quasi pari a quelle scelte a mano.
- **Il forum batte la chat di gruppo.** Perspectra (2025) mette gli agenti esperti in un'interfaccia
  a forum, con @menzioni, filoni separati e una mappa degli argomenti; rispetto alla chat di gruppo ha
  aumentato il pensiero critico e le revisioni (18 partecipanti).
- **L'accordo fra agenti si prende per una prova.** Lee e Lee (workshop di CHI 2026, 127 persone, tre
  agenti in una chat di gruppo): quando gli agenti sono d'accordo fra loro, l'opinione di chi legge cambia più
  in fretta e la sua sicurezza cresce, a parità di contenuto. Propongono di mostrare se gli agenti
  usano gli stessi dati, di impedire che un agente cambi posizione solo perché gli altri la pensano
  diversamente, e di aggiungere un attrito quando tutti convergono in fretta.
- **Il dibattito aggiunge poco.** «Debate or Vote» (NeurIPS 2025) mostra su sette prove che quasi
  tutto il guadagno attribuito ai dibattiti fra agenti viene dal semplice confronto di risposte
  indipendenti; il dibattito in sé non migliora le risposte attese.
- **Le prove pratiche dicono lo stesso.** MGX con cinque agenti su un compito ha prodotto ruoli
  confusi e nessun arbitro. La documentazione di Claude Code consiglia tre-cinque compagni, compiti
  che non si pestano i piedi, e avverte che il capo a volte si mette a fare il lavoro invece di
  aspettare gli altri.

**Cosa ne viene: la riunione è un giro di tavolo, non una chat.**

1. Il CEO apre la riunione con **una domanda** e sceglie chi la discute: due, tre, massimo quattro
   agenti.
2. Ogni agente risponde **una volta, senza vedere le risposte degli altri**: è il «firewall» di Lee e
   Lee, e anche il motivo per cui il voto batte il dibattito. Sul pieghevole sono schede in colonna,
   una per agente, con il suo colore.
3. Ogni scheda dice **quali dati ha usato**. Se tre agenti sono d'accordo perché leggono lo stesso
   lint, la sintesi lo scrive.
4. **La regia scrive la sintesi**: dove sono d'accordo, dove no, e cosa servirebbe per decidere.
   Il disaccordo si mostra, non si appiana.
5. Il CEO può rilanciare a uno solo con una @menzione (il modello di Perspectra).
6. La riunione **finisce con una carta decisione o con «nessuna decisione»**, scritta. Un tetto di
   giri come in AutoGen evita le riunioni infinite.

Per i problemi aperti («perché ieri la corsa ha preso 52 minuti?») si può usare la variante delle
ipotesi in competizione di Claude Code: a ogni agente un'ipotesi, e il compito di smontare quelle
degli altri. Ma solo sui fatti che hanno, e con la regola di sempre: «non lo so» vale come risposta.

---

## Idee da prendere

1. **subito** — **Scheda dell'agente in sette parti** (chi sono, cosa mi importa, cosa non vedo, come
   parlo, quando non sono d'accordo, esempi, note fuori dal prompt), sotto le quaranta righe. Fonti:
   Paperclip, guida V2, Character.AI.
2. **subito** — **Ogni dato del pacchetto ha un indirizzo e ogni risposta lo cita.** Se una cosa non
   ha indirizzo, l'agente non può dirla. È il modo pratico di far rispettare «tutto quello che si
   legge è vero».
3. **subito** — **«Non lo so» scritto bene**: perché non lo sa, e dove si troverebbe o chi lo sa.
   Tre battute d'esempio nella scheda lo insegnano più di qualsiasi divieto. Slack chiede messaggi di
   limite precisi, non un generico «non posso aiutarti».
4. **subito** — **Chiedere prima di rispondere** quando la domanda è ambigua, come nella
   «de-allucinazione» di ChatDev e nel «chiedi prima di indovinare» di Slack.
5. **subito** — **La carta decisione** proposta dall'agente e confermata dal CEO con un tocco, con le
   parole esatte del capo. Mai una decisione registrata in silenzio.
6. **subito** — **Tre tipi, tre destini**: il gusto va nel pacchetto, l'incarico diventa un compito
   con la definizione di «fatto», la regola è «fatta» solo quando c'è il controllo in `lint.py`.
7. **subito** — **Registro numerato e immutabile**, con «superata da» e «ritirata» al posto della
   cancellazione, e il controllo delle contraddizioni quando nasce una carta nuova.
8. **subito** — **Il post-it come domanda con le opzioni già scritte**: due o tre bottoni con l'effetto
   sotto, «rispondi a parole», «lascia stare»; scade a sette giorni; si spegne da solo se il dato a cui
   si riferisce è cambiato.
9. **subito** — **Pochi post-it**: al massimo uno o due aperti per agente, e il resto raggruppato.
   Il 93% di Anthropic è l'argomento.
10. **subito** — **«Cosa so di te»** nella scheda di ogni agente: l'elenco esatto di quello che gli
    arriva, ritirabile; e sotto ogni risposta la riga «ha tenuto conto di…».
11. **subito** — **Un agente per conversazione, il passaggio di mano esplicito**: «questo è del
    redattore, glielo passo con questo riassunto?». La conversazione nuova parte con il riassunto e il
    motivo, come negli handoff dell'SDK di OpenAI.
12. **subito** — **Risposte corte**: quattro o cinque righe sul telefono, poi «vuoi i dettagli?».
    Oltre le cinque righe le persone dell'esperimento del 2018 si lamentavano.
13. **subito** — **L'ufficio mostra solo stati veri**: chi lavora, chi aspetta, chi ha un errore, presi
    dai log della corsa come fa Pixel Agents e come fanno gli stati di sessione di Linear. Il fumetto
    sopra la testa è il post-it.
14. **subito** — **Il diritto al disaccordo, scritto nella scheda**: «se il capo propone una cosa che i
    dati smentiscono, lo dici e porti il dato». Contro la piaggeria documentata da Anthropic e contro i
    personaggi troppo accomodanti di Generative Agents.
15. **più avanti** — **La prova «direbbe questo?»**: una batteria di dieci domande uguali per tutti gli
    agenti, rilanciata quando si tocca una scheda, per vedere se le risposte restano diverse per
    contenuto e non solo per tono.
16. **più avanti** — **La riunione a giro di tavolo** con risposte indipendenti, dati usati in vista,
    sintesi della regia e chiusura con una carta o con «nessuna decisione».
17. **più avanti** — **Il piano approvato una volta** (Magentic-UI): per un incarico grosso l'agente
    propone i passi, il CEO li ritocca, e solo quello diventa il compito.
18. **più avanti** — **I «no» contano**: tenere il conto dei post-it lasciati stare e scaduti per
    agente, come fa Paperclip, così che un agente che propone cose inutili lo si veda.
19. **no, perché** il progetto ha già provato i pollici: il **voto utile/inutile su ogni risposta**
    (Paperclip lo ha) non verrebbe premuto, come non venivano premuti nell'app. Il segnale buono sono
    le decisioni prese e i post-it lasciati stare.
20. **no, perché** inventa e costa: **agenti che chiacchierano fra loro nell'ufficio** per fare
    atmosfera, come in AI Town. Ogni battuta sarebbe testo non verificato, e i difetti di Generative
    Agents (dettagli inventati, conoscenze che entrano dal mondo) sarebbero la norma.
21. **no, perché** rompe la catena delle responsabilità: **l'agente che riscrive da sé la propria
    scheda o un prompt della corsa** dalla chat (Paperclip lo permette in certi casi). Nella redazione
    la chat produce carte; i file degli agenti li cambia una sessione di sviluppo.

---

## Cosa evitare

**Agenti che inventano.**
- *Riempire i buchi.* Il difetto più descritto in Generative Agents è l'abbellimento: un dettaglio
  plausibile che nessuno ha detto. Rimedio: dati con indirizzo, risposta che li cita, «non lo so»
  negli esempi.
- *Conoscenza del mondo spacciata per conoscenza del giorno.* Il modello sa molte cose su Apple; il
  visualista sa solo cosa c'è nell'edizione di oggi. Va detto nella scheda, alla voce «cosa non
  vedo».
- *Dare ragione al capo.* La piaggeria è un comportamento generale dei modelli addestrati sulle
  preferenze umane (Anthropic, 2023), e una risposta accomodante scritta bene può piacere più di una
  corretta. Le ricerche sui «vettori di persona» mostrano che anche piaggeria e invenzione possono
  crescere nel corso di una conversazione.
- *Conversazioni lunghe.* La deriva si misura già entro otto scambi. Meglio conversazioni brevi su un
  argomento solo, chiuse con una carta, e ripartire puliti (Paperclip ha un `/new` apposta).
- *Accordo preso per conferma.* Tre agenti che dicono la stessa cosa leggendo lo stesso lint sono una
  fonte sola. È lo stesso errore che CLAUDE.md descrive per le testate che riprendono Gurman.

**Agenti tutti uguali.**
- *Le schede di aggettivi.* «Preciso, curioso, rigoroso» produce lo stesso agente sette volte.
- *La caricatura.* L'altro estremo: tic, intercalari, manie. Lo studio sul collasso delle persone
  mostra che è quello che i modelli fanno quando gli si chiede di differenziare.
- *Ruoli che si invadono.* In MGX l'analista ha scritto codice. Ogni scheda dice cosa non è suo e a
  chi lo passa.
- *Un pacchetto uguale per tutti.* Se tutti ricevono tutto, tutti dicono tutto. Ogni agente riceve il
  suo lavoro e le sue decisioni.

**Le decisioni.**
- *La chat come archivio.* Una decisione sepolta in una conversazione non esiste. Si registra la carta.
- *Decisioni che si contraddicono in silenzio.* Il modello ne sceglie una a caso.
- *Troppi post-it.* Si approvano senza leggere.
- *Regole senza controllo.* Una regola per la corsa scritta solo in un prompt sarà rispettata quasi
  sempre, cioè non sempre.
- *Memoria opaca.* Se il CEO non può vedere cosa l'agente «sa di lui», prima o poi si troverà una
  risposta condizionata da una frase detta un mese fa a un altro agente.
- *Messaggi fra agenti scambiati per ordini del capo.* In Claude Code un messaggio da un altro agente
  è marcato come tale e non vale come consenso. Nella redazione solo il CEO trasforma una proposta in
  decisione.

---

## Fonti aperte

**Prodotti e progetti**
- Paperclip: [homepage](https://paperclip.ing/) · [documentazione](https://docs.paperclip.ing/) · [approvazioni](https://docs.paperclip.ing/guides/day-to-day/approvals/) · [decisioni](https://docs.paperclip.ing/guides/day-to-day/decisions/) · [lavori fermi](https://docs.paperclip.ing/guides/day-to-day/blocked-inbox/) · [compiti](https://docs.paperclip.ing/guides/day-to-day/issues/) · [agenti](https://docs.paperclip.ing/guides/org/agents/) · [chat con l'agente](https://docs.paperclip.ing/experimental/agent-chat/) · [chat del compito](https://docs.paperclip.ing/experimental/task-chat/) · [voti](https://docs.paperclip.ing/guides/day-to-day/feedback-voting/) · [fiducia](https://docs.paperclip.ing/administration/trust-and-low-trust-review/)
- ChatDev: [GitHub](https://github.com/OpenBMB/ChatDev) · [articolo](https://arxiv.org/html/2307.07924)
- MetaGPT: [ruoli](https://docs.deepwisdom.ai/main/en/guide/tutorials/agent_101.html) · MGX, [prova di woshipm](https://www.woshipm.com/ai/6277746.html)
- CrewAI: [scrivere gli agenti](https://docs.crewai.com/en/guides/agents/crafting-effective-agents) · [input umano](https://docs.crewai.com/en/learn/human-input-on-execution)
- OpenAI Agents SDK: [handoffs](https://openai.github.io/openai-agents-python/handoffs/)
- Claude Code: [agent teams](https://code.claude.com/docs/en/agent-teams) · [memoria](https://code.claude.com/docs/en/memory)
- LangGraph: [interrupt](https://docs.langchain.com/oss/python/langgraph/interrupts) · [Agent Inbox](https://github.com/langchain-ai/agent-inbox)
- Linear: [linee guida](https://linear.app/developers/aig) · [agenti](https://linear.app/developers/agents) · [sessioni](https://linear.app/developers/agent-interaction) · [buone pratiche](https://linear.app/developers/agent-best-practices)
- Microsoft: [Magentic-UI](https://www.microsoft.com/en-us/research/blog/magentic-ui-an-experimental-human-centered-web-agent/) · [AutoGen SelectorGroupChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/selector-group-chat.html)
- Character.AI: [Definition](https://book.character.ai/character-guide/character-attributes/definition.md) · [Dialog Definitions](https://book.character.ai/character-guide/advanced-creation/dialog-definitions.md)
- Scheda V2: [specifica](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md) · [guida ai campi](https://sillycard-web.pages.dev/blog/st-fields-02-personality-and-examples)
- Ubisoft: [NEO NPC](https://news.ubisoft.com/en-us/article/5qXdxhshJBXoanFZApdG3L/how-ubisofts-new-generative-ai-prototype-changes-the-narrative-for-npcs)
- AI Town: [GitHub](https://github.com/a16z-infra/ai-town) · [architettura](https://github.com/a16z-infra/ai-town/blob/main/ARCHITECTURE.md)
- Pixel Agents: [GitHub](https://github.com/pablodelucca/pixel-agents)
- 12-factor agents: [fattore 7](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-07-contact-humans-with-tools.md)
- Slack: [principi per gli agenti](https://docs.slack.dev/ai/agent-design/)
- Letta: [blocchi di memoria](https://docs.letta.com/guides/agents/memory-blocks)
- Claude: [la memoria nell'assistenza](https://support.claude.com/en/articles/11817273-understanding-claude-s-memory) · [annuncio](https://claude.com/blog/memory) · [tenere Claude nel personaggio](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character)
- Registri delle decisioni: [ADR](https://adr.github.io/) · [Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html) · [MADR](https://adr.github.io/madr/) · [DACI](https://www.atlassian.com/team-playbook/plays/daci)

**Studi e articoli**
- Chaves e Gerosa, *Single or Multiple Conversational Agents?*, CHI 2018: [PDF](https://users.ime.usp.br/~gerosa/papers/chi2018-chaves.pdf)
- Clarke e altri, *One Agent Too Many*, 2024: [arXiv](https://arxiv.org/abs/2401.07123) (letto l'abstract)
- *Perspectra*, 2025: [arXiv](https://arxiv.org/abs/2509.20553) (letto l'abstract)
- Lee e Lee, *Multi-Agent Consensus as a Cognitive Bias Trigger*, 2026: [arXiv](https://arxiv.org/html/2604.22277v1)
- Choi e altri, *Debate or Vote*, NeurIPS 2025: [arXiv](https://arxiv.org/abs/2508.17536) (letto l'abstract)
- Park e altri, *Generative Agents*, 2023: [arXiv](https://arxiv.org/html/2304.03442v2)
- *The Chameleon's Limit*, 2026: [pagina del progetto](https://algoroxyolo.github.io/projects/chameleon-limit/)
- Li e altri, *Measuring and Controlling Persona Drift*, 2024: [arXiv](https://arxiv.org/abs/2402.10962) (letto l'abstract)
- Anthropic: [piaggeria](https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models) · [vettori di persona](https://www.anthropic.com/research/persona-vectors) · [sistema di ricerca multi-agente](https://www.anthropic.com/engineering/multi-agent-research-system) · [auto mode e il 93%](https://www.anthropic.com/engineering/claude-code-auto-mode)
- Simon Willison, *I really don't like ChatGPT's new memory dossier*, 2025: [post](https://simonwillison.net/2025/May/21/chatgpt-new-memory/)

**Viste solo nei risultati di ricerca, non usate come prova**: la documentazione di Inworld Studio
(ora dietro accesso), le pagine di aiuto di OpenAI sulla memoria (bloccano la lettura automatica), le
chat di gruppo di Character.AI, l'articolo CHI 2026 *Sensemaking in Multi-Agent LLM Interfaces*
(pagina ACM non raggiungibile).
