import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Shield, FileCheck, ChevronRight, ChevronLeft, Check,
  Building2, Calendar, Upload, Paperclip, X, BookOpen, Save, Network, Sparkles, Languages,
} from "lucide-react";
import { toast } from "sonner";

// --- Template storage (localStorage demo) ---
const TEMPLATES_KEY = "mynder_request_templates";

interface SavedTemplate {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  requestTypes: string[]; // which request types it's relevant for
}

function getSavedTemplates(): SavedTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch { return []; }
}

function saveTemplate(template: SavedTemplate) {
  const existing = getSavedTemplates();
  existing.push(template);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(existing));
}

function removeTemplate(id: string) {
  const existing = getSavedTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(existing));
}

// --- Request types ---
const REQUEST_TYPES = [
  { value: "vendor_assessment", labelNb: "Leverandørvurdering", labelEn: "Vendor Assessment", icon: FileText,
    descNb: "En helhetlig vurdering av leverandørens sikkerhet, personvern og compliance-praksis. Brukes for å kartlegge risiko ved bruk av leverandøren.",
    descEn: "A comprehensive assessment of the vendor's security, privacy and compliance practices. Used to map risks associated with the vendor." },
  { value: "dpa", labelNb: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement", icon: FileCheck,
    descNb: "Avtale som regulerer hvordan leverandøren behandler personopplysninger på deres vegne (påkrevd av GDPR art. 28).",
    descEn: "Agreement governing how the vendor processes personal data on your behalf (required by GDPR Art. 28)." },
  { value: "iso_documentation", labelNb: "ISO 27001 dokumentasjon", labelEn: "ISO 27001 Documentation", icon: Shield,
    descNb: "Forespørsel om sertifikat eller dokumentasjon som viser at leverandøren følger ISO 27001 for informasjonssikkerhet.",
    descEn: "Request for certificate or documentation showing the vendor follows ISO 27001 for information security." },
  { value: "soc2", labelNb: "SOC 2-rapport", labelEn: "SOC 2 Report", icon: FileText,
    descNb: "Uavhengig revisjonsrapport som bekrefter leverandørens kontroller for sikkerhet, tilgjengelighet og konfidensialitet.",
    descEn: "Independent audit report confirming the vendor's controls for security, availability and confidentiality." },
  { value: "gdpr_report", labelNb: "GDPR-rapport", labelEn: "GDPR Report", icon: FileText,
    descNb: "Oversikt over leverandørens GDPR-etterlevelse, inkludert behandlingsaktiviteter og tekniske tiltak.",
    descEn: "Overview of the vendor's GDPR compliance, including processing activities and technical measures." },
  { value: "hms_documentation", labelNb: "HMS-dokumentasjon", labelEn: "HSE Documentation", icon: Shield,
    descNb: "Dokumentasjon på leverandørens helse-, miljø- og sikkerhetsarbeid (relevant for fysiske tjenester og arbeid på lokasjon).",
    descEn: "Documentation of the vendor's health, safety and environment practices (relevant for physical services and on-site work)." },
  { value: "quality_certification", labelNb: "Kvalitetssertifisering", labelEn: "Quality Certification", icon: FileCheck,
    descNb: "Sertifikat eller dokumentasjon som viser at leverandøren har et kvalitetsstyringssystem (f.eks. ISO 9001).",
    descEn: "Certificate or documentation showing the vendor has a quality management system (e.g. ISO 9001)." },
  { value: "audit_report", labelNb: "Internrevisjonsrapport", labelEn: "Internal Audit Report", icon: FileText,
    descNb: "Forespørsel om leverandørens siste internrevisjonsrapport for innsyn i deres egenkontroll.",
    descEn: "Request for the vendor's latest internal audit report for insight into their self-assessment." },
];

const TOTAL_STEPS = 4;

interface SendRequestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (types: string[], vendorIds: string[], dueDate: string, vendorNames?: Record<string, string>) => void;
}

