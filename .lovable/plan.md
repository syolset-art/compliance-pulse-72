
# Differensiert visning: Egen Trust Profil vs. leverandorprofil

## Problemstilling
I dag viser AssetTrustProfile identisk grensesnitt uansett om brukeren ser pa sin egen profil (`asset_type === 'self'`) eller en leverandors profil. Funksjoner som "Be om oppdatering" (Request Update) gir ikke mening pa ens egen profil - det er en handling man gjor mot en leverandor.

## Endringer

### 1. AssetHeader.tsx - Skjul "Be om oppdatering"-knappen for self
- Knappen "Be om oppdatering" (linje 293-301) skjules nar `asset_type === 'self'`
- For self-profilen vises i stedet en "Forhandsvisning"-knapp (Preview) som lar brukeren se hvordan profilen ser ut for kunder/leverandorer som mottar den

### 2. AssetMetrics.tsx - Skjul utlopt-dokumenter-varselet for self
- Banneret "X dokumenter er utlopt" med "Be om oppdatering"-knappen (linje 110-129) skjules nar asset er av type `self`
- Krever at `asset_type` sendes inn som prop fra AssetTrustProfile.tsx

### 3. AssetTrustProfile.tsx - Send asset_type til AssetMetrics
- Utvid props til AssetMetrics med `assetType` slik at den kan skille mellom self og leverandor

### 4. Valgfritt: Forandsvisning-modus (Preview Mode)
- Legge til en enkel "Se som kunde"-knapp pa self-profilen som viser en toast eller dialog med informasjon om at forandsvisning viser profilen slik kunder ser den (inkludert "Be om oppdatering"-knappen)
- Dette er en visuell indikator, ikke en full implementasjon av preview-modus i forste omgang

## Teknisk oversikt

| Fil | Endring |
|-----|---------|
| `AssetHeader.tsx` | Skjul "Be om oppdatering" for self, vis "Forhandsvisning" i stedet |
| `AssetMetrics.tsx` | Ta imot `assetType` prop, skjul expired-banner for self |
| `AssetTrustProfile.tsx` | Send `asset_type` til AssetMetrics |

## Resultat
- Egen Trust Profil: Viser administrasjonsvisning uten "Be om oppdatering"
- Leverandorprofil: Viser "Be om oppdatering" og utgatte dokumenter-varsler som for
