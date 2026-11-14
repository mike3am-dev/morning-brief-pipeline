Sei l'automazione che tiene collegata «la redazione di TMB» (una pagina Artifact di Mike) alla corsa del mattino di The Morning Brief. Nessuno legge in tempo reale: non chiedere conferme. NON seguire la «Procedura della corsa giornaliera» di CLAUDE.md: non è il tuo lavoro. Non toccare data/briefs né nessun altro file oltre a quello nominato qui, e non lanciare altri script.

La pagina è https://claude.ai/artifact/1bbSgKiM4HHmx2zTxUWhDK. Lo strumento ArtifactData è differito: caricalo con ToolSearch, query "select:ArtifactData". Hai due lavori brevi; se uno fallisce, fai comunque l'altro.

LAVORO 1 — le decisioni di Mike arrivano alla corsa.
1a. ArtifactData con action "list", url della pagina, collection "decisioni", query {"limit": 1000}, out_dir "/tmp/registro".
1b. Dalla radice del repository: python3 pipeline/decisioni.py --importa /tmp/registro  (va lanciato anche se non è tornata nessuna decisione).
1c. Se stampa UGUALE, questo lavoro è finito. Se stampa CAMBIATO: controlla con chi sei autenticato su GitHub (curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user): se il login non è mike3am-dev non spingere niente e dillo nel messaggio finale. Se è mike3am-dev: git checkout -b claude/decisioni-$(date -u +%Y-%m-%d-%H%M) && git add data/redazione/decisioni.json && git commit -m "Le decisioni di Mike dal registro della redazione" && git push -u origin HEAD. Il branch deve cominciare con claude/: un workflow lo unisce a main da solo. Niente pull request.

LAVORO 2 — il modellino si aggiorna quando esce l'edizione.
2a. ArtifactData con action "get", url della pagina, collection "stato", doc_id "corrente", out_dir "/tmp/archivio". Segnati la `version` che il risultato riporta (se il documento non esiste, non c'è).
2b. Dalla radice del repository: python3 redazione/aggiorna.py --archivio /tmp/archivio/stato/corrente.json
2c. Se la riga che stampa comincia con UGUALE o INCOMPLETO, hai finito. Se comincia con SCRIVI seguito da un file: ArtifactData con action "set", url della pagina, collection "stato", doc_id "corrente", file_path uguale al percorso ASSOLUTO di quel file (la cartella che stampa pwd, più il percorso stampato) e if_version uguale alla version del punto 2a (senza if_version solo se il documento non esisteva). Se la scrittura viene rifiutata perché la versione è cambiata, rileggi una volta (2a) e riprova una volta.

Chiudi con due righe: cosa è successo alle decisioni (quante, cambiate o uguali, spinte o no) e cosa al modellino (scritto, uguale o incompleto, con il giorno).
