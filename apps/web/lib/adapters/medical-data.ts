/**
 * Medical Data Adapter
 *
 * Maps @darwin-mfc/medical-data types to local interfaces
 * used by the Conteudo pages.
 *
 * Falls back to empty data when the package is unavailable (e.g., Vercel deployment).
 */

import type {
  Doenca,
  Medicamento,
  CategoriaDoenca,
} from '@darwin-mfc/medical-data';

// Dynamic import with fallback for when package is unavailable
let mfcData: {
  doencasConsolidadas: Doenca[];
  medicamentosConsolidados: Medicamento[];
  getDoencaById: (id: string) => Doenca | undefined;
  getMedicamentoById: (id: string) => Medicamento | undefined;
  searchDoencas: (query: string) => Doenca[];
  searchMedicamentos: (query: string) => Medicamento[];
} | null = null;

// Try to load the real package, fall back to stub if unavailable
try {
  // This require is wrapped in try-catch because the package may not be available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const realMfcData = require('@darwin-mfc/medical-data');
  mfcData = {
    doencasConsolidadas: realMfcData.doencasConsolidadas || [],
    medicamentosConsolidados: realMfcData.medicamentosConsolidados || [],
    getDoencaById: realMfcData.getDoencaById || ((_id: string) => undefined),
    getMedicamentoById: realMfcData.getMedicamentoById || ((_id: string) => undefined),
    searchDoencas: realMfcData.searchDoencas || ((_query: string) => []),
    searchMedicamentos: realMfcData.searchMedicamentos || ((_query: string) => []),
  };
} catch {
  // Package not available, use empty fallbacks
  console.warn('[Medical Data] @darwin-mfc/medical-data not available, using empty fallbacks');
  mfcData = {
    doencasConsolidadas: [],
    medicamentosConsolidados: [],
    getDoencaById: (_id: string) => undefined,
    getMedicamentoById: (_id: string) => undefined,
    searchDoencas: (_query: string) => [],
    searchMedicamentos: (_query: string) => [],
  };
}

// Extract for convenience
const {
  doencasConsolidadas,
  medicamentosConsolidados,
  getDoencaById: getMfcDoencaById,
  getMedicamentoById: getMfcMedicamentoById,
  searchDoencas: mfcSearchDoencas,
  searchMedicamentos: mfcSearchMedicamentos,
} = mfcData;

// Local Disease interface (simplified for list display)
export interface Disease {
  id: string;
  name: string;
  icd10: string;
  area: string;
  subspecialty: string | null;
  summary: string;
}

// Local DiseaseDetail interface (full content for detail page)
export interface DiseaseDetail extends Disease {
  epidemiology: string;
  pathophysiology: string;
  clinicalPresentation: string[];
  diagnosis: string[];
  treatment: string[];
  complications: string[];
  prognosis: string;
  relatedQuestions: string[];
}

// Local Medication interface (simplified for list display)
export interface MedicationItem {
  id: string;
  name: string;
  genericName: string;
  atcCode: string;
  drugClass: string;
  mechanism: string;
  summary: string;
}

// Local MedicationDetail interface (full content for detail page)
export interface MedicationDetail extends MedicationItem {
  pharmacokinetics: {
    absorption: string;
    distribution: string;
    metabolism: string;
    elimination: string;
    halfLife: string;
  };
  indications: string[];
  contraindications: string[];
  adverseEffects: string[];
  interactions: string[];
  pregnancy: string;
  monitoring: string[];
  dosing: {
    adult: string;
    pediatric?: string;
    renal?: string;
    hepatic?: string;
  };
}

// Map MFC categoria to ENAMED area
const categoriaToArea: Record<CategoriaDoenca, string> = {
  cardiovascular: 'Clinica Medica',
  metabolico: 'Clinica Medica',
  respiratorio: 'Clinica Medica',
  musculoesqueletico: 'Clinica Medica',
  saude_mental: 'Clinica Medica',
  infecciosas: 'Clinica Medica',
  dermatologico: 'Clinica Medica',
  gastrointestinal: 'Cirurgia',
  neurologico: 'Clinica Medica',
  endocrino: 'Clinica Medica',
  hematologico: 'Clinica Medica',
  urologico: 'Cirurgia',
  ginecologico: 'Ginecologia e Obstetricia',
  pediatrico: 'Pediatria',
  geriatrico: 'Clinica Medica',
  outros: 'Saude Coletiva',
};

