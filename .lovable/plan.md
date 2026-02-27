

## Plan: Gjør alle anbefalte løsninger aktiverbare med tydelig MSP-prosessmelding

### Problem
Kun Acronis-moduler kan aktiveres i dag. De andre anbefalte løsningene (mspProducts) har ingen aktiveringsknappe. Brukeren får heller ingen tydelig forklaring på hva som skjer etter aktivering — at MSP-partneren mottar forespørselen og setter i gang.

### Endringer

#### 1. Ny komponent: `ActivateServiceDialog.tsx` (erstatter `ActivateAcronisServiceDialog.tsx`)
- Generalisert dialog som håndterer aktivering av **alle** løsninger — både Acronis-moduler og MSP-produkter
- Ny prop `productType: "acronis" | "msp-product"` og `product: AcronisModule | MSPProduct`
- Etter aktivering: vis en **vennlig bekreftelses-visning** inne i dialogen (ikke bare toast):
  - Grønn sjekkikon og melding: "Forespørselen din er sendt!"
  - Forklaring: "Din MSP-partner har mottatt forespørselen og vil kontakte deg innen 1–3 virkedager for å sette opp [tjenestenavn]. Du trenger ikke gjøre noe mer nå."
  - Knapp: "Lukk" som lukker dialogen
- Fortsatt vise ISO-kontroller og estimert oppsett-tid

#### 2. Oppdater `SecurityServicesSection.tsx`
- Gi hvert `mspProduct`-kort en **"Aktiver"**-knapp
- Track aktiverte MSP-produkter i lokal state (`activatedProductIds: string[]`)
- Aktiverte MSP-produkter viser "Bestilt ✓" badge i stedet for Aktiver-knapp
- Åpne den nye generaliserte dialogen for både Acronis og mspProducts

#### 3. Oppdater `securityServiceCatalog.ts`
- Legg til unik `id` på hvert `MSPProduct` (trengs for state-tracking)

### Filer

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Legg til `id` på `MSPProduct` |
| `src/components/asset-profile/tabs/ActivateAcronisServiceDialog.tsx` | Omskrive til generalisert dialog med bekreftelses-steg |
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Aktiver-knapper på mspProducts, track state, prosessmelding |

