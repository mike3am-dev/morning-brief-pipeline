  /* ================================================================ a che punto è l'edizione
     È un giornale, non una radio: niente «in onda». Lo stato lo dice il muro, nel riquadro del conto alla rovescia:
       USCITA ALLE 5:57    verde: l'edizione di oggi è uscita
       IN CHIUSURA         rossa e lampeggiante: è l'ora della corsa e l'edizione di oggi non è ancora arrivata
       IN RITARDO          rossa fissa: l'ora è passata e l'edizione di oggi non c'è
       SI CHIUDE ALLE 6:00 grigia: è un giorno nuovo, la corsa deve ancora cominciare
     Sulla regia c'è solo una spia rossa, che si accende mentre si chiude. */
  const cupola = M(0xB3182D, { roughness: 0.3, emissive: 0xFF2038, emissiveIntensity: 0.05 });
  const spia = gruppo(at(cyl(0.05, 0.056, 0.02, alluminio, 20), 0, 0.01, 0), at(ombra(new THREE.Mesh(new THREE.SphereGeometry(0.043, 20, 10, 0, PI * 2, 0, PI / 2), cupola)), 0, 0.02, 0)); spia.position.y = TAV; sulAnello(spia, PI / 4 + 0.75, 0.88);
  const luceRossa = new THREE.PointLight(0xFF2038, 0, 4.5, 1.6); luceRossa.position.set(REGIA[0], 1.55, REGIA[1]); stanza.add(luceRossa);
  let edizioneForzata = null;
  function edizione() { if (edizioneForzata) return edizioneForzata;
    const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date()), h = oraDiRoma();
    return STATO.giorno === oggi ? 'uscita' : h >= 5.4 && h < 6.75 ? 'chiusura' : h >= 6.75 ? 'ritardo' : 'attesa'; }
  function insegnaViva(adesso) {   // restituisce la «fretta» della stanza: 1 di solito, 3 mentre si chiude
    const e = edizione(), lampo = e === 'chiusura' ? (Math.sin(adesso * 5.2) > -0.25 ? 1 : 0.22) : 1;
    cupola.emissiveIntensity = e === 'chiusura' ? 0.3 + 2.4 * lampo : e === 'ritardo' ? 1.6 : 0.05; luceRossa.intensity = e === 'chiusura' ? 7 * lampo : e === 'ritardo' ? 3 : 0;
    document.documentElement.dataset.edizione = e; return e === 'chiusura' ? 3 : 1; }

