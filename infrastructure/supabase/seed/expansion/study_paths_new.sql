-- Darwin Education - New Study Paths
-- ===================================

-- Path 7: Emergências Médicas
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Médicas',
  'Preparação para emergências médicas: PCR, ACLS, emergências cardiovasculares, respiratórias e metabólicas.',
  ARRAY['clinica_medica', 'cirurgia'],
  30.0,
  'dificil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 8: Medicina Baseada em Evidências
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'Medicina Baseada em Evidências',
  'Fundamentos de MBE: níveis de evidência, leitura crítica, revisão sistemática e meta-análise.',
  ARRAY['saude_coletiva'],
  20.0,
  'medio',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 9: Ética e Bioética Médica
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000009',
  'Ética e Bioética Médica',
  'Princípios bioéticos, Código de Ética Médica e dilemas em situações especiais.',
  ARRAY['saude_coletiva'],
  15.0,
  'facil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Path 10: Revisão Final ENAMED
INSERT INTO study_paths (id, title, description, areas, estimated_hours, difficulty, is_public)
VALUES (
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Final ENAMED',
  'Revisão multidisciplinar das 5 áreas com simulados e flashcards para a reta final.',
  ARRAY['clinica_medica','cirurgia','ginecologia_obstetricia','pediatria','saude_coletiva'],
  50.0,
  'dificil',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- Modules for Path 7: Emergências Médicas
-- ========================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000001',
  'a1000000-0000-0000-0000-000000000007',
  'PCR e ACLS',
  'reading',
  '# PCR e ACLS

## Sequência BLS: CAB
Compressões 100-120/min, profundidade 5-6 cm, recoil completo. Proporção 30:2 (compressões:ventilações).

## Ritmos Chocáveis: FV e TV sem Pulso
- Desfibrilação: 200 J bifásico
- Amiodarona: 300 mg IV bolus (repetir 150 mg)
- Adrenalina: 1 mg IV a cada 3-5 min
- RCP por 2 min entre choques

## Ritmos Não Chocáveis: Assistolia e AESP
- Adrenalina 1 mg IV a cada 3-5 min
- Buscar causas reversíveis: **5H 5T**
  - Hipóxia, Hipovolemia, Hipo/Hipercalemia, H+ (acidose), Hipotermia
  - Tensão (pneumotórax), Tamponamento, Trombose coronária, Trombose pulmonar, Tóxicos

## Algoritmo ACLS
Ciclo contínuo: confirmar PCR → RCP → monitorar ritmo a cada 2 min → choque se indicado → drogas → IOT quando oportuno. Rotacionar compressores a cada 2 min.

## Cuidados Pós-PCR (ROSC)
- SpO2 92-98%, MAP >65 mmHg
- **Controle direcionado de temperatura (TTM)**: 32-36°C por ≥24h em comatosos pós-PCR (todos os ritmos); prevenir febre ≥37,7°C
- Cateterismo urgente se IAMCSST
- Monitoração neurológica em UTI por 72h',
  30,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000002',
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Cardiovasculares',
  'reading',
  '# Emergências Cardiovasculares

## Síndrome Coronariana Aguda (SCA)
### IAMCSST
- ECG: supra ST ≥1 mm em ≥2 derivações contíguas (≥2 mm em V1-V3 homens >40a; ≥2,5 mm em <40a)
- Troponina elevada
- Reperfusão em <12h: angioplastia primária (preferencial, porta-balão <90 min) ou trombolítico
- AAS 300 mg + ticagrelor 180 mg (preferencial, ESC/AHA) ou prasugrel 60 mg + anticoagulante

### IAMSSST
- Depressão ST ou inversão T + troponina positiva
- Estratificação de risco (GRACE score)
- Cateterismo em 24-72h conforme risco

## Tromboembolismo Pulmonar (TEP)
- **Escore de Wells**: TVP +3, FC>100 +1,5, imobilização/cirurgia +1,5, TEP prévio +1,5, hemoptise +1, câncer +1, diagnóstico alternativo menos provável +3
- D-dímero: se baixa probabilidade e negativo, descarta
- **Angio-TC**: confirmação diagnóstica
- Tratamento: heparina; trombolítico (alteplase 100mg) se maciço

## Dissecção de Aorta
- **Stanford A**: ascendente → cirurgia urgente
- **Stanford B**: descendente → tratamento clínico
- TC contrastada para diagnóstico
- Labetalol IV: FC <60, PAS <120

## Emergência Hipertensiva
PA >180/120 + lesão de órgão-alvo (encefalopatia, EAP, IAM)
- Nitroprussiato IV: redução 25% em 1h',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000003',
  'a1000000-0000-0000-0000-000000000007',
  'Emergências Respiratórias',
  'reading',
  '# Emergências Respiratórias

## IRpA: Tipo I vs Tipo II
- **Tipo I (hipoxêmica)**: PaO2 <60 mmHg, PaCO2 normal. P/F <300. Causas: pneumonia, EAP
- **Tipo II (hipercápnica)**: PaCO2 >45 mmHg + acidose. Causas: DPOC, fadiga muscular
- Gasometria arterial é essencial

## Crise de Asma Grave
Sibilos + taquipneia >30 + SpO2 <92% + uso de acessórios.

### Tratamento Escalonado
1. Salbutamol NBZ 2,5-5 mg a cada 20 min (3 doses)
2. Ipratrópio NBZ 0,5 mg associado
3. Corticoide IV: metilprednisolona 125 mg
4. Sulfato de magnésio IV: 2 g em 20 min
5. IOT se: fadiga, PaCO2 >45, confusão mental

## Pneumotórax Hipertensivo
Emergência: colapso pulmonar com pressão intratorácica elevada.

### Sinais
- Desvio traqueal contralateral
- Hipotensão + turgência jugular
- Hiperressonância + MV abolido

### Tratamento
1. **Toracocentese descompressiva**: agulha 14G no 2º EIC linha hemiclavicular (alternativa: 4º-5º EIC linha axilar anterior — ATLS 10ª ed.)
2. **Drenagem torácica**: tubo 28-32 Fr no 5º EIC linha axilar média, selo d''água',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000004',
  'a1000000-0000-0000-0000-000000000007',
  'Intoxicações e Emergências Metabólicas',
  'reading',
  '# Intoxicações e Emergências Metabólicas

## Cetoacidose Diabética (CAD)
Glicose >250, pH <7,3, bicarbonato <18, cetonúria.

### Tratamento
1. **SF 0,9%**: 1-1,5 L na 1ª hora, depois 250-500 mL/h
2. **Insulina regular IV**: 0,1 U/kg/h (meta: redução 50-75 mg/dL/h)
3. **Reposição de K+**: 20-40 mEq/L se K+ 3,3-5,2; **ADIAR insulina se K+ <3,3 mEq/L** até correção (risco de arritmia fatal)
4. Tratar fator precipitante (infecção)

## Crise Tireotóxica
Escore de Burch-Wartofsky >45.
- Propiltiouracil 500-1000 mg dose de ataque, depois 200-300 mg 6/6h → Lugol após 1h (5 gts 6/6h)
- Propranolol para controle adrenérgico
- Hidrocortisona 100 mg IV 8/8h

## Intoxicações Comuns
| Agente | Antídoto |
|--------|----------|
| Paracetamol | N-acetilcisteína (NAC) |
| Organofosforados | Atropina + pralidoxima |
| Benzodiazepínicos | Flumazenil |
| Opioides | Naloxona |
| Cumarínicos | Vitamina K |

## Hipercalemia (K+ >6,5)
1. Gluconato de cálcio 10% 10 mL IV em 2-3 min (estabiliza membrana — NÃO reduz K+)
2. Insulina regular 10 UI + glicose 50% 50 mL IV (desloca K+ intracelular, reduz ~0,5-1 mEq/L em 15-30 min)
3. Salbutamol NBZ 10-20 mg (reduz ~0,5 mEq/L)
4. Resina de troca (poliestirenossulfonato) ou diálise se refratária',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0007-000000000005',
  'a1000000-0000-0000-0000-000000000007',
  'Quiz: Emergências',
  'quiz',
  NULL,
  60,
  5
) ON CONFLICT (id) DO NOTHING;

