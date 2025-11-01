import * as vscode from 'vscode';
import { Logger } from '../../logger';

export interface LintContext {
    document: vscode.TextDocument;
    lineNumber: number;
    lineText: string;
    logger: Logger;
}

export interface LintRule {
    name: string;
    description: string;
    check(context: LintContext): vscode.Diagnostic | null;
}

export abstract class BaseLintRule implements LintRule {
    abstract name: string;
    abstract description: string;

    protected getSeverity(): vscode.DiagnosticSeverity {
        const config = vscode.workspace.getConfiguration('hql.linting');
        const severity = config.get<string>('severity', 'Warning');

        switch (severity) {
            case 'Error':
                return vscode.DiagnosticSeverity.Error;
            case 'Warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'Information':
                return vscode.DiagnosticSeverity.Information;
            case 'Hint':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    protected createDiagnostic(
        range: vscode.Range,
        message: string,
        severity?: vscode.DiagnosticSeverity
    ): vscode.Diagnostic {
        return new vscode.Diagnostic(
            range,
            message,
            severity || this.getSeverity()
        );
    }

    abstract check(context: LintContext): vscode.Diagnostic | null;
}
