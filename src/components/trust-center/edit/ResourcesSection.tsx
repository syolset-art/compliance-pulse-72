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
import { FileText, Upload, Eye, MoreHorizontal, Replace, Trash2, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

const RESOURCE_TYPES = ["certificate", "policy", "guideline"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

const TYPE_GROUPS: { key: ResourceType; labelNb: string }[] = [
  { key: "certificate", labelNb: "Sertifikater" },
  { key: "policy", labelNb: "Policyer" },
  { key: "guideline", labelNb: "Andre retningslinjer" },
];

export function ResourcesSection({ asset }: { asset: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState<{ url: string; name: string } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<ResourceType>("certificate");

  const { data: documents = [] } = useQuery({
    queryKey: ["self-trust-resources", asset?.id],
    queryFn: async () => {
      if (!asset?.id) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", asset.id)
        .in("document_type", RESOURCE_TYPES as unknown as string[])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const grouped = useMemo(() => {
    return TYPE_GROUPS.map((g) => ({
      ...g,
      items: documents.filter((d: any) => d.document_type === g.key),
    })).filter((g) => g.items.length > 0);
  }, [documents]);

  const startUpload = (type: ResourceType) => {
    setPendingType(type);
    setTimeout(() => fileRef.current?.click(), 0);
  };

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
      const { error: insErr } = await supabase
        .from("vendor_documents")
        .insert({
          asset_id: asset.id,
          file_name: file.name,
          file_path: filePath,
          document_type: pendingType,
          visibility: "public",
        });
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["self-trust-resources", asset.id] });
      toast.success("Ressurs lastet opp");
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
      qc.invalidateQueries({ queryKey: ["self-trust-resources", asset.id] });
      toast.success("Ressurs erstattet");
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke erstatte");
    } finally {
      if (replaceRef.current) replaceRef.current.value = "";
    }
  };

  const removeDoc = async (doc: any) => {
    if (doc.file_path) await supabase.storage.from("vendor-documents").remove([doc.file_path]);
    await supabase.from("vendor_documents").delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["self-trust-resources", asset.id] });
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
    <section id="resources" className="space-y-5 scroll-mt-24">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Ressurser</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Sertifikater, policyer og andre retningslinjer du ønsker å vise åpent på Trust-profilen din.
          </p>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <input ref={replaceRef} type="file" className="hidden" onChange={handleReplace} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 shrink-0" disabled={uploading}>
              <Plus className="h-4 w-4" />
              {uploading ? "Laster opp..." : "Last opp"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {TYPE_GROUPS.map((g) => (
              <DropdownMenuItem key={g.key} onClick={() => startUpload(g.key)}>
                <Upload className="h-3.5 w-3.5 mr-2" /> {g.labelNb}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {grouped.length === 0 ? (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-muted-foreground">Ingen ressurser lagt til ennå</p>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => startUpload("certificate")}>
            <Plus className="h-3.5 w-3.5" /> Last opp
          </Button>
        </div>
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
                  {group.items.map((doc: any) => (
                    <li key={doc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <button
                        onClick={() => openDoc(doc)}
                        className="flex-1 min-w-0 text-left text-sm truncate text-foreground hover:text-primary transition-colors"
                      >
                        {doc.file_name}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDoc(doc)}>
                            <Eye className="h-3.5 w-3.5 mr-2" /> Se dokument
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
                  ))}
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
