#!/bin/bash

# =============================================================
# Darwin Education - Deploy Supabase (Migrations + Seeds)
# =============================================================
# Usage:
#   bash deploy.sh              # Full deploy (migrations + seeds)
#   bash deploy.sh --seeds-only # Only re-run seeds (after content fixes)
#   bash deploy.sh --generate   # Generate consolidated SQL file for manual deploy
#
# Prerequisites:
#   - supabase CLI installed (npm install -g supabase)
#   - supabase login (authenticate)
#   - supabase link (link to project)
# =============================================================

set -e

PROJECT_REF="jpzkjkwcoudaxscrukye"
SUPABASE_DIR="infrastructure/supabase"
SEED_DIR="$SUPABASE_DIR/seed"
EXPANSION_DIR="$SEED_DIR/expansion"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Generate consolidated SQL for manual deploy ───────────────
generate_consolidated() {
  local OUTPUT="$SUPABASE_DIR/deploy_consolidated.sql"
  log "Gerando SQL consolidado em $OUTPUT ..."

  cat > "$OUTPUT" << 'HEADER'
-- =============================================================
-- Darwin Education - Deploy Consolidado
-- Gerado automaticamente por deploy.sh
-- =============================================================
-- INSTRUCOES:
-- 1. Abra o Supabase Dashboard > SQL Editor
-- 2. Cole este arquivo inteiro
-- 3. Clique RUN
-- 4. Verifique "Success" no rodape
-- =============================================================

HEADER

  # Seeds (in order)
  local SEED_FILES=(
    "$SEED_DIR/01_question_banks.sql"
    "$SEED_DIR/02_sample_questions.sql"
    "$SEED_DIR/03_achievements.sql"
    "$SEED_DIR/04_study_paths.sql"
    "$SEED_DIR/05_enamed_2025_questions.sql"
    "$SEED_DIR/06_cip_sample_data.sql"
    "$SEED_DIR/07_fcr_cases.sql"
    "$SEED_DIR/ddl_questions_pilot.sql"
    "$SEED_DIR/qgen_misconceptions.sql"
    "$SEED_DIR/pilot_test_data.sql"
    "$EXPANSION_DIR/flashcard_decks_system.sql"
    "$EXPANSION_DIR/flashcards_clinica_medica_200.sql"
    "$EXPANSION_DIR/flashcards_cirurgia_200.sql"
    "$EXPANSION_DIR/flashcards_ginecologia_200.sql"
    "$EXPANSION_DIR/flashcards_pediatria_200.sql"
    "$EXPANSION_DIR/flashcards_saude_coletiva_200.sql"
    "$EXPANSION_DIR/fcr_cases_expansion.sql"
    "$EXPANSION_DIR/ddl_cirurgia_20.sql"
    "$EXPANSION_DIR/ddl_clinica_medica_20.sql"
    "$EXPANSION_DIR/ddl_ginecologia_obstetricia_20.sql"
    "$EXPANSION_DIR/ddl_pediatria_20.sql"
    "$EXPANSION_DIR/ddl_saude_coletiva_20.sql"
    "$EXPANSION_DIR/study_paths_new.sql"
    "$EXPANSION_DIR/study_modules_new.sql"
  )

  for f in "${SEED_FILES[@]}"; do
    if [ -f "$f" ]; then
      echo "" >> "$OUTPUT"
      echo "-- ═══════════════════════════════════════" >> "$OUTPUT"
      echo "-- FILE: $(basename $f)" >> "$OUTPUT"
      echo "-- ═══════════════════════════════════════" >> "$OUTPUT"
      echo "" >> "$OUTPUT"
      cat "$f" >> "$OUTPUT"
      echo "" >> "$OUTPUT"
    else
      warn "Arquivo nao encontrado: $f"
    fi
  done

  # Verification queries
  cat >> "$OUTPUT" << 'VERIFY'

-- ═══════════════════════════════════════
-- VERIFICACAO
-- ═══════════════════════════════════════
SELECT 'question_banks' as tabela, COUNT(*) as total FROM question_banks
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'study_paths', COUNT(*) FROM study_paths
UNION ALL SELECT 'study_modules', COUNT(*) FROM study_modules
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'flashcard_decks', COUNT(*) FROM flashcard_decks
UNION ALL SELECT 'flashcards', COUNT(*) FROM flashcards
UNION ALL SELECT 'cip_diagnoses', COUNT(*) FROM cip_diagnoses
UNION ALL SELECT 'cip_puzzles', COUNT(*) FROM cip_puzzles
UNION ALL SELECT 'fcr_cases', COUNT(*) FROM fcr_cases
UNION ALL SELECT 'ddl_questions', COUNT(*) FROM ddl_questions
ORDER BY tabela;
VERIFY

  local SIZE=$(du -h "$OUTPUT" | cut -f1)
  log "SQL consolidado gerado: $OUTPUT ($SIZE)"
  log ""
  log "Para deploy manual:"
  log "  1. Abra: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
  log "  2. Cole o conteudo de $OUTPUT"
  log "  3. Clique RUN"
}

