#!/usr/bin/env python3
"""
La voce: l'approfondimento letto ad alta voce, come file audio vero.

"Ascolta" nell'app usava la voce del browser. Su iPhone ha due difetti che non
si aggirano da una pagina web: con lo schermo bloccato si ferma, e con il
telefono in silenzioso a volte non si sente proprio (30 settembre 2026: "parte
l'animazione ma non sento niente"). Un file audio vero, suonato da un normale
elemento <audio>, non ha nessuno dei due problemi: continua in tasca, a schermo
spento, con i comandi sulla schermata di blocco.

Il file lo fa Piper, un motore di sintesi vocale open source che gira in locale,
senza chiavi e senza servizi a pagamento. La voce e' "paola", italiana. Il
testo letto e' lo stesso che leggeva il browser: titolo, il punto, le
didascalie dei grafici, cosa c'e' sotto, le tappe, chi lo dice, cosa aspettarsi.

Il file va su Supabase Storage (bucket pubblico "brief-audio") e l'indirizzo
finisce nell'edizione, dentro l'approfondimento:

    "audio": {"url": "…/2026-09-30/iphone-duo-yield-produzione-3f2a9c1b7d4e.m4a",
              "durata": 142, "voce": "paola", "impronta": "3f2a9c1b7d4e"}

L'impronta e' quella del testo: se l'approfondimento non cambia, il file non si
rifa'. E sta nel nome del file: un testo corretto e' un indirizzo nuovo, perche'
il file si tiene in cache per un anno e l'iPhone continuerebbe a suonare quello
vecchio. La prima corsa scarica Piper (una decina di secondi) e la voce (63 MB),
e li tiene in .cache/ per le volte successive.

    python3 pipeline/audio.py                 l'edizione di oggi
    python3 pipeline/audio.py 2026-09-30
    python3 pipeline/audio.py --dry           genera in locale, non carica e non scrive
    python3 pipeline/audio.py --force         rifa' anche i file gia' fatti
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C
from push import load_config, service_key

CACHE = os.path.join(C.ROOT, ".cache", "piper")
VENV = os.path.join(CACHE, "venv")
# Le voci italiane di Piper provate il 30 settembre 2026. "paola" e' veloce
# (dieci secondi per approfondimento); "serena" e' di qualita' piu' alta, ha
# una licenza piu' pulita (CC-BY 4.0, addestrata da zero, va citata) ma e'
# sei volte piu' lenta. La scelta e' di Mike, a orecchio.
VOICES = {
    "paola": ("it_IT-paola-medium", "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/"),
    "serena": ("it_IT-serena-high", "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/serena/high/"),
}
DEFAULT_VOICE = "paola"
# quanti giorni restano gli audio su Storage: 1 GB gratuito, condiviso con altre app
KEEP_DAYS = 30
BUCKET = "brief-audio"
# Entra nell'impronta: si alza quando cambia il modo di dire il testo
# (speakable, le pause), cosi' la corsa dopo rifa' i file da sola.
RESA = 2
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
        "agosto", "settembre", "ottobre", "novembre", "dicembre"]


# ------------------------------------------------------------------ il testo

def spoken_date(d):
    d = str(d or "")
    if re.match(r"^\d{4}-\d{2}$", d):
        return f"{MESI[int(d[5:7]) - 1]} {d[:4]}"
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", d)
    return f"{int(m.group(3))} {MESI[int(m.group(2)) - 1]}" if m else d


def script(news):
    """Lo stesso copione di "Ascolta" nell'app, parola per parola."""
    a = news.get("approfondimento") or {}
    parts = [news.get("title", "") + "."]
    if a.get("punto"):
        parts.append(a["punto"])
    for v in a.get("visivi") or []:
        if v.get("didascalia"):
            parts.append(v["didascalia"])
    if a.get("sotto"):
        parts.append("Cosa c'è sotto.")
        parts += list(a["sotto"])
    if a.get("tappe"):
        parts.append("Come ci siamo arrivati.")
        for t in a["tappe"]:
            art = "A " if re.match(r"^\d{4}-\d{2}$", str(t.get("data"))) else "Il "
            parts.append(f"{art}{spoken_date(t.get('data'))}: {t.get('testo', '')}")
    if a.get("fonti"):
        parts += ["Chi lo dice.", a["fonti"]]
    if a.get("dopo"):
        parts.append("Cosa aspettarsi.")
        for d in a["dopo"]:
            parts.append((f"Il {spoken_date(d['data'])}: " if d.get("data") else "") + d.get("testo", ""))
    parts.append("Fine dell'approfondimento.")
    return [p for p in parts if p and p.strip()]


