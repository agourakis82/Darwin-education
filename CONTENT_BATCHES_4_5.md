# Batches 4-5: Doenças Prioritárias ENAMED

**Objetivo**: Atingir **100 doenças com fullContent** (atualmente em 86)
**Meta**: +14 doenças nos próximos 2 batches (7 por batch)
**Critério de priorização**: Alta prevalência ENAMED + Guidelines de primeira linha disponíveis

---

## 🎯 BATCH 4 - Cardiologia + Endocrinologia (7 doenças)

### 1. **Hipertensão Arterial Sistêmica (HAS)**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima - base de múltiplas questões)
**Arquivo**: `hypertension.json` ou `hipertensao-arterial-sistemica.json`

**Guidelines sugeridas**:
- 🇺🇸 **ACC/AHA Hypertension 2017** (referência global)
- 🇧🇷 **Diretriz Brasileira de Hipertensão 2020** (SBC - contexto nacional)
- 🇪🇺 **ESC/ESH Hypertension 2018** (europeia, complementar)
- 🌍 **WHO Hypertension Guidelines 2021** (saúde pública)

**Tópicos essenciais**:
- Diagnóstico (medidas, MAPA, MRPA)
- Classificação (estágios 1, 2, 3, urgência, emergência)
- Tratamento não-farmacológico (DASH, exercício, sal)
- Tratamento farmacológico (primeira linha: IECA/BRA, tiazídicos, bloqueadores canais Ca)
- Lesões de órgão-alvo
- HAS secundária (causas)

---

### 2. **Diabetes Mellitus Tipo 2**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima)
**Arquivo**: `diabetes-mellitus-type-2.json`

**Guidelines sugeridas**:
- 🇺🇸 **ADA Standards of Care 2024** (atualizada anualmente)
- 🇧🇷 **Diretriz SBD 2023-2024** (Sociedade Brasileira de Diabetes)
- 🇪🇺 **EASD/ADA Consensus 2023** (tratamento hiperglicemia)
- 🌍 **WHO DM Guidelines 2020**

**Tópicos essenciais**:
- Diagnóstico (HbA1c, glicemia jejum, TOTG)
- Rastreamento (pré-diabetes)
- Metas glicêmicas (HbA1c <7%, individualização)
- Tratamento farmacológico (metformina primeira linha, iSGLT2, GLP-1 RA)
- Complicações microvasculares (retinopatia, nefropatia, neuropatia)
- Complicações macrovasculares (DAC, AVC, DAP)
- Pé diabético

---

### 3. **Infarto Agudo do Miocárdio com Supradesnivelamento do ST (IAMCSST)**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima - emergência)
**Arquivo**: `stemi.json` ou `infarto-agudo-miocardio-csst.json`

**Guidelines sugeridas**:
- 🇺🇸 **ACC/AHA STEMI 2013 + 2023 Update** (referência)
- 🇪🇺 **ESC STEMI 2017** (complementar)
- 🇧🇷 **Diretriz Brasileira IAM SBC 2021** (contexto nacional)

**Tópicos essenciais**:
- Diagnóstico (critérios ECG, biomarcadores)
- Terapia de reperfusão (ICP primária vs fibrinólise, tempos porta-balão)
- Terapia adjuvante (AAS, P2Y12, anticoagulação)
- Complicações mecânicas (ruptura parede, CIV, insuficiência mitral)
- Prevenção secundária (estatina, IECA, betabloqueador)

---

### 4. **Insuficiência Cardíaca com Fração de Ejeção Reduzida (ICFEr)**
**Prevalência ENAMED**: ⭐⭐⭐⭐ (Alta)
**Arquivo**: `heart-failure-reduced-ef.json` ou `insuficiencia-cardiaca-fer.json`

**Guidelines sugeridas**:
- 🇪🇺 **ESC Heart Failure 2021** (mais atual)
- 🇺🇸 **ACC/AHA Heart Failure 2022 Update**
- 🇧🇷 **Diretriz Brasileira IC SBC 2018** (contexto nacional)

**Tópicos essenciais**:
- Classificação (NYHA, estágios ACC/AHA)
- Diagnóstico (ecocardiograma, BNP/NT-proBNP)
- Tratamento farmacológico (quadruple therapy: IECA/BRA/ARNI + BB + ARM + iSGLT2)
- Dispositivos (CDI, ressincronização)
- IC descompensada aguda

**Nota**: Você já tem `miocardiopatia-dilatada.json`, mas IC merece entrada própria focada em manejo clínico.

---

### 5. **Acidente Vascular Cerebral Isquêmico (AVCi)**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima - emergência)
**Arquivo**: `ischemic-stroke.json` ou `avc-isquemico.json`

