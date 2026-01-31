/**
 * Schema.org Medical Types for Darwin Education
 *
 * TypeScript interfaces adapted from Schema.org health-lifesci vocabulary
 * https://schema.org/docs/meddocs.html
 *
 * These types enable:
 * 1. Semantic distractor selection based on ontological relationships
 * 2. Automatic question generation using medical knowledge graphs
 * 3. Integration with ICD-10 and ATC coding systems
 */

// ============================================
// Medical Code Types
// ============================================

/**
 * Medical coding system identifiers
 */
export type CodingSystem =
  | 'ICD-10'
  | 'ICD-11'
  | 'ATC'
  | 'SNOMED-CT'
  | 'LOINC'
  | 'MeSH'
  | 'RxNorm'
  | 'CPT';

/**
 * A code from a medical classification system
 */
export interface MedicalCode {
  codeValue: string;
  codingSystem: CodingSystem;
  name?: string;
  inCodeSet?: string;
}

// ============================================
// Base Medical Entity
// ============================================

/**
 * Base interface for all medical entities
 */
export interface MedicalEntity {
  '@type': string;
  id: string;
  name: string;
  alternateName?: string[];
  description?: string;
  code?: MedicalCode[];
  guideline?: MedicalGuideline[];
  legalStatus?: string;
  medicineSystem?: MedicineSystem;
  recognizingAuthority?: Organization;
  relevantSpecialty?: MedicalSpecialty;
  study?: MedicalStudy[];
}

export type MedicineSystem =
  | 'Ayurvedic'
  | 'Chiropractic'
  | 'Homeopathic'
  | 'Osteopathic'
  | 'TraditionalChinese'
  | 'WesternConventional';

// ============================================
// Medical Condition
// ============================================

/**
 * A medical condition, disease, or pathology
 * Central type for question generation
 */
export interface MedicalCondition extends MedicalEntity {
  '@type': 'MedicalCondition' | 'InfectiousDisease' | 'MedicalSignOrSymptom';

  // Anatomy
  associatedAnatomy?: AnatomicalStructure[];

  // Causation
  cause?: MedicalCause[];
  riskFactor?: MedicalRiskFactor[];

  // Clinical presentation
  signOrSymptom?: MedicalSignOrSymptom[];
  naturalProgression?: string;
  pathophysiology?: string;
  expectedPrognosis?: string;
  stage?: MedicalConditionStage[];

  // Diagnosis
  differentialDiagnosis?: DDxElement[];
  typicalTest?: MedicalTest[];

  // Treatment
  possibleTreatment?: MedicalTherapy[];
  drug?: Drug[];
  primaryPrevention?: MedicalTherapy[];
  secondaryPrevention?: MedicalTherapy[];

  // Epidemiology
  epidemiology?: string;

  // Status
  status?: MedicalStudyStatus;

  // ICD-10 specific
  icd10Code?: string;
  icd10CodesSecondary?: string[];
}

/**
 * Infectious disease with transmission info
 */
export interface InfectiousDisease extends MedicalCondition {
  '@type': 'InfectiousDisease';
  infectiousAgent?: InfectiousAgentClass;
  infectiousAgentClass?: InfectiousAgentClass;
  transmissionMethod?: string[];
}

export type InfectiousAgentClass =
  | 'Bacteria'
  | 'Virus'
  | 'Fungus'
  | 'Parasite'
  | 'Prion';

// ============================================
// Signs and Symptoms
// ============================================

/**
 * A sign or symptom of a medical condition
 */
export interface MedicalSignOrSymptom extends MedicalEntity {
  '@type': 'MedicalSignOrSymptom' | 'MedicalSign' | 'MedicalSymptom';
  possibleTreatment?: MedicalTherapy[];
}

/**
 * Physical sign observable by clinician
 */
export interface MedicalSign extends MedicalSignOrSymptom {
  '@type': 'MedicalSign';
  identifyingExam?: PhysicalExam;
  identifyingTest?: MedicalTest;
}

/**
 * Symptom reported by patient
 */
