  /* ================================================================ i gesti: cosa fa ciascuno quando è al suo posto */
  const metti = (g, x, z, yaw) => { g.position.set(x, 0, z); g.rotation.y = yaw; };
  const sediaFuori = (p, k) => { if (!p.sedia) return; p.sedia.position.z = p.zs + 0.42 * k; p.sedia.rotation.y = PI + 0.35 * k; };
  // tiene dritto (o inclina) un oggetto in mano, qualunque sia la posa del braccio
  const inMano = (o, P, inclina = 0) => { o.visible = true; o.rotation.x = -(P.sD[0] + P.gD + P.lean) + inclina; };
  const stretto = (v, a, b) => Math.max(a, Math.min(b, v));

  const scriveCon = (sfaso, ogni = 19) => t0 => { const t = t0 + sfaso, P = { ...SEDUTO }, raffica = Math.sin(t * 0.45) > -0.35 ? 1 : 0;
    P.gD += Math.sin(t * 15) * 0.045 * raffica; P.gS += Math.sin(t * 15 + 2.1) * 0.045 * raffica; P.hx = 0.1 + Math.sin(t * 1.1) * 0.02;
    const pausa = campana((t % ogni) / ogni, 0.7, 0.76, 0.9, 0.96); P.hy = -0.5 * pausa; P.twist = -0.12 * pausa; return P; };   // ogni tanto guarda le carte accanto
  const segna = t => { const P = { ...SEDUTO, sS: [-0.35, 0.18], gS: -1.5, hx: 0.34, hy: -0.3, twist: -0.12 };   // Ivo: la penna rossa sulle bozze
    const legge = campana((t % 13) / 13, 0.62, 0.7, 0.88, 0.96); penna.visible = true;
    P.sD = [-0.42 + Math.sin(t * 5.1) * 0.035 * (1 - legge), -0.3 + Math.sin(t * 1.7) * 0.06]; P.gD = -1.5 + Math.sin(t * 7.3) * 0.05 * (1 - legge) - 0.4 * legge; P.gS -= 0.4 * legge; P.hx -= 0.2 * legge; return P; };
  const legge = t => { const P = { ...SEDUTO, hx: 0.06 }, scorre = Math.sin(t * 0.7) > 0.2 ? 1 : 0;   // Tobia: una mano sul mouse, si avvicina allo schermo, appoggia il mento
    P.sD = [-0.38, -0.22]; P.gD = -1.5 + Math.sin(t * 9) * 0.03 * scorre;
    const vicino = campana((t % 23) / 23, 0.1, 0.2, 0.45, 0.55), mento = campana((t % 31) / 31, 0.55, 0.62, 0.86, 0.93);
    P.lean += 0.22 * vicino; P.hx += 0.1 * mento - 0.1 * vicino; P.hy = Math.sin(t * 0.5) * 0.06;
    P.sS = [-0.35 - 0.75 * mento, 0.12 - 0.3 * mento]; P.gS = -1.55 - 0.85 * mento; return P; };
  const disegna = t => { const guarda = campana((t % 17) / 17, 0.7, 0.78, 0.9, 0.97), P = { ...SEDUTO, hx: 0.22 - 0.25 * guarda, hy: -0.18 + 0.18 * guarda, twist: -0.06, lean: 0.1 - 0.16 * guarda };   // Lea: lo stilo sulla tavoletta
    stilo.visible = true; P.sD = [-0.5 + Math.sin(t * 2.3) * 0.1 * (1 - guarda), -0.25 + Math.sin(t * 1.7 + 1) * 0.12 * (1 - guarda)]; P.gD = -1.35 + Math.sin(t * 3.1) * 0.08 * (1 - guarda); return P; };
  const gioca = t => { const piega = Math.sin(t * 1.3) * 0.12 + Math.sin(t * 2.9) * 0.05, evviva = campana((t % 37) / 37, 0.8, 0.84, 0.92, 0.96), P = { ...SEDUTO, lean: -0.08 - 0.1 * evviva, hx: 0.02 - 0.2 * evviva, twist: piega, hy: -piega * 0.4 };   // Vito: il gamepad, e ogni tanto esulta
    P.sD = [-0.55 - 2.2 * evviva, 0.32 - 0.6 * evviva]; P.sS = [-0.55 - 2.2 * evviva, -0.32 + 0.6 * evviva]; P.gD = -1.35 + 0.9 * evviva + Math.sin(t * 11) * 0.02; P.gS = -1.35 + 0.9 * evviva + Math.sin(t * 13) * 0.02;
    gamepad.visible = evviva < 0.25; return P; };
  const TAPPE = [0, 0.74, 1.94, 0.74, 0, -0.74, -1.94, -0.74];
  const dirige = t => { const dur = 7, i = Math.floor(t / dur) % TAPPE.length, u = (t % dur) / dur, gira = campana(u, 0.72, 0.8, 0.92, 1), Q = passo(t * 9, 0.4 * gira);   // Olivia: da uno schermo all'altro, la tavoletta nella sinistra
    const indica = i % 2 ? 0 : campana(u, 0.18, 0.28, 0.46, 0.58), annota = i % 2 ? campana(u, 0.12, 0.22, 0.5, 0.6) : 0;
    const P = { ...IN_PIEDI, h: Q.h, aD: Q.aD, kD: Q.kD, aS: Q.aS, kS: Q.kS, sS: [-0.55, 0.05], gS: -1.5, hx: 0.1 + 0.25 * annota, hy: 0.3 * annota, sD: [-1.25 * indica - 0.5 * annota, -0.08 + 0.35 * annota], gD: -0.2 - 1.3 * annota + Math.sin(t * 9) * 0.05 * annota };
    P.giro = TAPPE[i] + (TAPPE[(i + 1) % TAPPE.length] - TAPPE[i]) * fra(u, 0.72, 1); return P; };
  const sfoglia = t => { const o = Math.sin(t * 3.2), P = { ...IN_PIEDI, lean: 0.22, hx: 0.3 }; cassetti[0].visible = true;   // Zeno: davanti allo schedario aperto
    P.sD = [-0.75, 0.1 + 0.12 * o]; P.gD = -0.9 - 0.15 * o; P.sS = [-0.75, -0.1 + 0.12 * o]; P.gS = -0.9 + 0.15 * o; return P; };

  /* quando Mike parla con qualcuno che è al suo posto, quello si gira verso di lui (cioè verso di noi): la sedia ruota,
     le mani lasciano la tastiera; mentre ci pensa porta la mano al mento, mentre risponde gesticola */
  const ascolto = { chi: null, vivo: false, k: 0, fase: '' };
  function versoMike(c, P, t) {
    if (ascolto.chi !== c.id || ascolto.k < 0.002) return 0;
    const k = dolce(ascolto.k), ora = c.p.yaw + (P.giro || 0), d = angolo(ora, PI / 4, 1) - ora, giro = c.p.inPiedi ? d : stretto(d, -2.3, 2.3) * 0.8, resto = d - giro;
    const R = c.p.inPiedi ? { ...IN_PIEDI, sS: P.sS, gS: P.gS } : { ...SEDUTO, sD: [-0.25, -0.05], gD: -1.25, sS: [-0.25, 0.05], gS: -1.25, lean: -0.03 };
    R.hy = stretto(resto * 0.7, -0.9, 0.9); R.twist = stretto(resto * 0.3, -0.4, 0.4); R.hx = -0.1;
    if (ascolto.fase === 'pensa') { R.hx = -0.22; R.hy += Math.sin(t * 0.9) * 0.12; R.sD = [-0.95, 0.28]; R.gD = -2.25; }
    if (ascolto.fase === 'parla') { R.hx += Math.sin(t * 7) * 0.05; R.sD = [-0.6 + Math.sin(t * 3.1) * 0.12, -0.15]; R.gD = -1.5 + Math.sin(t * 4.3) * 0.2; }
    const g0 = P.giro; delete P.giro; Object.assign(P, mix(P, R, k)); if (g0 != null) P.giro = g0;
    if (c.id === 'gta' && k > 0.4) gamepad.visible = false;
    return giro * k;
  }

  /* chi sta lavorando alza gli occhi quando qualcuno gli si avvicina */
  const sguardi = {};
  const guardami = (id, t0, t1, dove) => (sguardi[id] = sguardi[id] || []).push({ t0, t1, dove });
  function guardaChi(c, P, t) { for (const s of sguardi[c.id] || []) { if (t <= s.t0 || t >= s.t1) continue;
    const k = campana(t, s.t0, s.t0 + 0.9, s.t1 - 0.9, s.t1), ora = c.p.yaw + (P.giro || 0), d = angolo(ora, verso(c.p.seduta, s.dove), 1) - ora;
    if (c.p.inPiedi) { P.giro = (P.giro || 0) + d * 0.85 * k; P.hy += (d * 0.15 - P.hy) * k; }
    else { P.hy += (stretto(d * 0.7, -1.05, 1.05) - P.hy) * k; P.twist += (stretto(d * 0.3, -0.5, 0.5) - P.twist) * k; P.hx += (-0.04 - P.hx) * k; } } }

