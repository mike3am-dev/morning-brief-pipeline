  /* La lavagna: uno studio in corso, scritto a mano. Ogni numero è vero, e viene dallo stato del giorno. */
  const INIZIALI = 'DLMMGVS';
  function ritocco(prima, dopo) {   // le parole cambiate fra due versioni di un titolo
    const a = prima.split(' '), b = dopo.split(' '); let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
    let da = a.slice(i, a.length - j), ad = b.slice(i, b.length - j);
    if (!da.length || !ad.length) { da = a.slice(Math.max(0, i - 1), a.length - j + 1); ad = b.slice(Math.max(0, i - 1), b.length - j + 1); }
    const stringi = p => p.length > 3 ? p.slice(0, 3).join(' ') + '…' : p.join(' ');
    return [stringi(da), stringi(ad)];
  }
  function disegnino(x, reparto) {   // un disegno per reparto, per le foto appuntate (140 × 138, centrato)
    const k = (reparto || '').toLowerCase(); x.lineCap = 'round'; x.lineJoin = 'round';
    if (k === 'casa') { x.fillStyle = C.ink; rr(x, -48, -58, 96, 70, 8); x.fill(); x.fillStyle = '#7CC6F2'; rr(x, -42, -52, 84, 58, 5); x.fill();
      x.fillStyle = '#C9CCD1'; x.beginPath(); x.arc(0, 44, 32, PI, 0); x.fill(); x.fillRect(-5, 10, 10, 12); }
    else if (k === 'iphone' || k === 'ipad') { const l = k === 'ipad' ? 84 : 56; x.fillStyle = C.ink; rr(x, -l / 2, -60, l, 110, 12); x.fill(); x.fillStyle = '#F2A65A'; rr(x, -l / 2 + 6, -54, l - 12, 98, 7); x.fill();
      x.fillStyle = C.ink; rr(x, -10, -51, 20, 7, 3.5); x.fill(); }
    else if (k === 'mac') { x.fillStyle = C.ink; rr(x, -50, -48, 100, 68, 7); x.fill(); x.fillStyle = '#9CCBE8'; rr(x, -44, -42, 88, 56, 4); x.fill(); x.fillStyle = '#C9CCD1'; rr(x, -62, 22, 124, 10, 5); x.fill(); }
    else if (k === 'watch') { x.fillStyle = '#8A8D93'; rr(x, -18, -64, 36, 122, 8); x.fill(); x.fillStyle = C.ink; rr(x, -30, -36, 60, 68, 16); x.fill(); x.fillStyle = C.red; x.beginPath(); x.arc(0, -2, 16, 0, 7); x.fill(); }
    else if (k === 'mercato') { x.strokeStyle = C.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(-52, -56); x.lineTo(-52, 44); x.lineTo(56, 44); x.stroke();
      x.strokeStyle = '#1F7A3F'; x.lineWidth = 7; x.beginPath(); x.moveTo(-40, 24); x.lineTo(-12, -4); x.lineTo(6, 12); x.lineTo(46, -40); x.stroke(); }
    else if (k === 'servizi') { x.fillStyle = C.ink; rr(x, -54, -46, 108, 76, 10); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(-14, -30); x.lineTo(22, -8); x.lineTo(-14, 14); x.fill(); x.fillStyle = C.ink; x.fillRect(-30, 36, 60, 8); }
    else if (k === 'ai') { x.fillStyle = '#2F7A3F'; rr(x, -38, -50, 76, 76, 6); x.fill(); x.fillStyle = '#8FCB6B'; rr(x, -22, -34, 44, 44, 4); x.fill();
      x.strokeStyle = C.ink; x.lineWidth = 4; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(i * 11, -50); x.lineTo(i * 11, -62); x.moveTo(i * 11, 26); x.lineTo(i * 11, 38); x.stroke(); } }
    else if (k === 'software') { x.fillStyle = '#FFFFFF'; rr(x, -52, -48, 104, 84, 8); x.fill(); x.fillStyle = C.blue; x.fillRect(-52, -48, 104, 18); x.fillStyle = '#B9B6AE'; for (let i = 0; i < 3; i++) x.fillRect(-40, -16 + i * 16, 80 - i * 18, 7); }
    else { x.fillStyle = '#5B6470'; x.fillRect(-40, -44, 34, 90); x.fillRect(0, -62, 42, 108);   // l'azienda, e tutto il resto: i palazzi
      x.fillStyle = '#FFD98A'; for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) { x.fillRect(-34 + c * 14, -36 + r * 16, 7, 9); x.fillRect(7 + c * 18, -52 + r * 19, 9, 11); } }
  }
  const FONDO_FOTO = { casa: '#DCEAF2', iphone: '#F3E6D3', ipad: '#F3E6D3', mac: '#E3E8EC', watch: '#F2DDE0', mercato: '#E9F0D8', servizi: '#E7E0F2', ai: '#E9F0D8', software: '#DDEBF5' };
  const texLavagna = tela(1400, 820, (x, w, h) => {
    const caso = casuale(41), VERDE = '#1F7A3F';
    x.fillStyle = '#FCFCFA'; x.fillRect(0, 0, w, h);
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(40,50,70,.035)'; x.lineWidth = 26 + caso() * 30; x.beginPath();   // le cancellature di ieri
      const a = caso() * w, b = caso() * h; x.moveTo(a, b); x.lineTo(a + 120 + caso() * 260, b + (caso() - 0.5) * 80); x.stroke(); }
    const tratto = (pts, col = C.ink, lw = 4) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
      pts.forEach(([a, b], i) => { const dx = (caso() - 0.5) * 2.4, dy = (caso() - 0.5) * 2.4; if (i) x.lineTo(a + dx, b + dy); else x.moveTo(a + dx, b + dy); }); x.stroke(); };
    const scrivi = (t, a, b, px, col = C.ink, f = A_MANO, rot = 0) => { x.save(); x.translate(a, b); x.rotate(rot); x.fillStyle = col; x.font = `700 ${px}px ${f}`; x.fillText(t, 0, 0); const l = x.measureText(t).width; x.restore(); return l; };
    const freccia = (a, b, c, d, col = C.ink) => { tratto([[a, b], [c, d]], col, 4); const an = Math.atan2(d - b, c - a);
      tratto([[c - 16 * Math.cos(an - 0.5), d - 16 * Math.sin(an - 0.5)], [c, d], [c - 16 * Math.cos(an + 0.5), d - 16 * Math.sin(an + 0.5)]], col, 4); };
    const cerchio = (cx, cy, rx, ry, col = C.red, lw = 5) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(cx, cy, rx, ry, -0.03, 0.25, 6.85); x.stroke(); };

    // in alto a sinistra: il giorno e l'uscita
    scrivi(GIORNI[OGGI.getDay()] + ' ' + OGGI.getDate(), 40, 84, 70, C.ink, PENNARELLO, -0.02);
    tratto([[40, 98], [120, 104], [200, 97], [262, 103]], C.red, 5);
    const lu = scrivi('uscita alle ' + oraCorta(USCITA), 290, 62, 34, VERDE); scrivi('✓', 300 + lu, 66, 44, VERDE, PENNARELLO);

    // a sinistra: l'apertura, con una correzione di Ivo
    const prime = STATO.lavagna.slice(0, 5);
    scrivi('APERTURA', 40, 168, 40, C.blue, PENNARELLO);
    prime.forEach((n, i) => { scrivi((i + 1) + '.', 44, 222 + i * 50, 34, C.ink3); scrivi(corto(n.titolo, 24), 86, 222 + i * 50, 36, C.ink); });
    cerchio(232, 210, 214, 31); scrivi('!!', 456, 224, 44, C.red, PENNARELLO);
    if (TITOLI.length) { const c = TITOLI[0], [da, ad] = ritocco(c.prima, c.dopo), riga = prime.findIndex(n => n.titolo === c.notizia);
      const l1 = scrivi('«' + da + '»', 60, 500, 28, C.ink2); tratto([[56, 490], [60 + l1 / 2, 487], [64 + l1, 491]], C.red, 5);
      const l2 = scrivi('→ «' + ad + '»', 78 + l1, 500, 28, C.red); if (78 + l1 + l2 < 520) scrivi('(Ivo)', 90 + l1 + l2, 500, 26, C.ink3);
      if (riga >= 0) freccia(70, 468, 62, 240 + riga * 50, C.red); }

    // al centro in alto: i minuti della corsa, a barre
    scrivi('LA CORSA', 610, 74, 38, C.blue, PENNARELLO); scrivi('minuti', 790, 72, 28, C.ink3);
    const bx = 620, by = 330, bw = 44, sc = 4.4, tetto = STATO.corsa.tetto || 45, ultime = (STATO.corsa.ultime || []).filter(u => u.minuti != null).slice(-7);
    tratto([[bx - 14, 96], [bx - 14, by], [bx + 392, by]], C.ink, 4);
    x.setLineDash([12, 10]); tratto([[bx - 14, by - tetto * sc], [bx + 392, by - tetto * sc]], C.red, 3); x.setLineDash([]);
    scrivi('tetto ' + tetto, bx + 290, by - tetto * sc - 10, 26, C.red);
    ultime.forEach((u, i) => { const m = u.minuti, a = bx + i * 56, alto = Math.min(m, 52) * sc, oggi = i === ultime.length - 1;
      x.strokeStyle = oggi ? C.orange : C.ink2; x.lineWidth = 3;
      for (let k = 0; k < alto; k += 9) { x.beginPath(); x.moveTo(a + 2, by - k - 3); x.lineTo(a + bw - 2, by - Math.min(alto, k + 8) - 1); x.stroke(); }
      tratto([[a, by], [a, by - alto], [a + bw, by - alto], [a + bw, by]], oggi ? C.orange : C.ink, 4);
      scrivi(String(m), a + 6, by - alto - 10, 28, oggi ? C.orange : C.ink); scrivi(INIZIALI[giornoDi(u.giorno).getDay()], a + 12, by + 34, 28, C.ink3); });

    // in alto a destra: le foto delle prime due notizie, appuntate
    const foto = (a, b, rot, n) => { const k = (n.reparto || '').toLowerCase(); x.save(); x.translate(a, b); x.rotate(rot);
      x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 10; x.shadowOffsetY = 4; x.fillStyle = '#fff'; x.fillRect(-82, -92, 164, 200); x.shadowColor = 'transparent';
      x.fillStyle = FONDO_FOTO[k] || '#E6E2DA'; x.fillRect(-70, -80, 140, 138); x.save(); x.translate(0, -8); disegnino(x, k); x.restore();
      x.fillStyle = C.ink; x.font = `700 26px ${A_MANO}`; x.fillText(unaRiga(x, n.titolo.split(/[\s.,:;]+/)[0], 136), -66, 96);
      x.fillStyle = 'rgba(245,197,24,.75)'; x.fillRect(-30, -104, 60, 22); x.restore(); };
    if (prime[0]) foto(1110, 170, -0.06, prime[0]); if (prime[1]) foto(1290, 196, 0.05, prime[1]);
    freccia(1010, 214, 470, 206, C.ink3);

    // in basso a sinistra: chi passa le carte a chi, con gli orari veri
    const riquadro = (a, b, l, t, col = C.ink) => { tratto([[a, b], [a + l, b], [a + l, b + 62], [a, b + 62], [a, b]], col, 4); scrivi(t, a + 14, b + 42, 30, col); };
    const quando = id => AGENTI[id] && AGENTI[id].entrata ? oraCorta(AGENTI[id].entrata) : '';
    scrivi('STAMATTINA', 40, 590, 36, C.blue, PENNARELLO);
    riquadro(40, 616, 128, 'Tobia'); riquadro(214, 616, 136, 'Ettore'); riquadro(396, 616, 96, 'Ivo', C.red);
    freccia(172, 647, 208, 647); freccia(354, 647, 390, 647); freccia(496, 647, 540, 647, VERDE);
    scrivi(quando('lettura'), 66, 712, 26, C.ink3); scrivi(quando('redattore'), 248, 712, 26, C.ink3); scrivi(quando('revisore'), 414, 712, 26, C.ink3);
    scrivi('ESCE', 548, 642, 30, VERDE, PENNARELLO); scrivi(oraCorta(USCITA), 548, 674, 30, VERDE, PENNARELLO);
    tratto([[40, 734], [300, 740], [520, 733]], C.ink3, 3);
    scrivi('Ada · Rita · Vito intanto, in parallelo', 46, 776, 28, C.ink2);

    // al centro in basso: cosa ha aperto Mike
    const lette = (STATO.letture || []).slice(-6), piu = Math.max(1, ...lette.map(l => l.aperte)), passo = Math.min(30, 230 / piu), iMax = lette.findIndex(l => l.aperte === piu);
    scrivi('LETTE DA MIKE', 640, 440, 38, C.blue, PENNARELLO); scrivi('voci aperte per edizione', 640, 474, 26, C.ink3);
    tratto([[640, 730], [1000, 733]], C.ink, 4);
    lette.forEach((l, i) => { const a = 668 + i * 58;
      for (let k = 0; k < l.aperte; k++) { x.fillStyle = i === iMax ? C.orange : C.ink; x.beginPath(); x.arc(a, 708 - k * passo, Math.min(11, passo * 0.4), 0, 7); x.fill(); }
      scrivi(INIZIALI[giornoDi(l.giorno).getDay()], a - 9, 768, 28, C.ink3); });
    if (lette.length && piu > 1) { const a = 668 + iMax * 58, alto = (piu - 1) * passo; cerchio(a, 708 - alto / 2, 30, alto / 2 + 26, C.red, 4); scrivi(piu + '!', a + 38, 708 - alto - 6, 36, C.red, PENNARELLO); }
    const ultima = lette[lette.length - 1]; if (ultima && ultima.aperte <= 1 && lette.length - 1 !== iMax) scrivi('solo ' + ultima.aperte + ' ?', 668 + (lette.length - 1) * 58 + 26, 704, 28, C.red);

    // a destra in basso: i post-it
    const postit = (a, b, rot, col, righe) => { x.save(); x.translate(a, b); x.rotate(rot); x.shadowColor = 'rgba(0,0,0,.2)'; x.shadowBlur = 9; x.shadowOffsetY = 4;
      x.fillStyle = col; x.fillRect(-78, -78, 156, 156); x.shadowColor = 'transparent'; x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(-78, -78, 156, 20);
      righe.forEach((r, i) => scrivi(r, -66, -22 + i * 36, 30, C.ink)); x.restore(); };
    const mazzo = (STATO.postit || []).find(p => p.mazzo), muti = ((STATO.macchine.feed || {}).rotti || []).length;
    if (mazzo) postit(1132, 470, -0.05, '#FFE45C', [mazzo.mazzo + ' richieste', 'di Lea !!']);
    if (STATO.gta) postit(1304, 492, 0.06, '#FF9DB0', ['GTA VI', STATO.gta.giorni > 0 ? '− ' + STATO.gta.giorni + ' giorni' : 'è uscito !!']);
    postit(1126, 668, 0.04, '#8FD3F4', [muti + ' feed', 'muti']);
    postit(1300, 684, -0.04, '#FFB46B', ['lunedì:', 'le fonti', '(Zeno)']);
  });

