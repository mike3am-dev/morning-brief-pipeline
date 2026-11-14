  /* ================================================================ i posti e le persone */
  const schermoDi = id => texSchermo(AGENTI[id] || { id, mestiere: '', dettagli: [] });
  /* Quattro gruppi di lavoro, e la regia in mezzo.
     - L'EDIZIONE e LE SCHEDE sono isole da quattro: due scrivanie affiancate, e di fronte altre due. Chi sta nella fila
       in fondo guarda verso di noi (gli vediamo il viso), chi sta in quella davanti ci dà le spalle (gli vediamo lo schermo).
       Nell'edizione le carte fanno il giro: Tobia le passa a Ettore, accanto; Ettore a Ivo, di fronte; Nora, di fronte
       a Tobia, controlla le fonti. Nelle schede: Ada e Dario in fondo, Rita e Vito davanti.
     - DESIGN è una coppia affiancata davanti al muro delle notizie: Lea (i grafici) e Bruno (le foto).
     - ARCHIVIO è una coppia una di fronte all'altra, accanto agli schedari: Zeno (le fonti, il lunedì) e Clio (le storie). */
  const ISOLE = { edizione: [3.1, 3.3], schede: [11.4, 3.3], design: [7.55, 2.25], archivio: [2.3, 7.2] };
  const banco = (isola, lato, fila, o) => posto({ x: ISOLE[isola][0] + lato * 0.735, z: ISOLE[isola][1] + fila * 0.41, giro: fila < 0 ? PI : 0, ...o });   // fila −1: in fondo; +1: davanti
  const posti = {
    lettura:    banco('edizione', -1, 1, { tex: schermoDi('lettura'), mento: 0xC9DDF2, retro: 0x2F6FD0 }),
    redattore:  banco('edizione', 1, 1, { tex: schermoDi('redattore'), mento: 0xF9D2B0, retro: 0xF0821E }),
    verifica:   banco('edizione', -1, -1, { tex: schermoDi('verifica'), mento: 0xCDEBE5, retro: 0x0F8B7A }),
    revisore:   banco('edizione', 1, -1, { tex: schermoDi('revisore'), mento: 0xF6C7CF, retro: 0xE2385A }),
    ai:         banco('schede', -1, -1, { tex: schermoDi('ai'), mento: 0xF7D3D3, retro: 0xD23B3B }),
    rete:       banco('schede', 1, -1, { tex: schermoDi('rete'), mento: 0xD9DDFB, retro: 0x5B6CFF }),
    schede:     banco('schede', -1, 1, { tex: schermoDi('schede'), mento: 0xDDD3F2, retro: 0x7B4BE0 }),
    gta:        banco('schede', 1, 1, { tex: schermoDi('gta'), mento: 0xC8F2EC, retro: 0x1FB5A6, gaming: true }),
    visualista: posto({ x: ISOLE.design[0] - 0.735, z: ISOLE.design[1], tex: schermoDi('visualista'), mento: 0xFBE9A8, retro: 0xF2B705 }),
    foto:       posto({ x: ISOLE.design[0] + 0.735, z: ISOLE.design[1], tex: schermoDi('foto'), mento: 0xE9DCC8, retro: 0x8A6A45 }),
    fonti:      posto({ x: ISOLE.archivio[0] - 0.41, z: ISOLE.archivio[1], giro: -PI / 2, tex: schermoDi('fonti'), mento: 0xD5E8DA, retro: 0x2F7A4C }),
    memoria:    posto({ x: ISOLE.archivio[0] + 0.41, z: ISOLE.archivio[1], giro: PI / 2, tex: schermoDi('memoria'), mento: 0xE6D6F2, retro: 0x8E4FB8 }),
  };
  // il segnaposto di Zeno, sulla sua scrivania. Il lunedì dice che è il giorno del rapporto
  { const c = cavaliere('ZENO', LUNEDI ? 'oggi il rapporto' : 'le fonti', '#2F7A4C'); c.rotation.y = PI / 4 - posti.fonti.giro; posti.fonti.g.add(at(c, 0.5, TAV, -0.2)); }
  // la regia: Olivia sta in piedi al centro dell'anello; tre schermi li vediamo di fronte, due di spalle
  const R_IN = 0.62, R_OUT = 1.12, VARCO = 0.55, FRONTE = 5 * PI / 4;
  const regiaG = anello(REGIA[0], REGIA[1], R_IN, R_OUT, VARCO);
  [[FRONTE, 0], [FRONTE - 0.74, 1], [FRONTE + 0.74, 2], [PI / 4 + 1.2, 1], [PI / 4 - 1.2, 2]].forEach(([a, quale], i) => {
    const m = imac(texRegia[quale], i < 3 ? 0xE6E7EA : 0xFBE9A8, i < 3 ? 0xC9CCD1 : 0xF2B705); m.rotation.y = a + PI; regiaG.add(at(m, Math.sin(a) * 0.92, TAV, Math.cos(a) * 0.92)); });
  const sulAnello = (o, a, r, giro = 0) => { o.rotation.y = a + PI + giro; regiaG.add(at(o, Math.sin(a) * r, o.position.y || TAV, Math.cos(a) * r)); return o; };
  sulAnello(tastiera(), FRONTE, 0.71);
  sulAnello(gruppo(...[0, 1, 2].map(i => { const f = at(box(0.21, 0.004, 0.297, bianco, 0.001), 0, 0.002 + i * 0.005, 0); f.rotation.y = i * 0.11; return f; })), FRONTE + 1.42, 0.86, 0.3);
  posti.regia = { inPiedi: true, seduta: [REGIA[0], REGIA[1]], yaw: FRONTE };

  // le tazze: una sulla scrivania e la stessa in mano, per chi va a prendersi il caffè
  const TAZZE = { regia: C.yellow, lettura: C.blue, redattore: C.orange, ai: C.red, gta: '#FF5DA2', rete: '#5B6CFF' }, tazze = {}, tazzeMano = {};
  for (const id of ['lettura', 'redattore', 'ai', 'gta', 'rete']) { tazze[id] = at(tazza(TAZZE[id], PI * 0.2), -0.52, TAV, 0.1); posti[id].g.add(tazze[id]); }
  tazze.regia = tazza(TAZZE.regia, 0); tazze.regia.position.y = TAV; sulAnello(tazze.regia, FRONTE - 1.38, 0.84);
  posti.revisore.g.add(at(tazza(C.red, PI * 0.2), -0.54, TAV, 0.0)); posti.schede.g.add(at(tazza('#7B4BE0', PI * 0.2), -0.54, TAV, 0.08));
  posti.verifica.g.add(at(tazza('#0F8B7A', PI * 0.2), -0.54, TAV, 0.02)); posti.memoria.g.add(at(tazza('#8E4FB8', PI * 0.2), -0.54, TAV, 0.06)); posti.foto.g.add(at(tazza(C.yellow, PI * 0.2), -0.54, TAV, 0.04));
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
  // la postazione di Vito: la lattina, il portapenne (due le usa come bacchette), la barra di luce sotto lo schermo, la palma al neon di Vice City; la tazza sta a destra, dove la prende
  posti.gta.g.add(at(cyl(0.028, 0.028, 0.11, M(0x3FE0D0, { metalness: 0.5, roughness: 0.3 }), 16), -0.6, TAV + 0.055, 0.04)); tazze.gta.position.set(0.52, TAV, 0.14);
  const penneNelBicchiere = [[0x2F6FD0, -0.012, 0.12], [0xE01F3D, 0.012, -0.1], [0x17181B, 0.0, 0.3]].map(([c, dx, piega]) => { const p = cyl(0.0065, 0.0065, 0.15, M(c, { roughness: 0.4 }), 8); p.position.set(dx, 0.1, dx * 0.6); p.rotation.z = piega * 0.5; p.rotation.x = piega * 0.4; return p; });
  posti.gta.g.add(at(gruppo(cyl(0.036, 0.032, 0.085, M(0x2A2B30, { roughness: 0.5 }), 18), ...penneNelBicchiere), -0.36, TAV + 0.0425, -0.22));
  const neonRosa = new THREE.MeshBasicMaterial({ color: 0xFF5DA2, toneMapped: false }), neonTurchese = new THREE.MeshBasicMaterial({ color: 0x3FE0D0, toneMapped: false });
  posti.gta.g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.012, 0.016), neonRosa), 0, TAV + 0.008, -0.11));
  { const palma = gruppo(at(cyl(0.05, 0.055, 0.016, M(0x17181B, { roughness: 0.5 }), 18), 0, 0.008, 0), (() => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.2, 8), neonTurchese); t.position.set(0.012, 0.115, 0); t.rotation.z = -0.12; return t; })(),
      ...[0, 1, 2, 3, 4].map(i => { const f = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 14, 1.5), neonRosa); f.position.set(0.024, 0.2, 0); f.rotation.set(0, i * 1.257, 0.35); return f; }));
    posti.gta.g.add(at(palma, -0.57, TAV, -0.27)); punto(0xFF5DA2, 2.2, posti.gta.x - 0.4, 1.0, posti.gta.z - 0.1, 1.6); }
  // dei quattro nuovi. Di Nora: la lente sul tavolo; di Bruno: le stampe di prova; di Dario: il telefono sul suo piedino; di Clio: lo schedario da tavolo e la lampada verde
  { const l = gruppo(ombra(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 10, 26), alluminio)), at(box(0.014, 0.012, 0.1, nero, 0.004), 0, 0, 0.1)); l.children[0].rotation.x = PI / 2; l.rotation.y = 0.6; posti.verifica.g.add(at(l, 0.5, TAV + 0.011, 0.05)); }
  posti.foto.g.add(at(gruppo(...[[0xE7B98A, 0], [0x8FB7D9, 1], [0xC9D7A0, 2]].map(([c, i]) => { const f = at(box(0.15, 0.004, 0.11, M(c, { roughness: 0.6 }), 0.001), i * 0.012, 0.002 + i * 0.005, i * 0.01); f.rotation.y = (i - 1) * 0.22; return f; })), 0.5, TAV, 0.05));
  { const t = gruppo(at(box(0.075, 0.15, 0.01, M(0x17181B, { roughness: 0.3 }), 0.006), 0, 0.085, 0), at(box(0.064, 0.13, 0.002, M(0x7CC6F2, { roughness: 0.2, emissive: 0x2A6E9A, emissiveIntensity: 0.5 }), 0.001), 0, 0.085, 0.006), at(box(0.07, 0.012, 0.06, alluminio, 0.004), 0, 0.006, -0.02)); t.children[0].rotation.x = t.children[1].rotation.x = -0.3; t.rotation.y = -0.4; posti.rete.g.add(at(t, 0.5, TAV, 0.02)); }
  { const sch = gruppo(at(box(0.2, 0.09, 0.13, M(0x8A6A45, { roughness: 0.8 }), 0.008), 0, 0.045, 0), ...[0, 1, 2, 3, 4, 5].map(i => at(box(0.17, 0.085, 0.004, M(i % 3 ? 0xF7F1E3 : 0xF5C518, { roughness: 0.9 }), 0.001), 0, 0.075 + (i % 2) * 0.006, -0.045 + i * 0.018))); sch.rotation.y = 0.3; posti.memoria.g.add(at(sch, 0.5, TAV, 0.06));
    const verdeLampada = M(0x1F7A4C, { roughness: 0.35, emissive: 0x1F7A4C, emissiveIntensity: 0 }); paralumi.push(verdeLampada);
    const cappa2 = ombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.17, 16, 1, false, 0, PI), verdeLampada)); cappa2.rotation.z = PI / 2; cappa2.rotation.y = PI / 2;
    posti.memoria.g.add(at(gruppo(at(box(0.13, 0.014, 0.08, M(0xC9A24A, { metalness: 0.6, roughness: 0.35 }), 0.004), 0, 0.007, 0), at(cyl(0.008, 0.008, 0.2, M(0xC9A24A, { metalness: 0.6, roughness: 0.35 }), 8), 0, 0.11, 0), at(cappa2, 0, 0.21, 0.03)), -0.5, TAV, -0.24)); }

