import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments, countOutsideStrings } from '../../utils/stringUtils';

interface Statement {
    startLine: number;
    endLine: number;
    endColumn: number;
    hasSemicolon: boolean;
}

export class SemicolonRule extends BaseLintRule {
    name = 'missing-semicolon';
    description = 'Statements should end with a semicolon';

    // Keywords that start a new top-level statement
    private statementStarters = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|WITH|MERGE|SHOW|DESCRIBE|EXPLAIN|SET|USE)\b/i;

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            // Only run document-level analysis on first line
            if (context.lineNumber !== 0) {
                return null;
            }

            const statements = this.parseStatements(context.document);

            // Check each statement for missing semicolon
            for (const stmt of statements) {
                if (!stmt.hasSemicolon) {
                    const range = new vscode.Range(
                        stmt.endLine,
                        stmt.endColumn,
                        stmt.endLine,
                        stmt.endColumn
                    );
                    return this.createDiagnostic(
                        range,
                        'Missing semicolon at end of statement',
                        vscode.DiagnosticSeverity.Information
                    );
                }
            }

            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }

    private parseStatements(document: vscode.TextDocument): Statement[] {
        const statements: Statement[] = [];
        let currentStatementStart = -1;
        let parenDepth = 0;
        let lastNonEmptyLine = -1;
        let lastNonEmptyColumn = 0;

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            const withoutComments = removeComments(lineText).trim();

            if (withoutComments.length === 0) {
                continue;
            }

            lastNonEmptyLine = i;
            lastNonEmptyColumn = document.lineAt(i).text.trimEnd().length;

            // Track parentheses depth
            const opens = countOutsideStrings(withoutComments, '(');
            const closes = countOutsideStrings(withoutComments, ')');
            parenDepth += opens - closes;

            // Check if this line starts a new statement (at depth 0)
            if (parenDepth === 0 && this.statementStarters.test(withoutComments)) {
                // If we already have a statement in progress, it ended without semicolon
                if (currentStatementStart !== -1 && currentStatementStart !== i) {
                    const prevLine = i - 1;
                    let prevNonEmptyLine = prevLine;
                    let prevColumn = 0;

                    // Find the actual last non-empty line before this new statement
                    while (prevNonEmptyLine >= currentStatementStart) {
                        const prevLineText = document.lineAt(prevNonEmptyLine).text.trimEnd();
                        if (prevLineText.length > 0 && removeComments(prevLineText).trim().length > 0) {
                            prevColumn = prevLineText.length;
                            break;
                        }
                        prevNonEmptyLine--;
                    }

                    statements.push({
                        startLine: currentStatementStart,
                        endLine: prevNonEmptyLine,
                        endColumn: prevColumn,
                        hasSemicolon: false
                    });
                }
                currentStatementStart = i;
            }

            // Check if this line ends a statement (semicolon at depth 0)
            if (parenDepth === 0 && withoutComments.endsWith(';')) {
                if (currentStatementStart !== -1) {
                    statements.push({
                        startLine: currentStatementStart,
                        endLine: i,
                        endColumn: lastNonEmptyColumn,
                        hasSemicolon: true
                    });
                    currentStatementStart = -1;
                }
            }
        }

        // Handle the last statement if it doesn't end with semicolon
        if (currentStatementStart !== -1 && lastNonEmptyLine !== -1) {
            statements.push({
                startLine: currentStatementStart,
                endLine: lastNonEmptyLine,
                endColumn: lastNonEmptyColumn,
                hasSemicolon: false
            });
        }

        return statements;
    }
}
