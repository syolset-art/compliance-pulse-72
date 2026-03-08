

# Add "Trust Profile" section to Maturity Methodology page

## What to build
A new section inserted after the "How the model works" pipeline and before the "Maturity scale (0–4)" section. Inspired by the uploaded image showing a 4-stage quality progression.

## New section: "Hva er en Trust Profile?" / "What is a Trust Profile?"

### 1. Intro paragraph
Plain-language explanation: A Trust Profile is a living compliance card for any system, vendor or your own organization. It can be AI-generated or fully owned by the company itself.

### 2. Visual horizontal 4-stage quality flow (inspired by uploaded image)
Four color-coded cards in a horizontal row (stacked on mobile) showing how a Trust Profile evolves:

| Stage | Title | Color | Description |
|-------|-------|-------|-------------|
| 1 | Created | `emerald` | AI scans public sources, finds basic data and risk signals |
| 2 | Enriched | `amber` | Customer adds documents, analysis, compliance data |
| 3 | Requested | `orange` | Missing info requested from supplier, follow-up automated |
| 4 | Verified | `indigo/purple` | Supplier responds, self-declaration signed, identity confirmed |

Each card shows 3 bullet points + "By: Lara Soft / Customer / Supplier" label + a quality percentage badge.

A gradient progress bar spans across the top (LOW → HIGH quality).

### 3. "Your profile vs. vendor profile" explainer
Two side-by-side mini-cards explaining the key difference:

**Your Trust Profile (self)**
- Shows YOUR compliance maturity and controls
- You own and manage the data
- Shared with customers who request it

**Vendor Trust Profile**
- Shows the vendor's compliance FROM YOUR PERSPECTIVE
- Includes YOUR risk assessment of that vendor
- Compliance score = vendor's own data; Risk score = your evaluation

A short callout box: "The same Trust Profile can show different risk scores depending on who is looking — because risk is always relative to the observer's context."

### 4. Three bottom highlight cards (inspired by image)
- **Community effect**: Reports shared by others improve everyone's profiles
- **Reusable**: One profile, verified once — trusted across all customers
- **AI + Human**: AI creates the base, humans verify and enrich

## Technical details
- All changes in `src/pages/MaturityMethodology.tsx`
- Insert new section block (~120 lines) between the pipeline summary box (line ~210) and the maturity scale section (line ~212)
- Uses existing components: Card, Badge, lucide icons
- New icons needed: `Bot, Users, UserCheck, Share2, ShieldCheck, Fingerprint`
- Full bilingual support (no/en) via existing `t()` helper
- Responsive: horizontal cards on desktop, stacked on mobile using `isMobile` flag

