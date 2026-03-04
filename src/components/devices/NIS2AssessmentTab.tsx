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
} from "lucide-react";
import { toast } from "sonner";
import {
  nis2Requirements,
  computeNIS2Summary,
  type NIS2AssessmentMap,
  type NIS2Status,
  type NIS2Requirement,
} from "@/lib/nis2Requirements";

interface Props {
  assetId: string;
  metadata: Record<string, any>;
}

const statusIcon = (s: NIS2Status) => {
  switch (s) {
    case "pass":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "partial":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
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

export function NIS2AssessmentTab({ assetId, metadata }: Props) {
  const [assessment, setAssessment] = useState<NIS2AssessmentMap>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [uploadingReq, setUploadingReq] = useState<string | null>(null);
  const [docLists, setDocLists] = useState<Record<string, { name: string; created_at: string }[]>>({});
  const [saving, setSaving] = useState(false);

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
    // Refresh doc list for this requirement
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

  const summary = computeNIS2Summary(nis2Requirements, assessment, metadata);

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
        <CardContent>
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
              <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-600">{summary.pass}</div>
                <div className="text-xs text-muted-foreground">Oppfylt</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-500/10">
                <div className="text-2xl font-bold text-amber-600">{summary.partial}</div>
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

          <Progress value={summary.percent} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Requirements checklist */}
      <div className="space-y-2">
        {nis2Requirements.map((req) => {
          const entry = assessment[req.id];
          const status = getEffectiveStatus(req);
          const docs = docLists[req.id] || [];
          const isOpen = openItems[req.id] || false;

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
                        {entry?.autoChecked && (
                          <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                            <Sparkles className="h-3 w-3" />
                            Automatisk vurdert
                          </Badge>
                        )}
                        {docs.length > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5 gap-1">
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
                      <p className="text-[10px] text-muted-foreground">
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
