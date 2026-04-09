

## Endre SecurityFoundationsWidget

### Hva skal gjøres

1. **Endre navn** fra "Sikkerhet og kontroller" / "Security and Controls" til "Sikkerhetsgrunnlag" / "Security Foundations"

2. **Fiks mobilvisning** - alle 5 pilarer vises. Nå bruker grid `grid-cols-1 sm:grid-cols-2` som gir en 2x2+1 layout kun på `sm+`. På mobil (375px) stables de vertikalt og tar mye plass. Løsning: komprimere pilar-kortene til en tettere listevisning på mobil slik at alle 5 synes uten for mye scrolling. Bruk en kompakt rad-layout (ikon + navn + progress bar + prosent) i stedet for de store kortene på mobil.

### Teknisk endring

**Fil:** `src/components/widgets/SecurityFoundationsWidget.tsx`

- Linje 37: Endre tittel til `"Sikkerhetsgrunnlag"` / `"Security Foundations"`
- Linje 53-88: Legg til responsiv visning:
  - **Mobil (`< sm`):** Kompakt listeformat - hver pilar er én rad med ikon, navn, smal progress bar og prosent/maturity på én linje
  - **Desktop (`sm+`):** Behold nåværende 2-kolonners rutenett med kort

Ingen andre filer eller databaseendringer.

