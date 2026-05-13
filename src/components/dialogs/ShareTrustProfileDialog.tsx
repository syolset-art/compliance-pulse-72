import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Check, Share2, Building2, Globe, Mail } from "lucide-react";

type Recipient = {
  id: string;
  email: string;
  type: "internal" | "external";
};

interface ShareTrustProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicUrl: string;
  /** Org email domain (e.g. "mynder.no") used to auto-classify recipients. */
  orgDomain?: string | null;
}

const emailSchema = z.string().trim().toLowerCase().email();

const newRow = (orgDomain?: string | null, email = ""): Recipient => ({
  id: crypto.randomUUID(),
  email,
  type: classify(email, orgDomain),
});

function classify(email: string, orgDomain?: string | null): "internal" | "external" {
  if (!orgDomain) return "external";
  const at = email.split("@")[1]?.toLowerCase().trim();
  return at && at === orgDomain.toLowerCase().trim() ? "internal" : "external";
}

export default function ShareTrustProfileDialog({
  open, onOpenChange, publicUrl, orgDomain,
}: ShareTrustProfileDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [recipients, setRecipients] = useState<Recipient[]>([newRow(orgDomain)]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const updateRow = (id: string, patch: Partial<Recipient>) => {
    setRecipients(rs => rs.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      // Auto re-classify when email changes (user can still override after)
      if (patch.email !== undefined) next.type = classify(next.email, orgDomain);
      return next;
    }));
  };

  const addRow = () => setRecipients(rs => [...rs, newRow(orgDomain)]);
  const removeRow = (id: string) =>
    setRecipients(rs => rs.length === 1 ? rs : rs.filter(r => r.id !== id));

  const counts = useMemo(() => {
    const valid = recipients.filter(r => emailSchema.safeParse(r.email).success);
    return {
      internal: valid.filter(r => r.type === "internal").length,
      external: valid.filter(r => r.type === "external").length,
      total: valid.length,
    };
  }, [recipients]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success(isNb ? "Lenke kopiert" : "Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isNb ? "Kunne ikke kopiere" : "Copy failed");
    }
  };

  const handleSend = async () => {
    const errors: string[] = [];
    const cleaned: Recipient[] = [];
    recipients.forEach((r, i) => {
      const email = r.email.trim();
      if (!email) return;
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        errors.push(`${isNb ? "Rad" : "Row"} ${i + 1}: ${isNb ? "ugyldig e-post" : "invalid email"}`);
      } else {
        cleaned.push({ ...r, email: parsed.data });
      }
    });
    if (cleaned.length === 0) {
      toast.error(isNb ? "Legg til minst én e-postadresse" : "Add at least one email address");
      return;
    }
    if (errors.length > 0) {
      toast.error(errors.join(" • "));
      return;
    }
    setSending(true);
    // Frontend-only: simulate sending. Backend wiring can be added later.
    await new Promise(res => setTimeout(res, 400));
    setSending(false);
    const internal = cleaned.filter(r => r.type === "internal").length;
    const external = cleaned.filter(r => r.type === "external").length;
    toast.success(
      isNb
        ? `Delt med ${cleaned.length} mottaker${cleaned.length === 1 ? "" : "e"} (${internal} intern, ${external} ekstern)`
        : `Shared with ${cleaned.length} recipient${cleaned.length === 1 ? "" : "s"} (${internal} internal, ${external} external)`
    );
    onOpenChange(false);
    setRecipients([newRow(orgDomain)]);
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
            {isNb ? "Del Trust-profil" : "Share Trust profile"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Legg inn e-postadresser og angi om mottaker er intern eller ekstern."
              : "Enter email addresses and indicate whether each recipient is internal or external."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {isNb ? "Send på e-post" : "Send by email"}
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Copy className="h-4 w-4" aria-hidden="true" />
              {isNb ? "Kopier lenke" : "Copy link"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 pt-4">
            <div className="space-y-3">
              {recipients.map((r, idx) => {
                const valid = !r.email || emailSchema.safeParse(r.email).success;
                return (
                  <div key={r.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder={isNb ? "navn@firma.no" : "name@company.com"}
                        value={r.email}
                        onChange={(e) => updateRow(r.id, { email: e.target.value })}
                        aria-invalid={!valid}
                        aria-label={`${isNb ? "E-post" : "Email"} ${idx + 1}`}
                        className={!valid ? "border-destructive" : ""}
                        maxLength={255}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(r.id)}
                        disabled={recipients.length === 1}
                        aria-label={isNb ? "Fjern rad" : "Remove row"}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <RadioGroup
                      value={r.type}
                      onValueChange={(v) => updateRow(r.id, { type: v as Recipient["type"] })}
                      className="flex gap-4"
                      aria-label={isNb ? "Type mottaker" : "Recipient type"}
                    >
                      <Label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                        <RadioGroupItem value="internal" id={`${r.id}-int`} />
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        {isNb ? "Intern" : "Internal"}
                      </Label>
                      <Label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                        <RadioGroupItem value="external" id={`${r.id}-ext`} />
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        {isNb ? "Ekstern" : "External"}
                      </Label>
                    </RadioGroup>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {isNb ? "Legg til mottaker" : "Add recipient"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message">{isNb ? "Melding (valgfritt)" : "Message (optional)"}</Label>
              <Textarea
                id="share-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isNb ? "Skriv en kort hilsen…" : "Write a short note…"}
                maxLength={1000}
                rows={3}
              />
            </div>

            {counts.total > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" aria-hidden="true" />
                  {isNb ? "Intern" : "Internal"}: {counts.internal}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  {isNb ? "Ekstern" : "External"}: {counts.external}
                </Badge>
              </div>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-3 pt-4">
            <Label htmlFor="share-link">{isNb ? "Offentlig lenke" : "Public link"}</Label>
            <div className="flex items-center gap-2">
              <Input id="share-link" readOnly value={publicUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" onClick={handleCopy} className="gap-2 shrink-0">
                {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? (isNb ? "Kopiert" : "Copied") : (isNb ? "Kopier" : "Copy")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Alle med lenken kan se det som er publisert i Trust-profilen."
                : "Anyone with the link can view what is published on the Trust profile."}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {sending ? (isNb ? "Sender…" : "Sending…") : (isNb ? "Del" : "Share")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
