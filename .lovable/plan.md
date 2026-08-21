# TCK-35: Leverandørkort — UI-omlegging (toppseksjon + arkfaner)

Målet er et leverandørkort som åpner med en ryddig toppseksjon (samme visuelle logikk som kundekortet, men leverandørorientert), en tydelig fanestruktur med låste kjernefaner, og innhold som gjenbruker eksisterende komponenter fremfor å bygge nye konkurrerende design.

## Bekreftet nåtilstand (lest før planen)

- `AssetTrustProfile.tsx` (761 linjer) har `isVendor = !isSelf && !isHardware`, én `LOCKED_TAB = 'overview'`, `STORAGE_KEY = 'mynder_vendor_tab_prefs_v2'`, `MAX_VISIBLE_TABS = 7` og `allVendorTabs` med: overview, usage, evidence, gap-analysis, requests, deliveries.
- `VendorStatusBanner.tsx` har allerede stripe, logo, kritikalitet/prioritet-piller, org-meta, modenhets-donut, kontekstbanner (`renderContextBanner`, med flere grener) og footer med kontaktperson + Leverandøransvarlig-dropdown. `InviteVendorDialog` er allerede montert, men CTA-en er gjemt inne i kontekstgrenene.
- `AddVendorDialog.tsx` søker kun på navn: `useVendorLookup.searchBrreg` kaller Brreg med `?navn=`. Bransje (`naeringskode1.beskrivelse`) hentes allerede og vises i både resultatliste og bekreftelsessteg.
- Det finnes ingen berikelse av nettside/personvernerklæring i leverandørflyten. Kundeflyten (`AddMSPCustomerDialog`) gjør dette i tre trinn (hovedenhet → underenhet → `suggest-industry`-funksjon), og `useCustomerOnboardingFindings` leser resultatet tilbake fra `assets.metadata.privacy_policy_url` og `msp_customers.url`.
- `MynderGuidanceTab` har allerede tokolonners grid: `VendorFrameworkCard` (venstre) + `VendorControlChecklistCard` (høyre). Leverandørspesifikke regelverk finnes allerede som `readFrameworkState/writeFrameworkState` (localStorage per assetId) i `src/lib/vendorFrameworkSuggestions.ts`, kombinert med globalt scope fra `useVendorFrameworkScope()`.
- `VendorGapAnalysisTab` bruker en hardkodet liste `SUPPORTED_FRAMEWORKS = ["normen","nis2","iso27001","gdpr"]` — den leser **ikke** scopet i dag.
- `VendorEvidenceTab` (fanen `evidence`) rendrer bare `DocumentsTab` rått. `VendorDocumentsTab` er den som allerede implementerer proveniens-planen (kildelinje, Sara-status, Trust Engine-blokk, `src/lib/vendorDocumentSource.ts`) — men den brukes bare i `documents`-fanen for `asset_type === "vendor"`.
- `VendorAccessTab.tsx` finnes som selvstendig fane-komponent med demo-data (skriv-/lesetilgang).

## Del 1 — Toppseksjon og legg til-flyt

### 1. `src/components/asset-profile/VendorStatusBanner.tsx` (endres)
- Behold stripe, logo, navn, kritikalitet/prioritet-piller, org-meta-linje, beskrivelse og modenhets-donut uendret i struktur.
- Ny **fast handlingsrad** under org-meta (alltid synlig, uavhengig av status): primærknapp «Inviter til Trust Engine» / «Invite to Trust Engine» som åpner eksisterende `InviteVendorDialog` (`setInviteOpen(true)`), pluss sekundærhandlinger («Be om dokumentasjon», «Registrer aktivitet» via eksisterende callbacks der de finnes).
- Rydd `renderContextBanner`: den skal ikke lenger duplisere invitasjonsknappen (fjern «Inviter leverandøren»-knappen i `sourcing`-grenen og CTA-en i `claimed`-grenen), kun beholde statusteksten/kildeinformasjonen som én kompakt linje.
- Modenhets-blokken: fjern `italic` på undertekst (WCAG-krav om ingen kursiv brødtekst), behold både fargekode og tekstlabel slik at mening ikke formidles kun med farge.
- Dekorative ikoner (`Sparkles`, `Building2`, donut-svg) får `aria-hidden="true"`; donut får `role="img"` med `aria-label` som gjengir score i tekst.
- i18n: nye nøkler `vendorStatusBanner.actions.*` i `nb.json`/`en.json`; hardkodede norske strenger i footeren («Kontakt hos leverandør», «Leverandøransvarlig», «Velg ansvarlig», «Modenhet») flyttes til nøkler.

### 2. `src/hooks/useVendorLookup.ts` (endres)
- Ny hjelpefunksjon `isOrgNumber(query)` — 9 siffer (NO) etter fjerning av mellomrom/punktum; 8 siffer for DK (CVR), 10 siffer / `NNNNNN-NNNN` for SE.
- `searchBrreg` splittes: ved org.nr kalles `https://data.brreg.no/enhetsregisteret/api/enheter/{orgnr}` direkte og mappes til ett `VendorSearchResult`; ellers dagens `?navn=`-søk.
- `searchDemoCountry` (SE/DK) matcher også på `orgNumber` (normalisert, uten bindestrek).
- `VendorSearchResult` utvides med `industryCode?: string | null` slik at bransjekoden kan vises ved siden av bransjenavnet.

