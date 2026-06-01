import type { CustomerVisibleService } from "../CustomerCatalogPreview";

export const DEMO_CUSTOMER_NAME = "DIPS Arena AS";
export const DEMO_PARTNER_NAME = "Nordlys Sikkerhet AS";

export const DEMO_CUSTOMER_SERVICES: CustomerVisibleService[] = [
  {
    id: "svc-iso-foundation",
    name: "ISO 27001 grunnpakke",
    description:
      "Vi etablerer og vedlikeholder styringssystemet for informasjonssikkerhet, inkludert risikovurderinger og policyer.",
    activities: [
      { label: "Etablere SoA og kontrolloversikt", hours: 0 },
      { label: "Årlig risikovurdering med ledelsen", hours: 0 },
      { label: "Policy- og prosedyreoppdatering", hours: 0 },
      { label: "Forberede internrevisjon", hours: 0 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkShortName: "ISO 27001", controlId: "A.5.1", controlLabel: "Policies for information security" },
      { frameworkId: "iso27001", frameworkShortName: "ISO 27001", controlId: "A.6.1", controlLabel: "Roles and responsibilities" },
      { frameworkId: "nis2", frameworkShortName: "NIS2", controlId: "Art.21", controlLabel: "Risikohåndtering" },
    ],
    source: "library",
  },
  {
    id: "svc-gdpr-dpo",
    name: "GDPR & personvern (DPO-as-a-Service)",
    description:
      "Vår personvernrådgiver fungerer som ditt DPO og holder behandlingsprotokoll, DPIA og avvikshåndtering oppdatert.",
    activities: [
      { label: "Vedlikehold av behandlingsprotokoll (ROPA)", hours: 0 },
      { label: "DPIA ved nye behandlinger", hours: 0 },
      { label: "Bistand ved innsynsforespørsler", hours: 0 },
      { label: "Avviksvarsling til Datatilsynet", hours: 0 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkShortName: "GDPR", controlId: "Art.30", controlLabel: "Records of processing" },
      { frameworkId: "gdpr", frameworkShortName: "GDPR", controlId: "Art.35", controlLabel: "DPIA" },
    ],
    source: "library",
  },
  {
    id: "svc-incident-247",
    name: "Beredskap & hendelseshåndtering 24/7",
    description:
      "Vakttelefon og responsteam som tar imot, klassifiserer og håndterer sikkerhetshendelser hele døgnet.",
    activities: [
      { label: "24/7 vakttelefon for hendelser", hours: 0 },
      { label: "Klassifisering og eskalering", hours: 0 },
      { label: "Etterarbeid og læringsrapport", hours: 0 },
    ],
    mappings: [
      { frameworkId: "nis2", frameworkShortName: "NIS2", controlId: "Art.23", controlLabel: "Hendelsesrapportering" },
      { frameworkId: "nsm", frameworkShortName: "NSM grunnprinsipper", controlId: "4.1", controlLabel: "Oppdage og håndtere hendelser" },
    ],
    source: "library",
  },
  {
    id: "svc-vendor-mgmt",
    name: "Leverandøroppfølging",
    description:
      "Vi holder oversikt over dine kritiske leverandører, gjennomgår databehandleravtaler og følger opp underleverandører.",
    activities: [
      { label: "Årlig leverandørgjennomgang", hours: 0 },
      { label: "DPA-administrasjon", hours: 0 },
      { label: "Overvåking av underleverandører", hours: 0 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkShortName: "ISO 27001", controlId: "A.5.19", controlLabel: "Supplier relationships" },
      { frameworkId: "gdpr", frameworkShortName: "GDPR", controlId: "Art.28", controlLabel: "Processor agreements" },
    ],
    source: "library",
  },
];
