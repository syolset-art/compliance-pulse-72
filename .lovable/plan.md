

## Analyse av nåværende meny

Menyen har i dag **6 seksjoner** med til sammen **~30 synlige lenker**. Flere problemer:

```text
Nåværende struktur (6 grupper, ~30 lenker):
├─ Dashboard
├─ Dashboard 2.0 (Ny)
├─ ORGANISASJON
│   ├─ Krav og standarder    ← duplikat (også i Trust Center)
│   ├─ Arbeidsområder
│   ├─ Avvik
│   ├─ Oppgaver
│   └─ Rapporter             ← duplikat (også i Kommer)
├─ MODULER
│   ├─ Leverandører
│   ├─ Systemer
│   ├─ Enheter
│   └─ Forespørsler          ← overlap med Trust Center
├─ ADMINISTRASJON (▼)
│   ├─ Organisasjon
│   ├─ Tilgangsstyring
│   ├─ Dokumenter
│   └─ Varslinger
├─ TRUST CENTER (▼)
│   ├─ Trust Profile
│   ├─ Rediger profil
│   ├─ Products & Services
│   ├─ Krav og standarder    ← duplikat
│   ├─ Dokumentasjon & Evidens
│   └─ Contact & Requests
├─ KOMMER (▼, Beta)          ← 9 beta-lenker, mye støy
│   └─ (9 items)
├─ Start demo på nytt
└─ BEDRIFT (▼)
    ├─ Innstillinger, Faktura, Abonnement...
    └─ Partner (▼) med 5 underlenker
```

### Problemer identifisert

1. **Duplikater**: "Krav og standarder" finnes to steder, "Rapporter" likeså, "Forespørsler" overlapper med "Contact & Requests"
2. **For mange seksjoner**: 6 grupper + bedriftsmenyen = 7 nivåer
3. **"Kommer"-seksjonen**: 9 beta-lenker gir støy uten verdi for brukeren
4. **To dashboards**: Dashboard og Dashboard 2.0 bør velges, ikke begge
5. **Trust Center er fragmentert**: "Rediger profil" trenger ikke egen menylenke

### Foreslått ny struktur (3 grupper, ~15 synlige lenker)

```text
Ny struktur:
├─ Dashboard
├─ STYRINGSVERKTØY
│   ├─ Krav og standarder
│   ├─ Arbeidsområder
│   ├─ Oppgaver
│   ├─ Avvik
│   └─ Rapporter
├─ REGISTRE
│   ├─ Leverandører
│   ├─ Systemer
│   ├─ Enheter
│   └─ Forespørsler
├─ TRUST CENTER (▼)
│   ├─ Trust Profile
│   ├─ Products & Services
│   └─ Dokumentasjon & Evidens
├─ ⚙ Innstillinger (▼)      ← slår sammen Admin + bedrift
│   ├─ Organisasjon
│   ├─ Tilgangsstyring
│   ├─ Varslinger
│   └─ Abonnement & Faktura
└─ BEDRIFT (nederst, som nå)
    └─ Partner (▼, kun for partnere)
```

### Konkrete endringer

**Fil: `src/components/Sidebar.tsx`**

1. **Fjern Dashboard 2.0** fra `dashboardNav` (behold kun én dashboard)
2. **Slå sammen "Organisasjon" og "Moduler"** til to tydelige grupper:
   - **Styringsverktøy**: Krav og standarder, Arbeidsområder, Oppgaver, Avvik, Rapporter
   - **Registre**: Leverandører, Systemer, Enheter, Forespørsler
3. **Rydd Trust Center**: Fjern duplikaten "Krav og standarder" og "Rediger profil" (tilgjengelig inne i Trust Profile)
4. **Slå sammen Administrasjon med bedriftsinnstillinger** til én "Innstillinger"-meny: Organisasjon, Tilgangsstyring, Varslinger, Abonnement & Faktura
5. **Fjern "Kommer"-seksjonen** helt (beta-funksjonalitet bør ikke ta plass i daglig navigasjon — kan nås via URL eller feature-flags)
6. **Fjern duplikate lenker** i bedriftsmenyen nederst (Faktura, Krav og standarder finnes allerede i hovedmenyen)
7. **Behold "Start demo på nytt"** men flytt den inn i Innstillinger-menyen

Resultatet er en reduksjon fra ~30 til ~15 synlige lenker, med 3 tydelige grupper i stedet for 6.

Ingen databaseendringer.

