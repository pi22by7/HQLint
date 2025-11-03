import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments } from '../../utils/stringUtils';

export class SemicolonRule extends BaseLintRule {
    name = 'missing-semicolon';
    description = 'Statements should end with a semicolon';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const textWithoutComments = removeComments(context.lineText).trim();
            if (textWithoutComments.length === 0) {
                return null;
            }

            // Check if this is the last non-empty line
            let isLastLine = true;
            for (let i = context.lineNumber + 1; i < context.document.lineCount; i++) {
                const nextLineText = removeComments(context.document.lineAt(i).text).trim();
                if (nextLineText.length > 0) {
                    isLastLine = false;
                    break;
                }
            }

            if (isLastLine && !textWithoutComments.endsWith(';')) {
                const range = new vscode.Range(
                    context.lineNumber,
                    context.lineText.length,
                    context.lineNumber,
                    context.lineText.length
                );
                return this.createDiagnostic(
                    range,
                    'Missing semicolon at end of statement',
                    vscode.DiagnosticSeverity.Information
                );
            }
            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }
}
