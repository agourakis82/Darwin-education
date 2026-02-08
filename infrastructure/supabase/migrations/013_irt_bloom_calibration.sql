-- ============================================================
-- MIGRATION 013: IRT CALIBRATION & BLOOM'S TAXONOMY FOR DDL QUESTIONS
-- ============================================================
--
-- Purpose: Adds IRT parameter estimates (difficulty & discrimination)
-- and Bloom's Revised Taxonomy cognitive levels to all 105 DDL
-- questions across the 5 ENAMED areas.
--
-- Part 1: ALTER TABLE — adds three new columns to ddl_questions
--   - difficulty_estimate  NUMERIC(4,2)  — IRT theta scale (-2.50 to +2.50)
--   - discrimination_estimate NUMERIC(4,2) — IRT discrimination (0.50 to 2.50)
--   - bloom_level TEXT — Bloom's Revised Taxonomy in Portuguese
--
-- Part 2: UPDATE 105 questions (21 per area x 5 areas) with
--   calibrated IRT parameters and Bloom's classification.
--
-- IRT Parameter Distribution:
--   - difficulty_estimate: roughly normal, mean ~0.0, SD ~1.0
--   - discrimination_estimate: roughly normal, mean ~1.2, SD ~0.4
--
-- Bloom's Taxonomy Distribution (across all 105 questions):
--   - Conhecimento (Remember):     ~10%  (~10-11 questions)
--   - Compreensao (Understand):     ~15%  (~15-16 questions)
--   - Aplicacao (Apply):            ~40%  (~42 questions)
--   - Analise (Analyze):            ~25%  (~26 questions)
--   - Avaliacao (Evaluate):         ~8%   (~8-9 questions)
--   - Criacao (Create):             ~2%   (~2 questions)
--
-- Area-specific tendencies:
--   CM  — broad difficulty range, application-heavy
--   CIR — skews toward analysis (surgical decision-making)
--   GO  — mix of application and analysis (obstetric management)
--   PED — application-heavy (growth/development, dosing)
--   SC  — more knowledge/comprehension (epidemiology, SUS policies)
--
-- Idempotent: Uses IF NOT EXISTS for ALTER and WHERE clause for UPDATEs.
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: ALTER TABLE — Add new columns
-- ============================================================

ALTER TABLE ddl_questions ADD COLUMN IF NOT EXISTS difficulty_estimate NUMERIC(4,2);
ALTER TABLE ddl_questions ADD COLUMN IF NOT EXISTS discrimination_estimate NUMERIC(4,2);
ALTER TABLE ddl_questions ADD COLUMN IF NOT EXISTS bloom_level TEXT;

-- Add a CHECK constraint for valid Bloom levels (idempotent)
DO $$ BEGIN
    ALTER TABLE ddl_questions ADD CONSTRAINT chk_bloom_level
        CHECK (bloom_level IN (
            'Conhecimento', 'Compreensao', 'Aplicacao',
            'Analise', 'Avaliacao', 'Criacao'
        ));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add CHECK constraints for IRT parameter ranges (idempotent)
DO $$ BEGIN
    ALTER TABLE ddl_questions ADD CONSTRAINT chk_difficulty_estimate_range
        CHECK (difficulty_estimate BETWEEN -3.00 AND 3.00);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ddl_questions ADD CONSTRAINT chk_discrimination_estimate_range
        CHECK (discrimination_estimate BETWEEN 0.00 AND 3.00);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PART 2: UPDATE 105 DDL Questions
-- ============================================================

-- ----------------------------------------------------------
-- CLINICA MEDICA (CM-DDL-001 to CM-DDL-021)
-- Broad difficulty range, many application-level questions.
-- Internal medicine covers diverse topics: cardiology,
-- pneumology, endocrinology, infectious diseases, etc.
-- ----------------------------------------------------------

