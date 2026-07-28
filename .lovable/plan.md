## Problem
Når partneren klikker «Legg til» på en foreslått tjeneste skjer det tre ting samtidig, men ingen av dem forklarer resultatet tydelig:
1. Knappen bytter til badge «Lagt til».
2. En toast «… lagt til i katalogen» blinker forbi.
3. Tjenesten dukker opp i seksjonen «Mine tjenester» lenger ned på siden — som er skjult under produkter/anbefalinger og som ikke bruker begrepet «min tjenestekatalog».

Resultat: brukeren skjønner ikke hvor tjenesten havnet, hva «katalogen» er, eller hva neste steg er (prise, tilby, redigere).

## Løsning — tre små, sammenhengende UX-grep
Kun frontend i `src/components/msp/MSPServiceCatalogTab.tsx` (+ liten hjelpekomponent). Ingen datamodell-endringer.

### 1. Rename og ankerpunkt for «Min tjenestekatalog»
- Endre overskriften «Mine tjenester» → **«Min tjenestekatalog»** med kort undertekst: «Tjenester du tilbyr kundene dine. Brukes i tilbud og gap-analyser.»
- Legg til `id="min-katalog"` på seksjonen så vi kan scrolle dit.
- Tellepille ved siden av tittelen: «3 tjenester · 2 på tilbud».

### 2. Tydelig bekreftelse ved «Legg til»
Erstatt dagens statiske «Lagt til»-badge og enkle toast med:
- **Bekreftelses-toast** med handling:
  «✓ La til «X» i din tjenestekatalog» + knapp **«Vis i katalogen»** som scroller/highlighter raden i seksjon 1.
- **Badge-varianten** beholdes, men blir klikkbar («Lagt til — vis») og får samme scroll-til-katalog-oppførsel. Tooltip: «Ligger i din tjenestekatalog. Klikk for å redigere pris og timer.»
- Kort **flash-highlight** (ring/bg-primary/5 i ~1,5 s) på den nye raden i «Min tjenestekatalog» så øyet fanger hvor den landet.

### 3. Tom-tilstand som forklarer katalogen
Når `extras` er tomt i dag skjules hele seksjonen. Vi viser i stedet et lite, subtilt kort:
- Tittel: «Min tjenestekatalog er tom»
- Én linje: «Legg til tjenester fra listen over — de blir tilgjengelige når du lager tilbud.»
- Ingen CTA (listen over er allerede der).

Dette gjør at brukeren første gang forstår hva katalogen er *før* første «Legg til»-klikk.

## Ikke i scope
- Ingen endring på Mynder-produkter-tabellen, Lara-wizard, tilbud-flyt, priser eller datamodell.
- Ingen ny rute — alt skjer på samme side, med scroll + highlight.

## Tekniske detaljer
- `useRef` på `<section id="min-katalog">` for `scrollIntoView({ behavior: "smooth", block: "start" })`.
- `useState<string | null>(highlightId)` som settes ved `adoptTemplate` / toast-action, ryddes med `setTimeout` 1600 ms; brukes til å legge `ring-2 ring-primary/40 bg-primary/5` på raden.
- Toast: bruk `sonner`s `toast.success(..., { action: { label: "Vis i katalogen", onClick: … } })` — allerede i bruk andre steder.
- Badge «Lagt til» blir en `<button>` med samme onClick som toast-action.
- i18n: strengene er norske i tråd med resten av filen; ingen ny i18n-nøkkel-infrastruktur her.
