

# Utviklere-meny med Trust Profile Arkitektur-side

## Oversikt
Legger til et nytt "Utviklere"-menypunkt i sidemenyen med en undermeny. Første side blir en arkitektur- og datamodell-dokumentasjon som forklarer logikken bak Trust Profiles -- inkludert rollene fra whiteboard-skissen.

## Hva som lages

### 1. Ny side: `/developer/trust-profile-architecture`
En dokumentasjonsside med visuell forklaring av Trust Profile-modellen:

**Rolleoversikt (basert på whiteboard-skissen):**
- **Grnn (Karl / Virksomheten)**: Bruker Mynder Core til a kartlegge systemer og leverandorer. Oppretter og vedlikeholder egne data i Trust Profiler.
- **Sort (AI / Lara)**: AI-generert innhold -- automatisk klassifisering, risikovurdering, forslag til regelverk.
- **Bla (Tobby / Kontakt opprettet)**: En Trust Profil er opprettet med kontaktinformasjon, men eieren har ikke tatt eierskap enna. Ingen foresporsler sendt/mottatt.
- **Rod (Underleverandor / SaaS / Konsulent)**: Eieren av Trust Profilen som har tatt eierskap og kan svare pa foresporsler, laste opp dokumenter direkte i sin TP.

**Seksjoner pa siden:**
1. **Oversikt** -- Hva er en Trust Profil og hvorfor
2. **Roller og dataflyt** -- Visuelt diagram med fargekodede roller
3. **Livssyklus** -- Fra opprettelse (bla) via forespørsel til aktiv samhandling (rod)
4. **Datamodell** -- Tabeller og relasjoner (assets, vendor_documents, asset_relationships, customer_compliance_requests)
5. **Forsporselsflyt** -- Karl sender forespørsel -> Tobby mottar e-post -> Tobby velger a svare via e-post eller overta sin TP

### 2. Sidebar: Nytt "Utviklere"-menypunkt
- Ikon: `Code2` fra lucide-react
- Ekspanderbar undermeny (samme monster som Admin-menyen)
- Forste undermeny-element: "TP Arkitektur"
- Plasseres etter Resources-lenken

### 3. Ruting
- Ny rute `/developer/trust-profile-architecture` i App.tsx

## Tekniske detaljer

### Filer som opprettes
- `src/pages/developer/TrustProfileArchitecture.tsx` -- Hovedsiden med dokumentasjon, diagrammer og fargekodede rollekort

### Filer som endres
- `src/components/Sidebar.tsx` -- Legger til "Utviklere"-seksjon med Code2-ikon og undermeny
- `src/App.tsx` -- Ny rute for developer-siden

### Sideoppsett
Siden bruker standard layout (Sidebar + main) og inneholder:
- Kort med fargekodede roller (gronn, sort, bla, rod) som forklarer hvem som genererer hvilke data
- Flytdiagram i ren HTML/CSS som viser livssyklusen til en Trust Profil
- Tabell-oversikt over relevante database-tabeller og deres relasjoner
- Steg-for-steg-forklaring av foresporselsflyt mellom Karl og Tobby

