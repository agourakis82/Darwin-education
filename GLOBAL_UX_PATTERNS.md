# Global UX Patterns - Implementation Guide

This document provides a quick reference for using the new global UX components in the Darwin Education app.

## Quick Start

### 1. Toast Notifications

Toast notifications provide non-blocking feedback to users.

```tsx
'use client'

import { useToast } from '@/lib/hooks/useToast'

export function MyComponent() {
  const { success, error, warning, info } = useToast()

  return (
    <button onClick={() => success('Operation successful!')}>
      Click Me
    </button>
  )
}
```

**Available Methods:**
- `success(message, duration?)` - Green notification with checkmark
- `error(message, duration?)` - Red notification with X icon
- `warning(message, duration?)` - Yellow notification with warning icon
- `info(message, duration?)` - Blue notification with info icon
- `toast(message, options?)` - Custom configuration

**Default Durations:**
- Success: 3000ms
- Error: 4000ms
- Warning: 3500ms
- Info: 3000ms

---

### 2. Skeleton Loaders

Skeletons display placeholder content while data is loading.

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SkeletonCard } from '@/components/ui/Skeleton'

export function DataList() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData().then(d => {
      setData(d)
      setIsLoading(false)
    })
  }, [])

  return isLoading ? (
    <SkeletonCard lines={3} />
  ) : (
    <div>{data.name}</div>
  )
}
```

**Available Components:**

| Component | Usage | Props |
|-----------|-------|-------|
| `Skeleton` | Basic box | `className` |
| `SkeletonText` | Multiple lines | `lines`, `className` |
| `SkeletonAvatar` | Profile picture | `size` (sm/md/lg) |
| `SkeletonCard` | Card layout | `lines`, `showAvatar` |
| `SkeletonList` | Stacked cards | `items`, `showAvatar` |
| `SkeletonTable` | Table layout | `rows`, `columns` |
| `SkeletonGrid` | Grid layout | `items`, `columns` |

---

### 3. Empty States

Empty states display friendly messages when there's no content.

```tsx
import { EmptyList } from '@/components/ui/EmptyState'

export function Questions() {
  const questions = []

  return questions.length === 0 ? (
    <EmptyList
      title="No questions yet"
      description="Create your first question to get started"
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

**Available Presets:**

| Component | Use Case | Icon |
|-----------|----------|------|
| `EmptyState` | Custom state | Custom |
| `EmptyList` | No items | 📋 |
| `EmptySearchResults` | No search results | 🔍 |
| `NoPermissions` | Access denied | 🔒 |
| `NoData` | No analytics | 📊 |
| `ServerError` | Error occurred | ⚠️ |

---

## Complete Integration Example

Here's how to use all three patterns together:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/lib/hooks/useToast'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyList } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardContent } from '@/components/ui/Card'

