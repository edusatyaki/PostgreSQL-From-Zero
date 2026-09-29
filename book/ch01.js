/* Chapter 1 - DDL, DML and constraints (class file DE 1). */
export default {
  id: "ch1",
  num: 1,
  title: "Your first table",
  topic: "DDL, DML and constraints",
  accent: "flame",
  opener: {
    question: "How do you build a table that refuses bad data?",
    story: `A university needs a register of students: roll number, name, branch, marks. Anyone can type
      rows into a spreadsheet, including rows with marks of 150 or no name at all. A database table
      can be told the rules once, and then it refuses every row that breaks them.`,
    learn: [
      "Create a table with a primary key, NOT NULL and a CHECK rule",
      "Insert rows four different ways, and see what NULL is",
      "Change rows with UPDATE, remove them with DELETE",
      "Change the table itself: RENAME, ADD COLUMN, TRUNCATE, DROP",
    ],
    uses: "Students (roll_no, name, branch, marks)",
  },
  sandbox: `CREATE TABLE Students (
  roll_no INT PRIMARY KEY,
  name    VARCHAR(50) NOT NULL,
  branch  VARCHAR(20),
  marks   INT,
  CONSTRAINT chk_marks CHECK (marks BETWEEN 0 AND 100)
);
INSERT INTO Students (roll_no, name, branch, marks) VALUES
 (21,'Amit','CSE',98), (22,'Amrita',NULL,98), (23,'Jyoti','ECE',96), (24,'Ankit','CSE',98),
 (25,'Dia',NULL,NULL), (26,'Name6','CSE',92), (27,'Name7','ECE',90), (28,'Name8','CSE',88),
 (29,'Name9','CSE',94);`,
  pages: [
    {
      kind: "intro", id: "families", title: "Three families of commands",
      art: "families",
      html: `
        <p>Every SQL command belongs to one of three families. Knowing the family tells you what the command can touch.</p>
        <ul class="defs">
          <li><b>DDL</b>, Data <i>Definition</i> Language, changes the <b>structure</b>: <code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>, <code>TRUNCATE</code>. It builds, reshapes or demolishes the register itself.</li>
          <li><b>DML</b>, Data <i>Manipulation</i> Language, changes the <b>rows</b>: <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>. It writes in the register.</li>
          <li><b>DQL</b>, Data <i>Query</i> Language, only <b>reads</b>: <code>SELECT</code>. It never changes anything.</li>
        </ul>
        <p class="aside">On your own computer you would first run <code>CREATE DATABASE university;</code> and connect to it.
        This book already gives you a database (it is called <code>postgres</code>), so the chapter starts at the table.</p>`,
    },
    {
      kind: "intro", id: "types", title: "Every column has a type",
      html: `
        <p>When you create a table you promise what kind of value each column will hold. PostgreSQL holds you to that promise.</p>
        <table class="grid"><thead><tr><th>Type</th><th>Holds</th><th>Example</th></tr></thead><tbody>
          <tr><td><code>INT</code></td><td>whole numbers</td><td><code>98</code></td></tr>
          <tr><td><code>VARCHAR(50)</code></td><td>text, at most 50 characters</td><td><code>'Amit'</code></td></tr>
          <tr><td><code>TEXT</code></td><td>text of any length</td><td><code>'a long note...'</code></td></tr>
          <tr><td><code>NUMERIC(10,2)</code></td><td>exact decimals: 10 digits, 2 after the point (use for money)</td><td><code>6500.00</code></td></tr>
          <tr><td><code>DATE</code> / <code>TIMESTAMP</code></td><td>a calendar date / a date with a time</td><td><code>'2025-01-02'</code></td></tr>
          <tr><td><code>BOOLEAN</code></td><td>true or false</td><td><code>true</code></td></tr>
          <tr><td><code>SERIAL</code></td><td>a number PostgreSQL counts up for you: 1, 2, 3...</td><td>(you never type it)</td></tr>
        </tbody></table>`,
    },
    {
      kind: "table", id: "1.0", title: "The table",
      say: "Build the empty register, and write its rules into it.",
      sql: `-- Create the table
CREATE TABLE Students (
  roll_no INT PRIMARY KEY,
  name    VARCHAR(50) NOT NULL,
  branch  VARCHAR(20),
  marks   INT,
  CONSTRAINT chk_marks CHECK (marks BETWEEN 0 AND 100)
);`,
      grid: { head: ["Piece", "Meaning"], rows: [
        ["<code>INT PRIMARY KEY</code>", "Unique and never empty. No two students can share a roll number."],
        ["<code>VARCHAR(50)</code>", "Text, at most 50 characters."],
        ["<code>NOT NULL</code>", "This column must always be given a value."],
        ["<code>CHECK (marks BETWEEN 0 AND 100)</code>", "A rule every row must pass, or the INSERT is refused."],
        ["<code>CONSTRAINT chk_marks</code>", "Names the rule, so an error message tells you exactly which rule broke."],
      ] },
      explain: `<p>A rule written into a table is called a <b>constraint</b>. The table now exists, with its four columns and three rules, but no rows.</p>`,
    },
    {
      kind: "lesson", id: "1.1", title: "What is inside a new table?",
      say: "You created the table. What is inside it?",
      sql: `SELECT * FROM Students;`,
      predict: "The table was just created. What will SELECT * print?",
      explain: `<p><code>*</code> means "all columns". The structure exists, but no rows have been inserted yet,
        so the result is an empty grid with the right headings: <code>(0 rows)</code>.</p>`,
    },
    {
      kind: "lesson", id: "1.2", title: "Insert a full record",
      say: "Way 1: name every column, then give a value for each.",
      sql: `INSERT INTO Students (roll_no, name, branch, marks)
VALUES (21, 'Amit', 'CSE', 98);

SELECT * FROM Students;`,
      explain: `<p><code>INSERT 0 1</code> means one row was inserted. Listing the column names is the safest style:
        if someone later adds a column to the table, this statement still works.</p>`,
    },
    {
      kind: "lesson", id: "1.3", title: "Skip a column you do not know",
      say: "Way 2: you do not know Amrita's branch yet, so leave it out.",
      sql: `INSERT INTO Students (roll_no, name, marks)
VALUES (22, 'Amrita', 98);

SELECT * FROM Students;`,
      explain: `<p><code>branch</code> was not in the list, so PostgreSQL stored <b>NULL</b> there.
        NULL is not a blank space and not zero. It means <b>"value unknown / not supplied"</b>. psql prints it as an empty cell.</p>`,
      art: "nullcell",
    },
    {
      kind: "lesson", id: "1.4", title: "Insert without column names",
      say: "Way 3: skip the column list entirely.",
      sql: `INSERT INTO Students VALUES (23, 'Jyoti', 'ECE', 96);
INSERT INTO Students VALUES (24, 'Ankit', 'CSE', 98);

SELECT * FROM Students;`,
      explain: `<p>Without a column list, the values must come in the exact order the columns were created.
        Shorter to type, but fragile: if the table changes shape, this statement breaks or, worse, puts values in the wrong columns.</p>`,
    },
    {
      kind: "lesson", id: "1.5", title: "Only the roll number and name are known",
      say: "Dia has just joined. You know nothing else yet.",
      sql: `INSERT INTO Students (roll_no, name) VALUES (25, 'Dia');

SELECT * FROM Students;`,
      predict: "Marks must be between 0 and 100. Will a row with no marks at all be accepted?",
      explain: `<p>Both <code>branch</code> and <code>marks</code> became NULL, and the CHECK did not complain.
        A CHECK only refuses a row when its test is <b>false</b>. With NULL the answer is <i>unknown</i>, and unknown is let through.</p>`,
      tip: "If a column must always have a value, add NOT NULL as well as the CHECK.",
    },
    {
      kind: "lesson", id: "1.6", title: "Insert four students in one go",
      say: "Way 4: a bulk insert.",
      sql: `INSERT INTO Students (roll_no, name, branch, marks)
VALUES
  (26, 'Name6', 'CSE', 92),
  (27, 'Name7', 'ECE', 90),
  (28, 'Name8', 'CSE', 88),
  (29, 'Name9', 'CSE', 94);

SELECT * FROM Students;`,
      explain: `<p>One statement, many rows, separated by commas: <code>INSERT 0 4</code>. This is far faster than four
        separate INSERTs, because the database does the work in a single pass.</p>`,
    },
    {
      kind: "lesson", id: "1.7", title: "Prove the rules protect the data", errors: true,
      say: "Try to sneak three bad rows past the table.",
      sql: `-- (a) marks out of range
INSERT INTO Students VALUES (30, 'Bad', 'CSE', 150);

-- (b) name is NOT NULL
INSERT INTO Students VALUES (31, NULL, 'CSE', 80);

-- (c) roll_no is the PRIMARY KEY, and 21 already exists
INSERT INTO Students VALUES (21, 'Duplicate', 'CSE', 80);`,
      predict: "How many of these three rows get stored?",
      explain: `<p>All three were refused, and nothing was stored. That is the whole point of constraints: bad data never
        enters the table in the first place.</p>
        <p>Each error names the exact rule (<code>chk_marks</code>, <code>students_pkey</code>). That is why naming your constraints is worth the typing.</p>`,
    },
    {
      kind: "lesson", id: "1.8", title: "Correct a mistake with UPDATE",
      say: "Amit's name was entered wrongly. It should be Ankita.",
      sql: `UPDATE Students SET name = 'Ankita' WHERE roll_no = 21;

SELECT * FROM Students WHERE roll_no = 21;`,
      explain: `<p><code>UPDATE 1</code>: exactly one row changed. The <code>WHERE</code> clause is what limits the damage.</p>`,
      note: "Forget the WHERE and every row in the table is updated. Before any UPDATE or DELETE, run the same WHERE as a SELECT and check which rows it picks.",
    },
    {
      kind: "lesson", id: "1.9", title: "Rename the table", errors: true,
      say: "The table should now be called Learners. Then try the old name.",
      sql: `ALTER TABLE Students RENAME TO Learners;

SELECT * FROM Students;     -- the old name`,
      explain: `<p>The rename is instant and complete: the old name simply stops existing.
        Notice the error says <code>students</code> in lower case. PostgreSQL folds names you type without double quotes to lower case.</p>`,
    },
    {
      kind: "lesson", id: "1.10", title: "Read from the new name",
      say: "Same data, new name.",
      sql: `SELECT * FROM Learners LIMIT 3;`,
      predict: "Roll number 21 was the first row inserted. Will it be first here?",
      explain: `<p>Roll 21 is not first any more. The UPDATE in 1.8 wrote a new copy of that row at the end of the table.
        <b>A table has no natural order.</b> If you want a particular order, you must ask for it with <code>ORDER BY</code> (Chapter 2).</p>`,
    },
    {
      kind: "lesson", id: "1.11", title: "Add a column to an existing table",
      say: "The college now wants every student's email.",
      sql: `ALTER TABLE Learners ADD COLUMN email VARCHAR(100);

SELECT * FROM Learners LIMIT 3;`,
      explain: `<p>The new column goes at the end, and every existing row gets NULL in it. No data is lost.</p>`,
    },
    {
      kind: "lesson", id: "1.12", title: "Empty the table, keep its structure",
      say: "Start the year afresh: remove every row, but keep the table.",
      sql: `TRUNCATE TABLE Learners;

SELECT * FROM Learners;`,
      explain: `<p>All rows are gone in one sweep, but the table, its columns and its rules survive.
        <code>TRUNCATE</code> is much faster than <code>DELETE</code> because it does not look at rows one by one, and so it cannot take a <code>WHERE</code>.</p>`,
    },
    {
      kind: "lesson", id: "1.13", title: "Delete only some rows",
      say: "Put four students back, then remove everyone who scored below 90.",
      sql: `INSERT INTO Learners (roll_no, name, branch, marks) VALUES
  (26, 'Name6', 'CSE', 92), (27, 'Name7', 'ECE', 90),
  (28, 'Name8', 'CSE', 88), (29, 'Name9', 'CSE', 94);

DELETE FROM Learners WHERE marks < 90;

SELECT * FROM Learners;`,
      predict: "Name7 has exactly 90. Does Name7 survive?",
      explain: `<p><code>DELETE</code> is selective: only Name8 (88) was removed. <code>90 &lt; 90</code> is false, so Name7 survived.
        TRUNCATE is all or nothing; DELETE picks rows with WHERE.</p>`,
    },
    {
      kind: "lesson", id: "1.14", title: "Remove the table completely", errors: true,
      say: "The course is over. Demolish the register.",
      sql: `DROP TABLE Learners;

SELECT * FROM Learners;`,
      explain: `<p><code>DROP</code> destroys the structure, the data and the rules together. There is no undo.
        It is the most dangerous command in this chapter.</p>`,
    },
    {
      kind: "intro", id: "trio", title: "DELETE vs TRUNCATE vs DROP",
      art: "deletetrio",
      html: `
        <table class="grid"><thead><tr><th>Command</th><th>Removes rows?</th><th>Removes the table?</th><th>Takes WHERE?</th><th>Speed</th></tr></thead><tbody>
          <tr><td><code>DELETE</code></td><td>Yes, the ones you pick</td><td>No</td><td>Yes</td><td>Slow</td></tr>
          <tr><td><code>TRUNCATE</code></td><td>Yes, all of them</td><td>No</td><td>No</td><td>Fast</td></tr>
          <tr><td><code>DROP</code></td><td>Yes, all of them</td><td><b>Yes</b></td><td>No</td><td>Fast</td></tr>
        </tbody></table>
        <p>An eraser, a fresh page, and the register thrown in the bin.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: the commands of Chapter 1",
      cards: [
        { name: "CREATE TABLE", sig: "CREATE TABLE name (column type rules, ...);", does: "Builds a new, empty table.",
          sql: `CREATE TABLE teachers (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL);` },
        { name: "INSERT", sig: "INSERT INTO t (cols) VALUES (...), (...);", does: "Adds rows. List the columns; skipped ones become NULL.",
          sql: `INSERT INTO Students (roll_no, name, branch, marks) VALUES (30, 'Tara', 'ME', 81);` },
        { name: "UPDATE", sig: "UPDATE t SET col = value WHERE condition;", does: "Changes values in the rows that match WHERE.",
          sql: `UPDATE Students SET marks = marks + 1 WHERE roll_no = 28;
SELECT roll_no, name, marks FROM Students WHERE roll_no = 28;` },
        { name: "DELETE", sig: "DELETE FROM t WHERE condition;", does: "Removes the rows that match. No WHERE = every row.",
          sql: `DELETE FROM Students WHERE marks IS NULL;` },
        { name: "ALTER TABLE ... ADD COLUMN", sig: "ALTER TABLE t ADD COLUMN col type;", does: "Adds a column at the end; old rows get NULL.",
          sql: `ALTER TABLE Students ADD COLUMN city VARCHAR(30);
SELECT * FROM Students LIMIT 2;` },
        { name: "ALTER TABLE ... RENAME", sig: "ALTER TABLE t RENAME TO new_name;", does: "Renames a table. The old name stops working at once.",
          sql: `ALTER TABLE Students RENAME TO Learners;` },
        { name: "TRUNCATE", sig: "TRUNCATE TABLE t;", does: "Removes every row, fast. Keeps the table and its rules.",
          sql: `TRUNCATE TABLE Students;
SELECT count(*) FROM Students;` },
        { name: "DROP TABLE", sig: "DROP TABLE t;", does: "Deletes the table and everything in it.",
          sql: `DROP TABLE Students;` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "You want to remove <i>every</i> row from a table but keep the table for next year. Which is the best command?",
          opts: ["DROP TABLE", "TRUNCATE TABLE", "DELETE ... WHERE", "ALTER TABLE"], a: 1,
          why: "TRUNCATE empties the table fast and keeps its structure. DROP would delete the table itself." },
        { q: "Which of these is a DML command (it changes rows)?",
          opts: ["CREATE", "ALTER", "UPDATE", "DROP"], a: 2,
          why: "DML = INSERT, UPDATE, DELETE. CREATE, ALTER and DROP change structure, so they are DDL." },
        { q: "The table has <code>CHECK (marks BETWEEN 0 AND 100)</code>. What happens to <code>INSERT INTO Students (roll_no, name) VALUES (40, 'Tara');</code>?",
          opts: ["Refused: marks is missing", "Accepted: marks is stored as NULL", "Accepted: marks is stored as 0", "Refused: CHECK needs a number"], a: 1,
          why: "NULL makes the CHECK test unknown, not false, and unknown is let through. Add NOT NULL if marks are compulsory." },
        { q: "psql printed <code>INSERT 0 4</code>. What does it mean?",
          opts: ["The insert failed 4 times", "4 rows were inserted", "Row 4 was inserted", "0 rows were inserted"], a: 1,
          why: "The last number in an INSERT tag is the count of rows inserted. (The 0 is a historical leftover.)" },
        { q: "What does <code>UPDATE Students SET marks = 0;</code> do?",
          opts: ["Nothing, it needs a WHERE", "Sets marks to 0 for the first row", "Sets marks to 0 for every row", "An error"], a: 2,
          why: "With no WHERE, UPDATE touches every row. PostgreSQL does not ask 'are you sure?'." },
        { q: "What does <code>NULL</code> mean in a cell?",
          opts: ["Zero", "An empty string ''", "The value is unknown / not supplied", "The row was deleted"], a: 2,
          why: "NULL is the absence of a value. It is not 0 and not ''." },
        { q: "Two students can have the same name, but never the same roll number. Which constraint enforces that on roll_no?",
          opts: ["NOT NULL", "CHECK", "PRIMARY KEY", "DEFAULT"], a: 2,
          why: "PRIMARY KEY = unique + not null. It is how a table tells its rows apart." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Add student 40, Tara, CSE, with 88 marks.",
          bad: `INSERT INTO Students (roll_no, name, branch, marks) VALUES (40, 'Tara', 'CSE');`,
          opts: [
            `INSERT INTO Students (roll_no, name, branch, marks) VALUES (40, "Tara", 'CSE', 88);`,
            `INSERT INTO Students (roll_no, name, branch, marks) VALUES (40, 'Tara', 'CSE', 88);`,
            `INSERT INTO Students (roll_no, name, branch, marks) VALUES (40, Tara, CSE, 88);`,
            `INSERT Students VALUES (40, 'Tara', 'CSE', 88);`],
          a: 1,
          why: `Four columns were named but only three values given. The count must match. And the text values need single quotes, which rules out the other options.` },
        { task: "Give Ankit (roll 24) 95 marks.",
          bad: `UPDATE Students SET marks = 95;`, silent: true,
          opts: [
            `UPDATE Students SET marks = 95 WHERE roll_no = 24;`,
            `UPDATE Students WHERE roll_no = 24 SET marks = 95;`,
            `UPDATE Students SET marks = 95 AND roll_no = 24;`,
            `INSERT INTO Students (roll_no, marks) VALUES (24, 95);`],
          a: 0,
          why: `There is no error here, which makes this the most dangerous bug: all nine students now have 95. The WHERE clause goes <i>after</i> SET, and it is what limits the change to one row.` },
        { task: "Show every student.", bad: `SELECT * FROM Student;`,
          opts: [`SELECT * FROM "Student";`, `SELECT * FROM Students;`, `SELECT * Students;`, `SELECT ALL Student;`], a: 1,
          why: `"relation does not exist" almost always means a typo in the table name. The table is <code>Students</code>, with an s.` },
        { task: "Create a teachers table with an id and a name.",
          bad: `CREATE TABLE teachers (
  id   INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
);`,
          opts: [
            `CREATE TABLE teachers (
  id   INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);`,
            `CREATE TABLE teachers (
  id   INT PRIMARY KEY;
  name VARCHAR(50) NOT NULL;
);`,
            `CREATE TABLE teachers
  id   INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL;`,
            `CREATE teachers (
  id   INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);`],
          a: 0,
          why: `The comma after the last column tells PostgreSQL another column is coming. Then it meets <code>)</code> instead. No comma after the last item inside the brackets.` },
        { task: "Add student 41, Riya, ECE, who scored 120.",
          bad: `INSERT INTO Students VALUES (41, 'Riya', 'ECE', 120);`,
          opts: [
            `INSERT INTO Students VALUES (41, 'Riya', 'ECE', '120');`,
            `INSERT INTO Students VALUES (41, 'Riya', 'ECE', 100 + 20);`,
            `INSERT INTO Students VALUES (41, 'Riya', 'ECE', NULL);`,
            `INSERT INTO Students VALUES ('41', 'Riya', 'ECE', 120);`],
          a: 2,
          why: `The CHECK rule is doing its job: 120 is impossible for marks out of 100. The data is wrong, not the table. Store NULL (unknown) until the real mark is confirmed, rather than weakening the rule.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "Three families: <b>DDL</b> (structure: CREATE, ALTER, DROP, TRUNCATE), <b>DML</b> (rows: INSERT, UPDATE, DELETE), <b>DQL</b> (reading: SELECT).",
        "DELETE removes chosen rows; TRUNCATE removes all rows and keeps the table; DROP removes the table.",
        "NULL means unknown. It is not 0 and not ''.",
        "A CHECK lets NULL through, because unknown is not false. Add NOT NULL when a value is compulsory.",
        "Always write WHERE with UPDATE and DELETE. Test the same WHERE with a SELECT first.",
        "Name your constraints (<code>CONSTRAINT chk_marks CHECK (...)</code>) so errors tell you what broke.",
        "Rows have no guaranteed order. Only ORDER BY guarantees the order of a result.",
        "Prefer <code>INSERT INTO t (a, b) VALUES ...</code> over the positional form: it survives table changes.",
        "ADD COLUMN always appends at the end and fills existing rows with NULL.",
        "Names are folded to lower case unless double-quoted: <code>Students</code> becomes <code>students</code>.",
      ],
    },
  ],
};