def _dollari(m):
    num, scala = m.group(1), m.group(2)
    # "$1,299" all'americana: la virgola e' delle migliaia, non dei decimali
    if re.fullmatch(r"\d{1,3}(,\d{3})+", num):
        num = num.replace(",", "")
    num = num.rstrip(".,")
    return f"{num}{scala} di dollari" if scala else f"{num} dollari"


def speakable(text):
    """Il testo scritto diventa testo da dire: la sintesi vocale legge alla
    lettera, e "2.369" le suona come "due punto trecentosessantanove"."""
    t = text
    t = re.sub(r"(\d)\s*[″\"]", r"\1 pollici", t)          # 13" prima di togliere le virgolette
    t = re.sub(r"[«»“”\"]", "", t)
    t = t.replace("→", "").replace("·", ",").replace("—", ",").replace("…", ".")
    # $999 -> 999 dollari; $2,5 miliardi -> 2,5 miliardi di dollari
    t = re.sub(r"\$\s?(\d+(?:[.,]\d+)*)(\s+(?:miliardi|milioni|mila|miliardo|milione))?", _dollari, t)
    t = re.sub(r"(\d)\.(?=\d{3}\b)", r"\1", t)             # 2.369 -> 2369
    t = re.sub(r"(\d)\.(?=\d{3}\b)", r"\1", t)             # 1.000.000
    # le date ISO si dicono per esteso, e gli intervalli restano intervalli:
    # "2025-2026" e' "dal 2025 al 2026", "6–8 milioni" e' "fra 6 e 8 milioni"
    t = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", lambda m: spoken_date(m.group()), t)
    t = re.sub(r"\b(\d{2})(\d{2})\s*[–-]\s*(\d{2})\b(?!\d)", r"dal \1\2 al \1\3", t)   # 2026-27
    t = re.sub(r"\b(\d{4})\s*[–-]\s*(\d{4})\b", r"dal \1 al \2", t)
    mesi = "|".join(MESI)
    t = re.sub(r"\b(?:dal\s+)?(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(" + mesi + r")\b", r"dal \1 al \2 \3", t)
    t = re.sub(r"(?<![\d,])(\d{1,3}(?:,\d+)?)\s*[–-]\s*(\d{1,3}(?:,\d+)?)(?![\d,])", r"fra \1 e \2", t)
    t = re.sub(r"(\d)\s*%", r"\1 per cento", t)
    t = re.sub(r"(\d)\s*°", r"\1 gradi", t)
    t = re.sub(r"\b(\d+)\s*GB\b", r"\1 gigabyte", t)
    t = re.sub(r"\b(\d+)\s*TB\b", r"\1 terabyte", t)
    t = re.sub(r"\bAI\b", "A I", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


# ------------------------------------------------------------------ la voce

def ensure_piper():
    """Piper in un ambiente suo, dentro .cache/: niente da installare nel
    sistema, e la corsa in cloud lo trova gia' pronto dalla seconda volta."""
    py = os.path.join(VENV, "bin", "python")
    if os.path.exists(py):
        ok = subprocess.run([py, "-c", "import piper"], capture_output=True).returncode == 0
        if ok:
            return py
    os.makedirs(CACHE, exist_ok=True)
    subprocess.run([sys.executable, "-m", "venv", VENV], check=True)
    subprocess.run([py, "-m", "pip", "install", "-q", "--upgrade", "pip"], check=True)
    subprocess.run([py, "-m", "pip", "install", "-q", "piper-tts"], check=True)
    return py


def _voice_ok(path):
    """Una voce vera pesa 60-115 MB e il suo .json si legge: un download
    interrotto o una pagina d'errore non passano per buoni."""
    if not os.path.exists(path):
        return False
    if path.endswith(".json"):
        try:
            with open(path, encoding="utf-8") as fh:
                json.load(fh)
            return True
        except ValueError:
            return False
    return os.path.getsize(path) > 10_000_000


def ensure_voice(key=DEFAULT_VOICE):
    voice, base = VOICES[key]
    onnx = os.path.join(CACHE, voice + ".onnx")
    os.makedirs(CACHE, exist_ok=True)
    for name in (voice + ".onnx", voice + ".onnx.json"):
        path = os.path.join(CACHE, name)
        if _voice_ok(path):
            continue
        # si scarica di lato e si sposta solo se e' intero: un file a meta' col
        # nome giusto rompeva tutte le corse successive
        part = path + ".part"
        r = subprocess.run(["curl", "-fsSL", "--retry", "3", "--retry-delay", "5",
                            "--max-time", "900", "-o", part, base + name])
        if r.returncode != 0 or not _voice_ok(part):
            if os.path.exists(part):
                os.unlink(part)
            raise RuntimeError(f"voce {name} non scaricata (curl {r.returncode})")
        os.replace(part, path)
    return onnx


# Il programma di Piper mette la pausa solo fra le frasi della stessa riga,
# mai fra una riga e l'altra: i titoli di sezione ("Chi lo dice.") partivano
# attaccati al paragrafo prima. Qui la voce si carica una volta e le pause si
# scrivono a mano: breve fra le frasi, piu' lunga fra i paragrafi.
SYNTH = """
import json, sys, wave
from piper import PiperVoice
onnx, out, frase, paragrafo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
paras = json.load(sys.stdin)
voice = PiperVoice.load(onnx)
rate = voice.config.sample_rate
gap = lambda s: bytes(int(rate * s) * 2)
with wave.open(out, "wb") as w:
    w.setframerate(rate); w.setsampwidth(2); w.setnchannels(1)
    for j, p in enumerate(paras):
        if j:
            w.writeframes(gap(paragrafo))
        for i, chunk in enumerate(voice.synthesize(p)):
            if i:
                w.writeframes(gap(frase))
            w.writeframes(chunk.audio_int16_bytes)
"""


def _chiuso(p):
    p = speakable(p)
    return p if re.search(r"[.!?:;]$", p) else p + "."


def synth(py, onnx, paragraphs, wav_path):
    paras = [_chiuso(p) for p in paragraphs if p and p.strip()]
    r = subprocess.run([py, "-c", SYNTH, onnx, wav_path, "0.35", "0.8"],
                       input=json.dumps(paras).encode("utf-8"), capture_output=True)
    if r.returncode != 0:
        raise RuntimeError("piper: " + r.stderr.decode("utf-8", "replace")[-500:])
    with wave.open(wav_path) as w:
        return round(w.getnframes() / w.getframerate())


def encode(wav_path):
    """AAC in .m4a se c'e' afconvert (Mac), altrimenti MP3 con lameenc. Tutti
    e due li suona qualunque iPhone; il WAV pesa dieci volte tanto."""
    if shutil.which("afconvert"):
        out = wav_path[:-4] + ".m4a"
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "48000", wav_path, out], check=True)
        return out, "audio/mp4"
    py = os.path.join(VENV, "bin", "python")
    subprocess.run([py, "-m", "pip", "install", "-q", "lameenc"], check=True)
    out = wav_path[:-4] + ".mp3"
    code = ("import lameenc,wave,sys\n"
            "w=wave.open(sys.argv[1]); e=lameenc.Encoder(); e.set_bit_rate(48)\n"
            "e.set_in_sample_rate(w.getframerate()); e.set_channels(w.getnchannels()); e.set_quality(2)\n"
            "d=e.encode(w.readframes(w.getnframes()))+e.flush(); open(sys.argv[2],'wb').write(d)\n")
    subprocess.run([py, "-c", code, wav_path, out], check=True)
    return out, "audio/mpeg"


