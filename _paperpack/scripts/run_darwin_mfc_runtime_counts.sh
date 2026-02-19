#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACK_DIR}/.." && pwd)"
DERIVED_DIR="${PACK_DIR}/derived"

mkdir -p "${DERIVED_DIR}"

SCRIPT_TS="${SCRIPT_DIR}/darwin_mfc_runtime_counts.ts"
LOG_FILE="${DERIVED_DIR}/darwin_mfc_runtime_log.txt"

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if (( NODE_MAJOR < 20 )); then
  echo "Node 20+ is required. Found: $(node -v)" >&2
  exit 1
fi

choose_runner() {
  if command -v tsx >/dev/null 2>&1; then
    echo "tsx"
    return
  fi

  if [[ -x "${REPO_ROOT}/node_modules/.bin/tsx" ]]; then
    echo "${REPO_ROOT}/node_modules/.bin/tsx"
    return
  fi

  if [[ -x "${REPO_ROOT}/darwin-MFC/node_modules/.bin/tsx" ]]; then
    echo "${REPO_ROOT}/darwin-MFC/node_modules/.bin/tsx"
    return
  fi

  if command -v ts-node >/dev/null 2>&1; then
    echo "ts-node"
    return
  fi

  if [[ -x "${REPO_ROOT}/node_modules/.bin/ts-node" ]]; then
    echo "${REPO_ROOT}/node_modules/.bin/ts-node"
    return
  fi

  if [[ -x "${REPO_ROOT}/darwin-MFC/node_modules/.bin/ts-node" ]]; then
    echo "${REPO_ROOT}/darwin-MFC/node_modules/.bin/ts-node"
    return
  fi

  local tools_dir="${SCRIPT_DIR}/.runtime-tools"
  mkdir -p "${tools_dir}"

  if [[ ! -f "${tools_dir}/package.json" ]]; then
    cat > "${tools_dir}/package.json" <<'JSON'
{
  "name": "paperpack-runtime-tools",
  "private": true
}
JSON
  fi

  npm install \
    --prefix "${tools_dir}" \
    --no-audit \
    --no-fund \
    --save-dev \
    tsx >/dev/null

  echo "${tools_dir}/node_modules/.bin/tsx"
}

RUNNER="$(choose_runner)"

declare -a CMD
if [[ "${RUNNER}" == "tsx" ]]; then
  CMD=("pnpm" "exec" "tsx" "${SCRIPT_TS}")
elif [[ "${RUNNER}" == "ts-node" ]]; then
  CMD=("ts-node" "--transpile-only" "${SCRIPT_TS}")
elif [[ "${RUNNER}" == */tsx ]]; then
  CMD=("${RUNNER}" "${SCRIPT_TS}")
else
  CMD=("${RUNNER}" "--transpile-only" "${SCRIPT_TS}")
fi

CMD_DISPLAY="$(printf "%q " "${CMD[@]}")"

{
  echo "timestamp_utc: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "cwd: ${REPO_ROOT}"
  echo "command: ${CMD_DISPLAY% }"
  echo ""
  (
    cd "${REPO_ROOT}"
    "${CMD[@]}"
  )
} 2>&1 | tee "${LOG_FILE}"
