/* ===========================================================================
   app.js - the book reader.

   One flat list of pages (cover, then each chapter's opener and pages, then
   its playground), one page on screen at a time. The page is rebuilt from the
   chapter data on every turn; everything interactive (code boxes, quizzes)
   is wired by one delegated click handler on <main>.

   Saved outputs come from book/outputs.js, which tools/build.mjs wrote by
   running every query on PostgreSQL 18. Pressing Run on unchanged code shows
   that saved output instantly; edited code runs live on PGlite (assets/pg.js).
   =========================================================================== */
import { CHAPTERS, pageKey, sandboxSQL, replaySQL } from "../book/index.js?v=202609291147";
import OUT from "../book/outputs.js?v=202609291147";
import { art } from "./art.js?v=202609291147";
import { transcript } from "./sqlrun.js";
import { runFresh, runPlayground, onStatus } from "./pg.js?v=202609291147";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const strip = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
const chLabel = (ch) => (ch.id === "fin" ? "Fin" : String(ch.num));

/* ---------------------------------------------------------------- storage */
const STORE = "pgz:v1";
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(STORE)) || {}; } catch {}
  s.seen ||= {}; s.quiz ||= {}; s.ran ||= {};
  return s;
})();
function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch {} }
const prefGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const prefSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/* ---------------------------------------------------------------- pages */
const PAGES = [{ ch: null, p: { kind: "cover", id: "", title: "Contents" } }];
for (const ch of CHAPTERS) {
  PAGES.push({ ch, p: { kind: "opener", id: "start", title: ch.title } });
  for (const p of ch.pages) PAGES.push({ ch, p });
  if (sandboxSQL(ch).trim()) PAGES.push({ ch, p: { kind: "play", id: "play", title: "Playground" } });
}
const hashOf = (e) => (e.ch ? `${e.ch.id}/${e.p.id}` : "");
const indexOfHash = (h) => PAGES.findIndex((e) => hashOf(e) === h);
const chPages = (ch) => PAGES.filter((e) => e.ch === ch);
const titleOf = (p) => (p.kind === "lesson" || p.kind === "table") && /\d/.test(p.id) ? `${p.id}  ${p.title}` : p.title;

let cur = 0;

/* ---------------------------------------------------------------- highlighting */
const KW = new Set(("select from where and or not in is null as on join left right full outer inner cross group by order having limit offset " +
  "distinct insert into values update set delete create table alter add column rename to drop truncate primary key foreign references " +
  "constraint check default unique index cascade restrict if exists case when then else end asc desc between like ilike all any some " +
  "with over partition rows range unbounded preceding following current row filter union except intersect using returning " +
  "true false interval date timestamp int integer varchar text numeric serial boolean begin commit rollback both leading trailing for " +
  "window nulls first last only lateral natural action no").split(" "));
export function hl(sql) {
  let out = "", i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i], rest = sql.slice(i);
    let m;
    if (c === "-" && sql[i + 1] === "-") { const e = sql.indexOf("\n", i); const t = e < 0 ? rest : sql.slice(i, e); out += `<span class="c">${esc(t)}</span>`; i += t.length; continue; }
    if (c === "'") { m = /^'(?:[^']|'')*'?/.exec(rest); out += `<span class="s">${esc(m[0])}</span>`; i += m[0].length; continue; }
    if ((m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest))) {
      const w = m[0], after = sql.slice(i + w.length);
      if (KW.has(w.toLowerCase())) out += `<span class="k">${w}</span>`;
      else if (/^\s*\(/.test(after)) out += `<span class="f">${w}</span>`;
      else out += esc(w);
      i += w.length; continue;
    }
    if ((m = /^\d+(\.\d+)?/.exec(rest))) { out += `<span class="n">${m[0]}</span>`; i += m[0].length; continue; }
    out += esc(c); i++;
  }
  return out;
}
function hlOut(text) {
  return esc(text).split("\n").map((l) => {
    if (/^ERROR:/.test(l)) return `<span class="e">${l}</span>`;
    if (/^(DETAIL|HINT|LINE \d+):/.test(l) || /^\s*\^$/.test(l) || /^\(\d+ rows?\)$/.test(l)) return `<span class="d">${l}</span>`;
    if (/^(INSERT \d+ \d+|UPDATE \d+|DELETE \d+|SELECT \d+|CREATE [A-Z]+|DROP [A-Z]+|ALTER [A-Z]+|TRUNCATE TABLE|BEGIN|COMMIT|ROLLBACK)$/.test(l)) return `<span class="ok">${l}</span>`;
    return l;
  }).join("\n");
}

