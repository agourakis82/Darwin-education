# Global UX Components

This directory contains reusable UI components that follow the Darwin Education design system with a dark theme, emerald accents, and full accessibility support.

## Components Overview

### 1. Toast Notifications (`Toast.tsx`, `useToast.ts`)

Toast notifications provide feedback to users about actions, errors, and information. They auto-dismiss and stack vertically.

#### Features
- **4 Variants**: success, error, warning, info
- **Auto-dismiss**: Configurable duration (default 3000ms)
- **Stackable**: Multiple toasts appear together (max 5)
- **Accessible**: ARIA labels, keyboard dismissible
- **Customizable**: Icon, colors, and duration per variant

#### Usage

```tsx
'use client'

import { useToast } from '@/lib/hooks/useToast'

export function MyComponent() {
  const { success, error, warning, info, toast } = useToast()

  return (
    <>
      <button onClick={() => success('Saved!')}>Save</button>
      <button onClick={() => error('Failed to save')}>Error</button>
      <button onClick={() => warning('This action is permanent')}>Warning</button>
      <button onClick={() => info('FYI: Something happened')}>Info</button>

      {/* Custom duration */}
      <button
        onClick={() => success('This will stay for 5 seconds', 5000)}
      >
        Long Toast
      </button>

      {/* Generic toast with options */}
      <button
        onClick={() => toast('Custom message', {
          variant: 'info',
          duration: 2000
        })}
      >
        Custom
      </button>
    </>
  )
}
```

#### Variants & Styling

| Variant | Color | Icon | Default Duration |
|---------|-------|------|------------------|
| success | emerald | ✓ | 3000ms |
| error | red | ✕ | 4000ms |
| warning | amber | ⚠ | 3500ms |
| info | blue | ℹ | 3000ms |

#### Hook API

```typescript
interface UseToastReturn {
  toast: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}
```

#### Setup

The `ToastProvider` is already configured in `/app/layout.tsx`. It wraps the entire application, making `useToast` available anywhere.

---

### 2. Skeleton Loaders (`Skeleton.tsx`)

Skeleton components display placeholder content while data is loading. They use a pulse animation to indicate loading state.

#### Components

##### `Skeleton`
Basic skeleton box with pulse animation.

```tsx
<Skeleton className="h-4 w-full rounded" />
```

##### `SkeletonText`
Multiple skeleton lines simulating text.

```tsx
<SkeletonText lines={3} />
```

##### `SkeletonAvatar`
Circular skeleton for avatars/profile pictures.

```tsx
<SkeletonAvatar size="md" /> {/* sm, md, lg */}
```

##### `SkeletonCard`
Complete card skeleton with optional avatar.

```tsx
<SkeletonCard lines={3} showAvatar />
```

##### `SkeletonList`
Multiple card skeletons stacked (for lists).

```tsx
<SkeletonList items={5} showAvatar={false} />
```

##### `SkeletonTable`
Grid skeleton simulating a table layout.

```tsx
<SkeletonTable rows={5} columns={4} />
```

##### `SkeletonGrid`
Responsive grid skeleton (auto-columns).

```tsx
<SkeletonGrid items={9} columns={3} />
```

#### Usage Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'

