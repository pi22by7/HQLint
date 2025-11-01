import * as vscode from 'vscode';

interface HQLDocumentation {
    description: string;
    syntax?: string;
    examples?: string[];
    link?: string;
}

export function getHQLDocumentation(keyword: string): vscode.MarkdownString | null {
    const upperKeyword = keyword.toUpperCase();
    const doc = hqlDocs[upperKeyword];

    if (!doc) {
        return null;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // Title
    markdown.appendMarkdown(`## ${upperKeyword}\n\n`);

    // Description
    markdown.appendMarkdown(`${doc.description}\n\n`);

    // Syntax
    if (doc.syntax) {
        markdown.appendMarkdown(`**Syntax:**\n\`\`\`hql\n${doc.syntax}\n\`\`\`\n\n`);
    }

    // Examples
    if (doc.examples && doc.examples.length > 0) {
        markdown.appendMarkdown(`**Examples:**\n`);
        doc.examples.forEach(example => {
            markdown.appendMarkdown(`\`\`\`hql\n${example}\n\`\`\`\n\n`);
        });
    }

    // Link to documentation
    if (doc.link) {
        markdown.appendMarkdown(`[📚 Apache Hive Documentation](${doc.link})\n`);
    }

    return markdown;
}

/* eslint-disable @typescript-eslint/naming-convention */
const hqlDocs: { [key: string]: HQLDocumentation } = {
    'SELECT': {
        description: 'Retrieves rows from one or more tables.',
        syntax: 'SELECT [ALL | DISTINCT] select_expr [, select_expr ...]\nFROM table_reference\n[WHERE where_condition]\n[GROUP BY col_list]\n[ORDER BY col_list]\n[LIMIT number]',
        examples: [
            'SELECT id, name, email\nFROM users\nWHERE status = \'active\';',
            'SELECT DISTINCT department\nFROM employees;',
            'SELECT COUNT(*) as total\nFROM orders;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+Select'
    },
    'FROM': {
        description: 'Specifies the table(s) to retrieve data from.',
        syntax: 'FROM table_reference [, table_reference ...]',
        examples: [
            'FROM users',
            'FROM users u\nJOIN orders o ON u.id = o.user_id'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+Select'
    },
    'WHERE': {
        description: 'Filters records based on specified conditions.',
        syntax: 'WHERE condition',
        examples: [
            'WHERE age > 18',
            'WHERE status = \'active\' AND country = \'US\'',
            'WHERE created_at BETWEEN \'2024-01-01\' AND \'2024-12-31\''
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+Select'
    },
    'JOIN': {
        description: 'Combines rows from two or more tables based on a related column.',
        syntax: '[INNER | LEFT | RIGHT | FULL OUTER | CROSS] JOIN table_reference\n  ON join_condition',
        examples: [
            'INNER JOIN orders ON users.id = orders.user_id',
            'LEFT JOIN addresses a ON u.id = a.user_id',
            'FULL OUTER JOIN departments d ON e.dept_id = d.id'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+Joins'
    },
    'GROUP BY': {
        description: 'Groups rows that have the same values in specified columns into summary rows.',
        syntax: 'GROUP BY col_list\n[HAVING condition]',
        examples: [
            'SELECT department, COUNT(*) as emp_count\nFROM employees\nGROUP BY department;',
            'SELECT product_id, SUM(quantity) as total\nFROM sales\nGROUP BY product_id\nHAVING SUM(quantity) > 100;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+GroupBy'
    },
    'ORDER BY': {
        description: 'Sorts the result set by one or more columns.',
        syntax: 'ORDER BY col_list [ASC | DESC]',
        examples: [
            'ORDER BY created_at DESC',
            'ORDER BY last_name ASC, first_name ASC',
            'ORDER BY salary DESC LIMIT 10'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+SortBy'
    },
    'PARTITION': {
        description: 'Divides a table into parts based on partition column values.',
        syntax: 'PARTITIONED BY (partition_col data_type [, ...])',
        examples: [
            'CREATE TABLE events (\n  event_id INT,\n  event_name STRING\n)\nPARTITIONED BY (year INT, month INT);',
            'INSERT OVERWRITE TABLE sales\nPARTITION (year=2024, month=10)\nSELECT * FROM staging_sales;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL-PartitionedTables'
    },
    'COUNT': {
        description: 'Returns the number of rows that match the specified criteria.',
        syntax: 'COUNT([DISTINCT] expr)\nCOUNT(*)',
        examples: [
            'SELECT COUNT(*) FROM users;',
            'SELECT COUNT(DISTINCT country) FROM users;',
            'SELECT department, COUNT(*) as emp_count\nFROM employees\nGROUP BY department;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)'
    },
    'SUM': {
        description: 'Returns the sum of all values in a numeric column.',
        syntax: 'SUM([DISTINCT] expr)',
        examples: [
            'SELECT SUM(amount) as total_sales FROM orders;',
            'SELECT product_id, SUM(quantity)\nFROM sales\nGROUP BY product_id;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)'
    },
    'AVG': {
        description: 'Returns the average value of a numeric column.',
        syntax: 'AVG([DISTINCT] expr)',
        examples: [
            'SELECT AVG(salary) as avg_salary FROM employees;',
            'SELECT department, AVG(salary) as avg_sal\nFROM employees\nGROUP BY department;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)'
    },
    'ROW_NUMBER': {
        description: 'Assigns a unique sequential integer to rows within a partition, starting from 1.',
        syntax: 'ROW_NUMBER() OVER ([PARTITION BY col] ORDER BY col)',
        examples: [
            'SELECT\n  name,\n  salary,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) as rank\nFROM employees;',
            'SELECT\n  department,\n  name,\n  ROW_NUMBER() OVER (\n    PARTITION BY department\n    ORDER BY salary DESC\n  ) as dept_rank\nFROM employees;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'RANK': {
        description: 'Returns the rank of each row within a partition, with gaps in ranking for ties.',
        syntax: 'RANK() OVER ([PARTITION BY col] ORDER BY col)',
        examples: [
            'SELECT\n  name,\n  score,\n  RANK() OVER (ORDER BY score DESC) as rank\nFROM students;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'DENSE_RANK': {
        description: 'Returns the rank of each row within a partition, without gaps in ranking.',
        syntax: 'DENSE_RANK() OVER ([PARTITION BY col] ORDER BY col)',
        examples: [
            'SELECT\n  name,\n  score,\n  DENSE_RANK() OVER (ORDER BY score DESC) as rank\nFROM students;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'LAG': {
        description: 'Accesses data from a previous row in the same result set.',
        syntax: 'LAG(expr [, offset [, default]]) OVER ([PARTITION BY col] ORDER BY col)',
        examples: [
            'SELECT\n  date,\n  revenue,\n  LAG(revenue, 1) OVER (ORDER BY date) as prev_revenue\nFROM daily_sales;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'LEAD': {
        description: 'Accesses data from a following row in the same result set.',
        syntax: 'LEAD(expr [, offset [, default]]) OVER ([PARTITION BY col] ORDER BY col)',
        examples: [
            'SELECT\n  date,\n  revenue,\n  LEAD(revenue, 1) OVER (ORDER BY date) as next_revenue\nFROM daily_sales;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'OVER': {
        description: 'Defines a window or set of rows for window functions.',
        syntax: 'function() OVER (\n  [PARTITION BY partition_expr]\n  [ORDER BY sort_expr]\n  [ROWS|RANGE BETWEEN frame_start AND frame_end]\n)',
        examples: [
            'OVER (PARTITION BY department ORDER BY salary DESC)',
            'OVER (ORDER BY date ROWS BETWEEN 3 PRECEDING AND CURRENT ROW)'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics'
    },
    'CASE': {
        description: 'Evaluates a list of conditions and returns one of multiple possible result expressions.',
        syntax: 'CASE\n  WHEN condition1 THEN result1\n  WHEN condition2 THEN result2\n  [ELSE default_result]\nEND',
        examples: [
            'CASE\n  WHEN age < 18 THEN \'Minor\'\n  WHEN age >= 18 AND age < 65 THEN \'Adult\'\n  ELSE \'Senior\'\nEND as age_group',
            'CASE status\n  WHEN 1 THEN \'Active\'\n  WHEN 2 THEN \'Inactive\'\n  ELSE \'Unknown\'\nEND'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-ConditionalFunctions'
    },
    'LATERAL VIEW': {
        description: 'Used with table-generating functions like EXPLODE to generate multiple rows from a single input row.',
        syntax: 'LATERAL VIEW [OUTER] table_function(expr) table_alias AS column_alias',
        examples: [
            'SELECT user_id, tag\nFROM users\nLATERAL VIEW EXPLODE(tags) tags_table AS tag;',
            'SELECT name, product\nFROM customers\nLATERAL VIEW EXPLODE(purchases) p AS product;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+LateralView'
    },
    'EXPLODE': {
        description: 'Takes an array or map and creates a new row for each element.',
        syntax: 'EXPLODE(array_or_map)',
        examples: [
            'SELECT EXPLODE(array_column) as element FROM table;',
            'SELECT user_id, item\nFROM purchases\nLATERAL VIEW EXPLODE(items) items_table AS item;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inTable-GeneratingFunctions(UDTF)'
    },
    'COLLECT_LIST': {
        description: 'Returns an array of all values from a group, including duplicates.',
        syntax: 'COLLECT_LIST(expr)',
        examples: [
            'SELECT user_id, COLLECT_LIST(product_id) as products\nFROM purchases\nGROUP BY user_id;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)'
    },
    'COLLECT_SET': {
        description: 'Returns an array of unique values from a group.',
        syntax: 'COLLECT_SET(expr)',
        examples: [
            'SELECT user_id, COLLECT_SET(category) as categories\nFROM purchases\nGROUP BY user_id;'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-Built-inAggregateFunctions(UDAF)'
    },
    'CAST': {
        description: 'Converts a value from one data type to another.',
        syntax: 'CAST(expr AS data_type)',
        examples: [
            'CAST(\'123\' AS INT)',
            'CAST(timestamp_col AS DATE)',
            'CAST(price AS DECIMAL(10,2))'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-TypeConversionFunctions'
    },
    'CONCAT': {
        description: 'Concatenates two or more strings together.',
        syntax: 'CONCAT(str1, str2, ...)',
        examples: [
            'CONCAT(first_name, \' \', last_name) as full_name',
            'CONCAT(\'User: \', username)'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-StringFunctions'
    },
    'SUBSTRING': {
        description: 'Extracts a substring from a string.',
        syntax: 'SUBSTRING(str, start_position [, length])\nSUBSTR(str, start_position [, length])',
        examples: [
            'SUBSTRING(email, 1, INSTR(email, \'@\') - 1) as username',
            'SUBSTR(phone, 1, 3) as area_code'
        ],
        link: 'https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF#LanguageManualUDF-StringFunctions'
    }
};
/* eslint-enable @typescript-eslint/naming-convention */
