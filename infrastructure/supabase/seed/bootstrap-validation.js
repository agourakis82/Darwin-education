/**
 * Bootstrap Validation Script
 * Compares metadata-based IRT estimates against ENAMED empirical data
 * Used to tune IRT_ESTIMATION_CONFIG coefficients
 */

const { readFileSync } = require('fs');
const { join } = require('path');

class BootstrapValidator {
  /**
   * Load ENAMED microdata from file
   */
  loadENAMEDMicrodata(microDataPath) {
    const data = new Map();

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
  async validateEstimates(estimatedQuestions, empiricalData) {
    const results = [];
    const difficultyErrors = [];
    const discriminationErrors = [];
    const difficultyPairs = [];
    const discriminationPairs = [];

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
  calculateCorrelation(pairs) {
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
  generateReport(validation) {
    const lines = [];

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
 * IRT Estimation Config (Conservative Phase 1 tuning)
 * Based on bootstrap validation against ENAMED 2025 microdata
 *
 * Phase 1 Strategy: Modest increases pending polynomial fitting
 * - Institution: 0.4 → 0.6 (conservative)
 * - Position: 0.3 → 0.5 (conservative pending non-linear model)
 * - Area: selective refinement (don't over-correct)
 */
const IRT_ESTIMATION_CONFIG = {
  difficulty: {
    baseValue: 0.0,
    minValue: -2.5,
    maxValue: 2.5,
    institutionAdjustment: {
      TIER_1_NATIONAL: 0.6,  // Was 0.4 — modest increase
    },
    yearDriftPerYear: 0.12, // Was 0.1
    examTypeAdjustment: {
      'national': 0.3,  // Was 0.2
    },
    positionMaxAdjustment: 0.5,  // Was 0.3 — modest increase
    areaAdjustment: {
      'clinica_medica': 0.05,   // Was 0.0
      'cirurgia': -0.1,         // Was 0.15 (reduced)
      'ginecologia_obstetricia': 0.05, // Was 0.1
      'pediatria': -0.05,       // Was 0.05
      'saude_coletiva': 0.0,    // Was -0.15
    },
  },
  discrimination: {
    baseValue: 1.0,
    minValue: 0.6,
    maxValue: 1.6,
    institutionMultiplier: {
      TIER_1_NATIONAL: 1.22,  // Was 1.2
    },
    examTypeMultiplier: {
      'national': 1.2,  // Was 1.15
    },
  },
  guessing: {
    optionCountMap: {
      4: 0.25,
      5: 0.2,
    },
  },
};

/**
 * Estimate IRT from metadata (same as in packages/shared)
 */
function estimateIRTFromMetadata(metadata) {
  let difficulty = IRT_ESTIMATION_CONFIG.difficulty.baseValue;

  // Institution adjustment
  const institutionAdj = IRT_ESTIMATION_CONFIG.difficulty.institutionAdjustment['TIER_1_NATIONAL'] || 0;
  difficulty += institutionAdj;

  // Year drift (relative to 2024)
  const yearsSince2024 = 2024 - metadata.year;
  const yearAdj = yearsSince2024 * IRT_ESTIMATION_CONFIG.difficulty.yearDriftPerYear;
  difficulty += yearAdj;

  // Exam type
  const examAdj = IRT_ESTIMATION_CONFIG.difficulty.examTypeAdjustment['national'] || 0;
  difficulty += examAdj;

  // Position (linear interpolation)
  const positionRatio = (metadata.questionPosition - 1) / (metadata.totalQuestionsInExam - 1);
  const positionAdj = (positionRatio - 0.5) * 2 * IRT_ESTIMATION_CONFIG.difficulty.positionMaxAdjustment;
  difficulty += positionAdj;

  // Area
  if (metadata.area) {
    const areaAdj = IRT_ESTIMATION_CONFIG.difficulty.areaAdjustment[metadata.area] || 0;
    difficulty += areaAdj;
  }

  // Clamp
  difficulty = Math.max(
    IRT_ESTIMATION_CONFIG.difficulty.minValue,
    Math.min(IRT_ESTIMATION_CONFIG.difficulty.maxValue, difficulty)
  );

  // Discrimination
  let discrimination = IRT_ESTIMATION_CONFIG.discrimination.baseValue;
  const instMult = IRT_ESTIMATION_CONFIG.discrimination.institutionMultiplier['TIER_1_NATIONAL'] || 1.0;
  discrimination *= instMult;
  const examMult = IRT_ESTIMATION_CONFIG.discrimination.examTypeMultiplier['national'] || 1.0;
  discrimination *= examMult;
  discrimination = Math.max(
    IRT_ESTIMATION_CONFIG.discrimination.minValue,
    Math.min(IRT_ESTIMATION_CONFIG.discrimination.maxValue, discrimination)
  );

  // Guessing
  const guessing = IRT_ESTIMATION_CONFIG.guessing.optionCountMap[4] || 0.25;

  return { difficulty, discrimination, guessing };
}

/**
 * Main: Run bootstrap validation
 */
async function main() {
  const validator = new BootstrapValidator();

  console.log('🔍 Running Bootstrap Validation on ENAMED 2025...');
  console.log('');

  // Load empirical data from microdata file
  const microDataPath = join(
    '/home/demetrios/Darwin-education/microdados_enamed_2025_19-01-26/DADOS',
    'microdados2025_parametros_itens.txt'
  );
  const empiricalData = validator.loadENAMEDMicrodata(microDataPath);

  console.log(`✓ Loaded ${empiricalData.size} items from ENAMED microdata`);

  // Generate estimated questions using metadata-based IRT
  // ENAMED 2025 metadata: 90 questions, 5 areas
  const areas = [
    'clinica_medica',
    'cirurgia',
    'ginecologia_obstetricia',
    'pediatria',
    'saude_coletiva',
  ];
  const estimatedQuestions = new Map();

  for (let position = 1; position <= 90; position++) {
    // Determine area based on position (18 questions per area)
    const areaIndex = Math.floor((position - 1) / 18);
    const area = areas[Math.min(areaIndex, areas.length - 1)];

    const metadata = {
      institution: 'INEP',
      institutionTier: 'TIER_1_NATIONAL',
      year: 2025,
      examType: 'national',
      questionPosition: position,
      totalQuestionsInExam: 90,
      area,
      optionCount: 4,
    };

    const irt = estimateIRTFromMetadata(metadata);
    estimatedQuestions.set(position, {
      position,
      difficulty: irt.difficulty,
      discrimination: irt.discrimination,
      area,
    });
  }

  console.log(`✓ Generated estimated IRT parameters for 90 ENAMED questions`);
  console.log('');

  // Run validation
  const validation = await validator.validateEstimates(
    estimatedQuestions,
    empiricalData
  );

  const report = validator.generateReport(validation);
  console.log(report);

  // Detailed tuning analysis
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              DETAILED TUNING ANALYSIS                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Analyze by area
  console.log('DIFFICULTY ESTIMATION BY AREA');
  console.log('─'.repeat(60));
  const byArea = new Map();
  for (const result of validation.results) {
    if (!byArea.has(result.estimated?.area || 'unknown')) {
      byArea.set(result.estimated?.area || 'unknown', { errors: [], results: [] });
    }
    const entry = byArea.get(result.estimated?.area || 'unknown');
    entry.errors.push(result.error.difficultyMAE);
    entry.results.push(result);
  }

  for (const [area, data] of byArea) {
    const mae = data.errors.reduce((a, b) => a + b, 0) / data.errors.length;
    console.log(
      `${area.padEnd(25)} | MAE: ${mae.toFixed(3)} | N=${data.results.length}`
    );
  }
  console.log('');

  // Analyze by position
  console.log('POSITION-BASED ANALYSIS (Quartiles)');
  console.log('─'.repeat(60));
  const byQuartile = new Map();
  for (let q = 0; q < 4; q++) {
    byQuartile.set(q, { errors: [], results: [] });
  }
  for (const result of validation.results) {
    const quartile = Math.floor((result.position - 1) / 23); // 90 questions / 4 quartiles
    const entry = byQuartile.get(quartile);
    entry.errors.push(result.error.difficultyMAE);
    entry.results.push(result);
  }

  for (let q = 0; q < 4; q++) {
    const data = byQuartile.get(q);
    if (data.errors.length === 0) continue;
    const mae = data.errors.reduce((a, b) => a + b, 0) / data.errors.length;
    const minPos = q * 23 + 1;
    const maxPos = Math.min((q + 1) * 23, 90);
    console.log(
      `Q${minPos}-Q${maxPos} (Quartile ${q + 1}) | MAE: ${mae.toFixed(3)} | N=${data.results.length}`
    );
  }
  console.log('');

  // Detailed recommendations
  console.log('TUNING RECOMMENDATIONS');
  console.log('─'.repeat(60));

  if (validation.statistics.difficultyMAE > 0.5) {
    console.log('🔴 DIFFICULTY ESTIMATION NEEDS SIGNIFICANT TUNING');
    console.log(
      `   Current MAE: ${validation.statistics.difficultyMAE.toFixed(3)} (target < 0.3)`
    );
    console.log('');
    console.log('   Action Items:');
    console.log('   1. INCREASE institutionAdjustment (TIER_1_NATIONAL)');
    console.log(
      '      - Current: +0.4, Try: +0.6 to +0.8 (ENAMED is highly selective)'
    );
    console.log(
      '   2. REVIEW yearDriftPerYear (currently +0.1 per year back)'
    );
    console.log('      - Check if 2025 questions are actually harder');
    console.log('   3. ADJUST positionMaxAdjustment');
    console.log('      - Check if early questions truly easier (linear model may be wrong)');
    console.log('   4. VALIDATE areaAdjustment coefficients');
    console.log('      - Ensure area-specific adjustments match empirical data');
  } else if (validation.statistics.difficultyMAE > 0.3) {
    console.log('🟡 DIFFICULTY ESTIMATION COULD USE FINE-TUNING');
    console.log(
      `   Current MAE: ${validation.statistics.difficultyMAE.toFixed(3)} (target < 0.3)`
    );
    console.log('   - Small adjustments to coefficients may help');
  } else {
    console.log('🟢 DIFFICULTY ESTIMATION IS WELL-CALIBRATED');
    console.log(
      `   MAE: ${validation.statistics.difficultyMAE.toFixed(3)} (target < 0.3) ✓`
    );
  }

  console.log('');

  if (
    validation.statistics.discriminationCorrelation < 0.5 ||
    validation.statistics.discriminationMAE > 0.3
  ) {
    console.log(
      '🔴 DISCRIMINATION ESTIMATION NEEDS SIGNIFICANT TUNING'
    );
    console.log(
      `   Correlation: ${validation.statistics.discriminationCorrelation.toFixed(3)} (target > 0.6)`
    );
    console.log(`   MAE: ${validation.statistics.discriminationMAE.toFixed(3)}`);
    console.log('');
    console.log('   Action Items:');
    console.log('   1. INCREASE institutionMultiplier (TIER_1_NATIONAL)');
    console.log(
      '      - Current: 1.2, Try: 1.3 to 1.4 (ENAMED questions discriminate well)'
    );
    console.log('   2. INCREASE examTypeMultiplier (national)');
    console.log(
      '      - Current: 1.15, Try: 1.25 to 1.35 (national exams typically better)'
    );
    console.log('   3. VALIDATE K_FACTOR in biserial-to-discrimination conversion');
    console.log(
      '      - Current K_FACTOR: 3.0 in correlation calculation'
    );
  } else if (
    validation.statistics.discriminationCorrelation < 0.6 ||
    validation.statistics.discriminationMAE > 0.25
  ) {
    console.log('🟡 DISCRIMINATION ESTIMATION COULD USE FINE-TUNING');
    console.log(
      `   Correlation: ${validation.statistics.discriminationCorrelation.toFixed(3)} (target > 0.6)`
    );
  } else {
    console.log('🟢 DISCRIMINATION ESTIMATION HAS GOOD CORRELATION');
    console.log(
      `   Correlation: ${validation.statistics.discriminationCorrelation.toFixed(3)} (target > 0.6) ✓`
    );
  }

  console.log('');

  // CSV export
  console.log('Detailed validation results (CSV format):');
  console.log(
    'QuestionID,Position,Area,EstimatedDifficulty,EmpiricalDifficulty,DifficultyError,EstimatedDiscrimination,EmpiricalDiscrimination,DiscriminationError'
  );
  for (const result of validation.results) {
    const area = estimatedQuestions.get(result.position)?.area || 'unknown';
    console.log(
      `${result.questionId},${result.position},${area},${result.estimated.difficulty.toFixed(
        3
      )},${result.empirical.difficulty.toFixed(
        3
      )},${result.error.difficultyMAE.toFixed(
        3
      )},${result.estimated.discrimination.toFixed(
        3
      )},${result.empirical.discriminationEst.toFixed(
        3
      )},${result.error.discriminationMAE.toFixed(3)}`
    );
  }
}

main().catch((err) => {
  console.error('Bootstrap validation failed:', err);
  process.exit(1);
});