# ------------------------------------------------------------------ il deposito

def storage(cfg, key, method, path, data=None, ctype="application/json", extra=()):
    cmd = ["curl", "-sS", "--max-time", "120", "--retry", "2", "-o", "/dev/stdout", "-w", "\n%{http_code}", "-X", method,
           f"{cfg['url']}/storage/v1/{path}",
           "-H", f"apikey: {key}", "-H", f"Authorization: Bearer {key}",
           "-H", f"Content-Type: {ctype}"]
    for h in extra:
        cmd += ["-H", h]
    if data is not None:
        cmd += ["--data-binary", "@-"]
    out = subprocess.run(cmd, input=data, capture_output=True)
    text = out.stdout.decode("utf-8", "replace")
    body, _, code = text.rpartition("\n")
    return code.strip(), body


def ensure_bucket(cfg, key):
    code, body = storage(cfg, key, "POST", "bucket",
                         json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode())
    if code.startswith("2") or "already exists" in body or "Duplicate" in body:
        return
    raise RuntimeError(f"bucket {BUCKET}: HTTP {code} {body[:200]}")


def public_url(cfg, dest):
    return f"{cfg['url']}/storage/v1/object/public/{BUCKET}/{dest}"


def upload(cfg, key, local, dest, mime):
    """Il nome porta l'impronta, quindi ogni versione ha il suo indirizzo e la
    cache lunga non serve mai un file vecchio."""
    with open(local, "rb") as fh:
        data = fh.read()
    code, body = storage(cfg, key, "POST", f"object/{BUCKET}/{dest}", data, mime,
                         extra=("x-upsert: true", "Cache-Control: max-age=31536000"))
    if not code.startswith("2"):
        raise RuntimeError(f"caricamento {dest}: HTTP {code} {body[:200]}")
    return public_url(cfg, dest)


