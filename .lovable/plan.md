

# Plan: Hjelpepanel for Trust Profile og Rediger Trust Profile

## Endringer

### 1. `src/pages/TrustCenterProfile.tsx`
Legger til `helpOpen`-state, `usePageHelpListener`, og en `ContextualHelpPanel` med innhold tilpasset Trust Profile-visningen:
- **Forstå**: Hva er Trust Profile, de fire kontrollområdene, hvorfor publisering er viktig
- **Gjør**: Gå til redigering, del profilen, publiser
- **Spør Lara**: Forslag om profiloptimalisering og publisering

### 2. `src/pages/TrustCenterEditProfile.tsx`
Legger til tilsvarende `helpOpen`-state, `usePageHelpListener`, og en `ContextualHelpPanel` tilpasset redigeringsvisningen:
- **Forstå**: Hvordan egenerklæringene fungerer, hva påvirker Trust Score, readiness-indikatoren
- **Gjør**: Fyll ut selskapsinformasjon, oppdater kontrollområder, gå til forhåndsvisning
- **Spør Lara**: Forslag om hjelp med kontroller og publiseringskrav

### Mønster
Følger nøyaktig samme mal som `AssetTrustProfile.tsx` og `Index.tsx`: `useState(false)` → `usePageHelpListener(setter)` → `<ContextualHelpPanel>` nederst i JSX. All tekst er lokalisert (nb/en).

## Filer

| Fil | Endring |
|---|---|
| `src/pages/TrustCenterProfile.tsx` | Legg til helpOpen state + ContextualHelpPanel |
| `src/pages/TrustCenterEditProfile.tsx` | Legg til helpOpen state + ContextualHelpPanel |

