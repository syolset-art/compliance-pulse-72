import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, FileText, Eye, Sparkles, ArrowLeft, Download, Save, CheckCircle2, Inbox, Send, ClipboardList, ArrowRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { toast } from "sonner";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";
import jsPDF from "jspdf";
import type { TaskEstimate, TaskOwner } from "./MSPMaturityServiceMatrix";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { getRelatedControls } from "@/lib/controlCrosswalk";
import { getFrameworkGap, getGapIdsForControls, severityDotClass, SEVERITY_LABEL, type GapItem } from "@/lib/gapData";
import { getControlLabel } from "@/lib/serviceControlLabels";
import { Link2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeTaxBreakdown, formatTaxNote } from "@/lib/partnerTax";
import { saveOffer as persistOffer } from "@/lib/customerOffers";

/** Ett "ark" i tilbudsdokumentet — brukes for side 1, side 2 og vedlegget. */
function OfferSheet({
  page,
  total,
  footer,
  children,
}: {
  page: number;
  total: number;
  footer: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl bg-background border border-border rounded-md shadow-sm p-8 space-y-5">
      {children}
      <div className="flex items-baseline justify-between gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{footer}</span>
        <span className="shrink-0 tabular-nums">Side {page} av {total}</span>
      </div>
    </div>
  );
}

