  /* ================================================================ il muro delle notizie: le tele
     La mappa del mondo a puntini (i continenti sono poligoni approssimati: basta riconoscerli), con i luoghi da cui
     scrivono le testate di oggi e i punti dove nascono le notizie in apertura; la borsa; le fonti; la striscia
     dell'ultim'ora; le discussioni. I dati sono in STATO.mappa, .borsa, .discussioni (redazione/muro.py). */
  const TERRE = [
    [[-168,66],[-162,70],[-141,70],[-125,70],[-110,68],[-95,69],[-88,68],[-82,70],[-78,73],[-70,70],[-62,66],[-64,60],[-57,53],[-53,47],[-60,46],[-66,44],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,29],[-85,30],[-90,29],[-94,29],[-97,26],[-97,21],[-94,18],[-91,19],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-80,8],[-84,10],[-88,13],[-94,16],[-100,17],[-105,20],[-106,23],[-110,23],[-112,28],[-115,31],[-117,33],[-121,35],[-124,40],[-124,47],[-128,51],[-134,57],[-140,60],[-148,60],[-153,58],[-160,56],[-165,54],[-158,58],[-162,60],[-166,62]],
    [[-52,60],[-44,60],[-40,65],[-22,70],[-20,76],[-28,82],[-45,83],[-62,82],[-72,78],[-60,76],[-54,70]],
    [[-79,9],[-75,11],[-71,12],[-64,11],[-60,8],[-52,5],[-50,0],[-44,-2],[-37,-5],[-35,-9],[-39,-15],[-40,-21],[-45,-24],[-48,-27],[-52,-33],[-57,-36],[-62,-39],[-65,-42],[-66,-47],[-69,-52],[-72,-54],[-75,-51],[-74,-44],[-73,-38],[-71,-30],[-70,-20],[-73,-16],[-77,-12],[-81,-6],[-80,-2],[-78,2],[-77,7]],
    [[-9,37],[-9,43],[-2,43],[-1,46],[-5,48],[-2,49],[2,51],[5,53],[8,54],[8,57],[10,57],[12,54],[14,54],[19,54],[21,57],[24,58],[28,60],[23,60],[21,62],[25,65],[22,66],[17,62],[18,60],[16,56],[13,56],[11,59],[6,58],[5,61],[8,64],[14,68],[20,70],[28,71],[31,70],[40,67],[44,66],[42,64],[36,64],[38,66],[47,67],[54,68],[60,69],[68,68],[73,71],[80,73],[90,75],[104,77],[112,74],[125,73],[135,71],[142,72],[152,71],[160,70],[170,69],[178,68],[180,66],[178,64],[172,62],[165,60],[163,57],[162,53],[157,51],[156,57],[152,59],[143,59],[140,54],[137,54],[140,49],[136,44],[131,43],[129,40],[127,39],[129,36],[126,34],[126,37],[124,40],[121,40],[118,39],[122,37],[119,35],[121,32],[122,29],[119,25],[116,23],[111,21],[108,22],[106,20],[108,16],[109,12],[106,9],[104,9],[100,13],[99,10],[103,3],[101,3],[98,8],[98,14],[97,17],[94,16],[94,19],[91,22],[88,22],[86,20],[82,16],[80,13],[79,9],[77,8],[75,12],[73,16],[72,21],[69,22],[67,25],[62,25],[57,26],[56,24],[58,23],[59,22],[55,17],[52,16],[45,13],[43,13],[41,17],[39,21],[35,28],[34,31],[36,36],[32,36],[27,37],[26,40],[29,41],[35,42],[40,41],[41,43],[37,45],[33,45],[30,46],[28,43],[26,41],[23,40],[24,38],[21,37],[19,40],[19,42],[14,45],[12,44],[16,41],[18,40],[16,38],[15,40],[12,42],[10,44],[8,44],[4,43],[3,42],[0,40],[0,38],[-2,37],[-5,36]],
    [[-5,50],[1,51],[2,53],[-1,55],[-2,58],[-5,58],[-6,56],[-3,54],[-5,52]], [[-10,52],[-6,52],[-6,55],[-8,55],[-10,54]], [[-24,64],[-18,63],[-14,65],[-16,66],[-22,66]],
    [[-17,15],[-17,21],[-13,27],[-10,30],[-6,35],[-1,35],[10,37],[11,33],[20,32],[25,32],[32,31],[34,28],[36,23],[38,18],[43,12],[51,12],[49,6],[44,1],[40,-4],[39,-10],[40,-16],[35,-20],[35,-24],[32,-28],[27,-34],[20,-35],[18,-32],[15,-25],[12,-17],[13,-10],[12,-5],[9,-1],[9,4],[5,6],[1,6],[-4,5],[-8,4],[-12,7],[-15,11]],
    [[44,-25],[47,-25],[50,-16],[49,-12],[45,-16],[43,-22]],
    [[114,-22],[117,-20],[122,-17],[126,-14],[130,-12],[133,-12],[136,-12],[136,-15],[140,-17],[142,-11],[145,-15],[146,-19],[150,-23],[153,-26],[153,-31],[150,-37],[146,-39],[141,-38],[138,-35],[135,-34],[131,-32],[126,-32],[122,-34],[117,-35],[115,-33],[114,-27]],
    [[173,-35],[178,-38],[176,-41],[172,-44],[167,-46],[170,-43],[173,-41]],
    [[130,31],[132,34],[135,34],[137,35],[140,35],[141,38],[142,40],[141,42],[143,42],[145,44],[142,45],[140,43],[140,40],[139,38],[136,36],[132,35],[130,33]],
    [[95,5],[98,4],[104,-2],[106,-6],[104,-6],[100,-2]], [[109,1],[113,3],[117,7],[119,5],[118,1],[116,-4],[111,-3]], [[106,-6],[111,-7],[115,-8],[114,-9],[106,-8]],
    [[131,-1],[135,-3],[141,-3],[146,-6],[150,-10],[143,-9],[138,-8],[133,-4]], [[120,18],[122,18],[124,13],[126,8],[124,6],[122,10],[120,14]], [[80,6],[82,7],[80,10]],
  ];
  const ACQUE = [[[-94,59],[-88,64],[-80,63],[-78,55],[-82,52],[-88,56]], [[47,37],[50,45],[53,46],[54,38],[51,37]]];   // la baia di Hudson e il Caspio
  const dentro = (p, lon, lat) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c; } return c; };
  const terra = (lon, lat) => TERRE.some(p => dentro(p, lon, lat)) && !ACQUE.some(p => dentro(p, lon, lat));

  const MAPPA = STATO.mappa || { luoghi: [], calde: [], senza_luogo: 0 };
  const MW = 1380, MH = 857, GRADO = MW / 360, MAPPA_SU = 80, LAT0 = 80;
  const suMappa = (lon, lat) => [(lon + 180) * GRADO, MAPPA_SU + (LAT0 - lat) * GRADO];
  const raggioDi = l => 6 + Math.sqrt(l.articoli) * 1.35;
  const caldePer = {}; (MAPPA.calde || []).forEach(c => { (caldePer[c.luogo] = caldePer[c.luogo] || []).push(c.rank); });
  const SCRITTA = { 'Regno Unito': [-14, -20, 'right'], 'New York': [20, 22, 'left'], 'Silicon Valley': [-16, 30, 'right'], 'Milano': [18, 28, 'left'], 'Tokyo': [-14, -14, 'right'] };
  const NERO_MURO = '#0C1220', GRIGIO_MURO = '#8D97AB';
  const texMappa = tela(MW, MH, (x, w, h) => {
    x.fillStyle = NERO_MURO; x.fillRect(0, 0, w, h);
    x.fillStyle = C.yellow; x.font = `800 33px ${DISPLAY}`; spazia(x, 0.1, 33); x.fillText('DA DOVE ARRIVANO LE NOTIZIE', 28, 52); spazia(x, 0, 1);
    const tele = (STATO.macchine || {}).telescrivente || {};
    x.fillStyle = GRIGIO_MURO; x.font = `500 21px ${SISTEMA}`; x.textAlign = 'right'; x.fillText(`${tele.articoli != null ? tele.articoli + ' articoli nelle ultime ' + Math.round(tele.finestra_ore || 26) + ' ore · ' : ''}le sedi delle testate`, w - 28, 48); x.textAlign = 'left';
    for (let lat = 78; lat >= -56; lat -= 2.4) for (let lon = -170; lon <= 179; lon += 2.4) if (terra(lon, lat)) { const [a, b] = suMappa(lon, lat); x.fillStyle = '#4F6C99'; x.beginPath(); x.arc(a, b, 3.1, 0, 7); x.fill(); }
    (MAPPA.luoghi || []).slice().reverse().forEach(l => { const [a, b] = suMappa(l.lon, l.lat), r = raggioDi(l);
      x.fillStyle = 'rgba(245,197,24,.2)'; x.beginPath(); x.arc(a, b, r * 1.7, 0, 7); x.fill(); x.fillStyle = C.yellow; x.beginPath(); x.arc(a, b, Math.max(4, r * 0.5), 0, 7); x.fill(); });
    (MAPPA.luoghi || []).slice(0, 4).forEach(l => { const [a, b] = suMappa(l.lon, l.lat), s = SCRITTA[l.luogo] || [16, -10, 'left'];
      x.textAlign = s[2]; x.fillStyle = '#FFFFFF'; x.font = `700 21px ${SISTEMA}`; x.fillText(l.luogo, a + s[0], b + s[1]);
      x.fillStyle = C.yellow; x.font = `600 17px ${SISTEMA}`; x.fillText(l.articoli + ' articoli · ' + l.testate + ' testate', a + s[0], b + s[1] + 21); x.textAlign = 'left'; });
    Object.entries(caldePer).forEach(([luogo, ranghi]) => { const c = MAPPA.calde.find(q => q.luogo === luogo), [a, b] = suMappa(c.lon, c.lat), t = ranghi.join('·'); x.font = `800 19px ${SISTEMA}`;
      const l = Math.max(30, x.measureText(t).width + 18); x.fillStyle = C.red; rr(x, a + 10, b - 40, l, 28, 14); x.fill(); x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.fillText(t, a + 10 + l / 2, b - 20); x.textAlign = 'left'; });
    const yl = 646; x.font = `500 19px ${SISTEMA}`;
    x.fillStyle = C.yellow; x.beginPath(); x.arc(38, yl - 6, 8, 0, 7); x.fill(); x.fillStyle = GRIGIO_MURO; x.fillText('una testata che scrive: più grande, più articoli oggi', 56, yl);
    x.fillStyle = C.red; rr(x, 560, yl - 20, 30, 26, 13); x.fill(); x.fillStyle = '#FFFFFF'; x.font = `800 17px ${SISTEMA}`; x.fillText('1', 570, yl - 1); x.fillStyle = GRIGIO_MURO; x.font = `500 19px ${SISTEMA}`; x.fillText('dove nasce una notizia in apertura', 600, yl);
    if (MAPPA.senza_luogo) { x.textAlign = 'right'; x.fillText(MAPPA.senza_luogo + ' articoli da raccolte senza una sede', w - 28, yl); x.textAlign = 'left'; }
    // sotto la mappa: le notizie in apertura, ognuna col posto da cui viene
    x.fillStyle = '#232B3B'; x.fillRect(28, 668, w - 56, 2);
    x.fillStyle = GRIGIO_MURO; x.font = `800 22px ${DISPLAY}`; spazia(x, 0.1, 22); x.fillText('IN APERTURA, DA DOVE VIENE', 28, 706); spazia(x, 0, 1);
    const calde = (MAPPA.calde || []).slice(0, 6), meta = (w - 56) / 2;
    if (!calde.length) { x.font = `500 21px ${SISTEMA}`; x.fillText('oggi nessuna notizia in apertura ha un luogo riconosciuto', 28, 750); }
    calde.forEach((c, i) => { const a = 28 + (i % 2) * meta, b = 750 + Math.floor(i / 2) * 40;
      x.fillStyle = C.red; rr(x, a, b - 22, 30, 28, 14); x.fill(); x.fillStyle = '#FFFFFF'; x.font = `800 18px ${SISTEMA}`; x.textAlign = 'center'; x.fillText(String(c.rank), a + 15, b - 2); x.textAlign = 'left';
      x.fillStyle = C.yellow; x.font = `700 21px ${SISTEMA}`; const l = x.measureText(c.luogo).width; x.fillText(c.luogo, a + 42, b);
      x.fillStyle = '#F1EEE8'; x.font = `500 21px ${SISTEMA}`; x.fillText(unaRiga(x, c.titolo || '', meta - 42 - l - 40), a + 54 + l, b); });
  });

  // Apple in borsa: la chiusura, la variazione, le ultime sedute a barrette (verde se è salita sulla seduta prima)
  const BORSA = STATO.borsa;
  const texBorsa = tela(505, 362, (x, w, h) => {
    x.fillStyle = NERO_MURO; x.fillRect(0, 0, w, h); x.fillStyle = GRIGIO_MURO; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.1, 24); x.fillText('APPLE IN BORSA', 22, 40); spazia(x, 0, 1);
    if (!BORSA) { x.font = `500 20px ${SISTEMA}`; x.fillText('nessun dato oggi', 22, 90); return; }
    const su = (BORSA.variazione || 0) >= 0, col = su ? '#35C759' : C.red;
    x.fillStyle = '#FFFFFF'; x.font = `800 74px ${DISPLAY}`; x.fillText(String(BORSA.chiusura).replace('.', ','), 20, 116);
    x.fillStyle = col; x.beginPath(); if (su) { x.moveTo(26, 156); x.lineTo(50, 156); x.lineTo(38, 136); } else { x.moveTo(26, 136); x.lineTo(50, 136); x.lineTo(38, 156); } x.fill();
    x.font = `800 30px ${DISPLAY}`; x.fillText((su ? '+' : '') + String(BORSA.variazione).replace('.', ',') + '%', 60, 158);
    x.fillStyle = GRIGIO_MURO; x.font = `600 19px ${SISTEMA}`; x.fillText((BORSA.simbolo || 'AAPL') + ' · chiusura del ' + giornoDi(BORSA.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), 180, 156);
    const s = BORSA.serie || []; if (s.length > 1) { const lo = Math.min(...s), hi = Math.max(...s), passo = (w - 44) / s.length, Y = v => h - 24 - (v - lo) / Math.max(0.01, hi - lo) * (h - 228);
      s.forEach((v, i) => { const prima = i ? s[i - 1] : v, a = 24 + i * passo, y0 = Y(prima), y1 = Y(v); x.fillStyle = v >= prima ? '#35C759' : C.red; x.fillRect(a + passo * 0.2, Math.min(y0, y1) - 3, passo * 0.6, Math.abs(y1 - y0) + 6); }); }
  });
  // le fonti: un quadratino per feed, rosso se oggi non ha risposto
  const texFonti = tela(505, 362, (x, w, h) => {
    const f = (STATO.macchine || {}).feed; x.fillStyle = NERO_MURO; x.fillRect(0, 0, w, h); x.fillStyle = GRIGIO_MURO; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.1, 24); x.fillText('LE FONTI', 22, 40); spazia(x, 0, 1);
    if (!f) return; x.fillStyle = '#FFFFFF'; x.font = `800 74px ${DISPLAY}`; x.fillText(f.ok + '/' + f.totale, 20, 116);
    x.fillStyle = GRIGIO_MURO; x.font = `600 19px ${SISTEMA}`; x.fillText('rispondono stamattina', 22, 148);
    const per = 18, lato = (w - 44) / per; for (let i = 0; i < f.totale; i++) { x.fillStyle = i < f.ok ? '#35C759' : C.red; rr(x, 22 + (i % per) * lato, 172 + Math.floor(i / per) * lato, lato - 5, lato - 5, 3); x.fill(); }
  });

  // la striscia dell'ultim'ora: i titoli di oggi su un nastro, che poi scorre
  const nastro = (() => { const H = 96, c = document.createElement('canvas'); let x = c.getContext('2d'); const font = `800 50px ${DISPLAY}`; x.font = font; spazia(x, 0.03, 50);
    const pezzi = []; let W = 0; for (const n of STATO.lavagna) { const t = n.titolo.toUpperCase(), l = x.measureText(t).width + 96; if (W + l > 7900 && pezzi.length) break; pezzi.push([t, l]); W += l; }
    c.width = Math.max(1200, Math.ceil(W)); c.height = H; x = c.getContext('2d'); x.fillStyle = '#101116'; x.fillRect(0, 0, c.width, H); x.font = font; spazia(x, 0.03, 50); let a = 0;
    for (const [t, l] of pezzi) { x.fillStyle = C.red; x.beginPath(); x.arc(a + 40, H / 2, 10, 0, 7); x.fill(); x.fillStyle = '#F8F6F2'; x.fillText(t, a + 72, 66); a += l; }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return { tex: t, larga: c.width, alta: H }; })();
  const texUltimora = tela(360, 96, (x, w, h) => { x.fillStyle = C.yellow; x.fillRect(0, 0, w, h); x.fillStyle = C.red; x.beginPath(); x.arc(40, h / 2, 12, 0, 7); x.fill();
    x.fillStyle = C.ink; x.font = `800 52px ${DISPLAY}`; spazia(x, 0.04, 52); x.fillText('ULTIM\'ORA', 66, 67); spazia(x, 0, 1); });

  // le discussioni: una colonna in piedi, come il rullo di un'agenzia
  const rullo = (() => { const W = 390, voci = STATO.discussioni || [];
    const disegna = (x, vero) => { let y = 0; if (vero) { x.fillStyle = NERO_MURO; x.fillRect(0, 0, W, 4000); }
      for (const v of voci) { const reddit = /reddit/i.test(v.dove || ''), sigla = reddit ? 'r/' : /hacker/i.test(v.dove || '') ? 'Y' : '#';
        if (vero) { x.fillStyle = reddit ? '#FF5700' : '#FF8A1F'; x.beginPath(); x.arc(40, y + 44, 20, 0, 7); x.fill(); x.fillStyle = '#FFFFFF'; x.font = `800 20px ${SISTEMA}`; x.textAlign = 'center'; x.fillText(sigla, 40, y + 51); x.textAlign = 'left';
          x.fillStyle = GRIGIO_MURO; x.font = `600 18px ${SISTEMA}`; x.fillText((v.dove || '').replace(/^Reddit /, ''), 72, y + 40); if (v.nuovo) { x.fillStyle = C.red; rr(x, 72, y + 48, 62, 22, 11); x.fill(); x.fillStyle = '#FFFFFF'; x.font = `800 13px ${SISTEMA}`; x.fillText('NUOVO', 82, y + 64); } }
        x.font = `600 22px ${SISTEMA}`; const righe = aCapo(x, v.titolo, W - 48, 5); if (vero) { x.fillStyle = '#F1EEE8'; righe.forEach((r, i) => x.fillText(r, 24, y + 106 + i * 28)); }
        y += 106 + righe.length * 28 + 6; if (vero) { x.fillStyle = '#232B3B'; x.fillRect(24, y, W - 48, 2); } y += 20; }
      return y; };
    const prova = document.createElement('canvas').getContext('2d'), alta = Math.max(240, disegna(prova, false)), c = document.createElement('canvas'); c.width = W; c.height = alta; disegna(c.getContext('2d'), true);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return { tex: t, alta, scorre: alta > 240 && voci.length > 1 }; })();
  const texDiscussioni = tela(390, 60, (x, w, h) => { x.fillStyle = '#161D2C'; x.fillRect(0, 0, w, h); x.fillStyle = GRIGIO_MURO; x.font = `800 24px ${DISPLAY}`; spazia(x, 0.1, 24); x.fillText('SE NE DISCUTE', 22, 39); spazia(x, 0, 1); });
  const texCitta = nome => tela(220, 64, (x, w, h) => { x.fillStyle = NERO_MURO; x.fillRect(0, 0, w, h); x.fillStyle = '#F1EEE8'; x.font = `800 30px ${DISPLAY}`; spazia(x, 0.1, 30); x.textAlign = 'center'; x.fillText(nome.toUpperCase(), w / 2, 42); spazia(x, 0, 1); x.textAlign = 'left'; });
  // il marchio, in alto a sinistra sul muro
  const texLogoMuro = tela(505, 250, (x, w, h) => { x.fillStyle = NERO_MURO; x.fillRect(0, 0, w, h);
    const m = marchio(document.createElement('canvas').getContext('2d'), 0, 0, 100), S = Math.min((w - 76) / m.w, (h - 80) / m.h) * 100, x0 = (w - m.w * S / 100) / 2, y0 = (h - m.h * S / 100) / 2 + 14;
    [[C.red, 0], [C.yellow, 1], [C.blue, 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(x0 + 8 + i * 22, y0 - 14, 7, 0, 7); x.fill(); });
    marchio(x, x0, y0, S, '#F8F6F2'); });

