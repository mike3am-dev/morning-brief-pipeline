  /* ================================================================ il giro */
  function ora() { const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, h = (d.getHours() % 12) + min / 60;
    secondi.rotation.z = -sec * PI / 30; minuti.rotation.z = -min * PI / 30; ore.rotation.z = -h * PI / 6; }
  luce('adesso'); ora(); conto(); vita(tempoGiro());
  pronta = true; renderer.render(scene, cam); etichette();
  let prima = 0;
  function giro(t) {
    requestAnimationFrame(giro);
    if (document.hidden || t - prima < 1000 / 31) return; prima = t;
    ascolto.k = fermo ? (ascolto.vivo ? 1 : 0) : ascolto.k + ((ascolto.vivo ? 1 : 0) - ascolto.k) * 0.09; if (!ascolto.vivo && ascolto.k < 0.002) { ascolto.k = 0; ascolto.chi = null; }
    if (!fermo) { vita(tempoGiro()); ora(); sporca = true; }
    if (conto()) sporca = true;
    segui();
    let muove = false; for (const c of ['x', 'y', 'zoom']) { const d = meta[c] - inq[c]; if (Math.abs(d) > 0.0005) { inq[c] += d * 0.16; muove = true; } else inq[c] = meta[c]; }
    if (muove) inquadra();
    if (!sporca) return; sporca = false;
    renderer.render(scene, cam); etichette(); primoPiano();
  }
  requestAnimationFrame(giro);
  // una maniglia per le prove: redazione.tempo(52) ferma la scena a quel secondo del giro, redazione.tempo(null) la fa ripartire
  window.redazione = { THREE, renderer, scene, solare, luce, apri, chiudi, GIRO, persone, ascolto, regole, stato: STATO, statoNuovo, adesso: adessoDi, orario: () => Object.fromEntries(Object.entries(cx).map(([id, c]) => [id, c.note.map(([t, n]) => Math.round(t) + ' ' + n)])),
    tempo(t) { tempoFermo = t; vita(tempoGiro()); renderer.render(scene, cam); etichette(); primoPiano(); },
    guarda(x, y, z, zoom = 3) { lascia(); const [a, b] = sulPiano(new THREE.Vector3(x, y, z)); Object.assign(meta, { x: a, y: b, zoom }); Object.assign(inq, meta); inquadra(); renderer.render(scene, cam); etichette(); },
    grande(si = true) { primoPiano(); if (!rend2) return; telaRitratto.style.cssText = si ? 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99;border-radius:0' : ''; rend2.setSize(si ? 1280 : 320, si ? 800 : 200, false); primoPiano(); },
    controlla() {   // passa tutto il giro: chi cammina dentro un mobile, e chi si pesta i piedi
      const dentro = {}, urti = {}; for (let T = 0; T < GIRO; T += 0.25) { vita(T); const ids = Object.keys(persone);
        ids.forEach(id => { const g = persone[id], s = posti[id].seduta; if (Math.hypot(g.position.x - s[0], g.position.z - s[1]) > 0.75 && muri[casella(g.position.x, g.position.z)]) (dentro[id] = dentro[id] || []).push(Math.round(T) + ':' + g.position.x.toFixed(1) + ',' + g.position.z.toFixed(1)); });
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const a = persone[ids[i]].position, b = persone[ids[j]].position; if (Math.hypot(a.x - b.x, a.z - b.z) < 0.42) { const k = ids[i] + '+' + ids[j]; (urti[k] = urti[k] || []).push(Math.round(T)); } } }
      const stringi = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...new Set(v)].slice(0, 12).join(' ')])); vita(tempoGiro()); return { dentro: stringi(dentro), urti: stringi(urti) }; },
    casa() { lascia(); Object.assign(meta, CASA); Object.assign(inq, meta); inquadra(); renderer.render(scene, cam); etichette(); } };
  canvas.addEventListener('webglcontextlost', e => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => { sporca = true; });
}
