

# Plan: Oppdater kompakt dashboard — fjern oppmerksomhet/Lara, legg til partnerwidgets

## Hva endres

I `DashboardCompact.tsx`:

1. **Fjern** `AttentionSection` (Sone 3 — "Krever din oppmerksomhet")
2. **Fjern** `AIAgentLog` (Sone 4a — "Lara AI-agent")
3. **Erstatt med to nye seksjoner:**

### Ny widget 1: Kundeoversikt (Partner)
- Kompakt kort som viser: antall kunder, gjennomsnittlig compliance-score, antall under onboarding, antall med lav score (<50%)
- Henter data fra `msp_customers`-tabellen
- Klikk navigerer til `/msp-dashboard`
- Visuelt: Ikon + tall + label i et 2x2 mini-grid innenfor ett kort

### Ny widget 2: Siste kundeaktivitet (Partner)
- Viser de siste 3-4 kundene som ble registrert eller oppdatert
- Henter fra `msp_customers` sortert etter `created_at`
- Viser kundenavn, status-badge (onboarding/aktiv) og compliance-score
- Klikk navigerer til `/msp-dashboard`

## Layout etter endring

```text
KPI-rad (Samsvar, Risiko, Kontroller)
Kontrollområder (bar chart)
[Kundeoversikt]  [Siste kunder]    ← erstatter attention + Lara
[Frister]                           ← beholdes
```

## Teknisk

- **Fil som endres:** `src/components/dashboard/DashboardCompact.tsx`
- Fjerner `AttentionSection` og `AIAgentLog` funksjonene
- Legger til `PartnerCustomerOverview` og `RecentCustomersPanel` som nye interne funksjoner
- Begge henter fra `supabase.from("msp_customers")` med `useQuery`
- Frister-panelet beholdes og flyttes til full bredde under de to nye widgetene

