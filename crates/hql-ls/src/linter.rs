use tower_lsp::lsp_types::{Diagnostic, DiagnosticSeverity, Position, Range, NumberOrString};
use sqlparser::dialect::HiveDialect;
use sqlparser::tokenizer::{Tokenizer, Token, TokenWithSpan};
use regex::Regex;
use std::sync::OnceLock;

pub fn lint(text: &str) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();

    // 1. Text-based checks
    diagnostics.extend(check_trailing_whitespace(text));
    diagnostics.extend(check_hive_variables(text));

    // 2. Tokenization
    let dialect = HiveDialect {};
    let tokens_result = Tokenizer::new(&dialect, text).tokenize_with_location();

    match tokens_result {
        Ok(tokens) => {
            // 3. Token-based checks
            diagnostics.extend(check_keyword_casing(&tokens));
            diagnostics.extend(check_semicolons(&tokens));
            diagnostics.extend(check_parentheses(&tokens));
        }
        Err(e) => {
            // Tokenizer error (e.g. unclosed string)
            // sqlparser TokenizerError usually contains line/col info
            // But the error struct might be simple. Let's try to extract info if possible.
            // The error message usually looks like "Unterminated string literal at Line: 1, Column: 5"
            
            let msg = e.to_string();
            // We can try to parse the line/col from the message or just report it at 0,0
            diagnostics.push(Diagnostic {
                range: Range::default(), // TODO: parse actual location from error string if possible
                severity: Some(DiagnosticSeverity::ERROR),
                source: Some("hql-ls".to_string()),
                message: msg,
                ..Default::default()
            });
        }
    }

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

    for (i, token_with_span) in tokens.iter().enumerate() {
        let token = &token_with_span.token;
        
        // Check if this is a statement starter
        if let Token::Word(w) = token {
            let upper = w.value.to_uppercase();
            if statement_starters.contains(&upper.as_str()) {
                // Check previous significant token
                if let Some(prev_idx) = last_significant_token_idx {
                    let prev_token = &tokens[prev_idx].token;
                    if !matches!(prev_token, Token::SemiColon) {
                        // Found a new statement but previous didn't end with semicolon
                        // Report error at the END of the previous token
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
                            severity: Some(DiagnosticSeverity::INFORMATION), // Matches old rule severity
                            code: Some(NumberOrString::String("missing-semicolon".to_string())),
                            source: Some("hql-ls".to_string()),
                            message: "Missing semicolon at end of statement".to_string(),
                            ..Default::default()
                        });
                    }
                }
            }
        }

        // Update last significant token (ignore whitespace/comments if tokenizer produced them, 
        // but sqlparser usually skips them unless configured otherwise. 
        // NOTE: tokenize_with_location() usually skips whitespace/comments by default 
        // so all tokens here are "significant" mostly.
        last_significant_token_idx = Some(i);
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
            _ => {}
        }
    }

    if balance != 0 {
        if balance > 0 {
            // Unclosed (
            // Find last (
            // Simplified: just report at end of file or generic error
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