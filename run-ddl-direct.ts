import { Client } from 'pg';
import { readFileSync } from 'fs';

const connectionString = 'postgresql://postgres:1111111111Urso1982!@db.jpzkjkwcoudaxscrukye.supabase.co:5432/postgres?sslmode=require';

async function runMigrations() {
  console.log('🚀 Connecting to Supabase database...\n');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    const result = await client.query('SELECT current_database(), current_user');
    console.log('✅ Connected:', result.rows[0]);
    
    // Run migration 1
    console.log('\n📦 Running 001_ddl_core_tables.sql...');
    const sql1 = readFileSync('infrastructure/supabase/migrations/ddl/001_ddl_core_tables.sql', 'utf-8');
    await client.query(sql1);
    console.log('✅ Core tables created');
    
    // Run migration 2
    console.log('\n📦 Running 002_ddl_batch_processing.sql...');
    const sql2 = readFileSync('infrastructure/supabase/migrations/ddl/002_ddl_batch_processing.sql', 'utf-8');
    await client.query(sql2);
    console.log('✅ Batch processing tables created');
    
    // Verify tables
    console.log('\n📋 Verifying DDL tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'ddl_%'
      ORDER BY table_name
    `);
    console.log('DDL Tables created:');
    tables.rows.forEach(t => console.log('  -', t.table_name));
    
    await client.end();
    console.log('\n✅ DDL migrations complete!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

runMigrations();
