## Kritikalitet og prioritet i leverandørkortet

To akser, samme rad rett under leverandørnavnet — visuelt sammenhørende, men tydelig adskilt via farge og ikon.

### Designprinsipp

- **Kritikalitet** (objektiv): fargekodet pille (rød/oransje/grønn) med prikk. Vises alltid — enten som verdi eller som "+ Sett kritikalitet".
- **Prioritet** (subjektiv, valgfri): pille med flagg-ikon i amber/blå nøytral palett, så den ikke konkurrerer med kritikalitetens risiko-farger. Vises kun hvis satt; ellers diskret stiplet "+ Sett prioritet".
- **Ingenting satt**: en lilla "Lara foreslår"-pille med stjerne-ikon dukker opp ved siden av Sett-knappene. Klikk åpner Lara med begrunnelse + "Godta / Endre".

### De tre tilstandene

```text
A · Bare kritikalitet (vanligst)
   [● Lav kritikalitet]   [⊕ Sett prioritet]

B · Begge satt
   [● Lav kritikalitet]   [▲ Prioritert Q2]

C · Ingenting satt
   [⊕ Sett kritikalitet]   [⊕ Sett prioritet]   [✦ Lara foreslår]
```

Plassering: rett under `<h1>` i `VendorStatusBanner`, før org-meta-linjen. Ikke på samme linje som navnet — gir pillene pusterom og navnet beholder visuell tyngde.

### Endringer

**`src/components/asset-profile/VendorStatusBanner.tsx`**
- Utvid `asset`-interface med `criticality?: string | null` og `priority?: string | null`.
- Fjern den eksisterende `criticality` Badge ved siden av navnet.
- Legg inn ny rad rett under `<h1>` med to `VendorInlinePillSelect`-instanser (criticality + priority) + betinget "Lara foreslår"-knapp når begge er null.
- Fjern den nå ubrukte `criticality`/`deriveCriticality`-koden i komponenten.

**`src/components/vendor-dashboard/VendorInlinePillSelect.tsx`**
- Endre prioritet-pill til amber/flagg-ikon-stil (Flag-ikon fra lucide) i stedet for å gjenbruke risiko-farger — så den visuelt skiller seg fra kritikalitet.
- La "tom" tilstand for prioritet være enda mer dempet (ghost, ingen border) så den ikke skriker.

**Hover/detaljvisning** (mindre tillegg): pillene har allerede dropdown for å endre verdi via `VendorInlinePillSelect` — det dekker behovet for inline-redigering uten å åpne kortet.

### Lara-pille adferd

Klikk på "Lara foreslår" trigger toast nå (`toast.info`). I neste iterasjon kan vi koble til `analyze-vendor`-edge-funksjonen for å få et faktisk forslag — men holder denne planen scoped til UI-strukturen.
