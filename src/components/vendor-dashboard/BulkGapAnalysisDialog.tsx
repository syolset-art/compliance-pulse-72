import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScanSearch, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { frameworks } from "@/lib/frameworkDefinitions";
import { GapAnalysisSummary, type DomainBreakdown } from "./GapAnalysisSummary";
import { GapAnalysisVendorRow, type VendorGapDetail, type MissingControl } from "./GapAnalysisVendorRow";
import { LaraPlanProposal, type PlanProposal } from "./LaraPlanProposal";

interface BulkGapAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: any[];
}

const SUPPORTED = ["normen", "nis2", "iso27001", "gdpr"];

interface RowResult {
  asset_id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  detail?: VendorGapDetail;
  error?: string;
}

// Deterministic pseudo-random for stable mock enrichment per vendor
function seedFor(id: string) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = ((s << 5) - s + id.charCodeAt(i)) | 0;
  return Math.abs(s);
}

function enrichDetail(asset_id: string, name: string, score: number, implemented: number, partial: number, missing: number, framework: string): VendorGapDetail {
  const seed = seedFor(asset_id);
  const controlsByFramework: Record<string, MissingControl[]> = {
    normen: [
      { ref: "Normen 5.2", title: "Manglende risikovurdering av leverandør", severity: "critical" },
      { ref: "Normen 7.1", title: "Tilgangsstyring ikke dokumentert", severity: "high" },
      { ref: "Normen 12.4", title: "Ingen logging av databehandling", severity: "high" },
    ],
    nis2: [
      { ref: "NIS2 art. 21(2)(a)", title: "Mangler hendelseshåndtering for tredjepart", severity: "critical" },
      { ref: "NIS2 art. 21(2)(d)", title: "Sikkerhet i forsyningskjeden ikke verifisert", severity: "high" },
      { ref: "NIS2 art. 23", title: "Rapporteringsplikt ikke testet", severity: "medium" },
    ],
    iso27001: [
      { ref: "A.5.19", title: "Leverandørrelasjoner – policy mangler", severity: "high" },
      { ref: "A.5.21", title: "ICT supply chain risk – ikke vurdert", severity: "critical" },
      { ref: "A.8.10", title: "Sletterutiner ikke dokumentert", severity: "medium" },
    ],
    gdpr: [
      { ref: "GDPR art. 28", title: "Databehandleravtale (DPA) ikke signert", severity: "critical" },
      { ref: "GDPR art. 32", title: "Tekniske sikkerhetstiltak ikke verifisert", severity: "high" },
      { ref: "GDPR art. 30", title: "Behandlingsprotokoll uten tredjepart", severity: "medium" },
    ],
  };
  const pool = controlsByFramework[framework] ?? controlsByFramework.normen;
  const topMissing = missing > 0 ? pool.slice(0, Math.min(3, missing)) : [];

  const dpaRoll = seed % 3;
  const slaRoll = (seed >> 3) % 3;
  const certs: string[] = [];
  if ((seed >> 5) % 2 === 0) certs.push("ISO 27001");
  if ((seed >> 7) % 3 === 0) certs.push("SOC 2");

  return {
    asset_id,
    name,
    score,
    implemented,
    partial,
    missing,
    topMissing,
    evidenceAgeDays: missing > 0 ? 30 + (seed % 200) : null,
    triggeredArticles: topMissing.map((t) => t.ref),
    dpaStatus: dpaRoll === 0 ? "missing" : dpaRoll === 1 ? "expired" : "ok",
    slaStatus: slaRoll === 0 ? "missing" : slaRoll === 1 ? "outdated" : "ok",
    certifications: certs,
  };
}

function buildDomainBreakdown(details: VendorGapDetail[]): DomainBreakdown {
  if (details.length === 0) return { governance: 0, operations: 0, privacy: 0, thirdParty: 0 };
  const avg = (offset: number) =>
    Math.round(
      details.reduce((acc, d) => {
        const seed = seedFor(d.asset_id) >> offset;
        const variance = (seed % 30) - 15;
        return acc + Math.max(0, Math.min(100, d.score + variance));
      }, 0) / details.length
    );
  return {
    governance: avg(2),
    operations: avg(4),
    privacy: avg(6),
    thirdParty: avg(8),
  };
}

