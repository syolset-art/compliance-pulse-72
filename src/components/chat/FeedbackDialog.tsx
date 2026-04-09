import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Send, CheckCircle2, UserRound, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackStep = "describe" | "lara-response" | "escalate" | "submitted";

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [step, setStep] = useState<FeedbackStep>("describe");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
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
      setScreenshot(null);
      setScreenshotPreview(null);
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
                  {isNb ? "Skjermbilde (valgfritt)" : "Screenshot (optional)"}
                </label>
                {screenshotPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-48 object-cover" />
                    <button
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground rounded-full p-1 hover:bg-background"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isNb ? "Legg til skjermbilde" : "Add screenshot"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />
                  </label>
                )}
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
                  <><Send className="h-4 w-4 mr-2" />{isNb ? "Send til Lara" : "Send to Lara"}</>
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
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 shrink-0">1</Badge>
                    <span className="text-foreground">
                      {isNb ? "Vi registrerer innspillet ditt i vår backlog" : "We'll register your input in our backlog"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 shrink-0">2</Badge>
                    <span className="text-foreground">
                      {isNb ? "Teamet vårt vurderer og prioriterer" : "Our team evaluates and prioritizes"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 shrink-0">3</Badge>
                    <span className="text-foreground">
                      {isNb ? "Du får beskjed når det er løst (vi bygger løsninger på ~30 min)" : "You'll be notified when it's resolved (we build solutions in ~30 min)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isNb ? "Det holder!" : "That works!"}
                </Button>
                <Button onClick={handleEscalate} variant="secondary" className="flex-1">
                  <UserRound className="h-4 w-4 mr-2" />
                  {isNb ? "Snakk med rådgiver" : "Talk to advisor"}
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
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="navn@firma.no"
                />
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
