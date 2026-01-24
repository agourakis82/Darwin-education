/**
 * Regional Exams Configuration
 * AMRIGS (RS), SURCE (CE), SUS-SP Quadrix
 */

export const REGIONAL_CONFIG = {
  // Individual regional sources
  sources: {
    amrigs: {
      name: 'AMRIGS',
      description: 'Associação Médica do Rio Grande do Sul',
      region: 'Rio Grande do Sul (RS)',
      baseUrl: 'https://www.amrigs.org.br/',
      years: [2022, 2023, 2024],
      questionsPerYear: 100,
      institution: 'AMRIGS',
      institutionTier: 'TIER_2_REGIONAL_STRONG' as const,
      examType: 'R1' as const,
    },
    surce: {
      name: 'SURCE',
      description: 'Seleção Unificada de Residência do Ceará',
      region: 'Ceará (CE)',
      baseUrl: 'http://www.surce.ufc.br/',
      years: [2022, 2023, 2024],
      questionsPerYear: 100,
      institution: 'SURCE',
      institutionTier: 'TIER_2_REGIONAL_STRONG' as const,
      examType: 'R1' as const,
    },
    susSp: {
      name: 'SUS-SP Quadrix',
      description: 'Concursos públicos de residência - São Paulo',
      region: 'São Paulo (SP)',
      baseUrl: 'https://www.quadrix.org.br/',
      years: [2022, 2023, 2024],
      questionsPerYear: 100,
      institution: 'Quadrix (SUS-SP)',
      institutionTier: 'TIER_3_REGIONAL' as const,
      examType: 'R1' as const,
    },
  },

  // Area distribution (equal across 5 areas)
  areas: {
    clinica_medica: { start: 1, end: 20 },
    cirurgia: { start: 21, end: 40 },
    pediatria: { start: 41, end: 60 },
    ginecologia_obstetricia: { start: 61, end: 80 },
    saude_coletiva: { start: 81, end: 100 },
  },

  // URL patterns for PDF downloads
  urlPatterns: {
    amrigs: {
      base: 'https://residenciamedica.amrigs.org.br/provas/',
      pattern: 'prova_amrigs_{year}.pdf',
    },
    surce: {
      base: 'https://www.surce.ufc.br/provas/',
      pattern: 'prova_surce_{year}.pdf',
    },
    susSp: {
      base: 'https://download.quadrix.org.br/sus-sp/residencia/',
      pattern: 'prova_sus_sp_{year}.pdf',
    },
  },
};

/**
 * Map regional question position to Darwin medical area
 */
export function mapRegionalAreaFromPosition(questionNumber: number): string {
  for (const [area, range] of Object.entries(REGIONAL_CONFIG.areas)) {
    if (questionNumber >= range.start && questionNumber <= range.end) {
      return area;
    }
  }
  return 'clinica_medica';
}

/**
 * Get source configuration by ID
 */
export function getSourceConfig(sourceId: 'amrigs' | 'surce' | 'susSp') {
  return REGIONAL_CONFIG.sources[sourceId];
}
