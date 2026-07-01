## Endring
Gjør "Kontakt oss"-knappen (linje ~2557 i `src/pages/TrustCenterProfile.tsx`) om til en klikkbar `mailto:`-lenke som åpner brukerens epostklient med adressen til hovedkontaktpersonen.

## Tekniske detaljer
- `asset` er allerede i scopet (fra `useQuery` linje 209).
- Hovedkontakt-e-post hentes fra `asset.contact_email`, med fallback til `asset.metadata?.contacts?.general` (samme logikk som brukes i kontaktinfo-seksjonen linje 1033).
- Knappen pakkes i en `<a href={`mailto:${generalEmail}`}>` eller får en `onClick` som setter `window.location.href = mailto:...`.
- Hvis e-post mangler, vises knappen som disabled med tooltip "Ingen kontakt-e-post registrert".

## Fil
`src/pages/TrustCenterProfile.tsx` — ca. 3–4 linjers endring rundt linje 2557.