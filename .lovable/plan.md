

## Plan: MSP-partnervelger på overordnet nivå med mulighet for unntak per tjeneste

### Konsept
En **partnervelger øverst** i Sikkerhetstjenester-seksjonen der kunden velger sin standard MSP-partner. Denne gjelder alle tjenester, men per tjeneste kan kunden **overstyre** med en annen partner (f.eks. 7 Security for MDR, en annen for Backup).

### Endringer

#### 1. `src/lib/securityServiceCatalog.ts`
- Legg til en ny konstant `MSP_PARTNER_DIRECTORY`: en liste over tilgjengelige MSP-partnere med `id`, `name`, `description`, `website`, `contactEmail`, og `specialties: string[]` (f.eks. `["mdr", "soc"]`)
- Inkluder 7 Security og 2–3 demo-partnere (f.eks. "Atea Security", "Crayon Cyber")
- Fjern `mspPartner` fra den enkelte `SecurityServiceCategory` — erstattes av den nye modellen

#### 2. `src/components/asset-profile/tabs/SecurityServicesSection.tsx`
- **Ny state**: `selectedPartnerId: string | null` (overordnet partner) og `servicePartnerOverrides: Record<string, string>` (unntak per tjeneste-ID)
- **Overordnet partnervelger** i summary-kortet: en kompakt Select-komponent med partnernavn. Viser kort beskrivelse av valgt partner under.
- **Per tjeneste (unntak)**: I expanded-visningen, en diskret lenke "Bruk annen partner for denne tjenesten" som åpner en liten Select. Viser kun hvis overordnet partner er valgt. Partnere med matching `specialties` markeres som "Anbefalt".
- Partnerbanneret i expanded-visningen viser den **effektive partneren** (overstyrte > overordnet) i stedet for hardkodet `service.mspPartner`.
- CTA-knappen "Kontakt MSP-partner" viser partnerens navn.

### Filer

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Legg til `MSP_PARTNER_DIRECTORY`, fjern `mspPartner` fra kategorier |
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Partnervelger i summary-kort, unntak per tjeneste, dynamisk partnerbanner |

