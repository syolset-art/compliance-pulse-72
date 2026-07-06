Plan: Hjelpeikon og klikkbar Portefølje-segmentering-widget

Mål: Legge til et hjelpeikon ved siden av tittelen «Portefølosing» med en tooltip, og sikre at widgeten er klikkbar.

Endringer i `src/pages/MSPPartnerDashboard.tsx`:

1. Hjelpeikon ved tittel
   - I `PortfolioSegmentation`-komponenten (linje ~1000) legges et `HelpCircle`-ikon til høyre for `<h3>Portefølje-segmentering</h3>`.
   - Ikonet pakkes inn i `UITooltip` med `TooltipProvider`, `TooltipTrigger` og `TooltipContent` (samme mønster som i `TopServicesWidget` rett under).
   - Tooltip-tekst (forhåndsvalg): «Porteføljen din gruppert etter hovedkategori. Hver søyle viser hvor mange kunder som tilhører segmentet. Klikk widgeten for detaljer.»
   - Klikk på hjelpeikonet stopper event-bobling (`e.stopPropagation()`) slik at det ikke utløser widgetens `onClick`.

2. Sikre klikkbar widget
   - Hele `Card` i `PortfolioSegmentation` har allerede `onClick={() => navigate("/msp-partner/widget/segmentation")}` og `cursor-pointer`. Dette beholdes.
   - Ingen endringer på navigasjonsmålet.

Notat: Widgeten er allerede klikkbar; denne planen konsoliderer det og legger til hjelpeikonet.

Verifisering: Kjør `npx tsc --noEmit` for å bekrefte at endringen ikke introduserer TypeScript-feil.