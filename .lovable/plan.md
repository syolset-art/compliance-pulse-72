Oppgave: Endre teksten "Anbefalt dokumentasjon (N)" til "Veiledning til dokumentasjon" på alle krav.

Funn:
- Labelen er hardkodet i `src/components/regulations/FrameworkRequirementsList.tsx` (~linje 592).
- Norsk tekst: `{isNb ? \`Anbefalt dokumentasjon (${docs.length})\` : ...}`
- Engelsk tekst: `{isNb ? ... : \`Recommended documentation (${docs.length})\`}`

Tiltak:
1. Oppdater den norske strengen til `Veiledning til dokumentasjon (${docs.length})`.
2. Oppdater den engelske strengen til `Documentation guidance (${docs.length})` for å speile endringen.
3. Sjekker at det ikke finnes andre steder med samme label (f.eks. oversettelsesfiler) og oppdaterer disse hvis nødvendig.

Ingen endringer i design/layout; kun tekstendring.