  /* ================================================================ mattoni */
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o });
  const ombra = (m, getta = true) => { m.castShadow = getta; m.receiveShadow = true; return m; };
  const box = (w, h, d, mat, r = 0.02) =>
    ombra(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), mat));
  const cyl = (rt, rb, h, mat, seg = 28) => ombra(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat));
  const sph = (r, mat, w = 24, hh = 18) => ombra(new THREE.Mesh(new THREE.SphereGeometry(r, w, hh), mat));
  const ell = (r, sx, sy, sz, mat) => { const m = sph(r, mat); m.scale.set(sx, sy, sz); return m; };
  const caps = (r, l, mat) => ombra(new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 18), mat));
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const gruppo = (...figli) => { const g = new THREE.Group(); figli.forEach(f => f && g.add(f)); return g; };
  const dolce = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const fra = (u, a, b) => dolce((u - a) / (b - a));                       // 0 prima di a, 1 dopo b
  const campana = (u, a, b, c, d) => fra(u, a, b) * (1 - fra(u, c, d));   // sale fra a e b, scende fra c e d

  function tela(w, h, disegna) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    disegna(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  const schermo = (w, h, tex) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const stampa = (w, h, tex) => ombra(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })), false);

  function aCapo(x, testo, maxW, maxRighe = 9) {
    const parole = testo.split(' '), righe = []; let r = '';
    for (const p of parole) { const prova = r ? r + ' ' + p : p; if (x.measureText(prova).width > maxW && r) { righe.push(r); r = p; } else r = prova; }
    if (r) righe.push(r);
    if (righe.length > maxRighe) { righe.length = maxRighe; righe[maxRighe - 1] = righe[maxRighe - 1].replace(/\s+\S*$/, '') + '…'; }
    return righe;
  }
  function spazia(x, em, px) { try { x.letterSpacing = (em * px) + 'px'; } catch (e) { /* non c'è: pazienza */ } }
  const rr = (x, a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); };
  function casuale(seme) { let k = seme; return () => (k = (k * 16807) % 2147483647) / 2147483647; }

  /* Il marchio, ricalcato sulla testata dell'app: THE e BRIEF grandi metà di MORNING,
     la O è il sole, davanti la falce azzurra dell'orizzonte. */
  function falce(x, ax, ay, aw, ah) {
    const g = x.createLinearGradient(ax, 0, ax + aw, 0);
    g.addColorStop(0, '#1A5FAF'); g.addColorStop(0.48, '#7CC6F2'); g.addColorStop(1, '#1A5FAF');
    const X = u => ax + aw * u / 100, Y = v => ay + ah * v / 14;
    x.fillStyle = g; x.beginPath(); x.moveTo(X(0), Y(13.6)); x.quadraticCurveTo(X(48), Y(-5), X(100), Y(13.6));
    x.quadraticCurveTo(X(48), Y(4.2), X(0), Y(13.6)); x.fill();
  }
  function marchio(x, x0, y0, S, inchiostro = C.ink) {
    const s = S * 0.47; x.save(); x.textBaseline = 'alphabetic'; x.fillStyle = inchiostro;
    x.font = `900 ${s}px ${SISTEMA}`; spazia(x, -0.01, s);
    const yThe = y0 + s * 0.73; x.fillText('THE', x0, yThe);
    const y = yThe + S * 0.80;
    x.font = `900 ${S}px ${SISTEMA}`; spazia(x, -0.035, S);
    const wM = x.measureText('M').width; x.fillText('M', x0, y);
    const d = S * 0.92, cx = x0 + wM + S * 0.01 + d / 2, cy = y - S * 0.33;
    x.fillStyle = C.yellow; x.beginPath(); x.arc(cx, cy, d / 2, 0, PI * 2); x.fill();
    x.fillStyle = inchiostro; const xr = x0 + wM + S * 0.03 + d; x.fillText('RNING', xr, y);
    const W = xr + x.measureText('RNING').width - x0;
    falce(x, x0 - W * 0.03, y - S * 0.12, W * 0.72, S * 0.30);
    x.fillStyle = inchiostro; x.font = `900 ${s}px ${SISTEMA}`; spazia(x, -0.01, s);
    const yBrief = y + S * 0.21 + s * 0.73; x.fillText('BRIEF', x0, yBrief);
    x.restore(); return { w: W, h: yBrief - y0 };
  }
  function sole(x, cx, cy, r) {   // il sole con la falce: la versione piccola, per le tazze
    x.fillStyle = C.yellow; x.beginPath(); x.arc(cx, cy, r, 0, PI * 2); x.fill();
    falce(x, cx - r * 1.5, cy + r * 0.05, r * 3, r * 1.0);
  }