export function QuestionBank() {
  const { success, error } = useToast()
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuestions()
      .then(data => {
        setQuestions(data)
        setIsLoading(false)
      })
      .catch(err => {
        error('Failed to load questions')
        setIsLoading(false)
      })
  }, [error])

  const handleDelete = async (id) => {
    try {
      await deleteQuestion(id)
      setQuestions(prev => prev.filter(q => q.id !== id))
      success('Question deleted successfully')
    } catch (err) {
      error('Failed to delete question')
    }
  }

  return (
    <Card>
      <CardTitle>My Questions</CardTitle>
      <CardContent className="mt-6">
        {isLoading ? (
          <SkeletonList items={3} />
        ) : questions.length === 0 ? (
          <EmptyList
            title="No questions created"
            action={{
              label: 'Create First Question',
              onClick: () => window.location.href = '/create-question'
            }}
          />
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="flex justify-between items-center p-4 bg-slate-800 rounded">
                <span>{q.title}</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(q.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Design Consistency

All components follow the Darwin Education design system:

**Dark Theme:**
- Primary background: `bg-slate-900`
- Borders: `border-slate-800`
- Text: `text-white`, `text-slate-300`, `text-slate-400`

**Accents:**
- Primary (emerald): `bg-emerald-600`, `text-emerald-400`
- Error (red): `bg-red-600`, `text-red-400`
- Warning (amber): `bg-amber-600`, `text-amber-400`
- Info (blue): `bg-blue-600`, `text-blue-400`

**Animations:**
- Smooth transitions: `transition-colors`, `transition-all`
- Loading pulse: `animate-pulse`
- Toast slide-in: `slide-in-from-right-5 fade-in`

---

## Accessibility Features

All components are WCAG 2.1 AA compliant:

✓ **Color Contrast** - 4.5:1 ratio minimum
✓ **Keyboard Navigation** - All interactive elements accessible via keyboard
✓ **ARIA Labels** - Proper semantic markup for screen readers
✓ **Focus Indicators** - Visible focus states
✓ **Semantic HTML** - Correct heading hierarchy and element types

### Toast Accessibility
- Uses `role="status"` for live region announcements
- `aria-live="polite"` for non-intrusive updates
- Dismissible with Escape key or close button

### Skeleton Accessibility
- `aria-hidden="true"` prevents screen reader announcement

### Empty State Accessibility
- Semantic heading hierarchy
- Action buttons properly labeled
- Clear visual hierarchy

---

## Setup (Already Done)

The `ToastProvider` is already configured in `/app/layout.tsx`:

```tsx
import { ToastProvider } from '@/components/ui/Toast'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {/* Your app content */}
        </ToastProvider>
      </body>
    </html>
  )
}
```

This makes `useToast()` available throughout the entire app.

---

## File Structure

```
apps/web/
├── components/ui/
│   ├── Toast.tsx           # Toast provider & container
│   ├── Skeleton.tsx        # All skeleton components
│   ├── EmptyState.tsx      # Empty state presets
│   ├── ExampleUsage.tsx    # Live examples
│   └── README.md           # Detailed component docs
├── lib/hooks/
│   └── useToast.ts         # useToast hook
└── app/
    └── layout.tsx          # ToastProvider wrapper
```

---

## Best Practices

### Toast Usage
```tsx
// ✓ Good: Specific, actionable messages
success('Profile updated successfully')
error('Failed to save changes. Please try again.')

// ✗ Avoid: Vague messages
success('Done')
error('Error')
```

### Skeleton Usage
```tsx
// ✓ Good: Match actual content structure
isLoading ? <SkeletonCard lines={3} /> : <ActualCard />

// ✗ Avoid: Generic loading spinners
isLoading ? <Spinner /> : <ActualCard />
```

### Empty State Usage
```tsx
// ✓ Good: Provide context and action
<EmptyList
  title="No questions yet"
  description="Start building your question bank"
  action={{ label: 'Create Question', onClick: ... }}
/>

// ✗ Avoid: Just showing "No results"
<div>No data</div>
```

---

## Customization

### Custom Toast Variant
```tsx
const { toast } = useToast()

toast('Custom message', {
  variant: 'success',
  duration: 5000  // milliseconds
})
```

### Custom Icon
```tsx
<EmptyState
  icon="🚀"  // String emoji or React component
  title="Ready to launch"
/>
```

### Custom Styling
All components accept a `className` prop for additional Tailwind classes:

```tsx
<SkeletonCard className="max-w-lg" />
<EmptyList className="py-20" />
```

---

## Troubleshooting

### Toast not appearing?
- Make sure `useToast()` is in a client component (`'use client'`)
- Verify `ToastProvider` wraps your app in `layout.tsx`

### Skeleton not animating?
- Check that `animate-pulse` is available in Tailwind config
- Ensure component is rendered (not hidden with `display: none`)

### Empty state not showing?
- Verify the condition properly: `items.length === 0`
- Check z-index if being hidden by other elements

---

## More Information

For detailed component documentation, see:
- `/apps/web/components/ui/README.md` - Full API reference
- `/apps/web/components/ui/ExampleUsage.tsx` - Live interactive examples

For design system guidelines, see:
- `/CLAUDE.md` - Architecture & styling patterns
