# Forbruksvisning på dashbordet: tokens og lagringsplass

En ny widget nederst på hovedsiden (Trust Center-dashbordet) som viser AI-tokenforbruk og lagringsplass brukt på opplastede dokumenter — siste døgn og siste måned.

## Hva brukeren ser

En rolig, tett kortrad nederst på dashbordet med to blokker:

```text
Forbruk
┌───────────────────────────┬───────────────────────────┐
│ AI-tokens                 │ Lagring (dokumenter)      │
│ Siste døgn      12 400    │ Siste døgn      +4,2 MB   │
│ Siste 30 dager 318 900    │ Totalt          61,3 MB   │
│                           │ Siste 30 dager  +18,9 MB  │
└───────────────────────────┴───────────────────────────┘
```

- Kun rene tall i denne omgang, ingen kvotebar.
- Widgeten bygges slik at en kvote-/progresjonsvisning kan slås på senere uten omskriving (valgfri `quota`-prop som ikke er satt nå).
- Tokens deles i inn/ut ved hover, tall formateres etter språk (NB/EN).
- Lagring dekker kun dokumenter (leverandørdokumenter og virksomhetsdokumenter), ikke logoer/bilder.

## Slik hentes tallene

### AI-tokens — ekte logging

I dag logges ingen tokenbruk noe sted. Vi innfører faktisk logging:

1. Ny tabell `ai_token_usage`: funksjonsnavn, modell, inn-tokens, ut-tokens, totalt, bruker, tidspunkt. Lesetilgang for innloggede, skriving via service role fra edge-funksjoner.
2. Ny delt hjelpefil `supabase/functions/_shared/ai-usage.ts` som leser `usage`-feltet fra AI-gateway-svaret og skriver én rad.
3. Instrumentering av alle AI-edge-funksjoner (37 stk) med ett kall til hjelpefilen etter modellkallet. Funksjoner som strømmer svar logger ved strømslutt.

Tall før innføringen finnes ikke — widgeten viser derfor bare forbruk fra og med at loggingen er på.

### Lagring — faktiske filstørrelser

Filstørrelser ligger allerede i lagringsmetadataen. Vi lager en databasefunksjon som summerer størrelse og antall filer for de to dokumentområdene (`documents`, `vendor-documents`), gruppert på siste døgn, siste 30 dager og totalt. Frontend kaller den via ett spørsmål og trenger ikke laste ned filoversikten.

## Tekniske detaljer

- Migrasjon: `public.ai_token_usage` (id, function_name text, model text, prompt_tokens int, completion_tokens int, total_tokens int, user_id uuid, created_at timestamptz) med GRANT til `authenticated` (select) og `service_role` (all), RLS på, indeks på `created_at`.
- Migrasjon: `public.get_usage_summary()` — security definer, `search_path = public, storage`, returnerer tokens (døgn/30 d) fra `ai_token_usage` og bytes + filantall (døgn/30 d/total) fra `storage.objects` filtrert på bucket-ene `documents` og `vendor-documents`. Kun lesing fra storage-skjemaet, ingen endringer der.
- Ny fil `src/hooks/useUsageSummary.ts` — React Query mot RPC-en, 5 min `staleTime`.
- Ny fil `src/components/dashboard-trust/UsageFootprintCard.tsx` — presentasjonskort, i18n NB/EN, `formatBytes`-hjelper, semantiske tokens (ingen hardkodede farger), skeleton ved lasting, valgfri `quota`-prop for framtidig kvotevisning.
- `src/pages/TrustCenterDashboard.tsx` — rendres nederst, etter `UpcomingTrustFeaturesCard`.
- `supabase/functions/_shared/ai-usage.ts` — `logAiUsage({ functionName, model, usage, userId })`, feiltolerant (logging skal aldri velte et AI-svar).
- Instrumentering av `supabase/functions/*/index.ts` som kaller AI-gateway.
