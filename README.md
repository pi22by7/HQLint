# HQL Linter & Formatter

A VS Code extension that provides real-time linting and formatting for HQL (Hive Query Language) files. Catch syntax errors instantly before running resource-intensive queries.

## Why This Extension?

Running HQL queries in production environments can be extremely resource-intensive and time-consuming—sometimes taking hours to complete. When a query fails due to syntax errors after consuming significant computational resources, it wastes both time and infrastructure capacity.

This extension solves that problem by providing **instant feedback** as you write HQL code, catching common syntax errors and style issues before you execute your queries. Save hours of debugging time and computational resources by validating your HQL syntax right in your editor.

## Features

### 🔍 Real-Time Linting

Detects syntax errors and issues as you type:

- **Syntax errors**: Unclosed string literals, unbalanced parentheses
- **Missing clauses**: JOIN without ON/USING, incomplete statements
- **Style issues**: Lowercase keywords, trailing whitespace
- **Best practices**: SELECT \* usage, GROUP BY without aggregates

### ✨ Smart Formatting

Auto-format your HQL with a single command:

- Uppercase SQL keywords for consistency
- Proper indentation for readability
- Newlines before major clauses (SELECT, FROM, WHERE, etc.)
- Optional comma alignment in SELECT lists

### 💡 IntelliSense

- **Auto-completion** for HQL keywords and functions
- **Hover documentation** for quick reference
- **Code actions** with automatic quick fixes

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

  // Formatting
  "hql.formatting.enabled": true,
  "hql.formatting.indentSize": 2,
  "hql.formatting.uppercaseKeywords": true,
  "hql.formatting.newlineBeforeKeywords": true,
  "hql.formatting.alignCommas": false
}
```

### Configuration Options

| Setting                                | Type    | Default     | Description                        |
| -------------------------------------- | ------- | ----------- | ---------------------------------- |
| `hql.linting.enabled`                  | boolean | `true`      | Enable/disable linting             |
| `hql.linting.severity`                 | string  | `"Warning"` | Severity level for diagnostics     |
| `hql.formatting.enabled`               | boolean | `true`      | Enable/disable formatting          |
| `hql.formatting.indentSize`            | number  | `2`         | Spaces per indentation level       |
| `hql.formatting.uppercaseKeywords`     | boolean | `true`      | Convert keywords to uppercase      |
| `hql.formatting.newlineBeforeKeywords` | boolean | `true`      | Add newlines before major keywords |
| `hql.formatting.alignCommas`           | boolean | `false`     | Align commas in SELECT lists       |

## Example

**Before:**

```hql
select id, name, sum(amount) from users left join orders on users.id = orders.user_id where status = 'active' group by id, name
```

**After:**

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

```

## License

MIT
```
