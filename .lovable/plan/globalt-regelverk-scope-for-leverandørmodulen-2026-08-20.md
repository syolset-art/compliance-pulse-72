# Globalt regelverk-scope for leverandørmodulen

Brukeren skal kunne bestemme, ett sted, hvilke regelverk **alle** leverandører styres etter. Ingen priser vises – regelverk i leverandørmodulen er inkludert i modulprisen.

## Ny arkfane: Regelverk (/vendors?tab=frameworks)

Ny fane i leverandørdashbordet, plassert etter "Oversikt":

- Kort øverst forklarer: "Velg hvilke regelverk som gjelder for leverandørstyring. Valget gjelder alle leverandører."
- Liste over tilgjengelige regelverk gruppert på type (Regelverk / Standarder / Retningslinjer og rammeverk), samme kategorisering som /regulations.
- Hver rad: navn, kort beskrivelse, badge for Obligatorisk/Anbefalt, og en bryter (av/på). **Ingen pris, ingen kreditt-estimat, ingen «krever tillegg»-merking** i denne visningen.
- Forhåndsvalgt ved første besøk: GDPR, Personopplysningsloven, ISO 27001, NIS2, DORA, ISO 27701 (dagens hardkodede leverandørrelevante sett).
- Oppsummeringslinje nederst: «X regelverk i scope for leverandørstyring» + Lagre-knapp med toast.
- Liten notis: regelverk som ikke er aktivert i virksomhetens generelle regelverksvalg kan fortsatt velges her, men merkes «Kun leverandørstyring».

## Effekt i resten av modulen

- Leverandørprofil → Oversikt: "Modenhet per regelverk" bruker scopet i stedet for den hardkodede listen `VENDOR_RELEVANT_FRAMEWORKS`. «Vis alle regelverk»-lenken beholdes.
- Leverandøroversikten (fanen «Alle»): scopet vises som en liten lesbar linje/pille-rekke øverst, med lenke til Regelverk-fanen.
- Gap-/kravvisninger på leverandør bruker samme scope som filter.

## Teknisk

- Ny tabell `public.vendor_framework_scope`: `id uuid pk`, `framework_id text unique`, `framework_name text`, `is_enabled boolean not null default true`, `created_at`, `updated_at` + `update_updated_at_column`-trigger.
- Migrasjonen inkluderer GRANT (`SELECT, INSERT, UPDATE, DELETE` til `authenticated`, `ALL` til `service_role`), RLS på, og policy for innloggede brukere (samme mønster som `selected_frameworks`).
- Ny hook `useVendorFrameworkScope()` som leser tabellen og faller tilbake til standardsettet når tabellen er tom.
- Ny komponent `src/components/vendors/VendorFrameworkScopeTab.tsx`; fanen registreres i `src/pages/VendorDashboard.tsx` (verdi `frameworks`, styrt av `?tab=`).
- Regelverkslisten hentes fra `src/lib/frameworkDefinitions.ts`; feltene `estimatedCredits` og `addon_required` brukes ikke i denne visningen.
- Full i18n (NO/EN) via i18next-nøkler under `vendorDashboard.frameworks.*`.

## Utenfor scope

- Per-leverandør overstyring av regelverk (kan komme senere).
- Endringer i prising eller abonnementslogikk.
