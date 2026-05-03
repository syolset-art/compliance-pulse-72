## Mål

Gi systemkortene samme agentiske, fargekodede livssyklus-uttrykk som leverandørkortene — slik at brukeren med ett blikk ser hvem som eier systemet (Lara/Mynder, arbeidsområde, eller arkivert).

## Hvorfor

Dagens `Systems.tsx` viser et flatt kort: ikon, navn, statuspille, og en grid med fire celler (type, modenhet, risiko, eier). Det finnes ingen visuell signatur som forteller om systemet er kartlagt av Lara, tatt i bruk av et arbeidsområde, eller arkivert. Til sammenligning har leverandørkortet (`VendorStatusRow`) en sterk fargekodet venstrestripe + livssyklus-banner som umiddelbart formidler eierskap.

## Foreslått systemlivssyklus (analog til vendor)

| Nøkkel | Hvem eier | Stripefarge | Tilsvarer hos vendor |
|---|---|---|---|
| `mapped` (Lara) | Mynder/Lara har oppdaget systemet — ingen Work Area har tatt det | `system-mapped` (oransje, sommerfugl) | `draft` |
| `assigned` | Tildelt et arbeidsområde, men ikke gjennomgått | `system-assigned` (blå) | `invited` |
| `owned` | Work Area-eier har bekreftet og oppdaterer aktivt | `system-owned` (grønn) | `claimed` |
| `phasing_out` | Under utfasing | `system-phasing` (gul/oransje, dempet) | (ny) |
| `archived` | Arkivert / ikke i bruk | `system-archived` (grå) | `archived` |

Avledning (i en ny `src/lib/systemStatus.ts`):
- `archived` hvis `status === "archived"`
- `phasing_out` hvis `status === "phasing_out"`
- `mapped` hvis ingen `work_area_id` OG metadata viser `discovered_by === "lara"` (eller fallback: ingen eier + lav modenhet)
- `assigned` hvis `work_area_id` finnes men `compliance_score < 40` eller metadata-flagg `claimed_at` mangler
- `owned` hvis `work_area_id` finnes og enten metadata har `claimed_at`/`owner_confirmed_at` eller `compliance_score >= 40`

## Visuell mal (kopi av vendor-kortet)

```text
┌────┬─────────────────────────────────────────────────────┐
│ S  │  [icon] Systemnavn  [Kritikalitet] [Status-pille]   │
│ Y  │  Microsoft  ·  microsoft.com                        │
│ S  │  Kort beskrivelse av systemet (1 linje)             │
│ T  │                                  ┌──────────┐       │
│ E  │                                  │  ●  72%  │ Mode- │
│ M  │                                  │  donut   │ nhet  │
│  · │                                  └──────────┘ "..." │
│ M  │  ┌──────────────────────────────────────────────┐  │
│ A  │  │ 🦋  Lara kartla systemet 12. mars 2026       │  │
│ P  │  │                       [Tildel arbeidsområde] │  │
│ P  │  └──────────────────────────────────────────────┘  │
│ E  │                                                     │
│ T  │  Footer (kun for noen statuser)                     │
└────┴─────────────────────────────────────────────────────┘
```

Per status:
- **mapped**: oransje stripe «SYSTEM · KARTLAGT», banner med Lara-sommerfugl + "Lara kartla systemet {dato}", CTA «Tildel arbeidsområde»
- **assigned**: blå stripe «SYSTEM · TILDELT», banner med "Tildelt {Work Area} {dato} – avventer bekreftelse", CTA «Bekreft eierskap»
- **owned**: grønn stripe «SYSTEM · EID», banner med "Eid av {Work Area}, sist oppdatert {dato}", liten aktiv-prikk på stripen
- **phasing_out**: dempet gul stripe «SYSTEM · UTFASES», banner med plan/dato
- **archived**: grå stripe «SYSTEM · ARKIVERT», navn `line-through`, banner med arkiveringsdato + CTA «Gjenåpne»

## Filer som endres / opprettes

1. **Ny:** `src/lib/systemStatus.ts` — speilbilde av `vendorStatus.ts` med `deriveSystemStatus`, `SystemStatusMeta`, `ALL_SYSTEM_STATUSES`.
2. **Ny:** `src/components/systems/SystemStatusRow.tsx` — kortkomponent som speiler `VendorStatusRow.tsx` (vertikal stripe, donut, banner, footer). Bruker eksisterende `getSystemIcon` for venstre-ikonet og `AssetRowActionMenu` for handlingsmeny.
3. **Endret:** `src/index.css` — legg til 5 nye HSL-tokens (`--system-mapped`, `--system-assigned`, `--system-owned`, `--system-phasing`, `--system-archived` + `*-foreground`), både light og dark.
4. **Endret:** `tailwind.config.ts` — eksponer de samme tokenene som `system-mapped`, `system-assigned`, osv.
5. **Endret:** `src/pages/Systems.tsx` — i `renderSystemCard` (og i list-/grouped-view) bytte den eksisterende `<div className="rounded-xl border…">`-blokken med `<SystemStatusRow system={system} ownerWorkArea={ownerWa} />`. Beholder `getSystemIcon`, eier-mutasjoner og handlingsmeny — bare presentasjonen endres.
6. **Endret (lett):** `src/lib/demoSeedSystems.ts` — sett `metadata.discovered_by = "lara"` og evt. `metadata.lara_mapped_at` på et par demo-systemer slik at prototypen viser «kartlagt av Lara»-tilstanden.

## Mynder Design System-overholdelse

- Stripene bruker tokens fra `index.css` (HSL) — ingen hardkodede hex i komponenter.
- Lara-banneret bruker `bg-purple-100` + `text-purple-900` og gjenbruker `LaraAvatar` fra `src/components/asset-profile/LaraAvatar.tsx`.
- Knapper er `rounded-pill` (Mulish, mynder-blue primær).
- Donut-fargene følger `tone` (success/warning/primary/muted) — samme tokenbruk som vendor.

## Ut av scope

- Ingen DB-migrasjon. Alt avledes fra eksisterende `systems`-kolonner + `metadata`-jsonb.
- Ingen endring i `SystemTrustProfile`-siden eller dialoger.
- Ingen endring i kategori-grupperingen eller filter-baren — kun selve kortpresentasjonen.
- `AISystemCard` (egen AI-registry) berøres ikke i denne runden — kan harmoniseres senere.