/* ---------------------------------------------------------------- icons */
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 9h11a5 5 0 010 10H9"/><path d="M8 5L4 9l4 4"/></svg>',
};

/* ---------------------------------------------------------------- code boxes
   A code box = editor + terminal. `runner(code)` returns psql blocks; `saved`
   is the build's output for the original code (or undefined). */
const boxes = new Map();
const edits = new Map();          // edited code survives page turns in this visit
let boxSeq = 0;

function codebox({ key, sql, saved, runner, open = false, live = false, name = "query.sql", compact = false, predict = "" }) {
  const id = "cb" + ++boxSeq;
  const code = edits.get(key) ?? sql;
  boxes.set(id, { key, orig: sql, code, saved, runner, live, editing: false });
  const edited = code !== sql;
  const shown = open || store.ran[key];
  return `
  <div class="codebox" id="${id}">
    <div class="cb-bar">
      <span class="cb-name">${esc(name)}${edited ? '<span class="edited">edited</span>' : ""}</span>
      <button class="btn" data-act="edit" title="Change this code">${I.edit}<span>Edit</span></button>
      <button class="btn" data-act="restore" title="Put the original code back" ${edited ? "" : "hidden"}>${I.undo}<span>Original</span></button>
      <button class="btn run" data-act="run" title="Run (Ctrl+Enter while editing)">${I.play}<span>Run</span></button>
    </div>
    <div class="code-wrap"><pre class="sql">${hl(code)}</pre></div>
    ${predict && !shown ? `<div class="predict"><b>Think first:</b><span>${predict}</span></div>` : ""}
    <div class="term">
      <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span>psql output<span class="badge"></span></div>
      <div class="term-body">${shown && saved != null && !edited
        ? `<pre class="out">${hlOut(saved)}</pre>`
        : `<div class="term-cta"><button class="btn" data-act="run">${I.play} Run</button><span>${compact ? "" : "to see what PostgreSQL returns"}</span></div>`}</div>
    </div>
  </div>`;
}

function setTerm(el, html, badge = "", liveBadge = false) {
  $(".term-body", el).innerHTML = html;
  const b = $(".badge", el);
  b.textContent = badge;
  b.classList.toggle("live", liveBadge);
}

async function runBox(el) {
  const b = boxes.get(el.id);
  if (!b) return;
  const ta = $("textarea", el);
  if (ta) b.code = ta.value;
  const changed = b.code.trim() !== b.orig.trim();
  $(".predict", el)?.remove();
  store.ran[b.key] = 1; save();
  if (!changed && b.saved != null && !b.live) {
    setTerm(el, `<pre class="out">${hlOut(b.saved)}</pre>`, "recorded on PostgreSQL 18");
    return;
  }
  setTerm(el, `<div class="term-cta"><span>Running on the PostgreSQL inside this page... (the first run downloads it, about 5 MB)</span></div>`, "");
  try {
    const t0 = performance.now();
    const blocks = await b.runner(b.code);
    const ms = Math.round(performance.now() - t0);
    setTerm(el, `<pre class="out">${hlOut(transcript(blocks) || "(nothing to run)")}</pre>`, `live, just now, ${ms} ms`, true);
  } catch (e) {
    const fallback = !changed && b.saved != null
      ? `<pre class="out">${hlOut(b.saved)}</pre><div class="term-note">Could not start PostgreSQL in this browser (${esc(e.message)}). Showing the recorded output.</div>`
      : `<div class="term-cta"><span>Could not start PostgreSQL in this browser: ${esc(e.message)}. Check your internet connection and try again.</span></div>`;
    setTerm(el, fallback, "");
  }
}

function editBox(el) {
  const b = boxes.get(el.id);
  if (b.editing) { $("textarea", el).focus(); return; }
  b.editing = true;
  const wrap = $(".code-wrap", el);
  const lines = b.code.split("\n").length;
  wrap.innerHTML = `<textarea class="sql" spellcheck="false" autocapitalize="off" autocomplete="off" rows="${Math.min(Math.max(lines + 1, 4), 30)}">${esc(b.code)}</textarea>`;
  const ta = $("textarea", wrap);
  ta.focus();
  ta.addEventListener("input", () => {
    b.code = ta.value;
    edits.set(b.key, b.code);
    const edited = b.code !== b.orig;
    $(".cb-name", el).innerHTML = esc($(".cb-name", el).firstChild.textContent) + (edited ? '<span class="edited">edited</span>' : "");
    $('[data-act="restore"]', el).hidden = !edited;
  });
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runBox(el); }
    if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); }
    if (e.key === "Escape") ta.blur();
  });
}