def remove(cfg, key, url):
    """Toglie da Storage la versione sostituita. Se non riesce non e' grave:
    la pulizia dei 30 giorni se la porta via con la sua cartella."""
    marker = f"/public/{BUCKET}/"
    if not url or marker not in url:
        return
    dest = url.split(marker, 1)[1].split("?", 1)[0]
    code, body = storage(cfg, key, "DELETE", f"object/{BUCKET}", json.dumps({"prefixes": [dest]}).encode())
    if not code.startswith("2"):
        print(f"  (la versione vecchia {dest} resta su Storage: HTTP {code})")


def prune(cfg, key, days):
    """Toglie da Storage gli audio piu' vecchi di `days` giorni, e dalle
    edizioni l'indirizzo che non porterebbe piu' a niente."""
    limit = C.today()
    from datetime import date, timedelta
    limit = (date.fromisoformat(limit) - timedelta(days=days)).isoformat()
    code, body = storage(cfg, key, "POST", f"object/list/{BUCKET}",
                         json.dumps({"prefix": "", "limit": 1000}).encode())
    if not code.startswith("2"):
        raise RuntimeError(f"elenco del bucket: HTTP {code} {body[:200]}")
    old = sorted(e["name"] for e in json.loads(body or "[]")
                 if re.match(r"^\d{4}-\d{2}-\d{2}$", e.get("name", "")) and e["name"] < limit)
    # prima si tolgono gli indirizzi dalle edizioni, poi i file: a meta' corsa
    # e' meglio un file senza indirizzo che un indirizzo che non porta a niente
    touched = []
    for path in C.brief_paths():
        day = os.path.basename(path)[:10]
        if day >= limit:
            continue
        b = C.load_json(path)
        hit = False
        for n in b.get("news", []):
            a = n.get("approfondimento") or {}
            if a.pop("audio", None) is not None:
                hit = True
        if hit:
            C.save_json(path, b)
            touched.append(day)
    gone = failed = 0
    for day in old:
        code, body = storage(cfg, key, "POST", f"object/list/{BUCKET}",
                             json.dumps({"prefix": day + "/", "limit": 100}).encode())
        if not code.startswith("2"):
            print(f"  elenco di {day}: HTTP {code} {body[:200]}", file=sys.stderr)
            failed += 1
            continue
        files = [f"{day}/{e['name']}" for e in json.loads(body or "[]") if e.get("id")]
        if files:
            code, body = storage(cfg, key, "DELETE", f"object/{BUCKET}", json.dumps({"prefixes": files}).encode())
            if code.startswith("2"):
                gone += len(files)
            else:
                print(f"  cancellazione di {day}: HTTP {code} {body[:200]}", file=sys.stderr)
                failed += 1
    print(f"Audio oltre i {days} giorni: {gone} file tolti da Storage, "
          f"{len(touched)} edizioni aggiornate" + (f", {failed} giorni non riusciti." if failed else "."))
    return 1 if failed else 0


