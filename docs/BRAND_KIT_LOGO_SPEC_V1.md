# Darwin Education Brand Kit Logo Spec v1

## 1. Objective

Define a production-ready logo system for Darwin Education with premium quality, high legibility, and consistent cross-platform usage (web, mobile, social, and docs).

This spec is decision-complete for design production.

## 2. Creative Direction

### 2.1 Positioning
- Premium medical-edtech
- Minimal and confident
- Human + clinical intelligence

### 2.2 Visual language
- Geometric symbol with smooth curves
- High contrast and generous negative space
- No visual noise, no ornamental complexity
- No literal medical cliches (red cross, stethoscope, heartbeat line)

### 2.3 Symbol concept (locked)
- Primary concept: monogram `D` built from a continuous learning path.
- Secondary read: abstract clinical route/decision flow.
- Keep the symbol abstract enough to age well.

## 3. Logo System Deliverables

Produce all assets listed below.

### 3.1 Core lockups
1. Wordmark horizontal (symbol + Darwin Education)
2. Stacked lockup (symbol above wordmark)
3. Symbol only (app/icon/avatar usage)
4. Monochrome symbol (black and white)

### 3.2 Color modes
- `full-color-light` (for light backgrounds)
- `full-color-dark` (for dark backgrounds)
- `mono-black`
- `mono-white`

### 3.3 Mandatory export formats
- `SVG` (master, editable vectors)
- `PNG` (transparent where applicable)
- `PDF` (print-safe vector package)

## 4. Technical Specs

### 4.1 Size exports
- Horizontal logo: `2400x800`
- Stacked logo: `1600x1600`
- Symbol: `1024x1024`
- Favicon: `32x32`, `16x16`
- Social avatar: `800x800`
- Open Graph mark variant: `1200x630`

### 4.2 App icon package
- Master app icon canvas: `1024x1024` (no transparency, no rounded corners baked in)
- iOS icon set derived from master
- Android adaptive icon foreground/background derived from master

### 4.3 Safe area and minimum sizes
- Safe area around symbol: at least `0.5x` symbol stroke width on all sides.
- Minimum digital width:
  - Horizontal: `140px`
  - Symbol-only: `24px`
- Do not place the logo over busy photo regions without contrast layer.

## 5. Color and Typography Rules

### 5.1 Core palette (proposed)
- `Darwin Graphite`: `#0B0F14`
- `Clinical Slate`: `#1B2430`
- `Darwin Emerald`: `#00B894`
- `Sterile White`: `#F7F9FC`

### 5.2 Contrast requirements
- WCAG target for primary lockup usage: minimum 4.5:1.
- If contrast fails, switch to mono variant.

### 5.3 Typography guidance
- Wordmark lettering must be custom-tuned or heavily kern-adjusted.
- No generic default sans with untouched spacing.
- Keep optical balance at small sizes.

## 6. Generation Prompts (Image Model)

Use these prompts as a base and iterate.

### Prompt A: Primary symbol exploration
`Premium logo symbol for Darwin Education, monogram letter D formed by a continuous learning path, minimal geometric curves, high-end medical technology feel, clean vector style, strong negative space, no medical cliches, transparent background`

### Prompt B: Horizontal lockup
`Logo lockup for Darwin Education with abstract D symbol and elegant custom wordmark, minimal and premium, balanced spacing, high contrast, vector-clean edges, transparent background, no mockup, no 3d`

### Prompt C: Monochrome stress test
`Monochrome black and white logo variants for Darwin Education symbol, optimized for tiny sizes and favicon readability, simple geometry, no gradients`

### Prompt D: App icon candidate
`App icon for Darwin Education based on abstract D symbol, centered, bold but minimal, premium tech-medical look, works at 24px, flat design, no text, plain background`

## 7. Quality Gate Checklist

A candidate is approved only if all items pass.

1. Recognizable at `24px`
2. Distinct silhouette in monochrome
3. Works on both dark and light backgrounds
4. No cliche medical iconography
5. Visual balance is stable in horizontal and stacked lockups
6. App icon remains identifiable without wordmark
7. Export set complete (`SVG`, `PNG`, `PDF`, icon sizes)

## 8. Naming Convention (Locked)

Use this exact naming:

- `darwin-logo-horizontal-full-light.svg`
- `darwin-logo-horizontal-full-dark.svg`
- `darwin-logo-horizontal-mono-black.svg`
- `darwin-logo-horizontal-mono-white.svg`
- `darwin-logo-stacked-full-light.svg`
- `darwin-logo-stacked-full-dark.svg`
- `darwin-symbol-full-light.svg`
- `darwin-symbol-full-dark.svg`
- `darwin-symbol-mono-black.svg`
- `darwin-symbol-mono-white.svg`
- `darwin-appicon-master-1024.png`
- `darwin-favicon-32.png`
- `darwin-favicon-16.png`

## 9. Repository Placement

Final assets go to:

- `apps/web/public/brand/logo/`
- `apps/web/public/brand/favicon/`
- `docs/brand/logo-preview/` (optional reference board)

## 10. Production Flow

1. Generate 20 to 30 symbol candidates.
2. Downselect top 5 using Section 7 checklist.
3. Build full lockup family for top 2.
4. Run dark/light and 24px tests.
5. Export final pack with naming convention in Section 8.
6. Integrate into app header, auth, and social assets.

