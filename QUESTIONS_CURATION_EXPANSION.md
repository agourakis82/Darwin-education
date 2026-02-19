# Plano: Curadoria e Expansão de Questões ENAMED

**Responsável**: Claude Code (você delegou esta tarefa)
**Meta**: Chegar a **250 questões de alta qualidade** (50 por área)
**Status atual**: 90 questões ENAMED 2025 + 50 sample questions = **140 disponíveis**
**Gap**: **110 questões** faltando

---

## 📊 ANÁLISE DO ESTADO ATUAL

### **Inventário de Questões Existentes**

| Fonte | Total | Clínica Médica | Cirurgia | GO | Pediatria | Saúde Coletiva |
|-------|-------|----------------|----------|-----|-----------|----------------|
| **ENAMED 2025 (seeded)** | 90 | 34 (38%) | 12 (13%) | 16 (18%) | 15 (17%) | 13 (14%) |
| **Sample Questions (não seeded)** | 50 | 10 | 10 | 10 | 10 | 10 |
| **Total Disponível** | **140** | **44** | **22** | **26** | **25** | **23** |
| **Meta para Beta** | **250** | **50** | **50** | **50** | **50** | **50** |
| **Faltam** | **110** | **6** | **28** | **24** | **25** | **27** |

### **Problemas de Qualidade Identificados**

#### **ENAMED 2025 (90 questões)** - Arquivo: `20260213194000_beta_web_enamed_2025_questions_seed.sql`

❌ **Crítico - Explicações vazias**:
- Todas têm `"Explicação em elaboração."`
- Sem justificativa da resposta correta
- Sem explicação das alternativas incorretas

❌ **Metadata incompleta**:
- `subspecialty: NULL` (100% das questões)
- `topic: NULL` (100% das questões)
- Dificulta filtragem e recomendação personalizada

❌ **Feedback vazio nas alternativas**:
```json
{"letter":"A","text":"espironolactona","feedback":""}
```
- Usuários não entendem POR QUÊ erraram

⚠️ **Calibração IRT questionável**:
- Alguns valores extremos (ex: difficulty -3.23)
- Infit/Outfit fora do ideal (> 1.2 ou < 0.8 indicam problemas)
- Precisa validação psicométrica

✅ **Pontos Fortes**:
- Questões oficiais ENAMED 2025 (alta validade de conteúdo)
- IRT já calibrado (a, b, c parameters)
- Casos clínicos complexos e realistas

---

#### **Sample Questions (50 questões)** - Arquivo: `02_sample_questions.sql`

✅ **Alta Qualidade**:
- Explicações completas e didáticas
- `subspecialty` preenchido (ex: "Cardiologia", "Endocrinologia")
- `topic` preenchido (ex: "Diabetes Mellitus", "DPOC")
- IRT calibrado de forma razoável
- 5 alternativas (A-E) vs 4 do ENAMED

⚠️ **Não estão seeded**:
- Existem no repo mas **não foram aplicadas** no banco
- Fácil fix: executar `02_sample_questions.sql`

✅ **Distribuição balanceada**:
- Exatamente 10 questões por área
- Cobertura de subspecialidades importantes

---

## 🎯 PLANO DE CURADORIA (Fase 1)

### **Objetivo**: Elevar qualidade das 140 questões existentes para padrão publicável

### **Task 1.1: Curar ENAMED 2025 (90 questões)** ⏱️ 15-20h

**Prioridade**: 🔴 **CRÍTICA** (sem explicações, questões são inutilizáveis para aprendizado)

**Processo por questão** (~15 min cada):

1. **Ler caso clínico e identificar raciocínio diagnóstico**
2. **Escrever explicação estruturada** (200-300 palavras):
   ```
   **Resposta Correta: [Letra]**

   [Explicação do raciocínio clínico: dados do caso, sinais/sintomas chave,
   exames complementares, guideline relevante]

   **Por que as outras estão incorretas:**
   - **[Letra A]**: [Razão específica]
   - **[Letra B]**: [Razão específica]
   - **[Letra C]**: [Razão específica]

   **Referências**: [Guideline ou consenso, se aplicável]
   ```

