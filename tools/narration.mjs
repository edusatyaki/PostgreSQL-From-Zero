/* Print every page's narration as JSON {file: text}. tools/gen_audio.py reads it. */
import { CHAPTERS, sandboxSQL } from "../book/index.js";
import { narration, audioFile } from "../book/narrate.js";

const all = { [audioFile(null)]: narration(null) };
for (const ch of CHAPTERS) {
  const pages = [{ kind: "opener", id: "start" }, ...ch.pages];
  if (sandboxSQL(ch).trim()) pages.push({ kind: "play", id: "play" });
  for (const p of pages) all[audioFile(ch, p)] = narration(ch, p);
}
process.stdout.write(JSON.stringify(all, null, 1));
