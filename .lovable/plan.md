Legg til en kodekommentar i `src/components/dashboard-v2/NextActionCards.tsx` ved XP-visningen (linje ~80) som advarer utviklere om at poengteksten ("+50 XP", "+30 XP") kun skal rendres hvis det faktisk er mulig å beregne poeng relativt til scoring.

**Endring:**
- Finn stedet der `+50 XP` / `+30 XP` genereres.
- Legg til en `// TODO:` eller `// DEV NOTE:` kommentar som formidler hensikten.

Eksempel på kommentar:
```
// DEV NOTE: Vis XP-belønning kun dersom det er mulig å beregne poeng i forhold til scoring.
```

Ingen andre endringer i logikk eller styling.