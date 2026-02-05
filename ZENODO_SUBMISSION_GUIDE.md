# Zenodo Submission Guide - Darwin Education v1.0.0

**Status**: Ready to submit
**Date**: February 4, 2025
**Version**: 1.0.0

---

## 📋 Pre-Submission Checklist

### Before Starting

- [x] GitHub repository clean (v1.0.0 tagged)
- [x] All documentation complete
- [x] Source code archive prepared
- [x] License clearly stated (MIT)
- [x] Citation metadata ready (CITATION.cff)
- [x] ZENODO_RELEASE.md completed
- [x] No API keys or secrets in code

---

## 🚀 Step-by-Step Submission

### Step 1: Create Zenodo Account

1. Visit https://zenodo.org
2. Click "Sign Up" or use institutional login
3. Verify email address
4. Complete profile

**For Brazilian Institutions:**
- Use institutional login if available
- Or create community: "Brazilian Medical Education"

### Step 2: Prepare Source Code Archive

**Create minimal archive (excluding large files):**

```bash
# Navigate to repo root
cd /home/demetrios/Darwin-education

# Create source archive (no node_modules, build artifacts)
tar --exclude=node_modules \
    --exclude=.next \
    --exclude=.turbo \
    --exclude=dist \
    --exclude=coverage \
    --exclude=.git \
    --exclude=microdados_* \
    --exclude=questoes-* \
    --exclude=provas/ \
    -czf darwin-education-v1.0.0-source.tar.gz .

# Verify file size
ls -lh darwin-education-v1.0.0-source.tar.gz

# Should be ~50-100 MB (acceptable for Zenodo's 50 GB limit)
```

**Alternative: Create ZIP archive**

```bash
zip -r -q darwin-education-v1.0.0-source.zip . \
    -x "node_modules/*" ".next/*" ".turbo/*" "dist/*" \
    "coverage/*" ".git/*" "microdados_*/*" "questoes-*/*" \
    "provas/*"
```

### Step 3: Zenodo New Upload

1. Go to https://zenodo.org/upload
2. Click "New Upload"
3. Select access: **"Open Access"**
4. Upload file(s):
   - darwin-education-v1.0.0-source.tar.gz
   - (Optional) Additional documentation

### Step 4: Fill in Metadata

**Basic Information:**

| Field | Value |
|-------|-------|
| **Title** | Darwin Education: AI-Powered ENAMED Exam Preparation Platform |
| **Creators** | Agourakis; Darwin Education Contributors |
| **Publication Date** | 2025-02-04 |
| **Description** | (See below) |

**Description (copy from ZENODO_RELEASE.md):**

```
Darwin Education is a comprehensive, open-source medical education
platform for Brazilian medical students preparing for ENAMED
(Exame Nacional de Avaliação da Formação Médica) licensing exam.

Key Features:
- Adaptive exam simulation with TRI/IRT scoring
- AI-powered question generation (Grok 4.1-fast)
- Automated medical theory content generation (100+ topics)
- Learning gap detection system
- Student progress tracking and analytics
- Medical library (368 diseases, 690 medications)

Technology Stack:
- Next.js 15 + React 19 + TypeScript
- Supabase PostgreSQL with Row-Level Security
- 70%+ test coverage
- Production-ready infrastructure

This is v1.0.0 - the initial production release.
For source code, documentation, and live platform, see:
- GitHub: https://github.com/agourakis82/darwin-education
- Live: https://darwin-education.vercel.app
```

**Additional Details:**

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Language** | English (code) |
| **License** | MIT License |
| **Related Identifiers** | GitHub URL: https://github.com/agourakis82/darwin-education |

### Step 5: Keywords

Add these keywords:

```
Medical Education, ENAMED, Exam Preparation, Adaptive Learning,
Item Response Theory, IRT, Question Generation, AI, Artificial Intelligence,
Spaced Repetition, Learning Analytics, Educational Technology,
Open Source, Brazilian Medical Education, TRI, Flashcards
```

### Step 6: Creators & Contributors

**Creator (Author):**
- Name: Agourakis
- Affiliation: Darwin Education Project
- ORCID: (Optional, if available)

**Contributors:**
- Type: Contributor
- Name: Darwin Education Contributors

**Acknowledgments (in Description):**
- Grok API (xAI)
- Darwin-MFC Project
- Supabase
- Vercel

### Step 7: Resource Type

Select:
- **Resource Type**: Software
- **Software Type**: Source Code Repository
- **Development Status**: Actively developed

