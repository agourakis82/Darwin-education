#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACK_DIR="${ROOT_DIR}/_paperpack"
PREPRINT_DIR="${PACK_DIR}/preprint"
FIGURES_DIR="${PREPRINT_DIR}/figures"
LOG_FILE="${PACK_DIR}/logs/build_preprint_pdf.log"

mkdir -p "${PACK_DIR}/logs" "${FIGURES_DIR}"

# Support user-local installs (no sudo).
export PATH="${HOME}/.local/bin:${PATH}"

exec > >(tee "${LOG_FILE}") 2>&1

echo "[build_preprint_pdf] start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

SRC_MD="${PREPRINT_DIR}/preprint.md"
OUT_PDF="${PREPRINT_DIR}/preprint.pdf"
TMP_MD="${PREPRINT_DIR}/preprint._pdf_build.md"
MMD_SRC="${FIGURES_DIR}/architecture.mmd"
MMD_OUT="${FIGURES_DIR}/architecture.svg"

if [[ ! -f "${SRC_MD}" ]]; then
  echo "[build_preprint_pdf] ERROR: missing ${SRC_MD}" >&2
  exit 1
fi

# Mermaid rendering (best effort)
if [[ -f "${MMD_SRC}" ]] && command -v mmdc >/dev/null 2>&1; then
  echo "[build_preprint_pdf] rendering Mermaid diagram with mmdc"
  mmdc -i "${MMD_SRC}" -o "${MMD_OUT}" -b transparent
else
  echo "[build_preprint_pdf] Mermaid render skipped (mmdc not available or source missing)"
fi

# Prefer pandoc when available.
if command -v pandoc >/dev/null 2>&1; then
  echo "[build_preprint_pdf] pandoc detected"
  cp "${SRC_MD}" "${TMP_MD}"
  if [[ -f "${MMD_OUT}" ]]; then
    {
      echo ""
      echo "## Figure A1. Architecture Diagram"
      echo ""
      echo "![Architecture diagram](figures/architecture.svg)"
    } >> "${TMP_MD}"
  elif [[ -f "${MMD_SRC}" ]]; then
    {
      echo ""
      echo "## Figure A1. Architecture Diagram Source (Mermaid)"
      echo ""
      echo '```mermaid'
      cat "${MMD_SRC}"
      echo '```'
    } >> "${TMP_MD}"
  fi

  if command -v xelatex >/dev/null 2>&1; then
    pandoc "${TMP_MD}" -o "${OUT_PDF}" --pdf-engine=xelatex
  elif command -v pdflatex >/dev/null 2>&1; then
    pandoc "${TMP_MD}" -o "${OUT_PDF}" --pdf-engine=pdflatex
  elif command -v tectonic >/dev/null 2>&1; then
    pandoc "${TMP_MD}" -o "${OUT_PDF}" --pdf-engine=tectonic
  else
    echo "[build_preprint_pdf] ERROR: pandoc found, but no xelatex/pdflatex/tectonic available" >&2
    exit 1
  fi
  rm -f "${TMP_MD}"
else
  echo "[build_preprint_pdf] pandoc not available; generating plain-text fallback PDF"
  python3 - "${SRC_MD}" "${OUT_PDF}" "${MMD_SRC}" <<'PY'
import re
import sys
import textwrap
from pathlib import Path

src = Path(sys.argv[1]).read_text(encoding="utf-8")
out_pdf = Path(sys.argv[2])
mmd_src = Path(sys.argv[3])

lines = []
for raw in src.splitlines():
    s = raw.rstrip()
    if s.startswith("```"):
        continue
    s = re.sub(r"^#{1,6}\s*", "", s)
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s)
    s = re.sub(r"`([^`]+)`", r"\1", s)
    s = re.sub(r"^\s*-\s+", "- ", s)
    if not s:
        lines.append("")
        continue
    lines.extend(textwrap.wrap(s, width=96))

lines.extend(["", "Figure source note: Mermaid diagram source is stored in _paperpack/preprint/figures/architecture.mmd."])
if mmd_src.exists():
    lines.append("Diagram rendering tool (mmdc) was not available during this build; source retained.")

per_page = 56
pages = [lines[i:i + per_page] for i in range(0, len(lines), per_page)] or [["(empty)"]]

def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

objects = {}
font_id = 1
objects[font_id] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"

page_ids = []
content_ids = []
next_id = 2
for page in pages:
    content_id = next_id
    page_id = next_id + 1
    next_id += 2
    content_ids.append(content_id)
    page_ids.append(page_id)

    stream_lines = ["BT", "/F1 10 Tf", "50 790 Td", "12 TL"]
    for ln in page:
        stream_lines.append(f"({esc(ln)}) Tj")
        stream_lines.append("T*")
    stream_lines.append("ET")
    stream = "\n".join(stream_lines) + "\n"
    objects[content_id] = f"<< /Length {len(stream.encode('utf-8'))} >>\nstream\n{stream}endstream"

pages_id = next_id
catalog_id = next_id + 1

for i, page_id in enumerate(page_ids):
    objects[page_id] = (
        f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
        f"/Contents {content_ids[i]} 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> >>"
    )

kids = " ".join(f"{pid} 0 R" for pid in page_ids)
objects[pages_id] = f"<< /Type /Pages /Count {len(page_ids)} /Kids [ {kids} ] >>"
objects[catalog_id] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>"

max_id = max(objects)
pdf = bytearray()
pdf.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = [0] * (max_id + 1)

for i in range(1, max_id + 1):
    offsets[i] = len(pdf)
    body = objects[i].encode("utf-8")
    pdf.extend(f"{i} 0 obj\n".encode("ascii"))
    pdf.extend(body)
    pdf.extend(b"\nendobj\n")

xref_start = len(pdf)
pdf.extend(f"xref\n0 {max_id + 1}\n".encode("ascii"))
pdf.extend(b"0000000000 65535 f \n")
for i in range(1, max_id + 1):
    pdf.extend(f"{offsets[i]:010d} 00000 n \n".encode("ascii"))

pdf.extend(
    f"trailer\n<< /Size {max_id + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode(
        "ascii"
    )
)
out_pdf.write_bytes(pdf)
PY
fi

if [[ ! -s "${OUT_PDF}" ]]; then
  echo "[build_preprint_pdf] ERROR: PDF not created (${OUT_PDF})" >&2
  exit 1
fi

echo "[build_preprint_pdf] output: ${OUT_PDF}"
echo "[build_preprint_pdf] done: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
