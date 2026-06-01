# Demo-musepeker for Trust Profile-aktivering

Når demoen kjører (`?demo=activation` eller "Spill av demo"-knappen), skal en visuell musepeker fly inn på skjermen, bevege seg til det viktige elementet i hvert steg, "klikke" (liten skala-puls + ring-effekt), og deretter trigge handlingen — slik at seeren forstår hvor fokus ligger.

## Konsept

- En `<DemoCursor />`-komponent rendres som en `position: fixed` overlay (z-index høy, `pointer-events: none`) når `autoPlay` er aktiv i wizarden.
- Pekeren har:
  - SVG-musepeker (Apple-aktig minimal, deep purple/primary med hvit kant og myk skygge)
  - Liten "klikk"-puls (ekspanderende ring) når den utfører et klikk
  - Smooth easing-animasjon mellom mål (CSS `transition: transform 700ms cubic-bezier(0.4, 0, 0.2, 1)`)
- Mål-elementer markeres med `data-demo-target="<key>"` på de viktigste interaktive elementene i hvert wizard-steg (primær CTA, scan-knapp, "Publiser"-knapp, osv.).

## Flyt per steg

Wizardens eksisterende auto-play-timer utvides slik at den **først** beveger pekeren til mål-elementet, **så** simulerer klikk, **så** kaller `next()`/`handlePublish()`. Total rytme holdes på ~40 sek.

Per steg (forenklet):
1. **Steg 1 – Velkomst**: peker → "Start aktivering"-CTA → klikk-puls → next.
2. **Steg 2 – Lara-skann**: peker → "Start skann"-knapp (hvis vi auto-trigger). Allerede auto-advance, men pekeren peker på skann-resultatet mens det fylles ut.
3. **Steg 3 – Kontakter**: peker → primær CTA → klikk → next.
4. **Steg 4 – Dokumenter**: peker → upload/CTA → klikk → next.
5. **Steg 5 – Policyer**: peker → CTA → klikk → next.
6. **Steg 6 – Forhåndsvisning**: peker beveger seg rolig over modenhetsbaren (uten klikk) for å fremheve resultatet, deretter til "Publiser"-knappen → klikk → next.
7. **Steg 7 – Ferdig**: peker → "Se Trust Profile"-CTA → klikk-puls → onCompleted.

Mellom steg får pekeren en kort "idle drift" (subtil flyt) slik at den ikke føles statisk.

## Tekniske detaljer

**Nye filer:**
- `src/components/trust-center/activate/DemoCursor.tsx` — selve overlay-komponenten. Eksponerer ref-API: `moveTo(target: HTMLElement | {x,y})`, `click()`, `hide()`.
- `src/hooks/useDemoCursor.ts` — liten hook som gir `cursorRef` + `moveToSelector(selector)` og `clickAt(selector)` (henter element via `document.querySelector('[data-demo-target="..."]')`, regner ut senter via `getBoundingClientRect()`).

**Endringer:**
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`:
  - Render `<DemoCursor />` når `autoPlay` er sant.
  - Erstatt eksisterende `setTimeout(next, X)` med en liten sekvens: `moveToSelector(target) → vent ~700ms → clickAt(target) → vent ~250ms → next()`. Total per-steg-tid justeres slik at sluttsummen forblir ~40 sek (juster ned eksisterende delays med ~1s per steg).
  - Legg til `data-demo-target="step-N-primary"` på primær-CTA i hvert steg (samme komponent-tre, ingen logikk-endring).
- `src/pages/TrustCenterProfile.tsx`: ingen funksjonelle endringer; pekeren bor i wizarden.

**Visuell design (følger Apple-aktig minimal + deep purple primary):**
- Peker: 24×24 SVG, fyll `hsl(var(--primary))`, hvit 1.5px kant, `drop-shadow(0 4px 10px rgba(0,0,0,0.15))`.
- Klikk-puls: 36px ring som skalerer fra 0.4 → 1.4 og fader ut over 450ms.
- Bevegelse: `cubic-bezier(0.4, 0, 0.2, 1)` 700ms, alltid jevn.
- Skjules helt utenfor demo (`autoPlay=false`).

**Tilgjengelighet/produksjon:**
- `pointer-events: none` slik at den aldri blokkerer faktiske klikk.
- `aria-hidden="true"`.
- Vises kun når `autoPlay` er sant — ingen påvirkning utenfor demo.

## Filer som endres

- ny: `src/components/trust-center/activate/DemoCursor.tsx`
- ny: `src/hooks/useDemoCursor.ts`
- endret: `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` (auto-play sekvens + `data-demo-target`-attributter)

Ingen data-/RLS-/edge-endringer.