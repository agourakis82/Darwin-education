# Inferred Schemas With Caveats

These schemas were inferred from parser/type code and are best-effort, not guaranteed runtime schemas.

## BatchJob
- Source: `apps/web/lib/ddl/services/batch-service.ts:13-26`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - batch_name: string
  - source_type: string
  - source_id: string | null
  - status: BatchStatus
  - total_items: number
  - processed_items: number
  - failed_items: number
  - created_at: string
  - started_at: string | null
  - completed_at: string | null
  - error_message: string | null

## BatchItem
- Source: `apps/web/lib/ddl/services/batch-service.ts:28-42`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - item_id: string
  - response_id: string
  - question_id: string
  - response_text: string
  - behavioral_data: any
  - question_text: string
  - reference_answer: string
  - key_concepts: any[]
  - required_integrations: any[]
  - discipline: string
  - topic: string
  - difficulty_level: number
  - cognitive_level: string

## BatchProcessingResult
- Source: `apps/web/lib/ddl/services/batch-service.ts:44-50`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - jobId: string
  - totalItems: number
  - processedItems: number
  - failedItems: number
  - status: BatchStatus

## GrokChatMessage
- Source: `apps/web/lib/ddl/services/grok-client.ts:13-16`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - role: 'system' | 'user' | 'assistant'
  - content: string

## GrokChatOptions
- Source: `apps/web/lib/ddl/services/grok-client.ts:18-22`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - model: string
  - maxTokens: number
  - temperature: number

## KeyConcept
- Source: `apps/web/lib/ddl/types.ts:11-15`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: string
  - weight: number
  - synonyms: string[]

## Integration
- Source: `apps/web/lib/ddl/types.ts:17-21`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - from: string
  - to: string
  - relation: string

## DDLQuestion
- Source: `apps/web/lib/ddl/types.ts:23-35`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - question_code: string
  - question_text: string
  - discipline: string
  - topic: string
  - subtopic: string
  - difficulty_level: number
  - cognitive_level: string
  - reference_answer: string
  - key_concepts: KeyConcept[]
  - required_integrations: Integration[]

## KeystrokeDynamics
- Source: `apps/web/lib/ddl/types.ts:38-43`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - total_keystrokes: number
  - backspace_count: number
  - delete_count: number
  - avg_inter_key_interval_ms: number

## RevisionEvent
- Source: `apps/web/lib/ddl/types.ts:45-51`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - timestamp: string
  - type: string
  - position: number
  - start: number
  - end: number

## FocusEvent
- Source: `apps/web/lib/ddl/types.ts:53-57`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - timestamp: string
  - type: 'blur' | 'focus'
  - duration_ms: number

## BehavioralData
- Source: `apps/web/lib/ddl/types.ts:59-71`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - start_timestamp: string
  - end_timestamp: string
  - total_time_ms: number
  - time_to_first_keystroke_ms: number
  - pause_count: number
  - pause_durations_ms: number[]
  - keystroke_dynamics: KeystrokeDynamics
  - revision_events: RevisionEvent[]
  - focus_events: FocusEvent[]
  - scroll_events: number
  - copy_paste_events: number

## DDLResponse
- Source: `apps/web/lib/ddl/types.ts:74-81`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - user_id: string
  - question_id: string
  - session_id: string
  - response_text: string
  - behavioral_data: BehavioralData

## ConceptDetail
- Source: `apps/web/lib/ddl/types.ts:84-89`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: string
  - status: 'present' | 'missing' | 'incorrect' | 'partial'
  - evidence: string
  - quality: 'accurate' | 'imprecise' | 'misconceived'

## DetectedIntegration
- Source: `apps/web/lib/ddl/types.ts:91-98`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - from: string
  - to: string
  - expected_relation: string
  - detected: boolean
  - quality: 'complete' | 'partial' | 'incorrect' | 'missing'
  - evidence: string

## SemanticAnalysisResult
- Source: `apps/web/lib/ddl/types.ts:100-148`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - overall_semantic_similarity: number

## HesitationPattern
- Source: `apps/web/lib/ddl/types.ts:151-157`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - total_pause_time_ms: number
  - pause_ratio: number
  - long_pauses_count: number
  - hesitation_index: number
  - pause_positions: string[]

## RevisionPattern
- Source: `apps/web/lib/ddl/types.ts:159-165`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - revision_count: number
  - revision_ratio: number
  - major_revisions: number
  - revision_positions: string[]
  - self_correction_index: number

## AnxietyIndicators
- Source: `apps/web/lib/ddl/types.ts:167-173`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - erratic_typing: boolean
  - focus_loss_events: number
  - rapid_deletion_bursts: number
  - time_pressure_indicator: boolean
  - behavioral_anxiety_score: number

## BehavioralAnalysisResult
- Source: `apps/web/lib/ddl/types.ts:175-187`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - response_time_ms: number
  - time_per_word_ms: number
  - time_to_first_keystroke_ms: number
  - hesitation_pattern: HesitationPattern
  - revision_pattern: RevisionPattern
  - anxiety_indicators: AnxietyIndicators

## ClassificationResult
- Source: `apps/web/lib/ddl/types.ts:190-210`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - primary_type: LacunaType
  - primary_probability: number
  - primary_confidence: ConfidenceLevel
  - secondary_type: LacunaType
  - secondary_probability: number
  - probabilities: Record<string, number>
  - reasoning_chain: string

## ActionItem
- Source: `apps/web/lib/ddl/types.ts:213-218`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - priority: 'high' | 'medium' | 'low'
  - action: string
  - rationale: string
  - estimated_time: string

## AreaForGrowth
- Source: `apps/web/lib/ddl/types.ts:220-224`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: string
  - explanation: string
  - suggestion: string

## Resource
- Source: `apps/web/lib/ddl/types.ts:226-230`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'concept_review' | 'practice' | 'technique'
  - topic: string
  - description: string

## FeedbackContent
- Source: `apps/web/lib/ddl/types.ts:232-243`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: LacunaType
  - title: string
  - greeting: string
  - main_message: string
  - strengths: string[]
  - areas_for_growth: AreaForGrowth[]
  - action_items: ActionItem[]
  - resources: Resource[]
  - encouragement: string
  - next_steps: string

## FeedbackMetadata
- Source: `apps/web/lib/ddl/types.ts:245-249`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tone: 'encouraging' | 'supportive' | 'constructive'
  - complexity_level: 'basic' | 'intermediate' | 'advanced'
  - estimated_reading_time_seconds: number

## DDLFeedback
- Source: `apps/web/lib/ddl/types.ts:251-254`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - feedback: FeedbackContent
  - metadata: FeedbackMetadata

## UserBaseline
- Source: `apps/web/lib/ddl/types.ts:257-280`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - user_id: string
  - total_responses: number
  - avg_response_time_ms: number
  - std_response_time_ms: number
  - avg_time_per_word_ms: number
  - std_time_per_word_ms: number
  - avg_hesitation_index: number
  - std_hesitation_index: number
  - avg_pause_ratio: number
  - std_pause_ratio: number
  - avg_revision_ratio: number
  - std_revision_ratio: number
  - avg_semantic_similarity: number
  - avg_concept_coverage: number
  - avg_hedging_index: number
  - calculated_from_responses: number
  - last_calculated_at: string

## DDLAnalysisResponse
- Source: `apps/web/lib/ddl/types.ts:283-298`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - success: boolean

## DDLFullAnalysisResult
- Source: `apps/web/lib/ddl/types.ts:300-305`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - semantic: SemanticAnalysisResult
  - behavioral: BehavioralAnalysisResult
  - classification: ClassificationResult
  - feedbackId: string

## StudentProfile
- Source: `apps/web/lib/qgen/services/ddl-integration-service.ts:26-46`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - userId: string
  - currentTheta: number; // -4 to +4 IRT ability estimate

## DDLToQGenMapping
- Source: `apps/web/lib/qgen/services/ddl-integration-service.ts:71-76`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - config: Partial<QGenGenerationConfig>
  - distractorParams: DistractorSelectionParams
  - difficultyAdjustment: DifficultyAdjustment
  - rationale: string

## Database
- Source: `apps/web/lib/supabase/types.ts:18-1873`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## QuickViewContent
- Source: `apps/web/types/darwin-mfc-medical-data.d.ts:31-46`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - definicao: string
  - criteriosDiagnosticos: string[]
  - redFlags: string[]
  - metasTerapeuticas: string[]
  - examesIniciais: string[]

## TratamentoFarmacologico
- Source: `apps/web/types/darwin-mfc-medical-data.d.ts:48-54`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - classe: string
  - medicamentos: string[]
  - posologia: string
  - duracao: string
  - observacoes: string

## FullDoencaContent
- Source: `apps/web/types/darwin-mfc-medical-data.d.ts:56-105`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## Doenca
- Source: `apps/web/types/darwin-mfc-medical-data.d.ts:107-118`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - subtitulo: string
  - categoria: CategoriaDoenca
  - subcategoria: string
  - cid10: string[]
  - cid11: string[]
  - ciap2: string
  - quickView: QuickViewContent
  - fullContent: FullDoencaContent

## Medicamento
- Source: `apps/web/types/darwin-mfc-medical-data.d.ts:124-169`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - nomeGenerico: string
  - nomeComercial: string
  - codigoATC: string
  - classeTerapeutica: string
  - indicacoesPrincipais: string[]
  - ajusteHepatico: string
  - categoriaGestacao: string
  - monitoramento: string[]
  - apresentacoes: string[]
  - rename: boolean
  - disponivelSUS: boolean

## Command
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:36-72`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - subtitle: string
  - icon: LucideIcon
  - category: CommandCategory
  - keywords: string[]
  - action: () => void | Promise<void>
  - shortcut: string
  - priority: CommandPriority
  - enabled: boolean
  - href: string
  - meta: Record<string, unknown>

## CommandGroup
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:77-86`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - category: CommandCategory
  - label: string
  - commands: Command[]

## CommandSearchResult
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:95-108`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - command: Command
  - score: number

## CommandSearchOptions
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:113-125`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - query: string
  - limit: number
  - categories: CommandCategory[]
  - includeDisabled: boolean

## CommandPaletteState
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:134-152`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - isOpen: boolean
  - query: string
  - selectedIndex: number
  - isLoading: boolean
  - activeFilters: CommandCategory[]
  - history: string[]

## CommandPaletteContextValue
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:157-190`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - state: CommandPaletteState
  - open: () => void
  - close: () => void
  - toggle: () => void
  - setQuery: (query: string) => void
  - selectIndex: (index: number) => void
  - executeCommand: (command: Command) => void
  - registerCommand: (command: Command) => void
  - unregisterCommand: (id: string) => void
  - getCommands: () => Command[]
  - search: (options: CommandSearchOptions) => CommandSearchResult[]

## CommandPaletteProps
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:199-223`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - commands: Command[]
  - placeholder: string
  - showRecent: boolean
  - maxRecent: number
  - footer: React.ReactNode
  - onCommandExecute: (command: Command) => void
  - onOpen: () => void
  - onClose: () => void

## CommandInputProps
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:228-252`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - value: string
  - onChange: (value: string) => void
  - placeholder: string
  - isLoading: boolean
  - onEscape: () => void
  - onEnter: () => void
  - onArrowUp: () => void
  - onArrowDown: () => void

## CommandListProps
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:257-275`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - groups: CommandGroup[]
  - selectedIndex: number
  - onSelect: (command: Command) => void
  - onSelectionChange: (index: number) => void
  - emptyMessage: string
  - isLoading: boolean

## CommandGroupProps
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:280-295`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - label: string
  - commands: Command[]
  - startIndex: number
  - selectedIndex: number
  - onSelect: (command: Command) => void

## CommandItemProps
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:300-312`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - command: Command
  - isSelected: boolean
  - onClick: () => void
  - index: number

## CategoryConfig
- Source: `darwin-MFC/app/components/CommandPalette/types.ts:321-325`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - label: string
  - icon: LucideIcon
  - order: number

## APIFilter
- Source: `darwin-MFC/lib/api/types.ts:22-48`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - search: string; // Busca textual
  - category: string; // Categoria específica
  - ids: string[]; // Lista de IDs específicos
  - page: number
  - pageSize: number
  - sortBy: string
  - sortOrder: 'asc' | 'desc'
  - cid10: string
  - ciap2: string
  - doid: string
  - snomedCT: string
  - atcCode: string
  - rxNormCui: string
  - drugBankId: string
  - classe: string
  - subclasse: string

## APIRequestOptions
- Source: `darwin-MFC/lib/api/types.ts:101-105`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - filters: APIFilter
  - headers: Record<string, string>
  - signal: AbortSignal; // Para cancelamento

## SelectOption
- Source: `darwin-MFC/lib/calculators/types.ts:89-93`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - value: number
  - label: string
  - description: string

## InputValidation
- Source: `darwin-MFC/lib/calculators/types.ts:95-103`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - min: number
  - max: number
  - step: number
  - required: boolean
  - pattern: string
  - customValidator: (value: number) => boolean
  - errorMessage: string

## CalculatorInput
- Source: `darwin-MFC/lib/calculators/types.ts:105-151`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - label: string
  - labelKey: string
  - type: InputType
  - options: SelectOption[]
  - defaultValue: number
  - unit: string
  - description: string
  - descriptionKey: string
  - validation: InputValidation
  - required: boolean
  - group: string
  - weight: number

## ScoreInterpretation
- Source: `darwin-MFC/lib/calculators/types.ts:227-260`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - score: number
  - scoreDisplay: string
  - category: string
  - risk: RiskLevel
  - mortality: string
  - morbidity: string
  - recommendation: string
  - action: string
  - notes: string[]

## InterpretationRange
- Source: `darwin-MFC/lib/calculators/types.ts:262-266`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - min: number
  - max: number
  - interpretation: Omit<ScoreInterpretation, 'score' | 'scoreDisplay'>

## CalculatorCitation
- Source: `darwin-MFC/lib/calculators/types.ts:272-296`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - authors: string
  - title: string
  - journal: string
  - year: number
  - volume: string
  - doi: string
  - pmid: string
  - url: string

## ClinicalCalculator
- Source: `darwin-MFC/lib/calculators/types.ts:302-359`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - abbreviation: string
  - category: CalculatorCategory
  - description: string
  - purpose: string
  - indications: string[]
  - contraindications: string[]
  - inputs: CalculatorInput[]
  - calculate: (inputs: Record<string, number>) => number
  - interpret: (score: number, inputs?: Record<string, number>) => ScoreInterpretation
  - interpretationRanges: InterpretationRange[]
  - citations: CalculatorCitation[]
  - validationStudy: string
  - notes: string[]
  - relatedCalculators: string[]
  - snomedConcepts: string[]
  - version: string
  - lastUpdated: string

## CalculatorResult
- Source: `darwin-MFC/lib/calculators/types.ts:365-383`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - calculatorId: string
  - inputs: Record<string, number>
  - score: number
  - interpretation: ScoreInterpretation
  - timestamp: Date
  - warnings: string[]

## CalculatorState
- Source: `darwin-MFC/lib/calculators/types.ts:408-413`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - values: CalculatorInputValues
  - errors: CalculatorValidationErrors
  - isValid: boolean
  - isDirty: boolean

## CalculatorMetadata
- Source: `darwin-MFC/lib/calculators/types.ts:419-427`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - abbreviation: string
  - category: CalculatorCategory
  - description: string
  - inputCount: number
  - hasValidationStudy: boolean

## TranslationMeta
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:19-37`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - translatedAt: string
  - model: string
  - schemaVersion: string
  - wordCount: number
  - sourceLocale: 'pt'
  - targetLocale: SupportedLocale

## QuickViewTranslation
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:47-71`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - definicao: string
  - criteriosDiagnosticos: string[]
  - classificacaoRisco: RiscoInfoTranslation[]
  - redFlags: string[]
  - metasTerapeuticas: string[]
  - examesIniciais: string[]

## RiscoInfoTranslation
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:73-77`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nivel: 'baixo' | 'moderado' | 'alto' | 'muito_alto'
  - criterios: string[]
  - conduta: string

## FullContentTranslation
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:83-153`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## TratamentoFarmacologicoTranslation
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:155-160`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - classe: string
  - medicamentos: string[]; // Drug names kept as-is (INN)
  - posologia: string
  - observacoes: string

## DiseaseTranslation
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:166-193`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - sinonimos: string[]
  - categoria: CategoriaDoenca
  - subcategoria: string
  - quickView: QuickViewTranslation
  - fullContent: FullContentTranslation
  - tags: string[]
  - _meta: TranslationMeta

## CategoryTranslationFile
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:202-217`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - locale: SupportedLocale
  - category: CategoriaDoenca
  - generatedAt: string
  - count: number
  - diseases: DiseaseTranslation[]

## LocaleTranslationIndex
- Source: `darwin-MFC/lib/data/translations/diseases/schema.ts:226-246`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - locale: SupportedLocale
  - lastUpdated: string
  - totalDiseases: number
  - completionPercentage: number

## PosologiaTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:31-50`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - indicacao: string

## AjusteDoseRenalTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:56-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tfg: string; // Keep as-is (numeric range)
  - ajuste: string
  - observacao: string

## InteracaoTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:66-72`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicamento: string; // INN name (may be translated or kept)
  - gravidade: GravidadeInteracao; // Enum - not translated
  - efeito: string
  - mecanismo: string
  - conduta: string

## ApresentacaoTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:78-83`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - forma: string; // Pharmaceutical form name
  - concentracao: string; // Keep as-is (numeric)
  - quantidade: string
  - disponivelSUS: boolean; // Keep as-is

## EfeitosAdversosTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:89-92`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - comuns: string[]
  - graves: string[]

## AmamentacaoTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:98-101`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - compativel: boolean; // Keep as-is
  - observacao: string

## ConsideracoesEspeciaisTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:107-111`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - idosos: string
  - hepatopatas: string
  - pediatrico: string

## MedicationTranslation
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:117-175`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - nomeGenerico: string
  - classeTerapeutica: ClasseTerapeutica
  - apresentacoes: ApresentacaoTranslation[]
  - indicacoes: string[]
  - mecanismoAcao: string
  - posologias: PosologiaTranslation[]
  - contraindicacoes: string[]
  - precaucoes: string[]
  - efeitosAdversos: EfeitosAdversosTranslation
  - interacoes: InteracaoTranslation[]
  - ajusteDoseRenal: AjusteDoseRenalTranslation[]
  - amamentacao: AmamentacaoTranslation
  - consideracoesEspeciais: ConsideracoesEspeciaisTranslation
  - monitorizacao: string[]
  - orientacoesPaciente: string[]
  - tags: string[]
  - _meta: MedicationTranslationMeta

## MedicationTranslationMeta
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:181-205`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - translatedAt: string
  - model: string
  - schemaVersion: string
  - wordCount: number
  - sourceLocale: 'pt'
  - targetLocale: SupportedLocale
  - atcCode: string
  - innVerified: boolean

## ClassTranslationFile
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:215-233`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - locale: SupportedLocale
  - class: ClasseTerapeutica
  - classLabel: string
  - generatedAt: string
  - count: number
  - medications: MedicationTranslation[]

## MedicationLocaleIndex
- Source: `darwin-MFC/lib/data/translations/medications/schema.ts:242-265`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - locale: SupportedLocale
  - lastUpdated: string
  - totalMedications: number
  - completionPercentage: number
  - innVerifiedCount: number

## UserProfile
- Source: `darwin-MFC/lib/db/schemas.ts:33-47`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - username: string
  - email: string
  - locale: string
  - countryCode: string
  - isMentor: boolean
  - specialization: string
  - bio: string
  - avatarUrl: string
  - isActive: boolean
  - createdAt: string
  - updatedAt: string
  - lastSyncedAt: string

## ModuleProgress
- Source: `darwin-MFC/lib/db/schemas.ts:49-59`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // `${userId}_${learningPathId}_${moduleId}`
  - userId: string
  - learningPathId: string
  - moduleId: string
  - status: 'not_started' | 'in_progress' | 'completed'
  - score: number
  - completedAt: string
  - lastAccessedAt: string
  - syncStatus: SyncStatus

## FavoriteItem
- Source: `darwin-MFC/lib/db/schemas.ts:61-68`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // `${userId}_${itemType}_${itemId}`
  - userId: string
  - itemType: 'doenca' | 'medicamento' | 'protocolo' | 'rastreamento' | 'case' | 'post'
  - itemId: string
  - createdAt: string
  - syncStatus: SyncStatus

## UserNote
- Source: `darwin-MFC/lib/db/schemas.ts:70-79`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // `${userId}_${itemType}_${itemId}`
  - userId: string
  - itemType: 'doenca' | 'medicamento' | 'protocolo' | 'rastreamento' | 'case'
  - itemId: string
  - content: string
  - createdAt: string
  - updatedAt: string
  - syncStatus: SyncStatus

## SyncOperation
- Source: `darwin-MFC/lib/db/schemas.ts:81-93`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - userId: string
  - operation: 'create' | 'update' | 'delete'
  - store: string
  - recordId: string
  - payload: Record<string, unknown>
  - createdAt: string
  - attempts: number
  - lastAttempt: string
  - error: string
  - status: 'pending' | 'in_progress' | 'completed' | 'failed'

## CachedCase
- Source: `darwin-MFC/lib/db/schemas.ts:95-105`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - authorId: string
  - presentation: string
  - ageRange: string
  - diagnosisCodes: string[]
  - status: 'draft' | 'pending_review' | 'published' | 'archived'
  - createdAt: string
  - updatedAt: string
  - cachedAt: string

## CachedForumPost
- Source: `darwin-MFC/lib/db/schemas.ts:107-119`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - authorId: string
  - category: string
  - locale: string
  - title: string
  - content: string
  - isCase: boolean
  - replyCount: number
  - createdAt: string
  - updatedAt: string
  - cachedAt: string

## AuthTokens
- Source: `darwin-MFC/lib/db/schemas.ts:121-129`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // 'current'
  - accessToken: string
  - refreshToken: string
  - expiresAt: string
  - offlineValidUntil: string; // 7 days from last online auth
  - userId: string
  - encryptedAt: string

## OfflineData
- Source: `darwin-MFC/lib/db/schemas.ts:131-137`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - key: string
  - value: unknown
  - expiresAt: string
  - updatedAt: string

## StoreIndex
- Source: `darwin-MFC/lib/db/schemas.ts:145-149`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - name: string
  - keyPath: string | string[]
  - options: IDBIndexParameters

## StoreDefinition
- Source: `darwin-MFC/lib/db/schemas.ts:151-156`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - name: string
  - keyPath: string
  - autoIncrement: boolean
  - indexes: StoreIndex[]

## Migration
- Source: `darwin-MFC/lib/db/schemas.ts:249-252`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - version: number
  - migrate: (db: IDBDatabase, transaction: IDBTransaction) => void

## FHIRResource
- Source: `darwin-MFC/lib/fhir/types.ts:10-18`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - resourceType: string
  - id: string

## FHIRCoding
- Source: `darwin-MFC/lib/fhir/types.ts:23-29`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - system: string; // URI do sistema de código (ex: http://hl7.org/fhir/sid/icd-10)
  - version: string
  - code: string
  - display: string; // Texto legível
  - userSelected: boolean

## FHIRCodeableConcept
- Source: `darwin-MFC/lib/fhir/types.ts:34-37`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - coding: FHIRCoding[]
  - text: string; // Representação textual

## FHIRReference
- Source: `darwin-MFC/lib/fhir/types.ts:42-49`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - reference: string; // Ex: "Patient/123", "Condition/456"
  - display: string

## FHIRPeriod
- Source: `darwin-MFC/lib/fhir/types.ts:54-57`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - start: string; // ISO 8601
  - end: string; // ISO 8601

## FHIRQuantity
- Source: `darwin-MFC/lib/fhir/types.ts:62-67`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - value: number
  - unit: string
  - system: string; // URI do sistema de unidades
  - code: string; // Código da unidade

## FHIRRatio
- Source: `darwin-MFC/lib/fhir/types.ts:72-75`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - numerator: FHIRQuantity
  - denominator: FHIRQuantity

## GraphNode
- Source: `darwin-MFC/lib/graph/types.ts:36-66`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: NodeType
  - label: string

## GraphEdge
- Source: `darwin-MFC/lib/graph/types.ts:71-89`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - source: string; // Node ID
  - target: string; // Node ID
  - type: EdgeType
  - weight: number; // Strength of relationship (0-1)
  - label: string

## KnowledgeGraph
- Source: `darwin-MFC/lib/graph/types.ts:94-97`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodes: GraphNode[]
  - edges: GraphEdge[]

## GraphQueryResult
- Source: `darwin-MFC/lib/graph/types.ts:102-106`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodes: GraphNode[]
  - edges: GraphEdge[]
  - paths: GraphPath[]; // If query was for paths

## GraphPath
- Source: `darwin-MFC/lib/graph/types.ts:111-116`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodes: GraphNode[]
  - edges: GraphEdge[]
  - length: number
  - weight: number; // Total path weight

## LoincConcept
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:213-288`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - loincNum: string
  - component: string
  - property: LoincProperty
  - timeAspect: LoincTimeAspect
  - system: LoincSystem
  - scale: LoincScale
  - method: string
  - class: LoincClass
  - longCommonName: string
  - shortName: string
  - displayName: string
  - consumerName: string
  - status: LoincStatus
  - versionFirstReleased: string
  - versionLastChanged: string
  - relatedNames: string[]
  - externalCopyright: string
  - orderObs: 'Order' | 'Observation' | 'Both'
  - exampleUnits: string
  - exampleUcumUnits: string
  - rank: number
  - parts: LoincPart[]
  - panelMembers: LoincPanelMember[]
  - translations: Record<string, LoincTranslation>
  - answerList: LoincAnswerList

## LoincConceptMini
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:293-302`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - loincNum: string
  - longCommonName: string
  - shortName: string
  - component: string
  - system: string
  - class: string
  - status: LoincStatus
  - rank: number

## LoincPart
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:332-339`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - partNumber: string
  - partTypeName: LoincPartType
  - partName: string
  - partDisplayName: string
  - status: LoincStatus
  - snomedConceptId: string

## LoincPanelMember
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:348-355`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - parentLoincNum: string
  - loincNum: string
  - longCommonName: string
  - required: boolean
  - cardinality: string
  - displayOrder: number

## LoincPanel
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:360-366`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - loincNum: string
  - longCommonName: string
  - shortName: string
  - members: LoincPanelMember[]
  - panelType: 'ORDER' | 'OBSERVATION' | 'BOTH'

## LoincAnswer
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:375-380`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - answerCode: string
  - displayText: string
  - score: number
  - sequenceNumber: number

## LoincAnswerList
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:385-390`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - answerListId: string
  - answerListName: string
  - answerListType: 'NORMATIVE' | 'PREFERRED' | 'EXAMPLE'
  - answers: LoincAnswer[]

## LoincTranslation
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:399-406`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - languageCode: string
  - longCommonName: string
  - shortName: string
  - component: string
  - system: string
  - consumerName: string

## LoincGroup
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:425-432`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - groupId: string
  - parentGroupId: string
  - type: LoincGroupType
  - name: string
  - description: string
  - loincCodes: string[]

## LoincHierarchyNode
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:441-449`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string
  - name: string
  - level: number
  - parent: string
  - children: string[]
  - isLeaf: boolean
  - conceptCount: number

## LoincMultiAxialHierarchy
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:454-459`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - components: LoincHierarchyNode[]
  - systems: LoincHierarchyNode[]
  - classes: LoincHierarchyNode[]
  - methods: LoincHierarchyNode[]

## LoincSearchParams
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:468-504`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - query: string
  - class: LoincClass | LoincClass[]
  - system: LoincSystem | LoincSystem[]
  - property: LoincProperty | LoincProperty[]
  - scale: LoincScale | LoincScale[]
  - status: LoincStatus[]
  - includePanels: boolean
  - orderObs: 'Order' | 'Observation' | 'Both'
  - language: string
  - limit: number
  - offset: number
  - includeDeprecated: boolean

## LoincSearchResult
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:509-514`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: LoincConceptMini
  - score: number
  - matchedOn: 'name' | 'code' | 'synonym' | 'component'
  - highlight: string

## LoincSearchResponse
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:519-527`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - results: LoincSearchResult[]
  - total: number
  - offset: number
  - limit: number
  - query: string
  - executionTimeMs: number
  - facets: LoincSearchFacets

## LoincSearchFacets
- Source: `darwin-MFC/lib/ontology/types/loinc.ts:532-537`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - classes: Array<{ value: LoincClass; count: number }>
  - systems: Array<{ value: string; count: number }>
  - scales: Array<{ value: LoincScale; count: number }>
  - status: Array<{ value: LoincStatus; count: number }>

## OntologySystemInfo
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:41-48`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: OntologySystem
  - name: string
  - version: string
  - url: string
  - description: string
  - apiAvailable: boolean

## OntologyIdentifier
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:171-183`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - system: OntologySystem
  - code: string
  - display: string
  - version: string

## Concept
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:209-242`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - identifier: OntologyIdentifier
  - equivalentIdentifiers: OntologyIdentifier[]
  - preferredTerm: string
  - labels: Record<string, string>
  - synonyms: string[]
  - definition: string
  - relationships: ConceptRelationship[]
  - semanticType: SemanticType
  - status: ConceptStatus
  - lastModified: string

## ConceptRelationship
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:281-302`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: RelationshipType
  - targetId: string
  - targetDisplay: string
  - targetSystem: OntologySystem
  - confidence: number
  - source: 'asserted' | 'inferred' | 'mapped'
  - attributes: Record<string, string>

## ConceptSearchParams
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:344-374`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - query: string
  - systems: OntologySystem[]
  - semanticTypes: SemanticType[]
  - status: ConceptStatus[]
  - language: string
  - limit: number
  - offset: number
  - includeInactive: boolean
  - includeSynonyms: boolean
  - fuzzy: boolean

## ConceptSearchResult
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:379-384`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: Concept
  - score: number
  - matchedOn: 'preferred' | 'synonym' | 'code' | 'definition'
  - highlight: string

## ConceptSearchResponse
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:389-396`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - results: ConceptSearchResult[]
  - total: number
  - offset: number
  - limit: number
  - query: string
  - executionTimeMs: number

## HierarchyNode
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:405-412`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: Concept
  - children: HierarchyNode[]
  - parent: HierarchyNode
  - depth: number
  - isLeaf: boolean
  - childCount: number

## ConceptPath
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:417-420`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concepts: Concept[]
  - relationships: ConceptRelationship[]

## OntologyMapping
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:439-460`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - source: OntologyIdentifier
  - target: OntologyIdentifier
  - confidence: MappingConfidence
  - score: number
  - mappingSource: 'umls' | 'manual' | 'inferred' | 'external'
  - validated: boolean
  - notes: string

## ExpansionOptions
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:474-489`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - direction: ExpansionDirection
  - maxDepth: number
  - relationshipTypes: RelationshipType[]
  - includeMappings: boolean
  - mappingSystems: OntologySystem[]

## ExpansionResult
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:494-507`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - source: Concept
  - total: number

## CodeSuggestion
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:516-521`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - identifier: OntologyIdentifier
  - confidence: number
  - matchType: 'exact' | 'partial' | 'semantic'
  - context: string

## CodingResult
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:526-538`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - text: string
  - suggestions: CodeSuggestion[]
  - entities: ExtractedEntity[]
  - processingTimeMs: number

## ExtractedEntity
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:543-550`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - text: string
  - start: number
  - end: number
  - type: SemanticType
  - concept: Concept
  - confidence: number

## ValidationResult
- Source: `darwin-MFC/lib/ontology/types/ontology.ts:559-565`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - identifier: OntologyIdentifier
  - isValid: boolean
  - status: ConceptStatus
  - message: string
  - suggestions: OntologyIdentifier[]

## SnomedEditionInfo
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:42-48`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - shortName: string
  - title: string
  - branchPath: string
  - defaultLanguageCode: string
  - effectiveTime: string

## SnomedConcept
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:143-188`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - conceptId: string
  - active: boolean
  - definitionStatus: SnomedDefinitionStatus
  - moduleId: string
  - effectiveTime: string
  - descriptions: SnomedDescription[]
  - relationships: SnomedRelationship[]
  - parents: SnomedConceptMini[]
  - children: SnomedConceptMini[]
  - ancestors: SnomedConceptMini[]
  - semanticTag: string

## SnomedConceptMini
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:193-205`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - conceptId: string
  - active: boolean
  - definitionStatus: SnomedDefinitionStatus

## SnomedDescription
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:224-234`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - descriptionId: string
  - active: boolean
  - term: string
  - lang: string
  - type: SnomedDescriptionType
  - caseSignificance: 'CASE_INSENSITIVE' | 'INITIAL_CASE_INSENSITIVE' | 'CASE_SENSITIVE'
  - acceptabilityMap: Record<string, SnomedAcceptability>
  - moduleId: string
  - effectiveTime: string

## SnomedRelationship
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:273-285`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - relationshipId: string
  - active: boolean
  - sourceId: string
  - destinationId: string
  - typeId: string
  - type: SnomedConceptMini
  - target: SnomedConceptMini
  - groupId: number
  - characteristicType: SnomedCharacteristicType
  - moduleId: string
  - effectiveTime: string

## ECLQuery
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:316-325`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - expression: string
  - description: string
  - expectedCount: number

## SnomedConceptSimple
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:441-450`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - conceptId: string
  - active: boolean
  - definitionStatus: SnomedDefinitionStatus
  - moduleId: string
  - effectiveTime: string
  - fsn: string
  - pt: string
  - id: string

## SnomedRelationshipSimple
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:463-473`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - relationshipId: string
  - active: boolean
  - sourceId: string
  - destinationId: string
  - typeId: string
  - typePt: string
  - targetPt: string
  - characteristicTypeId: string
  - relationshipGroup: number

## SnomedSearchResult
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:478-484`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept: SnomedConceptSimple
  - score: number
  - term: string
  - active: boolean
  - fsn: string

## SnomedSearchResponse
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:489-496`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - items: SnomedSearchResult[]
  - total: number
  - limit: number
  - offset: number
  - searchAfter: string
  - searchAfterArray: string[]

## SnomedHierarchyResult
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:501-506`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - sourceConcept: string
  - ancestors: Array<{ concept: SnomedConceptSimple; depth: number }>
  - descendants: Array<{ concept: SnomedConceptSimple; depth: number }>
  - total: number

## SnomedSearchParams
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:515-552`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - term: string
  - branch: string
  - activeFilter: boolean
  - semanticTag: string
  - language: string[]
  - preferredIn: string
  - acceptableIn: string
  - conceptIds: string[]
  - ecl: string
  - limit: number
  - offset: number
  - searchMode: 'STANDARD' | 'REGEX' | 'WHOLE_WORD'
  - includeDescendants: boolean

## ECLResponse
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:557-562`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - items: SnomedConceptMini[]
  - total: number
  - limit: number
  - offset: number

## RefsetMember
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:586-594`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - memberId: string
  - active: boolean
  - moduleId: string
  - refsetId: string
  - referencedComponentId: string
  - additionalFields: Record<string, string>
  - effectiveTime: string

## SimilarityResult
- Source: `darwin-MFC/lib/ontology/types/snomed-ct.ts:613-619`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concept1: SnomedConceptMini
  - concept2: SnomedConceptMini
  - similarity: number
  - method: SimilarityMethod
  - commonAncestor: SnomedConceptMini

