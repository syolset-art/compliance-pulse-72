## Mål
Redusere visuell støy fra `TrustProfileHero`-kortet på Trust Center-dashboardet. Kortet skal fortsatt være sentralt og gi rask oversikt, men ikke dominere siden.

## Endringer

### 1. Fjern gradient og tyngde
- Fjern `bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20`
- Bytt til en ren, flat `Card` med standard `border` og `bg-card`

### 2. Reduser ikonet
- Fjern det store shield-ikonet (`h-12 w-12 rounded-xl bg-primary/15`) helt, eller erstatt det med et minimalt inline-ikon ved siden av tittelen

### 3. Kompakt knappestruktur (fra 3 til 1–2 synlige CTA-er)
- **Behold én primærknapp:** "Rediger profil"
- **"Åpne profil"** gjøres om til en subtil lenke på URL-teksten selv (f.eks. klikkbar, med ekstern-lenke-ikon til høyre)
- **"Kopier lenke"** gjøres om til et lite ikon (Copy) ved siden av URL-en, ikke en egen knapp

### 4. Kompakt layout
- Reduser padding fra `p-5` til `p-4` eller `p-3`
- Legg innholdet på én rad der det er mulig, eller to tette rader:
  - Rad 1: Tittel + Publisert-badge + Rediger-knapp (høyrejustert)
  - Rad 2: URL (klikkbar) + Sist oppdatert (mindre tekst)

### 5. Typografi
- Tittel: behold `text-lg font-semibold`, men senk kontrasten om nødvendig
- URL og dato: `text-sm` / `text-xs text-muted-foreground`
- Fjern `mt-4` gap mellom tekst og knapper — reduser til `mt-2` eller mindre

## Ikke-endres
- Tekstinnhold og oversettelser beholdes
- Navigasjonslogikk (`navigate("/trust-center/edit")`, ekstern lenke, kopiering) beholdes
- Data-fetching (Supabase-queries) beholdes
- Kun denne komponenten (`src/components/dashboard-trust/TrustProfileHero.tsx`) endres