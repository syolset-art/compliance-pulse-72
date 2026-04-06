

## Plan: Gjør «Forespørsler» mer synlig i sidebaren

### Problem
«Forespørsler»-siden (`/customer-requests`) er gjemt inne i Trust Center-undermenyen som «Contact & Requests». Brukeren finner den ikke og trenger rask tilgang til både sendte og mottatte forespørsler.

### Løsning
Legg til «Forespørsler» som et eget menypunkt i **Moduler**-seksjonen i sidebaren, der den hører hjemme sammen med leverandører, systemer og eiendeler. Behold også lenken i Trust Center for de som navigerer derfra.

### Endringer

| Fil | Endring |
|-----|---------|
| `src/components/Sidebar.tsx` | Legg til `{ name: "nav.requests", href: "/customer-requests", icon: FileQuestion }` i `modulesNav`-arrayen |
| `src/locales/nb.json` | Legg til `"nav.requests": "Forespørsler"` |
| `src/locales/en.json` | Legg til `"nav.requests": "Requests"` |

### Resultat
«Forespørsler» vil være synlig direkte i sidebaren under «Moduler», mellom eksisterende moduler. Siden viser allerede faner for innkommende, utgående og maler.

