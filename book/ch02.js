/* Chapter 2 - SELECT, WHERE, LIKE, ORDER BY, pagination (class file DE 2). */
const TABLE = `DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id         INT PRIMARY KEY,
  name       VARCHAR(50),
  branch     VARCHAR(20),
  city       VARCHAR(50),
  marks      INT,
  attendance INT
);

INSERT INTO students (id, name, branch, city, marks, attendance) VALUES
 (1,'Amit','CSE','Pune',85,88),        (2,'Riya','ECE','Mumbai',72,95),
 (3,'Arjun','CSE','Delhi',91,70),      (4,'Sneha','ME','Pune',67,80),
 (5,'Ankit','CSE','Kolkata',88,92),    (6,'Asha','ECE','Delhi',76,84),
 (7,'Neha','ECE','Pune',79,91),        (8,'Rahul','CSE','Mumbai',65,74),
 (9,'Priya','ME','Delhi',82,87),       (10,'Vikram','CSE','Jaipur',94,68),
 (11,'Isha','ECE','Pune',58,90),       (12,'Karan','ME','Kolkata',71,77),
 (13,'Meera','CSE','Chennai',88,93),   (14,'Rohan','ECE','Delhi',63,82),
 (15,'Tanya','CSE','Mumbai',90,85),    (16,'Aditya','ME','Pune',74,79),
 (17,'Simran','ECE','Jaipur',69,96),   (18,'Nikhil','CSE','Delhi',81,71),
 (19,'Pooja','ME','Mumbai',55,88),     (20,'Varun','CSE','Kolkata',97,90),
 (21,'Divya','ECE','Chennai',77,83),   (22,'Manav','CSE','Pune',62,75),
 (23,'Kavya','ME','Delhi',86,89),      (24,'Siddharth','ECE','Mumbai',73,66),
 (25,'Ritu','CSE','Jaipur',92,94),     (26,'Harsh','ME','Chennai',60,81),
 (27,'Anjali','CSE','Delhi',84,87),    (28,'Yash','ECE','Kolkata',70,72),
 (29,'Shreya','ME','Pune',89,92),      (30,'Dev','CSE','Mumbai',66,78),
 (31,'Naina','ECE','Delhi',95,86),     (32,'Aryan','CSE','Chennai',59,69),
 (33,'Ira','ME','Jaipur',78,90),       (34,'Kabir','CSE','Kolkata',83,76),
 (35,'Sana','ECE','Pune',68,95),       (36,'Om','ME','Mumbai',87,84),
 (37,'Lakshmi','CSE','Delhi',75,80),   (38,'Farhan','ECE','Jaipur',64,73),
 (39,'Trisha','CSE','Chennai',93,91),  (40,'Zoya','ME','Kolkata',80,85);`;

