import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Send, CheckCircle2, UserRound, ArrowRight, Loader2, Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackStep = "describe" | "lara-response" | "escalate" | "submitted";

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { user } = useAuth();
  const suggestedEmail = user?.email ?? "";

  const [step, setStep] = useState<FeedbackStep>("describe");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = ev.target?.result as string;
        setAttachments((prev) => [...prev, { file, preview }]);
      };
      reader.readAsDataURL(file);
    });
    // reset value so same file can be picked again
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitFeedback = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);
    // Simulate Lara processing
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep("lara-response");
  };

  const handleEscalate = () => {
    setStep("escalate");
  };

  const handleSubmitEscalation = async () => {
    if (!contactEmail.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setStep("submitted");
    toast.success(isNb ? "Innspillet ditt er registrert" : "Your feedback has been registered", {
      description: isNb
        ? "En rådgiver vil følge opp på e-post."
        : "An advisor will follow up via email.",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("describe");
      setDescription("");
      setAttachments([]);
      setContactEmail("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "describe" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {isNb ? "Gi tilbakemelding" : "Give feedback"}
              </DialogTitle>
              <DialogDescription>
                {isNb
                  ? "Beskriv problemet eller hva du savner. Du kan ta et skjermbilde for kontekst."
                  : "Describe the issue or what you're missing. You can attach a screenshot for context."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Screenshot upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {isNb ? "Bilder eller skjermbilder (valgfritt)" : "Images or screenshots (optional)"}
                </label>

                {/* Previews */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {attachments.map((att, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border border-border aspect-square">
                        <img src={att.preview} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm text-foreground rounded-full p-0.5 hover:bg-background"
                          aria-label={isNb ? "Fjern" : "Remove"}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Two-button picker: take photo or upload */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30 text-sm text-muted-foreground">
                    <Camera className="h-4 w-4" />
                    {isNb ? "Ta bilde" : "Take photo"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>
                  <label className="flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {isNb ? "Last opp" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {isNb ? "Beskriv kort" : "Describe briefly"}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isNb ? "Hva trenger du hjelp med, eller hva savner du?" : "What do you need help with, or what's missing?"}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={!description.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isNb ? "Sender..." : "Sending..."}</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />{isNb ? "Send til Mynder" : "Send to Mynder"}</>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "lara-response" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <img src={laraButterfly} alt="Lara" className="w-6 h-6" />
                {isNb ? "Laras forslag" : "Lara's suggestion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  {isNb
                    ? `Takk for tilbakemeldingen! Basert på det du beskriver, kan jeg foreslå en plan:`
                    : `Thanks for the feedback! Based on what you describe, I can suggest a plan:`}
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[13px] px-1.5 py-0 mt-0.5 shrink-0">1</Badge>
                    <span className="text-foreground">
                      {isNb ? "Vi registrerer innspillet ditt i vår backlog" : "We'll register your input in our backlog"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[13px] px-1.5 py-0 mt-0.5 shrink-0">2</Badge>
                    <span className="text-foreground">
                      {isNb ? "Teamet vårt vurderer og prioriterer" : "Our team evaluates and prioritizes"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[13px] px-1.5 py-0 mt-0.5 shrink-0">3</Badge>
                    <span className="text-foreground">
                      {isNb ? "Du får beskjed når det er løst" : "You'll be notified when it's resolved"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {isNb
                  ? "Vil du at en rådgiver tar kontakt om denne saken?"
                  : "Would you like an advisor to follow up on this?"}
              </p>

              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  {isNb ? "Nei takk" : "No thanks"}
                </Button>
                <Button onClick={handleEscalate} className="flex-1">
                  <UserRound className="h-4 w-4 mr-2" />
                  {isNb ? "Ja, ta kontakt" : "Yes, contact me"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "escalate" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {isNb ? "Kontakt en Mynder-rådgiver" : "Contact a Mynder advisor"}
              </DialogTitle>
              <DialogDescription>
                {isNb
                  ? "En av våre rådgivere følger opp på e-post. Du vil få beskjed om status og når problemet er løst."
                  : "One of our advisors will follow up via email. You'll be notified about status and when the issue is resolved."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {isNb ? "Din e-post" : "Your email"}
                </label>
                <Input
                  type="email"
                  value={contactEmail || suggestedEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={suggestedEmail || "navn@firma.no"}
                />
                {suggestedEmail && (
                  <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {isNb
                      ? `Lara foreslår e-posten du er logget inn med (${suggestedEmail}). Endre om nødvendig.`
                      : `Lara suggests the email you're signed in with (${suggestedEmail}). Change if needed.`}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{isNb ? "Hva skjer videre?" : "What happens next?"}</p>
                <p>✉️ {isNb ? "Du mottar bekreftelse på e-post" : "You'll receive confirmation by email"}</p>
                <p>👤 {isNb ? "En rådgiver ser på saken din" : "An advisor reviews your case"}</p>
                <p>🔔 {isNb ? "Du får beskjed når det er løst" : "You'll be notified when it's resolved"}</p>
              </div>

              <Button
                onClick={handleSubmitEscalation}
                disabled={!contactEmail.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isNb ? "Sender..." : "Sending..."}</>
                ) : (
                  <><ArrowRight className="h-4 w-4 mr-2" />{isNb ? "Send til rådgiver" : "Send to advisor"}</>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "submitted" && (
          <div className="flex flex-col items-center py-8 space-y-4 text-center">
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isNb ? "Registrert!" : "Registered!"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {isNb
                  ? "Vi har mottatt innspillet ditt. En rådgiver følger opp, og du vil få beskjed når det er løst."
                  : "We've received your feedback. An advisor will follow up, and you'll be notified when it's resolved."}
              </p>
            </div>
            <Button onClick={handleClose} variant="outline">
              {isNb ? "Lukk" : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