**Guidelines sugeridas**:
- 🇺🇸 **AHA/ASA Acute Ischemic Stroke 2019**
- 🇪🇺 **ESO Stroke Guidelines 2021**
- 🇧🇷 **Diretriz Brasileira AVC SBC 2021**

**Tópicos essenciais**:
- Reconhecimento (escala Cincinnati, FAST)
- Neuroimagem (TC sem contraste, RM DWI)
- Trombólise (rtPA, janela 4.5h, critérios inclusão/exclusão)
- Trombectomia mecânica (janela 24h em casos selecionados)
- Prevenção secundária (antiagregação, estatina, controle fatores risco)
- AVC cardioembólico (anticoagulação)

---

### 6. **Fibrilação Atrial (FA)**
**Prevalência ENAMED**: ⭐⭐⭐⭐ (Alta)
**Arquivo**: `atrial-fibrillation.json` ou `fibrilacao-atrial.json`

**Guidelines sugeridas**:
- 🇪🇺 **ESC Atrial Fibrillation 2020** (mais completa)
- 🇺🇸 **ACC/AHA/HRS AFib 2019**
- 🇧🇷 **Diretriz Brasileira FA SBC 2016** (desatualizada, usar ESC)

**Tópicos essenciais**:
- Classificação (paroxística, persistente, permanente)
- Controle de frequência (BB, BCC, digoxina)
- Controle de ritmo (cardioversão, antiarrítmicos, ablação)
- Anticoagulação (CHA₂DS₂-VASc, HAS-BLED)
- DOACs vs Warfarina

**Nota**: Você já tem `flutter-atrial.json`, mas FA é muito mais prevalente e merece entrada completa.

---

### 7. **Hipotireoidismo Primário**
**Prevalência ENAMED**: ⭐⭐⭐⭐ (Alta - muito comum)
**Arquivo**: `hypothyroidism.json` ou `hipotireoidismo-primario.json`

**Guidelines sugeridas**:
- 🇺🇸 **ATA Hypothyroidism 2014** (American Thyroid Association)
- 🇪🇺 **ETA Hypothyroidism 2019** (European Thyroid Association)
- 🇧🇷 **SBEM Hipotireoidismo 2013** (contexto nacional)

**Tópicos essenciais**:
- Diagnóstico (TSH elevado, T4 livre baixo)
- Hipotireoidismo subclínico (TSH elevado, T4 livre normal)
- Etiologia (Hashimoto, pós-tireoidectomia, iodo radioativo)
- Tratamento (levotiroxina, dose, ajuste)
- Monitoramento (TSH 6-8 semanas após ajuste)
- Hipotireoidismo na gestação

---

## 🎯 BATCH 5 - Infectologia + Pneumologia (7 doenças)

### 8. **Tuberculose Pulmonar**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima - Brasil alta prevalência)
**Arquivo**: `pulmonary-tuberculosis.json` ou `tuberculose-pulmonar.json`

**Guidelines sugeridas**:
- 🇧🇷 **Manual de Recomendações - Ministério da Saúde 2019** (contexto nacional!)
- 🌍 **WHO TB Guidelines 2022** (global)
- 🇺🇸 **CDC TB Treatment 2016**

**Tópicos essenciais**:
- Diagnóstico (baciloscopia, cultura, Xpert MTB/RIF)
- Esquema básico (RIPE: rifampicina, isoniazida, pirazinamida, etambutol)
- Duração tratamento (6 meses)
- TB resistente (MDR-TB, XDR-TB)
- TB extrapulmonar (meníngea, pleural, ganglionar)
- Tratamento de latência (ILTB)

---

### 9. **Pneumonia Adquirida na Comunidade (PAC)**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima)
**Arquivo**: `community-acquired-pneumonia.json` ou `pneumonia-adquirida-comunidade.json`

**Guidelines sugeridas**:
- 🇺🇸 **IDSA/ATS CAP 2019** (referência global)
- 🇧🇷 **Diretriz Brasileira PAC SBPT 2018**
- 🇪🇺 **ERS/ESCMID CAP 2023**

**Tópicos essenciais**:
- Diagnóstico (clínico, Rx tórax, laboratorial)
- Gravidade (CURB-65, PSI)
- Microbiologia (Streptococcus pneumoniae, Mycoplasma, Chlamydia)
- Tratamento ambulatorial (amoxicilina, macrolídeo)
- Tratamento hospitalar (ceftriaxona + macrolídeo)
- Falha terapêutica

---

### 10. **Infecção do Trato Urinário (ITU)**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima)
**Arquivo**: `urinary-tract-infection.json` ou `infeccao-trato-urinario.json`

**Guidelines sugeridas**:
- 🇺🇸 **IDSA UTI Guidelines 2011 + 2019 Update**
- 🇪🇺 **EAU UTI Guidelines 2023**
- 🇧🇷 **Recomendações SBU (Sociedade Brasileira de Urologia)**

