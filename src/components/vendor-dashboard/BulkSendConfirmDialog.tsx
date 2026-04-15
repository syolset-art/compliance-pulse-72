import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Send,
  Building2,
  Sparkles,
  Mail,
  Bell,
  CheckCircle2,
  Upload,
  Paperclip,
  X,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const TEMPLATES_KEY = "mynder_request_templates";

interface SavedTemplate {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  requestTypes: string[];
}

function getSavedTemplates(): SavedTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch { return []; }
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedTemplateIds, setAttachedTemplateIds] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = getSavedTemplates();
  const totalAttachments = attachedFiles.length + attachedTemplateIds.length;

  const dueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  })();

  const typeLabel = REQUEST_TYPE_LABELS[requestType]
    ? isNb
      ? REQUEST_TYPE_LABELS[requestType].nb
      : REQUEST_TYPE_LABELS[requestType].en
    : requestType;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error(isNb ? "Filen er for stor. Maks 20 MB." : "File too large. Max 20 MB.");
      return;
    }
    setAttachedFiles((prev) => [...prev, file]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTemplate = (id: string) => {
    setAttachedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    onConfirm(dueDate);

    // Persist to outbound requests
    const STORAGE_KEY = "mynder_outbound_requests";
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const newRequests = vendorNames.map((v, i) => ({
        id: `out-bulk-${Date.now()}-${requestType}-${i}`,
        vendor_name: v.name,
        request_type: requestType,
        status: "awaiting" as const,
        due_date: dueDate,
        sent_date: new Date().toISOString().split("T")[0],
        attachments: totalAttachments,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newRequests, ...existing]));
      window.dispatchEvent(new Event("outbound-requests-updated"));
    } catch {}

    toast.success(
      isNb
        ? `Forespørsel sendt til ${vendorNames.length} leverandør(er)`
        : `Request sent to ${vendorNames.length} vendor(s)`,
      {
        icon: "🦋",
        description: isNb
          ? `${totalAttachments > 0 ? `${totalAttachments} vedlegg inkludert. ` : ""}Lara følger opp automatisk og purrer leverandører som ikke svarer innen fristen.`
          : `${totalAttachments > 0 ? `${totalAttachments} attachment(s) included. ` : ""}Lara will automatically follow up and remind vendors who don't respond before the deadline.`,
        duration: 6000,
      }
    );
    onOpenChange(false);
    setAttachedFiles([]);
    setAttachedTemplateIds([]);
    setShowTemplates(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setAttachedFiles([]);
      setAttachedTemplateIds([]);
      setShowTemplates(false);
    }
    onOpenChange(val);
  };

  const PROCESS_STEPS = isNb
    ? [
        { icon: Mail, title: "E-post sendes", desc: "Leverandørene mottar en e-post med forespørselen og en lenke for å svare." },
        { icon: Bell, title: "Automatisk purring", desc: "Lara sender automatisk påminnelse 7 dager før frist, og purrer igjen hvis fristen passeres." },
        { icon: CheckCircle2, title: "Svar i innboksen", desc: "Når leverandøren svarer, dukker dokumentasjonen opp i Lara-innboksen for gjennomgang." },
      ]
    : [
        { icon: Mail, title: "Email sent", desc: "Vendors receive an email with the request and a link to respond." },
        { icon: Bell, title: "Automatic reminders", desc: "Lara sends a reminder 7 days before deadline, and follows up again if it passes." },
        { icon: CheckCircle2, title: "Response in inbox", desc: "When the vendor responds, documentation appears in Lara's inbox for review." },
      ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {isNb ? "Send melding" : "Send message"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Send melding om ${typeLabel.toLowerCase()} til ${vendorNames.length} leverandør${vendorNames.length > 1 ? "er" : ""}.`
              : `Send a message about ${typeLabel} to ${vendorNames.length} vendor${vendorNames.length > 1 ? "s" : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Request type */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Label className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Forespørselstype" : "Request type"}
            </Label>
            <p className="text-sm font-medium mt-1">{typeLabel}</p>
          </div>

          {/* Vendors */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Mottakere" : "Recipients"} ({vendorNames.length})
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {vendorNames.slice(0, 8).map((v) => (
                <Badge key={v.id} variant="outline" className="gap-1.5 text-xs py-1 px-2">
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

          {/* Attachments & Templates */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Vedlegg & maler" : "Attachments & Templates"}
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              {isNb
                ? "Legg ved din egen mal (f.eks. egen DPA-mal) som leverandøren skal fylle ut og returnere."
                : "Attach your own template (e.g. custom DPA template) for the vendor to fill out and return."}
            </p>

            {/* Saved templates */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs gap-2"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {isNb ? "Velg fra malbiblioteket" : "Choose from template library"}
                  <Badge variant="secondary" className="text-[13px] ml-auto">{templates.length}</Badge>
                </Button>

                {showTemplates && (
                  <div className="border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto bg-muted/30">
                    {templates.map((tpl) => (
                      <label
                        key={tpl.id}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 cursor-pointer transition-colors text-sm",
                          attachedTemplateIds.includes(tpl.id) ? "bg-primary/10" : "hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={attachedTemplateIds.includes(tpl.id)}
                          onCheckedChange={() => toggleTemplate(tpl.id)}
                        />
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{tpl.name}</span>
                          <span className="text-[13px] text-muted-foreground">{tpl.fileName} · {(tpl.fileSize / 1024).toFixed(0)} KB</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload new file */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {isNb ? "Last opp nytt vedlegg" : "Upload new attachment"}
            </Button>

            {/* Attached items */}
            {totalAttachments > 0 && (
              <div className="space-y-1.5">
                {attachedFiles.map((file, idx) => (
                  <div key={`file-${idx}`} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-xs">{file.name}</span>
                    <span className="text-[13px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(idx)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {attachedTemplateIds.map((id) => {
                  const tpl = templates.find((t) => t.id === id);
                  if (!tpl) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-1.5 text-sm">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="flex-1 truncate text-xs font-medium">{tpl.name}</span>
                      <Badge variant="outline" className="text-[13px]">{isNb ? "Mal" : "Template"}</Badge>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleTemplate(id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Process explanation */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Hva skjer videre?" : "What happens next?"}
            </Label>
            <div className="space-y-0">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3 relative">
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
          <Button variant="ghost" onClick={() => handleClose(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={handleSend} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isNb
              ? `Send via Lara (${vendorNames.length})`
              : `Send via Lara (${vendorNames.length})`}
            {totalAttachments > 0 && (
              <Badge variant="secondary" className="text-[13px] ml-1">{totalAttachments} {isNb ? "vedlegg" : "att."}</Badge>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
