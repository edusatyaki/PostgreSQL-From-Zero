/* ===========================================================================
   pg.js - a real PostgreSQL 18, running inside the page.

   PGlite (PostgreSQL compiled to WebAssembly, ~5 MB compressed) is only
   downloaded the first time a reader runs code they have edited, so a reader
   who only reads never pays for it. Every run is queued, because one database
   serves the whole page.
   =========================================================================== */
import { RAW_PARSERS, runScript, resetDB } from "./sqlrun.js";

const PGLITE = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";

let dbPromise = null;
let queue = Promise.resolve();
const listeners = new Set();
export let status = "idle";           // idle | loading | ready | error

function setStatus(s) { status = s; listeners.forEach((f) => f(s)); }
export function onStatus(f) { listeners.add(f); f(status); }

export function getDB() {
  if (!dbPromise) {
    setStatus("loading");
    dbPromise = (async () => {
      const { PGlite } = await import(PGLITE);
      const db = new PGlite({ parsers: RAW_PARSERS });
      await db.waitReady;
      await resetDB(db);
      setStatus("ready");
      return db;
    })().catch((e) => { setStatus("error"); dbPromise = null; throw e; });
  }
  return dbPromise;
}

/* one job at a time: a job gets the db and returns whatever it likes */
function exclusive(job) {
  const run = queue.then(async () => job(await getDB()));
  queue = run.catch(() => {});
  return run;
}

/** Fresh database, run `setup` silently, then `code`, and return its blocks. */
export function runFresh(setup, code) {
  return exclusive(async (db) => {
    playgroundOf = null;
    await resetDB(db);
    if (setup) await runScript(db, setup);
    return runScript(db, code);
  });
}

/* The playground keeps its tables between runs; it only resets when asked,
   or when a different chapter's playground takes the database. */
let playgroundOf = null;
export function runPlayground(chId, setup, code, reset = false) {
  return exclusive(async (db) => {
    if (reset || playgroundOf !== chId) {
      await resetDB(db);
      if (setup) await runScript(db, setup);
      playgroundOf = chId;
    }
    return runScript(db, code);
  });
}
