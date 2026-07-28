## Mål
Rydde opp i tab-hierarkiet på «Produkter og tjenester». Arkfanene «Mine» og «Alle» (fra `MSPServiceCatalogTab`) skal være de eneste synlige fanene på toppnivå. «Innstillinger» og «Hvordan virker det» flyttes inn i en subtil meny-knapp (ikon) ved siden av fanene.

## Endringer

### `src/pages/MSPServiceCatalog.tsx`
- Fjern det ytre `Tabs`-oppsettet med `catalog | settings | how-it-works`.
- Render `MSPServiceCatalogTab` direkte (som eier «Mine»/«Alle»-fanene).
- Bruk overlay-dialoger for `MSPServiceSettingsTab` og `MSPServiceHowItWorksTab` — åpnes fra en menyknapp.
- Behold `useState` for hvilken sekundærvisning som er åpen (`settings | how-it-works | null`), åpne som `Sheet` (side-panel) eller `Dialog` for et rent, ikke-dominerende inntrykk.

### `src/components/msp/MSPServiceCatalogTab.tsx`
- I `TabsList`-raden legg inn en `DropdownMenu` helt til høyre med et diskret `Settings2`-ikon (eller `MoreHorizontal`) som ghost-knapp.
- Menypunkter:
  - «Innstillinger» → åpner settings-panelet
  - «Hvordan virker det» → åpner how-it-works-panelet
- Komponenten trenger en callback-prop `onOpenSecondary?: (view: "settings" | "how-it-works") => void` som `MSPServiceCatalog.tsx` sender inn, slik at sidepanelet styres på page-nivå.

### UI-detaljer
- Ikon plasseres høyrejustert på samme linje som `TabsList` (flex-rad med `justify-between`).
- Bruk `Sheet` fra shadcn (side="right", bred nok til innhold) for å vise underkomponentene — beholder eksisterende innhold uten refactor.
- Ingen endringer i selve innholdet av `MSPServiceSettingsTab` eller `MSPServiceHowItWorksTab`.

## Ikke berørt
- Logikk i katalogen, filtrering, «Mine»/«Alle»-telling.
- Skatteinnstillinger, tilbudsmal, tjenesteprofil.
