import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Save,
  Copy,
  Star,
  StarOff,
  Plus,
  Send as SendIcon,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { EmailLayout, EmailLanguage, EmailAttachment } from "@/components/email/EmailLayout";
import { EmailPreviewFrame } from "@/components/email/EmailPreviewFrame";
import { VariableTextarea, VariableTextareaHandle } from "@/components/email/VariableTextarea";
import { OFFER_VARIABLES, OFFER_DEMO_VARS, substituteVars } from "@/lib/offerVariables";
import { getDefaultTemplate } from "@/lib/emailTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OfferTemplate {
  id: string;
  name: string | null;
  language: string;
  subject: string;
  body: string;
  cta_text: string | null;
  cta_url: string | null;
  signature: string | null;
  is_default: boolean;
  updated_at: string;
}

interface OfferTemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLanguage?: EmailLanguage;
}

const DEFAULT_SIGNATURE_NO = `Med vennlig hilsen,
{{avsender_navn}}
{{avsender_selskap}}`;
const DEFAULT_SIGNATURE_EN = `Kind regards,
{{avsender_navn}}
{{avsender_selskap}}`;

type DraftFields = {
  subject: string;
  body: string;
  cta_text: string;
  cta_url: string;
  signature: string;
};

function fieldsFromBase(language: EmailLanguage): DraftFields {
  const base = getDefaultTemplate("offer", language);
  return {
    subject: base.subject,
    body: base.body,
    cta_text: base.cta_text,
    cta_url: base.cta_url,
    signature: language === "no" ? DEFAULT_SIGNATURE_NO : DEFAULT_SIGNATURE_EN,
  };
}

function fieldsFromTemplate(t: OfferTemplate): DraftFields {
  return {
    subject: t.subject ?? "",
    body: t.body ?? "",
    cta_text: t.cta_text ?? "",
    cta_url: t.cta_url ?? "",
    signature: t.signature ?? (t.language === "en" ? DEFAULT_SIGNATURE_EN : DEFAULT_SIGNATURE_NO),
  };
}

