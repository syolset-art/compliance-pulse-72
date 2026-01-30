
# Plan: 7 Security AI Agent-integrasjon for Acronis

## Forståelse av integrasjonsmodellen

```text
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Mynder        │  ←───→  │   7 Security    │  ←───→  │   Acronis       │
│   (Lara AI)     │   AI    │   (AI Agent)    │   API   │   (Data)        │
│                 │  Agent  │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         ↑
         │
┌─────────────────┐
│   Bruker        │
│  (oppgir        │
│   kunde-ID)     │
└─────────────────┘
```

**Nøkkelpunkter:**
- Mynders AI-agent (Lara) kommuniserer med 7 Securitys AI-agent
- Ingen API-nøkkel trengs fra sluttbruker - bare kunde-ID
- 7 Security fungerer som "mellomledd" som har tilgang til Acronis-data
- Støtter både eksisterende 7 Security-kunder og nye som får tilgang via Mynder

## Ny flyt for bruker (uten API-nøkkel)

```text
Velg "Automatisk import"
         │
         ▼
Velg integrasjon: "Acronis via 7 Security"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  🛡️ Koble til Acronis                                       │
│                                                              │
│  Mynder henter data fra Acronis via 7 Security.             │
│  Du trenger bare å oppgi din kunde-ID.                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Er du allerede kunde hos 7 Security?                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [ Ja, jeg har kunde-ID ]     →  Oppgi kunde-ID            │
│                                                              │
│  [ Nei, dette er nytt ]       →  Opprett tilgang via Mynder │
│                                                              │
│  [ Utforsk med demo-data ]    →  Se eksempeldata            │
└─────────────────────────────────────────────────────────────┘

         │ (Eksisterende kunde)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Oppgi din kunde-ID hos 7 Security                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 7SEC-KUNDE-12345                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  💡 Finner du ikke kunde-ID? Kontakt 7 Security             │
│                                                              │
│  [ Verifiser og hent data ]                                  │
└─────────────────────────────────────────────────────────────┘

         │ (Ny kunde)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Opprett tilgang via Mynder                                  │
│                                                              │
│  Som Mynder-kunde får du tilgang til 7 Securitys             │
│  datahenting fra Acronis uten ekstra kostnad.                │
│                                                              │
│  Vi trenger noen opplysninger:                               │
│                                                              │
│  Organisasjonsnummer: [             ]                        │
│  Kontaktperson:       [             ]                        │
│  E-post:              [             ]                        │
│                                                              │
│  [ Be om tilgang ]                                           │
│                                                              │
│  ⏱️ Vanligvis aktivert innen 24 timer                       │
└─────────────────────────────────────────────────────────────┘
```

## Teknisk arkitektur

### Ny Edge Function: `fetch-7security-data`

Kommuniserer med 7 Securitys AI-agent for å hente Acronis-data:

| Handling | Beskrivelse |
|----------|-------------|
| `verify_customer` | Sjekker om kunde-ID er gyldig hos 7 Security |
| `request_access` | Oppretter ny kundeforespørsel |
| `fetch_acronis_assets` | Henter Acronis-enheter via 7 Security |
| `get_sync_status` | Sjekker status på datahenting |

### Database-endringer

Ny tabell `integration_providers` for å skille mellom direkte API og agent-baserte integrasjoner:

```text
integration_providers
├── id
├── name (Acronis, Entra, osv.)
├── access_type (direct_api | agent_partner)
├── partner_name (7 Security, null for direkte)
├── auth_type (api_key | customer_id | oauth)
└── is_active
```

Oppdatere `integration_connections`:

```text
integration_connections (oppdatert)
├── partner_customer_id (kunde-ID hos 7 Security)
├── access_requested_at (når tilgang ble forespurt)
├── access_granted_at (når tilgang ble gitt)
└── partner_provider_id → integration_providers
```

### Oppdatert flyt i AddAssetDialog

**Steg-rekkefølge:**

```text
1. select-approach → Velg "Automatisk import"
2. connect → Velg integrasjon (Acronis vises som "Acronis via 7 Security")
3. connect-select-types → Velg hvilke eiendelstyper
4. connect-customer-type → "Er du 7 Security-kunde?" (NYTT)
5a. connect-customer-id → Oppgi kunde-ID (eksisterende kunde)
5b. connect-request-access → Be om tilgang (ny kunde)
6. connect-fetching → Henter data fra 7 Security
7. connect-preview → Forhåndsvis eiendeler
8. connect-importing → Importerer
9. connect-complete → Ferdig
```

### AI Agent-kommunikasjon

Lara (Mynders AI) → 7 Security AI:

```text
Request:
{
  "action": "fetch_assets",
  "customer_id": "7SEC-KUNDE-12345",
  "mynder_workspace_id": "uuid",
  "asset_types": ["servers", "workstations"],
  "source": "acronis"
}

Response:
{
  "success": true,
  "assets": [...],
  "sync_token": "abc123",
  "next_sync_available": "2026-01-30T10:00:00Z"
}
```

## Filer som endres/opprettes

| Fil | Status | Beskrivelse |
|-----|--------|-------------|
| `supabase/functions/fetch-7security-data/index.ts` | Ny | Edge function for 7 Security-kommunikasjon |
| `supabase/migrations/...` | Ny | Database-endringer for integration_providers |
| `src/components/dialogs/AddAssetDialog.tsx` | Oppdateres | Ny flyt med kunde-ID i stedet for API-nøkkel |
| `src/components/integration/CustomerIdStep.tsx` | Ny | Komponent for å oppgi kunde-ID |
| `src/components/integration/RequestAccessStep.tsx` | Ny | Komponent for å be om tilgang |
| `src/hooks/use7SecurityIntegration.ts` | Ny | Hook for 7 Security-operasjoner |
| `supabase/functions/chat/index.ts` | Oppdateres | Legge til `connect_7security` verktøy for Lara |

## Implementeringsfaser

### Fase 1: Database og Backend
- Opprette `integration_providers` tabell
- Opprette `fetch-7security-data` edge function (med mock-data først)
- Oppdatere `integration_connections` med nye kolonner

### Fase 2: UI-flyt
- Opprette `CustomerIdStep` og `RequestAccessStep` komponenter
- Oppdatere `AddAssetDialog` med ny flyt
- Erstatte API-nøkkel-input med kunde-ID-input for 7 Security-integrasjoner

### Fase 3: AI Agent-kommunikasjon
- Implementere reell kommunikasjon med 7 Security (når API er tilgjengelig)
- Oppdatere Laras verktøy for å støtte 7 Security-flyten
- Legge til statussjekk og feilhåndtering

### Fase 4: Ny kunde-flyt
- Implementere "be om tilgang"-flyten
- E-postvarsling når tilgang er gitt
- Admin-grensesnitt for å se ventende forespørsler

## Fordeler med denne tilnærmingen

1. **Enklere for brukeren** - Ingen API-nøkkel å finne, bare kunde-ID
2. **Skalerbart** - 7 Security kan legge til flere kilder (konkurrenter til Acronis)
3. **Sikkerhet** - API-tilgang håndteres av 7 Security, ikke av hver enkelt kunde
4. **Fremtidsrettet** - AI Agent-til-Agent kommunikasjon er moderne og fleksibel
5. **Onboarding av nye kunder** - Automatisk provisjonering via Mynder
