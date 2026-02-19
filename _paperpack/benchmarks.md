# Benchmarks

## Existing Evaluation Hooks

- Shared package unit tests (Vitest): `packages/shared/package.json:9-9`
- Web end-to-end tests (Playwright): `apps/web/package.json:11-11`
- CI test workflow: `.github/workflows/test.yml:1-1`

## Minimal Local Run Attempt

- Probe status: `RUN_OK`
- Probe command: `pnpm --filter @darwin-education/shared test`
- Exit code: `0`
- Duration (s): `5`
- Node detected: `v20.20.0`
- pnpm available: `True`
- Blockers: NOT FOUND
- Discovery log: `/home/demetrios/work/darwin-education/_paperpack/logs/benchmark_discovery.txt`
- Run log: `/home/demetrios/work/darwin-education/_paperpack/logs/benchmark_run.log`

Latency: captured in run log
Throughput: NOT FOUND
Cost proxy (tokens): NOT FOUND
Failure rate: derive from test report

## If Blocked: Minimal Mock/Stub Path

When full runtime is unavailable, run the local mock benchmark driver (does not touch production code):
```bash
python3 _paperpack/scripts/mock_benchmark_driver.py
```
This creates `_paperpack/mock_benchmark_results.json` and `_paperpack/mock_benchmark_results.md` as placeholder structure for later real measurements.
