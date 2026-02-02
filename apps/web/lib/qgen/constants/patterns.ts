/**
 * QGen Pattern Constants
 * ======================
 *
 * Regex patterns and constants for feature extraction from medical questions
 */

/**
 * Linguistic patterns for text analysis
 */
export const LINGUISTIC_PATTERNS = {
  hedgingMarkers: [
    'pode', 'podem', 'poderia', 'poderiam',
    'geralmente', 'frequentemente', 'comumente',
    'provavelmente', 'possivelmente',
    'na maioria', 'em geral',
    'tende a', 'tendem a',
    'sugere', 'sugerem',
    'parece', 'parecem',
    'aproximadamente', 'cerca de',
    'em alguns casos', 'eventualmente',
    'habitualmente', 'usualmente',
    'mais frequente', 'menos frequente',
  ],

  absoluteMarkers: [
    'sempre', 'nunca', 'jamais',
    'todos', 'todas', 'todo', 'toda',
    'nenhum', 'nenhuma',
    'único', 'única', 'somente', 'apenas',
    'exclusivamente', 'obrigatoriamente',
    'invariavelmente', 'necessariamente',
    'absolutamente', 'absoluto', 'absoluta',
    'definitivamente', 'certamente',
    'em 100%', 'em todos os casos',
  ],

  negativeStems: [
    'exceto', 'não', 'incorret', 'errad',
    'contraindicad', 'inadequad',
    'evitar', 'nunca', 'jamais',
  ],

  questionFormats: {
    'Qual': /^Qual\b/i,
    'Quais': /^Quais\b/i,
    'O que': /^O que\b/i,
    'Como': /^Como\b/i,
    'Por que': /^Por qu[eê]\b/i,
    'Quando': /^Quando\b/i,
    'Onde': /^Onde\b/i,
    'A conduta': /conduta/i,
    'O diagnóstico': /diagn[óo]stico/i,
    'O tratamento': /tratamento/i,
  } as Record<string, RegExp>,

  logicalConnectives: {
    causal: ['portanto', 'logo', 'assim', 'consequentemente', 'por isso', 'então'],
    adversative: ['mas', 'porém', 'entretanto', 'contudo', 'todavia', 'no entanto'],
    additive: ['e', 'também', 'além disso', 'ademais', 'igualmente'],
    temporal: ['quando', 'enquanto', 'após', 'antes', 'depois', 'durante'],
  },
};

/**
 * Clinical patterns for extracting patient data
 */
export const CLINICAL_PATTERNS = {
  // Age extraction
  age: /(\d+)\s*(anos?|meses?|dias?|semanas?)/i,

  // Sex identification
  sex: {
    male: /\b(homem|masculino|sexo masculino|paciente do sexo masculino|menino|garoto)\b/i,
    female: /\b(mulher|feminino|sexo feminino|paciente do sexo feminino|menina|garota|gestante|puérpera|grávida)\b/i,
  },

  // Time evolution
  timeEvolution: /há\s*(\d+)\s*(minutos?|horas?|dias?|semanas?|meses?|anos?)/i,

  // Vital signs
  vitalSigns: {
    bp: /PA\s*[:=]?\s*(\d+)\s*[xX\/]\s*(\d+)/i,
    hr: /FC\s*[:=]?\s*(\d+)/i,
    rr: /FR\s*[:=]?\s*(\d+)/i,
    temp: /T(?:ax|emp|emperatura)?\s*[:=]?\s*(\d+[,.]?\d*)/i,
    spo2: /(?:SpO2|SatO2|Saturação)\s*[:=]?\s*(\d+)/i,
    weight: /Peso\s*[:=]?\s*(\d+[,.]?\d*)\s*kg/i,
    height: /(?:Altura|Estatura)\s*[:=]?\s*(\d+[,.]?\d*)\s*(?:m|cm)/i,
  } as Record<string, RegExp>,

  // Clinical scenarios
  scenarios: {
    emergency: /\b(pronto.?socorro|PS|emergência|urgência|UPA|SAMU)\b/i,
    outpatient: /\b(ambulat[óo]rio|consulta|consult[óo]rio|consultório)\b/i,
    inpatient: /\b(enfermaria|internado|internação|leito|hospital)\b/i,
    icu: /\b(UTI|terapia intensiva|CTI|unidade de terapia)\b/i,
    primaryCare: /\b(UBS|posto de saúde|atenção primária|ESF|UBSF|atenção básica)\b/i,
    surgery: /\b(centro cirúrgico|cirurgia|bloco cirúrgico|intraoperatório)\b/i,
    prenatal: /\b(pré-natal|prenatal|pré natal)\b/i,
    childbirth: /\b(sala de parto|parto|trabalho de parto|puerpério)\b/i,
  } as Record<string, RegExp>,

  // Lab values patterns
  labValues: {
    hemoglobin: /Hb\s*[:=]?\s*(\d+[,.]?\d*)/i,
    hematocrit: /Ht\s*[:=]?\s*(\d+[,.]?\d*)/i,
    wbc: /(?:Leucócitos|Leuco)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    platelets: /(?:Plaquetas|PLT)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    creatinine: /(?:Creatinina|Cr)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    urea: /(?:Ureia|Uréia)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    sodium: /(?:Sódio|Na)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    potassium: /(?:Potássio|K)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    glucose: /(?:Glicemia|Glicose)\s*[:=]?\s*(\d+[,.]?\d*)/i,
    tsh: /TSH\s*[:=]?\s*(\d+[,.]?\d*)/i,
  } as Record<string, RegExp>,

  // Physical exam systems
  physicalExamSystems: [
    'cardiovascular', 'cardíaco', 'coração',
    'respiratório', 'pulmonar', 'pulmões',
    'neurológico', 'neurológica', 'nervoso',
    'abdominal', 'abdome', 'gastrointestinal',
    'musculoesquelético', 'osteoarticular',
    'cutâneo', 'pele', 'dermatológico',
    'genitourinário', 'urológico',
    'otorrinolaringológico', 'ORL',
    'oftalmológico', 'ocular',
  ],
};

