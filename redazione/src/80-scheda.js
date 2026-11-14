  /* ================================================================ etichette, benvenuto, scheda */
  const strato = document.getElementById('etichette'), tags = {};
  const el = (tag, cls, testo) => { const e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; };
  // dove sta l'etichetta di chi non è una persona in scena: la bacheca, e Zeno quando non è lunedì
  const ancore = { bacheca: new THREE.Vector3(0.12, BACHECA[1] + altaB / 2 + 0.1, BACHECA[2]), fonti: new THREE.Vector3(0.12, 2.2, ARCHIVIO[1]) };
  function etichetta(id, nome, sotto, colore) {
    const b = el('button', 'tag'); b.type = 'button'; const pallino = el('b'); pallino.style.background = colore;
    const piu = el('span', 'piu'); piu.append(document.createTextNode(sotto), el('em', null, 'Guarda ▸'));
    b.nomeNodo = document.createTextNode(nome); b.append(pallino, b.nomeNodo, piu); b.setAttribute('aria-label', `${nome}, ${sotto}: apri la scheda`);
    b.addEventListener('click', () => apri(id)); strato.append(b); tags[id] = b;
  }
  for (const a of STATO.agenti) etichetta(a.id, a.nome, persone[a.id] ? a.mestiere : 'torna lunedì', TINTA[a.id] || C.orange);
  if (POSTIT.length) etichetta('bacheca', POSTIT.length + ' post-it', 'per te', C.yellow);
  const v3 = new THREE.Vector3();
  const dove = id => { if (persone[id]) { persone[id].userData.j.testa.getWorldPosition(v3); v3.y += 0.32; } else v3.copy(ancore[id]); return v3; };
  function etichette() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const id in tags) { dove(id).project(cam); tags[id].style.transform = `translate(-50%,-100%) translate(${((v3.x + 1) / 2 * w).toFixed(1)}px,${((1 - v3.y) / 2 * h).toFixed(1)}px)`; }
  }

  // il benvenuto: cosa è successo stamattina, e chi ha qualcosa da dirti
  (() => { const box = document.getElementById('saluto'), h = oraDiRoma(), ciao = h >= 5 && h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), uscita = oraCorta(USCITA), min = STATO.corsa.minuti;
    const uscita2 = min != null ? `è uscita alle ${uscita}, in ${min} minuti` : `è uscita alle ${uscita}`;
    box.append(el('strong', null, ciao + ' Mike. '), document.createTextNode(STATO.giorno === oggi ? `L'edizione di oggi ${uscita2}. ` : `L'ultima edizione che vedo, quella di ${GIORNI_LUNGHI[OGGI.getDay()]} ${DATA_LUNGA}, ${uscita2}. `));
    const chi = STATO.agenti.filter(a => a.ti_aspetta); if (!chi.length) return;
    box.append(document.createTextNode(chi.length > 1 ? 'Ti aspettano ' : 'Ti aspetta '));
    chi.forEach((a, i) => { const b = el('button', null, a.nome); b.type = 'button'; b.addEventListener('click', () => apri(a.id)); box.append(b, document.createTextNode(i < chi.length - 2 ? ', ' : i === chi.length - 2 ? ' e ' : '')); });
    if (POSTIT.length) { const b = el('button', null, POSTIT.length + ' post-it in bacheca'); b.type = 'button'; b.addEventListener('click', () => apri('bacheca')); box.append(document.createTextNode(': '), b); }
    box.append(document.createTextNode('.')); box.hidden = false; })();

  const pannello = document.getElementById('pannello'); let aperto = null, rigaAdesso = null;
  /* il primo piano: una seconda camera, vera, puntata su chi hai aperto. Si vede quello che fa, da vicino. */
  const telaRitratto = el('canvas', 'ritratto'); telaRitratto.setAttribute('aria-hidden', 'true');
  const cam2 = new THREE.PerspectiveCamera(27, 1.6, 0.15, 40), FONDI = { alba: new THREE.Color(0xF3DCC8), giorno: new THREE.Color(0xE9E3D9), sera: new THREE.Color(0x2F3050), notte: new THREE.Color(0x161829) };
  let rend2 = null, env2 = null;
  function primoPiano() {
    const g = persone[aperto]; if (!g) return;
    if (!rend2) { rend2 = new THREE.WebGLRenderer({ canvas: telaRitratto, antialias: true }); rend2.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); rend2.setSize(320, 200, false);
      rend2.toneMapping = THREE.NeutralToneMapping; rend2.shadowMap.enabled = true; rend2.shadowMap.type = THREE.PCFShadowMap; env2 = new THREE.PMREMGenerator(rend2).fromScene(new RoomEnvironment(), 0.04).texture; }
    g.userData.j.testa.getWorldPosition(v3);
    const j = g.userData.j, yaw = g.rotation.y + j.busto.rotation.y + j.testa.rotation.y * 0.7; let dx = 0.8 * Math.sin(yaw) + 0.42, dz = 0.8 * Math.cos(yaw) + 0.42; const n = Math.hypot(dx, dz) || 1;
    const lontano = 1.5; let cx2 = v3.x + dx / n * lontano, cz2 = v3.z + dz / n * lontano;
    if (cx2 < 0.4 || cz2 < 0.4) {   // ha il viso contro una parete: lo si guarda di profilo, dal lato aperto della stanza
      const fx2 = Math.sin(yaw), fz2 = Math.cos(yaw); let px = fz2, pz = -fx2; if (px + pz < 0) { px = -px; pz = -pz; }
      cx2 = v3.x + px * lontano + fx2 * 0.4; cz2 = v3.z + pz * lontano + fz2 * 0.4; }
    cam2.position.set(Math.max(0.4, cx2), v3.y + 0.36, Math.max(0.4, cz2)); cam2.lookAt(v3.x, v3.y - 0.08, v3.z);   // un po' dall'alto: sopra gli schermi
    const e = scene.environment, b = scene.background; scene.environment = env2; scene.background = FONDI[document.documentElement.dataset.luce] || FONDI.giorno;
    rend2.render(scene, cam2); scene.environment = e; scene.background = b;
  }
  const blocco = (titolo, ...figli) => { const b = el('div', 'blocco'); b.append(el('h3', null, titolo), ...figli); return b; };
  const elenco = (voci, colore) => { const ul = el('ul', 'titoli'); voci.forEach(t => { const li = el('li'), i = el('i'); if (colore) i.style.background = colore; li.append(i, el('span', null, t)); ul.append(li); }); return ul; };
  const daQuanto = p => p.giorni ? (p.giorni === 1 ? 'da ieri' : 'da ' + p.giorni + ' giorni') : 'di oggi';
  function biglietto(p, conNome) { const d = el('div', 'postit'); d.style.borderLeftColor = COLORE_POSTIT[p.da] || '#FF9DB0';
    d.append(el('strong', null, brevePostit(p.titolo)), el('span', null, p.testo || ''), el('small', null, (conNome && AGENTI[p.da] ? AGENTI[p.da].nome + ' · ' : '') + daQuanto(p)), rispostaAlPostit(p)); return d; }
  const TITOLO_LAVORO = { lettura: 'Le notizie su cui ha letto di più', redattore: 'Le prime tre, e «Il punto»', visualista: 'I grafici di oggi', ai: 'Nella scheda AI di oggi', schede: 'In Games e Scienza, oggi', gta: 'Su GTA VI, oggi' };
  function apri(id, pre) {
    aperto = id; rigaAdesso = null; pannello.textContent = ''; pannello.classList.remove('conversa'); ascolto.vivo = false; vistaParla = null; vistaRegistro = null; vistaDecisioniAgente = null;
    const x = el('button', 'chiudi', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Chiudi la scheda'); x.addEventListener('click', chiudi);
    const testa = el('div', 'testa'), chi = el('div'), a = AGENTI[id];
    if (id === 'decisioni') {
      const av = el('div', 'avatar', String(decisioni.length)); av.style.background = VERDE;
      chi.append(el('h2', null, 'Il registro'), el('p', null, 'le decisioni che hai preso con la redazione')); testa.append(av, chi, x); pannello.append(testa);
      montaRegistro(pre);
    } else if (id === 'bacheca') {
      const av = el('div', 'avatar', String(POSTIT.length)); av.style.background = C.yellow; av.style.color = C.ink;
      chi.append(el('h2', null, 'La bacheca'), el('p', null, 'quello che la redazione ha lasciato per te')); testa.append(av, chi, x); pannello.append(testa);
      POSTIT.forEach(p => pannello.append(biglietto(p, true)));
      pannello.append(el('p', 'piede', 'Sono le cose rimaste aperte nei file della corsa: richieste di grafici, note sulle fonti, scadenze. Rispondi parlando con chi le ha lasciate: quello che decidi va nel registro.'));
    } else {
      const av = el('div', 'avatar', a.nome[0]); av.style.background = TINTA[id] || C.orange;
      chi.append(el('h2', null, a.nome), el('p', null, a.mestiere + (a.modello ? ' · ' + a.modello : ''))); testa.append(av, chi, x);
      if (persone[id]) pannello.append(telaRitratto); pannello.append(testa);
      const corpo = el('div', 'corpo'); pannello.append(corpo);
      const riga = el('p', 'adesso'); rigaAdesso = el('span'); riga.append(el('i'), rigaAdesso); corpo.append(blocco('In questo momento', riga));
      if (a.minuti != null) {
        const numeri = el('div', 'numeri'), numero = (n, cosa) => { const d = el('div'); d.append(el('strong', null, String(n)), el('span', null, cosa)); numeri.append(d); };
        if (id === 'revisore' && STATO.revisione.fatta) numero(STATO.revisione.riscritti, 'testi riscritti');
        if (id === 'redattore' || id === 'regia') numero(STATO.lavagna.length, 'notizie');
        numero(a.minuti + ' min', 'di lavoro'); numero(oraCorta(a.entrata) + '–' + oraCorta(a.uscita), 'stamattina');
        corpo.append(blocco('Per l\'edizione delle ' + oraCorta(USCITA), numeri, el('p', null, a.consegna ? 'Ha consegnato: ' + a.consegna + '.' : a.ruolo)));
      } else corpo.append(blocco('Il suo lavoro', el('p', null, a.consegna ? a.consegna[0].toUpperCase() + a.consegna.slice(1) + '.' : a.ruolo)));
      if (id === 'regia') corpo.append(blocco('La scaletta: le prime cinque', elenco(STATO.lavagna.slice(0, 5).map(n => n.reparto + ' · ' + n.titolo))));
      else if (id === 'revisore' && TITOLI.length) { const b = blocco('Sulla scrivania: i titoli corretti'); TITOLI.slice(0, 4).forEach(c => { const d = el('div', 'cambio'); d.append(el('del', null, c.prima), el('ins', null, c.dopo)); b.append(d); });
        const altri = STATO.revisione.riscritti - Math.min(4, TITOLI.length); if (altri > 0) b.append(el('p', 'piccolo', `E altri ${altri} testi, fra descrizioni, approfondimenti e «Il punto».`)); corpo.append(b); }
      else if ((a.dettagli || []).length && TITOLO_LAVORO[id]) corpo.append(blocco(TITOLO_LAVORO[id], elenco(a.dettagli.slice(0, 6), TINTA[id])));
      const suoi = (STATO.postit || []).filter(p => p.da === id);
      if (suoi.length) { const b = blocco(persone[id] ? 'Ha qualcosa per te' : 'Ti ha lasciato questi appunti'); suoi.slice(0, 5).forEach(p => b.append(biglietto(p))); corpo.append(b); }
      corpo.append(bloccoDecisioni(id));
      corpo.append(el('p', 'piede', persone[id] ? 'In alto il primo piano, dal vivo. I gesti in scena sono una giornata tipo; i numeri e i testi sono quelli veri di stamattina.'
        : 'Zeno lavora il lunedì, quando controlla le fonti: quel giorno lo trovi davanti agli schedari.'));
      montaParla(id, corpo, testa);
    }
    pannello.hidden = false; pannello.scrollTop = 0; x.focus({ preventScroll: true }); segui(); primoPiano();
  }
  function segui() {   // la camera resta su chi hai aperto, anche mentre cammina
    if (!aperto) return; const g = persone[aperto]; if (g) v3.set(g.position.x, 0.85, g.position.z); else v3.copy(ancore[aperto]).setY(1.2);
    const [a, b] = sulPiano(v3), z = g ? 3.1 : 2.4, larga = canvas.clientWidth > 760 ? pannello.offsetWidth : 0; meta.x = a + (larga / 2) / (ppu * z); meta.y = b; meta.zoom = z;
    if (rigaAdesso) rigaAdesso.textContent = scenaDi(aperto);
  }
  function lascia() { if (!aperto) return null; const t = tags[aperto]; aperto = null; rigaAdesso = null; pannello.hidden = true; pannello.classList.remove('conversa'); ascolto.vivo = false; vistaParla = null; vistaRegistro = null; vistaDecisioniAgente = null; return t; }   // chiude la scheda, la camera resta dov'è
  function chiudi() { const t = lascia(); if (!t) return; Object.assign(meta, CASA); t.focus({ preventScroll: true }); }
  addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });

