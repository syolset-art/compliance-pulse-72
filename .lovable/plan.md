## Mål

På **Rediger Trust Profile** (`/trust-center/edit`) skal brukeren kunne legge til tredjepartsleverandører (subprocessors) manuelt — én og én via søk. Det som legges til vises i Trust Profilen i samme `SubprocessorTable` som allerede finnes (referansebilde). Listen lagres på `asset.metadata.subprocessors`.

## Hva som lages

### Ny seksjon i edit-flyten

I `src/pages/TrustCenterEditProfile.tsx`, rett før `DocumentationSection`, plasseres en ny `<SubprocessorsSection asset={asset} />` med:

- Tittel + kort hjelpetekst.
- Liste over allerede lagte leverandører (initial-bobble, navn, kategori/formål, land med flagg, slett-knapp). Speiler stilen i `SubprocessorTable`.
- **«+ Legg til leverandør»** som åpner et søke-Combobox.

### Søk + autoutfylling

Comboboxen søker mot eksisterende `VENDOR_CATALOG` (`src/lib/vendorCatalog.ts`) + `COUNTRY_BY_NAME` fra `src/lib/demoSubprocessorAnalysis.ts`:

- Treff i katalogen → fyller automatisk inn **kategori (formål)**, **land** og **DPA-type**. Brukeren bekrefter med Enter / klikk.
- Ingen treff → tilbyr **«Legg til "{navn}" manuelt»**. Et lite skjema (navn, formål, land — landvelger fra `SUPPORTED_COUNTRIES` i `countryScopeData.ts`) lar brukeren fylle ut selv. DPA settes til `unknown`.

Begge veier ender i et nytt entry på formen `AnalyzedSubprocessor` (`source: "matched" | "unmatched"` finnes allerede). 

### Lagring

Hele lista lagres som `SubprocessorListData` på `asset.metadata.subprocessors`:

```ts
{
  source: "manual",          // ny variant (legges til i typen)
  analyzedAt: <ISO>,
  vendors: AnalyzedSubprocessor[]
}
```

`source`-unionen utvides med `"manual"` i `src/lib/demoSubprocessorAnalysis.ts`. Hvis listen allerede finnes (fra opplasting/URL), legges nye manuelle radene **inn i samme `vendors`-array** så Trust Profile-tabellen viser alt sammen.

Update-mønsteret følger eksisterende edit-page-pattern:
```ts
await supabase.from("assets").update({ metadata: nextMeta }).eq("id", asset.id);
queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
```

### Visning i Trust Profilen

Ingen endring nødvendig. `TrustCenterProfile.tsx` leser allerede `meta.subprocessors` og rendrer `SubprocessorTable`, som håndterer både eksisterende felter (kategori, country-kode, dpaType, hasTrustProfile). Manuelle entries vil dukke opp i samme tabell.

## Tekniske detaljer

**Nye filer**
- `src/components/trust-center/edit/SubprocessorsSection.tsx` — selve seksjonen med liste, slett, og «+ Legg til».
- `src/components/trust-center/edit/AddSubprocessorCombobox.tsx` — shadcn `Command`-basert søk + fallback manuell skjema (popover).

**Endrede filer**
- `src/lib/demoSubprocessorAnalysis.ts` — utvide `SubprocessorListData["source"]` til `"upload" | "url" | "manual"`. Eksportere en hjelpefunksjon `matchVendorByName(name)` (refaktorering av eksisterende `matchVendor`) slik at edit-seksjonen kan bruke samme matching-logikk for autoutfylling.
- `src/pages/TrustCenterEditProfile.tsx` — render `<SubprocessorsSection asset={asset} />` rett før `<DocumentationSection />`.

**Datakilder for autoutfylling**
- Navn/kategori/DPA: `VENDOR_CATALOG` (≈30+ leverandører allerede definert).
- Land: `COUNTRY_BY_NAME` (utvides ved behov) + brukerens valg fra `SUPPORTED_COUNTRIES`.

**Ingen DB-migrering.** Alt lagres som JSON på `assets.metadata` (samme felt som i dag).

## Ikke i scope

- Bulk-import (CSV/URL) — finnes allerede via `analyzeSubprocessorFile/Url`. Lar oss legge til en knapp som åpner dem senere om ønsket; for nå er manuell tillegg primært.
- Invitasjons-flyt for leverandører uten Trust Profile — eksisterer som UI-knapp i `SubprocessorTable` (no-op i dag).
- Endring av offentlig visningskomponent — uendret.
