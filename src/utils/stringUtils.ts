/**
 * Utility functions for string parsing and manipulation.
 * These are pure functions that can be easily unit tested.
 */

/**
 * Counts unescaped quotes in a string, properly handling escape sequences.
 *
 * @param text The text to analyze
 * @param quoteChar The quote character to count (' or ")
 * @returns The number of unescaped quotes
 *
 * @example
 * countUnescapedQuotes("'hello'", "'") // Returns 2
 * countUnescapedQuotes("'O\\'Brien'", "'") // Returns 2
 * countUnescapedQuotes("'test\\\\'", "'") // Returns 2
 */
export function countUnescapedQuotes(text: string, quoteChar: string): number {
    let count = 0;
    let i = 0;

    while (i < text.length) {
        if (text[i] === quoteChar) {
            // Count consecutive backslashes before this quote
            let backslashCount = 0;
            for (let j = i - 1; j >= 0 && text[j] === '\\'; j--) {
                backslashCount++;
            }

            // Quote is escaped if there's an odd number of backslashes before it
            const isEscaped = backslashCount % 2 === 1;

            if (!isEscaped) {
                count++;
            }
        }
        i++;
    }

    return count;
}

/**
 * Removes SQL comments from a line of text.
 * Handles both line comments (--) and block comments (/* *\/)
 *
 * @param text The text to process
 * @returns Text with comments removed
 */
export function removeComments(text: string): string {
    // Remove line comments
    let result = text.replace(/--.*$/, '');

    // Remove block comments (simple case - single line)
    result = result.replace(/\/\*.*?\*\//g, '');

    return result;
}

/**
 * Checks if a quote is properly escaped by counting preceding backslashes.
 *
 * @param text The full text
 * @param position The position of the quote character
 * @returns true if the quote is escaped
 */
export function isQuoteEscaped(text: string, position: number): boolean {
    if (position === 0) {
        return false;
    }

    let backslashCount = 0;
    for (let i = position - 1; i >= 0 && text[i] === '\\'; i--) {
        backslashCount++;
    }

    // Escaped if odd number of backslashes
    return backslashCount % 2 === 1;
}

/**
 * Validates configuration values to ensure they're within acceptable ranges.
 *
 * @param value The value to validate
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @param defaultValue Default value if out of range
 * @returns Validated value
 */
export function validateConfigNumber(
    value: number,
    min: number,
    max: number,
    defaultValue: number
): number {
    if (typeof value !== 'number' || isNaN(value)) {
        return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
}

/**
 * Extracts the position of the last occurrence of a character.
 *
 * @param text The text to search
 * @param char The character to find
 * @returns The index of the last occurrence, or -1 if not found
 */
export function findLastOccurrence(text: string, char: string): number {
    return text.lastIndexOf(char);
}

/**
 * Counts occurrences of a character in text, ignoring those inside strings.
 *
 * @param text The text to analyze
 * @param char The character to count
 * @returns Count of occurrences outside of strings
 */
export function countOutsideStrings(text: string, char: string): number {
    let count = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < text.length; i++) {
        const current = text[i];

        // Check for quote toggles
        if (current === "'" && !inDoubleQuote && !isQuoteEscaped(text, i)) {
            inSingleQuote = !inSingleQuote;
        } else if (current === '"' && !inSingleQuote && !isQuoteEscaped(text, i)) {
            inDoubleQuote = !inDoubleQuote;
        }

        // Count character if outside strings
        if (!inSingleQuote && !inDoubleQuote && current === char) {
            count++;
        }
    }

    return count;
}
