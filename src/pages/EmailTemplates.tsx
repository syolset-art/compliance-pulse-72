import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Mail, FileText, Building2, Users, Pencil } from "lucide-react";
import { PreviewDialog } from "@/components/email/PreviewDialog";
import { SendDialog } from "@/components/email/SendDialog";
import { OfferTemplateManager } from "@/components/email/OfferTemplateManager";
import { EmailLanguage } from "@/components/email/EmailLayout";
import { EmailTemplateType, TEMPLATE_META } from "@/lib/emailTemplates";

const ICONS: Record<EmailTemplateType, typeof Mail> = {
  offer: FileText,
  vendor_trust_profile: Building2,
  customer_profile: Users,
};

const ORDER: EmailTemplateType[] = ["offer", "vendor_trust_profile", "customer_profile"];

export default function EmailTemplates() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [activeType, setActiveType] = useState<EmailTemplateType>("offer");
  const [language, setLanguage] = useState<EmailLanguage>("no");

  const openPreview = (type: EmailTemplateType) => {
    setActiveType(type);
    setPreviewOpen(true);
  };
  const openSend = (type: EmailTemplateType) => {
    setActiveType(type);
    setSendOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Mail className="h-3.5 w-3.5" />
              6 · E-postmaler
            </div>
            <h1 className="text-3xl font-bold text-foreground">E-postmaler</h1>
            <p className="text-base text-foreground/80 max-w-2xl leading-relaxed">
              Alle utgående e-poster fra Mynder deler samme layout — ren header med Mynder-logo, tydelig
              CTA og enhetlig footer. Velg et scenario for å forhåndsvise eller sende.
            </p>

            <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-0.5 mt-3">
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
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ORDER.map((type) => {
              const Icon = ICONS[type];
              const meta = TEMPLATE_META[type];
              const title = language === "no" ? meta.titleNo : meta.titleEn;
              const desc = language === "no" ? meta.descNo : meta.descEn;
              return (
                <Card key={type} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        {language}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-semibold text-foreground leading-snug">{title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openPreview(type)}>
                        <Eye className="h-3.5 w-3.5" />
                        Forhåndsvis
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5" onClick={() => openSend(type)}>
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        type={activeType}
        initialLanguage={language}
      />
      <SendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        type={activeType}
        initialLanguage={language}
      />
    </div>
  );
}
