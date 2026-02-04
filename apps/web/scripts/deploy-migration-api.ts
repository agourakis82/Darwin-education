/**
 * Deploy SQL migration to Supabase using the Management API
 *
 * Usage: pnpm tsx scripts/deploy-migration-api.ts [migration-file]
 *
 * Requires in .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DATABASE_URL (Postgres connection string) - optional but recommended
 */

import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

// Extract project ref from URL
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function deployMigration() {
  console.log('=== Supabase Migration Deployment ===\n');
  console.log('Project:', projectRef);
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey ? 'set' : 'MISSING');
  console.log('Database URL:', databaseUrl ? 'set' : 'not set');
  console.log('');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables!');
    process.exit(1);
  }

  // Get migration file
  const migrationFile = process.argv[2] || '007_theory_generation_system.sql';
  const migrationPath = path.join(
    process.cwd(),
    '../../infrastructure/supabase/migrations',
    migrationFile
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Migration file:', migrationFile);
  console.log('SQL size:', sql.length, 'characters');
  console.log('');

  // Method 1: Try pg module if DATABASE_URL is available
  if (databaseUrl) {
    console.log('Attempting direct Postgres connection...');
    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: databaseUrl });
      await client.connect();

      console.log('Connected to Postgres!');
      console.log('Executing migration...');

      await client.query(sql);

      console.log('Migration executed successfully!');
      await client.end();
      return;
    } catch (err: any) {
      console.log('Direct Postgres failed:', err.message);
      console.log('Falling back to API method...');
    }
  }

  // Method 2: Use Supabase SQL API (requires pgbouncer transaction mode)
  console.log('Attempting Supabase SQL API...');

  try {
    // Split SQL into individual statements for sequential execution
    const statements = splitStatements(sql);
    console.log('Statements to execute:', statements.length);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      const preview = stmt.substring(0, 60).replace(/[\n\r]+/g, ' ');

      try {
        // Use the PostgREST raw SQL function if available
        // Otherwise fall back to the rpc endpoint
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/run_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ sql_query: stmt }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
        successCount++;
      } catch (err: any) {
        // Check if it's a "already exists" type error (not a real failure)
        if (err.message.includes('already exists')) {
          console.log(`[${i + 1}/${statements.length}] SKIP (exists): ${preview}...`);
          successCount++;
        } else {
          console.error(`[${i + 1}/${statements.length}] FAIL: ${err.message.substring(0, 80)}`);
          errorCount++;
        }
      }
    }

    console.log('');
    console.log(`Completed: ${successCount} success, ${errorCount} errors`);

    if (errorCount > 0) {
      console.log('');
      console.log('Some statements failed. This might be expected for:');
      console.log('- Indexes that already exist');
      console.log('- Policies that already exist');
      console.log('- RLS that is already enabled');
      console.log('');
      console.log('If tables were not created, run the migration manually:');
      console.log('  Supabase Dashboard > SQL Editor > New Query > Paste & Run');
    }
  } catch (err: any) {
    console.error('API method failed:', err.message);
    console.log('');
    console.log('Please run the migration manually via Supabase SQL Editor.');
  }

  // Verify tables
  await verifyTables();
}

function splitStatements(sql: string): string[] {
  // Simple statement splitter - split on semicolon at end of line
  // This handles most cases but may fail on complex PL/pgSQL
  const statements: string[] = [];
  let current = '';
  let inFunction = false;

  sql.split('\n').forEach(line => {
    // Check if we're entering a function definition
    if (line.match(/\$\$\s*$/)) {
      inFunction = !inFunction;
    }

    current += line + '\n';

    // If line ends with ; and we're not in a function
    if (line.trim().endsWith(';') && !inFunction) {
      statements.push(current.trim());
      current = '';
    }
  });

  // Don't forget the last statement
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s && !s.startsWith('--'));
}

async function verifyTables() {
  console.log('\n=== Verifying Tables ===\n');

  const tables = [
    'theory_topics_generated',
    'theory_citations',
    'theory_topic_citations',
    'theory_research_cache',
    'theory_generation_jobs',
    'theory_generation_job_topics',
    'theory_validation_results',
    'citation_verification_audit',
    'hallucination_audit',
    'citation_provenance_audit',
  ];

  for (const table of tables) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/${table}?select=count&limit=0`,
        {
          headers: {
            'apikey': supabaseServiceKey!,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );

      if (response.ok) {
        console.log(`  ${table}`);
      } else {
        console.log(`  ${table} (not found)`);
      }
    } catch (err) {
      console.log(`  ${table} (error)`);
    }
  }
}

deployMigration().catch(console.error);
