export type BibliographyEntry = {
  id: string
  title: string
  authors?: string
  year?: string
  container?: string
  doi?: string
  url?: string
  note?: string
}

export function formatBibliographyEntry(entry: BibliographyEntry): string {
  const parts: string[] = []
  if (entry.authors) parts.push(entry.authors)
  if (entry.title) parts.push(entry.title)
  if (entry.container) parts.push(entry.container)
  if (entry.year) parts.push(entry.year)
  if (entry.doi) parts.push(`DOI: ${entry.doi}`)
  if (entry.note) parts.push(entry.note)
  return parts.join('. ').replaceAll('..', '.').trim()
}

export const STUDY_METHODS_BIBLIOGRAPHY = {
  spaced_repetition: [
    {
      id: 'ebbinghaus-1885',
      authors: 'Ebbinghaus H.',
      title: 'Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie',
      year: '1885',
      note: 'Obra clássica que introduz a curva do esquecimento (contexto histórico).',
    },
    {
      id: 'cepeda-2006-distributed-practice',
      authors: 'Cepeda NJ, Pashler H, Vul E, Wixted JT, Rohrer D.',
      title: 'Distributed practice in verbal recall tasks: A review and quantitative synthesis',
      container: 'Psychological Bulletin',
      year: '2006',
      doi: '10.1037/0033-2909.132.3.354',
    },
    {
      id: 'wozniak-1990-sm2',
      authors: 'Wozniak PA.',
      title: 'Optimization of learning (SuperMemo)',
      year: '1990',
      url: 'https://super-memory.com/articles/paper.htm',
      note: 'Documento técnico que descreve o algoritmo SM‑2 (usado amplamente em SRS).',
    },
  ],
  active_recall: [
    {
      id: 'roediger-karpicke-2006-test-enhanced',
      authors: 'Roediger HL III, Karpicke JD.',
      title: 'Test-enhanced learning: Taking memory tests improves long-term retention',
      container: 'Psychological Science',
      year: '2006',
      doi: '10.1111/j.1467-9280.2006.01693.x',
    },
  ],
  pomodoro: [
    {
      id: 'cirillo-pomodoro',
      authors: 'Cirillo F.',
      title: 'The Pomodoro Technique',
      url: 'https://francescocirillo.com/pages/pomodoro-technique',
      note: 'Referência do método e material oficial do autor.',
    },
  ],
  psychometrics: [
    {
      id: 'hambleton-1991-fundamentals-irt',
      authors: 'Hambleton RK, Swaminathan H, Rogers HJ.',
      title: 'Fundamentals of Item Response Theory',
      year: '1991',
      note: 'Referência clássica sobre Teoria de Resposta ao Item (TRI/IRT).',
    },
    {
      id: 'lord-1980-applications-irt',
      authors: 'Lord FM.',
      title: 'Applications of Item Response Theory to Practical Testing Problems',
      year: '1980',
      note: 'Texto clássico sobre aplicações práticas de TRI/IRT em avaliação.',
    },
  ],
  inep_enamed: [
    {
      id: 'inep-enamed-microdados-portal-2026',
      authors: 'INEP.',
      title: 'Microdados ENAMED (Dados Abertos)',
      year: '2026',
      url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enamed',
      note: 'Portal oficial (dados abertos) e documentação pública do ENAMED.',
    },
    {
      id: 'inep-enamed-microdados-noticia-2026',
      authors: 'INEP.',
      title: 'INEP publica microdados do ENAMED e amplia transparência do exame',
      year: '2026',
      url: 'https://www.gov.br/inep/pt-br/assuntos/noticias/enamed/inep-publica-microdados-do-enamed-e-amplia-transparencia-do-exame',
    },
    {
      id: 'inep-nota-tecnica-19-2025-angoff-tri',
      authors: 'INEP.',
      title: 'Nota Técnica nº 19/2025 — ENAMED: Modelo Angoff e TRI',
      year: '2025',
      url: 'https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/nota_tecnica_n_19_2025_enamed_modelo_angoff_e_tr.pdf',
    },
    {
      id: 'inep-nota-tecnica-1pl-2025-matriz',
      authors: 'INEP.',
      title: 'Nota Técnica nº 1PL/2025 — Matriz de Referência ENAMED',
      year: '2025',
      url: 'https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/nota_tecnica_n_1pl_2025_matriz_de_referencia_enamed.pdf',
    },
    {
      id: 'inep-nota-tecnica-42-2025-metodologia-pontuacao',
      authors: 'INEP.',
      title: 'Nota Técnica nº 42/2025 — Metodologia de pontuação ENAMED',
      year: '2025',
      url: 'https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/nota_tecnica_n_42_2025_metodologia_pontuacao_enamed.pdf',
    },
    {
      id: 'inep-microdados-governanca-lgpd',
      authors: 'INEP.',
      title: 'Governança e LGPD — Microdados (Dados Abertos)',
      url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados',
      note: 'Página de governança/termos de uso e LGPD para microdados.',
    },
  ],
} satisfies Record<string, BibliographyEntry[]>
