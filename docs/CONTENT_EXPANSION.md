# Content expansion (questões, flashcards, trilhas)

Este documento descreve um fluxo **prático e seguro** para aumentar o volume de conteúdo no Darwin Education sem degradar qualidade (quality gate) e sem assumir licenças/proveniência.

## 1) “SOTA++” (quality gate) para questões geradas

Recomendação: tratar **geração** e **validação** como dois passos separados.

- **Gerar** com um prompt forte (padrões de item-writing, Bloom, IRT, distratores plausíveis).
- **Validar** com pipeline multi-estágio (estrutura, linguagem, acurácia médica, distratores, originalidade, IRT).
- **Iterar**: se falhar no gate, reescrever a questão usando o feedback do validador e revalidar.

Base conceitual de item-writing:
- NBME Item Writing Guide (princípios de “one best answer”, evitar “all/none of the above”, evitar pistas, etc.).

## 2) Fontes abertas para “baixar mais questões” (atenção a licenças)

Datasets úteis (principalmente em inglês) para **treino interno, avaliação e bootstrap**:

- **MedQA** (USMLE + MCMLE) – repo com licença MIT (ver repositório oficial antes de usar em produção).
- **MedMCQA** – há versões publicadas com licenças diferentes dependendo do host (confira a licença do artefato que você baixar).
- **PubMedQA** – perguntas/QA baseadas em abstracts PubMed (repositório com licença MIT).

Importante:
- Mesmo com um `LICENSE` permissivo no repositório, **pode haver direitos autorais no conteúdo original das questões** (provas, livros, etc.). Trate como **sinal de risco** e valide juridicamente antes de publicar itens em produção.
- Para beta, prefira: (a) usar datasets como *input de avaliação*; (b) gerar itens novos com QGen + quality gate; (c) armazenar apenas conteúdo com proveniência clara.

## 3) Import rápido (MedMCQA JSONL → Supabase seed SQL)

Script:
- `scripts/db/import_medmcqa_to_sql.ts`

Exemplo (gera um seed SQL com 500 itens):

```bash
pnpm exec tsx scripts/db/import_medmcqa_to_sql.ts \
  --input /caminho/para/medmcqa.jsonl \
  --output infrastructure/supabase/seed/expansion/medmcqa_import.sql \
  --limit 500 \
  --bank-name "MedMCQA (piloto)" \
  --bank-source community
```

Depois, para aplicar no projeto Supabase:
- crie uma migration que inclua o arquivo gerado, **ou** cole o SQL diretamente numa migration,
- rode `npx supabase db push`.

## 3.1) Import (MedQA / PubMedQA)

Scripts:
- `scripts/db/import_medqa_to_sql.ts` (MCQ; opcional `--enrich` para gerar explicações + referências)
- `scripts/db/import_pubmedqa_to_sql.ts` (QA 3-way convertido para MCQ com referência PubMed quando houver `pubid/pmid`)

Exemplo (MedQA com enriquecimento via Grok/XAI):

```bash
pnpm exec tsx scripts/db/import_medqa_to_sql.ts \
  --input /caminho/para/medqa.jsonl \
  --output infrastructure/supabase/seed/expansion/medqa_import.sql \
  --limit 500 \
  --bank-name "MedQA (piloto)" \
  --bank-source community \
  --enrich
```

Exemplo (PubMedQA):

```bash
pnpm exec tsx scripts/db/import_pubmedqa_to_sql.ts \
  --input /caminho/para/pubmedqa.jsonl \
  --output infrastructure/supabase/seed/expansion/pubmedqa_import.sql \
  --limit 500 \
  --bank-name "PubMedQA (piloto)" \
  --bank-source community
```

Observação:
- Os importers populam `reference_list` quando conseguem extrair URLs de referências.

## 4) Flashcards e trilhas

- **Flashcards**: o caminho mais seguro é gerar cards a partir de conteúdo com proveniência (módulos de leitura e Darwin‑MFC), e manter revisão humana para cards com doses/condutas.
- **Trilhas (study_paths / study_modules)**: mantenha módulos “reading-first” públicos (navegáveis) e adicione gradualmente módulos de quiz/flashcards conforme o banco de questões crescer.

## 5) Ontologias (schema.org) e JSON-LD

Para tornar o conteúdo mais “machine-readable” (inclusive referências), use JSON‑LD com `schema.org`:
- `@type: Question` (stem, alternativas, acceptedAnswer opcional)
- `citation` para URLs de diretrizes/sociedades/PubMed

Sugestão: gerar o JSON‑LD diretamente na UI de preview/revisão de questões (QGen), e/ou nas páginas públicas de conteúdo.

## Referências (links)

```text
NBME – Item Writing Guide (download)
https://www.nbme.org/examinees/item-writing-guide

MedQA (MIT) – GitHub
https://github.com/jind11/MedQA

MedMCQA (ver licença do host/artefato)
https://github.com/openlifescienceai/medmcqa
https://huggingface.co/datasets/openlifescienceai/medmcqa

PubMedQA (MIT) – GitHub
https://github.com/pubmedqa/pubmedqa
```