-- ====================================================
-- Modules for Path 8: Medicina Baseada em Evidências
-- ====================================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000001',
  'a1000000-0000-0000-0000-000000000008',
  'Níveis de Evidência e Graus de Recomendação',
  'reading',
  '# Níveis de Evidência e Graus de Recomendação

## Pirâmide de Evidências
Da base ao topo:
1. Opinião de especialista
2. Série de casos
3. Caso-controle
4. Coorte
5. Ensaio Clínico Randomizado (ECR)
6. **Revisão Sistemática / Meta-análise** (topo)

## Sistema Oxford CEBM
- **1a**: RS de ECRs homogêneos
- **1b**: ECR individual bem desenhado
- **2a**: RS de coortes
- **2b**: Coorte individual
- **3a**: RS de caso-controle
- **3b**: Caso-controle individual
- **4**: Série de casos
- **5**: Opinião de especialista

## Graus de Recomendação
- **A**: Consistente nível 1
- **B**: Estudos nível 2-3 consistentes
- **C**: Estudos nível 4
- **D**: Nível 5 ou inconsistentes

## Sistema GRADE
Qualidade: alta, moderada, baixa, muito baixa.
- Inicia como alta para ECRs, pode ser rebaixada por viés, inconsistência, imprecisão
- Inicia como baixa para observacionais, pode ser elevada por grande efeito
- Força: forte ou condicional',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000002',
  'a1000000-0000-0000-0000-000000000008',
  'Leitura Crítica de Artigos',
  'reading',
  '# Leitura Crítica de Artigos

