-- ============================================
-- CIP Image Cases - 20 Medical Image Interpretation Cases
-- ============================================
-- SAFE RE-RUNNABLE: Uses ON CONFLICT (title_pt) DO NOTHING
-- Run AFTER cip-schema-migration.sql
-- ============================================

-- Create the cip_image_cases table if it doesn't exist
CREATE TABLE IF NOT EXISTS cip_image_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_pt TEXT NOT NULL UNIQUE,
  clinical_context_pt TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('xray','ct','ekg','ultrasound','mri')),
  image_description_pt TEXT NOT NULL,
  ascii_art TEXT,
  area TEXT NOT NULL CHECK (area IN ('clinica_medica','cirurgia','ginecologia_obstetricia','pediatria','saude_coletiva')),
  subspecialty TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('muito_facil','facil','medio','dificil','muito_dificil')),
  correct_findings TEXT[] NOT NULL,
  correct_diagnosis TEXT NOT NULL,
  correct_next_step TEXT NOT NULL,
  modality_options JSONB NOT NULL,
  findings_options JSONB NOT NULL,
  diagnosis_options JSONB NOT NULL,
  next_step_options JSONB NOT NULL,
  explanation_pt TEXT NOT NULL,
  irt_difficulty NUMERIC(5,3) DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_cip_image_cases_modality ON cip_image_cases(modality);
CREATE INDEX IF NOT EXISTS idx_cip_image_cases_area ON cip_image_cases(area);
CREATE INDEX IF NOT EXISTS idx_cip_image_cases_difficulty ON cip_image_cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_cip_image_cases_public ON cip_image_cases(is_public);