// Map MFC categoria to subspecialty
const categoriaToSubspecialty: Record<CategoriaDoenca, string | null> = {
  cardiovascular: 'Cardiologia',
  metabolico: 'Endocrinologia',
  respiratorio: 'Pneumologia',
  musculoesqueletico: 'Reumatologia',
  saude_mental: 'Psiquiatria',
  infecciosas: 'Infectologia',
  dermatologico: 'Dermatologia',
  gastrointestinal: 'Gastroenterologia',
  neurologico: 'Neurologia',
  endocrino: 'Endocrinologia',
  hematologico: 'Hematologia',
  urologico: 'Urologia',
  ginecologico: 'Ginecologia',
  pediatrico: null,
  geriatrico: 'Geriatria',
  outros: null,
};

/**
 * Convert MFC Doenca to local Disease interface
 */
export function adaptDoenca(doenca: Doenca): Disease {
  return {
    id: doenca.id,
    name: doenca.titulo,
    icd10: doenca.cid10[0] || '',
    area: categoriaToArea[doenca.categoria] || 'Clinica Medica',
    subspecialty: doenca.subcategoria || categoriaToSubspecialty[doenca.categoria],
    summary: doenca.quickView.definicao,
  };
}

/**
 * Convert MFC Doenca to local DiseaseDetail interface
 */
export function adaptDoencaDetail(doenca: Doenca): DiseaseDetail {
  const fc = doenca.fullContent;

  return {
    ...adaptDoenca(doenca),
    epidemiology: fc.epidemiologia?.prevalencia ||
      `${fc.epidemiologia?.faixaEtaria || ''} ${fc.epidemiologia?.fatoresRisco?.join(', ') || ''}`.trim(),
    pathophysiology: fc.fisiopatologia?.texto ||
      doenca.quickView.tratamentoPrimeiraLinha.naoFarmacologico.join('. '),
    clinicalPresentation: [
      ...fc.quadroClinico.sintomasPrincipais,
      ...fc.quadroClinico.sinaisExameFisico,
    ],
    diagnosis: [
      ...fc.diagnostico.criterios,
      ...(fc.diagnostico.examesLaboratoriais || []).map((e: string) => `Exame: ${e}`),
      ...(fc.diagnostico.examesImagem || []).map((e: string) => `Imagem: ${e}`),
    ],
    treatment: [
      ...doenca.quickView.tratamentoPrimeiraLinha.naoFarmacologico.map((m: string) => `MEV: ${m}`),
      ...doenca.quickView.tratamentoPrimeiraLinha.farmacologico.map((m: string) => `Farmaco: ${m}`),
      ...fc.tratamento.farmacologico.primeiraLinha.map((t: { classe: string; medicamentos: string[] }) =>
        `${t.classe}: ${t.medicamentos.join(', ')}`
      ),
    ],
    complications: doenca.quickView.redFlags || [],
    prognosis: fc.acompanhamento.metasTerapeuticas.join('. ') ||
      'Prognostico variavel conforme adesao ao tratamento e controle de fatores de risco.',
    relatedQuestions: [],
  };
}

/**
 * Convert MFC Medicamento to local MedicationItem interface
 */
export function adaptMedicamento(med: Medicamento): MedicationItem {
  return {
    id: med.id,
    name: med.nomeComercial || med.nomeGenerico,
    genericName: med.nomeGenerico,
    atcCode: med.codigoATC || '',
    drugClass: med.classeTerapeutica,
    mechanism: med.mecanismoAcao?.resumo || '',
    summary: med.indicacoesPrincipais?.[0] || med.classeTerapeutica,
  };
}

