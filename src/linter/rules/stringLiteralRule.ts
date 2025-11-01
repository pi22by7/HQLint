import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { countUnescapedQuotes, removeComments } from '../../utils/stringUtils';

export class StringLiteralRule extends BaseLintRule {
    name = 'unclosed-string';
    description = 'String literals must be properly closed';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const withoutComments = removeComments(context.lineText);

            // Check single quotes
            const singleQuotes = countUnescapedQuotes(withoutComments, "'");
            if (singleQuotes % 2 !== 0) {
                const lastQuoteIndex = context.lineText.lastIndexOf("'");
                const range = new vscode.Range(
                    context.lineNumber,
                    lastQuoteIndex,
                    context.lineNumber,
                    lastQuoteIndex + 1
                );
                return this.createDiagnostic(
                    range,
                    "Unclosed single quote string literal. Expected closing ' at end of line.",
                    vscode.DiagnosticSeverity.Error
                );
            }

            // Check double quotes
            const doubleQuotes = countUnescapedQuotes(withoutComments, '"');
            if (doubleQuotes % 2 !== 0) {
                const lastQuoteIndex = context.lineText.lastIndexOf('"');
                const range = new vscode.Range(
                    context.lineNumber,
                    lastQuoteIndex,
                    context.lineNumber,
                    lastQuoteIndex + 1
                );
                return this.createDiagnostic(
                    range,
                    'Unclosed double quote string literal. Expected closing " at end of line.',
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