export interface MedicalSymptom extends MedicalSignOrSymptom {
  '@type': 'MedicalSymptom';
}

// ============================================
// Causes and Risk Factors
// ============================================

/**
 * A cause of a medical condition
 */
export interface MedicalCause extends MedicalEntity {
  '@type': 'MedicalCause';
  causeOf?: MedicalCondition[];
}

/**
 * A risk factor for a medical condition
 */
export interface MedicalRiskFactor extends MedicalEntity {
  '@type': 'MedicalRiskFactor';
  increasesRiskOf?: MedicalCondition[];
}

// ============================================
// Differential Diagnosis
// ============================================

/**
 * Differential diagnosis element
 */
export interface DDxElement {
  diagnosis: MedicalCondition;
  distinguishingSign?: MedicalSignOrSymptom[];
}

/**
 * Stage of a medical condition
 */
export interface MedicalConditionStage {
  stageAsNumber?: number;
  subStageSuffix?: string;
}

// ============================================
// Medical Tests
// ============================================

/**
 * Base interface for medical tests
 */
export interface MedicalTest extends MedicalEntity {
  '@type':
    | 'MedicalTest'
    | 'BloodTest'
    | 'ImagingTest'
    | 'PathologyTest'
    | 'DiagnosticProcedure'
    | 'PhysicalExam';
  affectedBy?: Drug[];
  normalRange?: string | QuantitativeValue;
  signDetected?: MedicalSign[];
  usedToDiagnose?: MedicalCondition[];
  usesDevice?: MedicalDevice[];
}

/**
 * Blood test
 */
export interface BloodTest extends MedicalTest {
  '@type': 'BloodTest';
}

/**
 * Imaging test (X-ray, CT, MRI, etc.)
 */
export interface ImagingTest extends MedicalTest {
  '@type': 'ImagingTest';
  imagingTechnique?: MedicalImagingTechnique;
}

export type MedicalImagingTechnique =
  | 'CT'
  | 'MRI'
  | 'PET'
  | 'Radiography'
  | 'Ultrasound';

/**
 * Pathology test
 */
export interface PathologyTest extends MedicalTest {
  '@type': 'PathologyTest';
  tissueSample?: string;
}

/**
 * Diagnostic procedure
 */
export interface DiagnosticProcedure extends MedicalTest {
  '@type': 'DiagnosticProcedure';
}

/**
 * Physical exam
 */
export interface PhysicalExam extends MedicalTest {
  '@type': 'PhysicalExam';
}

// ============================================
// Drugs and Treatments
// ============================================

/**
 * A pharmaceutical drug
 */
export interface Drug extends MedicalEntity {
  '@type': 'Drug';

  // Composition
  activeIngredient?: string[];
  nonProprietaryName?: string;

  // Administration
  administrationRoute?: DrugAdministrationRoute;
  availableStrength?: DrugStrength[];
  dosageForm?: string;
  doseSchedule?: DoseSchedule[];
  drugUnit?: string;
  maximumIntake?: MaximumDoseSchedule;

  // Pharmacology
  clinicalPharmacology?: string;
  mechanismOfAction?: string;

  // Classification
  drugClass?: DrugClass;
  isAvailableGenerically?: boolean;
  isProprietary?: boolean;

  // Safety
  adverseOutcome?: MedicalEntity[];
  contraindication?: MedicalContraindication[];
  foodWarning?: string;
  interactingDrug?: Drug[];
  overdosage?: string;
  pregnancyWarning?: string;
  prescribingInfo?: string;
  warning?: string;

  // Regulatory
  prescriptionStatus?: DrugPrescriptionStatus;
  legalStatus?: string;

  // ATC code
  atcCode?: string;
}

export type DrugAdministrationRoute =
  | 'Oral'
  | 'Intravenous'
  | 'Intramuscular'
  | 'Subcutaneous'
  | 'Topical'
  | 'Inhalation'
  | 'Rectal'
  | 'Transdermal'
  | 'Sublingual'
  | 'Ophthalmic'
  | 'Otic'
  | 'Nasal';

