# Dokumentasjon som compliance-dokumentasjon

Gjør siden "Dokumentasjon" (Trust Center) om fra en generisk dokumentliste til en compliance-oversikt: hvilke dokumenter regelverkene kunden har aktivert krever, hva vi har — og hva som mangler.

## Ny sidestruktur

```text
Dokumentasjon (compliance-dokumentasjon)
├─ Toppsammendrag: X av Y påkrevde dokumenter på plass  (progress + antall mangler)
├─ Per regelverk (aktiverte regelverk, ett kort hver, sammenleggbart)
│    GDPR        7/11 på plass   [Se mangler]
│      ✓ Personvernerklæring        (koblet dokument, status/gyldighet)
│      ✓ Databehandleravtale
│      ✗ Protokoll over behandlinger   [Last opp] [La Lara lage utkast]
├─ Andre dokumenter (uten kobling til krav) — dagens liste, komprimert
└─ Tilganger (uendret fane)
```

## Innhold og logikk

- Aktiverte regelverk hentes fra kundens valgte rammeverk (kun de som er aktive/valgte).
- Kravlisten per regelverk bygges med eksisterende motor `getDocumentStatus(frameworkId, ...)` i `src/lib/maturityNextActions.ts`, som allerede utleder typiske dokumenter per krav fra `requirementDocumentationHints.ts`.
- Matching mot opplastede dokumenter gjøres på dokumentnavn/-type (normalisert), slik at et dokument kan dekke krav i flere regelverk samtidig — vises som "dekker GDPR + NIS2".
- Status per dokument beholder dagens gyldighetsvurdering (`documentCompliance.ts`): Gyldig / Bør gjennomgås / Utdatert. Et utdatert dokument teller ikke som "på plass" i sammendraget, men vises som "må fornyes" i stedet for "mangler".
- Manglende dokumenter får handlinger: Last opp, Legg til lenke, Marker "på forespørsel", og (der Lara støtter det) Lag utkast.
- Filtrering: alle regelverk / ett regelverk, og "vis kun mangler".
- Hvis ingen regelverk er aktivert vises en tom tilstand med lenke til Regelverk-siden.

## Det som beholdes

- "Påkrevde artefakter"-blokken erstattes av den nye regelverksdrevne listen (den dekker det samme, men bredere).
- Synlighetslinjen (offentlig / delt / internt), søk, filter, opplastingsdialog og Tilganger-fanen beholdes.

## Teknisk

- Ny `src/lib/complianceDocumentCoverage.ts`: ren funksjon som tar aktiverte rammeverk + `vendor_documents` og returnerer per-regelverk-dekning (påkrevd, dekket av, status, mangler) samt totalsummering.
- Ny komponent `src/components/trust-center/FrameworkDocumentCoverage.tsx` som rendrer per-regelverk-kortene.
- `src/pages/TrustCenterEvidence.tsx` oppdateres: henter aktiverte rammeverk, viser sammendrag + dekningsseksjon øverst, og flytter dagens dokumentliste ned under "Andre dokumenter".
- Ingen databaseendringer. All tekst i EN/NB via eksisterende `isNb`-mønster.
