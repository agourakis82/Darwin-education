#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# verify_pack.sh
#
# Checks _paperpack/ completeness for the evidence pack.
#
# Verifies:
#   - All required files exist and are non-empty
#   - schemas/ has at least 1 file
#   - env/ has at least 1 file
#   - Reports pass/fail per file and overall status
#
# Output: _paperpack/logs/verify_pack.log
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACK_DIR}/.." && pwd)"

LOG_DIR="${PACK_DIR}/logs"
LOG_FILE="${LOG_DIR}/verify_pack.log"
mkdir -p "${LOG_DIR}"

# ── Required files (relative to PACK_DIR) ────────────────────────────────────
REQUIRED_FILES=(
  "README.md"
  "repo_inventory.md"
  "architecture_map.md"
  "data_audit.md"
  "safety_pipeline.md"
  "safety_metrics_template.md"
  "repro_capsule.md"
  "benchmarks.md"
  "keyword_hits.csv"
  "run_manifest.json"
  "preprint/preprint.md"
)

pass_count=0
fail_count=0
results=()

# ── Check each required file ─────────────────────────────────────────────────
for rel in "${REQUIRED_FILES[@]}"; do
  fpath="${PACK_DIR}/${rel}"
  if [[ ! -e "${fpath}" ]]; then
    results+=("FAIL  ${rel}  (missing)")
    fail_count=$((fail_count + 1))
  elif [[ ! -s "${fpath}" ]]; then
    results+=("FAIL  ${rel}  (empty)")
    fail_count=$((fail_count + 1))
  else
    results+=("PASS  ${rel}")
    pass_count=$((pass_count + 1))
  fi
done

# ── Check schemas/ has at least 1 file ───────────────────────────────────────
schemas_dir="${PACK_DIR}/schemas"
if [[ -d "${schemas_dir}" ]]; then
  schema_count="$(find "${schemas_dir}" -maxdepth 1 -type f | wc -l)"
  if [[ "${schema_count}" -ge 1 ]]; then
    results+=("PASS  schemas/  (${schema_count} file(s))")
    pass_count=$((pass_count + 1))
  else
    results+=("FAIL  schemas/  (directory exists but empty)")
    fail_count=$((fail_count + 1))
  fi
else
  results+=("FAIL  schemas/  (directory missing)")
  fail_count=$((fail_count + 1))
fi

# ── Check env/ has at least 1 file ───────────────────────────────────────────
env_dir="${PACK_DIR}/env"
if [[ -d "${env_dir}" ]]; then
  env_count="$(find "${env_dir}" -maxdepth 1 -type f | wc -l)"
  if [[ "${env_count}" -ge 1 ]]; then
    results+=("PASS  env/  (${env_count} file(s))")
    pass_count=$((pass_count + 1))
  else
    results+=("FAIL  env/  (directory exists but empty)")
    fail_count=$((fail_count + 1))
  fi
else
  results+=("FAIL  env/  (directory missing)")
  fail_count=$((fail_count + 1))
fi

# ── Determine overall status ─────────────────────────────────────────────────
if [[ "${fail_count}" -eq 0 ]]; then
  overall="PASS"
else
  overall="FAIL"
fi

# ── Write log ────────────────────────────────────────────────────────────────
{
  echo "========================================"
  echo "  verify_pack.sh  —  Evidence Pack Check"
  echo "========================================"
  echo ""
  echo "Pack directory: ${PACK_DIR}"
  echo "Checked at:     $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
  echo "── File checks ──"
  for line in "${results[@]}"; do
    echo "  ${line}"
  done
  echo ""
  echo "── Summary ──"
  echo "  Passed: ${pass_count}"
  echo "  Failed: ${fail_count}"
  echo "  Overall: ${overall}"
  echo ""
} > "${LOG_FILE}"

# Also print to stdout only for interactive runs.
# In batch pipelines, stdout may already be redirected to the same file path.
if [[ -t 1 ]]; then
  cat "${LOG_FILE}"
fi

if [[ "${overall}" == "FAIL" ]]; then
  exit 1
fi
