

## Plan: Tillat demo-data uten innlogging

### Problem
Tre barrierer hindrer uinnloggede brukere fra å laste ned demo-data:
1. `seedDemoMSP()` kaster feil «Ikke innlogget» på linje 18
2. Database-spørringer bruker `enabled: !!user?.id` — kjører aldri uten bruker
3. RLS-policyer krever `auth.uid()` — alle operasjoner feiler for anonyme

### Løsning

**1. Ny RLS-policy for anonym lesing (database-migrering)**
- Legg til `SELECT`-policy med `USING (true)` på `msp_customers`, `msp_licenses`, `msp_license_purchases`, `msp_invoices`, `msp_customer_assessments`
- INSERT/UPDATE/DELETE forblir beskyttet bak `auth.uid()`

**2. Oppdater `src/lib/demoSeedMSP.ts`**
- Fjern `if (!user) throw new Error("Ikke innlogget")`
- Bruk en fast demo-bruker-ID (f.eks. `"00000000-0000-0000-0000-000000000000"`) som fallback når `user` er `null`
- Legg til anonym INSERT-policy med `WITH CHECK (msp_user_id = '00000000-...')` for demo-formål

**3. Oppdater `MSPDashboard.tsx`, `MSPLicenses.tsx`, `MSPInvoicesTab.tsx`**
- Fjern `enabled: !!user?.id` fra alle queries (eller sett `enabled: true`)
- Fjern `user?.id` fra queryKeys der det brukes som filter

**4. Oppdater `deleteDemoMSP()` i `demoSeedMSP.ts`**
- Bruk samme fallback demo-bruker-ID for sletting

### Filer som endres

| Fil | Endring |
|-----|---------|
| Ny migrering | Anonym SELECT + begrenset INSERT-policy |
| `src/lib/demoSeedMSP.ts` | Fjern auth-krav, bruk fallback-ID |
| `src/pages/MSPDashboard.tsx` | Fjern `enabled: !!user?.id` |
| `src/pages/MSPLicenses.tsx` | Ingen endring (bruker ikke user-gating) |
| `src/components/msp/MSPInvoicesTab.tsx` | Fjern `enabled: !!user?.id` |

