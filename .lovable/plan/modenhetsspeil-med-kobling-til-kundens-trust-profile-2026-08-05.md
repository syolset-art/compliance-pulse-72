# Modenhetsspeil med kobling til kundens Trust Profile

## Hva som legges til

På fanen «Veiledning fra Mynder», rett under «Anbefalte produkter og tjenester», kommer et nytt kort: **Modenhet per kontrollområde**.

- Viser de fem kontrollområdene (Styring og ansvar, Drift og sikkerhet, Identitet og tilgang, Personvern og datahåndtering, Tredjepart og leverandørkjede) i et to-kolonners rutenett — samme visuelle uttrykk som referansebildet.
- Prosent og fremdriftslinje per område oppdateres i sanntid fra kundens baseline-svar (samme datakilde som brukes ellers på siden), med samlet modenhet 0–100 øverst til høyre.
- Fargekoding følger dagens standard: grønn ≥75 %, oransje 50–74 %, rød under.
- En liten kildepille («Estimert fra baseline-svar») forklarer hvor tallene kommer fra.

## Klikk → kundens Trust Profile

Hele kortet (og hvert kontrollområde) er klikkbart. Ved klikk:

- **Hvis kunden har minst ett aktivt Mynder-produkt** (Mynder Core, Leverandørmodul eller et annet aktivert produkt): en bekreftelsesdialog spør om partneren vil bytte til kundens organisasjon. Ved bekreftelse byttes aktiv organisasjon til kunden, og partneren lander på kundens Trust Center / Trust Profile.
- **Hvis kunden ikke har noe aktivt produkt**: samme dialog viser i stedet en kort forklaring om at Trust Center kommer som eget produkt senere, og at tilgang krever at kunden har aktivert Trust Center eller et annet Mynder-produkt. Dialogen har da knapp videre til «Tjenester og produkter» for å aktivere.

Tilbakevei til partnervisningen er den eksisterende merkelappen i toppfeltet.

## Teknisk

- Ny komponent `src/components/msp/guidance/CustomerMaturityMirrorCard.tsx` (bygger på eksisterende `MaturityMirrorCard`, men med klikk-gate og 5-områdegrid).
- Data: `areaProgress`, `totalAnswered`, `totalQuestions` fra `useCustomerBaseline`, som allerede finnes i `MSPCustomerDetail`.
- Produkt-gate: leser aktive moduler via `getModuleState` i `src/lib/moduleActivationState.ts` (core, vendors, systems, assets m.fl.) og lytter på `modules:changed` for sanntidsoppdatering.
- Organisasjonsbytte: `enterCustomerOrg` fra `ActiveOrganizationContext`, deretter navigasjon til `/trust-center/profile`. Ny målrute legges til i `src/lib/customerEntryRoutes.ts` som `trust`-mål slik at eksisterende `EnterCustomerContextDialog` kan brukes.
- `src/pages/MSPCustomerDetail.tsx`: rendre kortet etter `CustomerRecommendationsCard` i guidance-fanen.
- Ingen databaseendringer.
