import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertTriangle,
  FileUp,
  ShieldCheck,
  Sparkles,
  Paperclip,
  X,
} from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMethod("upload");
      setFile(null);
      setDeclaration("");
      setAccept(false);
    }
  }, [open]);

  if (!framework) return null;

  const cat = getCategoryById(framework.category);
  const CategoryIcon = cat?.icon;

  const evidenceOk =
    method === "upload" ? !!file : declaration.trim().length >= MIN_DECLARATION;
  const canSubmit = evidenceOk && accept;

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Filen er for stor (maks 10 MB)");
      return;
    }
    setFile(f);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(
      method === "upload"
        ? { method, evidenceName: file!.name, evidenceSize: file!.size }
        : { method, declarationText: declaration.trim() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2.5 rounded-xl ${cat?.bgColor || "bg-primary/10"}`}>
              {CategoryIcon && (
                <CategoryIcon className={`h-5 w-5 ${cat?.color || "text-primary"}`} />
              )}
            </div>
            <div>
              {cat && (
                <Badge variant="secondary" className="mb-1 text-[10px]">
                  {cat.name}
                </Badge>
              )}
              <DialogTitle className="text-lg">Bekreft bestilling</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Du er i ferd med å bestille <span className="font-medium text-foreground">{framework.name}</span> for{" "}
            <span className="font-medium text-foreground">{customerName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Commercial warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Bestilling utløser fakturering</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aktivering av regelverk hos kunde faktureres iht. partneravtalen med Mynder.
                Som partner står du ansvarlig for at kunden har godkjent dette.
              </p>
            </div>
          </div>

          {/* Evidence */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Kundens godkjenning</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as "upload" | "declaration")}
              className="space-y-2"
            >
              {/* Upload */}
              <div className={`rounded-lg border p-3 ${method === "upload" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="upload" id="m-upload" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="m-upload" className="text-sm cursor-pointer">
                      Last opp bekreftelse fra kunde
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PDF, bilde eller e-post-eksport som viser at kunden har godkjent aktiveringen.
                    </p>
                    {method === "upload" && (
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.eml,.msg,.txt"
                          className="hidden"
                          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                        />
                        {file ? (
                          <div className="flex items-center gap-2 p-2 rounded-md bg-background border text-xs">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-muted-foreground">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setFile(null)}
                            >
                              <X className="h-3.5 w-3.5" />
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
                </div>
              </div>

              {/* Declaration */}
              <div className={`rounded-lg border p-3 ${method === "declaration" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="declaration" id="m-decl" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="m-decl" className="text-sm cursor-pointer">
                      Jeg bekrefter på vegne av kunden
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Beskriv kort hvordan kunden har godkjent (møte, e-post, avtale).
                    </p>
                    {method === "declaration" && (
                      <div className="mt-2">
                        <Textarea
                          value={declaration}
                          onChange={(e) => setDeclaration(e.target.value)}
                          placeholder="F.eks. Godkjent i statusmøte 12. mai med daglig leder Ola Nordmann…"
                          rows={3}
                          maxLength={500}
                        />
                        <p className={`text-[11px] mt-1 ${declaration.trim().length >= MIN_DECLARATION ? "text-muted-foreground" : "text-warning"}`}>
                          {declaration.trim().length}/{MIN_DECLARATION} tegn minimum
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Acceptance */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Checkbox
              id="accept"
              checked={accept}
              onCheckedChange={(v) => setAccept(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="accept" className="text-xs leading-relaxed cursor-pointer">
              Jeg bekrefter at kunden har godkjent aktiveringen, at jeg som partner er
              ansvarlig iht. partneravtalen med Mynder, og at denne bestillingen utløser
              fakturering.
            </Label>
          </div>

          {/* Lara hint */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span>
              Etter bestilling hjelper Lara kunden i gang med å etablere baseline for{" "}
              {framework.name}.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Bestill regelverk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
