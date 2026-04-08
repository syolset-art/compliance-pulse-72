

## Forenkling av AI-bruksveiviseren (Transparens + KI-avhengighet)

### Problemet
Testbrukerne sliter med de to siste stegene:
- **Transparens (steg 5)**: Tre separate seksjoner (transparens-dropdown, menneskelig tilsyn-toggle med undernivåer, automatiserte beslutninger-toggle) — brukerne vet ikke hva som er "riktig"
- **KI-avhengighet (steg 6)**: Tre kort med abstrakte konsepter (Omfang, Integrasjon, Kritikalitet) — brukerne forstår ikke hva de skal svare

### Løsning: Erstatt med enkle ja/nei-spørsmål og Lara-forslag

**Steg 5 (Transparens) — forenklet til 3 enkle toggle-spørsmål:**

Fjern dropdown og fritekstfelt. Erstatt med tre konkrete ja/nei-påstander som brukerne bare krysser av:

1. "Brukerne vet at de interagerer med AI" — toggle (ja/nei)
2. "Noen kan overstyre AI-beslutninger" — toggle (ja/nei)  
3. "AI tar beslutninger uten at en person ser over" — toggle (ja/nei)

Hvis risikonivå er "minimal" → vis fortsatt grønt "ingen krav"-kort som i dag. Ellers vises de tre togglene. Ingen fritekstfelt med mindre brukeren aktivt vil utdype (collapsible "Legg til beskrivelse").

**Steg 6 (KI-avhengighet) — forenklet til ett enkelt spørsmål:**

Fjern de tre separate kortene (Omfang, Integrasjon, Kritikalitet). Erstatt med ett enkelt spørsmål:

> "Hva skjer om AI-en slutter å fungere?"

Tre valg med tydelige, hverdagslige beskrivelser:
- **Ingenting spesielt** — "Vi klarer oss fint uten, det tar kanskje litt lenger tid"
- **Det merkes** — "Vi må jobbe annerledes, men får gjort jobben"
- **Stopper opp** — "Prosessen stopper eller kvaliteten blir vesentlig dårligere"

Lara foreslår svar basert på antall funksjoner og risikonivå (som i dag, men enklere presentert). "Estimert berørte" og "konsekvens-fritekst" flyttes inn i en collapsible "Vil du utdype?" seksjon.

### Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/components/process/ProcessAIDialog.tsx` | Erstatt steg 5-innhold (linje 1040-1148) med tre enkle toggles. Erstatt steg 6-innhold (linje 1152-1325) med ett spørsmål + tre valg. Fjern ubrukte state-variabler (`humanOversightLevel`, `transparencyStatus`). Behold lagring mot eksisterende felt. |

### Mapping til eksisterende databasefelt

De forenklede svarene mappes til de samme feltene i `process_ai_usage`:
- Toggle 1 → `transparency_status` ("implemented" / "required")
- Toggle 2 → `human_oversight_required` (true/false)
- Toggle 3 → `automated_decisions` (true/false)
- Hovedspørsmål → `ai_dependency_level` + `ai_integration_level` (utledet)

Ingen databaseendringer nødvendig.

