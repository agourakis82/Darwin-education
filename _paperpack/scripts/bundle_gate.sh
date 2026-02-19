#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACK_DIR="${ROOT_DIR}/_paperpack"
LOG_FILE="${PACK_DIR}/logs/bundle_gate.log"
BUNDLE_DIR="${ROOT_DIR}/submission_bundle/preprint-v0.3.1"
TARBALL="${ROOT_DIR}/submission_bundle/preprint-v0.3.1.tar.gz"
TARBALL_SHA="${TARBALL}.sha256"

mkdir -p "${PACK_DIR}/logs"
exec > >(tee "${LOG_FILE}") 2>&1

echo "[bundle_gate] start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

required_files=(
  "${PACK_DIR}/preprint/preprint.pdf"
  "${BUNDLE_DIR}/preprint.md"
  "${BUNDLE_DIR}/preprint.pdf"
  "${BUNDLE_DIR}/SHA256SUMS.txt"
  "${BUNDLE_DIR}/v0.3.1_release_2026-02-10T09-16-37Z_manifest.json"
  "${BUNDLE_DIR}/v0.3.1_release_addendum_doi.md"
  "${BUNDLE_DIR}/darwin_mfc_runtime_counts.json"
  "${TARBALL}"
  "${TARBALL_SHA}"
)

for f in "${required_files[@]}"; do
  if [[ ! -f "${f}" ]]; then
    echo "[bundle_gate] FAIL missing file: ${f}" >&2
    exit 1
  fi
done

if ! grep -q "preprint.pdf" "${BUNDLE_DIR}/SHA256SUMS.txt"; then
  echo "[bundle_gate] FAIL preprint.pdf missing from SHA256SUMS.txt" >&2
  exit 1
fi

if [[ $(find "${BUNDLE_DIR}" -maxdepth 1 -name "*.log" | wc -l | tr -d ' ') -eq 0 ]]; then
  echo "[bundle_gate] FAIL no logs found in bundle directory" >&2
  exit 1
fi

echo "[bundle_gate] PASS all required bundle artifacts present"
echo "[bundle_gate] done: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
