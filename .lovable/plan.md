## Mål

Når brukeren ikke har aktivert Trust Profilen, skal `/trust-center/profile` ikke vise noe innhold (ingen score, ingen faner, ingen Vendor Hub, ingen dokumenter). I stedet ser brukeren én ren «landing» som forklarer hva Trust Profile er og har én tydelig CTA: **«Aktiver Trust Profile»**.

Først når aktiveringsveiviseren er fullført, låses hele profilen opp.

## Hvorfor

I dag finnes det flere veier inn til siden som ender opp med en delvis utfylt profil (auto-seed, demo, tidligere besøk) selv før brukeren bevisst har aktivert. Det gir:
- Tall og score som ikke betyr noe ennå
- Faner (Preview / Publish / Benchmark) og Vendor Hub som forvirrer
- Uklart om brukeren faktisk «eier» profilen eller ikke

Aktivering bør være den tydelige inngangsporten — alt annet skal være låst bak den.

## UX

**Ikke-aktivert tilstand (ny standard):**
```text
┌──────────────────────────────────────────────────┐
│  🛡  Trust Profile                                │
│                                                  │
│  Din offentlige tillitsside — modenhet,          │
│  dokumentasjon og sertifiseringer samlet.        │
│                                                  │
│  Ikke aktivert ennå                              │
│  • Ingen score er beregnet                       │
│  • Ingen informasjon er delt                     │
│                                                  │
│  [ Aktiver Trust Profile ]  [ Les mer ]          │
└──────────────────────────────────────────────────┘
```
- Sidebar/topbar som vanlig.
- Ingen score-gauge, ingen faner, ingen Vendor Hub, ingen dokumentliste.
- CTA åpner samme `ActivateTrustProfileWizard` som i dag.
- «Les mer» åpner det samme hjelpe-drawer-innholdet som benchmark-/info-ikonet bruker.

**Aktivert tilstand:** uendret — full profil som i dag.

## Aktiverings-signal

Én sannhetskilde, sjekket i denne rekkefølgen:
1. `asset.metadata.activated_at` (settes av wizardens `onCompleted`) — primær.
2. Fallback: `localStorage.getItem("mynder.trustprofile.activated")` — beholdes for bakoverkompatibilitet med eksisterende demobrukere.

Helper: `isTrustProfileActivated(asset)` i `src/pages/TrustCenterProfile.tsx` (lokal, ingen ny fil nødvendig).

## Endringer (kun frontend)

**`src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`**
- I `onCompleted`-flyten, etter at self-asset er opprettet/oppdatert: skriv `metadata.activated_at = new Date().toISOString()` på asset-raden, i tillegg til localStorage-flagget som allerede settes.

**`src/pages/TrustCenterProfile.tsx`**
- Fjern auto-seed-fallbacken på linje 233–244. Hvis bruker ikke er aktivert, skal vi ikke seede stille i bakgrunnen — vi skal vise låst tilstand.
- Legg til `isActivated`-beregning rett etter at `asset` er lastet.
- Hvis `!isActivated && !propAssetId && !readOnly`: render en ny lokal `<TrustProfileLockedState />` (Sidebar + tom hovedflate + kort med CTA) i stedet for hele dagens `return`-tre. Wizardens `<Dialog>`-instans monteres fortsatt slik at CTA-en kan åpne den.
- Behold dagens oppførsel for `readOnly` (offentlig visning via `PublicTrustCenterLayout` og MSP-partnervisning) og når `propAssetId` er satt — disse skal alltid vise innholdet, siden de aldri er «egen, ikke-aktivert» tilstand.
- Etter at wizardens `onCompleted` invalidates queryen, vil `asset.metadata.activated_at` være satt og siden re-renders med full profil automatisk.

**Ny lokal komponent: `TrustProfileLockedState`** (samme fil, ikke egen modul)
- Ett `Card`-element, sentrert, maks ~640 px bred.
- Skjold-ikon, tittel, kort beskrivelse, to-punkts «Ikke aktivert»-liste, primær- og sekundær-knapp.
- Bruker eksisterende design-tokens (`bg-card`, `text-muted-foreground`, `bg-primary`).

## Det som bevisst IKKE endres

- Aktiveringsveiviseren selv (4-stegs-flyten med Lara-beregning).
- Offentlig visning (`/t/{slug}` via `PublicTrustCenterLayout`) — den får alltid `assetId` som prop og er kun synlig når eier har publisert.
- Sidebar-menypunkter — Trust Profile-menypunktet vises som før, men selve siden er låst.
- Andre Trust Center-sider (Compliance, Certifications, Policies, Products) — utenfor scope for denne endringen. Si fra hvis du vil at samme gate skal gjelde dem også.

## Spørsmål til deg før jeg bygger

1. **Demo-modus:** I demoer i dag aktiverer vi ofte profilen automatisk via `seedDemoTrustProfile`. Skal demo-knappen i sidebar fortsatt kunne «hoppe over» aktiveringsveiviseren og gå rett til ferdig profil, eller skal også demo gå gjennom wizardens UX?
2. **Eksisterende brukere:** Skal alle som allerede har en self-asset i dag automatisk regnes som «aktivert» (vi setter `activated_at = updated_at` ved første lasting), eller skal de møte den låste tilstanden og kjøre wizarden én gang?