/**
 * @darwin-education/shared
 * ========================
 *
 * Shared code between Darwin Education web and mobile apps
 */

// Types
export * from './types/education';
export * from './types/cip';
export * from './types/fcr';
export * from './types/ontology';
export * from './types/schema-medical';
export * from './types/ai';
export * from './types/qgen';
export * from './types/theory-generation';
export * from './types/rt-irt';
export * from './types/hlr';
export * from './types/bkt';
export * from './types/dif';
export * from './types/mirt';
export * from './types/unified-learner';

// Data loaders
export * from './data/ontology-loaders';

// Calculators
export * from './calculators/tri';
export * from './calculators/similarity';
export * from './calculators/distractor';
export * from './calculators/cip';
export * from './calculators/cip-scoring';
export * from './calculators/cip-image-scoring';
export * from './calculators/fcr-scoring';
export * from './calculators/fcr-adaptive';
export * from './calculators/fcr-calibration-model';

// Spaced Repetition (with namespaces to avoid conflicts)
export * as SM2 from './calculators/sm2';
export * as FSRS from './calculators/fsrs';

// Config
export * from './config/irt-estimation-config';

// Question Harvester (CLI-only, not exported to web bundle)
// Import directly from '@darwin-education/shared/harvester' for CLI usage
// export * as Harvester from './harvester';

// AI Services
export * from './services/ai';

// Research-grade psychometrics
export * from './calculators/rt-irt';
export * from './calculators/hlr';
export * from './calculators/bkt';
export * from './calculators/dif';
export * from './calculators/mirt';
export * from './calculators/unified-learner-model';

// Advanced features
export * from './algorithms/cat';
// export * from './analyzers/enamed-parser';
// export * from './analyzers/question-patterns';
// export * from './generators/template-engine';
// export * from './generators/question-generator';
// export * from './generators/distractor-generator';

// Experimental math (hypercomplex algebras: octonions, sedenions, etc.)
export * as Hypercomplex from './math/hypercomplex';
