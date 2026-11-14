  /* ================================================================ gli altri vestiti, e gli accessori */
  const telaRighe = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');   // la maglia a righe di Rita
    x.fillStyle = '#F7F1E3'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#7B4BE0'; x.fillRect(0, 0, 64, 26); x.fillStyle = '#7CC6F2'; x.fillRect(0, 40, 64, 8); return c; })();
  const stoffa = c => M(c, { roughness: 0.88 });
  Object.assign(VESTITI, {
    giacca: { busto: vestito((x, w, h, a) => { x.fillStyle = '#1F2A44'; x.fillRect(0, 0, w, h);                                   // Olivia: il blazer blu
        x.fillStyle = '#F7F1E3'; a.scollo(0.3, 0.12, 0.92);
        x.strokeStyle = '#2E3D63'; a.bordoScollo(0.3, 0.12, 0.92, 28); x.strokeStyle = '#141C30'; a.bordoScollo(0.3, 0.12, 0.92, 4);
        x.fillStyle = '#141C30'; a.davanti(0, 0.008, 0.04, 0.3); x.fillStyle = '#C9A24A'; a.bottone(0.22, 9);
        x.strokeStyle = '#141C30'; x.lineWidth = 4; for (const cx of [0.15, 0.85]) { x.beginPath(); x.moveTo(cx * w - 30, a.quota(0.2)); x.lineTo(cx * w + 30, a.quota(0.2)); x.stroke(); } }),
      manica: stoffa(0x1F2A44), polsino: 0x141C30, colletto: 0xF7F1E3 },
    denim: { busto: vestito((x, w, h, a) => { x.fillStyle = '#4E77A8'; x.fillRect(0, 0, w, h);                                    // Tobia: la giacca di jeans aperta
        x.fillStyle = '#FFFFFF'; a.davanti(0, 0.05, 0, 0.56); a.scollo(0.52, 0.1, 0.92);
        x.strokeStyle = '#3B5F8C'; a.bordoScollo(0.52, 0.1, 0.92, 24);
        x.fillStyle = '#3B5F8C'; a.davanti(0.05, 0.062, 0, 0.56); a.davanti(0, 0.5, 0, 0.06);
        x.strokeStyle = '#E8C36A'; x.lineWidth = 2.5; x.setLineDash([7, 6]);
        for (const cx of [0.072, 0.928]) { x.beginPath(); x.moveTo(cx * w, a.quota(0.06)); x.lineTo(cx * w, a.quota(0.56)); x.stroke(); }
        for (const cx of [0.16, 0.84]) x.strokeRect(cx * w - 28, a.quota(0.42), 56, 46); x.setLineDash([]);
        x.fillStyle = '#C98A4B'; for (const cx of [0.16, 0.84]) { x.beginPath(); x.arc(cx * w, a.quota(0.4), 5, 0, 7); x.fill(); } }),
      manica: stoffa(0x4E77A8), polsino: 0x3B5F8C, colletto: 0x3B5F8C },
    dolcevita: { colloAlto: true, busto: vestito((x, w, h) => { x.fillStyle = '#1C1D22'; x.fillRect(0, 0, w, h);                  // Lea: il dolcevita nero, a coste
        x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < w; i += 12) x.fillRect(i, 0, 4, h); }),
      manica: stoffa(0x1C1D22), polsino: 0x101114, colletto: 0x1C1D22 },
    maglione: { busto: vestito((x, w, h, a) => { x.fillStyle = '#F2B705'; x.fillRect(0, 0, w, h);                                 // Ada: il maglione giallo, con il colletto bianco
        x.fillStyle = 'rgba(150,100,0,.2)'; for (let i = 0; i < w; i += 26) x.fillRect(i, 0, 5, h);
        x.fillStyle = '#D99A00'; a.davanti(0, 0.5, 0, 0.08);
        x.fillStyle = '#FFFFFF'; a.scollo(0.78, 0.075, 0.92); x.strokeStyle = '#D99A00'; a.bordoScollo(0.78, 0.075, 0.92, 12); }),
      manica: stoffa(0xF2B705), polsino: 0xD99A00, colletto: 0xFFFFFF },
    righe: { busto: vestito((x, w, h) => { x.fillStyle = x.createPattern(telaRighe, 'repeat'); x.fillRect(0, 0, w, h); }),            // Rita: le righe viola e azzurre
      manica: new THREE.MeshStandardMaterial({ map: mappa(telaRighe, 1, 3), roughness: 0.9 }), polsino: 0x7B4BE0, colletto: 0x7B4BE0 },
    bomber: { busto: vestito((x, w, h, a) => { x.fillStyle = '#FF5DA2'; x.fillRect(0, 0, w, h);                                   // Vito: il bomber rosa e turchese
        x.fillStyle = '#3FE0D0'; a.davanti(0, 0.5, 0, 0.1); x.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < w; i += 14) x.fillRect(i, a.quota(0.1), 5, 0.1 * h);
        x.fillStyle = '#FFFFFF'; a.scollo(0.7, 0.07, 0.92); x.strokeStyle = '#3FE0D0'; a.bordoScollo(0.7, 0.07, 0.92, 16);
        x.fillStyle = '#B83C74'; a.davanti(0, 0.008, 0.1, 0.7);
        x.fillStyle = '#FFE066'; x.beginPath(); x.arc(0.86 * w, a.quota(0.52), 20, 0, 7); x.fill(); x.fillStyle = '#FF5DA2'; for (let i = 0; i < 3; i++) x.fillRect(0.86 * w - 22, a.quota(0.52) + 2 + i * 7, 44, 3); }),
      manica: stoffa(0xFF5DA2), polsino: 0x3FE0D0, colletto: 0x3FE0D0 },
    gilet: { busto: vestito((x, w, h, a) => { x.fillStyle = '#2F7A4C'; x.fillRect(0, 0, w, h);                                    // Zeno: il gilet verde sulla camicia
        x.fillStyle = '#F3EBDD'; a.scollo(0.5, 0.11, 0.92); x.strokeStyle = '#24603B'; a.bordoScollo(0.5, 0.11, 0.92, 10);
        x.fillStyle = '#24603B'; a.davanti(0, 0.01, 0.05, 0.5); x.fillStyle = '#E8C36A'; [0.14, 0.26, 0.38].forEach(v => a.bottone(v, 7));
        x.strokeStyle = '#24603B'; x.lineWidth = 4; for (const cx of [0.15, 0.85]) { x.beginPath(); x.moveTo(cx * w - 26, a.quota(0.24)); x.lineTo(cx * w + 26, a.quota(0.24)); x.stroke(); } }),
      manica: stoffa(0xF3EBDD), polsino: 0xE2D8C4, colletto: 0xF3EBDD },
  });
  Object.assign(VESTITI, {
    blazer: { busto: vestito((x, w, h, a) => { x.fillStyle = '#0F6B5C'; x.fillRect(0, 0, w, h);                                   // Nora: il blazer verde petrolio
        x.fillStyle = '#FDF6E8'; a.scollo(0.3, 0.12, 0.92);
        x.strokeStyle = '#17836F'; a.bordoScollo(0.3, 0.12, 0.92, 28); x.strokeStyle = '#0A4A40'; a.bordoScollo(0.3, 0.12, 0.92, 4);
        x.fillStyle = '#0A4A40'; a.davanti(0, 0.008, 0.04, 0.3); x.fillStyle = '#E8C36A'; a.bottone(0.22, 9);
        x.strokeStyle = '#0A4A40'; x.lineWidth = 4; for (const cx of [0.15, 0.85]) { x.beginPath(); x.moveTo(cx * w - 30, a.quota(0.2)); x.lineTo(cx * w + 30, a.quota(0.2)); x.stroke(); } }),
      manica: stoffa(0x0F6B5C), polsino: 0x0A4A40, colletto: 0xFDF6E8 },
    felpa: { busto: vestito((x, w, h, a) => { x.fillStyle = '#3DA35D'; x.fillRect(0, 0, w, h);                                    // Dario: la felpa verde
        x.fillStyle = 'rgba(0,60,20,.14)'; for (let i = 0; i < w; i += 24) x.fillRect(i, 0, 4, h);
        x.fillStyle = '#2E8049'; a.davanti(0, 0.5, 0, 0.08);
        x.fillStyle = '#F4F1EA'; a.scollo(0.76, 0.078, 0.92); x.strokeStyle = '#2E8049'; a.bordoScollo(0.76, 0.078, 0.92, 20);
        x.strokeStyle = '#F4F1EA'; x.lineWidth = 5; x.lineCap = 'round'; for (const cx of [0.022, 0.978]) { x.beginPath(); x.moveTo(cx * w, a.quota(0.1)); x.lineTo(cx * w, a.quota(0.27)); x.stroke(); } }),
      manica: stoffa(0x3DA35D), polsino: 0x2E8049, colletto: 0x2E8049 },
    multitasche: { busto: vestito((x, w, h, a) => { x.fillStyle = '#B59A6A'; x.fillRect(0, 0, w, h);                              // Bruno: il gilet da fotografo, sulla maglietta nera
        x.fillStyle = '#26272C'; a.scollo(0.5, 0.11, 0.92); x.strokeStyle = '#8F7848'; a.bordoScollo(0.5, 0.11, 0.92, 10);
        x.fillStyle = '#8F7848'; a.davanti(0, 0.01, 0.05, 0.5);
        x.strokeStyle = '#8F7848'; x.lineWidth = 4; for (const cx of [0.15, 0.85]) { x.strokeRect(cx * w - 30, a.quota(0.18), 60, 40); x.strokeRect(cx * w - 34, a.quota(0.4), 68, 52); } }),
      manica: stoffa(0x26272C), polsino: 0x17181B, colletto: 0x26272C },
    golf: { busto: vestito((x, w, h, a) => { x.fillStyle = '#7A3FA6'; x.fillRect(0, 0, w, h);                                     // Clio: il cardigan viola
        x.fillStyle = '#F7EEDC'; a.scollo(0.44, 0.115, 0.9);
        x.strokeStyle = '#5E2F82'; a.bordoScollo(0.44, 0.115, 0.9, 16);
        x.fillStyle = '#5E2F82'; a.davanti(0, 0.03, 0.06, 0.44); a.davanti(0, 0.5, 0.14, 0.19);
        x.fillStyle = '#F3DDB5'; [0.22, 0.31, 0.4].forEach(v => a.bottone(v, 8)); }),
      manica: stoffa(0x7A3FA6), polsino: 0x5E2F82, colletto: 0xF7EEDC },
  });
  // gli accessori: si attaccano alla testa o al busto di chi li porta
  const oro = M(0xD9A93B, { metalness: 0.7, roughness: 0.3 });
  const orecchini = ({ testa }) => { for (const l of [-1, 1]) testa.add(at(sph(0.013, oro, 12, 8), l * 0.178, -0.068, -0.004)); };
  const spilla = ({ busto }) => { busto.add(at(sph(0.016, M(0xF5C518, { roughness: 0.35 }), 12, 8), -0.075, 0.335, 0.112)); };
  function cuffie({ testa }) {   // le cuffie di Vito: l'archetto e i due padiglioni. Stanno in un gruppo, perché lui le sposta: un padiglione scostato, o tutte giù intorno al collo
    const c = gruppo(), pad = {}, arco = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.218, 0.011, 8, 36, PI), M(0x202125, { roughness: 0.5 }))); arco.position.set(0, 0.0, -0.006); c.add(arco);
    for (const l of [-1, 1]) { const p = gruppo(cyl(0.06, 0.06, 0.04, M(0x3FE0D0, { roughness: 0.45 }), 24), at(cyl(0.05, 0.05, 0.012, M(0x202125, { roughness: 0.8 }), 24), 0, l * 0.024, 0), at(cyl(0.028, 0.028, 0.008, M(0xFF5DA2, { roughness: 0.4 }), 18), 0, -l * 0.022, 0));
      p.rotation.z = PI / 2; c.add(at(p, l * 0.205, -0.012, -0.006)); pad[l] = p; }
    testa.add(c); testa.userData.cuffie = { g: c, pad };
  }
  const cerchietto = ({ testa }) => { const c = ombra(new THREE.Mesh(new THREE.TorusGeometry(0.202, 0.009, 8, 36, PI), M(0x7CC6F2, { roughness: 0.5 }))); c.position.set(0, 0.012, 0.04); c.rotation.x = -0.18; testa.add(c); };
  const farfallino = ({ busto }) => { const r = M(0xE01F3D, { roughness: 0.7 }); busto.add(at(gruppo(at(ell(0.024, 1.3, 0.85, 0.5, r), -0.027, 0, 0), at(ell(0.024, 1.3, 0.85, 0.5, r), 0.027, 0, 0), sph(0.011, r, 10, 8)), 0, 0.425, 0.088)); };
  // la macchina fotografica di Bruno, al collo
  function macchinaFoto({ busto }) { const corpo = M(0x1B1C20, { roughness: 0.5 }), cinghia = M(0xF5C518, { roughness: 0.8 });
    const lente = cyl(0.03, 0.03, 0.05, M(0x2E3036, { roughness: 0.3 }), 18); lente.rotation.x = PI / 2; const vetro = cyl(0.021, 0.021, 0.006, M(0x7CC6F2, { roughness: 0.1 }), 18); vetro.rotation.x = PI / 2;
    const g = gruppo(box(0.115, 0.072, 0.046, corpo, 0.01), at(lente, 0, -0.004, 0.044), at(vetro, 0, -0.004, 0.071), at(box(0.034, 0.016, 0.03, M(0xD5D7DB, { roughness: 0.4 }), 0.004), 0.03, 0.042, 0));
    busto.add(asta([-0.062, 0.432, 0.052], [-0.05, 0.3, 0.135], 0.005, cinghia), asta([0.062, 0.432, 0.052], [0.05, 0.3, 0.135], 0.005, cinghia), at(g, 0, 0.262, 0.15)); }

