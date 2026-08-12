import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Shield, CheckCircle2, Search, Building2,
  ChevronDown, ChevronRight, Link2, Wand2,
} from "lucide-react";

import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { LaraDraftCard, type LaraDraftField } from "./LaraDraftCard";
import { useVendorMatch } from "@/hooks/useVendorMatch";
import {
  PRIORITY_KEYS,
  PRIORITY_META,
  suggestPriority,
  suggestionRationale,
  type PriorityKey,
} from "@/lib/derivedPriority";

interface AddSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSystemAdded: (status?: string) => void;
}

type Phase = "input" | "working" | "review";

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
  erp: "ERP – Økonomistyring",
  hr: "HR – Personal og lønn",
  productivity: "Produktivitet og kontor",
  communication: "Kommunikasjon",
  storage: "Fil- og dokumentlagring",
  security: "Sikkerhet og IAM",
  monitoring: "Overvåkning og logging",
  finance: "Finans og regnskap",
  marketing: "Markedsføring",
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
  communication: "Communication",
  storage: "File and Document Storage",
  security: "Security and IAM",
  monitoring: "Monitoring and Logging",
  finance: "Finance and Accounting",
  marketing: "Marketing",
  "e-commerce": "E-commerce and Payments",
  project_management: "Project and Task Management",
  development: "Development and DevOps",
  analytics: "Analytics and BI",
  other: "Other",
};

type DeliveryModel = "saas" | "on_prem" | "hybrid" | "private_cloud" | "open_source" | "other";

const getDeliveryModels = (isNb: boolean): { value: DeliveryModel; label: string }[] => [
  { value: "saas", label: isNb ? "SaaS / Sky" : "SaaS / Cloud" },
  { value: "on_prem", label: "On-prem" },
  { value: "hybrid", label: "Hybrid" },
  { value: "private_cloud", label: isNb ? "Privat sky" : "Private cloud" },
  { value: "open_source", label: "Open source" },
  { value: "other", label: isNb ? "Annet" : "Other" },
];

const STATUS_LABELS: Record<string, string> = {
  in_use: "I bruk",
  evaluation: "Under evaluering",
  quarantined: "Karantene",
  phasing_out: "Fases ut",
  archived: "Arkivert",
  rejected: "Avvist",
};

/** Enkel heuristikk for leveransemodell når Lara ikke har eksplisitt svar. */
function inferDeliveryModel(web: WebLookupResult | null): DeliveryModel {
  const text = `${web?.description ?? ""} ${web?.suggested_category ?? ""}`.toLowerCase();
  if (text.includes("on-prem") || text.includes("lokalt installert")) return "on_prem";
  if (text.includes("open source")) return "open_source";
  return "saas";
}

