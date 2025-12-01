use tower_lsp::lsp_types::{Diagnostic, DiagnosticSeverity, Position, Range, NumberOrString};
use sqlparser::dialect::HiveDialect;
use sqlparser::tokenizer::{Tokenizer, Token, TokenWithSpan};
use regex::Regex;
use std::sync::OnceLock;
use crate::config::LintingConfig;

pub fn lint(text: &str, config: &LintingConfig) -> Vec<Diagnostic> {
    if !config.enabled {
        return vec![];
    }

    // Check file size
    if text.len() as u64 > config.max_file_size {
        return vec![];
    }

    let mut diagnostics = Vec::new();

    // 1. Text-based checks
    if config.rules.trailing_whitespace {
        diagnostics.extend(check_trailing_whitespace(text));
    }
    if config.rules.hive_variable {
        diagnostics.extend(check_hive_variables(text));
    }

    // 2. Tokenization
    let dialect = HiveDialect {};
    let tokens_result = Tokenizer::new(&dialect, text).tokenize_with_location();

    match tokens_result {
        Ok(tokens) => {
            // 3. Token-based checks
            if config.rules.keyword_casing {
                diagnostics.extend(check_keyword_casing(&tokens));
            }
            if config.rules.semicolon {
                diagnostics.extend(check_semicolons(&tokens));
            }
            if config.rules.parentheses {
                diagnostics.extend(check_parentheses(&tokens));
            }
            if config.rules.missing_comma {
                diagnostics.extend(check_missing_comma(&tokens, text));
            }
        }
        Err(e) => {
            // Tokenizer error (e.g. unclosed string)
            if config.rules.string_literal {
                let msg = e.to_string();
                diagnostics.push(Diagnostic {
                    range: Range::default(), 
                    severity: Some(DiagnosticSeverity::ERROR),
                    source: Some("hql-ls".to_string()),
                    message: msg,
                    ..Default::default()
                });
            }
        }
    }

    // Filter/Map severity based on config.severity if needed
    // For now, we stick to rule-defined severities but could override.

    diagnostics
}

// --- Text Based Rules ---

fn check_trailing_whitespace(text: &str) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    for (i, line) in text.lines().enumerate() {
        if line.ends_with(' ') || line.ends_with('\t') {
            let trimmed = line.trim_end();
            let range = Range {
                start: Position {
                    line: i as u32,
                    character: trimmed.len() as u32,
                },
                end: Position {
                    line: i as u32,
                    character: line.len() as u32,
                },
            };
            
            diagnostics.push(Diagnostic {
                range,
                severity: Some(DiagnosticSeverity::HINT),
                code: Some(NumberOrString::String("trailing-whitespace".to_string())),
                source: Some("hql-ls".to_string()),
                message: "Trailing whitespace".to_string(),
                ..Default::default()
            });
        }
    }
    diagnostics
}

