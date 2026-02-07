-- ============================================================
-- CIP Image Interpretation: Per-Option Explanations + Structured Explanations
-- Covers all 20 image cases with ~400 per-option teaching explanations
-- ============================================================
-- Prerequisites: Run cip-image-explanations-schema.sql first
-- (adds image_attribution TEXT and structured_explanation JSONB columns)
-- ============================================================

-- Helper function: merges explanation fields into existing JSONB option arrays
-- by matching option IDs (e.g., "m1", "f3", "d2") and adding explanation_pt + clinical_pearl_pt
CREATE OR REPLACE FUNCTION merge_option_explanations(
  existing_options JSONB,
  explanations JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  option_item JSONB;
  option_id TEXT;
BEGIN
  FOR option_item IN SELECT * FROM jsonb_array_elements(existing_options)
  LOOP
    option_id := option_item->>'id';
    IF explanations ? option_id THEN
      -- Merge explanation fields into the existing option object
      option_item := option_item || (explanations->option_id);
    END IF;
    result := result || jsonb_build_array(option_item);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Cases 1-10: X-Ray (5) + EKG (5)

-- CASE 1: Pneumonia lobar
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A radiografia de tórax em PA é o exame inicial de escolha para avaliar pneumonia, permitindo identificar consolidações, broncogramas aéreos e derrames associados de forma rápida e acessível.", "clinical_pearl_pt": "Sempre inicie com RX de tórax PA em pacientes com febre e tosse produtiva para identificar pneumonia comunitária precocemente."},
    "m2": {"explanation_pt": "A TC de tórax é reservada para casos complicados ou com suspeita de abscessos e empiema; não é o exame inicial para pneumonia comunitária simples devido ao custo e à radiação.", "clinical_pearl_pt": "Reserve a TC para quando o RX for inconclusivo ou houver falha terapêutica após 48-72h."},
    "m3": {"explanation_pt": "A USG de tórax pode detectar consolidações subpleurais e derrames, mas tem limitação para avaliar parênquima profundo e não substitui o RX como triagem inicial.", "clinical_pearl_pt": "USG point-of-care é útil para guiar toracocentese, mas não para avaliação pulmonar global."},
    "m4": {"explanation_pt": "A RM de tórax não é indicada para pneumonia aguda por ser demorada, cara e com menor disponibilidade, sem vantagem sobre RX ou TC neste cenário.", "clinical_pearl_pt": "RM torácica é reservada para avaliação de massas mediastinais ou invasão vascular, não para infecções agudas."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A consolidação no lobo inferior direito corresponde ao preenchimento alveolar por exsudato inflamatório, achado clássico de pneumonia lobar bacteriana.", "clinical_pearl_pt": "Consolidação homogênea lobar em RX é altamente sugestiva de pneumonia por Streptococcus pneumoniae."},
    "f2": {"explanation_pt": "O broncograma aéreo representa brônquios pérvios contrastando com alvéolos preenchidos por exsudato, confirmando consolidação parenquimatosa.", "clinical_pearl_pt": "Broncograma aéreo diferencia consolidação infecciosa de derrame pleural, onde os brônquios ficam comprimidos."},
    "f3": {"explanation_pt": "O velamento do seio costofrênico direito pode indicar pequeno derrame parapneumônico reacional, achado frequente em pneumonias de base.", "clinical_pearl_pt": "Sempre avalie os seios costofrênicos em pneumonias basais para detectar derrames parapneumônicos precoces."},
    "f4": {"explanation_pt": "Hiperinsuflação bilateral é achado de doença obstrutiva crônica (DPOC/enfisema), não compatível com quadro agudo febril de pneumonia.", "clinical_pearl_pt": "Hiperinsuflação com retificação diafragmática sugere DPOC, contrastando com opacidades de pneumonia."},
    "f5": {"explanation_pt": "Nódulo pulmonar solitário no ápice esquerdo sugere granuloma antigo ou lesão neoplásica; não explica febre aguda com tosse produtiva.", "clinical_pearl_pt": "Nódulos pulmonares solitários >8mm requerem seguimento com TC, mas não justificam sintomas infecciosos agudos."},
    "f6": {"explanation_pt": "Alargamento mediastinal sugere linfadenopatia, massa ou aneurisma aórtico, achados não compatíveis com pneumonia lobar aguda.", "clinical_pearl_pt": "Alargamento mediastinal em fumantes deve levantar suspeita de neoplasia pulmonar com acometimento linfonodal."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Pneumonia lobar na base direita é o diagnóstico correto, baseado na tríade clínica (febre, tosse produtiva, crepitações) e achado radiológico de consolidação lobar com broncograma aéreo.", "clinical_pearl_pt": "A pneumonia lobar clássica por pneumococo segue distribuição segmentar/lobar, diferente da broncopneumonia que é multifocal."},
    "d2": {"explanation_pt": "Tuberculose pulmonar tipicamente acomete ápices com cavitações e tem evolução subaguda/crônica, diferente da consolidação lobar basal aguda.", "clinical_pearl_pt": "TB deve ser suspeitada em tosse >3 semanas, perda de peso e sudorese noturna, não em quadros agudos de 5 dias."},
    "d3": {"explanation_pt": "O TEP raramente causa consolidação lobar homogênea; manifesta-se com atelectasia, derrame ou sinal de Hampton em cunha, geralmente sem febre alta.", "clinical_pearl_pt": "TEP deve ser suspeitado em dispneia súbita com D-dímero elevado e fatores de risco trombóticos."},
    "d4": {"explanation_pt": "Neoplasia pulmonar apresenta-se como massa irregular ou nódulo espiculado, não como consolidação homogênea aguda com sintomas infecciosos.", "clinical_pearl_pt": "Suspeite de neoplasia quando consolidação não resolve após tratamento antibiótico adequado por 6-8 semanas."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Antibioticoterapia empírica com cobertura para patógenos comunitários e coleta de hemoculturas antes do ATB são o manejo inicial padrão da pneumonia comunitária.", "clinical_pearl_pt": "Use o escore CURB-65 para decidir entre tratamento ambulatorial (0-1) e internação (>=2)."},
    "n2": {"explanation_pt": "Broncoscopia é procedimento invasivo reservado para falha terapêutica, suspeita de corpo estranho ou necessidade de diagnóstico microbiológico em imunossuprimidos.", "clinical_pearl_pt": "Broncoscopia com lavado broncoalveolar é indicada em pneumonias que não respondem ao ATB empírico."},
    "n3": {"explanation_pt": "TC de tórax com contraste é útil para investigar complicações como abscessos ou empiema, mas não é o próximo passo em pneumonia com diagnóstico radiológico claro.", "clinical_pearl_pt": "Solicite TC se o paciente não melhorar em 48-72h para investigar complicações supurativas."},
    "n4": {"explanation_pt": "Observação sem medicação é conduta inadequada em pneumonia bacteriana com febre e consolidação, pois retarda o tratamento e aumenta risco de sepse.", "clinical_pearl_pt": "Pneumonia bacteriana sem tratamento pode evoluir para sepse em horas; nunca adote conduta expectante."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Consolidação homogênea no lobo inferior direito", "Broncograma aéreo dentro da consolidação", "Velamento do seio costofrênico direito sugerindo derrame parapneumônico"],
    "systematicApproach": "Avalie sistematicamente: vias aéreas (traqueia centrada), mediastino (largura normal), coração (índice cardiotorácico), campos pulmonares (opacidades, consolidações), pleura (seios costofrênicos) e arcabouço ósseo.",
    "commonMistakes": ["Confundir consolidação lobar com derrame pleural isolado sem observar broncograma aéreo", "Não avaliar seios costofrênicos para derrame parapneumônico associado", "Solicitar TC desnecessariamente quando o RX já é diagnóstico"],
    "clinicalCorrelation": "Homem de 45 anos com febre alta, tosse produtiva há 5 dias e crepitações em base direita apresenta quadro clássico de pneumonia adquirida na comunidade, provavelmente pneumocócica.",
    "references": ["Diretrizes Brasileiras de Pneumonia Adquirida na Comunidade (SBPT 2022)", "IDSA/ATS Guidelines for Community-Acquired Pneumonia in Adults"]
  }'::jsonb
WHERE title_pt = 'Pneumonia lobar';

-- CASE 2: Pneumotórax espontâneo
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A radiografia de tórax em PA é o exame inicial de escolha para pneumotórax, permitindo visualizar a linha da pleura visceral e a ausência de trama vascular periférica.", "clinical_pearl_pt": "Em suspeita de pneumotórax, solicite RX em inspiração máxima; o RX em expiração não aumenta significativamente a sensibilidade."},
    "m2": {"explanation_pt": "A TC de tórax tem maior sensibilidade para pneumotórax pequeno e identifica blebs apicais, mas não é necessária como exame inicial quando o RX já é diagnóstico.", "clinical_pearl_pt": "Reserve TC para pneumotórax recorrente ou para planejar pleurodese cirúrgica identificando blebs."},
    "m3": {"explanation_pt": "O ECG avalia arritmias e isquemia cardíaca, não sendo útil para diagnóstico de pneumotórax que é uma condição mecânica pleural.", "clinical_pearl_pt": "ECG pode mostrar redução de voltagem em pneumotórax hipertensivo, mas não é exame diagnóstico."},
    "m4": {"explanation_pt": "A USG FAST é protocolo para trauma abdominal; a USG torácica pode detectar pneumotórax pela ausência de deslizamento pleural, mas RX é o padrão inicial.", "clinical_pearl_pt": "Na USG, ausência de lung sliding e presença de lung point confirmam pneumotórax à beira-leito."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Hipertransparência do hemitórax direito representa ar livre no espaço pleural entre a pleura visceral e parietal, achado cardinal do pneumotórax.", "clinical_pearl_pt": "Hipertransparência sem trama vascular na periferia é o sinal mais importante de pneumotórax no RX."},
    "f2": {"explanation_pt": "A ausência de trama vascular na periferia confirma colapso pulmonar parcial, pois o pulmão retraído não ocupa a região periférica do hemitórax.", "clinical_pearl_pt": "Compare a trama vascular entre os dois hemitórax para identificar assimetrias sutis em pneumotórax pequeno."},
    "f3": {"explanation_pt": "A visualização da linha da pleura visceral é o sinal patognomônico de pneumotórax, representando o limite do pulmão colapsado.", "clinical_pearl_pt": "A linha pleural visceral é fina e côncava; não confunda com pregas cutâneas que são grossas e se estendem além do campo pulmonar."},
    "f4": {"explanation_pt": "Consolidação lobar indica preenchimento alveolar por infecção ou edema, incompatível com hipertransparência e ausência de trama vascular.", "clinical_pearl_pt": "Consolidação causa opacidade (branco no RX), enquanto pneumotórax causa hipertransparência (preto)."},
    "f5": {"explanation_pt": "Derrame pleural bilateral causa opacidade nos seios costofrênicos com menisco, oposto à hipertransparência do pneumotórax.", "clinical_pearl_pt": "Derrame é líquido (opaco) na pleura; pneumotórax é ar (transparente) na pleura."},
    "f6": {"explanation_pt": "Fratura de clavícula é achado traumático ósseo que não explica dispneia súbita com ausência de murmúrio vesicular em jovem sem trauma.", "clinical_pearl_pt": "Fraturas de clavícula podem causar pneumotórax traumático, mas neste caso o pneumotórax é espontâneo."},
    "f7": {"explanation_pt": "Desvio traqueal para o lado contralateral indica pneumotórax hipertensivo, uma emergência que requer descompressão imediata com agulha.", "clinical_pearl_pt": "Desvio traqueal + hipotensão + turgência jugular = tríade clássica de pneumotórax hipertensivo."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Pneumotórax espontâneo primário direito é o diagnóstico correto em jovem magro e alto com dor torácica súbita e dispneia, causado por ruptura de blebs apicais subpleurais.", "clinical_pearl_pt": "Pneumotórax espontâneo primário é mais comum em homens jovens, magros e altos, com pico entre 15-30 anos."},
    "d2": {"explanation_pt": "Derrame pleural causa opacidade basal com menisco e macicez à percussão, não hipertransparência com timpanismo.", "clinical_pearl_pt": "Percussão timpânica diferencia pneumotórax (ar) de derrame pleural (líquido = macicez)."},
    "d3": {"explanation_pt": "Enfisema pulmonar causa hiperinsuflação bilateral crônica com retificação diafragmática, não hipertransparência unilateral aguda.", "clinical_pearl_pt": "Enfisema é bilateral e crônico; pneumotórax é unilateral e agudo."},
    "d4": {"explanation_pt": "Atelectasia lobar causa opacidade por colapso alveolar com desvio mediastinal ipsilateral, oposto ao pneumotórax.", "clinical_pearl_pt": "Atelectasia puxa o mediastino para o lado afetado; pneumotórax empurra para o lado oposto."},
    "d5": {"explanation_pt": "Hemotórax causa opacidade por sangue no espaço pleural, geralmente pós-traumático, não hipertransparência em jovem sem trauma.", "clinical_pearl_pt": "Hemotórax requer drenagem torácica se >300mL e investigação da fonte de sangramento."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Drenagem torácica com selo d''água é o tratamento padrão para pneumotórax espontâneo sintomático ou >2cm na distância ápice-cúpula.", "clinical_pearl_pt": "Insira o dreno no triângulo de segurança (4º-5º EIC, linha axilar média) para evitar lesão de órgãos."},
    "n2": {"explanation_pt": "Observação clínica com oxigênio suplementar é aceitável apenas para pneumotórax pequeno (<2cm) e assintomático, não para este paciente com dispneia.", "clinical_pearl_pt": "Oxigênio a 100% acelera a reabsorção do pneumotórax em 4x ao criar gradiente de nitrogênio."},
    "n3": {"explanation_pt": "Punção aspirativa com agulha é alternativa à drenagem em pneumotórax espontâneo primário moderado, mas a drenagem é preferida se houver falha aspirativa.", "clinical_pearl_pt": "Aspiração simples no 2º EIC linha hemiclavicular tem sucesso em 50-70% dos casos."},
    "n4": {"explanation_pt": "Toracotomia de emergência é reservada para pneumotórax com sangramento ativo ou falha de drenagem, sendo excessiva como abordagem inicial.", "clinical_pearl_pt": "Cirurgia com pleurodese é indicada após segundo episódio de pneumotórax espontâneo."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Hipertransparência do hemitórax direito sem trama vascular", "Linha da pleura visceral visível separando pulmão colapsado do espaço pleural", "Ausência de desvio traqueal indicando pneumotórax simples, não hipertensivo"],
    "systematicApproach": "Avalie simetria dos campos pulmonares, procure a linha da pleura visceral, verifique posição da traqueia e do mediastino para excluir pneumotórax hipertensivo, e avalie o grau de colapso pulmonar.",
    "commonMistakes": ["Confundir prega cutânea com linha da pleura visceral (prega cruza o campo pulmonar)", "Não medir a distância ápice-cúpula para quantificar o pneumotórax", "Solicitar TC desnecessariamente quando RX já é diagnóstico"],
    "clinicalCorrelation": "Homem jovem, magro, de 22 anos com dor torácica súbita à direita e dispneia há 2 horas, com ausência de murmúrio vesicular à direita, é o perfil clássico de pneumotórax espontâneo primário por ruptura de blebs.",
    "references": ["British Thoracic Society Guideline for Pleural Disease (2023)", "Diretrizes de Pneumotórax da Sociedade Brasileira de Cirurgia Torácica"]
  }'::jsonb
WHERE title_pt = 'Pneumotórax espontâneo';

-- CASE 3: ICC descompensada
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A radiografia de tórax PA é o exame inicial fundamental na ICC, permitindo avaliar cardiomegalia, redistribuição vascular pulmonar, edema intersticial e derrames pleurais.", "clinical_pearl_pt": "O RX de tórax mostra a sequência da congestão: cefalização > edema intersticial (Kerley B) > edema alveolar > derrame pleural."},
    "m2": {"explanation_pt": "O ecocardiograma é essencial para avaliar fração de ejeção e valvulopatias, mas o RX é o primeiro exame para avaliar sinais de congestão pulmonar.", "clinical_pearl_pt": "Ecocardiograma deve ser solicitado em todo paciente com ICC para classificar em FE preservada ou reduzida."},
    "m3": {"explanation_pt": "A TC de tórax é indicada para excluir TEP ou pneumonia, não como exame inicial na descompensação de ICC com quadro clínico clássico.", "clinical_pearl_pt": "TC é útil quando há dúvida diagnóstica entre ICC e outras causas de dispneia aguda."},
    "m4": {"explanation_pt": "A cintilografia miocárdica avalia isquemia e viabilidade, sendo mais relevante para investigação etiológica da ICC do que para manejo agudo da descompensação.", "clinical_pearl_pt": "Cintilografia miocárdica é indicada em ICC isquêmica para avaliar candidatos a revascularização."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Cardiomegalia com índice cardiotorácico >0.5 indica dilatação das câmaras cardíacas, achado cardinal da insuficiência cardíaca.", "clinical_pearl_pt": "ICT >0.5 no RX PA em ortostase confirma cardiomegalia; em AP no leito pode superestimar."},
    "f2": {"explanation_pt": "Cefalização do fluxo vascular indica redistribuição venosa pulmonar por hipertensão venosa, sinal precoce de congestão na ICC.", "clinical_pearl_pt": "Vasos dos lobos superiores mais calibrosos que os inferiores indicam pressão capilar pulmonar >12mmHg."},
    "f3": {"explanation_pt": "Linhas B de Kerley são linhas horizontais curtas na periferia das bases, representando septos interlobulares espessados por edema intersticial.", "clinical_pearl_pt": "Linhas B de Kerley são perpendiculares à pleura e medem 1-2cm, indicando pressão capilar pulmonar >20mmHg."},
    "f4": {"explanation_pt": "Derrame pleural bilateral em ICC é causado por aumento da pressão hidrostática, geralmente predominando à direita pela maior área de drenagem linfática.", "clinical_pearl_pt": "Derrames na ICC são transudatos; se unilateral ou refratário a diuréticos, investigue outras causas."},
    "f5": {"explanation_pt": "Nódulo pulmonar calcificado é achado incidental benigno (granuloma antigo), sem relação com o quadro de descompensação cardíaca.", "clinical_pearl_pt": "Calcificação completa em nódulo pulmonar indica natureza benigna e não requer seguimento."},
    "f6": {"explanation_pt": "Pneumotórax bilateral é raro e geralmente traumático ou iatrogênico, incompatível com dispneia progressiva e edema periférico.", "clinical_pearl_pt": "Pneumotórax causa dispneia súbita, não progressiva como na ICC."},
    "f7": {"explanation_pt": "Enfisema subcutâneo indica ar nos tecidos moles, geralmente por trauma ou barotrauma, sem relação com ICC.", "clinical_pearl_pt": "Enfisema subcutâneo cervical requer investigação de ruptura esofágica ou traqueobrônquica."},
    "f8": {"explanation_pt": "Consolidação no lobo médio indica pneumonia, mas o quadro clínico com ortopneia, edema de MMII e ausência de febre aponta para ICC.", "clinical_pearl_pt": "Diferencie edema alveolar de pneumonia: BNP elevado favorece ICC, leucocitose com febre favorece infecção."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "ICC descompensada é o diagnóstico correto, baseado em dispneia progressiva, ortopneia, edema de MMII e achados radiológicos de cardiomegalia, cefalização, linhas B e derrame bilateral.", "clinical_pearl_pt": "BNP >400pg/mL ou NT-proBNP >900pg/mL confirmam ICC como causa da dispneia em contexto clínico compatível."},
    "d2": {"explanation_pt": "Derrame pericárdico isolado causa cardiomegalia em moringa e sinais de tamponamento, não cefalização ou linhas de Kerley.", "clinical_pearl_pt": "Silhueta cardíaca em moringa (garrafa d''água) no RX sugere derrame pericárdico volumoso."},
    "d3": {"explanation_pt": "DPOC exacerbado apresenta hiperinsuflação, retificação diafragmática e aumento do espaço retroesternal, não cardiomegalia com edema intersticial.", "clinical_pearl_pt": "DPOC causa cor pulmonale direito, enquanto ICC sistólica causa dilatação esquerda predominante."},
    "d4": {"explanation_pt": "Pneumonia bilateral causa consolidações com febre e leucocitose, não cefalização vascular e linhas de Kerley sem febre.", "clinical_pearl_pt": "Na dúvida entre pneumonia e edema pulmonar, avalie BNP e procalcitonina para guiar o diagnóstico."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Furosemida endovenosa com monitorização rigorosa do balanço hídrico e peso diário é a base do tratamento agudo da ICC descompensada.", "clinical_pearl_pt": "Inicie furosemida 40mg EV e titule conforme diurese; meta de balanço negativo de 1-2L/dia."},
    "n2": {"explanation_pt": "Alta ambulatorial é inadequada em ICC descompensada com dispneia progressiva e sinais de congestão que requerem tratamento intra-hospitalar.", "clinical_pearl_pt": "Critérios de alta na ICC: euvolemia, transição para diuréticos orais, estabilidade hemodinâmica por 24h."},
    "n3": {"explanation_pt": "Intubação imediata é reservada para edema agudo de pulmão com insuficiência respiratória grave refratária a VNI, não como primeira medida.", "clinical_pearl_pt": "Tente VNI (CPAP ou BiPAP) antes da intubação em edema pulmonar agudo cardiogênico."},
    "n4": {"explanation_pt": "Pericardiocentese é indicada para tamponamento cardíaco com instabilidade hemodinâmica, não evidenciado neste caso de ICC.", "clinical_pearl_pt": "Pericardiocentese guiada por eco é indicada quando derrame pericárdico causa tamponamento."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Cardiomegalia com ICT >0.5", "Cefalização do fluxo vascular pulmonar", "Linhas B de Kerley nos campos inferiores", "Derrame pleural bilateral"],
    "systematicApproach": "Avalie sequencialmente: tamanho cardíaco (ICT), padrão vascular pulmonar (cefalização), sinais de edema intersticial (linhas B, espessamento peribrônquico), edema alveolar (opacidades perihilares em asa de borboleta) e derrames pleurais.",
    "commonMistakes": ["Confundir linhas B de Kerley com fibrose intersticial crônica", "Atribuir derrames pleurais bilaterais a pneumonia sem febre", "Não reconhecer cefalização vascular como sinal precoce de congestão"],
    "clinicalCorrelation": "Mulher de 68 anos com HAS e DM, dispneia progressiva há 2 semanas, ortopneia e edema de MMII apresenta quadro clássico de ICC descompensada por sobrecarga volêmica.",
    "references": ["Diretrizes Brasileiras de Insuficiência Cardíaca (SBC 2021)", "ACC/AHA Guidelines for Heart Failure Management"]
  }'::jsonb
WHERE title_pt = 'Insuficiência cardíaca congestiva';

-- CASE 4: Derrame pleural volumoso
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A radiografia de tórax PA é o exame inicial para derrame pleural, demonstrando velamento homogêneo, obliteração do seio costofrênico e sinal do menisco.", "clinical_pearl_pt": "O RX em PA detecta derrames >200mL; o perfil detecta a partir de 50mL pela obliteração do seio costofrênico posterior."},
    "m2": {"explanation_pt": "A TC de abdome investiga causas abdominais como ascite ou massas, mas não é o exame inicial para derrame pleural torácico.", "clinical_pearl_pt": "TC de abdome é útil quando suspeitar de causa sub-diafragmática como abscesso hepático ou pancreatite."},
    "m3": {"explanation_pt": "A RM de tórax pode caracterizar lesões pleurais complexas, mas tem disponibilidade limitada e não é rotina para derrame pleural.", "clinical_pearl_pt": "RM diferencia derrame de espessamento pleural melhor que TC em casos selecionados."},
    "m4": {"explanation_pt": "O PET-CT é indicado para estadiamento oncológico e detecção de metástases, não como exame inicial para investigação de derrame pleural.", "clinical_pearl_pt": "PET-CT é útil quando biópsia pleural é inconclusiva e há suspeita de mesotelioma ou carcinomatose."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Velamento homogêneo do hemitórax esquerdo indica grande volume de líquido pleural ocupando o espaço entre as pleuras visceral e parietal.", "clinical_pearl_pt": "Velamento completo de hemitórax sugere derrame >2L; avalie desvio mediastinal contralateral para estimar volume."},
    "f2": {"explanation_pt": "Obliteração do seio costofrênico esquerdo é o sinal mais precoce de derrame pleural na radiografia em PA.", "clinical_pearl_pt": "O seio costofrênico posterior obliterado no perfil detecta derrames menores que 50mL."},
    "f3": {"explanation_pt": "O sinal do menisco (curva de Damoiseau) representa a interface côncava superior do líquido pleural por efeito da gravidade e tensão superficial.", "clinical_pearl_pt": "A curva de Damoiseau é mais alta lateralmente e mais baixa medialmente, diferenciando derrame livre de loculado."},
    "f4": {"explanation_pt": "Pneumotórax causa hipertransparência, o oposto do velamento opaco causado por líquido no derrame pleural.", "clinical_pearl_pt": "Pneumotórax e derrame pleural são opostos no RX: ar é preto, líquido é branco."},
    "f5": {"explanation_pt": "Consolidação bilateral indica pneumonia ou edema pulmonar, não velamento homogêneo unilateral com menisco.", "clinical_pearl_pt": "Consolidações têm broncograma aéreo; derrames não têm, pois o líquido está fora do parênquima."},
    "f6": {"explanation_pt": "Massa mediastinal anterior sugere timoma, linfoma ou bócio mergulhante, não derrame pleural isolado.", "clinical_pearl_pt": "Use a regra dos 4 T''s para massas mediastinais anteriores: Timoma, Teratoma, Tireoide, Terrível linfoma."},
    "f7": {"explanation_pt": "Calcificação pleural indica sequela de empiema antigo, hemotórax organizado ou exposição ao asbesto, não derrame agudo.", "clinical_pearl_pt": "Placas pleurais calcificadas bilaterais são patognomônicas de exposição prévia ao asbesto."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Derrame pleural volumoso à esquerda é o diagnóstico correto, confirmado pelo velamento homogêneo com menisco em ex-tabagista com perda ponderal, sugerindo etiologia neoplásica.", "clinical_pearl_pt": "Os critérios de Light diferenciam transudato de exsudato: proteína >0.5, LDH >0.6 do soro ou LDH >2/3 do limite normal."},
    "d2": {"explanation_pt": "Atelectasia total do pulmão esquerdo causa velamento com desvio mediastinal ipsilateral (para a esquerda), enquanto derrame volumoso desvia contralateralmente.", "clinical_pearl_pt": "Desvio mediastinal diferencia derrame (empurra) de atelectasia (puxa) com velamento hemitorácico."},
    "d3": {"explanation_pt": "Pneumonia lobar esquerda causa consolidação segmentar com broncograma aéreo e febre, não velamento homogêneo com menisco sem febre.", "clinical_pearl_pt": "Pneumonia com derrame parapneumônico evolui com febre persistente e leucocitose; analise o líquido para pH e glicose."},
    "d4": {"explanation_pt": "Hemotórax traumático requer história de trauma torácico, ausente neste paciente com sintomas crônicos de perda de peso.", "clinical_pearl_pt": "Hemotórax tem hematócrito pleural >50% do sérico; drene imediatamente se >1500mL ou débito >200mL/h."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Toracocentese diagnóstica é essencial para análise bioquímica, citológica e microbiológica do líquido pleural, definindo etiologia e guiando tratamento.", "clinical_pearl_pt": "Envie líquido para proteínas, LDH, glicose, pH, celularidade, citologia oncótica e cultura; remova no máximo 1,5L por sessão para evitar edema de reexpansão."},
    "n2": {"explanation_pt": "Drenagem torácica imediata é indicada para empiema ou hemotórax, mas a abordagem inicial em derrame de etiologia indeterminada é diagnóstica.", "clinical_pearl_pt": "Drene imediatamente se líquido purulento (empiema), pH <7.2 ou glicose <40mg/dL."},
    "n3": {"explanation_pt": "ATB empírica é indicada para pneumonia com derrame parapneumônico, mas este paciente não tem febre ou sinais infecciosos.", "clinical_pearl_pt": "Não inicie ATB antes de confirmar etiologia infecciosa; derrame neoplásico não responde a antibióticos."},
    "n4": {"explanation_pt": "Broncoscopia investiga lesões endobrônquicas centrais, não sendo o próximo passo em derrame pleural sem massa hilar evidente.", "clinical_pearl_pt": "Broncoscopia é indicada se citologia pleural negativa e suspeita de neoplasia central com hemoptise."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Velamento homogêneo do hemitórax esquerdo", "Obliteração completa do seio costofrênico esquerdo", "Curva de Damoiseau (sinal do menisco) indicando derrame livre"],
    "systematicApproach": "Identifique opacidade homogênea, verifique obliteração dos seios costofrênicos, observe curvatura do menisco e avalie posição do mediastino (desvio contralateral sugere derrame volumoso, sem desvio sugere atelectasia associada).",
    "commonMistakes": ["Confundir derrame volumoso com atelectasia total sem avaliar desvio mediastinal", "Não realizar toracocentese diagnóstica antes de iniciar tratamento empírico", "Drenar volume excessivo de uma só vez causando edema de reexpansão"],
    "clinicalCorrelation": "Homem de 55 anos, ex-tabagista 30 maços-ano, com perda de 8kg em 2 meses, dispneia e dor pleurítica à esquerda sugere fortemente derrame pleural neoplásico, possivelmente por carcinoma broncogênico ou mesotelioma.",
    "references": ["Diretrizes de Doenças Pleurais da SBPT", "British Thoracic Society Pleural Disease Guideline (2023)"]
  }'::jsonb
WHERE title_pt = 'Derrame pleural volumoso';

-- CASE 5: Fratura de arcos costais
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A radiografia de tórax PA e perfil é o exame inicial para fraturas costais pós-trauma, permitindo identificar traços de fratura e excluir complicações como pneumotórax e hemotórax.", "clinical_pearl_pt": "Inclua incidência em perfil para visualizar fraturas de arcos posteriores, frequentemente ocultas no PA."},
    "m2": {"explanation_pt": "A TC de tórax é o padrão-ouro para fraturas costais, detectando fraturas ocultas no RX e complicações parenquimatosas, mas não é o exame inicial.", "clinical_pearl_pt": "TC detecta até 50% mais fraturas que o RX, mas só solicite se houver suspeita de complicação ou tórax instável."},
    "m3": {"explanation_pt": "A USG de tórax pode detectar fraturas costais com sensibilidade superior ao RX, mas não avalia adequadamente complicações pulmonares profundas.", "clinical_pearl_pt": "USG point-of-care detecta fraturas costais pela descontinuidade cortical e hematoma subperiosteal."},
    "m4": {"explanation_pt": "A cintilografia óssea detecta fraturas de estresse ou ocultas, mas demora 48-72h para positivar e não é indicada em trauma agudo.", "clinical_pearl_pt": "Cintilografia óssea é útil para fraturas de estresse em atletas, não para trauma contuso agudo."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Fratura do 7º arco costal esquerdo é identificada pela descontinuidade cortical ou traço de fratura na radiografia, compatível com trauma contuso.", "clinical_pearl_pt": "Fraturas dos arcos costais inferiores (7º-12º) podem estar associadas a lesões de baço (esquerda) ou fígado (direita)."},
    "f2": {"explanation_pt": "Fratura do 8º arco costal esquerdo adjacente ao 7º indica trauma de energia moderada, aumentando o risco de lesão esplênica associada.", "clinical_pearl_pt": "Duas ou mais fraturas costais à esquerda inferiormente devem levantar suspeita de lesão esplênica."},
    "f3": {"explanation_pt": "A ausência de pneumotórax e hemotórax confirma fraturas simples sem complicação pleural, permitindo tratamento conservador.", "clinical_pearl_pt": "Sempre busque sistematicamente pneumotórax e hemotórax em qualquer fratura costal, mesmo aparentemente simples."},
    "f4": {"explanation_pt": "Derrame pleural esquerdo indicaria hemotórax ou derrame reacional, não presente neste caso de fraturas simples.", "clinical_pearl_pt": "Hemotórax pós-fratura costal surge nas primeiras 24-48h; RX de controle é mandatório."},
    "f5": {"explanation_pt": "Consolidação pulmonar basal sugere contusão pulmonar, que geralmente aparece 6-24h após o trauma e não seria visível em 6h.", "clinical_pearl_pt": "Contusão pulmonar aparece tardiamente no RX; solicite controle em 24h se houver piora clínica."},
    "f6": {"explanation_pt": "Fratura de clavícula esquerda é trauma de ombro, não compatível com dor torácica lateral e equimose na parede lateral do tórax.", "clinical_pearl_pt": "Fraturas de clavícula são comuns em quedas sobre o ombro, não em impacto lateral torácico."},
    "f7": {"explanation_pt": "Enfisema subcutâneo indica ar nos tecidos moles por ruptura pleural ou traqueobrônquica, complicação ausente nestas fraturas simples.", "clinical_pearl_pt": "Enfisema subcutâneo palpável (crepitação) em trauma torácico indica pneumotórax até prova contrária."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Fraturas dos arcos costais esquerdos 7º e 8º é o diagnóstico correto, baseado no mecanismo de queda, dor inspiratória localizada e equimose na parede torácica lateral.", "clinical_pearl_pt": "Fraturas costais isoladas consolidam em 4-6 semanas; a principal complicação é atelectasia por hipoventilação antálgica."},
    "d2": {"explanation_pt": "Contusão pulmonar causa opacidade parenquimatosa no RX e hipoxemia, não presente nestas fraturas simples sem alteração parenquimatosa.", "clinical_pearl_pt": "Contusão pulmonar é comum em fraturas múltiplas e requer monitorização de oximetria e gasometria."},
    "d3": {"explanation_pt": "Tórax instável (flail chest) requer três ou mais fraturas consecutivas em dois pontos cada, com movimento paradoxal da parede; duas fraturas simples não configuram instabilidade.", "clinical_pearl_pt": "Tórax instável: 3+ costelas fraturadas em 2+ pontos com respiração paradoxal; requer suporte ventilatório."},
    "d4": {"explanation_pt": "Fratura de escápula requer trauma de alta energia (impacto direto no dorso), não compatível com queda de escada com impacto lateral.", "clinical_pearl_pt": "Fratura de escápula está associada a trauma grave com lesões vasculares torácicas em 50% dos casos."},
    "d5": {"explanation_pt": "Ruptura diafragmática é rara em traumas de baixa energia como queda de escada e apresenta herniação de vísceras abdominais no tórax.", "clinical_pearl_pt": "Suspeite de ruptura diafragmática quando vísceras abdominais são visualizadas no tórax ao RX."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Analgesia adequada (AINEs, opioides se necessário) e radiografia de controle em 7 dias para descartar complicações tardias é o manejo padrão de fraturas costais simples.", "clinical_pearl_pt": "Analgesia adequada previne atelectasia por hipoventilação; incentive tosse e inspiração profunda."},
    "n2": {"explanation_pt": "Drenagem torácica profilática é desnecessária na ausência de pneumotórax ou hemotórax documentados no RX.", "clinical_pearl_pt": "Drenagem torácica sem indicação expõe ao risco de infecção e lesão intercostal."},
    "n3": {"explanation_pt": "Enfaixamento torácico é prática obsoleta e contraindicada, pois restringe a expansão torácica e aumenta o risco de atelectasia e pneumonia.", "clinical_pearl_pt": "Nunca enfaixe o tórax em fraturas costais; a restrição respiratória agrava o quadro pulmonar."},
    "n4": {"explanation_pt": "Fixação cirúrgica costal é reservada para tórax instável (flail chest) ou fraturas com grande desvio, não para fraturas simples de dois arcos.", "clinical_pearl_pt": "Fixação cirúrgica com placas em tórax instável reduz tempo de ventilação mecânica e internação em UTI."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Fratura do 7º arco costal esquerdo com descontinuidade cortical", "Fratura do 8º arco costal esquerdo adjacente", "Ausência de pneumotórax ou hemotórax associado"],
    "systematicApproach": "Em trauma torácico, avalie sistematicamente: arcabouço ósseo (costelas, clavículas, escápulas, coluna), pleura (pneumotórax, hemotórax), parênquima pulmonar (contusão, atelectasia), mediastino (alargamento, pneumomediastino) e diafragma (elevação, herniação).",
    "commonMistakes": ["Não solicitar perfil para detectar fraturas posteriores ocultas", "Esquecer de buscar pneumotórax ou hemotórax associado", "Realizar enfaixamento torácico restritivo aumentando risco de complicações pulmonares"],
    "clinicalCorrelation": "Homem de 40 anos com queda de escada há 6 horas, dor intensa à inspiração e equimose na parede torácica lateral esquerda apresenta fraturas costais simples sem complicação visceral, necessitando analgesia e acompanhamento radiológico.",
    "references": ["ATLS - Advanced Trauma Life Support (10ª edição)", "Eastern Association for Surgery of Trauma - Practice Guidelines for Rib Fractures"]
  }'::jsonb
WHERE title_pt = 'Fratura de arcos costais';

-- CASE 6: IAM com supra de ST em parede inferior
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "O ECG de 12 derivações é o exame inicial obrigatório em suspeita de síndrome coronariana aguda, devendo ser realizado em até 10 minutos da chegada ao pronto-socorro.", "clinical_pearl_pt": "Porta-ECG <10 minutos é meta de qualidade em dor torácica; cada minuto de atraso aumenta a área de necrose miocárdica."},
    "m2": {"explanation_pt": "O RX de tórax avalia complicações como edema pulmonar ou alargamento mediastinal (dissecção aórtica), mas não diagnostica IAM.", "clinical_pearl_pt": "RX tórax normal não exclui IAM; porém mediastino alargado sugere dissecção aórtica, contraindicando trombólise."},
    "m3": {"explanation_pt": "O ecocardiograma identifica hipocinesia segmentar e complicações mecânicas do IAM, mas o ECG é prioritário para decisão de reperfusão.", "clinical_pearl_pt": "Eco à beira-leito detecta hipocinesia de parede inferior em minutos, apoiando o diagnóstico de IAM."},
    "m4": {"explanation_pt": "O teste ergométrico é absolutamente contraindicado em IAM agudo ou síndrome coronariana instável pelo risco de arritmia fatal.", "clinical_pearl_pt": "Teste ergométrico só é indicado para estratificação de risco após estabilização do IAM, nunca na fase aguda."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Supradesnivelamento de ST em DII, DIII e aVF indica lesão transmural aguda da parede inferior do ventrículo esquerdo, geralmente por oclusão da coronária direita.", "clinical_pearl_pt": "Supra de ST em derivações inferiores: sempre avalie V3R e V4R para descartar extensão para ventrículo direito."},
    "f2": {"explanation_pt": "Infradesnivelamento recíproco de ST em DI e aVL aumenta a especificidade para IAM inferior, refletindo um vetor de lesão oposto nas derivações laterais altas.", "clinical_pearl_pt": "Alterações recíprocas são altamente específicas para IAM; sua presença praticamente confirma o diagnóstico."},
    "f3": {"explanation_pt": "Ondas Q patológicas em DIII indicam necrose miocárdica já estabelecida na parede inferior, sugerindo evolução do infarto.", "clinical_pearl_pt": "Onda Q >40ms de duração e >25% da amplitude da onda R indica necrose transmural irreversível."},
    "f4": {"explanation_pt": "O bloqueio de ramo esquerdo (BRE) altera toda a repolarização e pode mascarar supra de ST; em BRE novo, use critérios de Sgarbossa.", "clinical_pearl_pt": "BRE novo + dor torácica é equivalente a STEMI e indica reperfusão imediata."},
    "f5": {"explanation_pt": "A fibrilação atrial causa ritmo irregularmente irregular sem ondas P; não está presente neste traçado de IAM com ritmo sinusal.", "clinical_pearl_pt": "FA pode complicar IAM por perda da contração atrial e redução de 20-25% do débito cardíaco."},
    "f6": {"explanation_pt": "QT prolongado pode ocorrer na fase aguda do IAM, mas não é o achado diagnóstico principal e pode predispor a torsades de pointes.", "clinical_pearl_pt": "Monitore QT no IAM; QTc >500ms aumenta risco de torsades de pointes e morte súbita."},
    "f7": {"explanation_pt": "A onda delta indica pré-excitação ventricular (síndrome de WPW), um achado de via acessória incompatível com padrão de IAM.", "clinical_pearl_pt": "WPW pode causar taquicardia de QRS largo, mas não produz supra de ST em derivações contíguas."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "IAM com supra de ST em parede inferior é confirmado pela tríade: dor torácica típica, supra de ST em DII/DIII/aVF e alterações recíprocas em DI/aVL, indicando oclusão coronariana aguda.", "clinical_pearl_pt": "IAM inferior é causado por oclusão da coronária direita em 85% dos casos e da circunflexa em 15%."},
    "d2": {"explanation_pt": "Angina instável não apresenta supradesnivelamento persistente de ST; pode ter infradesnivelamento ou inversão de T sem elevação enzimática significativa.", "clinical_pearl_pt": "NSTEMI e angina instável diferem pela elevação de troponina; ambos não têm supra de ST persistente."},
    "d3": {"explanation_pt": "Pericardite aguda causa supra de ST côncavo difuso em múltiplas derivações sem recíprocas, com infra de PR, diferindo do padrão territorial do IAM.", "clinical_pearl_pt": "Pericardite: supra de ST côncavo difuso + infra de PR + dor posicional; IAM: supra convexo territorial + recíprocas."},
    "d4": {"explanation_pt": "Dissecção aórtica pode causar IAM por extensão ao óstio coronariano, mas apresenta dor torácica dilacerante irradiada para dorso, diferente da dor opressiva.", "clinical_pearl_pt": "Sempre exclua dissecção aórtica antes de trombólise; mediastino alargado no RX é sinal de alerta."},
    "d5": {"explanation_pt": "TEP maciça pode causar supra de ST em V1-V3 com padrão S1Q3T3 e sobrecarga de VD, não supra de ST em derivações inferiores com recíprocas laterais.", "clinical_pearl_pt": "TEP: taquicardia sinusal é o achado ECG mais comum; padrão S1Q3T3 ocorre em apenas 10-20% dos casos."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Cateterismo cardíaco de emergência com angioplastia primária é o tratamento de escolha para STEMI quando disponível em tempo hábil (porta-balão <90 minutos).", "clinical_pearl_pt": "Meta porta-balão <90min em centros com hemodinâmica; se transferência necessária, porta-balão <120min."},
    "n2": {"explanation_pt": "Trombólise com alteplase é alternativa quando angioplastia primária não está disponível em <120 minutos, mas é inferior à angioplastia em desfechos.", "clinical_pearl_pt": "Trombólise é mais eficaz nas primeiras 3h de sintomas; após 12h, o benefício é mínimo."},
    "n3": {"explanation_pt": "Observação com troponina seriada é estratégia para SCA sem supra de ST; em STEMI, o tempo é músculo e a reperfusão não pode aguardar.", "clinical_pearl_pt": "Em STEMI, não espere resultado de troponina para iniciar reperfusão; o diagnóstico é pelo ECG."},
    "n4": {"explanation_pt": "Alta com AAS ambulatorial é conduta absolutamente inadequada em STEMI agudo, que requer internação imediata e reperfusão.", "clinical_pearl_pt": "Nunca libere paciente com dor torácica sem ECG e troponina; IAM perdido é a maior causa de processos em emergência."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Supradesnivelamento de ST em DII, DIII e aVF indicando lesão transmural inferior", "Infradesnivelamento recíproco de ST em DI e aVL confirmando especificidade", "Ondas Q patológicas em DIII indicando necrose miocárdica inicial"],
    "systematicApproach": "Avalie sistematicamente o ECG: ritmo e frequência, eixo elétrico, intervalos (PR, QRS, QT), morfologia de ondas P e QRS, segmento ST em todas as derivações buscando supra territorial com recíprocas, e ondas T.",
    "commonMistakes": ["Confundir supra de ST inferior com repolarização precoce benigna (ausência de recíprocas na precoce)", "Não solicitar derivações direitas V3R/V4R para avaliar extensão ao ventrículo direito", "Atrasar reperfusão esperando resultado de troponina"],
    "clinicalCorrelation": "Homem de 62 anos, tabagista com dislipidemia, apresentando dor opressiva torácica irradiada para MSE há 2 horas com sudorese e náusea é quadro clássico de IAM; fatores de risco somados à clínica e ECG não deixam dúvida diagnóstica.",
    "references": ["Diretrizes da Sociedade Brasileira de Cardiologia sobre IAM com Supra de ST (2019)", "AHA/ACC Guidelines for Management of ST-Elevation Myocardial Infarction"]
  }'::jsonb
WHERE title_pt = 'IAM com supra de ST em parede inferior';

-- CASE 7: Fibrilação atrial
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "O ECG de 12 derivações é o exame essencial para diagnosticar fibrilação atrial, demonstrando ausência de ondas P organizadas, ondas f fibrilatórias e intervalos RR irregulares.", "clinical_pearl_pt": "O ECG confirma FA em segundos; a tríade diagnóstica é ausência de ondas P, ondas f e RR irregularmente irregular."},
    "m2": {"explanation_pt": "O Holter 24h é indicado para FA paroxística com episódios intermitentes, mas em sintomas agudos sustentados há 3 dias, o ECG de repouso é suficiente.", "clinical_pearl_pt": "Holter é útil para documentar carga de FA paroxística e avaliar controle de frequência ao longo do dia."},
    "m3": {"explanation_pt": "O ecocardiograma transesofágico (Eco TE) é indicado para excluir trombo em átrio esquerdo antes de cardioversão em FA >48h, não para diagnóstico inicial.", "clinical_pearl_pt": "Eco TE é obrigatório antes de cardioversão se FA >48h sem anticoagulação prévia de 3 semanas."},
    "m4": {"explanation_pt": "O monitor de eventos é indicado para sintomas raros e paroxísticos, inadequado para palpitações irregulares sustentadas há 3 dias.", "clinical_pearl_pt": "Monitor de eventos (loop recorder) é indicado para síncope recorrente inexplicada ou palpitações infrequentes."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Ausência de ondas P indica que o nó sinusal perdeu o comando atrial, substituído por múltiplos focos de despolarização caótica nas veias pulmonares.", "clinical_pearl_pt": "Sem ondas P organizadas, o ritmo não é sinusal; busque ondas f na linha de base para confirmar FA."},
    "f2": {"explanation_pt": "Intervalos RR irregulares sem padrão repetitivo são o hallmark da FA, causados pela condução variável dos impulsos atriais caóticos pelo nó AV.", "clinical_pearl_pt": "Ritmo irregularmente irregular é praticamente patognomônico de FA; a única exceção é TAM."},
    "f3": {"explanation_pt": "Ondas f fibrilatórias são deflexões irregulares de baixa amplitude na linha de base, representando atividade atrial caótica com frequência de 350-600/min.", "clinical_pearl_pt": "Ondas f finas e irregulares diferenciam FA de flutter atrial, que tem ondas F regulares em dente de serra."},
    "f4": {"explanation_pt": "Ondas P normais sinusais indicam ritmo sinusal normal, incompatível com a irregularidade RR e a ausência de ondas P organizadas.", "clinical_pearl_pt": "Onda P sinusal é positiva em DI e DII, com duração <120ms e eixo entre 0-75 graus."},
    "f5": {"explanation_pt": "Ondas F em dente de serra são características de flutter atrial típico, não da fibrilação atrial onde as ondas f são irregulares e de baixa amplitude.", "clinical_pearl_pt": "Flutter atrial tem atividade atrial organizada a 250-350/min; FA tem atividade caótica a 350-600/min."},
    "f6": {"explanation_pt": "BAV de 1º grau causa PR prolongado >200ms com condução 1:1, incompatível com FA onde não há ondas P discretas para medir o PR.", "clinical_pearl_pt": "Na FA, não se pode medir intervalo PR pois não existem ondas P organizadas."},
    "f7": {"explanation_pt": "Extrassístoles ventriculares (ESV) frequentes causam QRS precoces alargados, mas não explicam ausência total de ondas P e irregularidade sustentada.", "clinical_pearl_pt": "ESV têm QRS prematuro sem onda P precedente; FA tem ausência completa de ondas P."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "FA com resposta ventricular alta é o diagnóstico correto, baseado na ausência de ondas P, ondas f fibrilatórias e RR irregulares em paciente com HAS e IC, fatores de risco clássicos.", "clinical_pearl_pt": "FA é a arritmia sustentada mais comum; prevalência aumenta com idade, atingindo 10% acima de 80 anos."},
    "d2": {"explanation_pt": "Flutter atrial apresenta ondas F regulares em dente de serra, tipicamente com condução AV fixa (2:1, 3:1), produzindo ritmo ventricular regular, diferente da FA.", "clinical_pearl_pt": "Flutter atrial típico tem FC atrial ~300/min; com condução 2:1, FC ventricular é ~150/min regular."},
    "d3": {"explanation_pt": "TPSV é taquicardia de QRS estreito regular com início e término súbitos, não irregular como a FA.", "clinical_pearl_pt": "TPSV responde a manobras vagais e adenosina; FA não termina com essas intervenções."},
    "d4": {"explanation_pt": "Taquicardia sinusal tem ondas P sinusais normais antes de cada QRS com ritmo regular, diferente da FA sem ondas P.", "clinical_pearl_pt": "Taquicardia sinusal é resposta fisiológica; trate a causa (febre, hipovolemia, dor), não o ritmo."},
    "d5": {"explanation_pt": "Síndrome de WPW apresenta PR curto, onda delta e QRS alargado em ritmo sinusal, podendo degenerar em FA pré-excitada, mas não é o diagnóstico primário.", "clinical_pearl_pt": "FA em WPW é emergência: condução anterógrada pela via acessória pode causar FV; evite bloqueadores do nó AV."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Controle de frequência com betabloqueador (metoprolol) e avaliação de anticoagulação pelo escore CHA2DS2-VASc é a abordagem inicial padrão em FA estável.", "clinical_pearl_pt": "CHA2DS2-VASc >= 2 em mulheres ou >= 1 em homens indica anticoagulação com DOAC ou varfarina."},
    "n2": {"explanation_pt": "Cardioversão elétrica imediata é reservada para FA com instabilidade hemodinâmica (hipotensão, choque, isquemia); esta paciente está estável.", "clinical_pearl_pt": "Cardioversão elétrica em FA estável só após Eco TE para excluir trombo ou 3 semanas de anticoagulação."},
    "n3": {"explanation_pt": "Ablação por cateter (isolamento das veias pulmonares) é indicada para FA sintomática refratária a drogas, não como primeira intervenção.", "clinical_pearl_pt": "Ablação de FA tem taxa de sucesso de 70-80% em FA paroxística e 50-60% em FA persistente."},
    "n4": {"explanation_pt": "Implante de marca-passo é indicado para bradiarritmias, não para taquiarritmia como FA com resposta ventricular alta.", "clinical_pearl_pt": "Marca-passo na FA só é indicado após ablação do nó AV (strategy pill-in-the-pocket) em casos refratários."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Ausência completa de ondas P atriais organizadas", "Intervalos RR irregularmente irregulares", "Ondas f fibrilatórias na linha de base"],
    "systematicApproach": "Avalie presença e morfologia das ondas P, regularidade dos intervalos RR, presença de ondas fibrilatórias na linha de base e frequência ventricular para classificar FA em resposta ventricular alta (>110), controlada (60-110) ou baixa (<60).",
    "commonMistakes": ["Confundir ondas f fibrilatórias finas com linha de base plana (FA de ondas finas)", "Diagnosticar flutter atrial quando as ondas são irregulares e de baixa amplitude", "Não calcular CHA2DS2-VASc para avaliar necessidade de anticoagulação"],
    "clinicalCorrelation": "Mulher de 72 anos com HAS e IC apresentando palpitações irregulares há 3 dias e tontura tem alto risco tromboembólico (CHA2DS2-VASc >= 4) e requer controle de frequência e anticoagulação imediata.",
    "references": ["Diretrizes Brasileiras de Fibrilação Atrial (SBC 2020)", "ESC Guidelines for Atrial Fibrillation Management (2024)"]
  }'::jsonb
WHERE title_pt = 'Fibrilação atrial';

-- CASE 8: Bloqueio AV 2º grau Mobitz II
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "O ECG de 12 derivações é essencial para diagnosticar BAV 2º grau Mobitz II, demonstrando ondas P bloqueadas com intervalo PR constante nos batimentos conduzidos.", "clinical_pearl_pt": "ECG é diagnóstico imediato de BAV; identifique ondas P sem QRS para confirmar bloqueio."},
    "m2": {"explanation_pt": "O Holter 24h documenta a frequência e duração dos bloqueios em casos paroxísticos, mas em paciente sintomático agudo, o ECG de repouso é suficiente.", "clinical_pearl_pt": "Holter quantifica pausas e correlaciona com sintomas em BAV intermitente."},
    "m3": {"explanation_pt": "O estudo eletrofisiológico localiza o nível do bloqueio (nodal vs. infranodal) e avalia a necessidade de marca-passo, mas é realizado após o diagnóstico eletrocardiográfico.", "clinical_pearl_pt": "EEF mostra intervalo HV prolongado em Mobitz II, confirmando bloqueio no sistema His-Purkinje."},
    "m4": {"explanation_pt": "O tilt test avalia síncope neuromediada (vasovagal), não bloqueios AV de condução, sendo inadequado neste contexto.", "clinical_pearl_pt": "Tilt test é positivo em síncope vasovagal com resposta de bradicardia e hipotensão reflexa."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Ondas P não seguidas de QRS (bloqueio intermitente) indicam falha de condução AV, achado cardinal de BAV de 2º grau.", "clinical_pearl_pt": "Conte a relação P:QRS (ex: 3:2, 4:3) para quantificar a gravidade do bloqueio."},
    "f2": {"explanation_pt": "PR constante nos batimentos conduzidos é o que diferencia Mobitz II (PR fixo) de Mobitz I/Wenckebach (PR progressivamente prolongado).", "clinical_pearl_pt": "Em Mobitz II, o PR é fixo porque o bloqueio é abrupto no sistema His-Purkinje, não gradual no nó AV."},
    "f3": {"explanation_pt": "QRS alargado >0.12s indica doença do sistema de condução distal (His-Purkinje), típico de Mobitz II e com alto risco de progressão para BAV total.", "clinical_pearl_pt": "QRS largo em BAV 2º grau = bloqueio infranodal = alto risco de BAV total = marca-passo indicado."},
    "f4": {"explanation_pt": "Prolongamento progressivo do PR antes de bloqueio é padrão de Mobitz I (Wenckebach), bloqueio nodal geralmente benigno, diferente do Mobitz II.", "clinical_pearl_pt": "Wenckebach: PR se prolonga até bloquear, depois encurta; é nodal e geralmente não precisa de marca-passo."},
    "f5": {"explanation_pt": "Dissociação AV completa com ritmo de escape ventricular é BAV 3º grau (total), mais grave que o bloqueio intermitente do 2º grau.", "clinical_pearl_pt": "BAV total: ondas P e QRS completamente independentes com FC ventricular 20-40 bpm."},
    "f6": {"explanation_pt": "BRD isolado alarga QRS com padrão rsR'' em V1, mas mantém condução AV 1:1 sem ondas P bloqueadas.", "clinical_pearl_pt": "BRD + bloqueio fascicular anterior sugere doença de condução bilateral, predispondo a Mobitz II."},
    "f7": {"explanation_pt": "Ritmo juncional acelerado tem QRS estreito regular a 70-130bpm sem ondas P precedendo QRS, diferente do bloqueio AV.", "clinical_pearl_pt": "Ritmo juncional é escape; Mobitz II é falha de condução com ondas P presentes."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "BAV 2º grau Mobitz II é confirmado por bloqueio intermitente com PR constante e QRS largo, indicando doença infranodal com alto risco de progressão para BAV total.", "clinical_pearl_pt": "Mobitz II é indicação classe I para marca-passo definitivo, mesmo em assintomáticos, pelo risco de assistolia."},
    "d2": {"explanation_pt": "BAV 1º grau tem PR prolongado >200ms em todos os batimentos, sem bloqueio; todas as ondas P são conduzidas.", "clinical_pearl_pt": "BAV 1º grau isolado é benigno; só requer marca-passo se muito prolongado (>300ms) com sintomas."},
    "d3": {"explanation_pt": "BAV 2º grau Mobitz I (Wenckebach) tem PR progressivamente prolongado até bloquear, bloqueio nodal geralmente benigno em jovens.", "clinical_pearl_pt": "Wenckebach em atletas durante o sono é fisiológico; Mobitz II nunca é fisiológico."},
    "d4": {"explanation_pt": "BAV 3º grau total apresenta dissociação AV completa com ondas P e QRS totalmente independentes, mais grave que o bloqueio intermitente.", "clinical_pearl_pt": "BAV total com escape ventricular <40bpm é emergência; marca-passo transcutâneo enquanto aguarda definitivo."},
    "d5": {"explanation_pt": "Síndrome do nó sinusal causa bradicardia sinusal ou pausas por disfunção do nó SA, não bloqueios AV.", "clinical_pearl_pt": "Síndrome bradi-taqui: alternância de bradicardia sinusal e FA paroxística, indicação de marca-passo."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Internação e implante de marca-passo definitivo (DDD) é o tratamento indicado para BAV 2º grau Mobitz II, independentemente dos sintomas, pelo alto risco de BAV total.", "clinical_pearl_pt": "Marca-passo DDD é preferido em Mobitz II para manter sincronia AV; VVIR apenas se FA permanente."},
    "n2": {"explanation_pt": "Atropina EV pode aumentar a condução no nó AV, mas é ineficaz em bloqueios infranodais como Mobitz II, podendo paradoxalmente piorar o bloqueio.", "clinical_pearl_pt": "Atropina acelera condução nodal mas não infranodal; em Mobitz II, use marca-passo transcutâneo se instável."},
    "n3": {"explanation_pt": "Ablação do nó AV é estratégia para controle de frequência em FA refratária (ablate and pace), não para BAV.", "clinical_pearl_pt": "Ablação do nó AV + marca-passo é última opção em FA refratária a drogas e ablação de veias pulmonares."},
    "n4": {"explanation_pt": "Alta com Holter ambulatorial é inadequada para Mobitz II sintomático com pré-síncope e FC 42bpm, que requer intervenção imediata.", "clinical_pearl_pt": "Nunca dê alta a paciente com Mobitz II sintomático sem marca-passo; risco de assistolia súbita."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Ondas P intermitentemente bloqueadas sem condução ventricular", "Intervalo PR constante nos batimentos conduzidos (sem prolongamento progressivo)", "QRS alargado >0.12s indicando bloqueio infranodal"],
    "systematicApproach": "Identifique todas as ondas P, meça os intervalos PR em cada batimento conduzido, observe se há bloqueio abrupto (Mobitz II) ou progressivo (Mobitz I), avalie a largura do QRS e calcule a relação de condução P:QRS.",
    "commonMistakes": ["Confundir Mobitz I (PR progressivo) com Mobitz II (PR fixo) não medindo cada intervalo PR", "Subestimar a gravidade de Mobitz II por ser intermitente", "Tentar atropina em bloqueio infranodal, que é ineficaz e pode piorar"],
    "clinicalCorrelation": "Homem de 75 anos com DAC crônica, tontura e pré-síncope há 1 semana com FC 42bpm apresenta doença degenerativa do sistema de condução His-Purkinje, comum em coronariopatas idosos.",
    "references": ["Diretrizes Brasileiras de Dispositivos Cardíacos Eletrônicos Implantáveis (SBC)", "ACC/AHA/HRS Guidelines for Bradycardia and Cardiac Conduction Delay"]
  }'::jsonb
WHERE title_pt = 'Bloqueio AV 2º grau Mobitz II';

-- CASE 9: Taquicardia ventricular monomórfica
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "O ECG de 12 derivações é crucial para diferenciar taquicardia ventricular de taquicardia supraventricular com aberrância, guiando a terapia imediata.", "clinical_pearl_pt": "Em taquicardia de QRS largo, assuma TV até prova em contrário; tratar TSV como TV é seguro, o inverso pode ser fatal."},
    "m2": {"explanation_pt": "Monitor cardíaco contínuo é essencial na UTI para vigilância pós-IAM, mas o ECG de 12 derivações é necessário para diagnóstico definitivo.", "clinical_pearl_pt": "Monitor contínuo detecta TV, mas 12 derivações permite análise detalhada de morfologia e critérios diagnósticos."},
    "m3": {"explanation_pt": "Ecocardiograma de urgência avalia função ventricular e substrato pós-IAM, mas deve ser realizado após estabilização do ritmo.", "clinical_pearl_pt": "Eco mostra área cicatricial pós-IAM como substrato para o circuito de reentrada da TV."},
    "m4": {"explanation_pt": "Cateterismo avalia isquemia residual como causa de TV, mas é realizado eletivamente após estabilização, não durante a arritmia.", "clinical_pearl_pt": "Cateterismo com mapeamento eletrofisiológico pode localizar o foco da TV para ablação futura."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "QRS alargado >0.14s com FC de 180bpm é altamente sugestivo de taquicardia ventricular, pois QRS >140ms em taquicardia larga favorece origem ventricular.", "clinical_pearl_pt": "Critérios de Brugada: QRS >140ms, ausência de RS em precordiais e concordância favorecem TV sobre TSV com aberrância."},
    "f2": {"explanation_pt": "Concordância de QRS em todas as precordiais (todos positivos ou todos negativos) é critério altamente específico para TV monomórfica.", "clinical_pearl_pt": "Concordância positiva em V1-V6 indica TV com foco basal; concordância negativa indica foco apical."},
    "f3": {"explanation_pt": "Dissociação AV (ondas P marchando independentemente dos QRS) é o achado mais específico para TV, presente em 50% dos casos.", "clinical_pearl_pt": "Capture beats e fusion beats são consequências da dissociação AV e confirmam TV de forma inequívoca."},
    "f4": {"explanation_pt": "QRS estreito <0.12s indica condução supraventricular normal, incompatível com taquicardia ventricular que por definição tem QRS alargado.", "clinical_pearl_pt": "QRS estreito + taquicardia = supraventricular; trate com manobras vagais ou adenosina."},
    "f5": {"explanation_pt": "Onda delta indica pré-excitação por via acessória (WPW), que causa QRS alargado em ritmo sinusal mas tem morfologia diferente da TV.", "clinical_pearl_pt": "FA pré-excitada em WPW causa QRS largo irregular; TV monomórfica é regular."},
    "f6": {"explanation_pt": "Bloqueio de ramo frequência-dependente causa QRS largo apenas em FC elevada e normaliza com FC menor, diferente da TV com QRS constantemente largo.", "clinical_pearl_pt": "Aberrância resolve com diminuição da FC; TV mantém QRS largo independentemente da frequência."},
    "f7": {"explanation_pt": "Alternância elétrica é variação de amplitude do QRS batimento a batimento, mais associada a derrame pericárdico ou taquicardia de reentrada.", "clinical_pearl_pt": "Alternância elétrica em tamponamento é por swinging heart; em taquicardia sugere mecanismo de reentrada."},
    "f8": {"explanation_pt": "Torsades de pointes é TV polimórfica com QRS de amplitude variável girando em torno do eixo, associada a QT longo, diferente da TV monomórfica regular.", "clinical_pearl_pt": "Torsades: TV polimórfica + QT longo; trate com magnésio EV 2g e overdrive pacing, não com amiodarona."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "TV monomórfica sustentada é o diagnóstico correto, baseado em QRS largo regular >140ms, concordância precordial e dissociação AV em paciente pós-IAM com substrato cicatricial.", "clinical_pearl_pt": "TV pós-IAM é por reentrada na zona de cicatriz; CDI é indicado para prevenção secundária de morte súbita."},
    "d2": {"explanation_pt": "TSV com aberrância tem QRS largo por bloqueio de ramo funcional, mas responde a adenosina e geralmente tem padrão de BRD ou BRE típico.", "clinical_pearl_pt": "Em dúvida entre TV e TSV com aberrância: história de IAM prévio torna TV muito mais provável."},
    "d3": {"explanation_pt": "FA pré-excitada (WPW) causa QRS largo irregular por condução anterógrada pela via acessória, diferente da TV monomórfica regular.", "clinical_pearl_pt": "FA pré-excitada é irregular; TV monomórfica é regular. Evite bloqueadores do nó AV em ambas."},
    "d4": {"explanation_pt": "Torsades de pointes é TV polimórfica com QRS de amplitude e eixo variáveis associada a QT longo, diferente da morfologia constante da TV monomórfica.", "clinical_pearl_pt": "Torsades de pointes: suspenda drogas que prolongam QT, administre magnésio EV e considere isoproterenol."},
    "d5": {"explanation_pt": "Taquicardia sinusal tem QRS estreito com ondas P sinusais, incompatível com QRS largo >140ms sem ondas P precedentes.", "clinical_pearl_pt": "Taquicardia sinusal é diagnóstico de exclusão; sempre busque a causa subjacente."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Cardioversão elétrica sincronizada é indicação imediata em TV sustentada com instabilidade hemodinâmica (hipotensão, má perfusão, sudorese), como neste paciente com PA 90/60.", "clinical_pearl_pt": "Use 100-200J bifásico sincronizado; se degenerar para FV, aplique choque não sincronizado (desfibrilação)."},
    "n2": {"explanation_pt": "Adenosina EV é contraindicada em TV; pode causar degeneração para FV e é ineficaz em arritmias ventriculares.", "clinical_pearl_pt": "Adenosina é segura em taquicardia de QRS largo apenas se diagnóstico de TSV for certo; na dúvida, não use."},
    "n3": {"explanation_pt": "Amiodarona EV é opção para TV sustentada hemodinamicamente estável, mas com PA 90/60 e sinais de choque, cardioversão elétrica é prioritária.", "clinical_pearl_pt": "Amiodarona 150mg EV em 10 min é segunda linha para TV estável; primeira linha em TV instável é cardioversão."},
    "n4": {"explanation_pt": "Massagem do seio carotídeo é manobra vagal eficaz em TPSV, mas ineficaz e potencialmente perigosa em TV.", "clinical_pearl_pt": "Manobras vagais (Valsalva, massagem carotídea) só funcionam em arritmias que dependem do nó AV."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["QRS alargado >0.14s a FC 180bpm com morfologia monomórfica regular", "Concordância de QRS em derivações precordiais", "Dissociação AV com ondas P independentes dos QRS"],
    "systematicApproach": "Em taquicardia de QRS largo, aplique os critérios de Brugada: 1) ausência de complexo RS em precordiais, 2) intervalo RS >100ms, 3) dissociação AV, 4) critérios morfológicos em V1/V6. Qualquer critério positivo diagnostica TV.",
    "commonMistakes": ["Tratar TV como TSV administrando adenosina ou verapamil, causando colapso hemodinâmico", "Não reconhecer dissociação AV como critério diagnóstico de TV", "Atrasar cardioversão em paciente instável tentando drogas antiarrítmicas primeiro"],
    "clinicalCorrelation": "Homem de 58 anos, 2 meses pós-IAM, com palpitações rápidas, tontura, PA 90/60 e sudorese apresenta TV por reentrada na cicatriz miocárdica, condição potencialmente fatal que requer cardioversão imediata.",
    "references": ["Diretrizes Brasileiras de Arritmias Ventriculares (SBC)", "AHA/ACC/HRS Guidelines for Management of Ventricular Arrhythmias and Prevention of Sudden Cardiac Death"]
  }'::jsonb
WHERE title_pt = 'Taquicardia ventricular monomórfica';

-- CASE 10: Flutter atrial típico
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "O ECG de 12 derivações é o exame diagnóstico para flutter atrial, revelando as ondas F em dente de serra características nas derivações inferiores.", "clinical_pearl_pt": "Flutter atrial típico tem FC atrial de 300/min; com condução 2:1, a FC ventricular é ~150/min regular."},
    "m2": {"explanation_pt": "O Holter 24h documenta episódios paroxísticos e avalia controle de frequência, mas o ECG de repouso é suficiente para flutter sustentado.", "clinical_pearl_pt": "Holter é útil para documentar duração do flutter e avaliar resposta ao tratamento de controle de FC."},
    "m3": {"explanation_pt": "O ecocardiograma avalia função ventricular e tamanho do átrio esquerdo, mas não é o exame inicial para diagnóstico do ritmo.", "clinical_pearl_pt": "Eco transtorácico avalia dilatação atrial esquerda, fator predisponente para flutter e FA."},
    "m4": {"explanation_pt": "O teste ergométrico avalia capacidade funcional e isquemia, mas não é indicado para diagnóstico de flutter atrial.", "clinical_pearl_pt": "Teste ergométrico pode ser feito após controle do flutter para avaliar doença coronariana associada."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "Ondas F em dente de serra (sawtooth) nas derivações inferiores (DII, DIII, aVF) são o achado patognomônico do flutter atrial típico, representando o macrocircuito de reentrada no istmo cavotricuspídeo.", "clinical_pearl_pt": "Ondas F negativas (descendentes) em DII/DIII/aVF indicam flutter típico anti-horário, o mais comum e mais responsivo à ablação."},
    "f2": {"explanation_pt": "Condução AV 2:1 é a apresentação mais frequente do flutter, resultando em FC ventricular regular de aproximadamente 150bpm.", "clinical_pearl_pt": "Taquicardia regular a 150bpm deve sempre levantar suspeita de flutter atrial 2:1; administre adenosina para desmascarar as ondas F."},
    "f3": {"explanation_pt": "QRS estreitos confirmam que a condução ventricular é normal (supraventricular), sem aberrância ou pré-excitação associada.", "clinical_pearl_pt": "QRS estreito em taquicardia regular: pense em flutter 2:1, TPSV ou taquicardia atrial; adenosina ajuda a diferenciar."},
    "f4": {"explanation_pt": "Ondas f da FA são irregulares e de baixa amplitude, diferentes das ondas F organizadas em dente de serra do flutter.", "clinical_pearl_pt": "FA é caótica e irregular; flutter é organizado e regular. Flutter pode coexistir ou degenerar para FA."},
    "f5": {"explanation_pt": "Taquicardia sinusal tem ondas P sinusais normais (positivas em DII) precedendo cada QRS, diferente das ondas F negativas do flutter.", "clinical_pearl_pt": "Taquicardia sinusal varia com respiração e atividade; flutter mantém FC atrial fixa de 300/min."},
    "f6": {"explanation_pt": "Taquicardia atrial multifocal (TAM) apresenta 3 ou mais morfologias diferentes de onda P com intervalos variáveis, diferente das ondas F uniformes do flutter.", "clinical_pearl_pt": "TAM é associada a DPOC grave e hipoxemia; trate a causa base, não o ritmo."},
    "f7": {"explanation_pt": "BAV 2:1 causa ondas P sinusais bloqueadas alternadamente, diferente das ondas F em dente de serra do flutter com condução 2:1.", "clinical_pearl_pt": "No BAV 2:1, as ondas P são sinusais e a FC atrial é normal (60-100); no flutter 2:1, a FC atrial é 300/min."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Flutter atrial típico com condução 2:1 é confirmado pelas ondas F em dente de serra nas derivações inferiores com FC ventricular regular de ~150bpm, causado por macrocircuito de reentrada no istmo cavotricuspídeo.", "clinical_pearl_pt": "Flutter atrial típico tem taxa de cura >95% com ablação do istmo cavotricuspídeo; é a arritmia com melhor resposta à ablação."},
    "d2": {"explanation_pt": "FA apresenta ritmo irregularmente irregular com ondas f caóticas de baixa amplitude, diferente do ritmo regular com ondas F organizadas do flutter.", "clinical_pearl_pt": "Flutter e FA frequentemente coexistem; anticoagulação segue as mesmas regras de CHA2DS2-VASc para ambos."},
    "d3": {"explanation_pt": "TSV (TPSV por reentrada nodal ou acessória) tem início e término súbitos com QRS estreito regular, sem ondas F em dente de serra visíveis.", "clinical_pearl_pt": "TPSV responde a manobras vagais e adenosina com término abrupto; flutter não termina, apenas mostra as ondas F."},
    "d4": {"explanation_pt": "Taquicardia sinusal tem ondas P sinusais normais com FC proporcional ao estímulo simpático, sem padrão em dente de serra.", "clinical_pearl_pt": "Taquicardia sinusal é resposta fisiológica; busque e trate a causa (dor, febre, hipovolemia, hipoxemia)."},
    "d5": {"explanation_pt": "Taquicardia atrial focal tem ondas P'' de morfologia anormal diferente da sinusal, mas sem o padrão organizado em dente de serra do flutter.", "clinical_pearl_pt": "Taquicardia atrial focal tem warm-up e cool-down graduais; flutter tem início e manutenção do circuito de reentrada."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Controle de frequência com betabloqueador ou bloqueador de canal de cálcio e avaliação para ablação do istmo cavotricuspídeo é a abordagem de primeira linha em flutter estável.", "clinical_pearl_pt": "Ablação do istmo cavotricuspídeo para flutter típico tem sucesso >95% e baixo risco de complicações; é o tratamento definitivo."},
    "n2": {"explanation_pt": "Cardioversão elétrica imediata é reservada para instabilidade hemodinâmica (hipotensão, choque, isquemia); este paciente está hemodinamicamente estável.", "clinical_pearl_pt": "Flutter cardioverte com baixa energia (50-100J bifásico), mas recidiva é alta sem ablação ou antiarrítmico."},
    "n3": {"explanation_pt": "Adenosina EV não termina o flutter, mas pode transitoriamente aumentar o bloqueio AV, revelando as ondas F ocultas pela condução 2:1 para fins diagnósticos.", "clinical_pearl_pt": "Adenosina no flutter é ferramenta diagnóstica, não terapêutica; desacelera momentaneamente a FC e revela as ondas F."},
    "n4": {"explanation_pt": "Desfibrilação (choque não sincronizado) é para ritmos sem pulso (FV/TV sem pulso); flutter com pulso requer cardioversão sincronizada, se indicada.", "clinical_pearl_pt": "Choque sincronizado em arritmias com pulso; não sincronizado apenas em FV ou TV sem pulso."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": ["Ondas F em dente de serra nas derivações inferiores (DII, DIII, aVF)", "Condução AV 2:1 resultando em FC ventricular regular de ~150bpm", "QRS estreitos confirmando condução supraventricular normal"],
    "systematicApproach": "Em taquicardia regular de QRS estreito a ~150bpm, suspeite de flutter 2:1. Busque ondas F em dente de serra nas derivações inferiores e em V1. Se dúvida, administre adenosina EV para desmascarar as ondas F aumentando transitoriamente o bloqueio AV.",
    "commonMistakes": ["Confundir flutter 2:1 com taquicardia sinusal por não buscar ondas F nas derivações inferiores", "Não considerar flutter quando FC ventricular é exatamente 150bpm regular", "Subestimar risco tromboembólico do flutter, que segue as mesmas regras de anticoagulação da FA"],
    "clinicalCorrelation": "Homem de 65 anos com DPOC, palpitações regulares e dispneia há 24 horas com FC de 150bpm regular apresenta flutter atrial típico com condução 2:1, onde a hipoxemia crônica da DPOC pode ter sido gatilho para a arritmia.",
    "references": ["Diretrizes Brasileiras de Arritmias Supraventriculares (SBC)", "ESC Guidelines for Diagnosis and Management of Supraventricular Tachycardia (2024)"]
  }'::jsonb
WHERE title_pt = 'Flutter atrial típico';
-- Cases 11-20: CT (4) + Ultrasound (3) + MRI (3)

-- ============================================
-- CASE 11: AVC isquêmico agudo (CT, medio)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A TC de crânio sem contraste é o exame de primeira linha na emergência do AVC, pois descarta rapidamente hemorragia e identifica sinais precoces de isquemia.", "clinical_pearl_pt": "Na suspeita de AVC agudo, a TC sem contraste deve ser realizada em até 20 minutos da chegada ao pronto-socorro (porta-TC <20min)."},
    "m2": {"explanation_pt": "A RM de crânio, embora mais sensível para isquemia precoce (difusão), demora mais e não é o exame inicial padrão na emergência do AVC agudo.", "clinical_pearl_pt": "A sequência de difusão (DWI) da RM detecta isquemia em minutos, mas a disponibilidade limitada na emergência torna a TC o exame de escolha."},
    "m3": {"explanation_pt": "A angiografia cerebral é reservada para planejamento de trombectomia mecânica, não sendo o exame inicial de triagem no AVC agudo.", "clinical_pearl_pt": "A angiotomografia (angioTC) substituiu amplamente a angiografia convencional para avaliação vascular no AVC agudo."},
    "m4": {"explanation_pt": "O Doppler transcraniano é útil para monitoramento de vasoespasmo e avaliação hemodinâmica, mas não é o exame diagnóstico inicial do AVC.", "clinical_pearl_pt": "O Doppler transcraniano tem papel no acompanhamento pós-trombólise, detectando recanalização ou reoclusão em tempo real."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A hipodensidade no território da ACM direita é o achado tomográfico clássico de AVC isquêmico, correspondendo ao edema citotóxico do parênquima infartado.", "clinical_pearl_pt": "Sinais precoces de isquemia na TC podem ser sutis nas primeiras 6 horas; procure perda da diferenciação cinzenta-branca e apagamento de sulcos."},
    "f2": {"explanation_pt": "O apagamento dos sulcos corticais à direita indica edema cerebral focal, sinal precoce de isquemia no território da ACM.", "clinical_pearl_pt": "O apagamento de sulcos corticais unilateral é um dos sinais mais precoces de AVC isquêmico, visível antes da hipodensidade franca."},
    "f3": {"explanation_pt": "A perda da diferenciação entre substância cinzenta e branca na região insular (sinal da fita insular) é um dos achados mais precoces e sensíveis do AVC da ACM.", "clinical_pearl_pt": "O sinal da fita insular (perda da diferenciação córtex-substância branca na ínsula) aparece nas primeiras 2-3 horas do AVC da ACM."},
    "f4": {"explanation_pt": "Hiperdensidade nas cisternas basais indica hemorragia subaracnoide, não AVC isquêmico. Este achado direcionaria para investigação de aneurisma.", "clinical_pearl_pt": "Sangue nas cisternas basais = HSA até prova em contrário; na TC, sangue agudo é hiperdenso (branco)."},
    "f5": {"explanation_pt": "Desvio de linha média >5mm sugere efeito de massa significativo, típico de AVC maligno ou hemorragia volumosa, não compatível com as primeiras horas de um AVC isquêmico não complicado.", "clinical_pearl_pt": "Desvio de linha média >5mm nas primeiras horas sugere diagnóstico alternativo; no AVC isquêmico, o edema significativo surge após 24-48h."},
    "f6": {"explanation_pt": "Hidrocefalia obstrutiva não é achado típico de AVC isquêmico da ACM. Ocorre em lesões de fossa posterior ou HSA que obstruem a drenagem liquórica.", "clinical_pearl_pt": "AVCs de fossa posterior (cerebelo, tronco) podem causar hidrocefalia obstrutiva por compressão do IV ventrículo."},
    "f7": {"explanation_pt": "Calcificação do plexo coroide é um achado incidental benigno e extremamente comum, sem relação com o quadro isquêmico agudo.", "clinical_pearl_pt": "Calcificações fisiológicas (plexo coroide, pineal, foice) são achados incidentais que não devem ser confundidos com patologia aguda."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "O quadro clínico de hemiparesia esquerda súbita com disartria em idosa hipertensa, associado aos achados tomográficos de hipodensidade e sinais precoces no território da ACM direita, confirma AVC isquêmico.", "clinical_pearl_pt": "A escala NIHSS deve ser aplicada sistematicamente: guia a indicação de trombólise e permite monitorar evolução neurológica."},
    "d2": {"explanation_pt": "O AVC hemorrágico se apresentaria como hiperdensidade (sangue) na TC, não como hipodensidade. A TC sem contraste diferencia isquemia de hemorragia com alta acurácia.", "clinical_pearl_pt": "Na TC sem contraste: sangue agudo = hiperdenso (branco); isquemia aguda = hipodensidade sutil ou normal nas primeiras horas."},
    "d3": {"explanation_pt": "Tumores cerebrais apresentam evolução progressiva (semanas a meses), não déficit neurológico súbito. Na TC, costumam ter realce pelo contraste e edema perilesional.", "clinical_pearl_pt": "Déficit neurológico de início súbito = vascular até prova em contrário; progressivo ao longo de semanas = investigar neoplasia."},
    "d4": {"explanation_pt": "Abscesso cerebral apresenta cápsula com realce anelar pelo contraste e conteúdo hipodenso central, geralmente acompanhado de febre e leucocitose.", "clinical_pearl_pt": "A tríade clássica do abscesso cerebral (febre + cefaleia + déficit focal) está presente em menos de 50% dos casos."},
    "d5": {"explanation_pt": "A encefalopatia hipertensiva se manifesta com edema vasogênico posterior (PRES), sem déficit focal lateralizado clássico como hemiparesia e sem hipodensidade territorial na TC.", "clinical_pearl_pt": "A síndrome PRES (encefalopatia posterior reversível) tem predileção por regiões occipitais e parietais posteriores bilateralmente."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A trombólise endovenosa com alteplase está indicada para AVC isquêmico com início dos sintomas há menos de 4,5 horas, após exclusão de hemorragia pela TC. É a conduta que mais impacta o prognóstico.", "clinical_pearl_pt": "Tempo é cérebro: cada minuto sem reperfusão no AVC isquêmico, perdem-se aproximadamente 1,9 milhão de neurônios."},
    "n2": {"explanation_pt": "A craniectomia descompressiva é reservada para AVC maligno da ACM com edema extenso e deterioração neurológica, não sendo a conduta inicial.", "clinical_pearl_pt": "A craniectomia descompressiva no AVC maligno da ACM reduz mortalidade em pacientes <60 anos, mas deve ser considerada em 24-48h se houver deterioração."},
    "n3": {"explanation_pt": "O controle agressivo da PA não é indicado no AVC isquêmico agudo, pois pode piorar a perfusão da penumbra isquêmica. Trata-se PA apenas se >220/120 ou >185/110 se candidato a trombólise.", "clinical_pearl_pt": "No AVC isquêmico, a hipertensão permissiva é a regra: não reduzir PA a menos que >220/120 mmHg (ou >185/110 pré-trombólise)."},
    "n4": {"explanation_pt": "A observação passiva com TC de controle em 24h é inadequada quando o paciente está na janela terapêutica para trombólise. Atrasar o tratamento piora desfechos.", "clinical_pearl_pt": "O número necessário para tratar (NNT) da trombólise no AVC é melhor quanto mais precoce: NNT de 4,5 na primeira hora vs. 14 em 3-4,5h."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Hipodensidade no território da ACM direita indicando edema citotóxico",
      "Apagamento dos sulcos corticais à direita por edema focal precoce",
      "Perda da diferenciação cinzenta-branca na ínsula (sinal da fita insular)",
      "Ausência de hemorragia intracraniana na TC sem contraste"
    ],
    "systematicApproach": "Na avaliação de AVC agudo por TC: 1) Excluir hemorragia (hiperdensidade); 2) Procurar sinais precoces de isquemia (perda diferenciação cinzenta-branca, apagamento sulcos, hipodensidade sutil); 3) Aplicar escala ASPECTS para quantificar extensão; 4) Verificar presença do sinal da artéria cerebral média hiperdensa (trombo); 5) Avaliar desvio de linha média e complicações.",
    "commonMistakes": [
      "Não reconhecer sinais precoces sutis de isquemia na TC das primeiras horas",
      "Confundir hipodensidade isquêmica com artefato de endurecimento na fossa temporal",
      "Atrasar trombólise por solicitar exames desnecessários quando a TC já excluiu hemorragia",
      "Reduzir agressivamente a PA no AVC isquêmico agudo, comprometendo a perfusão da penumbra"
    ],
    "clinicalCorrelation": "Mulher de 70 anos, hipertensa, com hemiparesia esquerda e disartria de início súbito há 3 horas. O território acometido (ACM direita) é consistente com o déficit motor contralateral. A glicemia de 110 mg/dL afasta hipoglicemia como causa. Com GCS 14 e dentro da janela de 4,5h, a trombólise endovenosa com alteplase é a conduta prioritária após exclusão de hemorragia.",
    "references": [
      "Diretriz AVC Isquêmico Agudo - Academia Brasileira de Neurologia 2024",
      "Powers WJ et al. Guidelines for Early Management of Acute Ischemic Stroke - AHA/ASA 2019",
      "Barber PA et al. Validity and reliability of ASPECTS - Lancet 2000"
    ]
  }'::jsonb
WHERE title_pt = 'AVC isquêmico agudo';

-- ============================================
-- CASE 12: TEP agudo bilateral (CT, dificil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A angiotomografia de tórax é o exame padrão-ouro para diagnóstico de TEP agudo, com sensibilidade >95% para trombos em artérias pulmonares centrais e segmentares.", "clinical_pearl_pt": "A angioTC de tórax com protocolo para TEP requer timing preciso do contraste na artéria pulmonar; contraste insuficiente é causa frequente de exames inconclusivos."},
    "m2": {"explanation_pt": "A cintilografia ventilação-perfusão é alternativa quando há contraindicação à angioTC (insuficiência renal, alergia ao contraste), mas tem menor acurácia e maior taxa de resultados inconclusivos.", "clinical_pearl_pt": "A cintilografia V/Q é mais útil em pacientes com RX de tórax normal e sem doença pulmonar prévia; o resultado ''probabilidade intermediária'' exige investigação adicional."},
    "m3": {"explanation_pt": "O ecocardiograma avalia sobrecarga de VD e pode mostrar sinais indiretos de TEP, mas não visualiza diretamente os trombos nas artérias pulmonares.", "clinical_pearl_pt": "No TEP maciço com instabilidade hemodinâmica, o ecocardiograma à beira-leito pode confirmar disfunção de VD e indicar trombólise sem necessidade de angioTC."},
    "m4": {"explanation_pt": "O RX de tórax é pouco sensível para TEP. Achados como sinal de Westermark ou corcova de Hampton são infrequentes e inespecíficos.", "clinical_pearl_pt": "O RX de tórax no TEP geralmente é normal ou inespecífico; sua principal utilidade é excluir diagnósticos alternativos como pneumotórax ou pneumonia."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "As falhas de enchimento nas artérias pulmonares bilaterais representam trombos intraluminais, achado direto e definitivo de TEP na angiotomografia.", "clinical_pearl_pt": "Na angioTC, o trombo agudo aparece como falha de enchimento central na artéria pulmonar; o trombo crônico tende a ser periférico e aderido à parede."},
    "f2": {"explanation_pt": "O aumento do VD com relação VD/VE >1 na TC indica sobrecarga de câmaras direitas por hipertensão pulmonar aguda, marcador de gravidade no TEP.", "clinical_pearl_pt": "A relação VD/VE >1 na angioTC é um marcador prognóstico independente de mortalidade no TEP agudo, indicando possível necessidade de trombólise."},
    "f3": {"explanation_pt": "A retificação do septo interventricular (sinal do D) indica sobrecarga pressórica aguda do VD, empurrando o septo para a esquerda e comprometendo o enchimento do VE.", "clinical_pearl_pt": "O desvio septal (''bowing'') para a esquerda reflete a desproporção de pressões entre VD e VE, sinal de cor pulmonale agudo no TEP maciço."},
    "f4": {"explanation_pt": "Consolidação pulmonar bilateral sugere pneumonia ou edema pulmonar, não sendo o achado primário do TEP. No TEP, podem ocorrer infartos pulmonares periféricos (consolidações em cunha).", "clinical_pearl_pt": "Infartos pulmonares por TEP são consolidações triangulares de base pleural (corcova de Hampton), presentes em apenas 30% dos casos."},
    "f5": {"explanation_pt": "Derrame pericárdico volumoso não é achado típico de TEP agudo. Sua presença deve levantar suspeita de tamponamento, dissecção aórtica ou pericardite.", "clinical_pearl_pt": "Derrame pericárdico pequeno pode ocorrer no TEP por inflamação pericárdica reativa, mas derrame volumoso sugere outra etiologia."},
    "f6": {"explanation_pt": "A dissecção de aorta é um diagnóstico diferencial importante de dor torácica aguda, mas apresenta flap intimal na TC, não falhas de enchimento em artérias pulmonares.", "clinical_pearl_pt": "TEP e dissecção aórtica são emergências que podem coexistir raramente; ambas causam dor torácica aguda com D-dímero elevado."},
    "f7": {"explanation_pt": "Linfonodomegalia mediastinal não é achado de TEP agudo. Sugere linfoma, sarcoidose, tuberculose ou metástases, devendo ser investigada separadamente.", "clinical_pearl_pt": "Na angioTC de tórax para TEP, sempre avalie o mediastino: achados incidentais como linfonodos aumentados podem revelar diagnósticos concomitantes."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "O contexto pós-operatório de artroplastia de quadril (alto risco trombótico), dispneia súbita, taquicardia e D-dímero elevado, associados às falhas de enchimento bilaterais na angioTC, confirmam TEP agudo bilateral.", "clinical_pearl_pt": "A tríade de Virchow (estase, lesão endotelial, hipercoagulabilidade) está completa no pós-operatório ortopédico, tornando o TEP uma complicação frequente sem profilaxia adequada."},
    "d2": {"explanation_pt": "Pneumonia bilateral apresentaria consolidações parenquimatosas com broncograma aéreo, não falhas de enchimento intraluminais. A febre e leucocitose seriam esperadas.", "clinical_pearl_pt": "TEP pode mimetizar pneumonia com febre baixa e infiltrado periférico (infarto pulmonar); o contexto clínico e D-dímero ajudam na diferenciação."},
    "d3": {"explanation_pt": "A dissecção aórtica aguda apresenta flap intimal e dilatação aórtica na TC, com dor torácica dilacerante de irradiação dorsal. Não causa falhas de enchimento em artérias pulmonares.", "clinical_pearl_pt": "Na dor torácica aguda, a ''triple rule-out'' angioTC pode avaliar simultaneamente coronárias, aorta e artérias pulmonares em casos selecionados."},
    "d4": {"explanation_pt": "O edema pulmonar cardiogênico apresenta opacidades bilaterais simétricas (''asas de borboleta''), derrame pleural bilateral e cardiomegalia, sem falhas de enchimento arterial pulmonar.", "clinical_pearl_pt": "O BNP/NT-proBNP pode estar elevado tanto no edema pulmonar cardiogênico quanto no TEP com disfunção de VD, mas com padrões clínicos distintos."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A anticoagulação plena com heparina é o tratamento imediato do TEP agudo. A presença de sinais de sobrecarga de VD (VD/VE >1, retificação septal) indica TEP de risco intermediário-alto, devendo-se avaliar trombólise sistêmica.", "clinical_pearl_pt": "No TEP de risco intermediário-alto (estável mas com disfunção de VD + troponina elevada), a trombólise de resgate é indicada se houver deterioração hemodinâmica."},
    "n2": {"explanation_pt": "A embolectomia cirúrgica é reservada para TEP maciço com instabilidade hemodinâmica quando há contraindicação à trombólise ou falha terapêutica, não sendo a primeira opção.", "clinical_pearl_pt": "A embolectomia cirúrgica e a trombectomia por cateter são alternativas à trombólise sistêmica no TEP maciço com contraindicação ao fibrinolítico."},
    "n3": {"explanation_pt": "Antibioticoterapia de amplo espectro é tratamento para pneumonia, não para TEP. A apresentação clínica e os achados tomográficos não sugerem processo infeccioso.", "clinical_pearl_pt": "Iniciar antibiótico empiricamente sem diagnóstico definido pode atrasar o tratamento correto e expor o paciente a efeitos adversos desnecessários."},
    "n4": {"explanation_pt": "Diurético e VNI são tratamentos para edema pulmonar cardiogênico. No TEP, o problema é obstrutivo vascular, não congestivo; diuréticos podem piorar a hemodinâmica por reduzir pré-carga do VD.", "clinical_pearl_pt": "No TEP com disfunção de VD, expansão volêmica cautelosa (250-500 mL) pode melhorar o débito cardíaco, diferente do edema pulmonar onde se restringe volume."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Falhas de enchimento nas artérias pulmonares bilaterais confirmando trombos intraluminais",
      "Aumento do VD com relação VD/VE >1 indicando sobrecarga de câmaras direitas",
      "Retificação do septo interventricular (sinal do D) por cor pulmonale agudo",
      "Ausência de consolidações parenquimatosas significativas ou dissecção aórtica"
    ],
    "systematicApproach": "Na avaliação de TEP por angioTC: 1) Identificar falhas de enchimento nas artérias pulmonares (centrais e segmentares bilateralmente); 2) Avaliar sinais de sobrecarga de VD (relação VD/VE, retificação septal, refluxo para veias hepáticas); 3) Procurar infartos pulmonares periféricos; 4) Excluir diagnósticos diferenciais (dissecção aórtica, pneumonia); 5) Classificar gravidade pelo escore PESI e marcadores de disfunção de VD.",
    "commonMistakes": [
      "Não solicitar angioTC por D-dímero ''apenas levemente elevado'' em paciente de alta probabilidade clínica",
      "Confundir artefato de fluxo com falha de enchimento verdadeira na angioTC",
      "Não avaliar sinais de sobrecarga de VD que estratificam risco e guiam decisão de trombólise",
      "Tratar como pneumonia por presença de infiltrado periférico que na verdade é infarto pulmonar"
    ],
    "clinicalCorrelation": "Mulher de 45 anos em pós-operatório de artroplastia de quadril, com dispneia súbita, dor torácica pleurítica e taquicardia (FC 120). O D-dímero elevado em contexto de alta probabilidade clínica (escore de Wells >6) indica angioTC diagnóstica. A presença de trombos bilaterais com dilatação de VD classifica como TEP de risco intermediário-alto, exigindo anticoagulação imediata e monitorização intensiva com avaliação para trombólise.",
    "references": [
      "Diretriz Brasileira de TEP - SBPT 2020",
      "Konstantinides SV et al. ESC Guidelines Acute Pulmonary Embolism 2019",
      "PEITHO Trial - Tenecteplase in intermediate-risk PE - NEJM 2014"
    ]
  }'::jsonb
WHERE title_pt = 'Tromboembolismo pulmonar agudo';

-- ============================================
-- CASE 13: Apendicite aguda (CT, facil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A TC de abdome com contraste é o exame com maior acurácia para apendicite aguda (sensibilidade >95%), permitindo avaliar complicações como perfuração e abscesso.", "clinical_pearl_pt": "A TC com contraste EV é o padrão-ouro para apendicite em adultos; o contraste oral não é mais considerado obrigatório pela maioria dos protocolos atuais."},
    "m2": {"explanation_pt": "A USG de abdome é alternativa inicial em crianças, gestantes e pacientes jovens magros, mas tem sensibilidade inferior à TC e é operador-dependente.", "clinical_pearl_pt": "A USG é o exame de primeira linha para apendicite em crianças e gestantes, evitando radiação; o sinal de incompressibilidade do apêndice >6mm é diagnóstico."},
    "m3": {"explanation_pt": "A RM de abdome é opção para gestantes quando a USG é inconclusiva, com boa acurácia para apendicite, mas acesso limitado na urgência.", "clinical_pearl_pt": "A RM sem contraste com gadolínio é segura na gravidez e tem sensibilidade >90% para apendicite, sendo a alternativa quando a USG é inconclusiva na gestante."},
    "m4": {"explanation_pt": "O RX de abdome tem sensibilidade muito baixa para apendicite. O achado de apendicolito é raro e o exame não permite avaliar o apêndice diretamente.", "clinical_pearl_pt": "O RX de abdome na suspeita de apendicite é obsoleto como exame diagnóstico; sua única utilidade é excluir pneumoperitônio se houver suspeita de perfuração de víscera oca."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "O apêndice dilatado (>6mm de diâmetro) é o achado cardinal da apendicite aguda na TC, indicando obstrução luminal e processo inflamatório.", "clinical_pearl_pt": "O diâmetro normal do apêndice é até 6mm; acima de 6mm com parede espessada é altamente sugestivo de apendicite aguda."},
    "f2": {"explanation_pt": "O espessamento parietal com realce pelo contraste indica inflamação transmural ativa do apêndice, confirmando o processo agudo.", "clinical_pearl_pt": "O realce parietal pelo contraste ajuda a diferenciar apendicite aguda de apêndice simplesmente repleto de conteúdo fecal."},
    "f3": {"explanation_pt": "O borramento da gordura periapendicular (fat stranding) indica inflamação que se estende além da parede do apêndice, achado muito específico de apendicite.", "clinical_pearl_pt": "O fat stranding periapendicular é tão importante quanto a dilatação do apêndice; sua ausência em apêndice >6mm pode indicar achado incidental."},
    "f4": {"explanation_pt": "O apendicolito calcificado está presente em apenas 25-30% dos casos de apendicite. Sua presença associa-se a maior risco de perfuração, mas não é critério diagnóstico isolado.", "clinical_pearl_pt": "Apendicolito + apêndice dilatado = alta especificidade para apendicite; porém, apendicolito isolado sem inflamação pode ser achado incidental."},
    "f5": {"explanation_pt": "Uma coleção periapendicular organizada indica apendicite complicada (perfuração com abscesso), o que mudaria a conduta para drenagem percutânea seguida de apendicectomia tardia.", "clinical_pearl_pt": "Abscesso periapendicular >3cm geralmente indica tratamento com drenagem percutânea + ATB, com apendicectomia de intervalo em 6-8 semanas."},
    "f6": {"explanation_pt": "Pneumoperitônio indica perfuração de víscera oca com ar livre na cavidade, achado raro na apendicite (mais comum em úlcera perfurada ou perfuração colônica).", "clinical_pearl_pt": "Pneumoperitônio na suspeita de apendicite é incomum e deve levantar diagnósticos alternativos como úlcera perfurada ou diverticulite perfurada."},
    "f7": {"explanation_pt": "Distensão de alças delgado sugere obstrução intestinal, que não é o achado esperado na apendicite não complicada. Pode ocorrer em apendicite complicada com íleo paralítico.", "clinical_pearl_pt": "Íleo paralítico localizado na fossa ilíaca direita pode ocorrer na apendicite, mas distensão difusa de delgado deve levantar hipótese de obstrução mecânica."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "O quadro clínico clássico (dor periumbilical migratória para FID, febre, anorexia) associado ao apêndice dilatado com espessamento parietal e borramento de gordura periapendicular confirma apendicite aguda não complicada.", "clinical_pearl_pt": "A migração da dor periumbilical para a FID (sequência de Murphy) tem sensibilidade de 80% para apendicite e é um dos achados anamnésticos mais importantes."},
    "d2": {"explanation_pt": "O divertículo de Meckel inflamado (diverticulite de Meckel) é raro e ocorre no íleo distal, geralmente 60-90cm da válvula ileocecal, não na topografia apendicular típica.", "clinical_pearl_pt": "Regra dos 2 para o divertículo de Meckel: 2% da população, 2 pés da válvula ileocecal, 2 tipos de mucosa ectópica (gástrica e pancreática), sintomático antes dos 2 anos."},
    "d3": {"explanation_pt": "Linfadenite mesentérica apresenta linfonodos aumentados no mesentério do íleo terminal, geralmente em crianças após IVAS, com apêndice normal na TC.", "clinical_pearl_pt": "Linfadenite mesentérica é o principal diagnóstico diferencial de apendicite em crianças; a TC mostra linfonodos >8mm com apêndice normal."},
    "d4": {"explanation_pt": "A ileíte terminal por doença de Crohn pode mimetizar apendicite, mas apresenta espessamento parietal do íleo terminal com estratificação e linfonodomegalia mesentérica associada.", "clinical_pearl_pt": "Na cirurgia por suspeita de apendicite, se o apêndice estiver normal, sempre inspecione o íleo terminal para excluir doença de Crohn."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A apendicectomia videolaparoscópica é o tratamento padrão para apendicite aguda não complicada, com menor dor pós-operatória, menor taxa de infecção de ferida e retorno mais rápido às atividades.", "clinical_pearl_pt": "A apendicectomia laparoscópica deve ser realizada preferencialmente em até 24h do diagnóstico; o atraso aumenta risco de perfuração em 5% a cada 12 horas."},
    "n2": {"explanation_pt": "O tratamento com ATB isolada sem cirurgia tem sido estudado (trial CODA), mas a taxa de recorrência de 30-40% em 1 ano torna a apendicectomia a conduta preferencial na maioria dos centros.", "clinical_pearl_pt": "O tratamento conservador com ATB pode ser opção em casos selecionados (apendicite não complicada sem apendicolito), mas o paciente deve ser informado do risco de recorrência."},
    "n3": {"explanation_pt": "A drenagem percutânea é indicada para abscesso periapendicular organizado (apendicite complicada), não para apendicite aguda não complicada.", "clinical_pearl_pt": "A drenagem percutânea guiada por TC é o tratamento de escolha para abscesso periapendicular >3cm, seguida de apendicectomia de intervalo em 6-8 semanas."},
    "n4": {"explanation_pt": "A observação com TC de controle é conduta inadequada quando o diagnóstico de apendicite aguda já está estabelecido. O atraso cirúrgico aumenta risco de complicações.", "clinical_pearl_pt": "Atrasar a cirurgia em apendicite confirmada não traz benefício e aumenta riscos; a exceção é apendicite complicada com fleimão/abscesso, que pode ser tratada inicialmente com ATB."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Apêndice cecal dilatado com diâmetro >6mm confirmando obstrução luminal",
      "Espessamento parietal com realce pelo contraste indicando inflamação transmural ativa",
      "Borramento da gordura periapendicular (fat stranding) demonstrando extensão do processo inflamatório",
      "Ausência de coleção organizada, pneumoperitônio ou sinais de complicação"
    ],
    "systematicApproach": "Na avaliação de apendicite por TC: 1) Localizar o apêndice cecal e medir seu diâmetro (normal <6mm); 2) Avaliar espessamento e realce parietal; 3) Procurar borramento de gordura periapendicular e líquido livre; 4) Verificar presença de apendicolito; 5) Excluir complicações (perfuração, abscesso, pileflebite); 6) Considerar diagnósticos alternativos se o apêndice estiver normal.",
    "commonMistakes": [
      "Não identificar o apêndice na TC e concluir que o exame é normal",
      "Diagnosticar apendicite apenas pelo apendicolito sem avaliar sinais inflamatórios",
      "Não diferenciar apendicite não complicada de complicada, o que muda a conduta",
      "Confundir ileíte terminal (Crohn) ou diverticulite cecal com apendicite aguda"
    ],
    "clinicalCorrelation": "Homem de 25 anos com dor periumbilical que migrou para FID há 18 horas, febre, anorexia, náuseas e Blumberg positivo. A sequência clássica de Murphy (dor periumbilical → FID) com sinais de irritação peritoneal e achados tomográficos de apêndice inflamado sem complicações indica apendicectomia videolaparoscópica precoce.",
    "references": [
      "Diretriz de Apendicite Aguda - Colégio Brasileiro de Cirurgiões 2023",
      "Di Saverio S et al. WSES Jerusalem guidelines for diagnosis and treatment of acute appendicitis 2020",
      "CODA Collaborative. Antibiotics vs Appendectomy for Acute Appendicitis - NEJM 2020"
    ]
  }'::jsonb
WHERE title_pt = 'Apendicite aguda';

-- ============================================
-- CASE 14: HSA aguda (CT, dificil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A TC de crânio sem contraste é o exame de escolha na emergência para HSA, com sensibilidade >95% nas primeiras 6 horas. O sangue agudo aparece hiperdenso nas cisternas basais.", "clinical_pearl_pt": "A sensibilidade da TC para HSA diminui com o tempo: >95% em 12h, ~80% em 3 dias e ~50% em 1 semana; se a TC for negativa e a suspeita alta, realizar punção lombar."},
    "m2": {"explanation_pt": "A RM de crânio com sequência FLAIR pode detectar HSA, mas é mais demorada e menos disponível na emergência que a TC.", "clinical_pearl_pt": "A sequência FLAIR da RM pode ser mais sensível que a TC para HSA subaguda, pois o sangue permanece hiperintenso por mais tempo que a hiperdensidade na TC."},
    "m3": {"explanation_pt": "A punção lombar é indicada quando a TC é negativa mas a suspeita clínica de HSA permanece alta. Detecta xantocromia (sangue degradado no líquor).", "clinical_pearl_pt": "A xantocromia no líquor (amarelamento por degradação de hemoglobina) diferencia HSA verdadeira de punção traumática; surge 6-12h após o sangramento."},
    "m4": {"explanation_pt": "O Doppler transcraniano é utilizado no acompanhamento da HSA para detectar vasoespasmo cerebral, não para o diagnóstico inicial.", "clinical_pearl_pt": "O vasoespasmo cerebral pós-HSA atinge pico entre o 7o e 10o dia; o Doppler transcraniano diário é o método de triagem mais utilizado na UTI."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A hiperdensidade nas cisternas basais (suprasselar, interpeduncular, pré-pontina) é o achado mais característico da HSA por ruptura de aneurisma do polígono de Willis.", "clinical_pearl_pt": "A distribuição do sangue nas cisternas basais pode sugerir a localização do aneurisma roto: sangue na fissura silviana sugere ACM; na cisterna inter-hemisférica, ACoA."},
    "f2": {"explanation_pt": "A presença de sangue na fissura silviana bilateral indica HSA difusa com disseminação para os espaços subaracnoides laterais, compatível com sangramento significativo.", "clinical_pearl_pt": "A escala de Fisher modificada gradua a quantidade de sangue na TC e prediz risco de vasoespasmo: Fisher III-IV (sangue espesso nas cisternas) tem maior risco."},
    "f3": {"explanation_pt": "A hidrocefalia aguda incipiente pode ocorrer nas primeiras horas da HSA por obstrução da drenagem liquórica pelo sangue nas cisternas e granulações aracnoides.", "clinical_pearl_pt": "Hidrocefalia aguda na HSA pode causar rebaixamento rápido do nível de consciência e requer derivação ventricular externa (DVE) de emergência."},
    "f4": {"explanation_pt": "Hipodensidade no território da ACM é achado de AVC isquêmico, não de HSA. Na HSA, o parênquima cerebral está inicialmente preservado (o sangue está no espaço subaracnoide).", "clinical_pearl_pt": "O vasoespasmo pós-HSA pode causar isquemia cerebral tardia (após 3-14 dias), mas na fase aguda a hipodensidade parenquimatosa não é esperada."},
    "f5": {"explanation_pt": "Hematoma intraparenquimatoso ocorre no AVC hemorrágico hipertensivo (núcleos da base, tálamo, ponte), não sendo o achado principal da HSA aneurismática.", "clinical_pearl_pt": "HSA com hematoma intraparenquimatoso associado pode ocorrer quando o aneurisma rompe para o parênquima cerebral adjacente, piorando o prognóstico."},
    "f6": {"explanation_pt": "Calcificação meníngea é achado crônico e incidental, sem relação com sangramento agudo subaracnoide.", "clinical_pearl_pt": "Calcificações meníngeas ou durais são achados incidentais na TC que não devem ser confundidos com sangue agudo; a atenuação é diferente (calcificação >100 HU vs. sangue agudo ~60 HU)."},
    "f7": {"explanation_pt": "Edema cerebral difuso não é achado típico da HSA aguda. Pode ocorrer tardiamente por vasoespasmo e isquemia global, mas não na apresentação inicial.", "clinical_pearl_pt": "Edema cerebral difuso na apresentação inicial de HSA indica gravidade extrema (Hunt-Hess IV-V) e está associado a prognóstico reservado."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "A cefaleia súbita em ''trovoada'' (a pior da vida), rigidez nucal, vômitos e hipertensão arterial, associados à hiperdensidade nas cisternas basais na TC, são patognomônicos de HSA por ruptura de aneurisma.", "clinical_pearl_pt": "A cefaleia em trovoada (thunderclap headache) que atinge intensidade máxima em segundos é o sintoma mais importante da HSA; 25% dos pacientes têm cefaleia sentinela dias antes."},
    "d2": {"explanation_pt": "O AVC hemorrágico hipertensivo apresenta hematoma intraparenquimatoso (hiperdensidade no parênquima, geralmente em núcleos da base ou tálamo), não sangue nos espaços subaracnoides.", "clinical_pearl_pt": "HSA = sangue nas cisternas e sulcos; AVC hemorrágico = hematoma no parênquima. A localização do sangue na TC diferencia os dois diagnósticos."},
    "d3": {"explanation_pt": "A meningite bacteriana pode causar cefaleia e rigidez nucal, mas não produz hiperdensidade nas cisternas basais na TC. A febre alta e toxemia sistêmica são mais proeminentes.", "clinical_pearl_pt": "HSA e meningite compartilham cefaleia e rigidez nucal; a diferença-chave é a instalação (segundos na HSA vs. horas/dias na meningite) e a febre (mais proeminente na meningite)."},
    "d4": {"explanation_pt": "A trombose venosa cerebral apresenta hiperdensidade no seio venoso (sinal da corda densa) e pode causar hemorragia, mas com padrão diferente da HSA aneurismática.", "clinical_pearl_pt": "Na trombose venosa cerebral, o sinal do delta vazio (falha de enchimento no seio sagital na TC com contraste) é o achado patognomônico."},
    "d5": {"explanation_pt": "Tumores cerebrais com sangramento apresentam massa subjacente com hematoma, diferente da distribuição cisternal pura da HSA aneurismática.", "clinical_pearl_pt": "Sangramento intratumoral deve ser suspeitado quando há edema perilesional desproporcional ao volume do hematoma ou quando o hematoma tem localização atípica para hipertensiva."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "Após confirmação de HSA na TC, a angiotomografia cerebral identifica a localização e morfologia do aneurisma roto, permitindo planejamento neurocirúrgico (clipagem ou embolização endovascular) o mais precoce possível.", "clinical_pearl_pt": "O tratamento precoce do aneurisma (clipagem ou coiling nas primeiras 24h) reduz o risco de ressangramento, que é a principal causa de morte nas primeiras 24h pós-HSA."},
    "n2": {"explanation_pt": "A punção lombar diagnóstica é indicada quando a TC é negativa e a suspeita clínica persiste. Neste caso, a TC já confirma HSA, tornando a punção desnecessária e potencialmente perigosa.", "clinical_pearl_pt": "Nunca realizar punção lombar em paciente com HSA confirmada na TC; o risco de herniação é real se houver hidrocefalia ou efeito de massa associado."},
    "n3": {"explanation_pt": "O controle anti-hipertensivo agressivo isolado não é a prioridade. Na HSA, mantém-se PAS <160mmHg, mas o foco é identificar e tratar o aneurisma para prevenir ressangramento.", "clinical_pearl_pt": "Na HSA, o controle pressórico visa PAS <160mmHg antes do tratamento do aneurisma; após tratamento, pode-se permitir hipertensão induzida para prevenir vasoespasmo."},
    "n4": {"explanation_pt": "A observação com TC de controle em 24h é conduta inadequada na HSA aguda. O risco de ressangramento nas primeiras 24h é de 4-10%, com mortalidade de 40-60% no ressangramento.", "clinical_pearl_pt": "O ressangramento do aneurisma é a complicação mais letal nas primeiras 24-48h da HSA; por isso, o tratamento do aneurisma deve ser o mais precoce possível."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Hiperdensidade difusa nas cisternas basais confirmando sangue no espaço subaracnoide",
      "Sangue na fissura silviana bilateral indicando HSA difusa de provável origem aneurismática",
      "Hidrocefalia aguda incipiente por obstrução da drenagem liquórica pelo sangue",
      "Ausência de hematoma intraparenquimatoso ou lesão expansiva subjacente"
    ],
    "systematicApproach": "Na avaliação de HSA por TC: 1) Identificar hiperdensidade nos espaços subaracnoides (cisternas basais, fissuras silvianas, sulcos corticais); 2) Classificar pela escala de Fisher modificada (predição de vasoespasmo); 3) Avaliar presença de hidrocefalia (dilatação ventricular); 4) Procurar hematoma intraparenquimatoso ou intraventricular associado; 5) Solicitar angiotomografia para identificação do aneurisma.",
    "commonMistakes": [
      "Não considerar HSA em cefaleia súbita intensa sem sinais focais (forma leve pode ter TC normal)",
      "Não realizar punção lombar quando a TC é negativa mas a suspeita clínica é alta",
      "Confundir hiperdensidade cisternal com calcificação meníngea ou artefato",
      "Atrasar a investigação angiográfica e o tratamento neurocirúrgico do aneurisma"
    ],
    "clinicalCorrelation": "Homem de 50 anos com cefaleia súbita e intensa (a pior da vida), rigidez nucal e vômitos, sem trauma. A PA elevada (180/100) é frequente na HSA como resposta simpática ao sangramento. A TC confirma HSA com sangue nas cisternas basais e hidrocefalia incipiente. A angiotomografia cerebral é o próximo passo para localizar o aneurisma e planejar tratamento neurocirúrgico urgente.",
    "references": [
      "Diretriz HSA Aneurismática - Academia Brasileira de Neurologia 2023",
      "Connolly ES et al. Guidelines for Management of Aneurysmal SAH - AHA/ASA 2012",
      "Frontera JA et al. Prediction of symptomatic vasospasm after SAH: Modified Fisher Scale - Neurosurgery 2006"
    ]
  }'::jsonb
WHERE title_pt = 'Hemorragia subaracnoide aguda';

-- ============================================
-- CASE 15: Colecistite aguda calculosa (US, facil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A USG de abdome é o exame de primeira linha para colecistite aguda, com sensibilidade >90% para cálculos biliares e sinais inflamatórios da vesícula. É rápida, sem radiação e disponível à beira-leito.", "clinical_pearl_pt": "A USG é o exame mais custo-efetivo para dor em hipocôndrio direito; a combinação cálculo + espessamento parietal + Murphy ultrassonográfico tem valor preditivo positivo >90%."},
    "m2": {"explanation_pt": "A TC de abdome pode mostrar sinais de colecistite, mas tem sensibilidade inferior à USG para cálculos biliares (apenas 75% dos cálculos são radiopacos) e não é o exame inicial.", "clinical_pearl_pt": "A TC é útil na colecistite para avaliar complicações como perfuração, enfisema parietal (colecistite enfisematosa) ou abscesso pericolecístico."},
    "m3": {"explanation_pt": "A ColangioRM é excelente para avaliar vias biliares e coledocolitíase, mas não é necessária para o diagnóstico de colecistite aguda simples.", "clinical_pearl_pt": "A ColangioRM deve ser solicitada quando há suspeita de coledocolitíase associada (icterícia, dilatação de colédoco >6mm, elevação de enzimas canaliculares)."},
    "m4": {"explanation_pt": "A cintilografia hepatobiliar (HIDA) tem alta sensibilidade para colecistite (ausência de enchimento vesicular = obstrução do cístico), mas é reservada para casos duvidosos quando USG é inconclusiva.", "clinical_pearl_pt": "A cintilografia HIDA é o exame mais sensível para colecistite aguda (95-97%), pois demonstra diretamente a obstrução do ducto cístico pela ausência de enchimento vesicular."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "O cálculo impactado no infundíbulo (colo) da vesícula é o achado que confirma a obstrução do ducto cístico, mecanismo fisiopatológico central da colecistite aguda calculosa.", "clinical_pearl_pt": "A impactação do cálculo no infundíbulo vesicular obstrui o ducto cístico, causando distensão, estase biliar, inflamação e potencial infecção secundária."},
    "f2": {"explanation_pt": "O espessamento da parede vesicular acima de 3mm indica inflamação transmural, achado altamente sugestivo de colecistite aguda no contexto clínico adequado.", "clinical_pearl_pt": "O espessamento parietal vesicular >3mm não é exclusivo de colecistite; ocorre também em ascite, hepatite, hipoalbuminemia e ICC. O contexto clínico é essencial."},
    "f3": {"explanation_pt": "O sinal de Murphy ultrassonográfico (dor máxima à compressão do transdutor sobre a vesícula) é o achado mais específico da colecistite aguda na USG.", "clinical_pearl_pt": "O Murphy ultrassonográfico combina a identificação anatômica precisa da vesícula com a reprodução da dor, sendo mais específico que o Murphy clínico tradicional."},
    "f4": {"explanation_pt": "Líquido perivesicular indica inflamação peritoneal localizada ao redor da vesícula, sinal de colecistite aguda que pode preceder perfuração.", "clinical_pearl_pt": "Líquido perivesicular na USG é um sinal de alarme: indica inflamação significativa e deve motivar colecistectomia precoce para evitar complicações."},
    "f5": {"explanation_pt": "A dilatação das vias biliares intra-hepáticas sugere obstrução do colédoco (coledocolitíase ou tumor), não sendo achado da colecistite aguda isolada, onde o problema está no ducto cístico.", "clinical_pearl_pt": "Se houver dilatação de vias biliares + colecistite, suspeite de coledocolitíase associada (síndrome de Mirizzi ou cálculo migrado) e solicite ColangioRM."},
    "f6": {"explanation_pt": "Uma massa hepática heterogênea é achado suspeito para neoplasia hepática, completamente distinto da apresentação de colecistite aguda.", "clinical_pearl_pt": "Sempre examine o fígado sistematicamente na USG de hipocôndrio direito, mesmo quando a queixa principal sugere colecistite; achados incidentais hepáticos são comuns."},
    "f7": {"explanation_pt": "Ascite volumosa não é achado de colecistite aguda. Pode causar espessamento parietal vesicular reativo, mas não está relacionada ao quadro inflamatório biliar agudo.", "clinical_pearl_pt": "O espessamento parietal vesicular na presença de ascite é geralmente reativo (edema subseroso) e não deve ser interpretado como colecistite sem outros critérios."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Mulher obesa de 50 anos com dor intensa em hipocôndrio direito pós-prandial, febre e leucocitose, associada a cálculo impactado, espessamento parietal, Murphy USG positivo e líquido perivesicular, preenche todos os critérios de Tóquio para colecistite aguda calculosa.", "clinical_pearl_pt": "Os critérios de Tóquio (TG18) para colecistite aguda requerem: sinal inflamatório local (Murphy/dor HCD) + inflamação sistêmica (febre/leucocitose/PCR) + achado de imagem compatível."},
    "d2": {"explanation_pt": "A coledocolitíase apresenta dilatação de colédoco >6mm com cálculo no ducto biliar comum, icterícia e elevação de enzimas canaliculares (FA, GGT, bilirrubinas). O colédoco normal exclui esta hipótese.", "clinical_pearl_pt": "Coledocolitíase e colecistite podem coexistir; sempre avalie o calibre do colédoco na USG e solicite enzimas canaliculares se houver suspeita."},
    "d3": {"explanation_pt": "A colangite aguda requer obstrução de via biliar principal com infecção (tríade de Charcot: dor HCD + febre + icterícia). A ausência de icterícia e dilatação biliar torna este diagnóstico improvável.", "clinical_pearl_pt": "A tríade de Charcot (dor + febre + icterícia) identifica colangite em 50-70% dos casos; a pêntade de Reynolds (+ confusão + hipotensão) indica colangite supurativa grave."},
    "d4": {"explanation_pt": "A hepatite aguda apresenta hepatomegalia, icterícia, elevação significativa de transaminases (>10x) e ausência de cálculos impactados ou sinais inflamatórios vesiculares.", "clinical_pearl_pt": "Transaminases muito elevadas (>1000 UI/L) favorecem hepatite aguda (viral, tóxica, isquêmica); na colecistite, a elevação é leve ou ausente."},
    "d5": {"explanation_pt": "A pancreatite biliar pode coexistir com colecistite, mas apresenta amilase/lipase muito elevadas e dor epigástrica em faixa com irradiação dorsal como achados predominantes.", "clinical_pearl_pt": "Sempre dosar amilase/lipase na suspeita de colecistite: cálculos biliares são a causa mais comum de pancreatite aguda, e os diagnósticos podem coexistir."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A colecistectomia videolaparoscópica precoce (dentro de 72h) é o tratamento padrão da colecistite aguda, conforme diretrizes de Tóquio (TG18). A cirurgia precoce reduz complicações e tempo de internação.", "clinical_pearl_pt": "A colecistectomia precoce (<72h) é superior à tardia: menor taxa de conversão para cirurgia aberta, menor tempo de internação e menor custo total de tratamento."},
    "n2": {"explanation_pt": "O tratamento com ATB isolada sem cirurgia tem alta taxa de recorrência (30-40%) e não resolve definitivamente o problema. ATB é adjuvante, não tratamento definitivo.", "clinical_pearl_pt": "ATB na colecistite é tratamento adjuvante pré-operatório; cobertura para gram-negativos entéricos e anaeróbios (ex.: ceftriaxona + metronidazol)."},
    "n3": {"explanation_pt": "A CPRE de urgência é indicada para coledocolitíase com colangite, não para colecistite aguda isolada sem obstrução de via biliar principal.", "clinical_pearl_pt": "A CPRE é terapêutica (papilotomia + extração de cálculos do colédoco), não é o tratamento da colecistite; confundir as indicações é erro comum."},
    "n4": {"explanation_pt": "A colecistostomia percutânea é reservada para pacientes de altíssimo risco cirúrgico (ASA IV-V) que não toleram colecistectomia, como medida temporária de descompressão.", "clinical_pearl_pt": "A colecistostomia percutânea é ponte para colecistectomia definitiva em pacientes críticos; o dreno é mantido por 3-6 semanas até formação de trajeto fistuloso."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Cálculo impactado no infundíbulo vesicular causando obstrução do ducto cístico",
      "Espessamento da parede vesicular >3mm indicando inflamação transmural",
      "Sinal de Murphy ultrassonográfico positivo confirmando irritação vesicular localizada",
      "Líquido perivesicular indicando processo inflamatório com extensão peritoneal localizada"
    ],
    "systematicApproach": "Na avaliação de colecistite por USG: 1) Identificar cálculos biliares e sua localização (corpo, infundíbulo, impactado); 2) Medir espessura da parede vesicular (normal <3mm); 3) Testar sinal de Murphy ultrassonográfico (dor à compressão com transdutor sobre a vesícula); 4) Procurar líquido perivesicular; 5) Avaliar calibre do colédoco (<6mm normal); 6) Excluir dilatação de vias biliares que sugira coledocolitíase associada.",
    "commonMistakes": [
      "Interpretar espessamento parietal vesicular como colecistite sem considerar causas alternativas (ascite, ICC, hepatite)",
      "Não pesquisar o sinal de Murphy ultrassonográfico durante o exame",
      "Não avaliar o colédoco para excluir coledocolitíase associada",
      "Adiar a colecistectomia para além de 72h sem justificativa, aumentando morbidade"
    ],
    "clinicalCorrelation": "Mulher de 50 anos, obesa (fator de risco para colelitíase - regra dos 4F: female, forty, fat, fertile), com dor intensa em HCD pós-prandial há 12h, febre e leucocitose. A USG confirma cálculo impactado com sinais inflamatórios e Murphy ultrassonográfico positivo, preenchendo critérios de Tóquio (TG18) Grau I (colecistite aguda leve). Indicada colecistectomia videolaparoscópica precoce.",
    "references": [
      "Tokyo Guidelines 2018 (TG18) - Diagnostic criteria and severity grading of acute cholecystitis",
      "Diretriz de Colelitíase e Colecistite - Colégio Brasileiro de Cirurgia Digestiva",
      "Gurusamy KS et al. Early vs delayed laparoscopic cholecystectomy for acute cholecystitis - Cochrane 2013"
    ]
  }'::jsonb
WHERE title_pt = 'Colecistite aguda calculosa';

-- ============================================
-- CASE 16: Gestação ectópica tubária (US, dificil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A USG transvaginal é o exame padrão-ouro para investigação de gestação ectópica, com resolução superior para estruturas pélvicas e capacidade de identificar massas anexiais e líquido livre.", "clinical_pearl_pt": "Na USG transvaginal, a ausência de saco gestacional intrauterino com beta-hCG >1500-2000 mUI/mL (zona discriminatória) é altamente sugestiva de gestação ectópica."},
    "m2": {"explanation_pt": "A USG abdominal tem resolução inferior à transvaginal para estruturas pélvicas e pode não detectar massas anexiais pequenas ou gestação ectópica precoce.", "clinical_pearl_pt": "A USG abdominal pode complementar a transvaginal na avaliação de líquido livre abdominal difuso (hemoperitônio), mas nunca substitui a via transvaginal na gestação ectópica."},
    "m3": {"explanation_pt": "A TC de pelve não é indicada na investigação de gestação ectópica por expor a paciente à radiação ionizante e ter resolução inferior à USG transvaginal para esta finalidade.", "clinical_pearl_pt": "A TC deve ser evitada em mulheres em idade fértil com suspeita de gestação ectópica; a radiação é teratogênica e a USG transvaginal tem acurácia diagnóstica superior."},
    "m4": {"explanation_pt": "A RM de pelve não é o exame inicial para gestação ectópica por ser demorada e de acesso limitado na urgência. Pode ser útil em localizações atípicas (intersticial, cervical).", "clinical_pearl_pt": "A RM pélvica é reservada para gestações ectópicas de localização atípica (intersticial, cornual, cervical) onde a USG é inconclusiva e o planejamento cirúrgico exige detalhamento anatômico."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A ausência de saco gestacional intrauterino com beta-hCG acima da zona discriminatória (>1500-2000 mUI/mL) é o achado mais importante, indicando gestação ectópica até prova em contrário.", "clinical_pearl_pt": "Beta-hCG >2000 mUI/mL sem saco gestacional intrauterino na USG transvaginal = gestação ectópica até prova em contrário; este é o conceito de zona discriminatória."},
    "f2": {"explanation_pt": "A massa anexial complexa com anel tubário (''blob sign'' ou ''bagel sign'') à esquerda é o achado direto mais específico de gestação ectópica tubária na USG.", "clinical_pearl_pt": "O anel tubário hiperecogênico ao redor da massa anexial (bagel sign) é visualizado em 65% das ectópicas tubárias e é o achado ultrassonográfico mais específico."},
    "f3": {"explanation_pt": "Líquido livre no fundo de saco de Douglas indica sangramento intraperitoneal, sinal de alarme que sugere ruptura tubária ou sangramento ativo da ectópica.", "clinical_pearl_pt": "Líquido livre anecoico no fundo de saco pode ser fisiológico (pós-ovulatório); líquido com ecos internos (hemoperitoneu) é muito mais preocupante para ectópica rota."},
    "f4": {"explanation_pt": "Um saco gestacional tópico com BCF (batimento cardíaco fetal) exclui gestação ectópica na grande maioria dos casos (gestação heterotópica é extremamente rara, exceto em FIV).", "clinical_pearl_pt": "A gestação heterotópica (tópica + ectópica simultâneas) ocorre em 1:30.000 gestações espontâneas, mas em até 1:100 em pacientes submetidas a FIV."},
    "f5": {"explanation_pt": "O cisto de corpo lúteo simples é achado fisiológico da gravidez inicial, sendo frequentemente confundido com gestação ectópica. Não apresenta anel tubário nem conteúdo complexo.", "clinical_pearl_pt": "O corpo lúteo gestacional é sempre ipsilateral à ovulação; uma massa contralateral ao corpo lúteo tem maior probabilidade de ser ectópica."},
    "f6": {"explanation_pt": "Mioma submucoso é achado uterino benigno que não se relaciona com gestação ectópica. Pode ser identificado incidentalmente durante a USG.", "clinical_pearl_pt": "Miomas podem coexistir com gestação ectópica, mas não são fator causal; o principal fator de risco para ectópica é doença tubária prévia (DIP, cirurgia)."},
    "f7": {"explanation_pt": "Endometrioma ovariano é cisto de conteúdo hemático homogêneo (''vidro fosco'') associado à endometriose, não devendo ser confundido com gestação ectópica.", "clinical_pearl_pt": "Endometriomas são cistos com conteúdo homogêneo em vidro fosco na USG; a gestação ectópica tubária apresenta anel hiperecogênico e está separada do ovário."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Mulher com amenorreia de 7 semanas, dor em FIE progressiva, sangramento vaginal, beta-hCG de 3500 mUI/mL sem saco gestacional intrauterino, e massa anexial complexa esquerda com anel tubário e líquido livre confirma gestação ectópica tubária esquerda.", "clinical_pearl_pt": "A tríade clássica da gestação ectópica (amenorreia + dor abdominal + sangramento vaginal) está presente em apenas 50% dos casos; o beta-hCG quantitativo é essencial."},
    "d2": {"explanation_pt": "O aborto incompleto apresenta saco gestacional intrauterino desorganizado ou restos ovulares na cavidade uterina, com colo uterino aberto. Não há massa anexial.", "clinical_pearl_pt": "No aborto incompleto, a USG mostra conteúdo heterogêneo na cavidade uterina com colo aberto; na ectópica, o útero está vazio com massa anexial."},
    "d3": {"explanation_pt": "O cisto ovariano roto pode causar dor aguda e líquido livre, mas o beta-hCG seria negativo e não haveria anel tubário na massa anexial.", "clinical_pearl_pt": "O beta-hCG quantitativo diferencia gestação ectópica de cisto ovariano roto; ambos causam dor pélvica aguda e líquido livre, mas o hCG é negativo no cisto."},
    "d4": {"explanation_pt": "A DIP (doença inflamatória pélvica) apresenta espessamento tubário bilateral, líquido nas tubas e no fundo de saco, com febre e leucocitose. O beta-hCG é negativo.", "clinical_pearl_pt": "DIP e gestação ectópica compartilham dor pélvica e massa anexial; sempre dosar beta-hCG em mulher em idade fértil com dor pélvica para diferenciar."},
    "d5": {"explanation_pt": "Uma gravidez tópica inicial pode não ser visível na USG antes de 5 semanas de amenorreia; porém, com beta-hCG de 3500 mUI/mL, o saco gestacional deveria ser visualizado intrauterino.", "clinical_pearl_pt": "Se beta-hCG <1500 e USG sem saco gestacional, pode ser gestação tópica muito precoce; repetir beta-hCG em 48h (duplicação normal sugere gestação tópica viável)."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A laparoscopia com salpingectomia esquerda é o tratamento padrão para gestação ectópica tubária com indicação cirúrgica. A paciente está hemodinamicamente estável, permitindo abordagem laparoscópica.", "clinical_pearl_pt": "A salpingectomia é preferida sobre a salpingostomia na maioria dos casos, exceto quando a tuba contralateral está comprometida e há desejo de fertilidade futura."},
    "n2": {"explanation_pt": "O metotrexato IM é opção para ectópica íntegra com beta-hCG <5000, sem BCF e paciente assintomática/estável. Com beta-hCG de 3500, massa anexial e líquido livre, a cirurgia é mais segura.", "clinical_pearl_pt": "Critérios para metotrexato na ectópica: ectópica íntegra, beta-hCG <5000, sem BCF, massa <3,5cm, sem líquido livre significativo, paciente confiável para seguimento."},
    "n3": {"explanation_pt": "A conduta expectante com beta-hCG seriado é reservada para ectópicas com beta-hCG baixo e em declínio espontâneo. Com beta-hCG de 3500 e líquido livre, a conduta ativa é necessária.", "clinical_pearl_pt": "A conduta expectante pode ser considerada quando beta-hCG <1000 e em declínio; mas requer seguimento rigoroso e paciente com acesso rápido a emergência."},
    "n4": {"explanation_pt": "A curetagem uterina é tratamento para abortamento incompleto com restos ovulares, não para gestação ectópica. A gestação está na tuba, não no útero.", "clinical_pearl_pt": "Realizar curetagem em paciente com gestação ectópica é erro grave: atrasa o tratamento correto e pode causar sinéquias uterinas (síndrome de Asherman) desnecessariamente."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Ausência de saco gestacional intrauterino com beta-hCG acima da zona discriminatória (3500 mUI/mL)",
      "Massa anexial complexa à esquerda com anel tubário característico de gestação ectópica tubária",
      "Líquido livre no fundo de saco de Douglas sugerindo sangramento peritoneal ativo",
      "Endométrio espessado (reação decidual) sem saco gestacional intrauterino"
    ],
    "systematicApproach": "Na avaliação de gestação ectópica por USG transvaginal: 1) Avaliar cavidade uterina (presença ou ausência de saco gestacional intrauterino); 2) Examinar ambos os anexos sistematicamente (massas, anel tubário); 3) Identificar corpo lúteo (geralmente ipsilateral à ovulação); 4) Procurar líquido livre no fundo de saco de Douglas e nos recessos paracólicos; 5) Correlacionar achados com nível de beta-hCG e zona discriminatória.",
    "commonMistakes": [
      "Confundir pseudossaco gestacional (coleção decidual intrauterina) com saco gestacional verdadeiro",
      "Diagnosticar corpo lúteo hemorrágico como gestação ectópica (o corpo lúteo é intra-ovariano, a ectópica é extra-ovariana)",
      "Não solicitar beta-hCG quantitativo em mulher em idade fértil com dor pélvica aguda",
      "Realizar curetagem uterina assumindo aborto incompleto sem confirmar gestação intrauterina prévia"
    ],
    "clinicalCorrelation": "Mulher de 32 anos com amenorreia de 7 semanas, dor progressiva em FIE e sangramento vaginal. Beta-hCG de 3500 mUI/mL (acima da zona discriminatória) sem saco gestacional intrauterino, massa anexial complexa esquerda com anel tubário e líquido livre no fundo de saco. A paciente está hemodinamicamente estável, permitindo laparoscopia com salpingectomia. Se houvesse instabilidade hemodinâmica, laparotomia de emergência seria indicada.",
    "references": [
      "Diretriz de Gestação Ectópica - FEBRASGO 2023",
      "ACOG Practice Bulletin No. 193: Tubal Ectopic Pregnancy 2018",
      "Kirk E et al. Diagnosis of ectopic pregnancy with ultrasound - Best Practice & Research Clinical O&G 2009"
    ]
  }'::jsonb
WHERE title_pt = 'Gestação ectópica tubária';

-- ============================================
-- CASE 17: Urolitíase com hidronefrose (US, medio)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A USG de rins e vias urinárias é o exame inicial de escolha para cólica renal, detectando hidronefrose com alta sensibilidade e avaliando o parênquima renal sem radiação ionizante.", "clinical_pearl_pt": "A USG detecta hidronefrose com sensibilidade >90%, mas identifica o cálculo ureteral diretamente em apenas 50-60% dos casos; a dilatação do sistema coletor é o achado indireto mais confiável."},
    "m2": {"explanation_pt": "A TC de abdome sem contraste é o padrão-ouro para urolitíase (sensibilidade >95% para cálculos), mas a USG é preferível como exame inicial por evitar radiação e ter boa acurácia para hidronefrose.", "clinical_pearl_pt": "A TC sem contraste detecta todos os tipos de cálculos urinários, exceto os raríssimos cálculos de indinavir; é o exame definitivo quando a USG é inconclusiva."},
    "m3": {"explanation_pt": "A urografia excretora foi substituída pela TC sem contraste na investigação de urolitíase. Usa contraste iodado EV e radiação, com acurácia inferior.", "clinical_pearl_pt": "A urografia excretora é considerada obsoleta para urolitíase; a TC sem contraste e a USG são os exames de escolha na prática atual."},
    "m4": {"explanation_pt": "A RM de abdome não é indicada para urolitíase, pois cálculos não geram sinal na RM. É reservada para situações específicas como gestantes com USG inconclusiva.", "clinical_pearl_pt": "Na RM, cálculos aparecem como falhas de sinal (hipointensos em todas as sequências), sendo difíceis de detectar; a RM tem papel na urolitíase apenas em gestantes."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A dilatação pielocalicial moderada à esquerda indica obstrução do fluxo urinário, compatível com cálculo obstrutivo no ureter esquerdo causando hidronefrose grau II-III.", "clinical_pearl_pt": "A classificação da hidronefrose por USG vai de grau I (dilatação pelve apenas) a grau IV (pelve e cálices dilatados com afilamento cortical); orienta urgência do tratamento."},
    "f2": {"explanation_pt": "A identificação do cálculo na junção ureterovesical (JUV) esquerda confirma a causa obstrutiva da hidronefrose. A JUV é o ponto mais estreito do ureter e local mais comum de impactação.", "clinical_pearl_pt": "Os três pontos de estreitamento ureteral onde cálculos mais impactam são: JUP (junção ureteropélvica), cruzamento dos vasos ilíacos e JUV (junção ureterovesical)."},
    "f3": {"explanation_pt": "O rim direito sem alterações é um achado negativo importante que confirma a lateralidade do problema e exclui doença bilateral.", "clinical_pearl_pt": "Sempre examine ambos os rins na cólica renal: a comparação com o rim contralateral normal ajuda a confirmar e quantificar a hidronefrose do lado afetado."},
    "f4": {"explanation_pt": "Uma massa renal sólida à esquerda sugeriria neoplasia renal, diagnóstico completamente diferente de urolitíase. Não é compatível com o quadro de cólica renal aguda.", "clinical_pearl_pt": "Na USG para cólica renal, sempre avalie o parênquima renal: carcinoma de células renais pode ser achado incidental em até 2% das USGs abdominais."},
    "f5": {"explanation_pt": "Rim esquerdo atrófico indicaria doença crônica renal prévia, não cólica renal aguda por urolitíase. A atrofia renal unilateral pode resultar de obstrução crônica não tratada.", "clinical_pearl_pt": "Obstrução ureteral crônica não tratada leva à atrofia renal progressiva; após 6-8 semanas de obstrução completa, a recuperação funcional do rim torna-se improvável."},
    "f6": {"explanation_pt": "Dilatação bilateral simétrica sugere obstrução infravesical (HPB, estenose uretral) ou refluxo vesicoureteral bilateral, não urolitíase unilateral.", "clinical_pearl_pt": "Hidronefrose bilateral em homem idoso = pensar em HPB até prova em contrário; solicitar resíduo pós-miccional e avaliação prostática."},
    "f7": {"explanation_pt": "Cisto renal complexo Bosniak III requer investigação oncológica e não se relaciona com urolitíase. A classificação de Bosniak orienta conduta em cistos renais.", "clinical_pearl_pt": "Classificação de Bosniak: I e II = benignos (acompanhamento); IIF = acompanhamento rigoroso; III e IV = suspeitos de malignidade (cirurgia)."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "O quadro clássico de cólica renal esquerda com irradiação inguinal, hematúria microscópica, hidronefrose e cálculo na JUV esquerda confirma urolitíase obstrutiva com hidronefrose grau II-III.", "clinical_pearl_pt": "A cólica renal é a dor mais intensa da medicina; o paciente não consegue encontrar posição de alívio, diferente do abdome agudo peritoneal onde permanece imóvel."},
    "d2": {"explanation_pt": "Pielonefrite aguda apresenta febre, calafrios, dor lombar e leucocitúria. A paciente está afebril e sem sinais sistêmicos de infecção, tornando este diagnóstico improvável.", "clinical_pearl_pt": "Urolitíase obstrutiva + febre = pielo obstrutiva (emergência urológica que requer descompressão urgente com duplo-J ou nefrostomia + ATB)."},
    "d3": {"explanation_pt": "Tumor renal geralmente é assintomático ou causa hematúria macroscópica indolor. A cólica renal típica com cálculo visualizado na JUV exclui neoplasia como causa primária.", "clinical_pearl_pt": "A tríade clássica do carcinoma renal (hematúria + dor lombar + massa palpável) está presente em <10% dos casos; a maioria é achado incidental em exames de imagem."},
    "d4": {"explanation_pt": "Estenose de JUP congênita causa hidronefrose crônica geralmente diagnosticada na infância, com pelve renal dilatada mas sem cálculo ureteral. O quadro agudo não é típico.", "clinical_pearl_pt": "A estenose de JUP é a causa mais comum de hidronefrose neonatal diagnosticada por USG pré-natal; muitos casos resolvem espontaneamente no primeiro ano de vida."},
    "d5": {"explanation_pt": "O refluxo vesicoureteral (RVU) causa hidronefrose intermitente, geralmente bilateral, e é mais comum em crianças. Não cursa com cólica renal aguda nem cálculo ureteral.", "clinical_pearl_pt": "O RVU é diagnosticado por uretrocistografia miccional (UCM); a classificação vai de grau I (refluxo ao ureter) a grau V (refluxo com dilatação e tortuosidade acentuadas)."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "O tratamento inicial da cólica renal inclui analgesia potente (AINE + opioide se necessário) e alfa-bloqueador (tansulozina) como terapia expulsiva médica. Para cálculos >6mm ou refratários, litotripsia ou ureteroscopia são indicadas.", "clinical_pearl_pt": "A terapia expulsiva médica com tansulozina 0,4mg/dia aumenta em 30% a chance de eliminação espontânea de cálculos ureterais distais de 5-10mm."},
    "n2": {"explanation_pt": "A nefrectomia esquerda é procedimento radical e desproporcional para urolitíase com hidronefrose grau II-III e rim funcionante. Seria indicada apenas para rim não funcionante.", "clinical_pearl_pt": "Nefrectomia por urolitíase é indicada apenas quando o rim está destruído (pionefrose, rim não funcionante em cintilografia) e sem possibilidade de recuperação."},
    "n3": {"explanation_pt": "A nefrostomia percutânea de emergência é indicada para urolitíase obstrutiva complicada com infecção (pielo obstrutiva) ou insuficiência renal aguda. O paciente está afebril e sem sinais de infecção.", "clinical_pearl_pt": "As indicações de descompressão urinária urgente são: rim único obstruído, obstrução bilateral, pielo obstrutiva (infecção + obstrução) e insuficiência renal aguda."},
    "n4": {"explanation_pt": "ATB empírica não é indicada na urolitíase sem sinais de infecção. O paciente está afebril, sem leucocitose descrita e sem leucocitúria, não havendo indicação de antibioticoterapia.", "clinical_pearl_pt": "Iniciar ATB em cólica renal sem sinais de infecção é erro comum; reservar ATB para quando houver febre, leucocitose ou leucocitúria associadas."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Dilatação pielocalicial moderada à esquerda (hidronefrose grau II-III) confirmando obstrução urinária",
      "Cálculo identificado na junção ureterovesical esquerda como causa da obstrução",
      "Rim direito sem alterações, confirmando doença unilateral",
      "Ausência de sinais de complicação (pionerose, rotura, coleção perirrenal)"
    ],
    "systematicApproach": "Na avaliação de urolitíase por USG: 1) Examinar ambos os rins comparativamente (tamanho, ecogenicidade, diferenciação corticomedular); 2) Avaliar sistema pielocalicial (presença e grau de dilatação); 3) Procurar cálculos renais e ureterais (sombra acústica posterior); 4) Avaliar ureter proximal (JUP) e distal (JUV); 5) Verificar bexiga (jatos ureterais, cálculos vesicais); 6) Medir resíduo pós-miccional se indicado.",
    "commonMistakes": [
      "Confundir pelve renal extra-sinusal normal com hidronefrose (variante anatômica)",
      "Não avaliar o ureter distal e JUV, onde a maioria dos cálculos obstrutivos impacta",
      "Interpretar pirâmides medulares hipoecogênicas como cálculos ou cistos",
      "Não solicitar TC sem contraste quando a USG é inconclusiva mas a suspeita clínica é alta"
    ],
    "clinicalCorrelation": "Homem de 45 anos com cólica renal esquerda típica (dor lombar intensa com irradiação inguinal) há 6 horas, hematúria microscópica e afebril. A USG confirma hidronefrose moderada esquerda com cálculo na JUV. A conduta inicial é controle álgico com AINE e terapia expulsiva médica (alfa-bloqueador), com reavaliação para indicação de litotripsia ou ureteroscopia se o cálculo não for eliminado em 2-4 semanas.",
    "references": [
      "Diretriz de Urolitíase - Sociedade Brasileira de Urologia 2023",
      "EAU Guidelines on Urolithiasis 2024",
      "Smith-Bindman R et al. Ultrasonography vs CT for Suspected Nephrolithiasis - NEJM 2014"
    ]
  }'::jsonb
WHERE title_pt = 'Urolitíase com hidronefrose';

-- ============================================
-- CASE 18: Hérnia discal lombar L4-L5 (MRI, medio)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A RM de coluna lombar é o exame padrão-ouro para avaliação de hérnia discal e radiculopatia, com excelente resolução para estruturas neurais, discos e partes moles.", "clinical_pearl_pt": "A RM é superior à TC para avaliar compressão neural, grau de degeneração discal e patologia intracanal; as sequências T2 sagital e axial são as mais informativas."},
    "m2": {"explanation_pt": "A TC de coluna lombar pode detectar hérnias discais e estenose, mas tem resolução inferior à RM para tecidos moles e estruturas neurais. É alternativa quando há contraindicação à RM.", "clinical_pearl_pt": "A TC é superior à RM para avaliar estruturas ósseas (fraturas, espondilolistese); na hérnia discal, a RM é preferível por melhor visualização do disco e raízes nervosas."},
    "m3": {"explanation_pt": "O RX de coluna lombar não visualiza discos intervertebrais nem estruturas neurais. Mostra apenas alinhamento vertebral, espaços discais e alterações ósseas grosseiras.", "clinical_pearl_pt": "O RX de coluna lombar na lombalgia aguda sem sinais de alarme (red flags) é desnecessário e não modifica a conduta; RM é indicada apenas se red flags ou sintomas persistentes >6 semanas."},
    "m4": {"explanation_pt": "A eletroneuromiografia (ENMG) avalia a função nervosa e pode confirmar radiculopatia, mas não fornece informação anatômica sobre a causa da compressão. É complementar à RM.", "clinical_pearl_pt": "A ENMG é útil quando a RM é inconclusiva ou há discordância clínico-radiológica; também diferencia radiculopatia de neuropatia periférica e plexopatia."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A protrusão discal posterolateral esquerda em L4-L5 é o achado principal, representando deslocamento do material discal comprimindo o recesso lateral esquerdo onde passa a raiz L5.", "clinical_pearl_pt": "Hérnia posterolateral em L4-L5 comprime a raiz L5 (raiz de trânsito); hérnia foraminal ou extraforaminal no mesmo nível comprimeria a raiz L4 (raiz de saída)."},
    "f2": {"explanation_pt": "A compressão da raiz L5 esquerda é a correlação anatômica direta com o quadro clínico de ciatalgia e déficit no território de L5 (dorsiflexão do pé, região lateral da perna).", "clinical_pearl_pt": "Radiculopatia L5: fraqueza da dorsiflexão do pé e do hálux, dor na face lateral da perna e dorso do pé, reflexo tibial posterior pode estar diminuído."},
    "f3": {"explanation_pt": "A desidratação do disco L4-L5 (hipossinal em T2) indica degeneração discal, fator predisponente para herniação. É classificada pela escala de Pfirrmann.", "clinical_pearl_pt": "A classificação de Pfirrmann avalia degeneração discal por RM em 5 graus; graus IV-V (disco preto em T2) indicam degeneração avançada com perda de altura."},
    "f4": {"explanation_pt": "Estenose do canal central não está presente neste caso. A estenose lombar é mais comum em idosos e causa claudicação neurogênica, diferente da ciatalgia por hérnia discal.", "clinical_pearl_pt": "Claudicação neurogênica (piora ao caminhar, melhora ao sentar/flexionar) = estenose lombar; ciatalgia que piora sentado/Valsalva = hérnia discal."},
    "f5": {"explanation_pt": "Espondilolistese L4-L5 (deslizamento vertebral) pode coexistir com hérnia discal, mas não é o achado deste caso. Causa estenose foraminal e do recesso.", "clinical_pearl_pt": "A espondilolistese é classificada por Meyerding (I a V); graus I-II geralmente são tratados conservadoramente, graus III-V podem requerer artrodese."},
    "f6": {"explanation_pt": "Fratura vertebral por compressão sugere osteoporose ou metástase, com mecanismo e quadro clínico diferentes da hérnia discal (dor axial sem radiculopatia típica).", "clinical_pearl_pt": "Fraturas vertebrais osteoporóticas são achados frequentes em idosos; a presença de edema medular na RM (hipersinal em STIR) indica fratura aguda/subaguda."},
    "f7": {"explanation_pt": "Tumor intradural (schwannoma, meningioma, ependimoma) apresenta-se como lesão expansiva com realce pelo gadolínio, achado muito diferente de hérnia discal.", "clinical_pearl_pt": "Tumores intradurais causam dor noturna progressiva que não melhora com repouso; diferente da hérnia discal, que piora com atividade e melhora com repouso."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "O quadro de lombalgia com ciatalgia irradiada para membro inferior esquerdo, Lasègue positivo a 30 graus e RM mostrando protrusão discal L4-L5 com compressão de raiz L5 esquerda confirma hérnia discal com radiculopatia.", "clinical_pearl_pt": "O sinal de Lasègue positivo abaixo de 45 graus tem alta sensibilidade (91%) para hérnia discal lombar; quanto mais baixo o ângulo, mais específico o achado."},
    "d2": {"explanation_pt": "A estenose lombar degenerativa causa claudicação neurogênica (piora ao andar, melhora ao sentar/flexionar), diferente da ciatalgia que piora sentado. Acomete tipicamente idosos.", "clinical_pearl_pt": "Teste da bicicleta: pacientes com estenose lombar pedalam sem dor (coluna flexionada abre o canal); com doença vascular periférica, pedalar piora (aumento da demanda metabólica)."},
    "d3": {"explanation_pt": "A espondilolistese ístmica causa dor lombar e estenose foraminal, mas o mecanismo é deslizamento vertebral por defeito na pars interarticularis, não herniação discal.", "clinical_pearl_pt": "Espondilolistese ístmica é comum em jovens atletas (ginastas, mergulhadores) por fratura de estresse da pars interarticularis (espondilólise)."},
    "d4": {"explanation_pt": "A síndrome da cauda equina é emergência com anestesia em sela, retenção urinária e fraqueza bilateral. A força preservada e ausência de sintomas esfincterianos excluem este diagnóstico.", "clinical_pearl_pt": "Red flags para síndrome da cauda equina: retenção urinária, incontinência fecal, anestesia perineal em sela, fraqueza bilateral progressiva = RM urgente e cirurgia em até 48h."},
    "d5": {"explanation_pt": "Tumor vertebral metastático causa dor noturna progressiva, perda de peso e pode ter destruição óssea na RM. A história e os achados são incompatíveis com neoplasia.", "clinical_pearl_pt": "Red flags para tumor: dor noturna que acorda o paciente, perda de peso inexplicada, antecedente oncológico, idade >50 anos com lombalgia nova = investigar metástase."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "O tratamento conservador (fisioterapia, analgesia, orientação de atividade) é a conduta inicial para hérnia discal com radiculopatia sem red flags, pois 80-90% dos casos melhoram em 6-12 semanas.", "clinical_pearl_pt": "A maioria das hérnias discais reabsorve parcial ou completamente em 6-12 meses; a cirurgia acelera o alívio da dor, mas em 1-2 anos o resultado funcional é semelhante ao conservador."},
    "n2": {"explanation_pt": "A discectomia cirúrgica imediata é reservada para déficit motor progressivo, síndrome da cauda equina ou dor refratária a tratamento conservador adequado por 6-12 semanas.", "clinical_pearl_pt": "Indicações absolutas de cirurgia na hérnia discal: síndrome da cauda equina, déficit motor progressivo (pé caído). Indicação relativa: dor incapacitante refratária >6 semanas."},
    "n3": {"explanation_pt": "A infiltração epidural com corticosteroide pode ser considerada como terapia adjuvante para controle de dor, mas não é a primeira opção e seu benefício a longo prazo é controverso.", "clinical_pearl_pt": "Infiltração epidural de corticosteroide pode proporcionar alívio temporário (semanas a meses) da dor radicular, mas não altera a história natural da hérnia discal."},
    "n4": {"explanation_pt": "A imobilização com colete lombar rígido não é recomendada rotineiramente, pois pode causar atrofia muscular e não melhora desfechos. Atividade física orientada é preferível.", "clinical_pearl_pt": "Repouso prolongado e imobilização são contraindicados na hérnia discal; manter atividade física tolerada e fisioterapia ativa melhora os desfechos funcionais."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Protrusão discal posterolateral esquerda em L4-L5 causando compressão radicular",
      "Compressão da raiz nervosa L5 esquerda no recesso lateral, correlacionando com ciatalgia",
      "Desidratação discal L4-L5 (degeneração) como fator predisponente para a herniação",
      "Ausência de estenose central, espondilolistese ou sinais de alarme (tumor, fratura, infecção)"
    ],
    "systematicApproach": "Na avaliação de hérnia discal por RM lombar: 1) Avaliar alinhamento vertebral no sagital (espondilolistese); 2) Classificar degeneração discal em cada nível (Pfirrmann); 3) Identificar protrusões e extrusões discais (tipo, localização, nível); 4) Avaliar compressão de raízes nervosas e saco dural; 5) Verificar estenose central e foraminal; 6) Excluir diagnósticos diferenciais (tumor, infecção, fratura); 7) Correlacionar achados com quadro clínico (nível sintomático vs. assintomático).",
    "commonMistakes": [
      "Operar achados de RM sem correlação clínica (hérnias assintomáticas são comuns em adultos)",
      "Não diferenciar protrusão (base larga) de extrusão (base estreita) e sequestro (fragmento livre), que têm prognósticos diferentes",
      "Confundir o nível da raiz comprimida: hérnia posterolateral L4-L5 comprime L5, não L4",
      "Indicar cirurgia precoce sem tentativa adequada de tratamento conservador por 6-12 semanas"
    ],
    "clinicalCorrelation": "Homem de 38 anos com lombalgia e ciatalgia esquerda há 4 semanas, piora ao sentar e Valsalva, Lasègue positivo a 30 graus e força preservada. A RM confirma hérnia discal L4-L5 com compressão de L5, correlacionando com o dermátomo acometido. Sem red flags (força preservada, sem sintomas esfincterianos), o tratamento conservador com fisioterapia e analgesia é a conduta inicial, com reavaliação em 6 semanas.",
    "references": [
      "Diretriz de Lombalgia e Hérnia Discal - Sociedade Brasileira de Coluna 2023",
      "Kreiner DS et al. NASS Evidence-Based Clinical Guidelines for Lumbar Disc Herniation 2014",
      "Deyo RA et al. Low Back Pain - NEJM 2001"
    ]
  }'::jsonb
WHERE title_pt = 'Hérnia discal lombar L4-L5';

-- ============================================
-- CASE 19: Tumor cerebral de alto grau (MRI, dificil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A RM de crânio com gadolínio é o exame padrão-ouro para tumores cerebrais, oferecendo resolução superior para caracterizar a lesão, avaliar edema perilesional e planejar biópsia ou ressecção.", "clinical_pearl_pt": "Na RM, o padrão de realce pelo gadolínio ajuda a diferenciar tumores: realce anelar = alto grau/metástase; realce homogêneo = meningioma/baixo grau; sem realce = glioma de baixo grau."},
    "m2": {"explanation_pt": "A TC de crânio com contraste pode detectar tumores cerebrais, mas tem resolução inferior à RM para caracterização da lesão, avaliação de edema e planejamento cirúrgico.", "clinical_pearl_pt": "A TC com contraste é alternativa rápida quando a RM não está disponível; o realce anelar do glioblastoma na TC é semelhante ao padrão visto na RM."},
    "m3": {"explanation_pt": "O PET-CT cerebral com FDG ou aminoácidos é útil para diferenciar recidiva tumoral de radionecrose e para grading metabólico, mas não é o exame diagnóstico inicial.", "clinical_pearl_pt": "O PET com aminoácidos (metionina, FET) é superior ao FDG para tumores cerebrais, pois o cérebro normal tem alto metabolismo de glicose, reduzindo o contraste do FDG."},
    "m4": {"explanation_pt": "A angiografia cerebral pode ser utilizada no planejamento cirúrgico para mapear a vascularização tumoral, mas não é exame diagnóstico inicial.", "clinical_pearl_pt": "A angiografia pré-operatória pode ser útil em tumores hipervascularizados (meningiomas, hemangioblastomas) para embolização pré-cirúrgica, reduzindo sangramento intraoperatório."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "A lesão expansiva com realce anelar (em anel) no lobo frontal esquerdo é o padrão típico de glioblastoma (GBM), onde a periferia viável capta contraste e o centro necrótico não.", "clinical_pearl_pt": "O realce anelar irregular é a marca do glioblastoma; a parede do anel é irregular e espessa, diferente do abscesso, que tem cápsula fina e regular."},
    "f2": {"explanation_pt": "A necrose central com edema perilesional extenso (vasogênico) são achados de tumor de alto grau. O edema é desproporcionalmente extenso em relação ao tamanho do componente sólido.", "clinical_pearl_pt": "O edema vasogênico no tumor cerebral segue a substância branca (hiperintenso em T2/FLAIR); na espectroscopia, o pico de colina elevado confirma proliferação celular."},
    "f3": {"explanation_pt": "O desvio de linha média de 8mm para a direita indica efeito de massa significativo, com risco de herniação subfalcina e necessidade de corticoterapia imediata para reduzir edema.", "clinical_pearl_pt": "Desvio de linha média >5mm é sinal de alarme para herniação iminente; acima de 10mm, o risco de herniação uncal e comprometimento do nível de consciência é muito alto."},
    "f4": {"explanation_pt": "Lesão isquêmica aguda apresenta restrição à difusão (hipersinal em DWI, hipossinal em ADC), padrão diferente do tumor que tipicamente não restringe difusão na periferia.", "clinical_pearl_pt": "A sequência de difusão (DWI) ajuda a diferenciar tumor de AVC: o AVC agudo tem restrição à difusão; o tumor geralmente não, exceto linfoma (celularidade muito alta)."},
    "f5": {"explanation_pt": "O abscesso cerebral tem cápsula fina e regular com realce uniforme, diferente da parede espessa e irregular do glioblastoma. A difusão é restrita no abscesso (pus = viscoso).", "clinical_pearl_pt": "A difusão é a chave: abscesso cerebral tem restrição central (pus viscoso brilha em DWI); GBM tem facilitação central (necrose líquida não restringe)."},
    "f6": {"explanation_pt": "Múltiplas lesões desmielinizantes sugerem esclerose múltipla ou ADEM, com padrão de distribuição e morfologia completamente diferentes de uma lesão expansiva única com realce anelar.", "clinical_pearl_pt": "A lesão tumefativa desmielinizante pode mimetizar tumor cerebral; o anel aberto de realce (realce em C) e a espectroscopia podem ajudar na diferenciação."},
    "f7": {"explanation_pt": "Hidrocefalia obstrutiva não está presente neste caso. Ocorreria se a lesão comprimisse vias de drenagem liquórica (III ventrículo, aqueduto cerebral, IV ventrículo).", "clinical_pearl_pt": "Tumores que causam hidrocefalia por obstrução: tumores de fossa posterior em crianças (meduloblastoma, ependimoma), tumores da pineal e da região do aqueduto."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "A lesão expansiva frontal esquerda com realce anelar irregular, necrose central e edema extenso em mulher de 55 anos com cefaleia progressiva e crise convulsiva inaugural é o quadro clássico de glioblastoma (GBM, OMS grau IV).", "clinical_pearl_pt": "O glioblastoma é o tumor cerebral primário mais comum e mais agressivo em adultos; sobrevida mediana de 14-16 meses com tratamento padrão (cirurgia + TMZ + RT - protocolo Stupp)."},
    "d2": {"explanation_pt": "Metástase cerebral única pode ter aspecto semelhante ao GBM, mas tipicamente ocorre na junção corticossubcortical, tem edema desproporcional e história oncológica prévia. A biópsia diferencia.", "clinical_pearl_pt": "Metástases cerebrais são mais comuns que tumores primários; investigar sítio primário (pulmão, mama, melanoma, rim) antes de assumir glioblastoma em lesão única com realce anelar."},
    "d3": {"explanation_pt": "O abscesso cerebral tem cápsula fina regular, restrição à difusão central e geralmente febre e leucocitose. A evolução crônica sem febre e sem restrição à difusão torna este diagnóstico improvável.", "clinical_pearl_pt": "Quando há dúvida entre GBM e abscesso, a espectroscopia por RM pode ajudar: aminoácidos e lactato elevados sugerem abscesso; colina elevada sugere tumor."},
    "d4": {"explanation_pt": "O linfoma primário do SNC apresenta realce homogêneo intenso (tipicamente periventricular), não realce anelar. É mais comum em imunossuprimidos (HIV) e responde dramaticamente a corticoides.", "clinical_pearl_pt": "O linfoma primário do SNC é o ''tumor fantasma'': desaparece com corticoterapia e pode reaparecer após; por isso, evitar corticoides antes da biópsia quando se suspeita de linfoma."},
    "d5": {"explanation_pt": "O AVC isquêmico subagudo pode apresentar realce pelo contraste (quebra de barreira hematoencefálica), mas segue território vascular e tem evolução aguda, não progressiva por meses.", "clinical_pearl_pt": "O realce ''luxury perfusion'' do AVC subagudo (1-4 semanas) pode simular tumor na RM; a história clínica (início súbito vs. progressivo) é a chave para diferenciação."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "A corticoterapia (dexametasona) reduz o edema vasogênico e alivia sintomas compressivos imediatamente. A biópsia ou ressecção neurocirúrgica é necessária para confirmação histológica e tratamento definitivo.", "clinical_pearl_pt": "Dexametasona 10mg EV seguida de 4mg 6/6h é o esquema padrão para edema cerebral tumoral; a melhora clínica pode ser dramática em 24-48h pela redução do edema."},
    "n2": {"explanation_pt": "A radioterapia sem confirmação histológica prévia é contraindicada. O diagnóstico histológico é essencial para definir o tipo tumoral, grading molecular (IDH, MGMT) e plano terapêutico.", "clinical_pearl_pt": "O status de metilação do promotor MGMT e a mutação IDH são os marcadores moleculares mais importantes no GBM: MGMT metilado e IDH mutado conferem melhor prognóstico."},
    "n3": {"explanation_pt": "A punção lombar é contraindicada quando há lesão expansiva com efeito de massa e desvio de linha média, pelo risco de herniação cerebral transtentorial.", "clinical_pearl_pt": "Punção lombar em paciente com lesão expansiva e efeito de massa pode causar herniação uncal fatal; sempre realizar neuroimagem antes de punção lombar quando há suspeita de hipertensão intracraniana."},
    "n4": {"explanation_pt": "ATB empírica seria indicada para abscesso cerebral, mas os achados de imagem e a evolução clínica não são compatíveis com processo infeccioso. O diagnóstico provável é neoplásico.", "clinical_pearl_pt": "Iniciar ATB para abscesso cerebral sem confirmação pode atrasar a biópsia tumoral e comprometer o diagnóstico; porém, na dúvida genuína, a difusão por RM é o achado diferenciador."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Lesão expansiva com realce anelar irregular no lobo frontal esquerdo, padrão típico de glioma de alto grau",
      "Necrose central e edema perilesional extenso indicando alto grau de malignidade",
      "Desvio de linha média de 8mm para direita com risco de herniação subfalcina",
      "Ausência de restrição à difusão central (exclui abscesso) e localização não típica de metástase"
    ],
    "systematicApproach": "Na avaliação de tumor cerebral por RM: 1) Localização (lobular, profunda, fossa posterior, extra-axial); 2) Padrão de realce (anelar, homogêneo, ausente); 3) Presença de necrose, hemorragia e calcificação; 4) Extensão do edema perilesional; 5) Efeito de massa e desvio de linha média; 6) Comportamento na difusão (exclui abscesso); 7) Espectroscopia se disponível (colina/NAA); 8) Considerar diagnósticos diferenciais baseados na idade e localização.",
    "commonMistakes": [
      "Não considerar metástase cerebral única como diagnóstico diferencial de glioblastoma (investigar sítio primário)",
      "Confundir GBM com abscesso cerebral por ambos terem realce anelar (a difusão diferencia)",
      "Iniciar corticoides antes da biópsia quando há suspeita de linfoma (corticoide causa lise tumoral e pode impossibilitar diagnóstico)",
      "Não avaliar desvio de linha média e risco de herniação, atrasando corticoterapia de emergência"
    ],
    "clinicalCorrelation": "Mulher de 55 anos com cefaleia progressiva há 2 meses e crise convulsiva inaugural, hemiparesia direita sutil e papiledema bilateral. A RM mostra lesão frontal esquerda com realce anelar, necrose e edema extenso com desvio de 8mm. O quadro é altamente sugestivo de glioblastoma. A conduta imediata é dexametasona para reduzir edema e encaminhamento para neurocirurgia para ressecção máxima segura e confirmação histológica com análise molecular.",
    "references": [
      "Diretriz de Gliomas de Alto Grau - Sociedade Brasileira de Neurocirurgia 2023",
      "Stupp R et al. Radiotherapy plus concomitant and adjuvant temozolomide for glioblastoma - NEJM 2005",
      "Louis DN et al. WHO Classification of Tumors of the Central Nervous System 5th ed 2021"
    ]
  }'::jsonb
WHERE title_pt = 'Tumor cerebral de alto grau';

-- ============================================
-- CASE 20: Esclerose múltipla (MRI, muito_dificil)
-- ============================================
UPDATE cip_image_cases SET
  modality_options = merge_option_explanations(modality_options, '{
    "m1": {"explanation_pt": "A RM de crânio e medula com gadolínio é o exame essencial para diagnóstico de EM, permitindo demonstrar disseminação no espaço (múltiplas lesões em diferentes locais) e no tempo (lesões com e sem realce pelo gadolínio).", "clinical_pearl_pt": "Os critérios de McDonald 2017 permitem diagnóstico de EM com uma única RM se houver lesões com e sem realce simultâneo (disseminação temporal) em locais típicos (disseminação espacial)."},
    "m2": {"explanation_pt": "A TC de crânio tem sensibilidade muito baixa para lesões desmielinizantes. Pode ser normal ou mostrar apenas hipodensidades inespecíficas na substância branca, sendo inadequada para diagnóstico de EM.", "clinical_pearl_pt": "A TC é praticamente inútil para EM: a maioria das lesões desmielinizantes é invisível na TC. RM é obrigatória quando há suspeita clínica."},
    "m3": {"explanation_pt": "Os potenciais evocados visuais podem demonstrar desmielinização da via óptica (aumento da latência P100), apoiando o diagnóstico de EM, mas não substituem a RM como exame diagnóstico principal.", "clinical_pearl_pt": "Potenciais evocados visuais anormais em paciente com mielite transversa podem demonstrar lesão subclínica do nervo óptico, contribuindo para o critério de disseminação espacial."},
    "m4": {"explanation_pt": "A punção lombar com pesquisa de bandas oligoclonais no líquor apoia o diagnóstico de EM e pode substituir o critério de disseminação temporal nos critérios de McDonald 2017, mas não é o exame diagnóstico primário.", "clinical_pearl_pt": "Bandas oligoclonais presentes no líquor e ausentes no soro indicam síntese intratecal de imunoglobulinas, achado presente em >90% dos pacientes com EM estabelecida."}
  }'::jsonb),
  findings_options = merge_option_explanations(findings_options, '{
    "f1": {"explanation_pt": "As lesões periventriculares perpendiculares ao corpo caloso (dedos de Dawson) são o achado mais característico da EM na RM, refletindo desmielinização perivenular ao longo das vênulas medulares subependimárias.", "clinical_pearl_pt": "Os dedos de Dawson são lesões ovoides orientadas perpendicularmente ao corpo caloso no plano sagital; são altamente específicos para EM e raramente vistos em outras doenças."},
    "f2": {"explanation_pt": "Lesões na medula cervical em T2 representam desmielinização medular, contribuindo para o critério de disseminação espacial (lesão em pelo menos 2 das 4 áreas típicas: periventricular, cortical/justacortical, infratentorial, medular).", "clinical_pearl_pt": "Lesões medulares na EM são tipicamente curtas (<2 corpos vertebrais), periféricas e parciais; lesões longas (>3 corpos vertebrais) e centrais sugerem neuromielite óptica (NMO)."},
    "f3": {"explanation_pt": "A coexistência de lesões com realce pelo gadolínio (ativas, novas) e lesões sem realce (crônicas) demonstra disseminação temporal em um único exame, critério fundamental dos critérios de McDonald 2017.", "clinical_pearl_pt": "Realce pelo gadolínio em lesão de EM dura 2-8 semanas e indica inflamação ativa com ruptura da barreira hematoencefálica; lesões sem realce são crônicas/inativas."},
    "f4": {"explanation_pt": "Uma lesão expansiva única frontal sugere tumor cerebral ou lesão tumefativa desmielinizante, não o padrão multifocal típico de EM com lesões em diferentes estágios evolutivos.", "clinical_pearl_pt": "Lesão desmielinizante tumefativa (>2cm, efeito de massa) pode mimetizar tumor; a espectroscopia mostra glutamato/glutamina elevados em vez de colina, ajudando na diferenciação."},
    "f5": {"explanation_pt": "Leucoencefalopatia difusa simétrica sugere doença de pequenos vasos, leucodistrofia ou encefalopatia tóxico-metabólica, não o padrão assimétrico e multifocal da EM.", "clinical_pearl_pt": "Lesões de substância branca simétricas e confluentes em idoso = doença de pequenos vasos (microangiopatia); assimétrias, lesões justacorticais e medulares favorecem EM."},
    "f6": {"explanation_pt": "Infartos lacunares nos núcleos da base são achados de doença cerebrovascular de pequenos vasos, tipicamente em idosos hipertensos. A localização profunda nos núcleos da base não é típica de EM.", "clinical_pearl_pt": "Lesões nos núcleos da base não são típicas de EM e devem levantar diagnósticos alternativos como doença de pequenos vasos, vasculite ou doença de Behçet."},
    "f7": {"explanation_pt": "Atrofia cortical difusa é achado de doenças neurodegenerativas (Alzheimer) ou estágio muito avançado de EM, não sendo o achado predominante na apresentação diagnóstica.", "clinical_pearl_pt": "A atrofia cerebral na EM é um marcador de neurodegeneração progressiva e pode ser quantificada por volumetria por RM; sua taxa de progressão correlaciona-se com incapacidade."},
    "f8": {"explanation_pt": "Realce meníngeo difuso sugere meningite (infecciosa, carcinomatosa) ou paquimeningite hipertrófica, não sendo achado de EM. Na EM, o realce é das lesões parenquimatosas, não das meninges.", "clinical_pearl_pt": "Realce meníngeo na RM com gadolínio = pensar em meningite (infecciosa ou carcinomatosa), não EM. Realce leptomeníngeo sutil pode ocorrer na EM progressiva, mas é achado de pesquisa."}
  }'::jsonb),
  diagnosis_options = merge_option_explanations(diagnosis_options, '{
    "d1": {"explanation_pt": "Mulher jovem com dois episódios neurológicos separados no tempo (neurite óptica há 6 meses e mielite atual), lesões periventriculares típicas (dedos de Dawson), lesões medulares e coexistência de lesões ativas e inativas preenche os critérios de McDonald 2017 para EM.", "clinical_pearl_pt": "Os critérios de McDonald 2017 exigem disseminação no espaço (lesões em >=2 áreas típicas) e no tempo (lesões em diferentes estágios ou novos episódios clínicos), podendo ser demonstrados em uma única RM."},
    "d2": {"explanation_pt": "A neuromielite óptica de Devic (NMO/NMOSD) apresenta neurite óptica e mielite, mas as lesões medulares são longas (>=3 corpos vertebrais) e centrais, com anticorpo anti-AQP4 positivo. As lesões periventriculares típicas de EM não são características da NMO.", "clinical_pearl_pt": "A diferenciação EM vs. NMO é crucial: NMO tem lesões medulares longas, anti-AQP4+, e o tratamento com interferon-beta (usado na EM) pode piorar a NMO."},
    "d3": {"explanation_pt": "A ADEM (encefalomielite disseminada aguda) é monofásica, tipicamente pós-infecciosa em crianças, com múltiplas lesões grandes e simultâneas. A paciente adulta com dois episódios separados por meses não é compatível com ADEM.", "clinical_pearl_pt": "ADEM é monofásica e predomina em crianças pós-infecção; se houver novo surto após 3 meses, reclassificar como EM. ADEM recorrente em adultos é extremamente rara."},
    "d4": {"explanation_pt": "A vasculite do SNC causa lesões multifocais na substância branca, mas tipicamente afeta distribuição vascular (territorial), com cefaleia intensa e alteração do líquor. Os dedos de Dawson e o padrão perivenular são específicos de EM.", "clinical_pearl_pt": "A vasculite primária do SNC é diagnóstico de exclusão; a angiografia convencional pode mostrar estenoses multifocais segmentares (aspecto em rosário) das artérias cerebrais."},
    "d5": {"explanation_pt": "A LEMP (leucoencefalopatia multifocal progressiva) é causada pelo vírus JC em imunossuprimidos, com lesões confluentes da substância branca sem realce pelo gadolínio e sem efeito de massa. A paciente imunocompetente com lesões típicas de EM torna LEMP muito improvável.", "clinical_pearl_pt": "A LEMP é complicação temida do uso de natalizumabe na EM; monitorar anticorpo anti-JCV e considerar troca de terapia se soroconversão com índice >1,5."}
  }'::jsonb),
  next_step_options = merge_option_explanations(next_step_options, '{
    "n1": {"explanation_pt": "O encaminhamento ao neurologista para início de terapia modificadora de doença (TMD) é a conduta prioritária. As TMDs (interferon-beta, acetato de glatirâmer, fingolimode, natalizumabe, ocrelizumabe) reduzem surtos e progressão de incapacidade.", "clinical_pearl_pt": "O início precoce de TMD na EM remitente-recorrente reduz surtos em 30-70% e retarda progressão de incapacidade; a escolha do fármaco depende da atividade da doença, perfil de segurança e preferência do paciente."},
    "n2": {"explanation_pt": "A corticoterapia isolada (metilprednisolona EV) trata o surto agudo, mas sem acompanhamento neurológico e TMD, a doença continuará progredindo com novos surtos e acúmulo de incapacidade.", "clinical_pearl_pt": "A pulsoterapia com metilprednisolona 1g/dia EV por 3-5 dias acelera a recuperação do surto agudo, mas não altera a história natural da EM; a TMD é o que modifica o curso da doença."},
    "n3": {"explanation_pt": "A observação com RM de controle em 1 ano é conduta inadequada quando os critérios diagnósticos de EM já estão preenchidos. O atraso no início da TMD resulta em acúmulo de lesões e incapacidade.", "clinical_pearl_pt": "Na EM, ''tempo é cérebro'': cada surto não tratado e cada lesão nova na RM representam perda neuronal irreversível. O tratamento precoce preserva reserva neurológica."},
    "n4": {"explanation_pt": "A anticoagulação não tem papel no tratamento da EM. Seria indicada para trombose venosa cerebral, diagnóstico diferencial que já foi excluído pelos achados típicos de EM na RM.", "clinical_pearl_pt": "A trombose venosa cerebral pode causar lesões na substância branca que mimetizam EM; a venografia por RM ou angioTC venosa diferencia os diagnósticos."}
  }'::jsonb),
  structured_explanation = '{
    "keyFindings": [
      "Lesões periventriculares perpendiculares ao corpo caloso (dedos de Dawson), achado altamente específico de EM",
      "Lesões desmielinizantes na medula cervical em T2, demonstrando disseminação espacial para o compartimento medular",
      "Coexistência de lesões com realce pelo gadolínio (ativas) e sem realce (crônicas), demonstrando disseminação temporal em exame único",
      "Distribuição multifocal em áreas típicas de EM: periventricular, medular e potencialmente justacortical"
    ],
    "systematicApproach": "Na avaliação de EM por RM: 1) Avaliar lesões periventriculares (dedos de Dawson perpendiculares ao corpo caloso no sagital); 2) Procurar lesões justacorticais/corticais (sensibilidade aumentada com sequências como DIR); 3) Avaliar fossa posterior (pedúnculos cerebelares, assoalho do IV ventrículo, ponte); 4) Examinar medula espinal (lesões curtas, periféricas, parciais); 5) Verificar presença de realce pelo gadolínio em algumas lesões (disseminação temporal); 6) Aplicar critérios de McDonald 2017 para disseminação no espaço e no tempo.",
    "commonMistakes": [
      "Confundir lesões de substância branca inespecíficas (microangiopatia, migrânea) com EM em pacientes sem clínica compatível",
      "Não realizar RM de medula espinal, perdendo oportunidade de demonstrar disseminação espacial",
      "Não diferenciar EM de NMO/NMOSD, que tem tratamento e prognóstico diferentes",
      "Diagnosticar EM sem preencher critérios de McDonald, baseando-se apenas em ''lesões na substância branca'' inespecíficas na RM"
    ],
    "clinicalCorrelation": "Mulher de 28 anos com dois episódios neurológicos separados por 6 meses: neurite óptica (nervo óptico) e mielopatia (medula espinal), demonstrando disseminação no espaço clinicamente. A RM mostra lesões periventriculares típicas (dedos de Dawson), lesões medulares cervicais e coexistência de lesões ativas e inativas (disseminação temporal radiológica). Os critérios de McDonald 2017 estão plenamente satisfeitos. A hiper-reflexia de membros inferiores e Babinski bilateral confirmam acometimento do trato corticoespinal. O encaminhamento ao neurologista para pulsoterapia (surto atual) e início de TMD é a conduta prioritária.",
    "references": [
      "Thompson AJ et al. Diagnosis of multiple sclerosis: 2017 revisions of the McDonald criteria - Lancet Neurology 2018",
      "Diretriz de Esclerose Múltipla - Academia Brasileira de Neurologia / BCTRIMS 2023",
      "Filippi M et al. MRI criteria for the diagnosis of multiple sclerosis: MAGNIMS consensus guidelines - Lancet Neurology 2016"
    ]
  }'::jsonb
WHERE title_pt = 'Esclerose múltipla';

-- ============================================================
-- Cleanup: drop helper function
-- ============================================================
DROP FUNCTION IF EXISTS merge_option_explanations(JSONB, JSONB);

-- Done! All 20 cases now have per-option explanations and structured explanations.
