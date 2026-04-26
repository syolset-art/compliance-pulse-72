## Plan: Mynder Color Audit & Fix

Innfør Mynder-paletten som offisielle tokens, fiks alle observerte avvik på Regelverk-siden, og rydd opp i resten av kodebasen i en kontrollert pass.

### 1) Design-tokens (grunnlaget)

**`tailwind.config.ts`** — legg til Mynder-tokens (i tillegg til eksisterende HSL-tokens, så vi ikke bryter noe):
- `mynder-blue: #4F51B6`
- `purple-900: #1F1B5A`, `purple-100: #F0EEFB`, `purple-accent: #7F77DD`
- `status: { open: #E24B4A, followup: #EF9F27, closed: #1D9E75, strategic: #7F77DD }`
- `borderRadius.pill: 999px`
- `fontFamily.sans: ['Mulish', 'system-ui', 'sans-serif']`

**`src/index.css`** — oppdater `:root` og `.dark` HSL-variabler så `--primary`, `--foreground`, `--secondary`, `--accent`, `--destructive`, `--ring` matcher Mynder-paletten (eksakt mapping fra spec §1.4). Beholder eksisterende variabel-navn så ingen komponenter brekker — bare verdiene endres. Dette gir umiddelbar effekt for alle komponenter som allerede bruker `bg-primary`, `text-foreground` osv.

**`index.html`** — last inn Mulish fra Google Fonts.

### 2) Konkrete fikser på Regelverk-siden

Ut fra grep-resultatene:

**`src/lib/frameworkDefinitions.ts`** (kategori-config — kilden til 2.4 og 2.5):
- privacy: `text-blue-500/bg-blue-500/10` → `text-mynder-blue/bg-mynder-blue/10` (cyan/blå-avvik)
- security: `text-green-500/bg-green-500/10` → `text-mynder-blue/bg-mynder-blue/10`
- ai: `text-purple-500/bg-purple-500/10` → `text-purple-accent/bg-purple-accent/10`
- other: `text-orange-500/bg-orange-500/10` → `text-mynder-blue/bg-mynder-blue/10`

**`src/components/regulations/EditActiveFrameworksDialog.tsx`** (2.3 «Påkrevd ved lov»-pille):
- Bytt `Badge variant="secondary"`/`destructive` for «Obligatorisk»-badgen til konsekvent `bg-status-followup text-white uppercase tracking-wider rounded-pill` — alltid samme farge uavhengig av rad.

**`src/components/regulations/FrameworkChipSelector.tsx`** (2.1 aktiv pille / kategori-headere):
- Selected-state bruker allerede `border-primary bg-primary/5` → blir riktig automatisk via `--primary` mapping.
- Linje 89 «Påkrevd» badge: bruk `text-status-followup` istedenfor `text-destructive/70` for konsistens med 2.3.
- Linje 25 progress-ring mellomtilstand: `hsl(45 93% 47%)` (gul) → `hsl(var(--warning))` som mappes til `status-followup`.

**`src/components/regulations/DomainActivationWizard.tsx`, `DomainSummaryCard.tsx`, `DomainSummarySection.tsx`, `DomainActionDialog.tsx`, `DomainUpgradeDialog.tsx`**:
- Erstatt alle `text-green-*/bg-green-*` (suksess) → `text-status-closed/bg-status-closed/10`
- Alle `text-orange-*/bg-orange-*` (advarsel) → `text-status-followup/bg-status-followup/10`
- Alle `text-blue-500` (info) → `text-mynder-blue`
- Alle `text-purple-500` (AI) → `text-purple-accent`

**Switches (2.2)** — oppdater `src/components/ui/switch.tsx`:
- `data-[state=checked]:bg-primary` → `data-[state=checked]:bg-status-closed`
- `data-[state=unchecked]:bg-input` → `data-[state=unchecked]:bg-[hsl(var(--muted))]`

**Lara FAB (2.6)** — finn og verifiser i `LaraAgent.tsx` / `ChatPanel.tsx` at FAB-sirkelen bruker `bg-mynder-blue` (eller `bg-primary` som nå mapper til samme).

### 3) Global opprydding (resten av kodebasen)

191 filer bruker raw Tailwind-farger (`green-*`, `red-*`, `orange-*`, `blue-*`, `purple-*`, `cyan-*`, `yellow-*`). Fremgangsmåte:

- Skript-basert sweep med `rg` + `sed` etter mapping-tabell:
  - `green-{500,600,700}` → `status-closed`
  - `green-{50,100}` → `status-closed/10`
  - `red-{500,600,700}` → `status-open` (eller `destructive` der semantikk er «feil»)
  - `orange-{500,600}` / `yellow-{400,500}` → `status-followup` / `warning`
  - `blue-{500,600}` / `cyan-*` → `mynder-blue`
  - `purple-{400,500}` → `purple-accent`; `purple-{700,800,900}` → `purple-900`
- Hardkodede HEX (`#22C55E`, `#3B82F6` osv.) → tilsvarende token
- Manuell verifisering av kontekst-sensitive treff (logo-spesifikke ikoner, illustrasjoner, charts som med vilje skal være forskjellige)

### 4) Verifisering

- Kjør app, sjekk at `/regulations` viser:
  - Aktiv pille i `mynder-blue`
  - Toggle ON i grønn `status-closed`
  - «Påkrevd ved lov»-pille i oransje `status-followup` på alle rader
  - Kategori-piller i `mynder-blue` (ikke cyan)
  - Lara FAB i `mynder-blue`
- Spot-sjekk Dashboard, Trust Profile-headere, Vendors-lister så ikke noe ser brutt ut.

### Filer som endres

**Tokens & globalt:**
- `tailwind.config.ts`
- `src/index.css`
- `index.html`

**Regelverk-spesifikt:**
- `src/lib/frameworkDefinitions.ts`
- `src/components/regulations/EditActiveFrameworksDialog.tsx`
- `src/components/regulations/FrameworkChipSelector.tsx`
- `src/components/regulations/DomainActivationWizard.tsx`
- `src/components/regulations/DomainSummaryCard.tsx`
- `src/components/regulations/DomainSummarySection.tsx`
- `src/components/regulations/DomainActionDialog.tsx`
- `src/components/regulations/DomainUpgradeDialog.tsx`
- `src/components/ui/switch.tsx`

**Global sweep:**
- ~190 komponentfiler får farge-erstatninger via mapping-tabellen (verifiseres kontekstuelt)

### Out of scope

- Endring av layout, spacing, font-størrelser eller funksjonalitet — kun farger.
- Ny ikonografi eller nye komponenter.
- Endring av charts/datavisualiseringer der distinkte farger er nødvendig for serie-skille.
- Bytte ut `--primary` -baserte komponenter (de oppdateres automatisk via CSS-variabel-mapping).