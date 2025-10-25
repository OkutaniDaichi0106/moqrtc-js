# Contributing to moqrtc-ts

Thank you for your interest in contributing to moqrtc-ts! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (Node.js version, OS, etc.)
- Any relevant code samples or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome! Please create an issue with:

- A clear, descriptive title
- Detailed description of the proposed enhancement
- Rationale for why this enhancement would be useful
- Any relevant examples or mockups

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes**: Ensure your code follows the project style
4. **Add tests**: If you're adding functionality, add corresponding tests
5. **Run tests**: Ensure all tests pass with `npm test`
6. **Run linter**: Fix any linting issues with `npm run lint`
7. **Format code**: Run `npm run format` to ensure consistent formatting
8. **Update documentation**: Update README.md or other docs if needed
9. **Commit your changes**: Use clear, descriptive commit messages
10. **Push to your fork** and submit a pull request

### Commit Message Guidelines

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests when relevant

Example:
```
Add support for X feature

- Implement core functionality
- Add tests for edge cases
- Update documentation

Fixes #123
```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Building and Testing

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run coverage

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for public APIs
- Avoid `any` types where possible
- Use meaningful variable and function names

### Style Guide

- Follow the existing code style
- Use Prettier for formatting (configured in the project)
- Use ESLint rules (configured in the project)
- Write clear, concise comments for complex logic

### Testing

- Write unit tests for new functionality
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

## Project Structure

```
moqrtc-ts/
├── src/           # Source files
├── dist/          # Compiled output (generated)
├── tests/         # Test files
├── .github/       # GitHub workflows and templates
├── package.json   # Project metadata and dependencies
├── tsconfig.json  # TypeScript configuration
└── README.md      # Project documentation
```

## Getting Help

If you need help or have questions:

- Check existing issues and discussions
- Create a new issue with your question
- Tag it appropriately

## License

By contributing to moqrtc-ts, you agree that your contributions will be licensed under the MIT License.
