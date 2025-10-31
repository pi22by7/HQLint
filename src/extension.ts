import * as vscode from 'vscode';
import { HQLLinter } from './linter';
import { HQLFormatter } from './formatter';
import { HQLDiagnosticsProvider } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
    console.log('HQL Linter & Formatter extension is now active');

    // Initialize providers
    const diagnosticsProvider = new HQLDiagnosticsProvider();
    const linter = new HQLLinter(diagnosticsProvider);
    const formatter = new HQLFormatter();

    // Register document formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('hql', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const config = vscode.workspace.getConfiguration('hql.formatting');
            if (!config.get('enabled', true)) {
                return [];
            }
            return formatter.format(document);
        }
    });

    // Register document range formatting provider
    const rangeFormattingProvider = vscode.languages.registerDocumentRangeFormattingEditProvider('hql', {
        provideDocumentRangeFormattingEdits(
            document: vscode.TextDocument,
            range: vscode.Range
        ): vscode.TextEdit[] {
            const config = vscode.workspace.getConfiguration('hql.formatting');
            if (!config.get('enabled', true)) {
                return [];
            }
            return formatter.formatRange(document, range);
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
                linter.lint(event.document);
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
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return null;
            }

            const word = document.getText(range).toUpperCase();
            const documentation = getHQLDocumentation(word);

            if (documentation) {
                return new vscode.Hover(new vscode.MarkdownString(documentation));
            }

            return null;
        }
    });

    // Register completion provider for HQL keywords and functions
    const completionProvider = vscode.languages.registerCompletionItemProvider('hql', {
        provideCompletionItems(): vscode.CompletionItem[] {
            return getHQLCompletions();
        }
    }, '.', ' ');

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
        diagnosticsProvider.diagnosticCollection
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
    const action = new vscode.CodeAction('Fix HQL Issue', vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    // Example quick fixes based on diagnostic messages
    if (diagnostic.message.includes('keyword should be uppercase')) {
        const range = diagnostic.range;
        const text = document.getText(range);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, text.toUpperCase());
        action.edit = edit;
        return action;
    }

    if (diagnostic.message.includes('Missing semicolon')) {
        const line = document.lineAt(diagnostic.range.end.line);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, line.range.end, ';');
        action.edit = edit;
        return action;
    }

    return null;
}

function getHQLDocumentation(keyword: string): string | null {
    /* eslint-disable @typescript-eslint/naming-convention */
    const docs: { [key: string]: string } = {
        'SELECT': '**SELECT** - Retrieves rows from a table.\n\nSyntax: `SELECT column1, column2, ... FROM table`',
        'FROM': '**FROM** - Specifies the table to retrieve data from.\n\nSyntax: `FROM table_name`',
        'WHERE': '**WHERE** - Filters records based on a condition.\n\nSyntax: `WHERE condition`',
        'GROUP BY': '**GROUP BY** - Groups rows that have the same values.\n\nSyntax: `GROUP BY column1, column2, ...`',
        'ORDER BY': '**ORDER BY** - Sorts the result set.\n\nSyntax: `ORDER BY column1 [ASC|DESC], ...`',
        'JOIN': '**JOIN** - Combines rows from two or more tables.\n\nTypes: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN',
        'COUNT': '**COUNT()** - Returns the number of rows.\n\nSyntax: `COUNT(column)` or `COUNT(*)`',
        'SUM': '**SUM()** - Returns the sum of a numeric column.\n\nSyntax: `SUM(column)`',
        'AVG': '**AVG()** - Returns the average value.\n\nSyntax: `AVG(column)`',
        'CREATE': '**CREATE** - Creates a new database object.\n\nSyntax: `CREATE TABLE table_name (...)`',
        'INSERT': '**INSERT** - Inserts new records into a table.\n\nSyntax: `INSERT INTO table VALUES (...)`',
        'PARTITION': '**PARTITION** - Divides a table into parts.\n\nSyntax: `PARTITIONED BY (column type)`',
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    return docs[keyword] || null;
}

function getHQLCompletions(): vscode.CompletionItem[] {
    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
        'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN',
        'ON', 'USING', 'AS', 'DISTINCT', 'ALL', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
        'BETWEEN', 'LIKE', 'RLIKE', 'REGEXP', 'IS NULL', 'IS NOT NULL',
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'SHOW', 'DESCRIBE',
        'TABLE', 'DATABASE', 'EXTERNAL', 'PARTITION', 'VIEW',
        'INSERT', 'OVERWRITE', 'INTO', 'VALUES', 'LOAD',
        'INT', 'BIGINT', 'STRING', 'DOUBLE', 'BOOLEAN', 'TIMESTAMP', 'DATE', 'ARRAY', 'MAP', 'STRUCT'
    ];

    const functions = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CONCAT', 'SUBSTR', 'UPPER', 'LOWER',
        'TRIM', 'LENGTH', 'CAST', 'COALESCE', 'NVL', 'IF', 'YEAR', 'MONTH', 'DAY',
        'COLLECT_LIST', 'COLLECT_SET', 'EXPLODE', 'ROW_NUMBER', 'RANK', 'DENSE_RANK'
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
    console.log('HQL Linter & Formatter extension is now deactivated');
}