function restoreBox(el) {
  const b = boxes.get(el.id);
  b.code = b.orig; b.editing = false;
  edits.delete(b.key);
  $(".code-wrap", el).innerHTML = `<pre class="sql">${hl(b.code)}</pre>`;
  $(".cb-name", el).textContent = $(".cb-name", el).firstChild.textContent;
  $('[data-act="restore"]', el).hidden = true;
}

/* ---------------------------------------------------------------- page parts */
const head = (kicker, title) => `<div class="phead"><p class="kicker">${kicker}</p><h1 class="ptitle">${esc(title)}</h1></div>`;
const gridHTML = (g) => g ? `<table class="grid"><thead><tr>${g.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${
  g.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "";
const callouts = (p) => (p.note ? `<div class="callout warn say"><b>Watch out</b>${p.note}</div>` : "") + (p.tip ? `<div class="callout tip say"><b>Try this</b>${p.tip}</div>` : "");
const chKicker = (ch) => (ch.id === "fin" ? "The finale" : `Chapter ${ch.num}`) + ` · ${esc(ch.title)}`;

function renderCover() {
  const last = store.last && indexOfHash(store.last);
  const cont = last > 0 ? `<button class="cta" data-go="${last}">Continue: ${esc(titleOf(PAGES[last].p))}</button>` : "";
  const cards = CHAPTERS.map((ch) => {
    const ps = chPages(ch), seen = ps.filter((e) => store.seen[hashOf(e)]).length;
    const qs = quizStats(ch);
    return `<button class="card chcard" data-accent="${ch.accent}" data-go="${PAGES.indexOf(ps[0])}">
      <span class="no">${chLabel(ch)}</span><h3>${esc(ch.title)}</h3><p>${esc(ch.topic)}</p>
      <div class="meter"><span style="width:${Math.round((100 * seen) / ps.length)}%"></span></div>
      <span class="stat">${seen}/${ps.length} pages${qs.total ? ` · quiz ${qs.right}/${qs.total}` : ""}</span></button>`;
  }).join("");
  return `<div class="cover">
    <p class="kicker">A digital book · PostgreSQL 18</p>
    <h1>PostgreSQL <i>from Zero</i></h1>
    <p class="lede say">For someone who has never written a line of SQL. Ten short chapters take you from "what is a table?" to window
      functions, joins and a five-table shop with foreign keys. Every example is a real problem, and every query runs on a
      real PostgreSQL database inside this page. Change it, break it, run it again.</p>
    <div class="cover-cta">
      <button class="cta ${cont ? "alt" : ""}" data-go="1">Start at Chapter 0</button>${cont}
    </div>
    <div class="feat">
      <div class="card"><h3>Real PostgreSQL, right here</h3><p>A full PostgreSQL 18 runs inside the page. Press Edit, change anything, press Run.</p></div>
      <div class="card"><h3>Guess, then run</h3><p>Pages ask you to predict the answer first. Every printed output is exactly what PostgreSQL returned.</p></div>
      <div class="card"><h3>Checkpoint and bug hunt</h3><p>Each chapter ends with MCQs, and with broken queries and their real error messages: pick the fix.</p></div>
      <div class="card"><h3>Toolbox and playground</h3><p>The chapter's important functions on runnable cards, and a free playground with the chapter's tables.</p></div>
    </div>
    <h2>Chapters</h2>
    <div class="chapters">${cards}</div>
    <h2>Companion resources</h2>
    <ul class="defs">
      <li><a href="https://edusatyaki.github.io/PGSQLMaaster/index.html" target="_blank" rel="noopener">Notes &amp; Practice Portal</a>: the workbook, function reference and 379 practice problems.</li>
      <li><a href="https://drive.google.com/drive/folders/11A5-dx_8OVrFbm913bqyKz7OSvPq7fuP?usp=sharing" target="_blank" rel="noopener">All SQL files</a>: the class files DE 1 to DE 9.</li>
      <li><a href="https://drive.google.com/drive/folders/1Sun3e-2JSOSQrMh0JqwXRPP8fTP9LRmk?usp=sharing" target="_blank" rel="noopener">Chapter 1-9 notes</a>: the printable PostgreSQL class notes.</li>
    </ul>
    <p class="aside">Satyaki Das · Assistant Professor, Rishihood University x Newton School of Technology. Your progress is saved in this browser only.</p>
  </div>`;
}

function renderOpener(ch) {
  const o = ch.opener;
  return `<div class="opener"><div class="op-num">${chLabel(ch)}</div><div>
    <p class="kicker">${ch.id === "fin" ? "The finale" : `Chapter ${ch.num}`} · ${esc(ch.topic)}</p>
    <h1 class="ptitle">${esc(ch.title)}</h1>
    <p class="op-q say">${esc(o.question)}</p>
    <p class="op-story say">${o.story}</p>
    <p class="kicker" style="margin-top:1.2rem">By the end of this chapter you can</p>
    <ul class="learn say">${o.learn.map((l) => `<li>${l}</li>`).join("")}</ul>
    <p class="uses">Data used: <code>${esc(o.uses)}</code></p>
  </div></div>`;
}

function renderLesson(ch, p) {
  const key = pageKey(ch, p);
  const setup = replaySQL(ch, p);
  const isTable = p.kind === "table";
  return `${head(chKicker(ch), titleOf(p))}
    ${p.say ? `<div class="situation"><span class="sit-k">${isTable ? "The data" : "Situation"}</span><p class="say">${esc(p.say)}</p></div>` : ""}
    ${codebox({ key, sql: p.sql, saved: OUT[key], open: isTable, live: !!p.live, predict: p.predict || "",
      name: isTable ? "tables.sql" : "query.sql",
      runner: (code) => runFresh(setup, isTable && p.show ? code + "\n\n" + p.show : code) })}
    ${isTable && p.show ? `<p class="aside">The output shows the result of <code>${esc(p.show.split("\n")[0])}</code>${p.show.includes("\n") ? " and the other tables" : ""}.</p>` : ""}
    ${p.live ? `<p class="aside">This query depends on today's date, so Run always runs it live and your output will differ from the class notes.</p>` : ""}
    <div class="explain say">${gridHTML(p.grid)}${p.explain || ""}</div>
    ${p.art ? art(p.art) : ""}
    ${callouts(p)}`;
}

function renderIntro(ch, p) {
  return `<div class="${p.section ? "section-page" : ""}">${head(chKicker(ch), p.title)}
    <div class="say">${p.html}</div>${p.art ? art(p.art) : ""}</div>`;
}

function renderTools(ch, p) {
  const key = pageKey(ch, p), sb = sandboxSQL(ch);
  return `${head(chKicker(ch), p.title)}
    <p class="say">Each card is one tool: what it is called, how to write it, what it does, and a live example you can change.</p>
    <div class="toolgrid">${p.cards.map((c, i) => `<div class="card tool">
      <h3>${esc(c.name)}</h3><div class="sig">${esc(c.sig)}</div><p class="does">${esc(c.does)}</p>
      ${codebox({ key: `${key}/${i}`, sql: c.sql, saved: OUT[`${key}/${i}`], open: true, compact: true, name: "example",
        runner: (code) => runFresh(sb, code) })}</div>`).join("")}</div>`;
}

/* ---- quizzes */
const LET = "ABCDEFGH";
function quizStats(ch) {
  let right = 0, total = 0;
  for (const p of ch.pages) if (p.kind === "quiz" || p.kind === "debug") {
    const base = pageKey(ch, p);
    p.qs.forEach((q, i) => { total++; if (store.quiz[`${base}/${i}`] === q.a) right++; });
  }
  return { right, total };
}
function optionsHTML(qkey, q, code = false) {
  const chosen = store.quiz[qkey];
  const done = chosen !== undefined;
  return `<div class="opts">${q.opts.map((o, j) => {
    const cls = done ? (j === q.a ? "right" : j === chosen ? "wrong" : "") : "";
    return `<button class="opt ${cls}" data-act="answer" data-q="${esc(qkey)}" data-j="${j}" ${done ? "disabled" : ""}>
      <span class="l">${LET[j]}</span>${code ? `<pre class="sql">${hl(o)}</pre>` : `<span>${/<\w/.test(o) ? o : esc(o)}</span>`}</button>`;
  }).join("")}</div>`;
}
function whyHTML(qkey, q, extra = "") {
  const chosen = store.quiz[qkey];
  if (chosen === undefined) return `<div class="why"></div>`;
  const ok = chosen === q.a;
  return `<div class="why show ${ok ? "good" : "bad"}"><b>${ok ? "Right." : `Not quite: the answer is ${LET[q.a]}.`}</b>${q.why}</div>${extra}`;
}
function scoreBar(keys, qs) {
  const answered = keys.filter((k) => store.quiz[k] !== undefined).length;
  const right = keys.filter((k, i) => store.quiz[k] === qs[i].a).length;
  return `<div class="score"><b>${right} / ${qs.length}</b><span>${answered < qs.length ? `${qs.length - answered} still to answer` : right === qs.length ? "Perfect score." : "Done. Read the explanations for the ones you missed."}</span>
    ${answered ? `<button class="btn" data-act="retry" data-keys="${esc(keys.join(","))}">Try again</button>` : ""}</div>`;
}

function renderQuiz(ch, p) {
  const base = pageKey(ch, p), keys = p.qs.map((_, i) => `${base}/${i}`);
  return `${head(chKicker(ch), p.title)}
    <p class="say">Pick an answer. You find out at once whether it is right, and why.</p>
    ${scoreBar(keys, p.qs)}
    <div class="qlist">${p.qs.map((q, i) => `<div class="card q">
      <div class="qn">Question ${i + 1}</div><div class="qt">${q.q}</div>
      ${q.code ? `<pre class="sql">${hl(q.code)}</pre>` : ""}
      ${optionsHTML(keys[i], q)}${whyHTML(keys[i], q)}</div>`).join("")}</div>`;
}

function renderDebug(ch, p) {
  const base = pageKey(ch, p), keys = p.qs.map((_, i) => `${base}/${i}`), sb = sandboxSQL(ch);
  return `${head(chKicker(ch), p.title)}
    <p class="say">Each query below is broken. Read what PostgreSQL said (or, for the silent bugs, what it wrongly returned), then pick the fix.</p>
    ${scoreBar(keys, p.qs)}
    <div class="qlist">${p.qs.map((q, i) => {
      const k = keys[i];
      const fix = store.quiz[k] !== undefined ? `<div class="ask" style="margin-top:.8rem">The fix, running</div>${codebox({ key: `${k}/fix`, sql: q.opts[q.a], saved: OUT[`${k}/fix`], open: true, name: "fixed.sql", runner: (c) => runFresh(sb, c) })}` : "";
      return `<div class="card q">
        <div class="qn">Bug ${i + 1}${q.silent ? " · a silent one: no error, wrong answer" : ""}</div>
        <div class="task">The task: ${esc(q.task)}</div>
        ${codebox({ key: `${k}/bad`, sql: q.bad, saved: OUT[`${k}/bad`], open: true, name: "broken.sql", runner: (c) => runFresh(sb, c) })}
        <div class="ask">Which version does the task correctly?</div>
        ${optionsHTML(k, q, true)}${whyHTML(k, q, fix)}</div>`;
    }).join("")}</div>`;
}

function examPool() {
  const pool = [];
  for (const ch of CHAPTERS) for (const p of ch.pages) if (p.kind === "quiz") p.qs.forEach((q, i) => pool.push({ ch, key: `${pageKey(ch, p)}/${i}`, q }));
  return pool;
}
function renderExam(ch, p) {
  const pool = examPool();
  let set = (store.exam || []).map((k) => pool.find((x) => x.key === k)).filter(Boolean);
  if (set.length !== p.count) {
    set = pool.slice().sort(() => Math.random() - 0.5).slice(0, p.count);
    store.exam = set.map((x) => x.key);
    for (const x of set) delete store.quiz["exam:" + x.key];
    save();
  }
  const keys = set.map((x) => "exam:" + x.key), qs = set.map((x) => x.q);
  return `${head(chKicker(ch), p.title)}
    <p class="say">${p.count} questions picked at random from every chapter's checkpoint. Each one says which chapter it comes from.</p>
    ${scoreBar(keys, qs)}
    <button class="btn" data-act="newexam">A new set of questions</button>
    <div class="qlist">${set.map((x, i) => `<div class="card q" data-accent="${x.ch.accent}">
      <div class="qn">Question ${i + 1} · from Chapter ${x.ch.num}: ${esc(x.ch.title)}</div><div class="qt">${x.q.q}</div>
      ${x.q.code ? `<pre class="sql">${hl(x.q.code)}</pre>` : ""}
      ${optionsHTML(keys[i], x.q)}${whyHTML(keys[i], x.q)}</div>`).join("")}</div>`;
}

function renderRecap(ch, p) {
  return `${head(chKicker(ch), p.title)}<ol class="recap say">${p.items.map((t) => `<li>${t}</li>`).join("")}</ol>`;
}

function renderPlay(ch) {
  const sb = sandboxSQL(ch);
  const tables = [...sb.matchAll(/CREATE TABLE\s+(\w+)/gi)].map((m) => m[1]);
  const key = `${ch.id}/play`;
  return `${head(chKicker(ch), "Playground")}
    <p class="say">Your own space with this chapter's tables: ${tables.map((t) => `<code>${esc(t)}</code>`).join(", ")}. Write anything, run it,
      and the tables keep your changes until you press <b>Reset tables</b>. Nothing here can break the book.</p>
    <p>${tables.map((t) => `<button class="btn" data-act="peek" data-t="${esc(t)}">SELECT * FROM ${esc(t)}</button>`).join(" ")}
      <button class="btn" data-act="resetplay">Reset tables</button></p>
    ${codebox({ key, sql: `SELECT * FROM ${tables[0] || "information_schema.tables"};`, name: "playground.sql",
      runner: (code) => runPlayground(ch.id, sb, code) })}
    <details><summary>The code that builds these tables</summary><pre class="sql">${hl(sb)}</pre></details>`;
}

function renderPage(e) {
  const { ch, p } = e;
  switch (p.kind) {
    case "cover": return renderCover();
    case "opener": return renderOpener(ch);
    case "lesson": case "table": return renderLesson(ch, p);
    case "intro": return renderIntro(ch, p);
    case "tools": return renderTools(ch, p);
    case "quiz": return renderQuiz(ch, p);
    case "debug": return renderDebug(ch, p);
    case "exam": return renderExam(ch, p);
    case "recap": return renderRecap(ch, p);
    case "play": return renderPlay(ch);
  }
  return "";
}

/* ---------------------------------------------------------------- rail */
function ring(frac) {
  const c = 2 * Math.PI * 9;
  return `<svg class="ring" viewBox="0 0 24 24" aria-hidden="true"><circle class="bg" cx="12" cy="12" r="9"/>
    <circle class="fg" cx="12" cy="12" r="9" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}"/></svg>`;
}
function renderRail() {
  const e = PAGES[cur];
  $("#toc").innerHTML = CHAPTERS.map((ch) => {
    const ps = chPages(ch), seen = ps.filter((x) => store.seen[hashOf(x)]).length;
    const now = e.ch === ch;
    return `<button class="toc-ch ${now ? "now" : ""} ${seen === ps.length ? "done" : ""}" data-accent="${ch.accent}" data-go="${PAGES.indexOf(ps[0])}">
      <span class="toc-n">${chLabel(ch)}</span><span class="toc-t">${esc(ch.title)}<small>${esc(ch.topic)}</small></span>${ring(seen / ps.length)}</button>
      <div class="toc-pages">${now ? ps.map((x) => `<button class="toc-p ${x === e ? "now" : ""} ${store.seen[hashOf(x)] ? "seen" : ""} ${x.p.section ? "sec" : ""}" data-go="${PAGES.indexOf(x)}">
        <span class="id">${/\d/.test(x.p.id) ? esc(x.p.id) : ""}</span><span>${esc(x.p.title)}</span></button>`).join("") : ""}</div>`;
  }).join("");
  $(".toc-p.now")?.scrollIntoView({ block: "nearest" });
}

