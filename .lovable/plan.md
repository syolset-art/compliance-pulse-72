

## Plan: Demo Library for Sales and Advisors

### Problem
Sales and advisors need an easy way to run predefined demos of key platform features (e.g., creating a processing activity, showing Lara's AI process suggestions). The existing demo infrastructure (DemoHighlight, DemoAgentPanel, DemoSyncContext, useDemoController) provides building blocks but lacks a curated library of ready-to-run demos and a dedicated entry point.

### Approach
Build a **Demo Library page** (`/demo-library`) accessible from the sidebar, containing a catalog of pre-built demos organized by category. Each demo is a scripted sequence that navigates to the right page and runs a guided walkthrough using the existing `DemoHighlight` system. Add new demo scenarios for the two requested flows plus more.

### Changes

**1. New page: `src/pages/DemoLibrary.tsx`**
- Grid of demo cards grouped by category (Onboarding, Compliance, AI-funksjoner, Leverandørhåndtering)
- Each card shows title, description, estimated time, difficulty
- Clicking a card navigates to the relevant page and starts the demo
- "Selgermodus" toggle at top that hides demo-irrelevant UI elements and shows a banner
- Search/filter by category

**2. Update `src/components/DemoHighlight.tsx`**
- Add new demo scenarios:
  - `create-processing-activity`: Navigate to `/protocols`, open add dialog, walk through fields
  - `lara-ai-process-suggestions`: Navigate to `/work-areas`, select an area, show AI suggestion flow
  - `vendor-trust-profile`: Navigate to vendor trust profile flow
  - `nis2-assessment`: Navigate to NIS2 assessment
  - `compliance-checklist`: Walk through the compliance checklist
- Each scenario has proper `selector` targets and `instruction` text in Norwegian

**3. Update `src/hooks/usePageContext.ts`**
- Add demo scenarios for `/protocols` and `/work-areas` pages matching the new scenarios

**4. New component: `src/components/demo/DemoLauncherBar.tsx`**
- A floating bar shown when a demo is about to start, with "Start demo" confirmation, preview of steps, and a "Tilbake til bibliotek" button

**5. Update `src/components/Sidebar.tsx`**
- Add "Demo-bibliotek" link under Utviklere section (or a new "Salg & Demo" section) with a Play icon

**6. Update `src/App.tsx`**
- Add route `/demo-library` → `DemoLibrary`

### New Demo Scenarios

| ID | Title | Category | Steps |
|----|-------|----------|-------|
| `create-processing-activity` | Opprett behandlingsaktivitet | Compliance | Navigate → Open dialog → Fill purpose, legal basis, data types → Save |
| `lara-ai-suggestions` | Lara foreslår prosesser | AI-funksjoner | Navigate to work area → Click "AI-forslag" → Show suggestions → Accept |
| `vendor-assessment` | Leverandørvurdering | Leverandører | Open vendor → Start assessment → Fill checklist |
| `nis2-partner-assessment` | NIS2-vurdering (Partner) | Partner | Navigate MSP → Select customer → Run NIS2 |
| `dashboard-overview` | Dashboard-gjennomgang | Onboarding | Walk through widgets and their purpose |

### Technical Detail

Each demo scenario uses `data-demo` attributes on target elements. For demos requiring navigation, the `startDemo` function will:
1. Use `navigate()` from react-router to go to the target page
2. Wait 500ms for render
3. Start the `DemoHighlight` sequence

The demo library page stores demo metadata in a constant array, no database needed.

### Files

| File | Change |
|------|--------|
| `src/pages/DemoLibrary.tsx` | New - demo catalog page |
| `src/components/DemoHighlight.tsx` | Add 5 new demo scenarios |
| `src/hooks/usePageContext.ts` | Add scenarios for protocols and work-areas |
| `src/components/Sidebar.tsx` | Add demo library nav link |
| `src/App.tsx` | Add `/demo-library` route |