**Tópicos essenciais**:
- Cistite não-complicada (mulher jovem)
- Pielonefrite aguda
- ITU complicada (gestante, DM, imunossupressão)
- Diagnóstico (EAS, urocultura)
- Tratamento empírico (nitrofurantoína, fosfomicina, fluoroquinolona)
- ITU recorrente (profilaxia)

---

### 11. **Asma Brônquica**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima)
**Arquivo**: `asthma.json` ou `asma-bronquica.json`

**Guidelines sugeridas**:
- 🌍 **GINA 2024** (Global Initiative for Asthma - atualizada anualmente!)
- 🇧🇷 **Diretriz Brasileira Asma SBPT 2020**
- 🇺🇸 **NHLBI Asthma Guidelines 2020**

**Tópicos essenciais**:
- Diagnóstico (espirometria, variabilidade PFE)
- Classificação (intermitente, persistente leve/moderada/grave)
- Controle (ACT, ACQ)
- Tratamento escalonado (GINA Steps 1-5)
- Corticoide inalatório + LABA (base do tratamento)
- Crise asmática (manejo agudo)
- Asma grave (biológicos: anti-IgE, anti-IL5)

---

### 12. **DPOC (Doença Pulmonar Obstrutiva Crônica)**
**Prevalência ENAMED**: ⭐⭐⭐⭐ (Alta)
**Arquivo**: `copd.json` ou `dpoc.json`

**Guidelines sugeridas**:
- 🌍 **GOLD 2024** (Global Initiative for COPD - atualizada anualmente!)
- 🇧🇷 **Diretriz Brasileira DPOC SBPT 2021**
- 🇺🇸 **ATS/ERS COPD Standards 2022**

**Tópicos essenciais**:
- Diagnóstico (espirometria pós-BD: VEF₁/CVF <0.7)
- Classificação GOLD (estágios 1-4, grupos A-E)
- Tratamento farmacológico (LAMA, LABA, corticoide inalatório)
- Exacerbação aguda (antibiótico, corticoide sistêmico)
- Reabilitação pulmonar
- Oxigenoterapia domiciliar

---

### 13. **Dengue**
**Prevalência ENAMED**: ⭐⭐⭐⭐⭐ (Altíssima - Brasil endêmico)
**Arquivo**: `dengue.json`

**Guidelines sugeridas**:
- 🇧🇷 **Ministério da Saúde - Dengue 2024** (contexto nacional! Essencial!)
- 🌍 **WHO Dengue Guidelines 2009 (revisado 2012)**
- 🇧🇷 **SBI Dengue 2016** (Sociedade Brasileira de Infectologia)

**Tópicos essenciais**:
- Diagnóstico clínico (febre, mialgia, exantema)
- Sinais de alarme (dor abdominal, vômitos persistentes, sangramento)
- Classificação (dengue sem sinais de alarme, com sinais, grave)
- Manejo (hidratação oral vs venosa)
- Provas torniquete, hemograma (hemoconcentração, plaquetopenia)
- Diagnóstico laboratorial (NS1, IgM, IgG)

---

### 14. **HIV/AIDS**
**Prevalência ENAMED**: ⭐⭐⭐⭐ (Alta - manejo crônico + agudo)
**Arquivo**: `hiv-aids.json`

**Guidelines sugeridas**:
- 🇧🇷 **Protocolo Clínico PCDT HIV - Ministério da Saúde 2023** (contexto nacional!)
- 🇺🇸 **DHHS HIV Treatment Guidelines 2024** (atualizada frequentemente)
- 🌍 **WHO HIV Guidelines 2021**
- 🇪🇺 **EACS HIV Guidelines 2023**

**Tópicos essenciais**:
- Diagnóstico (ELISA, Western Blot, carga viral, CD4)
- Critérios para início TARV (todos os PVHIV independente de CD4)
- Esquemas de primeira linha (2 ITRN + 1 ITRNN ou IP ou INSTI)
- Monitoramento (CD4, carga viral)
- Infecções oportunistas (PCP, toxoplasmose, tuberculose, CMV)
- Profilaxia pós-exposição (PEP)
- Profilaxia pré-exposição (PrEP)

---

## 📊 PROGRESSO ESPERADO

Após Batches 4 e 5:

| Métrica | Atual | Batch 4 | Batch 5 | Meta |
|---------|-------|---------|---------|------|
| **Doenças com fullContent** | 86 | 93 | **100** | ✅ 100 |
| **Doenças sem citações** | 129 | 122 | **115** | ⚠️ <100 |
| **Overrides de alta qualidade** | 26 | 33 | **40** | ✅ 40+ |

**Resultado**: ✅ **100 doenças com fullContent** → Pronto para beta!

