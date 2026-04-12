

## Plan: Gjør «Bruk og kontekst»-fanen redigerbar og forklarende

### Problem
Kritikalitet, Risikonivå og GDPR-rolle vises som statiske kort uten mulighet for redigering. Brukeren forstår ikke hva som er redigerbart, hvordan disse feltene påvirker modenhetsscoren, eller at Lara kan anbefale verdier.

### Endringer i `src/components/asset-profile/tabs/VendorUsageTab.tsx`

#### 1. Redigerbare felter med Select-dropdown
Erstatt de tre statiske kortene med interaktive Select-komponenter:
- **Kritikalitet**: Dropdown med valgene Lav / Middels / Høy / Kritisk. Fargekodet badge viser nåværende verdi. Under vises en kort forklaring: *«Kritikalitet viser hvor viktig denne leverandøren er for virksomheten. Høy kritikalitet krever strengere oppfølging.»*
- **Risikonivå**: Dropdown med Lav / Middels / Høy. Inkluderer en liten «La Lara foreslå»-knapp som kaller AI-agenten for å anbefale risikonivå basert på leverandørens kontekst (kategori, land, datatyper). Forklaring: *«Risikonivået påvirker oppfølgingskrav og kontrollfrekvens.»*
- **GDPR-rolle**: Dropdown med Databehandler / Underdatabehandler / Ingen persondata / Ikke satt. Forklaring: *«GDPR-rollen bestemmer hvilke kontroller og dokumentasjonskrav som gjelder (f.eks. DPA-krav).»*

#### 2. Kobling til modenhet
Under hvert redigerbart felt vises en kompakt linje som forklarer påvirkningen:
- Kritikalitet: «Påvirker kontrollområde: Tredjepartstyring» 
- Risikonivå: «Påvirker kontrollområde: Drift og sikkerhet»
- GDPR-rolle: «Påvirker kontrollområde: Personvern og datahåndtering»

Disse er klikkbare og scroller til relevant modenhetsseksjon i Veiledning-fanen.

#### 3. Lagring
Bruker `useMutation` med `supabase.from("assets").update(...)` for å lagre endringer direkte til `criticality`, `risk_level` og `gdpr_role`-feltene. Invaliderer relevante queries etter lagring.

#### 4. Visuell tydelighet
- Hvert redigerbart felt får et blyant-ikon og hover-effekt som signaliserer at det kan endres
- Feltverdier vises med semantiske farger (grønn for lav risiko, rød for høy)
- En liten info-banner øverst: *«Disse innstillingene bestemmer hvilke kontroller og risikovurderinger som kreves for denne leverandøren»*

### Filer som endres
1. **`src/components/asset-profile/tabs/VendorUsageTab.tsx`** — Hovedendring: redigerbare Select-felter, forklaringstekster, AI-forslag-knapp, lagring via mutation
2. **`src/components/trust-controls/TrustControlsPanel.tsx`** — Oppdater action-lenker for `risk_level_defined` og `criticality_defined` til å peke mot «Bruk og kontekst»-fanen i stedet for «Revisjon og risiko»

### Ingen databaseendringer

