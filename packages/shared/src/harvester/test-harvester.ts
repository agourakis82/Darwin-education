#!/usr/bin/env npx tsx
/**
 * Script de teste do Question Harvester
 *
 * Executa:
 *   cd packages/shared && npx tsx src/harvester/test-harvester.ts
 */

import {
  createSearchScraper,
  GenericPDFScraper,
  RESIDENCIA_SOURCES,
} from './scrapers/residencia-scraper';
import { LLMQuestionParser } from './parsers/llm-question-parser';

async function testScraper() {
  console.log('='.repeat(60));
  console.log('🔍 TESTE DO QUESTION HARVESTER');
  console.log('='.repeat(60));

  // 1. Listar fontes disponíveis
  console.log('\n📚 Fontes de Residência Configuradas:');
  for (const source of RESIDENCIA_SOURCES) {
    console.log(`  - ${source.id}: ${source.name}`);
  }

  // 2. Testar busca web por provas
  console.log('\n🌐 Testando busca por provas de residência...');

  const searchScraper = createSearchScraper('USP FMUSP', [2024, 2023], {
    maxDocuments: 5,
    delayMs: 2000,
  });

  try {
    const searchResult = await searchScraper.scrape();
    console.log(`\n✅ Busca concluída:`);
    console.log(`   - Documentos encontrados: ${searchResult.documents.length}`);
    console.log(`   - Erros: ${searchResult.errors.length}`);

    if (searchResult.documents.length > 0) {
      console.log('\n📄 Documentos encontrados:');
      for (const doc of searchResult.documents.slice(0, 5)) {
        console.log(`   - ${doc.filename || doc.url.split('/').pop()}`);
        console.log(`     URL: ${doc.url}`);
        console.log(`     Tamanho: ${(doc.content as Buffer).length} bytes`);
      }
    }

    if (searchResult.errors.length > 0) {
      console.log('\n⚠️ Erros:');
      for (const error of searchResult.errors.slice(0, 3)) {
        console.log(`   - ${error}`);
      }
    }
  } catch (error) {
    console.log(`\n❌ Erro na busca: ${error}`);
  }

  // 3. Testar parser (sem API key - só estrutura)
  console.log('\n🤖 Testando estrutura do Parser LLM...');

  const sampleText = `
QUESTÃO 1
Paciente de 65 anos, hipertenso e diabético, chega ao pronto-socorro com dor
torácica típica há 2 horas. ECG mostra supradesnivelamento de ST em V1-V4.

Qual a conduta imediata mais adequada?

(A) Solicitar troponina e aguardar resultado
(B) Iniciar terapia de reperfusão imediata
(C) Realizar ecocardiograma de urgência
(D) Transferir para UTI coronariana

QUESTÃO 2
Gestante de 32 semanas apresenta cefaleia intensa, escotomas visuais e PA 170x110 mmHg.
Proteinúria de 3g/24h. Qual o diagnóstico mais provável?

(A) Hipertensão gestacional
(B) Pré-eclâmpsia grave
(C) Eclâmpsia
(D) Síndrome HELLP
`;

  // Teste de classificação de área
  const { classifyArea } = await import('./parsers/llm-question-parser');

  const areas = [
    { text: 'paciente com infarto agudo do miocárdio', expected: 'Clínica Médica' },
    { text: 'gestante com pré-eclâmpsia', expected: 'Ginecologia e Obstetrícia' },
    { text: 'criança com bronquiolite viral', expected: 'Pediatria' },
    { text: 'apendicite aguda cirurgia', expected: 'Cirurgia' },
    { text: 'vigilância epidemiológica SUS', expected: 'Saúde Coletiva' },
  ];

  console.log('\n📊 Teste de classificação de área:');
  for (const { text, expected } of areas) {
    const classified = classifyArea(text);
    const status = classified === expected ? '✅' : '❌';
    console.log(`   ${status} "${text.substring(0, 30)}..." → ${classified || 'N/A'} (esperado: ${expected})`);
  }

  // 4. Simular parsing com LLM (precisa de API key)
  console.log('\n🔑 Para testar o parsing completo, configure:');
  console.log('   GROK_API_KEY=xxx ou MINIMAX_API_KEY=xxx + MINIMAX_GROUP_ID=xxx');

  const grokKey = process.env.GROK_API_KEY;
  const minimaxKey = process.env.MINIMAX_API_KEY;

  if (grokKey) {
    console.log('\n🚀 Testando parser com Grok...');
    const parser = new LLMQuestionParser({
      provider: 'grok',
      apiKey: grokKey,
    });

    try {
      const result = await parser.parseText(sampleText, 'test-source');
      console.log(`\n✅ Parsing concluído:`);
      console.log(`   - Questões extraídas: ${result.questions.length}`);
      console.log(`   - Tokens usados: ${result.tokensUsed}`);
      console.log(`   - Tempo: ${result.processingTimeMs}ms`);

      if (result.questions.length > 0) {
        console.log('\n📝 Primeira questão parseada:');
        const q = result.questions[0];
        console.log(`   Área: ${q.area}`);
        console.log(`   Stem: ${q.stem.substring(0, 100)}...`);
        console.log(`   Opções: ${q.options.length}`);
        console.log(`   Resposta: ${q.correctAnswer}`);
        console.log(`   Confiança: ${(q.confidence * 100).toFixed(0)}%`);
      }

      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️ Erros no parsing:');
        for (const err of result.errors) {
          console.log(`   - ${err}`);
        }
      }
    } catch (error) {
      console.log(`\n❌ Erro no parsing: ${error}`);
    }
  } else if (minimaxKey) {
    console.log('\n🚀 Testando parser com Minimax...');
    // Similar ao Grok
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Teste concluído!');
  console.log('='.repeat(60));
}

// Executar
testScraper().catch(console.error);
