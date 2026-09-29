/* Chapter 6 - window functions, part 2 (class file DE 6). */
const TABLE = `DROP TABLE IF EXISTS dinosaur_danger_log;

CREATE TABLE dinosaur_danger_log (
  log_id       INT PRIMARY KEY,
  zone         VARCHAR(20) NOT NULL,   -- Zone A / Zone B / Zone C
  day          INT NOT NULL,           -- 1, 2, 3
  dinosaur     VARCHAR(50) NOT NULL,
  area         VARCHAR(50) NOT NULL,   -- enclosure name
  danger_level INT NOT NULL
);

INSERT INTO dinosaur_danger_log (log_id, zone, day, dinosaur, area, danger_level) VALUES
 (1,'Zone A',1,'Tyrannosaurus Rex','T-Rex Enclosure',180),
 (2,'Zone A',2,'Tyrannosaurus Rex','T-Rex Enclosure',260),
 (3,'Zone A',3,'Tyrannosaurus Rex','T-Rex Enclosure',420),
 (4,'Zone B',1,'Velociraptor','Raptor Paddock',220),
 (5,'Zone B',2,'Velociraptor','Raptor Paddock',310),
 (6,'Zone B',3,'Velociraptor','Raptor Paddock',450),
 (7,'Zone C',1,'Herbivores','Herbivore Valley',40),
 (8,'Zone C',2,'Herbivores','Herbivore Valley',45),
 (9,'Zone C',3,'Herbivores','Herbivore Valley',60);`;

