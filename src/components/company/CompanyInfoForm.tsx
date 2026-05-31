import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, Shield, Save, Pencil, X, Sparkles, AlertCircle, Handshake, Loader2, CheckCircle2, Search, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyInfoFormProps {
  /** If true, starts in edit mode */
  defaultEditing?: boolean;
  /** Show the edit/save buttons. Set false if parent manages editing state. */
  showEditControls?: boolean;
  /** Callback after save completes */
  onSaved?: () => void;
  /** Hide the Partner & delivery section (render it elsewhere) */
  hidePartner?: boolean;
  /** Render ONLY the Partner & delivery section */
  partnerOnly?: boolean;
}

export function CompanyInfoForm({ defaultEditing = false, showEditControls = true, onSaved, hidePartner = false, partnerOnly = false }: CompanyInfoFormProps) {
  const queryClient = useQueryClient();
  const [isEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Partner-katalog (prototype): partnere som har opprettet egen Trust Profile i Mynder
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const PARTNER_DIRECTORY: Array<{ name: string; type: string; roleDescription: string }> = [
    { name: "Mynder MSP-partner AS", type: "msp", roleDescription: "Drift, sikkerhetsovervåking og brukerstøtte" },
    { name: "Acme IT AS", type: "it_partner", roleDescription: "IT-drift og support" },
    { name: "NordSec AS", type: "mssp", roleDescription: "24/7 SOC, EDR og hendelseshåndtering" },
    { name: "7 Security", type: "mssp", roleDescription: "Sikkerhetsovervåking og compliance-rådgivning" },
    { name: "Bouvet Sikkerhet", type: "consultant", roleDescription: "Rådgivning innen informasjonssikkerhet og GDPR" },
    { name: "Atea Managed Services", type: "msp", roleDescription: "Skytjenester, drift og support" },
    { name: "Sopra Steria Cyber", type: "mssp", roleDescription: "Cybersikkerhet og hendelseshåndtering" },
  ];

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
    // Partner / leveransepartner
    managed_by_partner: false,
    partner_name: "",
    partner_type: "msp",
    partner_role_description: "",
    partner_since: "",
    show_partner_on_trust_profile: true,
  });

  const matchedPartner = PARTNER_DIRECTORY.find(
    (p) => p.name.toLowerCase() === (form?.partner_name || "").trim().toLowerCase()
  );



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
        dpo_name: (companyProfile as any).dpo_name || "",
        dpo_email: (companyProfile as any).dpo_email || "",
        ciso_name: (companyProfile as any).ciso_name || "",
        ciso_email: (companyProfile as any).ciso_email || "",
        managed_by_partner: (companyProfile as any).managed_by_partner || false,
        partner_name: (companyProfile as any).partner_name || "",
        partner_type: (companyProfile as any).partner_type || "msp",
        partner_role_description: (companyProfile as any).partner_role_description || "",
        partner_since: (companyProfile as any).partner_since || "",
        show_partner_on_trust_profile: (companyProfile as any).show_partner_on_trust_profile ?? true,
      });
      // Mark hydrated on next tick so the autosave effect doesn't fire on initial load
      setTimeout(() => { hydratedRef.current = true; }, 0);
    }
  }, [companyProfile, selfAsset]);

  // Autosave: debounce form changes and persist silently
  useEffect(() => {
    if (!hydratedRef.current || !companyProfile) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave({ silent: true });
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSave = async (opts?: { silent?: boolean }) => {
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
          dpo_name: form.dpo_name,
          dpo_email: form.dpo_email,
          ciso_name: form.ciso_name,
          ciso_email: form.ciso_email,
          managed_by_partner: form.managed_by_partner,
          partner_name: form.managed_by_partner ? form.partner_name || null : null,
          partner_type: form.managed_by_partner ? form.partner_type : null,
          partner_role_description: form.managed_by_partner ? form.partner_role_description || null : null,
          partner_since: form.managed_by_partner && form.partner_since ? form.partner_since : null,
          show_partner_on_trust_profile: form.show_partner_on_trust_profile,
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
      queryClient.invalidateQueries({ queryKey: ["partner-info"] });

      setSavedAt(new Date());
      if (!opts?.silent) toast.success("Selskapsinformasjon lagret");
      onSaved?.();
    } catch {
      if (!opts?.silent) toast.error("Kunne ikke lagre endringer");
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
        dpo_name: (companyProfile as any).dpo_name || "",
        dpo_email: (companyProfile as any).dpo_email || "",
        ciso_name: (companyProfile as any).ciso_name || "",
        ciso_email: (companyProfile as any).ciso_email || "",
        managed_by_partner: (companyProfile as any).managed_by_partner || false,
        partner_name: (companyProfile as any).partner_name || "",
        partner_type: (companyProfile as any).partner_type || "msp",
        partner_role_description: (companyProfile as any).partner_role_description || "",
        partner_since: (companyProfile as any).partner_since || "",
        show_partner_on_trust_profile: (companyProfile as any).show_partner_on_trust_profile ?? true,
      });
    }
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

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value as never }));
  };

  // Velger partner fra katalog og forhåndsutfyller type + leveranseområde
  const selectPartner = (p: { name: string; type: string; roleDescription: string }) => {
    setForm((prev) => ({
      ...prev,
      partner_name: p.name as never,
      partner_type: p.type as never,
      partner_role_description: p.roleDescription as never,
    }));
    setPartnerPickerOpen(false);
  };

  if (loadingProfile) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  const orgType = form.brreg_industry?.split(" ")[0] || "AS";

  return (
    <Card className="p-5 space-y-4">
      {partnerOnly && showEditControls && (
        <div className="flex items-center justify-end">
          <span className="text-[11px] text-muted-foreground">
            {saving ? "Lagrer..." : savedAt ? `Lagret ${savedAt.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}` : "Endringer lagres automatisk"}
          </span>
        </div>
      )}
      {!partnerOnly && (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Selskapsinformasjon</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Informasjonen hentes fra onboarding – du kan redigere firmanavn, stamsdata og adresse.
          </p>
        </div>
        {showEditControls && (
          <span className="text-[11px] text-muted-foreground">
            {saving ? "Lagrer..." : savedAt ? `Lagret ${savedAt.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}` : "Endringer lagres automatisk"}
          </span>
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

      </>
      )}
      {!hidePartner && (
      <>
      {/* Partner / leveransepartner */}
      <div className={partnerOnly ? "space-y-3" : "space-y-3 pt-4 border-t border-border"}>
        <div className="flex items-start justify-between gap-3">
          {!partnerOnly && (
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Handshake className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Partner og leveranse</h4>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Hvem leverer IT- og sikkerhetstjenester til virksomheten? Synlig i sidemenyen og kan vises på Trust-profilen.
                </p>
              </div>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[13px] text-muted-foreground">Har partner</span>
              <Switch
                checked={form.managed_by_partner}
                onCheckedChange={(v) => update("managed_by_partner", v as any)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          )}
        </div>

        {form.managed_by_partner ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldBlock label="Partnernavn" hint="Velg fra Mynder Trust-katalogen eller skriv inn manuelt">
              {isEditing ? (
                <div className="space-y-1.5">
                  <Popover open={partnerPickerOpen} onOpenChange={setPartnerPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={partnerPickerOpen}
                        className="w-full justify-between h-9 text-sm font-normal"
                      >
                        <span className={cn("truncate", !form.partner_name && "text-muted-foreground")}>
                          {form.partner_name || "Søk eller velg partner…"}
                        </span>
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Søk i Mynder Trust-katalog…"
                          value={form.partner_name}
                          onValueChange={(v) => update("partner_name", v)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="px-2 py-3 text-center space-y-1">
                              <p className="text-[12px] text-muted-foreground">
                                Ingen partner matchet i Mynder Trust.
                              </p>
                              <p className="text-[11px] text-muted-foreground/80">
                                Du kan beholde navnet og fylle ut Type partner og Leveranseområde manuelt.
                              </p>
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Partnere med Trust Profile">
                            {PARTNER_DIRECTORY.map((p) => (
                              <CommandItem
                                key={p.name}
                                value={p.name}
                                onSelect={() => selectPartner(p)}
                                className="flex items-start gap-2 py-2"
                              >
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 mt-0.5 shrink-0",
                                    form.partner_name === p.name ? "opacity-100 text-primary" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{p.name}</span>
                                    <Shield className="h-3 w-3 text-primary shrink-0" />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {p.roleDescription}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {matchedPartner ? (
                    <p className="text-[11px] text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Hentet fra Mynder Trust — Type og Leveranseområde er forhåndsutfylt.
                    </p>
                  ) : form.partner_name ? (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Ikke i Mynder Trust-katalogen — fyll ut Type og Leveranseområde manuelt.
                    </p>
                  ) : null}
                </div>
              ) : (
                <Input value={form.partner_name || "—"} readOnly className="bg-muted/30 text-sm" />
              )}
            </FieldBlock>

            <FieldBlock
              label="Type partner"
              hint={matchedPartner ? "Forhåndsutfylt fra Mynder Trust — kan redigeres" : "Hvilken rolle partneren har"}
            >
              {isEditing ? (
                <select
                  value={form.partner_type}
                  onChange={(e) => update("partner_type", e.target.value as any)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="msp">MSP — Managed Service Provider</option>
                  <option value="mssp">MSSP — Managed Security Service Provider</option>
                  <option value="it_partner">IT-partner</option>
                  <option value="consultant">Konsulent / rådgiver</option>
                  <option value="other">Annet</option>
                </select>
              ) : (
                <Input value={form.partner_type || "—"} readOnly className="bg-muted/30 text-sm" />
              )}
            </FieldBlock>

            <FieldBlock
              label="Leveranseområde"
              hint={matchedPartner ? "Forhåndsutfylt fra Mynder Trust — kan redigeres" : "Kort beskrivelse av hva partneren leverer"}
            >
              {isEditing ? (
                <Input
                  value={form.partner_role_description}
                  onChange={(e) => update("partner_role_description", e.target.value)}
                  placeholder="F.eks. Drift, sikkerhetsovervåking, brukerstøtte"
                  className="text-sm"
                />
              ) : (
                <Input value={form.partner_role_description || "—"} readOnly className="bg-muted/30 text-sm" />
              )}
            </FieldBlock>

            <FieldBlock label="Partner siden" hint="Når startet samarbeidet? (fylles inn manuelt)">
              {isEditing ? (
                <Input
                  type="date"
                  value={form.partner_since}
                  onChange={(e) => update("partner_since", e.target.value)}
                  className="text-sm"
                />
              ) : (
                <Input value={form.partner_since || "—"} readOnly className="bg-muted/30 text-sm" />
              )}
            </FieldBlock>

            <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">Vis partner på Trust-profilen</p>
                <p className="text-[12px] text-muted-foreground">Anbefales — bygger tillit i due diligence.</p>
              </div>
              <Switch
                checked={form.show_partner_on_trust_profile}
                onCheckedChange={(v) => update("show_partner_on_trust_profile", v as any)}
                disabled={!isEditing}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
            <p className="text-[13px] text-muted-foreground">
              {isEditing
                ? "Slå på «Har partner» over for å registrere en MSP, MSSP eller IT-partner."
                : "Ingen partner registrert. Klikk «Rediger» for å legge til."}
            </p>
          </div>
        )}
      </div>
      </>
      )}
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
