## Plan: Utvid kontaktblokk i CustomerStatusBanner med e-post og rolle

Utvider «Kontakt:»-linjen i `src/components/msp/CustomerStatusBanner.tsx` til å vise tre felt (navn, e-post, rolle) med inline-redigering og en «send melding»-handling på e-post.

### Endringer i `src/components/msp/CustomerStatusBanner.tsx`

**1. Ny inline-redigerbar kontaktblokk (erstatter linje ~278–295)**
- Viser tre chips på én linje: navn · e-post · rolle
- Hvert felt har blyant-ikon ved hover for å redigere
- Tomme felt vises som subtile «+ Legg til e-post» / «+ Legg til rolle» knapper (border-dashed, warning-farget hint)
- E-post-chip er klikkbar → åpner liten popover med:
  - «Send e-post» (mailto: med forhåndsutfylt emne «Vedrørende Trust Profile – {kundenavn}»)
  - «Kopier adresse»

**2. Redigeringsmodus per felt**
- Klikk på blyant → felt blir til `<Input>` med Lagre/Avbryt
- Ved lagring: `supabase.from("msp_customers").update({ ... }).eq("id", customer.id)`
- Validering: e-post må matche regex, ellers inline feilmelding
- Suksess: `toast.success` + kall `onUpdate?.()` for å refreshe parent

**3. Ny prop**
```ts
onUpdate?: () => void;
```
Kalles etter vellykket lagring så MSPCustomerView kan invalidere query.

**4. Databasekolonner**
Bruker eksisterende `contact_person`, `contact_email`, `contact_company_role` i `msp_customers` — ingen migrasjon.

### Design
- Følger samme mønster som `ContactPersonField.tsx` (stiplet border ved manglende felt, warning-farge, kompakt inline UI)
- Ingen store dialoger — alt inline i banneret for å holde det stramt
- E-post rendres som `text-primary hover:underline` for tydelig klikkbarhet

### Ikke inkludert
- Ingen ny edge-funksjon for e-post — bruker `mailto:` (kan senere byttes til transaksjonell e-post uten UI-endring)
- Ansvarlig-linje, badges og status-stripe beholdes uendret
