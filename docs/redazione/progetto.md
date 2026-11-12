# La redazione di TMB — chi c'è, dove sta, come funziona

Il progetto di dettaglio, scritto la sera dell'11 novembre 2026 (sessione su Opus) perché la
sessione Fable possa costruire senza ricostruire. Si legge dopo `brief-2026-11-12.md` e
`mappa-dati.md`. È una proposta: dove Mike non ha ancora deciso c'è scritto (§9).

Due regole valgono per tutto il resto:

- **Tutto quello che si legge è vero.** I movimenti sono scenografia, le parole e i numeri vengono
  dai file della corsa. Quando un dato non c'è, l'oggetto lo dice o resta spento: non si inventa.
- **La redazione guarda, non tocca.** Legge quello che la corsa lascia; non modifica la corsa,
  l'edizione, l'app. Lo stato del giorno lo prepara `redazione/stato.py` (§8), che legge e basta.

---

## 1. L'organigramma

**I nomi** (Mike, 12 novembre 2026: «diamogli dei nomi, fai tu, oltre al ruolo»): **Olivia** la
caporedattrice (la regia), **Tobia** il lettore, **Ettore** il redattore, **Ivo** il revisore, **Lea**
la visualista, **Ada** la cronista AI, **Rita** la redattrice di Games e Scienza, **Vito** il cronista
di GTA VI, **Zeno** l'archivista delle fonti. Stanno in `ROSTER` dentro `redazione/stato.py`: si
cambiano lì.

Gli agenti sono quelli che lavorano davvero ogni mattina, con il loro file in `.claude/agents/` o
il loro passo nella routine (`routine/prompt.md`). Nessuno è inventato. Durate: minuti nelle corse
dal 4 all'11 novembre (`data/corse.json`).

| Id | In redazione | Chi è davvero | Modello | Durata tipica | Cosa consegna | Dove si legge |
|---|---|---|---|---|---|---|
| `regia` | **il caporedattore**, al desk circolare | la sessione principale della routine | Sonnet | 25–40 min (è tutta la corsa) | raccolta, sezioni radar, banco, discussioni, ripescaggio; pubblica | `corse.json` (registro `principale`), `briefs/<g>.json` |
| `lettura` | **il lettore**, in fondo alla fila della prosa | sottoagente `general-purpose` «Lettura e verifica» | Sonnet | 7–18 min | gli articoli letti, notizia per notizia | `corse.json`; nell'edizione `verifica.lette`, `stats.articoli_letti` |
| `redattore` | **il redattore** | `.claude/agents/redattore.md` | Opus | 6–8 min | le notizie, gli approfondimenti, l'intro, «L'ultima parola», «Il punto» | `briefs/<g>.json` |
| `revisore` | **il revisore**, con la penna rossa | `.claude/agents/revisore.md` | Opus | nuovo: prima corsa il 12 nov, tetto 10 min | la prosa corretta, mai i fatti | `corse.json` dal 12 nov |
| `visualista` | **il visualista**, con la tavoletta | `.claude/agents/visualista.md` | Sonnet nel registro | 3–6 min | i grafici dei cinque approfondimenti; le richieste di tipi nuovi | `briefs` (`visivi`), `data/visivi/richieste.json` |
| `ai` | **il cronista AI** | `.claude/agents/ai.md` | Opus | 2–4 min | la scheda AI: cronaca e LAB | `data/ai/<g>-sezione.json` |
| `schede` | **il redattore di Games e Scienza** | `.claude/agents/schede.md` | Opus | 1–2 min | fino a dieci voci per scheda | `data/rubriche/<g>-scritte.json` |
| `gta` | **il cronista di GTA VI** | `.claude/agents/gta.md` | Opus | 2–3 min | la sezione GTA VI | `data/gta/<g>-sezione.json` |
| `fonti` | **l'archivista**, solo il lunedì | la routine settimanale `routine/fonti-settimanale.md` | — | una volta a settimana | il rapporto sulle fonti, con «Da decidere» | `docs/fonti/<lunedì>.md` |
| `ceo` | **Mike** | — | — | — | le decisioni | l'archivio della redazione (`db`) |

Le macchine non sono persone. Gli script senza modello stanno nella stanza come **oggetti che si
accendono quando il loro dato esiste**:

