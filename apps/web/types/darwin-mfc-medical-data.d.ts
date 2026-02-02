/**
 * Type declarations for @darwin-mfc/medical-data
 *
 * This package exports medical data (diseases, medications, protocols)
 * from the Darwin-MFC project for use in Darwin Education.
 */

declare module '@darwin-mfc/medical-data' {
  // =============================================================================
  // DISEASE TYPES
  // =============================================================================

  export type CategoriaDoenca =
    | 'cardiovascular'
    | 'metabolico'
    | 'respiratorio'
    | 'musculoesqueletico'
    | 'saude_mental'
    | 'infecciosas'
    | 'dermatologico'
    | 'gastrointestinal'
    | 'neurologico'
    | 'endocrino'
    | 'hematologico'
    | 'urologico'
    | 'ginecologico'
    | 'pediatrico'
    | 'geriatrico'
    | 'outros';

  export interface QuickViewContent {
    definicao: string;
    criteriosDiagnosticos: string[];
    classificacaoRisco?: Array<{
      nivel: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
      criterios: string[];
      conduta: string;
    }>;
    tratamentoPrimeiraLinha: {
      naoFarmacologico: string[];
      farmacologico: string[];
    };
    redFlags: string[];
    metasTerapeuticas?: string[];
    examesIniciais?: string[];
  }

  export interface TratamentoFarmacologico {
    classe: string;
    medicamentos: string[];
    posologia?: string;
    duracao?: string;
    observacoes?: string;
  }

  export interface FullDoencaContent {
    epidemiologia: {
      prevalencia?: string;
      incidencia?: string;
      mortalidade?: string;
      faixaEtaria?: string;
      fatoresRisco: string[];
      citations: unknown[];
    };
    fisiopatologia?: {
      texto: string;
      citations: unknown[];
    };
    quadroClinico: {
      sintomasPrincipais: string[];
      sinaisExameFisico: string[];
      formasClinicas?: string[];
      citations: unknown[];
    };
    diagnostico: {
      criterios: string[];
      diagnosticoDiferencial: string[];
      examesLaboratoriais?: string[];
      examesImagem?: string[];
      outrosExames?: string[];
      citations: unknown[];
    };
    tratamento: {
      objetivos: string[];
      naoFarmacologico: {
        medidas: string[];
        citations: unknown[];
      };
      farmacologico: {
        primeiraLinha: TratamentoFarmacologico[];
        segundaLinha?: TratamentoFarmacologico[];
        situacoesEspeciais?: Array<{
          situacao: string;
          tratamento: string[];
        }>;
        citations: unknown[];
      };
    };
    acompanhamento: {
      frequencia: string;
      metasTerapeuticas: string[];
      indicacoesEncaminhamento: string[];
      citations: unknown[];
    };
  }

  export interface Doenca {
    id: string;
    titulo: string;
    subtitulo?: string;
    categoria: CategoriaDoenca;
    subcategoria?: string;
    cid10: string[];
    cid11?: string[];
    ciap2?: string;
    quickView: QuickViewContent;
    fullContent: FullDoencaContent;
  }

  // =============================================================================
  // MEDICATION TYPES
  // =============================================================================

  export interface Medicamento {
    id: string;
    nomeGenerico: string;
    nomeComercial?: string;
    codigoATC?: string;
    classeTerapeutica: string;
    mecanismoAcao?: {
      resumo: string;
      detalhado?: string;
    };
    indicacoesPrincipais?: string[];
    contraindicacoes?: {
      absolutas?: string[];
      relativas?: string[];
    };
    efeitosAdversos?: {
      comuns?: string[];
      raros?: string[];
      graves?: string[];
    };
    interacoes?: Array<{
      medicamento: string;
      descricao: string;
      gravidade?: string;
    }>;
    farmacocinetica?: {
      absorcao?: string;
      distribuicao?: string;
      metabolismo?: string;
      eliminacao?: string;
      meiaVida?: string;
    };
    posologia?: {
      adultos?: string;
      pediatrico?: string;
    };
    ajusteRenal?: {
      descricao?: string;
    };
    ajusteHepatico?: string;
    categoriaGestacao?: string;
    monitoramento?: string[];
    apresentacoes?: string[];
    rename?: boolean;
    disponivelSUS?: boolean;
  }

  // =============================================================================
  // EXPORTS
  // =============================================================================

  export const doencasConsolidadas: Doenca[];
  export const medicamentosConsolidados: Medicamento[];

  export function getDoencaById(id: string): Doenca | undefined;
  export function getMedicamentoById(id: string): Medicamento | undefined;
  export function searchDoencas(query: string): Doenca[];
  export function searchMedicamentos(query: string): Medicamento[];
}
