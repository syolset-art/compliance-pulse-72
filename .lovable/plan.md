

## Plan: Flytt «Forespørsler» fra Registre til Styringsverktøy

Du har rett — Forespørsler er et aktivt arbeidsverktøy knyttet til leverandørstyring, ikke et passivt register. Det hører hjemme sammen med Oppgaver, Avvik og Rapporter.

### Endring

**Fil: `src/components/Sidebar.tsx`**
- Flytt `{ name: "nav.requests", href: "/customer-requests", icon: FileQuestion }` fra `registriesNav`-arrayet til `managementNav`-arrayet (plasseres etter «Rapporter»)

Én linje flyttes, ingen andre endringer.

