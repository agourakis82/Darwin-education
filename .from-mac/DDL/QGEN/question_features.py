"""
QGen-DDL Feature Extraction Schema
===================================
Comprehensive data model for medical exam question analysis.
Covers structural, clinical, cognitive, linguistic, psychometric,
and distractor features following IRT 3PL model standards.

Author: Demetrios Chiuratto Agourakis
Project: DARWIN / QGen-DDL
Version: 1.0.0
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
import json


# ============================================================
# ENUMERATIONS
# ============================================================

class QuestionType(Enum):
    """Taxonomia de tipos de questão conforme análise de corpus."""
    CLINICAL_CASE = "caso_clinico"
    CONCEPTUAL = "conceitual"
    IMAGE_BASED = "baseada_em_imagem"
    CLINICAL_CASE_IMAGE = "caso_clinico_com_imagem"
    EPIDEMIOLOGICAL = "epidemiologica"
    ETHICAL = "etico_legal"
    MANAGEMENT = "gestao_saude"


class ClinicalScenario(Enum):
    """Cenários clínicos padronizados."""
    EMERGENCY = "emergencia"
    OUTPATIENT = "ambulatorio"
    WARD = "enfermaria"
    ICU = "uti"
    PRIMARY_CARE = "atencao_primaria"
    SURGERY = "centro_cirurgico"
    OBSTETRIC = "centro_obstetrico"
    COMMUNITY = "saude_comunitaria"
    HOME_VISIT = "visita_domiciliar"
    NEONATAL = "alojamento_conjunto"


class BloomLevel(Enum):
    """Taxonomia de Bloom revisada (Anderson & Krathwohl, 2001)."""
    REMEMBER = 1        # Reconhecer, listar, definir
    UNDERSTAND = 2      # Explicar, classificar, resumir
    APPLY = 3           # Executar, implementar, usar
    ANALYZE = 4         # Diferenciar, organizar, atribuir
    EVALUATE = 5        # Verificar, criticar, julgar
    CREATE = 6          # Gerar, planejar, produzir


class ReasoningType(Enum):
    """Tipo de raciocínio clínico requerido."""
    DIAGNOSTIC = "diagnostico"
    THERAPEUTIC = "conduta_terapeutica"
    PATHOPHYSIOLOGY = "fisiopatologia"
    EPIDEMIOLOGY = "epidemiologia"
    PREVENTION = "prevencao"
    ETHICS = "etica_bioetica"
    EMERGENCY = "emergencia"
    INTERPRETATION = "interpretacao_exames"
    PROGNOSIS = "prognostico"
    MANAGEMENT = "gestao"


class DistractorType(Enum):
    """Taxonomia de distratores para questões médicas."""
    PLAUSIBLE_RELATED = "plausivel_relacionado"      # Outra condição do mesmo sistema
    PARTIALLY_CORRECT = "parcialmente_correto"        # Conduta incompleta
    MISCONCEPTION = "misconception"                    # Erro comum de estudantes
    INVERTED = "invertido"                             # Oposto da resposta
    ABSURD_CALIBRATED = "absurdo_calibrado"           # Claramente errado (facilitador)
    OUTDATED = "desatualizado"                         # Conduta antiga, não mais recomendada
    ADJACENT_SPECIALTY = "especialidade_adjacente"     # De outra área, mas plausível
    OVERDIAGNOSIS = "sobrediagnostico"                # Diagnóstico excessivo
    UNDERTREATMENT = "subtratamento"                   # Tratamento insuficiente
    OVERTREATMENT = "sobretratamento"                  # Tratamento excessivo


class MedicalSpecialty(Enum):
    """Especialidades médicas conforme distribuição ENAMED."""
    CLINICAL_MEDICINE = "clinica_medica"
    SURGERY = "cirurgia"
    PEDIATRICS = "pediatria"
    OBSTETRICS_GYNECOLOGY = "ginecologia_obstetricia"
    PREVENTIVE_MEDICINE = "medicina_preventiva"
    MENTAL_HEALTH = "saude_mental"
    EMERGENCY = "emergencia"
    ETHICS_BIOETHICS = "etica_bioetica"
    GERIATRICS = "geriatria"
    ORTHOPEDICS = "ortopedia"


class ExamSource(Enum):
    """Fontes de provas para corpus."""
    ENAMED = "enamed"
    ENARE = "enare"
    USP = "usp"
    UNIFESP = "unifesp"
    UNICAMP = "unicamp"
    SANTA_CASA = "santa_casa"
    EINSTEIN = "einstein"
    SUS_SP = "sus_sp"
    MEDCURSO = "medcurso"
    MEDCEL = "medcel"
    SANARMED = "sanarmed"
    OTHER = "outro"


# ============================================================
# FEATURE DATACLASSES
# ============================================================

@dataclass
class StructuralFeatures:
    """Features estruturais da questão."""
    question_type: QuestionType
    word_count_stem: int                    # palavras no enunciado
    word_count_alternatives: int            # palavras nas alternativas (total)
    num_alternatives: int                   # 4 ou 5
    has_image: bool = False
    has_table: bool = False
    has_lab_results: bool = False
    has_ecg: bool = False
    has_xray: bool = False
    has_ct_mri: bool = False
    has_graph: bool = False
    num_paragraphs_stem: int = 1
    avg_alternative_length: float = 0.0     # palavras por alternativa
    max_alternative_length: int = 0
    min_alternative_length: int = 0
    length_variance_alternatives: float = 0.0  # variância do tamanho


@dataclass
class ClinicalFeatures:
    """Features clínicas (quando caso clínico)."""
    is_clinical_case: bool = True
    patient_sex: Optional[str] = None       # M, F, não especificado
    patient_age: Optional[int] = None       # idade em anos
    age_group: Optional[str] = None         # neonato, lactente, pré-escolar, etc.
    occupation: Optional[str] = None
    evolution_time: Optional[str] = None    # "há 3 dias", "há 2 anos"
    evolution_category: Optional[str] = None  # agudo, subagudo, crônico
    scenario: Optional[ClinicalScenario] = None
    chief_complaint: Optional[str] = None
    vital_signs_present: bool = False
    physical_exam_findings: List[str] = field(default_factory=list)
    lab_values: List[str] = field(default_factory=list)
    imaging_findings: List[str] = field(default_factory=list)
    medications_mentioned: List[str] = field(default_factory=list)
    comorbidities: List[str] = field(default_factory=list)
    social_history: Optional[str] = None    # tabagismo, etilismo, etc.
    family_history: Optional[str] = None
    surgical_history: Optional[str] = None
    gestational_data: Optional[Dict] = None  # IG, G_P_A, DUM


@dataclass
class CognitiveFeatures:
    """Features cognitivas e de raciocínio."""
    bloom_level: BloomLevel
    reasoning_type: ReasoningType
    primary_specialty: MedicalSpecialty
    secondary_specialties: List[MedicalSpecialty] = field(default_factory=list)
    key_concepts: List[str] = field(default_factory=list)
    prerequisite_knowledge: List[str] = field(default_factory=list)
    integration_required: List[str] = field(default_factory=list)  # cross-specialty
    clinical_reasoning_steps: int = 1       # passos de raciocínio necessários
    requires_calculation: bool = False
    requires_interpretation: bool = False    # ECG, lab, imagem
    requires_staging: bool = False           # classificação/estadiamento
    guideline_reference: Optional[str] = None  # diretriz relevante


@dataclass
class LinguisticFeatures:
    """Features linguísticas e de construção textual."""
    # Marcadores de hedging (incerteza)
    hedging_markers_stem: List[str] = field(default_factory=list)
    hedging_count_stem: int = 0
    
    # Termos absolutos
    absolute_terms: List[str] = field(default_factory=list)  # sempre, nunca, único
    absolute_count: int = 0
    absolute_in_correct: bool = False       # se termos absolutos estão na correta
    
    # Conectivos
    logical_connectives: List[str] = field(default_factory=list)
    
    # Negação
    has_negative_stem: bool = False          # "NÃO", "EXCETO", "INCORRETA"
    negative_type: Optional[str] = None     # except, incorrect, not
    
    # Complexidade
    readability_score: float = 0.0          # índice de legibilidade
    avg_sentence_length: float = 0.0
    technical_term_density: float = 0.0     # termos técnicos / total palavras
    
    # Pistas gramaticais
    grammatical_cues: List[str] = field(default_factory=list)  # concordância reveladora
    has_grammatical_cue: bool = False
    
    # Padrão da pergunta
    question_stem_type: Optional[str] = None  # "Qual diagnóstico?", "Conduta?", etc.


@dataclass
class DistractorFeatures:
    """Features dos distratores."""
    distractors: Dict[str, DistractorType] = field(default_factory=dict)
    correct_answer: str = ""                # A, B, C, D, E
    correct_position: int = 0               # 1-5
    misconceptions_exploited: List[str] = field(default_factory=list)
    trap_mechanism: Optional[str] = None    # como a questão "engana"
    elimination_difficulty: float = 0.0     # quão fácil eliminar distratores
    best_distractor: Optional[str] = None   # distrator mais atraente


@dataclass
class PsychometricFeatures:
    """Features psicométricas (IRT 3PL)."""
    # IRT Parameters (estimados ou calculados)
    difficulty_b: float = 0.0               # parâmetro b (-3 a +3)
    discrimination_a: float = 1.0           # parâmetro a (0 a 2+)
    guessing_c: float = 0.25               # parâmetro c (~1/num_alternativas)
    
    # Classical Test Theory
    difficulty_index: float = 0.5           # proporção de acertos (0-1)
    discrimination_index: float = 0.3       # correlação ponto-bisserial
    
    # Distractor Analysis
    distractor_efficiency: float = 0.0      # proporção de distratores funcionais
    
    # Quality Indicators
    quality_score: float = 0.0              # score composto de qualidade
    estimated_time_seconds: int = 120       # tempo estimado de resolução
    
    # Source statistics (se disponível)
    sample_size: Optional[int] = None
    p_value_observed: Optional[float] = None
    rpbis_observed: Optional[float] = None


@dataclass
class MetadataFeatures:
    """Metadados da questão."""
    source: ExamSource
    year: int
    question_number: Optional[int] = None
    original_id: Optional[str] = None
    exam_name: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    reference_guideline: Optional[str] = None
    last_updated: Optional[str] = None
    validated_by: Optional[str] = None
    validation_date: Optional[str] = None


# ============================================================
# COMPOSITE QUESTION FEATURE VECTOR
# ============================================================

@dataclass
class QuestionFeatureVector:
    """
    Vetor completo de features de uma questão médica.
    
    Este é o objeto central do QGen-DDL, representando a decomposição
    completa de uma questão em todas as suas dimensões analíticas.
    
    Usage:
        qfv = QuestionFeatureVector(
            id="ENAMED_2024_Q001",
            question_text="...",
            alternatives={"A": "...", "B": "...", ...},
            structural=StructuralFeatures(...),
            clinical=ClinicalFeatures(...),
            cognitive=CognitiveFeatures(...),
            linguistic=LinguisticFeatures(...),
            distractor=DistractorFeatures(...),
            psychometric=PsychometricFeatures(...),
            metadata=MetadataFeatures(...)
        )
    """
    id: str
    question_text: str
    alternatives: Dict[str, str]
    correct_answer: str
    commentary: Optional[str] = None
    
    # Feature groups
    structural: StructuralFeatures = field(default_factory=StructuralFeatures)
    clinical: ClinicalFeatures = field(default_factory=ClinicalFeatures)
    cognitive: CognitiveFeatures = field(default_factory=CognitiveFeatures)
    linguistic: LinguisticFeatures = field(default_factory=LinguisticFeatures)
    distractor: DistractorFeatures = field(default_factory=DistractorFeatures)
    psychometric: PsychometricFeatures = field(default_factory=PsychometricFeatures)
    metadata: MetadataFeatures = field(default_factory=MetadataFeatures)
    
    # Embeddings
    embedding_stem: Optional[List[float]] = None
    embedding_full: Optional[List[float]] = None
    
    # Timestamps
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        import dataclasses
        return dataclasses.asdict(self)
    
    def to_json(self) -> str:
        """Serialize to JSON."""
        d = self.to_dict()
        # Convert enums to values
        def convert_enums(obj):
            if isinstance(obj, dict):
                return {k: convert_enums(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_enums(i) for i in obj]
            elif isinstance(obj, Enum):
                return obj.value
            return obj
        return json.dumps(convert_enums(d), ensure_ascii=False, indent=2)
    
    def get_feature_vector_numeric(self) -> List[float]:
        """
        Generate numeric feature vector for ML models.
        Returns a fixed-length vector suitable for clustering,
        classification, and similarity analysis.
        """
        vec = []
        
        # Structural (10 features)
        vec.append(self.structural.word_count_stem / 200.0)  # normalized
        vec.append(self.structural.word_count_alternatives / 100.0)
        vec.append(self.structural.num_alternatives / 5.0)
        vec.append(float(self.structural.has_image))
        vec.append(float(self.structural.has_table))
        vec.append(float(self.structural.has_lab_results))
        vec.append(self.structural.avg_alternative_length / 30.0)
        vec.append(self.structural.length_variance_alternatives / 100.0)
        vec.append(self.structural.num_paragraphs_stem / 5.0)
        vec.append(self.structural.question_type.value.__hash__() % 7 / 7.0)
        
        # Clinical (8 features)
        vec.append(float(self.clinical.is_clinical_case))
        vec.append((self.clinical.patient_age or 40) / 100.0)
        vec.append(float(self.clinical.vital_signs_present))
        vec.append(len(self.clinical.physical_exam_findings) / 10.0)
        vec.append(len(self.clinical.lab_values) / 10.0)
        vec.append(len(self.clinical.comorbidities) / 5.0)
        vec.append(len(self.clinical.medications_mentioned) / 5.0)
        vec.append(float(self.clinical.gestational_data is not None))
        
        # Cognitive (8 features)
        vec.append(self.cognitive.bloom_level.value / 6.0)
        vec.append(self.cognitive.clinical_reasoning_steps / 5.0)
        vec.append(float(self.cognitive.requires_calculation))
        vec.append(float(self.cognitive.requires_interpretation))
        vec.append(float(self.cognitive.requires_staging))
        vec.append(len(self.cognitive.key_concepts) / 5.0)
        vec.append(len(self.cognitive.integration_required) / 3.0)
        vec.append(len(self.cognitive.secondary_specialties) / 3.0)
        
        # Linguistic (6 features)
        vec.append(self.linguistic.hedging_count_stem / 5.0)
        vec.append(self.linguistic.absolute_count / 3.0)
        vec.append(float(self.linguistic.has_negative_stem))
        vec.append(self.linguistic.technical_term_density)
        vec.append(self.linguistic.avg_sentence_length / 30.0)
        vec.append(float(self.linguistic.has_grammatical_cue))
        
        # Psychometric (4 features)
        vec.append((self.psychometric.difficulty_b + 3.0) / 6.0)  # normalize -3..+3 → 0..1
        vec.append(self.psychometric.discrimination_a / 2.0)
        vec.append(self.psychometric.guessing_c)
        vec.append(self.psychometric.distractor_efficiency)
        
        return vec
    
    @staticmethod
    def feature_names() -> List[str]:
        """Return names of numeric features in same order as get_feature_vector_numeric."""
        return [
            # Structural
            "word_count_stem_norm", "word_count_alts_norm", "num_alts_norm",
            "has_image", "has_table", "has_lab", "avg_alt_length_norm",
            "length_var_alts_norm", "num_paragraphs_norm", "question_type_hash",
            # Clinical
            "is_clinical", "patient_age_norm", "vital_signs", "pe_findings_count",
            "lab_count", "comorbidity_count", "medication_count", "is_obstetric",
            # Cognitive
            "bloom_level_norm", "reasoning_steps_norm", "req_calculation",
            "req_interpretation", "req_staging", "key_concepts_count",
            "integration_count", "secondary_spec_count",
            # Linguistic
            "hedging_count_norm", "absolute_count_norm", "has_negative",
            "tech_density", "avg_sent_length_norm", "has_gram_cue",
            # Psychometric
            "difficulty_b_norm", "discrimination_a_norm", "guessing_c",
            "distractor_efficiency"
        ]


# ============================================================
# DISTRIBUTION TEMPLATES (from corpus analysis)
# ============================================================

ENAMED_DISTRIBUTION = {
    "specialty": {
        MedicalSpecialty.CLINICAL_MEDICINE: 0.27,
        MedicalSpecialty.SURGERY: 0.17,
        MedicalSpecialty.PEDIATRICS: 0.16,
        MedicalSpecialty.OBSTETRICS_GYNECOLOGY: 0.16,
        MedicalSpecialty.PREVENTIVE_MEDICINE: 0.12,
        MedicalSpecialty.MENTAL_HEALTH: 0.06,
        MedicalSpecialty.ETHICS_BIOETHICS: 0.04,
        MedicalSpecialty.EMERGENCY: 0.02,
    },
    "bloom_level": {
        BloomLevel.REMEMBER: 0.10,
        BloomLevel.UNDERSTAND: 0.15,
        BloomLevel.APPLY: 0.40,
        BloomLevel.ANALYZE: 0.25,
        BloomLevel.EVALUATE: 0.08,
        BloomLevel.CREATE: 0.02,
    },
    "question_type": {
        QuestionType.CLINICAL_CASE: 0.60,
        QuestionType.CONCEPTUAL: 0.20,
        QuestionType.IMAGE_BASED: 0.10,
        QuestionType.CLINICAL_CASE_IMAGE: 0.05,
        QuestionType.EPIDEMIOLOGICAL: 0.03,
        QuestionType.ETHICAL: 0.02,
    },
    "difficulty_b_mean": 0.0,
    "difficulty_b_std": 1.0,
    "discrimination_a_mean": 1.2,
    "discrimination_a_std": 0.4,
}

RESIDENCIA_USP_DISTRIBUTION = {
    "specialty": {
        MedicalSpecialty.CLINICAL_MEDICINE: 0.30,
        MedicalSpecialty.SURGERY: 0.20,
        MedicalSpecialty.PEDIATRICS: 0.15,
        MedicalSpecialty.OBSTETRICS_GYNECOLOGY: 0.15,
        MedicalSpecialty.PREVENTIVE_MEDICINE: 0.08,
        MedicalSpecialty.MENTAL_HEALTH: 0.05,
        MedicalSpecialty.EMERGENCY: 0.04,
        MedicalSpecialty.ETHICS_BIOETHICS: 0.03,
    },
    "bloom_level": {
        BloomLevel.REMEMBER: 0.05,
        BloomLevel.UNDERSTAND: 0.10,
        BloomLevel.APPLY: 0.35,
        BloomLevel.ANALYZE: 0.35,
        BloomLevel.EVALUATE: 0.12,
        BloomLevel.CREATE: 0.03,
    },
    "difficulty_b_mean": 0.5,   # mais difícil que ENAMED
    "difficulty_b_std": 0.8,
    "discrimination_a_mean": 1.4,
    "discrimination_a_std": 0.3,
}


# ============================================================
# MISCONCEPTION DATABASE
# ============================================================

MEDICAL_MISCONCEPTIONS = {
    "clinica_medica": {
        "pneumologia": [
            {"concept": "DPOC vs Asma", "misconception": "Confundir reversibilidade broncodilatadora",
             "correct": "DPOC: obstrução irreversível; Asma: reversível"},
            {"concept": "TEP", "misconception": "Solicitar D-dímero em alta probabilidade clínica",
             "correct": "Alta probabilidade → angioTC direto, sem D-dímero"},
            {"concept": "Pneumonia", "misconception": "ATB para pneumonia viral",
             "correct": "Viral → suporte; bacteriana → ATB empírico por cenário"},
        ],
        "cardiologia": [
            {"concept": "IAM", "misconception": "Esperar troponina para trombólise",
             "correct": "IAMCSST → reperfusão imediata baseada no ECG"},
            {"concept": "IC", "misconception": "IECA + BRA juntos na IC",
             "correct": "Duplo bloqueio SRAA: sem benefício, mais efeitos adversos"},
            {"concept": "FA", "misconception": "Cardioverter FA crônica sem anticoagulação",
             "correct": "CHA2DS2-VASc → anticoagular antes de cardioverter"},
        ],
        "endocrinologia": [
            {"concept": "DM2", "misconception": "Insulina como primeira linha",
             "correct": "Metformina é primeira linha; insulina se HbA1c > 10% ou sintomas"},
            {"concept": "Hipotireoidismo", "misconception": "Tratar TSH limítrofe sempre",
             "correct": "TSH limítrofe: observar, repetir em 3-6 meses"},
        ],
        "nefrologia": [
            {"concept": "IRA", "misconception": "Dopamina para proteção renal",
             "correct": "Dopamina em dose baixa não protege o rim"},
            {"concept": "DRC", "misconception": "IECA contraindicado em DRC",
             "correct": "IECA é nefroprotetor; monitorar K+ e Cr"},
        ],
    },
    "cirurgia": {
        "abdome_agudo": [
            {"concept": "Apendicite", "misconception": "TC obrigatória para diagnóstico",
             "correct": "Clínica típica → cirurgia; TC se dúvida"},
            {"concept": "Colecistite", "misconception": "Antibiótico e alta",
             "correct": "Colecistite aguda → colecistectomia precoce (< 72h)"},
        ],
        "trauma": [
            {"concept": "ATLS", "misconception": "Raio-X antes de estabilizar",
             "correct": "ABCDE: via aérea primeiro, depois imagem"},
            {"concept": "TCE", "misconception": "Corticoide no TCE",
             "correct": "CRASH trial: corticoide aumenta mortalidade no TCE"},
        ],
    },
    "pediatria": {
        "neonatologia": [
            {"concept": "Icterícia", "misconception": "Suspender aleitamento na icterícia fisiológica",
             "correct": "Manter aleitamento; fototerapia se indicado por zona/BT"},
            {"concept": "RN", "misconception": "Aspirar todo RN ao nascer",
             "correct": "Aspiração rotineira não recomendada; só se necessário"},
        ],
        "infectologia_ped": [
            {"concept": "IVAS", "misconception": "ATB para toda IVAS",
             "correct": "Maioria viral; ATB só se critérios bacterianos"},
            {"concept": "Febre sem foco", "misconception": "ATB imediato em < 3 meses",
             "correct": "Estratificação de risco (Rochester/Philadelphia); nem todos precisam ATB"},
        ],
    },
    "ginecologia_obstetricia": {
        "pre_natal": [
            {"concept": "DMG", "misconception": "Metformina como primeira linha na DMG",
             "correct": "Dieta + exercício primeiro; insulina se falha"},
            {"concept": "Pre_eclampsia", "misconception": "Anti-hipertensivo para pré-eclâmpsia leve",
             "correct": "PE leve: vigilância; tratar se grave (PAS ≥ 160 ou PAD ≥ 110)"},
        ],
        "parto": [
            {"concept": "Indicação cesárea", "misconception": "Cesárea por circular de cordão",
             "correct": "Circular de cordão não é indicação de cesárea"},
        ],
    },
    "medicina_preventiva": {
        "epidemiologia": [
            {"concept": "Rastreamento", "misconception": "Rastrear câncer de próstata com PSA universalmente",
             "correct": "Decisão compartilhada; USPSTF: individualizar 55-69 anos"},
            {"concept": "Vacinas", "misconception": "Contraindicar vacina em imunossuprimido",
             "correct": "Contraindicar apenas vacinas de vírus vivo; inativadas são seguras"},
        ],
        "saude_publica": [
            {"concept": "SUS", "misconception": "SUS é só para pobres",
             "correct": "SUS é universal; princípio da universalidade"},
            {"concept": "Notificação", "misconception": "Notificação apenas se confirmado",
             "correct": "Notificação compulsória inclui casos suspeitos"},
        ],
    },
}


# ============================================================
# VIGNETTE TEMPLATES
# ============================================================

VIGNETTE_TEMPLATES = {
    "emergency": {
        "template": "{paciente}, {idade} anos, {sexo}, é trazido(a) ao pronto-socorro com queixa de {queixa_principal} há {tempo_evolucao}. {historia_adicional}. Nega {negativos_relevantes}. Ao exame: {sinais_vitais}. {exame_fisico}. {exames_complementares}",
        "time_range": "minutos a horas",
        "typical_vitals": True,
        "urgency": "alta",
    },
    "outpatient": {
        "template": "{paciente}, {idade} anos, {sexo}, {ocupacao}, procura {local} com queixa de {queixa_principal} há {tempo_evolucao}. {historia_adicional}. Antecedentes: {antecedentes}. Em uso de {medicamentos}. Ao exame: {exame_fisico}. {exames_complementares}",
        "time_range": "semanas a anos",
        "typical_vitals": False,
        "urgency": "baixa",
    },
    "ward": {
        "template": "{paciente}, {idade} anos, {sexo}, internado(a) há {dias_internacao} dias por {motivo_internacao}. Evoluindo com {nova_queixa} nas últimas {tempo_evolucao}. {evolucao_clinica}. Ao exame: {sinais_vitais}. {exame_fisico}. {exames_complementares}",
        "time_range": "horas a dias",
        "typical_vitals": True,
        "urgency": "média-alta",
    },
    "icu": {
        "template": "{paciente}, {idade} anos, {sexo}, admitido(a) em UTI há {dias_uti} dias por {motivo_admissao}. Atualmente em {suporte}: {detalhes_suporte}. Evolui com {nova_intercorrencia}. Monitorização: {monitorizacao}. Gasometria: {gasometria}. {exames_complementares}",
        "time_range": "horas",
        "typical_vitals": True,
        "urgency": "muito alta",
    },
    "primary_care": {
        "template": "{paciente}, {idade} anos, {sexo}, {ocupacao}, comparece à UBS para {motivo}. {historia_adicional}. Mora com {composicao_familiar} em {tipo_moradia}. Antecedentes familiares: {antecedentes_familiares}. Ao exame: {exame_fisico}.",
        "time_range": "semanas a meses",
        "typical_vitals": False,
        "urgency": "baixa",
    },
    "pediatric": {
        "template": "Lactente/Pré-escolar/Escolar de {idade_meses_anos}, {sexo}, trazido(a) pela mãe com queixa de {queixa_principal} há {tempo_evolucao}. {historia_adicional}. Nascido(a) de parto {tipo_parto}, IG {ig_semanas} semanas, peso ao nascer {peso_nascer}g, Apgar {apgar}. Vacinação {status_vacinal}. {alimentacao}. Ao exame: peso {peso_atual}kg ({percentil_peso}), comprimento/estatura {estatura}cm ({percentil_estatura}). {exame_fisico}.",
        "time_range": "variável",
        "typical_vitals": True,
        "urgency": "variável",
    },
    "obstetric": {
        "template": "Gestante, {idade} anos, {gesta_para} ({detalhes_obstetricos}), IG {ig_semanas} semanas (DUM: {dum} / USG: {usg}), comparece {local} com queixa de {queixa_principal} há {tempo_evolucao}. Pré-natal: {detalhes_prenatal}. {historia_adicional}. Ao exame: PA {pa}, AU {au}cm, BCF {bcf}bpm. {toque_vaginal}. {exames_complementares}.",
        "time_range": "variável",
        "typical_vitals": True,
        "urgency": "variável",
    },
}


# ============================================================
# QUESTION STEM PATTERNS
# ============================================================

QUESTION_STEM_PATTERNS = {
    "diagnostic": [
        "O diagnóstico mais provável é:",
        "A hipótese diagnóstica mais provável é:",
        "Qual o diagnóstico mais provável?",
        "Com base no quadro clínico e nos exames, o diagnóstico é:",
    ],
    "therapeutic": [
        "A conduta mais adequada é:",
        "O tratamento indicado é:",
        "Qual a conduta inicial mais adequada?",
        "A melhor conduta para este paciente é:",
        "A próxima etapa no manejo deste paciente é:",
    ],
    "investigation": [
        "O exame complementar mais indicado é:",
        "Qual exame deve ser solicitado para confirmar o diagnóstico?",
        "Para elucidação diagnóstica, o próximo exame a ser solicitado é:",
    ],
    "pathophysiology": [
        "O mecanismo fisiopatológico envolvido é:",
        "A alteração fisiopatológica que explica o quadro é:",
    ],
    "interpretation": [
        "A interpretação mais adequada dos exames é:",
        "O achado descrito é compatível com:",
        "O exame laboratorial sugere:",
    ],
    "prevention": [
        "A medida preventiva mais adequada é:",
        "Em relação ao rastreamento, recomenda-se:",
        "A principal medida de prevenção é:",
    ],
    "ethics": [
        "De acordo com o Código de Ética Médica, a conduta adequada é:",
        "Do ponto de vista ético e legal, a postura correta é:",
    ],
    "negative": [
        "Assinale a alternativa INCORRETA:",
        "NÃO constitui indicação de:",
        "Todas as alternativas estão corretas, EXCETO:",
    ],
}
