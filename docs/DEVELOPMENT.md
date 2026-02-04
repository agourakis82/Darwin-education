# Development Guide

Complete guide for setting up and developing Darwin Education locally.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm 8+
npm install -g pnpm
pnpm --version  # 8.x.x or higher

# Git
git --version
```

### Optional Tools

```bash
# For database management
npm install -g supabase-cli

# For API testing
npm install -g insomnia  # or Postman

# For database inspection
npm install -g pgcli
```

---

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/darwin-education.git
cd darwin-education
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This installs:
# - apps/web dependencies
# - packages/shared dependencies
# - packages/ml-training (Python)
# - All peer dependencies
```

### 3. Setup Environment Variables

```bash
# Copy template
cp apps/web/.env.example apps/web/.env.local

# Edit with your values
# Required:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - GROK_API_KEY
```

**Get credentials from:**
- **Supabase**: https://app.supabase.com > Project Settings > API Keys
- **Grok API**: https://console.x.ai > Create API key

### 4. Start Development Server

```bash
# Terminal 1: Start Next.js dev server (with Turbopack)
pnpm dev

# Terminal 2 (optional): Start ML training (Python)
cd packages/ml-training
python -m jupyter notebook
```

**Access at**: http://localhost:3000

---

## Architecture Overview

### Project Structure

```
darwin-education/
├── apps/web/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                  # Auth pages (login, signup)
│   │   ├── (dashboard)/             # Main app pages
│   │   │   ├── simulado/            # Exam simulator
│   │   │   ├── flashcards/          # Flashcard study
│   │   │   ├── trilhas/             # Learning paths
│   │   │   ├── gerar-questao/       # Question generation
│   │   │   ├── desempenho/          # Performance dashboard
│   │   │   └── conteudo/            # Medical content
│   │   ├── api/                     # Next.js API routes
│   │   │   ├── ai/                  # AI endpoints
│   │   │   ├── theory-gen/          # Theory generation
│   │   │   └── ddl/                 # Learning gap detection
│   │   ├── admin/                   # Admin routes
│   │   │   └── theory-gen/          # Theory management
│   │   └── layout.tsx               # Root layout
│   │
│   ├── lib/
│   │   ├── ai/                      # AI integration
│   │   │   ├── minimax.ts           # Grok wrapper
│   │   │   ├── cache.ts             # Response caching
│   │   │   └── credits.ts           # Credit management
│   │   │
│   │   ├── theory-gen/              # Theory generation
│   │   │   ├── services/            # Generation services
│   │   │   ├── prompts/             # Prompt builders
│   │   │   └── utils/               # Utilities
│   │   │
│   │   ├── ddl/                     # Learning gap system
│   │   │   └── services/            # DDL services
│   │   │
│   │   ├── supabase/                # Database client
│   │   ├── adapters/                # Data transformers
│   │   └── utils/                   # Helpers
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # Reusable UI
│   │   ├── features/                # Feature components
│   │   └── layout/                  # Layout components
│   │
│   ├── .env.example                 # Env template
│   ├── package.json                 # Dependencies
│   └── tsconfig.json                # TS config
│
├── packages/shared/
│   ├── src/
│   │   ├── calculators/             # Algorithms
│   │   │   ├── tri.ts               # TRI/IRT scoring
│   │   │   ├── sm2.ts               # SM-2 repetition
│   │   │   └── cat.ts               # Computerized adaptive testing
│   │   │
│   │   ├── types/                   # Type definitions
│   │   │   ├── education.ts         # Core types
│   │   │   ├── theory-generation.ts # Theory types
│   │   │   └── qgen.ts              # Question gen types
│   │   │
│   │   ├── services/                # Business logic
│   │   │   └── ai.ts                # AI services
│   │   │
│   │   └── __tests__/               # Unit tests
│   │       ├── tri.test.ts
│   │       ├── sm2.test.ts
│   │       └── cat.test.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── packages/ml-training/
│   ├── notebooks/                   # Jupyter notebooks
│   ├── src/                         # Python source
│   └── requirements.txt             # Dependencies
│
├── infrastructure/supabase/
│   ├── migrations/                  # SQL migrations
│   │   ├── 001_cip_schema.sql
│   │   ├── 002_add_irt_metadata.sql
│   │   └── ...008_ddl_system.sql
│   │
│   └── seed/                        # ETL & seeding
│       └── harvest_questions.ts
│
└── .github/
    └── workflows/                   # CI/CD pipelines
        ├── test.yml
        ├── lint.yml
        └── deploy.yml
```

### Technology Stack Details

**Frontend Framework:**
- Next.js 15.1 with App Router
- React 19 for components
- TypeScript 5 for type safety
- Tailwind CSS for styling
- Zustand for state management

**Backend:**
- Next.js API Routes (serverless)
- Supabase PostgreSQL (managed)
- Supabase Auth (JWT tokens)
- Supabase Real-time subscriptions

**AI & External APIs:**
- Grok 4.1-fast via xAI API
- WebSearch for research
- WebFetch for content scraping

**Database:**
- PostgreSQL 14+ (Supabase)
- Row-Level Security (RLS) for access control
- Triggers for audit trails
- Indexes for performance

