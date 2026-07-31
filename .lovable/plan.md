## Mål

I dag viser "Anbefalte tiltak" / regelverksdrawer bare at kunden **mangler dokumenter** — med "Last opp" som eneste handling. Det forutsetter at partneren gjør jobben gratis. Vi gjør hvert manglende dokument om til en **prissatt leveranse** partneren kan tjene på: enten et AI-generert utkast (rask, høy margin) eller en aktivitet/tjeneste som legges i et tilbud.

## Brukerflyt (partner)

```text
Regelverk (f.eks. GDPR) → Detaljer
 └── Dokumentasjon
      ├── ✔ Personvernerklæring            (på plass)
      ├── ⚠ Protokoll (ROPA)   2–4 t · ~4 500 kr   [Generer utkast] [Legg i tilbud]
      ├── ⚠ Databehandleravtale 1–2 t · ~2 500 kr  [Generer utkast] [Legg i tilbud]
      └── Salgspotensial: 3 dokumenter · ~11 000 kr
            [Lag tilbud på dokumentasjonspakke]
```

1. Partner ser per manglende dokument: estimerte timer, foreslått pris, og om Lara kan lage utkast.
2. **Generer utkast** → Lara lager dokumentutkast basert på kundens data (bransje, systemer, leverandører). Utkastet blir en leveranse partneren kan fakturere, ikke gratis-arbeid: dialogen viser pris/timer og lagrer det som aktivitet + bevis på kunden.
3. **Legg i tilbud** → dokumentet blir en linje i tilbudet (egen "dokumentasjonstjeneste" med pris fra partnerens timepris eller fast pris).
4. **Dokumentasjonspakke** → velg flere manglende dokumenter og send ett samlet tilbud med pakkerabatt-felt.
5. Når tilbudet er levert og dokumentet lastet opp, går raden fra ⚠ til ✔ og modenheten øker — synlig effekt partneren kan vise kunden.

## Hva som bygges

**Ny fil `src/lib/documentDeliverables.ts`**
- Kobler hvert anbefalt dokumentnavn (fra `requirementDocumentationHints.ts`) til: estimerte timer (min/maks), leveransetype (`ai-draft` | `advisory` | `technical`), og om Lara kan generere utkast.
- `estimateDocumentPrice(doc, hourlyRate)` → prisspenn i partnerens valuta, eks. mva (bruker eksisterende `partnerTax.ts`).
- `summarizePotential(missingDocs, hourlyRate)` → totalt salgspotensial.

**Partnerinnstillinger**
- Nytt felt "Veiledende timepris" i tjenesteinnstillingene (samme mønster som `PartnerTaxCard`: må aktivt redigeres og lagres). Standard 1 500 kr/t hvis ikke satt.

**`RegulationDetailDrawer.tsx`**
- Dokumentseksjonen får timer + pris per manglende rad, avkryssing for flervalg, og knappene **Generer utkast** / **Legg i tilbud**.
- Toppen av seksjonen viser "Salgspotensial: N dokumenter · ~X kr" med knapp for samlet tilbud.

**Ny `GenerateDocumentDialog.tsx`**
- Viser hva Lara vil bruke som grunnlag (bransje, systemer, leverandører, regelverk), pris/timer for leveransen, og genererer utkast via eksisterende edge-funksjon `generate-work-area-document` (utvides med maler for dokumenttypene: ROPA, DPA, sikkerhetspolicy, beredskapsplan m.fl.).
- Resultat: nedlastbart utkast + lagres som bevis (`partnerEvidence`) og aktivitet (`partnerActivityLog`) på kunden.
- Tydelig merking: "AI-utkast — må kvalitetssikres av partner før levering".

**Tilbudsflyt**
- `MSPCreateOfferDialog` tar imot forhåndsvalgte dokumentlinjer (navn, regelverk, krav, timer, pris) som egne linjer ved siden av tjenester fra katalogen.
- Linjene lagres i `customerOffers` slik at leverte dokumentasjonstilbud vises og låses som i dag.

**`RegulationsStatusCard.tsx`**
- Tiltaket "Mangler N dokumenter" får et kr-potensial-merke, slik at partneren ser inntektsmuligheten rett i tabellen.

## Tekniske detaljer

- Ingen nye databasetabeller i dette steget — priser/timepris og genererte utkast lagres i samme localStorage-mønster som `partnerEvidence`, `customerOffers` og `useBaselineDocuments`, med samme migrasjonsvei til Supabase senere.
- Prisberegning er ren funksjon i `documentDeliverables.ts` (enhetstestbar), alltid eks. mva med dynamisk valuta/mva-etikett fra `partnerTax.ts`.
- Edge-funksjonen utvides med nye `templateType`-verdier og tar `customerId` + `frameworkId` som kontekst; svaret er markdown som vises i dialogen.
- Ingen endring i modenhetsberegningen; dokumentstatus leses fortsatt via `getDocumentStatus`.

## Åpne valg (kan justeres underveis)

Prisene foreslås fra **timepris × estimat**. Alternativt kan hvert dokument ha fast anbefalt pris. Jeg starter med timepris + overstyrbart beløp per linje, siden det dekker begge.
