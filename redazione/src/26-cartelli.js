  /* Il manifesto di Vito, i post-it per Mike sulla lavagna, le targhette. */
  const texGta = tela(560, 760, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2B1055'); g.addColorStop(0.42, '#C2337A'); g.addColorStop(0.7, '#FF8A4C'); g.addColorStop(1, '#FFD36B'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.save(); x.beginPath(); x.arc(w / 2, 470, 170, 0, 7); x.clip(); const s = x.createLinearGradient(0, 300, 0, 640); s.addColorStop(0, '#FFE066'); s.addColorStop(1, '#FF5DA2'); x.fillStyle = s; x.fillRect(0, 300, w, 340);
    x.fillStyle = '#C2337A'; for (let i = 0; i < 6; i++) x.fillRect(0, 480 + i * 26, w, 5 + i * 2.2); x.restore();   // il sole a strisce
    x.fillStyle = '#1B0B3A'; const caso = casuale(23);
    for (let a = -10; a < w;) { const l = 28 + caso() * 46, alto = 40 + caso() * 110; x.fillRect(a, 640 - alto, l, alto); a += l + 2; }   // la città in controluce
    x.fillRect(0, 636, w, h - 636);
    const palma = (px, alta, piega) => { x.strokeStyle = '#1B0B3A'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, 700); x.quadraticCurveTo(px + piega, 700 - alta * 0.5, px + piega * 1.6, 700 - alta); x.stroke();
      const cx = px + piega * 1.6, cy = 700 - alta; x.lineWidth = 9; for (let i = 0; i < 7; i++) { const an = -PI * 0.08 - i * PI * 0.14; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(an) * 60, cy + Math.sin(an) * 60 - 22, cx + Math.cos(an) * 104, cy + Math.sin(an) * 70 + 26); x.stroke(); } };
    palma(86, 330, 26); palma(470, 400, -34); palma(180, 220, -14);
    x.textAlign = 'center'; x.fillStyle = '#FFFFFF'; x.font = `900 150px ${SISTEMA}`; spazia(x, -0.03, 150); x.fillText('GTA', w / 2, 170);
    const v = x.createLinearGradient(0, 180, 0, 300); v.addColorStop(0, '#FFE066'); v.addColorStop(0.5, '#FF8A4C'); v.addColorStop(1, '#FF5DA2'); x.fillStyle = v; x.font = `900 140px ${SISTEMA}`; x.fillText('VI', w / 2, 296); spazia(x, 0, 1);
    if (STATO.gta && STATO.gta.uscita) { const d = giornoDi(STATO.gta.uscita); x.fillStyle = '#3FE0D0'; x.font = `800 44px ${DISPLAY}`; spazia(x, 0.12, 44);
      x.fillText(d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }).toUpperCase(), w / 2, 730); spazia(x, 0, 1); }
    x.textAlign = 'left';
  });

  const COLORE_POSTIT = { visualista: '#FFE45C', fonti: '#8FD3F4', regia: '#FFB46B' };
  const brevePostit = t => (t || '').replace(/^Un grafico per: /, 'Grafico: ');
  const POSTIT = (STATO.postit || []).slice(0, 8);
  /* La lavagna è una sola: a destra degli appunti c'è la zona «PER MIKE», con i post-it che lo aspettano (si tocca, e si
     apre l'elenco). Nove caselle; l'ultima, in mezzo a destra, resta libera per il post-it che Lea va ad attaccare. */
  const LAV = { W: 1640, H: 820, X0: 1050 };
  const CASELLE = [0, 1, 2, 3, 4, 6, 7, 8, 5].map(k => [1162 + (k % 3) * 186, 262 + Math.floor(k / 3) * 190]);
  (() => { const x = texLavagna.image.getContext('2d'), caso = casuale(77); x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = 'rgba(23,24,27,.3)'; x.lineWidth = 4; x.beginPath(); x.moveTo(1041, 36); x.lineTo(1036, 400); x.lineTo(1042, 786); x.stroke();
    x.fillStyle = C.ink; x.font = `700 60px ${PENNARELLO}`; x.fillText('PER MIKE', 1080, 98);
    x.strokeStyle = C.red; x.lineWidth = 6; x.beginPath(); x.moveTo(1080, 116); x.lineTo(1190, 122); x.lineTo(1330, 114); x.stroke();
    if (!POSTIT.length) { x.fillStyle = '#1F7A3F'; x.font = `700 36px ${A_MANO}`; x.fillText('niente che ti aspetta ✓', 1084, 200); }
    POSTIT.forEach((p, i) => { const [cx, cy] = CASELLE[i], rot = (caso() - 0.5) * 0.13;
      x.save(); x.translate(cx + (caso() - 0.5) * 10, cy + (caso() - 0.5) * 12); x.rotate(rot); const col = COLORE_POSTIT[p.da] || '#FF9DB0';
      if (p.mazzo) for (let k = 3; k > 0; k--) { x.fillStyle = k % 2 ? '#F2D64A' : '#FFE45C'; x.fillRect(-84 + k * 6, -84 + k * 6, 168, 168); }
      x.shadowColor = 'rgba(0,0,0,.24)'; x.shadowBlur = 9; x.shadowOffsetY = 4; x.fillStyle = col; x.fillRect(-84, -84, 168, 168); x.shadowColor = 'transparent';
      x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(-84, -84, 168, 18);
      x.fillStyle = C.ink; x.font = `700 23px ${A_MANO}`; aCapo(x, brevePostit(p.titolo), 150, 4).forEach((r, k) => x.fillText(r, -74, -40 + k * 26));
      x.fillStyle = 'rgba(23,24,27,.55)'; x.font = `700 19px ${A_MANO}`; x.fillText((AGENTI[p.da] ? AGENTI[p.da].nome : '') + (p.giorni ? ' · da ' + p.giorni + ' gg' : ' · oggi'), -74, 72);
      x.restore(); });
    texLavagna.needsUpdate = true; })();
  const texNuovoPostit = tela(128, 128, (x, w) => { x.fillStyle = '#FFE45C'; x.fillRect(0, 0, w, w); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, 0, w, 16);
    x.strokeStyle = C.ink; x.lineWidth = 5; x.lineCap = 'round'; [[40, 96], [62, 84], [84, 70]].forEach(([y, l]) => { x.beginPath(); x.moveTo(18, y); x.lineTo(18 + l, y - 3); x.stroke(); }); });

  const LUNEDI = /lunedi/.test(location.search + location.hash) || new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' })).getDay() === 1;
  const texTarga = (su, sotto, col = C.ink) => tela(360, 220, (x, w, h) => { x.fillStyle = '#FFFDF6'; x.fillRect(0, 0, w, h); x.textAlign = 'center';
    x.fillStyle = col; x.font = `800 86px ${DISPLAY}`; spazia(x, 0.06, 86); x.fillText(su, w / 2, 104); spazia(x, 0, 1);
    x.fillStyle = C.ink2; x.font = `700 40px ${A_MANO}`; x.fillText(sotto, w / 2, 174); x.textAlign = 'left'; });
  const texCassetti = tela(256, 512, (x, w, h) => { x.fillStyle = '#5E7F6B'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const y = 10 + i * 126; x.fillStyle = '#6E917B'; rr(x, 12, y, w - 24, 112, 8); x.fill(); x.fillStyle = '#FFFDF6'; rr(x, 78, y + 22, 100, 30, 4); x.fill();
      x.fillStyle = C.ink; x.font = `700 20px ${DISPLAY}`; x.textAlign = 'center'; x.fillText(['A – F', 'G – M', 'N – S', 'T – Z'][i], 128, y + 44); x.textAlign = 'left';
      x.fillStyle = '#D5D7DB'; rr(x, 98, y + 68, 60, 12, 6); x.fill(); } });

