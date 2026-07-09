## Mål

Ekspandert kravkort i `FrameworkRequirementsList.tsx` skal se ut som referansebildet: rent, minimalt, to blokker — "Automatisk vurdering" og "Manuell dokumentering" (alltid tilgjengelig, inline).

## Endringer (kun i `src/components/regulations/FrameworkRequirementsList.tsx`, ekspandert seksjon rundt linje 450–773)

Fjern følgende fra ekspandert visning:
- Repetert `req.description_no`-paragraf (linje 724) — beskrivelsen står allerede i headeren.
- "Referanse: …"-linjen (linje 726–728).
- Den lange "Verifisert av … · Bekreftet av …"-blokken (linje 731–754). Verifikasjon vises allerede via status-pillen; detaljene flyttes til tooltip på pillen (utenfor scope hvis komplekst — da bare skjules).
- Den store "Oppdater status og dokumentasjon"-outline-knappen (linje 760–770).
- Den separate "Marker som verifisert"-lenken + inline verify-form (linje 574–624) — erstattes av status-dropdown i manuell-blokken.
- Standalone `reqNotes`/kommentar-blokk (linje 626–722) — kommentar flyttes inn i manuell-blokken som textarea.

Behold / omorganiser slik at rekkefølgen blir:

1. **Kompakt dokumentasjonslinje** (allerede på plass, linje 456–498) — øverst, uendret.
2. **Automatisk vurdering** — én tett linje med Lara-ikon + "X AI-dokument(er) · Y AI-vurderinger har begrunnelse", pakket i en subtil `border rounded-md px-3 py-2`. Bruker eksisterende `LaraDataSourceExplainer` i redusert form, eller en ny mini-komponent inline i denne filen (foretrukket — mindre kode).
3. **Manuell dokumentering** (alltid synlig, ikke bak knapp):
   - Header: ikon + "Manuell dokumentering" + kort undertekst "Bekreft om dette kravet oppfylles …".
   - `Status *` — shadcn `Select` bundet til `state.progress` (`not_answered`/`in_progress`/`implemented`/`verified`/`not_applicable`). Endring kaller `handleDocSave(req.requirement_id, nyStatus, kommentar, undefined)`.
   - `Kommentar / dokumentasjon` — `Textarea` bundet til lokal `reqNotes[req.requirement_id]`, lagres onBlur.
   - `Tilknyttede dokumenter` — enkel selector-knapp som åpner eksisterende `ManualDocumentationDialog` (dialog beholdes for filvalg/opplasting), pluss "Last opp nytt"-knapp øverst til høyre som gjør det samme.
   - `Lagre`-knapp nederst til høyre (disabled til noe er endret).

`ManualDocumentationDialog` og `docDialog`-state beholdes uendret — brukes bare for filvalg/opplasting-flyten fra manuell-blokken.

## Ute av scope

- Ingen endringer i datamodell, `requirementStatusModel`, eller `handleDocSave`-signatur.
- Ingen endringer i den kollapsede radvisningen (status-pille, dokument-teller, chevron).
- Ingen endring i `LaraDataSourceExplainer`-komponenten hvis vi lager inline mini-visning i stedet.
- Ingen endring i tekst-innhold på tvers av filer (i18n-nøkler ikke berørt — norske strenger inline som i dag).