### Step 8: Access & Licensing

| Setting | Value |
|---------|-------|
| **Access** | Open Access |
| **License** | MIT License |
| **License Text** | (Include from LICENSE file) |

### Step 9: Related Work

**References (scholarly works):**

```
1. Rasch, G. (1960). Probabilistic models for some intelligence
   and attainment tests. Danish Institute for Educational Research.

2. Birnbaum, A. (1968). Some latent trait models and their use
   in inferring an examinee's ability. In F. M. Lord & M. R. Novick,
   Statistical theories of mental test scores. Addison-Wesley.

3. Baker, F. B., & Kim, S. H. (2004). Item response theory:
   Parameter estimation techniques. Marcel Dekker.

4. van der Linden, W. J., & Hambleton, R. K. (Eds.). (1997).
   Handbook of modern item response theory. Springer.
```

**Related Projects:**
```
- Darwin-MFC: https://github.com/agourakis82/darwin-mfc
- @darwin-mfc/medical-data: https://www.npmjs.com/package/@darwin-mfc/medical-data
```

### Step 10: Publication Info

- **Publication Date**: 2025-02-04
- **Journal**: (Leave blank - Software)
- **GitHub URL**: https://github.com/agourakis82/darwin-education
- **Website**: https://darwin-education.vercel.app

---

## 📝 Complete Description Template

```markdown
# Darwin Education v1.0.0 - Production Release

## Overview
Darwin Education is a comprehensive, open-source medical education
platform designed specifically for Brazilian medical students preparing
for the ENAMED (Exame Nacional de Avaliação da Formação Médica)
licensing examination.

## Features

### Core Learning Platform
- **Exam Simulator**: Full ENAMED practice exams with TRI/IRT adaptive scoring
- **Flashcards**: SM-2 spaced repetition algorithm for efficient learning
- **Learning Paths**: 6 specialty-based structured study sequences
- **Medical Library**: 368 diseases, 690 medications, clinical protocols
- **Analytics Dashboard**: Real-time performance tracking and insights

### AI-Powered Features
- **Question Generation**: Grok 4.1-fast powered ($0.06 per question)
- **Explanations**: AI-generated concept explanations
- **Case Studies**: Clinical scenario generation
- **Text Summarization**: Medical content condensing
- **Credit System**: Daily limits with usage tracking

### Theory Generation System
- **Multi-source Research**: Darwin-MFC, Brazilian guidelines, PubMed, UpToDate
- **5-Stage Validation**: Structural, medical, citations, readability, completeness
- **Hallucination Detection**: AI claim verification against sources
- **Admin Dashboard**: Content management and review workflow
- **Auto-approval**: 70-80% auto-approval for high-quality content
- **Cost-effective**: ~$0.08 per topic with caching

### Learning Gap Detection (DDL)
- **AI Analysis**: Automatic identification of weak areas
- **Targeted Learning**: Focused questions for gaps
- **Progress Tracking**: Adaptive recommendations

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI**: Grok 4.1-fast API (xAI)
- **Database**: Supabase with Row-Level Security
- **Deployment**: Vercel (frontend), Supabase Cloud (database)
- **Infrastructure**: GitHub Actions CI/CD, Vercel serverless

## Specifications

**Performance Metrics:**
- Build time: 36 seconds
- Initial load: <1s
- AI generation: 5-10s per question
- Database queries: <100ms (99th percentile)

**Quality Metrics:**
- TypeScript coverage: 100%
- Test coverage: 70%+
- Build status: ✅ Passing
- Deployment: ✅ Live on Vercel

**Capacity:**
- Concurrent users: Unlimited (serverless)
- Scalability: Automatic with AWS infrastructure
- Database: PostgreSQL 14+ (Supabase managed)

**Cost Analysis:**
- Question generation: $0.06 each
- Theory generation: $0.08 per topic
- 100 topics: ~$8 USD total
- Baseline hosting: ~$25-50/month

## Repository Contents

- 15,000+ lines of production code
- 5,000+ lines of documentation
- 18 database tables (10 content, 8 audit)
- 3 GitHub Actions CI/CD workflows
- 100+ questions with IRT parameters
- 8 database migrations
- Comprehensive test suite (70%+ coverage)

## Documentation

- README.md: Overview and quick start
- CONTRIBUTING.md: Development guidelines
- CHANGELOG.md: Version history and features
- docs/DEVELOPMENT.md: Setup and workflow
- docs/ARCHITECTURE.md: Technical design
- LICENSE: MIT License
- CITATION.cff: Citation metadata

## Getting Started

```bash
# Clone repository
git clone https://github.com/agourakis82/darwin-education.git
cd darwin-education

