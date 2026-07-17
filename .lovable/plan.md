## Mål
Når brukeren velger «Verifisert» som status, skal en subtil, veiledet flyt starte: last opp dokument → Lara analyserer artikkeldekning → resultat vises kompakt. Flyten finnes allerede via `AttachEvidenceDialog`, men trenger UX-polish for å være mer subtil, skalerbar og lett å forstå.

## Endringer

### 1. `src/components/regulations/AttachEvidenceDialog.tsx` — slankere dialog med tydelig 3-stegs mikroflyt
- Kompakt header: fjern lange beskrivelser. Kun `«{requirementName}» → Last opp bevis` + liten hjelpe-ikon med tooltip for lengre forklaring.
- Vis en subtil 3-punkts stegindikator øverst (`Last opp · Analyser · Bekreft`) med aktiv/ferdig-tilstander — små prikker, ingen store overskrifter.
- **Steg 1 (select):** droparea beholdes, men mindre padding (`p-6` → `p-5`), kortere tekst. Artikkellisten «Kravet skal dekke» flyttes bak et lite `Vis artikler`-toggle for å redusere støy.
- **Steg 2 (analyzing):** erstatt lang statisk tekst med en subtil animert linje med korte fasetekster som roterer hver 1.2s: `Leser dokumentet…` → `Sammenligner mot artikler…` → `Vurderer signatur…`. Bygger forståelse for hva AI gjør uten mye tekst.
- **Steg 3 (review):** behold coverage-bar og badges, men fjern forklarende paragrafer under. Signaturblokk krympes til én linje ikon+tekst; detaljene (utsteder) vises kun ved hover/tooltip.
- Konsistente knapper: primærknapp «Bekreft», sekundær «Bytt fil». Ingen toast med prosentandel — heller subtil bekreftelse (kort «Bevis tilknyttet»).

### 2. `src/components/regulations/FrameworkRequirementsList.tsx` — subtil inline-status på kortet
- Når `attachDialog` er aktiv for en req, vis en liten inline-chip på kortheaderen: `Analyserer…` med spinner (`h-3 w-3`) og `text-muted-foreground`. Fjernes når dialogen lukkes eller resultat er lagret.
- Etter bekreftelse: coverage-baren som allerede vises under kravet blir kilden til visuell tilbakemelding — ingen ekstra bannere.
- Fjern lang bekreftelses-toast; erstatt med kort `Bevis tilknyttet — {n}/{m} artikler dekket`.

### 3. Mikrokopi (NO/EN)
Kort, handlingsorientert:
- Overskrift: `Tilknytt bevis` (uendret)
- Undertittel: `Lara vurderer hvilke artikler dokumentet dekker.` (kortere)
- Steg-labels: `Last opp` · `Analyser` · `Bekreft`
- Analysefaser: `Leser dokument` · `Matcher artikler` · `Sjekker signatur`

## Ute av scope
- Ingen endringer i scoring, edge function `analyze-evidence-coverage`, eller datamodell.
- Ingen endring i når dialogen trigges (allerede korrekt: ved valg av «Verifisert» og ved «Last opp bevis»-knappen).

## Filer
- `src/components/regulations/AttachEvidenceDialog.tsx` — omskriv innhold, behold API.
- `src/components/regulations/FrameworkRequirementsList.tsx` — legg til inline `Analyserer…`-chip og kort toast.