3. **Preencher metadata**:
   - `subspecialty`: Ex: "Cardiologia", "Endocrinologia", "Obstetrícia"
   - `topic`: Ex: "Insuficiência Cardíaca", "Endometriose", "Tuberculose"

4. **Adicionar feedback inline nas alternativas**:
   ```json
   {
     "letter": "A",
     "text": "espironolactona",
     "feedback": "Correto. Antagonista de aldosterona com benefício de mortalidade em ICFEr."
   },
   {
     "letter": "B",
     "text": "clortalidona",
     "feedback": "Tiazídico útil para HAS, mas sem impacto em mortalidade na IC."
   }
   ```

5. **Validar IRT**:
   - Verificar se `infit` e `outfit` estão entre 0.7-1.3 (aceitável)
   - Marcar questões com fit ruim para revisão posterior

**Output**: 90 questões curadas em arquivo SQL atualizado

**Estimativa**:
- 90 questões × 15 min = **22.5 horas** (dividir em 5-6 dias)
- Ou: 15 questões/dia × 6 dias = **DONE**

---

### **Task 1.2: Seed Sample Questions (50 questões)** ⏱️ 10 min

**Prioridade**: 🟢 **FÁCIL** (questões já prontas, só aplicar)

1. Verificar se `02_sample_questions.sql` já foi executado no Supabase
2. Se não: executar via SQL Editor ou `supabase db execute`
3. Validar: `SELECT COUNT(*) FROM questions WHERE bank_id = 'a1000000-0000-0000-0000-000000000001'`

**Output**: +50 questões de alta qualidade no banco

---

### **Task 1.3: Auditoria de Qualidade** ⏱️ 2h

**Executar queries para identificar problemas**:

```sql
-- 1. Questões sem explicação
SELECT id, area, LEFT(stem, 100) as preview
FROM questions
WHERE explanation LIKE '%em elaboração%'
OR LENGTH(explanation) < 100
ORDER BY area;

-- 2. Questões sem metadata
SELECT area, COUNT(*) as sem_metadata
FROM questions
WHERE subspecialty IS NULL OR topic IS NULL
GROUP BY area;

-- 3. Questões com IRT problemático
SELECT id, area, irt_difficulty, irt_infit, irt_outfit
FROM questions
WHERE irt_infit < 0.7 OR irt_infit > 1.3
   OR irt_outfit < 0.7 OR irt_outfit > 1.3
ORDER BY area, irt_infit DESC;

-- 4. Distribuição por área
SELECT
  area,
  COUNT(*) as total,
  ROUND(AVG(irt_difficulty)::numeric, 2) as avg_difficulty,
  COUNT(CASE WHEN difficulty = 'facil' THEN 1 END) as facil,
  COUNT(CASE WHEN difficulty = 'medio' THEN 1 END) as medio,
  COUNT(CASE WHEN difficulty = 'dificil' THEN 1 END) as dificil
FROM questions
GROUP BY area
ORDER BY total DESC;
```

**Output**: Relatório de qualidade com prioridades de curadoria

---

## 🚀 PLANO DE EXPANSÃO (Fase 2)

### **Objetivo**: Criar 110 novas questões para chegar a 250 total (50 por área)

### **Distribuição de Questões a Criar**

| Área | Disponível | Meta | Faltam | Prioridade |
|------|-----------|------|--------|-----------|
| **Cirurgia** | 22 | 50 | **28** | 🔴 Máxima |
| **Saúde Coletiva** | 23 | 50 | **27** | 🔴 Máxima |
| **Pediatria** | 25 | 50 | **25** | 🔴 Alta |
| **Ginecologia/Obstetrícia** | 26 | 50 | **24** | 🔴 Alta |
| **Clínica Médica** | 44 | 50 | **6** | 🟡 Média |

### **Task 2.1: Definir Taxonomia de Tópicos** ⏱️ 3h

