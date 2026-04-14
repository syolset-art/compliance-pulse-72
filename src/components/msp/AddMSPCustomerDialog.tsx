import { useState, useEffect, useCallback } from "react";
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

type Step = "method" | "search" | "results" | "verifying" | "contact" | "success";

export function AddMSPCustomerDialog({ open, onOpenChange, onSuccess }: AddMSPCustomerDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("method");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BrregResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<BrregResult | null>(null);
  const [duplicateFound, setDuplicateFound] = useState(false);

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

  const reset = useCallback(() => {
    setStep("method");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCompany(null);
    setDuplicateFound(false);
    setForm({ contact_person: "", contact_email: "", contact_company_role: "", subscription_plan: "Basis" });
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

  // Select company → verify
  const handleSelectCompany = async (company: BrregResult) => {
    setSelectedCompany(company);
    setStep("verifying");
    setDuplicateFound(false);

    // Check for duplicates
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

    // Simulate Lara checking
    setTimeout(() => setStep("contact"), 2000);
  };

  // Map employees
  const mapEmployees = (n?: number): string => {
    if (n === undefined) return "";
    if (n <= 10) return "1-10";
    if (n <= 50) return "11-50";
    if (n <= 200) return "51-200";
    if (n <= 500) return "201-500";
    return "500+";
  };

  // Save customer
  const handleSave = async () => {
    if (!user?.id || !selectedCompany) return;
    setSaving(true);
    try {
      const { data: customer, error } = await supabase.from("msp_customers").insert({
        msp_user_id: user.id,
        customer_name: selectedCompany.navn,
        org_number: selectedCompany.organisasjonsnummer,
        industry: selectedCompany.naeringskode1?.beskrivelse || null,
        employees: mapEmployees(selectedCompany.antallAnsatte) || null,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_company_role: form.contact_company_role || null,
        compliance_score: 0,
        status: "onboarding",
        active_frameworks: [],
        subscription_plan: form.subscription_plan,
        initial_assessment_score: 0,
      } as any).select().single();

      if (error) throw error;

      // Auto-assign license
      if (licenseInfo?.firstAvailableId && customer) {
        await supabase
          .from("msp_licenses" as any)
          .update({ assigned_customer_id: (customer as any).id, status: "assigned" } as any)
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

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-4">
      {["method", "search", "results", "contact"].map((s, i) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            ["method", "search", "results", "verifying", "contact", "success"].indexOf(step) >= i
              ? "bg-primary"
              : "bg-muted"
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
              <DialogTitle>Legg til kunde</DialogTitle>
              <DialogDescription>Hvordan vil du legge til en ny kunde?</DialogDescription>
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

              <button
                disabled
                className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left opacity-50 cursor-not-allowed"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Importer fra CSV</p>
                  <p className="text-sm text-muted-foreground">Last opp en fil med flere kunder</p>
                </div>
                <Badge variant="outline" className="text-xs">Kommer snart</Badge>
              </button>

              <button
                disabled
                className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left opacity-50 cursor-not-allowed"
              >
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
              <DialogTitle>Søk etter virksomhet</DialogTitle>
              <DialogDescription>Skriv inn firmanavn for å søke i Brønnøysundregistrene</DialogDescription>
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
              <DialogTitle>Velg virksomhet</DialogTitle>
              <DialogDescription>{searchResults.length} treff for «{searchQuery}»</DialogDescription>
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
                      {r.organisasjonsform?.beskrivelse && (
                        <span>{r.organisasjonsform.beskrivelse}</span>
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
            <img
              src={laraButterfly}
              alt="Lara Soft"
              className="h-16 w-16 animate-pulse"
            />
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
                <p className="text-sm text-muted-foreground">
                  Verifiserer {selectedCompany?.navn}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Contact info */}
        {step === "contact" && selectedCompany && (
          <>
            <DialogHeader>
              <DialogTitle>Kontaktinformasjon</DialogTitle>
              <DialogDescription>Legg til kontaktperson for {selectedCompany.navn}</DialogDescription>
            </DialogHeader>
            {stepIndicator}
            <div className="space-y-4">
              {/* Company summary */}
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
                  {selectedCompany.antallAnsatte !== undefined && (
                    <span>{selectedCompany.antallAnsatte} ansatte</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Kontaktperson
                </Label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="Navn Navnesen"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
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
                <Label className="flex items-center gap-1.5">
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
                <Label>Abonnement</Label>
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
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Lagrer...</>
                  ) : (
                    "Fullfør"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Success animation */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in">
            <img
              src={laraButterfly}
              alt="Mynder"
              className="h-20 w-20 animate-scale-in"
            />
            <CheckCircle2 className="h-10 w-10 text-primary animate-scale-in" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">Kunden er lagt til!</p>
              <p className="text-sm text-muted-foreground">{selectedCompany?.navn} er nå i din portefølje</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
