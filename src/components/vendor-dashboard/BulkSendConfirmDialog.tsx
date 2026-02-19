import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  Building2,
  Calendar,
  Sparkles,
  Mail,
  Clock,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const REQUEST_TYPE_LABELS: Record<string, { nb: string; en: string }> = {
  dpa: { nb: "DPA / Databehandleravtale", en: "DPA / Data Processing Agreement" },
  vendor_assessment: { nb: "Leverandørvurdering", en: "Vendor Assessment" },
  iso_documentation: { nb: "ISO 27001 dokumentasjon", en: "ISO 27001 Documentation" },
  soc2: { nb: "SOC 2-rapport", en: "SOC 2 Report" },
  gdpr_report: { nb: "GDPR-rapport", en: "GDPR Report" },
  hms_documentation: { nb: "HMS-dokumentasjon", en: "HSE Documentation" },
  quality_certification: { nb: "Kvalitetssertifisering", en: "Quality Certification" },
  audit_report: { nb: "Internrevisjonsrapport", en: "Internal Audit Report" },
};

interface BulkSendConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorNames: { id: string; name: string }[];
  requestType: string;
  onConfirm: (dueDate: string) => void;
}

export function BulkSendConfirmDialog({
  open,
  onOpenChange,
  vendorNames,
  requestType,
  onConfirm,
}: BulkSendConfirmDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const typeLabel = REQUEST_TYPE_LABELS[requestType]
    ? isNb
      ? REQUEST_TYPE_LABELS[requestType].nb
      : REQUEST_TYPE_LABELS[requestType].en
    : requestType;

  const handleSend = () => {
    onConfirm(dueDate);
    toast.success(
      isNb
        ? `Forespørsel sendt til ${vendorNames.length} leverandør(er)`
        : `Request sent to ${vendorNames.length} vendor(s)`,
      {
        icon: "🦋",
        description: isNb
          ? "Lara følger opp automatisk og purrer leverandører som ikke svarer innen fristen."
          : "Lara will automatically follow up and remind vendors who don't respond before the deadline.",
        duration: 6000,
      }
    );
    onOpenChange(false);
  };

  const PROCESS_STEPS = isNb
    ? [
        {
          icon: Mail,
          title: "E-post sendes",
          desc: "Leverandørene mottar en e-post med forespørselen og en lenke for å svare.",
        },
        {
          icon: Clock,
          title: "Frist settes",
          desc: `Leverandørene får frist til ${new Date(dueDate).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })} for å svare.`,
        },
        {
          icon: Bell,
          title: "Automatisk purring",
          desc: "Lara sender automatisk påminnelse 7 dager før frist, og purrer igjen hvis fristen passeres.",
        },
        {
          icon: CheckCircle2,
          title: "Svar i innboksen",
          desc: "Når leverandøren svarer, dukker dokumentasjonen opp i Lara-innboksen for gjennomgang.",
        },
      ]
    : [
        {
          icon: Mail,
          title: "Email sent",
          desc: "Vendors receive an email with the request and a link to respond.",
        },
        {
          icon: Clock,
          title: "Deadline set",
          desc: `Vendors have until ${new Date(dueDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} to respond.`,
        },
        {
          icon: Bell,
          title: "Automatic reminders",
          desc: "Lara sends a reminder 7 days before deadline, and follows up again if it passes.",
        },
        {
          icon: CheckCircle2,
          title: "Response in inbox",
          desc: "When the vendor responds, documentation appears in Lara's inbox for review.",
        },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {isNb ? "Send forespørsel" : "Send Request"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Send forespørsel om ${typeLabel.toLowerCase()} til ${vendorNames.length} leverandør${vendorNames.length > 1 ? "er" : ""}.`
              : `Send a request for ${typeLabel} to ${vendorNames.length} vendor${vendorNames.length > 1 ? "s" : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Request type */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Forespørselstype" : "Request type"}
            </Label>
            <p className="text-sm font-medium mt-1">{typeLabel}</p>
          </div>

          {/* Vendors */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Mottakere" : "Recipients"} ({vendorNames.length})
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {vendorNames.slice(0, 8).map((v) => (
                <Badge
                  key={v.id}
                  variant="outline"
                  className="gap-1.5 text-xs py-1 px-2"
                >
                  <Building2 className="h-3 w-3 text-primary" />
                  {v.name}
                </Badge>
              ))}
              {vendorNames.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{vendorNames.length - 8} {isNb ? "flere" : "more"}
                </Badge>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {isNb ? "Frist for svar" : "Response deadline"}
            </Label>
            <Input
              type="date"
              value={dueDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Process explanation */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Hva skjer videre?" : "What happens next?"}
            </Label>
            <div className="space-y-0">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-border" />
                    )}
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 z-10">
                      <Icon className="h-3 w-3 text-primary" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium leading-tight">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={handleSend} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isNb
              ? `Send via Lara (${vendorNames.length})`
              : `Send via Lara (${vendorNames.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