/**
 * Convert MFC Medicamento to local MedicationDetail interface
 */
export function adaptMedicamentoDetail(med: Medicamento): MedicationDetail {
  return {
    ...adaptMedicamento(med),
    pharmacokinetics: {
      absorption: med.farmacocinetica?.absorcao || 'Via oral com boa absorcao',
      distribution: med.farmacocinetica?.distribuicao || 'Distribuicao ampla',
      metabolism: med.farmacocinetica?.metabolismo || 'Metabolismo hepatico',
      elimination: med.farmacocinetica?.eliminacao || 'Excrecao renal',
      halfLife: med.farmacocinetica?.meiaVida || 'Variavel',
    },
    indications: med.indicacoesPrincipais || [],
    contraindications: med.contraindicacoes?.absolutas || [],
    adverseEffects: med.efeitosAdversos?.comuns || [],
    interactions: med.interacoes?.map((i: { medicamento: string; descricao: string }) =>
      `${i.medicamento}: ${i.descricao}`
    ) || [],
    pregnancy: med.categoriaGestacao || 'Consultar medico',
    monitoring: med.monitoramento || [],
    dosing: {
      adult: med.posologia?.adultos || 'Conforme prescricao medica',
      pediatric: med.posologia?.pediatrico,
      renal: med.ajusteRenal?.descricao,
      hepatic: med.ajusteHepatico,
    },
  };
}

// ============================================================================
// EXPORTED DATA AND FUNCTIONS
// ============================================================================

/**
 * All diseases adapted to local format
 */
export const diseases: Disease[] = doencasConsolidadas.map(adaptDoenca);

/**
 * All medications adapted to local format
 */
export const medications: MedicationItem[] = medicamentosConsolidados.map(adaptMedicamento);

/**
 * Get disease by ID (returns detail format)
 */
export function getDiseaseById(id: string): DiseaseDetail | null {
  const doenca = getMfcDoencaById(id);
  return doenca ? adaptDoencaDetail(doenca) : null;
}

/**
 * Get medication by ID (returns detail format)
 */
export function getMedicationById(id: string): MedicationDetail | null {
  const med = getMfcMedicamentoById(id);
  return med ? adaptMedicamentoDetail(med) : null;
}

/**
 * Search diseases by query string
 */
export function searchDiseases(query: string): Disease[] {
  const results = mfcSearchDoencas(query);
  return results.map(adaptDoenca);
}

/**
 * Search medications by query string
 */
export function searchMedications(query: string): MedicationItem[] {
  const results = mfcSearchMedicamentos(query);
  return results.map(adaptMedicamento);
}

/**
 * Get diseases by ENAMED area
 */
export function getDiseasesByArea(area: string): Disease[] {
  return diseases.filter(d => d.area === area);
}

/**
 * Get medications by drug class
 */
export function getMedicationsByClass(drugClass: string): MedicationItem[] {
  return medications.filter(m => m.drugClass === drugClass);
}

/**
 * Get all unique drug classes
 */
export function getAllDrugClasses(): string[] {
  const classes = new Set(medications.map(m => m.drugClass));
  return Array.from(classes).sort();
}

/**
 * Check if medical data is available
 */
export function isMedicalDataAvailable(): boolean {
  return doencasConsolidadas.length > 0 || medicamentosConsolidados.length > 0;
}

/**
 * Stats about the medical data
 */
export const medicalDataStats = {
  totalDiseases: diseases.length,
  totalMedications: medications.length,
  diseasesByArea: {
    'Clinica Medica': diseases.filter(d => d.area === 'Clinica Medica').length,
    'Cirurgia': diseases.filter(d => d.area === 'Cirurgia').length,
    'Pediatria': diseases.filter(d => d.area === 'Pediatria').length,
    'Ginecologia e Obstetricia': diseases.filter(d => d.area === 'Ginecologia e Obstetricia').length,
    'Saude Coletiva': diseases.filter(d => d.area === 'Saude Coletiva').length,
  },
  isAvailable: isMedicalDataAvailable(),
};
