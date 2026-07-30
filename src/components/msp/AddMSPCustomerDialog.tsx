import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  UserPlus, FileSpreadsheet, Server, ArrowLeft, Search, Building2,
  MapPin, Loader2, CheckCircle2, User, Mail, Briefcase, Upload, AlertCircle, Trash2, Sparkles, Globe, Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { COMPANY_ROLES, MSP_SUBSCRIPTION_TIERS } from "@/lib/mspCustomerConstants";
import { PARTNER_TEAM } from "@/lib/partnerTeam";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatKr } from "@/lib/planConstants";
import { recommendFrameworks, type FrameworkRecommendation } from "@/lib/regulationRecommender";
import laraButterfly from "@/assets/lara-butterfly.png";

interface AddMSPCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface BrregResult {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: { kode: string; beskrivelse: string };
  naeringskode1?: { kode: string; beskrivelse: string };
  antallAnsatte?: number;
  forretningsadresse?: { kommune: string; poststed: string };
  hjemmeside?: string | null;
}

function normalizeWebsite(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s || s.includes(" ") || !s.includes(".")) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

type Step = "method" | "country" | "search" | "results" | "verifying" | "manual" | "contact" | "recommend" | "success" | "bulk" | "bulk-success" | "acronis" | "acronis-processing";

const ACRONIS_DEMO_TENANTS: Array<{
  tenant_id: string;
  name: string;
  org_number: string;
  industry: string;
  devices: number;
  employees: number;
}> = [
  { tenant_id: "ac-001", name: "Nordlys Regnskap AS", org_number: "987654321", industry: "Regnskap, bokføring og revisjon", devices: 14, employees: 22 },
  { tenant_id: "ac-002", name: "Fjord Eiendom AS", org_number: "912345678", industry: "Omsetning og drift av fast eiendom", devices: 8, employees: 11 },
  { tenant_id: "ac-003", name: "Polar Maritime AS", org_number: "923456781", industry: "Skipsfart og maritim tjenesteyting", devices: 26, employees: 48 },
];

const STEP_LABELS = ["method", "country", "search", "contact"];

const COUNTRIES: { code: string; name: string; registry: string; supported: boolean }[] = [
  { code: "NO", name: "Norge", registry: "Brønnøysundregistrene", supported: true },
  { code: "SE", name: "Sverige", registry: "Bolagsverket", supported: false },
  { code: "DK", name: "Danmark", registry: "CVR", supported: false },
  { code: "FI", name: "Finland", registry: "PRH", supported: false },
  { code: "DE", name: "Tyskland", registry: "Handelsregister", supported: false },
  { code: "GB", name: "Storbritannia", registry: "Companies House", supported: false },
  { code: "NL", name: "Nederland", registry: "KVK", supported: false },
  { code: "US", name: "USA", registry: "SEC EDGAR", supported: false },
];

interface BulkRow {
  org_number: string;
  customer_name: string;
  contact_person?: string;
  contact_email?: string;
  status: "ok" | "duplicate" | "invalid";
  reason?: string;
}

// Demo/prototype: tillat oppretting av kundeprofil uten innlogget bruker
const DEMO_MSP_USER_ID = "00000000-0000-0000-0000-000000000000";


