  /* ================================================================ sulle scrivanie: taccuini, microfoni, post-it, tesserini */
  const sul = (id, o, x, z, giro = 0) => { o.rotation.y += giro; posti[id].g.add(at(o, x, TAV, z)); return o; };
  sul('redattore', taccuino(3), -0.3, 0.27, 0.15); sul('redattore', registratore(), -0.27, -0.02, -0.4);
  sul('ai', taccuino(5), -0.3, 0.27, -0.1); sul('ai', microfono(0xE01F3D), -0.28, -0.04, 0.5);
  sul('schede', taccuino(7), -0.31, 0.26, 0.2); sul('gta', microfono(0xFF5DA2), 0.3, -0.06, -0.6); sul('gta', registratore(), -0.28, 0.02, 0.3);
  sul('lettura', evidenziatore(), 0.34, 0.06, 0.8); sul('lettura', evidenziatore(0xFF8AC0), 0.3, 0.1, 0.3); sul('revisore', evidenziatore(0xFF6B6B), -0.3, 0.26, -0.5);
  // sulla regia: un taccuino e un registratore fra gli schermi, e una rassegna aperta
  const taccuinoRegia = taccuino(9); taccuinoRegia.position.y = TAV; sulAnello(taccuinoRegia, FRONTE - 0.37, 0.74);
  const recRegia = registratore(); recRegia.position.y = TAV; sulAnello(recRegia, FRONTE + 0.36, 0.72, 0.4);

  /* I post-it sulle cornici degli schermi hanno un colore che vuol dire qualcosa: gialli le cose che quell'agente ha
     lasciato in bacheca per Mike, rossi quelle che aspettano da più di un mese, verdi le decisioni che Mike ha preso
     con lui (compaiono quando ne salva una). */
  const noteVerdi = {};
  function noteSulloSchermo(id, base, retro) {   // base: un gruppo con l'origine ai piedi dello schermo, rivolto come lui; retro: attaccati dietro (chi sta in fondo all'isola)
    const zN = retro ? -0.0115 : 0.011, giroN = retro ? PI : 0, lato = retro ? -1 : 1;
    const suoi = (STATO.postit || []).filter(p => p.da === id).slice(0, 4);
    suoi.forEach((p, k) => { const urgente = (p.giorni || 0) > 30, n = stampa(0.075, 0.075, texNota(urgente ? C.red : '#FFE45C', urgente ? ['da ' + p.giorni, 'giorni'] : p.mazzo ? [String(p.mazzo), 'richieste'] : []));
      n.rotation.set(0, giroN, (k % 2 ? 1 : -1) * 0.08); n.castShadow = false; base.add(at(n, lato * 0.262, 0.5 - k * 0.088, zN)); });
    noteVerdi[id] = [0, 1, 2].map(k => { const n = stampa(0.075, 0.075, texNota('#1F5A3C', ['deciso', 'con Mike'])); n.rotation.set(0, giroN, (k % 2 ? -1 : 1) * 0.07); n.castShadow = false; n.visible = false; base.add(at(n, -lato * 0.262, 0.5 - k * 0.088, zN)); return n; });
  }
  for (const id of Object.keys(posti)) { if (posti[id].inPiedi) continue; const base = gruppo(); at(base, 0, TAV, -0.18); posti[id].g.add(base); noteSulloSchermo(id, base, !!posti[id].giro); }
  { const base = gruppo(); at(base, Math.sin(FRONTE) * 0.92, TAV, Math.cos(FRONTE) * 0.92); base.rotation.y = FRONTE + PI; regiaG.add(base); noteSulloSchermo('regia', base); }
  const aggiornaNoteVerdi = quante => { for (const id in noteVerdi) noteVerdi[id].forEach((n, k) => { n.visible = k < (quante[id] || 0); }); };

  // i tesserini: chi esce a cercare notizie lo porta al collo; quello di Ettore pende dalla sua sedia
  function tesserino(nome, colore) { const g = gruppo(), cordino = M(colore, { roughness: 0.8 }), c = stampa(0.062, 0.088, texBadge(nome, colore)); c.rotation.x = -0.14;
    g.add(asta([-0.062, 0.432, 0.052], [0, 0.31, 0.126], 0.004, cordino), asta([0.062, 0.432, 0.052], [0, 0.31, 0.126], 0.004, cordino), at(c, 0, 0.262, 0.1295)); return g; }
  [['lettura', '#0E9CD8'], ['ai', '#E01F3D'], ['schede', '#7B4BE0'], ['gta', '#17181B'], ['regia', '#F0821E']].forEach(([id, col]) => { if (persone[id]) persone[id].userData.j.busto.add(tesserino(AGENTI[id].nome, col)); });
  { const c = stampa(0.062, 0.088, texBadge(AGENTI.redattore.nome, '#F0821E')); c.rotation.y = PI; c.rotation.z = 0.12; posti.redattore.sedia.add(at(c, 0.13, SED + 0.36, -0.272), asta([0.13, SED + 0.56, -0.24], [0.13, SED + 0.4, -0.27], 0.004, M(0xF0821E)), asta([0.1, SED + 0.565, -0.2], [0.13, SED + 0.56, -0.24], 0.004, M(0xF0821E))); }

