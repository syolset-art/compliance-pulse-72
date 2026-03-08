

# Analyse: Prototypens logikk vs. scorenotatet

## Sammendrag av funn

Prototypen har en grunnstruktur som delvis samsvarer med notatet, men har flere viktige avvik som bor adresseres. Her er en systematisk gjennomgang:

---

## 1. Modenhetsskala (notatets seksjon 5.1)

**Notatet**: 0-4 skala per krav/kontroll (Ikke startet / Planlagt / Dokumentert / Implementert / Verifisert), med `score_krav = nivå / 4`.

**Prototypen**: Bruker binær status (`not_started`, `in_progress`, `completed`) pluss `progress_percent`. Det finnes ingen 0-4 modenhetsskala. Score beregnes som `completed / total * 100`.

**Avvik**: Vesentlig. Prototypen mangler den granulære 5-nivå skalaen som er kjernen i notatet. Et krav er enten ferdig eller ikke -- det finnes ingen differensiering mellom "planlagt", "dokumentert", "implementert" og "verifisert".

---

## 2. Scope-regel (seksjon 6)

**Notatet**: `scope = Relevant && Aktivert`. Kun krav i scope teller i beregningen.

**Prototypen**: Alle krav i den statiske listen (`complianceRequirementsData.ts`) telles alltid. Det finnes ingen mekanisme for a merke krav som "ikke relevant" eller filtrere pa aktiverte kontrollfamilier.

**Avvik**: Mangler. Ingen relevans-markering eller scope-filtrering.

---

## 3. Aggregering og dimensjoner (seksjon 3 og 6)

**Notatet**: Tre dimensjoner -- per regelverk, per omrade (4 domener), per objekt.

**Prototypen**:
- **Per regelverk**: Delvis -- kan filtrere pa `framework_id` (iso27001, gdpr, ai-act)
- **Per omrade**: Bruker 4 `sla_category`-verdier (governance, operations, identity_access, supplier_ecosystem) som matcher notatets domener. OK.
- **Per objekt**: Ikke implementert.

**Dashboard (ComplianceShield)**: Viser score per *domain* (privacy/security/ai) -- dette er per-regelverk-dimensjonen, ikke per-omrade. Notatet sier dashboardet bor vise begge.

---

## 4. Foundation-status (seksjon 11A)

**Notatet**: Foundation er en systemberegnet indikator. 4 domener x 4 kontroller. Kontroll "OK" nar niva >= 2. Domene oppfylt nar >= 3 av 4 er OK. "Established" nar alle 4 domener oppfylt.

**Prototypen**: `getGovernanceLevelLabel()` returnerer hardkodet "Established". Ingen faktisk beregning av Foundation-status basert pa kontroller.

**Avvik**: Vesentlig. Foundation er en statisk label, ikke en beregnet indikator.

---

## 5. Trust Score (seksjon 12)

**Notatet**: Trust Score = Compliance (60%) + Risk exposure (30%) + Coverage (10%).

**Prototypen**: Trust Score pa Trust Profile (`AssetMetrics`) er basert pa 10 vektede sjekklistepunkter (eier, beskrivelse, dokumenter etc.) -- dette er en *objektkompletthets-score*, ikke en compliance/risk/coverage-kombinasjon.

**Dashboard (ComplianceShield)**: Score = `completed / total * 100` av alle krav. Enklere enn notatet, men narmere i intensjon.

**Avvik**: Vesentlig. Ingen av prototypens scorer matcher notatets Trust Score-formel.

---

## 6. useMaturityScore (separat modell)

Prototypen har en helt annen modenhetsmodell i `useMaturityScore.ts` som bruker poeng-basert logikk (frameworks=5p, tasks=2-3p, systems=3-5p etc.) med nivaer beginner/developing/established/mature. Denne modellen er *uavhengig* av compliance-kravene og matcher ikke notatets modell i det hele tatt.

---

## 7. Maturity Levels (certificationPhases.ts)

**Notatet**: Prosess-steg (Foundation/Implementering/Drift) avledes fra kontrollnivaer 0-4.

**Prototypen**: 5 maturity levels (initial/defined/implemented/measured/optimized) med prosentintervaller. 5 certification phases (foundation/implementation/operation/audit/certification) med egne prosentintervaller. Disse er to parallelle systemer som ikke er koblet til en 0-4 kontrollskala.

---

## 8. Vekting (seksjon 7)

**Notatet**: Standard vekt=1, valgfritt 1-3. Vektet formel: `sum(score * vekt) / sum(vekt)`.

**Prototypen**: Ingen vekting av krav. Alle krav teller likt i `completed/total`.

---

## 9. Evidens-krav (seksjon 5)

**Notatet**: Niva 4 krever minst en evidenslenke.

**Prototypen**: `evidence_notes` felt finnes i `requirement_status`, men det er ingen logikk som hindrer niva 4 uten evidens.

---

## Oppsummering: Hva bor endres

### Prioritet 1 -- Kjernemodell
1. **Innfore 0-4 modenhetsskala** pa `requirement_status` (erstatte/utvide binart status-felt)
2. **Beregne score som gjennomsnitt av (niva/4)** i stedet for completed/total
3. **Legge til scope-logikk** (relevant/aktivert-flagg pa krav)

### Prioritet 2 -- Foundation og Trust Score
4. **Implementere Foundation-beregning** basert pa 4 domener x 4 kontroller
5. **Implementere Trust Score-formel**: Compliance 60% + Risk 30% + Coverage 10%

### Prioritet 3 -- Dashboard og visning
6. **Vise begge dimensjoner i dashboard**: per regelverk OG per omrade
7. **Fjerne/konsolidere useMaturityScore** -- den poengbaserte modellen er i konflikt med notatets modell

### Prioritet 4 -- Utvidelser
8. Stotte vekting (kan vare standard=1 i V1)
9. Evidens-gate for niva 4
10. Aktiverbare kontrollfamilier

Skal jeg implementere disse endringene? Anbefaler a starte med Prioritet 1 (kjernemodellen) og bygge oppover.

