/**
 * Bootstrap Validation Script
 * Compares metadata-based IRT estimates against ENAMED empirical data
 * Used to tune IRT_ESTIMATION_CONFIG coefficients
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  questionId: string;
  year: number;
  position: number;
  estimated: {
    difficulty: number;
    discrimination: number;
  };
  empirical: {
    difficulty: number;
    biserial: number;
    discriminationEst: number; // calculated from biserial
  };
  error: {
    difficultyMAE: number;
    discriminationMAE: number;
  };
}

export class BootstrapValidator {
  /**
   * Load ENAMED microdata from file
   */
  private loadENAMEDMicrodata(microDataPath: string): Map<number, any> {
    const data = new Map<number, any>();

    try {
      const content = readFileSync(microDataPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        // Skip header
        if (line.includes('NU_ITEM')) continue;

        const parts = line.split(';');
        if (parts.length >= 7) {
          const itemNumber = parseInt(parts[0]);
          const kept = parseInt(parts[2]);
          const difficulty = parseFloat(parts[3]);
          const biserial = parseFloat(parts[4]);

          if (kept === 1 && !isNaN(difficulty)) {
            data.set(itemNumber, {
              number: itemNumber,
              difficulty,
              biserial: biserial || 0,
              infit: parseFloat(parts[5]) || 1.0,
              outfit: parseFloat(parts[6]) || 1.0,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to load microdata: ${err}`);
    }

    return data;
  }

  /**
   * Analyze validation results and calculate statistics
   */
  async validateEstimates(
    estimatedQuestions: Map<number, any>,
    empiricalData: Map<number, any>
  ): Promise<{
    results: ValidationResult[];
    statistics: {
      difficultyMAE: number;
      difficultyRMSE: number;
      difficultyCorrelation: number;
      discriminationMAE: number;
      discriminationRMSE: number;
      discriminationCorrelation: number;
      coverageRate: number;
    };
  }> {
    const results: ValidationResult[] = [];
    const difficultyErrors: number[] = [];
    const discriminationErrors: number[] = [];
    const difficultyPairs: Array<{ est: number; emp: number }> = [];
    const discriminationPairs: Array<{ est: number; emp: number }> = [];

    for (const [position, estimated] of estimatedQuestions) {
      const empirical = empiricalData.get(position);

      if (!empirical) continue;

      // Calculate discrimination from biserial
      const K_FACTOR = 3.0;
      const empiricalDiscrimination =
        Math.abs(empirical.biserial) >= 0.05
          ? Math.max(0.3, Math.min(2.5, Math.abs(empirical.biserial) * K_FACTOR))
          : 1.0;

      const diffError = Math.abs(estimated.difficulty - empirical.difficulty);
      const discError = Math.abs(
        estimated.discrimination - empiricalDiscrimination
      );

      difficultyErrors.push(diffError);
      discriminationErrors.push(discError);

      difficultyPairs.push({
        est: estimated.difficulty,
        emp: empirical.difficulty,
      });

      discriminationPairs.push({
        est: estimated.discrimination,
        emp: empiricalDiscrimination,
      });

      results.push({
        questionId: `enamed-2025-${position}`,
        year: 2025,
        position,
        estimated: {
          difficulty: estimated.difficulty,
          discrimination: estimated.discrimination,
        },
        empirical: {
          difficulty: empirical.difficulty,
          biserial: empirical.biserial,
          discriminationEst: empiricalDiscrimination,
        },
        error: {
          difficultyMAE: diffError,
          discriminationMAE: discError,
        },
      });
    }

    // Calculate statistics
    const difficultyMAE =
      difficultyErrors.reduce((a, b) => a + b, 0) / difficultyErrors.length;
    const discriminationMAE =
      discriminationErrors.reduce((a, b) => a + b, 0) /
      discriminationErrors.length;

    // RMSE
    const difficultyMSE = difficultyErrors.reduce(
      (sum, err) => sum + err * err,
      0
    ) / difficultyErrors.length;
    const discriminationMSE = discriminationErrors.reduce(
      (sum, err) => sum + err * err,
      0
    ) / discriminationErrors.length;

    const difficultyRMSE = Math.sqrt(difficultyMSE);
    const discriminationRMSE = Math.sqrt(discriminationMSE);

    // Pearson correlation
    const difficultyCorr = this.calculateCorrelation(difficultyPairs);
    const discriminationCorr = this.calculateCorrelation(discriminationPairs);

    return {
      results,
      statistics: {
        difficultyMAE,
        difficultyRMSE,
        difficultyCorrelation: difficultyCorr,
        discriminationMAE,
        discriminationRMSE,
        discriminationCorrelation: discriminationCorr,
        coverageRate: results.length / estimatedQuestions.size,
      },
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(
    pairs: Array<{ est: number; emp: number }>
  ): number {
    if (pairs.length < 2) return 0;

    const estMean = pairs.reduce((sum, p) => sum + p.est, 0) / pairs.length;
    const empMean = pairs.reduce((sum, p) => sum + p.emp, 0) / pairs.length;

    let numerator = 0;
    let estVar = 0;
    let empVar = 0;

    for (const { est, emp } of pairs) {
      const estDev = est - estMean;
      const empDev = emp - empMean;
      numerator += estDev * empDev;
      estVar += estDev * estDev;
      empVar += empDev * empDev;
    }

    if (estVar === 0 || empVar === 0) return 0;

    return numerator / Math.sqrt(estVar * empVar);
  }

  /**
   * Generate validation report
   */
  generateReport(validation: {
    results: ValidationResult[];
    statistics: any;
  }): string {
    const lines: string[] = [];

    lines.push('╔════════════════════════════════════════════════════════════╗');
    lines.push('║          IRT Estimation Bootstrap Validation Report        ║');
    lines.push('║                      ENAMED 2025 Data                      ║');
    lines.push('╚════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push('SUMMARY STATISTICS');
    lines.push('─'.repeat(60));
    lines.push(`Questions Validated: ${validation.results.length}/90`);
    lines.push(
      `Coverage Rate: ${(validation.statistics.coverageRate * 100).toFixed(1)}%`
    );
    lines.push('');

    lines.push('DIFFICULTY PARAMETER');
    lines.push('─'.repeat(60));
    lines.push(
      `Mean Absolute Error (MAE): ${validation.statistics.difficultyMAE.toFixed(3)}`
    );
    lines.push(
      `Root Mean Square Error (RMSE): ${validation.statistics.difficultyRMSE.toFixed(3)}`
    );
    lines.push(
      `Pearson Correlation: ${validation.statistics.difficultyCorrelation.toFixed(3)}`
    );
    lines.push('');

    lines.push('DISCRIMINATION PARAMETER');
    lines.push('─'.repeat(60));
    lines.push(
      `Mean Absolute Error (MAE): ${validation.statistics.discriminationMAE.toFixed(3)}`
    );
    lines.push(
      `Root Mean Square Error (RMSE): ${validation.statistics.discriminationRMSE.toFixed(3)}`
    );
    lines.push(
      `Pearson Correlation: ${validation.statistics.discriminationCorrelation.toFixed(3)}`
    );
    lines.push('');

    lines.push('VALIDATION TARGETS');
    lines.push('─'.repeat(60));
    const diffTarget = validation.statistics.difficultyMAE < 0.3 ? '✓' : '✗';
    const corrTarget =
      validation.statistics.difficultyCorrelation > 0.7 ? '✓' : '✗';
    const discTarget =
      validation.statistics.discriminationCorrelation > 0.6 ? '✓' : '✗';

    lines.push(
      `${diffTarget} Difficulty MAE < 0.3: ${validation.statistics.difficultyMAE.toFixed(3)}`
    );
    lines.push(
      `${corrTarget} Difficulty Correlation > 0.7: ${validation.statistics.difficultyCorrelation.toFixed(3)}`
    );
    lines.push(
      `${discTarget} Discrimination Correlation > 0.6: ${validation.statistics.discriminationCorrelation.toFixed(3)}`
    );
    lines.push('');

    // Top errors
    const sortedByDiffError = validation.results.sort(
      (a, b) => b.error.difficultyMAE - a.error.difficultyMAE
    );

    lines.push('TOP 10 DIFFICULTY ESTIMATION ERRORS');
    lines.push('─'.repeat(60));
    for (let i = 0; i < Math.min(10, sortedByDiffError.length); i++) {
      const r = sortedByDiffError[i];
      lines.push(`Q${r.position}:`);
      lines.push(
        `  Estimated: ${r.estimated.difficulty.toFixed(3)}, Empirical: ${r.empirical.difficulty.toFixed(3)}, Error: ${r.error.difficultyMAE.toFixed(3)}`
      );
    }
    lines.push('');

    lines.push('RECOMMENDATIONS');
    lines.push('─'.repeat(60));

    if (validation.statistics.difficultyMAE > 0.3) {
      lines.push('⚠️  Difficulty estimation needs tuning');
      lines.push('   - Review institutionAdj coefficients');
      lines.push('   - Check yearDrift factor');
      lines.push('   - Validate examTypeAdj values');
    } else {
      lines.push('✓  Difficulty estimation is well-calibrated');
    }

    if (validation.statistics.discriminationCorrelation < 0.6) {
      lines.push(
        '⚠️  Discrimination estimation correlation is low (<0.6)'
      );
      lines.push('   - Review institutionMultiplier values');
      lines.push('   - Check examTypeMultiplier settings');
    } else {
      lines.push('✓  Discrimination estimation has good correlation');
    }

    lines.push('');

    return lines.join('\n');
  }
}

/**
 * Main: Run bootstrap validation
 */
async function main() {
  const validator = new BootstrapValidator();

  console.log('🔍 Running Bootstrap Validation on ENAMED 2025...');
  console.log('');

  // This would normally load from database or files
  // For now, create mock data to demonstrate
  const estimatedQuestions = new Map<number, any>();
  const empiricalData = new Map<number, any>();

  // In production, load from:
  // 1. Questions table (irt_difficulty, irt_discrimination from metadata estimation)
  // 2. ENAMED microdata file (difficulty from INEP, biserial)

  // Mock data example:
  for (let i = 1; i <= 90; i++) {
    // Estimated from metadata
    estimatedQuestions.set(i, {
      difficulty: (i - 45) * 0.1, // Simple model
      discrimination: 1.0 + Math.random() * 0.2 - 0.1,
    });

    // Empirical from microdata
    empiricalData.set(i, {
      number: i,
      difficulty: (i - 45) * 0.09 + (Math.random() * 0.2 - 0.1), // Similar with noise
      biserial: 0.3 + Math.random() * 0.2,
      infit: 1.0,
      outfit: 1.0,
    });
  }

  const validation = await validator.validateEstimates(
    estimatedQuestions,
    empiricalData
  );

  const report = validator.generateReport(validation);
  console.log(report);

  // Export detailed results
  console.log('');
  console.log('Detailed validation results (CSV format):');
  console.log(
    'QuestionID,EstimatedDifficulty,EmpiricalDifficulty,DifficultyError,EstimatedDiscrimination,EmpiricalDiscrimination,DiscriminationError'
  );
  for (const result of validation.results) {
    console.log(
      `${result.questionId},${result.estimated.difficulty.toFixed(3)},${result.empirical.difficulty.toFixed(3)},${result.error.difficultyMAE.toFixed(3)},${result.estimated.discrimination.toFixed(3)},${result.empirical.discriminationEst.toFixed(3)},${result.error.discriminationMAE.toFixed(3)}`
    );
  }
}

main().catch((err) => {
  console.error('Bootstrap validation failed:', err);
  process.exit(1);
});
