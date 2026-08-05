# Ett fast sted for vilkår, personvernerklæring og databehandleravtale

## Anbefaling om plassering

Profilmenyen er riktig **inngang**, men ikke riktig **hjemsted**. Anbefalingen er begge deler:

- **Hjemsted:** en egen side «Avtaler og vilkår» på `/legal`, som også ligger i Innstillinger-menyen sammen med Organisasjon, Produkter og Aktivitetslogg. Der hører juridiske dokumenter hjemme for den som leter systematisk, og siden tåler å vokse (nye versjoner, flere avtaler, akseptlogg).
- **Snarvei:** et menypunkt «Avtaler og vilkår» i profilmenyen (avatar øverst til høyre), rett over «Om Mynder-scoren». Da er dokumentene alltid to klikk unna uansett hvor kunden befinner seg — som du foreslo.

I tillegg lenkes det dit fra vilkårsavkrysningene som allerede finnes ved aktivering, nivåendring og kjøp, slik at det er samme kilde overalt.

## Slik ser siden ut

Én side med tre dokumenter i faner:

```text
Avtaler og vilkår
[ Vilkår ]  [ Personvernerklæring ]  [ Databehandleravtale ]

Versjon 1.0 · gjelder fra 3. august 2026        [Last ned PDF]
Godtatt av deg 3. august 2026                   [Se historikk]

<dokumentinnhold>
```

- Versjon, ikrafttredelsesdato og «godtatt av deg»-status vises øverst i hvert dokument.
- «Last ned PDF» bruker nettleserens utskrift-til-PDF, så kunden alltid kan arkivere en kopi.
- «Se historikk» viser brukerens akseptlogg: dokument, versjon, dato og i hvilken sammenheng (aktivering, nivåendring, kjøp av regelverk).
- Er et dokument ikke publisert ennå, står det tydelig at det kommer — ingen tomme faner.

Dagens `/terms` beholdes og sender videre til `/legal` med Vilkår valgt, slik at eksisterende lenker fortsatt virker.

## Teknisk

- **Database:** utvid `terms_versions` med `doc_type` (`terms` | `privacy` | `dpa`, standard `terms`) og bytt unik-indeksen fra `version` til `(doc_type, version)`, slik at hvert dokument kan ha sin egen versjonsrekke. `is_current` gjelder da per dokumenttype. Eksisterende rad (v1.0) blir `terms`. Personvernerklæring og databehandleravtale legges inn som førsteversjoner med et utkast som kan redigeres senere.
- **`src/hooks/useTerms.ts`:** utvides til å hente alle gjeldende dokumenter (`currentByType`) i tillegg til dagens `current`, uten å endre signaturen som `TermsGateDialog`, `TermsAcceptRow` og kjøpsdialogene allerede bruker.
- **Ny side `src/pages/Legal.tsx`** (rute `/legal`, med `?doc=` for direktelenking) som gjenbruker markdown-visningen fra dagens `Terms.tsx`; renderingen flyttes ut i en delt komponent `src/components/legal/LegalDocumentView.tsx`.
- **`src/pages/Terms.tsx`:** erstattes av en redirect til `/legal?doc=terms`.
- **`src/components/TopBar.tsx`:** nytt punkt «Avtaler og vilkår» (`FileText`-ikon) i profilmenyen.
- **`src/components/Sidebar.tsx`:** «Avtaler og vilkår» legges til i `settingsMenu`.
- Ingen endring i hvordan aksept registreres — `terms_acceptances` brukes som i dag, kun visning av loggen kommer i tillegg.
