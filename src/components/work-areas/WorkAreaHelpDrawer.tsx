import { Layers, Server, ClipboardList, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHelpDrawer } from "@/components/shared/PageHelpDrawer";

interface WorkAreaHelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkAreaHelpDrawer({ open, onOpenChange }: WorkAreaHelpDrawerProps) {
  const { i18n } = useTranslation();
  const isNb = !i18n.language?.startsWith("en");

  return (
    <PageHelpDrawer
      open={open}
      onOpenChange={onOpenChange}
      icon={Layers}
      title={isNb ? "Hva er et arbeidsområde?" : "What is a work area?"}
      description={
        isNb
          ? "Et arbeidsområde representerer en avdeling, funksjon eller ansvarsområde i organisasjonen din — for eksempel «HR», «IT-drift» eller «Kundeservice». Hvert arbeidsområde samler systemene, prosessene og leverandørene som hører til, slik at du får oversikt over risiko og etterlevelse på ett sted."
          : "A work area represents a department, function or responsibility area in your organization — for example 'HR', 'IT Operations' or 'Customer Service'. Each work area collects its systems, processes and vendors so you get an overview of risk and compliance in one place."
      }
      itemsHeading={isNb ? "Hvert arbeidsområde inneholder" : "Each work area contains"}
      items={[
        {
          icon: Server,
          title: isNb ? "Systemer" : "Systems",
          description: isNb
            ? "Verktøy og applikasjoner som brukes i arbeidsområdet, med oversikt over AI-bruk og risiko."
            : "Tools and applications used in the work area, with overview of AI usage and risk.",
        },
        {
          icon: ClipboardList,
          title: isNb ? "Behandlingsaktiviteter" : "Processing activities",
          description: isNb
            ? "Dokumentasjon av hvordan persondata behandles, med formål, rettslig grunnlag og risikovurdering."
            : "Documentation of how personal data is processed, with purpose, legal basis and risk assessment.",
        },
        {
          icon: Handshake,
          title: isNb ? "Leverandører" : "Vendors",
          description: isNb
            ? "Tredjeparter og databehandlere knyttet til arbeidsområdet, med avtaler og compliance-status."
            : "Third parties and data processors linked to the work area, with agreements and compliance status.",
        },
      ]}
      whyTitle={isNb ? "Hvorfor er dette viktig?" : "Why does this matter?"}
      whyDescription={
        isNb
          ? "Ved å organisere systemene og prosessene dine i arbeidsområder, kan du enklere identifisere risikoer, sikre etterlevelse av regelverk som GDPR og AI Act, og fordele ansvar til riktige personer i organisasjonen."
          : "By organizing your systems and processes into work areas, you can more easily identify risks, ensure compliance with regulations like GDPR and AI Act, and assign responsibility to the right people in the organization."
      }
      stepsHeading={isNb ? "Kom i gang" : "Get started"}
      steps={[
        { text: isNb ? "Opprett et arbeidsområde (f.eks. «HR» eller «IT»)" : "Create a work area (e.g. 'HR' or 'IT')" },
        { text: isNb ? "Legg til systemer og verktøy som brukes" : "Add systems and tools that are used" },
        { text: isNb ? "Dokumenter behandlingsaktiviteter og leverandører" : "Document processing activities and vendors" },
        { text: isNb ? "Tildel ansvarlig person for arbeidsområdet" : "Assign a responsible person for the work area" },
      ]}
      laraSuggestion={isNb ? "Hjelp meg å sette opp arbeidsområder for organisasjonen min" : "Help me set up work areas for my organization"}
    />
  );
}
