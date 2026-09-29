/* Chapter 9 - a 5-table schema with foreign keys, CTEs, multi-join reports (class file DE 9). */
const TABLE = `DROP TABLE IF EXISTS payments, order_items, orders, products, customers CASCADE;

-- 1. customers (parent)
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(120) UNIQUE NOT NULL,
  city        VARCHAR(50),
  signup_date DATE DEFAULT CURRENT_DATE
);

-- 2. products (parent)
CREATE TABLE products (
  product_id   SERIAL PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  category     VARCHAR(50)  NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  stock_qty    INT NOT NULL DEFAULT 0
);

-- 3. orders (child of customers)
CREATE TABLE orders (
  order_id    SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'PLACED',
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- 4. order_items (child of orders AND products -> composite primary key)
CREATE TABLE order_items (
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL CHECK (quantity > 0),
  price_each NUMERIC(10,2) NOT NULL,
  CONSTRAINT pk_order_items PRIMARY KEY (order_id, product_id),
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)     ON DELETE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- 5. payments (child of orders)
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  order_id   INT NOT NULL,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method     VARCHAR(20) NOT NULL,     -- UPI / CARD / COD
  paid_on    DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Helpful indexes on FK columns (PostgreSQL does NOT index foreign keys for you)
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_items_product   ON order_items(product_id);
CREATE INDEX idx_payments_order  ON payments(order_id);

-- sample data
INSERT INTO customers (full_name, email, city, signup_date) VALUES
 ('Satyaki Das','satyaki@mail.com','Kolkata','2024-01-15'),
 ('Priya Sharma','priya@mail.com','Delhi','2024-02-10'),
 ('Rahul Verma','rahul@mail.com','Bengaluru','2024-03-05'),
 ('Anita Roy','anita@mail.com','Kolkata','2024-04-20'),
 ('Imran Khan','imran@mail.com','Mumbai','2024-05-01');          -- no orders

INSERT INTO products (product_name, category, unit_price, stock_qty) VALUES
 ('Laptop 14"','Electronics',65000.00,12),
 ('Wireless Mouse','Electronics',899.00,150),
 ('Office Chair','Furniture',7500.00,30),
 ('Study Desk','Furniture',12000.00,18),
 ('Coffee Mug','Kitchen',350.00,200),
 ('Noise Cancelling Headphone','Electronics',4999.00,0);           -- never ordered

INSERT INTO orders (customer_id, order_date, status) VALUES
 (1,'2024-06-01','DELIVERED'), (1,'2024-06-18','SHIPPED'), (2,'2024-06-20','DELIVERED'),
 (3,'2024-07-02','PLACED'),    (4,'2024-07-11','CANCELLED');

INSERT INTO order_items (order_id, product_id, quantity, price_each) VALUES
 (1,1,1,65000.00),(1,2,2,899.00),(2,5,4,350.00),
 (3,3,2,7500.00),(3,4,1,12000.00),(4,2,1,899.00),(5,5,2,350.00);

INSERT INTO payments (order_id, amount, method, paid_on) VALUES
 (1,66798.00,'CARD','2024-06-01'),   -- order 1 fully paid
 (2,  700.00,'UPI', '2024-06-18'),   -- order 2 part-paid (value 1400)
 (3,27000.00,'UPI', '2024-06-20');   -- order 3 fully paid
-- order 4 unpaid (COD pending), order 5 cancelled and unpaid`;

