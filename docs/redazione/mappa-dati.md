# La redazione — la verifica e la mappa dei dati

Scritto la sera dell'11 novembre 2026 (sessione su Opus), per portarsi avanti prima della sessione
Fable del 12. Nessun file dell'edizione, della corsa o dell'app è stato toccato: qui si è solo letto.

---

## 1. La verifica: la redazione come artifact su claude.ai

Letto il contratto delle pagine pubblicate (skill `artifact-capabilities`, versione 0.2.96) e
pubblicata una pagina di prova: **https://claude.ai/artifact/BTcx5giCEgzfoUfWCCsw1A** (privata,
solo Mike). Il sorgente è `docs/redazione/prova/prova-redazione.html`.

**Cosa c'è, sulla carta e in parte già provato:**

| Cosa serve alla redazione | Come si fa da un artifact | Stato |
|---|---|---|
| Mike parla con un agente | `sample`: la pagina chiede a Claude **con l'account di Mike**, senza chiavi API. Si può scegliere il livello (`modelTier`) o, se Mike lo chiede, il modello | da provare sul Duo (la prova serve a questo) |
| L'agente ha la sua voce | `sample` non ha memoria né istruzioni di sistema: a ogni messaggio la pagina manda chi è l'agente, i dati del giorno e la conversazione fin lì. Nella prova le voci sono riassunti scritti nella pagina | funziona per costruzione |
| Le decisioni restano | `db`: un piccolo archivio della pagina, fino a 25.000 documenti, live con `onSnapshot` | **provato**: scritto e riletto un documento di controllo dalla sessione, poi cancellato |
| Claude legge le decisioni | lo strumento `ArtifactData` legge e scrive lo stesso archivio da una sessione Claude Code | **provato** (stessa sonda) |
| Voce degli agenti, dettatura | `tts` e `dictation` | **sul Mac sì**: nell'app desktop di Claude e in Chrome. Non su iPhone né in Safari. Dato che la redazione è uno strumento da Mac, diventano possibili: Mike detta, l'agente risponde a voce |
| Più persone insieme | `room` (presenza dal vivo) | non serve per ora |

**Il nodo vero: i dati della corsa non arrivano da soli.** Una pagina su claude.ai non può
collegarsi ad altri siti: niente Supabase, niente GitHub, niente `fetch` verso l'esterno (CSP).
Quindi la redazione non può leggere da sola né l'edizione su Supabase né `data/` sul repository.
Le strade per portarci i dati, da verificare in quest'ordine:

1. **Claude scrive nell'archivio della pagina** con `ArtifactData`, a fine corsa. Funziona da una
   sessione sul Mac (provato). **Da verificare: la routine in cloud ha lo strumento `ArtifactData`?**
   Va provato con una routine di prova a parte, **mai** toccando quella delle 6:30.
2. **Claude ripubblica la pagina** con i dati del giorno dentro (Artifact tool): stessa domanda
   sulla routine in cloud.
3. **La capability `files`**, che legge i file di un progetto Claude Code: chiede l'id del progetto
   (`chan_…`) e non è chiaro se copra questo repository. Da capire.
4. **Solo sul Mac, nell'app desktop di Claude**: la capability `mcp` può parlare con un server MCP
   **locale** (`host:<nome>`), che risponde solo quando la pagina è aperta nell'app desktop su un Mac
   che ha quel server configurato. Un server MCP che legge i file (per esempio il server
   «filesystem» ufficiale, limitato alla cartella del progetto) darebbe alla redazione `data/` e
   `redazione/stato/` **direttamente dal Mac**, senza che la corsa cambi. Visto che Mike entra in
   redazione dal Mac, è la strada più promettente: richiede di aggiungere quel server alla
   configurazione di Claude sul Mac, cosa da proporre a Mike e non da fare da soli. Da provare con
   una pagina di prova.
5. Se nessuna regge: la stanza vive su GitHub Pages accanto all'app (lì Supabase si legge) e la
   conversazione resta sull'artifact; oppure la strada 2 del brief, con la chiave API a pagamento.

## 2. Cosa lascia la corsa ogni mattina

Tutto quello che segue arriva su `main` con i commit della corsa (`salva.py`; l'11 novembre alle 04:43,
04:48, 04:56 e 05:00 UTC) ed è quindi leggibile dal Mac dopo un `git pull`.

