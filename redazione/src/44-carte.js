  /* ================================================================ le carte di una redazione, in ordine
     Giornali impilati, rassegne aperte con l'evidenziatore, taccuini, registratori, microfoni: sui piani di lavoro, mai per terra. */
  const cartaGiornale = [M(0xF4F1E8, { roughness: 0.95 }), M(0xE7E2D6, { roughness: 0.95 })];
  function pilaGiornali(n, seme) { const caso = casuale(seme), g = gruppo();
    for (let i = 0; i < n; i++) { const f = at(box(0.31, 0.014, 0.22, cartaGiornale[i % 2], 0.004), (caso() - 0.5) * 0.03, 0.007 + i * 0.0145, (caso() - 0.5) * 0.03); f.rotation.y = (caso() - 0.5) * 0.5; g.add(f);
      if (i === n - 1) { const t = stampa(0.3, 0.21, texGiornale); t.rotation.x = -PI / 2; t.position.y = 0.0076; f.add(t); } }
    return g; }
  function rassegna(seme) { const g = gruppo();   // un giornale aperto: due pagine che si alzano appena dalla piega
    for (const s of [-1, 1]) { const perno = gruppo(), p = stampa(0.3, 0.42, texPagine(seme + s)); p.material.side = THREE.DoubleSide; p.rotation.x = -PI / 2; perno.add(at(p, s * 0.15, 0.004, 0)); perno.rotation.z = s * 0.09; g.add(perno); }
    return g; }
  const evidenziatore = (col = 0xF5E642) => { const g = gruppo(cyl(0.011, 0.011, 0.1, M(col, { roughness: 0.4 }), 10), at(cyl(0.0115, 0.0115, 0.03, nero, 10), 0, 0.062, 0)); g.rotation.z = PI / 2; g.position.y = 0.011; return gruppo(g); };
  function taccuino(seme) { const g = gruppo(at(box(0.14, 0.012, 0.2, bianco, 0.004), 0, 0.006, 0), at(box(0.14, 0.014, 0.016, nero, 0.004), 0, 0.007, -0.094)), t = stampa(0.136, 0.18, texBlocco(seme)); t.rotation.x = -PI / 2; g.add(at(t, 0, 0.0126, 0.008));
    const p = cyl(0.005, 0.005, 0.14, M(0x1E3A8A, { roughness: 0.4 }), 8); p.rotation.set(PI / 2, 0, 0.5); g.add(at(p, 0.1, 0.006, 0.02)); return g; }
  function registratore() { const g = gruppo(at(box(0.05, 0.02, 0.11, M(0x2A2B30, { roughness: 0.5 }), 0.008), 0, 0.01, 0), at(box(0.036, 0.002, 0.04, M(0x9CCBE8, { roughness: 0.3 }), 0.001), 0, 0.021, -0.02));
    g.add(at(sph(0.005, M(0xE01F3D, { emissive: 0xE01F3D, emissiveIntensity: 1 }), 8, 6), 0.012, 0.022, 0.035)); return g; }
  function microfono(col) { const m = gruppo(cyl(0.013, 0.011, 0.15, M(0x2A2B30, { roughness: 0.5 }), 12), at(sph(0.028, M(0x3A3B40, { roughness: 1 }), 14, 10), 0, 0.095, 0), at(box(0.05, 0.05, 0.05, M(col, { roughness: 0.6 }), 0.006), 0, 0.045, 0));
    m.rotation.z = PI / 2 - 0.1; m.position.y = 0.028; return gruppo(m); }

  // le pile per terra (x, z, quanti giornali, seme, giro): solo intorno all'isola dell'edizione, appoggiate ai lati dei tavoli. Contano anche per chi cammina
  const PILE = [[1.44, 2.95, 9, 3, 0.3], [1.44, 3.62, 6, 5, -0.4], [4.77, 2.78, 11, 7, 1.2], [4.77, 4.02, 5, 13, 0.2]];
  PILE.forEach(([x, z, n, seme, giro]) => { const p = pilaGiornali(n, seme); p.rotation.y = giro; stanza.add(at(p, x, 0, z)); });

