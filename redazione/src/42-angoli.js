  /* ================================================================ la bacheca, l'archivio di Zeno, il tavolo di Mike */
  const cliccabili = [];
  // la bacheca di sughero: i post-it che aspettano Mike (si tocca, e si apre l'elenco)
  const BACHECA = [0.05, 1.45, 6.5], altaB = 1.5 * 700 / 900;
  const bacheca = stampa(1.5, altaB, texBacheca); bacheca.rotation.y = PI / 2; at(bacheca, 0.052, BACHECA[1], BACHECA[2]); bacheca.userData.id = 'bacheca'; cliccabili.push(bacheca);
  stanza.add(at(box(0.045, altaB + 0.09, 1.59, legnoScuro, 0.015), 0.024, BACHECA[1], BACHECA[2]), bacheca);
  const nuovoPostit = stampa(0.13, 0.13, texNuovoPostit); nuovoPostit.rotation.set(0, PI / 2, 0.07); nuovoPostit.visible = false; stanza.add(at(nuovoPostit, 0.058, 1.39, 5.84));

  // l'archivio delle fonti: due schedari, e la targhetta di Zeno, che c'è il lunedì
  const ARCHIVIO = [0.3, 7.82];
  const verdeSalvia = M(0x5E7F6B, { roughness: 0.6 });
  const cassetti = [];
  [7.55, 8.09].forEach((z, i) => { stanza.add(at(box(0.56, 1.24, 0.5, verdeSalvia, 0.025), ARCHIVIO[0], 0.62, z));
    const f = stampa(0.48, 1.2, texCassetti); f.rotation.y = PI / 2; stanza.add(at(f, ARCHIVIO[0] + 0.283, 0.62, z));
    if (i === 0) { const c = at(box(0.4, 0.26, 0.44, M(0x6E917B, { roughness: 0.6 }), 0.015), ARCHIVIO[0] + 0.1, 1.07, z); c.visible = false; stanza.add(c); cassetti.push(c); } });
  stanza.add(at(gruppo(...[0, 1, 2, 3].map(i => at(box(0.05, 0.3, 0.24, M([0xF5C518, 0xE01F3D, 0x0E9CD8, 0xF0821E][i], { roughness: 0.8 }), 0.008), 0, 0.15, i * 0.058))), 0.26, 1.24, 7.42));
  const scatola = at(box(0.36, 0.2, 0.3, M(0xD9B98A, { roughness: 0.9 }), 0.012), 0.3, 1.34, 8.1); scatola.rotation.y = 0.2; stanza.add(scatola);
  const targaZeno = stampa(0.5, 0.5 * 220 / 360, texTarga('ZENO', LUNEDI ? 'oggi ci sono' : 'torna lunedì', '#2F7A4C')); targaZeno.rotation.set(0, PI / 2, -0.04); targaZeno.userData.id = 'fonti'; cliccabili.push(targaZeno);
  stanza.add(at(targaZeno, 0.02, 1.95, 7.82), at(sph(0.014, M(0xE01F3D)), 0.03, 2.085, 7.82));

