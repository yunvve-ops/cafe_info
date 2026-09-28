---
name: Warm Artisanal Precision
colors:
  surface: '#fff8f4'
  surface-dim: '#e4d8cd'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fef1e6'
  surface-container: '#f8ece0'
  surface-container-high: '#f3e6db'
  surface-container-highest: '#ede0d5'
  on-surface: '#201b14'
  on-surface-variant: '#4f4440'
  inverse-surface: '#362f28'
  inverse-on-surface: '#fbefe3'
  outline: '#817470'
  outline-variant: '#d3c3be'
  surface-tint: '#73584e'
  primary: '#070100'
  on-primary: '#ffffff'
  primary-container: '#2b1810'
  on-primary-container: '#9c7e73'
  inverse-primary: '#e2bfb2'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#000301'
  on-tertiary: '#ffffff'
  tertiary-container: '#002214'
  on-tertiary-container: '#009768'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcd'
  primary-fixed-dim: '#e2bfb2'
  on-primary-fixed: '#2a170f'
  on-primary-fixed-variant: '#5a4137'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fff8f4'
  on-background: '#201b14'
  surface-variant: '#ede0d5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  metric-num-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.875rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  metric-num-md:
    fontFamily: JetBrains Mono
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  table-data:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system balances the tactile warmth of specialty coffee hospitality with the crisp operational precision of financial SaaS. It caters to independent cafe owners, multi-branch store managers, and operational baristas who juggle fast-paced counter closing duties, inventory reconciliation, and profit-margin calculations late into the evening.

The design movement mixes **warm modernism** and **utilitarian dashboard architecture**:
- **Tone:** Grounded, trustworthy, reassuring, and meticulous.
- **Visual Feel:** Creamy, comforting paper-like canvas tones accented by deep roasted espresso structures and refined amber highlights, preventing late-night screen fatigue while maintaining high-density tabular legibility.
- **Data Reality Disclaimer:** Every operational KPI view, simulated margin analysis, and inventory valuation table explicitly carries understated editorial micro-labels denoting illustrative sample state when production POS feeds are unlinked.

## Colors
The palette evokes roasted coffee beans, steamed oat foam, raw cane sugar, and clean culinary ceramics, grounded by functional semantic feedback.

### Color Mapping & Roles
- **Base Canvas (`#FBF9F5`):** Warm milk-cream ground layer that softens backlight intensity.
- **Sub-Surface Canvas (`#F4EFEB`):** Used for sidebar rails, inset table footers, and secondary section wells.
- **Surface Elevation (`#FFFFFF`):** Crisp neutral white cards for metric blocks, active input sheets, and data grid rows.
- **Primary Espresso (`#2B1810` / `#3A2418`):** Deep roasted walnut-brown for primary headers, active tab pill indicators, key CTAs, and structural borders. Provides higher perceived warmth than cold ink-black (`#000000`).
- **Secondary Amber / Caramel (`#D97706` / `#B45309`):** Accent tone dedicated to pending closing status, batch alerts, active filters, and interactive focus borders.
- **Semantic Green / Sage (`#10B981` / `#059669`):** Indicates target revenue achievement, surplus stock, and positive net margins.
- **Semantic Rose / Coral (`#EF4444` / `#F43F5E`):** Reserved for material waste, recipe loss margins, cash register variance discrepancies, and negative balances.
- **Muted Earth Neutrals (`#786F66` / `#A89F91` / `#E6DFD5`):** Metadata captions, table rules, and non-active icons.

## Typography
Typography is tuned for readability across dense Korean POS summaries and numeric accounting ledger figures.

- **Headings (Plus Jakarta Sans):** Balances humanist approachability with geometry, offering clear weight contrast against data tables.
- **Body & Controls (Inter):** System fallback incorporates Pretendard and `-apple-system` for native Korean glyph legibility, ensuring unified metrics between Hangul scripts and Latin characters.
- **Ledger Figures & Currency (JetBrains Mono):** Monospaced tabular numerals (`tnum`) applied across daily sales figures, inventory stock counts, unit costs, and profit percentages, guaranteeing vertical alignment across multi-line reconciliation sheets.

## Layout & Spacing
The layout follows a fluid-grid structure optimized for touch tablets (barista POS stands) and high-density desktop monitors (office back-office reconciliations).

- **Breakpoint System:**
  - `Mobile (< 768px)`: Single column fluid layout, sticky bottom primary action bar, collapsible accordion cards, 16px lateral padding.
  - `Tablet / POS (768px - 1080px)`: Fixed compact icon rail (64px width), 2-column KPI metric grid, horizontal scrolling data tables with sticky primary SKU headers.
  - `Desktop (> 1080px)`: 240px persistent espresso navigation sidebar, 12-column grid with 24px gutters, max-width container set to 1440px with balanced margins.
