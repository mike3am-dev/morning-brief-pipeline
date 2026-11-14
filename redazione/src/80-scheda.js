  /* ================================================================ etichette, benvenuto, scheda */
  const strato = document.getElementById('etichette'), tags = {};
  const el = (tag, cls, testo) => { const e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; };
  /* Le etichette non stanno sempre accese: un nome compare quando ci passi sopra col mouse, quando quella persona cambia
     cosa sta facendo (per un paio di secondi), quando ha qualcosa per te, e mentre la sua scheda è aperta. */
  // dove sta l'etichetta di quello che non è una persona: i post-it sulla lavagna (e, più giù, il registro e la prima pagina)
  const ancore = { bacheca: new THREE.Vector3(0.12, suLav + 0.06, bacheca.position.z) };
  // le icone di stato: piccole, a tratto, una per cosa che si può stare facendo
  const ICONE = { scrive: 'M3 13l1-3 7-7 2 2-7 7-3 1z', legge: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l4 4', corregge: 'M3 8l3 3 7-7', disegna: 'M3 13V8M8 13V4M13 13V6', regia: 'M2 4h12v7H2zM6 14h4M8 11v3',
    gioca: 'M4 6h8a3 3 0 0 1 0 6c-1 0-1.5-1-2.3-1H6.3c-.8 0-1.3 1-2.3 1a3 3 0 0 1 0-6zM6 8v2M5 9h2', caffe: 'M3 6h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM11 7h1.5a1.5 1.5 0 0 1 0 3H11M5 2v2M8 2v2',
    stampa: 'M4 6V2h8v4M4 11H2V6h12v5h-2M4 9h8v5H4z', lavagna: 'M2 3h12v8H2zM5 14l3-3 3 3', parla: 'M2 3h12v8H7l-3 3v-3H2z', pianta: 'M8 14V8M8 8c0-3 2-5 5-5 0 3-2 5-5 5zM8 10c0-2-1.5-3.5-4-3.5 0 2 1.5 3.5 4 3.5z',
    finestra: 'M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8zM8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', postit: 'M3 2h10v8l-4 4H3zM9 14v-4h4', carta: 'M4 5h8l-1 9H5zM3 5h10M6 5V3h4v2', archivio: 'M2 4h4l1.5 2H14v7H2z',
    foto: 'M2 5h3l1-2h4l1 2h3v8H2zM8 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', telefono: 'M4 2h3l1 3-2 1a7 7 0 0 0 4 4l1-2 3 1v3a1 1 0 0 1-1 1A11 11 0 0 1 3 3a1 1 0 0 1 1-1z', rete: 'M2 4h8v5H6l-2 2V9H2zM11 7h3v5h-1v2l-2-2H8v-1' };
  const DI_BASE = { regia: 'regia', lettura: 'legge', redattore: 'scrive', revisore: 'corregge', visualista: 'disegna', ai: 'scrive', schede: 'scrive', gta: 'gioca', fonti: 'archivio', verifica: 'legge', foto: 'foto', rete: 'rete', memoria: 'archivio' };
  const iconaPer = (id, cosa) => /telefono/i.test(cosa) ? 'telefono' : /muro/i.test(cosa) ? 'finestra' : /caff/i.test(cosa) ? 'caffe' : /stampa/i.test(cosa) ? 'stampa' : /post-it|appunto/i.test(cosa) ? 'postit' : /lavagna/i.test(cosa) ? 'lavagna' : /pianta/i.test(cosa) ? 'pianta' : /finestra/i.test(cosa) ? 'finestra'
    : /cestino/i.test(cosa) ? 'carta' : /riordina|archivio|puntata/i.test(cosa) ? 'archivio' : /parla|racconta|chiede|^è da |correzioni|risponde|ascolta|ci pensa/i.test(cosa) ? 'parla' : DI_BASE[id] || 'scrive';
  function etichetta(id, nome, sotto, colore) {
    const b = el('button', 'tag'); b.type = 'button'; const pallino = el('b'); pallino.style.background = colore;
    b.ico = el('span', 'ico'); b.ico.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path/></svg>'; b.ico.hidden = true;
    b.cosa = document.createTextNode(sotto); const piu = el('span', 'piu'); piu.append(b.cosa, el('em', null, 'Guarda ▸'));
    b.nomeNodo = document.createTextNode(nome); b.append(pallino, b.nomeNodo, b.ico, piu); b.setAttribute('aria-label', `${nome}, ${sotto}: apri la scheda`);
    b.addEventListener('click', () => apri(id)); strato.append(b); tags[id] = b;
  }
  let ultimoStato = 0;
  function statiVivi() {   // quattro volte al secondo: cosa sta facendo ognuno, e l'icona che salta fuori quando cambia
    const ora = performance.now(); if (ora - ultimoStato < 250) return; ultimoStato = ora;
    for (const id in persone) { const b = tags[id], cosa = scenaDi(id), k = iconaPer(id, cosa); if (!b) continue;
      if (b.cosa.nodeValue !== cosa) b.cosa.nodeValue = cosa;
      if (b.icona !== k) { const primo = b.icona == null; b.icona = k; b.ico.hidden = false; b.ico.firstChild.firstChild.setAttribute('d', ICONE[k]);
        if (!primo && !fermo) { b.classList.add('pop'); clearTimeout(b.viaPop); b.viaPop = setTimeout(() => b.classList.remove('pop'), 2600); } } }
  }
  for (const a of STATO.agenti) { etichetta(a.id, a.nome, persone[a.id] ? a.mestiere : 'torna lunedì', TINTA[a.id] || C.orange); if (a.ti_aspetta) tags[a.id].classList.add('aspetta'); }
  if (POSTIT.length) etichetta('bacheca', POSTIT.length + ' post-it', 'per te', C.yellow);
  const v3 = new THREE.Vector3();
  const dove = id => { if (persone[id]) { persone[id].userData.j.testa.getWorldPosition(v3); v3.y += 0.32; } else v3.copy(ancore[id]); return v3; };
  function etichette() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    statiVivi();
    for (const id in tags) { dove(id).project(cam); tags[id].style.transform = `translate(-50%,-100%) translate(${((v3.x + 1) / 2 * w).toFixed(1)}px,${((1 - v3.y) / 2 * h).toFixed(1)}px)`; }
  }

  // il benvenuto: cosa è successo stamattina, e chi ha qualcosa da dirti
  (() => { const box = document.getElementById('saluto'), h = oraDiRoma(), ciao = h >= 5 && h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), uscita = oraCorta(USCITA), min = STATO.corsa.minuti;
    const uscita2 = min != null ? `è uscita alle ${uscita}, in ${min} minuti` : `è uscita alle ${uscita}`;
    box.append(el('strong', null, ciao + ' Mike. '), document.createTextNode(STATO.giorno === oggi ? `L'edizione di oggi ${uscita2}. ` : `L'ultima edizione che vedo, quella di ${GIORNI_LUNGHI[OGGI.getDay()]} ${DATA_LUNGA}, ${uscita2}. `));
    const chi = STATO.agenti.filter(a => a.ti_aspetta); box.hidden = false; if (!chi.length) return;
    box.append(document.createTextNode(chi.length > 1 ? 'Ti aspettano ' : 'Ti aspetta '));
    chi.forEach((a, i) => { const b = el('button', null, a.nome); b.type = 'button'; b.addEventListener('click', () => apri(a.id)); box.append(b, document.createTextNode(i < chi.length - 2 ? ', ' : i === chi.length - 2 ? ' e ' : '')); });
    if (POSTIT.length) { const b = el('button', null, POSTIT.length + ' post-it sulla lavagna'); b.type = 'button'; b.addEventListener('click', () => apri('bacheca')); box.append(document.createTextNode(': '), b); }
    box.append(document.createTextNode('.')); })();

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
    const j = g.userData.j, p = posti[aperto], alSuoPosto = !!p && !p.inPiedi && Math.hypot(g.position.x - p.seduta[0], g.position.z - p.seduta[1]) < 0.3;
    const yaw = alSuoPosto ? p.yaw : g.rotation.y + j.busto.rotation.y + j.testa.rotation.y * 0.7; let dx = 0.8 * Math.sin(yaw) + 0.42, dz = 0.8 * Math.cos(yaw) + 0.42; const n = Math.hypot(dx, dz) || 1;   // chi è seduto si guarda da un punto fermo: così, se volta la testa o fa un giro sulla sedia, lo si vede girare
    let ux = dx / n, uz = dz / n; const fxx = Math.sin(yaw), fzz = Math.cos(yaw);
    if (alSuoPosto && ux * fxx + uz * fzz > 0.86) {   // è seduto e ha lo schermo proprio fra sé e noi: lo si guarda un po' di lato
      let px = fzz, pz = -fxx; if (px + pz < 0) { px = -px; pz = -pz; } ux = fxx * 0.78 + px * 0.63; uz = fzz * 0.78 + pz * 0.63; }
    const lontano = 1.5; let cx2 = v3.x + ux * lontano, cz2 = v3.z + uz * lontano;
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
  const TITOLO_LAVORO = { lettura: 'Le notizie su cui ha letto di più', redattore: 'Le prime tre, e «Il punto»', visualista: 'I grafici di oggi', ai: 'Nella scheda AI di oggi', schede: 'In Games e Scienza, oggi', gta: 'Su GTA VI, oggi', fonti: 'Le fonti di oggi',
    verifica: 'Le notizie che girano di più', foto: 'Le foto di oggi, e quanto pesano', rete: 'Le discussioni entrate in edizione', memoria: 'Le storie che oggi vanno avanti' };
  function bloccoGesti(id) {   // i gesti di ciascuno, da provare uno per uno
    const a = AGENTI[id], b = blocco('I suoi gesti: provali'), fila = el('div', 'spunti'), base = REPERTORI[id].base, nota = el('p', 'piccolo', `Di suo: ${base}. Ogni 40–90 secondi gliene scappa uno di questi, mai lo stesso due volte di fila. Toccane uno per vederlo subito.`);
    REPERTORI[id].gesti.forEach(g => { const p = el('button', null, g[3]); p.type = 'button'; p.addEventListener('click', () => { const v = persone[id].position, s = posti[id].seduta;
      if (Math.hypot(v.x - s[0], v.z - s[1]) > 0.15 || (!posti[id].inPiedi && persone[id].userData.j.bacino.position.y > SED + 0.12)) { nota.textContent = `Adesso ${a.nome} non è al suo posto: riprova quando torna.`; return; }
      gestoForzato = { id, nome: g[0], da: performance.now() / 1000 }; nota.textContent = 'Guarda nel riquadro in alto.'; }); fila.append(p); });
    b.append(fila, nota); return b; }
  function apri(id, pre) {
    aperto = id; for (const k in tags) tags[k].classList.toggle('scelto', k === id); rigaAdesso = null; pannello.textContent = ''; pannello.classList.remove('conversa'); ascolto.vivo = false; vistaParla = null; vistaRegistro = null; vistaDecisioniAgente = null;
    const x = el('button', 'chiudi', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Chiudi la scheda'); x.addEventListener('click', chiudi);
    const testa = el('div', 'testa'), chi = el('div'), a = AGENTI[id];
    if (id === 'prima') {
      const L = STATO.lavagna || [], sc = STATO.schermo || {}, a0 = L[0], av = el('div', 'avatar', '1'); av.style.background = C.orange;
      chi.append(el('h2', null, 'La prima pagina'), el('p', null, 'l\'edizione di ' + GIORNI_LUNGHI[OGGI.getDay()] + ' ' + DATA_LUNGA + ', impaginata')); testa.append(av, chi, x); pannello.append(testa);
      if (a0) pannello.append(blocco('In apertura · ' + (a0.reparto || ''), el('p', 'grande', a0.titolo), el('p', null, a0.sintesi || '')));
      if (L.length > 1) pannello.append(blocco('E poi', elenco(L.slice(1, 7).map(n => n.reparto + ' · ' + n.titolo))));
      if (sc.citazione && sc.citazione.testo) pannello.append(blocco('L\'ultima parola', el('p', 'citazione', '«' + sc.citazione.testo + '»'), el('p', 'piccolo', '— ' + (sc.citazione.chi || ''))));
      if (sc.punto) pannello.append(blocco('Il punto', el('p', 'grande', sc.punto)));
      if (sc.intro) pannello.append(blocco('Il quadro della giornata', el('p', null, sc.intro)));
      pannello.append(el('p', 'piede', 'Sul tavolo luminoso la pagina si compone striscia dopo striscia, ed è fatta con i titoli veri dell\'edizione. Per ora si ricompone a ogni giro; quando la redazione seguirà la corsa dal vivo, lo farà mentre i pezzi arrivano.'));
    } else if (id === 'decisioni') {
      const av = el('div', 'avatar', String(decisioni.length)); av.style.background = VERDE;
      chi.append(el('h2', null, 'Il registro'), el('p', null, 'le decisioni che hai preso con la redazione')); testa.append(av, chi, x); pannello.append(testa);
      montaRegistro(pre);
    } else if (id === 'bacheca') {
      const av = el('div', 'avatar', String(POSTIT.length)); av.style.background = C.yellow; av.style.color = C.ink;
      chi.append(el('h2', null, 'Per Mike'), el('p', null, 'i post-it che la redazione ti ha lasciato sulla lavagna')); testa.append(av, chi, x); pannello.append(testa);
      POSTIT.forEach(p => pannello.append(biglietto(p, true)));
      pannello.append(el('p', 'piede', 'Sono le cose rimaste aperte nei file della corsa: richieste di grafici, note sulle fonti, scadenze. Rispondi parlando con chi le ha lasciate: quello che decidi va nel registro.'));
    } else {
      const av = el('div', 'avatar', a.nome[0]); av.style.background = TINTA[id] || C.orange;
      chi.append(el('h2', null, a.nome), el('p', null, a.mestiere + (a.modello ? ' · ' + a.modello : ''))); testa.append(av, chi, x);
      if (persone[id]) pannello.append(telaRitratto); pannello.append(testa);
      const corpo = el('div', 'corpo'); pannello.append(corpo);
      const gr = GRUPPI[gruppoDi(id)]; if (gr) { const altri = gr.chi.filter(k => k !== id && AGENTI[k]).map(k => AGENTI[k].nome); const riga = el('p', 'gruppo'); const b = el('b'); b.style.background = gr.tinta; riga.append(b, document.createTextNode(gr.nome + (altri.length ? ': lavora con ' + altri.join(', ').replace(/, ([^,]*)$/, ' e $1') : ''))); corpo.append(riga); }
      const riga = el('p', 'adesso'); rigaAdesso = el('span'); riga.append(el('i'), rigaAdesso); corpo.append(blocco('In questo momento', riga));
      if (REPERTORI[id] && persone[id]) corpo.append(bloccoGesti(id));
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
      corpo.append(el('p', 'piede', a.script ? `${a.nome} è la parte della corsa che fanno gli script (${a.script}): non è un modello come gli altri, ma i numeri sono quelli veri di stamattina. Quello che decidi con ${a.nome} arriva a Olivia, che lancia quegli script.`
        : persone[id] ? 'In alto il primo piano, dal vivo. I gesti in scena sono una giornata tipo; i numeri e i testi sono quelli veri di stamattina.'
        : ''));
      montaParla(id, corpo, testa);
    }
    pannello.hidden = false; pannello.scrollTop = 0; x.focus({ preventScroll: true }); segui(); primoPiano();
  }
  function segui() {   // la camera resta su chi hai aperto, anche mentre cammina
    if (!aperto) return; const g = persone[aperto]; if (g) v3.set(g.position.x, 0.85, g.position.z); else v3.copy(ancore[aperto]).setY(1.2);
    const [a, b] = sulPiano(v3), z = g ? 3.1 : 2.4, larga = canvas.clientWidth > 760 ? pannello.offsetWidth : 0; meta.x = a + (larga / 2) / (ppu * z); meta.y = b; meta.zoom = z;
    if (rigaAdesso) rigaAdesso.textContent = scenaDi(aperto);
  }
  function lascia() { if (!aperto) return null; const t = tags[aperto]; if (t) t.classList.remove('scelto'); aperto = null; rigaAdesso = null; pannello.hidden = true; pannello.classList.remove('conversa'); ascolto.vivo = false; vistaParla = null; vistaRegistro = null; vistaDecisioniAgente = null; return t; }   // chiude la scheda, la camera resta dov'è
  function chiudi() { const t = lascia(); if (!t) return; Object.assign(meta, CASA); t.focus({ preventScroll: true }); }
  addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });

