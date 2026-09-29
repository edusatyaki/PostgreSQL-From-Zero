/* Chapter 7 - subqueries, non-correlated and correlated (class file DE 7). */
const TABLE = `DROP TABLE IF EXISTS fee_payments;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
  student_id INT PRIMARY KEY,
  name       VARCHAR(30) NOT NULL,
  city       VARCHAR(30),
  batch      VARCHAR(5)
);

CREATE TABLE marks (
  mark_id    INT PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  subject    VARCHAR(20),
  score      INT
);

CREATE TABLE fee_payments (
  pay_id     INT PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  amount     INT,
  method     VARCHAR(10)
);

INSERT INTO students VALUES
 (1,'Aarav','Mumbai','B1'), (2,'Diya','Delhi','B1'), (3,'Kabir','Mumbai','B2'),
 (4,'Meera','Pune','B2'),   (5,'Rohan','Delhi','B1'), (6,'Sara','Pune','B2');

INSERT INTO marks VALUES
 (101,1,'Math',92),(102,1,'Science',58),(103,2,'Math',74),(104,2,'Science',66),
 (105,3,'Math',88),(106,3,'Science',84),(107,4,'Math',55),(108,4,'Science',61),
 (109,5,'Math',95),(110,5,'Science',71),(111,6,'Math',45),(112,6,'Science',49);

INSERT INTO fee_payments VALUES
 (501,1,25000,'UPI'), (502,2,25000,'CARD'), (503,3,25000,'NETBANK'), (504,5,25000,'UPI');`;

export default {
  id: "ch7",
  num: 7,
  title: "Queries inside queries",
  topic: "Subqueries: IN, NOT IN, scalar, ANY/ALL, EXISTS and correlated",
  accent: "pencil",
  opener: {
    question: "How does one table ask a question of another?",
    story: `Three tables: students, their marks, and their fee payments. "Which students scored above 80?" needs
      marks to answer and students to name. "Who has not paid?" needs payments to answer and students to
      list. A subquery is a query in brackets whose answer feeds another query. Build them inside-out, one
      small working query at a time.`,
    learn: [
      "The inside-out method: write, run and check the inner query first",
      "IN, NOT IN, and the NOT IN + NULL trap",
      "Scalar subqueries (one value) with =, > and <",
      "ANY and ALL, and their MIN/MAX translations",
      "Correlated subqueries with EXISTS and NOT EXISTS",
    ],
    uses: "students (6), marks (12), fee_payments (4)",
  },
  pages: [
    {
      kind: "table", id: "7.0", title: "The tables",
      say: "Three linked tables. Meera (4) and Sara (6) have not paid: that is deliberate.",
      sql: TABLE,
      show: `SELECT * FROM students;
SELECT * FROM marks;
SELECT * FROM fee_payments;`,
      explain: `<p><code>REFERENCES students(student_id)</code> makes <code>student_id</code> a <b>foreign key</b>: a marks or payment row cannot
        point at a student who does not exist (Chapter 9 goes deeper).</p>`,
    },
    {
      kind: "intro", id: "kinds", title: "Two kinds of subquery",
      art: "insideout",
      html: `<ul class="defs">
          <li><b>Non-correlated</b>: the inner query can run on its own. It runs once, hands its answer up, done.</li>
          <li><b>Correlated</b>: the inner query mentions a column from the outer query, so it must be re-checked for every outer row.</li>
        </ul>
        <p>Either way, the method is the same: <b>write the inner query first, run it, look at the answer, then put brackets around it.</b></p>`,
    },
    {
      kind: "lesson", id: "7.1", title: "Who scored above 80? Build it in three steps",
      say: "Step 1: which ids? Step 2: hard-code them. Step 3: nest step 1 inside step 2.",
      sql: `-- step 1: which student_ids scored > 80?
SELECT student_id FROM marks WHERE score > 80;

-- step 2: hard-code those ids (works, but useless in practice)
SELECT name FROM students WHERE student_id IN (1, 3, 5);

-- step 3: the real answer, step 1 inside step 2
SELECT name FROM students
WHERE student_id IN (
    SELECT DISTINCT student_id FROM marks WHERE score > 80
);`,
      explain: `<p>Kabir appears twice in step 1 (Math 88 and Science 84); IN does not mind duplicates, but DISTINCT makes the intent clear.</p>
        <p><code>(1, 3, 5)</code> is hard-coded and breaks the moment the data changes. The subquery is dynamic: it re-reads marks every time.</p>`,
    },
    {
      kind: "lesson", id: "7.2", title: "Who paid by UPI?",
      say: "Same shape, a different table.",
      sql: `-- inner query first
SELECT student_id FROM fee_payments WHERE method = 'UPI';

-- final
SELECT name FROM students
WHERE student_id IN (
    SELECT student_id FROM fee_payments WHERE method = 'UPI'
);`,
      explain: `<p>The subquery reaches into a different table from the outer query. That is the whole point: subqueries let one table ask a question of another.</p>`,
    },
    {
      kind: "lesson", id: "7.3", title: "Who scored the highest mark? Three levels",
      say: "Build inside-out: the top score, then who has it, then their name.",
      sql: `SELECT max(score) FROM marks;                           -- 95
SELECT student_id FROM marks WHERE score = 95;         -- 5
SELECT name FROM students WHERE student_id = 5;        -- Rohan

-- the final query
SELECT name FROM students
WHERE student_id = (
    SELECT student_id FROM marks
    WHERE score = (
        SELECT max(score) FROM marks
    )
);`,
      explain: `<p>Three levels, evaluated innermost first: max(score) is 95, the student holding 95 is 5, the name is Rohan.</p>
        <p>This uses <code>=</code>, not IN, because we expect exactly one value. That is a risk: if two students tied at 95, the middle
        subquery would return two rows and <code>=</code> would fail. IN is safer unless you are sure the answer is unique.</p>`,
    },
    {
      kind: "lesson", id: "7.4", title: "Below 60 in at least one subject",
      say: "IN means 'at least one matching row exists'.",
      sql: `SELECT name FROM students
WHERE student_id IN (
    SELECT student_id FROM marks WHERE score < 60
)
ORDER BY student_id;`,
      explain: `<p>Aarav qualifies purely because of Science 58, even though his Math was 92.</p>`,
    },
    {
      kind: "lesson", id: "7.5", title: "Who NEVER scored above 70?",
      say: "Find who did, then flip it.",
      sql: `-- inner: who DID score above 70?
SELECT student_id FROM marks WHERE score > 70;

-- final: everybody else
SELECT name FROM students
WHERE student_id NOT IN (
    SELECT student_id FROM marks WHERE score > 70
)
ORDER BY student_id;`,
      explain: `<p>The trick for "never / none / no" questions: <b>find who did it, then invert with NOT IN</b>. Only Meera (55, 61) and
        Sara (45, 49) never crossed 70.</p>`,
    },
    {
      kind: "lesson", id: "7.6", title: "The NOT IN + NULL trap",
      say: "The most dangerous thing in the chapter.",
      sql: `SELECT name FROM students WHERE student_id IN     (1, 2, NULL) ORDER BY student_id;
SELECT name FROM students WHERE student_id NOT IN (1, 2, NULL) ORDER BY student_id;`,
      predict: "NOT IN (1, 2, NULL): surely it returns students 3 to 6?",
      explain: `<p><b>NOT IN with a list containing even one NULL always returns zero rows.</b></p>
        <p>Why: <code>x NOT IN (1, 2, NULL)</code> expands to <code>x &lt;&gt; 1 AND x &lt;&gt; 2 AND x &lt;&gt; NULL</code>. The last comparison is
        unknown (Chapter 3), and true AND unknown = unknown, which is not true, so no row passes. IN is safe because true OR unknown = true.</p>`,
      note: "Whenever the subquery column might be NULL, write NOT IN (SELECT col FROM t WHERE col IS NOT NULL), or use NOT EXISTS (7.13), which is immune.",
    },
    {
      kind: "lesson", id: "7.7", title: "Marks above the average Science score",
      say: "A subquery can read the same table as the outer query.",
      sql: `-- inner: the average Science score
SELECT avg(score) FROM marks WHERE subject = 'Science';

-- final
SELECT mark_id, student_id, subject, score
FROM marks
WHERE score > (SELECT avg(score) FROM marks WHERE subject = 'Science');`,
      explain: `<p>The inner query collapses to a single value (a <b>scalar subquery</b>), so it can be used directly with <code>&gt;</code>.
        Do not hard-code <code>WHERE score &gt; 64.83</code>: same 7 rows today, a wrong answer the moment a mark changes.</p>`,
    },
    {
      kind: "lesson", id: "7.8", title: "Higher than every Science score: ALL",
      say: "Compare against a whole list at once.",
      sql: `SELECT score FROM marks WHERE subject = 'Science';

SELECT mark_id, student_id, subject, score
FROM marks
WHERE score > ALL (
    SELECT score FROM marks WHERE subject = 'Science'
)
ORDER BY mark_id;

-- the same thing with MAX (clearer, and usually faster)
SELECT mark_id, student_id, subject, score
FROM marks
WHERE score > (SELECT max(score) FROM marks WHERE subject = 'Science')
ORDER BY mark_id;`,
      explain: `<p><code>&gt; ALL (...)</code> = greater than every value in the list = greater than the maximum (84).</p>`,
    },
    {
      kind: "lesson", id: "7.9", title: "Higher than at least one: ANY",
      say: "The contrast.",
      sql: `SELECT mark_id, student_id, subject, score
FROM marks
WHERE score > ANY (SELECT score FROM marks WHERE subject = 'Science')
ORDER BY mark_id;`,
      grid: { head: ["Written", "Means", "Same as"], rows: [
        ["<code>&gt; ALL (...)</code>", "greater than every value", "<code>&gt; MAX(...)</code>"],
        ["<code>&lt; ALL (...)</code>", "less than every value", "<code>&lt; MIN(...)</code>"],
        ["<code>&gt; ANY (...)</code>", "greater than at least one", "<code>&gt; MIN(...)</code>"],
        ["<code>&lt; ANY (...)</code>", "less than at least one", "<code>&lt; MAX(...)</code>"],
        ["<code>= ANY (...)</code>", "equal to at least one", "<code>IN (...)</code>"],
      ] },
      explain: `<p>10 rows: almost every mark beats the lowest Science score (49). Only 45 and 49 itself are excluded.</p>`,
    },
    {
      kind: "lesson", id: "7.10", title: "Two conditions from two tables",
      say: "Paid their fees AND scored above 80.",
      sql: `SELECT name FROM students
WHERE student_id IN (SELECT student_id FROM fee_payments)
  AND student_id IN (SELECT student_id FROM marks WHERE score > 80)
ORDER BY student_id;`,
      explain: `<p>Two independent subqueries joined by AND. Each answers one part of the question; only students in both lists survive.</p>`,
    },
    {
      kind: "lesson", id: "7.11", title: "Why is this called non-correlated?",
      say: "Cut the inner query out and run it alone.",
      sql: `SELECT student_id FROM marks WHERE score > 80;   -- the inner query, alone: it works`,
      explain: `<p>It runs perfectly on its own and never mentions <code>students</code>. There is no dependency on the outer query, so the
        database runs it once, keeps the list, and filters the outer query against it. That independence is what <b>non-correlated</b> means.</p>`,
    },
    {
      kind: "lesson", id: "7.12", title: "Above 85 in any subject: EXISTS",
      say: "A correlated subquery: the inner query looks at the outer row.",
      sql: `SELECT s.name
FROM students s
WHERE EXISTS (
    SELECT 1
    FROM marks m
    WHERE m.student_id = s.student_id   -- refers to the OUTER query
      AND m.score > 85
)
ORDER BY s.student_id;`,
      art: "correlated",
      explain: `<p><code>m.student_id = s.student_id</code>: the inner query cannot run alone, because <code>s</code> only exists in the outer query.
        That makes it <b>correlated</b>. Picture the database walking through students one by one and asking "does <i>this</i> student
        have any mark above 85?"</p>
        <p>Why <code>SELECT 1</code>? EXISTS only checks whether any row comes back, never what is in it. <code>s</code> and <code>m</code> are
        <b>table aliases</b>: short names that make the correlation readable.</p>`,
    },
    {
      kind: "lesson", id: "7.13", title: "Who has NOT paid? NOT EXISTS",
      say: "The NULL-safe answer, next to the NOT IN version.",
      sql: `SELECT s.name
FROM students s
WHERE NOT EXISTS (
    SELECT 1 FROM fee_payments f WHERE f.student_id = s.student_id
)
ORDER BY s.student_id;

-- the NOT IN version: same answer, only because there are no NULLs here
SELECT name FROM students
WHERE student_id NOT IN (SELECT student_id FROM fee_payments);`,
      explain: `<p>Both work today. But NOT EXISTS is immune to the trap of 7.6: "did any row come back?" always has a yes/no answer,
        so a NULL inside the subquery cannot poison it.</p>`,
      tip: "Habit to build: prefer NOT EXISTS over NOT IN whenever the column is not guaranteed NOT NULL.",
    },
    {
      kind: "lesson", id: "7.14", title: "Each student's average: a subquery in SELECT",
      say: "One small query per student, placed in the column list.",
      sql: `SELECT s.name,
       (SELECT round(avg(m.score), 2)
        FROM marks m
        WHERE m.student_id = s.student_id) AS avg_score
FROM students s
ORDER BY s.student_id;`,
      explain: `<p>A subquery can live in three places: <code>WHERE</code> (7.1-7.13), <code>SELECT</code> (here), and <code>FROM</code> (a derived
        table, as in 5.6). In the SELECT list it must be <b>scalar</b>: exactly one row and one column per outer row.
        Kabir tops the class at 86.00; Sara is last at 47.00.</p>`,
    },
    {
      kind: "lesson", id: "7.15", title: "A subquery in FROM",
      say: "Average per student first, then the class-wide picture.",
      sql: `SELECT round(avg(avg_score), 2) AS class_avg,
       max(avg_score)             AS best_student_avg,
       count(*) FILTER (WHERE avg_score < 60) AS at_risk
FROM (
    SELECT student_id, avg(score) AS avg_score
    FROM marks
    GROUP BY student_id
) per_student;`,
      explain: `<p>A subquery in FROM is a temporary table built on the fly (a <b>derived table</b>). It must have an alias, here
        <code>per_student</code>. This is how you aggregate an aggregate: average per student first, then summarise those averages.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: subquery operators",
      cards: [
        { name: "IN (subquery)", sig: "col IN (SELECT ...)", does: "True if col matches any row the subquery returns.", sql: `SELECT name FROM students WHERE student_id IN (SELECT student_id FROM fee_payments WHERE method = 'CARD');` },
        { name: "NOT IN", sig: "col NOT IN (SELECT ... WHERE x IS NOT NULL)", does: "The opposite of IN. Returns nothing if the list has a NULL.", sql: `SELECT name FROM students WHERE student_id NOT IN (SELECT student_id FROM marks WHERE score < 60 AND student_id IS NOT NULL);` },
        { name: "Scalar subquery", sig: "col > (SELECT one_value ...)", does: "A subquery returning exactly one value, used like a number.", sql: `SELECT subject, score FROM marks WHERE score = (SELECT min(score) FROM marks);` },
        { name: "ALL", sig: "col > ALL (SELECT ...)", does: "True if the comparison holds against every value.", sql: `SELECT score FROM marks WHERE score >= ALL (SELECT score FROM marks);` },
        { name: "ANY", sig: "col < ANY (SELECT ...)", does: "True if the comparison holds against at least one value.", sql: `SELECT count(*) FROM marks WHERE score < ANY (SELECT score FROM marks WHERE subject = 'Math');` },
        { name: "EXISTS", sig: "EXISTS (SELECT 1 FROM ... WHERE link)", does: "True if the subquery returns at least one row.", sql: `SELECT s.name FROM students s WHERE EXISTS (SELECT 1 FROM fee_payments f WHERE f.student_id = s.student_id AND f.method = 'UPI');` },
        { name: "NOT EXISTS", sig: "NOT EXISTS (SELECT 1 ...)", does: "True if no row comes back. Safe with NULLs.", sql: `SELECT s.name FROM students s WHERE NOT EXISTS (SELECT 1 FROM marks m WHERE m.student_id = s.student_id AND m.score >= 60);` },
        { name: "Derived table", sig: "FROM (SELECT ...) alias", does: "Use a query's result as a table. Needs an alias.", sql: `SELECT city, round(avg(total), 1) FROM (SELECT s.city, sum(m.score) AS total FROM students s JOIN marks m ON m.student_id = s.student_id GROUP BY s.student_id, s.city) t GROUP BY city;` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "What does this return?", code: "SELECT count(*) FROM students WHERE student_id NOT IN (1, 2, NULL);",
          opts: ["4", "6", "0", "An error"], a: 2, check: "SELECT count(*) FROM students WHERE student_id NOT IN (1, 2, NULL);",
          why: "x <> NULL is unknown, so the whole NOT IN is never true. Zero rows." },
        { q: "Which subquery is correlated?",
          opts: ["WHERE id IN (SELECT student_id FROM marks)", "WHERE score > (SELECT avg(score) FROM marks)", "WHERE EXISTS (SELECT 1 FROM marks m WHERE m.student_id = s.student_id)", "FROM (SELECT * FROM marks) t"], a: 2,
          why: "It mentions s.student_id from the outer query, so it cannot run on its own." },
        { q: "<code>score &gt; ALL (SELECT score FROM marks WHERE subject = 'Science')</code> is the same as...",
          opts: ["score > MIN(Science scores)", "score > MAX(Science scores)", "score > AVG(Science scores)", "score IN (Science scores)"], a: 1,
          why: "Greater than every value means greater than the largest one." },
        { q: "What does this return?", code: "SELECT name FROM students WHERE student_id = (SELECT student_id FROM marks WHERE score = (SELECT max(score) FROM marks));",
          opts: ["Kabir", "Aarav", "Rohan", "An error"], a: 2, check: "SELECT name FROM students WHERE student_id = (SELECT student_id FROM marks WHERE score = (SELECT max(score) FROM marks));",
          why: "The top score is 95, held by student 5, Rohan." },
        { q: "A subquery used in the SELECT list must return...",
          opts: ["Any number of rows", "Exactly one row and one column", "One column, any rows", "A whole table"], a: 1,
          why: "It fills one cell per outer row, so it must be scalar." },
        { q: "Why is <code>SELECT 1</code> used inside EXISTS?",
          opts: ["It is faster than SELECT *", "EXISTS only checks whether a row comes back; the value does not matter", "EXISTS needs a number", "1 means true"], a: 1,
          why: "SELECT * would work identically. 1 is a readable convention for 'I only care that a row exists'." },
        { q: "What does this return?", code: "SELECT count(*) FROM marks WHERE score > (SELECT avg(score) FROM marks);",
          opts: ["5", "6", "7", "12"], a: 1, check: "SELECT count(*) FROM marks WHERE score > (SELECT avg(score) FROM marks);",
          why: "The overall average is 69.83, and six marks (92, 74, 88, 84, 95, 71) are above it." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "The name of whoever scored 88 or more in Math.",
          bad: `SELECT name FROM students
WHERE student_id = (SELECT student_id FROM marks WHERE subject = 'Math' AND score >= 88);`,
          opts: [
            `SELECT name FROM students
WHERE student_id IN (SELECT student_id FROM marks WHERE subject = 'Math' AND score >= 88);`,
            `SELECT name FROM students
WHERE student_id = (SELECT student_id FROM marks WHERE subject = 'Math' AND score >= 88 LIMIT 1);`,
            `SELECT name FROM students
WHERE student_id == (SELECT student_id FROM marks WHERE subject = 'Math' AND score >= 88);`,
            `SELECT name FROM students
WHERE student_id = ALL (SELECT student_id FROM marks WHERE subject = 'Math' AND score >= 88);`],
          a: 0,
          why: `Three students scored 88+ in Math, so the subquery returns three rows and <code>=</code> cannot compare with a list. IN can. (LIMIT 1 hides the error but silently drops two students.)` },
        { task: "Students who have no marks at all (the marks table may one day contain a NULL student_id).",
          bad: `SELECT name FROM students
WHERE student_id NOT IN (SELECT student_id FROM marks UNION ALL SELECT NULL);`, silent: true,
          opts: [
            `SELECT s.name FROM students s
WHERE NOT EXISTS (SELECT 1 FROM marks m WHERE m.student_id = s.student_id);`,
            `SELECT name FROM students
WHERE student_id <> (SELECT student_id FROM marks);`,
            `SELECT name FROM students
WHERE NOT student_id IN (SELECT student_id FROM marks UNION ALL SELECT NULL);`,
            `SELECT name FROM students
WHERE student_id NOT IN (SELECT DISTINCT student_id FROM marks UNION ALL SELECT NULL);`],
          a: 0,
          why: `One NULL in the list makes NOT IN return nothing, with no error. NOT EXISTS asks "is there a matching row?", which a NULL cannot poison.` },
        { task: "Students whose average is above 70, using a derived table.",
          bad: `SELECT name FROM (
    SELECT s.name, avg(m.score)
    FROM students s JOIN marks m ON m.student_id = s.student_id
    GROUP BY s.student_id, s.name
) per_student
WHERE avg_score > 70;`,
          opts: [
            `SELECT name FROM (
    SELECT s.name, avg(m.score) AS avg_score
    FROM students s JOIN marks m ON m.student_id = s.student_id
    GROUP BY s.student_id, s.name
) per_student
WHERE avg_score > 70;`,
            `SELECT name FROM (
    SELECT s.name, avg(m.score)
    FROM students s JOIN marks m ON m.student_id = s.student_id
    GROUP BY s.student_id, s.name
    WHERE avg_score > 70
) per_student;`,
            `SELECT name, avg(m.score) AS avg_score
FROM students s JOIN marks m ON m.student_id = s.student_id
WHERE avg_score > 70
GROUP BY s.student_id, s.name;`,
            `SELECT name FROM (
    SELECT s.name, avg(m.score)
    FROM students s JOIN marks m ON m.student_id = s.student_id
    GROUP BY s.student_id, s.name
) per_student
WHERE per_student.avg_score > 70;`],
          a: 0,
          why: `The outer query can only see the columns the inner query names. An unnamed <code>avg(m.score)</code> is called just <code>avg</code>, so give it the name the outer query uses. (Also give the subquery itself an alias: here <code>per_student</code>.)` },
        { task: "Each student's name with their best mark.",
          bad: `SELECT s.name,
       (SELECT m.score FROM marks m WHERE m.student_id = s.student_id) AS best
FROM students s;`,
          opts: [
            `SELECT s.name,
       (SELECT max(m.score) FROM marks m WHERE m.student_id = s.student_id) AS best
FROM students s;`,
            `SELECT s.name,
       (SELECT m.score FROM marks m) AS best
FROM students s;`,
            `SELECT s.name,
       max(SELECT m.score FROM marks m WHERE m.student_id = s.student_id) AS best
FROM students s;`,
            `SELECT s.name,
       (SELECT m.score FROM marks m WHERE m.student_id = s.student_id) AS best
FROM students s GROUP BY s.name;`],
          a: 0,
          why: `Every student has two marks, so the subquery returns two rows for one cell. Aggregate inside it to make it scalar.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "Method: write the inner query first, run it alone, check it, then nest it.",
        "Dynamic beats hard-coded: <code>IN (SELECT ...)</code> stays right as the data changes; <code>IN (1,3,5)</code> does not.",
        "Non-correlated: the inner query runs alone, once. Correlated: it refers to the outer row and runs per row.",
        "A subquery can read the same table as the outer query: that is how \"above the average\" questions work.",
        "Scalar = 1 row x 1 column; only then use =, &gt;, &lt;. Use IN when several rows can come back.",
        "NOT IN with any NULL in the list returns zero rows, silently. Filter NULLs out or use NOT EXISTS.",
        "IN is not affected by NULLs; only NOT IN is.",
        "&gt; ALL = &gt; MAX; &lt; ALL = &lt; MIN; &gt; ANY = &gt; MIN; &lt; ANY = &lt; MAX; = ANY = IN.",
        "EXISTS (SELECT 1 ...): only whether a row exists matters.",
        "\"Never / none / no\" questions: find who did, then invert with NOT EXISTS (or NOT IN).",
        "Subqueries live in WHERE, in SELECT (must be scalar) and in FROM (a derived table, which needs an alias).",
        "Many subqueries can be rewritten as JOINs (Chapter 8). Learn both; pick whichever reads more clearly.",
      ],
    },
  ],
};
