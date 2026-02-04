/**
 * Deploy SQL migration to Supabase
 *
 * Usage: pnpm tsx scripts/deploy-migration.ts [migration-file]
 *
 * Requires in .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function deployMigration() {
  // Get migration file from args or use default
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

  console.log('Deploying migration:', migrationFile);
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  // Read migration SQL
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Migration size:', sql.length, 'characters');

  // Execute the entire migration as a single transaction
  console.log('');
  console.log('Executing migration...');

  try {
    // Use Supabase's SQL execution via the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey!,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('exec_sql function not available, trying raw SQL execution...');

      // Alternative: Execute statements one by one
      await executeStatementsSequentially(sql);
    } else {
      console.log('Migration executed successfully!');
    }
  } catch (error) {
    console.error('Error executing migration:', error);

    // Fallback to statement-by-statement execution
    await executeStatementsSequentially(sql);
  }

  // Verify tables
  await verifyTables();
}

async function executeStatementsSequentially(sql: string) {
  // Split by semicolons followed by newlines (to avoid breaking strings)
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log('Executing', statements.length, 'statements...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 50).replace(/\n/g, ' ');

    try {
      // Try using the query API via pg module if available
      // For now, use direct SQL via Supabase
      const { error } = await supabase.from('_dummy_').select().limit(0);

      // Actually execute via raw SQL connection
      // Since Supabase JS doesn't support raw SQL, we'll skip individual execution
      // and just report that manual execution is needed

      console.log(`[${i + 1}/${statements.length}] PENDING: ${preview}...`);
      successCount++;
    } catch (err: any) {
      console.error(`[${i + 1}/${statements.length}] ERROR: ${err.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('Statement analysis complete.');
  console.log('');
  console.log('NOTE: Supabase JS client does not support raw SQL execution.');
  console.log('Please run the migration manually via Supabase SQL Editor:');
  console.log('');
  console.log('1. Go to: Supabase Dashboard > SQL Editor');
  console.log('2. Click "New query"');
  console.log('3. Paste contents of:', process.argv[2] || '007_theory_generation_system.sql');
  console.log('4. Click "Run"');
}

async function verifyTables() {
  console.log('\nVerifying theory tables...');

  try {
    // Check if theory_topics_generated exists by trying to query it
    const { error } = await supabase
      .from('theory_topics_generated')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('Table theory_topics_generated does NOT exist.');
        console.log('Migration needs to be run manually.');
      } else {
        console.log('Error checking table:', error.message);
      }
    } else {
      console.log('Table theory_topics_generated EXISTS!');
      console.log('Migration has been applied successfully.');
    }
  } catch (err: any) {
    console.log('Could not verify tables:', err.message);
  }
}

deployMigration().catch(console.error);
