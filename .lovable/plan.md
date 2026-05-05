## Mål

Når brukeren redigerer kontaktpersoner på Trust Center (`/trust-center/edit` → `CompanyInfoForm`), skal Lara-agenten kunne foreslå og fylle ut feltene automatisk. Lara henter først fra eksisterende kilder (Core / leverandørmodulen / onboarding), og hvis ingen data finnes, foreslår hun navn/e-post basert på selskapets data og brukerens egen profil.

## UX

Tre kontaktblokker får en ny "Spør Lara"-knapp i headeren ved siden av tittelen (kun synlig i `isEditing`):
- **Kontaktperson (Compliance)**
- **Personvern/DPO-kontakt**
- **Sikkerhetskontakt for hendelser (CISO)**

Knappen er liten, sekundær (`Sparkles`-ikon + "Spør Lara"). Ved klikk:

1. Lara analyserer eksisterende data og viser en kompakt forslags-banner rett under blokken med:
   - Kilde-badge: `Hentet fra Leverandørmodulen` / `Hentet fra Core onboarding` / `Foreslått av Lara`
   - Navn + e-post i lese-format
   - To knapper: **Bruk forslag** (fyller inn feltene) og **Avvis**
2. Hvis Lara ikke finner noen data, viser banneren:
   - "Lara fant ingen registrert kontakt. Vil du at jeg foreslår en basert på selskapets profil?" + knapp **Generer forslag** (kaller edge function)

Empty-state hint under feltene (kun når begge er tomme og isEditing): liten lenke "✨ La Lara fylle ut" som trigger samme flyt.

## Datakilder (prioritert rekkefølge)

For hver rolle leter Lara i:

1. **company_profile** — eksisterende `dpo_name/email`, `ciso_name/email`, `compliance_officer/email`
2. **Core onboarding / key personnel** — `KeyPersonnelSection`-data (samme tabell, brukes som fallback hvis felt mangler i edit-form state)
3. **Leverandørmodulen** — for "self"-asset eller relaterte assets: `assets.contact_person/email/phone` (typisk satt for organisasjonen via `ContactPersonField`)
4. **profiles** — innlogget bruker (navn + e-post) som siste fallback for compliance officer
5. **AI-forslag** — hvis ingenting finnes, ny edge function `suggest-key-contacts` kaller Lovable AI (google/gemini-3-flash-preview) med selskapsnavn, bransje, antall ansatte, domene og foreslår plausible plasshold-roller (f.eks. "DPO – ikke utnevnt, kontakt: dpo@<domene>"). Returnerer alltid med `source: "ai_suggestion"` og forklarende tekst.

## Teknisk implementering

### Ny komponent
`src/components/company/LaraContactAssist.tsx`
- Props: `role: "compliance" | "dpo" | "ciso"`, `currentName`, `currentEmail`, `companyProfile`, `onApply(name, email)`, `isNb`
- Intern state: `suggestion | null`, `loading`, `dismissed`
- Funksjon `findSuggestion()`: kjører kildene 1–4 synkront (data allerede i React Query cache via eksisterende queries)
- Funksjon `requestAISuggestion()`: invoke `suggest-key-contacts` edge function
- Renderer en `Card` med kilde-badge, navn/epost, og to CTA-knapper

### Endringer i `src/components/company/CompanyInfoForm.tsx`
- Importer `LaraContactAssist`
- I hver av de tre kontaktblokkene (linje ~362, ~389, ~420), legg til:
  - "Spør Lara"-knapp i blokk-headeren (kun `isEditing`)
  - `<LaraContactAssist>` rett under `grid` med `onApply` som setter form-feltene via `update()`
- Henter også `assets`-data (self-asset finnes allerede i `selfAsset`-query) og innlogget bruker (`useAuth`) for å gi til komponenten

### Ny edge function
`supabase/functions/suggest-key-contacts/index.ts`
- Input: `{ role, companyName, industry, employees, domain }`
- Bruker Lovable AI Gateway (`google/gemini-3-flash-preview`) med structured output (tool calling) for `{ name, email, rationale }`
- Returnerer forslag + kort begrunnelse på norsk
- Standard CORS, ingen auth nødvendig, registreres i `supabase/config.toml` med `verify_jwt = false`

### Tekster (NB primær, EN sekundær)
- "Spør Lara" / "Ask Lara"
- "Hentet fra Leverandørmodulen" / "Found in Vendor module"
- "Hentet fra Core onboarding" / "Found in Core onboarding"
- "Foreslått av Lara" / "Suggested by Lara"
- "Bruk forslag" / "Use suggestion"
- "Avvis" / "Dismiss"
- "Lara fant ingen registrert kontakt — generer forslag basert på selskapsprofilen?" / "Lara found no contact on file — generate one from the company profile?"

## Filer som endres / opprettes

- **NY** `src/components/company/LaraContactAssist.tsx`
- **NY** `supabase/functions/suggest-key-contacts/index.ts`
- **EDIT** `src/components/company/CompanyInfoForm.tsx` (3 blokker + import + bruker-/asset-data prop)
- **EDIT** `supabase/config.toml` (registrer ny function)

Ingen DB-migrasjoner. Ingen nye secrets — `LOVABLE_API_KEY` finnes allerede.
