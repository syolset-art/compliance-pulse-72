
# Ett Verifisert-pill med innebygd re-attesteringsvarsel

I dag viser kravlisten to badges når kravet er verifisert men snart må re-attesteres: "Verifisert" (progress) + "Re-attesteres om X d" (evidence). Det er dobbel info. Vi slår det sammen til ett pill.

## Endring i `FrameworkRequirementsList.tsx`

**Dedup-logikken utvides:** Når `progress === "verified"` OG `evidence === "revalidation_due"`, behandle det som samme status og vis kun ett Verifisert-pill.

**Pillet får et lite varselelement** når re-attestering nærmer seg:
- ShieldCheck-ikon (uendret) + "Verifisert"-tekst
- Etterfulgt av en subtil `Clock`-ikon + "Xd" i `text-warning`, adskilt med en tynn skille (`border-l border-warning/30 pl-1.5`)
- Tooltip på hover: "Re-attesteres om X dager"

**Farger:** Beholder success-border som primær ramme; kun det lille tellerelementet bruker warning-farge for å signalisere at handling nærmer seg — uten å bytte pilltype.

## Fallback
- Hvis `revalidationDaysLeft` mangler eller er null: ingen ekstra teller vises.
- Hvis `progress === "verified"` men `evidence` er noe annet enn `verified`/`revalidation_due` (sjelden): behold gammel dual-badge-visning.

## Ikke inkludert
- Ingen endringer i statusmodell (`requirementStatusModel.ts`) — kun visning.
- Ingen endring i `RequirementCard.tsx` / `VendorControlsTab.tsx` (kan speiles senere ved behov).
