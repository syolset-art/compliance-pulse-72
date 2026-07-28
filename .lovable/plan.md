## Problem
Når en modul (Mynder Core / Leverandør) er på cap, viser kortet både «Endre nivå» (høyre) og «Oppgrader» (i cap-banneret nederst). To knapper som gjør akkurat samme ting.

## Løsning
Fjern «Oppgrader»-knappen fra cap-banneret og la banneret være ren informasjon. Cap-banneret får i stedet en subtil visuell kobling til den eksisterende «Endre nivå»-knappen ved å:

1. Beholde amber-banneret med teksten «Dere har brukt opp plassen. Neste nivå gir plass til X systemer for Y kr per måned.» — uten knapp.
2. Når `atCap` er true, endre høyre-knappen fra outline `Endre nivå` til primary `Oppgrader til {nextTier.label}` (samme onClick). Da har brukeren én tydelig handling som matcher banneret, og fargen signaliserer at det haster.

## Endringer
- `src/pages/Subscriptions.tsx`: fjern `<Button>Oppgrader</Button>` fra begge `capFooter`-blokker (Core og Leverandør). Send `atCap` + `nextTier.label` inn i `ModuleCard` slik at knappen kan bytte etikett/variant.
- `src/components/subscriptions/ModuleCard.tsx`: aksepter valgfri `ctaOverride?: { label: string; variant: "default" | "outline" }` (eller lignende) som overstyrer standard `actionLabel`/variant når kortet er på cap.

## Resultat
Én handlingsknapp per kort. Banneret forklarer *hvorfor* det haster, knappen er *hvordan* — ingen duplisering.
