
# "Del ferdig" - Administrer deling dialog + Fullforing av oppgave

## Oversikt
Nar brukeren klikker "Del ferdig" pa en kundeforespørsel, apnes en ny **to-stegs dialog** ("Administrer deling") i stedet for a umiddelbart fullfare. Brukeren velger delingsmodus og kunder, bekrefter, og kan deretter markere oppgaven som fullfort.

## Ny komponent: ManageSharingDialog

### Steg 1: Velg deling
- **Header**: "Administrer deling" + foresporseltittel (f.eks. "Norsk leverandorvurdering")
- **Steg-indikator**: Visuell tab-bar med "1. Velg deling" og "2. Velg kunder"
- **Info-banner**: "Steg 1 av 2: Velg hvem som skal fa tilgang. Ingenting sendes enna."
- **Tre radioknapper**:
  1. **Del med alle kunder** - "Nye kunder far automatisk tilgang."
  2. **Del med utvalgte kunder** - "Velg noyaktig hvem som far tilgang."
  3. **Ikke del enna** - "Ingen kunder ser dette forelopig."
- **Eksisterende status-badge**: "Delt med X kunder" (nar allerede delt)
- **Footer**: "Del senere" (lukk) + "Neste: Steg 2" (primary)

### Steg 2: Velg kunder (vises kun ved "utvalgte kunder")
- **Info-banner**: "Steg 2 av 2: Velg noyaktig hvilke kunder som skal fa malen, og bekreft."
- **"Tilbakestill til navarende deling"** knapp
- **Teller**: "X av Y valgt" + "Velg alle" / "Fjern alle"
- **Sokefelt** + **Prioritet-filter** (toggle)
- **Kundeliste** med:
  - Avkrysningsboks per kunde
  - Kundenavn
  - Status-badges: "Delt" (gronn) / "Ikke delt" (gra)
  - "Prioritet"-badge (oransje) der relevant
  - Kategori-badge (f.eks. "ALL SUPPLIERS", "PRIORITY SUPPLIERS")
  - Valgt-tilstand med bla venstre-border
- **Footer**: "Del senere" + "Tilbake" + "Bekreft deling" (primary)

### Etter bekreftelse: Fullforingsstatus
Nar deling er bekreftet:
- Foresporselen oppdateres til status "completed"
- En suksess-toast vises: "Delt med X kunder"
- Kortet viser oppdatert status med "Delt med X kunder"-badge
- **"Administrer deling"**-knapp forblir tilgjengelig for a endre innstillinger

## Endringer i CustomerRequestCard
- "Del ferdig"-knappen apner ManageSharingDialog i stedet for direkte fullforing
- Fullforte foresporsler far to knapper: "Administrer deling" (outline) + "Delt"-badge
- Viser antall kunder foresporselen er delt med

## Endringer i CustomerRequestsTab (Trust Profile)
- Samme logikk: "Del ferdig" apner ManageSharingDialog
- Fullforte rad viser "Administrer deling"-knapp i stedet for bare check-ikon

## Database
Nye kolonner pa `customer_compliance_requests`:
- `shared_mode` (text, default null) - 'all' | 'selected' | null
- `shared_with_customers` (text[], default '{}') - array med kundenavn
- `completed_at` (timestamptz, default null)

## Teknisk implementasjon

### Nye filer
- `src/components/customer-requests/ManageSharingDialog.tsx` - To-stegs dialog

### Endrede filer
- `src/components/customer-requests/CustomerRequestCard.tsx` - Koble "Del ferdig" til dialog
- `src/components/asset-profile/tabs/CustomerRequestsTab.tsx` - Koble "Del ferdig" til dialog
- `src/pages/CustomerRequests.tsx` - Oppdater handleShare-logikk

### Demo-kunder for dialogen
Hardkodede kunder med metadata for demo:
- Allier AS (Prioritet, ALL SUPPLIERS, Delt)
- Allier AS FEIL (Prioritet, Ikke delt)
- Anders O Grevstad AS (Prioritet, PRIORITY SUPPLIERS, Delt)
- TechCorp AS (Ikke delt)
- Nordic Solutions (Ikke delt)
- Bergen Finans AS (Delt)

### UI-designprinsipper
- Minimalistisk dialog med tydelig steg-navigasjon
- WCAG: aria-labels, fokusring, tastaturnavigasjon
- Responsivt: Full bredde pa mobil
- Klarsprak: Korte beskrivelser uten fagsjargong
- Visuell tilbakemelding: Valgte kunder far bla venstre-border
