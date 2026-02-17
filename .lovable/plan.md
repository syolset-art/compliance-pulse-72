

# Synkroniser kundeskjema og lisensinformasjon

## Hva skal endres

To ting:

1. **"Legg til kunde"-dialogen** skal vise informasjon om tilgjengelige lisenser. Hvis partneren har ledige lisenser, vises en linje som "Lisens 3 av 5 vil bli tildelt" (ikke redigerbar). Nar kunden opprettes, tildeles automatisk en ledig lisens.

2. **"Tildel lisens"-dialogen** under Lisenser-fanen skal fa alle de samme feltene som "Legg til kunde" (org.nummer, bransje, antall ansatte, roller, abonnement).

## Detaljert plan

### 1. Utvid AddMSPCustomerDialog

- Legg til en query som henter tilgjengelige lisenser (`msp_licenses` med status `available`) og totalt antall lisenser for partneren.
- Vis en informasjonsboks (ikke redigerbar) som viser f.eks. "Lisens 3 av 5 vil bli tildelt denne kunden" dersom det finnes ledige lisenser.
- Hvis ingen ledige lisenser finnes, vis en advarsel: "Ingen tilgjengelige lisenser. Kunden opprettes uten lisens."
- Nar kunden lagres og det finnes en ledig lisens, oppdater den forste tilgjengelige lisensen med `assigned_customer_id` og status `assigned`.

### 2. Utvid AssignLicenseDialog

Legg til de samme feltene som finnes i AddMSPCustomerDialog:
- Org.nummer
- Bransje (dropdown)
- Antall ansatte (dropdown)
- Rolle i selskapet (dropdown)
- Compliance-rolle (dropdown)
- Abonnement (dropdown)

Alle disse verdiene sendes med i `msp_customers`-inserten nar lisensen tildeles.

### 3. Felles konstanter

Flytt de delte konstantene (INDUSTRIES, EMPLOYEE_RANGES, SUBSCRIPTION_PLANS, COMPANY_ROLES, COMPLIANCE_ROLES) til en felles fil `src/lib/mspCustomerConstants.ts` slik at begge dialogene bruker samme verdier.

## Teknisk oppsummering

### Nye filer
- `src/lib/mspCustomerConstants.ts` - Delte dropdown-verdier

### Endrede filer
- `src/components/msp/AddMSPCustomerDialog.tsx` - Legge til lisensinfo-banner og auto-tildeling av lisens ved opprettelse
- `src/components/msp/AssignLicenseDialog.tsx` - Utvide med alle kundefelt (org.nummer, bransje, ansatte, roller, abonnement)

### Flyt

**Legg til kunde (med lisenser tilgjengelig):**
```text
Partner klikker "Legg til kunde"
  -> Ser info: "Lisens 3 av 5 vil bli tildelt"
  -> Fyller ut alle felter
  -> Klikker "Legg til"
  -> Kunde opprettes + forste ledige lisens tildeles automatisk
```

**Tildel lisens fra Lisenser-fanen:**
```text
Partner klikker "Tildel" pa en ledig lisens
  -> Ser lisensnokkel (som for)
  -> Fyller ut alle kundefelter (navn, org.nr, bransje, ansatte, roller, e-post)
  -> Klikker "Tildel og inviter"
  -> Kunde opprettes med alle felter + lisens tildeles
```

