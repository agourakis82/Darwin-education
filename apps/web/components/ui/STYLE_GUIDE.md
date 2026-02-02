# Darwin Education UI Component Style Guide

## Color Palette

### Primary Colors
- **Dark Background**: `bg-slate-900` (#0f172a)
- **Darker Border**: `border-slate-800` (#1e293b)
- **Light Border**: `border-slate-700` (#334155)
- **Accent**: `text-slate-400` (#78716c)

### Text Colors
- **Primary Text**: `text-white` (#ffffff)
- **Secondary Text**: `text-slate-300` (#cbd5e1)
- **Tertiary Text**: `text-slate-400` (#94a3b8)
- **Muted Text**: `text-slate-500` (#64748b)

### Accent Colors
- **Primary (Emerald)**: `bg-emerald-600` / `text-emerald-400`
- **Error (Red)**: `bg-red-600` / `text-red-400`
- **Warning (Amber)**: `bg-amber-600` / `text-amber-400`
- **Info (Blue)**: `bg-blue-600` / `text-blue-400`
- **Success (Emerald)**: `bg-emerald-900` / `text-emerald-100` (for toast background)

## Component Styling Standards

### Buttons
```tsx
// Base styles
className={`
  inline-flex items-center justify-center gap-2
  font-medium rounded-lg border transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
`}

// Variants
primary:    'bg-emerald-600 hover:bg-emerald-500 text-white'
secondary:  'bg-slate-700 hover:bg-slate-600 text-white'
outline:    'bg-transparent hover:bg-slate-800 text-emerald-400 border-emerald-600'
ghost:      'bg-transparent hover:bg-slate-800 text-slate-300'
danger:     'bg-red-600 hover:bg-red-500 text-white'

// Sizes
sm: 'px-3 py-1.5 text-sm'
md: 'px-4 py-2 text-base'
lg: 'px-6 py-3 text-lg'
```

### Cards
```tsx
className={`
  bg-slate-900 border border-slate-800 rounded-xl
  ${padding}
  ${hover ? 'hover:border-slate-700 hover:bg-slate-800/50 transition-colors' : ''}
`}
```

### Inputs
```tsx
className={`
  w-full px-4 py-3 bg-slate-800 border rounded-lg text-white
  placeholder-slate-500 transition-colors
  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
  ${error ? 'border-red-500' : 'border-slate-700'}
`}
```

### Modals
```tsx
// Overlay
className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"

// Modal
className={`
  w-full ${sizeStyles[size]} bg-slate-900 border border-slate-800
  rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200
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
className="bg-slate-800 rounded-lg animate-pulse"

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
- **Base**: Inter (from Google Fonts)
- **All text**: Single family for consistency

### Font Sizes
```
text-xs:  12px (0.75rem)
text-sm:  14px (0.875rem)
text-base: 16px (1rem)
text-lg:  18px (1.125rem)
text-xl:  20px (1.25rem)
```

### Font Weights
```
font-medium:    500
font-semibold:  600
font-bold:      700
```

### Text Hierarchy

**Headings**
- Page title: `text-3xl font-bold text-white`
- Section title: `text-xl font-semibold text-white`
- Card title: `text-lg font-semibold text-white`
- Label: `text-sm font-medium text-slate-300`

**Body Text**
- Default: `text-base text-slate-300`
- Secondary: `text-sm text-slate-400`
- Muted: `text-xs text-slate-500`

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

- All components default to dark mode
- Background: `bg-slate-900` (darkest)
- Light text: `text-white` or `text-slate-300`
- Borders: Use darker shades for contrast
- Accent: Emerald is bright enough for dark backgrounds
- No light mode variants currently (future enhancement)

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
