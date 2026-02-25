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

interface CompanyProfile {
  id: string;
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  maturity: string | null;
  geographic_scope: string | null;
  sensitive_data: string | null;
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

const employeeRanges = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500-1000",
  "1000+",
];

const maturityLevels = [
  { id: "beginner", name: "Nybegynner", description: "Nettopp begynt med compliance" },
  { id: "intermediate", name: "Underveis", description: "Noen rutiner på plass" },
  { id: "advanced", name: "Avansert", description: "Modne prosesser og systemer" },
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

          {/* Employees */}
          <div className="space-y-3">
            <Label>Antall ansatte</Label>
            <div className="flex flex-wrap gap-2">
              {employeeRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setFormData({ ...formData, employees: range })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                    formData.employees === range
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Maturity */}
          <div className="space-y-3">
            <Label>Modenhetsnivå</Label>
            <RadioGroup 
              value={formData.maturity} 
              onValueChange={(value) => setFormData({ ...formData, maturity: value })}
              className="space-y-2"
            >
              {maturityLevels.map((level) => (
                <label
                  key={level.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    formData.maturity === level.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={level.id} />
                  <div>
                    <p className="font-medium text-sm">{level.name}</p>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
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