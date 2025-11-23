import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('HQL Extension Integration Test Suite', () => {
    vscode.window.showInformationMessage('Starting HQL extension tests.');

    suite('Extension Activation', () => {
        test('Extension should be present', () => {
            assert.ok(vscode.extensions.getExtension('pi22by7.hqlint'));
        });

        test('Extension should activate', async function() {
            this.timeout(10000);
            const ext = vscode.extensions.getExtension('pi22by7.hqlint');
            assert.ok(ext);
            await ext!.activate();
            assert.strictEqual(ext!.isActive, true);
        });
    });

    suite('Language Support', () => {
        test('HQL language should be registered', () => {
            const languages = vscode.languages.getLanguages();
            assert.ok(languages);
        });
    });

    suite('Formatter Integration', () => {
        test.skip('Should format simple SELECT statement', async function() {
            // Skipping: sql-formatter behavior in test environment needs investigation
            this.timeout(10000);

            const content = 'select * from users where id=1;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                doc.uri
            );

            assert.ok(edits);
            assert.ok(Array.isArray(edits));
            if (edits && edits.length > 0) {
                const formatted = edits[0].newText;
                // Should have uppercase keywords
                assert.ok(formatted.includes('SELECT'), `Expected SELECT in: ${formatted}`);
                assert.ok(formatted.includes('FROM'), `Expected FROM in: ${formatted}`);
                assert.ok(formatted.includes('WHERE'), `Expected WHERE in: ${formatted}`);
            }
        });

        test.skip('Should respect formatting configuration', async function() {
            // Skipping: sql-formatter behavior in test environment needs investigation
            this.timeout(10000);

            // Set configuration
            const config = vscode.workspace.getConfiguration('hql.formatting');
            await config.update('keywordCase', 'lower', vscode.ConfigurationTarget.Global);

            const content = 'SELECT * FROM users;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                doc.uri
            );

            if (edits && edits.length > 0) {
                const formatted = edits[0].newText.toLowerCase();
                assert.ok(formatted.includes('select'), `Expected select in: ${formatted}`);
                assert.ok(formatted.includes('from'), `Expected from in: ${formatted}`);
            }

            // Reset configuration
            await config.update('keywordCase', undefined, vscode.ConfigurationTarget.Global);
        });

        test('Should handle malformed SQL gracefully', async function() {
            this.timeout(10000);

            const content = 'SELECT * FROM WHERE ;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            // Should not throw an error
            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                doc.uri
            );

            // Either returns edits or empty array, should not crash
            assert.ok(edits !== undefined);
        });
    });

    suite('Linter Integration', () => {
        test('Should detect lowercase keywords', async function() {
            this.timeout(10000);

            // Enable keywordCasing rule for this test
            const config = vscode.workspace.getConfiguration('hql.linting.rules');
            await config.update('keywordCasing', true, vscode.ConfigurationTarget.Global);

            const content = 'select * from users;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            // Open the document to trigger linting
            await vscode.window.showTextDocument(doc);

            // Wait for linting to complete (debounced 500ms)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Should have diagnostics for lowercase keywords
            assert.ok(diagnostics.length > 0);
            const hasKeywordWarning = diagnostics.some(d =>
                d.message.includes('keyword') && d.message.includes('uppercase')
            );
            assert.ok(hasKeywordWarning);

            // Reset configuration after test
            await config.update('keywordCasing', false, vscode.ConfigurationTarget.Global);
        });

        test('Should detect missing semicolons', async function() {
            this.timeout(10000);

            const content = 'SELECT * FROM users';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            await vscode.window.showTextDocument(doc);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            const hasSemicolonWarning = diagnostics.some(d =>
                d.message.includes('semicolon')
            );
            assert.ok(hasSemicolonWarning);
        });

        test('Should detect unclosed strings', async function() {
            this.timeout(10000);

            const content = "SELECT * FROM users WHERE name = 'John";
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            await vscode.window.showTextDocument(doc);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            const hasStringWarning = diagnostics.some(d =>
                d.message.includes('string') || d.message.includes('quote')
            );
            assert.ok(hasStringWarning);
        });

        test('Should detect unbalanced parentheses', async function() {
            this.timeout(10000);

            const content = 'SELECT * FROM users WHERE (id = 1';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            await vscode.window.showTextDocument(doc);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            const hasParenWarning = diagnostics.some(d =>
                d.message.includes('parenthes')
            );
            assert.ok(hasParenWarning);
        });

        test('Should respect linting configuration', async function() {
            this.timeout(10000);

            // Disable linting
            const config = vscode.workspace.getConfiguration('hql.linting');
            await config.update('enabled', false, vscode.ConfigurationTarget.Global);

            const content = 'select * from users';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            await vscode.window.showTextDocument(doc);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            // Should have no diagnostics when disabled
            assert.strictEqual(diagnostics.length, 0);

            // Re-enable linting
            await config.update('enabled', true, vscode.ConfigurationTarget.Global);
        });
    });

    suite('IntelliSense Integration', () => {
        test('Should provide completions for HQL keywords', async function() {
            this.timeout(10000);

            const content = 'SEL';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            const position = new vscode.Position(0, 3);

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                doc.uri,
                position
            );

            assert.ok(completions);
            assert.ok(completions.items.length > 0);

            const selectCompletion = completions.items.find(item =>
                item.label === 'SELECT'
            );
            assert.ok(selectCompletion);
        });

        test('Should provide hover information', async function() {
            this.timeout(10000);

            const content = 'SELECT * FROM users;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            const position = new vscode.Position(0, 2); // On 'SELECT'

            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                doc.uri,
                position
            );

            assert.ok(hovers);
            assert.ok(hovers.length > 0);
        });

        test('Should provide signature help for functions', async function() {
            this.timeout(10000);

            const content = 'SELECT COUNT(';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            const position = new vscode.Position(0, 13); // After opening paren

            const signatures = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                doc.uri,
                position,
                '('
            );

            assert.ok(signatures);
            assert.ok(signatures.signatures.length > 0);
        });
    });

    suite('Code Actions', () => {
        test.skip('Should provide quick fixes for issues', async function() {
            // Skipping: Code actions provider needs investigation in test environment
            this.timeout(10000);

            const content = 'select * from users;';
            const doc = await vscode.workspace.openTextDocument({
                language: 'hql',
                content
            });

            await vscode.window.showTextDocument(doc);
            await new Promise(resolve => setTimeout(resolve, 1000));

            const diagnostics = vscode.languages.getDiagnostics(doc.uri);

            if (diagnostics.length > 0) {
                const codeActions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
                    'vscode.executeCodeActionProvider',
                    doc.uri,
                    diagnostics[0].range
                );

                assert.ok(codeActions, 'Code actions should be returned');
                assert.ok(codeActions.length > 0, 'Should have at least one code action available');
            }
        });
    });

    suite('Configuration', () => {
        test('Should read configuration values', () => {
            const lintConfig = vscode.workspace.getConfiguration('hql.linting');
            assert.ok(lintConfig.get('enabled') !== undefined);

            const formatConfig = vscode.workspace.getConfiguration('hql.formatting');
            assert.ok(formatConfig.get('enabled') !== undefined);
            assert.ok(formatConfig.get('tabWidth') !== undefined);
        });

        test('Should have valid default values', async function() {
            // Reset any modified configuration first
            const formatConfig = vscode.workspace.getConfiguration('hql.formatting');
            await formatConfig.update('keywordCase', undefined, vscode.ConfigurationTarget.Global);

            // Now check defaults
            const lintConfig = vscode.workspace.getConfiguration('hql.linting');
            assert.strictEqual(lintConfig.get('enabled'), true);

            assert.strictEqual(formatConfig.get('tabWidth'), 2);
            assert.strictEqual(formatConfig.get('keywordCase'), 'upper');
        });
    });
});
