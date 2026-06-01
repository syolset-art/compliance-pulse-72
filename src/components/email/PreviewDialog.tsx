import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailLayout, EmailLanguage, EmailAttachment } from "@/components/email/EmailLayout";
import { EmailPreviewFrame } from "@/components/email/EmailPreviewFrame";
import { DefaultEmailTemplate, EmailTemplateType, getDefaultTemplate, TEMPLATE_META } from "@/lib/emailTemplates";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EmailTemplateType;
  initialLanguage?: EmailLanguage;
  senderOrganization?: string;
}

// Demo variables used to populate the preview so the user sees a realistic email.
const OFFER_VARS = {
  avsender_selskap: "Nordlys Sikkerhet AS",
  avsender_navn: "Ola Nordmann",
  kontaktnavn: "Kari",
  kunde_selskap: "DIPS Arena AS",
  tilbud_pdf: "Tilbud-DIPS-Arena.pdf",
};

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export function PreviewDialog({
  open,
  onOpenChange,
  type,
  initialLanguage = "no",
  senderOrganization,
}: PreviewDialogProps) {
  const [language, setLanguage] = useState<EmailLanguage>(initialLanguage);
  const template: DefaultEmailTemplate = useMemo(() => getDefaultTemplate(type, language), [type, language]);
  const meta = TEMPLATE_META[type];
  const title = language === "no" ? meta.titleNo : meta.titleEn;

  const vars = type === "offer" ? OFFER_VARS : {};
  const subject = substitute(template.subject, vars);
  const body = substitute(template.body, vars);
  const senderOrg = senderOrganization ?? (type === "offer" ? OFFER_VARS.avsender_selskap : "Mynder AS");

  const isOffer = type === "offer";
  const attachments: EmailAttachment[] | undefined = isOffer
    ? [{ filename: OFFER_VARS.tilbud_pdf, sizeLabel: "248 KB" }]
    : undefined;

  const replyInstruction = isOffer
    ? language === "no"
      ? <>Svar <span className="font-semibold">«OK»</span> på denne e-posten for å godkjenne — så starter leveransen umiddelbart.</>
      : <>Reply <span className="font-semibold">"OK"</span> to this email to approve — delivery starts immediately.</>
    : null;

  const signature = isOffer
    ? language === "no"
      ? `Med vennlig hilsen,\n${OFFER_VARS.avsender_navn}\n${OFFER_VARS.avsender_selskap}`
      : `Kind regards,\n${OFFER_VARS.avsender_navn}\n${OFFER_VARS.avsender_selskap}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="text-lg">Forhåndsvisning · {title}</DialogTitle>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            <Button
              variant={language === "no" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLanguage("no")}
            >
              Norsk
            </Button>
            <Button
              variant={language === "en" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLanguage("en")}
            >
              English
            </Button>
          </div>
        </DialogHeader>
        <div className="px-6 pb-6">
          <EmailPreviewFrame
            subject={subject}
            fromName={isOffer ? OFFER_VARS.avsender_navn : "Mynder"}
            fromEmail={isOffer ? "ola.nordmann@nordlys-sikkerhet.no" : "no-reply@mynder.no"}
          >
            <EmailLayout
              subject={subject}
              body={body}
              cta={{ text: template.cta_text, url: template.cta_url }}
              replyInstruction={replyInstruction}
              attachments={attachments}
              signature={signature}
              senderOrganization={senderOrg}
              language={language}
            />
          </EmailPreviewFrame>
        </div>
      </DialogContent>
    </Dialog>
  );
}
