import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, ShieldCheck, Trash2, Sparkles } from "lucide-react";
import {
  AREA_LABEL,
  DOC_TYPE_LABEL,
  enrichmentByArea,
  getPartnerEvidence,
  removePartnerEvidence,
  subscribePartnerEvidence,
  type PartnerEvidence,
} from "@/lib/partnerEvidence";
import { PartnerEvidenceUploadDialog } from "./PartnerEvidenceUploadDialog";

interface Props {
  customerId: string;
  partnerName?: string;
  uploaderName?: string;
  /** Hide the internal upload button (use when an external trigger controls the dialog). */
  hideUploadButton?: boolean;
  /** Hide the outer card and header (useful for embedding in other cards). */
  minimal?: boolean;
  /** Controlled open state (optional). When provided, the section uses it instead of internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PartnerEvidenceSection({
  customerId,
  partnerName,
  uploaderName,
  hideUploadButton,
  minimal,
  open: openProp,
  onOpenChange,
}: Props) {
  const [items, setItems] = useState<PartnerEvidence[]>(() => getPartnerEvidence(customerId));
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (o: boolean) => {
    if (onOpenChange) onOpenChange(o);
    else setInternalOpen(o);
  };

  useEffect(() => {
    const refresh = () => setItems(getPartnerEvidence(customerId));
    refresh();
    return subscribePartnerEvidence(refresh);
  }, [customerId]);

  const enrichment = enrichmentByArea(customerId);
  const totalAreas = Object.values(enrichment).filter((v) => v > 0).length;
  const totalDelta = Object.values(enrichment).reduce((s, v) => s + v, 0);

  const content = (
    <div className="space-y-4">
      {!minimal && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground tracking-tight">Partner-bevis</h3>
              <p className="text-sm text-muted-foreground">
                Dokumentasjon du som partner har levert — beriker kundens modenhet
              </p>
            </div>
          </div>
          {!hideUploadButton && (
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              Last opp bevis
            </Button>
          )}
        </div>
      )}

      {/* Enrichment summary */}
      {items.length > 0 && (
        <div className="rounded-lg border border-success/25 bg-success/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            <p className="text-sm font-semibold text-foreground">
              Berikelse fra partner: <span className="text-success">+{totalDelta} prosentpoeng</span> fordelt på {totalAreas} {totalAreas === 1 ? "kontrollområde" : "kontrollområder"}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(AREA_LABEL) as (keyof typeof AREA_LABEL)[]).map((area) => (
              <div key={area} className="rounded-md bg-background/60 border border-border/60 px-2.5 py-1.5">
                <p className="text-[11px] text-muted-foreground truncate">{AREA_LABEL[area]}</p>
                <p className={`text-sm font-semibold ${enrichment[area] > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {enrichment[area] > 0 ? `+${enrichment[area]}%` : "–"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        !hideUploadButton && minimal ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Last opp bevis
          </Button>
        ) : null
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokument</TableHead>
                <TableHead>Regelverk</TableHead>
                <TableHead>Kontroller</TableHead>
                <TableHead>Berikelse</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Av</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((e) => {
                const totalControls = e.frameworks.reduce((s, f) => s + f.controlIds.length, 0);
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{e.fileName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {DOC_TYPE_LABEL[e.docType]}
                            {e.laraVerdict === "accepted" && (
                              <span className="inline-flex items-center gap-0.5 text-primary">
                                <Sparkles className="h-3 w-3" /> Lara-forslag akseptert
                              </span>
                            )}
                            {e.laraVerdict === "manual" && <span>· Justert manuelt</span>}
                            {e.laraVerdict === "declined" && <span>· Manuell vurdering</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm tabular-nums">{totalControls}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {e.maturityDelta.map((d, i) => (
                          <span key={i} className="text-xs text-success font-medium">
                            {AREA_LABEL[d.area]} <span className="font-semibold">+{d.delta}%</span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(e.uploadedAt).toLocaleDateString("nb-NO", { day: "2-digit", month: "short" })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{e.uploadedByName}</p>
                        <p className="text-muted-foreground">{e.uploadedByPartner}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removePartnerEvidence(e.id)}
                        aria-label="Fjern bevis"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PartnerEvidenceUploadDialog
        open={open}
        onOpenChange={setOpen}
        customerId={customerId}
        partnerName={partnerName}
        uploaderName={uploaderName}
      />
    </div>
  );

  if (minimal) return content;

  return (
    <Card className="p-4 space-y-4 border-primary/20 bg-gradient-to-br from-primary/[0.03] via-card to-transparent">
      {content}
    </Card>
  );
}
