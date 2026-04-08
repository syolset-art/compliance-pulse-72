

## Plan: Arbeidsområde-tilknytning og tiltaksansvarlig i avviksdialogen

### Oversikt
Utvide "Legg til avvik"-dialogen slik at brukeren kan knytte avviket til arbeidsområder, velge tiltaksansvarlig basert på arbeidsområdenes ansvarlige personer, og eventuelt sette seg selv som tiltaksansvarlig for å se foreslåtte tiltak.

### Endringer

**1. Nytt steg/seksjon i AddDeviationDialog.tsx (confirm-steget)**

- Legg til et spørsmål: "Er avviket tilknyttet arbeidsområder?" med tre valg:
  - **Alle arbeidsområder**
  - **Spesifikke arbeidsområder** (viser multi-select med arbeidsområder fra `work_areas`-tabellen)
  - **Ingen spesifikke**
- Hent arbeidsområder via `useQuery` fra `work_areas`-tabellen (id, name, responsible_person)
- Når spesifikke arbeidsområder velges, populer "Tiltaksansvarlig"-dropdown med `responsible_person` fra de valgte arbeidsområdene (deduplisert)
- Endre label fra "Ansvarlig" til "Tiltaksansvarlig"
- Legg til en "Meg selv"-knapp/valg som setter innlogget bruker som tiltaksansvarlig
- Når brukeren setter seg selv som tiltaksansvarlig, vis en info-boks med tekst om at foreslåtte tiltak vil bli tilgjengelige etter opprettelse

**2. Database: Nye kolonner på system_incidents**

- `work_area_scope` (text, default null) — verdier: `all`, `specific`, `none`
- `linked_work_area_ids` (uuid[], default '{}') — liste over tilknyttede arbeidsområder

**3. Lagring**

- Oppdater insert-logikken til å inkludere `work_area_scope` og `linked_work_area_ids`
- Feltet `responsible` brukes fortsatt for tiltaksansvarlig

**4. Oppdater formData state**

- Legg til `workAreaScope: "none" | "all" | "specific"`
- Legg til `linkedWorkAreaIds: string[]`
- Oppdater reset-logikk i `handleClose`

### Tekniske detaljer

- Arbeidsområder hentes med: `supabase.from("work_areas").select("id, name, responsible_person")`
- Tiltaksansvarlig-listen bygges dynamisk fra valgte arbeidsområders `responsible_person` + hardkodet personliste + "Meg selv"
- DB-migrasjon: `ALTER TABLE system_incidents ADD COLUMN work_area_scope text, ADD COLUMN linked_work_area_ids uuid[] DEFAULT '{}'`

