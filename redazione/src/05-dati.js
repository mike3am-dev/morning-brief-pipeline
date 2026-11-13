/* ------------------------------------------------------------------ i dati veri
   Lo stato del giorno lo ricava redazione/stato.py dai file della corsa, e redazione/costruisci.py
   lo mette qui sotto. Niente di quello che si legge in scena è scritto a mano. */
/*__STATO__*/
const GIORNI = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
const GIORNI_LUNGHI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const giornoDi = iso => new Date(iso + 'T12:00:00');
const AGENTI = Object.fromEntries(STATO.agenti.map(a => [a.id, a]));
const USCITA = (STATO.corsa && STATO.corsa.ora_uscita) || '06:00';
const PROSSIMA = [6, 0];   // l'ora (di Roma) a cui punta il conto alla rovescia
const corto = (t, n) => { t = (t || '').split(/[.:,;]/)[0].trim(); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ') > 8 ? c.lastIndexOf(' ') : n) + '…'; };

