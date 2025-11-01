import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';

export class KeywordCasingRule extends BaseLintRule {
    name = 'keyword-casing';
    description = 'SQL keywords should be uppercase';

    private keywords = [
        'select', 'from', 'where', 'group by', 'order by', 'having', 'limit', 'offset',
        'join', 'inner join', 'left join', 'right join', 'full outer join', 'cross join', 'left semi join', 'on', 'using',
        'insert', 'into', 'values', 'create', 'table', 'drop', 'alter', 'update', 'delete', 'set', 'merge',
        'distinct', 'as', 'and', 'or', 'not', 'in', 'exists', 'between', 'like', 'rlike', 'regexp',
        'case', 'when', 'then', 'else', 'end',
        'partition', 'partitioned', 'by', 'clustered', 'sorted', 'buckets', 'skewed',
        'over', 'rows', 'range', 'unbounded', 'preceding', 'following', 'current',
        'lateral', 'view', 'explode', 'transform',
        'union', 'intersect', 'except',
        'database', 'schema', 'external', 'temporary', 'show', 'describe', 'explain'
    ];

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            for (const keyword of this.keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                let match;
                while ((match = regex.exec(context.lineText)) !== null) {
                    if (match[0] !== keyword.toUpperCase()) {
                        const range = new vscode.Range(
                            context.lineNumber,
                            match.index,
                            context.lineNumber,
                            match.index + match[0].length
                        );
                        return this.createDiagnostic(
                            range,
                            `SQL keyword '${match[0]}' should be uppercase`
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
