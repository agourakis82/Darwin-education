#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# benchmark_probe.sh
#
# Discovers test/benchmark scripts in package.json files and .github/workflows,
# checks prerequisites (node >= 20, pnpm available), runs the shared package
# tests if possible, and outputs results as JSON.
#
# Output: _paperpack/benchmark_probe.json
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACK_DIR}/.." && pwd)"

mkdir -p "${PACK_DIR}/logs"
cd "${REPO_ROOT}"

DISCOVERY_FILE="${PACK_DIR}/logs/benchmark_discovery.txt"
RUN_LOG="${PACK_DIR}/logs/benchmark_run.log"
JSON_OUT="${PACK_DIR}/benchmark_probe.json"

# ── Step 1: Discover test/benchmark scripts ──────────────────────────────────
: > "${DISCOVERY_FILE}"
: > "${RUN_LOG}"

{
  echo "# Benchmark / Test Discovery"
  echo "## package.json script hits"
  rg -n -i 'benchmark|latency|throughput|vitest|playwright|test:e2e|"test"' \
    package.json apps/web/package.json packages/shared/package.json 2>/dev/null || true
  echo ""
  echo "## CI workflow hits"
  if [[ -d .github/workflows ]]; then
    rg -n -i 'benchmark|latency|throughput|vitest|playwright|test:e2e|test' \
      .github/workflows/ 2>/dev/null || true
  else
    echo "(no .github/workflows directory)"
  fi
  echo ""
  echo "## test-like files"
  rg --files 2>/dev/null | rg -i '(test|spec|benchmark|playwright)' || true
} > "${DISCOVERY_FILE}"

# ── Step 2: Check prerequisites ──────────────────────────────────────────────
node_version="NOT RUN"
node_major=0
if command -v node >/dev/null 2>&1; then
  node_version="$(node -v 2>/dev/null || true)"
  node_major="$(echo "${node_version}" | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
fi

pnpm_available=false
if command -v pnpm >/dev/null 2>&1; then
  pnpm_available=true
fi

runnable=true
blockers=()

if [[ "${node_version}" == "NOT RUN" ]]; then
  runnable=false
  blockers+=("node_not_found")
elif [[ "${node_major}" -lt 20 ]]; then
  runnable=false
  blockers+=("node_version_lt_20 (detected ${node_version})")
fi

if [[ "${pnpm_available}" != "true" ]]; then
  runnable=false
  blockers+=("pnpm_not_found")
fi

# ── Step 3: Run tests or record blockers ─────────────────────────────────────
run_status="NOT RUN"
run_rc=""
run_seconds=""
run_cmd="pnpm --filter @darwin-education/shared test"

if [[ "${runnable}" == "true" ]]; then
  start_epoch="$(date +%s)"
  set +e
  bash -lc "${run_cmd}" > "${RUN_LOG}" 2>&1
  run_rc=$?
  set -e
  end_epoch="$(date +%s)"
  run_seconds="$((end_epoch - start_epoch))"

  if [[ ${run_rc} -eq 0 ]]; then
    run_status="RUN_OK"
  else
    run_status="RUN_FAILED"
  fi
else
  {
    echo "NOT RUN — prerequisites not met"
    echo "Command: ${run_cmd}"
    echo "Blockers: ${blockers[*]}"
    echo "Detected node: ${node_version}"
    echo "Detected pnpm_available: ${pnpm_available}"
  } > "${RUN_LOG}"
fi

# ── Step 4: Emit JSON ────────────────────────────────────────────────────────
python3 - "${JSON_OUT}" "${DISCOVERY_FILE}" "${RUN_LOG}" \
  "${node_version}" "${pnpm_available}" "${run_status}" "${run_cmd}" \
  "${run_rc}" "${run_seconds}" "${runnable}" "${blockers[*]}" <<'PY'
import json
import pathlib
import sys
from datetime import datetime, timezone

json_out        = pathlib.Path(sys.argv[1])
discovery       = pathlib.Path(sys.argv[2])
run_log         = pathlib.Path(sys.argv[3])
node_version    = sys.argv[4]
pnpm_available  = sys.argv[5].lower() == "true"
run_status      = sys.argv[6]
run_cmd         = sys.argv[7]
run_rc          = int(sys.argv[8]) if sys.argv[8] else None
run_seconds     = int(sys.argv[9]) if sys.argv[9] else None
runnable        = sys.argv[10].lower() == "true"
blockers        = [b for b in sys.argv[11].split() if b]

payload = {
    "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "prerequisites": {
        "node_version": node_version,
        "pnpm_available": pnpm_available,
        "runnable": runnable,
    },
    "benchmark_probe": {
        "status": run_status,
        "command": run_cmd,
        "exit_code": run_rc,
        "duration_seconds": run_seconds,
        "log_file": str(run_log),
        "discovery_file": str(discovery),
        "blockers": blockers,
        "token_cost_proxy": "NOT FOUND",
        "throughput": "NOT FOUND",
        "failure_rate": "NOT FOUND",
    },
}

json_out.write_text(
    json.dumps(payload, indent=2, ensure_ascii=True) + "\n",
    encoding="utf-8",
)
PY