**Deployment:**
- Vercel for frontend hosting
- Supabase Cloud for database
- GitHub Actions for CI/CD

---

## Development Workflow

### Daily Development

```bash
# Start dev server (watch mode)
pnpm dev

# In another terminal, type-check and lint
pnpm type-check
pnpm lint

# Run tests while developing
pnpm test --watch
```

### Feature Development

**1. Create feature branch**
```bash
git checkout -b feature/my-feature
```

**2. Make changes**
```bash
# Edit files
# Follow code standards from CONTRIBUTING.md
```

**3. Test locally**
```bash
# Type-check
pnpm type-check

# Lint and format
pnpm lint
pnpm format

# Run tests
pnpm test

# Test the app
pnpm dev
# Test manually at http://localhost:3000
```

**4. Commit changes**
```bash
# Pre-commit hooks run automatically:
# - Type-check
# - Lint
# - Tests
# - Secret scanning

git add .
git commit -m "feat: description of feature"
# Hooks verify before committing
```

**5. Push and create PR**
```bash
git push origin feature/my-feature
# Create PR on GitHub
```

### Common Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm dev --turbopack     # With Turbopack (faster)

# Building
pnpm build               # Production build
pnpm preview             # Preview production build

# Code Quality
pnpm type-check          # Check TypeScript
pnpm lint                # ESLint check
pnpm lint --fix          # ESLint with fixes
pnpm format              # Prettier format
pnpm format --check      # Check format only

# Testing
pnpm test                # Run all tests
pnpm test --watch        # Watch mode
pnpm test --coverage     # With coverage report
pnpm test --ui           # Visual UI mode

# Cleanup
pnpm clean               # Remove build artifacts
pnpm clean:all           # Remove node_modules too
```

---

## Testing

### Test Structure

```typescript
// File: packages/shared/src/__tests__/tri.test.ts
import { describe, it, expect } from 'vitest'
import { estimateThetaEAP } from '../calculators/tri'

describe('TRI Calculator', () => {
  it('should estimate theta correctly', () => {
    const responses = [true, true, false]
    const parameters = [...]

    const theta = estimateThetaEAP(responses, parameters)

    expect(theta).toBeGreaterThan(-4)
    expect(theta).toBeLessThan(4)
  })
})
```

### Run Tests

```bash
# All tests
pnpm test

# Watch mode (re-run on changes)
pnpm test --watch

# Specific file
pnpm test tri.test.ts

# With coverage
pnpm test --coverage

# UI mode
pnpm test --ui
```

### Coverage Goals

- `packages/shared`: ≥80% (core logic)
- `apps/web/lib`: ≥70% (services)
- `apps/web/app`: ≥50% (pages, mostly e2e)

---

## Debugging

### Server-Side Debugging

```typescript
// Add console logs
console.log('Debug info:', data)

// View in terminal where you ran `pnpm dev`
```

### Client-Side Debugging

```typescript
// Open browser DevTools (F12)
// Use Console tab for logs
// Use Debugger tab for breakpoints

// Add debugger statement
debugger
```

### Database Debugging

```bash
# View Supabase dashboard
# https://app.supabase.com > Project > SQL Editor

# Run query in SQL Editor:
SELECT * FROM questions LIMIT 10;
SELECT * FROM exam_attempts WHERE user_id = 'xxx';
```

### API Debugging

```bash
# Test API endpoint
curl http://localhost:3000/api/ai/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Use Insomnia or Postman for complex requests
```

---

## Performance Optimization

### Profile Build

```bash
# Analyze bundle
pnpm build --analyze

# Check file sizes
pnpm build
ls -la .next/static/chunks/
```

### Monitor Performance

```bash
# Lighthouse audit
# In Chrome DevTools > Lighthouse tab

# Web Vitals
# Check logs from Next.js dev server
```

### Optimize Images

```typescript
// Good: Use Next.js Image component
import Image from 'next/image'

export function MyImage() {
  return (
    <Image
      src="/image.png"
      alt="Description"
      width={800}
      height={600}
      priority  // For above-fold images
    />
  )
}

// Avoid: HTML img tag
<img src="/image.png" />
```

---

## Troubleshooting

### "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### "Cannot find module '@darwin-education/shared'"

```bash
# Rebuild monorepo
pnpm build

# Or clear and reinstall
pnpm clean
pnpm install
```

### "Supabase connection error"

```bash
# Check .env.local values
cat apps/web/.env.local

# Verify Supabase project is active
# https://app.supabase.com

# Test connection
pnpm test -- supabase.test.ts
```

### "TypeScript errors persist after fix"

```bash
# Clear cache and rebuild
pnpm clean
pnpm build
pnpm type-check
```

### "API key not working"

```bash
# Verify in Supabase dashboard
# Settings > API Keys > Check ANON KEY

# Verify Grok API key
# https://console.x.ai > Check active key

# Test API
curl https://api.x.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROK_KEY"
```

---

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for code standards
- Read [API.md](./API.md) for endpoint reference
- Check [ROADMAP.md](./ROADMAP.md) for features to work on

---

**Happy coding! 🚀**
