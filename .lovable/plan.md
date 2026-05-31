## Problem

Steg 1 i «Ny kampanje med Lara» dumper 6 kategorier × 15 segmenter på brukeren samtidig. Det er vanskelig å vite hvor man skal starte. I tillegg teller f.eks. «Trenger NIS2-vurdering» kunder som mangler baseline — uten å si fra om at vi egentlig ikke vet sikkert.

## Endringer

### 1) Nytt mellom-steg: Velg fokus først
Før segment-listen vises, presenteres tre store valg som fungerer som filter:

- **Regelverk-gap** (NIS2, ISO 27001, GDPR, åpenhetsloven, AI Act)
- **Modenhet og risiko** (lav modenhet, høy risiko)
- **Tjeneste-gap** (mangler vCISO, ingen aktiv leveranse, mangler Mynder-moduler)

Hvert valg har en kort beskrivelse + Lara-anbefaling («Vi anbefaler Regelverk-gap — flest kunder berøres»).

Når et fokus er valgt vises kun segmentene i den kategorien. «Aktivitet» og «Kritikalitet» blir sekundære, foldet inn under «Flere kriterier» (collapsible) for de som vil kombinere.

Brukeren kan bytte fokus med en pille øverst («Fokus: Regelverk-gap · endre»).

### 2) Baseline-bevissthet i treff-telleren
Utvid `CampaignCustomer` med `baselineComplete: boolean`. Segmenter i kategori `framework` deler treffene i to:

- **Bekreftet treff** — baseline fullført og kriteriet matcher
- **Mulig treff** — baseline ikke fullført, så vi kan ikke bekrefte

Sticky teller-kortet viser begge tall:

> **8 kunder treffer kampanjen** (fullført baseline)
> *+ 7 mulige kunder uten fullført baseline — kjør baseline først for å bekrefte*

«Mulige kunder»-linjen har en sekundær-knapp «Se kunder uten baseline» som lister dem og lenker til baseline-drawer per kunde. Disse inkluderes ikke i mottakerlisten med mindre brukeren aktivt huker dem av.

For ikke-framework segmenter (modenhet, tjeneste) gjelder samme deling kun når kriteriet faktisk er avhengig av baseline-data (modenhet ja, tjeneste nei).

### 3) Lara anbefaler en kampanje
På fokus-skjermen viser vi én «Lara anbefaler»-rad øverst — det segmentet med flest bekreftede treff i demoen. Klikker brukeren den, hoppes fokus-valg over og det segmentet er forhåndskrysset.

## Tekniske detaljer

**Filer som endres**
- `src/lib/campaignSegments.ts` — legg til `baselineComplete?: boolean` på `CampaignCustomer`, sett verdier på demo-kundene (5 fullført, 3 ikke), og utvid `applySegments` til å returnere `{ confirmed, possible }` for framework + maturity-kategorier.
- `src/components/msp/CampaignWizardDialog.tsx` —
  - Ny `Step1Focus`-komponent vist før dagens segment-grid.
  - State `focus: "framework" | "maturity" | "service" | null`.
  - Dagens `Step1` filtreres på valgt fokus; «Aktivitet/Kritikalitet» foldes inn i collapsible «Flere kriterier».
  - Sticky teller-kort splittes i bekreftet + mulig.
  - Stepperen oppdateres: «1. Velg fokus → 2. Velg kunder → 3. Skriv innhold → 4. Send».

**Out of scope**
- Faktisk persistens av baseline-status mot Supabase. Vi bruker demo-flagget på `CampaignCustomer` for nå (samme mønster som resten av kampanje-flyten).
- Endringer i steg 2 og 3.
