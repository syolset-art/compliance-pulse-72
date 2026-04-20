

## Plan: Mer brukervennlig statusfelt i Mynder-veiledning

"Mynder syntetiserer"-merkelappen i syntese-boksen er kryptisk. Erstatt med tydeligere språk som forklarer hva brukeren ser.

### Endring

**Fil:** `src/components/asset-profile/MynderGuidanceTab.tsx` (linje 67–72)

Erstatt dagens lilla pille "Mynder syntetiserer / Mynder synthesizes" med et mer beskrivende statusfelt:

**Ny visning:**
- Lite Sparkles-ikon (`h-3.5 w-3.5`) + tekst i én linje, plassert over sammendraget
- **NB:** "Mynders oppsummering basert på leverandørdata"
- **EN:** "Mynder's summary based on vendor data"
- Stil: subtil rad med `text-[11px] font-medium text-muted-foreground`, ikon i `text-primary`
- Tidsstempel til høyre: "Oppdatert nå" / "Updated just now" i `text-[10px] text-muted-foreground/70`

**Layout:**
```text
✦ Mynders oppsummering basert på leverandørdata        Oppdatert nå
─────────────────────────────────────────────────────────────────
[selve sammendragsteksten]
```

Boksen beholder samme `border-primary/15 bg-primary/[0.04]`-styling, men headeren blir informativ i stedet for et kryptisk merke.

### Ut av scope
- Endring av selve sammendragsteksten (genereres fortsatt av `recomputeSummary`)
- Endring av andre "Mynder"-merker andre steder i appen