## Estrutura PICO
- **P**: População (ex: adultos com DM2)
- **I**: Intervenção (metformina)
- **C**: Comparação (placebo)
- **O**: Outcome (controle glicêmico)

## Validade Interna
- Viés de seleção: randomização adequada?
- Viés de aferição: cegamento (simples/duplo/triplo)?
- Viés de confusão: fatores não controlados?
- Análise por intenção de tratar (ITT)

## Validade Externa
Generalização para outras populações. Considerar critérios de inclusão/exclusão.

## Medidas de Efeito
- **RR (Risco Relativo)**: incidência expostos / não expostos. RR <1 = protetor
- **RRA**: diferença absoluta entre grupos
- **OR (Odds Ratio)**: aproxima RR em eventos raros
- **NNT**: 1/RRA. Quanto menor, mais eficaz
- **NNH**: 1/aumento absoluto de risco (dano)

## IC 95% e Significância
- IC que não cruza 1 (para RR/OR) = significativo
- p <0,05 rejeita H0
- Significância estatística ≠ clínica

## CONSORT
Checklist com 25 itens para relato de ECRs: fluxograma, randomização, cegamento, baselines.',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000003',
  'a1000000-0000-0000-0000-000000000008',
  'Revisão Sistemática e Meta-análise',
  'reading',
  '# Revisão Sistemática e Meta-análise

## Protocolo PRISMA
Padroniza relatórios: identificação → triagem → elegibilidade → inclusão.
- 27 itens obrigatórios
- Registro em PROSPERO para transparência

## Busca em Bases
- **PubMed**: termos MeSH, operadores booleanos
- **LILACS**: literatura latino-americana
- **Cochrane Library**: revisões prontas
- Incluir literatura cinzenta (clinicaltrials.gov)

## Forest Plot
- Cada estudo: quadrado (efeito) + linha horizontal (IC)
- **Diamante**: efeito combinado da meta-análise
- À esquerda de 1 (para RR/OR) = favorece tratamento

## Heterogeneidade I²
- **<25%**: baixa
- **25-75%**: moderada
- **>75%**: alta
- Teste qui-quadrado: p <0,10 indica heterogeneidade
- Se alta: análise de subgrupos ou modelo de efeitos aleatórios

## Funnel Plot
Efeito vs tamanho amostral. Assimetria sugere viés de publicação.
- Teste de Egger quantifica a assimetria

## Análise de Sensibilidade
Excluir estudos de baixa qualidade ou outliers para testar robustez do resultado.',
  20,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0008-000000000004',
  'a1000000-0000-0000-0000-000000000008',
  'Quiz: MBE',
  'quiz',
  NULL,
  60,
  4
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Modules for Path 9: Ética e Bioética Médica
-- =============================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000001',
  'a1000000-0000-0000-0000-000000000009',
  'Princípios da Bioética',
  'reading',
  '# Princípios da Bioética

## Beauchamp e Childress (1979)
Quatro princípios fundamentais da bioética médica:

## Autonomia
Respeitar a capacidade decisória do paciente.
- **Consentimento informado**: informação clara, voluntariedade, competência
- Avaliar capacidade de compreensão e comunicação
- Direito à **recusa de tratamento**, mesmo vital
- Em menores: envolver pais, mas adolescentes maduros podem consentir

## Beneficência
Agir pelo bem do paciente; maximizar benefícios.
- Basear condutas em evidências científicas
- Evitar paternalismo: respeitar escolhas informadas

## Não-Maleficência
*Primum non nocere* — não causar dano.
- Ponderar riscos vs benefícios de cada intervenção
- Evitar procedimentos fúteis ou desnecessários

