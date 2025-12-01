use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HqlConfig {
    pub linting: LintingConfig,
    pub formatting: FormattingConfig,
}

impl Default for HqlConfig {
    fn default() -> Self {
        Self {
            linting: LintingConfig::default(),
            formatting: FormattingConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LintingConfig {
    pub enabled: bool,
    pub severity: String, // Error, Warning, Information, Hint
    pub max_file_size: u64,
    pub rules: LintingRules,
}

impl Default for LintingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            severity: "Warning".to_string(),
            max_file_size: 1048576,
            rules: LintingRules::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LintingRules {
    pub keyword_casing: bool,
    pub semicolon: bool,
    pub string_literal: bool,
    pub parentheses: bool,
    pub trailing_whitespace: bool,
    pub missing_comma: bool,
    pub hive_variable: bool,
}

impl Default for LintingRules {
    fn default() -> Self {
        Self {
            keyword_casing: false,
            semicolon: true,
            string_literal: true,
            parentheses: true,
            trailing_whitespace: true,
            missing_comma: false,
            hive_variable: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormattingConfig {
    pub enabled: bool,
    pub keyword_case: String, // upper, lower, preserve
    pub lines_between_queries: u8,
}

impl Default for FormattingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            keyword_case: "upper".to_string(),
            lines_between_queries: 1,
        }
    }
}
