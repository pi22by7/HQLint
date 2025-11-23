import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Linting Rules - Multiline Queries Test Suite', () => {
    vscode.window.showInformationMessage('Starting multiline linting rules tests.');

    const waitForLinting = () => new Promise(resolve => setTimeout(resolve, 1000));

    async function createDocument(content: string): Promise<vscode.TextDocument> {
        const doc = await vscode.workspace.openTextDocument({
            language: 'hql',
            content
        });
        await vscode.window.showTextDocument(doc);
        await waitForLinting();
        return doc;
    }

    function getDiagnosticMessages(doc: vscode.TextDocument): string[] {
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        return diagnostics.map(d => d.message);
    }

    suite('MissingCommaRule - Multiline SELECT', () => {
        test('Should NOT flag multiline SELECT with proper commas', async function() {
            this.timeout(10000);

            const content = `SELECT
  id,
  name,
  email
FROM users;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            assert.strictEqual(hasCommaWarning, false, 'Should not flag properly formatted multiline SELECT');
        });

        test('Should NOT flag SELECT keyword line', async function() {
            this.timeout(10000);

            const content = `SELECT
  department,
  COUNT(*) as count
FROM employees;`;

            const doc = await createDocument(content);
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Check that the SELECT line (line 0) doesn't have a comma warning
            const selectLineCommaWarning = diagnostics.some(d =>
                d.range.start.line === 0 && d.message.includes('comma')
            );
            assert.strictEqual(selectLineCommaWarning, false, 'Should not flag SELECT keyword line for missing comma');
        });

        test('Should NOT flag WHERE clause lines', async function() {
            this.timeout(10000);

            const content = `SELECT *
FROM orders
WHERE status = 'completed'
  AND order_date >= '2024-01-01'
  AND total_amount > 100;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            assert.strictEqual(hasCommaWarning, false, 'Should not flag WHERE clause lines for missing commas');
        });

        test('Should NOT flag JOIN ON conditions', async function() {
            this.timeout(10000);

            const content = `SELECT u.id, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
  AND o.status = 'active'
  AND o.date > '2024-01-01';`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            assert.strictEqual(hasCommaWarning, false, 'Should not flag JOIN ON conditions for missing commas');
        });

        test('Should NOT flag CASE statement lines', async function() {
            this.timeout(10000);

            const content = `SELECT
  product_id,
  CASE
    WHEN price < 10 THEN 'cheap'
    WHEN price >= 10 AND price < 50 THEN 'moderate'
    ELSE 'expensive'
  END as price_category
FROM products;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            assert.strictEqual(hasCommaWarning, false, 'Should not flag CASE statement lines for missing commas');
        });

        test('SHOULD flag actual missing comma in SELECT list', async function() {
            this.timeout(10000);

            const content = `SELECT
  id
  name
FROM users;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasCommaWarning = messages.some(m =>
                m.includes('comma')
            );
            assert.ok(hasCommaWarning, 'Should detect actual missing comma between id and name');
        });
    });

    suite('ParenthesesRule - Multiline Queries', () => {
        test('Should NOT flag multiline subquery with balanced parentheses', async function() {
            this.timeout(10000);

            const content = `SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total_amount > 1000
);`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasParenWarning = messages.some(m =>
                m.includes('parenthes')
            );
            assert.strictEqual(hasParenWarning, false, 'Should not flag balanced parentheses in multiline subquery');
        });

        test('Should NOT flag partition definition parentheses', async function() {
            this.timeout(10000);

            const content = `CREATE TABLE sales (
  sale_id INT,
  product_name STRING
)
PARTITIONED BY (year INT, month INT)
STORED AS PARQUET;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasParenWarning = messages.some(m =>
                m.includes('parenthes')
            );
            assert.strictEqual(hasParenWarning, false, 'Should not flag balanced parentheses in partition definition');
        });

        test('Should NOT flag window function parentheses', async function() {
            this.timeout(10000);

            const content = `SELECT
  employee_id,
  ROW_NUMBER() OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) as rank
FROM employees;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasParenWarning = messages.some(m =>
                m.includes('parenthes')
            );
            assert.strictEqual(hasParenWarning, false, 'Should not flag balanced parentheses in window function');
        });

        test('SHOULD flag unbalanced parentheses in entire document', async function() {
            this.timeout(10000);

            const content = `SELECT *
FROM users
WHERE (id = 1;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasParenWarning = messages.some(m =>
                m.includes('parenthes')
            );
            assert.ok(hasParenWarning, 'Should detect unbalanced parentheses in document');
        });
    });

    suite('SemicolonRule - DDL and Subqueries', () => {
        test('Should NOT flag WHERE clause with opening parenthesis for subquery', async function() {
            this.timeout(10000);

            const content = `SELECT *
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total_amount > 1000
)
AND created_date > '2024-01-01';`;

            const doc = await createDocument(content);
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Check line 2 (WHERE id IN () doesn't have semicolon warning
            const whereLineWarning = diagnostics.some(d =>
                d.range.start.line === 2 && d.message.includes('semicolon')
            );
            assert.strictEqual(whereLineWarning, false, 'Should not flag WHERE clause with opening paren as missing semicolon');

            // Also check no lines inside the subquery are flagged
            const subqueryLinesWarning = diagnostics.some(d =>
                (d.range.start.line >= 3 && d.range.start.line <= 5) && d.message.includes('semicolon')
            );
            assert.strictEqual(subqueryLinesWarning, false, 'Should not flag lines inside subquery for missing semicolon');
        });

        test('Should NOT flag line ending with closing parenthesis', async function() {
            this.timeout(10000);

            const content = `SELECT *
FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE status = 'active'
)
AND created_date > '2024-01-01';`;

            const doc = await createDocument(content);
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Check line 4 (the `)` line) doesn't have semicolon warning
            const closingParenLineWarning = diagnostics.some(d =>
                d.range.start.line === 4 && d.message.includes('semicolon')
            );
            assert.strictEqual(closingParenLineWarning, false, 'Should not flag closing parenthesis line for missing semicolon');
        });

        test('Should NOT flag partition definition line', async function() {
            this.timeout(10000);

            const content = `CREATE TABLE sales (
  sale_id INT,
  product_name STRING
)
PARTITIONED BY (year INT, month INT)
STORED AS PARQUET
LOCATION '/data/sales/';`;

            const doc = await createDocument(content);
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Check line 4 (PARTITIONED BY line) doesn't have semicolon warning
            const partitionLineWarning = diagnostics.some(d =>
                d.range.start.line === 4 && d.message.includes('semicolon')
            );
            assert.strictEqual(partitionLineWarning, false, 'Should not flag PARTITIONED BY line for missing semicolon');
        });

        test('Should NOT flag STORED AS line when followed by LOCATION', async function() {
            this.timeout(10000);

            const content = `CREATE TABLE test_table (
  id INT
)
STORED AS PARQUET
LOCATION '/data/test/';`;

            const doc = await createDocument(content);
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Check STORED AS line doesn't have semicolon warning
            const storedAsLineWarning = diagnostics.some(d =>
                d.range.start.line === 3 && d.message.includes('semicolon')
            );
            assert.strictEqual(storedAsLineWarning, false, 'Should not flag STORED AS line when followed by LOCATION');
        });

        test('SHOULD flag missing semicolon between two queries', async function() {
            this.timeout(10000);

            const content = `SELECT * FROM users WHERE id = 1