| Oggetto | Script | Cosa mostra | Dato |
|---|---|---|---|
| La telescrivente | `fetch.py` | il nastro con il numero degli articoli raccolti | `raw.count`, `raw.fetched_at` |
| Il quadro dei feed | `fetch.py` | una spia per feed: verde, ferma, rotta | `raw.feed_status` (92 feed) |
| La radio | `social.py`, `lab.py` | le discussioni e il LAB del giorno | `social.count`, `lab.count` |
| Il telefono | `eco.py` | quante notizie ha chiesto a Google e Bing News | `data/eco/<g>.json` |
| L'antenna sul tetto | `push.py` | si accende quando l'edizione è su Supabase | l'edizione del giorno esiste in `data/briefs/` |

## 2. La pianta

Una stanza sola, vista dall'alto in isometria, su una griglia di 12 × 9 caselle. La disposizione
segue **il percorso del lavoro**: le carte vanno da sinistra a destra lungo la fila della prosa, le
schede stanno su un'isola a parte perché lavorano in parallelo, Mike entra dal basso.

```
        nord: la parete di fondo
  ┌──────────────────────────────────────────────────────┐
  │ [sala riunioni]   [LAVAGNA menabò]  [SCHERMO GIGANTE] │  finestre a est
  │                                                       │  (l'alba alle 6)
  │  lettura → redattore → revisore → visualista          │
  │  (la fila della prosa: le carte passano di mano)      │
  │                                                       │
  │        ┌───────── anello di schermi ─────────┐        │
  │        │      DESK CIRCOLARE · la regia      │   ┌──────────┐
  │        │  telescrivente · quadro dei feed    │   │ isola    │
  │        └─────────────────────────────────────┘   │ ai       │
  │                                                  │ schede   │
  │  [archivista: schedario delle fonti]   radio     │ gta ▶VC  │
  │  piante · caffè · telefono                       └──────────┘
  │                                                       │
  │  [PANNELLO DEI POST-IT]   [tavolo del CEO · tablet]   │
  └─────────────────────── ingresso ──────────────────────┘
        sud: da qui entra Mike
```

Le scelte, una per una:

- **Il desk circolare al centro**, sotto l'anello di schermi, come nelle redazioni vere (Giornale
  di Salerno, La Stampa). Ci sta la regia. Gli schermi mostrano la raccolta: articoli, feed, testate
  lette, cosa gira fuori.
- **La fila della prosa**: quattro scrivanie in fila, nell'ordine in cui il lavoro passa di mano
  (lettura, redattore, revisore, visualista). Il passaggio delle carte da una scrivania alla
  successiva è un fatto della procedura, non un'invenzione: il redattore parte quando la lettura ha
  finito, il revisore quando il redattore ha consegnato, il visualista dopo la pubblicazione.
- **L'isola delle schede** (ai, schede, gta) sta a parte perché lavora in parallelo e non è mai
  sul percorso critico: se tarda, l'edizione esce lo stesso. Dietro gta un manifesto con il
  tramonto di Vice City e il conto alla rovescia all'uscita.
- **La lavagna e lo schermo gigante** sulla parete di fondo, visibili da tutta la stanza: è la
  stessa cosa che si vede entrando in una redazione.
- **Il pannello dei post-it accanto all'ingresso**, vicino al tavolo del CEO: sono le cose che
  aspettano Mike, ed è la prima cosa che vede quando entra.
- **La sala riunioni** in un angolo, vuota finché le riunioni (§6) non esistono davvero.
- **L'archivista** ha lo schedario delle fonti. Lavora solo il lunedì: gli altri giorni la sedia è
  vuota e sul calendario c'è il cerchio sul prossimo lunedì.

La stanza si progetta **per il Mac**: lo schermo del portatile e un monitor esterno, la stanza
intera in una schermata con il pannello dell'agente a destra (come nel video). iPhone e Duo vengono
dopo: Mike li usa per leggere l'edizione, in redazione entra dal Mac.

## 3. I colori

Ogni scrivania prende il colore della scheda **in cui finisce il suo lavoro**, così il colore dice
qualcosa (le regole di stile in `CLAUDE.md`: Apple arancione, AI rosso, Games viola, Scienza
azzurro):

- regia, lettura, redattore, revisore, visualista → **arancione**: fanno la scheda APPLE. Si
  distinguono per l'oggetto sulla scrivania (la penna rossa, la tavoletta, la pila di giornali);
