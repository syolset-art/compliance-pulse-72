## Mål

Når en leverandør legges til, skal Mynder automatisk lete etter eksisterende systemer og andre assets som ser ut til å høre sammen med leverandøren. Funnene presenteres for brukeren som kan godkjenne hvilke som skal kobles, og koblingene lagres i `asset_relationships`.

## Når skjer kartleggingen

Rett **etter** at leverandøren er opprettet (`createVendor.onSuccess` i `AddVendorDialog.tsx`). Vi legger ikke et nytt wizard-steg foran lagringen — leverandøren skal først eksistere så vi har en `target_asset_id` å koble mot.

Flyt:

```text
Bekreft → [lagre vendor] → Kartlegging (ny dialog) → ferdig
                                  │
                                  └─ hvis ingen treff: hopp over og lukk
```

## Hva regnes som et treff

Vi gjør én spørring mot `assets` (alle typer unntatt `vendor`) og scorer hver kandidat:

1. **Sterk match (auto-foreslått, hake på):**
   - `assets.vendor` ≈ vendornavn (case/whitespace-normalisert, fjerner AS/Inc/Ltd osv. — gjenbruker `normalize()` fra `useVendorMatch.ts`)
   - `assets.name` = vendornavn (f.eks. system kalt "Microsoft 365" når vi legger til "Microsoft")
2. **Mulig match (vist, hake av):**
   - `assets.name` inneholder vendornavn, eller vendornavn inneholder `assets.name`
   - `assets.description` nevner vendornavnet
   - `assets.url`-domene matcher vendor-URL
3. **Ignoreres:** treff med score under terskel, eller assets som allerede har en `asset_relationships`-rad mot denne vendoren.

Vi grupperer resultater per `asset_type` (System, Enhet, Prosess, …) i listen.

## Ny komponent: `VendorRelationshipDiscoveryDialog.tsx`

Plassering: `src/components/dialogs/VendorRelationshipDiscoveryDialog.tsx`

Props:
- `open`, `onOpenChange`
- `vendorId: string`
- `vendorName: string`
- `onComplete?: () => void`

Innhold:
- Header: "Vi fant {N} mulige koblinger til {vendorName}"
- Kort forklaring av hvorfor koblinger er nyttige (TPRM-arv, automatisk varsling ved DPA-utløp, oversikt i Supply Chain).
- Liste gruppert per asset-type. Hver rad:
  - Ikon + navn + meta (kategori, work area)
  - Badge: "Sterk match" (mynder-blue) eller "Mulig match" (muted)
  - Kort begrunnelse: "Oppgitt leverandør: Microsoft" / "Navn ligner"
  - Checkbox (default på for sterke, av for mulige)
- Footer-knapper:
  - **"Opprett {n} koblinger"** (mynder-blue, pill, primær)
  - "Hopp over" (ghost)

Tomt resultat → vi viser ikke dialogen i det hele tatt; bare en kort toast: "Ingen interne koblinger funnet".

## Lagring av koblinger

For hver hakede rad: insert i `asset_relationships`:

```text
source_asset_id  = asset.id (system/enhet/…)
target_asset_id  = vendor.id
relationship_type = 'provided_by'
description      = 'Auto-foreslått ved leverandør-onboarding'
```

Gjøres i én batch-insert. Toast: "{n} koblinger opprettet". Invaliderer `["asset_relationships"]` og `["assets"]`.

## Endringer i `AddVendorDialog.tsx`

- I `createVendor.onSuccess`: i stedet for å lukke dialogen umiddelbart i single-mode, sett `discoveryOpen=true` og `discoveryVendorId/Name`, og la `VendorRelationshipDiscoveryDialog` stå for resten. Når den lukkes → `onOpenChange(false)` + `resetForm()`.
- Multi-mode (bulk import) påvirkes ikke i denne iterasjonen.

## Ny hook: `useVendorRelationshipCandidates.ts`

Plassering: `src/hooks/useVendorRelationshipCandidates.ts`

- Tar `{ vendorId, vendorName, vendorUrl?, enabled }`.
- Henter `assets` (ikke `vendor`-typer) og eksisterende `asset_relationships` der target = vendorId.
- Returnerer `{ strong: Candidate[], possible: Candidate[], isLoading }`.
- Bruker samme `normalize()` som `useVendorMatch`.

## Tekniske detaljer

- Ingen DB-endringer. `asset_relationships` finnes allerede.
- All tekst på norsk, i Mynders Apple-minimal stil. Mynder-blue `#5A3184` på primær CTA, pill-knapper.
- Kun frontend + ny hook + ny dialogkomponent.

## Filer som berøres

- `src/components/dialogs/AddVendorDialog.tsx` (liten endring i onSuccess + render ny dialog)
- `src/components/dialogs/VendorRelationshipDiscoveryDialog.tsx` (ny)
- `src/hooks/useVendorRelationshipCandidates.ts` (ny)