  /* ================================================================ i posti e le persone */
  const schermoDi = id => texSchermo(AGENTI[id] || { id, mestiere: '', dettagli: [] });
  const posti = {
    lettura:    posto({ x: 1.6, z: 2.2, tex: schermoDi('lettura'), mento: 0xC9DDF2, retro: 0x2F6FD0 }),
    redattore:  posto({ x: 3.2, z: 2.2, tex: schermoDi('redattore'), mento: 0xF9D2B0, retro: 0xF0821E }),
    revisore:   posto({ x: 5.75, z: 2.2, tex: schermoDi('revisore'), mento: 0xF6C7CF, retro: 0xE2385A }),
    visualista: posto({ x: 7.35, z: 2.2, tex: schermoDi('visualista'), mento: 0xFBE9A8, retro: 0xF2B705 }),
    gta:        posto({ x: 10.0, z: 2.2, tex: schermoDi('gta'), mento: 0xC8F2EC, retro: 0x1FB5A6 }),
    ai:         posto({ x: 9.9, z: 4.85, giro: PI, tex: schermoDi('ai'), mento: 0xCFE8D5, retro: 0x2F8F5A }),
    schede:     posto({ x: 9.9, z: 5.7, tex: schermoDi('schede'), mento: 0xDDD3F2, retro: 0x7B4BE0 }),
  };
  // la regia: Olivia sta in piedi al centro dell'anello; tre schermi li vediamo di fronte, due di spalle
  const R_IN = 0.62, R_OUT = 1.12, VARCO = 0.55, FRONTE = 5 * PI / 4;
  const regiaG = anello(REGIA[0], REGIA[1], R_IN, R_OUT, VARCO);
  [[FRONTE, 0], [FRONTE - 0.74, 1], [FRONTE + 0.74, 2], [PI / 4 + 1.2, 1], [PI / 4 - 1.2, 2]].forEach(([a, quale], i) => {
    const m = imac(texRegia[quale], i < 3 ? 0xE6E7EA : 0xFBE9A8, i < 3 ? 0xC9CCD1 : 0xF2B705); m.rotation.y = a + PI; regiaG.add(at(m, Math.sin(a) * 0.92, TAV, Math.cos(a) * 0.92)); });
  const sulAnello = (o, a, r, giro = 0) => { o.rotation.y = a + PI + giro; regiaG.add(at(o, Math.sin(a) * r, o.position.y || TAV, Math.cos(a) * r)); return o; };
  sulAnello(tastiera(), FRONTE, 0.71);
  sulAnello(gruppo(...[0, 1, 2].map(i => { const f = at(box(0.21, 0.004, 0.297, bianco, 0.001), 0, 0.002 + i * 0.005, 0); f.rotation.y = i * 0.11; return f; })), FRONTE + 1.42, 0.86, 0.3);
  posti.regia = { inPiedi: true, seduta: [REGIA[0], REGIA[1]], yaw: FRONTE };
  posti.fonti = { inPiedi: true, seduta: [1.02, ARCHIVIO[1]], yaw: -PI / 2 };

  // le tazze: una sulla scrivania e la stessa in mano, per chi va a prendersi il caffè
  const TAZZE = { regia: C.yellow, lettura: C.blue, redattore: C.orange, ai: C.red, gta: '#FF5DA2' }, tazze = {}, tazzeMano = {};
  for (const id of ['lettura', 'redattore', 'ai', 'gta']) { tazze[id] = at(tazza(TAZZE[id], PI * 0.2), -0.52, TAV, 0.1); posti[id].g.add(tazze[id]); }
  tazze.regia = tazza(TAZZE.regia, 0); tazze.regia.position.y = TAV; sulAnello(tazze.regia, FRONTE - 1.38, 0.84);
  posti.revisore.g.add(at(tazza(C.red, PI * 0.2), -0.54, TAV, 0.0)); posti.schede.g.add(at(tazza('#7B4BE0', PI * 0.2), -0.54, TAV, 0.08));
  // sulla scrivania di Ettore: le bozze, la lampada gialla
  const pE = posti.redattore, pI = posti.revisore;
  pE.g.add(at(gruppo(...[0, 1, 2].map(i => { const f = at(box(0.21, 0.004, 0.297, bianco, 0.001), 0, 0.002 + i * 0.005, 0); f.rotation.y = i * 0.09; return f; })), 0.54, TAV, -0.12));
  const foglioDaIvo = stampa(0.21, 0.297, foglio(5)); foglioDaIvo.rotation.set(-PI / 2, 0, -0.25); foglioDaIvo.visible = false; pE.g.add(at(foglioDaIvo, 0.5, TAV + 0.02, 0.2));
  const cappa = M(0xF5C518, { roughness: 0.5, emissive: 0xFFB400, emissiveIntensity: 0 }); paralumi.push(cappa);
  pE.g.add(at(gruppo(at(cyl(0.07, 0.08, 0.02, M(0xF5C518, { roughness: 0.5 }), 20), 0, 0.01, 0), at(cyl(0.01, 0.01, 0.34, nero, 8), 0, 0.18, 0),
    (() => { const c = ombra(new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.12, 24, 1, true), cappa)); c.material.side = THREE.DoubleSide; c.position.set(0.05, 0.36, 0.05); c.rotation.set(0.5, 0, -0.5); return c; })()), -0.6, TAV, -0.26));
  punto(0xFFC860, 5, pE.x - 0.55, 1.2, pE.z - 0.15, 3.2);
  // di Ivo: le bozze di Ettore corrette a penna
  const bozzeIvo = [[0.44, 0.1, 0.28, 11], [0.4, 0.14, -0.2, 23], [0.5, 0.06, 0.5, 37]].map(([x, z, r, seme], i) => { const f = stampa(0.21, 0.297, foglio(seme)); f.rotation.set(-PI / 2, 0, r); f.userData.r = r; pI.g.add(at(f, x, TAV + 0.002 + i * 0.002, z)); return f; });
  // di Tobia: la pila dei giornali da leggere; di Lea: la tavoletta e le matite; di Ada: il robottino; di Rita: il razzo; di Vito: la lattina
  posti.lettura.g.add(at(gruppo(...[0, 1, 2, 3, 4, 5].map(i => { const f = at(box(0.3, 0.018, 0.22, i % 2 ? M(0xEFEBE2) : bianco, 0.004), 0, 0.009 + i * 0.019, 0); f.rotation.y = (i % 3 - 1) * 0.12; return f; })), 0.5, TAV, -0.1));
  const pL = posti.visualista; for (const p of [pL, pI]) p.g.children.forEach(c => { if (c.isMesh && c.geometry.type === 'SphereGeometry') c.visible = false; });   // niente mouse per Lea (disegna sulla tavoletta) né per Ivo (ha le bozze)
  pL.g.add(at(box(0.3, 0.012, 0.21, M(0x2A2B30, { roughness: 0.5 }), 0.006), 0.4, TAV + 0.006, 0.24), at(box(0.25, 0.002, 0.16, M(0x4A4C55, { roughness: 0.3 }), 0.001), 0.4, TAV + 0.013, 0.24));
  pL.g.add(at(gruppo(cyl(0.04, 0.035, 0.09, bianco, 18), ...[0xE01F3D, 0xF5C518, 0x0E9CD8, 0xF0821E, 0x17181B].map((c, i) => { const m = cyl(0.005, 0.005, 0.15, M(c), 6); m.position.set(Math.sin(i * 1.3) * 0.016, 0.06, Math.cos(i * 1.3) * 0.016); m.rotation.set(Math.cos(i * 1.3) * 0.2, 0, -Math.sin(i * 1.3) * 0.2); return m; })), -0.5, TAV + 0.045, -0.12));
  const robot = gruppo(at(box(0.07, 0.08, 0.05, M(0xE01F3D, { roughness: 0.4 }), 0.012), 0, 0.05, 0), at(box(0.085, 0.06, 0.06, bianco, 0.015), 0, 0.125, 0), at(sph(0.01, M(SCURO)), -0.02, 0.13, 0.031), at(sph(0.01, M(SCURO)), 0.02, 0.13, 0.031), at(cyl(0.003, 0.003, 0.04, nero, 6), 0, 0.17, 0), at(sph(0.009, M(0xF5C518)), 0, 0.192, 0));
  robot.rotation.y = PI + 0.5; posti.ai.g.add(at(robot, 0.52, TAV, -0.1));
  const razzo = gruppo(at(cyl(0.028, 0.028, 0.14, bianco, 16), 0, 0.1, 0), (() => { const c = ombra(new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.06, 16), M(0xE01F3D, { roughness: 0.4 }))); c.position.y = 0.2; return c; })(),
    ...[0, 1, 2].map(i => { const a = box(0.006, 0.05, 0.04, M(0xE01F3D), 0.002); a.position.set(Math.sin(i * 2.094) * 0.035, 0.045, Math.cos(i * 2.094) * 0.035); a.rotation.y = i * 2.094; return a; }), at(sph(0.012, M(0x0E9CD8, { roughness: 0.2 })), 0, 0.13, 0.024));
  posti.schede.g.add(at(razzo, 0.55, TAV, -0.14));
  posti.gta.g.add(at(cyl(0.028, 0.028, 0.11, M(0x3FE0D0, { metalness: 0.5, roughness: 0.3 }), 16), 0.56, TAV + 0.055, -0.05));