Criar matriz de blueprint para garantir cobertura balanceada:

**Exemplo - Cirurgia (28 questões)**:

| Subspecialty | Tópicos | Questões |
|--------------|---------|----------|
| **Trauma** | TCE, Trauma torácico, Trauma abdominal, Politrauma | 5 |
| **Abdome Agudo** | Apendicite, Colecistite, Pancreatite, Obstrução intestinal | 5 |
| **Cirurgia Vascular** | Aneurisma aorta, Isquemia aguda, TVP, Varizes | 4 |
| **Urologia** | Litíase, ITU complicada, Trauma renal, HPB | 4 |
| **Ortopedia** | Fraturas (fêmur, rádio, coluna), Luxações | 5 |
| **Cirurgia Geral** | Hérnias, Úlcera péptica, CA colorretal | 5 |

**Output**: Blueprint completo para cada área (planilha ou Markdown)

---

### **Task 2.2: Criar Questões por Batch** ⏱️ 30-40h

**Processo de Criação (30 min por questão)**:

1. **Escolher tópico do blueprint**
2. **Pesquisar guideline/consenso recente** (ESC, AHA, Ministério da Saúde, etc.)
3. **Escrever caso clínico** (vinheta realista, 100-150 palavras):
   - Idade, gênero, queixa principal
   - História relevante (duração, fatores agravantes/atenuantes)
   - Exame físico (achados positivos e negativos importantes)
   - Exames complementares (se necessário)
4. **Formular pergunta objetiva** (diagnóstico, tratamento, próximo passo)
5. **Criar 4 alternativas** (A-D):
   - 1 correta (clara e incontestável)
   - 3 distractoras plausíveis (erros comuns, diagnósticos diferenciais, condutas subótimas)
6. **Escrever explicação completa** (200-300 palavras)
7. **Adicionar feedback inline** em cada alternativa
8. **Estimar parâmetros IRT iniciais**:
   - `difficulty`: -2 (fácil) a +2 (difícil) - baseado em julgamento
   - `discrimination`: 1.0-1.5 (questões boas discriminam bem)
   - `guessing`: 0.25 (4 alternativas = 25% chance aleatória)
9. **Preencher metadata**: subspecialty, topic, references

**Batching Strategy**:
- **Batch A (30 questões)**: Cirurgia (28) + Clínica Médica (2)
- **Batch B (30 questões)**: Saúde Coletiva (27) + Clínica Médica (3)
- **Batch C (25 questões)**: Pediatria (25)
- **Batch D (25 questões)**: Ginecologia/Obstetrícia (24) + Clínica Médica (1)

**Cronograma**:
- Batch A: 15h (3 dias × 5h)
- Batch B: 15h (3 dias × 5h)
- Batch C: 12.5h (3 dias × 4h)
- Batch D: 12.5h (3 dias × 4h)
- **Total**: ~55h distribuídas em **12 dias úteis**

---

### **Task 2.3: Revisão de Pares** ⏱️ 5h

**Processo**:
1. Para cada batch, selecionar 5 questões aleatórias
2. Revisar criticamente:
   - Vinheta clínica realista?
   - Resposta correta incontestável?
   - Distractoras plausíveis (não óbvias)?
   - Explicação clara e didática?
   - Referências corretas?
3. Marcar questões problemáticas para reescrita
4. Validar taxonomia (subspecialty/topic)

**Output**: 110 questões validadas

---

## 📐 CALIBRAÇÃO IRT (Fase 3)

### **Objetivo**: Refinar parâmetros IRT com dados reais de beta-testers

### **Task 3.1: IRT Inicial (Estimativa por Julgamento)** ⏱️ 3h

Para questões novas, estimar parâmetros baseados em:
- **Difficulty**: Complexidade do raciocínio, obscuridade do tópico
  - Muito fácil: -2.0 a -1.0
  - Fácil: -1.0 a 0.0
  - Médio: 0.0 a +1.0
  - Difícil: +1.0 a +2.0
  - Muito difícil: +2.0 a +3.0

