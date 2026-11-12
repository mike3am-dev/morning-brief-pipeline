# La redazione isometrica: con che cosa si costruisce e con che stile

Ricerca dell'11 novembre 2026. Le dimensioni delle librerie le ho misurate scaricando i file dai CDN e comprimendoli con gzip (i CDN servono pesi molto simili); le date di uscita vengono dal registro npm. Ogni link qui sotto l'ho aperto e letto.

Il vincolo che pesa più di tutti non stava nel brief, e l'ho trovato strada facendo: **dentro l'artifact la pagina gira in un iframe di un'altra origine, e Safari in quei riquadri tiene `requestAnimationFrame` a 30 fotogrammi al secondo finché l'utente non ci tocca dentro** (con ogni probabilità vale anche per la WebView di un'app, che usa lo stesso WebKit: da provare) ([WebKit bug 170534](https://bugs.webkit.org/show_bug.cgi?id=170534), risolto nel 2017 introducendo il limite). Un trascinamento non basta a sbloccarlo, serve un tocco: il difetto è aperto dal 2020 ([bug 213344](https://bugs.webkit.org/show_bug.cgi?id=213344)). Con il Risparmio energetico acceso il limite resta a 30 comunque, ed è voluto ([bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745); [Motion](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe) lo racconta con le prove). Quindi la scena va pensata per 30 fotogrammi al secondo al massimo, e per stare quasi sempre ferma. È una buona notizia: lo stile della sigla vive di pose nette, non di movimento fluido.

---

## Le strade tecniche

### Il confronto

| Strada | Peso (gzip) | iPhone: fluidità e calore | Personaggi e gesti | Tocco | Giorno e notte | Nitidezza Retina | Verdetto |
|---|---|---|---|---|---|---|---|
| **Three.js 0.186.1**, camera ortografica, solo `MeshBasicMaterial` | 190 KB (un file) | Buona: il lavoro lo fa la GPU, e un materiale senza luci è il più economico che ci sia. Scalda solo se il ciclo resta acceso | Facili: un personaggio è un gruppo di primitive; girarsi è una rotazione, alzarsi una traslazione. Lo z-buffer risolve da solo chi sta davanti a chi, anche dentro l'anello del desk | `Raycaster` (funziona con la camera ortografica) oppure bottoni HTML sovrapposti | Si cambia il colore dei materiali: costo nullo | Ottima con `setPixelRatio(min(dpr,2))` e `antialias`; il testo va in HTML sopra la tela | **Raccomandata** |
| **Canvas 2D** con sprite disegnati a codice | 0 KB | Ottima se si ridisegna solo quando serve e si pre-disegnano i pezzi su tele nascoste | Laboriosi: girarsi vuol dire disegnare due o quattro viste; l'ordine di disegno (x+y, poi altezza) si rompe con oggetti grandi come il desk ad anello, che va spezzato in settori | Poligoni calcolati a mano, o bottoni HTML | Ridisegno delle tele in cache quando cambia la palette | Ottima se la tela è moltiplicata per `devicePixelRatio` | Piano B |
| **PixiJS 8.22.0** | 237 KB | Buona: batching eccellente, ma filtri e maschere costano | Come il Canvas 2D: proiezione, profondità (`zIndex`) e viste multiple a mano | Ottimo: `eventMode`, `hitArea` a poligono | `tint` gratis; i filtri colore no | `resolution` + `autoDensity` | No: pesa più di Three e non porta la terza dimensione |
| **CSS 3D** (`preserve-3d`) | 0 KB | A rischio: ogni piano 3D diventa uno strato del compositore. Sul demo di Keith Clark, Chrome usava 200–600 MB di memoria grafica ([Ekioh](https://www.ekioh.com/devblog/3d-environments-in-css/)) | Div che ruotano; i piani che si intersecano si ordinano male | Nativo | Variabili CSS e `color-mix(in oklab …)` | Ottima | No per la stanza; sì per pannello ed etichette |
| **SVG isometrico** (a mano, o [@elchininet/isometric](https://github.com/elchininet/isometric) 4.0.0) | 9 KB | Fragile in Safari: gli elementi animati dentro un SVG non passano dal compositore e ogni fotogramma ridisegna il disegno. Il motore nuovo che lo risolve (LBSE) a luglio 2026 non era ancora attivo di serie ([Igalia](https://blogs.igalia.com/nzimmermann/posts/2026-07-14-lbse-conditional-layers/)) | Animazioni SMIL o CSS; l'ordine di disegno è a mano | Nativo, accessibile | Variabili CSS | Perfetta, è vettoriale | No come motore; va bene per oggetti fermi |
| **Zdog 1.1.3** | 7 KB | Discreta su tele piccole; i suoi documenti avvertono che la tela rallenta se è grande su schermi densi ([extras](https://zzz.dog/extras)) | Bellissimi e rotondi: le sfere sono pallini piatti, cioè la sigla | Nessuno: c'è solo un trucco col renderer SVG e forme piene ([issue 75](https://github.com/metafizzy/zdog/issues/75)) | Colori a mano | Buona | Più avanti, per l'avatar nel pannello. Fermo a gennaio 2022, «v1 beta»; la profondità è la media dei punti e le forme vicine sfarfallano (lo dicono loro) |
| **obelisk.js 1.2.2** | 6 KB | Leggera | Pixel art 1:2, scritta pixel per pixel ([repo](https://github.com/nosir/obelisk.js)) | Nessuno | — | Pixel, non vettoriale | No: è un altro stile, ed è ferma al 2016 |
| **Isomer 0.2.6** | 9,5 KB | Leggera | Solidi semplici; ordina i poligoni solo dentro una forma, fra forme conta l'ordine in cui le aggiungi | Nessuno | Ombreggia ogni faccia con il prodotto fra normale e luce, schiarendo del 20% (letto nel sorgente) | Tela | No come libreria (2016), sì la sua formula |
| **Spline runtime** | 38 KB più decine di pezzi | — | La scena si costruisce nell'editor di Spline, non a codice | Sì | Sì | Sì | No: carica la scena da `prod.spline.design` e il decoder DRACO da `gstatic.com` (richieste di rete), e pubblica versioni ogni giorno (la 2.0.160 è del 10 novembre) |
| **React Three Fiber 9.8.2** | Three + React 19 + ReactDOM + R3F | Come Three | Comodo il `frameloop="demand"`, che a mano sono dieci righe | Sì | Sì | Sì | No: tre librerie in più e niente JSX senza un passo di build |

«isometric.js» e «iso-blocks» non esistono come pacchetti npm con quei nomi; gli equivalenti reali sono quelli in tabella (Isomer, obelisk, @elchininet/isometric).

### Perché Three.js

La stanza ha un oggetto che rompe ogni approccio 2D: **il desk circolare con i personaggi seduti dentro e l'anello di schermi sopra**. Chi sta dietro il bancone, chi davanti, quale schermo copre quale: con il disegno «dal fondo verso il davanti» va spezzato tutto in settori e ordinato a ogni passo di chi cammina. Lo z-buffer di WebGL lo risolve senza pensarci.

Il secondo motivo è stilistico. Con `MeshBasicMaterial`, che [non risente delle luci](https://threejs.org/docs/pages/MeshBasicMaterial.html), una sfera vista dalla camera ortografica è **un cerchio pieno da qualsiasi lato**: il pallino della sigla, gratis. Una capsula diventa una pillola, un cubo tre rombi. Il piatto non è un effetto da aggiungere: è il materiale più semplice che Three conosca. E senza tone mapping (il valore predefinito) un colore esadecimale della palette dell'app esce identico sullo schermo.

Il terzo è la manutenzione: girarsi, alzarsi, camminare fino alla macchinetta sono rotazioni e spostamenti di gruppi, non disegni nuovi da fare a mano per ogni posa.

### Come si carica

```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm" } }
</script>
<script type="module">
  import * as THREE from 'three';
</script>
```

- `https://cdn.jsdelivr.net/npm/three@0.186.1/+esm` — un file solo, 747 KB, **190 KB gzip**, senza altre importazioni (verificato). Versione del 24 settembre 2026, ben oltre le due settimane.
- Se serve un modulo aggiuntivo, la stessa CDN lo serve agganciato alla stessa copia di Three: `https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/utils/BufferGeometryUtils.js/+esm` importa da `/npm/three@0.186.1/+esm` (verificato).
- Su cdnjs c'è solo il nucleo: `https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.module.min.js` (90 KB) importa `./three.core.js` **non minificato** (287 KB gzip). Si può rimappare su `three.core.min.js` (104 KB) con una voce dell'import map che ha come chiave l'URL completo; secondo la specifica funziona, ma va provato nell'artifact prima di contarci. jsDelivr è più semplice.
- Facoltativo, per l'alba e il tramonto veri: `https://cdnjs.cloudflare.com/ajax/libs/suncalc/1.9.0/suncalc.min.js` (1,6 KB, del 2022). Su npm c'è una serie 2.x con uscite fino al 10 novembre: la 1.9.0 di cdnjs è quella ferma e collaudata.

### Le impostazioni che contano

```js
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));   // mai il 3× pieno dell'iPhone

const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
cam.position.set(50, 50, 50); cam.lookAt(0, 0, 0);          // isometrica vera: 35,26° di elevazione
// 2:1 «da videogioco»: elevazione 30° → cam.position.set(50, 40.82, 50)
```

- **Isometrica vera o 2:1.** La vera (35,26°, quella della griglia IBM costruita sul triangolo equilatero) mostra più pavimento; la 2:1 (30°) è quella dei giochi a pixel, nata per avere linee pulite su schermi senza antialiasing ([Wikipedia](https://en.wikipedia.org/wiki/Isometric_video_game_graphics)). Con la grafica vettoriale l'antialiasing c'è: meglio la vera.
- **Pixel ratio al massimo 2, fisso.** Il manuale di Three ricorda che a 3× si disegnano nove volte i pixel ([responsive](https://github.com/mrdoob/three.js/blob/dev/manual/pages/responsive.html)); sul forum, con il pixel ratio pieno, una scena quasi vuota girava a 40 fps su iPhone ([discourse](https://discourse.threejs.org/t/low-fps-on-ios-mobile-with-pixel-ration-set-as-window-devicepixelratio/4963)). Cambiarlo in base agli fps misurati porta a oscillazioni avanti e indietro ([discourse](https://discourse.threejs.org/t/changing-pixelratio-based-on-fps-good-or-bad-idea/34563)): si decide una volta all'avvio.
- **Si disegna solo quando qualcosa cambia** ([manuale, rendering on demand](https://github.com/mrdoob/three.js/blob/dev/manual/pages/rendering-on-demand.html)). Il ciclo si accende quando un personaggio comincia un gesto e si spegne (`setAnimationLoop(null)`) quando l'ultimo ha finito; un `setTimeout` lo riaccende per il gesto successivo. Senza nessuno in movimento la pagina non disegna niente.
- **Gesti a gradini.** Le pose cambiano a 10–12 fotogrammi al secondo, come nell'animazione «a passo due»; solo il camminare va a 30. Costa un terzo e sta bene con lo stile.
- **Geometrie ferme unite in pochi pezzi.** Sul forum di Three un caso è passato da 40 a 60 fps unendo una cinquantina di parti in una.
- **Il testo fuori da WebGL.** Fumetti, etichette e post-it leggibili sono elementi HTML posizionati sopra la tela: si proietta il punto d'ancoraggio (`v.project(cam)`) e si converte in coordinate di pagina. Con la camera ferma le posizioni si ricalcolano solo al ridimensionamento o quando qualcuno cammina. Le scritte dentro la scena (schermo gigante, monitor) vanno su `CanvasTexture` piccole, ridisegnate solo quando cambia il contenuto e dopo `document.fonts.load()` del carattere condensato.
- **Selezione con bottoni HTML invisibili** sopra ogni personaggio, 44×44 punti (il minimo di Apple è 28×28; il consigliato 44×44, [HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)), con `aria-label` («Il redattore, sta scrivendo»). Tocco, tastiera e VoiceOver in un colpo solo, senza raycast. Il raycast serve solo se un giorno si vorranno toccare gli oggetti.
- **Perdita del contesto WebGL.** iOS a volte lo toglie a una pagina in secondo piano: si ascolta `webglcontextlost` e si ricostruisce la scena su `webglcontextrestored`.
- **Inquadratura.** La zoom della camera ortografica si calcola dalla scatola della stanza proiettata, con 16 punti di margine. A telefono chiuso (≈560 punti) la stanza in rombo è larga e bassa: si stringe sul desk tenendo sempre in vista almeno una finestra, perché è lei a dire l'ora.

---

## Lo stile

### I riferimenti

**La sigla di The Morning Show** (Elastic; Angus Wall direttore creativo, Hazel Baird design director). L'idea di partenza, raccontata da Baird ad [amNY](https://www.amny.com/entertainment/hazel-baird-talks-creation-of-emmy-nominated-title-sequence-for-the-morning-show): sfere al posto di persone o pupazzi, e una sfera nera da seguire per tutta la sequenza. A [Muse](https://musebyclios.com/?p=43778) Baird aggiunge il resto: Saul Bass e Paul Rand come modelli; fondi chiari color crema per dare calore; niente verde, che stona col rosso e sa di vecchio, e niente rosa; tre sfere che passano da sinistra a destra come omaggio ai programmi del mattino e al sole che sorge; la griglia di sfere come la routine di chi va al lavoro, da cui la sfera nera esce. [Promax](https://oldbrief.promax.org/index.php/article/elastic-does-a-lot-with-dots-in-morning-show-main-titles) conferma i crediti e la lettura aperta delle scene. Per la redazione vuol dire due cose concrete: i personaggi possono essere sfere, e la scena può avere un protagonista nero che l'occhio segue.

**Monument Valley** (ustwo). Kill Screen ricorda che l'isometrico per sua natura si costruisce con tre colori, e Ken Wong racconta gli strumenti tolti di proposito all'artista e la regola di non mettere niente solo per bellezza ([Kill Screen](https://killscreen.com/monument-valley-elegance)); le fonti erano Escher, l'architettura mediorientale, l'ikebana e la grafica low-poly ([Game Developer, GDC 2015](https://gamedeveloper.com/production/video-crafting-the-striking-art-style-of-i-monument-valley-i-)).

**Lo stesso studio, qualche anno dopo** ([Technical Art in Assemble with Care](https://ustwogames.co.uk/news/technical-art-in-assemble-with-care/)). Le zone in ombra non diventano più scure: passano a un'altra texture, con un altro colore. L'ombra è accesa o spenta, senza sfumare con la distanza. L'oggetto su cui si lavora è il più saturo della scena, il resto scivola verso il grigio e verso il tono dell'ambiente. Sono le tre regole più utili di tutta la ricerca.

**Le linee guida isometriche di IBM** ([design](https://www.ibm.com/design/language/illustration/isometric-style/design), [produzione](https://ibm.com/design/language/illustration/isometric-style/production)). Una sola fonte di luce; un solo tipo d'ombra per illustrazione (nette o sfumate, mai insieme); oggetti costruiti da forme geometriche semplici e curve fatte di quarti di cerchio; niente effetti di fusione come moltiplica o sovrapponi. Per disegnare a mano una faccia isometrica: scala verticale 86,6%, inclinazione ±30°, rotazione ±30°.

**Mini Metro** ([analisi su Mechanics of Magic](https://mechanicsofmagic.com/2023/04/22/visual-design-of-games-mini-metro/)). Forma e colore codificano l'informazione; la geografia della città sta a basso contrasto e si ritira dietro il gioco; l'orologio cambia colore fra giorno e notte. Jamie Churchman ne ha parlato al GDC 2017 nel talk «When Less Is More» ([Game Developer](https://gamedeveloper.com/design/video-behind-the-minimalistic-visual-design-of-i-mini-metro-i-)). Gli schizzi di Mini Motorways, compresa una versione isometrica, sono nel [diario degli sviluppatori](https://dinopoloclub.com/2023/07/23/behind-the-scenes-concepting-mini-motorways/).

**Isotype** (Neurath, Arntz, Reidemeister; [Wikipedia](https://en.wikipedia.org/wiki/Isotype_(picture_language))): pittogrammi semplificati, mai in prospettiva, e la quantità detta ripetendo il segno, non ingrandendolo. È la grammatica giusta per spie e fumetti.

**Uffici di agenti già fatti.** [Pixel Agents](https://github.com/pablodelucca/pixel-agents) dà a ogni agente di Claude Code un personaggio che scrive quando modifica file, legge quando cerca, e chiede attenzione con un fumetto quando è bloccato. [Agents in the Office](https://github.com/gukosowa/agents-in-the-office) manda il personaggio verso l'oggetto dello strumento (il computer per scrivere, la libreria per leggere), lo fa vagare quando è fermo, e per un'approvazione sposta la camera, accende un cartello e vela lo schermo di rosso. [AI Town](https://github.com/a16z-infra/ai-town) disegna la sua città con PixiJS, e viene dagli *agenti generativi* di Stanford, che si svegliano, fanno colazione, vanno al lavoro e ripensano ai giorni passati per pianificare il successivo ([arXiv](https://arxiv.org/abs/2304.03442)). Tutti e tre sono a pixel: da prendere la grammatica degli stati, non il disegno.

**Due esempi di giorno e notte fatti bene.** In *Graveyard Keeper* la luce ambiente viene da un gradiente che di notte scurisce e vira al blu, e l'artista ha preparato dieci tabelle colore per le ore del giorno ([Lazy Bear](https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made)). La [stanza 3D di Bruno Simon](https://github.com/brunosimon/my-room-in-3d) mescola tre texture cotte (giorno, notte, neutra) e aggiunge una mappa delle luci con tre colori, il televisore, la scrivania, il pc (`src/Experience/Baked.js`). È la stessa idea che serve qui, con le texture al posto delle campiture.

Per Kurzgesagt e Pentagram non ho trovato fonti primarie sul metodo che valesse la pena citare. Kurzgesagt, a guardarlo, usa sfumature e bagliori che questo stile esclude.

### Piatto e profondo insieme: le regole

1. **Tre toni per ogni superficie, da una luce sola.** Faccia in alto la più chiara, sinistra media, destra la più scura (o il contrario, ma sempre uguale per tutta la stanza). In Three sono tre materiali per scatola, o i colori ai vertici di una geometria unica. Isomer calcola lo scarto dal prodotto fra normale e luce: si può usare la stessa formula per ricavare i tre toni da un colore base.
2. **L'ombra è un colore, non un nero.** Un poligono netto, steso sul pavimento sotto scrivanie e personaggi, in un tono suo per ogni ora (di giorno un blu-grigio, di sera un viola scuro). Nessuna trasparenza e nessun moltiplica: si sovrappone male e IBM lo sconsiglia.
3. **La profondità la fa il valore.** Pareti e pavimento a basso contrasto, come la geografia di Mini Metro; i colori saturi solo su personaggi, spie, schermi accesi. Il protagonista del momento (chi lavora, chi chiama) è il più saturo; gli altri scivolano di poco verso il colore della stanza, come in Assemble with Care.
4. **Ordine e sovrapposizione.** Lo z-buffer dice chi sta davanti; il compositore umano decide che non ci siano incroci ambigui. Niente spigoli allineati sulla stessa retta fra oggetti a profondità diverse: l'occhio li legge come un pezzo solo.
5. **Il pallino come segno.** Teste a sfera, spie a pallino, il sole come pallino giallo nella finestra, i post-it come quadratini di colore pieno. Un solo carattere condensato pesante per le scritte (quello dell'app).
6. **Quattro saturi con un ruolo.** Giallo, arancio, blu, rosso, e il nero della sfera da seguire. Ogni colore significa sempre la stessa cosa in tutta la scena (vedi le spie qui sotto). Niente verde e niente rosa, come nella sigla.

### Il giorno e la notte con soli colori piatti

- **La palette ha fotogrammi chiave legati al sole vero, non all'orologio.** Notte, aurora, alba, mattina, mezzogiorno, pomeriggio, tramonto, sera: otto palette complete (parete, pavimento, tre toni di ogni mobile, ombra, cielo, luce della finestra). Le ore di alba e tramonto si calcolano in locale per Milano (45,46 N; 9,19 E) con SunCalc o con la formula, senza rete: d'inverno alle 17 è buio, a giugno no, e la stanza lo sa da sola.
- **Si interpola fra un fotogramma e il successivo**, ricalcolando una volta al minuto: il cambio non si vede mai avvenire. Mescolare in RGB o HSV sporca i colori a metà strada, con derive verso il viola; OKLab nasce per tenerli puliti ([Björn Ottosson](https://bottosson.github.io/posts/oklab/), con il codice). In CSS c'è già `color-mix(in oklab, …)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)).
- **La notte non è «tutto più scuro».** È un'altra tavolozza: pareti blu profondo, mai nero; le cose saturate restano sature ma su un fondo più basso. Graveyard Keeper vira al blu, non spegne.
- **Le luci di notte sono campiture.** Un disco giallo pieno sotto ogni lampada da scrivania, un rettangolo chiaro del monitor proiettato sul piano e sulla faccia di chi ci sta davanti, la finestra che passa da sorgente di luce a quadro scuro con le luci della città a pallini. Il monitor diventa la cosa più chiara della stanza.
- **Il cielo nella finestra a bande.** Tre o quattro strisce piene invece di un gradiente: è il tramonto detto in campiture, e regge la sigla.
- **La macchia di sole sul pavimento si sposta con l'azimut**, come una meridiana: un parallelogramma chiaro che entra dalla finestra la mattina e scivola verso la parete il pomeriggio. Un solo piano da riposizionare ogni pochi minuti.

### Stati e notifiche leggibili a misura di telefono

A 560 punti di larghezza una scrivania misura 50–60 punti e una testa 10–14: in scena non ci stanno parole. Quindi **in scena i segni, nel pannello le parole**.

- **Tre livelli, in ordine di voce.** La posa dice cosa fa (scrive, legge, beve il caffè, dorme sulla scrivania). La spia, un pallino sopra lo schermo di almeno 8 punti, dice lo stato con un colore fisso (blu lavora, giallo aspetta, rosso errore, spenta assente). Il fumetto, solo per chi chiede attenzione, porta un pittogramma o una parola sola. Pixel Agents e Agents in the Office usano la stessa scala; il velo rosso a tutto schermo del secondo è troppo per una colazione.
- **I segni non sono isometrici.** Spie, fumetti e icone stanno di fronte alla camera e sono piatti, come i pittogrammi Isotype. Isometrici sono solo gli oggetti.
- **Il fumetto entra e poi sta fermo.** Due pulsazioni e basta; un segnale che lampeggia per sempre smette di dire qualcosa.
- **Le parole rispettano i minimi di Apple**: testo ad almeno 11 punti (17 è il valore di riferimento), bersagli da 44×44 ([HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)). I post-it sulla lavagna sono quadratini di colore; il testo si legge nel pannello, o quando si avvicina la lavagna.
- **La quantità si conta.** Tre post-it gialli sono tre cose da fare; le tazze sul tavolo sono le ore di lavoro. Si ripete il segno, non lo si ingrandisce.

---

## La vita che segue l'orologio

**Un orario scritto per ognuno.** In Animal Crossing ogni carattere di abitante ha le sue ore di sveglia e di sonno (in New Leaf il tipo «normale» si alza alle 6, il «lazy» alle 9, la «sorella maggiore» alle 11) e le ordinanze spostano tutti di un'ora ([Nookipedia](https://nookipedia.com/wiki/Ordinance)). Gli agenti di Stanford fanno lo stesso con un piano della giornata ([arXiv](https://arxiv.org/abs/2304.03442)). Per la redazione l'orario esiste già: la corsa delle 6:30, con raccolta, lettura, scrittura, revisione e pubblicazione. Fuori da lì ciascuno ha un cronotipo: chi resta la sera a sorvegliare i feed, chi arriva sempre per primo.

**Il tempo condiviso.** Katsuya Eguchi spiega che l'orologio vero serve a far condividere qualcosa a persone che non giocano nello stesso momento; se manchi per un po' trovi le erbacce, un fastidio piccolo e mai una punizione; e saltare avanti con l'orologio ha conseguenze ([Game Developer](https://www.gamedeveloper.com/design/crossing-into-the-mainstream-katsuya-eguchi-on-i-animal-crossing-i-)). Qui la condivisione è fra Mac e iPhone: se i gesti casuali nascono da un generatore con seme (data, ora, agente), nello stesso minuto i due schermi mostrano la stessa scena, e una ricarica non rimescola tutto.

**Le ore hanno un carattere.** Animal Crossing ha un brano per ogni ora, con le versioni per sole, pioggia e neve ([Animal Crossing World](https://animalcrossingworld.com/2025/11/animal-crossing-new-leaf-music-arrives-on-nintendo-music-with-perfect-hourly-sync-feature/)). Senza audio, lo stesso lavoro lo fanno la palette e le abitudini: la riunione al desk alle 7, il caffè delle 10, le luci che si accendono una a una al tramonto.

**Vivo anche quando non guardi, senza ricatti.** Il Tamagotchi dormiva di notte e moriva se trascurato per cinque o sei ore ([Mental Floss](https://www.mentalfloss.com/fun/toys/tamagotchi-history)). Finch tiene il suo uccellino vivo in un altro modo: di giorno va in avventura, di notte dorme, il widget mostra cosa sta facendo e la sera racconta cosa ha trovato, senza mai insistere perché torni ([Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)). In Neko Atsume i gatti rari spingono a tornare e a provare disposizioni nuove ([Mechanics of Magic](https://mechanicsofmagic.com/2024/04/07/mda-neko-atsume/)). Per la redazione: aprendo alle 10 si vedono le tracce delle 6:30 (tazze, post-it nuovi, la lavagna aggiornata, lo schermo grande con l'edizione uscita), e nessuno è mai triste perché non sei passato.

**Le piccole variazioni.** Il gesto fisso a intervalli fissi si scopre subito; meglio intervalli casuali con un minimo e un massimo, e un gesto che non torna due volte di fila ([DEV](https://dev.to/arkfuldodger/programming-natural-idle-character-animations-4l0g)). Guido Henkel contesta i respiri esagerati, eredità degli sprite anni Ottanta: un respiro quasi invisibile, e la vita dall'ambiente ([blog](https://guidohenkel.com/2014/10/isnt-it-time-we-rethink-idle-animations/)). Nella Lofi Girl il cielo segue l'ora e la ragazza ogni tanto guarda il gatto sul davanzale; quando a luglio 2025 ha chiuso il computer con «The End», la comunità si è commossa ([Wikipedia](https://en.wikipedia.org/wiki/Lofi_Girl)). Gli eventi rari pesano proprio perché sono rari.

**Riduci movimento.** WebKit elenca gli inneschi vestibolari: zoom e ingrandimenti, rotazioni e vortici, parallasse e movimenti a più velocità, gli spostamenti di piano «2.5D», il movimento ai margini del campo visivo ([WebKit](https://webkit.org/blog/7551/responsive-design-for-motion/)). Apple chiede di ridurre le animazioni automatiche e ripetute, di sostituire gli spostamenti con dissolvenze e di non animare i cambi di profondità ([HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)). WebKit avverte anche di non togliere tutto: un'interfaccia senza nessun segnale di cambiamento confonde. Quindi con Riduci movimento la scena mostra la posa dell'ora, i cambi di stato arrivano in dissolvenza, le spie restano, la camera non si muove mai e l'anello di schermi non gira.

---

## Idee da prendere

1. **subito** — I personaggi sono sfere. Testa a pallino nel colore dell'agente, corpo a pillola, un segno ciascuno (le cuffie, gli occhiali, la penna). È l'idea della sigla, e in Three è il materiale più semplice.
2. **subito** — Una sfera nera da seguire: la regia, o chi sta lavorando in quel momento. L'occhio ha sempre un punto da cui partire.
3. **subito** — Tre toni per faccia da una luce sola, ombre come poligoni netti di un colore loro, nessuna trasparenza.
4. **subito** — Otto palette legate ad alba e tramonto veri di Milano, interpolate una volta al minuto. Niente animazione di colore, solo tempo che passa.
5. **subito** — La macchia di sole che attraversa il pavimento con l'azimut, e di notte i dischi gialli delle lampade e i rettangoli dei monitor.
6. **subito** — Spie a pallino con un colore per stato, il fumetto solo per chi chiama, due pulsazioni e poi fermo.
7. **subito** — Bottoni HTML invisibili da 44×44 sopra i personaggi, con il nome e lo stato in `aria-label`: tocco, tastiera e VoiceOver senza raycast.
8. **subito** — Disegno a richiesta, gesti a gradini a 10–12 fps, camminata a 30, mai più di uno o due personaggi in gesto insieme, ciclo spento quando nessuno si muove.
9. **subito** — Casualità con seme (data, ora, agente): Mac e iPhone vedono la stessa scena nello stesso minuto.
10. **subito** — Un orario scritto per ogni agente, con la corsa delle 6:30 come ora di punta e cronotipi diversi fuori da lì.
11. **subito** — Riduci movimento: posa dell'ora, dissolvenze, camera ferma, spie accese.
12. **più avanti** — Le tracce della mattina: tazze che si accumulano, post-it nuovi, lo schermo grande con l'edizione uscita. Servono i dati veri della corsa dentro la pagina.
13. **più avanti** — Gli eventi rari presi dal calendario, che non chiede rete: il lunedì della manutenzione fonti (qualcuno con lo scatolone), il conto alla rovescia sullo schermo grande nel giorno di un evento Apple, l'orologio a muro che salta indietro il 25 ottobre, le lucine a dicembre.
14. **più avanti** — L'avatar del personaggio nel pannello disegnato con Zdog (7 KB): una tela piccola che gira se la trascini, dove i limiti di Zdog non si vedono.
15. **più avanti** — Tenere premuto l'orologio a muro per far scorrere la giornata: serve a provare la scena a tutte le ore senza aspettarle.
16. **no, perché…** la musica oraria alla Animal Crossing: la pagina parte muta dentro un iframe, e a colazione l'audio non lo vuole nessuno.
17. **no, perché…** le texture cotte giorno e notte alla Bruno Simon: pesano come immagini incorporate e portano le sfumature morbide che lo stile esclude.
18. **no, perché…** le ombre calcolate dal motore (shadow map): costano GPU a ogni fotogramma e sono morbide per natura.
19. **no, perché…** la camera libera che orbita: rompe l'isometrico, obbliga a ricalcolare tutte le etichette ed è uno degli inneschi vestibolari dell'elenco WebKit. Al massimo due o tre inquadrature fisse con uno stacco netto.
20. **no, perché…** il Tamagotchi: niente agenti tristi o in disordine se Mike non passa. La stanza vive per conto suo e non chiede niente.

---

## Cosa evitare

**Prestazioni**

- Il pixel ratio pieno dell'iPhone (3×, nove volte i pixel), e il pixel ratio che si adatta agli fps: oscilla.
- Il ciclo `requestAnimationFrame` sempre acceso, e tutti i personaggi in movimento nello stesso istante.
- Contare su 60 o 120 fotogrammi: nell'artifact Safari dà 30 finché non tocchi (un trascinamento non basta), e 30 sempre col Risparmio energetico. Anche le animazioni CSS con `linear()` restano a 30 in risparmio e a 60 sugli schermi a 120 Hz ([bug 281429](https://bugs.webkit.org/show_bug.cgi?id=281429)).
- Creare geometrie, materiali o texture dentro il ciclo; aggiornare le `CanvasTexture` dei monitor a ogni fotogramma invece che quando cambia il contenuto.
- Le decine di pezzi fermi lasciati separati: si uniscono.
- La notte fatta con filtri, maschere, modi di fusione o post-produzione (il «bloom»): costano e sono morbidi. PixiJS mette i filtri fra le cose più care ([guida](https://pixijs.com/8.x/guides/concepts/performance-tips)).
- La stanza in CSS 3D: uno strato per piano, e `opacity`, `filter`, `overflow` o `clip-path` su un antenato appiattiscono tutto ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style)).
- Un SVG grande con tanti elementi animati dentro: in Safari ogni fotogramma ridisegna l'intero disegno.
- Il testo disegnato dentro WebGL; le tele oltre 16,7 milioni di pixel, che su iOS smettono di disegnare ([PQINA](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/)).
- Ignorare `webglcontextlost`: la scena resta nera dopo un ritorno dall'app in secondo piano.
- Col piano B, le coordinate frazionarie e `shadowBlur` sulla tela 2D, e i pezzi fermi ridisegnati ogni volta invece che pre-disegnati su una tela nascosta ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)).

**Stile**

- L'ufficio isometrico da banca d'immagini: gradienti viola, persone che fluttuano, piante tutte uguali. È il cliché del genere, ed è l'opposto della sigla.
- Ombre morbide, bagliori, vetro, occlusione ambientale, contorni neri.
- Due luci con due ombre in direzioni diverse; ombre nette e sfumate insieme.
- La notte nera, o fatta abbassando la luminosità di tutto.
- I colori mescolati in RGB o HSV: a metà strada vengono fuori grigi sporchi e viola.
- Respiri e dondolii esagerati, gesti in sincrono, lo stesso gesto due volte di fila.
- Parole nella scena sotto gli 11 punti, fumetti con frasi intere, icone in prospettiva.
- Il saturo ovunque: se tutto è acceso non si vede chi chiama.
- Il verde e il rosa, che Baird ha tenuto fuori dalla sigla.
