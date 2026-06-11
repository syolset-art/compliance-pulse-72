import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, Shield, Save, Pencil, X, Sparkles, AlertCircle, Handshake, Loader2, CheckCircle2, Search, ChevronsUpDown, Check, ImageIcon, Globe, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRY_OPTIONS, findIndustryByLabel } from "@/lib/industries";

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

function IndustryCombobox({ value, onChange }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matched = findIndustryByLabel(value);
  const trimmedQuery = query.trim();
  const queryMatchesExisting =
    trimmedQuery.length > 0 &&
    INDUSTRY_OPTIONS.some(
      (o) =>
        o.label_nb.toLowerCase() === trimmedQuery.toLowerCase() ||
        o.label_en.toLowerCase() === trimmedQuery.toLowerCase(),
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm font-normal h-9"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Velg eller skriv inn bransje"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[320px]" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue contains label_nb + label_en + nace code
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Søk etter bransje..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {trimmedQuery ? (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded"
                  onClick={() => {
                    onChange(trimmedQuery);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  Bruk «{trimmedQuery}»
                </button>
              ) : (
                <span className="block px-3 py-2 text-sm text-muted-foreground">
                  Ingen treff
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {INDUSTRY_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.label_nb} ${opt.label_en}`}
                  onSelect={() => {
                    onChange(opt.label_nb);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      matched?.id === opt.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{opt.label_nb}</span>
                </CommandItem>
              ))}
              {trimmedQuery && !queryMatchesExisting && (
                <CommandItem
                  value={`__custom__${trimmedQuery}`}
                  onSelect={() => {
                    onChange(trimmedQuery);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-sm border-t mt-1 pt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Bruk «{trimmedQuery}»
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


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

  // Domain verification state
  const [domainVerified, setDomainVerified] = useState<boolean | null>(null);
  const [domainChecking, setDomainChecking] = useState(false);

  // Partner-katalog (prototype): partnere som har opprettet egen Trust Profile i Mynder
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [addPartnerDialogOpen, setAddPartnerDialogOpen] = useState(false);
  const [draftPartnerName, setDraftPartnerName] = useState("");
  const PARTNER_DIRECTORY: Array<{ name: string; type: string; roleDescription: string }> = [
    { name: "Mynder MSP-partner AS", type: "msp", roleDescription: "Drift, sikkerhetsovervåking og brukerstøtte" },
    { name: "Acme IT AS", type: "it_partner", roleDescription: "IT-drift og support" },
    { name: "NordSec AS", type: "mssp", roleDescription: "24/7 SOC, EDR og hendelseshåndtering" },
    { name: "Hult-IT", type: "it_partner", roleDescription: "IT-drift, support og brukerstøtte" },
    { name: "Hult-IT Security", type: "mssp", roleDescription: "Sikkerhetsovervåking og hendelseshåndtering" },
    { name: "7 Security MSP", type: "msp", roleDescription: "Drift av sikkerhetsplattformer og endepunkter" },
    { name: "7 Security", type: "mssp", roleDescription: "Sikkerhetsovervåking og compliance-rådgivning" },
    { name: "Bouvet Sikkerhet", type: "consultant", roleDescription: "Rådgivning innen informasjonssikkerhet og GDPR" },
    { name: "Atea Managed Services", type: "msp", roleDescription: "Skytjenester, drift og support" },
    { name: "Sopra Steria Cyber", type: "mssp", roleDescription: "Cybersikkerhet og hendelseshåndtering" },
    { name: "Visma Sikkerhet", type: "mssp", roleDescription: "Managed security og compliance" },
    { name: "TietoEvry Managed Security", type: "mssp", roleDescription: "SOC, trusseldeteksjon og respons" },
    { name: "Crayon Managed Services", type: "msp", roleDescription: "Sky- og lisensdrift" },
    { name: "Itera Cybersecurity", type: "mssp", roleDescription: "Sikkerhetsrådgivning og overvåking" },
    { name: "Advania Operations", type: "msp", roleDescription: "IT-drift og arbeidsplasstjenester" },
    { name: "Basefarm Managed Cloud", type: "msp", roleDescription: "Drift av kritisk skyinfrastruktur" },
    { name: "Netsecurity", type: "mssp", roleDescription: "SOC-tjenester og hendelseshåndtering" },
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
    founded_year: "",
    org_form: "",
    address: "",
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
    partner_maturity_authority: false,
    additional_partners: [] as Array<{ name: string; type: string; roleDescription: string; since: string }>,

  });

  const matchedPartner = PARTNER_DIRECTORY.find(
    (p) => p.name.toLowerCase() === (form?.partner_name || "").trim().toLowerCase()
  );



  useEffect(() => {
    // Only hydrate once on initial load. Subsequent refetches must not
    // overwrite local edits (e.g. removing a partner) before autosave runs.
    if (companyProfile && !hydratedRef.current) {
      setForm({
        name: companyProfile.name || "",
        legal_name: (companyProfile as any).legal_name || "",
        country: (companyProfile as any).country || "Norge",
        org_number: companyProfile.org_number || "",
        domain: companyProfile.domain || "",
        industry: companyProfile.industry || "",
        employees: companyProfile.employees || "",
        brreg_industry: companyProfile.brreg_industry || "",
        founded_year: (companyProfile as any).founded_year || "",
        org_form: (companyProfile as any).org_form || "",
        address: (companyProfile as any).address || "",
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
        partner_maturity_authority: (companyProfile as any).partner_maturity_authority ?? false,
        additional_partners: (companyProfile as any).additional_partners || [],

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
      // Skip save if any validation error exists
      const hasErr = Object.values(currentErrors()).some(Boolean);
      if (hasErr) return;
      handleSave({ silent: true });
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Validation (used by autosave guard and UI). Defined as function to read latest form.
  const currentYearVal = new Date().getFullYear();
  function currentErrors() {
    return {
      founded_year: !form.founded_year ? "" :
        (!/^\d{4}$/.test(String(form.founded_year)) ? "Må være 4 siffer (ÅÅÅÅ)" :
          (Number(form.founded_year) < 1800 || Number(form.founded_year) > currentYearVal ? `Må være mellom 1800 og ${currentYearVal}` : "")),
      employees: !form.employees ? "" :
        (!/^\d+$/.test(String(form.employees)) ? "Kun hele tall" :
          (Number(form.employees) < 1 ? "Må være minst 1" :
            (Number(form.employees) > 1000000 ? "Ugyldig antall" : ""))),
      domain: !form.domain ? "" :
        (/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i.test(form.domain.trim()) ? "" : "Ugyldig nettside (f.eks. www.eksempel.no)"),
      org_form: !form.org_form ? "" :
        (/^[A-ZÆØÅ]{2,5}$/.test(form.org_form.trim()) ? "" : "Bruk forkortelse (AS, ASA, ENK, NUF)"),
      address: !form.address ? "" :
        ((/\d/.test(form.address) && /[A-Za-zÆØÅæøå]{2,}/.test(form.address)) ? "" : "Skriv gateadresse og postnummer (f.eks. Storgata 1, 0123 Oslo)"),
    };
  }


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
          founded_year: form.founded_year || null,
          org_form: form.org_form || null,
          address: form.address || null,
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
          partner_maturity_authority: form.managed_by_partner ? form.partner_maturity_authority : false,
          additional_partners: form.managed_by_partner ? form.additional_partners : [],

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
        founded_year: (companyProfile as any).founded_year || "",
        org_form: (companyProfile as any).org_form || "",
        address: (companyProfile as any).address || "",
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
        partner_maturity_authority: (companyProfile as any).partner_maturity_authority ?? false,
        additional_partners: (companyProfile as any).additional_partners || [],

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

  // Verify domain by attempting to load favicon (bypasses CORS for images)
  const verifyDomain = async () => {
    if (!form.domain || errors.domain) {
      toast.error("Skriv inn en gyldig nettside først");
      return;
    }
    setDomainChecking(true);
    setDomainVerified(null);
    const cleanDomain = form.domain.replace(/^https?:\/\//, "").split("/")[0];
    let resolved = false;

    const tryImage = (src: string): Promise<boolean> =>
      new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(false), 5000);
        img.onload = () => { clearTimeout(timer); resolve(true); };
        img.onerror = () => { clearTimeout(timer); resolve(false); };
        img.src = src;
      });

    // Try favicon first, then robots.txt as fallback
    const ok = await tryImage(`https://${cleanDomain}/favicon.ico?t=${Date.now()}`)
      .then((r) => r || tryImage(`https://${cleanDomain}/robots.txt?t=${Date.now()}`));

    setDomainVerified(ok);
    setDomainChecking(false);
    if (ok) {
      toast.success("Nettside verifisert");
    } else {
      toast.error("Kunne ikke nå nettsiden. Sjekk at adressen er riktig.");
    }
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
  const errors = currentErrors();




  return (
    <Card className="p-5 space-y-4">
      {!partnerOnly && (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Selskapsinformasjon</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fyll inn informasjon om virksomheten.
          </p>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          Logo
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!selfAsset) {
                toast.info("Laster virksomhetsdata, vennligst vent et øyeblikk");
                return;
              }
              logoInputRef.current?.click();
            }}
            disabled={uploadingLogo}
            className={cn(
              "h-14 w-14 rounded-lg border border-border flex items-center justify-center bg-muted/30 overflow-hidden transition-colors cursor-pointer",
              !uploadingLogo && "hover:bg-muted/50"
            )}
          >
            {uploadingLogo ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : selfAsset?.logo_url ? (
              <img src={selfAsset.logo_url} className="h-12 w-12 rounded object-contain" alt="" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-sm text-muted-foreground">PNG, JPG eller SVG. Maks 1 MB.</p>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldBlock label="Organisasjonsnummer" readOnly>
          <Input value={form.org_number || "Ikke registrert"} readOnly className="bg-muted/30 text-sm" />
        </FieldBlock>

        <FieldBlock label="Juridisk navn">
          {isEditing ? (
            <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} placeholder={form.name || "Eksempel AS"} className="text-sm" />
          ) : (
            <Input value={form.legal_name || form.name || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Selskapsnavn (markedsnavn)">
          {isEditing ? (
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="text-sm" />
          ) : (
            <Input value={form.name || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Land for registrering">
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

        <FieldBlock label="Organisasjonsform">
          <Input
            value={form.org_form || orgType}
            onChange={(e) => update("org_form", e.target.value.toUpperCase())}
            placeholder="AS"
            className={cn("text-sm", errors.org_form && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.org_form && <p className="text-sm text-destructive mt-1">{errors.org_form}</p>}
        </FieldBlock>

        <FieldBlock label="Stiftet">
          <div className="space-y-1">
            <Input
              type="number"
              inputMode="numeric"
              min={1800}
              max={currentYearVal}
              value={form.founded_year}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                update("founded_year", val);
              }}
              placeholder="ÅÅÅÅ"
              className={cn("text-sm", errors.founded_year && "border-destructive focus-visible:ring-destructive")}
            />
              {errors.founded_year ? (
                <p className="text-sm text-destructive">{errors.founded_year}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Format: ÅÅÅÅ (f.eks. 2015)</p>
              )}
          </div>
        </FieldBlock>

        <FieldBlock label="Nettside">
          {isEditing ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Input
                  value={form.domain}
                  onChange={(e) => {
                    update("domain", e.target.value);
                    setDomainVerified(null);
                  }}
                  placeholder="www.example.com"
                  className={cn("text-sm flex-1", errors.domain && "border-destructive focus-visible:ring-destructive")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={verifyDomain}
                  disabled={domainChecking || !form.domain || Boolean(errors.domain)}
                  className="gap-1.5 shrink-0"
                >
                  {domainChecking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  {domainChecking ? "Sjekker..." : "Verifiser"}
                </Button>
              </div>
              {errors.domain ? (
                <p className="text-sm text-destructive">{errors.domain}</p>
              ) : domainVerified === true ? (
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Nettside verifisert
                </div>
              ) : domainVerified === false ? (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-3 w-3" />
                  Kunne ikke verifisere nettsiden
                </div>
              ) : null}
            </div>
          ) : (
            <Input value={form.domain || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Bransje">
          {isEditing ? (
            <IndustryCombobox
              value={form.industry || ""}
              onChange={(v) => update("industry", v)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Input value={form.industry || "—"} readOnly className="bg-muted/30 text-sm" />
              {getNaceCodeForIndustry(form.industry) && (
                <Badge variant="outline" className="text-xs shrink-0">
                  NACE {getNaceCodeForIndustry(form.industry)}
                </Badge>
              )}
            </div>
          )}
        </FieldBlock>


        <FieldBlock label="Antall ansatte">
          {isEditing ? (
            <>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={form.employees}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                  update("employees", val);
                }}
                placeholder="F.eks. 25"
                className={cn("text-sm", errors.employees && "border-destructive focus-visible:ring-destructive")}
              />
                {errors.employees ? (
                  <p className="text-sm text-destructive mt-1">{errors.employees}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Skriv inn et helt tall (f.eks. 25)</p>
                )}
            </>
          ) : (
            <Input value={form.employees || "—"} readOnly className="bg-muted/30 text-sm" />
          )}
        </FieldBlock>

        <FieldBlock label="Adresse">
          <Input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Eksempel Gata vei 1C, 0123 Oslo"
            className={cn("text-sm", errors.address && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
        </FieldBlock>
      </div>


      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Beskrivelse av virksomheten</label>
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
                <p className="text-sm text-muted-foreground italic">
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
        </div>

        {(() => {
          const PARTNER_TYPE_LABELS: Record<string, string> = {
            msp: "MSP",
            mssp: "MSSP",
            it_partner: "IT-partner",
            consultant: "Konsulent",
            other: "Annet",
          };
          const PARTNER_TYPE_OPTIONS = [
            { value: "msp", label: "MSP — Managed Service Provider" },
            { value: "mssp", label: "MSSP — Managed Security Service Provider" },
            { value: "it_partner", label: "IT-partner" },
            { value: "consultant", label: "Konsulent / rådgiver" },
            { value: "other", label: "Annet" },
          ];

          type Row = { name: string; type: string; roleDescription: string; since: string; isPrimary: boolean };
          const rows: Row[] = form.managed_by_partner && form.partner_name
            ? [
                {
                  name: form.partner_name,
                  type: form.partner_type,
                  roleDescription: form.partner_role_description,
                  since: form.partner_since,
                  isPrimary: true,
                },
                ...form.additional_partners.map((p) => ({ ...p, isPrimary: false })),
              ]
            : [];

          const updateRow = (idx: number, patch: Partial<Omit<Row, "isPrimary">>) => {
            setForm((prev) => {
              if (idx === 0 && rows[0]?.isPrimary) {
                return {
                  ...prev,
                  ...(patch.name !== undefined ? { partner_name: patch.name } : {}),
                  ...(patch.type !== undefined ? { partner_type: patch.type as never } : {}),
                  ...(patch.roleDescription !== undefined ? { partner_role_description: patch.roleDescription } : {}),
                  ...(patch.since !== undefined ? { partner_since: patch.since } : {}),
                };
              }
              const addIdx = idx - 1;
              const next = [...prev.additional_partners];
              next[addIdx] = { ...next[addIdx], ...patch };
              return { ...prev, additional_partners: next };
            });
          };

          const removeRow = (idx: number) => {
            setForm((prev) => {
              if (idx === 0) {
                // Promote first additional to primary, or clear all
                const [first, ...rest] = prev.additional_partners;
                if (first) {
                  return {
                    ...prev,
                    partner_name: first.name,
                    partner_type: first.type as never,
                    partner_role_description: first.roleDescription,
                    partner_since: first.since,
                    additional_partners: rest,
                  };
                }
                return {
                  ...prev,
                  managed_by_partner: false,
                  partner_name: "",
                  partner_type: "msp",
                  partner_role_description: "",
                  partner_since: "",
                  additional_partners: [],
                };
              }
              const addIdx = idx - 1;
              return {
                ...prev,
                additional_partners: prev.additional_partners.filter((_, i) => i !== addIdx),
              };
            });
          };

          if (rows.length === 0) {
            return (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-foreground font-medium">Ingen partner registrert</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Legg til MSP, MSSP, IT-partner eller rådgiver som leverer tjenester til virksomheten.
                  </p>
                </div>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setDraftPartnerName("");
                      setAddPartnerDialogOpen(true);
                    }}
                    className="shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Legg til partner
                  </Button>
                )}
              </div>
            );
          }

          return (
            <div className="space-y-3">
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-[12px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Partner</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Siden</th>
                      {isEditing && <th className="px-3 py-2 w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="bg-background">
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{row.name}</span>
                          </div>
                          {row.roleDescription && (
                            <p className="text-[12px] text-muted-foreground mt-0.5 truncate pl-5">
                              {row.roleDescription}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          {isEditing ? (
                            <select
                              value={row.type || "msp"}
                              onChange={(e) => updateRow(idx, { type: e.target.value })}
                              className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                            >
                              {PARTNER_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {PARTNER_TYPE_LABELS[row.type] || "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={row.since || ""}
                              onChange={(e) => updateRow(idx, { since: e.target.value })}
                              className="h-8 text-sm w-36"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.since || "—"}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-3 py-2 align-middle text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRow(idx)}
                              aria-label="Fjern partner"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isEditing && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraftPartnerName("");
                    setAddPartnerDialogOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Legg til partner
                </Button>
              )}

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Vis partnere på Trust-profilen</p>
                  <p className="text-[12px] text-muted-foreground">Anbefales — bygger tillit i due diligence.</p>
                </div>
                <Switch
                  checked={form.show_partner_on_trust_profile}
                  onCheckedChange={(v) => update("show_partner_on_trust_profile", v as any)}
                  disabled={!isEditing}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="pr-3">
                  <p className="text-sm font-medium text-foreground">Gi partneren fullmakt til modenhetsarbeid</p>
                  <p className="text-[12px] text-muted-foreground">
                    Lar partneren oppdatere modenhetssvar, laste opp dokumentasjon og vedlikeholde Trust Profilen på vegne av dere.
                  </p>
                </div>
                <Switch
                  checked={form.partner_maturity_authority}
                  onCheckedChange={(v) => update("partner_maturity_authority", v as any)}
                  disabled={!isEditing}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

            </div>
          );
        })()}


        {/* Dialog: Legg til partner */}
        <Dialog open={addPartnerDialogOpen} onOpenChange={setAddPartnerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Legg til partner</DialogTitle>
              <DialogDescription>
                Velg en partner fra Mynder Trust-katalogen, eller skriv inn navnet manuelt.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Partnernavn</label>
                <div className="relative">
                  <Input
                    autoFocus
                    value={draftPartnerName}
                    onChange={(e) => {
                      setDraftPartnerName(e.target.value);
                      setPartnerPickerOpen(true);
                    }}
                    onFocus={() => setPartnerPickerOpen(true)}
                    onBlur={() => setTimeout(() => setPartnerPickerOpen(false), 150)}
                    placeholder="Skriv inn partnernavn…"
                    className="text-sm"
                  />
                  {partnerPickerOpen && (() => {
                    const q = draftPartnerName.trim().toLowerCase();
                    const matches = q
                      ? PARTNER_DIRECTORY.filter((p) => p.name.toLowerCase().includes(q))
                      : PARTNER_DIRECTORY;
                    if (matches.length === 0) return null;
                    return (
                      <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-64 overflow-auto">
                        {matches.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setDraftPartnerName(p.name);
                              setPartnerPickerOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-muted focus:bg-muted focus:outline-none"
                          >
                            <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                            <p className="text-[12px] text-muted-foreground truncate">{p.roleDescription}</p>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Type partner, leveranseområde og partner siden kan fylles ut etterpå (valgfritt).
                </p>
              </div>
            </div>


            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddPartnerDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                type="button"
                disabled={!draftPartnerName.trim()}
                onClick={() => {
                  const name = draftPartnerName.trim();
                  if (!name) return;
                  const match = PARTNER_DIRECTORY.find(
                    (p) => p.name.toLowerCase() === name.toLowerCase()
                  );
                  setForm((prev) => {
                    const finalName = match ? match.name : name;
                    const finalType = match ? match.type : prev.partner_type;
                    const finalRole = match ? match.roleDescription : "";
                    // If a primary partner already exists, append to additional_partners
                    if (prev.managed_by_partner && prev.partner_name) {
                      return {
                        ...prev,
                        additional_partners: [
                          ...prev.additional_partners,
                          { name: finalName, type: finalType, roleDescription: finalRole, since: "" },
                        ],
                      };
                    }
                    return {
                      ...prev,
                      managed_by_partner: true,
                      partner_name: finalName,
                      partner_type: finalType as never,
                      partner_role_description: finalRole as never,
                    };
                  });
                  setAddPartnerDialogOpen(false);
                  setDraftPartnerName("");
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Legg til
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  hint?: string;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
