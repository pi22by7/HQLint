-- Test file with intentional errors for linting

-- Lowercase keywords (should trigger warning)
select * from users where id = 1;

-- Missing semicolon (should trigger information)
SELECT name FROM users

-- Unclosed string literal (should trigger error)
SELECT * FROM users WHERE name = 'John

-- Unbalanced parentheses (should trigger error)
SELECT COUNT(*) FROM (SELECT * FROM users;

-- JOIN without ON clause (should trigger warning)
SELECT * FROM users
JOIN orders;

-- GROUP BY without aggregate (should trigger information)
SELECT department
FROM employees
GROUP BY department;

-- Multiple issues in one query
select id, name from users where status = 'active'
join orders on users.id = orders.user_id
group by id

-- Correct query for comparison
SELECT 
  id,
  name,
  COUNT(*) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE status = 'active'
GROUP BY id, name;