/* ---------------------------------------------------------------- navigation */
function go(i, { push = true, keepScroll = false } = {}) {
  i = Math.max(0, Math.min(PAGES.length - 1, i));
  stopSpeaking();
  cur = i;
  const e = PAGES[i];
  boxes.clear();
  document.body.dataset.accent = e.ch?.accent || "amber";
  $("#eyebrow").textContent = e.ch ? `${e.ch.id === "fin" ? "The finale" : "Chapter " + e.ch.num} · ${e.ch.title}` : "PostgreSQL from Zero";
  $("#htitle").textContent = e.ch ? titleOf(e.p) : "Contents";
  document.title = e.ch ? `${titleOf(e.p)} · PostgreSQL from Zero` : "PostgreSQL from Zero";
  $("#page").innerHTML = renderPage(e);
  if (!keepScroll) $("main").scrollTop = 0;
  const h = hashOf(e);
  if (push && location.hash.slice(1) !== h) history.pushState(null, "", h ? "#" + h : location.pathname + location.search);
  store.seen[h] = 1;
  if (e.ch) store.last = h;
  save();
  const prev = PAGES[i - 1], next = PAGES[i + 1];
  $("#prev").disabled = !prev; $("#next").disabled = !next;
  $("#prev .lbl").textContent = prev ? (prev.ch ? prev.p.title : "Contents") : "Previous";
  $("#next .lbl").textContent = next ? next.p.title : "The end";
  $("#pageNo").textContent = `Page ${i + 1} of ${PAGES.length}`;
  $("#bar").style.width = `${(100 * (i + 1)) / PAGES.length}%`;
  renderRail();
  document.body.classList.remove("menu");
}
const rerender = () => go(cur, { push: false, keepScroll: true });

