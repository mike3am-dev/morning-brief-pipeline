  /* ================================================================ il marchio nella stanza, e i gruppi di lavoro
     Chi apre il modellino deve capire subito dov'è. Il tappeto della regia è il sole del marchio, con la falce azzurra
     dell'orizzonte; sul fronte del desk c'è la testata; sulla parete l'insegna luminosa (46-arredo.js); sul muro la
     sigla, dieci secondi ogni minuto (32-muro.js). Ogni gruppo di lavoro ha il suo tappeto, col nome scritto sopra. */
  // i tappeti dei gruppi: un colore tenue e il nome in basso a sinistra
  const texTappeto = (w, d, g, tondo) => tela(Math.round(w * 150), Math.round(d * 150), (x, W, H) => {
    x.fillStyle = g.fondo; if (tondo) { x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 3, 0, 7); x.fill(); } else { rr(x, 3, 3, W - 6, H - 6, 34); x.fill(); }
    x.strokeStyle = g.tinta; x.globalAlpha = 0.3; x.lineWidth = 5; if (tondo) { x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 16, 0, 7); x.stroke(); } else { rr(x, 15, 15, W - 30, H - 30, 22); x.stroke(); } x.globalAlpha = 1;
    x.fillStyle = g.tinta; x.font = `800 44px ${DISPLAY}`; spazia(x, 0.14, 44); if (tondo) { x.textAlign = 'center'; x.fillText(g.nome.toUpperCase(), W / 2 + 3, H - 52); x.textAlign = 'left'; } else x.fillText(g.nome.toUpperCase(), 40, H - 36); spazia(x, 0, 1); });
  const tappetoDi = (cx, cz, w, d, g, tondo) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: texTappeto(w, d, g, tondo), alphaTest: 0.5, roughness: 1 })); m.rotation.x = -PI / 2; m.receiveShadow = true; stanza.add(at(m, cx, 0.004, cz)); };
  tappetoDi(ISOLE.edizione[0], ISOLE.edizione[1], 3.5, 3.9, GRUPPI.edizione); tappetoDi(ISOLE.schede[0], ISOLE.schede[1], 3.5, 3.9, GRUPPI.schede);
  tappetoDi(ISOLE.design[0], ISOLE.design[1] + 0.26, 3.5, 2.1, GRUPPI.design); tappetoDi(ISOLE.archivio[0] + 0.09, ISOLE.archivio[1], 3.5, 2.25, GRUPPI.archivio);
  tappetoDi(MIKE[0], MIKE[1], 3.5, 3.5, { nome: 'Riunioni', tinta: '#1A6FA8', fondo: '#D3E5EE' }, true);

  // il tappeto della regia è il sole; sopra, la falce azzurra dell'orizzonte, girata verso chi guarda
  { const t = tela(1024, 1024, (x, w) => { x.save(); x.beginPath(); x.arc(512, 512, 506, 0, 7); x.clip(); falce(x, 512 - 830, 512 + 70, 1660, 560); x.restore(); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.7), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 1 })); m.rotation.x = -PI / 2; m.receiveShadow = true;
    const g = gruppo(at(m, 0, 0.0325, 0)); g.rotation.y = PI / 4; stanza.add(at(g, REGIA[0], 0, REGIA[1])); }

  // la testata sul fronte del desk della regia, dai due lati dell'apertura (come sui banconi dei telegiornali)
  { const mis = marchio(document.createElement('canvas').getContext('2d'), 0, 0, 100), alto = 0.3, largo = alto * mis.w / mis.h, raggio = R_OUT - 0.05 + 0.004, arco = largo / raggio;
    const t = tela(Math.round(420 * mis.w / mis.h), 420, (x, w, h) => { marchio(x, 4, 0, (h - 8) / mis.h * 100); });
    for (const lato of [-1, 1]) regiaG.add(at(new THREE.Mesh(new THREE.CylinderGeometry(raggio, raggio, alto, 36, 1, true, PI / 4 + lato * 0.9 - arco / 2, arco), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6 })), 0, 0.27, 0)); }

