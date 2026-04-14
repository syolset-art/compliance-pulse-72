

## Plan: Smidig prøveperiode-modell for Mynder Core og Registre

### Konsept: «Utforsk»-modell med prøve-credits

I stedet for harde låser bruker vi en **soft-gate** med begrenset gratis tilgang:

| Tilstand | Sidebar-visning | Tilgang |
|---|---|---|
| **Ikke valgt ved onboarding** | Seksjonen heter **«Flere tjenester»** med et subtilt ✨-ikon, dimmet | Kan klikke inn og se, men data er begrenset (5 systemer, 5 leverandører) |
| **Valgt ved onboarding, men ikke betalt** | Heter **«Mynder Core»** / **«Registre»** normalt | Fungerer fullt innenfor gratis-grensen (5 stk), viser oppgraderingsbanner inne på sidene |
| **Aktivt abonnement** | Heter **«Mynder Core»** / **«Registre»** normalt | Full tilgang |

### Hvorfor dette er bedre enn hard lock

- **Ingen forstyrrelser** for brukere som allerede har valgt verktøyet — det vises som normalt
- **Naturlig oppdagelse** for de som ikke har valgt det — «Flere tjenester» antyder muligheter uten å pushe
- Gratis-grensen (5 stk) gir nok til å teste uten forpliktelse
- Oppgraderingsbannere vises **kun inne på sidene**, ikke i sidebaren

### Endringer

**1. `src/components/Sidebar.tsx`**
- Ny logikk: sjekk om bruker valgte `use_cases` som inkluderer systemer/leverandører ved onboarding (fra `company_profile`)
- Hvis **ikke valgt og ikke betalt**: vis én samlet seksjon kalt «Flere tjenester» (i stedet for to separate) med `Sparkles`-ikon, standard opacity men med en liten «Ny»-badge
- Hvis **valgt eller betalt**: vis Mynder Core og Registre normalt som i dag (ingen lock, ingen dimming)
- Fjern `opacity-50` og `Lock`-badge helt — erstattes av kontekstuell visning

**2. `src/hooks/useSubscription.ts`**
- Legg til `selectedAtOnboarding: boolean` som sjekker `company_profile.use_cases` for relevante moduler
- Oppdater `hasCoreAccess` til å returnere `true` også for gratis-brukere som valgte det ved onboarding (de har tilgang, bare begrenset antall)
- Ny helper: `needsUpgrade(moduleId)` som returnerer `true` når bruker er over gratis-grensen

**3. `src/pages/Subscriptions.tsx`**
- Omstrukturere Steg 3 til å matche sidebar-logikken
- Hvis bruker ikke har valgt moduler ved onboarding, vis dem som «Utforsk»-kort med «Prøv gratis med 5 enheter»
- Hvis bruker har valgt men ikke betalt, vis tydelig prøve-status med «5 av 5 brukt — oppgrader»
- Fjern «Automatiser med moduler»-overskriften, bytt til «Styringsverktøy» med kontekstuell tekst

**4. `src/locales/nb.json` og `en.json`**
- Legg til `nav.moreServices` / «Flere tjenester» / «More services»
- Legg til `nav.exploreBadge` / «Utforsk» / «Explore»

### Sidebar-visualisering

For bruker som **ikke** valgte Mynder Core ved onboarding:
```text
│  ● Dashboard                    │
│  🌍 Trust Center           ▾   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ⚖️ Regelverk & krav            │
│  ✉️ Meldinger                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ✨ Flere tjenester    Utforsk  │  ← Én samlet seksjon
│     Arbeidsområder              │
│     Leverandører                │
│     Systemer                    │
```

For bruker som **valgte** Mynder Core ved onboarding:
```text
│  ● Dashboard                    │
│  🌍 Trust Center           ▾   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ⚖️ Regelverk & krav            │
│  ✉️ Meldinger                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  📋 Mynder Core             ▾  │  ← Normalt, ingen lock
│  🗄️ Registre                ▾  │  ← Normalt, ingen lock
```

### Tekniske detaljer
- `company_profile.use_cases` inneholder allerede brukerens valg fra onboarding (f.eks. `["privacy", "security"]`)
- Mapping: `use_cases` som inneholder «security» eller «risk» → Mynder Core valgt; «vendors» → Registre valgt
- Gratis-grensen (5 systemer, 5 leverandører) er allerede definert i `PLAN_TIERS.free`
- Ingen nye tabeller eller migrasjoner nødvendig

