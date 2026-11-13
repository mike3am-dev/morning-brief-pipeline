  /* ================================================================ le tele */
  // Il fondale: solo il marchio e il visual della testata, come dietro alle trasmissioni del mattino.
  const texFondale = tela(2048, 943, (x, w, h) => {
    x.fillStyle = C.bone; x.fillRect(0, 0, w, h);
    const cx = 1620, cy = 800, R = 430;
    for (let r = 0, gy = 26; gy < h; gy += 44, r++) for (let gx = 26 + (r % 2) * 22; gx < w; gx += 44) {   // il campo di pallini
      const d = Math.hypot(gx - cx, gy - cy), rag = 13.5 * (1 - (d - R) / 760) * Math.min(1, Math.max(0, (gx - 1090) / 360));
      if (d > R + 6 && rag > 1.2) { x.fillStyle = d < R + 330 ? C.orange : C.red; x.beginPath(); x.arc(gx, gy, Math.min(13.5, rag), 0, 7); x.fill(); }
    }
    x.fillStyle = C.yellow; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    falce(x, 540, 560, 2300, 420);
    [[C.red, 0], [C.yellow, 1], [C.blue, 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(140 + i * 60, 124, 21, 0, 7); x.fill(); });
    marchio(x, 118, 196, 200);
  });

  function finestra(titolo) {   // la cornice di una finestra del Mac, per gli schermi
    return (x, w, h) => {
      x.fillStyle = '#DCD9D2'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(0, 0, w, 26);
      x.fillStyle = C.ink; x.font = `600 15px ${SISTEMA}`; x.fillText('', 12, 19); x.font = `700 14px ${SISTEMA}`; x.fillText('TMB', 38, 19);
      x.font = `400 14px ${SISTEMA}`; x.fillStyle = C.ink2; x.fillText('File   Modifica   Vista', 82, 19);
      x.fillStyle = C.paper; rr(x, 22, 40, w - 44, h - 54, 12); x.fill();
      [['#FF5F57', 0], ['#FEBC2E', 1], ['#28C840', 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(44 + i * 20, 60, 6.5, 0, 7); x.fill(); });
      x.fillStyle = C.ink3; x.font = `600 14px ${SISTEMA}`; x.textAlign = 'center'; x.fillText(titolo, w / 2, 65); x.textAlign = 'left';
    };
  }

  function foglio(seme, pulito = false) {   // una bozza stampata; quelle di Ivo hanno le correzioni a penna rossa
    return tela(300, 420, (x, w, h) => {
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
      x.fillStyle = C.ink; x.fillRect(28, 30, 190, 16); x.fillRect(28, 54, 120, 16);
      const caso = casuale(seme);
      for (let i = 0; i < 13; i++) {
        const y = 100 + i * 23, l = 150 + caso() * 94;
        x.fillStyle = '#B9B6AE'; x.fillRect(28, y, l, 8);
        if (!pulito && caso() < 0.3) { x.strokeStyle = C.red; x.lineWidth = 3.5; x.beginPath(); const a = 40 + caso() * 60, b = a + 50 + caso() * 70;
          x.moveTo(a, y + 4); x.lineTo(b, y + 3); x.stroke(); x.beginPath(); x.moveTo(b + 6, y - 2); x.lineTo(w - 36, y - 10 + caso() * 6); x.stroke(); }
      }
      if (!pulito) { x.strokeStyle = C.red; x.lineWidth = 3; x.beginPath(); x.ellipse(120, 48, 108, 30, -0.04, 0, 6.6); x.stroke(); }
    });
  }

  /* La storia di Apple, in sei manifesti disegnati da noi. */
  const sotto = (x, anno, riga, chiaro) => { x.fillStyle = chiaro ? '#FFFFFF' : C.ink; x.font = `800 58px ${DISPLAY}`; x.fillText(anno, 26, 462);
    x.font = `600 17px ${SISTEMA}`; x.globalAlpha = 0.8; x.fillText(riga, 28, 486); x.globalAlpha = 1; };
  const manifesti = [
    (x, w, h) => { x.fillStyle = '#E9E1CE'; x.fillRect(0, 0, w, h);   // Macintosh, 1984
      x.fillStyle = '#CFC4AB'; rr(x, 92, 62, 216, 300, 16); x.fill(); x.fillStyle = '#DDD3BC'; rr(x, 92, 62, 216, 286, 16); x.fill();
      x.fillStyle = '#34424A'; rr(x, 118, 88, 164, 128, 10); x.fill();
      x.fillStyle = '#F2F5F2'; x.font = `italic 46px ${CORSIVO}`; x.textAlign = 'center'; x.fillText('hello', 200, 166); x.textAlign = 'left';
      x.fillStyle = '#8D846F'; x.fillRect(214, 262, 66, 7); x.fillStyle = '#C3B89F'; rr(x, 104, 348, 192, 24, 6); x.fill();
      sotto(x, '1984', 'Macintosh · 24 gennaio'); },
    (x, w, h) => { x.fillStyle = '#111214'; x.fillRect(0, 0, w, h);   // Think different, 1997
      const o = document.createElement('canvas'); o.width = 120; o.height = 130; const y = o.getContext('2d');
      y.font = `110px ${SISTEMA}`; y.textAlign = 'center'; y.fillStyle = '#fff'; y.fillText('', 60, 104); y.globalCompositeOperation = 'source-atop';
      ['#61BB46', '#FDB827', '#F5821F', '#E03A3E', '#963D97', '#009DDC'].forEach((c, i) => { y.fillStyle = c; y.fillRect(0, 22 + i * 15.5, 120, 16); });
      x.drawImage(o, 140, 96);
      x.fillStyle = '#FFFFFF'; x.font = `400 42px ${GRAZIE}`; x.textAlign = 'center'; x.fillText('Think different.', 200, 300); x.textAlign = 'left';
      sotto(x, '1997', 'La campagna del ritorno', true); },
    (x, w, h) => { x.fillStyle = '#C6E9E6'; x.fillRect(0, 0, w, h);   // iMac, 1998
      x.fillStyle = '#128FA3'; x.beginPath(); x.ellipse(200, 222, 132, 142, 0, 0, 7); x.fill();
      x.fillStyle = '#E4F1F0'; rr(x, 96, 92, 208, 222, 34); x.fill();
      x.fillStyle = '#2D3A43'; rr(x, 120, 114, 160, 124, 18); x.fill();
      x.fillStyle = '#F2F5F2'; x.font = `italic 27px ${CORSIVO}`; x.textAlign = 'center'; x.fillText('hello (again)', 200, 184); x.textAlign = 'left';
      x.fillStyle = '#128FA3'; x.beginPath(); x.arc(140, 276, 15, 0, 7); x.arc(260, 276, 15, 0, 7); x.fill(); x.fillStyle = '#9FB7B8'; x.fillRect(176, 270, 48, 9);
      x.fillStyle = '#0E7D8F'; x.beginPath(); x.moveTo(120, 348); x.lineTo(280, 348); x.lineTo(300, 382); x.lineTo(100, 382); x.fill();
      sotto(x, '1998', 'iMac · 15 agosto'); },
    (x, w, h) => { x.fillStyle = '#B4D335'; x.fillRect(0, 0, w, h);   // iPod, 2001
      x.fillStyle = '#0B0B0C'; x.strokeStyle = '#0B0B0C'; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.arc(214, 108, 36, 0, 7); x.fill();
      x.beginPath(); x.moveTo(176, 150); x.lineTo(252, 152); x.lineTo(240, 268); x.lineTo(170, 262); x.fill();
      x.lineWidth = 30; x.beginPath(); x.moveTo(186, 164); x.lineTo(126, 118); x.lineTo(104, 54); x.stroke();
      x.beginPath(); x.moveTo(246, 166); x.lineTo(304, 214); x.lineTo(332, 170); x.stroke();
      x.lineWidth = 36; x.beginPath(); x.moveTo(186, 262); x.lineTo(140, 336); x.lineTo(98, 392); x.stroke();
      x.beginPath(); x.moveTo(228, 264); x.lineTo(276, 330); x.lineTo(330, 372); x.stroke();
      x.fillStyle = '#FFFFFF'; rr(x, 84, 16, 38, 56, 6); x.fill(); x.fillStyle = '#B4D335'; x.fillRect(90, 22, 26, 18);
      x.strokeStyle = '#FFFFFF'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(104, 72); x.bezierCurveTo(120, 150, 170, 150, 190, 104); x.stroke();
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(191, 102, 6, 0, 7); x.fill();
      sotto(x, '2001', 'iPod · 23 ottobre'); },
    (x, w, h) => { x.fillStyle = '#1B2029'; x.fillRect(0, 0, w, h);   // il primo Apple Store, 2001
      x.fillStyle = '#0B0C0F'; x.fillRect(34, 104, 332, 262);
      const g = x.createLinearGradient(0, 150, 0, 366); g.addColorStop(0, '#FFF7DE'); g.addColorStop(1, '#F3D9A0'); x.fillStyle = g; x.fillRect(54, 150, 292, 216);
      x.fillStyle = '#FFFFFF'; rr(x, 168, 62, 64, 64, 6); x.fill();
      x.fillStyle = '#0B0C0F'; x.font = `44px ${SISTEMA}`; x.textAlign = 'center'; x.fillText('', 200, 110); x.textAlign = 'left';
      x.fillStyle = 'rgba(11,12,15,.14)'; x.fillRect(196, 150, 8, 216);
      x.fillStyle = '#0B0C0F'; const caso = casuale(9);
      for (let i = 0; i < 11; i++) { const a = 62 + i * 27 + caso() * 8, alto = 54 + caso() * 16; x.beginPath(); x.arc(a, 366 - alto, 9, 0, 7); x.fill(); rr(x, a - 10, 366 - alto + 8, 20, alto - 8, 8); x.fill(); }
      x.fillStyle = '#2A313D'; x.fillRect(0, 366, w, 30);
      sotto(x, '2001', 'Il primo Apple Store · 19 maggio', true); },
    (x, w, h) => { x.fillStyle = '#101114'; x.fillRect(0, 0, w, h);   // iPhone, 2007
      x.fillStyle = '#C9CCD1'; rr(x, 128, 44, 144, 330, 26); x.fill(); x.fillStyle = '#0A0A0B'; rr(x, 134, 50, 132, 318, 22); x.fill();
      const g = x.createLinearGradient(0, 86, 0, 318); g.addColorStop(0, '#1D2A4A'); g.addColorStop(1, '#0E1424'); x.fillStyle = g; x.fillRect(144, 86, 112, 232);
      const col = ['#35C759', '#0E9CD8', '#F5C518', '#E01F3D', '#F0821E', '#7B4BE0', '#34AADC', '#8E8E93', '#FF9500', '#5AC8FA', '#FFCC00', '#FF3B30', '#4CD964', '#007AFF', '#FF2D55', '#C7C7CC'];
      for (let i = 0; i < 16; i++) { x.fillStyle = col[i]; rr(x, 152 + (i % 4) * 26, 96 + Math.floor(i / 4) * 34, 20, 20, 5); x.fill(); }
      x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(144, 282, 112, 36);
      ['#35C759', '#0E9CD8', '#F0821E', '#C7C7CC'].forEach((c, i) => { x.fillStyle = c; rr(x, 152 + i * 26, 290, 20, 20, 5); x.fill(); });
      x.strokeStyle = '#3A3B40'; x.lineWidth = 2.5; x.beginPath(); x.arc(200, 344, 13, 0, 7); x.stroke(); rr(x, 195, 339, 10, 10, 2.5); x.stroke();
      x.fillStyle = '#2B2C30'; rr(x, 184, 64, 32, 5, 2.5); x.fill();
      sotto(x, '2007', 'iPhone · 9 gennaio', true); },
  ].map(f => tela(400, 500, f));

  const texTazza = colore => tela(512, 160, (x, w, h) => {
    x.fillStyle = colore; x.fillRect(0, 0, w, h);
    x.fillStyle = C.paper; x.beginPath(); x.arc(w / 2, h / 2, 62, 0, 7); x.fill();
    x.save(); x.beginPath(); x.arc(w / 2, h / 2, 62, 0, 7); x.clip(); sole(x, w / 2, h / 2 - 4, 30); x.restore();
  });
  const texOrologio = tela(256, 256, x => {
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill();
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; x.fillStyle = C.ink; x.beginPath(); x.arc(128 + Math.sin(a) * 102, 128 - Math.cos(a) * 102, i % 3 === 0 ? 8 : 4, 0, 7); x.fill(); }
  });
  const texTasti = tela(580, 230, (x, w, h) => {
    x.fillStyle = '#D9DADD'; x.fillRect(0, 0, w, h); x.fillStyle = '#FAFAFA';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { if (r === 4 && c > 2 && c < 9) continue; rr(x, 14 + c * 39.6, 14 + r * 41.5, 34, 35, 6); x.fill(); }
    rr(x, 14 + 3 * 39.6, 14 + 4 * 41.5, 39.6 * 6 - 5.6, 35, 6); x.fill();
  });

  /* New York fuori dalla finestra, a quattro ore del giorno. */
  function cielo(nome) {
    const S = { alba: { a: '#86AEE0', b: '#FFC89C', lontani: '#C3A0A8', vicini: '#77667F', luci: 0.1, astro: ['#FFE9B8', 150, 372, 44] },
      giorno: { a: '#62B0EE', b: '#DCEFFB', lontani: '#A3C0DA', vicini: '#6585A3', luci: 0 },
      sera: { a: '#1C2760', b: '#F28C52', lontani: '#5A4878', vicini: '#221F40', luci: 0.5 },
      notte: { a: '#060A22', b: '#172050', lontani: '#161D42', vicini: '#090C20', luci: 0.3, astro: ['#F4F1E6', 420, 90, 26] } }[nome];
    return tela(536, 500, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, S.a); g.addColorStop(0.86, S.b); x.fillStyle = g; x.fillRect(0, 0, w, h);
      if (S.astro) { x.fillStyle = S.astro[0]; x.beginPath(); x.arc(S.astro[1], S.astro[2], S.astro[3], 0, 7); x.fill(); }
      if (nome === 'notte') { const c = casuale(3); x.fillStyle = '#FFFFFF'; for (let i = 0; i < 40; i++) x.fillRect(c() * w, c() * 220, 2, 2); }
      const caso = casuale(17);
      const finestre = (a, b, l, alto, forza) => { for (let fy = b + 7; fy < b + alto - 4; fy += 9) for (let fx = a + 4; fx < a + l - 5; fx += 7) {
        if (S.luci) { if (caso() < S.luci * forza) { x.fillStyle = caso() < 0.8 ? '#FFD98A' : '#BFE3FF'; x.fillRect(fx, fy, 3, 5); } }
        else if (caso() < 0.5) { x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(fx, fy, 3, 5); } } };
      const palazzo = (a, l, alto, col, forza) => { x.fillStyle = col; x.fillRect(a, h - alto, l, alto); finestre(a, h - alto, l, alto, forza); };
      const guglia = (cx, larga, alta, gradoni, ago) => { let l = larga, y = h; const passo = alta / (gradoni + 2);
        for (let i = 0; i < gradoni; i++) { const hh = i === 0 ? passo * 3 : passo * 0.6; x.fillStyle = S.lontani; x.fillRect(cx - l / 2, y - hh, l, hh); finestre(cx - l / 2, y - hh, l, hh, 0.7); y -= hh; l *= 0.74; }
        x.fillStyle = S.lontani; x.beginPath(); x.moveTo(cx - l / 2, y); x.lineTo(cx, y - passo); x.lineTo(cx + l / 2, y); x.fill(); x.fillRect(cx - 1.5, y - passo - ago, 3, ago + 2); };
      // i palazzi lontani, e tre profili che si riconoscono
      for (let a = -12; a < w;) { const l = 30 + caso() * 40; palazzo(a, l, 150 + caso() * 130, S.lontani, 0.55); a += l - 2; }
      guglia(176, 74, 330, 5, 58);                                           // l'Empire State
      guglia(330, 46, 286, 7, 36);                                           // il Chrysler
      x.fillStyle = S.lontani; x.beginPath(); x.moveTo(424, h); x.lineTo(436, h - 392); x.lineTo(476, h - 392); x.lineTo(488, h); x.fill();   // il One World Trade Center
      finestre(430, h - 386, 52, 386, 0.7); x.fillStyle = S.lontani; x.fillRect(454.5, h - 452, 3, 62);
      // i palazzi vicini, con le cisterne sui tetti
      for (let a = -20; a < w;) { const l = 44 + caso() * 56, alto = 70 + caso() * 110; palazzo(a, l, alto, S.vicini, 1);
        if (caso() < 0.45) { const cxx = a + 12 + caso() * (l - 24); x.fillStyle = S.vicini; x.fillRect(cxx - 7, h - alto - 20, 14, 14); x.beginPath(); x.moveTo(cxx - 9, h - alto - 20); x.lineTo(cxx, h - alto - 30); x.lineTo(cxx + 9, h - alto - 20); x.fill();
          x.fillRect(cxx - 6, h - alto - 6, 2, 6); x.fillRect(cxx + 4, h - alto - 6, 2, 6); }
        a += l + 1; }
    });
  }
  const cieli = { alba: cielo('alba'), giorno: cielo('giorno'), sera: cielo('sera'), notte: cielo('notte') };

