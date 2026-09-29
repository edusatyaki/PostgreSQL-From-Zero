/* ===========================================================================
   book/index.js - the table of contents. One module per chapter; this file
   puts them in order and gives every page a stable id, used for the URL
   (#ch3/3.12), for saved progress, and as the key into book/outputs.js.

   Page kinds (see any chapter file for real examples):
     intro   a page of explanation, optionally with a drawing (art: "name")
     table   the chapter's data: CREATE + INSERT, shown with a SELECT
     lesson  Situation -> Code -> Output -> Explanation, runnable and editable
     tools   the chapter's important functions, one card each, all runnable
     quiz    concept MCQs; `check` runs a query that must return the answer
     debug   bug hunt: a broken query, its real error, pick the fix
     recap   points to remember
   =========================================================================== */
import ch0 from "./ch00.js";
import ch1 from "./ch01.js";
import ch2 from "./ch02.js";
import ch3 from "./ch03.js";
import ch4 from "./ch04.js";
import ch5 from "./ch05.js";
import ch6 from "./ch06.js";
import ch7 from "./ch07.js";
import ch8 from "./ch08.js";
import ch9 from "./ch09.js";
import fin from "./ch10.js";

export const CHAPTERS = [ch0, ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, fin];

/* ids for pages that do not carry one of their own */
for (const ch of CHAPTERS) {
  const seen = {};
  for (const p of ch.pages) {
    if (!p.id) {
      seen[p.kind] = (seen[p.kind] || 0) + 1;
      p.id = seen[p.kind] === 1 ? p.kind : `${p.kind}-${seen[p.kind]}`;
    }
  }
}

export const pageKey = (ch, p) => `${ch.id}/${p.id}`;

/** What quizzes, toolbox cards, bug hunts and the sandbox run against: the
    chapter's own `sandbox` script, or else every table page's setup. */
export function sandboxSQL(ch) {
  if (ch.sandbox) return ch.sandbox;
  return ch.pages.filter((p) => p.kind === "table").map((p) => p.sql).join("\n\n");
}

/** Everything that must run before a lesson so the data looks the way it did
    in class at that moment: every earlier table page and lesson, in order. */
export function replaySQL(ch, page) {
  const parts = [];
  for (const p of ch.pages) {
    if (p === page) break;
    if (p.kind === "table" || p.kind === "lesson") parts.push(p.sql);
  }
  return parts.join("\n\n");
}