export function SendRequestWizard({ open, onOpenChange, onSend }: SendRequestWizardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedTemplateIds, setAttachedTemplateIds] = useState<string[]>([]);
  const [showSavePrompt, setShowSavePrompt] = useState<File | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<SavedTemplate[]>(getSavedTemplates);

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-for-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, vendor_category, gdpr_role")
        .eq("asset_type", "vendor")
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const dataProcessors = vendors.filter((v: any) => v.gdpr_role === "databehandler");

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const selectAllProcessors = () => {
    const ids = dataProcessors.map((v: any) => v.id);
    setSelectedVendors((prev) => {
      const allSelected = ids.every((id: string) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleFileUpload = (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isNb ? "Filen er for stor. Maks 20 MB." : "File too large. Max 20 MB.");
      return;
    }
    setAttachedFiles((prev) => [...prev, file]);
    // Ask if they want to save as template
    setShowSavePrompt(file);
    setSaveTemplateName(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSaveAsTemplate = () => {
    if (!showSavePrompt || !saveTemplateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: `tpl-${Date.now()}`,
      name: saveTemplateName.trim(),
      fileName: showSavePrompt.name,
      fileSize: showSavePrompt.size,
      createdAt: new Date().toISOString(),
      requestTypes: selectedTypes,
    };
    saveTemplate(newTemplate);
    setTemplates(getSavedTemplates());
    toast.success(isNb ? "Mal lagret for gjenbruk" : "Template saved for reuse");
    setShowSavePrompt(null);
    setSaveTemplateName("");
  };

  const toggleTemplate = (id: string) => {
    setAttachedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    // Build vendor name map for display
    const vendorNames: Record<string, string> = {};
    vendors.forEach((v: any) => { vendorNames[v.id] = v.name; });
    onSend(selectedTypes, selectedVendors, dueDate, vendorNames);

    // Also persist to localStorage so it shows on the Forespørsler page
    const STORAGE_KEY = "mynder_outbound_requests";
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const newRequests = selectedTypes.flatMap((type) =>
        selectedVendors.map((id, i) => ({
          id: `out-new-${Date.now()}-${type}-${i}`,
          vendor_name: vendorNames[id] || `Leverandør ${id.substring(0, 6)}`,
          request_type: type,
          status: "awaiting" as const,
          due_date: dueDate,
          sent_date: new Date().toISOString().split("T")[0],
        }))
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newRequests, ...existing]));
      window.dispatchEvent(new Event("outbound-requests-updated"));
    } catch {}

    toast.success(isNb ? `${selectedTypes.length} forespørsel(er) sendt til ${selectedVendors.length} leverandør(er)` : `${selectedTypes.length} request(s) sent to ${selectedVendors.length} vendor(s)`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedTypes([]);
    setSelectedVendors([]);
    setAttachedFiles([]);
    setAttachedTemplateIds([]);
    setShowSavePrompt(null);
    onOpenChange(false);
  };

  const selectedTypeNames = REQUEST_TYPES.filter((t) => selectedTypes.includes(t.value));
  const totalAttachments = attachedFiles.length + attachedTemplateIds.length;

  // Filter templates relevant to selected request types
  const relevantTemplates = templates.filter(
    (t) => t.requestTypes.length === 0 || t.requestTypes.some((rt) => selectedTypes.includes(rt))
  );
  const otherTemplates = templates.filter(
    (t) => t.requestTypes.length > 0 && !t.requestTypes.some((rt) => selectedTypes.includes(rt))
  );

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNb ? "Send melding til leverandører" : "Send message to vendors"}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Choose types */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Hva slags forespørsler vil du sende? Du kan velge flere." : "What types of requests do you want to send? You can select multiple."}
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {REQUEST_TYPES.map((rt) => (
                <label
                  key={rt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedTypes.includes(rt.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleType(rt.value)}
                >
                  <Checkbox
                    checked={selectedTypes.includes(rt.value)}
                    onCheckedChange={() => toggleType(rt.value)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <rt.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{isNb ? rt.labelNb : rt.labelEn}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {isNb ? rt.descNb : rt.descEn}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedTypes.length} {isNb ? "valgt" : "selected"}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Select vendors */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/10 dark:bg-blue-950/30 border border-primary/20 dark:border-primary mb-2">
              <Network className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[13px] text-primary dark:text-primary">
                {isNb
                  ? "Du kan bare sende forespørsler til leverandører som er registrert i systemet ditt."
                  : "You can only send requests to vendors registered in your system."}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Velg leverandører" : "Select vendors"}
              </p>
              {dataProcessors.length > 0 && (
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectAllProcessors}>
                  {isNb ? "Velg alle databehandlere" : "Select all data processors"}
                  <Badge variant="secondary" className="ml-1 text-[13px]">{dataProcessors.length}</Badge>
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
              {vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isNb ? "Ingen leverandører registrert ennå" : "No vendors registered yet"}
                </p>
              ) : (
                vendors.map((v: any) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                      selectedVendors.includes(v.id) ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedVendors.includes(v.id)}
                      onCheckedChange={() => toggleVendor(v.id)}
                    />
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{v.name}</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {v.vendor_category && (
                          <Badge variant="outline" className="text-[13px] capitalize">{v.vendor_category}</Badge>
                        )}
                        {v.gdpr_role && (
                          <Badge variant="secondary" className="text-[13px] capitalize">{v.gdpr_role}</Badge>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedVendors.length} {isNb ? "valgt" : "selected"}
            </p>
          </div>
        )}

        {/* Step 3: Attachments */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Vil du legge ved egne maler eller dokumenter? F.eks. en egen DPA-mal leverandøren skal fylle ut."
                : "Want to attach your own templates or documents? E.g. a custom DPA template for the vendor to fill out."}
            </p>

            {/* Save-as-template prompt */}
            {showSavePrompt && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Save className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium">
                      {isNb
                        ? "Vil du lagre dette dokumentet som en gjenbrukbar mal?"
                        : "Save this document as a reusable template?"}
                    </p>
                    <Input
                      placeholder={isNb ? "Gi malen et navn..." : "Name the template..."}
                      value={saveTemplateName}
                      onChange={(e) => setSaveTemplateName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveAsTemplate}>
                        <Save className="h-3 w-3 mr-1" /> {isNb ? "Lagre mal" : "Save template"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowSavePrompt(null)}>
                        {isNb ? "Nei takk" : "No thanks"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Saved templates */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {isNb ? "Lagrede maler" : "Saved templates"}
                </Label>
                <div className="max-h-36 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {(relevantTemplates.length > 0 ? relevantTemplates : templates).map((tpl) => (
                    <label
                      key={tpl.id}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                        attachedTemplateIds.includes(tpl.id) ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={attachedTemplateIds.includes(tpl.id)}
                        onCheckedChange={() => toggleTemplate(tpl.id)}
                      />
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <p className="text-[13px] text-muted-foreground">{tpl.fileName} · {(tpl.fileSize / 1024).toFixed(0)} KB</p>
                      </div>
                    </label>
                  ))}
                  {relevantTemplates.length > 0 && otherTemplates.length > 0 && (
                    <>
                      <div className="px-3 py-1">
                        <span className="text-[13px] text-muted-foreground uppercase tracking-wide">
                          {isNb ? "Andre maler" : "Other templates"}
                        </span>
                      </div>
                      {otherTemplates.map((tpl) => (
                        <label
                          key={tpl.id}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors opacity-70 ${
                            attachedTemplateIds.includes(tpl.id) ? "bg-primary/5 opacity-100" : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={attachedTemplateIds.includes(tpl.id)}
                            onCheckedChange={() => toggleTemplate(tpl.id)}
                          />
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{tpl.name}</span>
                            <p className="text-[13px] text-muted-foreground">{tpl.fileName}</p>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Upload new */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                {isNb ? "Last opp nytt dokument" : "Upload new document"}
              </Label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-4 transition-colors cursor-pointer"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isNb ? "Klikk for å velge fil" : "Click to select file"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Attached files list */}
            {attachedFiles.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {isNb ? "Vedlagte filer" : "Attached files"}
                </Label>
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{f.name}</span>
                    <span className="text-[13px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Vedlegg er valgfritt. Du kan også hoppe over dette steget."
                : "Attachments are optional. You can skip this step."}
            </p>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{isNb ? "Typer" : "Types"}</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {selectedTypeNames.map((t) => (
                    <Badge key={t.value} variant="secondary" className="text-[13px]">
                      {isNb ? t.labelNb : t.labelEn}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isNb ? "Leverandører" : "Vendors"}</span>
                <span className="text-sm font-medium">{selectedVendors.length}</span>
              </div>
              {totalAttachments > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isNb ? "Vedlegg" : "Attachments"}</span>
                  <span className="text-sm font-medium">{totalAttachments}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Forespørselen sendes per e-post til kontaktpersonene hos valgte leverandører."
                : "The request will be sent by email to the contact persons at selected vendors."}
            </p>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isNb ? "Tilbake" : "Back"}
            </Button>
          ) : (
            <div />
          )}
          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && selectedTypes.length === 0) || (step === 2 && selectedVendors.length === 0)}
            >
              {step === 3 && totalAttachments === 0
                ? (isNb ? "Hopp over" : "Skip")
                : (isNb ? "Neste" : "Next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSend}>
              <Check className="h-4 w-4 mr-1" />
              {isNb ? "Bekreft og send" : "Confirm and send"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export for use in template library
export { getSavedTemplates, removeTemplate, type SavedTemplate };
