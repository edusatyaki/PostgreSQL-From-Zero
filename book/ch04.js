/* Chapter 4 - GROUP BY, aggregates, HAVING, CASE (class file DE 4). */
const TABLE = `DROP TABLE IF EXISTS students;

CREATE TABLE students (
  student_id   INT PRIMARY KEY,
  student_name VARCHAR(40) NOT NULL,
  clan         VARCHAR(15) NOT NULL,   -- Maratha | Chola | Vijaya | Rajputana
  sport        VARCHAR(15) NOT NULL,   -- Athletics | Swimming | Chess | Kabaddi
  medal        VARCHAR(10),            -- Gold | Silver | Bronze | NULL = took part, won nothing
  score        INT NOT NULL            -- performance score out of 100
);

INSERT INTO students VALUES
 -- MARATHA (6)
 (101,'Arjun Patil','Maratha','Athletics','Gold',92),
 (102,'Sneha Jadhav','Maratha','Swimming','Silver',78),
 (103,'Rohit Shinde','Maratha','Kabaddi','Gold',88),
 (104,'Meera Bhosale','Maratha','Chess','Bronze',71),
 (105,'Kunal Deshmukh','Maratha','Athletics',NULL,53),
 (106,'Anita More','Maratha','Swimming','Bronze',68),
 -- CHOLA (5): watch this clan, ZERO bronze medals
 (107,'Karthik Raman','Chola','Chess','Gold',95),
 (108,'Divya Subramanian','Chola','Athletics','Gold',90),
 (109,'Vignesh Iyer','Chola','Swimming','Gold',86),
 (110,'Lakshmi Nair','Chola','Chess','Silver',79),
 (111,'Suresh Pillai','Chola','Kabaddi',NULL,55),
 -- VIJAYA (5)
 (112,'Harsha Reddy','Vijaya','Kabaddi','Gold',89),
 (113,'Ananya Rao','Vijaya','Swimming','Bronze',74),
 (114,'Praveen Kumar','Vijaya','Athletics','Silver',80),
 (115,'Sushmita Gowda','Vijaya','Chess','Bronze',66),
 (116,'Manoj Shetty','Vijaya','Kabaddi',NULL,51),
 -- RAJPUTANA (4): watch this clan, ZERO gold, and nobody entered Kabaddi
 (117,'Vikram Rathore','Rajputana','Athletics','Silver',77),
 (118,'Priya Chauhan','Rajputana','Chess','Bronze',64),
 (119,'Devendra Singh','Rajputana','Athletics','Bronze',62),
 (120,'Ishita Solanki','Rajputana','Swimming',NULL,49);`;

const CARD = `SELECT clan, sum(score) AS total_score, max(score) "Maximum score",
       min(score) "Minimum Score", avg(score) "Average Score", count(*) "Member count"
FROM students
WHERE medal IS NOT NULL
GROUP BY clan
HAVING sum(score) > 250`;

