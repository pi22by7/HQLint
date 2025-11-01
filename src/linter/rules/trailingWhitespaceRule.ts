import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';

export class TrailingWhitespaceRule extends BaseLintRule {
    name = 'trailing-whitespace';
    description = 'Lines should not have trailing whitespace';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            if (context.lineText.length > 0 && (context.lineText.endsWith(' ') || context.lineText.endsWith('\t'))) {
                const trimmedLength = context.lineText.trimEnd().length;
                const range = new vscode.Range(
                    context.lineNumber,
                    trimmedLength,
                    context.lineNumber,
                    context.lineText.length
                );
                return this.createDiagnostic(
                    range,
                    'Trailing whitespace',
                    vscode.DiagnosticSeverity.Hint
                );
            }
            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }
}