/** Fordeler gap på oppgaver ut fra tekstlikhet (Lara-forslag i prototypen). */
function autoAssignGaps(taskLabels: string[], gaps: GapItem[], gapIds: string[]): string[][] {
  const result = taskLabels.map(() => [] as string[]);
  if (taskLabels.length === 0) return result;
  const norm = (s: string) => s.toLowerCase();
  const deliveryIdx = taskLabels.findIndex(l => /leveran|gjennomfør|implement|tiltak|utfør/i.test(l));
  const fallback = deliveryIdx >= 0 ? deliveryIdx : Math.min(1, taskLabels.length - 1);
  for (const id of gapIds) {
    const gap = gaps.find(g => g.id === id);
    if (!gap) continue;
    let best = -1;
    let bestScore = 0;
    taskLabels.forEach((label, i) => {
      const l = norm(label);
      let score = 0;
      if (gap.domain && l.includes(norm(gap.domain))) score += 3;
      const words = norm(gap.title).split(/[^a-zæøå]+/).filter(w => w.length > 5);
      score += words.filter(w => l.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    result[best >= 0 ? best : fallback].push(id);
  }
  return result;
}

export interface CoveredControlGroup {

  frameworkId: string;
  frameworkLabel: string;
  controlIds: string[];
}

export interface CoveredGapsSpec {
  /** Regelverk dette tilbudet bygger på. */
  frameworkId: string;
  frameworkLabel: string;
  /** Kontroll-id-er fra tjenestekatalogen som forhåndsvelger relaterte gap. Hvis tom, ingen gap er forhåndsvalgt. */
  preselectedControlIds?: string[];
  /** Eksplisitt liste over gap-id-er som er forhåndsvalgt (overstyrer preselectedControlIds). */
  preselectedGapIds?: string[];
}

export interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domainName?: string;
  serviceTitle?: string;
  variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  partnerName?: string;
  /** Overstyrer auto-hentet org.nr fra partnerbranding. */
  partnerOrgNumber?: string;
  /** Overstyrer auto-hentet logo (PNG/JPEG dataURL). */
  partnerLogoDataUrl?: string;
  customerContactName?: string;
  defaultTasks?: TaskEstimate[];
  hourlyRate?: number;
  defaultMessage?: string;
  attachGap?: boolean;
  gapFrameworkId?: string;
  /** Kontrollpunkter denne leveransen dekker (vises i edit, preview og PDF). */
  coveredControls?: CoveredControlGroup[];
  /** Gap fra gap-analysen som tilbudet lukker. Når satt, erstatter den den statiske coveredControls-visningen. */
  coveredGaps?: CoveredGapsSpec;
  /** Hvilken visning dialogen åpner i. Default "edit". Bruk "preview" for å vise lagrede tilbud. */
  initialView?: "edit" | "preview";
  /** Kunde som tilbudet skal registreres på. */
  customerId?: string;
  customerName?: string;
  /** Kilde-nøkler for tjenester som inngår i tilbudet — brukes til å låse dem i tjenestekatalogen. */
  offeredTemplateIds?: string[];
  offeredServiceNames?: string[];
  /** Regelverk kunden har aktivert (id eller label) — styrer dekningsvisningen. */
  activeFrameworks?: string[];
}

interface EditableTask extends TaskEstimate {
  owner: TaskOwner;
  /** Gap fra gap-analysen som denne oppgaven lukker. */
  gapIds: string[];
}


export function MSPCreateOfferDialog({
  open,
  onOpenChange,
  domainName = "tjenesten",
  serviceTitle,
  variant = "Tjeneste",
  partnerName,
  partnerOrgNumber,
  partnerLogoDataUrl,
  customerContactName = "Truls",
  defaultTasks,
  hourlyRate = 1500,
  defaultMessage,
  attachGap: attachGapProp = true,
  gapFrameworkId,
  coveredControls,
  coveredGaps,
  initialView = "edit",
  customerId,
  customerName,
  offeredTemplateIds,
  offeredServiceNames,
}: CreateOfferDialogProps) {
  const { branding } = usePartnerBranding();
  const effectivePartnerName = partnerName ?? branding.name;
  const effectiveOrgNumber = partnerOrgNumber ?? branding.orgNumber;
  const effectiveLogo = partnerLogoDataUrl ?? branding.logoDataUrl ?? null;

  // Bygg gap-snapshot: hent alle gap for regelverket, og forhåndsvelg de som matcher tjenestens kontroller.
  const frameworkGap = coveredGaps ? getFrameworkGap(coveredGaps.frameworkId) : undefined;
  const gapList: GapItem[] = frameworkGap?.gaps ?? [];
  const defaultSelectedGapIds = useMemo(() => {
    if (!coveredGaps) return [] as string[];
    if (coveredGaps.preselectedGapIds && coveredGaps.preselectedGapIds.length > 0) {
      return coveredGaps.preselectedGapIds;
    }
    if (coveredGaps.preselectedControlIds && coveredGaps.preselectedControlIds.length > 0) {
      return getGapIdsForControls(coveredGaps.frameworkId, coveredGaps.preselectedControlIds);
    }
    return [];
  }, [coveredGaps]);

  // Fallback: gammel statisk visning når coveredGaps ikke er satt.
  const safeCoveredControls = (coveredControls ?? []).filter(g => g.controlIds.length > 0);

  const [tasks, setTasks] = useState<EditableTask[]>(
    (defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner", gapIds: [] })),
  );
  const [message, setMessage] = useState(defaultMessage || "");
  const [attachGap, setAttachGap] = useState(attachGapProp);
  const [showGapsInOffer, setShowGapsInOffer] = useState(false);
  const [gapPreviewOpen, setGapPreviewOpen] = useState(false);
  const [gapsExpanded, setGapsExpanded] = useState(false);
  const [view, setView] = useState<"edit" | "preview" | "saved">(initialView);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [editableHourlyRate, setEditableHourlyRate] = useState(hourlyRate);

  // Frys et øyeblikksbilde-dato når dialogen åpnes (vises i alle visninger + PDF).
  const [snapshotDate, setSnapshotDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!open) return;
    const base = (defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner", gapIds: [] as string[] }));
    const assigned = autoAssignGaps(base.map(t => t.label), gapList, defaultSelectedGapIds);
    setTasks(base.map((t, i) => ({ ...t, gapIds: assigned[i] ?? [] })));
    setMessage(defaultMessage || "");
    setAttachGap(attachGapProp);
    setShowGapsInOffer(true);
    setGapsExpanded(false);
    setView(initialView);
    setSavedAt(null);
    setEditableHourlyRate(hourlyRate);
    setSnapshotDate(new Date());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const totalPrice = totalHours * editableHourlyRate;
  const tax = branding.tax;
  const taxBreakdown = computeTaxBreakdown(totalPrice, tax);
  const showTax = tax.enabled && tax.rate > 0;
  const fmtKr = (n: number) => `${n.toLocaleString("nb-NO")} kr`;

  const updateTask = (i: number, patch: Partial<EditableTask>) => {
    setTasks(p => p.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };
  const removeTask = (i: number) => setTasks(p => p.filter((_, idx) => idx !== i));
  const addTask = () =>
    setTasks(p => [...p, { label: "Ny oppgave", hours: 8, owner: "Partner", weeks: "", gapIds: [] }]);

  const offerName = serviceTitle || domainName;
  const offerNumber = `T-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const todayLabel = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  const snapshotLabel = snapshotDate.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  // Gap-statistikk og sorteringsrekkefølge (kritiske først)
  const severityRank: Record<GapItem["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedGaps = [...gapList].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  /** Et gap regnes som dekket når minst én oppgave er koblet til det. */
  const selectedGapIds = useMemo(() => new Set(tasks.flatMap(t => t.gapIds ?? [])), [tasks]);
  const selectedCount = sortedGaps.filter(g => selectedGapIds.has(g.id)).length;
  const totalGapCount = sortedGaps.length;
  const criticalSelected = sortedGaps.filter(g => selectedGapIds.has(g.id) && g.severity === "critical").length;
  const gapCount = totalGapCount > 0 ? totalGapCount : 9;
  const gapPercent = totalGapCount > 0 ? Math.round((selectedCount / totalGapCount) * 100) : 0;

  /** Kobler/frakobler et gap på en bestemt oppgave. */
  const toggleGapOnTask = (taskIndex: number, gapId: string) => {
    setTasks(p =>
      p.map((t, i) => {
        if (i !== taskIndex) return t;
        const has = (t.gapIds ?? []).includes(gapId);
        return { ...t, gapIds: has ? t.gapIds.filter(id => id !== gapId) : [...(t.gapIds ?? []), gapId] };
      }),
    );
  };

  /** Av/på fra den samlede mangellisten: på = koble til best matchende oppgave, av = fjern overalt. */
  const toggleGap = (id: string) => {
    setTasks(p => {
      if (p.some(t => (t.gapIds ?? []).includes(id))) {
        return p.map(t => ({ ...t, gapIds: (t.gapIds ?? []).filter(g => g !== id) }));
      }
      const assigned = autoAssignGaps(p.map(t => t.label), gapList, [id]);
      return p.map((t, i) => ({ ...t, gapIds: [...(t.gapIds ?? []), ...(assigned[i] ?? [])] }));
    });
  };

  /** Velg alle / fjern alle gap. */
  const setAllGaps = (select: boolean) => {
    setTasks(p => {
      if (!select) return p.map(t => ({ ...t, gapIds: [] }));
      const assigned = autoAssignGaps(p.map(t => t.label), gapList, sortedGaps.map(g => g.id));
      return p.map((t, i) => ({ ...t, gapIds: assigned[i] ?? [] }));
    });
  };


  // Samle cross-walk refs fra valgte gap (én chip per regelverk/kontroll)
  const crosswalkChips = useMemo(() => {
    if (!coveredGaps) return [] as { frameworkId: string; frameworkLabel: string; controlId: string }[];
    const seen = new Set<string>();
    const out: { frameworkId: string; frameworkLabel: string; controlId: string }[] = [];
    for (const g of sortedGaps) {
      if (!selectedGapIds.has(g.id)) continue;
      for (const cid of g.relatedControlIds) {
        const related = getRelatedControls(coveredGaps.frameworkId, cid);
        for (const r of related) {
          const key = `${r.frameworkId}:${r.controlId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(r);
        }
      }
    }
    return out.slice(0, 8);
  }, [coveredGaps, sortedGaps, selectedGapIds]);

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

    // Header — logo + partnernavn + org.nr
    let textLeftX = margin;
    if (effectiveLogo) {
      try {
        const fmt = effectiveLogo.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        doc.addImage(effectiveLogo, fmt, margin, y - 4, 36, 36);
        textLeftX = margin + 44;
      } catch {
        /* ignore broken image */
      }
    }
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(effectivePartnerName, textLeftX, y + 6);
    if (effectiveOrgNumber) {
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(`Org.nr ${effectiveOrgNumber}`, textLeftX, y + 20);
    }
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Tilbud ${offerNumber}`, pageWidth - margin, y, { align: "right" });
    doc.text(todayLabel, pageWidth - margin, y + 14, { align: "right" });
    y += 48;

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
      const price = hours * editableHourlyRate;
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
    doc.text(`Timepris: ${editableHourlyRate.toLocaleString("nb-NO")} kr`, margin, y);
    const netForPdf = showTax && tax.mode === "inclusive" ? taxBreakdown.net : totalPrice;
    const netLabel = showTax && tax.mode === "exclusive" ? `Sum eks. ${tax.label}` : "Sum";
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`${netLabel}: ${totalHours} t · ${netForPdf.toLocaleString("nb-NO")} kr`, pageWidth - margin, y, { align: "right" });
    y += 20;
    if (showTax) {
      doc.setFontSize(11);
      doc.setTextColor(90);
      doc.text(`${tax.label} (${tax.rate}%): ${taxBreakdown.taxAmount.toLocaleString("nb-NO")} kr`, pageWidth - margin, y, { align: "right" });
      y += 16;
      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(`Totalt inkl. ${tax.label}: ${taxBreakdown.gross.toLocaleString("nb-NO")} kr`, pageWidth - margin, y, { align: "right" });
      y += 20;
    } else if (tax.enabled === false) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(formatTaxNote(tax), pageWidth - margin, y, { align: "right" });
      y += 16;
    }
    y += 8;

    // Statisk fallback når gap-analysen ikke er koblet på
    if (!(showGapsInOffer && coveredGaps && selectedCount > 0) && safeCoveredControls.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      safeCoveredControls.forEach(group => {
        if (y > 780) { doc.addPage(); y = margin; }
        const items = group.controlIds.map(id => `${getControlLabel(group.frameworkId, id)} (${id})`).join(", ");
        const lines = doc.splitTextToSize(`Dekker ${group.frameworkLabel}: ${items}`, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 12;
      });
      y += 6;
    }

    // SIDE 2 — dekning mot gap-analysen (oppgave → mangler)
    if (showGapsInOffer && coveredGaps && selectedCount > 0) {
      doc.addPage();
      y = margin;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("DEKNING MOT GAP-ANALYSEN", margin, y);
      y += 18;
      doc.setFontSize(15);
      doc.setTextColor(20);
      doc.text(`Tilbudet lukker ${selectedCount} av ${totalGapCount} mangler`, margin, y);
      y += 16;
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text(`${coveredGaps.frameworkLabel} · status per ${snapshotLabel}`, margin, y);
      y += 20;

      tasks.forEach(t => {
        const gaps = sortedGaps.filter(g => (t.gapIds ?? []).includes(g.id));
        if (gaps.length === 0) return;
        if (y > 740) { doc.addPage(); y = margin; }
        doc.setFontSize(11);
        doc.setTextColor(20);
        doc.text(`${t.label} · ${Number(t.hours) || 0} t`, margin, y);
        y += 14;
        doc.setFontSize(10);
        doc.setTextColor(60);
        gaps.forEach(g => {
          if (y > 780) { doc.addPage(); y = margin; }
          const ref = g.reference ? `${g.reference} — ` : "";
          const lines = doc.splitTextToSize(`• [${SEVERITY_LABEL[g.severity]}] ${ref}${g.title}`, pageWidth - margin * 2 - 12);
          doc.text(lines, margin + 12, y);
          y += lines.length * 12;
        });
        y += 10;
      });

      const uncoveredPdf = sortedGaps.filter(g => !selectedGapIds.has(g.id));
      if (uncoveredPdf.length > 0) {
        if (y > 720) { doc.addPage(); y = margin; }
        doc.setFontSize(11);
        doc.setTextColor(120);
        doc.text("Ikke dekket i dette tilbudet", margin, y);
        y += 14;
        doc.setFontSize(10);
        doc.setTextColor(120);
        uncoveredPdf.forEach(g => {
          if (y > 780) { doc.addPage(); y = margin; }
          const ref = g.reference ? `${g.reference} — ` : "";
          const lines = doc.splitTextToSize(`• ${ref}${g.title}`, pageWidth - margin * 2 - 12);
          doc.text(lines, margin + 12, y);
          y += lines.length * 12;
        });
      }
    }

    // VEDLEGG — gap-analyse som øyeblikksbilde
    if (attachGap && (coveredGaps || gapFrameworkId)) {
      doc.addPage();
      y = margin;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("VEDLEGG — GAP-ANALYSE (ØYEBLIKKSBILDE)", margin, y);
      y += 18;
      const fwLabel = coveredGaps?.frameworkLabel ?? gapFrameworkId?.toUpperCase() ?? "";
      doc.setFontSize(15);
      doc.setTextColor(20);
      doc.text(`Gap-analyse ${fwLabel}`, margin, y);
      y += 16;
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text(`Status per ${snapshotLabel}`, margin, y);
      y += 18;

      if (totalGapCount > 0) {
        const critTotal = sortedGaps.filter(g => g.severity === "critical").length;
        const highTotal = sortedGaps.filter(g => g.severity === "high").length;
        const minorTotal = sortedGaps.filter(g => g.severity === "medium" || g.severity === "low").length;
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(`${totalGapCount} gap · ${critTotal} kritiske · ${highTotal} vesentlige · ${minorTotal} mindre`, margin, y);
        y += 16;

        doc.setFontSize(10);
        doc.setTextColor(60);
        sortedGaps.forEach(g => {
          if (y > 780) { doc.addPage(); y = margin; }
          const covered = selectedGapIds.has(g.id);
          const ref = g.reference ? `${g.reference} — ` : "";
          const lines = doc.splitTextToSize(
            `${covered ? "✓" : "•"} [${SEVERITY_LABEL[g.severity]}] ${ref}${g.title}${covered ? " (dekkes)" : ""}`,
            pageWidth - margin * 2 - 8,
          );
          doc.text(lines, margin + 8, y);
          y += lines.length * 12 + 2;
        });
        y += 8;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text(`• ${gapCount} gap dokumentert`, margin + 8, y);
        y += 20;
      }
    }

    // Footer med sidetall på alle sider
    const footerParts = [effectivePartnerName];
    if (effectiveOrgNumber) footerParts.push(`Org.nr ${effectiveOrgNumber}`);
    footerParts.push(`Tilbud ${offerNumber}`, todayLabel);
    const pageTotal = doc.getNumberOfPages();
    for (let p = 1; p <= pageTotal; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(footerParts.join(" · "), margin, 820);
      doc.text(`Side ${p} av ${pageTotal}`, pageWidth - margin, 820, { align: "right" });
    }


    doc.save(`Tilbud_${offerNumber}_${offerName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Tilbud lastet ned", { description: `${offerNumber}.pdf` });
  };

  const handleSaveOffer = () => {
    persistOffer({
      offerNumber,
      name: offerName,
      customerId,
      customerName,
      templateIds: offeredTemplateIds ?? [],
      serviceKeys: offeredServiceNames ?? (serviceTitle ? [serviceTitle] : [offerName]),
    });
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
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Utkast fra Lara
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-xs gap-1">
                <Eye className="h-2.5 w-2.5" /> Forhåndsvisning · slik ser kunden tilbudet
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{effectivePartnerName}</span>
          </div>
          <DialogTitle className="text-lg">{offerName}</DialogTitle>
          <DialogDescription className="text-sm">
            {view === "edit"
              ? "Juster oppgaver og timer. Når tilbudet er generert kan du sende det direkte til kunden, eller laste det ned som PDF og sende fra ditt eget tilbudssystem."
              : "Send tilbudet direkte til kunden, eller last ned som PDF og send fra ditt eget tilbudssystem."}

          </DialogDescription>
        </DialogHeader>

        {view === "edit" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Aktiviteter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Aktiviteter</Label>
                {coveredGaps && totalGapCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Dekker <span className="font-semibold text-foreground tabular-nums">{selectedCount} av {totalGapCount}</span> mangler fra gap-analysen
                  </span>
                )}
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  <span>Oppgave</span>
                  <span className="text-right">Timer</span>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {tasks.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 items-start">
                      <div className="min-w-0">
                        <Input
                          value={t.label}
                          onChange={e => updateTask(i, { label: e.target.value })}
                          className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                        {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                        {coveredGaps && totalGapCount > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline inline-flex items-center gap-1"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                {(t.gapIds ?? []).length > 0
                                  ? `Lukker ${(t.gapIds ?? []).length} ${(t.gapIds ?? []).length === 1 ? "mangel" : "mangler"}`
                                  : "Koble mangler"}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-80 p-0">
                              <div className="px-3 py-2 border-b border-border">
                                <p className="text-xs font-semibold text-foreground">Mangler denne oppgaven lukker</p>
                                <p className="text-xs text-muted-foreground">{coveredGaps.frameworkLabel} · {snapshotLabel}</p>
                              </div>
                              <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                                {sortedGaps.map(g => {
                                  const checked = (t.gapIds ?? []).includes(g.id);
                                  const takenByOther = !checked && selectedGapIds.has(g.id);
                                  return (
                                    <li key={g.id} className="flex items-start gap-2 px-3 py-2">
                                      <Checkbox
                                        id={`t${i}-${g.id}`}
                                        checked={checked}
                                        onCheckedChange={() => toggleGapOnTask(i, g.id)}
                                        className="mt-0.5"
                                      />
                                      <label htmlFor={`t${i}-${g.id}`} className="flex-1 min-w-0 cursor-pointer">
                                        <span className="text-xs text-foreground leading-snug">
                                          {g.title}
                                          {g.reference && (
                                            <span className="font-mono text-xs text-muted-foreground ml-1">({g.reference})</span>
                                          )}
                                        </span>
                                        {takenByOther && (
                                          <span className="block text-xs text-muted-foreground">Dekkes av en annen oppgave</span>
                                        )}
                                      </label>
                                      <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0", severityDotClass(g.severity))} />
                                    </li>
                                  );
                                })}
                              </ul>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={t.hours}
                        onChange={e => updateTask(i, { hours: Number(e.target.value) })}
                        className="h-8 text-sm text-right tabular-nums"
                      />

                      <button
                        type="button"
                        onClick={() => removeTask(i)}
                        className="text-muted-foreground hover:text-destructive flex items-center justify-center h-8"
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
                className="w-full h-9 text-sm border-dashed gap-1 text-foreground"
                onClick={addTask}
              >
                <Plus className="h-3 w-3" /> Legg til oppgave
              </Button>

              {/* Pris og total */}
              <div className="space-y-3 pt-2">
                <div className="flex items-end gap-3">
                  <div className="w-40">
                    <Label className="text-xs font-medium text-foreground">Timepris</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editableHourlyRate}
                        onChange={e => setEditableHourlyRate(Number(e.target.value))}
                        className="h-9 text-sm tabular-nums"
                      />
                      <span className="text-sm text-muted-foreground">kr</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pb-2">
                    Brukes for å beregne totalsummen under.
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{showTax && tax.mode === "exclusive" ? `Sum eks. ${tax.label}` : "Totalt"}</span>
                      <span className="text-muted-foreground"> · {totalHours} timer × {editableHourlyRate.toLocaleString("nb-NO")} kr</span>
                    </div>
                    <span className={cn("tabular-nums", showTax && tax.mode === "exclusive" ? "text-sm text-foreground" : "text-lg font-bold text-foreground")}>
                      {fmtKr(showTax && tax.mode === "inclusive" ? taxBreakdown.net : totalPrice)}
                    </span>
                  </div>
                  {showTax && (
                    <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                      <span>{tax.label} ({tax.rate}%)</span>
                      <span className="tabular-nums">{fmtKr(taxBreakdown.taxAmount)}</span>
                    </div>
                  )}
                  {showTax && (
                    <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
                      <span className="text-sm font-medium text-foreground">Totalt inkl. {tax.label}</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{fmtKr(taxBreakdown.gross)}</span>
                    </div>
                  )}
                  {!showTax && tax.enabled === false && (
                    <p className="text-xs text-muted-foreground">Uten mva/tax-beregning.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Gap-analyse: alt samlet (vedlegg + mangler som lukkes) */}
            {coveredGaps && totalGapCount > 0 && (() => {
              const coverageState: "full" | "partial" | "none" =
                selectedCount === 0 ? "none" : selectedCount === totalGapCount ? "full" : "partial";
              const coverageLabel =
                coverageState === "full" ? "Full dekning" : coverageState === "partial" ? "Delvis dekning" : "Ingen dekning";
              const coverageClass =
                coverageState === "full"
                  ? "bg-success/10 text-success border-success/30"
                  : coverageState === "partial"
                    ? "bg-warning/10 text-warning border-warning/30"
                    : "bg-destructive/10 text-destructive border-destructive/30";
              const allIds = sortedGaps.map(g => g.id);
              const allChecked = selectedCount === totalGapCount;
              return (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Gap-analyse</Label>
                  <div className={cn("rounded-md border transition-colors", attachGap ? "border-primary/40 bg-primary/5" : "border-border")}>
                    {/* Header: tittel + chevron */}
                    <button
                      type="button"
                      onClick={() => setGapsExpanded(v => !v)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-md"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            Gap-analyse {coveredGaps.frameworkLabel}
                          </p>
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            {snapshotLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {totalGapCount} mangler · {selectedCount} lukkes av tilbudet
                        </p>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", gapsExpanded && "rotate-180")} />
                    </button>

                    {/* Hva som tas med i dokumentet – alltid synlig */}
                    <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground min-w-0">Ta med dekningsside (side 2)</p>
                      <Switch checked={showGapsInOffer} onCheckedChange={setShowGapsInOffer} />
                    </div>
                    <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground min-w-0">Legg ved gap-analysen (vedlegg)</p>
                      <Switch checked={attachGap} onCheckedChange={setAttachGap} />
                    </div>

                    {/* Utvidet innhold */}
                    {gapsExpanded && (
                      <>


                        {/* Dekningsbanner */}
                        <div className={cn("border-t border-border px-3 py-2 flex items-center gap-2 flex-wrap", coverageClass)}>
                          <ShieldCheck className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-semibold">{coverageLabel}</span>
                          <span className="text-xs opacity-90">
                            {coverageState === "full"
                              ? "Aktivitetene lukker alle mangler fra gap-analysen."
                              : coverageState === "partial"
                                ? `Aktivitetene lukker ${selectedCount} av ${totalGapCount} mangler. ${totalGapCount - selectedCount} gjenstår.`
                                : "Aktivitetene lukker ingen av manglene fra gap-analysen."}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAllGaps(!allChecked)}
                            className="ml-auto text-xs font-medium underline-offset-2 hover:underline"
                          >
                            {allChecked ? "Fjern alle" : "Velg alle"}
                          </button>
                        </div>

                        {/* Mangelliste */}
                        <div className="border-t border-border">
                          <div className="px-3 py-2 bg-muted/40 border-b border-border space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const theme = getFrameworkTheme(coveredGaps.frameworkId);
                                  return (
                                    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border", theme.chip)}>
                                      {coveredGaps.frameworkLabel}
                                    </span>
                                  );
                                })()}
                                <span className="text-muted-foreground">status per {snapshotLabel}</span>
                              </div>
                              {criticalSelected > 0 && (
                                <span className="text-xs text-destructive font-medium">{criticalSelected} kritiske</span>
                              )}
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${gapPercent}%` }} />
                            </div>
                          </div>
                          <ul className="divide-y divide-border">
                            {sortedGaps.map(g => {
                              const checked = selectedGapIds.has(g.id);
                              return (
                                <li key={g.id} className="flex items-start gap-2.5 px-3 py-2 hover:bg-muted/30">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => toggleGap(g.id)}
                                    className="mt-0.5"
                                    id={`gap-${g.id}`}
                                  />
                                  <span className={cn("h-2 w-2 rounded-full mt-2 shrink-0", severityDotClass(g.severity))} />
                                  <label htmlFor={`gap-${g.id}`} className="flex-1 min-w-0 cursor-pointer space-y-0.5">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-sm text-foreground leading-snug">
                                        {g.title}
                                        {g.reference && (
                                          <span className="font-mono text-xs text-muted-foreground ml-1">({g.reference})</span>
                                        )}
                                      </span>
                                    </div>
                                  </label>
                                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                    {SEVERITY_LABEL[g.severity]}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          {crosswalkChips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-t border-border">
                              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mr-1">Også relevant for:</span>
                              {crosswalkChips.map(r => {
                                const t = getFrameworkTheme(r.frameworkId);
                                return (
                                  <span
                                    key={`${r.frameworkId}-${r.controlId}`}
                                    className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border", t.chip)}
                                  >
                                    {r.frameworkLabel} {r.controlId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                </div>
              );
            })()}

            {/* Bakoverkompatibel: gammel statisk visning når coveredGaps ikke er satt */}
            {!coveredGaps && safeCoveredControls.length > 0 && (
              <div className="space-y-1">
                {safeCoveredControls.map(group => (
                  <p key={group.frameworkId} className="text-xs text-muted-foreground">
                    Dekker {group.frameworkLabel}: {group.controlIds.map(id => `${getControlLabel(group.frameworkId, id)} (${id})`).join(", ")}
                  </p>
                ))}
              </div>
            )}

            {/* Bakoverkompatibel: vedlegg-toggle når coveredGaps mangler men gapFrameworkId finnes */}
            {!coveredGaps && gapFrameworkId && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Vedlegg</Label>
                <div className={cn("rounded-md border p-3 transition-colors", attachGap ? "border-primary/40 bg-primary/5" : "border-border")}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          Gap-analyse {gapFrameworkId.toUpperCase()}
                        </p>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          {snapshotLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{gapCount} mangler</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="h-8 text-sm gap-1 text-primary" onClick={() => setGapPreviewOpen(true)}>
                      <Eye className="h-3.5 w-3.5" /> Forhåndsvis
                    </Button>
                    <Switch checked={attachGap} onCheckedChange={setAttachGap} />
                  </div>
                </div>
              </div>
            )}

            {/* Intro/melding i tilbudsdokumentet */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Innledning i tilbudet (valgfritt)
              </Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder={`Hei ${customerContactName}, basert på modenhetsbildet ditt foreslår vi følgende løp.`}
                className="text-sm resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Denne teksten vises øverst i tilbudsdokumentet. Etter generering kan du sende tilbudet direkte til kunden, eller laste det ned og sende fra ditt eget system.
              </p>

            </div>
          </div>
        )}

        {view === "preview" && (() => {
          const coverageRows = tasks
            .map(t => ({ task: t, gaps: sortedGaps.filter(g => (t.gapIds ?? []).includes(g.id)) }))
            .filter(r => r.gaps.length > 0);
          const uncovered = sortedGaps.filter(g => !selectedGapIds.has(g.id));
          const showCoveragePage = showGapsInOffer && !!coveredGaps && coverageRows.length > 0;
          const showAttachmentPage = attachGap && (!!coveredGaps || !!gapFrameworkId);
          const totalPages = 1 + (showCoveragePage ? 1 : 0) + (showAttachmentPage ? 1 : 0);
          const coveragePageNo = 2;
          const attachmentPageNo = showCoveragePage ? 3 : 2;
          const docFooter = `${effectivePartnerName}${effectiveOrgNumber ? ` · Org.nr ${effectiveOrgNumber}` : ""} · Tilbud ${offerNumber} · ${todayLabel}`;
          const fwLabel = coveredGaps?.frameworkLabel ?? gapFrameworkId?.toUpperCase() ?? "";

          return (
            <div className="flex-1 overflow-y-auto p-5 bg-muted/30 space-y-5">
              {/* SIDE 1 — tilbudet */}
              <OfferSheet page={1} total={totalPages} footer={docFooter}>
                <div className="flex items-start justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {effectiveLogo && (
                      <img src={effectiveLogo} alt="" className="h-9 w-9 object-contain rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{effectivePartnerName}</div>
                      {effectiveOrgNumber && (
                        <div className="text-xs tabular-nums">Org.nr {effectiveOrgNumber}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div>Tilbud <span className="tabular-nums">{offerNumber}</span></div>
                    <div>{todayLabel}</div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground">{offerName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Til: {customerContactName}</p>
                </div>

                {message.trim() && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{message.trim()}</p>
                )}

                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_70px_100px] gap-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold border-b border-border pb-1.5">
                    <span>Oppgave</span>
                    <span className="text-right">Timer</span>
                    <span className="text-right">Beløp</span>
                  </div>
                  {tasks.map((t, i) => {
                    const hrs = Number(t.hours) || 0;
                    return (
                      <div key={i} className="grid grid-cols-[1fr_70px_100px] gap-3 text-sm py-1.5 border-b border-border/50">
                        <div>
                          <p className="text-foreground">{t.label}</p>
                          {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                        </div>
                        <span className="text-right tabular-nums text-foreground">{hrs}</span>
                        <span className="text-right tabular-nums text-foreground">{(hrs * editableHourlyRate).toLocaleString("nb-NO")} kr</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 mt-1 border-t-2 border-foreground/80 space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                    <span>Timepris</span>
                    <span className="tabular-nums">{editableHourlyRate.toLocaleString("nb-NO")} kr</span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                    <span>Sum timer</span>
                    <span className="tabular-nums">{totalHours} t</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1.5 border-t border-border">
                    <span className={cn(showTax && tax.mode === "exclusive" ? "text-sm text-muted-foreground" : "text-base font-bold text-foreground")}>
                      {showTax && tax.mode === "exclusive" ? `Sum eks. ${tax.label}` : "Totalsum"}
                    </span>
                    <span className={cn("tabular-nums", showTax && tax.mode === "exclusive" ? "text-sm text-muted-foreground" : "text-lg font-bold text-foreground")}>
                      {fmtKr(showTax && tax.mode === "inclusive" ? taxBreakdown.net : totalPrice)}
                    </span>
                  </div>
                  {showTax && (
                    <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                      <span>{tax.label} ({tax.rate}%)</span>
                      <span className="tabular-nums">{fmtKr(taxBreakdown.taxAmount)}</span>
                    </div>
                  )}
                  {showTax && (
                    <div className="flex items-baseline justify-between pt-1.5 border-t border-border">
                      <span className="text-base font-bold text-foreground">Totalt inkl. {tax.label}</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{fmtKr(taxBreakdown.gross)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">{formatTaxNote(tax)}</p>
                </div>

                {!coveredGaps && safeCoveredControls.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-1">
                    {safeCoveredControls.map(group => (
                      <p key={group.frameworkId} className="text-xs text-muted-foreground">
                        Dekker {group.frameworkLabel}: {group.controlIds.map(id => `${getControlLabel(group.frameworkId, id)} (${id})`).join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {(showCoveragePage || showAttachmentPage) && (
                  <p className="text-xs text-muted-foreground pt-3 border-t border-border">
                    {showCoveragePage && `Side ${coveragePageNo}: hvordan oppgavene dekker gap-analysen.`}
                    {showCoveragePage && showAttachmentPage && " "}
                    {showAttachmentPage && `Side ${attachmentPageNo}: gap-analysen ${fwLabel} som vedlegg.`}
                  </p>
                )}
              </OfferSheet>

              {/* SIDE 2 — dekning mot gap-analysen */}
              {showCoveragePage && coveredGaps && (
                <OfferSheet page={coveragePageNo} total={totalPages} footer={docFooter}>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Dekning mot gap-analysen</p>
                    <h3 className="text-base font-bold text-foreground">
                      Tilbudet lukker {selectedCount} av {totalGapCount} mangler
                    </h3>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {(() => {
                        const theme = getFrameworkTheme(coveredGaps.frameworkId);
                        return (
                          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border", theme.chip)}>
                            {coveredGaps.frameworkLabel}
                          </span>
                        );
                      })()}
                      <span className="text-muted-foreground">status per {snapshotLabel}</span>
                      {criticalSelected > 0 && (
                        <span className="text-destructive font-medium">{criticalSelected} kritiske lukkes</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-3 py-2 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      <span>Oppgave</span>
                      <span>Lukker disse manglene</span>
                    </div>
                    <div className="divide-y divide-border">
                      {coverageRows.map((row, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">{row.task.label}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">{Number(row.task.hours) || 0} timer</p>
                          </div>
                          <ul className="space-y-1 min-w-0">
                            {row.gaps.map(g => (
                              <li key={g.id} className="flex items-start gap-2">
                                <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", severityDotClass(g.severity))} />
                                <span className="text-sm text-foreground leading-snug">
                                  {g.title}
                                  {g.reference && (
                                    <span className="font-mono text-xs text-muted-foreground ml-1">({g.reference})</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {uncovered.length > 0 && (
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-3 py-2.5 bg-muted/20">
                          <p className="text-sm font-medium text-muted-foreground leading-snug">Ikke dekket i dette tilbudet</p>
                          <ul className="space-y-1 min-w-0">
                            {uncovered.map(g => (
                              <li key={g.id} className="text-sm text-muted-foreground leading-snug">
                                {g.title}
                                {g.reference && <span className="font-mono text-xs ml-1">({g.reference})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {crosswalkChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mr-1">Også relevant for:</span>
                      {crosswalkChips.map(r => {
                        const t = getFrameworkTheme(r.frameworkId);
                        return (
                          <span
                            key={`${r.frameworkId}-${r.controlId}`}
                            className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border", t.chip)}
                          >
                            {r.frameworkLabel} {r.controlId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </OfferSheet>
              )}

              {/* VEDLEGG — gap-analysen */}
              {showAttachmentPage && (
                <OfferSheet page={attachmentPageNo} total={totalPages} footer={docFooter}>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Vedlegg</p>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Gap-analyse {fwLabel}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Øyeblikksbilde per {snapshotLabel} · {totalGapCount > 0 ? totalGapCount : gapCount} mangler
                    </p>
                  </div>
                  {sortedGaps.length > 0 ? (
                    <ul className="divide-y divide-border rounded-md border border-border">
                      {sortedGaps.map(g => {
                        const covered = selectedGapIds.has(g.id);
                        return (
                          <li key={g.id} className="flex items-start gap-2.5 px-3 py-2">
                            <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", severityDotClass(g.severity))} />
                            <span className="flex-1 min-w-0 text-sm text-foreground leading-snug">
                              {g.title}
                              {g.reference && (
                                <span className="font-mono text-xs text-muted-foreground ml-1">({g.reference})</span>
                              )}
                            </span>
                            <span className={cn("text-xs shrink-0 mt-0.5", covered ? "text-success font-medium" : "text-muted-foreground")}>
                              {covered ? "Dekkes" : "Ikke dekket"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{gapCount} mangler dokumentert.</p>
                  )}
                </OfferSheet>
              )}
            </div>
          );
        })()}


        {view === "saved" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Tilbudet er lagret</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  <span className="font-medium text-foreground">{offerNumber}</span> · {offerName} ·{" "}
                  <span className="tabular-nums">{totalPrice.toLocaleString("nb-NO")} kr</span>
                  {savedAt && <> · lagret {savedAt}</>}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 divide-y divide-border">
              <div className="flex items-start gap-3 p-3">
                <Inbox className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Lagret på kundekortet</p>
                  <p className="text-sm text-muted-foreground">Du finner det igjen under <span className="text-foreground font-medium">Tilbud</span>-fanen på {customerContactName}.</p>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs shrink-0">Utkast</Badge>
              </div>
              <div className="flex items-start gap-3 p-3">
                <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Aktivitet opprettet for Lara</p>
                  <p className="text-sm text-muted-foreground">Lara følger opp status og minner deg på oppfølging etter 7 dager.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3">
                <Send className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Ikke sendt til kunden ennå</p>
                  <p className="text-sm text-muted-foreground">Last ned PDF og send fra ditt eget tilbudssystem når du er klar.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          {view === "edit" && (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button size="sm" onClick={handleGenerate} className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Generer tilbud
              </Button>
            </>
          )}
          {view === "preview" && (
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
          {view === "saved" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setView("preview")} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Tilbake
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Last ned PDF
                </Button>
                <Button size="sm" onClick={() => onOpenChange(false)} className="gap-1.5">
                  Ferdig
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
        initialFrameworkId={coveredGaps?.frameworkId ?? gapFrameworkId}
      />
    </Dialog>
  );
}
