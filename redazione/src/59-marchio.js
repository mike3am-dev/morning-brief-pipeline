  /* ================================================================ il marchio nella stanza, e l'ambiente di ogni gruppo
     Chi apre il modellino deve capire subito dov'è. Il tappeto della regia è il sole del marchio, con la falce azzurra
     dell'orizzonte; sul fronte del desk c'è la testata; sulla parete l'insegna luminosa (46-arredo.js); sul muro la
     sigla, dieci secondi ogni minuto (32-muro.js).
     I gruppi di lavoro non hanno scritte né tappeti (Mike, 14 novembre 2026: «la caratterizzazione delle zone deve
     passare attraverso i personaggi, la postazione e il loro ambiente»): l'edizione è carta, il design è uno studio,
     le schede sono quattro scrivanie ognuna col suo mondo, l'archivio è faldoni e scatole. */
  const INGOMBRI = [];   // x, z, raggio: le cose appoggiate per terra, che chi cammina deve aggirare
  let saturnoRita = null;   // lo fa girare Rita (63-repertori.js)
  const vivo = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

  // L'EDIZIONE: carta dappertutto. Al centro dell'isola le vaschette dei documenti e i giornali del giorno; il telefono di Nora; per terra le pile (44-carte.js)
  { const [ex, ez] = ISOLE.edizione, grigio2 = M(0x3A3B40, { roughness: 0.5 });
    const vaschette = gruppo(...[0, 1, 2].flatMap(i => [at(box(0.25, 0.008, 0.33, grigio2, 0.004), 0, i * 0.075, 0), at(box(0.22, 0.014 + i * 0.008, 0.3, i === 1 ? M(0xEFEBE2) : bianco, 0.003), 0.004 * i, i * 0.075 + 0.014, 0), ...[-1, 1].map(dx => at(box(0.008, 0.075, 0.33, grigio2, 0.003), dx * 0.121, i * 0.075 + 0.035, 0))]));
    vaschette.rotation.y = PI / 2 + 0.06; stanza.add(at(vaschette, ex - 0.2, TAV, ez - 0.1));
    const p = pilaGiornali(5, 29); p.rotation.y = -0.25; stanza.add(at(p, ex + 0.02, TAV, ez - 0.36));
    const telefono = gruppo(at(box(0.17, 0.045, 0.21, M(0x17181B, { roughness: 0.4 }), 0.012), 0, 0.0225, 0), at(box(0.1, 0.004, 0.09, M(0x9EA0A6, { roughness: 0.5 }), 0.002), 0.02, 0.047, 0.04), at(box(0.045, 0.03, 0.2, M(0x202125, { roughness: 0.4 }), 0.012), -0.055, 0.06, 0));
    telefono.rotation.y = 0.35; posti.verifica.g.add(at(telefono, 0.3, TAV, -0.24)); }

  // DESIGN: uno studio. Accanto a Bruno il cavalletto con la tavola dei colori e il faretto col diffusore; da Lea il manichino da disegno e il ventaglio dei colori; da Bruno un obiettivo
  { const [dx, dz] = ISOLE.design, xs = dx + 1.95;
    const tavola = tela(360, 480, (x, w, h) => { x.fillStyle = '#FBFAF7'; x.fillRect(0, 0, w, h);
      [[C.yellow, 22, 22, 150, 118], [C.blue, 188, 22, 150, 72], [C.red, 188, 108, 70, 74], [C.orange, 268, 108, 70, 74], ['#17181B', 22, 156, 96, 60], ['#EDEAE3', 130, 156, 96, 60]].forEach(([c, a, b, l, alto]) => { x.fillStyle = c; x.fillRect(a, b, l, alto); x.strokeStyle = 'rgba(0,0,0,.12)'; x.strokeRect(a, b, l, alto); });
      for (const [a, b, l, alto, c0, c1] of [[22, 240, 196, 130, '#9CC4E8', '#F2C89A'], [236, 204, 102, 166, '#D9D5CB', '#8F958F']]) { const g = x.createLinearGradient(0, b, 0, b + alto); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(a, b, l, alto); x.fillStyle = '#fff'; x.fillRect(a - 5, b - 5, l + 10, 5); }
      x.fillStyle = C.yellow; x.beginPath(); x.arc(92, 430, 34, PI, 0); x.fill(); falce(x, 30, 396, 130, 40); x.fillStyle = C.ink; x.font = `800 26px ${DISPLAY}`; spazia(x, 0.08, 26); x.fillText('TMB', 190, 428); x.font = `700 22px ${A_MANO}`; spazia(x, 0, 1); x.fillText('colori e foto', 190, 456); });
    const piano = stampa(0.6, 0.8, tavola), cavalletto = gruppo(at(piano, 0, 1.12, 0.012), at(box(0.64, 0.84, 0.02, M(0xF4F1EA, { roughness: 0.8 }), 0.006), 0, 1.12, 0), asta([-0.3, 0, 0.12], [-0.16, 1.62, 0], 0.016, legnoScuro), asta([0.3, 0, 0.12], [0.16, 1.62, 0], 0.016, legnoScuro), asta([0, 0, -0.42], [0, 1.5, -0.02], 0.016, legnoScuro), at(box(0.7, 0.03, 0.07, legnoScuro, 0.008), 0, 0.69, 0.04));
    cavalletto.children[0].rotation.x = cavalletto.children[1].rotation.x = -0.09; cavalletto.rotation.y = PI / 4 + 0.15; stanza.add(at(cavalletto, xs, 0, dz - 0.5)); INGOMBRI.push([xs, dz - 0.5, 0.32]);
    const luceMorbida = M(0xFFFDF6, { roughness: 0.9, emissive: 0xFFE9C4, emissiveIntensity: 0 }); paralumi.push(luceMorbida);
    const testa3 = gruppo(at(box(0.44, 0.44, 0.03, luceMorbida, 0.01), 0, 0, 0.09), at(box(0.46, 0.46, 0.012, nero, 0.01), 0, 0, 0.07), ...[-1, 1].flatMap(a => [-1, 1].map(b => asta([a * 0.21, b * 0.21, 0.07], [0, 0, -0.08], 0.008, nero))), at(cyl(0.05, 0.04, 0.1, nero, 14), 0, 0, -0.1)); testa3.children[6].rotation.x = PI / 2;
    testa3.rotation.set(0.25, -PI / 2 - 0.5, 0, 'YXZ'); const faretto = gruppo(at(cyl(0.012, 0.012, 1.55, alluminio, 10), 0, 0.775, 0), ...[0, 1, 2].map(i => asta([0, 0.32, 0], [Math.sin(i * 2.094) * 0.3, 0, Math.cos(i * 2.094) * 0.3], 0.009, alluminio)), at(testa3, 0, 1.56, 0));
    stanza.add(at(faretto, xs, 0, dz + 0.55)); INGOMBRI.push([xs, dz + 0.55, 0.3]); punto(0xFFE9C4, 3, xs - 0.5, 1.4, dz + 0.5, 3);
    const legnoChiaro = M(0xE2C08E, { roughness: 0.7 }), manichino = gruppo(at(cyl(0.04, 0.045, 0.012, legnoChiaro, 16), 0, 0.006, 0), at(cyl(0.005, 0.005, 0.1, alluminio, 6), 0, 0.06, 0), at(ell(0.022, 1, 1.5, 0.8, legnoChiaro), 0, 0.135, 0), at(sph(0.018, legnoChiaro, 12, 8), 0, 0.19, 0),
      asta([0.02, 0.155, 0], [0.065, 0.2, 0.01], 0.007, legnoChiaro), asta([-0.02, 0.155, 0], [-0.06, 0.11, 0.02], 0.007, legnoChiaro), asta([0.01, 0.105, 0], [0.03, 0.03, 0.02], 0.008, legnoChiaro), asta([-0.01, 0.105, 0], [-0.035, 0.035, -0.01], 0.008, legnoChiaro));
    manichino.rotation.y = -0.5; posti.visualista.g.add(at(manichino, 0.56, TAV, -0.22));
    const ventaglio = gruppo(...[0xE01F3D, 0xF0821E, 0xF5C518, 0x35C759, 0x0E9CD8, 0x7B4BE0].map((c, i) => { const f = gruppo(at(box(0.03, 0.003, 0.14, M(c, { roughness: 0.6 }), 0.001), 0, 0.002 + i * 0.0015, -0.07)); f.rotation.y = (i - 2.5) * 0.2; return f; })); ventaglio.rotation.y = 0.5; posti.visualista.g.add(at(ventaglio, -0.3, TAV, 0.33));
    const ob = cyl(0.036, 0.04, 0.09, M(0x1B1C20, { roughness: 0.4 }), 18); posti.foto.g.add(at(ob, -0.3, TAV + 0.045, -0.22), at(cyl(0.03, 0.03, 0.004, M(0x7CC6F2, { roughness: 0.1 }), 18), -0.3, TAV + 0.092, -0.22)); }

  // LE SCHEDE: quattro scrivanie, ognuna col suo mondo. Ada: il serverino che lampeggia; Rita: Saturno sul tavolo e il telescopio accanto; Dario: il router; Vito ha già la sua (55-cast.js)
  { const server = gruppo(at(box(0.11, 0.24, 0.2, M(0x17181B, { roughness: 0.4 }), 0.012), 0, 0.12, 0), ...[0, 1, 2, 3, 4, 5].map(i => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), vivo(i % 3 ? 0x35C759 : 0x3FA9FF)); l.position.set(-0.03 + (i % 2) * 0.06, 0.07 + Math.floor(i / 2) * 0.06, -0.101); return l; }));
    posti.ai.g.add(at(server, -0.58, TAV, -0.26));
    const saturno = saturnoRita = gruppo(at(sph(0.045, M(0xE8C36A, { roughness: 0.6 }), 18, 14), 0, 0.105, 0), (() => { const a = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.007, 6, 30), M(0xC9955C, { roughness: 0.6 }))); a.rotation.x = PI / 2 - 0.4; a.scale.z = 0.4; a.position.y = 0.105; return a; })(), at(cyl(0.004, 0.004, 0.06, alluminio, 6), 0, 0.03, 0), at(cyl(0.03, 0.034, 0.01, nero, 14), 0, 0.005, 0));
    posti.schede.g.add(at(saturno, -0.52, TAV, -0.25));
    const [tx, tz] = posti.schede.fuori(-0.98, -0.3), tubo = cyl(0.05, 0.045, 0.56, bianco, 18), telescopio = gruppo(...[0, 1, 2].map(i => asta([0, 0.78, 0], [Math.sin(i * 2.094 + 0.4) * 0.3, 0, Math.cos(i * 2.094 + 0.4) * 0.3], 0.011, nero)), at(cyl(0.02, 0.02, 0.1, nero, 10), 0, 0.82, 0));
    tubo.rotation.set(0.95, 0, 0); const gruppoTubo = gruppo(tubo, (() => { const o = cyl(0.016, 0.016, 0.09, nero, 10); o.rotation.x = 0.95 + PI / 2; o.position.set(0.05, -0.2, -0.26); return o; })(), (() => { const v = cyl(0.046, 0.046, 0.006, M(0x7CC6F2, { roughness: 0.1 }), 18); v.rotation.x = 0.95; v.position.set(0, 0.164, 0.228); return v; })());
    gruppoTubo.rotation.y = -2.2; telescopio.add(at(gruppoTubo, 0, 0.95, 0)); stanza.add(at(telescopio, tx, 0, tz)); INGOMBRI.push([tx, tz, 0.3]);
    const router = gruppo(at(box(0.18, 0.032, 0.11, bianco, 0.01), 0, 0.016, 0), ...[-1, 1].map(dx => { const a = cyl(0.006, 0.006, 0.13, nero, 6); a.position.set(dx * 0.07, 0.09, 0.04); a.rotation.z = dx * -0.18; return a; }), ...[0, 1, 2].map(i => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), vivo(0x35C759)); l.position.set(-0.03 + i * 0.03, 0.022, -0.056); return l; }));
    posti.rete.g.add(at(router, -0.5, TAV, -0.27)); }

  // L'ARCHIVIO: faldoni e scatole. Sul tavolo di Zeno i faldoni in piedi; accanto alla coppia, per terra, due scatole d'archivio una sull'altra
  { const faldoni = gruppo(...[0x2F7A4C, 0xF5C518, 0x8A6A45, 0xE01F3D].map((c, i) => at(box(0.06, 0.3, 0.24, M(c, { roughness: 0.8 }), 0.008), i * 0.066, 0.15, 0))); faldoni.rotation.y = 0.1; posti.fonti.g.add(at(faldoni, -0.6, TAV, -0.22));
    const cartone = M(0xD9B98A, { roughness: 0.9 }), [bx, bz] = [ISOLE.archivio[0] + 0.75, ISOLE.archivio[1] - 1.12], scatole = gruppo(at(box(0.42, 0.26, 0.34, cartone, 0.012), 0, 0.13, 0), at(box(0.44, 0.05, 0.36, M(0xC9A572, { roughness: 0.9 }), 0.01), 0, 0.26, 0), at(box(0.4, 0.24, 0.32, cartone, 0.012), 0.02, 0.41, 0.01), at(box(0.42, 0.05, 0.34, M(0xC9A572, { roughness: 0.9 }), 0.01), 0.02, 0.53, 0.01),
      ...[0.13, 0.41].map(y => at(box(0.16, 0.08, 0.004, bianco, 0.002), 0, y, 0.172)));
    scatole.rotation.y = 0.5; stanza.add(at(scatole, bx, 0, bz)); INGOMBRI.push([bx, bz, 0.3]); }

  // il tappeto della regia è il sole; sopra, la falce azzurra dell'orizzonte, girata verso chi guarda
  { const t = tela(1024, 1024, (x, w) => { x.save(); x.beginPath(); x.arc(512, 512, 506, 0, 7); x.clip(); falce(x, 512 - 830, 512 + 70, 1660, 560); x.restore(); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.7), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 1 })); m.rotation.x = -PI / 2; m.receiveShadow = true;
    const g = gruppo(at(m, 0, 0.0325, 0)); g.rotation.y = PI / 4; stanza.add(at(g, REGIA[0], 0, REGIA[1])); }

  // la testata sul fronte del desk della regia, dai due lati dell'apertura (come sui banconi dei telegiornali)
  { const mis = marchio(document.createElement('canvas').getContext('2d'), 0, 0, 100), alto = 0.3, largo = alto * mis.w / mis.h, raggio = R_OUT - 0.05 + 0.004, arco = largo / raggio;
    const t = tela(Math.round(420 * mis.w / mis.h), 420, (x, w, h) => { marchio(x, 4, 0, (h - 8) / mis.h * 100); });
    for (const lato of [-1, 1]) regiaG.add(at(new THREE.Mesh(new THREE.CylinderGeometry(raggio, raggio, alto, 36, 1, true, PI / 4 + lato * 0.9 - arco / 2, arco), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6 })), 0, 0.27, 0)); }

