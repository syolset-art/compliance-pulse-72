
## Mål

En ny bruker skal alltid se Trust Center, Regelverk og Meldinger — ingenting annet. Alle øvrige moduler (Mynder Core, Leverandører, Aktiva, Agenter) er tilleggstjenester som må aktiveres i planen før de dukker opp i menyen. "Bli partner" og "Demoer" fjernes fra den vanlige sidemenyen.

## Slik blir menyen

Faste (alltid synlige for alle brukere):

```text
Dashboard
Trust Center
  ├─ Trust Profile
  ├─ Aktiver Trust Profile
  ├─ Rediger profil
  └─ Dokumentasjon
Regelverk
Meldinger
```

Tillegg (vises kun når aktivert i plan):

```text
Mynder Core          ← egen tilleggstjeneste
  ├─ Mine arbeidsområder
  ├─ Oppgaver
  ├─ Avvik
  └─ Rapporter

Leverandører         ← eget register/tillegg
  ├─ Oversikt
  └─ Rapporter

Aktiva               ← eget register/tillegg
Agenter              ← eget register/tillegg
Systemer             ← følger Mynder Core
```

Nederst: **Innstillinger** (uendret, med "Flere tjenester / Utforsk" som CTA for å aktivere det som ikke er kjøpt).

## Endringer i `src/components/Sidebar.tsx`

1. **Trust Center, Regelverk og Meldinger er alltid synlige** — ingen `showX`-gating på `globalNav` (slik som i dag) og `TrustCenterMenu`.

2. **Mynder Core kun ved aktivering**
   - Beholder `showCoreNormal = selectedCoreAtOnboarding || hasCoreAccess || activatingModules.has("core")`.
   - I dag er den allerede gated — bekrefte at uten aktivering vises seksjonen ikke (ok).

3. **Registre-seksjonen fjernes som fast gruppe.**
   - I dag: `showRegistries = true` og `agentsLink` legges alltid inn → Agenter synlig for alle. Dette er feil.
   - Ny logikk: hver av Systemer / Aktiva / Agenter er sin egen aktiverbare modul. De vises kun når aktivert (egne flagg).
   - Enten vis dem som tre topp-nivå-lenker, eller behold en "Registre"-gruppe som kun rendres når minst én av dem er aktivert. Velger gruppe for å holde menyen ryddig.
   - Agenter får eget access-flagg `hasAgentsAccess` (foreløpig fra `useActivatedServices` / `domain_addons` på samme måte som de andre — kan stubbes til `false` inntil planen har en `agents`-pakke).

4. **Leverandører kun ved aktivering** — uendret (`showVendorsNormal`).

5. **Skjul "Bli partner" fra sidemenyen helt.**
   - Lenken under nav (linjer ~793–807) fjernes. Funksjonen flyttes/fortsatt tilgjengelig via Innstillinger eller MSP-workspace.

6. **Skjul "Demoer"-blokken fra sidemenyen helt.**
   - Hele `<div className="mt-2">…Demoer…</div>` (linjer ~810–870) fjernes. Demo-knappene flyttes til Innstillinger → en ny "Demoer"-side (eller fjernes for end-brukere — kun synlig for `super_admin`/`daglig_leder`).

7. **"Flere tjenester / Utforsk"** beholdes og utvides:
   - Listen `exploreRegistryItems` skal også inkludere `agentsLink` når `hasAgentsAccess` er false (i dag legges Agenter alltid inn — fjern den faste innpaketeringen).
   - Sørger for at en Trust Center-bruker tydelig kan oppgradere planen med Leverandør, Mynder Core, Aktiva eller Agenter herfra.

## Tekniske detaljer

- Filer som endres:
  - `src/components/Sidebar.tsx` — hovedendringene over.
  - `src/hooks/useActivatedServices.ts` (eller tilsvarende) — legg til `hasAgentsAccess` flag basert på et nytt addon-key `agents` (default false). Kan re-bruke samme mønster som `hasRegistriesAccess`.
- Ingen DB-migrasjon nødvendig nå; `domain_addons`/`module_addons` brukes som i dag. Når Agenter skal selges som eget tillegg, legges en addon-rad inn med key `agents`.
- Partner-modus (`workspaceMode === "partner"`) er uberørt — den har sin egen `PartnerNav`.
- `super_admin` / `daglig_leder` får (valgfritt) en egen "Mynder innstillinger"-vei til Demoer-siden, slik at intern testing fortsatt virker.

## Akseptansekriterier

- Helt ny bruker uten tillegg ser kun: Dashboard, Trust Center, Regelverk, Meldinger, Innstillinger (+ Flere tjenester).
- Aktivering av Mynder Core gir Mynder Core-seksjon + Systemer (i Registre).
- Aktivering av Leverandør gir Leverandører-seksjon.
- Aktivering av Aktiva gir Aktiva under Registre.
- Aktivering av Agenter gir Agenter under Registre.
- Bli partner og Demoer er ikke synlige i sidemenyen for vanlige brukere.
