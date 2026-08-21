# Plan: Automatisk generering av behandlingsaktivitet per system

## Bakgrunn (verifisert i koden)

- Behandlingsaktiviteter lagres i `system_processes` (kun `name`, `description`, `status`, `system_id` — ingen RoPA-felt i dag).
- Oppretting skjer via `AddProcessDialog.tsx` (manuell eller AI-forslag via edge function `suggest-processes`), listes i `ProcessingActivitiesTab.tsx`, vises i `ProcessProfile.tsx` / `ProcessCard.tsx`.
- Virksomhetsdata finnes i `company_profile`: `legal_name`, `name`, `org_number`, `industry`, `brreg_industry`, `country` → behandlingsansvarlig hentes alltid herfra.
- AI-mønsteret finnes allerede: `LaraDraftCard` + `laraTouched`-flagg i `AddSystemDialog.tsx`, `LaraFieldSuggestion.tsx` (forslagsboks med «Godkjenn» / «Bekreftet av …»), og «Forslag fra Lara Soft» i `ProcessList.tsx` / `ProcessSuggestionsDialog.tsx`.
- Edge functions bruker `google/gemini-3-flash-preview` via AI-gateway med tool-calling og `logAiUsage`.

## Målbilde

```text
System legges til arbeidsområde
  └─> [Ny] Steg: Formål + datatype (AI-foreslått, bekreftes av menneske)
        └─> Utkast til behandlingsaktivitet genereres automatisk
              └─> Bekreft/rediger → lagres med proveniens per felt
```

## 1. Database (én migrasjon)

Utvid `system_processes` (eksisterende tabell — kun `ALTER TABLE`, ingen nye GRANTs nødvendig):

- `purpose` text — formål med behandlingen
- `data_class` text — `none` | `ordinary` | `sensitive`
- `special_categories` text[] — GDPR art. 9/10-kategorier (kun når `sensitive`)
- `legal_basis` text — foreslått/valgt behandlingsgrunnlag
- `controller_name` text — alltid `company_profile.legal_name ?? name`
- `ai_suggested_fields` jsonb — hvilke felt som er AI-forslag og ikke bekreftet, f.eks. `{"purpose": true, "legal_basis": true}`
- `confirmed_by` / `confirmed_at` — hvem bekreftet utkastet
- `status` brukes: `draft` (autogenerert) → `active` (bekreftet)

## 2. Ny AI-tjeneste

**Ny edge function: `supabase/functions/suggest-processing-activity/index.ts`**
- Input: `system_id`, `work_area_id`, `language`
- Henter system (navn, kategori, leverandør, beskrivelse), arbeidsområde og `company_profile` (bransje, land)
- Returnerer via tool-calling: `purpose`, `purpose_reason`, `legal_basis` (forslag, f.eks. «berettiget interesse, art. 6(1)(f)»), `legal_basis_reason`, `suggested_data_class`, `description`
- Følger samme mønster som `suggest-processes` (samme modell, `logAiUsage`, 402/429-håndtering)

## 3. Ny veiviser-komponent

**Ny fil: `src/components/dialogs/ProcessingActivityWizardDialog.tsx`** — 3 steg:

1. **Formål**: AI-forslag vises i `LaraFieldSuggestion`-boks («Forslag fra Lara: …» + begrunnelse + Godkjenn-knapp). Bruker kan godkjenne eller skrive eget. 
2. **Datatype**: tre radiokort — «Ingen personopplysninger» / «Ordinære personopplysninger» / «Sensitive personopplysninger». Velges «Sensitive» vises sjekkbokser for art. 9-kategorier (helse, rase/etnisitet, politisk oppfatning, religion, fagforening, genetikk, biometri, seksualitet) + art. 10 (straffedommer). AI-foreslått datatype er forhåndsvalgt men tydelig merket som forslag.
3. **Gjennomgang av utkast**: forhåndsutfylt skjema med alle RoPA-felt:
   - **Behandlingsansvarlig**: låst, skrivebeskyttet felt som alltid viser `company_profile.legal_name` (juridisk person) — aldri et ansattnavn. Tooltip: «Behandlingsansvarlig er alltid virksomheten som juridisk person» (juridisk krav fra Vilde). Valgmuligheten er kun hvilket juridisk navn fra org-profilen, ikke fri tekst.
   - Formål, behandlingsgrunnlag, datatype med lilla «Forslag fra Lara — ikke bekreftet»-merking per felt, hver med Godkjenn/endre. Ingen AI-felt lagres som bekreftet automatisk.
   - «Lagre utkast» / «Bekreft og opprett».

## 4. Integrasjon i flyten

- **`AddSystemDialog.tsx`**: etter vellykket lagring (`onSystemAdded`) — når systemet har `work_area_id` — åpnes veiviseren automatisk som valgfritt neste steg («Opprett behandlingsaktivitet for [system]?» med Hopp over / Start).
- **`ProcessingActivitiesTab.tsx`**: «Legg til behandlingsaktivitet» åpner den nye veiviseren i stedet for dagens enkle dialog (dagens manuelle modus beholdes som steg i veiviseren). Liste viser ny status-pille: «Utkast – venter bekreftelse» (amber) for autogenererte.
- **`ProcessCard.tsx` / `ProcessProfile.tsx`**: ny seksjon «Behandlingsaktivitet (RoPA)» som viser formål, datatype, behandlingsgrunnlag, behandlingsansvarlig med redigering + samme Lara-merking for uferdige felt.

## 5. Visuell merking av AI-felt

- Gjenbruker `LaraFieldSuggestion.tsx` (eksisterer allerede): forslag → lilla boks med Lara-ikon + «Godkjenn»; bekreftet → «Bekreftet av [navn], [dato]».
- `ai_suggested_fields` styrer hvilke felt som viser merking; ved manuell endring fjernes feltet fra listen (manuelt overstyrt = bekreftet).
- ROPA-widgetene (`ROPAStatusWidget`, `ROPAGapWidget`) får «Utkast» medtatt i tellingene.

## 6. Språk og demo

- Alle tekster som i18n-nøkler i `nb.json` / `en.json` (prosjektstandard).
- Demo: seed én autogenerert aktivitet-utkast (f.eks. AWS S3) med «Venter bekreftelse»-status.

## Berørte filer

| Fil | Endring |
|---|---|
| Supabase-migrasjon | Utvid `system_processes` med RoPA-felt |
| `supabase/functions/suggest-processing-activity/index.ts` | Ny AI-tjeneste |
| `src/components/dialogs/ProcessingActivityWizardDialog.tsx` | Ny 3-stegs veiviser |
| `src/components/dialogs/AddSystemDialog.tsx` | Trigger veiviser etter lagring |
| `src/components/work-areas/ProcessingActivitiesTab.tsx` | Ny opprett-flyt + utkast-status |
| `src/components/process/ProcessCard.tsx` | RoPA-seksjon med merking |
| `src/lib/` (ny helper) | Kategorikonstanter for art. 9/10 + behandlingsgrunnlag-liste |
| `src/locales/nb.json` / `en.json` | Oversettelser |
| `src/integrations/supabase/types.ts` | Regenereres automatisk |

## Avgrensninger

- Behandlingsansvarlig-feltet kan ALDRI fylles med personnavn — kun juridisk navn fra `company_profile`.
- Ingen felt bekreftes automatisk; `legal_basis` krever alltid eksplisitt menneskelig bekreftelse.
- Eksisterende `AddProcessDialog` erstattes av veiviseren i arbeidsområde-konteksten.
