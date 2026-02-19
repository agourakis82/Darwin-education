#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACK_DIR="${ROOT_DIR}/_paperpack"
LOG_FILE="${PACK_DIR}/logs/build_submission_bundle.log"
BUNDLE_ROOT="${ROOT_DIR}/submission_bundle"
BUNDLE_DIR="${BUNDLE_ROOT}/preprint-v0.3.1"
TARBALL="${BUNDLE_ROOT}/preprint-v0.3.1.tar.gz"
TARBALL_SHA="${TARBALL}.sha256"

mkdir -p "${PACK_DIR}/logs" "${BUNDLE_DIR}"
exec > >(tee "${LOG_FILE}") 2>&1

echo "[build_submission_bundle] start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

PREPRINT_MD="${PACK_DIR}/preprint/preprint.md"
PREPRINT_PDF="${PACK_DIR}/preprint/preprint.pdf"
ADDENDUM="${PACK_DIR}/derived/v0.3.1_release_addendum_doi.md"
COUNTS_JSON="${PACK_DIR}/derived/darwin_mfc_runtime_counts.json"
BENCH="${PACK_DIR}/benchmarks.md"

MANIFEST="$(ls -1 "${PACK_DIR}/derived"/v0.3.1_release_*_manifest.json | head -n 1)"
if [[ -z "${MANIFEST}" ]]; then
  echo "[build_submission_bundle] ERROR: missing v0.3.1 release manifest" >&2
  exit 1
fi

for req in "${PREPRINT_MD}" "${PREPRINT_PDF}" "${ADDENDUM}" "${COUNTS_JSON}" "${BENCH}" "${MANIFEST}"; do
  if [[ ! -f "${req}" ]]; then
    echo "[build_submission_bundle] ERROR: missing required file ${req}" >&2
    exit 1
  fi
done

rm -rf "${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}"

cp "${PREPRINT_MD}" "${BUNDLE_DIR}/"
cp "${PREPRINT_PDF}" "${BUNDLE_DIR}/"
cp "${MANIFEST}" "${BUNDLE_DIR}/"
cp "${ADDENDUM}" "${BUNDLE_DIR}/"
cp "${COUNTS_JSON}" "${BUNDLE_DIR}/"
cp "${BENCH}" "${BUNDLE_DIR}/"

shopt -s nullglob
release_logs=( "${PACK_DIR}"/logs/v0.3.1_release_2026-02-10T09-16-37Z_*.log )
run_logs=( "${PACK_DIR}"/logs/v0.3.1_*.log )
for f in "${release_logs[@]}" "${run_logs[@]}"; do
  cp "${f}" "${BUNDLE_DIR}/"
done
shopt -u nullglob

if [[ $(find "${BUNDLE_DIR}" -maxdepth 1 -name "*.log" | wc -l | tr -d ' ') -eq 0 ]]; then
  echo "[build_submission_bundle] ERROR: no logs copied into bundle" >&2
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${BUNDLE_DIR}" && find . -maxdepth 1 -type f ! -name "SHA256SUMS.txt" -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS.txt)
else
  (cd "${BUNDLE_DIR}" && find . -maxdepth 1 -type f ! -name "SHA256SUMS.txt" -print0 | sort -z | xargs -0 shasum -a 256 > SHA256SUMS.txt)
fi

rm -f "${TARBALL}" "${TARBALL_SHA}"
tar -czf "${TARBALL}" -C "${BUNDLE_ROOT}" "preprint-v0.3.1"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${TARBALL}" > "${TARBALL_SHA}"
else
  shasum -a 256 "${TARBALL}" > "${TARBALL_SHA}"
fi

echo "[build_submission_bundle] bundle dir: ${BUNDLE_DIR}"
echo "[build_submission_bundle] tarball: ${TARBALL}"
echo "[build_submission_bundle] sha256: ${TARBALL_SHA}"
echo "[build_submission_bundle] done: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
