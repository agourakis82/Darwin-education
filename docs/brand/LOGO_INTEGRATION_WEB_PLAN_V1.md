# Darwin Web Logo Integration Plan v1

Decision-complete implementation plan for integrating the new logo system into web UI and metadata.

## 1. Scope

Integrate final logo assets into:
- Header navigation
- Auth pages (`/login`, `/signup`)
- Favicon and app icons
- Open Graph and social preview metadata

This plan assumes logo assets are already exported according to:
- `docs/BRAND_KIT_LOGO_SPEC_V1.md`

## 2. Required assets (must exist before integration)

Place files in:
- `apps/web/public/brand/logo/`
- `apps/web/public/brand/favicon/`

Required names:
- `darwin-logo-horizontal-full-light.svg`
- `darwin-logo-horizontal-full-dark.svg`
- `darwin-symbol-full-light.svg`
- `darwin-symbol-full-dark.svg`
- `darwin-appicon-master-1024.png`
- `darwin-favicon-32.png`
- `darwin-favicon-16.png`

## 3. Implementation steps

### Step A: Create shared brand component

Add:
- `apps/web/components/brand/BrandLogo.tsx`

Component API:
- `variant`: `horizontal | symbol`
- `theme`: `light | dark | auto`
- `size`: `sm | md | lg`
- `showWordmark`: boolean (default true for horizontal)
- `priority`: boolean (for above-the-fold usage)

Behavior:
- For `auto`, use CSS utility classes to switch light/dark logos.
- Use `next/image` with explicit `width`/`height` for SVG render stability.
- Include accessible labels (`aria-label="Darwin Education"` on link wrapper, empty alt for decorative logo where needed).

### Step B: Replace text logo in top navigation

Update:
- `apps/web/components/Navigation.tsx`

Changes:
- Replace current text-based logo lockup with `BrandLogo`.
- Keep existing link target to `/`.
- Preserve current focus-ring and keyboard accessibility classes.
- Keep mobile menu behavior unchanged.

### Step C: Add logo lockup to auth pages

Update:
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/signup/page.tsx`

Changes:
- Add `BrandLogo` above form titles.
- Keep existing background visuals and spacing.
- Do not reduce form width below current `max-w-md`.

### Step D: Configure global metadata icons

Update:
- `apps/web/app/layout.tsx`

Add metadata fields:
- `metadataBase`
- `icons` (`icon`, `shortcut`, `apple`)
- `openGraph` (`title`, `description`, `siteName`, `images`)
- `twitter` (`card`, `title`, `description`, `images`)

Icon paths:
- `/brand/favicon/darwin-favicon-32.png`
- `/brand/favicon/darwin-favicon-16.png`
- `/brand/logo/darwin-appicon-master-1024.png`

### Step E: Add static OG image asset

Add:
- `apps/web/public/brand/logo/darwin-og-1200x630.png`

Use this file in `layout.tsx` `openGraph.images` and `twitter.images`.

### Step F: Optional dynamic OG route (phase 2)

Optional addition:
- `apps/web/app/opengraph-image.tsx`

Purpose:
- Generate route-aware OG images server-side in Next.js for later campaign automation.

## 4. Acceptance criteria

1. Header logo renders correctly on desktop and mobile.
2. Auth pages show logo without layout shift.
3. Browser tab displays Darwin favicon.
4. Social preview (`openGraph` and `twitter`) uses Darwin branded image.
5. No accessibility regression in nav/auth flows.
6. No build errors in `pnpm --filter @darwin-education/web build`.

## 5. QA checklist

- Light mode visual check
- Dark mode visual check
- Mobile viewport (`360x800`) check
- Desktop viewport (`1440x900`) check
- Favicon visible in Chrome/Safari/Firefox
- Link previews tested with social debuggers (Meta + X)

## 6. Rollout order

1. Merge shared `BrandLogo` component.
2. Integrate in `Navigation`.
3. Integrate in auth pages.
4. Ship favicon + metadata update.
5. Ship OG image update.

## 7. Rollback strategy

If regressions appear:
- Revert `Navigation` and auth usage to text logo.
- Keep metadata icon updates if stable.
- Re-introduce `BrandLogo` behind a feature flag in a second pass.

