# Darwin Education UI Component Style Guide

## Color System (V6)

Darwin uses a semantic, theme-driven token palette. Prefer these tokens over hard-coded utilities like `bg-slate-*` and `text-white`.

### Semantic surfaces (theme-driven)
- **Backgrounds**: `bg-surface-0` → `bg-surface-5`
- **Borders**: `border-separator` (and `border-separator/…` for opacity)

### Semantic text labels (theme-driven)
- **Primary**: `text-label-primary`
- **Secondary**: `text-label-secondary`
- **Tertiary**: `text-label-tertiary`
- **Quaternary**: `text-label-quaternary`
- **Faint**: `text-label-faint`

### Accent scales
- **Primary (emerald)**: `bg-primary-600`, `text-primary-400`, etc.
- **Accent (purple)**: `bg-accent-600`, `text-accent-400`, etc.

### “Apple glass” utilities
- Panels: `darwin-panel`, `darwin-panel-strong`
- Materials: `material-thin`, `material-regular`, `material-thick`
- Focus: `darwin-focus-ring`

## Component Styling Standards

### Buttons
```tsx
// Base styles
className={`
  darwin-focus-ring inline-flex items-center justify-center gap-2
  font-medium transition-all active:scale-[0.98]
  disabled:cursor-not-allowed disabled:opacity-50
`}

// Variants
primary:    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500'
secondary:  'darwin-panel border border-separator/80 text-label-primary hover:bg-surface-2/85'
outline:    'border border-emerald-400/45 bg-transparent text-emerald-300 hover:bg-emerald-500/10'
ghost:      'bg-transparent text-label-secondary hover:bg-surface-3/70 hover:text-label-primary'
danger:     'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-elevation-2 shadow-inner-shine hover:from-rose-400 hover:to-rose-500'

// Sizes
sm: 'px-3 py-2 text-sm rounded-lg'
md: 'px-4 py-2.5 text-base rounded-xl'
lg: 'px-6 py-3.5 text-lg rounded-xl'
```

### Cards
```tsx
className={`
  bg-surface-2 border border-separator rounded-xl shadow-elevation-1
  ${padding}
  ${hover ? 'hover:bg-surface-3/80 hover:shadow-elevation-2 transition-colors' : ''}
`}
```

### Inputs
```tsx
className={`
  w-full px-4 py-3 bg-surface-2 border border-separator rounded-lg text-label-primary
  placeholder:text-label-quaternary transition-colors
  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
  ${error ? 'border-red-500' : 'border-separator'}
`}
```

### Modals
```tsx
// Overlay
className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"

// Modal
className={`
  w-full ${sizeStyles[size]} bg-surface-1 border border-separator/80
  rounded-2xl shadow-elevation-5 animate-in fade-in zoom-in-95 duration-200
`}
```

### Toasts
```tsx
// Container
className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"

// Individual Toast
className={`
  ${bg} ${border} ${text}
  pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border
  shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200
`}

// Variants
success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
error:   'bg-red-900/90 border-red-700 text-red-100'
warning: 'bg-amber-900/90 border-amber-700 text-amber-100'
info:    'bg-blue-900/90 border-blue-700 text-blue-100'
```

### Skeletons
```tsx
// Base
className="bg-surface-3/75 rounded-lg animate-pulse"

// Usage examples
h-4 w-full            // Text line
w-12 h-12 rounded-full // Avatar
```

### Empty States
```tsx
className={`
  flex flex-col items-center justify-center py-12 px-4
  ${className}
`}
```

## Spacing Scale

Used consistently across all components:

```
xs:  2px  (0.125rem)
sm:  4px  (0.25rem)
1:   4px  (0.25rem)
2:   8px  (0.5rem)
3:   12px (0.75rem)
4:   16px (1rem)
6:   24px (1.5rem)
8:   32px (2rem)
```

### Common Patterns
- **Card padding**: `p-4`, `p-6`, `p-8`
- **Gap between items**: `gap-2`, `gap-3`, `gap-4`
- **Section margins**: `mb-4`, `mt-4`, `py-4`
- **Content spacing**: `space-y-3`, `space-y-4`

## Typography

### Font Family
- **Base**: SF Pro scale (with system fallbacks)
- **All text**: Keep typography semantic and consistent