- **Discrimination**: Qualidade das distractoras
  - Ruim (distractoras óbvias): 0.5-0.8
  - Boa: 1.0-1.5
  - Excelente: 1.5-2.0

- **Guessing**: Fixo em 0.25 (4 alternativas)

---

### **Task 3.2: Recalibração Empírica (Após Beta)** ⏱️ 5h

**Após 2-3 semanas de beta** (quando tiver ~500 respostas):

1. **Coletar dados de respostas**:
```sql
SELECT
  q.id,
  q.area,
  q.irt_difficulty,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN ea.is_correct THEN 1.0 ELSE 0.0 END)::numeric, 3) as p_correct
FROM questions q
LEFT JOIN exam_answers ea ON ea.question_id = q.id
GROUP BY q.id, q.area, q.irt_difficulty
HAVING COUNT(*) >= 10  -- mínimo 10 respostas
ORDER BY p_correct;
```

2. **Identificar questões problemáticas**:
   - `p_correct > 0.90`: Muito fácil ou resposta óbvia (revisar distractoras)
   - `p_correct < 0.25`: Chance aleatória (questão ambígua ou erro na gabarito)
   - `p_correct 0.25-0.35`: Muito difícil (verificar se conteúdo é esperado para ENAMED)

3. **Recalibrar IRT com pacote R/Python**:
   - Usar `mirt` (R) ou `py-irt` (Python)
   - Modelo 3PL (a, b, c)
   - Exportar novos parâmetros

4. **Atualizar banco**:
```sql
UPDATE questions SET
  irt_difficulty = [novo_b],
  irt_discrimination = [novo_a],
  irt_infit = [novo_infit],
  irt_outfit = [novo_outfit]
WHERE id = '[question_id]';
```

**Output**: Questões recalibradas com parâmetros empíricos

---

## 🏆 CRITÉRIOS DE QUALIDADE (Quality Gates)

### **Antes de Seeding (Checklist por Questão)**

- [ ] **Caso clínico**: Realista, informações suficientes, sem pistas desnecessárias
- [ ] **Pergunta**: Clara, objetiva, única interpretação possível
- [ ] **Resposta correta**: Incontestável, baseada em guideline/consenso
- [ ] **Distractoras**: Plausíveis, representam erros comuns ou diagnósticos diferenciais
- [ ] **Explicação**: 200+ palavras, justifica correta + descarta incorretas
- [ ] **Feedback inline**: Cada alternativa tem explicação curta (30-50 palavras)
- [ ] **Metadata**: `subspecialty` e `topic` preenchidos
- [ ] **Referências**: Pelo menos 1 guideline/consenso citado
- [ ] **IRT**: Parâmetros estimados (a: 1.0-1.5, b: -2 a +2, c: 0.25)

### **Após Beta (Validação Empírica)**

- [ ] **Mínimo de respostas**: ≥ 10 tentativas por questão
- [ ] **p-correct**: Entre 0.35-0.85 (sweet spot)
- [ ] **Infit/Outfit**: Entre 0.7-1.3
- [ ] **Nenhum relato de ambiguidade** dos beta-testers
- [ ] **Tempo médio de resposta**: 90-180 segundos (questões muito rápidas ou muito lentas precisam revisão)

---

## 📊 MÉTRICAS DE PROGRESSO

### **Dashboard de Curadoria (Atualizar semanalmente)**

```sql
-- Total de questões por status
SELECT
  CASE
    WHEN explanation LIKE '%em elaboração%' OR LENGTH(explanation) < 100 THEN 'Pendente Curadoria'
    WHEN subspecialty IS NULL OR topic IS NULL THEN 'Metadata Incompleta'
    ELSE 'Curada'
  END as status,
  COUNT(*) as total,
  area
FROM questions
GROUP BY status, area
ORDER BY status, area;

-- Meta de 250 questões
SELECT
  area,
  COUNT(*) as atual,
  50 as meta,
  50 - COUNT(*) as faltam,
  ROUND(COUNT(*) * 100.0 / 50, 1) || '%' as progresso
FROM questions
GROUP BY area
ORDER BY COUNT(*);
```

