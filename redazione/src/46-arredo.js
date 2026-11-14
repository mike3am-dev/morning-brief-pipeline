  /* ================================================================ l'arredo da redazione, lungo la parete di sinistra
     Sotto la finestra la rastrelliera dei giornali: sono le testate lette di più per scrivere l'edizione di oggi.
     Fra la finestra e la lavagna l'insegna luminosa col marchio, sempre accesa. Sotto la lavagna lo scaffale delle
     annate: un faldone per mese, grosso quanto le edizioni che contiene, e i giornali impilati. */
  // la rastrelliera dei giornali
  const EDICOLA = (STATO.edicola || []).slice(0, 5);
  const texTestata = (nome, quante) => tela(260, 500, (x, w, h) => { x.fillStyle = '#F4F1E8'; x.fillRect(0, 0, w, h);
    x.fillStyle = C.ink; x.textAlign = 'center'; let px = 46; x.font = `900 ${px}px ${GRAZIE}`; while (px > 18 && x.measureText(nome).width > w - 28) { px -= 2; x.font = `900 ${px}px ${GRAZIE}`; } x.fillText(nome, w / 2, 62);
    x.fillRect(14, 78, w - 28, 4); x.fillRect(14, 86, w - 28, 1.5);
    x.fillStyle = C.red; x.font = `700 25px ${A_MANO}`; x.fillText(quante + (quante === 1 ? ' notizia oggi' : ' notizie oggi'), w / 2, 122); x.textAlign = 'left';
    x.fillStyle = '#C3BEB2'; x.fillRect(14, 142, w - 28, 118); x.fillStyle = '#9A958A'; for (let i = 0; i < 9; i++) x.fillRect(14, 282 + i * 22, (i % 4 === 3 ? 0.6 : 1) * (w - 28), 9); });
  if (EDICOLA.length) { stanza.add(at(box(0.03, 0.05, 1.56, legnoScuro, 0.01), 0.035, 0.965, 1.75));   // l'asta a cui sono appesi, sotto il davanzale
    EDICOLA.forEach((t, i) => { const z = 1.75 + ((EDICOLA.length - 1) / 2 - i) * 0.3, g = gruppo(), f = stampa(0.26, 0.5, texTestata(t.nome, t.notizie)); f.rotation.y = PI / 2;
      const stecca = cyl(0.011, 0.011, 0.3, legno, 10); stecca.rotation.x = PI / 2; g.add(at(f, 0.014, -0.27, 0), at(stecca, 0.012, -0.012, 0)); g.rotation.x = (i % 2 ? 1 : -1) * 0.02; stanza.add(at(g, 0.05 + (i % 2) * 0.012, 0.945, z)); }); }

  // l'insegna luminosa col marchio, fra la finestra e la lavagna: sempre accesa
  const texInsegnaLogo = tela(820, 660, (x, w, h) => { x.fillStyle = '#FDFBF6'; x.fillRect(0, 0, w, h);
    const m = marchio(document.createElement('canvas').getContext('2d'), 0, 0, 100), S = Math.min((w - 150) / m.w, (h - 230) / m.h) * 100, x0 = (w - m.w * S / 100) / 2, y0 = (h - m.h * S / 100) / 2 + 34;
    [[C.red, 0], [C.yellow, 1], [C.blue, 2]].forEach(([c, i]) => { x.fillStyle = c; x.beginPath(); x.arc(x0 + 16 + i * 46, y0 - 36, 15, 0, 7); x.fill(); });
    marchio(x, x0, y0, S); });
  const zSc0 = bz - largaLav / 2, zSc1 = bz + largaLav / 2;   // da dove a dove va la lavagna
  { const z = (2.57 + zSc0 - 0.05) / 2, largo = 1.15, alto = largo * 660 / 820, luce = new THREE.Mesh(new THREE.PlaneGeometry(largo, alto), new THREE.MeshBasicMaterial({ map: texInsegnaLogo, toneMapped: false })); luce.rotation.y = PI / 2;
    stanza.add(at(box(0.07, alto + 0.07, largo + 0.07, nero, 0.015), 0.035, 1.75, z), at(luce, 0.0715, 1.75, z)); punto(0xFFF4DC, 4, 0.8, 1.75, z, 3.4); }

  // lo scaffale basso sotto la lavagna, con le annate
  const PROF_SC = 0.3, ALTO_SC = 0.6, ANNATE = STATO.annate || { mesi: [], totale: 0 };
  const scaffale = gruppo(); at(scaffale, 0.02 + PROF_SC / 2, 0, bz); stanza.add(scaffale);
  scaffale.add(at(box(PROF_SC, 0.03, largaLav, legno, 0.01), 0, ALTO_SC - 0.015, 0), at(box(PROF_SC, 0.03, largaLav, legno, 0.01), 0, 0.075, 0), at(box(PROF_SC - 0.03, 0.06, largaLav - 0.04, legnoScuro, 0.008), 0, 0.03, 0),
    ...[-1, -1 / 3, 1 / 3, 1].map(k => at(box(PROF_SC, ALTO_SC - 0.09, 0.025, legno, 0.008), 0, ALTO_SC / 2 + 0.03, k * (largaLav / 2 - 0.0125))), at(box(0.012, ALTO_SC - 0.09, largaLav, legnoScuro, 0.004), -PROF_SC / 2 + 0.006, ALTO_SC / 2 + 0.03, 0));
  const texDorso = (m, colore) => tela(150, 400, (x, w, h) => { x.fillStyle = colore; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFDF6'; rr(x, 12, 30, w - 24, 190, 8); x.fill(); x.fillStyle = C.ink; x.textAlign = 'center';
    x.font = `800 50px ${DISPLAY}`; x.fillText(m.etichetta, w / 2, 92); x.font = `800 74px ${DISPLAY}`; x.fillText(String(m.edizioni), w / 2, 178); x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `700 30px ${DISPLAY}`; x.fillText(m.anno, w / 2, 350); x.textAlign = 'left'; });
  { let z = largaLav / 2 - 0.05; const tinte = ['#F5C518', '#E01F3D', '#0E9CD8', '#F0821E'], muri = [largaLav / 6, -largaLav / 6];
    (ANNATE.mesi || []).forEach((m, i) => { const spesso = Math.max(0.09, m.edizioni * 0.011); for (const d of muri) if (z > d - 0.02 && z - spesso < d + 0.02) z = d - 0.03;   // non a cavallo di un divisorio
      const col = tinte[i % 4], et = stampa(0.085, 0.085 * 400 / 150, texDorso(m, col)); et.rotation.y = PI / 2;
      scaffale.add(at(box(0.24, 0.4, spesso, M(col, { roughness: 0.8 }), 0.008), 0.01, 0.09 + 0.2, z - spesso / 2), at(et, 0.132, 0.09 + 0.215, z - spesso / 2)); z -= spesso + 0.012; }); }
  // nell'ultimo scomparto e sopra: i giornali impilati, una rassegna aperta con l'evidenziatore, il cartoncino con il conto delle edizioni
  { const p1 = pilaGiornali(9, 3); p1.rotation.y = PI / 2 + 0.05; scaffale.add(at(p1, 0, 0.09, -largaLav / 2 + 0.32)); const p2 = pilaGiornali(6, 11); p2.rotation.y = PI / 2 - 0.08; scaffale.add(at(p2, 0, 0.09, -largaLav / 2 + 0.7));
    const p3 = pilaGiornali(5, 7); p3.rotation.y = PI / 2 + 0.1; scaffale.add(at(p3, 0, ALTO_SC, largaLav / 2 - 0.3)); const r = rassegna(61); r.rotation.y = PI / 2; r.scale.setScalar(0.8); scaffale.add(at(r, 0, ALTO_SC + 0.004, 0.15), at(evidenziatore(), 0.02, ALTO_SC, -0.2));
    if (ANNATE.totale) { const c = cavaliere(String(ANNATE.totale), 'edizioni in archivio', C.orange); c.rotation.y = PI / 4; scaffale.add(at(c, 0, ALTO_SC, -largaLav / 2 + 0.3)); }
    const pn = sansevieria(); pn.scale.setScalar(0.34); scaffale.add(at(pn, 0, ALTO_SC, -largaLav / 2 + 0.75)); }

