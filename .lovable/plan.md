

# Mynder Me - Default-innhold og Premium-nivåer

## Regulatorisk grunnlag for default-innhold

Flere av datakategoriene i "Delt innhold" er lovpålagte etter GDPR og AI Act. Disse bor vaere aktivert som standard og ikke kunne skrus av:

| Kategori | Lovhjemmel | Standard |
|----------|-----------|----------|
| Behandlingsprotokoller | GDPR Art. 13-14 (informasjonsplikt) | Alltid pa |
| AI-systemer | AI Act Art. 13-14 (transparensplikt) | Alltid pa |
| Systemer og datalokasjoner | GDPR Art. 13(1)(f) (overforinger) | Alltid pa |
| Underleverandorer | GDPR Art. 13(1)(e)-(f) (mottakere) | Alltid pa |
| Rammeverk | God praksis, ikke lovkrav | Pa som default, kan skrus av |

## Premium-funksjoner (krever oppgradering)

| Funksjon | Begrunnelse | Pris |
|----------|-------------|------|
| Hendelser og avvik i sanntid | GDPR Art. 34 krever kun varsling ved hoy risiko - proaktiv varsling til alle ansatte via app er utover minimumskrav | Del av Mynder Me Premium |
| Avansert kursstatistikk | Fullforingsrater per avdeling, trendanalyse, compliance-rapporter | Del av Mynder Me Premium |
| Ansatt-engasjement dashboard | Aggregert oversikt over appbruk, responstid pa varsler | Del av Mynder Me Premium |

## Teknisk implementering

### 1. Utvide `mynder_me_shared_content`-tabellen

Legge til kolonner for a skille mellom lovpalagt og valgfritt innhold:

- `is_mandatory` (boolean) - kan ikke skrus av av brukeren
- `is_premium` (boolean) - krever premium-abonnement
- `regulatory_basis` (text) - lovhjemmel som vises i UI (f.eks. "GDPR Art. 13-14")

### 2. Oppdatere seed-data

Sette `is_mandatory = true` for de fire lovpalagte kategoriene og `is_premium = true` for hendelser/avvik.

### 3. Oppdatere SharedContentTab

- Lovpalagte kategorier far et las-ikon og en "Lovpalagt"-badge, switch er disabled og alltid pa
- Hendelser/avvik far en "Premium"-badge med oppgraderingsknapp dersom kunden ikke har Mynder Me Premium
- Rammeverk forblir valgfritt uten premium-krav

### 4. UI-endringer i SharedContentTab

- Gruppere kategoriene i to seksjoner: "Lovpalagt deling" og "Valgfritt"
- Lovpalagte kategorier viser regulatorisk hjemmel (f.eks. "GDPR Art. 13-14")
- Premium-kategorier viser en las-overlay med "Oppgrader til Premium" hvis ikke aktivert
- Info-kort oppdateres med forklaring om lovpalagt vs. valgfritt

## Filer som endres

| Fil | Endring |
|-----|---------|
| `supabase/migrations/...` | Legge til `is_mandatory`, `is_premium`, `regulatory_basis` kolonner + oppdatere eksisterende rader |
| `src/components/mynder-me/SharedContentTab.tsx` | Gruppering, las-ikoner, premium-badges, disabled switches for lovpalagt |
| `supabase/functions/mynder-me-api/index.ts` | Sjekke premium-status for hendelser-endepunktet |

