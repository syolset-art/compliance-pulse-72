

## Notatfelt for delvis oppfylte kontroller

### Problem
Når en kontroll har status «delvis oppfylt» (uansett om den er automatisk eller manuell), kan brukeren ikke legge til et notat uten å gå via «Dokumenter manuelt»-dialogen.

### Løsning
Legg til et inline notatfelt i den utvidede visningen for kontroller med status `partial`. Feltet vises direkte under statusen, med en Textarea og en Lagre-knapp. Notater lagres i lokal state (per requirement_id).

### Teknisk endring

**Fil: `src/components/regulations/FrameworkRequirementsList.tsx`**

1. Legg til state `reqNotes: Record<string, string>` for å holde notater per krav-ID
2. I den utvidede seksjonen (linje 188-216), for kontroller med `state.status === "partial"`:
   - Vis et amber-farget info-panel (likt det grønne for "met") som viser at kontrollen er delvis oppfylt
   - Under panelet: en `Textarea` med placeholder "Legg til notat om hva som gjenstår..."
   - En liten "Lagre notat"-knapp som lagrer til `reqNotes` state og viser en toast-bekreftelse
   - Hvis et notat allerede er lagret, vis det som tekst med en "Rediger"-knapp
3. Denne funksjonaliteten gjelder **alle** kontroller med partial-status, inkludert automatiske (agent_capability === "full")

### UI-skisse
```text
┌─────────────────────────────────────────────────────┐
│ ⚠ REQ-03  Kravnavn                  AUTOMATISK 50% │
│   Beskrivelse...                                    │
│ ─────────────────────────────────────────────────── │
│   ⚠ Delvis oppfylt                                 │
│   ┌───────────────────────────────────────────┐     │
│   │ Legg til notat om hva som gjenstår...     │     │
│   └───────────────────────────────────────────┘     │
│                                  [Lagre notat]      │
│   [Dokumenter manuelt]                              │
└─────────────────────────────────────────────────────┘
```

