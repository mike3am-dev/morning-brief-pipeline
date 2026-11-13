  const OGGI = giornoDi(STATO.giorno), DATA_LUNGA = OGGI.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const TITOLI = STATO.revisione && STATO.revisione.fatta ? STATO.revisione.cambi.filter(c => c.cosa === 'titolo') : [];
  const unaRiga = (x, t, maxW) => { t = t || ''; if (x.measureText(t).width <= maxW) return t; while (t.length > 4 && x.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t.trimEnd() + '…'; };
  function texSchermo(a) {   // lo schermo di ciascuno: quello che ha consegnato stamattina
    return tela(640, 400, (x, w, h) => {
      if (a.id === 'gta') {   // Vice City, e quanti giorni mancano all'uscita
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2B1055'); g.addColorStop(0.55, '#FF5DA2'); g.addColorStop(1, '#FFB347'); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = '#FFE066'; x.beginPath(); x.arc(w / 2, 300, 110, PI, 0); x.fill(); x.fillStyle = '#1B0B3A'; x.fillRect(0, 300, w, 100);
        x.fillStyle = '#FFFFFF'; x.font = `800 86px ${DISPLAY}`; x.textAlign = 'center'; x.fillText('GTA VI', w / 2, 112);
        if (STATO.gta) { x.fillStyle = '#3FE0D0'; x.font = `800 60px ${DISPLAY}`; x.fillText(STATO.gta.giorni > 0 ? '− ' + STATO.gta.giorni + ' GIORNI' : 'È USCITO', w / 2, 372); }
        x.textAlign = 'left'; return; }
      const L0 = STATO.lavagna[0];
      if (a.id === 'redattore' && L0) {
        finestra('edizione del ' + DATA_LUNGA)(x, w, h);
        x.fillStyle = C.orange; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.1, 24); x.fillText((L0.reparto || '').toUpperCase() + ' · IN APERTURA', 48, 112); spazia(x, 0, 1);
        x.fillStyle = C.ink; x.font = `800 34px ${SISTEMA}`; let y = 154; aCapo(x, L0.titolo, w - 96, 3).forEach(r => { x.fillText(r, 48, y); y += 41; });
        x.fillStyle = '#C9C5BB'; for (let i = 0; i < 4 && y + i * 24 < h - 34; i++) x.fillRect(48, y + 2 + i * 24, i === 3 ? 260 : w - 96, 10);
        return; }
      if (a.id === 'revisore' && TITOLI.length) {
        finestra('revisione · ' + STATO.revisione.riscritti + ' testi riscritti')(x, w, h); const c = TITOLI[0];
        x.fillStyle = C.ink3; x.font = `500 25px ${SISTEMA}`; let y = 118;
        aCapo(x, c.prima, w - 96, 3).forEach(r => { x.fillText(r, 48, y); const m = x.measureText(r).width; x.strokeStyle = C.red; x.lineWidth = 3.5; x.beginPath(); x.moveTo(46, y - 8); x.lineTo(50 + m, y - 9); x.stroke(); y += 33; });
        y += 20; x.fillStyle = C.ink; x.font = `800 30px ${SISTEMA}`; aCapo(x, c.dopo, w - 96, 4).forEach(r => { x.fillText(r, 48, y); y += 37; });
        return; }
      finestra(a.mestiere)(x, w, h);
      const tinta = { ai: C.red, schede: '#7B4BE0', visualista: C.blue, lettura: C.blue }[a.id] || C.orange;
      x.fillStyle = tinta; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.08, 24); x.fillText(unaRiga(x, (a.consegna || a.ruolo || '').toUpperCase(), w - 96), 48, 112); spazia(x, 0, 1);
      let y = 156;
      if (a.id === 'visualista') { [70, 118, 92, 150, 104].forEach((alto, i) => { x.fillStyle = [C.blue, C.yellow, C.orange, C.red, C.blue][i]; x.fillRect(52 + i * 40, 320 - alto, 28, alto); }); x.fillStyle = C.ink; x.fillRect(48, 320, 210, 4); }
      const x0 = a.id === 'visualista' ? 290 : 48;
      x.font = `600 23px ${SISTEMA}`;
      (a.dettagli || []).slice(0, a.id === 'visualista' ? 3 : 5).forEach(d => { x.fillStyle = tinta; x.beginPath(); x.arc(x0 + 7, y - 8, 6, 0, 7); x.fill();
        x.fillStyle = C.ink; aCapo(x, d, w - x0 - 70, 2).forEach(r => { x.fillText(r, x0 + 24, y); y += 28; }); y += 10; });
    });
  }

  // i tre schermi della regia che si vedono di fronte: l'edizione, la corsa, le macchine
  const minutiDi = o => { const [h, m] = (o || '0:0').split(':').map(Number); return h * 60 + m; };
  const oraCorta = o => (o || '').replace(/^0/, '');
  const TINTA = { regia: C.orange, lettura: C.blue, redattore: C.orange, revisore: C.red, visualista: C.yellow, ai: C.red, schede: '#7B4BE0', gta: '#FF5DA2', fonti: '#2F7A4C' };
  const texRegia = [
    tela(640, 400, (x, w, h) => { finestra('l\'edizione del ' + DATA_LUNGA)(x, w, h);
      x.fillStyle = C.orange; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.08, 24); x.fillText(STATO.lavagna.length + ' NOTIZIE · USCITA ALLE ' + oraCorta(USCITA), 48, 112); spazia(x, 0, 1);
      let y = 156; (STATO.schermo.top3 || []).slice(0, 3).forEach((t, i) => { x.fillStyle = C.orange; x.font = `800 40px ${DISPLAY}`; x.fillText(String(i + 1), 48, y + 8);
        x.fillStyle = C.ink; x.font = `700 24px ${SISTEMA}`; aCapo(x, t, w - 150, 2).forEach(r => { x.fillText(r, 84, y); y += 30; }); y += 16; }); }),
    tela(640, 400, (x, w, h) => { finestra('la corsa · ' + STATO.corsa.minuti + ' minuti')(x, w, h);
      const righe = STATO.agenti.filter(a => a.entrata && a.uscita && a.id !== 'regia'), t0 = minutiDi(STATO.corsa.ora_inizio), t1 = Math.max(t0 + 1, minutiDi(STATO.corsa.ora_fine));
      const X = t => 170 + (w - 230) * Math.max(0, Math.min(1, (minutiDi(t) - t0) / (t1 - t0))), passo = Math.min(38, 270 / Math.max(1, righe.length));
      x.strokeStyle = '#D7D2C7'; x.lineWidth = 2; for (let m = t0; m <= t1; m += 5) { const a = 170 + (w - 230) * (m - t0) / (t1 - t0); x.beginPath(); x.moveTo(a, 92); x.lineTo(a, 96 + passo * righe.length); x.stroke(); }
      righe.forEach((a, i) => { const y = 100 + i * passo; x.fillStyle = C.ink; x.font = `600 20px ${SISTEMA}`; x.fillText(a.nome, 48, y + passo * 0.62);
        x.fillStyle = TINTA[a.id] || C.orange; rr(x, X(a.entrata), y + 5, Math.max(10, X(a.uscita) - X(a.entrata)), passo - 12, 6); x.fill(); });
      const xu = X(USCITA); x.strokeStyle = C.red; x.lineWidth = 3; x.beginPath(); x.moveTo(xu, 86); x.lineTo(xu, 100 + passo * righe.length); x.stroke();
      x.fillStyle = C.red; x.font = `800 18px ${DISPLAY}`; x.textAlign = 'center'; x.fillText('ESCE ' + oraCorta(USCITA), xu, 384); x.textAlign = 'left'; }),
    tela(640, 400, (x, w, h) => { finestra('le macchine')(x, w, h); const m = STATO.macchine || {};
      [[m.telescrivente && m.telescrivente.articoli, 'articoli arrivati', C.orange], [m.feed && (m.feed.ok + '/' + m.feed.totale), 'fonti che rispondono', C.blue],
        [m.radio && m.radio.discussioni, 'discussioni raccolte', C.red], [m.radio && m.radio.lab, 'voci per il LAB', C.ink]].forEach(([n, cosa, col], i) => {
        const a = 48 + (i % 2) * 280, b = 170 + Math.floor(i / 2) * 130; x.fillStyle = col; x.font = `800 78px ${DISPLAY}`; x.fillText(n == null ? '–' : String(n), a, b);
        x.fillStyle = C.ink2; x.font = `500 21px ${SISTEMA}`; x.fillText(cosa, a, b + 32); }); }),
  ];
  const texLista = tela(240, 330, (x, w, h) => {   // la tavoletta di Olivia: la scaletta, con le spunte
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = C.orange; x.fillRect(0, 0, w, 44);
    STATO.lavagna.slice(0, 7).forEach((n, i) => { const y = 82 + i * 36; x.strokeStyle = '#1F7A3F'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(20, y - 8); x.lineTo(30, y + 2); x.lineTo(46, y - 18); x.stroke();
      x.fillStyle = '#B9B6AE'; x.fillRect(62, y - 12, 90 + ((i * 53) % 70), 10); });
  });

