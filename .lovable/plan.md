## Mål

Partneren skal på ett blikk se: hvilke regelverk kunden **må etterleve**, hvilke som er **aktivert**, og **neste anbefalte tiltak** for å øke modenhet. Produkter og manglende dokumentasjon flyttes ned i detaljvisning.

Gjelder kortet «Regelverk anbefalt for denne kunden» på fanen **Veiledning fra Mynder** (`RegulationsStatusCard`), som i dag har kolonnene Regelverk · Anbefalte tjenester · Status · Handling.

## Ny tabellstruktur

```text
REGELVERK              STATUS             ANBEFALTE TILTAK FOR ØKT MODENHET
GDPR                   ● Aktivert         · 3 aktiviteter uten dokumentasjon  →
Personvernforordn.     (siden 12.03)      · Mangler databehandleravtale
                                          · Tjeneste: Personvern-gjennomgang ★

NIS2                   ● Bekreftet        · Aktiver regelverket for å måle modenhet →
                       (ikke aktivert)    · Tjeneste: NIS2 risikovurdering ★

ISO 27001              ○ AI-anbefalt      · Bekreft at regelverket gjelder →
```

- **Kolonne 1 – Regelverk:** navn + alias + kort Lara-begrunnelse (som i dag).
- **Kolonne 2 – Status:** Aktivert / Bekreftet (ikke aktivert) / AI-anbefalt, med samme fargespråk som i dag (grønn = aktivert).
- **Kolonne 3 – Anbefalte tiltak:** prioritert liste (maks 3) generert av en ny hjelpefunksjon, blandet av tre typer tiltak:
  1. **Aktiver regelverk** (hvis bekreftet, men ikke aktivert) — største modenhetsløft.
  2. **Manglende dokumentasjon / åpne aktiviteter** — kontrollområder i modenhetsvurderingen som ikke er besvart eller mangler dokument (fra `useCustomerBaseline` + `useBaselineDocuments`).
  3. **Tjeneste partneren kan selge** — fra dagens `servicesFor()`-logikk, markert med stjerne hvis den finnes i partnerens egen katalog.

Hvert tiltak er klikkbart og åpner eksisterende flyt (aktiver-dialog, opplastingsdialog, eller tjenestekatalog).

## Detaljvisning (drawer)

Klikk på en rad åpner en drawer «{Regelverk} — detaljer» med:
- **Produkter/moduler kunden har** for dette regelverket (gjenbruker data fra `CustomerModulesTab`), med lenke «Se i Produkter».
- **Dokumentstatus:** liste over anbefalte dokumenter (fra `requirementDocumentationHints`) med Har / Mangler-merking, koblet mot opplastede bevis (`PartnerEvidenceSection` / `useBaselineDocuments`). «Mangler»-rader har direkte «Last opp»-knapp.
- **Alle anbefalte tjenester** for regelverket (full liste, ikke bare 3).

## Teknisk

- Ny `src/lib/maturityNextActions.ts`: bygger prioriterte tiltak per framework fra baseline-svar, baseline-dokumenter, aktive frameworks og tjenestekatalog. Ren, testbar funksjon uten UI.
- Ny `src/components/msp/guidance/RegulationDetailDrawer.tsx` for detaljvisning.
- `RegulationsStatusCard.tsx` omskrives til tre kolonner + kompakt handlingsmeny (aktiver/bekreft/last opp beholdes, men flyttes til hover-/ikonknapper til høyre slik at kolonne 3 får plass).
- Ingen databaseendringer; all ny logikk leser eksisterende kilder (msp_customers, localStorage-baseline, servicekatalog).
