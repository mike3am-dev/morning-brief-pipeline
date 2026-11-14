  /* ================================================================ i materiali */
  const legno = M(0xE6BB86, { roughness: 0.7 }), legnoScuro = M(0xC9955C, { roughness: 0.75 });
  const pavimento = M(0xF1EADF, { roughness: 0.95 }), muro = M(0xFAF6EE, { roughness: 0.95 });
  const nero = M(0x202125, { roughness: 0.55 }), grigio = M(0xDAD6CE), bianco = M(0xFBFAF7, { roughness: 0.6 });
  const alluminio = M(0xD5D7DB, { metalness: 0.55, roughness: 0.35 });
  const verdi = [M(0x3F8F5A), M(0x4FA368), M(0x2F7A4C)];

  const stanza = new THREE.Group(); scene.add(stanza);
  const LARGA = 13.2, FONDA = 8.6, ALTA = 3.0;
  const REGIA = [7.0, 5.7];   // il centro del desk circolare: sta davanti al muro delle notizie
  const viviSchermi = [];   // i materiali di tutti gli schermi accesi: «respirano» appena (32-muro.js)
  const MURO = { x: 7.05, w: 4.36, sin: 4.87 };   // il muro delle notizie, sulla parete di fondo: centro, larghezza, bordo sinistro

  /* ================================================================ pavimento e pareti */
  stanza.add(at(box(LARGA + 0.5, 0.36, FONDA + 0.5, pavimento, 0.07), LARGA / 2 - 0.05, -0.18, FONDA / 2 - 0.05));
  const muroA = at(box(LARGA + 0.5, ALTA, 0.26, muro, 0.03), LARGA / 2 - 0.05, ALTA / 2, -0.13); muroA.castShadow = false;
  const muroB = at(box(0.26, ALTA, FONDA + 0.5, muro, 0.03), -0.13, ALTA / 2, FONDA / 2 - 0.05); muroB.castShadow = false;
  stanza.add(muroA, muroB);
  stanza.add(at(box(LARGA, 0.1, 0.03, legnoScuro, 0.01), LARGA / 2, 0.05, 0.015), at(box(0.03, 0.1, FONDA, legnoScuro, 0.01), 0.015, 0.05, FONDA / 2));
  const tappeto = at(cyl(1.85, 1.85, 0.03, M(0xF0C445, { roughness: 1 }), 72), REGIA[0], 0.016, REGIA[1]); tappeto.castShadow = false; stanza.add(tappeto);

  /* ================================================================ la parete di fondo */
  // il fondale
  const fx = 3.05, fy = 1.8, fw = 3.0, fh = fw * 943 / 2048;
  stanza.add(at(box(fw + 0.1, fh + 0.1, 0.07, nero, 0.02), fx, fy, 0.045), at(schermo(fw, fh, texFondale), fx, fy, 0.082));
  // la credenza con il merchandising
  const credenza = gruppo(at(box(2.6, 0.52, 0.46, legno, 0.03), 0, 0.42, 0),
    ...[-1.1, 1.1].flatMap(dx => [-0.15, 0.15].map(dz => at(cyl(0.025, 0.02, 0.16, legnoScuro, 12), dx, 0.08, dz))),
    ...[-0.65, 0, 0.65].map(dx => at(box(0.012, 0.44, 0.01, legnoScuro, 0.004), dx, 0.42, 0.232)));
  at(credenza, fx, 0, 0.3); stanza.add(credenza);
  function tazza(colore, giro = -PI * 0.75) {
    const g = gruppo(), mat = new THREE.MeshStandardMaterial({ map: texTazza(colore), roughness: 0.45 });
    const corpo = ombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.105, 32, 1, true), mat)); corpo.position.y = 0.0525;
    const manico = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 10, 20), M(colore, { roughness: 0.45 })));
    manico.position.set(0, 0.055, 0.058); manico.rotation.y = PI / 2;
    const dentro = at(cyl(0.044, 0.044, 0.004, M(0x3a2a22, { roughness: 0.3 })), 0, 0.092, 0); dentro.castShadow = false;
    g.add(corpo, at(cyl(0.046, 0.045, 0.01, M(colore, { roughness: 0.45 })), 0, 0.005, 0), dentro, manico); g.rotation.y = giro; return g;
  }
  [C.yellow, C.blue, C.red].forEach((c, i) => stanza.add(at(tazza(c), fx - 1.05 + i * 0.2, 0.68, 0.36)));
  const spiaCaffe = M(0xF5C518, { emissive: 0xF5C518, emissiveIntensity: 0.6 });
  const CAFFE = [fx + 0.98, 0.3];
  stanza.add(at(gruppo(at(box(0.28, 0.36, 0.3, nero, 0.04), 0, 0.18, 0), at(box(0.2, 0.03, 0.12, alluminio, 0.01), 0, 0.03, 0.2),
    at(box(0.07, 0.05, 0.07, nero, 0.01), 0, 0.26, 0.17), at(sph(0.014, spiaCaffe), 0.09, 0.3, 0.152)), CAFFE[0], 0.68, CAFFE[1]));
  const pila = gruppo(...[0, 1, 2, 3, 4].map(i => { const f = at(box(0.3, 0.014, 0.22, i % 2 ? bianco : M(0xEFEBE2), 0.004), 0, 0.007 + i * 0.015, 0); f.rotation.y = (i - 2) * 0.05; return f; }));
  stanza.add(at(pila, fx + 0.2, 0.68, 0.32));
  const cappello = gruppo(ombra(new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 12, 0, PI * 2, 0, PI / 2), M(0xF5C518, { roughness: 0.9 }))),
    (() => { const v = ombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24, 1, false, -PI / 2, PI), M(0x17181B))); v.position.set(0, 0.006, 0.02); v.scale.z = 1.25; return v; })());
  cappello.rotation.y = PI / 4; stanza.add(at(cappello, fx - 0.35, 0.68, 0.3));

  // la storia di Apple, incorniciata
  [9.85, 10.5, 11.15].forEach((cx, c) => [2.02, 1.24].forEach((cy, r) => {
    stanza.add(at(box(0.56, 0.7, 0.035, nero, 0.012), cx, cy, 0.022), at(stampa(0.5, 0.625, manifesti[r * 3 + c]), cx, cy, 0.0405));
  }));
  // il conto alla rovescia verso la prossima edizione
  const telaConto = document.createElement('canvas'); telaConto.width = 760; telaConto.height = 176;
  const texConto = new THREE.CanvasTexture(telaConto); texConto.colorSpace = THREE.SRGBColorSpace; texConto.anisotropy = renderer.capabilities.getMaxAnisotropy();
  stanza.add(at(schermo(1.86, 1.86 * 176 / 760, texConto), 7.28, 2.66, 0.077));   // sta in cima al muro delle notizie, fra gli orologi
  let ultimoConto = '';
  function conto() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
    const v = k => +p.find(q => q.type === k).value, adesso = (v('hour') % 24) * 3600 + v('minute') * 60 + v('second');
    const manca = ((PROSSIMA[0] * 3600 + PROSSIMA[1] * 60 - adesso) % 86400 + 86400) % 86400;
    const cifre = [Math.floor(manca / 3600), Math.floor(manca / 60) % 60, manca % 60].map(n => String(n).padStart(2, '0')), chiave = cifre.join(':');
    if (chiave === ultimoConto) return false; ultimoConto = chiave;
    const x = telaConto.getContext('2d'), w = 760, h = 176, chiude = manca <= 1800;
    x.fillStyle = '#111214'; x.fillRect(0, 0, w, h);
    x.fillStyle = chiude ? C.red : C.yellow; x.font = `800 31px ${DISPLAY}`; spazia(x, 0.07, 31);
    x.fillText(chiude ? 'SI CHIUDE' : 'ALLA PROSSIMA', 30, 62); x.fillText(chiude ? 'L\'EDIZIONE' : 'EDIZIONE', 30, 98);
    x.fillStyle = '#9EA0A6'; x.font = `700 23px ${DISPLAY}`; x.fillText('ESCE ALLE ' + PROSSIMA[0] + ':' + String(PROSSIMA[1]).padStart(2, '0'), 30, 138); spazia(x, 0, 1);
    let a = 262; cifre.forEach((c, i) => { for (const ch of c) { x.fillStyle = '#2A2B30'; rr(x, a, 26, 66, 110, 9); x.fill(); x.fillStyle = '#111214'; x.fillRect(a, 80, 66, 2.5);
        x.fillStyle = chiude ? '#FF6B7D' : '#FFFFFF'; x.font = `800 92px ${DISPLAY}`; x.textAlign = 'center'; x.fillText(ch, a + 33, 113); x.textAlign = 'left'; a += 72; }
      if (i < 2) { x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(a + 8, 62, 5.5, 0, 7); x.arc(a + 8, 100, 5.5, 0, 7); x.fill(); a += 24; } });
    x.fillStyle = '#9EA0A6'; x.font = `700 17px ${DISPLAY}`; spazia(x, 0.12, 17); ['ORE', 'MIN', 'SEC'].forEach((t, i) => x.fillText(t, 262 + 48 + i * 168, 160)); spazia(x, 0, 1);
    texConto.needsUpdate = true; return true;
  }
  // il mobiletto con la stampante
  const STAMPANTE = [10.5, 0.3];
  const spiaStampa = M(0x35C759, { emissive: 0x35C759, emissiveIntensity: 0.5 });
  stanza.add(at(gruppo(at(box(1.0, 0.44, 0.44, legno, 0.03), 0, 0.36, 0), ...[-0.4, 0.4].flatMap(dx => [-0.15, 0.15].map(dz => at(cyl(0.025, 0.02, 0.14, legnoScuro, 12), dx, 0.07, dz))),
    at(box(0.44, 0.2, 0.38, bianco, 0.03), 0, 0.68, 0), at(box(0.36, 0.012, 0.3, nero, 0.005), 0, 0.786, -0.01), at(box(0.3, 0.02, 0.02, nero, 0.004), 0, 0.66, 0.191),
    at(box(0.3, 0.012, 0.16, grigio, 0.005), 0, 0.615, 0.26), at(sph(0.009, spiaStampa), 0.17, 0.72, 0.192)), STAMPANTE[0], 0, STAMPANTE[1]));
  // il manifesto di Vito
  stanza.add(at(box(1.46, 1.96, 0.04, nero, 0.012), 12.25, 1.78, 0.025), at(stampa(1.4, 1.9, texGta), 12.25, 1.78, 0.046));
  const foglioStampante = stampa(0.21, 0.297, foglio(31, true)); foglioStampante.rotation.x = -PI / 2; foglioStampante.visible = false; stanza.add(foglioStampante);

  /* ================================================================ la parete di sinistra */
  // la finestra su New York
  const vista = new THREE.MeshBasicMaterial({ map: cieli.giorno, toneMapped: false });
  const vetro = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.4), vista); vetro.rotation.y = PI / 2; at(vetro, 0.006, 1.75, 1.75);
  const telaio = M(0xFFFFFF, { roughness: 0.5 });
  stanza.add(vetro, at(box(0.07, 0.07, 1.64, telaio), 0.035, 2.48, 1.75), at(box(0.1, 0.06, 1.72, telaio), 0.05, 1.02, 1.75),
    at(box(0.07, 1.5, 0.07, telaio), 0.035, 1.75, 0.965), at(box(0.07, 1.5, 0.07, telaio), 0.035, 1.75, 2.535), at(box(0.04, 1.4, 0.04, telaio), 0.02, 1.75, 1.75));
  // la lavagna
  const bz = 4.25;
  const lavagna = stampa(2.5, 2.5 * 820 / 1400, texLavagna); lavagna.rotation.y = PI / 2; at(lavagna, 0.047, 1.6, bz);
  stanza.add(at(box(0.04, 1.56, 2.6, grigio, 0.015), 0.022, 1.6, bz), lavagna, at(box(0.08, 0.03, 1.8, grigio, 0.01), 0.07, 0.85, bz));
  [[0xE01F3D, -0.5], [0x17181B, -0.3], [0x0E9CD8, -0.1]].forEach(([c, dz]) => stanza.add(at(box(0.03, 0.03, 0.14, M(c), 0.01), 0.075, 0.88, bz + dz)));
  // gli orologi: uno per città, in cima al muro delle notizie (li mette 32-muro.js); segnano l'ora vera di ogni fuso
  const OROLOGI = [];
  function orologioDi(fuso, r = 0.25) {
    const g = gruppo(), k = r / 0.25, cassa = cyl(r, r, 0.04, nero, 40); cassa.rotation.x = PI / 2;
    const quadrante = at(new THREE.Mesh(new THREE.CircleGeometry(r * 0.908, 40), new THREE.MeshStandardMaterial({ map: texOrologio, roughness: 0.6 })), 0, 0, 0.022);
    const lancetta = (l, s, col) => { const p = gruppo(); const m = at(box(s * k, l * k, 0.006, M(col), 0.002), 0, (l / 2 - 0.02) * k, 0); m.castShadow = false; p.add(m); p.position.z = 0.028; return p; };
    const ore = lancetta(0.12, 0.022, 0x17181B), minuti = lancetta(0.185, 0.016, 0x17181B), secondi = lancetta(0.2, 0.008, 0xE01F3D);
    g.add(cassa, quadrante, ore, minuti, secondi); OROLOGI.push({ fuso, ore, minuti, secondi }); return g;
  }

  /* ================================================================ piante, lampade, cestino, annaffiatoio */
  const PIANTA = [0.62, 0.62];
  function piantaGrande() {
    const g = gruppo(at(cyl(0.27, 0.2, 0.44, bianco, 32), 0, 0.22, 0), at(cyl(0.245, 0.245, 0.02, M(0x4a3a2e, { roughness: 1 }), 24), 0, 0.435, 0), at(cyl(0.022, 0.03, 1.0, M(0x7a5a3c), 10), 0, 0.92, 0));
    for (let i = 0; i < 11; i++) { const perno = gruppo(); perno.position.set(0, 0.75 + (i / 11) * 0.95, 0); perno.rotation.y = i * 2.4;
      const f = sph(0.2, verdi[i % 3], 18, 12); f.scale.set(0.62, 0.1, 1.15); f.position.set(0, 0.05, 0.3); f.rotation.x = -0.55 + (i / 11) * 0.3; perno.add(f); g.add(perno); }
    return g;
  }
  function sansevieria() {
    const g = gruppo(at(cyl(0.2, 0.15, 0.3, M(0xD9825B, { roughness: 0.9 }), 28), 0, 0.15, 0), at(cyl(0.18, 0.18, 0.02, M(0x4a3a2e, { roughness: 1 }), 20), 0, 0.295, 0));
    for (let i = 0; i < 9; i++) { const l = 0.55 + ((i * 7) % 5) * 0.11, perno = gruppo(); perno.position.y = 0.28; perno.rotation.y = i * 2.4;
      const f = ombra(new THREE.Mesh(new THREE.ConeGeometry(0.055, l, 6), verdi[i % 3])); f.scale.z = 0.35; f.position.set(0, l / 2, 0.02 + (i % 3) * 0.03); f.rotation.x = 0.12 + (i % 4) * 0.07; perno.add(f); g.add(perno); }
    return g;
  }
  const PIANTE = [[PIANTA[0], PIANTA[1], 0.3], [12.95, 0.45, 0.2], [12.75, 8.1, 0.2], [9.6, 7.95, 0.24]];   // x, z, raggio: servono anche a chi cammina
  stanza.add(at(piantaGrande(), PIANTA[0], 0, PIANTA[1]), at(sansevieria(), 12.95, 0, 0.45), at(sansevieria(), 12.75, 0, 8.1));
  const pianta2 = piantaGrande(); pianta2.scale.setScalar(0.8); pianta2.rotation.y = 1.3; stanza.add(at(pianta2, 9.6, 0, 7.95));
  const piantina = sansevieria(); piantina.scale.setScalar(0.36); stanza.add(at(piantina, fx + 0.6, 0.68, 0.3));

  const lampade = [], paralumi = [];
  function punto(colore, forza, x, y, z, raggio = 5) { const l = new THREE.PointLight(colore, 0, raggio, 1.6); l.position.set(x, y, z); l.userData.max = forza; lampade.push(l); stanza.add(l); return l; }
  const paralume = M(0xFFF3D6, { roughness: 0.9, emissive: 0xFFD9A0, emissiveIntensity: 0 }); paralumi.push(paralume);
  const piantana = gruppo(at(cyl(0.16, 0.18, 0.03, nero, 24), 0, 0.015, 0), at(cyl(0.014, 0.014, 1.55, nero, 10), 0, 0.8, 0),
    (() => { const p = ombra(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 0.3, 28, 1, true), paralume)); p.material.side = THREE.DoubleSide; p.position.y = 1.62; return p; })());
  stanza.add(at(piantana, 1.26, 0, 0.36)); punto(0xFFC27A, 9, 1.3, 1.6, 0.75, 6);   // nell'angolo, accanto alla pianta
  punto(0xFFC27A, 5, 6.4, 1.6, 3.2, 5.5);   // un po' di luce calda sulla fila della prosa
  punto(0xFFC27A, 6, REGIA[0], 1.7, REGIA[1], 5.5);   // sulla regia
  punto(0xFFB07A, 5, 11.6, 1.6, 4.9, 5.5);   // e sull'isola di destra
  punto(0xF2ECDF, 5, fx, 1.7, 1.3, 5.5);   // il chiarore del fondale, che la sera si vede

  const CESTINO = [4.08, 1.95];
  const cestino = gruppo((() => { const c = ombra(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.3, 24, 1, true), M(0x3A3B40, { roughness: 0.6 }))); c.material.side = THREE.DoubleSide; c.position.y = 0.15; return c; })(),
    at(cyl(0.11, 0.11, 0.012, M(0x3A3B40), 20), 0, 0.006, 0), at(ell(0.045, 1, 0.8, 1.1, bianco), 0.03, 0.05, -0.02));
  stanza.add(at(cestino, CESTINO[0], 0, CESTINO[1]));
  const pallinaNelCestino = at(ell(0.042, 1.1, 0.85, 1, bianco), -0.03, 0.1, 0.03); pallinaNelCestino.visible = false; cestino.add(pallinaNelCestino);
  const pallina = ell(0.04, 1.1, 0.85, 1, bianco); pallina.visible = false; stanza.add(pallina);

  function annaffiatoio() {
    const blu = M(0x0E9CD8, { roughness: 0.45 }), g = gruppo(at(cyl(0.065, 0.07, 0.12, blu, 24), 0, 0.06, 0));
    const becco = cyl(0.011, 0.016, 0.19, blu, 10); becco.position.set(0, 0.085, 0.12); becco.rotation.x = 1.0; g.add(becco, at(cyl(0.02, 0.011, 0.02, blu, 10), 0, 0.137, 0.2));
    const manico = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 16, PI), blu)); manico.position.set(0, 0.07, -0.06); manico.rotation.set(0, PI / 2, -PI / 2); g.add(manico);
    return g;
  }
  const CAN = [1.1, 1.36];
  const canTerra = at(annaffiatoio(), CAN[0], 0, CAN[1]); canTerra.rotation.y = -2.3; stanza.add(canTerra);
  const gocce = [0, 1, 2].map(() => { const g = sph(0.012, M(0x7CC6F2, { roughness: 0.2 }), 8, 6); g.castShadow = false; g.visible = false; stanza.add(g); return g; });

