

## UX/UU-forbedringer for aktivitetsskjemaene

Gjennomgang av `RegisterActivityDialog` og `CreateUserTaskDialog` avdekker flere UX- og tilgjengelighetsproblemer som bor fikses.

### Problemer identifisert

| Problem | Komponent | UX/UU |
|---|---|---|
| Labels mangler `htmlFor`/`id`-kobling | RegisterActivityDialog (alle felt) | UU: Skjermlesere kan ikke koble label til input |
| Type-velger-knapper mangler `aria-pressed`/`role` | RegisterActivityDialog | UU: Skjermleser forstår ikke valgtilstand |
| Ingen `aria-required` på obligatoriske felt | Begge | UU: Skjermleser annonserer ikke at felt er påkrevd |
| Ingen `aria-describedby` for hjelpetekst i dialog-header | RegisterActivityDialog | UU: Beskrivelsen kobles ikke til dialogen |
| Mangler `DialogDescription` (Radix advarer om dette) | Begge | UU: Radix accessibility warning |
| Ingen `<form>`-element eller `onSubmit` med Enter-tastestøtte | Begge | UX: Brukere kan ikke sende med Enter |
| Ingen visuell feilmelding ved tom tittel | RegisterActivityDialog | UX: Knappen deaktiveres stille uten forklaring |
| `CreateUserTaskDialog` hardkodet norsk uten i18n | CreateUserTaskDialog | UX: Bryter med plattformens tospråklige standard |

### Plan

**Fil 1: `src/components/asset-profile/RegisterActivityDialog.tsx`**
- Legg til unike `id`-attributter på alle Input/Textarea/Select og koble med `htmlFor` på tilhørende Label
- Legg til `aria-pressed` og `role="radio"` (eller `role="option"` med `aria-selected`) på type-velger-knappene, og wrap i `role="radiogroup"` med `aria-label`
- Legg til `aria-required="true"` på tittel-inputen
- Bruk `DialogDescription` fra Radix i stedet for rå `<p>` for beskrivelsen
- Wrap feltene i et `<form onSubmit={...}>` slik at Enter sender skjemaet, med `e.preventDefault()`
- Vis inline feilmelding under tittel-feltet ved forsøk på å sende tomt

**Fil 2: `src/components/tasks/CreateUserTaskDialog.tsx`**
- Legg til `aria-required="true"` på tittel-inputen
- Legg til `htmlFor`/`id` på Select-feltet for eiendel
- Bruk `DialogDescription` for undertekst
- Wrap i `<form>` med Enter-støtte
- Legg til i18n-støtte (isNb-sjekk) på alle hardkodede norske strenger
- Vis inline feilmelding i stedet for bare toast ved manglende tittel

### Tekniske detaljer

- Bruker `DialogDescription` fra `@/components/ui/dialog` (re-eksportert fra Radix)
- Type-velger-knapper endres til `role="radio"` med `aria-checked` i en `role="radiogroup" aria-label="Type aktivitet"`
- `<form>` wrapping med `onSubmit` handler som kaller `e.preventDefault()` og deretter `handleSubmit()`
- Legger til `aria-invalid` og en `<p role="alert">` for inline feilmelding på tittel

