import * as vscode from 'vscode';
import { HQLDiagnosticsProvider } from './diagnostics';

interface LintRule {
    check: (document: vscode.TextDocument, line: number, text: string) => vscode.Diagnostic | null;
}

export class HQLLinter {
    private diagnosticsProvider: HQLDiagnosticsProvider;
    private rules: LintRule[];

    constructor(diagnosticsProvider: HQLDiagnosticsProvider) {
        this.diagnosticsProvider = diagnosticsProvider;
        this.rules = this.initializeRules();
    }

    private initializeRules(): LintRule[] {
        return [
            // Check for lowercase keywords
            {
                check: (doc, lineNum, text) => {
                    const keywords = [
                        'select', 'from', 'where', 'group by', 'order by', 'having',
                        'join', 'inner join', 'left join', 'right join', 'on',
                        'insert', 'into', 'values', 'create', 'table', 'drop',
                        'alter', 'update', 'delete', 'set', 'limit', 'distinct',
                        'as', 'and', 'or', 'not', 'in', 'exists', 'between', 'like',
                        'case', 'when', 'then', 'else', 'end', 'partition', 'by'
                    ];

                    for (const keyword of keywords) {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            if (match[0] !== keyword.toUpperCase()) {
                                const range = new vscode.Range(
                                    lineNum,
                                    match.index,
                                    lineNum,
                                    match.index + match[0].length
                                );
                                return new vscode.Diagnostic(
                                    range,
                                    `SQL keyword '${match[0]}' should be uppercase`,
                                    this.getSeverity()
                                );
                            }
                        }
                    }
                    return null;
                }
            },
            // Check for missing semicolon at end of statement
            {
                check: (doc, lineNum, text) => {
                    const trimmed = text.trim();
                    if (trimmed.length === 0 || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
                        return null;
                    }

                    // Check if this is the last non-empty line
                    let isLastLine = true;
                    for (let i = lineNum + 1; i < doc.lineCount; i++) {
                        const nextLine = doc.lineAt(i).text.trim();
                        if (nextLine.length > 0 && !nextLine.startsWith('--') && !nextLine.startsWith('/*')) {
                            isLastLine = false;
                            break;
                        }
                    }

                    if (isLastLine && !trimmed.endsWith(';')) {
                        const range = new vscode.Range(
                            lineNum,
                            text.length,
                            lineNum,
                            text.length
                        );
                        return new vscode.Diagnostic(
                            range,
                            'Missing semicolon at end of statement',
                            vscode.DiagnosticSeverity.Information
                        );
                    }
                    return null;
                }
            },
            // Check for SELECT *
            {
                check: (doc, lineNum, text) => {
                    const regex = /\bSELECT\s+\*/gi;
                    const match = regex.exec(text);
                    if (match) {
                        const range = new vscode.Range(
                            lineNum,
                            match.index,
                            lineNum,
                            match.index + match[0].length
                        );
                        return new vscode.Diagnostic(
                            range,
                            'Consider specifying column names instead of using SELECT *',
                            vscode.DiagnosticSeverity.Information
                        );
                    }
                    return null;
                }
            },
            // Check for unclosed string literals
            {
                check: (doc, lineNum, text) => {
                    // Remove comments first
                    const withoutComments = text.replace(/--.*$/, '').replace(/\/\*.*?\*\//g, '');

                    // Count single quotes
                    const singleQuotes = (withoutComments.match(/(?<!\\)'/g) || []).length;
                    if (singleQuotes % 2 !== 0) {
                        const lastQuoteIndex = text.lastIndexOf("'");
                        const range = new vscode.Range(lineNum, lastQuoteIndex, lineNum, lastQuoteIndex + 1);
                        return new vscode.Diagnostic(
                            range,
                            'Unclosed string literal',
                            vscode.DiagnosticSeverity.Error
                        );
                    }

                    // Count double quotes
                    const doubleQuotes = (withoutComments.match(/(?<!\\)"/g) || []).length;
                    if (doubleQuotes % 2 !== 0) {
                        const lastQuoteIndex = text.lastIndexOf('"');
                        const range = new vscode.Range(lineNum, lastQuoteIndex, lineNum, lastQuoteIndex + 1);
                        return new vscode.Diagnostic(
                            range,
                            'Unclosed string literal',
                            vscode.DiagnosticSeverity.Error
                        );
                    }
                    return null;
                }
            },
            // Check for unbalanced parentheses
            {
                check: (doc, lineNum, text) => {
                    // Remove strings and comments
                    let cleaned = text.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
                    cleaned = cleaned.replace(/--.*$/, '').replace(/\/\*.*?\*\//g, '');

                    const openCount = (cleaned.match(/\(/g) || []).length;
                    const closeCount = (cleaned.match(/\)/g) || []).length;

                    if (openCount > closeCount) {
                        const lastOpenIndex = text.lastIndexOf('(');
                        const range = new vscode.Range(lineNum, lastOpenIndex, lineNum, lastOpenIndex + 1);
                        return new vscode.Diagnostic(
                            range,
                            'Unbalanced parentheses - missing closing parenthesis',
                            vscode.DiagnosticSeverity.Error
                        );
                    } else if (closeCount > openCount) {
                        const lastCloseIndex = text.lastIndexOf(')');
                        const range = new vscode.Range(lineNum, lastCloseIndex, lineNum, lastCloseIndex + 1);
                        return new vscode.Diagnostic(
                            range,
                            'Unbalanced parentheses - missing opening parenthesis',
                            vscode.DiagnosticSeverity.Error
                        );
                    }
                    return null;
                }
            },
            // Check for improper JOIN syntax
            {
                check: (doc, lineNum, text) => {
                    const joinRegex = /\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+OUTER\s+JOIN|JOIN)\b/gi;
                    const match = joinRegex.exec(text);
                    if (match) {
                        // Check if next non-empty line has ON or USING
                        let foundOnOrUsing = false;
                        for (let i = lineNum; i < Math.min(lineNum + 5, doc.lineCount); i++) {
                            const lineText = doc.lineAt(i).text;
                            if (/\b(ON|USING)\b/i.test(lineText)) {
                                foundOnOrUsing = true;
                                break;
                            }
                        }
                        if (!foundOnOrUsing && !/\bCROSS\s+JOIN\b/i.test(text)) {
                            const range = new vscode.Range(
                                lineNum,
                                match.index,
                                lineNum,
                                match.index + match[0].length
                            );
                            return new vscode.Diagnostic(
                                range,
                                'JOIN should be followed by ON or USING clause',
                                vscode.DiagnosticSeverity.Warning
                            );
                        }
                    }
                    return null;
                }
            },
            // Check for GROUP BY without aggregate function
            {
                check: (doc, lineNum, text) => {
                    if (/\bGROUP\s+BY\b/i.test(text)) {
                        // Look for aggregate functions in nearby lines
                        let hasAggregate = false;
                        for (let i = Math.max(0, lineNum - 10); i <= Math.min(lineNum + 5, doc.lineCount - 1); i++) {
                            const lineText = doc.lineAt(i).text;
                            if (/\b(COUNT|SUM|AVG|MIN|MAX|COLLECT_LIST|COLLECT_SET)\s*\(/i.test(lineText)) {
                                hasAggregate = true;
                                break;
                            }
                        }
                        if (!hasAggregate) {
                            const match = text.match(/\bGROUP\s+BY\b/i);
                            if (match && match.index !== undefined) {
                                const range = new vscode.Range(
                                    lineNum,
                                    match.index,
                                    lineNum,
                                    match.index + match[0].length
                                );
                                return new vscode.Diagnostic(
                                    range,
                                    'GROUP BY typically requires aggregate functions in SELECT',
                                    vscode.DiagnosticSeverity.Information
                                );
                            }
                        }
                    }
                    return null;
                }
            },
            // Check for trailing whitespace
            {
                check: (doc, lineNum, text) => {
                    if (text.length > 0 && text.endsWith(' ') || text.endsWith('\t')) {
                        const trimmedLength = text.trimEnd().length;
                        const range = new vscode.Range(
                            lineNum,
                            trimmedLength,
                            lineNum,
                            text.length
                        );
                        return new vscode.Diagnostic(
                            range,
                            'Trailing whitespace',
                            vscode.DiagnosticSeverity.Hint
                        );
                    }
                    return null;
                }
            }
        ];
    }

    private getSeverity(): vscode.DiagnosticSeverity {
        const config = vscode.workspace.getConfiguration('hql.linting');
        const severity = config.get<string>('severity', 'Warning');

        switch (severity) {
            case 'Error':
                return vscode.DiagnosticSeverity.Error;
            case 'Warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'Information':
                return vscode.DiagnosticSeverity.Information;
            case 'Hint':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    public lint(document: vscode.TextDocument): void {
        const diagnostics: vscode.Diagnostic[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;

            for (const rule of this.rules) {
                const diagnostic = rule.check(document, i, text);
                if (diagnostic) {
                    diagnostic.source = 'HQL Linter';
                    diagnostics.push(diagnostic);
                }
            }
        }

        this.diagnosticsProvider.set(document.uri, diagnostics);
    }
}
