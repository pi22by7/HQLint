import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments, countOutsideStrings } from '../../utils/stringUtils';

interface ColumnSpan {
    text: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export class MissingCommaRule extends BaseLintRule {
    name = 'missing-comma';
    description = 'Check for potential missing commas in SELECT statements';

    // SQL keywords that are valid in column context
    private readonly sqlKeywords = new Set([
        'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
        'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS',
        'ON', 'USING', 'DISTINCT', 'ALL', 'OVER', 'PARTITION', 'BY'
    ]);

    check(context: LintContext): vscode.Diagnostic | null {
        // Only run document-level analysis on first line
        if (context.lineNumber !== 0) {
            return null;
        }

        try {
            const columnSpans = this.extractSelectColumns(context.document);

            for (const span of columnSpans) {
                const diagnostic = this.checkForMissingComma(span, context.document);
                if (diagnostic) {
                    return diagnostic;
                }
            }

            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }

    private extractSelectColumns(document: vscode.TextDocument): ColumnSpan[] {
        const spans: ColumnSpan[] = [];
        let inSelect = false;
        let selectStartLine = -1;
        let selectEndLine = -1;
        let parenDepth = 0;

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            const withoutComments = removeComments(lineText);

            // Track parentheses
            const opens = countOutsideStrings(withoutComments, '(');
            const closes = countOutsideStrings(withoutComments, ')');
            parenDepth += opens - closes;

            // Look for SELECT at depth 0
            if (parenDepth === 0 && /^\s*SELECT\b/i.test(withoutComments)) {
                inSelect = true;
                selectStartLine = i;
                continue;
            }

            // If we're in SELECT, find FROM
            if (inSelect) {
                if (parenDepth === 0 && /\bFROM\b/i.test(withoutComments)) {
                    // End of SELECT column list
                    selectEndLine = i;
                    spans.push({
                        text: '', // Not used
                        startLine: selectStartLine,
                        startColumn: 0,
                        endLine: selectEndLine,
                        endColumn: 0
                    });
                    inSelect = false;
                }
            }
        }

        return spans;
    }

    private checkForMissingComma(span: ColumnSpan, document: vscode.TextDocument): vscode.Diagnostic | null {
        // Check each line in the SELECT column list
        for (let i = span.startLine; i < span.endLine; i++) {
            const lineText = document.lineAt(i).text;
            const currentLine = removeComments(lineText).trim();

            // Skip empty lines, SELECT line, or lines ending with commas
            if (!currentLine || /^\s*SELECT\b/i.test(currentLine) || currentLine.endsWith(',')) {
                continue;
            }

            // Skip if line ends with opening paren or operator
            if (/[({+\-*/=<>]$/.test(currentLine)) {
                continue;
            }

            // Check next non-empty line
            for (let j = i + 1; j < span.endLine; j++) {
                const nextLineText = document.lineAt(j).text;
                const nextLine = removeComments(nextLineText).trim();

                if (!nextLine) {
                    continue; // Skip empty lines
                }

                // Skip if next line starts with SQL keyword or closing paren
                const nextFirstWord = nextLine.split(/\s+/)[0].toUpperCase();
                if (this.sqlKeywords.has(nextFirstWord) || nextLine.startsWith(')')) {
                    break;
                }

                // Check if current line ends with identifier and next starts with identifier
                const currentEndsWithIdentifier = /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(currentLine);
                const nextStartsWithIdentifier = /^[a-zA-Z_][a-zA-Z0-9_.*]/.test(nextLine);

                if (currentEndsWithIdentifier && nextStartsWithIdentifier) {
                    // Likely missing comma
                    const range = new vscode.Range(
                        i,
                        lineText.trimEnd().length,
                        i,
                        lineText.trimEnd().length
                    );
                    return this.createDiagnostic(
                        range,
                        'Possible missing comma between columns in SELECT list',
                        vscode.DiagnosticSeverity.Warning
                    );
                }

                break; // Only check immediate next non-empty line
            }
        }

        return null;
    }
}