window.addEventListener("popstate", () => { const i = indexOfHash(location.hash.slice(1)); go(i < 0 ? 0 : i, { push: false }); });

/* ---------------------------------------------------------------- clicks */
document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]");
  if (g) { go(+g.dataset.go); return; }
  const a = ev.target.closest("[data-act]");
  if (!a) return;
  const box = a.closest(".codebox");
  switch (a.dataset.act) {
    case "run": runBox(box); break;
    case "edit": editBox(box); break;
    case "restore": restoreBox(box); break;
    case "answer": {
      if (store.quiz[a.dataset.q] !== undefined) return;
      store.quiz[a.dataset.q] = +a.dataset.j; save(); rerender(); break;
    }
    case "retry": for (const k of a.dataset.keys.split(",")) delete store.quiz[k]; save(); rerender(); break;
    case "newexam": store.exam = []; save(); rerender(); break;
    case "peek": {
      const el = $(".codebox", $("#page"));
      const b = boxes.get(el.id);
      restoreBox(el); b.code = `SELECT * FROM ${a.dataset.t};`;
      $(".code-wrap", el).innerHTML = `<pre class="sql">${hl(b.code)}</pre>`;
      runBox(el); break;
    }
    case "resetplay": {
      const el = $(".codebox", $("#page"));
      const e = PAGES[cur];
      runPlayground(e.ch.id, sandboxSQL(e.ch), "SELECT 'tables reset' AS status;", true)
        .then((bl) => setTerm(el, `<pre class="out">${hlOut(transcript(bl))}</pre>`, "live", true))
        .catch((err) => setTerm(el, `<div class="term-cta"><span>${esc(err.message)}</span></div>`));
      break;
    }
  }
});

