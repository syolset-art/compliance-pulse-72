

## Plan: Forenkle expanded-visningen i sikkerhetstjenester (Less is More)

### Problem
Når en bruker utvider et sikkerhetstjeneste-kort (f.eks. "Backup & Restore"), vises alt innhold samtidig: Acronis-moduler, MSP-anbefaling, ISO-kontroller, andre produkter, implementeringssteg, og CTA. Dette skaper visuell støy.

### Løsning
Omstrukturere expanded-visningen til et **to-nivå hierarki**: Vis kun det viktigste (tilgjengelige løsninger med aktiveringsknapper) som standard. Alt annet pakkes inn i en diskret "Vis detaljer"-collapsible.

### Endringer i `SecurityServicesSection.tsx`

**Ny expanded-layout for `ServiceDetailCard`:**

1. **Alltid synlig** (nivå 1 — det brukeren trenger for å handle):
   - Acronis-moduler med aktiveringsknapper (komprimert: kun navn + status/knapp, skjul description by default)
   - Andre anbefalte løsninger med aktiveringsknapper (komprimert)
   - CTA-knapp for missing/unknown

2. **Skjult bak "Vis detaljer"** (nivå 2 — for de som vil lære mer):
   - MSP-anbefaling
   - ISO 27001-kontroller
   - Implementeringssteg

**Forenkling av kortene:**
- `AcronisModuleCard`: Skjul `description` og `priceIndicator`-badge. Vis kun navn + pakke + status/knapp på én linje.
- `MSPProductCard`: Skjul `description`. Vis kun navn + leverandør + status/knapp.

### Fil som endres

| Fil | Endring |
|---|---|
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Forenkle expanded-innhold, legg sekundær info i collapsible |

