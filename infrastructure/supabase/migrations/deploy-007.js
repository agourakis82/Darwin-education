#!/usr/bin/env node
/**
 * Deploy migration 007_theory_generation_system.sql to Supabase
 *
 * Usage: node deploy-007.js
 *
 * Requires environment variables:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 */

const fs = require('fs');
const path = require('path');

// Try to load .env file
try {
  require('dotenv').config({ path: path.join(__dirname, '../../../apps/web/.env.local') });
} catch (e) {
  console.log('Note: dotenv not available, using system environment variables');
}

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not found in environment');
  console.error('Please set up your environment variables in apps/web/.env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('This is required for admin operations like creating tables');
  console.error('\nYou can find your service role key in:');
  console.error('Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployMigration() {
  console.log('🚀 Deploying Theory Generation System Migration (007)');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('');

  // Read migration file
  const migrationPath = path.join(__dirname, '007_theory_generation_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📊 SQL length:', migrationSQL.length, 'characters');
  console.log('');

  // Execute migration
  console.log('⚙️  Executing migration...');
  console.log('');

  try {
    // Note: Supabase JS client doesn't support multi-statement SQL execution directly
    // We need to use the SQL RPC function or split statements

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution via REST API
      if (error.message.includes('function') || error.code === '42883') {
        console.log('⚠️  exec_sql function not available, using alternative method...');
        console.log('');
        console.log('Please run this migration manually via Supabase SQL Editor:');
        console.log('');
        console.log('1. Go to: ' + supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'));
        console.log('2. Click "New query"');
        console.log('3. Copy the contents of: ' + migrationPath);
        console.log('4. Paste and click "Run"');
        console.log('');
        console.log('Alternatively, install Supabase CLI:');
        console.log('  npm install -g supabase');
        console.log('  supabase db push');
        process.exit(1);
      }
      throw error;
    }

    console.log('✅ Migration executed successfully!');
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'theory_%');

    if (tablesError) {
      console.warn('⚠️  Could not verify tables:', tablesError.message);
    } else {
      console.log('📋 Theory tables created:');
      tables.forEach(t => console.log('  ✓', t.table_name));
    }

    console.log('');
    console.log('🎉 Migration deployment complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  }
}

// Run deployment
deployMigration().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
