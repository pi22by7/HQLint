import * as vscode from 'vscode';

interface FunctionSignature {
    label: string;
    documentation: string;
    parameters: Array<{
        label: string;
        documentation: string;
    }>;
}

export function getHQLSignatures(): { [key: string]: FunctionSignature } {
    /* eslint-disable @typescript-eslint/naming-convention */
    return {
        'COUNT': {
            label: 'COUNT([DISTINCT] expr) | COUNT(*)',
            documentation: 'Returns the number of rows that match the specified criteria.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to count. Use * to count all rows.'
                }
            ]
        },
        'SUM': {
            label: 'SUM([DISTINCT] expr)',
            documentation: 'Returns the sum of all values in a numeric column.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The numeric column or expression to sum.'
                }
            ]
        },
        'AVG': {
            label: 'AVG([DISTINCT] expr)',
            documentation: 'Returns the average value of a numeric column.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The numeric column or expression to average.'
                }
            ]
        },
        'MIN': {
            label: 'MIN(expr)',
            documentation: 'Returns the minimum value in a column.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to find the minimum of.'
                }
            ]
        },
        'MAX': {
            label: 'MAX(expr)',
            documentation: 'Returns the maximum value in a column.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to find the maximum of.'
                }
            ]
        },
        'CONCAT': {
            label: 'CONCAT(str1, str2, ...)',
            documentation: 'Concatenates two or more strings together.',
            parameters: [
                {
                    label: 'str1, str2, ...',
                    documentation: 'Strings to concatenate. Returns NULL if any argument is NULL.'
                }
            ]
        },
        'CONCAT_WS': {
            label: 'CONCAT_WS(separator, str1, str2, ...)',
            documentation: 'Concatenates strings with a separator.',
            parameters: [
                {
                    label: 'separator',
                    documentation: 'The separator string to insert between values.'
                },
                {
                    label: 'str1, str2, ...',
                    documentation: 'Strings to concatenate.'
                }
            ]
        },
        'SUBSTRING': {
            label: 'SUBSTRING(str, start_position [, length])',
            documentation: 'Extracts a substring from a string.',
            parameters: [
                {
                    label: 'str',
                    documentation: 'The source string.'
                },
                {
                    label: 'start_position',
                    documentation: 'Starting position (1-indexed).'
                },
                {
                    label: 'length',
                    documentation: 'Optional. Number of characters to extract.'
                }
            ]
        },
        'UPPER': {
            label: 'UPPER(str)',
            documentation: 'Converts a string to uppercase.',
            parameters: [
                {
                    label: 'str',
                    documentation: 'The string to convert.'
                }
            ]
        },
        'LOWER': {
            label: 'LOWER(str)',
            documentation: 'Converts a string to lowercase.',
            parameters: [
                {
                    label: 'str',
                    documentation: 'The string to convert.'
                }
            ]
        },
        'CAST': {
            label: 'CAST(expr AS data_type)',
            documentation: 'Converts a value from one data type to another.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The expression to convert.'
                },
                {
                    label: 'data_type',
                    documentation: 'The target data type (INT, STRING, DOUBLE, DATE, etc.).'
                }
            ]
        },
        'COALESCE': {
            label: 'COALESCE(expr1, expr2, ...)',
            documentation: 'Returns the first non-NULL value in the list.',
            parameters: [
                {
                    label: 'expr1, expr2, ...',
                    documentation: 'Expressions to evaluate. Returns the first non-NULL value.'
                }
            ]
        },
        'IF': {
            label: 'IF(condition, true_value, false_value)',
            documentation: 'Returns true_value if condition is true, otherwise false_value.',
            parameters: [
                {
                    label: 'condition',
                    documentation: 'Boolean expression to evaluate.'
                },
                {
                    label: 'true_value',
                    documentation: 'Value to return if condition is true.'
                },
                {
                    label: 'false_value',
                    documentation: 'Value to return if condition is false.'
                }
            ]
        },
        'ROW_NUMBER': {
            label: 'ROW_NUMBER() OVER ([PARTITION BY col] ORDER BY col)',
            documentation: 'Assigns a unique sequential integer to rows within a partition.',
            parameters: [
                {
                    label: 'PARTITION BY col',
                    documentation: 'Optional. Divides rows into partitions.'
                },
                {
                    label: 'ORDER BY col',
                    documentation: 'Defines the sequence of rows within each partition.'
                }
            ]
        },
        'RANK': {
            label: 'RANK() OVER ([PARTITION BY col] ORDER BY col)',
            documentation: 'Returns the rank of each row, with gaps for ties.',
            parameters: [
                {
                    label: 'PARTITION BY col',
                    documentation: 'Optional. Divides rows into partitions.'
                },
                {
                    label: 'ORDER BY col',
                    documentation: 'Defines the ranking order.'
                }
            ]
        },
        'DENSE_RANK': {
            label: 'DENSE_RANK() OVER ([PARTITION BY col] ORDER BY col)',
            documentation: 'Returns the rank of each row, without gaps for ties.',
            parameters: [
                {
                    label: 'PARTITION BY col',
                    documentation: 'Optional. Divides rows into partitions.'
                },
                {
                    label: 'ORDER BY col',
                    documentation: 'Defines the ranking order.'
                }
            ]
        },
        'LAG': {
            label: 'LAG(expr [, offset [, default]]) OVER ([PARTITION BY col] ORDER BY col)',
            documentation: 'Accesses data from a previous row in the same result set.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to retrieve from the previous row.'
                },
                {
                    label: 'offset',
                    documentation: 'Optional. Number of rows back (default: 1).'
                },
                {
                    label: 'default',
                    documentation: 'Optional. Default value when offset goes beyond partition boundary.'
                }
            ]
        },
        'LEAD': {
            label: 'LEAD(expr [, offset [, default]]) OVER ([PARTITION BY col] ORDER BY col)',
            documentation: 'Accesses data from a following row in the same result set.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to retrieve from the following row.'
                },
                {
                    label: 'offset',
                    documentation: 'Optional. Number of rows forward (default: 1).'
                },
                {
                    label: 'default',
                    documentation: 'Optional. Default value when offset goes beyond partition boundary.'
                }
            ]
        },
        'COLLECT_LIST': {
            label: 'COLLECT_LIST(expr)',
            documentation: 'Returns an array of all values from a group, including duplicates.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to collect into an array.'
                }
            ]
        },
        'COLLECT_SET': {
            label: 'COLLECT_SET(expr)',
            documentation: 'Returns an array of unique values from a group.',
            parameters: [
                {
                    label: 'expr',
                    documentation: 'The column or expression to collect unique values from.'
                }
            ]
        },
        'EXPLODE': {
            label: 'EXPLODE(array_or_map)',
            documentation: 'Creates a new row for each element in an array or map.',
            parameters: [
                {
                    label: 'array_or_map',
                    documentation: 'The array or map column to explode.'
                }
            ]
        },
        'DATE_ADD': {
            label: 'DATE_ADD(start_date, num_days)',
            documentation: 'Adds a specified number of days to a date.',
            parameters: [
                {
                    label: 'start_date',
                    documentation: 'The starting date.'
                },
                {
                    label: 'num_days',
                    documentation: 'Number of days to add.'
                }
            ]
        },
        'DATE_SUB': {
            label: 'DATE_SUB(start_date, num_days)',
            documentation: 'Subtracts a specified number of days from a date.',
            parameters: [
                {
                    label: 'start_date',
                    documentation: 'The starting date.'
                },
                {
                    label: 'num_days',
                    documentation: 'Number of days to subtract.'
                }
            ]
        },
        'DATEDIFF': {
            label: 'DATEDIFF(end_date, start_date)',
            documentation: 'Returns the number of days between two dates.',
            parameters: [
                {
                    label: 'end_date',
                    documentation: 'The ending date.'
                },
                {
                    label: 'start_date',
                    documentation: 'The starting date.'
                }
            ]
        },
        'REGEXP_REPLACE': {
            label: 'REGEXP_REPLACE(str, regexp, replacement)',
            documentation: 'Replaces all substrings matching a regular expression.',
            parameters: [
                {
                    label: 'str',
                    documentation: 'The source string.'
                },
                {
                    label: 'regexp',
                    documentation: 'The regular expression pattern.'
                },
                {
                    label: 'replacement',
                    documentation: 'The replacement string.'
                }
            ]
        },
        'REGEXP_EXTRACT': {
            label: 'REGEXP_EXTRACT(str, regexp [, idx])',
            documentation: 'Extracts a substring matching a regular expression group.',
            parameters: [
                {
                    label: 'str',
                    documentation: 'The source string.'
                },
                {
                    label: 'regexp',
                    documentation: 'The regular expression pattern with capturing groups.'
                },
                {
                    label: 'idx',
                    documentation: 'Optional. Index of the group to extract (default: 1).'
                }
            ]
        }
    };
    /* eslint-enable @typescript-eslint/naming-convention */
}

export function provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.SignatureHelp | null {
    const line = document.lineAt(position.line).text;
    const textBeforeCursor = line.substring(0, position.character);

    // Find function name before cursor
    const functionMatch = textBeforeCursor.match(/(\w+)\s*\([^)]*$/);
    if (!functionMatch) {
        return null;
    }

    const functionName = functionMatch[1].toUpperCase();
    const signatures = getHQLSignatures();
    const signatureInfo = signatures[functionName];

    if (!signatureInfo) {
        return null;
    }

    const signatureHelp = new vscode.SignatureHelp();
    const signature = new vscode.SignatureInformation(signatureInfo.label, signatureInfo.documentation);

    signature.parameters = signatureInfo.parameters.map(param =>
        new vscode.ParameterInformation(param.label, param.documentation)
    );

    signatureHelp.signatures = [signature];
    signatureHelp.activeSignature = 0;

    // Determine active parameter based on comma count
    const insideParens = textBeforeCursor.substring(textBeforeCursor.lastIndexOf('(') + 1);
    const commaCount = (insideParens.match(/,/g) || []).length;
    signatureHelp.activeParameter = Math.min(commaCount, signature.parameters.length - 1);

    return signatureHelp;
}
