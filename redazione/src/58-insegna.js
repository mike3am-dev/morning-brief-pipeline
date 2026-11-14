  /* ================================================================ l'insegna sopra la regia: a che punto è l'edizione
     È un giornale, non una radio: niente «in onda». L'insegna dice una di quattro cose, e la dice guardando l'orologio
     vero e l'edizione che la pagina ha davanti:
       USCITA · 5:57     verde: l'edizione di oggi è uscita
       IN CHIUSURA       rossa e lampeggiante: è l'ora della corsa e l'edizione di oggi non è ancora arrivata
       IN RITARDO        rossa fissa: l'ora è passata e l'edizione di oggi non c'è
       SI CHIUDE ALLE 6  spenta: è un giorno nuovo, la corsa deve ancora cominciare */
  const texInsegna = (testo, fondo, colore) => tela(512, 150, (x, w, h) => { x.fillStyle = fondo; x.fillRect(0, 0, w, h); x.fillStyle = colore; const px = testo.length > 13 ? 56 : 76;
    x.font = `800 ${px}px ${DISPLAY}`; spazia(x, 0.08, px); x.textAlign = 'center'; x.fillText(testo, w / 2 + 3, h / 2 + px * 0.35); spazia(x, 0, 1); x.textAlign = 'left'; });
  const INSEGNE = { uscita: texInsegna('USCITA · ' + oraCorta(USCITA), '#0E2A1A', '#5BE08A'), chiusura: texInsegna('IN CHIUSURA', '#3A0A12', '#FF5468'), ritardo: texInsegna('IN RITARDO', '#3A0A12', '#FF5468'),
    attesa: texInsegna('SI CHIUDE ALLE ' + PROSSIMA[0] + ':' + String(PROSSIMA[1]).padStart(2, '0'), '#1A1C23', '#7C8698') };
  const insegna = gruppo(); at(insegna, REGIA[0] + Math.sin(FRONTE) * 1.04, 0, REGIA[1] + Math.cos(FRONTE) * 1.04); insegna.rotation.y = PI / 4; stanza.add(insegna);
  const matInsegna = new THREE.MeshBasicMaterial({ map: INSEGNE.attesa, toneMapped: false }), cupola = M(0xE01F3D, { roughness: 0.3, emissive: 0xFF2038, emissiveIntensity: 0.05 });
  const facciata = giro => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92 * 150 / 512), matInsegna); f.rotation.y = giro; return f; };
  insegna.add(at(cyl(0.016, 0.016, 1.22, alluminio, 10), 0, TAV + 0.61, 0), at(box(0.98, 0.31, 0.07, nerissimo, 0.02), 0, 2.07, 0), at(facciata(0), 0, 2.07, 0.037), at(facciata(PI), 0, 2.07, -0.037),
    at(ombra(new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 10, 0, PI * 2, 0, PI / 2), cupola)), 0, 2.225, 0), at(cyl(0.06, 0.06, 0.012, alluminio, 20), 0, 2.224, 0));
  const luceRossa = new THREE.PointLight(0xFF2038, 0, 4.5, 1.6); luceRossa.position.set(0, 2.35, 0.1); insegna.add(luceRossa);
  let edizioneForzata = null;
  function edizione() { if (edizioneForzata) return edizioneForzata;
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), h = oraDiRoma();
    return STATO.giorno === oggi ? 'uscita' : h >= 5.4 && h < 6.75 ? 'chiusura' : h >= 6.75 ? 'ritardo' : 'attesa'; }
  function insegnaViva(adesso) {   // restituisce la «fretta» della stanza: 1 di solito, 3 mentre si chiude
    const e = edizione(), lampo = e === 'chiusura' ? (Math.sin(adesso * 5.2) > -0.25 ? 1 : 0.22) : 1;
    if (matInsegna.map !== INSEGNE[e]) { matInsegna.map = INSEGNE[e]; matInsegna.needsUpdate = true; }
    matInsegna.color.setScalar(lampo); cupola.emissiveIntensity = e === 'chiusura' ? 0.3 + 2.4 * lampo : e === 'ritardo' ? 1.6 : 0.05; luceRossa.intensity = e === 'chiusura' ? 7 * lampo : e === 'ritardo' ? 3 : 0;
    document.documentElement.dataset.edizione = e; return e === 'chiusura' ? 3 : 1; }

