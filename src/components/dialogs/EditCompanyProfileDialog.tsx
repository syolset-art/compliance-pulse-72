import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  HeartPulse, 
  Landmark, 
  Code, 
  Building,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPANY_CATEGORIES,
  GOVERNANCE_LEVELS,
  calculateGovernanceLevel,
  categoryToMaturity,
  type GovernanceLevel,
} from "@/lib/governanceLevelEngine";

interface CompanyProfile {
  id: string;
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  maturity: string | null;
  geographic_scope: string | null;
  sensitive_data: string | null;
  governance_level?: string | null;
}

interface EditCompanyProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyProfile: CompanyProfile | null;
  onProfileUpdated: () => void;
}

const industries = [
  { id: "energi", name: "Energi", icon: Zap },
  { id: "helse", name: "Helse", icon: HeartPulse },
  { id: "finans", name: "Finans", icon: Landmark },
  { id: "saas", name: "Tech / SaaS", icon: Code },
  { id: "offentlig", name: "Offentlig sektor", icon: Building },
];

export function EditCompanyProfileDialog({ 
  open, 
  onOpenChange, 
  companyProfile, 
  onProfileUpdated 
}: EditCompanyProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    org_number: "",
    industry: "",
    employees: "",
    maturity: "intermediate",
    geographic_scope: "",
    sensitive_data: "",
    governance_level: "foundation" as string,
  });

  useEffect(() => {
    if (companyProfile) {
      setFormData({
        name: companyProfile.name || "",
        org_number: companyProfile.org_number || "",
        industry: companyProfile.industry || "",
        employees: companyProfile.employees || "",
        maturity: companyProfile.maturity || "intermediate",
        geographic_scope: (companyProfile as any).geographic_scope || "",
        sensitive_data: (companyProfile as any).sensitive_data || "",
        governance_level: (companyProfile as any).governance_level || "foundation",
      });
    }
  }, [companyProfile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({ title: "Feil", description: "Selskapsnavn er påkrevd", variant: "destructive" });
      return;
    }

    if (!formData.industry) {
      toast({ title: "Feil", description: "Bransje er påkrevd", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("company_profile" as any)
        .update(formData)
        .eq("id", companyProfile?.id);

      if (error) throw error;

      toast({
        title: "Lagret",
        description: "Selskapsprofilen ble oppdatert",
      });

      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating company profile:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere selskapsprofil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger selskapsprofil</DialogTitle>
          <DialogDescription>
            Oppdater informasjon om selskapet ditt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Selskapsnavn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="F.eks. Eviny AS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org_number">Organisasjonsnummer</Label>
              <Input
                id="org_number"
                value={formData.org_number}
                onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                placeholder="F.eks. 983052968"
              />
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-3">
            <Label>Bransje *</Label>
            <div className="grid grid-cols-2 gap-2">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isSelected = formData.industry === industry.id;
                return (
                  <button
                    key={industry.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, industry: industry.id })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{industry.name}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Category */}
          <div className="space-y-3">
            <Label>Virksomhetstype</Label>
            <div className="grid gap-2">
              {COMPANY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.employees === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const maturity = categoryToMaturity(cat.id);
                      const level = calculateGovernanceLevel(cat.id);
                      setFormData({ ...formData, employees: cat.id, maturity, governance_level: level });
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <span className="font-medium text-sm">{cat.name_no}</span>
                      <p className="text-xs text-muted-foreground">{cat.description_no}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Governance Level */}
          <div className="space-y-3">
            <Label>Governance-nivå</Label>
            <RadioGroup 
              value={formData.governance_level} 
              onValueChange={(value) => setFormData({ ...formData, governance_level: value })}
              className="space-y-2"
            >
              {GOVERNANCE_LEVELS.map((level) => (
                <label
                  key={level.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    formData.governance_level === level.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={level.id} />
                  <div>
                    <p className="font-medium text-sm">{level.name_no}</p>
                    <p className="text-xs text-muted-foreground">{level.description_no}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Geographic Scope */}
          <div className="space-y-3">
            <Label>Geografisk scope</Label>
            <RadioGroup 
              value={formData.geographic_scope} 
              onValueChange={(value) => setFormData({ ...formData, geographic_scope: value })}
              className="space-y-2"
            >
              <label className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", formData.geographic_scope === "eos_only" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                <RadioGroupItem value="eos_only" />
                <span className="font-medium text-sm">Kun Norge/EØS</span>
              </label>
              <label className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", formData.geographic_scope === "outside_eos" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                <RadioGroupItem value="outside_eos" />
                <span className="font-medium text-sm">Også utenfor EU/EØS</span>
              </label>
            </RadioGroup>
          </div>

          {/* Sensitive Data */}
          <div className="space-y-3">
            <Label>Behandler dere sensitive personopplysninger (ikke HR)?</Label>
            <RadioGroup 
              value={formData.sensitive_data} 
              onValueChange={(value) => setFormData({ ...formData, sensitive_data: value })}
              className="space-y-2"
            >
              {[
                { value: "yes", label: "Ja" },
                { value: "no", label: "Nei" },
                { value: "unsure", label: "Vet ikke" },
                { value: "unsure_alt", label: "Usikker" },
              ].map((opt) => (
                <label key={opt.value} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", formData.sensitive_data === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <RadioGroupItem value={opt.value} />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                "Lagre endringer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}