export function AddSystemDialog({ open, onOpenChange, onSystemAdded }: AddSystemDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const CATEGORY_LABELS = useMemo(() => getCategoryLabels(isNb), [isNb]);
  const DELIVERY_MODELS = useMemo(() => getDeliveryModels(isNb), [isNb]);
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("input");
  const [query, setQuery] = useState("");
  const [workingLine, setWorkingLine] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [trustResults, setTrustResults] = useState<TrustEngineResult[]>([]);
  const [webResult, setWebResult] = useState<WebLookupResult | null>(null);
  const [riskRationale, setRiskRationale] = useState<string>("");
  const [laraTouched, setLaraTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
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
    delivery_model: "" as DeliveryModel | "",
    priority: "" as PriorityKey | "",
    priority_reason: "",
  });

  useEffect(() => {
    if (!open) return;
    setPhase("input");
    setQuery("");
    setTrustResults([]);
    setWebResult(null);
    setRiskRationale("");
    setLaraTouched({});
    setShowDetails(false);
    setFormData({
      name: "", description: "", category: "", vendor: "", vendor_asset_id: "",
      risk_level: "", status: "in_use", url: "", system_manager: "",
      contact_person: "", contact_email: "", delivery_model: "", priority: "", priority_reason: "",
    });
  }, [open]);

  const workingLines = isNb
    ? ["Slår opp systemet…", "Finner leverandør…", "Klassifiserer bruksområde…", "Vurderer risiko og persondata…"]
    : ["Looking up the system…", "Finding the vendor…", "Classifying the use case…", "Assessing risk and personal data…"];

  useEffect(() => {
    if (phase !== "working") return;
    setWorkingLine(0);
    const t = setInterval(() => setWorkingLine((l) => Math.min(l + 1, workingLines.length - 1)), 900);
    return () => clearInterval(t);
  }, [phase, workingLines.length]);

  /** Laras utkast: ett kall som slår opp, klassifiserer og vurderer risiko. */
  const runLara = async (name: string, opts?: { forceWeb?: boolean }) => {
    const term = name.trim();
    if (!term) return;
    setPhase("working");
    setTrustResults([]);

    let web: WebLookupResult | null = null;
    let draft = { name: term, description: "", category: "", vendor: "" };

    try {
      const { data, error } = await supabase.functions.invoke("lookup-system", {
        body: { systemName: term, searchWeb: opts?.forceWeb || undefined },
      });
      if (error) throw error;

      if (!opts?.forceWeb && data?.source === "trust_engine" && data.results?.length > 1) {
        setTrustResults(data.results);
        setPhase("input");
        return;
      }
      if (data?.source === "trust_engine" && data.results?.length === 1) {
        const r = data.results[0] as TrustEngineResult;
        draft = {
          name: r.name,
          description: r.description || "",
          category: r.category?.toLowerCase() || "",
          vendor: r.vendor || "",
        };
      } else if (data?.source === "web_lookup" && data.result) {
        web = data.result as WebLookupResult;
        draft = {
          name: web.official_name || term,
          description: web.description || "",
          category: web.suggested_category || "",
          vendor: web.vendor || "",
        };
      }
    } catch (e) {
      console.error("Lookup error:", e);
    }

    setWebResult(web);

    // Risikovurdering fra Lara
    let risk = "";
    let rationale = "";
    try {
      const { data: riskData } = await supabase.functions.invoke("suggest-system-risk", {
        body: {
          systemName: draft.name,
          vendor: draft.vendor,
          category: draft.category,
          description: draft.description,
          hasAi: web?.has_ai || false,
        },
      });
      if (riskData?.risk_level) {
        risk = riskData.risk_level;
        rationale = riskData.reasoning || "";
      }
    } catch (e) {
      console.error("Risk suggestion error:", e);
    }

    const delivery = inferDeliveryModel(web);
    setRiskRationale(rationale);
    setFormData((prev) => ({
      ...prev,
      ...draft,
      category: draft.category || "other",
      risk_level: risk || "medium",
      delivery_model: delivery,
      priority: suggestPriority(risk || "medium") as PriorityKey,
    }));
    setLaraTouched({
      category: Boolean(draft.category),
      delivery_model: true,
      risk_level: Boolean(risk),
      priority: Boolean(risk),
      vendor: Boolean(draft.vendor),
    });
    setPhase("review");
  };

  const selectTrustResult = (r: TrustEngineResult) => {
    setWebResult(null);
    setFormData((prev) => ({
      ...prev,
      name: r.name,
      description: r.description || "",
      category: r.category?.toLowerCase() || "other",
      vendor: r.vendor || "",
      risk_level: prev.risk_level || "medium",
      delivery_model: prev.delivery_model || "saas",
      priority: (prev.priority || suggestPriority("medium")) as PriorityKey,
    }));
    setLaraTouched({ category: Boolean(r.category), delivery_model: true, vendor: Boolean(r.vendor) });
    setTrustResults([]);
    setPhase("review");
  };

  // Leverandørkobling skjer i bakgrunnen på bekreftelsesskjermen
  const vendorMatch = useVendorMatch({
    enabled: phase === "review" && !!formData.vendor && !formData.vendor_asset_id,
    vendorName: formData.vendor,
    parentVendor: webResult?.parent_vendor,
  });

  useEffect(() => {
    if (phase !== "review") return;
    if (formData.vendor_asset_id) return;
    if (vendorMatch.exact) {
      setFormData((prev) => ({ ...prev, vendor: vendorMatch.exact!.name, vendor_asset_id: vendorMatch.exact!.id }));
    }
  }, [phase, vendorMatch.exact, formData.vendor_asset_id]);

  const linkSuggestedVendor = () => {
    const cand = vendorMatch.suggested;
    if (!cand) return;
    setFormData((prev) => ({ ...prev, vendor: cand.name, vendor_asset_id: cand.id }));
  };

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

      const { data: progressData } = await supabase.from("onboarding_progress").select("*").single();
      if (progressData) {
        await supabase.from("onboarding_progress").update({ systems_added: true }).eq("id", progressData.id);
      }

      toast({
        title: "Systemet er registrert ✅",
        description: `Systemet «${formData.name}» er lagt til med status «${STATUS_LABELS[formData.status] || formData.status}».`,
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

  const suggestedPrio = suggestPriority(formData.risk_level || null);

  const draftFields: LaraDraftField[] = [
    {
      key: "category",
      label: isNb ? "Kategori" : "Category",
      value: formData.category,
      options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
      onChange: (v) => { setFormData((p) => ({ ...p, category: v })); setLaraTouched((t) => ({ ...t, category: false })); },
      rationale: webResult?.category_reason,
      fromLara: laraTouched.category,
    },
    {
      key: "delivery_model",
      label: isNb ? "Leveransemodell" : "Delivery model",
      value: formData.delivery_model,
      options: DELIVERY_MODELS,
      onChange: (v) => { setFormData((p) => ({ ...p, delivery_model: v as DeliveryModel })); setLaraTouched((t) => ({ ...t, delivery_model: false })); },
      rationale: isNb
        ? "Utledet fra hvordan systemet leveres. Påvirker krav til DPA, datalokasjon og oppdateringspraksis."
        : "Derived from how the system is delivered. Affects DPA, data location and update requirements.",
      fromLara: laraTouched.delivery_model,
    },
    {
      key: "risk_level",
      label: isNb ? "Kritikalitet" : "Criticality",
      value: formData.risk_level,
      options: [
        { value: "low", label: isNb ? "Lav" : "Low", dotClass: "bg-status-closed" },
        { value: "medium", label: isNb ? "Middels" : "Medium", dotClass: "bg-warning" },
        { value: "high", label: isNb ? "Høy" : "High", dotClass: "bg-warning" },
        { value: "critical", label: isNb ? "Kritisk" : "Critical", dotClass: "bg-destructive" },
      ],
      onChange: (v) => {
        setFormData((p) => ({ ...p, risk_level: v, priority: suggestPriority(v) as PriorityKey }));
        setLaraTouched((t) => ({ ...t, risk_level: false }));
      },
      rationale: riskRationale,
      fromLara: laraTouched.risk_level,
    },
    {
      key: "priority",
      label: isNb ? "Prioritet" : "Priority",
      value: (formData.priority || suggestedPrio) as string,
      options: PRIORITY_KEYS.map((p) => ({ value: p, label: PRIORITY_META[p].labelNb, dotClass: PRIORITY_META[p].dotClass })),
      onChange: (v) => { setFormData((p) => ({ ...p, priority: v as PriorityKey })); setLaraTouched((t) => ({ ...t, priority: false })); },
      rationale: formData.risk_level ? suggestionRationale(formData.risk_level) : undefined,
      fromLara: laraTouched.priority && (formData.priority || suggestedPrio) === suggestedPrio,
    },
    {
      key: "status",
      label: "Status",
      value: formData.status,
      options: [
        { value: "in_use", label: isNb ? "I bruk" : "In use" },
        { value: "evaluation", label: isNb ? "Under evaluering" : "Under evaluation" },
        { value: "quarantined", label: isNb ? "Karantene" : "Quarantined" },
        { value: "phasing_out", label: isNb ? "Fases ut" : "Phasing out" },
        { value: "rejected", label: isNb ? "Avvist" : "Rejected" },
      ],
      onChange: (v) => setFormData((p) => ({ ...p, status: v })),
    },
  ];

  const isOverridePrio = (formData.priority || suggestedPrio) !== suggestedPrio;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isNb ? "Legg til system" : "Add system"}
          </DialogTitle>
          <DialogDescription>
            {phase === "review"
              ? (isNb ? "Lara har fylt ut alt. Se over og lagre — juster kun det som ikke stemmer." : "Lara filled everything in. Review and save — adjust only what's wrong.")
              : (isNb ? "Skriv navnet på systemet, så gjør Lara resten." : "Type the system name and Lara does the rest.")}
          </DialogDescription>
        </DialogHeader>

        {/* Steg 1: ett felt */}
        {phase === "input" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isNb ? "F.eks. Slack, Visma Lønn eller slack.com" : "E.g. Slack, Visma or slack.com"}
                  onKeyDown={(e) => e.key === "Enter" && runLara(query)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <Button onClick={() => runLara(query)} disabled={!query.trim()}>
                <Wand2 className="h-4 w-4 mr-2" />
                {isNb ? "La Lara fylle ut" : "Let Lara fill in"}
              </Button>
            </div>

            {trustResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Lara fant flere treff — hvilket mente du?" : "Lara found several matches — which one?"}
                </p>
                {trustResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectTrustResult(r)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.vendor || r.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => runLara(query, { forceWeb: true })}>
                  {isNb ? "Ingen av disse — søk på nett" : "None of these — search the web"}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Lara slår opp leverandør, kategori, leveransemodell og kritikalitet. Du bekrefter på neste skjerm."
                : "Lara looks up vendor, category, delivery model and criticality. You confirm on the next screen."}
            </p>
          </div>
        )}

        {/* Lara jobber */}
        {phase === "working" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <LaraAvatar size={32} />
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold">{isNb ? "Lara jobber…" : "Lara is working…"}</p>
              <ul className="space-y-1">
                {workingLines.map((line, i) => (
                  <li key={line} className="flex items-center gap-2 text-xs">
                    {i < workingLine ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : i === workingLine ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-border" />
                    )}
                    <span className={i <= workingLine ? "text-foreground" : "text-muted-foreground"}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Steg 2: Laras utkast */}
        {phase === "review" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3 space-y-2">
              <div className="flex items-start gap-3">
                <LaraAvatar size={28} />
                <div className="flex-1 min-w-0 space-y-1">
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="h-8 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
                    aria-label={isNb ? "Systemnavn" : "System name"}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{formData.vendor || (isNb ? "Ukjent leverandør" : "Unknown vendor")}</span>
                    {formData.vendor_asset_id && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                        <Link2 className="h-3 w-3" />
                        {isNb ? "Koblet" : "Linked"}
                      </Badge>
                    )}
                    {webResult?.is_data_processor && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning/30 text-warning">
                        {isNb ? "Databehandler" : "Data processor"}
                      </Badge>
                    )}
                    {webResult?.has_ai && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" />AI
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!formData.vendor_asset_id && vendorMatch.suggested && (
                <button
                  type="button"
                  onClick={linkSuggestedVendor}
                  className="w-full text-left text-xs rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  {isNb ? "Koble til eksisterende leverandør" : "Link to existing vendor"}{" "}
                  <span className="font-medium text-foreground">{vendorMatch.suggested.name}</span>
                </button>
              )}
            </div>

            <LaraDraftCard fields={draftFields} />

            {isOverridePrio && (
              <div className="space-y-1">
                <Label className="text-xs">
                  {isNb ? "Begrunnelse for overstyrt prioritet" : "Reason for priority override"}{" "}
                  <span className="text-muted-foreground font-normal">{isNb ? "(valgfritt)" : "(optional)"}</span>
                </Label>
                <Textarea
                  value={formData.priority_reason}
                  onChange={(e) => setFormData((p) => ({ ...p, priority_reason: e.target.value }))}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder={isNb ? "F.eks. kompenserende kontroller eller system under utfasing" : "E.g. compensating controls or system being phased out"}
                />
              </div>
            )}

            {/* Valgfrie detaljer */}
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "" : "-rotate-90"}`} />
              {isNb ? "Vis detaljer (valgfritt)" : "Show details (optional)"}
            </button>

            {showDetails && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isNb ? "Beskrivelse" : "Description"}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isNb ? "Kontaktperson hos leverandør" : "Vendor contact"}</Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))}
                      placeholder={isNb ? "Navn" : "Name"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isNb ? "Kontakt e-post" : "Contact email"}</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData((p) => ({ ...p, contact_email: e.target.value }))}
                      placeholder={isNb ? "kontakt@leverandor.no" : "contact@vendor.com"}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isNb ? "System-URL" : "System URL"}</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setPhase("input")}>
                {isNb ? "Bytt system" : "Change system"}
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !formData.name.trim()}>
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isNb ? "Lagrer…" : "Saving…"}</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />{isNb ? "Lagre system" : "Save system"}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
