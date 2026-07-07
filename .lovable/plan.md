## Bakgrunn
Trust Profile skal i dag kun være en privat, samlet oversikt for brukeren. Deling med kunder og leverandører kommer senere. Vi må derfor fjerne eller skjule all publiseringsrelatert UI nå.

## Endringer

### 1. Dashboard — TrustProfileHero
- Fjern badge-pillen "Publisert" / "Ikke publisert".
- Fjern URL-lenke, ekstern-lenke-ikon og kopier-knapp (ikke delbart ennå).
- Behold tittel "Din Trust Profile" og "Rediger"-knappen.
- Behold oppdatert-dato hvis relevant.

### 2. Trust Profile-visning — TrustCenterProfile.tsx
- Skjul `VisibilitySelector`-komponenten som lar bruker bytte mellom Økosystem og Offentlig.
- Skjul/fjern eventuell "Publiser"-knapp eller publiseringsstatus-badger i profil-headeren.

### 3. Redigering — TrustCenterEditProfile.tsx
- Skjul `PublishStickyBar` (den vises når profilen er ≥ 80 % komplett og tilbyr publisering).
- Behold "Forhåndsvis" om den finnes som egen knapp, men endre formålstekst til privat oversikt.

### 4. Produkter — TrustCenterProducts.tsx
- Fjern eller skjul "Publisert" / "Utkast"-pillene på produkter/tjenester.

### 5. Publisering-klarhet — PublishingReadiness.tsx
- Endre tekst fra "Klar for publisering" til noe nøytralt, f.eks. "Profilkompletthet" eller "Oversikt over utfylte områder", slik at den fungerer som en ren fremdriftsindikator uten publiseringsretorikk.
- Behold sjekklisten og fremdriftsbaren.

### 6. Synlighetsdefinisjon — trustVisibility.ts (valgfritt)
- Ingen endring av datamodell. `public`-valget kan beholdes i koden, men UI-en skjuler det.

## Akseptansekriterier
- Ingen steder i appen ser brukeren ordet "Publisert", "Ikke publisert", "Offentlig" eller "Publiser" i forbindelse med Trust Profile.
- Bruker kan fortsatt åpne, redigere og se sin egen Trust Profile som privat oversikt.
- TypeScript-kompilering og eksisterende tester passerer.