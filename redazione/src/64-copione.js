  /* ================================================================ il copione: come si scrive la giornata di una persona */
  const cx = {};
  function attore(id, base, nota) { const c = { id, chi: persone[id], p: posti[id], tr: new Traccia(), base, nota0: nota, note: [[0, nota]], qui: posti[id].seduta, yaw: posti[id].yaw }; cx[id] = c; return c; }
  const dice = (c, testo) => { c.note.push([c.tr.t, testo]); };
  function alPosto(c, T) {   // resta al suo posto fino al secondo T, con il gesto di sempre
    c.tr.fino(T, (u, dt, t, manca) => { const P = c.base(t); guardaChi(c, P, t); const k = fra(dt, 0, 1.2) * fra(manca, 0, 1.2), mike = versoMike(c, P, t) * k;
      metti(c.chi, c.p.seduta[0], c.p.seduta[1], c.p.yaw + (P.giro || 0) * k + mike); posa(c.chi, P); sediaFuori(c.p, 0); if (mike && c.p.sedia) c.p.sedia.rotation.y = PI + mike; return P; }); }
  function alPostoCon(c, dur, fn) { c.tr.poi(dur, (u, dt, t) => { const P = fn(t, u, dt); metti(c.chi, c.p.seduta[0], c.p.seduta[1], c.p.yaw); posa(c.chi, P); sediaFuori(c.p, 0); return P; }); }
  function alzaSiedi(c, senso) {   // 1: si alza; -1: si siede
    if (c.p.inPiedi) return;
    c.tr.poi(1.3, u => { const k = senso > 0 ? dolce(u) : 1 - dolce(u), P = mix(SEDUTO, IN_PIEDI, k); P.lean += 0.42 * Math.sin(PI * k);
      metti(c.chi, c.p.seduta[0], c.p.seduta[1], c.p.yaw); posa(c.chi, P); sediaFuori(c.p, k); return P; }); }
  function parte(c, T, testo) { alPosto(c, T); dice(c, testo); alzaSiedi(c, 1); c.qui = c.p.seduta; c.yaw = c.p.yaw; }
  function cammina(c, a, yaw1, porta) {
    const per = percorso(strada(c.qui, a)), yaw0 = c.yaw;
    c.tr.poi(Math.max(0.4, per.L / V), u => { const d = u * per.L, [x, z] = lungo(per, d), [x0, z0] = lungo(per, d - 0.2), [x1, z1] = lungo(per, d + 0.2);
      let yaw = Math.hypot(x1 - x0, z1 - z0) > 0.01 ? Math.atan2(x1 - x0, z1 - z0) : yaw0; yaw = angolo(yaw0, yaw, fra(d, 0, 0.45)); yaw = angolo(yaw, yaw1, fra(d, per.L - 0.45, per.L));
      const P = passo(d * 2 * PI / PASSO, Math.min(1, d / 0.3, (per.L - d) / 0.3), !!porta);
      metti(c.chi, x, z, yaw); posa(c.chi, P); sediaFuori(c.p, 1); if (porta) porta(P); return P; });
    c.qui = a; c.yaw = yaw1; }
  function fa(c, dur, fn, yaw) {   // resta dov'è arrivato e fa una cosa
    const [x, z] = c.qui, y = yaw == null ? c.yaw : yaw;
    c.tr.poi(dur, (u, dt, t) => { const P = fn(u, dt, t); metti(c.chi, x, z, typeof y === 'function' ? y(u) : y); posa(c.chi, P); sediaFuori(c.p, 1); return P; });
    c.yaw = typeof y === 'function' ? y(1) : y; }
  function rientra(c, porta) { cammina(c, c.p.seduta, c.p.yaw, porta); alzaSiedi(c, -1); dice(c, c.nota0); }

  // i posti dove si va. `accanto` dà un punto di fianco e dietro a chi è seduto, da qualunque parte guardi
  const accanto = (p, lato, dietro) => p.fuori(lato, p.zs + dietro);
  const pCaffe = [CAFFE[0] - 0.05, 0.98], pStampa = [STAMPANTE[0], 1.02], pLavagna = [0.62, suLavagna(520, 0)[1]], pPianta = [0.75, 1.48], pFinestra = [0.55, 1.75], pBacheca = [0.62, DOVE_POSTIT[1] + 0.11], pArchivio = [1.02, ARCHIVIO[1]];
  const pDaEttore = accanto(pE, 0.75, 0.43), pOliviaEttore = accanto(pE, -0.8, 0.48), pOliviaLea = accanto(posti.visualista, 0.72, 0.45);
  const pDaRita = accanto(posti.schede, -0.98, 0.23), pVarco = [REGIA[0] + 1.1, REGIA[1] + 1.1];

  // le azioni che fanno in tanti
  const parla = (mano = 1) => u => { const k = campana(u, 0.05, 0.2, 0.85, 0.97), P = { ...IN_PIEDI, hx: Math.sin(u * 40) * 0.06 * k };   // parla, e muove una mano
    P.sD = [-0.55 * k * mano + Math.sin(u * 23) * 0.12 * k * mano, -0.07 - 0.2 * k * mano]; P.gD = -0.15 - 1.25 * k * mano + Math.sin(u * 31) * 0.15 * k * mano; return P; };
  function caffe(c, T) {   // va alla macchina con la sua tazza, aspetta che scenda, beve un sorso guardando la stanza, torna
    const tz = tazzeMano[c.id], porta = P => inMano(tz, P), guardaLaStanza = 0.75;
    parte(c, T, 'È alla macchina del caffè'); cammina(c, pCaffe, PI, porta);
    fa(c, 6, u => { const k = campana(u, 0.05, 0.22, 0.78, 0.95), P = mix(passo(0, 0, true), { ...IN_PIEDI, sD: [-1.0, 0.05], gD: -0.45, lean: 0.1, hx: 0.2 }, k);
      spiaCaffe.emissiveIntensity = u > 0.2 && u < 0.8 ? 0.4 + 2 * (Math.sin(u * 50) > 0 ? 1 : 0) : 0.6; inMano(tz, P); return P; });
    fa(c, 3.6, u => { const k = campana(u, 0.4, 0.55, 0.78, 0.92), P = mix(passo(0, 0, true), { ...IN_PIEDI, sD: [-0.85, 0.2], gD: -2.15, hx: -0.16 }, k); inMano(tz, P, 0.6 * k); return P; }, u => angolo(PI, guardaLaStanza, fra(u, 0, 0.35)));
    rientra(c, porta); }
  function allaStampante(c, T, foglioInMano, testo) {   // la stampante lampeggia, il foglio esce, lo prende e lo guarda
    parte(c, T, testo); cammina(c, pStampa, PI);
    fa(c, 5.2, u => { const prende = campana(u, 0.52, 0.66, 0.72, 0.86), P = mix(IN_PIEDI, { ...IN_PIEDI, sD: [-0.5, 0], gD: -0.3, lean: 0.4, hx: 0.3 }, prende);
      const guarda = fra(u, 0.78, 0.95); P.sD[0] -= 0.22 * guarda; P.gD -= 1.2 * guarda; P.hx += 0.25 * guarda;
      spiaStampa.emissiveIntensity = u < 0.6 ? 0.6 + 1.6 * (Math.sin(u * 60) > 0 ? 1 : 0) : 0.5;
      if (u < 0.68) { const k = fra(u, 0.08, 0.5); foglioStampante.visible = true; foglioStampante.position.set(STAMPANTE[0], 0.665 - 0.04 * k, STAMPANTE[1] + 0.06 + 0.2 * k); }
      else inMano(foglioInMano, P, -1.1);
      return P; }); }
  const allaLavagna = (u, dt) => {   // scrive alla lavagna, poi ci pensa su
    const scriveSu = campana(u, 0.02, 0.1, 0.42, 0.5), pensa = fra(u, 0.52, 0.62) * (1 - fra(u, 0.93, 1));
    let P = mix(IN_PIEDI, { ...IN_PIEDI, sD: [-2.05 + Math.sin(dt * 6) * 0.07, -0.1 + Math.sin(dt * 2.3) * 0.12], gD: -0.5 + Math.sin(dt * 7) * 0.08, hx: -0.18 }, scriveSu);
    P = mix(P, { ...IN_PIEDI, sD: [-0.55, 0.25], gD: -2.25, sS: [-0.3, -0.35], gS: -1.5, hx: -0.05, hy: Math.sin(dt * 0.9) * 0.3, lean: -0.04 }, pensa); return P; };

