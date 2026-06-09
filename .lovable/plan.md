## Endringer på publisert Trust Profile — Underleverandører

### Hva
1. Fjerne søkefeltet i underleverandør-tabellen (publisert visning).
2. Begrense visningen til 5 underleverandører initialt.
3. Legge til en "Vis flere"-knapp som ekspanderer listen til å vise alle.

### Hvor
- Fil: `src/components/trust-center/profile/SubprocessorTable.tsx`

### Tekniske detaljer
- Fjerne `query`-state og `Input`-feltet (søk).
- Erstatte med `visibleCount`-state initiell verdi `5`.
- Filtrere rader for visning: `rows.slice(0, visibleCount)`.
- Legge til knapp nederst under tabellen som øker `visibleCount` til `rows.length` (vise alle). Tekst: "Vis alle X underleverandører" / "Show all X subprocessors".
- Opprydding: fjerne ubrukte imports (`Search`, `Input`).

### Ikke i scope
- Endring av filterknapper (Alle/Har TP/Mangler TP/Standard DPA).
- Endring av sortering eller kolonner.
- Endring av redigeringsvisning (`SubprocessorsSection.tsx`).