fn check_hive_variables(text: &str) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    // Regex to find ${...}
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"\$\{([^}]*)\}").unwrap());
    
    // Valid namespaces: hiveconf, hivevar, env, system, define
    let valid_namespaces = ["hiveconf", "hivevar", "env", "system", "define"];

    for (i, line) in text.lines().enumerate() {
        for cap in re.captures_iter(line) {
            if let Some(full_match) = cap.get(0) {
                let inner_content = &cap[1]; // content inside ${...}
                let start_col = full_match.start();
                let end_col = full_match.end();
                
                let range = Range {
                    start: Position { line: i as u32, character: start_col as u32 },
                    end: Position { line: i as u32, character: end_col as u32 },
                };

                if inner_content.trim().is_empty() {
                     diagnostics.push(Diagnostic {
                        range,
                        severity: Some(DiagnosticSeverity::WARNING),
                        source: Some("hql-ls".to_string()),
                        message: "Empty Hive variable".to_string(),
                        ..Default::default()
                    });
                    continue;
                }

                if !inner_content.contains(':') {
                     diagnostics.push(Diagnostic {
                        range,
                        severity: Some(DiagnosticSeverity::WARNING),
                        source: Some("hql-ls".to_string()),
                        message: "Invalid Hive variable: missing colon (expected ${namespace:name})".to_string(),
                        ..Default::default()
                    });
                    continue;
                }

                let parts: Vec<&str> = inner_content.splitn(2, ':').collect();
                let namespace = parts[0];
                let varname = parts[1];

                if !valid_namespaces.contains(&namespace) {
                     diagnostics.push(Diagnostic {
                        range,
                        severity: Some(DiagnosticSeverity::WARNING),
                        source: Some("hql-ls".to_string()),
                        message: format!("Invalid namespace '{}'. Expected: {:?}", namespace, valid_namespaces),
                        ..Default::default()
                    });
                } else if varname.trim().is_empty() {
                     diagnostics.push(Diagnostic {
                        range,
                        severity: Some(DiagnosticSeverity::WARNING),
                        source: Some("hql-ls".to_string()),
                        message: "Variable name is empty".to_string(),
                        ..Default::default()
                    });
                }
            }
        }
    }
    diagnostics
}

// --- Token Based Rules ---

fn check_keyword_casing(tokens: &[TokenWithSpan]) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    for token_with_span in tokens {
        if let Token::Word(word) = &token_with_span.token {
             if is_keyword(word) && word.value != word.value.to_uppercase() {
                let loc = &token_with_span.span;
                let range = Range {
                    start: Position { line: (loc.start.line - 1) as u32, character: (loc.start.column - 1) as u32 },
                    end: Position { line: (loc.end.line - 1) as u32, character: (loc.end.column - 1) as u32 },
                };
                
                diagnostics.push(Diagnostic {
                    range,
                    severity: Some(DiagnosticSeverity::WARNING),
                    code: Some(NumberOrString::String("keyword-casing".to_string())),
                    source: Some("hql-ls".to_string()),
                    message: format!("Keyword '{}' should be uppercase", word.value),
                    ..Default::default()
                });
             }
        }
    }
    diagnostics
}

