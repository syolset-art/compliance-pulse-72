# Mynder-score forklaring — ny side

## Hva som endres

**1. `src/pages/MaturityMethodology.tsx` — full rewrite**

Erstatt hele dagens 790-linjers side med en stram, ryddig forklaring basert på PDF-en. All annen seksjon (gammel terminologi, dupliserte forklaringer, ekstra ressurslinker) fjernes.

Struktur (én kolonne, maks bredde, god luft):

- **Hero**: Tittel "Hvordan Mynder-scoren fungerer", undertittel "Bygget på bekreftede bevis, ikke påstander." + kort 3-linjers ingress fra PDF.
- **Slik bygges scoren** — kort tekst + enkel visualisering (Regelverk → Kontrollpunkter → 5 områder). Bygges med Tailwind/lucide (Compass, FileCheck, Layers), ingen tunge bilder.
- **De fem nivåene** — ren tabell (Card + Table), nivå 0–4 med beskrivelse og prosent.
- **De fem områdene og vekten** — ren tabell, område / spørsmål / vekt (30/25/20/15/10).
- **Spørsmål og svar** — `Accordion` (shadcn) med spørsmålene fra PDF, gruppert i tre seksjoner:
  - Generelt
  - For deg som vurderer en leverandør
  - For deg som har en Trust Profile
- **Fotnote**: "Inspirert av PECB — internasjonalt sertifiseringsorgan for ISO-standarder." + lenke tilbake.

Bruker kun semantiske tokens (`text-foreground`, `bg-card`, `border-border`, `text-primary`). Ingen pills, ingen statuspunkter, ingen ekstra CTA-er. i18n holdes på norsk (siden er norsk i dag og PDF-en er norsk).

**2. Portal-inngang — én tydelig plassering**

Legg til menypunkt **"Om Mynder-scoren"** i `src/components/TopBar.tsx` brukermenyen (Dropdown), under språkvalg, med `Compass`-ikon → navigerer til `/resources/maturity`. Dette gir global, alltid-tilgjengelig tilgang uavhengig av side. Eksisterende lenker fra `MaturityDashboard`, `Resources`, `ControlAreaBreakdownDrawer`, `MynderControls` beholdes (peker allerede dit).

## Ikke i scope

- Ingen endring i scoring-logikk eller datamodell.
- Ingen endring i sidebar-strukturen.
- Ingen ny route — `/resources/maturity` gjenbrukes.
