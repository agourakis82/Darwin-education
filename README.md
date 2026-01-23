# Darwin Education

Medical exam preparation platform for ENAMED (Exame Nacional de Avaliação da Formação Médica) and other medical exams.

## Features

- **Exam Simulator** - Timed practice exams with TRI (Item Response Theory) scoring
- **Flashcards** - Spaced repetition (SM-2) for efficient memorization
- **Study Paths** - AI-recommended learning paths based on weak areas
- **Custom Exam Builder** - Create personalized exams by topic/difficulty
- **Progress Tracking** - Analytics dashboard with performance predictions

## Architecture

```
darwin-education/
├── apps/
│   ├── web/              # Next.js 15 web application
│   └── mobile/           # React Native + Expo (future)
├── packages/
│   └── shared/           # Shared code between apps
│       ├── types/        # TypeScript definitions
│       ├── calculators/  # TRI scoring, SM-2 algorithm
│       └── services/     # API clients, AI integration
└── infrastructure/
    └── supabase/         # Database schema, RLS policies
```

## Data Source

Medical data (diseases, medications, protocols) is imported from the Darwin-MFC ecosystem via the [@darwin-mfc/medical-data](https://www.npmjs.com/package/@darwin-mfc/medical-data) package.

```typescript
import { doencasConsolidadas, medicamentosConsolidados } from '@darwin-mfc/medical-data';
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/darwin-mfc/darwin-education.git
cd darwin-education

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Create `.env.local` in `apps/web/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Tech Stack

- **Web**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo (planned)
- **State**: Zustand with persistence
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: Claude API for question generation

## License

MIT

## Related Projects

- [Darwin-MFC](https://github.com/darwin-mfc/darwin-MFC) - Family Medicine reference platform
- [@darwin-mfc/medical-data](https://www.npmjs.com/package/@darwin-mfc/medical-data) - Medical data NPM package
