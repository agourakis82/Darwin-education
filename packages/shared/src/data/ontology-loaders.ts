/**
 * Carregadores de Ontologias Médicas
 * 
 * Sistema para carregar e processar dados hierárquicos médicos:
 * - ICD-10: Classificação Internacional de Doenças (WHO)
 * - ATC: Anatomical Therapeutic Chemical (WHO)
 * - Schema.org: Tipos médicos do Schema.org
 * 
 * @module packages/shared/src/data/ontology-loaders
 */

import type {
  MedicalCondition,
  Drug,
  AnatomicalStructure,
  MedicalTest,
  MedicalOntology,
  OntologyRelationship,
  CodingSystem,
} from '../types/schema-medical';
import type {
  ICD10Node,
  ICD10Tree,
  ATCNode,
  ATCTree,
} from '../types/ontology';

// ============================================
// Tipos de Carregamento
// ============================================

/**
 * Configuração para carregamento de ontologias
 */
export interface OntologyLoaderConfig {
  /**
   * Caminho para dados ICD-10
   */
  icd10DataPath?: string;
  
  /**
   * Caminho para dados ATC
   */
  atcDataPath?: string;
  
  /**
   * Caminho para dados Schema.org
   */
  schemaOrgDataPath?: string;
  
  /**
   * Idioma padrão para nomes
   */
  defaultLanguage?: 'pt-BR' | 'en-US';
  
  /**
   * Incluir nós folha apenas
   */
  leafNodesOnly?: boolean;
}

/**
 * Resultado do carregamento de ontologia
 */
export interface OntologyLoadResult {
  success: boolean;
  ontology?: MedicalOntology;
  icd10Tree?: ICD10Tree;
  atcTree?: ATCTree;
  errors?: string[];
  warnings?: string[];
}

// ============================================
// Carregador Principal
// ============================================

/**
 * Classe principal para carregar ontologias médicas
 */
export class MedicalOntologyLoader {
  private config: OntologyLoaderConfig;
  
  constructor(config: OntologyLoaderConfig = {}) {
    this.config = {
      defaultLanguage: 'pt-BR',
      leafNodesOnly: false,
      ...config,
    };
  }

  /**
   * Carrega todas as ontologias
   */
  async loadAll(): Promise<OntologyLoadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Carregar ICD-10
      const icd10Tree = await this.loadICD10Tree();
      
      // Carregar ATC
      const atcTree = await this.loadATCTree();
      
      // Construir ontologia médica
      const ontology = this.buildMedicalOntology(icd10Tree, atcTree);
      
