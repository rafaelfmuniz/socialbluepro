# Design System

## Direction
Personality: Professional & Trustworthy
Foundation: Cool (slate)
Depth: Borders-only with subtle elevation
Feel: Data-focused, clean, actionable

## Tokens
### Spacing
Base: 4px
Scale: 4, 8, 12, 16, 24, 32, 48, 64

### Colors
#### Primitive Foundation
--foreground: slate-900
--secondary: slate-600
--tertiary: slate-400
--muted: slate-300

--background: white
--surface-100: white (cards, panels)
--surface-200: slate-50 (elevated surfaces)
--surface-300: slate-100 (overlays)

--border-default: rgba(226, 232, 240, 0.8)  # slate-200 with opacity
--border-subtle: rgba(226, 232, 240, 0.4)
--border-strong: rgba(226, 232, 240, 1)

--accent: green-500 (#22c55e)
--accent-dark: green-600 (#16a34a)
--accent-light: green-400 (#4ade80)

--success: green-500
--warning: yellow-500
--error: red-500
--info: blue-500

### Typography
--font-sans: Inter, system-ui, sans-serif
--font-serif: Playfair Display, serif

--text-primary: slate-900
--text-secondary: slate-600
--text-tertiary: slate-400
--text-muted: slate-300

--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
--text-5xl: 3rem

## Breakpoints

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## Patterns
### Button Primary
- Height: 36px
- Padding: 8px 16px
- Radius: 6px
- Background: --accent
- Text: white
- Usage: Primary actions, confirmations

### Button Secondary
- Height: 36px
- Padding: 8px 16px
- Radius: 6px
- Background: transparent
- Border: 1px solid --border-default
- Text: --foreground
- Usage: Secondary actions, cancellations

### Card Default
- Background: --surface-100
- Border: 1px solid --border-subtle
- Radius: 8px
- Padding: 16px
- Usage: Data containers, metric cards

### Input Base
- Height: 40px
- Padding: 8px 12px
- Radius: 6px
- Background: white
- Border: 1px solid --border-default
- Focus: border --accent, ring 2px --accent-light

### Table Row
- Padding: 12px 16px
- Border-bottom: 1px solid --border-subtle
- Hover: --surface-200
- Active: --surface-300

## Principles
- Spacing: Use 4px base multiples consistently
- Borders: Subtle opacity, avoid harsh lines
- Elevation: Use surface-200 for floating elements
- Interaction: Clear hover/focus states
- Data: Prioritize clarity, use monospace for numbers
