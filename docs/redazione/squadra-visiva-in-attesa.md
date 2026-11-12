# La squadra visiva e il kit — in attesa

Tolta dal brief della redazione la sera dell'11 novembre 2026 (Mike: «qui ci concentriamo SOLO sulla
creazione della redazione virtuale»). Resta qui, intera, per quando si riprende.

Il visualista, intervistato l'11 novembre, si è dato **5/10**:

- passo per passo ripetuto cinque giorni su sei;
- scelte forzate: Harbor che è un'architettura, il flusso dei soldi senza soldi, scale non
  paragonabili sul Duo;
- **4 aperture su 8 senza grafico**, perché nel kit mancano i tipi;
- un'ottantina di richieste aperte.

Le sue priorità, che Mike ha accettato:

1. ⭐ **la schermata viva**: tastiera, schermata di blocco, Impostazioni, barra del Mac, con i
   gesti da provare;
2. ⭐ **il dossier della saga**: Duo, HomeView, MacBook touch, che crescono giorno dopo giorno
   dai fili (`thread`) e dall'archivio;
3. ⭐ **«chi dice cosa»** e la **linea del tempo di più anni**.

Poi: plancia di stato, serbatoio, video al secondo giusto, mappe, 3D.

**Vincoli:**

- **Niente account sviluppatore Apple**, quindi niente MapKit. Le mappe si fanno con:
  - Natural Earth (pubblico dominio, disegnata dentro l'app);
  - OpenFreeMap (strade, senza chiave);
  - Sentinel-2 cloudless (una delle annate è libera anche per uso commerciale, le altre solo
    per uso non commerciale).
- **Video**: lettore YouTube incorporato con inizio e fine.
- **3D**: Quick Look AR sui modelli che Apple pubblica (da verificare quali ci sono) e il Duo
  stilizzato esteso.
- **Il kit si costruisce con Fable** (codice dei tipi in `pipeline/template.html` + manuale in
  `pipeline/visivi.py` con il sì, il no, i dati e un esempio vero). Dopo le tre settimane gli
  agenti su Opus lo riempiono di soli dati.
- **La squadra lavora in parallelo alla redazione, non dopo**:
  - finita la lettura (circa al minuto 20), uno script prepara una scheda per ciascuna delle 6
    notizie più forti;
  - 3–5 costruttori lavorano in background, 15 minuti al massimo ciascuno;
  - ognuno scrive il suo file, mai l'edizione (come `ai`, `schede`, `gta`);
  - le scene si agganciano alla notizia tramite il link dell'articolo;
  - un direttore artistico boccia quello che non spiega, e si ripubblica.
- **Tetto della corsa: 60 minuti.** Le corse dell'8–11 novembre durano 25–29: c'è spazio.
