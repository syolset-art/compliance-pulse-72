# Regelverksaktivering: stort hovedtall + segmentering med aktiveringsandel

## Widget «Regelverk aktivert» (blå kort på partnerdashbordet)

I dag er hovedtallet antall aktiveringer i perioden (f.eks. «39 aktiveringer siste måned»). Det endres til en prosentsats.

Ny visning, ovenfra og ned:

```text
REGELVERK AKTIVERT                     (?)
[ Siste måned | Siste halvår ]

62 %
av 300 kunder har aktivert GDPR   <- regelverket flest kunder har aktivert

GDPR        62 % · 186 kunder  ▉▉▉▉▉▉▉▉
NIS2        24 % ·  71 kunder  ▉▉▉
ISO 27001   18 % ·  54 kunder  ▉▉
DORA        14 % ·  42 kunder  ▉▉
+39 nye aktiveringer siste måned
```

- Stort tall = andel av porteføljen (300 kunder) som har aktivert det mest utbredte regelverket.
- Under tallet: én linje som navngir regelverket.
- Filterpillene beholdes: velger man GDPR/NIS2/osv. viser det store tallet andelen for akkurat det regelverket.
- Periodevelgeren styrer «nye aktiveringer»-linjen (siste måned / siste halvår), ikke totalandelen.
- Antall aktiveringer i perioden flyttes ned til en liten linje under listen, slik at prosenten dominerer.
- Skjult tekstalternativ (sr-only) oppdateres tilsvarende.

## Widget «Portefølje-segmentering»

Segmentene beholdes, men hver rad får aktiveringsandel i tillegg til antall kunder — altså ikke bare hvem regelverket treffer, men hvor mange av dem som faktisk har aktivert det.

```text
Segment              treffer   aktivert
NIS2-eksponert     ▉▉▉  71      38 %
Sky-avhengig       ▉▉▉▉▉ 186    54 %
Særlige kategorier ▉▉▉▉ 128     61 %
DORA-finans        ▉▉   42      29 %
ISO 27001          ▉    23      48 %
```

- Søylen viser fortsatt hvor mange kunder segmentet treffer.
- Ny kolonne til høyre: prosent som har aktivert tilhørende regelverk, med tekstetikett (aldri bare farge/lengde).
- Kolonneoverskrifter «Treffer» og «Aktivert» legges til så tallene er entydige.
- Tooltip-teksten oppdateres til å forklare begge tallene.

## Teknisk

- Alt ligger i `src/pages/MSPPartnerDashboard.tsx`.
- `FRAMEWORK_ACTIVATIONS` utvides med `activeCustomers` (totalt antall kunder som har regelverket aktivert) i tillegg til dagens `lastMonth`/`lastHalfYear`.
- `SEGMENTS` utvides med `activatedPct`.
- Kun mockdata og presentasjon — ingen backend-endringer.
- WCAG: prosent og antall som tekst, søyler `aria-hidden`, kontrast beholdt på hvit tekst mot lilla gradient.
