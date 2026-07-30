## Mål

I baseline-kartleggingen (`BaselineQuestionsDrawer`) skal partneren kunne laste opp dokumentasjon **per kontrollområde** — ikke per spørsmål — og deretter valgfritt koble dokumentet til ett eller flere spørsmål (aktiviteter) i det området.

## Brukerflyt

1. Partner åpner "Start modenhetsvurdering" og velger et kontrollområde-faneblad (Styring, Drift, Identitet, Personvern, Tredjepart).
2. Øverst i området ligger en stram, subtil rad: `📎 Dokumentasjon · 2 filer` med en "Last opp"-lenke. Ingen store bokser.
3. Ved opplasting: filen legges i listen for området, og Lara foreslår hvilke(t) spørsmål den dekker (enkel nøkkelord-matching mot spørsmålsteksten). Partneren bekrefter eller endrer koblingen i en liten popover med avkryssing av spørsmålene i området.
4. Koblede spørsmål viser en liten binders-chip med filnavn ved siden av statusikonet. Klikk på chip = åpne popover for å endre kobling eller fjerne.
5. Status kan fortsatt alltid overstyres manuelt — dokumentkobling endrer ikke status automatisk, men Lara foreslår "Fullført" der et dokument er koblet (kun forslag, partner velger).

## Teknisk

- **Ny hook** `src/hooks/useBaselineDocuments.ts` — samme localStorage-mønster som `useCustomerBaseline` (nøkkel `msp.customer.baselineDocs.<customerId>`). Lagrer `{ id, areaId, fileName, size, uploadedAt, questionIds[] }`. API: `docsForArea`, `docsForQuestion`, `addDocument`, `linkDocument`, `removeDocument`.
- **Ny komponent** `src/components/msp/BaselineAreaDocuments.tsx` — kompakt dokumentrad + `<input type="file" hidden>` + popover for kobling. Gjenbruker chip-stilen fra eksisterende dokumentrader (binders-ikon, `Sparkles` + "Lara" for foreslått kobling).
- **`BaselineQuestionsDrawer.tsx`** — rendrer dokumentraden øverst i hver `TabsContent`, og en liten chip per spørsmål som har koblede dokumenter.
- **`MSPCustomerDetail.tsx`** — sender `customerId` videre til drawer (kreves for lagringsnøkkelen).
- Filer lagres som metadata lokalt i prototypen (samme nivå som resten av baseline-dataene). Faktisk opplasting til skylagring holdes utenfor denne endringen.

## Utenfor scope

Ingen endringer i spørsmålssettet, modenhetsberegningen eller gap-analysen.
