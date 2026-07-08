## Mål
Legg til en enkel, generell tooltip på hvert kontrollpunkt/krav slik at brukeren skjønner at raden er klikkbar og hva som skjer ved klikk.

## Tekst (i18n)
- NB: «Klikk på kravet for å lese mer og utføre oppgaven»
- EN: «Click the requirement to read more and complete the task»

## Endringer

### 1. `src/components/asset-profile/tabs/VendorControlsTab.tsx`
- Wrappe hver kontroll-rad (`div` med `key={c.key}` inne i `CardContent`) i shadcn `Tooltip` (`TooltipProvider` + `TooltipTrigger asChild` + `TooltipContent`).
- Legg til `cursor-pointer` på raden for å signalisere klikkbarhet (visuelt hint – ingen ny onClick-logikk).
- Tooltip-tekst: generell hjelpetekst over.

### 2. Regelverk-siden / `src/components/compliance/RequirementCard.tsx`
- Wrappe både `compact`- og full-varianten i `Tooltip` med samme generelle tekst.
- Beholder eksisterende `onStartTask` / `onViewDetails`-oppførsel – kun visuell tilføyelse.

### 3. i18n
- Bruk `useTranslation()`; siden filene allerede sjekker `i18n.language === "nb"`, følger vi samme mønster (inline nb/en) for å unngå å røre translation-JSON.

## Utenfor scope
- Ingen endring i data, klikk-handlere, eller styling utover `cursor-pointer` og tooltip.
- Ingen dynamisk beskrivelse per krav (kun generell tekst, jf. brukerens valg).
