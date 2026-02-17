import { useState, useEffect } from "react";
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
  ChevronRight, ChevronLeft, Sparkles, Shield, User, Building
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AddSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSystemAdded: () => void;
}

type WizardStep = "search" | "confirm" | "category" | "risk" | "contact";

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
  confidence: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  crm: "CRM",
  erp: "ERP",
  hr: "HR",
  productivity: "Produktivitet",
  communication: "Kommunikasjon",
  storage: "Lagring",
  security: "Sikkerhet",
  monitoring: "Overvåkning",
  finance: "Finans",
  marketing: "Markedsføring",
  "e-commerce": "E-handel",
  project_management: "Prosjektstyring",
  development: "Utvikling",
  analytics: "Analyse",
  other: "Annet",
};

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "search", label: "Søk" },
  { key: "confirm", label: "Bekreft" },
  { key: "category", label: "Kategori" },
  { key: "risk", label: "Risiko" },
  { key: "contact", label: "Kontakt" },
];

export function AddSystemDialog({ open, onOpenChange, onSystemAdded }: AddSystemDialogProps) {
  const [step, setStep] = useState<WizardStep>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    risk_level: "",
    status: "active",
    url: "",
    system_manager: "",
  });

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("search");
      setSearchQuery("");
      setTrustResults([]);
      setWebResult(null);
      setSearchSource("none");
      setSearchPerformed(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        vendor: "",
        risk_level: "",
        status: "active",
        url: "",
        system_manager: "",
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
      const insertData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        vendor: formData.vendor || null,
        risk_level: formData.risk_level || null,
        status: formData.status,
        url: formData.url || null,
        system_manager: formData.system_manager || null,
      };

      const { error } = await supabase.from("systems").insert([insertData]);
      if (error) throw error;

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

      toast({
        title: "System registrert! ✅",
        description: `${formData.name} er nå lagt til i systemregisteret.`,
      });

      onSystemAdded();
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
            {step === "category" && "AI har foreslått en kategori — juster om nødvendig."}
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
                  {webResult.confidence === "high" && <Badge className="text-xs bg-green-500/20 text-green-600 border-green-500/30">Høy sikkerhet</Badge>}
                  {webResult.confidence === "medium" && <Badge className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Middels sikkerhet</Badge>}
                  {webResult.confidence === "low" && <Badge className="text-xs bg-red-500/20 text-red-600 border-red-500/30">Lav sikkerhet</Badge>}
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
                      <Badge variant="outline" className="border-orange-500/30 text-orange-600">
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
              <Button onClick={() => setStep("category")} disabled={!formData.name.trim()}>
                Neste<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Category (AI-suggested) */}
        {step === "category" && (
          <div className="space-y-4">
            {webResult?.category_reason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">AI-forslag</p>
                  <p className="text-xs text-muted-foreground">{webResult.category_reason}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Kategori</Label>
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

            {webResult?.ai_features && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">AI-funksjoner identifisert</Label>
                <p className="text-sm bg-muted/30 p-2 rounded">{webResult.ai_features}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("confirm")}>
                <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
              </Button>
              <Button onClick={() => setStep("risk")}>
                Neste<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Risk & Criticality */}
        {step === "risk" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Risikonivå *</Label>
              <Select value={formData.risk_level} onValueChange={(v) => setFormData(prev => ({ ...prev, risk_level: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg risikonivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Lav
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      Middels
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      Høy
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Kritisk
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="planned">Planlagt</SelectItem>
                  <SelectItem value="decommissioned">Utfaset</SelectItem>
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
                Kontaktinformasjon er valgfritt, men nødvendig for å kunne sende forespørsler til leverandøren.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-manager">Systemansvarlig</Label>
              <Input
                id="system-manager"
                value={formData.system_manager}
                onChange={(e) => setFormData(prev => ({ ...prev, system_manager: e.target.value }))}
                placeholder="Navn på systemansvarlig"
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
