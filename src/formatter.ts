import * as vscode from 'vscode';

export class HQLFormatter {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('hql.formatting');
    }

    private getConfig(): {
        indentSize: number;
        uppercaseKeywords: boolean;
        newlineBeforeKeywords: boolean;
        alignCommas: boolean;
    } {
        return {
            indentSize: this.config.get('indentSize', 2),
            uppercaseKeywords: this.config.get('uppercaseKeywords', true),
            newlineBeforeKeywords: this.config.get('newlineBeforeKeywords', true),
            alignCommas: this.config.get('alignCommas', false)
        };
    }

    public format(document: vscode.TextDocument): vscode.TextEdit[] {
        const fullRange = new vscode.Range(
            0,
            0,
            document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length
        );

        const text = document.getText();
        const formatted = this.formatText(text);

        return [vscode.TextEdit.replace(fullRange, formatted)];
    }

    public formatRange(document: vscode.TextDocument, range: vscode.Range): vscode.TextEdit[] {
        const text = document.getText(range);
        const formatted = this.formatText(text);

        return [vscode.TextEdit.replace(range, formatted)];
    }

    public formatOnType(): vscode.TextEdit[] {
        // For now, return empty array - can be enhanced later
        return [];
    }

    private formatText(text: string): string {
        const config = this.getConfig();

        // Split into tokens while preserving strings and comments
        const tokens = this.tokenize(text);

        // Format tokens
        let formatted = '';
        let indentLevel = 0;
        let isFirstTokenInLine = true;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const upperToken = token.toUpperCase();

            // Skip empty tokens
            if (token.trim() === '') {
                continue;
            }

            // Handle comments
            if (token.startsWith('--') || token.startsWith('/*')) {
                formatted += token;
                if (token.startsWith('--')) {
                    formatted += '\n';
                    isFirstTokenInLine = true;
                }
                continue;
            }

            // Handle strings - keep as is
            if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
                formatted += token;
                continue;
            }

            // Check if this is a major keyword that should start a new line
            const majorKeywords = [
                'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
                'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN',
                'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'
            ];

            const isKeyword = this.isKeyword(token);
            const isMajorKeyword = majorKeywords.some(kw => upperToken === kw || upperToken.startsWith(kw));

            // Add newline before major keywords
            if (config.newlineBeforeKeywords && isMajorKeyword && !isFirstTokenInLine) {
                formatted = formatted.trimEnd();
                formatted += '\n';
                formatted += ' '.repeat(indentLevel * config.indentSize);
            } else if (!isFirstTokenInLine) {
                // Add space between tokens
                if (!formatted.endsWith(' ') && !formatted.endsWith('\n')) {
                    formatted += ' ';
                }
            }

            // Apply keyword casing
            if (isKeyword && config.uppercaseKeywords) {
                formatted += upperToken;
            } else {
                formatted += token;
            }

            // Handle indentation changes
            if (upperToken === '(') {
                indentLevel++;
            } else if (upperToken === ')') {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Handle comma formatting
            if (token === ',') {
                if (config.alignCommas) {
                    formatted += '\n' + ' '.repeat(indentLevel * config.indentSize);
                    isFirstTokenInLine = true;
                }
            }

            if (token === '\n') {
                formatted += '\n';
                formatted += ' '.repeat(indentLevel * config.indentSize);
                isFirstTokenInLine = true;
            } else {
                isFirstTokenInLine = false;
            }
        }

        // Clean up extra whitespace
        formatted = formatted
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .replace(/ +/g, ' ')          // Multiple spaces to single
            .trim();

        return formatted + '\n';
    }

    private tokenize(text: string): string[] {
        const tokens: string[] = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        let inBlockComment = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = i + 1 < text.length ? text[i + 1] : '';

            // Handle line comments
            if (!inString && !inBlockComment && char === '-' && nextChar === '-') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                const commentEnd = text.indexOf('\n', i);
                const comment = commentEnd === -1 ? text.slice(i) : text.slice(i, commentEnd);
                tokens.push(comment);
                i += comment.length - 1;
                continue;
            }

            // Handle block comments
            if (!inString && !inBlockComment && char === '/' && nextChar === '*') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                inBlockComment = true;
                current = char + nextChar;
                i++;
                continue;
            }

            if (inBlockComment) {
                current += char;
                if (char === '*' && nextChar === '/') {
                    current += nextChar;
                    tokens.push(current);
                    current = '';
                    inBlockComment = false;
                    i++;
                }
                continue;
            }

            // Handle strings
            if (!inString && (char === "'" || char === '"' || char === '`')) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                inString = true;
                stringChar = char;
                current = char;
                continue;
            }

            if (inString) {
                current += char;
                if (char === stringChar && text[i - 1] !== '\\') {
                    tokens.push(current);
                    current = '';
                    inString = false;
                }
                continue;
            }

            // Handle special characters
            if ('(),;'.includes(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
                continue;
            }

            // Handle whitespace
            if (/\s/.test(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                if (char === '\n') {
                    tokens.push('\n');
                }
                continue;
            }

            // Build current token
            current += char;
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    private isKeyword(token: string): boolean {
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT',
            'OFFSET', 'UNION', 'INTERSECT', 'EXCEPT', 'JOIN', 'INNER', 'LEFT',
            'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'USING', 'AS', 'DISTINCT',
            'ALL', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'RLIKE',
            'REGEXP', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'SHOW', 'DESCRIBE',
            'DESC', 'EXPLAIN', 'MSCK', 'ANALYZE', 'DATABASE', 'SCHEMA', 'TABLE',
            'EXTERNAL', 'TEMPORARY', 'VIEW', 'PARTITION', 'PARTITIONED', 'CLUSTERED',
            'SORTED', 'INTO', 'BUCKETS', 'ROW', 'FORMAT', 'SERDE', 'STORED',
            'LOCATION', 'TBLPROPERTIES', 'IF', 'INSERT', 'UPDATE', 'DELETE',
            'MERGE', 'LOAD', 'EXPORT', 'IMPORT', 'OVERWRITE', 'VALUES', 'SET',
            'INT', 'TINYINT', 'SMALLINT', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL',
            'NUMERIC', 'BOOLEAN', 'STRING', 'VARCHAR', 'CHAR', 'TIMESTAMP', 'DATE',
            'BINARY', 'ARRAY', 'MAP', 'STRUCT', 'UNIONTYPE', 'TRUE', 'FALSE'
        ];

        return keywords.includes(token.toUpperCase());
    }
}
