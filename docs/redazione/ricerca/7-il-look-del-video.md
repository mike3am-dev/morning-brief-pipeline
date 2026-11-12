# Il look del video: la stanza «di creta» in Three.js

11 novembre 2026, sera. Il proprietario ha scelto il look del video di riferimento: volume, luce
calda, ombre morbide e leggere, pavimento chiaro, legno, bordi levigati. Questo rapporto dice come
ottenerlo con **Three.js 0.186.1** dentro un artifact, senza richieste di rete, **pensando prima al
Mac** (Safari, Chrome e l'app desktop di Claude, schermi da 13–16 pollici e monitor esterni). iPhone
e pieghevole vengono dopo e hanno una sezione loro, in fondo.

Rispetto al rapporto 4 cambia una cosa sola, il materiale: là `MeshBasicMaterial`, piatto e senza
luci; qui `MeshStandardMaterial` con luci e ombre vere. Restano valide le sue regole su pixel ratio,
disegno a richiesta e caricamento da jsDelivr.

Come ho verificato: ho aperto le pagine citate e, per Three, ho letto il sorgente di 0.186.1
scaricato da jsDelivr (`build/three.module.js`, gli addon, gli esempi del tag `r186` su GitHub).
Per i modelli ho aperto i file GLB/glTF di alcune copie pubbliche e ne ho letto la struttura
(triangoli, materiali, animazioni). Le stime sono dichiarate come stime.

---

## In breve

1. `WebGLRenderer` con `antialias`, pixel ratio `min(dpr, 2)` e un tetto di circa 8 milioni di
   pixel per i monitor 5K; **`NeutralToneMapping`**, che tiene il giallo del marchio (con ACES e
   AgX i gialli saturi si spengono).
2. Luce in tre strati, tutta generata in codice: ambiente `RoomEnvironment` passato al
   `PMREMGenerator` a mezza intensità, `HemisphereLight` calda (cielo bianco caldo, terra color
   legno), una `DirectionalLight` calda dalla finestra che fa l'ombra.
3. Ombra con mappa 2048 (4096 sul Mac regge), `PCFShadowMap` con `radius` 3–5 oppure
   `VSMShadowMap`; **`shadow.intensity` intorno a 0,6** per averla leggera; calcolata una volta
   sola (`shadowMap.autoUpdate = false`) e rifatta solo se si sposta un mobile.
4. Chi si muove (personaggi, sedie che girano) non entra nella mappa d'ombra: sotto ha una macchia
   morbida disegnata in codice. Così la mappa resta ferma per tutta la sessione.
5. Occlusione ambientale con `GTAOPass`, l'addon di Three della stessa versione, dentro un
   `EffectComposer` con 4 campioni di antialias. Si paga solo quando si ridisegna.
6. Tutto `MeshStandardMaterial` opaco (`roughness` 0,75–0,95, `metalness` 0), spigoli tondi con
   `RoundedBoxGeometry`, personaggi e piante con capsule e sfere. Niente `MeshToonMaterial`.
7. Arredi in codice; se servono pezzi già fatti, KayKit Furniture Bits (CC0) è lo stile più
   vicino. Personaggi in codice con primitive, magliette nei quattro colori del marchio.
8. Marchio, schermi e prime pagine su `CanvasTexture` disegnate con `Path2D`, anisotropia massima,
   gli schermi su `MeshBasicMaterial`.
9. Disegno a richiesta: il ciclo è acceso solo mentre qualcuno fa un gesto, con «Riduci movimento»
   i gesti diventano cambi di posa. **In Safari anche sul Mac** l'iframe dell'artifact va a 30
   fotogrammi al secondo finché non ci si clicca dentro; in Chrome e nell'app desktop di Claude no.
10. Peso: 0,3–0,5 MB di pagina se è tutto in codice, più i ~190 KB compressi di Three dalla CDN;
    1–2 MB con arredi e personaggi già fatti e compressi.

---

## I 30 fotogrammi al secondo: valgono anche sul Mac, ma solo in Safari

Il rapporto 4 aveva trovato il limite e lo aveva dato per certo su iOS. L'ho cercato nel codice di
WebKit di oggi (ramo `main`), ed è **nel motore comune, senza nessuna condizione di piattaforma**:

- In [`Document.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/dom/Document.cpp),
  alla prima chiamata a `requestAnimationFrame`, se l'origine del riquadro è diversa da quella della
  pagina che lo contiene e l'utente non ci ha ancora interagito, si aggiunge il motivo di
  rallentamento `NonInteractedCrossOriginFrame`. Lo stesso file lo toglie in
  `updateLastHandledUserGestureTimestamp`, cioè al primo gesto dell'utente dentro il riquadro.
- In [`AnimationFrameRate.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp)
  quel motivo sta nell'elenco dei rallentamenti «a metà velocità», insieme a `LowPowerMode`,
  `VisuallyIdle` e `AggressiveThermalMitigation`. Metà di 60 fa 30. Nel file non c'è un solo
  `#if PLATFORM(...)`.
- La modifica originale, del 2017, è la [r215070](https://trac.webkit.org/r215070): «Throttle
  requestAnimationFrame in cross-origin iframes to 30fps», anch'essa senza condizioni di
  piattaforma.
- Il risparmio energetico conta anche sul Mac: il rilevatore di WebKit per i sistemi Apple
  ([`LowPowerModeNotifier.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/cocoa/LowPowerModeNotifier.mm))
  legge `NSProcessInfo.lowPowerModeEnabled`, che esiste su macOS. Un MacBook a batteria con la
  modalità «Basso consumo» accesa resta a 30 anche dopo il clic.

| Dove si apre la redazione | Limite | Come si sblocca |
|---|---|---|
| Safari su macOS | **30 fps** finché non si clicca o si preme un tasto dentro l'artifact | Il primo clic; con «Basso consumo» acceso resta a 30 |
| Safari su MacBook Pro con ProMotion | Dopo il clic, circa 60 e non 120 | È l'impostazione predefinita «Prefer Page Rendering Updates near 60fps» ([MacRumors](https://forums.macrumors.com/threads/enable-smoother-120hz-browsing-in-safari.2476442/)) |
| Chrome su macOS | Nessun limite per un iframe visibile; Chrome ferma solo gli iframe di altra origine nascosti o fuori schermo ([blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/NJIVCmBAwkw)) | — |
| App desktop di Claude | Come Chrome: l'app è costruita su Electron, cioè Chromium ([Daring Fireball](https://daringfireball.net/linked/2024/10/31/anthropic-mac-app-electron-turd)) | — |
| Safari su iPhone e pieghevole | 30 fps fino al tocco; 30 sempre col Risparmio energetico ([bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745)) | Un tocco; un trascinamento a volte non basta ([Motion](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe)) |

Cosa vuol dire in pratica: i gesti si progettano per 30 fotogrammi e si misurano col tempo
trascorso, non contando i fotogrammi (in Chrome su uno schermo a 120 Hz il ciclo può girare a 120,
in Safari prima del clic a 30: con il `delta` in secondi il gesto dura uguale dappertutto). Una scena ferma che si
ridisegna solo quando cambia qualcosa non si accorge nemmeno del limite. Non ho provato nell'artifact
vero se Safari consideri «interazione» anche un clic arrivato prima che la pagina chiami
`requestAnimationFrame`: dal codice, il motivo si aggiunge solo se l'utente non ha ancora toccato, e
si toglie al gesto successivo, quindi dovrebbe andare.

---

## La luce e le ombre

### La ricetta, in codice

Questa è l'impostazione da cui partire sul Mac. I numeri sono un punto di partenza da tarare a occhio
sulla stanza vera, non valori misurati.

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/environments/RoomEnvironment.js/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.NeutralToneMapping;   // tiene i colori del marchio
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;      // PCFSoftShadowMap in r186 non c'è più
renderer.shadowMap.autoUpdate = false;             // l'ombra si calcola quando lo diciamo noi

// pixel ratio: al massimo 2, e al massimo ~8 milioni di pixel (monitor 5K)
function pixelRatio(w, h) {
  const dpr = Math.min(devicePixelRatio, 2);
  return Math.min(dpr, Math.sqrt(8e6 / (w * h)));
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F3EDE2');     // osso

// 1. l'ambiente: una stanza finta generata in codice, nessun file HDR
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

// 2. il riempimento: cielo caldo, terra color legno (le ombre prendono questo colore, non il nero)
scene.add(new THREE.HemisphereLight('#FFF4E6', '#D9C2A0', 0.9));

// 3. la luce della finestra, calda, con l'ombra
const sole = new THREE.DirectionalLight('#FFE2B8', 2.4);
sole.position.set(-8, 14, 6);
sole.castShadow = true;
sole.shadow.mapSize.set(2048, 2048);               // 4096 sul Mac regge
sole.shadow.radius = 4;
sole.shadow.intensity = 0.6;                       // ombra leggera
sole.shadow.bias = -0.0005;
sole.shadow.normalBias = 0.02;
Object.assign(sole.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
scene.add(sole);

// … si costruisce la stanza …
renderer.shadowMap.needsUpdate = true;              // una volta, dopo aver messo i mobili
```

La camera è una `OrthographicCamera` messa sulla diagonale `(d, d, d)` che guarda il centro: è
l'isometria vera (35,26° di elevazione, 45° di azimut).

### Le tecniche, una per una

| Tecnica | Cosa dà al look | Quanto costa sul Mac | Note e link |
|---|---|---|---|
| **Ambiente `RoomEnvironment` + `PMREMGenerator`** | La luce diffusa che arriva da tutte le parti e i riflessi morbidi sul legno e sui monitor: è quello che toglie l'aria «da videogioco» | Una volta all'avvio (si genera una mappa d'ambiente); poi una lettura di texture per pixel | Nessun file: è una stanza fatta di scatole e luci che Three fotografa. `scene.environmentIntensity` (esiste in 0.186) la abbassa. [Documentazione](https://threejs.org/docs/pages/RoomEnvironment.html), [PMREM](https://threejs.org/docs/pages/PMREMGenerator.html) |
| **`HemisphereLight`** | Il riempimento: dal basso arriva il colore del pavimento, così il sotto dei mobili è caldo e non grigio | Quasi niente | È la luce che tinge le ombre: con la terra color legno le ombre vengono color caffellatte, come nei render da Dribbble |
| **`DirectionalLight` con mappa d'ombra** | Le ombre portate dei mobili sul pavimento | Ogni luce con l'ombra ridisegna la scena dal suo punto di vista ([manuale](https://threejs.org/manual/pages/shadows.html)); con la mappa ferma si paga una volta sola | Una luce sola con l'ombra. In r186 `PCFShadowMap` legge **5 campioni su un disco ruotato a caso per pixel** (l'ho letto nello shader): con `radius` grande la penombra diventa granulosa. Per una penombra più larga e liscia c'è `VSMShadowMap` con `radius` 6–10 e `blurSamples` 16 ([esempio](https://threejs.org/examples/webgl_shadowmap_vsm.html)); attenzione, con VSM ogni oggetto che riceve l'ombra la proietta anche |
| **`shadow.intensity`** | L'ombra leggera del video: 0,5–0,7 invece del nero pieno | Niente | Esiste su ogni luce in 0.186 ([`LightShadow`](https://threejs.org/docs/pages/LightShadow.html)) |
| **Ombra ferma** (`renderer.shadowMap.autoUpdate = false`, poi `needsUpdate = true` quando serve) | — | Toglie il costo dell'ombra da tutti i fotogrammi dopo il primo | Nel codice di 0.186: se `autoUpdate` e `needsUpdate` sono falsi, il passo dell'ombra esce subito. C'è anche per luce: `sole.shadow.autoUpdate = false`, `sole.shadow.needsUpdate = true` |
| **Macchie sotto gli oggetti** (blob shadow) | L'ombra di contatto sotto i piedi, le ruote della sedia, il vaso | Un quadratino trasparente per oggetto: niente | Un `CanvasTexture` con un gradiente radiale da 128 px, su un piano appena sopra il pavimento, `depthWrite: false`. Il manuale di Three lo chiama «efficace ed economico» ([ombre finte](https://threejs.org/manual/pages/shadows.html)). Tinta marrone scuro al 30–40%, non nero |
| **Ombra di contatto sfocata** | Una macchia che segue la forma vera dell'oggetto | Una vista dall'alto in un render target da 512 e due sfocature; ferma, si rifà solo se qualcosa si sposta | [Esempio ufficiale](https://threejs.org/examples/webgl_shadow_contact.html). Utile sotto il desk circolare e la lavagna, non serve sotto ogni sedia |
| **`GTAOPass`** (occlusione ambientale) | Il buio morbido negli angoli, sotto le scrivanie, fra il monitor e il piano: è quello che rende «di creta» | Una passata della scena per profondità e normali più due passate a schermo intero, a ogni ridisegno. Col disegno a richiesta si paga solo durante i gesti | Funziona con la camera ortografica (lo shader ha il caso `PERSPECTIVE_CAMERA = 0`). Il composer va creato con un render target a 4 campioni, altrimenti si perde l'antialias. [Esempio](https://threejs.org/examples/webgl_postprocessing_gtao.html), [documentazione](https://threejs.org/docs/pages/GTAOPass.html) |
| **AO nei colori dei vertici** | Lo stesso buio negli angoli, fatto a mano | Zero per fotogramma | Per geometrie fatte in codice: si scuriscono i vertici vicini al pavimento e agli spigoli interni (`vertexColors: true`). È il ripiego se il GTAO pesa, e la strada per l'iPhone |
| **`LightProbeGridWebGL`** (nuovo in r186) | La luce che rimbalza: il legno che scalda il pavimento, la maglietta arancione che tinge la scrivania | Una «cottura» sulla GPU all'avvio (cubemap minuscole in una griglia di sonde), poi una lettura di texture 3D per pixel | È **nuovo**: in 0.185 non esisteva (verificato su jsDelivr). Vale per tutti gli oggetti dentro il volume, quindi anche per i personaggi che si muovono. Da provare come rifinitura, non come base. [Documentazione](https://threejs.org/docs/pages/LightProbeGridWebGL.html), [esempio](https://threejs.org/examples/webgl_lightprobes.html) |
| **Tone mapping** | ACES dà contrasto da cinema ma spegne i gialli saturi; AgX è morbido ma desatura; **Neutral** (lo standard Khronos per il commercio) è fatto per far uscire il colore base com'è | Niente | [model-viewer](https://modelviewer.dev/examples/tone-mapping) lo spiega con le prove: con ACES il giallo canarino non si riesce a mostrare. Per un marchio col sole giallo è la scelta obbligata |
| **Colori sRGB** | Colori della palette identici a quelli dell'app | Niente | Three 0.186 gestisce i colori da solo (`ColorManagement` acceso): un esadecimale in `new THREE.Color('#F5C518')` è sRGB. Le `CanvasTexture` vogliono `texture.colorSpace = THREE.SRGBColorSpace`, altrimenti escono slavate ([manuale](https://threejs.org/manual/pages/color-management.html)) |

**I materiali.** `MeshStandardMaterial` per tutto quello che si vede da vicino: è l'unico dei tre che
usa la mappa d'ambiente con la ruvidezza, e la creta è proprio un materiale molto ruvido che prende
un filo di riflesso sugli spigoli. `MeshLambertMaterial` costa meno ma non ha riflessi: va bene per
cose lontane o minuscole (penne, post-it), e sull'iPhone. `MeshToonMaterial` dà le bande del cartone
animato, cioè il look piatto che il proprietario ha scartato. Per le sedie in tessuto,
`MeshPhysicalMaterial` con un po' di `sheen` dà il velluto: una rifinitura, non necessaria.

| Superficie | `color` | `roughness` | `metalness` |
|---|---|---|---|
| Pavimento chiaro | osso o rovere chiaro | 0,9 | 0 |
| Legno delle scrivanie | miele chiaro | 0,8 | 0 |
| Plastica, sedie, vasi | colori pastello | 0,75–0,85 | 0 |
| Monitor (cornice) | quasi nero, mai nero puro | 0,4 | 0 |
| Pelle e capelli dei personaggi | toni caldi | 0,85–0,95 | 0 |

**Le forme.** [`RoundedBoxGeometry`](https://threejs.org/docs/pages/RoundedBoxGeometry.html)
(addon, 6 KB) fa scatole con gli spigoli tondi: `(larghezza, altezza, profondità, segmenti, raggio)`.
Con 3–4 segmenti e un raggio del 3–6% del lato, lo spigolo prende la luce e la scatola smette di
sembrare un cubo di gioco. [`CapsuleGeometry`](https://threejs.org/docs/pages/CapsuleGeometry.html)
è nel nucleo (`raggio, altezza, segmentiCappuccio, segmentiRadiali`). Le chiome delle piante vengono
bene come tre o quattro `IcosahedronGeometry` sovrapposte con le normali lisce; i vasi con
`LatheGeometry`. Le dieci scrivanie, sedie e monitor uguali vanno in
[`InstancedMesh`](https://threejs.org/docs/pages/InstancedMesh.html): una chiamata di disegno per
tipo invece di dieci, e il colore per istanza resta possibile (`setColorAt`).

### Che cosa fa il «look Dribbble»

Guardando le stanze isometriche ben riuscite, il volume non viene da una tecnica sola ma da cinque
cose insieme, tutte economiche:

1. **La stanza come un plastico**: pavimento e due pareti tagliate, con lo spessore visibile sul
   bordo in un tono più scuro. È quello che dice «diorama» prima ancora delle luci.
2. **Spigoli tondi ovunque**, anche minimi: la luce ci scivola sopra e disegna il volume.
3. **Ombre colorate e leggere**: `shadow.intensity` sotto 1 e la terra della `HemisphereLight` calda.
4. **Buio negli angoli** (AO), che separa gli oggetti dal pavimento.
5. **Poco contrasto e pochi colori**: legno, osso, i quattro colori del marchio come accenti.

### Due esempi da guardare

- [**cozy-room**](https://github.com/Aubrey-Li/cozy-room) (licenza MIT, aggiornato il 7 novembre
  2026): una stanza isometrica costruita tutta in codice con Three, senza modelli. Nel `main.js`:
  camera ortografica, `HemisphereLight` più una `DirectionalLight` con ombra a 2048 e una luce di
  riempimento, ACES, `MeshStandardMaterial`, il gatto fatto di `CapsuleGeometry`. È la prova che il
  look si ottiene senza Blender. Usa ancora `PCFSoftShadowMap`, che in 0.186 non c'è più.
- Sul [forum di Three](https://discourse.threejs.org/t/isometric-interior-help-shaders-materials-lighting/63656)
  la domanda è esattamente questa («come rifaccio questo interno isometrico morbido»). L'unica
  risposta consiglia di **cuocere la luce in Blender** se si vuole spendere un tempo ragionevole, o
  in alternativa SSGI e SSAO con la libreria realism-effects. Quella libreria è ferma al maggio 2023
  e trascina con sé un'altra copia di Three: da scartare.

**La cottura in Blender** resta la qualità massima: la luce calcolata con il path tracing di Cycles
finisce in una texture, e nel browser non si calcola più niente
([Three.js Journey](https://www.threejs-journey.com/lessons/baking-and-exporting-the-scene)). Costa
però una pipeline intera (modellare in Blender, srotolare le UV, cuocere, esportare), e ogni volta che
si sposta una scrivania si rifà tutto. Per una redazione che cambia (il marchio, le prime pagine,
dove siede chi) la ricetta in codice qui sopra è il compromesso giusto.

---

## I modelli già fatti

Tutte le licenze sono quelle scritte sulle pagine ufficiali, aperte oggi. Pesi e contenuti li ho
letti dai file.

| Raccolta | Cosa c'è per una redazione | Licenza | Formato e peso | Animazioni | Somiglia al look? |
|---|---|---|---|---|---|
| [**Kenney Furniture Kit**](https://kenney.nl/assets/furniture-kit) | 140 modelli. Per noi: `desk`, `deskCorner`, `chairDesk`, `computerScreen`, `computerKeyboard`, `computerMouse`, `laptop`, `kitchenCoffeeMachine`, `plantSmall1-3`, `pottedPlant`, `bookcaseOpen`, `books`, `televisionModern`, `lampSquareFloor`, `trashcan`, `rugRectangle`, `loungeSofa`, `speaker` | **CC0** ([pagina della licenza](https://kenney.nl/support): «all game assets on the asset pages are public domain licensed (CC0)») | GLB, 140 file per 1,96 MB, **14 KB in media**; la scrivania 198 triangoli, la sedia 588. Nessuna texture: colori pieni nei materiali (`wood`, `metal`, `carpet`) | No | In parte: spigoli vivi, forme semplici. **I materiali sono `KHR_materials_unlit`**: Three li carica come `MeshBasicMaterial`, senza luci né ombre. Vanno sostituiti al caricamento (vedi sotto) |
| [**KayKit Furniture Bits**](https://kaylousberg.itch.io/furniture-bits) | 50+ modelli gratis (74 con il livello a pagamento): `desk`, `desk_large`, `desk_decorated`, `chair_desk_A/B`, `monitor`, `keyboard`, `mouse`, `mousepad`, `mug_A/B`, `cup_pencils`, `lamp_desk`, **`pictureframe_*`** (le cornici per le prime pagine), `shelf_*`, `book_set`, `cactus_*`, `rug_*`, `couch`. Niente macchina del caffè | **CC0** («free for personal and commercial use, no attribution required») | glTF + bin, una sola texture a sfumature da 1024 px (16 KB in PNG; la pagina dice che regge anche a 128). Scrivania 330 triangoli, sedia 626, monitor 168 | No | **Il più vicino**: forme piene e smussate, tinte pastello. Ma la texture va incorporata a parte (vedi sotto) |
| [**Kenney Mini Characters**](https://kenney.nl/assets/mini-characters) | Nella copia che ho aperto, 12 personaggi (6 donne, 6 uomini) con vestiti di tutti i giorni, più sedie a rotelle e ausili; la versione 2.0 sul sito dice di averne aggiunti altri | **CC0** | GLB da 273 KB l'uno, 876 triangoli. Uno **scheletro di 7 ossa** (gambe, busto, braccia, testa): in pratica pezzi rigidi. Una texture a tavolozza esterna (`Textures/colormap.png`) | 32 clip, fra cui `idle`, `walk`, `sit`, `interact-left/right`, `pick-up`, `emote-yes/no`, `holding-both`. Niente tastiera | Abbastanza: testa grande, corpo piccolo, ma a blocchetti, non morbido |
| [**KayKit Character Animations**](https://kaylousberg.itch.io/kaykit-character-animations) (con i personaggi KayKit) | 161 animazioni sullo scheletro `Rig_Medium`: per noi `Sit_Chair_Down`, `Sit_Chair_Idle`, `Sit_Chair_StandUp`, `Idle_A/B`, `Walking_A/B/C`, `Interact`, `Use_Item`, `Work_A-C`, `Cheering` | **CC0** | FBX e glTF, 14 MB il pacchetto gratuito. I personaggi gratuiti (Adventurers) sono fantasy e pesano **3,6 MB l'uno** con tutte le animazioni dentro, 6.000 triangoli | Sì, le più adatte a un ufficio | Stile chibi giusto, ma i personaggi gratuiti sono cavalieri e maghi |
| [**Quaternius Ultimate Animated Character Pack**](https://quaternius.com/packs/ultimatedanimatedcharacter.html) | 50+ personaggi, fra cui `Casual_*`, `Suit_*`, `Worker_*`, `Doctor_*`, `Chef_*` | **CC0** («free to use in personal and commercial projects») | La pagina dice FBX, OBJ, Blend; le copie pubbliche del pacchetto hanno anche glTF. `Casual_Male`: 6.500 triangoli, 23 ossa, **964 KB** di dati. Materiali a colore pieno con nomi chiari (`Skin`, `Shirt`, `Pants`, `Hair`): la maglietta si ricolora cambiando un colore | 17: `Idle`, `Walk`, `Run`, `SitDown`, `StandUp`, `PickUp`, `Victory`… Niente posa seduta in loop, niente tastiera | Low-poly sfaccettato, proporzioni quasi realistiche: meno morbido del video |
| [**Quaternius Universal Animation Library**](https://quaternius.com/packs/universalanimationlibrary.html) e Base Characters | 120+ animazioni (anche sedute) su uno scheletro umanoide; personaggi base da 13.000 triangoli | **CC0** | FBX, glTF | Sì, ma per personaggi realistici | No: proporzioni da videogioco realistico |
| [**Poly Pizza**](https://poly.pizza/) | 10.700+ modelli, anche da ufficio (scrivanie, stampanti, bacheche, telefoni), e i pacchetti di Quaternius e Kenney | **Misto, modello per modello**: la [scrivania di Quaternius](https://poly.pizza/m/V86Go2rlnq) è CC0, la [scrivania in piedi di dook](https://poly.pizza/m/uxIo5ge0pw) è CC BY 3.0. Le [condizioni](https://poly.pizza/docs/tos) rimandano alla licenza di ciascun modello | FBX e glTF | Raramente | Stili diversissimi fra loro: utile per un pezzo che manca, non per una stanza intera. Con CC BY va scritto autore e licenza nella pagina |

Scartato: il pacchetto ufficio gratuito di Polygonal Mind, che sta sotto la licenza standard del
Unity Asset Store, non sotto CC0.

### Come si incorporano senza rete

**Il file dentro la pagina.** Il GLB si scrive in base64 in una stringa, si decodifica e si passa al
caricatore senza nessuna richiesta:

```js
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
const byte = Uint8Array.from(atob(SCRIVANIA_B64), c => c.charCodeAt(0));
const gltf = await new GLTFLoader().parseAsync(byte.buffer, '');
```

`parseAsync(dati, percorso)` c'è in 0.186. Il base64 pesa un terzo in più del file.

**Le texture dentro un GLB sono un rischio.** Il caricatore di 0.186, per un'immagine dentro il GLB,
crea un indirizzo `blob:` e, su Safari 17 e successivi e su Chrome, la legge con `ImageBitmapLoader`,
cioè con una `fetch` (l'ho letto nel codice, righe 2633–2660 e 3368 di `GLTFLoader.js`). Se la CSP
dell'artifact non ammette `blob:` per le connessioni, la texture non arriva e il modello esce bianco.
Non ho potuto leggere la CSP dell'artifact. Le strade sicure:

- **modelli senza texture**, coi colori nei materiali (Kenney Furniture Kit, Quaternius): nessun
  problema;
- per KayKit e Kenney Mini Characters, che hanno una tavolozza in un'immagine: si toglie l'immagine
  dal file, la si incorpora come `data:image/png;base64,…` e la si assegna dopo con
  `new THREE.TextureLoader().load(dataURI)`, che usa un elemento `<img>` e non una `fetch`.
  Ricordarsi `texture.flipY = false` e `texture.colorSpace = THREE.SRGBColorSpace`, come fa il
  caricatore glTF.

**I materiali di Kenney vanno rifatti.** Dopo il caricamento si attraversa il modello e si mette un
`MeshStandardMaterial` al posto di ogni materiale, scegliendo il colore dal nome (`wood` diventa il
nostro legno, `metal` il nostro grigio): così entrano luci e ombre, e la palette diventa quella della
redazione.

**La compressione.**

- **Draco no.** Il `DRACOLoader` scarica il decodificatore (`draco_decoder.wasm`, 286 KB) dal
  percorso che gli si dà, cioè fa una richiesta di rete in più.
- **Meshopt sì, se la CSP lo lascia fare.** Il decodificatore è un modulo JavaScript da 29 KB
  (`examples/jsm/libs/meshopt_decoder.module.js`) che **porta il WebAssembly scritto dentro come
  stringa**: nessuna richiesta. Si collega con `loader.setMeshoptDecoder(MeshoptDecoder)`. Ma per
  compilare WebAssembly i browser chiedono `'wasm-unsafe-eval'` nella CSP: va provato nell'artifact
  con una riga, `new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0]))` dentro un `try`.
- **La quantizzazione basta quasi sempre.** [gltfpack](https://meshoptimizer.org/gltf/) quantizza
  la geometria per impostazione predefinita (`KHR_mesh_quantization`, che Three legge senza
  decodificatore); `-c` e `-cc` aggiungono la compressione meshopt, `-km` e `-kn` tengono i nomi di
  materiali e nodi, che servono per ricolorare. Per togliere le animazioni che non servono (le 32
  clip di Kenney) bastano poche righe con l'API di [glTF Transform](https://gltf-transform.dev/cli).

---

## I personaggi

**Raccomandazione: in codice, con le primitive.** Una sfera per la testa, una capsula per il
corpo, due capsule piccole per le braccia con il perno alla spalla, due sfere per le mani, due
capsule brevi per le gambe (sotto la scrivania non si vedono quasi mai), due capsule nere minuscole
per gli occhi, una calotta per i capelli. Tutto `MeshStandardMaterial` opaco come il resto della
stanza.

| | In codice (primitive) | Modelli animati già fatti |
|---|---|---|
| **Peso** | Zero: poche righe | Kenney Mini: 2,7 MB per dieci (3,5 MB in base64), forse 0,6–0,9 MB dopo aver tolto le clip inutili e quantizzato (stima). Quaternius: 9,6 MB per dieci, 12,3 MB in base64: fuori misura senza condividere le animazioni |
| **Coerenza** | Stessi spigoli tondi, stessi materiali, stessa luce della stanza fatta in codice | Kenney è a blocchetti, Quaternius sfaccettato, KayKit fantasy: accanto a scrivanie smussate in codice stonano |
| **Ricolorare la maglietta** | Un materiale per agente, un colore: fatto | Quaternius sì (materiale `Shirt`); Kenney e KayKit hanno la tavolozza in un'immagine: va ridipinta una cella per personaggio |
| **I gesti del brief** | Scrivere, girarsi, alzarsi, andare al caffè sono rotazioni e spostamenti di pezzi rigidi: pochi parametri ciascuno | Seduto, in piedi, camminata e «interagire» ci sono; **la tastiera non c'è in nessuna raccolta**: andrebbe aggiunta muovendo le ossa a mano sopra la posa seduta |
| **Prestazioni** | Nessuno scheletro da calcolare | Lo skinning di dieci personaggi sul Mac è irrilevante |
| **Rischio** | La camminata va tarata a mano (passo, dondolio, braccia); niente espressioni se non disegnate | Le texture nel GLB e il WebAssembly di meshopt (vedi sopra) |

L'argomento decisivo è che i personaggi già fatti più vicini al look, i Kenney Mini Characters,
hanno **sette ossa**: sono anch'essi pezzi rigidi incernierati. Le stesse pose si fanno con le
primitive, e con le primitive il personaggio ha gli stessi bordi morbidi del resto della stanza.

**I gesti, in pratica** (a 30 fotogrammi bastano tutti):

- *scrivere*: le due braccia oscillano di ±4° in controfase, 6–8 volte al secondo, con un po' di
  casualità; la testa si china di 3°;
- *girarsi*: sedia e corpo ruotano insieme in 0,4 secondi con un'accelerazione morbida;
- *alzarsi*: il corpo sale, le gambe si raddrizzano, la sedia arretra di 20 centimetri;
- *andare al caffè*: un percorso sul pavimento, il corpo dondola di 2 cm a ogni passo, le braccia
  oscillano; arrivato, una tazza (un cilindro con il sole del marchio) compare in mano;
- *respirare* (solo se «Riduci movimento» è spento): il busto si allarga di un 1% ogni 4 secondi.

Con «Riduci movimento» (`matchMedia('(prefers-reduced-motion: reduce)')`, e l'evento `change` per
quando lo si cambia a pagina aperta) non c'è nessun ciclo: un gesto diventa un cambio di posa
immediato, il personaggio che va al caffè sparisce dalla scrivania e compare alla macchina.

Se un giorno si vogliono personaggi già fatti, la scelta è **Kenney Mini Characters** (CC0, `sit`,
`walk`, `idle`, `interact` già pronti, 876 triangoli), togliendo le clip che non servono e
sostituendo i materiali.

---

## Il marchio nella scena

Tutto si disegna in codice su una tela 2D e diventa una texture: logo, schermo gigante, schermi a
parete, prime pagine incorniciate. Nessuna immagine, nessuna richiesta.

**Le regole per la nitidezza sul Retina** ([manuale, texture da canvas](https://threejs.org/manual/pages/canvas-textures.html)):

- La tela deve avere **almeno tanti pixel quanti ne occupa sullo schermo** l'oggetto, contati in
  pixel fisici (pixel ratio 2), meglio una volta e mezza. Lo schermo gigante che occupa 500 punti
  di larghezza ne vuole almeno 1.000: una tela da 2048 × 1152 va bene.
- `texture.colorSpace = THREE.SRGBColorSpace`, `texture.anisotropy =
  renderer.capabilities.getMaxAnisotropy()` (sul Mac 16): nell'isometria ogni superficie è vista di
  sbieco, e senza anisotropia il testo sul pavimento e sulle pareti si impasta.
- Dopo aver ridisegnato, `texture.needsUpdate = true` e poi si chiede un ridisegno della scena.
- Gli schermi accesi su `MeshBasicMaterial`: non risentono delle luci, quindi lo schermo resta
  luminoso come uno schermo vero anche dove cade l'ombra.

**Il logo come tracciato, non come immagine.** `new Path2D('M10 20 L…')` accetta lo stesso testo
del `d` di un tracciato SVG: si copia il tracciato del logo, si disegna con `ctx.fill(path)` alla
scala che serve, e resta nitido a qualunque dimensione. Il sole è un cerchio. È meglio che caricare
un SVG come immagine: niente attese, e nessun dubbio sulla «contaminazione» della tela (Safari non
la contamina più con gli SVG in `data:` dalla versione 8, [bug 129172](https://bugs.webkit.org/show_bug.cgi?id=129172),
ma con un tracciato la questione non si pone).

**Il testo.** Il font di sistema si usa direttamente (`ctx.font = '800 120px system-ui'`). Un font
da Google Fonts si può usare, ma prima di disegnare va aspettato:
`await document.fonts.load('800 120px "NomeFont"')`, altrimenti la prima tela esce col font di
ripiego e resta così finché non la si ridisegna. Niente `TextGeometry` (servono file di font in
JSON da centinaia di KB) e niente librerie di testo SDF che caricano font e lavoratori dalla rete.

**Le prime pagine incorniciate.** Una tela sola da 2048 × 2048 con otto pagine (quattro per due,
512 × 1024 ciascuna): testata, data, titolo d'apertura, due blocchi di colore al posto delle foto.
Ogni cornice (le `pictureframe_*` di KayKit, o una `RoundedBoxGeometry` sottile) mostra la sua
porzione con le coordinate UV del piano. Una texture invece di otto vuol dire una sola immagine in
memoria e una sola da aggiornare quando esce l'edizione nuova.

**Tazze, gadget, magliette.** Non serve una texture: la tazza è un cilindro nel colore del marchio
con un disco giallo appena sporgente (il sole), la maglietta è il materiale del corpo nel colore
dell'agente (giallo, arancio, blu, rosso) con un dischetto sul petto. Restano nitidi a qualunque
ingrandimento e costano zero. Per un decalco su una superficie curva c'è
[`DecalGeometry`](https://threejs.org/docs/pages/DecalGeometry.html).

**I colori del marchio sotto la luce calda.** Con `NeutralToneMapping` un colore della palette sotto
una luce bianca e uniforme esce quasi uguale; sotto una luce calda vira un po' verso l'arancio, ed è
giusto così per gli oggetti. Per lo schermo col logo, che deve avere il giallo esatto, la
`MeshBasicMaterial` lo tiene fuori dalle luci. Attenzione: con l'`EffectComposer` il tone mapping
lo applica l'`OutputPass` a tutta l'immagine (l'ho letto nel codice), quindi `toneMapped: false` sul
materiale non ha più effetto; è un motivo in più per scegliere Neutral, che i colori di base li
rispetta.

---

## Il peso della pagina

Stima per la stanza completa: una decina di scrivanie, sedie, monitor, piante, la lavagna, gli
schermi a parete, il desk circolare con l'anello di schermi, dieci personaggi.

| Pezzo | Tutto in codice | Con modelli già fatti | Note |
|---|---|---|---|
| Three.js 0.186.1 dalla CDN | 747 KB (190 KB compressi) | uguale | Arriva da jsDelivr, non è dentro la pagina |
| Addon (RoomEnvironment, RoundedBox, EffectComposer, RenderPass, GTAOPass, OutputPass e i loro shader) | ~97 KB dalla CDN, meno nella versione `+esm` minificata | + GLTFLoader 118 KB, meshopt 29 KB | Sempre `…/examples/jsm/…/+esm` della stessa versione |
| Codice della stanza e dei personaggi | 80–200 KB | 40–100 KB | Testo puro |
| Arredi | 0 | ~330 KB in base64 per 25 modelli Kenney; ~340 KB per 15 KayKit con la tavolozza; un terzo o metà dopo la quantizzazione (stima) | Pesi letti dai file |
| Personaggi | 0 | 0,6–0,9 MB per dieci Kenney Mini ripuliti (stima); 3,5 MB così come sono | Quaternius così com'è: 12 MB, da escludere |
| Logo, schermi, prime pagine | 0 (disegnati all'avvio) | 0 | Il costo è in memoria grafica, non nel file |
| **Totale della pagina** | **0,1–0,3 MB** | **1–2 MB** | Tetto 16 MB: lontanissimo |

**La memoria grafica**, che sul Mac non è un problema ma va saputa per l'iPhone: una mappa d'ombra a
4096 × 4096 occupa 64 MB, a 2048 16 MB; una tela da 2048 × 1024 circa 11 MB con le mipmap; quella da
2048 × 2048 delle prime pagine circa 22 MB; il buffer di disegno di un 16 pollici a pieno schermo
(3.456 × 2.234 pixel) circa 30 MB per ogni superficie, e il composer con il GTAO ne tiene diverse.

---

## Per dopo: iPhone e pieghevole

Quando si passerà al telefono, le leve sono queste, nell'ordine:

1. Pixel ratio al massimo 2 anche su un iPhone a 3× (nove volte i pixel a 3×, rapporto 4).
2. Via il GTAO: l'occlusione passa nei colori dei vertici, che costano zero.
3. Mappa d'ombra a 1024–2048, sempre ferma; `MeshLambertMaterial` per gli oggetti piccoli.
4. Tele per il marchio a 1024 invece che a 2048.
5. Il limite dei 30 fps vale sempre fino al primo tocco, e sempre col Risparmio energetico; un
   trascinamento a volte non lo sblocca. La scena ferma lo rende quasi invisibile.

---

## Cosa evitare

- **`PCFSoftShadowMap`**: in r186 è deprecata, e il renderer stampa un avviso e passa a
  `PCFShadowMap` (riga 9150 di `three.module.js`). Molti tutorial e anche cozy-room la usano ancora.
- **`+esm` di jsDelivr per pacchetti di terzi che dipendono da Three.** L'ho provato con n8ao 2.0.1,
  un'ottima occlusione ambientale: la sua versione `+esm` importa `three@0.185.1`, cioè **una
  seconda copia di Three** accanto alla 0.186.1, con tutti i guai del caso. Gli addon di Three via
  `+esm` invece puntano alla stessa versione (verificato su `GLTFLoader.js/+esm`). Se un giorno
  serve un pacchetto esterno, si usa un import map che fissa `three` e il suo file `dist`, non `+esm`.
- **Draco**: il decodificatore si scarica a parte.
- **GLB con le immagini dentro**, finché non si è provato che la CSP lascia passare `blob:`.
- **I materiali `KHR_materials_unlit` di Kenney lasciati come sono**: piatti e senza ombre, cioè il
  look scartato.
- **ACES o AgX con il giallo del marchio**: lo spengono.
- **`toneMapped: false` contando che funzioni con l'`EffectComposer`**: lì il tone mapping lo fa
  l'`OutputPass` su tutta l'immagine.
- **`ProgressiveLightMap`** (l'addon che accumula ombre morbide in una lightmap) con geometrie fatte
  in codice: vuole che le UV di ogni oggetto siano srotolate senza sovrapposizioni, e le scatole di
  Three hanno ogni faccia sulla stessa porzione di UV (l'ho letto nel codice dell'addon).
- **Far proiettare l'ombra a chi si muove**: obbliga a rifare la mappa a ogni fotogramma. Personaggi
  e sedie hanno la macchia, i mobili fermi l'ombra vera.
- **Più di una luce con l'ombra**: ognuna ridisegna la scena da capo.
- **Il ciclo sempre acceso** e le animazioni contate in fotogrammi invece che in secondi: fra Safari
  a 30 e Chrome a 120 la stessa camminata durerebbe quattro volte tanto.
- **Il pixel ratio pieno su un monitor 5K con il GTAO acceso**: 14,7 milioni di pixel a fotogramma.
  Il tetto a 8 milioni nella ricetta serve a questo.
- **`MeshToonMaterial`**: è il cartone animato a bande, non la creta.
- **I personaggi Quaternius o KayKit Adventurers così come sono**: 1–3,6 MB l'uno.

---

## Fonti

Three.js 0.186.1 (sorgente letto da jsDelivr): `build/three.module.js`, `build/three.core.js`,
`examples/jsm/loaders/GLTFLoader.js`, `examples/jsm/libs/meshopt_decoder.module.js`,
`examples/jsm/postprocessing/GTAOPass.js` e `OutputPass.js`, `examples/jsm/misc/ProgressiveLightMap.js`,
`examples/jsm/lighting/LightProbeGridWebGL.js`. Esempi del tag `r186`:
[contact shadow](https://threejs.org/examples/webgl_shadow_contact.html),
[GTAO](https://threejs.org/examples/webgl_postprocessing_gtao.html),
[light probes](https://threejs.org/examples/webgl_lightprobes.html),
[VSM](https://threejs.org/examples/webgl_shadowmap_vsm.html),
[lightmap progressiva](https://threejs.org/examples/webgl_shadowmap_progressive.html).
Manuale: [disegno a richiesta](https://threejs.org/manual/pages/rendering-on-demand.html),
[ombre](https://threejs.org/manual/pages/shadows.html),
[texture da canvas](https://threejs.org/manual/pages/canvas-textures.html),
[colori](https://threejs.org/manual/pages/color-management.html).

WebKit: [Document.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/dom/Document.cpp),
[AnimationFrameRate.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp),
[LowPowerModeNotifier.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/cocoa/LowPowerModeNotifier.mm),
[r215070](https://trac.webkit.org/r215070), [bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745),
[bug 129172](https://bugs.webkit.org/show_bug.cgi?id=129172). Chromium:
[rendering pipeline throttling](https://groups.google.com/a/chromium.org/g/blink-dev/c/NJIVCmBAwkw).
[Motion, quando i browser rallentano rAF](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe).

Modelli: [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit),
[Kenney Mini Characters](https://kenney.nl/assets/mini-characters),
[licenza Kenney](https://kenney.nl/support),
[KayKit Furniture Bits](https://kaylousberg.itch.io/furniture-bits),
[KayKit Character Animations](https://kaylousberg.itch.io/kaykit-character-animations),
[Quaternius Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter.html),
[Quaternius Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html),
[Poly Pizza](https://poly.pizza/) e le sue [condizioni](https://poly.pizza/docs/tos). Strumenti:
[gltfpack](https://meshoptimizer.org/gltf/), [glTF Transform](https://gltf-transform.dev/cli).
Colore: [model-viewer, tone mapping](https://modelviewer.dev/examples/tone-mapping).
