# La redazione di TMB — diario dei lavori

Cosa è stato costruito, giorno per giorno, e quello che serve sapere per riprendere. Le decisioni
di Mike stanno in `progetto.md`; qui c'è il lavoro.

## 12 novembre 2026 — la prima sera

**La pagina**: `redazione/app/redazione.html`, pubblicata come artifact privato:
https://claude.ai/artifact/1bbSgKiM4HHmx2zTxUWhDK (stesso indirizzo a ogni ripubblicazione dello
stesso file: è l'indirizzo che Mike apre dal Mac).

**Cosa c'è (prova di look, primo angolo)**: un angolo della stanza in 3D con il look del video di
Mike e il tema TMB.

- Ettore, il redattore, alla scrivania: scrive a raffiche, ogni tanto si gira. Sul monitor il titolo
  d'apertura vero.
- Ivo, il revisore, in piedi con le bozze corrette a penna rossa: legge, poi alza gli occhi. Sul suo
  monitor un prima e dopo vero.
- Lo schermo gigante col marchio ricalcato dalla testata dell'app (THE / M-sole-RNING / BRIEF, la
  falce azzurra), la data, «in onda dalle 05:56» e il sottopancia con l'apertura; la spia IN ONDA.
- Il menabò di oggi sulla lavagna, con l'apertura cerchiata a pennarello, e i post-it.
- Il merchandising: le quattro tazze col sole, il cappellino, le edizioni stampate, la macchina del
  caffè, la lampada gialla, il tappeto tondo giallo (il sole), due prime pagine vere incorniciate.
- L'orologio a muro segna l'ora vera. Quattro luci da provare: alba, giorno, sera, notte.
- Tocco su una persona (o sull'etichetta «Guarda ▸»): la camera si avvicina e si apre la scheda con
  i fatti di oggi. Rotella per avvicinarsi, trascinamento per spostarsi, doppio clic per tornare.

**I dati** sono scritti dentro la pagina (oggetto `DATI`), presi da `redazione/stato/2026-11-12.json`.
Il passo dopo è farli arrivare da soli.

**La ricetta che ha funzionato** (provata nel browser, su Mac):

- Three.js 0.186.1 da jsDelivr con una `importmap` (`three` e `three/addons/`); dagli addons solo
  `RoundedBoxGeometry` e `RoomEnvironment`. Camera ortografica ferma, direzione (1, 0.8, 1).
- `NeutralToneMapping`; ambiente `RoomEnvironment` a 0,3; `HemisphereLight` a 0,55; una
  `DirectionalLight` a 2,4 che fa l'ombra. **Con valori più alti il pavimento si brucia e le ombre
  spariscono**: è stato il primo errore.
- Ombre: `PCFShadowMap`, mappa 4096, `shadow.radius = 11`, `shadow.intensity` 0,6, calcolate una
  volta (`autoUpdate = false`, `needsUpdate` quando cambia la luce). **Dopo aver cambiato i bordi
  della camera dell'ombra va chiamato `shadow.camera.updateProjectionMatrix()`**, se no resta il
  cono di default. `VSMShadowMap` con raggio 10 le sfuma fino a farle sparire: scartata.
- Le pareti non gettano ombra (`castShadow = false`): la luce entra come in un plastico.
- Tutto è fatto di forme semplici in codice (nessun modello esterno); schermi, lavagna, prime
  pagine e tazze sono `CanvasTexture`. I testi sopra la scena (etichette, scheda) sono HTML.
- La sera e la notte: `PointLight` senza ombre per la piantana, la lampada da tavolo e il chiarore
  dello schermo; i paralumi diventano emissivi.
- `window.redazione` è una maniglia per le prove: `redazione.guarda(x, y, z, zoom)`,
  `redazione.luce('sera')`, `redazione.apri('ivo')`.

**Per provarla in locale**: l'anteprima dell'app non può servire file dalla Scrivania, quindi la
pagina si copia nello scratchpad della sessione con in testa `<!doctype html><meta charset="utf-8">`
(su claude.ai lo mette lo scheletro) e si serve da lì con `python3 -m http.server` (configurazione
`redazione` in `.claude/launch.json`, che non è nel repository).

**Anche oggi**: i nomi e il prima/dopo del revisore in `redazione/stato.py`; le due modifiche alla
corsa (`revisione.py` archivia in `data/revisione/`, `costo.py` salva gli orari); il prima/dopo del
12 novembre ricostruito dai commit (Ivo, al debutto: 11 testi riscritti).

**Il passo dopo** (quando Mike ha detto cosa cambiare del look): la stanza intera con tutti e nove,
i dati dallo stato del giorno, la frase di benvenuto, la conversazione con gli agenti («come una
persona vera», `progetto.md` §9) e la giornata di 24 ore (§5).
