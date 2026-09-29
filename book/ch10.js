/* The finale - the whole course on one page, and a mixed final challenge. */
export default {
  id: "fin",
  num: 10,
  title: "The whole course",
  topic: "Quick reference and the final challenge",
  accent: "amber",
  opener: {
    question: "Can you still do all of it, mixed up?",
    story: `You have gone from "what is a table?" to five-table reports with CTEs and window functions. This last stop puts
      the whole course on a few pages you can come back to, then gives you a final challenge drawn at random from every
      chapter's checkpoint.`,
    learn: [
      "The execution order, the NULL rules and the ranking functions, on one page each",
      "Eight query patterns worth memorising",
      "A final challenge: 15 questions from every chapter",
    ],
    uses: "Every table from the book",
  },
  sandbox: `CREATE TABLE a (id INT PRIMARY KEY, name TEXT, grp TEXT, val INT, dt DATE);
CREATE TABLE b (id INT PRIMARY KEY, a_id INT, amt NUMERIC(10,2));
INSERT INTO a VALUES (1,'Asha','x',10,'2025-01-01'),(2,'Ravi','x',30,'2025-01-02'),(3,'Meera','y',20,'2025-01-01'),(4,'Kabir','y',25,'2025-01-03');
INSERT INTO b VALUES (1,1,100),(2,1,50),(3,3,70);`,
  pages: [
    {
      kind: "intro", id: "ref-order", title: "The execution order",
      art: "order",
      html: `<p class="big">FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT / OFFSET</p>
        <p>Consequences: WHERE cannot see a SELECT alias or a window function; ORDER BY can. Aggregates are allowed in HAVING, never in WHERE.
        Window functions run at SELECT time, so filter them in an outer query.</p>`,
    },
    {
      kind: "intro", id: "ref-null", title: "The NULL rules",
      html: `<table class="grid"><thead><tr><th>Situation</th><th>Result</th></tr></thead><tbody>
          <tr><td><code>NULL = NULL</code></td><td>NULL (not true)</td></tr>
          <tr><td><code>100 + NULL</code></td><td>NULL</td></tr>
          <tr><td><code>'Hi' || NULL</code></td><td>NULL</td></tr>
          <tr><td><code>CONCAT('Hi', NULL)</code></td><td>'Hi' (CONCAT skips NULL)</td></tr>
          <tr><td><code>WHERE col = NULL</code></td><td>0 rows, silently</td></tr>
          <tr><td><code>WHERE col IS NULL</code></td><td>correct</td></tr>
          <tr><td><code>NOT IN (..., NULL)</code></td><td>0 rows, always</td></tr>
          <tr><td><code>COUNT(*)</code> vs <code>COUNT(col)</code></td><td>rows vs non-NULL values</td></tr>
          <tr><td>A missing value</td><td><code>COALESCE(col, fallback)</code></td></tr>
          <tr><td>Safe division</td><td><code>COALESCE(x / NULLIF(y, 0), 0)</code></td></tr>
        </tbody></table>`,
    },
    {
      kind: "intro", id: "ref-rank", title: "Grouping, ranking and joining",
      html: `<table class="grid"><thead><tr><th></th><th>Rows out</th><th>Compare a row to its group?</th></tr></thead><tbody>
          <tr><td><code>GROUP BY</code></td><td>one per group</td><td>No</td></tr>
          <tr><td><code>OVER (PARTITION BY ...)</code></td><td>all rows kept</td><td>Yes</td></tr></tbody></table>
        <table class="grid"><thead><tr><th>Function</th><th>Ties</th><th>After a tie</th></tr></thead><tbody>
          <tr><td><code>ROW_NUMBER()</code></td><td>unique numbers</td><td>+1</td></tr>
          <tr><td><code>RANK()</code></td><td>same number</td><td>skips (previous + n)</td></tr>
          <tr><td><code>DENSE_RANK()</code></td><td>same number</td><td>no gap (+1)</td></tr></tbody></table>
        <table class="grid"><thead><tr><th>Join</th><th>Keeps</th></tr></thead><tbody>
          <tr><td>INNER</td><td>matches only</td></tr><tr><td>LEFT</td><td>all left + matches</td></tr>
          <tr><td>RIGHT</td><td>all right + matches</td></tr><tr><td>FULL OUTER</td><td>everything</td></tr>
          <tr><td>CROSS</td><td>every combination (no ON)</td></tr></tbody></table>`,
    },
    {
      kind: "tools", title: "Eight patterns worth memorising",
      cards: [
        { name: "1. Left rows with no match", sig: "LEFT JOIN ... WHERE right.id IS NULL", does: "Customers who never ordered, products never sold, orphans.", sql: `SELECT a.* FROM a LEFT JOIN b ON b.a_id = a.id WHERE b.id IS NULL;` },
        { name: "2. Safe division", sig: "COALESCE(x / NULLIF(y, 0), 0)", does: "Never crashes on a zero, never shows a blank.", sql: `SELECT COALESCE(500 / NULLIF(0, 0), 0) AS avg_value;` },
        { name: "3. Top-N per group", sig: "ROW_NUMBER() in a subquery, filter outside", does: "The best row in each group.", sql: `SELECT * FROM (
  SELECT a.*, ROW_NUMBER() OVER (PARTITION BY grp ORDER BY val DESC) rn FROM a
) x WHERE rn = 1;` },
        { name: "4. Period-over-period change", sig: "val - LAG(val) OVER (PARTITION BY g ORDER BY dt)", does: "Growth since the previous row.", sql: `SELECT grp, dt, val - LAG(val) OVER (PARTITION BY grp ORDER BY dt) AS change FROM a;` },
        { name: "5. Running total", sig: "SUM(val) OVER (PARTITION BY g ORDER BY dt)", does: "Accumulates as you go.", sql: `SELECT grp, dt, SUM(val) OVER (PARTITION BY grp ORDER BY dt) AS running FROM a;` },
        { name: "6. LAST_VALUE done right", sig: "... ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING", does: "The real last value of the partition.", sql: `SELECT grp, LAST_VALUE(val) OVER (PARTITION BY grp ORDER BY dt ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest FROM a;` },
        { name: "7. Count with zeros kept", sig: "LEFT JOIN + COUNT(b.id) + COALESCE(SUM, 0)", does: "Every parent, even with no children.", sql: `SELECT a.name, COUNT(b.id), COALESCE(SUM(b.amt), 0) FROM a LEFT JOIN b ON b.a_id = a.id GROUP BY a.id, a.name ORDER BY a.id;` },
        { name: "8. Two children, no double counting", sig: "one CTE per child table, then join", does: "Totals from two tables without row multiplication.", sql: `WITH x AS (SELECT a_id, SUM(amt) s FROM b GROUP BY a_id)
SELECT a.name, COALESCE(x.s, 0) AS total FROM a LEFT JOIN x ON x.a_id = a.id ORDER BY a.id;` },
      ],
    },
    { kind: "exam", id: "exam", title: "The final challenge", count: 15 },
    {
      kind: "intro", id: "next", title: "Where to go next",
      html: `<ul class="defs">
          <li><b>Practise daily.</b> Open any chapter's sandbox and invent your own questions about its tables.</li>
          <li><b>Install PostgreSQL</b> on your own computer and re-type a chapter's table code. Typing it yourself is different from reading it.</li>
          <li><b>Re-take the bug hunts.</b> Reading error messages calmly is the most underrated database skill.</li>
          <li><b>Build something small:</b> a library, a canteen, a cricket scorebook. Design the tables, add the foreign keys, write five reports.</li>
        </ul>
        <p class="big">You started with "what is a table?". You can now read, clean, summarise, rank, join and protect real data.</p>`,
    },
  ],
};
