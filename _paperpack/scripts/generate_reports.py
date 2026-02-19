#!/usr/bin/env python3
"""Generate markdown reports and preprint skeleton for _paperpack."""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return default


def load_lines(path: Path) -> List[str]:
    if not path.exists():
        return []
    return path.read_text(encoding="utf-8", errors="replace").splitlines()


def safe_read(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def find_line(path: Path, pattern: str, regex: bool = False) -> Optional[int]:
    if not path.exists():
        return None
    text = load_lines(path)
    if regex:
        rx = re.compile(pattern, re.IGNORECASE)
        for i, line in enumerate(text, start=1):
            if rx.search(line):
                return i
    else:
        p = pattern.lower()
        for i, line in enumerate(text, start=1):
            if p in line.lower():
                return i
    return None


def cite(repo_root: Path, rel_path: str, pattern: Optional[str] = None, regex: bool = False, fallback_line: int = 1) -> str:
    path = repo_root / rel_path
    if not path.exists():
        return "`NOT FOUND`"

    if pattern is None:
        line = fallback_line
    else:
        found = find_line(path, pattern, regex=regex)
        line = found if found is not None else fallback_line

    return f"`{rel_path}:{line}-{line}`"


def bytes_human(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    units = ["KB", "MB", "GB"]
    v = float(n)
    for u in units:
        v /= 1024.0
        if v < 1024:
            return f"{v:.2f} {u}"
    return f"{v:.2f} TB"


def first_line(path: Path) -> str:
    if not path.exists():
        return "NOT RUN"
    lines = load_lines(path)
    if not lines:
        return "NOT RUN"
    return lines[0].strip() or "NOT RUN"


def parse_language_summary(path: Path) -> List[Tuple[str, int]]:
    rows: List[Tuple[str, int]] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            try:
                rows.append((row["language"], int(row["file_count"])))
            except Exception:
                continue
    return rows


def get_top_files(keyword_hits: Dict[str, object], limit: int = 10) -> List[str]:
    top = keyword_hits.get("top_files", [])
    selected: List[str] = []
    for item in top:
        if isinstance(item, list) and item:
            f = item[0]
        elif isinstance(item, tuple) and item:
            f = item[0]
        else:
            continue
        if f.startswith("_paperpack/"):
            continue
        if f not in selected:
            selected.append(str(f))
        if len(selected) >= limit:
            break
    return selected


def write_repo_inventory(
    repo_root: Path,
    pack_dir: Path,
    repo_facts: Dict[str, object],
    language_rows: List[Tuple[str, int]],
    tree_lines: List[str],
    key_files_lines: List[str],
) -> None:
    out = pack_dir / "repo_inventory.md"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    modules = [
        ("Monorepo workspace and orchestration", "package.json", '"name": "darwin-education"'),
        ("pnpm workspace boundaries", "pnpm-workspace.yaml", "packages:"),
        ("Web application (Next.js)", "apps/web/package.json", '"name": "@darwin-education/web"'),
        ("Shared algorithms/psychometrics", "packages/shared/package.json", '"name": "@darwin-education/shared"'),
        ("ML training package", "packages/ml-training/pyproject.toml", "[project]"),
        ("Supabase schema/migrations/ETL", "infrastructure/supabase/migrations/008_ddl_full_system.sql", "DDL SYSTEM - FULL MIGRATION"),
        ("ENAMED microdata payload", "microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt", None),
        ("Darwin-MFC submodule", "darwin-MFC/README.md", "# Darwin-MFC"),
    ]

    lines: List[str] = []
    lines.append("# Repository Inventory")
    lines.append("")
    lines.append(f"Generated at {timestamp}.")
    lines.append("")
    lines.append("## High-Level Description")
    lines.append("")
    lines.append("### Main Modules and Services")
    for desc, path, pat in modules:
        lines.append(f"- {desc} ({cite(repo_root, path, pat)})")
    lines.append("")

    lines.append("### Languages (detected by extension scan)")
    if language_rows:
        lines.append("| Language | File count |")
        lines.append("|---|---:|")
        for lang, cnt in sorted(language_rows, key=lambda x: x[1], reverse=True):
            lines.append(f"| {lang} | {cnt} |")
    else:
        lines.append("NOT FOUND")
    lines.append("")

    lines.append("### Deployment Approach (observed)")
    lines.append(f"- Docker Compose orchestration present ({cite(repo_root, 'docker-compose.yml', 'services:')})")
    lines.append(f"- Web image Dockerfile present ({cite(repo_root, 'apps/web/Dockerfile', None)})")
    lines.append(f"- Vercel config present ({cite(repo_root, 'vercel.json', None)})")
    lines.append(f"- Deployment shell entrypoint present ({cite(repo_root, 'deploy.sh', None)})")
    lines.append(f"- CI/CD workflows present ({cite(repo_root, '.github/workflows/test.yml', None)}, {cite(repo_root, '.github/workflows/deploy.yml', None)})")
    lines.append("")

    lines.append("## Tree Snapshot (Top 3 levels)")
    lines.append("")
    lines.append("Excluded folders: `node_modules`, `.git`, `target`, `dist`, `__pycache__`, `.next`, `.cache`.  ")
    lines.append(f"Snapshot source: {cite(repo_root, '_paperpack/repo_tree_snapshot.txt', None)}")
    lines.append("")
    lines.append("```text")
    if tree_lines:
        max_lines = 500
        for line in tree_lines[:max_lines]:
            lines.append(line)
        if len(tree_lines) > max_lines:
            lines.append(f"... TRUNCATED ({len(tree_lines) - max_lines} more lines)")
    else:
        lines.append("NOT FOUND")
    lines.append("```")
    lines.append("")

    lines.append("## Key Files")
    lines.append("")
    lines.append(f"Source list: {cite(repo_root, '_paperpack/key_files.txt', None)}")
    lines.append("")
    lines.append("```text")
    if key_files_lines:
        for line in key_files_lines[:400]:
            lines.append(line)
        if len(key_files_lines) > 400:
            lines.append(f"... TRUNCATED ({len(key_files_lines) - 400} more lines)")
    else:
        lines.append("NOT FOUND")
    lines.append("```")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_architecture_map(repo_root: Path, pack_dir: Path) -> None:
    out = pack_dir / "architecture_map.md"

    components = [
        {
            "name": "Psychometrics: MIRT 5D",
            "where": [
                cite(repo_root, "packages/shared/src/calculators/mirt.ts", "Multidimensional IRT (MIRT) Calculator"),
                cite(repo_root, "packages/shared/src/calculators/mirt.ts", "Estimate 5D theta via MAP"),
                cite(repo_root, "packages/shared/src/calculators/unified-learner-model.ts", "0.30*MIRT"),
            ],
            "symbols": "mirtProbability, estimateMIRT_MAP, unified signal weighting",
            "inputs": "item parameters + response correctness",
            "outputs": "theta profile per dimension + composite ability",
            "flow": "feeds adaptive learner model and item targeting",
        },
        {
            "name": "Fairness layer: DIF",
            "where": [
                cite(repo_root, "packages/shared/src/calculators/dif.ts", "Differential Item Functioning (DIF) Calculator"),
                cite(repo_root, "packages/shared/src/calculators/dif.ts", "classifyDIF"),
                cite(repo_root, "packages/shared/src/calculators/dif.ts", "analyzeDIF"),
            ],
            "symbols": "classifyDIF, analyzeDIF",
            "inputs": "item response groups (focal/reference)",
            "outputs": "ETS A/B/C DIF classification",
            "flow": "flags bias signals for psychometric governance",
        },
        {
            "name": "Scheduling: SM-2 and FSRS",
            "where": [
                cite(repo_root, "packages/shared/src/calculators/sm2.ts", "SM-2 Spaced Repetition Algorithm"),
                cite(repo_root, "packages/shared/src/calculators/sm2.ts", "calculateNextInterval"),
                cite(repo_root, "packages/shared/src/calculators/fsrs.ts", "FSRS-6"),
                cite(repo_root, "packages/shared/src/calculators/fsrs.ts", "migrateSM2toFSRS"),
            ],
            "symbols": "calculateNextInterval, reviewCard, migrateSM2toFSRS",
            "inputs": "review outcomes, intervals, ease/difficulty state",
            "outputs": "next review intervals, due-card state",
            "flow": "drives spaced repetition timing",
        },
        {
            "name": "Content generation (QGen + Grok)",
            "where": [
                cite(repo_root, "apps/web/lib/qgen/services/qgen-generation-service.ts", "llmModel: config.llmModel || 'grok-4-1-fast'"),
                cite(repo_root, "apps/web/lib/qgen/services/qgen-generation-service.ts", "generateQuestion"),
                cite(repo_root, "apps/web/lib/qgen/services/qgen-generation-service.ts", "tokensUsed"),
            ],
            "symbols": "generateQuestion, generateBatch, estimateTokens, calculateCost",
            "inputs": "generation config (area/topic/difficulty/Bloom)",
            "outputs": "generated question + validation result + token/cost proxy",
            "flow": "produces candidate items for validation and review",
        },
        {
            "name": "Verification and auto-approval",
            "where": [
                cite(repo_root, "apps/web/lib/qgen/services/qgen-validation-service.ts", "6-stage validation pipeline"),
                cite(repo_root, "apps/web/lib/qgen/services/qgen-validation-service.ts", "AUTO_APPROVE: 0.85"),
                cite(repo_root, "apps/web/lib/qgen/services/medical-verification-service.ts", "DANGEROUS_PATTERNS"),
            ],
            "symbols": "validateQuestion, determineDecision, checkDangerousPatterns",
            "inputs": "generated question content",
            "outputs": "scores, flags, decisions (auto-approve/pending/reject)",
            "flow": "gate between generation and publishing/review",
        },
        {
            "name": "Expert review workflow",
            "where": [
                cite(repo_root, "apps/web/app/api/qgen/review/route.ts", "GET /api/qgen/review"),
                cite(repo_root, "apps/web/app/api/qgen/review/route.ts", "POST - Submit a human review"),
                cite(repo_root, "infrastructure/supabase/migrations/qgen/001_qgen_core_tables.sql", "CREATE TABLE qgen_human_reviews"),
            ],
            "symbols": "review queue endpoint, human review persistence",
            "inputs": "pending_review questions + reviewer decisions",
            "outputs": "approved/rejected/needs_revision status updates",
            "flow": "human override and quality control",
        },
        {
            "name": "Hallucination control / citation verification",
            "where": [
                cite(repo_root, "apps/web/lib/theory-gen/services/citation-verification-service.ts", "Prevents hallucination by ensuring all citations are verified"),
                cite(repo_root, "apps/web/lib/theory-gen/services/citation-verification-service.ts", "detectHallucinations"),
                cite(repo_root, "apps/web/app/api/theory-gen/audit/route.ts", "Retrieve citation verification and hallucination detection audit trails"),
                cite(repo_root, "infrastructure/supabase/migrations/007_theory_generation_system.sql", "CREATE TABLE IF NOT EXISTS hallucination_audit"),
            ],
            "symbols": "verifyCitation, verifyAllCitations, detectHallucinations",
            "inputs": "claims + citation URLs + metadata",
            "outputs": "verification scores, unsupported-claim flags, audit trails",
            "flow": "safety/grounding layer for theory generation",
        },
        {
            "name": "DDL learning-gap detection + adaptive mapping",
            "where": [
                cite(repo_root, "apps/web/lib/ddl/services/ddl-service.ts", "export class DDLService"),
                cite(repo_root, "apps/web/lib/ddl/services/batch-service.ts", "export class DDLBatchService"),
                cite(repo_root, "apps/web/lib/qgen/services/ddl-integration-service.ts", "export class DDLIntegrationService"),
                cite(repo_root, "infrastructure/supabase/supabase/migrations/20260201190001_ddl_core_tables.sql", "DDL SYSTEM - CORE TABLES"),
            ],
            "symbols": "analyzeResponse, batch processing, generateAdaptiveQuestion",
            "inputs": "student free text responses + behavioral/semantic signals",
            "outputs": "lacuna classification + targeted QGen configs + feedback",
            "flow": "closes loop from diagnosis of gap to adaptive generation",
        },
        {
            "name": "ENAMED calibration ETL",
            "where": [
                cite(repo_root, "infrastructure/supabase/seed/enamed-2025-etl/README.md", "ENAMED 2025 ETL Pipeline"),
                cite(repo_root, "infrastructure/supabase/seed/enamed-2025-etl/parsers/item-parameters.ts", "microdados2025_parametros_itens.txt"),
                cite(repo_root, "infrastructure/supabase/seed/enamed-2025-etl/parsers/participant-data.ts", "Parse all ENADE participants"),
                cite(repo_root, "infrastructure/supabase/seed/enamed-2025-etl/types.ts", "Raw item parameters"),
            ],
            "symbols": "item/participant parsers, area mapping, SQL generation",
            "inputs": "official ENAMED microdata files",
            "outputs": "calibrated item/user data for platform ingestion",
            "flow": "links official calibration data to adaptive engine",
        },
    ]

    lines: List[str] = []
    lines.append("# Architecture Map")
    lines.append("")
    lines.append("This map is grounded only in observed repository implementation.")
    lines.append("")

    for c in components:
        lines.append(f"## {c['name']}")
        lines.append(f"- Implementation: {', '.join(c['where'])}")
        lines.append(f"- Key functions/classes: {c['symbols']}")
        lines.append(f"- Inputs: {c['inputs']}")
        lines.append(f"- Outputs: {c['outputs']}")
        lines.append(f"- Data flow role: {c['flow']}")
        lines.append("")

    lines.append("## Mermaid Diagram")
    lines.append("")
    lines.append("```mermaid")
    lines.append("flowchart LR")
    lines.append("  A[ENAMED Microdata] --> B[ENAMED ETL]")
    lines.append("  B --> C[(Supabase Calibrated Tables)]")
    lines.append("  C --> D[Psychometrics MIRT/DIF]")
    lines.append("  C --> E[DDL Gap Detection]")
    lines.append("  E --> F[DDL to QGen Mapping]")
    lines.append("  D --> F")
    lines.append("  F --> G[Grok-backed QGen]")
    lines.append("  G --> H[Validation and Medical Verification]")
    lines.append("  H --> I{Decision}")
    lines.append("  I -->|Auto-approve| J[Publish/Serve]")
    lines.append("  I -->|Pending review| K[Human Review Queue]")
    lines.append("  K --> J")
    lines.append("  G --> L[Theory Generation]")
    lines.append("  L --> M[Citation Verification and Hallucination Detection]")
    lines.append("  M --> N[(Audit Tables)]")
    lines.append("```")
    lines.append("")
    lines.append("Evidence anchors:")
    lines.append(f"- ENAMED ETL: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/README.md', 'ENAMED 2025 ETL Pipeline')}")
    lines.append(f"- Psychometrics: {cite(repo_root, 'packages/shared/src/calculators/mirt.ts', 'Multidimensional IRT (MIRT) Calculator')}")
    lines.append(f"- DDL: {cite(repo_root, 'apps/web/lib/ddl/services/ddl-service.ts', 'export class DDLService')}")
    lines.append(f"- QGen generation: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-generation-service.ts', 'generateQuestion')}")
    lines.append(f"- Validation: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'AUTO_APPROVE: 0.85')}")
    lines.append(f"- Human review: {cite(repo_root, 'apps/web/app/api/qgen/review/route.ts', 'POST - Submit a human review')}")
    lines.append(f"- Hallucination audit: {cite(repo_root, 'infrastructure/supabase/migrations/007_theory_generation_system.sql', 'hallucination_audit')}")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_data_audit(repo_root: Path, pack_dir: Path, dataset_catalog: List[Dict[str, object]]) -> None:
    out = pack_dir / "data_audit.md"

    enamed_rows = [
        r
        for r in dataset_catalog
        if isinstance(r, dict) and "microdados_enamed" in str(r.get("path", "")).lower()
    ]

    lines: List[str] = []
    lines.append("# Data and Calibration Artifacts Audit")
    lines.append("")
    lines.append("## ENAMED Microdata References")
    lines.append("")
    lines.append(f"- ETL pipeline documentation: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/README.md', 'ENAMED 2025 ETL Pipeline')}")
    lines.append(f"- Local microdata directory expected by ETL: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/README.md', './microdados_enamed_2025_19-01-26')}")
    lines.append(f"- Item-parameter parser: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/parsers/item-parameters.ts', 'microdados2025_parametros_itens.txt')}")
    lines.append(f"- Participant parser: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/parsers/participant-data.ts', 'Parse all ENADE participants')}")
    lines.append(f"- Type/schema declarations: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/types.ts', 'Raw item parameters')}")
    lines.append("")

    lines.append("## ENAMED Artifacts (in-repo)")
    lines.append("")
    if enamed_rows:
        lines.append("| Artifact | Size | Format | Schema status | Header sample | Included in repo |")
        lines.append("|---|---:|---|---|---|---|")
        for row in enamed_rows:
            path = str(row.get("path", ""))
            size = int(row.get("size_bytes", 0) or 0)
            fmt = str(row.get("format", ""))
            status = str(row.get("schema_status", "NOT FOUND"))
            fields = row.get("header_fields", [])
            if isinstance(fields, list) and fields:
                preview = ", ".join(str(x) for x in fields[:8])
            else:
                preview = "NOT FOUND"
            included = str(row.get("included_in_repo", True)).lower()
            lines.append(f"| `{path}:1-1` | {bytes_human(size)} | {fmt} | {status} | {preview} | {included} |")
    else:
        lines.append("NOT FOUND")
    lines.append("")

    lines.append("## Darwin-MFC Mappings and Item-Bank Linkage")
    lines.append("")
    lines.append(f"- Documented counts appear in root README (368 diseases, 690 medications): {cite(repo_root, 'README.md', '368 diseases + 690 medications library')}")
    lines.append(f"- Documented counts also appear in release notes: {cite(repo_root, 'ZENODO_RELEASE.md', '368 diseases (from Darwin-MFC)')} and {cite(repo_root, 'ZENODO_RELEASE.md', '690 medications')}")
    lines.append(f"- Theory adapter states the same counts in code comments: {cite(repo_root, 'apps/web/lib/theory-gen/adapters/darwin-mfc-adapter.ts', '368 diseases, 690 medications')}")
    lines.append(f"- Runtime adapter fallback indicates package may be unavailable (empty fallbacks): {cite(repo_root, 'apps/web/lib/theory-gen/adapters/darwin-mfc-adapter.ts', 'using empty fallbacks')}")
    lines.append(f"- Alternate web adapter currently uses stub arrays: {cite(repo_root, 'apps/web/lib/adapters/medical-data.ts', 'Currently uses stub data')} and {cite(repo_root, 'apps/web/lib/adapters/medical-data.ts', 'const doencasConsolidadas: Doenca[] = []')}")
    lines.append(f"- Consolidated disease index in submodule: {cite(repo_root, 'darwin-MFC/lib/data/doencas/index.ts', 'doencasConsolidadas')}")
    lines.append(f"- Consolidated medication index in submodule: {cite(repo_root, 'darwin-MFC/lib/data/medicamentos/index.ts', 'medicamentosConsolidados')}")
    lines.append("- Runtime-verifiable installed package counts (exact 368/690 from executable import): NOT FOUND")
    lines.append("- Explicit item-bank blueprint map directly linking Darwin-MFC counts to exam blueprint constraints: NOT FOUND")
    lines.append("")

    lines.append("## Access Method and Formats")
    lines.append("")
    lines.append("- Access method: local microdata files read by ETL parsers (`.txt` semicolon-delimited), then transformed for Supabase insertion.")
    lines.append(f"  Evidence: {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/parsers/item-parameters.ts', 'Parser for ENAMED 2025 item parameters file')}, {cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/parsers/participant-data.ts', 'Parser for ENAMED 2025 participant data files')}")
    lines.append("- External acquisition URL embedded in repo for microdata source: NOT FOUND")
    lines.append("- Data dictionary artifacts (`.xlsx`, `.ods`, `.pdf`) are present but schema extraction from those binaries is NOT PARSED in this pack.")
    lines.append(f"  Evidence: {cite(repo_root, 'microdados_enamed_2025_19-01-26/1. LEIA-ME/Dicionário_arquivos_variáveis_microdados_Enamed_2025.xlsx', None)}")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_safety_pipeline(repo_root: Path, pack_dir: Path) -> None:
    out = pack_dir / "safety_pipeline.md"

    lines: List[str] = []
    lines.append("# Safety / Hallucination Control Pipeline")
    lines.append("")
    lines.append("## Implemented Controls (Observed)")
    lines.append("")
    lines.append(f"- Multi-stage QGen validation pipeline: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', '6-stage validation pipeline')}")
    lines.append(f"- Stage weights and weighted decision score: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'const STAGE_WEIGHTS')}")
    lines.append(f"- Decision thresholds (auto/pending/revision): {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'const DECISION_THRESHOLDS')}")
    lines.append(f"- Critical medical errors force rejection: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'Critical errors always reject')}")
    lines.append(f"- Rule-based dangerous/outdated pattern checks: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'dangerousPatterns')} and {cite(repo_root, 'apps/web/lib/qgen/services/medical-verification-service.ts', 'DANGEROUS_PATTERNS')}")
    lines.append(f"- Citation verification and accessibility scoring: {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'Verify a citation')} and {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'calculateVerificationScore')}")
    lines.append(f"- Hallucination detection against claim support: {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'detectHallucinations')}")
    lines.append(f"- Audit persistence for citation/hallucination checks: {cite(repo_root, 'infrastructure/supabase/migrations/007_theory_generation_system.sql', 'citation_verification_audit')} and {cite(repo_root, 'infrastructure/supabase/migrations/007_theory_generation_system.sql', 'hallucination_audit')}")
    lines.append(f"- Audit API exposing risk buckets: {cite(repo_root, 'apps/web/app/api/theory-gen/audit/route.ts', "'critical'")}")
    lines.append(f"- Human review API path for escalation/override: {cite(repo_root, 'apps/web/app/api/qgen/review/route.ts', 'Submit a human review')}")
    lines.append("")

    lines.append("## Extracted Rubrics and Thresholds")
    lines.append("")
    lines.append("| Control | Value / Rule | Evidence |")
    lines.append("|---|---|---|")
    lines.append(f"| QGen auto-approve threshold | `0.85` | {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'AUTO_APPROVE: 0.85')} |")
    lines.append(f"| QGen pending-review threshold | `0.70` | {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'PENDING_REVIEW: 0.70')} |")
    lines.append(f"| QGen needs-revision threshold | `0.50` | {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'NEEDS_REVISION: 0.50')} |")
    lines.append(f"| Medical stage pass cutoff | `score >= 0.7` | {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'passed: score >= 0.7')} |")
    lines.append(f"| Theory generation auto-approve default | `0.90` | {cite(repo_root, 'apps/web/lib/theory-gen/services/generation-service.ts', 'autoApproveThreshold = 0.90')} |")
    lines.append(f"| Citation support gate for claims | supporting citations require `verificationScore > 0.7` and accessibility | {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'verificationScore > 0.7')} |")
    lines.append("")

    lines.append("## Failure Modes (Observed in Code)")
    lines.append("")
    lines.append(f"- Structural quality issues: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'Stage 1: Validate structural properties')}")
    lines.append(f"- Linguistic quality issues: {cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'analyzeLinguistics')}")
    lines.append(f"- Medical misinformation and dangerous treatment patterns: {cite(repo_root, 'apps/web/lib/qgen/services/medical-verification-service.ts', 'dangerous treatment patterns')}")
    lines.append(f"- Citation inaccessibility/unverified references: {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', "'unverified' | 'failed' | 'contradiction'")}")
    lines.append(f"- Unsupported claims/hallucinations: {cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'unsupported claims as hallucinations')}")
    lines.append("")

    lines.append("## PROPOSED (not implemented) Taxonomy Extension")
    lines.append("")
    lines.append("The repo contains multiple partial taxonomies, but no single cross-pipeline taxonomy for clinically dangerous errors. Proposed unification:")
    lines.append("- Clinical-dangerous treatment recommendation")
    lines.append("- Outdated guideline recommendation")
    lines.append("- Unsupported high-risk claim")
    lines.append("- Citation contradiction")
    lines.append("- Structural/clarity ambiguity with patient-safety impact")
    lines.append("- Non-critical editorial issue")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_safety_metrics_template(repo_root: Path, pack_dir: Path) -> None:
    out = pack_dir / "safety_metrics_template.md"

    lines: List[str] = []
    lines.append("# Safety Metrics Template")
    lines.append("")
    lines.append("## Inputs")
    lines.append("")
    lines.append("Expected review CSV columns (minimum):")
    lines.append("- `sample_id`")
    lines.append("- `auto_approved` (0/1)")
    lines.append("- `failure_mode` (string)")
    lines.append("- `model_dangerous_pred` (0/1)")
    lines.append("- `expert_dangerous_label` (0/1)")
    lines.append("")
    lines.append(f"Template generator script: {cite(repo_root, '_paperpack/scripts/compute_safety_metrics.py', None)}")
    lines.append("")

    lines.append("## Metrics")
    lines.append("")
    lines.append("### (a) Auto-Approval Rate with 95% Wilson CI")
    lines.append("- `p = k / n`")
    lines.append("- `center = (p + z^2/(2n)) / (1 + z^2/n)` with `z = 1.96`")
    lines.append("- `margin = z * sqrt((p(1-p)+z^2/(4n))/n) / (1 + z^2/n)`")
    lines.append("- CI = `[center - margin, center + margin]`")
    lines.append("")

    lines.append("### (b) Failure-Mode Prevalence")
    lines.append("- For each category `m`: `prevalence(m) = count(m) / N`.")
    lines.append("")

    lines.append("### (c) Expert Review Sensitivity/Specificity for Clinically Dangerous Errors")
    lines.append("- Confusion matrix from model prediction vs expert label:")
    lines.append("  - Sensitivity = `TP / (TP + FN)`")
    lines.append("  - Specificity = `TN / (TN + FP)`")
    lines.append("")

    lines.append("## Commands")
    lines.append("")
    lines.append("```bash")
    lines.append("# Create template input + NOT RUN placeholder outputs")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack")
    lines.append("")
    lines.append("# Compute real metrics from labeled review data")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack")
    lines.append("```")
    lines.append("")

    lines.append("## Output Files")
    lines.append("")
    lines.append("- `_paperpack/safety_metrics_computed.json`")
    lines.append("- `_paperpack/safety_metrics_computed.md`")
    lines.append("- `_paperpack/safety_metrics_inputs_template.csv`")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_repro_capsule(repo_root: Path, pack_dir: Path) -> None:
    out = pack_dir / "repro_capsule.md"

    env_dir = pack_dir / "env"

    lines: List[str] = []
    lines.append("# Reproducibility Capsule")
    lines.append("")
    lines.append("## Environment Requirements (Observed)")
    lines.append("")
    lines.append(f"- Node engine requirement: {cite(repo_root, 'package.json', '"engines"')} (expected `>=20`) and {cite(repo_root, 'package.json', '"node": ">=20"')}")
    lines.append(f"- Package manager lock: {cite(repo_root, 'package.json', '"packageManager": "pnpm@9.0.0"')}")
    lines.append(f"- Python package for ML training present: {cite(repo_root, 'packages/ml-training/pyproject.toml', '[project]')}")
    lines.append(f"- Docker Compose available in repo: {cite(repo_root, 'docker-compose.yml', 'services:')}")
    lines.append("")

    lines.append("## Captured Local Tool Versions")
    lines.append("")
    lines.append(f"- Python: `{first_line(env_dir / 'python_version.txt')}`")
    lines.append(f"- Pip freeze: see `_paperpack/env/pip_freeze.txt`")
    lines.append(f"- Node: `{first_line(env_dir / 'node_version.txt')}`")
    lines.append(f"- npm list: see `_paperpack/env/npm_list.txt`")
    lines.append(f"- pnpm list: see `_paperpack/env/pnpm_list.txt`")
    lines.append(f"- yarn list: see `_paperpack/env/yarn_list.txt`")
    lines.append(f"- rustc: `{first_line(env_dir / 'rust_version.txt')}`")
    lines.append(f"- cargo: `{first_line(env_dir / 'cargo_version.txt')}`")
    lines.append(f"- docker: `{first_line(env_dir / 'docker_version.txt')}`")
    lines.append("")

    lines.append("## Determinism and Seed Notes")
    lines.append("")
    lines.append(f"- Non-deterministic ID generation observed (`Date.now()` and `Math.random()`): {cite(repo_root, 'apps/web/lib/qgen/services/qgen-generation-service.ts', 'Math.random().toString(36)')}")
    lines.append("- Explicit global random seed configuration for generation/evaluation pipelines: NOT FOUND")
    lines.append("- Deterministic replay contract for LLM calls: NOT FOUND")
    lines.append("- GPU requirement in repo docs/config: NOT FOUND")
    lines.append("")

    lines.append("## Reproduction Commands")
    lines.append("")
    lines.append("```bash")
    lines.append("bash _paperpack/scripts/run_all.sh")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack")
    lines.append("# with real labels:")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack")
    lines.append("```")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_benchmarks(repo_root: Path, pack_dir: Path, benchmark_probe: Dict[str, object]) -> None:
    out = pack_dir / "benchmarks.md"

    probe = benchmark_probe.get("benchmark_probe", {}) if isinstance(benchmark_probe, dict) else {}
    prereq = benchmark_probe.get("prerequisites", {}) if isinstance(benchmark_probe, dict) else {}

    lines: List[str] = []
    lines.append("# Benchmarks")
    lines.append("")
    lines.append("## Existing Evaluation Hooks")
    lines.append("")
    lines.append(f"- Shared package unit tests (Vitest): {cite(repo_root, 'packages/shared/package.json', '"test": "vitest run"')}")
    lines.append(f"- Web end-to-end tests (Playwright): {cite(repo_root, 'apps/web/package.json', '"test:e2e": "playwright test"')}")
    lines.append(f"- CI test workflow: {cite(repo_root, '.github/workflows/test.yml', None)}")
    lines.append("")

    lines.append("## Minimal Local Run Attempt")
    lines.append("")
    status = probe.get("status", "NOT RUN")
    command = probe.get("command", "NOT FOUND")
    duration = probe.get("duration_seconds", "NOT FOUND")
    rc = probe.get("exit_code", "NOT FOUND")
    blockers = probe.get("blockers", [])

    lines.append(f"- Probe status: `{status}`")
    lines.append(f"- Probe command: `{command}`")
    lines.append(f"- Exit code: `{rc}`")
    lines.append(f"- Duration (s): `{duration}`")
    lines.append(f"- Node detected: `{prereq.get('node_version', 'NOT RUN')}`")
    lines.append(f"- pnpm available: `{prereq.get('pnpm_available', 'NOT RUN')}`")

    if isinstance(blockers, list) and blockers:
        lines.append(f"- Blockers: {', '.join(str(b) for b in blockers)}")
    elif isinstance(blockers, str) and blockers:
        lines.append(f"- Blockers: {blockers}")
    else:
        lines.append("- Blockers: NOT FOUND")

    lines.append(f"- Discovery log: `{probe.get('discovery_file', 'NOT FOUND')}`")
    lines.append(f"- Run log: `{probe.get('log_file', 'NOT FOUND')}`")
    lines.append("")

    if status == "NOT RUN":
        lines.append("Latency: NOT RUN")
        lines.append("Throughput: NOT RUN")
        lines.append("Cost proxy (tokens): NOT RUN")
        lines.append("Failure rate: NOT RUN")
    elif status == "RUN_FAILED":
        lines.append("Latency: PARTIAL (see run log)")
        lines.append("Throughput: NOT FOUND")
        lines.append("Cost proxy (tokens): NOT FOUND")
        lines.append("Failure rate: RUN FAILED")
    else:
        lines.append("Latency: captured in run log")
        lines.append("Throughput: NOT FOUND")
        lines.append("Cost proxy (tokens): NOT FOUND")
        lines.append("Failure rate: derive from test report")
    lines.append("")

    lines.append("## If Blocked: Minimal Mock/Stub Path")
    lines.append("")
    lines.append("When full runtime is unavailable, run the local mock benchmark driver (does not touch production code):")
    lines.append("```bash")
    lines.append("python3 _paperpack/scripts/mock_benchmark_driver.py")
    lines.append("```")
    lines.append("This creates `_paperpack/mock_benchmark_results.json` and `_paperpack/mock_benchmark_results.md` as placeholder structure for later real measurements.")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_preprint_skeleton(repo_root: Path, pack_dir: Path) -> None:
    preprint_dir = pack_dir / "preprint"
    figures_dir = preprint_dir / "figures"
    tables_dir = preprint_dir / "tables"
    preprint_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)
    tables_dir.mkdir(parents=True, exist_ok=True)

    preprint_md = preprint_dir / "preprint.md"
    architecture_mmd = figures_dir / "architecture.mmd"
    benchmark_table = tables_dir / "benchmark_template.md"
    safety_table = tables_dir / "safety_metrics_template.md"

    preprint_lines: List[str] = []
    preprint_lines.append("# Darwin Education: Architecture and Systems Evidence Preprint (Draft Skeleton)")
    preprint_lines.append("")
    preprint_lines.append("## Title")
    preprint_lines.append("- Placeholder: _Darwin Education as a Safety-Aware Adaptive Learning System for Medical Education_")
    preprint_lines.append("")
    preprint_lines.append("## Abstract")
    preprint_lines.append("- Problem, system design, safety controls, reproducibility scope, and key outcomes placeholder.")
    preprint_lines.append("")
    preprint_lines.append("## Keywords")
    preprint_lines.append("- adaptive learning, psychometrics, MIRT, DIF, DDL, safety, hallucination control, medical education")
    preprint_lines.append("")
    preprint_lines.append("## 1. Introduction")
    preprint_lines.append("- Context and gap in AI-enabled medical education systems.")
    preprint_lines.append("")
    preprint_lines.append("## 2. System Architecture")
    preprint_lines.append("- Component map, services, data flows.")
    preprint_lines.append("- Figure: `figures/architecture.mmd`.")
    preprint_lines.append("")
    preprint_lines.append("## 3. Data and Calibration")
    preprint_lines.append("- ENAMED microdata ingestion, calibration assumptions, mapping scope.")
    preprint_lines.append("")
    preprint_lines.append("## 4. Safety and Hallucination Controls")
    preprint_lines.append("- Validation thresholds, citation verification, human review gates.")
    preprint_lines.append("")
    preprint_lines.append("## 5. Reproducibility Capsule")
    preprint_lines.append("- Toolchain, scripts, deterministic caveats.")
    preprint_lines.append("")
    preprint_lines.append("## 6. Preliminary Benchmarks")
    preprint_lines.append("- Latency/throughput/failure placeholders and methods.")
    preprint_lines.append("- Table: `tables/benchmark_template.md`.")
    preprint_lines.append("")
    preprint_lines.append("## 7. Limitations")
    preprint_lines.append("- Data/package availability, execution environment constraints, pending evaluations.")
    preprint_lines.append("")
    preprint_lines.append("## 8. Conclusion")
    preprint_lines.append("- Architecture contribution and evidence-backed roadmap.")
    preprint_lines.append("")
    preprint_lines.append("## AI Disclosure")
    preprint_lines.append("")
    preprint_lines.append("### Layer 1: AI as Research Object")
    preprint_lines.append("- The platform under study includes AI generation and verification components as part of the system architecture.")
    preprint_lines.append("- Reported claims should distinguish implemented code paths from proposed/non-implemented behavior.")
    preprint_lines.append("")
    preprint_lines.append("### Layer 2: AI as Writing Instrument")
    preprint_lines.append("- AI tools may have been used for drafting, language editing, and formatting support.")
    preprint_lines.append("- Final scientific claims, interpretation, and accountability remain with the authors.")
    preprint_lines.append("")
    preprint_lines.append("## References")
    preprint_lines.append("- Add software DOI (Zenodo), repository references, and journal-style citations.")

    # Preserve manually curated manuscript files once they exist.
    if not preprint_md.exists():
        preprint_md.write_text("\n".join(preprint_lines).rstrip() + "\n", encoding="utf-8")

    if not architecture_mmd.exists():
        architecture_mmd.write_text(
            "flowchart LR\n"
            "  A[ENAMED Microdata] --> B[Calibration ETL]\n"
            "  B --> C[(Supabase)]\n"
            "  C --> D[MIRT/DIF/Unified Model]\n"
            "  C --> E[DDL Analysis]\n"
            "  D --> F[Adaptive Question Mapping]\n"
            "  E --> F\n"
            "  F --> G[QGen LLM]\n"
            "  G --> H[Validation + Safety Filters]\n"
            "  H --> I{Auto-approve?}\n"
            "  I -->|Yes| J[Serve Content]\n"
            "  I -->|No| K[Expert Review]\n"
            "  K --> J\n"
            "  G --> L[Theory Generation]\n"
            "  L --> M[Citation/Hallucination Audit]\n",
            encoding="utf-8",
        )

    if not benchmark_table.exists():
        benchmark_table.write_text(
            "# Benchmark Table Template\n\n"
            "| Pipeline | Dataset | Runtime env | n | p50 latency (ms) | p95 latency (ms) | Throughput (items/s) | Failure rate | Token proxy | Notes |\n"
            "|---|---|---|---:|---:|---:|---:|---:|---:|---|\n"
            "| QGen minimal pipeline | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO |\n",
            encoding="utf-8",
        )

    if not safety_table.exists():
        safety_table.write_text(
            "# Safety Metrics Table Template\n\n"
            "| Metric | Definition | Value | CI / Uncertainty | Data source |\n"
            "|---|---|---:|---|---|\n"
            "| Auto-approval rate | approved automatically / total generated | TODO | Wilson 95% CI | TODO |\n"
            "| Dangerous-error sensitivity | TP / (TP + FN) | TODO | TODO | TODO |\n"
            "| Dangerous-error specificity | TN / (TN + FP) | TODO | TODO | TODO |\n"
            "| Failure mode prevalence (per class) | count(class) / N | TODO | TODO | TODO |\n",
            encoding="utf-8",
        )


def write_readme(
    repo_root: Path,
    pack_dir: Path,
    keyword_hits: Dict[str, object],
    benchmark_probe: Dict[str, object],
) -> None:
    out = pack_dir / "README.md"

    top_files = [
        "packages/shared/src/calculators/mirt.ts",
        "packages/shared/src/calculators/dif.ts",
        "packages/shared/src/calculators/fsrs.ts",
        "packages/shared/src/calculators/unified-learner-model.ts",
        "apps/web/lib/qgen/services/qgen-generation-service.ts",
        "apps/web/lib/qgen/services/qgen-validation-service.ts",
        "apps/web/lib/theory-gen/services/citation-verification-service.ts",
        "apps/web/lib/ddl/services/ddl-service.ts",
        "infrastructure/supabase/seed/enamed-2025-etl/README.md",
        "infrastructure/supabase/migrations/qgen/001_qgen_core_tables.sql",
    ]

    probe = benchmark_probe.get("benchmark_probe", {}) if isinstance(benchmark_probe, dict) else {}
    status = probe.get("status", "NOT RUN")
    blockers = probe.get("blockers", [])
    blockers_text = ", ".join(blockers) if isinstance(blockers, list) else str(blockers)
    if not blockers_text:
        blockers_text = "NOT FOUND"

    lines: List[str] = []
    lines.append("# Preprint-Ready Evidence Pack")
    lines.append("")
    lines.append("This folder contains the reproducible evidence pack generated from repository-observed implementation only.")
    lines.append("")

    lines.append("## What Was Generated")
    lines.append("")
    lines.append("- Repository inventory and architecture map")
    lines.append("- Data/calibration artifact audit plus extracted/inferred schemas")
    lines.append("- Safety pipeline evidence and safety metric computation template")
    lines.append("- Reproducibility capsule with environment snapshots")
    lines.append("- Benchmark probe (best effort) and fallback mock benchmark stub")
    lines.append("- Preprint manuscript skeleton (Markdown + Mermaid + table templates)")
    lines.append("")

    lines.append("## Quick Index")
    lines.append("")
    lines.append("- `repo_inventory.md`")
    lines.append("- `architecture_map.md`")
    lines.append("- `data_audit.md`")
    lines.append("- `safety_pipeline.md`")
    lines.append("- `safety_metrics_template.md`")
    lines.append("- `repro_capsule.md`")
    lines.append("- `benchmarks.md`")
    lines.append("- `keyword_hits.csv` and `keyword_hits.json`")
    lines.append("- `schemas/`")
    lines.append("- `env/`")
    lines.append("- `preprint/`")
    lines.append("- `run_manifest.json`")
    lines.append("")

    lines.append("## Reproducible Commands")
    lines.append("")
    lines.append("```bash")
    lines.append("# Full rerun")
    lines.append("bash _paperpack/scripts/run_all.sh")
    lines.append("")
    lines.append("# Recompute safety metrics template")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack")
    lines.append("")
    lines.append("# Compute real safety metrics from labeled review data")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack")
    lines.append("```")
    lines.append("")

    lines.append("## Executive Summary")
    lines.append("")
    lines.append("### What was found")
    lines.append(f"- Psychometric/adaptive stack including MIRT 5D, DIF, and spaced repetition implementations ({cite(repo_root, 'packages/shared/src/calculators/mirt.ts', 'Multidimensional IRT (MIRT) Calculator')}, {cite(repo_root, 'packages/shared/src/calculators/dif.ts', 'Differential Item Functioning (DIF) Calculator')}, {cite(repo_root, 'packages/shared/src/calculators/fsrs.ts', 'FSRS-6')}).")
    lines.append(f"- Generation + validation + review workflow with thresholds and human-in-the-loop endpoints ({cite(repo_root, 'apps/web/lib/qgen/services/qgen-validation-service.ts', 'AUTO_APPROVE: 0.85')}, {cite(repo_root, 'apps/web/app/api/qgen/review/route.ts', 'Submit a human review')}).")
    lines.append(f"- Hallucination/citation verification pipeline with audit persistence ({cite(repo_root, 'apps/web/lib/theory-gen/services/citation-verification-service.ts', 'detectHallucinations')}, {cite(repo_root, 'infrastructure/supabase/migrations/007_theory_generation_system.sql', 'hallucination_audit')}).")
    lines.append(f"- ENAMED ETL references and local microdata artifacts are present ({cite(repo_root, 'infrastructure/supabase/seed/enamed-2025-etl/README.md', 'ENAMED 2025 ETL Pipeline')}, {cite(repo_root, 'microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt', None)}).")
    lines.append("")

    lines.append("### What is missing")
    lines.append("- Runtime-verifiable installed package counts for Darwin-MFC `368/690`: NOT FOUND (documentation claims exist, runtime adapters include fallback/stub mode).")
    lines.append(f"- Full benchmark execution status: `{status}`; blockers: {blockers_text}.")
    lines.append("- Labeled expert-review CSV for computing real sensitivity/specificity metrics: NOT FOUND.")
    lines.append("- Deterministic seed contract for generation pipelines: NOT FOUND.")
    lines.append("")

    lines.append("### Top 10 files for manuscript writing")
    for idx, f in enumerate(top_files[:10], start=1):
        lines.append(f"{idx}. `{f}`")
    lines.append("")

    lines.append("### Exact next commands for real metrics")
    lines.append("```bash")
    lines.append("# 1) Satisfy Node/pnpm prerequisites (if needed)")
    lines.append("nvm install 20 && nvm use 20")
    lines.append("corepack enable && corepack prepare pnpm@9.0.0 --activate")
    lines.append("pnpm install")
    lines.append("")
    lines.append("# 2) Run minimal benchmark probe again")
    lines.append("bash _paperpack/scripts/benchmark_probe.sh")
    lines.append("")
    lines.append("# 3) Run shared tests for latency/failure proxies")
    lines.append("pnpm --filter @darwin-education/shared test")
    lines.append("")
    lines.append("# 4) Compute safety metrics from real review labels")
    lines.append("python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack")
    lines.append("```")

    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    pack_dir = repo_root / "_paperpack"

    repo_facts = load_json(pack_dir / "repo_facts.json", {})
    keyword_hits = load_json(pack_dir / "keyword_hits.json", {})
    dataset_catalog = load_json(pack_dir / "schemas" / "dataset_catalog.json", [])
    benchmark_probe = load_json(pack_dir / "benchmark_probe.json", {})

    tree_lines = load_lines(pack_dir / "repo_tree_snapshot.txt")
    key_files_lines = load_lines(pack_dir / "key_files.txt")
    language_rows = parse_language_summary(pack_dir / "language_summary.tsv")

    write_repo_inventory(repo_root, pack_dir, repo_facts, language_rows, tree_lines, key_files_lines)
    write_architecture_map(repo_root, pack_dir)
    write_data_audit(repo_root, pack_dir, dataset_catalog)
    write_safety_pipeline(repo_root, pack_dir)
    write_safety_metrics_template(repo_root, pack_dir)
    write_repro_capsule(repo_root, pack_dir)
    write_benchmarks(repo_root, pack_dir, benchmark_probe)
    write_preprint_skeleton(repo_root, pack_dir)
    write_readme(repo_root, pack_dir, keyword_hits, benchmark_probe)


if __name__ == "__main__":
    main()
