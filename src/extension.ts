import * as vscode from 'vscode';
import { HQLLinter } from './linter';
import { HQLFormatter } from './formatter';
import { HQLDiagnosticsProvider } from './diagnostics';
import { Logger } from './logger';
import { getHQLSnippets } from './snippets';
import { getHQLDocumentation } from './hoverProvider';
import { provideSignatureHelp } from './signatureProvider';

// Global state
let logger: Logger;
let lintTimeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    logger = new Logger('HQL');
    logger.info('HQL Linter & Formatter extension is now active');

    // Initialize providers
    const diagnosticsProvider = new HQLDiagnosticsProvider();
    const linter = new HQLLinter(diagnosticsProvider, logger);
    const formatter = new HQLFormatter(logger);

    // Register document formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('hql', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            try {
                const config = vscode.workspace.getConfiguration('hql.formatting');
                if (!config.get('enabled', true)) {
                    return [];
                }
                return formatter.format(document);
            } catch (error) {
                logger.error('Error in formatting provider', error);
                return [];
            }
        }
    });

    // Register document range formatting provider
    const rangeFormattingProvider = vscode.languages.registerDocumentRangeFormattingEditProvider('hql', {
        provideDocumentRangeFormattingEdits(
            document: vscode.TextDocument,
            range: vscode.Range
        ): vscode.TextEdit[] {
            try {
                const config = vscode.workspace.getConfiguration('hql.formatting');
                if (!config.get('enabled', true)) {
                    return [];
                }
                return formatter.formatRange(document, range);
            } catch (error) {
                logger.error('Error in range formatting provider', error);
                return [];
            }
        }
    });

    // Register on-type formatting provider (format on enter, semicolon, etc.)
    const onTypeFormattingProvider = vscode.languages.registerOnTypeFormattingEditProvider(
        'hql',
        {
            provideOnTypeFormattingEdits(): vscode.TextEdit[] {
                const config = vscode.workspace.getConfiguration('hql.formatting');
                if (!config.get('enabled', true)) {
                    return [];
                }
                return formatter.formatOnType();
            }
        },
        ';', '\n'
    );

    // Register commands
    const formatCommand = vscode.commands.registerCommand('hql.formatDocument', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'hql') {
            const edits = formatter.format(editor.document);
            const workspaceEdit = new vscode.WorkspaceEdit();
            edits.forEach(edit => {
                workspaceEdit.replace(editor.document.uri, edit.range, edit.newText);
            });
            vscode.workspace.applyEdit(workspaceEdit);
            vscode.window.showInformationMessage('HQL document formatted successfully');
        }
    });

    const lintCommand = vscode.commands.registerCommand('hql.lintDocument', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'hql') {
            linter.lint(editor.document);
            vscode.window.showInformationMessage('HQL document linted successfully');
        }
    });

    // Lint on document open and change
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'hql') {
            const config = vscode.workspace.getConfiguration('hql.linting');
            if (config.get('enabled', true)) {
                linter.lint(document);
            }
        }
    });

    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === 'hql') {
            const config = vscode.workspace.getConfiguration('hql.linting');
            if (config.get('enabled', true)) {
                // Clear existing timeout
                if (lintTimeout) {
                    clearTimeout(lintTimeout);
                }

                // Debounce linting by 500ms
                lintTimeout = setTimeout(() => {
                    try {
                        linter.lint(event.document);
                    } catch (error) {
                        logger.error('Error during debounced linting', error);
                    }
                }, 500);
            }
        }
    });

    const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument((document) => {
        if (document.languageId === 'hql') {
            diagnosticsProvider.clear(document.uri);
        }
    });

    // Register code action provider for quick fixes
    const codeActionProvider = vscode.languages.registerCodeActionsProvider('hql', {
        provideCodeActions(
            document: vscode.TextDocument,
            range: vscode.Range,
            context: vscode.CodeActionContext
        ): vscode.CodeAction[] {
            const actions: vscode.CodeAction[] = [];

            for (const diagnostic of context.diagnostics) {
                if (diagnostic.source === 'HQL Linter') {
                    // Add quick fix actions based on diagnostic
                    const fix = createQuickFix(document, diagnostic);
                    if (fix) {
                        actions.push(fix);
                    }
                }
            }

            return actions;
        }
    });

    // Register hover provider for HQL keywords and functions
    const hoverProvider = vscode.languages.registerHoverProvider('hql', {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
            try {
                const range = document.getWordRangeAtPosition(position);
                if (!range) {
                    return null;
                }

                const word = document.getText(range);
                const documentation = getHQLDocumentation(word);

                if (documentation) {
                    return new vscode.Hover(documentation);
                }

                return null;
            } catch (error) {
                logger.error('Error in hover provider', error);
                return null;
            }
        }
    });

    // Register completion provider for HQL keywords, functions, and snippets
    const completionProvider = vscode.languages.registerCompletionItemProvider('hql', {
        provideCompletionItems(): vscode.CompletionItem[] {
            const completions = getHQLCompletions();
            const snippets = getHQLSnippets();
            return [...completions, ...snippets];
        }
    }, '.', ' ');

    // Register signature help provider for function parameters
    const signatureProvider = vscode.languages.registerSignatureHelpProvider('hql', {
        provideSignatureHelp(
            document: vscode.TextDocument,
            position: vscode.Position
        ): vscode.SignatureHelp | null {
            try {
                return provideSignatureHelp(document, position);
            } catch (error) {
                logger.error('Error in signature help provider', error);
                return null;
            }
        }
    }, '(', ',');

    // Add all disposables to context
    context.subscriptions.push(
        formattingProvider,
        rangeFormattingProvider,
        onTypeFormattingProvider,
        formatCommand,
        lintCommand,
        onDidOpenTextDocument,
        onDidChangeTextDocument,
        onDidCloseTextDocument,
        codeActionProvider,
        hoverProvider,
        completionProvider,
        signatureProvider,
        diagnosticsProvider.diagnosticCollection,
        {
            dispose: () => {
                if (lintTimeout) {
                    clearTimeout(lintTimeout);
                }
            }
        }
    );

    // Lint all open HQL documents
    vscode.workspace.textDocuments.forEach((document) => {
        if (document.languageId === 'hql') {
            const config = vscode.workspace.getConfiguration('hql.linting');
            if (config.get('enabled', true)) {
                linter.lint(document);
            }
        }
    });
}

function createQuickFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | null {
    // Fix uppercase keywords
    if (diagnostic.message.includes('keyword should be uppercase')) {
        const action = new vscode.CodeAction('Convert keyword to uppercase', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const range = diagnostic.range;
        const text = document.getText(range);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, text.toUpperCase());
        action.edit = edit;
        return action;
    }

    // Fix missing semicolon
    if (diagnostic.message.includes('Missing semicolon')) {
        const action = new vscode.CodeAction('Add semicolon', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const line = document.lineAt(diagnostic.range.end.line);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, line.range.end, ';');
        action.edit = edit;
        return action;
    }

    // Fix trailing whitespace
    if (diagnostic.message.includes('Trailing whitespace')) {
        const action = new vscode.CodeAction('Remove trailing whitespace', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const line = document.lineAt(diagnostic.range.start.line);
        const trimmedLength = line.text.trimEnd().length;
        const range = new vscode.Range(
            diagnostic.range.start.line, trimmedLength,
            diagnostic.range.start.line, line.text.length
        );
        const edit = new vscode.WorkspaceEdit();
        edit.delete(document.uri, range);
        action.edit = edit;
        return action;
    }

    // Fix unclosed string literals - suggest closing quote
    if (diagnostic.message.includes('Unclosed')) {
        const quoteChar = diagnostic.message.includes('single') ? "'" : '"';
        const action = new vscode.CodeAction(`Add closing ${quoteChar}`, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        const line = document.lineAt(diagnostic.range.end.line);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, line.range.end, quoteChar);
        action.edit = edit;
        return action;
    }

    return null;
}

function getHQLCompletions(): vscode.CompletionItem[] {
    const keywords = [
        // Basic query keywords
        'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
        // Join types
        'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'LEFT SEMI JOIN',
        'ON', 'USING', 'AS', 'DISTINCT', 'ALL', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
        // Comparison and pattern matching
        'BETWEEN', 'LIKE', 'RLIKE', 'REGEXP', 'IS NULL', 'IS NOT NULL',
        // Control flow
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        // DDL
        'CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN', 'MSCK',
        'TABLE', 'DATABASE', 'SCHEMA', 'EXTERNAL', 'TEMPORARY', 'VIEW', 'INDEX',
        // DML
        'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'OVERWRITE', 'INTO', 'VALUES', 'LOAD', 'EXPORT', 'IMPORT',
        // Partitioning and bucketing
        'PARTITION', 'PARTITIONED', 'CLUSTERED', 'SORTED', 'BUCKETS', 'SKEWED',
        // Window functions
        'OVER', 'ROWS', 'RANGE', 'BETWEEN', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT',
        // Table properties
        'STORED', 'ROW', 'FORMAT', 'SERDE', 'SERDEPROPERTIES', 'TBLPROPERTIES', 'LOCATION',
        // File formats
        'ORC', 'PARQUET', 'AVRO', 'TEXTFILE', 'SEQUENCEFILE', 'RCFILE',
        // Sampling
        'TABLESAMPLE', 'BUCKET',
        // Advanced
        'LATERAL', 'VIEW', 'TRANSFORM', 'USING', 'FUNCTION', 'TEMPORARY', 'JAR',
        // Set operations
        'UNION', 'INTERSECT', 'EXCEPT',
        // Data types
        'INT', 'TINYINT', 'SMALLINT', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC',
        'STRING', 'VARCHAR', 'CHAR', 'BOOLEAN', 'BINARY',
        'TIMESTAMP', 'DATE', 'INTERVAL',
        'ARRAY', 'MAP', 'STRUCT', 'UNIONTYPE',
        // Constants
        'TRUE', 'FALSE', 'NULL'
    ];

    const functions = [
        // Aggregate functions
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'VARIANCE', 'VAR_POP', 'VAR_SAMP', 'STDDEV_POP', 'STDDEV_SAMP',
        'PERCENTILE', 'PERCENTILE_APPROX', 'HISTOGRAM_NUMERIC',
        // String functions
        'CONCAT', 'CONCAT_WS', 'SUBSTR', 'SUBSTRING', 'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM',
        'LENGTH', 'REVERSE', 'SPACE', 'REPEAT', 'ASCII', 'LPAD', 'RPAD', 'SPLIT', 'REGEXP_REPLACE',
        'REGEXP_EXTRACT', 'PARSE_URL', 'GET_JSON_OBJECT', 'INSTR', 'LOCATE', 'FIND_IN_SET',
        // Date/Time functions
        'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'WEEKOFYEAR', 'DATEDIFF', 'DATE_ADD',
        'DATE_SUB', 'FROM_UNIXTIME', 'UNIX_TIMESTAMP', 'TO_DATE', 'CURRENT_DATE', 'CURRENT_TIMESTAMP',
        'ADD_MONTHS', 'LAST_DAY', 'NEXT_DAY', 'TRUNC', 'MONTHS_BETWEEN', 'DATE_FORMAT',
        // Mathematical functions
        'ROUND', 'FLOOR', 'CEIL', 'CEILING', 'RAND', 'EXP', 'LN', 'LOG', 'LOG10', 'LOG2',
        'POW', 'POWER', 'SQRT', 'BIN', 'HEX', 'UNHEX', 'CONV', 'ABS', 'PMOD', 'SIN', 'COS', 'TAN',
        // Type conversion
        'CAST', 'COALESCE', 'NVL', 'IF', 'NULLIF', 'ISNULL', 'ISNOTNULL',
        // Conditional functions
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASSERT_TRUE',
        // Collection functions
        'COLLECT_LIST', 'COLLECT_SET', 'SIZE', 'ARRAY_CONTAINS', 'SORT_ARRAY', 'MAP_KEYS', 'MAP_VALUES',
        // Table generating functions
        'EXPLODE', 'POSEXPLODE', 'INLINE', 'STACK', 'JSON_TUPLE',
        // Window/Analytical functions
        'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PERCENT_RANK', 'NTILE', 'CUME_DIST',
        'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
        // Other functions
        'HASH', 'MD5', 'SHA1', 'SHA2', 'CRC32', 'BASE64', 'UNBASE64', 'ENCODE', 'DECODE',
        'REFLECT', 'JAVA_METHOD', 'VERSION'
    ];

    const completions: vscode.CompletionItem[] = [];

    keywords.forEach(keyword => {
        const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
        item.insertText = keyword;
        item.detail = 'HQL Keyword';
        completions.push(item);
    });

    functions.forEach(func => {
        const item = new vscode.CompletionItem(func, vscode.CompletionItemKind.Function);
        item.insertText = new vscode.SnippetString(`${func}($1)$0`);
        item.detail = 'HQL Function';
        completions.push(item);
    });

    return completions;
}

export function deactivate() {
    if (lintTimeout) {
        clearTimeout(lintTimeout);
    }
    if (logger) {
        logger.info('HQL Linter & Formatter extension is now deactivated');
        logger.dispose();
    }
}
