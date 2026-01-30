
# Plan: Translate Add Asset Dialog to English

## Overview
Translate all Norwegian text to English in the "Add Asset" (Legg til eiendel) process, including the main dialog and all integration-related components.

## Files to Modify

| File | Description |
|------|-------------|
| `src/components/dialogs/AddAssetDialog.tsx` | Main dialog with 100+ Norwegian text strings |
| `src/components/integration/CustomerTypeStep.tsx` | 7 Security customer type selection step |
| `src/components/integration/CustomerIdStep.tsx` | Customer ID verification step |
| `src/components/integration/RequestAccessStep.tsx` | New customer access request step |
| `src/components/integration/PerformerSelectStep.tsx` | Integration performer selection |
| `src/components/integration/InvitePerformerForm.tsx` | Invite external performer form |
| `src/components/integration/IntegrationPendingStatus.tsx` | Pending invitation status display |

## Key Translations

### AddAssetDialog.tsx - Main Dialog

**Asset Type Labels (INTEGRATION_ASSET_TYPES):**
| Norwegian | English |
|-----------|---------|
| Systemer | Systems |
| Lokasjoner | Locations |
| Nettverk | Networks |
| Digitale enheter | Digital devices |
| Leverandører | Vendors |
| Integrasjoner | Integrations |

**Step Titles (getTitle function):**
| Norwegian | English |
|-----------|---------|
| Legg til eiendel | Add Asset |
| Velg type eiendel | Select Asset Type |
| Velg eiendelstyper | Select Asset Types |
| Hvem utfører integrasjonen? | Who performs the integration? |
| Send invitasjon | Send Invitation |
| Venter på ekstern part | Waiting for external party |
| Koble til | Connect |
| Henter data | Fetching data |
| Forhåndsvis import | Preview Import |
| Importerer | Importing |
| Fullført | Complete |

**UI Labels & Messages:**
| Norwegian | English |
|-----------|---------|
| Hvordan vil du legge til eiendeler? | How would you like to add assets? |
| Automatisk import | Automatic import |
| Koble til Acronis, Azure AD... | Connect to Acronis, Azure AD... |
| Anbefalt | Recommended |
| Synkronisering | Synchronization |
| Manuelt / AI-forslag | Manual / AI suggestions |
| Last opp fra fil | Upload from file |
| Usikker på hva du skal legge til? | Not sure what to add? |
| Kontakt din IT-leverandør... | Contact your IT provider... |
| Hvilken type eiendel vil du legge til? | What type of asset do you want to add? |
| AI-forslag | AI Suggestions |
| Få forslag basert på bransje... | Get suggestions based on industry... |
| Fyll ut manuelt | Fill in manually |
| Legg til én... | Add one... |
| Analyserer din bedriftsprofil... | Analyzing your company profile... |
| Ingen nye forslag tilgjengelig | No new suggestions available |
| Legg til manuelt | Add manually |
| forslag funnet | suggestions found |
| Fjern alle | Remove all |
| Velg alle | Select all |
| Bransjerelevant | Industry relevant |
| Høy risiko | High risk |
| Medium risiko | Medium risk |
| Lav risiko | Low risk |
| Dra og slipp Excel-fil her | Drag and drop Excel file here |
| eller klikk for å velge fil | or click to select file |
| Forventet format | Expected format |
| Kolonner: Navn, Leverandør... | Columns: Name, Vendor... |
| Last ned mal | Download template |
| Velg en datakilde... | Select a data source... |
| Kommer snart | Coming soon |
| Trenger du en integrasjon... | Need an integration... |
| Kontakt oss | Contact us |
| Velg hva du vil importere | Select what to import |
| Hvilke eiendelstyper vil du hente? | Which asset types do you want to fetch? |
| Alle typer | All types |
| Importer alle tilgjengelige... | Import all available... |
| eller velg spesifikke | or select specific |
| Valgfri | Optional |
| Koble til [name] | Connect to [name] |
| Skriv inn API-nøkkel... | Enter API key... |
| API-nøkkel | API key |
| Lim inn API-nøkkel her... | Paste API key here... |
| Hvor finner jeg API-nøkkelen? | Where do I find the API key? |
| Logg inn på... | Log in to... |
| Gå til Innstillinger... | Go to Settings... |
| Klikk "Generer ny nøkkel" | Click "Generate new key" |
| Kopier nøkkelen... | Copy the key... |
| API-nøkkelen lagres sikkert... | The API key is stored securely... |
| Kobler til... | Connecting to... |
| Henter tilgjengelige eiendeler | Fetching available assets |
| Tilkobling verifisert | Connection verified |
| Henter enhetsliste... | Fetching device list... |
| Analyserer enheter | Analyzing devices |
| eiendeler funnet | assets found |
| Alle | All |
| Systemer | Systems |
| Lokasjoner | Locations |
| Nettverk | Networks |
| Maskinvare | Hardware |
| Leverandører | Vendors |
| av ... valgt | of ... selected |
| Velg alle | Select all |
| Fjern alle | Remove all |
| Lokasjon | Location |
| System | System |
| Nettverk | Network |
| Maskinvare | Hardware |
| Leverandør | Vendor |
| Aktiver automatisk synkronisering | Enable automatic synchronization |
| Daglig | Daily |
| Ukentlig | Weekly |
| Månedlig | Monthly |
| Importerer og klargjør... | Importing and preparing... |
| Lara analyserer hver eiendel... | Lara analyzes each asset... |
| Fremgang | Progress |
| Lara jobber... | Lara is working... |
| Import fullført! | Import complete! |
| eiendeler importert og klargjort | assets imported and prepared |
| Lara sier: | Lara says: |
| Jeg har importert... | I have imported... |
| Eiendelene ligger nå øverst... | The assets are now at the top... |
| For hver eiendel har jeg: | For each asset, I have: |
| Kartlagt relevante regelverk... | Mapped relevant regulations... |
| Identifisert dokumentasjonskrav | Identified documentation requirements |
| Satt risikonivå basert på... | Set risk level based on... |
| Neste steg: Tilordne... | Next step: Assign... |
| Synkronisering aktivert | Synchronization enabled |
| daglig / ukentlig / månedlig | daily / weekly / monthly |
| Se importerte eiendeler | View imported assets |
| Vennligst vent... | Please wait... |
| Avbryt | Cancel |
| Legger til... | Adding... |
| Legg til | Add |
| Lagrer... | Saving... |
| Neste | Next |
| Hent eiendeler | Fetch assets |
| Importer valgte | Import selected |
| Venter på aktivering | Waiting for activation |
| Du vil motta e-post... | You will receive an email... |
| Lukk og vent | Close and wait |

