  /* ================================================================ i canali, la prima pagina, le carte: le tele */
  // i canali, nella colonna sinistra del muro: le altre schede dell'app, ognuna con il suo colore e il suo primo titolo nel sottopancia
  const CANALI = [['ai', 'AI', C.red], ['games', 'GAMES', '#7B4BE0'], ['scienza', 'SCIENZA', C.blue]];
  function simbolo(x, quale) {   // il disegno nel riquadro accanto al mezzobusto (160 × 120, centrato)
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#FFFFFF'; x.fillStyle = '#FFFFFF'; x.lineWidth = 7;
    if (quale === 'ai') { rr(x, -34, -34, 68, 68, 10); x.stroke(); rr(x, -14, -14, 28, 28, 4); x.fill(); for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * 20, -34); x.lineTo(i * 20, -50); x.moveTo(i * 20, 34); x.lineTo(i * 20, 50); x.moveTo(-34, i * 20); x.lineTo(-50, i * 20); x.moveTo(34, i * 20); x.lineTo(50, i * 20); x.stroke(); } }
    else if (quale === 'games') { rr(x, -58, -26, 116, 56, 28); x.stroke(); x.beginPath(); x.moveTo(-38, 2); x.lineTo(-14, 2); x.moveTo(-26, -10); x.lineTo(-26, 14); x.stroke(); x.beginPath(); x.arc(22, 8, 6, 0, 7); x.arc(38, -6, 6, 0, 7); x.fill(); }
    else { x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill(); for (let i = 0; i < 3; i++) { x.save(); x.rotate(i * PI / 3); x.beginPath(); x.ellipse(0, 0, 56, 20, 0, 0, 7); x.stroke(); x.restore(); } }
  }
  function texCanale(quale, nome, colore, titolo) {
    return tela(640, 458, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#11141C'); g.addColorStop(1, colore); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(i * 150 - 120, 0); x.lineTo(i * 150 - 20, 0); x.lineTo(i * 150 - 270, h); x.lineTo(i * 150 - 370, h); x.fill(); }
      x.fillStyle = 'rgba(8,10,16,.45)'; rr(x, 372, 70, 226, 190, 12); x.fill(); x.save(); x.translate(485, 165); simbolo(x, quale); x.restore();
      x.fillStyle = '#1B202C'; x.beginPath(); x.moveTo(74, 372); x.quadraticCurveTo(88, 250, 166, 242); x.lineTo(238, 242); x.quadraticCurveTo(316, 250, 330, 372); x.fill();   // le spalle
      x.fillStyle = '#E7C3A4'; x.beginPath(); x.arc(202, 176, 58, 0, 7); x.fill(); x.fillStyle = '#1B202C'; x.beginPath(); x.arc(202, 156, 61, PI * 1.02, PI * 1.98); x.fill();   // la testa, i capelli
      x.fillStyle = '#F8F6F2'; x.beginPath(); x.moveTo(182, 242); x.lineTo(202, 278); x.lineTo(222, 242); x.fill();
      x.fillStyle = 'rgba(8,10,16,.9)'; x.fillRect(0, 318, w, 116); x.fillStyle = colore; x.fillRect(0, 318, 132, 116);
      x.fillStyle = '#FFFFFF'; x.font = `800 ${nome.length > 5 ? 26 : 34}px ${DISPLAY}`; spazia(x, 0.06, 30); x.textAlign = 'center'; x.fillText(nome, 66, 388); x.textAlign = 'left'; spazia(x, 0, 1);
      x.font = `700 25px ${SISTEMA}`; const righe = aCapo(x, titolo || 'Oggi niente da questa scheda', w - 172, 3); righe.forEach((r, i) => x.fillText(r, 150, 386 - (righe.length - 1) * 15.5 + i * 31));
      [[C.red, 0], [C.yellow, 1], [C.blue, 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(34 + i * 22, 36, 8, 0, 7); x.fill(); });
      x.fillStyle = '#FFFFFF'; x.font = `800 22px ${DISPLAY}`; spazia(x, 0.08, 22); x.fillText('TMB · ' + nome, 104, 44); spazia(x, 0, 1);
    });
  }
  const canali = CANALI.map(([quale, nome, colore]) => { const titoli = ((STATO.canali || {})[quale] || []).slice(0, 3); return (titoli.length ? titoli : [null]).map(t => texCanale(quale, nome, colore, t)); });

  /* La prima pagina, sul tavolo luminoso: l'edizione vera impaginata come un quotidiano. È divisa in strisce, che in
     scena arrivano una alla volta. */
  const PRIMA = (() => { const W = 992, H = 1408, L = STATO.lavagna || [], sc = STATO.schermo || {}, strisce = [[0, 276], [276, 300], [576, 360], [936, 200], [1136, 150], [1286, 122]];
    const tex = tela(W, H, (x, w, h) => {
      x.fillStyle = '#FDFCF8'; x.fillRect(0, 0, w, h);
      [[C.red, 0], [C.yellow, 1], [C.blue, 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(70 + i * 34, 62, 12, 0, 7); x.fill(); });
      marchio(x, 56, 88, 112);
      x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `800 40px ${DISPLAY}`; spazia(x, 0.05, 40); x.fillText((GIORNI_LUNGHI[OGGI.getDay()] + ' ' + DATA_LUNGA).toUpperCase(), w - 56, 150); spazia(x, 0, 1);
      x.fillStyle = C.ink2; x.font = `500 24px ${SISTEMA}`; x.fillText('edizione delle ' + oraCorta(USCITA) + ' · ' + L.length + ' notizie', w - 56, 190); x.textAlign = 'left';
      x.fillStyle = C.ink; x.fillRect(56, 258, w - 112, 6);
      const a = L[0]; if (a) { x.fillStyle = C.orange; x.font = `800 28px ${DISPLAY}`; spazia(x, 0.1, 28); x.fillText('IN APERTURA · ' + (a.reparto || '').toUpperCase(), 56, 322); spazia(x, 0, 1);
        x.fillStyle = C.ink; x.font = `800 58px ${SISTEMA}`; aCapo(x, a.titolo, w - 112, 3).forEach((r, i) => x.fillText(r, 56, 392 + i * 66));
        const k = (a.reparto || '').toLowerCase(); x.fillStyle = FONDO_FOTO[k] || '#E6E2DA'; x.fillRect(56, 596, 470, 320); x.save(); x.translate(291, 748); x.scale(2.1, 2.1); disegnino(x, k); x.restore();
        x.fillStyle = C.ink; x.font = `400 29px ${GRAZIE}`; aCapo(x, a.sintesi || '', w - 56 - 566, 8).forEach((r, i) => x.fillText(r, 566, 630 + i * 38)); }
      x.fillStyle = C.rule || '#D7D2C7'; x.fillRect(56, 944, w - 112, 2);
      [L[1], L[2]].forEach((n, i) => { if (!n) return; const x0 = 56 + i * 452; x.fillStyle = C.orange; x.font = `800 22px ${DISPLAY}`; spazia(x, 0.1, 22); x.fillText((n.reparto || '').toUpperCase(), x0, 984); spazia(x, 0, 1);
        x.fillStyle = C.ink; x.font = `700 30px ${SISTEMA}`; aCapo(x, n.titolo, 420, 4).forEach((r, j) => x.fillText(r, x0, 1024 + j * 36)); });
      const cit = sc.citazione; x.fillStyle = C.ink; x.fillRect(56, 1146, w - 112, 130);
      if (cit && cit.testo) { x.fillStyle = C.yellow; x.font = `italic 600 27px ${GRAZIE}`; aCapo(x, '«' + cit.testo + '»', w - 190, 2).forEach((r, i) => x.fillText(r, 84, 1194 + i * 34)); x.fillStyle = '#F8F6F2'; x.font = `700 20px ${SISTEMA}`; x.fillText('— ' + (cit.chi || ''), 84, 1262); }
      if (sc.punto) { x.fillStyle = C.red; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.1, 24); x.fillText('IL PUNTO', 56, 1326); spazia(x, 0, 1); x.fillStyle = C.ink; x.font = `600 36px ${GRAZIE}`; x.fillText(unaRiga(x, sc.punto, w - 112), 56, 1374); }
    });
    return { tex, strisce, W, H }; })();

  // le carte di scena
  const texGiornale = tela(300, 210, (x, w, h) => { x.fillStyle = '#F4F1E8'; x.fillRect(0, 0, w, h); x.fillStyle = C.ink; x.fillRect(14, 14, 150, 22); x.fillStyle = C.yellow; x.beginPath(); x.arc(182, 25, 10, 0, 7); x.fill();
    x.fillStyle = C.ink; x.fillRect(14, 46, w - 28, 3); x.fillRect(14, 60, 170, 16); x.fillRect(14, 82, 120, 16); x.fillStyle = '#C9C5BB'; x.fillRect(200, 60, 86, 64);
    x.fillStyle = '#B9B6AE'; for (let i = 0; i < 9; i++) { x.fillRect(14, 112 + i * 10, 170, 5); if (i > 2) x.fillRect(200, 112 + i * 10, 86, 5); } });
  const texPagine = seme => tela(300, 420, (x, w, h) => { const caso = casuale(seme); x.fillStyle = '#F6F3EA'; x.fillRect(0, 0, w, h); x.fillStyle = C.ink; x.fillRect(18, 20, 190, 16); x.fillRect(18, 44, 130, 16);
    for (let c = 0; c < 2; c++) for (let i = 0; i < 30; i++) { const a = 18 + c * 138, b = 82 + i * 11, l = 100 + caso() * 26; if (caso() < 0.12) { x.fillStyle = 'rgba(245,197,24,.75)'; x.fillRect(a - 3, b - 3, l + 6, 11); } x.fillStyle = '#A9A69E'; x.fillRect(a, b, l, 5); }
    x.strokeStyle = C.red; x.lineWidth = 4; x.beginPath(); x.ellipse(112, 40, 104, 30, -0.05, 0.3, 6.7); x.stroke(); });
  const texBlocco = seme => tela(140, 200, (x, w, h) => { const caso = casuale(seme); x.fillStyle = '#FFFEF8'; x.fillRect(0, 0, w, h); x.fillStyle = '#9CCBE8'; for (let i = 0; i < 9; i++) x.fillRect(8, 34 + i * 18, w - 16, 1.5);
    x.strokeStyle = '#1E3A8A'; x.lineWidth = 2.4; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { x.beginPath(); let a = 12; x.moveTo(a, 30 + i * 18); while (a < 40 + caso() * 80) { a += 5 + caso() * 6; x.lineTo(a, 30 + i * 18 - 3 + caso() * 6); } x.stroke(); } });
  const texBadge = (nome, colore) => tela(120, 170, (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = colore; x.fillRect(0, 0, w, 52);
    x.fillStyle = '#FFFFFF'; x.font = `800 30px ${DISPLAY}`; spazia(x, 0.12, 30); x.textAlign = 'center'; x.fillText('STAMPA', w / 2 + 2, 37); spazia(x, 0, 1);
    [[C.red, -1], [C.yellow, 0], [C.blue, 1]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(w / 2 + i * 20, 78, 7, 0, 7); x.fill(); });
    x.fillStyle = C.ink; x.font = `800 27px ${SISTEMA}`; x.fillText(nome, w / 2, 124); x.fillStyle = C.ink3; x.font = `600 13px ${SISTEMA}`; x.fillText('The Morning Brief', w / 2, 150); x.textAlign = 'left'; });
  const texNota = (colore, righe) => tela(96, 96, (x, w) => { x.fillStyle = colore; x.fillRect(0, 0, w, w); x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 0, w, 14);
    x.fillStyle = colore === C.red || colore === '#1F5A3C' ? '#FFFFFF' : C.ink; x.font = `700 21px ${A_MANO}`; (righe || []).forEach((r, i) => x.fillText(r, 8, 42 + i * 24)); });

