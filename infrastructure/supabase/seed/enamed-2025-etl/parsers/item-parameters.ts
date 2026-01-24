/**
 * Parser for ENAMED 2025 item parameters file
 * Reads microdados2025_parametros_itens.txt
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { ITEM_PARAMS_FILE, FILE_DELIMITER } from '../config';
import type { RawItemParameters, ProcessedItemParameters } from '../types';
import { estimateDiscrimination } from '../transformers/irt-estimator';

/**
 * Parse a single line from the item parameters file
 */
function parseLine(line: string): RawItemParameters | null {
  const parts = line.split(FILE_DELIMITER);

  if (parts.length < 7) {
    return null;
  }

  const [
    nuItemProva1,
    nuItemProva2,
    itemMantido,
    parametroB,
    corBisserial,
    infit,
    outfit,
  ] = parts;

  return {
    NU_ITEM_PROVA_1: parseInt(nuItemProva1, 10),
    NU_ITEM_PROVA_2: parseInt(nuItemProva2, 10),
    ITEM_MANTIDO: parseInt(itemMantido, 10) as 0 | 1,
    PARAMETRO_B: parametroB ? parseFloat(parametroB) : null,
    COR_BISSERIAL: corBisserial ? parseFloat(corBisserial) : null,
    INFIT: infit ? parseFloat(infit) : null,
    OUTFIT: outfit ? parseFloat(outfit) : null,
  };
}

/**
 * Read and parse all item parameters from file
 */
export async function parseItemParameters(): Promise<RawItemParameters[]> {
  const items: RawItemParameters[] = [];
  let isFirstLine = true;

  const fileStream = createReadStream(ITEM_PARAMS_FILE, { encoding: 'utf-8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Skip header line
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    if (!line.trim()) continue;

    const item = parseLine(line);
    if (item && !isNaN(item.NU_ITEM_PROVA_1)) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Process raw parameters to add estimated discrimination
 */
export function processItemParameters(
  rawItems: RawItemParameters[]
): ProcessedItemParameters[] {
  return rawItems.map((item) => {
    const { discrimination, source } = estimateDiscrimination(
      item.COR_BISSERIAL
    );

    return {
      ...item,
      estimatedDiscrimination: discrimination,
      discriminationSource: source,
      guessing: 0.25, // Fixed for 4-option MC
    };
  });
}

/**
 * Get only valid (maintained) items
 */
export function getValidItems(
  items: ProcessedItemParameters[]
): ProcessedItemParameters[] {
  return items.filter((item) => item.ITEM_MANTIDO === 1);
}

/**
 * Get items by exam version
 */
export function getItemsByVersion(
  items: ProcessedItemParameters[],
  version: 1 | 2
): Map<number, ProcessedItemParameters> {
  const map = new Map<number, ProcessedItemParameters>();

  for (const item of items) {
    const itemNumber =
      version === 1 ? item.NU_ITEM_PROVA_1 : item.NU_ITEM_PROVA_2;
    map.set(itemNumber, item);
  }

  return map;
}

/**
 * Generate statistics about item parameters
 */
export function getItemStatistics(items: ProcessedItemParameters[]): {
  total: number;
  valid: number;
  excluded: number;
  difficultyRange: { min: number; max: number };
  discriminationRange: { min: number; max: number };
  biserialStats: { min: number; max: number; missing: number };
} {
  const validItems = items.filter((i) => i.ITEM_MANTIDO === 1);
  const difficulties = validItems
    .map((i) => i.PARAMETRO_B)
    .filter((b): b is number => b !== null);
  const discriminations = validItems.map((i) => i.estimatedDiscrimination);
  const biserials = items.map((i) => i.COR_BISSERIAL);

  return {
    total: items.length,
    valid: validItems.length,
    excluded: items.length - validItems.length,
    difficultyRange: {
      min: Math.min(...difficulties),
      max: Math.max(...difficulties),
    },
    discriminationRange: {
      min: Math.min(...discriminations),
      max: Math.max(...discriminations),
    },
    biserialStats: {
      min: Math.min(...biserials.filter((b): b is number => b !== null)),
      max: Math.max(...biserials.filter((b): b is number => b !== null)),
      missing: biserials.filter((b) => b === null).length,
    },
  };
}
