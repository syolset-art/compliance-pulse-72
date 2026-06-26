## Mål for Fase 1
Avgjøre om Lovable Cloud-backenden er god nok for pilot, eller om backend bør flyttes til Azure/egen Postgres/API. Leveransen er et beslutningsgrunnlag — ingen kodeendringer, ingen migrasjoner.

## Hva jeg gjør (read-only)

### 1. Plattformhelse
- `supabase--cloud_status` — er instansen frisk?
- `supabase--db_health` + `supabase--slow_queries` — er det allerede tegn på treghet?
- Sjekk instansstørrelse og om vi nærmer oss tak.

### 2. Sikkerhets- og RLS-skanning
- `security--run_security_scan` — eksponerte data, manglende RLS, åpne policies.
- `supabase--linter` — strukturelle advarsler.
- Per tabell: `read_query` mot `pg_policies`, `information_schema.table_privileges`, `information_schema.columns` for å bygge inventar:
  - har tabellen RLS på?
  - hvilke policies finnes, og er de scoped til `auth.uid()`?
  - har `anon` SELECT/INSERT/UPDATE/DELETE der den ikke burde?
  - finnes `org_id` / `partner_id` / `user_id` — eller er tabellen "alle ser alt"?

### 3. Multi-tenant isolasjon (MSP)
Manuell test mot de mest kritiske tabellene (`msp_customers`, `msp_licenses`, `vendor_documents`, `assets`, `tasks`, `lara_inbox`):
- Klarer en partner-bruker i prinsippet å lese en annen partners kunder?
- Er filopplasting i `vendor-documents`-bucket scoped per org?

### 4. Edge functions
- Liste alle 25+ funksjoner med `verify_jwt`-status og hva de gjør.
- Identifisere hvilke som bruker `service_role` uten brukervalidering (høyrisiko).
- Sjekke AI-funksjoner mot kreditthåndtering og feilhåndtering (429/402).

### 5. Storage
- Policies på `documents`, `vendor-documents`, `company-logos`.
- Er filstier scoped per org/bruker?

### 6. Demo vs prod-data
- Identifisere hvilke tabeller som inneholder seedet demo-data i dag.
- Hvor i koden seedingen kjører, og om det skjer automatisk for nye brukere.

### 7. Auth-modenhet
- Hvilke providere er på (e-post, Google, …).
- E-postbekreftelse på/av, reset-password-flyt finnes/finnes ikke.
- `user_roles`-tabellen — brukes den konsekvent?

## Leveranse
Én rapport: `.lovable/v1-readiness.md` med:

1. **Sammendrag** — én side, rødt/gult/grønt per område.
2. **Anbefaling** — ett av tre:
   - **Grønt:** kjør videre med Lovable Cloud (Fase 2–4 i original plan).
   - **Gult:** kjør videre, men rydd ned scope til en mindre v1 (jeg peker ut hva som bør kuttes).
   - **Rødt:** flytt backend ut. Da beskriver jeg konkret hva som må reimplementeres (tabeller, edge functions, storage) og estimat for omfang.
3. **Inventar-vedlegg** — tabell-for-tabell-liste, edge function-liste, bucket-liste.
4. **Topp 10 kritiske funn** — med konkret reproduksjon der det er mulig.
5. **Kostnads-/skaleringsbilde** — Lovable Cloud-instansstørrelse, kjente tak, hva som driver pris (AI-kall, storage, DB-størrelse).

## Tidsbruk
1–3 arbeidsdager. Ingen kodeendringer underveis. Hvis jeg finner noe som krever umiddelbar handling (f.eks. tabell uten RLS som lekker data), flagger jeg det separat i chat før jeg fortsetter.

## Etter Fase 1
Du tar beslutning. Jeg foreslår ikke neste fase før du har sagt grønt/gult/rødt.

## Hva jeg IKKE gjør i Fase 1
- Ingen migrasjoner
- Ingen kodeendringer
- Ingen endringer på auth-konfigurasjon
- Ingen sletting av demo-data
