## Mål
Partner-bevis skal ikke ta plass når det er tomt, og statusmerker skal ikke se ut som handlingsknapper.

## 1. Partner-bevis: kollaps når tomt
`src/components/msp/PartnerEvidenceSection.tsx`
- Når det ikke finnes bevis: fjern hele tomtilstands-boksen (ikon + to tekstlinjer). Ingen ramme, ingen forklaringstekst.
- I `minimal`-modus med 0 bevis rendres kun én liten knapp «Last opp bevis» (sekundær, kompakt) — ingenting annet.
- Når det finnes bevis: behold tabell + berikelses-oppsummering som i dag, men uten den store overskriftsblokken i minimal-modus.

`src/components/msp/guidance/RegulationsStatusCard.tsx`
- Bevis-seksjonen nederst får `hideUploadButton` fjernet, slik at den ene «Last opp bevis»-knappen vises der. Marg reduseres når seksjonen er tom.

## 2. Status vs. handling — visuelt skille
`src/components/msp/guidance/RegulationsStatusCard.tsx`, statuskolonnen:
- «Bekreftet»: ikke lenger en fylt pille. Vises som grønn hake + grønn tekst (`text-success`) uten bakgrunn/ramme.
- «Aktivert»: samme prinsipp — grønn hake + tekst, men med fylt/markert vekt slik at aktivert fortsatt leses som sluttstatus (alternativt beholdes den lette grønne pillen kun her).
- «AI-anbefalt» beholdes som dempet outline-merke med Sparkles.

## 3. Handlingsknapper i én mørk farge
- «Aktiver» beholder primær (mørk) CTA-stil — den er referansen.
- «Bekreft» endres fra `outline` til samme mørke primærstil (evt. `size="sm"` primær) slik at aksjoner er konsistente.
- Ikon-knapper (last opp, fjern) forblir `ghost` — de er sekundære, ikke primære aksjoner.
- Ingen statusmerke får lenger `bg-primary`, slik at den mørke fargen kun betyr «trykkbar handling».

## Teknisk
Kun presentasjonsendringer i to filer; ingen endring i `partnerEvidence.ts`-logikk, datamodell eller aktiveringsflyt.
