

## Plan: To aksjonsknapper per tjeneste + aktiveringsinfo med hvem som aktiverte

### Konsept
Hver tjeneste får **to separate knapper**: "Be om tilbud" og "Aktiver". Aktiverte tjenester viser **hvem** som aktiverte (bruker selv, MSP-partner via Acronis, etc.) og **når**.

### Endringer

#### 1. `src/components/asset-profile/tabs/SecurityServicesSection.tsx`

- **Ny state-type** for aktiverte tjenester: endre `activatedIds: string[]` til `activatedServices: Record<string, { activatedBy: string; activatedAt: Date }>` for å lagre hvem som aktiverte og når.
- **AcronisModuleCard og MSPProductCard**: Vis to knapper side om side ("Be om tilbud" | "Aktiver") for ikke-aktive tjenester. Når aktiv, vis grønn badge med "Aktiv" pluss liten tekst under som viser "Aktivert av [navn] — [dato]".
- **Tre tilstander per tjeneste**: Ikke aktiv → (valgfritt) Tilbud forespurt → Aktiv. Begge handlinger kan skje uavhengig.
- Koble "Be om tilbud"-knappen til `RequestQuoteDialog` (eksisterende).
- Koble "Aktiver"-knappen til `ActivateServiceDialog` (eksisterende, oppdatert).

#### 2. `src/components/asset-profile/tabs/ActivateAcronisServiceDialog.tsx`

- Oppdater bekreftelsesvisningen: Vis "Tjenesten er aktivert" i stedet for "forespørsel sendt".
- Legg til et felt der brukeren kan velge **hvem som aktiverte**: "Jeg aktiverte selv", "MSP-partner aktiverte", "Allerede avtalt via e-post/annet".
- Returner valgt `activatedBy`-streng til callback `onActivate`.

#### 3. Aktiveringsinfo-visning i kort
- Under den grønne "Aktiv"-badgen, vis en diskret linje: `Aktivert av Hult IT AS — 27. feb 2026` eller `Aktivert av deg — 27. feb 2026`.

### Filer

| Fil | Endring |
|---|---|
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | To knapper per tjeneste, `activatedServices` state med metadata |
| `src/components/asset-profile/tabs/ActivateAcronisServiceDialog.tsx` | Oppdater dialog til direkte aktivering med "aktivert av"-valg |

