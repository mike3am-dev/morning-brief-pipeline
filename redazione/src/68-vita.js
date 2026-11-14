  /* ================================================================ la scena a un dato secondo del giro */
  const adessoDi = (id, t) => { const c = cx[id]; if (!c) return ''; if (id === 'gta' && gestoVitoOra) return gestoVitoOra; let s = c.nota0; for (const [q, testo] of c.note) if (q <= t) s = testo; return s; };
  let tempoFermo = fermo ? 8 : null;
  const tempoGiro = () => tempoFermo != null ? tempoFermo : (Date.now() / 1000) % GIRO;
  const inManoTutti = [foglioMano, canMano, foglioRita, postitMano, gamepad, penna, stilo, cartella, pallina, foglioStampante, cassetti[0], cornetta];
  function vita(T) {
    // lo stato delle cose, prima dei gesti: ogni gesto poi accende quello che tocca
    for (const o of inManoTutti) o.visible = false; for (const id in tazzeMano) tazzeMano[id].visible = false; ripristinaVito(); gestoVitoOra = null;
    spiaCaffe.emissiveIntensity = 0.6; spiaStampa.emissiveIntensity = 0.5;
    for (const id in cx) cx[id].tr.a(T);
    compone(T);
    Object.values(persone).forEach((g, i) => { const chiusi = Math.min(((T + i * 1.7) % (3.6 + (i % 3) * 0.5)) < 0.14 ? 0.1 : 1, 1 - 0.9 * (g.userData.chiudi || 0)); g.userData.occhi.forEach(o => { o.scale.y = chiusi; }); });   // battono le palpebre
    for (const id in tazze) tazze[id].visible = !tazzeMano[id].visible; canTerra.visible = !canMano.visible; penneNelBicchiere[0].visible = penneNelBicchiere[1].visible = !OGGETTI_VITO.bacchette[0].visible;
    foglioDaIvo.visible = T > tConsegna + 3.4; pallinaNelCestino.visible = T > tLancio + 2.9; foglioDiRita.visible = T > tRitaTorna; nuovoPostit.visible = T > tPostit;
    const ordine = dolce((T - tRiordino) / 6); bozzeIvo.forEach(f => { f.rotation.z = f.userData.r * (1 - ordine); });
    const versa = T > tAnnaffia + 1.2 && T < tAnnaffia + 4.4;
    gocce.forEach((g, i) => { g.visible = versa; if (versa) { const u = (T * 1.7 + i / 3) % 1; g.position.set(pPianta[0] + 0.15 - 0.08 * u, 0.86 - 0.4 * u * u - 0.06 * u, pPianta[1] - 0.5 - 0.12 * u); } });
  }

