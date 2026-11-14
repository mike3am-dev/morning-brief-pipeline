  /* ================================================================ le cose che si toccano: i post-it per Mike, l'archivio di Zeno */
  const cliccabili = [], aloni = {};
  let sottoMano = null;   // l'id di quello che c'è sotto il mouse (85-comandi.js)
  // un chiarore giallo che compare quando passi sopra a una cosa che si apre
  const alone = (id, w, h, forza = 0.85) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xF5C518, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    m.visible = false; m.userData.forza = forza; aloni[id] = m; return m; };
  function aloniVivi(adesso) { for (const id in aloni) { const m = aloni[id], meta = id === sottoMano ? m.userData.forza * (0.78 + 0.22 * Math.sin(adesso * 5)) : 0, ora = m.material.opacity;
    if (Math.abs(meta - ora) < 0.004) continue; m.material.opacity = ora + (meta - ora) * 0.3; m.visible = m.material.opacity > 0.01; sporca = true; } }

  // i post-it che aspettano Mike: la parte destra della lavagna (si tocca, e si apre l'elenco)
  bacheca.userData.id = 'bacheca'; cliccabili.push(bacheca);
  { const a = alone('bacheca', (LAV.W - LAV.X0) * PXL, altaLav, 0.16); a.rotation.y = PI / 2; stanza.add(at(a, 0.049, 1.6, bacheca.position.z)); }
  const DOVE_POSTIT = suLavagna(...CASELLE[8]);   // la casella libera, dove Lea attacca il suo
  const nuovoPostit = stampa(0.3, 0.3, texNuovoPostit); nuovoPostit.rotation.set(0, PI / 2, 0.07); nuovoPostit.visible = false; stanza.add(at(nuovoPostit, 0.056, DOVE_POSTIT[0], DOVE_POSTIT[1]));

  // l'archivio: due schedari. Ci lavorano accanto Zeno (le fonti) e Clio (le storie), che ogni tanto ci vanno a cercare
  const ARCHIVIO = [0.3, 8.09];   // dove ci si mette davanti: il secondo schedario
  const verdeSalvia = M(0x5E7F6B, { roughness: 0.6 });
  const cassetti = [];
  [7.55, 8.09].forEach((z, i) => { stanza.add(at(box(0.56, 1.24, 0.5, verdeSalvia, 0.025), ARCHIVIO[0], 0.62, z));
    const f = stampa(0.48, 1.2, texCassetti); f.rotation.y = PI / 2; stanza.add(at(f, ARCHIVIO[0] + 0.283, 0.62, z));
    if (i === 1) { const c = at(box(0.4, 0.26, 0.44, M(0x6E917B, { roughness: 0.6 }), 0.015), ARCHIVIO[0] + 0.1, 1.07, z); c.visible = false; stanza.add(c); cassetti.push(c); } });
  // quattro faldoni in piedi, uno accanto all'altro (prima erano uno dentro l'altro, e sfarfallavano)
  stanza.add(at(gruppo(...[0, 1, 2, 3].map(i => at(box(0.24, 0.3, 0.052, M([0xF5C518, 0xE01F3D, 0x0E9CD8, 0xF0821E][i], { roughness: 0.8 }), 0.008), 0, 0.15, i * 0.058))), 0.28, 1.24, 7.42));
  const scatola = at(box(0.36, 0.2, 0.3, M(0xD9B98A, { roughness: 0.9 }), 0.012), 0.3, 1.34, 8.1); scatola.rotation.y = 0.2; stanza.add(scatola);

