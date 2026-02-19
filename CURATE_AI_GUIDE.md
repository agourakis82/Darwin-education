# Guia: Curadoria Automatizada com IA

**Script**: `scripts/curate_questions_ai.ts`
**Modelos**: GLM-5 (Z.ai) ou Grok (xAI)
**Objetivo**: Gerar explicações completas para 998 questões sem explicação

---

## 🚀 QUICK START

### **1. Processar 10 questões de Cirurgia (dry-run)**

```bash
pnpm tsx scripts/curate_questions_ai.ts \
  --area cirurgia \
  --limit 10 \
  --dry-run \
  --model glm-5
```

**Output**:
- Gera explicações para 10 questões
- Salva em `.curate_batches/<batch-id>/`
- **NÃO aplica ao banco** (dry-run)

### **2. Revisar explicações geradas**

```bash
# Abrir pasta do batch
ls .curate_batches/<batch-id>/

# Ver resumo
cat .curate_batches/<batch-id>/summary.json

# Ver questão específica
cat .curate_batches/<batch-id>/<question-uuid>.json
```

### **3. Aplicar ao banco (se aprovado)**

```bash
pnpm tsx scripts/curate_questions_ai.ts \
  --batch-id <batch-id> \
  --apply
```

**Resultado**: Explicações são salvas no Supabase!

---

## 📋 WORKFLOW RECOMENDADO

### **Fase 1: Teste (10 questões)**

```bash
# Testar com 10 questões
pnpm tsx scripts/curate_questions_ai.ts \
  --area cirurgia \
  --limit 10 \
  --dry-run

# Revisar qualidade
# Se OK: aplicar
pnpm tsx scripts/curate_questions_ai.ts --batch-id <id> --apply
```

### **Fase 2: Batch por Área (50-100 questões)**

**Cirurgia (95 questões)**:
```bash
# Batch 1: 50 questões
pnpm tsx scripts/curate_questions_ai.ts \
  --area cirurgia \
  --limit 50 \
  --model glm-5

# Revisar + Aplicar
pnpm tsx scripts/curate_questions_ai.ts --batch-id <id> --apply

# Batch 2: 45 questões (resto)
pnpm tsx scripts/curate_questions_ai.ts \
  --area cirurgia \
  --limit 45
```

**Saúde Coletiva (97 questões)**:
```bash
# Batch 1: 50
pnpm tsx scripts/curate_questions_ai.ts --area saude_coletiva --limit 50

# Batch 2: 47
pnpm tsx scripts/curate_questions_ai.ts --area saude_coletiva --limit 47
```

### **Fase 3: Áreas Maiores (Batches de 100)**

**Pediatria (182 questões)**: 2 batches de 100 + 1 de 82
**GO (164 questões)**: 2 batches (100 + 64)
**Clínica Médica (462 questões)**: 5 batches de 100

**Tempo estimado**:
- 100 questões × 2s/questão = **3-4 minutos** para gerar
- Review manual: **5-10 minutos** por batch
- Total: **10-15 min por batch de 100**

**998 questões** ÷ 100/batch = **10 batches** × 15 min = **~2.5 horas total!** 🚀

---

## 🎛️ OPÇÕES DO SCRIPT

### **Flags Principais**

| Flag | Descrição | Exemplo |
|------|-----------|---------|
| `--area <name>` | Área ENAMED | `--area cirurgia` |
| `--limit <n>` | Número de questões | `--limit 50` |
| `--dry-run` | Não aplica ao banco | `--dry-run` |
| `--apply` | Aplica batch existente | `--apply --batch-id <id>` |
| `--model <name>` | Modelo IA (glm-5 ou grok) | `--model grok` |
| `--batch-id <id>` | ID do batch para aplicar | `--batch-id abc-123` |

### **Áreas Válidas**

- `cirurgia`
- `saude_coletiva`
- `pediatria`
- `ginecologia_obstetricia`
- `clinica_medica`

### **Modelos Disponíveis**

