  /* ================================================================ i repertori: ognuno si muove a modo suo
     Ogni persona ha un gesto di base (quello di sempre: 62-gesti.js) e nove gesti speciali, pensati sul suo mestiere e
     sul suo carattere. Ne parte uno ogni 40–90 secondi, ognuno coi suoi tempi (non vanno a tempo fra loro); quale e
     quando dipende dall'ora vera e non dal giro di cinque minuti, così non si ripete uguale. Ogni gesto è una posa che
     sfuma dentro e fuori quella di base. Dalla scheda di ciascuno si provano uno per uno.
     Il primo è stato Vito, con i dieci gesti descritti da Mike il 14 novembre 2026; gli altri seguono lo stesso modello. */
  const caso01 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const REPERTORI = {}, gestoOra = {}, oggettiGesto = [], ripristini = [];
  let gestoForzato = null;
  const SEMI = Object.fromEntries(Object.keys(posti).map((id, i) => [id, i + 1]));
  function gestoDi(id, a) {   // a: i secondi veri. Dice se in questo momento ne sta facendo uno: [gesto, quanto ne ha fatto (da 0 a 1)]
    const R = REPERTORI[id], G = R.gesti, n = SEMI[id];
    if (gestoForzato && gestoForzato.id === id) { const g = G.find(q => q[0] === gestoForzato.nome), u = gestoForzato.u != null ? gestoForzato.u : (performance.now() / 1000 - gestoForzato.da) / (g ? g[1] : 1); if (g && u >= 0 && u < 1) return [g, u]; gestoForzato = null; }
    const sorte = k => { let r = caso01(k * 7.31 + n * 3.17) * R.peso; for (let i = 0; i < G.length; i++) { r -= G[i][2]; if (r <= 0) return i; } return 0; }, numero = k => { const i = sorte(k); return G[i === sorte(k - 1) ? (i + 1) % G.length : i]; };   // mai lo stesso due volte di fila
    const a2 = a + n * 23.7, k0 = Math.floor(a2 / 65); for (const k of [k0 - 1, k0, k0 + 1]) { const g = numero(k), da = k * 65 + 20 + 12.5 * (2 * caso01(k + n * 11.3) - 1); if (a2 >= da && a2 < da + g[1]) return [g, (a2 - da) / g[1]]; }   // uno ogni 65 secondi, più o meno 12 e mezzo: fra l'uno e l'altro ne passano da 40 a 90
    return null; }
  function conGesti(id, base) {   // il gesto di base di qualcuno, con dentro i suoi gesti speciali
    const R = REPERTORI[id]; R.peso = R.gesti.reduce((s, g) => s + g[2], 0); const fermo2 = posti[id].inPiedi ? IN_PIEDI : SEDUTO, testa = persone[id].userData.j.testa.userData;
    return t => { const B = base(t), adesso = gestoDi(id, (tempoFermo != null ? 0 : Math.floor(Date.now() / 1000 / GIRO) * GIRO) + t); if (!adesso) return B;
      const [g, u] = adesso; gestoOra[id] = g[3];
      const x = { id, u, s: u * g[1], t, B, Q: { ...fermo2, sD: [...fermo2.sD], sS: [...fermo2.sS], hz: 0, sedia: 0 }, giro: null, bocca: k => { testa.bocca.scale.setScalar(1 + k); }, occhi: k => { persone[id].userData.chiudi = k; } };
      g[4](x); const P = sfuma(B, x.Q, campana(u, 0, 0.07, 0.93, 1)); if (x.giro != null) P.giro = x.giro; return P; }; }
  function ripristinaTutto() {   // a ogni fotogramma tutto torna com'era; poi il gesto del momento sposta quello che tocca
    for (const id in gestoOra) gestoOra[id] = null; for (const o of oggettiGesto) o.visible = false; ripristinaVito();
    for (const g of Object.values(persone)) { g.userData.chiudi = 0; g.userData.j.testa.userData.bocca.scale.setScalar(1); } for (const f of ripristini) f(); }

  /* ---- i mattoni: dove può stare una mano (quanto il braccio va avanti, quanto si apre di lato, quanto si piega il gomito) */
  const POSE = { TASTIERA: [-0.35, 0.12, -1.55], MENTO: [-1.1, -0.18, -2.4], BOCCA: [-0.85, -0.2, -2.15], ORECCHIO: [-0.95, 0.84, -2.55], NASO: [-1.25, -0.14, -2.3], FRONTE: [-1.55, -0.2, -2.3], TESTA: [-2.05, 0.2, -2.3], NUCA: [-2.6, 0.72, -2.4],
    AVANTI: [-1.25, -0.02, -0.2], ALTO: [-2.7, 0.2, -0.45], LATO: [-0.8, 0.55, -1.05], GREMBO: [-0.1, 0.15, -0.9], CONSERTE: [-0.55, -0.42, -2.0], PETTO: [-0.75, -0.3, -2.35], OCCHI: [-2.0, -0.12, -1.4], FOGLIO: [-1.3, 0.02, -1.35],
    PENNA: [-0.42, 0.3, -1.5], FIANCO: [0.1, 0.55, -1.5], CORNICE: [-1.5, 0.14, -1.25], POLSO: [-0.95, -0.25, -1.9], MOUSE: [-0.38, 0.22, -1.5] };
  // porta un braccio ('D' o 'S') verso una di quelle pose: k dice quanto; i tre numeri in coda la spostano un po'
  const br = (Q, lato, T, k = 1, dp = 0, da = 0, dg = 0) => { const s = 's' + lato, g = 'g' + lato, segno = lato === 'D' ? -1 : 1; Q[s] = [Q[s][0] + (T[0] + dp - Q[s][0]) * k, Q[s][1] + (segno * (T[1] + da) - Q[s][1]) * k]; Q[g] += (T[2] + dg - Q[g]) * k; };
  const due = (Q, T, k = 1, dp = 0, da = 0, dg = 0) => { br(Q, 'D', T, k, dp, da, dg); br(Q, 'S', T, k, dp, da, dg); };
  const onda = (s, hz, fase = 0) => Math.sin(s * 2 * PI * hz + fase);
  const annuisci = (Q, s, k, hz = 1.6, quanto = 0.1) => { Q.hx += (quanto + quanto * onda(s, hz)) * k; };
  const scuoti = (Q, s, k, hz = 1.3, quanto = 0.2) => { Q.hy += onda(s, hz) * quanto * k; };
  const batti = (Q, s, k, quanto = 0.06, hz = 2.7) => { Q.gD += onda(s, hz) * quanto * k; Q.gS += onda(s, hz, 2.1) * quanto * k; };
  const parla2 = (x, k) => { x.bocca(0.25 * k * (0.5 + 0.5 * onda(x.s, 3.1))); };   // muove la bocca
  const versoChi = (id, dove) => { const p = posti[id]; return stretto(angolo(p.yaw, verso(p.seduta, dove), 1) - p.yaw, -1.6, 1.6); };   // di quanto deve girarsi per guardare un punto (positivo: a sinistra)
  function sorso(x, tz, altra) {   // allunga la destra verso la tazza (che sta alla sua sinistra), beve, la rimette
    const { u, Q } = x, allunga = Math.max(campana(u, 0.03, 0.12, 0.14, 0.2), campana(u, 0.8, 0.88, 0.9, 0.96)), beve = campana(u, 0.2, 0.34, 0.6, 0.74);
    br(Q, 'D', POSE.LATO, allunga, 0, -0.95); br(Q, 'D', POSE.BOCCA, beve); Q.twist = 0.22 * allunga; Q.hy = 0.18 * allunga; Q.hx = -0.18 * beve; Q.lean = 0.04 - 0.04 * beve; if (u > 0.12 && u < 0.88) inMano(tz, Q, 0.75 * beve); if (altra) altra(beve); }
  // le cose che compaiono in mano durante un gesto: spariscono da sole a ogni fotogramma
  const inMano2 = (id, lato, o, x = 0, y = -0.03, z = 0.055, rx = 1.9) => { o.visible = false; o.rotation.x = rx; persone[id].userData.j['m' + lato].add(at(o, x, y, z)); oggettiGesto.push(o); return o; };
  const pennaDi = (id, colore = 0x1E3A8A, lato = 'D') => inMano2(id, lato, cyl(0.0065, 0.0065, 0.14, M(colore, { roughness: 0.4 }), 8));
  const timbroDi = id => inMano2(id, 'D', gruppo(at(cyl(0.03, 0.03, 0.03, M(0x8A6A45, { roughness: 0.7 }), 14), 0, -0.03, 0), at(cyl(0.012, 0.016, 0.07, M(0x3A2A22, { roughness: 0.6 }), 10), 0, 0.02, 0), at(sph(0.02, M(0x3A2A22, { roughness: 0.6 }), 10, 8), 0, 0.06, 0)), 0, -0.06, 0.05, 0);
  const timbra = (x, tb) => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.8, 0.92), colpo = Math.pow(Math.abs(onda(s, 0.55, 0.4)), 6) * k; tb.visible = u > 0.1 && u < 0.9;   // su e giù, due colpi secchi
    br(Q, 'D', [-1.15, 0.22, -1.6], k); br(Q, 'D', [-0.5, 0.25, -1.3], colpo); Q.hx = 0.18 * k + 0.08 * colpo; Q.lean = 0.04 + 0.05 * colpo; Q.twist = -0.1 * k; };
  const contaSulleDita = x => { const { u, s, Q } = x, k = campana(u, 0.05, 0.16, 0.82, 0.94); br(Q, 'S', [-1.2, 0.1, -1.9], k); br(Q, 'D', [-1.15, -0.28, -1.9], k, 0, 0, 0.14 * Math.abs(onda(s, 0.75))); Q.hx = 0.16 * k; annuisci(Q, s, k, 0.75, 0.04); parla2(x, k); };

  /* ================================================================ VITO (GTA VI): scrive a tempo di musica, con le cuffie */
  const VERSO_REGIA_VITO = stretto(versoChi('gta', REGIA) * 1.2, -1.9, 1.9);
  function vitoBase(t) { const battuta = t * 2 * PI * 1.75, colpo = Math.pow(0.5 + 0.5 * Math.sin(battuta), 2), batte = campana((t % 11.3) / 11.3, 0.52, 0.58, 0.84, 0.9);   // 105 battiti al minuto; ogni tanto due righe sulla tastiera
    const B = { ...SEDUTO, h: SEDUTO.h - 0.005 * colpo, lean: 0.035 + 0.012 * colpo, hx: 0.03 + 0.085 * colpo, hy: Math.sin(t * 0.31) * 0.05, hz: Math.sin(battuta / 2) * 0.03, sedia: 0 };
    B.sD = [SEDUTO.sD[0] - 0.018 * colpo, SEDUTO.sD[1]]; B.sS = [SEDUTO.sS[0] - 0.018 * colpo, SEDUTO.sS[1]];
    B.gD = SEDUTO.gD + Math.sin(t * 17) * 0.05 * batte + 0.015 * colpo * (1 - batte); B.gS = SEDUTO.gS + Math.sin(t * 17 + 2.1) * 0.05 * batte + 0.015 * colpo * (1 - batte); return B; }
  REPERTORI.gta = { base: 'tiene il tempo con la testa e ogni tanto batte due righe', gesti: [
    ['penne', 6.5, 2, 'Assolo con le penne', x => { const { u, s, Q } = x, o = OGGETTI_VITO, allunga = Math.max(campana(u, 0.03, 0.11, 0.13, 0.2), campana(u, 0.8, 0.87, 0.89, 0.96)), suona = campana(u, 0.19, 0.25, 0.74, 0.8), f = s * 2 * PI * 4;
      Q.twist = 0.26 * allunga; Q.lean = 0.04 + 0.15 * allunga - 0.03 * suona; Q.hy = 0.28 * allunga; Q.hx = 0.08 * allunga + (0.04 + 0.08 * Math.abs(Math.sin(f / 2))) * suona; Q.hz = Math.sin(f / 4) * 0.08 * suona;
      Q.sD = [-0.5 - 0.45 * allunga, -0.12 + 0.34 * allunga]; Q.gD = -1.25 + 0.5 * allunga + Math.sin(f) * 0.34 * suona; Q.sS = [-0.5 - 0.2 * allunga, 0.12]; Q.gS = -1.25 + 0.2 * allunga + Math.sin(f + PI) * 0.34 * suona;
      if (u > 0.12 && u < 0.88) o.bacchette.forEach(b => { b.visible = true; }); }],
    ['orecchio', 6.5, 2, 'Scosta una cuffia: l\'hanno chiamato?', x => { const { u, s, Q } = x, o = OGGETTI_VITO, mano = campana(u, 0.03, 0.14, 0.62, 0.74), scosta = campana(u, 0.12, 0.2, 0.58, 0.68), guarda = campana(u, 0.2, 0.32, 0.5, 0.6), scuote = campana(u, 0.72, 0.76, 0.9, 0.95);
      Q.sD = [-0.35 - 0.6 * mano + 0.1 * guarda, -0.12 - 0.72 * mano]; Q.gD = -1.55 - 1.0 * mano; Q.hy = VERSO_REGIA_VITO * 0.36 * guarda + Math.sin(s * 10) * 0.17 * scuote; Q.twist = VERSO_REGIA_VITO * 0.3 * guarda; Q.hx = -0.03 * guarda; Q.lean = 0.04 - 0.05 * guarda;
      o.cuffie.pad[-1].position.x = -0.205 - 0.075 * scosta; o.cuffie.pad[-1].rotation.y = 0.5 * scosta; }],
    ['tazza', 7, 2, 'La tazza è vuota', x => { const { u, Q } = x, o = OGGETTI_VITO, allunga = Math.max(campana(u, 0.02, 0.1, 0.12, 0.18), campana(u, 0.82, 0.89, 0.9, 0.96)), beve = campana(u, 0.15, 0.27, 0.36, 0.44), guarda = campana(u, 0.42, 0.52, 0.7, 0.8), delusa = campana(u, 0.5, 0.58, 0.84, 0.92);
      Q.sD = [-0.35 - 0.3 * allunga - 0.5 * beve - 0.3 * guarda, -0.12 - 0.42 * allunga + 0.32 * beve + 0.26 * guarda]; Q.gD = -1.55 + 0.45 * allunga - 0.6 * beve - 0.3 * guarda;
      Q.hx = -0.2 * beve + 0.3 * guarda; Q.hz = -0.26 * guarda; Q.hy = -0.1 * guarda; Q.lean = 0.04 - 0.05 * beve; if (u > 0.11 && u < 0.89) inMano(o.tazza, Q, 0.7 * beve + 0.95 * guarda); x.bocca(-0.4 * delusa); }],
    ['giro', 5, 2, 'Un giro sulla sedia', x => { const { u, Q } = x, spinta = campana(u, 0.02, 0.1, 0.13, 0.2), su = campana(u, 0.12, 0.24, 0.78, 0.92);
      x.giro = 2 * PI * fra(u, 0.13, 0.87); Q.aD = Q.aS = -1.22 - 0.2 * su + 0.2 * spinta; Q.kD = Q.kS = 1.22 + 0.3 * su - 0.35 * spinta; Q.lean = 0.04 - 0.12 * su; Q.hx = -0.06 * su; Q.sedia = 0.05 * su;
      Q.sD = [-0.35 + 0.15 * su, -0.12 - 0.08 * su]; Q.gD = -1.55 + 0.4 * su; Q.sS = [-0.35 + 0.15 * su, 0.12 + 0.08 * su]; Q.gS = -1.55 + 0.4 * su; x.bocca(0.25 * su); }],
    ['scatto', 8.5, 1.2, 'Scatto sulla tastiera', x => { const { u, s, Q } = x, batte2 = campana(u, 0.03, 0.08, 0.52, 0.55), alza = campana(u, 0.54, 0.575, 0.585, 0.6), molla = campana(u, 0.63, 0.72, 0.9, 0.97), f = s * 27;
      Q.lean = 0.04 - 0.05 * batte2 - 0.22 * molla; Q.hx = 0.02 - 0.12 * molla; Q.sedia = 0.1 * molla; Q.h = SEDUTO.h - 0.012 * molla;
      Q.sD = [-0.35 - 0.02 * Math.sin(f) * batte2 - 0.4 * alza + 0.25 * molla, -0.12 - 0.1 * molla]; Q.gD = -1.55 + Math.sin(f) * 0.09 * batte2 - 0.3 * alza + 0.6 * molla;
      Q.sS = [-0.35 - 0.02 * Math.sin(f + 2) * batte2 + 0.25 * molla, 0.12 + 0.1 * molla]; Q.gS = -1.55 + Math.sin(f + 2.1) * 0.09 * batte2 + 0.6 * molla; x.bocca(0.2 * molla); }],
    ['stiracchia', 7.5, 1, 'Si stiracchia', x => { const { u, Q } = x, su = campana(u, 0.04, 0.2, 0.8, 0.94), don = Math.sin(fra(u, 0.25, 0.78) * 2 * PI * 2.2) * campana(u, 0.22, 0.3, 0.72, 0.8);
      Q.sD = [-0.35 - 2.25 * su, -0.12 - 0.6 * su]; Q.gD = -1.55 - 0.85 * su; Q.sS = [-0.35 - 2.25 * su, 0.12 + 0.6 * su]; Q.gS = -1.55 - 0.85 * su;
      Q.lean = 0.04 - (0.3 + 0.06 * don) * su; Q.sedia = (0.16 + 0.05 * don) * su; Q.hx = -0.2 * su; Q.kD = Q.kS = 1.22 - 0.35 * su; x.occhi(0.75 * su); }],
    ['occhi', 7.5, 1, 'Riposa gli occhi', x => { const { u, s, Q } = x, o = OGGETTI_VITO, giu = campana(u, 0.03, 0.14, 0.7, 0.82), alle = Math.max(campana(u, 0.02, 0.1, 0.13, 0.2), campana(u, 0.68, 0.76, 0.8, 0.88)), strofina = campana(u, 0.24, 0.32, 0.56, 0.64), cerchio = Math.sin(s * 7) * 0.05 * strofina;
      o.cuffie.g.position.set(0, -0.21 * giu, 0.02 * giu); o.cuffie.g.rotation.x = -1.3 * giu; o.cuffie.g.scale.x = 1 - 0.2 * giu;
      Q.sD = [-0.35 - 0.95 * alle - 1.65 * strofina, -0.12 - 0.2 * alle + 0.24 * strofina + cerchio]; Q.gD = -1.55 - 0.85 * alle + 0.15 * strofina;
      Q.sS = [-0.35 - 0.95 * alle - 1.65 * strofina, 0.12 + 0.2 * alle - 0.24 * strofina - cerchio]; Q.gS = -1.55 - 0.85 * alle + 0.15 * strofina; Q.hx = 0.14 * strofina; Q.lean = 0.04 - 0.05 * strofina; x.occhi(Math.max(strofina, 0.4 * giu)); }],
    ['risata', 6, 1, 'Ride da solo, in silenzio', x => { const { u, s, Q } = x, vicino = campana(u, 0.03, 0.14, 0.72, 0.86), ride = campana(u, 0.3, 0.36, 0.62, 0.7), f = s * 2 * PI * 5;
      Q.lean = 0.04 + 0.24 * vicino - 0.16 * ride + Math.sin(f) * 0.025 * ride; Q.hx = -0.12 * vicino - 0.14 * ride + Math.sin(f) * 0.03 * ride; Q.h = SEDUTO.h + Math.abs(Math.sin(f)) * 0.008 * ride;
      Q.sD = [-0.35 + Math.sin(f) * 0.035 * ride, -0.12]; Q.sS = [-0.35 + Math.sin(f) * 0.035 * ride, 0.12]; x.bocca(0.35 * vicino + 0.2 * ride); x.occhi(0.65 * ride); }],
    ['spacca', 5.5, 1, '«Questa spacca»', x => { const { u, s, Q } = x, annuisce = campana(u, 0.03, 0.08, 0.36, 0.42), indica = campana(u, 0.3, 0.4, 0.56, 0.64), pugno = campana(u, 0.62, 0.7, 0.86, 0.94), tira = fra(u, 0.72, 0.78), f = s * 2 * PI * 1.6;
      Q.hx = 0.02 + (0.1 + 0.1 * Math.sin(f)) * annuisce - 0.05 * pugno; Q.lean = 0.04 + 0.05 * indica - 0.04 * pugno + 0.05 * tira * pugno; Q.h = SEDUTO.h - 0.01 * tira * pugno;
      Q.sD = [-0.35 - 0.9 * indica - 0.55 * pugno + 0.35 * tira * pugno, -0.12 + 0.1 * indica - 0.2 * pugno]; Q.gD = -1.55 + 1.35 * indica - 0.75 * pugno; x.bocca(0.3 * Math.max(indica, pugno)); }],
  ] };

  /* ================================================================ OLIVIA (la regia): in piedi, pratica e diretta. Comanda col corpo */
  const TAVOLETTA = [-0.55, 0.05, -1.5], dEdizione = versoChi('regia', ISOLE.edizione), dSchede = versoChi('regia', ISOLE.schede), dMuro = versoChi('regia', [MURO.x, 0]);
  REPERTORI.regia = { base: 'passa da uno schermo all\'altro con la tavoletta in mano, indica e annota', gesti: [
    ['ora', 6, 2, 'Guarda l\'ora: quanto manca?', x => { const { u, Q } = x, polso = campana(u, 0.05, 0.18, 0.45, 0.56), muro = campana(u, 0.5, 0.62, 0.84, 0.94); br(Q, 'S', TAVOLETTA);
      br(Q, 'D', POSE.POLSO, polso); Q.hx = 0.3 * polso - 0.22 * muro; Q.giro = dMuro * 0.8 * muro; Q.hy = dMuro * 0.25 * muro; }],
    ['fianchi', 7, 2, 'Mani sui fianchi: guarda la redazione', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); due(Q, POSE.FIANCO, k); Q.giro = 2.3 * k; Q.hy = onda(s, 0.22) * 0.45 * k; Q.lean = -0.04 * k; Q.hx = -0.04 * k; }],
    ['indica', 5.5, 2, '«Tu: vai»', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.74, 0.9), punta = campana(u, 0.2, 0.3, 0.6, 0.72); br(Q, 'S', TAVOLETTA);
      Q.giro = dEdizione * 0.9 * k; br(Q, 'D', [-1.4, 0.06, -0.15], punta, 0.05 * onda(s, 2.2)); Q.lean = 0.06 * punta; annuisci(Q, s, campana(u, 0.6, 0.66, 0.84, 0.92), 1.8, 0.07); parla2(x, punta); }],
    ['conserte', 7, 1, 'Braccia conserte: ci pensa', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.82, 0.95); due(Q, POSE.CONSERTE, k); Q.hz = 0.13 * k; Q.hx = 0.06 * k; Q.lean = -0.05 * k; Q.aD = -0.1 * k * Math.max(0, onda(s, 1.6)); Q.h = H0 - 0.004 * k; }],
    ['collo', 6, 1, 'Si massaggia il collo', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'S', TAVOLETTA, 1, 0.3 * k); br(Q, 'D', POSE.NUCA, k, 0.05 * onda(s, 1.2)); Q.hz = onda(s, 0.33) * 0.2 * k; Q.hx = 0.1 * k; x.occhi(0.7 * k); }],
    ['mani', 4.5, 1, 'Batte le mani: «si chiude!»', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.8, 0.94), batte2 = Math.pow(Math.abs(onda(s, 1.1)), 4); due(Q, [-1.0, -0.3, -1.5], k, 0, 0.16 * (1 - batte2)); Q.giro = 2.0 * k; Q.h = H0 + 0.006 * batte2 * k; parla2(x, k); }],
    ['pollice', 5, 1, 'Pollice in su', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); br(Q, 'S', TAVOLETTA); Q.giro = dSchede * 0.9 * k; br(Q, 'D', [-1.6, 0.3, -1.3], k, 0.06 * onda(s, 1.5)); annuisci(Q, s, k, 1.5, 0.05); x.bocca(0.3 * k); }],
    ['giacca', 5, 1, 'Si sistema la giacca', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94), tira = Math.max(0, onda(s, 0.9)) * k; due(Q, POSE.PETTO, k, 0.12 * tira); Q.hx = -0.1 * k; Q.lean = -0.04 * k; Q.h = H0 + 0.006 * tira; }],
    ['scaletta', 6.5, 1, 'Scorre la scaletta sulla tavoletta', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.95); br(Q, 'S', [-0.85, 0.0, -1.6]); br(Q, 'D', [-0.75, -0.32, -1.75], k, 0.1 * onda(s, 1.3)); Q.hx = 0.28 * k; Q.hy = 0.12 * k; }],
  ] };

  /* ================================================================ TOBIA (il lettore): curioso e meticoloso. Legge, e gli piace dire da dove viene una notizia */
  const evidenziatoreT = inMano2('lettura', 'D', gruppo(cyl(0.011, 0.011, 0.1, M(0xF5E642, { roughness: 0.4 }), 10), at(cyl(0.0115, 0.0115, 0.03, nero, 10), 0, 0.062, 0)));
  const giornaleT = stampa(0.56, 0.38, texPagine(77)); giornaleT.material.side = THREE.DoubleSide; giornaleT.rotation.x = -0.5; giornaleT.visible = false; persone.lettura.userData.j.busto.add(at(giornaleT, 0, 0.3, 0.34)); oggettiGesto.push(giornaleT);
  const dEttore = versoChi('lettura', posti.redattore.seduta);
  REPERTORI.lettura = { base: 'legge con una mano sul mouse, si avvicina allo schermo, ogni tanto appoggia il mento', gesti: [
    ['evidenzia', 6, 2, 'Evidenzia una riga', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.8, 0.93); Q.twist = -0.26 * k; Q.hy = -0.3 * k; Q.hx = 0.26 * k; Q.lean = 0.04 + 0.08 * k; br(Q, 'D', POSE.LATO, k, 0.06, 0.12 * onda(s, 0.8)); evidenziatoreT.visible = u > 0.12 && u < 0.88; }],
    ['incredulo', 6, 2, 'Si avvicina: non ci crede', x => { const { u, Q } = x, vicino = campana(u, 0.05, 0.2, 0.5, 0.6), indietro = campana(u, 0.58, 0.68, 0.84, 0.95); Q.lean = 0.04 + 0.28 * vicino - 0.14 * indietro; Q.hx = -0.1 * vicino - 0.08 * indietro; x.occhi(0.5 * vicino); x.bocca(0.45 * indietro); br(Q, 'D', POSE.MOUSE); }],
    ['giornale', 8, 1, 'Apre il giornale', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.84, 0.95); due(Q, POSE.FOGLIO, k, 0.2, 0.42); Q.hx = 0.12 * k; Q.hy = onda(s, 0.25) * 0.3 * k; Q.lean = 0.04 - 0.08 * k; giornaleT.visible = u > 0.12 && u < 0.9; }],
    ['conta', 6, 1, 'Conta le testate sulle dita', contaSulleDita],
    ['barba', 5.5, 1, 'Si gratta la barba', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'D', POSE.MENTO, k, 0.05 * onda(s, 2.2)); Q.hz = -0.13 * k; Q.hy = 0.2 * k; Q.hx = -0.1 * k; }],
    ['sbadiglio', 7, 1, 'Sbadiglia e si stiracchia', x => { const { u, Q } = x, k = campana(u, 0.06, 0.26, 0.74, 0.94); due(Q, POSE.ALTO, k, 0, 0.35); Q.lean = 0.04 - 0.26 * k; Q.sedia = 0.12 * k; Q.hx = -0.2 * k; x.bocca(0.9 * campana(u, 0.2, 0.36, 0.6, 0.76)); x.occhi(0.9 * k); }],
    ['scorre', 5, 1, 'Scorre veloce', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.84, 0.95); br(Q, 'D', POSE.MOUSE, 1, 0, 0, 0.05 * onda(s, 6) * k); Q.lean = 0.04 + 0.12 * k; Q.hx = (0.04 + 0.08 * onda(s, 1.2)) * k; }],
    ['eureka', 5.5, 2, 'Trovata l\'origine!', x => { const { u, s, Q } = x, su = campana(u, 0.05, 0.14, 0.42, 0.54), scrive = campana(u, 0.52, 0.62, 0.86, 0.95); br(Q, 'D', POSE.ALTO, su, 0.04 * onda(s, 3)); br(Q, 'D', POSE.PENNA, scrive, 0, 0.05 * onda(s, 4)); Q.hx = -0.12 * su + 0.26 * scrive; Q.h = SEDUTO.h + 0.01 * su; x.bocca(0.4 * su); }],
    ['ettore', 6.5, 1, 'Lo dice a Ettore', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); Q.twist = dEttore * 0.3 * k; Q.hy = dEttore * 0.4 * k; br(Q, 'D', [-0.9, 0.35, -1.5], k, 0.1 * onda(s, 1.4), 0.08 * onda(s, 1.9)); Q.lean = 0.04 - 0.03 * k; parla2(x, k); }],
  ] };

  /* ================================================================ ETTORE (il redattore): tiene alla prosa. Scrive, cancella, rilegge, cerca la parola */
  const pennaE = pennaDi('redattore');
  REPERTORI.redattore = { base: 'scrive, con qualche pausa per guardare le carte', gesti: [
    ['cancella', 6, 2, 'Cancella tutto', x => { const { u, s, Q } = x, k = campana(u, 0.05, 0.16, 0.72, 0.84), sospira = campana(u, 0.76, 0.84, 0.92, 0.98); br(Q, 'D', [-0.45, 0.02, -1.42], k); br(Q, 'S', POSE.GREMBO, k); scuoti(Q, s, k, 0.6, 0.16); Q.lean = 0.04 - 0.05 * k; Q.h = SEDUTO.h - 0.012 * sospira; Q.hx = 0.1 * sospira; }],
    ['rilegge', 6.5, 2, 'Rilegge a mezza voce', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94); br(Q, 'D', [-1.0, 0.0, -0.75], k, 0.03 * onda(s, 0.4), 0.14 * onda(s, 0.55)); Q.hy = onda(s, 0.55) * 0.12 * k; Q.lean = 0.04 + 0.08 * k; parla2(x, k); }],
    ['parola', 7, 2, 'Cerca la parola giusta', x => { const { u, s, Q } = x, cerca = campana(u, 0.05, 0.2, 0.56, 0.64), trovata = campana(u, 0.62, 0.66, 0.7, 0.76), scrive = campana(u, 0.72, 0.78, 0.92, 0.98); Q.hx = -0.3 * cerca; Q.hy = 0.25 * cerca; Q.lean = 0.04 - 0.08 * cerca;
      br(Q, 'D', [-1.1, 0.25, -1.6], cerca, 0.12 * onda(s, 0.9), 0.12 * onda(s, 0.9, 1.57)); br(Q, 'D', [-1.3, 0.2, -1.2], trovata); batti(Q, s, scrive, 0.08, 4); x.bocca(0.3 * trovata); }],
    ['dita', 5, 1, 'Si scrocchia le dita', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.24, 0.6, 0.74), scuote = campana(u, 0.72, 0.78, 0.9, 0.96); due(Q, [-1.3, -0.3, -0.25], k); Q.lean = 0.04 + 0.06 * k; due(Q, [-0.6, 0.2, -1.6], scuote, 0, 0, 0.2 * onda(s, 5)); }],
    ['capelli', 6, 1, 'Mani nei capelli', x => { const { u, Q } = x, k = campana(u, 0.06, 0.22, 0.78, 0.94); due(Q, POSE.TESTA, k, 0, 0.15); Q.hx = 0.3 * k; Q.lean = 0.04 + 0.14 * k; x.occhi(0.75 * k); }],
    ['caffe', 6.5, 1, 'Un sorso di caffè', x => sorso(x, tazzeMano.redattore)],
    ['appunto', 6, 1, 'Un appunto a penna', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94); Q.twist = 0.2 * k; Q.hy = 0.25 * k; Q.hx = 0.28 * k; br(Q, 'D', [-0.5, -0.22, -1.5], k, 0.03 * onda(s, 3.3), 0.05 * onda(s, 2.1)); pennaE.visible = u > 0.1 && u < 0.9; }],
    ['giudica', 7, 1, 'Si allontana e giudica il pezzo', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.22, 0.8, 0.94); due(Q, POSE.CONSERTE, k); Q.lean = 0.04 - 0.22 * k; Q.sedia = 0.1 * k; Q.hz = 0.15 * k; annuisci(Q, s, campana(u, 0.6, 0.66, 0.8, 0.9), 1.3, 0.05); }],
    ['punto', 5.5, 1, 'Il punto finale', x => { const { u, Q } = x, alza = campana(u, 0.06, 0.16, 0.2, 0.26), molla = campana(u, 0.3, 0.44, 0.8, 0.94); br(Q, 'D', [-1.0, 0.1, -1.3], alza); due(Q, POSE.NUCA, molla); Q.lean = 0.04 - 0.24 * molla; Q.sedia = 0.12 * molla; Q.hx = -0.12 * molla; x.bocca(0.35 * molla); }],
  ] };

  /* ================================================================ IVO (il revisore): pignolo ma gentile. La penna rossa, gli occhiali, i baffi */
  REPERTORI.revisore = { base: 'segna le bozze con la penna rossa, e ogni tanto rilegge', gesti: [
    ['occhiali', 5, 1, 'Si sistema gli occhiali', x => { const { u, Q } = x, k = campana(u, 0.06, 0.2, 0.7, 0.9); penna.visible = false; br(Q, 'D', POSE.NASO, k); Q.hx = 0.1 * k; x.occhi(0.3 * k); }],
    ['cerchia', 6.5, 2, 'Cerchia in rosso e sottolinea', x => { const { u, s, Q } = x, k = campana(u, 0.05, 0.16, 0.84, 0.95), gira = campana(u, 0.1, 0.16, 0.5, 0.56), riga = campana(u, 0.56, 0.62, 0.84, 0.9); Q.twist = -0.14 * k; Q.hx = 0.36 * k; Q.hy = -0.3 * k; br(Q, 'S', [-0.35, 0.18, -1.5], k);
      br(Q, 'D', POSE.PENNA, k, 0.06 * onda(s, 1.5) * gira, 0.08 * onda(s, 1.5, 1.57) * gira + 0.12 * onda(s, 2.2) * riga); }],
    ['sospira', 6, 2, 'Scuote la testa e sospira', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.58, 0.66), sospira = campana(u, 0.62, 0.72, 0.9, 0.97); scuoti(Q, s, k, 0.55, 0.2); Q.hx = 0.2 * k + 0.1 * sospira; Q.h = SEDUTO.h - 0.014 * sospira; Q.lean = 0.04 + 0.07 * sospira; br(Q, 'D', POSE.PENNA, 1); }],
    ['controluce', 7, 1, 'Alza il foglio in controluce', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.22, 0.8, 0.94); penna.visible = false; due(Q, [-1.7, 0.1, -1.2], k); Q.hx = -0.26 * k; Q.hy = onda(s, 0.3) * 0.1 * k; Q.lean = 0.04 - 0.08 * k; if (u > 0.1 && u < 0.9) inMano(foglioMano, Q, -1.1); }],
    ['baffi', 5.5, 1, 'Si liscia i baffi', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); penna.visible = false; br(Q, 'D', [-0.98, -0.2, -2.3], k, 0, 0.06 * onda(s, 1.1)); Q.hx = -0.08 * k; Q.hy = 0.2 * k; }],
    ['ritmo', 6, 1, 'Batte il ritmo della frase', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.84, 0.95); br(Q, 'S', [-0.4, 0.2, -1.45], k, 0, 0, 0.1 * Math.max(0, onda(s, 2.6))); br(Q, 'D', POSE.PENNA, 1); annuisci(Q, s, k, 1.3, 0.035); Q.hx += 0.2 * k; parla2(x, k); }],
    ['duedita', 6.5, 1, 'Cerca una parola, con due dita', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.84, 0.95), guarda = 0.5 + 0.5 * Math.sign(onda(s, 0.45)); penna.visible = false; br(Q, 'D', POSE.TASTIERA, k, 0, -0.04, 0.12 * Math.max(0, onda(s, 1.2))); br(Q, 'S', POSE.TASTIERA, k, 0, -0.04, 0.12 * Math.max(0, onda(s, 1.2, PI))); Q.hx = (0.34 * guarda - 0.02) * k; Q.hy = 0; Q.twist = 0; }],
    ['spunta', 5, 1, 'Annuisce e mette la spunta', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.78, 0.94), segno = fra(u, 0.4, 0.62); annuisci(Q, s, campana(u, 0.06, 0.12, 0.36, 0.44), 1.6, 0.07); br(Q, 'D', [-1.0, 0.08, -1.6], k, -0.12 * segno + 0.1 * campana(u, 0.4, 0.48, 0.5, 0.56), 0.16 * segno); x.bocca(0.3 * k); }],
    ['te', 6.5, 1, 'Un sorso di tè', x => { penna.visible = false; sorso(x, tazzeMano.revisore); }],
  ] };

  /* ================================================================ NORA (la verifica): scettica per mestiere. Il telefono, la lente, il timbro */
  const lenteN = inMano2('verifica', 'D', gruppo(ombra(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 10, 24), alluminio)), at(box(0.012, 0.09, 0.012, nero, 0.004), 0, -0.09, 0)), 0, 0.03, 0.07, 0.4), timbroN = timbroDi('verifica'), pennaN = pennaDi('verifica', 0xC8344A);
  REPERTORI.verifica = { base: 'è al telefono con una fonte, e intanto prende appunti', gesti: [
    ['dubbio', 7, 2, '«Non mi convince»', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.22, 0.8, 0.94); cornetta.visible = false; due(Q, POSE.CONSERTE, k); Q.lean = 0.04 - 0.2 * k; Q.sedia = 0.08 * k; Q.hz = 0.16 * k; scuoti(Q, s, campana(u, 0.3, 0.4, 0.7, 0.8), 0.5, 0.16); x.bocca(-0.3 * k); }],
    ['lente', 7, 2, 'Guarda con la lente', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); cornetta.visible = false; br(Q, 'D', [-1.05, -0.12, -1.85], k); br(Q, 'S', [-0.4, 0.2, -1.45], k); Q.lean = 0.04 + 0.2 * k; Q.hx = 0.2 * k; Q.hy = onda(s, 0.4) * 0.14 * k; x.occhi(0.3 * k); lenteN.visible = u > 0.1 && u < 0.9; }],
    ['confronta', 6.5, 2, 'Confronta due fonti', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94), lato = onda(s, 0.6); cornetta.visible = false; Q.hy = 0.35 * lato * k; Q.hx = 0.12 * k + 0.1 * Math.max(0, lato) * k; br(Q, 'D', [-0.95, 0.1, -1.1], k, 0, -0.3 * lato); Q.twist = 0.1 * lato * k; }],
    ['riattacca', 5.5, 1, 'Riattacca, e cancella una riga', x => { const { u, s, Q } = x, giu = campana(u, 0.08, 0.18, 0.3, 0.4), riga = campana(u, 0.4, 0.5, 0.82, 0.94); cornetta.visible = u < 0.2; br(Q, 'S', [-0.5, 0.36, -1.2], giu); br(Q, 'D', POSE.PENNA, riga, 0, 0.14 * onda(s, 2.4)); Q.hx = 0.26 * riga; Q.hy = -0.22 * riga; Q.twist = -0.1 * riga; pennaN.visible = u > 0.42 && u < 0.92; }],
    ['conta', 6, 1, 'Conta le testate', x => { cornetta.visible = false; contaSulleDita(x); }],
    ['cenno', 5, 1, 'Fa un cenno a Tobia', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); cornetta.visible = false; br(Q, 'D', [-1.55, 0.2, -1.2], k, 0, 0.16 * onda(s, 2.2)); Q.hx = -0.08 * k; Q.lean = 0.04 + 0.06 * k; x.bocca(0.3 * k); }],
    ['occhiali', 5, 1, 'Si sistema gli occhiali', x => { const { u, Q } = x, k = campana(u, 0.06, 0.2, 0.5, 0.64), stringe = campana(u, 0.4, 0.54, 0.84, 0.95); cornetta.visible = false; br(Q, 'D', POSE.NASO, k); Q.lean = 0.04 + 0.16 * stringe; Q.hx = 0.08 * k - 0.06 * stringe; x.occhi(0.45 * stringe); }],
    ['timbro', 5.5, 2, 'Timbra: verificato', x => { cornetta.visible = false; timbra(x, timbroN); annuisci(x.Q, x.s, campana(x.u, 0.7, 0.76, 0.88, 0.95), 1.6, 0.05); }],
    ['spallucce', 5.5, 1, 'Fa spallucce: va bene così', x => { const { u, s, Q } = x, su = campana(u, 0.06, 0.18, 0.44, 0.56), ok = campana(u, 0.54, 0.64, 0.84, 0.95); cornetta.visible = false; due(Q, [-0.35, 0.5, -1.95], su); Q.h = SEDUTO.h + 0.012 * su; Q.hz = 0.14 * su; br(Q, 'D', [-1.3, 0.25, -1.5], ok, 0.05 * onda(s, 1.6)); x.bocca(0.3 * ok); }],
  ] };

  /* ================================================================ LEA (la visualista): ragiona per immagini. Lo stilo, i colori, il confronto con Bruno */
  const campioneL = inMano2('visualista', 'S', box(0.05, 0.09, 0.004, M(0xE01F3D, { roughness: 0.6 }), 0.002), 0, -0.05, 0.07, 1.2), dBruno = versoChi('visualista', posti.foto.seduta);
  REPERTORI.visualista = { base: 'disegna con lo stilo sulla tavoletta, e ogni tanto alza gli occhi allo schermo', gesti: [
    ['cornice', 6, 2, 'Inquadra con le dita', x => { const { u, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); stilo.visible = false; due(Q, POSE.CORNICE, k); Q.hz = 0.1 * k; Q.lean = 0.04 - 0.06 * k; x.occhi(0.45 * k); }],
    ['ruota', 6, 1, 'Gira la tavoletta e riprende', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.5, 0.62), riprende = campana(u, 0.56, 0.66, 0.86, 0.95); Q.twist = -0.22 * (k + riprende) * 0.6; br(Q, 'D', [-0.6, 0.42, -1.25], k); br(Q, 'S', [-0.7, -0.25, -1.3], k); Q.hz = -0.2 * (k + riprende) * 0.6; Q.hx = 0.22 * (k + riprende) * 0.6; br(Q, 'D', [-0.5, 0.28, -1.35], riprende, 0.08 * onda(s, 2.3), 0.1 * onda(s, 1.7)); }],
    ['pensa', 6, 2, 'Lo stilo fra i denti', x => { const { u, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'D', POSE.BOCCA, k, -0.05); br(Q, 'S', [-0.4, 0.2, -1.45], k); Q.hx = -0.22 * k; Q.hy = 0.2 * k; Q.lean = 0.04 - 0.06 * k; }],
    ['tratto', 6.5, 2, 'Un tratto lungo, poi si allontana', x => { const { u, Q } = x, k = campana(u, 0.05, 0.14, 0.46, 0.54), corre = fra(u, 0.12, 0.44), guarda = campana(u, 0.5, 0.62, 0.84, 0.95); br(Q, 'D', [-0.55, -0.15 + 0.65 * corre, -1.3], k); Q.twist = (0.1 - 0.3 * corre) * k; Q.lean = 0.04 + 0.1 * k - 0.2 * guarda; Q.hx = 0.24 * k; Q.hz = 0.14 * guarda; Q.sedia = 0.08 * guarda; }],
    ['colore', 7, 1, 'Sceglie un colore', x => { const { u, s, Q } = x, prende = campana(u, 0.05, 0.14, 0.18, 0.26), mostra = campana(u, 0.24, 0.36, 0.78, 0.9); stilo.visible = false; br(Q, 'S', POSE.LATO, prende, 0, -0.1); br(Q, 'S', [-1.35, 0.15, -1.2], mostra); Q.hy = 0.25 * prende + onda(s, 0.5) * 0.14 * mostra; Q.hz = 0.1 * mostra; campioneL.visible = u > 0.16 && u < 0.9; }],
    ['rifa', 5.5, 1, 'Cancella e rifà', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.14, 0.56, 0.64), sospira = campana(u, 0.6, 0.7, 0.86, 0.95); br(Q, 'D', [-0.5, 0.28, -1.35], k, 0.06 * onda(s, 5), 0.12 * onda(s, 4.3)); scuoti(Q, s, k, 1.1, 0.14); Q.hx = 0.24 * k + 0.08 * sospira; Q.h = SEDUTO.h - 0.01 * sospira; }],
    ['frangia', 5, 1, 'Si sposta la frangia', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.76, 0.94); br(Q, 'S', POSE.FRONTE, k, 0, 0.12 * onda(s, 0.8)); Q.hx = -0.1 * k; x.bocca(-0.3 * campana(u, 0.1, 0.2, 0.34, 0.44)); }],
    ['bruno', 6.5, 2, 'Lo fa vedere a Bruno', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); Q.twist = dBruno * 0.32 * k; Q.hy = dBruno * 0.42 * k; br(Q, 'S', [-0.9, -0.35, -1.0], k, 0.06 * onda(s, 1.5)); Q.lean = 0.04 - 0.04 * k; parla2(x, k); }],
    ['applauso', 4.5, 1, 'Funziona: un applausino', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.8, 0.94); stilo.visible = false; due(Q, [-0.95, -0.3, -1.75], k, 0, 0.1 * onda(s, 4.5)); Q.h = SEDUTO.h + 0.006 * Math.abs(onda(s, 2.2)) * k; x.bocca(0.45 * k); }],
  ] };

  /* ================================================================ BRUNO (le foto): concreto, di buon occhio. La macchina al collo, le stampe */
  const macchinaB = persone.foto.userData.j.busto.userData.macchina, stampaB = inMano2('foto', 'D', (() => { const s = stampa(0.16, 0.12, tela(160, 120, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9CC4E8'); g.addColorStop(1, '#F2C89A'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = g; x.fillRect(8, 8, w - 16, h - 16); })); s.material.side = THREE.DoubleSide; return s; })(), 0, -0.02, 0.1, -0.2);
  const obiettivoB = inMano2('foto', 'S', cyl(0.034, 0.038, 0.085, M(0x1B1C20, { roughness: 0.4 }), 16), 0, -0.04, 0.06, 1.57), dLea = versoChi('foto', posti.visualista.seduta);
  ripristini.push(() => { macchinaB.position.set(0, 0.262, 0.15); macchinaB.rotation.set(0, 0, 0); });
  REPERTORI.foto = { base: 'guarda le foto da vicino, una mano sul mouse', gesti: [
    ['scatta', 6, 2, 'Scatta una foto', x => { const { u, Q } = x, su = campana(u, 0.06, 0.2, 0.56, 0.66), guarda = campana(u, 0.62, 0.72, 0.86, 0.95), clic = campana(u, 0.36, 0.38, 0.4, 0.44); due(Q, [-1.6, -0.12, -1.7], su); due(Q, [-0.8, -0.2, -1.9], guarda);
      macchinaB.position.set(-0.03 * su, 0.262 + 0.4 * su + 0.05 * guarda, 0.15 + 0.17 * su + 0.06 * guarda); macchinaB.rotation.x = -0.5 * guarda; Q.hx = 0.05 * su + 0.3 * guarda - 0.05 * clic; Q.lean = 0.04 - 0.05 * su; x.occhi(0.5 * su); }],
    ['stampa', 6.5, 2, 'Guarda una stampa in controluce', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'D', [-1.55, 0.05, -1.3], k); Q.hx = -0.2 * k; Q.hz = onda(s, 0.4) * 0.14 * k; Q.lean = 0.04 - 0.06 * k; stampaB.visible = u > 0.1 && u < 0.9; }],
    ['ritaglia', 6, 2, 'Ritaglia con le mani', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); due(Q, POSE.CORNICE, k, 0, 0.12 + 0.12 * onda(s, 0.45)); Q.hz = 0.1 * onda(s, 0.3) * k; Q.lean = 0.04 - 0.05 * k; x.occhi(0.3 * k); }],
    ['obiettivo', 6, 1, 'Soffia sull\'obiettivo', x => { const { u, s, Q } = x, prende = campana(u, 0.05, 0.14, 0.18, 0.26), soffia = campana(u, 0.24, 0.34, 0.5, 0.58), pulisce = campana(u, 0.54, 0.62, 0.82, 0.92); br(Q, 'S', POSE.LATO, prende); br(Q, 'S', POSE.BOCCA, soffia); br(Q, 'S', POSE.PETTO, pulisce); br(Q, 'D', POSE.PETTO, pulisce, 0.06 * onda(s, 3), 0.06 * onda(s, 3, 1.57));
      Q.hx = 0.12 * soffia + 0.24 * pulisce; x.bocca(-0.35 * soffia); obiettivoB.visible = u > 0.16 && u < 0.92; }],
    ['zoom', 6, 1, 'Ingrandisce: guarda i pixel', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.24, 0.7, 0.92); Q.lean = 0.04 + 0.3 * k; Q.hx = -0.1 * k; br(Q, 'D', POSE.MOUSE, 1, 0, 0, 0.04 * onda(s, 5) * k); x.occhi(0.45 * k); }],
    ['sgranata', 5.5, 1, '«No: è sgranata»', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.6, 0.7), tasto = campana(u, 0.7, 0.76, 0.8, 0.88); scuoti(Q, s, k, 1.1, 0.2); due(Q, [-0.6, 0.6, -1.6], campana(u, 0.3, 0.4, 0.58, 0.68)); br(Q, 'D', [-0.6, 0.05, -1.25], tasto); Q.lean = 0.04 - 0.08 * k; x.bocca(-0.35 * k); }],
    ['testa', 5, 1, 'Si gratta la testa', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); br(Q, 'D', POSE.TESTA, k, 0, 0.08 * onda(s, 2.4)); Q.hx = -0.12 * k; Q.hy = 0.15 * k; Q.hz = -0.08 * k; }],
    ['giusta', 5, 2, '«Questa è la foto»', x => { const { u, s, Q } = x, bacio = campana(u, 0.06, 0.18, 0.34, 0.44), apre = campana(u, 0.4, 0.5, 0.78, 0.92); br(Q, 'D', POSE.BOCCA, bacio); br(Q, 'D', [-1.25, 0.15, -0.9], apre); annuisci(Q, s, apre, 1.5, 0.05); x.bocca(0.35 * apre); }],
    ['lea', 6.5, 2, 'La fa vedere a Lea', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); Q.twist = dLea * 0.32 * k; Q.hy = dLea * 0.42 * k; br(Q, 'D', [-1.1, -0.1, -0.5], k, 0.05 * onda(s, 1.4)); parla2(x, k); }],
  ] };

  /* ================================================================ ADA (la scheda AI): rapida e curiosa. Il robottino, il microfono, il serverino */
  const microfonoA = inMano2('ai', 'D', gruppo(cyl(0.012, 0.01, 0.13, M(0x2A2B30, { roughness: 0.5 }), 10), at(sph(0.026, M(0x3A3B40, { roughness: 1 }), 12, 8), 0, 0.085, 0), at(box(0.045, 0.045, 0.045, M(0xE01F3D, { roughness: 0.6 }), 0.006), 0, 0.04, 0)), 0, 0.0, 0.05, 0.5);
  ripristini.push(() => { robot.rotation.y = PI + 0.5; robot.position.y = TAV; });
  REPERTORI.ai = { base: 'scrive svelta, e ogni tanto guarda le carte', gesti: [
    ['robot', 6.5, 2, 'Parla al robottino', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); Q.twist = -0.3 * k; Q.hy = -0.38 * k; Q.hx = 0.14 * k; br(Q, 'D', POSE.LATO, k, 0.05 * Math.max(0, onda(s, 1.3)), -0.1); robot.rotation.y = PI + 0.5 + 0.6 * onda(s, 0.8) * k; robot.position.y = TAV + 0.012 * Math.abs(onda(s, 1.6)) * k; parla2(x, k); }],
    ['microfono', 7, 2, 'Detta al microfono', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'D', POSE.BOCCA, k, 0.05, 0.05); br(Q, 'S', POSE.GREMBO, k); annuisci(Q, s, k, 0.8, 0.03); parla2(x, k); microfonoA.visible = u > 0.1 && u < 0.9; }],
    ['paper', 6.5, 1, 'Legge un paper col dito', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94); br(Q, 'D', [-1.05, 0.0, -0.7], k, 0.12 * fra(u, 0.2, 0.8), 0.14 * onda(s, 0.7)); Q.lean = 0.04 + 0.16 * k; Q.hy = onda(s, 0.7) * 0.1 * k; parla2(x, k * 0.6); }],
    ['mente', 5.5, 2, '«Mi è esplosa la testa»', x => { const { u, Q } = x, tempie = campana(u, 0.06, 0.18, 0.4, 0.5), boom = campana(u, 0.46, 0.56, 0.8, 0.94); due(Q, POSE.TESTA, tempie, 0.2, -0.1); due(Q, POSE.ALTO, boom, 0.3, 0.55); Q.lean = 0.04 - 0.14 * boom; Q.hx = -0.1 * boom; x.bocca(0.7 * boom); }],
    ['caffe', 6.5, 1, 'Beve, e intanto scrive', x => sorso(x, tazzeMano.ai, beve => { x.Q.gS += onda(x.s, 3) * 0.07 * beve; })],
    ['ricci', 5, 1, 'Si sistema i ricci', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); due(Q, POSE.TESTA, k, 0.1 * onda(s, 1.2), 0.3); Q.hx = 0.06 * k; scuoti(Q, s, campana(u, 0.6, 0.66, 0.84, 0.92), 2, 0.1); }],
    ['server', 6, 1, 'Controlla il serverino', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.6, 0.72), ok = campana(u, 0.66, 0.76, 0.88, 0.96); Q.twist = 0.34 * k; Q.hy = 0.42 * k; br(Q, 'S', POSE.LATO, k, -0.2, 0.2, 0.1 * Math.max(0, onda(s, 2))); br(Q, 'D', [-1.3, 0.25, -1.5], ok); x.bocca(0.3 * ok); }],
    ['virgolette', 5, 1, '«Intelligenza», fra virgolette', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); due(Q, [-1.3, 0.38, -1.75], k, 0, 0, 0.16 * Math.max(0, onda(s, 2.2))); Q.hz = 0.13 * k; x.bocca(0.2 * k); }],
    ['balletto', 5.5, 2, 'Balletto da seduta', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94), o = onda(s, 2); Q.twist = 0.15 * o * k; br(Q, 'D', [-0.7, 0.35, -1.9], k, 0.2 * o); br(Q, 'S', [-0.7, 0.35, -1.9], k, -0.2 * o); Q.hz = 0.08 * o * k; Q.h = SEDUTO.h + 0.006 * Math.abs(o) * k; x.bocca(0.4 * k); }],
  ] };

  /* ================================================================ RITA (Games e Scienza): ordinata, un po' ironica. Il razzo, Saturno, la lista */
  const razzoR = inMano2('schede', 'D', gruppo(at(cyl(0.024, 0.024, 0.12, bianco, 14), 0, 0.02, 0), (() => { const c = ombra(new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.05, 14), M(0xE01F3D, { roughness: 0.4 }))); c.position.y = 0.105; return c; })(), at(box(0.07, 0.03, 0.006, M(0xE01F3D), 0.002), 0, -0.035, 0)), 0, -0.02, 0.06, 0), pennaR = pennaDi('schede', 0x7B4BE0);
  ripristini.push(() => { razzo.visible = true; if (saturnoRita) saturnoRita.rotation.y = 0; });
  REPERTORI.schede = { base: 'scrive ordinata, e ogni tanto guarda gli appunti', gesti: [
    ['razzo', 7, 2, 'Fa decollare il razzo', x => { const { u, s, Q } = x, prende = Math.max(campana(u, 0.04, 0.12, 0.14, 0.2), campana(u, 0.84, 0.9, 0.92, 0.97)), vola = campana(u, 0.18, 0.32, 0.7, 0.84), arco = fra(u, 0.2, 0.78); Q.twist = -0.22 * prende;
      br(Q, 'D', POSE.LATO, prende, 0, 0.05); br(Q, 'D', [-0.9 - 1.3 * Math.sin(arco * PI), 0.5 - 0.7 * arco, -0.8], vola); Q.hx = -0.28 * vola * Math.sin(arco * PI); Q.hy = (-0.3 + 0.6 * arco) * vola; x.bocca(0.4 * vola); const inVolo = u > 0.13 && u < 0.9; razzoR.visible = inVolo; razzo.visible = !inVolo; }],
    ['saturno', 6, 2, 'Fa girare Saturno', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); Q.twist = 0.3 * k; Q.hy = 0.36 * k; Q.hz = 0.1 * k; br(Q, 'S', POSE.LATO, k, -0.1, 0.15, 0.1 * Math.max(0, onda(s, 1.6))); if (saturnoRita) saturnoRita.rotation.y = 9 * fra(u, 0.15, 0.95); x.bocca(0.3 * k); }],
    ['partita', 6, 1, 'Una partita immaginaria', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94), o = onda(s, 0.9); due(Q, [-0.6, -0.22, -1.75], k, 0, 0, 0.05 * onda(s, 7)); Q.hz = 0.12 * o * k; Q.twist = 0.12 * o * k; Q.lean = 0.04 + 0.08 * k; x.bocca(-0.25 * k); }],
    ['lista', 6.5, 2, 'Spunta la lista', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.84, 0.94), tic = Math.pow(Math.max(0, onda(s, 0.6)), 8); Q.twist = 0.18 * k; Q.hy = 0.24 * k; Q.hx = 0.26 * k + 0.07 * tic; br(Q, 'D', [-0.5, -0.22, -1.5], k, -0.1 * tic); pennaR.visible = u > 0.1 && u < 0.9; }],
    ['ordine', 6.5, 1, 'Mette in ordine la scrivania', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.76, 0.9), lato = onda(s, 0.4); br(Q, 'D', POSE.LATO, k * Math.max(0, -lato), 0.06 * onda(s, 1.7), -0.1); br(Q, 'S', POSE.LATO, k * Math.max(0, lato), 0.06 * onda(s, 1.7), -0.1); Q.hy = 0.3 * lato * k; Q.hx = 0.2 * k; annuisci(Q, s, campana(u, 0.82, 0.86, 0.92, 0.97), 1.6, 0.05); }],
    ['cielo', 5, 1, 'Occhi al cielo', x => { const { u, Q } = x, k = campana(u, 0.06, 0.2, 0.74, 0.92), giro = fra(u, 0.12, 0.7) * 2 * PI; Q.hx = -0.22 * k * Math.sin(giro * 0.5); Q.hy = 0.25 * Math.sin(giro) * k; Q.hz = 0.1 * Math.cos(giro) * k; x.bocca(0.25 * k); }],
    ['cerchietto', 5, 1, 'Si sistema il cerchietto', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); due(Q, POSE.TESTA, k, 0.06 * onda(s, 1.5), 0.2); Q.hx = 0.12 * k; }],
    ['orbita', 6.5, 1, 'Disegna un\'orbita in aria', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94), a = s * 2 * PI * 0.45; br(Q, 'D', [-1.6 + 0.35 * Math.sin(a), 0.2 + 0.3 * Math.cos(a), -0.9], k); br(Q, 'S', POSE.MENTO, k); Q.hx = -0.24 * k; Q.hy = 0.1 * Math.cos(a) * k; }],
    ['te', 6.5, 1, 'Un sorso di tè', x => sorso(x, tazzeMano.schede)],
  ] };

  /* ================================================================ DARIO (la rete): svelto, con l'orecchio sulla rete. Il telefono non lo lascia mai */
  const telefonoD = inMano2('rete', 'D', gruppo(box(0.07, 0.14, 0.01, M(0x17181B, { roughness: 0.3 }), 0.006), at(new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.122), new THREE.MeshBasicMaterial({ color: 0x9CD7FF, toneMapped: false })), 0, 0, 0.0056)), 0, -0.03, 0.07, 0.55), dAda = versoChi('rete', posti.ai.seduta);
  ripristini.push(() => { if (telefonoDario) telefonoDario.visible = true; });
  const colTelefono = (x, quando) => { telefonoD.visible = quando; if (telefonoDario) telefonoDario.visible = !quando; };
  REPERTORI.rete = { base: 'scrive a raffiche, con un occhio alle carte', gesti: [
    ['scorre', 7, 2, 'Scorre il telefono', x => { const { u, s, Q } = x, prende = Math.max(campana(u, 0.04, 0.12, 0.14, 0.2), campana(u, 0.84, 0.9, 0.92, 0.97)), k = campana(u, 0.18, 0.28, 0.74, 0.84); br(Q, 'D', POSE.LATO, prende, 0, 0.0); br(Q, 'D', [-0.62, -0.15, -1.78], k, 0, 0, 0.04 * onda(s, 5)); Q.hx = 0.36 * k; Q.twist = -0.18 * prende; colTelefono(x, u > 0.13 && u < 0.9); }],
    ['notifica', 6.5, 2, 'Una notifica: risponde al volo', x => { const { u, s, Q } = x, occhio = campana(u, 0.04, 0.1, 0.16, 0.24), k = campana(u, 0.2, 0.3, 0.8, 0.92); Q.hy = -0.3 * occhio; br(Q, 'D', [-0.66, -0.3, -1.8], k, 0, 0, 0.05 * onda(s, 6)); br(Q, 'S', [-0.66, -0.3, -1.8], k, 0, 0, 0.05 * onda(s, 6, PI)); Q.hx = 0.32 * k; x.bocca(0.35 * k); colTelefono(x, u > 0.2 && u < 0.9); }],
    ['ada', 6.5, 2, 'Mostra il telefono ad Ada', x => { const { u, s, Q } = x, k = campana(u, 0.08, 0.24, 0.76, 0.92); Q.twist = dAda * 0.3 * k; Q.hy = dAda * 0.42 * k; br(Q, 'D', [-1.1, 0.55, -0.6], k, 0.04 * onda(s, 1.3)); parla2(x, k); x.bocca(0.3 * k); colTelefono(x, u > 0.1 && u < 0.92); }],
    ['foto', 5.5, 1, 'Fotografa lo schermo', x => { const { u, Q } = x, k = campana(u, 0.08, 0.24, 0.72, 0.9), clic = campana(u, 0.46, 0.48, 0.5, 0.54); due(Q, [-1.5, -0.06, -1.5], k); Q.hx = -0.04 * k - 0.04 * clic; Q.lean = 0.04 - 0.05 * k; x.occhi(0.45 * k); colTelefono(x, u > 0.1 && u < 0.92); }],
    ['fronte', 5.5, 1, 'Legge un commento: mano in fronte', x => { const { u, s, Q } = x, k = campana(u, 0.08, 0.22, 0.78, 0.93); br(Q, 'D', POSE.FRONTE, k); Q.hx = 0.22 * k; scuoti(Q, s, k, 0.55, 0.1); x.occhi(0.85 * k); }],
    ['pingpong', 6, 1, 'Schermo, telefono, schermo', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.16, 0.84, 0.94), su = 0.5 + 0.5 * Math.tanh(4 * onda(s, 0.9)); Q.hy = -0.42 * su * k; Q.hx = 0.24 * su * k; batti(Q, s, k, 0.07, 4); }],
    ['caffe', 6.5, 1, 'Caffè al volo', x => sorso(x, tazzeMano.rete)],
    ['router', 6, 1, 'Controlla il router', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.6, 0.72), ok = campana(u, 0.66, 0.76, 0.88, 0.96); Q.twist = 0.3 * k; Q.hy = 0.4 * k; Q.lean = 0.04 + 0.1 * k; br(Q, 'S', POSE.LATO, k, -0.25, 0.1, 0.12 * Math.max(0, onda(s, 1.8))); br(Q, 'D', [-1.3, 0.25, -1.5], ok); }],
    ['ride', 5.5, 2, 'Ride, e si copre la bocca', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.76, 0.92), f = onda(s, 5); br(Q, 'D', POSE.BOCCA, k); Q.lean = 0.04 - 0.12 * k + 0.03 * f * k; Q.hx = -0.14 * k + 0.03 * f * k; Q.h = SEDUTO.h + 0.008 * Math.abs(f) * k; x.occhi(0.7 * k); }],
  ] };

  /* ================================================================ ZENO (le fonti): calmo, preciso, all'antica. Due dita sulla tastiera, il timbro, l'orologio da taschino */
  function dueDita(t) { const P = { ...SEDUTO }, giu = campana((t % 9) / 9, 0.1, 0.2, 0.55, 0.65);   // batte con due dita, guardando un po' i tasti e un po' lo schermo
    P.sD = [SEDUTO.sD[0] - 0.05, SEDUTO.sD[1] + 0.03]; P.sS = [SEDUTO.sS[0] - 0.05, SEDUTO.sS[1] - 0.03]; P.gD = SEDUTO.gD + 0.1 * Math.max(0, Math.sin(t * 2.6)); P.gS = SEDUTO.gS + 0.1 * Math.max(0, Math.sin(t * 2.6 + PI)); P.hx = 0.1 + 0.22 * giu; P.hy = Math.sin(t * 0.4) * 0.05; return P; }
  const timbroZ = timbroDi('fonti'), orologioZ = inMano2('fonti', 'D', gruppo(cyl(0.03, 0.03, 0.008, M(0xD9A93B, { metalness: 0.7, roughness: 0.3 }), 20), at(cyl(0.025, 0.025, 0.002, bianco, 20), 0, 0.005, 0)), 0, -0.05, 0.06, 1.2);
  REPERTORI.fonti = { base: 'batte con due dita, guardando un po\' i tasti e un po\' lo schermo', gesti: [
    ['timbra', 5.5, 2, 'Timbra un documento', x => { timbra(x, timbroZ); annuisci(x.Q, x.s, campana(x.u, 0.7, 0.76, 0.88, 0.95), 1.4, 0.05); }],
    ['faldone', 7.5, 2, 'Sfoglia un faldone', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.84, 0.94), pagina = Math.pow(Math.max(0, onda(s, 0.45)), 3); br(Q, 'D', [-0.95, 0.1, -1.6], k); br(Q, 'S', [-1.0, -0.2, -1.5], k, 0, 0.5 * pagina); br(Q, 'S', POSE.BOCCA, 0.5 * campana(u, 0.1, 0.16, 0.2, 0.26)); Q.hx = 0.3 * k; if (u > 0.1 && u < 0.9) inMano(cartella, Q, 0.3); }],
    ['barba', 6, 2, 'Si liscia la barba', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); br(Q, 'D', [-0.9, -0.22, -2.2], k, 0.14 * onda(s, 0.5)); Q.hx = -0.08 * k; Q.hy = 0.14 * k; x.occhi(0.35 * k); }],
    ['momento', 5.5, 1, '«Un momento», sopra gli occhiali', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); Q.hx = 0.3 * k; Q.lean = 0.04 + 0.06 * k; br(Q, 'D', [-1.9, 0.12, -1.2], k, 0.04 * onda(s, 1.4)); parla2(x, k * 0.6); }],
    ['polvere', 6, 1, 'Soffia via la polvere', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.62, 0.74), soffia = campana(u, 0.28, 0.36, 0.5, 0.58), scaccia = campana(u, 0.68, 0.74, 0.88, 0.95); due(Q, [-1.25, 0.05, -1.4], k); Q.hx = 0.15 * k; Q.lean = 0.04 + 0.12 * soffia; x.bocca(-0.35 * soffia); br(Q, 'S', [-1.2, 0.3, -1.3], scaccia, 0, 0.25 * onda(s, 3)); if (u > 0.1 && u < 0.7) inMano(cartella, Q, 0.6); }],
    ['orologio', 6.5, 2, 'L\'orologio da taschino', x => { const { u, s, Q } = x, tasca = campana(u, 0.05, 0.14, 0.2, 0.28), guarda = campana(u, 0.24, 0.36, 0.76, 0.9); br(Q, 'D', [-0.45, -0.28, -2.1], tasca); br(Q, 'D', [-0.95, -0.12, -2.0], guarda); Q.hx = 0.3 * guarda; annuisci(Q, s, campana(u, 0.6, 0.66, 0.8, 0.88), 1.2, 0.04); orologioZ.visible = u > 0.2 && u < 0.9; }],
    ['elenco', 6.5, 1, 'Scorre l\'elenco col dito', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.18, 0.82, 0.94), giu = fra(u, 0.18, 0.8); br(Q, 'D', [-1.45 + 0.45 * giu, 0.0, -0.6 - 0.3 * giu], k); Q.hx = -0.1 + 0.3 * giu * k; Q.lean = 0.04 + 0.1 * k; parla2(x, k * 0.6); }],
    ['farfallino', 5, 1, 'Si sistema il farfallino', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.78, 0.94); due(Q, [-0.95, -0.3, -2.4], k, 0, 0.04 * onda(s, 1.5)); Q.hx = -0.13 * k; Q.lean = 0.04 - 0.04 * k; }],
    ['pisolino', 7.5, 2, 'Un pisolino di tre secondi', x => { const { u, s, Q } = x, cala = campana(u, 0.06, 0.4, 0.56, 0.6), sveglio = campana(u, 0.58, 0.62, 0.8, 0.92); Q.hx = 0.45 * cala - 0.1 * sveglio; Q.lean = 0.04 + 0.1 * cala; Q.hz = 0.1 * cala; due(Q, POSE.GREMBO, cala); x.occhi(cala); Q.hy = onda(s, 1.1) * 0.35 * campana(u, 0.62, 0.66, 0.82, 0.9); Q.h = SEDUTO.h + 0.012 * campana(u, 0.58, 0.6, 0.64, 0.7); }],
  ] };

  /* ================================================================ CLIO (la memoria): pacata, memoria di ferro. Lo schedario, la lampada verde, i fili fra le storie */
  const schedaC = inMano2('memoria', 'D', box(0.11, 0.075, 0.003, M(0xF7F1E3, { roughness: 0.9 }), 0.001), 0, -0.04, 0.08, 0.3), pennaC = pennaDi('memoria', 0x5E2F82), dMuroC = versoChi('memoria', [MURO.x, 0]);
  ripristini.push(() => { if (lampadaClio) lampadaClio.rotation.x = 0; });
  REPERTORI.memoria = { base: 'scrive con calma, e ogni tanto guarda lo schedario', gesti: [
    ['scheda', 7, 2, 'Cerca una scheda', x => { const { u, s, Q } = x, cerca = campana(u, 0.05, 0.16, 0.36, 0.44), legge2 = campana(u, 0.4, 0.5, 0.78, 0.88), rimette = campana(u, 0.84, 0.9, 0.92, 0.97); Q.twist = -0.26 * Math.max(cerca, rimette); Q.hy = -0.3 * Math.max(cerca, rimette); br(Q, 'D', POSE.LATO, Math.max(cerca, rimette), 0, 0, 0.08 * onda(s, 5) * cerca); br(Q, 'D', [-1.2, 0.1, -1.6], legge2); Q.hx = 0.2 * cerca + 0.1 * legge2; schedaC.visible = u > 0.36 && u < 0.9; }],
    ['fili', 6.5, 2, 'Collega due storie', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94), corre = fra(u, 0.25, 0.65); br(Q, 'S', [-1.3, 0.35, -1.3], k); br(Q, 'D', [-1.3, -0.2 + 0.7 * corre, -1.0], k); Q.hy = (0.2 - 0.4 * corre) * k; annuisci(Q, s, campana(u, 0.66, 0.72, 0.84, 0.92), 1.4, 0.05); x.bocca(0.3 * k); }],
    ['lampada', 5.5, 1, 'Sistema la lampada verde', x => { const { u, Q } = x, k = campana(u, 0.06, 0.22, 0.72, 0.92); Q.twist = 0.3 * k; Q.hy = 0.36 * k; br(Q, 'S', POSE.LATO, k, -0.3, 0.2); if (lampadaClio) lampadaClio.rotation.x = 0.35 * campana(u, 0.3, 0.45, 2, 3); }],
    ['zeno', 6, 2, 'Dice una cosa a Zeno', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.22, 0.78, 0.94); Q.lean = 0.04 + 0.26 * k; br(Q, 'D', [-1.0, 0.3, -2.3], k); Q.hx = -0.1 * k; parla2(x, k); }],
    ['occhiali', 6, 1, 'Pulisce gli occhiali', x => { const { u, s, Q } = x, k = campana(u, 0.06, 0.2, 0.8, 0.94); due(Q, [-1.75, -0.1, -1.6], k, 0, 0.05 * onda(s, 2.6)); Q.hx = 0.2 * k; x.occhi(0.85 * k); }],
    ['data', 6.5, 1, 'Guarda l\'ora sul muro, e la annota', x => { const { u, s, Q } = x, guarda = campana(u, 0.06, 0.2, 0.42, 0.54), scrive = campana(u, 0.5, 0.6, 0.86, 0.95); Q.hy = dMuroC * 0.45 * guarda - 0.2 * scrive; Q.twist = dMuroC * 0.25 * guarda; Q.hx = -0.15 * guarda + 0.28 * scrive; br(Q, 'D', POSE.PENNA, scrive, 0.03 * onda(s, 3.1), 0.05 * onda(s, 2.3)); pennaC.visible = u > 0.52 && u < 0.94; }],
    ['ricorda', 6, 2, 'Ci pensa… ah, sì!', x => { const { u, s, Q } = x, pensa = campana(u, 0.06, 0.2, 0.52, 0.6), si = campana(u, 0.58, 0.66, 0.84, 0.95); br(Q, 'D', POSE.BOCCA, pensa); br(Q, 'D', POSE.ALTO, si, 0.3, 0, -0.4); Q.hx = -0.22 * pensa - 0.05 * si; Q.hy = 0.2 * pensa; Q.h = SEDUTO.h + 0.008 * si; x.bocca(0.4 * si); }],
    ['capelli', 5.5, 1, 'Si raccoglie i capelli', x => { const { u, Q } = x, k = campana(u, 0.06, 0.24, 0.72, 0.94); due(Q, POSE.NUCA, k, 0, -0.12); Q.hx = -0.1 * k; Q.lean = 0.04 - 0.04 * k; }],
    ['te', 6.5, 1, 'Un sorso di tè', x => sorso(x, tazzeMano.memoria)],
  ] };