export function DataList() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setData([...])
      setLoading(false)
    }, 2000)
  }, [])

  return loading ? (
    <SkeletonList items={3} />
  ) : (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

#### Accessibility

- All skeletons have `aria-hidden="true"` to prevent screen readers from announcing them
- Use semantic HTML for actual content after loading

---

### 3. Empty States (`EmptyState.tsx`)

Empty state components display friendly messages when there's no content to show.

#### Components

##### `EmptyState`
Generic empty state with customizable icon, title, description, and action.

```tsx
<EmptyState
  icon="🎓"
  title="No courses available"
  description="Check back later for new courses"
  action={{
    label: 'Browse All',
    onClick: () => navigate('/courses'),
    variant: 'primary'
  }}
/>
```

##### `EmptySearchResults`
Preset for search results with search icon.

```tsx
<EmptySearchResults
  title="No results found"
  description="Try adjusting your search criteria"
  action={{ label: 'Clear Filters', onClick: handleClear }}
/>
```

##### `EmptyList`
Preset for empty lists with list icon.

```tsx
<EmptyList
  title="No items yet"
  action={{ label: 'Create New', onClick: handleCreate }}
/>
```

##### `NoPermissions`
Preset for access denied with lock icon.

```tsx
<NoPermissions
  title="Access Denied"
  description="You don't have permission to view this content"
/>
```

##### `NoData`
Preset for no data available.

```tsx
<NoData
  title="No data available"
  description="Start using the app to generate data"
/>
```

##### `ServerError`
Preset for server errors.

```tsx
<ServerError
  title="Something went wrong"
  action={{ label: 'Retry', onClick: handleRetry }}
/>
```

#### Props

```typescript
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
}
```

#### Usage Example

```tsx
import { EmptyList } from '@/components/ui/EmptyState'

export function Questions() {
  const [questions, setQuestions] = useState([])

  return questions.length === 0 ? (
    <EmptyList
      title="No questions created"
      description="Start creating questions to build your question bank"
      action={{
        label: 'Create Question',
        onClick: () => setShowForm(true)
      }}
    />
  ) : (
    <QuestionList items={questions} />
  )
}
```

---

## Design System

### Colors

- **Background**: slate-900 (dark gray)
- **Borders**: slate-800 (darker gray)
- **Text**: white, slate-300, slate-400
- **Primary Accent**: emerald-600 / emerald-400
- **Error**: red-600 / red-400
- **Warning**: amber-600 / amber-400
- **Info**: blue-600 / blue-400

### Animations

- **Toast**: slide-in-from-right-5, fade-in (200ms)
- **Skeleton**: animate-pulse
- **Modal**: animate-in, fade-in, zoom-in-95 (200ms)
- **Transitions**: transition-colors, transition-all

### Typography

- **Font**: Inter (from Google Fonts)
- **Sizing**: sm (text-sm), md (text-base), lg (text-lg), xl (text-xl)
- **Weights**: font-medium (500), font-semibold (600), font-bold (700)

### Spacing

- **Padding**: p-3, p-4, p-6, p-8
- **Margins**: standard Tailwind increments
- **Gaps**: gap-2, gap-3, gap-4

---

## Accessibility Standards

All components follow WCAG 2.1 AA guidelines:

- **Color Contrast**: Text meets 4.5:1 ratio for normal text
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper labels for screen readers
- **Focus Indicators**: Visible focus states on interactive elements
- **Semantic HTML**: Proper heading hierarchy and element types

### Screen Reader Support

- Toast notifications use `role="status"` and `aria-live="polite"`
- Skeleton loaders use `aria-hidden="true"`
- Close buttons have meaningful `aria-label`
- Empty states use semantic heading hierarchy

---

## Examples

See `ExampleUsage.tsx` for live examples of all components in action.

---

## Integration with Other Components

These components work seamlessly with existing Darwin Education components:

```tsx
import { Card, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useToast } from '@/lib/hooks/useToast'

export function FeatureCard() {
  const { success } = useToast()
  const [loading, setLoading] = useState(true)

  const handleAction = () => {
    success('Action completed!')
  }

  return loading ? (
    <SkeletonCard />
  ) : (
    <Card>
      <CardTitle>Title</CardTitle>
      <CardContent>
        <Button onClick={handleAction}>Action</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Performance Notes

- **Skeleton Animation**: Uses CSS animation (no JavaScript)
- **Toast Stacking**: Automatically limits to 5 toasts
- **Portal Rendering**: Toast and Modal use portals to avoid layout thrashing
- **Memoization**: Components are optimized for re-renders

---

## Future Enhancements

- Toast sound notifications
- Persistent toast queue
- Empty state animations
- Customizable skeleton shimmer colors
- Dark/light mode toggle (currently dark-only)