/**
 * Medical concept mapping by system
 */
export const MEDICAL_CONCEPT_MAP: Record<string, string[]> = {
  cardiovascular: [
    'infarto', 'IAM', 'angina', 'ICC', 'insuficiência cardíaca',
    'arritmia', 'fibrilação', 'hipertensão', 'HAS', 'sopro',
    'cardiomiopatia', 'endocardite', 'pericardite', 'valvulopatia',
    'flutter', 'taquicardia', 'bradicardia', 'bloqueio', 'marca-passo',
  ],
  respiratorio: [
    'pneumonia', 'DPOC', 'asma', 'bronquite', 'enfisema',
    'tuberculose', 'derrame pleural', 'pneumotórax', 'SDRA',
    'insuficiência respiratória', 'embolia pulmonar', 'TEP',
    'bronquiectasia', 'fibrose pulmonar', 'sarcoidose',
  ],
  neurologico: [
    'AVC', 'AVE', 'acidente vascular', 'meningite', 'encefalite',
    'epilepsia', 'convulsão', 'parkinson', 'alzheimer', 'demência',
    'esclerose múltipla', 'guillain-barré', 'neuropatia',
    'cefaleia', 'enxaqueca', 'hidrocefalia', 'tumores cerebrais',
  ],
  gastrointestinal: [
    'gastrite', 'úlcera', 'refluxo', 'DRGE', 'cirrose',
    'hepatite', 'pancreatite', 'colecistite', 'apendicite',
    'doença inflamatória intestinal', 'crohn', 'retocolite',
    'hemorragia digestiva', 'varizes esofágicas', 'ascite',
  ],
  endocrino: [
    'diabetes', 'DM', 'hipotireoidismo', 'hipertireoidismo',
    'síndrome metabólica', 'cushing', 'addison', 'feocromocitoma',
    'hipoglicemia', 'cetoacidose', 'coma hiperosmolar',
    'obesidade', 'dislipidemia', 'osteoporose',
  ],
  infeccioso: [
    'sepse', 'choque séptico', 'HIV', 'AIDS', 'tuberculose',
    'dengue', 'malária', 'leptospirose', 'meningite bacteriana',
    'infecção urinária', 'ITU', 'pneumonia comunitária',
    'covid', 'influenza', 'herpes', 'sífilis', 'hepatites virais',
  ],
  renal: [
    'insuficiência renal', 'IRA', 'DRC', 'nefrite', 'nefrose',
    'síndrome nefrótica', 'síndrome nefrítica', 'litíase',
    'pielonefrite', 'glomerulonefrite', 'diálise', 'transplante renal',
  ],
  oncologico: [
    'câncer', 'neoplasia', 'tumor', 'metástase', 'leucemia',
    'linfoma', 'mieloma', 'carcinoma', 'sarcoma',
    'quimioterapia', 'radioterapia', 'estadiamento',
  ],
  psiquiatrico: [
    'depressão', 'ansiedade', 'transtorno bipolar', 'esquizofrenia',
    'psicose', 'TOC', 'TEPT', 'pânico', 'fobia', 'suicídio',
    'dependência', 'abstinência', 'delirium', 'demência',
  ],
  ginecologico: [
    'endometriose', 'mioma', 'câncer de mama', 'câncer de colo',
    'SOP', 'menopausa', 'climatério', 'vulvovaginite',
    'DIP', 'HPV', 'amenorreia', 'sangramento uterino',
  ],
  obstetrico: [
    'pré-eclâmpsia', 'eclâmpsia', 'diabetes gestacional',
    'placenta prévia', 'descolamento de placenta', 'RCIU',
    'parto prematuro', 'rotura prematura', 'sofrimento fetal',
    'hemorragia pós-parto', 'puerpério', 'aleitamento',
  ],
  pediatrico: [
    'bronquiolite', 'pneumonia infantil', 'diarreia aguda',
    'desidratação', 'desnutrição', 'vacinação', 'crescimento',
    'desenvolvimento', 'icterícia neonatal', 'prematuridade',
    'meningite infantil', 'convulsão febril', 'asma infantil',
  ],
  cirurgico: [
    'apendicite', 'colecistite', 'hérnia', 'obstrução intestinal',
    'trauma', 'queimadura', 'fratura', 'abdome agudo',
    'peritonite', 'isquemia mesentérica', 'aneurisma',
  ],
  saude_coletiva: [
    'epidemiologia', 'vigilância', 'imunização', 'atenção primária',
    'ESF', 'NASF', 'SUS', 'promoção da saúde', 'prevenção',
    'rastreamento', 'indicadores', 'determinantes sociais',
  ],
};

