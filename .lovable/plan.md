

# Legg til "Geografisk scope" og "Risikoprofil" i onboarding

## Oversikt
Legger til to nye sporsmal i onboardingen, etter "Size & Maturity"-steget og for "Key Persons"-steget. Begge onboarding-komponentene (full og kompakt) oppdateres, og to nye kolonner legges til i `company_profile`-tabellen.

## Databaseendringer

Ny migrasjon som legger til:
- `geographic_scope TEXT` (nullable) - verdier: `"eos_only"` eller `"outside_eos"`
- `sensitive_data TEXT` (nullable) - verdier: `"yes"`, `"no"`, `"unsure"`

## UI-endringer

### CompanyOnboarding.tsx (fullversjon)

**Ny steg-type:** Utvid `Step`-typen med `"risk-profile"` etter `"size"`:
```
"company" → "industry" → "size" → "risk-profile" → "key-persons" → "use-cases" → "team-size" → "complete"
```

**Nytt steg "risk-profile"** viser to sporsmalsgrupper i ett steg:

1. **Geografisk scope** - RadioGroup med to valg:
   - "Kun Norge/EOS" 
   - "Ogsa utenfor EU/EOS"

2. **Risikoprofil** - RadioGroup med fire valg:
   - "Ja"
   - "Nei"
   - "Vet ikke"
   - "Usikker"

**Oppdater navigasjon:**
- `handleNext`: `size` → `risk-profile`, `risk-profile` → `key-persons`
- `handleBack`: `risk-profile` → `size`, `key-persons` → `risk-profile`
- `getStepNumber`: Totalt 7 steg (opp fra 6)
- Progressbar oppdateres til 7 steg

**Oppdater formData og handleSubmit:**
- Legg til `geographic_scope` og `sensitive_data` i formData-state
- Inkluder disse i upsert-kallet til `company_profile`

### CompactCompanyOnboarding.tsx (kompaktversjon)

Legg til de to sporsmalene som en ny seksjon mellom bedriftsdetaljer og nøkkelpersoner, med samme RadioGroup-baserte UI men i kompakt stil.

**Oppdater formData og handleSubmit** tilsvarende.

### EditCompanyProfileDialog.tsx

Legg til de to nye feltene i redigeringsdialogen slik at de kan endres i etterkant.

## Filer som endres
- Database: Ny migrasjon (2 kolonner)
- `src/components/onboarding/CompanyOnboarding.tsx` - Nytt steg, oppdatert navigasjon
- `src/components/onboarding/CompactCompanyOnboarding.tsx` - Nye felt i kompaktvisning
- `src/components/dialogs/EditCompanyProfileDialog.tsx` - Nye felt i redigeringsdialog