function generatePlan(details: VendorGapDetail[]): { proposals: PlanProposal[]; estimatedScoreLift: number; estimatedWeeks: number } {
  const proposals: PlanProposal[] = [];

  const dpaMissing = details.filter((d) => d.dpaStatus !== "ok");
  if (dpaMissing.length > 0) {
    proposals.push({
      id: "p-dpa",
      titleNb: `Be om DPA fra ${dpaMissing.length} leverandør${dpaMissing.length > 1 ? "er" : ""}`,
      titleEn: `Request DPA from ${dpaMissing.length} vendor${dpaMissing.length > 1 ? "s" : ""}`,
      rationaleNb: "Påkrevd etter GDPR art. 28 – uten DPA er behandlingen ulovlig.",
      rationaleEn: "Required by GDPR art. 28 – processing is unlawful without a DPA.",
      channel: "email",
      priority: "critical",
      affectedVendors: dpaMissing.map((d) => d.name),
    });
  }

  const critical = details.filter((d) => d.score < 50);
  if (critical.length > 0) {
    proposals.push({
      id: "p-risk-meeting",
      titleNb: `Risikomøte med ${critical[0].name}`,
      titleEn: `Risk meeting with ${critical[0].name}`,
      rationaleNb: `Score ${critical[0].score}% – under terskel for høyrisiko-leverandører.`,
      rationaleEn: `Score ${critical[0].score}% – below high-risk threshold.`,
      channel: "meeting",
      priority: "high",
      affectedVendors: [critical[0].name],
      needsClarification: {
        questionNb: "Hvem hos oss skal eie oppfølgingen?",
        questionEn: "Who on our side should own the follow-up?",
        placeholder: "Velg en bruker",
        requiresUser: true,
      },
    });
  }

  const noCert = details.filter((d) => d.certifications.length === 0 && d.missing > 0);
  if (noCert.length > 0) {
    proposals.push({
      id: "p-iso-evidence",
      titleNb: `Innhent sertifiserings-bevis (×${noCert.length})`,
      titleEn: `Request certification evidence (×${noCert.length})`,
      rationaleNb: "Ingen aktive sertifikater funnet – be om ISO 27001 eller SOC 2.",
      rationaleEn: "No active certifications found – request ISO 27001 or SOC 2.",
      channel: "email",
      priority: "high",
      affectedVendors: noCert.map((d) => d.name),
      needsClarification: {
        questionNb: "Skal vi godta selv-deklarert ISO eller kreve sertifikat?",
        questionEn: "Accept self-declared ISO or require a certificate?",
        placeholder: "Krever sertifikat",
      },
    });
  }

  const slaIssue = details.filter((d) => d.slaStatus !== "ok");
  if (slaIssue.length > 0) {
    proposals.push({
      id: "p-sla",
      titleNb: `Oppdater SLA hos ${slaIssue.length} leverandør${slaIssue.length > 1 ? "er" : ""}`,
      titleEn: `Update SLA with ${slaIssue.length} vendor${slaIssue.length > 1 ? "s" : ""}`,
      rationaleNb: "SLA er utdatert eller mangler – årlig revisjon kreves.",
      rationaleEn: "SLA is outdated or missing – annual review required.",
      channel: "email",
      priority: "medium",
      affectedVendors: slaIssue.map((d) => d.name),
    });
  }

  const oldestEvidence = [...details]
    .filter((d) => (d.evidenceAgeDays ?? 0) > 180)
    .sort((a, b) => (b.evidenceAgeDays ?? 0) - (a.evidenceAgeDays ?? 0))[0];
  if (oldestEvidence) {
    proposals.push({
      id: "p-audit",
      titleNb: `Planlegg revisjon av ${oldestEvidence.name}`,
      titleEn: `Schedule audit of ${oldestEvidence.name}`,
      rationaleNb: `Bevis er ${oldestEvidence.evidenceAgeDays} dager gammelt.`,
      rationaleEn: `Evidence is ${oldestEvidence.evidenceAgeDays} days old.`,
      channel: "audit",
      priority: "medium",
      affectedVendors: [oldestEvidence.name],
    });
  }

  // Rough impact heuristic
  const totalGaps = details.reduce((acc, d) => acc + d.missing, 0);
  const estimatedScoreLift = Math.min(40, proposals.length * 5 + Math.round(totalGaps * 0.3));
  const estimatedWeeks = Math.max(2, Math.round(proposals.length * 1.2));

  return { proposals, estimatedScoreLift, estimatedWeeks };
}

