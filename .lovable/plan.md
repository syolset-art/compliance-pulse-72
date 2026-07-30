## Problem

I tabellen på «Alle»-fanen viser Status-kolonnen «Klar til bruk» / «Bør tilpasses». Skillet er utledet av `template.delivery` (`recurring` = «Bør tilpasses») og sier lite for partneren.

## Endring

Bytt Status-kolonnen med **Aktiviteter** — antall foreslåtte aktiviteter i malen (`template.activities`), som brukeren ser i detalj når tjenesten åpnes.

```text
Tjeneste            Støtter                  Aktiviteter        Handling
DPO-as-a-service    GDPR + 6 krav            5 aktiviteter      [Legg til]
Penetrasjonstest    NIS2 + 4 krav            4 aktiviteter      [Legg til]
```

**Konkret i `src/components/msp/MSPServiceCatalogTab.tsx`:**
- Kolonneoverskrift «Status» → «Aktiviteter».
- Cellen viser `template.activities.length` som nøytral tekst («5 aktiviteter», «1 aktivitet», «—» hvis tom) — ikke en farget pille, siden dette er et tall og ikke en tilstand.
- Tooltip på tallet lister de 3–4 første aktivitetsnavnene med «… og N til», og avsluttes med «Åpne tjenesten for å se alle aktivitetene».
- `templateStatus()`-hjelperen fjernes hvis den ikke brukes andre steder; ellers beholdes den urørt.
- Estimert timetall per aktivitet vises ikke her — det ligger allerede i detaljvisningen.

Ingen andre kolonner, filtre eller handlinger endres, og «På tilbud»/«Lagt til»-logikken i Handling-kolonnen står urørt.

## Teknisk

- Kun presentasjon i `MSPServiceCatalogTab.tsx`; ingen endringer i `src/lib/serviceLibrary.ts` eller datamodellen.
- Tekst holdes på `text-sm`/`text-xs` (min. 12 px) av hensyn til UU, med `tabular-nums` på tallet.
