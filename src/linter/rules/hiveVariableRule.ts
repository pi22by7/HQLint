import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';

export class HiveVariableRule extends BaseLintRule {
    name = 'hive-variable';
    description = 'Validate Hive variable syntax (${hiveconf:varname})';

    // Matches Hive variable patterns
    private variablePattern = /\$\{([^}]*)\}/g;
    private validVariableFormat = /^(hiveconf|hivevar|env|system|define):[a-zA-Z_][a-zA-Z0-9_]*$/;

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            const text = context.lineText;
            let match;

            // Reset regex
            this.variablePattern.lastIndex = 0;

            while ((match = this.variablePattern.exec(text)) !== null) {
                const fullMatch = match[0];  // e.g., ${hiveconf:varname}
                const innerContent = match[1]; // e.g., hiveconf:varname

                // Check for empty variable
                if (!innerContent || innerContent.trim() === '') {
                    const range = new vscode.Range(
                        context.lineNumber,
                        match.index,
                        context.lineNumber,
                        match.index + fullMatch.length
                    );
                    return this.createDiagnostic(
                        range,
                        'Empty Hive variable: ${} should contain namespace:varname'
                    );
                }

                // Check for valid format (namespace:varname)
                if (!this.validVariableFormat.test(innerContent)) {
                    const range = new vscode.Range(
                        context.lineNumber,
                        match.index,
                        context.lineNumber,
                        match.index + fullMatch.length
                    );

                    // Specific error messages
                    if (!innerContent.includes(':')) {
                        return this.createDiagnostic(
                            range,
                            `Invalid Hive variable syntax: missing colon (should be \${namespace:varname})`
                        );
                    }

                    const parts = innerContent.split(':');
                    const namespace = parts[0];
                    const varname = parts[1];

                    if (!['hiveconf', 'hivevar', 'env', 'system', 'define'].includes(namespace)) {
                        return this.createDiagnostic(
                            range,
                            `Invalid namespace '${namespace}': use hiveconf, hivevar, env, system, or define`
                        );
                    }

                    if (!varname || varname.trim() === '') {
                        return this.createDiagnostic(
                            range,
                            'Variable name is empty after colon'
                        );
                    }

                    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varname)) {
                        return this.createDiagnostic(
                            range,
                            `Invalid variable name '${varname}': must start with letter/underscore and contain only alphanumeric/underscore`
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
