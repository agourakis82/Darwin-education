#!/usr/bin/env node
/**
 * Simple test to verify IRT parameter parsing works
 * Run: node test-parse.mjs
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ITEM_PARAMS_FILE = path.resolve(
  __dirname,
  '../../../../microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt'
);

console.log('\n╔════════════════════════════════════════════╗');
console.log('║ ENAMED 2025 IRT Parameter Parser Test      ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log(`Reading: ${ITEM_PARAMS_FILE}\n`);

let lineCount = 0;
let validItems = 0;
let excludedItems = 0;
let difficulties = [];
let biserials = [];

const fileStream = createReadStream(ITEM_PARAMS_FILE, { encoding: 'utf-8' });
const rl = createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let isFirstLine = true;

rl.on('line', (line) => {
  if (isFirstLine) {
    isFirstLine = false;
    console.log(`Header: ${line}`);
    return;
  }

  if (!line.trim()) return;

  lineCount++;
  const parts = line.split(';');

  if (parts.length >= 7) {
    const [nuItem1, nuItem2, itemMantido, paramB, corBis, infit, outfit] = parts;

    const kept = parseInt(itemMantido, 10);
    const difficulty = paramB ? parseFloat(paramB) : null;
    const biserial = corBis ? parseFloat(corBis) : null;

    if (kept === 1) {
      validItems++;
      if (difficulty !== null) {
        difficulties.push(difficulty);
      }
    } else {
      excludedItems++;
    }

    if (biserial !== null) {
      biserials.push(biserial);
    }

    // Print first 5 items
    if (lineCount <= 5) {
      console.log(`Item ${lineCount}: Q${nuItem1} (b=${difficulty?.toFixed(4)} | biserial=${biserial?.toFixed(4)} | kept=${kept})`);
    }
  }
});

rl.on('close', () => {
  console.log('\n─────────────────────────────────────────────');
  console.log(`Total items: ${lineCount}`);
  console.log(`Valid items: ${validItems}`);
  console.log(`Excluded items: ${excludedItems}`);

  if (difficulties.length > 0) {
    const minDiff = Math.min(...difficulties);
    const maxDiff = Math.max(...difficulties);
    const avgDiff = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
    console.log(`\nDifficulty (b):`);
    console.log(`  Min: ${minDiff.toFixed(4)}`);
    console.log(`  Max: ${maxDiff.toFixed(4)}`);
    console.log(`  Avg: ${avgDiff.toFixed(4)}`);
  }

  if (biserials.length > 0) {
    const minBis = Math.min(...biserials);
    const maxBis = Math.max(...biserials);
    const avgBis = biserials.reduce((a, b) => a + b, 0) / biserials.length;
    console.log(`\nBiserial correlation:`);
    console.log(`  Min: ${minBis.toFixed(4)}`);
    console.log(`  Max: ${maxBis.toFixed(4)}`);
    console.log(`  Avg: ${avgBis.toFixed(4)}`);
  }

  console.log('─────────────────────────────────────────────\n');
  console.log('✓ Parse test completed successfully!\n');
});

rl.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});
