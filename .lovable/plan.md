

# Plan: Fix "Your Current Maturity" text + Create new "Mynder Controls" page

## Two changes

### 1. Fix misleading text on MaturityMethodology page
**Current:** "Based on 20 of 113 controlled assets" — this is wrong. The stats come from `useComplianceRequirements` which counts **controls**, not assets.

**Fix:** Change the subtitle in the "Your current maturity" card (line ~458) to say "controls assessed" instead of referencing assets. The current code already says "controls assessed" in the template string, so this may already be correct in code — will verify and ensure it reads clearly as "Based on X of Y controls assessed".

### 2. Create new page: `/resources/controls` — "Mynder Controls"

A new educational page following the same layout pattern as `MaturityMethodology.tsx` (Sidebar + centered content, bilingual no/en).

**Sections:**

**A. Hero — "What are Controls in Mynder?"**
Short explanation: controls = practices to manage security/privacy/risk. Mynder measures implementation, not just documentation. Controls drive maturity + compliance scores.

**B. Core Control Model — 4 domains**
Four color-coded cards (reusing the domain colors from the pipeline):
- Governance (indigo) — leadership, policies, compliance, risk management
- Operations (blue) — security of systems and operations
- Identity & Access (cyan) — who can access what
- Supplier & Ecosystem (amber) — vendor and third-party risk

**C. Foundation Controls (V1)**
Visual showing: 4 domains × 4 controls = 16 foundation controls. Explain Foundation Status = minimum baseline achieved when most controls are implemented. Grid/list of the 16 controls grouped by domain.

**D. How controls connect to real work**
Reuse the visual pipeline pattern from MaturityMethodology (colored vertical timeline): Workspaces → Processes → Systems/Vendors/Assets → Risk scenarios → Controls → Maturity score. With plain-text explanations.

**E. Framework Mapping**
Show that controls map to ISO 27001, GDPR, EU AI Act. One operational model → multiple framework compliance. Simple visual with framework badges.

**F. What comes next**
"Coming soon" section with badges: additional control families, industry-specific sets (NIS2, DORA), AI governance controls, MSP integrations, custom controls.

**G. Key principle callout**
Highlighted box: "Mynder helps organizations manage security, risk and compliance through one operational control model — instead of multiple regulatory checklists."

### Files changed
1. **`src/pages/MynderControls.tsx`** — new page (~350 lines)
2. **`src/App.tsx`** — add route `/resources/controls`
3. **`src/pages/MaturityMethodology.tsx`** — fix "Your current maturity" subtitle + add link to new Controls page from "In a nutshell" section
4. **`src/pages/Resources.tsx`** — add navigation card to the new Controls page

