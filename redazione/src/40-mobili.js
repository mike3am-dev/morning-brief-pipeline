  /* ================================================================ scrivanie, sedie, iMac */
  const TAV = 0.70, SED = 0.415;   // il piano delle scrivanie e la seduta, a misura delle statuine
  function scrivania(largh, prof) {
    const g = gruppo(at(box(largh, 0.06, prof, legno, 0.025), 0, TAV - 0.03, 0));
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.add(at(cyl(0.03, 0.022, TAV - 0.06, legnoScuro, 12), dx * (largh / 2 - 0.12), (TAV - 0.06) / 2, dz * (prof / 2 - 0.1)));
    return g;
  }
  function imac(tex, mento, retro) {   // l'iMac: la lastra sottile, il mento colorato, il piede di alluminio
    const g = gruppo(at(box(0.55, 0.455, 0.012, M(retro, { roughness: 0.4 }), 0.006), 0, 0.3175, -0.003), at(box(0.548, 0.36, 0.004, bianco, 0.002), 0, 0.364, 0.0045),
      at(box(0.548, 0.094, 0.004, M(mento, { roughness: 0.5 }), 0.002), 0, 0.138, 0.0045), (() => { const s = at(schermo(0.5, 0.3125, tex), 0, 0.364, 0.0072); viviSchermi.push(s.material); return s; })(),
      at(box(0.17, 0.008, 0.16, alluminio, 0.003), 0, 0.004, -0.02));
    const collo = box(0.13, 0.2, 0.01, alluminio, 0.004); collo.position.set(0, 0.1, -0.05); collo.rotation.x = 0.28; g.add(collo);
    return g;
  }
  const tastiera = () => { const t = stampa(0.275, 0.108, texTasti); t.rotation.x = -PI / 2; return gruppo(at(box(0.285, 0.008, 0.115, alluminio, 0.004), 0, 0.004, 0), at(t, 0, 0.0086, 0)); };
  const mouse = () => ell(0.03, 0.95, 0.38, 1.85, bianco);
  function sedia(stoffa = nero) {
    const g = gruppo(at(box(0.46, 0.07, 0.46, stoffa, 0.03), 0, SED - 0.035, 0), at(cyl(0.028, 0.028, 0.25, alluminio, 12), 0, 0.215, 0), at(cyl(0.05, 0.07, 0.05, nero, 16), 0, 0.085, 0));
    const schienale = box(0.44, 0.5, 0.07, stoffa, 0.035); schienale.position.set(0, SED + 0.31, -0.23); schienale.rotation.x = -0.1; g.add(schienale);
    for (let i = 0; i < 5; i++) { const a = i * PI * 2 / 5, raggio = box(0.045, 0.03, 0.27, nero, 0.012);
      raggio.position.set(Math.sin(a) * 0.135, 0.06, Math.cos(a) * 0.135); raggio.rotation.y = a; g.add(raggio, at(sph(0.035, M(0x101013)), Math.sin(a) * 0.26, 0.035, Math.cos(a) * 0.26)); }
    return g;
  }
  // un posto di lavoro: scrivania, iMac, tastiera, mouse, sedia. `giro` lo orienta: 0 guarda la parete di fondo, PI guarda verso di noi
  function posto(o) {
    const g = gruppo(), giro = o.giro || 0, w = o.w || 1.45, d = o.d || 0.8; at(g, o.x, 0, o.z); g.rotation.y = giro; stanza.add(g);
    g.add(scrivania(w, d), at(imac(o.tex, o.mento, o.retro), 0, TAV, -0.18), at(tastiera(), 0, TAV, d / 2 - 0.12), at(mouse(), 0.27, TAV + 0.011, d / 2 - 0.11));
    const s = sedia(), zs = d / 2 + 0.17; s.rotation.y = PI; at(s, 0, 0, zs); g.add(s);
    const fuori = (lx, lz) => [o.x + lx * Math.cos(giro) + lz * Math.sin(giro), o.z - lx * Math.sin(giro) + lz * Math.cos(giro)];   // da un punto del posto a un punto della stanza
    return { g, sedia: s, zs, giro, w, d, x: o.x, z: o.z, fuori, seduta: fuori(0, zs), yaw: PI + giro };
  }
  // il desk circolare della regia: un anello aperto verso di noi, con cinque iMac intorno
  function anello(cx, cz, R0, R1, varco) {
    const g = gruppo(), fi0 = -PI / 4 + varco, fi1 = -PI / 4 + 2 * PI - varco, s = new THREE.Shape();
    s.absarc(0, 0, R1, fi0, fi1, false); s.absarc(0, 0, R0, fi1, fi0, true); s.closePath();
    const piano = ombra(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 56 }), legno));
    piano.rotation.x = -PI / 2; piano.position.y = TAV - 0.047; g.add(piano);
    const fascia = (r, alto, y, mat) => { const m = ombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, alto, 64, 1, true, PI / 4 + varco, 2 * PI - 2 * varco), mat)); m.material.side = THREE.DoubleSide; m.position.y = y; return m; };
    g.add(fascia(R1 - 0.05, TAV - 0.1, (TAV - 0.1) / 2 + 0.04, M(0xFBFAF7, { roughness: 0.6 })), fascia(R1 - 0.045, 0.05, 0.025, M(0x202125, { roughness: 0.55 })), fascia(R1 - 0.046, 0.05, TAV - 0.2, M(0xF0821E, { roughness: 0.6 })));
    for (const lato of [-1, 1]) { const a = PI / 4 + lato * varco; g.add(at(box(0.04, TAV - 0.06, R1 - R0 - 0.06, bianco, 0.012), 0, 0, 0)); const f = g.children[g.children.length - 1];
      f.position.set(Math.sin(a) * (R0 + R1) / 2, (TAV - 0.06) / 2, Math.cos(a) * (R0 + R1) / 2); f.rotation.y = a; }
    at(g, cx, 0, cz); stanza.add(g); return g;
  }