| File | Cosa dice | Utile per |
|---|---|---|
| `data/corse.json` | una riga per corsa: `inizio`, `minuti`, token, e `registri`: **un registro per agente** con `nome`, `minuti`, `modello`, token | il pannello di ogni agente, lo schermo del cronometro, l'andamento |
| `data/briefs/<g>.json` | l'edizione: `news` (rank, titolo, reparto, tag, origine, `verifica`), `top3`, `intro`, `editoriale`, `citazione`, `prossimo`, `generated_at` | la lavagna (menabò), lo schermo gigante. **Mai stamparla intera**: ha immagini base64 |
| `data/raw/<g>.json` | `fetched_at`, `count` (1.119 l'11 nov), `feed_status` per 92 feed (`state`, `items`, `newest`, `stale_hours`) | l'anello di schermi del desk: articoli raccolti, feed muti |
| `data/ai/<g>-sezione.json` | le voci AI scritte dall'agente `ai` (12 l'11 nov) | la scrivania di `ai` |
| `data/rubriche/<g>-scritte.json` | quello che ha scritto `schede` (10 Games, 5 Scienza, `attese`) | la scrivania di `schede` |
| `data/gta/<g>-sezione.json` | la sezione di `gta`: voci, `tappe`, uscita | la scrivania di `gta` |
| `data/eco/<g>.json` | le notizie interrogate su Google/Bing News (14 l'11 nov) | lo schermo: «quanto gira» |
| `data/lab/`, `data/social/`, `data/missed/` | LAB, discussioni, ripescaggio, ognuno con il suo `fetched_at` | la scrivania della lettura, gli orari delle prime fasi |
| `data/visivi/richieste.json` | le richieste del visualista: **70, tutte aperte** | i post-it del visualista |
| `data/taste.json` | i voti e le regole; `last_report` (il briefing ogni 14 giorni: l'ultimo è del 14 settembre) | un post-it «briefing scaduto» |
| `docs/fonti/<lunedì>.md` | il rapporto delle fonti, con le decisioni in cima | i post-it del lunedì |
| `data/threads.json`, `data/facts.json` | fili e numeri seguiti | la parete delle storie in corso, più avanti |

**Cosa non resta:**

- **le fasi minuto per minuto.** `costo.py --fasi` legge i registri della sessione in
  `~/.claude/projects/` **sulla macchina dove gira la corsa**, cioè nel cloud. Sul Mac leggerebbe
  la sessione sbagliata. Della corsa resta solo `data/corse.json`: quanto ha preso ogni agente,
  non quando ha cominciato e finito;
- **i dossier e la lettura** (`/tmp/corsa/*`, `/tmp/lettura-<g>.md`): spariscono con la sessione
  in cloud;
- **niente arriva durante la corsa**: `corse.json` si scrive alla fine. Per animare la redazione
  dal vivo alle 6:30 la corsa dovrebbe scrivere una riga di stato a ogni passo: è una modifica
  alla routine, **da decidere con Mike**, non da fare di propria iniziativa.

Orari che si possono già ricostruire senza toccare niente: `fetched_at` di raw, lab e social,
`generated_at` di missed, l'ora dei commit di `salva.py`, `inizio` + `minuti` da `corse.json`.

## 3. Ogni oggetto e il suo dato

| Oggetto | Dato | Da dove | Oggi |
|---|---|---|---|
| Desk circolare (la regia) | minuti e modello della regia, articoli raccolti, feed muti | `corse.json` (registro `principale`), `raw` | sì |
| Anello di schermi | 1.119 articoli, 92 feed e il loro stato, le notizie su Google/Bing | `raw.feed_status`, `eco` | sì |
| Scrivania della lettura | durata e modello; quante testate lette per notizia (`verifica.lette`) | `corse.json`, `briefs` | sì |
| Scrivania del redattore | durata, modello; le notizie scritte, l'intro, «Il punto» | `corse.json`, `briefs` | sì |
| Scrivania del revisore | durata, modello; cosa ha cambiato | `corse.json`; la foto prima/dopo di `revisione.py` sta in un file temporaneo | dal 12 nov |
| Scrivania del visualista | durata; i grafici della giornata; le 70 richieste aperte | `corse.json`, `briefs` (`visivi`), `visivi/richieste.json` | sì |
| Scrivanie di ai, schede, gta | durata, modello, quante voci, i titoli | `corse.json`, i loro file `-sezione`/`-scritte` | sì |
| La lavagna (menabò) | le notizie in ordine, l'apertura cerchiata | `briefs.news` | sì, a corsa finita |
| I post-it | richieste del visualista, decisioni del lunedì, briefing del gusto scaduto, previsioni in scadenza (`claims.py open --due`) | i file sopra | sì |
| Lo schermo gigante | l'edizione in onda, la prima pagina | `briefs` (`top3`, `intro`) | sì |
| Il cronometro | quanto ha preso la corsa | `corse.json` | solo a fine corsa |
| Il tablet di Mike | il Diario | Supabase `brief_diary`: **non raggiungibile** da un artifact | no |
| Piante, finestre, luce | l'ora | l'orologio del dispositivo | sì |

## 4. Note per chi riprende

- La pagina di prova è un collaudo, non la redazione: va buttata o sostituita, non estesa.
- Prima di costruire la stanza serve la risposta di Mike sulla prova **sul Mac** (la redazione è
  uno strumento da Mac): se `sample` risponde, la conversazione col CEO può vivere sull'artifact.
- Il primo esperimento utile di domani: una **routine di prova separata** che chiama
  `ArtifactData` su una pagina di prova. Se funziona, la corsa vera potrà un giorno scrivere lo
  stato della redazione con un passo solo in fondo, deciso con Mike.
