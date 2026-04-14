import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  UserPlus, FileSpreadsheet, Server, ArrowLeft, Search, Building2,
  MapPin, Loader2, CheckCircle2, User, Mail, Briefcase,
} from "lucide-react";
import { COMPANY_ROLES, SUBSCRIPTION_PLANS } from "@/lib/mspCustomerConstants";
import {
  MSP_ASSESSMENT_QUESTIONS,
  type AssessmentResponse,
  calculateAssessmentScore,
  getRecommendedFrameworks,
} from "@/lib/mspAssessmentQuestions";
import { MSPAssessmentStep } from "./MSPAssessmentStep";
import { MSPGapAnalysisStep } from "./MSPGapAnalysisStep";
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
}

type Step = "method" | "search" | "results" | "verifying" | "contact" | "assessment" | "gap" | "confirm" | "success";

const STEP_LABELS = ["method", "search", "contact", "assessment", "gap", "confirm"];

export function AddMSPCustomerDialog({ open, onOpenChange, onSuccess }: AddMSPCustomerDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("method");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BrregResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<BrregResult | null>(null);
  const [duplicateFound, setDuplicateFound] = useState(false);
  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);

  const [form, setForm] = useState({
    contact_person: "",
    contact_email: "",
    contact_company_role: "",
    subscription_plan: "Basis",
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

  const complianceScore = useMemo(
    () => calculateAssessmentScore(assessmentResponses),
    [assessmentResponses]
  );

  const reset = useCallback(() => {
    setStep("method");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCompany(null);
    setDuplicateFound(false);
    setAssessmentResponses([]);
    setSelectedFrameworks([]);
    setForm({ contact_person: "", contact_email: "", contact_company_role: "", subscription_plan: "Basis" });
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Initialize recommended frameworks when entering gap step
  useEffect(() => {
    if (step === "gap" && selectedFrameworks.length === 0) {
      const rec = getRecommendedFrameworks(
        assessmentResponses,
        selectedCompany?.naeringskode1?.beskrivelse
      );
      setSelectedFrameworks(rec);
    }
  }, [step]);

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

  // Select company → verify
  const handleSelectCompany = async (company: BrregResult) => {
    setSelectedCompany(company);
    setStep("verifying");
    setDuplicateFound(false);
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
    setTimeout(() => setStep("contact"), 2000);
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
    if (!user?.id || !selectedCompany) return;
    setSaving(true);
    try {
      // 1. Create customer
      const { data: customer, error } = await supabase.from("msp_customers").insert({
        msp_user_id: user.id,
        customer_name: selectedCompany.navn,
        org_number: selectedCompany.organisasjonsnummer,
        industry: selectedCompany.naeringskode1?.beskrivelse || null,
        employees: mapEmployees(selectedCompany.antallAnsatte) || null,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_company_role: form.contact_company_role || null,
        compliance_score: complianceScore,
        initial_assessment_score: complianceScore,
        status: "active",
        active_frameworks: selectedFrameworks,
        subscription_plan: form.subscription_plan,
        onboarding_completed: true,
      } as any).select().single();

      if (error) throw error;

      const customerId = (customer as any).id;

      // 2. Save assessment responses
      if (assessmentResponses.length > 0) {
        const assessmentRows = assessmentResponses.map((r) => ({
          msp_customer_id: customerId,
          question_key: r.question_key,
          answer: r.answer,
          notes: r.notes || null,
          assessed_by: user.id,
        }));
        await supabase.from("msp_customer_assessments").insert(assessmentRows as any);
      }

      // 3. Create Trust Profile (asset with asset_type: 'self')
      await supabase.from("assets").insert({
        name: selectedCompany.navn,
        asset_type: "self",
        org_number: selectedCompany.organisasjonsnummer,
        description: `Trust Profile for ${selectedCompany.navn}`,
        compliance_score: complianceScore,
        lifecycle_status: "active",
        metadata: {
          created_by_msp: true,
          msp_customer_id: customerId,
          assessment_score: complianceScore,
          active_frameworks: selectedFrameworks,
          industry: selectedCompany.naeringskode1?.beskrivelse || null,
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

  const currentStepIndex = STEP_LABELS.indexOf(
    step === "results" || step === "verifying" ? "search" : step === "success" ? "confirm" : step
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

  const allAnswered = assessmentResponses.length === MSP_ASSESSMENT_QUESTIONS.length;

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
                onClick={() => setStep("search")}
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
              <button disabled className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left opacity-50 cursor-not-allowed">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Importer fra CSV</p>
                  <p className="text-sm text-muted-foreground">Last opp en fil med flere kunder</p>
                </div>
                <Badge variant="outline" className="text-xs">Kommer snart</Badge>
              </button>
              <button disabled className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left opacity-50 cursor-not-allowed">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Server className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Importer fra tilkoblede systemer</p>
                  <p className="text-sm text-muted-foreground">Acronis, ConnectWise m.fl.</p>
                </div>
                <Badge variant="outline" className="text-xs">Kommer snart</Badge>
              </button>
            </div>
          </>
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
              <Button variant="ghost" size="sm" onClick={() => setStep("method")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
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

        {/* Step: Verifying */}
        {step === "verifying" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <img src={laraButterfly} alt="Lara Soft" className="h-16 w-16 animate-pulse" />
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {duplicateFound ? (
              <div className="text-center space-y-1">
                <p className="font-medium text-destructive">Kunden finnes allerede</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCompany?.navn} er allerede registrert i din portefølje.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">Lara Soft sjekker...</p>
                <p className="text-sm text-muted-foreground">Verifiserer {selectedCompany?.navn}</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Contact info */}
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
                    <span>{selectedCompany.naeringskode1.beskrivelse}</span>
                  )}
                </div>
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
              <div>
                <Label className="text-sm">Abonnement</Label>
                <Select value={form.subscription_plan} onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_PLANS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("results")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Tilbake
                </Button>
                <Button onClick={() => setStep("assessment")}>
                  Neste: Kartlegging
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Assessment */}
        {step === "assessment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Compliance-kartlegging</DialogTitle>
              <DialogDescription className="text-sm">
                Kartlegg kundens status innen sikkerhet, personvern og styring
              </DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <MSPAssessmentStep
              responses={assessmentResponses}
              onChange={setAssessmentResponses}
            />
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("contact")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
              <Button onClick={() => setStep("gap")} disabled={!allAnswered}>
                {allAnswered ? "Se gap-analyse" : `Besvar alle (${assessmentResponses.length}/${MSP_ASSESSMENT_QUESTIONS.length})`}
              </Button>
            </div>
          </>
        )}

        {/* Step: Gap analysis */}
        {step === "gap" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Gap-analyse</DialogTitle>
              <DialogDescription className="text-sm">
                Resultater og anbefalte regelverk for {selectedCompany?.navn}
              </DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <MSPGapAnalysisStep
              responses={assessmentResponses}
              industry={selectedCompany?.naeringskode1?.beskrivelse}
              selectedFrameworks={selectedFrameworks}
              onFrameworksChange={setSelectedFrameworks}
            />
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("assessment")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
              <Button onClick={() => setStep("confirm")}>
                Se oppsummering
              </Button>
            </div>
          </>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedCompany && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Bekreft og legg til</DialogTitle>
              <DialogDescription className="text-sm">
                Kontroller informasjonen før kunden opprettes
              </DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-4">
              {/* Company */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedCompany.navn}</span>
                </div>
                <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
                  <p>Org.nr: {selectedCompany.organisasjonsnummer}</p>
                  {selectedCompany.naeringskode1?.beskrivelse && (
                    <p>Bransje: {selectedCompany.naeringskode1.beskrivelse}</p>
                  )}
                  {form.contact_person && <p>Kontakt: {form.contact_person}</p>}
                  {form.contact_email && <p>E-post: {form.contact_email}</p>}
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">Compliance-score</span>
                <Badge
                  variant="outline"
                  className={
                    complianceScore >= 70
                      ? "border-green-500/40 text-green-700 dark:text-green-400"
                      : complianceScore >= 40
                        ? "border-yellow-500/40 text-yellow-700 dark:text-yellow-400"
                        : "border-red-500/40 text-red-700 dark:text-red-400"
                  }
                >
                  {complianceScore}%
                </Badge>
              </div>

              {/* Frameworks */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Aktive regelverk</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFrameworks.map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {f.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Plan */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Abonnement</span>
                <span className="font-medium text-foreground">{form.subscription_plan}</span>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("gap")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Tilbake
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Oppretter...</>
                  ) : (
                    "Legg til kunde"
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
                {selectedCompany?.navn} har fått en Trust Profile og er klar i porteføljen din
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
