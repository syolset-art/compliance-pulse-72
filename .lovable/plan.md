## Plan: Oppdater Pågående Kampanjer

### Endring
I `MSPPartnerDashboard.tsx` oppdateres `NeedsFollowUpWidget` sin `breakdown`-array (linje 214–217) fra dagens generiske oppfølging til 3 kampanjer knyttet til compliance/regelverk for MSP/MSSP:

1. **NIS2-aktiveringskampanje** — kunder i porteføljen som er NIS2-eksponert men ikke har aktivert Trust Profile.
2. **ISO 27001-resertifiseringskampanje** — kunder med utløpte eller nært forestående ISO 27001-sertifikater.
3. **DORA-gap-analyse** — finansielle aktører i porteføljen som trenger gap-analyse mot DORA-kravene.

Kampanjene beholdes med fiktive tall (ca. 12, 8, 4) og passende fargekoder (`bg-primary`, `bg-warning`, `bg-destructive`).

### Teknisk detalj
- Fil: `src/pages/MSPPartnerDashboard.tsx`
- Bare `breakdown`-arrayen i `NeedsFollowUpWidget` endres; resten av komponenten og UI er uendret.

### Omfang
- 1 fil, 3 linjer med dataendring. Ingen nye komponenter, ingen backend-endringer.