SELECT * FROM orders WHERE status = 'active';`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasSemicolonWarning = messages.some(m =>
                m.includes('semicolon')
            );
            assert.ok(hasSemicolonWarning, 'Should detect missing semicolon between two queries');
        });

        test('SHOULD flag missing semicolon at end of file', async function() {
            this.timeout(10000);

            const content = `SELECT * FROM users WHERE id = 1`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            const hasSemicolonWarning = messages.some(m =>
                m.includes('semicolon')
            );
            assert.ok(hasSemicolonWarning, 'Should detect missing semicolon at end of file');
        });
    });

    suite('Complex Multi-Query Files', () => {
        test('Should handle file with multiple complete queries', async function() {
            this.timeout(10000);

            const content = `SELECT id, name FROM users WHERE status = 'active';

SELECT department, COUNT(*) FROM employees GROUP BY department;

SELECT * FROM orders WHERE total > 100;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            // Should not have any false positives
            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            const hasParenWarning = messages.some(m =>
                m.includes('parenthes')
            );
            const hasSemicolonWarning = messages.some(m =>
                m.includes('semicolon')
            );

            assert.strictEqual(hasCommaWarning, false, 'Should not have comma warnings');
            assert.strictEqual(hasParenWarning, false, 'Should not have parentheses warnings');
            assert.strictEqual(hasSemicolonWarning, false, 'Should not have semicolon warnings');
        });

        test('Should handle complex nested query with CTE', async function() {
            this.timeout(10000);

            const content = `WITH active_users AS (
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
GROUP BY au.name;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            // Should not have any false positives for multiline constructs
            const hasCommaWarning = messages.some(m =>
                m.includes('comma') && m.includes('column')
            );
            assert.strictEqual(hasCommaWarning, false, 'Should not have false positive comma warnings in CTE query');
        });

        test('Should handle 150+ line complex query with multiple nested subqueries', async function() {
            this.timeout(15000);

            // Large, complex real-world query with CTEs, subqueries, window functions, CASE statements
            const content = `-- Complex analytics query with multiple CTEs and nested subqueries
WITH user_base AS (
  SELECT
    u.user_id,
    u.username,
    u.email,
    u.registration_date,
    u.country_code,
    u.subscription_tier,
    CASE
      WHEN u.subscription_tier = 'premium' THEN 1.5
      WHEN u.subscription_tier = 'plus' THEN 1.2
      ELSE 1.0
    END as tier_multiplier
  FROM users u
  WHERE u.status = 'active'
    AND u.registration_date >= '2020-01-01'
    AND u.email_verified = TRUE
),
purchase_metrics AS (
  SELECT
    p.user_id,
    COUNT(DISTINCT p.order_id) as total_orders,
    SUM(p.amount) as total_spent,
    AVG(p.amount) as avg_order_value,
    MIN(p.purchase_date) as first_purchase,
    MAX(p.purchase_date) as last_purchase,
    COUNT(DISTINCT DATE_FORMAT(p.purchase_date, 'yyyy-MM')) as active_months,
    SUM(
      CASE
        WHEN p.product_category = 'electronics' THEN p.amount
        ELSE 0
      END
    ) as electronics_spend,
    SUM(
      CASE
        WHEN p.product_category = 'clothing' THEN p.amount
        ELSE 0
      END
    ) as clothing_spend,
    SUM(
      CASE
        WHEN p.product_category = 'food' THEN p.amount
        ELSE 0
      END
    ) as food_spend
  FROM purchases p
  WHERE p.status = 'completed'
    AND p.refunded = FALSE
  GROUP BY p.user_id
),
engagement_scores AS (
  SELECT
    e.user_id,
    COUNT(*) as total_sessions,
    SUM(e.duration_seconds) as total_engagement_time,
    AVG(e.duration_seconds) as avg_session_duration,
    COUNT(DISTINCT e.feature_used) as features_explored,
    MAX(e.timestamp) as last_active,
    ROW_NUMBER() OVER (
      PARTITION BY e.user_id
      ORDER BY e.timestamp DESC
    ) as recency_rank,
    PERCENT_RANK() OVER (
      ORDER BY COUNT(*)
    ) as engagement_percentile
  FROM engagement_events e
  WHERE e.timestamp >= ADD_MONTHS(CURRENT_DATE(), -6)
  GROUP BY e.user_id
),
support_interactions AS (
  SELECT
    t.user_id,
    COUNT(*) as total_tickets,
    SUM(
      CASE
        WHEN t.priority = 'high' THEN 1
        ELSE 0
      END
    ) as high_priority_tickets,
    AVG(t.resolution_hours) as avg_resolution_time,
    MAX(t.satisfaction_score) as max_satisfaction,
    MIN(t.satisfaction_score) as min_satisfaction
  FROM support_tickets t
  WHERE t.created_date >= ADD_MONTHS(CURRENT_DATE(), -12)
  GROUP BY t.user_id
),
referral_data AS (
  SELECT
    r.referrer_user_id as user_id,
    COUNT(DISTINCT r.referred_user_id) as total_referrals,
    COUNT(
      DISTINCT CASE
        WHEN r.referred_user_converted = TRUE THEN r.referred_user_id
        ELSE NULL
      END
    ) as converted_referrals,
    SUM(r.referral_bonus_amount) as total_referral_earnings
  FROM referrals r
  WHERE r.referral_date >= ADD_MONTHS(CURRENT_DATE(), -12)
  GROUP BY r.referrer_user_id
)
SELECT
  ub.user_id,
  ub.username,
  ub.email,
  ub.country_code,
  ub.subscription_tier,
  DATEDIFF(CURRENT_DATE(), ub.registration_date) as days_since_registration,
  COALESCE(pm.total_orders, 0) as total_orders,
  COALESCE(pm.total_spent, 0.0) * ub.tier_multiplier as weighted_total_spent,
  COALESCE(pm.avg_order_value, 0.0) as avg_order_value,
  COALESCE(pm.active_months, 0) as active_purchase_months,
  COALESCE(pm.electronics_spend, 0.0) as electronics_spend,
  COALESCE(pm.clothing_spend, 0.0) as clothing_spend,
  COALESCE(pm.food_spend, 0.0) as food_spend,
  COALESCE(es.total_sessions, 0) as total_sessions,
  COALESCE(es.total_engagement_time, 0) as total_engagement_seconds,
  COALESCE(es.avg_session_duration, 0.0) as avg_session_duration,
  COALESCE(es.features_explored, 0) as features_explored,
  COALESCE(es.engagement_percentile, 0.0) as engagement_percentile,
  DATEDIFF(CURRENT_DATE(), es.last_active) as days_since_last_active,
  COALESCE(si.total_tickets, 0) as support_tickets_count,
  COALESCE(si.high_priority_tickets, 0) as high_priority_tickets,
  COALESCE(si.avg_resolution_time, 0.0) as avg_support_resolution_hours,
  COALESCE(rd.total_referrals, 0) as total_referrals,
  COALESCE(rd.converted_referrals, 0) as converted_referrals,
  COALESCE(rd.total_referral_earnings, 0.0) as referral_earnings,
  CASE
    WHEN COALESCE(pm.total_spent, 0) > 10000 AND COALESCE(es.engagement_percentile, 0) > 0.8 THEN 'VIP'
    WHEN COALESCE(pm.total_spent, 0) > 5000 AND COALESCE(es.total_sessions, 0) > 100 THEN 'High Value'
    WHEN COALESCE(pm.total_orders, 0) > 10 THEN 'Regular'
    WHEN COALESCE(es.total_sessions, 0) > 20 THEN 'Engaged'
    ELSE 'New'
  END as user_segment,
  CASE
    WHEN DATEDIFF(CURRENT_DATE(), COALESCE(es.last_active, ub.registration_date)) > 90 THEN 'Churned'
    WHEN DATEDIFF(CURRENT_DATE(), COALESCE(es.last_active, ub.registration_date)) > 30 THEN 'At Risk'
    WHEN COALESCE(es.total_sessions, 0) > 50 THEN 'Highly Active'
    ELSE 'Active'
  END as activity_status
FROM user_base ub
LEFT JOIN purchase_metrics pm ON ub.user_id = pm.user_id
LEFT JOIN engagement_scores es ON ub.user_id = es.user_id
LEFT JOIN support_interactions si ON ub.user_id = si.user_id
LEFT JOIN referral_data rd ON ub.user_id = rd.user_id
WHERE (
  COALESCE(pm.total_spent, 0) > 100
  OR COALESCE(es.total_sessions, 0) > 10
  OR COALESCE(rd.total_referrals, 0) > 0
)
ORDER BY
  CASE
    WHEN COALESCE(pm.total_spent, 0) > 10000 THEN 1
    WHEN COALESCE(es.engagement_percentile, 0) > 0.9 THEN 2
    ELSE 3
  END,
  weighted_total_spent DESC,
  total_sessions DESC
LIMIT 10000;`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            // Should not have false positives in this complex query
            const hasInvalidCommaWarning = messages.filter(m =>
                m.includes('comma') && m.includes('column')
            ).length;
            const hasInvalidParenWarning = messages.filter(m =>
                m.includes('parenthes')
            ).length;
            const hasInvalidSemicolonWarning = messages.filter(m =>
                m.includes('semicolon')
            ).length;

            // Large queries should not produce false positives
            assert.strictEqual(hasInvalidCommaWarning, 0, 'Should not have false comma warnings in 150+ line query');
            assert.strictEqual(hasInvalidParenWarning, 0, 'Should not have false parentheses warnings in 150+ line query');
            assert.strictEqual(hasInvalidSemicolonWarning, 0, 'Should not have false semicolon warnings in 150+ line query');
        });

        test('Should handle file with 5+ different complex queries', async function() {
            this.timeout(15000);

            const content = `-- Query 1: User analytics
SELECT user_id, COUNT(*) FROM orders GROUP BY user_id;

-- Query 2: Product inventory with subquery
SELECT
  p.product_id,
  p.product_name,
  i.quantity
FROM products p
LEFT JOIN inventory i ON p.product_id = i.product_id
WHERE p.category IN (
  SELECT category_id FROM categories WHERE active = TRUE
);

-- Query 3: Window function for ranking
SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM employees;

-- Query 4: Complex CTE with multiple joins
WITH recent_orders AS (
  SELECT
    order_id,
    user_id,
    total_amount
  FROM orders
  WHERE order_date >= '2024-01-01'
)
SELECT
  u.username,
  COUNT(ro.order_id) as order_count,
  SUM(ro.total_amount) as total_spent
FROM users u
INNER JOIN recent_orders ro ON u.user_id = ro.user_id
GROUP BY u.username
HAVING COUNT(ro.order_id) > 5;

-- Query 5: DDL with partition
CREATE TABLE IF NOT EXISTS sales_data (
  sale_id BIGINT,
  product_id INT,
  amount DECIMAL(10,2),
  sale_timestamp TIMESTAMP
)
PARTITIONED BY (year INT, month INT, day INT)
STORED AS PARQUET
LOCATION '/warehouse/sales/';`;

            const doc = await createDocument(content);
            const messages = getDiagnosticMessages(doc);

            // Should handle multiple queries without false positives
            const hasInvalidWarnings = messages.filter(m =>
                (m.includes('comma') || m.includes('parenthes') || m.includes('semicolon'))
                && !m.includes('keyword') // Exclude keyword casing warnings
            ).length;

            assert.strictEqual(hasInvalidWarnings, 0, 'Should not have false positives across multiple different queries');
        });
    });
});
