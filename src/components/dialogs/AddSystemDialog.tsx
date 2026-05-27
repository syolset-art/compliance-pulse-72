import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Search, Globe, Database, CheckCircle2, AlertCircle, 
  ChevronRight, ChevronLeft, Sparkles, Shield, User, Building,
  Cloud, Server, Activity, Hash, HelpCircle, Plus, Circle, Check
} from "lucide-react";

import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { Progress } from "@/components/ui/progress";
import { useVendorMatch, type VendorMatchCandidate } from "@/hooks/useVendorMatch";
import { VendorLinkStep } from "./VendorLinkStep";
import {
  PRIORITY_KEYS,
  PRIORITY_META,
  priorityLabel,
  suggestPriority,
  suggestionRationale,
  type PriorityKey,
} from "@/lib/derivedPriority";
import { cn } from "@/lib/utils";

interface AddSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSystemAdded: (status?: string) => void;
}

type WizardStep = "search" | "confirm" | "vendor" | "category" | "risk" | "contact";

interface TrustEngineResult {
  name: string;
  description: string | null;
  category: string | null;
  vendor: string | null;
  has_ai: boolean | null;
  ai_features: string | null;
  work_area_type: string | null;
}

interface WebLookupResult {
  official_name: string;
  vendor: string;
  description: string;
  suggested_category: string;
  category_reason: string;
  has_ai: boolean;
  ai_features?: string;
  data_types?: string[];
  vendor_country?: string;
  is_data_processor?: boolean;
  gdpr_note?: string;
  parent_vendor?: string;
  confidence: string;
}

const getCategoryLabels = (isNb: boolean): Record<string, string> => isNb ? {
  crm: "CRM – Kundehåndtering",
  erp: "ERP – Økonomistyring og ressursplanlegging",
  hr: "HR – Personal og lønn",
  productivity: "Produktivitet og kontor",
  communication: "Kommunikasjon og samhandling",
  storage: "Fil- og dokumentlagring",
  security: "Sikkerhet og IAM",
  monitoring: "Overvåkning og logging",
  finance: "Finans og regnskap",
  marketing: "Markedsføring og kampanje",
  "e-commerce": "E-handel og betaling",
  project_management: "Prosjekt- og oppgavestyring",
  development: "Utvikling og DevOps",
  analytics: "Analyse og BI",
  other: "Annet",
} : {
  crm: "CRM – Customer Relationship",
  erp: "ERP – Resource Planning",
  hr: "HR – Personnel and Payroll",
  productivity: "Productivity and Office",
  communication: "Communication and Collaboration",
  storage: "File and Document Storage",
  security: "Security and IAM",
  monitoring: "Monitoring and Logging",
  finance: "Finance and Accounting",
  marketing: "Marketing and Campaigns",
  "e-commerce": "E-commerce and Payments",
  project_management: "Project and Task Management",
  development: "Development and DevOps",
  analytics: "Analytics and BI",
  other: "Other",
};

type DeliveryModel = "saas" | "on_prem" | "hybrid" | "private_cloud" | "open_source" | "other";

const getDeliveryModels = (isNb: boolean): { key: DeliveryModel; label: string; description: string; icon: typeof Database }[] => [
  { key: "saas", label: isNb ? "SaaS / Sky" : "SaaS / Cloud", description: isNb ? "Multi-tenant, driftet av leverandør" : "Multi-tenant, hosted by vendor", icon: Cloud },
  { key: "on_prem", label: "On-prem", description: isNb ? "Installert i egen infrastruktur" : "Installed in own infrastructure", icon: Server },
  { key: "hybrid", label: isNb ? "Hybrid" : "Hybrid", description: isNb ? "Både sky og lokal komponent" : "Both cloud and local component", icon: Activity },
  { key: "private_cloud", label: isNb ? "Privat sky" : "Private cloud", description: isNb ? "Single-tenant hos leverandør" : "Single-tenant at vendor", icon: Hash },
  { key: "open_source", label: "Open source", description: isNb ? "Selv-hostet, ingen leverandøravtale" : "Self-hosted, no vendor contract", icon: Globe },
  { key: "other", label: isNb ? "Annet" : "Other", description: isNb ? "Spesifiser" : "Specify", icon: HelpCircle },
];