/**
 * ENAMED area distribution (expected in official exams)
 */
export const ENAMED_DISTRIBUTION: Record<string, number> = {
  clinica_medica: 0.30,
  cirurgia: 0.20,
  ginecologia_obstetricia: 0.15,
  pediatria: 0.15,
  saude_coletiva: 0.20,
};

/**
 * Bloom level indicators
 */
export const BLOOM_INDICATORS: Record<string, string[]> = {
  KNOWLEDGE: [
    'defina', 'liste', 'cite', 'nomeie', 'identifique',
    'qual é', 'o que é', 'como se chama',
  ],
  COMPREHENSION: [
    'explique', 'descreva', 'resuma', 'interprete',
    'diferencie', 'compare', 'classifique',
  ],
  APPLICATION: [
    'aplique', 'demonstre', 'calcule', 'resolva',
    'utilize', 'exemplifique', 'qual a conduta',
  ],
  ANALYSIS: [
    'analise', 'examine', 'investigue', 'relacione',
    'distingua', 'decomponha', 'qual a causa',
  ],
  SYNTHESIS: [
    'elabore', 'proponha', 'planeje', 'crie',
    'desenvolva', 'formule', 'organize',
  ],
  EVALUATION: [
    'avalie', 'julgue', 'justifique', 'critique',
    'recomende', 'determine', 'qual a melhor',
  ],
};

/**
 * Question target keywords
 */
export const QUESTION_TARGET_KEYWORDS = {
  diagnosis: ['diagnóstico', 'hipótese', 'suspeita', 'provável', 'doença'],
  treatment: ['tratamento', 'terapia', 'medicamento', 'prescrever', 'tratar'],
  nextStep: ['próximo passo', 'conduta', 'seguimento', 'fazer a seguir', 'próxima etapa'],
  mechanism: ['mecanismo', 'fisiopatologia', 'patogênese', 'por que ocorre'],
  prognosis: ['prognóstico', 'evolução', 'expectativa', 'complicação'],
  epidemiologic: ['incidência', 'prevalência', 'risco relativo', 'odds ratio'],
  ethical: ['ética', 'bioética', 'autonomia', 'beneficência', 'sigilo'],
};

/**
 * Readability constants
 */
export const READABILITY_CONSTANTS = {
  // Flesch Reading Ease (Portuguese adaptation)
  fleschConstants: {
    base: 248.835,
    sentenceWeight: -1.015,
    syllableWeight: -84.6,
  },
  // Gunning Fog Index
  fogConstants: {
    sentenceWeight: 0.4,
    complexWordWeight: 100,
  },
  // Average syllables for Portuguese medical terms
  avgMedicalSyllables: 4.2,
};

/**
 * Distractor quality thresholds
 */
export const DISTRACTOR_THRESHOLDS = {
  minPlausibility: 0.3,
  maxPlausibility: 0.95,
  optimalPlausibilityRange: { min: 0.4, max: 0.8 },
  minSemanticSimilarity: 0.2,
  maxSemanticSimilarity: 0.85,
  warningSelectionRateHigh: 0.5, // If >50% select wrong answer, distractor too attractive
  warningSelectionRateLow: 0.05, // If <5% select, distractor too obvious
};

/**
 * IRT estimation defaults
 */
export const IRT_DEFAULTS = {
  guessingParameter: 0.25, // For 4-option MCQ
  defaultDifficulty: 0.0,
  defaultDiscrimination: 1.0,
  difficultyRange: { min: -3, max: 3 },
  discriminationRange: { min: 0.2, max: 2.5 },
};