export default {
  id: "ch9",
  num: 9,
  title: "A real schema",
  topic: "Foreign keys, cascades, CTEs and multi-table reports",
  accent: "pencil",
  opener: {
    question: "How do five tables stay consistent, and answer business questions together?",
    story: `A small online shop: customers place orders, orders contain items, items are products, and orders
      get paid. Foreign keys make orphan rows impossible, cascades decide what happens when a parent is
      deleted, and CTEs let you build a long report as a list of small, readable steps. Everything from the
      first eight chapters comes together here.`,
    learn: [
      "Read a schema: SERIAL, UNIQUE, DEFAULT, CHECK, composite keys, foreign keys",
      "A five-table join, and the double-counting danger",
      "CTEs (WITH ...) to aggregate each side separately",
      "Top-N per group on a real join",
      "Watch foreign keys, RESTRICT and CASCADE do their job",
    ],
    uses: "customers, products, orders, order_items, payments",
  },
  pages: [
    {
      kind: "intro", id: "schema", title: "The shape of the shop",
      art: "schema",
      html: `<p>Follow the arrows: <b>customers</b> place <b>orders</b>; each order has <b>order_items</b>; each item is a <b>product</b>;
        and <b>payments</b> hang off orders. An arrow is a foreign key: the child row must point at a parent that exists.</p>`,
    },
    {
      kind: "table", id: "9.0", title: "The tables",
      say: "Five tables, created parents first, then children.",
      sql: TABLE,
      show: `SELECT * FROM customers;
SELECT * FROM products;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM payments;`,
      grid: { head: ["Feature", "Meaning"], rows: [
        ["<code>SERIAL</code>", "auto-incrementing id; never supplied by hand"],
        ["<code>UNIQUE</code>", "no two customers may share an email"],
        ["<code>DEFAULT CURRENT_DATE</code>", "if you do not give a value, today's date is used"],
        ["<code>CHECK (unit_price &gt; 0)</code>", "rejects nonsense prices"],
        ["<code>FOREIGN KEY ... REFERENCES</code>", "a child row must point at an existing parent"],
        ["<code>PRIMARY KEY (order_id, product_id)</code>", "composite key: the pair must be unique"],
        ["<code>ON DELETE CASCADE</code>", "deleting the parent deletes its children too"],
        ["<code>ON DELETE RESTRICT</code>", "refuses to delete a parent that still has children"],
        ["<code>CREATE INDEX</code>", "speeds up joins on the foreign-key columns"],
      ] },
    },
    {
      kind: "lesson", id: "9.1", title: "The five-table join",
      say: "Every order line with its customer, product and payment.",
      sql: `SELECT c.customer_id, c.full_name, o.order_id, o.order_date,
       p.product_name, oi.quantity, oi.price_each,
       (oi.quantity * oi.price_each) AS line_total,
       pay.method, pay.amount AS payment_amount
FROM customers c
JOIN orders      o   ON o.customer_id = c.customer_id
JOIN order_items oi  ON oi.order_id   = o.order_id
JOIN products    p   ON p.product_id  = oi.product_id
LEFT JOIN payments pay ON pay.order_id = o.order_id
ORDER BY c.customer_id, o.order_id, p.product_name;`,
      explain: `<p>Read the join chain as a path: customers, orders, order_items, products, with payments hanging off orders.</p>
        <ul class="defs"><li>The first three joins are INNER: every order line must have a customer, an order and a product.</li>
        <li>The last is a <b>LEFT JOIN</b>, because orders 4 and 5 have no payment. An INNER JOIN would silently drop them.</li>
        <li><code>quantity * price_each</code> is a computed column: calculated at query time, never stored.</li>
        <li>Imran (customer 5) is absent: no orders, and the first join is INNER.</li></ul>`,
      note: "payment_amount 66798.00 repeats on both lines of order 1. Never SUM that column in this query: you would double-count the payment. That is why 9.5 uses CTEs.",
    },
    {
      kind: "lesson", id: "9.2", title: "What is each order worth?",
      say: "Aggregate across the join, one row per order.",
      sql: `SELECT o.order_id, c.full_name, o.status,
       COUNT(oi.product_id)             AS item_count,
       SUM(oi.quantity * oi.price_each) AS order_value
FROM orders o
JOIN customers   c  ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id   = o.order_id
GROUP BY o.order_id, c.full_name, o.status
ORDER BY order_value DESC;`,
      explain: `<p>The join multiplies rows out to one per item; GROUP BY o.order_id folds each order's lines back into one row.
        Every non-aggregated column is listed in the GROUP BY (Chapter 4's rule).</p>`,
    },
    {
      kind: "lesson", id: "9.3", title: "Customers who have never ordered",
      say: "The Chapter 8 pattern.",
      sql: `SELECT c.customer_id, c.full_name, c.city
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;`,
      explain: `<p>Imran signed up but never bought anything: a marketing target.</p>`,
    },
    {
      kind: "lesson", id: "9.4", title: "Products never sold",
      say: "Same pattern, different pair of tables.",
      sql: `SELECT p.product_id, p.product_name, p.category, p.stock_qty
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
WHERE oi.order_id IS NULL;`,
      explain: `<p>Never sold and out of stock: probably time to delist it.</p>`,
    },
    {
      kind: "lesson", id: "9.5", title: "Unpaid or short-paid orders: a CTE",
      say: "Order value from one table, money received from another, compared.",
      sql: `WITH order_value AS (
    SELECT oi.order_id,
           SUM(oi.quantity * oi.price_each) AS value
    FROM order_items oi
    GROUP BY oi.order_id
),
paid AS (
    SELECT pay.order_id,
           SUM(pay.amount) AS paid_total
    FROM payments pay
    GROUP BY pay.order_id
)
SELECT o.order_id,
       c.full_name,
       o.status,
       ov.value                              AS order_value,
       COALESCE(pd.paid_total, 0)            AS paid_total,
       ov.value - COALESCE(pd.paid_total, 0) AS due
FROM orders o
JOIN customers   c  ON c.customer_id = o.customer_id
JOIN order_value ov ON ov.order_id   = o.order_id
LEFT JOIN paid   pd ON pd.order_id   = o.order_id
WHERE ov.value > COALESCE(pd.paid_total, 0)
ORDER BY due DESC;`,
      art: "cte",
      explain: `<p><code>WITH name AS ( ... )</code> creates a <b>CTE</b> (Common Table Expression): a named, temporary result you can then use like a table.
        Several can be chained with commas.</p>
        <p>Why it is needed: joining order_items and payments in one query and summing both would multiply rows and double-count (the danger in 9.1). So:</p>
        <ol class="steps"><li><code>order_value</code> aggregates only order_items: one row per order.</li>
        <li><code>paid</code> aggregates only payments: one row per order.</li>
        <li>Then join those two clean one-row-per-order results.</li></ol>
        <p>CTEs read top to bottom, like a recipe, instead of inside-out like nested subqueries.</p>`,
    },
    {
      kind: "lesson", id: "9.6", title: "Revenue by category, real sales only",
      say: "Count delivered and shipped orders; ignore cancelled and unfulfilled ones.",
      sql: `SELECT p.category,
       SUM(oi.quantity * oi.price_each) AS revenue,
       SUM(oi.quantity)                 AS units_sold
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders   o ON o.order_id   = oi.order_id
WHERE o.status IN ('DELIVERED', 'SHIPPED')
GROUP BY p.category
ORDER BY revenue DESC;`,
      explain: `<p>A revenue report must not count orders that never completed. Kitchen sold the most units (4) but earned the least (1400):
        volume and value are different questions.</p>`,
    },
    {
      kind: "lesson", id: "9.7", title: "Top spender in each city",
      say: "A window function over a four-table join.",
      sql: `SELECT *
FROM (
    SELECT c.city,
           c.full_name,
           SUM(oi.quantity * oi.price_each) AS total_spent,
           RANK() OVER (PARTITION BY c.city
                        ORDER BY SUM(oi.quantity * oi.price_each) DESC) AS rnk
    FROM customers c
    JOIN orders      o  ON o.customer_id = c.customer_id
    JOIN order_items oi ON oi.order_id   = o.order_id
    GROUP BY c.city, c.customer_id, c.full_name
) t
WHERE rnk = 1;`,
      explain: `<p>The top-N-per-group pattern from 5.6, on a real join: the inner query joins, aggregates per customer and ranks within each city;
        the outer query keeps rank 1. Satyaki's 68,198 = order 1 (66,798) + order 2 (1,400). Mumbai is missing: Imran never ordered.</p>`,
    },
    {
      kind: "lesson", id: "9.8", title: "Inspect the foreign keys you created",
      say: "Ask the database to describe its own design.",
      sql: `SELECT tc.table_name   AS child_table,
       kcu.column_name  AS child_column,
       ccu.table_name   AS parent_table,
       ccu.column_name  AS parent_column,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY child_table;`,
      explain: `<p><code>information_schema</code> is a set of built-in views that describe the database itself (<b>metadata</b>). This query documents a
        whole foreign-key design automatically: invaluable on a schema you did not write.</p>`,
    },
    {
      kind: "lesson", id: "9.9", title: "Prove the constraints work", errors: true,
      say: "Four bad writes. Watch each one bounce.",
      sql: `-- (a) FOREIGN KEY: customer 99 does not exist
INSERT INTO orders (customer_id, order_date, status) VALUES (99, '2024-08-01', 'PLACED');

-- (b) CHECK: price must be positive
INSERT INTO products (product_name, category, unit_price, stock_qty)
VALUES ('Broken Item', 'Test', -5, 1);

-- (c) COMPOSITE PRIMARY KEY: (1,1) already exists in order_items
INSERT INTO order_items (order_id, product_id, quantity, price_each)
VALUES (1, 1, 1, 65000.00);

-- (d) ON DELETE RESTRICT: product 1 is still referenced
DELETE FROM products WHERE product_id = 1;`,
      predict: "Chapter 8's orphan order 104 was accepted. What happens to (a) here?",
      explain: `<p>Compare (a) with Chapter 8: order 104 could exist there only because <code>orders.customer_id</code> had no foreign key. Here the same
        mistake is impossible. That is the whole argument for foreign keys.</p>
        <p>(d) is <code>ON DELETE RESTRICT</code> doing its job: you may not delete a product that appears in someone's order history.</p>`,
    },
    {
      kind: "lesson", id: "9.10", title: "What ON DELETE CASCADE really does",
      say: "Delete one customer, and count what else disappears.",
      sql: `SELECT count(*) AS orders_for_cust2 FROM orders      WHERE customer_id = 2;
SELECT count(*) AS items_for_order3 FROM order_items WHERE order_id    = 3;
SELECT count(*) AS payments_order3  FROM payments    WHERE order_id    = 3;

DELETE FROM customers WHERE customer_id = 2;          -- delete Priya Sharma

SELECT count(*) AS orders_left_for_cust2 FROM orders      WHERE customer_id = 2;
SELECT count(*) AS items_left_order3     FROM order_items WHERE order_id    = 3;
SELECT count(*) AS payments_left_order3  FROM payments    WHERE order_id    = 3;`,
      art: "cascade",
      explain: `<p>One DELETE removed five rows in a chain reaction: Priya, her order 3 (orders cascades from customers), both line items of order 3 and its
        payment (they cascade from orders). psql only reports <code>DELETE 1</code>, for the row you named.</p>`,
      note: "CASCADE is powerful and irreversible. Right for rows that mean nothing without their parent (an order line without its order). Wrong for anything you must keep for audit or accounting: that is what RESTRICT is for.",
    },
    {
      kind: "tools", title: "Toolbox: schema and reporting",
      cards: [
        { name: "FOREIGN KEY", sig: "FOREIGN KEY (col) REFERENCES parent(id)", does: "A child row must point at an existing parent.", sql: `INSERT INTO payments (order_id, amount, method) VALUES (42, 100, 'UPI');`, errors: true },
        { name: "UNIQUE", sig: "col TYPE UNIQUE", does: "No two rows may share the value.", sql: `INSERT INTO customers (full_name, email) VALUES ('Copy Cat', 'priya@mail.com');`, errors: true },
        { name: "DEFAULT", sig: "col TYPE DEFAULT value", does: "Used when an INSERT leaves the column out.", sql: `INSERT INTO orders (customer_id) VALUES (5) RETURNING order_id, status, order_date = CURRENT_DATE AS dated_today;` },
        { name: "RETURNING", sig: "INSERT ... RETURNING cols", does: "Shows the row PostgreSQL just wrote, including SERIAL ids.", sql: `INSERT INTO customers (full_name, email, city) VALUES ('Neha Joshi', 'neha@mail.com', 'Pune') RETURNING customer_id, full_name;` },
        { name: "WITH (CTE)", sig: "WITH name AS (SELECT ...) SELECT ... FROM name", does: "A named step you can use like a table.", sql: `WITH spend AS (SELECT o.customer_id, SUM(oi.quantity * oi.price_each) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.order_id GROUP BY o.customer_id)
SELECT c.full_name, s.total FROM spend s JOIN customers c USING (customer_id) ORDER BY s.total DESC;` },
        { name: "COALESCE after LEFT JOIN", sig: "COALESCE(SUM(x), 0)", does: "Turns 'no matching row' into a presentable zero.", sql: `SELECT c.full_name, COALESCE(SUM(p.amount), 0) AS paid FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id LEFT JOIN payments p ON p.order_id = o.order_id GROUP BY c.customer_id, c.full_name ORDER BY paid DESC;` },
        { name: "information_schema", sig: "SELECT ... FROM information_schema.columns", does: "Built-in views that describe your tables.", sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position;` },
        { name: "CREATE INDEX", sig: "CREATE INDEX name ON t(col)", does: "Speeds up lookups and joins on col.", sql: `SELECT indexname FROM pg_indexes WHERE tablename = 'orders' ORDER BY indexname;` },
      ],
    },
    {
      kind: "quiz", title: "Checkpoint",
      qs: [
        { q: "Order 5's customer is deleted, and orders has <code>ON DELETE CASCADE</code>. What happens to order 5?",
          opts: ["It stays, pointing at nobody", "It is deleted too", "The DELETE is refused", "Its customer_id becomes NULL"], a: 1,
          why: "CASCADE deletes the children along with the parent. RESTRICT would refuse; SET NULL would blank the column." },
        { q: "What does <code>PRIMARY KEY (order_id, product_id)</code> guarantee?",
          opts: ["Each order_id appears once", "Each product_id appears once", "Each (order_id, product_id) pair appears once", "Both columns are SERIAL"], a: 2,
          why: "A composite key makes the combination unique: the same product cannot be added twice to one order." },
        { q: "Why not SUM payment amounts straight out of the five-table join?",
          opts: ["SUM does not work on NUMERIC", "The join repeats each payment once per order line, so it double-counts", "Payments must be summed with COUNT", "LEFT JOIN makes SUM return NULL"], a: 1,
          why: "Aggregate each child table separately (a CTE each), then join the one-row-per-order results." },
        { q: "How many rows?", code: "SELECT count(*) FROM orders o JOIN order_items oi ON oi.order_id = o.order_id;",
          opts: ["5", "7", "12", "35"], a: 1, check: "SELECT count(*) FROM orders o JOIN order_items oi ON oi.order_id = o.order_id;",
          why: "One row per order line: 7 items across 5 orders." },
        { q: "Does PostgreSQL create an index on a foreign-key column automatically?",
          opts: ["Yes, always", "No, you create it yourself", "Only for SERIAL columns", "Only with ON DELETE CASCADE"], a: 1,
          why: "Primary keys and UNIQUE get indexes automatically; foreign-key columns do not." },
        { q: "What is the total value of order 3?", code: "SELECT SUM(quantity * price_each) FROM order_items WHERE order_id = 3;",
          opts: ["19500.00", "27000.00", "15000.00", "12000.00"], a: 1, check: "SELECT SUM(quantity * price_each) FROM order_items WHERE order_id = 3;",
          why: "2 chairs x 7500 + 1 desk x 12000 = 27000." },
      ],
    },
    {
      kind: "debug", title: "Bug hunt",
      qs: [
        { task: "Each customer's total spend and total paid.",
          bad: `SELECT c.full_name,
       SUM(oi.quantity * oi.price_each) AS spent,
       SUM(pay.amount)                  AS paid
FROM customers c
JOIN orders o           ON o.customer_id = c.customer_id
JOIN order_items oi     ON oi.order_id   = o.order_id
LEFT JOIN payments pay  ON pay.order_id  = o.order_id
GROUP BY c.customer_id, c.full_name;`, silent: true,
          opts: [
            `WITH spent AS (
  SELECT o.customer_id, SUM(oi.quantity * oi.price_each) AS spent
  FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
  GROUP BY o.customer_id
), paid AS (
  SELECT o.customer_id, SUM(p.amount) AS paid
  FROM orders o JOIN payments p ON p.order_id = o.order_id
  GROUP BY o.customer_id
)
SELECT c.full_name, s.spent, COALESCE(pd.paid, 0) AS paid
FROM customers c
JOIN spent s ON s.customer_id = c.customer_id
LEFT JOIN paid pd ON pd.customer_id = c.customer_id;`,
            `SELECT c.full_name,
       SUM(DISTINCT oi.quantity * oi.price_each) AS spent,
       SUM(DISTINCT pay.amount) AS paid
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN payments pay ON pay.order_id = o.order_id
GROUP BY c.customer_id, c.full_name;`,
            `SELECT c.full_name,
       SUM(oi.quantity * oi.price_each) / 2 AS spent,
       SUM(pay.amount) / 2 AS paid
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN payments pay ON pay.order_id = o.order_id
GROUP BY c.customer_id, c.full_name;`,
            `SELECT c.full_name,
       MAX(oi.quantity * oi.price_each) AS spent,
       MAX(pay.amount) AS paid
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN payments pay ON pay.order_id = o.order_id
GROUP BY c.customer_id, c.full_name;`],
          a: 0,
          why: `No error, but Satyaki's paid total comes out as 134,296 instead of 67,498: order 1's payment was repeated on both of its item rows. SUM(DISTINCT) would merge two different payments of the same amount. Aggregate each child table on its own, then join.` },
        { task: "Add an order for a customer who does not exist yet.",
          bad: `INSERT INTO orders (customer_id, status) VALUES (7, 'PLACED');`,
          opts: [
            `INSERT INTO customers (full_name, email) VALUES ('New Buyer', 'new@mail.com');
INSERT INTO orders (customer_id, status)
SELECT customer_id, 'PLACED' FROM customers WHERE email = 'new@mail.com';`,
            `INSERT INTO orders (customer_id, status) VALUES (NULL, 'PLACED');`,
            `ALTER TABLE orders DROP CONSTRAINT fk_orders_customer;
INSERT INTO orders (customer_id, status) VALUES (7, 'PLACED');`,
            `INSERT INTO orders (order_id, customer_id, status) VALUES (7, 7, 'PLACED');`],
          a: 0,
          why: `The foreign key is right to refuse. Create the parent first, then the child. (NULL is refused by NOT NULL; dropping the constraint would invite orphans back.)` },
        { task: "Remove the Wireless Mouse from the catalogue.",
          bad: `DELETE FROM products WHERE product_name = 'Wireless Mouse';`,
          opts: [
            `UPDATE products SET stock_qty = 0 WHERE product_name = 'Wireless Mouse';`,
            `DELETE FROM products WHERE product_name = 'Wireless Mouse' CASCADE;`,
            `TRUNCATE products;`,
            `DELETE FROM order_items;
DELETE FROM products WHERE product_name = 'Wireless Mouse';`],
          a: 0,
          why: `ON DELETE RESTRICT protects the sales history: two orders contain the mouse. Stop selling it (stock 0, or an 'active' flag) instead of erasing the record of what was sold.` },
      ],
    },
    {
      kind: "recap", title: "Points to remember",
      items: [
        "A FOREIGN KEY makes orphan rows impossible. Declare them in every real schema.",
        "ON DELETE: CASCADE deletes children too; RESTRICT / NO ACTION refuses; SET NULL blanks the reference.",
        "CASCADE chains: one customer took her order, its items and its payment with her. Know the chain before you delete.",
        "A composite primary key (order_id, product_id) makes the pair unique: the natural key for a link table.",
        "PostgreSQL does not index foreign-key columns for you. Create those indexes.",
        "SERIAL = auto-increment; DEFAULT fills missing values; UNIQUE stops duplicates; CHECK blocks impossible values.",
        "Join chains follow the relationships. Use LEFT JOIN for optional links (payments), or unpaid orders vanish.",
        "Never aggregate two different child tables in one join: rows multiply and totals double. One CTE per side, then join.",
        "<code>WITH name AS (...)</code>: readable top to bottom, chainable with commas, usable like a table.",
        "COALESCE(x, 0) after a LEFT JOIN turns 'no row' into a presentable zero.",
        "Revenue reports filter on status: cancelled orders are not revenue.",
        "Top-N per group: window function in a subquery or CTE, filter rnk = 1 outside.",
        "information_schema describes the database itself.",
      ],
    },
  ],
};
