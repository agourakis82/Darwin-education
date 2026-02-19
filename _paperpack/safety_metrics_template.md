# Safety Metrics Template

## Inputs

Expected review CSV columns (minimum):
- `sample_id`
- `auto_approved` (0/1)
- `failure_mode` (string)
- `model_dangerous_pred` (0/1)
- `expert_dangerous_label` (0/1)

Template generator script: `_paperpack/scripts/compute_safety_metrics.py:1-1`

## Metrics

### (a) Auto-Approval Rate with 95% Wilson CI
- `p = k / n`
- `center = (p + z^2/(2n)) / (1 + z^2/n)` with `z = 1.96`
- `margin = z * sqrt((p(1-p)+z^2/(4n))/n) / (1 + z^2/n)`
- CI = `[center - margin, center + margin]`

### (b) Failure-Mode Prevalence
- For each category `m`: `prevalence(m) = count(m) / N`.

### (c) Expert Review Sensitivity/Specificity for Clinically Dangerous Errors
- Confusion matrix from model prediction vs expert label:
  - Sensitivity = `TP / (TP + FN)`
  - Specificity = `TN / (TN + FP)`

## Commands

```bash
# Create template input + NOT RUN placeholder outputs
python3 _paperpack/scripts/compute_safety_metrics.py --out-dir _paperpack

# Compute real metrics from labeled review data
python3 _paperpack/scripts/compute_safety_metrics.py --input path/to/reviews.csv --out-dir _paperpack
```

## Output Files

- `_paperpack/safety_metrics_computed.json`
- `_paperpack/safety_metrics_computed.md`
- `_paperpack/safety_metrics_inputs_template.csv`