- **Vertical Spacing Rhythm:** Dense 4px baseline sub-grid. Compact metric cells maintain a 12px to 14px internal padding budget to present daily closing metrics above the viewport fold.

## Elevation & Depth
Depth relies on **tonal layering and low-contrast outlines** with faint coffee-tinted ambient shadowing to preserve an artisanal, paper-like clarity. Harsh black dropshadows are forbidden.

- **Level 0 (Floor Canvas):** Flat `#FBF9F5` background, zero shadow.
- **Level 1 (Cards, Modules, KPI Blocks):** Crisp `#FFFFFF` surface bounded by a subtle border: `1px solid #E6DFD5`. Ambient shadow: `0 1px 3px rgba(43, 24, 16, 0.04), 0 4px 12px rgba(43, 24, 16, 0.03)`.
- **Level 2 (Hovered Cards, Dropdowns, Date-pickers):** Crisp `#FFFFFF` surface with elevated outline `1px solid #D5CCC0` and warm shadow: `0 4px 6px -1px rgba(43, 24, 16, 0.06), 0 10px 20px -3px rgba(43, 24, 16, 0.05)`.
- **Level 3 (Interactive Modals & Overlays):** Sales entry dialogs and recipe breakdown sheets sit on `#FFFFFF` with outline `1px solid #C4B9AA` and deep diffused drop: `0 20px 25px -5px rgba(43, 24, 16, 0.12), 0 8px 10px -6px rgba(43, 24, 16, 0.08)`. Backdrop is dimmed using `rgba(43, 24, 16, 0.45)` with `backdrop-filter: blur(4px)`.

## Shapes
The shape strategy uses balanced roundedness (Level 2: `0.5rem` / `8px` baseline). 

- **Cards & Data Panels:** `rounded-lg` (16px) for softened, approachable paper containers.
- **Buttons, Form Inputs, & Modals:** `rounded` (8px) delivering operational discipline and alignment with dense ledger rows.
- **Status Pills, Ingredient Tags, & Mode Toggles:** Fully pill-shaped (`9999px`) to immediately distinguish categorical attributes from actionable data fields.

## Components

### Buttons & Actions
- **Primary CTA (Daily Closing Submit, Export Report):** Solid Espresso (`#2B1810`) background, crisp white typography, 8px border radius, 10px 18px padding. Hover: `#3A2418`. Active state sinks by 1px.
- **Secondary CTA (Draft Save, Inventory Adjustment):** Soft Sand (`#F4EFEB`) background with `1px solid #E6DFD5`, text in `#2B1810`. Hover: `#EAE3D9`.
- **Accent CTA (Discrepancy Resolution):** Solid Caramel (`#D97706`), white text, reserved for critical flow continuations.
- **Destructive Action (Void Transaction, Delete Recipe):** Transparent background with `1px solid #FCA5A5`, text `#EF4444`. Hover: `#FEF2F2`.

### KPI Metric Cards
- White surface, `1px solid #E6DFD5`, internal padding 16px.
- Top row: Subdued category title (`body-sm`, `#786F66`) paired with an icon or status pill.
- Center row: Monospaced high-contrast total (`metric-num-lg`, `#2B1810`).
- Bottom row: Trend indicator (e.g., `+12.4% vs last week`) wrapped in a soft pill container with semantic colors (`#10B981` on `#ECFDF5` for gains; `#EF4444` on `#FEF2F2` for margin loss).

### Data Tables (Sales Ledger & Recipe Costing)
- **Header:** Sticky, `#F4EFEB`, 11px uppercase label font (`label-caps`), text `#786F66`, border bottom `1px solid #E6DFD5`.
- **Row:** Alternating row highlights avoided; clean zebra lines using `1px solid #F4EFEB`. Hover row shifts to `#FAF7F2`.
- **Numeric Columns:** Right-aligned with tabular numbers (`table-data`), explicit currency suffixes (₩ / KRW), and visual minus indicators in `#EF4444`.

### Input Fields & Register Counters
- White container with `1px solid #D5CCC0`, height 40px, font `Inter` or `JetBrains Mono` for amounts.
- Focus state: Outline switches to `#D97706` with a `0 0 0 3px rgba(217, 119, 6, 0.15)` glow ring.
- Numeric quick-tap step buttons (`+10k`, `+50k`, `Full Closing`) styled as inline miniature chips alongside cash inputs.

### Chips & Filter Pills
- Inactive: `#F4EFEB` background, text `#786F66`, zero border.
- Active: `#2B1810` background with sharp white text.
- Ingredient badges: Tag format with warm borders (`#E6DFD5`), showcasing unit cost in monospaced micro-type.

### Informational Disclaimers & Alerts
- Standardized callout card styled with `#FFFBEB` background and `#B45309` left-edge accent border (3px). Text clarifies the illustrative, virtual nature of POS calculations and recipe cost estimates during onboarding and test simulations.