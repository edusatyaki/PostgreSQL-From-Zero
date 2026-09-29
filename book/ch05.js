/* Chapter 5 - window functions, part 1 (class file DE 5). */
const TABLE = `DROP TABLE IF EXISTS snitch_sales;

CREATE TABLE snitch_sales (
  order_id      VARCHAR(10) PRIMARY KEY,
  order_date    DATE        NOT NULL,
  customer_id   VARCHAR(5)  NOT NULL,
  customer_name VARCHAR(50) NOT NULL,
  email         VARCHAR(60) NOT NULL,
  city          VARCHAR(30) NOT NULL,
  category      VARCHAR(20) NOT NULL,
  product_name  VARCHAR(60) NOT NULL,
  quantity      INT         NOT NULL,
  unit_price    INT         NOT NULL,
  order_amount  INT         NOT NULL
);

INSERT INTO snitch_sales VALUES
 ('S1001','2025-01-02','C01','Aarav Mehta', 'aarav@snitch.co', 'Mumbai',   'Shirts',    'Oxford Cotton Shirt',    2,1299,2598),
 ('S1002','2025-01-02','C02','Rohan Kapoor','rohan@snitch.co', 'Delhi',    'T-Shirts',  'Oversized Graphic Tee',  3, 799,2397),
 ('S1003','2025-01-03','C03','Kabir Nair',  'kabir@snitch.co', 'Bengaluru','Jeans',     'Slim Fit Blue Jeans',    1,1999,1999),
 ('S1004','2025-01-04','C01','Aarav Mehta', 'aarav@snitch.co', 'Mumbai',   'Perfume',   'Noir Eau de Parfum',     1,1499,1499),
 ('S1005','2025-01-05','C04','Ishaan Verma','ishaan@snitch.co','Pune',     'Cargos',    'Utility Cargo Pants',    2,1799,3598),
 ('S1006','2025-01-06','C02','Rohan Kapoor','rohan@snitch.co', 'Delhi',    'Shoes',     'Chunky Sneakers',        1,2999,2999),
 ('S1007','2025-01-07','C05','Vihaan Rao',  'vihaan@snitch.co','Hyderabad','Polos',     'Pique Polo Tee',         2, 999,1998),
 ('S1008','2025-01-08','C03','Kabir Nair',  'kabir@snitch.co', 'Bengaluru','Winterwear','Puffer Jacket',          1,3499,3499),
 ('S1009','2025-01-09','C06','Arjun Sethi', 'arjun@snitch.co', 'Kolkata',  'Sunglasses','Retro Wayfarer',         1,1299,1299),
 ('S1010','2025-01-10','C01','Aarav Mehta', 'aarav@snitch.co', 'Mumbai',   'Trousers',  'Tailored Chino Trouser', 2,1699,3398),
 ('S1011','2025-01-11','C04','Ishaan Verma','ishaan@snitch.co','Pune',     'Shirts',    'Linen Resort Shirt',     1,1599,1599),
 ('S1012','2025-01-12','C05','Vihaan Rao',  'vihaan@snitch.co','Hyderabad','Plus Size', 'Plus Size Cotton Shirt', 2,1499,2998),
 ('S1013','2025-01-13','C02','Rohan Kapoor','rohan@snitch.co', 'Delhi',    'Jeans',     'Distressed Black Jeans', 1,2199,2199),
 ('S1014','2025-01-14','C06','Arjun Sethi', 'arjun@snitch.co', 'Kolkata',  'T-Shirts',  'Solid Crew Neck Tee',    4, 699,2796),
 ('S1015','2025-01-15','C03','Kabir Nair',  'kabir@snitch.co', 'Bengaluru','Perfume',   'Amber Oud Perfume',      2,1499,2998),
 ('S1016','2025-01-16','C01','Aarav Mehta', 'aarav@snitch.co', 'Mumbai',   'Shoes',     'Suede Derby Shoes',      1,3499,3499),
 ('S1017','2025-01-17','C07','Kabir Nair',  'kabir@snitch.co', 'Bengaluru','Winterwear','Wool Blend Overcoat',    1,4499,4499),
 ('S1018','2025-01-18','C04','Ishaan Verma','ishaan@snitch.co','Pune',     'Sunglasses','Matte Black Aviators',   1,1299,1299),
 ('S1019','2025-01-19','C05','Vihaan Rao',  'vihaan@snitch.co','Hyderabad','Cargos',    'Ripstop Cargo Joggers',  2,1699,3398),
 ('S1020','2025-01-20','C06','Arjun Sethi', 'arjun@snitch.co', 'Kolkata',  'Polos',     'Striped Polo Tee',       3, 999,2997);`;

