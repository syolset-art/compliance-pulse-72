import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Bot,
  Zap,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  nis2Requirements,
  computeNIS2Summary,
  computeNIS2AgentBreakdown,
  type NIS2AssessmentMap,
  type NIS2Status,
  type NIS2Requirement,
  type NIS2AgentCapability,
} from "@/lib/nis2Requirements";
import { useActivatedServices } from "@/hooks/useActivatedServices";

interface Props {
  assetId: string;
  metadata: Record<string, any>;
}

const statusIcon = (s: NIS2Status) => {
  switch (s) {
    case "pass":
      return <CheckCircle2 className="h-5 w-5 text-status-closed" />;
    case "partial":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

const statusLabel = (s: NIS2Status) => {
  switch (s) {
    case "pass": return "Oppfylt";
    case "partial": return "Delvis";
    case "fail": return "Ikke oppfylt";
    default: return "Ikke vurdert";
  }
};

const capabilityBadge = (cap: NIS2AgentCapability) => {
  switch (cap) {
    case "ai_ready":
      return (
        <Badge variant="outline" className="text-[13px] h-5 gap-1 bg-status-closed/10 dark:bg-emerald-950/30 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed">
          <Bot className="h-3 w-3" /> Lara håndterer
        </Badge>
      );
    case "activatable":
      return (
        <Badge variant="outline" className="text-[13px] h-5 gap-1 bg-primary/10 dark:bg-blue-950/30 text-primary dark:text-primary border-primary/20 dark:border-primary">
          <Zap className="h-3 w-3" /> Kan aktiveres
        </Badge>
      );
    case "assisted":
      return (
        <Badge variant="outline" className="text-[13px] h-5 gap-1 bg-warning/10 dark:bg-amber-950/30 text-warning dark:text-warning border-warning/20 dark:border-warning">
          <Sparkles className="h-3 w-3" /> Assistert
        </Badge>
      );
    case "manual":
      return (
        <Badge variant="outline" className="text-[13px] h-5 gap-1 bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
          <User className="h-3 w-3" /> Manuell
        </Badge>
      );
  }
};

export function NIS2AssessmentTab({ assetId, metadata }: Props) {
  const [assessment, setAssessment] = useState<NIS2AssessmentMap>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [uploadingReq, setUploadingReq] = useState<string | null>(null);
  const [docLists, setDocLists] = useState<Record<string, { name: string; created_at: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const { activatedServices, activateService, isServiceActive } = useActivatedServices();

  // Initialize assessment from metadata + auto-checks
  useEffect(() => {
    const existing: NIS2AssessmentMap = (metadata?.nis2_assessment as NIS2AssessmentMap) || {};
    const merged: NIS2AssessmentMap = {};

    for (const req of nis2Requirements) {
      const autoResult = req.autoCheck(metadata);
      const saved = existing[req.id];

      if (saved) {
        merged[req.id] = saved;
      } else if (autoResult !== null) {
        merged[req.id] = {
          status: autoResult,
          notes: "",
          updatedAt: new Date().toISOString(),
          autoChecked: true,
        };
      } else {
        merged[req.id] = {
          status: "not_assessed",
          notes: "",
          updatedAt: "",
          autoChecked: false,
        };
      }
    }
    setAssessment(merged);
  }, [metadata]);

  // Load documents for all requirements
  useEffect(() => {
    async function loadDocs() {
      const lists: Record<string, { name: string; created_at: string }[]> = {};
      for (const req of nis2Requirements) {
        const { data } = await supabase.storage
          .from("documents")
          .list(`nis2/${assetId}/${req.id}`);
        if (data && data.length > 0) {
          lists[req.id] = data.map((f) => ({ name: f.name, created_at: f.created_at || "" }));
        }
      }
      setDocLists(lists);
    }
    loadDocs();
  }, [assetId]);

  const saveAssessment = useCallback(
    async (updated: NIS2AssessmentMap) => {
      setSaving(true);
      const newMeta = { ...metadata, nis2_assessment: updated };
      const { error } = await supabase
        .from("assets")
        .update({ metadata: newMeta } as any)
        .eq("id", assetId);
      setSaving(false);
      if (error) {
        toast.error("Kunne ikke lagre vurderingen");
      } else {
        toast.success("NIS2-vurdering lagret");
      }
    },
    [assetId, metadata]
  );

  const updateStatus = (reqId: string, status: NIS2Status) => {
    const updated: NIS2AssessmentMap = {
      ...assessment,
      [reqId]: {
        ...assessment[reqId],
        status,
        updatedAt: new Date().toISOString(),
        autoChecked: false,
      },
    };
    setAssessment(updated);
    saveAssessment(updated);
  };

  const updateNotes = (reqId: string, notes: string) => {
    setAssessment((prev) => ({
      ...prev,
      [reqId]: { ...prev[reqId], notes },
    }));
  };

  const saveNotes = (reqId: string) => {
    const updated = {
      ...assessment,
      [reqId]: {
        ...assessment[reqId],
        updatedAt: new Date().toISOString(),
      },
    };
    setAssessment(updated);
    saveAssessment(updated);
  };

  const handleUpload = async (reqId: string, file: File) => {
    setUploadingReq(reqId);
    const path = `nis2/${assetId}/${reqId}/${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    setUploadingReq(null);
    if (error) {
      toast.error("Opplasting feilet: " + error.message);
      return;
    }
    toast.success(`"${file.name}" lastet opp`);
    const { data } = await supabase.storage.from("documents").list(`nis2/${assetId}/${reqId}`);
    if (data) {
      setDocLists((prev) => ({
        ...prev,
        [reqId]: data.map((f) => ({ name: f.name, created_at: f.created_at || "" })),
      }));
    }
  };

  const handleDeleteDoc = async (reqId: string, fileName: string) => {
    const path = `nis2/${assetId}/${reqId}/${fileName}`;
    const { error } = await supabase.storage.from("documents").remove([path]);
    if (error) {
      toast.error("Kunne ikke slette filen");
      return;
    }
    setDocLists((prev) => ({
      ...prev,
      [reqId]: (prev[reqId] || []).filter((f) => f.name !== fileName),
    }));
    toast.success("Dokument slettet");
  };

  const handleActivateService = (req: NIS2Requirement) => {
    if (!req.activatableServiceId) return;
    activateService(req.activatableServiceId, "NIS2 Assessment");
    // Auto-set status to pass
    updateStatus(req.id, "pass");
    toast.success(`${req.activatableServiceLabel || "Tjeneste"} aktivert — kravet er nå oppfylt`);
  };

  const handleLaraDraft = (req: NIS2Requirement) => {
    toast.success("Lara genererer utkast...", {
      description: `Et utkast for "${req.label}" vil bli tilgjengelig i dokumenter innen kort tid.`,
      duration: 4000,
    });
  };

  const summary = computeNIS2Summary(nis2Requirements, assessment, metadata);
  const agentBreakdown = computeNIS2AgentBreakdown(nis2Requirements);

  const getEffectiveStatus = (req: NIS2Requirement): NIS2Status => {
    const entry = assessment[req.id];
    return entry?.status ?? "not_assessed";
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">NIS2-samsvarsoversikt</CardTitle>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <Bot className="h-3 w-3" />
              Lara vurderte {summary.autoCheckedCount} av {summary.total} automatisk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {/* Circular progress */}
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${summary.percent}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                {summary.percent}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="text-center p-2 rounded-lg bg-status-closed/10">
                <div className="text-2xl font-bold text-status-closed">{summary.pass}</div>
                <div className="text-xs text-muted-foreground">Oppfylt</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-warning/10">
                <div className="text-2xl font-bold text-warning">{summary.partial}</div>
                <div className="text-xs text-muted-foreground">Delvis</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-destructive/10">
                <div className="text-2xl font-bold text-destructive">{summary.fail}</div>
                <div className="text-xs text-muted-foreground">Ikke oppfylt</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-muted-foreground">{summary.notAssessed}</div>
                <div className="text-xs text-muted-foreground">Gjenstår</div>
              </div>
            </div>
          </div>

          <Progress value={summary.percent} className="h-2" />

          {/* Agent capability breakdown */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-status-closed" />
              <span><strong className="text-foreground">{agentBreakdown.aiReady}</strong> Lara håndterer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span><strong className="text-foreground">{agentBreakdown.activatable}</strong> kan aktiveres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-warning" />
              <span><strong className="text-foreground">{agentBreakdown.assisted}</strong> assistert</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span><strong className="text-foreground">{agentBreakdown.manual}</strong> manuell</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements checklist */}
      <div className="space-y-2">
        {nis2Requirements.map((req) => {
          const entry = assessment[req.id];
          const status = getEffectiveStatus(req);
          const docs = docLists[req.id] || [];
          const isOpen = openItems[req.id] || false;
          const serviceActivated = req.activatableServiceId ? isServiceActive(req.activatableServiceId) : false;

          return (
            <Collapsible
              key={req.id}
              open={isOpen}
              onOpenChange={(o) => setOpenItems((p) => ({ ...p, [req.id]: o }))}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    {statusIcon(status)}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                        {req.label}
                        <span className="text-xs text-muted-foreground font-normal">
                          {req.articleRef}
                        </span>
                        {capabilityBadge(req.agentCapability)}
                        {entry?.autoChecked && (
                          <Badge variant="secondary" className="text-[13px] gap-1 h-5">
                            <Sparkles className="h-3 w-3" />
                            Automatisk vurdert
                          </Badge>
                        )}
                        {docs.length > 0 && (
                          <Badge variant="outline" className="text-[13px] h-5 gap-1">
                            <FileText className="h-3 w-3" />
                            {docs.length} dok.
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {req.description}
                      </p>
                    </div>
                    <Badge
                      variant={status === "pass" ? "default" : status === "partial" ? "secondary" : "outline"}
                      className="shrink-0 text-xs"
                    >
                      {statusLabel(status)}
                    </Badge>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {/* Agent action panel */}
                    {(req.agentCapability === "ai_ready" || req.agentCapability === "assisted") && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-status-closed/10/50 dark:bg-emerald-950/20 border border-status-closed/20/50 dark:border-status-closed/50">
                        <Bot className="h-5 w-5 text-status-closed dark:text-status-closed mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-status-closed dark:text-status-closed">Lara AI-agent</p>
                          <p className="text-xs text-status-closed/80 dark:text-status-closed/80 mt-0.5">{req.agentAction}</p>
                          {req.agentCapability === "assisted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs gap-1.5 border-status-closed/20 dark:border-status-closed text-status-closed dark:text-status-closed hover:bg-status-closed/10 dark:hover:bg-status-closed/30"
                              onClick={(e) => { e.stopPropagation(); handleLaraDraft(req); }}
                            >
                              <Sparkles className="h-3 w-3" />
                              Generer utkast med Lara
                            </Button>
                          )}
                        </div>
                        {entry?.autoChecked && (
                          <Badge variant="outline" className="text-[13px] gap-1 bg-status-closed/10 dark:bg-status-closed/40 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed shrink-0">
                            <ShieldCheck className="h-3 w-3" />
                            Verifisert
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Activatable service panel */}
                    {req.agentCapability === "activatable" && req.activatableServiceId && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10/50 dark:bg-blue-950/20 border border-primary/20/50 dark:border-primary/50">
                        <Zap className="h-5 w-5 text-primary dark:text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary dark:text-primary">{req.activatableServiceLabel}</p>
                          <p className="text-xs text-primary/80 dark:text-primary/80 mt-0.5">{req.agentAction}</p>
                          {serviceActivated ? (
                            <Badge variant="outline" className="mt-2 text-[13px] gap-1 bg-status-closed/10 dark:bg-status-closed/40 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktivert {activatedServices[req.activatableServiceId]?.activatedAt
                                ? new Date(activatedServices[req.activatableServiceId].activatedAt).toLocaleDateString("nb-NO")
                                : ""}
                            </Badge>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="mt-2 text-xs gap-1.5"
                              onClick={(e) => { e.stopPropagation(); handleActivateService(req); }}
                            >
                              <Zap className="h-3 w-3" />
                              Aktiver {req.activatableServiceLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Also show activatable for ai_ready items that have a service */}
                    {req.agentCapability === "ai_ready" && req.activatableServiceId && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10/50 dark:bg-blue-950/20 border border-primary/20/50 dark:border-primary/50">
                        <Zap className="h-5 w-5 text-primary dark:text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary dark:text-primary">{req.activatableServiceLabel}</p>
                          <p className="text-xs text-primary/80 dark:text-primary/80 mt-0.5">Kan også aktiveres som tjeneste for ekstra dekning.</p>
                          {serviceActivated ? (
                            <Badge variant="outline" className="mt-2 text-[13px] gap-1 bg-status-closed/10 dark:bg-status-closed/40 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktivert
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs gap-1.5"
                              onClick={(e) => { e.stopPropagation(); handleActivateService(req); }}
                            >
                              <Zap className="h-3 w-3" />
                              Aktiver {req.activatableServiceLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Manual requirement note */}
                    {req.agentCapability === "manual" && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-700/50">
                        <User className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Manuell handling påkrevd</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{req.agentAction}</p>
                        </div>
                      </div>
                    )}

                    {/* Description & recommendation */}
                    <div className="space-y-2">
                      <p className="text-sm">{req.description}</p>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                        <p className="text-xs font-medium text-primary mb-1">Anbefaling</p>
                        <p className="text-sm text-muted-foreground">{req.recommendation}</p>
                      </div>
                    </div>

                    {/* Status toggle */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium">Status:</label>
                      <Select
                        value={status}
                        onValueChange={(v) => updateStatus(req.id, v as NIS2Status)}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">✅ Oppfylt</SelectItem>
                          <SelectItem value="partial">⚠️ Delvis oppfylt</SelectItem>
                          <SelectItem value="fail">❌ Ikke oppfylt</SelectItem>
                          <SelectItem value="not_assessed">⬜ Ikke vurdert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Notater</label>
                      <Textarea
                        placeholder="Legg til notater, kommentarer eller begrunnelse..."
                        value={entry?.notes || ""}
                        onChange={(e) => updateNotes(req.id, e.target.value)}
                        onBlur={() => saveNotes(req.id)}
                        className="text-sm min-h-[80px]"
                      />
                    </div>

                    {/* Documents */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Dokumenter / evidens</label>
                        <div className="relative">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(req.id, file);
                              e.target.value = "";
                            }}
                            disabled={uploadingReq === req.id}
                          />
                          <Button variant="outline" size="sm" className="text-xs gap-1.5" disabled={uploadingReq === req.id}>
                            <Upload className="h-3 w-3" />
                            {uploadingReq === req.id ? "Laster opp..." : "Last opp"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Foreslåtte typer: {req.documentTypes.join(", ")}
                      </p>
                      {docs.length > 0 && (
                        <div className="space-y-1">
                          {docs.map((doc) => (
                            <div
                              key={doc.name}
                              className="flex items-center gap-2 text-xs p-2 rounded bg-background border"
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate">{doc.name}</span>
                              <span className="text-muted-foreground shrink-0">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString("nb-NO") : ""}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteDoc(req.id, doc.name)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    {entry?.updatedAt && (
                      <p className="text-[13px] text-muted-foreground">
                        Sist oppdatert: {new Date(entry.updatedAt).toLocaleString("nb-NO")}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Bottom progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Total NIS2-fremdrift</span>
            <span className="text-muted-foreground">{summary.percent}% fullført</span>
          </div>
          <Progress value={summary.percent} className="h-3" />
        </CardContent>
      </Card>
    </div>
  );
}
