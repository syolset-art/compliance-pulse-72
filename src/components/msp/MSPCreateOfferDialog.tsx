import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, FileText, Eye, Sparkles, ArrowLeft, Download, Save, FileCheck2, CheckCircle2, Inbox, Send, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";
import jsPDF from "jspdf";
import type { TaskEstimate, TaskOwner } from "./MSPMaturityServiceMatrix";

export interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domainName?: string;
  serviceTitle?: string;
  variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  partnerName?: string;
  customerContactName?: string;
  defaultTasks?: TaskEstimate[];
  hourlyRate?: number;
  defaultMessage?: string;
  attachGap?: boolean;
  gapFrameworkId?: string;
}

interface EditableTask extends TaskEstimate {
  owner: TaskOwner;
}

export function MSPCreateOfferDialog({
  open,
  onOpenChange,
  domainName = "tjenesten",
  serviceTitle,
  variant = "Tjeneste",
  partnerName = "Dintero AS",
  customerContactName = "Truls",
  defaultTasks,
  hourlyRate = 1500,
  defaultMessage,
  attachGap: attachGapProp = true,
  gapFrameworkId,
}: CreateOfferDialogProps) {
  const [tasks, setTasks] = useState<EditableTask[]>(
    (defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner" })),
  );
  const [message, setMessage] = useState(defaultMessage || "");
  const [attachGap, setAttachGap] = useState(attachGapProp);
  const [gapPreviewOpen, setGapPreviewOpen] = useState(false);
  const [view, setView] = useState<"edit" | "preview" | "saved">("edit");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTasks((defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner" })));
    setMessage(defaultMessage || "");
    setAttachGap(attachGapProp);
    setView("edit");
    setSavedAt(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const totalPrice = totalHours * hourlyRate;

  const updateTask = (i: number, patch: Partial<EditableTask>) => {
    setTasks(p => p.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };
  const removeTask = (i: number) => setTasks(p => p.filter((_, idx) => idx !== i));
  const addTask = () =>
    setTasks(p => [...p, { label: "Ny oppgave", hours: 8, owner: "Partner", weeks: "" }]);

  const offerName = serviceTitle || domainName;
  const gapCount = 9; // demo
  const offerNumber = `T-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const todayLabel = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  const handleGenerate = () => {
    if (tasks.length === 0) {
      toast.error("Kan ikke generere tilbud", { description: "Legg til minst én oppgave først." });
      return;
    }
    setView("preview");
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = margin;

    // Header
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(partnerName, margin, y);
    doc.text(`Tilbud ${offerNumber}`, pageWidth - margin, y, { align: "right" });
    y += 14;
    doc.text(todayLabel, pageWidth - margin, y, { align: "right" });
    y += 28;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(20);
    doc.text(offerName, margin, y);
    y += 22;
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(`Til: ${customerContactName}`, margin, y);
    y += 24;

    // Intro
    if (message.trim()) {
      doc.setFontSize(11);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(message.trim(), pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 12;
    }

    // Activities header
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("OPPGAVE", margin, y);
    doc.text("TIMER", pageWidth - margin - 90, y, { align: "right" });
    doc.text("BELØP", pageWidth - margin, y, { align: "right" });
    y += 8;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFontSize(11);
    doc.setTextColor(30);
    tasks.forEach(t => {
      const hours = Number(t.hours) || 0;
      const price = hours * hourlyRate;
      const labelLines = doc.splitTextToSize(t.label, pageWidth - margin * 2 - 200);
      doc.text(labelLines, margin, y);
      doc.text(String(hours), pageWidth - margin - 90, y, { align: "right" });
      doc.text(`${price.toLocaleString("nb-NO")} kr`, pageWidth - margin, y, { align: "right" });
      y += labelLines.length * 14 + 4;
      if (t.note) {
        doc.setFontSize(9);
        doc.setTextColor(140);
        const noteLines = doc.splitTextToSize(t.note, pageWidth - margin * 2 - 200);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 11 + 4;
        doc.setFontSize(11);
        doc.setTextColor(30);
      }
      if (y > 760) { doc.addPage(); y = margin; }
    });

    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    // Totals
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(`Timepris: ${hourlyRate.toLocaleString("nb-NO")} kr`, margin, y);
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`Sum: ${totalHours} t · ${totalPrice.toLocaleString("nb-NO")} kr`, pageWidth - margin, y, { align: "right" });
    y += 28;

    // Attachment
    if (attachGap && gapFrameworkId) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("VEDLEGG", margin, y);
      y += 14;
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(`• Gap-analyse ${gapFrameworkId.toUpperCase()} (${gapCount} gap dokumentert)`, margin, y);
      y += 20;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`${partnerName} · Tilbud ${offerNumber} · ${todayLabel}`, margin, 820);

    doc.save(`Tilbud_${offerNumber}_${offerName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Tilbud lastet ned", { description: `${offerNumber}.pdf` });
  };

  const handleSaveOffer = () => {
    setSavedAt(new Date().toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    setView("saved");
    toast.success("Tilbud lagret", {
      description: `${offerNumber} er lagret under kundens tilbud.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-border space-y-1.5">
          <div className="flex items-center gap-2">
            {view === "edit" ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Utkast fra Lara
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] gap-1">
                <Eye className="h-2.5 w-2.5" /> Forhåndsvisning · slik ser kunden tilbudet
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{partnerName}</span>
          </div>
          <DialogTitle className="text-lg">{offerName}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {view === "edit"
              ? "Juster oppgaver og timer. Du genererer et tilbudsdokument du selv kan laste ned og sende fra ditt eget tilbudssystem."
              : "Last ned som PDF for å sende via ditt eget tilbudssystem, eller lagre tilbudet på kunden."}
          </DialogDescription>
        </DialogHeader>

        {view === "edit" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Lara intro */}
            <div className="flex items-start gap-2.5 rounded-md border border-primary/30 bg-primary/5 p-3">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[12px] text-foreground leading-snug">
                Jeg har satt opp et standardløp basert på din tjenestekatalog. Juster timene og generer et tilbudsdokument du kan laste ned.
              </p>
            </div>

            {/* Aktiviteter */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Aktiviteter</Label>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  <span>Oppgave</span>
                  <span className="text-right">Timer</span>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {tasks.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 items-center">
                      <div className="min-w-0">
                        <Input
                          value={t.label}
                          onChange={e => updateTask(i, { label: e.target.value })}
                          className="h-7 text-[13px] font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                        {t.note && <p className="text-[11px] text-muted-foreground -mt-0.5">{t.note}</p>}
                      </div>
                      <Input
                        type="number"
                        value={t.hours}
                        onChange={e => updateTask(i, { hours: Number(e.target.value) })}
                        className="h-7 text-[13px] text-right tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(i)}
                        className="text-muted-foreground hover:text-destructive flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed gap-1 text-muted-foreground"
                onClick={addTask}
              >
                <Plus className="h-3 w-3" /> Legg til oppgave
              </Button>

              <div className="flex items-baseline justify-between pt-2 px-1">
                <span className="text-[12px] text-muted-foreground">Timepris {hourlyRate.toLocaleString("nb-NO")} kr</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {totalHours} timer · {totalPrice.toLocaleString("nb-NO")} kr
                </span>
              </div>
            </div>

            {/* Vedlegg */}
            {gapFrameworkId && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Vedlegg</Label>
                <div className={`rounded-md border p-3 transition-colors ${attachGap ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          Gap-analyse {gapFrameworkId.toUpperCase()}
                        </p>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">Anbefalt</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{gapCount} gap dokumentert</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary" onClick={() => setGapPreviewOpen(true)}>
                      <Eye className="h-3 w-3" /> Forhåndsvis
                    </Button>
                    <Switch checked={attachGap} onCheckedChange={setAttachGap} />
                  </div>
                </div>
              </div>
            )}

            {/* Intro/melding i tilbudsdokumentet */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Innledning i tilbudet (valgfritt)
              </Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder={`Hei ${customerContactName}, basert på modenhetsbildet ditt foreslår vi følgende løp.`}
                className="text-[13px] resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Denne teksten vises øverst i tilbudsdokumentet. Tilbudet sendes ikke automatisk — du laster det ned og sender selv.
              </p>
            </div>
          </div>
        )}

        {view === "preview" && (
          <div className="flex-1 overflow-y-auto p-5 bg-muted/30">
            {/* Paper-like preview */}
            <div className="mx-auto bg-background border border-border rounded-md shadow-sm p-8 max-w-xl space-y-5">
              <div className="flex items-start justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{partnerName}</span>
                <div className="text-right">
                  <div>Tilbud <span className="tabular-nums">{offerNumber}</span></div>
                  <div>{todayLabel}</div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">{offerName}</h2>
                <p className="text-[12px] text-muted-foreground mt-1">Til: {customerContactName}</p>
              </div>

              {message.trim() && (
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{message.trim()}</p>
              )}

              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_70px_100px] gap-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold border-b border-border pb-1.5">
                  <span>Oppgave</span>
                  <span className="text-right">Timer</span>
                  <span className="text-right">Beløp</span>
                </div>
                {tasks.map((t, i) => {
                  const hrs = Number(t.hours) || 0;
                  return (
                    <div key={i} className="grid grid-cols-[1fr_70px_100px] gap-3 text-[13px] py-1 border-b border-border/50">
                      <div>
                        <p className="text-foreground">{t.label}</p>
                        {t.note && <p className="text-[11px] text-muted-foreground">{t.note}</p>}
                      </div>
                      <span className="text-right tabular-nums text-foreground">{hrs}</span>
                      <span className="text-right tabular-nums text-foreground">{(hrs * hourlyRate).toLocaleString("nb-NO")} kr</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <span className="text-[12px] text-muted-foreground">Timepris {hourlyRate.toLocaleString("nb-NO")} kr</span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {totalHours} t · {totalPrice.toLocaleString("nb-NO")} kr
                </span>
              </div>

              {attachGap && gapFrameworkId && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Vedlegg</p>
                  <div className="flex items-center gap-2 text-[12px] text-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Gap-analyse {gapFrameworkId.toUpperCase()} · {gapCount} gap dokumentert
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground pt-4 border-t border-border">
                {partnerName} · Tilbud {offerNumber} · {todayLabel}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          {view === "edit" ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button size="sm" onClick={handleGenerate} className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Generer tilbud
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setView("edit")} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Tilbake til redigering
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Last ned PDF
                </Button>
                <Button size="sm" onClick={handleSaveOffer} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Lagre tilbud
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <MSPGapAnalysisDialog
        open={gapPreviewOpen}
        onOpenChange={setGapPreviewOpen}
        customerName={customerContactName}
        initialFrameworkId={gapFrameworkId}
      />
    </Dialog>
  );
}
