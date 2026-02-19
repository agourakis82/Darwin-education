#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# run_all.sh
#
# Orchestrator for the _paperpack evidence pack generation.
#
# Runs steps in order:
#   1. collect_repo_info.sh
#   2. find_artifacts.py
#   3. extract_schemas.py
#   4. benchmark_probe.sh
#   5. generate_reports.py
#   6. run_darwin_mfc_runtime_counts.sh
#   7. verify_pack.sh
#   8. ci_gate.sh
#
# Each step is logged to _paperpack/logs/{name}.log with status tracking.
# Produces:
#   - _paperpack/logs/step_status.tsv  (step results table)
#   - _paperpack/run_manifest.json     (full run manifest with git info)
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACK_DIR}/.." && pwd)"

# ── Create required directories ──────────────────────────────────────────────
mkdir -p \
  "${PACK_DIR}/logs" \
  "${PACK_DIR}/env" \
  "${PACK_DIR}/schemas" \
  "${PACK_DIR}/preprint/figures" \
  "${PACK_DIR}/preprint/tables"

# ── Initialise step_status.tsv ───────────────────────────────────────────────
STATUS_TSV="${PACK_DIR}/logs/step_status.tsv"
printf "step\tstatus\trc\tstarted_utc\tended_utc\tlog_file\tcommand\n" > "${STATUS_TSV}"

# ── run_step: execute a command, log output, record status ───────────────────
run_step() {
  local name="$1"
  local cmd="$2"
  local log_file="${PACK_DIR}/logs/${name}.log"
  local started ended rc status cmd_clean

  started="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  set +e
  bash -lc "${cmd}" >"${log_file}" 2>&1
  rc=$?
  set -e
  ended="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [[ ${rc} -eq 0 ]]; then
    status="ok"
  else
    status="failed"
  fi

  # Sanitise tabs in command string for TSV safety
  cmd_clean="${cmd//$'\t'/ }"
  printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
    "${name}" "${status}" "${rc}" "${started}" "${ended}" "${log_file}" "${cmd_clean}" \
    >> "${STATUS_TSV}"

  printf "[%s] %s (rc=%s)\n" "${status}" "${name}" "${rc}"
}

# ── Execute pipeline steps in order ──────────────────────────────────────────
run_step "collect_repo_info" \
  "bash '${SCRIPT_DIR}/collect_repo_info.sh'"

run_step "find_artifacts" \
  "python3 '${SCRIPT_DIR}/find_artifacts.py' --out-csv '${PACK_DIR}/keyword_hits.csv' --out-json '${PACK_DIR}/keyword_hits.json'"

run_step "extract_schemas" \
  "python3 '${SCRIPT_DIR}/extract_schemas.py'"

run_step "benchmark_probe" \
  "bash '${SCRIPT_DIR}/benchmark_probe.sh'"

run_step "generate_reports" \
  "python3 '${SCRIPT_DIR}/generate_reports.py'"

run_step "darwin_mfc_runtime_counts" \
  "bash '${SCRIPT_DIR}/run_darwin_mfc_runtime_counts.sh'"

run_step "verify_pack" \
  "bash '${SCRIPT_DIR}/verify_pack.sh'"

run_step "ci_gate" \
  "bash '${SCRIPT_DIR}/ci_gate.sh'"

# ── Generate run_manifest.json via inline Python ─────────────────────────────
python3 - "${STATUS_TSV}" "${PACK_DIR}/run_manifest.json" "${REPO_ROOT}" "${PACK_DIR}" <<'PY'
import csv
import json
import pathlib
import subprocess
import sys
from datetime import datetime, timezone

status_tsv    = pathlib.Path(sys.argv[1])
manifest_path = pathlib.Path(sys.argv[2])
repo_root     = pathlib.Path(sys.argv[3])
pack_dir      = pathlib.Path(sys.argv[4])


def run(cmd):
    """Run a shell command and return its stdout, or a NOT RUN message."""
    try:
        out = subprocess.check_output(
            cmd, cwd=repo_root, stderr=subprocess.STDOUT, text=True
        )
        return out.strip()
    except Exception as exc:
        return f"NOT RUN: {exc}"


# Parse step_status.tsv
steps = []
with status_tsv.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    for row in reader:
        steps.append(row)

overall_status = (
    "success" if all(s["status"] == "ok" for s in steps) else "partial_failure"
)

# Gather git info
git_status = run(["git", "status", "--short"])
submodules = run(["git", "submodule", "status", "--recursive"])

manifest = {
    "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": str(repo_root),
    "pack_dir": str(pack_dir),
    "git": {
        "branch": run(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
        "commit": run(["git", "rev-parse", "HEAD"]),
        "status_short": git_status,
        "submodules": (
            [line for line in submodules.splitlines() if line.strip()]
            if not submodules.startswith("NOT RUN")
            else submodules
        ),
    },
    "env_files": {
        p.name: str(p)
        for p in sorted((pack_dir / "env").glob("*.txt"))
    },
    "steps": steps,
    "overall_status": overall_status,
}

manifest_path.write_text(
    json.dumps(manifest, indent=2, ensure_ascii=True) + "\n",
    encoding="utf-8",
)
PY

# ── Final output ─────────────────────────────────────────────────────────────
if [[ -f "${PACK_DIR}/logs/verify_pack.log" ]]; then
  echo ""
  echo "Verification log: ${PACK_DIR}/logs/verify_pack.log"
fi

echo "Step status TSV:  ${STATUS_TSV}"
echo "Manifest written: ${PACK_DIR}/run_manifest.json"
