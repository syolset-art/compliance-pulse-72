

# Ressurssenter 2.0 -- Flersidig kunnskapssenter

## Problem

Ressurssiden er i dag kun koblet til modenhetsfaser. Brukeren mangler to viktige ting:
1. **Faglig innhold** -- lesbart materiale om GDPR, NIS2, ISO 27001, AI Act
2. **Ordliste** -- forklaring av begreper som brukes i Mynder og i compliance-verdenen (behandlingsprotokoll, arbeidsomrade, prosess, ROPA, etc.)

## Ny struktur

Ressurssiden far tre hovedseksjoner via faner (Tabs):

```text
+---------------------------------------------------------------+
|  Ressurssenter                                                 |
|  [Compliance-prosessen]  [Regelverk]  [Ordliste]               |
+---------------------------------------------------------------+

Fane 1: Compliance-prosessen (eksisterende innhold)
  - Modenhetsstepperen med faser, aktiviteter, Mynder-kobling
  - Chat med Lara (kontekst = valgt fase)

Fane 2: Regelverk
  - GDPR, NIS2, ISO 27001, AI Act som utvidbare seksjoner
  - Hver med kort intro + nøkkelpunkter + "Slik hjelper Mynder"
  - Chat med Lara (kontekst = valgt regelverk)

Fane 3: Ordliste
  - Søkbar liste med begreper
  - Gruppert etter kategori (Mynder-begreper, GDPR, Sikkerhet)
  - Hvert begrep: tittel, kort forklaring, eventuell lenke
```

## Detaljerte endringer

### 1. `src/lib/glossaryData.ts` -- NY FIL

Ordliste-data med begreper gruppert i kategorier:

**Mynder-begreper:**
- Arbeidsomrade -- En avdeling eller funksjon i organisasjonen (HR, IT, Salg). Brukes til a strukturere ansvar.
- Prosess -- En behandlingsaktivitet som beskriver hvordan personopplysninger handteres. Koblet til arbeidsomrader og systemer.
- System / Leverandor -- Et IT-system eller tjeneste som behandler data. Registreres med risikovurdering og dataflyt.
- Trust Profil -- Virksomhetens selverklæring for compliance som kan deles med kunder.
- Lara -- Mynders AI-assistent som hjelper med dokumentasjon og veiledning.
- Avvik -- En hendelse der noe gikk galt eller ikke fulgte retningslinjene.

**GDPR-begreper:**
- Behandlingsprotokoll (ROPA) -- Oversikt over alle behandlingsaktiviteter. Krav i GDPR Art. 30.
- Behandlingsgrunnlag -- Den lovlige grunnen til a behandle personopplysninger (samtykke, avtale, etc.).
- Databehandler -- En tredjepart som behandler data pa vegne av virksomheten.
- Behandlingsansvarlig -- Den som bestemmer formal og middel for behandlingen.
- Personvernombud (DPO) -- Person med ansvar for a overvake personvern i virksomheten.
- DPIA / Personvernkonsekvensvurdering -- Vurdering av risiko ved behandlingsaktiviteter med hoy risiko.
- TIA (Transfer Impact Assessment) -- Vurdering av risiko ved overforing av data til tredjeland.

**Sikkerhet og compliance:**
- Gap-analyse -- Kartlegging av forskjell mellom navaerende status og krav.
- Risikovurdering -- Systematisk identifisering og vurdering av trusler.
- Kontroll -- Et tiltak som reduserer risiko (teknisk eller organisatorisk).
- SLA (Service Level Agreement) -- Avtale om tjenesteniva med leverandor.
- Intern audit -- Systematisk gjennomgang av styringssystemet.

### 2. `src/lib/regulatoryArticles.ts` -- NY FIL

Faglig innhold om regelverk, strukturert per regelverk med nøkkelpunkter:

```typescript
interface RegulatoryTopic {
  id: string;
  title: string;
  icon: string; // lucide icon name
  color: string;
  summary_no: string;  // 2-3 setningers intro
  keyPoints_no: { title: string; description: string }[];
  mynderHelp_no: { title: string; description: string; route: string }[];
}
```

Innhold for:
- **GDPR** -- Personvern, rettigheter, behandlingsgrunnlag, ROPA, avviksvarsling
- **NIS2** -- Cybersikkerhet, meldeplikt, risikostyring, ledelsesansvar
- **ISO 27001** -- ISMS, kontrollomrader, sertifiseringsprosess, kontinuerlig forbedring
- **AI Act** -- Risikoklassifisering, forbudte systemer, krav til hoyrisiko-AI, transparens

### 3. `src/pages/Resources.tsx` -- Omskriving med Tabs

**Ny layout med tre faner:**

**Fane 1: "Compliance-prosessen"** (default)
- Beholder eksisterende modenhetsstepperen og fasedetaljer
- Chat med fase-kontekst i bunnen

**Fane 2: "Regelverk"**
- Fire kort (GDPR, NIS2, ISO 27001, AI Act) som kan utvides
- Klikk pa et kort viser: intro, nøkkelpunkter, og "Slik hjelper Mynder"
- Chat med regelverk-kontekst i bunnen

**Fane 3: "Ordliste"**
- Sokefelt øverst
- Begreper gruppert etter kategori med Accordion
- Hvert begrep viser tittel og forklaring
- Eventuell lenke til relevant side i Mynder

**Mobil:** Faner vises som horisontale scrollbare chips. Innholdet stables vertikalt.

### 4. `src/components/support/SupportChat.tsx` -- Utvid kontekstmapping

Legg til kontekstprompts for regelverk-emner:
- `gdpr`: "Brukeren vil laere om GDPR. Gi faglige svar om personvern, rettigheter og behandlingsgrunnlag."
- `nis2`: "Brukeren vil laere om NIS2. Forklar cybersikkerhetskrav, meldeplikt og ledelsesansvar."
- `iso27001`: "Brukeren vil laere om ISO 27001. Forklar ISMS, kontroller og sertifiseringsprosessen."
- `aiact`: "Brukeren vil laere om AI Act. Forklar risikoklassifisering og krav til AI-systemer."

### 5. `src/lib/supportFaqData.ts` -- Utvid med regelverk-kontekster

Legg til kontekstprompts for de nye regelverk-IDene og ordliste-kontekst.

## Tekniske detaljer

### Tabs-implementasjon
Bruker Radix Tabs (`@radix-ui/react-tabs`) som allerede er installert. Tre faner med `value` state for a kontrollere aktiv fane og tilpasse chat-konteksten.

### Ordliste-søk
Enkel klientside-filtrering med `useState` for sokeord. Filtrer glossaryData basert pa om tittel eller beskrivelse inneholder sokeordet.

### Filer som endres/opprettes
1. **`src/lib/glossaryData.ts`** -- NY: Ordliste-data med ~20 begreper
2. **`src/lib/regulatoryArticles.ts`** -- NY: Faglig innhold om GDPR, NIS2, ISO 27001, AI Act
3. **`src/pages/Resources.tsx`** -- Omskrives med Tabs-layout (tre faner)
4. **`src/lib/supportFaqData.ts`** -- Utvides med nye kontekstprompts
5. **`src/components/support/SupportChat.tsx`** -- Utvides med regelverk-foreslatte sporsmaal

