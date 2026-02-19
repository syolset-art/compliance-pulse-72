import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Send, Sparkles, AlertTriangle, Paperclip, BookOpen, Upload, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Reuse template storage from SendRequestWizard
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

const REQUEST_TYPES = [
  { value: "penetration_test", nb: "Penetrasjonstest", en: "Penetration Test" },
  { value: "dpa", nb: "DPA / Databehandleravtale", en: "DPA" },
  { value: "iso27001", nb: "ISO 27001-sertifikat", en: "ISO 27001 Certificate" },
  { value: "soc2", nb: "SOC 2-rapport", en: "SOC 2 Report" },
  { value: "dpia", nb: "DPIA", en: "DPIA" },
  { value: "general", nb: "Generell oppdatering", en: "General Update" },
];

interface RequestUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  vendorName?: string;
  preselectedType?: string;
}

export function RequestUpdateDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
  vendorName,
  preselectedType,
}: RequestUpdateDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isNb = i18n.language === "nb";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: expiredDocs = [] } = useQuery({
    queryKey: ["expired-docs-detail", assetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, file_name, document_type, valid_to")
        .eq("asset_id", assetId)
        .not("valid_to", "is", null);
      const now = new Date();
      return (data || []).filter((d: any) => new Date(d.valid_to) < now);
    },
    enabled: open,
  });

  const expiredTypes = expiredDocs.map((d: any) => d.document_type);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    preselectedType ? [preselectedType] : []
  );
  const [deadline, setDeadline] = useState<Date>(addDays(new Date(), 30));
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedTemplateIds, setAttachedTemplateIds] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = getSavedTemplates();
  // Filter templates relevant to selected types (with mapping for type key differences)
  const typeMapping: Record<string, string[]> = {
    dpa: ["dpa"],
    iso27001: ["iso_documentation"],
    soc2: ["soc2"],
    dpia: ["gdpr_report"],
    penetration_test: ["vendor_assessment"],
    general: [],
  };
  const relevantTemplates = templates.filter((tpl) => {
    if (tpl.requestTypes.length === 0) return true;
    return selectedTypes.some((st) => {
      const mapped = typeMapping[st] || [st];
      return tpl.requestTypes.some((rt) => mapped.includes(rt) || rt === st);
    });
  });

  const totalAttachments = attachedFiles.length + attachedTemplateIds.length;

  // Auto-select expired doc types when dialog opens
  useEffect(() => {
    if (open && expiredTypes.length > 0 && selectedTypes.length === 0 && !preselectedType) {
      setSelectedTypes([...new Set(expiredTypes)]);
    }
  }, [open, expiredTypes.length]);

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleTemplate = (id: string) => {
    setAttachedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  const sendMutation = useMutation({
    mutationFn: async () => {
      const inserts = selectedTypes.map((type) => ({
        asset_id: assetId,
        document_type: type,
        requested_by: "Compliance Manager",
        deadline: deadline.toISOString(),
        status: "pending",
        message: message || null,
      }));
      const { error } = await supabase
        .from("vendor_document_requests")
        .insert(inserts as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-document-requests", assetId] });

      // Persist to outbound requests
      const STORAGE_KEY = "mynder_outbound_requests";
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const newRequests = selectedTypes.map((type, i) => ({
          id: `out-req-${Date.now()}-${type}-${i}`,
          vendor_name: vendorName || assetName,
          request_type: type,
          status: "awaiting" as const,
          due_date: deadline.toISOString().split("T")[0],
          sent_date: new Date().toISOString().split("T")[0],
          attachments: totalAttachments,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newRequests, ...existing]));
        window.dispatchEvent(new Event("outbound-requests-updated"));
      } catch {}

      const recipient = recipientEmail || vendorName || assetName;
      toast.success(
        isNb
          ? `Forespørselen er sendt til ${recipient}`
          : `Request sent to ${recipient}`,
        {
          icon: "🦋",
          description: isNb
            ? `${totalAttachments > 0 ? `${totalAttachments} vedlegg inkludert. ` : ""}Lara følger opp og gir deg beskjed når svaret kommer i innboksen.`
            : `${totalAttachments > 0 ? `${totalAttachments} attachment(s) included. ` : ""}Lara will follow up and notify you when a response arrives in your inbox.`,
          duration: 6000,
        }
      );
      onOpenChange(false);
      setSelectedTypes([]);
      setMessage("");
      setRecipientEmail("");
      setAttachedFiles([]);
      setAttachedTemplateIds([]);
      setShowTemplates(false);
    },
    onError: () => {
      toast.error(isNb ? "Kunne ikke sende forespørsel" : "Could not send request");
    },
  });

  // Reset preselected when dialog opens
  const handleOpenChange = (val: boolean) => {
    if (val && preselectedType) {
      setSelectedTypes([preselectedType]);
    }
    if (!val) {
      setAttachedFiles([]);
      setAttachedTemplateIds([]);
      setShowTemplates(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {isNb ? "Be om oppdatering" : "Request Update"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Send en forespørsel til ${vendorName || assetName} om manglende eller utgått dokumentasjon.`
              : `Send a request to ${vendorName || assetName} for missing or expired documentation.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Expired documents alert */}
          {expiredDocs.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {isNb
                  ? `${expiredDocs.length} utgått${expiredDocs.length > 1 ? "e" : ""} dokument${expiredDocs.length > 1 ? "er" : ""}`
                  : `${expiredDocs.length} expired document${expiredDocs.length > 1 ? "s" : ""}`}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {expiredDocs.map((doc: any) => {
                  const rt = REQUEST_TYPES.find((r) => r.value === doc.document_type);
                  const daysExpired = Math.ceil((new Date().getTime() - new Date(doc.valid_to).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Badge
                      key={doc.id}
                      variant="outline"
                      className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20"
                    >
                      {rt ? (isNb ? rt.nb : rt.en) : doc.document_type}
                      <span className="opacity-70">
                        ({isNb ? `${daysExpired}d siden` : `${daysExpired}d ago`})
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document types */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Hva trenger du?" : "What do you need?"}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPES.map((rt) => (
                <label
                  key={rt.value}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-all text-sm",
                    selectedTypes.includes(rt.value)
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={selectedTypes.includes(rt.value)}
                    onCheckedChange={() => toggleType(rt.value)}
                  />
                  {isNb ? rt.nb : rt.en}
                </label>
              ))}
            </div>
          </div>

          {/* Attachments & Templates section */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Vedlegg & maler" : "Attachments & Templates"}
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              {isNb
                ? "Legg ved din egen mal (f.eks. egen DPA-mal) som leverandøren skal fylle ut og returnere."
                : "Attach your own template (e.g. custom DPA template) for the vendor to fill out and return."}
            </p>

            {/* Saved templates from platform */}
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
                  <Badge variant="secondary" className="text-[10px] ml-auto">{templates.length}</Badge>
                </Button>

                {showTemplates && (
                  <div className="border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto bg-muted/30">
                    {(relevantTemplates.length > 0 ? relevantTemplates : templates).map((tpl) => (
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
                          <span className="text-[10px] text-muted-foreground">{tpl.fileName} · {(tpl.fileSize / 1024).toFixed(0)} KB</span>
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

            {/* Attached items display */}
            {totalAttachments > 0 && (
              <div className="space-y-1.5">
                {attachedFiles.map((file, idx) => (
                  <div key={`file-${idx}`} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-xs">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
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
                      <Badge variant="outline" className="text-[9px]">{isNb ? "Mal" : "Template"}</Badge>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleTemplate(id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Frist" : "Deadline"}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline
                    ? format(deadline, "PPP", { locale: isNb ? nb : undefined })
                    : isNb ? "Velg dato" : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => d && setDeadline(d)}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Recipient email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Mottaker (e-post)" : "Recipient (email)"}
            </Label>
            <Input
              type="email"
              placeholder={isNb ? "kontakt@leverandor.no" : "contact@vendor.com"}
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Melding (valgfritt)" : "Message (optional)"}
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isNb
                  ? "Legg til en melding til leverandøren..."
                  : "Add a message to the vendor..."
              }
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={selectedTypes.length === 0 || sendMutation.isPending}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isNb ? "Send via Lara" : "Send via Lara"}
            {totalAttachments > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">{totalAttachments} {isNb ? "vedlegg" : "att."}</Badge>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