## Database
- Source: `darwin-MFC/lib/supabase/types.ts:17-632`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## ChatMessage
- Source: `darwin-MFC/lib/types/ai.ts:19-27`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - role: ChatRole
  - content: string
  - timestamp: string
  - status: MessageStatus
  - citations: ChatCitation[]
  - suggestedActions: SuggestedAction[]

## ChatCitation
- Source: `darwin-MFC/lib/types/ai.ts:32-38`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: 'disease' | 'medication' | 'protocol' | 'reference'
  - title: string
  - url: string
  - snippet: string

## SuggestedAction
- Source: `darwin-MFC/lib/types/ai.ts:43-49`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: 'navigate' | 'search' | 'learn' | 'calculate'
  - label: string
  - icon: string
  - action: string; // URL or search query

## ChatContext
- Source: `darwin-MFC/lib/types/ai.ts:54-62`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - currentPage: string
  - currentDiseaseId: string
  - currentMedicationId: string
  - currentProtocolId: string
  - recentSearches: string[]
  - userLevel: number
  - locale: string

## SuggestedPrompt
- Source: `darwin-MFC/lib/types/ai.ts:67-75`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - category: PromptCategory
  - prompt: string
  - promptKey: string; // i18n key
  - icon: string
  - contextual: boolean; // Only show in specific contexts
  - contextTypes: ('disease' | 'medication' | 'protocol' | 'learning')[]

## AIChatState
- Source: `darwin-MFC/lib/types/ai.ts:93-99`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - isOpen: boolean
  - messages: ChatMessage[]
  - isLoading: boolean
  - context: ChatContext
  - suggestedPrompts: SuggestedPrompt[]

## SmartSuggestion
- Source: `darwin-MFC/lib/types/ai.ts:104-115`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: 'correction' | 'related' | 'trending' | 'recent' | 'autocomplete'
  - text: string
  - displayText: string
  - score: number

## EnhancedSearchResult
- Source: `darwin-MFC/lib/types/ai.ts:120-125`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - suggestions: SmartSuggestion[]
  - didYouMean: string
  - relatedTopics: string[]
  - trendingSearches: string[]

## MedicalInsight
- Source: `darwin-MFC/lib/types/analysis-medical.ts:15-24`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - content: string
  - type: 'first_order' | 'second_order' | 'third_order'
  - citations: Citation[]
  - practicalExample: string;  // Exemplo prático da UBS
  - keyTakeaway: string;        // Mensagem-chave didática
  - evidenceLevel: 'A' | 'B' | 'C' | 'D';  // Nível de evidência

## MedicalControversy
- Source: `darwin-MFC/lib/types/analysis-medical.ts:29-37`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - description: string
  - stakeholders: string[];  // Ex: ['MS', 'SBMFC', 'SBC', 'CONITEC']
  - citations: Citation[]
  - realWorldScenario: string;  // Cenário real da UBS
  - currentConsensus: string;    // Consenso atual (se houver)

## OperationalChallenge
- Source: `darwin-MFC/lib/types/analysis-medical.ts:42-50`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - description: string
  - category: 'operational' | 'financial' | 'equity' | 'training' | 'infrastructure'
  - severity: 'low' | 'medium' | 'high' | 'critical'
  - citations: Citation[]
  - potentialSolutions: string[];  // Soluções potenciais

## DiseaseCriticalAnalysis
- Source: `darwin-MFC/lib/types/analysis-medical.ts:55-65`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - diseaseId: string;  // ID da doença
  - context: string;    // Contexto histórico/epidemiológico
  - paradigmShift: boolean;  // Se houve mudança de paradigma recente
  - insights: MedicalInsight[]
  - controversies: MedicalControversy[]
  - operationalChallenges: OperationalChallenge[]
  - systemicImplications: string;  // Implicações sistêmicas
  - didacticIntro: string;  // Introdução didática
  - lastUpdate: string;  // Data da última atualização

## MedicationCriticalAnalysis
- Source: `darwin-MFC/lib/types/analysis-medical.ts:70-80`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicationId: string;  // ID do medicamento
  - context: string;       // Contexto histórico/farmacológico
  - paradigmShift: boolean;  // Se houve mudança de paradigma recente
  - insights: MedicalInsight[]
  - controversies: MedicalControversy[]
  - operationalChallenges: OperationalChallenge[]
  - systemicImplications: string;  // Implicações sistêmicas
  - didacticIntro: string;  // Introdução didática
  - lastUpdate: string;  // Data da última atualização

## Insight
- Source: `darwin-MFC/lib/types/analysis.ts:3-10`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: 'segunda_ordem' | 'terceira_ordem'
  - title: string
  - description: string
  - implication: string; // Implicação prática/sistêmica
  - citations: Citation[]

## Controversy
- Source: `darwin-MFC/lib/types/analysis.ts:12-26`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - topic: string
  - synthesis: string; // Síntese ou status atual (quem venceu/empate)

## CriticalAnalysis
- Source: `darwin-MFC/lib/types/analysis.ts:28-41`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - rastreamentoId: string; // Link com o rastreamento descritivo
  - context: string; // Contexto histórico/político (ex: "Ano da Ruptura Epistemológica")
  - paradigmShift: boolean; // Se houve mudança de paradigma em 2025
  - insights: Insight[]
  - controversies: Controversy[]
  - conclusion: string

## CasoClinico
- Source: `darwin-MFC/lib/types/caso-clinico.ts:6-33`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - subtitulo: string
  - categoria: CategoriaCaso
  - dificuldade: 'iniciante' | 'intermediario' | 'avancado'
  - tempoEstimado: number; // em minutos
  - autor: string
  - ultimaAtualizacao: string
  - apresentacao: ApresentacaoCaso
  - etapas: EtapaCaso[]
  - desfecho: DesfechoCaso
  - objetivosAprendizagem: string[]
  - competencias: string[]
  - doencasRelacionadas: string[]
  - medicamentosRelacionados: string[]
  - calculadorasRelacionadas: string[]
  - referencias: string[]
  - tags: string[]

## ApresentacaoCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:49-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - queixaPrincipal: string
  - historiaDoencaAtual: string
  - imagemPaciente: string; // URL opcional para imagem ilustrativa

## EtapaCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:62-69`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - tipo: TipoEtapa
  - conteudo: ConteudoEtapa
  - pergunta: PerguntaCaso
  - feedback: FeedbackEtapa

## ConteudoEtapa
- Source: `darwin-MFC/lib/types/caso-clinico.ts:80-85`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - texto: string
  - dados: Record<string, string | number>; // Dados estruturados (sinais vitais, labs, etc.)
  - imagens: ImagemCaso[]
  - dicas: string[]

## ImagemCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:87-91`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - url: string
  - legenda: string
  - tipo: 'ecg' | 'raio_x' | 'tc' | 'rm' | 'lab' | 'foto' | 'outro'

## PerguntaCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:93-100`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - enunciado: string
  - tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'ordenacao' | 'dissertativa'
  - opcoes: OpcaoResposta[]
  - respostaCorreta: string | string[]
  - explicacao: string
  - pontos: number

## OpcaoResposta
- Source: `darwin-MFC/lib/types/caso-clinico.ts:102-106`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - texto: string
  - correta: boolean

## FeedbackEtapa
- Source: `darwin-MFC/lib/types/caso-clinico.ts:108-112`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - correto: string
  - incorreto: string
  - parcial: string

## DesfechoCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:114-122`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - resumo: string
  - diagnosticoFinal: string
  - tratamentoRealizado: string
  - evolucao: string
  - licoesPrincipais: string[]
  - errosComuns: string[]
  - proximosPassos: string[]

## ProgressoCaso
- Source: `darwin-MFC/lib/types/caso-clinico.ts:125-134`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - casoId: string
  - usuarioId: string
  - etapaAtual: number
  - respostas: RespostaUsuario[]
  - pontuacao: number
  - iniciado: Date
  - finalizado: Date
  - status: 'em_andamento' | 'completo' | 'abandonado'

## RespostaUsuario
- Source: `darwin-MFC/lib/types/caso-clinico.ts:136-141`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - etapaId: string
  - resposta: string | string[]
  - correta: boolean
  - timestamp: Date

## ChecklistItem
- Source: `darwin-MFC/lib/types/checklist.ts:14-22`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - descricao: string
  - categoria: ChecklistCategoria
  - obrigatorio: boolean
  - ordem: number
  - subitens: ChecklistItem[]

## ChecklistConsulta
- Source: `darwin-MFC/lib/types/checklist.ts:38-47`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - doencaId: string
  - titulo: string
  - descricao: string
  - itens: ChecklistItem[]
  - versao: string
  - lastUpdate: string
  - citations: Citation[]

## ChecklistProgress
- Source: `darwin-MFC/lib/types/checklist.ts:53-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - checklistId: string
  - consultaId: string; // ID único da consulta específica
  - itensCompletados: Set<string> | string[]; // IDs dos itens marcados (Set ou Array)
  - observacoes: Record<string, string>; // Observações por item
  - dataPreenchimento: Date
  - preenchidoPor: string

## ChecklistResposta
- Source: `darwin-MFC/lib/types/checklist.ts:66-71`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - completado: boolean
  - observacao: string
  - timestamp: Date

## CIAP2ChapterInfo
- Source: `darwin-MFC/lib/types/ciap2.ts:38-48`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: CIAP2Chapter
  - nome: string
  - nomeCompleto: string
  - descricao: string
  - icon: string
  - color: string
  - gradient: string
  - exemplos: string[]
  - estimatedCount: number

## CIAP2Code
- Source: `darwin-MFC/lib/types/ciap2.ts:244-250`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string
  - chapter: CIAP2Chapter
  - title: string
  - component: CIAP2Component
  - relatedCID10: string[]

## CommunityUser
- Source: `darwin-MFC/lib/types/community.ts:13-29`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - username: string
  - displayName: string
  - avatarUrl: string
  - locale: string
  - countryCode: string
  - specialization: Specialization
  - experienceLevel: ExperienceLevel
  - isMentor: boolean
  - isVerified: boolean
  - joinedAt: string
  - postCount: number
  - replyCount: number
  - reputation: number
  - badges: Badge[]

## Badge
- Source: `darwin-MFC/lib/types/community.ts:50-56`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: BadgeType
  - name: string
  - description: string
  - earnedAt: string

## ForumCategory
- Source: `darwin-MFC/lib/types/community.ts:70-79`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - nameKey: string; // i18n key
  - descriptionKey: string
  - icon: string
  - color: string
  - postCount: number
  - isRestricted: boolean
  - order: number

## ForumPost
- Source: `darwin-MFC/lib/types/community.ts:124-143`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - authorId: string
  - author: CommunityUser
  - categoryId: string
  - locale: string
  - title: string
  - content: string; // Markdown
  - tags: string[]
  - isCase: boolean; // Clinical case discussion
  - isPinned: boolean
  - isLocked: boolean
  - viewCount: number
  - replyCount: number
  - upvoteCount: number
  - createdAt: string
  - updatedAt: string
  - lastReplyAt: string
  - lastReplyBy: CommunityUser

## ForumReply
- Source: `darwin-MFC/lib/types/community.ts:145-156`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - postId: string
  - authorId: string
  - author: CommunityUser
  - content: string; // Markdown
  - isAccepted: boolean; // Marked as best answer
  - upvoteCount: number
  - createdAt: string
  - updatedAt: string
  - parentReplyId: string; // For nested replies

## ClinicalCaseData
- Source: `darwin-MFC/lib/types/community.ts:168-187`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - ageRange: AgeRange
  - sex: 'M' | 'F' | 'other'
  - occupation: string; // General category only
  - presentation: string; // Chief complaint (anonymized)
  - history: string; // Relevant history (anonymized)
  - physicalExam: string
  - labResults: string
  - imaging: string
  - diagnosisCodes: string[]
  - type: CaseType
  - difficulty: 'straightforward' | 'moderate' | 'complex'

## MentorReview
- Source: `darwin-MFC/lib/types/community.ts:237-243`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - menteeId: string
  - rating: 1 | 2 | 3 | 4 | 5
  - comment: string
  - createdAt: string

## MentorshipRequest
- Source: `darwin-MFC/lib/types/community.ts:245-254`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - mentorId: string
  - menteeId: string
  - message: string
  - status: MentorshipStatus
  - specialization: Specialization
  - createdAt: string
  - respondedAt: string

## Mentorship
- Source: `darwin-MFC/lib/types/community.ts:263-275`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - mentorId: string
  - mentor: MentorProfile
  - menteeId: string
  - mentee: CommunityUser
  - status: 'active' | 'paused' | 'completed'
  - specialization: Specialization
  - startedAt: string
  - lastActivityAt: string
  - completedAt: string
  - messageCount: number

## MentorshipMessage
- Source: `darwin-MFC/lib/types/community.ts:277-284`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - mentorshipId: string
  - senderId: string
  - content: string
  - isRead: boolean
  - createdAt: string

## ModerationAction
- Source: `darwin-MFC/lib/types/community.ts:290-299`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - targetType: 'post' | 'reply' | 'user'
  - targetId: string
  - action: ModerationType
  - moderatorId: string
  - reason: string
  - createdAt: string
  - expiresAt: string

## Report
- Source: `darwin-MFC/lib/types/community.ts:310-321`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - reporterId: string
  - targetType: 'post' | 'reply' | 'user'
  - targetId: string
  - reason: ReportReason
  - details: string
  - status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  - createdAt: string
  - resolvedAt: string
  - resolvedBy: string

## PostSummary
- Source: `darwin-MFC/lib/types/community.ts:335-345`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - excerpt: string
  - author: Pick<CommunityUser, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  - categoryId: string
  - isCase: boolean
  - replyCount: number
  - viewCount: number
  - lastActivity: string

## ThreadView
- Source: `darwin-MFC/lib/types/community.ts:347-351`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - post: ForumPost
  - replies: ForumReply[]
  - relatedPosts: PostSummary[]

## QuickAction
- Source: `darwin-MFC/lib/types/cross-references.ts:17-22`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - tipo: QuickActionTipo
  - titulo: string
  - conteudo: string

## MedicamentoReference
- Source: `darwin-MFC/lib/types/cross-references.ts:24-31`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicamentoId: string
  - nomeGenerico: string
  - tipoUso: 'primeira_linha' | 'segunda_linha' | 'alternativa' | 'adjuvante'
  - posologiaResumida: string
  - indicacaoEspecifica: string
  - disponivelSUS: boolean

## ProtocoloReference
- Source: `darwin-MFC/lib/types/cross-references.ts:33-38`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - protocoloId: string
  - titulo: string
  - tipoProtocolo: string
  - descricaoBreve: string

## CalculadoraReference
- Source: `darwin-MFC/lib/types/cross-references.ts:40-45`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - calculadoraId: string
  - nome: string
  - descricaoBreve: string
  - prioritaria: boolean

## RastreamentoReference
- Source: `darwin-MFC/lib/types/cross-references.ts:47-51`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - rastreamentoId: string
  - titulo: string
  - populacaoAlvo: string

## ContextualSuggestion
- Source: `darwin-MFC/lib/types/cross-references.ts:53-59`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tipo: 'calculadora' | 'protocolo' | 'rastreamento' | 'medicamento' | 'doenca'
  - id: string
  - titulo: string
  - motivo: string
  - prioridade: 'alta' | 'media' | 'baixa'

## CrossReferenceBundle
- Source: `darwin-MFC/lib/types/cross-references.ts:61-68`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicamentos: MedicamentoReference[]
  - protocolos: ProtocoloReference[]
  - calculadoras: CalculadoraReference[]
  - rastreamentos: RastreamentoReference[]
  - quickActions: QuickAction[]
  - suggestions: ContextualSuggestion[]

## RiscoInfo
- Source: `darwin-MFC/lib/types/doenca.ts:63-67`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nivel: ClassificacaoRisco
  - criterios: string[]
  - conduta: string

## QuickViewContent
- Source: `darwin-MFC/lib/types/doenca.ts:73-97`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - definicao: string
  - criteriosDiagnosticos: string[]
  - classificacaoRisco: RiscoInfo[]
  - redFlags: string[]
  - metasTerapeuticas: string[]
  - examesIniciais: string[]

## FullDoencaContent
- Source: `darwin-MFC/lib/types/doenca.ts:103-181`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## TratamentoFarmacologico
- Source: `darwin-MFC/lib/types/doenca.ts:183-188`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - classe: string
  - medicamentos: string[]
  - posologia: string
  - observacoes: string

## Doenca
- Source: `darwin-MFC/lib/types/doenca.ts:194-293`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - sinonimos: string[]
  - doid: string
  - snomedCT: string
  - meshId: string
  - umlsCui: string
  - ordoId: string
  - ciap2: string[]
  - cid10: string[]
  - cid11: string[]
  - hpo: string[]
  - loinc: string[]
  - ordo: string[]
  - categoria: CategoriaDoenca
  - subcategoria: string
  - quickView: QuickViewContent
  - fullContent: FullDoencaContent
  - protocolos: string[]
  - medicamentos: string[]
  - calculadoras: string[]
  - rastreamentos: string[]
  - citations: Citation[]
  - lastUpdate: string
  - tags: string[]

## DoencaSearchResult
- Source: `darwin-MFC/lib/types/doenca.ts:299-303`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - doenca: Doenca
  - matchType: 'nome' | 'sinonimo' | 'ciap2' | 'cid10' | 'tag'
  - score: number

## DoencasByCategoria
- Source: `darwin-MFC/lib/types/doenca.ts:305-310`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - categoria: CategoriaDoenca
  - label: string
  - doencas: Doenca[]
  - count: number

## DSM5Code
- Source: `darwin-MFC/lib/types/dsm5.ts:37-41`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string; // Ex: "296.33", "F32.1"
  - text: string; // Descrição completa
  - specifiers: string[]; // Especificadores (severity, episode type, etc.)

## DSM5Criterion
- Source: `darwin-MFC/lib/types/dsm5.ts:46-51`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - letter: string; // A, B, C, etc.
  - text: string; // Texto do critério
  - required: boolean; // Se é obrigatório
  - subCriteria: DSM5Criterion[]; // Subcritérios

## DSM5DiagnosticCriteria
- Source: `darwin-MFC/lib/types/dsm5.ts:56-69`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string
  - name: string
  - category: DSM5Category
  - criteria: DSM5Criterion[]
  - notes: string
  - exclusions: string[]; // Códigos que devem ser excluídos

## ICD10ToDSM5Mapping
- Source: `darwin-MFC/lib/types/dsm5.ts:74-80`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - icd10Code: string
  - icd10Text: string
  - dsm5Code: string
  - dsm5Text: string
  - matchType: 'exact' | 'approximate' | 'related'

## EvidenceQuality
- Source: `darwin-MFC/lib/types/evidence.ts:46-55`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - score: number; // 0-10

## CitationWithEvidence
- Source: `darwin-MFC/lib/types/evidence.ts:60-70`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - refId: string
  - evidenceLevel: EvidenceLevel
  - studyType: StudyType
  - qualityScore: number
  - quality: EvidenceQuality
  - limitations: string[]
  - conflictsOfInterest: string
  - page: string
  - note: string

## HighYieldContent
- Source: `darwin-MFC/lib/types/evidence.ts:94-98`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - isHighYield: boolean
  - category: HighYieldCategory
  - priority: 1 | 2 | 3; // 1 = highest priority

## GradeEvidenceConfig
- Source: `darwin-MFC/lib/types/evidence.ts:103-112`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - level: GradeEvidenceLevel
  - label: string
  - labelKey: string
  - description: string
  - descriptionKey: string
  - color: string
  - bgColor: string
  - borderColor: string

## Badge
- Source: `darwin-MFC/lib/types/gamification.ts:24-36`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - nameKey: string; // i18n key
  - description: string
  - descriptionKey: string; // i18n key
  - icon: string; // Lucide icon name or emoji
  - category: BadgeCategory
  - rarity: BadgeRarity
  - xpReward: number
  - criteria: BadgeCriteria
  - secret: boolean; // Hidden until earned

## BadgeCriteria
- Source: `darwin-MFC/lib/types/gamification.ts:41-45`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: BadgeCriteriaType
  - target: number
  - condition: string; // Additional conditions

## EarnedBadge
- Source: `darwin-MFC/lib/types/gamification.ts:67-71`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - badgeId: string
  - earnedAt: string; // ISO date
  - progress: number; // Progress percentage when earned (for display)

## BadgeProgress
- Source: `darwin-MFC/lib/types/gamification.ts:76-82`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - badgeId: string
  - currentValue: number
  - targetValue: number
  - percentage: number
  - lastUpdated: string

## XPTransaction
- Source: `darwin-MFC/lib/types/gamification.ts:101-108`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: XPTransactionType
  - amount: number
  - timestamp: string
  - description: string
  - relatedId: string; // Related module/path/badge ID

## UserLevel
- Source: `darwin-MFC/lib/types/gamification.ts:113-120`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - level: number
  - title: string
  - titleKey: string; // i18n key
  - minXP: number
  - maxXP: number
  - icon: string

## AchievementNotification
- Source: `darwin-MFC/lib/types/gamification.ts:125-134`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: 'badge' | 'level_up' | 'streak' | 'milestone'
  - title: string
  - description: string
  - icon: string
  - xpEarned: number
  - timestamp: string
  - dismissed: boolean

## DailyChallenge
- Source: `darwin-MFC/lib/types/gamification.ts:139-152`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - date: string; // YYYY-MM-DD
  - type: 'quiz' | 'flashcard' | 'reading' | 'mixed'
  - title: string
  - titleKey: string
  - description: string
  - descriptionKey: string
  - xpReward: number
  - target: number
  - progress: number
  - completed: boolean
  - expiresAt: string

## GamificationStats
- Source: `darwin-MFC/lib/types/gamification.ts:157-168`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalXP: number
  - currentLevel: number
  - badgesEarned: number
  - longestStreak: number
  - currentStreak: number
  - totalTimeMinutes: number
  - quizzesCompleted: number
  - perfectQuizzes: number
  - modulesCompleted: number
  - pathsCompleted: number

## LeaderboardEntry
- Source: `darwin-MFC/lib/types/gamification.ts:173-182`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - rank: number
  - userId: string
  - displayName: string
  - avatarUrl: string
  - xp: number
  - level: number
  - badgeCount: number
  - isCurrentUser: boolean

## GamificationState
- Source: `darwin-MFC/lib/types/gamification.ts:187-219`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalXP: number
  - currentLevel: number
  - xpHistory: XPTransaction[]
  - earnedBadges: EarnedBadge[]
  - badgeProgress: Record<string, BadgeProgress>
  - currentStreak: number
  - longestStreak: number
  - lastActivityDate: string | null
  - dailyChallenges: DailyChallenge[]
  - pendingNotifications: AchievementNotification[]

## AppState
- Source: `darwin-MFC/lib/types/index.ts:48-57`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theme: Theme
  - contentMode: ContentMode
  - viewMode: import('./evidence').ViewMode; // full | high_yield | print_friendly
  - favorites: string[]; // IDs dos rastreamentos favoritos
  - favoritosDoencas: string[]; // IDs das doenças favoritas
  - favoritosMedicamentos: string[]; // IDs dos medicamentos favoritos
  - favoritosProtocolos: string[]; // IDs dos protocolos favoritos
  - notes: Record<string, string>; // { itemId: nota }

## LearningPath
- Source: `darwin-MFC/lib/types/learning.ts:13-30`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titleKey: string; // i18n key
  - descriptionKey: string
  - icon: string; // Lucide icon name
  - color: string; // Tailwind color class
  - category: LearningCategory
  - difficulty: Difficulty
  - estimatedHours: number
  - modules: LearningModule[]
  - prerequisites: string[]; // Other learning path IDs
  - certification: CertificationConfig
  - tags: string[]
  - isPublished: boolean
  - version: string
  - createdAt: string
  - updatedAt: string

## LearningModule
- Source: `darwin-MFC/lib/types/learning.ts:49-59`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titleKey: string
  - descriptionKey: string
  - type: ModuleType
  - order: number
  - estimatedMinutes: number
  - content: ModuleContent
  - prerequisites: string[]; // Module IDs within the path
  - passingScore: number; // For quiz modules (0-100)

## ContentModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:77-83`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'content'
  - contentRef: string; // Reference to disease/protocol/medication ID (optional for custom content)
  - contentType: 'disease' | 'protocol' | 'medication' | 'custom'
  - sections: string[]; // Specific sections to show
  - customContent: string; // Custom markdown content

## VideoModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:85-91`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'video'
  - videoUrl: string
  - duration: number; // seconds
  - transcript: string
  - markers: VideoMarker[]

## VideoMarker
- Source: `darwin-MFC/lib/types/learning.ts:93-96`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - time: number
  - titleKey: string

## QuizModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:98-106`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'quiz'
  - questions: QuizQuestion[]
  - shuffleQuestions: boolean
  - shuffleOptions: boolean
  - showFeedback: boolean
  - allowRetry: boolean
  - maxAttempts: number

## QuizQuestion
- Source: `darwin-MFC/lib/types/learning.ts:108-117`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - questionKey: string; // i18n key or markdown
  - type: 'single' | 'multiple' | 'true_false' | 'matching'
  - options: QuizOption[]
  - explanationKey: string
  - difficulty: Difficulty
  - points: number
  - tags: string[]

## QuizOption
- Source: `darwin-MFC/lib/types/learning.ts:119-124`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - textKey: string
  - isCorrect: boolean
  - feedbackKey: string

## CaseStudyModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:126-129`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'case_study'
  - case: ClinicalCaseStudy

## ClinicalCaseStudy
- Source: `darwin-MFC/lib/types/learning.ts:131-142`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - presentationKey: string; // Initial presentation
  - stages: CaseStage[]
  - learningObjectives: string[]
  - relatedDiseases: string[]

## CaseStage
- Source: `darwin-MFC/lib/types/learning.ts:144-150`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titleKey: string
  - contentKey: string
  - decision: CaseDecision
  - feedback: string

## CaseDecision
- Source: `darwin-MFC/lib/types/learning.ts:152-155`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionKey: string
  - options: CaseDecisionOption[]

## CaseDecisionOption
- Source: `darwin-MFC/lib/types/learning.ts:157-163`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - textKey: string
  - isOptimal: boolean
  - consequenceKey: string
  - nextStage: string

## FlashcardsModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:165-169`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'flashcards'
  - cards: Flashcard[]
  - algorithm: 'sm2' | 'simple'; // Spaced repetition algorithm

## Flashcard
- Source: `darwin-MFC/lib/types/learning.ts:171-177`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - frontKey: string
  - backKey: string
  - tags: string[]
  - difficulty: Difficulty

## InteractiveModuleContent
- Source: `darwin-MFC/lib/types/learning.ts:179-183`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'interactive'
  - exerciseType: 'drag_drop' | 'fill_blank' | 'labeling' | 'ordering'
  - data: Record<string, unknown>

## CertificationConfig
- Source: `darwin-MFC/lib/types/learning.ts:189-196`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - enabled: boolean
  - titleKey: string
  - descriptionKey: string
  - minimumScore: number; // 0-100
  - validityMonths: number; // null = no expiry
  - accreditation: AccreditationInfo

## AccreditationInfo
- Source: `darwin-MFC/lib/types/learning.ts:198-203`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - organization: string
  - accreditationNumber: string
  - cmeCredits: number
  - disclaimer: string

## Certificate
- Source: `darwin-MFC/lib/types/learning.ts:205-215`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - learningPathId: string
  - userId: string
  - userName: string
  - issuedAt: string
  - expiresAt: string
  - score: number
  - verificationCode: string
  - pdfUrl: string

## UserLearningProgress
- Source: `darwin-MFC/lib/types/learning.ts:221-232`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // `${userId}_${learningPathId}`
  - userId: string
  - learningPathId: string
  - status: ProgressStatus
  - startedAt: string
  - lastAccessedAt: string
  - completedAt: string
  - moduleProgress: ModuleProgress[]
  - overallScore: number
  - certificateId: string

## ModuleProgress
- Source: `darwin-MFC/lib/types/learning.ts:236-245`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - moduleId: string
  - status: ModuleProgressStatus
  - startedAt: string
  - completedAt: string
  - score: number
  - attempts: number
  - timeSpentMinutes: number
  - lastPosition: number; // For video/content - where they left off

## SM2CardState
- Source: `darwin-MFC/lib/types/learning.ts:253-260`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - cardId: string
  - easeFactor: number; // Default 2.5
  - interval: number; // Days until next review
  - repetitions: number
  - nextReviewDate: string
  - lastReviewDate: string

## LearningAnalytics
- Source: `darwin-MFC/lib/types/learning.ts:274-284`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - userId: string
  - pathId: string
  - totalTimeMinutes: number
  - averageScore: number
  - completionRate: number
  - strongAreas: string[]
  - weakAreas: string[]
  - streakDays: number
  - lastActivityDate: string

## LearningPathCard
- Source: `darwin-MFC/lib/types/learning.ts:290-296`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - path: LearningPath
  - progress: UserLearningProgress
  - isLocked: boolean
  - completedModules: number
  - totalModules: number

## ModuleNavigationItem
- Source: `darwin-MFC/lib/types/learning.ts:298-303`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - module: LearningModule
  - progress: ModuleProgress
  - isLocked: boolean
  - isCurrent: boolean

## Posologia
- Source: `darwin-MFC/lib/types/medicamento.ts:392-411`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - indicacao: string

## AjusteDoseRenal
- Source: `darwin-MFC/lib/types/medicamento.ts:417-421`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tfg: string; // Ex: ">50", "30-50", "15-30", "<15"
  - ajuste: string
  - observacao: string

## Interacao
- Source: `darwin-MFC/lib/types/medicamento.ts:429-435`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicamento: string
  - gravidade: GravidadeInteracao
  - efeito: string
  - mecanismo: string
  - conduta: string

## ApresentacaoComercial
- Source: `darwin-MFC/lib/types/medicamento.ts:441-446`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - forma: FormaFarmaceutica
  - concentracao: string
  - quantidade: string
  - disponivelSUS: boolean

## Medicamento
- Source: `darwin-MFC/lib/types/medicamento.ts:452-578`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - nomeGenerico: string
  - nomesComerciais: string[]
  - atcCode: string
  - rxNormCui: string
  - drugBankId: string
  - snomedCT: string | string[]; // Support both single string and array for backwards compatibility
  - loinc: string[]
  - anvisaRegistro: string
  - casNumber: string
  - dcbCode: string
  - classeTerapeutica: ClasseTerapeutica
  - subclasse: SubclasseMedicamento
  - rename: boolean
  - apresentacoes: ApresentacaoComercial[]
  - indicacoes: string[]
  - mecanismoAcao: string
  - posologias: Posologia[]
  - contraindicacoes: string[]
  - precaucoes: string[]
  - interacoes: Interacao[]
  - ajusteDoseRenal: AjusteDoseRenal[]
  - gestacao: ClassificacaoGestacao
  - monitorizacao: string[]
  - orientacoesPaciente: string[]
  - doencasRelacionadas: string[]
  - calculadoras: string[]
  - citations: Citation[]
  - lastUpdate: string
  - tags: string[]

## MedicamentoSearchResult
- Source: `darwin-MFC/lib/types/medicamento.ts:584-588`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicamento: Medicamento
  - matchType: 'generico' | 'comercial' | 'classe' | 'indicacao' | 'tag'
  - score: number

## MedicamentosByClasse
- Source: `darwin-MFC/lib/types/medicamento.ts:590-595`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - classe: ClasseTerapeutica
  - label: string
  - medicamentos: Medicamento[]
  - count: number

## Note
- Source: `darwin-MFC/lib/types/notes.ts:12-24`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - content: string; // Markdown content
  - createdAt: string
  - updatedAt: string
  - tags: string[]
  - linkedEntities: LinkedEntity[]
  - highlights: Highlight[]
  - citations: NoteCitation[]
  - isPublic: boolean
  - authorId: string

## LinkedEntity
- Source: `darwin-MFC/lib/types/notes.ts:26-30`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'disease' | 'medication' | 'protocol' | 'screening' | 'calculator'
  - id: string
  - name: string

## Highlight
- Source: `darwin-MFC/lib/types/notes.ts:32-40`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - text: string
  - color: HighlightColor
  - startOffset: number
  - endOffset: number
  - annotation: string
  - createdAt: string

## NoteCitation
- Source: `darwin-MFC/lib/types/notes.ts:44-50`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - citationNumber: number
  - reference: Reference
  - pageNumber: string
  - quote: string

## NotesState
- Source: `darwin-MFC/lib/types/notes.ts:56-62`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - notes: Note[]
  - currentNote: Note | null
  - isEditing: boolean
  - searchQuery: string
  - selectedTags: string[]

## NotesActions
- Source: `darwin-MFC/lib/types/notes.ts:64-77`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - createNote: (title: string) => Note
  - updateNote: (id: string, updates: Partial<Note>) => void
  - deleteNote: (id: string) => void
  - setCurrentNote: (note: Note | null) => void
  - addHighlight: (noteId: string, highlight: Omit<Highlight, 'id' | 'createdAt'>) => void
  - removeHighlight: (noteId: string, highlightId: string) => void
  - addCitation: (noteId: string, citation: Omit<NoteCitation, 'id'>) => void
  - removeCitation: (noteId: string, citationId: string) => void
  - linkEntity: (noteId: string, entity: LinkedEntity) => void
  - unlinkEntity: (noteId: string, entityId: string) => void
  - setSearchQuery: (query: string) => void
  - setSelectedTags: (tags: string[]) => void

## NoteExportOptions
- Source: `darwin-MFC/lib/types/notes.ts:83-89`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - format: 'markdown' | 'pdf' | 'docx' | 'html'
  - includeCitations: boolean
  - includeHighlights: boolean
  - includeMetadata: boolean
  - citationStyle: 'vancouver' | 'apa' | 'harvard'

## OntologyMapping
- Source: `darwin-MFC/lib/types/ontologies.ts:5-12`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - loinc: string[]; // LOINC codes
  - ordo: string[]; // ORDO codes

## WithOntologies
- Source: `darwin-MFC/lib/types/ontologies.ts:17-19`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - ontologies: OntologyMapping

## FlowchartNode
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:50-77`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: NodeType
  - label: string
  - sublabel: string
  - details: string
  - quickAction: QuickAction
  - linkedCalculator: string
  - linkedMedicamento: string
  - linkedProtocolo: string

## FlowchartEdge
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:83-98`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - source: string
  - target: string
  - label: string
  - condition: EdgeCondition
  - style: EdgeStyle
  - animated: boolean
  - priority: number; // Para ordenar caminhos

## ProtocoloInterativo
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:104-146`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - subtitulo: string
  - descricao: string
  - categoria: ProtocoloCategoria
  - subcategoria: string
  - ciap2Chapters: CIAP2Chapter[]
  - nodes: FlowchartNode[]
  - edges: FlowchartEdge[]
  - entryNodeId: string
  - doencasRelacionadas: string[]
  - medicamentosRelacionados: string[]
  - calculadorasRelacionadas: string[]
  - rastreamentosRelacionados: string[]
  - quickActionsDisponiveis: QuickAction[]
  - fonte: string
  - referencia: string
  - lastUpdate: string
  - complexity: 'simples' | 'moderado' | 'complexo'
  - tempoEstimado: string
  - tags: string[]

## FlowchartNavigationState
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:161-168`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - protocoloId: string
  - currentNodeId: string
  - visitedNodes: string[]
  - pathTaken: FlowchartEdge[]
  - startTime: Date
  - decisions: Record<string, string>; // nodeId -> decisão tomada

