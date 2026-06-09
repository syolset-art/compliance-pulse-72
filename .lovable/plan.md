## Mål

Den offentlige Trust Profile (`trust.mynder.no/<slug>`) skal føles mer som et premium leverandør-trustcenter à la `trust.kertos.io`:

1. **Cover/bakgrunnsbilde øverst** — full bredde, høyt og atmosfærisk, med navn/logo/Trust Score lagt over.
2. **Regelverkene aktøren følger** vises tydelig og dekorativt i hero — ikke begravd langt nede.
3. Strammere, mer "kult" uttrykk i selve hero-banneret.

## Endringer

### 1. Cover image — opplasting + presets (Rediger profil)

I `src/pages/TrustCenterEditProfile.tsx` (eller egen `BrandingSection`) legges en ny seksjon **Profilbanner**:

- 16:5 forhåndsvisning av valgt cover.
- **Last opp eget bilde** (PNG/JPG/WebP, ≤ 4 MB) — lastes til ny offentlig bucket `trust-covers` via samme mønster som logo (`CompanyInfoForm` linjer 267–271). URL lagres på `asset.metadata.cover_image_url`.
- **Velg en preset** — 4–6 ferdige hero-bakgrunner (gradient + mønstre/lys) generert med `imagegen` og lagret som `lovable-assets`. Klikk = setter `cover_image_url` til preset-URL og `cover_preset_id` til id.
- **Overlay-styrke** (slider 30–80 %) — lagres som `cover_overlay` i metadata; brukes for tekstkontrast i hero.
- **Fjern bilde** — nullstiller felter (fallback til dagens lilla-gradient).

Ingen DB-migrering: alt går i `assets.metadata`. Ny migrering kun for bucketen `trust-covers` (public read, authenticated insert/update/delete på egen mappe `{user_id}/...`).

### 2. Ny hero på offentlig Trust Profile

Ny komponent `src/components/trust-center/profile/TrustProfileHero.tsx` som erstatter dagens header-card (lin. 611–697 og 2000-tallet i `TrustCenterProfile.tsx`):

```text
┌──────────────────────────────────────────────────────────┐
│  [cover image / gradient]    (h-72 md:h-96, full width)  │
│  └ dark linear-gradient overlay (cover_overlay %)        │
│                                                          │
│   [logo]  MYNDER AS                       ┌──────────┐  │
│           kort beskrivelse                │  Trust   │  │
│           NO • Helse og omsorg            │   85     │  │
│                                           │  /100    │  │
│   [GDPR] [ISO 27001] [NIS2] [Normen]      └──────────┘  │
│   ← framework-chips med ikon/farge                      │
└──────────────────────────────────────────────────────────┘
```

Detaljer:
- Cover renderes som `<div>` med `background-image` + `bg-cover bg-center` + mørk gradient overlay (`from-black/60 via-black/30 to-black/10`).
- Fallback når ingen cover er valgt: dagens lilla brand-gradient + subtilt grain/dot-pattern (CSS).
- Logoen ligger i en hvit/glassmorph-pille (`bg-background/80 backdrop-blur`) for kontrast mot bildet.
- Trust Score-gauge får et mørkt-glass kort (`bg-background/15 backdrop-blur-md border-white/10`) så tallet leses mot bildet.
- "Verified"-merket og "1 247 views" plasseres som diskret topp-stripe på selve banneret.

### 3. Regelverk-stripe i hero

I dag rendres `frameworks` lenger ned. I hero legges en ny **framework-rad** rett under navn/beskrivelse:

- Per framework: liten pille med ikon (Shield/Scale/Award) + farge fra eksisterende `frameworkBadgeClass` + navn.
- Standarder (ISO/SOC) får et lite "Sertifisert"-merke, regelverk (GDPR/NIS2/…) får "Følger".
- Hover/klikk scroller til seksjonen `#regulations` lenger ned (eksisterer allerede).
- Tom-tilstand: "Ingen regelverk publisert ennå" + lenke til Rediger profil.

Eksisterende framework-seksjoner lenger ned beholdes uendret som "drill-down".

### 4. Identitet-stripe

Den eksisterende 4-kolonne stripen (REG. NUMBER / COUNTRY / WEBSITE / INDUSTRY) flyttes ned **under** heroen, som første kort i innholdet. Får lett kort-styling for å bryte mot heroen.

## Tekniske detaljer

**Filer som endres**
- `src/pages/TrustCenterEditProfile.tsx` — render `<BrandingSection asset={asset} />`.
- `src/pages/TrustCenterProfile.tsx` — bytte ut header-card (både normal og `readOnly`) med `<TrustProfileHero ... />`. Identitet-stripen flyttes ut av kortet.

**Nye filer**
- `src/components/trust-center/edit/BrandingSection.tsx` — upload + preset-picker + overlay-slider.
- `src/components/trust-center/profile/TrustProfileHero.tsx` — hero-banner, score-glass, framework-stripe.
- `src/lib/coverPresets.ts` — id → `{ name, url, themeHint }` for 4–6 imagegen-genererte covers (lagret i `src/assets/covers/*.jpg.asset.json`).

**Bilder som genereres (imagegen, standard, 1920×600)**
- `aurora-violet` — abstrakt aurora i dyplilla/indigo (matcher brand).
- `glass-shards` — glassmorf-fragmenter mot mørk himmel.
- `topographic-light` — lyse topografi-linjer på off-white (light tema).
- `circuit-deep` — dyp blå med subtilt kretskort-mønster.
- `nordic-mist` — kjølig nordisk fjordtåke.

**Migrering**
```sql
-- storage bucket for cover images
insert into storage.buckets (id, name, public) values ('trust-covers','trust-covers', true);

create policy "Public can read trust covers"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'trust-covers');

create policy "Users manage own trust covers"
  on storage.objects for all to authenticated
  using (bucket_id = 'trust-covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'trust-covers' and (storage.foldername(name))[1] = auth.uid()::text);
```

**Datakontrakt i `assets.metadata`**
```ts
{
  cover_image_url?: string;   // upload eller preset-url
  cover_preset_id?: string;   // 'aurora-violet' | ...
  cover_overlay?: number;     // 0.3 – 0.8
}
```

## Ikke i scope

- Egen domeneoppsett (`trust.mynder.no`) — kun visning antas; ingen DNS-endringer.
- Endring av seksjonene under hero (maturity, kontaktinfo, subprosessorer, etc.) ut over flytting av identitet-stripen.
- Video-cover, animert bakgrunn — bare statisk bilde/preset i denne iterasjonen.