export type DrugPrescriptionStatus =
  | 'OTC'
  | 'PrescriptionOnly'
  | 'Controlled';

/**
 * Drug class (e.g., beta-blocker, SSRI)
 */
export interface DrugClass extends MedicalEntity {
  '@type': 'DrugClass';
  drug?: Drug[];
}

/**
 * Drug strength
 */
export interface DrugStrength {
  activeIngredient?: string;
  availableIn?: string;
  maximumIntake?: MaximumDoseSchedule;
  strengthUnit?: string;
  strengthValue?: number;
}

/**
 * Dose schedule
 */
export interface DoseSchedule {
  doseUnit?: string;
  doseValue?: number;
  frequency?: string;
  targetPopulation?: string;
}

export interface MaximumDoseSchedule extends DoseSchedule {
  '@type': 'MaximumDoseSchedule';
}

/**
 * Medical contraindication
 */
export interface MedicalContraindication extends MedicalEntity {
  '@type': 'MedicalContraindication';
}

// ============================================
// Therapies and Procedures
// ============================================

/**
 * Medical therapy (treatment)
 */
export interface MedicalTherapy extends MedicalEntity {
  '@type':
    | 'MedicalTherapy'
    | 'DrugTherapy'
    | 'SurgicalProcedure'
    | 'PhysicalTherapy'
    | 'PsychologicalTreatment'
    | 'RadiationTherapy';
  contraindication?: MedicalContraindication[];
  duplicateTherapy?: MedicalTherapy[];
  seriousAdverseOutcome?: MedicalEntity[];
}

/**
 * Surgical procedure
 */
export interface SurgicalProcedure extends MedicalTherapy {
  '@type': 'SurgicalProcedure';
  procedureType?: MedicalProcedureType;
}

export type MedicalProcedureType =
  | 'NoninvasiveProcedure'
  | 'PercutaneousProcedure'
  | 'LaparoscopicProcedure'
  | 'OpenSurgicalProcedure';

// ============================================
// Anatomy
// ============================================

/**
 * Anatomical structure
 */
export interface AnatomicalStructure extends MedicalEntity {
  '@type': 'AnatomicalStructure' | 'Bone' | 'Muscle' | 'Nerve' | 'Vessel';
  associatedPathophysiology?: string;
  bodyLocation?: string;
  connectedTo?: AnatomicalStructure[];
  partOfSystem?: AnatomicalSystem;
  relatedCondition?: MedicalCondition[];
  relatedTherapy?: MedicalTherapy[];
  subStructure?: AnatomicalStructure[];
}

/**
 * Anatomical system (e.g., cardiovascular, respiratory)
 */
export interface AnatomicalSystem extends MedicalEntity {
  '@type': 'AnatomicalSystem';
  associatedPathophysiology?: string;
  comprisedOf?: AnatomicalStructure[];
  relatedCondition?: MedicalCondition[];
  relatedStructure?: AnatomicalStructure[];
  relatedTherapy?: MedicalTherapy[];
}

// ============================================
// Medical Devices
// ============================================

/**
 * Medical device
 */
export interface MedicalDevice extends MedicalEntity {
  '@type': 'MedicalDevice';
  adverseOutcome?: MedicalEntity[];
  contraindication?: MedicalContraindication[];
  postOp?: string;
  preOp?: string;
  procedure?: MedicalTherapy;
  seriousAdverseOutcome?: MedicalEntity[];
}

// ============================================
// Guidelines and Studies
// ============================================

/**
 * Medical guideline
 */
export interface MedicalGuideline extends MedicalEntity {
  '@type': 'MedicalGuideline';
  evidenceLevel?: MedicalEvidenceLevel;
  evidenceOrigin?: string;
  guidelineDate?: string;
  guidelineSubject?: MedicalEntity;
}

export type MedicalEvidenceLevel =
  | 'EvidenceLevelA'
  | 'EvidenceLevelB'
  | 'EvidenceLevelC';

/**
 * Medical study
 */
