# HQL Linter & Formatter

A VS Code extension that provides real-time linting and formatting for HQL (Hive Query Language) files. Catch syntax errors instantly before running resource-intensive queries.

## Why This Extension?

Running HQL queries in production environments can be extremely resource-intensive and time-consuming—sometimes taking hours to complete. When a query fails due to syntax errors after consuming significant computational resources, it wastes both time and infrastructure capacity.

This extension solves that problem by providing **instant feedback** as you write HQL code, catching common syntax errors and style issues before you execute your queries. Save hours of debugging time and computational resources by validating your HQL syntax right in your editor.

## Features

### 🔍 Real-Time Linting

Powered by document-level parsing for accurate error detection:

- **Syntax errors**: Unclosed string literals, unbalanced parentheses across entire document
- **Statement validation**: Missing semicolons between statements, respecting subqueries and DDL clauses
- **SELECT list analysis**: Missing commas between columns (with smart SQL keyword detection)
- **Hive-specific**: Variable syntax validation (`${hiveconf:varname}`)
- **Optional style checks**: Lowercase keywords (disabled by default), trailing whitespace
- **Quick fixes**: One-click fixes for common issues (uppercase keywords, add semicolons, remove whitespace, close quotes)

### ✨ Professional-Grade Formatting

Powered by the industry-standard `sql-formatter` library with extensive customization:

- **Case control**: Separate settings for keywords, data types, functions, and identifiers (upper/lower/preserve)
- **Indentation styles**: Standard, tabular left-aligned, or tabular right-aligned
- **Flexible spacing**: Control tabs vs spaces, operator density, query separation
- **Configurable layout**: Semicolon placement, line breaks, and more
- **10+ formatting options** to match your team's style guide

### 💡 Intelligent IntelliSense

- **150+ keywords and functions** with context-aware auto-completion
- **Enhanced hover documentation** with syntax, examples, and links to Apache Hive docs
- **Signature help** showing parameter hints and documentation as you type
- **9 code snippets** for common patterns (CREATE TABLE, JOINs, window functions, CTEs, etc.)
- **Quick fixes** for common issues with one-click solutions

### 🎨 Syntax Highlighting

Full syntax highlighting support for:

- HQL keywords and clauses
- Functions and data types
- String literals and comments
- Table and column identifiers

## Installation

### From Visual Studio Marketplace

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac)
3. Search for "HQL Linter & Formatter"
4. Click **Install**

