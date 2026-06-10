# Åpne regelverk-panel fra Etterlevelse i Rediger Trust Profile

I dag navigerer "Legg til"-knappen i Etterlevelse-seksjonen på `/trust-center/edit` til `/regulations`. Den skal i stedet åpne det samme høyre-side-panelet som brukes på Regelverk-siden (`EditActiveFrameworksDialog`), slik at brukeren kan aktivere/deaktivere regelverk uten å forlate redigeringsflyten.

## Endringer

**Fil:** `src/pages/TrustCenterEditProfile.tsx`

1. Importer `EditActiveFrameworksDialog` og hjelpere (`frameworks` fra `@/lib/frameworkDefinitions`, `toast`).
2. Ny state: `showFrameworksSheet`, `updatingFrameworkId`.
3. Hent også alle rader fra `selected_frameworks` (ikke bare `is_selected=true`) i en query, slik at vi kan toggle eksisterende rader. Behold den eksisterende `frameworks`-querien for visning, men utled `activeFrameworkIds: Set<string>` fra rådata.
4. Implementér `handleToggleFramework(frameworkId, currentlyActive)` som speiler logikken i `Regulations.tsx` (`executeToggleFramework`): insert ny rad om den ikke finnes, ellers oppdater `is_selected`. Invalider react-query etterpå (`queryClient.invalidateQueries(["selected-frameworks-edit"])`) så listen oppdateres umiddelbart.
5. Endre "Legg til"-knappen (linje 306) og tom-tilstands-knappen (linje 325) til `onClick={() => setShowFrameworksSheet(true)}` i stedet for `navigate("/regulations")`.
6. Render `<EditActiveFrameworksDialog open={showFrameworksSheet} onOpenChange={setShowFrameworksSheet} activeFrameworkIds={activeFrameworkIds} onToggle={handleToggleFramework} updatingId={updatingFrameworkId} />` nederst i komponenten.

## Ikke i scope

- Country scope-dialogen og kjøps-/aktiverings-dialogene fra Regelverk-siden (holdes på `/regulations` for å unngå duplisert flyt). Toggle skjer direkte; hvis det senere ønskes kjøpsbekreftelse også her, kan det legges til som oppfølging.
- Ingen endringer i preview (`TrustCenterProfile.tsx`) – den henter allerede `selected_frameworks` og oppdateres automatisk.
