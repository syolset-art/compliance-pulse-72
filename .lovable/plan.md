## Vurdering: Er Oppgavesiden agentisk nok?

**Kort svar: Delvis.** Siden har god agentisk *intensjon* (Lara-utkast, godkjenning av høyrisiko, "La Lara lage utkast"-knapp), men den bruker **ingen** av Mynders delte agent-komponenter. Hver Lara-interaksjon er bygget fra scratch lokalt i `Tasks.tsx`, og mangler Mynders signaturmønstre: agentisk plan-banner, capability-badges, og live "AI jobber"-tilstand.

### Hva som finnes i Mynders agent-bibliotek (men ikke brukes på Oppgaver)
- `LaraRecommendationBanner` (`src/components/lara/`) — kompakt → ekspanderbar agentisk plan med stegvis gjennomgang, kritikalitetsfarger, "Be Lara håndtere det"
- `AgentCapabilityBadge` / `AgentCapabilitySummary` (`src/components/compliance/`) — viser hva Lara kan gjøre automatisk vs. assistert vs. manuelt
- `AIWorkingWidget` (`src/components/compliance/`) — live status mens Lara arbeider (i dag bruker Tasks bare en `Loader2`-spinner og en toast)
- `InlineDeviationAgent` (`src/components/deviations/`) — mønster for inline agent-handling i en liste

### Konkrete gap på `/tasks` i dag
1. **Ingen agentisk inngang øverst.** Siden åpner med en filterstripe. Andre Mynder-flater (Vendor Profile, Veiledning fra Mynder) åpner med `LaraRecommendationBanner` som sier "Lara har lagt en plan" og lar brukeren bla gjennom topp-N kritiske oppgaver med tydelig "Be Lara håndtere det"-CTA.
2. **"La Lara lage utkast" er gjemt bak ekspandering.** Man må klikke et kort før man ser at Lara kan hjelpe. Agentiske flater i Mynder eksponerer evnen umiddelbart.
3. **"Lara jobber…" er bare en spinner i en knapp.** Ingen synlig progresjon, ingen "Lara analyserer Hubspot-vilkår → genererer DPA-utkast → klar for gjennomgang"-stegvis tilbakemelding (slik `AIWorkingWidget` gjør).
4. **Ingen capability-merking per oppgave.** I dag står det bare "Lara kan hjelpe" som flat badge. `AgentCapabilityBadge` skiller mellom *Automatisk*, *Assistert (Lara)*, *Manuell* — i tråd med Mynders 3-nivå AI-autonomi-filosofi (core memory).
5. **Manglende batch-handling.** Agentisk UX innebærer at Lara kan ta flere oppgaver i én økt. I dag er hver handling per kort.
6. **Mangler "Lara kan rydde X av Y oppgaver nå"-oppsummering.** Et klassisk agentisk hook.
7. **Toast-only fullføring.** Når Lara er ferdig sees kun en toast. Bør ha vedvarende "Utkast klart for gjennomgang"-tilstand på kortet.

---

## Foreslåtte endringer

### 1. Topp-banner: agentisk plan (gjenbruk `LaraRecommendationBanner`)
Plasseres rett under sidetittelen, over filterstripen. Mappe `autoTasks` → `LaraPlanTask[]`, vise topp 3–5 kritiske, med "Be Lara håndtere det" som primær-CTA og "Åpne oppgave" som sekundær. Dette gir umiddelbar agentisk inngang, identisk mønster som Vendor Profile.

### 2. Capability-badge per oppgave (gjenbruk `AgentCapabilityBadge`)
Erstatte dagens flate "Lara kan hjelpe"-badge med:
- **Automatisk** — for lavrisiko utkast (DPIA-utkast, revisjonssjekkliste)
- **Assistert (Lara)** — for høyrisiko som krever godkjenning (DPA, risikovurdering)
- **Manuell** — for oppgaver uten `aiDraftable`

Dette samsvarer med core-memory-regelen om 3 autonomi-nivåer.

### 3. Erstatte spinner-knapp med `AIWorkingWidget`
Når brukeren trykker "La Lara lage utkast", vis et inline `AIWorkingWidget`-panel inni det ekspanderte kortet med stegvis fremdrift ("Henter Hubspot-vilkår… → Genererer DPA-utkast… → Klar for gjennomgang"). Behold simulering med `setTimeout`-stegnivåer.

### 4. Ny tilstand: "Utkast klart"
Når Lara er ferdig, vis vedvarende grønt panel på kortet med "Lara har laget et utkast — gjennomgå og godkjenn", ikke bare en toast som forsvinner. Gjenbruk samme mønster som `InlineDeviationAgent` bruker etter agent-handling.

### 5. Batch-handling i toppbanneret
I `LaraRecommendationBanner`-onPrimaryAction: la Lara behandle alle ekspanderte agentiske oppgaver i sekvens, med en samlet `AIWorkingWidget` som viser fremdrift (3 av 5 fullført). Gir reelt agentisk preg.

### 6. Header-mikrokopi
Bytte undertittelen fra "Automatisk genererte oppgaver basert på mangler Lara har oppdaget…" til en agentisk åpning, f.eks.: "Lara har funnet N oppgaver. K av dem kan hun løse for deg nå — med din godkjenning."

### 7. "Manuell oppgave"-knapp får sekundær styling
"Opprett oppgave"-knappen blir `variant="outline"` siden den agentiske handlingen (Vis Laras plan) skal være den primære.

---

## Teknisk

**Endrede filer:**
- `src/pages/Tasks.tsx` — integrere `LaraRecommendationBanner` øverst, bytte ut spinner mot `AIWorkingWidget`-panel inne i ekspandert kort, mappe `AutoTask → LaraPlanTask`, legge til `draftReady`-state per task.
- Bruke `AgentCapabilityBadge` fra `@/components/compliance` i stedet for dagens lokale "Lara kan hjelpe"-badge.

**Ingen nye komponenter, ingen DB-endringer, ingen nye dependencies** — alt gjenbrukes fra eksisterende agent-bibliotek.

**Risiko:** Lav. Endringene er lokale til `Tasks.tsx` og bruker allerede etablerte mønstre fra Vendor Profile og Veiledning fra Mynder.

---

## Resultat
Etter endringene vil Oppgavesiden:
- Åpne med en agentisk plan, ikke en filterstripe
- Bruke samme Lara-banner-mønster som resten av plattformen (visuell konsistens)
- Vise ekte 3-nivå autonomi-merking (Automatisk / Assistert / Manuell)
- Ha synlig "Lara jobber"-progresjon i stedet for skjult spinner
- Tilby batch-håndtering — kjernen i agentisk UX
