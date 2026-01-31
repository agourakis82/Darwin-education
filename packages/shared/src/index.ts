/**
 * @darwin-education/shared
 * ========================
 *
 * Shared code between Darwin Education web and mobile apps
 */

// Types
export * from './types/education';
export * from './types/cip';
export * from './types/ontology';
export * from './types/schema-medical';
export * from './types/ai';

// Data loaders
export * from './data/ontology-loaders';

// Calculators
export * from './calculators/tri';
export * from './calculators/similarity';
export * from './calculators/distractor';
export * from './calculators/cip';
export * from './calculators/cip-scoring';

// Spaced Repetition (with namespaces to avoid conflicts)
export * as SM2 from './calculators/sm2';
export * as FSRS from './calculators/fsrs';

// Algorithms
export * from './algorithms/cat';

// AI services
export * from './services/ai';

// Analyzers
export * from './analyzers/enamed-parser';
export * from './analyzers/question-patterns';

// Generators
export * from './generators/template-engine';
export * from './generators/question-generator';
export * from './generators/distractor-generator';

// Config
export * from './config/irt-estimation-config';
