#!/usr/bin/env python3
"""Manuscript integrity gate for preprint v0.3.x."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def fail(msg: str) -> None:
    print(f"[FAIL] {msg}")


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    manuscript = repo_root / "_paperpack" / "preprint" / "preprint.md"
    runtime_json = repo_root / "_paperpack" / "derived" / "darwin_mfc_runtime_counts.json"

    if not manuscript.exists():
        fail(f"Manuscript not found: {manuscript}")
        return 1
    if not runtime_json.exists():
        fail(f"Runtime JSON not found: {runtime_json}")
        return 1

    text = load_text(manuscript)
    lines = text.splitlines()
    lowered = [line.lower() for line in lines]
    errors: list[str] = []

    with runtime_json.open("r", encoding="utf-8") as fh:
        runtime = json.load(fh)

    d_raw = runtime["diseases"]["raw_count"]
    d_unique = runtime["diseases"]["unique_count_by_id"]
    m_raw = runtime["medications"]["raw_count"]
    m_unique = runtime["medications"]["unique_count_by_id"]

    disease_claim = re.compile(
        rf"diseases[^\n]{{0,120}}raw\s*=\s*{d_raw}[^\n]{{0,120}}unique\s*=\s*{d_unique}",
        re.IGNORECASE,
    )
    med_claim = re.compile(
        rf"medications[^\n]{{0,120}}raw\s*=\s*{m_raw}[^\n]{{0,120}}unique\s*=\s*{m_unique}",
        re.IGNORECASE,
    )

    if disease_claim.search(text):
        ok(f"Manuscript contains runtime disease counts raw={d_raw}, unique={d_unique}")
    else:
        errors.append(
            f"Missing/incorrect disease runtime count expression for raw={d_raw}, unique={d_unique}"
        )

    if med_claim.search(text):
        ok(f"Manuscript contains runtime medication counts raw={m_raw}, unique={m_unique}")
    else:
        errors.append(
            f"Missing/incorrect medication runtime count expression for raw={m_raw}, unique={m_unique}"
        )

    unqualified_context_tokens = ("legacy", "historical", "target", "not yet computed")

    for idx, line in enumerate(lines, start=1):
        line_lower = lowered[idx - 1]

        if re.search(r"\b429\b", line):
            errors.append(f"Forbidden stale number 429 in manuscript line {idx}")

        if re.search(r"\b604\b", line):
            errors.append(f"Forbidden stale number 604 in manuscript line {idx}")

        if re.search(r"\b368\b", line) or re.search(r"\b690\b", line):
            if not any(tok in line_lower for tok in unqualified_context_tokens):
                errors.append(
                    f"Found 368/690 without legacy/target/NOT YET COMPUTED qualifier in line {idx}"
                )

        if "95% ci across specialties" in line_lower:
            if not any(tok in line_lower for tok in unqualified_context_tokens):
                errors.append(f'Unqualified phrase "95% CI across specialties" in line {idx}')

        if "pearson r > 0.95" in line_lower:
            if not any(tok in line_lower for tok in unqualified_context_tokens):
                errors.append(f'Unqualified phrase "Pearson r > 0.95" in line {idx}')

    if errors:
        for err in errors:
            fail(err)
        return 1

    ok("No forbidden stale numbers or unqualified phrases found in manuscript")
    return 0


if __name__ == "__main__":
    sys.exit(main())
