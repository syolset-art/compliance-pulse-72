import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { PartnerBranding } from "@/hooks/usePartnerBranding";
import type { PartnerTaxSettings } from "@/lib/partnerTax";
import {
  buildInvoiceBasisCsv,
  downloadCsv,
  generateInvoiceBasisPdf,
  invoiceBasisFileName,
  type InvoiceBasisRow,
} from "./generateInvoiceBasisPdf";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rows: InvoiceBasisRow[];
  branding: PartnerBranding;
  tax: PartnerTaxSettings;
  periodLabel: string;
}

export function ExportInvoiceBasisDialog({ open, onOpenChange, rows, branding, tax, periodLabel }: Props) {
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const input = { rows, branding, tax, periodLabel };
      if (format === "pdf") {
        await generateInvoiceBasisPdf(input);
        toast.success(`Lastet ned ${invoiceBasisFileName(periodLabel, "pdf")}`);
      } else {
        downloadCsv(buildInvoiceBasisCsv(input), invoiceBasisFileName(periodLabel, "csv"));
        toast.success(`Lastet ned ${invoiceBasisFileName(periodLabel, "csv")}`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Eksporten feilet. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Eksporter fakturagrunnlag</DialogTitle>
          <DialogDescription>
            {periodLabel} · {rows.length} {rows.length === 1 ? "kunde" : "kunder"}
          </DialogDescription>
        </DialogHeader>

        {/* Forhåndsvisning av brevhodet */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.name || "Partner"} logo`}
                  className="h-9 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                  {(branding.name || "P").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {branding.name || "Partner"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {[branding.orgNumber ? `Org.nr ${branding.orgNumber}` : "", branding.domain]
                    .filter(Boolean)
                    .join("  •  ") || "Legg inn org.nr og webadresse i innstillinger"}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-foreground">Fakturagrunnlag</div>
              <div className="text-[11px] text-muted-foreground">{periodLabel}</div>
            </div>
          </div>
          {!branding.logoUrl && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Ingen logo lagt inn.{" "}
              <Link to="/msp-billing" className="underline underline-offset-2 hover:text-foreground">
                Legg til logo i innstillinger
              </Link>
            </p>
          )}
        </div>

        <RadioGroup value={format} onValueChange={(v) => setFormat(v as "pdf" | "csv")} className="gap-2">
          <Label
            htmlFor="fmt-pdf"
            className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40"
          >
            <RadioGroupItem value="pdf" id="fmt-pdf" />
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">PDF med din merking</span>
          </Label>
          <Label
            htmlFor="fmt-csv"
            className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40"
          >
            <RadioGroupItem value="csv" id="fmt-csv" />
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">CSV for regnskapssystem</span>
          </Label>
        </RadioGroup>

        <p className="text-[11px] text-muted-foreground">
          Generert i Mynder — nevnt diskret i bunnteksten på PDF-en.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Avbryt
          </Button>
          <Button onClick={handleExport} disabled={busy || rows.length === 0} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Eksporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
