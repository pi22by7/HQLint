import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';
import { removeComments } from '../../utils/stringUtils';

export class MissingCommaRule extends BaseLintRule {
    name = 'missing-comma';
    description = 'Check for potential missing commas in SELECT statements';

    private selectKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i;
    private fromKeyword = /\bFROM\b/i;

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const text = removeComments(context.lineText).trim();

            // Skip empty lines, comments, or lines with FROM/WHERE/etc
            if (!text || this.fromKeyword.test(text)) {
                return null;
            }

            // Look for pattern: word/identifier followed by newline without comma
            // This suggests a missing comma in a column list
            const nextLine = context.lineNumber + 1 < context.document.lineCount
                ? context.document.lineAt(context.lineNumber + 1).text.trim()
                : '';

            // If current line has an identifier/word and next line starts with identifier (not keyword)
            // and current line doesn't end with comma, it might be missing comma
            if (text && !text.endsWith(',') && !text.endsWith('(') && nextLine) {
                const hasIdentifier = /[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(text);
                const nextStartsWithIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*/.test(nextLine);
                const nextIsKeyword = /^(FROM|WHERE|GROUP|ORDER|HAVING|LIMIT|JOIN|UNION|EXCEPT|INTERSECT)\b/i.test(nextLine);

                if (hasIdentifier && nextStartsWithIdentifier && !nextIsKeyword) {
                    // Check if we're in a SELECT context (within previous 10 lines)
                    let inSelectContext = false;
                    for (let i = Math.max(0, context.lineNumber - 10); i < context.lineNumber; i++) {
                        const prevLine = context.document.lineAt(i).text;
                        if (this.selectKeywords.test(prevLine)) {
                            inSelectContext = true;
                            break;
                        }
                        if (this.fromKeyword.test(prevLine)) {
                            inSelectContext = false;
                            break;
                        }
                    }

                    if (inSelectContext) {
                        const range = new vscode.Range(
                            context.lineNumber,
                            text.length,
                            context.lineNumber,
                            text.length
                        );
                        return this.createDiagnostic(
                            range,
                            'Possible missing comma - next line appears to be another column'
                        );
                    }
                }
            }

            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name} rule`, error);
            return null;
        }
    }
}
