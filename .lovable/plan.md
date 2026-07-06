## Mål
Endre titlene på NextActionCards (dashboardets "Neste handling"-kort) fra beskrivende substantivfraser til inviterende, handlingsorienterte setninger som tydelig sier hva brukeren skal gjøre.

## Omfang
Kun `NextActionCards`-komponenten på dashboardet. Andre steder (sjekklister, framework-sider, widgets) beholder de opprinnelige beskrivende navnene.

## Endringer

### 1. Utvid datamodellen
- I `ComplianceRequirement`-grensesnittet (`src/lib/complianceRequirementsData.ts`) legges til to valgfrie felter:
  - `action_title?: string` (engelsk)
  - `action_title_no?: string` (norsk)

### 2. Populer handlingsorienterte titler
- I `src/lib/complianceRequirementsData.ts` tilføyes `action_title` / `action_title_no` på de viktigste kravene (kritisk/høy prioritet, spesielt `agent_capability === 'manual'` — altså de som mest sannsynlig vises i NextActionCards).
- Eksempel på transformasjon:
  - "Prosedyrer for varsling av databrudd" → "Sett opp prosedyrer for varsling av databrudd"
  - "Menneskelig tilsyn" → "Etabler menneskelig tilsyn"
  - "Samsvarsvurdering" → "Gjennomfør samsvarsvurdering"
  - "Policies for information security" → "Create and approve information security policies"

### 3. Oppdater NextActionCards
- I `src/components/dashboard-v2/NextActionCards.tsx` endres visningen av tittel fra:
  ```
  action.name_no / action.name
  ```
  til:
  ```
  action.action_title_no || action.name_no    // norsk
  action.action_title || action.name            // engelsk
  ```

## Hva som IKKE endres
- `name` og `name_no` beholdes uendret for all annen bruk.
- Ingen databaseendringer (kravnavn kommer fra statisk datafil).
- Ingen endringer i andre komponenter enn NextActionCards.

## Teknisk detalj
- `complianceRequirementsData.ts` inneholder ~1700 linjer med krav fra ISO 27001, GDPR, AI Act og NIS2.
- For å unngå unødvendig arbeid fokuseres det på å fylle ut `action_title` kun for de kravene som faktisk kan dukke opp i NextActionCards (uferdige manuelle krav med kritisk/høy prioritet).