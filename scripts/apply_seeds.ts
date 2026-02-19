#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function executeSql(sql: string) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
  return true
}

async function main() {
  console.log('🚀 Aplicando seeds de questões ENAMED 2025...\n')

  const sqlFile = path.join(
    __dirname,
    '../infrastructure/supabase/supabase/migrations/20260213194000_beta_web_enamed_2025_questions_seed.sql'
  )

  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo não encontrado:', sqlFile)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlFile, 'utf8')

  console.log('📄 Arquivo:', sqlFile)
  console.log('📦 Tamanho:', (sql.length / 1024).toFixed(1), 'KB\n')

  console.log('⏳ Executando SQL...')
  const success = await executeSql(sql)

  if (success) {
    console.log('✅ Seeds aplicados com sucesso!\n')

    // Verificar
    const { data, error } = await supabase.from('questions').select('id', { count: 'exact', head: true })
    if (!error) {
      console.log(`✅ Total de questões no banco: ${data || 0}`)
    }
  } else {
    console.log('❌ Falha ao aplicar seeds')
    process.exit(1)
  }
}

main()
