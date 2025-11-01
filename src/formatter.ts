import * as vscode from 'vscode';
import { format } from 'sql-formatter';
import { Logger } from './logger';
import { validateConfigNumber } from './utils/stringUtils';

export class HQLFormatter {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    private getConfig() {
        const config = vscode.workspace.getConfiguration('hql.formatting');

        return {
            language: 'hive' as const,
            tabWidth: validateConfigNumber(config.get<number>('tabWidth', 2), 1, 8, 2),
            useTabs: config.get<boolean>('useTabs', false),
            keywordCase: config.get<'upper' | 'lower' | 'preserve'>('keywordCase', 'upper'),
            dataTypeCase: config.get<'upper' | 'lower' | 'preserve'>('dataTypeCase', 'upper'),
            functionCase: config.get<'upper' | 'lower' | 'preserve'>('functionCase', 'upper'),
            identifierCase: config.get<'upper' | 'lower' | 'preserve'>('identifierCase', 'preserve'),
            indentStyle: config.get<'standard' | 'tabularLeft' | 'tabularRight'>('indentStyle', 'standard'),
            linesBetweenQueries: validateConfigNumber(config.get<number>('linesBetweenQueries', 1), 0, 5, 1),
            denseOperators: config.get<boolean>('denseOperators', false),
            newlineBeforeSemicolon: config.get<boolean>('newlineBeforeSemicolon', false),
        };
    }

    public format(document: vscode.TextDocument): vscode.TextEdit[] {
        try {
            this.logger.debug(`Formatting document: ${document.uri.toString()}`);

            const fullRange = new vscode.Range(
                0,
                0,
                document.lineCount - 1,
                document.lineAt(document.lineCount - 1).text.length
            );

            const text = document.getText();
            const config = this.getConfig();

            this.logger.debug('Formatter config', config);

            const formatted = format(text, config);

            this.logger.debug('Formatting complete');
            return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (error) {
            this.logger.error('Error formatting document', error);
            vscode.window.showErrorMessage(
                `HQL formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return [];
        }
    }

    public formatRange(document: vscode.TextDocument, range: vscode.Range): vscode.TextEdit[] {
        try {
            this.logger.debug('Formatting range');

            const text = document.getText(range);
            const config = this.getConfig();

            const formatted = format(text, config);

            return [vscode.TextEdit.replace(range, formatted)];
        } catch (error) {
            this.logger.error('Error formatting range', error);
            vscode.window.showErrorMessage(
                `HQL formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return [];
        }
    }

    public formatOnType(): vscode.TextEdit[] {
        // For now, return empty array - can be enhanced later
        return [];
    }
}
