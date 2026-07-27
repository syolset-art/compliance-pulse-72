## Mål
Når brukeren er i Partner-modus (`useWorkspaceMode().mode === "partner"`) skal "Partner Workspace"-kortet i `Subscriptions.tsx` vises som aktivert, uavhengig av `companyProfile.is_msp_partner`-flagget.

## Bakgrunn
I dag styres aktivering av Partner Workspace-kortet kun av `companyProfile.is_msp_partner` som hentes fra `company_profiles`-tabellen. Men Partner-modus kan være aktiv via `WorkspaceModeContext` (vist i topbar-switcheren) uten at dette flagget er satt korrekt i profilen — da vises modulen feilaktig som "Ikke aktivert" selv om brukeren står i Partner-modus.

## Endringer

### `src/pages/Subscriptions.tsx`
1. Importer `useWorkspaceMode` fra `@/contexts/WorkspaceModeContext`.
2. Les `mode` og `availableModes` fra hooken.
3. Endre aktiveringslogikken slik at Partner Workspace regnes som aktivert dersom **enten**:
   - `companyProfile.is_msp_partner === true`, **eller**
   - `mode === "partner"`, eller `availableModes` inkluderer `"partner"` (brukeren har tilgang til Partner-arbeidsområdet).
4. Oppdater alle referanser til `isMspPartner` i `ModuleCard`-blokken for Partner Workspace (status, pris, priceLabel, action, onClick, onDeactivate) til å bruke den nye avledede verdien `hasPartnerAccess`.
5. Sørg for at `totalMonthly`-beregningen også bruker `hasPartnerAccess` slik at 990 kr inkluderes når Partner-modus er aktiv.

### Ingen andre filer endres
Kun frontend-visning i Subscriptions-siden speiler nå Partner-modus-tilstanden.

## Akseptansekriterier
- Bruker som står i Partner-modus (Partner-modus-pillen synlig i topbar) ser Partner Workspace-kortet som **Aktivert** med pris 990 kr/mnd og "Åpne"-handling.
- Totalsum inkluderer 990 kr når Partner-modus er aktiv.
- Bruker uten Partner-tilgang ser fortsatt kortet som "Ikke aktivert" med "Kontakt salg"-handling.
- Deaktivering via kebab-meny fungerer som før for brukere med Partner-tilgang.
