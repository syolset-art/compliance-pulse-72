

## Forenkle Trust Center-undermenyen

### Nåværende struktur (sidebar)
Trust Center har i dag 8 separate menypunkter:
1. Trust Profile
2. Rediger profil
3. Products & Services
4. Compliance Status
5. **Regelverk**
6. **Policies**
7. **Certifications**
8. Contact & Requests

### Problem
Policies, Certifications og delvis Compliance Status overlapper — de handler alle om dokumentasjon og bevis. Separate sider for hver gir unødvendig navigasjon.

### Forslag: Slå sammen til "Dokumentasjon & Evidens"

Ny struktur (6 punkter i stedet for 8):

1. **Trust Profile** — `/trust-center/profile`
2. **Rediger profil** — `/trust-center/edit`
3. **Products & Services** — `/trust-center/products`
4. **Regelverk** — `/trust-center/regulations`
5. **Dokumentasjon & Evidens** — `/trust-center/evidence` *(ny samleside)*
6. **Contact & Requests** — `/customer-requests`

"Compliance Status" fjernes som eget punkt (dekkes av Regelverk + Trust Profile).

### Ny samleside: Dokumentasjon & Evidens

Én side (`/trust-center/evidence`) med tre kategorier vist som seksjoner eller faner:

- **Retningslinjer** (Policies) — eksisterende innhold fra `TrustCenterPolicies`
- **Sertifiseringer** (Certifications) — eksisterende innhold fra `TrustCenterCertifications`
- **Dokumenter** (Documents) — generelle dokumenter og bevis

Hver seksjon viser en kompakt liste med mulighet for å legge til nye elementer.

### Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/components/Sidebar.tsx` | Erstatt Policies, Certifications og Compliance Status med ett punkt: "Dokumentasjon & Evidens" (`/trust-center/evidence`) |
| `src/pages/TrustCenterEvidence.tsx` | **Ny side** — samler policies, sertifiseringer og dokumenter med 3 faner/seksjoner. Gjenbruker innhold fra eksisterende sider. |
| `src/App.tsx` (router) | Legg til route for `/trust-center/evidence` |
| `src/pages/TrustCenterEditProfile.tsx` | Oppdater "Dokumentasjon og bevis"-seksjonen: lenke til `/trust-center/evidence` i stedet for separate sider |

Eksisterende sider (`TrustCenterPolicies.tsx`, `TrustCenterCertifications.tsx`) beholdes som fallback/routes men sidebar peker kun til den nye samlede siden.

