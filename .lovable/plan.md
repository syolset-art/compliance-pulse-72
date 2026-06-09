# Trust Profile — Kertos-style hero

## Goal
Match the reference: a tall, clean banner (pattern or custom cover) on top, a large circular logo overlapping the banner's bottom edge, then on the white surface below: `{Company} Trust Center` headline, with Trust Score, frameworks and meta moved into a calmer strip beneath — not floating on the banner.

## Visual target

```text
┌────────────────────────────────────────────────┐
│   ░░░  PATTERN / COVER BANNER  ░░░             │
│                                                │
│                                                │
│        ⬤  ← circular logo, half over edge      │
├────────────────────────────────────────────────┤
│   Kertos GmbH   Trust Center                   │
│                                                │
│   [ISO 27001] [NIS2] [DORA]      ◯ 87 / 100   │
│   short description…              Verified ✓   │
└────────────────────────────────────────────────┘
│  ORG.NR · COUNTRY · WEBSITE · INDUSTRY         │  (existing IdentityStripe)
```

## Changes (UI only)

### `src/components/trust-center/profile/TrustProfileHero.tsx`
Rewrite the layout into two stacked zones:

1. **Banner zone** (clean, no overlaid content)
   - Height `clamp(220px, 28vw, 340px)`.
   - Renders `cover_image_url` if set, else the preset gradient + existing dot pattern.
   - Keeps the dark linear-gradient overlay (driven by `cover_overlay`).
   - Top-right keeps the small "Mynder Trust Profile" badge + "Verified" pill (white/translucent), nothing else floating.
   - Remove the centered "Detaljer ↓" scroll hint and the glass Trust Score card from the banner.

2. **Logo notch**
   - Circular avatar `h-28 w-28 md:h-32 md:w-32`, `rounded-full`, white background, ring + soft shadow.
   - Positioned `absolute -bottom-12 left-6 md:left-10`, overlapping banner/white seam (like Kertos).
   - Falls back to initials if no `logoUrl`.

3. **Identity row** (on the card's surface, below banner)
   - Padding `pt-16 md:pt-14 pb-6 px-6 md:px-10` so it clears the overlapping logo.
   - Left: `<h1>` with `{companyName}` in bold foreground + muted "Trust Center" suffix (matches reference typography: `text-3xl font-bold tracking-tight` + `text-2xl text-muted-foreground font-medium`).
   - Below h1: optional `description` (muted, 2-line clamp).
   - Below that: framework chips strip — same chips, but restyled for light surface (use `bg-muted/60 text-foreground border-border` + colored dot per category instead of dark glass).
   - Right (md+): Trust Score as a compact horizontal card — small ring (72px) + score + label + "Updated · Views" meta. On mobile it stacks under the headline.

4. **Props/contract**
   - Keep all existing props (`flush`, `meta`, `trustScore`, `frameworks`, `onVerifiedClick`, …). No API change for callers (`TrustCenterProfile.tsx`, edit preview).
   - `flush` still controls outer border/rounded — unchanged behaviour.

### No changes
- `IdentityStripe` stays as-is (renders below).
- `BrandingSection`, presets, upload flow unchanged — the same `cover_image_url` / `cover_preset_id` / `cover_overlay` drive the banner.
- No backend, no schema, no other components touched.

## Acceptance
- Banner reads clean (pattern or custom image only, no overlaid score/chips).
- Circular logo clearly straddles the banner/white seam.
- `Kertos GmbH Trust Center` reads as a single line, bold + muted suffix.
- Frameworks + Trust Score live on the white surface below, not on the banner.
- Public profile and edit-preview both render the new hero (both use `TrustProfileHero`).
