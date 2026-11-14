  /* ================================================================ i gesti: cosa fa ciascuno quando è al suo posto */
  const metti = (g, x, z, yaw) => { g.position.set(x, 0, z); g.rotation.y = yaw; };
  const sediaFuori = (p, k) => { if (!p.sedia) return; p.sedia.position.z = p.zs + 0.42 * k; p.sedia.rotation.y = PI + 0.35 * k; p.sedia.rotation.x = 0; };
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
  const TAPPE = [0, 0.74, 1.94, 0.74, 0, -0.74, -1.94, -0.74];
  const dirige = t => { const dur = 7, i = Math.floor(t / dur) % TAPPE.length, u = (t % dur) / dur, gira = campana(u, 0.72, 0.8, 0.92, 1), Q = passo(t * 9, 0.4 * gira);   // Olivia: da uno schermo all'altro, la tavoletta nella sinistra
    const indica = i % 2 ? 0 : campana(u, 0.18, 0.28, 0.46, 0.58), annota = i % 2 ? campana(u, 0.12, 0.22, 0.5, 0.6) : 0;
    const P = { ...IN_PIEDI, h: Q.h, aD: Q.aD, kD: Q.kD, aS: Q.aS, kS: Q.kS, sS: [-0.55, 0.05], gS: -1.5, hx: 0.1 + 0.25 * annota, hy: 0.3 * annota, sD: [-1.25 * indica - 0.5 * annota, -0.08 + 0.35 * annota], gD: -0.2 - 1.3 * annota + Math.sin(t * 9) * 0.05 * annota };
    P.giro = TAPPE[i] + (TAPPE[(i + 1) % TAPPE.length] - TAPPE[i]) * fra(u, 0.72, 1); return P; };
  const sfoglia = t => { const o = Math.sin(t * 3.2), P = { ...IN_PIEDI, lean: 0.22, hx: 0.3 }; cassetti[0].visible = true;   // Zeno: davanti allo schedario aperto
    P.sD = [-0.75, 0.1 + 0.12 * o]; P.gD = -0.9 - 0.15 * o; P.sS = [-0.75, -0.1 + 0.12 * o]; P.gS = -0.9 + 0.15 * o; return P; };

  const telefona = t => { const parla = campana((t % 31) / 31, 0.1, 0.16, 0.66, 0.73), P = { ...SEDUTO, hx: 0.05 - 0.07 * parla, hy: 0.1 * parla + Math.sin(t * 0.8) * 0.06 * parla };   // Nora: al telefono con una fonte, e intanto prende appunti
    P.sS = [-0.35 - 0.85 * parla, 0.12 + 0.2 * parla]; P.gS = -1.5 - 0.95 * parla; cornetta.visible = parla > 0.45;
    P.sD = [-0.42 + Math.sin(t * 5.3) * 0.03 * parla, -0.26]; P.gD = -1.5 + Math.sin(t * 7.1) * 0.05 * parla + Math.sin(t * 15) * 0.04 * (1 - parla); return P; };
  // chi lavora in coppia ogni tanto si gira verso il collega e ne parla (lato: 1 se il collega gli siede a destra, −1 a sinistra)
  const conIlCollega = (base, lato, ogni = 43) => t => { const P = base(t), k = campana((t % ogni) / ogni, 0.58, 0.64, 0.84, 0.9); if (k < 0.01) return P;
    const Q = { ...SEDUTO, twist: -0.5 * lato, hy: -0.75 * lato, hx: -0.04 + Math.sin(t * 7) * 0.04, lean: -0.02 }; Q.sD = [-0.55 + Math.sin(t * 3.3) * 0.12, -0.12]; Q.gD = -1.45 + Math.sin(t * 4.7) * 0.18; return mix(P, Q, k); };

  /* ================================================================ Vito: il primo che si muove «da Vito»
     Di base tiene il tempo con la testa, le cuffie in testa e gli occhi sullo schermo, e ogni tanto batte due righe.
     Ogni 40–90 secondi gli scappa uno dei suoi gesti: quale e quando dipende dall'ora vera, non dal giro di cinque
     minuti, così non si ripete mai uguale. Dalla sua scheda si possono provare uno per uno (`gestoForzato`).
     I gesti sono quelli che ha descritto Mike il 14 novembre 2026; ognuno è una posa che sfuma dentro e fuori quella di base. */
  const caso01 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const GESTI_VITO = [['penne', 6.5, 2, 'Assolo con le penne'], ['orecchio', 6.5, 2, 'Scosta una cuffia: l\'hanno chiamato?'], ['tazza', 7, 2, 'La tazza è vuota'], ['giro', 5, 2, 'Un giro sulla sedia'],
    ['scatto', 8.5, 1.2, 'Scatto sulla tastiera'], ['stiracchia', 7.5, 1, 'Si stiracchia'], ['occhi', 7.5, 1, 'Riposa gli occhi'], ['risata', 6, 1, 'Ride da solo, in silenzio'], ['spacca', 5.5, 1, '«Questa spacca»']];   // nome, secondi, peso, cosa si legge
  const PESO_VITO = GESTI_VITO.reduce((s, g) => s + g[2], 0);
  const sorteVito = k => { let r = caso01(k * 7.31 + 1.7) * PESO_VITO; for (let i = 0; i < GESTI_VITO.length; i++) { r -= GESTI_VITO[i][2]; if (r <= 0) return i; } return 0; };
  const gestoNumero = k => { const i = sorteVito(k); return GESTI_VITO[i === sorteVito(k - 1) ? (i + 1) % GESTI_VITO.length : i]; };   // mai lo stesso due volte di fila
  let gestoForzato = null, gestoVitoOra = null;
  function gestoDiVito(a) {   // a: i secondi veri. Dice se in questo momento ne sta facendo uno: [gesto, quanto ne ha fatto (da 0 a 1)]
    if (gestoForzato) { const g = GESTI_VITO.find(q => q[0] === gestoForzato.nome), u = gestoForzato.u != null ? gestoForzato.u : (performance.now() / 1000 - gestoForzato.da) / g[1]; if (g && u >= 0 && u < 1) return [g, u]; gestoForzato = null; }
    const k0 = Math.floor(a / 65); for (const k of [k0 - 1, k0, k0 + 1]) { const g = gestoNumero(k), da = k * 65 + 20 + 12.5 * (2 * caso01(k) - 1); if (a >= da && a < da + g[1]) return [g, (a - da) / g[1]]; }   // uno ogni 65 secondi, più o meno 12 e mezzo: fra l'uno e l'altro ne passano da 40 a 90
    return null; }
  const VERSO_REGIA_VITO = (() => { const p = posti.gta, d = angolo(p.yaw, verso(p.seduta, REGIA), 1) - p.yaw; return stretto(d, -1.9, 1.9); })();   // di quanto deve girarsi per guardare Olivia
  function vito(t) {
    const a = (tempoFermo != null ? 0 : Math.floor(Date.now() / 1000 / GIRO) * GIRO) + t, battuta = t * 2 * PI * 1.75, colpo = Math.pow(0.5 + 0.5 * Math.sin(battuta), 2);   // 105 battiti al minuto
    const batte = campana((t % 11.3) / 11.3, 0.52, 0.58, 0.84, 0.9);   // ogni tanto, due righe sulla tastiera
    const B = { ...SEDUTO, h: SEDUTO.h - 0.005 * colpo, lean: 0.035 + 0.012 * colpo, hx: 0.03 + 0.085 * colpo, hy: Math.sin(t * 0.31) * 0.05, hz: Math.sin(battuta / 2) * 0.03, sedia: 0 };
    B.sD = [SEDUTO.sD[0] - 0.018 * colpo, SEDUTO.sD[1]]; B.sS = [SEDUTO.sS[0] - 0.018 * colpo, SEDUTO.sS[1]];
    B.gD = SEDUTO.gD + Math.sin(t * 17) * 0.05 * batte + 0.015 * colpo * (1 - batte); B.gS = SEDUTO.gS + Math.sin(t * 17 + 2.1) * 0.05 * batte + 0.015 * colpo * (1 - batte);
    const adesso = gestoDiVito(a); gestoVitoOra = adesso ? adesso[0][3] : null; if (!adesso) return B;
    const [g, u] = adesso, o = OGGETTI_VITO, s = u * g[1], Q = { ...SEDUTO, sD: [...SEDUTO.sD], sS: [...SEDUTO.sS], hz: 0, sedia: 0 }; let giro = 0;
    switch (g[0]) {
      case 'penne': { const allunga = Math.max(campana(u, 0.03, 0.11, 0.13, 0.2), campana(u, 0.8, 0.87, 0.89, 0.96)), suona = campana(u, 0.19, 0.25, 0.74, 0.8), f = s * 2 * PI * 4;   // prende due penne dal bicchiere, tamburella, le rimette
        Q.twist = 0.26 * allunga; Q.lean = 0.04 + 0.15 * allunga - 0.03 * suona; Q.hy = 0.28 * allunga; Q.hx = 0.08 * allunga + (0.04 + 0.08 * Math.abs(Math.sin(f / 2))) * suona; Q.hz = Math.sin(f / 4) * 0.08 * suona;
        Q.sD = [-0.5 - 0.45 * allunga, -0.12 + 0.34 * allunga]; Q.gD = -1.25 + 0.5 * allunga + Math.sin(f) * 0.34 * suona; Q.sS = [-0.5 - 0.2 * allunga, 0.12]; Q.gS = -1.25 + 0.2 * allunga + Math.sin(f + PI) * 0.34 * suona;
        if (u > 0.12 && u < 0.88) o.bacchette.forEach(b => { b.visible = true; }); break; }
      case 'orecchio': { const mano = campana(u, 0.03, 0.14, 0.62, 0.74), scosta = campana(u, 0.12, 0.2, 0.58, 0.68), guarda = campana(u, 0.2, 0.32, 0.5, 0.6), scuote = campana(u, 0.72, 0.76, 0.9, 0.95);   // scosta una cuffia (la destra, quella che si vede) e si gira verso Olivia: l'hanno chiamato?
        Q.sD = [-0.35 - 0.6 * mano + 0.1 * guarda, -0.12 - 0.72 * mano]; Q.gD = -1.55 - 1.0 * mano; Q.hy = VERSO_REGIA_VITO * 0.36 * guarda + Math.sin(s * 10) * 0.17 * scuote; Q.twist = VERSO_REGIA_VITO * 0.3 * guarda; Q.hx = -0.03 * guarda; Q.lean = 0.04 - 0.05 * guarda;
        o.cuffie.pad[-1].position.x = -0.205 - 0.075 * scosta; o.cuffie.pad[-1].rotation.y = 0.5 * scosta; break; }
      case 'tazza': { const allunga = Math.max(campana(u, 0.02, 0.1, 0.12, 0.18), campana(u, 0.82, 0.89, 0.9, 0.96)), beve = campana(u, 0.15, 0.27, 0.36, 0.44), guarda = campana(u, 0.42, 0.52, 0.7, 0.8), delusa = campana(u, 0.5, 0.58, 0.84, 0.92);   // la porta alla bocca, è vuota, ci guarda dentro
        Q.sD = [-0.35 - 0.3 * allunga - 0.5 * beve - 0.3 * guarda, -0.12 - 0.42 * allunga + 0.32 * beve + 0.26 * guarda]; Q.gD = -1.55 + 0.45 * allunga - 0.6 * beve - 0.3 * guarda;
        Q.hx = -0.2 * beve + 0.3 * guarda; Q.hz = -0.26 * guarda; Q.hy = -0.1 * guarda; Q.lean = 0.04 - 0.05 * beve;
        if (u > 0.11 && u < 0.89) inMano(o.tazza, Q, 0.7 * beve + 0.95 * guarda); o.bocca.scale.setScalar(1 - 0.4 * delusa); break; }
      case 'giro': { const spinta = campana(u, 0.02, 0.1, 0.13, 0.2), su = campana(u, 0.12, 0.24, 0.78, 0.92);   // una spinta coi piedi, e la sedia fa un giro intero
        giro = 2 * PI * fra(u, 0.13, 0.87); Q.aD = Q.aS = -1.22 - 0.2 * su + 0.2 * spinta; Q.kD = Q.kS = 1.22 + 0.3 * su - 0.35 * spinta; Q.lean = 0.04 - 0.12 * su; Q.hx = -0.06 * su; Q.sedia = 0.05 * su;
        Q.sD = [-0.35 + 0.15 * su, -0.12 - 0.08 * su]; Q.gD = -1.55 + 0.4 * su; Q.sS = [-0.35 + 0.15 * su, 0.12 + 0.08 * su]; Q.gS = -1.55 + 0.4 * su; o.bocca.scale.setScalar(1 + 0.25 * su); break; }
      case 'scatto': { const batte2 = campana(u, 0.03, 0.08, 0.52, 0.55), alza = campana(u, 0.54, 0.575, 0.585, 0.6), molla = campana(u, 0.63, 0.72, 0.9, 0.97), f = s * 27;   // batte come un matto, un colpo secco di invio, e si lascia andare sullo schienale
        Q.lean = 0.04 - 0.05 * batte2 - 0.22 * molla; Q.hx = 0.02 - 0.12 * molla; Q.sedia = 0.1 * molla; Q.h = SEDUTO.h - 0.012 * molla;
        Q.sD = [-0.35 - 0.02 * Math.sin(f) * batte2 - 0.4 * alza + 0.25 * molla, -0.12 - 0.1 * molla]; Q.gD = -1.55 + Math.sin(f) * 0.09 * batte2 - 0.3 * alza + 0.6 * molla;
        Q.sS = [-0.35 - 0.02 * Math.sin(f + 2) * batte2 + 0.25 * molla, 0.12 + 0.1 * molla]; Q.gS = -1.55 + Math.sin(f + 2.1) * 0.09 * batte2 + 0.6 * molla; o.bocca.scale.setScalar(1 + 0.2 * molla); break; }
      case 'stiracchia': { const su = campana(u, 0.04, 0.2, 0.8, 0.94), don = Math.sin(fra(u, 0.25, 0.78) * 2 * PI * 2.2) * campana(u, 0.22, 0.3, 0.72, 0.8);   // le mani dietro la nuca, la schiena all'indietro, la sedia che dondola
        Q.sD = [-0.35 - 2.25 * su, -0.12 - 0.6 * su]; Q.gD = -1.55 - 0.85 * su; Q.sS = [-0.35 - 2.25 * su, 0.12 + 0.6 * su]; Q.gS = -1.55 - 0.85 * su;
        Q.lean = 0.04 - (0.3 + 0.06 * don) * su; Q.sedia = (0.16 + 0.05 * don) * su; Q.hx = -0.2 * su; Q.kD = Q.kS = 1.22 - 0.35 * su; o.chiudi(0.75 * su); break; }
      case 'occhi': { const giu = campana(u, 0.03, 0.14, 0.7, 0.82), alle = Math.max(campana(u, 0.02, 0.1, 0.13, 0.2), campana(u, 0.68, 0.76, 0.8, 0.88)), strofina = campana(u, 0.24, 0.32, 0.56, 0.64), cerchio = Math.sin(s * 7) * 0.05 * strofina;   // le cuffie giù sul collo, si stropiccia gli occhi, le rimette
        o.cuffie.g.position.set(0, -0.21 * giu, 0.02 * giu); o.cuffie.g.rotation.x = -1.3 * giu; o.cuffie.g.scale.x = 1 - 0.2 * giu;
        Q.sD = [-0.35 - 0.95 * alle - 1.65 * strofina, -0.12 - 0.2 * alle + 0.24 * strofina + cerchio]; Q.gD = -1.55 - 0.85 * alle + 0.15 * strofina;
        Q.sS = [-0.35 - 0.95 * alle - 1.65 * strofina, 0.12 + 0.2 * alle - 0.24 * strofina - cerchio]; Q.gS = -1.55 - 0.85 * alle + 0.15 * strofina;
        Q.hx = 0.14 * strofina; Q.lean = 0.04 - 0.05 * strofina; o.chiudi(Math.max(strofina, 0.4 * giu)); break; }
      case 'risata': { const vicino = campana(u, 0.03, 0.14, 0.72, 0.86), ride = campana(u, 0.3, 0.36, 0.62, 0.7), f = s * 2 * PI * 5;   // si avvicina allo schermo, e gli scappa da ridere senza rumore
        Q.lean = 0.04 + 0.24 * vicino - 0.16 * ride + Math.sin(f) * 0.025 * ride; Q.hx = -0.12 * vicino - 0.14 * ride + Math.sin(f) * 0.03 * ride; Q.h = SEDUTO.h + Math.abs(Math.sin(f)) * 0.008 * ride;
        Q.sD = [-0.35 + Math.sin(f) * 0.035 * ride, -0.12]; Q.sS = [-0.35 + Math.sin(f) * 0.035 * ride, 0.12]; o.bocca.scale.setScalar(1 + 0.35 * vicino + 0.2 * ride); o.chiudi(0.65 * ride); break; }
      case 'spacca': { const annuisce = campana(u, 0.03, 0.08, 0.36, 0.42), indica = campana(u, 0.3, 0.4, 0.56, 0.64), pugno = campana(u, 0.62, 0.7, 0.86, 0.94), tira = fra(u, 0.72, 0.78), f = s * 2 * PI * 1.6;   // annuisce, indica lo schermo, pugno chiuso
        Q.hx = 0.02 + (0.1 + 0.1 * Math.sin(f)) * annuisce - 0.05 * pugno; Q.lean = 0.04 + 0.05 * indica - 0.04 * pugno + 0.05 * tira * pugno; Q.h = SEDUTO.h - 0.01 * tira * pugno;
        Q.sD = [-0.35 - 0.9 * indica - 0.55 * pugno + 0.35 * tira * pugno, -0.12 + 0.1 * indica - 0.2 * pugno]; Q.gD = -1.55 + 1.35 * indica - 0.75 * pugno; o.bocca.scale.setScalar(1 + 0.3 * Math.max(indica, pugno)); break; }
    }
    const P = sfuma(B, Q, campana(u, 0, 0.07, 0.93, 1)); if (giro) P.giro = giro; return P;
  }

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
    const g0 = P.giro; delete P.giro; Object.assign(P, sfuma(P, R, k)); if (g0 != null) P.giro = g0;
    return giro * k;
  }

  /* chi sta lavorando alza gli occhi quando qualcuno gli si avvicina */
  const sguardi = {};
  const guardami = (id, t0, t1, dove) => (sguardi[id] = sguardi[id] || []).push({ t0, t1, dove });
  function guardaChi(c, P, t) { for (const s of sguardi[c.id] || []) { if (t <= s.t0 || t >= s.t1) continue;
    const k = campana(t, s.t0, s.t0 + 0.9, s.t1 - 0.9, s.t1), ora = c.p.yaw + (P.giro || 0), d = angolo(ora, verso(c.p.seduta, s.dove), 1) - ora;
    if (c.p.inPiedi) { P.giro = (P.giro || 0) + d * 0.85 * k; P.hy += (d * 0.15 - P.hy) * k; }
    else { P.hy += (stretto(d * 0.7, -1.05, 1.05) - P.hy) * k; P.twist += (stretto(d * 0.3, -0.5, 0.5) - P.twist) * k; P.hx += (-0.04 - P.hx) * k; } } }

