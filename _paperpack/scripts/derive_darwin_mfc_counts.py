#!/usr/bin/env python3
"""
Patch A — Derive runtime-verifiable counts for Darwin-MFC disease/medication arrays.

Scans the darwin-MFC submodule TypeScript source to count exported array entries,
producing a reproducible derived artifact instead of relying on documentation claims.

Usage:
    python3 _paperpack/scripts/derive_darwin_mfc_counts.py

Output:
    _paperpack/derived/darwin_mfc_counts.json
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PACK_DIR = SCRIPT_DIR.parent
REPO_ROOT = PACK_DIR.parent
DERIVED_DIR = PACK_DIR / "derived"
DERIVED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT = DERIVED_DIR / "darwin_mfc_counts.json"


def git_commit() -> str:
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, text=True
            )
            .strip()
        )
    except Exception:
        return "NOT_AVAILABLE"


def git_submodule_commit() -> str:
    try:
        out = subprocess.check_output(
            ["git", "submodule", "status", "darwin-MFC"],
            cwd=REPO_ROOT,
            text=True,
        ).strip()
        # Format: " <sha> darwin-MFC (heads/main)"
        return out.split()[0].lstrip("+- ")
    except Exception:
        return "NOT_AVAILABLE"


# ---------------------------------------------------------------------------
# Strategy 1: Count object-literal entries in the category files
# Each disease/medication is typically an object literal { id: "...", ... }
# We count top-level objects in the consolidated arrays.
# ---------------------------------------------------------------------------

def count_entries_in_ts_array(file_path: Path) -> int | None:
    """Count array entries in a TS file that exports an array of object literals.

    Heuristic: count lines matching `^\\s*{\\s*$` or `^\\s*{\\s*id:` which
    indicate the start of an object literal inside an array.
    Also handles single-line objects like `{ id: "...", name: "..." },`
    """
    if not file_path.exists():
        return None
    text = file_path.read_text(encoding="utf-8", errors="replace")
    # Count patterns that start an object in an array
    starts = re.findall(
        r"^\s*\{\s*$|^\s*\{\s*id\s*:|^\s*\{\s*nome|^\s*\{\s*nomeGenerico",
        text,
        re.MULTILINE,
    )
    return len(starts) if starts else None


def count_category_files(base_dir: Path, patterns: list[str]) -> dict:
    """Walk category directories and count entries in each file."""
    results = {}
    if not base_dir.exists():
        return results
    for ts_file in sorted(base_dir.rglob("*.ts")):
        if ts_file.name == "index.ts":
            continue
        count = count_entries_in_ts_array(ts_file)
        if count and count > 0:
            results[str(ts_file.relative_to(REPO_ROOT))] = count
    return results


# ---------------------------------------------------------------------------
# Strategy 2: Count spread entries in the consolidated index
# The index.ts files use `...categoryArray` to build the master array.
# We count these spread entries and cross-reference with category files.
# ---------------------------------------------------------------------------

def count_spread_entries(index_path: Path) -> int:
    """Count `...identifier` entries in an array literal in index.ts."""
    if not index_path.exists():
        return 0
    text = index_path.read_text(encoding="utf-8", errors="replace")
    spreads = re.findall(r"^\s*\.{3}\w+", text, re.MULTILINE)
    return len(spreads)


# ---------------------------------------------------------------------------
# Strategy 3: grep for unique `id:` declarations across all category files
# ---------------------------------------------------------------------------

def count_unique_ids(base_dir: Path) -> int:
    """Count unique id: string patterns across all .ts files in directory tree."""
    if not base_dir.exists():
        return 0
    ids = set()
    for ts_file in base_dir.rglob("*.ts"):
        text = ts_file.read_text(encoding="utf-8", errors="replace")
        matches = re.findall(r"""id\s*:\s*['"]([^'"]+)['"]""", text)
        ids.update(matches)
    return len(ids)


def main() -> None:
    doencas_dir = REPO_ROOT / "darwin-MFC" / "lib" / "data" / "doencas"
    meds_dir = REPO_ROOT / "darwin-MFC" / "lib" / "data" / "medicamentos"
    doencas_index = doencas_dir / "index.ts"
    meds_index = meds_dir / "index.ts"

    # Multiple counting strategies for robustness
    doencas_unique_ids = count_unique_ids(doencas_dir)
    meds_unique_ids = count_unique_ids(meds_dir)
    doencas_spreads = count_spread_entries(doencas_index)
    meds_spreads = count_spread_entries(meds_index)
    doencas_by_file = count_category_files(doencas_dir, ["id:", "nome"])
    meds_by_file = count_category_files(meds_dir, ["id:", "nomeGenerico"])

    # Also check the base consolidated data files
    base_doencas = REPO_ROOT / "darwin-MFC" / "lib" / "data" / "doencas.ts"
    base_meds = REPO_ROOT / "darwin-MFC" / "lib" / "data" / "medicamentos.ts"
    base_doencas_count = count_entries_in_ts_array(base_doencas)
    base_meds_count = count_entries_in_ts_array(base_meds)

    # Also count expanded medications if present
    expanded_meds = REPO_ROOT / "darwin-MFC" / "lib" / "data" / "medicamentos-expanded.ts"
    expanded_meds_count = count_entries_in_ts_array(expanded_meds)

    result = {
        "generated_at_utc": datetime.now(timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "repo_commit": git_commit(),
        "submodule_commit": git_submodule_commit(),
        "method": "static_analysis_multi_strategy",
        "diseases": {
            "unique_ids_across_all_files": doencas_unique_ids,
            "spread_entries_in_index": doencas_spreads,
            "base_file_entry_count": base_doencas_count,
            "category_file_counts": doencas_by_file,
            "category_file_total": sum(doencas_by_file.values()),
            "best_estimate": doencas_unique_ids,
            "documented_claim": 368,
            "match": doencas_unique_ids == 368 if doencas_unique_ids else "INCONCLUSIVE",
        },
        "medications": {
            "unique_ids_across_all_files": meds_unique_ids,
            "spread_entries_in_index": meds_spreads,
            "base_file_entry_count": base_meds_count,
            "expanded_file_entry_count": expanded_meds_count,
            "category_file_counts": meds_by_file,
            "category_file_total": sum(meds_by_file.values()),
            "best_estimate": meds_unique_ids,
            "documented_claim": 690,
            "match": meds_unique_ids == 690 if meds_unique_ids else "INCONCLUSIVE",
        },
        "notes": [
            "Counts derived from static analysis of TypeScript source (regex-based id extraction).",
            "Definitive count requires runtime execution (ts-node or transpilation).",
            "Multiple strategies provided for cross-validation.",
            "If best_estimate differs from documented_claim, investigate deduplication logic in index.ts.",
        ],
    }

    OUTPUT.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Derived counts written to {OUTPUT}")
    print(
        f"  Diseases: best_estimate={doencas_unique_ids}, documented={368}, "
        f"match={result['diseases']['match']}"
    )
    print(
        f"  Medications: best_estimate={meds_unique_ids}, documented={690}, "
        f"match={result['medications']['match']}"
    )


if __name__ == "__main__":
    main()