/* ---------------------------------------------------------------- keys */
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ($("#search").classList.contains("open")) return;
  if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); }
  else if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
  else if (e.key === "/" ) { openSearch(); e.preventDefault(); }
  else if (e.key === "t" || e.key === "T") toggleTheme();
  else if (e.key === "f" || e.key === "F") toggleFullscreen();
  else if (e.key === "Home") go(0);
});

/* ---------------------------------------------------------------- theme + type size */
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("#themeBtn").setAttribute("aria-pressed", String(dark));
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const t = dark ? "light" : "dark";
  prefSet("pgz:theme", t); applyTheme(t);
}
/* full screen: the whole page, not one element, so search and the rail still work.
   Browsers refuse it inside an embedded frame, older Safari only knows the
   webkit- names, and iPhone Safari has none - so when the real thing is not
   granted, "focus mode" gives the same layout inside the window instead. */
const root = document.documentElement;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
function syncFs() {
  const on = !!fsElement() || root.classList.contains("focus");
  $("#fsBtn").setAttribute("aria-pressed", String(on));
  $("#fsBtn .lbl").textContent = on ? "Exit full screen" : "Full screen";
  document.body.classList.remove("menu");
}
let fsAskedAt = 0;
function toggleFullscreen() {
  if (root.classList.contains("focus") || fsElement()) {
    root.classList.remove("focus");
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    syncFs();
    return;
  }
  /* the layout changes at once, whatever the browser decides about true full screen */
  root.classList.add("focus");
  syncFs();
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  if (req) { fsAskedAt = Date.now(); try { Promise.resolve(req.call(root)).catch(() => {}); } catch {} }
}
function onFsChange() {
  /* leaving true full screen with Esc also leaves the full-width layout - unless the
     browser dropped it straight after granting it, as some embedded views do */
  if (!fsElement() && Date.now() - fsAskedAt > 1500) root.classList.remove("focus");
  syncFs();
}
document.addEventListener("fullscreenchange", onFsChange);
document.addEventListener("webkitfullscreenchange", onFsChange);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && root.classList.contains("focus") && !e.target.closest("input, textarea")
      && !$("#search").classList.contains("open")) { root.classList.remove("focus"); syncFs(); }
});
let scale = +prefGet("pgz:scale", 1) || 1;
function applyScale() { document.documentElement.style.setProperty("--scale", scale); prefSet("pgz:scale", scale); }

