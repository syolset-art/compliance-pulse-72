# Nye baseline-svar + reint ikon-UI

## Mål
Bytt ut dagens svaralternativer i baseline-kartleggingen og fjern visuell støy. Et spørsmål skal vises som ren tekst med ett lite fargesatt ikon til høyre — ingen pill-rad, ingen knapperad, ingen border per kort.

## Nye svaralternativer
Erstatt `MaturityAnswer = "yes" | "no" | "later" | "n_a" | "unsure"` med:

| Verdi | Etikett | Ikon | Farge |
|---|---|---|---|
| `not_started` | Ikke startet | `Circle` (tom) | muted-foreground |
| `in_progress` | Pågår | `CircleDashed` | warning (oransje) |
| `done` | Fullført | `CheckCircle2` | success (grønn) |
| `not_relevant` | Ikke relevant | `MinusCircle` | muted-foreground (svak) |

Ubesvart = vises som "Ikke startet" implisitt (men telles som ikke besvart for fremdrift).

## UI-endring i `BaselineQuestionsDrawer.tsx`
Per spørsmål, erstatt dagens `<Card>` + knapperad med en kompakt rad:

```
[spørsmålstekst .................................] [ikon ▾]   (i)
   ↳ Lara foreslår: … (kun hvis suggestion finnes — liten muted linje)
```

- Ingen `Card`-wrapper, ingen border per spørsmål. Bruk en enkel `div` med vertikal `divide-y divide-border/40` mellom spørsmål i seksjonen.
- Status velges via en `DropdownMenu` trigget av selve ikonet (knapp 28×28, kun ikon, ingen tekst, ingen border). Menyen viser de 4 alternativene med ikon + label.
- Info-ikonet (GDPR-artikkel) blir mindre og lever som en `Tooltip` på en `Info` til høyre for status-ikonet, kun synlig på hover av raden (`opacity-0 group-hover:opacity-100`).
- Lara-suggestion vises som én muted linje under spørsmålet, uten egen `Sparkles`-rad med farger — bare `text-xs text-muted-foreground` med en liten `Sparkles`-ikon inline.

## Endringer per fil

**`src/lib/trustMaturityQuestions.ts`**
- Endre `MaturityAnswer`-typen til de 4 nye verdiene.
- Oppdater `migrateLegacyAnswers`: map `"yes" → "done"`, `"no" → "not_started"`, `"later" → "not_started"`, `"n_a" → "not_relevant"`, `"unsure" → "not_started"`.
- `deriveDefaultAnswers`: default `"not_started"` istedenfor `"later"`; sett `"done"` der hvor det før ble `"yes"`, og `"not_relevant"` der det før ble `"n_a"`.
- Tilsvarende i `DOCUMENT_SLOTS`-kommentar: "auto-flip to done".

**`src/hooks/useCustomerBaseline.ts`**
- `isAnswered`: returnér `true` for `"done" | "in_progress" | "not_relevant"` (alle eksplisitt satt). `"not_started"` og `undefined` regnes som ikke besvart.

**`src/components/msp/BaselineQuestionsDrawer.tsx`**
- Erstatt `ANSWER_OPTIONS` med ny liste (4 verdier + ikon + farge-klasse).
- Bytt fra `Button`-rad til `DropdownMenu` (`@/components/ui/dropdown-menu`) med ikon-trigger.
- Fjern `Card`-wrapper rundt hvert spørsmål; bruk `group` rad-stil med `py-2.5` og `divide-y`.
- Oppdater tellingen i `TabsTrigger` (linje 130) til å bruke ny `isAnswered`-logikk.

**`src/components/msp/BaselineReadinessCard.tsx`**
- Oppdater alle steder som teller besvarte spørsmål til å matche ny logikk (`done | in_progress | not_relevant` = besvart).

**`src/pages/MSPCustomerDetail.tsx`**
- Type-kompatibilitet sjekkes for `suggestions`-mapping fra edge function (linje 333–338). Edge function gir fortsatt gamle verdier — kjør dem gjennom `migrateLegacyAnswers` før de skrives.

**`supabase/functions/suggest-baseline-answers/index.ts`**
- Oppdater prompt og JSON-schema `enum` til de 4 nye verdiene:
  - `not_started` når sannsynligvis ikke på plass
  - `in_progress` når noe arbeid er gjort men ikke ferdig
  - `done` kun når svært vanlig at en typisk norsk SMB har dette
  - `not_relevant` når ikke aktuelt
- Beholder konservativ tone (foretrekk `not_started` framfor å gjette `done`).

## Bakoverkompatibilitet
`migrateLegacyAnswers` håndterer alle eksisterende lagrede svar (localStorage) ved første lasting, så ingen brukerdata mistes.

## Ikke i scope
- Endrer ikke spørsmålstekstene.
- Endrer ikke scoring/maturity-tabellen (de fem nivåene i det vedlagte bildet) — kun svaralternativene per spørsmål.
- Ingen endring i andre kartlegginger utenfor baseline.