export interface MedicalStudy extends MedicalEntity {
  '@type': 'MedicalStudy' | 'MedicalTrial';
  healthCondition?: MedicalCondition;
  sponsor?: Organization;
  status?: MedicalStudyStatus;
  studyLocation?: string;
  studySubject?: MedicalEntity;
}

export type MedicalStudyStatus =
  | 'ActiveNotRecruiting'
  | 'Completed'
  | 'EnrollingByInvitation'
  | 'NotYetRecruiting'
  | 'Recruiting'
  | 'ResultsAvailable'
  | 'ResultsNotAvailable'
  | 'Suspended'
  | 'Terminated'
  | 'Withdrawn';

// ============================================
// Specialties
// ============================================

/**
 * Medical specialty
 */
export interface MedicalSpecialty extends MedicalEntity {
  '@type': 'MedicalSpecialty';
}

/**
 * ENAMED areas mapped to Schema.org specialties
 */
export const ENAMED_SPECIALTY_MAP = {
  clinica_medica: 'InternalMedicine',
  cirurgia: 'Surgery',
  ginecologia_obstetricia: 'ObstetricsGynecology',
  pediatria: 'Pediatrics',
  saude_coletiva: 'PublicHealth',
} as const;

export type ENAMEDSpecialty = keyof typeof ENAMED_SPECIALTY_MAP;

// ============================================
// Supporting Types
// ============================================

export interface Organization {
  name: string;
  url?: string;
}

export interface QuantitativeValue {
  value: number;
  unitCode?: string;
  unitText?: string;
  minValue?: number;
  maxValue?: number;
}

// ============================================
// Ontology Graph Types
// ============================================

/**
 * A relationship between medical entities
 */
export interface OntologyRelationship {
  source: string; // Entity ID
  target: string; // Entity ID
  type: RelationshipType;
  weight?: number;
}

export type RelationshipType =
  | 'causes'
  | 'treats'
  | 'diagnoses'
  | 'contraindicates'
  | 'interacts_with'
  | 'is_symptom_of'
  | 'is_sign_of'
  | 'is_risk_factor_for'
  | 'located_in'
  | 'part_of'
  | 'similar_to';

/**
 * Complete medical ontology with all entities and relationships
 */
export interface MedicalOntology {
  conditions: Map<string, MedicalCondition>;
  drugs: Map<string, Drug>;
  tests: Map<string, MedicalTest>;
  anatomy: Map<string, AnatomicalStructure>;
  systems: Map<string, AnatomicalSystem>;
  signs: Map<string, MedicalSign>;
  symptoms: Map<string, MedicalSymptom>;
  therapies: Map<string, MedicalTherapy>;

  // Graph relationships
  relationships: OntologyRelationship[];

  // Code lookups
  byICD10: Map<string, MedicalCondition>;
  byATC: Map<string, Drug>;
}

// ============================================
// Question Generation Types
// ============================================

/**
 * Pattern types for question generation
 */
export type QuestionPatternType =
  | 'clinical_vignette_diagnosis'
  | 'clinical_vignette_treatment'
  | 'clinical_vignette_workup'
  | 'mechanism_action'
  | 'adverse_effect'
  | 'differential_diagnosis'
  | 'anatomy_function'
  | 'epidemiology'
  | 'protocol_guideline';

/**
 * Configuration for question generation
 */
export interface QuestionGenerationConfig {
  patternType: QuestionPatternType;
  targetDifficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil';
  targetArea: ENAMEDSpecialty;
  distractorCount: number;
  language: 'pt' | 'en';
}

/**
 * Generated question with ontology references
 */
export interface GeneratedQuestion {
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;

  // Metadata
  pattern: QuestionPatternType;
  ontologyRefs: OntologyReference[];
  estimatedDifficulty: number;
  estimatedDiscrimination: number;

  // Status
  status: 'draft' | 'ai_reviewed' | 'expert_validated';
  generatedAt: string;
}

/**
 * Reference to an entity used in question generation
 */
export interface OntologyReference {
  entityId: string;
  entityType: string;
  role: 'subject' | 'correct_answer' | 'distractor' | 'context';
  codes?: MedicalCode[];
}
