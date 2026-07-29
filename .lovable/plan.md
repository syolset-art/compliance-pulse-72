Mål
Gjøre «Baseline-kartlegging»-kortet på Veiledning-fanen til et samlet inngangspunkt for både modenhet per kontrollområde og felles gjennomgang med kunden. Kortet skal vise fremdrift for hver av de fem kontrollområdene, og partneren skal tydelig se at de kan åpne spørsmålene i et kundemøte for å fylle ut baselinen sammen.

Nåværende tilstand
- I MSPCustomerDetail.tsx ligger det et kompakt «Baseline-kartlegging»-kort (linje 388) som kun viser total fremdrift (1/22 besvart) og én «Fortsett kartlegging»-knapp.
- Under kortet vises MaturityMirrorCard, som inneholder nesten samme informasjon: modenhet per kontrollområde + Trust Score.
- BaselineQuestionsDrawer lar partneren svare på vegne av kunden, men har ikke en tydelig modus for «fyll ut sammen med kunden».

Foreslått endring
````text
┌──────────────────────────────────────────────┐
│  Baseline-kartlegging              Valgfritt │
│  Still 22 enkle spørsmål sammen med kunden —   │
│  svarene bygger modenhet per kontrollområde.   │
│  [1/22 besvart]                                │
│                                                │
│  Styring og ansvar        ████████░░  3/5      │
│  Drift og sikkerhet       █████░░░░░  2/4      │
│  Identitet og tilgang     ███████░░░  3/4      │
│  Personvern og data       ███░░░░░░░  1/5      │
│  Tredjepart og verdikjede ████░░░░░░  2/4      │
│                                                │
│  [Fyll ut sammen med kunden]  [Fortsett]       │
└──────────────────────────────────────────────┘
````

Detaljer
1. Vis kontrollområder i baseline-kortet
   - Bruk `areaProgress` fra `useCustomerBaseline` (allerede tilgjengelig i MSPCustomerDetail.tsx).
   - Render fem kompakte rader med områdenavn, ikon, liten fremdriftsbar og besvart/total.
   - Behold samme fargekoding som ellers: grønn >=75 %, oransje 50–74 %, rødt <50 %, grå når 0 %.
   - Total fremdrift beholdes som en subtil chip øverst («1/22 besvart»).

2. To tydelige CTA-knapper i kortet
   - «Fyll ut sammen med kunden» (Users/MessageSquare-ikon) åpner BaselineQuestionsDrawer i en ny `meeting`-modus.
   - «Fortsett kartlegging» / «Start kartlegging» (ClipboardEdit-ikon) åpner skuffen som i dag, for partnerens egen utfylling.

3. BaselineQuestionsDrawer får `mode`-prop
   - `mode: "partner"` (default) – eksisterende tekst: «Du svarer på vegne av kunden».
   - `mode: "meeting"` – ny tekst: «Fyll ut baseline sammen med kunden. Still spørsmålene høyt og velg svaret basert på det kunden svarer.»
   - Ingen endring av selve svarlogikken; kun beskrivende tekst og eventuelt header-ikon.

4. Unngå duplisering med MaturityMirrorCard
   - MaturityMirrorCard under baseline-kortet viser de samme fem områdene og blir overflødig.
   - Fjern MaturityMirrorCard fra Veiledning-fanen, eller omarbeid det til en mer høynivå «Trust Score»-sammenfatning dersom Trust Score fortsatt skal vises.
   - Foreslått løsning: flytt Trust Score inn som en liten seksjon øverst til høyre i baseline-kortet, og fjern MaturityMirrorCard helt.

5. Tekster i i18n
   - Legg til nye nøkler i `src/locales/nb.json` og `src/locales/en.json` for:
     - `baselineCard.title`, `baselineCard.description`, `baselineCard.optionalBadge`
     - `baselineCard.meetingButton`, `baselineCard.continueButton`, `baselineCard.startButton`
     - `baselineDrawer.meetingTitle`, `baselineDrawer.meetingDescription`
   - Oppdater komponenten til å bruke `useTranslation()`.

Filer som endres
- `src/pages/MSPCustomerDetail.tsx` – redesigne baseline-kortet, fjerne/omarbeide MaturityMirrorCard, importere nye ikoner.
- `src/components/msp/BaselineQuestionsDrawer.tsx` – legge til `mode`-prop og tilpasse tekst.
- `src/locales/nb.json` og `src/locales/en.json` – nye oversettelsesnøkler.

Verifisering
- Kjøre `bun run build` og TypeScript-sjekk for å sikre at ny prop og importer kompilerer.
- Åpne preview på Veiledning-fanen og bekrefte:
  - Baseline-kortet viser 5 kontrollområder med fremdrift.
  - Begge knapper åpner skuffen med riktig overskrift/beskrivelse.
  - MaturityMirrorCard ikke lenger dupliserer informasjonen.