export function AddMSPCustomerDialog({ open, onOpenChange, onSuccess }: AddMSPCustomerDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("method");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BrregResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<BrregResult | null>(null);
  const [duplicateFound, setDuplicateFound] = useState(false);
  type WebsiteSource = "brreg" | "ai_suggested" | "manual" | "none";
  const [websiteSource, setWebsiteSource] = useState<WebsiteSource>("none");




  const [form, setForm] = useState({
    contact_person: "",
    contact_email: "",
    contact_company_role: "",
    account_manager: "",
    has_website: true,
    url: "",
    privacy_policy_url: "",
    subscription_plan: "Gratis",
    country_code: "NO",
  });
  type PrivacyPolicySource = "ai_detected" | "manual" | "none";
  const [privacyPolicySource, setPrivacyPolicySource] = useState<PrivacyPolicySource>("none");

  // Manual entry (used when BrReg has no hit, or country not supported)
  const [manual, setManual] = useState({
    customer_name: "",
    org_number: "",
    industry: "",
    employees: "" as "" | "1-10" | "11-50" | "51-200" | "201-500" | "500+",
  });

  // License info
  const { data: licenseInfo } = useQuery({
    queryKey: ["msp-license-info", user?.id],
    queryFn: async () => {
      const { data: availableLicenses } = await supabase
        .from("msp_licenses" as any)
        .select("id")
        .eq("msp_user_id", user!.id)
        .eq("status", "available")
        .order("created_at", { ascending: true });
      return { firstAvailableId: (availableLicenses as any)?.[0]?.id || null };
    },
    enabled: !!user?.id && open,
  });

  // Regelverk aktiveres av partneren i «Veiledning fra Mynder», ikke i wizarden.
  const activeFrameworks: string[] = [];

  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkSavedCount, setBulkSavedCount] = useState(0);

  // Acronis multi-select state
  const [acronisSelected, setAcronisSelected] = useState<Set<string>>(new Set());
  const [acronisImporting, setAcronisImporting] = useState(false);
  const [acronisImportedCount, setAcronisImportedCount] = useState(0);
  const [acronisProgressStep, setAcronisProgressStep] = useState(0);

  // Industry enrichment progress (verifying step)
  type IndustrySource = "brreg_main" | "brreg_subunit" | "ai_suggested" | "none";
  const [industrySource, setIndustrySource] = useState<IndustrySource>("none");
  const [enrichStep, setEnrichStep] = useState<"main" | "subunit" | "ai" | "done">("main");
  const [businessDescription, setBusinessDescription] = useState<string>("");


  const reset = useCallback(() => {
    setStep("method");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCompany(null);
    setDuplicateFound(false);
    setBulkText("");
    setBulkRows([]);
    setBulkSavedCount(0);
    setAcronisSelected(new Set());
    setAcronisImporting(false);
    setAcronisImportedCount(0);
    setForm({ contact_person: "", contact_email: "", contact_company_role: "", account_manager: "", has_website: true, url: "", privacy_policy_url: "", subscription_plan: "Gratis", country_code: "NO" });
    setPrivacyPolicySource("none");
    setManual({ customer_name: "", org_number: "", industry: "", employees: "" });
    setIndustrySource("none");
    setWebsiteSource("none");
    setEnrichStep("main");
    setBusinessDescription("");
  }, []);


  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Search BrReg
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(searchQuery.trim())}&size=5`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const results: BrregResult[] = (data._embedded?.enheter || []).map((e: any) => ({
        organisasjonsnummer: e.organisasjonsnummer,
        navn: e.navn,
        organisasjonsform: e.organisasjonsform,
        naeringskode1: e.naeringskode1,
        antallAnsatte: e.antallAnsatte,
        forretningsadresse: e.forretningsadresse,
      }));
      setSearchResults(results);
      if (results.length > 0) setStep("results");
      else toast.info("Ingen treff. Prøv et annet søkeord.");
    } catch {
      toast.error("Kunne ikke søke i registeret");
    } finally {
      setSearchLoading(false);
    }
  };

  // Select company → verify + enrich (BrReg detail → subunit → AI fallback)
  const handleSelectCompany = async (company: BrregResult) => {
    setSelectedCompany(company);
    setStep("verifying");
    setDuplicateFound(false);
    setIndustrySource("none");
    setEnrichStep("main");

    // Duplicate check
    try {
      const { data } = await supabase
        .from("msp_customers")
        .select("id")
        .eq("org_number", company.organisasjonsnummer)
        .limit(1);
      if (data && data.length > 0) {
        setDuplicateFound(true);
        setTimeout(() => setStep("results"), 2500);
        return;
      }
    } catch { /* ignore */ }

    // Enrich industry
    let enriched: BrregResult = { ...company };
    let websiteFromAi = false;
    const isMissing = (c: BrregResult) => {
      const b = c.naeringskode1?.beskrivelse?.trim().toLowerCase();
      return !b || b === "uoppgitt" || b === "ikke oppgitt";
    };


    // 1. Full detail on main entity
    try {
      const detailRes = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter/${company.organisasjonsnummer}`
      );
      if (detailRes.ok) {
        const d = await detailRes.json();
        enriched = {
          ...enriched,
          naeringskode1: d.naeringskode1 || enriched.naeringskode1,
          antallAnsatte: d.antallAnsatte ?? enriched.antallAnsatte,
          forretningsadresse: d.forretningsadresse || enriched.forretningsadresse,
          hjemmeside: d.hjemmeside || enriched.hjemmeside || null,
        };
        if (!isMissing(enriched)) setIndustrySource("brreg_main");
      }
    } catch { /* ignore */ }

    // 2. Try subunits if still missing
    if (isMissing(enriched)) {
      setEnrichStep("subunit");
      try {
        const subRes = await fetch(
          `https://data.brreg.no/enhetsregisteret/api/underenheter?overordnetEnhet=${company.organisasjonsnummer}&size=10`
        );
        if (subRes.ok) {
          const subData = await subRes.json();
          const subs: any[] = subData._embedded?.underenheter || [];
          const hit = subs.find(
            (s) => s.naeringskode1?.beskrivelse &&
                   s.naeringskode1.beskrivelse.trim().toLowerCase() !== "uoppgitt"
          );
          if (hit) {
            enriched.naeringskode1 = hit.naeringskode1;
            setIndustrySource("brreg_subunit");
          }
          if (!enriched.hjemmeside) {
            const withSite = subs.find((s) => s.hjemmeside);
            if (withSite?.hjemmeside) enriched.hjemmeside = withSite.hjemmeside;
          }
        }
      } catch { /* ignore */ }
    }

    // 3. AI fallback
    if (isMissing(enriched)) {
      setEnrichStep("ai");
      try {
        const { data: aiRes } = await supabase.functions.invoke("suggest-industry", {
          body: {
            name: company.navn,
            org_number: company.organisasjonsnummer,
            country_code: form.country_code,
          },
        });
        if (aiRes?.industry && aiRes.industry !== "Ukjent bransje") {
          enriched.naeringskode1 = { kode: "", beskrivelse: aiRes.industry };
          setIndustrySource("ai_suggested");
        }
        if (!enriched.hjemmeside && (aiRes?.website || aiRes?.hjemmeside)) {
          enriched.hjemmeside = aiRes.website || aiRes.hjemmeside;
          websiteFromAi = true;
        }
      } catch { /* ignore */ }
    } else if (industrySource === "none") {
      // safety: source set to subunit above already if applicable
    }

    // Prefill website from register / AI suggestion (user can always override)
    const suggestedUrl = normalizeWebsite(enriched.hjemmeside);
    if (suggestedUrl) {
      setForm((f) => ({ ...f, has_website: true, url: suggestedUrl }));
      setWebsiteSource(websiteFromAi ? "ai_suggested" : "brreg");
    } else {
      // Ingen treff – behold "Ja, har nettside" med tomt felt så partneren kan fylle inn senere
      setForm((f) => ({ ...f, has_website: true, url: "" }));
      setWebsiteSource("none");
    }


    setEnrichStep("done");
    setSelectedCompany(enriched);

    // Generate short business description from public register data (best-effort)
    try {
      const industryLabel = enriched.naeringskode1?.beskrivelse || "";
      const { data: descRes } = await supabase.functions.invoke("suggest-company-description", {
        body: {
          companyName: enriched.navn,
          industry: industryLabel,
          language: "nb",
        },
      });
      if (descRes?.suggestion) {
        setBusinessDescription(String(descRes.suggestion).slice(0, 500));
      }
    } catch { /* ignore — description is optional */ }

    setTimeout(() => setStep("contact"), 800);
  };

  const mapEmployees = (n?: number): string => {
    if (n === undefined) return "";
    if (n <= 10) return "1-10";
    if (n <= 50) return "11-50";
    if (n <= 200) return "51-200";
    if (n <= 500) return "201-500";
    return "500+";
  };

  // Save customer + assessment + Trust Profile
  const handleSave = async () => {
    if (!selectedCompany) {
      toast.error("Mangler virksomhetsdata — gå tilbake og velg eller fyll inn virksomheten");
      return;
    }
    setSaving(true);
    try {
      // Lara beregner regelverksforslag i bakgrunnen — partneren bekrefter dem
      // senere under «Veiledning fra Mynder».
      const employeeCount = manual.employees
        ? Number(manual.employees.split("-")[0].replace("+", ""))
        : null;
      const recommendations = recommendFrameworks({
        countryCode: form.country_code,
        industryCode: selectedCompany?.naeringskode1?.kode ?? null,
        industryLabel:
          selectedCompany?.naeringskode1?.beskrivelse ?? manual.industry ?? null,
        employees: employeeCount,
        businessDescription: businessDescription,
      });
      // 1. Create customer
      const { data: customer, error } = await supabase.from("msp_customers").insert({
        msp_user_id: user?.id ?? DEMO_MSP_USER_ID,
        customer_name: selectedCompany.navn,
        org_number: selectedCompany.organisasjonsnummer,
        industry: selectedCompany.naeringskode1?.beskrivelse || null,
        employees: mapEmployees(selectedCompany.antallAnsatte) || null,
        business_description: businessDescription || null,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_company_role: form.contact_company_role || null,
        account_manager: form.account_manager || null,
        url: form.has_website ? form.url.trim() || null : null,
        country_code: form.country_code || "NO",
        compliance_score: 0,
        initial_assessment_score: 0,
        status: "active",
        active_frameworks: activeFrameworks,
        recommended_frameworks: recommendations as any,
        confirmed_frameworks: [] as any,
        subscription_plan: form.subscription_plan,
        onboarding_completed: true,
      } as any).select().single();

      if (error) throw error;

      const customerId = (customer as any).id;

      // 3. Create Trust Profile (asset with asset_type: 'self')
      await supabase.from("assets").insert({
        name: selectedCompany.navn,
        asset_type: "self",
        org_number: selectedCompany.organisasjonsnummer,
        description: `Trust Profile for ${selectedCompany.navn}`,
        compliance_score: 0,
        lifecycle_status: "active",
        metadata: {
          created_by_msp: true,
          msp_customer_id: customerId,
          assessment_score: 0,
          active_frameworks: activeFrameworks,
          industry: selectedCompany.naeringskode1?.beskrivelse || null,
          privacy_policy_url: form.privacy_policy_url.trim() || null,
        },
      } as any);

      // 4. Auto-assign license
      if (licenseInfo?.firstAvailableId) {
        await supabase
          .from("msp_licenses" as any)
          .update({ assigned_customer_id: customerId, status: "assigned" } as any)
          .eq("id", licenseInfo.firstAvailableId);
      }

      setStep("success");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke legge til kunde");
    } finally {
      setSaving(false);
    }
  };

  // ---- Bulk import helpers ----
  const parseBulk = useCallback(async (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    // Detect header
    const first = lines[0].toLowerCase();
    const hasHeader = /org\s*nr|organisasjon|navn|name|epost|email/.test(first);
    const dataLines = hasHeader ? lines.slice(1) : lines;
    // Detect separator
    const sep = lines[0].includes(";") ? ";" : ",";

    // Get existing org numbers to flag duplicates
    const { data: existing } = await supabase
      .from("msp_customers")
      .select("org_number")
      .eq("msp_user_id", user!.id);
    const existingOrgs = new Set((existing || []).map((c: any) => String(c.org_number)));

    const seenInBatch = new Set<string>();
    const rows: BulkRow[] = dataLines.map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      const [orgRaw, nameRaw, person, email] = cols;
      const org = (orgRaw || "").replace(/\s/g, "");
      const name = nameRaw || "";
      let status: BulkRow["status"] = "ok";
      let reason: string | undefined;
      if (!/^\d{9}$/.test(org)) {
        status = "invalid";
        reason = "Ugyldig org.nr (må være 9 siffer)";
      } else if (!name) {
        status = "invalid";
        reason = "Mangler navn";
      } else if (existingOrgs.has(org) || seenInBatch.has(org)) {
        status = "duplicate";
        reason = "Allerede registrert";
      }
      seenInBatch.add(org);
      return { org_number: org, customer_name: name, contact_person: person, contact_email: email, status, reason };
    });
    return rows;
  }, [user?.id]);

  const handleBulkFile = async (file: File) => {
    const text = await file.text();
    setBulkText(text);
    const rows = await parseBulk(text);
    setBulkRows(rows);
  };

  const handleBulkParse = async () => {
    const rows = await parseBulk(bulkText);
    setBulkRows(rows);
    if (rows.length === 0) toast.error("Fant ingen rader å importere");
  };

  const handleBulkSave = async () => {
    if (!user?.id) return;
    const valid = bulkRows.filter((r) => r.status === "ok");
    if (valid.length === 0) {
      toast.error("Ingen gyldige rader å importere");
      return;
    }
    setSaving(true);
    try {
      const customerRows = valid.map((r) => ({
        msp_user_id: user.id,
        customer_name: r.customer_name,
        org_number: r.org_number,
        contact_person: r.contact_person || null,
        contact_email: r.contact_email || null,
        compliance_score: 0,
        status: "active",
        active_frameworks: [] as string[],
        subscription_plan: "Gratis",
        onboarding_completed: false,
      }));
      const { data: inserted, error } = await supabase
        .from("msp_customers")
        .insert(customerRows as any)
        .select("id, customer_name, org_number");
      if (error) throw error;

      // Create matching self-asset for each
      if (inserted && inserted.length > 0) {
        const assets = inserted.map((c: any) => ({
          name: c.customer_name,
          asset_type: "self",
          org_number: c.org_number,
          description: `Trust Profile for ${c.customer_name}`,
          compliance_score: 0,
          lifecycle_status: "active",
          metadata: { created_by_msp: true, msp_customer_id: c.id, bulk_import: true },
        }));
        await supabase.from("assets").insert(assets as any);
      }

      setBulkSavedCount(inserted?.length || 0);
      setStep("bulk-success");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error("Kunne ikke importere kunder: " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ---- Acronis multi-import ----
  const handleAcronisImport = async () => {
    if (acronisSelected.size === 0) return;
    setAcronisImporting(true);
    setAcronisProgressStep(0);
    setStep("acronis-processing");
    const stepDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const tenants = ACRONIS_DEMO_TENANTS.filter((t) => acronisSelected.has(t.tenant_id));

    try {
      await stepDelay(900); setAcronisProgressStep(1);
      await stepDelay(900); setAcronisProgressStep(2);
      await stepDelay(900); setAcronisProgressStep(3);

      let insertedCount = tenants.length;

      if (user?.id) {
        try {
          const { data: existing } = await supabase
            .from("msp_customers")
            .select("org_number")
            .eq("msp_user_id", user.id);
          const existingOrgs = new Set((existing || []).map((c: any) => String(c.org_number)));
          const newTenants = tenants.filter((t) => !existingOrgs.has(t.org_number));

          if (newTenants.length > 0) {
            const customerRows = newTenants.map((t) => ({
              msp_user_id: user.id,
              customer_name: t.name,
              org_number: t.org_number,
              industry: t.industry,
              employees: mapEmployees(t.employees) || null,
              country_code: "NO",
              compliance_score: 0,
              status: "active",
              active_frameworks: [] as string[],
              subscription_plan: "Gratis",
              onboarding_completed: false,
              has_acronis_integration: true,
              acronis_device_count: t.devices,
            }));

            const { data: inserted, error } = await supabase
              .from("msp_customers")
              .insert(customerRows as any)
              .select("id, customer_name, org_number");

            if (!error && inserted && inserted.length > 0) {
              insertedCount = inserted.length;
              const assets = inserted.map((c: any, i: number) => ({
                name: c.customer_name,
                asset_type: "self",
                org_number: c.org_number,
                description: `Trust Profile for ${c.customer_name}`,
                compliance_score: 0,
                lifecycle_status: "active",
                metadata: {
                  created_by_msp: true,
                  msp_customer_id: c.id,
                  source: "acronis",
                  acronis_tenant_id: newTenants[i].tenant_id,
                  acronis_devices: newTenants[i].devices,
                  industry: newTenants[i].industry,
                },
              }));
              await supabase.from("assets").insert(assets as any);
            } else if (error) {
              console.warn("Acronis import DB error (continuing demo flow):", error);
            }
          }
        } catch (dbErr) {
          console.warn("Acronis import DB exception (continuing demo flow):", dbErr);
        }
      }

      setAcronisImportedCount(insertedCount);
      setBulkSavedCount(insertedCount);
      setAcronisProgressStep(4);
      await stepDelay(700);
      setStep("bulk-success");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error("Noe gikk galt: " + (err?.message || ""));
      setStep("acronis");
    } finally {
      setAcronisImporting(false);
    }
  };



  const currentStepIndex = STEP_LABELS.indexOf(
    step === "results" || step === "verifying" || step === "manual" ? "search" : step === "success" ? "confirm" : step
  );



  const stepIndicator = (
    <div className="flex items-center gap-2 mb-4">
      {STEP_LABELS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            currentStepIndex >= i ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );


  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Step: Method selection */}
        {step === "method" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Legg til kunde</DialogTitle>
              <DialogDescription className="text-sm">Hvordan vil du legge til en ny kunde?</DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-3">
              <button
                onClick={() => setStep("country")}
                className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Legg til enkelt kunde</p>
                  <p className="text-sm text-muted-foreground">Søk i Brønnøysundregistrene og registrer</p>
                </div>
              </button>
              <button
                onClick={() => setStep("bulk")}
                className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Importer fra CSV</p>
                  <p className="text-sm text-muted-foreground">Last opp fil eller lim inn flere kunder samtidig</p>
                </div>
              </button>
              <button
                onClick={() => setStep("acronis")}
                className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Hent fra Acronis</p>
                  <p className="text-sm text-muted-foreground">Importer en kunde-tenant fra Acronis-integrasjonen</p>
                </div>
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">Integrasjon</Badge>
              </button>
            </div>
          </>
        )}

        {/* Step: Acronis tenant picker (multi-select, direct import) */}
        {step === "acronis" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Hent kunder fra Acronis
              </DialogTitle>
              <DialogDescription className="text-sm">
                Velg én eller flere tenants. Kunder opprettes med data fra Acronis – kontaktperson og kartlegging kan legges til etterpå.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-xs text-success mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acronis-integrasjon koblet til
              </div>
              <button
                type="button"
                onClick={() => {
                  if (acronisSelected.size === ACRONIS_DEMO_TENANTS.length) {
                    setAcronisSelected(new Set());
                  } else {
                    setAcronisSelected(new Set(ACRONIS_DEMO_TENANTS.map((t) => t.tenant_id)));
                  }
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {acronisSelected.size === ACRONIS_DEMO_TENANTS.length ? "Fjern alle" : "Velg alle"}
              </button>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {ACRONIS_DEMO_TENANTS.map((t) => {
                const checked = acronisSelected.has(t.tenant_id);
                return (
                  <button
                    key={t.tenant_id}
                    type="button"
                    onClick={() => {
                      setAcronisSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(t.tenant_id)) next.delete(t.tenant_id);
                        else next.add(t.tenant_id);
                        return next;
                      });
                    }}
                    className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      checked ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-1 ${
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    }`}>
                      {checked && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span>Tenant: {t.tenant_id}</span>
                        <span>Org.nr: {t.org_number}</span>
                        <span>{t.devices} enheter</span>
                        <span>{t.employees} ansatte</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.industry}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep("method")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
              <Button
                size="sm"
                disabled={acronisSelected.size === 0 || acronisImporting}
                onClick={handleAcronisImport}
              >
                {acronisImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importerer...</>
                ) : (
                  <>Importer {acronisSelected.size > 0 ? `${acronisSelected.size} ` : ""}kunde{acronisSelected.size === 1 ? "" : "r"}</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Du kan legge til kontaktperson og fullføre kartlegging fra hver kundeprofil senere.
            </p>
          </>
        )}

        {/* Step: Acronis processing */}
        {step === "acronis-processing" && (() => {
          const count = acronisSelected.size;
          const progressPercent = Math.min((acronisProgressStep / 4) * 100, 100);
          return (
            <div className="py-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src={laraButterfly} alt="Lara" className="h-10 w-10 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-2 max-w-xs">
                  <p className="font-medium text-foreground text-sm tracking-tight leading-relaxed">
                    Lara kobler seg til Acronis for å hente de {count} utvalgte kundene
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-normal">
                    Oppretter koblinger og klargjør kundens profiler…
                  </p>
                </div>

                <div className="w-full max-w-xs mt-2">
                  <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full relative">
                    <div 
                      className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground/50 tracking-wider font-mono">
                    <span>ACRONIS TIMEOUT</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}


        {/* Step: Country selection */}
        {step === "country" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Velg land</DialogTitle>
              <DialogDescription className="text-sm">
                Lara søker i det offentlige virksomhetsregisteret i landet du velger
              </DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setForm({ ...form, country_code: c.code });
                    if (c.supported) {
                      setStep("search");
                    } else {
                      setStep("manual");
                    }
                  }}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors border-border hover:border-primary hover:bg-primary/5 ${
                    form.country_code === c.code ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.supported ? c.registry : `Registersøk kommer – registrer manuelt`}
                    </p>
                  </div>
                  {!c.supported && <Badge variant="outline" className="text-xs">Manuell</Badge>}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("method")} className="gap-1 mt-2">
              <ArrowLeft className="h-4 w-4" /> Tilbake
            </Button>
          </>
        )}

        {/* Step: Bulk import */}
        {step === "bulk" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Importer flere kunder</DialogTitle>
              <DialogDescription className="text-sm">
                Last opp en CSV-fil eller lim inn rader. Format: <code className="text-xs">org.nr;navn;kontaktperson;e-post</code>
              </DialogDescription>
            </DialogHeader>

            {bulkRows.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <Label htmlFor="bulk-file" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                    Velg CSV-fil
                  </Label>
                  <input
                    id="bulk-file"
                    type="file"
                    accept=".csv,.txt,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBulkFile(f);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">eller dra og slipp her</p>
                </div>

                <div className="text-center text-xs text-muted-foreground">— eller lim inn —</div>

                <Textarea
                  placeholder={`936431127;DIPS Arena AS;Kari Lien;kari.lien@dipsarena.no\n998877665;Eksempel AS;Ola Nordmann;ola@eksempel.no`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep("method")} className="gap-1">
                    <ArrowLeft className="h-4 w-4" /> Tilbake
                  </Button>
                  <Button size="sm" onClick={handleBulkParse} disabled={!bulkText.trim()}>
                    Forhåndsvis
                  </Button>
                </div>
              </div>
            )}

            {bulkRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="action" className="text-xs">{bulkRows.filter(r => r.status === "ok").length} klar</Badge>
                  {bulkRows.some(r => r.status === "duplicate") && (
                    <Badge variant="warning" className="text-xs">{bulkRows.filter(r => r.status === "duplicate").length} duplikat</Badge>
                  )}
                  {bulkRows.some(r => r.status === "invalid") && (
                    <Badge variant="destructive" className="text-xs">{bulkRows.filter(r => r.status === "invalid").length} feil</Badge>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {bulkRows.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                      <div className="mt-0.5">
                        {r.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                        {r.status === "duplicate" && <AlertCircle className="h-3.5 w-3.5 text-warning" />}
                        {r.status === "invalid" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{r.customer_name || "(uten navn)"}</p>
                        <p className="text-muted-foreground tabular-nums">
                          {r.org_number || "—"} {r.contact_email && `· ${r.contact_email}`}
                        </p>
                        {r.reason && <p className="text-xs text-muted-foreground italic">{r.reason}</p>}
                      </div>
                      <button
                        onClick={() => setBulkRows(bulkRows.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        aria-label="Fjern"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setBulkRows([]); setBulkText(""); }}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Start på nytt
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkSave}
                    disabled={saving || bulkRows.filter(r => r.status === "ok").length === 0}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Importer {bulkRows.filter(r => r.status === "ok").length} kunder
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step: Bulk success */}
        {step === "bulk-success" && (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <p className="text-base font-medium text-foreground">{bulkSavedCount} kunder importert</p>
            <p className="text-sm text-muted-foreground">Kundens profil opprettet for hver kunde.</p>
          </div>
        )}

        {/* Step: Search */}
        {step === "search" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Søk etter virksomhet</DialogTitle>
              <DialogDescription className="text-sm">Skriv inn firmanavn for å søke i Brønnøysundregistrene</DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Firmanavn AS"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoFocus
                />
                <Button onClick={handleSearch} disabled={searchLoading || searchQuery.trim().length < 2}>
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep("country")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Tilbake
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("manual")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Finner du ikke virksomheten? Registrer manuelt
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: Results */}
        {step === "results" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Velg virksomhet</DialogTitle>
              <DialogDescription className="text-sm">{searchResults.length} treff for «{searchQuery}»</DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.organisasjonsnummer}
                  onClick={() => handleSelectCompany(r)}
                  className="w-full flex items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{r.navn}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                      <span>Org.nr: {r.organisasjonsnummer}</span>
                      {r.forretningsadresse?.kommune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.forretningsadresse.kommune}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("search")} className="gap-1 mt-2">
              <ArrowLeft className="h-4 w-4" /> Nytt søk
            </Button>
          </>
        )}

        {/* Step: Verifying — Lara baseline analysis */}
        {step === "verifying" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <img src={laraButterfly} alt="Lara" className="h-16 w-16 animate-pulse" />
            {duplicateFound ? (
              <div className="text-center space-y-1">
                <p className="font-medium text-destructive">Kunden finnes allerede</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCompany?.navn} er allerede registrert i din portefølje.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3 w-full max-w-sm">
                <div>
                  <p className="font-medium text-foreground">Lara analyserer {selectedCompany?.navn}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Henter offentlig informasjon og klargjør kundens profil
                  </p>
                </div>
                <div className="space-y-1.5 text-left text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    <span>Verifisert i {COUNTRIES.find(c => c.code === form.country_code)?.registry || "registeret"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {enrichStep === "main" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    )}
                    <span>Henter bransje, ansatte og adresse fra hovedenhet</span>
                  </div>
                  {(enrichStep === "subunit" || industrySource === "brreg_subunit" ||
                    (enrichStep === "done" && industrySource === "ai_suggested") ||
                    enrichStep === "ai") && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {enrichStep === "subunit" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      )}
                      <span>Sjekker underenheter for bransjekode</span>
                    </div>
                  )}
                  {(enrichStep === "ai" || industrySource === "ai_suggested") && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {enrichStep === "ai" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <span>Lara foreslår bransje ut fra virksomhetsnavn</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    <span>Klargjør kundens profil</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Manual entry (fallback when no register hit / unsupported country) */}
        {step === "manual" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Registrer virksomhet manuelt</DialogTitle>
              <DialogDescription className="text-sm">
                Fyll inn grunnleggende informasjon. Du kan berike kundens profil senere.
              </DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <Building2 className="h-3.5 w-3.5" /> Virksomhetsnavn <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={manual.customer_name}
                  onChange={(e) => setManual({ ...manual, customer_name: e.target.value })}
                  placeholder="Firmanavn AS"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Org.nr / registreringsnr</Label>
                  <Input
                    value={manual.org_number}
                    onChange={(e) => setManual({ ...manual, org_number: e.target.value })}
                    placeholder="Valgfritt"
                  />
                </div>
                <div>
                  <Label className="text-sm">Antall ansatte</Label>
                  <Select
                    value={manual.employees}
                    onValueChange={(v) => setManual({ ...manual, employees: v as any })}
                  >
                    <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                    <SelectContent>
                      {["1-10", "11-50", "51-200", "201-500", "500+"].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm">Bransje</Label>
                <Input
                  value={manual.industry}
                  onChange={(e) => setManual({ ...manual, industry: e.target.value })}
                  placeholder="F.eks. Regnskap, Teknologi, Helse"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(form.country_code === "NO" ? "search" : "country")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Tilbake
                </Button>
                <Button
                  disabled={!manual.customer_name.trim()}
                  onClick={() => {
                    // Synthesize a BrregResult-like object so downstream steps work unchanged
                    const emp = manual.employees === "1-10" ? 5
                      : manual.employees === "11-50" ? 30
                      : manual.employees === "51-200" ? 100
                      : manual.employees === "201-500" ? 300
                      : manual.employees === "500+" ? 600
                      : undefined;
                    setSelectedCompany({
                      organisasjonsnummer: manual.org_number.trim() || `MANUAL-${Date.now()}`,
                      navn: manual.customer_name.trim(),
                      naeringskode1: manual.industry.trim()
                        ? { kode: "", beskrivelse: manual.industry.trim() }
                        : undefined,
                      antallAnsatte: emp,
                    });
                    setStep("contact");
                  }}
                >
                  Neste: Kontakt
                </Button>
              </div>
            </div>
          </>
        )}


        {step === "contact" && selectedCompany && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Kontaktinformasjon</DialogTitle>
              <DialogDescription className="text-sm">Legg til kontaktperson for {selectedCompany.navn}</DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedCompany.navn}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pl-6">
                  <span>Org.nr: {selectedCompany.organisasjonsnummer}</span>
                  {selectedCompany.naeringskode1?.beskrivelse && (
                    <span className="inline-flex items-center gap-1">
                      {selectedCompany.naeringskode1.beskrivelse}
                      {industrySource === "ai_suggested" && (
                        <Sparkles
                          className="h-3 w-3 text-primary"
                          aria-label="Foreslått av Lara – kan endres"
                        />
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Globe className="h-3.5 w-3.5" /> Nettside
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, has_website: true })}
                    className={cn(
                      "flex items-center gap-1.5 text-sm transition-colors",
                      form.has_website
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-4 w-4 rounded-full border transition-colors",
                      form.has_website
                        ? "border-primary bg-primary"
                        : "border-border bg-background"
                    )} />
                    Ja, har nettside
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForm({ ...form, has_website: false, url: "" }); setWebsiteSource("none"); }}
                    className={cn(
                      "flex items-center gap-1.5 text-sm transition-colors",
                      !form.has_website
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-4 w-4 rounded-full border transition-colors",
                      !form.has_website
                        ? "border-primary bg-primary"
                        : "border-border bg-background"
                    )} />
                    Har ikke nettside
                  </button>
                </div>
                {form.has_website && (
                  <>
                    <Input
                      value={form.url}
                      onChange={(e) => { setForm({ ...form, url: e.target.value }); if (websiteSource !== "manual") setWebsiteSource("manual"); }}
                      placeholder="https://example.no"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {websiteSource === "brreg" && form.url ? (
                        <span>Hentet fra virksomhetsregisteret – bekreft eller endre</span>
                      ) : websiteSource === "ai_suggested" && form.url ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Sparkles className="h-3 w-3" />
                          Foreslått av Lara – bekreft eller endre
                        </span>
                      ) : websiteSource === "manual" && form.url ? (
                        <span>Lagt inn manuelt.</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Vi fant ingen nettside for virksomheten – du kan legge den inn nå eller senere.
                        </span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex text-muted-foreground hover:text-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            Vi slår først opp navn og org.nr i landets offisielle virksomhetsregister for å hente bransje, ansatte og nettside. Deretter kartlegger Lara nettsiden og personvernerklæringen. Finner vi ingenting, kan du legge det inn manuelt nå eller senere på kundekortet.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Globe className="h-3.5 w-3.5" /> Personvernerklæring
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex text-muted-foreground hover:text-foreground">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Lara forsøker å finne personvernerklæringen på kundens nettside. URL-en brukes til å vurdere GDPR-status og databehandling. Du kan lime inn lenken selv om Lara ikke finner den.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  value={form.privacy_policy_url}
                  onChange={(e) => { setForm({ ...form, privacy_policy_url: e.target.value }); if (privacyPolicySource !== "manual") setPrivacyPolicySource("manual"); }}
                  placeholder="https://example.no/personvern"
                />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {privacyPolicySource === "ai_detected" && form.privacy_policy_url ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Sparkles className="h-3 w-3" />
                      Funnet av Lara – bekreft eller endre
                    </span>
                  ) : privacyPolicySource === "manual" && form.privacy_policy_url ? (
                    <span>Lagt inn manuelt.</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Lara fant ikke personvernerklæringen – du kan legge den inn manuelt.
                    </span>
                  )}
                </div>
              </div>

                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <UserPlus className="h-3.5 w-3.5" /> Kundekontakt
                </Label>
                <Select
                  value={form.account_manager}
                  onValueChange={(v) => setForm({ ...form, account_manager: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Velg partner-medlem" /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_TEAM.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hvem hos dere har ansvaret for denne kunden? De får varsler om kunden.
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5" /> Kontaktperson
                </Label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="Navn Navnesen"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <Mail className="h-3.5 w-3.5" /> E-post
                </Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="kontakt@firma.no"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="h-3.5 w-3.5" /> Rolle i selskapet
                </Label>
                <Select value={form.contact_company_role} onValueChange={(v) => setForm({ ...form, contact_company_role: v })}>
                  <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("results")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Tilbake
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Oppretter...</>
                  ) : (
                    "Opprett kundeprofil"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in">
            <img src={laraButterfly} alt="Mynder" className="h-20 w-20 animate-scale-in" />
            <CheckCircle2 className="h-10 w-10 text-primary animate-scale-in" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">Kunden er lagt til!</p>
              <p className="text-sm text-muted-foreground">
                {selectedCompany?.navn} har fått en kundeprofil og er klar i porteføljen din
              </p>
              <p className="text-xs text-muted-foreground">
                Lara har foreslått relevante regelverk — du finner dem under «Veiledning fra Mynder».
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
