/* ===========================================================================
   book/narrate.js - what the narrator says on each page.

   Built from the same chapter data the page shows, so the words never drift
   from the text. Used twice: tools/gen_audio.py records it with Microsoft's
   Indian English female voice (en-IN-NeerjaNeural) into audio/<file>.mp3, and
   the page falls back to the browser's own voice with the same words when a
   clip is missing.
   =========================================================================== */

/** audio/<this>.mp3 for a page; `ch` is null for the cover */
export const audioFile = (ch, p) => (ch ? `${ch.id}-${p.id}` : "cover").replace(/[^A-Za-z0-9-]/g, "_");

const ENT = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
function plain(html) {
  return String(html || "")
    .replace(/<li>/g, ". ").replace(/<\/(p|li|h\d|tr|div)>/g, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, (e) => ENT[e] ?? " ");
}

/** Turn written SQL-ish text into something a voice can say. */
export function speakable(t) {
  return plain(t)
    .replace(/'([^'\s]{1,24})'/g, "$1")
    .replace(/<>|!=/g, " not equal to ")
    .replace(/>=/g, " greater than or equal to ").replace(/<=/g, " less than or equal to ")
    .replace(/ > /g, " greater than ").replace(/ < /g, " less than ")
    .replace(/\|\|/g, " double pipe ")
    .replace(/::/g, " cast to ")
    .replace(/\(\*\)/g, " star ").replace(/\*/g, " star ")
    .replace(/(\d)\s*x\s*(\d)/g, "$1 times $2")
    .replace(/%/g, " percent ")
    .replace(/\b(DDL|DML|DQL|DBMS|CTE|UTF|psql|PK|FK|SQL)\b/g, (m) => (m === "SQL" ? "S Q L" : m.toUpperCase().split("").join(" ")))
    .replace(/PostgreS Q L/g, "Postgres Q L")
    .replace(/([A-Za-z])_([A-Za-z])/g, "$1 $2").replace(/([A-Za-z])_([A-Za-z])/g, "$1 $2")
    .replace(/_/g, " underscore ")
    .replace(/\bvs\b/g, "versus")
    .replace(/[;(]/g, ", ").replace(/\)/g, ",")
    .replace(/[`"[\]{}]/g, " ")
    .replace(/\s+([.,:!?])/g, "$1")
    .replace(/,\s*([,.:!?])/g, "$1").replace(/:\s*\./g, ".")
    .replace(/([.!?])\s*\.+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const join = (...parts) => parts.filter(Boolean).map((s) => s.trim().replace(/[.:]?$/, ".")).join(" ");
/* a small table read row by row: "Pattern percent: zero or more characters" */
const gridWords = (g) => (g && g.head.length <= 3
  ? g.rows.map((r) => `${plain(r[0])}: ${r.slice(1).map(plain).join(", ")}`).join(". ")
  : "");
const chName = (ch) => (ch.id === "fin" ? "The finale" : `Chapter ${ch.num}`);

/** The words for one page. */
export function narration(ch, p) {
  if (!ch) {
    return speakable(join(
      "Welcome to PostgreSQL from Zero",
      "This book is for someone who has never written a line of S Q L",
      "Ten short chapters take you from, what is a table, to window functions, joins, and a five table shop with foreign keys",
      "Every example is a real problem, and every query runs on a real PostgreSQL database inside this page",
      "Press Start at Chapter 0 when you are ready"));
  }
  const n = [];
  switch (p.kind) {
    case "opener": {
      const o = ch.opener;
      n.push(`${chName(ch)}: ${ch.title}`, o.question, o.story, "By the end of this chapter, you can", ...o.learn);
      break;
    }
    case "intro":
      n.push(p.title, p.html);
      break;
    case "table":
      n.push(`${p.title}`, p.say, p.explain, gridWords(p.grid), "Press Run to see the rows");
      break;
    case "lesson":
      n.push(`${p.id}. ${p.title}`, `The situation: ${p.say}`);
      if (p.predict) n.push(`Before you run it, think: ${p.predict}`, "Now press Run, and check your guess");
      else n.push("Press Run to see what PostgreSQL returns");
      n.push(p.explain || "", gridWords(p.grid));
      break;
    case "tools":
      n.push(p.title, "Each card is one tool, with a live example you can change",
        ...p.cards.map((c) => `${c.name}: ${c.does}`));
      break;
    case "quiz":
      n.push(`${chName(ch)} checkpoint`, `${p.qs.length} questions`,
        "Pick an answer for each one. You find out at once whether it is right, and why");
      break;
    case "debug":
      n.push(`${chName(ch)} bug hunt`, `${p.qs.length} broken queries`,
        "For each one, read what PostgreSQL said, or for the silent ones, what it wrongly returned. Then pick the version that does the task correctly",
        "Reading error messages calmly is one of the most useful skills you can build");
      break;
    case "exam":
      n.push("The final challenge", `${p.count} questions, picked at random from every chapter`, "Take your time. Good luck");
      break;
    case "recap":
      n.push(`${chName(ch)}: points to remember`, ...p.items);
      break;
    case "play":
      n.push(`${chName(ch)} playground`,
        "This is your own space with the chapter's tables. Write any query and press Run. The tables keep your changes until you press Reset tables, and nothing here can break the book");
      break;
  }
  if (p.note) n.push(`Watch out: ${p.note}`);
  if (p.tip) n.push(`Try this: ${p.tip}`);
  return speakable(join(...n.map(plain)));
}
