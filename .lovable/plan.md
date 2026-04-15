

# Plan: Fjern demo-knapper og legg til "Legg til virksomhet"-agent

## Oversikt

Fjerne "Sett opp Framdrift-demo" og "Slett Framdrift-demo" fra virksomhetsmenyen. Erstatte med en "Legg til virksomhet"-knapp som åpner en agent-dialog. Agenten spør om den nye virksomheten skal kobles som partnerkunde eller som datterselskap/annet selskap.

## Endringer

### 1. Ny komponent: `AddOrganizationDialog.tsx`
En dialog/drawer med en steg-for-steg agent-flyt:
- **Steg 1**: Spør om virksomhetsnavn og org.nummer (med Brreg-oppslag)
- **Steg 2**: Spør "Er du partner/rådgiver for denne virksomheten?" (Ja/Nei)
  - **Ja** -> Virksomheten opprettes og legges til som kunde i MSP-dashbordet (`msp_customers`)
  - **Nei** -> Virksomheten opprettes som datterselskap/tilknyttet organisasjon (ny `company_profile`-rad)
- **Steg 3**: Bekreftelse med oppsummering

Agenten bruker en chat-lignende UX (Lara-stil) for å guide brukeren.

### 2. Oppdater `src/components/Sidebar.tsx`
- Fjern linje 621-651 (begge demo-knappene og separatoren)
- Fjern import av `seedDemoTrustProfile` og `deleteDemoTrustProfile`
- Legg til en "Legg til virksomhet"-knapp som åpner `AddOrganizationDialog`
- Plasser knappen over Partner-seksjonen

### 3. Database
- Ingen nye tabeller nødvendig. Bruker eksisterende `company_profile` for organisasjoner og `msp_customers` for partnerkunder.

### 4. Virksomhetsvelger (fremtidig)
Planen legger grunnlaget for en virksomhetsvelger i sidebaren der brukeren kan bytte mellom organisasjoner de administrerer. Selve velgeren implementeres ikke nå, men strukturen støtter det.

## Filer

| Fil | Endring |
|---|---|
| `src/components/sidebar/AddOrganizationDialog.tsx` | Ny: Agent-dialog for å legge til virksomhet |
| `src/components/Sidebar.tsx` | Fjern demo-knapper, legg til "Legg til virksomhet"-knapp |

