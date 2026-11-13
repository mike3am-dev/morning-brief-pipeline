  /* ================================================================ rotella, trascinamento, clic */
  const raggio = new THREE.Raycaster(), ndc = new THREE.Vector2(); let presa = null;
  const chiSotto = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raggio.setFromCamera(ndc, cam); const colpi = raggio.intersectObjects([...Object.values(persone), ...cliccabili], true); if (!colpi.length) return null;
    let o = colpi[0].object; while (o && !o.userData.id) o = o.parent; return o ? o.userData.id : null; };
  canvas.addEventListener('wheel', e => {
    e.preventDefault(); lascia(); const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) / ppu, dy = -(e.clientY - r.top - r.height / 2) / ppu;
    const z0 = meta.zoom, z1 = Math.min(7, Math.max(1, z0 * Math.exp(-e.deltaY * 0.0016)));
    meta.x += dx / z0 - dx / z1; meta.y += dy / z0 - dy / z1; meta.zoom = z1;
    if (z1 === 1) { meta.x = CASA.x; meta.y = CASA.y; }
  }, { passive: false });
  canvas.addEventListener('pointerdown', e => { presa = { x: e.clientX, y: e.clientY, mosso: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!presa) { const id = chiSotto(e); canvas.classList.toggle('mano', !!id); for (const k in tags) tags[k].classList.toggle('vicino', k === id); return; }
    const dx = e.clientX - presa.x, dy = e.clientY - presa.y; presa.mosso += Math.abs(dx) + Math.abs(dy); if (presa.mosso > 6) { canvas.classList.add('presa'); lascia(); }
    presa.x = e.clientX; presa.y = e.clientY; meta.x -= dx / (ppu * inq.zoom); meta.y += dy / (ppu * inq.zoom); inq.x = meta.x; inq.y = meta.y; inquadra(); });
  canvas.addEventListener('pointerup', e => { canvas.classList.remove('presa'); const p = presa; presa = null; if (!p || p.mosso > 6) return; const id = chiSotto(e); if (id) apri(id); else if (aperto) chiudi(); });
  canvas.addEventListener('dblclick', () => { if (aperto) chiudi(); else Object.assign(meta, CASA); });

