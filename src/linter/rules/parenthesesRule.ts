import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments, countOutsideStrings } from '../../utils/stringUtils';

export class ParenthesesRule extends BaseLintRule {
    name = 'unbalanced-parentheses';
    description = 'Check for unbalanced parentheses across the entire document';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            // Only check on the first line to avoid duplicate diagnostics
            // This rule now checks the entire document for balance
            if (context.lineNumber !== 0) {
                return null;
            }

            let totalOpen = 0;
            let totalClose = 0;
            let firstUnbalancedLine = -1;
            let runningBalance = 0;

            // Scan entire document to check overall balance
            for (let i = 0; i < context.document.lineCount; i++) {
                const lineText = context.document.lineAt(i).text;
                const withoutComments = removeComments(lineText);

                const openCount = countOutsideStrings(withoutComments, '(');
                const closeCount = countOutsideStrings(withoutComments, ')');

                totalOpen += openCount;
                totalClose += closeCount;
                runningBalance += openCount - closeCount;

                // Track first line where balance goes negative (closing without opening)
                if (runningBalance < 0 && firstUnbalancedLine === -1) {
                    firstUnbalancedLine = i;
                }
            }

            // Document-level check: if totals don't match, there's an issue
            if (totalOpen > totalClose) {
                // More opens than closes - find the last opening paren
                for (let i = context.document.lineCount - 1; i >= 0; i--) {
                    const lineText = context.document.lineAt(i).text;
                    if (lineText.indexOf('(') !== -1) {
                        const lastOpenIndex = lineText.lastIndexOf('(');
                        const range = new vscode.Range(i, lastOpenIndex, i, lastOpenIndex + 1);
                        return this.createDiagnostic(
                            range,
                            `Unbalanced parentheses in document - ${totalOpen - totalClose} unclosed parenthesis`,
                            vscode.DiagnosticSeverity.Error
                        );
                    }
                }
            } else if (totalClose > totalOpen && firstUnbalancedLine !== -1) {
                // More closes than opens - flag first line where balance went negative
                const lineText = context.document.lineAt(firstUnbalancedLine).text;
                const lastCloseIndex = lineText.lastIndexOf(')');
                const range = new vscode.Range(
                    firstUnbalancedLine,
                    lastCloseIndex,
                    firstUnbalancedLine,
                    lastCloseIndex + 1
                );
                return this.createDiagnostic(
                    range,
                    `Unbalanced parentheses - ${totalClose - totalOpen} extra closing parenthesis`,
                    vscode.DiagnosticSeverity.Error
                );
            }

            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }
}