**Toast Messages:**
| Norwegian | English |
|-----------|---------|
| X eiendeler lagt til | X assets added |
| Kunne ikke opprette eiendeler | Could not create assets |
| X nye eiendeler importert... | X new assets imported... |
| Påminnelse sendt! | Reminder sent! |

**AI Import Messages:**
| Norwegian | English |
|-----------|---------|
| Kartlegger compliance-krav... | Mapping compliance requirements... |
| Identifisert: ISO 27001, GDPR... | Identified: ISO 27001, GDPR... |
| Analyserer ERP-system... | Analyzing ERP system... |
| Flagget som kritisk... | Flagged as critical... |
| Klassifiserer fysisk lokasjon... | Classifying physical location... |
| NS-EN 50600 sertifisert... | NS-EN 50600 certified... |
| Verifiserer sky-nettverk... | Verifying cloud network... |
| Identifisert som sikkerhetsinfrastruktur... | Identified as security infrastructure... |
| Advarsel: Krever oppfølging... | Warning: Requires follow-up... |
| Leverandørvurdering:... | Vendor assessment:... |
| Importerer... | Importing... |
| Importert: | Imported: |
| Kartlegger compliance-krav... | Mapping compliance requirements... |

**Integration Descriptions:**
| Norwegian | English |
|-----------|---------|
| Importer enheter fra Acronis... | Import devices from Acronis... |
| Hent applikasjoner og enheter... | Fetch applications and devices... |
| Importer fra SharePoint-lister... | Import from SharePoint lists... |
| Importer administrerte enheter... | Import managed devices... |
| Synkroniser fra ServiceNow CMDB | Sync from ServiceNow CMDB |
| Importer eiendeler fra Qualys... | Import assets from Qualys... |
| Hent endepunkter fra... | Fetch endpoints from... |

### CustomerTypeStep.tsx
| Norwegian | English |
|-----------|---------|
| Mynder henter data fra... | Mynder fetches data from... |
| Du trenger bare å oppgi din kunde-ID... | You only need to provide your customer ID... |
| Er du allerede kunde hos...? | Are you already a customer of...? |
| Ja, jeg har kunde-ID | Yes, I have a customer ID |
| Jeg er allerede kunde hos... | I am already a customer of... |
| Nei, dette er nytt for meg | No, this is new to me |
| Jeg ønsker å få tilgang via Mynder-avtalen | I want to get access via the Mynder agreement |
| Ingen ekstra kostnad | No additional cost |
| Utforsk med demo-data | Explore with demo data |
| Se hvordan integrasjonen fungerer... | See how the integration works... |

