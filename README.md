# Darwin Education

> 🎓 AI-powered platform for ENAMED (Exame Nacional de Avaliação da Formação Médica) exam preparation with adaptive learning and automated medical content generation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18487442.svg)](https://doi.org/10.5281/zenodo.18487442)
[![Node Version](https://img.shields.io/badge/node-20+-brightgreen)]()
[![Vercel Deployment](https://img.shields.io/badge/deployment-vercel-success)](https://darwinhub.org)
[![Citation](https://img.shields.io/badge/cite-as-blue)](CITATION.cff)

**[Live Demo](https://darwinhub.org) • [Documentation](./docs) • [Contributing](./CONTRIBUTING.md) • [Roadmap](./docs/ROADMAP.md)**

---

## 🎯 Overview

Darwin Education is a comprehensive medical education platform combining **adaptive learning**, **AI-powered content generation**, and **learning analytics** for ENAMED exam preparation.

**Key Capabilities:**
- ✅ AI-powered exam simulation (TRI/IRT scoring)
- ✅ Question generation via Grok 4.1-fast
- ✅ Automated theory generation from 368 diseases
- ✅ Learning gap detection (DDL system)
- ✅ 70%+ auto-approval of generated content
- ✅ Production-ready infrastructure

---

## ✨ Features

### 🧪 Exam Simulation
- Full ENAMED practice exams with TRI scoring
- Real-time performance metrics
- Adaptive difficulty based on student ability

### 📚 Study Tools
- Flashcards with SM-2 spaced repetition
- 6 specialty learning paths
- 368 diseases + 690 medications library

### 🤖 AI Features
- Question generation ($0.06/question)
- Concept explanations
- Clinical case generation
- Medical text summarization

### 📈 Analytics
- Performance dashboard by area
- Learning gap detection
- Adaptive study recommendations

### 🏭 Theory Generation
- Multi-source research (Darwin-MFC, guidelines, PubMed)
- 5-stage validation pipeline
- Hallucination detection
- 70-80% auto-approval rate

---

## 🚀 Quick Start

### For Users
1. Visit https://darwinhub.org
2. Sign up with email
3. Start practicing `/simulado`

### For Developers

**Setup (5 minutes):**
```bash
git clone https://github.com/yourusername/darwin-education.git
cd darwin-education
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials
pnpm dev
```

**Commands:**
```bash
pnpm dev           # Dev server
pnpm build         # Production build
pnpm type-check    # TypeScript check
pnpm lint          # ESLint + fixes
pnpm test          # Run tests
```

---

## 🏗️ Architecture

```
darwin-education/
├── apps/web/                     # Next.js 15 frontend
│   ├── app/                      # Next.js App Router
│   ├── lib/ai                    # AI integration (Grok)
│   ├── lib/theory-gen            # Theory generation
│   └── lib/ddl                   # Learning gap detection
├── apps/ios-native/              # SwiftUI iOS native app
│   ├── DarwinEducation/          # App source code
│   └── project.yml               # XcodeGen project definition
│
├── packages/shared/              # Shared logic
│   ├── calculators/              # TRI & SM-2 algorithms
│   ├── services/ai               # AI services
│   ├── types/theory-generation   # Type definitions
│   └── __tests__/                # Unit tests
│
├── infrastructure/supabase/      # Database schema
│   ├── migrations/ (8 versions)  # Schema evolution
│   └── seed/                     # ETL scripts
│
└── docs/                         # Full documentation
```

**Tech Stack:**
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind
- **iOS App**: SwiftUI native
- **Backend**: Next.js API routes + Supabase PostgreSQL
- **AI**: Grok 4.1-fast (xAI)
- **Deployment**: Vercel + Supabase Cloud
- **CI/CD**: GitHub Actions

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Setup and dev workflow |
| [API.md](./docs/API.md) | API reference |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contributing guide |
| [ROADMAP.md](./docs/ROADMAP.md) | Feature roadmap |

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| Questions Generated | 100+ |
| Medical Conditions | 368 diseases |
| AI Generation Cost | $0.06-0.08 per item |
| Build Time | 36 seconds |
| Initial Load | <1s |
| Auto-Approval Rate | 70-80% |

---

## 🔧 Environment Setup

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx
GROK_API_KEY=xai-xxxxxx
```

See [.env.example](./apps/web/.env.example) for full config.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Setup instructions
- Code standards
- Pull request process
- Commit message format

**Quick PR:**
```bash
git checkout -b feature/your-feature
# Make changes
pnpm lint && pnpm test
git commit -m "feat: description"
git push origin feature/your-feature
```

---

## 📜 License

MIT License - See [LICENSE](./LICENSE)

**Citation:**
```bibtex
@software{darwin_education_2025,
  author = {Agourakis, Demetrios Chiuratto and Amalcaburio, Isadora Casagrande},
  title = {Darwin Education: AI-powered ENAMED Exam Preparation},
  year = {2025},
  url = {https://github.com/darwin-mfc/darwin-education},
  doi = {10.5281/zenodo.18487442},
  version = {1.0.0}
}
```

---

## 🗺️ Roadmap

- ✅ Core exam simulation (TRI-based)
- ✅ AI question generation (Grok)
- ✅ Theory generation system
- 📅 Mobile app (React Native)
- 📅 Collaborative learning
- 📅 AI tutor agent

See [ROADMAP.md](./docs/ROADMAP.md) for details.

---

## 📞 Support

- **Docs**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/darwin-education/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/darwin-education/discussions)

---

## 🙏 Acknowledgments

- [Darwin-MFC](https://github.com/agourakis82/darwin-mfc) - Medical content
- [@darwin-mfc/medical-data](https://www.npmjs.com/package/@darwin-mfc/medical-data) - Medical data package
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Deployment platform
- [xAI](https://x.ai/) - Grok API

---

Made with ❤️ for medical education
