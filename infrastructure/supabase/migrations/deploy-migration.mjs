#!/usr/bin/env node
/**
 * Deploy SQL migration to Supabase using the JS client
 *
 * Usage: node deploy-migration.mjs <migration-file>
 *
 * Requires in .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'MISSING');
  console.error('\nAdd SUPABASE_SERVICE_ROLE_KEY to apps/web/.env.local');
  console.error('Find it at: Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Get migration file from args or use default
const migrationFile = process.argv[2] || '007_theory_generation_system.sql';
const migrationPath = path.join(__dirname, migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error('Migration file not found:', migrationPath);
  process.exit(1);
}

console.log('Deploying migration:', migrationFile);
console.log('Supabase URL:', supabaseUrl);
console.log('');

// Read migration SQL
const sql = fs.readFileSync(migrationPath, 'utf8');
console.log('Migration size:', sql.length, 'characters');

// Split into individual statements
const statements = sql
  .split(/;[\r\n]+/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('Statements to execute:', statements.length);
console.log('');

// Execute each statement
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  const preview = statement.substring(0, 60).replace(/\n/g, ' ');

  try {
    const { error } = await supabase.rpc('exec', { sql: statement + ';' });

    if (error) {
      // If exec function doesn't exist, try direct query
      if (error.code === '42883' || error.message.includes('function')) {
        // Fall back to SQL via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: statement + ';' }),
        });

        if (!response.ok) {
          throw new Error(`REST API error: ${response.status}`);
        }
      } else {
        throw error;
      }
    }

    console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
    successCount++;
  } catch (err) {
    console.error(`[${i + 1}/${statements.length}] FAIL: ${preview}...`);
    console.error('  Error:', err.message || err);
    errorCount++;

    // Continue with other statements if this one fails
    // (table might already exist, etc.)
  }
}

console.log('');
console.log('Migration complete!');
console.log(`Success: ${successCount}, Errors: ${errorCount}`);

// Verify tables
console.log('\nVerifying tables...');
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .like('table_name', 'theory_%');

if (tablesError) {
  console.log('Could not verify tables:', tablesError.message);
} else if (tables && tables.length > 0) {
  console.log('Theory tables found:');
  tables.forEach(t => console.log('  ', t.table_name));
} else {
  console.log('No theory tables found - migration may have failed');
}
