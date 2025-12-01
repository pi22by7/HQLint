use tower_lsp::lsp_types::{CompletionItem, CompletionItemKind, CompletionResponse, InsertTextFormat};

pub fn get_completions() -> CompletionResponse {
    let mut items = Vec::new();

    // Keywords
    let keywords = [
        "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
        "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "CROSS JOIN", "ON",
        "UNION", "UNION ALL", "WITH", "AS", "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN",
        "LIKE", "RLIKE", "REGEXP", "CASE", "WHEN", "THEN", "ELSE", "END",
        "INSERT INTO", "INSERT OVERWRITE", "CREATE TABLE", "DROP TABLE", "ALTER TABLE",
        "PARTITIONED BY", "STORED AS", "LOCATION", "TBLPROPERTIES",
        "TRUE", "FALSE", "NULL"
    ];

    for kw in keywords {
        items.push(CompletionItem {
            label: kw.to_string(),
            kind: Some(CompletionItemKind::KEYWORD),
            detail: Some("HQL Keyword".to_string()),
            ..Default::default()
        });
    }

    // Snippets (Ported from snippets.ts)
    items.push(create_snippet(
        "CREATE TABLE",
        "Create a new table",
        "CREATE ${1|TABLE,EXTERNAL TABLE|} ${2|IF NOT EXISTS ||}${3:table_name} (\n  ${4:column_name} ${5:data_type}${6:,}\n  ${7}\n)${8:|nPARTITIONED BY (${9:partition_column} ${10:data_type})}${11:|nSTORED AS ${12|PARQUET,ORC,AVRO,TEXTFILE|}}${13:|nLOCATION '${14:/path/to/location}'};\n$0"
    ));

    items.push(create_snippet(
        "INSERT OVERWRITE",
        "Insert overwrite into table",
        "INSERT OVERWRITE TABLE ${1:target_table}\n${2:PARTITION (${3:partition_column}=${4:value})}\nSELECT ${5:*}\nFROM ${6:source_table}\n${7:WHERE ${8:condition}};\n$0"
    ));
    
    items.push(create_snippet(
        "SELECT JOIN",
        "SELECT with JOIN",
        "SELECT ${1:t1}.${2:column1}, ${3:t2}.${4:column2}\nFROM ${5:table1} ${1:t1}\n${6|INNER,LEFT,RIGHT,FULL OUTER|} JOIN ${7:table2} ${3:t2}\n  ON ${1:t1}.${8:id} = ${3:t2}.${9:id}\n${10:WHERE ${11:condition}}\n${12:ORDER BY ${13:column}};\n$0"
    ));

    items.push(create_snippet(
        "WINDOW FUNCTION",
        "Analytical function",
        "SELECT\n  ${1:column},\n  ${2|ROW_NUMBER,RANK,DENSE_RANK,LAG,LEAD,FIRST_VALUE,LAST_VALUE|}() OVER (\n    ${3:PARTITION BY ${4:partition_column}}\n    ORDER BY ${5:order_column} ${6|ASC,DESC|}\n    ${7:ROWS BETWEEN ${8|UNBOUNDED PRECEDING,CURRENT ROW,1 PRECEDING|} AND ${9|CURRENT ROW,UNBOUNDED FOLLOWING,1 FOLLOWING|}}\n  ) AS ${10:window_result}\nFROM ${11:table_name};\n$0"
    ));

    items.push(create_snippet(
        "CASE WHEN",
        "CASE expression",
        "CASE\n  WHEN ${1:condition1} THEN ${2:result1}\n  WHEN ${3:condition2} THEN ${4:result2}\n  ${5:ELSE ${6:default_result}}\nEND AS ${7:result_column}$0"
    ));

    items.push(create_snippet(
        "LATERAL VIEW EXPLODE",
        "Explode array/map",
        "SELECT ${1:t}.${2:column}, ${3:exploded_value}\nFROM ${4:table_name} ${1:t}\nLATERAL VIEW ${5|EXPLODE,POSEXPLODE|}(${6:array_column}) ${7:exploded_table} AS ${3:exploded_value};\n$0"
    ));

    items.push(create_snippet(
        "WITH CTE",
        "Common Table Expression",
        "WITH ${1:cte_name} AS (\n  SELECT ${2:columns}\n  FROM ${3:table_name}\n  ${4:WHERE ${5:condition}} \n)${6:,\n${7:cte_name2} AS (\n  SELECT ${8:columns}\n  FROM ${9:table_name}\n)}\nSELECT ${10:*}\nFROM ${1:cte_name};\n$0"
    ));

    CompletionResponse::Array(items)
}

fn create_snippet(label: &str, detail: &str, insert_text: &str) -> CompletionItem {
    CompletionItem {
        label: label.to_string(),
        kind: Some(CompletionItemKind::SNIPPET),
        detail: Some(detail.to_string()),
        insert_text: Some(insert_text.to_string()),
        insert_text_format: Some(InsertTextFormat::SNIPPET),
        ..Default::default()
    }
}