export function OfferTemplateManager({
  open,
  onOpenChange,
  initialLanguage = "no",
}: OfferTemplateManagerProps) {
  const [language, setLanguage] = useState<EmailLanguage>(initialLanguage);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<DraftFields>(() => fieldsFromBase(initialLanguage));
  const [draftName, setDraftName] = useState("");
  const [dirty, setDirty] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  const subjectRef = useRef<VariableTextareaHandle>(null);
  const bodyRef = useRef<VariableTextareaHandle>(null);
  const ctaRef = useRef<VariableTextareaHandle>(null);
  const sigRef = useRef<VariableTextareaHandle>(null);
  const [activeField, setActiveField] = useState<"subject" | "body" | "cta_text" | "signature">("body");

  const refMap = { subject: subjectRef, body: bodyRef, cta_text: ctaRef, signature: sigRef };

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "offer")
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Kunne ikke laste maler", description: error.message, variant: "destructive" });
    } else {
      setTemplates((data ?? []) as OfferTemplate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadTemplates();
  }, [open]);

  useEffect(() => {
    if (!open || templates.length === 0) return;
    if (selectedId) return;
    const def = templates.find((t) => t.is_default && t.language === language);
    if (def) {
      setSelectedId(def.id);
      setDraft(fieldsFromTemplate(def));
      setDraftName(def.name ?? "");
      setDirty(false);
    }
  }, [templates, open]);

  const switchLanguage = (next: EmailLanguage) => {
    if (!selectedId && !dirty) {
      setDraft(fieldsFromBase(next));
    }
    setLanguage(next);
  };

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const handleSelect = (t: OfferTemplate) => {
    setSelectedId(t.id);
    setLanguage((t.language as EmailLanguage) || "no");
    setDraft(fieldsFromTemplate(t));
    setDraftName(t.name ?? "");
    setDirty(false);
  };

  const handleNew = () => {
    setSelectedId(null);
    setDraft(fieldsFromBase(language));
    setDraftName("");
    setDirty(false);
  };

  const updateDraft = (patch: Partial<DraftFields>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const insertVariable = (key: string) => {
    refMap[activeField].current?.insertVariable(key);
  };

  const handleSaveAsNew = async () => {
    const name = draftName.trim() || (language === "no" ? "Standard tilbud" : "Standard offer");
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        type: "offer",
        language,
        name,
        subject: draft.subject,
        body: draft.body,
        cta_text: draft.cta_text,
        cta_url: draft.cta_url,
        signature: draft.signature,
        is_default: templates.filter((t) => t.language === language).length === 0,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Kunne ikke lagre mal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal lagret", description: `"${name}" er lagret som mal.` });
    await loadTemplates();
    setSelectedId(data!.id);
    setDraftName(name);
    setDirty(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("email_templates")
      .update({
        name: draftName.trim() || selected.name,
        language,
        subject: draft.subject,
        body: draft.body,
        cta_text: draft.cta_text,
        cta_url: draft.cta_url,
        signature: draft.signature,
      })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Kunne ikke oppdatere mal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal oppdatert" });
    await loadTemplates();
    setDirty(false);
  };

  const handleDuplicate = async (t: OfferTemplate) => {
    const name = `${t.name ?? "Mal"} (kopi)`;
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        type: "offer",
        language: t.language,
        name,
        subject: t.subject,
        body: t.body,
        cta_text: t.cta_text,
        cta_url: t.cta_url,
        signature: t.signature,
        is_default: false,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Kunne ikke duplisere", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal duplisert" });
    await loadTemplates();
    if (data) handleSelect(data as OfferTemplate);
  };

  const handleSetDefault = async (t: OfferTemplate) => {
    const sameLang = templates.filter((x) => x.language === t.language && x.is_default && x.id !== t.id);
    if (sameLang.length > 0) {
      await supabase.from("email_templates").update({ is_default: false }).in("id", sameLang.map((x) => x.id));
    }
    const { error } = await supabase.from("email_templates").update({ is_default: true }).eq("id", t.id);
    if (error) {
      toast({ title: "Kunne ikke sette standard", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Standardmal oppdatert" });
    await loadTemplates();
  };

  const handleDelete = async (t: OfferTemplate) => {
    if (!confirm(`Slett malen "${t.name ?? "Uten navn"}"?`)) return;
    const { error } = await supabase.from("email_templates").delete().eq("id", t.id);
    if (error) {
      toast({ title: "Kunne ikke slette", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal slettet" });
    if (selectedId === t.id) handleNew();
    await loadTemplates();
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({ title: "Mottaker mangler", description: "Fyll inn mottakerens e-postadresse.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("email_sends").insert({
        template_id: selectedId,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail,
        subject: substituteVars(draft.subject, sendVars),
        language,
        variables: {
          ...sendVars,
          body: draft.body,
          cta_text: draft.cta_text,
          cta_url: draft.cta_url,
          signature: draft.signature,
        },
        status: "queued",
      });
      if (error) throw error;
      toast({ title: "E-post lagt i kø", description: `Sending til ${recipientEmail} er registrert.` });
      setRecipientEmail("");
      setRecipientName("");
    } catch (err: any) {
      toast({ title: "Kunne ikke sende", description: err.message ?? String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendVars: Record<string, string> = useMemo(() => {
    return {
      ...OFFER_DEMO_VARS,
      ...(recipientName ? { kontaktnavn: recipientName } : {}),
    };
  }, [recipientName]);

  const previewSubject = substituteVars(draft.subject, sendVars);
  const previewBody = substituteVars(draft.body, sendVars);
  const previewSignature = substituteVars(draft.signature, sendVars);
  const previewCta = substituteVars(draft.cta_text, sendVars);
  const attachments: EmailAttachment[] = [
    { filename: substituteVars("{{tilbud_pdf}}", sendVars), sizeLabel: "248 KB" },
  ];
  const replyInstruction =
    language === "no" ? (
      <>Svar <span className="font-semibold">«OK»</span> på denne e-posten for å godkjenne — så starter leveransen umiddelbart.</>
    ) : (
      <>Reply <span className="font-semibold">"OK"</span> to this email to approve — delivery starts immediately.</>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1280px] p-0 overflow-hidden h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between gap-4 space-y-0 border-b border-border">
          <DialogTitle className="text-lg">Tilbud · Mal-editor</DialogTitle>
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

        <div className="grid grid-cols-[260px_1fr_1fr] flex-1 overflow-hidden">
          <aside className="border-r border-border bg-muted/20 flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maler</div>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleNew}>
                <Plus className="h-3.5 w-3.5" /> Ny
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {loading && <div className="text-xs text-muted-foreground p-2">Laster…</div>}
              {!loading && templates.length === 0 && (
                <div className="text-xs text-muted-foreground p-2 leading-relaxed">
                  Ingen lagrede maler ennå. Rediger teksten og trykk "Lagre som mal".
                </div>
              )}
              {templates.map((t) => {
                const active = t.id === selectedId;
                return (
                  <div
                    key={t.id}
                    className={`rounded-md border px-2.5 py-2 cursor-pointer transition ${
                      active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-accent"
                    }`}
                    onClick={() => handleSelect(t)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.name ?? "Uten navn"}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0">
                            {t.language}
                          </Badge>
                          {t.is_default && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              <Star className="h-3 w-3 fill-current" /> Standard
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(t);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Dupliser</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(t);
                                }}
                              >
                                {t.is_default ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t.is_default ? "Allerede standard" : "Sett som standard"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(t);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Slett</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="overflow-auto p-5 space-y-4 border-r border-border">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Mal-navn</Label>
              <Input
                id="tpl-name"
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value);
                  setDirty(true);
                }}
                placeholder="Standard tilbud"
              />
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                Sett inn variabel i: <span className="font-semibold text-foreground">{activeField}</span> · eller skriv <code className="px-1 rounded bg-background border border-border text-[10px]">/</code>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {OFFER_VARIABLES.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px] font-mono"
                    onClick={() => insertVariable(v.key)}
                  >
                    {`{{${v.key}}}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5" onFocus={() => setActiveField("subject")}>
              <Label htmlFor="f-subject">Emnefelt</Label>
              <VariableTextarea
                ref={subjectRef}
                id="f-subject"
                value={draft.subject}
                onChange={(v) => updateDraft({ subject: v })}
                singleLine
                language={language}
              />
            </div>

            <div className="space-y-1.5" onFocus={() => setActiveField("body")}>
              <Label htmlFor="f-body">Brødtekst</Label>
              <VariableTextarea
                ref={bodyRef}
                id="f-body"
                value={draft.body}
                onChange={(v) => updateDraft({ body: v })}
                rows={9}
                language={language}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5" onFocus={() => setActiveField("cta_text")}>
                <Label htmlFor="f-cta">CTA-tekst</Label>
                <VariableTextarea
                  ref={ctaRef}
                  id="f-cta"
                  value={draft.cta_text}
                  onChange={(v) => updateDraft({ cta_text: v })}
                  singleLine
                  language={language}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-ctaurl">CTA-lenke</Label>
                <Input
                  id="f-ctaurl"
                  value={draft.cta_url}
                  onChange={(e) => updateDraft({ cta_url: e.target.value })}
                  className="font-mono text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1.5" onFocus={() => setActiveField("signature")}>
              <Label htmlFor="f-sig">Signatur</Label>
              <VariableTextarea
                ref={sigRef}
                id="f-sig"
                value={draft.signature}
                onChange={(v) => updateDraft({ signature: v })}
                rows={4}
                language={language}
              />
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveAsNew} variant="default" className="gap-1.5">
                <Save className="h-4 w-4" /> Lagre som mal
              </Button>
              <Button
                onClick={handleUpdate}
                variant="outline"
                disabled={!selected || !dirty}
                className="gap-1.5"
              >
                <RefreshCcw className="h-4 w-4" /> Oppdater mal
              </Button>
              {dirty && selected && (
                <span className="text-xs text-warning self-center">Ulagrede endringer</span>
              )}
            </div>
          </section>

          <section className="overflow-auto bg-muted/20 p-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Forhåndsvisning</div>
              <EmailPreviewFrame
                subject={previewSubject}
                fromName={sendVars.avsender_navn}
                fromEmail="ola.nordmann@nordlys-sikkerhet.no"
              >
                <EmailLayout
                  subject={previewSubject}
                  body={previewBody}
                  cta={{ text: previewCta, url: draft.cta_url }}
                  replyInstruction={replyInstruction}
                  attachments={attachments}
                  signature={previewSignature}
                  senderOrganization={sendVars.avsender_selskap}
                  language={language}
                />
              </EmailPreviewFrame>
            </div>
          </section>
        </div>

        {/* Sticky send bar */}
        <div className="border-t border-border bg-background px-5 py-3 flex flex-wrap items-end gap-3">
          <div className="text-xs text-muted-foreground mr-auto self-center">
            <span className="font-medium text-foreground">Valgt mal:</span>{" "}
            {selected ? (selected.name ?? "Uten navn") : <em>Ulagret utkast</em>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-name" className="text-[11px]">{`Mottakernavn ({{kontaktnavn}})`}</Label>
            <Input
              id="r-name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Kari"
              className="h-9 w-44"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-email" className="text-[11px]">Mottaker e-post</Label>
            <Input
              id="r-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="kari@dipsarena.no"
              className="h-9 w-60"
            />
          </div>
          <Button onClick={handleSend} disabled={sending} size="lg" className="gap-2 h-10">
            <SendIcon className="h-4 w-4" /> {sending ? "Sender…" : "Send e-post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