fn check_semicolons(tokens: &[TokenWithSpan]) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    let statement_starters = [
        "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", 
        "TRUNCATE", "WITH", "MERGE", "SHOW", "DESCRIBE", "EXPLAIN", "SET", "USE"
    ];

    let mut last_significant_token_idx: Option<usize> = None;
    let mut paren_balance = 0;
    let mut current_statement_keyword: Option<String> = None;

    for (i, token_with_span) in tokens.iter().enumerate() {
        let token = &token_with_span.token;
        
        match token {
            Token::LParen => paren_balance += 1,
            Token::RParen => if paren_balance > 0 { paren_balance -= 1 },
            Token::SemiColon | Token::Char(';') => {
                if paren_balance == 0 {
                    current_statement_keyword = None;
                }
            },
            Token::Word(w) => {
                let upper = w.value.to_uppercase();
                
                if paren_balance == 0 && statement_starters.contains(&upper.as_str()) {
                    let mut is_continuation = false;
                    
                    if let Some(current) = &current_statement_keyword {
                        // Check if this starter is a valid continuation of the current statement
                        if upper == "SELECT" {
                            if matches!(current.as_str(), "WITH" | "INSERT" | "CREATE" | "EXPLAIN") {
                                is_continuation = true;
                            }
                        }
                        // Add other continuations if needed
                    }

                    if !is_continuation {
                        // This is a new statement. Check if previous statement ended properly.
                        if let Some(prev_idx) = last_significant_token_idx {
                            let prev_token = &tokens[prev_idx].token;
                            let is_semicolon = matches!(prev_token, Token::SemiColon) || 
                                             matches!(prev_token, Token::Char(';'));
                            
                            if !is_semicolon {
                                let prev_span = &tokens[prev_idx].span;
                                let range = Range {
                                    start: Position { 
                                        line: (prev_span.end.line - 1) as u32, 
                                        character: (prev_span.end.column - 1) as u32 
                                    },
                                    end: Position { 
                                        line: (prev_span.end.line - 1) as u32, 
                                        character: (prev_span.end.column - 1) as u32 
                                    },
                                };

                                diagnostics.push(Diagnostic {
                                    range,
                                    severity: Some(DiagnosticSeverity::INFORMATION),
                                    code: Some(NumberOrString::String("missing-semicolon".to_string())),
                                    source: Some("hql-ls".to_string()),
                                    message: "Missing semicolon at end of statement".to_string(),
                                    ..Default::default()
                                });
                            }
                        }
                        
                        // Start tracking this new statement
                        current_statement_keyword = Some(upper);
                    }
                }
            },
            _ => {} // Ignore other tokens
        }

        if is_significant(token) {
            last_significant_token_idx = Some(i);
        }
    }
    
    // Check for missing semicolon at EOF
    if paren_balance == 0 && current_statement_keyword.is_some() {
        if let Some(last_idx) = last_significant_token_idx {
             let last_token = &tokens[last_idx].token;
             let is_semicolon = matches!(last_token, Token::SemiColon) || 
                              matches!(last_token, Token::Char(';'));
             
             if !is_semicolon {
                 let last_span = &tokens[last_idx].span;
                 let range = Range {
                    start: Position { 
                        line: (last_span.end.line - 1) as u32, 
                        character: (last_span.end.column - 1) as u32 
                    },
                    end: Position { 
                        line: (last_span.end.line - 1) as u32, 
                        character: (last_span.end.column - 1) as u32 
                    },
                };

                diagnostics.push(Diagnostic {
                    range,
                    severity: Some(DiagnosticSeverity::INFORMATION),
                    code: Some(NumberOrString::String("missing-semicolon".to_string())),
                    source: Some("hql-ls".to_string()),
                    message: "Missing semicolon at end of file".to_string(),
                    ..Default::default()
                });
             }
        }
    }
    
    diagnostics
}

fn check_missing_comma(tokens: &[TokenWithSpan], text: &str) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    
    // Keywords that are valid starts of a new clause/expression/operator, so they don't need a preceding comma
    let clause_starters = [
        "FROM", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "OFFSET", "UNION", "LATERAL", "DISTINCT",
        "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS", "ON", "AS", "USING", "WINDOW",
        "AND", "OR", "XOR", "CASE", "WHEN", "THEN", "ELSE", "END", "IS", "NOT", "IN", "BETWEEN", "LIKE", "RLIKE", "REGEXP",
        "OVER", "PARTITION", "BY", "ROWS", "RANGE", "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW"
    ];

    for i in 0..tokens.len() {
        let t1 = &tokens[i];
        
        if let Token::Word(w1) = &t1.token {
            // Look ahead for next non-whitespace token
            let mut j = i + 1;
            while j < tokens.len() {
                match &tokens[j].token {
                    Token::Whitespace(_) => j += 1,
                    // Skip comments if they exist in enum, assuming they might be handled or we just stop at Words
                    // For now, just skipping whitespace is the critical fix.
                    _ => break,
                }
            }
            
            if j >= tokens.len() {
                continue;
            }
            
            let t2 = &tokens[j];
            
            if let Token::Word(w2) = &t2.token {
                // Check if they are on different lines
                if t1.span.end.line < t2.span.start.line {
                    
                    // Extract text slice corresponding to t1 and the potential comma position
                    let t1_end_line_text = text.lines().nth((t1.span.end.line - 1) as usize).unwrap_or("");
                    let mut has_comma_after_t1 = false;
                    // Check from t1.span.end.column to end of line
                    let slice_start = (t1.span.end.column - 1) as usize;
                    
                    // Check bounds
                    if slice_start < t1_end_line_text.len() {
                         let remaining_line = &t1_end_line_text[slice_start..];
                         
                         if remaining_line.trim_start().starts_with(',') {
                            has_comma_after_t1 = true;
                         }
                    }

                    if has_comma_after_t1 {
                        continue; // Comma already exists, no warning needed
                    }
                    
                    let u1 = w1.value.to_uppercase();
                    let u2 = w2.value.to_uppercase();
                    
                    // If second word is a known keyword that starts a clause, skip (e.g. `col FROM`)
                    if clause_starters.contains(&u2.as_str()) {
                        continue;
                    }
                    // If first word is a known keyword or `SELECT` (which starts a list), skip
                    // e.g., `SELECT col` then `FROM` on next line is fine.
                    // This is to avoid flagging `SELECT col FROM`
                    if clause_starters.contains(&u1.as_str()) || u1 == "SELECT" {
                        continue;
                    }
                    
                    // Push diagnostic if we reach here, meaning no comma and not a known continuation
                    let range = Range {
                        start: Position { 
                            line: (t1.span.end.line - 1) as u32, 
                            character: (t1.span.end.column - 1) as u32 
                        },
                        end: Position { 
                            line: (t1.span.end.line - 1) as u32, 
                            character: (t1.span.end.column - 1) as u32 
                        },
                    };

                    diagnostics.push(Diagnostic {
                        range,
                        severity: Some(DiagnosticSeverity::WARNING),
                        code: Some(NumberOrString::String("missing-comma".to_string())),
                        source: Some("hql-ls".to_string()),
                        message: "Possible missing comma between columns in SELECT list".to_string(),
                        ..Default::default()
                    });
                }
            }
        }
    }
    
    diagnostics
}

