#!/usr/bin/env bash
set -euo pipefail

# Darwin Education — Release script v0.3.1
# Runs full reproducibility pipeline + integrity gate + tests.
# Fails fast on first error and writes a release manifest.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PAPERPACK_DIR="${ROOT_DIR}/_paperpack"
LOG_DIR="${PAPERPACK_DIR}/logs"
DERIVED_DIR="${PAPERPACK_DIR}/derived"
PREPRINT_DIR="${PAPERPACK_DIR}/preprint"

mkdir -p "${LOG_DIR}" "${DERIVED_DIR}"

TS_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
RUN_ID="v0.3.1_release_${TS_UTC//[:]/-}"
MANIFEST="${DERIVED_DIR}/${RUN_ID}_manifest.json"

log() { printf "[%s] %s\n" "$(date -u +"%H:%M:%S")" "$*"; }

run_and_log() {
  local name="$1"; shift
  local logfile="${LOG_DIR}/${RUN_ID}_${name}.log"
  log "==> ${name}: $*"
  {
    echo "timestamp_utc=${TS_UTC}"
    echo "cmd=$*"
    echo
    "$@"
  } > >(tee "${logfile}") 2> >(tee -a "${logfile}" >&2)
  log "==> ${name}: OK (log: ${logfile})"
}

git_meta() {
  (cd "${ROOT_DIR}" && git rev-parse HEAD) 2>/dev/null || echo "NOT_AVAILABLE"
}

submodule_meta() {
  (cd "${ROOT_DIR}" && git submodule status darwin-MFC | awk '{print $1}' | sed 's/^[+-]//') 2>/dev/null || echo "NOT_AVAILABLE"
}

sha256_file() {
  # macOS uses shasum; Linux has sha256sum; support both.
  local f="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$f" | awk '{print $1}'
  else
    shasum -a 256 "$f" | awk '{print $1}'
  fi
}

# --- Pre-flight sanity checks
log "Release pipeline started: ${RUN_ID}"
log "Repo: ${ROOT_DIR}"

if [[ ! -d "${PAPERPACK_DIR}" ]]; then
  echo "ERROR: _paperpack/ not found. Run Codex pipeline first." >&2
  exit 1
fi

if [[ ! -f "${PREPRINT_DIR}/preprint.md" ]]; then
  echo "ERROR: preprint.md not found under _paperpack/preprint/." >&2
  exit 1
fi

# --- 1) Ensure darwin-MFC deps are installed reproducibly (avoids the earlier fuse.js issue)
# Note: npm ci requires lockfile consistency. If lockfile is absent, fallback to npm install.
if [[ -f "${ROOT_DIR}/darwin-MFC/package-lock.json" ]]; then
  run_and_log "npm_ci_darwin_mfc" npm --prefix "${ROOT_DIR}/darwin-MFC" ci
else
  run_and_log "npm_install_darwin_mfc" npm --prefix "${ROOT_DIR}/darwin-MFC" install
fi

# --- 2) Evidence pack regeneration (includes ci_gate at final step per v0.3.1)
run_and_log "run_all" bash "${PAPERPACK_DIR}/scripts/run_all.sh"

# --- 3) Verify pack
run_and_log "verify_pack" bash "${PAPERPACK_DIR}/scripts/verify_pack.sh"

# --- 4) Integrity gate (redundant if run_all already calls it, but we keep it explicit for release semantics)
run_and_log "ci_gate" bash "${PAPERPACK_DIR}/scripts/ci_gate.sh"

# --- 5) Tests
run_and_log "tests_shared" pnpm --filter @darwin-education/shared test
run_and_log "tests_darwin_mfc" pnpm --dir "${ROOT_DIR}/darwin-MFC" test

# --- 6) Write release manifest
REPO_COMMIT="$(git_meta)"
SUBMODULE_COMMIT="$(submodule_meta)"
PREPRINT_SHA="$(sha256_file "${PREPRINT_DIR}/preprint.md")"
BENCH_SHA="NOT_AVAILABLE"
[[ -f "${PAPERPACK_DIR}/benchmarks.md" ]] && BENCH_SHA="$(sha256_file "${PAPERPACK_DIR}/benchmarks.md")"

RUNTIME_COUNTS_PATH="${DERIVED_DIR}/darwin_mfc_runtime_counts.json"
RUNTIME_COUNTS_SHA="NOT_AVAILABLE"
if [[ -f "${RUNTIME_COUNTS_PATH}" ]]; then
  RUNTIME_COUNTS_SHA="$(sha256_file "${RUNTIME_COUNTS_PATH}")"
fi

cat > "${MANIFEST}" <<JSON
{
  "release_id": "${RUN_ID}",
  "timestamp_utc": "${TS_UTC}",
  "repo_commit": "${REPO_COMMIT}",
  "submodule_commit": "${SUBMODULE_COMMIT}",
  "artifacts": {
    "preprint_md": {
      "path": "_paperpack/preprint/preprint.md",
      "sha256": "${PREPRINT_SHA}"
    },
    "benchmarks_md": {
      "path": "_paperpack/benchmarks.md",
      "sha256": "${BENCH_SHA}"
    },
    "darwin_mfc_runtime_counts": {
      "path": "_paperpack/derived/darwin_mfc_runtime_counts.json",
      "sha256": "${RUNTIME_COUNTS_SHA}"
    }
  },
  "checks": {
    "run_all": "PASS",
    "verify_pack": "PASS",
    "ci_gate": "PASS",
    "tests_shared": "PASS",
    "tests_darwin_mfc": "PASS"
  },
  "notes": [
    "This manifest does not include any DOI. Insert Zenodo DOI after deposit.",
    "Release should be tagged in git and archived on Zenodo with the evidence pack."
  ]
}
JSON

log "Release pipeline completed: PASS"
log "Manifest written: ${MANIFEST}"
log "Next recommended steps:"
log "  1) git status && git diff"
log "  2) git tag preprint-v0.3.1 && git push --tags"
log "  3) Create GitHub release for the tag, attach _paperpack/ (zip)"
log "  4) Deposit on Zenodo and paste DOI into preprint + README"
