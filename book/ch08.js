/* Chapter 8 - JOINs (class file DE 8). */
const TABLE = `DROP TABLE IF EXISTS orders, products, customers CASCADE;

-- referred_by points back into THIS SAME table (used by the self join, 8.12)
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  city        VARCHAR(50),
  referred_by INT            -- -> customers.customer_id
);

CREATE TABLE products (
  product_id   VARCHAR(5) PRIMARY KEY,
  product_name VARCHAR(50) NOT NULL
);

-- NOTE: customer_id deliberately has NO foreign key.
-- That is what allows the orphan row below to exist, and the orphan is
-- the whole point of the lesson. In a real schema you would write
--   customer_id INT REFERENCES customers(customer_id)
-- and PostgreSQL would reject order 104 at INSERT time.
CREATE TABLE orders (
  order_id    INT PRIMARY KEY,
  customer_id INT,
  product_id  VARCHAR(5),
  amount      NUMERIC(10,2)
);

INSERT INTO customers VALUES (1,'Aarav','Pune',NULL), (2,'Diya','Mumbai',1), (3,'Kabir','Delhi',1);
INSERT INTO products  VALUES ('P9','Notebook'), ('P7','Pen'), ('P5','Eraser');   -- Eraser: never ordered
INSERT INTO orders VALUES
 (101, 1, 'P9', 6500),
 (102, 1, 'P7', 1200),
 (103, 2, 'P9', 8000),
 (104, 4, 'P7', 3000);   -- customer_id 4 does not exist -> ORPHAN ROW`;

