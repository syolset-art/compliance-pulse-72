

## Plan: LLM-bruk på enheter + Acronis DLP for AI-tjeneste

### Del 1: Vis LLM-bruk i enhetens Trust Profile

Legge til en ny seksjon i `DeviceComplianceTab` som viser hvilke språkmodeller/AI-tjenester enheten har tilgang til. Dataene lagres i enhetens `metadata.llm_usage`-felt.

**Struktur for `metadata.llm_usage`:**
```json
[
  { "name": "ChatGPT", "provider": "OpenAI", "accessLevel": "unrestricted", "sensitiveDataRisk": "high" },
  { "name": "Copilot", "provider": "Microsoft", "accessLevel": "managed", "sensitiveDataRisk": "medium" }
]
```

**UI i DeviceComplianceTab:** Ny seksjon "Språkmodeller i bruk" med kort per LLM som viser navn, leverandør, tilgangsnivå og risikovurdering for sensitiv data. Fargekoding: rød (ubegrenset), gul (delvis styrt), grønn (administrert via DLP).

### Del 2: Oppdater demo-enheter med LLM-data

Legge til `llm_usage` i metadata for relevante demo-enheter:
- DESK-FIN-01: Copilot (managed)
- LAPTOP-DEV-03: ChatGPT (unrestricted), GitHub Copilot (managed)
- LAPTOP-SALG-04: ChatGPT (unrestricted), Gemini (unrestricted)
- MOB-CEO-01: ChatGPT (unrestricted)

### Del 3: Ny sikkerhetstjeneste — "AI/LLM-sikkerhet" i katalogen

Legge til en ny kategori i `SECURITY_SERVICE_CATALOG`:

| Felt | Verdi |
|------|-------|
| id | `llm-security` |
| name | AI / LLM-sikkerhet |
| description | Kontroll og beskyttelse mot deling av sensitiv informasjon via språkmodeller |
| linkedControls | A.8.11 (Data masking), A.8.12 (DLP), A.5.34 (Privacy) |
| acronisModules | **Advanced DLP for AI** — forhindrer sensitiv data fra å sendes til LLM-tjenester |

Tjenesten lar brukeren:
1. Lese hva tjenesten innebærer (beskyttelse mot datalekkasje via LLM)
2. Aktivere sikkerhetsnivå (blokkér, advar, logg) som påvirker enhetene
3. Se hvilke enheter som bruker LLM uten beskyttelse

### Del 4: Nytt ISO-kontrollpunkt i DeviceComplianceTab

Legge til kontrollpunkt "LLM-tilgang sikret" (A.8.11/A.8.12) som sjekker om enheter med LLM-bruk har `accessLevel !== "unrestricted"`.

### Filer

| Fil | Endring |
|-----|---------|
| `src/lib/demoDeviceProfiles.ts` | Legg til `llm_usage` i metadata for 4 enheter |
| `src/lib/securityServiceCatalog.ts` | Ny kategori `llm-security` med Acronis DLP-modul |
| `src/components/devices/DeviceComplianceTab.tsx` | Ny seksjon "Språkmodeller i bruk" + nytt kontrollpunkt |

