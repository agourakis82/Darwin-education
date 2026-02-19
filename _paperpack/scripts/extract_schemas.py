#!/usr/bin/env python3
"""Extract observed and inferred schemas from datasets, SQL migrations, and TypeScript interfaces.

Walks the repository to discover:
  1. Dataset files (.csv/.tsv/.txt/.json) matching domain-relevant path hints.
  2. SQL CREATE TABLE statements with column definitions.
  3. TypeScript exported interfaces from parser/type/schema/enamed/ddl files.

Outputs consolidated schema catalogs to _paperpack/schemas/.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]

EXCLUDE_DIRS = {
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

DATA_EXTS = {".csv", ".tsv", ".txt", ".json"}

PATH_HINTS = {
    "enamed",
    "microdados",
    "mfc",
    "disease",
    "medic",
    "item",
    "blueprint",
    "darwin",
}

TS_PATH_HINTS = {"parser", "types", "schema", "enamed", "ddl"}

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class DatasetRecord:
    path: str
    size_bytes: int
    format: str
    header_fields: List[str]
    schema_status: str  # OBSERVED_HEADER | OBSERVED_KEYS | NOT_FOUND | NOT_PARSED


@dataclass
class SQLTableRecord:
    table: str
    file: str
    line_start: int
    line_end: int
    columns: List[Dict[str, str]]


@dataclass
class InferredSchemaRecord:
    interface: str
    file: str
    line_start: int
    line_end: int
    fields: List[Dict[str, str]]
    caveat: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def iter_files(root: Path):
    """Walk *root* yielding every file, pruning excluded directories."""
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        p = Path(dirpath)
        for name in files:
            yield p / name


def _candidate_dataset(path: Path) -> bool:
    """Return True if *path* looks like a domain-relevant data file."""
    if path.suffix.lower() not in DATA_EXTS:
        return False
    rel = str(path.relative_to(REPO_ROOT)).lower()
    return any(hint in rel for hint in PATH_HINTS)


# ---------------------------------------------------------------------------
# 1. Dataset discovery
# ---------------------------------------------------------------------------


def _read_first_nonempty_line(path: Path) -> Optional[str]:
    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                stripped = line.strip()
                if stripped:
                    return stripped
    except OSError:
        return None
    return None


def _parse_header(line: str) -> List[str]:
    """Try several delimiters and keep the split that produces the most fields."""
    delimiters = [";", "\t", ",", "|"]
    best: List[str] = []
    for delim in delimiters:
        parts = [p.strip() for p in line.split(delim)]
        if len(parts) > len(best):
            best = parts
    # Reject if we only got a single "field" (no real delimiter found)
    if len(best) <= 1:
        return []
    # Heuristic: reject when any part looks like a prose sentence (space + lowercase)
    if any(re.search(r"\s", p) and p.islower() for p in best):
        return []
    return [p for p in best if p]


def _read_json_keys(path: Path) -> List[str]:
    """Read first 256K of a JSON file and return top-level keys."""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            text = fh.read(256 * 1024)
        obj = json.loads(text)
        if isinstance(obj, dict):
            return list(obj.keys())
        if isinstance(obj, list) and obj and isinstance(obj[0], dict):
            return list(obj[0].keys())
    except Exception:
        pass
    return []


def extract_dataset_records() -> List[DatasetRecord]:
    rows: List[DatasetRecord] = []
    for path in iter_files(REPO_ROOT):
        if not _candidate_dataset(path):
            continue
        rel = str(path.relative_to(REPO_ROOT))
        try:
            size = path.stat().st_size
        except OSError:
            size = 0
        suffix = path.suffix.lower().lstrip(".")
        header_fields: List[str] = []
        schema_status = "NOT_FOUND"

        if path.suffix.lower() in {".csv", ".tsv", ".txt"}:
            first = _read_first_nonempty_line(path)
            if first:
                header_fields = _parse_header(first)
                schema_status = "OBSERVED_HEADER" if header_fields else "NOT_FOUND"
        elif path.suffix.lower() == ".json":
            keys = _read_json_keys(path)
            if keys:
                header_fields = keys
                schema_status = "OBSERVED_KEYS"
        else:
            schema_status = "NOT_PARSED"

        rows.append(
            DatasetRecord(
                path=rel,
                size_bytes=size,
                format=suffix,
                header_fields=header_fields,
                schema_status=schema_status,
            )
        )
    return sorted(rows, key=lambda r: r.path)


# ---------------------------------------------------------------------------
# 2. SQL table extraction
# ---------------------------------------------------------------------------

_CREATE_TABLE_RE = re.compile(
    r"^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.\"-]+)",
    re.IGNORECASE,
)
_TABLE_END_RE = re.compile(r"\)\s*;")
_COLUMN_RE = re.compile(r'^\s*"?([A-Za-z_]\w*)"?\s+([A-Za-z]\S.*)')
_SKIP_PREFIXES = ("primary", "foreign", "unique", "check", "constraint")


def parse_sql_tables() -> List[SQLTableRecord]:
    records: List[SQLTableRecord] = []
    for path in iter_files(REPO_ROOT):
        if path.suffix.lower() != ".sql":
            continue
        rel = str(path.relative_to(REPO_ROOT))
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue

        i = 0
        while i < len(lines):
            m = _CREATE_TABLE_RE.match(lines[i])
            if not m:
                i += 1
                continue

            table_name = m.group(1).strip('"')
            start_line = i + 1  # 1-based
            cols: List[Dict[str, str]] = []
            j = i + 1
            while j < len(lines):
                raw = lines[j]
                stripped = raw.strip().lower()
                if _TABLE_END_RE.search(raw):
                    break
                if not stripped or stripped.startswith("--"):
                    j += 1
                    continue
                if stripped.startswith(_SKIP_PREFIXES):
                    j += 1
                    continue
                cm = _COLUMN_RE.match(raw)
                if cm:
                    col_name = cm.group(1)
                    col_type = cm.group(2).strip().rstrip(",")
                    cols.append({"name": col_name, "type": col_type})
                j += 1

            end_line = min(j + 1, len(lines))
            records.append(
                SQLTableRecord(
                    table=table_name,
                    file=rel,
                    line_start=start_line,
                    line_end=end_line,
                    columns=cols,
                )
            )
            i = j + 1

    return sorted(records, key=lambda r: (r.file, r.line_start))


# ---------------------------------------------------------------------------
# 3. TypeScript interface extraction
# ---------------------------------------------------------------------------

_IFACE_START_RE = re.compile(r"^\s*export\s+interface\s+([A-Za-z_]\w*)\s*\{")
# Match fields with or without trailing semicolon/comma
_FIELD_RE = re.compile(r"^\s*(\w+)\??:\s*(.+?)\s*[;,]?\s*$")

INFERRED_CAVEAT = (
    "Inferred from TypeScript interface declarations; "
    "runtime validation may differ."
)


def parse_typescript_interfaces() -> List[InferredSchemaRecord]:
    results: List[InferredSchemaRecord] = []
    for path in iter_files(REPO_ROOT):
        if path.suffix.lower() not in {".ts", ".tsx"}:
            continue
        rel = str(path.relative_to(REPO_ROOT))
        rel_lower = rel.lower()
        if not any(hint in rel_lower for hint in TS_PATH_HINTS):
            continue
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue

        i = 0
        while i < len(lines):
            m = _IFACE_START_RE.match(lines[i])
            if not m:
                i += 1
                continue
            iface_name = m.group(1)
            start_line = i + 1  # 1-based
            fields: List[Dict[str, str]] = []
            depth = 1
            j = i + 1
            while j < len(lines):
                line = lines[j]
                depth += line.count("{")
                depth -= line.count("}")
                # Only extract top-level fields (depth == 1)
                if depth == 1:
                    fm = _FIELD_RE.match(line)
                    if fm:
                        fname = fm.group(1)
                        ftype = fm.group(2).strip()
                        fields.append({"name": fname, "type": ftype})
                if depth <= 0:
                    break
                j += 1
            end_line = min(j + 1, len(lines))
            results.append(
                InferredSchemaRecord(
                    interface=iface_name,
                    file=rel,
                    line_start=start_line,
                    line_end=end_line,
                    fields=fields,
                    caveat=INFERRED_CAVEAT,
                )
            )
            i = j + 1

    return sorted(results, key=lambda r: (r.file, r.line_start))


# ---------------------------------------------------------------------------
# Output writers
# ---------------------------------------------------------------------------


def _write_datasets_observed(path: Path, rows: List[DatasetRecord]) -> None:
    lines = [
        "# Observed Dataset Schemas",
        "",
        "This file lists dataset artifacts discovered in-repo "
        "and observed headers/keys when parseable.",
        "",
    ]
    if not rows:
        lines.append("No datasets found.")
        lines.append("")
    else:
        for r in rows:
            lines.append(f"## {r.path}")
            lines.append(f"- Size (bytes): {r.size_bytes}")
            lines.append(f"- Format: {r.format}")
            lines.append(f"- Schema status: {r.schema_status}")
            if r.header_fields:
                lines.append(f"- Header/keys: {', '.join(r.header_fields)}")
            else:
                lines.append("- Header/keys: none detected")
            lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def _write_inferred(path: Path, rows: List[InferredSchemaRecord]) -> None:
    lines = [
        "# Inferred Schemas With Caveats",
        "",
        "These schemas were inferred from parser/type code "
        "and are best-effort, not guaranteed runtime schemas.",
        "",
    ]
    if not rows:
        lines.append("No TypeScript interfaces found.")
        lines.append("")
    else:
        for r in rows:
            lines.append(f"## {r.interface}")
            lines.append(f"- Source: `{r.file}:{r.line_start}-{r.line_end}`")
            lines.append(f"- Caveat: {r.caveat}")
            if r.fields:
                lines.append("- Fields:")
                for f in r.fields:
                    lines.append(f"  - {f['name']}: {f['type']}")
            else:
                lines.append("- Fields: none extracted")
            lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    schema_dir = REPO_ROOT / "_paperpack" / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)

    # --- collect ---
    datasets = extract_dataset_records()
    sql_tables = parse_sql_tables()
    inferred = parse_typescript_interfaces()

    # --- build merged field catalog ---
    all_fields: Dict[str, Dict[str, object]] = {}

    for ds in datasets:
        if ds.header_fields:
            all_fields[f"dataset::{ds.path}"] = {
                "source": ds.path,
                "source_type": "dataset_header",
                "fields": ds.header_fields,
            }

    for tbl in sql_tables:
        all_fields[f"sql::{tbl.table}"] = {
            "source": f"{tbl.file}:{tbl.line_start}-{tbl.line_end}",
            "source_type": "sql_create_table",
            "fields": [c["name"] for c in tbl.columns],
        }

    for inf in inferred:
        all_fields[f"iface::{inf.interface}"] = {
            "source": f"{inf.file}:{inf.line_start}-{inf.line_end}",
            "source_type": "typescript_interface",
            "fields": [f["name"] for f in inf.fields],
            "caveat": inf.caveat,
        }

    # --- write outputs ---
    _write_datasets_observed(schema_dir / "datasets_observed.md", datasets)
    _write_inferred(schema_dir / "datasets_inferred_with_caveats.md", inferred)

    (schema_dir / "sql_tables_summary.json").write_text(
        json.dumps([asdict(t) for t in sql_tables], indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    (schema_dir / "field_catalog.json").write_text(
        json.dumps(all_fields, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    (schema_dir / "dataset_catalog.json").write_text(
        json.dumps([asdict(d) for d in datasets], indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )

    # --- summary ---
    print(f"Datasets found:         {len(datasets)}")
    print(f"SQL tables found:       {len(sql_tables)}")
    print(f"TS interfaces found:    {len(inferred)}")
    print(f"Field catalog entries:  {len(all_fields)}")
    print(f"Output directory:       {schema_dir}")


if __name__ == "__main__":
    main()
