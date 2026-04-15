

# Plan: Betalingsbekreftelse ved aktivering av regelverk

## Konsept

Når en bruker forsøker å aktivere et regelverk, skal det komme en bekreftelses-dialog **før** aktivering — ikke etter. GDPR og ISO 27001 er gratis og aktiveres umiddelbart med en enkel bekreftelse. Alle andre betalte regelverk viser pris, hva som er inkludert, og krever eksplisitt godkjenning.

## Flyten

```text
Bruker klikker "Aktiver" på et regelverk
        │
        ▼
   Er det gratis? ──── JA ──→ Enkel bekreftelsesdialog
   (GDPR/ISO 27001)          "Inkludert i ditt abonnement"
        │                     → Aktiver direkte
        NO
        │
        ▼
   FrameworkPurchaseDialog
   ┌─────────────────────────────────┐
   │ [Ikon] NIS2-direktivet         │
   │ ────────────────────────────────│
   │ ✓ Gap-analyse                  │
   │ ✓ Tiltaksliste                 │
   │ ✓ Modenhetsvurdering           │
   │ ✓ Rapportdeling                │
   │ ────────────────────────────────│
   │ Pris: 4 167 kr/mnd (50 000/år) │
   │ ────────────────────────────────│
   │ ⚠ Compliance-skåren vil        │
   │   beregnes på nytt             │
   │ ────────────────────────────────│
   │ [Avbryt]  [Godkjenn og aktiver]│
   └─────────────────────────────────┘
        │
        ▼
   Aktivering → Suksess-dialog (eksisterende)
```

## Endringer

### 1. Ny komponent: `FrameworkPurchaseDialog.tsx`
Pre-aktiverings dialog med:
- Regelverkets navn, ikon og kategori
- Liste over hva som er inkludert (fra `FRAMEWORK_ADDONS[id].includes`)
- Pris per måned og per år
- For gratis regelverk: "Inkludert i ditt abonnement" med grønn badge
- Advarsel om at compliance-skåren vil beregnes på nytt
- "Godkjenn og aktiver"-knapp som kaller den faktiske aktiveringsfunksjonen
- Avbryt-knapp

### 2. Oppdater `Subscriptions.tsx`
Endre `handleToggleFramework` slik at:
- Når bruker **aktiverer** et regelverk → åpne `FrameworkPurchaseDialog` først
- Når bruker **deaktiverer** → deaktiver direkte (eventuelt med enkel bekreftelse)
- Etter godkjenning i purchase-dialogen → kjør eksisterende aktiveringslogikk → vis `FrameworkActivationDialog`

### 3. Oppdater `Regulations.tsx` og `TrustCenterRegulations.tsx`
Samme mønster: aktivering via purchase-dialog først.

### 4. Oppdater `FrameworkActivationDialog.tsx`
Fjerne pris-info herfra (den er nå i purchase-dialogen). Beholde suksess-melding, score-advarsel og Lara-hjelp.

### 5. Differensiert prising i `planConstants.ts`
Legge til månedspris-beregning (`yearlyPriceKr / 12`) som hjelpefunksjon, og evt. mer varierte priser per regelverk (f.eks. NIS2 dyrere enn Åpenhetsloven).

## Filer

| Fil | Endring |
|---|---|
| `src/components/dialogs/FrameworkPurchaseDialog.tsx` | Ny — pre-aktiverings bekreftelses-dialog |
| `src/pages/Subscriptions.tsx` | Koble purchase-dialog inn i toggle-flyten |
| `src/pages/Regulations.tsx` | Koble purchase-dialog inn ved aktivering |
| `src/pages/TrustCenterRegulations.tsx` | Koble purchase-dialog inn ved aktivering |
| `src/lib/planConstants.ts` | Legge til `getFrameworkMonthlyPrice()` hjelpefunksjon |

