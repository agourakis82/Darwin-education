/**
 * QGen-DDL Module
 * ===============
 *
 * Question Generation system with DDL integration
 */

// Services
export { CorpusAnalysisService } from './services/corpus-analysis-service';
export { PromptBuilderService } from './services/prompt-builder-service';
export { QGenGenerationService, qgenGenerationService } from './services/qgen-generation-service';
export { QGenValidationService, qgenValidationService } from './services/qgen-validation-service';
export { DDLIntegrationService, ddlIntegrationService } from './services/ddl-integration-service';
export { MedicalVerificationService, medicalVerificationService } from './services/medical-verification-service';

// Types from DDL integration
export type { StudentProfile, DDLToQGenMapping } from './services/ddl-integration-service';
export type {
  ClaimVerificationResult,
  DrugInteractionResult,
  ScenarioValidationResult,
  MedicalVerificationResult,
} from './services/medical-verification-service';

// Constants
export * from './constants/patterns';
export * from './constants/few-shot-examples';
