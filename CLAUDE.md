# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HQLint is a VS Code extension that provides real-time linting, formatting, and syntax highlighting for HQL (Hive Query Language) files. The extension helps prevent resource-intensive query failures by catching syntax errors before execution.

**Recent Major Improvements:**
- Integrated `sql-formatter` library for production-quality formatting
- Added comprehensive error handling and logging system
- Implemented debouncing for performance optimization
- Fixed critical parsing bugs (escape sequences, lookbehind regex)
- Implemented proper document-level parsing for linting:
  - SemicolonRule: Full statement parser that tracks parentheses depth and identifies statement boundaries
  - ParenthesesRule: Document-level checking for balanced parentheses across entire file
  - MissingCommaRule: Document-level parser that extracts SELECT column lists and intelligently detects missing commas
  - KeywordCasingRule: Now disabled by default (can be enabled in settings)
- Added 150+ HQL keywords and functions
- Included code snippets for common patterns
- Enhanced quick fixes for common issues

## Common Commands

### Build & Development
- `npm run compile` - Compile TypeScript to JavaScript (output in `out/` directory)
- `npm run watch` - Watch mode for automatic recompilation during development
- `npm run lint` - Run ESLint on the source code
- `npm test` - Run tests (requires compile and lint first via `npm run pretest`)
- `npm run vscode:prepublish` - Prepare extension for publishing (runs compile)

### Extension Development
- Press `F5` in VS Code to launch the extension in debug mode
- Install from VSIX: Use the `hqlint-0.1.0.vsix` file for manual installation

## Architecture

### Core Components

**Extension Entry Point** (`src/extension.ts`)
- Activates on `.hql` or `.hive` file open
- Registers all providers (formatting, completion, hover, diagnostics, code actions)
- Coordinates between linter, formatter, and diagnostics provider
- Implements IntelliSense with 150+ keywords/functions and code snippets
- Provides 4 quick fixes: uppercase keywords, add semicolons, remove trailing whitespace, close quotes
- Implements 500ms debouncing for linting performance
- Comprehensive error handling with user-friendly messages

**Linter** (`src/linter.ts`)
- Rule-based linting system with 7 lint rules (each can be individually enabled/disabled)
- Each rule implements a `check` function that returns diagnostics
- Severity levels configurable via settings: Error, Warning, Information, Hint
- **Lint Rules:**
  - `KeywordCasingRule` - Flags lowercase SQL keywords (SELECT, FROM, WHERE, etc.) - **disabled by default**, can be enabled in settings
  - `SemicolonRule` - **Document-level parser** that detects missing semicolons by tracking statement boundaries and parentheses depth
  - `StringLiteralRule` - Detects unclosed string literals (line-by-line check)
  - `ParenthesesRule` - **Document-level** check for unbalanced parentheses across entire file
  - `TrailingWhitespaceRule` - Flags trailing whitespace at end of lines
  - `MissingCommaRule` - **Document-level parser** that extracts SELECT column lists and detects missing commas between columns
  - `HiveVariableRule` - Validates Hive variable syntax (${hiveconf:varname})

**Formatter** (`src/formatter.ts`)
- **Uses `sql-formatter` library** with Hive dialect for production-quality formatting
- **10+ configuration options:**
  - `tabWidth` (1-8 spaces, validated)
  - `useTabs` (tabs vs spaces)
  - `keywordCase`, `dataTypeCase`, `functionCase`, `identifierCase` (upper/lower/preserve)
  - `indentStyle` (standard/tabularLeft/tabularRight)
  - `linesBetweenQueries` (0-5 blank lines)
  - `denseOperators`, `newlineBeforeSemicolon`
- Comprehensive error handling with logging
- Supports both full document and range formatting

**Diagnostics Provider** (`src/diagnostics.ts`)
- Thin wrapper around VS Code's DiagnosticCollection API
- Manages diagnostic lifecycle (set, clear, dispose)
- Diagnostics are tied to document URIs and cleared when documents close

**Logger** (`src/logger.ts`)
- Structured logging system with output channel
- Configurable log levels: Debug, Info, Warn, Error
- Logs timestamp, level, message, and additional data (including Error objects with stack traces)
- Setting: `hql.logLevel` (debug/info/warn/error)