### 3. `src/components/dialogs/AddVendorDialog.tsx` (endres)
- Søkefeltet: placeholder og label til «Søk på navn eller organisasjonsnummer» / «Search by name or organisation number», `inputMode` uendret (fritekst). Ingen ny knapp — `handleSearch` sender videre til den utvidede `search()`.
- Resultatlisten: vis bransje tydeligere (allerede `r.industry`) og legg til bransjekode når den finnes; org.nr vises som i dag.
- Bekreftelsessteget: legg til rader for **Bransje** (allerede der), **Nettside** og ny **Personvernerklæring**, med kildemerking i tekst («Fra Enhetsregisteret» / «Foreslått av Lara» / «Lagt inn manuelt») — ikke bare farge.
- Berikelsessteg etter valg av selskap (speiler kundeflyten, men lettere): kall `suggest-industry`-funksjonen som fallback når Brreg mangler bransje, og bruk `hjemmeside` fra Brreg som forhåndsutfylt nettside.
- Manuelle felt for nettside og personvernerklæring beholdes som fallback og er alltid redigerbare.

### 4. `src/hooks/useVendorOnboardingFindings.ts` (ny)
- Speiler `useCustomerOnboardingFindings`, men for leverandør: leser `assets.url` og `assets.metadata.privacy_policy_url` for gitt `assetId`, og eksponerer `{ websiteUrl, privacyPolicyUrl }`.
- Brukes av `VendorStatusBanner` (lenke til personvernerklæring i org-meta-linjen når den finnes) og av `AddVendorDialog` ved re-åpning av eksisterende leverandør.
- Selve auto-søket i dialogen skriver funnene til `assets.url` + `assets.metadata.privacy_policy_url` ved opprettelse (samme felter som kundeflyten bruker) — ingen nye tabeller.

## Del 2 — Arkfaner

### 5. `src/pages/AssetTrustProfile.tsx` (endres)
- `LOCKED_TAB` (string) erstattes av `LOCKED_TABS = ['overview', 'evidence', 'gap-analysis', 'requests']`.
- `DEFAULT_VISIBLE_TABS = ['overview', 'evidence', 'gap-analysis', 'requests', 'usage']` (valgfrie: `usage`, `deliveries`).
- `STORAGE_KEY` bumpes til `mynder_vendor_tab_prefs_v3` — semantikken endres, gamle lagrede sett kan mangle nå-låste faner. Ved innlasting flettes låste faner alltid inn i riktig rekkefølge fra `allVendorTabs`.
- `toggleTab` avviser alle id-er i `LOCKED_TABS`; customizer-raden viser låste faner med hake + `disabled` + tekstlig «Alltid synlig» / «Always visible» (ikke bare nedtonet farge), og `aria-disabled`.
- Faneinnhold: `evidence` bytter fra `VendorEvidenceTab` til den nye tabellvisningen (punkt 8), `usage` får valgfri tilgangsseksjon (punkt 7).
- Self- og hardware-grenene røres ikke.

### 6. Veiledning fra Mynder — `src/components/asset-profile/MynderGuidanceTab.tsx` + `guidance/VendorFrameworkCard.tsx` (endres)
- Venstre kolonne: `VendorFrameworkCard` justeres til samme visningsmønster som kundekortets regelverksliste — gruppert rad-liste med navn, kort beskrivelse og status-merke, i stedet for dagens komprimerte 3-punkts forhåndsvisning. Kilden er uendret: globalt scope (lest) + leverandørspesifikke tillegg fra `readFrameworkState`.
- «Legg til regelverk» beholder `AddFrameworkDialog`, men i en leverandørvariant uten pris, uten kreditt-estimat og uten aktiveringsknapp — ren tilleggsvelger for denne ene leverandøren. Merking i raden: «Kun for denne leverandøren» / «Only for this vendor».
- Ingen gjenbruk av aktiverings-/kjøpsflyten fra `MSPCustomerRegulationsTab`; den filen røres ikke.
- Høyre kolonne: `guidance/VendorControlChecklistCard.tsx` bygges om til «Fullfør registreringen» — samme sjekklistemekanikk, men med lenker per punkt til der feltet fylles ut (Bruk og kontekst, Dokumentasjon, toppseksjon), tydelig fremdriftstekst («3 av 6 fullført») i tillegg til visuell markering, og `aria-hidden` på hake-ikonene siden status allerede står i teksten.

### 7. Bruk og kontekst — `src/components/asset-profile/tabs/VendorUsageTab.tsx` (endres) + `usage/VendorAccessSection.tsx` (ny)
- Ny `VendorAccessSection` trekker ut innholdet fra `VendorAccessTab` (skriv-/lesetilgang-listene) som en kollapsbar, valgfri seksjon merket «Valgfritt» / «Optional», standard lukket.
- `VendorAccessTab.tsx` blir en tynn wrapper rundt den nye seksjonen slik at eventuelle andre bruksstedet ikke brekker.
- Plasseres i `VendorUsageTab` ved siden av / under signalgrunnlaget, konsistent med dagens plassering av «Tilgang og roller» i `SaraMappedContextView`.

