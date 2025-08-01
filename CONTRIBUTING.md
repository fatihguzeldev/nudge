# Contributing to Nudge Bot

Thank you for your interest in contributing to Nudge Bot! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the issue template** when creating a new issue
3. **Provide detailed information**:
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs

### Suggesting Features

1. **Check existing feature requests**
2. **Describe the problem** your feature solves
3. **Provide use cases** and examples
4. **Consider implementation details**

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/fatihguzeldev/nudge.git
   cd nudge
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Workflow

1. **Write tests first** (TDD approach)
2. **Follow the existing code style**
3. **Keep commits atomic and descriptive**
4. **Update documentation** if needed
5. **Ensure all tests pass**:
   ```bash
   pnpm test
   pnpm typecheck
   ```

#### Code Style Guidelines

- **TypeScript**: Use strict mode
- **Architecture**: Follow feature-based structure
- **Naming**: Use descriptive names
  - Classes: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case or index.ts
- **Comments**: Write JSDoc for public APIs
- **Error handling**: Always handle errors gracefully

#### Testing Requirements

- **Unit tests**: Required for all new features
- **Integration tests**: For external integrations
- **Coverage**: Maintain >80% coverage
- **Mocking**: Use Jest mocks appropriately

#### Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

Examples:
```
feat(scheduler): add support for timezone configuration
fix(telegram): handle rate limit errors gracefully
docs(readme): update installation instructions
```

### Pull Request Process

1. **Update your branch** with latest main
2. **Run all checks locally**:
   ```bash
   pnpm typecheck
   pnpm test
   pnpm test:coverage
   ```
3. **Create PR with descriptive title**
4. **Fill out the PR template**
5. **Link related issues**
6. **Wait for review**
7. **Address feedback promptly**

### Documentation

- Update README.md for user-facing changes
- Update code comments for API changes
- Add examples for new features
- Keep configuration examples up-to-date

## Project Structure

```
src/
├── config/        # Configuration management
├── telegram/      # Telegram integration
├── scheduler/     # Scheduling logic
├── messages/      # Message selection
├── types/         # TypeScript definitions
└── utils/         # Utility functions

tests/
├── unit/          # Unit tests
└── integration/   # Integration tests
```

## Development Setup

### Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your Telegram credentials:
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Type checking
pnpm typecheck
```

### Manual Testing

1. Create a test configuration
2. Set up a test Telegram bot
3. Run in development mode:
   ```bash
   pnpm dev
   ```

## Release Process

1. Version updates follow semantic versioning
2. Update CHANGELOG.md
3. Create a release PR
4. After merge, tag the release

## Getting Help

- Open an issue for bugs
- Start a discussion for questions
- Join our community chat (if applicable)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Nudge Bot! 🚀