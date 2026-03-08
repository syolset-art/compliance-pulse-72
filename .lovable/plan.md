

## Plan: Redesign /compliance as Premium ISO Readiness Hub

### What changes

The current `/compliance` page shows a detailed requirement-by-requirement checklist. This should instead be a **premium ISO Readiness overview** that connects to the Mynder Controls model and is gated for customers pursuing certification.

### Changes

**1. Redesign `ComplianceChecklist.tsx` → ISO Readiness Hub**

Replace the current checklist UI with a cleaner page structure:

- **Hero section**: "ISO Readiness" title with framework selector (ISO 27001, GDPR, AI Act). Brief explanation that this is a structured path to certification readiness.
- **Certification Journey**: Reuse the existing `CertificationJourney` component showing the 5-phase roadmap (Foundation → Implementation → Operation → Audit → Certification).
- **Controls Connection Card**: A prominent card linking to `/controls` — "Your controls are managed in Mynder Controls" with a CTA button. This makes the mental model clear: controls live in one place.
- **Phase Checklist**: Reuse existing `PhaseChecklist` component for the detailed per-phase requirement view (this is the premium content).
- **Certification Goal Banner**: Keep the `CertificationGoalBanner` for domain activation recommendations.
- **SLA Category Breakdown**: Keep the `SLACategoryBreakdown` for timeline visibility.

**2. Remove elements**
- Remove `AIWorkingWidget` ("Lara is working now") from the page entirely
- Remove `ComplianceIntroHeader` (the AI-ready/hybrid/manual breakdown header)
- Remove the raw category-based collapsible requirement list

**3. Premium gating indicator**
- Add a subtle premium badge/indicator showing this is part of the ISO Readiness module
- If no subscription/domain is active, show a locked state with activation CTA

**4. Link controls to Mynder Controls**
- Every mention of "controls" in the page links to `/controls`
- The `RequirementCard` actions that reference controls navigate to `/controls`

### Files affected
- `src/pages/ComplianceChecklist.tsx` — Major rewrite
- No new files needed (reuses existing iso-readiness components)