### 8. Dokumentasjon — `src/components/asset-profile/tabs/VendorEvidenceTab.tsx` (endres) + `DocumentsTab.tsx` (endres)
- Fanen `evidence` skal rendre `VendorDocumentsTab`-strukturen (som allerede realiserer proveniens-planen), ikke bare rå `DocumentsTab`. Ingen konkurrerende design lages: `VendorEvidenceTab` blir en tynn komponent som setter opp Sara-linjen, dokumentlisten og Trust Engine-blokken slik `VendorDocumentsTab` gjør i dag, med `useVendorInbox` uendret.
- `DocumentsTab`-tabellen får en eksplisitt **Kilde**-kolonne (proveniens) med tekstlabel + ikon fra `src/lib/vendorDocumentSource.ts`: «Lastet opp internt», «Fra leverandøren», «Hentet av Sara», «Fra Trust Engine». Ikonet er dekorativt (`aria-hidden`), teksten bærer meningen.
- Filterrad over tabellen: Alle / Internt / Fra leverandøren / Fra agent, som segmentert kontroll med `aria-pressed`.
- Ventende forespørsler vises som egne rader med statusteksten «Venter på leverandør», ikke bare gråtone.

### 9. Gap-analyse — `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx` (endres)
- Erstatt hardkodet `SUPPORTED_FRAMEWORKS` med **lest** union av:
  - globalt scope via `useVendorFrameworkScope().scopeIds` (kun lesing — ingen skriving, ingen endring i hooken eller `vendor_framework_scope`),
  - leverandørspesifikke tillegg via `readFrameworkState(assetId).added` minus `.removed`.
- Toppen av fanen viser samlet %-vis samsvar på tvers av valgte regelverk (oppfylte krav / totalt antall krav i scope), med tallet skrevet ut i tekst i tillegg til fremdriftsindikatoren.
- Liste over **manglende dokumenter** per regelverk, med lenke til Dokumentasjon-fanen og til «Be om dokumentasjon».
- Regelverksvelgeren i toppen får en egen gruppe «Kun for denne leverandøren» for de leverandørspesifikke.

## Filer

**Endres**
- `src/pages/AssetTrustProfile.tsx`
- `src/components/asset-profile/VendorStatusBanner.tsx`
- `src/components/dialogs/AddVendorDialog.tsx`
- `src/hooks/useVendorLookup.ts`
- `src/components/asset-profile/MynderGuidanceTab.tsx`
- `src/components/asset-profile/guidance/VendorFrameworkCard.tsx`
- `src/components/asset-profile/guidance/VendorControlChecklistCard.tsx`
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`
- `src/components/asset-profile/tabs/VendorAccessTab.tsx`
- `src/components/asset-profile/tabs/VendorEvidenceTab.tsx`
- `src/components/asset-profile/tabs/DocumentsTab.tsx`
- `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx`
- `src/locales/nb.json`, `src/locales/en.json`

**Opprettes**
- `src/hooks/useVendorOnboardingFindings.ts`
- `src/components/asset-profile/usage/VendorAccessSection.tsx`

**Røres ikke**
- `src/pages/MSPCustomerDetail.tsx`, `src/components/msp/CustomerStatusBanner.tsx`, `src/components/msp/MSPCustomerRegulationsTab.tsx` (kun referanse)
- `src/hooks/useVendorFrameworkScope.ts` og tabellen `vendor_framework_scope` (kun lesing)
- Self- og hardware-modus i `AssetTrustProfile.tsx`

## KREVER AVKLARING

1. **Leverandørspesifikke regelverk lagres i dag i localStorage** (`readFrameworkState`), ikke i databasen. Gap-analysen kan lese det som det er, men da er tillegget per nettleser og ikke delt i organisasjonen. Å flytte det til databasen ville berøre den delte regelverk-datamodellen — foreslås derfor ikke her. Skal vi leve med localStorage i denne leveransen?
2. **%-vis samsvar krever kravtelling per regelverk.** `vendor_gap_analyses` gir i dag resultat per valgt rammeverk. En samlet prosent på tvers av scopet forutsetter enten at gap-analyse er kjørt per regelverk, eller at vi viser «ikke analysert» for de som mangler. Foreslått: vis per-regelverk-prosent + samlet snitt kun over analyserte regelverk, med tydelig «X av Y regelverk analysert». Bekreftes.
3. **Personvernerklæring for leverandør** lagres foreslått i `assets.metadata.privacy_policy_url` (samme mønster som kunde). Hvis det heller skal være en egen kolonne, er det en skjemaendring som må godkjennes separat.
4. **Automatisk deteksjon av personvernerklæring** finnes ikke som egen funksjon i dag; kundeflyten setter feltet manuelt/AI-assistert. Skal vi gjenbruke `suggest-industry`-funksjonen utvidet, eller holde leverandørfeltet manuelt i første omgang?
