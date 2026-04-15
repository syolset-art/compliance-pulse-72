import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Award, FolderOpen, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Loader2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";

type DocCategory = "policy" | "certification" | "document";
type Visibility = "published" | "visible" | "hidden";

const POLICY_SUBTYPES = [
  { value: "policy", label: "General Policy", labelNb: "Generell policy" },
  { value: "privacy_policy", label: "Privacy Policy", labelNb: "Personvernpolicy" },
  { value: "acceptable_use", label: "Acceptable Use", labelNb: "Akseptabel bruk" },
  { value: "incident_response", label: "Incident Response", labelNb: "Hendelseshåndtering" },
  { value: "security_policy", label: "Security Policy", labelNb: "Sikkerhetspolicy" },
  { value: "data_protection_policy", label: "Data Protection", labelNb: "Databeskyttelse" },
];

const CERT_SUBTYPES = [
  { value: "iso_27001", label: "ISO 27001" },
  { value: "iso_9001", label: "ISO 9001" },
  { value: "soc2", label: "SOC 2 Type II" },
  { value: "iso_27701", label: "ISO 27701" },
  { value: "other_cert", label: "Other", labelNb: "Annet" },
];

const DOC_SUBTYPES = [
  { value: "dpa", label: "DPA / Databehandleravtale" },
  { value: "report", label: "Report", labelNb: "Rapport" },
  { value: "agreement", label: "Agreement", labelNb: "Avtale" },
  { value: "other", label: "Other", labelNb: "Annet" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

export const AddEvidenceDialog = ({ open, onOpenChange, assetId }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [subType, setSubType] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("published");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setStep(1);
    setCategory(null);
    setDisplayName("");
    setSubType("");
    setIssuer("");
    setIssuedDate("");
    setExpiryDate("");
    setNotes("");
    setVisibility("published");
    setFile(null);
    setUploading(false);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${assetId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("vendor-documents")
      .upload(path, file);
    if (error) throw error;
    return path;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let filePath = "";
      let fileName = displayName;

      if (file) {
        filePath = await uploadFile(file);
        fileName = file.name;
      }

      const docType = category === "certification" ? "certification" : subType || "policy";
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: docType,
        file_name: fileName || displayName,
        file_path: filePath,
        display_name: displayName,
        status: "draft",
        visibility,
        valid_from: issuedDate || null,
        valid_to: expiryDate || null,
        category: category === "certification" ? "certification" : subType || null,
        notes: notes || null,
        source: issuer || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      toast.success(isNb ? "Dokument lagt til" : "Document added");
      reset();
      onOpenChange(false);
    },
    onError: () => {
      setUploading(false);
      toast.error(isNb ? "Kunne ikke lagre" : "Failed to save");
    },
  });

  const subtypes = category === "policy" ? POLICY_SUBTYPES
    : category === "certification" ? CERT_SUBTYPES
    : DOC_SUBTYPES;

  const categoryCards: { key: DocCategory; icon: typeof FileText; label: string; desc: string }[] = [
    { key: "policy", icon: FileText, label: isNb ? "Retningslinje" : "Policy", desc: isNb ? "Policyer og retningslinjer" : "Policies and guidelines" },
    { key: "certification", icon: Award, label: isNb ? "Sertifisering" : "Certification", desc: isNb ? "ISO, SOC, attester" : "ISO, SOC, attestations" },
    { key: "document", icon: FolderOpen, label: isNb ? "Dokument" : "Document", desc: isNb ? "Avtaler, rapporter, bevis" : "Agreements, reports, evidence" },
  ];

  const isCert = category === "certification";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && (isNb ? "Legg til dokumentasjon" : "Add documentation")}
            {step === 2 && (isNb ? "Detaljer" : "Details")}
            {step === 3 && (isNb ? "Last opp fil" : "Upload file")}
            {step === 4 && (isNb ? "Synlighet" : "Visibility")}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && (isNb ? "Velg type dokumentasjon du vil legge til." : "Choose the type of documentation to add.")}
            {step === 2 && (isNb ? "Fyll inn informasjon om dokumentet." : "Fill in document information.")}
            {step === 3 && (isNb ? "Last opp sertifikat eller dokument (valgfritt)." : "Upload certificate or document (optional).")}
            {step === 4 && (isNb ? "Bestem hvem som kan se dette dokumentet." : "Decide who can see this document.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Choose category */}
        {step === 1 && (
          <div className="grid gap-3 py-2">
            {categoryCards.map((c) => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setStep(2); }}
                className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50 hover:border-primary/30"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isNb ? "Navn" : "Name"} *</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isCert
                  ? (isNb ? "F.eks. ISO 27001:2022" : "E.g. ISO 27001:2022")
                  : (isNb ? "F.eks. Personvernpolicy 2025" : "E.g. Privacy Policy 2025")}
              />
            </div>
            <div className="space-y-2">
              <Label>{isNb ? "Type" : "Type"}</Label>
              <Select value={subType} onValueChange={setSubType}>
                <SelectTrigger>
                  <SelectValue placeholder={isNb ? "Velg type..." : "Select type..."} />
                </SelectTrigger>
                <SelectContent>
                  {subtypes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {isNb && "labelNb" in s ? (s as any).labelNb : s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isCert && (
              <div className="space-y-2">
                <Label>{isNb ? "Utsteder" : "Issuer"}</Label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder={isNb ? "F.eks. DNV GL, Bureau Veritas" : "E.g. DNV GL, Bureau Veritas"}
                />
              </div>
            )}
            {isCert && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isNb ? "Utstedt dato" : "Issue date"}</Label>
                  <Input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            )}
            {!isCert && category === "document" && (
              <div className="space-y-2">
                <Label>{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{isNb ? "Notater" : "Notes"}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isCert
                  ? (isNb ? "F.eks. Omfang: Informasjonssikkerhetsstyring" : "E.g. Scope: Information security management")
                  : (isNb ? "Valgfrie notater..." : "Optional notes...")}
                rows={2}
              />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setStep(1); setCategory(null); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={!displayName.trim()}>
                {isNb ? "Neste" : "Next"} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: File upload */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />

            {!file ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isNb ? "Klikk for å laste opp" : "Click to upload"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC · Max 10 MB</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border p-4 bg-accent/20">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {isNb ? "Du kan også legge til fil senere." : "You can also add the file later."}
            </p>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button size="sm" onClick={() => setStep(4)}>
                {file ? (isNb ? "Neste" : "Next") : (isNb ? "Hopp over" : "Skip")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Visibility */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50 data-[state=checked]:border-primary/50">
                <RadioGroupItem value="published" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">{isNb ? "Publisert" : "Published"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb ? "Synlig i Trust Profilen for alle som ser den" : "Visible in the Trust Profile for everyone"}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50">
                <RadioGroupItem value="visible" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{isNb ? "Intern" : "Internal"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb ? "Kun synlig internt i organisasjonen" : "Only visible internally in the organization"}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50">
                <RadioGroupItem value="hidden" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">{isNb ? "Skjult" : "Hidden"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb ? "Skjules helt, kun for administratorer" : "Completely hidden, admin only"}
                  </p>
                </div>
              </label>
            </RadioGroup>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || uploading}>
                {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isNb ? "Lagre" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
