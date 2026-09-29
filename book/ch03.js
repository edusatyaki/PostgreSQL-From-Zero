/* Chapter 3 (+ 3A) - built-in functions: number, date, string, NULL (class file DE 3). */
const TABLE = `DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  emp_id    SERIAL PRIMARY KEY,   -- auto-incrementing id
  name      VARCHAR(100),         -- messy casing + stray spaces
  email     VARCHAR(100),         -- needs domain extraction
  salary    NUMERIC(14, 4),       -- too many decimal places
  join_date TIMESTAMP,            -- machine-readable timestamp
  phone     VARCHAR(15),          -- sometimes NULL (missing data)
  city      VARCHAR(50)
);

INSERT INTO employees (name, email, salary, join_date, phone, city) VALUES
 ('john DOE',     'john@gmail.com',     45678.6789, '2026-05-29 14:43:22', NULL,         'Bengaluru'),
 ('asha rao',     'asha.rao@yahoo.com', 38210.5000, '2025-11-02 09:12:00', '9912345670', 'Hyderabad'),
 ('  Ravi Kumar ','ravi@outlook.com',   52300.1250, '2024-07-15 18:05:44', '9876543210', 'Chennai'),
 ('JANE smith',   'jane@gmail.com',     61999.9999, '2026-01-09 11:30:10', NULL,         'Mumbai'),
 ('JAKE Miller',  'jake@company.co.in', 29500.0000, '2025-03-21 08:00:00', '9001122334', 'Pune');`;