fn check_parentheses(tokens: &[TokenWithSpan]) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    let mut balance = 0;
    let mut first_negative_idx = None;

    for (i, token_with_span) in tokens.iter().enumerate() {
        match &token_with_span.token {
            Token::LParen => balance += 1,
            Token::RParen => {
                balance -= 1;
                if balance < 0 && first_negative_idx.is_none() {
                    first_negative_idx = Some(i);
                }
            }
            _ => {} // Ignore other tokens
        }
    }

    if balance != 0 {
        if balance > 0 {
            // Unclosed (
            diagnostics.push(Diagnostic {
                range: Range::default(), // TODO: Better location (last open paren)
                severity: Some(DiagnosticSeverity::ERROR),
                message: format!("Unbalanced parentheses: {} unclosed '(", balance),
                ..Default::default()
            });
        } else {
            // Extra )
            if let Some(idx) = first_negative_idx {
                let span = &tokens[idx].span;
                 let range = Range {
                    start: Position { line: (span.start.line - 1) as u32, character: (span.start.column - 1) as u32 },
                    end: Position { line: (span.end.line - 1) as u32, character: (span.end.column - 1) as u32 },
                };
                diagnostics.push(Diagnostic {
                    range,
                    severity: Some(DiagnosticSeverity::ERROR),
                    message: "Unbalanced parentheses: extra ')'".to_string(),
                    ..Default::default()
                });
            }
        }
    }

    diagnostics
}

// Helper
fn is_keyword(word: &sqlparser::tokenizer::Word) -> bool {
    if word.quote_style.is_some() {
        return false;
    }
    let upper = word.value.to_uppercase();
    matches!(upper.as_str(), 
        "SELECT" | "FROM" | "WHERE" | "GROUP" | "BY" | "HAVING" | "ORDER" | "LIMIT" | 
        "JOIN" | "LEFT" | "RIGHT" | "INNER" | "OUTER" | "CROSS" | "ON" | "AS" | 
        "AND" | "OR" | "NOT" | "IN" | "EXISTS" | "BETWEEN" | "LIKE" | "CASE" | "WHEN" | "THEN" | "ELSE" | "END" |
        "INSERT" | "INTO" | "VALUES" | "UPDATE" | "DELETE" | "CREATE" | "TABLE" | "DROP" | "ALTER"
    )
}

