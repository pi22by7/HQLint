import * as vscode from 'vscode';

export class HQLDiagnosticsProvider {
    public diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('hql');
    }

    public set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
        this.diagnosticCollection.set(uri, diagnostics);
    }

    public clear(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
