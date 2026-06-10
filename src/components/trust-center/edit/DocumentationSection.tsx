import { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileText, Upload, Eye, MoreHorizontal, Replace, Trash2, Plus, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { DocumentAccessDialog } from "@/components/trust-center/DocumentAccessDialog";

const SHARED_TYPES = ["dpa", "pentest", "risk_assessment", "report"] as const;
type SharedType = (typeof SHARED_TYPES)[number];

const TYPE_GROUPS: { key: SharedType; labelNb: string; labelEn: string }[] = [
  { key: "dpa", labelNb: "Databehandleravtaler", labelEn: "Data processing agreements" },
  { key: "pentest", labelNb: "Pentest-rapporter", labelEn: "Pentest reports" },
  { key: "risk_assessment", labelNb: "ROS / Risikoanalyser", labelEn: "Risk assessments" },
  { key: "report", labelNb: "Andre rapporter", labelEn: "Other reports" },
];

export function DocumentationSection({ asset }: { asset: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState<{ url: string; name: string } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [accessDoc, setAccessDoc] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<SharedType>("dpa");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addName, setAddName] = useState("");

  const { data: documents = [] } = useQuery({
    queryKey: ["self-trust-shared-documents", asset?.id],
    queryFn: async () => {
      if (!asset?.id) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", asset.id)
        .in("document_type", SHARED_TYPES as unknown as string[])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const docIds = useMemo(() => documents.map((d: any) => d.id), [documents]);

  const { data: grantCounts = {} } = useQuery({
    queryKey: ["self-trust-shared-grants", docIds],
    queryFn: async () => {
      if (docIds.length === 0) return {} as Record<string, number>;
      const { data } = await (supabase as any)
        .from("trust_document_grants")
        .select("document_id, revoked_at")
        .in("document_id", docIds)
        .is("revoked_at", null);
      const counts: Record<string, number> = {};
      (data || []).forEach((g: any) => {
        counts[g.document_id] = (counts[g.document_id] || 0) + 1;
      });
      return counts;
    },
    enabled: docIds.length > 0,
  });

  const grouped = useMemo(() => {
    return TYPE_GROUPS.map((g) => ({
      ...g,
      items: documents.filter((d: any) => d.document_type === g.key),
    })).filter((g) => g.items.length > 0);
  }, [documents]);

  const openAddDialog = () => {
    setAddType("dpa");
    setAddFile(null);
    setAddName("");
    setAddOpen(true);
  };

  const handleAddFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Maks filstørrelse er 25 MB");
      return;
    }
    setAddFile(file);
    // Forhåndsutfyll navn med filnavn uten extension
    const base = file.name.replace(/\.[^.]+$/, "");
    setAddName((prev) => prev || base);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitAdd = async () => {
    if (!addFile || !asset?.id) return;
    const displayName = addName.trim() || addFile.name;
    setUploading(true);
    try {
      const filePath = `${asset.id}/${Date.now()}-${addFile.name}`;
      const { error: upErr } = await supabase.storage.from("vendor-documents").upload(filePath, addFile);
      if (upErr) throw upErr;
      const { data: inserted, error: insErr } = await supabase
        .from("vendor_documents")
        .insert({
          asset_id: asset.id,
          file_name: displayName,
          file_path: filePath,
          document_type: addType,
          visibility: "restricted",
        })
        .select()
        .single();
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["self-trust-shared-documents", asset.id] });
      toast.success("Dokument lagt til – velg mottakere");
      setAddOpen(false);
      if (inserted) setAccessDoc(inserted);
    } catch (err) {
      console.error(err);
      toast.error("Opplasting feilet");
    } finally {
      setUploading(false);
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
      qc.invalidateQueries({ queryKey: ["self-trust-shared-documents", asset.id] });
      toast.success("Dokument erstattet");
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
    qc.invalidateQueries({ queryKey: ["self-trust-shared-documents", asset.id] });
    toast.success("Dokument fjernet");
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
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Delt dokumentasjon</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Avtaler og rapporter du har delt med utvalgte kunder – f.eks. signerte databehandleravtaler,
            pentest-rapporter og ROS-analyser. Kun mottakere du gir tilgang ser disse.
          </p>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleAddFilePick} />
        <input ref={replaceRef} type="file" className="hidden" onChange={handleReplace} />
        <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={openAddDialog} disabled={uploading}>
          <Plus className="h-4 w-4" />
          Legg til
        </Button>
      </div>

      {grouped.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Ingen delte dokumenter ennå</p>
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
                    const count = grantCounts[doc.id] || 0;
                    return (
                      <li key={doc.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <button
                          onClick={() => openDoc(doc)}
                          className="flex-1 min-w-0 text-left text-sm truncate text-foreground hover:text-primary transition-colors"
                        >
                          {doc.file_name}
                        </button>
                        <Badge
                          variant={count > 0 ? "secondary" : "outline"}
                          className="shrink-0 gap-1 font-normal"
                        >
                          <Users className="h-3 w-3" />
                          {count > 0 ? `Delt med ${count}` : "Ingen mottakere"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setAccessDoc(doc)}>
                              <Users className="h-3.5 w-3.5 mr-2" /> Administrer tilgang
                            </DropdownMenuItem>
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
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}

      <DocumentAccessDialog
        open={!!accessDoc}
        onOpenChange={(o) => !o && setAccessDoc(null)}
        document={accessDoc}
      />

      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">{reading?.name}</DialogTitle>
          </DialogHeader>
          {reading && <iframe src={reading.url} className="flex-1 w-full rounded border border-border" title={reading.name} />}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={(o) => { if (!uploading) setAddOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Legg til dokument</DialogTitle>
            <DialogDescription>
              Last opp et dokument og gi det et navn som mottakerne ser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={addType} onValueChange={(v) => setAddType(v as SharedType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_GROUPS.map((g) => (
                    <SelectItem key={g.key} value={g.key}>{g.labelNb}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Fil</Label>
              {addFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{addFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddFile(null)} disabled={uploading}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Velg fil å laste opp
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Maks 25 MB</p>
            </div>

            {addFile && (
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="doc-display-name">Visningsnavn</Label>
                <Input
                  id="doc-display-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="F.eks. Databehandleravtale 2026"
                />
                <p className="text-xs text-muted-foreground">Dette er navnet mottakerne ser.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={uploading}>Avbryt</Button>
            <Button onClick={submitAdd} disabled={!addFile || uploading}>
              {uploading ? "Laster opp..." : "Legg til"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
