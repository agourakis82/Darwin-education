-- Darwin Education - New Study Modules for Existing Paths
-- ======================================================

-- Path 1: CM - Insuficiência Cardíaca
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Insuficiência Cardíaca',
  'reading',
  '# Insuficiência Cardíaca

## Definição
Síndrome clínica caracterizada pela incapacidade do coração em bombear sangue suficiente para atender às demandas metabólicas, resultando em dispneia, fadiga e retenção de líquidos.

## Classificação NYHA
- **Classe I**: Sem limitação; atividade física ordinária não causa sintomas
- **Classe II**: Leve limitação; conforto em repouso, atividade leve causa fadiga ou dispneia
- **Classe III**: Limitação marcada; sintomas com atividade mínima
- **Classe IV**: Incapacidade; sintomas presentes em repouso

## Critérios de Framingham
### Maiores
Dispneia paroxística noturna, ortopneia, estertores pulmonares, galope B3, turgência jugular, PVC >16 cmH2O, cardiomegalia, refluxo hepatojugular, edema agudo de pulmão, perda >4,5 kg com diurético

### Menores
Edema bilateral, tosse noturna, dispneia aos esforços, hepatomegalia, derrame pleural, FC >120 bpm, capacidade vital reduzida em 1/3

Diagnóstico: 2 maiores OU 1 maior + 2 menores.

## Tratamento Escalonado (ICFER)

### IECA/BRA
Enalapril: reduz mortalidade em IC grave NYHA IV em 40% aos 6 meses (CONSENSUS) e 16% em IC leve-moderada (SOLVD-Treatment). Sacubitril/valsartana superior ao enalapril em 20% no desfecho composto (PARADIGM-HF). Monitorar função renal e potássio.

### Betabloqueadores
Carvedilol, bisoprolol ou metoprolol succinato. Reduzem mortalidade em 34%. Titulação gradual após estabilização.

### Espironolactona
Antagonista da aldosterona; reduz mortalidade em 30% (RALES). Dose 25mg/dia. Monitorar K+ e creatinina.

### Inibidores SGLT2
Dapagliflozina, empagliflozina. Reduzem desfecho composto (morte CV + hospitalização por IC) em 26% (DAPA-HF, HR 0,74) e 25% (EMPEROR-Reduced, HR 0,75), independente da FE. Benefícios em função renal (DAPA-CKD: 39% redução desfecho renal composto).

## Dispositivos
- DAI: prevenção morte súbita em FE <35%
- TRC: dissincronismo com BRE e FE <35%',
  30,
  6
) ON CONFLICT (id) DO NOTHING;

-- Path 1: CM - IRA e DRC
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000007',
  'a1000000-0000-0000-0000-000000000001',
  'Insuficiência Renal Aguda e Crônica',
  'reading',
  '# Insuficiência Renal Aguda e Crônica

## Insuficiência Renal Aguda (IRA)
Aumento rápido da creatinina sérica (≥0,3 mg/dL em 48h ou ≥50% em 7 dias) ou oligúria (<0,5 mL/kg/h por 6h).

### Classificação por Causa
- **Pré-renal (60%)**: Hipoperfusão sem dano tubular. BUN/Cr >20, FeNa <1%
- **Renal (35%)**: Dano intrínseco (NTA, nefrite, glomerulonefrite). FeNa >2%
- **Pós-renal (5%)**: Obstrução (litíase, HPB). USG com hidronefrose

### Manejo
Correção da causa, hidratação em pré-renal, alívio de obstrução em pós-renal.

### Indicações de Diálise de Urgência
- K+ >6,5 mEq/L refratário
- Acidose pH <7,2 refratária
- Uremia sintomática (encefalopatia, pericardite)
- Sobrecarga volêmica refratária

## Doença Renal Crônica (DRC)
Dano renal ≥3 meses com alteração de TFG ou marcadores.

### Classificação KDIGO
| Estágio | TFG (mL/min/1,73m²) | Descrição |
|---------|----------------------|-----------|
| 1       | ≥90                 | Normal com dano |
| 2       | 60-89               | Leve |
| 3a      | 45-59               | Moderada |
| 3b      | 30-44               | Moderada-grave |
| 4       | 15-29               | Grave |
| 5       | <15                 | Terminal |

### Tratamento
- PA <130/80 com IECA/BRA (nefroproteção)
- Controle glicêmico, dieta hipoproteica
- SGLT2i: benefício renal comprovado (DAPA-CKD)
- Evitar nefrotóxicos (AINEs, contrastes)
- Transplante renal: tratamento definitivo para DRC-5',
  30,
  7
) ON CONFLICT (id) DO NOTHING;