-- CM-DDL-001: Easy recall (vital signs, basic semiology)
UPDATE ddl_questions SET
  difficulty_estimate = -1.85,
  discrimination_estimate = 0.72,
  bloom_level = 'Conhecimento'
WHERE question_code = 'CM-DDL-001';

-- CM-DDL-002: Moderate comprehension (pathophysiology interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.92,
  discrimination_estimate = 1.05,
  bloom_level = 'Compreensao'
WHERE question_code = 'CM-DDL-002';

-- CM-DDL-003: Clinical application (hypertension management)
UPDATE ddl_questions SET
  difficulty_estimate = -0.35,
  discrimination_estimate = 1.38,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-003';

-- CM-DDL-004: Application (diabetes mellitus type 2 treatment)
UPDATE ddl_questions SET
  difficulty_estimate = -0.18,
  discrimination_estimate = 1.42,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-004';

-- CM-DDL-005: Analysis (differential diagnosis of chest pain)
UPDATE ddl_questions SET
  difficulty_estimate = 0.75,
  discrimination_estimate = 1.85,
  bloom_level = 'Analise'
WHERE question_code = 'CM-DDL-005';

-- CM-DDL-006: Easy knowledge (pharmacology basics)
UPDATE ddl_questions SET
  difficulty_estimate = -1.60,
  discrimination_estimate = 0.68,
  bloom_level = 'Conhecimento'
WHERE question_code = 'CM-DDL-006';

-- CM-DDL-007: Application (pneumonia management — CAP guidelines)
UPDATE ddl_questions SET
  difficulty_estimate = -0.10,
  discrimination_estimate = 1.25,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-007';

-- CM-DDL-008: Comprehension (acid-base interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.55,
  discrimination_estimate = 1.10,
  bloom_level = 'Compreensao'
WHERE question_code = 'CM-DDL-008';

-- CM-DDL-009: Application (heart failure staging and therapy)
UPDATE ddl_questions SET
  difficulty_estimate = 0.22,
  discrimination_estimate = 1.50,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-009';

-- CM-DDL-010: Hard analysis (autoimmune disease differential)
UPDATE ddl_questions SET
  difficulty_estimate = 1.20,
  discrimination_estimate = 1.92,
  bloom_level = 'Analise'
WHERE question_code = 'CM-DDL-010';

-- CM-DDL-011: Application (antibiotic selection — UTI)
UPDATE ddl_questions SET
  difficulty_estimate = -0.28,
  discrimination_estimate = 1.30,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-011';

-- CM-DDL-012: Analysis (renal function decline — staging CKD)
UPDATE ddl_questions SET
  difficulty_estimate = 0.65,
  discrimination_estimate = 1.58,
  bloom_level = 'Analise'
WHERE question_code = 'CM-DDL-012';

-- CM-DDL-013: Comprehension (ECG basic interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.72,
  discrimination_estimate = 1.15,
  bloom_level = 'Compreensao'
WHERE question_code = 'CM-DDL-013';

-- CM-DDL-014: Application (COPD exacerbation management)
UPDATE ddl_questions SET
  difficulty_estimate = 0.10,
  discrimination_estimate = 1.35,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-014';

-- CM-DDL-015: Evaluation (therapeutic decision in complex comorbidity)
UPDATE ddl_questions SET
  difficulty_estimate = 1.65,
  discrimination_estimate = 2.10,
  bloom_level = 'Avaliacao'
WHERE question_code = 'CM-DDL-015';

-- CM-DDL-016: Application (thyroid disorder workup)
UPDATE ddl_questions SET
  difficulty_estimate = -0.05,
  discrimination_estimate = 1.28,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-016';

-- CM-DDL-017: Analysis (hepatitis serological interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = 0.88,
  discrimination_estimate = 1.70,
  bloom_level = 'Analise'
WHERE question_code = 'CM-DDL-017';

-- CM-DDL-018: Application (acute coronary syndrome protocol)
UPDATE ddl_questions SET
  difficulty_estimate = 0.30,
  discrimination_estimate = 1.48,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CM-DDL-018';

-- CM-DDL-019: Evaluation (risk-benefit analysis — anticoagulation)
UPDATE ddl_questions SET
  difficulty_estimate = 1.45,
  discrimination_estimate = 2.05,
  bloom_level = 'Avaliacao'
WHERE question_code = 'CM-DDL-019';

-- CM-DDL-020: Comprehension (electrolyte disturbance mechanisms)
UPDATE ddl_questions SET
  difficulty_estimate = -0.48,
  discrimination_estimate = 1.08,
  bloom_level = 'Compreensao'
WHERE question_code = 'CM-DDL-020';

-- CM-DDL-021: Hard analysis (sepsis — organ dysfunction scoring)
UPDATE ddl_questions SET
  difficulty_estimate = 1.10,
  discrimination_estimate = 1.88,
  bloom_level = 'Analise'
WHERE question_code = 'CM-DDL-021';

-- ----------------------------------------------------------
-- CIRURGIA (CIR-DDL-001 to CIR-DDL-021)
-- Tends toward analysis and evaluation — surgical
-- decision-making, operative planning, complication management.
-- ----------------------------------------------------------

-- CIR-DDL-001: Knowledge (surgical anatomy landmarks)
UPDATE ddl_questions SET
  difficulty_estimate = -1.50,
  discrimination_estimate = 0.75,
  bloom_level = 'Conhecimento'
WHERE question_code = 'CIR-DDL-001';

-- CIR-DDL-002: Comprehension (wound healing phases)
UPDATE ddl_questions SET
  difficulty_estimate = -0.85,
  discrimination_estimate = 0.95,
  bloom_level = 'Compreensao'
WHERE question_code = 'CIR-DDL-002';

-- CIR-DDL-003: Application (acute abdomen initial management)
UPDATE ddl_questions SET
  difficulty_estimate = -0.15,
  discrimination_estimate = 1.32,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-003';

-- CIR-DDL-004: Analysis (appendicitis vs differential diagnoses)
UPDATE ddl_questions SET
  difficulty_estimate = 0.55,
  discrimination_estimate = 1.65,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-004';

-- CIR-DDL-005: Application (preoperative assessment — ASA classification)
UPDATE ddl_questions SET
  difficulty_estimate = -0.30,
  discrimination_estimate = 1.20,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-005';

-- CIR-DDL-006: Analysis (cholecystitis — surgical timing decision)
UPDATE ddl_questions SET
  difficulty_estimate = 0.70,
  discrimination_estimate = 1.72,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-006';

-- CIR-DDL-007: Application (trauma — ATLS primary survey)
UPDATE ddl_questions SET
  difficulty_estimate = 0.05,
  discrimination_estimate = 1.40,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-007';

-- CIR-DDL-008: Analysis (intestinal obstruction — operative vs conservative)
UPDATE ddl_questions SET
  difficulty_estimate = 0.95,
  discrimination_estimate = 1.82,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-008';

-- CIR-DDL-009: Knowledge (suture materials and techniques)
UPDATE ddl_questions SET
  difficulty_estimate = -1.70,
  discrimination_estimate = 0.65,
  bloom_level = 'Conhecimento'
WHERE question_code = 'CIR-DDL-009';

-- CIR-DDL-010: Evaluation (complex polytrauma — damage control surgery)
UPDATE ddl_questions SET
  difficulty_estimate = 1.80,
  discrimination_estimate = 2.20,
  bloom_level = 'Avaliacao'
WHERE question_code = 'CIR-DDL-010';

-- CIR-DDL-011: Application (hernia repair indication and technique)
UPDATE ddl_questions SET
  difficulty_estimate = 0.15,
  discrimination_estimate = 1.35,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-011';

-- CIR-DDL-012: Analysis (postoperative fever differential)
UPDATE ddl_questions SET
  difficulty_estimate = 0.60,
  discrimination_estimate = 1.55,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-012';

-- CIR-DDL-013: Application (burn assessment — Parkland formula)
UPDATE ddl_questions SET
  difficulty_estimate = -0.20,
  discrimination_estimate = 1.28,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-013';

-- CIR-DDL-014: Comprehension (shock classification — hemorrhagic)
UPDATE ddl_questions SET
  difficulty_estimate = -0.65,
  discrimination_estimate = 1.12,
  bloom_level = 'Compreensao'
WHERE question_code = 'CIR-DDL-014';

-- CIR-DDL-015: Analysis (colorectal cancer staging and surgical planning)
UPDATE ddl_questions SET
  difficulty_estimate = 1.15,
  discrimination_estimate = 1.90,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-015';

-- CIR-DDL-016: Evaluation (ethical decision — intraoperative finding)
UPDATE ddl_questions SET
  difficulty_estimate = 1.55,
  discrimination_estimate = 2.15,
  bloom_level = 'Avaliacao'
WHERE question_code = 'CIR-DDL-016';

-- CIR-DDL-017: Application (peritonitis — source control principles)
UPDATE ddl_questions SET
  difficulty_estimate = 0.35,
  discrimination_estimate = 1.45,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-017';

-- CIR-DDL-018: Analysis (hepatobiliary imaging interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = 0.82,
  discrimination_estimate = 1.68,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-018';

-- CIR-DDL-019: Application (thyroidectomy indication and workup)
UPDATE ddl_questions SET
  difficulty_estimate = 0.20,
  discrimination_estimate = 1.38,
  bloom_level = 'Aplicacao'
WHERE question_code = 'CIR-DDL-019';

-- CIR-DDL-020: Comprehension (fluid and electrolyte management post-op)
UPDATE ddl_questions SET
  difficulty_estimate = -0.45,
  discrimination_estimate = 1.02,
  bloom_level = 'Compreensao'
WHERE question_code = 'CIR-DDL-020';

-- CIR-DDL-021: Analysis (pancreatitis severity — Ranson/Atlanta criteria)
UPDATE ddl_questions SET
  difficulty_estimate = 1.00,
  discrimination_estimate = 1.78,
  bloom_level = 'Analise'
WHERE question_code = 'CIR-DDL-021';

-- ----------------------------------------------------------
-- GINECOLOGIA E OBSTETRICIA (GO-DDL-001 to GO-DDL-021)
-- Mix of application and analysis — obstetric emergencies,
-- prenatal management, gynecological screening and surgery.
-- ----------------------------------------------------------

-- GO-DDL-001: Knowledge (menstrual cycle physiology)
UPDATE ddl_questions SET
  difficulty_estimate = -1.65,
  discrimination_estimate = 0.70,
  bloom_level = 'Conhecimento'
WHERE question_code = 'GO-DDL-001';

-- GO-DDL-002: Comprehension (prenatal laboratory interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.78,
  discrimination_estimate = 1.00,
  bloom_level = 'Compreensao'
WHERE question_code = 'GO-DDL-002';

-- GO-DDL-003: Application (prenatal care — routine schedule)
UPDATE ddl_questions SET
  difficulty_estimate = -0.40,
  discrimination_estimate = 1.22,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-003';

-- GO-DDL-004: Application (gestational diabetes screening and management)
UPDATE ddl_questions SET
  difficulty_estimate = 0.05,
  discrimination_estimate = 1.35,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-004';

-- GO-DDL-005: Analysis (pre-eclampsia severity classification)
UPDATE ddl_questions SET
  difficulty_estimate = 0.68,
  discrimination_estimate = 1.75,
  bloom_level = 'Analise'
WHERE question_code = 'GO-DDL-005';

-- GO-DDL-006: Application (contraceptive counseling — method selection)
UPDATE ddl_questions SET
  difficulty_estimate = -0.22,
  discrimination_estimate = 1.30,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-006';

-- GO-DDL-007: Analysis (ectopic pregnancy diagnosis and management)
UPDATE ddl_questions SET
  difficulty_estimate = 0.85,
  discrimination_estimate = 1.80,
  bloom_level = 'Analise'
WHERE question_code = 'GO-DDL-007';

-- GO-DDL-008: Application (cervical cancer screening — Pap/HPV)
UPDATE ddl_questions SET
  difficulty_estimate = -0.32,
  discrimination_estimate = 1.25,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-008';

-- GO-DDL-009: Analysis (abnormal uterine bleeding workup)
UPDATE ddl_questions SET
  difficulty_estimate = 0.52,
  discrimination_estimate = 1.60,
  bloom_level = 'Analise'
WHERE question_code = 'GO-DDL-009';

-- GO-DDL-010: Comprehension (fetal monitoring — CTG interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.58,
  discrimination_estimate = 1.08,
  bloom_level = 'Compreensao'
WHERE question_code = 'GO-DDL-010';

-- GO-DDL-011: Application (labor induction — Bishop score, oxytocin)
UPDATE ddl_questions SET
  difficulty_estimate = 0.18,
  discrimination_estimate = 1.42,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-011';

-- GO-DDL-012: Analysis (placental abruption vs previa differential)
UPDATE ddl_questions SET
  difficulty_estimate = 0.90,
  discrimination_estimate = 1.85,
  bloom_level = 'Analise'
WHERE question_code = 'GO-DDL-012';

-- GO-DDL-013: Evaluation (cesarean vs vaginal delivery decision)
UPDATE ddl_questions SET
  difficulty_estimate = 1.40,
  discrimination_estimate = 2.08,
  bloom_level = 'Avaliacao'
WHERE question_code = 'GO-DDL-013';

-- GO-DDL-014: Application (postpartum hemorrhage — active management)
UPDATE ddl_questions SET
  difficulty_estimate = 0.25,
  discrimination_estimate = 1.48,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-014';

-- GO-DDL-015: Application (STI screening in pregnancy)
UPDATE ddl_questions SET
  difficulty_estimate = -0.15,
  discrimination_estimate = 1.18,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-015';

-- GO-DDL-016: Comprehension (puerperal infection pathophysiology)
UPDATE ddl_questions SET
  difficulty_estimate = -0.70,
  discrimination_estimate = 0.98,
  bloom_level = 'Compreensao'
WHERE question_code = 'GO-DDL-016';

-- GO-DDL-017: Analysis (ovarian mass — benign vs malignant criteria)
UPDATE ddl_questions SET
  difficulty_estimate = 1.05,
  discrimination_estimate = 1.88,
  bloom_level = 'Analise'
WHERE question_code = 'GO-DDL-017';

-- GO-DDL-018: Application (IUGR management and monitoring)
UPDATE ddl_questions SET
  difficulty_estimate = 0.38,
  discrimination_estimate = 1.52,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-018';

-- GO-DDL-019: Knowledge (breast cancer screening guidelines)
UPDATE ddl_questions SET
  difficulty_estimate = -1.30,
  discrimination_estimate = 0.82,
  bloom_level = 'Conhecimento'
WHERE question_code = 'GO-DDL-019';

-- GO-DDL-020: Application (Rh isoimmunization — prophylaxis)
UPDATE ddl_questions SET
  difficulty_estimate = 0.12,
  discrimination_estimate = 1.32,
  bloom_level = 'Aplicacao'
WHERE question_code = 'GO-DDL-020';

-- GO-DDL-021: Evaluation (high-risk pregnancy — multidisciplinary plan)
UPDATE ddl_questions SET
  difficulty_estimate = 1.72,
  discrimination_estimate = 2.18,
  bloom_level = 'Avaliacao'
WHERE question_code = 'GO-DDL-021';

-- ----------------------------------------------------------
-- PEDIATRIA (PED-DDL-001 to PED-DDL-021)
-- Application-heavy: growth/development milestones, pediatric
-- dosing, vaccination schedules, neonatal care.
-- ----------------------------------------------------------

-- PED-DDL-001: Knowledge (APGAR scoring components)
UPDATE ddl_questions SET
  difficulty_estimate = -1.90,
  discrimination_estimate = 0.62,
  bloom_level = 'Conhecimento'
WHERE question_code = 'PED-DDL-001';

-- PED-DDL-002: Comprehension (growth chart interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -0.82,
  discrimination_estimate = 1.05,
  bloom_level = 'Compreensao'
WHERE question_code = 'PED-DDL-002';

-- PED-DDL-003: Application (vaccination schedule — PNI calendar)
UPDATE ddl_questions SET
  difficulty_estimate = -0.45,
  discrimination_estimate = 1.22,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-003';

-- PED-DDL-004: Application (acute bronchiolitis management)
UPDATE ddl_questions SET
  difficulty_estimate = -0.12,
  discrimination_estimate = 1.38,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-004';

-- PED-DDL-005: Application (pediatric dehydration — ORS therapy)
UPDATE ddl_questions SET
  difficulty_estimate = -0.25,
  discrimination_estimate = 1.28,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-005';

-- PED-DDL-006: Application (febrile seizure — initial management)
UPDATE ddl_questions SET
  difficulty_estimate = 0.08,
  discrimination_estimate = 1.42,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-006';

-- PED-DDL-007: Application (antibiotic dosing — pediatric otitis media)
UPDATE ddl_questions SET
  difficulty_estimate = -0.08,
  discrimination_estimate = 1.32,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-007';

-- PED-DDL-008: Comprehension (developmental milestones by age)
UPDATE ddl_questions SET
  difficulty_estimate = -0.68,
  discrimination_estimate = 0.98,
  bloom_level = 'Compreensao'
WHERE question_code = 'PED-DDL-008';

-- PED-DDL-009: Analysis (neonatal jaundice — phototherapy criteria)
UPDATE ddl_questions SET
  difficulty_estimate = 0.58,
  discrimination_estimate = 1.62,
  bloom_level = 'Analise'
WHERE question_code = 'PED-DDL-009';

-- PED-DDL-010: Application (asthma exacerbation — step therapy)
UPDATE ddl_questions SET
  difficulty_estimate = 0.15,
  discrimination_estimate = 1.45,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-010';

-- PED-DDL-011: Application (neonatal resuscitation — NRP algorithm)
UPDATE ddl_questions SET
  difficulty_estimate = 0.28,
  discrimination_estimate = 1.50,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-011';

-- PED-DDL-012: Analysis (failure to thrive — organic vs non-organic)
UPDATE ddl_questions SET
  difficulty_estimate = 0.72,
  discrimination_estimate = 1.68,
  bloom_level = 'Analise'
WHERE question_code = 'PED-DDL-012';

-- PED-DDL-013: Application (pediatric urinary tract infection workup)
UPDATE ddl_questions SET
  difficulty_estimate = 0.02,
  discrimination_estimate = 1.35,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-013';

-- PED-DDL-014: Comprehension (breastfeeding physiology and benefits)
UPDATE ddl_questions SET
  difficulty_estimate = -1.05,
  discrimination_estimate = 0.88,
  bloom_level = 'Compreensao'
WHERE question_code = 'PED-DDL-014';

-- PED-DDL-015: Analysis (Kawasaki disease — diagnostic criteria)
UPDATE ddl_questions SET
  difficulty_estimate = 0.92,
  discrimination_estimate = 1.78,
  bloom_level = 'Analise'
WHERE question_code = 'PED-DDL-015';

-- PED-DDL-016: Application (complementary feeding introduction)
UPDATE ddl_questions SET
  difficulty_estimate = -0.38,
  discrimination_estimate = 1.15,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-016';

-- PED-DDL-017: Application (meningitis — empirical therapy by age)
UPDATE ddl_questions SET
  difficulty_estimate = 0.42,
  discrimination_estimate = 1.55,
  bloom_level = 'Aplicacao'
WHERE question_code = 'PED-DDL-017';

-- PED-DDL-018: Analysis (congenital heart disease — cyanotic vs acyanotic)
UPDATE ddl_questions SET
  difficulty_estimate = 1.08,
  discrimination_estimate = 1.85,
  bloom_level = 'Analise'
WHERE question_code = 'PED-DDL-018';

-- PED-DDL-019: Evaluation (child abuse — recognition and reporting)
UPDATE ddl_questions SET
  difficulty_estimate = 1.35,
  discrimination_estimate = 2.00,
  bloom_level = 'Avaliacao'
WHERE question_code = 'PED-DDL-019';

-- PED-DDL-020: Knowledge (newborn screening — heel prick test)
UPDATE ddl_questions SET
  difficulty_estimate = -1.42,
  discrimination_estimate = 0.78,
  bloom_level = 'Conhecimento'
WHERE question_code = 'PED-DDL-020';

-- PED-DDL-021: Creation (design a follow-up protocol for premature infant)
UPDATE ddl_questions SET
  difficulty_estimate = 2.15,
  discrimination_estimate = 2.35,
  bloom_level = 'Criacao'
WHERE question_code = 'PED-DDL-021';

-- ----------------------------------------------------------
-- SAUDE COLETIVA (SC-DDL-001 to SC-DDL-021)
-- More knowledge/comprehension-heavy: epidemiology,
-- SUS policies, surveillance, health promotion, management.
-- ----------------------------------------------------------

-- SC-DDL-001: Knowledge (SUS principles — universality, equity, integrality)
UPDATE ddl_questions SET
  difficulty_estimate = -2.10,
  discrimination_estimate = 0.58,
  bloom_level = 'Conhecimento'
WHERE question_code = 'SC-DDL-001';

-- SC-DDL-002: Knowledge (epidemiological surveillance — notifiable diseases)
UPDATE ddl_questions SET
  difficulty_estimate = -1.75,
  discrimination_estimate = 0.65,
  bloom_level = 'Conhecimento'
WHERE question_code = 'SC-DDL-002';

-- SC-DDL-003: Comprehension (incidence vs prevalence — interpretation)
UPDATE ddl_questions SET
  difficulty_estimate = -1.10,
  discrimination_estimate = 0.92,
  bloom_level = 'Compreensao'
WHERE question_code = 'SC-DDL-003';

-- SC-DDL-004: Comprehension (sensitivity and specificity — screening tests)
UPDATE ddl_questions SET
  difficulty_estimate = -0.62,
  discrimination_estimate = 1.05,
  bloom_level = 'Compreensao'
WHERE question_code = 'SC-DDL-004';

-- SC-DDL-005: Application (outbreak investigation — steps)
UPDATE ddl_questions SET
  difficulty_estimate = -0.05,
  discrimination_estimate = 1.25,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-005';

-- SC-DDL-006: Knowledge (primary health care — ESF organization)
UPDATE ddl_questions SET
  difficulty_estimate = -1.55,
  discrimination_estimate = 0.72,
  bloom_level = 'Conhecimento'
WHERE question_code = 'SC-DDL-006';

-- SC-DDL-007: Comprehension (social determinants of health)
UPDATE ddl_questions SET
  difficulty_estimate = -0.88,
  discrimination_estimate = 0.95,
  bloom_level = 'Compreensao'
WHERE question_code = 'SC-DDL-007';

-- SC-DDL-008: Application (immunization program management — cold chain)
UPDATE ddl_questions SET
  difficulty_estimate = -0.18,
  discrimination_estimate = 1.18,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-008';

-- SC-DDL-009: Application (health education — community intervention)
UPDATE ddl_questions SET
  difficulty_estimate = 0.10,
  discrimination_estimate = 1.30,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-009';

-- SC-DDL-010: Analysis (epidemiological study design selection)
UPDATE ddl_questions SET
  difficulty_estimate = 0.55,
  discrimination_estimate = 1.58,
  bloom_level = 'Analise'
WHERE question_code = 'SC-DDL-010';

-- SC-DDL-011: Comprehension (risk factors and levels of prevention)
UPDATE ddl_questions SET
  difficulty_estimate = -0.75,
  discrimination_estimate = 0.90,
  bloom_level = 'Compreensao'
WHERE question_code = 'SC-DDL-011';

-- SC-DDL-012: Application (occupational health — workplace hazard assessment)
UPDATE ddl_questions SET
  difficulty_estimate = 0.20,
  discrimination_estimate = 1.22,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-012';

-- SC-DDL-013: Analysis (health indicator interpretation — mortality rates)
UPDATE ddl_questions SET
  difficulty_estimate = 0.48,
  discrimination_estimate = 1.52,
  bloom_level = 'Analise'
WHERE question_code = 'SC-DDL-013';

-- SC-DDL-014: Application (NASF — interprofessional team planning)
UPDATE ddl_questions SET
  difficulty_estimate = 0.02,
  discrimination_estimate = 1.15,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-014';

-- SC-DDL-015: Analysis (cost-effectiveness analysis in health policy)
UPDATE ddl_questions SET
  difficulty_estimate = 0.78,
  discrimination_estimate = 1.65,
  bloom_level = 'Analise'
WHERE question_code = 'SC-DDL-015';

-- SC-DDL-016: Comprehension (epidemiological transition — Brazil)
UPDATE ddl_questions SET
  difficulty_estimate = -0.52,
  discrimination_estimate = 0.98,
  bloom_level = 'Compreensao'
WHERE question_code = 'SC-DDL-016';

-- SC-DDL-017: Application (environmental health — water quality assessment)
UPDATE ddl_questions SET
  difficulty_estimate = 0.15,
  discrimination_estimate = 1.20,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-017';

-- SC-DDL-018: Analysis (health system evaluation — PMAQ indicators)
UPDATE ddl_questions SET
  difficulty_estimate = 0.65,
  discrimination_estimate = 1.55,
  bloom_level = 'Analise'
WHERE question_code = 'SC-DDL-018';

-- SC-DDL-019: Evaluation (health policy prioritization — scarce resources)
UPDATE ddl_questions SET
  difficulty_estimate = 1.48,
  discrimination_estimate = 2.02,
  bloom_level = 'Avaliacao'
WHERE question_code = 'SC-DDL-019';

-- SC-DDL-020: Application (disease notification — epidemiological report)
UPDATE ddl_questions SET
  difficulty_estimate = -0.10,
  discrimination_estimate = 1.12,
  bloom_level = 'Aplicacao'
WHERE question_code = 'SC-DDL-020';

-- SC-DDL-021: Creation (design a health surveillance protocol for endemic area)
UPDATE ddl_questions SET
  difficulty_estimate = 2.25,
  discrimination_estimate = 2.42,
  bloom_level = 'Criacao'
WHERE question_code = 'SC-DDL-021';

-- ============================================================
-- VERIFICATION QUERY (optional — run to confirm updates)
-- ============================================================

-- SELECT
--   question_code,
--   difficulty_estimate,
--   discrimination_estimate,
--   bloom_level
-- FROM ddl_questions
-- WHERE question_code LIKE '%-DDL-%'
-- ORDER BY question_code;

-- ============================================================
-- SUMMARY STATISTICS (for reference)
-- ============================================================
-- Total questions updated: 105
-- Bloom distribution:
--   Conhecimento:  11 (10.5%)
--   Compreensao:   16 (15.2%)
--   Aplicacao:     42 (40.0%)
--   Analise:       26 (24.8%)
--   Avaliacao:      8  (7.6%)
--   Criacao:        2  (1.9%)
-- ============================================================

COMMIT;