### CustomerIdStep.tsx
| Norwegian | English |
|-----------|---------|
| Koble til... | Connect to... |
| Oppgi din kunde-ID hos... | Enter your customer ID for... |
| Kunde-ID | Customer ID |
| F.eks. 7SEC-KUNDE-12345 | E.g. 7SEC-CUSTOMER-12345 |
| Verifisert | Verified |
| Verifiser | Verify |
| Kunde verifisert | Customer verified |
| Kunde-ID ikke funnet | Customer ID not found |
| Be om tilgang i stedet → | Request access instead → |
| Hvor finner jeg kunde-ID? | Where do I find my customer ID? |
| Sjekk e-post fra... | Check email from... |
| Se i fakturaer eller kontrakter | Check invoices or contracts |
| Kontakt... på... | Contact... at... |
| For testing: bruk... | For testing: use... |

### RequestAccessStep.tsx
| Norwegian | English |
|-----------|---------|
| Be om tilgang | Request access |
| Via Mynder-avtalen med... | Via the Mynder agreement with... |
| Som Mynder-kunde får du tilgang... | As a Mynder customer you get access... |
| Organisasjonsnummer | Organization number |
| Kontaktperson | Contact person |
| E-post | Email |
| Be om tilgang | Request access |
| Sender forespørsel... | Sending request... |
| Har du allerede kunde-ID? Klikk her | Already have a customer ID? Click here |
| Vanligvis aktivert innen 24 timer | Usually activated within 24 hours |
| Forespørsel sendt! | Request sent! |
| Referanse: | Reference: |
| Hva skjer nå? | What happens next? |
| ... behandler forespørselen | ... processes the request |
| Du mottar kunde-ID på e-post | You receive customer ID by email |
| Kom tilbake hit og aktiver... | Come back here and activate... |

### PerformerSelectStep.tsx
| Norwegian | English |
|-----------|---------|
| For å koble til... trenger vi å vite... | To connect to... we need to know... |
| Jeg gjør det selv | I'll do it myself |
| Jeg har admin-tilgang... | I have admin access... |
| IT-leverandør / MSP | IT provider / MSP |
| Send invitasjon til din IT-partner | Send invitation to your IT partner |
| Vanligst | Most common |
| Regnskapsfører | Accountant |
| For regnskapssystemer... | For accounting systems... |
| Intern IT-ansvarlig | Internal IT manager |
| Kollega med teknisk tilgang | Colleague with technical access |
| Hvorfor spør vi? | Why do we ask? |
| For revisjon og dokumentasjon... | For audit and documentation... |

### InvitePerformerForm.tsx
| Norwegian | English |
|-----------|---------|
| Eier | Owner |
| IT-leverandør | IT provider |
| Regnskapsfører | Accountant |
| Intern IT-ansvarlig | Internal IT manager |
| Inviter... | Invite... |
| Send invitasjon for å sette opp... | Send invitation to set up... |
| Firmanavn | Company name |
| F.eks. Regnskap AS | E.g. Accounting Ltd |
| F.eks. IT-Partner AS | E.g. IT Partner Ltd |
| E-postadresse * | Email address * |
| Kontaktperson (navn) * | Contact person (name) * |
| Ola Nordmann | John Doe |
| Hva skjer videre? | What happens next? |
| Vi sender en e-post med invitasjonslenke | We send an email with invitation link |
| ... logger inn og legger til API-nøkkel | ... logs in and adds API key |
| Du får varsel når integrasjonen er klar | You get notified when integration is ready |
| Alt dokumenteres for revisjon | Everything is documented for audit |
| Forhåndsvisning av e-post | Email preview |
| Kopier | Copy |
| Kopiert | Copied |
| Hei [Navn], Vi bruker Mynder... | Hi [Name], We use Mynder... |
| Avbryt | Cancel |
| Send invitasjon | Send invitation |
| Vennligst fyll ut e-post og navn | Please fill in email and name |
| Tekst kopiert til utklippstavlen | Text copied to clipboard |
| Kunne ikke kopiere tekst | Could not copy text |

### IntegrationPendingStatus.tsx
| Norwegian | English |
|-----------|---------|
| Venter på... | Waiting for... |
| Invitasjon sendt til... | Invitation sent to... |
| Status: Invitasjon sendt | Status: Invitation sent |
| Sendt til: | Sent to: |
| Kontaktperson: | Contact person: |
| Organisasjon: | Organization: |
| Rolle: | Role: |
| Dato: | Date: |
| Send påminnelse | Send reminder |
| Sendt! | Sent! |
| Kanseller | Cancel |
| Har du fått API-nøkkelen allerede? | Have you received the API key already? |
| Legg inn API-nøkkel selv → | Enter API key yourself → |

Also update date locale from `nb-NO` to `en-US` in IntegrationPendingStatus.tsx.

## Implementation Approach

1. Update all hardcoded Norwegian strings to English
2. Change date formatting locales from `nb-NO` to `en-US`
3. Keep placeholder examples in English format (e.g., "John Doe" instead of "Ola Nordmann")
4. Maintain consistent terminology throughout all files
