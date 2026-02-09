

# Plan: ISO Readiness som kjopbar tjeneste

## Problemstilling

ISO Readiness-visningen viser i dag alle tre domener (Personvern, Informasjonssikkerhet, AI Governance) som om de er inkludert for alle kunder. Men abonnementsmodellen krever at kunden aktiverer og betaler for hvert kontrollomrade. Det er ingen kobling mellom `useSubscription().isDomainIncluded()` og ISO Readiness.

## Forretningslogikk

### Hva bor vaere standard (gratis)?

| Domene | Begrunnelse | Tilgang |
|--------|-------------|---------|
| **Personvern** (GDPR) | Lovpalagt for alle norske virksomheter | Alltid inkludert i Starter |
| **Informasjonssikkerhet** (ISO 27001) | Viktigst for de fleste virksomheter, men frivillig | Inkludert i Professional, tillegg for Starter (+990 kr/mnd) |
| **AI Governance** (ISO 42001) | Relevant kun for virksomheter som bruker/utvikler AI | Inkludert i Professional, tillegg for Starter (+790 kr/mnd) |

### Anbefalingslogikk basert pa bransje

- **SaaS / IT / Tech**: ISO 27001 anbefales sterkt, AI Governance anbefales hvis AI brukes
- **Finans / Bank**: ISO 27001 obligatorisk i praksis, AI Governance anbefales
- **Helse**: ISO 27001 + Personvern kritisk, AI Governance kun hvis AI-systemer
- **Offentlig sektor**: NSM-grunnprinsipper + Personvern, ISO 27001 anbefalt
- **Generelt/Sma bedrifter**: Personvern er nok til a starte. ISO 27001 nar kundene krever det

### Sertifiseringsmal - la kunden velge

Kunden bor kunne oppgi sitt **sertifiseringsmal**:
1. "Jeg onsker a sertifiseres i ISO 27001" - aktiver Informasjonssikkerhet
2. "Jeg onsker a sertifiseres i ISO 27701" - aktiver Personvern + Informasjonssikkerhet (27701 er utvidelse av 27001)
3. "Jeg onsker a sertifiseres i ISO 42001" - aktiver AI Governance
4. "Jeg vet ikke enna" - vis anbefalinger basert pa bransje
5. "Bare GDPR-samsvar" - Personvern (gratis)

---

## Tekniske endringer

### 1. Oppdater ISOReadinessView med abonnementsstyring

Hent domenestatus fra `useSubscription` og vis:
- **Aktive domener**: Viser full readiness-visning som i dag
- **Ikke-aktiverte domener**: Viser et "last"-kort med pris og aktiveringsknapp
- Bruker eksisterende `DomainActivationWizard` for kjopsflyten

### 2. Legg til sertifiseringsmal-velger

Ny komponent `CertificationGoalSelector` som vises forste gang bruker apner ISO Readiness:
- "Hva er malet ditt?" med forhands-valg
- Anbefaler riktig domene-kombinasjon basert pa svar
- Lagrer valg i `company_profile.certification_goals` (ny kolonne)

### 3. Oppdater DomainSummaryCard med lase-tilstand

For domener som ikke er aktivert:
- Vis et grayed-out kort med lasikon
- Vis pris ("Fra 790 kr/mnd")
- "Aktiver"-knapp som apner `DomainActivationWizard`

### 4. Smart anbefaling i header

Basert pa virksomhetsprofil, vis en anbefaling:
- "Anbefalt for IT-konsulenter: Start med Personvern, legg til Informasjonssikkerhet nar kundene krever det"

---

## Visuell endring

```text
 Domenekort for IKKE-aktivert domene:

 +----------------------------------+
 | [laaas] AI Governance            |
 | ISO 42001 + EU AI Act            |
 |                                  |
 | Ikke aktivert                    |
 | Fra 790 kr/mnd                   |
 |                                  |
 | [Aktiver]  [Les mer]             |
 +----------------------------------+

 Anbefaling-banner:

 +--------------------------------------------------+
 | [lyspeare] Anbefalt for HULT IT AS               |
 | Som IT-konsulentselskap anbefaler vi:             |
 | 1. Personvern (GDPR) - inkludert                 |
 | 2. Informasjonssikkerhet (ISO 27001) - inkludert |
 | 3. AI Governance - aktiver naar dere bruker AI    |
 +--------------------------------------------------+
```

---

## Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/tasks/ISOReadinessView.tsx` | Legge til subscription-sjekk per domene, vise last/aktiverings-UI for ikke-kjopte domener |
| `src/components/iso-readiness/LockedDomainCard.tsx` | **Ny** - Kort for ikke-aktiverte domener med pris og CTA |
| `src/components/iso-readiness/CertificationGoalBanner.tsx` | **Ny** - Anbefalingsbanner basert pa bransje |
| `src/locales/nb.json` | Nye oversettelser for last-tilstand og anbefalinger |
| `src/locales/en.json` | Tilsvarende engelske oversettelser |

### Ingen databaseendringer nodvendig

Eksisterende tabeller dekker behovet:
- `company_subscriptions` + `domain_addons` for abonnementsstatus
- `company_profile.industry` for bransjeanbefalinger
- `useSubscription().isDomainIncluded()` for tilgangssjekk

