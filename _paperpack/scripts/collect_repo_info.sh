#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# collect_repo_info.sh
#
# Collects repository inventory and environment versions for a
# "Preprint-Ready Evidence Pack".
#
# Outputs (relative to PACK_DIR):
#   git_info.txt            – branch, commit, status, submodules
#   repo_tree_snapshot.txt  – directory tree (top 3 levels, pruned)
#   key_files.txt           – important config/CI/entrypoint files
#   env/*.txt               – tool & runtime version snapshots
#   language_summary.tsv    – file counts by language extension
#   repo_facts.json         – top-level dirs, language counts, manifests
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACK_DIR}/../.." && pwd)"

mkdir -p "${PACK_DIR}/env" "${PACK_DIR}/logs"
cd "${REPO_ROOT}"

# ---------------------------------------------------------------------------
# Helper: run a command and write output to a file.
# If the command is not found or fails, write a NOT RUN message instead.
# ---------------------------------------------------------------------------
capture_cmd() {
  local outfile="$1"
  shift
  local cmd="$*"

  # Check whether the base executable exists on PATH
  local base_cmd
  base_cmd="$(echo "${cmd}" | awk '{print $1}')"
  if ! command -v "${base_cmd}" &>/dev/null; then
    printf "NOT RUN (command not found: %s)\n" "${base_cmd}" > "${outfile}"
    return 0
  fi

  local output rc
  set +e
  output="$(eval "${cmd}" 2>&1)"
  rc=$?
  set -e

  if [[ ${rc} -eq 0 ]]; then
    printf "%s\n" "${output}" > "${outfile}"
  else
    {
      printf "NOT RUN (rc=%s)\n" "${rc}"
      printf "Command: %s\n" "${cmd}"
      printf "%s\n" "---"
      printf "%s\n" "${output}"
    } > "${outfile}"
  fi
}

# ---------------------------------------------------------------------------
# 1. Git info → git_info.txt
# ---------------------------------------------------------------------------
{
  echo "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'NOT RUN')"
  echo "commit=$(git rev-parse HEAD 2>/dev/null || echo 'NOT RUN')"
  echo ""
  echo "=== submodules ==="
  git submodule status --recursive 2>/dev/null || echo "NOT RUN (no submodules or git error)"
  echo ""
  echo "=== status (short) ==="
  git status --short 2>/dev/null || echo "NOT RUN"
} > "${PACK_DIR}/git_info.txt"

# ---------------------------------------------------------------------------
# 2. Tree snapshot (top 3 levels, excluding build/cache dirs)
#    → repo_tree_snapshot.txt
# ---------------------------------------------------------------------------
find . \
  \( \
    -name node_modules \
    -o -name .git \
    -o -name dist \
    -o -name .next \
    -o -name .turbo \
    -o -name .cache \
    -o -name __pycache__ \
    -o -name .pnpm-store \
  \) -prune -o \
  -mindepth 1 -maxdepth 3 -print \
  | sed 's|^\./||' \
  | sort > "${PACK_DIR}/repo_tree_snapshot.txt"

# ---------------------------------------------------------------------------
# 3. Key files → key_files.txt
# ---------------------------------------------------------------------------
{
  echo "# Key files (docker-compose, Dockerfile, Makefile, README, vercel.json)"
  find . \
    \( -name node_modules -o -name .git -o -name dist -o -name .next -o -name .turbo -o -name .cache -o -name __pycache__ -o -name .pnpm-store \) -prune \
    -o -maxdepth 6 -type f \( \
      -name 'docker-compose*' \
      -o -name 'Dockerfile*' \
      -o -name 'Makefile*' \
      -o -name 'README*' \
      -o -name 'vercel.json' \
    \) -print \
    | sed 's|^\./||' | sort
  echo ""

  echo "# CI workflows (*.yml under .github/workflows)"
  if [[ -d .github/workflows ]]; then
    find .github/workflows -maxdepth 2 -type f \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null \
      | sed 's|^\./||' | sort
  else
    echo "(none found)"
  fi
  echo ""

  echo "# Entrypoint candidates"
  find . \
    \( -name node_modules -o -name .git -o -name dist -o -name .next -o -name .turbo -o -name .cache -o -name __pycache__ -o -name .pnpm-store \) -prune \
    -o -maxdepth 4 -type f \( \
      -name 'main.py' \
      -o -name 'app.py' \
      -o -name 'server.ts' \
      -o -name 'server.js' \
      -o -name 'index.ts' \
      -o -name 'index.js' \
      -o -name 'next.config.*' \
    \) -print \
    | sed 's|^\./||' | sort
} > "${PACK_DIR}/key_files.txt"

