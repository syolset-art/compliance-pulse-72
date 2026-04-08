import { useState } from "react";
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
  FileText, Award, FolderOpen, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Loader2,
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

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [subType, setSubType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("published");

  const reset = () => {
    setStep(1);
    setCategory(null);
    setDisplayName("");
    setSubType("");
    setExpiryDate("");
    setNotes("");
    setVisibility("published");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const docType = category === "certification" ? "certification" : subType || "policy";
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: docType,
        file_name: displayName,
        display_name: displayName,
        status: "draft",
        visibility,
        expiry_date: expiryDate || null,
        category: subType || null,
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && (isNb ? "Legg til dokumentasjon" : "Add documentation")}
            {step === 2 && (isNb ? "Detaljer" : "Details")}
            {step === 3 && (isNb ? "Synlighet" : "Visibility")}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && (isNb ? "Velg type dokumentasjon du vil legge til." : "Choose the type of documentation to add.")}
            {step === 2 && (isNb ? "Fyll inn informasjon om dokumentet." : "Fill in document information.")}
            {step === 3 && (isNb ? "Bestem hvem som kan se dette dokumentet." : "Decide who can see this document.")}
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
                placeholder={isNb ? "F.eks. Personvernpolicy 2025" : "E.g. Privacy Policy 2025"}
              />
            </div>
            <div className="space-y-2">
              <Label>{isNb ? "Undertype" : "Sub-type"}</Label>
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
            {(category === "certification" || category === "document") && (
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
                placeholder={isNb ? "Valgfrie notater..." : "Optional notes..."}
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

        {/* Step 3: Visibility */}
        {step === 3 && (
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
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isNb ? "Lagre" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
