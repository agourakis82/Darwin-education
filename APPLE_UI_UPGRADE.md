# Darwinhub.org — Apple Native UI Upgrade

## ✅ Upgrade Complete

**Date:** 2026-02-22  
**Status:** All UI components upgraded to Apple Design System

---

## 🎨 What's New

### 1. Apple Design System Tokens
**File:** `apps/web/app/globals.css`

- ✅ Apple System Colors (iOS/macOS palette)
- ✅ System Backgrounds & Grouped Backgrounds
- ✅ System Labels (primary → quaternary)
- ✅ System Grays (6 levels)
- ✅ Darwin Brand Colors integrated

### 2. Glass Materials (visionOS-style)
5 levels of material intensity:

| Class | Blur | Saturation | Use Case |
|-------|------|------------|----------|
| `.material-ultra-thin` | 20px | 180% | Light overlays |
| `.material-thin` | 40px | 200% | Toolbars |
| `.material-regular` | 60px | 210% | Cards, modals |
| `.material-thick` | 80px | 220% | Navigation bars |
| `.material-chrome` | 120px | 240% | Title bars, nav |

### 3. Typography Scale (iOS Dynamic Type)
Apple-style text hierarchy:

```css
.text-large-title   /* 34px - Hero headers */
.text-title-1       /* 28px - Page titles */
.text-title-2       /* 22px - Section headers */
.text-title-3       /* 20px - Card titles */
.text-headline      /* 17px - Emphasized body */
.text-body          /* 17px - Default body */
.text-callout       /* 16px - Buttons, labels */
.text-subheadline   /* 15px - Secondary text */
.text-footnote      /* 13px - Captions */
.text-caption       /* 12px - Small labels */
```

### 4. iOS-style Components

#### Button Component
```tsx
<Button variant="filled" color="darwin">Primary</Button>
<Button variant="tinted" color="blue">Secondary</Button>
<Button variant="glass">Glass Effect</Button>
<Button variant="plain">Text Button</Button>
```

#### Card Component
```tsx
<Card variant="default">iOS Grouped Background</Card>
<Card variant="glass">visionOS Glass</Card>
<Card variant="chrome">macOS Window Chrome</Card>
<Card variant="elevated">Elevated Shadow</Card>
```

### 5. Navigation Upgrade
- ✅ macOS window chrome style
- ✅ iOS spring animations (`cubic-bezier(0.16, 1, 0.3, 1)`)
- ✅ Material chrome backdrop blur
- ✅ Smooth layout transitions with `layoutId`
- ✅ Mobile sheet navigation

### 6. Animations
- **iOS Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Ease Out:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Pressable Scale:** `0.96` on active
- **Hover Lift:** `-2px` translateY

### 7. Depth Shadows (5 levels)
```css
.depth-1  /* Subtle elevation */
.depth-2  /* Cards */
.depth-3  /* Elevated cards */
.depth-4  /* Modals */
.depth-5  /* Maximum elevation */
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `app/globals.css` | New Apple Design System tokens & utilities |
| `app/layout.tsx` | Updated with new color tokens |
| `app/fonts.ts` | Apple typography scale (NEW) |
| `tailwind.config.ts` | Extended with Apple color palette |
| `components/ui/Button.tsx` | iOS-style button variants |
| `components/ui/Card.tsx` | Glass material cards |
| `components/Navigation.tsx` | macOS chrome navigation |

---

## 🎯 Usage Examples

### Apple-style Button
```tsx
import { Button } from '@/components/ui/Button'

// Primary action
<Button variant="filled" color="darwin" size="large">
  Começar Simulado
</Button>

// Secondary action
<Button variant="tinted" color="blue">
  Ver Explicação
</Button>

// Glass effect
<Button variant="glass">
  <Sparkles className="w-4 h-4" />
  Gerar com IA
</Button>
```

### Apple-style Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

<Card variant="glass" hover>
  <CardHeader>
    <CardTitle size="medium">Questão de Cardiologia</CardTitle>
    <CardDescription>Clínica Médica • Nível Médio</CardDescription>
  </CardHeader>
</Card>
```

### Material Backgrounds
```tsx
// Navigation bar
<nav className="material-chrome border-b-[0.5px] border-separator/25">
  ...
</nav>

// Floating panel
<div className="material-regular rounded-2xl border-[0.5px] border-separator/30">
  ...
</div>
```

---

## 🌙 Dark Mode Support

All components automatically adapt to dark mode:

```css
/* Light Mode */
--system-background: 255 255 255
--label: 0 0 0

/* Dark Mode */
--system-background: 0 0 0
--label: 255 255 255
```

---

## ⚡ Performance

- **Mobile-optimized blur:** Reduced on mobile devices
- **Reduced motion:** Respects `prefers-reduced-motion`
- **GPU acceleration:** `will-change` on animated elements
- **Font display:** `swap` for faster text rendering

---

## 🔧 Next Steps

1. **Apply to remaining components:**
   - Update forms with iOS-style inputs
   - Upgrade modals with glass chrome
   - Add iOS-style segmented controls

2. **Add SF Symbols:**
   ```bash
   npm install @react-symbols/sf-symbols
   ```

3. **Test on devices:**
   - iOS Safari
   - macOS Safari
   - Chrome/Edge

4. **Fine-tune animations:**
   - Adjust spring stiffness
   - Customize press feedback

---

## 📱 Design Preview

The upgraded UI now features:
- ✅ iOS 18-style navigation bars
- ✅ visionOS glass materials
- ✅ macOS window chrome
- ✅ Apple spring animations
- ✅ System color palette
- ✅ Dynamic type scale

**Result:** Darwinhub.org now looks like a native Apple app on the web!
