# Theming Guide — DevSanctum

This document defines the DevSanctum color palette, its mapping to Primer React design tokens, and the rules for applying colors consistently across the UI.

---

## 1. Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Header** | Deep Teal | `#09637E` | App header background, emphasis accents, dark hover states |
| **Primary** | Teal | `#088395` | Buttons (primary), links, active nav items, focus rings |
| **Secondary** | Soft Teal | `#7AB2B2` | Labels, badges, secondary highlights, dividers |
| **Background** | Ice Blue | `#EBF4F6` | Page canvas, card backgrounds |

### Visual preview

```
 ┌────────────────────────────────────────┐
 │  Header  #09637E                       │  ← app header bar
 ├────────────────────────────────────────┤
 │  Background #EBF4F6                    │  ← page canvas
 │                                        │
 │  ┌───────────────────────────────────┐ │
 │  │  Card / inset  #ddeef2            │ │  ← subtle canvas
 │  │                                   │ │
 │  │  [  Primary button  #088395  ]    │ │  ← accent.emphasis
 │  │  Link text  #088395               │ │  ← accent.fg
 │  │  Badge  #7AB2B2                   │ │  ← secondary / custom label
 │  └───────────────────────────────────┘ │
 └────────────────────────────────────────┘
```

---

## 2. Token Mapping

The custom theme overrides the following Primer design tokens. These are the only tokens that differ from the Primer default light theme.

| Primer token | Value | Rationale |
|---|---|---|
| `canvas.default` | `#EBF4F6` | Page background |
| `canvas.subtle` | `#ddeef2` | Cards, sidebar pane, inset areas |
| `canvas.inset` | `#ddeef2` | Code blocks, nested panels |
| `canvas.overlay` | `#ffffff` | Dialogs, dropdowns (kept white for contrast) |
| `accent.fg` | `#088395` | Links, active states, focus indicators |
| `accent.emphasis` | `#09637E` | Primary button background, strong highlights |
| `accent.muted` | `rgba(8,131,149,0.15)` | Hover backgrounds, subtle tints |
| `accent.subtle` | `#EBF4F6` | Light accent fills |
| `header.bg` | `#09637E` | Header bar background |
| `header.text` | `#ffffff` | Header text |
| `header.logo` | `#ffffff` | Header logo/icon |

> All other tokens (danger, success, attention, neutral, fg, border…) inherit Primer's defaults and must **not** be overridden unless there is a contrast or brand requirement.

---

## 3. Custom Theme File

The theme is defined in `frontend/src/theme.ts` and passed to `ThemeProvider` in `main.tsx`:

```tsx
// main.tsx
import { ThemeProvider, BaseStyles } from '@primer/react';
import customTheme from './theme';

<ThemeProvider theme={customTheme} colorMode="light">
  <BaseStyles>
    <App />
  </BaseStyles>
</ThemeProvider>
```

The theme file uses `deepmerge` (bundled with Primer) to extend the default theme without losing any existing tokens:

```ts
import { theme } from '@primer/react';
import deepmerge from 'deepmerge';

export const customTheme = deepmerge(theme, {
  colorSchemes: {
    light: {
      colors: {
        canvas: { default: '#EBF4F6', subtle: '#ddeef2', ... },
        accent: { fg: '#088395', emphasis: '#09637E', ... },
        header: { bg: '#09637E', text: '#ffffff', ... },
      },
    },
  },
} as typeof theme);
```

---

## 4. Usage Rules

### Use tokens, never raw hex values in components

```tsx
// ✅ Correct
<Box sx={{ bg: 'canvas.default', borderColor: 'border.default' }}>

// ❌ Wrong
<Box sx={{ bg: '#EBF4F6', borderColor: '#ccc' }}>
```

The only place raw hex values appear is in `theme.ts`.

### Primary actions

Use `variant="primary"` on `Button`. It automatically picks up `accent.emphasis` (`#09637E`).

```tsx
<Button variant="primary">Deploy</Button>
```

### Links and active states

Primer applies `accent.fg` (`#088395`) to links and active `NavList`/`UnderlineNav` items automatically. No override needed.

### Secondary / soft highlights

Use the **Secondary** color (`#7AB2B2`) for `Label` components in neutral status contexts or decorative badges. Apply it via a custom `sx` override since it is not a Primer semantic token:

```tsx
<Label sx={{ bg: '#7AB2B2', color: 'white' }}>Template</Label>
```

For status labels, always prefer semantic Primer variants first:

| Status | Primer variant |
|--------|---------------|
| Running | `variant="success"` |
| Pending / building | `variant="attention"` |
| Failed / error | `variant="danger"` |
| Stopped / inactive | `variant="secondary"` |
| Neutral tag | custom `#7AB2B2` |

### Page background

`canvas.default` is set to `#EBF4F6` globally via the theme. No manual `bg` is needed on `PageLayout` or `Box` wrappers at the root level.

For cards and inset sections, use `canvas.subtle` (`#ddeef2`):

```tsx
<Box sx={{ bg: 'canvas.subtle', p: 4, borderRadius: 2 }}>
```

---

## 5. Dark Mode

Dark mode is not in the current scope. The `ThemeProvider` is pinned to `colorMode="light"`.

When dark mode is added:
- Define a `dark` colorScheme alongside `light` in `theme.ts`.
- Replace `colorMode="light"` with `colorMode="auto"` to follow the OS preference, or expose a toggle that writes to `localStorage` and passes the stored value to `colorMode`.
- Re-check all `#7AB2B2` direct `sx` overrides for contrast — they may need a different value in dark mode.

---

## 6. Accessibility Contrast

Verify that the palette meets WCAG AA (4.5:1 for normal text, 3:1 for large text/UI components).

| Foreground | Background | Ratio | Level |
|---|---|---|---|
| `#ffffff` on `#09637E` | header text | ~7.0:1 | ✅ AAA |
| `#ffffff` on `#088395` | primary button text | ~5.5:1 | ✅ AA |
| `#09637E` on `#EBF4F6` | body link on canvas | ~6.8:1 | ✅ AAA |
| `#7AB2B2` on `#EBF4F6` | secondary badge text | ~2.4:1 | ⚠️ use white text on `#7AB2B2` background instead |
| `#ffffff` on `#7AB2B2` | white on secondary | ~3.1:1 | ✅ AA (large text / UI) |

> **Rule:** never place `#7AB2B2` text on a light background. Use it only as a background with white text, or as an icon/decorative element.
