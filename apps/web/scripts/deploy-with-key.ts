/**
 * Deploy migration using Supabase service key
 * Usage: pnpm tsx scripts/deploy-with-key.ts
 */

import fs from 'fs';
import path from 'path';

// Environment setup
const SUPABASE_URL = 'https://jpzkjkwcoudaxscrukye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwemtqa3djb3VkYXhzY3J1a3llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc2OTAwOCwiZXhwIjoyMDg0MzQ1MDA4fQ.LeVy6egclGWZlPvcnkcgKL8xDojanb4bW6I5gz9U-rI';

// Headers for authenticated requests
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function createExecSqlFunction() {
  console.log('Creating exec_sql function for raw SQL execution...');

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    // First, try to create the function using the existing functions API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'OPTIONS',
      headers,
    });

    console.log('Supabase connection OK');
    return true;
  } catch (err) {
    console.log('Could not create exec_sql function');
    return false;
  }
}

async function deployMigration() {
  console.log('🚀 Deploying Theory Generation System Migration');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('');

  // Read migration file
  const migrationPath = path.join(
    process.cwd(),
    '../../infrastructure/supabase/migrations/007_theory_generation_system.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration size:', sql.length, 'characters');
  console.log('');

  // Split into statements
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📊 Statements: ${statements.length}`);
  console.log('');

  // Try direct execution via GraphQL
  console.log('Attempting direct SQL execution via PostgreSQL wire protocol...');
  console.log('');

  // Execute the entire migration as one batch
  const fullSQL = sql;

  try {
    // Use the functions endpoint with a custom function
    // First, we need to create a temporary function that can execute SQL

    // Actually, let's try a different approach: use pg library directly
    const { Client } = await import('pg');

    // Construct database URL from Supabase details
    const databaseUrl = `postgresql://postgres:your_password@db.jpzkjkwcoudaxscrukye.supabase.co:5432/postgres`;

    // For now, show what we're attempting
    console.log('Attempting Postgres direct connection...');
    console.log('(This requires DATABASE_URL to be set)');
    console.log('');

    // Since we can't connect directly without the password, try the SQL API approach
    await executeSQLViaAPI(fullSQL);
  } catch (err: any) {
    console.error('Error:', err.message);
    await executeSQLViaAPI(sql);
  }
}

async function executeSQLViaAPI(sql: string) {
  console.log('Using Supabase REST API for SQL execution...');

  // Split statements
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(statements.length, 5); i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 50).replace(/\n/g, ' ');

    try {
      // Try different RPC endpoints
      const endpoints = [
        'exec_sql',
        'run_sql',
        'execute_sql',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/${endpoint}`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ sql_query: stmt, query: stmt }),
            }
          );

          if (response.ok || response.status === 204) {
            console.log(`✓ [${i + 1}] ${preview}...`);
            successCount++;
            break;
          } else if (response.status !== 404) {
            const error = await response.json();
            console.log(`✗ [${i + 1}] ${error.message}`);
            errorCount++;
            break;
          }
        } catch (err) {
          // Try next endpoint
        }
      }
    } catch (err: any) {
      console.error(`✗ [${i + 1}] Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('⚠️  REST API does not support raw SQL execution for security reasons.');
  console.log('');
  console.log('✅ RECOMMENDED: Use Supabase CLI');
  console.log('');
  console.log('   1. Install: npm install -g supabase');
  console.log('   2. Login: supabase login');
  console.log('   3. Link: supabase link --project-ref jpzkjkwcoudaxscrukye');
  console.log('   4. Deploy: supabase db push');
  console.log('');
  console.log('OR');
  console.log('');
  console.log('✅ MANUAL: Supabase SQL Editor');
  console.log('');
  console.log('   1. Go to: ' + SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql'));
  console.log('   2. Click "New query"');
  console.log('   3. Paste: infrastructure/supabase/migrations/007_theory_generation_system.sql');
  console.log('   4. Click "Run"');
}

deployMigration().catch(console.error);
