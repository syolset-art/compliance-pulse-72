# Felles handlingsknapper: Last opp dokumentasjon + Installer Sara

## Mål
De to knappene skal se like ut og oppføre seg likt overalt hvor brukeren kan laste opp dokumentasjon — ikke bare på kravlisten under Regelverk.

Etter at Sara er installert og tatt i bruk skal «Installer Sara» fortsatt vises, men som deaktivert knapp, slik at brukeren ser at agenten allerede er lastet ned. «Last opp dokumentasjon» skal alltid være aktiv.

## Ny felles komponent
`src/components/agents/DocumentActionButtons.tsx`

Viser, i denne rekkefølgen:

1. **Last opp dokumentasjon** (primærknapp) — kaller en `onUpload`-callback fra siden som bruker den, så hver side beholder sin egen opplastingsdialog.
2. **Installer Sara** (sekundærknapp)
   - Ikke installert: aktiv, åpner Sara-veiledningen (`SaraOnboardingDialog`), samme tooltip-tekst som i dag.
   - Installert: deaktivert, hakeikon, tekst «Sara er installert», tooltip «Sara kjører lokalt hos dere. Endre oppsettet under Innstillinger → Datakilder og agenter.»
3. **Se aktivitet** (kun når Sara er installert og har nye funn) — åpner `SaraActivityLogDialog`, med antall nye funn.

Alt tospråklig (nb/en), samme kompakte størrelse (`h-8`, `text-xs`) som dagens knapper, med responsive tekstetiketter.

## Hvor komponenten tas i bruk
- `src/components/regulations/FrameworkRequirementsList.tsx` — erstatter dagens knapperad (samme plassering, samme dialoger).
- `src/pages/DocumentHub.tsx` — øverst til høyre i headeren, ved siden av dagens «Last opp dokument».
- `src/pages/TrustCenterEvidence.tsx` (Dokumentasjon under Trust Center) — erstatter dagens betingede «Installer Sara»-knapp, ved siden av «Legg til».
- `src/components/work-areas/...` og leverandørens dokumentseksjon: samme knapperad legges på de opplastingsflatene som allerede har en «Last opp»-knapp i headeren, uten å endre eksisterende opplastingslogikk.

## Teknisk
- Installasjonsstatus leses fra eksisterende `useSaraAgent()` i `src/lib/saraAgent.ts` — ingen ny state eller backend.
- Ingen endring i opplastingsdialoger, dokumentmodell eller kartlegging; kun presentasjon av knapper.
- Deaktivert knapp pakkes i `<span>` inne i tooltip-trigger, slik at tooltip fortsatt vises.
