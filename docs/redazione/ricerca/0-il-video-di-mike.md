# Il video che Mike ha mandato (11 novembre 2026, sera)

Un TikTok verticale di 88 secondi (@joseph_oddoo, etichettato «AI-generated»): «Ho creato un team di
11 editor AI». Una pagina locale (`127.0.0.1:5200`), un'app che si chiama **Regia**, per una squadra
di agenti che monta video e gestisce i social. Mike: «il funzionamento a cui voglio aspirare». Visto
estraendo 16 fotogrammi; il video non è nel repository.

## Cosa si vede, pezzo per pezzo

1. **La frase di benvenuto, in cima.** «Buonasera, Joseph» e sotto una frase sola che riassume la
   stanza: «Aurora, Giuseppe e altri 4 **ti aspettano**. Sofia **ti ha fatto una domanda**.
   Giammarco, Paolo e Spot 3D **stanno lavorando**, 9 sono liberi.» I nomi sono colorati e
   cliccabili. È la cosa più utile del video: prima di guardare la stanza sai già cosa fare.
2. **Quattro schede**: **Sala** (con il numero di cose in attesa), **Calendario**, **Risultati**,
   **DM**. A destra un pulsante «Nuovo lavoro».
3. **La sala**: isometrica, pavimento chiaro, scrivanie di legno, monitor neri, personaggi tondi con
   la maglia arancione. Sopra le teste un'etichetta col nome e lo stato, e il pulsante «Guarda ▸»
   quando c'è qualcosa da vedere. Una lavagna con i post-it in alto a sinistra, schermi a parete,
   piante, linee colorate sul pavimento come percorsi.
4. **Il «cervello condiviso»**: un ologramma azzurro su un piedistallo al centro della stanza, una
   rete di punti. È la memoria comune della squadra.
5. **Tocchi un agente**: la camera si avvicina alla sua scrivania e a destra si apre il pannello.
   Avatar, nome, ruolo, l'ultimo messaggio che ti ha scritto («Andrea ti ha scritto: …»), la
   casella per rispondere con «Manda», e sotto «Cosa fa Andrea», le sue mansioni.
6. **Il vassoio in basso, «da guardare»**: le consegne in attesa, come schede con la miniatura del
   video e due pulsanti, «Guarda il video» e «Rispondi».
7. **La revisione per versioni**: dentro una consegna, «Round 1 vs Round 2», le due versioni
   affiancate, e un pulsante verde «È pronto ✓» per approvare.
8. **Calendario, «Cosa esce»**: la settimana con le uscite programmate.
9. **Risultati, «Cosa ha funzionato»**: tre numeri grandi («I numeri che contano») e l'elenco dei
   contenuti con le loro metriche. Il lavoro torna indietro come risultato.
10. **DM, «Automazioni»**: una griglia di parole chiave con i loro conteggi.

## Cosa diventa da noi (tutto da dati veri)

| Nel video | Da noi | Dato |
|---|---|---|
| «Buonasera, Joseph» e la frase sola | «Buongiorno Mike. Il visualista e l'archivista ti aspettano. La corsa è finita alle 6:00, in 26 minuti; oggi nessuno è assente.» | `redazione/stato.py`: stati e post-it |
| Sala / Calendario / Risultati / DM | **Sala** · **Calendario** (i lanci in `prossimo`, l'uscita di GTA VI, il lunedì delle fonti, i collaudi delle fonti in prova) · **Risultati** (cosa hai letto davvero: i segnali di lettura) · **Messaggi** (le conversazioni e le decisioni) | `briefs.prossimo`, `gta.uscita`, `docs/fonti`, `data/taste.json` (`votes`) |
| Il vassoio «da guardare» | le consegne di stamattina: l'edizione, i cinque approfondimenti con il loro grafico, la scheda AI, GTA VI; «Guarda» apre l'app sulla notizia | `stato.lavagna`, `stato.agenti[].dettagli` |
| Round 1 vs Round 2 | **il redattore contro il revisore**: il testo prima e dopo la seconda mano, affiancati. È il confronto più vero che abbiamo | oggi la foto di `revisione.py` sta in `/tmp/corsa` e sparisce: va salvata (modifica alla corsa, da decidere con Mike) |
| Il cervello condiviso | **le regole della casa**: `CLAUDE.md`, le linee editoriali, la memoria. Quante regole, l'ultima aggiunta e quando | `git log` di quei file |
| «Cosa fa Andrea» | il ruolo, le mansioni e i limiti del suo file in `.claude/agents/` | `stato.agenti[].chi` |
| «Nuovo lavoro» | un incarico per una sessione di sviluppo (una decisione di tipo `incarico`) | l'archivio delle decisioni |

Due cose del video **non** si prendono: i personaggi in 3D realistico con le maglie uguali (lo stile
resta la sigla di TMB, piatto) e l'idea che gli agenti lavorino tutto il giorno: da noi lavorano alle
6 del mattino, e il resto del giorno la stanza mostra quello che hanno fatto.
