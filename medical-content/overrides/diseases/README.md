# Disease overrides

Add one JSON per disease id. Example: `rinite-alergica.json`.

The JSON is deep-merged into the Darwin-MFC payload during `seed:medical-content`.

## Draft workflow (recommended)

To avoid pushing incomplete medical content to production, scaffold drafts under:

- `medical-content/overrides/diseases/_drafts/*.json` (not imported)

Generate drafts:

```bash
pnpm scaffold:medical-fullcontent -- --id rinite-alergica
pnpm scaffold:medical-fullcontent -- --all-missing --limit 20
```

When the draft is ready (real content + citations), move it to:

- `medical-content/overrides/diseases/*.json`
