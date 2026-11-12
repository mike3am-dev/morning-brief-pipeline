# Osservare gli agenti — come si guarda e si racconta il lavoro di una squadra

Ricerca dell'11 novembre 2026 per la redazione in 3D. La domanda: chi costruisce strumenti per
seguire agenti AI al lavoro, cosa mostra e come, e cosa se ne può prendere per una stanza dove
**tutto quello che si legge è vero** e i movimenti sono solo scenografia. Le pagine citate sono
state aperte e lette; dove una cosa viene da una fonte di seconda mano è detto.

---

## Cosa esiste

### 1. Claude Code stesso: la vista degli agenti, `/usage`, la telemetria
- [Agent view](https://code.claude.com/docs/en/agent-view) · [Costi](https://code.claude.com/docs/en/costs) · [Monitoring](https://code.claude.com/docs/en/monitoring-usage)

Anthropic ha già un vocabolario degli stati, ed è il più sobrio che ho trovato: **Working** (icona
animata), **Needs input** (gialla), **Idle** (spenta), **Completed** (verde), **Failed** (rossa),
**Stopped** (grigia). Ogni riga ha due orologi diversi: l'età della sessione, a destra, e sotto
`waiting 3m`, «da quanto ti aspetta». La riga di sintesi la scrive un modello Haiku, ed è dichiarato.
`/usage` mostra il conto diviso per tipo (`1.2k input, 5.3k output, 940.0k cache read, 50.0k cache
write ($0.55)`) e dice in chiaro che per chi è in abbonamento quella cifra non è la bolletta. La
telemetria OpenTelemetry ha un evento `subagent_completed` con `duration_ms`, `total_tool_uses`,
`is_async` e un `event.timestamp`.

### 2. claude-code-hooks-multi-agent-observability (disler)
- https://github.com/disler/claude-code-hooks-multi-agent-observability · ★ 1.567

Il progetto di riferimento per gli hook: uno script Python (`send_event.py`) agganciato a 12 eventi
manda ogni evento in POST a un server Bun, che lo salva in SQLite e lo spinge via WebSocket a un
cruscotto Vue. Mostra una colonna di eventi con il colore dell'app e quello della sessione, filtri,
un «pulse chart» a barre per minuto e la trascrizione della conversazione. Niente costi. È la prova
che l'impianto hook → riga → schermo funziona, e anche l'esempio di come finisce: un cruscotto da
sviluppatore, illeggibile per chi non sa cos'è un `PreToolUse`.

### 3. agents-observe (simple10)
- https://github.com/simple10/agents-observe · ★ 716

Stesso impianto (hook in shell «fire and forget», un inoltratore Node, SQLite, React), con due cose
in più: fonde `PreToolUse` e `PostToolUse` della stessa chiamata **in una riga sola**, e ricostruisce
la gerarchia degli agenti, chi ha lanciato chi. Dalla 0.9.7 ha token e costi per sessione. Il server
tiene solo «attiva/ferma»: lo stato di ogni agente lo ricava la pagina dagli eventi.

### 4. claude-devtools (matt1398)
- https://github.com/matt1398/claude-devtools · [documentazione](https://claude-dev.tools/docs) · ★ 4.037

Non usa hook: rilegge a posteriori i registri JSONL in `~/.claude/`. Ogni sottoagente diventa un
albero con le sue chiamate, i token, la durata e il costo; mostra quando il contesto si riempie, viene
compresso e si riempie di nuovo, e cosa è stato buttato a ogni compressione. Ha allarmi su errori e
consumi alti. È il modello del «dopo la corsa»: tutto quello che serve sta già nei registri.

### 5. ccusage
- https://github.com/ccusage/ccusage · ★ 19.410

Il contatore più usato: legge gli stessi registri e fa rapporti per giorno, settimana, mese, sessione
e per le finestre di 5 ore dell'abbonamento, con `--breakdown` per modello e i token di cache a
parte. Il prezzo lo prende da una tabella pubblica (LiteLLM) e lo chiama stima. Utile come conferma
dei numeri di `costo.py`, non come idea di forma: è una tabella in terminale.

### 6. Pixel Agents
- https://github.com/pixel-agents-hq/pixel-agents · ★ 10.162

Ogni sessione di Claude Code è un personaggio in un ufficio a pixel: va alla scrivania, si siede,
**scrive** quando modifica file, **legge** quando cerca, e alza un fumetto (con un suono, se vuoi)
quando aspetta un permesso o ha finito. I sottoagenti sono personaggi a parte, legati al loro capo.
Due modi: con gli hook (`SessionStart`, `PreToolUse`, `PermissionRequest`, `Stop`) o, se mancano,
indovinando dai registri. Recensioni di seconda mano dicono che nel modo «indovinato» capisce la fine
del lavoro con un timer di inattività, e a volte sbaglia.

### 7. Claude Office Visualizer (paulrobello)
- https://github.com/paulrobello/claude-office · ★ 615

La cosa più vicina alla nostra redazione: l'agente principale è il **capo**, i sottoagenti sono gli
**impiegati**, e gli oggetti dell'ufficio portano dati. Il **cestino si riempie di carta** man mano che
il contesto cresce e il capo lo calpesta quando Claude comprime; la **stampante** si anima quando esce
un documento; un **cartello di sicurezza** conta gli strumenti usati dall'ultima compressione; i lavori
in background sono riquadri da videochiamata; c'è una colonna «Needs-you». Il limite: una lavagna con
**12 modalità** (torta degli strumenti, kanban, elenco…) — il cruscotto rientra dalla finestra.
Impianto: hook → FastAPI con una macchina a stati → WebSocket → PixiJS.

### 8. whatsmyagentdoing (Charonyuu)
- https://github.com/Charonyuu/whatsmyagentdoing · ★ 398

Un ufficio **isometrico**, in 2D su canvas o in 3D con three.js e i modelli CC0 di Kenney: chi lavora
sta al cubicolo, con un fumetto se pensa e le mani sulla tastiera se un comando gira; chi ha finito va
in pausa (divano, ping-pong); chi ti aspetta saluta con la mano. Stati: Thinking, Running, Writing
reply, Waiting for you, Done, Interrupted, Error, Idle. Due dettagli onesti: un turno è «Done» solo
con un evento di fine, mai per un timeout (senza evento diventa «Idle»); e segnala **«No progress»**
quando un comando gira da più di 10 minuti o il pensiero tace da 8. Toccando un personaggio: stato,
modello, cartella, consumo, la fine della conversazione.

### 9. Vibecraft (Nearcyan)
- https://github.com/Nearcyan/vibecraft · ★ 1.468 · [descrizione](https://starlog.pages.dev/articles/developer-tools/nearcyan-vibecraft)

Un laboratorio in 3D (three.js) dove l'avatar di ogni sessione **si sposta alla stazione dello
strumento che usa**: la libreria per leggere, la scrivania per scrivere, il terminale per i comandi,
l'archivio per cercare, il banco per le modifiche. Gli eventi arrivano da hook che chiamano `curl` in
background. È l'idea del «dove sta l'agente dice cosa fa», che da noi ha già una forma: la fila della
prosa.

### 10. Langfuse
- [Timeline e colori](https://langfuse.com/changelog/2024-10-10-text-color-for-latency-and-costs) · [Grafo degli agenti](https://langfuse.com/docs/observability/features/agent-graphs) · [Tracciare gli agenti di programmazione](https://langfuse.com/resources/engineering/coding-agent-tracing)

Tre idee pulite. Ogni passo porta **la somma** di tempo e costo dei passi sotto di lui. Il colore dice
**la quota sul totale**: rosso dal 75% in su, giallo fra 50 e 75, niente sotto. Il grafo ha due modi,
**aggregato** (i passi con lo stesso nome diventano un nodo con il contatore, «retrieve_docs (3/3)»)
ed **esteso** (ogni chiamata il suo nodo, nell'ordine in cui è successa). Per Claude Code usa un hook
`Stop` che rilegge la trascrizione e la manda al loro servizio.

### 11. Braintrust
- [Esaminare le tracce](https://docs.braintrust.dev/observe/examine-traces) · [Com'è fatta una buona traccia](https://www.braintrust.dev/articles/what-does-a-good-ai-agent-trace-look-like)

La timeline lascia scegliere **cosa misura la lunghezza della barra**: il tempo, i token, il costo. Sopra
le barre divide i token in quattro: input nuovo, letto dalla cache, scritto in cache, output — che
sono esattamente le quattro voci che `costo.py` già registra (`nuovi`, `in_cache`, `scritti_cache`,
`scritti`). La vista a conversazione raccoglie il lavoro intermedio in un blocco «Worked» con la
durata e il numero di chiamate. L'articolo dà la regola che vale anche per noi: una traccia è buona se
qualcuno può ricostruire cosa è successo senza rifarlo, e **le durate dei figli non si sommano** quando
lavorano in parallelo.

### 12. CrewAI — le tracce di una «crew»
- https://docs-platform.crewai.com/platform/en/features/traces

È la pagina più vicina al nostro registro. In cima un riepilogo: token totali, di prompt e di risposta,
richieste, **tempo di esecuzione**, **costo stimato** (detto così). Poi l'elenco dei compiti con agente,
modello, stato e durata; poi una **timeline di quando ogni compito è iniziato e finito**; e toccando un
compito: inizio, fine, descrizione, cosa doveva consegnare, cosa ha ricevuto dal compito prima e cosa
ha consegnato. È il pannello dell'agente che vogliamo, in forma di tabella.

### 13. LangGraph Studio e Agent Inbox (LangChain)
- [Studio](https://docs.langchain.com/langsmith/use-studio) · https://github.com/langchain-ai/agent-inbox · ★ 1.097

Studio mostra il grafo dell'agente, lo stato a ogni passo, e permette di fermare la corsa **prima o
dopo un nodo**, correggere e ripartire da lì. Agent Inbox è una casella di posta per le richieste degli
agenti: ognuna ha un titolo (l'azione), una descrizione e fino a quattro risposte possibili — **accetta,
modifica, rispondi, ignora** — che l'agente dichiara in anticipo (`allow_accept`, `allow_edit`,
`allow_respond`, `allow_ignore`).

### 14. Devin — Session Insights
- https://docs.devin.ai/product-guides/session-insights

A sessione finita, una timeline a colori degli eventi che contano: rosso un problema grave, giallo uno
medio, grigio un fatto notevole, **verde il valore consegnato**. E una **taglia della sessione**, da XS
a XL, calcolata sul consumo: L e XL sono segnalate come malsane. È il modo più comprensibile che ho
trovato per dire «costosa» senza un numero in dollari.

### 15. Gli altri, in breve
- [AgentOps](https://docs.agentops.ai/v2/usage/dashboard-info): la «Session Waterfall», a sinistra la
  sequenza di chiamate, strumenti ed errori, a destra il dettaglio di quella scelta.
- [Helicone](https://docs.helicone.ai/features/sessions): le sessioni si costruiscono con un percorso a
  barre (`/parent/child`), e i costi si leggono **per unità di lavoro** («un'analisi costa 0,45 $ in
  media», dalla loro guida).
- [AutoGen Studio](https://microsoft.github.io/autogen/stable/user-guide/autogenstudio-user-guide/): i
  messaggi fra agenti scorrono dal vivo e un grafo mostra a chi passa la parola.
- [claude-code-transcripts](https://github.com/simonw/claude-code-transcripts) (Simon Willison):
  trasforma una sessione in pagine HTML con un indice che è **una timeline di prompt e commit** — da noi
  i commit di `salva.py` sono già orari certi.
- Arize Phoenix ha un grafo degli agenti, ma le fonti non concordano se stia nella versione aperta o
  solo in quella a pagamento (AX): non verificato.

---

## Gli hook di Claude Code per lo stato dal vivo

### Prima la notizia buona: inizio e fine ci sono già

I registri di ogni sottoagente hanno un `timestamp` su ogni riga
(`~/.claude/projects/<cartella>/<sessione>/subagents/agent-<id>.jsonl`, con accanto un
`agent-<id>.meta.json` che dice tipo e descrizione; vedi
[questa analisi del file](https://frederick-douglas-pearce.github.io/blog/2026/inside-the-subagent-trace-file/)).
`pipeline/costo.py` li legge già: in `fasi_subagenti` calcola il primo e l'ultimo orario di ogni
registro, fa la sottrazione e **butta via i due orari**, tenendo solo i minuti. Lo stesso vale per i
passi della regia (`fasi_main` ha l'ora di ogni `pipeline/*.py`), che `--fasi` stampa ma non salva.

Quindi **per sapere quando ogni agente ha cominciato e finito non servono hook**: bastano poche righe in
`costo.py` che scrivano `inizio` e `fine` in ogni registro di `data/corse.json`, e la lista dei passi
con l'ora. Costo: zero token, zero secondi di corsa, una modifica a uno script che gira già alla fine.
Limite: si sa tutto, ma solo a corsa finita.

### Gli hook servono per il «dal vivo»

Dalla [documentazione ufficiale](https://code.claude.com/docs/en/hooks), gli eventi utili e cosa
portano:

| Evento | Quando | Campi utili |
|---|---|---|
| `PreToolUse` su `Agent` | la regia chiama un agente | `tool_input.subagent_type`, `description`, `model` |
| `PostToolUse` su `Agent` | l'agente in primo piano ha finito (quello in background: subito, con `status: "async_launched"`) | `agentId`, `totalDurationMs`, `totalToolUseCount`, `resolvedModel` |
| `SubagentStart` | l'agente parte | `agent_id`, `agent_type` |
| `SubagentStop` | l'agente ha finito di rispondere | `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message` |
| `PreToolUse` su `SubagentHandback` | l'agente consegna il rapporto | `tool_input.message`: il rapporto vero |
| `PreToolUse` su `Bash` | un comando della procedura | `tool_input.command` (si tengono solo i `pipeline/*.py`) |
| `Stop` | la regia finisce un turno | `background_tasks`: chi sta **ancora lavorando** (tipo, stato, `agent_type`) |

Ogni evento ha anche `session_id`, e dentro un sottoagente `agent_id` e `agent_type`. **Nessun evento
porta l'ora**: lo script la scrive da sé. Attenzione ai numeri di token dell'`Agent`: `totalTokens` e
`usage` sono **solo l'ultima richiesta**, non il totale (lo dice la documentazione); il totale vero resta
quello che `costo.py` somma dal registro.

**Dove girano.** Le sessioni in cloud leggono gli hook del `.claude/settings.json` del repository (non
quelli di `~/.claude/` sul Mac): lo dice la pagina [cloud environments](https://code.claude.com/docs/en/cloud-environments).
Oggi il `.claude/settings.json` del progetto non ha hook. Gli stessi hook però girerebbero anche
nelle sessioni di Mike sul Mac in questa cartella: lo script deve uscire subito se
`CLAUDE_CODE_REMOTE` non vale `"true"`. Che la routine delle 6:30 li esegua come una sessione in cloud
qualunque è da provare con una routine di prova, mai con quella vera.

### Com'è fatto, in concreto (esempio, non da applicare ora)

```json
{
  "hooks": {
    "PreToolUse":    [{"matcher": "Bash|Agent|SubagentHandback",
                       "hooks": [{"type": "command", "async": true,
                                  "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/stato.py"}]}],
    "PostToolUse":   [{"matcher": "Agent",
                       "hooks": [{"type": "command", "async": true,
                                  "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/stato.py"}]}],
    "SubagentStart": [{"hooks": [{"type": "command", "async": true,
                                  "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/stato.py"}]}],
    "SubagentStop":  [{"hooks": [{"type": "command", "async": true,
                                  "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/stato.py"}]}],
    "Stop":          [{"hooks": [{"type": "command", "async": true,
                                  "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/stato.py"}]}]
  }
}
```

```python
#!/usr/bin/env python3
"""Una riga di stato per la redazione: chi, cosa, quando. Mai il contenuto. Non stampa niente."""
import json, os, sys, time

if os.environ.get("CLAUDE_CODE_REMOTE") != "true":       # solo la corsa in cloud
    sys.exit(0)
try:
    e = json.load(sys.stdin)
except ValueError:
    sys.exit(0)

ev, tool = e.get("hook_event_name"), e.get("tool_name")
inp, out = e.get("tool_input") or {}, e.get("tool_response") or {}
r = {"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "ev": ev,
     "chi": e.get("agent_type") or "regia", "id": e.get("agent_id")}

if tool == "Bash":
    cmd = inp.get("command", "")
    if "pipeline/" not in cmd:
        sys.exit(0)                                       # solo i passi della procedura
    r["passo"] = cmd.split("pipeline/", 1)[1].split()[0][:40]
elif tool == "Agent":
    r.update(chiama=inp.get("subagent_type"), compito=inp.get("description"),
             stato=out.get("status"), agente=out.get("agentId"),
             ms=out.get("totalDurationMs"), modello=out.get("resolvedModel"))
elif tool == "SubagentHandback":
    r["consegna"] = (inp.get("message") or "")[:280]
elif ev == "SubagentStop" and not e.get("agent_type"):
    sys.exit(0)                                           # agenti interni di Claude Code
elif ev == "Stop":
    r["al_lavoro"] = [b.get("agent_type") for b in e.get("background_tasks") or []
                      if b.get("type") == "subagent"]

os.makedirs("/tmp/corsa", exist_ok=True)
with open("/tmp/corsa/stato.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({k: v for k, v in r.items() if v is not None}, ensure_ascii=False) + "\n")
```

Tre cose decise apposta: `async: true` (la corsa non aspetta lo script); **nessuna stampa** (un hook
asincrono che stampa un JSON con `additionalContext` o `systemMessage` lo fa arrivare a Claude al turno
dopo, e su `SessionStart` e `UserPromptSubmit` anche il testo semplice entra nel contesto: è lì che un
hook costerebbe token a ogni corsa); e un **elenco chiuso dei campi** (mai `tool_input` intero: dentro un
`Write` c'è il file, e nelle edizioni ci sono immagini in base64).

### Quanto costa, per strada

| Strada | Cosa dà | Lavoro | Costo in corsa | Rischi |
|---|---|---|---|---|
| **A. `costo.py` salva gli orari** | inizio e fine di ogni agente, i passi della regia con l'ora | poche righe in uno script esistente | nessuno | nessuno; solo a corsa finita |
| **B. Hook su file** (`/tmp/corsa/stato.jsonl`, copiato in `data/` da `salva.py`) | in più: chi ha chiamato chi, il rapporto consegnato, chi era ancora al lavoro a ogni turno della regia | un file di impostazioni + uno script di ~40 righe | zero token; un processo Python in background per evento (lo script scarta subito i `Bash` che non sono `pipeline/`) | gli hook girano anche sul Mac (la guardia sopra); un errore dello script non blocca la corsa ma lascia un avviso |
| **C. Hook dal vivo** (la riga va anche su Supabase) | la stanza si muove alle 6:30 mentre la corsa lavora | B + una tabella con le sue regole, una chiave nell'ambiente della routine | come B, più una chiamata di rete per evento | la pagina deve vivere su GitHub Pages: un artifact su claude.ai non può leggere Supabase (CSP, vedi `mappa-dati.md`); una chiave in più nel cloud |

La A conviene comunque, anche se un giorno si fa la B: gli hook dei sottoagenti **non sono affidabili
al cento per cento**. `SubagentStop` arriva anche per agenti interni di Claude Code (suggerimenti di
prompt, `/btw`) con `agent_type` vuoto ([#27423](https://github.com/anthropics/claude-code/issues/27423),
[#89555](https://github.com/anthropics/claude-code/issues/89555), oggi spiegato nella documentazione);
non arriva se un agente in background viene fermato ([#92716](https://github.com/anthropics/claude-code/issues/92716),
aperto); e l'elenco `background_tasks` di `Stop` può perdere un sottoagente che aspetta un suo comando
([#102765](https://github.com/anthropics/claude-code/issues/102765), aperto). Quindi: gli hook per accendere
le spie mentre si lavora, il registro per scrivere i fatti. Se i due non tornano, vince il registro.

Da non copiare: i tutorial vecchi che leggono variabili d'ambiente come `CLAUDE_SESSION_ID` o
`TOOL_NAME` ([esempio](https://dev.to/bredmond1019/mastering-claude-hooks-building-observable-ai-systems-part-2-2ic4)):
oggi l'hook riceve un JSON sullo stdin. E la telemetria OpenTelemetry, che darebbe tutto e di più ma
chiede un raccoglitore esterno, impostazioni gestite e una credenziale da non mettere nelle variabili
dell'ambiente cloud: troppo per una redazione di una persona.

---

## Idee da prendere

Una regola le tiene insieme, presa per contrasto da quello che ho visto: **gli oggetti-segnale e gli
oggetti-scena non si mescolano**. Il monitor acceso, la spia, il cronometro, la pila di carta, la
cartella che passa di mano si muovono **solo** quando c'è un dato scritto; il caffè, la gente che
cammina, le piante, la luce dell'alba si muovono per conto loro e non vogliono dire niente. Pixel Agents
e simili mescolano le due cose e finiscono per indovinare.

### 1. La spia sulla scrivania
- **Cosa**: lo stato di ogni agente in sei parole, con un colore ciascuna.
- **Da dove**: la vista agenti di Claude Code (Working, Needs input, Idle, Completed, Failed, Stopped);
  gli stati di whatsmyagentdoing.
- **In redazione**: il monitor acceso = sta lavorando; lampada verde = ha consegnato; rossa = non ha
  consegnato e la corsa è uscita col ripiego (l'AI scritta dalla regia, i titoli di Gemini); spenta =
  oggi non c'era (l'archivista dal martedì alla domenica). A corsa finita gli stati vengono dal registro
  e dai file consegnati.
- **subito** per gli stati finali; **più avanti** il monitor acceso dal vivo (strada B o C).

### 2. Il cronometro col tetto
- **Cosa**: la durata della corsa contro il tetto, con il colore della quota.
- **Da dove**: i colori di Langfuse (giallo dal 50%, rosso dal 75% del totale); il tetto scritto in
  `CLAUDE.md` (30 minuti, 45 al massimo col revisore).
- **In redazione**: l'orologio da parete sopra il desk. La lancetta si ferma sul tempo vero
  (`inizio` + `minuti`); lo spicchio fra 30 e 45 è giallo, oltre il 45 rosso. Sotto, in piccolo, il
  numero.
- **subito**.

### 3. Il cronometro di ogni agente, e chi ha sforato
- **Cosa**: ogni agente ha un suo tetto (visualista 8 minuti, revisore 10, schede e gta 10, ai 12:
  sono scritti in `CLAUDE.md` e nei file degli agenti) e la spia diventa rossa quando l'ha passato.
- **Da dove**: il «No progress» di whatsmyagentdoing (un comando da 10 minuti, 8 minuti di silenzio).
- **In redazione**: la clessidra sulla scrivania; a corsa finita dice «ha preso 12 minuti su 10».
  Dal vivo, con gli hook, si girerebbe quando l'agente parte.
- **subito** a posteriori; **più avanti** dal vivo.

### 4. Il passaggio delle carte
- **Cosa**: la cartella che va da lettura a redattore, a revisore, a visualista, nell'ordine vero.
- **Da dove**: il grafo di AutoGen Studio (a chi passa la parola), i due modi di Langfuse (aggregato ed
  esteso), il «chi ha lanciato chi» di agents-observe.
- **In redazione**: la cartella si muove fra le scrivanie della fila della prosa solo dopo che il file
  di chi la consegna esiste. Con gli orari (strada A) si sa anche **quando** è passata, e il movimento
  si può rigiocare con i tempi giusti.
- **subito** l'ordine; **più avanti** gli orari.

### 5. Il foglio dei turni
- **Cosa**: una riga per agente, una striscia da quando ha cominciato a quando ha finito, sulla stessa
  scala del tempo. Si vede che i tre cronisti lavorano insieme mentre la fila della prosa va in fila.
- **Da dove**: la timeline di CrewAI («quando ogni compito è iniziato e finito»), Langfuse, Braintrust.
- **In redazione**: il foglio appeso accanto alla lavagna, o lo schermo gigante durante la corsa.
- **più avanti**: serve la strada A. Finché ci sono solo le durate, le strisce **non si mettono su una
  scala del tempo**: sarebbero posizioni inventate.

### 6. La moviola del mattino
- **Cosa**: rigiocare la corsa di stamattina in un minuto, con gli agenti che si accendono nell'ordine
  e con i tempi veri.
- **Da dove**: la timeline di Devin che si scorre avanti e indietro
  ([aggiornamento di settembre 2024](https://cognition.com/blog/sept-24-product-update)); la vista
  estesa di Langfuse.
- **In redazione**: Mike entra alle 8, preme play sul telecomando dello schermo gigante, e la stanza
  rifà la mattina a velocità dichiarata («×30»).
- **più avanti**: serve la strada A.

### 7. La pila di carta: quanto rilegge ogni agente
- **Cosa**: ogni passo di un agente rimanda al modello tutta la conversazione fin lì, e la cache la fa
  pagare meno. È il motivo per cui la regia rilegge decine di milioni di token.
- **Da dove**: la pagina dei costi di Claude Code («sends your full conversation with every request»,
  e la rilegge alla tariffa della cache); il cestino che si riempie di carta di Claude Office; le quattro
  parti dei token di Braintrust.
- **In redazione**: sulla scrivania una pila di fogli alta quanto i token riletti, e accanto il numero
  dei passi, cioè delle volte che l'agente l'ha rimandata al modello (`risposte` in `corse.json`). La
  regia ha la pila più alta, ed è la cosa giusta da far vedere: è dove si spende.
- **subito** (i quattro numeri ci sono già, per registro).

### 8. Lo scontrino dell'agente
- **Cosa**: il conto di ogni agente diviso in righe: letto nuovo, riletto, scritto in cache, scritto.
  In fondo una cifra in dollari **a listino**.
- **Da dove**: il blocco `Usage by model` di `/usage`; il «costo stimato» di CrewAI; la tabella prezzi
  di Anthropic.
- **In redazione**: lo scontrino esce dalla stampantina del desk toccando l'agente. L'ultima riga dice
  «a listino: in abbonamento non è quello che paghi», perché è vero (lo dice anche `/usage`).
- **subito**, con quella riga.

### 9. Il riletto detto in token nuovi
- **Cosa**: su Opus 5.5 e Sonnet 5.5 un token riletto dalla cache costa **un ventesimo** di uno nuovo
  (0,20 contro 4 $ al milione su Opus, 0,10 contro 2 su Sonnet:
  [prezzi](https://platform.claude.com/docs/en/about-claude/pricing)). «38 milioni riletti» spaventa;
  detto come «quanto 1,9 milioni letti da zero» è la stessa cosa, ed è un conto, non una stima.
- **Da dove**: la tabella dei prezzi; la riga della cache di `/usage` («91% of input tokens from cache»).
- **In redazione**: una riga sullo scontrino, «riletto: come 1,9 M nuovi», e la percentuale dalla cache.
- **subito**.

### 10. La taglia della corsa
- **Cosa**: S, M, L, XL rispetto alle corse delle due settimane prima, per tempo e per token. Una
  parola invece di un numero.
- **Da dove**: la «Session Size» di Devin (XS–XL, L e XL segnalate).
- **In redazione**: un timbro sul giornale appena uscito, sullo schermo gigante. Come si calcola sta
  scritto toccandolo (per esempio: XL = sopra il 90° percentile delle ultime 14).
- **subito**.

### 11. Il peso di ciascuno
- **Cosa**: chi ha preso più della metà del tempo o dei token della corsa, detto col colore.
- **Da dove**: Langfuse (giallo 50–75%, rosso oltre); la barra di Braintrust che si allunga con la
  misura scelta.
- **In redazione**: la lampada sulla scrivania più o meno accesa secondo la quota; il cartellino giallo
  su chi supera la metà. Attenzione: chi lavora in parallelo non si somma (vedi *Cosa evitare*).
- **subito**.

### 12. Il fascicolo consegnato
- **Cosa**: toccando l'agente, quello che ha consegnato davvero: le voci AI coi titoli, le dieci voci di
  Games, le notizie scritte, i grafici fatti.
- **Da dove**: la stampante di Claude Office che si anima quando esce un documento; il «cosa ha
  consegnato» nel dettaglio dei compiti di CrewAI.
- **In redazione**: sulla scrivania la cartellina chiusa; aperta, la prima pagina del file del giorno
  (dalla tabella di `mappa-dati.md`).
- **subito**.

### 13. Il biglietto di consegna
- **Cosa**: la frase con cui l'agente ha consegnato, parola per parola: il rapporto che il sottoagente
  passa con `SubagentHandback`, o il suo ultimo messaggio.
- **Da dove**: i fumetti di Claude Office e Pixel Agents; la riga di sintesi della vista agenti.
- **In redazione**: il biglietto attaccato alla cartella. Va citato, non riassunto: un riassunto fatto
  da un modello è un'altra cosa e andrebbe firmato come tale («in breve, secondo Haiku»).
- **più avanti**: oggi il rapporto non si salva. Lo salverebbe la strada B, o `costo.py` leggendolo dal
  registro principale.

### 14. Il telefono della regia
- **Cosa**: chi ha chiamato chi, e con quale compito.
- **Da dove**: la gerarchia di agents-observe; il capo e gli impiegati di Claude Office.
- **In redazione**: dal desk circolare parte un filo verso la scrivania dell'agente quando la regia
  lo chiama, con il compito scritto sul cartellino (la `description` della chiamata). A corsa finita
  restano i fili di oggi.
- **più avanti** (il compito sta nella chiamata, che solo gli hook o una lettura del registro
  principale conservano).

### 15. Il nastro della telescrivente
- **Cosa**: una riga per ogni passo vero della procedura, con l'ora: `fetch.py`, `eco.py`, «parte il
  redattore», «consegna il revisore», `push.py`.
- **Da dove**: la colonna di eventi di disler e di agents-observe, ma resa come carta stampata invece
  che come elenco di `PreToolUse`.
- **In redazione**: la telescrivente che c'è già nel progetto stampa il nastro; il nastro si srotola
  sul pavimento se è lungo.
- **più avanti**: dal registro con la strada A (a posteriori), dal vivo con la B.

### 16. I post-it che aspettano: «da quanto»
- **Cosa**: le cose che aspettano Mike, ognuna con l'età scritta sopra («aspetta da 6 giorni») e le
  risposte possibili dichiarate.
- **Da dove**: i due orologi della vista agenti (`waiting 3m` contro l'età); Agent Inbox con accetta,
  modifica, rispondi, ignora.
- **In redazione**: il pannello dei post-it all'ingresso. Ogni post-it (una richiesta del visualista,
  una decisione del lunedì, il briefing del gusto scaduto) porta la data in cui è nato e due o tre
  pulsanti — «sì», «no», «ne parliamo» — che scrivono nell'archivio della pagina; la corsa del giorno
  dopo li legge.
- **subito** l'età (le date stanno nei file); **più avanti** i pulsanti (servono l'archivio e chi li
  legge).

### 17. Il cestino calpestato
- **Cosa**: quando il contesto della regia si riempie e Claude lo comprime.
- **Da dove**: Claude Office (il capo calpesta il cestino); claude-devtools (i confini di compressione).
- **In redazione**: il cestino accanto al desk si svuota con un gesto, una volta per ogni compressione
  vera della corsa.
- **più avanti**: `costo.py` dovrebbe contare le compressioni nel registro. Da guardare solo se succede
  davvero: se la regia non comprime mai, il cestino resta un oggetto-scena.

### 18. Fermare la corsa per chiedere a Mike
- **Cosa**: le interruzioni di LangGraph Studio (fermati prima di questo nodo, aspetta una risposta).
- **no, perché**: la corsa delle 6:30 gira da sola mentre Mike dorme, e la regola di `CLAUDE.md` è che
  un'edizione in orario e incompleta batte una completa e tardiva. Le decisioni del CEO valgono per la
  corsa di domani (post-it → archivio → corsa), mai per quella in corso.

### 19. Rifare un passo da lì
- **Cosa**: il «fork» di Studio: correggi lo stato e riparti da un punto.
- **no, perché**: la redazione guarda e non tocca (`progetto.md`). Rifare un passo è lavoro sulla
  pipeline, da sessione sul Mac.

### 20. Mandare le tracce a un servizio esterno
- **Cosa**: i plugin di Langfuse e LangSmith per Claude Code.
- **no, perché**: mandano trascrizioni intere (articoli, prompt, dossier) a un terzo, chiedono un altro
  account, e la pagina su claude.ai non potrebbe comunque leggerli. Tutto quello che mostrano, i registri
  della corsa ce l'hanno già.

---

## Cosa evitare

- **Il cruscotto travestito da stanza.** La lavagna da 12 modalità di Claude Office, il «pulse chart»,
  le torte degli strumenti: sono grafici con un ufficio intorno. Ogni oggetto porta **un** dato, e si
  capisce senza legenda.
- **Indovinare lo stato dal silenzio.** Un agente non è «finito» perché tace da un po': Pixel Agents nel
  modo senza hook fa così e sbaglia. whatsmyagentdoing fa la cosa giusta: «Done» solo con un evento di
  fine, altrimenti «Idle». Da noi: verde solo se il file consegnato c'è o il registro dice fine.
- **Mettere le durate su una scala del tempo senza gli orari.** Finché `corse.json` ha solo i minuti,
  nessuna striscia ha una posizione; inventarla viola la regola ferma.
- **Sommare chi lavora in parallelo.** I tre cronisti lavorano insieme alla lettura e al redattore: la
  somma dei loro minuti non è la durata della corsa. Le quote di peso si fanno sul tempo della corsa
  (orologio a muro) per la durata, e sul totale dei token per i token.
- **Usare `totalTokens` dell'agente come totale.** È solo l'ultima richiesta, lo dice la documentazione;
  i totali veri li somma `costo.py` dal registro.
- **Chiamare «costo» la cifra in dollari.** È a listino, e Mike è in abbonamento. Va scritto sempre
  «a listino», con la composizione (nuovo, riletto, scritto) accanto: una cifra sola senza parti non
  spiega niente e fa paura per la ragione sbagliata.
- **Fidarsi solo degli hook dei sottoagenti.** `SubagentStop` senza `SubagentStart`, agenti interni con
  `agent_type` vuoto, agenti fermati che non chiudono: le spie dal vivo sì, i fatti dal registro.
- **Un hook che stampa.** Su `SessionStart` e `UserPromptSubmit` il testo entra nel contesto; un hook
  asincrono che restituisce `additionalContext` lo porta a Claude al turno dopo. In tutti e due i casi
  si pagherebbe a ogni corsa.
- **Registrare il contenuto.** `tool_input` contiene file interi, prompt, dossier; le edizioni hanno
  immagini in base64. Elenco chiuso dei campi, e i testi tagliati e dichiarati come tali.
- **Gli hook che girano anche sul Mac.** Il `.claude/settings.json` del progetto vale per ogni sessione
  in questa cartella: senza la guardia su `CLAUDE_CODE_REMOTE`, le sessioni di Mike scriverebbero righe
  di stato finte.
- **I riassunti presentati come citazioni.** La vista agenti dichiara che la riga la scrive Haiku. Se la
  redazione mostra una sintesi fatta da un modello, va firmata; se mostra le parole dell'agente, devono
  essere quelle.
- **La classifica degli agenti.** «Il più costoso della settimana» non aiuta a decidere niente. Lo
  scarto che conta è rispetto a sé stessi: la taglia della corsa, l'agente che ha sforato il suo tetto.
