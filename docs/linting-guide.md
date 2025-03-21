# Linting and Formatting Guide

This guide provides information on how to use the linting and formatting tools in the Frontapp MCP integration.

## Overview

The project uses the following tools for code quality:

- **ESLint**: For static code analysis to catch potential errors and enforce coding standards
- **Prettier**: For consistent code formatting

## Configuration Files

- `.eslintrc.json`: ESLint configuration
- `.eslintignore`: Files to ignore for ESLint
- `.prettierrc`: Prettier configuration
- `.prettierignore`: Files to ignore for Prettier

## Available Scripts

The following npm scripts are available for linting and formatting:

```bash
# Run ESLint to check for issues
npm run lint

# Run ESLint and automatically fix issues where possible
npm run lint:fix

# Run Prettier to format code
npm run format

# Check if files are formatted according to Prettier rules
npm run format:check

# Run both linting and format checking
npm run check
```

## ESLint Rules

The project uses a combination of recommended rules from ESLint and TypeScript ESLint, with some custom configurations:

### TypeScript-specific Rules

- **explicit-function-return-type**: Functions should have explicit return types (with some exceptions for expressions)
- **no-explicit-any**: Warns when using the `any` type (but doesn't error to allow for flexibility)
- **no-unused-vars**: Errors on unused variables, but ignores variables starting with underscore
- **require-await**: Ensures async functions contain await expressions
- **no-floating-promises**: Prevents unhandled promise rejections
- **no-misused-promises**: Prevents common mistakes with promises

### General Rules

- **no-console**: Warns on console.log usage (but allows warn, error, and info)
- **eqeqeq**: Requires strict equality comparisons (===)
- **prefer-const**: Requires const for variables that are never reassigned
- **no-var**: Disallows var declarations
- **curly**: Requires curly braces for all control statements

## Prettier Configuration

The project uses the following Prettier configuration:

- **semi**: true (semicolons at the end of statements)
- **trailingComma**: es5 (trailing commas where valid in ES5)
- **singleQuote**: true (single quotes for strings)
- **printWidth**: 100 (line length)
- **tabWidth**: 2 (2 spaces per indentation level)
- **useTabs**: false (spaces instead of tabs)
- **bracketSpacing**: true (spaces in object literals)
- **arrowParens**: always (parentheses around arrow function parameters)
- **endOfLine**: lf (line endings)

## Pre-commit Hooks

It's recommended to set up pre-commit hooks to automatically run linting and formatting before each commit. This can be done using tools like Husky and lint-staged.

## VS Code Integration

For VS Code users, it's recommended to install the ESLint and Prettier extensions and configure them to format on save. Add the following to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Troubleshooting

### ESLint and Prettier Conflicts

If you encounter conflicts between ESLint and Prettier, ensure that:

1. The `eslint-config-prettier` is properly configured in your `.eslintrc.json`
2. Prettier is running after ESLint in your workflow

### Common Issues

- **"Cannot find module"**: Ensure all dependencies are installed with `npm install`
- **"Parsing error: Cannot read file 'tsconfig.json'"**: Ensure the path to your tsconfig.json is correct in `.eslintrc.json`
- **"No ESLint configuration found"**: Ensure you're running ESLint from the project root

## Best Practices

1. **Run linting and formatting before committing**: Use `npm run check` before committing changes
2. **Fix linting issues**: Use `npm run lint:fix` to automatically fix many issues
3. **Don't ignore warnings**: Even though they don't fail the build, warnings often indicate potential problems
4. **Keep configuration files up to date**: As the project evolves, update the linting and formatting rules accordingly
