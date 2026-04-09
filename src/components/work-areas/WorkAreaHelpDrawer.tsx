import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Server, ClipboardList, Handshake, Layers, ArrowRight, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface WorkAreaHelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkAreaHelpDrawer({ open, onOpenChange }: WorkAreaHelpDrawerProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = !i18n.language?.startsWith("en");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <SheetTitle className="text-lg">
            {isNb ? "Hva er et arbeidsområde?" : "What is a work area?"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Main explanation */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isNb
              ? "Et arbeidsområde representerer en avdeling, funksjon eller ansvarsområde i organisasjonen din — for eksempel «HR», «IT-drift» eller «Kundeservice». Hvert arbeidsområde samler systemene, prosessene og leverandørene som hører til, slik at du får oversikt over risiko og etterlevelse på ett sted."
              : "A work area represents a department, function or responsibility area in your organization — for example 'HR', 'IT Operations' or 'Customer Service'. Each work area collects its systems, processes and vendors so you get an overview of risk and compliance in one place."}
          </p>

          {/* What it contains */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Hvert arbeidsområde inneholder" : "Each work area contains"}
            </h3>
            <div className="space-y-2">
              <HelpItem
                icon={Server}
                title={isNb ? "Systemer" : "Systems"}
                description={isNb ? "Verktøy og applikasjoner som brukes i arbeidsområdet, med oversikt over AI-bruk og risiko." : "Tools and applications used in the work area, with overview of AI usage and risk."}
              />
              <HelpItem
                icon={ClipboardList}
                title={isNb ? "Behandlingsaktiviteter" : "Processing activities"}
                description={isNb ? "Dokumentasjon av hvordan persondata behandles, med formål, rettslig grunnlag og risikovurdering." : "Documentation of how personal data is processed, with purpose, legal basis and risk assessment."}
              />
              <HelpItem
                icon={Handshake}
                title={isNb ? "Leverandører" : "Vendors"}
                description={isNb ? "Tredjeparter og databehandlere knyttet til arbeidsområdet, med avtaler og compliance-status." : "Third parties and data processors linked to the work area, with agreements and compliance status."}
              />
            </div>
          </div>

          {/* Why it matters */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Hvorfor er dette viktig?" : "Why does this matter?"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNb
                ? "Ved å organisere systemene og prosessene dine i arbeidsområder, kan du enklere identifisere risikoer, sikre etterlevelse av regelverk som GDPR og AI Act, og fordele ansvar til riktige personer i organisasjonen."
                : "By organizing your systems and processes into work areas, you can more easily identify risks, ensure compliance with regulations like GDPR and AI Act, and assign responsibility to the right people in the organization."}
            </p>
          </div>

          {/* Getting started steps */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Kom i gang" : "Get started"}
            </h3>
            <div className="space-y-2">
              <StepItem
                number={1}
                text={isNb ? "Opprett et arbeidsområde (f.eks. «HR» eller «IT»)" : "Create a work area (e.g. 'HR' or 'IT')"}
              />
              <StepItem
                number={2}
                text={isNb ? "Legg til systemer og verktøy som brukes" : "Add systems and tools that are used"}
              />
              <StepItem
                number={3}
                text={isNb ? "Dokumenter behandlingsaktiviteter og leverandører" : "Document processing activities and vendors"}
              />
              <StepItem
                number={4}
                text={isNb ? "Tildel ansvarlig person for arbeidsområdet" : "Assign a responsible person for the work area"}
              />
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate("/resources");
            }}
          >
            {isNb ? "Utforsk ressurssenteret" : "Explore the resource center"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HelpItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Server;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
        {number}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
