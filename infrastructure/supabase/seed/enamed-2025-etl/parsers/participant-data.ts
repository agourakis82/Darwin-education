/**
 * Parser for ENAMED 2025 participant data files
 * Reads ENADE and Demais Participantes data
 */

import { createReadStream, readdirSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import {
  ENADE_DATA_DIR,
  DEMAIS_DATA_DIR,
  FILE_DELIMITER,
  PARTICIPANT_CODES,
} from '../config';
import type { RawParticipantData, ProcessedParticipant } from '../types';

// Column indices for the main performance data file (arq1 for Demais, arq3 for ENADE)
const COLUMNS = {
  NU_ANO: 0,
  TP_INSCRICAO: 1,
  CO_CADERNO: 2,
  NU_ITEM: 3,
  NU_ITEM_Z: 4,
  NU_ITEM_X: 5,
  DS_VT_GAB_OBJ: 6,
  DS_VT_ACE_OBJ: 7,
  DS_VT_ESC_OBJ: 8,
  TP_PR_GER: 9,
  PROFICIENCIA: 10,
  NT_GER: 11,
  QT_ACERTO_AREA_1: 12,
  QT_ACERTO_AREA_2: 13,
  QT_ACERTO_AREA_3: 14,
  QT_ACERTO_AREA_4: 15,
  QT_ACERTO_AREA_5: 16,
};

/**
 * Parse a single line from participant data file
 */
function parseLine(line: string): RawParticipantData | null {
  const parts = line.split(FILE_DELIMITER);

  if (parts.length < 17) {
    return null;
  }

  const proficiencia = parts[COLUMNS.PROFICIENCIA];
  const ntGer = parts[COLUMNS.NT_GER];

  return {
    NU_ANO: parseInt(parts[COLUMNS.NU_ANO], 10),
    TP_INSCRICAO: parseInt(parts[COLUMNS.TP_INSCRICAO], 10),
    CO_CADERNO: parseInt(parts[COLUMNS.CO_CADERNO], 10),
    NU_ITEM: parseInt(parts[COLUMNS.NU_ITEM], 10),
    DS_VT_GAB_OBJ: parts[COLUMNS.DS_VT_GAB_OBJ],
    DS_VT_ACE_OBJ: parts[COLUMNS.DS_VT_ACE_OBJ],
    DS_VT_ESC_OBJ: parts[COLUMNS.DS_VT_ESC_OBJ],
    TP_PR_GER: parseInt(parts[COLUMNS.TP_PR_GER], 10),
    PROFICIENCIA: proficiencia && proficiencia !== '' ? parseFloat(proficiencia) : null,
    NT_GER: ntGer && ntGer !== '' ? parseFloat(ntGer) : null,
    QT_ACERTO_AREA_1: parseInt(parts[COLUMNS.QT_ACERTO_AREA_1], 10) || 0,
    QT_ACERTO_AREA_2: parseInt(parts[COLUMNS.QT_ACERTO_AREA_2], 10) || 0,
    QT_ACERTO_AREA_3: parseInt(parts[COLUMNS.QT_ACERTO_AREA_3], 10) || 0,
    QT_ACERTO_AREA_4: parseInt(parts[COLUMNS.QT_ACERTO_AREA_4], 10) || 0,
    QT_ACERTO_AREA_5: parseInt(parts[COLUMNS.QT_ACERTO_AREA_5], 10) || 0,
  };
}

/**
 * Parse response vectors to boolean array
 * @param answerKey - 100-char answer key (A/B/C/D/6)
 * @param responses - 100-char student responses (A/B/C/D/8/9)
 * @param scores - 100-char score vector (1/0/.)
 */
export function parseResponses(
  answerKey: string,
  responses: string,
  scores: string
): { responses: boolean[]; validCount: number } {
  const result: boolean[] = [];
  let validCount = 0;

  for (let i = 0; i < Math.min(100, scores.length); i++) {
    const score = scores[i];

    // '1' = correct, '0' = incorrect, '.' = not applicable
    if (score === '1') {
      result.push(true);
      validCount++;
    } else if (score === '0') {
      result.push(false);
      validCount++;
    }
    // Skip '.' entries (invalid/not scored)
  }

  return { responses: result, validCount };
}

/**
 * Process raw participant data into usable format
 */
export function processParticipant(raw: RawParticipantData): ProcessedParticipant {
  const { responses, validCount } = parseResponses(
    raw.DS_VT_GAB_OBJ,
    raw.DS_VT_ACE_OBJ,
    raw.DS_VT_ESC_OBJ
  );

  return {
    inscriptionType: raw.TP_INSCRICAO === 0 ? 'enade' : 'demais',
    examVersion: raw.CO_CADERNO as 1 | 2,
    responses,
    officialTheta: raw.PROFICIENCIA,
    officialScaledScore: raw.NT_GER,
    areaCorrect: {
      1: raw.QT_ACERTO_AREA_1,
      2: raw.QT_ACERTO_AREA_2,
      3: raw.QT_ACERTO_AREA_3,
      4: raw.QT_ACERTO_AREA_4,
      5: raw.QT_ACERTO_AREA_5,
    },
    isValid: raw.TP_PR_GER === PARTICIPANT_CODES.VALID_COMPLETION,
  };
}

/**
 * Find the main performance data file for a directory
 * For ENADE: arq3.txt, for Demais: arq1.txt
 */
function findPerformanceFile(dir: string, type: 'enade' | 'demais'): string | null {
  const files = readdirSync(dir);
  const targetSuffix = type === 'enade' ? '_arq3.txt' : '_arq1.txt';

  const performanceFile = files.find((f) => f.endsWith(targetSuffix));
  return performanceFile ? path.join(dir, performanceFile) : null;
}

/**
 * Stream participants from a file with optional limit
 */
export async function* streamParticipants(
  filePath: string,
  limit?: number
): AsyncGenerator<RawParticipantData> {
  const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  let count = 0;

  for await (const line of rl) {
    // Skip header
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    if (!line.trim()) continue;

    const participant = parseLine(line);
    if (participant && participant.NU_ANO === 2025) {
      yield participant;
      count++;

      if (limit && count >= limit) {
        break;
      }
    }
  }
}

/**
 * Parse all ENADE participants
 */
export async function parseEnadeParticipants(
  limit?: number
): Promise<ProcessedParticipant[]> {
  const filePath = findPerformanceFile(ENADE_DATA_DIR, 'enade');
  if (!filePath) {
    throw new Error(`ENADE performance file not found in ${ENADE_DATA_DIR}`);
  }

  const participants: ProcessedParticipant[] = [];

  for await (const raw of streamParticipants(filePath, limit)) {
    const processed = processParticipant(raw);
    if (processed.isValid && processed.officialTheta !== null) {
      participants.push(processed);
    }
  }

  return participants;
}

/**
 * Parse all Demais Participantes
 */
export async function parseDemaisParticipants(
  limit?: number
): Promise<ProcessedParticipant[]> {
  const filePath = findPerformanceFile(DEMAIS_DATA_DIR, 'demais');
  if (!filePath) {
    throw new Error(`Demais performance file not found in ${DEMAIS_DATA_DIR}`);
  }

  const participants: ProcessedParticipant[] = [];

  for await (const raw of streamParticipants(filePath, limit)) {
    const processed = processParticipant(raw);
    if (processed.isValid && processed.officialTheta !== null) {
      participants.push(processed);
    }
  }

  return participants;
}

/**
 * Get participant statistics
 */
export function getParticipantStatistics(participants: ProcessedParticipant[]): {
  total: number;
  valid: number;
  withScores: number;
  byType: Record<string, number>;
  byVersion: Record<number, number>;
  thetaRange: { min: number; max: number };
} {
  const withScores = participants.filter((p) => p.officialTheta !== null);
  const thetas = withScores.map((p) => p.officialTheta!);

  const byType = participants.reduce(
    (acc, p) => {
      acc[p.inscriptionType] = (acc[p.inscriptionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const byVersion = participants.reduce(
    (acc, p) => {
      acc[p.examVersion] = (acc[p.examVersion] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return {
    total: participants.length,
    valid: participants.filter((p) => p.isValid).length,
    withScores: withScores.length,
    byType,
    byVersion,
    thetaRange: {
      min: thetas.length > 0 ? Math.min(...thetas) : 0,
      max: thetas.length > 0 ? Math.max(...thetas) : 0,
    },
  };
}
