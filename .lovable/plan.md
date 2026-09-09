# Dokument hub: filtrer på regelverk og skill styrende fra veiledende

Siden viser i dag alle dokumenter i én liste, med filtre på modul, dokumenttype og opplaster — men ingen måte å se «hvilke dokumenter gjelder ISO 27001?» eller «hvilke av disse er våre egne styrende dokumenter?». Fanen heter «Veiledende dokumentasjon», som blander to helt ulike ting: hva vi selv har vedtatt, og hva som forventes av oss.

## Dokumentklasser — det viktigste grepet

Hvert dokument får én av tre klasser, synlig som en liten merkelapp i listen og som filter:

- **Styrende** — det virksomheten selv har vedtatt: policyer, rutiner, instrukser, mandat, avtaler. Dette er «vår egen regelbok». For ISO-sertifisering og NIS2-revisjon er det disse en revisor spør etter først.
- **Bevis** — dokumentasjon på at noe faktisk er gjort: rapporter, logger, testresultater, revisjoner, sertifikater.
- **Veiledende** — eksterne standarder, myndighetsveiledere og maler vi støtter oss på. Ikke bindende for oss.

Klassen utledes automatisk fra dokumenttypen (policy/rutine/avtale → styrende, rapport/sertifisering/bevis → bevis, resten → uklassifisert), og brukeren kan alltid overstyre klassen i detaljpanelet. Uklassifiserte dokumenter vises som «Ikke klassifisert» med ett klikk for å sette klasse — det gjør opprydding enkelt uten å tvinge fram et valg ved opplasting.

## Filtrering på regelverk

Ny filtergruppe **Regelverk** med de aktiverte regelverkene (ISO 27001, NIS2, GDPR osv.). Velger man ett, vises kun dokumenter som er koblet som bevis til et krav i det regelverket. Det gir svaret på «vis meg alt vi har til ISO-revisjonen».

I tillegg to nye statuspiller i filterlinjen: **Krever oppfølging** (utløpt eller utløper snart) og **Ikke klassifisert**.

## Fanene ryddes

I dag: «Mine dokumenter» + «Veiledende dokumentasjon». Nytt:

1. **Alle dokumenter** — dagens liste, med de nye filtrene og en klassekolonne.
2. **Styrende dokumenter** — kun virksomhetens egne vedtatte dokumenter, gruppert etter kontrollområde. Dette er dokumentkartet en revisor eller ny leder skal kunne lese på ett minutt.
3. **Dokumentkrav** — dagens «veiledende»-innhold, men omdøpt til det den faktisk er: hvilke dokumenter de aktiverte regelverkene forventer at dere har, med Finnes / Mangler og «Last opp». Selve teksten endres fra «veiledende for regelverkene» til «forventet dokumentasjon for regelverkene dere har aktivert».

Ekte veiledende kilder (eksterne standarder og veiledere) flyttes ned som en egen, lav-profil seksjon i fane 3, slik at de ikke forveksles med egne dokumenter.

## Hva mer som mangler i dag

- **Status vises ikke i listen.** Utløpt / utløper snart / venter finnes allerede i datamodellen, men er kun synlig i detaljpanelet. Legges til som en kolonne, slik at man ser risiko før revisjon.
- **Eier/ansvarlig og neste gjennomgang** mangler helt. Legges inn i detaljpanelet for styrende dokumenter — ISO 27001 og NIS2 krever at et dokument har en eier og en gjennomgangsdato.
- **Nøkkeltall øverst.** En kompakt tekstlinje (ikke bokser): X dokumenter · Y styrende · Z dekker aktiverte krav · N krever oppfølging.

## Teknisk

- `src/lib/documentHub.ts`: ny `HubDocClass = "governing" | "evidence" | "guidance" | "unclassified"` med `docClassFromType()`-utledning og etiketter. Ingen endring i eksisterende normalisering.
- Overstyring av klasse, eier og gjennomgangsdato lagres som prototypedata i localStorage (samme mønster som `agentPolicies` og `prototypeDocumentStore`), ikke som skjemaendring i denne runden.
- `src/hooks/useDocumentHub.ts`: eksponer `frameworkIdsForDoc(docId)` (avledet av eksisterende `requirementEvidence` + `coverage`) slik at regelverksfilteret kan filtrere uten nye spørringer.
- `src/pages/DocumentHub.tsx`: ny filtergruppe for regelverk, klasse-filter, statuspiller, klasse- og statuskolonne, nøkkeltallslinje, tre faner, og felt for eier/gjennomgang i detaljpanelet.
- `src/components/documents/GuidingDocumentsTab.tsx`: omdøpt tekst til «forventet dokumentasjon», og ny `GoverningDocumentsTab.tsx` som grupperer styrende dokumenter etter kontrollområde via `toCanonicalArea`.
- Ingen databaseendringer, ingen endring i opplastingsflyt eller scoring. Norsk og engelsk tekst som i dag.