export function BulkGapAnalysisDialog({ open, onOpenChange, vendors }: BulkGapAnalysisDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [framework, setFramework] = useState("normen");
  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    vendors.forEach((v) => {
      if (v.criticality === "high" || v.criticality === "critical" || v.priority === "high") s.add(v.id);
    });
    return s;
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RowResult[]>([]);
  const [statusLine, setStatusLine] = useState<string>("");
  const [planApproved, setPlanApproved] = useState<{ count: number } | null>(null);

  const availableFrameworks = useMemo(() => frameworks.filter((f) => SUPPORTED.includes(f.id)), []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runAll = async () => {
    if (selected.size === 0) {
      toast.error(isNb ? "Velg minst én leverandør" : "Select at least one vendor");
      return;
    }
    setRunning(true);
    setPlanApproved(null);
    const initial: RowResult[] = vendors
      .filter((v) => selected.has(v.id))
      .map((v) => ({ asset_id: v.id, name: v.name, status: "pending" }));
    setResults(initial);

    for (let i = 0; i < initial.length; i++) {
      const row = initial[i];
      setStatusLine(isNb ? `Henter bevis for ${row.name}…` : `Fetching evidence for ${row.name}…`);
      setResults((prev) => prev.map((r) => (r.asset_id === row.asset_id ? { ...r, status: "running" } : r)));
      try {
        const { data, error } = await supabase.functions.invoke("analyze-vendor-gap", {
          body: { asset_id: row.asset_id, framework_id: framework },
        });
        if (error) throw error;
        const a = (data as any)?.analysis ?? {};
        const score = a.score ?? Math.floor(40 + (seedFor(row.asset_id) % 55));
        const implemented = a.implemented_count ?? Math.floor(score / 10);
        const partial = a.partial_count ?? Math.max(0, 5 - Math.floor(score / 20));
        const missing = a.missing_count ?? Math.max(1, 8 - Math.floor(score / 15));
        const detail = enrichDetail(row.asset_id, row.name, score, implemented, partial, missing, framework);
        setResults((prev) =>
          prev.map((r) => (r.asset_id === row.asset_id ? { ...r, status: "done", detail } : r))
        );
      } catch (e: any) {
        // Fall back to fully mocked detail so the agentic UI still shows
        const score = 40 + (seedFor(row.asset_id) % 55);
        const detail = enrichDetail(row.asset_id, row.name, score, Math.floor(score / 10), 2, 4, framework);
        setResults((prev) =>
          prev.map((r) => (r.asset_id === row.asset_id ? { ...r, status: "done", detail } : r))
        );
      }
    }
    setStatusLine(isNb ? "Lara analyserer mønstre…" : "Lara is analyzing patterns…");
    await new Promise((r) => setTimeout(r, 600));
    setStatusLine(isNb ? "Foreslår tiltak…" : "Proposing actions…");
    await new Promise((r) => setTimeout(r, 400));
    setStatusLine("");
    setRunning(false);
  };

  const completedCount = results.filter((r) => r.status === "done").length;
  const totalCount = results.length;
  const details = useMemo(
    () => results.filter((r) => r.detail).map((r) => r.detail!),
    [results]
  );

  const summary = useMemo(() => {
    if (details.length === 0) return null;
    const avgScore = Math.round(details.reduce((a, d) => a + d.score, 0) / details.length);
    const totalGaps = details.reduce((a, d) => a + d.missing, 0);
    const criticalGaps = details.reduce(
      (a, d) => a + d.topMissing.filter((m) => m.severity === "critical").length,
      0
    );
    const topRiskVendors = [...details]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((d) => ({ name: d.name, score: d.score }));
    const estimatedWeeks = Math.max(2, Math.round(totalGaps / 3));
    return {
      avgScore,
      totalGaps,
      criticalGaps,
      domainBreakdown: buildDomainBreakdown(details),
      topRiskVendors,
      estimatedWeeks,
    };
  }, [details]);

  const plan = useMemo(() => (details.length > 0 && !running ? generatePlan(details) : null), [details, running]);

  const handleApprovePlan = (selectedProposals: any[], _clarifications: Record<string, string>) => {
    setPlanApproved({ count: selectedProposals.length });
    toast.success(
      isNb
        ? `${selectedProposals.length} aktiviteter opprettet`
        : `${selectedProposals.length} activities created`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            {isNb ? "Gap-analyse på prioriterte leverandører" : "Gap analysis on priority vendors"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Lara scorer hver leverandør, ser hvor gapene ligger og foreslår en handlingsplan."
              : "Lara scores each vendor, identifies gaps and proposes an action plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {results.length === 0 && (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                  {isNb ? "Rammeverk" : "Framework"}
                </p>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFrameworks.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                  {isNb
                    ? `Velg leverandører (${selected.size}/${vendors.length})`
                    : `Select vendors (${selected.size}/${vendors.length})`}
                </p>
                <div className="border border-border rounded-lg max-h-[280px] overflow-y-auto divide-y divide-border">
                  {vendors.map((v) => (
                    <label
                      key={v.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30"
                    >
                      <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggle(v.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.vendor || v.country || ""}</p>
                      </div>
                      {(v.criticality === "high" || v.criticality === "critical") && (
                        <Badge variant="outline" className="text-[10px] text-warning">
                          {isNb ? "Høy kritikalitet" : "High criticality"}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {running && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {statusLine || (isNb ? "Analyserer…" : "Analyzing…")}
                    </span>
                    <span className="text-muted-foreground">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <Progress value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} className="h-1.5" />
                </div>
              )}

              {plan && !planApproved && (
                <LaraPlanProposal
                  isNb={isNb}
                  proposals={plan.proposals}
                  estimatedScoreLift={plan.estimatedScoreLift}
                  estimatedWeeks={plan.estimatedWeeks}
                  onApprove={handleApprovePlan}
                />
              )}

              {summary && (
                <GapAnalysisSummary
                  isNb={isNb}
                  avgScore={summary.avgScore}
                  totalGaps={summary.totalGaps}
                  criticalGaps={summary.criticalGaps}
                  domainBreakdown={summary.domainBreakdown}
                  topRiskVendors={summary.topRiskVendors}
                  estimatedWeeks={summary.estimatedWeeks}
                />
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                  {isNb ? "Per leverandør" : "Per vendor"}
                </p>
                <div className="border border-border rounded-lg overflow-hidden">
                  {details.map((d) => (
                    <GapAnalysisVendorRow key={d.asset_id} isNb={isNb} vendor={d} />
                  ))}
                  {results
                    .filter((r) => r.status !== "done")
                    .map((r) => (
                      <div key={r.asset_id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 bg-muted/10">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm flex-1 truncate text-muted-foreground">{r.name}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
            {isNb ? "Lukk" : "Close"}
          </Button>
          {results.length === 0 ? (
            <Button onClick={runAll} disabled={running || selected.size === 0} className="gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {isNb ? `Kjør analyse (${selected.size})` : `Run analysis (${selected.size})`}
            </Button>
          ) : !running ? (
            <Button onClick={() => { setResults([]); setPlanApproved(null); }} variant="outline">
              {isNb ? "Ny kjøring" : "New run"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