fn is_significant(token: &Token) -> bool {
    !matches!(token, Token::Whitespace(_))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{LintingConfig, LintingRules};

    fn get_messages(diagnostics: &[Diagnostic]) -> Vec<String> {
        diagnostics.iter().map(|d| d.message.clone()).collect()
    }

    fn default_config() -> LintingConfig {
        let mut rules = LintingRules::default();
        // Enable all rules for testing
        rules.keyword_casing = true;
        rules.semicolon = true;
        rules.string_literal = true;
        rules.parentheses = true;
        rules.trailing_whitespace = true;
        rules.missing_comma = true;
        rules.hive_variable = true;
        
        LintingConfig {
            enabled: true,
            severity: "Warning".to_string(),
            max_file_size: 1048576,
            rules,
        }
    }

    #[test]
    fn test_keyword_casing() {
        let sql = "select * from users";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Keyword 'select' should be uppercase")));
        assert!(msgs.iter().any(|m| m.contains("Keyword 'from' should be uppercase")));
    }

    #[test]
    fn test_keyword_casing_valid() {
        let sql = "SELECT * FROM users;";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.is_empty());
    }

    #[test]
    fn test_missing_semicolon_multi_query() {
        let sql = "SELECT * FROM users WHERE id = 1\n\nSELECT * FROM orders WHERE status = 'active';";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Missing semicolon")));
    }

    #[test]
    fn test_semicolon_valid() {
        let sql = "SELECT * FROM users; SELECT * FROM orders;";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(!msgs.iter().any(|m| m.contains("Missing semicolon")));
    }

    // Ported from SemicolonRule - DDL and Subqueries
    #[test]
    fn test_semicolon_subquery_no_flag() {
        let sql = "SELECT *\nFROM users\nWHERE id IN (\n  SELECT user_id\n  FROM orders\n)\nAND created_date > '2024';";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(!msgs.iter().any(|m| m.contains("Missing semicolon")));
    }

    #[test]
    fn test_semicolon_ddl_no_flag() {
        let sql = "CREATE TABLE sales (id INT)\nPARTITIONED BY (year INT)\nSTORED AS PARQUET\nLOCATION '/data';";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(!msgs.iter().any(|m| m.contains("Missing semicolon")));
    }

    #[test]
    fn test_unbalanced_parentheses() {
        let sql = "SELECT * FROM users WHERE (id = 1";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Unbalanced parentheses")));
    }

    #[test]
    fn test_balanced_parentheses_complex() {
        let sql = "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE (amt > 100))";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(!msgs.iter().any(|m| m.contains("Unbalanced parentheses")));
    }

    #[test]
    fn test_trailing_whitespace() {
        let sql = "SELECT * FROM users \nWHERE id = 1";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Trailing whitespace")));
    }

    #[test]
    fn test_hive_variables() {
        let sql = "SELECT ${hiveconf:my_var} FROM table";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(!msgs.iter().any(|m| m.contains("Invalid Hive variable")));
    }

    #[test]
    fn test_hive_variables_invalid() {
        let sql = "SELECT ${invalid:var} FROM table";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Invalid namespace")));
    }

    #[test]
    fn test_hive_variables_empty() {
        let sql = "SELECT ${} FROM table";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Empty Hive variable")));
    }

    #[test]
    fn test_missing_comma() {
        let sql = "SELECT id name FROM users;";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        // Heuristic only checks multiline to avoid flagging valid aliases 'SELECT col alias'
        // So this should NOT have a warning.
        assert!(msgs.is_empty());
    }

    #[test]
    fn test_missing_comma_multiline() {
        let sql = "SELECT\n  id\n  name\nFROM users";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.iter().any(|m| m.contains("Possible missing comma")));
    }

    #[test]
    fn test_missing_comma_with_comma_present() {
        let sql = "SELECT\n  p.product_id,\n  p.product_name,\n  i.quantity\nFROM products p;";
        let diags = lint(sql, &default_config());
        let msgs = get_messages(&diags);
        assert!(msgs.is_empty());
    }
}