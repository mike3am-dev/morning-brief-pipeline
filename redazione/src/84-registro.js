  /* ================================================================ il registro delle decisioni
     Le decisioni che Mike prende con la redazione stanno nell'archivio della pagina (collezione «decisioni»): restano fra
     un giorno e l'altro, chi le riceve le ritrova quando gli si parla, e una sessione di lavoro le legge con ArtifactData.
     Una decisione: {agente, tipo, testo, quando, giorno, origine, stato, postit?}. */
  let archivio = null, registro = 'attesa', decisioni = [];   // registro: attesa · pronto · lento · assente · errore
  let vistaRegistro = null, vistaDecisioniAgente = null;      // cosa ridisegnare, nella scheda aperta, quando il registro cambia
  const sentonoRegistro = [], quandoCambiaRegistro = f => { sentonoRegistro.push(f); }, cambiaRegistro = () => sentonoRegistro.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  const TIPI_DECISIONE = { preferenza: 'preferenza', regola: 'regola per la corsa', incarico: 'incarico per chi costruisce' };
  const VERDE = '#1F5A3C';
  const decisioniDi = id => decisioni.filter(d => d.agente === id || d.agente === 'tutti');
  const dataCorta = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }); };
  const giaSalvata = (agente, testo) => decisioni.some(d => d.agente === agente && d.testo === testo);
  async function salvaDecisione(agente, tipo, testo, origine, postit) {
    const d = { agente, tipo: TIPI_DECISIONE[tipo] ? tipo : 'preferenza', testo: String(testo).trim().slice(0, 600), quando: new Date().toISOString(), giorno: STATO.giorno, origine, stato: 'aperta' };
    if (postit) d.postit = postit; await archivio.collection('decisioni').add(d);
  }
  const ritiraDecisione = id => archivio.doc('decisioni/' + id).delete();

  // il foglietto di una decisione dentro una risposta: si salva con un tocco
  function cartaDecisione(ctx, tipo, testo) {
    const c = el('div', 'decisione'), piede = el('div', 'decisione-piede'); c.append(el('small', null, 'Decisione · ' + (TIPI_DECISIONE[tipo] || tipo)), el('p', null, testo), piede);
    const fatta = () => { piede.textContent = ''; piede.append(el('span', 'fatta', 'Nel registro ✓')); };
    if (ctx.id && giaSalvata(ctx.id, testo)) fatta();
    else if (!ctx.finita) piede.append(el('span', null, '…'));
    else if (!archivio) piede.append(el('span', null, registro === 'attesa' ? 'Sto collegando il registro: riapri la conversazione fra un momento.' : 'Qui il registro non c\'è: si salva aprendo la pagina su claude.ai.'));
    else { const b = el('button', null, 'Salva nel registro'); b.type = 'button';
      b.addEventListener('click', async () => { b.disabled = true; b.textContent = 'Salvo…'; try { await salvaDecisione(ctx.id, tipo, testo, 'conversazione', ctx.postit); fatta(); } catch (e) { b.disabled = false; b.textContent = 'Non salvata: riprova'; } });
      piede.append(b); }
    return c;
  }
  // nella scheda di una persona: le decisioni prese con lei
  function bloccoDecisioni(id) {
    const b = el('div', 'blocco'), a = AGENTI[id];
    const riempi = () => { const d = decisioniDi(id); b.textContent = ''; b.hidden = !d.length; if (!d.length) return;
      b.append(el('h3', null, 'Deciso con ' + a.nome)); d.slice(0, 4).forEach(x => { const r = el('div', 'postit decisa'); r.append(el('strong', null, x.testo), el('small', null, dataCorta(x.quando) + ' · ' + (TIPI_DECISIONE[x.tipo] || 'preferenza'))); b.append(r); });
      const tutto = el('button', 'parla-indietro', d.length > 4 ? `Tutte e ${d.length} nel registro ▸` : 'Apri il registro ▸'); tutto.type = 'button'; tutto.addEventListener('click', () => apri('decisioni')); b.append(tutto); };
    riempi(); vistaDecisioniAgente = riempi; return b;
  }
  // un post-it della bacheca: si risponde parlando con chi l'ha lasciato, o annotando una decisione se oggi non c'è
  function rispostaAlPostit(p) {
    const riga = el('div', 'postit-azioni'), tema = 'A proposito di «' + brevePostit(p.titolo) + '»: ', a = AGENTI[p.da];
    if (decisioni.some(d => d.postit === p.id)) riga.append(el('span', 'fatta', 'Hai già risposto ✓'));
    const b = el('button', null, persone[p.da] ? 'Rispondi a ' + a.nome + ' ▸' : 'Annota la tua decisione ▸'); b.type = 'button';
    b.addEventListener('click', () => { if (persone[p.da]) { apri(p.da); const apriBtn = pannello.querySelector('.parla-apri'); if (apriBtn && apriBtn._apri) apriBtn._apri(tema, p.id); } else apri('decisioni', { agente: p.da, testo: tema, postit: p.id }); });
    riga.append(b); return riga;
  }
  // la scheda del registro: tutte le decisioni, e un rigo per annotarne una a mano
  function montaRegistro(pre = {}) {
    const nota = el('p', 'parla-avviso'), form = el('form', 'registro-form'), chi = el('select'), tipo = el('select'), campo = el('textarea'), ok = el('button', 'parla-invia', 'Annota'), lista = el('div', 'registro-lista');
    [['tutti', 'Tutta la redazione'], ...STATO.agenti.map(a => [a.id, a.nome + ', ' + a.mestiere])].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; chi.append(o); });
    Object.entries(TIPI_DECISIONE).forEach(([v, t]) => { const o = el('option', null, t[0].toUpperCase() + t.slice(1)); o.value = v; tipo.append(o); });
    chi.setAttribute('aria-label', 'Per chi è la decisione'); tipo.setAttribute('aria-label', 'Che tipo di decisione è'); campo.rows = 2; campo.placeholder = 'Scrivi una decisione…'; campo.setAttribute('aria-label', 'Il testo della decisione'); ok.type = 'submit';
    if (pre.agente) chi.value = pre.agente; if (pre.testo) campo.value = pre.testo;
    const scelte = el('div', 'registro-scelte'); scelte.append(chi, tipo); const rigo = el('div', 'parla-form'); rigo.append(campo, ok); form.append(scelte, rigo);
    form.addEventListener('submit', async e => { e.preventDefault(); const t = campo.value.trim(); if (!t || !archivio) return; ok.disabled = true;
      try { await salvaDecisione(chi.value, tipo.value, t, 'registro', pre.postit); campo.value = ''; pre.postit = null; } catch (err) { nota.hidden = false; nota.textContent = 'Non sono riuscito a salvarla. Riprova fra poco.'; } ok.disabled = false; });
    const riga = d => { const r = el('div', 'postit decisa'), a = AGENTI[d.agente], via = el('button', 'ritira', 'Ritira'); r.style.borderLeftColor = TINTA[d.agente] || VERDE; via.type = 'button'; let sicuro = false;
      via.addEventListener('click', async () => { if (!sicuro) { sicuro = true; via.textContent = 'Sicuro? Tocca ancora'; setTimeout(() => { if (via.isConnected && !via.disabled) { sicuro = false; via.textContent = 'Ritira'; } }, 4000); return; }
        via.disabled = true; try { await ritiraDecisione(d.id); } catch (e) { via.disabled = false; via.textContent = 'Non riuscito'; } });
      r.append(el('small', null, (a ? a.nome : 'Tutta la redazione') + ' · ' + dataCorta(d.quando) + ' · ' + (TIPI_DECISIONE[d.tipo] || 'preferenza')), el('strong', null, d.testo), via); return r; };
    const ridisegna = () => { const fermo2 = registro === 'assente' || registro === 'errore' || !archivio; ok.disabled = fermo2; campo.disabled = fermo2;
      nota.textContent = registro === 'assente' ? 'Qui il registro non c\'è: funziona aprendo la pagina su claude.ai.' : registro === 'errore' ? 'Il registro non risponde. Ricarica la pagina per riprovare.' : registro === 'attesa' ? 'Un momento: sto aprendo il registro…' : registro === 'lento' ? 'Il registro tarda a rispondere: quello che vedi potrebbe non essere aggiornato.' : '';
      nota.hidden = !nota.textContent; lista.textContent = '';
      if (!decisioni.length && registro === 'pronto') lista.append(el('p', 'parla-vuoto', 'Ancora nessuna decisione. Nascono parlando con qualcuno della redazione (te la propone, e la salvi con un tocco) oppure le annoti qui sopra.'));
      decisioni.forEach(d => lista.append(riga(d))); const av = pannello.querySelector('.avatar'); if (av) av.textContent = String(decisioni.length); };
    pannello.append(nota, form, lista, el('p', 'piede', 'Chi riceve una decisione la ritrova ogni volta che gli parli. La corsa del mattino il registro non lo legge ancora: una regola o un incarico cambiano l\'edizione quando qualcuno li porta nelle istruzioni della corsa o nell\'app.'));
    ridisegna(); vistaRegistro = ridisegna;
  }

  // il registro sul tavolo di Mike: l'etichetta porta il numero delle decisioni
  ancore.decisioni = new THREE.Vector3(MIKE[0], TAV + 0.42, MIKE[1]);
  etichetta('decisioni', 'Il registro', 'le tue decisioni', VERDE);
  const promemoria = el('span'); document.getElementById('saluto').append(promemoria);   // nel benvenuto: quante decisioni hai nel registro
  quandoCambiaRegistro(() => { tags.decisioni.nomeNodo.textContent = decisioni.length ? 'Il registro · ' + decisioni.length : 'Il registro'; if (vistaRegistro) vistaRegistro(); if (vistaDecisioniAgente) vistaDecisioniAgente();
    promemoria.textContent = ''; if (decisioni.length) { const b = el('button', null, decisioni.length === 1 ? 'una decisione' : decisioni.length + ' decisioni'); b.type = 'button'; b.addEventListener('click', () => apri('decisioni')); promemoria.append(document.createTextNode(' Nel registro hai '), b, document.createTextNode('.')); } });

  // l'archivio: su claude.ai è quello della pagina; in locale, con ?finto=1, uno di prova nel browser
  const archivioFinto = (() => { const K = 'tmb-redazione-registro-finto', leggi = () => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (e) { return []; } }; let sente = null;
    const foto = () => ({ metadata: { fromCache: false }, docs: leggi().sort((a, b) => (a.quando < b.quando ? 1 : -1)).map(d => ({ id: d.id, data: () => d })) });
    const scrivi = l => { try { localStorage.setItem(K, JSON.stringify(l)); } catch (e) { /* pazienza */ } if (sente) sente(foto()); };
    const q = { orderBy: () => q, limit: () => q, onSnapshot: next => { sente = next; setTimeout(() => next(foto()), 60); return () => {}; }, add: async d => { scrivi([...leggi(), { ...d, id: 'prova' + Date.now() }]); } };
    return { collection: () => q, doc: path => ({ delete: async () => scrivi(leggi().filter(d => d.id !== path.split('/')[1])) }) }; })();
  // quando nell'archivio arriva uno stato più nuovo (è uscita un'edizione), la redazione si aggiorna: da sola se non
  // stai facendo niente, con un pulsante se hai una scheda aperta. Dopo aver ricaricato, parte dallo stato nuovo.
  let statoInArrivo = null;
  function statoNuovo(d) {
    if (!valido(d) || !(d.scritto > STATO.scritto) || (statoInArrivo && statoInArrivo >= d.scritto)) return; statoInArrivo = d.scritto;
    const box = document.getElementById('novita'), gia = (() => { try { return sessionStorage.getItem('tmb-redazione-ricarica') === d.scritto; } catch (e) { return false; } })();
    const ricarica = () => { try { sessionStorage.setItem('tmb-redazione-ricarica', d.scritto); } catch (e) { /* pazienza */ } location.reload(); };
    const b = el('button', null, 'Aggiorna la redazione'); b.type = 'button'; b.addEventListener('click', ricarica);
    box.textContent = ''; box.append(el('strong', null, d.giorno !== STATO.giorno ? 'È uscita l\'edizione di ' + GIORNI_LUNGHI[giornoDi(d.giorno).getDay()] + '. ' : 'Ci sono novità dalla corsa. '), b); box.hidden = false;
    if (!gia && !aperto && !inCorso) setTimeout(() => { if (!aperto && !inCorso) ricarica(); }, 2500);
  }
  function collegaRegistro(db) {
    archivio = db || null; if (!db) { registro = 'assente'; return cambiaRegistro(); }
    if (db.doc) try { db.doc('stato/corrente').onSnapshot(foto => { if (foto.exists) statoNuovo(foto.data()); }, () => {}); } catch (e) { /* senza ascolto si aggiorna alla prossima apertura */ }
    const timer = setTimeout(() => { if (registro === 'attesa') { registro = 'lento'; cambiaRegistro(); } }, 10000);
    db.collection('decisioni').orderBy('quando', 'desc').limit(300).onSnapshot(
      snap => { if (!snap.metadata.fromCache) clearTimeout(timer); registro = 'pronto'; decisioni = snap.docs.map(d => ({ ...d.data(), id: d.id })); cambiaRegistro(); },
      () => { clearTimeout(timer); registro = 'errore'; cambiaRegistro(); });
  }
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('db').then(collegaRegistro, () => collegaRegistro(null));
  else collegaRegistro(/finto/.test(location.search) ? archivioFinto : null);

