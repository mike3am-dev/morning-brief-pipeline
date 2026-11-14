  /* ================================================================ la vita: una giornata in piccolo, che si ripete
     Tutto dipende dall'orologio: riaprendo la pagina nello stesso secondo si vede la stessa scena. */
  const V = 0.9, PASSO = 1.0, GIRO = 300;
  const angolo = (a, b, u) => a + ((((b - a) % (2 * PI)) + 3 * PI) % (2 * PI) - PI) * u;
  const verso = (da, a) => Math.atan2(a[0] - da[0], a[1] - da[1]);
  function percorso(punti) { const seg = []; let L = 0;
    for (let i = 1; i < punti.length; i++) { const l = Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1]); if (l < 0.02) continue; seg.push({ a: punti[i - 1], b: punti[i], l, da: L }); L += l; }
    if (!seg.length) seg.push({ a: punti[0], b: punti[0], l: 0, da: 0 });
    return { seg, L }; }
  function lungo(p, d) { d = Math.max(0, Math.min(p.L, d)); let s = p.seg[p.seg.length - 1]; for (const q of p.seg) if (d <= q.da + q.l) { s = q; break; }
    const u = s.l ? (d - s.da) / s.l : 0; return [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u]; }
  class Traccia {
    constructor() { this.s = []; this.t = 0; }
    poi(dur, fn) { this.s.push({ t0: this.t, t1: this.t + dur, fn }); this.t += dur; return this; }
    fino(T, fn) { return T > this.t + 0.01 ? this.poi(T - this.t, fn) : this; }
    a(t) { for (const s of this.s) if (t < s.t1) return s.fn((t - s.t0) / (s.t1 - s.t0), t - s.t0, t, s.t1 - t); const s = this.s[this.s.length - 1]; return s.fn(1, s.t1 - s.t0, t, 0); }
  }

  /* La mappa della stanza: una griglia di caselle da dieci centimetri, chiuse dove c'è un mobile.
     Le strade fra un posto e l'altro si trovano da sole (A*), girando intorno a scrivanie e sedie. */
  const CELLA = 0.1, NX = Math.ceil(LARGA / CELLA), NZ = Math.ceil(FONDA / CELLA), muri = new Uint8Array(NX * NZ);
  const casella = (x, z) => Math.max(0, Math.min(NZ - 1, Math.floor(z / CELLA))) * NX + Math.max(0, Math.min(NX - 1, Math.floor(x / CELLA)));
  const centroDi = k => [((k % NX) + 0.5) * CELLA, (Math.floor(k / NX) + 0.5) * CELLA];
  function chiudiDove(dentro) { for (let k = 0; k < NX * NZ; k++) { const [x, z] = centroDi(k); if (dentro(x, z)) muri[k] = 1; } }
  const rett = (x0, z0, x1, z1, m = 0.2) => chiudiDove((x, z) => x > Math.min(x0, x1) - m && x < Math.max(x0, x1) + m && z > Math.min(z0, z1) - m && z < Math.max(z0, z1) + m);
  const tondo = (cx, cz, r, m = 0.2) => chiudiDove((x, z) => Math.hypot(x - cx, z - cz) < r + m);
  chiudiDove((x, z) => x < 0.2 || z < 0.2 || x > LARGA - 0.15 || z > FONDA - 0.15);
  rett(fx - 1.3, 0, fx + 1.3, 0.53); rett(STAMPANTE[0] - 0.5, 0, STAMPANTE[0] + 0.5, 0.6); rett(0, 7.3, 0.58, 8.35); rett(0, zSc0, 0.02 + PROF_SC, zSc1, 0.12);
  PIANTE.forEach(([x, z, r]) => tondo(x, z, r)); tondo(1.26, 0.36, 0.16); tondo(CESTINO[0], CESTINO[1], 0.14, 0.15); PILE.forEach(([x, z]) => tondo(x, z, 0.17, 0.12));
  INGOMBRI.forEach(([x, z, r]) => tondo(x, z, r, 0.12)); tondo(MIKE[0], MIKE[1], TAVOLO_R, 0.18); SGABELLI.forEach(([x, z]) => tondo(x, z, 0.2, 0.12)); tondo(SEDIA_MIKE[0], SEDIA_MIKE[1], 0.27, 0.12);
  for (const p of Object.values(posti)) { if (p.inPiedi) continue; const a = p.fuori(-p.w / 2, -p.d / 2), b = p.fuori(p.w / 2, p.d / 2); rett(a[0], a[1], b[0], b[1]);
    const c = p.fuori(-0.26, p.zs - 0.25), e = p.fuori(0.26, p.zs + 0.67); rett(c[0], c[1], e[0], e[1]); }
  chiudiDove((x, z) => { const dx = x - REGIA[0], dz = z - REGIA[1], r = Math.hypot(dx, dz); if (r < R_IN - 0.14 || r > R_OUT + 0.2) return false;
    return Math.abs(angolo(PI / 4, Math.atan2(dx, dz), 1) - PI / 4) > VARCO - 0.14; });
  function libera(p, meta) {   // la casella libera più vicina a un punto (un posto a sedere sta sempre dentro un mobile)
    let meglio = -1, quanto = 1e9; const i0 = Math.floor(p[0] / CELLA), j0 = Math.floor(p[1] / CELLA);
    for (let j = Math.max(0, j0 - 9); j <= Math.min(NZ - 1, j0 + 9); j++) for (let i = Math.max(0, i0 - 9); i <= Math.min(NX - 1, i0 + 9); i++) { const k = j * NX + i; if (muri[k]) continue;
      const [x, z] = centroDi(k), q = Math.hypot(x - p[0], z - p[1]) + (meta ? 0.22 * Math.hypot(x - meta[0], z - meta[1]) : 0); if (q < quanto) { quanto = q; meglio = k; } }
    return meglio; }
  function vede(a, b) { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(l / 0.04); for (let i = 0; i <= n; i++) { const u = n ? i / n : 0; if (muri[casella(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)]) return false; } return true; }
  function strada(da, a) {
    const s = libera(da, a), e = libera(a, da); if (s < 0 || e < 0) return [da, a];
    const g = new Float32Array(NX * NZ).fill(1e9), f = new Float32Array(NX * NZ), da_ = new Int32Array(NX * NZ).fill(-1), chiuse = new Uint8Array(NX * NZ), aperte = [s], [ex, ez] = centroDi(e); g[s] = 0;
    const stima = k => { const [x, z] = centroDi(k); return Math.hypot(x - ex, z - ez); };
    while (aperte.length) { let m = 0; for (let i = 1; i < aperte.length; i++) if (f[aperte[i]] < f[aperte[m]]) m = i;
      const k = aperte.splice(m, 1)[0]; if (k === e) break; if (chiuse[k]) continue; chiuse[k] = 1; const i = k % NX, j = Math.floor(k / NX);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
        const n = nj * NX + ni; if (muri[n] || chiuse[n] || (di && dj && (muri[j * NX + ni] || muri[nj * NX + i]))) continue;
        const c = g[k] + (di && dj ? 1.4142 : 1) * CELLA; if (c < g[n]) { g[n] = c; f[n] = c + stima(n); da_[n] = k; aperte.push(n); } } }
    if (e !== s && da_[e] < 0) return [da, a];
    const celle = []; for (let k = e; k >= 0; k = da_[k]) { celle.push(centroDi(k)); if (k === s) break; } celle.reverse();
    const punti = [da]; let i = 0; while (i < celle.length - 1) { let j = celle.length - 1; while (j > i + 1 && !vede(celle[i], celle[j])) j--; if (i === 0) punti.push(celle[0]); punti.push(celle[j]); i = j; }   // si tengono solo le svolte
    if (celle.length === 1) punti.push(celle[0]);
    punti.push(a); return punti;
  }

