  /* Il manifesto di Vito, la bacheca dei post-it per Mike, le targhette. */
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
  const texBacheca = tela(900, 700, (x, w, h) => {
    x.fillStyle = '#C99F6C'; x.fillRect(0, 0, w, h); const caso = casuale(77);
    for (let i = 0; i < 2600; i++) { x.fillStyle = caso() < 0.5 ? 'rgba(120,80,40,.22)' : 'rgba(255,230,190,.2)'; x.fillRect(caso() * w, caso() * h, 2 + caso() * 3, 2 + caso() * 3); }
    x.save(); x.translate(w / 2, 62); x.rotate(-0.012); x.fillStyle = '#FFFFFF'; x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.fillRect(-170, -34, 340, 68); x.shadowColor = 'transparent';
    x.fillStyle = C.ink; x.font = `800 46px ${DISPLAY}`; spazia(x, 0.1, 46); x.textAlign = 'center'; x.fillText('PER MIKE', 0, 17); spazia(x, 0, 1); x.textAlign = 'left'; x.restore();
    POSTIT.forEach((p, i) => { const cx = 128 + (i % 4) * 215, cy = 250 + Math.floor(i / 4) * 265, rot = (caso() - 0.5) * 0.16;
      x.save(); x.translate(cx + (caso() - 0.5) * 16, cy + (caso() - 0.5) * 22); x.rotate(rot); const col = COLORE_POSTIT[p.da] || '#FF9DB0';
      if (p.mazzo) for (let k = 3; k > 0; k--) { x.fillStyle = k % 2 ? '#F2D64A' : '#FFE45C'; x.fillRect(-94 + k * 7, -94 + k * 7, 188, 188); }
      x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = 10; x.shadowOffsetY = 5; x.fillStyle = col; x.fillRect(-94, -94, 188, 188); x.shadowColor = 'transparent';
      x.fillStyle = C.ink; x.font = `700 25px ${A_MANO}`; aCapo(x, brevePostit(p.titolo), 164, 5).forEach((r, k) => x.fillText(r, -82, -46 + k * 28));
      x.fillStyle = 'rgba(23,24,27,.55)'; x.font = `700 20px ${A_MANO}`; x.fillText((AGENTI[p.da] ? AGENTI[p.da].nome : '') + (p.giorni ? ' · da ' + p.giorni + ' gg' : ' · oggi'), -82, 80);
      x.fillStyle = C.red; x.beginPath(); x.arc(0, -78, 9, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(-3, -81, 3, 0, 7); x.fill(); x.restore(); });
  });
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