export default {
  id: "ch3",
  num: 3,
  title: "Cleaning messy data",
  topic: "Number, date, string and NULL functions",
  accent: "leaf",
  opener: {
    question: "Real data arrives dirty. How do you clean it without touching it?",
    story: `Five employees, and every row is a little broken: names in the wrong case, stray spaces,
      salaries with four decimal places, missing phone numbers, dates a human cannot read. You will not
      edit a single stored value. Instead, functions clean each value on the way out, and the last
      page of the chapter turns the whole mess into a tidy report with one query.`,
    learn: [
      "Round, cut and divide numbers without the classic integer-division bug",
      "Pull pieces out of dates, do date arithmetic, and format dates for people",
      "Fix casing, trim spaces, cut, join, split and mask text",
      "Understand NULL, and handle it with IS NULL, COALESCE and NULLIF",
      "Nest functions inside each other and read them inside-out",
    ],
    uses: "employees (5 deliberately messy rows)",
  },
  pages: [
    {
      kind: "intro", id: "what", title: "What is a function?",
      art: "machine",
      html: `
        <p>A function is a little machine. You put a value in, it hands a new value out. The original is never changed.</p>
        <p><code>UPPER('asha')</code> takes <code>'asha'</code> in and gives <code>'ASHA'</code> out. The brackets hold the
        inputs, called <b>arguments</b>. Some functions take more than one: <code>ROUND(45.678, 2)</code> means "round
        45.678 to 2 decimal places".</p>
        <p>This chapter has four families of machines: <b>number</b>, <b>date</b>, <b>string</b> (text) and <b>NULL</b> functions.
        You can feed the output of one straight into another; that is called <b>nesting</b>.</p>`,
    },
    {
      kind: "table", id: "3.0", title: "The table",
      say: "Five deliberately messy rows. This is what real data looks like, and this chapter is the cleaning kit.",
      sql: TABLE,
      show: `SELECT * FROM employees;`,
      explain: `<p><code>SERIAL</code> is an auto-incrementing integer: 1, 2, 3... You never supply <code>emp_id</code> yourself.
        Look closely at Ravi: there are spaces hiding before and after his name.</p>`,
    },
    { kind: "intro", id: "u-number", title: "Part 1: number functions", section: true,
      html: `<p>Rounding money, cutting decimals, and the division that quietly gives the wrong answer.</p>` },
    {
      kind: "lesson", id: "3.1", title: "Show only 2 decimal places",
      say: "The salary has 4 decimal places. Round it.",
      sql: `SELECT round(45678.6789, 2), round(45678.6789), round(45678.6789, 0), round(45678.6789, 1);
SELECT round(45678.6789, 3), round(45678.6789, 4), round(45678.6789, 5);`,
      explain: `<p><code>ROUND(value, n)</code> keeps n decimal places and rounds the rest. Leaving out n is the same as n = 0.
        Asking for more places than exist (<code>, 5</code>) only pads a zero: no new information is invented.</p>`,
    },
    {
      kind: "lesson", id: "3.2", title: "What happens exactly at .5?",
      say: "Round 45.5 and 45.4.",
      sql: `SELECT ROUND(45.5), ROUND(45.4);`,
      predict: "Does 45.5 go up or down?",
      explain: `<p>"Round half away from zero": .5 and above goes up, below .5 goes down.</p>`,
    },
    {
      kind: "lesson", id: "3.3", title: "Round to the nearest ten, hundred, thousand",
      say: "A negative precision rounds to the left of the decimal point.",
      sql: `SELECT round(678.6789, -1), round(678.6789, -2), round(678.6789, -3), round(678.6789, -4);`,
      grid: { head: ["Call", "Compare", "Result"], rows: [
        ["-1", "last digit 8 vs 5: up", "680"], ["-2", "78 vs 50: up", "700"],
        ["-3", "678 vs 500: up", "1000"], ["-4", "678 vs 5000: down", "0"],
      ] },
      explain: `<p>Useful for "about how much?" figures: salaries to the nearest thousand, populations to the nearest lakh.</p>`,
    },
    {
      kind: "lesson", id: "3.4", title: "Clean every salary in the table",
      say: "Show each raw salary next to a rounded one.",
      sql: `SELECT name,
       salary           AS raw_salary,
       ROUND(salary, 2) AS clean_salary
FROM employees;`,
      explain: `<p>Watch Jane: 61999.9999 rounds all the way up to 62000.00. Rounding can carry across the decimal point.
        <code>AS</code> creates a column <b>alias</b>: a display heading only. The stored data is untouched.</p>`,
    },
    {
      kind: "lesson", id: "3.5", title: "Cut the decimals instead of rounding",
      say: "TRUNC chops; it never looks at the next digit.",
      sql: `SELECT TRUNC(45.678, 2), TRUNC(45.678), TRUNC(-45.678, 2);

SELECT 45.678           AS actual_value,
       ROUND(45.678, 2) AS rounded,
       TRUNC(45.678, 2) AS truncated;`,
      explain: `<p><code>ROUND(45.678, 2)</code> = 45.68 but <code>TRUNC(45.678, 2)</code> = 45.67. For negatives, TRUNC moves toward zero.
        Use ROUND for money reports; use TRUNC when you must never overstate a value.</p>`,
    },
    {
      kind: "lesson", id: "3.6", title: "Always down, always up",
      say: "FLOOR and CEIL are about direction on the number line.",
      sql: `SELECT FLOOR(45.678), CEIL(45.678), CEILING(45.678), FLOOR(-45.678), CEIL(-45.678);`,
      predict: "FLOOR(-45.678): is it -45 or -46?",
      explain: `<p><code>FLOOR</code> always goes down the number line, <code>CEIL</code> always goes up. That is why
        <code>FLOOR(-45.678)</code> is -46 (further from zero), while <code>TRUNC(-45.678)</code> would be -45.
        <code>CEILING</code> is another name for <code>CEIL</code>.</p>`,
      art: "numberline",
    },
    {
      kind: "lesson", id: "3.7", title: "Division surprises",
      say: "Divide 7 by 2, four ways.",
      sql: `SELECT 7 / 2      AS int_div,
       7 / 2.0    AS dec_div,
       DIV(7, 2)  AS div_fn,
       MOD(7, 2)  AS mod_fn;`,
      predict: "What is 7 / 2 in PostgreSQL?",
      explain: `<p><code>7 / 2</code> gives <b>3</b>, not 3.5. Both numbers are integers, so PostgreSQL does integer
        division and throws the remainder away. Making one of them a decimal (<code>2.0</code>) fixes it.
        <code>DIV()</code> is the whole-number quotient on purpose, and <code>MOD()</code> is the remainder.</p>`,
      note: "This is the number-one silent bug in beginner SQL: an average computed as sum/count on integers comes out wrong, with no error.",
    },
    {
      kind: "lesson", id: "3.8", title: "Powers and absolute values",
      say: "Squares, square roots, cube roots, and distance from zero.",
      sql: `SELECT POWER(5, 2), POWER(2, 10), POWER(9, 0.5), POWER(27, 1/3.0);
SELECT ABS(-250), ABS(250), ABS(-45.75);`,
      explain: `<p><code>POWER(9, 0.5)</code> is the square root; <code>POWER(27, 1/3.0)</code> the cube root, and it returns
        2.99999... instead of 3. That is floating-point imprecision, not a bug: wrap it in <code>ROUND()</code> before
        showing it to anyone. (Note <code>1/3.0</code>, not <code>1/3</code>: see 3.7.)</p>
        <p><code>ABS</code> strips the sign. Useful for "how far off were we?" questions.</p>`,
    },
    {
      kind: "lesson", id: "3A.1", title: "A square root without POWER",
      say: "The dedicated square-root function.",
      sql: `SELECT SQRT(9), SQRT(2), POWER(9, 0.5);`,
      explain: `<p><code>SQRT(x)</code> is shorter and clearer than <code>POWER(x, 0.5)</code>.</p>`,
    },
    {
      kind: "lesson", id: "3A.2", title: "Fix the scale with a cast",
      say: "Convert a value to a type with exactly 2 decimals.",
      sql: `SELECT 45.678::NUMERIC(10,2) AS cast_scale,
       ROUND(45.678, 2)      AS round_scale;`,
      explain: `<p><code>::</code> is a <b>cast</b>: "treat this value as that type". Casting to <code>NUMERIC(p,s)</code> rounds
        to s decimals and pins the type, so later calculations keep that scale. Use the cast when the scale
        belongs to the column; use ROUND when it belongs to one report.</p>`,
    },
    { kind: "intro", id: "u-date", title: "Part 2: date and time functions", section: true,
      html: `<p>What time is it, which month was that, what is 30 days later, and how do people like to read dates?</p>
        <p class="aside">Pages that use <code>NOW()</code> show today's date when you run them, so your output will differ from the saved one.</p>` },
    {
      kind: "lesson", id: "3.9", title: "The current date and time", live: true,
      say: "Ask the database what time it is.",
      sql: `SELECT NOW(), CURRENT_DATE, CURRENT_TIME;`,
      explain: `<p><code>NOW()</code> = date + time + time zone. <code>CURRENT_DATE</code> = the date only.
        <code>CURRENT_TIME</code> = the time only. Use the narrowest one you need.</p>`,
    },
    {
      kind: "lesson", id: "3.10", title: "Pull one piece out of a date", live: true,
      say: "Year, month, quarter and day of the week, as numbers.",
      sql: `SELECT EXTRACT(YEAR    FROM NOW()) AS y,
       EXTRACT(MONTH   FROM NOW()) AS m,
       EXTRACT(QUARTER FROM NOW()) AS q,
       EXTRACT(DOW     FROM NOW()) AS dow;`,
      explain: `<p><code>EXTRACT(field FROM source)</code> returns a number. In PostgreSQL, <code>DOW</code> (day of week)
        is 0 = Sunday ... 6 = Saturday. (<code>ISODOW</code> uses 1 = Monday if you prefer.)</p>`,
    },
    {
      kind: "lesson", id: "3.11", title: "Which year and month did each employee join?",
      say: "The standard way to build year-wise and month-wise reports.",
      sql: `SELECT name,
       EXTRACT(YEAR  FROM join_date) AS join_year,
       EXTRACT(MONTH FROM join_date) AS join_month
FROM employees;`,
      explain: `<p>EXTRACT works on any date or timestamp column, not only on NOW().</p>`,
    },
    {
      kind: "lesson", id: "3.12", title: "Date arithmetic with INTERVAL", live: true,
      say: "A week from now, a month ago, two years and three months ahead.",
      sql: `SELECT NOW() + INTERVAL '7 days'          AS next_week,
       NOW() - INTERVAL '1 month'         AS last_month,
       NOW() + INTERVAL '2 years 3 months' AS later;`,
      explain: `<p><code>INTERVAL</code> understands plain English units and handles month lengths and leap years for you.
        You can chain units in one string.</p>`,
    },
    {
      kind: "lesson", id: "3.13", title: "A 30-day trial from each join date",
      say: "Every new employee gets a 30-day trial. When does it end?",
      sql: `SELECT name, join_date,
       join_date + INTERVAL '30 days' AS trial_expiry
FROM employees;`,
      explain: `<p>The time of day is carried along. Note that <code>'30 days'</code> is not <code>'1 month'</code>:
        29 May + 30 days = 28 June, but 29 May + 1 month = 29 June.</p>`,
    },
    {
      kind: "lesson", id: "3.14", title: "Who joined in the last 12 months?", live: true,
      say: "A rolling window that is right whenever you run it.",
      sql: `SELECT name, join_date
FROM employees
WHERE join_date >= NOW() - INTERVAL '12 months';`,
      explain: `<p>This is the everyday "recent records" filter. Unlike a hard-coded date, it stays correct next month and next year.
        (Because it depends on today, your result may differ from the saved one.)</p>`,
    },
    {
      kind: "lesson", id: "3.15", title: "Bucket every row into its month", live: true,
      say: "DATE_TRUNC flattens a timestamp down to the start of its month.",
      sql: `SELECT DATE_TRUNC('month', NOW()) AS m, DATE_TRUNC('year', NOW()) AS y;

SELECT DATE_TRUNC('month', join_date) AS join_month,
       COUNT(*)                       AS joiners
FROM employees
GROUP BY DATE_TRUNC('month', join_date)
ORDER BY join_month;`,
      explain: `<p><code>DATE_TRUNC('month', x)</code> snaps a timestamp to the 1st of that month at 00:00. Every row in the same
        month gets the same value, which is exactly what <code>GROUP BY</code> (Chapter 4) needs to build a monthly report.</p>`,
    },
    {
      kind: "lesson", id: "3.16", title: "EXTRACT vs DATE_TRUNC", live: true,
      say: "Both talk about 'the month'. What is the difference?",
      sql: `SELECT EXTRACT(MONTH FROM NOW())   AS extracted,
       DATE_TRUNC('month', NOW()) AS truncated;`,
      grid: { head: ["", "Returns", "Good for"], rows: [
        ["<code>EXTRACT</code>", "a number (9)", "\"which month number\", comparisons, maths"],
        ["<code>DATE_TRUNC</code>", "a date (2026-09-01)", "grouping a time series into buckets"],
      ] },
      explain: `<p>The big difference: <code>EXTRACT(MONTH ...)</code> gives 9 for September 2025 <i>and</i> September 2026,
        so they collapse together. DATE_TRUNC keeps the year. For monthly trend reports, use DATE_TRUNC.</p>`,
    },
    {
      kind: "lesson", id: "3.17", title: "Format a date or number for humans", live: true,
      say: "TO_CHAR turns a date or a number into formatted text.",
      sql: `SELECT TO_CHAR(NOW(), 'DD Mon YYYY'),
       TO_CHAR(NOW(), 'DD/MM/YYYY'),
       TO_CHAR(45678.6789, '999G999D99'),
       TO_CHAR(545678.6789, '9G99G999D99');`,
      grid: { head: ["Code", "Means"], rows: [
        ["<code>DD</code> / <code>Mon</code> / <code>YYYY</code>", "day / short month name / 4-digit year"],
        ["<code>9</code>", "a digit position"], ["<code>G</code>", "group separator (comma)"], ["<code>D</code>", "decimal point"],
      ] },
      explain: `<p>The last one prints the Indian lakh format, 5,45,678.68, because the G markers were placed as <code>9G99G999</code>.</p>`,
      note: "The result of TO_CHAR is text, not a number. Do not do arithmetic on it afterwards.",
    },
    {
      kind: "lesson", id: "3.18", title: "Each employee's joining month, nicely",
      say: "Turn machine timestamps into something a manager reads.",
      sql: `SELECT name,
       TO_CHAR(join_date, 'Mon YYYY')    AS joined_month,
       TO_CHAR(join_date, 'DD Mon YYYY') AS joined_on
FROM employees;`,
      explain: `<p>The stored value is still a full timestamp; only the display changed.</p>`,
    },
    {
      kind: "lesson", id: "3A.8", title: "More EXTRACT fields and DATE_TRUNC units",
      say: "Day, hour, minute and second; then quarter, day and hour buckets.",
      sql: `SELECT EXTRACT(DAY    FROM join_date) AS d,
       EXTRACT(HOUR   FROM join_date) AS h,
       EXTRACT(MINUTE FROM join_date) AS mi,
       EXTRACT(SECOND FROM join_date) AS s
FROM employees
LIMIT 1;

SELECT DATE_TRUNC('quarter', join_date) AS q,
       DATE_TRUNC('day',     join_date) AS day,
       DATE_TRUNC('hour',    join_date) AS hr
FROM employees
LIMIT 1;`,
      explain: `<p>EXTRACT accepts YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND, DOW, ISODOW, DOY, WEEK and EPOCH.
        DATE_TRUNC accepts the same units as words and always snaps down to the start of that unit.</p>`,
    },
    {
      kind: "lesson", id: "3A.9", title: "Time, and full month names, in TO_CHAR",
      say: "24-hour and 12-hour clocks, and the padding trap in Month.",
      sql: `SELECT TO_CHAR(join_date, 'HH24:MI')         AS time_24h,
       TO_CHAR(join_date, 'HH12:MI AM')      AS time_12h,
       TO_CHAR(join_date, 'DD Month YYYY')   AS padded_month,
       TO_CHAR(join_date, 'DD FMMonth YYYY') AS clean_month
FROM employees
LIMIT 1;`,
      explain: `<p><code>Month</code> is blank-padded to nine characters, which is why "May" arrives with a run of spaces.
        The <code>FM</code> prefix ("fill mode") switches the padding off: <code>FMMonth</code>, <code>FMDay</code>.</p>`,
    },
    { kind: "intro", id: "u-string", title: "Part 3: string functions", section: true,
      html: `<p>Fix the casing, measure, join, cut, trim, replace and split text. Positions in SQL text start at <b>1</b>, not 0.</p>` },
    {
      kind: "lesson", id: "3.19", title: "Fix the messy casing",
      say: "UPPER, LOWER and Title Case.",
      sql: `SELECT UPPER('john doe'), LOWER('ADMIN'), INITCAP('john doe');

SELECT name, UPPER(name) AS upper_name, INITCAP(name) AS title_name FROM employees;`,
      explain: `<p><code>INITCAP</code> = Title Case. Look at Ravi's row: the casing is fixed but the stray spaces survive.
        Case functions do not trim. That is what TRIM is for (3.24).</p>`,
    },
    {
      kind: "lesson", id: "3.20", title: "Search for a name, ignoring case",
      say: "Someone types JOHN doe into a search box.",
      sql: `SELECT * FROM employees WHERE LOWER(name) = LOWER('JOHN doe');`,
      explain: `<p>Lower-case both sides so the comparison is fair. A plain <code>name = 'JOHN doe'</code> returns 0 rows,
        because the stored value is <code>'john DOE'</code>.</p>`,
    },
    {
      kind: "lesson", id: "3.21", title: "Measure text, and catch bad phone numbers",
      say: "LENGTH counts characters. Find phone numbers that are not 10 digits.",
      sql: `SELECT LENGTH('PostgreSQL'), LENGTH('   PostgreSQL   ');

SELECT name, phone, LENGTH(phone) AS digits
FROM employees
WHERE LENGTH(phone) <> 10;`,
      predict: "Two employees have no phone at all. Will this query find them?",
      explain: `<p>Spaces are characters too: 10 becomes 16. The second query returns 0 rows, and that is a trap worth understanding:
        the three real numbers are all 10 digits, and the two NULL phones were silently skipped, because
        <code>LENGTH(NULL)</code> is NULL and <code>NULL &lt;&gt; 10</code> is never true. This query cannot find missing data.
        You need <code>IS NULL</code> for that (3.31).</p>`,
    },
    {
      kind: "lesson", id: "3.22", title: "Join pieces of text together",
      say: "CONCAT and the || operator, and what NULL does to each.",
      sql: `SELECT CONCAT('John', ' ', 'Doe'),
       'John' || ' ' || 'Doe',
       CONCAT('John', NULL, 'Doe') AS concat_null,
       'John' || NULL || 'Doe'     AS pipe_null;

SELECT CONCAT(INITCAP(name), ' - ', city) AS display_label FROM employees;`,
      grid: { head: ["", "With a NULL inside"], rows: [
        ["<code>CONCAT(...)</code>", "ignores the NULL: JohnDoe"],
        ["<code>||</code> operator", "the whole result becomes NULL"],
      ] },
      explain: `<p><code>||</code> warns you loudly (the answer vanishes); <code>CONCAT</code> never wipes out your string.
        Know which you want, or wrap the column in <code>COALESCE</code> (3.30).</p>`,
    },
    {
      kind: "lesson", id: "3A.4", title: "Join with a separator, skipping the missing",
      say: "CONCAT_WS: concatenate with separator.",
      sql: `SELECT CONCAT_WS(', ', 'Pune', NULL, 'India')  AS address,
       CONCAT_WS(' - ', INITCAP(name), city)      AS label
FROM employees
LIMIT 3;`,
      explain: `<p><code>CONCAT_WS(separator, ...)</code> puts the separator between the pieces and drops NULLs without leaving a
        dangling separator, which plain CONCAT cannot do. The first argument is always the separator.</p>`,
    },
    {
      kind: "lesson", id: "3.23", title: "Take a slice of a string",
      say: "SUBSTRING(text FROM start FOR length).",
      sql: `SELECT SUBSTRING('EMP2026' FROM 1 FOR 3),
       SUBSTRING('EMP2026' FROM 4 FOR 4),
       SUBSTRING('EMP2026' FROM 4),
       SUBSTR('PostgreSQL', 1, 4);`,
      explain: `<p>SQL strings start at position <b>1</b>, not 0. Leaving out <code>FOR length</code> means "to the end".
        <code>SUBSTR(text, start, length)</code> is the short form.</p>`,
    },
    {
      kind: "lesson", id: "3.24", title: "Remove the stray spaces",
      say: "TRIM both sides, LTRIM the left, RTRIM the right.",
      sql: `SELECT TRIM('   PostgreSQL   ')        AS t,
       LTRIM('   PostgreSQL')           AS l,
       RTRIM('PostgreSQL   ')           AS r,
       TRIM(BOTH 'x' FROM 'xxxDATAxxx') AS b;

SELECT name, LENGTH(name) AS raw_len, LENGTH(TRIM(name)) AS trimmed_len FROM employees;`,
      explain: `<p>By default TRIM removes spaces, but you can trim any character by naming it.
        Ravi's 13 becoming 10 is the proof that three invisible characters were hiding in the data.</p>`,
    },
    {
      kind: "lesson", id: "3A.5", title: "TRIM has a function form: BTRIM",
      say: "The same trim, written as an ordinary function.",
      sql: `SELECT BTRIM('   PostgreSQL   ')      AS spaces,
       BTRIM('xxxDATAxxx', 'x')         AS chars,
       TRIM(BOTH 'x' FROM 'xxxDATAxxx') AS same_thing;`,
      explain: `<p><code>BTRIM(string, characters)</code> = <code>TRIM(BOTH characters FROM string)</code>.</p>`,
    },
    {
      kind: "lesson", id: "3.25", title: "Replace part of a string, mask a phone",
      say: "Swap a word, delete dashes, hide the middle of a phone number.",
      sql: `SELECT REPLACE('PostgreSQL', 'SQL', 'Database'), REPLACE('99-88-77', '-', '');

SELECT name,
       REPLACE(phone, SUBSTRING(phone FROM 4 FOR 3), 'XXX') AS masked_phone
FROM employees
WHERE phone IS NOT NULL;`,
      explain: `<p><code>REPLACE(source, old, new)</code>. Replacing with <code>''</code> deletes those characters.
        The masking query nests two functions: SUBSTRING picks out digits 4 to 6, then REPLACE swaps them for XXX.
        <b>Read nested functions inside-out.</b></p>`,
    },
    {
      kind: "lesson", id: "3.26", title: "LIKE misses 'john'. Use ILIKE.",
      say: "Find names starting with J, in any case.",
      sql: `SELECT name FROM employees WHERE name LIKE  'J%';
SELECT name FROM employees WHERE name ILIKE 'j%';
SELECT 'Jan' LIKE 'J_n' AS jan_matches, 'Joan' LIKE 'J_n' AS joan_matches;`,
      explain: `<p><code>LIKE</code> is case-sensitive; <code>ILIKE</code> is case-insensitive (the I stands for insensitive).
        For search boxes, always use ILIKE. <code>'J_n'</code> needs exactly one character between J and n, so Jan matches
        (<code>t</code> = true) and Joan does not (<code>f</code> = false).</p>`,
    },
    {
      kind: "lesson", id: "3.27", title: "Split an email into user and domain",
      say: "Which email providers do our employees use?",
      sql: `SELECT SPLIT_PART('john@gmail.com', '@', 1), SPLIT_PART('john@gmail.com', '@', 2);

SELECT SPLIT_PART(email, '@', 2) AS domain,
       COUNT(*)                  AS users
FROM employees
GROUP BY SPLIT_PART(email, '@', 2)
ORDER BY users DESC;`,
      explain: `<p><code>SPLIT_PART(string, delimiter, position)</code> cuts the text at every delimiter and hands you the piece you ask for.
        Position 1 is before the first @, position 2 after it.</p>`,
    },
    {
      kind: "lesson", id: "3A.6", title: "The last piece of a delimited string",
      say: "A negative position counts from the right.",
      sql: `SELECT SPLIT_PART('a.b.c', '.', -1)              AS last_piece,
       SPLIT_PART('john@company.co.in', '.', -1) AS tld;`,
      explain: `<p><code>-1</code> is the last piece, so you do not need to know how many dots the string has. (PostgreSQL 14 and later.)</p>`,
    },
    {
      kind: "lesson", id: "3.28", title: "Take from the ends, pad to a width",
      say: "LEFT, RIGHT, LPAD, RPAD, TRANSLATE, REVERSE and REPEAT.",
      sql: `SELECT LEFT('PostgreSQL', 4), RIGHT('PostgreSQL', 3), LEFT('PostgreSQL', -3),
       LPAD('7', 3, '0'), RPAD('7', 3, '0'), LPAD('42', 8, '.');

SELECT TRANSLATE('12-34-56', '-', '/'), TRANSLATE('(999) 123', '() ', ''),
       REVERSE('PostgreSQL'), REPEAT('-', 20);`,
      explain: `<ul class="defs">
          <li><code>LEFT(s, n)</code> / <code>RIGHT(s, n)</code>: the first / last n characters. A negative n in LEFT means "drop the last n".</li>
          <li><code>LPAD(s, len, pad)</code> pads on the left until the string is len long: 7 becomes invoice number 007.</li>
          <li><code>TRANSLATE(s, from, to)</code> maps characters one to one, many at once. REPLACE swaps one whole substring.</li>
          <li><code>REVERSE</code> and <code>REPEAT</code> are mostly for display and separators.</li>
        </ul>`,
    },
    {
      kind: "lesson", id: "3A.7", title: "LPAD also cuts",
      say: "Padding to a width shorter than the string.",
      sql: `SELECT LPAD('7', 3, '0')           AS padded,
       LPAD('PostgreSQL', 4, '.')  AS shortened,
       LPAD(emp_id::TEXT, 5, '0')  AS emp_code
FROM employees
LIMIT 3;`,
      explain: `<p>If the target width is shorter than the string, LPAD cuts it down instead of padding.
        <code>LPAD(id::TEXT, 5, '0')</code> is the standard zero-padded code; note the cast, because LPAD needs text.</p>`,
    },
    {
      kind: "lesson", id: "3A.3", title: "Characters vs bytes",
      say: "LENGTH has two other spellings, and one of them counts bytes.",
      sql: `SELECT LENGTH('PostgreSQL')      AS len,
       CHAR_LENGTH('PostgreSQL') AS char_len,
       LENGTH('naïve')           AS chars,
       OCTET_LENGTH('naïve')     AS bytes;`,
      explain: `<p><code>CHAR_LENGTH</code> is the SQL-standard name for LENGTH: both count characters. <code>OCTET_LENGTH</code>
        counts bytes, and in UTF-8 an accented letter costs more than one byte.</p>`,
    },
    { kind: "intro", id: "u-null", title: "Part 4: NULL, the unknown", section: true, art: "nullbox",
      html: `<p>NULL is not zero, not a blank, not false. It is <b>"I don't know"</b>, and it changes the answer to every question it touches.</p>` },
    {
      kind: "lesson", id: "3.29", title: "What NULL actually does",
      say: "Compare NULL with things, and do arithmetic with it.",
      sql: `SELECT NULL = NULL  AS equals_test,
       NULL = 0     AS zero_test,
       NULL = ''    AS empty_test,
       100 + NULL   AS maths_test,
       'Hi' || NULL AS concat_test;`,
      predict: "Is NULL = NULL true?",
      explain: `<p>Every column came back NULL: not true, not false. "Is one unknown value equal to another unknown value?"
        has no answer, so SQL says <i>unknown</i>. And unknown spreads: <code>100 + NULL</code> is NULL.</p>
        <p>This is why <code>WHERE something = NULL</code> never matches anything.</p>`,
    },
    {
      kind: "lesson", id: "3.30", title: "A fallback value: COALESCE",
      say: "Show 'Not Available' where the phone is missing.",
      sql: `SELECT COALESCE(NULL, 'Not Available'),
       COALESCE(NULL, NULL, 'third', 'fourth'),
       COALESCE(NULL, 0) + 100;

SELECT name, COALESCE(phone, 'Not Available') AS contact FROM employees;`,
      explain: `<p><code>COALESCE(a, b, c, ...)</code> is a backup plan: it returns the first argument that is not NULL.
        <code>COALESCE(NULL, 0) + 100 = 100</code> shows its real value: it protects arithmetic from being poisoned.</p>`,
    },
    {
      kind: "lesson", id: "3.31", title: "Find missing phones: wrong way, right way",
      say: "Who has no phone number?",
      sql: `SELECT * FROM employees WHERE phone = NULL;          -- WRONG
SELECT name, phone FROM employees WHERE phone IS NULL;  -- RIGHT`,
      explain: `<p>The wrong version returns 0 rows and <b>no error</b>, which makes it a dangerous bug.
        Always use <code>IS NULL</code> / <code>IS NOT NULL</code>, never <code>= NULL</code>.</p>`,
    },
    {
      kind: "lesson", id: "3.32", title: "Count how much data is missing",
      say: "A free data-quality check.",
      sql: `SELECT COUNT(*)                AS total_rows,
       COUNT(phone)            AS phones_present,
       COUNT(*) - COUNT(phone) AS phones_missing
FROM employees;`,
      explain: `<p><code>COUNT(*)</code> counts rows; <code>COUNT(column)</code> counts the non-NULL values in that column.
        The difference is how many are missing.</p>`,
    },
    {
      kind: "lesson", id: "3.33", title: "Turn a junk value into NULL: NULLIF",
      say: "The mirror image of COALESCE.",
      sql: `SELECT NULLIF(10, 10), NULLIF(10, 5), 100 / NULLIF(0, 0) AS safe_div, NULLIF('N/A', 'N/A');`,
      explain: `<p><code>NULLIF(a, b)</code>: if a equals b, return NULL; otherwise return a. Its killer use is
        <code>100 / NULLIF(0, 0)</code>: the divisor becomes NULL, so the answer is NULL instead of a crash.</p>`,
    },
    {
      kind: "lesson", id: "3A.10", title: "NULLIF is case-sensitive",
      say: "Junk placeholders arrive in every casing.",
      sql: `SELECT NULLIF('N/A', 'N/A') AS exact_match,
       NULLIF('n/a', 'N/A') AS different_case;`,
      explain: `<p>Only an exact match becomes NULL. Normalise first: <code>NULLIF(UPPER(TRIM(col)), 'N/A')</code>.</p>`,
    },
    {
      kind: "lesson", id: "3.34", title: "Safe division, combining both",
      say: "Average order value when there were no orders.",
      sql: `SELECT COALESCE(total_sales / NULLIF(order_count, 0), 0) AS avg_order_value
FROM (SELECT 5000 AS total_sales, 0 AS order_count) AS demo;`,
      explain: `<p>Read it inside-out:</p>
        <ol class="steps"><li><code>NULLIF(order_count, 0)</code> turns the 0 divisor into NULL,</li>
        <li>so the division returns NULL instead of an error,</li>
        <li>and <code>COALESCE(..., 0)</code> turns that NULL into a presentable 0.</li></ol>
        <p>Memorise this pattern: it is the safe average in every reporting query you will ever write.</p>`,
    },
    {
      kind: "lesson", id: "3.35", title: "Comparisons where NULL should count",
      say: "IS DISTINCT FROM: a not-equals that understands NULL.",
      sql: `SELECT NULL IS DISTINCT FROM NULL AS a,
       NULL IS DISTINCT FROM 5    AS b,
       5    IS DISTINCT FROM 5    AS c,
       NULL <> NULL               AS plain;

SELECT name, phone FROM employees WHERE phone IS DISTINCT FROM '9912345670';

SELECT name, phone FROM employees WHERE phone <> '9912345670';`,
      explain: `<p><code>IS DISTINCT FROM</code> always returns true or false, never unknown: two NULLs count as the same, and NULL vs 5
        counts as different. The two results above are the whole lesson: plain <code>&lt;&gt;</code> quietly dropped John and Jane.</p>`,
    },
    { kind: "intro", id: "u-nest", title: "Part 5: nesting, and the final report", section: true,
      html: `<p>Functions nest freely: the innermost runs first and its result is fed outward.</p>` },
    {
      kind: "lesson", id: "3.36", title: "Chain functions together",
      say: "Trim, then upper-case. Trim, then take the domain, then upper-case.",
      sql: `SELECT UPPER(TRIM(name)) FROM employees;

SELECT UPPER(SPLIT_PART(TRIM(email), '@', 2)) AS domain FROM employees;`,
      explain: `<p><code>UPPER(SPLIT_PART(TRIM(email), '@', 2))</code> = trim, then take the domain, then upper-case it.
        Three layers, one column.</p>`,
      art: "nesting",
    },
    {
      kind: "lesson", id: "3.37", title: "The final clean report",
      say: "All four families in one query.",
      sql: `SELECT
    UPPER(TRIM(name))              AS customer_name,
    ROUND(salary, 2)               AS salary,
    TO_CHAR(join_date, 'Mon YYYY') AS joined,
    COALESCE(phone, 'N/A')         AS phone
FROM employees
ORDER BY join_date DESC;`,
      explain: `<p>Compare this with the raw table at 3.0. Same data, but: casing fixed and spaces removed (string),
        decimals tamed (number), dates made human (date), missing values labelled (NULL). That is the whole chapter in one statement.</p>`,
    },
    {
      kind: "lesson", id: "3.38", title: "Five classic mistakes, side by side", errors: true,
      say: "Wrong, then right.",
      sql: `-- 1. comparing with NULL
SELECT * FROM employees WHERE phone = NULL;     -- WRONG: 0 rows, no error
SELECT * FROM employees WHERE phone IS NULL;    -- RIGHT

-- 2. case-insensitive search
SELECT name FROM employees WHERE name LIKE 'j%';    -- WRONG: misses 'john DOE'
SELECT name FROM employees WHERE name ILIKE 'j%';   -- RIGHT

-- 3. ROUND vs TRUNC
SELECT ROUND(45.678, 2) AS round_result, TRUNC(45.678, 2) AS trunc_result;

-- 4. NULL inside a calculation
SELECT name, salary + NULL AS broken_total FROM employees LIMIT 1;
SELECT ROUND(COALESCE(salary, 0) + COALESCE(NULL, 0), 2) AS safe_total FROM employees LIMIT 1;

-- 5. dividing without a guard
SELECT 100 / 0;
SELECT 100 / NULLIF(0, 0) AS safe_division;`,
      explain: `<p>Mistakes 1 and 4 are the worst kind: they produce no error at all. The query "works", the report ships,
        and the number is wrong. Mistake 5 at least crashes loudly, which is easier to catch.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: the important functions",
      cards: [
        { name: "ROUND", sig: "ROUND(value, places)", does: "Rounds to n decimals (negative n: tens, hundreds...).", sql: `SELECT ROUND(1234.567, 1), ROUND(1234.567, -2);` },
        { name: "TRUNC", sig: "TRUNC(value, places)", does: "Chops decimals off without rounding; moves toward zero.", sql: `SELECT TRUNC(9.99, 1), TRUNC(-9.99);` },
        { name: "FLOOR / CEIL", sig: "FLOOR(x), CEIL(x)", does: "Nearest whole number below / above.", sql: `SELECT FLOOR(4.2), CEIL(4.2), FLOOR(-4.2);` },
        { name: "DIV / MOD", sig: "DIV(a, b), MOD(a, b)", does: "Whole-number quotient and remainder.", sql: `SELECT DIV(17, 5), MOD(17, 5);` },
        { name: "POWER / SQRT / ABS", sig: "POWER(x, y), SQRT(x), ABS(x)", does: "Powers, square roots, distance from zero.", sql: `SELECT POWER(2, 8), SQRT(144), ABS(-7);` },
        { name: "NOW / CURRENT_DATE", sig: "NOW(), CURRENT_DATE", does: "The current timestamp / today's date.", sql: `SELECT CURRENT_DATE - DATE '2026-01-01' AS days_since_new_year;` },
        { name: "EXTRACT", sig: "EXTRACT(field FROM date)", does: "One part of a date, as a number.", sql: `SELECT EXTRACT(YEAR FROM DATE '2025-08-15'), EXTRACT(MONTH FROM DATE '2025-08-15');` },
        { name: "DATE_TRUNC", sig: "DATE_TRUNC('unit', ts)", does: "Snaps a timestamp to the start of its month, year, day...", sql: `SELECT DATE_TRUNC('month', TIMESTAMP '2025-08-15 10:30');` },
        { name: "INTERVAL", sig: "date + INTERVAL '3 days'", does: "Date arithmetic in plain English units.", sql: `SELECT DATE '2025-01-31' + INTERVAL '1 month';` },
        { name: "TO_CHAR", sig: "TO_CHAR(value, 'format')", does: "Formats a date or number as text.", sql: `SELECT TO_CHAR(DATE '2025-08-15', 'DD Mon YYYY'), TO_CHAR(1234567.5, '99G99G999D99');` },
        { name: "UPPER / LOWER / INITCAP", sig: "UPPER(s)", does: "Change case. INITCAP = Title Case.", sql: `SELECT UPPER('pune'), INITCAP('new delhi');` },
        { name: "LENGTH", sig: "LENGTH(s)", does: "Number of characters (spaces count).", sql: `SELECT LENGTH('hello'), LENGTH(' hi ');` },
        { name: "TRIM", sig: "TRIM(s), LTRIM, RTRIM", does: "Removes spaces (or named characters) from the ends.", sql: `SELECT '[' || TRIM('  hi  ') || ']';` },
        { name: "SUBSTRING", sig: "SUBSTRING(s FROM start FOR len)", does: "A slice of text. Positions start at 1.", sql: `SELECT SUBSTRING('ROLL-2026-041' FROM 6 FOR 4);` },
        { name: "REPLACE", sig: "REPLACE(s, old, new)", does: "Swaps every occurrence of one substring.", sql: `SELECT REPLACE('2026/09/29', '/', '-');` },
        { name: "CONCAT / ||", sig: "CONCAT(a, b), a || b", does: "Joins text. CONCAT skips NULL; || turns NULL.", sql: `SELECT CONCAT('Roll ', 41), 'Roll ' || 41;` },
        { name: "SPLIT_PART", sig: "SPLIT_PART(s, delim, n)", does: "The nth piece after splitting on a delimiter.", sql: `SELECT SPLIT_PART('priya@college.edu', '@', 2);` },
        { name: "LPAD / RPAD", sig: "LPAD(s, width, pad)", does: "Pads (or cuts) text to a fixed width.", sql: `SELECT LPAD('42', 6, '0');` },
        { name: "COALESCE", sig: "COALESCE(a, b, ...)", does: "The first value that is not NULL.", sql: `SELECT name, COALESCE(phone, '-') AS phone FROM employees;` },
        { name: "NULLIF", sig: "NULLIF(a, b)", does: "NULL if a = b, else a. Guards against divide-by-zero.", sql: `SELECT 50 / NULLIF(0, 0) AS safe;` },
        { name: "IS NULL", sig: "col IS NULL / IS NOT NULL", does: "The only correct test for a missing value.", sql: `SELECT count(*) FROM employees WHERE phone IS NULL;` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "What does this return?", code: "SELECT 9 / 2;", opts: ["4.5", "4", "5", "An error"], a: 1, check: "SELECT 9 / 2;",
          why: "Integer divided by integer is an integer: the .5 is thrown away. Write 9 / 2.0 for 4.5." },
        { q: "What does this return?", code: "SELECT ROUND(2.675, 2);", opts: ["2.67", "2.68", "2.7", "3"], a: 1, check: "SELECT ROUND(2.675, 2);",
          why: "NUMERIC rounding is exact: the third decimal is 5, so it rounds up to 2.68." },
        { q: "What does this return?", code: "SELECT FLOOR(-3.2);", opts: ["-3", "-4", "3", "-3.2"], a: 1, check: "SELECT FLOOR(-3.2);",
          why: "FLOOR always goes down the number line, and below -3.2 is -4." },
        { q: "What does this return?", code: "SELECT 'Hi ' || NULL;", opts: ["Hi", "Hi NULL", "NULL (an empty cell)", "An error"], a: 2, check: "SELECT CASE WHEN ('Hi ' || NULL) IS NULL THEN 'NULL (an empty cell)' END;",
          why: "|| with any NULL gives NULL. CONCAT('Hi ', NULL) would give 'Hi '." },
        { q: "Which WHERE finds employees with no phone?",
          opts: ["WHERE phone = NULL", "WHERE phone = ''", "WHERE phone IS NULL", "WHERE LENGTH(phone) = 0"], a: 2,
          why: "Only IS NULL works. = NULL is never true, so it silently returns nothing." },
        { q: "What does this return?", code: "SELECT COALESCE(NULL, NULL, 'x', 'y');", opts: ["NULL", "x", "y", "xy"], a: 1, check: "SELECT COALESCE(NULL, NULL, 'x', 'y');",
          why: "COALESCE returns the first argument that is not NULL." },
        { q: "What does this return?", code: "SELECT SUBSTRING('DATABASE' FROM 2 FOR 3);", opts: ["ATA", "DAT", "TAB", "ATAB"], a: 0, check: "SELECT SUBSTRING('DATABASE' FROM 2 FOR 3);",
          why: "Start at position 2 (A), take 3 characters: A, T, A." },
        { q: "You need a monthly sales trend across two years. Which do you group by?",
          opts: ["EXTRACT(MONTH FROM sale_date)", "DATE_TRUNC('month', sale_date)", "TO_CHAR(sale_date, 'Month')", "EXTRACT(DAY FROM sale_date)"], a: 1,
          why: "DATE_TRUNC keeps the year, so September 2025 and September 2026 stay separate. EXTRACT(MONTH) merges them." },
        { q: "What does this return?", code: "SELECT COUNT(*), COUNT(phone) FROM employees;", opts: ["5 and 5", "5 and 3", "3 and 5", "5 and 2"], a: 1,
          check: "SELECT COUNT(*) || ' and ' || COUNT(phone) FROM employees;",
          why: "COUNT(*) counts all 5 rows; COUNT(phone) skips the 2 NULL phones." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "The average of 7 and 8 (the answer should be 7.5).", bad: `SELECT (7 + 8) / 2 AS average;`, silent: true,
          opts: [`SELECT (7 + 8) / 2.0 AS average;`, `SELECT ROUND((7 + 8) / 2, 1) AS average;`, `SELECT (7 + 8) DIV 2 AS average;`, `SELECT CEIL((7 + 8) / 2) AS average;`], a: 0,
          why: `15 / 2 is integer division, so the answer is 7, silently. ROUND and CEIL act <i>after</i> the damage is done. Make one side a decimal.` },
        { task: "Employees whose phone is missing.", bad: `SELECT name FROM employees WHERE phone = NULL;`, silent: true,
          opts: [`SELECT name FROM employees WHERE phone IS NULL;`, `SELECT name FROM employees WHERE phone = 'NULL';`, `SELECT name FROM employees WHERE phone == NULL;`, `SELECT name FROM employees WHERE NOT phone;`], a: 0,
          why: `= NULL is never true, so 0 rows come back with no error. 'NULL' in quotes is the four-letter text N-U-L-L, a different thing.` },
        { task: "Revenue per order, when some days had zero orders.", bad: `SELECT 5000 / 0 AS avg_order;`,
          opts: [`SELECT COALESCE(5000 / NULLIF(0, 0), 0) AS avg_order;`, `SELECT 5000 / COALESCE(0, 1) AS avg_order;`, `SELECT NULLIF(5000 / 0, 0) AS avg_order;`, `SELECT ROUND(5000 / 0, 2) AS avg_order;`], a: 0,
          why: `NULLIF turns the zero divisor into NULL before the division happens, and COALESCE turns the NULL result into 0. Wrapping the division itself is too late: it has already crashed.` },
        { task: "The employee code, zero-padded to 5 digits.", bad: `SELECT LPAD(emp_id, 5, '0') FROM employees;`,
          opts: [`SELECT LPAD(emp_id::TEXT, 5, '0') FROM employees;`, `SELECT LPAD('emp_id', 5, '0') FROM employees;`, `SELECT LPAD(emp_id, '5', '0') FROM employees;`, `SELECT RPAD(emp_id, 5, '0') FROM employees;`], a: 0,
          why: `LPAD works on text, and emp_id is an integer. Cast it with <code>::TEXT</code>. Quoting the name makes it the literal word "emp_id".` },
        { task: "Show each name trimmed and in capitals.", bad: `SELECT UPPER(TRIM(name) FROM employees;`,
          opts: [`SELECT UPPER(TRIM(name)) FROM employees;`, `SELECT UPPER TRIM(name) FROM employees;`, `SELECT UPPER(TRIM name) FROM employees;`, `SELECT (UPPER(TRIM(name) FROM employees);`], a: 0,
          why: `Every opening bracket needs a closing one. Nested functions close from the inside out: <code>UPPER( TRIM( name ) )</code>.` },
        { task: "Show a join date as '29 May 2026'.", bad: `SELECT TO_CHAR(join_date, DD Mon YYYY) FROM employees;`,
          opts: [`SELECT TO_CHAR(join_date, 'DD Mon YYYY') FROM employees;`, `SELECT TO_CHAR('join_date', 'DD Mon YYYY') FROM employees;`, `SELECT TO_CHAR(join_date, "DD Mon YYYY") FROM employees;`, `SELECT TO_DATE(join_date, 'DD Mon YYYY') FROM employees;`], a: 0,
          why: `The format pattern is a piece of text, so it needs single quotes. The column name must not be quoted.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "ROUND looks at the next digit; TRUNC chops. <code>ROUND(45.678,2)</code> = 45.68, <code>TRUNC(45.678,2)</code> = 45.67.",
        "FLOOR and CEIL are about direction: <code>FLOOR(-45.6)</code> = -46.",
        "<code>7/2</code> = 3. Integer divided by integer is an integer. Write <code>7/2.0</code> or cast.",
        "Results like 2.9999... are normal floating-point; wrap them in ROUND().",
        "EXTRACT returns a number; DATE_TRUNC returns a date. For monthly trends use DATE_TRUNC.",
        "<code>NOW() - INTERVAL '12 months'</code> is the correct rolling window. Never hard-code dates for \"recent\" reports.",
        "TO_CHAR turns a date or number into text for display. You cannot do arithmetic on its result.",
        "Text positions start at 1. LIKE is case-sensitive; ILIKE is not.",
        "CONCAT ignores NULL; <code>||</code> returns NULL if any piece is NULL. CONCAT_WS adds a separator and skips NULLs.",
        "NULL is unknown, and unknown spreads through arithmetic, joining text and comparisons.",
        "Never write <code>= NULL</code>. Use IS NULL / IS NOT NULL.",
        "COUNT(*) counts rows; COUNT(col) skips NULLs. The difference = missing values.",
        "COALESCE = first non-NULL (backup plan). NULLIF(a, b) = NULL when a equals b.",
        "The safe-division pattern: <code>COALESCE(x / NULLIF(y, 0), 0)</code>.",
        "Read nested functions inside-out. The most dangerous bugs are silent ones (<code>= NULL</code>, <code>salary + NULL</code>).",
      ],
    },
  ],
};