type VendorRole = "software" | "service" | "infrastructure" | "consultant" | "reseller";

const getVendorRoles = (isNb: boolean): { key: VendorRole; label: string }[] => [
  { key: "software", label: isNb ? "Programvareleverandør" : "Software vendor" },
  { key: "service", label: isNb ? "Tjenesteleverandør" : "Service provider" },
  { key: "infrastructure", label: isNb ? "Infrastrukturleverandør" : "Infrastructure provider" },
  { key: "consultant", label: isNb ? "Konsulent / rådgiver" : "Consultant / advisor" },
  { key: "reseller", label: isNb ? "Reseller / distributør" : "Reseller / distributor" },
];


const getSteps = (isNb: boolean): { key: WizardStep; label: string }[] => [
  { key: "search", label: isNb ? "Søk" : "Search" },
  { key: "confirm", label: isNb ? "Bekreft" : "Confirm" },
  { key: "vendor", label: isNb ? "Leverandør" : "Vendor" },
  { key: "category", label: isNb ? "Kategori" : "Category" },
  { key: "risk", label: isNb ? "Risiko" : "Risk" },
  { key: "contact", label: isNb ? "Kontakt" : "Contact" },
];

export function AddSystemDialog({ open, onOpenChange, onSystemAdded }: AddSystemDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const STEPS = useMemo(() => getSteps(isNb), [isNb]);
  const CATEGORY_LABELS = useMemo(() => getCategoryLabels(isNb), [isNb]);
  const DELIVERY_MODELS = useMemo(() => getDeliveryModels(isNb), [isNb]);
  const VENDOR_ROLES = useMemo(() => getVendorRoles(isNb), [isNb]);
  const [step, setStep] = useState<WizardStep>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestingRisk, setIsSuggestingRisk] = useState(false);
  const [riskSuggestion, setRiskSuggestion] = useState<{ risk_level: string; reasoning: string } | null>(null);
  const { toast } = useToast();


  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [trustResults, setTrustResults] = useState<TrustEngineResult[]>([]);
  const [webResult, setWebResult] = useState<WebLookupResult | null>(null);
  const [searchSource, setSearchSource] = useState<"none" | "trust_engine" | "web_lookup">("none");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    vendor: "",
    vendor_asset_id: "" as string,
    risk_level: "",
    status: "in_use",
    url: "",
    system_manager: "",
    contact_person: "",
    contact_email: "",
    delivery_model: "" as DeliveryModel | "",
    vendor_roles: [] as VendorRole[],
    priority: "" as PriorityKey | "",
    priority_reason: "",
  });

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("search");
      setSearchQuery("");
      setTrustResults([]);
      setWebResult(null);
      setSearchSource("none");
      setRiskSuggestion(null);
      setIsSuggestingRisk(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        vendor: "",
        vendor_asset_id: "",
        risk_level: "",
        status: "in_use",
        url: "",
        system_manager: "",
        contact_person: "",
        contact_email: "",
        delivery_model: "",
        vendor_roles: [],
        priority: "",
        priority_reason: "",
      });
    }
  }, [open]);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Search in Trust Engine first, then web
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchPerformed(true);
    setTrustResults([]);
    setWebResult(null);
    setSearchSource("none");

    try {
      const { data, error } = await supabase.functions.invoke("lookup-system", {
        body: { systemName: searchQuery.trim() },
      });

      if (error) throw error;

      if (data.source === "trust_engine" && data.results?.length > 0) {
        setTrustResults(data.results);
        setSearchSource("trust_engine");
      } else if (data.source === "web_lookup" && data.result) {
        setWebResult(data.result);
        setSearchSource("web_lookup");
        // Pre-fill form data from web lookup
        setFormData(prev => ({
          ...prev,
          name: data.result.official_name || searchQuery,
          description: data.result.description || "",
          category: data.result.suggested_category || "",
          vendor: data.result.vendor || "",
        }));
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Søkefeil",
        description: "Kunne ikke søke. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Force web search (when Trust Engine had results but user wants web)
  const handleWebSearch = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-system", {
        body: { systemName: searchQuery.trim(), searchWeb: true },
      });

      if (error) throw error;

      if (data.source === "web_lookup" && data.result) {
        setWebResult(data.result);
        setSearchSource("web_lookup");
        setTrustResults([]);
        setFormData(prev => ({
          ...prev,
          name: data.result.official_name || searchQuery,
          description: data.result.description || "",
          category: data.result.suggested_category || "",
          vendor: data.result.vendor || "",
        }));
      }
    } catch (error) {
      console.error("Web search error:", error);
      toast({
        title: "Søkefeil",
        description: "Kunne ikke søke på nett. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Select a Trust Engine result
  const handleSelectTrustResult = (result: TrustEngineResult) => {
    setFormData(prev => ({
      ...prev,
      name: result.name,
      description: result.description || "",
      category: result.category?.toLowerCase() || "",
      vendor: result.vendor || "",
    }));
    setStep("confirm");
  };

  // Submit system
  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const suggestedPrio = suggestPriority(formData.risk_level || null);
      const chosenPrio = (formData.priority || suggestedPrio) as PriorityKey;
      const prioSource = chosenPrio === suggestedPrio ? "lara" : "manual";
      const { data: userResp } = await supabase.auth.getUser();
      const who = userResp?.user?.email ?? userResp?.user?.id ?? "system";

      const insertData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        vendor: formData.vendor || null,
        vendor_asset_id: formData.vendor_asset_id || null,
        risk_level: formData.risk_level || null,
        criticality: formData.risk_level || null,
        status: formData.status,
        url: formData.url || null,
        system_manager: formData.system_manager || null,
        contact_person: formData.contact_person || null,
        contact_email: formData.contact_email || null,
        priority: chosenPrio,
        priority_source: prioSource,
        priority_suggested: suggestedPrio,
        priority_reason: prioSource === "manual" ? (formData.priority_reason.trim() || null) : null,
        priority_updated_at: new Date().toISOString(),
        priority_updated_by: who,
      };

      const { data: inserted, error } = await supabase
        .from("systems")
        .insert([insertData as never])
        .select("id")
        .single();
      if (error) throw error;

      const newId = (inserted as { id?: string } | null)?.id;
      if (newId) {
        await supabase.from("asset_priority_history").insert({
          asset_id: newId,
          entity_type: "system",
          from_priority: null,
          to_priority: chosenPrio,
          suggested_priority: suggestedPrio,
          source: prioSource,
          reason: prioSource === "manual" ? (formData.priority_reason.trim() || null) : null,
          changed_by: who,
        } as never);
      }

      // Update onboarding progress
      const { data: progressData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .single();

      if (progressData) {
        await supabase
          .from("onboarding_progress")
          .update({ systems_added: true })
          .eq("id", progressData.id);
      }

      const STATUS_LABELS: Record<string, string> = {
        in_use: "I bruk",
        evaluation: "Under evaluering",
        quarantined: "Karantene",
        phasing_out: "Fases ut",
        archived: "Arkivert",
        rejected: "Avvist",
      };
      const statusLabel = STATUS_LABELS[formData.status] || formData.status;

      toast({
        title: "Systemet er registrert ✅",
        description: `Systemet «${formData.name}» er lagt til med status «${statusLabel}».`,
      });

      onSystemAdded(formData.status);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding system:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til system. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canProceedFromSearch = searchSource !== "none" || formData.name.trim().length > 0;
  const canProceedFromRisk = formData.risk_level !== "";

  const handleSuggestRisk = async () => {
    setIsSuggestingRisk(true);
    setRiskSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-system-risk", {
        body: {
          systemName: formData.name,
          vendor: formData.vendor,
          category: formData.category,
          description: formData.description,
          hasAi: webResult?.has_ai || false,
        },
      });
      if (error) throw error;
      if (data?.risk_level) {
        setRiskSuggestion(data);
      }
    } catch (e) {
      console.error("Risk suggestion error:", e);
      toast({
        title: "Kunne ikke hente forslag",
        description: "AI-rådgiveren er ikke tilgjengelig. Velg risikonivå manuelt.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingRisk(false);
    }
  };

  // Vendor matching for the "vendor" step
  const vendorMatch = useVendorMatch({
    enabled: step === "vendor",
    vendorName: formData.vendor,
    parentVendor: webResult?.parent_vendor,
  });

  // Auto-skip vendor step if no candidate at all
  useEffect(() => {
    if (
      step === "vendor" &&
      !vendorMatch.isLoading &&
      !vendorMatch.exact &&
      !vendorMatch.suggested &&
      !vendorMatch.parentKnown
    ) {
      setStep("category");
    }
  }, [step, vendorMatch.isLoading, vendorMatch.exact, vendorMatch.suggested, vendorMatch.parentKnown]);

  const handleLinkExistingVendor = (vendor: VendorMatchCandidate) => {
    setFormData((prev) => ({ ...prev, vendor: vendor.name, vendor_asset_id: vendor.id }));
    toast({
      title: "Koblet til leverandør",
      description: `${formData.name || "Systemet"} er koblet til ${vendor.name}.`,
    });
    setStep("category");
  };

  const handleCreateAndLinkVendor = async (parentName: string) => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .insert([{ name: parentName, asset_type: "vendor" }])
        .select("id, name")
        .single();
      if (error) throw error;
      setFormData((prev) => ({ ...prev, vendor: data.name, vendor_asset_id: data.id }));
      toast({
        title: "Leverandør opprettet",
        description: `${parentName} er lagt til i registeret og koblet til systemet.`,
      });
      setStep("category");
    } catch (e) {
      console.error("Create vendor error:", e);
      toast({
        title: "Kunne ikke opprette leverandør",
        description: "Prøv igjen, eller hopp over og koble senere.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Legg til system
          </DialogTitle>
          <DialogDescription>
            {step === "search" && "Søk etter systemet i vårt bibliotek eller på nett."}
            {step === "confirm" && "Bekreft at dette er riktig system."}
            {step === "vendor" && "Vi har funnet leverandøren — vil du koble systemet?"}
            {step === "category" && "Lara har foreslått klassifisering — juster om nødvendig."}
            {step === "risk" && "Angi risikonivå og kritikalitet for systemet."}
            {step === "contact" && "Legg til kontaktinformasjon (valgfritt)."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={i <= currentStepIndex ? "text-primary font-medium" : ""}
              >
                {s.label}
              </span>
            ))}
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Skriv inn systemnavn, f.eks. Salesforce, Visma..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                autoFocus
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {isSearching && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">Søker...</p>
                  <p className="text-xs text-muted-foreground">Sjekker Trust Engine og gjør oppslag</p>
                </div>
              </div>
            )}

            {/* Trust Engine results */}
            {searchSource === "trust_engine" && trustResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Funnet i Trust Engine</span>
                  <Badge variant="secondary" className="text-xs">Verifisert</Badge>
                </div>
                <div className="space-y-2">
                  {trustResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectTrustResult(result)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.description}</p>
                          <div className="flex gap-2 mt-1">
                            {result.category && (
                              <Badge variant="outline" className="text-xs">{result.category}</Badge>
                            )}
                            {result.has_ai && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />AI
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={handleWebSearch} disabled={isSearching} className="w-full text-muted-foreground">
                  <Globe className="h-4 w-4 mr-2" />
                  Søk på nett i stedet
                </Button>
              </div>
            )}

            {/* Web lookup result */}
            {searchSource === "web_lookup" && webResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Resultat fra nett-oppslag</span>
                  {webResult.confidence === "high" && <Badge className="text-xs bg-status-closed/20 text-status-closed border-status-closed/30">Høy sikkerhet</Badge>}
                  {webResult.confidence === "medium" && <Badge className="text-xs bg-warning/20 text-warning border-warning/30">Middels sikkerhet</Badge>}
                  {webResult.confidence === "low" && <Badge className="text-xs bg-destructive/20 text-destructive border-destructive/30">Lav sikkerhet</Badge>}
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                  <div>
                    <p className="font-medium text-lg">{webResult.official_name}</p>
                    <p className="text-sm text-muted-foreground">av {webResult.vendor}</p>
                  </div>
                  <p className="text-sm">{webResult.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{CATEGORY_LABELS[webResult.suggested_category] || webResult.suggested_category}</Badge>
                    {webResult.has_ai && (
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />AI-funksjoner
                      </Badge>
                    )}
                    {webResult.is_data_processor && (
                      <Badge variant="outline" className="border-warning/30 text-warning">
                        Databehandler
                      </Badge>
                    )}
                    {webResult.vendor_country && (
                      <Badge variant="outline">{webResult.vendor_country}</Badge>
                    )}
                  </div>
                  {webResult.gdpr_note && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {webResult.gdpr_note}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setStep("confirm")} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Ja, dette er riktig
                  </Button>
                  <Button variant="outline" onClick={() => { setSearchSource("none"); setSearchPerformed(false); }} className="flex-1">
                    Nei, søk igjen
                  </Button>
                </div>
              </div>
            )}

            {/* No results */}
            {searchPerformed && !isSearching && searchSource === "none" && (
              <div className="p-4 rounded-lg border border-border bg-muted/20 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Ingen treff. Du kan registrere systemet manuelt.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, name: searchQuery }));
                    setStep("category");
                  }}
                >
                  Registrer manuelt
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-name">Systemnavn</Label>
              <Input
                id="confirm-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-vendor">Leverandør</Label>
              <Input
                id="confirm-vendor"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-desc">Beskrivelse</Label>
              <Textarea
                id="confirm-desc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {webResult?.data_types && webResult.data_types.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data systemet behandler</Label>
                <div className="flex flex-wrap gap-1">
                  {webResult.data_types.map((dt, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{dt}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("search")}>
                <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
              </Button>
              <Button onClick={() => setStep("vendor")} disabled={!formData.name.trim()}>
                Neste<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b: Vendor link */}
        {step === "vendor" && (
          <VendorLinkStep
            vendorName={formData.vendor}
            match={vendorMatch}
            onLinkExisting={handleLinkExistingVendor}
            onCreateAndLink={handleCreateAndLinkVendor}
            onSkip={() => setStep("category")}
            onBack={() => setStep("confirm")}
          />
        )}

        {/* Step 3: Category (AI-suggested) */}
        {step === "category" && (
          <div className="space-y-5">
            {/* Lara hero card */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <LaraAvatar size={32} />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Lara</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                    Mynder-agent
                  </Badge>
                  <span className="text-xs text-muted-foreground">· analyserte 4 kilder</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {webResult?.category_reason
                    ? webResult.category_reason
                    : `${formData.name || "Systemet"} tilbyr et bredt spekter av forretningssystemer. Forslagene under er basert på offentlig tilgjengelig informasjon — juster om noe ikke stemmer.`}
                </p>
              </div>
            </div>

            {/* Funksjonell kategori */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Funksjonell kategori</Label>
                <span className="text-xs text-muted-foreground">Hva systemet brukes til</span>
              </div>
              <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leveransemodell */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Leveransemodell</Label>
                <span className="text-xs text-muted-foreground">Hvordan systemet driftes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DELIVERY_MODELS.map(({ key, label, description, icon: Icon }) => {
                  const selected = formData.delivery_model === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, delivery_model: key }))}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Valget påvirker hvilke kontroller og dokumentasjonskrav som er relevante (DPA, datalokasjon, oppdateringspraksis).
              </p>
            </div>

            {/* Leverandørrolle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Leverandørrolle</Label>
                <span className="text-xs text-muted-foreground">Velg én eller flere</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {VENDOR_ROLES.map(({ key, label }) => {
                  const selected = formData.vendor_roles.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        vendor_roles: selected
                          ? prev.vendor_roles.filter(r => r !== key)
                          : [...prev.vendor_roles, key],
                      }))}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40 hover:bg-muted/30"
                      }`}
                      aria-pressed={selected}
                    >
                      {selected
                        ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        : <Circle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                      {label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
                  onClick={() => { /* future: open custom role input */ }}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Legg til egen
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Samme leverandør kan ha flere roller (f.eks. Microsoft leverer både programvare og infrastruktur).
              </p>
            </div>

            {webResult?.ai_features && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">AI-funksjoner identifisert</Label>
                <p className="text-sm bg-muted/30 p-2 rounded">{webResult.ai_features}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                Endringer lagres automatisk
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("vendor")}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
                </Button>
                <Button onClick={() => setStep("risk")} disabled={!formData.category}>
                  Neste<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Risk & Criticality */}
        {step === "risk" && (
          <div className="space-y-4">
            {/* AI Risk Suggestion */}
            {!riskSuggestion && !isSuggestingRisk && (
              <Button
                variant="outline"
                onClick={handleSuggestRisk}
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Sparkles className="h-4 w-4" />
                La Lara foreslå risikonivå for {formData.name}
              </Button>
            )}

            {isSuggestingRisk && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">Lara analyserer systemet...</p>
                  <p className="text-xs text-muted-foreground">Vurderer risiko basert på {formData.name}</p>
                </div>
              </div>
            )}

            {riskSuggestion && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Laras anbefaling</p>
                    <p className="text-sm text-muted-foreground">{riskSuggestion.reasoning}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, risk_level: riskSuggestion.risk_level }));
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Bruk foreslått nivå: {riskSuggestion.risk_level === "low" ? "Lav" : riskSuggestion.risk_level === "medium" ? "Middels" : riskSuggestion.risk_level === "high" ? "Høy" : "Kritisk"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Risikonivå *</Label>
              <Select value={formData.risk_level} onValueChange={(v) => setFormData(prev => ({ ...prev, risk_level: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg risikonivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-status-closed" />
                      Lav
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                      Middels
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                      Høy
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                      Kritisk
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.risk_level && (() => {
              const suggested = suggestPriority(formData.risk_level);
              const selected = (formData.priority || suggested) as PriorityKey;
              const isOverride = selected !== suggested;
              return (
                <div className="space-y-2 rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        Lara foreslår prioritet:{" "}
                        <span className="text-primary">{priorityLabel(suggested)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestionRationale(formData.risk_level)}. Du kan overstyre.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRIORITY_KEYS.map((p) => {
                      const meta = PRIORITY_META[p];
                      const isSel = selected === p;
                      const isSugg = p === suggested;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs text-left transition",
                            isSel
                              ? "border-primary bg-background ring-1 ring-primary/30"
                              : "border-border bg-background/60 hover:bg-background",
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} aria-hidden />
                          <span className="font-medium">{meta.labelNb}</span>
                          {isSugg && (
                            <Sparkles className="ml-auto h-3 w-3 text-primary opacity-70" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isOverride && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Begrunnelse for overstyring{" "}
                        <span className="text-muted-foreground font-normal">(valgfritt, men anbefalt)</span>
                      </Label>
                      <Textarea
                        value={formData.priority_reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority_reason: e.target.value }))}
                        placeholder="F.eks. kompenserende kontroller, system under utfasing, klinisk kontekst"
                        rows={2}
                        className="text-xs resize-none bg-background"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_use">I bruk</SelectItem>
                  <SelectItem value="evaluation">Under evaluering</SelectItem>
                  <SelectItem value="quarantined">Karantene</SelectItem>
                  <SelectItem value="phasing_out">Fases ut</SelectItem>
                  <SelectItem value="rejected">Avvist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("category")}>
                <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
              </Button>
              <Button onClick={() => setStep("contact")} disabled={!canProceedFromRisk}>
                Neste<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Contact info (optional) */}
        {step === "contact" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Legg til kontaktperson hos leverandøren. Dette er nødvendig for å kunne sende forespørsler.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-person">Kontaktperson hos leverandør</Label>
              <Input
                id="contact-person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="Navn på kontaktperson"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Kontakt e-post</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="kontakt@leverandor.no"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-url">System-URL</Label>
              <Input
                id="system-url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Oppsummering
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">System:</span>
                <span className="font-medium">{formData.name}</span>
                <span className="text-muted-foreground">Leverandør:</span>
                <span>{formData.vendor || "—"}</span>
                <span className="text-muted-foreground">Kategori:</span>
                <span>{CATEGORY_LABELS[formData.category] || formData.category || "—"}</span>
                <span className="text-muted-foreground">Risikonivå:</span>
                <span className="capitalize">{formData.risk_level || "—"}</span>
                {formData.contact_person && (
                  <>
                    <span className="text-muted-foreground">Kontaktperson:</span>
                    <span>{formData.contact_person}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("risk")}>
                <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Lagrer...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Registrer system</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
