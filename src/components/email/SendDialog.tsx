import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmailLayout, EmailLanguage } from "@/components/email/EmailLayout";
import { EmailPreviewFrame } from "@/components/email/EmailPreviewFrame";
import { EmailTemplateType, getDefaultTemplate, TEMPLATE_META } from "@/lib/emailTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EmailTemplateType;
  initialLanguage?: EmailLanguage;
  senderOrganization?: string;
}

export function SendDialog({
  open,
  onOpenChange,
  type,
  initialLanguage = "no",
  senderOrganization = "Mynder AS",
}: SendDialogProps) {
  const [language, setLanguage] = useState<EmailLanguage>(initialLanguage);
  const base = useMemo(() => getDefaultTemplate(type, language), [type, language]);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState(base.subject);
  const [body, setBody] = useState(base.body);
  const [ctaText, setCtaText] = useState(base.cta_text);
  const [ctaUrl, setCtaUrl] = useState(base.cta_url);
  const [submitting, setSubmitting] = useState(false);

  const meta = TEMPLATE_META[type];
  const title = language === "no" ? meta.titleNo : meta.titleEn;

  // When language changes, refresh defaults if user hasn't manually edited
  const switchLanguage = (next: EmailLanguage) => {
    const oldBase = getDefaultTemplate(type, language);
    const nextBase = getDefaultTemplate(type, next);
    if (subject === oldBase.subject) setSubject(nextBase.subject);
    if (body === oldBase.body) setBody(nextBase.body);
    if (ctaText === oldBase.cta_text) setCtaText(nextBase.cta_text);
    if (ctaUrl === oldBase.cta_url) setCtaUrl(nextBase.cta_url);
    setLanguage(next);
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({ title: "Mottaker mangler", description: "Fyll inn mottakerens e-postadresse.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("email_sends").insert({
        recipient_name: recipientName || null,
        recipient_email: recipientEmail,
        subject,
        language,
        variables: { body, cta_text: ctaText, cta_url: ctaUrl, sender_organization: senderOrganization },
        status: "queued",
      });
      if (error) throw error;
      toast({
        title: "E-post lagt i kø",
        description: `Sending til ${recipientEmail} er registrert.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Kunne ikke sende", description: err.message ?? String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="text-lg">Send · {title}</DialogTitle>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            <Button
              variant={language === "no" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => switchLanguage("no")}
            >
              Norsk
            </Button>
            <Button
              variant={language === "en" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => switchLanguage("en")}
            >
              English
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 max-h-[75vh] overflow-hidden">
          {/* Editor */}
          <div className="p-6 overflow-auto space-y-4 border-r border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rn">Mottakernavn</Label>
                <Input id="rn" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Ola Nordmann" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="re">Mottaker e-post</Label>
                <Input id="re" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="ola@firma.no" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub">Emne</Label>
              <Input id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Brødtekst</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct">CTA-tekst</Label>
                <Input id="ct" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu">CTA-lenke</Label>
                <Input id="cu" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="p-6 overflow-auto bg-muted/20">
            <EmailPreviewFrame subject={subject} fromName={senderOrganization}>
              <EmailLayout
                subject={subject}
                body={body}
                cta={{ text: ctaText, url: ctaUrl }}
                senderOrganization={senderOrganization}
                language={language}
              />
            </EmailPreviewFrame>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Sender…" : "Send e-post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
