  /* ================================================================ il tavolo luminoso: dove si compone la prima pagina
     Sta al posto del tavolino di prima. È anche il posto di Mike: sul bordo ci sono il suo segnaposto e il registro. */
  const MIKE = [2.9, 7.0], ALTO_TL = 0.92, TAVOLO_MEZZO = [1.03, 0.59];   // centro, altezza del piano, mezzi lati
  const tavolo = gruppo(); at(tavolo, MIKE[0], 0, MIKE[1]); stanza.add(tavolo); tavolo.userData.id = 'prima'; cliccabili.push(tavolo);
  const luceTavolo = M(0xFFFFFF, { roughness: 0.35, emissive: 0xFFF1D6, emissiveIntensity: 0.5 });
  tavolo.add(at(box(2.0, 0.05, 1.12, luceTavolo, 0.012), 0, ALTO_TL - 0.025, 0), at(box(2.06, 0.1, 1.18, nero, 0.02), 0, ALTO_TL - 0.09, 0), at(box(1.84, 0.03, 0.92, legno, 0.012), 0, 0.3, 0),
    ...[-1, 1].flatMap(dx => [-1, 1].map(dz => at(box(0.07, ALTO_TL - 0.14, 0.07, legnoScuro, 0.012), dx * 0.92, (ALTO_TL - 0.14) / 2, dz * 0.48))),
    ...[0, 1, 2].map(i => { const r = cyl(0.045, 0.045, 0.7, i === 1 ? M(0xEFEBE2) : bianco, 16); r.rotation.z = PI / 2; r.rotation.y = 0.1 * (i - 1); return at(r, -0.3 + i * 0.12, 0.36 + (i === 1 ? 0.07 : 0), -0.1 + i * 0.1); }));
  punto(0xFFF2D8, 5, MIKE[0], 1.55, MIKE[1], 3.6);

  // la prima pagina: un foglioPrima bianco su cui le strisce arrivano una alla volta
  const PAGINA = { w: 0.68, h: 0.68 * PRIMA.H / PRIMA.W }, foglioPrima = gruppo(); foglioPrima.rotation.y = 0.08; at(foglioPrima, -0.54, ALTO_TL + 0.003, 0.0); tavolo.add(foglioPrima);
  foglioPrima.add(at(box(PAGINA.w + 0.02, 0.003, PAGINA.h + 0.02, bianco, 0.001), 0, 0, 0));
  const STRISCE = PRIMA.strisce.map(([y0, alta]) => { const g = new THREE.PlaneGeometry(PAGINA.w, PAGINA.h * alta / PRIMA.H), uv = g.attributes.uv, v1 = 1 - y0 / PRIMA.H, v0 = 1 - (y0 + alta) / PRIMA.H;
    uv.setXY(0, 0, v1); uv.setXY(1, 1, v1); uv.setXY(2, 0, v0); uv.setXY(3, 1, v0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: PRIMA.tex, transparent: true, toneMapped: false })); m.rotation.x = -PI / 2;
    m.position.set(0, 0.004, -PAGINA.h / 2 + PAGINA.h * (y0 + alta / 2) / PRIMA.H); foglioPrima.add(m); return m; });
  function compone(T) {   // nei primi quaranta secondi del giro la pagina si compone; poi resta lì, finita
    STRISCE.forEach((m, i) => { const u = fra(T, 6 + i * 6, 6.9 + i * 6); m.visible = u > 0.001; m.material.opacity = u; m.position.y = 0.004 + (1 - u) * 0.1; });
  }

  // gli attrezzi dell'impaginazione: le strisce di prova, il righello, la lente, la matita rossa
  const attrezzi = gruppo(); at(attrezzi, 0, ALTO_TL, 0); tavolo.add(attrezzi);
  [[-0.02, 0.06, 0.05]].forEach(([x, z, giro], i) => { const s = stampa(0.11, 0.5, texPagine(41 + i)); s.rotation.set(-PI / 2, 0, giro); attrezzi.add(at(s, x, 0.004 + i * 0.001, z)); });
  const righello = box(0.42, 0.004, 0.036, M(0xF5C518, { roughness: 0.5 }), 0.001); righello.rotation.y = -0.4; attrezzi.add(at(righello, -0.16, 0.006, 0.46));
  const lente = gruppo(ombra(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 10, 28), alluminio)), at(box(0.014, 0.012, 0.11, nero, 0.004), 0, 0, 0.11)); lente.children[0].rotation.x = PI / 2; lente.rotation.y = 0.7; attrezzi.add(at(lente, 0.12, 0.012, 0.38));
  const matita = cyl(0.006, 0.006, 0.17, M(0xE01F3D, { roughness: 0.4 }), 8); matita.rotation.set(PI / 2, 0, 0.9); attrezzi.add(at(matita, 0.02, 0.008, -0.4));
  attrezzi.add(at(tazza(C.yellow, 0.6), 0.22, 0, -0.44));
  // il segnaposto di Mike
  const segnaposto = gruppo(...[-1, 1].map(s => { const f = stampa(0.2, 0.2 * 220 / 360, texTarga('MIKE', 'direttore creativo')); f.material.side = THREE.DoubleSide; f.rotation.x = -s * 0.42; f.rotation.y = s > 0 ? 0 : PI; f.position.set(0, 0.058, s * 0.024); return f; }));
  segnaposto.rotation.y = PI / 4; attrezzi.add(at(segnaposto, 0.84, 0, -0.38));
  // il registro delle decisioni: un libro verde, che si tocca e si apre
  const texRegistro = tela(256, 340, (x, w, h) => { x.fillStyle = '#1F5A3C'; x.fillRect(0, 0, w, h); x.strokeStyle = '#D9A93B'; x.lineWidth = 6; x.strokeRect(16, 16, w - 32, h - 32);
    x.fillStyle = '#F3E3B0'; x.textAlign = 'center'; x.font = `800 42px ${DISPLAY}`; spazia(x, 0.1, 42); x.fillText('REGISTRO', w / 2 + 2, 150); x.font = `700 21px ${DISPLAY}`; x.fillText('DELLE DECISIONI', w / 2 + 2, 188); spazia(x, 0, 1); x.textAlign = 'left'; });
  const copertina = M(0x1F5A3C, { roughness: 0.7 });
  const libro = gruppo(at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.003, 0), at(box(0.186, 0.024, 0.258, M(0xF3EBDD, { roughness: 0.9 }), 0.002), 0.004, 0.018, 0), at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.033, 0), at(box(0.012, 0.036, 0.27, copertina, 0.004), -0.094, 0.018, 0),
    (() => { const s = stampa(0.19, 0.255, texRegistro); s.rotation.x = -PI / 2; s.position.y = 0.0365; return s; })());
  libro.rotation.y = -0.3; libro.userData.id = 'decisioni'; attrezzi.add(at(libro, 0.84, 0, 0.3));
  // uno sgabello alto, giallo
  const sgabello = gruppo(at(cyl(0.17, 0.17, 0.05, M(0xF5C518, { roughness: 0.85 }), 28), 0, 0.64, 0), at(cyl(0.022, 0.022, 0.6, alluminio, 12), 0, 0.32, 0), at(cyl(0.2, 0.22, 0.025, alluminio, 28), 0, 0.0125, 0),
    (() => { const a = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 8, 28), alluminio)); a.rotation.x = PI / 2; a.position.y = 0.26; return a; })());
  const SGABELLO = [MIKE[0] + 0.45, MIKE[1] + 0.95]; stanza.add(at(sgabello, SGABELLO[0], 0, SGABELLO[1]));

