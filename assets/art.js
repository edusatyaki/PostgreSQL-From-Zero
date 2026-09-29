/* ===========================================================================
   art.js - the book's drawings, as inline SVG so they follow the theme.
   Every colour is a CSS class (see "art" in book.css), never a hex value, so
   the same drawing works on cream paper and in dark mode. Groups with class
   "g" and a --i index rise in one after another.
   =========================================================================== */
let uid = 0;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const R = (x, y, w, h, c = "a-box", rx = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${c}"/>`;
const T = (x, y, s, c = "a-t", a = "middle") => `<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${esc(s)}</text>`;
const G = (i, body) => `<g class="g" style="--i:${i}">${body}</g>`;
const L = (x1, y1, x2, y2, c = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="a-line ${c}"/>`;
/* an arrow is a line with its own little head, so no shared marker ids */
function A(x1, y1, x2, y2, c = "") {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 9;
  const p = (d) => `${x2 - s * Math.cos(a + d)},${y2 - s * Math.sin(a + d)}`;
  return L(x1, y1, x2, y2, c) + `<polygon points="${x2},${y2} ${p(0.45)} ${p(-0.45)}" class="ah ${c}"/>`;
}
const P = (d, c = "") => `<path d="${d}" class="a-line ${c}"/>`;
const svg = (w, h, label, body) =>
  `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" data-u="${++uid}">${body}</svg>`;

/* a small table: header cells + rows; hi = {row: i} or {col: j} */
function mini(x, y, cols, rows, o = {}) {
  const cw = o.cw || 88, rh = o.rh || 28;
  let s = "";
  cols.forEach((c, j) => { s += R(x + j * cw, y, cw, rh, o.head || "a-hi", 0) + T(x + j * cw + cw / 2, y + 19, c, "a-s a-m"); });
  rows.forEach((r, i) => r.forEach((v, j) => {
    const cls = o.rowCls?.[i] || (o.hiRow === i || o.hiCol === j ? "a-blue" : "a-box");
    s += R(x + j * cw, y + (i + 1) * rh, cw, rh, cls, 0) + T(x + j * cw + cw / 2, y + (i + 1) * rh + 19, v, "a-m");
  }));
  return s;
}

const ART = {
  register: () => svg(640, 270, "A table with its columns, rows and one cell labelled", [
    G(0, T(90, 30, "table: students", "a-b", "start")),
    G(1, mini(90, 45, ["roll_no", "name", "branch", "marks"],
      [["21", "Amit", "CSE", "98"], ["22", "Amrita", "", "98"], ["23", "Jyoti", "ECE", "96"], ["24", "Ankit", "CSE", "98"]],
      { cw: 100, hiRow: 2 })),
    G(2, R(190, 45, 100, 140, "a-ghost", 4) + A(240, 222, 240, 190, "blue") + T(240, 240, "a column: one kind of value", "a-s")),
    G(3, A(560, 144, 495, 144, "blue") + T(565, 140, "a row:", "a-s", "start") + T(565, 156, "one student", "a-s", "start")),
    G(4, `<circle cx="440" cy="87" r="22" class="a-ghost"/>` + A(520, 38, 458, 72, "red") + T(530, 30, "a cell: Amit's marks, 98", "a-s a-red-t")),
  ].join("")),

  librarian: () => svg(660, 220, "You ask in SQL, PostgreSQL fetches from the database and returns a result table", [
    G(0, R(10, 70, 110, 70, "a-hi") + T(65, 100, "You", "a-b") + T(65, 120, "ask a question", "a-s")),
    G(1, A(125, 92, 225, 92) + T(175, 80, "SQL", "a-b a-blue-t") + T(175, 112, "SELECT ...", "a-s a-m")),
    G(2, R(230, 55, 170, 100, "a-blue") + T(315, 95, "PostgreSQL", "a-b") + T(315, 117, "the DBMS: the librarian", "a-s")),
    G(3, A(405, 105, 480, 105) + `<ellipse cx="560" cy="62" rx="70" ry="16" class="a-box"/>` + P("M490 62 v96 a70 16 0 0 0 140 0 v-96", "") +
      T(560, 115, "database", "a-b") + T(560, 135, "tables", "a-s")),
    G(4, P("M480 165 C 420 205, 200 210, 120 150", "green") + `<polygon points="120,150 132,152 125,161" class="ah green"/>` + T(320, 205, "the result: always a table", "a-s a-green-t")),
  ].join("")),

  pagetour: () => svg(680, 150, "Each page flows from situation to code to output to explanation", [
    ["Situation", "the problem", "a-box"], ["Code", "edit it, Run it", "a-hi"], ["Output", "real PostgreSQL", "a-blue"], ["Why", "the idea behind it", "a-green"],
  ].map(([t, s, c], i) => G(i, R(10 + i * 170, 35, 140, 80, c) + T(80 + i * 170, 70, t, "a-b") + T(80 + i * 170, 92, s, "a-s") +
    (i < 3 ? A(152 + i * 170, 75, 178 + i * 170, 75) : ""))).join("")),

  nullcell: () => svg(600, 170, "NULL is not zero and not empty text: it is unknown", [
    G(0, R(230, 40, 140, 70, "a-hi") + T(300, 84, "NULL", "a-b")),
    G(1, R(20, 50, 120, 50, "a-box") + T(80, 80, "0", "a-b") + L(20, 50, 140, 100, "red") + T(80, 125, "not zero", "a-s a-red-t")),
    G(2, R(460, 50, 120, 50, "a-box") + T(520, 80, "''", "a-b") + L(460, 50, 580, 100, "red") + T(520, 125, "not empty text", "a-s a-red-t")),
    G(3, T(300, 140, "it means: the value is unknown / not supplied", "a-t a-green-t")),
  ].join("")),

  families: () => svg(680, 230, "DDL changes structure, DML changes rows, DQL only reads", [
    ["DDL", "the structure", ["CREATE", "ALTER", "DROP", "TRUNCATE"], "a-red"],
    ["DML", "the rows", ["INSERT", "UPDATE", "DELETE"], "a-hi"],
    ["DQL", "only reads", ["SELECT"], "a-green"],
  ].map(([t, s, cmds, c], i) => G(i, R(20 + i * 220, 20, 200, 190, c, 14) + T(120 + i * 220, 55, t, "a-b") + T(120 + i * 220, 76, s, "a-s") +
    cmds.map((k, j) => R(55 + i * 220, 92 + j * 28, 130, 22, "a-box", 6) + T(120 + i * 220, 108 + j * 28, k, "a-m")).join(""))).join("")),

  deletetrio: () => {
    const reg = (x, rows) => R(x, 50, 150, 26, "a-hi", 0) + rows.map((c, i) => R(x, 76 + i * 26, 150, 26, c, 0)).join("");
    return svg(660, 230, "DELETE removes chosen rows, TRUNCATE empties the table, DROP removes the table", [
      G(0, T(95, 32, "DELETE ... WHERE", "a-b") + reg(20, ["a-box", "a-red", "a-box", "a-red"]) + L(30, 115, 160, 115, "red") + L(30, 167, 160, 167, "red") + T(95, 205, "chosen rows go", "a-s")),
      G(1, T(330, 32, "TRUNCATE", "a-b") + reg(255, ["a-ghost", "a-ghost", "a-ghost", "a-ghost"]) + T(330, 205, "all rows go, table stays", "a-s")),
      G(2, T(565, 32, "DROP", "a-b") + R(490, 50, 150, 130, "a-ghost", 0) + L(490, 50, 640, 180, "red") + L(640, 50, 490, 180, "red") + T(565, 205, "the table itself goes", "a-s a-red-t")),
    ].join(""));
  },

  sieve: () => svg(660, 250, "WHERE lets only matching rows through", [
    G(0, ["CSE", "ECE", "CSE", "ME", "CSE", "ECE"].map((b, i) => R(40 + i * 100, 20, 80, 30, b === "CSE" ? "a-blue" : "a-box", 15) + T(80 + i * 100, 40, b, "a-m")).join("")),
    G(1, P("M60 75 L600 75 L400 150 L260 150 Z", "") + T(330, 110, "WHERE branch = 'CSE'", "a-b a-m")),
    G(2, A(330, 152, 330, 185, "green") + [0, 1, 2].map((i) => R(210 + i * 90, 192, 80, 30, "a-blue", 15) + T(250 + i * 90, 212, "CSE", "a-m")).join("")),
    G(3, T(590, 180, "ECE, ME:", "a-s a-red-t", "end") + T(590, 196, "filtered out", "a-s a-red-t", "end")),
  ].join("")),

  order: () => {
    const w = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"];
    const e = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "DISTINCT", "ORDER BY", "LIMIT"];
    return svg(700, 230, "Written order versus executed order: SELECT runs after WHERE", [
      G(0, T(10, 30, "you write", "a-s", "start") + w.map((k, i) => R(10 + i * 96, 40, 88, 34, k === "SELECT" ? "a-hi" : "a-box", 8) + T(54 + i * 96, 62, k, "a-m")).join("")),
      G(1, T(10, 130, "PostgreSQL runs", "a-s", "start") + e.map((k, i) => R(10 + i * 86, 140, 80, 34, k === "SELECT" ? "a-hi" : k === "WHERE" ? "a-blue" : "a-box", 8) + T(50 + i * 86, 162, k, "a-m") +
        (i < e.length - 1 ? A(90 + i * 86, 157, 96 + i * 86, 157) : "")).join("")),
      G(2, A(54, 76, 390, 138, "red dash") + T(360, 205, "SELECT names the columns only after WHERE has run,", "a-s a-red-t") +
        T(360, 222, "so WHERE cannot use a SELECT alias", "a-s a-red-t")),
    ].join(""));
  },

  machine: () => svg(640, 150, "A function takes a value in and hands a new value out", [
    G(0, R(10, 50, 140, 50, "a-box") + T(80, 81, "'asha'", "a-m")),
    G(1, A(155, 75, 215, 75) + R(220, 30, 200, 90, "a-hi", 16) + T(320, 72, "UPPER( )", "a-b a-m") + T(320, 96, "a function", "a-s")),
    G(2, A(425, 75, 485, 75) + R(490, 50, 140, 50, "a-green") + T(560, 81, "'ASHA'", "a-m")),
    G(3, T(80, 125, "input (the argument)", "a-s") + T(560, 125, "output", "a-s") + T(320, 142, "the original value is never changed", "a-s")),
  ].join("")),

  numberline: () => {
    const line = (y, a, b, label, marks) => {
      const x = (v) => 60 + (v - a) * ((580 - 60) / (b - a));
      let s = L(40, y, 600, y) + T(20, y + 5, label, "a-s", "start");
      for (let v = a; v <= b; v++) s += L(x(v), y - 6, x(v), y + 6) + T(x(v), y + 24, String(v), "a-m");
      return s + marks.map(([v, t, c, up]) => `<circle cx="${x(v)}" cy="${y}" r="6" class="${c}"/>` + T(x(v), y + (up ? -14 : 42), t, "a-s a-m")).join("");
    };
    return svg(640, 230, "FLOOR goes down the number line, CEIL goes up, TRUNC goes toward zero", [
      G(0, line(60, 44, 47, "", [[45.678, "45.678", "a-hi", true], [45, "FLOOR, TRUNC = 45", "a-blue", false], [46, "CEIL = 46", "a-green", false]])),
      G(1, line(165, -47, -44, "", [[-45.678, "-45.678", "a-hi", true], [-46, "FLOOR = -46", "a-blue", false], [-45, "CEIL, TRUNC = -45", "a-green", false]])),
    ].join(""));
  },

  nullbox: () => svg(660, 210, "Anything compared or combined with NULL gives NULL; only IS NULL gives a yes or no", [
    G(0, R(260, 20, 140, 60, "a-hi") + T(330, 57, "NULL = ?", "a-b")),
    ...[["NULL = NULL", "NULL"], ["100 + NULL", "NULL"], ["'Hi' || NULL", "NULL"], ["NULL IS NULL", "true"]].map(([q, a], i) =>
      G(i + 1, R(15 + i * 162, 110, 150, 34, "a-box", 8) + T(90 + i * 162, 132, q, "a-m") + A(90 + i * 162, 148, 90 + i * 162, 170, a === "true" ? "green" : "red") +
        T(90 + i * 162, 192, a, a === "true" ? "a-b a-green-t" : "a-b a-red-t"))),
  ].join("")),

  nesting: () => svg(680, 200, "Nested functions are read from the inside out", [
    G(0, R(10, 30, 660, 130, "a-hi", 16) + T(30, 58, "3. UPPER(", "a-b a-m", "start")),
    G(1, R(60, 70, 560, 76, "a-blue", 14) + T(80, 96, "2. SPLIT_PART(", "a-b a-m", "start") + T(600, 136, ", '@', 2 )", "a-m", "end")),
    G(2, R(250, 100, 200, 36, "a-box", 10) + T(350, 124, "1. TRIM(email)", "a-b a-m")),
    G(3, T(340, 188, "the innermost runs first; its answer feeds the next layer out", "a-s")),
  ].join("")),

  buckets: () => {
    const clans = [["Maratha", "a-hi"], ["Chola", "a-blue"], ["Vijaya", "a-green"], ["Rajputana", "a-red"]];
    const rows = [0, 1, 0, 2, 3, 1, 0, 2, 1, 3, 0, 2];
    return svg(680, 250, "GROUP BY sorts rows into one bucket per clan; each bucket becomes one row", [
      G(0, rows.map((c, i) => R(20 + i * 54, 15, 46, 22, clans[c][1], 11)).join("") + T(340, 58, "20 rows, one per student", "a-s")),
      G(1, clans.map(([n, c], i) => P(`M${40 + i * 165} 80 L${60 + i * 165} 150 L${140 + i * 165} 150 L${160 + i * 165} 80`, "") + T(100 + i * 165, 140, n, "a-t")).join("")),
      G(2, clans.map(([n, c], i) => A(100 + i * 165, 155, 100 + i * 165, 185) + R(40 + i * 165, 190, 120, 30, c, 6) + T(100 + i * 165, 210, n + " | ...", "a-s a-m")).join("")),
      G(3, T(340, 245, "one row per group: student_id no longer exists here", "a-s a-red-t")),
    ].join(""));
  },

  wherehaving: () => svg(700, 160, "WHERE filters rows before grouping, HAVING filters groups after", [
    ["rows", "20 students", "a-box"], ["WHERE", "drop rows", "a-blue"], ["GROUP BY", "make groups", "a-hi"], ["HAVING", "drop groups", "a-blue"], ["result", "3 clans", "a-green"],
  ].map(([t, s, c], i) => G(i, R(10 + i * 140, 45, 115, 70, c, 12) + T(67 + i * 140, 77, t, "a-b") + T(67 + i * 140, 98, s, "a-s") +
    (i < 4 ? A(127 + i * 140, 80, 148 + i * 140, 80) : ""))).join("") + G(5, T(350, 145, "aggregates like sum(score) only exist from GROUP BY onwards", "a-s"))),

  collapsekeep: () => {
    const col = (x, n, c, w = 110) => Array.from({ length: n }, (_, i) => R(x, 40 + i * 30, w, 24, c, 6)).join("");
    return svg(700, 230, "GROUP BY collapses rows into one; OVER keeps every row and attaches the answer", [
      G(0, T(170, 25, "GROUP BY", "a-b") + col(20, 4, "a-box") + A(135, 100, 190, 100) + R(200, 88, 120, 24, "a-hi", 6) + T(260, 105, "avg", "a-m") + T(170, 185, "4 rows in, 1 row out", "a-s a-red-t")),
      G(1, T(530, 25, "OVER ()", "a-b") + col(380, 4, "a-box") + A(495, 100, 520, 100) + col(530, 4, "a-box", 80) +
        Array.from({ length: 4 }, (_, i) => R(612, 40 + i * 30, 70, 24, "a-hi", 6) + T(647, 57 + i * 30, "avg", "a-m")).join("") + T(530, 185, "4 rows in, 4 rows out", "a-s a-green-t")),
      G(2, T(350, 218, "calculate and keep", "a-b")),
    ].join(""));
  },

  partitions: () => {
    const who = [["Aarav", 4, "a-hi", "10994"], ["Arjun", 3, "a-blue", "7092"], ["Ishaan", 3, "a-green", "6496"]];
    let y = 15, s = "";
    who.forEach(([n, k, c, t], g) => {
      let b = "";
      for (let i = 0; i < k; i++) b += R(40, y + i * 24, 300, 20, c, 4) + T(50, y + i * 24 + 15, n, "a-s a-m", "start") + T(420, y + i * 24 + 15, t, "a-m");
      b += P(`M350 ${y} q14 0 14 14 v${k * 24 - 32} q0 14 -14 14`, "");
      s += G(g, b);
      y += k * 24 + 12;
    });
    return svg(560, y + 20, "PARTITION BY splits rows into groups and repeats each group's total on its rows", s + G(3, T(480, 30, "sum per", "a-s") + T(480, 46, "partition,", "a-s") + T(480, 62, "on every row", "a-s")));
  },

  ranks: () => svg(640, 210, "Ties: ROW_NUMBER gives 1 2 3 4, RANK gives 1 1 3 4, DENSE_RANK gives 1 1 2 3", [
    G(0, T(90, 30, "score", "a-b") + ["90", "90", "85", "80"].map((v, i) => R(50, 45 + i * 38, 80, 30, i < 2 ? "a-hi" : "a-box", 6) + T(90, 65 + i * 38, v, "a-m")).join("")),
    ...[["ROW_NUMBER", ["1", "2", "3", "4"]], ["RANK", ["1", "1", "3", "4"]], ["DENSE_RANK", ["1", "1", "2", "3"]]].map(([n, v], j) =>
      G(j + 1, T(250 + j * 140, 30, n, "a-b a-m") + v.map((x, i) => R(215 + j * 140, 45 + i * 38, 70, 30, "a-blue", 6) + T(250 + j * 140, 65 + i * 38, x, "a-b")).join(""))),
    G(4, T(390, 205, "RANK skips 2 after the tie; DENSE_RANK does not", "a-s a-red-t")),
  ].join("")),

  laglead: () => svg(640, 200, "LAG reads the row before, LEAD reads the row after, inside the same partition", [
    G(0, ["2598", "1499", "3398", "3499"].map((v, i) => R(40 + i * 150, 80, 110, 40, i === 2 ? "a-hi" : "a-box", 8) + T(95 + i * 150, 105, v, "a-m")).join("")),
    G(1, P("M245 78 C 270 30, 330 30, 355 76", "blue") + `<polygon points="355,76 344,70 350,64" class="ah blue"/>` + T(300, 30, "LAG: the row before", "a-s a-blue-t")),
    G(2, P("M545 122 C 520 170, 460 170, 440 124", "green") + `<polygon points="440,124 449,133 438,135" class="ah green"/>` + T(495, 185, "LEAD: the row after", "a-s a-green-t")),
    G(3, T(95, 150, "first row: LAG = NULL", "a-s a-red-t")),
  ].join("")),

  frame: () => svg(720, 250, "With ORDER BY the default frame ends at the current row; the full frame covers the whole partition", [
    G(0, ["day 1", "day 2", "day 3 (current row)", "day 4", "day 5"].map((v, i) => R(200, 20 + i * 40, 240, 32, i === 2 ? "a-hi" : "a-box", 8) + T(320, 41 + i * 40, v, "a-m")).join("")),
    G(1, P("M185 22 h-20 v110 h20", "blue") + T(155, 72, "default frame:", "a-s a-blue-t", "end") + T(155, 88, "start to current", "a-s a-blue-t", "end")),
    G(2, P("M455 22 h20 v190 h-20", "green") + T(485, 110, "ROWS BETWEEN", "a-s a-green-t", "start") + T(485, 126, "UNBOUNDED PRECEDING AND", "a-s a-green-t", "start") + T(485, 142, "UNBOUNDED FOLLOWING", "a-s a-green-t", "start")),
    G(3, T(330, 240, "LAST_VALUE sees only the blue frame unless you widen it", "a-s a-red-t")),
  ].join("")),

  running: () => svg(560, 230, "A running total grows day by day: 180, 440, 860", [
    ...[[180, 180], [260, 440], [420, 860]].map(([d, r], i) => G(i,
      R(80 + i * 160, 200 - r / 5, 90, r / 5, "a-hi", 4) + R(80 + i * 160, 200 - d / 5, 90, d / 5, "a-blue", 4) +
      T(125 + i * 160, 192 - r / 5, String(r), "a-b") + T(125 + i * 160, 222, "day " + (i + 1), "a-s"))),
    G(3, T(20, 30, "blue: today's danger", "a-s a-blue-t", "start") + T(20, 48, "yellow: running total", "a-s", "start")),
  ].join("")),

  insideout: () => svg(680, 210, "The inner query runs first and hands its answer to the outer query", [
    G(0, R(10, 20, 660, 170, "a-box", 16) + T(30, 50, "SELECT name FROM students WHERE student_id IN (", "a-m", "start") + T(30, 175, ")", "a-m", "start")),
    G(1, R(60, 70, 380, 60, "a-hi", 12) + T(250, 105, "SELECT student_id FROM marks WHERE score > 80", "a-m") + T(250, 150, "1. runs first", "a-s")),
    G(2, A(445, 100, 510, 100, "green") + R(515, 80, 120, 40, "a-green", 10) + T(575, 105, "1, 3, 5", "a-b a-m") + T(575, 150, "2. feeds the outer query", "a-s")),
  ].join("")),

  correlated: () => svg(680, 230, "A correlated subquery is re-asked for every outer row", [
    G(0, T(90, 25, "students s", "a-b") + ["Aarav", "Diya", "Kabir", "Meera"].map((n, i) => R(30, 40 + i * 42, 120, 32, "a-box", 8) + T(90, 61 + i * 42, n, "a-m")).join("")),
    G(1, R(260, 70, 250, 80, "a-hi", 12) + T(385, 102, "any mark > 85 for", "a-t") + T(385, 124, "THIS student?", "a-b")),
    G(2, [0, 1, 2, 3].map((i) => A(155, 56 + i * 42, 255, 110, "blue dash")).join("")),
    G(3, ["yes", "no", "yes", "no"].map((a, i) => T(600, 61 + i * 42, `${["Aarav", "Diya", "Kabir", "Meera"][i]}: ${a}`, a === "yes" ? "a-t a-green-t" : "a-t a-red-t")).join("") + A(515, 110, 545, 110)),
  ].join("")),

  joinmatch: () => {
    const cs = [["1", "Aarav"], ["2", "Diya"], ["3", "Kabir"]];
    const os = [["101", "1"], ["102", "1"], ["103", "2"], ["104", "4"]];
    return svg(660, 250, "Rows are matched by customer_id; Kabir and order 104 have no partner", [
      G(0, T(120, 25, "customers", "a-b") + cs.map(([id, n], i) => R(40, 40 + i * 50, 160, 36, i === 2 ? "a-red" : "a-box", 8) + T(120, 63 + i * 50, `${id}  ${n}`, "a-m")).join("")),
      G(1, T(540, 25, "orders", "a-b") + os.map(([o, c], i) => R(460, 40 + i * 50, 160, 36, i === 3 ? "a-red" : "a-box", 8) + T(540, 63 + i * 50, `${o}  cust ${c}`, "a-m")).join("")),
      G(2, A(205, 58, 455, 58, "green") + A(205, 58, 455, 108, "green") + A(205, 108, 455, 158, "green")),
      G(3, T(120, 215, "Kabir: no orders", "a-s a-red-t") + T(540, 245, "104: customer 4 does not exist", "a-s a-red-t")),
    ].join(""));
  },

  leftexcl: () => svg(560, 220, "Left exclusive: rows in the left table with no match in the right", [
    G(0, `<circle cx="210" cy="105" r="85" class="a-red"/>`),
    G(1, `<circle cx="330" cy="105" r="85" class="a-box" style="fill-opacity:.85"/>` + `<path d="M270 45 A85 85 0 0 1 270 165 A85 85 0 0 1 270 45 Z" class="a-box"/>`),
    G(2, T(165, 110, "customers", "a-b") + T(165, 128, "with no order", "a-s") + T(375, 110, "orders", "a-b")),
    G(3, T(280, 210, "LEFT JOIN ... WHERE o.customer_id IS NULL", "a-m")),
  ].join("")),

  schema: () => {
    const box = (x, y, t, cols, c = "a-box") => R(x, y, 150, 38 + cols.length * 18, c, 10) + T(x + 75, y + 20, t, "a-b") + cols.map((k, i) => T(x + 12, y + 44 + i * 18, k, "a-s a-m", "start")).join("");
    return svg(700, 320, "customers to orders to order_items to products, and payments to orders", [
      G(0, box(20, 20, "customers", ["customer_id  PK", "full_name", "email  UNIQUE", "city"], "a-hi")),
      G(1, box(275, 20, "orders", ["order_id  PK", "customer_id  FK", "order_date", "status"], "a-blue") + A(172, 60, 272, 60)),
      G(2, box(275, 180, "order_items", ["order_id  FK", "product_id  FK", "quantity", "price_each"], "a-blue") + A(350, 132, 350, 177)),
      G(3, box(530, 180, "products", ["product_id  PK", "product_name", "category", "unit_price"], "a-hi") + A(527, 225, 428, 225)),
      G(4, box(530, 20, "payments", ["payment_id  PK", "order_id  FK", "amount", "method"], "a-blue") + A(428, 60, 527, 60)),
      G(5, T(350, 312, "arrows point from parent to child: the child row must point at a parent that exists", "a-s")),
    ].join(""));
  },

  cte: () => svg(680, 230, "Two CTEs aggregate each child table separately, then the final query joins them", [
    G(0, R(20, 20, 280, 70, "a-hi", 12) + T(160, 48, "WITH order_value AS (...)", "a-m") + T(160, 72, "sum of items, 1 row per order", "a-s")),
    G(1, R(380, 20, 280, 70, "a-hi", 12) + T(520, 48, "paid AS (...)", "a-m") + T(520, 72, "sum of payments, 1 row per order", "a-s")),
    G(2, A(160, 95, 300, 140) + A(520, 95, 380, 140) + R(190, 145, 300, 60, "a-green", 12) + T(340, 172, "SELECT ... JOIN ... LEFT JOIN", "a-m") + T(340, 194, "no double counting", "a-s")),
  ].join("")),

  cascade: () => svg(660, 210, "Deleting a customer cascades to her order, its items and its payment", [
    G(0, R(20, 80, 140, 50, "a-red") + T(90, 110, "Priya", "a-b") + L(20, 80, 160, 130, "red")),
    G(1, A(165, 105, 235, 105, "red") + R(240, 80, 140, 50, "a-red") + T(310, 110, "order 3", "a-b") + L(240, 80, 380, 130, "red")),
    G(2, A(385, 95, 455, 45, "red") + R(460, 20, 180, 44, "a-red") + T(550, 47, "2 order items", "a-t") + L(460, 20, 640, 64, "red")),
    G(3, A(385, 115, 455, 160, "red") + R(460, 140, 180, 44, "a-red") + T(550, 167, "1 payment", "a-t") + L(460, 140, 640, 184, "red")),
    G(4, T(90, 170, "DELETE 1", "a-m") + T(90, 190, "...but 5 rows went", "a-s a-red-t")),
  ].join("")),
};

/** The drawing for `name` as a <figure>, or "" when there is none. */
export function art(name) {
  const f = ART[name];
  if (!f) return "";
  const s = f();
  const label = /aria-label="([^"]*)"/.exec(s)?.[1] || "";
  return `<figure class="art">${s}<figcaption>${label}</figcaption></figure>`;
}
