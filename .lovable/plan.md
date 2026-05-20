## Mål

Rydde opp i tabellvisningen i tjenestebiblioteket på `/msp-services`. I dag har hver rad mange pills (partnertype, delivery, Lara-badge, ramme-pills, marked-pills) som gir et rotete inntrykk. Vi strammer inn til en tabell som ser ut som en ren liste — typografi gjør jobben, ikke chips.

## Endringer (kun `src/components/msp/ServiceLibraryBrowser.tsx` → `TemplateTable`)

### Layout
- Strammere kolonner: `Kode · Tjeneste · Regelverk · Marked · Timer · Pris · ` (handling).
- Faste kolonnebredder via `<colgroup>` så timer/pris alltid linjeres opp.
- Komprimert radhøyde: `py-2` celler, `text-[13px]`, ingen `p-4` standard.
- Tynnere skiller — `divide-y divide-border/60`, ingen ekstra rammer rundt celler.
- Subtil hover (`hover:bg-muted/30`), ingen sterk markering.

### Innhold per celle
- **Kode**: monospace, mindre kontrast (`text-muted-foreground`), ingen pill-bakgrunn.
- **Tjeneste**: kun navn på én linje + kort beskrivelse i én klippet linje under (`line-clamp-1 text-[11px] text-muted-foreground`). Fjerner inline-badges (partnertype, delivery, Lara-pille). Lara-anbefalinger vises kun som et lite `Sparkles`-ikon foran navnet når relevant — én visuell hint, ikke en chip.
- **Regelverk**: ren tekst, komma-separert (`ISO 27001, NIS2, GDPR …`), maks 3 + "+N". Ingen pill-bakgrunn.
- **Marked**: små bokstavkoder uten globe-ikon (`NO · EU · SE`), `text-muted-foreground`.
- **Timer**: høyrejustert, tabular-nums, uten ikon.
- **Pris**: høyrejustert, tabular-nums, fet, uten valuta-suffiks-støy.
- **Handling**: kompakt knapp `h-7`, ikon-only "Adopter" når adoptert blir det en grå `Check` uten tekst.

### Header
- `text-[10px] uppercase tracking-wide text-muted-foreground` (matcher resten av appen), `h-8` rader, ingen bakgrunn.

### Top picks (Lara anbefaler)
- Samme tabell, men venstre kantlinje i `border-l-2 border-primary/40` på `<Card>`-en for å markere at det er en anbefalt seksjon — ingen pills inni radene.

## Ikke i scope

- Boks-/kort-visningen røres ikke.
- Filter-/søkebaren over tabellen røres ikke.
- Ingen endring i datamodell eller `serviceLibrary.ts`.