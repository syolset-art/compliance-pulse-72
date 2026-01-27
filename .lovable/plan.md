
# Plan: Legg til nettverksdomene i onboarding

## Oversikt
Legge til et felt for nettverksdomene (f.eks. "hult-it.no") i onboardingen slik at Mynder kan hente:
- Domeneskår (nettsidens sikkerhet/kvalitet)
- E-postsikkerhet (SPF, DKIM, DMARC - hvem som har lov å sende e-post)
- SSL/TLS-status
- Andre DNS-baserte sikkerhetsanalyser

## Database-endring

Legge til ny kolonne i `company_profile`:

```sql
ALTER TABLE company_profile 
ADD COLUMN domain TEXT;
```

## UI-endringer

### 1. CompactCompanyOnboarding.tsx (Hovedendring)
Etter at selskapet er bekreftet fra Brønnøysund, vise et nytt felt for domene:

**Før "Bekreft"-knappen legges det til:**
- Input-felt for domene med placeholder "f.eks. hult-it.no"
- Hjelpetekst som forklarer hva dette brukes til
- Validering at domene har riktig format

**Ny flyt:**
1. Søk opp selskap (eksisterende)
2. Velg selskap fra liste (eksisterende)
3. **NYTT: Oppgi domene** (valgfritt felt)
4. Bekreft (eksisterende)

### 2. Visuell design
Etter selskapsinformasjon vises et nytt kort/seksjon:

```text
┌─────────────────────────────────────────┐
│ 🌐 Nettverksdomene (valgfritt)          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ hult-it.no                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️ Vi bruker domenet til å analysere    │
│    e-postsikkerhet og nettsidens        │
│    sikkerhetsstatus.                    │
└─────────────────────────────────────────┘
```

### 3. Validering
- Sjekk at domenet har et gyldig format (regex)
- Fjerne eventuelle "https://" eller "www." prefiks automatisk
- Feltet er valgfritt - brukeren kan hoppe over

## Tekniske detaljer

### Domene-validering (regex)
```typescript
const validateDomain = (domain: string): boolean => {
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return pattern.test(domain);
};

const cleanDomain = (input: string): string => {
  return input
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim()
    .toLowerCase();
};
```

### Endringer i formData
```typescript
const [formData, setFormData] = useState({
  name: "",
  orgNumber: "",
  industry: "",
  employees: "",
  kommune: "",
  domain: ""  // NYTT
});
```

### Lagring til database
```typescript
const { error } = await supabase
  .from("company_profile")
  .insert({
    name: formData.name,
    org_number: formData.orgNumber || null,
    industry: formData.industry,
    employees: formData.employees || null,
    domain: formData.domain || null  // NYTT
  });
```

## Filer som endres

| Fil | Endring |
|-----|---------|
| Database migration | Legge til `domain` kolonne |
| `src/components/onboarding/CompactCompanyOnboarding.tsx` | Legge til domene-input og validering |
| `src/components/onboarding/CompanyOnboarding.tsx` | Legge til domene-input i steg 1 |

## Fremtidig funksjonalitet (ikke del av denne implementasjonen)
Etter at domenet er lagret, kan det brukes til:
- Edge function som sjekker DNS-records (SPF, DKIM, DMARC)
- SSL/TLS-analyse
- Website score via tredjepartstjenester
- Automatisk oppdagelse av e-postsystemer
