  /* ================================================================ le altre teste: sette pettinature e due barbe */
  const viaIlViso = (d, x, y, z) => scava(d, uovo(x, y, z, 0, -0.085, 0.13, 0.152, 0.17, 0.135), 0.025);
  const viaLeOrecchie = (d, ax, y, z) => scava(d, uovo(ax, y, z, 0.2, -0.045, 0.0, 0.055, 0.075, 0.07), 0.02);
  const viaLaNuca = (d, x, y, z) => scava(d, uovo(x, y, z, 0, -0.2, -0.06, 0.22, 0.105, 0.22), 0.03);
  const CIUFFI = [[0, 0.215, 0.03, 0.05], [0.07, 0.2, 0.07, 0.045], [-0.08, 0.2, 0.05, 0.048], [0.11, 0.17, -0.03, 0.045], [-0.12, 0.16, -0.02, 0.046], [0.03, 0.2, -0.08, 0.05], [-0.05, 0.19, -0.1, 0.045],
    [0, 0.165, 0.15, 0.04], [0.09, 0.145, 0.13, 0.036], [-0.09, 0.155, 0.12, 0.04], [0, 0.13, -0.17, 0.045], [0.13, 0.1, -0.12, 0.04], [-0.13, 0.1, -0.12, 0.04]];
  const RICCI = []; for (let i = 0; i < 54; i++) { const yy = 1 - 2 * (i + 0.5) / 54, r = Math.sqrt(1 - yy * yy), fi = i * 2.39996;
    const p = [Math.cos(fi) * r * 0.225, 0.065 + yy * 0.21, -0.025 + Math.sin(fi) * r * 0.215]; if (!(p[2] > 0.1 && p[1] < 0.11) && p[1] > -0.14) RICCI.push(p); }
  Object.assign(CHIOME, {
    caschetto(x, y, z) {   // Olivia: il caschetto alla mandibola, con la riga di lato e il ciuffo sulla fronte
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.03, -0.015, 0.2, 0.19, 0.195);
      d = fondi(d, uovo(ax, y, z, 0.13, -0.07, -0.02, 0.085, 0.125, 0.13), 0.05);
      d = fondi(d, uovo(x, y, z, 0, -0.06, -0.09, 0.17, 0.135, 0.11), 0.05);
      d = fondi(d, uovo(x, y, z, -0.075, 0.125, 0.115, 0.11, 0.07, 0.075), 0.04);
      d = scava(d, uovo(x, y, z, 0.02, -0.1, 0.15, 0.125, 0.185, 0.13), 0.03);
      d = scava(d, y + 0.178, 0.02);
      d = scava(d, tubo(x, y, z, 0.065, 0.226, -0.1, 0.065, 0.214, 0.13, 0.007), 0.012);
      for (let i = 0; i < 5; i++) { const zz = -0.13 + i * 0.045; d = scava(d, tubo(ax, y, z, 0.205, 0.07, zz, 0.218, -0.16, zz + 0.012, 0.0058), 0.01); }
      return d; },
    frangia(x, y, z) {   // Lea: il caschetto corto e nero, con la frangia dritta
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.03, -0.015, 0.198, 0.19, 0.195);
      d = fondi(d, uovo(ax, y, z, 0.135, -0.05, -0.01, 0.075, 0.11, 0.13), 0.05);
      d = fondi(d, uovo(x, y, z, 0, -0.05, -0.09, 0.165, 0.12, 0.11), 0.05);
      d = scava(d, uovo(x, y, z, 0, -0.115, 0.15, 0.122, 0.175, 0.13), 0.025);
      d = fondi(d, uovo(x, y, z, 0, 0.108, 0.125, 0.135, 0.048, 0.06), 0.025);
      d = scava(d, y + 0.135, 0.018);
      for (let i = -3; i <= 3; i++) d = scava(d, tubo(x, y, z, i * 0.036, 0.165, 0.15, i * 0.038, 0.058, 0.19, 0.005), 0.009);
      return d; },
    spettinato(x, y, z) {   // Tobia: corti, e ognuno per conto suo
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.035, -0.012, 0.188, 0.182, 0.186); if (d > 0.11) return d;
      for (const [cx, cy, cz, r] of CIUFFI) d = fondi(d, uovo(x, y, z, cx, cy, cz, r * 0.8, r * 1.3, r * 0.8), 0.022);
      return viaLaNuca(viaLeOrecchie(viaIlViso(d, x, y, z), ax, y, z), x, y, z); },
    ricci: { centro: [0, 0.05, 0], mezzo: 0.31, f(x, y, z) {   // Ada: una nuvola di ricci
      let d = uovo(x, y, z, 0, 0.06, -0.025, 0.215, 0.2, 0.205); if (d > 0.1) return d;
      for (const [cx, cy, cz] of RICCI) d = fondi(d, Math.hypot(x - cx, y - cy, z - cz) - 0.052, 0.022);
      d = scava(d, uovo(x, y, z, 0, -0.1, 0.16, 0.13, 0.2, 0.14), 0.03);
      return scava(d, uovo(x, y, z, 0, -0.24, -0.03, 0.26, 0.13, 0.26), 0.04); } },
    lunghi: { centro: [0, -0.1, -0.02], mezzo: 0.36, f(x, y, z) {   // Rita: lunghi sulla schiena, con la riga in mezzo
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.03, -0.015, 0.196, 0.188, 0.193);
      d = fondi(d, uovo(ax, y, z, 0.15, -0.09, -0.04, 0.06, 0.16, 0.1), 0.05);
      d = fondi(d, uovo(x, y, z, 0, -0.2, -0.118, 0.172, 0.25, 0.085), 0.06);
      d = scava(d, uovo(x, y, z, 0, -0.1, 0.16, 0.128, 0.2, 0.135), 0.03);
      d = scava(d, tubo(x, y, z, 0, 0.228, -0.12, 0, 0.2, 0.16, 0.007), 0.012);
      for (const xx of [0.035, 0.085, 0.13]) { const zb = -0.118 - 0.085 * Math.sqrt(1 - (xx / 0.172) ** 2); d = scava(d, tubo(ax, y, z, xx, 0.0, zb - 0.004, xx * 0.92, -0.42, zb + 0.02, 0.006), 0.011); }
      return d; } },
    corti(x, y, z) {   // Vito: rasati ai lati, un ciuffo corto davanti
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.035, -0.012, 0.183, 0.177, 0.181);
      d = fondi(d, uovo(x, y, z, 0, 0.172, 0.085, 0.1, 0.045, 0.075), 0.035);
      d = viaIlViso(d, x, y, z);
      d = scava(d, uovo(ax, y, z, 0.2, -0.035, 0.0, 0.052, 0.1, 0.1), 0.02);
      d = scava(d, uovo(x, y, z, 0, -0.18, -0.06, 0.22, 0.115, 0.22), 0.03);
      for (let i = -2; i <= 2; i++) d = scava(d, tubo(x, y, z, i * 0.034, 0.215, 0.02, i * 0.036, 0.2, 0.16, 0.005), 0.009);
      return d; },
    pelato(x, y, z) {   // Zeno: una corona bianca intorno, e in cima niente
      const ax = Math.abs(x);
      let d = uovo(x, y, z, 0, 0.03, -0.015, 0.187, 0.178, 0.186);
      d = fondi(d, uovo(ax, y, z, 0.165, 0.0, -0.04, 0.04, 0.07, 0.1), 0.03);
      d = scava(d, uovo(x, y, z, 0, 0.15, 0.03, 0.17, 0.14, 0.19), 0.03);
      return viaLaNuca(viaLeOrecchie(viaIlViso(d, x, y, z), ax, y, z), x, y, z); },
  });
  // la barba: la testa gonfiata di poco, tenuta solo intorno alla mandibola, con la bocca libera
  const barbe = {};
  function barbaGeo(tipo) {
    if (barbe[tipo]) return barbe[tipo];
    const spessa = tipo === 'lunga' ? 0.02 : 0.0075;
    return barbe[tipo] = scolpisci((x, y, z) => { const ax = Math.abs(x);
      let zona = fondi(uovo(x, y, z, 0, -0.118, 0.04, 0.185, 0.088, 0.165), tubo(ax, y, z, 0.15, -0.1, 0.03, 0.166, -0.012, 0.004, 0.034), 0.03);
      let d = -fondi(-(cranio(x, y, z) - spessa), -zona, 0.02);
      if (tipo === 'lunga') d = fondi(d, uovo(x, y, z, 0, -0.165, 0.1, 0.075, 0.06, 0.06), 0.04);
      return scava(d, uovo(x, y, z, 0, -0.057, 0.165, 0.046, 0.02, 0.04), 0.012); }, [0, -0.1, 0.02], 0.24);
  }

