import { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileText, Upload, Eye, EyeOff, MoreHorizontal, Replace, Trash2, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

const TYPE_GROUPS: { key: string; labelNb: string; labelEn: string; match: (t: string) => boolean }[] = [
  { key: "certificate", labelNb: "Sertifikater", labelEn: "Certificates", match: (t) => t === "certificate" },
  { key: "policy", labelNb: "Policyer", labelEn: "Policies", match: (t) => t === "policy" || t === "guideline" },
  { key: "dpa", labelNb: "Avtaler", labelEn: "Agreements", match: (t) => t === "dpa" },
  { key: "report", labelNb: "Rapporter", labelEn: "Reports", match: (t) => t === "report" },
  { key: "other", labelNb: "Andre dokumenter", labelEn: "Other documents", match: (t) => !["certificate", "policy", "guideline", "dpa", "report"].includes(t) },
];

export function DocumentationSection({ asset }: { asset: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState<{ url: string; name: string } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

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

  const grouped = useMemo(() => {
    return TYPE_GROUPS.map((g) => ({
      ...g,
      items: documents.filter((d: any) => g.match(d.document_type || "other")),
    })).filter((g) => g.items.length > 0);
  }, [documents]);

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
      toast.success("Ressurs lagt til");
    } catch (err) {
      console.error(err);
      toast.error("Opplasting feilet");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = replacingId;
    setReplacingId(null);
    if (!file || !docId || !asset?.id) return;
    try {
      const doc = documents.find((d: any) => d.id === docId);
      if (doc?.file_path) await supabase.storage.from("vendor-documents").remove([doc.file_path]);
      const filePath = `${asset.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("vendor-documents").upload(filePath, file);
      if (upErr) throw upErr;
      await supabase.from("vendor_documents").update({ file_name: file.name, file_path: filePath }).eq("id", docId);
      qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
      toast.success("Ressurs erstattet");
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke erstatte");
    } finally {
      if (replaceRef.current) replaceRef.current.value = "";
    }
  };

  const toggleVisibility = async (doc: any) => {
    const next = doc.visibility === "visible" ? "hidden" : "visible";
    await supabase.from("vendor_documents").update({ visibility: next }).eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
  };

  const removeDoc = async (doc: any) => {
    if (doc.file_path) await supabase.storage.from("vendor-documents").remove([doc.file_path]);
    await supabase.from("vendor_documents").delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
    toast.success("Ressurs fjernet");
  };

  const openDoc = async (doc: any) => {
    if (!doc.file_path) {
      toast.info("Ingen fil tilknyttet");
      return;
    }
    const { data } = await supabase.storage.from("vendor-documents").createSignedUrl(doc.file_path, 3600);
    if (data?.signedUrl) setReading({ url: data.signedUrl, name: doc.file_name });
  };

  return (
    <section id="documentation" className="space-y-5 scroll-mt-24">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Ressurser</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Sertifikater, policyer og avtaler som dokumenterer din etterlevelse.
          </p>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <input ref={replaceRef} type="file" className="hidden" onChange={handleReplace} />
        <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Plus className="h-4 w-4" />
          {uploading ? "Laster opp..." : "Legg til"}
        </Button>
      </div>

      {grouped.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Ingen ressurser lagt til ennå.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.labelNb}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">{group.items.length}</span>
              </div>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-border">
                  {group.items.map((doc: any) => {
                    const hidden = doc.visibility === "hidden";
                    return (
                      <li key={doc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                        <FileText className={`h-4 w-4 shrink-0 ${hidden ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                        <button
                          onClick={() => openDoc(doc)}
                          className={`flex-1 min-w-0 text-left text-sm truncate ${hidden ? "text-muted-foreground/60 line-through" : "text-foreground"} hover:text-primary transition-colors`}
                        >
                          {doc.file_name}
                        </button>
                        {hidden && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Skjult
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openDoc(doc)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Se dokument
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleVisibility(doc)}>
                              {hidden ? (
                                <><Eye className="h-3.5 w-3.5 mr-2" /> Vis på profil</>
                              ) : (
                                <><EyeOff className="h-3.5 w-3.5 mr-2" /> Skjul fra profil</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}>
                              <Replace className="h-3.5 w-3.5 mr-2" /> Erstatt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => removeDoc(doc)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Fjern
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}

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