-- Path 1: CM - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0001-000000000008',
  'a1000000-0000-0000-0000-000000000001',
  'Quiz: Clínica Médica Avançado',
  'quiz',
  NULL,
  15,
  8
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Hérnias
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000004',
  'a1000000-0000-0000-0000-000000000002',
  'Hérnias da Parede Abdominal',
  'reading',
  '# Hérnias da Parede Abdominal

## Tipos
- **Inguinal Indireta**: Congênita, segue canal inguinal. Mais comum em jovens
- **Inguinal Direta**: Adquirida, medial aos vasos epigástricos. Mais em idosos
- **Femoral**: Abaixo do ligamento inguinal. Mais em mulheres. Alto risco encarceramento
- **Incisional**: Pós-cirúrgica. Fatores: infecção, obesidade, tosse crônica

## Classificação Nyhus
- **Tipo I**: Indireta com anel interno normal
- **Tipo II**: Indireta com anel dilatado
- **Tipo III**: Defeito do assoalho (IIIa direta, IIIb indireta, IIIc femoral)
- **Tipo IV**: Recidivante

## Diagnóstico
Clínico: inspeção em pé, Valsalva. USG para dúvida; TC se complicação.

## Tratamento
### Técnica de Lichtenstein
Aberta, tensão livre com tela de polipropileno. Taxa recorrência <2%. Padrão-ouro para inguinais unilaterais.

### Laparoscópica (TEP/TAPP)
- TEP: pré-peritoneal, sem entrar na cavidade. Ideal para bilateral
- TAPP: transabdominal. Melhor visualização

## Complicações
Encarceramento (5-15%), estrangulamento (emergência). Dor crônica pós-operatória em até 10%.',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Oncologia
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000005',
  'a1000000-0000-0000-0000-000000000002',
  'Oncologia Cirúrgica',
  'reading',
  '# Oncologia Cirúrgica

## Câncer Gástrico
Adenocarcinoma; fatores: H. pylori, dieta salgada/defumada. Sintomas: epigastralgia, perda ponderal, anemia.
- Gastrectomia subtotal (distal) ou total (proximal)
- Linfadenectomia D2
- Quimioterapia neoadjuvante (FLOT) em avançados

## Câncer Colorretal
Pólipos adenomatosos como precursores. Screening colonoscopia >50 anos.
- Colectomia segmentar + linfadenectomia (≥12 linfonodos)
- TME para reto (excisão mesorretal total)
- CEA para monitoramento; quimio adjuvante estágio III+

## Câncer de Esôfago
Escamoso (tabaco/álcool) ou adenocarcinoma (Barrett/DRGE). Disfagia progressiva.
- Esofagectomia para localizados
- Quimiorradioterapia neoadjuvante (protocolo CROSS)

## Câncer Hepático (HCC)
Em cirróticos (HBV/HCV); alfa-fetoproteína, USG semestral para rastreio.
- Hepatectomia se <5cm sem cirrose descompensada
- Ablação RFA para pequenos
- Transplante: critérios de Milão (1 nódulo ≤5cm ou até 3 ≤3cm)

## Estadiamento TNM
- T: tamanho e invasão (T1-T4)
- N: linfonodos (N0-N3)
- M: metástases (M0/M1)',
  25,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 2: CIR - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0002-000000000006',
  'a1000000-0000-0000-0000-000000000002',
  'Quiz: Cirurgia Avançado',
  'quiz',
  NULL,
  15,
  6
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Parto
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000003',
  'a1000000-0000-0000-0000-000000000003',
  'Trabalho de Parto e Partograma',
  'reading',
  '# Trabalho de Parto e Partograma

## Fases do Parto
- **Latente**: Dilatação 0-6 cm; duração 6-10h nulíparas. Contrações irregulares
- **Ativa**: Dilatação 6-10 cm; aceleração 1 cm/h. Contrações regulares
- **Expulsão**: Descida e nascimento do concepto
- **Dequitação**: Expulsão placentária (até 30 min)

## Partograma OMS
Ferramenta gráfica para monitorar progressão:
- Eixo X: tempo (horas)
- Eixo Y: dilatação (cm) e plano de De Lee
- **Linha de alerta**: 1 cm/h a partir de 4 cm (OMS clássico). Nota: OMS 2018 e ACOG 2014 consideram fase ativa a partir de 6 cm — o partograma da OMS original usa 4 cm
- **Linha de ação**: 4h à direita da alerta (indica distocia)

