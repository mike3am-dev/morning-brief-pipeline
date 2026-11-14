  /* ================================================================ le persone
     Statuine da scrivania: testa grande, capelli scolpiti, occhi lucidi, vestiti disegnati addosso.
     Teste e capelli non sono sfere accostate: sono forme fuse fra loro, come creta, e poi
     trasformate in superficie (campi di distanza e «marching cubes»). */
  const SCURO = 0x16171A, H0 = 0.725, TESTA = 1.12;
  const fondi = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };   // unisce due forme, arrotondando la giuntura
  const scava = (a, b, k) => -fondi(-a, b, k);                                                                                 // toglie la seconda dalla prima
  const uovo = (x, y, z, cx, cy, cz, rx, ry, rz) => { const dx = x - cx, dy = y - cy, dz = z - cz, k0 = Math.hypot(dx / rx, dy / ry, dz / rz), k1 = Math.hypot(dx / (rx * rx), dy / (ry * ry), dz / (rz * rz));
    return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); };
  const tubo = (x, y, z, ax, ay, az, bx, by, bz, r) => { const px = x - ax, py = y - ay, pz = z - az, vx = bx - ax, vy = by - ay, vz = bz - az,
    h = Math.max(0, Math.min(1, (px * vx + py * vy + pz * vz) / (vx * vx + vy * vy + vz * vz))); return Math.hypot(px - vx * h, py - vy * h, pz - vz * h) - r; };
  const cubetti = new MarchingCubes(72, new THREE.MeshBasicMaterial(), false, false, 140000);
  function scolpisci(sdf, centro, mezzo) {   // dalla forma (una funzione di distanza, in metri) alla superficie
    const n = cubetti.size, h = n / 2, campo = cubetti.field; cubetti.reset(); cubetti.isolation = 0; let i = 0;
    for (let z = 0; z < n; z++) { const pz = centro[2] + (z - h) / h * mezzo;
      for (let y = 0; y < n; y++) { const py = centro[1] + (y - h) / h * mezzo;
        for (let x = 0; x < n; x++) campo[i++] = -sdf(centro[0] + (x - h) / h * mezzo, py, pz); } }
    cubetti.update();
    const quanti = cubetti.count * 3, pos = cubetti.positionArray.slice(0, quanti), nor = cubetti.normalArray.slice(0, quanti);
    for (let k = 0; k < quanti; k += 3) { pos[k] = centro[0] + pos[k] * mezzo; pos[k + 1] = centro[1] + pos[k + 1] * mezzo; pos[k + 2] = centro[2] + pos[k + 2] * mezzo;
      const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g;
  }
  // la testa: il cranio, la mandibola, le guance piene, le orecchie, il naso, il collo
  const cranio = (x, y, z) => { const ax = Math.abs(x);
    let d = fondi(uovo(x, y, z, 0, 0.02, 0, 0.172, 0.168, 0.165), uovo(x, y, z, 0, -0.068, 0.012, 0.148, 0.115, 0.14), 0.06);
    d = fondi(d, uovo(ax, y, z, 0.082, -0.058, 0.082, 0.06, 0.052, 0.05), 0.05);
    d = fondi(d, uovo(ax, y, z, 0.172, -0.012, -0.008, 0.02, 0.04, 0.028), 0.018);
    d = fondi(d, uovo(x, y, z, 0, -0.03, 0.166, 0.017, 0.016, 0.018), 0.022);
    return fondi(d, tubo(x, y, z, 0, -0.14, -0.012, 0, -0.27, -0.014, 0.05), 0.04); };
  const GEO_TESTA = scolpisci(cranio, [0, -0.04, 0], 0.26);
  // i capelli: una calotta intorno al cranio, i volumi sopra, il viso e le orecchie scavati via, i solchi del pettine
  const CHIOME = {
    onda(x, y, z) {   // corti, con la riga da una parte e il ciuffo che gira
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.035, -0.012, 0.19, 0.184, 0.188);
      d = fondi(d, uovo(x, y, z, 0.02, 0.178, 0.02, 0.14, 0.05, 0.15), 0.04);
      d = fondi(d, uovo(x, y, z, 0.055, 0.15, 0.13, 0.095, 0.05, 0.06), 0.035);
      d = scava(d, uovo(x, y, z, 0, -0.085, 0.13, 0.152, 0.17, 0.135), 0.025);
      d = scava(d, uovo(ax, y, z, 0.2, -0.045, 0.0, 0.055, 0.075, 0.07), 0.02);
      d = scava(d, uovo(x, y, z, 0, -0.2, -0.06, 0.22, 0.105, 0.22), 0.03);
      d = scava(d, tubo(x, y, z, -0.088, 0.21, -0.13, -0.088, 0.205, 0.15, 0.008), 0.012);
      for (let i = 0; i < 6; i++) { const zz = -0.12 + i * 0.05;
        d = scava(d, tubo(x, y, z, -0.075, 0.222, zz, 0.06, 0.232, zz + 0.012, 0.0062), 0.011);
        d = scava(d, tubo(x, y, z, 0.06, 0.232, zz + 0.012, 0.185, 0.13, zz + 0.03, 0.0062), 0.011); }
      return d; },
    stempiato(x, y, z) {   // grigi, alti sulla fronte, pieni ai lati
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.03, -0.015, 0.188, 0.18, 0.187);
      d = fondi(d, uovo(ax, y, z, 0.16, 0.03, -0.03, 0.045, 0.08, 0.11), 0.03);
      d = scava(d, uovo(x, y, z, 0, 0.0, 0.14, 0.14, 0.225, 0.15), 0.03);
      d = scava(d, uovo(ax, y, z, 0.2, -0.05, 0.005, 0.055, 0.07, 0.07), 0.02);
      d = scava(d, uovo(x, y, z, 0, -0.2, -0.06, 0.22, 0.11, 0.22), 0.03);
      for (let i = 0; i < 4; i++) { const yy = 0.1 - i * 0.045;
        d = scava(d, tubo(ax, y, z, 0.205, yy, 0.07, 0.185, yy - 0.02, -0.15, 0.006), 0.011); }
      return d; },
  };
  const chiome = {}, chioma = s => { if (!chiome[s]) { const c = CHIOME[s]; chiome[s] = scolpisci(c.f || c, c.centro || [0, 0.03, 0], c.mezzo || 0.26); } return chiome[s]; };
  const asta = (a, b, r, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), m = cyl(r, r, A.distanceTo(B), mat, 8);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; };
  const sfumo = tela(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#000000'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  function viso(testa, o) {   // gli occhi lucidi con i due riflessi, le sopracciglia, il sorriso, le guance
    const nerOcchi = M(SCURO, { roughness: 0.08 }), riflesso = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), peli = M(o.sopracciglia || o.capelli, { roughness: 0.9 }), occhi = [];
    for (const lato of [-1, 1]) {
      const occhio = gruppo(); at(occhio, lato * 0.064, 0.004, 0.148); occhio.rotation.y = lato * 0.36;
      const pupilla = ell(0.036, 0.8, 1.18, 0.4, nerOcchi); pupilla.castShadow = false;
      occhio.add(pupilla, at(new THREE.Mesh(new THREE.SphereGeometry(0.0095, 12, 8), riflesso), -0.009, 0.017, 0.0128), at(new THREE.Mesh(new THREE.SphereGeometry(0.0048, 8, 6), riflesso), 0.009, -0.015, 0.013));
      if (o.ciglia) { const c = caps(0.0042, 0.02, M(SCURO, { roughness: 0.4 })); c.castShadow = false; c.rotation.z = lato * -0.95; occhio.add(at(c, lato * 0.027, 0.037, 0.006)); }
      testa.add(occhio); occhi.push(occhio);
      const sopra = caps(0.0085, 0.04, peli); sopra.castShadow = false; sopra.rotation.z = PI / 2 + lato * 0.14;
      const perno = gruppo(sopra); at(perno, lato * 0.066, 0.074, 0.143); perno.rotation.y = lato * 0.36; testa.add(perno);
      const guancia = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), new THREE.MeshStandardMaterial({ color: 0xF07F86, alphaMap: sfumo, transparent: true, opacity: 0.42, depthWrite: false, roughness: 0.7 }));
      at(guancia, lato * 0.1135, -0.052, 0.1285); guancia.rotation.y = lato * 0.45; testa.add(guancia);
    }
    const bocca = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0052, 8, 22, 1.5), M(o.labbra || 0x5A2F27, { roughness: 0.6 })); bocca.castShadow = false;
    bocca.rotation.z = -(PI / 2 + 0.75); bocca.rotation.x = -0.12; at(bocca, 0, -0.056, 0.1595); testa.add(bocca); testa.userData.bocca = bocca;
    if (o.occhiali) { const mont = M(o.occhiali, { metalness: 0.5, roughness: 0.3 }), lente = o.lenti || 0.05;
      for (const lato of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(lente, 0.0036 + (lente - 0.05) * 0.12, 8, 28), mont); at(l, lato * 0.064, 0.004, 0.169); l.rotation.y = lato * 0.3; testa.add(l);
        testa.add(asta([lato * 0.112, 0.008, 0.153], [lato * 0.178, 0.012, 0.0], 0.003, mont)); }
      testa.add(asta([-0.017, 0.012, 0.176], [0.017, 0.012, 0.176], 0.003, mont)); }
    if (o.baffi) for (const lato of [-1, 1]) { const b = ell(0.03, 1.25, 0.42, 0.55, M(o.capelli, { roughness: 0.8 })); b.castShadow = false; b.rotation.z = lato * -0.25; testa.add(at(b, lato * 0.024, -0.048, 0.158)); }
    return occhi;
  }
  // il busto è un solido tornito; il vestito ci è disegnato sopra (il davanti sta ai due bordi della tela)
  const PROFILO = [[0, 0.02], [0.1, 0.022], [0.156, 0.05], [0.16, 0.11], [0.15, 0.19], [0.16, 0.27], [0.17, 0.33], [0.163, 0.372], [0.132, 0.408], [0.075, 0.432], [0, 0.44]];
  const BUSTO = new THREE.LatheGeometry(new THREE.SplineCurve(PROFILO.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(40), 44);
  function vestito(disegna) {   // disegna(x, davanti, quota): davanti(du) riempie una fascia simmetrica intorno al centro del petto
    return tela(512, 512, (x, w, h) => {
      const quota = v => (1 - v) * h;
      const davanti = (du0, du1, v0, v1) => { const y = quota(Math.max(v0, v1)), alto = Math.abs(v1 - v0) * h; x.fillRect(du0 * w, y, (du1 - du0) * w, alto); x.fillRect(w - du1 * w, y, (du1 - du0) * w, alto); };
      const scollo = (punta, largo, cima) => { for (const s of [1, -1]) { x.beginPath(); const X = du => s > 0 ? du * w : w - du * w; x.moveTo(X(0), quota(punta)); x.lineTo(X(largo), quota(cima)); x.lineTo(X(largo), quota(1)); x.lineTo(X(0), quota(1)); x.closePath(); x.fill(); } };
      const bordoScollo = (punta, largo, cima, spesso) => { x.lineWidth = spesso; x.lineCap = 'round'; for (const s of [1, -1]) { const X = du => s > 0 ? du * w : w - du * w; x.beginPath(); x.moveTo(X(0), quota(punta)); x.lineTo(X(largo), quota(cima)); x.lineTo(X(largo * 1.15), quota(1)); x.stroke(); } };
      const bottone = (v, r) => { for (const cx of [0, w]) { x.beginPath(); x.arc(cx, quota(v), r, 0, 7); x.fill(); } };
      disegna(x, w, h, { quota, davanti, scollo, bordoScollo, bottone });
    });
  }
  const telaQuadri = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');   // la camicia a quadri
    x.fillStyle = '#E0792B'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(120,52,14,.55)'; x.fillRect(0, 20, 128, 34); x.fillRect(20, 0, 34, 128);
    x.fillStyle = 'rgba(120,52,14,.35)'; x.fillRect(0, 84, 128, 20); x.fillRect(84, 0, 20, 128);
    x.fillStyle = 'rgba(255,236,196,.8)'; x.fillRect(0, 68, 128, 4); x.fillRect(68, 0, 4, 128); x.fillRect(0, 116, 128, 3); x.fillRect(116, 0, 3, 128); return c; })();
  const mappa = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const VESTITI = {
    quadri: { busto: vestito((x, w, h, a) => { x.fillStyle = x.createPattern(telaQuadri, 'repeat'); x.save(); x.scale(0.62, 0.62); x.fillRect(0, 0, w / 0.62, h / 0.62); x.restore();
        x.fillStyle = '#FFFFFF'; a.scollo(0.74, 0.085, 0.9);                                    // la maglietta bianca sotto
        x.strokeStyle = '#8A3F12'; a.bordoScollo(0.74, 0.085, 0.9, 9);
        x.fillStyle = 'rgba(120,52,14,.5)'; a.davanti(0, 0.014, 0.06, 0.74);                     // l'abbottonatura
        x.fillStyle = '#FFF4DC'; [0.22, 0.36, 0.5, 0.63].forEach(v => a.bottone(v, 6.5)); }),
      manica: new THREE.MeshStandardMaterial({ map: mappa(telaQuadri, 3, 2), roughness: 0.9 }), polsino: 0xC1601E, colletto: 0xD26E26 },
    cardigan: { busto: vestito((x, w, h, a) => { x.fillStyle = '#D92240'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#CFE2F3'; a.scollo(0.44, 0.115, 0.9);                                    // la camicia azzurra nello scollo
        x.strokeStyle = '#A8162F'; a.bordoScollo(0.44, 0.115, 0.9, 16);                           // il bordo a coste
        x.fillStyle = '#B81A34'; a.davanti(0, 0.03, 0.06, 0.44); a.davanti(0, 0.5, 0.14, 0.19);  // l'abbottonatura e il fondo a coste
        x.fillStyle = '#F3DDB5'; [0.22, 0.31, 0.4].forEach(v => a.bottone(v, 8));
        x.strokeStyle = '#A8162F'; x.lineWidth = 4; for (const cx of [0.17, 0.83]) x.strokeRect(cx * w - 26, a.quota(0.36), 52, 44); }),
      manica: M(0xD92240, { roughness: 0.9 }), polsino: 0xA8162F, colletto: 0xCFE2F3 },
  };
  function persona(o) {
    const g = gruppo(); g.userData.id = o.id; const v = VESTITI[o.vestito];
    const pelle = M(o.pelle, { roughness: 0.55 }), capelli = M(o.capelli, { roughness: 0.72 }), calzoni = M(o.calzoni, { roughness: 0.92 }), scarpe = M(o.scarpe, { roughness: 0.6 }), suola = M(o.suola || 0xFFFFFF, { roughness: 0.7 }), polsino = M(v.polsino, { roughness: 0.88 });
    const bacino = gruppo(), busto = gruppo(), testa = gruppo(); g.add(bacino); bacino.add(busto);
    bacino.add(at(ell(0.165, 1.02, 0.6, 0.74, calzoni), 0, 0.02, 0));
    const torso = ombra(new THREE.Mesh(BUSTO, new THREE.MeshStandardMaterial({ map: v.busto, roughness: 0.9 }))); torso.scale.set(1.1, 1, 0.72);
    const colletto = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.021, 10, 28), M(v.colletto, { roughness: 0.85 }))); colletto.rotation.x = PI / 2; colletto.scale.set(1.08, 1, v.colloAlto ? 1.7 : 0.6); colletto.position.set(0, v.colloAlto ? 0.452 : 0.437, 0.004);
    busto.add(torso, colletto);
    testa.position.y = 0.66; testa.scale.setScalar(TESTA); busto.add(testa);
    testa.add(ombra(new THREE.Mesh(GEO_TESTA, pelle)), ombra(new THREE.Mesh(chioma(o.chioma), capelli)));
    g.userData.occhi = viso(testa, o);
    if (o.barba) testa.add(ombra(new THREE.Mesh(barbaGeo(o.barba), M(o.barbaColore || o.capelli, { roughness: 0.85 }))));
    const braccio = lato => { const s = gruppo(); s.position.set(lato * 0.185, 0.385, 0); s.add(sph(0.062, v.manica, 16, 12), at(caps(0.056, 0.11, v.manica), 0, -0.105, 0));
      const gm = gruppo(); gm.position.y = -0.21; s.add(gm); gm.add(sph(0.054, v.manica, 14, 10), at(caps(0.05, 0.09, v.manica), 0, -0.09, 0), at(cyl(0.054, 0.054, 0.026, polsino, 18), 0, -0.165, 0));
      const m = gruppo(); m.position.y = -0.215; m.add(ell(0.056, 0.95, 1.08, 0.8, pelle), at(sph(0.023, pelle, 10, 8), lato * -0.012, 0.004, 0.046)); gm.add(m); busto.add(s); return { s, g: gm, m }; };
    const gamba = lato => { const a = gruppo(); a.position.set(lato * 0.085, 0, 0); a.add(at(caps(0.082, 0.17, calzoni), 0, -0.165, 0));
      const k = gruppo(); k.position.y = -0.335; a.add(k); k.add(sph(0.072, calzoni, 14, 10), at(caps(0.07, 0.16, calzoni), 0, -0.155, 0), at(box(0.118, 0.09, 0.215, scarpe, 0.04), 0, -0.345, 0.045), at(box(0.122, 0.022, 0.22, suola, 0.01), 0, -0.381, 0.045));
      bacino.add(a); return { a, k }; };
    const D = braccio(-1), S = braccio(1), gaD = gamba(-1), gaS = gamba(1);   // D è la destra di chi cammina
    g.userData.j = { bacino, busto, testa, sD: D.s, gD: D.g, mD: D.m, sS: S.s, gS: S.g, mS: S.m, aD: gaD.a, kD: gaD.k, aS: gaS.a, kS: gaS.k };
    if (o.accessori) o.accessori({ g, testa, busto, pelle });
    return g;
  }
  // una posa è un elenco di angoli; fra due pose si sfuma
  const IN_PIEDI = { h: H0, lean: 0, twist: 0, hx: 0, hy: 0, sD: [0, -0.1], gD: -0.15, sS: [0, 0.1], gS: -0.15, aD: 0, kD: 0, aS: 0, kS: 0 };
  const SEDUTO = { ...IN_PIEDI, h: SED + 0.08, lean: 0.04, aD: -1.22, kD: 1.22, aS: -1.22, kS: 1.22, sD: [-0.35, -0.12], gD: -1.55, sS: [-0.35, 0.12], gS: -1.55 };
  const mix = (A, B, u) => { const P = {}; for (const k in A) P[k] = Array.isArray(A[k]) ? [A[k][0] + (B[k][0] - A[k][0]) * u, A[k][1] + (B[k][1] - A[k][1]) * u] : A[k] + (B[k] - A[k]) * u; return P; };
  // come `mix`, ma regge anche le voci che una delle due pose non ha (la testa inclinata, il giro sulla sedia…): chi non le ha vale zero
  const sfuma = (A, B, u) => { if (u <= 0) return { ...A }; if (u >= 1) return { ...B }; const P = {}; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { const a = A[k], b = B[k];
    P[k] = Array.isArray(a) || Array.isArray(b) ? [0, 1].map(i => (a ? a[i] : b[i]) + ((b ? b[i] : a[i]) - (a ? a[i] : b[i])) * u) : (a || 0) + ((b || 0) - (a || 0)) * u; } return P; };
  function posa(g, P) {
    const j = g.userData.j; j.bacino.position.y = P.h; j.busto.rotation.set(P.lean, P.twist, 0); j.testa.rotation.set(P.hx, P.hy, P.hz || 0);
    j.sD.rotation.set(P.sD[0], 0, P.sD[1]); j.gD.rotation.x = P.gD; j.sS.rotation.set(P.sS[0], 0, P.sS[1]); j.gS.rotation.x = P.gS;
    j.aD.rotation.x = P.aD; j.kD.rotation.x = P.kD; j.aS.rotation.x = P.aS; j.kS.rotation.x = P.kS;
  }
  function passo(f, k = 1, porta = false) {   // il passo: le gambe a tempo, le braccia al contrario
    const sn = Math.sin(f) * k, cs = Math.cos(f);
    const P = { ...IN_PIEDI, h: H0 - 0.014 * k * (1 - Math.abs(cs)), lean: 0.05 * k, aD: 0.52 * sn, kD: 0.85 * k * Math.max(0, -cs), aS: -0.52 * sn, kS: 0.85 * k * Math.max(0, cs),
      sD: [-0.5 * sn, -0.1], gD: -0.3, sS: [0.5 * sn, 0.1], gS: -0.3 };
    if (porta) { P.sD = [-0.22, -0.1]; P.gD = -1.3; }
    return P;
  }

