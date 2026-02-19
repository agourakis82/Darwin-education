#!/usr/bin/env python3
"""Search repository for architecture/safety keywords and emit evidence hits as CSV and JSON.

Usage:
    python find_artifacts.py [--out-csv PATH] [--out-json PATH]

Searches with ripgrep (rg) if available, otherwise falls back to a pure-Python
os.walk search.  Secrets matching known provider patterns are redacted in
snippet output.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]

KEYWORDS: List[str] = [
    "ENAMED",
    "microdata",
    "MIRT",
    "IRT",
    "DIF",
    "DDL",
    "FSRS",
    "SM-2",
    "Grok",
    "auto-approval",
    "rubric",
    "safety",
    "guideline",
    "verification",
    "hallucination",
]

EXCLUDE_DIRS: set[str] = {
    ".git",
    "node_modules",
    "target",
    "dist",
    "__pycache__",
    ".next",
    ".cache",
    ".turbo",
    ".pnpm-store",
    "_paperpack",
}

# Patterns whose matches are replaced with <<REDACTED>> in snippets.
SECRET_PATTERNS = [
    re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),           # OpenAI-style keys
    re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),           # GitHub PATs
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),               # AWS access key IDs
    re.compile(r"\bAIza[0-9A-Za-z_-]{20,}\b"),         # Google API keys
    re.compile(                                         # key=value assignments
        r"(?i)\b(api[_-]?key|token|secret|password)\b"
        r"\s*[:=]\s*['\"]?[^\s'\"]{6,}"
    ),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def redact(text: str) -> str:
    """Replace secret-like tokens with <<REDACTED>>."""
    result = text
    for pat in SECRET_PATTERNS:
        result = pat.sub("<<REDACTED>>", result)
    return result


def _is_text_file(path: Path) -> bool:
    """Return True if *path* appears to be a text file (no NUL bytes)."""
    try:
        chunk = path.read_bytes()[:2048]
        return b"\x00" not in chunk
    except OSError:
        return False


# ---------------------------------------------------------------------------
# Search back-ends
# ---------------------------------------------------------------------------

Hit = Dict[str, object]


def search_with_rg(repo_root: Path) -> List[Hit]:
    """Use ripgrep to search for each keyword, returning a flat hit list."""
    hits: List[Hit] = []

    for keyword in KEYWORDS:
        cmd: List[str] = [
            "rg",
            "--no-heading",
            "--line-number",
            "--color", "never",
            "--case-sensitive" if keyword in ("ENAMED", "MIRT", "IRT", "DIF",
                                               "DDL", "FSRS", "SM-2", "Grok",
                                               "AKIA") else "--ignore-case",
            "--fixed-strings",
            keyword,
            ".",
        ]
        for dirname in sorted(EXCLUDE_DIRS):
            cmd.extend(["--glob", f"!{dirname}/**"])

        proc = subprocess.run(
            cmd, cwd=repo_root, capture_output=True, text=True,
        )
        # rg exits 0 on match, 1 on no match, 2+ on error
        if proc.returncode >= 2:
            print(
                f"WARNING: rg failed for '{keyword}': {proc.stderr.strip()}",
                file=sys.stderr,
            )
            continue

        for raw_line in proc.stdout.splitlines():
            m = re.match(r"^(.*?):(\d+):(.*)$", raw_line)
            if m is None:
                continue
            file_rel = m.group(1).lstrip("./")
            lineno = int(m.group(2))
            snippet = redact(m.group(3).strip())
            hits.append({
                "keyword": keyword,
                "file": file_rel,
                "line_start": lineno,
                "line_end": lineno,
                "snippet": snippet,
            })

    return hits


def search_with_python(repo_root: Path) -> List[Hit]:
    """Pure-Python fallback using os.walk + regex."""
    regexes = {kw: re.compile(re.escape(kw), re.IGNORECASE) for kw in KEYWORDS}
    hits: List[Hit] = []

    for root, dirs, files in os.walk(repo_root):
        # Prune excluded directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for fname in files:
            fpath = Path(root) / fname
            if not _is_text_file(fpath):
                continue
            rel = str(fpath.relative_to(repo_root))
            try:
                with fpath.open("r", encoding="utf-8", errors="replace") as fh:
                    for lineno, raw in enumerate(fh, start=1):
                        line = raw.rstrip("\n")
                        for keyword, rx in regexes.items():
                            if rx.search(line):
                                hits.append({
                                    "keyword": keyword,
                                    "file": rel,
                                    "line_start": lineno,
                                    "line_end": lineno,
                                    "snippet": redact(line.strip()),
                                })
            except OSError:
                continue

    return hits


# ---------------------------------------------------------------------------
# Output writers
# ---------------------------------------------------------------------------

CSV_COLUMNS = ["keyword", "file", "line_start", "line_end", "snippet"]


def write_csv(path: Path, hits: List[Hit]) -> None:
    """Write hits to a CSV file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in hits:
            writer.writerow(row)


def write_json(path: Path, hits: List[Hit], backend: str) -> None:
    """Write structured JSON report."""
    path.parent.mkdir(parents=True, exist_ok=True)

    counts_by_keyword: Dict[str, int] = {kw: 0 for kw in KEYWORDS}
    file_counter: Counter[str] = Counter()
    for h in hits:
        kw = str(h["keyword"])
        counts_by_keyword[kw] = counts_by_keyword.get(kw, 0) + 1
        file_counter[str(h["file"])] += 1

    top_files = [
        {"file": f, "count": c}
        for f, c in file_counter.most_common(50)
    ]

    payload = {
        "search_backend": backend,
        "keywords": KEYWORDS,
        "total_hits": len(hits),
        "counts_by_keyword": counts_by_keyword,
        "top_files": top_files,
        "hits": hits,
    }
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Search repo for architecture/safety keywords and emit evidence hits.",
    )
    parser.add_argument(
        "--out-csv",
        default="_paperpack/keyword_hits.csv",
        help="CSV output path relative to repo root (default: %(default)s)",
    )
    parser.add_argument(
        "--out-json",
        default="_paperpack/keyword_hits.json",
        help="JSON output path relative to repo root (default: %(default)s)",
    )
    args = parser.parse_args()

    repo_root = REPO_ROOT
    out_csv = (repo_root / args.out_csv).resolve()
    out_json = (repo_root / args.out_json).resolve()

    # Choose search back-end
    if shutil.which("rg"):
        backend = "rg"
        print("Using ripgrep (rg) backend", file=sys.stderr)
        hits = search_with_rg(repo_root)
    else:
        backend = "python"
        print("ripgrep not found; using Python os.walk fallback", file=sys.stderr)
        hits = search_with_python(repo_root)

    # Sort by file, line_start, keyword
    hits.sort(key=lambda h: (str(h["file"]), int(h["line_start"]), str(h["keyword"])))  # type: ignore[arg-type]

    # Write outputs
    write_csv(out_csv, hits)
    write_json(out_json, hits, backend)

    # Summary to stderr
    print(f"Total hits: {len(hits)}", file=sys.stderr)
    print(f"CSV  -> {out_csv}", file=sys.stderr)
    print(f"JSON -> {out_json}", file=sys.stderr)


if __name__ == "__main__":
    main()