# Install and run
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with credentials
pnpm dev
```

## Live Platform

- **URL**: https://darwin-education.vercel.app
- **Signup**: Free for all users
- **Access**: Open to all medical students

## License

MIT License - Open source and freely available

## Citation

```bibtex
@software{darwin_education_2025,
  author = {Agourakis and Darwin Education Contributors},
  title = {Darwin Education: AI-Powered ENAMED Exam Preparation Platform},
  year = {2025},
  url = {https://github.com/agourakis82/darwin-education},
  doi = {https://doi.org/xxxxx}
}
```

## Funding

This project is not funded by any grant or institution.
Development is volunteer-driven, supported by project revenue.

## Acknowledgments

- Grok API (xAI) for LLM services
- Darwin-MFC for medical content integration
- Supabase for database infrastructure
- Vercel for deployment platform
- GitHub for version control and CI/CD

## Related Projects

- Darwin-MFC: Family medicine reference platform
- @darwin-mfc/medical-data: Medical data NPM package
```

---

## ✅ Submission Preview

Before submitting, verify:

1. **All fields completed** ✓
2. **Keywords added** ✓
3. **Description clear** ✓
4. **License selected (MIT)** ✓
5. **Access level: Open** ✓
6. **File uploaded** ✓
7. **Creators listed** ✓
8. **Related URLs provided** ✓

### Preview URL
- Will be: `https://zenodo.org/records/[RECORD_ID]`
- DOI will be: `https://doi.org/10.5281/zenodo.[RECORD_ID]`

---

## 📤 Publishing

1. Review all information
2. Click "Publish"
3. **Wait for verification** (usually <1 hour)
4. **Receive DOI** and permanent record URL

---

## ✅ After Publication

### 1. Update Repository

**In GitHub:**
```bash
# Update README with Zenodo DOI
# Update CITATION.cff with DOI
# Create GitHub Release with Zenodo link
```

**Example README update:**
```markdown
[![Zenodo](https://img.shields.io/badge/zenodo-v1.0.0-blue)](https://zenodo.org/records/xxxxx)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.xxxxx.svg)](https://doi.org/10.5281/zenodo.xxxxx)
```

**Update CITATION.cff:**
```yaml
identifiers:
  - description: Zenodo software release
    type: doi
    value: "10.5281/zenodo.xxxxx"
```

### 2. Register DOI

**Optional: Register with CrossRef**
- More discoverable in research citations
- Integrates with academic databases
- Required for impact tracking

### 3. Announce Release

- **GitHub**: Create formal release
- **Social Media**: Announce availability
- **Institution**: Notify partners
- **Community**: Share with medical education community

### 4. Update Documentation

- Update all links to include DOI
- Add Zenodo badge to README
- Update CITATION.cff
- Update academic profiles

---

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| https://zenodo.org | Zenodo homepage |
| https://zenodo.org/upload | New upload page |
| https://github.com/agourakis82/darwin-education | GitHub repo |
| https://darwin-education.vercel.app | Live platform |
| https://github.com/agourakis82/darwin-mfc | Related Darwin-MFC |

---

## ❓ FAQ

**Q: Can I update the release after publishing?**
A: Yes, Zenodo allows updates. New versions get new record IDs but same version history.

**Q: How long is Zenodo archival?**
A: Permanent - CERN maintains all records indefinitely.

**Q: Will it get a DOI?**
A: Yes, automatic upon publication. Example: 10.5281/zenodo.xxxxx

**Q: Can I delete it?**
A: No, published records are permanent. You can mark as "restricted" if needed.

**Q: How is it licensed?**
A: MIT License - open source, commercial use allowed.

**Q: Can researchers cite it?**
A: Yes, full citation formats provided in Zenodo record.

---

## 📞 Support

- **Zenodo Help**: https://zenodo.org/help
- **Zenodo Support**: support@zenodo.org
- **GitHub Issues**: https://github.com/agourakis82/darwin-education/issues

---

## ✨ Next Release (v1.1)

After v1.0.0 is published:
- Plan new features
- Gather community feedback
- Release on same Zenodo project
- Update DOI references

---

**Status**: Ready for submission
**Estimated Time**: 30-45 minutes to complete
**Questions**: Refer to ZENODO_RELEASE.md

Good luck! 🚀