## FlowchartResult
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:174-183`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - protocoloId: string
  - protocoloTitulo: string
  - conclusionNodeId: string
  - conclusionLabel: string
  - pathSummary: string[]
  - quickActionsCollected: QuickAction[]
  - totalTime: number; // em segundos
  - exportText: string

## FlowchartConfig
- Source: `darwin-MFC/lib/types/protocolo-interativo.ts:189-204`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodeSpacing: number
  - edgeCurvature: number
  - showMinimap: boolean
  - showControls: boolean
  - allowBacktrack: boolean
  - showPathHighlight: boolean
  - autoAdvance: boolean
  - enableExport: boolean
  - exportFormats: ('text' | 'pdf' | 'image')[]

## Protocolo
- Source: `darwin-MFC/lib/types/protocolo.ts:65-109`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - subtitulo: string
  - categoria: CategoriaProtocolo
  - complexidade: NivelComplexidade
  - versao: string
  - ultimaAtualizacao: string
  - fonte: string
  - ciap2: string[]
  - cid10: string[]
  - descricao: string
  - objetivos: string[]
  - populacaoAlvo: string
  - nodes: ProtocolNode[]
  - edges: ProtocolEdge[]
  - criteriosInclusao: string[]
  - criteriosExclusao: string[]
  - sinaisAlerta: string[]
  - referencias: string[]
  - doencasRelacionadas: string[]
  - medicamentosRelacionados: string[]
  - calculadorasRelacionadas: string[]
  - tags: string[]

## ReactFlowConfig
- Source: `darwin-MFC/lib/types/protocolo.ts:112-121`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - fitView: boolean
  - zoomOnScroll: boolean
  - panOnScroll: boolean
  - nodesDraggable: boolean
  - nodesConnectable: boolean
  - elementsSelectable: boolean
  - snapToGrid: boolean
  - snapGrid: [number, number]

## FlowchartState
- Source: `darwin-MFC/lib/types/protocolo.ts:124-129`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - selectedNode: ProtocolNode | null
  - highlightedPath: string[]
  - completedNodes: string[]
  - currentStep: string | null

## Recommendations
- Source: `darwin-MFC/lib/types/rastreamentos.ts:5-35`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## Rastreamento
- Source: `darwin-MFC/lib/types/rastreamentos.ts:37-50`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - category: 'neonatal' | 'infantil' | 'adultos' | 'cancer' | 'gestacao' | 'infecciosas' | 'saude_mental' | 'outros'
  - description: string; // Introdução/Resumo
  - recommendations: Recommendations
  - lastUpdate: string; // Data da última atualização da diretriz SUS (ex: "2025-11")

## Reference
- Source: `darwin-MFC/lib/types/references.ts:13-29`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - type: ReferenceType
  - authors: string[]
  - title: string
  - journal: string; // Para artigos
  - year: number
  - volume: string
  - pages: string
  - doi: string
  - url: string
  - accessDate: string
  - legalNumber: string; // Para portarias/leis (ex: "Portaria GM/MS nº 1.234")
  - publisher: string; // Para livros
  - edition: string; // Para livros
  - note: string; // Nota contextual opcional

## Citation
- Source: `darwin-MFC/lib/types/references.ts:32-41`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - refId: string
  - page: string; // Referência específica dentro da obra
  - note: string; // Nota contextual opcional
  - evidenceLevel: EvidenceLevel; // Nível de evidência
  - studyType: StudyType; // Tipo de estudo
  - qualityScore: number; // Score de qualidade (0-10)
  - limitations: string[]; // Limitações do estudo
  - conflictsOfInterest: string; // Conflitos de interesse

## RegionConfig
- Source: `darwin-MFC/lib/types/region.ts:34-58`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: Region
  - name: string
  - flag: string
  - regulatoryBody: string
  - publicHealthSystem: string
  - defaultLocale: string
  - currency: string
  - genericPrescribingDefault: boolean

## Presentation
- Source: `darwin-MFC/lib/types/region.ts:67-86`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - forma: FormaFarmaceutica
  - concentracao: string
  - quantidade: string
  - disponivelSistemaPublico: boolean

## RegionalMedicationOverlay
- Source: `darwin-MFC/lib/types/region.ts:96-132`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicationId: string
  - region: Region
  - localGenericName: string
  - commercialNames: string[]
  - approvalStatus: 'approved' | 'restricted' | 'not_available'
  - availableInPublicSystem: boolean
  - publicSystemName: string
  - presentations: Presentation[]
  - registrationNumber: string
  - prescribingRestrictions: string[]
  - localTherapeuticClass: string
  - lastUpdate: string

## RegionalDiseaseOverlay
- Source: `darwin-MFC/lib/types/region.ts:141-168`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - diseaseId: string
  - region: Region
  - screeningRecommendations: string
  - localICDCode: string

## MedicationWithRegionalData
- Source: `darwin-MFC/lib/types/region.ts:182-185`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - baseId: string
  - overlays: RegionalOverlayMap<RegionalMedicationOverlay>

## RegionState
- Source: `darwin-MFC/lib/types/region.ts:190-193`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - currentRegion: Region
  - availableRegions: Region[]

## Flashcard
- Source: `darwin-MFC/lib/types/study-mode.ts:15-26`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - front: string; // Pergunta ou conceito
  - back: string; // Resposta ou explicação
  - categoria: 'doenca' | 'medicamento' | 'caso_clinico' | 'protocolo'
  - tags: string[]
  - dificuldade: 'facil' | 'medio' | 'dificil'
  - fonteId: string; // ID da doença/caso/medicamento origem
  - lastReviewed: Date
  - masteryLevel: number; // 0-5 (Sistema de repetição espaçada)
  - nextReview: Date

## QuizQuestion
- Source: `darwin-MFC/lib/types/study-mode.ts:32-43`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'matching' | 'preenchimento'
  - enunciado: string
  - opcoes: OpcaoQuiz[]
  - respostaCorreta: string | string[]
  - explicacao: string
  - pontos: number
  - categoria: string
  - tags: string[]
  - tempoEstimado: number; // em segundos

## OpcaoQuiz
- Source: `darwin-MFC/lib/types/study-mode.ts:45-49`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - texto: string
  - correta: boolean

## Quiz
- Source: `darwin-MFC/lib/types/study-mode.ts:51-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titulo: string
  - descricao: string
  - questoes: QuizQuestion[]
  - categoria: 'doencas' | 'medicamentos' | 'casos_clinicos' | 'protocolos' | 'geral'
  - dificuldade: 'facil' | 'medio' | 'dificil'
  - tempoTotal: number; // em minutos
  - pontuacaoMaxima: number

## StudyProgress
- Source: `darwin-MFC/lib/types/study-mode.ts:66-86`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - userId: string
  - streak: number; // Dias consecutivos estudando
  - totalStudyTime: number; // em minutos
  - lastStudyDate: Date

## QuizAttempt
- Source: `darwin-MFC/lib/types/study-mode.ts:88-95`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - quizId: string
  - timestamp: Date
  - respostas: QuizResposta[]
  - pontuacao: number
  - tempoUtilizado: number; // em segundos
  - porcentagemAcerto: number

## QuizResposta
- Source: `darwin-MFC/lib/types/study-mode.ts:97-102`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questaoId: string
  - resposta: string | string[]
  - correta: boolean
  - tempoGasto: number

## FlashcardGenerator
- Source: `darwin-MFC/lib/types/study-mode.ts:108-112`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## TimelineEvent
- Source: `darwin-MFC/lib/types/timeline.ts:3-12`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - date: string; // ISO format: "2025-09-24"
  - title: string
  - description: string
  - category: 'portaria' | 'lei' | 'diretriz' | 'incorporacao' | 'nota_tecnica'
  - impact: 'alto' | 'medio' | 'baixo'
  - affectedScreenings: string[]; // IDs dos rastreamentos afetados
  - citations: Citation[]

## TimelineData
- Source: `darwin-MFC/lib/types/timeline.ts:14-18`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - year: number
  - description: string; // Ex: "Ano da Ruptura Epistemológica"
  - events: TimelineEvent[]

## RawItemParameters
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:12-20`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - NU_ITEM_PROVA_1: number; // Item number in exam version 1 (1-100)
  - NU_ITEM_PROVA_2: number; // Item number in exam version 2
  - ITEM_MANTIDO: 0 | 1; // 1 = valid, 0 = excluded from analysis
  - PARAMETRO_B: number | null; // IRT difficulty parameter
  - COR_BISSERIAL: number | null; // Point-biserial correlation
  - INFIT: number | null; // Infit statistic
  - OUTFIT: number | null; // Outfit statistic

## RawParticipantData
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:35-51`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - NU_ANO: number; // Year (2025)
  - TP_INSCRICAO: number; // 0 = ENADE, 1 = Demais
  - CO_CADERNO: number; // Exam version (1 or 2)
  - NU_ITEM: number; // Question count
  - DS_VT_GAB_OBJ: string; // Answer key (100 chars)
  - DS_VT_ACE_OBJ: string; // Student answers (100 chars)
  - DS_VT_ESC_OBJ: string; // Scoring vector (100 chars)
  - TP_PR_GER: number; // Attendance status (222 = valid)
  - PROFICIENCIA: number | null; // Official theta estimate
  - NT_GER: number | null; // Official scaled score (0-100)
  - QT_ACERTO_AREA_1: number; // Correct in area 1
  - QT_ACERTO_AREA_2: number; // Correct in area 2
  - QT_ACERTO_AREA_3: number; // Correct in area 3
  - QT_ACERTO_AREA_4: number; // Correct in area 4
  - QT_ACERTO_AREA_5: number; // Correct in area 5

## ProcessedParticipant
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:56-64`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - inscriptionType: 'enade' | 'demais'
  - examVersion: 1 | 2
  - responses: boolean[]; // true = correct, false = incorrect
  - officialTheta: number | null
  - officialScaledScore: number | null
  - areaCorrect: Record<number, number>; // Area index -> correct count
  - isValid: boolean; // TP_PR_GER = 222

## QuestionOption
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:73-76`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - letter: 'A' | 'B' | 'C' | 'D'
  - text: string

## ExtractedQuestion
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:81-88`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemNumber: number; // Position in exam (1-100)
  - caderno: 1 | 2; // Exam version
  - stem: string; // Clinical case/question text
  - options: QuestionOption[]
  - images: string[]; // Base64 encoded images
  - correctAnswer: 'A' | 'B' | 'C' | 'D'; // From gabarito

## Gabarito
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:93-96`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - caderno: 1 | 2
  - answers: Record<number, 'A' | 'B' | 'C' | 'D' | null>; // itemNumber -> answer

## CompleteQuestion
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:115-142`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string; // UUID format: q-enamed-2025-XXX
  - bankId: string
  - stem: string
  - options: QuestionOption[]
  - correctIndex: number; // 0-3 (A=0, B=1, C=2, D=3)
  - explanation: string
  - area: ENAMEDArea
  - year: number
  - examVersion: 1 | 2
  - originalItemNumber: number
  - validatedBy: 'expert'

## ValidationResult
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:151-160`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - participantIndex: number
  - officialTheta: number
  - darwinTheta: number
  - thetaDifference: number
  - officialScaled: number | null
  - darwinScaled: number
  - responseCount: number
  - correctCount: number

## ValidationSummary
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:165-189`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalParticipants: number
  - validParticipants: number
  - pearsonR: number
  - spearmanRho: number
  - meanAbsoluteError: number
  - rootMeanSquareError: number
  - maxError: number
  - percentWithin01: number; // Within 0.1 theta
  - percentWithin025: number; // Within 0.25 theta
  - percentWithin05: number; // Within 0.5 theta
  - worstCases: ValidationResult[]
  - passed: boolean
  - recommendations: string[]

## ThetaDistribution
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:198-206`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - mean: number
  - median: number
  - stdDev: number
  - min: number
  - max: number
  - percentiles: Record<number, number>; // 5, 10, 25, 50, 75, 90, 95
  - histogram: HistogramBucket[]

## HistogramBucket
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:211-216`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - min: number
  - max: number
  - count: number
  - percentage: number

## AreaStatistics
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:221-227`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - totalQuestions: number
  - meanCorrect: number
  - percentageCorrect: number
  - averageDifficulty: number

## StatisticsReport
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:232-251`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - generatedAt: string
  - dataSource: string
  - totalRecords: number
  - validCompletions: number
  - thetaDistribution: ThetaDistribution
  - scaledScoreDistribution: ThetaDistribution
  - areaStatistics: AreaStatistics[]
  - itemDifficultyRange: { min: number; max: number }
  - itemDiscriminationRange: { min: number; max: number }
  - excludedItems: number[]

## ETLOptions
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:260-274`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - scrapeOnly: boolean; // Only download/parse PDFs
  - parseOnly: boolean; // Only parse microdata (no scraping)
  - validateOnly: boolean; // Only run validation
  - full: boolean; // Full pipeline
  - sampleSize: number; // Limit participant records for testing
  - skipValidation: boolean; // Skip validation step
  - outputDir: string
  - verbose: boolean

## ETLResult
- Source: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:279-299`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - success: boolean
  - startTime: Date
  - endTime: Date
  - duration: number; // milliseconds
  - itemsParsed: number
  - questionsScraped: number
  - questionsMerged: number
  - participantsProcessed: number
  - sqlFile: string
  - validationReport: string
  - statisticsReport: string
  - errors: string[]
  - warnings: string[]

## ScrapedData
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:6-10`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - pdfs: Map<string, Buffer>;      // filename -> buffer
  - metadata: Record<string, any>;  // Source-specific metadata
  - timestamp: Date

## ParsedQuestions
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:12-21`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questions: RawQuestion[]
  - metadata: Record<string, any>

## RawQuestion
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:23-32`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - number: number
  - stem: string
  - correctAnswer: string
  - metadata: Record<string, any>

## CompleteQuestions
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:34-42`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questions: CompleteQuestion[]

## CompleteQuestion
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:44-58`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - bankId: string
  - stem: string
  - correctIndex: number
  - area: string
  - year: number
  - metadata: QuestionMetadata
  - irt: IRTParameters

## QuestionMetadata
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:60-68`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - institution: string
  - institutionTier: 'TIER_1_NATIONAL' | 'TIER_2_REGIONAL_STRONG' | 'TIER_3_REGIONAL'
  - examType: 'R1' | 'R2' | 'R3' | 'national' | 'concurso'
  - questionPosition: number
  - totalQuestionsInExam: number
  - optionCount: number
  - source: string

## IRTParameters
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:70-79`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - difficulty: number
  - discrimination: number
  - guessing: number
  - infit: number
  - outfit: number
  - estimated: boolean
  - confidence: number
  - method: 'metadata' | 'expert' | 'empirical'

## ValidationResult
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:81-90`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - isValid: boolean
  - errors: string[]
  - warnings: string[]

## ETLResult
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:92-100`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - success: boolean
  - pluginId: string
  - totalQuestions: number
  - sqlPath: string
  - errors: string[]
  - warnings: string[]
  - duration: number; // milliseconds

## ETLPlugin
- Source: `infrastructure/supabase/seed/etl-core/types/plugin.ts:106-128`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## ParsedENAREExam
- Source: `infrastructure/supabase/seed/sources/enare-2024/parser.ts:10-20`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - year: number
  - questions: RawQuestion[]
  - answerKey: Map<number, string>

## ParsedRegionalExam
- Source: `infrastructure/supabase/seed/sources/regional/parser.ts:10-21`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - sourceId: 'amrigs' | 'surce' | 'susSp'
  - year: number
  - questions: RawQuestion[]
  - answerKey: Map<number, string>

## ParsedREVALIDAExam
- Source: `infrastructure/supabase/seed/sources/revalida/parser.ts:10-20`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - year: number
  - questions: RawQuestion[]
  - answerKey: Map<number, string>

## ParsedUSPExam
- Source: `infrastructure/supabase/seed/sources/usp-fuvest/parser.ts:10-22`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - year: number
  - title: string
  - questions: RawQuestion[]
  - answerKey: Map<number, string>
  - formatDetected: string

## ENAMEDQuestionMeta
- Source: `packages/shared/src/analyzers/enamed-parser.ts:24-42`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionNumber: number
  - area: ENAMEDArea
  - position: number; // Position in exam (1-100)
  - difficulty: number; // b parameter
  - discrimination: number; // a parameter
  - guessing: number; // c parameter
  - totalResponses: number
  - correctResponses: number
  - percentCorrect: number
  - optionFrequencies: number[]; // Count for options A, B, C, D
  - optionProportions: number[]; // Proportion for each option

## CandidateResponse
- Source: `packages/shared/src/analyzers/enamed-parser.ts:47-54`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - candidateId: string
  - questionNumber: number
  - selectedOption: number; // 0=A, 1=B, 2=C, 3=D, -1=blank
  - correctOption: number
  - isCorrect: boolean
  - responseTime: number; // seconds (if available)

## IRTCalibrationResults
- Source: `packages/shared/src/analyzers/enamed-parser.ts:59-88`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questions: Map<number, ENAMEDQuestionMeta>

## ENAMEDMicrodata
- Source: `packages/shared/src/analyzers/enamed-parser.ts:93-102`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questions: ENAMEDQuestionMeta[]
  - responses: CandidateResponse[]
  - irtCalibration: IRTCalibrationResults

