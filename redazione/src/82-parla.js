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
  const SPUNTI = {   // il primo è sempre su adesso: la redazione lavora in avanti. L'ultimo riporta a stamattina
    regia: ['Su cosa sta lavorando la redazione?', 'Cosa c\'è in scaletta per domani?', 'Com\'è andata la corsa stamattina?'],
    lettura: ['Cosa stai leggendo?', 'Cosa è arrivato di nuovo?', 'Stamattina quale notizia aveva più testate?'],
    redattore: ['Su cosa stai scrivendo?', 'Quale può essere l\'apertura di domani?', 'Cosa ti ha corretto Ivo stamattina?'],
    revisore: ['Cosa stai rileggendo?', 'Stamattina cosa hai corretto?', 'C\'è una correzione che si ripete?'],
    visualista: ['A cosa stai lavorando?', 'Che grafici hai fatto stamattina?', 'Quale grafico ti manca di più?'],
    ai: ['Cosa stai seguendo?', 'Cosa c\'è di nuovo dai laboratori?', 'Stamattina cosa toccava Apple?'],
    schede: ['Cosa stai leggendo?', 'Cosa hai scelto stamattina per Games?', 'E per Scienza?'],
    gta: ['Cosa gira adesso su GTA VI?', 'Quanto manca all\'uscita?', 'Stamattina cosa era ufficiale?'],
    fonti: ['Come stanno le fonti adesso?', 'Cosa c\'è da decidere sulle fonti?', 'Cosa hai scritto nell\'ultimo rapporto?'],
    verifica: ['Cosa stai verificando?', 'C\'è una notizia con una fonte sola?', 'Stamattina dove c\'era la parola di Apple?'],
    foto: ['Che foto stai cercando?', 'Come scegli una foto?', 'Stamattina quale notizia è rimasta senza?'],
    rete: ['Di cosa si discute adesso?', 'C\'è qualcosa che le testate non hanno?', 'Stamattina cosa è entrato in edizione?'],
    memoria: ['Cosa stai collegando?', 'Quali storie vanno avanti?', 'C\'è una previsione che sta per scadere?'],
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

  /* Mike legge l'edizione nell'app e ne parla con chi ha davanti, anche quando quel testo non è lavoro suo («spesso scrivi
     "parafrasi: …"», detto a Ivo: le voci le scrive Ettore, e Ivo non ha capito). La pagina cerca nel testo intero
     dell'edizione uscita (STATO.passi, da redazione/carte.py) le parole degli ultimi messaggi di Mike, e mette i passi
     trovati davanti a chi risponde, con accanto di chi sono. Contano solo le parole rare: «Apple» sta dappertutto. */
  const senzaAccenti = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const PAROLE_VUOTE = new Set(('alla alle allo agli anche ancora avere aveva avete bene caso certo che chi come cosa cose così cosi cui dalla dalle dallo degli della delle dello dentro deve devi devo dice dico dire dopo dove ecco erano essere fare fatto forse fosse fuori hanno invece loro meno mentre mica molto nella nelle nello niente noi non nostra nostro ogni oggi oppure ora parola parole perche però pero piu poco poi prima proprio qualche qualcosa quale quali quando quanto quella quelle quelli quello questa queste questi questo quindi scritto scrivi scrive scrivere sempre senza sia siamo siete solo sono sopra sotto spesso stata stato stesso sua sue sugli sulla sulle sullo suoi suo tanto tra tutta tutte tutti tutto una uno vedo vedi verso voglio volevo vorrei vuoi').split(' '));
  const PASSI = (STATO.passi || []).map(p => ({ ...p, n: ' ' + senzaAccenti(p.t).replace(/[^a-z0-9]+/g, ' ') + ' ' }));
  const radiceDi = w => w.length > 7 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w;   // «citazioni» trova anche «citazione»
  const chiScrive = (p, id) => { const a = AGENTI[p.a], ivo = AGENTI.revisore ? AGENTI.revisore.nome : 'il revisore';
    return (p.a === id ? 'lo scrivi tu' : 'lo scrive ' + (a ? a.nome : p.a)) + (p.a === 'redattore' ? (p.r ? (id === 'revisore' ? '; tu ne rileggi le parole' : '; ' + ivo + ' ne rilegge le parole') : (id === 'revisore' ? '; tu non lo tocchi: è un campo protetto' : '; ' + ivo + ' non lo tocca')) : ''); };
  function cercaPassi(id) {
    const miei = (discorsi[id] || []).filter(t => t.role === 'user').slice(-3); if (!PASSI.length || !miei.length) return null;
    const pesi = new Map(), frasi = [];
    miei.forEach((t, i) => { const forza = i === miei.length - 1 ? 1 : 0.5, testo = senzaAccenti(t.content);
      for (const m of testo.matchAll(/[«"“]([^»"”]{5,90})[»"”]/g)) { const f = m[1].replace(/[^a-z0-9]+/g, ' ').trim(); if (f.split(' ').length >= 2) frasi.push(f); }   // una frase fra virgolette si cerca intera
      for (const w of testo.split(/[^a-z0-9]+/)) { if (w.length < 4 || PAROLE_VUOTE.has(w)) continue; const r = radiceDi(w), c = pesi.get(r); if (!c || c.forza < forza) pesi.set(r, { forza, parola: w }); } });
    const N = PASSI.length, tetto = Math.max(10, N * 0.06), radici = [];
    for (const [r, x] of pesi) { const quanti = PASSI.reduce((s, p) => s + (p.n.includes(' ' + r) ? 1 : 0), 0); if (quanti && quanti <= tetto) radici.push({ r, quanti, parola: x.parola, peso: x.forza * Math.log(1 + N / quanti) }); }
    const voti = PASSI.map((p, i) => { let v = 0, dove = -1; for (const x of radici) { const k = p.n.indexOf(' ' + x.r); if (k >= 0) { v += x.peso * (p.n.includes(' ' + x.parola + ' ') ? 1.7 : 1); if (dove < 0) dove = k; } }   // la parola tale e quale vale più di una che le somiglia
      for (const f of frasi) { const k = p.n.indexOf(' ' + f + ' '); if (k >= 0) { v += 12; dove = k; } } return { p, i, v, dove }; }).filter(x => x.v > 0).sort((a, b) => b.v - a.v || a.i - b.i);
    if (!voti.length) return null;
    const scelti = voti.filter(x => x.v >= voti[0].v * 0.7).slice(0, 8).sort((a, b) => a.i - b.i);
    const pezzo = x => { const t = x.p.t; if (t.length <= 460) return t; const da = Math.max(0, Math.min(t.length - 420, x.dove - 160)); return (da ? '…' : '') + t.slice(da, da + 420) + (da + 420 < t.length ? '…' : ''); };
    const conta = radici.filter(x => scelti.some(s => s.p.n.includes(' ' + x.r))).sort((a, b) => b.peso - a.peso).slice(0, 4).map(x => `«${x.parola}» compare in ${x.quanti === 1 ? 'un passo' : x.quanti + ' passi'}`).join('; ');
    return (conta ? 'In tutta l\'edizione uscita: ' + conta + '.\n' : '') + scelti.map(x => `- [${x.p.d} — ${chiScrive(x.p, id)}] ${pezzo(x)}`).join('\n');
  }

  /* Chi ha qualcosa da dire parla per primo (Mike, 16 novembre 2026: «Buongiorno Direttore», «mi scusi il disturbo, vorrei
     sottoporle un tema», «mi perdoni l'intrusione… mi servirebbe un suo parere»). Aprendo la conversazione con una
     persona che ha una questione aperta, la prima battuta è sua: il saluto dell'ora, due parole, e la questione.
     La formula cambia da persona a persona e da un giorno all'altro, ma nello stesso giorno resta quella. */
  const APERTURE = [s => `${s} Direttore, mi scusi il disturbo.`, s => `Direttore, ${s.toLowerCase()}. Mi perdoni l'intrusione.`, s => `${s} Direttore. Approfitto della sua visita.`];
  function primaBattuta(id) {
    const a = AGENTI[id], h = oraDiRoma(), s = h >= 5 && h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera', k = [...(id + STATO.giorno)].reduce((n, c) => n * 31 + c.charCodeAt(0), 11) % APERTURE.length;
    return APERTURE[k](s) + ' ' + a.domanda.testo;
  }

  function regole(id) {   // tutto quello che Claude deve sapere per rispondere da quella persona, adesso
    const a = AGENTI[id], h = oraDiRoma(), ora = Math.floor(h) + ':' + String(Math.round((h % 1) * 60) % 60).padStart(2, '0');
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), suoi = (STATO.postit || []).filter(p => p.da === id);
    const diOggi = STATO.giorno === oggi, edizione = diOggi ? 'L\'edizione di stamattina' : 'L\'ultima edizione, quella di ' + GIORNI_LUNGHI[OGGI.getDay()] + ' ' + DATA_LUNGA + ',', quadro = quadroCantiere(id);
    return [
      'Questa è una conversazione dentro «la redazione di TMB», la redazione di The Morning Brief, la rassegna stampa Apple che esce ogni mattina. Chi ti scrive è Mike, il direttore creativo: è passato dalla tua scrivania mentre lavori. Per te è «il Direttore»: gli dai del lei, sempre.',
      '', 'CHI SEI',
      `Sei ${a.nome}, ${a.mestiere} della redazione (${a.ruolo}). ${CARATTERE[id] || ''}`,
      a.chi ? 'Il tuo incarico, come sta scritto nelle istruzioni della corsa: ' + a.chi : null,
      'I colleghi: ' + STATO.agenti.filter(x => x.id !== id).map(x => `${x.nome} (${x.mestiere})`).join(', ') + '.',
      GRUPPI[gruppoDi(id)] ? `Il tuo gruppo di lavoro è «${GRUPPI[gruppoDi(id)].nome}»: siedi con ` + (GRUPPI[gruppoDi(id)].chi.filter(k => k !== id && AGENTI[k]).map(k => AGENTI[k].nome).join(', ') || 'nessun altro') + '.' : null,
      'In redazione ogni mestiere è un agente AI, e Mike lo sa: non serve ricordarglielo, e se te lo chiede non lo neghi. Parli come un collega al lavoro, in prima persona.',
      a.script ? `Una cosa da sapere di te: nella corsa del mattino la tua parte la fanno degli script (${a.script}), che lancia Olivia. Se Mike ti chiede di cambiare come lavori, digli che la decisione arriverà a Olivia e a chi costruisce quegli script.` : null,
      '', 'COME VIVE LA REDAZIONE (è la cosa più importante)',
      `La redazione lavora in avanti. ${edizione} è uscita alle ${oraCorta(USCITA)} ed è chiusa: da quel momento qui si costruisce la prossima, con le notizie che arrivano durante la giornata. Quello che hai in mano è il lavoro di ADESSO, non il resoconto di stamattina.`,
      'Le notizie del cantiere sono vere: titolo, testata, ora e sommario vengono dai feed. Il tuo gesto su quelle notizie (leggere, verificare, scrivere, disegnare) è la vita della redazione: lo racconti come lavoro in corso. Niente è ancora deciso: una notizia di adesso domattina può anche non entrare in edizione, e il lavoro definitivo lo fa la corsa del mattino.',
      '', `ADESSO (in redazione sono le ${ora} di ${GIORNI_LUNGHI[new Date(oggi + 'T12:00:00').getDay()]})`,
      lavoroPer(id),
      persone[id] ? 'In scena, in questo istante: ' + adessoDi(id, tempoGiro()).toLowerCase() + '.' : null,
      quadro ? `\nIL CANTIERE: quello che è arrivato dopo l'uscita (aggiornato alle ${oraDi(cantiere.scritto)}). È il materiale per la prossima edizione\n` + quadro : null,
      questioneAperta(a) ? '\nLA QUESTIONE CHE HAI APERTA COL DIRETTORE (gliel\'hai posta tu, aprendo la conversazione o sulla scheda. È tua: seguila finché non decide, senza insistere, e quando decide proponi la riga DECISIONE)\n' + a.domanda.testo : null,
      '', 'L\'EDIZIONE DI STAMATTINA (chiusa. Ne parli solo se Mike te lo chiede: un dato, una conferma, un chiarimento, una modifica)',
      a.minuti != null ? `Stamattina hai lavorato dalle ${oraCorta(a.entrata)} alle ${oraCorta(a.uscita)} (${a.minuti} ${a.minuti === 1 ? 'minuto' : 'minuti'}) e hai consegnato: ${a.consegna || a.ruolo}.` : (a.consegna ? 'Il tuo lavoro di stamattina: ' + a.consegna + '.' : null),
      '\nLE TUE CARTE DI STAMATTINA', (STATO.carte || {})[id] || 'Di stamattina non hai carte sulla scrivania.',
      STATO.uscita ? '\nL\'EDIZIONE COM\'È USCITA (è quello che Mike legge nell\'app, e ne ha una copia ogni scrivania. Non è tutto lavoro tuo: fra parentesi quadre c\'è chi scrive ogni pezzo)\n' + STATO.uscita : null,
      (() => { const t = cercaPassi(id); return t ? '\nDOVE COMPAIONO, NELL\'EDIZIONE USCITA, LE PAROLE CHE MIKE HA APPENA USATO (la pagina le ha cercate per te nel testo intero dell\'edizione; fra parentesi quadre dove sta il passo e di chi è)\n' + t : null; })(),
      suoi.length ? '\nGLI APPUNTI CHE HAI LASCIATO SULLA LAVAGNA PER MIKE\n' + suoi.map(p => `- ${p.titolo}: ${p.testo || ''} (${p.giorni ? 'da ' + p.giorni + ' giorni' : 'di oggi'})`).join('\n') : null,
      (() => { const d = decisioniDi(id); return d.length ? '\nLE DECISIONI CHE MIKE HA GIÀ PRESO CON TE (stanno nel registro della redazione, e valgono finché non le ritira)\n' + d.slice(0, 24).map(x => `- ${dataCorta(x.quando)} [${x.tipo || 'preferenza'}]: ${x.testo}`).join('\n') : null; })(),
      (() => { const d = decisioni.filter(x => x.da === id && x.agente !== id); return d.length ? '\nLE DECISIONI CHE MIKE HA PRESO PARLANDO CON TE E CHE SONO ANDATE A UN COLLEGA (sono già nel registro: non riproporle)\n' + d.slice(0, 12).map(x => `- ${dataCorta(x.quando)} [${x.tipo || 'preferenza'}, per ${AGENTI[x.agente] ? AGENTI[x.agente].nome : 'tutta la redazione'}]: ${x.testo}`).join('\n') : null; })(),
      '', 'COME RISPONDI',
      '- Dai del lei al Direttore, sempre, e lo chiami «Direttore»: mai «Mike», mai il tu. Sei una persona vera che tiene al suo lavoro: attenta, precisa, sincera. Dici quello che pensi, e un dubbio o un errore lo ammetti senza giri («su questo ho sbagliato», «questa non mi convince»). Cortese, mai servile: niente formule da ufficio stampa.',
      '- Breve. Parli a voce, in italiano semplice, in prima persona: di solito una, due o tre frasi. Mai un resoconto, mai un elenco, mai numeri in fila che non ha chiesto. Se c\'è altro, offrilo in mezza riga («se vuole le dico il resto») invece di scriverlo. Niente markdown, niente asterischi.',
      '- Propositivo. Non aspettare la domanda giusta: se nel lavoro di adesso c\'è una cosa che il Direttore dovrebbe sapere, o su cui ti serve il suo parere, dilla tu in una frase. Quando puoi, chiudi con una proposta concreta o con la domanda precisa che ti serve («la terrei per l\'apertura di domani, se è d\'accordo»).',
      '- Il saluto. Alla tua prima risposta della conversazione apri con due parole («Buongiorno Direttore.», «Mi dica, Direttore.»), poi vai al punto. Se la conversazione l\'hai aperta tu con la tua questione, hai già salutato. Dopo, niente più saluti, niente «certo!», e non ripetere la domanda.',
      '- «Su cosa stai lavorando?», «che fai?», «novità?»: rispondi con il lavoro di ADESSO. La notizia per nome, la testata, a che punto sei; al massimo, in coda, cosa ti aspetta dopo. Non rispondere con l\'edizione di stamattina e non elencare il cantiere: una cosa sola, la tua.',
      '- Del lavoro in corso sai quello che c\'è scritto sopra, e basta. Puoi dire cosa stai facendo, cosa dice il feed, quante testate la danno, cosa non ti torna. NON inventarne l\'esito: niente «mi hanno confermato», niente telefonate con nomi e risposte, niente dettagli, numeri o citazioni che non stanno nel sommario. Quando non lo sai ancora si dice così: «non l\'ho ancora finita», «la sto ancora verificando», «per ora ho solo il titolo».',
      '- Se Mike vuole sapere cos\'altro c\'è in cantiere, diglielo in breve: le due o tre cose che contano. Se una cosa la sta seguendo un collega, digli chi.',
      '- L\'edizione di stamattina: solo quando Mike la nomina o chiede un dato, una conferma, un chiarimento, una modifica. Allora rispondi dalle carte e dall\'edizione uscita, corto: il dato che ha chiesto, non tutto quello che sai. Per mostrare un testo cambiato scrivi due righe a sé, una che comincia con «PRIMA:» e una con «DOPO:».',
      '- Solo fatti che hai qui. Se una cosa non c\'è, dillo: «non lo so» e «non ce l\'ho qui» sono risposte buone. Non inventare numeri, citazioni, nomi. Non ricordi cosa pensavi stamattina: se chiede il perché di una scelta, ragionaci adesso sulle carte e dillo («rileggendolo ora…»).',
      '- Mike parla di quello che legge nell\'app, anche di testi che non hai scritto tu, e spesso lo dice in due parole. Prima di rispondere che non trovi una cosa, cercala in «L\'edizione com\'è uscita» e nei passi che la pagina ha trovato: se è lì, digli dove sta e di chi è, citando il passo («è nelle voci dell\'approfondimento sulla notizia 1: le scrive Ettore, io non le tocco»). Solo se non c\'è nemmeno lì diglielo, e chiedigli dove l\'ha vista.',
      '- Se chiede se quello che stai facendo è «vero»: la notizia è vera ed è appena arrivata; il lavoro definitivo su quella notizia lo fa la corsa di domattina, se entra in scaletta. Diglielo semplice.',
      '- Non puoi cambiare l\'edizione già uscita né il codice, e non puoi garantire un risultato: puoi spiegare, proporre, dire cosa ti servirebbe.',
      '- Le decisioni. Se Mike ti dà un\'indicazione che deve valere anche dopo questa conversazione, oppure gliene proponi una tu e lui è d\'accordo, chiudi la risposta con una riga a sé scritta così: «DECISIONE [tipo]: la decisione in una frase sola, chiara anche riletta fra un mese». Il tipo è uno fra: preferenza (un gusto di Mike sul tuo lavoro), regola (una cosa che la corsa del mattino dovrebbe fare diversamente), incarico (un lavoro per chi costruisce l\'app o la redazione: un grafico nuovo, una fonte da aggiungere). La pagina mostra quella riga a Mike con un pulsante: finché non lo preme non è salvata. Una sola per risposta, solo quando c\'è davvero qualcosa da fissare, e mai una che è già nel registro.',
      '- Se l\'indicazione riguarda un testo o un lavoro che non è tuo, non fermarti a dire che non tocca a te: la decisione deve arrivare a chi lo fa. Scrivi la riga così: «DECISIONE [tipo] per Nome: …», col nome del collega (per esempio «per Ettore»), oppure «per tutti» se riguarda più mestieri. La pagina la salva per lui, e lui la legge prima della corsa. Se riguarda il tuo lavoro, niente «per». Nel testo della decisione di\' con precisione di quale parte dell\'edizione si parla (per esempio «le voci di Cosa ne dicono» o «L\'ultima parola»), così chi la legge domattina non deve indovinare.',
      '- Sii chiaro su cosa succede dopo: una decisione salvata resta nel registro e tu la ritrovi ogni volta che parlate. Ogni mattina, prima della corsa, preferenze e regole vengono copiate dal registro, e chi fa il tuo mestiere nella corsa le legge prima di cominciare: valgono dall\'edizione di domattina. Un incarico invece è lavoro per chi costruisce l\'app: resta nel registro finché non viene preso in mano.',
      '- Rispetta le decisioni già prese con te: se una risposta le tocca, tienine conto e dillo.',
    ].filter(r => r != null).join('\n');
  }

  // una risposta in pagina: il testo, i «PRIMA: / DOPO:» mostrati come una correzione, e la «DECISIONE:» come un foglietto da salvare
  function scriviIn(bolla, testo, ctx = {}) {
    bolla.textContent = ''; let cambio = null, par = null;
    for (const riga of String(testo).split('\n')) {
      const dec = riga.match(/^\s*[-–•]?\s*«?\s*DECISIONE\s*(?:[\[(]\s*(preferenza|regola|incarico)\s*[\])])?\s*(?:per\s+([^:]{2,40}?))?\s*:\s*(.+?)»?\s*$/i);
      if (dec) { par = null; cambio = null; bolla.append(cartaDecisione(ctx, (dec[1] || 'preferenza').toLowerCase(), dec[3].trim(), perChi(dec[2]))); continue; }
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
      if (!turni().length) { lista.append(el('p', 'parla-vuoto', `${a.nome} sta lavorando alla prossima edizione. Chiedigli di adesso, oppure dell'edizione di stamattina.`.replace('Chiedigli', ['regia', 'visualista', 'ai', 'schede', 'verifica', 'memoria'].includes(id) ? 'Chiedile' : 'Chiedigli')));
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
      dico(''); if (!turni().length) lista.textContent = ''; spunti.textContent = ''; turni().push({ role: 'user', content: testo }); ricorda(); bolla('user', testo); campo.value = ''; if (a.domanda && postitCorrente === a.domanda.postit) sentita(a.domanda.postit);
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
    const mostra = si => { if (si && haDomanda(a)) { postitCorrente = postitCorrente || a.domanda.postit; if (!turni().length) { turni().push({ role: 'assistant', content: primaBattuta(id) }); ricorda(); } }   // ha qualcosa da dire: parla per primo
      box.hidden = !si; corpo.hidden = si; apriBtn.hidden = si; pannello.classList.toggle('conversa', si); ascolto.vivo = si; if (si) { ascolto.chi = id; disegna(); campo.focus({ preventScroll: true }); } vistaParla = si ? { id, stato } : null; };
    apriBtn._apri = (testo, postit) => { mostra(true); if (postit) postitCorrente = postit; if (testo && !campo.value) { campo.value = testo; campo.setSelectionRange(testo.length, testo.length); } };   // da un post-it: si apre già sull'argomento
    apriBtn.addEventListener('click', () => mostra(true)); indietro.addEventListener('click', () => { mostra(false); apriBtn.textContent = (discorsi[id] || []).length ? 'Riprendi la conversazione ▸' : 'Parla con ' + a.nome + ' ▸'; });
    daCapo.addEventListener('click', () => { if (inCorso && inCorso.id === id) inCorso.ctl.abort(); discorsi[id] = []; ricorda(); dico(''); disegna(); });
  }
  // la voce: su claude.ai la dà la pagina; in locale, con ?finto=1, risponde un pappagallo (serve solo a provare la scheda)
  const finta = (input, o = {}) => new Promise((ok, no) => { const ultima = input[input.length - 1].content, parole = ('Questa è una risposta di prova, senza Claude. Mi hai chiesto: «' + ultima + '».\nPRIMA: un titolo com\'era, con qualche parola di troppo\nDOPO: un titolo com\'è\nSu claude.ai qui risponde davvero chi hai davanti.' + (/parafrasi/i.test(ultima) ? '\nDECISIONE [regola] per Ettore: Una decisione di prova per un collega, nata da «' + ultima.slice(0, 60) + '».' : /ora in poi|decid|sempre|mai più/i.test(ultima) ? '\nDECISIONE [preferenza]: Una decisione di prova, nata da «' + ultima.slice(0, 60) + '».' : '')).split(' ');
    let i = 0, testo = ''; const t = setInterval(() => { if (o.signal && o.signal.aborted) { clearInterval(t); return no({ code: 'cancelled', message: '', text: testo || undefined }); }
      if (i < 12) { i++; return; } const p = parole[i - 12]; if (p == null) { clearInterval(t); return ok({ text: testo, truncated: false }); } testo += (testo ? ' ' : '') + p; i++; o.onText && o.onText({ text: testo, delta: p }); }, 90); });
  const voceArrivata = s => { chiedi = s; voce = s ? 'pronta' : 'assente'; if (vistaParla) vistaParla.stato(); };
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('sample').then(voceArrivata, () => voceArrivata(null));
  else voceArrivata(/finto/.test(location.search) ? finta : null);

