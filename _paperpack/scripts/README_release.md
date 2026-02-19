# Release Script (v0.3.1)

This script runs the full evidence pipeline, verification, integrity gate, and tests, failing fast on the first error and producing a release manifest.

## Usage

```bash
bash _paperpack/scripts/release_v0.3.1.sh
```

Outputs
	•	Logs: _paperpack/logs/v0.3.1_release_*
	•	Manifest: _paperpack/derived/v0.3.1_release_*_manifest.json

Notes
	•	The script does not invent or embed a Zenodo DOI. Add the DOI after deposit.
	•	Tagging/releasing should be done manually to maintain control:
	•	git tag preprint-v0.3.1 && git push --tags
