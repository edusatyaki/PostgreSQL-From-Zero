"""Record the narrator: every page, in a female Indian English voice.

Uses Microsoft's neural voice en-IN-NeerjaNeural through the free edge-tts
tool (the text is sent to Microsoft's speech service to be synthesised). The
words come from book/narrate.js, so they always match the page.

    python3 -m venv .venv && .venv/bin/pip install edge-tts
    .venv/bin/python tools/gen_audio.py            # only pages whose words changed
    .venv/bin/python tools/gen_audio.py --all      # every page again

Writes audio/<page>.mp3 and audio/manifest.json (a hash of the words each clip
was recorded from). Needs node on PATH.
"""
import asyncio, hashlib, json, os, subprocess, sys
import edge_tts

VOICE = 'en-IN-NeerjaNeural'       # female, Indian English, "friendly, positive"
RATE  = '+0%'
ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT   = os.path.join(ROOT, 'audio')
MANIFEST = os.path.join(OUT, 'manifest.json')

def narration():
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'narration.mjs')],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)

async def one(text, path):
    for attempt in range(5):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
            if os.path.getsize(path) > 2000:
                return
        except Exception as e:
            print('retry', os.path.basename(path), e, file=sys.stderr)
        await asyncio.sleep(2 + attempt * 3)
    raise SystemExit('failed: ' + path)

async def main(redo_all):
    os.makedirs(OUT, exist_ok=True)
    words = narration()
    old = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    new = {k: hashlib.sha1(t.encode()).hexdigest()[:12] for k, t in words.items()}
    todo = [k for k in words if redo_all or old.get(k) != new[k]
            or not os.path.exists(os.path.join(OUT, k + '.mp3'))]
    sem = asyncio.Semaphore(4)
    done = 0
    async def run(k):
        nonlocal done
        async with sem:
            await one(words[k], os.path.join(OUT, k + '.mp3'))
            done += 1
            if done % 20 == 0: print(done, '/', len(todo), flush=True)
    await asyncio.gather(*(run(k) for k in todo))
    for f in os.listdir(OUT):                       # clips for pages that no longer exist
        if f.endswith('.mp3') and f[:-4] not in words:
            os.remove(os.path.join(OUT, f))
    json.dump(new, open(MANIFEST, 'w'), indent=1, sort_keys=True)
    print(len(todo), 'clips recorded,', len(words) - len(todo), 'unchanged')

asyncio.run(main('--all' in sys.argv))