## LLMParserConfig
- Source: `packages/shared/src/harvester/parsers/llm-question-parser.ts:94-101`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - provider: 'grok' | 'minimax' | 'groq'
  - apiKey: string
  - groupId: string; // Para Minimax
  - model: string
  - maxTokens: number
  - temperature: number

## VisionParserConfig
- Source: `packages/shared/src/harvester/parsers/vision-question-parser.ts:26-32`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - provider: 'claude' | 'openai' | 'grok' | 'meta'
  - apiKey: string
  - model: string
  - maxTokens: number
  - concurrentPages: number

## PageImage
- Source: `packages/shared/src/harvester/parsers/vision-question-parser.ts:34-40`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - pageNumber: number
  - base64: string
  - mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  - width: number
  - height: number

## ExtractionResult
- Source: `packages/shared/src/harvester/parsers/vision-question-parser.ts:42-47`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - pageNumber: number
  - questions: ParsedQuestion[]
  - hasMoreContent: boolean
  - confidence: number

## GabaritoEntry
- Source: `packages/shared/src/harvester/parsers/vision-question-parser.ts:49-53`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionNumber: number
  - correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'
  - annulled: boolean

## QuestionSource
- Source: `packages/shared/src/harvester/types.ts:20-30`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - type: QuestionSourceType
  - url: string
  - institution: string
  - year: number
  - crawlable: boolean
  - lastCrawled: Date
  - questionCount: number

## RawDocument
- Source: `packages/shared/src/harvester/types.ts:38-49`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - sourceId: string
  - url: string
  - format: DocumentFormat
  - filename: string
  - content: Buffer | string
  - extractedText: string
  - ocrRequired: boolean
  - downloadedAt: Date
  - metadata: Record<string, unknown>

## RawQuestionBlock
- Source: `packages/shared/src/harvester/types.ts:55-64`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - documentId: string
  - pageNumber: number
  - rawText: string
  - imageData: string; // base64 se tiver figura

## ParsedQuestion
- Source: `packages/shared/src/harvester/types.ts:70-100`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - sourceId: string
  - documentId: string
  - stem: string;                    // Enunciado
  - options: ParsedOption[];         // Alternativas
  - correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null
  - explanation: string;            // Comentário/explicação se disponível
  - area: string;                   // Área médica
  - subspecialty: string;           // Subespecialidade
  - topics: string[];               // Tópicos/temas
  - difficulty: 'easy' | 'medium' | 'hard'
  - icd10Codes: string[];           // Códigos CID-10 relacionados
  - atcCodes: string[];             // Códigos ATC de medicamentos
  - procedures: string[];           // Procedimentos mencionados
  - confidence: number;              // 0-1, confiança do parsing
  - needsReview: boolean
  - parseErrors: string[]
  - parsedAt: Date
  - validatedAt: Date

## ParsedOption
- Source: `packages/shared/src/harvester/types.ts:102-106`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - letter: 'A' | 'B' | 'C' | 'D' | 'E'
  - text: string
  - isCorrect: boolean

## HarvestJob
- Source: `packages/shared/src/harvester/types.ts:122-140`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - sourceId: string
  - status: HarvestJobStatus
  - documentsFound: number
  - documentsProcessed: number
  - questionsExtracted: number
  - questionsValid: number
  - errors: HarvestError[]
  - createdAt: Date
  - startedAt: Date
  - completedAt: Date

## HarvestError
- Source: `packages/shared/src/harvester/types.ts:142-148`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stage: HarvestJobStatus
  - documentId: string
  - message: string
  - stack: string
  - timestamp: Date

## HarvesterConfig
- Source: `packages/shared/src/harvester/types.ts:154-175`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - llmProvider: 'grok' | 'groq' | 'minimax'
  - llmApiKey: string
  - ocrProvider: 'tesseract' | 'google_vision' | 'aws_textract'
  - ocrApiKey: string
  - maxConcurrentJobs: number
  - maxDocumentsPerJob: number
  - maxQuestionsPerDocument: number
  - requestDelayMs: number
  - maxRequestsPerMinute: number
  - minConfidenceThreshold: number
  - requireManualReview: boolean

## LLMParseResult
- Source: `packages/shared/src/harvester/types.ts:181-188`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - success: boolean
  - questions: ParsedQuestion[]
  - rawResponse: string
  - tokensUsed: number
  - processingTimeMs: number
  - errors: string[]

## OCRResult
- Source: `packages/shared/src/harvester/types.ts:190-196`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - success: boolean
  - text: string
  - confidence: number
  - pages: OCRPage[]
  - processingTimeMs: number

## OCRPage
- Source: `packages/shared/src/harvester/types.ts:198-203`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - pageNumber: number
  - text: string
  - confidence: number
  - blocks: OCRBlock[]

## OCRBlock
- Source: `packages/shared/src/harvester/types.ts:205-214`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - text: string
  - confidence: number

## MinimaxConfig
- Source: `packages/shared/src/types/ai.ts:18-43`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - apiKey: string
  - groupId: string
  - model: string
  - baseUrl: string
  - timeout: number

## ChatMessage
- Source: `packages/shared/src/types/ai.ts:53-56`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - role: ChatRole
  - content: string

## ChatOptions
- Source: `packages/shared/src/types/ai.ts:61-86`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - temperature: number
  - maxTokens: number
  - topP: number
  - stop: string[]
  - stream: boolean

## TokenUsage
- Source: `packages/shared/src/types/ai.ts:91-95`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - promptTokens: number
  - completionTokens: number
  - totalTokens: number

## ChatResponse
- Source: `packages/shared/src/types/ai.ts:100-111`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - object: string
  - created: number
  - model: string
  - usage: TokenUsage

## QuestionGenerationParams
- Source: `packages/shared/src/types/ai.ts:120-155`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - topic: string
  - difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
  - icd10Codes: string[]
  - atcCodes: string[]
  - count: number
  - context: string

## AIGeneratedQuestion
- Source: `packages/shared/src/types/ai.ts:160-214`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stem: string
  - options: [string, string, string, string]
  - correctAnswer: number
  - explanation: string
  - area: ENAMEDArea
  - topic: string
  - icd10Codes: string[]
  - atcCodes: string[]
  - estimatedDifficulty: number

## ExplainParams
- Source: `packages/shared/src/types/ai.ts:223-252`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - question: Pick<ENAMEDQuestion, 'stem' | 'options' | 'correctIndex'>
  - userAnswer: number
  - userTheta: number
  - style: 'concise' | 'detailed' | 'visual'

## ExplanationResponse
- Source: `packages/shared/src/types/ai.ts:257-281`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - explanation: string
  - misconceptionAnalysis: string
  - keyConceptsToReview: string[]

## CaseStudyParams
- Source: `packages/shared/src/types/ai.ts:290-315`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - complexity: 'simple' | 'moderate' | 'complex'
  - targetDiagnosis: string
  - icd10Codes: string[]
  - format: 'clinical_vignette' | 'progressive_disclosure' | 'interactive'

## CaseStudy
- Source: `packages/shared/src/types/ai.ts:320-365`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - initialPresentation: string
  - stages: CaseStage[]
  - correctDiagnosis: string
  - icd10Code: string
  - learningObjectives: string[]

## CaseStage
- Source: `packages/shared/src/types/ai.ts:370-405`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stage: number
  - title: string
  - information: string
  - question: string
  - options: string[]
  - correctOption: number
  - feedback: string

## SummarizeParams
- Source: `packages/shared/src/types/ai.ts:414-439`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - content: string
  - type: 'disease' | 'medication' | 'protocol' | 'guideline'
  - targetLength: 'brief' | 'moderate' | 'comprehensive'
  - focus: string[]
  - format: 'paragraph' | 'bullet_points' | 'flashcard'

## SummaryResponse
- Source: `packages/shared/src/types/ai.ts:444-464`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - summary: string
  - keyPoints: string[]
  - clinicalPearls: string[]
  - estimatedReadingTime: number

## CacheConfig
- Source: `packages/shared/src/types/ai.ts:478-488`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - ttl: number
  - enabled: boolean

## CacheEntry
- Source: `packages/shared/src/types/ai.ts:493-533`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - key: string
  - requestType: CacheRequestType
  - response: string
  - tokensUsed: number
  - costBrl: number
  - hits: number
  - createdAt: Date
  - expiresAt: Date

## RateLimitConfig
- Source: `packages/shared/src/types/ai.ts:547-562`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - maxRequestsPerDay: number
  - maxTokensPerRequest: number
  - monthlyCostLimitBrl: number

## RateLimitStatus
- Source: `packages/shared/src/types/ai.ts:567-592`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tier: SubscriptionTier
  - remainingRequests: number
  - resetsAt: Date
  - isLimited: boolean
  - monthlySpendBrl: number

## KnowledgeComponent
- Source: `packages/shared/src/types/bkt.ts:33-44`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - namePt: string
  - area: ENAMEDArea
  - subspecialty: string
  - params: BKTParameters

## BKTParameters
- Source: `packages/shared/src/types/bkt.ts:47-56`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - pInit: number
  - pTransit: number
  - pSlip: number
  - pGuess: number

## BKTMasteryState
- Source: `packages/shared/src/types/bkt.ts:71-84`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - kcId: string
  - mastery: number
  - opportunityCount: number
  - correctCount: number
  - classification: MasteryClassification
  - lastObservationAt: Date | null

## BKTObservation
- Source: `packages/shared/src/types/bkt.ts:104-113`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - correct: boolean
  - timestamp: Date
  - source: BKTObservationSource
  - itemId: string

## MasteryTrajectoryPoint
- Source: `packages/shared/src/types/bkt.ts:124-133`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - index: number
  - mastery: number
  - correct: boolean
  - timestamp: Date

## MasteryHeatmapData
- Source: `packages/shared/src/types/bkt.ts:140-159`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - areas: ENAMEDArea[]
  - areaMastery: Record<ENAMEDArea, number>
  - overallMastery: number
  - masteredCount: number
  - totalKCs: number

## BKTEMResult
- Source: `packages/shared/src/types/bkt.ts:166-175`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - params: BKTParameters
  - iterations: number
  - logLikelihood: number
  - converged: boolean

## BKTEMConfig
- Source: `packages/shared/src/types/bkt.ts:178-185`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - maxIterations: number
  - convergenceThreshold: number
  - minObservations: number

## CIPFinding
- Source: `packages/shared/src/types/cip.ts:71-90`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - textPt: string
  - textEn: string
  - section: CIPSection
  - icd10Codes: string[]
  - atcCodes: string[]
  - tags: string[]
  - isAIGenerated: boolean
  - validatedBy: 'community' | 'expert' | 'both'

## CIPDiagnosis
- Source: `packages/shared/src/types/cip.ts:99-120`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - namePt: string
  - nameEn: string
  - icd10Code: string
  - icd10CodesSecondary: string[]
  - area: ENAMEDArea
  - subspecialty: string
  - findings: Record<CIPSection, CIPFinding[]>
  - difficultyTier: 1 | 2 | 3 | 4 | 5
  - keywords: string[]

## CIPDifficultySettings
- Source: `packages/shared/src/types/cip.ts:129-142`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - diagnosisCount: 4 | 5 | 6 | 7
  - sections: CIPSection[]
  - distractorCount: number
  - allowReuse: boolean
  - minDistractorSimilarity: number
  - maxDistractorSimilarity: number

## CIPCell
- Source: `packages/shared/src/types/cip.ts:197-208`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - row: number
  - column: CIPSection
  - correctFindingId: string
  - selectedFindingId: string | null
  - irt: IRTParameters

## CIPPuzzle
- Source: `packages/shared/src/types/cip.ts:213-246`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - description: string
  - areas: ENAMEDArea[]
  - difficulty: DifficultyLevel
  - settings: CIPDifficultySettings
  - diagnoses: CIPDiagnosis[]
  - grid: CIPCell[][]
  - optionsPerSection: Record<CIPSection, CIPFinding[]>
  - timeLimitMinutes: number
  - irt: IRTParameters
  - type: 'practice' | 'exam' | 'custom'
  - isAIGenerated: boolean
  - validatedBy: 'community' | 'expert' | 'both'
  - createdBy: string
  - createdAt: Date

## CIPAttempt
- Source: `packages/shared/src/types/cip.ts:255-274`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - puzzleId: string
  - userId: string
  - gridState: Record<string, string>
  - timePerCell: Record<string, number>
  - totalTimeSeconds: number
  - startedAt: Date
  - completedAt: Date | null
  - score: CIPScore

## CIPSectionPerformance
- Source: `packages/shared/src/types/cip.ts:283-290`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - correct: number
  - total: number
  - percentage: number

## CIPDiagnosisPerformance
- Source: `packages/shared/src/types/cip.ts:295-306`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - diagnosisId: string
  - diagnosisName: string
  - correct: number
  - total: number
  - percentage: number

## CIPScore
- Source: `packages/shared/src/types/cip.ts:311-332`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: number
  - standardError: number
  - scaledScore: number
  - passThreshold: number
  - passed: boolean
  - correctCount: number
  - totalCells: number
  - percentageCorrect: number
  - sectionBreakdown: Record<CIPSection, CIPSectionPerformance>
  - diagnosisBreakdown: CIPDiagnosisPerformance[]

## SimilarityWeights
- Source: `packages/shared/src/types/cip.ts:341-352`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - icd10: number
  - atc: number
  - area: number
  - subspecialty: number
  - keyword: number

## CIPGenerationOptions
- Source: `packages/shared/src/types/cip.ts:384-397`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - difficulty: DifficultyLevel
  - customSettings: Partial<CIPDifficultySettings>
  - areas: ENAMEDArea[]
  - timeLimitMinutes: number
  - title: string
  - similarityWeights: SimilarityWeights

## DistractorCandidate
- Source: `packages/shared/src/types/cip.ts:402-409`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - finding: CIPFinding
  - similarity: number
  - difficultyMatch: number

## ImageOption
- Source: `packages/shared/src/types/cip.ts:487-495`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - textPt: string
  - isCorrect: boolean
  - explanationPt: string
  - clinicalPearlPt: string

## StructuredExplanation
- Source: `packages/shared/src/types/cip.ts:500-511`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - keyFindings: string[]
  - systematicApproach: string
  - commonMistakes: string[]
  - clinicalCorrelation: string
  - references: string[]

## CIPImageCase
- Source: `packages/shared/src/types/cip.ts:516-552`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titlePt: string
  - titleEn: string
  - clinicalContextPt: string
  - clinicalContextEn: string
  - modality: ImageModality
  - imageDescriptionPt: string
  - imageDescriptionEn: string
  - asciiArt: string
  - imageUrl: string
  - area: import('./education').ENAMEDArea
  - subspecialty: string
  - difficulty: DifficultyLevel
  - correctFindings: string[]
  - correctDiagnosis: string
  - correctNextStep: string
  - modalityOptions: ImageOption[]
  - findingsOptions: ImageOption[]
  - diagnosisOptions: ImageOption[]
  - nextStepOptions: ImageOption[]
  - explanationPt: string
  - explanationEn: string
  - imageAttribution: string
  - structuredExplanation: StructuredExplanation
  - irt: IRTParameters
  - isPublic: boolean
  - isAIGenerated: boolean
  - validatedBy: 'community' | 'expert' | 'both'
  - timesAttempted: number
  - timesCompleted: number
  - avgScore: number
  - createdAt: Date
  - updatedAt: Date

## CIPImageAttempt
- Source: `packages/shared/src/types/cip.ts:557-579`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - caseId: string
  - userId: string
  - selectedModality: string | null
  - selectedFindings: string[]
  - selectedDiagnosis: string | null
  - selectedNextStep: string | null
  - modalityCorrect: boolean | null
  - findingsCorrectCount: number | null
  - findingsTotalCount: number | null
  - diagnosisCorrect: boolean | null
  - nextStepCorrect: boolean | null
  - totalScore: number | null
  - scaledScore: number | null
  - theta: number | null
  - standardError: number | null
  - totalTimeSeconds: number | null
  - stepTimes: Record<ImageInterpretationStep, number>
  - currentStep: ImageInterpretationStep
  - startedAt: Date
  - completedAt: Date | null

## ImageStepResult
- Source: `packages/shared/src/types/cip.ts:584-603`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - step: ImageInterpretationStep
  - label: string
  - correct: boolean
  - partialCredit: number
  - selectedAnswer: string | string[]
  - correctAnswer: string | string[]
  - weight: number
  - weightedScore: number
  - selectedOptionText: string
  - correctOptionText: string
  - selectedExplanation: string
  - correctExplanation: string
  - clinicalPearl: string

## CIPImageScore
- Source: `packages/shared/src/types/cip.ts:608-618`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: number
  - standardError: number
  - scaledScore: number
  - passThreshold: number
  - passed: boolean
  - totalScore: number
  - percentageCorrect: number
  - stepResults: ImageStepResult[]
  - insights: string[]

## DIFGroupDefinition
- Source: `packages/shared/src/types/dif.ts:37-44`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - variable: DIFGroupVariable
  - referenceGroup: string
  - focalGroup: string