### Font Sizes
```
text-xs:  11px
text-sm:  13px
text-base: 15px
text-lg:  17px
text-xl:  20px
```

### Font Weights
```
font-medium:    500
font-semibold:  600
font-bold:      700
```

### Text Hierarchy

**Headings**
- Page title: `text-3xl font-bold text-label-primary`
- Section title: `text-xl font-semibold text-label-primary`
- Card title: `text-lg font-semibold text-label-primary`
- Label: `text-sm font-medium text-label-secondary`

**Body Text**
- Default: `text-base text-label-secondary`
- Secondary: `text-sm text-label-tertiary`
- Muted: `text-xs text-label-quaternary`

## Animations

### Transitions
- **Default**: `transition-colors`
- **All properties**: `transition-all`
- **Duration**: `duration-200` (200ms standard)

### Animations
- **Pulse**: `animate-pulse` (for skeletons)
- **Spin**: `animate-spin` (for loading spinners)
- **Toast slide**: `animate-in slide-in-from-right-5 fade-in duration-200`
- **Modal pop**: `animate-in fade-in zoom-in-95 duration-200`

### Focus States
- **Focus ring**: `focus:ring-2 focus:ring-emerald-500`
- **Focus border**: `focus:border-transparent` (when using ring)

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Usage Patterns
```tsx
// Common grid patterns
'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
'flex flex-col md:flex-row'
'w-full md:w-1/2'
```

## Accessibility Standards

### Color Contrast
- Text on background: ≥ 4.5:1 ratio
- Large text: ≥ 3:1 ratio
- Interactive elements: Sufficient focus indicators

### Focus Management
- Tab order: Logical and intuitive
- Focus visible: Always visible
- Focus trap: Modal only (optional)

### ARIA Labels
```tsx
// Close button
aria-label="Fechar"

// Loading state
aria-busy="true"

// Toast notifications
role="status"
aria-live="polite"
aria-atomic="true"

// Skeleton
aria-hidden="true"

// Error messages
aria-describedby="error-message"
```

### Semantic HTML
- `<button>` for buttons
- `<input>` with labels
- `<form>` for forms
- Proper heading hierarchy (`h1` → `h6`)
- `<section>`, `<article>` for content grouping

## Common Component Patterns

### Loading State Pattern
```tsx
{isLoading ? (
  <SkeletonCard lines={3} />
) : (
  <ActualCard />
)}
```

### Empty State Pattern
```tsx
{items.length === 0 ? (
  <EmptyList title="No items" />
) : (
  <ItemList items={items} />
)}
```

### Toast Pattern
```tsx
const { success, error } = useToast()

try {
  await action()
  success('Action completed!')
} catch (err) {
  error('Action failed')
}
```

### Form Pattern
```tsx
const { error: showError } = useToast()

<Input
  label="Name"
  error={errors.name}
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>

<Button
  onClick={handleSubmit}
  loading={isSubmitting}
>
  Submit
</Button>
```

## Dark Mode Notes

- Theme is controlled by `ThemeProvider` (adds `.light`/`.dark` on `html`).
- Prefer semantic tokens (`surface-*`, `label-*`, `separator`) so components render correctly in both themes.
- Avoid “theme-specific” hard-coding (e.g. `bg-slate-900`, `text-white`) unless intentionally used as a *non-semantic* accent (like CTA gradients).

## Component Composition Example

```tsx
<Card className="max-w-md">
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardDescription>Manage your preferences</CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  </CardContent>

  <CardFooter>
    <Button variant="primary" onClick={handleSave}>
      Save Changes
    </Button>
  </CardFooter>
</Card>
```

## Maintenance & Evolution

### Adding New Variants
1. Add variant to `variantStyles` object
2. Update TypeScript type
3. Add documentation
4. Include in examples

### Updating Colors
- Update `TAILWIND_CONFIG` color palette
- Update this guide
- Test contrast with a11y checker
- Update all component references

### Performance Considerations
- Use CSS animations (not JS)
- Leverage Tailwind's optimization
- Minimize re-renders with proper memoization
- Use portal rendering for overlays

---

This style guide ensures visual and functional consistency across the Darwin Education platform.
