# HQLint API Documentation

This document provides detailed API documentation for developers working with or extending the HQLint VS Code extension.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Modules](#core-modules)
- [Extension API](#extension-api)
- [Linting System](#linting-system)
- [Formatting System](#formatting-system)
- [Utility Functions](#utility-functions)
- [Configuration](#configuration)

---

## Architecture Overview

HQLint follows a modular architecture with clear separation of concerns:

```
src/
├── extension.ts              # Extension entry point & VS Code integration
├── linter.ts                 # Linting orchestration
├── formatter.ts              # SQL formatting using sql-formatter
├── diagnostics.ts            # Diagnostic management
├── logger.ts                 # Logging system
├── hoverProvider.ts          # Hover documentation provider
├── signatureProvider.ts      # Function signature help
├── snippets.ts               # Code snippets
├── linter/
│   └── rules/                # Modular lint rules
│       ├── baseRule.ts       # Base class for all rules
│       ├── keywordCasingRule.ts
│       ├── semicolonRule.ts
│       ├── stringLiteralRule.ts
│       ├── parenthesesRule.ts
│       └── trailingWhitespaceRule.ts
└── utils/
    └── stringUtils.ts        # Pure utility functions
```

---

## Core Modules

### Logger (`src/logger.ts`)

Provides structured logging with configurable log levels.

#### Class: `Logger`

**Constructor:**
```typescript
constructor(channelName: string = 'HQL')
```

**Methods:**

- `debug(message: string, data?: any): void` - Log debug information
- `info(message: string, data?: any): void` - Log informational messages
- `warn(message: string, data?: any): void` - Log warnings
- `error(message: string, error?: any): void` - Log errors with stack traces
- `show(): void` - Show the output channel
- `dispose(): void` - Cleanup resources

**Enum: `LogLevel`**
```typescript
enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
```

**Configuration:**
- `hql.logLevel`: Set log level (debug/info/warn/error)

**Example:**
```typescript
const logger = new Logger('HQL');
logger.info('Extension activated');
logger.error('Formatting failed', error);
```

---

### Diagnostics Provider (`src/diagnostics.ts`)

Manages VS Code diagnostics lifecycle.

#### Class: `HQLDiagnosticsProvider`

**Constructor:**
```typescript
constructor()
```

**Methods:**

- `set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void` - Set diagnostics for a document
- `clear(uri: vscode.Uri): void` - Clear diagnostics for a document
- `dispose(): void` - Dispose of all diagnostics

**Example:**
```typescript
const diagnosticsProvider = new HQLDiagnosticsProvider();
diagnosticsProvider.set(document.uri, [diagnostic1, diagnostic2]);
```

---

## Extension API

### Entry Point (`src/extension.ts`)

**Exported Functions:**

#### `activate(context: vscode.ExtensionContext): void`

Called when extension is activated. Sets up:
- Document formatting provider
- Range formatting provider
- Completion provider
- Hover provider
- Signature help provider
- Code action provider
- Event listeners for document changes

**Parameters:**
- `context`: VS Code extension context for subscriptions

#### `deactivate(): void`

Called when extension is deactivated. Cleanup is handled automatically through context subscriptions.

**Registered Commands:**
- `hql.formatDocument` - Format current HQL document
- `hql.lintDocument` - Lint current HQL document

---

## Linting System

### Linter (`src/linter.ts`)

Orchestrates linting rules and generates diagnostics.

#### Class: `HQLLinter`

**Constructor:**
```typescript
constructor(diagnosticsProvider: HQLDiagnosticsProvider, logger: Logger)
```

**Public Methods:**

- `lint(document: vscode.TextDocument): void` - Lint a document and generate diagnostics

**Private Methods:**

- `initializeRules(): LintRule[]` - Initialize all available lint rules
- `getEnabledRules(): LintRule[]` - Get rules enabled by configuration
- `getRuleConfigKey(ruleName: string): string` - Convert rule name to config key

**Configuration:**
- `hql.linting.enabled` - Enable/disable linting
- `hql.linting.severity` - Default severity level
- `hql.linting.maxFileSize` - Maximum file size to lint (bytes)
- `hql.linting.rules.*` - Individual rule toggles

**Example:**
```typescript
const linter = new HQLLinter(diagnosticsProvider, logger);
linter.lint(document);
```

---

### Lint Rules (`src/linter/rules/`)

All lint rules implement the `LintRule` interface.

#### Interface: `LintRule`

```typescript
interface LintRule {
    name: string;
    description: string;
    check(context: LintContext): vscode.Diagnostic | null;
}
```

#### Interface: `LintContext`

```typescript
interface LintContext {
    document: vscode.TextDocument;
    lineNumber: number;
    lineText: string;
    logger: Logger;
}
```

#### Base Class: `BaseLintRule`

All rules extend this abstract class.

**Protected Methods:**

- `getSeverity(): vscode.DiagnosticSeverity` - Get configured severity
- `createDiagnostic(range, message, severity?): vscode.Diagnostic` - Create diagnostic

**Example Rule Implementation:**

```typescript
export class MyCustomRule extends BaseLintRule {
    name = 'my-custom-rule';
    description = 'Checks for custom patterns';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            // Implement your rule logic
            if (/* condition */) {
                const range = new vscode.Range(/*...*/);
                return this.createDiagnostic(range, 'Issue detected');
            }
            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name}`, error);
            return null;
        }
    }
}
```

#### Built-in Rules:

1. **KeywordCasingRule** (`keyword-casing`)
   - Checks for lowercase SQL keywords
   - Config: `hql.linting.rules.keywordCasing`

2. **SemicolonRule** (`semicolon`)
   - Checks for missing semicolons
   - Config: `hql.linting.rules.semicolon`

3. **StringLiteralRule** (`string-literal`)
   - Checks for unclosed string literals
   - Config: `hql.linting.rules.stringLiteral`

4. **ParenthesesRule** (`parentheses`)
   - Checks for unbalanced parentheses
   - Config: `hql.linting.rules.parentheses`

5. **TrailingWhitespaceRule** (`trailing-whitespace`)
   - Checks for trailing whitespace
   - Config: `hql.linting.rules.trailingWhitespace`

---

## Formatting System

### Formatter (`src/formatter.ts`)

Uses the `sql-formatter` library with Hive dialect.

#### Class: `HQLFormatter`

**Constructor:**
```typescript
constructor(logger: Logger)
```

**Public Methods:**

- `format(document: vscode.TextDocument): vscode.TextEdit[]` - Format entire document
- `formatRange(document: vscode.TextDocument, range: vscode.Range): vscode.TextEdit[]` - Format a range

**Private Methods:**

- `getConfig()` - Read formatting configuration
- `formatText(text: string): string` - Format text using sql-formatter

**Configuration Options:**
- `hql.formatting.enabled` - Enable/disable formatting
- `hql.formatting.tabWidth` - Indentation width (1-8)
- `hql.formatting.useTabs` - Use tabs instead of spaces
- `hql.formatting.keywordCase` - Keyword case (upper/lower/preserve)
- `hql.formatting.dataTypeCase` - Data type case
- `hql.formatting.functionCase` - Function case
- `hql.formatting.identifierCase` - Identifier case
- `hql.formatting.indentStyle` - Indent style (standard/tabularLeft/tabularRight)
- `hql.formatting.linesBetweenQueries` - Blank lines between queries (0-5)
- `hql.formatting.denseOperators` - Dense operator spacing
- `hql.formatting.newlineBeforeSemicolon` - Semicolon placement

**Example:**
```typescript
const formatter = new HQLFormatter(logger);
const edits = formatter.format(document);
```

---

## Utility Functions

### String Utilities (`src/utils/stringUtils.ts`)

Pure utility functions for string parsing and validation.

#### Functions:

**`countUnescapedQuotes(text: string, quoteChar: string): number`**

Counts unescaped quotes in a string, handling escape sequences correctly.

```typescript
countUnescapedQuotes("'O\\'Brien'", "'") // Returns 2
```

**`removeComments(text: string): string`**

Removes SQL comments (line and block) from text.

```typescript
removeComments("SELECT * -- comment") // Returns "SELECT * "
```

**`isQuoteEscaped(text: string, position: number): boolean`**

Checks if a quote at a position is escaped.

```typescript
isQuoteEscaped("'O\\'Brien'", 3) // Returns true
```

**`validateConfigNumber(value: number, min: number, max: number, defaultValue: number): number`**

Validates and clamps configuration numbers.

```typescript
validateConfigNumber(10, 1, 5, 2) // Returns 5 (clamped)
```

**`findLastOccurrence(text: string, char: string): number`**

Finds the last occurrence of a character.

```typescript
findLastOccurrence("hello", "l") // Returns 3
```

**`countOutsideStrings(text: string, char: string): number`**

Counts character occurrences outside of string literals.

```typescript
countOutsideStrings("'a+b' + c", "+") // Returns 1
```

---

## Configuration

### Configuration Schema

All configuration is namespaced under `hql.*`:

#### Linting Configuration

```json
{
  "hql.linting.enabled": true,
  "hql.linting.severity": "Warning",
  "hql.linting.maxFileSize": 1048576,
  "hql.linting.rules.keywordCasing": true,
  "hql.linting.rules.semicolon": true,
  "hql.linting.rules.stringLiteral": true,
  "hql.linting.rules.parentheses": true,
  "hql.linting.rules.trailingWhitespace": true
}
```

#### Formatting Configuration

```json
{
  "hql.formatting.enabled": true,
  "hql.formatting.tabWidth": 2,
  "hql.formatting.useTabs": false,
  "hql.formatting.keywordCase": "upper",
  "hql.formatting.dataTypeCase": "upper",
  "hql.formatting.functionCase": "upper",
  "hql.formatting.identifierCase": "preserve",
  "hql.formatting.indentStyle": "standard",
  "hql.formatting.linesBetweenQueries": 1,
  "hql.formatting.denseOperators": false,
  "hql.formatting.newlineBeforeSemicolon": false
}
```

#### Logging Configuration

```json
{
  "hql.logLevel": "info"
}
```

### Reading Configuration

```typescript
const config = vscode.workspace.getConfiguration('hql.linting');
const enabled = config.get<boolean>('enabled', true);
```

### Updating Configuration

```typescript
const config = vscode.workspace.getConfiguration('hql.formatting');
await config.update('keywordCase', 'lower', vscode.ConfigurationTarget.Global);
```

---

## IntelliSense Providers

### Hover Provider (`src/hoverProvider.ts`)

Provides hover documentation for HQL keywords and functions.

**Function:**
```typescript
export function provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Hover | null
```

### Signature Provider (`src/signatureProvider.ts`)

Provides function signature help.

**Function:**
```typescript
export function provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.SignatureHelp | null
```

### Snippets (`src/snippets.ts`)

Provides code snippets for common HQL patterns.

**Function:**
```typescript
export function getHQLSnippets(): vscode.CompletionItem[]
```

Available snippets:
- CREATE TABLE
- INSERT OVERWRITE
- SELECT JOIN
- WINDOW FUNCTION
- CASE WHEN
- LATERAL VIEW EXPLODE
- WITH CTE
- GROUP BY AGGREGATE
- UNION
- PARTITIONED BY

---

## Testing

### Test Structure

```
src/test/
├── runTest.ts              # Test runner entry point
└── suite/
    ├── index.ts            # Mocha test suite setup
    ├── stringUtils.test.ts # Unit tests for string utilities
    └── extension.test.ts   # Integration tests
```

### Running Tests

```bash
npm test
```

### Writing Tests

```typescript
import * as assert from 'assert';
import { countUnescapedQuotes } from '../../utils/stringUtils';

suite('My Test Suite', () => {
    test('Should do something', () => {
        const result = countUnescapedQuotes("'test'", "'");
        assert.strictEqual(result, 2);
    });
});
```

---

## Extension Points

### Adding a New Lint Rule

1. Create a new file in `src/linter/rules/`
2. Extend `BaseLintRule`
3. Implement `check()` method
4. Add to `initializeRules()` in `linter.ts`
5. Add configuration in `package.json`

### Adding a New Command

1. Register in `contributes.commands` in `package.json`
2. Register command handler in `extension.ts` using `vscode.commands.registerCommand()`
3. Add to `context.subscriptions`

### Adding Configuration

1. Add to `contributes.configuration.properties` in `package.json`
2. Access using `vscode.workspace.getConfiguration()`

---

## Performance Considerations

1. **Debouncing:** Linting is debounced by 500ms to avoid excessive runs
2. **File Size Limits:** Files larger than `maxFileSize` are skipped
3. **Lazy Loading:** Extension only activates on `.hql` or `.hive` files
4. **Rule Filtering:** Only enabled rules are executed

---

## Error Handling

All public methods follow this pattern:

```typescript
try {
    // Operation
} catch (error) {
    logger.error('Error message', error);
    vscode.window.showErrorMessage('User-friendly message');
    return []; // Graceful degradation
}
```

---

## Best Practices

1. **Always log errors** using the Logger
2. **Use pure functions** for testable logic
3. **Follow the rule interface** for consistency
4. **Respect configuration** settings
5. **Handle edge cases** gracefully
6. **Document public APIs** with JSDoc comments
7. **Write tests** for new features

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License

MIT License - See [LICENSE](LICENSE) file for details.
