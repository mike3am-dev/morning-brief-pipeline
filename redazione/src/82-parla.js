  /* ================================================================ la conversazione: Mike parla con uno della redazione
     La pagina chiede a Claude con l'account di chi guarda. Claude non ricorda niente fra un messaggio e l'altro:
     a ogni domanda gli si rimanda chi è, le carte del giorno (redazione/carte.py) e la conversazione fin lì. */
  let chiedi = null, voce = 'attesa';   // voce: attesa (non si sa ancora) · pronta · assente (fuori da claude.ai) · negata
  const discorsi = {}, CHIAVE = 'tmb-redazione-discorsi-' + STATO.giorno;
  try { Object.assign(discorsi, JSON.parse(localStorage.getItem(CHIAVE) || '{}')); } catch (e) { /* senza memoria del browser si parla lo stesso */ }
  const ricorda = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(discorsi)); } catch (e) { /* idem */ } };

  const CARATTERE = {
    regia: 'Sei pratica e diretta, tieni il quadro d\'insieme. Parli da caporedattrice: pochi giri di parole.',
    lettura: 'Sei curioso e meticoloso: ti piace dire da dove viene una notizia e chi l\'ha data per primo.',
    redattore: 'Tieni alla prosa: asciutta, da giornalista. Difendi le tue scelte, ma una correzione giusta la accetti.',
    revisore: 'Sei pignolo ma gentile, di poche parole. Cambi le parole, mai i fatti, e ogni ritocco lo sai spiegare.',
    visualista: 'Ragioni per immagini e sei schietta: se un grafico non serve lo dici, e preferisci nessun grafico a uno forzato.',
    ai: 'Sei rapida e curiosa, ma coi piedi per terra: distingui la cronaca dei laboratori da quello che la gente ci fa davvero.',
    schede: 'Sei ordinata e un po\' ironica. Sai dire perché una voce è entrata e un\'altra no.',
    gta: 'Sei il più giovane e il più appassionato: GTA VI è la tua ossessione, ma tieni sempre separato l\'ufficiale dalle voci.',
    fonti: 'Sei calmo e preciso, un po\' all\'antica. Ogni giorno guardi quali fonti rispondono e quali tacciono; il lunedì scrivi il rapporto. Ragioni sui numeri delle fonti, non sulle impressioni.',
    verifica: 'Sei scettica per mestiere e precisa: distingui sempre chi ha dato una notizia da chi l\'ha solo ripresa, e non ti fidi di cinque siti che citano la stessa fonte.',
    foto: 'Sei concreto e di buon occhio. Parli poco: una foto o va bene o si cambia. I loghi sulle foto non li sopporti.',
    rete: 'Sei svelto e curioso, con l\'orecchio sempre sulla rete. Sai che una discussione non è un fatto, e lo ripeti volentieri.',
    memoria: 'Hai una memoria di ferro e un tono pacato. Ti piace collegare la notizia di oggi a quella di tre settimane fa, e ricordare le previsioni che stanno per scadere.',
  };
  const SPUNTI = {
    regia: ['Com\'è andata la corsa stamattina?', 'Perché questa apertura?', 'C\'è qualcosa che ti preoccupa?'],
    lettura: ['Quale notizia aveva più testate?', 'Ce n\'è una con una testata sola?', 'Quali fonti oggi erano mute?'],
    redattore: ['Perché hai aperto con questa notizia?', 'Cosa ti ha corretto Ivo?', 'Di cosa parla «Il punto» di oggi?'],
    revisore: ['Fammi vedere cosa hai corretto', 'C\'è una correzione che si ripete?', 'Hai un dubbio su qualche testo?'],
    visualista: ['Che grafici hai fatto oggi?', 'Quali notizie sono rimaste senza?', 'Quale grafico ti manca di più?'],
    ai: ['Cosa c\'è oggi nella scheda AI?', 'Quale voce tocca Apple da vicino?', 'Cosa posso provare io?'],
    schede: ['Cosa hai scelto per Games?', 'E per Scienza?', 'Cosa hai scartato, e perché?'],
    gta: ['Cosa gira in rete oggi su GTA VI?', 'Quanto manca all\'uscita?', 'Cosa è ufficiale e cosa no?'],
    fonti: ['Quali fonti oggi non hanno risposto?', 'Cosa c\'è da decidere sulle fonti?', 'Cosa hai scritto nell\'ultimo rapporto?'],
    verifica: ['Quale notizia gira di più oggi?', 'C\'è una notizia con una fonte sola?', 'Dove c\'è la parola di Apple?'],
    foto: ['Quante foto ci sono oggi?', 'Quale notizia è rimasta senza foto?', 'Come scegli una foto?'],
    rete: ['Di cosa si discute oggi in rete?', 'Cosa c\'è che le testate non hanno?', 'Cosa hai raccolto per il LAB?'],
    memoria: ['Quali storie vanno avanti oggi?', 'C\'è una previsione nuova?', 'Cosa hai ripescato, e perché?'],
  };
  const SCUSA = {
    not_granted: 'Per parlare con la redazione la pagina deve poter usare Claude con il tuo account. Ricarica la pagina e, quando te lo chiede, consenti.',
    sampling_disabled: 'Su questo account Claude non è disponibile per questa pagina.', not_declared: 'Questa copia della pagina non può usare Claude.',
    capability_disabled: 'Qui la conversazione non è disponibile.', capability_removed: 'Qui la conversazione non è disponibile.',
    rate_limited: 'Troppe domande di fila, o hai raggiunto il limite del tuo abbonamento. Riprova fra poco.',
    session_expired: 'La sessione è scaduta: accedi di nuovo a claude.ai e ricarica la pagina.',
    refused: 'A questa domanda non ha risposto. Prova a chiederla in un altro modo.',
    empty_completion: 'Non è arrivata nessuna risposta. Riprova con una domanda più semplice.',
    prompt_too_large: 'La conversazione è diventata troppo lunga: ricominciala da capo.',
  };
  const CHIUSE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  function regole(id) {   // tutto quello che Claude deve sapere per rispondere da quella persona, oggi
    const a = AGENTI[id], h = oraDiRoma(), ora = Math.floor(h) + ':' + String(Math.round((h % 1) * 60) % 60).padStart(2, '0');
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), suoi = (STATO.postit || []).filter(p => p.da === id);
    const edizione = STATO.giorno === oggi ? 'L\'edizione di oggi' : 'L\'ultima edizione, quella di ' + GIORNI_LUNGHI[OGGI.getDay()] + ' ' + DATA_LUNGA + ',';
    return [
      'Questa è una conversazione dentro «la redazione di TMB», la stanza virtuale di The Morning Brief, la rassegna stampa Apple che esce ogni mattina. Chi ti scrive è Mike, il direttore creativo: è entrato in redazione e si è fermato da te.',
      '', 'CHI SEI',
      `Sei ${a.nome}, ${a.mestiere} della redazione (${a.ruolo}). ${CARATTERE[id] || ''}`,
      a.chi ? 'Il tuo incarico, come sta scritto nelle istruzioni della corsa: ' + a.chi : null,
      'In redazione ogni mestiere è un agente AI che ogni mattina fa la sua parte della corsa, e Mike lo sa: non devi fingere di essere una persona, ma parli del tuo lavoro in prima persona. I colleghi: ' + STATO.agenti.filter(x => x.id !== id).map(x => `${x.nome} (${x.mestiere})`).join(', ') + '.',
      a.script ? `Una cosa da sapere di te: nella corsa la tua parte non la fa un modello, la fanno degli script (${a.script}), che lancia Olivia. Qui parli per loro. Se Mike ti chiede di cambiare come lavori, digli che la decisione arriverà a Olivia e a chi costruisce quegli script.` : null,
      GRUPPI[gruppoDi(id)] ? `Il tuo gruppo di lavoro è «${GRUPPI[gruppoDi(id)].nome}»: siedi con ` + (GRUPPI[gruppoDi(id)].chi.filter(k => k !== id && AGENTI[k]).map(k => AGENTI[k].nome).join(', ') || 'nessun altro') + '.' : null,
      '', 'OGGI',
      `In redazione sono le ${ora} di ${GIORNI_LUNGHI[new Date(oggi + 'T12:00:00').getDay()]}. ${edizione} è uscita alle ${oraCorta(USCITA)}.`,
      a.minuti != null ? `Stamattina hai lavorato dalle ${oraCorta(a.entrata)} alle ${oraCorta(a.uscita)} (${a.minuti} ${a.minuti === 1 ? 'minuto' : 'minuti'}) e hai consegnato: ${a.consegna || a.ruolo}.` : (a.consegna ? 'Il tuo lavoro: ' + a.consegna + '.' : null),
      persone[id] ? 'In questo momento, nella stanza: ' + adessoDi(id, tempoGiro()).toLowerCase() + '.' : null,
      '', 'LE TUE CARTE (il tuo lavoro vero; è tutto quello che sai di oggi)', (STATO.carte || {})[id] || 'Oggi non hai carte sulla scrivania.',
      suoi.length ? '\nI POST-IT CHE HAI LASCIATO SULLA LAVAGNA PER MIKE\n' + suoi.map(p => `- ${p.titolo}: ${p.testo || ''} (${p.giorni ? 'da ' + p.giorni + ' giorni' : 'di oggi'})`).join('\n') : null,
      (() => { const d = decisioniDi(id); return d.length ? '\nLE DECISIONI CHE MIKE HA GIÀ PRESO CON TE (stanno nel registro della redazione, e valgono finché non le ritira)\n' + d.slice(0, 24).map(x => `- ${dataCorta(x.quando)} [${x.tipo || 'preferenza'}]: ${x.testo}`).join('\n') : null; })(),
      '', 'COME RISPONDI',
      '- In italiano semplice, in prima persona, come un collega che parla a voce: poche frasi (di solito da due a cinque). Niente markdown, niente asterischi, niente elenchi lunghi.',
      '- Solo i fatti che hai nelle carte. Se una cosa non c\'è, dillo: «non lo so» e «non ce l\'ho qui» sono risposte buone. Non inventare numeri, citazioni, nomi.',
      '- Non ricordi cosa pensavi stamattina: hai davanti le carte. Se Mike chiede il perché di una scelta, ragionaci adesso sulle carte e dillo («rileggendolo ora…»).',
      '- Quando chiede cosa hai fatto, faglielo vedere: i titoli, i numeri, le differenze. Per mostrare un testo cambiato scrivi due righe a sé, una che comincia con «PRIMA:» e una con «DOPO:».',
      '- Un dubbio o un suggerimento deve nascere da un dato delle carte (una notizia con una testata sola, una correzione che si ripete, una richiesta ferma da settimane), e lo presenti come tale.',
      '- Non puoi cambiare l\'edizione già uscita né il codice, e non puoi garantire un risultato: puoi spiegare, proporre, dire cosa ti servirebbe.',
      '- Le decisioni. Se Mike ti dà un\'indicazione che deve valere anche dopo questa conversazione, oppure gliene proponi una tu e lui è d\'accordo, chiudi la risposta con una riga a sé scritta così: «DECISIONE [tipo]: la decisione in una frase sola, chiara anche riletta fra un mese». Il tipo è uno fra: preferenza (un gusto di Mike sul tuo lavoro), regola (una cosa che la corsa del mattino dovrebbe fare diversamente), incarico (un lavoro per chi costruisce l\'app o la redazione: un grafico nuovo, una fonte da aggiungere). La pagina mostra quella riga a Mike con un pulsante: finché non lo preme non è salvata. Una sola per risposta, solo quando c\'è davvero qualcosa da fissare, e mai una che è già nel registro.',
      '- Sii chiaro su cosa succede dopo: una decisione salvata resta nel registro e tu la ritrovi ogni volta che parlate. Ogni mattina, prima della corsa, preferenze e regole vengono copiate dal registro, e chi fa il tuo mestiere nella corsa le legge prima di cominciare: valgono dall\'edizione di domattina. Un incarico invece è lavoro per chi costruisce l\'app: resta nel registro finché non viene preso in mano.',
      '- Rispetta le decisioni già prese con te: se una risposta le tocca, tienine conto e dillo.',
      '- Niente convenevoli, niente «certo!», non ripetere la domanda.',
    ].filter(r => r != null).join('\n');
  }

  // una risposta in pagina: il testo, i «PRIMA: / DOPO:» mostrati come una correzione, e la «DECISIONE:» come un foglietto da salvare
  function scriviIn(bolla, testo, ctx = {}) {
    bolla.textContent = ''; let cambio = null, par = null;
    for (const riga of String(testo).split('\n')) {
      const dec = riga.match(/^\s*[-–•]?\s*DECISIONE\s*(?:[\[(]\s*(preferenza|regola|incarico)\s*[\])])?\s*:\s*(.+)$/i);
      if (dec) { par = null; cambio = null; bolla.append(cartaDecisione(ctx, (dec[1] || 'preferenza').toLowerCase(), dec[2].trim())); continue; }
      const m = riga.match(/^\s*[-–•]?\s*(PRIMA|DOPO)\s*:\s*(.*)$/i);
      if (m) { par = null; if (!cambio || m[1].toUpperCase() === 'PRIMA') { cambio = el('div', 'cambio'); bolla.append(cambio); }
        cambio.append(el(m[1].toUpperCase() === 'PRIMA' ? 'del' : 'ins', null, m[2])); if (m[1].toUpperCase() === 'DOPO') cambio = null; continue; }
      cambio = null; if (!riga.trim()) { par = null; continue; }
      if (par) par.append(document.createElement('br'), document.createTextNode(riga)); else { par = el('p', null, riga); bolla.append(par); }
    }
  }

  let inCorso = null, vistaParla = null;   // vistaParla: i pezzi della conversazione aperta nella scheda, se c'è
  const alSuoPosto = id => { const g = persone[id], s = posti[id] && posti[id].seduta; return !!g && Math.hypot(g.position.x - s[0], g.position.z - s[1]) < 0.06; };
  function scenaDi(id) {   // la riga «in questo momento»: se stai parlando con lui, cosa fa mentre parlate
    const base = adessoDi(id, tempoGiro());
    if (!(ascolto.vivo && ascolto.chi === id)) return base;
    if (!alSuoPosto(id)) return base + ' (ti risponde da lì)';
    return ascolto.fase === 'pensa' ? 'Ci pensa' : ascolto.fase === 'parla' ? 'Ti risponde' : 'Ti ascolta';
  }
  function montaParla(id, corpo, dopo) {   // dentro la scheda di una persona: il pulsante, e la conversazione che prende il posto della scheda
    const a = AGENTI[id], qui = !!persone[id], turni = () => (discorsi[id] = discorsi[id] || []); let postitCorrente = null;
    const ctx = finita => ({ id, finita, postit: postitCorrente });
    const apriBtn = el('button', 'parla-apri', !qui ? 'Gli parli lunedì, quando c\'è' : (discorsi[id] || []).length ? 'Riprendi la conversazione ▸' : 'Parla con ' + a.nome + ' ▸'); apriBtn.type = 'button'; apriBtn.disabled = !qui;
    dopo.after(apriBtn); if (!qui) return;
    const box = el('div', 'parla'); box.hidden = true; corpo.after(box);
    const indietro = el('button', 'parla-indietro', '‹ La scheda'); indietro.type = 'button';
    const daCapo = el('button', 'parla-indietro', 'Ricomincia'); daCapo.type = 'button';
    const barra = el('div', 'parla-barra'); barra.append(indietro, daCapo);
    const lista = el('div', 'messaggi'); lista.setAttribute('aria-live', 'polite');
    const spunti = el('div', 'spunti'), avviso = el('p', 'parla-avviso'); avviso.hidden = true;
    const form = el('form', 'parla-form'), campo = el('textarea'); campo.rows = 2; campo.placeholder = 'Scrivi a ' + a.nome + '…'; campo.setAttribute('aria-label', 'Il tuo messaggio per ' + a.nome);
    const invia = el('button', 'parla-invia', 'Invia'); invia.type = 'submit'; form.append(campo, invia);
    box.append(barra, lista, spunti, avviso, form);
    const inFondo = () => { lista.scrollTop = lista.scrollHeight; };
    const bolla = (ruolo, testo) => { const b = el('div', 'bolla ' + (ruolo === 'user' ? 'mia' : 'sua')); if (ruolo === 'user') b.textContent = testo; else scriviIn(b, testo, ctx(true)); lista.append(b); return b; };
    const dico = t => { avviso.textContent = t || ''; avviso.hidden = !t; };
    function disegna() {
      lista.textContent = ''; spunti.textContent = '';
      if (!turni().length) { lista.append(el('p', 'parla-vuoto', `${a.nome} ha davanti il suo lavoro di stamattina. Chiedigli quello che vuoi: risponde solo con quello che ha sulle carte.`.replace('Chiedigli', ['regia', 'visualista', 'ai', 'schede'].includes(id) ? 'Chiedile' : 'Chiedigli')));
        (SPUNTI[id] || []).forEach(s => { const b = el('button', null, s); b.type = 'button'; b.addEventListener('click', () => manda(s)); spunti.append(b); }); }
      turni().forEach(t => bolla(t.role, t.content)); inFondo(); stato();
    }
    function stato() {
      const occupato = !!inCorso; invia.textContent = occupato && inCorso.id === id ? 'Ferma' : 'Invia'; invia.disabled = voce !== 'pronta' || (occupato && inCorso.id !== id); campo.disabled = voce !== 'pronta';
      if (voce === 'assente') dico('Qui la conversazione non c\'è: funziona aprendo la pagina su claude.ai.'); else if (voce === 'attesa') dico('Un momento: sto collegando la conversazione…'); else if (voce === 'pronta' && avviso.textContent.startsWith('Un momento')) dico('');
      spunti.hidden = voce !== 'pronta' || occupato;
    }
    async function manda(testo) {
      testo = (testo || '').trim(); if (!testo || inCorso || voce !== 'pronta' || !chiedi) return;
      dico(''); if (!turni().length) lista.textContent = ''; spunti.textContent = ''; turni().push({ role: 'user', content: testo }); ricorda(); bolla('user', testo); campo.value = '';
      const b = bolla('assistant', ''); b.classList.add('attesa'); b.textContent = a.nome + ' ci pensa…'; inFondo();
      const ctl = new AbortController(); inCorso = { id, ctl }; ascolto.fase = 'pensa'; stato();
      try {
        const r = await chiedi([{ role: 'user', content: regole(id) }, ...turni().slice(-16).map(t => ({ role: t.role, content: t.content }))], { cache: false, signal: ctl.signal, modelTier: 'default',
          onText: ({ text }) => { ascolto.fase = 'parla'; b.classList.remove('attesa'); scriviIn(b, text, ctx(false)); inFondo(); } });
        b.classList.remove('attesa'); scriviIn(b, r.text, ctx(true)); turni().push({ role: 'assistant', content: r.text }); if (r.truncated) dico('La risposta è stata tagliata: chiedigli un pezzo per volta.');
      } catch (e) {
        const codice = e && e.code, parte = e && e.text;
        if (parte) { b.classList.remove('attesa'); scriviIn(b, parte, ctx(true)); turni().push({ role: 'assistant', content: parte }); } else { b.remove(); if (codice !== 'cancelled') { turni().pop(); campo.value = testo; lista.lastChild && lista.lastChild.remove(); } }
        if (codice !== 'cancelled') dico(SCUSA[codice] || 'La risposta si è interrotta. Riprova.');
        if (CHIUSE.includes(codice)) { voce = 'negata'; chiedi = null; }
      } finally { inCorso = null; ascolto.fase = ''; ricorda(); stato(); inFondo(); }
    }
    form.addEventListener('submit', e => { e.preventDefault(); if (inCorso && inCorso.id === id) inCorso.ctl.abort(); else manda(campo.value); });
    campo.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
    const mostra = si => { box.hidden = !si; corpo.hidden = si; apriBtn.hidden = si; pannello.classList.toggle('conversa', si); ascolto.vivo = si; if (si) { ascolto.chi = id; disegna(); campo.focus({ preventScroll: true }); } vistaParla = si ? { id, stato } : null; };
    apriBtn._apri = (testo, postit) => { mostra(true); if (postit) postitCorrente = postit; if (testo && !campo.value) { campo.value = testo; campo.setSelectionRange(testo.length, testo.length); } };   // da un post-it: si apre già sull'argomento
    apriBtn.addEventListener('click', () => mostra(true)); indietro.addEventListener('click', () => { mostra(false); apriBtn.textContent = (discorsi[id] || []).length ? 'Riprendi la conversazione ▸' : 'Parla con ' + a.nome + ' ▸'; });
    daCapo.addEventListener('click', () => { if (inCorso && inCorso.id === id) inCorso.ctl.abort(); discorsi[id] = []; ricorda(); dico(''); disegna(); });
  }
  // la voce: su claude.ai la dà la pagina; in locale, con ?finto=1, risponde un pappagallo (serve solo a provare la scheda)
  const finta = (input, o = {}) => new Promise((ok, no) => { const ultima = input[input.length - 1].content, parole = ('Questa è una risposta di prova, senza Claude. Mi hai chiesto: «' + ultima + '».\nPRIMA: un titolo com\'era, con qualche parola di troppo\nDOPO: un titolo com\'è\nSu claude.ai qui risponde davvero chi hai davanti.' + (/ora in poi|decid|sempre|mai più/i.test(ultima) ? '\nDECISIONE [preferenza]: Una decisione di prova, nata da «' + ultima.slice(0, 60) + '».' : '')).split(' ');
    let i = 0, testo = ''; const t = setInterval(() => { if (o.signal && o.signal.aborted) { clearInterval(t); return no({ code: 'cancelled', message: '', text: testo || undefined }); }
      if (i < 12) { i++; return; } const p = parole[i - 12]; if (p == null) { clearInterval(t); return ok({ text: testo, truncated: false }); } testo += (testo ? ' ' : '') + p; i++; o.onText && o.onText({ text: testo, delta: p }); }, 90); });
  const voceArrivata = s => { chiedi = s; voce = s ? 'pronta' : 'assente'; if (vistaParla) vistaParla.stato(); };
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('sample').then(voceArrivata, () => voceArrivata(null));
  else voceArrivata(/finto/.test(location.search) ? finta : null);