## Justiça
Distribuição equitativa de recursos e cuidados.
- **Justiça distributiva**: alocação de UTIs, transplantes
- Sem discriminação por raça, gênero, status social
- No SUS: garantir acesso universal (Lei 8.080/90)

## Dignidade e Vulnerabilidade
- Preservar privacidade em todos os estágios
- Proteção especial a vulneráveis: idosos, crianças, indígenas
- Comitês de ética hospitalar para dilemas complexos',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000002',
  'a1000000-0000-0000-0000-000000000009',
  'Código de Ética Médica',
  'reading',
  '# Código de Ética Médica

## Base Legal
Resolução CFM nº 2.217/2018 (atualizado).

## Direitos do Médico
- Remuneração justa e condições de trabalho seguras
- Liberdade de exercício profissional
- Pode recusar paciente fora de plantão (exceto emergência)

## Sigilo Profissional (Art. 22-31)
- Sigilo é **absoluto**: não divulgar informações sem consentimento
- Exceções: dever legal de notificação (doenças compulsórias), risco iminente a terceiros
- Mantenha sigilo mesmo após morte do paciente

## Relação Médico-Paciente
- Informar riscos e benefícios de procedimentos
- Evitar propaganda enganosa (Art. 34): proibida autopromoção sensacionalista
- Respeitar segunda opinião

## Infrações Éticas
- **Imperícia**: falta de conhecimento técnico
- **Imprudência**: ação precipitada sem cautela
- **Negligência**: omissão de cuidados devidos

## Punições
Advertência → censura → suspensão → cassação do registro

## Processo Ético-Disciplinar
- Denúncia ao CRM → investigação → defesa → julgamento
- Direito a ampla defesa
- Apelação ao CFM',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000003',
  'a1000000-0000-0000-0000-000000000009',
  'Ética em Situações Especiais',
  'reading',
  '# Ética em Situações Especiais

## Terminalidade
Fase irreversível da doença com morte iminente. Foco em qualidade de vida.

### Cuidados Paliativos (OMS)
- Alívio de dor e sintomas (escada analgésica)
- Suporte psicológico ao paciente e família
- Não acelerar nem postergar a morte

## Eutanásia
Ato de provocar a morte para aliviar sofrimento.
- **Crime no Brasil**: Código Penal art. 121 (homicídio)
- Proibida pelo CFM, mesmo com consentimento do paciente

## Distanásia
Obstinação terapêutica: prolongar sofrimento com medidas fúteis.
- Viola princípio da não-maleficência
- Ex: manter ventilação mecânica em coma irreversível

## Ortotanásia
Morte natural digna, sem prolongamento artificial.
- **Resolução CFM 1.805/2006**: permite suspender medidas desproporcionais
- Com consentimento do paciente ou representante legal
- Médico pode limitar ou suspender tratamentos fúteis

## Diretivas Antecipadas de Vontade (DAV)
**Resolução CFM 1.995/2012**: expressão prévia de preferências para fim de vida.
- Requer duas testemunhas
- Válida quando paciente perde capacidade de decisão
- Equipe deve respeitar, exceto se contraindicação ética
- Ex: recusa de IOT, preferência por sedação paliativa',
  20,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0009-000000000004',
  'a1000000-0000-0000-0000-000000000009',
  'Quiz: Ética',
  'quiz',
  NULL,
  60,
  4
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Modules for Path 10: Revisão Final ENAMED
-- ==========================================

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000001',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Cirurgia',
  'reading',
  '# Revisão Rápida: Cirurgia

## Abdome Agudo
- **Apendicite**: Dor FID, Alvarado >7 → cirurgia. Murphy → colecistite
- **Colecistite**: USG (litíase + parede espessada). Colecistectomia 72h

## Trauma ATLS
- ABCDE: via aérea → respiração → circulação → neurológico → exposição
- FAST: hemoperitônio (líquido em Morrison, Douglas, esplênico)
- Choque hemorrágico: classes I-IV, cristaloides + hemoderivados

## Hérnias
- Inguinal: Lichtenstein (tela tension-free). TEP/TAPP se bilateral
- Femoral: maior risco de estrangulamento
- Emergência se encarceramento + sinais de isquemia

## Câncer Colorretal
- Rastreio: colonoscopia >50 anos
- CEA: monitoramento (não diagnóstico)
- Tratamento: colectomia + linfadenectomia ≥12 linfonodos

