

## Plan: Nytt design på "Veiledning fra Mynder" — status-pille + inline editor på gap-kortene

I dag vises hvert foreslått gap med et statisk statusmerke (ÅPEN / UNDER OPPFØLGING / LUKKET) i øverste høyre hjørne. Brukeren ber om at disse kortene matcher det nye aktivitets-designet: klikkbar status-pille som åpner en inline-editor (bilde 1) for å endre status og legge til kommentar — uten å åpne hele opprett-aktivitet-dialogen.

### 1. Utvid gap-statusmodellen til 4 verdier (matcher aktivitetene)

**Fil:** `src/utils/vendorGuidanceData.ts`
- Utvid `GapStatus` fra 3 til 4: `"open" | "in_progress" | "closed" | "not_relevant"`
- Legg til `not_relevant` i `STATUS_CONFIG` (grå pille, samme stil som i `ACTIVITY_STATUS_CONFIG`)
- Synkroniser pille-stilene med `ACTIVITY_STATUS_CONFIG` fra `vendorActivityData.ts` slik at gap-kortene og aktivitets-kortene ser identiske ut (samme rosa/gul/grønn/grå pille med farget prikk + UPPERCASE-tekst + chevron)

### 2. Gjør status-pillen klikkbar på gap-kortene

**Fil:** `src/components/asset-profile/MynderGuidanceTab.tsx`

På hvert suggestion-kort (rundt linje 117–121):
- Bytt ut det statiske `<span>` med en klikkbar pille (knapp) som matcher pillen i `VendorActivityTab`:
  - Farget prikk (●), label i UPPERCASE, liten `ChevronDown`-ikon
  - Stil hentet fra felles config (samme som aktivitetslisten)
- `e.stopPropagation()` på klikket slik at det ikke åpner opprett-dialogen (`setActivePrefill`)
- Klikk setter ny lokal state `editingStatusId` → kortet utvides

### 3. Inline status-editor under gap-kortet (bilde 1)

Gjenbruk eksisterende `src/components/asset-profile/InlineStatusEditor.tsx` (samme komponent som aktivitetslisten bruker).

Når `editingStatusId === s.id`:
- Animert utvidelse under kortet (samme bredde, samme `border-t border-dashed` separator som i bilde 1)
- 4 status-pille-knapper (Åpent ✓ / Under oppfølging / Lukket / Ikke relevant)
- Tekstfelt "Legg til kommentar (valgfritt)…"
- Lagre / Avbryt-knapper, ESC lukker
- Ved Lagre → kall ny prop `onGapStatusChange(suggestionId, newStatus, comment)` og lukk editoren

### 4. Status-overrides for gap (in-memory)

**Fil:** `src/components/asset-profile/MynderGuidanceTab.tsx`
- Ny lokal state: `gapStatusOverrides: Record<string, { status: GapStatus; comment?: string; changedAt: Date }>`
- Når status endres lokalt: oppdater `gapStatusOverrides`, og `visibleSuggestions` mapper `s.status = overrides[s.id]?.status ?? s.status`
- `recomputeSummary` får dermed automatisk oppdatert sammendrag (rød/gul/grønn-tellinger i topp-boksen)
- Persisteres ikke til DB (samme demo-mønster som aktiviteter)

### 5. Bunntekst-tips (matcher bilde 1)

Legg til en liten tipslinje nederst i seksjonen (akkurat som i bildet):
> *"Tips: klikk på statuspillen til høyre på et kort for å endre status"*

Vises kun hvis det er ≥1 synlig forslag og editoren ikke er åpen.

### 6. Synkronisering med eksisterende dismiss-logikk

- Når bruker setter status `closed` eller `not_relevant` i editoren: kortet beholdes synlig (med ny pille) — det er IKKE samme som dismiss. 
- Gap som settes til `closed` her teller mot "lukket siste 30 dg" i Mynder-sammendragslinjen i `VendorActivityTab` (via samme override-mekanisme — alternativt: eget tellesett internt i Guidance-tab).
- Den gamle "klikk på kortet → åpne opprett-aktivitet-dialog"-flyten beholdes (klikk på selve kort-bakgrunnen, IKKE på pillen).

### Filer som endres

- `src/utils/vendorGuidanceData.ts` — utvid `GapStatus` med `not_relevant`, juster `STATUS_CONFIG` til samme stil som `ACTIVITY_STATUS_CONFIG`
- `src/components/asset-profile/MynderGuidanceTab.tsx` — klikkbar status-pille, integrasjon med `InlineStatusEditor`, `gapStatusOverrides`-state, tips-linje

### Filer som gjenbrukes uendret

- `src/components/asset-profile/InlineStatusEditor.tsx` — samme komponent som i aktivitetslisten

### Ut av scope

- Persistering til database
- Synkronisering av gap-status til faktiske kontroll-områder/maturity-data
- Endring av aktivitetsfanen (allerede oppdatert i forrige runde)

