  /* ================================================================ le luci */
  const emisfero = new THREE.HemisphereLight(0xffffff, 0xd9cdb8, 1); scene.add(emisfero);
  const solare = new THREE.DirectionalLight(0xffffff, 2.5); scene.add(solare, solare.target);
  const centro = new THREE.Vector3(LARGA / 2, 0.9, FONDA / 2); solare.target.position.copy(centro);
  solare.castShadow = true; solare.shadow.mapSize.set(4096, 4096);
  Object.assign(solare.shadow.camera, { left: -11.5, right: 11.5, top: 11.5, bottom: -11.5, near: 1, far: 50 }); solare.shadow.camera.updateProjectionMatrix();
  solare.shadow.bias = -0.0005; solare.shadow.normalBias = 0.035; solare.shadow.radius = 7;
  const LUCI = {
    alba:   { da: [-7, 4.4, 6], sole: 0xFFAE6E, soleI: 2.7, cielo: 0xFFDDBB, terra: 0xD8B596, emiI: 0.56, env: 0.22, lampade: 0.3, ombra: 0.6 },
    giorno: { da: [-4.5, 9, 6.5], sole: 0xFFF4E2, soleI: 2.4, cielo: 0xFFFFFF, terra: 0xDCD0BC, emiI: 0.55, env: 0.3, lampade: 0, ombra: 0.6 },
    sera:   { da: [5, 6, 7], sole: 0x8E9BE8, soleI: 0.55, cielo: 0x8C92D6, terra: 0x4A456B, emiI: 0.3, env: 0.1, lampade: 1, ombra: 0.5 },
    notte:  { da: [4, 9, 6], sole: 0x6F86D6, soleI: 0.3, cielo: 0x4A5AA8, terra: 0x23264A, emiI: 0.25, env: 0.06, lampade: 1, ombra: 0.45 },
  };
  let sporca = true, scelta = 'adesso';
  function oraDiRoma() { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    return (+p.find(q => q.type === 'hour').value % 24) + (+p.find(q => q.type === 'minute').value) / 60; }
  const luceDiAdesso = () => { const h = oraDiRoma(); return h < 6.3 ? 'notte' : h < 8 ? 'alba' : h < 16.4 ? 'giorno' : h < 19 ? 'sera' : 'notte'; };
  function luce(quale) {
    scelta = quale; const nome = quale === 'adesso' ? luceDiAdesso() : quale, L = LUCI[nome]; document.documentElement.dataset.luce = nome;
    solare.color.set(L.sole); solare.intensity = L.soleI; solare.position.copy(centro).add(new THREE.Vector3(...L.da)); solare.shadow.intensity = L.ombra;
    emisfero.color.set(L.cielo); emisfero.groundColor.set(L.terra); emisfero.intensity = L.emiI; scene.environmentIntensity = L.env;
    lampade.forEach(l => { l.intensity = l.userData.max * L.lampade; }); paralumi.forEach(m => { m.emissiveIntensity = 1.6 * L.lampade; });
    vista.map = cieli[nome]; vista.needsUpdate = true;
    document.querySelectorAll('.luci button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.luce === quale))); sporca = true;
  }
  document.querySelectorAll('.luci button').forEach(b => b.addEventListener('click', () => luce(b.dataset.luce)));
  setInterval(() => { if (scelta === 'adesso' && document.documentElement.dataset.luce !== luceDiAdesso()) luce('adesso'); }, 60000);

  /* ================================================================ la camera: isometrica, ferma */
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
  const DIR = new THREE.Vector3(1, 0.8, 1).normalize();
  cam.position.copy(centro).addScaledVector(DIR, 40); cam.lookAt(centro); cam.updateMatrixWorld();
  const DESTRA = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), SU = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  const sulPiano = p => { const d = p.clone().sub(centro); return [d.dot(DESTRA), d.dot(SU)]; };
  vita(8);
  const ingombro = new THREE.Box3().setFromObject(stanza); let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const x of [ingombro.min.x, ingombro.max.x]) for (const y of [ingombro.min.y, ingombro.max.y]) for (const z of [ingombro.min.z, ingombro.max.z]) {
    const [a, b] = sulPiano(new THREE.Vector3(x, y, z)); minX = Math.min(minX, a); maxX = Math.max(maxX, a); minY = Math.min(minY, b); maxY = Math.max(maxY, b); }
  const CASA = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, zoom: 1 }, AMPIA = maxX - minX, ALTEZZA = maxY - minY;
  const inq = { ...CASA }, meta = { ...CASA }; let mezza = 5, ppu = 100, pronta = false;
  function inquadra() { cam.position.copy(centro).addScaledVector(DIR, 40).addScaledVector(DESTRA, inq.x).addScaledVector(SU, inq.y); cam.zoom = inq.zoom; cam.updateProjectionMatrix(); sporca = true; }
  function misura() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); const asp = w / h;
    mezza = Math.max(ALTEZZA / 2 * 1.1, AMPIA / 2 / asp * 1.04); ppu = h / (2 * mezza);
    cam.left = -mezza * asp; cam.right = mezza * asp; cam.top = mezza; cam.bottom = -mezza; inquadra();
    if (pronta) { renderer.render(scene, cam); etichette(); sporca = false; }
  }
  new ResizeObserver(misura).observe(canvas); misura();

