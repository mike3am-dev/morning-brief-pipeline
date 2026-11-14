  /* ================================================================ l'angolo delle riunioni: il tavolo di Mike
     Un tavolo rotondo e alto, in basso a destra: tre sgabelli per chi viene convocato e la sedia da regista di Mike,
     che è il direttore creativo. Sul tavolo c'è la prima pagina di oggi, che si compone da sola (si tocca, e si apre),
     e accanto il registro delle decisioni: è qui che si decide. */
  const MIKE = [11.2, 6.9], ALTO_TL = 0.92, TAVOLO_R = 0.84;   // centro, altezza del piano, raggio
  const tavolo = gruppo(); at(tavolo, MIKE[0], 0, MIKE[1]); stanza.add(tavolo); tavolo.userData.id = 'prima'; cliccabili.push(tavolo);
  tavolo.add(at(cyl(TAVOLO_R, TAVOLO_R, 0.05, legno, 64), 0, ALTO_TL - 0.025, 0), at(cyl(TAVOLO_R + 0.012, TAVOLO_R + 0.012, 0.028, nero, 64), 0, ALTO_TL - 0.05, 0),
    at(cyl(0.065, 0.075, ALTO_TL - 0.09, nero, 20), 0, (ALTO_TL - 0.09) / 2 + 0.02, 0), at(cyl(0.44, 0.48, 0.04, nero, 44), 0, 0.02, 0));
  punto(0xFFF2D8, 5, MIKE[0], 1.6, MIKE[1], 3.8);

  // la prima pagina: un foglio bianco su cui le strisce arrivano una alla volta. È girata verso chi guarda
  const PAGINA = { w: 0.68, h: 0.68 * PRIMA.H / PRIMA.W }, foglioPrima = gruppo(); foglioPrima.rotation.y = PI / 4; at(foglioPrima, -0.1, ALTO_TL + 0.003, -0.1); tavolo.add(foglioPrima);
  foglioPrima.add(at(box(PAGINA.w + 0.02, 0.003, PAGINA.h + 0.02, bianco, 0.001), 0, 0, 0));
  { const a = alone('prima', PAGINA.w + 0.1, PAGINA.h + 0.1); a.rotation.x = -PI / 2; foglioPrima.add(at(a, 0, -0.0012, 0)); }   // il bordo che si accende sotto il mouse
  const STRISCE = PRIMA.strisce.map(([y0, alta]) => { const g = new THREE.PlaneGeometry(PAGINA.w, PAGINA.h * alta / PRIMA.H), uv = g.attributes.uv, v1 = 1 - y0 / PRIMA.H, v0 = 1 - (y0 + alta) / PRIMA.H;
    uv.setXY(0, 0, v1); uv.setXY(1, 1, v1); uv.setXY(2, 0, v0); uv.setXY(3, 1, v0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: PRIMA.tex, transparent: true, toneMapped: false })); m.rotation.x = -PI / 2;
    m.position.set(0, 0.004, -PAGINA.h / 2 + PAGINA.h * (y0 + alta / 2) / PRIMA.H); foglioPrima.add(m); return m; });
  function compone(T) {   // nei primi quaranta secondi del giro la pagina si compone; poi resta lì, finita
    STRISCE.forEach((m, i) => { const u = fra(T, 6 + i * 6, 6.9 + i * 6); m.visible = u > 0.001; m.material.opacity = u; m.position.y = 0.004 + (1 - u) * 0.1; });
  }

  // sul tavolo: la lente, la matita rossa, una tazza, il segnaposto di Mike
  const attrezzi = gruppo(); at(attrezzi, 0, ALTO_TL, 0); tavolo.add(attrezzi);
  const lente = gruppo(ombra(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 10, 28), alluminio)), at(box(0.014, 0.012, 0.11, nero, 0.004), 0, 0, 0.11)); lente.children[0].rotation.x = PI / 2; lente.rotation.y = -0.5; attrezzi.add(at(lente, -0.42, 0.012, 0.42));
  const matita = cyl(0.006, 0.006, 0.17, M(0xE01F3D, { roughness: 0.4 }), 8); matita.rotation.set(PI / 2, 0, -0.7); attrezzi.add(at(matita, -0.22, 0.008, 0.6));
  attrezzi.add(at(tazza(C.yellow, 0.6), -0.62, 0, 0.22));
  // i segnaposto: un cartoncino piegato, scritto sulle due facce
  const cavaliere = (su, sotto, col) => gruppo(...[-1, 1].map(k => { const f = stampa(0.2, 0.2 * 220 / 360, texTarga(su, sotto, col)); f.material.side = THREE.DoubleSide; f.rotation.x = -k * 0.42; f.rotation.y = k > 0 ? 0 : PI; f.position.set(0, 0.058, k * 0.024); return f; }));
  const segnaposto = cavaliere('MIKE', 'direttore creativo'); segnaposto.rotation.y = PI / 4; attrezzi.add(at(segnaposto, 0.46, 0, 0.46));
  // il registro delle decisioni: un libro verde, che si tocca e si apre
  const texRegistro = tela(256, 340, (x, w, h) => { x.fillStyle = '#1F5A3C'; x.fillRect(0, 0, w, h); x.strokeStyle = '#D9A93B'; x.lineWidth = 6; x.strokeRect(16, 16, w - 32, h - 32);
    x.fillStyle = '#F3E3B0'; x.textAlign = 'center'; x.font = `800 42px ${DISPLAY}`; spazia(x, 0.1, 42); x.fillText('REGISTRO', w / 2 + 2, 150); x.font = `700 21px ${DISPLAY}`; x.fillText('DELLE DECISIONI', w / 2 + 2, 188); spazia(x, 0, 1); x.textAlign = 'left'; });
  const copertina = M(0x1F5A3C, { roughness: 0.7 });
  const libro = gruppo(at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.003, 0), at(box(0.186, 0.024, 0.258, M(0xF3EBDD, { roughness: 0.9 }), 0.002), 0.004, 0.018, 0), at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.033, 0), at(box(0.012, 0.036, 0.27, copertina, 0.004), -0.094, 0.018, 0),
    (() => { const s = stampa(0.19, 0.255, texRegistro); s.rotation.x = -PI / 2; s.position.y = 0.0365; return s; })());
  libro.rotation.y = PI / 4 - 0.25; libro.userData.id = 'decisioni'; attrezzi.add(at(libro, 0.58, 0, -0.3));
  { const a = alone('decisioni', 0.29, 0.36); a.rotation.x = -PI / 2; libro.add(at(a, 0, 0.0015, 0)); }

  // intorno: tre sgabelli di legno per chi viene convocato, e la sedia da regista di Mike, di spalle a noi
  const sgabelloDi = () => gruppo(at(cyl(0.17, 0.17, 0.05, legno, 28), 0, 0.64, 0), at(cyl(0.022, 0.022, 0.6, alluminio, 12), 0, 0.32, 0), at(cyl(0.2, 0.22, 0.025, alluminio, 28), 0, 0.0125, 0),
    (() => { const a = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 8, 28), alluminio)); a.rotation.x = PI / 2; a.position.y = 0.26; return a; })());
  const intorno = a => [MIKE[0] + Math.sin(a) * 1.1, MIKE[1] + Math.cos(a) * 1.1];
  const SGABELLI = [3 * PI / 4, 5 * PI / 4, 7 * PI / 4].map(intorno); SGABELLI.forEach(([x, z]) => stanza.add(at(sgabelloDi(), x, 0, z)));
  const texRegista = tela(420, 200, (x, w, h) => { x.fillStyle = '#17181B'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.fillStyle = C.yellow; x.font = `800 112px ${DISPLAY}`; spazia(x, 0.1, 112); x.fillText('MIKE', w / 2 + 6, 122);
    x.fillStyle = '#F8F6F2'; x.font = `700 26px ${DISPLAY}`; spazia(x, 0.16, 26); x.fillText('DIRETTORE CREATIVO', w / 2 + 2, 168); spazia(x, 0, 1); x.textAlign = 'left'; });
  const SEDIA_MIKE = intorno(PI / 4), tela2 = M(0x17181B, { roughness: 0.9 });
  const sediaRegista = gruppo(
    ...[-1, 1].flatMap(dx => [-1, 1].map(dz => at(box(0.035, 0.7, 0.035, legno, 0.008), dx * 0.21, 0.35, dz * 0.17))),                       // le quattro gambe
    ...[-1, 1].map(dx => at(box(0.035, 0.035, 0.38, legno, 0.008), dx * 0.21, 0.2, 0)), at(box(0.42, 0.03, 0.03, legno, 0.008), 0, 0.3, 0.17),   // i traversi e il poggiapiedi
    at(box(0.42, 0.025, 0.36, tela2, 0.01), 0, 0.7, 0),                                                                                       // la seduta di tela
    ...[-1, 1].map(dx => at(box(0.035, 0.52, 0.035, legno, 0.008), dx * 0.21, 0.95, -0.17)), ...[-1, 1].map(dx => at(box(0.04, 0.025, 0.36, legno, 0.008), dx * 0.21, 0.9, 0)),   // i montanti dello schienale, i braccioli
    at(box(0.42, 0.2, 0.014, tela2, 0.004), 0, 1.08, -0.17), (() => { const s = stampa(0.4, 0.4 * 200 / 420, texRegista); s.rotation.y = PI; return at(s, 0, 1.08, -0.1785); })());
  sediaRegista.rotation.y = 5 * PI / 4; stanza.add(at(sediaRegista, SEDIA_MIKE[0], 0, SEDIA_MIKE[1]));

