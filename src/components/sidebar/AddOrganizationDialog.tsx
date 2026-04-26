import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  Users,
  Briefcase,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "search" | "relationship" | "confirm" | "done";

interface OrgData {
  name: string;
  orgNumber: string;
  industry?: string;
  employees?: string;
  location?: string;
}

export function AddOrganizationDialog({ open, onOpenChange }: AddOrganizationDialogProps) {
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgData | null>(null);
  const [isPartner, setIsPartner] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const {
    searchByName,
    lookupByOrgNumber,
    searchResults,
    isLoading,
    rawData,
    suggestion,
  } = useBrregLookup();

  const resetState = () => {
    setStep("search");
    setSearchQuery("");
    setSelectedOrg(null);
    setIsPartner(null);
    setSaving(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleSearch = async () => {
    const clean = searchQuery.trim();
    if (!clean) return;

    if (/^\d{9}$/.test(clean.replace(/[\s-]/g, ""))) {
      const result = await lookupByOrgNumber(clean);
      if (rawData || result) {
        // Wait a tick for rawData to update
        setTimeout(() => {
          setSelectedOrg({
            name: rawData?.navn || clean,
            orgNumber: clean.replace(/[\s-]/g, ""),
            industry: result?.industryLabel,
            employees: result?.employeesLabel,
            location: rawData?.forretningsadresse?.poststed,
          });
          setStep("relationship");
        }, 100);
      }
    } else {
      await searchByName(clean);
    }
  };

  const handleSelectResult = async (result: any) => {
    const orgNum = result.organisasjonsnummer;
    const lookupResult = await lookupByOrgNumber(orgNum);
    setSelectedOrg({
      name: result.navn,
      orgNumber: orgNum,
      industry: lookupResult?.industryLabel || result.naeringskode1?.beskrivelse,
      employees: lookupResult?.employeesLabel,
      location: result.forretningsadresse?.poststed,
    });
    setStep("relationship");
  };

  const handleSave = async () => {
    if (!selectedOrg) return;
    setSaving(true);

    try {
      if (isPartner) {
        // Add as MSP customer
        const { error } = await supabase.from("msp_customers").insert({
          customer_name: selectedOrg.name,
          org_number: selectedOrg.orgNumber,
          industry: selectedOrg.industry || null,
          employees: selectedOrg.employees || null,
          msp_user_id: "00000000-0000-0000-0000-000000000000",
          subscription_plan: "Basis",
          status: "active",
        });
        if (error) throw error;
      } else {
        // Add as subsidiary / other company_profile
        const { error } = await supabase.from("company_profile").insert({
          name: selectedOrg.name,
          org_number: selectedOrg.orgNumber,
          industry: selectedOrg.industry || "Annet",
          employees: selectedOrg.employees || null,
        });
        if (error) throw error;

        // Also create a Trust Profile (self asset) with the same name
        await supabase.from("assets").insert({
          name: selectedOrg.name,
          asset_type: "self",
          description: `Trust Profile for ${selectedOrg.name}`,
          lifecycle_status: "active",
          compliance_score: 0,
          org_number: selectedOrg.orgNumber,
          country: "Norge",
        });
      }

      queryClient.invalidateQueries();
      setStep("done");
      toast.success(`${selectedOrg.name} ble lagt til`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke legge til virksomhet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Legg til virksomhet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Agent message bubble */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[90%]">
              {step === "search" && (
                <p>Hei! Jeg hjelper deg med å legge til en virksomhet. Søk etter navn eller skriv inn et organisasjonsnummer.</p>
              )}
              {step === "relationship" && selectedOrg && (
                <div className="space-y-2">
                  <p>Jeg fant <strong>{selectedOrg.name}</strong>.</p>
                  {selectedOrg.location && <p className="text-muted-foreground text-xs">{selectedOrg.location}{selectedOrg.industry ? ` · ${selectedOrg.industry}` : ""}</p>}
                  <p>Er du partner eller rådgiver for denne virksomheten, eller er det en datterorganisasjon / annet selskap du administrerer?</p>
                </div>
              )}
              {step === "confirm" && selectedOrg && (
                <div className="space-y-2">
                  <p>Flott! Her er en oppsummering:</p>
                  <div className="bg-background rounded-lg p-3 space-y-1 text-xs border">
                    <div className="flex justify-between"><span className="text-muted-foreground">Virksomhet</span><span className="font-medium">{selectedOrg.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Org.nr</span><span className="font-medium">{selectedOrg.orgNumber}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tilknytning</span><span className="font-medium">{isPartner ? "Partnerkunde" : "Datterselskap / Eget selskap"}</span></div>
                  </div>
                  <p>Skal jeg legge til denne virksomheten?</p>
                </div>
              )}
              {step === "done" && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-status-closed" />
                  <p><strong>{selectedOrg?.name}</strong> er lagt til{isPartner ? " som partnerkunde i ditt dashbord" : " som virksomhet"}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Step: Search */}
          {step === "search" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Navn eller org.nr (9 siffer)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoFocus
                />
                <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()} size="icon" variant="outline">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.organisasjonsnummer}
                      onClick={() => handleSelectResult(r)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                    >
                      <div className="font-medium">{r.navn}</div>
                      <div className="text-xs text-muted-foreground">
                        Org.nr {r.organisasjonsnummer}
                        {r.forretningsadresse?.poststed && ` · ${r.forretningsadresse.poststed}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Relationship */}
          {step === "relationship" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setIsPartner(true); setStep("confirm"); }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-primary/5",
                  "text-center"
                )}
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Partner / Rådgiver</span>
                <span className="text-xs text-muted-foreground">Kunden dukker opp i partnerdashbordet</span>
              </button>
              <button
                onClick={() => { setIsPartner(false); setStep("confirm"); }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-primary/5",
                  "text-center"
                )}
              >
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Eget selskap</span>
                <span className="text-xs text-muted-foreground">Datterselskap eller annet selskap du styrer</span>
              </button>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setStep("relationship")}>Tilbake</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Legg til
              </Button>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="flex justify-end">
              <Button onClick={handleClose}>Lukk</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
