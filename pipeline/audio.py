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

    "audio": {"url": "…/2026-09-30/iphone-duo-yield-produzione.m4a",
              "durata": 142, "voce": "paola", "impronta": "…"}

L'impronta e' quella del testo: se l'approfondimento non cambia, il file non si
rifa'. La prima corsa scarica Piper (una decina di secondi) e la voce (63 MB),
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
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C
from push import load_config, service_key

CACHE = os.path.join(C.ROOT, ".cache", "piper")
VENV = os.path.join(CACHE, "venv")
VOICE = "it_IT-paola-medium"
VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/"
BUCKET = "brief-audio"
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


def speakable(text):
    """Il testo scritto diventa testo da dire: la sintesi vocale legge alla
    lettera, e "2.369" le suona come "due punto trecentosessantanove"."""
    t = text
    t = re.sub(r"[«»“”\"]", "", t)
    t = t.replace("→", "").replace("·", ",").replace("—", ",").replace("…", ".")
    t = re.sub(r"\$\s?(\d[\d.,]*)", r"\1 dollari", t)
    t = re.sub(r"(\d)\.(?=\d{3}\b)", r"\1", t)             # 2.369 -> 2369
    t = re.sub(r"(\d)\.(?=\d{3}\b)", r"\1", t)             # 1.000.000
    t = re.sub(r"(\d)\s*[–-]\s*(\d)", r"\1 o \2", t)        # 6–8 -> 6 o 8
    t = re.sub(r"(\d)\s*%", r"\1 per cento", t)
    t = re.sub(r"(\d)\s*[″\"]", r"\1 pollici", t)
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


def ensure_voice():
    onnx = os.path.join(CACHE, VOICE + ".onnx")
    for name in (VOICE + ".onnx", VOICE + ".onnx.json"):
        path = os.path.join(CACHE, name)
        if os.path.exists(path) and os.path.getsize(path) > 1000:
            continue
        r = subprocess.run(["curl", "-sSL", "--max-time", "300", "-o", path, VOICE_BASE + name])
        if r.returncode != 0 or not os.path.exists(path):
            raise RuntimeError(f"voce {name} non scaricata")
    return onnx


def synth(py, onnx, paragraphs, wav_path):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as fh:
        fh.write("\n".join(speakable(p) for p in paragraphs))
        txt = fh.name
    try:
        subprocess.run([py, "-m", "piper", "-m", onnx, "-i", txt, "-f", wav_path,
                        "--sentence-silence", "0.35"], check=True, capture_output=True)
    finally:
        os.unlink(txt)
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
    cmd = ["curl", "-sS", "-o", "/dev/stdout", "-w", "\n%{http_code}", "-X", method,
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


def upload(cfg, key, local, dest, mime):
    with open(local, "rb") as fh:
        data = fh.read()
    code, body = storage(cfg, key, "POST", f"object/{BUCKET}/{dest}", data, mime,
                         extra=("x-upsert: true", "Cache-Control: max-age=31536000"))
    if not code.startswith("2"):
        raise RuntimeError(f"caricamento {dest}: HTTP {code} {body[:200]}")
    return f"{cfg['url']}/storage/v1/object/public/{BUCKET}/{dest}"


# ------------------------------------------------------------------ corsa

def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n")[0])
    ap.add_argument("date", nargs="?")
    ap.add_argument("--dry", action="store_true", help="genera in locale, non carica")
    ap.add_argument("--force", action="store_true", help="rifa' anche i file gia' fatti")
    args = ap.parse_args()

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
    onnx = ensure_voice()
    cfg = key = None
    if not args.dry:
        cfg, key = load_config(), service_key()
        ensure_bucket(cfg, key)

    outdir = tempfile.mkdtemp(prefix="brief-audio-")
    made = 0
    for n in todo:
        a = n["approfondimento"]
        paragraphs = script(n)
        stamp = hashlib.sha1("\n".join(paragraphs).encode("utf-8")).hexdigest()[:12]
        if not args.force and (a.get("audio") or {}).get("impronta") == stamp:
            print(f"  {n['id']}: gia' fatto, il testo non e' cambiato")
            continue
        wav = os.path.join(outdir, n["id"] + ".wav")
        secs = synth(py, onnx, paragraphs, wav)
        local, mime = encode(wav)
        size = os.path.getsize(local) // 1024
        if args.dry:
            print(f"  {n['id']}: {secs // 60}:{secs % 60:02d}, {size} KB  ->  {local}")
            continue
        ext = os.path.splitext(local)[1]
        url = upload(cfg, key, local, f"{day}/{n['id']}{ext}", mime)
        a["audio"] = {"url": url, "durata": secs, "voce": "paola", "impronta": stamp}
        made += 1
        print(f"  {n['id']}: {secs // 60}:{secs % 60:02d}, {size} KB, caricato")

    if made:
        C.save_json(path, brief)
        print(f"\n{made} audio nell'edizione del {day}. Ricaricala: python3 pipeline/push.py {day}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