      return {
        success: true,
        ontology,
        icd10Tree,
        atcTree,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Carrega árvore ICD-10
   */
  async loadICD10Tree(): Promise<ICD10Tree> {
    // Em produção, carregar de arquivo JSON
    // Por enquanto, retorna estrutura estática
    
    const nodes: Map<string, ICD10Node> = new Map();
    
    // Exemplo de nós ICD-10
    const icd10Nodes: ICD10Node[] = [
      {
        code: 'I',
        namePt: 'Algumas doenças infecciosas e parasitárias',
        nameEn: 'Certain infectious and parasitic diseases',
        level: 'chapter',
        parent: null,
        children: ['A00-A09', 'A15-A19'],
        depth: 0,
      },
      {
        code: 'A00-A09',
        namePt: 'Doenças intestinais infecciosas e parasitárias',
        nameEn: 'Intestinal infectious diseases',
        level: 'block',
        parent: 'I',
        children: ['A00', 'A01', 'A02'],
        depth: 1,
      },
      {
        code: 'A00',
        namePt: 'Cólera',
        nameEn: 'Cholera',
        level: 'category',
        parent: 'A00-A09',
        children: ['A000', 'A001', 'A009'],
        depth: 2,
      },
      {
        code: 'A000',
        namePt: 'Cólera devida a Vibrio cholerae 01, biovar cholerae',
        nameEn: 'Cholera due to Vibrio cholerae 01, biovar cholerae',
        level: 'subcategory',
        parent: 'A00',
        children: [],
        depth: 3,
      },
      {
        code: 'A001',
        namePt: 'Cólera devida a Vibrio cholerae 01, biovar El Tor',
        nameEn: 'Cholera due to Vibrio cholerae 01, biovar El Tor',
        level: 'subcategory',
        parent: 'A00',
        children: [],
        depth: 3,
      },
      {
        code: 'IX',
        namePt: 'Doenças do sistema circulatório',
        nameEn: 'Diseases of circulatory system',
        level: 'chapter',
        parent: null,
        children: ['I10-I15', 'I20-I25'],
        depth: 0,
      },
      {
        code: 'I10-I15',
        namePt: 'Doenças hipertensivas',
        nameEn: 'Hypertensive diseases',
        level: 'block',
        parent: 'IX',
        children: ['I10', 'I11'],
        depth: 1,
      },
      {
        code: 'I10',
        namePt: 'Hipertensão arterial essencial (primária)',
        nameEn: 'Essential (primary) hypertension',
        level: 'category',
        parent: 'I10-I15',
        children: ['I100', 'I101', 'I109'],
        depth: 2,
      },
      {
        code: 'I100',
        namePt: 'Hipertensão arterial essencial maligna',
        nameEn: 'Malignant essential hypertension',
        level: 'subcategory',
        parent: 'I10',
        children: [],
        depth: 3,
      },
      {
        code: 'I101',
        namePt: 'Hipertensão arterial essencial benigna',
        nameEn: 'Benign essential hypertension',
        level: 'subcategory',
        parent: 'I10',
        children: [],
        depth: 3,
      },
      {
        code: 'I109',
        namePt: 'Hipertensão arterial essencial não especificada',
        nameEn: 'Essential hypertension, unspecified',
        level: 'subcategory',
        parent: 'I10',
        children: [],
        depth: 3,
      },
    ];
    
    // Construir mapa de nós
    icd10Nodes.forEach(node => {
      nodes.set(node.code, node);
    });
    
    // Count leaf nodes (subcategories)
    const leafCount = icd10Nodes.filter(n => n.level === 'subcategory').length;

    return {
      nodes,
      chapters: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII'],
      leafCount,
    };
  }

  /**
   * Carrega árvore ATC
   */
  async loadATCTree(): Promise<ATCTree> {
    const nodes: Map<string, ATCNode> = new Map();
    
    // Exemplo de nós ATC
    const atcNodes: ATCNode[] = [
      {
        code: 'A',
        namePt: 'Alimentary tract and metabolism',
        nameEn: 'Alimentary tract and metabolism',
        level: 1,
        parent: null,
        children: ['A02', 'A10'],
      },
      {
        code: 'A02',
        namePt: 'Drugs for acid related disorders',
        nameEn: 'Drugs for acid related disorders',
        level: 2,
        parent: 'A',
        children: ['A02B'],
      },
      {
        code: 'A02B',
        namePt: 'Drugs for peptic ulcer and gastro-oesophageal reflux disease',
        nameEn: 'Drugs for peptic ulcer and gastro-oesophageal reflux disease',
        level: 3,
        parent: 'A02',
        children: ['A02BC'],
      },
      {
        code: 'A02BC',
        namePt: 'Proton pump inhibitors',
        nameEn: 'Proton pump inhibitors',
        level: 4,
        parent: 'A02B',
        children: ['A02BC01', 'A02BC02', 'A02BC03'],
      },
      {
        code: 'A02BC01',
        namePt: 'Omeprazole',
        nameEn: 'Omeprazole',
        level: 5,
        parent: 'A02BC',
        children: [],
      },
      {
        code: 'A02BC02',
        namePt: 'Pantoprazole',
        nameEn: 'Pantoprazole',
        level: 5,
        parent: 'A02BC',
        children: [],
      },
      {
        code: 'A02BC03',
        namePt: 'Lansoprazole',
        nameEn: 'Lansoprazole',
        level: 5,
        parent: 'A02BC',
        children: [],
      },
      {
        code: 'C',
        namePt: 'Cardiovascular system',
        nameEn: 'Cardiovascular system',
        level: 1,
        parent: null,
        children: ['C07', 'C08', 'C09'],
      },
      {
        code: 'C07',
        namePt: 'Beta blocking agents',
        nameEn: 'Beta blocking agents',
        level: 2,
        parent: 'C',
        children: ['C07A'],
      },
      {
        code: 'C07A',
        namePt: 'Beta blocking agents',
        nameEn: 'Beta blocking agents',
        level: 3,
        parent: 'C07',
        children: ['C07AA', 'C07AB'],
      },
      {
        code: 'C07AA',
        namePt: 'Non-selective beta blocking agents',
        nameEn: 'Non-selective beta blocking agents',
        level: 4,
        parent: 'C07A',
        children: ['C07AA01', 'C07AA02', 'C07AA03'],
      },
      {
        code: 'C07AA01',
        namePt: 'Propranolol',
        nameEn: 'Propranolol',
        level: 5,
        parent: 'C07AA',
        children: [],
      },
      {
        code: 'C07AA02',
        namePt: 'Sotalol',
        nameEn: 'Sotalol',
        level: 5,
        parent: 'C07AA',
        children: [],
      },
      {
        code: 'C07AA03',
        namePt: 'Nadolol',
        nameEn: 'Nadolol',
        level: 5,
        parent: 'C07AA',
        children: [],
      },
      {
        code: 'C08',
        namePt: 'Calcium channel blockers',
        nameEn: 'Calcium channel blockers',
        level: 2,
        parent: 'C',
        children: ['C08A'],
      },
      {
        code: 'C08A',
        namePt: 'Calcium channel blockers with mainly vascular effects',
        nameEn: 'Calcium channel blockers with mainly vascular effects',
        level: 3,
        parent: 'C08',
        children: ['C08AA'],
      },
      {
        code: 'C08AA',
        namePt: 'Dihydropyridine derivatives',
        nameEn: 'Dihydropyridine derivatives',
        level: 4,
        parent: 'C08A',
        children: ['C08AA01', 'C08AA02'],
      },
      {
        code: 'C08AA01',
        namePt: 'Amlodipine',
        nameEn: 'Amlodipine',
        level: 5,
        parent: 'C08AA',
        children: [],
      },
      {
        code: 'C08AA02',
        namePt: 'Felodipine',
        nameEn: 'Felodipine',
        level: 5,
        parent: 'C08AA',
        children: [],
      },
      {
        code: 'C09',
        namePt: 'Agents acting on renin-angiotensin system',
        nameEn: 'Agents acting on renin-angiotensin system',
        level: 2,
        parent: 'C',
        children: ['C09A'],
      },
      {
        code: 'C09A',
        namePt: 'ACE inhibitors, plain',
        nameEn: 'ACE inhibitors, plain',
        level: 3,
        parent: 'C09',
        children: ['C09AA'],
      },
      {
        code: 'C09AA',
        namePt: 'ACE inhibitors, plain',
        nameEn: 'ACE inhibitors, plain',
        level: 4,
        parent: 'C09A',
        children: ['C09AA01', 'C09AA02', 'C09AA03'],
      },
      {
        code: 'C09AA01',
        namePt: 'Captopril',
        nameEn: 'Captopril',
        level: 5,
        parent: 'C09AA',
        children: [],
      },
      {
        code: 'C09AA02',
        namePt: 'Enalapril',
        nameEn: 'Enalapril',
        level: 5,
        parent: 'C09AA',
        children: [],
      },
      {
        code: 'C09AA03',
        namePt: 'Lisinopril',
        nameEn: 'Lisinopril',
        level: 5,
        parent: 'C09AA',
        children: [],
      },
    ];
    
    // Construir mapa de nós
    atcNodes.forEach(node => {
      nodes.set(node.code, node);
    });

    // Count substances (level 5)
    const substanceCount = atcNodes.filter(n => n.level === 5).length;

    return {
      nodes,
      roots: ['A', 'B', 'C', 'D', 'G', 'H', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'V'],
      substanceCount,
    };
  }

  /**
   * Constrói ontologia médica completa
   */
  private buildMedicalOntology(
    icd10Tree: ICD10Tree,
    atcTree: ATCTree
  ): MedicalOntology {
    const conditions = new Map<string, MedicalCondition>();
    const drugs = new Map<string, Drug>();
    const tests = new Map<string, MedicalTest>();
    const anatomy = new Map<string, AnatomicalStructure>();
    const relationships: OntologyRelationship[] = [];
    
    // Criar condições médicas baseadas em ICD-10
    icd10Tree.nodes.forEach((node, code) => {
      if (node.level === 'subcategory') {
        const condition: MedicalCondition = {
          '@type': 'MedicalCondition',
          id: `condition-${code}`,
          name: node.namePt,
          alternateName: node.nameEn ? [node.nameEn] : [],
          description: `Condição médica classificada como ${code}`,
          code: [{
            codeValue: code,
            codingSystem: 'ICD-10' as CodingSystem,
          }],
          icd10Code: code,
        };
        conditions.set(code, condition);
      }
    });
    
    // Criar medicamentos baseados em ATC
    atcTree.nodes.forEach((node, code) => {
      if (node.level === 5) {
        const drug: Drug = {
          '@type': 'Drug',
          id: `drug-${code}`,
          name: node.namePt,
          alternateName: node.nameEn ? [node.nameEn] : [],
          description: `Fármaco classificado como ${code}`,
          code: [{
            codeValue: code,
            codingSystem: 'ATC' as CodingSystem,
          }],
          atcCode: code,
        };
        drugs.set(code, drug);
      }
    });
    
    // Criar índices de busca
    const byICD10 = new Map<string, MedicalCondition>();
    conditions.forEach((condition, code) => {
      if (condition.icd10Code) {
        byICD10.set(condition.icd10Code, condition);
      }
    });
    
    const byATC = new Map<string, Drug>();
    drugs.forEach((drug, code) => {
      if (drug.atcCode) {
        byATC.set(drug.atcCode, drug);
      }
    });
    
    return {
      conditions,
      drugs,
      tests,
      anatomy,
      systems: new Map(),
      signs: new Map(),
      symptoms: new Map(),
      therapies: new Map(),
      relationships,
      byICD10,
      byATC,
    };
  }

  /**
   * Constrói grafo de relacionamentos
   */
  buildRelationshipGraph(
    conditions: Map<string, MedicalCondition>,
    drugs: Map<string, Drug>
  ): OntologyRelationship[] {
    const relationships: OntologyRelationship[] = [];
    
    // Relacionamentos baseados em ICD-10
    conditions.forEach((condition, code) => {
      if (condition.icd10Code) {
        // Relacionamento pai-filho
        const parentCode = condition.icd10Code.substring(0, condition.icd10Code.length - 1);
        if (parentCode && conditions.has(parentCode)) {
          relationships.push({
            source: parentCode,
            target: code,
            type: 'part_of',
            weight: 1.0,
          });
        }
      }
    });
    
    // Relacionamentos baseados em ATC
    drugs.forEach((drug, code) => {
      if (drug.atcCode) {
        const parentCode = drug.atcCode.substring(0, drug.atcCode.length - 1);
        if (parentCode && drugs.has(parentCode)) {
          relationships.push({
            source: parentCode,
            target: code,
            type: 'part_of',
            weight: 1.0,
          });
        }
      }
    });
    
    return relationships;
  }
}

// ============================================
// Funções de Utilidade
// ============================================

/**
 * Função auxiliar para carregar ontologia
 */
export async function loadMedicalOntology(
  config?: OntologyLoaderConfig
): Promise<OntologyLoadResult> {
  const loader = new MedicalOntologyLoader(config);
  return loader.loadAll();
}

/**
 * Exporta instância padrão do carregador
 */
export const ontologyLoader = new MedicalOntologyLoader();
