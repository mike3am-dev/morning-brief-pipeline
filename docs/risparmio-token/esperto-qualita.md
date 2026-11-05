# Qualità contro risparmio: parere del garante

`costo.py` legge anche i registri dei sottoagenti (righe 59-61): la misura prima e dopo si fa con lui, sommando tutto.

## 1. Dove sta la qualità, dove sta l'overhead

**Non si toccano:** la scelta delle notizie (cosa entra, il rank, doppione o seguito), la lettura (31 articoli, 48 KB), la prosa di Opus, `verify` con la decisione presa dopo (il 3 nov un declassamento a RUMOR), il lint finale.

**Overhead puro**, a stima il 55-65% dei 41 M token: attesa attiva (~15 passi), Pillow reinstallato (~6), lint ×6 (ne bastano 2), due dump JSON da 43-58 KB, il grezzo letto un titolo alla volta, metà di CLAUDE.md (storia, Duo, Magazine: ~14 k token a passo, ≈3 M), il redattore che rilancia script già girati.

**Sezioni ai/banco/social/radar/recap affidate a un sottoagente.** Non si perde niente: la principale oggi le scrive prima che la lettura finisca, quindi non ha in contesto niente che un sottoagente non possa ricevere. La memoria AI già oggi non passa: 0 voci AI con `thread` sia il 2 sia il 3 nov. Il sottoagente però deve ricevere in un file:
- le uscite di `lab`, `social`, `missed`, `taste` (le caselle del radar) e `recall`;
- i link delle rubriche e i titoli candidati alle notizie;
- un estratto di ~5 k token con le regole delle sue sezioni.

Scrive su un file suo, e la fusione la fa uno script: mai sullo stesso JSON del redattore (il guasto del 7 ottobre).

**CLAUDE.md in estratto.** Si perdono i «perché» dei casi limite: «STESSO LINK» spesso è un falso positivo, l'`origine` la decide la corsa e non `verify`, le riprese non sono conferme. Vanno riscritti come regole, non tagliati.

**Cosa deve restare alla principale** (~6-8 k token):
- l'ordine dei passi: visualista dopo `push`, niente audio, mai due scrittori sullo stesso file;
- niente base64 a schermo;
- la tabella dell'affidabilità, i tag e il perimetro, per decidere dopo `verify`;
- errore contro avviso nel lint, e come si corregge senza inventare;
- `accenti`, `borsa`, `prossimo` portato avanti da ieri;
- `push`, `prune_auto`, branch `claude/`, identità `mike3am-dev`, messaggio di chiusura.

## 2. Rischi nascosti

1. **L'estratto che invecchia (il rischio più grande).** Mike aggiunge regole quasi ogni giorno (accenti, `origine`, titolo del `prossimo`: tutte il 2 nov). Rimedio: estratto generato da marcatori in CLAUDE.md, con un'impronta che fa fallire la corsa se CLAUDE.md è cambiato e l'estratto no.
2. **Regole che il lint non vede:** doppione o seguito, «mai riempire», una voce AI che doveva stare fra le notizie, la forma del LAB («prima persona, verbo fatto»), citazioni tradotte, link di `approfondire` mai aperti, «≥3 testate lette». Tagliare il contesto di chi decide queste cose peggiora l'edizione senza che nessun controllo lo segnali.
3. **Uscite troncate** (`head`, `--quiet`) su `verify`, `recall`, `missed`: nascondono avvisi e coppie di doppioni. Si riassumono in un file completo.
4. **Redattore senza `recall`**: va bene solo se riceve il risultato in un file.
5. **Radar**: è controllato solo per tema e per link. Senza vedere le rubriche può doppiarle con un link diverso.
6. **LAB senza foto** se `images.py` fallisce: oggi è un avviso, nel collaudo va trattato come errore.

## 3. Protocollo di verifica

**Base** (il 3 nov è il pavimento):

| Misura | 2 nov | 3 nov |
|---|---|---|
| notizie | 13 | 15 |
| testate lette, prime 5 | 2,1,1,1,1 | 4,3,5,2,3 |
| dalla 6ª, ≥2 lette quando c'erano | — | 2/7 |
| `origine` e `reparto` | 13/13 | 15/15 |
| notizie con filo | 7/13 | 9/15 |
| voci medie per approfondimento | 1 | 3 |
| `visivi` | 4/5 | 2/5 |
| AI (voci / LAB / LAB con foto) | 10 / 4 / 3 | 9 / 3 / 3 |
| banco / social / radar / recap | 3/3/1/2 | 3/3/2/2 |

`citazione`, `editoriale`, `prossimo` e `borsa` ci sono in tutte e due.

**Ogni giorno, con uno script** (`pipeline/qualita.py`, da scrivere; di image e audio registra solo la presenza):

*Soglie dure*:
- lint con 0 errori, 15-20 notizie;
- prime cinque con ≥3 testate lette;
- `origine`, `reparto` e `claim` sui RUMOR al 100%;
- 5 approfondimenti, ciascuno con `sotto` e ≥2 voci;
- AI fra 6 e 12 voci, LAB ≥1/3, LAB con foto e `prova` al 100%;
- radar senza temi `axis` e senza link già in AI o rubriche;
- recap ≤2 con `ref` valido;
- 0 link già usciti;
- `citazione` presente, `editoriale` con ≥2 notizie, `prossimo` almeno con le voci di ieri ancora future.

*Misure morbide*, in media mobile, mai sotto l'80% della base: testate lette dalla 6ª in giù, voci per approfondimento, notizie con filo, avvisi del lint (non sopra la base), lunghezza media della descrizione (~750 caratteri il 3 nov).

*Memoria*: per ogni coppia di `recall --raw`, la voce di oggi o manca o porta lo stesso `thread`.

**Prova una tantum:**
- Si rifà la corsa del 3 nov sullo stesso grezzo, in un branch, scrivendo in `data/briefs-prova/` e senza `push`. Costa circa l'8% della settimana.
- Si confronta notizia per notizia: stesse scelte, rank entro ±2, stessi doppioni scartati, stesse testate lette.
- Poi un giudizio cieco su 3 approfondimenti, sulla sezione AI e sul radar.

**Dopo due settimane:** la quota di notizie aperte in `taste.py` (circa una su tre) non deve scendere.

**Ritorno indietro:**
- Prima del cambio, il tag `corsa-pre-risparmio`. Il prompt della routine si versiona nel repo, e CLAUDE.md intero non si cancella mai.
- Una soglia dura mancata: si corregge e si ripubblica in giornata.
- Due giorni di fila sotto l'80% su una misura morbida, oppure una regola persa che il lint non vede: `git revert` e prompt di prima. Poi si reintroduce un pezzo al giorno, per isolare quello che ha fatto il danno.
