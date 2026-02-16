# Darwin Logo Scorecard v1

Automatic scoring matrix for selecting final logo candidates.

## Criteria and weights

- `silhouette_distinctiveness` (20%)
- `legibility_24px` (20%)
- `dark_light_versatility` (15%)
- `non_cliche_uniqueness` (15%)
- `lockup_balance` (10%)
- `app_icon_fit` (10%)
- `production_readiness` (10%)

All criterion scores use the same scale:
- `1` poor
- `2` weak
- `3` acceptable
- `4` strong
- `5` excellent

## Critical gate

Any candidate is automatically failed (`FAIL_CRITICAL`) if:
- `silhouette_distinctiveness < 3`, or
- `legibility_24px < 3`

## Approval thresholds

- `APPROVED`: score `>= 85` and no critical fail
- `REVIEW`: score `75-84.99` and no critical fail
- `REJECT`: score `< 75`
- `FAIL_CRITICAL`: critical gate failed

## How to use

1. Duplicate/edit the template:
   - `scripts/brand/logo_scorecard_template.csv`
2. Fill all candidate rows with scores from 1 to 5.
3. Run:
   - `pnpm brand:score-logo -- --input scripts/brand/logo_scorecard_template.csv --out docs/brand/logo_score_results.json`

## Output

The script prints ranked candidates in terminal and can export JSON results.

Script path:
- `scripts/brand/score_logo_candidates.ts`