**GLM-5** (Z.ai) - Recomendado:
- Modelo: `glm-4-plus` (ou `glm-5` quando disponível)
- API: Z.ai (BigModel)
- Cost: ~$0.001 por questão (estimado)
- Latência: ~2s por questão

**Grok** (xAI):
- Modelo: `grok-2-1212`
- API: x.ai
- Cost: Consultar pricing xAI
- Latência: ~2-3s por questão

---

## 📁 ESTRUTURA DE ARQUIVOS

```
.curate_batches/
├── <batch-id-1>/
│   ├── summary.json              # Resumo do batch
│   ├── <question-uuid-1>.json    # Questão + explicação gerada
│   ├── <question-uuid-2>.json
│   └── ...
├── <batch-id-2>/
│   └── ...
```

### **Exemplo: summary.json**

```json
{
  "batchId": "a1b2c3d4-...",
  "modelName": "glm-5",
  "processedAt": "2026-02-14T10:30:00Z",
  "totalQuestions": 50,
  "successful": 48,
  "failed": 2,
  "dryRun": true,
  "appliedAt": null,
  "results": [
    {
      "questionId": "q-uuid-1",
      "area": "cirurgia",
      "status": "success",
      "explanation": "**Resposta Correta: A**\n\n..."
    }
  ]
}
```

### **Exemplo: <question-uuid>.json**

```json
{
  "questionId": "q-uuid-1",
  "area": "cirurgia",
  "stem": "Paciente de 45 anos...",
  "options": [...],
  "correct_index": 0,
  "old_explanation": null,
  "new_explanation": "**Resposta Correta: A**\n\nPaciente apresenta...",
  "generated_at": "2026-02-14T10:30:15Z",
  "model": "glm-5"
}
```

---

## 🔍 REVIEW DE QUALIDADE

### **Checklist por Questão**

Antes de aplicar um batch, revisar **5-10 questões aleatórias**:

- [ ] **Explicação tem 250-350 palavras**
- [ ] **Identifica resposta correta claramente**
- [ ] **Explica POR QUÊ está correta** (raciocínio clínico, guideline)
- [ ] **Explica POR QUÊ cada incorreta está errada**
- [ ] **Usa linguagem didática** (não apenas decoreba)
- [ ] **Sem erros factuais** (verificar guidelines citadas)
- [ ] **Markdown bem formatado**

### **Script de Review Visual**

```bash
# Ver questão específica formatada
cat .curate_batches/<batch-id>/<question-uuid>.json | jq -r '.new_explanation'

# Contar palavras
cat .curate_batches/<batch-id>/<question-uuid>.json | jq -r '.new_explanation' | wc -w
```

---

## ⚡ CONFIGURAÇÃO DO MODELO

### **GLM-5 via Z.ai**

Se você usa Z.ai com coding plan, configure:

**Arquivo**: `scripts/curate_questions_ai.ts` (linha 30-35)

```typescript
'glm-5': {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: process.env.GLM_API_KEY || process.env.XAI_API_KEY,
  model: 'glm-4-plus', // Ou 'glm-5' se disponível
},
```

**Adicionar no .env.local**:
```bash
# GLM-5 (Z.ai)
GLM_API_KEY=seu_api_key_z_ai
```

Se a API do Z.ai for diferente, ajuste `apiUrl` e `model`.

---

## 📊 MÉTRICAS E CUSTOS

### **Estimativa de Tempo**

| Batch Size | Geração (IA) | Review Manual | Total |
|-----------|--------------|---------------|-------|
| 10 questões | 20s | 2 min | ~2.5 min |
| 50 questões | 1.5 min | 5 min | ~7 min |
| 100 questões | 3 min | 10 min | ~13 min |

**998 questões total**: ~10 batches de 100 = **2-3 horas** (automação!)

### **Custo Estimado (GLM-5)**

- Tokens por questão: ~1500 (prompt) + 500 (resposta) = 2000 tokens
- Custo GLM-4-Plus: ~$0.001 por 1k tokens
- **998 questões** × 2k tokens × $0.001 = **~$2-3 USD total** 💰

**Super barato** comparado com curadoria manual (100h × $50/h = $5000)!

---

