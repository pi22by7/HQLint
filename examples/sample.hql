-- Example HQL file for testing the extension
-- This file demonstrates various HQL features

-- Simple SELECT query
select id, name, email
from users
where status = 'active';

-- Query with JOINs
SELECT u.id, u.name, o.order_date, o.total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.order_date >= '2024-01-01'
ORDER BY o.order_date DESC;

-- Aggregation with GROUP BY
SELECT 
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary,
  MAX(salary) as max_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;

-- Subquery example
SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total_amount > 1000
);

-- CREATE TABLE with partitioning
CREATE EXTERNAL TABLE IF NOT EXISTS sales (
  sale_id INT,
  product_name STRING,
  amount DOUBLE,
  sale_date TIMESTAMP
)
PARTITIONED BY (year INT, month INT)
STORED AS PARQUET
LOCATION '/data/sales/';

-- INSERT with OVERWRITE
INSERT OVERWRITE TABLE sales
PARTITION (year=2024, month=10)
SELECT 
  sale_id,
  product_name,
  amount,
  sale_date
FROM staging_sales
WHERE YEAR(sale_date) = 2024 AND MONTH(sale_date) = 10;

-- Window functions
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees;

-- CASE statement
SELECT
  product_id,
  product_name,
  price,
  CASE
    WHEN price < 10 THEN 'cheap'
    WHEN price >= 10 AND price < 50 THEN 'moderate'
    WHEN price >= 50 THEN 'expensive'
    ELSE 'unknown'
  END as price_category
FROM products;

-- Complex JOIN with multiple conditions
SELECT
  c.customer_id,
  c.customer_name,
  o.order_id,
  p.product_name,
  oi.quantity,
  oi.price
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.status = 'active';

-- Array and Map functions
SELECT
  user_id,
  COLLECT_LIST(product_id) as purchased_products,
  COLLECT_SET(category) as categories,
  SIZE(COLLECT_LIST(product_id)) as total_purchases
FROM user_purchases
GROUP BY user_id;

-- Lateral view with explode
SELECT
  user_id,
  product
FROM users
LATERAL VIEW EXPLODE(favorite_products) exploded_table AS product;
