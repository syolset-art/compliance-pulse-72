import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, X, Eye } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = [
  { value: "dpa", label: "Databehandleravtale (DPA)" },
  { value: "certificate", label: "Sertifikat" },
  { value: "policy", label: "Policy" },
  { value: "report", label: "Rapport" },
  { value: "guideline", label: "Retningslinje" },
  { value: "other", label: "Annet" },
];

export function DocumentationSection({ asset }: { asset: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState<{ url: string; name: string } | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["self-trust-documents", asset?.id],
    queryFn: async () => {
      if (!asset?.id) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", asset.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset?.id) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Maks filstørrelse er 25 MB");
      return;
    }
    setUploading(true);
    try {
      const filePath = `${asset.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("vendor-documents").upload(filePath, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("vendor_documents").insert({
        asset_id: asset.id,
        file_name: file.name,
        file_path: filePath,
        document_type: "other",
        visibility: "visible",
      });
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
      toast.success("Dokument lastet opp");
    } catch (err) {
      console.error(err);
      toast.error("Opplasting feilet");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const togglePublic = async (doc: any) => {
    const next = doc.visibility === "visible" ? "hidden" : "visible";
    await supabase.from("vendor_documents").update({ visibility: next }).eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
  };

  const updateType = async (id: string, type: string) => {
    await supabase.from("vendor_documents").update({ document_type: type }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
  };

  const removeDoc = async (doc: any) => {
    if (doc.file_path) await supabase.storage.from("vendor-documents").remove([doc.file_path]);
    await supabase.from("vendor_documents").delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
    toast.success("Dokument fjernet");
  };

  const openDoc = async (doc: any) => {
    if (!doc.file_path) return;
    const { data } = await supabase.storage.from("vendor-documents").createSignedUrl(doc.file_path, 3600);
    if (data?.signedUrl) setReading({ url: data.signedUrl, name: doc.file_name });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("nb-NO");

  return (
    <section id="documentation" className="space-y-4 scroll-mt-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dokumentasjon</h2>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <Button size="sm" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" />
          {uploading ? "Laster opp..." : "Last opp dokument"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Last opp dokumenter som støtter din Trust Profile — DPA-er, sertifikater og policyer.
        Dette er den eneste delen av profilen som krever manuell input — alt annet genereres av Lara.
      </p>

      <Card className="divide-y divide-border">
        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Ingen dokumenter lastet opp ennå.</p>
          </div>
        ) : (
          documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 p-4">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={doc.document_type}
                    onChange={(e) => updateType(doc.id, e.target.value)}
                    className="text-[11px] px-2 py-0.5 rounded border border-border bg-background"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground">oppdatert {formatDate(doc.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Offentlig</span>
                <Switch checked={doc.visibility === "visible"} onCheckedChange={() => togglePublic(doc)} />
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openDoc(doc)}>
                <Eye className="h-3.5 w-3.5" /> Les
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeDoc(doc)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </Card>

      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">{reading?.name}</DialogTitle>
          </DialogHeader>
          {reading && <iframe src={reading.url} className="flex-1 w-full rounded border border-border" title={reading.name} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