## Obstrução Intestinal
- **Delgado**: bridas (pós-cirúrgica), RX com níveis hidroaéreos
- **Grosso**: tumor (colonoscopia). Vólvulo de sigmoide: descompressão endoscópica',
  25,
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000002',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: GO',
  'reading',
  '# Revisão Rápida: Ginecologia e Obstetrícia

## Pré-Natal
- Mínimo 6 consultas; mensal até 28s, quinzenal até 36s, semanal após
- 1º tri: tipagem, VDRL, HIV, toxo, USG 11-14s
- 2º tri: TOTG 24-28s, USG morfológico
- 3º tri: repetir sorologias, cultura GBS 35-37s

## DHEG (Pré-eclâmpsia)
- PA >140/90 após 20 sem + proteinúria ou LOA
- MgSO4 (Pritchard ou Zuspan) para profilaxia de eclâmpsia
- Parto se ≥37 sem ou grave refratária

## Diabetes Gestacional
- TOTG 75g 24-28 sem: jejum >92, 1h >180, 2h >153
- Dieta + atividade física → insulina se falha
- Macrossomia fetal é complicação principal

## CA Colo Uterino
- Rastreio: Papanicolau (citologia) anual
- HPV 16/18 responsáveis por 70%
- NIC → HSIL → conização; CA invasivo: histerectomia + radio

## Métodos Contraceptivos
- DIU-Cu: 10 anos, 99% eficácia
- DIU-LNG: 5 anos, reduz sangramento
- Implante subdérmico: 3-5 anos, 99,9% eficácia',
  25,
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000003',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Pediatria',
  'reading',
  '# Revisão Rápida: Pediatria

## Aleitamento Materno
- Exclusivo até 6 meses; complementado até 2 anos
- Protege contra infecções (IgA secretora), reduz mortalidade
- Contraindicações: HIV, HTLV, galactosemia

## Calendário Vacinal
- Nascimento: BCG + Hepatite B
- 2/4/6 meses: Penta, VIP, Pneumo 10, Rotavírus
- 12 meses: Tríplice viral, Pneumo reforço, Meningo C reforço
- 15 meses: DTP reforço, VOP, Hepatite A, Tetra viral

## Doenças Exantemáticas
- **Sarampo**: Koplik + exantema cefalocaudal
- **Varicela**: vesículas em estágios diferentes
- **Escarlatina**: língua framboesa + rash "lixa"
- **Eritema infeccioso**: face esbofeteada

## Desidratação
- Plano A: SRO domiciliar (leve)
- Plano B: SRO supervisionado 75 mL/kg/4h (moderada)
- Plano C: SF IV 20 mL/kg bolus (grave)
- Zinco em diarreia aguda

## IVAS
- Otite: amoxicilina se <2 anos ou grave
- Amigdalite: Centor → penicilina se estreptocócica',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000004',
  'a1000000-0000-0000-0000-000000000010',
  'Revisão Rápida: Saúde Coletiva',
  'reading',
  '# Revisão Rápida: Saúde Coletiva

## SUS
- Princípios doutrinários: universalidade, equidade, integralidade
- Leis orgânicas: 8.080/90 e 8.142/90
- Financiamento tripartite; descentralização

## Epidemiologia
- **Incidência**: casos novos / população em risco
- **Prevalência**: casos existentes / total (prevalência = incidência × duração)
- **RR**: incidência expostos / não expostos (coorte)
- **OR**: odds expostos / não expostos (caso-controle)

## ESF (Estratégia Saúde da Família)
- Equipe: médico, enfermeiro, técnicos, ACS
- 1 ACS para cada 150-200 famílias
- Território definido, visitas domiciliares

## Vigilância em Saúde
- Notificação compulsória: >60 doenças (SINAN)
- Surto: ≥2 casos relacionados no tempo/espaço
- Investigação: busca ativa, bloqueio vacinal

## Bioestatística
- ECR: padrão-ouro para causalidade
- NNT = 1/RRA (baixo = eficaz)
- IC 95%: se não cruza 1, significativo
- p <0,05 rejeita hipótese nula',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000005',
  'a1000000-0000-0000-0000-000000000010',
  'Flashcards: Revisão Multidisciplinar',
  'flashcards',
  NULL,
  120,
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0010-000000000006',
  'a1000000-0000-0000-0000-000000000010',
  'Simulado Completo Final',
  'quiz',
  NULL,
  300,
  6
) ON CONFLICT (id) DO NOTHING;
