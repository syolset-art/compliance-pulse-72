

## Plan: Legg til virksomhets-undermeny under firmanavnet

### Problem
Når brukeren klikker på firmanavnet nederst i sidebaren, vises kun «Partner»-undermenyen og «Logg ut». Det mangler virksomhetsrelaterte menyvalg som organisasjon, tilgang, varsler og abonnement.

### Løsning
Legge til virksomhetslenker i company-undermenyen, mellom firmanavnet og Partner-seksjonen.

### Endringer i `src/components/Sidebar.tsx`

**Legg til disse menyene inne i `companyOpen`-blokken, før Partner-undermenyen:**

```text
┌─ Virksomhetsnavn ─────────────────────┐
│  📋 Organisasjon        /admin/organisation  │
│  👥 Tilgangsstyring     /admin/access        │
│  🔔 Varsler             /admin/notifications │
│  💳 Abonnement          /subscriptions       │
│  ──────────────────────────────────────│
│  🏢 Partner  ▾                         │
│     Kunder / Lisenser / Faktura / ...  │
│  ──────────────────────────────────────│
│  🚪 Logg ut                            │
└────────────────────────────────────────┘
```

- Gjenbruker `settingsMenu`-arrayet som allerede finnes (linje 76-81)
- Rendrer dem som klikkbare navigasjonsknapper med aktiv-state
- Legger en `border-t` separator mellom virksomhetsmeny og Partner
- Vurderer å fjerne den separate «Innstillinger»-seksjonen høyere opp for å unngå duplisering (alternativt beholde begge)

### Tekniske detaljer
- Kun endringer i `Sidebar.tsx`
- Gjenbruker eksisterende `settingsMenu`-array og navigasjonslogikk
- Samme styling-mønster som Partner-undermenyens items