### Monitoramento
- BCF fetal: 110-160 bpm
- Dinâmica uterina: 3-5 contrações/10min
- Líquido amniótico: claro (normal) vs meconial

## Indicações de Cesariana
- Sofrimento fetal agudo (bradicardia persistente)
- Desproporção cefalopélvica
- Apresentação pélvica
- Placenta prévia total
- Pré-eclâmpsia grave refratária

## Distocias
- **De progressão**: Hipodinamia → ocitocina IV
- **Mecânica**: DCP → cesárea
- **De ombro**: Manobra de McRoberts, pressão suprapúbica',
  30,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Patologias Ginecológicas
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000004',
  'a1000000-0000-0000-0000-000000000003',
  'Patologias Ginecológicas',
  'reading',
  '# Patologias Ginecológicas

## Endometriose
Implantes endometriais ectópicos; prevalência 10% em idade reprodutiva.
- Sintomas: dismenorreia, dispareunia, infertilidade
- Diagnóstico: laparoscopia (padrão-ouro); USG com preparo
- Tratamento: COC contínuo, agonistas GnRH, cirurgia conservadora

## Miomas Uterinos
Tumores benignos; 20-40% mulheres >35 anos.
- Subtipos: submucoso (sangramento), intramural, subseroso
- Diagnóstico: USG transvaginal
- Tratamento: observação, ulipristal, miomectomia ou histerectomia

## Síndrome dos Ovários Policísticos (SOP)
Critérios Rotterdam (2/3): hiperandrogenismo + anovulação + ovários policísticos.
- Sintomas: hirsutismo, acne, irregularidade menstrual
- Tratamento: perda de peso, COC, metformina, clomifeno para fertilidade

## Sangramento Uterino Anormal (SUA)
Classificação PALM-COEIN:
- **Estrutural**: Pólipo, Adenomiose, Leiomioma, Malignidade
- **Não Estrutural**: Coagulopatia, Ovulatório, Endometrial, Iatrogênico, Não classificado
- Avaliação: USG, biópsia endometrial >45 anos
- Tratamento: DIU-LNG, COC, antifibrinolíticos, cirurgia',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 3: GO - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0003-000000000005',
  'a1000000-0000-0000-0000-000000000003',
  'Quiz: GO Completo',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Exantemáticas
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'Doenças Exantemáticas',
  'reading',
  '# Doenças Exantemáticas

## Sarampo
Paramixovírus; transmissão aérea. Incubação 10-14 dias.
- Pródromos: febre alta, tosse, coriza, conjuntivite (3Cs)
- **Manchas de Koplik** (patognomônicas): mucosa jugal
- Exantema maculopapular cefalocaudal
- Complicações: otite, pneumonia, encefalite
- Tratamento: suporte + vitamina A

## Rubéola
Togavírus; risco teratogênico (Síndrome da Rubéola Congênita).
- Linfadenopatia retroauricular + exantema rosado discreto
- Mancha de Forchheimer (palato)
- Vacina tríplice viral

## Varicela
VZV; altamente contagiosa.
- Vesículas pruriginosas em diferentes estágios ("céu estrelado")
- Evolui: mácula → pápula → vesícula → crosta
- Aciclovir em imunossuprimidos

## Escarlatina
Estreptococo grupo A; exotoxina.
- Exantema fino "lixa", língua em framboesa
- Linhas de Pastia (dobras cutâneas)
- Tratamento: penicilina (prevenção reumática)

## Eritema Infeccioso (5ª doença)
Parvovírus B19; "face esbofeteada"
- Rash malar + padrão rendilhado em tronco

## Exantema Súbito (6ª doença)
HHV-6; <2 anos
- Febre alta 3-5 dias → rash após cessar febre',
  30,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Urgências
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'Urgências Pediátricas',
  'reading',
  '# Urgências Pediátricas

## Bronquiolite
VRS; <2 anos. Rinorreia → tosse → sibilos → taquipneia.
- Diagnóstico clínico; RX se pneumonia suspeita
- Tratamento: O2 se Sat<92%, hidratação, NBZ salina hipertônica
- NÃO usar broncodilatadores de rotina
- Internação: desidratação, apneia, <3 meses

