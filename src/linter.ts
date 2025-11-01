import * as vscode from 'vscode';
import { HQLDiagnosticsProvider } from './diagnostics';
import { Logger } from './logger';
import {
    LintRule,
    LintContext,
    KeywordCasingRule,
    SemicolonRule,
    StringLiteralRule,
    ParenthesesRule,
    TrailingWhitespaceRule
} from './linter/rules';

export class HQLLinter {
    private diagnosticsProvider: HQLDiagnosticsProvider;
    private logger: Logger;
    private rules: LintRule[];

    constructor(diagnosticsProvider: HQLDiagnosticsProvider, logger: Logger) {
        this.diagnosticsProvider = diagnosticsProvider;
        this.logger = logger;
        this.rules = this.initializeRules();
    }

    private initializeRules(): LintRule[] {
        return [
            new KeywordCasingRule(),
            new SemicolonRule(),
            new StringLiteralRule(),
            new ParenthesesRule(),
            new TrailingWhitespaceRule(),
        ];
    }

    public lint(document: vscode.TextDocument): void {
        try {
            this.logger.debug(`Linting document: ${document.uri.toString()}`);
            const diagnostics: vscode.Diagnostic[] = [];

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const text = line.text;

                const context: LintContext = {
                    document,
                    lineNumber: i,
                    lineText: text,
                    logger: this.logger
                };

                for (const rule of this.rules) {
                    try {
                        const diagnostic = rule.check(context);
                        if (diagnostic) {
                            diagnostic.source = 'HQL Linter';
                            diagnostics.push(diagnostic);
                        }
                    } catch (ruleError) {
                        this.logger.error(`Error in lint rule ${rule.name} at line ${i}`, ruleError);
                        // Continue with other rules
                    }
                }
            }

            this.diagnosticsProvider.set(document.uri, diagnostics);
            this.logger.debug(`Linting complete. Found ${diagnostics.length} issues.`);
        } catch (error) {
            this.logger.error('Error linting document', error);
            vscode.window.showErrorMessage(
                `HQL Linter error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
