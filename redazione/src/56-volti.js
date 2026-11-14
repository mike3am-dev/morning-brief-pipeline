  /* ================================================================ i tredici: l'aspetto di ciascuno */
  const ASPETTO = {
    regia:      { vestito: 'giacca', chioma: 'caschetto', pelle: 0xF4CDB0, capelli: 0xB5532A, sopracciglia: 0x8A3F1E, calzoni: 0xE9E2D2, scarpe: 0xB07A4A, suola: 0x2A2B30, ciglia: true, labbra: 0xB8404F, accessori: a => { orecchini(a); spilla(a); } },
    lettura:    { vestito: 'denim', chioma: 'spettinato', pelle: 0xF0C09C, capelli: 0x7A4A2B, calzoni: 0x2A2B30, scarpe: 0xF4F1EA, barba: 'corta', barbaColore: 0x6B4127 },
    redattore:  { vestito: 'quadri', chioma: 'onda', pelle: 0xF2C6A6, capelli: 0x4A2F22, calzoni: 0x2C3554, scarpe: 0xF4F1EA },
    revisore:   { vestito: 'cardigan', chioma: 'stempiato', pelle: 0xE2AE8C, capelli: 0xC9C9CE, sopracciglia: 0x9A9AA0, calzoni: 0x4A4B52, scarpe: 0x6B4A32, suola: 0x2A2B30, occhiali: 0x8A6A2F, baffi: true },
    visualista: { vestito: 'dolcevita', chioma: 'frangia', pelle: 0xF6D5BE, capelli: 0x1B1B20, calzoni: 0x3A3B42, scarpe: 0x17181B, suola: 0xF5C518, occhiali: 0x17181B, lenti: 0.057, ciglia: true, labbra: 0xC2495A },
    ai:         { vestito: 'maglione', chioma: 'ricci', pelle: 0xB47B55, capelli: 0x2A1A14, calzoni: 0x3E5C8A, scarpe: 0xF4F1EA, ciglia: true, labbra: 0x8E3B3F },
    schede:     { vestito: 'righe', chioma: 'lunghi', pelle: 0xEEC29E, capelli: 0xD9A441, sopracciglia: 0xA9772B, calzoni: 0x3A3350, scarpe: 0xF4F1EA, ciglia: true, labbra: 0xC2495A, accessori: cerchietto },
    gta:        { vestito: 'bomber', chioma: 'corti', pelle: 0xD9A47C, capelli: 0x1F1A1A, calzoni: 0x8FB3D9, scarpe: 0x3FE0D0, accessori: cuffie },
    fonti:      { vestito: 'gilet', chioma: 'pelato', pelle: 0xE9B796, capelli: 0xF1F1F1, sopracciglia: 0xDADADA, calzoni: 0x6B4A32, scarpe: 0x3A2A22, suola: 0x2A2B30, occhiali: 0x4B4D53, barba: 'lunga', barbaColore: 0xF4F4F4, accessori: farfallino },
    // i quattro arrivati il 14 novembre 2026
    verifica:   { vestito: 'blazer', chioma: 'caschetto', pelle: 0xF1C7A5, capelli: 0x2E1C14, sopracciglia: 0x23150F, calzoni: 0x2A2B30, scarpe: 0x17181B, suola: 0x2A2B30, occhiali: 0xC8344A, lenti: 0.054, ciglia: true, labbra: 0xB8404F, accessori: orecchini },
    foto:       { vestito: 'multitasche', chioma: 'pelato', pelle: 0x8A5A3C, capelli: 0x1B1512, sopracciglia: 0x1B1512, calzoni: 0x3A3B42, scarpe: 0x6B4A32, suola: 0x2A2B30, barba: 'corta', barbaColore: 0x1B1512, accessori: macchinaFoto },
    rete:       { vestito: 'felpa', chioma: 'corti', pelle: 0xF3CBA8, capelli: 0xC4622D, sopracciglia: 0xA9501F, calzoni: 0x2C3554, scarpe: 0xF4F1EA, barba: 'corta', barbaColore: 0xB5562A },
    memoria:    { vestito: 'golf', chioma: 'lunghi', pelle: 0xEFC4A4, capelli: 0xD9D9DE, sopracciglia: 0xA9A9B0, calzoni: 0x4A4B52, scarpe: 0x3A2A22, suola: 0x2A2B30, occhiali: 0xD9A93B, ciglia: true, labbra: 0xB8404F, accessori: orecchini },
  };
  const persone = {};
  for (const id of Object.keys(ASPETTO)) { if (id === 'fonti' && !LUNEDI) continue; persone[id] = persona({ id, ...ASPETTO[id] }); stanza.add(persone[id]); }
  const ettore = persone.redattore, ivo = persone.revisore, mano = id => persone[id].userData.j.mD;

  // gli oggetti che passano di mano
  for (const id of Object.keys(TAZZE)) { tazzeMano[id] = tazza(TAZZE[id], 0); tazzeMano[id].visible = false; mano(id).add(at(tazzeMano[id], 0, -0.085, 0.06)); }
  const penna = cyl(0.007, 0.007, 0.14, M(0xE01F3D, { roughness: 0.4 }), 8); penna.rotation.x = 1.9; mano('revisore').add(at(penna, 0, -0.03, 0.055));
  const foglioMano = stampa(0.21, 0.297, foglio(5)); foglioMano.material.side = THREE.DoubleSide; foglioMano.visible = false; mano('revisore').add(at(foglioMano, 0, -0.06, 0.13));
  const canMano = annaffiatoio(); canMano.visible = false; mano('revisore').add(at(canMano, 0, -0.15, 0.03));
  const foglioRita = stampa(0.21, 0.297, foglio(52, true)); foglioRita.material.side = THREE.DoubleSide; foglioRita.visible = false; mano('schede').add(at(foglioRita, 0, -0.06, 0.13));
  const foglioDiRita = stampa(0.21, 0.297, foglio(52, true)); foglioDiRita.rotation.set(-PI / 2, 0, 0.2); foglioDiRita.visible = false; posti.schede.g.add(at(foglioDiRita, 0.36, TAV + 0.003, 0.16));
  const stilo = cyl(0.006, 0.004, 0.15, M(0xFBFAF7, { roughness: 0.3 }), 8); stilo.rotation.x = 1.9; mano('visualista').add(at(stilo, 0, -0.03, 0.055));
  const postitMano = stampa(0.11, 0.11, texNuovoPostit); postitMano.material.side = THREE.DoubleSide; postitMano.visible = false; mano('visualista').add(at(postitMano, 0, -0.07, 0.07));
  // il gamepad di Vito, davanti al petto; la tavoletta di Olivia, nella sinistra
  const gamepad = gruppo(box(0.17, 0.04, 0.085, bianco, 0.018), at(ell(0.034, 1, 1.25, 1, bianco), -0.075, -0.018, 0.02), at(ell(0.034, 1, 1.25, 1, bianco), 0.075, -0.018, 0.02),
    at(cyl(0.014, 0.014, 0.012, M(SCURO), 12), -0.04, 0.024, 0.008), at(cyl(0.014, 0.014, 0.012, M(SCURO), 12), 0.04, 0.024, 0.02), at(sph(0.008, M(0x3FE0D0)), 0.058, 0.024, -0.012), at(sph(0.008, M(0xFF5DA2)), 0.04, 0.024, -0.024));
  gamepad.rotation.x = -0.5; gamepad.visible = false; persone.gta.userData.j.busto.add(at(gamepad, 0, 0.275, 0.3));
  const tavoletta = gruppo(box(0.17, 0.24, 0.012, M(0x2A2B30, { roughness: 0.4 }), 0.008), at(stampa(0.15, 0.21, texLista), 0, 0, 0.0068));
  tavoletta.rotation.set(-0.5, 0.25, 0); persone.regia.userData.j.mS.add(at(tavoletta, -0.03, -0.02, 0.1));
  const cartella = box(0.03, 0.24, 0.3, M(0xF5C518, { roughness: 0.8 }), 0.008); cartella.visible = false; if (persone.fonti) mano('fonti').add(at(cartella, 0, -0.1, 0.1));
  // la cornetta di Nora, nella sinistra: la verifica si fa anche al telefono
  const cornetta = box(0.034, 0.13, 0.016, M(0x17181B, { roughness: 0.4 }), 0.008); cornetta.visible = false; persone.verifica.userData.j.mS.add(at(cornetta, 0, -0.03, 0.05));

