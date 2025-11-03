# Changelog

All notable changes to the HQLint extension will be documented in this file.

## [0.4.1] - 2024-11-03

### Fixed
- **Comment Handling** - Linting rules now properly ignore SQL keywords within comments
  - KeywordCasingRule no longer flags keywords in `--` or `/* */` comments
  - SemicolonRule now uses proper comment stripping instead of manual checks
  - Consistent use of `removeComments()` utility across all content-checking rules

---

## [0.4.0] - 2024-11-02

### Added

#### Production-Focused Lint Rules
- **Missing Comma Detection** - Detects potential missing commas in SELECT column lists by analyzing line patterns and context
  - Context-aware checking (looks at surrounding lines)
  - Validates within SELECT statement scope
  - Configuration: `hql.linting.rules.missingComma`
- **Hive Variable Validation** - Validates Hive variable substitution syntax `${namespace:varname}`
  - Checks for valid namespaces: hiveconf, hivevar, env, system, define
  - Validates variable names (must start with letter/underscore)
  - Provides specific error messages for different syntax errors
  - Configuration: `hql.linting.rules.hiveVariable`

### Improved

#### Code Quality
- Bundled extension with esbuild for 83% size reduction (924 KB → 155 KB)
- Production minification for faster extension loading
- Proper exclusion of dev files from extension package

---

## [0.3.0] - 2024-11-02

### Added

#### Testing Infrastructure
- Complete test suite with Mocha and Chai
- VSCode test runner integration (@vscode/test-electron)
- 50+ unit tests for string utilities covering edge cases
- 30+ integration tests for formatting, linting, IntelliSense, and code actions
- Test coverage for all core functionality
- Automated test discovery with glob patterns

#### Granular Linting Configuration
- Per-rule configuration options for fine-grained control:
  - `hql.linting.rules.keywordCasing` - Toggle keyword casing checks
  - `hql.linting.rules.semicolon` - Toggle semicolon checks
  - `hql.linting.rules.stringLiteral` - Toggle string literal checks
  - `hql.linting.rules.parentheses` - Toggle parentheses balance checks
  - `hql.linting.rules.trailingWhitespace` - Toggle whitespace checks
- File size limit configuration (`hql.linting.maxFileSize`) to skip linting large files (default: 1MB)
- Automatic file size checking before linting to prevent performance issues

#### Documentation
- **API.md** - Comprehensive API documentation for developers:
  - Architecture overview with detailed module descriptions
  - Complete API reference for all classes and functions
  - Configuration schema documentation
  - Extension points guide for adding new features
  - Performance considerations and best practices
- **CONTRIBUTING.md** - Complete contributor guide:
  - Development setup instructions
  - Coding standards and style guide
  - Testing guidelines with examples
  - Pull request process and checklist
  - Feature addition guides (lint rules, commands, formatters)
  - Issue reporting templates

### Improved

#### Performance
- Linter now respects file size limits to prevent hanging on large files
- Only enabled lint rules are executed, reducing overhead
- Better logging of rule execution for performance monitoring

#### Developer Experience
- Comprehensive test suite ensures reliability
- Clear API documentation for contributors
- Structured contributing guidelines
- All modules fully documented with usage examples

#### Code Quality
- Better separation of concerns with rule configuration handling
- Improved error messages with file size context
- Enhanced logging throughout the linting pipeline

### Technical

#### Architecture
- Test infrastructure with proper VS Code integration
- Modular rule configuration system
- File size validation in linter
- Rule name to config key mapping for flexibility

#### Dependencies
- Added `@vscode/test-electron` for integration testing
- Added `mocha` and `@types/mocha` for test framework
- Added `chai` and `@types/chai` for assertions
- Added `glob` and `@types/glob` for test discovery

---

## [0.2.0] - 2024-11-02

### Added

#### Formatting Enhancements
- Integrated professional-grade `sql-formatter` library with Hive dialect support
- 10+ new formatting configuration options:
  - `tabWidth` - Control indentation size (1-8 spaces)
  - `useTabs` - Use tabs instead of spaces
  - `keywordCase`, `dataTypeCase`, `functionCase`, `identifierCase` - Granular case control (upper/lower/preserve)
  - `indentStyle` - Choose between standard, tabularLeft, or tabularRight alignment
  - `linesBetweenQueries` - Control blank lines between SQL statements
  - `denseOperators` - Compact operator spacing option
  - `newlineBeforeSemicolon` - Semicolon placement control

#### IntelliSense Improvements
- **Enhanced hover documentation** with syntax, examples, and direct links to Apache Hive documentation for 25+ keywords and functions
- **Signature help** for 30+ HQL functions showing parameter hints and documentation as you type
- **150+ HQL keywords and functions** added to auto-completion including:
  - Window functions (OVER, LAG, LEAD, ROW_NUMBER, RANK, DENSE_RANK, etc.)
  - File formats (ORC, PARQUET, AVRO, TEXTFILE, SEQUENCEFILE, RCFILE)
  - Advanced features (LATERAL VIEW, TRANSFORM, TABLESAMPLE)
  - Complete data type coverage (TINYINT, DECIMAL, VARCHAR, BINARY, etc.)
- **9 code snippets** for common HQL patterns:
  - CREATE TABLE with partitioning
  - INSERT OVERWRITE
  - SELECT with JOINs
  - Window functions
  - CASE statements
  - LATERAL VIEW EXPLODE
  - Common Table Expressions (WITH)
  - GROUP BY aggregations
  - UNION queries

#### Quick Fixes
- Convert keywords to uppercase
- Add missing semicolons
- Remove trailing whitespace
- Close unclosed string literals

#### Developer Experience
- Structured logging system with configurable log levels (debug/info/warn/error)
- Comprehensive error handling throughout the extension
- Better error messages with actionable context

### Improved

#### Performance
- Implemented 500ms debouncing for linting to reduce CPU usage during typing
- Input validation for all configuration values to prevent invalid settings

#### Code Quality & Reliability
- Fixed critical regex lookbehind bug causing incorrect string literal detection
- Fixed tokenizer escape sequence handling (properly handles `\'`, `\"`, `\\`)
- Modularized lint rules into separate, maintainable files with base class architecture
- Added proper operator precedence in trailing whitespace detection

#### Architecture
- Complete error handling coverage with user-friendly messages
- Separated pure utility functions for better testability
- Improved configuration hot-reload support

### Fixed
- String literals with escaped quotes now properly detected (e.g., `'O\'Brien'`)
- Backslash escape sequences correctly handled in formatter
- Parentheses and string counting now ignores content within comments
- Configuration values validated and clamped to safe ranges

---

## [0.1.0] - Initial Release

### Added
- Real-time HQL linting with 8+ rules
- Basic HQL formatting
- Syntax highlighting for .hql and .hive files
- Auto-completion for common HQL keywords and functions
- Hover documentation for basic keywords
- Diagnostic reporting in Problems panel
