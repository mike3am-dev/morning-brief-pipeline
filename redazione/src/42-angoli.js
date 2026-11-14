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

  // il tavolo di Mike: quando entri in redazione, il tuo posto è questo
  const MIKE = [2.25, 7.3];
  const tavoloMike = gruppo(at(cyl(0.62, 0.62, 0.05, legno, 48), 0, TAV - 0.025, 0), at(cyl(0.05, 0.06, TAV - 0.07, bianco, 16), 0, (TAV - 0.07) / 2, 0), at(cyl(0.3, 0.32, 0.03, bianco, 32), 0, 0.015, 0));
  const ipad = gruppo(at(box(0.25, 0.012, 0.18, M(0x2A2B30, { roughness: 0.4 }), 0.005), 0, 0.006, 0), (() => { const s = schermo(0.23, 0.106, texFondale); s.rotation.x = -PI / 2; s.position.y = 0.0125; return s; })());
  ipad.rotation.y = 0.5; tavoloMike.add(at(ipad, 0.12, TAV, 0.14), at(tazza(C.yellow, 0.6), -0.26, TAV, 0.02));
  const segnaposto = gruppo(...[-1, 1].map(s => { const f = stampa(0.2, 0.2 * 220 / 360, texTarga('MIKE', 'direttore creativo')); f.material.side = THREE.DoubleSide; f.rotation.x = -s * 0.42; f.rotation.y = s > 0 ? 0 : PI; f.position.set(0, 0.058, s * 0.024); return f; }));
  segnaposto.rotation.y = PI / 4; tavoloMike.add(at(segnaposto, -0.05, TAV, -0.3));
  // il registro delle decisioni: un libro verde sul tavolo. Tutto il tavolo si tocca, e apre il registro
  const texRegistro = tela(256, 340, (x, w, h) => { x.fillStyle = '#1F5A3C'; x.fillRect(0, 0, w, h); x.strokeStyle = '#D9A93B'; x.lineWidth = 6; x.strokeRect(16, 16, w - 32, h - 32);
    x.fillStyle = '#F3E3B0'; x.textAlign = 'center'; x.font = `800 42px ${DISPLAY}`; spazia(x, 0.1, 42); x.fillText('REGISTRO', w / 2 + 2, 150); x.font = `700 21px ${DISPLAY}`; x.fillText('DELLE DECISIONI', w / 2 + 2, 188); spazia(x, 0, 1); x.textAlign = 'left'; });
  const copertina = M(0x1F5A3C, { roughness: 0.7 });
  const libro = gruppo(at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.003, 0), at(box(0.186, 0.024, 0.258, M(0xF3EBDD, { roughness: 0.9 }), 0.002), 0.004, 0.018, 0), at(box(0.2, 0.006, 0.27, copertina, 0.002), 0, 0.033, 0), at(box(0.012, 0.036, 0.27, copertina, 0.004), -0.094, 0.018, 0),
    (() => { const s = stampa(0.19, 0.255, texRegistro); s.rotation.x = -PI / 2; s.position.y = 0.0365; return s; })(), at(cyl(0.005, 0.005, 0.15, M(0xE01F3D, { roughness: 0.4 }), 8), 0.14, 0.006, 0.02));
  libro.children[libro.children.length - 1].rotation.x = PI / 2; libro.rotation.y = -0.35; tavoloMike.add(at(libro, 0.3, TAV, -0.16));
  tavoloMike.userData.id = 'decisioni'; cliccabili.push(tavoloMike);
  at(tavoloMike, MIKE[0], 0, MIKE[1]); stanza.add(tavoloMike);
  const poltrona = M(0xF5C518, { roughness: 0.85 });
  [-0.2, PI / 2 + 0.25].forEach(dove => { const s = sedia(poltrona); s.rotation.y = dove + PI; at(s, MIKE[0] + Math.sin(dove) * 0.98, 0, MIKE[1] + Math.cos(dove) * 0.98); stanza.add(s); });