-- ============================================
-- CASE 1: Pneumonia lobar (X-RAY, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Pneumonia lobar',
  'Homem de 45 anos, febre de 38.8°C, tosse produtiva há 5 dias e dispneia progressiva. Sem comorbidades prévias. Ausculta com estertores crepitantes em base direita.',
  'xray',
  'Radiografia de tórax em PA mostrando consolidação homogênea em lobo inferior direito com broncograma aéreo visível. Velamento parcial do seio costofrênico direito sugerindo pequeno derrame parapneumônico. Demais campos pulmonares sem alterações. Área cardíaca dentro dos limites da normalidade.',
  NULL,
  'clinica_medica', 'pneumologia', 'facil',
  ARRAY['Consolidação em lobo inferior direito','Broncograma aéreo','Velamento parcial do seio costofrênico direito'],
  'Pneumonia lobar em base direita',
  'Iniciar antibioticoterapia empírica e colher hemoculturas',
  '[{"id":"m1","text_pt":"Radiografia de Tórax PA","is_correct":true},{"id":"m2","text_pt":"TC de Tórax","is_correct":false},{"id":"m3","text_pt":"USG de Tórax","is_correct":false},{"id":"m4","text_pt":"RM de Tórax","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Consolidação em lobo inferior direito","is_correct":true},{"id":"f2","text_pt":"Broncograma aéreo","is_correct":true},{"id":"f3","text_pt":"Velamento parcial do seio costofrênico direito","is_correct":true},{"id":"f4","text_pt":"Hiperinsuflação pulmonar bilateral","is_correct":false},{"id":"f5","text_pt":"Nódulo pulmonar solitário em ápice esquerdo","is_correct":false},{"id":"f6","text_pt":"Alargamento mediastinal","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Pneumonia lobar em base direita","is_correct":true},{"id":"d2","text_pt":"Tuberculose pulmonar","is_correct":false},{"id":"d3","text_pt":"Tromboembolismo pulmonar","is_correct":false},{"id":"d4","text_pt":"Neoplasia pulmonar","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Iniciar antibioticoterapia empírica e colher hemoculturas","is_correct":true},{"id":"n2","text_pt":"Broncoscopia diagnóstica","is_correct":false},{"id":"n3","text_pt":"TC de tórax com contraste","is_correct":false},{"id":"n4","text_pt":"Observação clínica sem medicação","is_correct":false}]'::jsonb,
  'A consolidação lobar com broncograma aéreo é o achado radiológico clássico de pneumonia bacteriana. O padrão clínico de febre alta, tosse produtiva e estertores crepitantes localizados corrobora o diagnóstico. O tratamento empírico deve ser iniciado prontamente após coleta de hemoculturas.',
  -1.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 2: Pneumotórax (X-RAY, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Pneumotórax espontâneo',
  'Jovem de 22 anos, magro e longilíneo, apresenta dor torácica súbita à direita e dispneia há 2 horas. Murmúrio vesicular abolido em hemitórax direito.',
  'xray',
  'Radiografia de tórax em PA evidenciando hipertransparência em hemitórax direito com ausência de trama vascular na periferia. Linha de pleura visceral claramente visível separando o parênquima pulmonar colapsado do espaço pleural. Sem desvio de traqueia ou mediastino. Hemitórax esquerdo sem alterações.',
  NULL,
  'cirurgia', 'cirurgia_toracica', 'medio',
  ARRAY['Hipertransparência em hemitórax direito','Ausência de trama vascular periférica','Linha de pleura visceral visível'],
  'Pneumotórax espontâneo primário à direita',
  'Drenagem torácica em selo d''água',
  '[{"id":"m1","text_pt":"Radiografia de Tórax PA","is_correct":true},{"id":"m2","text_pt":"TC de Tórax","is_correct":false},{"id":"m3","text_pt":"ECG","is_correct":false},{"id":"m4","text_pt":"USG FAST","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Hipertransparência em hemitórax direito","is_correct":true},{"id":"f2","text_pt":"Ausência de trama vascular periférica","is_correct":true},{"id":"f3","text_pt":"Linha de pleura visceral visível","is_correct":true},{"id":"f4","text_pt":"Consolidação lobar direita","is_correct":false},{"id":"f5","text_pt":"Derrame pleural bilateral","is_correct":false},{"id":"f6","text_pt":"Fratura de clavícula direita","is_correct":false},{"id":"f7","text_pt":"Desvio traqueal para esquerda","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Pneumotórax espontâneo primário à direita","is_correct":true},{"id":"d2","text_pt":"Derrame pleural","is_correct":false},{"id":"d3","text_pt":"Enfisema pulmonar","is_correct":false},{"id":"d4","text_pt":"Atelectasia lobar","is_correct":false},{"id":"d5","text_pt":"Hemotórax","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Drenagem torácica em selo d''água","is_correct":true},{"id":"n2","text_pt":"Observação clínica apenas","is_correct":false},{"id":"n3","text_pt":"Punção aspirativa com agulha fina","is_correct":false},{"id":"n4","text_pt":"Toracotomia de emergência","is_correct":false}]'::jsonb,
  'A hipertransparência com ausência de trama vascular e visualização da linha de pleura visceral é patognomônica de pneumotórax. Em pacientes jovens, magros e longilíneos, o pneumotórax espontâneo primário é o diagnóstico mais provável. A drenagem torácica está indicada quando o pneumotórax é volumoso ou sintomático.',
  0.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 3: ICC/Cardiomegalia (X-RAY, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Insuficiência cardíaca congestiva',
  'Mulher de 68 anos, portadora de hipertensão e diabetes de longa data, apresenta dispneia progressiva há 2 semanas, ortopneia e edema de membros inferiores bilateral.',
  'xray',
  'Radiografia de tórax em PA mostrando área cardíaca aumentada com índice cardiotorácico superior a 0.5. Redistribuição do fluxo vascular pulmonar para ápices (cefalização de fluxo). Linhas B de Kerley nas bases pulmonares bilateralmente. Derrame pleural bilateral discreto com velamento dos seios costofrênicos.',
  NULL,
  'clinica_medica', 'cardiologia', 'facil',
  ARRAY['Cardiomegalia (índice cardiotorácico > 0.5)','Cefalização de fluxo vascular pulmonar','Linhas B de Kerley nas bases','Derrame pleural bilateral discreto'],
  'Insuficiência cardíaca congestiva descompensada',
  'Iniciar diurético endovenoso e monitorizar balanço hídrico',
  '[{"id":"m1","text_pt":"Radiografia de Tórax PA","is_correct":true},{"id":"m2","text_pt":"Ecocardiograma","is_correct":false},{"id":"m3","text_pt":"TC de Tórax","is_correct":false},{"id":"m4","text_pt":"Cintilografia miocárdica","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Cardiomegalia (índice cardiotorácico > 0.5)","is_correct":true},{"id":"f2","text_pt":"Cefalização de fluxo vascular pulmonar","is_correct":true},{"id":"f3","text_pt":"Linhas B de Kerley nas bases","is_correct":true},{"id":"f4","text_pt":"Derrame pleural bilateral discreto","is_correct":true},{"id":"f5","text_pt":"Nódulo pulmonar calcificado","is_correct":false},{"id":"f6","text_pt":"Pneumotórax bilateral","is_correct":false},{"id":"f7","text_pt":"Enfisema subcutâneo","is_correct":false},{"id":"f8","text_pt":"Consolidação em lobo médio","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Insuficiência cardíaca congestiva descompensada","is_correct":true},{"id":"d2","text_pt":"Derrame pericárdico isolado","is_correct":false},{"id":"d3","text_pt":"DPOC exacerbado","is_correct":false},{"id":"d4","text_pt":"Pneumonia bilateral","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Iniciar diurético endovenoso e monitorizar balanço hídrico","is_correct":true},{"id":"n2","text_pt":"Alta com prescrição ambulatorial","is_correct":false},{"id":"n3","text_pt":"Intubação orotraqueal imediata","is_correct":false},{"id":"n4","text_pt":"Pericardiocentese de urgência","is_correct":false}]'::jsonb,
  'A cardiomegalia associada a sinais de congestão pulmonar (cefalização de fluxo, linhas B de Kerley e derrame pleural bilateral) é o padrão radiológico clássico da ICC descompensada. O tratamento inicial visa redução da volemia com diuréticos endovenosos e monitorização rigorosa do balanço hídrico.',
  -1.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 4: Derrame pleural (X-RAY, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Derrame pleural volumoso',
  'Homem de 55 anos, ex-tabagista (30 maços-ano), emagrecimento de 8kg em 2 meses, dispneia e dor torácica pleurítica à esquerda há 3 semanas.',
  'xray',
  'Radiografia de tórax em PA com velamento homogêneo em hemitórax esquerdo, obliteração completa do seio costofrênico esquerdo e sinal do menisco (curva de Damoiseau) bem definido. Desvio contralateral do mediastino para a direita. Hemitórax direito sem alterações significativas.',
  NULL,
  'clinica_medica', 'pneumologia', 'facil',
  ARRAY['Velamento homogêneo em hemitórax esquerdo','Obliteração do seio costofrênico esquerdo','Sinal do menisco (curva de Damoiseau)'],
  'Derrame pleural volumoso à esquerda',
  'Toracocentese diagnóstica com análise bioquímica e citológica',
  '[{"id":"m1","text_pt":"Radiografia de Tórax PA","is_correct":true},{"id":"m2","text_pt":"TC de Abdome","is_correct":false},{"id":"m3","text_pt":"RM de Tórax","is_correct":false},{"id":"m4","text_pt":"PET-CT","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Velamento homogêneo em hemitórax esquerdo","is_correct":true},{"id":"f2","text_pt":"Obliteração do seio costofrênico esquerdo","is_correct":true},{"id":"f3","text_pt":"Sinal do menisco (curva de Damoiseau)","is_correct":true},{"id":"f4","text_pt":"Pneumotórax esquerdo","is_correct":false},{"id":"f5","text_pt":"Consolidação bilateral","is_correct":false},{"id":"f6","text_pt":"Massa mediastinal anterior","is_correct":false},{"id":"f7","text_pt":"Calcificação pleural","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Derrame pleural volumoso à esquerda","is_correct":true},{"id":"d2","text_pt":"Atelectasia total de pulmão esquerdo","is_correct":false},{"id":"d3","text_pt":"Pneumonia lobar esquerda","is_correct":false},{"id":"d4","text_pt":"Hemotórax traumático","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Toracocentese diagnóstica com análise bioquímica e citológica","is_correct":true},{"id":"n2","text_pt":"Drenagem torácica imediata","is_correct":false},{"id":"n3","text_pt":"Antibioticoterapia empírica","is_correct":false},{"id":"n4","text_pt":"Broncoscopia diagnóstica","is_correct":false}]'::jsonb,
  'O velamento com sinal do menisco de Damoiseau e desvio contralateral do mediastino configura derrame pleural volumoso. Em paciente ex-tabagista com emagrecimento significativo, a investigação etiológica com toracocentese diagnóstica é mandatória para excluir neoplasia.',
  -0.800
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 5: Fratura de costela (X-RAY, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Fratura de arcos costais',
  'Homem de 40 anos, queda de escada há 6 horas, dor intensa à inspiração profunda em hemitórax esquerdo. Equimose na parede torácica lateral esquerda.',
  'xray',
  'Radiografia de tórax em PA e perfil mostrando traço de fratura em 7º e 8º arcos costais esquerdos na linha axilar média. Sem sinais de pneumotórax ou hemotórax associados. Parênquima pulmonar sem consolidações ou atelectasias. Mediastino centrado.',
  NULL,
  'cirurgia', 'ortopedia', 'medio',
  ARRAY['Traço de fratura em 7º arco costal esquerdo','Traço de fratura em 8º arco costal esquerdo','Ausência de pneumotórax ou hemotórax associado'],
  'Fratura de arcos costais esquerdos (7º e 8º)',
  'Analgesia adequada e radiografia de controle em 7 dias',
  '[{"id":"m1","text_pt":"Radiografia de Tórax PA e perfil","is_correct":true},{"id":"m2","text_pt":"TC de Tórax","is_correct":false},{"id":"m3","text_pt":"USG de tórax","is_correct":false},{"id":"m4","text_pt":"Cintilografia óssea","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Traço de fratura em 7º arco costal esquerdo","is_correct":true},{"id":"f2","text_pt":"Traço de fratura em 8º arco costal esquerdo","is_correct":true},{"id":"f3","text_pt":"Ausência de pneumotórax ou hemotórax associado","is_correct":true},{"id":"f4","text_pt":"Derrame pleural esquerdo","is_correct":false},{"id":"f5","text_pt":"Consolidação pulmonar basal","is_correct":false},{"id":"f6","text_pt":"Fratura de clavícula esquerda","is_correct":false},{"id":"f7","text_pt":"Enfisema subcutâneo","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Fratura de arcos costais esquerdos (7º e 8º)","is_correct":true},{"id":"d2","text_pt":"Contusão pulmonar","is_correct":false},{"id":"d3","text_pt":"Tórax instável","is_correct":false},{"id":"d4","text_pt":"Fratura de escápula","is_correct":false},{"id":"d5","text_pt":"Ruptura diafragmática","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Analgesia adequada e radiografia de controle em 7 dias","is_correct":true},{"id":"n2","text_pt":"Drenagem torácica profilática","is_correct":false},{"id":"n3","text_pt":"Imobilização com enfaixamento torácico","is_correct":false},{"id":"n4","text_pt":"Cirurgia de fixação costal","is_correct":false}]'::jsonb,
  'Fraturas costais simples sem complicações associadas requerem analgesia multimodal adequada e controle radiológico. O enfaixamento torácico está contraindicado pelo risco de atelectasia e pneumonia. A fisioterapia respiratória é fundamental na prevenção de complicações.',
  0.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 6: IAM com supra de ST (EKG, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'IAM com supra de ST em parede inferior',
  'Homem de 62 anos, dor precordial em aperto irradiando para membro superior esquerdo há 2 horas, sudorese fria e náuseas. Antecedente de tabagismo e dislipidemia.',
  'ekg',
  'ECG de 12 derivações mostrando supradesnivelamento do segmento ST maior ou igual a 2mm em DII, DIII e aVF (parede inferior), com infradesnivelamento recíproco em DI e aVL. Ondas Q patológicas incipientes em DIII. Ritmo sinusal com FC de 80bpm.',
  E'DII:         ___\n       /\\  / ST\\\n      /  \\/     \\___\n_____/  P            \\______\n             QRS   T\n\nDIII:        ____\n       /\\  / ST \\\n      /  \\/      \\___\n_____/  P             \\______\n             QRS    T\n\naVF:         ___\n       /\\  / ST\\\n      /  \\/     \\___\n_____/  P            \\______\n             QRS   T\n\naVL (reciproco):\n       /\\\n_____/    \\_____\n     P  QRS  \\___/\n              ST-  T',
  'clinica_medica', 'cardiologia', 'medio',
  ARRAY['Supradesnivelamento de ST em DII, DIII e aVF','Infradesnivelamento recíproco em DI e aVL','Ondas Q patológicas incipientes em DIII'],
  'Infarto agudo do miocárdio com supra de ST em parede inferior',
  'Cateterismo cardíaco de emergência (angioplastia primária)',
  '[{"id":"m1","text_pt":"ECG de 12 derivações","is_correct":true},{"id":"m2","text_pt":"Radiografia de Tórax","is_correct":false},{"id":"m3","text_pt":"Ecocardiograma","is_correct":false},{"id":"m4","text_pt":"Teste ergométrico","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Supradesnivelamento de ST em DII, DIII e aVF","is_correct":true},{"id":"f2","text_pt":"Infradesnivelamento recíproco em DI e aVL","is_correct":true},{"id":"f3","text_pt":"Ondas Q patológicas incipientes em DIII","is_correct":true},{"id":"f4","text_pt":"Bloqueio de ramo esquerdo","is_correct":false},{"id":"f5","text_pt":"Fibrilação atrial","is_correct":false},{"id":"f6","text_pt":"Intervalo QT prolongado","is_correct":false},{"id":"f7","text_pt":"Onda delta (pré-excitação)","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Infarto agudo do miocárdio com supra de ST em parede inferior","is_correct":true},{"id":"d2","text_pt":"Angina instável","is_correct":false},{"id":"d3","text_pt":"Pericardite aguda","is_correct":false},{"id":"d4","text_pt":"Dissecção aórtica","is_correct":false},{"id":"d5","text_pt":"Embolia pulmonar","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Cateterismo cardíaco de emergência (angioplastia primária)","is_correct":true},{"id":"n2","text_pt":"Trombólise com alteplase","is_correct":false},{"id":"n3","text_pt":"Observação com troponina seriada","is_correct":false},{"id":"n4","text_pt":"Alta com AAS e encaminhamento ambulatorial","is_correct":false}]'::jsonb,
  'O supradesnivelamento de ST em derivações inferiores (DII, DIII, aVF) com alteração recíproca em parede lateral alta (DI, aVL) configura IAM de parede inferior, geralmente por oclusão da coronária direita. A angioplastia primária é o tratamento padrão quando disponível em tempo hábil.',
  0.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 7: Fibrilação atrial (EKG, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Fibrilação atrial',
  'Mulher de 72 anos, palpitações irregulares há 3 dias, tontura leve, sem síncope. Antecedente de hipertensão arterial e insuficiência cardíaca.',
  'ekg',
  'ECG com ausência de ondas P definidas, substituídas por oscilações irregulares da linha de base (ondas f fibrilatórias). Intervalos RR completamente irregulares. Complexos QRS estreitos e de morfologia normal. Frequência cardíaca média de 110bpm.',
  E'Linha de base fibrilatória (sem ondas P):\n\n~~~~~|~~~ ~~~~|~~ ~~~|~~~~ ~~|~~~~~~ ~~~|~~\n     QRS      QRS    QRS    QRS       QRS\n     <-->     <->    <--->  <-->      <---->\n     (intervalos RR irregulares)\n\nAusencia de ondas P identificaveis\nFC media ~110bpm',
  'clinica_medica', 'cardiologia', 'facil',
  ARRAY['Ausência de ondas P','Intervalos RR irregulares','Ondas f (fibrilatórias) na linha de base'],
  'Fibrilação atrial com resposta ventricular alta',
  'Controle de frequência com betabloqueador e avaliar anticoagulação (CHA2DS2-VASc)',
  '[{"id":"m1","text_pt":"ECG de 12 derivações","is_correct":true},{"id":"m2","text_pt":"Holter 24h","is_correct":false},{"id":"m3","text_pt":"Ecocardiograma transesofágico","is_correct":false},{"id":"m4","text_pt":"Monitor de eventos","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Ausência de ondas P","is_correct":true},{"id":"f2","text_pt":"Intervalos RR irregulares","is_correct":true},{"id":"f3","text_pt":"Ondas f (fibrilatórias) na linha de base","is_correct":true},{"id":"f4","text_pt":"Ondas P normais sinusais","is_correct":false},{"id":"f5","text_pt":"Flutter atrial com ondas F em dente de serra","is_correct":false},{"id":"f6","text_pt":"Bloqueio AV de 1º grau","is_correct":false},{"id":"f7","text_pt":"Extrassístoles ventriculares frequentes","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Fibrilação atrial com resposta ventricular alta","is_correct":true},{"id":"d2","text_pt":"Flutter atrial","is_correct":false},{"id":"d3","text_pt":"Taquicardia supraventricular paroxística","is_correct":false},{"id":"d4","text_pt":"Taquicardia sinusal","is_correct":false},{"id":"d5","text_pt":"Síndrome de Wolff-Parkinson-White","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Controle de frequência com betabloqueador e avaliar anticoagulação (CHA2DS2-VASc)","is_correct":true},{"id":"n2","text_pt":"Cardioversão elétrica imediata","is_correct":false},{"id":"n3","text_pt":"Ablação por cateter de urgência","is_correct":false},{"id":"n4","text_pt":"Implante de marca-passo","is_correct":false}]'::jsonb,
  'A ausência de ondas P com irregularidade dos intervalos RR e presença de ondas f fibrilatórias configura fibrilação atrial. Em paciente idosa com hipertensão e IC, o escore CHA2DS2-VASc provavelmente indica necessidade de anticoagulação oral para prevenção de AVC cardioembólico.',
  -0.800
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 8: Bloqueio AV 2o grau Mobitz II (EKG, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Bloqueio AV 2º grau Mobitz II',
  'Homem de 75 anos, tontura e pré-síncope intermitente há 1 semana. FC de 42bpm no pronto-socorro. Antecedente de doença coronariana crônica.',
  'ekg',
  'ECG com intervalo PR constante nos batimentos conduzidos, porém com ondas P periodicamente não seguidas de complexo QRS (relação de condução 3:1 e 2:1 intermitente). QRS alargado com duração de 0.14s. Frequência ventricular de aproximadamente 42bpm. Frequência atrial regular de 84bpm.',
  E'Conducao 2:1 e 3:1 (PR constante, QRS dropped):\n\n  P     P     P     P     P     P     P\n  |           |           |     |     |\n  QRS         QRS         QRS   .     .\n  <--- PR --->            <PR>  (bloq) (bloq)\n\n  PR constante = 0.18s nos batimentos conduzidos\n  QRS = 0.14s (alargado)\n  FC ventricular ~42bpm / FC atrial ~84bpm',
  'clinica_medica', 'cardiologia', 'dificil',
  ARRAY['Ondas P sem complexo QRS subsequente (bloqueio intermitente)','Intervalo PR constante nos batimentos conduzidos','QRS alargado (> 0.12s)'],
  'Bloqueio atrioventricular de 2º grau tipo Mobitz II',
  'Internação e implante de marca-passo definitivo',
  '[{"id":"m1","text_pt":"ECG de 12 derivações","is_correct":true},{"id":"m2","text_pt":"Holter 24h","is_correct":false},{"id":"m3","text_pt":"Estudo eletrofisiológico","is_correct":false},{"id":"m4","text_pt":"Teste de inclinação (tilt test)","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Ondas P sem complexo QRS subsequente (bloqueio intermitente)","is_correct":true},{"id":"f2","text_pt":"Intervalo PR constante nos batimentos conduzidos","is_correct":true},{"id":"f3","text_pt":"QRS alargado (> 0.12s)","is_correct":true},{"id":"f4","text_pt":"Prolongamento progressivo do PR (Wenckebach)","is_correct":false},{"id":"f5","text_pt":"Dissociação AV completa","is_correct":false},{"id":"f6","text_pt":"Bloqueio de ramo direito isolado","is_correct":false},{"id":"f7","text_pt":"Ritmo juncional acelerado","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Bloqueio atrioventricular de 2º grau tipo Mobitz II","is_correct":true},{"id":"d2","text_pt":"BAV 1º grau","is_correct":false},{"id":"d3","text_pt":"BAV 2º grau Mobitz I (Wenckebach)","is_correct":false},{"id":"d4","text_pt":"BAV 3º grau (total)","is_correct":false},{"id":"d5","text_pt":"Síndrome do nó sinusal","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Internação e implante de marca-passo definitivo","is_correct":true},{"id":"n2","text_pt":"Atropina endovenosa e observação","is_correct":false},{"id":"n3","text_pt":"Ablação do nó AV","is_correct":false},{"id":"n4","text_pt":"Alta com Holter ambulatorial","is_correct":false}]'::jsonb,
  'O BAV de 2º grau tipo Mobitz II se caracteriza por PR constante nos batimentos conduzidos com falha súbita de condução AV. O QRS alargado indica bloqueio infra-Hisiano, com risco elevado de progressão para BAVT. O implante de marca-passo definitivo é indicação classe I nesta situação.',
  1.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 9: Taquicardia ventricular (EKG, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Taquicardia ventricular monomórfica',
  'Homem de 58 anos, pós-IAM há 2 meses, apresenta palpitações rápidas e tontura intensa. PA 90/60mmHg. Sudorese fria e palidez.',
  'ekg',
  'ECG com taquicardia regular de QRS alargado com duração superior a 0.14s, FC de 180bpm. Concordância positiva de QRS em derivações precordiais. Dissociação atrioventricular com ondas P dissociadas visíveis ocasionalmente. Batimentos de captura e fusão identificados.',
  E'Taquicardia de QRS largo (TV monomorfica):\n\n  /--\\  /--\\  /--\\  /--\\  /--\\  /--\\  /--\\\n /    \\/    \\/    \\/    \\/    \\/    \\/    \\\n/      \\    /\\    /\\    /\\    /\\    /\\    /\n        \\--/  \\--/  \\--/  \\--/  \\--/  \\--/\n\n   P          P              P\n   (dissociacao AV - ondas P independentes)\n\n  QRS > 0.14s | FC = 180bpm | Regular',
  'clinica_medica', 'cardiologia', 'dificil',
  ARRAY['QRS alargado (> 0.14s) com FC 180bpm','Concordância de QRS em derivações precordiais','Dissociação atrioventricular'],
  'Taquicardia ventricular monomórfica sustentada',
  'Cardioversão elétrica sincronizada (paciente instável)',
  '[{"id":"m1","text_pt":"ECG de 12 derivações","is_correct":true},{"id":"m2","text_pt":"Monitor cardíaco contínuo","is_correct":false},{"id":"m3","text_pt":"Ecocardiograma de urgência","is_correct":false},{"id":"m4","text_pt":"Cateterismo cardíaco","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"QRS alargado (> 0.14s) com FC 180bpm","is_correct":true},{"id":"f2","text_pt":"Concordância de QRS em derivações precordiais","is_correct":true},{"id":"f3","text_pt":"Dissociação atrioventricular","is_correct":true},{"id":"f4","text_pt":"QRS estreito (< 0.12s)","is_correct":false},{"id":"f5","text_pt":"Ondas delta de pré-excitação","is_correct":false},{"id":"f6","text_pt":"Bloqueio de ramo frequência-dependente","is_correct":false},{"id":"f7","text_pt":"Alternância elétrica","is_correct":false},{"id":"f8","text_pt":"Padrão de Torsades de pointes","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Taquicardia ventricular monomórfica sustentada","is_correct":true},{"id":"d2","text_pt":"Taquicardia supraventricular com aberrância","is_correct":false},{"id":"d3","text_pt":"Fibrilação atrial pré-excitada","is_correct":false},{"id":"d4","text_pt":"Torsades de pointes","is_correct":false},{"id":"d5","text_pt":"Taquicardia sinusal","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Cardioversão elétrica sincronizada (paciente instável)","is_correct":true},{"id":"n2","text_pt":"Adenosina endovenosa","is_correct":false},{"id":"n3","text_pt":"Amiodarona endovenosa","is_correct":false},{"id":"n4","text_pt":"Massagem do seio carotídeo","is_correct":false}]'::jsonb,
  'O QRS alargado regular com dissociação AV e concordância precordial são critérios de Brugada para taquicardia ventricular. Em paciente pós-IAM com instabilidade hemodinâmica (hipotensão), a cardioversão elétrica sincronizada é a conduta prioritária e imediata.',
  1.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 10: Flutter atrial (EKG, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Flutter atrial típico',
  'Homem de 65 anos, portador de DPOC, apresenta palpitações regulares e dispneia há 24 horas. FC de 150bpm regular. Sem instabilidade hemodinâmica.',
  'ekg',
  'ECG com ondas F em padrão de dente de serra (sawtooth pattern) visíveis em DII, DIII, aVF e V1, com frequência atrial de 300bpm. Condução AV 2:1 resultando em frequência ventricular de aproximadamente 150bpm. Complexos QRS estreitos com morfologia preservada.',
  E'Ondas F em dente de serra com conducao 2:1:\n\n/\\/\\/\\/\\  |  /\\/\\/\\/\\  |  /\\/\\/\\/\\  |\n F F F F QRS  F F F F QRS  F F F F QRS\n (300/min)     (300/min)     (300/min)\n\n     Conducao 2:1 => FC ventricular ~150bpm\n     QRS estreito, regular\n\nDII/DIII/aVF: ondas F negativas (dente de serra)\nV1: ondas F positivas',
  'clinica_medica', 'cardiologia', 'medio',
  ARRAY['Ondas F em dente de serra em derivações inferiores','Condução AV 2:1 (FC ~150bpm)','Complexos QRS estreitos'],
  'Flutter atrial típico com condução 2:1',
  'Controle de frequência cardíaca e avaliação para ablação por cateter',
  '[{"id":"m1","text_pt":"ECG de 12 derivações","is_correct":true},{"id":"m2","text_pt":"Holter 24h","is_correct":false},{"id":"m3","text_pt":"Ecocardiograma","is_correct":false},{"id":"m4","text_pt":"Teste ergométrico","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Ondas F em dente de serra em derivações inferiores","is_correct":true},{"id":"f2","text_pt":"Condução AV 2:1 (FC ~150bpm)","is_correct":true},{"id":"f3","text_pt":"Complexos QRS estreitos","is_correct":true},{"id":"f4","text_pt":"Fibrilação atrial com ondas f","is_correct":false},{"id":"f5","text_pt":"Taquicardia sinusal com ondas P normais","is_correct":false},{"id":"f6","text_pt":"Taquicardia atrial multifocal","is_correct":false},{"id":"f7","text_pt":"Bloqueio AV 2:1","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Flutter atrial típico com condução 2:1","is_correct":true},{"id":"d2","text_pt":"Fibrilação atrial","is_correct":false},{"id":"d3","text_pt":"Taquicardia supraventricular","is_correct":false},{"id":"d4","text_pt":"Taquicardia sinusal","is_correct":false},{"id":"d5","text_pt":"Taquicardia atrial","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Controle de frequência cardíaca e avaliação para ablação por cateter","is_correct":true},{"id":"n2","text_pt":"Cardioversão elétrica imediata","is_correct":false},{"id":"n3","text_pt":"Adenosina endovenosa em bolus","is_correct":false},{"id":"n4","text_pt":"Desfibrilação","is_correct":false}]'::jsonb,
  'As ondas F em dente de serra com condução 2:1 resultando em FC de aproximadamente 150bpm é o padrão clássico do flutter atrial típico. A ablação do istmo cavo-tricuspídeo tem taxa de sucesso superior a 95% e é o tratamento definitivo de escolha.',
  0.300
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 11: AVC isquêmico (CT, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'AVC isquêmico agudo',
  'Mulher de 70 anos, hipertensa, apresenta hemiparesia esquerda súbita e disartria há 3 horas. Glasgow 14 (O4V4M6). Glicemia capilar 110mg/dL.',
  'ct',
  'TC de crânio sem contraste mostrando área hipodensa em território de artéria cerebral média direita, envolvendo núcleo lentiforme e ínsula direita. Apagamento de sulcos corticais no hemisfério direito. Perda da diferenciação entre substância cinzenta e branca na região insular. Sem sinais de hemorragia intracraniana.',
  NULL,
  'clinica_medica', 'neurologia', 'medio',
  ARRAY['Hipodensidade em território de ACM direita','Apagamento de sulcos corticais à direita','Perda da diferenciação substância cinzenta-branca na ínsula'],
  'AVC isquêmico agudo em território de ACM direita',
  'Trombólise endovenosa com alteplase (janela < 4.5h)',
  '[{"id":"m1","text_pt":"TC de crânio sem contraste","is_correct":true},{"id":"m2","text_pt":"RM de crânio","is_correct":false},{"id":"m3","text_pt":"Angiografia cerebral","is_correct":false},{"id":"m4","text_pt":"Doppler transcraniano","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Hipodensidade em território de ACM direita","is_correct":true},{"id":"f2","text_pt":"Apagamento de sulcos corticais à direita","is_correct":true},{"id":"f3","text_pt":"Perda da diferenciação substância cinzenta-branca na ínsula","is_correct":true},{"id":"f4","text_pt":"Hiperdensidade em cisternas basais","is_correct":false},{"id":"f5","text_pt":"Desvio de linha média > 5mm","is_correct":false},{"id":"f6","text_pt":"Hidrocefalia obstrutiva","is_correct":false},{"id":"f7","text_pt":"Calcificação de plexo coroide","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"AVC isquêmico agudo em território de ACM direita","is_correct":true},{"id":"d2","text_pt":"AVC hemorrágico","is_correct":false},{"id":"d3","text_pt":"Tumor cerebral","is_correct":false},{"id":"d4","text_pt":"Abscesso cerebral","is_correct":false},{"id":"d5","text_pt":"Encefalopatia hipertensiva","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Trombólise endovenosa com alteplase (janela < 4.5h)","is_correct":true},{"id":"n2","text_pt":"Craniectomia descompressiva","is_correct":false},{"id":"n3","text_pt":"Anti-hipertensivo endovenoso agressivo","is_correct":false},{"id":"n4","text_pt":"Observação clínica com TC de controle em 24h","is_correct":false}]'::jsonb,
  'A hipodensidade precoce em território da ACM com apagamento de sulcos e perda da diferenciação cinzenta-branca na ínsula (sinal da ínsula) são sinais tomográficos precoces de AVC isquêmico. Dentro da janela terapêutica de 4.5h, a trombólise endovenosa com alteplase está indicada.',
  0.300
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 12: TEP (CT, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Tromboembolismo pulmonar agudo',
  'Mulher de 45 anos, pós-operatório de artroplastia de quadril, apresenta dispneia súbita, dor torácica pleurítica e taquicardia (FC 120bpm). D-dímero elevado.',
  'ct',
  'Angiotomografia de tórax mostrando falhas de enchimento (hipodensidade intraluminal) em artérias pulmonares lobares e segmentares bilaterais, mais evidentes à direita. Aumento do diâmetro do ventrículo direito com relação VD/VE > 1. Retificação do septo interventricular sugerindo sobrecarga pressórica de câmaras direitas.',
  NULL,
  'clinica_medica', 'pneumologia', 'dificil',
  ARRAY['Falhas de enchimento em artérias pulmonares bilaterais','Aumento do ventrículo direito (VD/VE > 1)','Retificação do septo interventricular'],
  'Tromboembolismo pulmonar agudo bilateral',
  'Anticoagulação plena com heparina e avaliar necessidade de trombólise',
  '[{"id":"m1","text_pt":"Angiotomografia de tórax","is_correct":true},{"id":"m2","text_pt":"Cintilografia V/Q","is_correct":false},{"id":"m3","text_pt":"Ecocardiograma","is_correct":false},{"id":"m4","text_pt":"Radiografia de tórax","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Falhas de enchimento em artérias pulmonares bilaterais","is_correct":true},{"id":"f2","text_pt":"Aumento do ventrículo direito (VD/VE > 1)","is_correct":true},{"id":"f3","text_pt":"Retificação do septo interventricular","is_correct":true},{"id":"f4","text_pt":"Consolidação pulmonar bilateral","is_correct":false},{"id":"f5","text_pt":"Derrame pericárdico volumoso","is_correct":false},{"id":"f6","text_pt":"Dissecção de aorta","is_correct":false},{"id":"f7","text_pt":"Linfonodomegalia mediastinal","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Tromboembolismo pulmonar agudo bilateral","is_correct":true},{"id":"d2","text_pt":"Pneumonia bilateral","is_correct":false},{"id":"d3","text_pt":"Dissecção aórtica aguda","is_correct":false},{"id":"d4","text_pt":"Edema pulmonar cardiogênico","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Anticoagulação plena com heparina e avaliar necessidade de trombólise","is_correct":true},{"id":"n2","text_pt":"Cirurgia de embolectomia imediata","is_correct":false},{"id":"n3","text_pt":"Antibioticoterapia de amplo espectro","is_correct":false},{"id":"n4","text_pt":"Diurético e ventilação não invasiva","is_correct":false}]'::jsonb,
  'As falhas de enchimento em artérias pulmonares na angiotomografia são diagnósticas de TEP. Os sinais de sobrecarga de ventrículo direito (dilatação VD e retificação septal) indicam repercussão hemodinâmica significativa. A anticoagulação plena deve ser iniciada imediatamente.',
  1.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 13: Apendicite aguda (CT, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Apendicite aguda',
  'Jovem de 25 anos, dor abdominal que iniciou periumbilical e migrou para fossa ilíaca direita há 18 horas. Febre de 38.2°C, anorexia e náuseas. Sinal de Blumberg positivo.',
  'ct',
  'TC de abdome com contraste mostrando apêndice cecal dilatado com 12mm de diâmetro, espessamento parietal com realce pelo contraste endovenoso. Borramento da gordura periapendicular (fat stranding) e pequena quantidade de líquido livre periapendicular. Sem evidência de perfuração ou coleção organizada.',
  NULL,
  'cirurgia', 'cirurgia_geral', 'facil',
  ARRAY['Apêndice cecal dilatado (> 6mm)','Espessamento parietal com realce ao contraste','Borramento da gordura periapendicular'],
  'Apendicite aguda não complicada',
  'Apendicectomia videolaparoscópica',
  '[{"id":"m1","text_pt":"TC de abdome com contraste","is_correct":true},{"id":"m2","text_pt":"USG de abdome","is_correct":false},{"id":"m3","text_pt":"RM de abdome","is_correct":false},{"id":"m4","text_pt":"Radiografia de abdome","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Apêndice cecal dilatado (> 6mm)","is_correct":true},{"id":"f2","text_pt":"Espessamento parietal com realce ao contraste","is_correct":true},{"id":"f3","text_pt":"Borramento da gordura periapendicular","is_correct":true},{"id":"f4","text_pt":"Apendicolito calcificado","is_correct":false},{"id":"f5","text_pt":"Coleção periapendicular organizada","is_correct":false},{"id":"f6","text_pt":"Pneumoperitônio","is_correct":false},{"id":"f7","text_pt":"Distensão de alças de delgado","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Apendicite aguda não complicada","is_correct":true},{"id":"d2","text_pt":"Diverticulite de Meckel","is_correct":false},{"id":"d3","text_pt":"Linfadenite mesentérica","is_correct":false},{"id":"d4","text_pt":"Ileíte terminal (Doença de Crohn)","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Apendicectomia videolaparoscópica","is_correct":true},{"id":"n2","text_pt":"Antibioticoterapia isolada","is_correct":false},{"id":"n3","text_pt":"Drenagem percutânea","is_correct":false},{"id":"n4","text_pt":"Observação com TC de controle","is_correct":false}]'::jsonb,
  'O apêndice dilatado (> 6mm) com espessamento parietal e borramento da gordura periapendicular são os achados tomográficos clássicos de apendicite aguda. Associado ao quadro clínico típico de dor migratória e peritonismo localizado, a apendicectomia videolaparoscópica é o padrão-ouro de tratamento.',
  -0.800
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 14: Hemorragia subaracnoide (CT, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Hemorragia subaracnoide aguda',
  'Homem de 50 anos, cefaleia súbita de forte intensidade descrita como "a pior dor de cabeça da vida", rigidez de nuca e vômitos. Sem trauma. PA 180/100mmHg.',
  'ct',
  'TC de crânio sem contraste mostrando hiperdensidade (sangue) preenchendo cisternas basais, fissura silviana bilateral e fissura inter-hemisférica anterior. Discreta hidrocefalia aguda com dilatação dos ventrículos laterais. Sem hematoma intraparenquimatoso associado. Parênquima cerebral sem lesões focais.',
  NULL,
  'clinica_medica', 'neurologia', 'dificil',
  ARRAY['Hiperdensidade em cisternas basais','Sangue na fissura silviana bilateral','Hidrocefalia aguda incipiente'],
  'Hemorragia subaracnoide aguda (provável ruptura de aneurisma)',
  'Angiotomografia cerebral para localizar aneurisma e referenciamento neurocirúrgico',
  '[{"id":"m1","text_pt":"TC de crânio sem contraste","is_correct":true},{"id":"m2","text_pt":"RM de crânio","is_correct":false},{"id":"m3","text_pt":"Punção lombar","is_correct":false},{"id":"m4","text_pt":"Doppler transcraniano","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Hiperdensidade em cisternas basais","is_correct":true},{"id":"f2","text_pt":"Sangue na fissura silviana bilateral","is_correct":true},{"id":"f3","text_pt":"Hidrocefalia aguda incipiente","is_correct":true},{"id":"f4","text_pt":"Hipodensidade em território de ACM","is_correct":false},{"id":"f5","text_pt":"Hematoma intraparenquimatoso","is_correct":false},{"id":"f6","text_pt":"Calcificação meníngea","is_correct":false},{"id":"f7","text_pt":"Edema cerebral difuso","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Hemorragia subaracnoide aguda por provável ruptura de aneurisma","is_correct":true},{"id":"d2","text_pt":"AVC hemorrágico hipertensivo","is_correct":false},{"id":"d3","text_pt":"Meningite bacteriana","is_correct":false},{"id":"d4","text_pt":"Trombose venosa cerebral","is_correct":false},{"id":"d5","text_pt":"Tumor com sangramento","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Angiotomografia cerebral para localizar aneurisma e referenciamento neurocirúrgico","is_correct":true},{"id":"n2","text_pt":"Punção lombar diagnóstica","is_correct":false},{"id":"n3","text_pt":"Anti-hipertensivo agressivo apenas","is_correct":false},{"id":"n4","text_pt":"Observação com TC de controle em 24h","is_correct":false}]'::jsonb,
  'A hiperdensidade em cisternas basais na TC sem contraste associada a cefaleia súbita (thunderclap headache) é o quadro clássico de hemorragia subaracnoide. A TC tem sensibilidade de 98% nas primeiras 6h. A angiotomografia identifica aneurisma em 95% dos casos e é essencial para planejamento do tratamento neurocirúrgico ou endovascular urgente.',
  1.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 15: Colecistite aguda (ULTRASOUND, facil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Colecistite aguda calculosa',
  'Mulher de 50 anos, obesa, dor intensa em hipocôndrio direito pós-prandial há 12 horas. Febre de 38.5°C. Sinal de Murphy positivo ao exame físico. Leucocitose de 14.000.',
  'ultrasound',
  'Ultrassonografia de abdome superior mostrando vesícula biliar distendida com parede espessada medindo 5mm (normal até 3mm). Cálculo hiperecogênico impactado no infundíbulo vesicular com sombra acústica posterior. Líquido perivesicular discreto. Sinal de Murphy ultrassonográfico positivo. Vias biliares intra e extra-hepáticas de calibre normal.',
  NULL,
  'cirurgia', 'cirurgia_geral', 'facil',
  ARRAY['Cálculo impactado no infundíbulo vesicular','Parede vesicular espessada (> 3mm)','Sinal de Murphy ultrassonográfico positivo','Líquido perivesicular'],
  'Colecistite aguda calculosa',
  'Colecistectomia videolaparoscópica precoce (< 72h)',
  '[{"id":"m1","text_pt":"USG de abdome","is_correct":true},{"id":"m2","text_pt":"TC de abdome","is_correct":false},{"id":"m3","text_pt":"ColangioRM","is_correct":false},{"id":"m4","text_pt":"Cintilografia hepatobiliar (HIDA)","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Cálculo impactado no infundíbulo vesicular","is_correct":true},{"id":"f2","text_pt":"Parede vesicular espessada (> 3mm)","is_correct":true},{"id":"f3","text_pt":"Sinal de Murphy ultrassonográfico positivo","is_correct":true},{"id":"f4","text_pt":"Líquido perivesicular","is_correct":true},{"id":"f5","text_pt":"Dilatação de vias biliares intra-hepáticas","is_correct":false},{"id":"f6","text_pt":"Massa hepática heterogênea","is_correct":false},{"id":"f7","text_pt":"Ascite volumosa","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Colecistite aguda calculosa","is_correct":true},{"id":"d2","text_pt":"Coledocolitíase","is_correct":false},{"id":"d3","text_pt":"Colangite aguda","is_correct":false},{"id":"d4","text_pt":"Hepatite aguda","is_correct":false},{"id":"d5","text_pt":"Pancreatite biliar","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Colecistectomia videolaparoscópica precoce (< 72h)","is_correct":true},{"id":"n2","text_pt":"Antibioticoterapia isolada e observação","is_correct":false},{"id":"n3","text_pt":"CPRE de urgência","is_correct":false},{"id":"n4","text_pt":"Colecistostomia percutânea","is_correct":false}]'::jsonb,
  'A tétrade ultrassonográfica de colecistite aguda inclui: cálculo impactado, parede espessada (> 3mm), Murphy ultrassonográfico positivo e líquido perivesicular. A colecistectomia videolaparoscópica precoce (nas primeiras 72h) reduz tempo de internação e taxa de complicações.',
  -0.800
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 16: Gestação ectópica (ULTRASOUND, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Gestação ectópica tubária',
  'Mulher de 32 anos, atraso menstrual de 7 semanas, dor em fossa ilíaca esquerda progressiva e sangramento vaginal escasso. Beta-hCG quantitativo de 3.500 mUI/mL. Hemodinamicamente estável.',
  'ultrasound',
  'Ultrassonografia transvaginal mostrando útero com endométrio espessado (reação decidual) porém sem saco gestacional intrauterino identificável. Massa anexial complexa à esquerda medindo 3cm com aspecto de anel tubário (ring sign). Líquido livre em fundo de saco de Douglas em quantidade moderada. Ovários de aspecto normal bilateralmente.',
  NULL,
  'ginecologia_obstetricia', 'obstetricia', 'dificil',
  ARRAY['Ausência de saco gestacional intrauterino','Massa anexial complexa à esquerda (anel tubário)','Líquido livre em fundo de saco de Douglas'],
  'Gestação ectópica tubária à esquerda',
  'Laparoscopia com salpingectomia esquerda',
  '[{"id":"m1","text_pt":"USG transvaginal","is_correct":true},{"id":"m2","text_pt":"USG abdominal","is_correct":false},{"id":"m3","text_pt":"TC de pelve","is_correct":false},{"id":"m4","text_pt":"RM de pelve","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Ausência de saco gestacional intrauterino","is_correct":true},{"id":"f2","text_pt":"Massa anexial complexa à esquerda (anel tubário)","is_correct":true},{"id":"f3","text_pt":"Líquido livre em fundo de saco de Douglas","is_correct":true},{"id":"f4","text_pt":"Saco gestacional tópico com BCF presente","is_correct":false},{"id":"f5","text_pt":"Cisto de corpo lúteo simples","is_correct":false},{"id":"f6","text_pt":"Mioma uterino submucoso","is_correct":false},{"id":"f7","text_pt":"Endometrioma ovariano","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Gestação ectópica tubária à esquerda","is_correct":true},{"id":"d2","text_pt":"Aborto incompleto","is_correct":false},{"id":"d3","text_pt":"Cisto ovariano roto","is_correct":false},{"id":"d4","text_pt":"Doença inflamatória pélvica","is_correct":false},{"id":"d5","text_pt":"Gravidez tópica inicial","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Laparoscopia com salpingectomia esquerda","is_correct":true},{"id":"n2","text_pt":"Metotrexato intramuscular","is_correct":false},{"id":"n3","text_pt":"Conduta expectante com beta-hCG seriado","is_correct":false},{"id":"n4","text_pt":"Curetagem uterina","is_correct":false}]'::jsonb,
  'Beta-hCG acima do nível discriminatório (1.500-3.500 mUI/mL) sem saco gestacional intrauterino visível à USG transvaginal, associado a massa anexial e líquido livre em fundo de saco, configura gestação ectópica. A presença de líquido livre sugere sangramento ativo e indica abordagem cirúrgica laparoscópica.',
  1.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 17: Hidronefrose (ULTRASOUND, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Urolitíase com hidronefrose',
  'Homem de 45 anos, cólica lombar esquerda de forte intensidade com irradiação para região inguinal há 6 horas. Hematúria microscópica no EAS. Sem febre.',
  'ultrasound',
  'Ultrassonografia de rins e vias urinárias mostrando rim esquerdo com dilatação pielocalicial moderada (grau II-III), com pelve renal e cálices renais dilatados e parênquima preservado. Cálculo hiperecogênico de 8mm na junção ureterovesical esquerda com sombra acústica posterior. Jato ureteral esquerdo ausente ao Doppler. Rim direito sem alterações.',
  NULL,
  'clinica_medica', 'urologia', 'medio',
  ARRAY['Dilatação pielocalicial moderada à esquerda','Cálculo na junção ureterovesical esquerda','Rim direito sem alterações'],
  'Urolitíase obstrutiva com hidronefrose grau II-III à esquerda',
  'Analgesia, alfa-bloqueador e avaliar necessidade de litotripsia ou ureteroscopia',
  '[{"id":"m1","text_pt":"USG de rins e vias urinárias","is_correct":true},{"id":"m2","text_pt":"TC de abdome sem contraste","is_correct":false},{"id":"m3","text_pt":"Urografia excretora","is_correct":false},{"id":"m4","text_pt":"RM de abdome","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Dilatação pielocalicial moderada à esquerda","is_correct":true},{"id":"f2","text_pt":"Cálculo na junção ureterovesical esquerda","is_correct":true},{"id":"f3","text_pt":"Rim direito sem alterações","is_correct":true},{"id":"f4","text_pt":"Massa renal sólida esquerda","is_correct":false},{"id":"f5","text_pt":"Rim esquerdo atrófico","is_correct":false},{"id":"f6","text_pt":"Dilatação bilateral simétrica","is_correct":false},{"id":"f7","text_pt":"Cisto renal complexo Bosniak III","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Urolitíase obstrutiva com hidronefrose grau II-III à esquerda","is_correct":true},{"id":"d2","text_pt":"Pielonefrite aguda","is_correct":false},{"id":"d3","text_pt":"Tumor renal","is_correct":false},{"id":"d4","text_pt":"Estenose de JUP congênita","is_correct":false},{"id":"d5","text_pt":"Refluxo vesicoureteral","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Analgesia, alfa-bloqueador e avaliar necessidade de litotripsia ou ureteroscopia","is_correct":true},{"id":"n2","text_pt":"Nefrectomia esquerda","is_correct":false},{"id":"n3","text_pt":"Nefrostomia percutânea de emergência","is_correct":false},{"id":"n4","text_pt":"Antibioticoterapia empírica","is_correct":false}]'::jsonb,
  'A cólica renal com hidronefrose e cálculo na junção ureterovesical é o quadro clássico de urolitíase obstrutiva. Cálculos de até 10mm na porção distal do ureter têm chance razoável de eliminação espontânea com terapia expulsiva (analgesia e alfa-bloqueador). A litotripsia ou ureteroscopia ficam reservadas para casos refratários.',
  0.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 18: Hérnia discal lombar (MRI, medio)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Hérnia discal lombar L4-L5',
  'Homem de 38 anos, lombalgia com irradiação para membro inferior esquerdo (ciática) há 4 semanas, piora ao sentar e ao manobra de Valsalva. Sinal de Lasègue positivo a 30 graus à esquerda. Força muscular preservada.',
  'mri',
  'RM de coluna lombossacra em sequências T1 e T2 mostrando protrusão discal posterolateral esquerda em L4-L5, com compressão da raiz nervosa L5 esquerda no recesso lateral. O disco L4-L5 apresenta hipossinal em T2 (sinais de desidratação/degeneração discal). Canal vertebral sem estenose central significativa. Demais níveis sem alterações relevantes.',
  NULL,
  'cirurgia', 'ortopedia', 'medio',
  ARRAY['Protrusão discal posterolateral esquerda em L4-L5','Compressão da raiz nervosa L5 esquerda','Disco L4-L5 com sinais de desidratação'],
  'Hérnia discal lombar L4-L5 com radiculopatia L5 esquerda',
  'Tratamento conservador inicial (fisioterapia, analgesia) com reavaliação em 6 semanas',
  '[{"id":"m1","text_pt":"RM de coluna lombar","is_correct":true},{"id":"m2","text_pt":"TC de coluna lombar","is_correct":false},{"id":"m3","text_pt":"Radiografia de coluna lombar","is_correct":false},{"id":"m4","text_pt":"Eletroneuromiografia","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Protrusão discal posterolateral esquerda em L4-L5","is_correct":true},{"id":"f2","text_pt":"Compressão da raiz nervosa L5 esquerda","is_correct":true},{"id":"f3","text_pt":"Disco L4-L5 com sinais de desidratação","is_correct":true},{"id":"f4","text_pt":"Estenose de canal central","is_correct":false},{"id":"f5","text_pt":"Espondilolistese L4-L5","is_correct":false},{"id":"f6","text_pt":"Fratura vertebral por compressão","is_correct":false},{"id":"f7","text_pt":"Tumor intradural","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Hérnia discal lombar L4-L5 com radiculopatia L5 esquerda","is_correct":true},{"id":"d2","text_pt":"Estenose lombar degenerativa","is_correct":false},{"id":"d3","text_pt":"Espondilolistese ístmica","is_correct":false},{"id":"d4","text_pt":"Síndrome da cauda equina","is_correct":false},{"id":"d5","text_pt":"Tumor vertebral metastático","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Tratamento conservador inicial (fisioterapia, analgesia) com reavaliação em 6 semanas","is_correct":true},{"id":"n2","text_pt":"Discectomia cirúrgica imediata","is_correct":false},{"id":"n3","text_pt":"Infiltração epidural","is_correct":false},{"id":"n4","text_pt":"Imobilização com colete lombar rígido","is_correct":false}]'::jsonb,
  'A protrusão discal com compressão radicular e clínica concordante (ciática com Lasègue positivo) confirma o diagnóstico de hérnia discal com radiculopatia. O tratamento conservador com fisioterapia e analgesia é a primeira linha na ausência de déficit motor grave, síndrome da cauda equina ou dor refratária.',
  0.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 19: Tumor cerebral (MRI, dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Tumor cerebral de alto grau',
  'Mulher de 55 anos, cefaleia progressiva há 2 meses que não cede com analgésicos comuns, crise convulsiva tônico-clônica de início recente e hemiparesia direita leve. Fundo de olho com papiledema bilateral.',
  'mri',
  'RM de crânio mostrando lesão expansiva heterogênea em lobo frontal esquerdo medindo 5x4cm, com realce anelar irregular após administração de gadolínio e necrose central. Extenso edema vasogênico perilesional com hipersinal em T2/FLAIR. Efeito de massa com desvio de linha média de 8mm para direita. Compressão do ventrículo lateral esquerdo. Sem outras lesões intracranianas.',
  NULL,
  'clinica_medica', 'neurologia', 'dificil',
  ARRAY['Lesão expansiva com realce anelar em lobo frontal esquerdo','Necrose central e edema perilesional extenso','Desvio de linha média de 8mm para direita'],
  'Tumor cerebral primário de alto grau (glioblastoma provável)',
  'Corticoterapia para edema e encaminhamento para biópsia/ressecção neurocirúrgica',
  '[{"id":"m1","text_pt":"RM de crânio com gadolínio","is_correct":true},{"id":"m2","text_pt":"TC de crânio com contraste","is_correct":false},{"id":"m3","text_pt":"PET-CT cerebral","is_correct":false},{"id":"m4","text_pt":"Angiografia cerebral","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Lesão expansiva com realce anelar em lobo frontal esquerdo","is_correct":true},{"id":"f2","text_pt":"Necrose central e edema perilesional extenso","is_correct":true},{"id":"f3","text_pt":"Desvio de linha média de 8mm para direita","is_correct":true},{"id":"f4","text_pt":"Lesão isquêmica aguda","is_correct":false},{"id":"f5","text_pt":"Abscesso com cápsula regular","is_correct":false},{"id":"f6","text_pt":"Múltiplas lesões desmielinizantes","is_correct":false},{"id":"f7","text_pt":"Hidrocefalia obstrutiva","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Tumor cerebral primário de alto grau (glioblastoma provável)","is_correct":true},{"id":"d2","text_pt":"Metástase cerebral única","is_correct":false},{"id":"d3","text_pt":"Abscesso cerebral","is_correct":false},{"id":"d4","text_pt":"Linfoma primário do SNC","is_correct":false},{"id":"d5","text_pt":"AVC isquêmico subagudo","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Corticoterapia para edema e encaminhamento para biópsia/ressecção neurocirúrgica","is_correct":true},{"id":"n2","text_pt":"Radioterapia imediata sem biópsia","is_correct":false},{"id":"n3","text_pt":"Punção lombar diagnóstica","is_correct":false},{"id":"n4","text_pt":"Antibioticoterapia empírica","is_correct":false}]'::jsonb,
  'A lesão com realce anelar irregular, necrose central e edema vasogênico extenso em paciente acima de 50 anos é altamente sugestiva de glioblastoma (OMS grau IV). A corticoterapia com dexametasona reduz rapidamente o edema perilesional e os sintomas de hipertensão intracraniana enquanto se planeja a abordagem neurocirúrgica para biópsia ou ressecção.',
  1.200
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- CASE 20: Esclerose múltipla (MRI, muito_dificil)
-- ============================================
INSERT INTO cip_image_cases (
  title_pt, clinical_context_pt, modality, image_description_pt, ascii_art,
  area, subspecialty, difficulty, correct_findings, correct_diagnosis, correct_next_step,
  modality_options, findings_options, diagnosis_options, next_step_options,
  explanation_pt, irt_difficulty
) VALUES (
  'Esclerose múltipla',
  'Mulher de 28 anos, episódio de neurite óptica há 6 meses com recuperação parcial. Agora apresenta parestesias ascendentes em membros inferiores e urgência urinária há 3 semanas. Exame neurológico com hiperreflexia em MMII e sinal de Babinski bilateral.',
  'mri',
  'RM de crânio em sequências FLAIR e T2 mostrando múltiplas lesões ovoides hiperintensas periventriculares, dispostas perpendicularmente ao corpo caloso (padrão de dedos de Dawson). Lesões também identificadas na medula cervical em C3-C4 em T2. Algumas lesões apresentam realce após gadolínio (lesões ativas/recentes) enquanto outras não captam contraste (lesões crônicas), demonstrando disseminação temporal. Mais de 9 lesões supratentoriais.',
  NULL,
  'clinica_medica', 'neurologia', 'muito_dificil',
  ARRAY['Lesões periventriculares perpendiculares ao corpo caloso (dedos de Dawson)','Lesões na medula cervical em T2','Coexistência de lesões com e sem realce ao gadolínio (disseminação temporal)'],
  'Esclerose múltipla (critérios de McDonald - disseminação no espaço e no tempo)',
  'Encaminhar ao neurologista para iniciar terapia modificadora de doença',
  '[{"id":"m1","text_pt":"RM de crânio e medula com gadolínio","is_correct":true},{"id":"m2","text_pt":"TC de crânio","is_correct":false},{"id":"m3","text_pt":"Potenciais evocados visuais","is_correct":false},{"id":"m4","text_pt":"Punção lombar com bandas oligoclonais","is_correct":false}]'::jsonb,
  '[{"id":"f1","text_pt":"Lesões periventriculares perpendiculares ao corpo caloso (dedos de Dawson)","is_correct":true},{"id":"f2","text_pt":"Lesões na medula cervical em T2","is_correct":true},{"id":"f3","text_pt":"Coexistência de lesões com e sem realce ao gadolínio (disseminação temporal)","is_correct":true},{"id":"f4","text_pt":"Lesão expansiva única frontal","is_correct":false},{"id":"f5","text_pt":"Leucoencefalopatia difusa simétrica","is_correct":false},{"id":"f6","text_pt":"Infartos lacunares nos núcleos da base","is_correct":false},{"id":"f7","text_pt":"Atrofia cortical difusa","is_correct":false},{"id":"f8","text_pt":"Realce meníngeo difuso","is_correct":false}]'::jsonb,
  '[{"id":"d1","text_pt":"Esclerose múltipla (critérios de McDonald)","is_correct":true},{"id":"d2","text_pt":"Neuromielite óptica (Devic)","is_correct":false},{"id":"d3","text_pt":"Encefalomielite aguda disseminada (ADEM)","is_correct":false},{"id":"d4","text_pt":"Vasculite do SNC","is_correct":false},{"id":"d5","text_pt":"Leucoencefalopatia multifocal progressiva","is_correct":false}]'::jsonb,
  '[{"id":"n1","text_pt":"Encaminhar ao neurologista para iniciar terapia modificadora de doença","is_correct":true},{"id":"n2","text_pt":"Corticoterapia isolada sem seguimento","is_correct":false},{"id":"n3","text_pt":"Observação com RM de controle em 1 ano","is_correct":false},{"id":"n4","text_pt":"Anticoagulação","is_correct":false}]'::jsonb,
  'As lesões periventriculares perpendiculares ao corpo caloso (dedos de Dawson) com acometimento medular e coexistência de lesões ativas e crônicas preenchem os critérios de McDonald 2017 para esclerose múltipla, demonstrando disseminação no espaço (cérebro + medula) e no tempo (lesões com e sem realce). O início precoce de terapia modificadora de doença melhora significativamente o prognóstico a longo prazo.',
  2.000
) ON CONFLICT (title_pt) DO NOTHING;

-- ============================================
-- Summary query
-- ============================================
SELECT
  modality,
  difficulty,
  COUNT(*) as total
FROM cip_image_cases
GROUP BY modality, difficulty
ORDER BY modality, difficulty;
