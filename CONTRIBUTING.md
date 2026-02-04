# Contributing to Darwin Education

Thank you for your interest in contributing to Darwin Education! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 8+
- Git
- Python 3.11+ (for ML training features)
- PostgreSQL 14+ or Supabase account

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/darwin-education.git
cd darwin-education

# Install dependencies
pnpm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase credentials and API keys

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

Required for development:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
GROK_API_KEY=xai-xxx (for AI features)
MINIMAX_API_KEY=xxx (optional fallback)

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_THEORY_GENERATION=true
```

**⚠️ IMPORTANT**: Never commit `.env.local` files. Use `.env.example` templates.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/description-of-feature
# or for bugfixes:
git checkout -b fix/description-of-bug
```

**Branch naming conventions:**
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates
- `perf/*` - Performance improvements

### 2. Make Your Changes

**Code Style Guidelines:**
- Use TypeScript for type safety
- Follow ESLint rules (`pnpm lint`)
- Format with Prettier (`pnpm format`)
- Keep components small and focused
- Add comments for complex logic

**File Organization:**
```
apps/web/
├── app/          # Next.js 15 App Router pages
├── lib/          # Utilities, services, adapters
│   ├── ai/       # AI features
│   ├── ddl/      # Learning gap detection
│   ├── theory-gen/ # Theory generation
│   └── ...
└── components/   # React components

packages/shared/
├── src/
│   ├── calculators/  # TRI, SM-2 algorithms
│   ├── types/        # TypeScript definitions
│   ├── services/     # AI services
│   └── __tests__/    # Unit tests
```

### 3. Test Your Changes

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Build for production
pnpm build
```

### 4. Commit Your Changes

**Commit Message Format:**

```
type(scope): subject

body

footer
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test additions/changes
- `ci` - CI/CD changes
- `chore` - Maintenance tasks

**Examples:**
```
feat(ai): implement Grok 4.1-fast integration for question generation

- Add minimaxChatViaGrok function
- Implement token tracking for cost monitoring
- Add timeout handling and error recovery

Closes #123
```

```
fix(calculator): correct theta estimation in EAP algorithm

The previous implementation used incorrect scaling factor.

Closes #456
```

### 5. Push and Create Pull Request

```bash
git push origin feature/description-of-feature
```

Then create a PR on GitHub with:
- Clear title and description
- Link to related issues (Closes #123)
- Screenshot/video if UI changes
- Test instructions

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] No new warnings/errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] No console errors/warnings
- [ ] Documentation updated
- [ ] Tests pass
```

## Contribution Areas

### 1. Features

Looking for help with:
- **AI Enhancement**: Improve Grok integration, add new LLM providers
- **Learning Algorithms**: Extend SM-2, implement new spaced repetition variants
- **Mobile App**: React Native implementation (see `.disabled-features/mobile`)
- **UI/UX**: Improve student experience, accessibility
- **Medical Content**: Expand disease/medication library

### 2. Bug Fixes

Found a bug? Create an issue with:
- Reproduction steps
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### 3. Documentation

Help improve docs:
- API documentation
- Architecture guides
- Setup instructions
- Troubleshooting guides

### 4. Tests

Increase test coverage:
- Unit tests for calculators
- Integration tests for APIs
- E2E tests for critical flows

### 5. Infrastructure

Help with:
- Docker configuration
- CI/CD workflows
- Performance optimization
- Security hardening

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTRIScore } from '@darwin-education/shared'

describe('TRI Calculator', () => {
  it('should calculate theta correctly', () => {
    const questions = [/* ... */]
    const result = calculateTRIScore(questions)
    expect(result.theta).toBeGreaterThan(-4)
    expect(result.theta).toBeLessThan(4)
  })
})
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tri.test.ts

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch
```

### Coverage Goals

- `packages/shared`: ≥80% coverage
- `apps/web/lib`: ≥70% coverage
- `apps/web/app`: ≥50% coverage (e2e tested)

## Coding Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Define interfaces for data structures
- Use discriminated unions for complex types

```typescript
// Good
interface GenerationRequest {
  source: 'darwin-mfc' | 'manual' | 'hybrid'
  sourceId?: string
  topicTitle: string
}

// Avoid
interface GenerationRequest {
  source: string
  sourceId?: any
  topicTitle: string
}
```

### React Components

```typescript
import { FC, ReactNode } from 'react'

interface QuestionCardProps {
  questionId: string
  onAnswer: (answer: string) => void
}

export const QuestionCard: FC<QuestionCardProps> = ({
  questionId,
  onAnswer,
}) => {
  // Component logic
  return <div>...</div>
}
```

### Error Handling

```typescript
// Good - specific error handling
try {
  const response = await generateQuestion(request)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ApiError) {
    // Handle API error
  } else {
    // Log unexpected error
    console.error('Unexpected error:', error)
  }
}

// Avoid - silent failures
try {
  const response = await generateQuestion(request)
} catch (error) {
  // Silently fail or only log
}
```

## Performance Considerations

- Profile code with Chrome DevTools
- Avoid unnecessary re-renders in React
- Use code splitting for large bundles
- Optimize database queries with indexes
- Cache API responses when appropriate

## Security Guidelines

- Never commit `.env.local` files
- Never hardcode API keys
- Validate all user input
- Use parameterized queries
- Implement CSRF protection
- Enable CORS properly
- Use HTTPS in production
- Keep dependencies updated

## Deployment

### Staging Deployment

```bash
# Create feature branch and push
git push origin feature/description

# Create PR and merge to develop
# (Auto-deploys to staging)
```

### Production Deployment

```bash
# Create release branch
git checkout -b release/v1.2.3

# Update version in package.json
# Update CHANGELOG.md
# Run final tests
pnpm test

# Merge to main
git checkout main
git merge --no-ff release/v1.2.3
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin main
git push origin --tags

# (Auto-deploys to Vercel)
```

## Documentation

When adding features, update:
- `docs/API.md` for API changes
- `docs/DEVELOPMENT.md` for setup changes
- `README.md` for user-facing features
- Inline code comments for complex logic

## Review Process

1. **Automated Checks**
   - TypeScript compilation
   - ESLint
   - Tests pass
   - Coverage maintained

2. **Code Review**
   - At least 1 approval required
   - Follow coding standards
   - No security issues
   - Performance impact assessed

3. **Merge**
   - Squash commits if needed
   - Delete feature branch

## Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: Check open/closed issues
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact maintainers
- **Slack**: Join our community channel

## Roadmap

Current priorities:
1. Scale theory generation to 100+ topics
2. Add comprehensive test coverage
3. Implement mobile app
4. Build admin dashboard
5. Optimize performance for large datasets

See [ROADMAP.md](./docs/ROADMAP.md) for detailed timeline.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Darwin Education!** 🎓
