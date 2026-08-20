import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, X, Download, Shield, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

interface InboxPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  assetName: string;
  isNb: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function InboxPreviewDialog({ open, onOpenChange, item, assetName, isNb, onApprove, onReject }: InboxPreviewDialogProps) {
  if (!item) return null;
  const locale = isNb ? "nb-NO" : "en-US";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                {item.file_name || item.subject}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Fra {item.sender_name || item.sender_email} · Mottatt {new Date(item.received_at).toLocaleDateString(locale)}
              </DialogDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 mr-8" onClick={() => toast.success("Demo: Last ned dokument")}>
              <Download className="h-3.5 w-3.5" /> Last ned
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-3 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2.5">
            <img src={laraButterfly} alt="Lara" className="h-5 w-5" />
            <div className="flex-1 text-xs">
              <span className="font-medium">Lara har analysert dokumentet:</span>{" "}
              Identifisert som <Badge variant="secondary" className="text-[13px] mx-0.5">{DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type}</Badge>
              for <span className="font-semibold">{assetName}</span>
            </div>
            {item.confidence_score && (
              <Badge className="bg-status-closed/15 text-status-closed border-status-closed/30 text-[13px]">
                {Math.round(item.confidence_score * 100)}% sikker
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[55vh]">
          <div className="px-10 py-10 bg-muted/30">
            <div className="bg-white shadow-sm border border-border rounded-md p-10 mx-auto max-w-2xl text-foreground">
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.sender_name || "Leverandør"}</p>
                    <p className="text-[12px] text-muted-foreground">{item.sender_email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[12px]">CONFIDENTIAL</Badge>
              </div>

              <div className="mt-8 space-y-1">
                <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
                  {DOC_TYPE_LABELS[item.matched_document_type] || "Dokument"}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">
                  {item.file_name?.replace(/\.[^.]+$/, "") || item.subject}
                </h1>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Utstedt</p>
                    <p className="font-medium">{new Date(item.received_at).toLocaleDateString(locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Utstedt for</p>
                    <p className="font-medium">{assetName}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm leading-relaxed">
                <h2 className="text-base font-semibold">1. Sammendrag</h2>
                <p className="text-muted-foreground">
                  Dette dokumentet bekrefter at <span className="font-medium text-foreground">{item.sender_name || "leverandøren"}</span> oppfyller
                  de relevante kravene knyttet til informasjonssikkerhet, personvern og operasjonell motstandsdyktighet.
                  Dokumentet er utarbeidet i samsvar med gjeldende standarder og inngår som del av leverandørens kontinuerlige etterlevelse.
                </p>

                <h2 className="text-base font-semibold">2. Omfang</h2>
                <p className="text-muted-foreground">
                  Vurderingen omfatter alle tjenester levert til kunden, inkludert databehandling, drift, tilgangskontroll og
                  hendelseshåndtering. Kontroller er testet i perioden og funnet å fungere effektivt.
                </p>

                <h2 className="text-base font-semibold">3. Konklusjon</h2>
                <p className="text-muted-foreground">
                  Basert på utført gjennomgang er det vår vurdering at kontrollene er hensiktsmessig utformet og operativt effektive.
                  Det er ikke avdekket vesentlige avvik som krever umiddelbar oppfølging.
                </p>

                <div className="mt-8 pt-6 border-t border-border flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Signert av</p>
                    <p className="font-serif italic text-lg mt-1">{item.sender_name || "Compliance Officer"}</p>
                    <p className="text-[12px] text-muted-foreground">{item.sender_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Dokument-ID</p>
                    <p className="text-xs font-mono">{item.id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-muted-foreground mt-10 pt-4 border-t border-border">
                — Side 1 av 1 — Demo-forhåndsvisning —
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-3 border-t bg-background flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Godkjenn for å berike trust score til {assetName}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onReject}>
              <X className="h-3.5 w-3.5 mr-1" /> Avvis
            </Button>
            <Button size="sm" onClick={onApprove}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Godkjenn og berik trust score
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