# ------------------------------------------------------------------ corsa

def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?")
    ap.add_argument("--dry", action="store_true", help="genera in locale, non carica")
    ap.add_argument("--force", action="store_true", help="rifa' anche i file gia' fatti")
    ap.add_argument("--voce", choices=sorted(VOICES), default=DEFAULT_VOICE)
    ap.add_argument("--prune", type=int, metavar="GIORNI",
                    help=f"toglie gli audio oltre i giorni indicati (di solito {KEEP_DAYS})")
    args = ap.parse_args()

    if args.prune is not None:
        return prune(load_config(), service_key(), args.prune)

    day = args.date or C.today()
    path = os.path.join(C.BRIEFS_DIR, f"{day}.json")
    if not os.path.exists(path):
        print(f"Nessuna edizione per il {day}.", file=sys.stderr)
        return 1
    brief = C.load_json(path)
    todo = [n for n in brief.get("news", []) if n.get("approfondimento")]
    if not todo:
        print("Nessun approfondimento in questa edizione: niente da leggere.")
        return 0

    py = ensure_piper()
    onnx = ensure_voice(args.voce)
    cfg = key = None
    if not args.dry:
        cfg, key = load_config(), service_key()
        ensure_bucket(cfg, key)

    outdir = tempfile.mkdtemp(prefix="brief-audio-")
    made = failed = 0
    try:
        for n in todo:
            a = n["approfondimento"]
            paragraphs = script(n)
            stamp = hashlib.sha1(("\n".join(paragraphs) + args.voce + str(RESA)).encode("utf-8")).hexdigest()[:12]
            if not args.force and (a.get("audio") or {}).get("impronta") == stamp:
                print(f"  {n['id']}: gia' fatto, il testo non e' cambiato")
                continue
            try:
                wav = os.path.join(outdir, n["id"] + ".wav")
                secs = synth(py, onnx, paragraphs, wav)
                local, mime = encode(wav)
                size = os.path.getsize(local) // 1024
                if args.dry:
                    print(f"  {n['id']}: {secs // 60}:{secs % 60:02d}, {size} KB  ->  {local}")
                    continue
                os.unlink(wav)
                ext = os.path.splitext(local)[1]
                # --force con lo stesso testo: stesso nome, quindi un sale per
                # avere comunque un indirizzo nuovo
                name = stamp if not args.force else stamp + "-" + hashlib.sha1(str(time.time()).encode()).hexdigest()[:4]
                old = (a.get("audio") or {}).get("url")
                url = upload(cfg, key, local, f"{day}/{n['id']}-{name}{ext}", mime)
                a["audio"] = {"url": url, "durata": secs, "voce": args.voce, "impronta": stamp}
                # si salva subito: un errore alla voce dopo non butta via questa
                C.save_json(path, brief)
                made += 1
                print(f"  {n['id']}: {secs // 60}:{secs % 60:02d}, {size} KB, caricato")
                if old and old != url:
                    remove(cfg, key, old)
            except Exception as e:
                failed += 1
                print(f"  {n['id']}: NON FATTO — {e}", file=sys.stderr)
    finally:
        if not args.dry:
            shutil.rmtree(outdir, ignore_errors=True)

    if made:
        print(f"\n{made} audio nell'edizione del {day}. Ricaricala: python3 pipeline/push.py {day}")
    if failed:
        print(f"{failed} approfondimenti senza audio: rilancia, rifa' solo quelli.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
