# Risiko som fjerde datapunkt i «Bruk»

## Mål
I leverandørprofilen under «Bruk» skal kortrekken bli: **Kritikalitet → Prioritet → GDPR-rolle → Risiko**. Brukeren setter risiko manuelt i v1, men får et forslag fra Lara basert på de tre andre feltene og om det behandles sensitive personopplysninger.

## Slik fungerer risikokortet
- Nedtrekk med **Lav / Middels / Høy** (samme rød–oransje–grønn skala som ellers i plattformen). Brukeren kan alltid overstyre.
- Under nedtrekket: en liten linje «Foreslått av Lara: Høy» med knapp **Bruk forslaget** når forslaget avviker fra det som er satt.
- Kort begrunnelse i klartekst, f.eks. «Kritisk leverandør + databehandler med sensitive personopplysninger».
- Når foreslått risiko er Høy: en anbefaling om å gjennomføre **ROS / DPIA**, med lenke videre til aktivitet/vurdering.
- Feltet lagres på leverandøren som i dag (`risk_level`), med samme lagringsmønster som de andre kortene.

## Forslagslogikk (v1, regelbasert – ingen AI-kall)
Poeng summeres og oversettes til nivå:

```text
Kritikalitet:  kritisk +3, høy +2, middels +1, lav 0
Prioritet:     P0/kritisk +2, høy +1, ellers 0
GDPR-rolle:    databehandler / underdatabehandler +1
Sensitive data: +2

0–2 = Lav    3–4 = Middels    5+ = Høy
ROS/DPIA anbefales når resultatet er Høy, eller ved sensitive data.
```

Forslaget oppdateres reaktivt når de tre andre feltene endres, men overskriver aldri brukerens valg automatisk.

## Teknisk
- Ny helper `src/lib/vendorRiskSuggestion.ts` med `suggestVendorRisk({ criticality, priority, gdprRole, sensitive })` som returnerer `{ level, reasons[], needsRosDpia }`.
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: nytt fjerde `Card` etter GDPR-rolle som bruker eksisterende `riskOptions`, `severityColor` og `handleFieldChange("risk_level", …)`. Eksisterende `handleLaraSuggest` byttes til å bruke den nye helperen.
- Griden er allerede `lg:grid-cols-4`, så ingen layoutendring trengs.
- Tekster på norsk/engelsk via samme `isNb`-mønster som resten av filen.

## Verifisering
- Endre kritikalitet/prioritet/GDPR-rolle og se at forslaget oppdateres.
- Sett risiko manuelt og bekreft at verdien lagres og ikke overstyres av forslaget.
