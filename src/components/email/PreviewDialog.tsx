import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailLayout, EmailLanguage } from "@/components/email/EmailLayout";
import { EmailPreviewFrame } from "@/components/email/EmailPreviewFrame";
import { DefaultEmailTemplate, EmailTemplateType, getDefaultTemplate, TEMPLATE_META } from "@/lib/emailTemplates";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EmailTemplateType;
  initialLanguage?: EmailLanguage;
  senderOrganization?: string;
}

export function PreviewDialog({
  open,
  onOpenChange,
  type,
  initialLanguage = "no",
  senderOrganization = "Mynder AS",
}: PreviewDialogProps) {
  const [language, setLanguage] = useState<EmailLanguage>(initialLanguage);
  const template: DefaultEmailTemplate = useMemo(() => getDefaultTemplate(type, language), [type, language]);
  const meta = TEMPLATE_META[type];
  const title = language === "no" ? meta.titleNo : meta.titleEn;

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
          <EmailPreviewFrame subject={template.subject}>
            <EmailLayout
              subject={template.subject}
              body={template.body}
              cta={{ text: template.cta_text, url: template.cta_url }}
              senderOrganization={senderOrganization}
              language={language}
            />
          </EmailPreviewFrame>
        </div>
      </DialogContent>
    </Dialog>
  );
}
