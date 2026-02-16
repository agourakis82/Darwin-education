# Darwin Education

> 🎓 AI-powered platform for ENAMED (Exame Nacional de Avaliação da Formação Médica) exam preparation with adaptive learning and automated medical content generation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18592149.svg)](https://doi.org/10.5281/zenodo.18592149)
[![Node Version](https://img.shields.io/badge/node-20+-brightgreen)]()
[![Vercel Deployment](https://img.shields.io/badge/deployment-vercel-success)](https://darwinhub.org)
[![Citation](https://img.shields.io/badge/cite-as-blue)](CITATION.cff)

**[Live Demo](https://darwinhub.org) • [Documentation](./docs) • [Contributing](./CONTRIBUTING.md) • [Roadmap](./docs/ROADMAP.md)**

Zenodo DOI (concept): https://doi.org/10.5281/zenodo.18487441
Zenodo DOI (versioned, preprint-v0.3.1): https://doi.org/10.5281/zenodo.18592149

---

## 🎯 Overview

Darwin Education is a medical education platform for ENAMED preparation that integrates **adaptive learning**, **psychometric calibration**, and **safety-instrumented AI content generation**.

**What makes it different (architecture-first):**
- ✅ ENAMED-calibrated ETL and database schema (Supabase migrations + seed tooling)
- ✅ Multidimensional psychometrics (MIRT 5D) + equity instrumentation (DIF/ETS)
- ✅ Spaced repetition scheduling (SM-2 + FSRS with state migration)
- ✅ Learning gap detection (DDL) that closes the loop from diagnosis to targeted generation
- ✅ LLM-assisted question generation (Grok integration) gated by a multi-stage validation pipeline
- ✅ Safety governance: explicit thresholds, medical danger-pattern checks, and human review escalation

> For the preprint and the reproducible evidence pack (including integrity gate, manifests, and logs), see `_paperpack/preprint/`.

---

## ✨ Features

### 🧪 Exam Simulation
- Full ENAMED practice exams with TRI scoring
- Real-time performance metrics
- Adaptive difficulty based on student ability

### 📚 Study Tools
- Flashcards with SM-2 spaced repetition
- Specialty-aligned learning pathways

## 📚 Medical Knowledge Base (Darwin-MFC)

Darwin Education integrates the Darwin-MFC knowledge base as a git submodule.

**Runtime-enumerated corpus (preprint-v0.3.1, exported indices):**
- Diseases: **252 raw entries / 215 unique IDs**
- Medications: **889 raw entries / 602 unique IDs**

Duplicate IDs arise from multi-source aggregation across category lists and consolidated exports. Historical documentation targets should be treated as prior snapshots or targets, not current ground truth.

See `_paperpack/derived/darwin_mfc_runtime_counts.json` and the release manifest for hash-stamped provenance.

### 🤖 AI Features
- LLM-assisted question generation (Grok integration)
- Concept explanations
- Clinical case generation
- Medical text summarization

### 📈 Analytics
- Performance dashboard by area
- Learning gap detection
- Adaptive study recommendations

### 🏭 Theory Generation
- Multi-source research (Darwin-MFC, guidelines, PubMed)
- Multi-stage validation pipeline
- Hallucination detection and escalation checks

## 🛡️ Safety Instrumentation (LLM Content)

LLM-generated items are gated by a weighted validation pipeline with explicit decision thresholds:
- auto-approval >= **0.85**
- pending human review >= **0.70**
- mandatory revision >= **0.50**

Medical danger-pattern checks and a human review workflow provide escalation and override. Quantitative approval rates and failure-mode prevalence depend on runtime logs or labeled review datasets and are not asserted in this README by default.

## 📊 Reproducibility (Release-Grade)

This repository ships a reproducible evidence pack with:
- hash-stamped release manifests,
- integrity gate for manuscript claims,
- reproducible scripts and logs,
- green test status on the pinned release commit.

See `_paperpack/scripts/release_v0.3.1.sh` and `_paperpack/derived/*manifest.json`.

---

## 🚀 Quick Start

### For Users
1. Visit https://darwinhub.org
2. Sign up with email
3. Start practicing `/simulado`

### For Developers

**Setup (5 minutes):**
```bash
git clone https://github.com/agourakis82/Darwin-education.git
cd darwin-education
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials
pnpm dev
```

**Supabase (hosted) — apply migrations + seed Darwin‑MFC (beta):**
```bash
./apps/web/node_modules/.bin/supabase login
./apps/web/node_modules/.bin/supabase link --workdir infrastructure/supabase --project-ref <your_project_ref>
./apps/web/node_modules/.bin/supabase db push --workdir infrastructure/supabase --linked --yes
set -a && source apps/web/.env.local && set +a
pnpm seed:medical-content
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

Runtime-sensitive metrics (for example model cost per item, approval-rate distribution, and latency percentiles) are reported via reproducible runs and release logs instead of static README targets.

---

## 🔧 Environment Setup

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx

# AI (optional) — required only for IA/QGen/DDL/theory-gen routes
# Recommended:
XAI_API_KEY=xai-xxxxxx
# Alias supported:
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
@software{darwin_education_2026,
  author = {Agourakis, Demetrios Chiuratto and Amalcaburio, Isadora Casagrande},
  title = {Darwin Education: AI-powered ENAMED Exam Preparation},
  year = {2026},
  url = {https://github.com/agourakis82/Darwin-education},
  doi = {10.5281/zenodo.18592149},
  version = {1.0.0}
}
```

---

## 🗺️ Roadmap

- ✅ Core exam simulation + psychometric stack
- ✅ AI generation + validation pipeline
- ✅ Evidence pack + integrity gate + release manifest
- 🔧 iOS native app (SwiftUI) - ongoing
- 📅 Additional collaboration and tutoring features - planned

See [ROADMAP.md](./docs/ROADMAP.md) for details.

---

## 📞 Support

- **Docs**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/agourakis82/Darwin-education/issues)
- **Discussions**: [GitHub Discussions](https://github.com/agourakis82/Darwin-education/discussions)

---

## 🙏 Acknowledgments

- [Darwin-MFC](https://github.com/agourakis82/darwin-mfc) - Medical content
- [@darwin-mfc/medical-data](https://www.npmjs.com/package/@darwin-mfc/medical-data) - Medical data package
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Deployment platform
- [xAI](https://x.ai/) - Grok API

---

Made with ❤️ for medical education
