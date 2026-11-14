/* ------------------------------------------------------------------ i dati veri
   Lo stato del giorno lo ricava redazione/stato.py dai file della corsa, e redazione/costruisci.py
   lo mette qui sotto. Niente di quello che si legge in scena è scritto a mano. */
/*__STATO__*/
/* Lo stato più fresco. La pagina nasce con lo stato del giorno in cui è stata composta (STATO_FISSO), ma chi fa
   uscire l'edizione lo riscrive nell'archivio della pagina, documento «stato/corrente»: se lì ce n'è uno più nuovo,
   la redazione parte da quello. Si aspetta poco: se l'archivio non risponde, si parte con quello che c'è. */
const entro = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
const valido = d => !!(d && d.giorno && d.scritto && d.corsa && Array.isArray(d.agenti) && Array.isArray(d.lavagna) && d.lavagna.length && d.schermo && d.macchine);
let STATO = STATO_FISSO;
try {
  const db0 = window.claude && typeof window.claude.use === 'function' ? await entro(window.claude.use('db'), 2000) : null;
  const foto = db0 ? await entro(db0.doc('stato/corrente').get(), 2500) : null, d = foto && foto.exists ? foto.data() : null;
  if (valido(d) && d.scritto > (STATO_FISSO.scritto || '')) STATO = JSON.parse(JSON.stringify(d));
} catch (e) { console.warn('stato dall\'archivio non letto', e); }
const GIORNI = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
const GIORNI_LUNGHI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const giornoDi = iso => new Date(iso + 'T12:00:00');
const AGENTI = Object.fromEntries(STATO.agenti.map(a => [a.id, a]));
const USCITA = (STATO.corsa && STATO.corsa.ora_uscita) || '06:00';
const PROSSIMA = [6, 0];   // l'ora (di Roma) a cui punta il conto alla rovescia
const corto = (t, n) => { t = (t || '').split(/[.:,;]/)[0].trim(); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ') > 8 ? c.lastIndexOf(' ') : n) + '…'; };
/* Dal 14 novembre 2026 quattro passi della corsa hanno una persona. Se lo stato che abbiamo è più vecchio e non li
   conosce, li si aggiunge vuoti: la stanza li disegna lo stesso, e la scheda dice che per quel giorno non hanno numeri. */
for (const [id, nome, mestiere, ruolo] of [['verifica', 'Nora', 'verificatrice', 'controlla da dove viene ogni notizia e quanto gira'], ['foto', 'Bruno', 'photo editor', 'sceglie la foto di ogni notizia, senza loghi e non sgranata'],
  ['rete', 'Dario', 'cronista della rete', 'ascolta cosa si dice in rete'], ['memoria', 'Clio', 'archivista delle storie', 'tiene i fili delle storie, le previsioni e i numeri che si muovono']])
  if (!AGENTI[id]) { const a = { id, nome, mestiere, ruolo, modello: 'uno script', dettagli: [], consegna: null, stato: 'fuori' }; STATO.agenti.push(a); AGENTI[id] = a; }
// i gruppi di lavoro: chi siede con chi, e il colore del gruppo
const GRUPPI = {
  edizione: { nome: 'L\'edizione', chi: ['lettura', 'redattore', 'revisore', 'verifica'], tinta: '#D9670B', fondo: '#F4DFCB' },
  schede: { nome: 'Le schede', chi: ['ai', 'schede', 'gta', 'rete'], tinta: '#3A5FCF', fondo: '#DAE0F1' },
  design: { nome: 'Design', chi: ['visualista', 'foto'], tinta: '#B8860B', fondo: '#F2E7BF' },
  archivio: { nome: 'Archivio', chi: ['fonti', 'memoria'], tinta: '#2F7A4C', fondo: '#D8E5D8' },
};
const gruppoDi = id => Object.keys(GRUPPI).find(k => GRUPPI[k].chi.includes(id));

