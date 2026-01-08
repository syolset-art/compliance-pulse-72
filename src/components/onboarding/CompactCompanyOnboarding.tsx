import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

interface CompactCompanyOnboardingProps {
  onComplete: () => void;
}

const industries = [
  { value: "Energi", label: "Energi" },
  { value: "Helse", label: "Helse" },
  { value: "Finans", label: "Finans" },
  { value: "Teknologi", label: "Teknologi" },
  { value: "Offentlig", label: "Offentlig sektor" },
  { value: "Annet", label: "Annet" }
];

const employeeRanges = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
];

type Step = "company" | "industry" | "size";

export const CompactCompanyOnboarding = ({ onComplete }: CompactCompanyOnboardingProps) => {
  const [step, setStep] = useState<Step>("company");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    orgNumber: "",
    industry: "",
    employees: ""
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.industry) {
      toast.error("Fyll ut påkrevde felt");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("company_profile")
        .insert({
          name: formData.name,
          org_number: formData.orgNumber || null,
          industry: formData.industry,
          employees: formData.employees || null
        });

      if (error) throw error;

      // Update onboarding_progress
      await supabase
        .from("onboarding_progress")
        .upsert({ id: "default", company_info_completed: true });

      toast.success("Selskapsinformasjon lagret!");
      onComplete();
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast.error("Kunne ikke lagre selskapsinformasjon");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === "company") return !!formData.name;
    if (step === "industry") return !!formData.industry;
    return true;
  };

  const nextStep = () => {
    if (step === "company") setStep("industry");
    else if (step === "industry") setStep("size");
    else handleSubmit();
  };

  const prevStep = () => {
    if (step === "industry") setStep("company");
    else if (step === "size") setStep("industry");
  };

  return (
    <div className="space-y-4">
      {step === "company" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="name" className="text-xs">Selskapsnavn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ditt selskap AS"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="orgNumber" className="text-xs">Org.nummer</Label>
            <Input
              id="orgNumber"
              value={formData.orgNumber}
              onChange={(e) => setFormData({ ...formData, orgNumber: e.target.value })}
              placeholder="123 456 789"
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      {step === "industry" && (
        <div className="space-y-3">
          <Label className="text-xs">Bransje *</Label>
          <div className="grid grid-cols-2 gap-2">
            {industries.map((ind) => (
              <button
                key={ind.value}
                onClick={() => setFormData({ ...formData, industry: ind.value })}
                className={`p-2 text-xs rounded-lg border transition-all ${
                  formData.industry === ind.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "size" && (
        <div className="space-y-3">
          <Label className="text-xs">Antall ansatte</Label>
          <Select 
            value={formData.employees} 
            onValueChange={(value) => setFormData({ ...formData, employees: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Velg antall" />
            </SelectTrigger>
            <SelectContent>
              {employeeRanges.map((range) => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {step !== "company" ? (
          <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 text-xs">
            <ChevronLeft className="h-3 w-3 mr-1" />
            Tilbake
          </Button>
        ) : (
          <div />
        )}
        
        <Button 
          size="sm" 
          onClick={nextStep} 
          disabled={!canProceed() || isLoading}
          className="h-8 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : step === "size" ? (
            "Fullfør"
          ) : (
            <>
              Neste
              <ChevronRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-1 pt-1">
        {["company", "industry", "size"].map((s, i) => (
          <div
            key={s}
            className={`h-1 w-6 rounded-full transition-colors ${
              s === step ? "bg-primary" : 
              (step === "industry" && i === 0) || (step === "size" && i < 2) ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
