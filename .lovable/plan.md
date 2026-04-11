

## Plan: Fjern gjentatte «Egenerklæring»-badges fra kontrollfelter

### Problem
Hver kontroll i redigeringsvisningen viser en «Egenerklæring / Self-declaration»-badge, og hvert kontrollområde viser antall egenerklærte. Dette skaper visuelt støy og er unødvendig repetisjon.

### Løsning
Fjern per-kontroll og per-område «Egenerklæring»-badges. Legg til en **enkel, sentral forklaring** øverst i seksjonen «Modenhet per kontroller» som sier at alle svar er egenerklærte.

### Endringer i `src/pages/TrustCenterEditProfile.tsx`

1. **Fjern per-kontroll badge** (linje 575-577): Fjern `<Badge>Egenerklæring</Badge>` som vises ved hvert enkelt kontrollfelt.

2. **Fjern per-område badge** (linje 544-548): Fjern `{selfDeclaredCount} egenerklært`-badgen fra hvert område-header.

3. **Legg til sentral badge** i info-boksen (linje 505-521): Legg til en liten badge eller tekst i den eksisterende info-boksen som sier f.eks. «Alle svar er egenerklærte med mindre annet er angitt» / «All responses are self-declared unless otherwise noted».

