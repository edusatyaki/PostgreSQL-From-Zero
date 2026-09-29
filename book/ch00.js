/* Chapter 0 - for someone who has never heard the word "database". */
export default {
  id: "ch0",
  num: 0,
  title: "Before you start",
  topic: "Data, tables, databases and SQL",
  accent: "pencil",
  opener: {
    question: "What is a database, and why would anyone talk to one?",
    story: `You already know how to keep data. Your school attendance register is a database: one page
      per class, one line per student, one column per day. This chapter turns that register into
      the words a database uses, and then you type your first SQL.`,
    learn: [
      "What a table, a row, a column and a cell are",
      "What a database, a DBMS, SQL and PostgreSQL are",
      "How to run a query in this book, change it, and run it again",
      "The four grammar rules every SQL statement follows",
    ],
    uses: "No table needed yet",
  },
  sandbox: `CREATE TABLE friends (
  name  TEXT,
  city  TEXT,
  age   INT
);
INSERT INTO friends VALUES ('Asha', 'Pune', 19), ('Ravi', 'Delhi', 20), ('Meera', 'Pune', 18);`,
  pages: [
    {
      kind: "intro", id: "register", title: "A table is a register",
      art: "register",
      html: `
        <p>Picture the attendance register your class teacher carries. Every database table looks exactly like it.</p>
        <ul class="defs">
          <li><b>Table</b>: the whole register. It has a name, like <code>students</code>.</li>
          <li><b>Column</b>: one heading across the top: <code>roll_no</code>, <code>name</code>, <code>marks</code>. Every value in a column is the same <i>kind</i> of thing.</li>
          <li><b>Row</b>: one line in the register: everything about <i>one</i> student.</li>
          <li><b>Cell</b>: where one row meets one column: Amit's marks, 98.</li>
        </ul>
        <p class="aside">Databases also call a row a <b>record</b> or a <b>tuple</b>, and a table a <b>relation</b>. You will see the word "relation" in PostgreSQL's error messages. It just means "table".</p>`,
    },
    {
      kind: "intro", id: "words", title: "Database, DBMS, SQL, PostgreSQL",
      art: "librarian",
      html: `
        <p>Four words you will hear every day. Think of a library:</p>
        <ul class="defs">
          <li><b>Database</b>: the library's cupboard of registers. A collection of tables that belong together (a school's students, marks and fees).</li>
          <li><b>DBMS</b> (database management system): the librarian. The software that stores the tables, keeps them safe, and fetches what you ask for.</li>
          <li><b>SQL</b> (Structured Query Language, said "sequel" or "S-Q-L"): the language you speak to the librarian. You never open the cupboard yourself; you <i>ask</i>.</li>
          <li><b>PostgreSQL</b> (said "post-gres"): one particular librarian. Free, open-source, and trusted by companies of every size. Every query in this book runs on it.</li>
        </ul>
        <p>A question you ask in SQL is called a <b>query</b>. The table of values that comes back is the <b>result</b>.</p>`,
    },
    {
      kind: "intro", id: "howto", title: "How to use this book",
      art: "pagetour",
      html: `
        <p>Almost every page is one small <b>situation</b>: a real problem, the SQL that solves it, what PostgreSQL printed, and why.</p>
        <ol class="steps">
          <li><b>Read the situation.</b> Before you look at the answer, ask yourself: <i>how would I say this?</i></li>
          <li><b>Guess the output.</b> Some pages ask you to predict first. Guessing, even wrongly, is how it sticks.</li>
          <li><b>Press Run.</b> You see the real output PostgreSQL printed.</li>
          <li><b>Change the code and run it again.</b> Press <b>Edit</b>, change a number or a name, press <b>Run</b>. A real PostgreSQL 18 database is running inside this page. You cannot break anything: <b>Reset</b> puts it back.</li>
        </ol>
        <p>Every chapter ends with the <b>toolbox</b> (the chapter's important functions), a <b>checkpoint</b> quiz, and a <b>bug hunt</b>: broken queries with their real error messages, where you pick the fix.</p>
        <p class="aside">Keys: <kbd>Right</kbd> next page, <kbd>Left</kbd> previous, <kbd>/</kbd> search, <kbd>T</kbd> light/dark, <kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs the code you are editing.</p>`,
    },
    {
      kind: "lesson", id: "0.1", title: "Say hello",
      say: "The first thing every programmer does: make the computer say something back.",
      sql: `SELECT 'Hello, PostgreSQL!' AS greeting;`,
      predict: "What do you think comes back: a sentence, a table, or an error?",
      explain: `
        <p><code>SELECT</code> means "give me". Here you ask for a piece of text, and PostgreSQL hands it back
        as a <b>table</b> with one column and one row. Everything SQL returns is a table, even a single word.</p>
        <p><code>AS greeting</code> names the column. The text sits inside <b>single quotes</b>, and the
        statement ends with a <b>semicolon</b>.</p>`,
      tip: "Press Edit, put your own name inside the quotes, and Run it.",
    },
    {
      kind: "lesson", id: "0.2", title: "SQL is also a calculator",
      say: "You can ask PostgreSQL to do arithmetic, and name every answer.",
      sql: `SELECT 2 + 3     AS total,
       10 * 12   AS product,
       100 - 42  AS difference,
       100 / 8.0 AS exact_share;`,
      explain: `
        <p>A comma separates the columns you ask for, so one <code>SELECT</code> can return many answers side by side.
        Spaces and line breaks do not matter to PostgreSQL. They are only there so humans can read the query.</p>
        <p>Why <code>8.0</code> and not <code>8</code>? Chapter 3 explains the surprise hiding in <code>100 / 8</code>.
        Try it now if you are curious.</p>`,
    },
    {
      kind: "intro", id: "grammar", title: "Four grammar rules",
      html: `
        <table class="grid"><thead><tr><th>Rule</th><th>Example</th></tr></thead><tbody>
          <tr><td>A statement ends with a semicolon <code>;</code></td><td><code>SELECT 1;</code></td></tr>
          <tr><td>Keywords do not care about case, but people write them in CAPITALS so they stand out</td><td><code>select</code> = <code>SELECT</code></td></tr>
          <tr><td>Text goes in <b>single</b> quotes. Double quotes mean a <i>name</i> (a column or table), not text</td><td><code>'Pune'</code> is text, <code>"Pune"</code> is a column called Pune</td></tr>
          <tr><td>Two dashes start a comment; PostgreSQL ignores the rest of the line</td><td><code>-- this is a note to myself</code></td></tr>
        </tbody></table>
        <p>The third rule causes more beginner errors than any other. You will meet it in this chapter's bug hunt.</p>`,
    },
    {
      kind: "lesson", id: "0.3", title: "A first peek at a real table",
      say: "Let us build a tiny table of three friends and read it back. Chapter 1 explains every word; for now, just watch.",
      sql: `CREATE TABLE friends (
  name  TEXT,
  city  TEXT,
  age   INT
);

INSERT INTO friends VALUES ('Asha', 'Pune', 19), ('Ravi', 'Delhi', 20), ('Meera', 'Pune', 18);

SELECT * FROM friends;`,
      explain: `
        <p>Three statements, three answers:</p>
        <ul class="defs">
          <li><code>CREATE TABLE</code> draws the empty register: its name and its column headings, each with a type (<code>TEXT</code> for words, <code>INT</code> for whole numbers).</li>
          <li><code>INSERT</code> writes rows into it. <code>INSERT 0 3</code> means three rows went in.</li>
          <li><code>SELECT * FROM friends</code> reads it back. <code>*</code> means "every column".</li>
        </ul>`,
    },
    {
      kind: "lesson", id: "0.4", title: "Ask a question of the table",
      say: "Which of your friends live in Pune?",
      sql: `SELECT name, age
FROM friends
WHERE city = 'Pune';`,
      predict: "Three friends, two in Pune. Which columns and how many rows will come back?",
      explain: `
        <p>Read it like an English sentence: <i>select the name and age, from friends, where the city is Pune.</i></p>
        <p>You named two columns, so you get two columns. <code>WHERE</code> keeps only the rows that pass the test,
        so Ravi from Delhi is left out. That is most of SQL already: <b>pick columns, pick rows</b>.</p>`,
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "In a table of students, one student's complete information (roll number, name, branch, marks) is stored in one...",
          opts: ["column", "row", "cell", "database"], a: 1,
          why: "A row is one record: everything about one thing. A column holds one kind of value for every row." },
        { q: "What is SQL?",
          opts: ["A database program you install", "The language you use to ask a database for data", "A kind of table", "A file format for spreadsheets"], a: 1,
          why: "SQL is the language. PostgreSQL is the program (the DBMS) that understands it." },
        { q: "Which of these is text, as far as PostgreSQL is concerned?",
          opts: [`"Pune"`, "Pune", "'Pune'", "(Pune)"], a: 2,
          why: "Single quotes make text. Double quotes make a name, so \"Pune\" means a column called Pune." },
        { q: "What does this return?", code: "SELECT 7 + 5 AS answer;",
          opts: ["7 + 5", "12", "75", "An error"], a: 1, check: "SELECT 7 + 5 AS answer;",
          why: "SELECT evaluates the expression and returns the result in a one-row, one-column table." },
        { q: "Are these two statements the same? <code>select * from friends;</code> and <code>SELECT * FROM friends;</code>",
          opts: ["Yes: keywords ignore case", "No: SQL is case-sensitive everywhere", "Only in PostgreSQL 18", "No: lowercase is an error"], a: 0,
          why: "Keywords are case-insensitive. Capitals are only a habit that makes queries easier to read." },
        { q: "What does <code>*</code> mean in <code>SELECT * FROM friends</code>?",
          opts: ["Multiply", "Every row", "Every column", "The first row"], a: 2,
          why: "* after SELECT means all columns. Which rows you get is decided by WHERE." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Say hello.", bad: `SELECT "Hello";`,
          opts: [`SELECT 'Hello';`, `SELECT Hello;`, `SELECT ("Hello");`, `PRINT 'Hello';`], a: 0,
          why: `Double quotes mean a <i>name</i>, so PostgreSQL went looking for a column called Hello and found none. Text needs single quotes.` },
        { task: "List the friends from Delhi.", bad: `SELECT * FROM friends WHERE city = Delhi;`,
          opts: [`SELECT * FROM friends WHERE city = "Delhi";`, `SELECT * FROM friends WHERE city = 'Delhi';`, `SELECT * FROM friends WHERE Delhi;`, `SELECT * FROM friends WHERE city IS Delhi;`], a: 1,
          why: `Without quotes, <code>Delhi</code> is read as a column name. Text values always go in single quotes.` },
        { task: "Show every friend.", bad: `SELEC * FROM friends;`,
          opts: [`SELECT * FROM friends;`, `SELEC * FROM friends`, `SELECT ALL FROM friends;`, `GET * FROM friends;`], a: 0,
          why: `A misspelt keyword is a <b>syntax error</b>. PostgreSQL points at where it stopped understanding, and the problem is often just before the caret.` },
        { task: "Show every friend's name.", bad: `SELECT name FROM friend;`,
          opts: [`SELECT name FROM "friend";`, `SELECT name FROM friends;`, `SELECT name IN friends;`, `SELECT friends.name;`], a: 1,
          why: `"relation does not exist" means no table has that name. Relation is PostgreSQL's word for table. Check the spelling first.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "A table is a register: columns across the top, one row per thing, a cell where they meet.",
        "The database stores tables; the DBMS (PostgreSQL) manages them; SQL is how you talk to it.",
        "Everything a query returns is a table, even a single value.",
        "<code>SELECT</code> picks columns; <code>WHERE</code> picks rows.",
        "Text in single quotes <code>'like this'</code>. Double quotes are for names.",
        "End every statement with <code>;</code>. Keywords ignore case. <code>--</code> starts a comment.",
      ],
    },
  ],
};
