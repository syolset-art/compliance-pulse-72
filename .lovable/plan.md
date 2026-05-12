## Hva som endres

### 1. Partner-kort vises alltid i prototypen (Trust Profile preview)
Filen `src/pages/TrustCenterProfile.tsx` har allerede et Partner-kort under Dokumentasjon, men det er gated på `partnerInfo.hasPartner` (som krever ekte data i `company_profile`). For demo/prototyping fjerner vi gating og rendrer kortet med fallback-data:

- Navn: "Mynder MSP-partner AS" (eller `partnerInfo.partnerName` hvis satt)
- Type: "MSP" (eller `partnerInfo.partnerType` hvis satt)
- Beskrivelse: "Bistår med drift, sikkerhet og compliance — rapporterer modenhet og hendelser inn i Mynder."

Slik vises kortet uansett, og blir riktig så snart ekte partner-data finnes.

### 2. Fjerne rød readiness-banner + section-chips fra edit-/preview-siden (bilde 1)
I `src/pages/TrustCenterEditProfile.tsx`:

- Fjerne `<PublishingReadiness ... />` (linje 250–257) — den røde "Ikke klar for publisering"-banneren med 1/4-progressbar
- Fjerne hele "Quick nav tabs"-blokken med chips for Virksomhet / Kontakter / Datalagring / Personvern / Sikkerhet / Hendelser / Dokumentasjon / Detaljinnstillinger (linje 260–286)
- Fjerne tilhørende ubrukt import (`PublishingReadiness`)

### 3. Erstatte med en mykere Lara-anbefaling (bilde 2)
Legge til en ny inline-banner øverst (samme sted som readiness-banneren stod), i Mynder-stil:

- Lilla `bg-primary/5 border-primary/20`-kort
- Lara-avatar / `Sparkles`-ikon til venstre
- Tittel: **"Lara har en anbefaling til deg"**
- Tekst: *"Du har {N} oppgaver som krever oppmerksomhet, hvorav {K} er kritiske. Vil du starte en gjennomgang?"* — tallene utledes fra `sectionCompleteness` (manglende felter) eller hardkodes for prototypen (13 / 8) hvis logikken ikke finnes ennå
- To handlinger: primary-knapp **"Vis plan"** (scroller til første ufullstendige seksjon) og ghost-knapp **"Ikke nå"** (skjuler banneren via lokal state)

### Filer som endres
- `src/pages/TrustCenterProfile.tsx` — fjerne gating på Partner-kortet, hardkode fallback-tekst
- `src/pages/TrustCenterEditProfile.tsx` — fjerne PublishingReadiness + chips, legge til ny Lara-anbefalingsbanner

Ingen DB-endringer, ingen nye komponenter — alt gjøres inline i de to filene.
