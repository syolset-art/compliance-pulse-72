## Mål
Feltene "Nettsted" og "Beskrivelse" (og kontaktrolle) på kundekortet skal i prototypen normalt være utfylt – slik det ville vært etter at Lara kartla kunden ved onboarding – i stedet for tomme "Legg til …"-knapper.

## Hva som gjøres

**1. Utvid demo-kundedata (`src/lib/demoSeedMSP.ts`)**
Legg til for hver av de 9 demokundene:
- `url` – realistisk nettsted (f.eks. `https://www.bergenenergi.no`)
- `business_description` – 1–2 setninger om hva virksomheten driver med, tilpasset bransje
- `contact_company_role` – rolle fra `COMPANY_ROLES` (Daglig leder, IT-ansvarlig, CFO m.m.)
- `privacy_policy_url` der det er naturlig

**2. Backfill for allerede seedede kunder**
Seed-funksjonen hopper over kunder som finnes fra før. Legger inn et lett oppdateringssteg: for eksisterende demokunder som mangler `url` eller `business_description`, oppdateres radene med verdiene over (matchet på `customer_name`). Slik ser man effekten uten å nullstille demodata.

**3. Tydelig onboarding-proveniens i kortet (`CustomerStatusBanner.tsx`)**
- Beholder eksisterende Sparkles-tooltip på beskrivelsen, og legger samme markør på nettsted-feltet: "Hentet automatisk ved oppretting av kunden – kan redigeres."
- Tomme felter beholder "Legg til …"-knappen som fallback (20 %-tilfellet der Lara ikke fant noe).

## Teknisk
Kun demo-/seed-data og presentasjon endres. Ingen skjemaendringer – kolonnene `url`, `business_description`, `contact_company_role` finnes allerede i `msp_customers`.
