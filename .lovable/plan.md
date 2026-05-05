## Plan: Ny side "Bli Partner"

Lag en enkel informasjonsside som kort forklarer hva det innebærer å være Mynder-partner, med lenke videre til hjemmesiden for full informasjon. Legges inn som menypunkt i Partner-undermenyen i sidebaren.

### 1. Ny side: `src/pages/BliPartner.tsx`
Enkel, Apple-minimal layout (`pt-16`, sentrert maks-bredde):

- **Hero**: Tittel "Bli Mynder-partner" + kort ingress.
- **3 kort**: Korte verdiforslag, f.eks.
  - Tilbakevendende inntekt (revenue share / kommisjon)
  - Skalerbar leveranse med Lara AI
  - Markedsføring og opplæring inkludert
- **CTA-knapper**:
  - Primær: "Les mer på mynder.no" → ekstern lenke `https://mynder.no/bli-partner` (åpnes i ny fane).
  - Sekundær: "Se ROI-kalkulator" → intern lenke til `/msp-roi`.
- I18n: norske strenger direkte (matcher eksisterende MSP-sider som er på norsk).

### 2. Rute
- **`src/App.tsx`**: Importer `BliPartner` og legg til:
  ```
  <Route path="/bli-partner" element={<BliPartner />} />
  ```

### 3. Sidebar-menypunkt
- **`src/components/Sidebar.tsx`** (Partner-undermeny, ~linje 621-624): Legg til som første item:
  ```
  { name: "Bli Partner", href: "/bli-partner", icon: Sparkles }
  ```

### Notater
- Ruten `/msp-sales-guide` (intern salgsguide) beholdes uendret — den er for eksisterende partnere, ikke en intro.
- Ingen backend-endringer.