# ─── Run seeds via Supabase CLI ───────────────────────────────
run_seeds() {
  log "Executando seeds..."

  local SEED_FILES=(
    "$SEED_DIR/01_question_banks.sql"
    "$SEED_DIR/02_sample_questions.sql"
    "$SEED_DIR/03_achievements.sql"
    "$SEED_DIR/04_study_paths.sql"
    "$SEED_DIR/05_enamed_2025_questions.sql"
    "$SEED_DIR/06_cip_sample_data.sql"
    "$SEED_DIR/07_fcr_cases.sql"
    "$SEED_DIR/ddl_questions_pilot.sql"
    "$SEED_DIR/qgen_misconceptions.sql"
    "$SEED_DIR/pilot_test_data.sql"
  )

  local EXPANSION_FILES=(
    "$EXPANSION_DIR/flashcard_decks_system.sql"
    "$EXPANSION_DIR/flashcards_clinica_medica_200.sql"
    "$EXPANSION_DIR/flashcards_cirurgia_200.sql"
    "$EXPANSION_DIR/flashcards_ginecologia_200.sql"
    "$EXPANSION_DIR/flashcards_pediatria_200.sql"
    "$EXPANSION_DIR/flashcards_saude_coletiva_200.sql"
    "$EXPANSION_DIR/fcr_cases_expansion.sql"
    "$EXPANSION_DIR/ddl_cirurgia_20.sql"
    "$EXPANSION_DIR/ddl_clinica_medica_20.sql"
    "$EXPANSION_DIR/ddl_ginecologia_obstetricia_20.sql"
    "$EXPANSION_DIR/ddl_pediatria_20.sql"
    "$EXPANSION_DIR/ddl_saude_coletiva_20.sql"
    "$EXPANSION_DIR/study_paths_new.sql"
    "$EXPANSION_DIR/study_modules_new.sql"
  )

  local count=0
  local total=$(( ${#SEED_FILES[@]} + ${#EXPANSION_FILES[@]} ))

  for f in "${SEED_FILES[@]}"; do
    count=$((count + 1))
    if [ -f "$f" ]; then
      log "[$count/$total] $(basename $f)"
      supabase db execute --file "$f" 2>&1 || warn "Falha em $(basename $f) - pode ser duplicata (ON CONFLICT)"
    fi
  done

  log ""
  log "Executando expansion seeds..."

  for f in "${EXPANSION_FILES[@]}"; do
    count=$((count + 1))
    if [ -f "$f" ]; then
      log "[$count/$total] $(basename $f)"
      supabase db execute --file "$f" 2>&1 || warn "Falha em $(basename $f) - pode ser duplicata (ON CONFLICT)"
    fi
  done

  log ""
  log "Seeds executados: $total arquivos"
}

# ─── Main ─────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Darwin Education - Deploy Supabase"
echo "========================================="
echo ""

case "${1:-}" in
  --generate)
    generate_consolidated
    exit 0
    ;;
  --seeds-only)
    if ! command -v supabase &> /dev/null; then
      warn "Supabase CLI nao encontrado."
      warn "Use: bash deploy.sh --generate"
      warn "Para gerar SQL consolidado para deploy manual."
      exit 1
    fi
    run_seeds
    ;;
  *)
    if ! command -v supabase &> /dev/null; then
      warn "Supabase CLI nao encontrado."
      log ""
      log "Opcoes:"
      log "  1. Instale: npm install -g supabase"
      log "  2. Ou gere SQL para deploy manual: bash deploy.sh --generate"
      log ""
      log "Gerando SQL consolidado automaticamente..."
      generate_consolidated
      exit 0
    fi

    log "Pushing migrations..."
    cd infrastructure/supabase
    supabase db push
    cd ../..

    log ""
    run_seeds
    ;;
esac

echo ""
log "Deploy completo!"
echo ""
log "Verificacao: abra o Dashboard e confira as tabelas"
log "URL: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo ""
