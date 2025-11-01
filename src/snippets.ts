import * as vscode from 'vscode';

export function getHQLSnippets(): vscode.CompletionItem[] {
    const snippets: vscode.CompletionItem[] = [];

    // CREATE TABLE snippet
    const createTable = new vscode.CompletionItem('CREATE TABLE', vscode.CompletionItemKind.Snippet);
    createTable.insertText = new vscode.SnippetString(
        'CREATE ${1|TABLE,EXTERNAL TABLE|} ${2|IF NOT EXISTS ||}${3:table_name} (\n' +
        '  ${4:column_name} ${5:data_type}${6:,}\n' +
        '  ${7}\n' +
        ')${8:\n' +
        'PARTITIONED BY (${9:partition_column} ${10:data_type})}${11:\n' +
        'STORED AS ${12|PARQUET,ORC,AVRO,TEXTFILE|}}${13:\n' +
        'LOCATION \'${14:/path/to/location}\'};\n$0'
    );
    createTable.detail = 'Create a new table';
    createTable.documentation = new vscode.MarkdownString(
        'Creates a new Hive table with optional partitioning, storage format, and location.'
    );
    snippets.push(createTable);

    // INSERT OVERWRITE snippet
    const insertOverwrite = new vscode.CompletionItem('INSERT OVERWRITE', vscode.CompletionItemKind.Snippet);
    insertOverwrite.insertText = new vscode.SnippetString(
        'INSERT OVERWRITE TABLE ${1:target_table}\n' +
        '${2:PARTITION (${3:partition_column}=${4:value})}\n' +
        'SELECT ${5:*}\n' +
        'FROM ${6:source_table}\n' +
        '${7:WHERE ${8:condition}};\n$0'
    );
    insertOverwrite.detail = 'Insert overwrite into table';
    insertOverwrite.documentation = new vscode.MarkdownString(
        'Inserts data into a table, overwriting existing data in the partition (if specified).'
    );
    snippets.push(insertOverwrite);

    // SELECT with JOIN snippet
    const selectJoin = new vscode.CompletionItem('SELECT JOIN', vscode.CompletionItemKind.Snippet);
    selectJoin.insertText = new vscode.SnippetString(
        'SELECT ${1:t1}.${2:column1}, ${3:t2}.${4:column2}\n' +
        'FROM ${5:table1} ${1:t1}\n' +
        '${6|INNER,LEFT,RIGHT,FULL OUTER|} JOIN ${7:table2} ${3:t2}\n' +
        '  ON ${1:t1}.${8:id} = ${3:t2}.${9:id}\n' +
        '${10:WHERE ${11:condition}}\n' +
        '${12:ORDER BY ${13:column}};\n$0'
    );
    selectJoin.detail = 'SELECT with JOIN';
    selectJoin.documentation = new vscode.MarkdownString(
        'SELECT query with table join.'
    );
    snippets.push(selectJoin);

    // Window function snippet
    const windowFunction = new vscode.CompletionItem('WINDOW FUNCTION', vscode.CompletionItemKind.Snippet);
    windowFunction.insertText = new vscode.SnippetString(
        'SELECT\n' +
        '  ${1:column},\n' +
        '  ${2|ROW_NUMBER,RANK,DENSE_RANK,LAG,LEAD,FIRST_VALUE,LAST_VALUE|}() OVER (\n' +
        '    ${3:PARTITION BY ${4:partition_column}}\n' +
        '    ORDER BY ${5:order_column} ${6|ASC,DESC|}\n' +
        '    ${7:ROWS BETWEEN ${8|UNBOUNDED PRECEDING,CURRENT ROW,1 PRECEDING|} AND ${9|CURRENT ROW,UNBOUNDED FOLLOWING,1 FOLLOWING|}}\n' +
        '  ) AS ${10:window_result}\n' +
        'FROM ${11:table_name};\n$0'
    );
    windowFunction.detail = 'Window/Analytical function';
    windowFunction.documentation = new vscode.MarkdownString(
        'Analytical function with OVER clause for window operations.'
    );
    snippets.push(windowFunction);

    // CASE statement snippet
    const caseStatement = new vscode.CompletionItem('CASE WHEN', vscode.CompletionItemKind.Snippet);
    caseStatement.insertText = new vscode.SnippetString(
        'CASE\n' +
        '  WHEN ${1:condition1} THEN ${2:result1}\n' +
        '  WHEN ${3:condition2} THEN ${4:result2}\n' +
        '  ${5:ELSE ${6:default_result}}\n' +
        'END AS ${7:result_column}$0'
    );
    caseStatement.detail = 'CASE WHEN statement';
    caseStatement.documentation = new vscode.MarkdownString(
        'CASE expression for conditional logic.'
    );
    snippets.push(caseStatement);

    // LATERAL VIEW EXPLODE snippet
    const lateralView = new vscode.CompletionItem('LATERAL VIEW EXPLODE', vscode.CompletionItemKind.Snippet);
    lateralView.insertText = new vscode.SnippetString(
        'SELECT ${1:t}.${2:column}, ${3:exploded_value}\n' +
        'FROM ${4:table_name} ${1:t}\n' +
        'LATERAL VIEW ${5|EXPLODE,POSEXPLODE|}(${6:array_column}) ${7:exploded_table} AS ${3:exploded_value};\n$0'
    );
    lateralView.detail = 'LATERAL VIEW with EXPLODE';
    lateralView.documentation = new vscode.MarkdownString(
        'Explode an array or map column into multiple rows.'
    );
    snippets.push(lateralView);

    // CTE (Common Table Expression) snippet
    const cte = new vscode.CompletionItem('WITH CTE', vscode.CompletionItemKind.Snippet);
    cte.insertText = new vscode.SnippetString(
        'WITH ${1:cte_name} AS (\n' +
        '  SELECT ${2:columns}\n' +
        '  FROM ${3:table_name}\n' +
        '  ${4:WHERE ${5:condition}}\n' +
        ')${6:,\n' +
        '${7:cte_name2} AS (\n' +
        '  SELECT ${8:columns}\n' +
        '  FROM ${9:table_name}\n' +
        ')}\n' +
        'SELECT ${10:*}\n' +
        'FROM ${1:cte_name};\n$0'
    );
    cte.detail = 'Common Table Expression (CTE)';
    cte.documentation = new vscode.MarkdownString(
        'WITH clause for defining temporary result sets.'
    );
    snippets.push(cte);

    // GROUP BY with aggregation snippet
    const groupBy = new vscode.CompletionItem('GROUP BY AGGREGATE', vscode.CompletionItemKind.Snippet);
    groupBy.insertText = new vscode.SnippetString(
        'SELECT\n' +
        '  ${1:group_column},\n' +
        '  ${2|COUNT,SUM,AVG,MIN,MAX|}(${3:agg_column}) AS ${4:result}\n' +
        'FROM ${5:table_name}\n' +
        '${6:WHERE ${7:condition}}\n' +
        'GROUP BY ${1:group_column}\n' +
        '${8:HAVING ${9:aggregate_condition}};\n$0'
    );
    groupBy.detail = 'GROUP BY with aggregation';
    groupBy.documentation = new vscode.MarkdownString(
        'SELECT with GROUP BY and aggregate functions.'
    );
    snippets.push(groupBy);

    // UNION snippet
    const union = new vscode.CompletionItem('UNION', vscode.CompletionItemKind.Snippet);
    union.insertText = new vscode.SnippetString(
        'SELECT ${1:columns}\n' +
        'FROM ${2:table1}\n' +
        '${3:WHERE ${4:condition1}}\n' +
        '\n' +
        'UNION ${5|ALL,|}\n' +
        '\n' +
        'SELECT ${1:columns}\n' +
        'FROM ${6:table2}\n' +
        '${7:WHERE ${8:condition2}};\n$0'
    );
    union.detail = 'UNION query';
    union.documentation = new vscode.MarkdownString(
        'Combine results from multiple SELECT statements.'
    );
    snippets.push(union);

    // PARTITION BY snippet for CREATE TABLE
    const partitionBy = new vscode.CompletionItem('PARTITIONED BY', vscode.CompletionItemKind.Snippet);
    partitionBy.insertText = new vscode.SnippetString(
        'PARTITIONED BY (${1:partition_column} ${2:data_type}${3:, ${4:partition_column2} ${5:data_type2}})$0'
    );
    partitionBy.detail = 'Table partitioning clause';
    partitionBy.documentation = new vscode.MarkdownString(
        'Define partitioning columns for a table.'
    );
    snippets.push(partitionBy);

    return snippets;
}
