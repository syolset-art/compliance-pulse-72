import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ChevronDown,
  Upload,
  FileSearch,
  ClipboardCheck,
  Sparkles,
  FileText,
  MessageSquare,
  CalendarClock,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { logPartnerActivity } from "@/lib/partnerActivityLog";
import { PartnerEvidenceUploadDialog } from "./PartnerEvidenceUploadDialog";

interface Props {
  customerId: string;
  customerName: string;
  onSwitchTab: (tab: "guidance" | "assessment" | "messages" | "trust-profile" | "regulations") => void;
  recommendedKinds?: Array<
    "evidence" | "request_doc" | "gap" | "assessment" | "lara" | "offer" | "message" | "followup"
  >;
  size?: "sm" | "default";
  variant?: "default" | "outline";
  align?: "start" | "end";
}

type ActionId =
  | "evidence"
  | "request_doc"
  | "gap"
  | "assessment"
  | "lara"
  | "offer"
  | "message"
  | "followup";

export function PartnerActionMenu({
  customerId,
  customerName,
  onSwitchTab,
  recommendedKinds = [],
  size = "sm",
  variant = "default",
  align = "end",
}: Props) {
  const [open, setOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handle = (id: ActionId) => {
    setOpen(false);
    switch (id) {
      case "evidence":
        setEvidenceOpen(true);
        break;
      case "request_doc":
        logPartnerActivity(customerId, "document_requested", "Be om dokument fra kunden");
        toast.success("Forespørsel klar", { description: `Åpner meldinger med ${customerName}.` });
        onSwitchTab("messages");
        break;
      case "gap":
        logPartnerActivity(customerId, "gap_analysis_started", "Gap-analyse startet");
        toast.success("Gap-analyse", { description: "Åpner regelverk for å velge område." });
        onSwitchTab("regulations");
        break;
      case "assessment":
        logPartnerActivity(customerId, "assessment_started", "Sikkerhetsvurdering startet");
        onSwitchTab("assessment");
        break;
      case "lara":
        logPartnerActivity(customerId, "lara_recommendation_requested", "Ba Lara om anbefaling");
        toast.success("Lara analyserer kunden", {
          description: "Forslag legges i Veiledning-fanen.",
        });
        onSwitchTab("guidance");
        break;
      case "offer":
        logPartnerActivity(customerId, "offer_created", "Åpnet Tjenester for å lage tilbud");
        onSwitchTab("assessment");
        break;
      case "message":
        logPartnerActivity(customerId, "message_sent", "Melding klargjort");
        onSwitchTab("messages");
        break;
      case "followup":
        logPartnerActivity(customerId, "followup_scheduled", "Oppfølging planlagt");
        toast.success("Oppfølging planlagt", { description: "Lagt til i aktivitetsloggen." });
        break;
    }
  };

  const isRec = (k: ActionId) => recommendedKinds.includes(k);

  const Item = ({
    id,
    icon: Icon,
    title,
    desc,
  }: {
    id: ActionId;
    icon: typeof Upload;
    title: string;
    desc: string;
  }) => (
    <DropdownMenuItem
      className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer"
      onSelect={(e) => {
        e.preventDefault();
        handle(id);
      }}
    >
      <Icon className="h-4 w-4 mt-0.5 text-foreground/80 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {isRec(id) && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wider">
              Anbefalt
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
      </div>
    </DropdownMenuItem>
  );

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant={variant} className="gap-1.5">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Legg til aktivitet
            <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-[340px] p-1">
          <DropdownMenuLabel className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bevis & dokumentasjon
          </DropdownMenuLabel>
          <Item
            id="evidence"
            icon={Upload}
            title="Last opp partner-bevis"
            desc="Pentest, audit eller DPIA — Lara mapper til regelverk og hever modenhet."
          />
          <Item
            id="request_doc"
            icon={FileQuestion}
            title="Be om dokument fra kunden"
            desc="Send en konkret forespørsel via meldinger."
          />

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Analyse & vurdering
          </DropdownMenuLabel>
          <Item
            id="gap"
            icon={FileSearch}
            title="Kjør gap-analyse mot regelverk"
            desc="Velg regelverk og se hva som mangler for å nå mål-modenhet."
          />
          <Item
            id="assessment"
            icon={ClipboardCheck}
            title="Start sikkerhetsvurdering"
            desc="Lara stiller spørsmål og beregner modenhet på tjenestene."
          />
          <Item
            id="lara"
            icon={Sparkles}
            title="Be Lara om en anbefaling"
            desc="Få konkrete neste-steg basert på kundens situasjon."
          />

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Forretning & kommunikasjon
          </DropdownMenuLabel>
          <Item
            id="offer"
            icon={FileText}
            title="Lag tilbud"
            desc="Oppgradering, nytt regelverk eller tjeneste."
          />
          <Item
            id="message"
            icon={MessageSquare}
            title="Send melding til kunde"
            desc="Åpne en ny meldingstråd."
          />
          <Item
            id="followup"
            icon={CalendarClock}
            title="Planlegg oppfølging"
            desc="Sett en dato — vises i aktivitetsloggen."
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <PartnerEvidenceUploadDialog
        customerId={customerId}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
      />
    </>
  );
}
