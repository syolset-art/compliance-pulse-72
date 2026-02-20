

# Acronis-tilkobling og MSP superadmin-tilgang i partnerdashbordet

## Hva skal bygges

To nye funksjoner i partnerdashbordet:

### 1. Acronis-tilkoblingsflyt

En steg-for-steg veiviser som lar MSP-partneren koble Acronis til en kunde. Flyten starter fra Acronis-kortet i kundedetaljvisningen (der det i dag star "Acronis ikke tilkoblet") og guider partneren gjennom:

- **Steg 1**: Tast inn Acronis tenant-ID og API-nokkel
- **Steg 2**: Velg hvilken kunde/tenant i Acronis som skal kobles
- **Steg 3**: Bekreft og importer -- viser antall enheter funnet
- **Steg 4**: Suksess-bekreftelse med oppsummering

Nar tilkoblingen er fullfort, oppdateres `msp_customers`-tabellen med `has_acronis_integration = true` og `acronis_device_count` settes til antall enheter. Acronis-kortet viser deretter live-status.

### 2. "Ga inn som kunde"-funksjon (superadmin-tilgang)

En ny knapp i kundedetaljvisningen ("Ga inn i kundens portal") som lar MSP-partneren se kundens dashbord som om de var kunden selv. Dette er en simulert visning der:

- Partneren ser kundens hoved-dashbord (Dashboard 2.0 eller standard)
- Et tydelig banner viser "Du ser na [Kundenavn] sin portal som partner"
- En "Ga tilbake"-knapp tar partneren tilbake til sin egen partneroversikt
- Siden brukes til a vise kunden rundt og forklare compliance-status

En ny rute `/msp-dashboard/:customerId/portal` viser dette.

## Teknisk plan

### Ny fil: `src/components/msp/AcronisConnectDialog.tsx`
- Dialog med 4 steg (tenant-ID, velg kunde, bekreft, suksess)
- Simulerer API-kall med demo-data (3-5 enheter importert)
- Oppdaterer `msp_customers` via Supabase nar tilkoblingen bekreftes
- Bruker eksisterende Dialog/Input/Button-komponenter

### Ny fil: `src/pages/MSPCustomerPortal.tsx`
- Viser kundens dashbord med et partner-banner overst
- Banner inneholder kundenavn, "Du er i partnermodus", og en tilbake-knapp
- Gjenbruker ComplianceShield, NextActionCards og RiskAndCalendarSection fra Dashboard 2.0
- Henter kundedata fra `msp_customers` basert pa `customerId` parameter

### Endring: `src/pages/MSPCustomerDetail.tsx`
- Legg til en "Ga inn i kundens portal"-knapp i header-kortet (ved siden av compliance-score)
- Erstatt det tomme Acronis-kortet med en "Koble til Acronis"-knapp som apner `AcronisConnectDialog`
- Nar Acronis er tilkoblet, vis knapp for a synkronisere pa nytt

### Endring: `src/App.tsx`
- Legg til route: `/msp-dashboard/:customerId/portal` som rendrer `MSPCustomerPortal`

### Endring: `src/pages/MSPDashboard.tsx`
- Legg til en ny tab "Integrasjoner" i partnerdashbordet med Acronis-status og tilkoblingsguide
- Viser liste over kunder med/uten Acronis-tilkobling

## Brukerflyt: Acronis-tilkobling

```text
Kundedetalj -> Acronis-kort -> "Koble til" -> Dialog apnes
  -> Steg 1: Tast inn tenant-ID (demo: "ACR-12345")
  -> Steg 2: Vis funnet tenant med 4 enheter
  -> Steg 3: Bekreft import
  -> Steg 4: Suksess! "4 enheter importert"
  -> Acronis-kortet viser na "Tilkoblet - 4 enheter beskyttet"
```

## Brukerflyt: Ga inn som kunde

```text
Kundedetalj -> "Ga inn i kundens portal" knapp
  -> Navigerer til /msp-dashboard/:customerId/portal
  -> Viser Dashboard 2.0 med partner-banner
  -> Banner: "[Kundenavn] - Partnermodus | Tilbake til oversikt"
  -> Partneren kan vise kunden rundt og forklare widgets
  -> Klikk "Tilbake" -> Tilbake til kundedetaljvisningen
```