# ---------------------------------------------------------------------------
# 4. Environment versions → _paperpack/env/*.txt
# ---------------------------------------------------------------------------
capture_cmd "${PACK_DIR}/env/python_version.txt"  "python3 -V"
capture_cmd "${PACK_DIR}/env/pip_freeze.txt"       "pip freeze"
capture_cmd "${PACK_DIR}/env/node_version.txt"     "node -v"
capture_cmd "${PACK_DIR}/env/npm_list.txt"         "npm list --depth=0"
capture_cmd "${PACK_DIR}/env/pnpm_list.txt"        "pnpm list --depth 0"
capture_cmd "${PACK_DIR}/env/yarn_list.txt"        "yarn list --depth=0"
capture_cmd "${PACK_DIR}/env/rust_version.txt"     "rustc --version"
capture_cmd "${PACK_DIR}/env/cargo_version.txt"    "cargo --version"
capture_cmd "${PACK_DIR}/env/docker_version.txt"   "docker version"

# ---------------------------------------------------------------------------
# 5. Language summary & repo facts via Python
#    → language_summary.tsv + repo_facts.json
# ---------------------------------------------------------------------------
python3 - "${REPO_ROOT}" "${PACK_DIR}" <<'PY'
import json
import pathlib
import sys
from collections import Counter

repo_root = pathlib.Path(sys.argv[1])
pack_dir  = pathlib.Path(sys.argv[2])

EXCLUDE_DIRS = {
    ".git", "node_modules", "dist", ".next", ".turbo",
    ".cache", "__pycache__", ".pnpm-store",
}

EXT_TO_LANG = {
    ".ts":   "TypeScript",
    ".tsx":  "TypeScript",
    ".js":   "JavaScript",
    ".jsx":  "JavaScript",
    ".py":   "Python",
    ".rs":   "Rust",
    ".sql":  "SQL",
    ".sh":   "Shell",
    ".md":   "Markdown",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml":  "YAML",
    ".toml": "TOML",
    ".css":  "CSS",
    ".html": "HTML",
    ".go":   "Go",
}

MANIFEST_NAMES = {
    "package.json",
    "pnpm-workspace.yaml",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "docker-compose.yml",
    "docker-compose.yaml",
    "vercel.json",
    "Makefile",
}

lang_counter = Counter()
manifest_hits = []

for p in repo_root.rglob("*"):
    # Skip excluded directories
    if EXCLUDE_DIRS & set(p.parts):
        continue
    if not p.is_file():
        continue

    lang = EXT_TO_LANG.get(p.suffix.lower())
    if lang:
        lang_counter[lang] += 1

    if p.name in MANIFEST_NAMES:
        manifest_hits.append(str(p.relative_to(repo_root)))

# Write language_summary.tsv
rows = sorted(lang_counter.items(), key=lambda kv: -kv[1])
tsv_lines = ["language\tfile_count"] + [f"{lang}\t{count}" for lang, count in rows]
(pack_dir / "language_summary.tsv").write_text(
    "\n".join(tsv_lines) + "\n", encoding="utf-8"
)

# Write repo_facts.json
top_dirs = sorted(
    p.name for p in repo_root.iterdir()
    if p.is_dir() and p.name not in EXCLUDE_DIRS
)
summary = {
    "top_level_directories": top_dirs,
    "language_counts": dict(rows),
    "manifest_files": sorted(manifest_hits),
}
(pack_dir / "repo_facts.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=True) + "\n", encoding="utf-8"
)
PY

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
printf "collect_repo_info completed at %s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  > "${PACK_DIR}/logs/collect_repo_info.status"
echo "collect_repo_info.sh finished successfully."