- ai → **rosso**; schede → **viola e azzurro** (una lampada per scheda); gta → **il tramonto** di
  Vice City (giallo, arancio, rosa, il turchese del conto alla rovescia);
- il giallo del marchio resta al CEO e alla testata sullo schermo gigante.

**Il look** (deciso da Mike l'11 novembre sera): 3D vero come nel suo video, con volume, luce calda,
ombre leggere, legno chiaro e personaggi tondi; **non** le campiture piatte della sigla. I colori qui
sopra diventano le magliette dei personaggi, le lampade e gli accenti degli arredi.

**Il tema TMB**, curatissimo, è quello che rende la stanza nostra:

- lo schermo gigante col logo e il sole che sorge, come nella testata dell'app; la falce azzurra
  dell'orizzonte dipinta su una parete;
- i tre pallini della sigla come insegna luminosa;
- il merchandising: le tazze col marchio sulle scrivanie, le magliette nei quattro colori, un
  cappellino appeso, gli adesivi sul portatile del CEO;
- **le prime pagine incorniciate** alle pareti: quelle vere delle edizioni passate (oggetto-scena
  che porta un dato: si possono cambiare ogni settimana con le aperture più lette);
- dietro la scrivania di gta il manifesto col tramonto di Vice City.

I pannelli, i fumetti e le scritte sopra la scena restano nello stile dell'app (condensato, pallini).
Bocciato lo «stile Claude» dei cruscotti: card generiche, vetro ovunque.

## 4. Gli stati di un agente

Ogni agente è sempre in uno stato solo, ricavato dai dati (§8 dice da quali campi):

| Stato | Quando | Come si vede |
|---|---|---|
| `fuori` | prima della corsa di oggi, di notte | sedia vuota, monitor spento |
| `al lavoro` | durante la corsa (con gli orari veri di ogni agente, dal 13 novembre) e quando Mike gli sta parlando | seduto, monitor acceso, il fumetto «Guarda ▸» |
| `consegnato` | la corsa di oggi ha il suo registro, o il suo file | monitor acceso sulla consegna («12 voci AI»), i minuti che ci ha messo |
| `sostituito` | il suo file manca ma la sezione è nell'edizione: l'ha scritta qualcun altro (la regia per l'AI, Gemini per le schede) | la sedia vuota con un biglietto: «oggi ha scritto la regia» |
| `saltato` | doveva lavorare e il suo registro manca (la lettura, il visualista, il revisore) | sedia vuota, monitor spento, e il biglietto lo dice |
| `non oggi` | non tocca a lui: l'archivista se non è lunedì; o non era ancora in squadra (redattore dal 3 novembre, ai, schede e gta dal 5, revisore dal 12) | sedia vuota, calendario |
| `ti aspetta` | ha qualcosa per Mike (un post-it, §7) | in più agli altri stati, un post-it giallo sul monitor |

`sostituito` è un fatto vero e utile: dice a Mike quando un agente non ha consegnato in tempo,
cosa che oggi si scopre solo leggendo i registri.

## 5. La giornata: la redazione lavora 24 ore

**Deciso da Mike il 12 novembre 2026.** La corsa vera gira dalle 5:34 alle 6:00, mentre lui dorme:
quando entra, di giorno, non vuole trovare tutti addormentati né una replica («la differita no»).
Vuole **una redazione che lavora tutto il giorno, in modo realistico**: a ognuno si affidano compiti
e animazioni del suo mestiere. «Per ora, poi vediamo»: si prova, lui ci smanetta, e si corregge.

Come si tiene insieme con la regola «tutto quello che si legge è vero»:

- **i gesti sono messa in scena, le parole sono fatti.** Ivo che ripassa le bozze a penna rossa alle
  11 è una scena; le bozze sulla sua scrivania sono il testo vero di Ettore con le correzioni vere
  di stamattina. Sul monitor, sui fogli, nel pannello e nelle risposte c'è sempre materiale vero,
  con la sua ora («stamattina alle 5:53 ho riscritto 11 testi»);
- **nessuna scritta dice che sta succedendo adesso una cosa che è successa all'alba.** Il pannello
  dice sempre quando;
- **il lavoro vero di giorno cresce con il tempo**: quando Mike parla con un agente, quello lavora
  davvero in quel momento (la conversazione); poi gli script ogni due ore (strato 2 del brief) e le
  riunioni (§6). Ogni pezzo vero che si aggiunge prende il posto di un pezzo di scena.

**L'orario di ciascuno** (attività realistiche del mestiere, legate al materiale vero del giorno; le
piccole variazioni partono da un seme, data più ora più agente, così la scena è la stessa a ogni
apertura nello stesso minuto):

| Ora | Cosa succede in redazione |
|---|---|
| 5:15–5:34 | arrivano, uno alla volta; le luci si accendono, la macchina del caffè lavora |
| 5:34–6:00 | **la corsa**: è l'ora di punta, tutti alla scrivania. Dal 13 novembre, con gli orari veri di ogni agente (`corse.json`: `inizio`, `fine`, `passi`), ognuno lavora nei suoi minuti veri |
| 6:00 | l'edizione è in onda: la spia si accende, lo schermo gigante mostra la prima pagina |
| mattina | **Olivia** fa il giro delle scrivanie e torna al desk, sul monitor l'edizione uscita. **Tobia** tiene d'occhio la telescrivente e impila i giornali. **Ettore** rilegge i suoi pezzi stampati. **Ivo** ripassa le bozze con la penna rossa. **Lea** disegna alla tavoletta e ogni tanto va alla lavagna delle richieste. **Ada**, **Rita** e **Vito** seguono i loro schermi (il fronte dei modelli, le uscite dei giochi, il conto alla rovescia di GTA VI) |
| a ogni ora | qualcuno si alza: caffè, due parole alla macchinetta (senza fumetti), una pianta da annaffiare |
| 13:00 | pausa pranzo, a turni: metà scrivanie vuote, mai tutte |
| pomeriggio | come la mattina, con ritmo più lento; **Zeno**, se è lunedì, è allo schedario delle fonti |
| 21:00 | Olivia alla lavagna, con chi resta: il menabò di domani (scena finché la riunione serale non esiste davvero, §6) |
| 22:00–5:15 | luci basse, restano accese le lampade e i monitor; alla scrivania solo il turno di notte (uno a rotazione) |

**Quando Mike entra**, chi ha qualcosa per lui alza la mano (i post-it, §7), e la frase di benvenuto
in cima dice chi lo aspetta e com'è andata la corsa.

Nota sull'ora: la routine parte oggi alle **5:34** italiane (`inizio` 04:34 UTC), perché a fine
ottobre il suo orario non è stato spostato all'ora solare. La redazione usa l'ora vera di
`corse.json`, non le 6:30 scritte in `CLAUDE.md`.

## 6. Le riunioni (più avanti)

Si costruiscono solo quando esistono davvero; fino ad allora la sala è vuota.

- **9:30, la riunione del mattino**: sui segnali di lettura dell'edizione di oggi (`taste.py`).
  Serve uno script che li scarichi a metà mattina; costa token solo se un agente ne scrive il
  verbale.
- **21:00, la riunione serale**: prepara il menabò provvisorio per la corsa del giorno dopo. È
  l'unica che fa guadagnare tempo alla corsa, ma vuol dire una raccolta serale e una scelta: va
  progettata con Mike, perché tocca la corsa.

Nessun verbale inventato: se la riunione non ha niente da dire, il verbale è corto.

## 7. I post-it

Sono le cose che aspettano una decisione di Mike. Ognuno ha chi lo manda, cosa dice e **da quanti
giorni aspetta** («ti aspetta da 5 giorni» è la riga che Mike ha amato nel video).

| Da chi | Cosa | Da dove | Oggi |
|---|---|---|---|
| visualista | le richieste di tipi nuovi | `data/visivi/richieste.json` (stato `aperta`) | 70, la più vecchia del 2 ottobre: **un mazzo**, non 70 post-it. In cima le tre più recenti |
| archivista | le decisioni sulle fonti | `docs/fonti/<ultimo lunedì>.md`, sezione «Da decidere», un post-it per punto | 3 dal 9 novembre |
| il gusto | il briefing ogni 14 giorni | `data/taste.json` (`last_report`) | scaduto: l'ultimo è del 14 settembre |
| revisore | le domande sulla prosa | da definire quando il revisore lavora | — |

Un post-it si stacca quando Mike risponde: la risposta va nell'archivio delle decisioni (§8) e il
post-it passa nello stato «risposto». **Non si stacca da solo** se il file sorgente non cambia: è
la corsa (o una sessione di lavoro) che chiude la richiesta nel suo file.

## 8. I dati: lo stato del giorno e le decisioni

**`redazione/stato.py`** legge i file della corsa e scrive un JSON solo per giorno,
`redazione/stato/<g>.json`, che contiene tutto quello che la stanza mostra. Non scrive niente
altrove. Si lancia così:

```bash
python3 redazione/stato.py                 # oggi (o l'ultimo giorno con un'edizione)
python3 redazione/stato.py 2026-11-11      # un giorno preciso
python3 redazione/stato.py --tutti         # tutti i giorni con un registro della corsa
```

Lo schema, in breve (l'esempio vero è `redazione/stato/2026-11-11.json`):

```json
{
  "giorno": "2026-11-11",
  "corsa": {"inizio": "…", "fine": "…", "minuti": 26, "tetto": 45, "token_milioni": 27.9,
            "fasi": [{"cosa": "raccolta", "ora": "…"}], "ultime": [{"giorno": "…", "minuti": 27}]},
  "agenti": [{"id": "ai", "nome": "Il cronista AI", "modello": "Opus", "minuti": 4,
              "stato": "consegnato", "consegna": "12 voci: 7 di cronaca, 4 LAB",
              "dettagli": ["titolo…"], "colore": "ai", "chi": "il primo paragrafo del suo file"}],
  "macchine": {"telescrivente": {"articoli": 1119}, "feed": {"totale": 92, "rotti": […]}, …},
  "lavagna": [{"rank": 1, "titolo": "…", "reparto": "…", "tag": "…", "origine": "…",
               "testate": 47, "approfondita": true, "visivo": "barre"}],
  "schermo": {"top3": […], "intro": "…", "punto": "…", "prossimo": {"titolo": "…", "data": "…"}},
  "postit": [{"da": "visualista", "titolo": "…", "testo": "…", "dal": "2026-10-02",
              "giorni": 40, "mazzo": 70}]
}
```

**Come arriva alla pagina**: è il nodo aperto di `mappa-dati.md`, §1. Il JSON è pensato perché
qualunque strada vinca (Claude che lo scrive nell'archivio della pagina, la pagina ripubblicata
con il JSON dentro, o una pagina su GitHub Pages) lo usi così com'è.

**Le decisioni** stanno nell'archivio della pagina (`db`), una collezione `decisioni`:

```json
{"agente": "visualista", "tipo": "incarico", "testo": "…", "stato": "aperta",
 "quando": "2026-11-12T09:14:00Z", "postit": "visivi-2026-11-10-…"}
```

`tipo` dice dove va la decisione:

- `preferenza` — un gusto di Mike («meno rumor in apertura»). Entra nella voce dell'agente nelle
  conversazioni successive. Arriva alla corsa solo quando Mike decide che la corsa le legga.
- `incarico` — un lavoro per una sessione di sviluppo («un tipo di grafico per le mappe»). Una
  sessione sul Mac le legge con `ArtifactData` e le fa.
- `regola` — una cosa che la corsa deve fare diversamente. Finché la corsa non legge la redazione,
  la trasforma in regola una sessione di lavoro, scrivendola nel file dell'agente.

`stato`: `aperta` · `presa in carico` · `fatta`, e lo aggiorna chi la fa.

## 9. Come si comporta un agente: come una persona vera

**Deciso da Mike il 12 novembre 2026**, partendo dal revisore: «mi immagino che sulla scrivania del
revisore ci sia stampato il testo del redattore, così quando gli parlo lui mi fa vedere le differenze
che ha apportato la mattina, o su cosa sta lavorando, i dubbi che ha, i suggerimenti. Come una
persona vera. Questo vorrei valesse per tutti i ruoli come comportamento, di base».

Quindi ogni agente, di base:

1. **ha il suo lavoro sulla scrivania**, visibile: un oggetto che è il suo materiale vero;
2. **quando Mike gli parla, glielo mostra**: cosa ha fatto stamattina, con le differenze e i numeri;
3. **dice su cosa sta lavorando**, i **dubbi** che ha e i **suggerimenti**, ragionando in quel momento
   sul suo materiale vero (è lavoro vero: lo fa il modello mentre risponde). Un dubbio nasce da un
   dato (una notizia con una testata sola, una correzione che si ripete, una richiesta ferma da
   quaranta giorni), mai dal niente.

| Chi | Sulla scrivania | Cosa mostra quando gli parli | Da dove |
|---|---|---|---|
| Olivia, caporedattrice | il menabò e la scaletta della corsa | com'è andata la corsa, chi ha tardato, cosa è rimasto fuori | `stato.corsa`, `lavagna`, `macchine` |
| Tobia, lettore | la pila dei giornali letti | quante testate ha letto per ogni notizia, dove ne ha trovata una sola | `verifica` nell'edizione |
| Ettore, redattore | i suoi pezzi stampati | le notizie e gli approfondimenti di oggi, «Il punto», cosa gli ha corretto Ivo | l'edizione, `stato.revisione` |
| Ivo, revisore | **il testo di Ettore con le correzioni a penna rossa** | il prima e il dopo di ogni testo riscritto, le correzioni che si ripetono | `data/revisione/<g>.json` |
| Lea, visualista | la tavoletta, e la lavagna delle richieste | i grafici di oggi, le notizie rimaste senza, i tipi che le mancano | `visivi` nell'edizione, `data/visivi/richieste.json` |
| Ada, cronista AI | il tabellone dei modelli | le voci di oggi, cronaca e LAB | `data/ai/<g>-sezione.json` |
| Rita, Games e Scienza | le due pile, viola e azzurra | le voci scelte e quelle scartate | `data/rubriche/<g>-scritte.json` |
| Vito, GTA VI | il manifesto col conto alla rovescia | cosa gira in rete oggi, quanto manca all'uscita | `data/gta/<g>-sezione.json` |
| Zeno, archivista | lo schedario delle fonti | il rapporto del lunedì, le decisioni che aspettano | `docs/fonti/` |

**Il prima e il dopo di Ivo** esiste dal 12 novembre: `pipeline/revisione.py` lo archivia in
`data/revisione/<giorno>.json` (quello del 12, il suo debutto, è ricostruito dai commit della corsa:
11 testi riscritti). `redazione/stato.py` lo porta nello stato del giorno, campo `revisione`.

## 10. La conversazione con un agente

La pagina chiede a Claude con l'account di Mike (`sample`). Claude non ha memoria tra un messaggio e
l'altro, quindi a ogni messaggio la pagina gli manda, in quest'ordine:

1. **chi è**: il primo paragrafo del suo file in `.claude/agents/` (lo stato del giorno lo porta
   già, campo `chi`), più il suo ruolo in redazione;
2. **cosa ha fatto oggi**: la sua riga di `agenti` (minuti, consegna, dettagli) e, se serve, la
   lavagna;
3. **cosa ha deciso Mike con lui**: le ultime decisioni della collezione con il suo `agente`;
4. **come rispondere**: in italiano semplice, poche frasi, solo i fatti che ha davanti («non lo so»
   è una risposta); non modifica niente, ma può **proporre una decisione** con il suo tipo, che
   Mike salva con un tocco;
5. **la conversazione** fin lì.

Cosa può fare un agente nella conversazione, e cosa no:

- può spiegare il suo lavoro di oggi, con i numeri veri; può dire cosa gli serve (il visualista:
  «mi mancano le mappe»); può proporre una decisione;
- non può cambiare l'edizione, il codice, la corsa; non può promettere che domani sarà diverso,
  finché la corsa non legge le decisioni.

## 11. Deciso con Mike, e ancora da chiedere

**Deciso il 12 novembre 2026:**

- **Mike è il direttore creativo**: dà le indicazioni su come deve funzionare e apparire la
  redazione. Tutta la parte tecnica (dove salvare, git, come costruire) la decide chi costruisce,
  senza chiedergli.
- gli agenti hanno **un nome oltre al ruolo** (§1);
- **niente differita**: la redazione lavora 24 ore, in modo realistico (§5);
- ogni agente si comporta **come una persona vera** (§9);
- la pagina di prova **funziona sul Mac** (gli agenti rispondono, le decisioni restano): la
  conversazione col CEO può vivere su claude.ai;
- la corsa salva il testo prima della revisione e gli orari di ogni agente (due modifiche piccole,
  fatte il 12 novembre sera).

**Ancora da chiedere, quando servirà:**

1. **Con quale modello parlano**: le conversazioni consumano i limiti del suo abbonamento. Opus per
   tutti, oppure il livello normale e Opus solo per Ettore e Ivo?
2. **Dove si entra**: dal Mac, un segnalibro nel browser, l'app desktop di Claude (dove la pagina
   può anche parlare e ascoltare), o un link dal menu dell'app.