### **KPIs**

| Fase | KPI | Meta | Status Atual |
|------|-----|------|--------------|
| **Curadoria** | % questões com explicação completa | 100% | 35% (50/140) |
| **Curadoria** | % questões com metadata | 100% | 35% (50/140) |
| **Expansão** | Total de questões | 250 | 140 |
| **Expansão** | Menor área (Cirurgia) | 50 | 22 |
| **Calibração** | % questões com IRT empírico | 80% | 64% (90/140 ENAMED) |

---

## 🗓️ CRONOGRAMA GERAL

### **Semana 1-2: Curadoria** (Paralelo com conteúdo médico do CODEX)
- **Dias 1-6**: Curar ENAMED 2025 (15 questões/dia)
- **Dia 7**: Seed sample questions + auditoria
- **Resultado**: 140 questões curadas

### **Semana 3-4: Expansão**
- **Dias 1-3**: Batch A - Cirurgia (30 questões)
- **Dias 4-6**: Batch B - Saúde Coletiva (30 questões)
- **Dia 7**: Revisão de pares Batch A+B

### **Semana 5-6: Expansão**
- **Dias 1-3**: Batch C - Pediatria (25 questões)
- **Dias 4-6**: Batch D - GO (25 questões)
- **Dia 7**: Revisão de pares Batch C+D
- **Resultado**: 250 questões

### **Durante Beta (Semanas 7-10): Recalibração**
- Coletar dados de respostas
- Identificar questões problemáticas
- Recalibrar IRT empiricamente
- Substituir/revisar questões ruins

---

## 🛠️ FERRAMENTAS E TEMPLATES

### **Template de Questão (JSON)**

```json
{
  "id": "uuid-v4",
  "bank_id": "a1000000-0000-0000-0000-000000000001",
  "stem": "[Caso clínico: idade, gênero, queixa, história, exame físico, exames complementares]",
  "options": [
    {
      "letter": "A",
      "text": "[Alternativa correta]",
      "feedback": "Correto. [Justificativa baseada em guideline/consenso]"
    },
    {
      "letter": "B",
      "text": "[Distractora plausível]",
      "feedback": "Incorreto. [Por que está errada: erro comum, diferencial excluído]"
    },
    {
      "letter": "C",
      "text": "[Distractora plausível]",
      "feedback": "Incorreto. [Por que está errada]"
    },
    {
      "letter": "D",
      "text": "[Distractora plausível]",
      "feedback": "Incorreto. [Por que está errada]"
    }
  ],
  "correct_index": 0,
  "explanation": "**Resposta Correta: A**\n\n[Explicação do raciocínio: dados do caso, sinais/sintomas-chave, guideline]\n\n**Por que as outras estão incorretas:**\n- **B**: [Razão]\n- **C**: [Razão]\n- **D**: [Razão]\n\n**Referências**: [Guideline 2023]",
  "area": "cirurgia",
  "subspecialty": "Trauma",
  "topic": "Traumatismo Cranioencefálico",
  "difficulty": "medio",
  "irt_difficulty": 0.5,
  "irt_discrimination": 1.3,
  "irt_guessing": 0.25,
  "irt_infit": null,
  "irt_outfit": null,
  "year": 2024,
  "validated_by": "expert",
  "reference_list": ["ACS ATLS 10th Edition 2018", "Brain Trauma Foundation Guidelines 2016"]
}
```

### **Script de Conversão SQL**

```python
# scripts/convert_questions_json_to_sql.py
import json

def question_to_sql(q):
    return f"""
  (
    '{q['id']}',
    '{q['bank_id']}',
    E'{q['stem'].replace("'", "''")}',
    '{json.dumps(q['options'])}'::jsonb,
    {q['correct_index']},
    E'{q['explanation'].replace("'", "''")}',
    '{q['area']}',
    '{q['subspecialty']}',
    '{q['topic']}',
    '{q['difficulty']}',
    {q['irt_difficulty']},
    {q['irt_discrimination']},
    {q['irt_guessing']},
    {q['year']},
    '{q['validated_by']}'
  )
"""

# Uso:
# python scripts/convert_questions_json_to_sql.py batch_a.json > batch_a.sql
```

