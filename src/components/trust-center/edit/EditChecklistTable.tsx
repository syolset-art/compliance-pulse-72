import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2, Circle, AlertTriangle, Upload, Link as LinkIcon, Plus,
  ExternalLink, MoreHorizontal, Trash2, Scale, BookOpen, FileText, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type RowKind = "resource" | "compliance";
type RowStatus = "ok" | "partial" | "missing";

type ChecklistRow = {
  key: string;
  label: string;
  hint?: string;
  kind: RowKind;
  /** Storage doc_type — defines where the upload lands in ResourcesSection / framework views. */
  documentType: "certificate" | "policy" | "guideline" | "dpa";
  /** When set, the upload/link will be tagged with this framework id (linked_regulations). */
  frameworkId?: string;
  status: RowStatus;
  /** Existing document attached to this row (if any). */
  existing?: {
    id: string;
    file_name?: string | null;
    file_path?: string | null;
    external_url?: string | null;
  };
  /** Special: privacy policy lives directly on the asset. */
  privacyLink?: { url: string | null };
};

export function EditChecklistTable({
  asset,
  frameworks,
  onAddFramework,
}: {
  asset: any;
  frameworks: any[];
  onAddFramework: () => void;
}) {
  const qc = useQueryClient();
  const assetId = asset?.id as string | undefined;

  const { data: documents = [] } = useQuery({
    queryKey: ["edit-checklist-docs", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, file_name, file_path, document_type, external_url, linked_regulations, display_name")
        .eq("asset_id", assetId);
      return data || [];
    },
    enabled: !!assetId,
  });

  const findResourceDoc = (type: ChecklistRow["documentType"]) =>
    (documents as any[]).find(
      (d) => d.document_type === type && (!d.linked_regulations || d.linked_regulations.length === 0),
    );

  const findFrameworkDoc = (frameworkId: string) =>
    (documents as any[]).find(
      (d) => Array.isArray(d.linked_regulations) && d.linked_regulations.includes(frameworkId),
    );

  const rows: ChecklistRow[] = useMemo(() => {
    const list: ChecklistRow[] = [];

    // Resource rows (faste sjekkpunkter)
    list.push({
      key: "privacy-policy",
      label: "Personvernerklæring",
      hint: "Lenke til personvernerklæringen på nettsiden",
      kind: "resource",
      documentType: "policy",
      status: asset?.privacy_policy_url ? "ok" : "missing",
      privacyLink: { url: asset?.privacy_policy_url ?? null },
    });

    const dpa = findResourceDoc("dpa");
    list.push({
      key: "dpa",
      label: "Databehandleravtale (mal)",
      hint: "Standard DPA-mal dere bruker mot kunder",
      kind: "resource",
      documentType: "dpa",
      status: dpa ? "ok" : "missing",
      existing: dpa,
    });

    const secPolicy = (documents as any[]).find(
      (d) => d.document_type === "policy" && /sikkerhet|security/i.test(d.display_name || d.file_name || ""),
    );
    list.push({
      key: "security-policy",
      label: "Sikkerhetspolicy",
      hint: "Overordnet policy for informasjonssikkerhet",
      kind: "resource",
      documentType: "policy",
      status: secPolicy ? "ok" : "missing",
      existing: secPolicy,
    });

    const cert = findResourceDoc("certificate");
    list.push({
      key: "certificate",
      label: "Sertifikat (ISO/SOC e.l.)",
      hint: "Last opp gyldig sertifikat eller revisjonsrapport",
      kind: "resource",
      documentType: "certificate",
      status: cert ? "ok" : "missing",
      existing: cert,
    });

    const guideline = findResourceDoc("guideline");
    list.push({
      key: "guideline",
      label: "Retningslinjer for ansatte",
      hint: "Interne retningslinjer, kjøreregler, opplæring",
      kind: "resource",
      documentType: "guideline",
      status: guideline ? "ok" : "missing",
      existing: guideline,
    });

    // Compliance rows — én per aktivert framework
    for (const fw of frameworks) {
      const doc = findFrameworkDoc(fw.framework_id);
      list.push({
        key: `fw-${fw.framework_id}`,
        label: fw.framework_name,
        hint: "Dokumentasjon eller lenke som viser etterlevelse",
        kind: "compliance",
        documentType: "certificate",
        frameworkId: fw.framework_id,
        status: doc ? "ok" : "missing",
        existing: doc,
      });
    }

    return list;
  }, [asset, frameworks, documents]);

  const totals = useMemo(() => {
    const ok = rows.filter((r) => r.status === "ok").length;
    return { ok, total: rows.length };
  }, [rows]);

  // ───── Actions ─────────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingRow, setPendingRow] = useState<ChecklistRow | null>(null);
  const [linkDialogRow, setLinkDialogRow] = useState<ChecklistRow | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const startUpload = (row: ChecklistRow) => {
    setPendingRow(row);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const openLinkDialog = (row: ChecklistRow) => {
    setLinkValue(row.privacyLink?.url || row.existing?.external_url || "");
    setLinkDialogRow(row);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const row = pendingRow;
    setPendingRow(null);
    if (!file || !row || !assetId) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Maks filstørrelse er 25 MB");
      return;
    }
    setBusyKey(row.key);
    try {
      const filePath = `${assetId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("vendor-documents").upload(filePath, file);
      if (upErr) throw upErr;
      const insertPayload: any = {
        asset_id: assetId,
        file_name: file.name,
        file_path: filePath,
        document_type: row.documentType,
        visibility: "published",
        display_name: row.label,
      };
      if (row.frameworkId) insertPayload.linked_regulations = [row.frameworkId];
      const { error: insErr } = await supabase.from("vendor_documents").insert(insertPayload);
      if (insErr) throw insErr;
      await qc.invalidateQueries({ queryKey: ["edit-checklist-docs", assetId] });
      await qc.invalidateQueries({ queryKey: ["self-trust-resources", assetId] });
      toast.success("Dokument lastet opp");
    } catch (err) {
      console.error(err);
      toast.error("Opplasting feilet");
    } finally {
      setBusyKey(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveLink = async () => {
    const row = linkDialogRow;
    if (!row || !assetId) return;
    const url = linkValue.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error("Lenken må starte med http:// eller https://");
      return;
    }
    setBusyKey(row.key);
    try {
      if (row.key === "privacy-policy") {
        const { error } = await supabase
          .from("assets")
          .update({ privacy_policy_url: url || null })
          .eq("id", assetId);
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["self-asset-edit"] });
        await qc.invalidateQueries({ queryKey: ["self-trust-asset"] });
      } else if (row.existing) {
        const { error } = await supabase
          .from("vendor_documents")
          .update({ external_url: url || null })
          .eq("id", row.existing.id);
        if (error) throw error;
      } else {
        const payload: any = {
          asset_id: assetId,
          document_type: row.documentType,
          visibility: "published",
          display_name: row.label,
          file_name: row.label,
          external_url: url,
        };
        if (row.frameworkId) payload.linked_regulations = [row.frameworkId];
        const { error } = await supabase.from("vendor_documents").insert(payload);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["edit-checklist-docs", assetId] });
      await qc.invalidateQueries({ queryKey: ["self-trust-resources", assetId] });
      toast.success("Lenke lagret");
      setLinkDialogRow(null);
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke lagre lenken");
    } finally {
      setBusyKey(null);
    }
  };

  const removeRow = async (row: ChecklistRow) => {
    if (!assetId) return;
    setBusyKey(row.key);
    try {
      if (row.key === "privacy-policy") {
        await supabase.from("assets").update({ privacy_policy_url: null }).eq("id", assetId);
        await qc.invalidateQueries({ queryKey: ["self-asset-edit"] });
      } else if (row.existing) {
        if (row.existing.file_path) {
          await supabase.storage.from("vendor-documents").remove([row.existing.file_path]);
        }
        await supabase.from("vendor_documents").delete().eq("id", row.existing.id);
      }
      await qc.invalidateQueries({ queryKey: ["edit-checklist-docs", assetId] });
      await qc.invalidateQueries({ queryKey: ["self-trust-resources", assetId] });
      toast.success("Fjernet");
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke fjerne");
    } finally {
      setBusyKey(null);
    }
  };

  // ───── Render ──────────────────────────────────────────────────────────────
  const statusPill = (s: RowStatus) => {
    if (s === "ok")
      return (
        <span className="inline-flex items-center gap-1.5 text-success text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" /> På plass
        </span>
      );
    if (s === "partial")
      return (
        <span className="inline-flex items-center gap-1.5 text-warning text-sm font-medium">
          <AlertTriangle className="h-4 w-4" /> Delvis
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
        <Circle className="h-4 w-4" /> Mangler
      </span>
    );
  };

  const attachedSummary = (row: ChecklistRow) => {
    if (row.privacyLink?.url) {
      return (
        <a
          href={row.privacyLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <LinkIcon className="h-3 w-3" /> {row.privacyLink.url.replace(/^https?:\/\//, "").slice(0, 40)}
        </a>
      );
    }
    const ex = row.existing;
    if (!ex) return null;
    if (ex.external_url) {
      return (
        <a
          href={ex.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <LinkIcon className="h-3 w-3" /> {ex.external_url.replace(/^https?:\/\//, "").slice(0, 40)}
        </a>
      );
    }
    if (ex.file_name) {
      return (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <FileText className="h-3 w-3" /> {ex.file_name}
        </span>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">Hva mangler og hva er på plass</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Legg ved en lenke eller last opp dokument. Ressurser vises under <em>Ressurser</em>, mens
            regelverk-dokumenter knyttes til <em>Compliance</em>.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {totals.ok}/{totals.total}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Element</th>
              <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground text-right">Handling</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const filled = row.status === "ok";
              return (
                <tr key={row.key} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">{row.label}</div>
                    {row.hint && <div className="text-xs text-muted-foreground mt-0.5">{row.hint}</div>}
                    {attachedSummary(row) && <div className="mt-1.5">{attachedSummary(row)}</div>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.kind === "compliance" ? (
                      <Badge variant="outline" className="gap-1">
                        <Scale className="h-3 w-3" /> Compliance
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" /> Ressurs
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">{statusPill(row.status)}</td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {row.key === "privacy-policy" ? (
                        <Button
                          size="sm"
                          variant={filled ? "outline" : "default"}
                          className="gap-1.5"
                          disabled={busyKey === row.key}
                          onClick={() => openLinkDialog(row)}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {filled ? "Endre lenke" : "Legg til lenke"}
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant={filled ? "outline" : "default"}
                              className="gap-1.5"
                              disabled={busyKey === row.key}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {filled ? "Endre" : "Legg til"}
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openLinkDialog(row)}>
                              <LinkIcon className="h-3.5 w-3.5 mr-2" /> Lim inn lenke
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startUpload(row)}>
                              <Upload className="h-3.5 w-3.5 mr-2" /> Last opp dokument
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {filled && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(row)}
                          disabled={busyKey === row.key}
                          aria-label="Fjern"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Footer row: add framework */}
            <tr className="border-t border-border bg-muted/10">
              <td className="px-4 py-3" colSpan={4}>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={onAddFramework}>
                  <Plus className="h-4 w-4" /> Legg til regelverk
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Link dialog */}
      <Dialog open={!!linkDialogRow} onOpenChange={(o) => !o && setLinkDialogRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkDialogRow?.label} — legg ved lenke</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="checklist-link">URL</Label>
            <Input
              id="checklist-link"
              type="url"
              placeholder="https://..."
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lenken vises på Trust-profilen og under{" "}
              {linkDialogRow?.kind === "compliance" ? "Compliance" : "Ressurser"}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkDialogRow(null)}>
              Avbryt
            </Button>
            <Button onClick={saveLink} disabled={busyKey === linkDialogRow?.key}>
              Lagre lenke <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