export default {
  id: "ch8",
  num: 8,
  title: "Joining tables",
  topic: "INNER, LEFT, RIGHT, FULL, CROSS and SELF joins",
  accent: "amber",
  opener: {
    question: "Customers in one table, orders in another. How do you see them together?",
    story: `A shop keeps customers, products and orders in three tables, linked by ids. A JOIN lines the rows up
      side by side wherever the ids match. The interesting part is what happens where they do not match: a
      customer who never ordered, an order whose customer does not exist, a product nobody bought. Every join
      type is just a different answer to "what do we do with the rows that have no partner?"`,
    learn: [
      "INNER JOIN: only the matching rows",
      "LEFT and RIGHT JOIN: keep one side whole, NULLs where there is no match",
      "The LEFT JOIN + IS NULL pattern for 'never ordered', 'never sold', orphans",
      "FULL OUTER JOIN, CROSS JOIN and SELF JOIN",
      "Joining three tables, and counting with zeros kept",
    ],
    uses: "customers (3), products (3), orders (4)",
  },
  pages: [
    {
      kind: "table", id: "8.0", title: "The tables",
      say: "Three small tables, with three deliberate oddities.",
      sql: TABLE,
      show: `SELECT * FROM customers;
SELECT * FROM products;
SELECT * FROM orders;`,
      grid: { head: ["Oddity", "Why it matters"], rows: [
        ["Kabir (3) has placed no orders", "a left row with no partner"],
        ["Order 104 belongs to customer 4, who does not exist", "a right row with no partner: an <b>orphan</b>"],
        ["Eraser (P5) has never been ordered", "a product with no partner"],
      ] },
    },
    {
      kind: "intro", id: "picture", title: "What a join does",
      art: "joinmatch",
      html: `<p>A join takes a row from the left table and a row from the right table and glues them into one wider row, whenever
        the <code>ON</code> condition is true. <code>ON c.customer_id = o.customer_id</code> reads: "this customer goes with the orders that carry
        their id".</p>
        <p>The <b>left</b> table is the one written <i>before</i> the word JOIN; the <b>right</b> table is the one written after it.</p>`,
    },
    {
      kind: "lesson", id: "8.1", title: "Combine the two tables: INNER JOIN",
      say: "Put each order next to its customer.",
      sql: `SELECT * FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;`,
      predict: "4 orders and 3 customers go in. How many rows come out?",
      explain: `<p><code>JOIN</code> (also written <code>INNER JOIN</code>) keeps only rows that match on both sides. 4 orders in, 3 rows out:
        order 104 vanished (no customer 4), and Kabir vanished (no orders).</p>
        <p><code>c</code> and <code>o</code> are aliases. Aarav appears twice because he has two orders: <b>a join can multiply rows</b>.</p>`,
    },
    {
      kind: "lesson", id: "8.2", title: "No aliases, and the tables swapped",
      say: "Does the order of the tables matter for an INNER JOIN?",
      sql: `-- no aliases
SELECT * FROM customers JOIN orders ON customers.customer_id = orders.customer_id;

-- tables swapped
SELECT * FROM orders o JOIN customers c ON c.customer_id = o.customer_id;`,
      explain: `<p>For an INNER JOIN, swapping the tables changes only the left-to-right order of the columns, never which rows come back.
        For LEFT and RIGHT joins the order matters enormously (8.4).</p>`,
    },
    {
      kind: "lesson", id: "8.3", title: "Pick columns instead of *",
      say: "Just the customer's name and the order amount.",
      sql: `SELECT c.name, o.amount
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;`,
      explain: `<p><code>*</code> in a join means every column from both tables, including two confusingly identical <code>customer_id</code>
        columns. Name the columns you need, with a table prefix.</p>`,
    },
    {
      kind: "lesson", id: "8.4", title: "All customers, even without orders: LEFT JOIN",
      say: "Every customer must appear.",
      sql: `SELECT c.name, o.amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;`,
      explain: `<p><b>LEFT JOIN</b>: (1) take every row from the left table, matched or not; (2) fill in the matching right-side data, or NULL if
        there is none. Kabir now appears with an empty amount. Order 104 still does not appear: it is on the right side, and a LEFT JOIN
        makes no promises about right-side rows.</p>`,
    },
    {
      kind: "lesson", id: "8.5", title: "All customer columns, plus the amount",
      say: "Mix table.* with a single column.",
      sql: `SELECT c.*, o.amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;`,
      explain: `<p><code>c.*</code> = every column of customers only.</p>`,
    },
    {
      kind: "lesson", id: "8.6", title: "LEFT JOIN, then keep only the matched",
      say: "What happens if you filter out the NULLs afterwards?",
      sql: `-- A: all customers (the plain LEFT JOIN)
SELECT c.name, o.amount
FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id;

-- B: only customers who DID order
SELECT c.name, o.amount
FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.customer_id IS NOT NULL;`,
      explain: `<p>Throwing away the unmatched rows turns the LEFT JOIN back into an INNER JOIN. Version B is just a long way of writing 8.3.</p>`,
    },
    {
      kind: "lesson", id: "8.7", title: "Customers who never ordered: LEFT JOIN + IS NULL",
      say: "The pattern to memorise.",
      sql: `SELECT c.name, o.amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.customer_id IS NULL;`,
      art: "leftexcl",
      explain: `<p>LEFT JOIN, then keep only the rows where the right side came back NULL = <b>everything on the left with no match on the right.</b></p>
        <p>It answers a whole family of questions: customers who never ordered, products never sold, employees with no manager, students who never paid.</p>`,
    },
    {
      kind: "lesson", id: "8.8", title: "All orders, customer or not: RIGHT JOIN",
      say: "The mirror image.",
      sql: `SELECT * FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;`,
      explain: `<p>All 4 orders survive, and the orphan (104) shows NULLs on the customer side. Kabir disappears now: he is on the left.</p>`,
    },
    {
      kind: "lesson", id: "8.9", title: "The orphan hunt",
      say: "Orders with a real customer, and orders without one.",
      sql: `-- orders that ARE linked to a customer
SELECT * FROM customers c RIGHT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.customer_id IS NOT NULL;

-- orders whose customer does NOT exist
SELECT * FROM customers c RIGHT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL;`,
      explain: `<p>The same IS NULL trick, pointed the other way. This is a real data-quality audit: it finds child rows pointing at parents that
        do not exist. In a well-designed schema it returns 0 rows, because a FOREIGN KEY would have blocked order 104 (Chapter 9).</p>`,
    },
    {
      kind: "lesson", id: "8.10", title: "Everything from both sides: FULL OUTER JOIN",
      say: "Every customer and every order, partner or not.",
      sql: `SELECT c.name, o.order_id, o.amount
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id
ORDER BY o.order_id;

-- only the problems
SELECT c.name, o.order_id
FROM customers c FULL OUTER JOIN orders o ON c.customer_id = o.customer_id
WHERE c.customer_id IS NULL OR o.order_id IS NULL;`,
      explain: `<p><code>FULL OUTER JOIN</code> = LEFT plus RIGHT: every row from both tables, NULLs wherever there is no partner. Both oddities show up
        in one result. The second query is the standard <b>reconciliation report</b>: everything that does not line up, on either side.</p>`,
    },
    {
      kind: "lesson", id: "8.11", title: "Every possible pairing: CROSS JOIN",
      say: "Every customer with every product.",
      sql: `SELECT c.name, p.product_name
FROM customers c
CROSS JOIN products p
ORDER BY c.name, p.product_name;

SELECT count(*) AS cross_rows FROM customers c CROSS JOIN products p;`,
      explain: `<p>CROSS JOIN has no ON: it pairs every left row with every right row. 3 x 3 = 9 (the <b>Cartesian product</b>).
        Useful for building a full grid (every product for every month, so gaps show up as zeros).</p>`,
      note: "Forget the ON in a normal join and you get a cross join by accident: two 10,000-row tables become 100,000,000 rows. If a query suddenly returns a huge number of rows, check the ON first.",
    },
    {
      kind: "lesson", id: "8.12", title: "Who referred whom? SELF JOIN",
      say: "Join customers to customers.",
      sql: `SELECT ch.name AS customer, ref.name AS referred_by
FROM customers ch
LEFT JOIN customers ref ON ch.referred_by = ref.customer_id
ORDER BY ch.customer_id;`,
      explain: `<p><code>referred_by</code> holds a customer_id from the same table, so the table is joined to itself. Aliases are compulsory
        (<code>ch</code> for the customer, <code>ref</code> for the referrer), otherwise the database cannot tell the two copies apart. The LEFT JOIN
        keeps Aarav, who was referred by nobody.</p>
        <p>The same pattern works for employee and manager, category and parent category, comment and reply.</p>`,
    },
    {
      kind: "lesson", id: "8.13", title: "Three tables at once",
      say: "Customer name, product name and amount for every order.",
      sql: `SELECT c.name, p.product_name, o.amount
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN products  p ON p.product_id  = o.product_id
ORDER BY o.order_id;`,
      explain: `<p>Joins chain: the result of the first becomes the left side of the next. <code>orders</code> sits in the middle because it links
        customers to products. Order 104 is dropped by the customers join even though its product exists: each INNER JOIN in a chain can only shrink the result.</p>`,
    },
    {
      kind: "lesson", id: "8.14", title: "Products that have never been sold",
      say: "The 8.7 pattern on a different pair of tables.",
      sql: `SELECT p.product_name, o.order_id
FROM products p
LEFT JOIN orders o ON o.product_id = p.product_id
ORDER BY p.product_id;

SELECT p.product_name
FROM products p
LEFT JOIN orders o ON o.product_id = p.product_id
WHERE o.order_id IS NULL;`,
      explain: `<p>The first query returns 5 rows from a 3-row products table: Pen and Notebook were each ordered twice. Never assume the output has as many
        rows as the left table.</p>`,
    },
    {
      kind: "lesson", id: "8.15", title: "Orders and total per customer, zeros kept",
      say: "LEFT JOIN + GROUP BY, the right way.",
      sql: `SELECT c.name,
       count(o.order_id)          AS orders_placed,
       coalesce(sum(o.amount), 0) AS total
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;`,
      explain: `<p>Three chapters in one query, and every piece matters:</p>
        <ul class="defs"><li><b>LEFT JOIN</b> keeps Kabir in the report.</li>
        <li><b>count(o.order_id)</b>, not count(*): count(*) would count Kabir's NULL-filled row and report 1.</li>
        <li><b>coalesce(sum(...), 0)</b>: SUM over no rows is NULL, not 0.</li>
        <li><b>GROUP BY c.customer_id, c.name</b>: grouping by the key too stops two customers with the same name from merging.</li></ul>`,
    },
    {
      kind: "tools", title: "Toolbox: the six joins",
      cards: [
        { name: "INNER JOIN", sig: "a JOIN b ON a.id = b.a_id", does: "Only rows that match on both sides.", sql: `SELECT c.name, o.order_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id;` },
        { name: "LEFT JOIN", sig: "a LEFT JOIN b ON ...", does: "Every row of a; NULLs where b has no match.", sql: `SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;` },
        { name: "RIGHT JOIN", sig: "a RIGHT JOIN b ON ...", does: "Every row of b; NULLs where a has no match.", sql: `SELECT c.name, o.order_id FROM customers c RIGHT JOIN orders o ON o.customer_id = c.customer_id;` },
        { name: "FULL OUTER JOIN", sig: "a FULL JOIN b ON ...", does: "Everything from both sides.", sql: `SELECT c.name, o.order_id FROM customers c FULL JOIN orders o ON o.customer_id = c.customer_id;` },
        { name: "CROSS JOIN", sig: "a CROSS JOIN b", does: "Every combination. No ON.", sql: `SELECT count(*) FROM products CROSS JOIN customers;` },
        { name: "SELF JOIN", sig: "t a JOIN t b ON a.parent = b.id", does: "A table joined to itself, with two aliases.", sql: `SELECT r.name AS referrer, count(*) AS referrals FROM customers c JOIN customers r ON c.referred_by = r.customer_id GROUP BY r.name;` },
        { name: "Anti-join", sig: "a LEFT JOIN b ... WHERE b.id IS NULL", does: "Rows of a with no match in b.", sql: `SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;` },
        { name: "USING", sig: "a JOIN b USING (shared_col)", does: "Shorthand when both columns have the same name; shows it once.", sql: `SELECT customer_id, name, order_id FROM customers JOIN orders USING (customer_id);` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "How many rows?", code: "SELECT * FROM customers c JOIN orders o ON c.customer_id = o.customer_id;",
          opts: ["3", "4", "5", "12"], a: 0, check: "SELECT count(*) FROM customers c JOIN orders o ON c.customer_id = o.customer_id;",
          why: "Only matched pairs: orders 101, 102 and 103." },
        { q: "How many rows?", code: "SELECT * FROM customers c FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;",
          opts: ["3", "4", "5", "7"], a: 2, check: "SELECT count(*) FROM customers c FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;",
          why: "3 matched rows + Kabir with no order + order 104 with no customer = 5." },
        { q: "In <code>FROM orders o LEFT JOIN customers c ON ...</code>, which table is kept whole?",
          opts: ["customers", "orders", "both", "neither"], a: 1,
          why: "The left table is the one written before the JOIN keyword: orders." },
        { q: "How do you list products that were never ordered?",
          opts: ["products p JOIN orders o ... WHERE o.order_id IS NULL", "products p LEFT JOIN orders o ... WHERE o.order_id IS NULL", "products p LEFT JOIN orders o ... WHERE o.order_id IS NOT NULL", "products p CROSS JOIN orders o"], a: 1,
          why: "LEFT JOIN keeps every product; the unmatched ones have NULL on the orders side." },
        { q: "What does this return for Kabir?", code: "SELECT c.name, count(*) FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name;",
          opts: ["0", "1", "NULL", "Kabir is missing"], a: 1,
          check: "SELECT count(*) FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE c.name = 'Kabir' GROUP BY c.customer_id;",
          why: "count(*) counts Kabir's one NULL-filled row. count(o.order_id) would correctly say 0." },
        { q: "How many rows does <code>customers CROSS JOIN products</code> return?",
          opts: ["3", "6", "9", "0"], a: 2, check: "SELECT count(*) FROM customers CROSS JOIN products;",
          why: "3 customers x 3 products." },
        { q: "Why does a SELF JOIN need two aliases?",
          opts: ["It is faster", "To tell the two copies of the same table apart", "PostgreSQL requires aliases in every join", "To avoid NULLs"], a: 1,
          why: "Both copies have identical column names; the aliases say which copy you mean." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Every customer with their order amounts.",
          bad: `SELECT name, amount FROM customers, orders;`, silent: true,
          opts: [`SELECT c.name, o.amount FROM customers c JOIN orders o ON o.customer_id = c.customer_id;`, `SELECT name, amount FROM customers AND orders;`, `SELECT DISTINCT name, amount FROM customers, orders;`, `SELECT name, amount FROM customers JOIN orders;`], a: 0,
          why: `A comma between tables with no condition is a CROSS JOIN: 3 x 4 = 12 rows of nonsense, and no error. Every join needs its ON.` },
        { task: "Show each order with its customer id and name.",
          bad: `SELECT customer_id, name, order_id FROM customers c JOIN orders o ON c.customer_id = o.customer_id;`,
          opts: [`SELECT c.customer_id, c.name, o.order_id FROM customers c JOIN orders o ON c.customer_id = o.customer_id;`, `SELECT "customer_id", name, order_id FROM customers c JOIN orders o ON c.customer_id = o.customer_id;`, `SELECT customer_id, name, order_id FROM customers JOIN orders;`, `SELECT customers_id, name, order_id FROM customers c JOIN orders o ON c.customer_id = o.customer_id;`], a: 0,
          why: `"column reference is ambiguous": both tables have a customer_id, so say which one with its alias.` },
        { task: "Number of orders per customer, including customers with none.",
          bad: `SELECT c.name, count(*) AS orders_placed
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;`, silent: true,
          opts: [
            `SELECT c.name, count(o.order_id) AS orders_placed
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;`,
            `SELECT c.name, count(*) - 1 AS orders_placed
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;`,
            `SELECT c.name, count(*) AS orders_placed
FROM customers c JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;`,
            `SELECT c.name, count(DISTINCT c.customer_id) AS orders_placed
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name;`],
          a: 0,
          why: `Kabir shows 1 instead of 0: count(*) counted his NULL-filled row. count(o.order_id) skips NULLs. (Subtracting 1 breaks everyone else; an INNER JOIN loses Kabir.)` },
        { task: "Customers who have never ordered.",
          bad: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;`, silent: true,
          opts: [`SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;`, `SELECT c.name FROM customers c JOIN orders o ON o.customer_id <> c.customer_id;`, `SELECT c.name FROM customers c RIGHT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;`, `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id = NULL;`], a: 0,
          why: `An INNER JOIN has already thrown the unmatched customers away, so there is nothing left for IS NULL to find. Keep the left side whole with LEFT JOIN.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "LEFT and RIGHT are decided by position: before the JOIN keyword is left, after it is right.",
        "INNER: matches only. LEFT: all left + matches. RIGHT: all right + matches. FULL: everything. CROSS: every combination (no ON).",
        "<code>A LEFT JOIN B</code> = <code>B RIGHT JOIN A</code>. Most teams write only LEFT JOINs, for consistency.",
        "The unmatched-rows pattern: <code>LEFT JOIN ... WHERE right.col IS NULL</code>.",
        "Table order changes nothing for INNER and CROSS joins, and everything for LEFT and RIGHT.",
        "A join can multiply rows. Always sanity-check the row count.",
        "Each INNER JOIN in a chain can only shrink the result.",
        "A forgotten ON is an accidental CROSS JOIN: check it first when row counts explode.",
        "A SELF JOIN needs two aliases; use LEFT JOIN so the top of the hierarchy (NULL parent) is kept.",
        "LEFT JOIN + GROUP BY: <code>count(right.col)</code>, not count(*), and <code>COALESCE(SUM(...), 0)</code>.",
        "Qualify every column with its alias (<code>c.name</code>, <code>o.amount</code>).",
        "An orphan row exists only because the column has no FOREIGN KEY. Chapter 9 fixes that.",
      ],
    },
  ],
};