## DIFResponseData
- Source: `packages/shared/src/types/dif.ts:51-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - correct: boolean
  - totalScore: number
  - group: string

## MHContingencyCell
- Source: `packages/shared/src/types/dif.ts:67-82`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stratum: number
  - scoreRange: [number, number]
  - focalCorrect: number
  - focalIncorrect: number
  - referenceCorrect: number
  - referenceIncorrect: number
  - total: number

## MHResult
- Source: `packages/shared/src/types/dif.ts:85-98`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - alphaMH: number
  - deltaMH: number
  - chiSquare: number
  - pValue: number
  - strataCount: number
  - contingencyTables: MHContingencyCell[]

## LordResult
- Source: `packages/shared/src/types/dif.ts:105-122`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - chiSquare: number
  - pValue: number
  - df: number
  - focalParams: IRTParameters
  - referenceParams: IRTParameters

## DIFItemResult
- Source: `packages/shared/src/types/dif.ts:142-160`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - area: ENAMEDArea
  - mh: MHResult
  - lord: LordResult
  - etsClassification: ETSClassification
  - flagged: boolean
  - direction: 'favors_focal' | 'favors_reference' | 'none'
  - sampleSizeFocal: number
  - sampleSizeReference: number

## DIFAnalysis
- Source: `packages/shared/src/types/dif.ts:167-178`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - groupDefinition: DIFGroupDefinition
  - itemResults: DIFItemResult[]
  - flaggedItems: DIFItemResult[]
  - summary: DIFSummary
  - analyzedAt: Date

## DIFSummary
- Source: `packages/shared/src/types/dif.ts:181-194`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalItems: number
  - classificationCounts: Record<ETSClassification, number>
  - difRate: number
  - meanAbsDelta: number
  - totalSampleSize: number
  - overallFairness: 'fair' | 'moderate_concern' | 'serious_concern'

## IRTParameters
- Source: `packages/shared/src/types/education.ts:16-27`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - difficulty: number
  - discrimination: number
  - guessing: number
  - infit: number
  - outfit: number

## QuestionOntology
- Source: `packages/shared/src/types/education.ts:47-58`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - subspecialty: string
  - topic: string
  - icd10: string[]
  - atcCodes: string[]

## ENAMEDQuestion
- Source: `packages/shared/src/types/education.ts:63-90`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - bankId: string
  - year: number
  - stem: string
  - options: QuestionOption[]
  - correctIndex: number
  - explanation: string
  - irt: IRTParameters
  - difficulty: DifficultyLevel
  - ontology: QuestionOntology
  - references: string[]
  - isAIGenerated: boolean
  - validatedBy: 'community' | 'expert' | 'both'

## QuestionOption
- Source: `packages/shared/src/types/education.ts:92-99`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - letter: string
  - text: string
  - feedback: string

## Exam
- Source: `packages/shared/src/types/education.ts:108-123`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - description: string
  - questionCount: number
  - timeLimitMinutes: number
  - questionIds: string[]
  - type: 'official_simulation' | 'custom' | 'practice' | 'review'
  - createdBy: string
  - createdAt: Date

## ExamAttempt
- Source: `packages/shared/src/types/education.ts:128-146`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - examId: string
  - userId: string
  - answers: Record<string, number>
  - markedForReview: string[]
  - timePerQuestion: Record<string, number>
  - totalTimeSeconds: number
  - startedAt: Date
  - completedAt: Date | null
  - score: TRIScore

## TRIScore
- Source: `packages/shared/src/types/education.ts:151-168`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: number
  - standardError: number
  - scaledScore: number
  - passThreshold: number
  - passed: boolean
  - correctCount: number
  - totalAttempted: number
  - areaBreakdown: Record<ENAMEDArea, AreaPerformance>

## AreaPerformance
- Source: `packages/shared/src/types/education.ts:170-175`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - correct: number
  - total: number
  - percentage: number
  - averageDifficulty: number

## Flashcard
- Source: `packages/shared/src/types/education.ts:184-199`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - front: string
  - back: string
  - questionId: string
  - ontology: QuestionOntology
  - tags: string[]
  - createdBy: string
  - createdAt: Date

## SM2State
- Source: `packages/shared/src/types/education.ts:204-217`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - cardId: string
  - easeFactor: number
  - interval: number
  - repetitions: number
  - nextReview: Date
  - lastReview: Date | null

## StudyPath
- Source: `packages/shared/src/types/education.ts:237-251`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - description: string
  - areas: ENAMEDArea[]
  - estimatedHours: number
  - moduleIds: string[]
  - difficulty: DifficultyLevel
  - prerequisites: string[]

## StudyModule
- Source: `packages/shared/src/types/education.ts:253-265`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - type: 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study'
  - content: string
  - estimatedMinutes: number
  - questionIds: string[]
  - flashcardIds: string[]

## UserProgress
- Source: `packages/shared/src/types/education.ts:271-289`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - userId: string
  - xp: number
  - level: number
  - streak: number
  - lastActivity: Date
  - completedExams: string[]
  - completedPaths: string[]
  - achievements: string[]
  - areaProficiency: Record<ENAMEDArea, number>

## QuestionBank
- Source: `packages/shared/src/types/education.ts:295-309`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - description: string
  - source: 'official_enamed' | 'residencia' | 'concurso' | 'ai_generated' | 'community'
  - yearRange: { start: number; end: number }
  - questionCount: number
  - areas: ENAMEDArea[]
  - isPremium: boolean

## FCROption
- Source: `packages/shared/src/types/fcr.ts:99-105`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - textPt: string
  - isCorrect: boolean
  - explanationPt: string
  - clinicalPearlPt: string

## FCRExplanation
- Source: `packages/shared/src/types/fcr.ts:108-119`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - keyFindings: string[]
  - systematicApproach: string
  - commonMistakes: string[]
  - clinicalCorrelation: string
  - references: string[]

## FCRCase
- Source: `packages/shared/src/types/fcr.ts:122-151`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - titlePt: string
  - clinicalPresentationPt: string
  - area: ENAMEDArea
  - difficulty: DifficultyLevel
  - dadosOptions: FCROption[]
  - padraoOptions: FCROption[]
  - hipoteseOptions: FCROption[]
  - condutaOptions: FCROption[]
  - correctDados: string[]
  - correctPadrao: string
  - correctHipotese: string
  - correctConduta: string
  - structuredExplanation: FCRExplanation
  - irt: IRTParameters
  - isPublic: boolean
  - isAIGenerated: boolean
  - timesAttempted: number
  - timesCompleted: number
  - avgScore: number

## FCRAttempt
- Source: `packages/shared/src/types/fcr.ts:158-181`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - caseId: string
  - userId: string
  - selectedDados: string[]
  - selectedPadrao: string | null
  - selectedHipotese: string | null
  - selectedConduta: string | null
  - confidenceDados: ConfidenceRating | null
  - confidencePadrao: ConfidenceRating | null
  - confidenceHipotese: ConfidenceRating | null
  - confidenceConduta: ConfidenceRating | null
  - stepTimes: Record<FCRLevel, number>
  - totalTimeSeconds: number | null
  - startedAt: Date
  - completedAt: Date | null

## FCRLevelResult
- Source: `packages/shared/src/types/fcr.ts:184-205`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - level: FCRLevel
  - label: string
  - correct: boolean
  - partialCredit: number
  - confidence: ConfidenceRating
  - quadrant: CalibrationQuadrant
  - weight: number
  - weightedScore: number
  - timeSpentMs: number
  - selectedOptionText: string
  - correctOptionText: string
  - selectedExplanation: string
  - correctExplanation: string
  - clinicalPearl: string

## FCRDetectedLacuna
- Source: `packages/shared/src/types/fcr.ts:208-212`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - type: 'LE' | 'LEm' | 'LIE'
  - level: FCRLevel
  - evidence: string

## FCRScore
- Source: `packages/shared/src/types/fcr.ts:215-229`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: number
  - standardError: number
  - scaledScore: number
  - passed: boolean
  - totalScore: number
  - percentageCorrect: number
  - levelResults: FCRLevelResult[]
  - calibrationScore: number
  - overconfidenceIndex: number
  - detectedLacunas: FCRDetectedLacuna[]
  - insights: string[]

## ConfidenceBinStats
- Source: `packages/shared/src/types/fcr.ts:236-246`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - confidence: ConfidenceRating
  - alpha: number
  - beta: number
  - expectedAccuracy: number
  - totalObservations: number

## ReliabilityPoint
- Source: `packages/shared/src/types/fcr.ts:249-258`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - binMidpoint: number
  - observedAccuracy: number
  - count: number
  - standardError: number

## FCRCalibrationDiagnostics
- Source: `packages/shared/src/types/fcr.ts:261-278`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - ece: number
  - mce: number
  - confidenceBins: ConfidenceBinStats[]
  - reliabilityDiagram: ReliabilityPoint[]
  - dunningKrugerIndex: number
  - dunningKrugerZone: DunningKrugerZone
  - calibrationDrift: number
  - calibrationTrending: 'improving' | 'stable' | 'degrading'

## LevelTransition
- Source: `packages/shared/src/types/fcr.ts:291-302`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - fromLevel: FCRLevel
  - toLevel: FCRLevel
  - pErrorGivenError: number
  - pErrorGivenCorrect: number
  - cascadeLift: number
  - observations: number

## FCRCascadeAnalysis
- Source: `packages/shared/src/types/fcr.ts:305-320`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - transitions: LevelTransition[]
  - hasCascadePattern: boolean
  - strongestCascade: LevelTransition | null
  - independentErrorRate: number
  - cascadeSeverity: number
  - levelErrorRates: Record<FCRLevel, number>
  - reasoningProfile: FCRReasoningProfile

## FCRAdaptiveRecommendation
- Source: `packages/shared/src/types/fcr.ts:334-349`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - caseId: string
  - selectionReason: FCRSelectionReason
  - expectedInformationGain: number
  - targetLevels: FCRLevel[]
  - targetCalibrationBins: ConfidenceRating[]
  - difficultyMatch: number
  - confidence: number

## FCRAttemptSummary
- Source: `packages/shared/src/types/fcr.ts:360-374`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - caseId: string
  - area: ENAMEDArea
  - difficulty: DifficultyLevel
  - theta: number
  - calibrationScore: number
  - overconfidenceIndex: number
  - completedAt: Date

## HLRFeatures
- Source: `packages/shared/src/types/hlr.ts:24-37`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - intercept: number
  - sqrtHistoryCount: number
  - logLastLag: number
  - correctStreak: number
  - normalizedDifficulty: number
  - failCount: number

## HLRWeights
- Source: `packages/shared/src/types/hlr.ts:57-66`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - values: number[]
  - trainingCount: number
  - trainingLoss: number
  - updatedAt: Date

## HLRPrediction
- Source: `packages/shared/src/types/hlr.ts:83-94`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - halfLife: number
  - predictedRetention: number
  - optimalReviewDays: number
  - elapsedDays: number
  - isOverdue: boolean

## ForgettingCurvePoint
- Source: `packages/shared/src/types/hlr.ts:97-102`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - day: number
  - retention: number

## PersonalizedForgettingCurve
- Source: `packages/shared/src/types/hlr.ts:105-116`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - identifier: string
  - label: string
  - halfLife: number
  - points: ForgettingCurvePoint[]
  - reviewMarkers: { day: number; correct: boolean }[]

## HLRTrainingObservation
- Source: `packages/shared/src/types/hlr.ts:123-130`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - features: HLRFeatures
  - recalled: boolean
  - deltaDays: number

## HLRTrainingConfig
- Source: `packages/shared/src/types/hlr.ts:133-144`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - learningRate: number
  - l2Lambda: number
  - targetRetention: number
  - maxHalfLife: number
  - minHalfLife: number

## MIRTItemParameters
- Source: `packages/shared/src/types/mirt.ts:55-66`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - discriminations: number[]
  - intercept: number
  - guessing: number
  - primaryDimension: ENAMEDArea

## MIRTAbilityProfile
- Source: `packages/shared/src/types/mirt.ts:81-96`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: Record<ENAMEDArea, number>
  - standardErrors: Record<ENAMEDArea, number>
  - confidenceIntervals: Record<ENAMEDArea, [number, number]>
  - covarianceMatrix: number[][]
  - dimensionProfiles: DimensionProfile[]
  - compositeTheta: number
  - estimation: MIRTEstimationInfo

## DimensionProfile
- Source: `packages/shared/src/types/mirt.ts:99-114`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - label: string
  - theta: number
  - se: number
  - ci: [number, number]
  - itemCount: number
  - rank: number

## MIRTEstimationInfo
- Source: `packages/shared/src/types/mirt.ts:117-128`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - iterations: number
  - converged: boolean
  - gradientNorm: number
  - totalItems: number
  - method: 'MAP' | 'EAP'

## MIRTConfig
- Source: `packages/shared/src/types/mirt.ts:135-148`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - maxIterations: number
  - convergenceThreshold: number
  - maxStepHalving: number
  - priorMean: number[]
  - priorCovariance: number[][]
  - minItemsPerDimension: number

## ICD10Node
- Source: `packages/shared/src/types/ontology.ts:27-42`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string
  - namePt: string
  - nameEn: string
  - level: ICD10Level
  - parent: string | null
  - children: string[]
  - depth: number

## ICD10Tree
- Source: `packages/shared/src/types/ontology.ts:47-54`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodes: Map<string, ICD10Node>
  - chapters: string[]
  - leafCount: number

## ICD10Index
- Source: `packages/shared/src/types/ontology.ts:59-68`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - tree: ICD10Tree
  - categoryToChapter: Map<string, string>
  - categoryToBlock: Map<string, string>
  - lcaCache: Map<string, string>

## ATCNode
- Source: `packages/shared/src/types/ontology.ts:117-130`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - code: string
  - namePt: string
  - nameEn: string
  - level: ATCLevel
  - parent: string | null
  - children: string[]

## ATCTree
- Source: `packages/shared/src/types/ontology.ts:135-142`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - nodes: Map<string, ATCNode>
  - roots: string[]
  - substanceCount: number

## SimilarityResult
- Source: `packages/shared/src/types/ontology.ts:171-180`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - similarity: number
  - pathLength: number
  - lca: string
  - lcaDepth: number

## MedicalConcept
- Source: `packages/shared/src/types/ontology.ts:185-202`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - icd10Codes: string[]
  - atcCodes: string[]
  - area: string
  - subspecialty: string
  - topic: string
  - keywords: string[]

## SimilarityMatrix
- Source: `packages/shared/src/types/ontology.ts:207-216`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - concepts: MedicalConcept[]
  - conceptIndex: Map<string, number>
  - matrix: Float32Array
  - size: number

## StructuralFeatures
- Source: `packages/shared/src/types/qgen.ts:110-153`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stemWordCount: number
  - stemSentenceCount: number
  - stemCharCount: number
  - avgWordsPerSentence: number
  - numAlternatives: number
  - alternativesWordCounts: Record<string, number>
  - alternativesLengthVariance: number
  - longestAlternative: string
  - shortestAlternative: string
  - questionFormat: string
  - isNegativeStem: boolean

## ClinicalFeatures
- Source: `packages/shared/src/types/qgen.ts:158-229`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## CognitiveFeatures
- Source: `packages/shared/src/types/qgen.ts:234-293`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - bloomLevel: BloomLevel
  - bloomConfidence: number
  - prerequisiteConcepts: string[]

## LinguisticFeatures
- Source: `packages/shared/src/types/qgen.ts:298-352`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields: none extracted

## DistractorFeatures
- Source: `packages/shared/src/types/qgen.ts:357-393`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - alternative: string
  - isCorrect: boolean
  - type: DistractorType
  - typeConfidence: number
  - plausibilityScore: number
  - semanticSimilarityToCorrect: number
  - sharesKeyConcepts: boolean
  - conceptOverlapCount: number
  - targetsMisconception: boolean
  - misconceptionId: string | null
  - misconceptionDescription: string | null

## ExtractedFeatures
- Source: `packages/shared/src/types/qgen.ts:398-425`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionId: string
  - extractionTimestamp: string
  - extractorVersion: string
  - structural: StructuralFeatures
  - clinical: ClinicalFeatures | null
  - cognitive: CognitiveFeatures
  - linguistic: LinguisticFeatures
  - distractors: DistractorFeatures[]

## QGenCorpusQuestion
- Source: `packages/shared/src/types/qgen.ts:434-467`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - source: QuestionSource
  - sourceYear: number | null
  - sourceExam: string | null
  - originalNumber: number | null
  - externalId: string | null
  - fullText: string
  - stem: string
  - alternatives: Record<string, string>
  - correctAnswer: string
  - explanation: string | null
  - questionType: QGenQuestionType
  - primaryArea: string
  - secondaryArea: string | null
  - topic: string | null
  - subtopic: string | null
  - extractedFeatures: ExtractedFeatures | null
  - hasImage: boolean
  - hasTable: boolean
  - hasLabValues: boolean
  - wordCount: number | null
  - irtDifficulty: number | null
  - irtDiscrimination: number | null
  - irtGuessing: number | null
  - createdAt: string
  - updatedAt: string

## QGenGeneratedQuestion
- Source: `packages/shared/src/types/qgen.ts:472-509`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - generationConfigId: string | null
  - generationTimestamp: string
  - stem: string
  - alternatives: Record<string, string>
  - correctAnswer: string
  - explanation: string | null
  - targetArea: string | null
  - targetTopic: string | null
  - targetDifficulty: number | null
  - targetBloomLevel: BloomLevel | null
  - generatedFeatures: ExtractedFeatures | null
  - validationStatus: ValidationStatus
  - qualityScores: QGenQualityScores | null
  - maxCorpusSimilarity: number | null
  - mostSimilarCorpusId: string | null
  - estimatedDifficulty: number | null
  - estimatedDiscrimination: number | null
  - reviewerId: string | null
  - reviewTimestamp: string | null
  - reviewNotes: string | null
  - reviewScore: number | null
  - llmModel: string | null
  - llmPromptVersion: string | null
  - llmRawResponse: unknown | null
  - createdAt: string
  - updatedAt: string

## QGenQualityScores
- Source: `packages/shared/src/types/qgen.ts:514-521`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - medicalAccuracy: number
  - linguisticQuality: number
  - distractorQuality: number
  - originality: number
  - difficultyMatch: number
  - overall: number

## QGenGenerationConfig
- Source: `packages/shared/src/types/qgen.ts:526-561`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - targetArea: ENAMEDArea | string
  - targetTopic: string
  - targetDifficulty: number
  - targetBloomLevel: BloomLevel
  - targetQuestionType: QGenQuestionType
  - llmModel: string
  - llmTemperature: number
  - llmMaxTokens: number
  - promptVersion: string
  - useFewShot: boolean
  - fewShotCount: number
  - minQualityScore: number
  - maxCorpusSimilarity: number
  - requireHumanReview: boolean
  - targetMisconceptions: string[]
  - ddlLacunaType: string

## QGenBatchOptions
- Source: `packages/shared/src/types/qgen.ts:566-571`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - count: number
  - configs: QGenGenerationConfig[]
  - parallelism: number
  - stopOnError: boolean

## QGenExamConfig
- Source: `packages/shared/src/types/qgen.ts:576-587`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionCount: number
  - areaDistribution: Record<string, number>
  - bloomDistribution: Partial<Record<BloomLevel, number>>
  - excludeQuestionIds: string[]
  - targetTheta: number

## QGenValidationResult
- Source: `packages/shared/src/types/qgen.ts:596-615`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questionId: string
  - validationTimestamp: string
  - overallScore: number
  - decision: ValidationDecision
  - issues: ValidationIssue[]
  - suggestions: string[]

## ValidationStageResult
- Source: `packages/shared/src/types/qgen.ts:617-623`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stageName: string
  - score: number
  - passed: boolean
  - details: Record<string, unknown>
  - issues: ValidationIssue[]

## ValidationIssue
- Source: `packages/shared/src/types/qgen.ts:625-631`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - severity: 'error' | 'warning' | 'info'
  - category: string
  - message: string
  - field: string
  - suggestion: string

## QGenHumanReview
- Source: `packages/shared/src/types/qgen.ts:636-656`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - questionId: string
  - reviewerId: string
  - medicalAccuracyScore: number
  - clinicalRelevanceScore: number
  - linguisticClarityScore: number
  - distractorQualityScore: number
  - difficultyAppropriateScore: number
  - overallScore: number
  - medicalIssues: string | null
  - linguisticIssues: string | null
  - suggestedChanges: string | null
  - decision: 'approve' | 'reject' | 'revise'
  - reviewDurationSeconds: number | null
  - createdAt: string

## QGenMisconception
- Source: `packages/shared/src/types/qgen.ts:665-684`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - code: string | null
  - name: string
  - areaId: string | null
  - topicId: string | null
  - incorrectBelief: string
  - correctUnderstanding: string
  - whyCommon: string | null
  - conceptsInvolved: string[] | null
  - prevalenceEstimate: number | null
  - sourceStudies: unknown | null
  - correctionStrategies: string[] | null
  - createdAt: string

## QGenStats
- Source: `packages/shared/src/types/qgen.ts:693-701`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalGenerated: number
  - byStatus: Record<ValidationStatus, number>
  - byArea: Record<string, number>
  - avgQualityScore: number
  - avgGenerationTime: number
  - approvalRate: number
  - costEstimate: number

## QGenCorpusStats
- Source: `packages/shared/src/types/qgen.ts:706-714`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalQuestions: number
  - bySource: Record<QuestionSource, number>
  - byArea: Record<string, number>
  - byType: Record<QGenQuestionType, number>
  - byBloomLevel: Record<BloomLevel, number>
  - avgDifficulty: number
  - avgWordCount: number

## QGenGenerateRequest
- Source: `packages/shared/src/types/qgen.ts:723-725`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - config: QGenGenerationConfig

## QGenGenerateResponse
- Source: `packages/shared/src/types/qgen.ts:730-736`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - question: QGenGeneratedQuestion
  - validation: QGenValidationResult
  - generationTimeMs: number
  - tokensUsed: number
  - cost: number

## QGenBatchRequest
- Source: `packages/shared/src/types/qgen.ts:741-743`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - options: QGenBatchOptions

## QGenBatchResponse
- Source: `packages/shared/src/types/qgen.ts:748-754`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - questions: QGenGenerateResponse[]
  - totalTimeMs: number
  - successCount: number
  - failureCount: number
  - totalCost: number

## QGenAdaptiveRequest
- Source: `packages/shared/src/types/qgen.ts:759-767`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - studentId: string
  - currentTheta: number

## RTIRTResponse
- Source: `packages/shared/src/types/rt-irt.ts:39-49`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - correct: boolean
  - responseTimeMs: number
  - logTime: number
  - area: ENAMEDArea

## SpeedAccuracyProfile
- Source: `packages/shared/src/types/rt-irt.ts:56-73`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - theta: number
  - tau: number
  - thetaSE: number
  - tauSE: number
  - thetaTauCorrelation: number
  - tradeoffCoefficient: number
  - responseBehaviors: ResponseBehavior[]
  - summary: SpeedAccuracySummary

## ResponseBehavior
- Source: `packages/shared/src/types/rt-irt.ts:76-86`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - itemId: string
  - logRT: number
  - expectedLogRT: number
  - residual: number
  - classification: ResponseBehaviorType

## SpeedAccuracySummary
- Source: `packages/shared/src/types/rt-irt.ts:97-110`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalResponses: number
  - meanRT: number
  - medianRT: number
  - behaviorCounts: Record<ResponseBehaviorType, number>
  - rapidGuessRate: number
  - thetaWithoutRapidGuess: number | null

## RTIRTConfig
- Source: `packages/shared/src/types/rt-irt.ts:117-132`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - thetaGridPoints: number
  - tauGridPoints: number
  - thetaRange: [number, number]
  - tauRange: [number, number]
  - priorCorrelation: number
  - rapidGuessThreshold: number
  - aberrantSlowThreshold: number

## MedicalCode
- Source: `packages/shared/src/types/schema-medical.ts:33-38`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - codeValue: string
  - codingSystem: CodingSystem
  - name: string
  - inCodeSet: string

## MedicalEntity
- Source: `packages/shared/src/types/schema-medical.ts:47-60`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - name: string
  - alternateName: string[]
  - description: string
  - code: MedicalCode[]
  - guideline: MedicalGuideline[]
  - legalStatus: string
  - medicineSystem: MedicineSystem
  - recognizingAuthority: Organization
  - relevantSpecialty: MedicalSpecialty
  - study: MedicalStudy[]

## DDxElement
- Source: `packages/shared/src/types/schema-medical.ts:188-191`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - diagnosis: MedicalCondition
  - distinguishingSign: MedicalSignOrSymptom[]

## MedicalConditionStage
- Source: `packages/shared/src/types/schema-medical.ts:196-199`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stageAsNumber: number
  - subStageSuffix: string

## DrugStrength
- Source: `packages/shared/src/types/schema-medical.ts:346-352`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - activeIngredient: string
  - availableIn: string
  - maximumIntake: MaximumDoseSchedule
  - strengthUnit: string
  - strengthValue: number

## DoseSchedule
- Source: `packages/shared/src/types/schema-medical.ts:357-362`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - doseUnit: string
  - doseValue: number
  - frequency: string
  - targetPopulation: string

## Organization
- Source: `packages/shared/src/types/schema-medical.ts:528-531`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - name: string
  - url: string

## QuantitativeValue
- Source: `packages/shared/src/types/schema-medical.ts:533-539`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - value: number
  - unitCode: string
  - unitText: string
  - minValue: number
  - maxValue: number

## OntologyRelationship
- Source: `packages/shared/src/types/schema-medical.ts:548-553`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - source: string; // Entity ID
  - target: string; // Entity ID
  - type: RelationshipType
  - weight: number

## MedicalOntology
- Source: `packages/shared/src/types/schema-medical.ts:571-587`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - conditions: Map<string, MedicalCondition>
  - drugs: Map<string, Drug>
  - tests: Map<string, MedicalTest>
  - anatomy: Map<string, AnatomicalStructure>
  - systems: Map<string, AnatomicalSystem>
  - signs: Map<string, MedicalSign>
  - symptoms: Map<string, MedicalSymptom>
  - therapies: Map<string, MedicalTherapy>
  - relationships: OntologyRelationship[]
  - byICD10: Map<string, MedicalCondition>
  - byATC: Map<string, Drug>

## QuestionGenerationConfig
- Source: `packages/shared/src/types/schema-medical.ts:610-616`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - patternType: QuestionPatternType
  - targetDifficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
  - targetArea: ENAMEDSpecialty
  - distractorCount: number
  - language: 'pt' | 'en'

## GeneratedQuestion
- Source: `packages/shared/src/types/schema-medical.ts:621-636`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stem: string
  - options: string[]
  - correctIndex: number
  - explanation: string
  - pattern: QuestionPatternType
  - ontologyRefs: OntologyReference[]
  - estimatedDifficulty: number
  - estimatedDiscrimination: number
  - status: 'draft' | 'ai_reviewed' | 'expert_validated'
  - generatedAt: string

## OntologyReference
- Source: `packages/shared/src/types/schema-medical.ts:641-646`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - entityId: string
  - entityType: string
  - role: 'subject' | 'correct_answer' | 'distractor' | 'context'
  - codes: MedicalCode[]

## ResearchSource
- Source: `packages/shared/src/types/theory-generation.ts:22-29`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - url: string
  - title: string
  - snippet: string
  - source: 'brazilian_guideline' | 'pubmed' | 'uptodate' | 'web'
  - relevance_score: number;  // 0-1
  - publication_year: number

## ResearchResult
- Source: `packages/shared/src/types/theory-generation.ts:34-41`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - topic: string
  - sources: ResearchSource[]
  - darwinMFCData: DarwinMFCDiseaseData;  // Disease data if available
  - citations: Citation[]
  - researchedAt: Date
  - cacheHit: boolean

## Citation
- Source: `packages/shared/src/types/theory-generation.ts:46-55`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - url: string
  - title: string
  - source: string;  // 'Diretriz SBC', 'PubMed', 'UpToDate', etc.
  - evidenceLevel: EvidenceLevel
  - publicationYear: number
  - authors: string
  - journal: string
  - doi: string

## DarwinMFCDiseaseData
- Source: `packages/shared/src/types/theory-generation.ts:60-74`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - title: string
  - definition: string
  - epidemiology: string
  - pathophysiology: string
  - clinicalPresentation: string
  - diagnosis: string
  - treatment: string
  - complications: string
  - prognosis: string
  - keyPoints: string[]
  - relatedDiseases: string[]
  - relatedMedications: string[]

## GeneratedTheoryTopic
- Source: `packages/shared/src/types/theory-generation.ts:79-118`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - topicId: string
  - title: string
  - description: string
  - area: ENAMEDArea
  - difficulty: TheoryDifficultyLevel
  - keyPoints: string[];  // 5-6 memorable takeaways
  - estimatedReadTime: number;  // in minutes
  - relatedDiseaseIds: string[]
  - relatedMedicationIds: string[]
  - citations: Citation[]
  - citationProvenance: Record<string, string[]>;  // section -> citation URLs

## ValidationResult
- Source: `packages/shared/src/types/theory-generation.ts:123-142`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - topicId: string
  - passed: boolean
  - score: number;  // 0-1, weighted average of all stages
  - flags: ValidationFlag[]

## TheoryValidationStageResult
- Source: `packages/shared/src/types/theory-generation.ts:147-152`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - passed: boolean
  - score: number;  // 0-1, weight varies by stage
  - weight: number;  // percentage weight in overall score (e.g., 0.30 for 30%)
  - issues: TheoryValidationIssue[]

## TheoryValidationIssue
- Source: `packages/shared/src/types/theory-generation.ts:157-162`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - severity: 'error' | 'warning' | 'info'
  - message: string
  - section: string
  - suggestion: string

## ValidationFlag
- Source: `packages/shared/src/types/theory-generation.ts:167-171`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - stage: ValidationStage
  - level: 'critical' | 'warning' | 'info'
  - message: string

## GenerationRequest
- Source: `packages/shared/src/types/theory-generation.ts:176-185`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - source: SourceType
  - sourceId: string;  // Darwin-MFC disease ID if source is darwin-mfc
  - topicTitle: string
  - area: ENAMEDArea
  - targetDifficulty: TheoryDifficultyLevel;  // defaults to inferred from source
  - includeWebResearch: boolean;  // defaults to true
  - relatedDiseases: string[]
  - relatedMedications: string[]

## BatchGenerationRequest
- Source: `packages/shared/src/types/theory-generation.ts:190-195`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - topics: GenerationRequest[]
  - concurrency: number;  // number of parallel generations (default: 3)
  - costLimit: number;  // max cost in USD (default: unlimited)
  - autoApproveThreshold: number;  // score >= this value skips human review (default: 0.90)

## GenerationJob
- Source: `packages/shared/src/types/theory-generation.ts:200-213`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - id: string
  - batchName: string
  - totalTopics: number
  - completedTopics: number
  - failedTopics: number
  - status: JobStatus
  - startedAt: Date
  - completedAt: Date
  - errorMessage: string
  - costUsd: number
  - createdAt: Date
  - updatedAt: Date

## GenerationJobTopic
- Source: `packages/shared/src/types/theory-generation.ts:218-225`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - jobId: string
  - topicId: string
  - status: 'pending' | 'completed' | 'failed'
  - errorMessage: string
  - costUsd: number
  - generatedAt: Date

## TheorySection
- Source: `packages/shared/src/types/theory-generation.ts:230-236`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - name: string
  - label: string
  - icon: string
  - content: string
  - citations: Citation[]

## AdminGenerationFormData
- Source: `packages/shared/src/types/theory-generation.ts:241-248`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - source: SourceType
  - sourceId: string
  - topicTitle: string
  - area: ENAMEDArea
  - difficulty: TheoryDifficultyLevel
  - quantity: number;  // for batch

## AdminReviewQueueItem
- Source: `packages/shared/src/types/theory-generation.ts:250-259`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - topicId: string
  - title: string
  - area: ENAMEDArea
  - difficulty: TheoryDifficultyLevel
  - validationScore: number
  - issues: ValidationFlag[]
  - generatedAt: Date
  - citations: Citation[]

## CostBreakdown
- Source: `packages/shared/src/types/theory-generation.ts:264-269`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - research: number;  // WebSearch and WebFetch calls
  - generation: number;  // LLM generation calls
  - validation: number;  // LLM validation calls
  - total: number

## GenerationStatistics
- Source: `packages/shared/src/types/theory-generation.ts:274-289`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - totalTopicsGenerated: number
  - topicsInStatus: Record<TopicStatus, number>
  - topicsByArea: Record<ENAMEDArea, number>
  - topicsByDifficulty: Record<TheoryDifficultyLevel, number>
  - averageValidationScore: number
  - autoApprovalRate: number;  // percentage of 0.90+ scores
  - averageCostPerTopic: number
  - totalCostUsd: number

## PromptContext
- Source: `packages/shared/src/types/theory-generation.ts:294-300`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - request: GenerationRequest
  - research: ResearchResult
  - baseContent: Partial<GeneratedTheoryTopic>
  - examples: GeneratedTheoryTopic[]
  - darwinMFCData: DarwinMFCDiseaseData

## UnifiedModelInputs
- Source: `packages/shared/src/types/unified-learner.ts:25-40`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - irtTheta: number | null
  - mirtProfile: MIRTAbilityProfile | null
  - fcrCalibrationScore: number | null
  - fcrOverconfidenceIndex: number | null
  - bktMastery: MasteryHeatmapData | null
  - hlrAverageRetention: number | null
  - engagement: EngagementMetrics | null

## EngagementMetrics
- Source: `packages/shared/src/types/unified-learner.ts:43-58`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - sessionsLast30Days: number
  - avgSessionMinutes: number
  - currentStreak: number
  - totalQuestionsAttempted: number
  - totalFlashcardReviews: number
  - totalFCRCases: number
  - daysSinceLastActivity: number

## UnifiedLearnerProfile
- Source: `packages/shared/src/types/unified-learner.ts:81-99`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - areaCompetency: Record<ENAMEDArea, AreaCompetency>
  - overallCompetency: number
  - passProbability: number
  - passCI: [number, number]
  - strengths: StrengthWeakness[]
  - weaknesses: StrengthWeakness[]
  - recommendations: StudyRecommendation[]
  - dataCompleteness: DataCompleteness
  - snapshotAt: Date

## AreaCompetency
- Source: `packages/shared/src/types/unified-learner.ts:102-119`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - composite: number
  - confidence: number
  - trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'

## StrengthWeakness
- Source: `packages/shared/src/types/unified-learner.ts:122-133`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - area: ENAMEDArea
  - description: string
  - source: CompetencySource
  - score: number
  - severity: number

## StudyRecommendation
- Source: `packages/shared/src/types/unified-learner.ts:140-155`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - priority: number
  - type: RecommendationType
  - area: ENAMEDArea
  - descriptionPt: string
  - reasonPt: string
  - priorityScore: number
  - action: RecommendedAction

## RecommendedAction
- Source: `packages/shared/src/types/unified-learner.ts:167-174`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - feature: 'exam' | 'flashcard' | 'fcr' | 'cat' | 'study_path'
  - href: string
  - labelPt: string

## DataCompleteness
- Source: `packages/shared/src/types/unified-learner.ts:181-192`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - hasIRT: boolean
  - hasMIRT: boolean
  - hasFCR: boolean
  - hasBKT: boolean
  - hasHLR: boolean
  - hasEngagement: boolean
  - overallCompleteness: number
  - isReliable: boolean

## LearnerTrajectoryPoint
- Source: `packages/shared/src/types/unified-learner.ts:199-208`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - date: Date
  - overallCompetency: number
  - areaCompetency: Record<ENAMEDArea, number>
  - passProbability: number

## LearnerTrajectory
- Source: `packages/shared/src/types/unified-learner.ts:211-220`
- Caveat: Inferred from TypeScript interface declarations; runtime validation may differ.
- Fields:
  - points: LearnerTrajectoryPoint[]
  - growthRate: number
  - hasPlateaued: boolean
  - estimatedDaysToTarget: number | null
