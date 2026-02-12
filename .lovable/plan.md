
# Innboks-indikator pa vendorkort og global innboks-ikon

## Oversikt
Legge til en visuell innboks-indikator pa hvert vendorkort som viser antall ventende dokumenter, og et globalt innboks-ikon i sidebaren eller toppseksjonen pa /assets-siden.

## Endringer

### 1. VendorCard - innboks-badge
Legge til en ny prop `inboxCount` pa `VendorCard`-komponenten. Nar verdien er storre enn 0, vises et lite merke med et konvolutt-ikon og antall ventende elementer, plassert ved siden av de eksisterende badge-elementene (DPA, risiko, land).

### 2. VendorOverviewTab - hente innboks-data
Legge til en `useQuery` som henter antall ventende innboks-elementer per leverandor fra `lara_inbox`-tabellen (status = 'new' eller 'auto_matched'), gruppert pa `matched_asset_id`. Disse tallene sendes videre til hvert `VendorCard`.

### 3. VendorListTab - samme innboks-data
Samme logikk legges til i `VendorListTab` slik at det vises konsistent pa tvers av faner.

### 4. Global innboks-ikon pa Assets-siden
Legge til et innboks-ikon med badge i header-seksjon pa `/assets`-siden (ved siden av tittelen). Ikonet lenker til `/lara-inbox` og viser totalt antall ventende dokumenter pa tvers av alle leverandorer.

## Tekniske detaljer

**Ny query for innboks-telling:**
```typescript
const { data: inboxCounts = {} } = useQuery({
  queryKey: ["lara-inbox-counts"],
  queryFn: async () => {
    const { data } = await supabase
      .from("lara_inbox")
      .select("matched_asset_id, id")
      .in("status", ["new", "auto_matched"]);
    const counts: Record<string, number> = {};
    data?.forEach(item => {
      counts[item.matched_asset_id] = (counts[item.matched_asset_id] || 0) + 1;
    });
    return counts;
  },
});
```

**VendorCard endring:**
- Ny prop: `inboxCount?: number`
- Visuelt: En liten badge med `Mail`-ikon og tall i primary-farge, vist blant de andre badge-elementene nederst pa kortet

**Assets-side header:**
- Innboks-ikon (Mail eller Inbox fra lucide) med notification-badge plassert til hoyre for tittelen, som linker til `/lara-inbox`

## Filer som endres
- `src/components/vendor-dashboard/VendorCard.tsx` - ny inboxCount-prop og badge
- `src/components/vendor-dashboard/VendorOverviewTab.tsx` - hente innboks-data og sende til VendorCard
- `src/components/vendor-dashboard/VendorListTab.tsx` - samme innboks-data
- `src/pages/Assets.tsx` - global innboks-ikon i header
