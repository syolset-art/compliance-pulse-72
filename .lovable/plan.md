

# Make the Maturity Methodology page more visually engaging

## Problem
The page is visually monotonous — every section uses the same card style with small purple icons, making it hard to scan and distinguish sections. The "How the model works" flow especially lacks visual hierarchy and color differentiation.

## Plan

### 1. "How the model works" — visual pipeline redesign
Replace the current flat list + chevron arrows with a **colored vertical timeline/pipeline**:
- Each step gets a **unique background color** (not just `primary/10` for everything):
  - Workspaces: `indigo-500` 
  - Processes: `blue-500`
  - Systems/Vendors: `cyan-500`
  - Risk & Controls: `amber-500`
  - Maturity Score: `emerald-500`
- Left side: colored vertical line connecting colored circles (like a pipeline)
- Each step node is a filled circle with the step number
- Connecting line uses a gradient from indigo → emerald
- Cards get a subtle left-border accent matching their color

### 2. "In a nutshell" — differentiate the three cards
Give each card its own icon color instead of all being `text-primary`:
- Target: `text-indigo-500` with `bg-indigo-500/10`
- BarChart3: `text-emerald-500` with `bg-emerald-500/10`
- Eye: `text-amber-500` with `bg-amber-500/10`

### 3. Maturity scale (0–4) — stronger color ramp
Replace the current subtle opacity-based colors with a clear green ramp:
- Level 0: `bg-gray-200` (neutral)
- Level 1: `bg-amber-300`
- Level 2: `bg-amber-500`
- Level 3: `bg-blue-500` with white text
- Level 4: `bg-emerald-500` with white text

Also make the progress bar beside each level match these colors.

### 4. "Your current maturity" card — add a radial/arc feel
Add a larger badge with a colored ring to make the percentage feel more prominent and celebratory.

### 5. Accordion section — colored icon accents already exist, just bump text size
Increase accordion trigger text from `text-sm` to `text-base` for better readability.

## Files changed
- `src/pages/MaturityMethodology.tsx` — all changes in this single file