export default {
  id: "ch5",
  num: 5,
  title: "Windows, part 1",
  topic: "Window functions: OVER, PARTITION BY, ranking, LAG/LEAD, FIRST/LAST_VALUE",
  accent: "flame",
  opener: {
    question: "How does each order compare with its customer's normal?",
    story: `An online clothing store has 20 orders from 7 customers. GROUP BY can tell you each customer's average,
      but it throws the individual orders away to do it. Window functions do the same maths and keep every
      row, so you can put each order right next to its customer's total, rank, previous order or first
      purchase.`,
    learn: [
      "Why GROUP BY collapses rows and OVER () keeps them",
      "PARTITION BY: restart the calculation for each group",
      "ROW_NUMBER, RANK, DENSE_RANK and how they treat ties",
      "LAG and LEAD: the previous and next row",
      "PERCENT_RANK, CUME_DIST, NTILE, FIRST_VALUE, and the LAST_VALUE trap",
    ],
    uses: "snitch_sales (20 orders, 7 customer ids, 6 cities)",
  },
  pages: [
    {
      kind: "table", id: "5.0", title: "The table",
      say: "20 orders, 7 customer ids, 6 cities. Total sales 53,566; the average order is 2,678.30.",
      sql: TABLE,
      show: `SELECT order_id, order_date, customer_id, customer_name, city, category, order_amount FROM snitch_sales;`,
      note: "A data quirk worth noticing: Kabir Nair appears under two customer ids, C03 and C07. Grouping by id and grouping by name give different answers. Real data does this all the time.",
    },
    {
      kind: "lesson", id: "5.1", title: "Average per customer, the GROUP BY way",
      say: "What does each customer spend per order, on average?",
      sql: `SELECT customer_id, avg(order_amount)
FROM snitch_sales
GROUP BY customer_id
ORDER BY customer_id;`,
      explain: `<p>Correct, but 20 rows became 7. The individual orders are gone: you can no longer see which order was above
        or below its customer's average. That loss is exactly the problem window functions solve.</p>`,
    },
    {
      kind: "lesson", id: "5.2", title: "Every order, next to the overall average",
      say: "Add OVER () to the aggregate.",
      sql: `SELECT order_id, customer_name, order_amount,
       avg(order_amount) OVER () AS overall_avg_order
FROM snitch_sales;`,
      art: "collapsekeep",
      explain: `<p>All 20 rows survive. <code>OVER ()</code> turns an ordinary aggregate into a <b>window function</b>: it computes across a
        set of rows but attaches the answer to <i>every</i> row instead of collapsing them. An empty <code>OVER ()</code> means the
        window is the whole result, so every row shows the same 2678.30.</p>
        <p class="big">GROUP BY = collapse. OVER () = calculate and keep.</p>`,
    },
    {
      kind: "lesson", id: "5.3", title: "Total per customer without losing rows",
      say: "First with an empty window, then with PARTITION BY.",
      sql: `-- an EMPTY window: the grand total on every row
SELECT order_id, customer_name, order_amount,
       sum(order_amount) OVER () AS customer_total_order
FROM snitch_sales
LIMIT 3;

-- PARTITION BY: one total per customer, on each of their rows
SELECT order_id, customer_name, order_amount,
       sum(order_amount) OVER (PARTITION BY customer_name) AS customer_total_order
FROM snitch_sales
ORDER BY customer_name, order_id;`,
      explain: `<p><code>PARTITION BY customer_name</code> breaks the 20 rows into separate mini-tables, one per customer, and restarts
        the calculation in each. Aarav: 2598 + 1499 + 3398 + 3499 = 10,994, repeated on all four of his rows.</p>
        <p><b>PARTITION BY is the window version of GROUP BY, except the rows are kept.</b></p>`,
      note: "Kabir Nair shows 12,995 here (4 orders, partitioned by name), but his id C03 alone only totals 8,496. Choose your partition key deliberately.",
      art: "partitions",
    },
    {
      kind: "lesson", id: "5.4", title: "Number each customer's purchases: ROW_NUMBER",
      say: "Which purchase was each customer's 1st, 2nd, 3rd?",
      sql: `SELECT customer_id, customer_name, order_id, order_date,
       row_number() OVER (PARTITION BY customer_id ORDER BY order_date) AS PurchaseNo
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      explain: `<p>The OVER clause now has two parts: <code>PARTITION BY customer_id</code> restarts the counter for each customer, and
        <code>ORDER BY order_date</code> decides, inside each partition, which row is 1st, 2nd...</p>
        <p><code>ROW_NUMBER()</code> always gives 1, 2, 3... with no gaps and no ties.</p>`,
    },
    {
      kind: "lesson", id: "5.5", title: "Keep only each customer's 2nd purchase", errors: true,
      say: "Filter on the purchase number. Does this work?",
      sql: `SELECT customer_id, customer_name, order_id, order_date,
       row_number() OVER (PARTITION BY customer_id ORDER BY order_date) AS PurchaseNo
FROM snitch_sales
WHERE PurchaseNo = 2;`,
      predict: "Look at the WHERE. Remember Chapter 2's execution order.",
      explain: `<p>Execution order strikes again. Window functions are calculated at SELECT time, which is <b>after WHERE</b>. When
        WHERE runs, <code>PurchaseNo</code> does not exist yet. The fix is on the next page.</p>`,
    },
    {
      kind: "lesson", id: "5.6", title: "The fix: window inside, filter outside",
      say: "Let the inner query finish the numbering; filter in the outer query.",
      sql: `SELECT * FROM (
  SELECT customer_id, customer_name, order_id, order_date,
         row_number() OVER (PARTITION BY customer_id ORDER BY order_date) AS PurchaseNo
  FROM snitch_sales
) t
WHERE PurchaseNo = 2
ORDER BY customer_id;`,
      explain: `<p>The inner query (a <b>subquery</b>, called <code>t</code>) computes the numbers; the outer query can filter on them.
        C07 is absent because that customer has only one order. This "window inside, filter outside" pattern is how you get the
        <b>top-N per group</b>. You will use it constantly.</p>`,
    },
    {
      kind: "lesson", id: "5.7", title: "Rank the orders within each city: RANK",
      say: "Biggest order in each city is rank 1.",
      sql: `SELECT city, order_id, order_amount,
       rank() OVER (PARTITION BY city ORDER BY order_amount DESC) AS City_Rank
FROM snitch_sales
ORDER BY city, City_Rank;`,
      explain: `<p>The rank restarts at 1 in every city. <code>ORDER BY order_amount DESC</code> <i>inside</i> OVER decides rank 1 = biggest.
        The outer <code>ORDER BY city, City_Rank</code> only controls how the finished result is displayed.</p>`,
    },
    {
      kind: "lesson", id: "5.8", title: "RANK vs DENSE_RANK vs ROW_NUMBER",
      say: "All three, on the same data, with ties.",
      sql: `SELECT order_id, order_amount,
       row_number() OVER (ORDER BY order_amount DESC) rn,
       rank()       OVER (ORDER BY order_amount DESC) rnk,
       dense_rank() OVER (ORDER BY order_amount DESC) dns
FROM snitch_sales
ORDER BY order_amount DESC
LIMIT 10;`,
      predict: "Two orders are 3499. What rank does the order after them get from RANK, and from DENSE_RANK?",
      grid: { head: ["", "Ties get...", "After a tie..."], rows: [
        ["<code>ROW_NUMBER()</code>", "different numbers (arbitrary)", "always +1"],
        ["<code>RANK()</code>", "the same number", "skips: previous + number of tied rows"],
        ["<code>DENSE_RANK()</code>", "the same number", "no gap: previous + 1"],
      ] },
      explain: `<p>The two 3499s: RANK gives both 3, then jumps to 5. DENSE_RANK gives both 3, then continues at 4.
        ROW_NUMBER gives 3 and 4.</p>
        <p>Which to use: competition standings, <b>RANK</b>; "top 3 distinct price bands", <b>DENSE_RANK</b>; "exactly one row per group", <b>ROW_NUMBER</b>.</p>`,
      art: "ranks",
    },
    {
      kind: "lesson", id: "5.9", title: "Compare with the previous order: LAG",
      say: "Put each customer's previous order amount beside the current one.",
      sql: `SELECT customer_id, customer_name, order_date, order_amount,
       lag(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS Last_Order
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      explain: `<p><code>LAG()</code> = yesterday. It reaches back to the previous row in the same partition. The first row of every
        partition has no previous row, so LAG returns NULL. Subtract the two columns and you get the change (Chapter 6).</p>`,
      art: "laglead",
    },
    {
      kind: "lesson", id: "5.10", title: "Look ahead to the next order: LEAD",
      say: "The mirror image of LAG.",
      sql: `SELECT customer_id, customer_name, order_date, order_amount,
       lead(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS Next_Order
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      explain: `<p><code>LEAD()</code> = tomorrow. It reads the next row; the last row of each partition gets NULL because nothing follows.
        A NULL in the LEAD column is a churn signal: that customer has not come back yet.</p>`,
    },
    {
      kind: "lesson", id: "5.11", title: "Where does each order sit? PERCENT_RANK and CUME_DIST",
      say: "Place every order on a 0-to-1 scale.",
      sql: `SELECT order_id, order_amount,
       round(percent_rank() OVER (ORDER BY order_amount)::numeric, 3) AS pct_rank,
       round(cume_dist()    OVER (ORDER BY order_amount)::numeric, 3) AS cume
FROM snitch_sales
ORDER BY order_amount
LIMIT 10;`,
      explain: `<ul class="defs"><li><code>PERCENT_RANK()</code> = (rank - 1) / (total rows - 1), from 0 to 1. The smallest row is always 0.</li>
        <li><code>CUME_DIST()</code> = the fraction of rows at or below this one. The two 1299 orders are 2 of 20 = 0.100.</li></ul>
        <p><code>::numeric</code> is a cast: these functions return <code>double precision</code>, which <code>ROUND(x, 3)</code> does not accept.</p>`,
    },
    {
      kind: "lesson", id: "5.12", title: "Split customers into spend tiers: NTILE",
      say: "Gold, Silver and Bronze customers.",
      sql: `SELECT customer_id, sum(order_amount) AS spend,
       ntile(3) OVER (ORDER BY sum(order_amount) DESC) AS tier
FROM snitch_sales
GROUP BY customer_id
ORDER BY spend DESC;`,
      explain: `<p><code>NTILE(n)</code> cuts the ordered rows into n buckets of as-equal-as-possible size. 7 rows in 3 buckets = 3 + 2 + 2;
        the earlier buckets take the extra rows. You can put an aggregate inside the window's ORDER BY: grouping happens first,
        then the window runs on the grouped result.</p>`,
    },
    {
      kind: "lesson", id: "5.13", title: "Which category brought each customer in? FIRST_VALUE",
      say: "Stamp each customer's first category on every one of their rows.",
      sql: `SELECT customer_id, order_date, category,
       first_value(category) OVER (PARTITION BY customer_id ORDER BY order_date) AS acquired_by
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      explain: `<p><code>FIRST_VALUE(col)</code> returns the value from the first row of the window, on every row of the partition.
        A genuine business question: which product category acquired this customer?</p>`,
    },
    {
      kind: "lesson", id: "5.14", title: "The LAST_VALUE trap",
      say: "The obvious way to get each customer's latest order amount.",
      sql: `SELECT customer_id, order_date, order_amount,
       last_value(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS trap
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      predict: "Aarav's latest order is 3499. Will every one of his rows show 3499?",
      explain: `<p><code>trap</code> is just a copy of <code>order_amount</code>. Not the last value at all. Why? The next page explains the
        <b>frame</b>.</p>`,
    },
    {
      kind: "lesson", id: "5.15", title: "The frame that fixes it",
      say: "State the frame explicitly.",
      sql: `SELECT customer_id, order_date, order_amount,
       last_value(order_amount) OVER (
           PARTITION BY customer_id
           ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS latest_spend
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      art: "frame",
      explain: `<p>The moment you write ORDER BY inside OVER, PostgreSQL silently applies a default <b>frame</b>:
        <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>, meaning "everything up to and including me". So FIRST_VALUE works
        (the first row is always inside), but LAST_VALUE returns the current row, the last one it can see so far.</p>
        <p><code>ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING</code> widens the frame to the whole partition.</p>`,
      tip: "Whenever you use LAST_VALUE or NTH_VALUE, write the frame out explicitly.",
    },
    {
      kind: "lesson", id: "5.16", title: "What did they buy on the second visit? NTH_VALUE",
      say: "The 2nd row's product, on every row.",
      sql: `SELECT customer_id, order_date, product_name,
       nth_value(product_name, 2) OVER (
           PARTITION BY customer_id ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS second_visit_item
FROM snitch_sales
ORDER BY customer_id, order_date;`,
      explain: `<p><code>NTH_VALUE(col, n)</code> picks the value from the nth row of the frame. C07 shows NULL: that customer has only one
        order, so there is no 2nd row. The same frame rule as LAST_VALUE applies.</p>`,
    },
    {
      kind: "tools", title: "Toolbox: window functions",
      cards: [
        { name: "agg() OVER ()", sig: "SUM(col) OVER (PARTITION BY g)", does: "Any aggregate, attached to every row instead of collapsing.", sql: `SELECT order_id, city, order_amount, sum(order_amount) OVER (PARTITION BY city) AS city_total FROM snitch_sales WHERE city = 'Pune';` },
        { name: "ROW_NUMBER", sig: "ROW_NUMBER() OVER (PARTITION BY g ORDER BY o)", does: "1, 2, 3... never ties, never gaps.", sql: `SELECT order_id, city, row_number() OVER (PARTITION BY city ORDER BY order_date) AS nth FROM snitch_sales WHERE city IN ('Pune','Delhi');` },
        { name: "RANK", sig: "RANK() OVER (ORDER BY o DESC)", does: "Ties share a rank; the next rank skips.", sql: `SELECT order_amount, rank() OVER (ORDER BY order_amount DESC) FROM snitch_sales LIMIT 5;` },
        { name: "DENSE_RANK", sig: "DENSE_RANK() OVER (ORDER BY o DESC)", does: "Ties share a rank; no gaps.", sql: `SELECT order_amount, dense_rank() OVER (ORDER BY order_amount DESC) FROM snitch_sales LIMIT 5;` },
        { name: "LAG", sig: "LAG(col [, n, default]) OVER (...)", does: "The value n rows back (default 1). NULL on the first row.", sql: `SELECT order_date, order_amount, lag(order_amount, 1, 0) OVER (ORDER BY order_date) AS prev FROM snitch_sales WHERE customer_id = 'C01';` },
        { name: "LEAD", sig: "LEAD(col [, n, default]) OVER (...)", does: "The value n rows ahead. NULL on the last row.", sql: `SELECT order_date, order_amount, lead(order_date) OVER (ORDER BY order_date) AS next_visit FROM snitch_sales WHERE customer_id = 'C02';` },
        { name: "NTILE", sig: "NTILE(n) OVER (ORDER BY o)", does: "Splits rows into n near-equal buckets.", sql: `SELECT order_id, order_amount, ntile(4) OVER (ORDER BY order_amount DESC) AS quartile FROM snitch_sales LIMIT 6;` },
        { name: "PERCENT_RANK / CUME_DIST", sig: "PERCENT_RANK() OVER (ORDER BY o)", does: "Position on a 0-1 scale / fraction at or below.", sql: `SELECT order_amount, round(cume_dist() OVER (ORDER BY order_amount)::numeric, 2) FROM snitch_sales LIMIT 4;` },
        { name: "FIRST_VALUE", sig: "FIRST_VALUE(col) OVER (PARTITION BY g ORDER BY o)", does: "The first row's value in the window.", sql: `SELECT customer_id, order_date, first_value(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS first_visit FROM snitch_sales WHERE customer_id = 'C04';` },
        { name: "LAST_VALUE", sig: "LAST_VALUE(col) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)", does: "The last row's value. Needs the full frame.", sql: `SELECT customer_id, last_value(category) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest FROM snitch_sales WHERE customer_id = 'C05';` },
        { name: "NTH_VALUE", sig: "NTH_VALUE(col, n) OVER (... full frame)", does: "The nth row's value. NULL if there are fewer than n rows.", sql: `SELECT customer_id, nth_value(order_amount, 3) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS third FROM snitch_sales WHERE customer_id IN ('C01','C07');` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "20 orders from 7 customers. How many rows does <code>SELECT customer_id, sum(order_amount) OVER (PARTITION BY customer_id) FROM snitch_sales;</code> return?",
          opts: ["7", "20", "1", "27"], a: 1, check: "SELECT count(*) FROM (SELECT customer_id, sum(order_amount) OVER (PARTITION BY customer_id) FROM snitch_sales) t;",
          why: "A window function never removes rows. GROUP BY customer_id would return 7." },
        { q: "Scores 90, 90, 85. What does <code>RANK()</code> give the 85?",
          opts: ["2", "3", "4", "1"], a: 1, check: "SELECT r FROM (SELECT v, rank() OVER (ORDER BY v DESC) r FROM (VALUES (90),(90),(85)) t(v)) x WHERE v = 85;",
          why: "Two rows share rank 1, so the next rank is 1 + 2 = 3." },
        { q: "Scores 90, 90, 85. What does <code>DENSE_RANK()</code> give the 85?",
          opts: ["2", "3", "1", "4"], a: 0, check: "SELECT r FROM (SELECT v, dense_rank() OVER (ORDER BY v DESC) r FROM (VALUES (90),(90),(85)) t(v)) x WHERE v = 85;",
          why: "DENSE_RANK never leaves gaps: after 1 comes 2." },
        { q: "Why can't you write <code>WHERE row_number() OVER (...) = 1</code>?",
          opts: ["row_number needs an argument", "Window functions are computed after WHERE runs", "WHERE only accepts columns", "It works in PostgreSQL 18"], a: 1,
          why: "Compute the window in a subquery, then filter in the outer query." },
        { q: "What does LAG return on the first row of each partition?",
          opts: ["0", "The same row's value", "NULL", "The last row's value"], a: 2,
          why: "There is no previous row. LAG(col, 1, 0) lets you choose a default instead." },
        { q: "<code>LAST_VALUE(x) OVER (PARTITION BY g ORDER BY d)</code> returns the current row's x. Why?",
          opts: ["LAST_VALUE is broken", "The default frame ends at the current row", "ORDER BY is not allowed", "PARTITION BY resets it"], a: 1,
          why: "With ORDER BY, the default frame is 'start of partition to current row'. Widen it with ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING." },
        { q: "7 rows, <code>NTILE(3)</code>. How big are the buckets?",
          opts: ["3, 3, 1", "2, 2, 3", "3, 2, 2", "2, 3, 2"], a: 2,
          why: "Buckets are as equal as possible and the earlier buckets take the extra rows." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Each customer's biggest order (the row itself, not just the amount).",
          bad: `SELECT customer_id, order_id, order_amount,
       rank() OVER (PARTITION BY customer_id ORDER BY order_amount DESC) AS rnk
FROM snitch_sales
WHERE rnk = 1;`,
          opts: [
            `SELECT * FROM (
  SELECT customer_id, order_id, order_amount,
         rank() OVER (PARTITION BY customer_id ORDER BY order_amount DESC) AS rnk
  FROM snitch_sales
) t
WHERE rnk = 1;`,
            `SELECT customer_id, order_id, order_amount,
       rank() OVER (PARTITION BY customer_id ORDER BY order_amount DESC) AS rnk
FROM snitch_sales
HAVING rnk = 1;`,
            `SELECT customer_id, order_id, max(order_amount)
FROM snitch_sales
GROUP BY customer_id;`,
            `SELECT customer_id, order_id, order_amount
FROM snitch_sales
WHERE rank() OVER (PARTITION BY customer_id ORDER BY order_amount DESC) = 1;`],
          a: 0,
          why: `Window results do not exist yet when WHERE runs. Compute them in a subquery (it must have an alias, here <code>t</code>) and filter outside.` },
        { task: "Each customer's most recent order amount, on every row.",
          bad: `SELECT customer_id, order_date, order_amount,
       last_value(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS latest
FROM snitch_sales;`, silent: true,
          opts: [
            `SELECT customer_id, order_date, order_amount,
       last_value(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest
FROM snitch_sales;`,
            `SELECT customer_id, order_date, order_amount,
       last_value(order_amount) OVER (PARTITION BY customer_id) AS latest
FROM snitch_sales ORDER BY order_date;`,
            `SELECT customer_id, order_date, order_amount,
       first_value(order_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS latest
FROM snitch_sales;`,
            `SELECT customer_id, order_date, order_amount,
       max(order_amount) OVER (PARTITION BY customer_id) AS latest
FROM snitch_sales;`],
          a: 0,
          why: `No error, just a copy of order_amount. The default frame stops at the current row. (FIRST_VALUE gives the <i>earliest</i>; max gives the <i>biggest</i>, not the latest.)` },
        { task: "Number each city's orders 1, 2, 3 by date.",
          bad: `SELECT city, order_id, row_number() OVER (ORDER BY order_date) AS nth
FROM snitch_sales ORDER BY city, nth;`, silent: true,
          opts: [
            `SELECT city, order_id, row_number() OVER (PARTITION BY city ORDER BY order_date) AS nth
FROM snitch_sales ORDER BY city, nth;`,
            `SELECT city, order_id, row_number() OVER (PARTITION BY order_date ORDER BY city) AS nth
FROM snitch_sales ORDER BY city, nth;`,
            `SELECT city, order_id, count(*) AS nth
FROM snitch_sales GROUP BY city, order_id ORDER BY city, nth;`,
            `SELECT city, order_id, row_number(city) OVER (ORDER BY order_date) AS nth
FROM snitch_sales ORDER BY city, nth;`],
          a: 0,
          why: `Without PARTITION BY the numbering runs 1 to 20 across the whole table. "For each city" means PARTITION BY city.` },
        { task: "Percentile of each order, rounded to 2 places.",
          bad: `SELECT order_id, round(percent_rank() OVER (ORDER BY order_amount), 2) FROM snitch_sales;`,
          opts: [
            `SELECT order_id, round((percent_rank() OVER (ORDER BY order_amount))::numeric, 2) FROM snitch_sales;`,
            `SELECT order_id, round(percent_rank(), 2) OVER (ORDER BY order_amount) FROM snitch_sales;`,
            `SELECT order_id, percent_rank(2) OVER (ORDER BY order_amount) FROM snitch_sales;`,
            `SELECT order_id, trunc(percent_rank() OVER (ORDER BY order_amount), 2) FROM snitch_sales;`],
          a: 0,
          why: `percent_rank returns double precision, and round(value, places) only accepts numeric. Cast with <code>::numeric</code> first.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "GROUP BY collapses rows; OVER () keeps them. That is why window functions exist.",
        "Anatomy: <code>function() OVER (PARTITION BY group ORDER BY sequence frame)</code>. All three parts are optional.",
        "Empty <code>OVER ()</code> = the whole result is one window.",
        "ROW_NUMBER: always unique. RANK: ties share, then skip. DENSE_RANK: ties share, no gaps.",
        "Window functions cannot be used in WHERE. Wrap in a subquery (or CTE) and filter outside: the top-N-per-group pattern.",
        "LAG = previous row, LEAD = next row. NULL at the edges. A NULL LEAD = a customer who has not returned.",
        "The frame trap: ORDER BY inside OVER sets the frame to 'start to current row'. Write ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING for LAST_VALUE and NTH_VALUE.",
        "PERCENT_RANK goes 0 to 1; CUME_DIST = fraction of rows at or below. Cast to numeric before ROUND.",
        "NTILE(n) makes n near-equal buckets; earlier buckets get the leftovers.",
        "Choose the partition key deliberately: Kabir totals 12,995 by name but 8,496 under id C03.",
        "The ORDER BY inside OVER (computation) and the outer ORDER BY (display) are different things.",
      ],
    },
  ],
};