---

## 📚 RECURSOS E REFERÊNCIAS

### **Guidelines por Área**

**Cirurgia**:
- ATLS (Advanced Trauma Life Support) 10th Ed
- ATCN (Advanced Trauma Care for Nurses)
- SBC Guidelines (Sociedade Brasileira de Cirurgia)

**Saúde Coletiva**:
- Ministério da Saúde - Cadernos de Atenção Básica
- PNAB (Política Nacional de Atenção Básica)
- Protocolos SUS

**Pediatria**:
- AAP (American Academy of Pediatrics) Guidelines
- SBP (Sociedade Brasileira de Pediatria) Consensos
- WHO Child Health Guidelines

**Ginecologia/Obstetrícia**:
- ACOG (American College of Obstetricians and Gynecologists)
- FEBRASGO Protocolos
- WHO Maternal Health Guidelines

**Clínica Médica**:
- ESC, AHA, ACC (Cardio)
- ADA, EASD (Endo)
- GOLD, GINA (Pneumo)
- KDIGO (Nefro)
- IDSA (Infecto)

### **Bancos de Questões Inspiração** (NÃO COPIAR!)
- USMLE Step 2 CK (padrão-ouro global)
- Questões ENADE Medicina (referência nacional)
- Residência Médica SUS-SP, USP, Unifesp (questões brasileiras de alto nível)

---

## ✅ DELIVERABLES FINAIS

### **Fase 1: Curadoria (Semana 1-2)**
- [ ] 90 questões ENAMED 2025 curadas (explicações + metadata)
- [ ] 50 sample questions seeded
- [ ] Relatório de auditoria de qualidade

### **Fase 2: Expansão (Semana 3-6)**
- [ ] 110 novas questões criadas
- [ ] Blueprint de cobertura completo (50 questões × 5 áreas)
- [ ] Todas questões com explicações + feedback inline

### **Fase 3: Calibração (Durante Beta)**
- [ ] Análise de respostas (p-correct, tempo médio)
- [ ] IRT recalibrado empiricamente
- [ ] Questões problemáticas revisadas/substituídas

### **Meta Final**
✅ **250 questões de alta qualidade**
✅ **50 questões por área** (balanceamento perfeito)
✅ **100% com explicações completas**
✅ **100% com metadata** (subspecialty, topic)
✅ **80%+ com IRT calibrado empiricamente**

---

## 🚀 PRÓXIMO PASSO

**Decisão necessária**: Começar curadoria ou expansão?

**Opção A - Curadoria Primeiro** (Recomendado):
- Vantagem: 140 questões prontas para beta (suficiente para 50 usuários)
- Desvantagem: Desbalanceamento de áreas (Cirurgia só 22)
- Tempo: 1-2 semanas

**Opção B - Expansão Primeiro**:
- Vantagem: Balanceamento (50 por área)
- Desvantagem: Questões ENAMED ficam sem explicação por mais tempo
- Tempo: 4-6 semanas

**Opção C - Híbrido** (Minha recomendação):
1. **Semana 1**: Curar ENAMED 2025 (90 questões) + seed sample (50)
2. **Semana 2-3**: Expandir Cirurgia e Saúde Coletiva (55 questões - áreas mais defasadas)
3. **Lançar Beta Semana 1** com 195 questões (39 por área - quase balanceado)
4. **Durante Beta**: Expandir restante (55 questões) + recalibrar

---

**Me avise se quer que eu comece! Posso começar por:**
- A) Curar primeiras 15 questões ENAMED 2025 (Clínica Médica)
- B) Criar blueprint detalhado de tópicos para expansão
- C) Criar 5 questões piloto de Cirurgia (demonstração de qualidade)
- D) Outra coisa

🎯 **Sua decisão?**
