  /* ================================================================ il muro delle notizie: dal pavimento al soffitto
     Una griglia sola, a tre colonne. In cima: il marchio, cinque orologi, il conto alla rovescia con lo stato
     dell'edizione. Sotto: a sinistra i tre canali (le altre schede dell'app), in mezzo la mappa e la striscia
     dell'ultim'ora, a destra la borsa, le fonti e le discussioni. Quando la pagina si apre, e poi una volta ogni giro,
     tutto il muro diventa la sigla: il marchio e il sole, e nient'altro. */
  const MZ = 0.076, nerissimo = M(0x0B0D12, { roughness: 0.45 });
  stanza.add(at(box(MURO.w, ALTA, 0.07, nerissimo, 0.012), MURO.x, ALTA / 2, 0.036));
  const mBordo = 0.09, mSpazio = 0.05, mCol = 1.01, mMezzo = MURO.w - 2 * mBordo - 2 * mCol - 2 * mSpazio;   // le colonne ai lati, e quella di mezzo (3,30)
  const mxA = MURO.sin + mBordo + mCol / 2, mSinB = MURO.sin + mBordo + mCol + mSpazio, mxC = MURO.sin + MURO.w - mBordo - mCol / 2;
  const mSu1 = ALTA - mBordo, mAlta1 = 0.5, mSu2 = mSu1 - mAlta1 - mSpazio, mAlta3 = (mSu2 - mBordo - 2 * mSpazio) / 3;   // la riga in cima; sotto, tre riquadri per colonna
  const mRiga = i => mSu2 - mAlta3 / 2 - i * (mAlta3 + mSpazio);
  const sulMuro = (w, h, tex, x, y) => { const s = schermo(w, h, tex); stanza.add(at(s, x, y, MZ)); return s; };

  // in cima: il marchio, gli orologi, il conto alla rovescia
  sulMuro(mCol, mAlta1, texLogoMuro, mxA, mSu1 - mAlta1 / 2); sulMuro(mCol, mAlta1, texConto, mxC, mSu1 - mAlta1 / 2);
  [['San Francisco', 'America/Los_Angeles'], ['New York', 'America/New_York'], ['Londra', 'Europe/London'], ['Milano', 'Europe/Rome'], ['Tokyo', 'Asia/Tokyo']].forEach(([nome, fuso], i) => { const x = mSinB + mMezzo * (i + 0.5) / 5;
    stanza.add(at(orologioDi(fuso, 0.155), x, mSu1 - 0.185, MZ + 0.012)); sulMuro(0.42, 0.42 * 64 / 220, texCitta(nome), x, mSu1 - 0.43); });

  // a sinistra: i tre canali
  const TV = [0, 1, 2].map(i => { const mat = new THREE.MeshBasicMaterial({ map: canali[i][0], toneMapped: false }); stanza.add(at(new THREE.Mesh(new THREE.PlaneGeometry(mCol, mAlta3), mat), mxA, mRiga(i), MZ)); viviSchermi.push(mat); return { mat, i }; });

  // in mezzo: la mappa, e sotto la striscia dell'ultim'ora
  const altaNastro = 0.17, altaMappa = mSu2 - mBordo - altaNastro - mSpazio, PX = mMezzo / MW;
  sulMuro(mMezzo, altaMappa, texMappa, mSinB + mMezzo / 2, mSu2 - altaMappa / 2);
  const PING = [], geoAnello = new THREE.RingGeometry(0.72, 1, 40);
  const ping = (lon, lat, r, colore, periodo, fase) => { const [a, b] = suMappa(lon, lat), m = new THREE.Mesh(geoAnello, new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    at(m, mSinB + a * PX, mSu2 - b * PX, MZ + 0.004); stanza.add(m); PING.push({ m, r, periodo, fase }); };
  (MAPPA.luoghi || []).forEach((l, i) => ping(l.lon, l.lat, raggioDi(l) * PX * 2.6, 0xF5C518, 3.4 + (i % 4) * 0.7, i * 0.37));
  Object.keys(caldePer).forEach((luogo, i) => { const c = MAPPA.calde.find(q => q.luogo === luogo); ping(c.lon, c.lat, 0.1, 0xFF3B55, 1.6, i * 0.5); ping(c.lon, c.lat, 0.1, 0xFF3B55, 1.6, i * 0.5 + 0.8); });
  const largaUltimora = altaNastro * 360 / 96, largaNastro = mMezzo - largaUltimora;
  nastro.tex.repeat.set(largaNastro * (96 / altaNastro) / nastro.larga, 1);
  sulMuro(largaUltimora, altaNastro, texUltimora, mSinB + largaUltimora / 2, mBordo + altaNastro / 2); sulMuro(largaNastro, altaNastro, nastro.tex, mSinB + largaUltimora + largaNastro / 2, mBordo + altaNastro / 2);

  // a destra: la borsa, le fonti, le discussioni che scorrono
  sulMuro(mCol, mAlta3, texBorsa, mxC, mRiga(0)); sulMuro(mCol, mAlta3, texFonti, mxC, mRiga(1));
  const altaTitolo = mCol * 60 / 390, altaRullo = mAlta3 - altaTitolo, vistaRullo = altaRullo / mCol * 390;   // quanti punti della tela si vedono alla volta
  rullo.tex.repeat.set(1, vistaRullo / rullo.alta); rullo.tex.offset.set(0, 1 - vistaRullo / rullo.alta);
  sulMuro(mCol, altaTitolo, texDiscussioni, mxC, mRiga(2) + mAlta3 / 2 - altaTitolo / 2); sulMuro(mCol, altaRullo, rullo.tex, mxC, mRiga(2) - mAlta3 / 2 + altaRullo / 2);

  const chiarore = new THREE.PointLight(0x9CC4FF, 0, 5.5, 1.6); chiarore.position.set(MURO.x, 1.6, 1.1); chiarore.userData.max = 8; lampade.push(chiarore); stanza.add(chiarore);   // la sera il muro illumina chi gli sta davanti

  // la sigla: una lastra davanti a tutto, di solito trasparente
  const matSigla = new THREE.MeshBasicMaterial({ map: texSigla, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
  const sigla = new THREE.Mesh(new THREE.PlaneGeometry(MURO.w - 0.1, ALTA - 0.1), matSigla); sigla.renderOrder = 20; sigla.visible = false; stanza.add(at(sigla, MURO.x, ALTA / 2, MZ + 0.06));
  let siglaDa = null, siglaForzata = null;
  const apriSigla = () => { siglaDa = performance.now() / 1000; };

  // tutto quello che sul muro si muove: gli anelli, il nastro, il rullo, i canali, la sigla. `fretta` è 1 di solito, di più quando si chiude
  let oraMuro = 0, ultimoMuro = 0;
  function muroVivo(adesso, fretta = 1) {
    const dt = Math.min(0.2, Math.max(0, adesso - ultimoMuro)); ultimoMuro = adesso; oraMuro += dt * fretta;
    for (const p of PING) { const u = ((oraMuro / p.periodo + p.fase) % 1 + 1) % 1; p.m.scale.setScalar(p.r * (0.35 + 0.9 * u)); p.m.material.opacity = 0.9 * (1 - u) * (1 - u); }
    nastro.tex.offset.x = (nastro.tex.offset.x + dt * (0.11 + 0.05 * (fretta - 1)) * 640 / nastro.larga) % 1;
    if (rullo.scorre) rullo.tex.offset.y = ((rullo.tex.offset.y - dt * 13 / rullo.alta) % 1 + 1) % 1;
    for (const t of TV) { const serie = canali[t.i], quale = serie[Math.floor(adesso / 9 + t.i * 0.4) % serie.length]; if (t.mat.map !== quale) { t.mat.map = quale; t.mat.needsUpdate = true; } }
    viviSchermi.forEach((m, i) => { m.color.setScalar(1 - (0.035 + 0.03 * (fretta - 1)) * (1 + Math.sin(adesso * (1.7 + (i % 7) * 0.41) + i * 1.3))); });
    // la sigla: all'apertura della pagina per qualche secondo, poi venti secondi a metà di ogni giro; mai mentre si chiude
    const T = tempoGiro(), ident = campana(T, 150, 151.6, 168.4, 170), inizio = siglaDa == null ? 0 : 1 - fra(performance.now() / 1000 - siglaDa, 3.6, 5.4);
    const op = siglaForzata != null ? siglaForzata : fermo || fretta > 1 ? 0 : Math.max(ident, inizio);
    matSigla.opacity = op; sigla.visible = op > 0.004;
  }

