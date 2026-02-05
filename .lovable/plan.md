

# Implementasjon: Redigering av risikoscenario med visuell matrise og suksess-tilbakemelding

## Oppsummering

Denne planen implementerer en komplett brukerflyt for redigering av risikoscenarioer med:
1. **Visuell risikomatrise** som erstatter de tekstbaserte badge-indikatorene
2. **Redigerbar dialog** for å endre scenariodetaljer og tiltaksstatus
3. **Suksess-dialog med konfetti** som bekrefter risikoreduksjon

---

## Del 1: Ny database-tabell for prosess-risikoscenarioer

Oppretter en dedikert tabell for å lagre risikoscenarioer knyttet til prosesser:

```sql
CREATE TABLE process_risk_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES system_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frameworks TEXT[] DEFAULT '{}',
  likelihood TEXT DEFAULT 'medium',
  consequence TEXT DEFAULT 'medium',
  risk_level TEXT DEFAULT 'medium',
  mitigation TEXT,
  mitigation_owner TEXT,
  mitigation_status TEXT DEFAULT 'not_started',
  previous_risk_level TEXT,
  risk_reduced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Del 2: Visuell risikomatrise-komponent

Ny komponent `RiskMatrixVisual.tsx` som viser en interaktiv 5x5 matrise:

```text
                       KONSEKVENS
                  Lav   Mod   Høy   Kritisk
         Kritisk  [M]   [H]   [K]   [K]
SANNSYNLIGHET  
         Høy     [M]   [H]   [K]   [K]
         Moderat [L]   [M]   [H]   [K]   <-- Nåværende posisjon markert
         Lav     [L]   [L]   [M]   [H]
```

**Funksjoner:**
- Interaktiv klikking for å velge sannsynlighet/konsekvens
- Markert celle viser nåværende risiko
- Fargekodet etter risikonivå (grønn, gul, oransje, rød)
- Animert overgang når risiko endres

---

## Del 3: EditRiskScenarioDialog

Dialog med tre seksjoner:

**Seksjon A - Scenario-detaljer:**
- Tittel (input)
- Beskrivelse (textarea)
- Rammeverk (multi-select badges)

**Seksjon B - Risikoanalyse (visuell matrise):**
- Interaktiv risikomatrise
- Beregnet risikonivå vises automatisk
- Før/etter-visning når status endres

**Seksjon C - Tiltak:**
- Tiltak-beskrivelse (textarea)
- Tiltaksansvarlig (input)
- Status (dropdown: Ikke håndtert, Under arbeid, Håndtert)

---

## Del 4: RiskReductionSuccessDialog

Suksess-dialog som vises når risiko reduseres:

```text
+--------------------------------------------------+
|           [Checkmark i grønn sirkel]             |
|                                                  |
|              Godt jobbet!                        |
|                                                  |
|    Risikoen er redusert fra HØY til AKSEPTABEL   |
|                                                  |
|    [Rød badge] ───────> [Grønn badge]           |
|                                                  |
|    Tiltak implementert:                          |
|    "Logghygiene: dataminimering..."              |
|                                                  |
|    Påvirker samsvar med:                         |
|    [GDPR] [ISO27001] [NIS2]                      |
|                                                  |
|                [Lukk]                            |
+--------------------------------------------------+
```

**Funksjoner:**
- Konfetti-effekt ved åpning
- Visuell overgang fra gammel til ny risiko
- Viser implementert tiltak
- Liste over påvirkede rammeverk

---

## Del 5: Oppdatert ProcessRiskTab

Endringer i eksisterende komponent:

1. **Erstatter mock-data** med database-spørring via `useQuery`
2. **Kobler Edit-knappen** til `EditRiskScenarioDialog`
3. **Legger til visuell matrise** i analyse-seksjonen i stedet for bare badges
4. **Legger til "Vis detaljer"-lenke** som ekspanderer scenariokortet
5. **Kobler "Endre"-knappen** nederst til dialogen

---

## Fil-oversikt

| Fil | Handling |
|-----|----------|
| `src/components/process/RiskMatrixVisual.tsx` | Ny - Visuell 5x5 risikomatrise |
| `src/components/dialogs/EditRiskScenarioDialog.tsx` | Ny - Redigeringsdialog |
| `src/components/dialogs/RiskReductionSuccessDialog.tsx` | Ny - Suksess-tilbakemelding |
| `src/components/process/tabs/ProcessRiskTab.tsx` | Oppdatert - Integrerer nye komponenter og matrise |
| Database-migrering | Ny tabell `process_risk_scenarios` |

---

## Teknisk detaljer

### Risikoberegning

```typescript
const calculateRiskLevel = (likelihood: string, consequence: string): string => {
  const matrix: Record<string, Record<string, string>> = {
    low: { low: 'acceptable', medium: 'low', high: 'medium', critical: 'high' },
    medium: { low: 'low', medium: 'medium', high: 'high', critical: 'critical' },
    high: { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' },
    critical: { low: 'high', medium: 'critical', high: 'critical', critical: 'critical' }
  };
  return matrix[likelihood]?.[consequence] || 'medium';
};
```

### Automatisk risikoreduksjon

Når `mitigation_status` settes til `completed`:
- Systemet foreslår å redusere sannsynlighet med ett nivå
- Beregner ny risiko
- Lagrer `previous_risk_level` for historikk
- Setter `risk_reduced_at` til nåværende tidspunkt
- Viser suksess-dialog med konfetti

### RLS-policy

```sql
ALTER TABLE process_risk_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to process_risk_scenarios"
ON process_risk_scenarios FOR ALL
USING (true)
WITH CHECK (true);
```

---

## Brukeropplevelse

1. **Klikk "Endre"** på risikokort
2. **Dialog åpnes** med visuell matrise og skjema
3. **Endre status** til "Håndtert"
4. **Klikk "Lagre"**
5. **Suksess-dialog** vises med konfetti og positiv melding
6. **Risikokort oppdateres** med ny farge og status