---

## 🚀 WORKFLOW OTIMIZADO (Acelerar Produção)

### **Template de Trabalho por Doença** (1-2h cada)

1. **Pesquisar guidelines** (15 min):
   - Buscar no PubMed, sites oficiais (AHA, ESC, WHO, Ministério da Saúde)
   - Priorizar guidelines **2020+** (últimos 4 anos)
   - Baixar PDFs ou guardar URLs

2. **Extrair tópicos principais** (20 min):
   - Definição
   - Epidemiologia
   - Fisiopatologia (resumida)
   - Diagnóstico (critérios, exames)
   - Classificação/Estadiamento
   - Tratamento (primeira linha, alternativas)
   - Complicações
   - Prognóstico

3. **Escrever fullContent** (30 min):
   - Markdown estruturado
   - Usar headings (##, ###)
   - Bullet points para clareza
   - **Incluir citações inline**: `[fonte: ESC HF 2021]`

4. **Adicionar citações estruturadas** (10 min):
   ```json
   "citations": [
     {
       "source": "ESC Heart Failure Guidelines 2021",
       "url": "https://academic.oup.com/eurheartj/...",
       "context": "Recomendação de quadruple therapy para ICFEr",
       "studyType": "guideline",
       "evidenceLevel": "A"
     }
   ]
   ```

5. **Revisar e salvar** (5 min):
   - Verificar JSON válido
   - Salvar em `medical-content/overrides/diseases/`
   - Commit: `feat(medical): add [doença] with citations`

**Tempo total por doença**: ~1.5h
**Batch completo (7 doenças)**: ~10-12h distribuídas em 3-5 dias

---

## 💡 DICAS PARA ACELERAR

### **1. Usar IA para Rascunho Inicial**
```
Prompt para Claude/GPT:
"Crie um resumo estruturado de [DOENÇA] baseado nas guidelines [GUIDELINE].
Formato markdown, tópicos: definição, diagnóstico, tratamento, complicações.
Máximo 800 palavras. Incluir citações inline."
```

**Depois**: Revisar, ajustar tom, adicionar contexto brasileiro.

### **2. Guidelines Mais Citadas (Bookmarks)**
- **Cardiologia**: ESC (esc.org), ACC/AHA (acc.org)
- **Endocrinologia**: ADA (diabetes.org), ATA (thyroid.org)
- **Infectologia**: IDSA (idsociety.org), WHO (who.int)
- **Pneumologia**: GOLD (goldcopd.org), GINA (ginasthma.org)
- **Brasil**: Ministério da Saúde (gov.br/saude), Sociedades Brasileiras

### **3. Batch em Paralelo**
Se tiver tempo:
- Manhã: Pesquisar guidelines de 3-4 doenças
- Tarde: Escrever fullContent de 2-3 doenças
- Noite: Adicionar citações e revisar

**Resultado**: 1 batch completo (7 doenças) em 2-3 dias.

---

## 📅 CRONOGRAMA SUGERIDO

### **Semana 1** (Esta semana)
- **Segunda-Terça**: Batch 4 (doenças 1-7)
- **Quarta-Quinta**: Batch 5 (doenças 8-14)
- **Sexta**: Seed + auditoria → **100 doenças com fullContent** ✅

### **Semana 2** (Beta Semana 1)
- **Segunda**: Configurar beta gate, preparar comunicação
- **Terça-Quarta**: Lançar para 10 pessoas
- **Quinta-Sexta**: Monitorar feedback, fix bugs

### **Semana 3+** (Beta Escala)
- Continuar batches (7-10 doenças/semana) durante beta
- Escalar para 25 → 50 usuários

---

## ✅ CHECKLIST POR DOENÇA

Use esta checklist para cada doença do batch:

```markdown
### [Nome da Doença]
- [ ] Guidelines identificadas (≥2, sendo 1 internacional recente)
- [ ] fullContent escrito (600-1000 palavras)
- [ ] Tópicos obrigatórios incluídos (diagnóstico, tratamento, complicações)
- [ ] Citações estruturadas adicionadas (≥2)
- [ ] JSON válido (testado)
- [ ] Arquivo salvo em `overrides/diseases/`
- [ ] Commit feito com mensagem descritiva
```

---

## 🎯 RESULTADO FINAL

**Após Batches 4 e 5**:
- ✅ **100 doenças com fullContent** (40% → 47% de cobertura)
- ✅ **40 overrides de alta qualidade**
- ✅ **Platform pronta para beta de 50 usuários**
- ✅ **Conteúdo médico credível** com citações de guidelines autoritativas

**Próximo passo**: Lançar Beta Semana 1 (10 pessoas) com confiança! 🚀

---

**Boa sorte com os batches! Se precisar de ajuda com qualquer doença específica, é só pedir.** 💪