export default {
  id: "ch4",
  num: 4,
  title: "Summing up groups",
  topic: "GROUP BY, aggregates, HAVING and CASE",
  accent: "amber",
  opener: {
    question: "Which clan won the sports day?",
    story: `Twenty students from four clans compete in four sports. The results sheet has one row per student, but
      the questions are all about groups: how many medals did each clan win, whose average is highest,
      which sport produced the most golds? GROUP BY folds many rows into one row per group, and aggregate
      functions summarise each fold.`,
    learn: [
      "Why GROUP BY forbids some columns, and the rule that fixes the error",
      "The five aggregates: SUM, MAX, MIN, AVG, COUNT",
      "WHERE vs HAVING: filtering rows vs filtering groups",
      "Keeping zero-count groups with FILTER",
      "Labelling rows with CASE (SQL's if-else)",
    ],
    uses: "students (20 rows: clan, sport, medal, score)",
  },
  pages: [
    {
      kind: "table", id: "4.0", title: "The table",
      say: "20 students, 4 clans, 4 sports. 4 students have medal = NULL: they competed but won nothing. Those NULLs drive most of this chapter.",
      sql: TABLE,
      show: `SELECT * FROM students;`,
    },
    {
      kind: "lesson", id: "4.1", title: "Simple filters before grouping",
      say: "High scorers, and medal winners.",
      sql: `SELECT * FROM students WHERE score >= 80;
SELECT * FROM students WHERE medal IS NOT NULL;`,
      explain: `<p><code>medal IS NOT NULL</code> is the "medal winners only" filter: 20 minus the 4 who won nothing = 16.
        Remember from Chapter 3 that <code>medal &lt;&gt; NULL</code> would return nothing.</p>`,
    },
    {
      kind: "lesson", id: "4.2", title: "Group by clan, and hit an error", errors: true,
      say: "Group the medal winners by clan and show everything.",
      sql: `SELECT * FROM students
WHERE medal IS NOT NULL
GROUP BY clan;`,
      predict: "Will PostgreSQL be able to show one row per clan with every column?",
      art: "buckets",
      explain: `<p><b>The single most important idea in this chapter.</b> After <code>GROUP BY clan</code> the result has one row
        per clan, not one row per student. Individual identity is gone. When you ask for <code>student_id</code>, the database
        genuinely cannot answer: which of the Maratha student_ids should it print?</p>
        <p><b>Rule:</b> every column in the SELECT list must either (1) appear in the GROUP BY, or (2) be wrapped in an
        aggregate function, which collapses many values into one.</p>`,
    },
    {
      kind: "lesson", id: "4.3", title: "Count the medal winners per clan",
      say: "Obey the rule: the group column, plus an aggregate.",
      sql: `SELECT clan, count(*)
FROM students
WHERE medal IS NOT NULL
GROUP BY clan;`,
      explain: `<p>Now it works: <code>clan</code> is in the GROUP BY and <code>count(*)</code> is an aggregate. 16 medal-winning rows
        collapse into 4 clan rows. The order looks random: <b>GROUP BY does not sort</b>. Add ORDER BY if order matters.</p>`,
    },
    {
      kind: "lesson", id: "4.4", title: "A statistics card per clan",
      say: "All five aggregates at once.",
      sql: `SELECT
  clan,
  sum(score) AS total_score,
  max(score) "Maximum score",
  min(score) "Minimum Score",
  avg(score) "Average Score",
  count(*)   "Member count"
FROM students
WHERE medal IS NOT NULL
GROUP BY clan;`,
      grid: { head: ["Function", "Returns"], rows: [
        ["<code>SUM(col)</code>", "the total"], ["<code>MAX(col)</code>", "the largest"], ["<code>MIN(col)</code>", "the smallest"],
        ["<code>AVG(col)</code>", "the mean"], ["<code>COUNT(*)</code> / <code>COUNT(col)</code>", "number of rows / of non-NULL values"],
      ] },
      explain: `<p>Two ways to write an alias: <code>AS total_score</code> needs no quotes for one word; <code>"Maximum score"</code>
        needs double quotes because it has a space and capitals. (<code>AS</code> itself is optional.)</p>
        <p>Chola has the highest average (87.5) but Maratha the highest total (397), because it has more members.
        Different aggregate, different winner: always ask which one the question wants.</p>`,
    },
    {
      kind: "lesson", id: "4.5", title: "Only the clans above 250 in total",
      say: "Filter whole groups, after grouping.",
      sql: CARD + ";",
      art: "wherehaving",
      grid: { head: ["", "Runs", "Filters", "Can use aggregates?"], rows: [
        ["<code>WHERE</code>", "before grouping", "individual rows", "No"],
        ["<code>HAVING</code>", "after grouping", "whole groups", "Yes"],
      ] },
      explain: `<p><code>WHERE medal IS NOT NULL</code> throws away individual non-winners first; then the groups are formed;
        then <code>HAVING sum(score) &gt; 250</code> throws away Rajputana (203) as a whole clan.
        <code>WHERE sum(score) &gt; 250</code> would be an error: at WHERE time, the sums do not exist yet.</p>`,
    },
    {
      kind: "lesson", id: "4.6", title: "Rank the clans, top 2, only the 3rd",
      say: "Sort the groups, then slice them.",
      sql: `-- sorted
${CARD}
ORDER BY total_score DESC;

-- top 2
${CARD}
ORDER BY total_score DESC LIMIT 2;

-- only the 3rd
${CARD}
ORDER BY total_score DESC LIMIT 1 OFFSET 2;`,
      explain: `<p><code>ORDER BY total_score</code> works even though total_score is an alias, because ORDER BY runs after SELECT
        (the execution order from Chapter 2). <code>LIMIT 1 OFFSET 2</code> = skip 2, take 1 = the third row.</p>`,
    },
    {
      kind: "lesson", id: "4.7", title: "Which clan won the most golds?",
      say: "Count golds per clan, most first.",
      sql: `SELECT clan, count(medal) AS gold_count
FROM students
WHERE medal = 'Gold'
GROUP BY clan
ORDER BY gold_count DESC
LIMIT 1;

-- the full list, without LIMIT
SELECT clan, count(medal) AS gold_count
FROM students
WHERE medal = 'Gold'
GROUP BY clan
ORDER BY gold_count DESC;`,
      predict: "Four clans exist. How many rows will the full list have?",
      explain: `<p>Chola wins with 3 golds. But look at the full list: <b>Rajputana does not appear at all</b>.
        <code>WHERE medal = 'Gold'</code> removed every Rajputana row before grouping, so the clan has no group to report.
        A missing group is not the same as a zero. See 4.9 for the fix.</p>`,
    },
    {
      kind: "lesson", id: "4.8", title: "Sports with more than one gold",
      say: "Filter the sport groups by their gold count.",
      sql: `SELECT sport, count(medal) "Gold count"
FROM students
WHERE medal = 'Gold'
GROUP BY sport
HAVING count(medal) > 1;`,
      explain: `<p><code>HAVING count(medal) &gt; 1</code> filters the groups, dropping Chess and Swimming, which had one gold each.</p>`,
    },
    {
      kind: "lesson", id: "4.9", title: "Keep the zero-gold clans: FILTER",
      say: "Count golds and no-medals per clan, and do not lose anyone.",
      sql: `SELECT clan,
       count(*) FILTER (WHERE medal = 'Gold') AS golds,
       count(*) FILTER (WHERE medal IS NULL)  AS no_medal
FROM students
GROUP BY clan
ORDER BY clan;`,
      explain: `<p>This is the fix for 4.7. With no WHERE clause, all 20 rows reach the grouping stage, so all 4 clans get a group.
        <code>FILTER</code> applies the "only gold" condition <i>inside</i> the aggregate. Rajputana correctly shows 0, and you can
        count two different things in the same row.</p>`,
    },
    {
      kind: "lesson", id: "4.10", title: "How NULLs behave inside aggregates",
      say: "Count all rows, count medals, average the scores.",
      sql: `SELECT count(*)     AS all_rows,
       count(medal) AS medal_rows,
       avg(score)   AS avg_all
FROM students;`,
      explain: `<p><code>count(*)</code> = 20 rows. <code>count(medal)</code> = 16, because aggregates skip NULLs.
        SUM and AVG skip NULLs too: AVG divides by the number of non-NULL values, not by the row count.
        If NULL should count as zero, write <code>AVG(COALESCE(col, 0))</code>.</p>`,
    },
    {
      kind: "lesson", id: "4.11", title: "A performance title for everyone: CASE",
      say: "Elite, Strong or Good, by score.",
      sql: `SELECT
  student_name, clan, score,
  CASE
    WHEN score >= 85 THEN 'Elite'
    WHEN score >= 70 THEN 'Strong'
    ELSE 'Good'
  END AS PerformanceTitle
FROM students
ORDER BY score DESC;`,
      explain: `<p><code>CASE</code> is SQL's if-else. It is checked top to bottom and <b>stops at the first match</b>, so write the
        conditions strictest first. If <code>WHEN score &gt;= 70</code> came first, 95 would satisfy it and everyone above 70
        would be 'Strong'. <code>ELSE</code> catches the rest; without an ELSE, unmatched rows get NULL.</p>
        <p>The heading prints as <code>performancetitle</code>: unquoted names are folded to lower case.</p>`,
    },
    {
      kind: "lesson", id: "4.12", title: "CASE inside an aggregate",
      say: "How many Elite, Strong and Good performers does each clan have?",
      sql: `SELECT clan,
       count(*) FILTER (WHERE score >= 85)              AS elite,
       sum(CASE WHEN score BETWEEN 70 AND 84 THEN 1 ELSE 0 END) AS strong,
       sum(CASE WHEN score < 70 THEN 1 ELSE 0 END)      AS good
FROM students
GROUP BY clan
ORDER BY elite DESC, clan;`,
      explain: `<p>Two ways to count conditionally in one row per group: <code>count(*) FILTER (WHERE ...)</code>, or the older, portable
        <code>sum(CASE WHEN ... THEN 1 ELSE 0 END)</code>, which adds a 1 for every row that matches. Both keep every clan.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: aggregates and friends",
      cards: [
        { name: "COUNT", sig: "COUNT(*) / COUNT(col)", does: "Rows in the group / non-NULL values in the group.", sql: `SELECT sport, count(*) AS entries, count(medal) AS medals FROM students GROUP BY sport ORDER BY sport;` },
        { name: "SUM", sig: "SUM(col)", does: "Adds the values; skips NULLs; NULL if there are none.", sql: `SELECT clan, sum(score) FROM students GROUP BY clan ORDER BY 2 DESC;` },
        { name: "AVG", sig: "AVG(col)", does: "Mean of the non-NULL values. Wrap in ROUND for display.", sql: `SELECT sport, round(avg(score), 1) AS avg_score FROM students GROUP BY sport ORDER BY avg_score DESC;` },
        { name: "MAX / MIN", sig: "MAX(col), MIN(col)", does: "Largest / smallest value (works on text and dates too).", sql: `SELECT max(score), min(score), max(student_name) FROM students;` },
        { name: "GROUP BY", sig: "GROUP BY col1, col2", does: "One output row per distinct combination.", sql: `SELECT clan, sport, count(*) FROM students GROUP BY clan, sport HAVING count(*) > 1;` },
        { name: "HAVING", sig: "HAVING aggregate_condition", does: "Filters groups after grouping. Aggregates allowed.", sql: `SELECT clan, avg(score) FROM students GROUP BY clan HAVING avg(score) > 70;` },
        { name: "FILTER", sig: "agg(...) FILTER (WHERE cond)", does: "Aggregates only the rows that pass, without dropping groups.", sql: `SELECT clan, count(*) FILTER (WHERE medal = 'Silver') AS silvers FROM students GROUP BY clan ORDER BY clan;` },
        { name: "CASE", sig: "CASE WHEN c THEN v ... ELSE v END", does: "If-else. First true branch wins.", sql: `SELECT student_name, CASE WHEN medal IS NULL THEN 'participant' ELSE 'medallist' END AS status FROM students LIMIT 5;` },
        { name: "STRING_AGG", sig: "STRING_AGG(col, ', ')", does: "Joins a group's text values into one string.", sql: `SELECT clan, string_agg(student_name, ', ' ORDER BY student_name) AS golds FROM students WHERE medal = 'Gold' GROUP BY clan;` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "Why does <code>SELECT student_name, clan, count(*) FROM students GROUP BY clan;</code> fail?",
          opts: ["count(*) needs a column", "student_name is neither grouped nor aggregated", "GROUP BY must come before FROM", "clan must be in quotes"], a: 1,
          why: "After grouping there is one row per clan, so there is no single student_name to show. Group by it or aggregate it." },
        { q: "You want clans whose <b>average</b> score is above 75. Where does the condition go?",
          opts: ["WHERE avg(score) > 75", "HAVING avg(score) > 75", "GROUP BY avg(score) > 75", "ORDER BY avg(score) > 75"], a: 1,
          why: "An aggregate condition filters groups, so it belongs in HAVING. WHERE runs before the averages exist." },
        { q: "What does this return?", code: "SELECT count(medal) FROM students;", opts: ["20", "16", "4", "An error"], a: 1, check: "SELECT count(medal) FROM students;",
          why: "count(col) skips NULLs, and 4 students have no medal." },
        { q: "What does this return?", code: "SELECT count(*) FROM students WHERE medal = 'Gold' AND clan = 'Rajputana';", opts: ["0", "1", "NULL", "No row at all"], a: 0,
          check: "SELECT count(*) FROM students WHERE medal = 'Gold' AND clan = 'Rajputana';",
          why: "Without GROUP BY, count always returns one row. With no matching rows, that row says 0." },
        { q: "A CASE has <code>WHEN score &gt;= 70 THEN 'Strong' WHEN score &gt;= 85 THEN 'Elite'</code>. What does a score of 95 get?",
          opts: ["Elite", "Strong", "Both", "NULL"], a: 1,
          check: "SELECT CASE WHEN 95 >= 70 THEN 'Strong' WHEN 95 >= 85 THEN 'Elite' END;",
          why: "CASE stops at the first true branch. Put the strictest condition first." },
        { q: "Does GROUP BY sort the result?",
          opts: ["Yes, always ascending", "Yes, by the first column", "No: add ORDER BY if order matters", "Only for text columns"], a: 2,
          why: "Output order after GROUP BY is not guaranteed. Only ORDER BY guarantees order." },
        { q: "What does this return?", code: "SELECT max(score) - min(score) FROM students;", opts: ["46", "95", "49", "44"], a: 0,
          check: "SELECT max(score) - min(score) FROM students;", why: "95 - 49 = 46." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Clans with more than 4 medal winners.",
          bad: `SELECT clan, count(*) FROM students WHERE medal IS NOT NULL AND count(*) > 4 GROUP BY clan;`,
          opts: [`SELECT clan, count(*) FROM students WHERE medal IS NOT NULL GROUP BY clan HAVING count(*) > 4;`, `SELECT clan, count(*) FROM students GROUP BY clan WHERE count(*) > 4;`, `SELECT clan, count(*) FROM students HAVING count(*) > 4;`, `SELECT clan, count(*) > 4 FROM students GROUP BY clan;`], a: 0,
          why: `Aggregates are not allowed in WHERE: the counts do not exist yet. Row filters go in WHERE, group filters in HAVING, after GROUP BY.` },
        { task: "Each clan with its best student's name.",
          bad: `SELECT clan, student_name, max(score) FROM students GROUP BY clan;`,
          opts: [
            `SELECT clan, max(score) AS best_score FROM students GROUP BY clan;`,
            `SELECT clan, student_name, max(score) FROM students GROUP BY clan, student_name;`,
            `SELECT clan, student_name, max(score) FROM students GROUP BY student_name;`,
            `SELECT clan, ANY(student_name), max(score) FROM students GROUP BY clan;`],
          a: 0,
          why: `student_name is not grouped or aggregated. Grouping by it too "works" but gives one row per student, which is no longer a clan summary. The best score per clan is easy; the <i>name</i> of the best student needs a window function (Chapter 5).` },
        { task: "The number of golds for each clan, including clans with none.",
          bad: `SELECT clan, count(*) AS golds FROM students WHERE medal = 'Gold' GROUP BY clan;`, silent: true,
          opts: [`SELECT clan, count(*) FILTER (WHERE medal = 'Gold') AS golds FROM students GROUP BY clan;`, `SELECT clan, count(*) AS golds FROM students WHERE medal = 'Gold' OR medal IS NULL GROUP BY clan;`, `SELECT clan, count(medal = 'Gold') AS golds FROM students GROUP BY clan;`, `SELECT clan, COALESCE(count(*), 0) AS golds FROM students WHERE medal = 'Gold' GROUP BY clan;`], a: 0,
          why: `The WHERE removes every Rajputana row, so the clan vanishes instead of showing 0. FILTER counts golds without removing rows. (count(medal = 'Gold') counts every non-NULL true <i>or false</i>, so it is wrong too.)` },
        { task: "Label each student: 90+ is 'Star', 75+ is 'Good', the rest 'Keep going'.",
          bad: `SELECT student_name,
  CASE WHEN score >= 75 THEN 'Good'
       WHEN score >= 90 THEN 'Star'
       ELSE 'Keep going' END AS label
FROM students;`, silent: true,
          opts: [
            `SELECT student_name,
  CASE WHEN score >= 90 THEN 'Star'
       WHEN score >= 75 THEN 'Good'
       ELSE 'Keep going' END AS label
FROM students;`,
            `SELECT student_name,
  CASE WHEN score >= 75 THEN 'Good'
       WHEN score >= 90 THEN 'Star'
       END AS label
FROM students;`,
            `SELECT student_name,
  IF score >= 90 THEN 'Star'
  ELSIF score >= 75 THEN 'Good'
  ELSE 'Keep going' END AS label
FROM students;`,
            `SELECT student_name,
  CASE WHEN score >= 75 AND score >= 90 THEN 'Star'
       ELSE 'Keep going' END AS label
FROM students;`],
          a: 0,
          why: `No error, but nobody is ever a 'Star': 95 matches <code>&gt;= 75</code> first and CASE stops there. Put the strictest condition first.` },
        { task: "Average score per sport, highest first.",
          bad: `SELECT sport, avg(score) AS avg_score FROM students ORDER BY avg_score DESC;`,
          opts: [`SELECT sport, avg(score) AS avg_score FROM students GROUP BY sport ORDER BY avg_score DESC;`, `SELECT sport, avg(score) AS avg_score FROM students GROUP BY avg_score ORDER BY avg_score DESC;`, `SELECT DISTINCT sport, avg(score) AS avg_score FROM students ORDER BY avg_score DESC;`, `SELECT sport, avg(score) AS avg_score FROM students ORDER BY sport, avg_score DESC;`], a: 0,
          why: `Mixing a plain column (sport) with an aggregate (avg) needs a GROUP BY on the plain column. DISTINCT does not group.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "After GROUP BY, individual rows are gone. Every selected column must be grouped or aggregated.",
        "The five aggregates: SUM, MAX, MIN, AVG, COUNT.",
        "WHERE filters rows before grouping; HAVING filters groups after. Aggregates belong in HAVING, never WHERE.",
        "Execution order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. So ORDER BY can use a SELECT alias.",
        "Aliases: <code>AS one_word</code> needs no quotes; <code>\"Two Words\"</code> needs double quotes.",
        "GROUP BY does not sort. Add ORDER BY.",
        "count(*) counts rows; count(col), SUM and AVG skip NULLs. AVG divides by the non-NULL count.",
        "A WHERE can make whole groups disappear. Use <code>COUNT(*) FILTER (WHERE ...)</code> (or a LEFT JOIN, Chapter 8) to keep the zeros.",
        "CASE WHEN ... THEN ... ELSE ... END is if-else. Strictest condition first.",
        "Highest total and highest average can be different groups. Read the question.",
      ],
    },
  ],
};
