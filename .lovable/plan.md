
# Fargepalett-transformasjon: Apple-inspirert profesjonell design

## Analyse av nåværende problem
Den eksisterende fargepaletten er preget av:
- Sterke lilla toner (HSL 241° - blålilla)
- Rosa aksentfarger (HSL 271°-291° - lilla/magenta)
- "Søt" gradient fra lilla til rosa
- Varm beige bakgrunn som føles lite forretningsrettet

Dette passer dårlig for et GRC-verktøy (Governance, Risk, Compliance) som skal signalisere **tillit, kontroll og profesjonalitet**.

## Apple's designfilosofi (2024/2025)
Apple bruker en raffinert palett kjennetegnet av:
- **Nøytral bakgrunn**: Ren hvit/off-white eller dyp svart
- **Minimal primærfarge**: Blå som hovedfarge (HSL ~211°), brukt sparsomt
- **Subtile gråtoner**: Flere nivåer av grå for hierarki
- **Ingen gradienter på primære elementer**: Flat, ren estetikk
- **Høy kontrast**: Tydelig lesbarhet og tilgjengelighet

## Ny fargepalett for Mynder

### Light mode (Apple-inspirert)
```text
┌─────────────────────────────────────────────────────────────┐
│ BAKGRUNN                                                    │
│ --background: 0 0% 100%        (Ren hvit)                   │
│ --card: 0 0% 100%              (Hvit kort)                  │
│ --muted: 220 14% 96%           (Ultralys grå)               │
│                                                             │
│ PRIMÆRFARGE (Apple Blue)                                    │
│ --primary: 211 100% 50%        (Apple-blå #007AFF)          │
│ --ring: 211 100% 50%                                        │
│                                                             │
│ TEKST                                                       │
│ --foreground: 0 0% 10%         (Nesten svart)               │
│ --muted-foreground: 220 9% 46% (Medium grå)                 │
│                                                             │
│ SIDEBAR                                                     │
│ --sidebar-background: 220 13% 18% (Mørk grafitt)            │
│ --sidebar-foreground: 0 0% 100%   (Hvit tekst)              │
│                                                             │
│ GRADIENT                                                    │
│ --gradient-mynder: subtle blå-grå, ikke lilla-rosa         │
└─────────────────────────────────────────────────────────────┘
```

### Dark mode (Apple-inspirert)
```text
┌─────────────────────────────────────────────────────────────┐
│ BAKGRUNN                                                    │
│ --background: 0 0% 0%          (Ren svart)                  │
│ --card: 0 0% 7%                (Nesten svart kort)          │
│ --muted: 0 0% 12%              (Dyp grå)                    │
│                                                             │
│ PRIMÆRFARGE (Apple Blue - lyser variant)                    │
│ --primary: 211 100% 60%        (Lysere blå for mørk modus)  │
│                                                             │
│ TEKST                                                       │
│ --foreground: 0 0% 100%        (Hvit)                       │
│ --muted-foreground: 0 0% 64%   (Medium grå)                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementeringsplan

### Fil 1: `src/index.css`
Oppdatere alle CSS-variabler med Apple-inspirerte verdier:

**Light mode:**
- `--background`: `0 0% 100%` (ren hvit)
- `--foreground`: `0 0% 10%` (nesten svart)
- `--primary`: `211 100% 50%` (Apple-blå)
- `--secondary`: `220 14% 96%` (ultralys grå)
- `--muted`: `220 14% 96%`
- `--muted-foreground`: `220 9% 46%`
- `--accent`: `211 100% 95%` (lys blå tint)
- `--border`: `220 13% 91%` (subtil grå)
- `--sidebar-background`: `220 13% 18%` (mørk grafitt)
- `--gradient-mynder`: `linear-gradient(135deg, hsl(220 13% 18%) 0%, hsl(220 13% 28%) 100%)` (subtil mørk gradient)

**Dark mode:**
- `--background`: `0 0% 0%` (ren svart)
- `--card`: `0 0% 7%`
- `--primary`: `211 100% 60%` (lysere blå)
- `--muted`: `0 0% 12%`
- `--muted-foreground`: `0 0% 64%`
- `--border`: `0 0% 20%`

**Utility-klasser:**
- Oppdatere `.shadow-luxury` til å bruke nøytral skygge (ikke lilla glow)
- Oppdatere `.glow-primary` til blå glow

### Fil 2: `tailwind.config.ts`
Oppdatere animasjoner:
- `glow-pulse`: Endre fra lilla (`rgba(124, 58, 237, ...)`) til blå (`rgba(0, 122, 255, ...)`)

### Visuell sammenligning

**Før (nåværende "søt" palett):**
```text
Sidebar: Lilla (#6366f1)
Gradient: Lilla → Rosa → Magenta
Bakgrunn: Varm beige
```

**Etter (Apple-profesjonell):**
```text
Sidebar: Mørk grafitt (#2C2C2E)
Primærfarge: Apple-blå (#007AFF) - brukt sparsomt
Bakgrunn: Ren hvit (#FFFFFF)
```

## Resultat
En fargepalett som:
- Signaliserer **tillit og profesjonalitet** for GRC-arbeid
- Følger Apple's moderne designspråk
- Er behagelig å jobbe med over tid (ikke slitsom på øynene)
- Har høy kontrast og god tilgjengelighet
- Matcher produktets formål: datakontroll, compliance og risikohåndtering

## Tekniske filer som endres
1. `src/index.css` - Alle CSS-variabler
2. `tailwind.config.ts` - Animasjonsfarger (glow-pulse)