Or install directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/).

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` in VS Code to launch the extension in debug mode

### For Development

Run the extension in watch mode for automatic recompilation:

```bash
npm run watch
```

## Usage

### Opening HQL Files

The extension automatically activates when you open files with `.hql` or `.hive` extensions.

### Formatting

- **Format entire document**: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (Mac)
- **Format selection**: Select text, then right-click → "Format Selection"
- **Command Palette**: `HQL: Format Document`

### Linting

Linting runs automatically when you:

- Open an HQL file
- Edit HQL code
- Save the file

View diagnostics in:

- Inline error squiggles
- Problems panel (`Ctrl+Shift+M`)
- Hover tooltips

### Quick Fixes

When the linter detects fixable issues:

1. Click the lightbulb icon 💡 or press `Ctrl+.`
2. Select the suggested fix
3. The code is automatically corrected

## Configuration

Customize the extension behavior in VS Code settings:

```json
{
  // Linting
  "hql.linting.enabled": true,
  "hql.linting.severity": "Warning", // Error, Warning, Information, or Hint
  "hql.linting.maxFileSize": 1048576, // Maximum file size to lint (1MB)
  "hql.linting.rules.keywordCasing": true,
  "hql.linting.rules.semicolon": true,
  "hql.linting.rules.stringLiteral": true,
  "hql.linting.rules.parentheses": true,
  "hql.linting.rules.trailingWhitespace": true,

  // Formatting
  "hql.formatting.enabled": true,
  "hql.formatting.tabWidth": 2,
  "hql.formatting.useTabs": false,
  "hql.formatting.keywordCase": "upper", // upper, lower, or preserve
  "hql.formatting.dataTypeCase": "upper",
  "hql.formatting.functionCase": "upper",
  "hql.formatting.identifierCase": "preserve",
  "hql.formatting.indentStyle": "standard", // standard, tabularLeft, or tabularRight
  "hql.formatting.linesBetweenQueries": 1,
  "hql.formatting.denseOperators": false,
  "hql.formatting.newlineBeforeSemicolon": false,

  // Logging
  "hql.logLevel": "info" // debug, info, warn, or error
}
```

### Configuration Options

#### Linting
| Setting                                 | Type    | Default     | Description                                |
| --------------------------------------- | ------- | ----------- | ------------------------------------------ |
| `hql.linting.enabled`                   | boolean | `true`      | Enable/disable linting                     |
| `hql.linting.severity`                  | string  | `"Warning"` | Severity level for diagnostics             |
| `hql.linting.maxFileSize`               | number  | `1048576`   | Maximum file size to lint (bytes)          |
| `hql.linting.rules.keywordCasing`       | boolean | `false`     | Check for lowercase SQL keywords (disabled by default) |
| `hql.linting.rules.missingComma`        | boolean | `true`      | Check for missing commas in SELECT lists   |
| `hql.linting.rules.hiveVariable`        | boolean | `true`      | Validate Hive variable syntax              |
| `hql.linting.rules.semicolon`           | boolean | `true`      | Check for missing semicolons               |
| `hql.linting.rules.stringLiteral`       | boolean | `true`      | Check for unclosed string literals         |
| `hql.linting.rules.parentheses`         | boolean | `true`      | Check for unbalanced parentheses           |
| `hql.linting.rules.trailingWhitespace`  | boolean | `true`      | Check for trailing whitespace              |

#### Formatting
| Setting                                 | Type    | Default      | Description                                    |
| --------------------------------------- | ------- | ------------ | ---------------------------------------------- |
| `hql.formatting.enabled`                | boolean | `true`       | Enable/disable formatting                      |
| `hql.formatting.tabWidth`               | number  | `2`          | Number of spaces per indentation (1-8)         |
| `hql.formatting.useTabs`                | boolean | `false`      | Use tabs instead of spaces                     |
| `hql.formatting.keywordCase`            | string  | `"upper"`    | Case for SQL keywords                          |
| `hql.formatting.dataTypeCase`           | string  | `"upper"`    | Case for data types                            |
| `hql.formatting.functionCase`           | string  | `"upper"`    | Case for function names                        |
| `hql.formatting.identifierCase`         | string  | `"preserve"` | Case for identifiers (tables/columns)          |
| `hql.formatting.indentStyle`            | string  | `"standard"` | Indentation style                              |
| `hql.formatting.linesBetweenQueries`    | number  | `1`          | Blank lines between queries (0-5)              |
| `hql.formatting.denseOperators`         | boolean | `false`      | Use compact operator spacing                   |
| `hql.formatting.newlineBeforeSemicolon` | boolean | `false`      | Place semicolon on new line                    |

#### Logging
| Setting         | Type   | Default  | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| `hql.logLevel`  | string | `"info"` | Logging verbosity level       |

## Examples

### Before Formatting

```hql
select id, name, sum(amount) from users left join orders on users.id = orders.user_id where status = 'active' group by id, name
```

### After Formatting

```hql
SELECT id, name, SUM(amount)
FROM users
LEFT JOIN orders
  ON users.id = orders.user_id
WHERE status = 'active'
GROUP BY id, name;
```

### Linting in Action

```hql
-- ❌ Error: Unclosed string literal
SELECT name FROM users WHERE status = 'active

-- ❌ Error: Unbalanced parentheses
SELECT COUNT(id FROM users

-- ⚠️ Warning: JOIN without ON clause
SELECT * FROM users JOIN orders

-- ℹ️ Info: Consider specifying columns
SELECT * FROM users

-- ℹ️ Info: Missing semicolon
SELECT id FROM users
```

## Supported HQL Features

- **Keywords**: SELECT, FROM, WHERE, JOIN, GROUP BY, ORDER BY, etc.
- **Functions**: COUNT, SUM, AVG, MIN, MAX, CONCAT, COLLECT_LIST, etc.
- **Data Types**: INT, BIGINT, STRING, DOUBLE, ARRAY, MAP, STRUCT, etc.
- **Joins**: INNER, LEFT, RIGHT, FULL OUTER, CROSS
- **Partitioning**: PARTITION BY, DISTRIBUTE BY, CLUSTER BY
- **DDL**: CREATE, DROP, ALTER, TRUNCATE, SHOW, DESCRIBE

## Development

### Building

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Testing

```bash
npm test
```

### Project Structure

```
├── src/
│   ├── extension.ts      # Extension entry point
│   ├── linter.ts         # Linting rules and logic
│   ├── formatter.ts      # Formatting logic
│   └── diagnostics.ts    # Diagnostics provider
├── syntaxes/
│   └── hql.tmLanguage.json   # Syntax highlighting grammar
├── examples/             # Example HQL files for testing
├── package.json          # Extension manifest
└── tsconfig.json         # TypeScript configuration
```

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

MIT

## Acknowledgments

Built with ❤️ to make HQL development faster and more efficient.

Special thanks to the `sql-formatter` library for providing production-quality SQL formatting.
