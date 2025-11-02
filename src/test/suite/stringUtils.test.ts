import * as assert from 'assert';
import {
    countUnescapedQuotes,
    removeComments,
    isQuoteEscaped,
    validateConfigNumber,
    findLastOccurrence,
    countOutsideStrings
} from '../../utils/stringUtils';

suite('String Utils Test Suite', () => {
    suite('countUnescapedQuotes', () => {
        test('should count simple quotes', () => {
            assert.strictEqual(countUnescapedQuotes("'hello'", "'"), 2);
            assert.strictEqual(countUnescapedQuotes('"hello"', '"'), 2);
        });

        test('should handle escaped quotes correctly', () => {
            assert.strictEqual(countUnescapedQuotes("'O\\'Brien'", "'"), 2);
            assert.strictEqual(countUnescapedQuotes('"He said \\"hello\\""', '"'), 2);
        });

        test('should handle double backslashes', () => {
            // 'test\\' has 2 unescaped quotes (opening and closing)
            assert.strictEqual(countUnescapedQuotes("'test\\\\'", "'"), 2);
        });

        test('should handle multiple escaped quotes', () => {
            assert.strictEqual(countUnescapedQuotes("'\\'\\'\\'", "'"), 2);
        });

        test('should handle no quotes', () => {
            assert.strictEqual(countUnescapedQuotes("hello world", "'"), 0);
            assert.strictEqual(countUnescapedQuotes("hello world", '"'), 0);
        });

        test('should handle empty string', () => {
            assert.strictEqual(countUnescapedQuotes("", "'"), 0);
        });

        test('should handle only quotes', () => {
            assert.strictEqual(countUnescapedQuotes("''''", "'"), 4);
        });

        test('should handle mixed escaped and unescaped', () => {
            assert.strictEqual(countUnescapedQuotes("'a\\'b'c'", "'"), 3);
        });
    });

    suite('removeComments', () => {
        test('should remove line comments', () => {
            assert.strictEqual(
                removeComments("SELECT * FROM users -- get all users"),
                "SELECT * FROM users "
            );
        });

        test('should remove block comments', () => {
            assert.strictEqual(
                removeComments("SELECT /* comment */ * FROM users"),
                "SELECT  * FROM users"
            );
        });

        test('should handle multiple block comments', () => {
            assert.strictEqual(
                removeComments("SELECT /* c1 */ * /* c2 */ FROM users"),
                "SELECT  *  FROM users"
            );
        });

        test('should handle no comments', () => {
            const sql = "SELECT * FROM users";
            assert.strictEqual(removeComments(sql), sql);
        });

        test('should handle empty string', () => {
            assert.strictEqual(removeComments(""), "");
        });

        test('should handle line starting with comment', () => {
            assert.strictEqual(removeComments("-- comment"), "");
        });

        test('should preserve code before line comment', () => {
            const result = removeComments("WHERE id = 1 -- filter");
            assert.strictEqual(result, "WHERE id = 1 ");
        });
    });

    suite('isQuoteEscaped', () => {
        test('should detect escaped quotes', () => {
            const text = "'O\\'Brien'";
            assert.strictEqual(isQuoteEscaped(text, 3), true); // The escaped quote
        });

        test('should detect unescaped quotes', () => {
            const text = "'hello'";
            assert.strictEqual(isQuoteEscaped(text, 0), false); // Opening quote
            assert.strictEqual(isQuoteEscaped(text, 6), false); // Closing quote
        });

        test('should handle double backslashes', () => {
            const text = "'test\\\\'";
            assert.strictEqual(isQuoteEscaped(text, 7), false); // Quote after \\
        });

        test('should handle triple backslashes', () => {
            const text = "'\\\\\\'";
            assert.strictEqual(isQuoteEscaped(text, 4), true); // Escaped quote
        });

        test('should handle position 0', () => {
            assert.strictEqual(isQuoteEscaped("'test'", 0), false);
        });

        test('should handle no backslashes', () => {
            const text = "'test'";
            assert.strictEqual(isQuoteEscaped(text, 5), false);
        });
    });

    suite('validateConfigNumber', () => {
        test('should clamp values within range', () => {
            assert.strictEqual(validateConfigNumber(5, 1, 10, 2), 5);
            assert.strictEqual(validateConfigNumber(0, 1, 10, 2), 1);
            assert.strictEqual(validateConfigNumber(15, 1, 10, 2), 10);
        });

        test('should return default for invalid values', () => {
            assert.strictEqual(validateConfigNumber(NaN, 1, 10, 2), 2);
            assert.strictEqual(validateConfigNumber(Infinity, 1, 10, 2), 10);
            assert.strictEqual(validateConfigNumber(-Infinity, 1, 10, 2), 1);
        });

        test('should handle boundary values', () => {
            assert.strictEqual(validateConfigNumber(1, 1, 10, 2), 1);
            assert.strictEqual(validateConfigNumber(10, 1, 10, 2), 10);
        });

        test('should handle negative ranges', () => {
            assert.strictEqual(validateConfigNumber(-5, -10, -1, -5), -5);
            assert.strictEqual(validateConfigNumber(-15, -10, -1, -5), -10);
            assert.strictEqual(validateConfigNumber(0, -10, -1, -5), -1);
        });

        test('should handle floating point numbers', () => {
            assert.strictEqual(validateConfigNumber(2.5, 1, 10, 2), 2.5);
            assert.strictEqual(validateConfigNumber(0.5, 1, 10, 2), 1);
        });
    });

    suite('findLastOccurrence', () => {
        test('should find last occurrence', () => {
            assert.strictEqual(findLastOccurrence("hello world", "o"), 7);
            assert.strictEqual(findLastOccurrence("test test", "t"), 8);
        });

        test('should return -1 for not found', () => {
            assert.strictEqual(findLastOccurrence("hello", "x"), -1);
        });

        test('should handle empty string', () => {
            assert.strictEqual(findLastOccurrence("", "a"), -1);
        });

        test('should handle single character', () => {
            assert.strictEqual(findLastOccurrence("a", "a"), 0);
        });

        test('should handle special characters', () => {
            assert.strictEqual(findLastOccurrence("a.b.c", "."), 3);
            assert.strictEqual(findLastOccurrence("a(b)c", "("), 1);
        });
    });

    suite('countOutsideStrings', () => {
        test('should count characters outside strings', () => {
            assert.strictEqual(countOutsideStrings("a + 'b' + c", "+"), 2);
            assert.strictEqual(countOutsideStrings('a + "b" + c', "+"), 2);
        });

        test('should ignore characters inside strings', () => {
            assert.strictEqual(countOutsideStrings("'a + b' + c", "+"), 1);
            assert.strictEqual(countOutsideStrings('"a + b" + c', "+"), 1);
        });

        test('should handle escaped quotes', () => {
            assert.strictEqual(countOutsideStrings("'a\\'b' + c", "+"), 1);
            assert.strictEqual(countOutsideStrings('"a\\"b" + c', "+"), 1);
        });

        test('should handle mixed quote types', () => {
            assert.strictEqual(countOutsideStrings("'a' + \"b\" + c", "+"), 2);
        });

        test('should handle no strings', () => {
            assert.strictEqual(countOutsideStrings("a + b + c", "+"), 2);
        });

        test('should handle empty string', () => {
            assert.strictEqual(countOutsideStrings("", "+"), 0);
        });

        test('should handle only strings', () => {
            assert.strictEqual(countOutsideStrings("'+++' \"+++\"", "+"), 0);
        });

        test('should handle nested quotes', () => {
            assert.strictEqual(countOutsideStrings("'a\"b' + c", "+"), 1);
            assert.strictEqual(countOutsideStrings('"a\'b" + c', "+"), 1);
        });

        test('should handle parentheses', () => {
            assert.strictEqual(countOutsideStrings("(a) '(' (b)", "("), 2);
        });

        test('should handle unclosed strings gracefully', () => {
            // Should still count up to the unclosed string
            assert.strictEqual(countOutsideStrings("a + 'b", "+"), 1);
        });
    });
});
