  /* ================================================================ la giornata di ognuno, in cinque minuti che si ripetono */
  let tConsegna = 0, tRiordino = 0, tLancio = 0, tAnnaffia = 0, tRitaTorna = 1e9, tPostit = 1e9;

  // ---- Vito: gioca, va a raccontare a Rita l'ultima su GTA VI, più tardi il caffè
  const Vt = attore('gta', gioca, STATO.gta && STATO.gta.giorni > 0 ? 'Rigioca al V, aspettando il VI' : 'Gioca a GTA VI: è lavoro');
  parte(Vt, 40, 'Racconta a Rita l\'ultima su GTA VI'); cammina(Vt, pDaRita, verso(pDaRita, posti.schede.seduta));
  guardami('schede', Vt.tr.t - 1.2, Vt.tr.t + 8, pDaRita);
  fa(Vt, 8, u => { const k = campana(u, 0.04, 0.15, 0.88, 0.97), P = { ...IN_PIEDI, hx: Math.sin(u * 44) * 0.07 * k, lean: 0.06 * k }, o = Math.sin(u * 26);   // a due mani, come chi descrive una mappa
      P.sD = [-0.75 * k, (0.1 + 0.3 * o) * k - 0.1]; P.gD = -0.15 - 1.1 * k; P.sS = [-0.75 * k, (-0.1 + 0.3 * o) * k + 0.1]; P.gS = -0.15 - 1.1 * k; return P; });
  rientra(Vt); caffe(Vt, 198); alPosto(Vt, GIRO);

  // ---- Rita: scrive, stampa una pagina e se la porta alla scrivania
  const Rt = attore('schede', scriveCon(5, 23), 'Scrive Games e Scienza');
  const portaRita = P => inMano(foglioRita, P, -1.1);
  allaStampante(Rt, 70, foglioRita, 'Stampa una pagina'); rientra(Rt, portaRita); tRitaTorna = Rt.tr.t - 1.0; alPosto(Rt, GIRO);

  // ---- Ivo: segna le bozze, stampa, porta le correzioni a Ettore, riordina, annaffia la pianta
  const Iv = attore('revisore', segna, 'Segna le bozze a penna rossa');
  const portaFoglio = P => inMano(foglioMano, P, -1.1);
  allaStampante(Iv, 100, foglioMano, 'Stampa le correzioni');
  dice(Iv, 'Porta le correzioni a Ettore'); cammina(Iv, pDaEttore, verso(pDaEttore, pE.seduta), portaFoglio);
  tConsegna = Iv.tr.t;
  fa(Iv, 6, u => { const porge = campana(u, 0.12, 0.34, 0.5, 0.66), P = mix(passo(0, 0, true), { ...IN_PIEDI, sD: [-1.25, 0.15], gD: -0.25, lean: 0.12, hx: 0.12 }, porge);
    const k = fra(u, 0.6, 0.7) * (1 - fra(u, 0.92, 1)); P.hx += Math.sin(u * 46) * 0.07 * k; P.sS = [-0.5 * k, 0.07 + 0.25 * k]; P.gS = -0.12 - 1.2 * k;
    if (u < 0.48) inMano(foglioMano, P, -1.1 + 0.7 * porge); return P; });
  rientra(Iv); tRiordino = Iv.tr.t; dice(Iv, 'Riordina la scrivania');
  alPostoCon(Iv, 7, (t, u) => { const P = { ...SEDUTO, hx: 0.3, hy: -0.3, twist: -0.14 }, o = Math.sin(u * 22); P.sD = [-0.62, -0.3 + 0.2 * o]; P.sS = [-0.62, 0.05 - 0.28 * o]; P.gD = -1.25; P.gS = -1.25; return P; });
  dice(Iv, Iv.nota0);
  parte(Iv, 236, 'Annaffia la pianta'); cammina(Iv, pPianta, PI);
  const china = u => mix(IN_PIEDI, { ...IN_PIEDI, h: H0 - 0.2, lean: 0.75, aD: -0.75, kD: 1.2, aS: -0.75, kS: 1.2, sD: [-0.45, -0.1], gD: -0.2, hx: 0.2 }, u), versoCan = u => angolo(PI, PI - 0.8, campana(u, 0, 0.4, 0.6, 1));
  fa(Iv, 1.6, u => { const P = china(campana(u, 0, 0.45, 0.55, 1)); if (u > 0.5) inMano(canMano, P); return P; }, versoCan);
  tAnnaffia = Iv.tr.t;
  fa(Iv, 5.4, (u, dt) => { const k = campana(u, 0, 0.2, 0.85, 1), P = mix(passo(0, 0, true), { ...IN_PIEDI, sD: [-0.95, 0.1], gD: -0.5, lean: 0.14, hx: 0.3 }, k); inMano(canMano, P, 0.75 * k + Math.sin(dt * 3) * 0.05 * k); return P; }, PI);
  fa(Iv, 1.4, u => { const P = china(campana(u, 0, 0.45, 0.55, 1)); if (u < 0.5) inMano(canMano, P); return P; }, versoCan);
  rientra(Iv); alPosto(Iv, GIRO);

  // ---- Ettore: scrive, il caffè, butta una bozza nel cestino, riceve le correzioni, va alla lavagna
  const Et = attore('redattore', scriveCon(0), 'Scrive');
  caffe(Et, 18);
  alPosto(Et, 50); tLancio = Et.tr.t; dice(Et, 'Butta una bozza nel cestino');
  alPostoCon(Et, 3.4, (t, u) => {   // appallottola una bozza e la tira
    const stringe = campana(u, 0, 0.1, 0.36, 0.44), carica = campana(u, 0.36, 0.46, 0.5, 0.56), lancia = campana(u, 0.5, 0.58, 0.72, 0.9);
    let P = mix(Et.base(t), { ...SEDUTO, sD: [-0.9, 0.3], gD: -1.7, sS: [-0.9, -0.3], gS: -1.7, hx: 0.3 }, stringe);
    P = mix(P, { ...SEDUTO, sD: [0.35, -0.5], gD: -1.5, twist: -0.3, hy: -0.5 }, carica); P = mix(P, { ...SEDUTO, sD: [-1.5, -0.55], gD: -0.2, twist: -0.25, hy: -0.6, lean: 0.14 }, lancia);
    const da = [pE.seduta[0] + 0.35, 0.98, pE.seduta[1] - 0.2], a = [CESTINO[0], 0.3, CESTINO[1]], v = (u - 0.55) / 0.27;
    if (u > 0.08 && v < 0) { pallina.visible = true; ettore.userData.j.mD.getWorldPosition(pallina.position); }
    else if (v >= 0 && v < 1) { pallina.visible = true; pallina.position.set(da[0] + (a[0] - da[0]) * v, da[1] + (a[1] - da[1]) * v + 0.5 * Math.sin(PI * v), da[2] + (a[2] - da[2]) * v); }
    return P; });
  dice(Et, Et.nota0); alPosto(Et, tConsegna); dice(Et, 'Riceve le correzioni di Ivo');
  alPostoCon(Et, 6, (t, u) => {   // si gira verso Ivo e prende il foglio
    const gira = campana(u, 0.05, 0.22, 0.68, 0.84), prende = campana(u, 0.26, 0.42, 0.52, 0.66);
    let P = mix(Et.base(t), { ...SEDUTO, twist: -0.55, hy: -0.7, hx: -0.05 }, gira); P = mix(P, { ...P, sD: [-0.7, -1.0], gD: -0.35 }, prende); return P; });
  dice(Et, Et.nota0);
  parte(Et, 150, 'È alla lavagna'); cammina(Et, pLavagna, -PI / 2); fa(Et, 10, allaLavagna); rientra(Et); alPosto(Et, GIRO);

  // ---- Olivia: tiene d'occhio gli schermi, fa il giro delle scrivanie, va alla lavagna, il caffè
  const Ol = attore('regia', dirige, 'Tiene d\'occhio gli schermi');
  parte(Ol, 62, 'È da Ettore, guardano l\'apertura'); cammina(Ol, pOliviaEttore, verso(pOliviaEttore, pE.fuori(0, -0.2)));
  guardami('redattore', Ol.tr.t - 0.8, Ol.tr.t + 6, pOliviaEttore); fa(Ol, 6, parla());
  dice(Ol, 'È da Lea, per i grafici'); cammina(Ol, pOliviaLea, verso(pOliviaLea, posti.visualista.fuori(0, -0.2)));
  guardami('visualista', Ol.tr.t - 0.8, Ol.tr.t + 5.5, pOliviaLea); fa(Ol, 5.5, parla());
  rientra(Ol);
  parte(Ol, 185, 'È alla lavagna'); cammina(Ol, pLavagna, -PI / 2); fa(Ol, 10, allaLavagna); rientra(Ol);
  caffe(Ol, 266); alPosto(Ol, GIRO);

  // ---- Tobia: legge, il caffè, e a un certo punto va alla finestra a guardare New York
  const Tb = attore('lettura', legge, 'Legge gli articoli, uno per uno');
  caffe(Tb, 172);
  parte(Tb, 205, 'Guarda New York dalla finestra'); cammina(Tb, pFinestra, -PI / 2);
  fa(Tb, 9, u => { const stira = campana(u, 0.08, 0.2, 0.36, 0.5), fianchi = fra(u, 0.5, 0.62) * (1 - fra(u, 0.92, 1)), P = { ...IN_PIEDI, lean: -0.1 * stira, hx: -0.12 * stira - 0.04 * fianchi };   // si stiracchia, poi le mani sui fianchi
    P.sD = [-2.7 * stira, -0.25 * stira - 0.1 - 0.5 * fianchi]; P.gD = -0.15 - 0.3 * stira - 1.4 * fianchi; P.sS = [-2.7 * stira, 0.25 * stira + 0.1 + 0.5 * fianchi]; P.gS = -0.15 - 0.3 * stira - 1.4 * fianchi; return P; });
  rientra(Tb); alPosto(Tb, GIRO);

  // ---- Lea: disegna, poi va ad attaccare un post-it per Mike alla lavagna
  const Le = attore('visualista', conIlCollega(disegna, 1), 'Disegna un grafico');
  parte(Le, 90, 'Attacca un post-it per Mike alla lavagna'); cammina(Le, pBacheca, -PI / 2, P => inMano(postitMano, P, -1.2));
  tPostit = Le.tr.t + 2.3;
  fa(Le, 7, u => { const su = campana(u, 0.05, 0.25, 0.4, 0.5), guarda = fra(u, 0.52, 0.64) * (1 - fra(u, 0.92, 1)), P = mix(passo(0, 0, true), { ...IN_PIEDI, sD: [-1.95, -0.05], gD: -0.3, lean: 0.08, hx: -0.1 }, su);
    P.sD[1] -= 0.45 * guarda; P.gD -= 1.3 * guarda * (1 - su); P.sS = [0, 0.1 + 0.45 * guarda]; P.gS = -0.15 - 1.3 * guarda; P.hy = Math.sin(u * 9) * 0.12 * guarda;
    if (u < 0.33) inMano(postitMano, P, -1.2 + 1.2 * su); return P; });
  rientra(Le); alPosto(Le, GIRO);

  // ---- Ada: scrive, il caffè, e passa dalla regia a dire una cosa a Olivia
  const Ad = attore('ai', scriveCon(9, 27), 'Scrive la scheda AI');
  caffe(Ad, 150);
  parte(Ad, 240, 'Parla con Olivia, alla regia'); cammina(Ad, pVarco, verso(pVarco, REGIA));
  guardami('regia', Ad.tr.t - 1, Ad.tr.t + 8, pVarco); fa(Ad, 8, parla()); rientra(Ad); alPosto(Ad, GIRO);

  // ---- Zeno, il lunedì: alla scrivania controlla i feed; poi va all'archivio, e lascia un appunto per Mike alla lavagna
  if (persone.fonti) { const Ze = attore('fonti', scriveCon(13, 29), 'Controlla i feed, uno per uno'), pZ = [0.74, suLavagna(1250, 0)[1]];
    parte(Ze, 24, 'È all\'archivio delle fonti'); cammina(Ze, pArchivio, -PI / 2); fa(Ze, 12, (u, dt, t) => sfoglia(t));
    dice(Ze, 'Lascia un appunto per Mike alla lavagna'); cammina(Ze, pZ, -PI / 2, P => inMano(cartella, P));
    fa(Ze, 6, u => { const su = campana(u, 0.1, 0.3, 0.6, 0.75), P = mix(passo(0, 0, true), { ...IN_PIEDI, sS: [-1.8, 0.05], gS: -0.35, hx: -0.08 }, su); inMano(cartella, P); return P; });
    rientra(Ze, P => inMano(cartella, P)); alPosto(Ze, GIRO); }

  // ---- Nora: al telefono con le fonti; a un certo punto va da Tobia a chiedere da dove viene una notizia
  const No = attore('verifica', telefona, 'Verifica una fonte, al telefono');
  parte(No, 34, 'Chiede a Tobia da dove viene una notizia'); cammina(No, pDaTobia, verso(pDaTobia, posti.lettura.seduta));
  guardami('lettura', No.tr.t - 1, No.tr.t + 7, pDaTobia); fa(No, 7, parla()); rientra(No); alPosto(No, GIRO);

  // ---- Bruno: sceglie e ritocca le foto, si confronta con Lea, e ogni tanto va a guardare il muro da vicino
  const Br = attore('foto', conIlCollega(t => legge(t + 13), -1), 'Sceglie e ritocca le foto');
  parte(Br, 118, 'Guarda il muro delle notizie'); cammina(Br, pMuro, PI);
  fa(Br, 9, u => { const k = campana(u, 0.08, 0.22, 0.86, 0.97), P = { ...IN_PIEDI, hx: -0.24 * k, hy: Math.sin(u * 7) * 0.28 * k };   // le mani sui fianchi, il naso all'insù
    P.sD = [0, -0.1 - 0.5 * k]; P.gD = -0.15 - 1.4 * k; P.sS = [0, 0.1 + 0.5 * k]; P.gS = -0.15 - 1.4 * k; return P; });
  rientra(Br); alPosto(Br, GIRO);

  // ---- Dario: scorre le discussioni; il caffè
  const Da = attore('rete', scriveCon(4, 13), 'Scorre le discussioni in rete');
  caffe(Da, 84); alPosto(Da, GIRO);

  // ---- Clio: aggiorna i fili delle storie; va a cercare una vecchia puntata nello schedario
  const Cl = attore('memoria', scriveCon(21, 17), 'Aggiorna i fili delle storie');
  parte(Cl, 212, 'Cerca una vecchia puntata in archivio'); cammina(Cl, pArchivio, -PI / 2); fa(Cl, 10, (u, dt, t) => sfoglia(t)); rientra(Cl); alPosto(Cl, GIRO);

