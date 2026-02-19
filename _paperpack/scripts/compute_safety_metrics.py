#!/usr/bin/env python3
"""Compute safety metrics for review datasets.

Metrics produced:
  (a) Auto-approval rate with 95% Wilson confidence interval
  (b) Failure-mode taxonomy prevalence from failure_mode column
  (c) Sensitivity / specificity for clinically dangerous errors (pred vs gold)

Column detection is flexible: each metric tries multiple name variants so the
script works across different CSV layouts.

If no --input file is provided, the script generates a template CSV and
placeholder outputs with instructions.

Usage:
  python compute_safety_metrics.py --input reviews.csv --out-dir _paperpack
  python compute_safety_metrics.py --out-dir _paperpack  # template mode
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable, List, Optional


# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_bool(value: str) -> Optional[int]:
    """Parse a string into a binary int (1/0) or None if unrecognised."""
    if value is None:
        return None
    s = str(value).strip().lower()
    if s in {"1", "true", "yes", "y", "approved", "dangerous", "auto"}:
        return 1
    if s in {"0", "false", "no", "n", "rejected", "safe", "manual"}:
        return 0
    return None


def wilson_ci(k: int, n: int, z: float = 1.96):
    """Wilson score interval for a binomial proportion."""
    if n <= 0:
        return (None, None, None)
    p = k / n
    denom = 1 + (z * z) / n
    center = (p + (z * z) / (2 * n)) / denom
    margin = (z / denom) * math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
    return (p, max(0.0, center - margin), min(1.0, center + margin))


def choose_column(fieldnames: Iterable[str], candidates: List[str]) -> Optional[str]:
    """Return the first matching column name (case-insensitive) or None."""
    names = {f.lower(): f for f in fieldnames}
    for c in candidates:
        if c.lower() in names:
            return names[c.lower()]
    return None


# ── Core computation ─────────────────────────────────────────────────────────

def compute(rows: List[Dict[str, str]]) -> dict:
    """Compute all safety metrics from a list of CSV row dicts."""
    if not rows:
        return {
            "n": 0,
            "auto_approval": "NOT FOUND",
            "taxonomy_prevalence": "NOT FOUND",
            "sens_spec": "NOT FOUND",
        }

    fieldnames = list(rows[0].keys())

    # Flexible column detection — try multiple name variants for each metric
    auto_col = choose_column(fieldnames, [
        "auto_approved", "auto_approval", "autoapprove",
        "is_auto_approved", "approval_mode_auto",
    ])
    fail_col = choose_column(fieldnames, [
        "failure_mode", "failure_taxonomy", "error_type", "danger_mode",
    ])
    pred_col = choose_column(fieldnames, [
        "model_dangerous_pred", "predicted_dangerous",
        "is_dangerous_pred", "dangerous_prediction",
    ])
    gold_col = choose_column(fieldnames, [
        "expert_dangerous_label", "gold_dangerous",
        "clinically_dangerous", "expert_label_dangerous",
    ])

    n = len(rows)

    # ── (a) Auto-approval rate with Wilson CI ────────────────────────────────
    auto_k = 0
    auto_n = 0
    if auto_col:
        for r in rows:
            b = parse_bool(r.get(auto_col, ""))
            if b is not None:
                auto_n += 1
                auto_k += b

    auto_result: object = "NOT FOUND"
    if auto_n > 0:
        p, lo, hi = wilson_ci(auto_k, auto_n)
        auto_result = {
            "k": auto_k,
            "n": auto_n,
            "rate": p,
            "wilson_95_ci": [lo, hi],
        }

    # ── (b) Failure-mode taxonomy prevalence ─────────────────────────────────
    failure_counter: Counter = Counter()
    if fail_col:
        for r in rows:
            label = (r.get(fail_col) or "").strip() or "UNSPECIFIED"
            failure_counter[label] += 1

    taxonomy_result: object = "NOT FOUND"
    if failure_counter:
        taxonomy_result = [
            {
                "failure_mode": label,
                "count": count,
                "prevalence": count / n,
            }
            for label, count in failure_counter.most_common()
        ]

    # ── (c) Sensitivity / specificity for clinically dangerous errors ────────
    tp = fp = tn = fn = 0
    pair_n = 0
    if pred_col and gold_col:
        for r in rows:
            pred = parse_bool(r.get(pred_col, ""))
            gold = parse_bool(r.get(gold_col, ""))
            if pred is None or gold is None:
                continue
            pair_n += 1
            if pred == 1 and gold == 1:
                tp += 1
            elif pred == 1 and gold == 0:
                fp += 1
            elif pred == 0 and gold == 0:
                tn += 1
            elif pred == 0 and gold == 1:
                fn += 1

    sens_spec_result: object = "NOT FOUND"
    if pair_n > 0:
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else None
        specificity = tn / (tn + fp) if (tn + fp) > 0 else None
        sens_spec_result = {
            "n_pairs": pair_n,
            "tp": tp,
            "fp": fp,
            "tn": tn,
            "fn": fn,
            "sensitivity": sensitivity,
            "specificity": specificity,
        }

    return {
        "n": n,
        "detected_columns": {
            "auto_col": auto_col,
            "failure_mode_col": fail_col,
            "predicted_dangerous_col": pred_col,
            "expert_dangerous_col": gold_col,
        },
        "auto_approval": auto_result,
        "taxonomy_prevalence": taxonomy_result,
        "sens_spec": sens_spec_result,
    }


# ── Output writers ───────────────────────────────────────────────────────────

def write_markdown(path: Path, result: dict) -> None:
    """Write a human-readable Markdown summary of the safety metrics."""
    lines = ["# Safety Metrics Results", ""]
    lines.append(f"- Total rows: {result.get('n', 'NOT FOUND')}")
    lines.append("")

    # Auto-approval
    lines.append("## Auto-Approval Rate (Wilson 95% CI)")
    auto = result.get("auto_approval")
    if isinstance(auto, dict):
        lines.append(f"- k/n: {auto['k']}/{auto['n']}")
        lines.append(f"- Rate: {auto['rate']:.6f}")
        lines.append(
            f"- Wilson 95% CI: [{auto['wilson_95_ci'][0]:.6f}, "
            f"{auto['wilson_95_ci'][1]:.6f}]"
        )
    else:
        lines.append("- NOT FOUND")
    lines.append("")

    # Taxonomy
    lines.append("## Failure-Mode Taxonomy Prevalence")
    taxonomy = result.get("taxonomy_prevalence")
    if isinstance(taxonomy, list):
        for row in taxonomy:
            lines.append(
                f"- {row['failure_mode']}: count={row['count']}, "
                f"prevalence={row['prevalence']:.6f}"
            )
    else:
        lines.append("- NOT FOUND")
    lines.append("")

    # Sensitivity / Specificity
    lines.append("## Sensitivity / Specificity for Clinically Dangerous Errors")
    ss = result.get("sens_spec")
    if isinstance(ss, dict):
        lines.append(f"- n_pairs: {ss['n_pairs']}")
        lines.append(
            f"- confusion_matrix: TP={ss['tp']}, FP={ss['fp']}, "
            f"TN={ss['tn']}, FN={ss['fn']}"
        )
        if ss["sensitivity"] is None:
            lines.append("- sensitivity: NOT FOUND (no positive gold labels)")
        else:
            lines.append(f"- sensitivity: {ss['sensitivity']:.6f}")
        if ss["specificity"] is None:
            lines.append("- specificity: NOT FOUND (no negative gold labels)")
        else:
            lines.append(f"- specificity: {ss['specificity']:.6f}")
    else:
        lines.append("- NOT FOUND")
    lines.append("")

    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_template_csv(path: Path) -> None:
    """Write a template CSV showing the expected column layout."""
    headers = [
        "sample_id",
        "auto_approved",
        "failure_mode",
        "model_dangerous_pred",
        "expert_dangerous_label",
    ]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(headers)
        writer.writerow(["example-001", "1", "none", "0", "0"])


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compute safety metrics from a review outcomes CSV."
    )
    parser.add_argument(
        "--input",
        help="Path to CSV file with review outcomes. "
             "If omitted, generates template output with instructions.",
        default=None,
    )
    parser.add_argument(
        "--out-dir",
        default="_paperpack",
        help="Directory for output files (default: _paperpack).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    out_dir = (repo_root / args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    # Always emit a template CSV so reviewers know the expected format
    template_csv = out_dir / "safety_metrics_inputs_template.csv"
    write_template_csv(template_csv)

    # Default result when no input is provided
    result: dict = {
        "n": 0,
        "auto_approval": "NOT FOUND",
        "taxonomy_prevalence": "NOT FOUND",
        "sens_spec": "NOT FOUND",
        "detected_columns": {},
        "note": (
            "NOT RUN: No --input CSV provided. "
            "Supply a review outcomes CSV with columns such as: "
            "auto_approved, failure_mode, model_dangerous_pred, "
            "expert_dangerous_label. "
            "See safety_metrics_inputs_template.csv for the expected format."
        ),
    }

    if args.input:
        csv_path = Path(args.input)
        if not csv_path.is_absolute():
            csv_path = (repo_root / csv_path).resolve()
        if csv_path.exists():
            with csv_path.open("r", encoding="utf-8", errors="replace") as fh:
                rows = list(csv.DictReader(fh))
            result = compute(rows)
            result["note"] = f"Computed from {csv_path}"
        else:
            result["note"] = f"NOT FOUND: input file does not exist: {csv_path}"

    # Write outputs
    json_out = out_dir / "safety_metrics.json"
    md_out = out_dir / "safety_metrics.md"
    json_out.write_text(
        json.dumps(result, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(md_out, result)

    print(f"Safety metrics JSON: {json_out}")
    print(f"Safety metrics MD:   {md_out}")
    print(f"Template CSV:        {template_csv}")


if __name__ == "__main__":
    main()
