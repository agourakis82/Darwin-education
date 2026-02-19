# Darwin-MFC Runtime Counts

Run from repository root:

```bash
bash _paperpack/scripts/run_darwin_mfc_runtime_counts.sh
```

This command imports the live Darwin-MFC runtime exports from:

- `darwin-MFC/lib/data/doencas/index.ts`
- `darwin-MFC/lib/data/medicamentos/index.ts`

Outputs:

- `_paperpack/derived/darwin_mfc_runtime_counts.json`
- `_paperpack/derived/darwin_mfc_duplicates.csv`
- `_paperpack/derived/darwin_mfc_runtime_log.txt`
