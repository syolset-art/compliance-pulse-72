
# Plan: Ressursside med læringssenter og demoer

## Oversikt
Legger til et nytt menypunkt "Ressurser" nederst i sidemenyen som gir kunden tilgang til:
- Veiledninger og opplæringsmateriell om Mynder-plattformen
- Demoer og interaktive gjennomganger
- Faglige ressurser om GDPR, NIS2, ISO 27001 etc.
- Supportinformasjon og kontaktmuligheter

## Visuelt konsept

```text
┌─────────────────────────────────────────┐
│  📚 RESSURSER                           │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🚀 Kom i gang                       ││
│  │    Interaktiv opplæring             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🎬 Demoer                           ││
│  │    Se hvordan modulene fungerer     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📖 Kunnskapsbase                    ││
│  │    Fagartikler og veiledninger      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 💬 Support                          ││
│  │    Kontakt oss / FAQ                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Implementeringsplan

### 1. Oppdater sidemenyen (`src/components/Sidebar.tsx`)
- Legg til nytt menypunkt "Ressurser" med `BookOpen` eller `GraduationCap` ikon
- Plasseres rett før selskaps-seksjonen (før `border-t`)
- Lenker til `/resources`

### 2. Opprett ressursside (`src/pages/Resources.tsx`)
Ny side med følgende seksjoner:

**Kom i gang**
- Introduksjonsvideo/guide til plattformen
- Trinn-for-trinn opplæring
- Quick-start guider

**Demoer**
- Interaktive demoer for ulike moduler
- Video-gjennomganger av nøkkelfunksjoner
- Knapp for å starte demo-modus

**Kunnskapsbase**
- GDPR-veiledninger
- NIS2-ressurser
- ISO 27001-materiell
- AI Act-dokumentasjon
- Beste praksis-artikler

**Support**
- FAQ-seksjon
- Kontaktinformasjon
- Lenke til helpdesk

### 3. Legg til rute i App.tsx
- Importer `Resources` komponenten
- Legg til `<Route path="/resources" element={<Resources />} />`

### 4. Oppdater lokaliseringsfiler
**`src/locales/nb.json`:**
```json
"nav": {
  ...
  "resources": "Ressurser"
},
"resources": {
  "title": "Læringssenter",
  "subtitle": "Alt du trenger for å mestre Mynder",
  "gettingStarted": {
    "title": "Kom i gang",
    "subtitle": "Interaktiv opplæring for nye brukere",
    "items": {
      "intro": "Introduksjon til Mynder",
      "firstSteps": "Dine første steg",
      "quickStart": "Quick-start guide"
    }
  },
  "demos": {
    "title": "Demoer",
    "subtitle": "Se plattformen i aksjon",
    "startDemo": "Start demo"
  },
  "knowledge": {
    "title": "Kunnskapsbase",
    "subtitle": "Faglige ressurser og veiledninger"
  },
  "support": {
    "title": "Support",
    "subtitle": "Vi hjelper deg videre",
    "faq": "Ofte stilte spørsmål",
    "contact": "Kontakt oss"
  }
}
```

**`src/locales/en.json`:**
```json
"nav": {
  ...
  "resources": "Resources"
},
"resources": {
  "title": "Learning Center",
  "subtitle": "Everything you need to master Mynder",
  ...
}
```

## Filer som opprettes/endres

| Fil | Handling |
|-----|----------|
| `src/pages/Resources.tsx` | **Opprett** - Ny ressursside |
| `src/components/Sidebar.tsx` | **Endre** - Legg til menypunkt |
| `src/App.tsx` | **Endre** - Legg til rute |
| `src/locales/nb.json` | **Endre** - Legg til oversettelser |
| `src/locales/en.json` | **Endre** - Legg til oversettelser |

## Tekniske detaljer

### Sidebar-endring
Legger til følgende rett før `{/* Company section at bottom */}`:

```tsx
import { BookOpen } from "lucide-react";

// I navigation-seksjonen eller som egen lenke:
<Link
  to="/resources"
  className={cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-silk",
    location.pathname === "/resources"
      ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
  )}
>
  <BookOpen className="h-5 w-5" />
  {t("nav.resources")}
</Link>
```

### Ressurssiden
Bruker samme layout-struktur som andre sider med:
- `Sidebar` komponent
- Sentrert innhold med `container max-w-7xl mx-auto`
- Kort-basert design for hver seksjon
- Apple-inspirert styling (hvit bakgrunn, subtile skygger, blå aksenter)
