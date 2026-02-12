import { useState, useEffect } from "react";
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
import { CalendarIcon, Send, Sparkles, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      const recipient = recipientEmail || vendorName || assetName;
      toast.success(
        isNb
          ? `Forespørselen er sendt til ${recipient}`
          : `Request sent to ${recipient}`,
        {
          icon: "🦋",
          description: isNb
            ? `Lara følger opp og gir deg beskjed når svaret kommer i innboksen.`
            : `Lara will follow up and notify you when a response arrives in your inbox.`,
          duration: 6000,
        }
      );
      onOpenChange(false);
      setSelectedTypes([]);
      setMessage("");
      setRecipientEmail("");
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
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
