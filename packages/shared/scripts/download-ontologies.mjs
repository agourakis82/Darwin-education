/**
 * Script para baixar dados de ontologias médicas
 * 
 * Fontes:
 * - ICD-10: WHO Classification (https://icd.who.int/browse10/2019/en)
 * - ATC: WHO ATC/DDD Index (https://www.whocc.no/atc_ddd_index/)
 * - Schema.org: Health/Life Sciences vocabulary
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ============================================
// ICD-10 Data Download
// ============================================

async function downloadICD10Data() {
  console.log('📊 Baixando dados ICD-10...');
  
  // ICD-10 Capítulo I - A00-B99: Algumas doenças infecciosas e parasitárias
  const icd10Chapters = {
    'I': {
      title: 'Algumas doenças infecciosas e parasitárias',
      codes: 'A00-B99',
      blocks: {
        'A00-A09': 'Doenças intestinais infecciosas e parasitárias',
        'A15-A19': 'Tuberculose',
        'A20-A28': 'Algumas doenças zoonóticas bacterianas',
        'A30-A49': 'Outras doenças bacterianas',
        'A50-A64': 'Doenças com transmissão predominantemente sexual',
        'A65-A69': 'Outras doenças espiroquetais',
        'A70-A74': 'Outras doenças causadas por clamídias',
        'A75-A79': 'Rickettsioses',
        'A80-A89': 'Doenças virais do sistema nervoso central',
        'A90-A99': 'Doenças virais transmitidas por artrópodes e virais hemorrágicas'
      }
    },
    'II': {
      title: 'Neoplasias (tumores)',
      codes: 'C00-D48',
      blocks: {
        'C00-C14': 'Neoplasias malignas do lábio, cavidade oral e faringe',
        'C15-C26': 'Neoplasias malignas dos órgãos digestivos',
        'C30-C39': 'Neoplasias malignas dos órgãos respiratórios e intratorácicos',
        'C40-C41': 'Neoplasias malignas dos ossos e cartilagens articulares',
        'C42-C43': 'Neoplasias malignas da pele',
        'C44': 'Outras neoplasias malignas da pele',
        'C45-C49': 'Neoplasias malignias do tecido conjuntivo e de outros tecidos moles',
        'C50': 'Neoplasias malignas da mama',
        'C51-C58': 'Neoplasias malignas dos órgãos genitais femininos',
        'C60-C63': 'Neoplasias malignas dos órgãos genitais masculinos',
        'C64-C68': 'Neoplasias malignias dos órgãos urinários',
        'C69-C72': 'Neoplasias malignias do olho, encéfalo e de outras partes do sistema nervoso central',
        'C73-C75': 'Neoplasias malignas da tireoide e de outras glándulas endócrinas',
        'C76-C80': 'Neoplasias malignas de lokalizações mal definidas, secundárias e não especificadas',
        'C81-C96': 'Neoplasias malignas do tecido linfático, hematopoético e correlatos',
        'C97': 'Neoplasias malignas de localizações múltiplas (independentes) (primárias)',
        'D00-D09': 'Neoplasias in situ',
        'D10-D36': 'Neoplasias benignas',
        'D37-D48': 'Neoplasias de comportamento incerto ou desconhecido'
      }
    },
    'III': {
      title: 'Doenças do sangue e dos órgãos hematopoéticos e alguns transtornos imunitários',
      codes: 'D50-D89',
      blocks: {
        'D50-D53': 'Anemias nutricionais',
        'D55-D59': 'Anemias hemolíticas',
        'D60-D64': 'Outras anemias',
        'D65-D69': 'Deficiências da coagulação, púrpura e outras afecções hemorrágicas',
        'D70-D77': 'Outras doenças do sangue e dos órgãos hematopoéticos',
        'D80-D89': 'Certos transtornos envolvendo o mecanismo imunitário'
      }
    },
    'IV': {
      title: 'Doenças endócrinas, nutricionais e metabólicas',
      codes: 'E00-E89',
      blocks: {
        'E00-E07': 'Distúrbios da glândula tireoide',
        'E10-E14': 'Diabetes mellitus',
        'E15-E16': 'Outros transtornos da regulação da glicose e do pâncreas interno',
        'E20-E27': 'Distúrbios de outras glândulas endócrinas',
        'E30-E36': 'Outros transtornos endócrinos',
        'E40-E46': 'Desnutrição',
        'E50-E64': 'Outras deficiências nutricionais',
        'E65-E68': 'Sobrepeso, obesidade e outros excessos de calorias',
        'E70-E88': 'Transtornos metabólicos',
        'E90-E99': 'Problemas nutricionais não classificados em outra parte'
      }
    },
    'V': {
      title: 'Transtornos mentais e comportamentais',
      codes: 'F01-F99',
      blocks: {
        'F01-F09': 'Transtornos mentais orgânicos, inclusive os sintomas mentais',
        'F10-F19': 'Transtornos mentais e comportamentais devidos ao uso de substâncias psicoativas',
        'F20-F29': 'Esquizofrenia, transtornos esquizotípicos e delirantes',
        'F30-F39': 'Transtornos do humor (afetivos)',
        'F40-F48': 'Transtornos neuróticos, relacionados ao estresse e somatoformes',
        'F50-F59': 'Transtornos comportamentais associados a perturbações fisiológicas e fatores físicos',
        'F60-F69': 'Transtornos da personalidade e do comportamento do adulto',
        'F70-F79': 'Deficiência mental',
        'F80-F89': 'Transtornos do desenvolvimento psicológico',
        'F90-F98': 'Transtornos comportamentais e emocionais que se manifestam habitualmente na infância e adolescência',
        'F99': 'Transtorno mental não especificado'
      }
    },
    'VI': {
      title: 'Doenças do sistema nervoso',
      codes: 'G00-G99',
      blocks: {
        'G00-G09': 'Doenças inflamatórias do sistema nervoso central',
        'G10-G14': 'Doenças sistêmicas que afetam o sistema nervoso',
        'G20-G26': 'Doenças degenerativas do sistema nervoso',
        'G30-G32': 'Outras doenças degenerativas do sistema nervoso',
        'G35-G37': 'Doenças desmielinizantes do sistema nervoso central',
        'G40-G47': 'Transtornos episodicos e paroxísticos',
        'G50-G59': 'Transtornos dos nervos, raízes e plexos nervosos',
        'G60-G65': 'Polineuropatias e outros transtornos do sistema nervoso periférico',
        'G70-G73': 'Miopatias e transtornos da junção neuromuscular',
        'G80-G83': 'Paralisia cerebral e outras síndromes de paralisia',
        'G90-G99': 'Outros transtornos do sistema nervoso'
      }
    },
    'VII': {
      title: 'Doenças do olho e anexos',
      codes: 'H00-H59',
      blocks: {
        'H00-H06': 'Transtornos da pálpebra, do sistema lacrimal e da órbita',
        'H10-H13': 'Transtornos da conjuntiva',
        'H15-H22': 'Transtornos da esclera, córnea, íris e corpo ciliar',
        'H25-H28': 'Transtornos do cristalino',
        'H30-H36': 'Transtornos da coroideia e da retina',
        'H40-H42': 'Transtornos do globo ocular',
        'H43-H45': 'Transtornos do vítreo e do globo ocular',
        'H46-H48': 'Transtornos do nervo óptico e vias ópticas',
        'H49-H52': 'Transtornos dos músculos oculares, do movimento binocular, da acomodação e da refração',
        'H53-H54': 'Transtornos visuais',
        'H55-H59': 'Outros transtornos do olho e anexos'
      }
    },
    'VIII': {
      title: 'Doenças do ouvido e da apófise mastóide',
      codes: 'H60-H95',
      blocks: {
        'H60-H62': 'Doenças do ouvido externo',
        'H65-H75': 'Doenças do ouvido médio e da apófise mastóide',
        'H80-H83': 'Doenças do ouvido interno',
        'H90-H95': 'Outros transtornos do ouvido'
      }
    },
    'IX': {
      title: 'Doenças do sistema circulatório',
      codes: 'I00-I99',
      blocks: {
        'I00-I02': 'Febre reumática',
        'I05-I09': 'Doenças reumáticas da válvula mitral',
        'I10-I15': 'Doenças hipertensivas',
        'I20-I25': 'Doenças isquêmicas do coração',
        'I26-I28': 'Doenças pulmonares do coração',
        'I30-I52': 'Outras doenças do coração',
        'I60-I69': 'Doenças cerebrovasculares',
        'I70-I79': 'Doenças das artérias, arteríolas e capilares',
        'I80-I89': 'Doenças das veias e linfáticos',
        'I90-I99': 'Outros transtornos do sistema circulatório'
      }
    },
    'X': {
      title: 'Doenças do sistema respiratório',
      codes: 'J00-J99',
      blocks: {
        'J00-J06': 'Infecções agudas das vias aéreas superiores',
        'J09-J18': 'Gripe e pneumonia',
        'J20-J22': 'Outras infecções agudas das vias aéreas inferiores',
        'J30-J39': 'Outras doenças do nariz e dos seios paranasais',
        'J40-J47': 'Doenças crônicas das vias aéreas inferiores',
        'J60-J70': 'Doenças dos pulmões devidas a agentes externos',
        'J80-J84': 'Outras doenças respiratórias que afetam principalmente o interstício',
        'J85-J86': 'Condições purulentas e necróticas do trato respiratório',
        'J90-J94': 'Outras doenças da pleura',
        'J95-J99': 'Outras doenças do sistema respiratório'
      }
    },
    'XI': {
      title: 'Doenças do sistema digestivo',
      codes: 'K00-K95',
      blocks: {
        'K00-K14': 'Doenças da boca, glândulas salivares e maxilares',
        'K20-K31': 'Doenças do esôfago, estômago e duodeno',
        'K35-K38': 'Doenças do apêndice',
        'K40-K46': 'Hernias',
        'K50-K52': 'Doenças intestinais não funcionais',
        'K55-K64': 'Outras doenças do intestino',
        'K65-K68': 'Doenças do peritônio',
        'K70-K77': 'Doenças do fígado',
        'K80-K87': 'Doenças da vesícula biliar, vias biliares e pâncreas',
        'K90-K95': 'Outras doenças do sistema digestivo'
      }
    },
    'XII': {
      title: 'Doenças da pele e do tecido subcutâneo',
      codes: 'L00-L99',
      blocks: {
        'L00-L08': 'Infecções da pele e do tecido subcutâneo',
        'L10-L14': 'Trastornos bolhosos',
        'L20-L30': 'Dermatite e eczema',
        'L40-L45': 'Psoríase',
        'L46-L49': 'Eritema e erupção cutânea',
        'L50-L54': 'Urticária e eritema',
        'L55-L59': 'Transtornos da pele e do tecido subcutâneo relacionados com radiação',
        'L60-L75': 'Trastornos das unhas',
        'L80-L99': 'Outros transtornos da pele e do tecido subcutâneo'
      }
    },
    'XIII': {
      title: 'Doenças do sistema osteomuscular e do tecido conjuntivo',
      codes: 'M00-M99',
      blocks: {
        'M00-M03': 'Artropatias infecciosas',
        'M05-M14': 'Poliartropatias inflamatórias',
        'M15-M19': 'Artroses',
        'M20-M25': 'Outros transtornos articulares',
        'M30-M36': 'Doenças sistêmicas do tecido conjuntivo',
        'M40-M54': 'Transtornos das costas',
        'M60-M79': 'Transtornos dos tecidos moles',
        'M80-M85': 'Transtornos da densidade e estrutura ósseas',
        'M86-M90': 'Outras osteopatias',
        'M91-M94': 'Condropatias',
        'M95-M99': 'Outros transtornos do sistema osteomuscular e do tecido conjuntivo'
      }
    },
    'XIV': {
      title: 'Doenças do sistema geniturinário',
      codes: 'N00-N99',
      blocks: {
        'N00-N08': 'Trastornos glomerulares',
        'N10-N16': 'Doenças túbulo-intersticiais',
        'N17-N19': 'Insuficiência renal',
        'N20-N23': 'Cálculos urinários',
        'N25-N29': 'Outros transtornos do rim e ureter',
        'N30-N39': 'Outras doenças do sistema urinário',
        'N40-N51': 'Doenças dos órgãos genitais masculinos',
        'N60-N65': 'Trastornos da mama',
        'N70-N77': 'Doenças inflamatórias dos órgãos pélvicos femininos',
        'N80-N98': 'Trastornos não inflamatórios dos órgãos genitais femininos',
        'N99': 'Outros transtornos do sistema geniturinário'
      }
    },
    'XV': {
      title: 'Gravidez, parto e puerpério',
      codes: 'O00-O9A',
      blocks: {
        'O00-O08': 'Gravidez com término anômalo',
        'O09-O09': 'Supervisão de outras gravidezes',
        'O10-O16': 'Edema, proteinúria e transtornos hipertensivos na gravidez, parto e puerpério',
        'O20-O29': 'Outros transtornos maternos relacionados com a gravidez',
        'O30-O48': 'Supervisão da gravidez normal',
        'O60-O75': 'Complicações do trabalho de parto e do parto',
        'O80-O82': 'Parto normal',
        'O85-O92': 'Complicações relacionadas principalmente com o puerpério',
        'O95-O99': 'Outros transtornos obstétricos não classificados em outra parte'
      }
    },
    'XVI': {
      title: 'Algumas afecções originadas no período perinatal',
      codes: 'P00-P96',
      blocks: {
        'P00-P04': 'Feto e recém-nascido afetados por fatores maternos e complicações da gravidez, do trabalho de parto e do parto',
        'P05-P08': 'Distúrbios relacionados com a duração da gestação e o crescimento fetal',
        'P10-P15': 'Traumatismo intracraniano e hemorragia do recém-nascido',
        'P20-P29': 'Transtornos respiratórios e cardiovasculares específicos do período perinatal',
        'P35-P39': 'Infecções específicas do período perinatal',
        'P50-P61': 'Afecções hemorrágicas e hematológicas do feto e recém-nascido',
        'P70-P78': 'Transtornos do aparelho digestivo do feto e recém-nascido',
        'P80-P83': 'Afecções relacionadas com o crescimento fetal e o parto normal',
        'P90-P96': 'Outros transtornos originados no período perinatal'
      }
    },
    'XVII': {
      title: 'Malformações congênitas, deformidades e anomalias cromossômicas',
      codes: 'Q00-Q99',
      blocks: {
        'Q00-Q07': 'Malformações congênitas do sistema nervoso',
        'Q10-Q18': 'Malformações congênitas do olho, ouvido, face e pescoço',
        'Q20-Q28': 'Malformações congênitas do sistema circulatório',
        'Q30-Q34': 'Malformações congênitas do sistema respiratório',
        'Q35-Q37': 'Fenda labial e fenda palatina',
        'Q38-Q45': 'Malformações congênitas do sistema digestivo',
        'Q50-Q56': 'Malformações congênitas dos órgãos genitais',
        'Q60-Q64': 'Malformações congênitas do sistema urinário',
        'Q65-Q79': 'Malformações e deformidades congênitas do sistema osteomuscular',
        'Q80-Q89': 'Outras malformações congênitas',
        'Q90-Q99': 'Anomalias cromossômicas não classificadas em outra parte'
      }
    },
    'XVIII': {
      title: 'Sintomas, sinais e achados anormais clínicos e laboratoriais',
      codes: 'R00-R99',
      blocks: {
        'R00-R09': 'Sintomas e sinais que envolvem o sistema circulatório e respiratório',
        'R10-R19': 'Sintomas e sinais que envolvem o sistema digestivo e abdômen',
        'R20-R23': 'Sintomas e sinais que envolvem a pele e o tecido subcutâneo',
        'R25-R29': 'Sintomas e sinais que envolvem os sistemas nervoso e osteomuscular',
        'R30-R39': 'Sintomas e sinais que envolvem o sistema urinário',
        'R40-R46': 'Sintomas e sinais que envolvem a cognição, percepção, estado emocional e comportamento',
        'R47-R49': 'Sintomas e sinais que envolvem a fala e a voz',
        'R50-R69': 'Sintomas e sinais gerais',
        'R70-R79': 'Achados anormais em líquidos corpóreos',
        'R80-R82': 'Achados anormais em urina',
        'R83-R89': 'Achados anormais em outros líquidos, secreções e tecidos corporais',
        'R90-R94': 'Achados anormais em diagnósticos por imagem',
        'R95-R99': 'Causas mal definidas e desconhecidas de mortalidade'
      }
    },
    'XIX': {
      title: 'Lesões, envenenamentos e algumas outras consequências de causas externas',
      codes: 'S00-T88',
      blocks: {
        'S00-S09': 'Lesões da cabeça',
        'S10-S19': 'Lesões do pescoço',
        'S20-S29': 'Lesões do tórax',
        'S30-S39': 'Lesões do abdômen, dorso inferior, coluna lombar e pelve',
        'S40-S49': 'Lesões do ombro e braço',
        'S50-S59': 'Lesões do cotovelo e antebraço',
        'S60-S69': 'Lesões do punho e da mão',
        'S70-S79': 'Lesões do quadril e coxa',
        'S80-S89': 'Lesões do joelho e da perna',
        'S90-S99': 'Lesões do tornozelo e pé',
        'T00-T07': 'Lesões envolvendo múltiplas partes do corpo',
        'T08-T14': 'Lesões de localização não especificada',
        'T15-T19': 'Efeitos de corpo estranho',
        'T20-T32': 'Queimaduras e corrosões',
        'T33-T34': 'Geladura',
        'T36-T50': 'Envenenamento por, efeito adverso de e subdose de drogas, medicamentos e substâncias biológicas',
        'T51-T65': 'Efeitos tóxicos de substâncias não medicamentosas',
        'T66-T78': 'Outros efeitos e os não especificados de causas externas',
        'T79': 'Certos traumatismos iniciais',
        'T80-T88': 'Complicações de cuidados médicos e cirúrgicos não classificados em outra parte'
      }
    },
    'XX': {
      title: 'Causas externas de morbidade e de mortalidade',
      codes: 'V00-Y99',
      blocks: {
        'V00-V99': 'Acidentes de transporte',
        'W00-W19': 'Quedas',
        'W20-W49': 'Exposição a forças mecânicas inanimadas',
        'W50-W64': 'Exposição a forças mecânicas animadas',
        'W65-W74': 'Afogamento e submersão acidentais',
        'W75-W84': 'Outros acidentes que impedem a respiração',
        'W85-W99': 'Exposição à corrente elétrica, radiação e temperaturas e pressões extremas do ambiente',
        'X00-X09': 'Exposição a fumaça, fogo e chamas',
        'X10-X19': 'Contato com calor e substâncias quentes',
        'X20-X29': 'Contato com substâncias venenosas, venenosas, e de metais pesados',
        'X30-X39': 'Exposição a forças da natureza',
        'X40-X49': 'Envenenamento acidental e exposição a substâncias nocivas',
        'X50-X59': 'Fatores acidentais relacionados com o trabalho e o emprego',
        'X60-X84': 'Lesões autoinfligidas intencionalmente',
        'X85-X99': 'Agressão',
        'Y00-Y09': 'Agressão por meio de objetos contundentes',
        'Y10-Y19': 'Envenenamento e exposição a substâncias nocivas',
        'Y20-Y29': 'Agressão por meio de enforcamento, estrangulamento e sufocação',
        'Y30-Y39': 'Agressão por meio de afogamento e submersão',
        'Y40-Y59': 'Drogas, medicamentos e substâncias biológicas causando efeitos adversos',
        'Y60-Y69': 'Complicações de cuidados médicos',
        'Y70-Y82': 'Dispositivos médicos associados a incidentes adversos',
        'Y83-Y84': 'Procedimentos médicos como causa de anormalidades',
        'Y85-Y89': 'Consequências de causas externas',
        'Y90-Y98': 'Fatores relacionados com o estilo de vida',
        'Y95': 'Fatores relacionados com a assistência à saúde',
        'Y96-Y98': 'Outras causas externas de morbidade e mortalidade'
      }
    },
    'XXI': {
      title: 'Fatores que influenciam o estado de saúde e outros contactos com os serviços de saúde',
      codes: 'Z00-Z99',
      blocks: {
        'Z00-Z13': 'Pessoas com potenciais riscos para a saúde relacionados com factores demográficos e socioeconômicos',
        'Z20-Z29': 'Pessoas com potenciais riscos para a saúde relacionados com doenças transmissíveis',
        'Z30-Z39': 'Supervisão de gravidezes de alto risco',
        'Z40-Z54': 'Pessoas com potenciais riscos para a saúde relacionados com história familiar e outros antecedentes',
        'Z55-Z65': 'Pessoas com potenciais riscos para a saúde relacionados com fatores demográficos e socioeconômicos',
        'Z70-Z76': 'Procurando serviços de saúde por outras razões',
        'Z80-Z99': 'Pessoas com potenciais riscos para a saúde relacionados com história médica e familiar e outras circunstâncias'
      }
    },
    'XXII': {
      title: 'Códigos para propósitos especiais',
      codes: 'U00-U99',
      blocks: {
        'U00-U49': 'Códigos reservados para asignação temporária',
        'U50-U99': 'Códigos reservados para asignação especial'
      }
    }
  };

  return icd10Chapters;
}

// ============================================
// ATC Data Download
// ============================================

async function downloadATCData() {
  console.log('💊 Baixando dados ATC...');
  
  // ATC 5-level hierarchy (Anatomical, Therapeutic, Chemical, etc.)
  const atcHierarchy = {
    'A': {
      title: 'Alimentary tract and metabolism',
      description: 'Drugs used in the treatment of diseases affecting the digestive system or metabolism',
      subgroups: {
        'A01': {
          title: 'Stomatological preparations',
          description: 'Drugs used in oral diseases',
          level3: {
            'A01A': {
              title: 'Stomatological preparations',
              description: 'Antiseptics, anti-inflammatory agents, etc.',
              level4: {
                'A01AA': 'Antiseptics',
                'A01AB': 'Anti-inflammatory agents',
                'A01AC': 'Corticosteroids',
                'A01AD': 'Other stomatological preparations'
              }
            }
          }
        },
        'A02': {
          title: 'Drugs for acid related disorders',
          description: 'Drugs used in peptic ulcer disease, gastro-oesophageal reflux disease',
          level3: {
            'A02A': {
              title: 'Antacids',
              description: 'Simple antacids and combinations',
              level4: {
                'A02AA': 'Magnesium compounds',
                'A02AB': 'Aluminium compounds',
                'A02AC': 'Calcium compounds',
                'A02AD': 'Aluminium and magnesium compounds',
                'A02AE': 'Other combinations'
              }
            },
            'A02B': {
              title: 'Drugs for peptic ulcer and gastro-oesophageal reflux disease',
              description: 'Histamine H2-receptor antagonists, proton pump inhibitors',
              level4: {
                'A02BA': 'Histamine H2-receptor antagonists',
                'A02BB': 'Histamine H2-receptor antagonists, combinations',
                'A02BC': 'Proton pump inhibitors',
                'A02BD': 'Combinations for eradication of Helicobacter pylori',
                'A02BX': 'Other drugs for peptic ulcer and gastro-oesophageal reflux disease'
              }
            }
          }
        },
        'A03': {
          title: 'Drugs for functional gastrointestinal disorders',
          description: 'Drugs used in functional bowel disorders',
          level3: {
            'A03A': {
              title: 'Synthetic anticholinergics, esters with tertiary amino group',
              description: 'Antispasmodics',
              level4: {
                'A03AA': 'Esters of tertiary amines',
                'A03AB': 'Quaternary ammonium compounds',
                'A03AC': 'Other synthetic anticholinergics'
              }
            },
            'A03B': {
              title: 'Belladonna derivatives',
              description: 'Belladonna alkaloids and related drugs',
              level4: {
                'A03BA': 'Atropine',
                'A03BB': 'Belladonna alkaloids, derivatives'
              }
            },
            'A03F': {
              title: 'Propulsives',
              description: 'Drugs stimulating gastrointestinal motility',
              level4: {
                'A03FA': 'Serotonin 5-HT4 receptor agonists'
              }
            }
          }
        },
        'A05': {
          title: 'Bile and liver therapy',
          description: 'Drugs used in diseases of the liver and bile system',
          level3: {
            'A05A': {
              title: 'Bile therapy',
              description: 'Bile acids and bile preparations',
              level4: {
                'A05AA': 'Bile acids',
                'A05AB': 'Bile preparations'
              }
            },
            'A05B': {
              title: 'Lipotropic agents',
              description: 'Drugs used in hyperlipoproteinemia',
              level4: {
                'A05BA': 'Lipotropic agents'
              }
            }
          }
        },
        'A06': {
          title: 'Anti-obesity preparations',
          description: 'Drugs used in obesity treatment',
          level3: {
            'A06A': {
              title: 'Anti-obesity products',
              description: 'Anti-obesity preparations',
              level4: {
                'A06AA': 'Peripherally acting anti-obesity products',
                'A06AB': 'Antiobesity preparations, excluding diet combinations',
                'A06AD': 'Other antiobesity products'
              }
            }
          }
        },
        'A07': {
          title: 'Antidiarrheals, intestinal anti-inflammatory/anti-infective agents',
          description: 'Drugs used in inflammatory bowel disease and intestinal anti-infectives',
          level3: {
            'A07A': {
              title: 'Intestinal anti-infectives',
              description: 'Antibiotics and other agents for local use',
              level4: {
                'A07AA': 'Antibiotics',
                'A07AB': 'Sulphonamides and combinations',
                'A07AC': 'Nitrofuran derivatives',
                'A07AD': 'Imidazole derivatives',
                'A07AX': 'Other intestinal anti-infectives'
              }
            },
            'A07B': {
              title: 'Intestinal anti-inflammatory agents',
              description: 'Intestinal anti-inflammatory agents',
              level4: {
                'A07BA': 'Intestinal anti-inflammatory agents',
                'A07BB': 'Intestinal anti-inflammatory agents, combinations'
              }
            },
            'A07C': {
              title: 'Antidiarrheals',
              description: 'Antidiarrheals, intestinal anti-inflammatory agents',
              level4: {
                'A07CA': 'Intestinal anti-inflammatory agents',
                'A07CB': 'Intestinal adsorbents',
                'A07CC': 'Anticholinergics',
                'A07CD': 'Probiotics',
                'A07CE': 'Intestinal anti-inflammatory agents, excluding corticosteroids',
                'A07CX': 'Other antidiarrheals'
              }
            }
          }
        },
        'A08': {
          title: 'Antiobesity preparations, excluding diet combinations, slimming preparations',
          description: 'Anti-obesity preparations',
          level3: {
            'A08A': {
              title: 'Antiobesity preparations',
              description: 'Anti-obesity products',
              level4: {
                'A08AA': 'Peripherally acting antiobesity products',
                'A08AB': 'Antiobesity preparations, excluding diet combinations'
              }
            }
          }
        },
        'A09': {
          title: 'Digestives, enzymes and metabolic agents',
          description: 'Digestive enzymes and metabolic agents',
          level3: {
            'A09A': {
              title: 'Digestives, enzymes and metabolic agents',
              description: 'Digestives and metabolic agents',
              level4: {
                'A09AA': 'Enzymes',
                'A09AB': 'Acids',
                'A09AC': 'Metabolic agents',
                'A09AD': 'Digestive enzymes and metabolic agents',
                'A09AE': 'Metabolic agents',
                'A09AX': 'Other digestive enzymes'
              }
            }
          }
        },
        'A10': {
          title: 'Drugs used in diabetes',
          description: 'Insulins and oral hypoglycemic drugs',
          level3: {
            'A10A': {
              title: 'Insulins',
              description: 'Insulins and analogues',
              level4: {
                'A10AB': 'Insulins',
                'A10AC': 'Insulins',
                'A10AD': 'Insulins',
                'A10AE': 'Insulins',
                'A10AF': 'Insulins',
                'A10AG': 'Insulins',
                'A10AH': 'Insulins',
                'A10AJ': 'Insulins',
                'A10AK': 'Insulins',
                'A10AL': 'Insulins',
                'A10AM': 'Insulins',
                'A10AN': 'Insulins',
                'A10AP': 'Insulins',
                'A10AX': 'Insulins'
              }
            },
            'A10B': {
              title: 'Blood glucose lowering drugs, excl. insulins',
              description: 'Sulfonylureas, biguanides and other drugs',
              level4: {
                'A10BA': 'Biguanides',
                'A10BB': 'Sulfonylureas',
                'A10BC': 'Sulfonylureas',
                'A10BD': 'Biguanides and sulfonylureas',
                'A10BF': 'Alpha glucosidase inhibitors',
                'A10BG': 'Thiazolidinediones',
                'A10BH': 'DPP-4 inhibitors',
                'A10BX': 'Other blood glucose lowering drugs, excl. insulins'
              }
            }
          }
        },
        'A11': {
          title: 'Vitamins',
          description: 'Vitamin A, D, E and K',
          level3: {
            'A11A': {
              title: 'Multivitamins',
              description: 'Multivitamins and other vitamins in combination',
              level4: {
                'A11AA': 'Multivitamins, combinations',
                'A11AB': 'Multivitamins',
                'A11AC': 'Vitamin A',
                'A11AD': 'Vitamin A',
                'A11AE': 'Vitamin D',
                'A11AF': 'Vitamin D',
