-- Comprehensive test file for all linting rules
-- This should trigger NO false positives for multiline statements

-- Test 1: Multi-query file with proper semicolons (should pass)
SELECT id, name FROM users WHERE status = 'active';

SELECT department, COUNT(*) FROM employees GROUP BY department;

-- Test 2: Multiline SELECT with proper commas (should pass)
SELECT
  id,
  name,
  email,
  created_date
FROM users;

-- Test 3: WHERE clause spanning multiple lines (should NOT trigger missing comma)
SELECT *
FROM orders
WHERE status = 'completed'
  AND order_date >= '2024-01-01'
  AND total_amount > 100;

-- Test 4: JOIN with multiline ON condition (should NOT trigger missing comma)
SELECT u.id, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
  AND o.status = 'active'
  AND o.date > '2024-01-01';

-- Test 5: Multiline subquery with parentheses (should NOT trigger unbalanced parens or missing semicolon on closing paren)
SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total_amount > 1000
    AND status = 'completed'
)
AND created_date > '2024-01-01';

-- Test 6: CASE statement (should NOT trigger missing comma)
SELECT
  product_id,
  price,
  CASE
    WHEN price < 10 THEN 'cheap'
    WHEN price >= 10 AND price < 50 THEN 'moderate'
    WHEN price >= 50 THEN 'expensive'
    ELSE 'unknown'
  END as price_category
FROM products;

-- Test 7: Window function spanning multiple lines (should pass)
SELECT
  employee_id,
  department,
  ROW_NUMBER() OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as rank
FROM employees;

-- Test 8: CREATE TABLE with multiline definition and partition (should NOT flag semicolon on partition line)
CREATE TABLE IF NOT EXISTS sales (
  sale_id INT,
  product_name STRING,
  amount DOUBLE
)
PARTITIONED BY (year INT, month INT)
STORED AS PARQUET
LOCATION '/data/sales/';

-- Test 9: Multi-line INSERT with partition (should pass)
INSERT OVERWRITE TABLE sales
PARTITION (year=2024, month=10)
SELECT
  sale_id,
  product_name,
  amount
FROM staging_sales
WHERE year = 2024 AND month = 10;

-- Test 10: Complex nested query (should pass)
WITH active_users AS (
  SELECT
    id,
    name,
    email
  FROM users
  WHERE status = 'active'
)
SELECT
  au.name,
  COUNT(o.id) as order_count
FROM active_users au
LEFT JOIN orders o ON au.id = o.user_id
WHERE o.date >= '2024-01-01'
GROUP BY au.name
HAVING COUNT(o.id) > 5;

-- Test 11: INTENTIONAL ERROR - Missing comma in SELECT list (SHOULD trigger warning)
SELECT
  id
  name
FROM users;

-- Test 12: INTENTIONAL ERROR - Missing semicolon between queries (SHOULD trigger info)
SELECT * FROM users WHERE id = 1

SELECT * FROM orders WHERE status = 'active';

-- Test 13: Hive variables (should pass if valid)
SELECT * FROM ${hiveconf:table_name} WHERE date = '${hiveconf:target_date}';

-- Test 14: Block comments (should be ignored by linter)
/*
 * This is a multi-line comment
 * It should be ignored by all linting rules
 */
SELECT * FROM users;

-- Test 15: Inline block comment (should be handled correctly)
SELECT id, /* this is a comment */ name FROM users;

-- Test 16: Subquery ending with `);` (should NOT flag the `)` line for missing semicolon)
SELECT *
FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE status = 'active'
);

-- Test 17: Partition definition followed by another DDL clause (should NOT flag PARTITIONED line)
CREATE TABLE test_table (
  id INT,
  name STRING
)
PARTITIONED BY (dt STRING)
STORED AS ORC;
