

# Plan: Koble virksomhet til innstillinger visuelt

## Problem
Abonnements- og innstillingssiden viser ingen referanse til hvilken virksomhet innstillingene gjelder for. Brukeren bytter virksomhet i sidebaren, men det er ingen visuell kobling mellom valgt virksomhet og innstillingene som vises.

## Løsning
Legge til en tydelig **virksomhets-kontekst-header** øverst på Subscriptions-siden (og andre innstillingssider) som viser hvilken virksomhet innstillingene gjelder for.

### 1. Ny komponent: `OrganizationContextBanner`
En liten, gjenbrukbar banner-komponent som viser:
- Virksomhetens navn (fra `useActiveOrganization`)
- Org.nummer
- En subtil Building2-ikon
- Lenke/knapp for å bytte virksomhet (åpner sidebar-switcher eller navigerer)

Visuelt: en kompakt stripe under overskriften med virksomhetsinfo, lignende "Du administrerer: **Selskap AS** (org. 123 456 789)"

### 2. Oppdater `src/pages/Subscriptions.tsx`
- Importere `useActiveOrganization`
- Legge til `OrganizationContextBanner` rett under h1-overskriften
- Oppdater underteksten til å inkludere virksomhetsnavnet: "Innstillinger for **{orgName}**"

### 3. Oppdater `src/pages/AdminOrganisation.tsx`
- Samme banner øverst for konsistens

## Filer

| Fil | Endring |
|---|---|
| `src/components/OrganizationContextBanner.tsx` | **Ny** — gjenbrukbar kontekst-banner |
| `src/pages/Subscriptions.tsx` | Legg til banner under overskrift |
| `src/pages/AdminOrganisation.tsx` | Legg til banner under overskrift |

