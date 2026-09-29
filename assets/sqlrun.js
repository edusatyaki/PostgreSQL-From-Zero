/* ===========================================================================
   sqlrun.js - run SQL the way psql does, and print it the way psql prints it.

   Shared by the build (tools/build.mjs, under Node) and the page (in the
   browser). It knows nothing about where PostgreSQL lives: every function
   takes a PGlite instance. PGlite is real PostgreSQL compiled to WebAssembly,
   so the text this module prints is what psql would print for the same
   statements: aligned tables, "(3 rows)", command tags, and error messages
   with the LINE/caret pointer.
   =========================================================================== */

/* Every type is returned as PostgreSQL's own text, never as a JS Date or
   number, so 45.5000 stays 45.5000 and a timestamp keeps its exact format.  */
export const RAW_PARSERS = (() => {
  const p = {};
  for (let i = 1; i < 6000; i++) p[i] = (x) => x;
  return p;
})();

/* type OIDs psql right-aligns: int2/4/8, oid, float4/8, money, numeric */
const NUMERIC_OIDS = new Set([20, 21, 23, 26, 700, 701, 790, 1700]);

/** Split a script into statements, respecting quotes, comments and $$ bodies. */
export function splitSQL(src) {
  const out = [];
  let i = 0, start = 0, n = src.length;
  /* the semicolon stays on the statement, as psql sends it - it shows up in
     the LINE 1: echo of an error */
  const push = (end) => {
    const text = src.slice(start, Math.min(end + 1, n));
    if (stripComments(text).replace(/;\s*$/, "").trim()) out.push(text.trim());
    start = end + 1;
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "-" && d === "-") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') {
      i++;
      while (i < n) {
        if (src[i] === c) { if (src[i + 1] === c) { i += 2; continue; } break; }
        i++;
      }
      i++; continue;
    }
    if (c === "$") {
      const m = /^\$[A-Za-z_]*\$/.exec(src.slice(i));
      if (m) { const e = src.indexOf(m[0], i + m[0].length); i = e < 0 ? n : e + m[0].length; continue; }
    }
    if (c === ";") { push(i); i++; continue; }
    i++;
  }
  if (start < n) push(n);
  return out;
}

export function stripComments(s) {
  return s.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/* The tag psql prints after a statement that returns no rows. */
function commandTag(stmt, res) {
  const words = stripComments(stmt).trim().replace(/\s+/g, " ").toUpperCase().split(" ");
  const w0 = words[0], n = res.affectedRows ?? 0;
  if (w0 === "INSERT") return `INSERT 0 ${n}`;
  if (w0 === "UPDATE" || w0 === "DELETE" || w0 === "MERGE") return `${w0} ${n}`;
  if (w0 === "SELECT" || w0 === "WITH" || w0 === "VALUES" || w0 === "TABLE") return `SELECT ${n}`;
  if (w0 === "TRUNCATE") return "TRUNCATE TABLE";
  if (w0 === "CREATE" || w0 === "DROP" || w0 === "ALTER") {
    const skip = new Set(["OR", "REPLACE", "UNIQUE", "TEMP", "TEMPORARY", "UNLOGGED", "GLOBAL", "LOCAL"]);
    const obj = words.slice(1).find((w) => !skip.has(w)) || "";
    return `${w0} ${obj.replace(/[^A-Z]/g, "")}`;
  }
  if (w0 === "START") return "START TRANSACTION";
  if (w0 === "END") return "COMMIT";
  return w0.replace(/[^A-Z]/g, "");
}

function cellText(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return "{" + v.map(cellText).join(",") + "}";
  return String(v);
}

/** psql's aligned table: centred headings, numbers right, text left. */
export function formatTable(fields, rows) {
  const names = fields.map((f) => f.name);
  const right = fields.map((f) => NUMERIC_OIDS.has(f.dataTypeID));
  const cells = rows.map((r) => r.map(cellText));
  const w = names.map((h, j) => Math.max(len(h), ...cells.map((r) => maxLine(r[j]))));
  const last = names.length - 1;
  const head = names.map((h, j) => {
    const free = w[j] - len(h), l = Math.floor(free / 2);
    const s = " ".repeat(l) + h + " ".repeat(free - l);
    return j === last ? s.replace(/\s+$/, "") : s;
  });
  const lines = [" " + head.join(" | ").replace(/\s+$/, "")];
  lines.push(w.map((x) => "-".repeat(x + 2)).join("+"));
  for (const r of cells) {
    const parts = r.map((v, j) => {
      const pad = " ".repeat(Math.max(0, w[j] - len(v)));
      if (right[j]) return pad + v;
      return j === last ? v : v + pad;
    });
    lines.push((" " + parts.join(" | ")).replace(/\s+$/, ""));
  }
  lines.push(`(${rows.length} ${rows.length === 1 ? "row" : "rows"})`);
  return lines.join("\n");
}
/* width in characters, counting a character like "i with two dots" as one */
function len(s) { return [...s].length; }
function maxLine(s) { return Math.max(0, ...s.split("\n").map(len)); }

/** psql's error block, with LINE n: and a caret under the failing token. */
export function formatError(err, stmt) {
  const out = [`ERROR:  ${err.message}`];
  const pos = Number(err.position);
  if (pos > 0 && stmt) {
    const before = stmt.slice(0, pos - 1);
    const lineNo = before.split("\n").length;
    const lineStart = before.lastIndexOf("\n") + 1;
    let lineEnd = stmt.indexOf("\n", lineStart);
    if (lineEnd < 0) lineEnd = stmt.length;
    const prefix = `LINE ${lineNo}: `;
    out.push(prefix + stmt.slice(lineStart, lineEnd));
    out.push(" ".repeat(len(prefix) + (pos - 1 - lineStart)) + "^");
  }
  if (err.detail) out.push(`DETAIL:  ${err.detail}`);
  if (err.hint) out.push(`HINT:  ${err.hint}`);
  return out.join("\n");
}

/** Run one statement. Returns { kind: "rows"|"cmd"|"error", text, ... }. */
export async function runStatement(db, stmt) {
  try {
    const res = await db.query(stmt, [], { rowMode: "array" });
    if (res.fields && res.fields.length) {
      return { kind: "rows", text: formatTable(res.fields, res.rows), rows: res.rows, fields: res.fields };
    }
    return { kind: "cmd", text: commandTag(stmt, res) };
  } catch (err) {
    return { kind: "error", text: formatError(err, stmt), message: err.message };
  }
}

/** Run a whole script, statement by statement, like psql -f. */
export async function runScript(db, src) {
  const blocks = [];
  for (const stmt of splitSQL(src)) blocks.push({ stmt, ...(await runStatement(db, stmt)) });
  return blocks;
}

/** The blocks as one psql transcript. */
export function transcript(blocks) {
  return blocks.map((b) => b.text).join("\n\n");
}

/** Throw away everything and start from an empty database. */
export async function resetDB(db) {
  await db.exec(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;
                 SET TimeZone = 'Asia/Kolkata'; SET DateStyle = 'ISO, MDY';`);
}
