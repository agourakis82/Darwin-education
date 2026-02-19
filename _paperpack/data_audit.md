# Data and Calibration Artifacts Audit

## ENAMED Microdata References

- ETL pipeline documentation: `infrastructure/supabase/seed/enamed-2025-etl/README.md:1-1`
- Local microdata directory expected by ETL: `infrastructure/supabase/seed/enamed-2025-etl/README.md:34-34`
- Item-parameter parser: `infrastructure/supabase/seed/enamed-2025-etl/parsers/item-parameters.ts:3-3`
- Participant parser: `infrastructure/supabase/seed/enamed-2025-etl/parsers/participant-data.ts:178-178`
- Type/schema declarations: `infrastructure/supabase/seed/enamed-2025-etl/types.ts:10-10`

## ENAMED Artifacts (in-repo)

| Artifact | Size | Format | Schema status | Header sample | Included in repo |
|---|---:|---|---|---|---|
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq1.txt:1-1` | 20.07 MB | txt | OBSERVED_HEADER | NU_ANO, TP_INSCRICAO, CO_CADERNO, NU_ITEM, NU_ITEM_Z, NU_ITEM_X, DS_VT_GAB_OBJ, DS_VT_ACE_OBJ | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq10.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_07 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq11.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_08 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq12.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_09 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq13.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_10 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq2.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, TP_SEXO | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq3.txt:1-1` | 499.27 KB | txt | OBSERVED_HEADER | NU_ANO, NU_IDADE | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq4.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_01 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq5.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_02 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq6.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_03 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq7.txt:1-1` | 445.74 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_04 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq8.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_05 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Demais Participantes/microdados_demais_part_2025_arq9.txt:1-1` | 443.80 KB | txt | OBSERVED_HEADER | NU_ANO, NU_QUESTAO_06 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq1.txt:1-1` | 1.64 MB | txt | OBSERVED_HEADER | NU_ANO, TP_INSCRICAO, CO_CURSO, CO_IES, CO_CATEGAD, CO_ORGACAD, CO_GRUPO, CO_MUNIC_CURSO | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq10.txt:1-1` | 574.09 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I04 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq11.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I05 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq12.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I06 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq13.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I07 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq14.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I08 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq15.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I09 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq16.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I10 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq17.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I11 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq18.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I12 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq19.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I13 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq2.txt:1-1` | 961.36 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, ANO_FIM_EM, ANO_IN_GRAD, CO_TURNO_GRADUACAO | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq20.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I14 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq21.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I15 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq22.txt:1-1` | 579.45 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I16 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq23.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I17 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq3.txt:1-1` | 14.21 MB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, CO_CADERNO, NU_ITEM, NU_ITEM_Z, NU_ITEM_X, DS_VT_GAB_OBJ, DS_VT_ACE_OBJ | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq4.txt:1-1` | 3.63 MB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I18, QE_I19, QE_I20, QE_I21, QE_I22, QE_I23 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq5.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, TP_SEXO | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq6.txt:1-1` | 611.59 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, NU_IDADE | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq7.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I01 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq8.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I02 | true |
| `microdados_enamed_2025_19-01-26/DADOS/Enade/microdados_enade_2025_arq9.txt:1-1` | 572.73 KB | txt | OBSERVED_HEADER | NU_ANO, CO_CURSO, QE_I03 | true |
| `microdados_enamed_2025_19-01-26/DADOS/microdados2025_parametros_itens.txt:1-1` | 3.80 KB | txt | OBSERVED_HEADER | NU_ITEM_PROVA_1, NU_ITEM_PROVA_2, ITEM_MANTIDO, PARAMETRO_B, COR_BISSERIAL, INFIT, OUTFIT | true |

## Darwin-MFC Mappings and Item-Bank Linkage

- Documented counts appear in root README (368 diseases, 690 medications): `README.md:39-39`
- Documented counts also appear in release notes: `ZENODO_RELEASE.md:168-168` and `ZENODO_RELEASE.md:169-169`
- Theory adapter states the same counts in code comments: `apps/web/lib/theory-gen/adapters/darwin-mfc-adapter.ts:4-4`
- Runtime adapter fallback indicates package may be unavailable (empty fallbacks): `apps/web/lib/theory-gen/adapters/darwin-mfc-adapter.ts:20-20`
- Alternate web adapter currently uses stub arrays: `apps/web/lib/adapters/medical-data.ts:5-5` and `apps/web/lib/adapters/medical-data.ts:113-113`
- Consolidated disease index in submodule: `darwin-MFC/lib/data/doencas/index.ts:84-84`
- Consolidated medication index in submodule: `darwin-MFC/lib/data/medicamentos/index.ts:148-148`
- Runtime-verifiable installed package counts (exact 368/690 from executable import): NOT FOUND
- Explicit item-bank blueprint map directly linking Darwin-MFC counts to exam blueprint constraints: NOT FOUND

## Access Method and Formats

- Access method: local microdata files read by ETL parsers (`.txt` semicolon-delimited), then transformed for Supabase insertion.
  Evidence: `infrastructure/supabase/seed/enamed-2025-etl/parsers/item-parameters.ts:2-2`, `infrastructure/supabase/seed/enamed-2025-etl/parsers/participant-data.ts:2-2`
- External acquisition URL embedded in repo for microdata source: NOT FOUND
- Data dictionary artifacts (`.xlsx`, `.ods`, `.pdf`) are present but schema extraction from those binaries is NOT PARSED in this pack.
  Evidence: `microdados_enamed_2025_19-01-26/1. LEIA-ME/Dicionário_arquivos_variáveis_microdados_Enamed_2025.xlsx:1-1`
