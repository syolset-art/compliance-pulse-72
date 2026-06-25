Add an info icon + tooltip next to the "Ingen verifiserte kontroller ennå." / "No verified controls yet." empty state in `src/pages/TrustCenterProfile.tsx` (around line 2233), explaining what the user needs to do for verified documentation to appear here.

### Change
Replace the plain `<p>` with a small inline row: a `HelpCircle` (lucide) icon + the existing italic text, wrapped in a Tooltip (existing `@/components/ui/tooltip`).

Tooltip copy:
- NB: "For at en kontroll skal vises som verifisert må du laste opp dokumentasjon (f.eks. policy, sertifikat eller revisjonsrapport) under tilhørende kontrollområde, og markere den som verifisert. Lara kan også foreslå dokumenter automatisk."
- EN: "For a control to appear here as verified, upload supporting documentation (e.g. policy, certificate, or audit report) under the related control area and mark it as verified. Lara can also suggest documents automatically."

### Scope
- Single file edit: `src/pages/TrustCenterProfile.tsx`
- No new components, no logic changes — purely presentational empty-state hint.
- Reuse existing `HelpCircle` import if present; otherwise add to the lucide-react import line.