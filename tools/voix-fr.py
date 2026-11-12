# Enregistre les noms français des points et des substances avec la voix Denise (voix neuronale Microsoft,
# via edge-tts : pip install edge-tts), dans audio-fr/<empreinte>.mp3, puis écrit audio-fr/liste.js.
# Seuls les noms nouveaux ou modifiés sont enregistrés ; les fichiers qui ne servent plus sont supprimés.
#   python tools/voix-fr.py
import asyncio, json, os, subprocess, sys
import edge_tts, edge_tts.communicate as C

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio-fr")
VOIX, DEBIT = "fr-FR-DeniseNeural", "-5%"

# le texte est annoncé en français (l'outil l'annonce en anglais par défaut)
_mk = C.mkssml
C.mkssml = lambda tc, t: _mk(tc, t).replace("xml:lang='en-US'", "xml:lang='fr-FR'")

liste = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools", "voix-fr-liste.js")], capture_output=True, check=True).stdout.decode("utf-8"))
os.makedirs(OUT, exist_ok=True)
todo = [x for x in liste if not os.path.exists(os.path.join(OUT, x["key"] + ".mp3"))]
print(len(liste), "noms,", len(todo), "à enregistrer")

async def main():
    sem = asyncio.Semaphore(6)
    async def one(x):
        async with sem:
            for essai in range(3):
                try:
                    await edge_tts.Communicate(x["said"], VOIX, rate=DEBIT).save(os.path.join(OUT, x["key"] + ".mp3"))
                    return
                except Exception as e:
                    if essai == 2: print("échec", x["said"], e, file=sys.stderr)
                    await asyncio.sleep(2)
    await asyncio.gather(*(one(x) for x in todo))
asyncio.run(main())

keys = {x["key"] for x in liste}
for f in os.listdir(OUT):
    if f.endswith(".mp3") and f[:-4] not in keys: os.remove(os.path.join(OUT, f))
ok = sorted(k for k in keys if os.path.exists(os.path.join(OUT, k + ".mp3")))
with open(os.path.join(OUT, "liste.js"), "w", encoding="utf-8") as fh:
    fh.write("// noms français enregistrés (voix Denise), refait par tools/voix-fr.py\nwindow.MTC_FR_AUDIO = \"" + " ".join(ok) + "\";\n")
print(len(ok), "fichiers")
