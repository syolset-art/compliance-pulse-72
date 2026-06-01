## Mål

Tre justeringer av Trust Profile-aktiveringsdemoen (`?demo=activation`):

1. Demoen skal legge til **Microsoft Azure** som kritisk leverandør (ikke Microsoft 365).
2. Demoen skal lande på **/trust-center/profile** med den ferdig aktiverte profilen synlig — ikke gå tilbake til steg 1.
3. Kontaktinformasjons-seksjonen skal vises **forhåndsutfylt** i den aktiverte profilen, slik at det ser ut som Lara har kartlagt informasjonen automatisk.

---

## Endringer

### 1. Microsoft Azure i steg 5

`src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` (auto-play vendor-effekt, ~linje 561–592):

- Bytt `name: "Microsoft 365"` → `name: "Microsoft Azure"`.
- Oppdater `purpose` til noe som passer Azure, f.eks. `"Skyinfrastruktur og dataplattform"`.
- Behold resten av feltene (`processesPersonalData: "yes"`, `dataCategories: ["Ansattdata", "Kundedata"]`, `dpa: "yes"`).

### 2. Landing på /trust-center/profile etter fullføring

I dag kjører auto-play `handlePublish()` på steg 7, men hvis brukeren ser steg 1 etter "fullføring" betyr det at `isActivated`-flagget ikke holder seg. Stabiliser:

`src/pages/TrustCenterProfile.tsx` `onCompleted`-callback (begge forekomster, ~linje 363 og ~998):

- Sett `localStorage.setItem("mynder.trustprofile.activated", "1")` før `setIsActivated(true)` slik at gaten i linje 303 (`if (isOwnProfile && !isActivated)`) ikke kan vise wizard-landingen igjen.
- Sett `setShowActivateWizard(false)` for sikkerhets skyld.
- Behold `window.history.replaceState` til `/trust-center/profile` og `scrollTo(top)`.
- La `autoPlayDemo` forbli `true` (sidebar skjult) frem til neste navigering — uendret.

### 3. Forhåndsutfylte kontakter

`src/lib/demoSeedTrustProfile.ts` — `seedFromActivation`:

- I `selfAsset.metadata`, legg til en `contacts`-blokk som avledes fra `values.url`/domene og `values.contactEmail`, f.eks.:

  ```ts
  contacts: {
    general: values.contactEmail || `kontakt@${domain}`,
    privacy: values.dpoEmail || `personvern@${domain}`,
    security: values.securityEmail || `sikkerhet@${domain}`,
    incident_email: `hendelse@${domain}`,
    incident_phone: "+47 23 00 00 00",
    postal_address: `${values.name}\n${values.region || values.country || "Norge"}`,
  },
  ```

- Sett også `confirmed_fields: ["contacts.general", "contacts.privacy", "contacts.security"]` i metadata, slik at feltene fremstår som verifisert/utfylt av Lara når brukeren lander på profilen.

Dette gjør at `ContactsSection` (som leser `metadata.contacts`) viser ferdig utfylte e-postadresser og postadresse umiddelbart etter at demoen fullføres.

---

## Filer som endres

- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — bytt vendor-navn og formål i auto-play effekten.
- `src/pages/TrustCenterProfile.tsx` — persistér activated-flagg og lukk wizard i `onCompleted`.
- `src/lib/demoSeedTrustProfile.ts` — seed `metadata.contacts` og `confirmed_fields` i `seedFromActivation`.

Ingen endringer i selve `ContactsSection`, routing eller backend-skjema.
