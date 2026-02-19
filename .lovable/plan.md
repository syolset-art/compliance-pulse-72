

# Mynder Me: Separasjon av ansatte og kunders medarbeidere

## Oversikt
Restructurerer Mynder Me-dashbordet med to tydelige hovedseksjoner -- **Ansatte** og **Kunders medarbeidere** -- slik at det er klart hva som gjelder hvem. Kurs og delt innhold er kun for egne ansatte, mens kunder har sin egen seksjon med godkjenninger, tilkoblinger og aktivitet.

## Ny struktur

```text
Mynder Me
+--------------------------------------------------+
| Metrikk-kort (overordnet)                        |
+--------------------------------------------------+
| [ Ansatte ]  [ Kunders medarbeidere ]            |  <-- Hovedfaner (top-level)
+--------------------------------------------------+

Ansatte-fane:
  - Kurs (CoursesTab)
  - Aktivitet (ansatt-delen av ActivityTab)
  - Delt innhold (SharedContentTab)
  - Tilkoblinger (ansatte-tilkoblinger)

Kunders medarbeidere-fane:
  - Aktivitet (kunde-delen av ActivityTab)
  - Kundeorganisasjoner (oversikt)
  - Tilkoblinger (kunde-tilkoblinger)
```

## Hva som endres

### 1. MynderMeDashboard.tsx -- Ny toppniva-struktur
- Erstatter dagens flate fane-liste med to hovedfaner: **"Ansatte"** og **"Kunders medarbeidere"**
- Under "Ansatte": Underfaner for Kurs, Aktivitet, Delt innhold, Tilkoblinger
- Under "Kunders medarbeidere": Underfaner for Aktivitet, Organisasjoner, Tilkoblinger
- Metrikk-kort tilpasses: Ansatte-metrikkene (kurs, fullforinger) vises under ansatte-seksjonen, kundeorganisasjoner under kunde-seksjonen

### 2. ActivityTab.tsx -- Splittes i to komponenter
- **EmployeeActivitySection**: Personvernerklaring godkjent (100%), arbeidskontrakt signert
- **CustomerActivitySection**: Lars Hansen / Helsereiser AS godkjenning
- Fjerner den interne fane-veksleren (ansatte/kunder) som na finnes inne i ActivityTab, siden dette na handteres av toppniva-strukturen

### 3. MynderMe.tsx -- Oppdatert beskrivelse
- Legg til en kort forklaring under headeren som forklarer de to malgruppene

## Tekniske detaljer

### Filer som endres
- `src/components/mynder-me/MynderMeDashboard.tsx` -- Hovedrestrukturering med nestede Tabs
- `src/components/mynder-me/ActivityTab.tsx` -- Splittes til to eksporterte komponenter (EmployeeActivitySection og CustomerActivitySection)

### Implementasjonsdetaljer
- Bruker nestede Tabs-komponenter: ytre for ansatte/kunder, indre for underkategorier
- Visuelt skille med ulik bakgrunnsfarge eller ikon pa de to hovedfanene (Users-ikon for ansatte, Building2-ikon for kunder)
- Kurs-fanen og Delt innhold-fanen vises KUN under "Ansatte" -- de er ikke relevante for kunders medarbeidere
- Avviksbanneret (fra ansatte) forblir globalt synlig uavhengig av valgt fane
- Ingen nye database-tabeller eller API-endringer -- kun UI-omstrukturering
