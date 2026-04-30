## Mål

Slå sammen «Lara-innboks» og «Innkommende» til én felles innboks på `/customer-requests`. Hvert element merkes tydelig med hvem som håndterer det: Lara (AI) eller menneske. Less is more — én liste, klare filtre, samme handlingsmønster.

## Endringer

### 1. `src/pages/CustomerRequests.tsx` — fjern doble faner
- Fjern `lara`-fanen og `inbound`-fanen.
- Erstatt med én fane: **Innboks** (default), pluss eksisterende **Utgående**.
- Behold badge-telling, men slå sammen Lara-pending + nye innkommende meldinger til ett tall.
- Beholder query for `laraCount`, legger til count for nye meldinger, summerer.

### 2. Ny komponent `src/components/customer-requests/UnifiedInboxContent.tsx`
Én liste med blandet innhold sortert etter `received_at`/`created_at` (nyeste først).

**Topp-filterrad** (segmentert kontroll, less-is-more):
- Alle · Venter Lara · Venter deg · Ferdig

**Kilde-merking på hvert kort** (liten chip øverst til venstre):
- `Sparkles`-ikon + «Lara» (lilla/primary) — for `lara_inbox`-elementer
- `User`-ikon + «Manuell» (nøytral) — for `customer_compliance_requests`

**Status-badge til høyre** (gjenbruk eksisterende mønstre):
- Lara-elementer: `Analyserer` / `Klar for godkjenning` / `Godkjent` / `Avvist`
- Manuelle: `Ny` / `Lest` / `Besvart` / `Arkivert`

**Innhold per kort**:
- Lara-elementer: gjenbruk eksakt samme ekspanderte visning fra `LaraInboxContent` (Lara foreslår + analyse + Godkjenn/Avvis-knapper).
- Manuelle elementer: gjenbruk `CustomerRequestCard` sin innmat (tittel, kunde, due_date, handlinger).

### 3. Datakilde
Hent begge i parallell og slå sammen til ett array med en `__source: 'lara' | 'manual'`-diskriminator:
```ts
const items = useQuery(['unified-inbox'], async () => {
  const [lara, manual] = await Promise.all([
    supabase.from('lara_inbox').select('*, assets:matched_asset_id(...)').order('received_at', { ascending: false }),
    supabase.from('customer_compliance_requests').select('*').order('created_at', { ascending: false }),
  ]);
  return [
    ...(lara.data || []).map(x => ({ ...x, __source: 'lara', __ts: x.received_at })),
    ...(manual.data || []).map(x => ({ ...x, __source: 'manual', __ts: x.created_at })),
  ].sort((a, b) => +new Date(b.__ts) - +new Date(a.__ts));
});
```

### 4. Filterlogikk
- **Venter Lara**: `__source === 'lara'` og `analysis_status in (pending, analyzing)`
- **Venter deg**: Lara-elementer med `analysis_status === 'analyzed'` + manuelle med `status in (new, read)`
- **Ferdig**: Lara `status in (manually_assigned, rejected)` + manuelle `status in (responded, archived)`

### 5. Ruting og lenker
- Behold rute `/customer-requests` med `?tab=inbox|outbound`.
- Redirect `?tab=lara` og `?tab=inbound` → `?tab=inbox` (i `useEffect`).
- Topbar Inbox-ikon peker fortsatt på `/customer-requests?tab=inbox`. Oppdater i `TopBar.tsx`, `LaraAgent.tsx`, `DashboardLaraRecommendation.tsx` mfl. der `?tab=lara` brukes i dag.

### 6. Beholdes uendret
- `LaraInboxContent.tsx` og `InboundRequestsContent.tsx` slettes ikke i denne runden — vi peker bort fra dem og fjerner import i `CustomerRequests.tsx`. (Kan ryddes senere når vi er trygge på unified-flyten.)
- `CustomerRequestCard`, `OutboundRequestsTab`, godkjennings­logikken (`approveMutation`, `supersedePreviousDocuments`), auto-progresjonen pending→analyzing→analyzed gjenbrukes som de er.

## UX-skisse

```text
Meldinger
─────────────────────────────────────────────
[ Alle 12 ] [ Venter Lara 3 ] [ Venter deg 4 ] [ Ferdig 5 ]

[Lara]   ISO27001-sertifikat.pdf            +10 poeng  [Klar]
         Microsoft · ISO 27001 · 30.04
         ▼ Lara foreslår: Koble til Microsoft, sette gyldighet ...
                                          [Avvis] [Godkjenn]

[Manuell] DPA-forespørsel                              [Ny]
         Nordic Solutions · forfaller 5. mai
                                          [Arkiver] [Åpne]

[Lara]   SOC2-rapport.pdf                              [Analyserer]
         Atlassian · SOC 2 · 30.04
```

## Hvorfor dette løser problemet

- Én innboks = én mental modell. Bruker går ett sted.
- Kilde-chipen («Lara» vs «Manuell») gjør det øyeblikkelig synlig hva AI har tatt og hva mennesker må håndtere.
- Filtrene matcher hvordan folk faktisk jobber: «hva venter på meg nå?» vs «hva jobber Lara med?».
- Ingen funksjonalitet tapt — alle eksisterende handlinger (godkjenn, avvis, arkiver, les) er bevart.
