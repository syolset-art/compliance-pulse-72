
# Mynder Me: Aktivitetslogg med ansatt- og kundefaner

## Oversikt
Legger til en ny "Aktivitet"-fane i Mynder Me-dashbordet som viser konkrete hendelser -- godkjenninger, signeringer og tidsbesparelser. Fanen deles i to underfaner: **Ansatte** og **Kunder**, for a skille mellom interne og eksterne interaksjoner.

## Hva som lages

### Ny komponent: `ActivityTab`
En fane med to underkategorier (ansatte / kunder) som viser demo-data for:

**Ansatte-underfane:**
1. **Personvernerklæring godkjent** -- Melding sendt ut for 24 timer siden, 100% av 12 ansatte har godkjent oppdatert personvernerklæring. Viser tidsbesparelse (estimert: "Spart ca. 4 timer sammenlignet med manuell prosess").
2. **Arbeidskontrakt signert** -- En arbeidskontrakt er sendt ut og signert av en ansatt via Mynder Me.

**Kunder-underfane:**
3. **CEO-godkjenning fra Helsereiser AS** -- Lars Hansen (CEO, Helsereiser AS) har godkjent Terms & Conditions og personvernerklæring via Mynder Me. Viser rolle og selskapsnavn tydelig.

### Visuelt oppsett
- Hver hendelse vises som et kort med:
  - Ikon og fargekode etter type (grønn = fullført/godkjent)
  - Tidsstempel (relativ tid, f.eks. "for 24 timer siden")
  - Prosentbar for godkjenningsrate
  - ROI/tidsbesparelse-indikator der relevant
- Kunder vises med firmanavn, rolle og kontaktperson

### Dashboard-oppdatering
- Ny fane "Aktivitet" legges til i TabsList mellom "Varsler" og "Delt innhold"

## Tekniske detaljer

### Filer som opprettes
- `src/components/mynder-me/ActivityTab.tsx` -- Ny komponent med hardkodet demo-data (ingen nye tabeller), to underfaner via intern state

### Filer som endres
- `src/components/mynder-me/MynderMeDashboard.tsx` -- Import og registrering av ActivityTab i Tabs-komponenten

### Implementasjonsdetaljer
- Alt er demo-data (statisk) -- ingen nye database-tabeller
- Tidsstempel beregnes dynamisk relativt til `Date.now() - 24 timer`
- Tidsbesparelse beregnet som: 12 ansatte x 20 min manuelt = 4 timer, vs. 5 min med Mynder Me
- Bruker eksisterende UI-komponenter: Card, Badge, Progress, Tabs
