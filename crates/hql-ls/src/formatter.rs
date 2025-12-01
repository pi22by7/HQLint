use tower_lsp::lsp_types::{TextEdit, Range, Position, FormattingOptions};
use sqlformat::{format, FormatOptions, QueryParams, Indent};
use crate::config::FormattingConfig;

pub fn format_text(text: &str, options: FormattingOptions, config: &FormattingConfig) -> Vec<TextEdit> {
    let indent = if options.insert_spaces {
        Indent::Spaces(options.tab_size as u8)
    } else {
        Indent::Tabs
    };

    let uppercase = match config.keyword_case.as_str() {
        "lower" => Some(false),
        "upper" => Some(true),
        _ => None, // preserve
    };

    let format_opts = FormatOptions {
        indent,
        uppercase,
        lines_between_queries: config.lines_between_queries,
        ..Default::default()
    };

    let formatted = format(text, &QueryParams::None, &format_opts);

    // Replace the entire document with the formatted text
    let line_count = text.lines().count() as u32;
    let last_line_len = text.lines().last().map(|l| l.len()).unwrap_or(0) as u32;

    vec![TextEdit {
        range: Range {
            start: Position { line: 0, character: 0 },
            end: Position { 
                line: std::cmp::max(line_count, 1) - 1, 
                character: last_line_len + 1000 
            },
        },
        new_text: formatted,
    }]
}
