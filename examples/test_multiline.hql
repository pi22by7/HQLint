-- Test file for multiline statement linting
-- These should NOT trigger missing comma warnings

-- Test 1: Simple multiline SELECT (line 17 scenario)
SELECT
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary
FROM employees;

-- Test 2: WHERE clause with multiple conditions
SELECT *
FROM users
WHERE status = 'active'
  AND created_date > '2024-01-01'
  AND department = 'engineering';

-- Test 3: JOIN with ON conditions
SELECT u.id, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
  AND o.status = 'completed'
  AND o.date > '2024-01-01';

-- Test 4: CASE statement
SELECT
  product_id,
  CASE
    WHEN price < 10 THEN 'cheap'
    WHEN price >= 10 AND price < 50 THEN 'moderate'
    ELSE 'expensive'
  END as price_category
FROM products;

-- Test 5: Subquery
SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total > 100
);

-- Test 6: Complex nested query
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
GROUP BY au.name;

-- Test 7: This SHOULD trigger warning (actual missing comma)
SELECT
  id
  name
FROM users;

-- Test 8: Window function
SELECT
  employee_id,
  department,
  ROW_NUMBER() OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as rank
FROM employees;
