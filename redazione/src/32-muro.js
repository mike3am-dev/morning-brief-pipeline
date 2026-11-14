  /* ================================================================ il muro delle notizie, sulla parete di fondo
     In cima cinque orologi e il conto alla rovescia; in mezzo le discussioni, la mappa, la borsa e le fonti; in basso
     la striscia dell'ultim'ora. Sulla parete di sinistra, in alto, i tre schermi dei canali. */
  const MZ = 0.076, nerissimo = M(0x0B0D12, { roughness: 0.45 });
  stanza.add(at(box(MURO.w + 0.16, 2.2, 0.07, nerissimo, 0.02), MURO.x, 1.84, 0.036));
  [['San Francisco', 'America/Los_Angeles', 5.14], ['New York', 'America/New_York', 5.61], ['Londra', 'Europe/London', 6.08], ['Milano', 'Europe/Rome', 8.48], ['Tokyo', 'Asia/Tokyo', 8.95]].forEach(([nome, fuso, x]) => {
    stanza.add(at(orologioDi(fuso, 0.15), x, 2.73, MZ + 0.012), at(schermo(0.42, 0.42 * 64 / 220, texCitta(nome)), x, 2.5, MZ)); });

  // le discussioni, in piedi a sinistra
  const xRullo = MURO.sin + 0.39;
  rullo.tex.repeat.set(1, 640 / rullo.alta); rullo.tex.offset.set(0, 1 - 640 / rullo.alta);
  stanza.add(at(schermo(0.78, 0.12, texDiscussioni), xRullo, 2.32, MZ), at(schermo(0.78, 1.28, rullo.tex), xRullo, 1.62, MZ));
  // la mappa
  const mappaSin = MURO.sin + 0.82, mappaSu = 2.38, PX = 0.002;
  stanza.add(at(schermo(2.76, 1.4, texMappa), mappaSin + 1.38, 1.68, MZ));
  const PING = [], geoAnello = new THREE.RingGeometry(0.72, 1, 40);
  const ping = (lon, lat, r, colore, periodo, fase) => { const [a, b] = suMappa(lon, lat), m = new THREE.Mesh(geoAnello, new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    at(m, mappaSin + a * PX, mappaSu - b * PX, MZ + 0.004); stanza.add(m); PING.push({ m, r, periodo, fase }); };
  (MAPPA.luoghi || []).forEach((l, i) => ping(l.lon, l.lat, raggioDi(l) * PX * 2.6, 0xF5C518, 3.4 + (i % 4) * 0.7, i * 0.37));
  Object.keys(caldePer).forEach((luogo, i) => { const c = MAPPA.calde.find(q => q.luogo === luogo); ping(c.lon, c.lat, 0.085, 0xFF3B55, 1.6, i * 0.5); ping(c.lon, c.lat, 0.085, 0xFF3B55, 1.6, i * 0.5 + 0.8); });
  // la borsa e le fonti, a destra
  const xDestra = MURO.sin + MURO.w - 0.37;
  stanza.add(at(schermo(0.74, 0.68, texBorsa), xDestra, 2.04, MZ), at(schermo(0.74, 0.68, texFonti), xDestra, 1.32, MZ));
  // la striscia dell'ultim'ora
  const largaNastro = MURO.w - 0.5625;
  nastro.tex.repeat.set(largaNastro * 640 / nastro.larga, 1);
  stanza.add(at(schermo(0.5625, 0.15, texUltimora), MURO.sin + 0.28125, 0.86, MZ), at(schermo(largaNastro, 0.15, nastro.tex), MURO.sin + 0.5625 + largaNastro / 2, 0.86, MZ));
  const chiarore = new THREE.PointLight(0x9CC4FF, 0, 5, 1.6); chiarore.position.set(MURO.x, 1.7, 1.0); chiarore.userData.max = 7; lampade.push(chiarore); stanza.add(chiarore);   // la sera il muro illumina chi gli sta davanti

  // i canali: tre schermi in alto sulla parete di sinistra, sopra la lavagna e la bacheca
  const TV = [3.62, 4.88, 6.5].map((z, i) => { const mat = new THREE.MeshBasicMaterial({ map: canali[i][0], toneMapped: false }), s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), mat); s.rotation.y = PI / 2;
    stanza.add(at(box(0.05, 0.5, 0.86, nerissimo, 0.015), 0.03, 2.7, z), at(s, 0.058, 2.7, z)); viviSchermi.push(mat); return { mat, i }; });

  // tutto quello che sul muro si muove: gli anelli, il nastro, il rullo, i canali. `fretta` è 1 di solito, di più quando si chiude
  let oraMuro = 0, ultimoMuro = 0;
  function muroVivo(adesso, fretta = 1) {
    const dt = Math.min(0.2, Math.max(0, adesso - ultimoMuro)); ultimoMuro = adesso; oraMuro += dt * fretta;
    for (const p of PING) { const u = ((oraMuro / p.periodo + p.fase) % 1 + 1) % 1; p.m.scale.setScalar(p.r * (0.35 + 0.9 * u)); p.m.material.opacity = 0.9 * (1 - u) * (1 - u); }
    nastro.tex.offset.x = (nastro.tex.offset.x + dt * (0.11 + 0.05 * (fretta - 1)) * 640 / nastro.larga) % 1;
    if (rullo.scorre) rullo.tex.offset.y = ((rullo.tex.offset.y - dt * 0.018 * 500 / rullo.alta) % 1 + 1) % 1;
    for (const t of TV) { const serie = canali[t.i], quale = serie[Math.floor(adesso / 9 + t.i * 0.4) % serie.length]; if (t.mat.map !== quale) { t.mat.map = quale; t.mat.needsUpdate = true; } }
    viviSchermi.forEach((m, i) => { m.color.setScalar(1 - (0.035 + 0.03 * (fretta - 1)) * (1 + Math.sin(adesso * (1.7 + (i % 7) * 0.41) + i * 1.3))); });
  }

