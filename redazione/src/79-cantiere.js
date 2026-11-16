  /* ================================================================ il cantiere: la redazione lavora in avanti
     Mike, 16 novembre 2026: «l'ufficio dovrebbe lavorare in avanti… sta costruendo la prossima edizione. Piuttosto sono io
     che li interrogo sull'edizione passata». L'edizione di stamattina è chiusa; in redazione si lavora a quella di domani.
     Il cantiere (redazione/cantiere.py, documento «stato/cantiere» dell'archivio) porta le notizie VERE arrivate dopo
     l'uscita, divise per reparto. Qui ognuno prende le sue e ne fa il lavoro di adesso: su quale notizia, da quanto, e
     cosa viene dopo. Vero è il materiale (titolo, testata, ora, quante testate); il gesto è verosimile, e nessuno ne
     inventa l'esito. Ogni tanto si passa al compito dopo, ognuno col suo passo, così la stanza non resta ferma fra un
     aggiornamento e l'altro. */
  const cantiereBuono = c => !!(c && c.scritto && c.edizione === STATO.giorno && Array.isArray(c.notizie));
  let cantiere = cantiereBuono(CANTIERE) ? CANTIERE : null;
  const sentonoCantiere = [], quandoCambiaCantiere = f => { sentonoCantiere.push(f); };
  function cantiereNuovo(d) { if (!cantiereBuono(d) || (cantiere && !(d.scritto > cantiere.scritto))) return; cantiere = d; sentonoCantiere.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  const vociDi = k => (cantiere && cantiere[k]) || [];
  const titoloDi = (x, n = 62) => '«' + (x.t.length <= n ? x.t : x.t.slice(0, n).replace(/\s+\S*$/, '').replace(/[,:;]$/, '') + '…') + '»';
  const oraDi = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('it-IT', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Rome' }); };
  const quanteTestate = x => x.n > 1 ? `${x.n} testate, la prima ${x.f}` : 'solo ' + x.f;
  const conNumeri = x => /\d[\d.,]*\s?(%|€|\$|euro|dollar|milion|miliard|mila\b|GB|TB|mAh|pollici|nm\b|Hz|ore\b|mesi\b|utenti|unità)/i.test(x.t + ' ' + (x.s || ''));   // un numero con la sua misura: c'è qualcosa da far vedere
  const daQuantoFa = ms => { const m = Math.max(0, Math.round((Date.now() - ms) / 60000)); return m < 2 ? 'da un attimo' : m < 60 ? `da ${m} minuti` : m < 90 ? 'da un\'ora' : m < 150 ? 'da un paio d\'ore' : `da ${Math.round(m / 60)} ore`; };

  // Le notizie del cantiere sono di due specie: quelle NUOVE (candidate per domani) e le RIPRESE, cioè altre testate che
  // danno adesso una notizia che noi abbiamo dato stamattina (x.seg ne porta il titolo). Sulle riprese non si riscrive
  // niente: si guarda come gira la nostra notizia.
  const nuove = () => vociDi('notizie').filter(x => !x.seg), riprese = () => vociDi('notizie').filter(x => x.seg);
  const nostra = x => '«' + (x.seg.length > 52 ? x.seg.slice(0, 52).replace(/\s+\S*$/, '') + '…' : x.seg) + '»';
  // i compiti di ciascuno, dal materiale del cantiere. Ogni compito: cosa fa, e su quale voce (x)
  const COMPITI = {
    regia: () => { const N = nuove(), R = riprese(), out = [];
      if (N[0]) out.push({ cosa: `Mette in fila la scaletta di domani: ${N.length === 1 ? 'una notizia nuova' : N.length + ' notizie nuove'}, in testa ${titoloDi(N[0])}`, x: N[0] });
      if (N[1]) out.push({ cosa: `Decide se ${titoloDi(N[1])} vale un posto fra le prime cinque`, x: N[1] });
      if (R[0]) out.push({ cosa: `Guarda come gira l'edizione di stamattina: ${nostra(R[0])} adesso la ${R[0].n > 1 ? 'riprendono ' + R[0].n + ' testate' : 'riprende ' + R[0].f}`, x: R[0] });
      return out; },
    lettura: () => nuove().slice(0, 4).map(x => ({ cosa: `Legge per intero l'articolo di ${x.f} su ${titoloDi(x)}`, x })).concat(riprese().slice(0, 2).map(x => ({ cosa: `Legge come ${x.f} racconta ${nostra(x)}, che noi abbiamo dato stamattina`, x }))),
    verifica: () => nuove().slice(0, 3).map(x => ({ cosa: x.n > 1 ? `Verifica ${titoloDi(x)}: la danno ${x.n} testate, cerca chi l'ha detta per primo` : `Cerca una seconda fonte per ${titoloDi(x)}: per ora la dà solo ${x.f}`, x }))
      .concat(riprese().slice(0, 3).map(x => ({ cosa: `Conta chi riprende ${nostra(x)}: adesso ${x.n > 1 ? 'sono in ' + x.n + ' (' + [x.f].concat(x.altre || []).slice(0, 3).join(', ') + ')' : 'c\'è ' + x.f}`, x }))),
    redattore: () => nuove().slice(0, 3).map((x, i) => ({ cosa: (i ? 'Imposta il pezzo su ' : 'Scrive la prima stesura di ') + titoloDi(x), x })),
    revisore: () => nuove().slice(0, 3).map(x => ({ cosa: `Rilegge la prima stesura di ${AGENTI.redattore ? AGENTI.redattore.nome : 'Ettore'} su ${titoloDi(x)}`, x })),
    visualista: () => { const N = nuove(); return N.filter(conNumeri).concat(N.filter(x => !conNumeri(x))).slice(0, 3).map(x => ({ cosa: (conNumeri(x) ? 'Prova un grafico per ' : 'Valuta se serve un grafico per ') + titoloDi(x), x })); },
    foto: () => nuove().slice(0, 4).map(x => ({ cosa: `Cerca una foto senza loghi per ${titoloDi(x)}`, x })),
    ai: () => vociDi('ai').slice(0, 3).map(x => ({ cosa: `Segue ${titoloDi(x)} (${x.f}) per la scheda AI`, x })).concat(vociDi('lab').slice(0, 2).map(x => ({ cosa: `Guarda ${titoloDi(x)} (${x.f}): potrebbe finire nel LAB`, x }))),
    schede: () => { const g = vociDi('games'), s = vociDi('scienza'), out = []; for (let i = 0; i < 2; i++) { if (s[i]) out.push({ cosa: `Legge ${titoloDi(s[i])} (${s[i].f}) per Scienza`, x: s[i] }); if (g[i]) out.push({ cosa: `Legge ${titoloDi(g[i])} (${g[i].f}) per Games`, x: g[i] }); } return out; },
    gta: () => vociDi('gta').slice(0, 3).map(x => ({ cosa: `Scava su ${titoloDi(x)} (${x.f})`, x })),
    rete: () => vociDi('discussioni').slice(0, 3).map(x => ({ cosa: `Segue la discussione su ${x.f}: ${titoloDi(x)}`, x })),
    fonti: () => { const f = cantiere && cantiere.feed, out = []; if (!f) return out;
      out.push({ cosa: f.muti && f.muti.length ? `Fa il giro delle fonti: ne rispondono ${f.ok} su ${f.totale}; ${f.muti.length === 1 ? 'tace' : 'tacciono'} ${f.muti.slice(0, 2).join(' e ')}` : `Fa il giro delle fonti: rispondono tutte e ${f.totale}` });
      const N = vociDi('notizie').filter(x => x.n > 1 && !x.seg); if (N[0]) out.push({ cosa: `Segna chi è arrivato per primo su ${titoloDi(N[0])}: ${N[0].f}`, x: N[0] });
      const R = riprese(); if (R[0]) out.push({ cosa: `Segna a che ora ${R[0].f} ha ripreso ${nostra(R[0])}: alle ${oraDi(R[0].ora)}`, x: R[0] }); return out; },
    memoria: () => riprese().slice(0, 2).map(x => ({ cosa: `Aggancia la ripresa di ${x.f} al filo di ${nostra(x)}`, x })).concat(nuove().slice(0, 2).map(x => ({ cosa: `Cerca in archivio se ${titoloDi(x)} continua una storia già aperta`, x }))),
  };
  // quando per il proprio reparto non è ancora arrivato niente: si aspetta, e lo si dice
  const IN_ATTESA = { regia: 'la scaletta di domani', ai: 'la scheda AI', schede: 'Games e Scienza', gta: 'GTA VI', rete: 'le discussioni' };
  const PASSO_LAVORO = { regia: 22, lettura: 17, verifica: 26, redattore: 34, revisore: 21, visualista: 38, foto: 19, ai: 24, schede: 27, gta: 31, rete: 16, fonti: 44, memoria: 29 };   // minuti su un compito, prima di passare al prossimo
  function lavoroDi(id, adesso = Date.now()) {   // {cosa, x, da, poi} oppure null se il cantiere non c'è
    if (!cantiere || !COMPITI[id]) return null;
    const lista = COMPITI[id]();
    if (!lista.length) return { cosa: !IN_ATTESA[id] && riprese().length ? 'Aspetta una notizia nuova: per ora arrivano solo riprese di quelle di stamattina' : `Aspetta: dopo l'uscita di stamattina per ${IN_ATTESA[id] || 'l\'edizione di domani'} non è ancora arrivato niente`, x: null, da: Date.parse(cantiere.dal) || adesso, poi: null, attesa: true };
    const passo = PASSO_LAVORO[id] * 60000, sfasa = [...id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % passo, k = Math.floor((adesso + sfasa) / passo), i = k % lista.length, c = lista[i];
    let da = k * passo - sfasa; if (c.x && c.x.ora && Date.parse(c.x.ora)) da = Math.max(da, Date.parse(c.x.ora) + 3 * 60000); da = Math.min(da, adesso - 30000);
    return { ...c, da, poi: lista.length > 1 ? lista[(i + 1) % lista.length] : null };
  }

  // per chi risponde a Mike: il suo lavoro di adesso, per esteso
  function lavoroPer(id) {
    const L = lavoroDi(id); if (!L) return 'Oggi il cantiere non è arrivato fin qui: non sai cosa è uscito dopo l\'edizione di stamattina. Se Mike chiede su cosa lavori, diglielo così com\'è, e parlagli di quello che hai sulle carte.';
    const x = L.x, r = [`Stai facendo questo: ${L.cosa}. Ci sei ${daQuantoFa(L.da)}.` + (L.poi ? ` Dopo ti aspetta: ${L.poi.cosa[0].toLowerCase() + L.poi.cosa.slice(1)}.` : '')];
    if (x) r.push(`La notizia su cui lavori: «${x.t}» — ${x.f}` + (x.ora ? `, uscita alle ${oraDi(x.ora)}` : '') + (x.n > 1 ? `; la danno ${x.n} testate` + (x.altre ? ` (anche ${x.altre.join(', ')})` : '') : x.n === 1 ? '; per ora la dà una testata sola' : '') + '.'
      + (x.seg ? ` Non è una notizia nuova: è una ripresa di quella che abbiamo dato stamattina, «${x.seg}».` : '') + (x.o ? ` Titolo originale: «${x.o}».` : '') + (x.s ? ` Quello che ne dice il feed: ${x.s}` : ' Dal feed hai solo il titolo.'));
    return r.join('\n');
  }
  // e il quadro di tutto il cantiere, uguale per tutti: è il materiale per l'edizione di domani
  function quadroCantiere(id) {
    if (!cantiere) return null;
    const riga = x => `«${x.t}» — ${x.f}` + (x.ora ? ', ' + oraDi(x.ora) : '') + (x.n > 1 ? `, ${x.n} testate` : '');
    const r = [], blocco2 = (nome, k) => { const v = vociDi(k); r.push(`${nome} (${v.length}): ` + (v.length ? v.map((x, i) => `${i + 1}. ${riga(x)}`).join(' · ') : 'ancora niente')); };
    const N = nuove(), R = riprese();
    r.push(`Notizie Apple nuove, candidate per domani (${N.length}): ` + (N.length ? N.map((x, i) => `${i + 1}. ${riga(x)}`).join(' · ') : 'ancora nessuna'));
    if (R.length) r.push(`Riprese di notizie che abbiamo già dato stamattina (${R.length}): ` + R.map(x => `«${x.seg}» ripresa da ${[x.f].concat(x.altre || []).join(', ')} alle ${oraDi(x.ora)}`).join(' · '));
    blocco2('AI', 'ai'); blocco2('LAB', 'lab'); blocco2('La concorrenza («Di cosa si parla»)', 'banco'); blocco2('Games', 'games'); blocco2('Scienza', 'scienza'); blocco2('GTA VI', 'gta'); blocco2('Radar', 'radar'); blocco2('Discussioni in rete', 'discussioni');
    if (cantiere.feed) r.push(`Fonti: rispondono ${cantiere.feed.ok} su ${cantiere.feed.totale}` + (cantiere.feed.muti && cantiere.feed.muti.length ? '; tacciono ' + cantiere.feed.muti.join(', ') : '') + '.');
    const altri = STATO.agenti.filter(a => a.id !== id && persone[a.id]).map(a => { const L = lavoroDi(a.id); return L && !L.attesa ? `${a.nome}: ${L.cosa[0].toLowerCase() + L.cosa.slice(1)}` : null; }).filter(Boolean);
    if (altri.length) r.push('\nI COLLEGHI, IN QUESTO MOMENTO\n' + altri.join('\n'));
    return r.join('\n');
  }

