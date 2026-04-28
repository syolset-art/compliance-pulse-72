import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScanSearch, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { frameworks } from "@/lib/frameworkDefinitions";

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
  score?: number;
  implemented?: number;
  partial?: number;
  missing?: number;
  error?: string;
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
    const initial: RowResult[] = vendors
      .filter((v) => selected.has(v.id))
      .map((v) => ({ asset_id: v.id, name: v.name, status: "pending" }));
    setResults(initial);

    for (let i = 0; i < initial.length; i++) {
      const row = initial[i];
      setResults((prev) => prev.map((r) => (r.asset_id === row.asset_id ? { ...r, status: "running" } : r)));
      try {
        const { data, error } = await supabase.functions.invoke("analyze-vendor-gap", {
          body: { asset_id: row.asset_id, framework_id: framework },
        });
        if (error) throw error;
        const a = (data as any)?.analysis;
        setResults((prev) =>
          prev.map((r) =>
            r.asset_id === row.asset_id
              ? {
                  ...r,
                  status: "done",
                  score: a?.score ?? 0,
                  implemented: a?.implemented_count ?? 0,
                  partial: a?.partial_count ?? 0,
                  missing: a?.missing_count ?? 0,
                }
              : r
          )
        );
      } catch (e: any) {
        setResults((prev) =>
          prev.map((r) =>
            r.asset_id === row.asset_id ? { ...r, status: "error", error: e?.message || "Failed" } : r
          )
        );
      }
    }
    setRunning(false);
    toast.success(isNb ? "Bulk-analyse fullført" : "Bulk analysis complete");
  };

  const completedCount = results.filter((r) => r.status === "done").length;
  const totalCount = results.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            {isNb ? "Gap-analyse på prioriterte leverandører" : "Gap analysis on priority vendors"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Velg rammeverk og leverandører. Kjøringen scorer hver leverandør mot kravene."
              : "Choose framework and vendors. We score each vendor against the requirements."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {results.length === 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {isNb ? `Velg leverandører (${selected.size}/${vendors.length})` : `Select vendors (${selected.size}/${vendors.length})`}
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
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {isNb ? "Fremdrift" : "Progress"}: {completedCount}/{totalCount}
                </span>
              </div>
              <Progress value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} className="h-1.5" />
              <div className="border border-border rounded-lg max-h-[320px] overflow-y-auto divide-y divide-border">
                {results.map((r) => (
                  <div key={r.asset_id} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-5">
                      {r.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {r.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {r.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    <p className="flex-1 text-sm truncate">{r.name}</p>
                    {r.status === "done" && (
                      <>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            (r.score ?? 0) >= 75 ? "text-success" : (r.score ?? 0) >= 50 ? "text-warning" : "text-destructive"
                          )}
                        >
                          {r.score}%
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-success" />{r.implemented}
                          <AlertTriangle className="h-3 w-3 text-warning" />{r.partial}
                          <XCircle className="h-3 w-3 text-destructive" />{r.missing}
                        </span>
                      </>
                    )}
                    {r.status === "error" && (
                      <span className="text-xs text-destructive truncate">{r.error}</span>
                    )}
                  </div>
                ))}
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
            <Button onClick={() => setResults([])} variant="outline">
              {isNb ? "Ny kjøring" : "New run"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
