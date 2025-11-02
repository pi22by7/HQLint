# Contributing to HQLint

Thank you for your interest in contributing to HQLint! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Adding Features](#adding-features)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

This project follows a simple code of conduct:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different opinions and approaches
- Maintain a professional and inclusive environment

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- VS Code (latest version)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/HQLint.git
   cd HQLint
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/pi22by7/HQLint.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Extension

```bash
npm run compile
```

### Watch Mode (Auto-compile)

```bash
npm run watch
```

### Run the Extension in Debug Mode

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open any `.hql` or `.hive` file to test the extension

### Run Tests

```bash
npm test
```

### Run Linter

```bash
npm run lint
```

---

## Project Structure

```
HQLint/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── linter.ts                 # Linting orchestration
│   ├── formatter.ts              # SQL formatting
│   ├── diagnostics.ts            # Diagnostics management
│   ├── logger.ts                 # Logging system
│   ├── hoverProvider.ts          # Hover documentation
│   ├── signatureProvider.ts      # Function signature help
│   ├── snippets.ts               # Code snippets
│   ├── linter/
│   │   └── rules/                # Modular lint rules
│   │       ├── baseRule.ts
│   │       ├── keywordCasingRule.ts
│   │       ├── semicolonRule.ts
│   │       ├── stringLiteralRule.ts
│   │       ├── parenthesesRule.ts
│   │       └── trailingWhitespaceRule.ts
│   ├── utils/
│   │   └── stringUtils.ts        # Pure utility functions
│   └── test/
│       ├── runTest.ts            # Test runner
│       └── suite/
│           ├── index.ts          # Test suite setup
│           ├── stringUtils.test.ts
│           └── extension.test.ts
├── syntaxes/
│   └── hql.tmLanguage.json       # Syntax highlighting grammar
├── examples/
│   ├── sample.hql                # Example formatted HQL
│   └── test_errors.hql           # Test cases for linting
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── README.md                     # User documentation
├── CLAUDE.md                     # AI assistant instructions
├── API.md                        # API documentation
├── CHANGELOG.md                  # Version history
└── CONTRIBUTING.md               # This file
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions or fixes
- `refactor/` - Code refactoring

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Compile
npm run compile

# Run tests
npm test

# Manual testing in VS Code (press F5)
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: keyword completion for window functions"
```

Commit message format:
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Be concise but descriptive
- Reference issue numbers if applicable

### 5. Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template
5. Submit the pull request

---

## Testing

### Types of Tests

1. **Unit Tests** - Test individual functions in isolation
2. **Integration Tests** - Test VS Code API integration

### Writing Unit Tests

Create tests in `src/test/suite/`:

```typescript
import * as assert from 'assert';
import { countUnescapedQuotes } from '../../utils/stringUtils';

suite('String Utils Test Suite', () => {
    test('should count simple quotes', () => {
        assert.strictEqual(countUnescapedQuotes("'hello'", "'"), 2);
    });

    test('should handle escaped quotes', () => {
        assert.strictEqual(countUnescapedQuotes("'O\\'Brien'", "'"), 2);
    });
});
```

### Writing Integration Tests

```typescript
import * as vscode from 'vscode';

suite('Formatter Integration', () => {
    test('Should format SELECT statement', async function() {
        this.timeout(10000);

        const content = 'select * from users;';
        const doc = await vscode.workspace.openTextDocument({
            language: 'hql',
            content
        });

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            doc.uri
        );

        assert.ok(edits && edits.length > 0);
    });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- All new features must include tests
- Bug fixes should include regression tests

---

## Coding Standards

### TypeScript Style

- Use TypeScript strict mode
- Prefer `const` over `let`, avoid `var`
- Use explicit types for function parameters and return values
- Use interfaces for object shapes

### Naming Conventions

- Classes: `PascalCase` (e.g., `HQLLinter`)
- Functions: `camelCase` (e.g., `formatDocument`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Private methods: prefix with `_` is optional but use `private` keyword
- Interfaces: `PascalCase` (e.g., `LintRule`)

### Code Organization

- One class per file
- Group related functions in modules
- Keep files under 300 lines when possible
- Extract reusable logic into utilities

### Comments

- Use JSDoc for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

Example:
```typescript
/**
 * Counts unescaped quotes in a string, properly handling escape sequences.
 *
 * @param text The text to analyze
 * @param quoteChar The quote character to count (' or ")
 * @returns The number of unescaped quotes
 *
 * @example
 * countUnescapedQuotes("'hello'", "'") // Returns 2
 */
export function countUnescapedQuotes(text: string, quoteChar: string): number {
    // Implementation
}
```

### Error Handling

Always use try-catch blocks for operations that can fail:

```typescript
try {
    // Operation
} catch (error) {
    logger.error('Operation failed', error);
    vscode.window.showErrorMessage('User-friendly error message');
    return []; // Graceful degradation
}
```

### Configuration

- All settings must be namespaced under `hql.*`
- Provide sensible defaults
- Document all settings in package.json
- Validate user input

---

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Clear, concise description of changes
2. **Description**:
   - What changed and why
   - Any breaking changes
   - Related issue numbers
3. **Tests**: Include test results
4. **Documentation**: Update relevant docs
5. **Size**: Keep PRs focused and reasonably sized

### PR Checklist

Before submitting, ensure:

- [ ] Code compiles without errors (`npm run compile`)
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for significant changes)
- [ ] Manual testing completed in VS Code
- [ ] Commit messages are clear and descriptive
- [ ] No unnecessary files are included

### Code Review Process

1. Maintainer reviews your PR
2. Address any feedback or requested changes
3. Once approved, maintainer will merge

---

## Adding Features

### Adding a New Lint Rule

1. Create a new file in `src/linter/rules/`:

```typescript
import * as vscode from 'vscode';
import { BaseLintRule, LintContext } from './baseRule';

export class MyCustomRule extends BaseLintRule {
    name = 'my-custom-rule';
    description = 'Description of what this rule checks';

    check(context: LintContext): vscode.Diagnostic | null {
        try {
            // Implement your rule logic
            if (/* condition */) {
                const range = new vscode.Range(/*...*/);
                return this.createDiagnostic(range, 'Issue message');
            }
            return null;
        } catch (error) {
            context.logger.error(`Error in ${this.name}`, error);
            return null;
        }
    }
}
```

2. Add to `src/linter/rules/index.ts`:

```typescript
export { MyCustomRule } from './myCustomRule';
```

3. Register in `src/linter.ts`:

```typescript
private initializeRules(): LintRule[] {
    return [
        // ... existing rules
        new MyCustomRule(),
    ];
}
```

4. Add configuration in `package.json`:

```json
"hql.linting.rules.myCustomRule": {
    "type": "boolean",
    "default": true,
    "description": "Enable my custom rule"
}
```

5. Write tests in `src/test/suite/extension.test.ts`

### Adding a New Formatter Option

1. Add configuration in `package.json`:

```json
"hql.formatting.myOption": {
    "type": "boolean",
    "default": false,
    "description": "Description of the option"
}
```

2. Update `src/formatter.ts` to read and use the option:

```typescript
private getConfig() {
    const config = vscode.workspace.getConfiguration('hql.formatting');
    return {
        // ... existing options
        myOption: config.get<boolean>('myOption', false),
    };
}
```

3. Update README.md with the new option
4. Add tests

### Adding a New Command

1. Register in `package.json`:

```json
"commands": [
    {
        "command": "hql.myCommand",
        "title": "My Command",
        "category": "HQL"
    }
]
```

2. Implement in `src/extension.ts`:

```typescript
const myCommand = vscode.commands.registerCommand('hql.myCommand', () => {
    // Implementation
});
context.subscriptions.push(myCommand);
```

---

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Exact steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**:
   - HQLint version
   - VS Code version
   - Operating system
6. **Logs**: Relevant error messages from HQL output channel
7. **Sample Code**: Minimal HQL code that reproduces the issue

### Feature Requests

When requesting features, include:

1. **Use Case**: Why you need this feature
2. **Description**: Detailed description of the feature
3. **Examples**: Examples of how it would work
4. **Alternatives**: Alternative solutions you've considered

---

## Questions?

If you have questions about contributing:

1. Check existing documentation (README.md, API.md, CLAUDE.md)
2. Search existing issues and pull requests
3. Open a new issue with the `question` label

---

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- GitHub contributors page

---

## License

By contributing to HQLint, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to HQLint! 🚀