## 🛠️ TROUBLESHOOTING

### **Erro: API Key não encontrada**

```
❌ Erro: Env vars não configuradas!
```

**Fix**: Adicione em `.env.local`:
```bash
XAI_API_KEY=xai-vVg1cd5JNVj5...
# ou
GLM_API_KEY=glm-xxx...
```

### **Erro: Rate Limit Exceeded**

```
❌ Erro na API (429): Too Many Requests
```

**Fix**: O script já tem delay de 1s entre requests. Se ainda assim, aumentar:
```typescript
await new Promise((resolve) => setTimeout(resolve, 2000)) // 2s
```

### **Explicação Muito Curta/Vaga**

**Causa**: Temperatura muito alta ou prompt pouco específico

**Fix**: Ajustar temperatura no script (linha 120):
```typescript
temperature: 0.2, // Mais baixo = mais consistente (era 0.3)
```

### **Batch Não Encontrado**

```
❌ Batch não encontrado: abc-123
```

**Fix**: Verificar ID correto em `.curate_batches/`:
```bash
ls .curate_batches/
```

---

## 📝 EXEMPLOS DE USO

### **Exemplo 1: Curar Cirurgia Completa**

```bash
# Batch 1 (50 questões)
pnpm tsx scripts/curate_questions_ai.ts --area cirurgia --limit 50 --model glm-5

# Revisar
cat .curate_batches/<batch-id>/summary.json

# Aplicar
pnpm tsx scripts/curate_questions_ai.ts --batch-id <batch-id> --apply

# Batch 2 (45 questões restantes)
pnpm tsx scripts/curate_questions_ai.ts --area cirurgia --limit 45

# Aplicar
pnpm tsx scripts/curate_questions_ai.ts --batch-id <batch-id> --apply

# Verificar
# Todas 95 questões de Cirurgia agora têm explicação!
```

### **Exemplo 2: Processar TODAS as Áreas**

```bash
# Script bash helper
for area in cirurgia saude_coletiva pediatria ginecologia_obstetricia clinica_medica; do
  echo "Processando $area..."
  pnpm tsx scripts/curate_questions_ai.ts --area $area --limit 100 --model glm-5
  # Revisar + aplicar manualmente cada batch
done
```

### **Exemplo 3: Testar Grok vs GLM-5**

```bash
# GLM-5
pnpm tsx scripts/curate_questions_ai.ts --area cirurgia --limit 5 --dry-run --model glm-5

# Grok
pnpm tsx scripts/curate_questions_ai.ts --area cirurgia --limit 5 --dry-run --model grok

# Comparar qualidade
cat .curate_batches/<glm-batch-id>/<q-id>.json | jq -r '.new_explanation'
cat .curate_batches/<grok-batch-id>/<q-id>.json | jq -r '.new_explanation'
```

---

## 🎯 PRÓXIMOS PASSOS

### **1. AGORA: Testar com 10 questões**

```bash
pnpm tsx scripts/curate_questions_ai.ts \
  --area cirurgia \
  --limit 10 \
  --dry-run \
  --model glm-5
```

### **2. Revisar qualidade**

Abrir `.curate_batches/<batch-id>/` e ler 3-5 explicações

### **3. Se OK: Processar em lote**

- Cirurgia: 2 batches (95 total)
- Saúde Coletiva: 2 batches (97 total)
- Pediatria: 2 batches (182 total)
- GO: 2 batches (164 total)
- Clínica Médica: 5 batches (462 total)

**Resultado**: 998 questões curadas em **2-3 horas**! 🚀

---

## 💡 DICAS PRO

1. **Processar em horários de baixa latência** (evitar horário de pico da API)
2. **Revisar amostra de 10%** (não precisa revisar todas as 998)
3. **Aplicar batches incrementalmente** (não aplicar 998 de uma vez - fazer 50-100 por vez)
4. **Backup do banco** antes de aplicar batches grandes
5. **Monitorar custos da API** (Z.ai dashboard)

---

**Boa curadoria! 🤖✨**

Qualquer dúvida, revise este guia ou ajuste o prompt no script.
