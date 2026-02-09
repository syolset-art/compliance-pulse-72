

# Plan: Oppdater dashbordet for PECB-modellen

## Funn

Etter gjennomgang av dashbordet har jeg identifisert flere steder hvor den gamle modellen (flat, ustrukturert) brukes i stedet for den nye PECB-aligned modellen:

### 1. SLAWidget bruker hardkodet data (ikke koblet til PECB)
`SLAWidget.tsx` har de riktige tre SLA-kategoriene (Systemer og prosesser, Organisasjon og styring, Roller og tilgang), men bruker **hardkodede tall** i stedet for data fra `useComplianceRequirements` og `certificationPhases.ts`.

### 2. StatusOverviewWidget har duplikat domene-data
`StatusOverviewWidget.tsx` viser de tre domenene (Personvern, Informasjonssikkerhet, AI Governance) med egne hardkodede scores og SLA-tall. Disse bor na i ISO Readiness-modellen og tallene her er ikke synkronisert.

### 3. DomainComplianceWidget vises to ganger
I desktop-layouten rendres `DomainComplianceWidget` **to ganger**: en gang som rolle-spesifikk widget (linje 286) og en gang nederst (linje 335). Den bor bare vises en gang.

### 4. MaturityProgressCard bruker gammel modenhetsmodell
`MaturityProgressCard.tsx` bruker `useMaturityScore` med fire nivaaer (beginner, developing, established, mature). Den nye PECB-modellen har fem niv: Initial, Definert, Implementert, Malt, Optimalisert. Disse bor samkjores.

### 5. ComplianceCard bruker gammel statisk data
`ComplianceCard.tsx` har hardkodede samsvarskrav i stedet for a bruke den nye strukturerte dataen fra `complianceRequirementsData.ts`.

---

## Endringer

### A. Koble SLAWidget til reelle data

Oppdater `SLAWidget.tsx` til a bruke `SLACategoryBreakdown`-logikken fra ISO Readiness for a hente faktiske tall fra compliance-kravene, gruppert etter SLA-kategori.

### B. Oppdater StatusOverviewWidget med PECB-terminologi

Legg til modenhetsniva (fra `getMaturityLevel`) og ISO-standardreferanser (fra `DOMAIN_STANDARDS`) pa hvert domenekort. Lenke "Se alle oppgaver" til ISO Readiness-visningen (`/tasks?view=readiness&domain=...`).

### C. Fjern duplikat DomainComplianceWidget

Fjern den andre `DomainComplianceWidget` nederst pa dashboard (linje 333-336 i desktop, linje 199-202 i mobil).

### D. Legg til CertificationJourney pa dashbordet

Legg til en kompakt versjon av `CertificationJourney`-stepperen pa dashbordet, rett etter OnboardingProgress, slik at brukeren alltid ser hvor de er i sertifiseringsreisen.

### E. Oppdater lenker til ISO Readiness

Alle "Se oppgaver"-knapper i StatusOverviewWidget og DomainComplianceWidget bor na lenke til `/tasks?view=readiness&domain=X` i stedet for bare `/tasks?domain=X`.

---

## Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/widgets/SLAWidget.tsx` | Koble til compliance-data i stedet for hardkodede tall |
| `src/components/widgets/StatusOverviewWidget.tsx` | Legge til PECB-modenhetsniva og ISO-referanser |
| `src/pages/Index.tsx` | Fjerne duplikat DomainComplianceWidget, legge til CertificationJourney |
| `src/pages/Tasks.tsx` | Stotte `view=readiness` URL-parameter for direkte navigasjon |

---

## Tekniske detaljer

### SLAWidget - ny dataflyt

```typescript
// Erstatt hardkodet slaData med beregning fra compliance-krav
const { requirements } = useComplianceRequirements({});
const slaData = useMemo(() => {
  const byCat = { systems_processes: [], organization_governance: [], roles_access: [] };
  requirements.forEach(r => {
    const cat = r.sla_category || 'organization_governance';
    byCat[cat]?.push(r);
  });
  return Object.entries(byCat).map(([key, reqs]) => ({
    title: t(`isoReadiness.slaCategories.${key}`),
    percentage: Math.round(reqs.filter(r => r.status === 'completed').length / reqs.length * 100),
    current: reqs.filter(r => r.status === 'completed').length,
    total: reqs.length,
    trend: 0 // Beregnes fra historikk senere
  }));
}, [requirements]);
```

### StatusOverviewWidget - PECB-tillegg

Legger til under hvert domenekort:
- ISO-standardreferanse (f.eks. "ISO 27701 + GDPR")
- Modenhetsniva-badge (f.eks. "Implementert")

### Index.tsx - CertificationJourney

```tsx
{/* Etter OnboardingProgressWidget */}
<OnboardingProgressWidget />
<Card className="p-4 mb-8">
  <CertificationJourney completedPercent={overallPercent} />
</Card>
```
