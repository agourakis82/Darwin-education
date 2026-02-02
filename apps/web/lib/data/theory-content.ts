/**
 * Theoretical Content - Clinical Topics for AI-Guided Learning
 *
 * This data structure provides comprehensive theoretical content for medical topics
 * that can be referenced by the AI guidance system to help students understand
 * the concept before or after solving related questions.
 */

export interface TheoryTopic {
  id: string;
  title: string;
  description: string;
  area: string;
  difficulty: 'basico' | 'intermediario' | 'avancado';
  sections: {
    definition: string;
    epidemiology?: string;
    pathophysiology?: string;
    clinicalPresentation?: string;
    diagnosis?: string;
    treatment?: string;
    complications?: string;
    prognosis?: string;
  };
  relatedDiseases?: string[];
  relatedMedications?: string[];
  keyPoints: string[];
  references?: string[];
  estimatedReadTime: number; // in minutes
}

export const theoryTopics: TheoryTopic[] = [
  // Cardiovascular topics
  {
    id: 'hipertensao-arterial',
    title: 'Hipertensão Arterial',
    description: 'Entender os mecanismos fisiopatológicos, classificação e estratégias de tratamento',
    area: 'Clínica Médica',
    difficulty: 'intermediario',
    sections: {
      definition: 'Hipertensão arterial é definida como pressão arterial sistólica ≥140 mmHg e/ou diastólica ≥90 mmHg em pelo menos três medidas em dias diferentes, ou pressão em consultório ≥140/90 mmHg associada a evidência de lesão de órgão alvo.',
      epidemiology: 'Presente em 30-40% dos adultos. Principal fator de risco cardiovascular modificável. Mais prevalente em homens e população negra. Aumenta progressivamente com a idade.',
      pathophysiology: 'Resultado da interação entre fatores genéticos (herança multifatorial ~60%) e ambientais (sódio, obesidade, estresse, sedentarismo). Envolve aumento da resistência vascular periférica, aumento do débito cardíaco ou ambos. Alterações no sistema renina-angiotensina-aldosterona (SRAA) são centrais.',
      clinicalPresentation: 'Maioria dos pacientes é assintomática. Pode apresentar: cefaleia occipital matinal, dispneia, palpitações, síncope. Sinais de lesão de órgão alvo: HVE (hipertrofia ventricular esquerda), proteinúria, deterioração renal, hemorragia retiniana.',
      diagnosis: 'Medição da PA em consultório (em repouso, pelo menos 3 medidas), monitorização residencial (MRPA) - ideal 3 dias antes e após a consulta, ou monitorização ambulatorial (MAPA) - 24h. Pesquisa de lesão de órgão alvo: ECG, ecocardiografia, fundoscopia, avaliação renal.',
      treatment: 'Não farmacológico: redução de sódio, DASH diet, perda de peso, atividade física, redução de álcool, cessação tabágica, manejo do estresse. Farmacológico: inibidores da ECA, bloqueadores dos receptores AT1, beta-bloqueadores, bloqueadores de canais de cálcio, diuréticos. Meta: <140/90 mmHg (<130/80 mmHg em diabéticos e cardiopatas).',
      complications: 'Infarto do miocárdio, AVC, insuficiência renal crônica, retinopatia hipertensiva, encefalopatia hipertensiva, dissecção aórtica, insuficiência cardíaca.',
      prognosis: 'Prognóstico depende do controle tensional e tratamento de outros fatores de risco. Controle adequado reduz significativamente o risco de eventos cardiovasculares.'
    },
    relatedDiseases: ['insuficiencia-cardiaca', 'infarto-miocardio', 'acidente-vascular-cerebral'],
    relatedMedications: ['enalapril', 'losartana', 'atenolol', 'amlodipina', 'hidroclorotiazida'],
    keyPoints: [
      'Hipertensão é o principal fator de risco modificável para DCV',
      'Maioria dos pacientes com HAS é assintomática',
      'Diagnóstico requer múltiplas medições de PA',
      'Tratamento não-farmacológico é primeira linha',
      'Lesão de órgão alvo determina urgência do tratamento',
      'Monitorização ambulatorial melhora precisão diagnóstica'
    ],
    references: [
      'Diretrizes de Hipertensão da Sociedade Brasileira de Cardiologia',
      '7th Joint National Committee on Prevention, Detection, Evaluation, and Treatment of High Blood Pressure'
    ],
    estimatedReadTime: 12
  },
  {
    id: 'insuficiencia-cardiaca',
    title: 'Insuficiência Cardíaca',
    description: 'Síndrome clínica complexa com importante morbimortalidade. Entender fisiopatologia é essencial.',
    area: 'Clínica Médica',
    difficulty: 'avancado',
    sections: {
      definition: 'Incapacidade do coração em bombear quantidade suficiente de sangue para suprir as demandas periféricas e pulmonares em repouso ou durante esforço, ou necessidade de pressões de enchimento elevadas para fazer isso.',
      epidemiology: 'Afeta 1-3% da população. Principal causa de internação em maiores de 65 anos. Prevalência aumenta progressivamente com a idade. Mortalidade em 1 ano: 20-30% em descompensação aguda.',
      pathophysiology: 'Disfunção ventricular (sistólica <40% ou diastólica com fração de ejeção preservada). Ativação neuro-hormonal: SNS, SRAA, peptídeos natriuréticos. Mecanismo Frank-Starling: aumento inicial de pré-carga compensa, mas eventualmente piora. Remodelamento ventricular progressivo.',
      clinicalPresentation: 'Dispneia (aos esforços, ortopneia, dispneia paroxística noturna), edema periférico, ingurgitamento jugular, hepatomegalia, estertores, fadiga, intolerância aos esforços. Dividida em classes funcionais (NYHA I-IV).',
      diagnosis: 'Clínico (anamnese, exame). Ecocardiografia (standard-ouro). Dosagem de BNP/NT-proBNP. ECG (pode ser normal). Radiografia de tórax (sinais de congestão). Dosagem de troponina se suspeita de isquemia.',
      treatment: 'ICFE: IECA/BRA, beta-bloqueadores, MRA, SGLT2-inibitores, diuréticos se congestão. ICFEP: tratamento da causa subjacente, controle de comorbidades. Transplante cardíaco em casos refratários.',
      complications: 'Fibrilação atrial, tromboembolia, arritmias ventriculares, insuficiência renal, morte súbita, choque cardiogênico.',
      prognosis: 'ICFE: mortalidade 15-30% ao ano sem tratamento. Com tratamento otimizado: 5-10%. ICFEP: prognóstico melhor, mortalidade ~5% ao ano.'
    },
    relatedDiseases: ['infarto-miocardio', 'hipertensao-arterial', 'miocardite'],
    relatedMedications: ['enalapril', 'carvedilol', 'espironolactona', 'furosemida', 'dapagliflozina'],
    keyPoints: [
      'Distinguir IC sistólica de diastólica é fundamental para tratamento',
      'Ativação neuro-hormonal perpetua progressão da doença',
      'Ecocardiografia é essencial no diagnóstico',
      'BNP/NT-proBNP útil para diagnóstico e prognóstico',
      'Bloqueadores do SRAA são pilares do tratamento',
      'Pacientes devem ser acompanhados regularmente para titulação de medicamentos'
    ],
    estimatedReadTime: 18
  },
  // Respiratory topics
  {
    id: 'asma',
    title: 'Asma',
    description: 'Doença crônica inflamatória das vias aéreas com alta prevalência e impacto socioeconômico.',
    area: 'Clínica Médica',
    difficulty: 'intermediario',
    sections: {
      definition: 'Doença inflamatória crônica das vias aéreas caracterizada por obstrução do fluxo aéreo reversível (espontaneamente ou com tratamento), inflamação das vias aéreas e hiperresponsividade brônquica a diversos estímulos.',
      epidemiology: 'Afeta 5-10% da população mundial. Mais comum em crianças (sexo masculino) e com prevalência maior em países desenvolvidos. Mortalidade variável: ~1-2% em países desenvolvidos.',
      pathophysiology: 'Inflamação das vias aéreas com infiltração de eosinófilos, mastócitos e linfócitos Th2. Aumento de citocinas (IL-4, IL-5, IL-13). Remodelamento das vias aéreas em asma crônica. Obstrução reversível por edema, hipersecreção mucosa e broncoconstrição.',
      clinicalPresentation: 'Tosse (especialmente noturna ou com risos), dispneia, chiado, opressão torácica. Sintomas geralmente piores à noite. Crises de exacerbação com dispneia severa, taquicardia, taquipneia, baixa saturação O2.',
      diagnosis: 'Histórico clínico + espirometria (FEV1/FVC <70% + reversibilidade >12% após broncodilatador). Teste de hiperresponsividade brônquica (metacolina). Pico de fluxo expiratório. Ausência de achados espirométricos não exclui asma.',
      treatment: 'Controladores: corticoides inalados (primeira linha), β2-agonistas de longa duração, antagonistas de leucotrienos, teofilina. Aliviadores: β2-agonistas de curta duração. Tratar inflamação para evitar exacerbações. Educação do paciente essencial.',
      complications: 'Status asmático (exacerbação refratária ao tratamento). Pneumotórax. Insuficiência respiratória. Morte (rara com tratamento adequado). Limitação da capacidade funcional.',
      prognosis: 'Com tratamento adequado: maioria dos pacientes tem boa qualidade de vida. 5-10% têm asma grave refratária. Alguns pacientes têm remissão espontânea, especialmente na infância.'
    },
    relatedDiseases: ['doenca-pulmonar-obstrutiva-cronica', 'rinite-alergica'],
    relatedMedications: ['albuterol', 'beclometasona', 'formoterol', 'montelucaste'],
    keyPoints: [
      'Asma é diagnóstico clínico + espirométrico',
      'Inflamação é central na fisiopatologia',
      'Tratamento escalonado baseado em gravidade',
      'Corticoides inalados são pilares da terapia',
      'Educação do paciente melhora controle significativamente',
      'Diversas causas desencadeantes devem ser identificadas'
    ],
    estimatedReadTime: 14
  },
  // Gastrointestinal topics
  {
    id: 'doenca-do-refluxo-gastroesofagico',
    title: 'Doença do Refluxo Gastroesofágico (DRGE)',
    description: 'Condição muito comum que afeta qualidade de vida. Entender diferença entre refluxo e DRGE.',
    area: 'Clínica Médica',
    difficulty: 'basico',
    sections: {
      definition: 'Retorno anormal do conteúdo gástrico para o esôfago com frequência suficiente para causar sintomas molestos ou complicações. Refluxo fisiológico é normal; DRGE é patológico quando causa sintomas ou complicações.',
      epidemiology: 'Presente em 20% da população ocidental. Aumenta com idade, obesidade, gravidez. Mais comum em países desenvolvidos. Impacto significativo na qualidade de vida.',
      pathophysiology: 'Incompetência do esfíncter esofágico inferior (EEI) - pressão baixa ou relaxamento inapropriado. Clearance esofágico inadequado. Aumento da agressividade do suco gástrico. Fatores: obesidade, cigarro, álcool, alimentos gordurosos/picantes, agentes espasmogênicos.',
      clinicalPresentation: 'Pirose (burning sensation retroesternal), regurgitação de alimento ou líquido, dor torácica, disfagia, eructação excessiva. Sintomas tipicamente após refeições, ao deitar ou ao fazer atividade física. Pode ter manifestações extraesofágicas: asma, laringite, tosse crônica.',
      diagnosis: 'Diagnóstico clínico em maioria dos casos (história típica). Endoscopia se sinais de alarme (disfagia persistente, vômito, anemia, sangramento, perda de peso, sintomas >5 anos). Monitorização de pH-impedenância se diagnóstico incerto.',
      treatment: 'Medidas gerais: perda de peso, evitar alimentos gatilho, elevar cabeceira cama, sem comer antes de dormir. Farmacológico: antagonistas de H2, inibidores de bomba de prótons (primeira linha). Cirurgia em caso de refratariedade.',
      complications: 'Esôfago de Barrett (metaplasia intestinal, pré-maligna), adenocarcinoma esofágico, estenose esofágica, asma, laringite crônica, pneumonia aspirativa.',
      prognosis: 'Excelente com tratamento. Maioria dos pacientes responde ao PPI. Recorrência comum se suspender medicação.'
    },
    relatedDiseases: ['esofago-de-barrett', 'adenocarcinoma-esofagico'],
    relatedMedications: ['omeprazol', 'pantoprazol', 'ranitidina'],
    keyPoints: [
      'DRGE é diagnóstico clínico',
      'Incompetência do EEI é o mecanismo principal',
      'Medidas gerais devem sempre ser implementadas',
      'PPIs são mais eficazes que bloqueadores de H2',
      'Endoscopia indicada apenas com sinais de alarme',
      'Complicações incluem Barrett e adenocarcinoma'
    ],
    estimatedReadTime: 11
  },
  // Metabolic topics
  {
    id: 'diabetes-mellitus-tipo-2',
    title: 'Diabetes Mellitus Tipo 2',
    description: 'Doença endócrina crônica com importantes complicações microvasculares e macrovasculares.',
    area: 'Clínica Médica',
    difficulty: 'intermediario',
    sections: {
      definition: 'Distúrbio do metabolismo da glicose caracterizado por hiperglicemia resultante de resistência insulínica e deficiência relativa de secreção de insulina (em contraste com DM1 onde há deficiência absoluta).',
      epidemiology: 'Mais comum que DM1 (>90% dos casos de DM). Prevalência crescente: ~10% da população adulta. Aumenta progressivamente com idade, obesidade e sedentarismo. Mais frequente em populações não-caucasianas.',
      pathophysiology: 'Resistência insulínica (periférica e hepática) + disfunção das células beta. Resultado final: hiperglicemia crônica. Contribuem: genética, obesidade, sedentarismo, aging, inflamação. Progressiva deterioração das células beta ao longo do tempo.',
      clinicalPresentation: 'Frequentemente assintomático no diagnóstico. Sintomas quando presentes: polidipsia, poliúria, polifagia, perda de peso, fadiga. Pode apresentar com complicações (neuropatia, nefropatia). Hiperglicemia em jejum ou pós-prandial.',
      diagnosis: 'Glicemia em jejum ≥126 mg/dL, ou glicemia aleatória ≥200 mg/dL com sintomas, ou glicemia 2h pós-sobrecarga 140-199 mg/dL (intolerância) ou ≥200 mg/dL (diabetes), ou A1C ≥6,5%. Rastreamento com A1C em população de risco.',
      treatment: 'Estilo de vida (perda de peso, exercício, dieta). Metformina (primeira linha medicamentosa). Se inadequado: adicionar outras classes (inibidor DPP-4, GLP-1, SGLT2-i, sulfoniluréias, insulina). Meta A1C: 7% (individualizável).',
      complications: 'Retinopatia (causa cegueira reversível), nefropatia (doença renal crônica), neuropatia periférica, neuropatia autonômica, macroangiopatia (IAM, AVC, DIP), pé diabético, infecções, gastroparesia.',
      prognosis: 'Variável conforme controle glicêmico. Bom controle reduz complicações em 20-40%. Incidência de complicações aumenta significativamente com A1C >7-8%.'
    },
    relatedDiseases: ['hipertensao-arterial', 'doenca-coronariana', 'nefropatia-diabetica'],
    relatedMedications: ['metformina', 'glibenclamida', 'sitagriptina', 'empagliflozina', 'insulina-glargina'],
    keyPoints: [
      'Resistência insulínica é mecanismo central',
      'Metformina é primeira linha farmacológica',
      'Controle glicêmico reduz complicações significativamente',
      'Rastreamento importante em população de risco',
      'Complicações microvasculares e macrovasculares devem ser monitoradas',
      'Perda de peso e exercício são fundamentais'
    ],
    estimatedReadTime: 15
  },
  // Additional topics
  {
    id: 'sepsis',
    title: 'Sepse',
    description: 'Emergência médica com alta mortalidade. Diagnóstico e tratamento rápidos são críticos.',
    area: 'Clínica Médica',
    difficulty: 'avancado',
    sections: {
      definition: 'Disfunção de órgão potencialmente letal causada pela resposta anômala do hospedeiro a uma infecção. Sepse é confirmada pela presença de infecção documentada ou suspeita E disfunção de órgão (SOFA score ≥2).',
      epidemiology: 'Incidência global: 15-19 milhões de casos/ano. Mortalidade: 30-40% para sepse, 40-60% para choque séptico. Principal causa de morte em UTI. Aumenta progressivamente com idade.',
      pathophysiology: 'Resposta inflamatória sistêmica a patógeno: liberação de citocinas, ativação de complemento, coagulação intravascular, disfunção endotelial. Resultado: vasodilatação, aumento de permeabilidade capilar, hipotensão, hipoperfusão, disfunção multi-órgão.',
      clinicalPresentation: 'Febre/hipotermia, taquicardia, taquipneia, alteração mental. Critérios qSOFA (alteração mental, hipotensão sistólica, taquipneia). Podem evoluir para choque séptico (necessidade de vasopressores para manter MAP ≥65 mmHg).',
      diagnosis: 'Clínico + laboratorial (lactato elevado, procalcitonina). Hemoculturas antes de antibióticos. Imagem para identificar foco. SOFA score para avaliar disfunção de órgão.',
      treatment: 'Antibióticos de amplo espectro IMEDIATAMENTE (antes de 1h). Reanimação com cristaloide (30 mL/kg em 3h). Vasopressores se hipotensão persistente. Controle do foco (drenagem, desbridamento). Suporte de órgão conforme necessário.',
      complications: 'Disfunção múltipla de órgãos, choque refratário, morte. Sequelas: fraqueza adquirida em UTI, disfunção cognitiva, TEPT.',
      prognosis: 'Muito dependente da rapidez do diagnóstico e tratamento. Cada hora de atraso em antibióticos aumenta mortalidade de ~7%. Prognóstico também dependente da idade, comorbidades e foco da infecção.'
    },
    relatedDiseases: ['pneumonia-comunitaria', 'infeccao-do-trato-urinario', 'peritonite'],
    relatedMedications: ['ceftriaxona', 'ciprofloxacina', 'vancomicina', 'meropenem', 'noradrenalina'],
    keyPoints: [
      'Sepse é EMERGÊNCIA - tratamento imediato salva vidas',
      'Antibióticos ANTES de resultados de cultura',
      'Lactato elevado e qSOFA são bom triagem',
      'Reanimação agressiva com cristaloide é essencial',
      'Vasopressores se hipotensão persistente após volume',
      'Controle do foco infeccioso é tão importante quanto antibióticos'
    ],
    estimatedReadTime: 16
  },
  {
    id: 'acidente-vascular-cerebral',
    title: 'Acidente Vascular Cerebral (AVC)',
    description: 'Emergência neurológica que causa morte e incapacidade. Janela de tratamento é crítica.',
    area: 'Clínica Médica',
    difficulty: 'avancado',
    sections: {
      definition: 'Evento vascular agudo que interrompe fluxo sanguíneo cerebral, resultando em perda rápida de função neurológica. 80-85% isquêmico (trombótico/embólico), 15-20% hemorrágico. Classificação de Bamford, OCSP, ou TOAST.',
      epidemiology: 'Principal causa de morte (2º lugar após DCV) e incapacidade em adultos. Incidência: 3-5 por 1000/ano. Mortalidade 30 dias: 10-15%. Recorrência: 10-15% no 1º ano.',
      pathophysiology: 'Isquemia: diminuição do aporte de O2 e glicose → morte neuronal. Penumbra isquêmica (tecido viável com dano reversível). Cascata inflamatória. Hemorrágico: efeito de massa, edema cerebral, hipertensão intracraniana.',
      clinicalPresentation: 'Onset súbito: déficit neurológico focal (fraqueza, afasia, disartria, hemianopsia, ataxia, dismetria). Pode ter cefaleia (mais em hemorrágico). Severity varia conforme tamanho e localização do infarto.',
      diagnosis: 'TC de crânio urgente (diferenciar isquemia de hemorragia). RM (difusão para detectar infarto precoce). Angiografia (CT/MR/digital subtraction) para identificar oclusão vascular. Ecocardiografia para fonte embólica. ECG para arritmias.',
      treatment: 'Isquêmico agudo (<4,5h): trombolítico (alteplase) ou trombectomia mecânica. Antiagregantes (aspirina) se não trombolítico. Hemorrágico: manejo de hipertensão, suporte. Prevenção secundária: estatinas, antiagregantes/anticoagulante, fisioterapia.',
      complications: 'Edema cerebral, herniação, recorrência, complicações hemorrágicas do trombolítico, convulsões, pneumonia, TVP, depressão pós-AVC.',
      prognosis: 'Muito dependente da rapidez do tratamento (cada minuto conta no isquêmico agudo). Trombectomia mecânica em AVC de grande vaso pode reverter significativamente o déficit se feita rapidamente.'
    },
    relatedDiseases: ['hipertensao-arterial', 'fibrilacao-atrial', 'aterosclerose'],
    relatedMedications: ['alteplase', 'ticagrelor', 'atorvastatina', 'losartana'],
    keyPoints: [
      'Tempo é cérebro - cada minuto de isquemia mata ~32.000 neurônios',
      'TC de crânio URGENTE para diferenciar isquemia de hemorragia',
      'Trombolítico ou trombectomia em janela apropriada',
      'Prevenção secundária criticamente importante',
      'Reabilitação fisioterápica precoce melhora outcomes',
      'Identificar fator de risco e controlar reduz recorrência'
    ],
    estimatedReadTime: 17
  }
];

export const getTopicById = (id: string): TheoryTopic | undefined => {
  return theoryTopics.find(topic => topic.id === id);
};

export const getTopicsByArea = (area: string): TheoryTopic[] => {
  return theoryTopics.filter(topic => topic.area === area);
};

export const searchTopics = (query: string): TheoryTopic[] => {
  const lowerQuery = query.toLowerCase();
  return theoryTopics.filter(
    topic =>
      topic.title.toLowerCase().includes(lowerQuery) ||
      topic.description.toLowerCase().includes(lowerQuery) ||
      topic.keyPoints.some(point => point.toLowerCase().includes(lowerQuery))
  );
};
