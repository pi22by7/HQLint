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
    TrailingWhitespaceRule,
    MissingCommaRule,
    HiveVariableRule
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
            new MissingCommaRule(),
            new HiveVariableRule(),
        ];
    }

    private getEnabledRules(): LintRule[] {
        const config = vscode.workspace.getConfiguration('hql.linting.rules');
        return this.rules.filter(rule => {
            // Map rule names to config keys
            const configKey = this.getRuleConfigKey(rule.name);
            return config.get<boolean>(configKey, true);
        });
    }

    private getRuleConfigKey(ruleName: string): string {
        // Convert rule names to config keys
        // e.g., 'keyword-casing' -> 'keywordCasing'
        return ruleName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    public lint(document: vscode.TextDocument): void {
        try {
            this.logger.debug(`Linting document: ${document.uri.toString()}`);

            // Check file size limit
            const config = vscode.workspace.getConfiguration('hql.linting');
            const maxFileSize = config.get<number>('maxFileSize', 1048576); // Default 1MB
            const fileSize = Buffer.byteLength(document.getText(), 'utf8');

            if (fileSize > maxFileSize) {
                this.logger.warn(`File size ${fileSize} bytes exceeds limit ${maxFileSize} bytes. Skipping linting.`);
                this.diagnosticsProvider.set(document.uri, []);
                return;
            }

            const diagnostics: vscode.Diagnostic[] = [];
            const enabledRules = this.getEnabledRules();
            this.logger.debug(`Running ${enabledRules.length} enabled rules`);

            // Track multi-line comment state
            let inBlockComment = false;

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                let text = line.text;

                // Check for block comment start/end on this line
                const blockCommentStart = text.indexOf('/*');
                const blockCommentEnd = text.indexOf('*/');

                // Determine if we're in a block comment for this line
                let skipLine = false;

                if (inBlockComment) {
                    // We're already in a block comment
                    if (blockCommentEnd !== -1) {
                        // Block comment ends on this line
                        inBlockComment = false;
                        // Only process text after the closing */
                        text = text.substring(blockCommentEnd + 2);
                        if (text.trim() === '') {
                            skipLine = true;
                        }
                    } else {
                        // Still inside block comment
                        skipLine = true;
                    }
                } else {
                    // Not currently in a block comment
                    if (blockCommentStart !== -1) {
                        if (blockCommentEnd !== -1 && blockCommentEnd > blockCommentStart) {
                            // Block comment starts and ends on same line - already handled by removeComments
                        } else {
                            // Block comment starts but doesn't end on this line
                            inBlockComment = true;
                            // Only process text before the opening /*
                            text = text.substring(0, blockCommentStart);
                            if (text.trim() === '') {
                                skipLine = true;
                            }
                        }
                    }
                }

                if (skipLine) {
                    continue;
                }

                const context: LintContext = {
                    document,
                    lineNumber: i,
                    lineText: text,
                    logger: this.logger
                };

                for (const rule of enabledRules) {
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
