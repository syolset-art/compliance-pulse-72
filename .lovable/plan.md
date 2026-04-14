

## Plan: Ny flerstegsdialog for «Legg til kunde» med BrReg-oppslag og animasjon

### Oversikt

Erstatter den nåværende `AddMSPCustomerDialog` med en ny flerstegsdialog i 4 steg som matcher bildene du delte:

```text
Steg 1: Velg metode (Enkelt / CSV / Tilkoblede systemer)
Steg 2: Søk etter virksomhet (navn → BrReg/demo-registre)
Steg 3: Resultatliste → Velg → «Lara Soft sjekker...»-animasjon
Steg 4: Kontaktinformasjon + Fullfør → Sommerfugl-animasjon
```

### Detaljer

**Steg 1 — Velg metode**
- Tre valgkort: «Legg til enkelt kunde», «Importer flere kunder (CSV)», «Importer fra tilkoblede systemer» (Acronis, ConnectWise badges)
- Kun «enkelt kunde» er klikkbar; de andre viser «Kommer snart»

**Steg 2 — Søk etter virksomhet**
- Tekstfelt for selskapsnavn
- «Søk»-knapp som kaller BrReg API (`/enheter?navn=...&size=5`)
- For SE/DK brukes eksisterende demo-data fra `useVendorLookup`
- «← Tilbake»-lenke

**Steg 3 — Resultater og verifisering**
- Viser treff med org.nr, sted og selskapsform
- Klikk på et treff → mellomskjerm: Mynder-sommerfugl (lara-butterfly.png) + «Lara Soft sjekker...» + animert spinner i 2 sekunder
- Sjekker om virksomheten allerede finnes i `msp_customers` (duplikatkontroll)
- Autofyller org.nr, bransje og ansatte fra BrReg-data

**Steg 4 — Kontaktinformasjon**
- Forhåndsutfylt kundenavn og org.nr (readonly)
- Felter: Kontaktperson, E-post, Rolle i selskapet, Abonnement
- «Fullfør»-knapp → lagrer til DB → viser fullskjerms sommerfugl-animasjon (fade-in, puls, skalering) med tekst «Kunden er lagt til!»
- Etter 2.5 sek lukkes dialogen og kunden vises øverst i listen

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/msp/AddMSPCustomerDialog.tsx` | Full omskriving med 4-stegs flyt |
| `src/pages/MSPDashboard.tsx` | Ingen endring (eksisterende props fungerer) |

Ingen databaseendringer — bruker eksisterende `msp_customers`-tabell og felter.

