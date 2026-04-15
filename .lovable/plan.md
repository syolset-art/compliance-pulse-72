

# Plan: Ny onboarding-rute og redirect til Trust Profile

## Endringer

### 1. Ny rute i `src/App.tsx`
- Legg til `/trust-engine-onboarding` som peker til eksisterende `Onboarding`-komponent (gjenbruk)
- Beholder `/onboarding` som alias for bakoverkompatibilitet

### 2. Oppdater `src/pages/Onboarding.tsx`
- `goToDashboard()` endres til å navigere til `/trust-center/profile` i stedet for `/`
- Oppdater teksten i "complete"-steget fra "dashboard" til "Trust Profile"
- Oppdater toast-melding tilsvarende
- "Til dashboard"-knappen i headeren endres til å peke til `/trust-center/profile`

### 3. Oppdater referanser
- `src/pages/TrustCenterProfile.tsx` linje 168: endre `/onboarding` → `/trust-engine-onboarding`
- `src/pages/TrustCenterEditProfile.tsx` linje 196: endre `/onboarding` → `/trust-engine-onboarding`

## Filer

| Fil | Endring |
|---|---|
| `src/App.tsx` | Legg til `/trust-engine-onboarding` rute |
| `src/pages/Onboarding.tsx` | Redirect til `/trust-center/profile` etter fullført |
| `src/pages/TrustCenterProfile.tsx` | Oppdater onboarding-link |
| `src/pages/TrustCenterEditProfile.tsx` | Oppdater onboarding-link |