/* ---------------------------------------------------------------- read aloud */
let speaking = false;
function stopSpeaking() {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); speaking = false;
  $("#listenBtn")?.setAttribute("aria-pressed", "false");
}
function speak() {
  if (!("speechSynthesis" in window)) { alert("This browser cannot read aloud."); return; }
  if (speaking) { stopSpeaking(); return; }
  const text = [...document.querySelectorAll("#page .ptitle, #page .say")].map((n) => n.textContent).join(". ")
    .replace(/\s+/g, " ").replace(/<>/g, " not equal to ");
  const parts = text.match(/[^.!?]+[.!?]*/g) || [];
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === "en-IN") || voices.find((v) => /^en/.test(v.lang));
  speaking = true;
  $("#listenBtn").setAttribute("aria-pressed", "true");
  parts.forEach((s, i) => {
    const u = new SpeechSynthesisUtterance(s.trim());
    if (voice) u.voice = voice;
    u.rate = 0.98;
    if (i === parts.length - 1) u.onend = () => stopSpeaking();
    speechSynthesis.speak(u);
  });
}

/* ---------------------------------------------------------------- search */
const INDEX = PAGES.map((e, i) => {
  if (!e.ch) return null;
  const extra = e.p.kind === "tools" ? e.p.cards.map((c) => c.name + " " + c.sig).join(" ") : "";
  return { i, e, hay: `${e.p.id} ${e.p.title} ${e.p.say || ""} ${extra} ${e.p.sql || ""}`.toLowerCase(),
    title: e.p.title.toLowerCase(), tools: extra.toLowerCase() };
}).filter(Boolean);
let sHits = [], sOn = 0;
function openSearch() {
  $("#search").classList.add("open");
  const inp = $("#sq"); inp.value = ""; doSearch(""); inp.focus();
}
function closeSearch() { $("#search").classList.remove("open"); }
function doSearch(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) { sHits = []; $("#sres").innerHTML = `<div class="snone">Type a topic or a function: <code>coalesce</code>, <code>left join</code>, <code>rank</code>, <code>null</code>...</div>`; return; }
  sHits = INDEX.filter((x) => words.every((w) => x.hay.includes(w)))
    .map((x) => ({ ...x, score: words.reduce((s, w) => s + (x.title.includes(w) ? 3 : 0) + (x.tools.includes(w) ? 2 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.i - b.i).slice(0, 30);
  sOn = 0;
  $("#sres").innerHTML = sHits.length ? sHits.map((x, k) => `<button class="sr ${k === 0 ? "on" : ""}" data-sr="${x.i}">
      <span class="where">${x.e.ch.id === "fin" ? "Finale" : "Ch " + x.e.ch.num}${/\d/.test(x.e.p.id) ? " · " + esc(x.e.p.id) : ""}</span>
      <span>${esc(x.e.p.title)}<small>${esc(x.e.ch.title)}</small></span></button>`).join("")
    : `<div class="snone">Nothing found for "${esc(q)}".</div>`;
}
function initSearch() {
  const inp = $("#sq");
  inp.addEventListener("input", () => doSearch(inp.value));
  inp.addEventListener("keydown", (e) => {
    const rows = [...document.querySelectorAll(".sr")];
    if (e.key === "Escape") closeSearch();
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!rows.length) return;
      sOn = (sOn + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length;
      rows.forEach((r, k) => r.classList.toggle("on", k === sOn));
      rows[sOn].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && rows[sOn]) { closeSearch(); go(+rows[sOn].dataset.sr); }
  });
  $("#search").addEventListener("click", (e) => {
    const r = e.target.closest("[data-sr]");
    if (r) { closeSearch(); go(+r.dataset.sr); } else if (e.target.id === "search") closeSearch();
  });
}

/* ---------------------------------------------------------------- start */
function start() {
  applyTheme(prefGet("pgz:theme", null));
  applyScale();
  $("#prev").onclick = () => go(cur - 1);
  $("#next").onclick = () => go(cur + 1);
  $("#themeBtn").onclick = toggleTheme;
  $("#fsBtn").onclick = toggleFullscreen;
  $("#searchBtn").onclick = openSearch;
  $("#listenBtn").onclick = speak;
  $("#smaller").onclick = () => { scale = Math.max(0.8, +(scale - 0.1).toFixed(2)); applyScale(); };
  $("#bigger").onclick = () => { scale = Math.min(1.5, +(scale + 0.1).toFixed(2)); applyScale(); };
  $("#menuBtn").onclick = () => document.body.classList.toggle("menu");
  $("#homeBtn").onclick = () => go(0);
  initSearch();
  onStatus((s) => {
    const el = $("#pg");
    el.dataset.s = s;
    $(".lbl", el).textContent = { idle: "PostgreSQL loads when needed", loading: "Starting PostgreSQL...", ready: "PostgreSQL 18 ready", error: "PostgreSQL offline" }[s];
  });
  const i = indexOfHash(location.hash.slice(1));
  go(i < 0 ? 0 : i, { push: false });
}
start();