export default {
  id: "ch6",
  num: 6,
  title: "Windows, part 2",
  topic: "Window functions drilled: partitions, change over time, running totals",
  accent: "leaf",
  opener: {
    question: "Is the park getting more dangerous, and where?",
    story: `A dinosaur park logs a danger level for three zones over three days: nine rows, a perfect little
      time series. This chapter drills the window functions from Chapter 5 on data small enough to
      check in your head, and adds the two patterns analysts use every day: the change since yesterday, and
      the running total.`,
    learn: [
      "Compare each reading with its zone's normal level",
      "Pick the partition key from the question's wording",
      "Day-over-day change with LAG",
      "Running totals, and why the default frame makes them work",
      "Emergency buckets with NTILE",
    ],
    uses: "dinosaur_danger_log (3 zones x 3 days)",
  },
  pages: [
    {
      kind: "table", id: "6.0", title: "The table",
      say: "3 zones x 3 days = 9 rows. Danger rises every day in every zone.",
      sql: TABLE,
      show: `SELECT * FROM dinosaur_danger_log;`,
    },
    {
      kind: "lesson", id: "6.1", title: "How dangerous is each zone, on average?",
      say: "The GROUP BY way first.",
      sql: `SELECT zone, AVG(danger_level) AS avg_danger
FROM dinosaur_danger_log
GROUP BY zone
ORDER BY zone;`,
      explain: `<p>Zone B is the most dangerous on average. But 9 rows became 3: the daily readings are gone, so you cannot see which
        day was above its zone's normal level.</p>`,
    },
    {
      kind: "lesson", id: "6.2", title: "Every reading, next to its zone's normal",
      say: "The same averages, as a window.",
      sql: `SELECT zone, day, danger_level,
       AVG(danger_level) OVER (PARTITION BY zone) AS avg_zone_danger
FROM dinosaur_danger_log;`,
      explain: `<p>The same three averages as 6.1, but all 9 rows survive. At a glance: Zone A day 3 (420) is far above its normal 286.7,
        while day 1 (180) is below it. That comparison is impossible with GROUP BY.</p>`,
    },
    {
      kind: "lesson", id: "6.3", title: "In what order did incidents occur?",
      say: "Number the readings inside each zone.",
      sql: `SELECT zone, day, danger_level,
       ROW_NUMBER() OVER (PARTITION BY zone ORDER BY day) AS event_no
FROM dinosaur_danger_log;`,
      explain: `<p>The counter restarts at 1 for every zone because of <code>PARTITION BY zone</code>. Without it you would get 1 to 9 straight through.</p>`,
    },
    {
      kind: "lesson", id: "6.4", title: "Rank the days inside each zone",
      say: "Rank 1 = the worst day in that zone.",
      sql: `SELECT zone, day, danger_level,
       RANK() OVER (PARTITION BY zone ORDER BY danger_level DESC) AS danger_rank
FROM dinosaur_danger_log;`,
      explain: `<p>In all three zones, day 3 is the worst.</p>`,
    },
    {
      kind: "lesson", id: "6.5", title: "The biggest threat each day",
      say: "Now the question is: which zone is the biggest threat on each day?",
      sql: `SELECT zone, day, danger_level,
       RANK() OVER (PARTITION BY day ORDER BY danger_level DESC) AS danger_rank
FROM dinosaur_danger_log
ORDER BY day, danger_rank;`,
      predict: "The question says 'each day'. Which column goes in PARTITION BY?",
      explain: `<p>The partition key must match the words after <b>"each"</b> in the question. "Worst day in each zone": PARTITION BY zone.
        "Worst zone each day": PARTITION BY day. Get it wrong and you produce a plausible-looking, wrong report.</p>
        <p>Answer: Zone B is the biggest threat on all three days.</p>`,
    },
    {
      kind: "lesson", id: "6.6", title: "DENSE_RANK on data without ties",
      say: "Swap RANK for DENSE_RANK.",
      sql: `SELECT zone, day, danger_level,
       DENSE_RANK() OVER (PARTITION BY zone ORDER BY danger_level DESC) AS danger_rank
FROM dinosaur_danger_log;`,
      explain: `<p>Identical to 6.4, because this data has no ties. RANK and DENSE_RANK only differ when values repeat. Keep this table in mind:</p>`,
      grid: { head: ["Marks", "RANK", "DENSE_RANK", "ROW_NUMBER"], rows: [
        ["90", "1", "1", "1"], ["90", "1", "1", "2"], ["88", "3", "2", "3"],
        ["87", "4", "3", "4"], ["87", "4", "3", "5"], ["87", "4", "3", "6"], ["86", "7", "4", "7"],
      ] },
      tip: "Never conclude two functions are the same from data without ties.",
    },
    {
      kind: "lesson", id: "6.7", title: "Did danger rise since yesterday? LAG",
      say: "Today minus yesterday, per zone.",
      sql: `SELECT zone, day, danger_level,
       danger_level - LAG(danger_level) OVER (PARTITION BY zone ORDER BY day) AS danger_change
FROM dinosaur_danger_log;`,
      explain: `<p><code>current - LAG(current)</code> is the <b>period-over-period change</b>, one of the most used patterns in analytics
        (month-over-month growth, week-over-week sales). Day 1 is blank in every zone: there is no previous day, and 180 - NULL is NULL.</p>
        <p>The story in the numbers: Zones A and B are accelerating (+80 then +160; +90 then +140), Zone C is almost flat.</p>`,
    },
    {
      kind: "lesson", id: "6.8", title: "What is coming next? LEAD",
      say: "Tomorrow's danger, beside today's.",
      sql: `SELECT zone, day, danger_level,
       LEAD(danger_level) OVER (PARTITION BY zone ORDER BY day) AS next_day_danger
FROM dinosaur_danger_log;`,
      explain: `<p>LEAD looks forward; the last day of each zone is NULL because nothing follows it. LAG and LEAD are exact mirrors.</p>`,
    },
    {
      kind: "lesson", id: "6.9", title: "The starting level in each zone: FIRST_VALUE",
      say: "Stamp day 1's reading on every row, and measure how much worse it got.",
      sql: `SELECT zone, day, danger_level,
       FIRST_VALUE(danger_level) OVER (PARTITION BY zone ORDER BY day) AS first_danger,
       danger_level - FIRST_VALUE(danger_level) OVER (PARTITION BY zone ORDER BY day) AS rise_since_day1
FROM dinosaur_danger_log;`,
      explain: `<p>The baseline sits on every row, so "how much worse than the start" is a subtraction.</p>`,
    },
    {
      kind: "lesson", id: "6.10", title: "The final level of each zone: LAST_VALUE again",
      say: "Wrong first, then right.",
      sql: `-- WRONG: default frame
SELECT zone, day, danger_level,
       LAST_VALUE(danger_level) OVER (PARTITION BY zone ORDER BY day) AS wrong_final
FROM dinosaur_danger_log;

-- RIGHT: widen the frame to the whole partition
SELECT zone, day, danger_level,
       LAST_VALUE(danger_level) OVER (
           PARTITION BY zone
           ORDER BY day
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS final_danger
FROM dinosaur_danger_log;`,
      explain: `<p>Exactly the trap from 5.14, on simpler data. With ORDER BY present the default frame is "start of partition up to the
        current row", so LAST_VALUE can only ever see up to itself.</p>
        <p class="big">FIRST_VALUE is safe without a frame. LAST_VALUE is not.</p>`,
    },
    {
      kind: "lesson", id: "6.11", title: "Which incidents need evacuation? NTILE",
      say: "Split all nine readings into three emergency levels.",
      sql: `SELECT zone, day, danger_level,
       NTILE(3) OVER (ORDER BY danger_level DESC) AS emergency_level
FROM dinosaur_danger_log;`,
      explain: `<p>No PARTITION BY, so all 9 rows are ranked together and split into 3 buckets of exactly 3. Bucket 1 = evacuate now,
        bucket 3 = safe. All three Zone C readings land in bucket 3: the herbivores are simply not dangerous.</p>`,
    },
    {
      kind: "lesson", id: "6.12", title: "Running total of danger per zone",
      say: "Add up the danger day by day.",
      sql: `SELECT zone, day, danger_level,
       SUM(danger_level) OVER (PARTITION BY zone ORDER BY day) AS running_total
FROM dinosaur_danger_log;`,
      art: "running",
      explain: `<p>Here the default frame is a feature, not a trap. Because <code>ORDER BY day</code> limits the window to "everything up to me",
        SUM accumulates: 180, 440, 860. Remove the ORDER BY and you get the zone's flat total (860) on every row.</p>
        <p class="big">The default frame that breaks LAST_VALUE is exactly what makes running totals work.</p>`,
    },
    {
      kind: "lesson", id: "6.13", title: "A moving average over two days",
      say: "Smooth the series: average today with yesterday.",
      sql: `SELECT zone, day, danger_level,
       ROUND(AVG(danger_level) OVER (
           PARTITION BY zone ORDER BY day
           ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
       ), 1) AS two_day_avg
FROM dinosaur_danger_log;`,
      explain: `<p>A frame does not have to start at the beginning. <code>ROWS BETWEEN 1 PRECEDING AND CURRENT ROW</code> means "me and the
        row before me": a 2-day moving average. On day 1 there is no previous row, so the average is just day 1. Stock charts and
        sales dashboards use exactly this, usually with 7 or 30 rows.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: patterns to reuse",
      cards: [
        { name: "Compare to the group", sig: "col - AVG(col) OVER (PARTITION BY g)", does: "How far each row is from its group's normal.", sql: `SELECT zone, day, danger_level - ROUND(AVG(danger_level) OVER (PARTITION BY zone)) AS vs_normal FROM dinosaur_danger_log;` },
        { name: "Change since last time", sig: "col - LAG(col) OVER (PARTITION BY g ORDER BY t)", does: "Period-over-period change.", sql: `SELECT zone, day, danger_level - LAG(danger_level) OVER (PARTITION BY zone ORDER BY day) AS change FROM dinosaur_danger_log WHERE zone = 'Zone B';` },
        { name: "Growth in percent", sig: "100.0 * (col - LAG(col)) / LAG(col)", does: "Change as a percentage of the previous value.", sql: `SELECT zone, day, ROUND(100.0 * (danger_level - LAG(danger_level) OVER w) / LAG(danger_level) OVER w, 1) AS pct FROM dinosaur_danger_log WINDOW w AS (PARTITION BY zone ORDER BY day);` },
        { name: "Running total", sig: "SUM(col) OVER (PARTITION BY g ORDER BY t)", does: "Adds up as you go.", sql: `SELECT day, danger_level, SUM(danger_level) OVER (ORDER BY day) AS running FROM dinosaur_danger_log WHERE zone = 'Zone C';` },
        { name: "Moving average", sig: "AVG(col) OVER (ORDER BY t ROWS BETWEEN n PRECEDING AND CURRENT ROW)", does: "Smooths a series over the last n+1 rows.", sql: `SELECT day, ROUND(AVG(danger_level) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND CURRENT ROW), 1) AS ma FROM dinosaur_danger_log WHERE zone = 'Zone A';` },
        { name: "Share of the group", sig: "col * 100.0 / SUM(col) OVER (PARTITION BY g)", does: "Each row as a percentage of its group total.", sql: `SELECT zone, day, ROUND(danger_level * 100.0 / SUM(danger_level) OVER (PARTITION BY zone), 1) AS pct_of_zone FROM dinosaur_danger_log WHERE zone = 'Zone A';` },
        { name: "WINDOW clause", sig: "... OVER w ... WINDOW w AS (PARTITION BY g ORDER BY t)", does: "Name a window once and reuse it.", sql: `SELECT zone, day, LAG(danger_level) OVER w AS prev, LEAD(danger_level) OVER w AS next FROM dinosaur_danger_log WINDOW w AS (PARTITION BY zone ORDER BY day);` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "\"Which zone was the most dangerous <b>each day</b>?\" Which PARTITION BY?",
          opts: ["PARTITION BY zone", "PARTITION BY day", "PARTITION BY danger_level", "No PARTITION BY"], a: 1,
          why: "The words after 'each' name the partition: each day, so PARTITION BY day." },
        { q: "What does this return for Zone A, day 3?", code: "SUM(danger_level) OVER (PARTITION BY zone ORDER BY day)",
          opts: ["420", "860", "286.67", "440"], a: 1,
          check: "SELECT s FROM (SELECT zone, day, SUM(danger_level) OVER (PARTITION BY zone ORDER BY day) s FROM dinosaur_danger_log) t WHERE zone = 'Zone A' AND day = 3;",
          why: "A running total: 180 + 260 + 420 = 860." },
        { q: "What does this return for Zone A, day 3?", code: "SUM(danger_level) OVER (PARTITION BY zone)",
          opts: ["420", "860", "180", "1985"], a: 1,
          check: "SELECT s FROM (SELECT zone, day, SUM(danger_level) OVER (PARTITION BY zone) s FROM dinosaur_danger_log) t WHERE zone = 'Zone A' AND day = 3;",
          why: "No ORDER BY means the frame is the whole partition, so every Zone A row shows the full 860." },
        { q: "What is <code>danger_level - LAG(danger_level) OVER (PARTITION BY zone ORDER BY day)</code> on day 1?",
          opts: ["0", "The day-1 value", "NULL", "An error"], a: 2,
          why: "LAG has no previous row on day 1, so it is NULL, and anything minus NULL is NULL." },
        { q: "What does this return for Zone C?", code: "LAST_VALUE(danger_level) OVER (PARTITION BY zone ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)",
          opts: ["40", "45", "60", "It varies by row"], a: 2,
          check: "SELECT DISTINCT v FROM (SELECT zone, LAST_VALUE(danger_level) OVER (PARTITION BY zone ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) v FROM dinosaur_danger_log) t WHERE zone = 'Zone C';",
          why: "With the full frame, LAST_VALUE sees the whole partition: day 3's 60 on every row." },
        { q: "RANK and DENSE_RANK gave identical results on this table. What can you conclude?",
          opts: ["They are the same function", "The data has no ties", "PARTITION BY was missing", "The table is too small"], a: 1,
          why: "They only differ when values repeat." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "A running total of danger per zone.",
          bad: `SELECT zone, day, SUM(danger_level) OVER (PARTITION BY zone) AS running
FROM dinosaur_danger_log;`, silent: true,
          opts: [
            `SELECT zone, day, SUM(danger_level) OVER (PARTITION BY zone ORDER BY day) AS running
FROM dinosaur_danger_log;`,
            `SELECT zone, day, SUM(danger_level) AS running
FROM dinosaur_danger_log GROUP BY zone, day;`,
            `SELECT zone, day, SUM(danger_level) OVER (ORDER BY zone) AS running
FROM dinosaur_danger_log;`,
            `SELECT zone, day, RUNNING_SUM(danger_level) OVER (PARTITION BY zone) AS running
FROM dinosaur_danger_log;`],
          a: 0,
          why: `Without ORDER BY the frame is the whole partition, so every row shows the zone total. ORDER BY day makes the frame grow day by day.` },
        { task: "Day-over-day change per zone.",
          bad: `SELECT zone, day, danger_level - LAG(danger_level) OVER (ORDER BY day) AS change
FROM dinosaur_danger_log;`, silent: true,
          opts: [
            `SELECT zone, day, danger_level - LAG(danger_level) OVER (PARTITION BY zone ORDER BY day) AS change
FROM dinosaur_danger_log;`,
            `SELECT zone, day, danger_level - LEAD(danger_level) OVER (ORDER BY day) AS change
FROM dinosaur_danger_log;`,
            `SELECT zone, day, LAG(danger_level - danger_level) OVER (PARTITION BY zone) AS change
FROM dinosaur_danger_log;`,
            `SELECT zone, day, danger_level - LAG(danger_level) AS change
FROM dinosaur_danger_log;`],
          a: 0,
          why: `Without PARTITION BY zone, the "previous row" can belong to a different zone, so Zone B's reading is subtracted from Zone A's.` },
        { task: "The three most dangerous readings overall.",
          bad: `SELECT zone, day, danger_level, RANK() OVER (ORDER BY danger_level DESC) AS r
FROM dinosaur_danger_log
WHERE r <= 3;`,
          opts: [
            `SELECT * FROM (
  SELECT zone, day, danger_level, RANK() OVER (ORDER BY danger_level DESC) AS r
  FROM dinosaur_danger_log
) ranked
WHERE r <= 3;`,
            `SELECT zone, day, danger_level, RANK() OVER (ORDER BY danger_level DESC) AS r
FROM dinosaur_danger_log
HAVING r <= 3;`,
            `SELECT * FROM (
  SELECT zone, day, danger_level, RANK() OVER (ORDER BY danger_level DESC) AS r
  FROM dinosaur_danger_log
)
WHERE r <= 3 AS ranked;`,
            `SELECT zone, day, danger_level
FROM dinosaur_danger_log
WHERE RANK() <= 3;`],
          a: 0,
          why: `Filter window results in an outer query. A subquery in FROM needs an alias right after its closing bracket.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "GROUP BY answers \"what is the summary?\"; OVER (PARTITION BY ...) answers \"how does this row compare to its summary?\", keeping every row.",
        "The partition key is the word after \"each\": worst day in each zone = PARTITION BY zone.",
        "ROW_NUMBER restarts at 1 in every partition.",
        "RANK, DENSE_RANK and ROW_NUMBER only differ when there are ties.",
        "<code>current - LAG(current)</code> = period-over-period change. The first row of each partition is NULL.",
        "LEAD mirrors LAG; the last row of each partition is NULL.",
        "FIRST_VALUE works with the default frame. LAST_VALUE and NTH_VALUE need ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.",
        "The default frame with ORDER BY is 'start to current row'. It breaks LAST_VALUE and it makes SUM(...) OVER (ORDER BY ...) a running total.",
        "NTILE(n) without PARTITION BY buckets the whole table; with it, each partition separately.",
        "Any aggregate plus OVER () becomes a window function. Same function, very different behaviour.",
      ],
    },
  ],
};