export default {
  id: "ch2",
  num: 2,
  title: "Asking questions",
  topic: "SELECT, WHERE, LIKE, ORDER BY and pagination",
  accent: "pencil",
  opener: {
    question: "Forty students. How do you find exactly the ones you need?",
    story: `A class of 40 students, from 3 branches and 7 cities. The principal asks: who is in CSE? Who
      scored above 90? Whose name starts with A? Show the toppers first, 10 to a page. Every one of
      those is a single SELECT: pick the columns, pick the rows, put them in order.`,
    learn: [
      "Pick columns (projection) and pick rows (selection)",
      "Combine conditions with AND, OR, NOT and IN",
      "Match patterns with LIKE and its two wildcards",
      "Sort with ORDER BY and split results into pages with LIMIT and OFFSET",
      "Why the order you write a query is not the order it runs",
    ],
    uses: "students (40 rows: id, name, branch, city, marks, attendance)",
  },
  pages: [
    {
      kind: "table", id: "2.0", title: "The table",
      say: "40 students, 3 branches (CSE, ECE, ME), 7 cities. Every query in this chapter reads this one table.",
      sql: TABLE,
      show: `SELECT * FROM students;`,
    },
    {
      kind: "lesson", id: "2.1", title: "The whole table, then two columns",
      say: "Look at the first 8 students, then only their name and branch.",
      sql: `SELECT * FROM students LIMIT 8;

SELECT name, branch FROM students LIMIT 8;`,
      explain: `<p>Choosing columns is called <b>projection</b>. In real applications avoid <code>SELECT *</code>:
        ask only for what you need, so the database moves less data.</p>`,
    },
    {
      kind: "lesson", id: "2.2", title: "How many different branches?",
      say: "List each branch once.",
      sql: `SELECT DISTINCT branch FROM students;`,
      predict: "40 rows go in. How many come out?",
      explain: `<p><code>DISTINCT</code> removes duplicate rows from the result. 40 rows collapse into 3 unique branches.</p>`,
    },
    {
      kind: "lesson", id: "2.3", title: "Only the CSE students",
      say: "Show some CSE students, and count all of them.",
      sql: `SELECT * FROM students WHERE branch = 'CSE' LIMIT 6;

SELECT count(*) AS cse_rows FROM students WHERE branch = 'CSE';`,
      explain: `<p><code>WHERE</code> filters rows. Projection chose columns; <b>selection</b> chooses rows.
        Text goes in single quotes, and comparing text is case-sensitive: <code>'cse'</code> would match nothing.</p>`,
      art: "sieve",
    },
    {
      kind: "lesson", id: "2.4", title: "CSE or ECE, two ways",
      say: "Students from either branch.",
      sql: `-- Way 1: OR
SELECT * FROM students WHERE branch = 'CSE' OR branch = 'ECE' LIMIT 6;

-- Way 2: IN (cleaner as the list grows)
SELECT count(*) FROM students WHERE branch IN ('CSE', 'ECE');`,
      explain: `<p><code>IN (...)</code> is shorthand for a chain of ORs on the same column. 17 CSE + 12 ECE = 29.</p>`,
    },
    {
      kind: "lesson", id: "2.5", title: "Comparing numbers",
      say: "The comparison operators, on marks.",
      sql: `SELECT * FROM students WHERE marks > 90;
SELECT * FROM students WHERE marks >= 90;
SELECT * FROM students WHERE marks <= 60;
SELECT * FROM students WHERE marks = 60;
SELECT count(*) AS not_cse FROM students WHERE branch <> 'CSE';`,
      predict: "How many more students does >= 90 find than > 90?",
      explain: `<p>The only difference between <code>&gt;</code> and <code>&gt;=</code> is the boundary value itself: Tanya's exact 90 is the proof.
        <code>&lt;&gt;</code> means "not equal to".</p>`,
      grid: { head: ["Operator", "Means"], rows: [
        ["<code>=</code>", "equal"], ["<code>&lt;&gt;</code> or <code>!=</code>", "not equal"],
        ["<code>&gt;</code> / <code>&gt;=</code>", "greater / greater or equal"], ["<code>&lt;</code> / <code>&lt;=</code>", "less / less or equal"],
      ] },
    },
    {
      kind: "lesson", id: "2.6", title: "Count every row",
      say: "How many students are there?",
      sql: `SELECT count(*) FROM students;`,
      explain: `<p><code>count(*)</code> counts rows, including rows full of NULLs. In Chapter 3 you will see that
        <code>count(column)</code> behaves differently: it skips NULLs.</p>`,
    },
    {
      kind: "lesson", id: "2.7", title: "Pattern matching with wildcards",
      say: "Names that start with A, end with a, or have j as the third letter.",
      sql: `-- name starts with A
SELECT * FROM students WHERE name LIKE 'A%';

-- name ends with a
SELECT * FROM students WHERE name LIKE '%a';

-- third character is j
SELECT * FROM students WHERE name LIKE '__j%';`,
      explain: `<p><code>LIKE</code> compares text against a pattern made of ordinary letters and two wildcards:</p>`,
      grid: { head: ["Pattern", "Reads as"], rows: [
        ["<code>%</code>", "zero or more characters, any characters"],
        ["<code>_</code>", "exactly one character"],
        ["<code>'A%'</code>", "starts with A"], ["<code>'%a'</code>", "ends with a"],
        ["<code>'%a%'</code>", "contains a anywhere"], ["<code>'__j%'</code>", "third character is j"],
        ["<code>'_%'</code>", "at least one character"],
      ] },
    },
    {
      kind: "lesson", id: "2.8", title: "Two conditions at once: AND",
      say: "CSE students who live in Delhi.",
      sql: `SELECT * FROM students WHERE branch = 'CSE' AND city = 'Delhi';`,
      explain: `<p><code>AND</code> narrows the result: both must be true. <code>OR</code> widens it: either is enough.
        When you mix them, use brackets, because AND binds tighter than OR.</p>`,
      tip: "WHERE a = 1 OR b = 2 AND c = 3 means a = 1 OR (b = 2 AND c = 3). Write the brackets you mean.",
    },
    {
      kind: "lesson", id: "2.9", title: "NOT from Mumbai, three ways",
      say: "Count the students who are not from Mumbai.",
      sql: `SELECT count(*) FROM students WHERE NOT (city = 'Mumbai');   -- way 1
SELECT count(*) FROM students WHERE city <> 'Mumbai';        -- way 2
SELECT count(*) FROM students WHERE city != 'Mumbai';        -- way 3`,
      explain: `<p>All three return 33 (40 minus 7 Mumbai students). <code>&lt;&gt;</code> is the SQL standard spelling;
        PostgreSQL also accepts <code>!=</code>.</p>`,
      note: "None of these three will return rows where city IS NULL. For missing values you need IS NULL (Chapter 3).",
    },
    {
      kind: "lesson", id: "2.10", title: "Pagination: 10 students per page",
      say: "A website shows 10 students per page. Fetch pages 1, 2 and 3.",
      sql: `SELECT * FROM students ORDER BY id LIMIT 5;             -- first 5 only
SELECT * FROM students ORDER BY id LIMIT 10 OFFSET 0;    -- page 1: rows 1-10
SELECT * FROM students ORDER BY id LIMIT 10 OFFSET 10;   -- page 2: rows 11-20
SELECT * FROM students ORDER BY id LIMIT 10 OFFSET 20;   -- page 3: rows 21-30`,
      explain: `<p><code>LIMIT</code> is the page size. <code>OFFSET</code> is how many rows to skip first.
        The formula: <code>OFFSET = (page_number - 1) x page_size</code>.</p>`,
      note: "Pagination without ORDER BY is unreliable. The database may return rows in any order, so a row could appear on two pages or on none. Always pair LIMIT/OFFSET with an ORDER BY, as here.",
    },
    {
      kind: "lesson", id: "2.11", title: "Sort by marks",
      say: "Lowest marks first, then highest first.",
      sql: `SELECT * FROM students ORDER BY marks LIMIT 6;         -- ASC is the default
SELECT * FROM students ORDER BY marks ASC LIMIT 6;     -- the same, spelled out
SELECT * FROM students ORDER BY marks DESC LIMIT 6;`,
      explain: `<p><code>ASC</code> (ascending) is the default and can be left out. <code>ORDER BY marks DESC LIMIT n</code>
        is the standard <b>top-n</b> pattern: the n best.</p>`,
    },
    {
      kind: "lesson", id: "2.12", title: "Everything at once, and a lesson about OFFSET",
      say: "CSE or ECE students from Pune or Delhi, name starting with A, marks above 80.",
      sql: `SELECT DISTINCT name, branch, city, marks
FROM students
WHERE branch IN ('CSE', 'ECE')
  AND city   IN ('Pune', 'Delhi')
  AND name LIKE 'A%'
  AND marks > 80
LIMIT 10 OFFSET 20;`,
      predict: "Every condition is correct. How many rows do you expect?",
      explain: `<p>Zero rows, and the filter is not the problem. <code>OFFSET 20</code> is. The filter only finds 3 rows,
        and we asked the database to skip the first 20. Remove the OFFSET and add a sort: see the next page.</p>`,
    },
    {
      kind: "lesson", id: "2.13", title: "The fixed version",
      say: "Same filter, no OFFSET, best marks first.",
      sql: `SELECT DISTINCT name, branch, city, marks
FROM students
WHERE branch IN ('CSE', 'ECE')
  AND city   IN ('Pune', 'Delhi')
  AND name LIKE 'A%'
  AND marks > 80
ORDER BY marks DESC, name ASC;`,
      explain: `<p><code>ORDER BY marks DESC, name ASC</code> means: sort by marks, highest first; if two students have the
        same marks, break the tie by name, A to Z. The second column is the <b>tie-breaker</b>.</p>`,
    },
    {
      kind: "lesson", id: "2.14", title: "Why WHERE rejects a column alias", errors: true,
      say: "You name a column in SELECT, then try to filter on that name.",
      sql: `SELECT name, marks + 5 AS with_grace
FROM students
WHERE with_grace > 95;`,
      explain: `<p>This is the single most useful idea in the chapter: <b>the order you write a query is not the order it runs.</b></p>
        <table class="grid"><tbody>
          <tr><th>Written</th><td>SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT</td></tr>
          <tr><th>Executed</th><td>FROM, WHERE, GROUP BY, HAVING, <b>SELECT</b>, DISTINCT, ORDER BY, LIMIT</td></tr>
        </tbody></table>
        <p><code>SELECT</code> runs after <code>WHERE</code>. When WHERE is checked, the alias <code>with_grace</code>
        does not exist yet. <code>ORDER BY with_grace</code> would work, because ORDER BY runs after SELECT.</p>`,
      art: "order",
    },
    {
      kind: "lesson", id: "2.15", title: "The alias works in ORDER BY",
      say: "Repeat the expression in WHERE, and use the alias in ORDER BY.",
      sql: `SELECT name, marks + 5 AS with_grace
FROM students
WHERE marks + 5 > 95
ORDER BY with_grace DESC;`,
      explain: `<p>WHERE has to repeat the calculation, because it runs before SELECT names it. ORDER BY runs after
        SELECT, so the alias is ready by then. You will meet this rule again with GROUP BY (Chapter 4) and window functions (Chapter 5).</p>`,
    },
    {
      kind: "tools", title: "Toolbox: reading a table",
      cards: [
        { name: "SELECT columns", sig: "SELECT col1, col2 FROM t;", does: "Projection: picks which columns come back.",
          sql: `SELECT name, city FROM students LIMIT 3;` },
        { name: "WHERE", sig: "... WHERE condition", does: "Selection: keeps only rows where the condition is true.",
          sql: `SELECT name, marks FROM students WHERE marks >= 94;` },
        { name: "DISTINCT", sig: "SELECT DISTINCT col FROM t;", does: "Removes duplicate rows from the result.",
          sql: `SELECT DISTINCT city FROM students ORDER BY city;` },
        { name: "IN", sig: "col IN (v1, v2, ...)", does: "True if col equals any value in the list. A short OR chain.",
          sql: `SELECT count(*) FROM students WHERE city IN ('Pune', 'Delhi');` },
        { name: "BETWEEN", sig: "col BETWEEN low AND high", does: "Inclusive range: low and high themselves count.",
          sql: `SELECT name, marks FROM students WHERE marks BETWEEN 90 AND 92;` },
        { name: "LIKE / ILIKE", sig: "col LIKE 'pattern'", does: "Pattern match. % = any run of characters, _ = exactly one. ILIKE ignores case.",
          sql: `SELECT name FROM students WHERE name ILIKE 'a%a';` },
        { name: "ORDER BY", sig: "ORDER BY col [ASC|DESC], col2 ...", does: "Sorts the result. Later columns break ties.",
          sql: `SELECT name, marks FROM students ORDER BY marks DESC, name LIMIT 4;` },
        { name: "LIMIT / OFFSET", sig: "LIMIT size OFFSET skip", does: "Returns one page of rows. Always with ORDER BY.",
          sql: `SELECT id, name FROM students ORDER BY id LIMIT 3 OFFSET 6;` },
        { name: "count(*)", sig: "SELECT count(*) FROM t WHERE ...", does: "Counts the rows that pass the filter.",
          sql: `SELECT count(*) AS pune_students FROM students WHERE city = 'Pune';` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "How many rows does this return?", code: "SELECT DISTINCT branch FROM students;",
          opts: ["40", "7", "3", "1"], a: 2, check: "SELECT count(*) FROM (SELECT DISTINCT branch FROM students) t;",
          why: "DISTINCT keeps one row per different value. There are three branches: CSE, ECE, ME." },
        { q: "Which pattern finds names whose <b>second</b> letter is <code>a</code>?",
          opts: ["'a%'", "'%a%'", "'_a%'", "'__a'"], a: 2,
          why: "_ is exactly one character, so '_a%' means: any one character, then a, then anything." },
        { q: "Page 4 of a list shown 10 per page needs which OFFSET?",
          opts: ["4", "30", "40", "10"], a: 1,
          why: "OFFSET = (page - 1) x size = 3 x 10 = 30. Page 4 starts after skipping 30 rows." },
        { q: "What does this return?", code: "SELECT count(*) FROM students WHERE marks > 90;",
          opts: ["6", "7", "5", "40"], a: 0, check: "SELECT count(*) FROM students WHERE marks > 90;",
          why: "Six students score above 90. Tanya has exactly 90, so she is only counted by >= 90." },
        { q: "In which order does PostgreSQL <i>run</i> these clauses?",
          opts: ["SELECT, FROM, WHERE, ORDER BY", "FROM, WHERE, SELECT, ORDER BY", "FROM, SELECT, WHERE, ORDER BY", "WHERE, FROM, SELECT, ORDER BY"], a: 1,
          why: "FROM finds the table, WHERE filters rows, SELECT computes the columns, ORDER BY sorts the finished result." },
        { q: "What does <code>ORDER BY marks DESC, name</code> do with two students on 88 marks?",
          opts: ["Puts them in random order", "Sorts them by name A to Z", "Sorts them by name Z to A", "Shows only one of them"], a: 1,
          why: "The second column breaks ties, and ASC is its default direction." },
        { q: "What does this return?", code: "SELECT count(*) FROM students WHERE branch = 'cse';",
          opts: ["17", "0", "An error", "40"], a: 1, check: "SELECT count(*) FROM students WHERE branch = 'cse';",
          why: "Text comparison is case-sensitive, and every branch is stored as upper-case 'CSE'." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Students whose name starts with S.", bad: `SELECT name FROM students WHERE name = 'S%';`, silent: true,
          opts: [`SELECT name FROM students WHERE name LIKE 'S%';`, `SELECT name FROM students WHERE name = S%;`, `SELECT name FROM students WHERE name LIKE "S%";`, `SELECT name FROM students WHERE name LIKE 'S_';`], a: 0,
          why: `With <code>=</code>, <code>%</code> is just a percent sign, so PostgreSQL looks for a student literally called "S%". Wildcards only work with LIKE. (<code>'S_'</code> would need exactly two letters.)` },
        { task: "Top 3 students by marks.", bad: `SELECT name, marks FROM students LIMIT 3 ORDER BY marks DESC;`,
          opts: [`SELECT name, marks FROM students ORDER BY marks DESC LIMIT 3;`, `SELECT TOP 3 name, marks FROM students ORDER BY marks DESC;`, `SELECT name, marks FROM students ORDER marks DESC LIMIT 3;`, `SELECT name, marks LIMIT 3 FROM students ORDER BY marks DESC;`], a: 0,
          why: `Clauses have a fixed written order: ... ORDER BY, then LIMIT. <code>TOP</code> is Microsoft SQL Server's word, not PostgreSQL's.` },
        { task: "CSE students from Pune or Delhi.",
          bad: `SELECT name, branch, city FROM students
WHERE branch = 'CSE' AND city = 'Pune' OR city = 'Delhi';`, silent: true,
          opts: [
            `SELECT name, branch, city FROM students
WHERE branch = 'CSE' AND (city = 'Pune' OR city = 'Delhi');`,
            `SELECT name, branch, city FROM students
WHERE (branch = 'CSE' AND city = 'Pune') OR city = 'Delhi';`,
            `SELECT name, branch, city FROM students
WHERE branch = 'CSE' OR city = 'Pune' AND city = 'Delhi';`,
            `SELECT name, branch, city FROM students
WHERE branch = 'CSE' AND city = 'Pune' AND city = 'Delhi';`],
          a: 0,
          why: `AND binds tighter than OR, so the broken query means "(CSE and Pune) or anyone from Delhi". ECE and ME Delhi students sneak in. Brackets say what you mean.` },
        { task: "Students with attendance above 90, showing a grace-mark column.",
          bad: `SELECT name, attendance + 2 AS adjusted FROM students WHERE adjusted > 90;`,
          opts: [`SELECT name, attendance + 2 AS adjusted FROM students WHERE attendance + 2 > 90;`, `SELECT name, attendance + 2 AS adjusted FROM students HAVING adjusted > 90;`, `SELECT name, attendance + 2 AS "adjusted" FROM students WHERE "adjusted" > 90;`, `SELECT name, adjusted = attendance + 2 FROM students WHERE adjusted > 90;`], a: 0,
          why: `WHERE runs before SELECT, so the alias does not exist yet. Repeat the expression in WHERE (or wrap the query in a subquery, Chapter 7).` },
        { task: "Students from Mumbai.", bad: `SELECT * FROM students WHERE city = "Mumbai";`,
          opts: [`SELECT * FROM students WHERE city = 'Mumbai';`, `SELECT * FROM students WHERE city = Mumbai;`, `SELECT * FROM students WHERE "city" = "Mumbai";`, `SELECT * FROM students WHERE city LIKE "Mumbai";`], a: 0,
          why: `Double quotes make <code>"Mumbai"</code> a column name. Values need single quotes.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "Projection vs selection: <code>SELECT col1, col2</code> picks columns; <code>WHERE</code> picks rows.",
        "DISTINCT removes duplicates of the whole output row, not just one column.",
        "<code>IN ('a','b')</code> is a neat OR chain on one column.",
        "Wildcards: <code>%</code> = zero or more characters, <code>_</code> = exactly one. LIKE is case-sensitive; ILIKE is not.",
        "Not-equal has three spellings: <code>&lt;&gt;</code>, <code>!=</code>, <code>NOT (...)</code>. None of them match NULL.",
        "LIMIT = page size, OFFSET = rows to skip. OFFSET = (page - 1) x size. Always add ORDER BY.",
        "<code>ORDER BY a DESC, b</code>: the second column is the tie-breaker.",
        "Single quotes <code>'CSE'</code> for text; double quotes for names.",
        "Execution order: FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. It explains most \"column does not exist\" errors.",
      ],
    },
  ],
};
