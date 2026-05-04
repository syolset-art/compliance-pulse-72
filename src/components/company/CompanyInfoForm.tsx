import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Shield, Save, Pencil, X, Users, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CompanyInfoFormProps {
  /** If true, starts in edit mode */
  defaultEditing?: boolean;
  /** Show the edit/save buttons. Set false if parent manages editing state. */
  showEditControls?: boolean;
  /** Callback after save completes */
  onSaved?: () => void;
}

export function CompanyInfoForm({ defaultEditing = false, showEditControls = true, onSaved }: CompanyInfoFormProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: companyProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["company-profile-shared"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: selfAsset } = useQuery({
    queryKey: ["self-asset-shared"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("asset_type", "self").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Local form state
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    country: "Norge",
    org_number: "",
    domain: "",
    industry: "",
    employees: "",
    brreg_industry: "",
    description: "",
    compliance_officer: "",
    compliance_officer_email: "",
    dpo_name: "",
    dpo_email: "",
    ciso_name: "",
    ciso_email: "",
  });

  useEffect(() => {
    if (companyProfile) {
      setForm({
        name: companyProfile.name || "",
        legal_name: (companyProfile as any).legal_name || "",
        country: (companyProfile as any).country || "Norge",
        org_number: companyProfile.org_number || "",
        domain: companyProfile.domain || "",
        industry: companyProfile.industry || "",
        employees: companyProfile.employees || "",
        brreg_industry: companyProfile.brreg_industry || "",
        description: selfAsset?.description || "",
        compliance_officer: companyProfile.compliance_officer || "",
        compliance_officer_email: companyProfile.compliance_officer_email || "",
      });
    }
  }, [companyProfile, selfAsset]);

  const handleSave = async () => {
    if (!companyProfile) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from("company_profile")
        .update({
          name: form.name,
          legal_name: form.legal_name,
          country: form.country,
          domain: form.domain,
          industry: form.industry,
          employees: form.employees,
          compliance_officer: form.compliance_officer,
          compliance_officer_email: form.compliance_officer_email,
        } as any)
        .eq("id", companyProfile.id);
      if (profileErr) throw profileErr;

      // Update description on self asset
      if (selfAsset) {
        await supabase.from("assets").update({ description: form.description }).eq("id", selfAsset.id);
      }

      queryClient.invalidateQueries({ queryKey: ["company-profile-shared"] });
      queryClient.invalidateQueries({ queryKey: ["company_profile_edit"] });
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
      queryClient.invalidateQueries({ queryKey: ["self-asset-shared"] });
      queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });

      setIsEditing(false);
      toast.success("Selskapsinformasjon lagret");
      onSaved?.();
    } catch {
      toast.error("Kunne ikke lagre endringer");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (companyProfile) {
      setForm({
        name: companyProfile.name || "",
        legal_name: (companyProfile as any).legal_name || "",
        country: (companyProfile as any).country || "Norge",
        org_number: companyProfile.org_number || "",
        domain: companyProfile.domain || "",
        industry: companyProfile.industry || "",
        employees: companyProfile.employees || "",
        brreg_industry: companyProfile.brreg_industry || "",
        description: selfAsset?.description || "",
        compliance_officer: companyProfile.compliance_officer || "",
        compliance_officer_email: companyProfile.compliance_officer_email || "",
      });
    }
    setIsEditing(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selfAsset) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Må være en bildefil");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Maks filstørrelse er 1 MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${selfAsset.id}/logo.${ext}`;
      await supabase.storage.from("company-logos").remove([filePath]);
      const { error: upErr } = await supabase.storage.from("company-logos").upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      const { error: updErr } = await supabase.from("assets").update({ logo_url: urlData.publicUrl } as any).eq("id", selfAsset.id);
      if (updErr) throw updErr;
      queryClient.invalidateQueries({ queryKey: ["self-asset-shared"] });
      queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
      queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      toast.success("Logo lastet opp");
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke laste opp logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loadingProfile) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  const orgType = form.brreg_industry?.split(" ")[0] || "AS";

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Selskapsinformasjon</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informasjonen hentes fra onboarding – du kan redigere firmanavn, stamsdata og adresse.
          </p>
        </div>
        {showEditControls && (
          <div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 text-xs">
                <Pencil className="h-3 w-3" />
                Rediger
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1.5 text-xs">
                  <X className="h-3 w-3" />
                  Avbryt
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
                  <Save className="h-3 w-3" />
                  {saving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground flex items-center gap-2">
          Logo
          {!selfAsset?.logo_url && (
            <Badge variant="outline" className="text-[11px] gap-1 border-warning/40 text-warning">
              <AlertCircle className="h-2.5 w-2.5" /> Mangler
            </Badge>
          )}
        </label>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
            {selfAsset?.logo_url ? (
              <img src={selfAsset.logo_url} className="h-12 w-12 rounded object-contain" alt="" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={uploadingLogo || !selfAsset}
              onClick={() => logoInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              {uploadingLogo ? "Laster opp…" : selfAsset?.logo_url ? "Bytt logo" : "Last opp logo"}
            </Button>
            <p className="text-[13px] text-muted-foreground mt-1">PNG, JPG eller SVG. Maks 1 MB.</p>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldBlock label="Organisasjonsnummer" hint="Hentet fra onboarding" readOnly>
          <Input value={form.org_number || "Ikke registrert"} readOnly className="bg-muted/30 text-sm" />
        </FieldBlock>

        <FieldBlock label="Juridisk navn" hint="Det offisielle, registrerte foretaksnavnet">
          {isEditing ? (
            <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} placeholder={form.name || "Eksempel AS"} className="text-sm" />
          ) : (
            <Input value={form.legal_name || form.name || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Selskapsnavn (markedsnavn)" hint="Hentet fra Brønnøysundregistrene">
          {isEditing ? (
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="text-sm" />
          ) : (
            <Input value={form.name || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Land for registrering" hint="Hvor er selskapet registrert?">
          {isEditing ? (
            <select
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="Norge">Norge</option>
              <option value="Sverige">Sverige</option>
              <option value="Danmark">Danmark</option>
              <option value="Finland">Finland</option>
              <option value="Island">Island</option>
              <option value="Tyskland">Tyskland</option>
              <option value="Storbritannia">Storbritannia</option>
              <option value="USA">USA</option>
              <option value="Annet">Annet</option>
            </select>
          ) : (
            <Input value={form.country || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Organisasjonsform" hint="Hentet fra Brønnøysundregistrene" readOnly>
          <Input value={orgType} readOnly className="bg-muted/30 text-sm" />
        </FieldBlock>

        <FieldBlock label="Stiftet" hint="Hentet fra Brønnøysundregistrene" readOnly>
          <Input value="—" readOnly className="bg-muted/30 text-sm" />
        </FieldBlock>

        <FieldBlock label="Nettside" hint="Forhåndsutfylt fra onboarding · kan endres">
          {isEditing ? (
            <Input value={form.domain} onChange={(e) => update("domain", e.target.value)} placeholder="www.example.com" className="text-sm" />
          ) : (
            <Input value={form.domain || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Bransje" hint="Forhåndsutfylt fra Brønnøysundregistrene">
          {isEditing ? (
            <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} className="text-sm" />
          ) : (
            <Input value={form.industry || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Antall ansatte" hint="Forhåndsutfylt fra onboarding · kan endres">
          {isEditing ? (
            <Input value={form.employees} onChange={(e) => update("employees", e.target.value)} className="text-sm" />
          ) : (
            <Input value={form.employees || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Adresse" hint="Forhåndsutfylt fra Brønnøysundregistrene · kan endres">
          <Input value="—" readOnly className="bg-muted/30 text-sm" placeholder="Eksempel Gata vei 1C" />
        </FieldBlock>
      </div>

      {/* Kontaktperson */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <label className="text-xs font-semibold text-foreground">Kontaktperson</label>
            <p className="text-[13px] text-muted-foreground">Hvem er hovedkontakt for sikkerhet og etterlevelse?</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldBlock label="Navn" hint="Ansvarlig for compliance">
            {isEditing ? (
              <Input value={form.compliance_officer} onChange={(e) => update("compliance_officer", e.target.value)} placeholder="Ola Nordmann" className="text-sm" />
            ) : (
              <Input value={form.compliance_officer || "—"} readOnly className="bg-muted/30 text-sm" />
            )}
          </FieldBlock>
          <FieldBlock label="E-post" hint="Kontaktadresse for henvendelser">
            {isEditing ? (
              <Input value={form.compliance_officer_email} onChange={(e) => update("compliance_officer_email", e.target.value)} placeholder="ola@firma.no" className="text-sm" type="email" />
            ) : (
              <Input value={form.compliance_officer_email || "—"} readOnly className="bg-muted/30 text-sm" />
            )}
          </FieldBlock>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Beskrivelse av virksomheten</label>
          <Badge variant="outline" className="text-[13px] gap-1 text-primary border-primary/30">
            <Shield className="h-2.5 w-2.5" />
            Publiseres med AI
          </Badge>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Denne beskrivelsen er automatisk generert basert på offentlige registre og virksomhetens nettside. Du kan fritt redigere teksten.
        </p>
        {isEditing ? (
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Beskriv kort hva virksomheten gjør, hvilke tjenester dere leverer og hvem som er målgruppen..."
            rows={3}
            className="text-sm"
          />
        ) : (
          <div className="relative">
            {form.description ? (
              <Textarea
                value={form.description}
                readOnly
                rows={3}
                className="text-sm bg-muted/30"
              />
            ) : (
              <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[13px] font-medium text-primary">AI-forslag</span>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Klikk «Rediger» for å se og tilpasse det automatiske forslaget fra offentlige kilder.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function FieldBlock({
  label,
  hint,
  readOnly,
  children,
}: {
  label: string;
  hint: string;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      <p className="text-[13px] text-muted-foreground">{hint}</p>
    </div>
  );
}