## Desidratação
### Classificação e Tratamento
| Grau | Perda | Plano |
|------|-------|-------|
| Leve (<5%) | Sem sinais | A: SRO domiciliar |
| Moderada (5-10%) | Olhos fundos, turgor ruim | B: SRO supervisionado 75 mL/kg/4h |
| Grave (>10%) | Choque | C: SF IV 20 mL/kg bolus |

- Sinais: fontanela deprimida, oligúria, letargia
- Reidratar + zinco em diarreia

## Convulsão Febril
Crise com febre >38°C; 2-5 anos; sem infecção do SNC.
- Simples: generalizada, <15 min, única em 24h
- Complexa: focal, >15 min, ou múltipla
- Tratamento agudo: diazepam retal 0,5 mg/kg
- Recorrência: 30%; epilepsia: 2-5%

## PCR Pediátrica
Causa mais comum: hipóxia (diferente do adulto).
- Compressões 100-120/min, 1/3 do AP do tórax
- Adrenalina 0,01 mg/kg IV/IO a cada 3-5 min
- Desfibrilação 2-4 J/kg',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 4: PED - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0004-000000000005',
  'a1000000-0000-0000-0000-000000000004',
  'Quiz: Pediatria Avançado',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - Bioestatística
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000003',
  'a1000000-0000-0000-0000-000000000005',
  'Bioestatística',
  'reading',
  '# Bioestatística

## Tipos de Estudo
- **ECR**: Ensaio Clínico Randomizado — padrão-ouro para causalidade
- **Coorte**: Prospectivo, mede incidência e RR
- **Caso-controle**: Retrospectivo, mede OR
- **Transversal**: Prevalência, fotografia do momento
- **Ecológico**: Populações, não indivíduos

## Viés
- **Seleção**: Amostra não representativa
- **Informação**: Recall bias, aferição diferencial
- **Confusão**: Terceira variável; controlar por estratificação ou regressão

## Intervalo de Confiança (IC)
IC 95%: contém parâmetro verdadeiro em 95% das vezes.
- RR ou OR significativo se IC não cruza 1
- Quanto mais estreito, mais preciso

## Teste de Hipótese
- H0 (nula): sem efeito
- H1 (alternativa): há efeito
- p <0,05: rejeita H0
- Erro tipo I (α): falso positivo
- Erro tipo II (β): falso negativo
- Poder = 1 - β (ideal ≥80%)

## NNT (Número Necessário para Tratar)
NNT = 1/RRA (redução absoluta de risco)
- NNT baixo = tratamento eficaz
- Ex: RRA 5% → NNT = 20',
  25,
  3
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - APS/ESF
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'Atenção Primária e Estratégia Saúde da Família',
  'reading',
  '# Atenção Primária e ESF

## Estratégia Saúde da Família (ESF)
Modelo desde 1994; cobertura de ~76% da população brasileira (2024).

### Equipe
- Médico generalista ou de família
- Enfermeiro
- Técnicos de enfermagem
- Agentes Comunitários de Saúde (ACS): 1 para cada 150-200 famílias

### Território
Microáreas definidas por vulnerabilidade; cadastro via e-SUS.

## NASF-AB / eMulti
O antigo NASF (2008) foi renomeado NASF-AB em 2020 e, a partir de 2023/2024, está em transição para o programa **eMulti** (Equipes Multiprofissionais na APS).
Equipes multiprofissionais: nutricionista, psicólogo, fisioterapeuta.
- Apoio matricial às ESF
- Foco em casos complexos e crônicos

## Ações da APS
- Promoção: educação em saúde, grupos operativos
- Prevenção: vacinação, rastreamento
- Tratamento: consultas, visitas domiciliares
- Reabilitação: pós-AVC, pós-cirúrgicos

## Indicadores de Saúde
- Cobertura vacinal (meta >95%)
- Mortalidade infantil (<10/1000 NV)
- Cobertura ESF (% da população)
- Internações por condições sensíveis à APS

## Princípios da APS (Starfield)
1. Primeiro contato (acesso)
2. Longitudinalidade (vínculo)
3. Integralidade (abrangência)
4. Coordenação do cuidado',
  25,
  4
) ON CONFLICT (id) DO NOTHING;

-- Path 5: SC - Quiz
INSERT INTO study_modules (id, path_id, title, type, content, estimated_minutes, order_index)
VALUES (
  'b1000000-0000-0000-0005-000000000005',
  'a1000000-0000-0000-0000-000000000005',
  'Quiz: Saúde Coletiva Avançado',
  'quiz',
  NULL,
  15,
  5
) ON CONFLICT (id) DO NOTHING;
