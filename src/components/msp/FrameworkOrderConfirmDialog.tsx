import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Paperclip, X, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type Framework } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";

export interface FrameworkOrderResult {
  method: "upload" | "declaration";
  evidenceName?: string;
  evidenceSize?: number;
  declarationText?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
  customerName: string;
  onConfirm: (result: FrameworkOrderResult) => void;
}

const MIN_DECLARATION = 20;

export function FrameworkOrderConfirmDialog({
  open,
  onOpenChange,
  framework,
  customerName,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<"upload" | "declaration">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [declaration, setDeclaration] = useState("");
  const [accept, setAccept] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { current: currentTerms, hasAcceptedCurrent, acceptTerms } = useTerms();
  const termsOk = termsChecked || hasAcceptedCurrent;

  useEffect(() => {
    if (open) {
      setMethod("upload");
      setFile(null);
      setDeclaration("");
      setAccept(false);
      setTermsChecked(false);
    }
  }, [open]);

  if (!framework) return null;

  const evidenceOk =
    method === "upload" ? !!file : declaration.trim().length >= MIN_DECLARATION;
  const canSubmit = evidenceOk && accept && termsOk;

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Filen er for stor (maks 10 MB)");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await acceptTerms("framework_activation", framework.id);
    onConfirm(
      method === "upload"
        ? { method, evidenceName: file!.name, evidenceSize: file!.size }
        : { method, declarationText: declaration.trim() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bestill {framework.name}</DialogTitle>
          <DialogDescription>
            Faktureres iht. partneravtalen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Kundens godkjenning</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as "upload" | "declaration")}
              className="space-y-2"
            >
              <div className={`rounded-lg border p-3 ${method === "upload" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="upload" id="m-upload" />
                  <Label htmlFor="m-upload" className="text-sm cursor-pointer">
                    Last opp bekreftelse
                  </Label>
                </div>
                {method === "upload" && (
                  <div className="mt-2 pl-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.eml,.msg,.txt"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-background border text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4" />
                        Velg fil
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className={`rounded-lg border p-3 ${method === "declaration" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="declaration" id="m-decl" />
                  <Label htmlFor="m-decl" className="text-sm cursor-pointer">
                    Bekreft på vegne av kunden
                  </Label>
                </div>
                {method === "declaration" && (
                  <div className="mt-2 pl-6">
                    <Textarea
                      value={declaration}
                      onChange={(e) => setDeclaration(e.target.value)}
                      placeholder="Kort beskrivelse av godkjenningen…"
                      rows={2}
                      maxLength={500}
                      className="text-sm"
                    />
                    <p className={`text-sm mt-1 ${declaration.trim().length >= MIN_DECLARATION ? "text-muted-foreground" : "text-warning"}`}>
                      {declaration.trim().length}/{MIN_DECLARATION}
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="accept"
              checked={accept}
              onCheckedChange={(v) => setAccept(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
              Kunden har godkjent. Jeg er ansvarlig som partner.
            </Label>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-4 w-4" />
              Mer om bestilling og ansvar
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-1.5 pl-5">
              <p>Aktivering av regelverk faktureres iht. partneravtalen med Mynder.</p>
              <p>Som partner står du ansvarlig for at kunden har godkjent aktiveringen. Bekreftelsen lagres som dokumentasjon.</p>
            </CollapsibleContent>
          </Collapsible>

          <TermsAcceptRow
            id="terms-framework-order"
            checked={termsOk}
            onCheckedChange={setTermsChecked}
            version={currentTerms?.version}
          />

        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Bestill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
