import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';

export class SemicolonRule extends BaseLintRule {
    name = 'missing-semicolon';
    description = 'Statements should end with a semicolon';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const trimmed = context.lineText.trim();
            if (trimmed.length === 0 || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
                return null;
            }

            // Check if this is the last non-empty line
            let isLastLine = true;
            for (let i = context.lineNumber + 1; i < context.document.lineCount; i++) {
                const nextLine = context.document.lineAt(i).text.trim();
                if (nextLine.length > 0 && !nextLine.startsWith('--') && !nextLine.startsWith('/*')) {
                    isLastLine = false;
                    break;
                }
            }

            if (isLastLine && !trimmed.endsWith(';')) {
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
