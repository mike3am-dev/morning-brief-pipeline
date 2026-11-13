const C = { bone: '#EDEAE3', paper: '#F8F6F2', ink: '#17181B', ink2: '#4B4D53', ink3: '#7C7F87',
  yellow: '#F5C518', orange: '#F0821E', red: '#E01F3D', blue: '#0E9CD8' };
const DISPLAY = '"Avenir Next Condensed","HelveticaNeue-CondensedBold","Helvetica Neue",Arial,sans-serif';
const SISTEMA = '-apple-system,"SF Pro Display",system-ui,"Helvetica Neue",Arial,sans-serif';
const PENNARELLO = '"Marker Felt","Chalkboard SE","Comic Sans MS",sans-serif';
const A_MANO = '"Bradley Hand","Noteworthy","Marker Felt",cursive';
const GRAZIE = '"Apple Garamond","Garamond","Baskerville","Times New Roman",serif';
const CORSIVO = '"Snell Roundhand","Apple Chancery","Brush Script MT",cursive';
const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PI = Math.PI;

try { avvia(); } catch (e) { guasto(e); }
function guasto(e) {
  const el = document.getElementById('errore'); el.hidden = false;
  el.textContent = 'La stanza non si è accesa: ' + (e && e.message ? e.message : e);
  console.error(e);
}

function avvia() {
  const canvas = document.getElementById('scena');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