**String Utilities** (`src/utils/stringUtils.ts`)
- Pure functions for string parsing and validation
- `countUnescapedQuotes` - Properly handles escape sequences (fixes regex lookbehind bug)
- `removeComments` - Strips SQL comments from text
- `isQuoteEscaped` - Checks if a quote is escaped
- `validateConfigNumber` - Validates and clamps numeric config values
- `countOutsideStrings` - Counts characters outside of string literals

**Snippets** (`src/snippets.ts`)
- Pre-built code snippets for common HQL patterns
- **9 snippets:** CREATE TABLE, INSERT OVERWRITE, SELECT JOIN, WINDOW FUNCTION, CASE WHEN, LATERAL VIEW EXPLODE, WITH CTE, GROUP BY AGGREGATE, UNION, PARTITIONED BY
- Full tab-stop navigation and placeholder choices

### Configuration System

All settings are namespaced under `hql.*`:

**Linting:**
- `hql.linting.enabled` - Toggle linting on/off
- `hql.linting.severity` - Default severity (Error/Warning/Information/Hint)

**Formatting (using sql-formatter):**
- `hql.formatting.enabled` - Toggle formatting on/off
- `hql.formatting.tabWidth` - Spaces per indent (1-8, default: 2)
- `hql.formatting.useTabs` - Use tabs instead of spaces
- `hql.formatting.keywordCase` - Keyword case (upper/lower/preserve)
- `hql.formatting.dataTypeCase` - Data type case (upper/lower/preserve)
- `hql.formatting.functionCase` - Function case (upper/lower/preserve)
- `hql.formatting.identifierCase` - Identifier case (upper/lower/preserve)
- `hql.formatting.indentStyle` - Indent style (standard/tabularLeft/tabularRight)
- `hql.formatting.linesBetweenQueries` - Blank lines between queries (0-5)
- `hql.formatting.denseOperators` - Compact operator spacing
- `hql.formatting.newlineBeforeSemicolon` - Place semicolon on new line

**Logging:**
- `hql.logLevel` - Logging verbosity (debug/info/warn/error)

### Language Support

**Syntax Highlighting** (`syntaxes/hql.tmLanguage.json`)
- TextMate grammar for HQL syntax highlighting
- Supports keywords, functions, data types, strings, comments

**Language Configuration** (`language-configuration.json`)
- Defines comment styles, brackets, and auto-closing pairs

### Provider Registration Pattern

All providers follow this pattern in `extension.ts`:
1. Initialize provider class instances
2. Register with VS Code's language API for the 'hql' language ID
3. Check configuration settings before executing
4. Add to `context.subscriptions` for proper cleanup

## Development Notes

### TypeScript Configuration
- Target: ES2020, output to `out/` directory
- Strict mode enabled with consistent casing enforcement
- Source maps enabled for debugging

### Code Quality
- ESLint with TypeScript plugin enforced (ESLint 9.x with flat config)
- Rules include: naming conventions, curly braces, strict equality
- All source files must pass linting before tests run

### Dependencies
- **Production:** `sql-formatter` (v15.6.10) - Hive SQL formatting
- **Dev:** TypeScript 5.9.3, ESLint 9.38.0, @typescript-eslint plugins

### File Extensions
The extension automatically activates for files with `.hql` or `.hive` extensions.

### Error Handling Pattern
All public methods in linter, formatter, and extension use try-catch blocks with:
1. Logging errors via Logger
2. User-friendly error messages via vscode.window.showErrorMessage
3. Graceful degradation (return empty array instead of throwing)

### Performance Optimizations
- **Debouncing:** 500ms delay on document changes before linting
- **Input Validation:** Config values clamped to valid ranges
- **Lazy Loading:** Providers only activate on HQL file open

### Testing Workflow
Test files are available in `examples/` directory:
- `examples/sample.hql` - Sample formatted HQL with various patterns
- `examples/test_errors.hql` - Test cases for linter error detection
- `examples/test_multiline.hql` - Test cases for multiline statement handling
- `examples/test_all_rules.hql` - Comprehensive test for all linting rules (includes intentional errors)

### Known Limitations
- Primarily line-based linting (ParenthesesRule uses document-level checking)
- No semantic analysis (type checking, table/column validation)
- StringLiteralRule only checks per-line (Hive doesn't support multiline strings anyway)
