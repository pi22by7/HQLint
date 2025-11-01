# Changelog

All notable changes to the HQLint extension will be documented in this file.

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
