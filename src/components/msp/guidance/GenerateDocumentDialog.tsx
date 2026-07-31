import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Download, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addPartnerEvidence } from "@/lib/partnerEvidence";
import { logPartnerActivity } from "@/lib/partnerActivityLog";
import {
  formatHours,
  formatPriceRange,
  type DocumentDeliverable,
} from "@/lib/documentDeliverables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName?: string;
  frameworkId: string;
  frameworkLabel: string;
  deliverable: DocumentDeliverable | null;
  currency: string;
  industry?: string;
  businessDescription?: string;
}

export function GenerateDocumentDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  frameworkId,
  frameworkLabel,
  deliverable,
  currency,
  industry,
  businessDescription,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setContent(null);
    setSaved(false);
    setLoading(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const generate = async () => {
    if (!deliverable) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-compliance-document", {
        body: {
          documentName: deliverable.name,
          frameworkLabel,
          articleLabel: deliverable.articleLabel,
          areaTitle: deliverable.areaTitle,
          customerName,
          industry,
          businessDescription,
        },
      });
      if (error) throw error;
      if (!data?.content) throw new Error("Tomt svar fra Lara");
      setContent(data.content as string);
      logPartnerActivity(
        customerId,
        "lara_recommendation_requested",
        `Utkast generert: ${deliverable.name}`,
        `${frameworkLabel} · ${deliverable.articleLabel}`,
      );
    } catch (e) {
      console.error("generate-compliance-document feilet:", e);
      toast.error("Kunne ikke generere utkast", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!content || !deliverable) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deliverable.name.replace(/[^\wæøåÆØÅ ]+/g, "").trim()} – utkast.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsEvidence = () => {
    if (!content || !deliverable) return;
    addPartnerEvidence({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customerId,
      fileName: `${deliverable.name} (utkast).md`,
      docType: "other",
      note: `AI-utkast generert for ${frameworkLabel} · ${deliverable.articleLabel}. Må kvalitetssikres av partner.`,
      uploadedAt: new Date().toISOString(),
      uploadedByName: "Lara (utkast)",
      uploadedByPartner: "",
      frameworks: [
        {
          framework: frameworkId,
          label: frameworkLabel,
          controlIds: [deliverable.articleLabel],
        },
      ],
      maturityDelta: [],
      laraVerdict: "manual",
    });
    logPartnerActivity(
      customerId,
      "evidence_uploaded",
      `Dokumentutkast lagret: ${deliverable.name}`,
      `${frameworkLabel} · leveranse ${formatPriceRange(deliverable.price, currency)} eks. mva`,
    );
    setSaved(true);
    toast.success("Utkastet er lagret som leveranse på kunden");
  };

  if (!deliverable) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {deliverable.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {frameworkLabel} · {deliverable.articleLabel} · {deliverable.areaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Fakturerbar leveranse</span>
              <span className="font-medium tabular-nums">
                {formatPriceRange(deliverable.price, currency)}{" "}
                <span className="text-xs font-normal text-muted-foreground">eks. mva</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Estimat uten AI-hjelp</span>
              <span className="tabular-nums">{formatHours(deliverable.profile.hours)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lara lager førsteutkastet — du kvalitetssikrer og fakturerer leveransen som normalt.
            </p>
          </div>

          {!content && (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Grunnlag Lara bruker</p>
              <ul className="space-y-1">
                <li>Kunde: {customerName ?? "—"}</li>
                <li>Bransje: {industry ?? "Ikke registrert"}</li>
                <li>Regelverk og kravreferanse: {frameworkLabel} · {deliverable.articleLabel}</li>
                <li>Kontrollområde: {deliverable.areaTitle}</li>
              </ul>
            </div>
          )}

          {content && (
            <>
              <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground">
                  AI-utkast — må kvalitetssikres av partner før levering til kunden.
                </p>
              </div>
              <Separator />
              <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-background p-3">
                <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground font-sans">
                  {content}
                </pre>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!content ? (
            <Button onClick={generate} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Lara skriver utkast…" : "Generer utkast"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={download} className="gap-2">
                <Download className="h-4 w-4" />
                Last ned
              </Button>
              <Button onClick={saveAsEvidence} disabled={saved} className="gap-2">
                {saved ? <Check className="h-4 w-4" /> : null}
                {saved ? "Lagret på kunden" : "Lagre som leveranse"}
              </Button>
            </>
          )}
        </DialogFooter>

        {content && (
          <Badge variant="outline" className="w-fit text-[10px] font-normal">
            Kilde: Lara · {new Date().toLocaleDateString("nb-NO")}
          </Badge>
        )}
      </DialogContent>
    </Dialog>
  );
}
