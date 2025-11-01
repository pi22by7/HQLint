import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments, countOutsideStrings } from '../../utils/stringUtils';

export class ParenthesesRule extends BaseLintRule {
    name = 'unbalanced-parentheses';
    description = 'Parentheses must be balanced';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const withoutComments = removeComments(context.lineText);

            const openCount = countOutsideStrings(withoutComments, '(');
            const closeCount = countOutsideStrings(withoutComments, ')');

            if (openCount > closeCount) {
                const lastOpenIndex = context.lineText.lastIndexOf('(');
                const range = new vscode.Range(
                    context.lineNumber,
                    lastOpenIndex,
                    context.lineNumber,
                    lastOpenIndex + 1
                );
                return this.createDiagnostic(
                    range,
                    'Unbalanced parentheses - missing closing parenthesis )',
                    vscode.DiagnosticSeverity.Error
                );
            } else if (closeCount > openCount) {
                const lastCloseIndex = context.lineText.lastIndexOf(')');
                const range = new vscode.Range(
                    context.lineNumber,
                    lastCloseIndex,
                    context.lineNumber,
                    lastCloseIndex + 1
                );
                return this.createDiagnostic(
                    range,
                    'Unbalanced parentheses - missing opening parenthesis (',
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
