#!/usr/bin/env node
/**
 * Download ENAMED 2025 PDFs from INEP portal
 * Standalone Node.js script (no dependencies)
 *
 * Run: node download-pdfs.mjs
 */

import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'outputs', 'pdfs');

// Known ENAMED 2025 PDF URLs
const URLS = {
  caderno1: 'https://download.inep.gov.br/enamed/provas/2025/ENAMED_2025_CADERNO_1.pdf',
  caderno2: 'https://download.inep.gov.br/enamed/provas/2025/ENAMED_2025_CADERNO_2.pdf',
  gabarito: 'https://download.inep.gov.br/enamed/gabaritos/2025/ENAMED_2025_GABARITO.pdf',
};

// Alternative URLs as fallback
const ALTERNATIVE_URLS = {
  caderno1: 'https://www.gov.br/inep/pt-br/arquivos/provas/enamed/2025/caderno-1.pdf',
  caderno2: 'https://www.gov.br/inep/pt-br/arquivos/provas/enamed/2025/caderno-2.pdf',
  gabarito: 'https://www.gov.br/inep/pt-br/arquivos/gabaritos/enamed/2025/gabarito-oficial.pdf',
};

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`✓ Created cache directory: ${CACHE_DIR}`);
  }
}

function getCachePath(filename) {
  return path.join(CACHE_DIR, filename);
}

function isCached(filename) {
  const cachePath = getCachePath(filename);
  if (existsSync(cachePath)) {
    const stats = statSync(cachePath);
    return stats.size > 1000; // Must be larger than 1KB to be valid PDF
  }
  return false;
}

async function downloadFile(url, filename) {
  console.log(`\n📥 Downloading: ${filename}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DarwinEducation/1.0)',
      },
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate it's a PDF
    if (!buffer.toString('utf8', 0, 4).startsWith('%PDF')) {
      throw new Error('Downloaded file is not a valid PDF (magic bytes check failed)');
    }

    if (buffer.length < 1000) {
      throw new Error(`Downloaded file too small (${buffer.length} bytes)`);
    }

    // Save to cache
    const cachePath = getCachePath(filename);
    writeFileSync(cachePath, buffer);
    console.log(`   ✓ Saved: ${cachePath}`);
    console.log(`   📊 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    return true;
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return false;
  }
}

async function downloadAllPDFs() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║ ENAMED 2025 PDF Downloader                ║');
  console.log('╚════════════════════════════════════════════╝\n');

  ensureCacheDir();

  const files = [
    { key: 'caderno1', filename: 'enamed_2025_caderno1.pdf' },
    { key: 'caderno2', filename: 'enamed_2025_caderno2.pdf' },
    { key: 'gabarito', filename: 'enamed_2025_gabarito.pdf' },
  ];

  const results = {};
  let successCount = 0;

  for (const { key, filename } of files) {
    // Check cache first
    if (isCached(filename)) {
      console.log(`✓ Using cached: ${filename}`);
      results[key] = { cached: true, filename };
      successCount++;
      continue;
    }

    // Try primary URL
    const success = await downloadFile(URLS[key], filename);
    if (success) {
      results[key] = { cached: false, filename };
      successCount++;
      continue;
    }

    // Try alternative URL
    console.log(`   Trying alternative URL...`);
    const altSuccess = await downloadFile(ALTERNATIVE_URLS[key], filename);
    if (altSuccess) {
      results[key] = { cached: false, filename };
      successCount++;
      continue;
    }

    results[key] = { failed: true, filename };
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   Downloaded: ${successCount}/${files.length} files`);
  console.log(`   Location: ${CACHE_DIR}\n`);

  if (successCount === files.length) {
    console.log('✅ All PDFs downloaded successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Extract question content from PDFs');
    console.log('   2. Merge with IRT parameters');
    console.log('   3. Generate complete SQL with question text\n');
    return true;
  } else {
    console.log('⚠️  Some PDFs failed to download.');
    console.log('   You can manually download from:');
    console.log(`   - ${URLS.caderno1}`);
    console.log(`   - ${URLS.caderno2}`);
    console.log(`   - ${URLS.gabarito}`);
    console.log(`   And place them in: ${CACHE_DIR}\n`);
    return false;
  }
}

// Run
await downloadAllPDFs().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
