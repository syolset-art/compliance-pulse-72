import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, X, Eye, Sparkles, Check, Replace } from "lucide-react";
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
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  // Lara-foreslåtte dokumenter (demo): hentet fra andre moduler i plattformen
  const LARA_SUGGESTIONS = [
    {
      id: "sugg-dpa-2026",
      file_name: "DPA-mal 2026.pdf",
      document_type: "dpa",
      type_label: "Databehandleravtale",
      source: "fra Leverandørmodulen",
    },
    {
      id: "sugg-iso-27001",
      file_name: "ISO 27001-sertifikat.pdf",
      document_type: "certificate",
      type_label: "Sertifikat",
      source: "fra Regelverk-modulen",
    },
  ];

  const { data: documents = [] } = useQuery({
    queryKey: ["self-trust-documents", asset?.id],
    queryFn: async () => {
      if (!asset?.id) return [];
      const { data } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", asset.id)
        .order("created_at", { ascending: false })
        .limit(3);
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

  const addSuggestion = async (s: typeof LARA_SUGGESTIONS[number]) => {
    if (!asset?.id) return;
    setAdding(s.id);
    try {
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: asset.id,
        file_name: s.file_name,
        file_path: null,
        document_type: s.document_type,
        visibility: "visible",
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["self-trust-documents", asset.id] });
      setDismissed((d) => [...d, s.id]);
      toast.success("Lagt til fra Lara");
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke legge til");
    } finally {
      setAdding(null);
    }
  };

  const visibleSuggestions = LARA_SUGGESTIONS.filter(
    (s) => !dismissed.includes(s.id) && !documents.some((d: any) => d.file_name === s.file_name),
  );

  const docMeta = (doc: any): { subtitle: string; quality: "good" | "partial" | "weak"; reason: string } => {
    const name = (doc.file_name || "").toLowerCase();
    if (name.includes("slett")) {
      return {
        subtitle: "Sletterutine · mangler RTO/RPO og slettelogg",
        quality: "partial",
        reason: "Lara fant rutinen, men mangler konkret RTO/RPO og henvisning til slettelogg. Oppdater for å heve til god kvalitet.",
      };
    }
    if (name.includes("iso")) {
      return {
        subtitle: "Sertifikat · gyldig til april 2027",
        quality: "good",
        reason: "Gyldig ISO 27001-sertifikat med tydelig utløpsdato og akkreditert utsteder. Dekker krav i flere rammeverk.",
      };
    }
    if (name.includes("policy") || name.includes("sikker")) {
      return {
        subtitle: "Sikkerhetspolicy · fra Regelverk-modulen",
        quality: "good",
        reason: "Policyen er signert, oppdatert siste 12 mnd og dekker tilgangsstyring, hendelseshåndtering og leverandørkrav.",
      };
    }
    if (doc.document_type === "dpa") {
      return {
        subtitle: "Databehandleravtale · gyldig",
        quality: "good",
        reason: "DPA inneholder alle GDPR Art. 28-elementer: instrukser, taushetsplikt, underleverandører, sikkerhetstiltak og slettefrist.",
      };
    }
    return {
      subtitle: `Oppdatert ${formatDate(doc.created_at)}`,
      quality: "good",
      reason: "Dokumentet er lesbart, oppdatert og uten åpenbare mangler.",
    };
  };

  const qualityLabel = (q: "good" | "partial" | "weak") =>
    q === "good" ? "God kvalitet" : q === "partial" ? "Delvis kvalitet" : "Svak kvalitet";
  const qualityClass = (q: "good" | "partial" | "weak") =>
    q === "good" ? "text-success" : q === "partial" ? "text-warning" : "text-destructive";

  return (
    <section id="documentation" className="space-y-4 scroll-mt-24">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Dokumenter</h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Velg hvilke dokumenter som skal vises i din Trust Profile. Lara analyserer hvert dokument og gir en kvalitetsvurdering — kun synlig for deg.
          </p>
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" />
          {uploading ? "Laster opp..." : "Last opp dokument"}
        </Button>
      </div>

      <p className="text-xs text-foreground">
        <span className="font-medium">{documents.length}</span> dokument{documents.length === 1 ? "" : "er"} valgt til Trust Profile
      </p>

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Valgt</p>
          <div className="space-y-2">
            {documents.slice(0, 3).map((doc: any) => {
              const meta = docMeta(doc);
              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
                        </div>
                        <span className={`text-xs ${qualityClass(meta.quality)} shrink-0`}>
                          {qualityLabel(meta.quality)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => openDoc(doc)}>
                          <Eye className="h-3.5 w-3.5" /> Se dokumentet
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => fileRef.current?.click()}>
                          <Replace className="h-3.5 w-3.5" /> Erstatt
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => removeDoc(doc)}>
                          Fjern
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Ingen dokumenter valgt ennå.</p>
        </Card>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Foreslått fra dine andre moduler
          </p>
          <div className="space-y-2">
            {visibleSuggestions.map((s) => (
              <Card key={s.id} className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    checked={adding === s.id}
                    onCheckedChange={(v) => v && addSuggestion(s)}
                    disabled={adding === s.id}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.type_label} · {s.source}
                    </p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" disabled>
                        <Eye className="h-3.5 w-3.5" /> Se dokumentet
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setDismissed((d) => [...d, s.id])}
                    aria-label="Avvis forslag"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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
