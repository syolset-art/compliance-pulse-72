import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, FileText, Upload, Trash2, Paperclip, CalendarDays, ShieldCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface DeliveriesTabProps {
  assetId: string;
}

const DELIVERY_CATEGORIES = [
  { value: "software", labelNb: "Programvare / SaaS", labelEn: "Software / SaaS" },
  { value: "consulting", labelNb: "Konsulenttjenester", labelEn: "Consulting Services" },
  { value: "infrastructure", labelNb: "Infrastruktur", labelEn: "Infrastructure" },
  { value: "support", labelNb: "Support og vedlikehold", labelEn: "Support & Maintenance" },
  { value: "data_processing", labelNb: "Databehandling", labelEn: "Data Processing" },
  { value: "hosting", labelNb: "Hosting / Drift", labelEn: "Hosting / Operations" },
  { value: "security", labelNb: "Sikkerhetstjenester", labelEn: "Security Services" },
  { value: "training", labelNb: "Opplæring", labelEn: "Training" },
  { value: "hardware", labelNb: "Maskinvare", labelEn: "Hardware" },
  { value: "other", labelNb: "Annet", labelEn: "Other" },
];

export function DeliveriesTab({ assetId }: DeliveriesTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSla, setShowSla] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "software",
    contract_value: "",
    contract_start: "",
    contract_end: "",
    notes: "",
    sla_uptime: "",
    sla_response_time: "",
    sla_support_hours: "",
    sla_notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["vendor-deliveries", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_deliveries")
        .select("*, vendor_documents(id, file_name, document_type)")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_deliveries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-deliveries", assetId] });
      toast.success(isNb ? "Leveranse slettet" : "Delivery deleted");
    },
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(isNb ? "Navn er påkrevd" : "Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      let contractDocId: string | null = null;

      // Upload contract file if selected
      if (selectedFile) {
        const filePath = `${assetId}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("vendor-documents")
          .upload(filePath, selectedFile);
        if (uploadError) throw uploadError;

        // Create vendor_documents entry so it appears in Documentation tab
        const { data: docData, error: docError } = await supabase
          .from("vendor_documents")
          .insert({
            asset_id: assetId,
            file_name: selectedFile.name,
            file_path: filePath,
            document_type: "contract",
            display_name: `${isNb ? "Avtale" : "Contract"}: ${form.name}`,
            source: "internal",
            status: "active",
            category: "contract",
            visibility: "private",
          })
          .select("id")
          .single();
        if (docError) throw docError;
        contractDocId = docData.id;
      }

      const { error } = await supabase.from("vendor_deliveries").insert({
        asset_id: assetId,
        name: form.name,
        description: form.description || null,
        category: form.category,
        contract_value: form.contract_value || null,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        notes: form.notes || null,
        contract_document_id: contractDocId,
        sla_uptime: form.sla_uptime || null,
        sla_response_time: form.sla_response_time || null,
        sla_support_hours: form.sla_support_hours || null,
        sla_notes: form.sla_notes || null,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["vendor-deliveries", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? "Leveranse lagt til" : "Delivery added");
      setShowAddDialog(false);
      setShowSla(false);
      setForm({ name: "", description: "", category: "software", contract_value: "", contract_start: "", contract_end: "", notes: "", sla_uptime: "", sla_response_time: "", sla_support_hours: "", sla_notes: "" });
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    const cat = DELIVERY_CATEGORIES.find((c) => c.value === value);
    return cat ? (isNb ? cat.labelNb : cat.labelEn) : value;
  };

  const getCategoryColor = (value: string) => {
    const colors: Record<string, string> = {
      software: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      consulting: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      infrastructure: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      support: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      data_processing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      hosting: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      security: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      training: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      hardware: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[value] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground italic p-8 text-center">{isNb ? "Laster…" : "Loading…"}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {isNb ? "Leveranser" : "Deliveries"}
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {isNb ? "Legg til leveranse" : "Add delivery"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isNb
              ? "Registrer hva denne leverandøren leverer til din organisasjon. Avtaledokumenter du laster opp her blir automatisk tilgjengelige i dokumentasjonsfanen."
              : "Register what this vendor delivers to your organization. Contract documents uploaded here are automatically available in the documentation tab."}
          </p>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isNb ? "Ingen leveranser registrert ennå" : "No deliveries registered yet"}
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {isNb ? "Legg til første leveranse" : "Add first delivery"}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-semibold uppercase">{isNb ? "Leveranse" : "Delivery"}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase">{isNb ? "Kategori" : "Category"}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase hidden md:table-cell">{isNb ? "Avtaleperiode" : "Contract period"}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase hidden sm:table-cell">{isNb ? "Avtale" : "Contract"}</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase hidden lg:table-cell">SLA</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d: any) => (
                  <TableRow key={d.id} className="group">
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{d.name}</span>
                        {d.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${getCategoryColor(d.category)}`}>
                        {getCategoryLabel(d.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {d.contract_start || d.contract_end ? (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {d.contract_start ? new Date(d.contract_start).toLocaleDateString("nb-NO") : "–"}
                          {" → "}
                          {d.contract_end ? new Date(d.contract_end).toLocaleDateString("nb-NO") : "–"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">–</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {d.vendor_documents ? (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <FileText className="h-3 w-3" />
                          {d.vendor_documents.file_name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">–</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {d.sla_uptime || d.sla_response_time || d.sla_support_hours ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-600" />
                          SLA
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(d.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNb ? "Legg til leveranse" : "Add delivery"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isNb ? "Navn på leveranse" : "Delivery name"} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={isNb ? "F.eks. CRM-lisens, IT-drift, Rådgivning" : "E.g. CRM license, IT operations"}
              />
            </div>
            <div>
              <Label>{isNb ? "Beskrivelse" : "Description"}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={isNb ? "Kort beskrivelse av leveransen" : "Short description"}
                rows={2}
              />
            </div>
            <div>
              <Label>{isNb ? "Kategori" : "Category"}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {isNb ? cat.labelNb : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isNb ? "Avtalestart" : "Contract start"}</Label>
                <Input
                  type="date"
                  value={form.contract_start}
                  onChange={(e) => setForm((f) => ({ ...f, contract_start: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isNb ? "Avtaleutløp" : "Contract end"}</Label>
                <Input
                  type="date"
                  value={form.contract_end}
                  onChange={(e) => setForm((f) => ({ ...f, contract_end: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>{isNb ? "Avtaledokument" : "Contract document"}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {isNb
                  ? "Last opp avtalen – den blir automatisk synlig i dokumentasjonsfanen."
                  : "Upload the contract – it will automatically appear in the documentation tab."}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span className="truncate">{selectedFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {isNb ? "Velg fil" : "Choose file"}
                  </>
                )}
              </Button>
            </div>

            {/* SLA Section */}
            <Collapsible open={showSla} onOpenChange={setShowSla}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-sm font-medium px-0 hover:bg-transparent">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    {isNb ? "Tjenestenivåavtale (SLA)" : "Service Level Agreement (SLA)"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showSla ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isNb ? "Oppetidskrav" : "Uptime requirement"}</Label>
                    <Input
                      value={form.sla_uptime}
                      onChange={(e) => setForm((f) => ({ ...f, sla_uptime: e.target.value }))}
                      placeholder={isNb ? "F.eks. 99.9%" : "E.g. 99.9%"}
                    />
                  </div>
                  <div>
                    <Label>{isNb ? "Responstid" : "Response time"}</Label>
                    <Input
                      value={form.sla_response_time}
                      onChange={(e) => setForm((f) => ({ ...f, sla_response_time: e.target.value }))}
                      placeholder={isNb ? "F.eks. 4 timer" : "E.g. 4 hours"}
                    />
                  </div>
                </div>
                <div>
                  <Label>{isNb ? "Støttetider" : "Support hours"}</Label>
                  <Input
                    value={form.sla_support_hours}
                    onChange={(e) => setForm((f) => ({ ...f, sla_support_hours: e.target.value }))}
                    placeholder={isNb ? "F.eks. 08:00–16:00 hverdager" : "E.g. 08:00–16:00 weekdays"}
                  />
                </div>
                <div>
                  <Label>{isNb ? "SLA-merknader" : "SLA notes"}</Label>
                  <Textarea
                    value={form.sla_notes}
                    onChange={(e) => setForm((f) => ({ ...f, sla_notes: e.target.value }))}
                    placeholder={isNb ? "Ytterligere SLA-vilkår eller merknader" : "Additional SLA terms or notes"}
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (isNb ? "Lagrer…" : "Saving…") : (isNb ? "Legg til" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
