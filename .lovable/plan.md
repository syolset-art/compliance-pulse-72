## Mål
Fjerne den valgte «Gratis»-merkelappen (span) fra `ModuleCard`-komponenten, siden den tar for mye plass og dupliserer prisinformasjonen som allerede vises til høyre på kortet.

## Endring
1. **Fjern badge-blokken i `src/components/subscriptions/ModuleCard.tsx`**
   - Slett betingelsen som rendrer:
     ```tsx
     {showFreePrice && !isIncluded && (
       <span ... >Gratis</span>
     )}
     ```
     Dette fjerner merkelappen, men beholdt prisvisningen på høyresiden og status-badge (Aktivert/Inkludert/Ikke aktivert).

2. **Verifisering**
   - Sjekk at `ModuleCard` fortsatt kompilerer og at kortet på abonnementssiden ikke lenger viser «Gratis»-merkelappen.
   - Bekreft at gratis/inkluderte moduler fortsatt viser «Gratis» i prisblokken til høyre.

## Ikke i scope
- Endre prisvisningen til høyre på kortet.
- Endre statusbadgene (Aktivert / Inkludert / Ikke aktivert).
- Endre plan- eller priskonstanter.