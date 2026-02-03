import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft, Sparkles, Building2, Shield, AlertTriangle, Lightbulb, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  qualityModules, 
  industryAdaptations, 
  getModuleById, 
  getIndustryById,
  mapCompanyIndustryToType,
  getRecommendedQualityModule,
  type QualityModuleType,
  type IndustryType,
  type RecommendationResult
} from "@/lib/qualityModuleDefinitions";

interface QualityModuleActivationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated?: () => void;
}

export const QualityModuleActivationWizard = ({ 
  open, 
  onOpenChange,
  onActivated 
}: QualityModuleActivationWizardProps) => {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb' || i18n.language === 'no';
  
  const [step, setStep] = useState(1);
  const [selectedModuleType, setSelectedModuleType] = useState<QualityModuleType | null>(null);
  const [detectedIndustry, setDetectedIndustry] = useState<IndustryType>('general');
  const [companyIndustry, setCompanyIndustry] = useState<string>('');
  const [employeeRange, setEmployeeRange] = useState<string>('');
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [selectedIndustryModules, setSelectedIndustryModules] = useState<string[]>([]);
  const [linkedFrameworks, setLinkedFrameworks] = useState<string[]>([]);
  const [acceptedPrice, setAcceptedPrice] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      const { data } = await supabase
        .from('company_profile')
        .select('industry, employees, brreg_employees')
        .limit(1)
        .maybeSingle();
      
      if (data?.industry) {
        setCompanyIndustry(data.industry);
        const mappedIndustry = mapCompanyIndustryToType(data.industry);
        setDetectedIndustry(mappedIndustry);
        
        // Set employee range for display
        if (data.brreg_employees) {
          setEmployeeRange(`${data.brreg_employees} ansatte`);
        } else if (data.employees) {
          setEmployeeRange(data.employees);
        }
        
        // Calculate recommendation
        const rec = getRecommendedQualityModule(
          mappedIndustry,
          data.employees,
          data.brreg_employees
        );
        setRecommendation(rec);
        setSelectedModuleType(rec.recommendedModule);
        
        // Pre-select required modules
        const industry = getIndustryById(mappedIndustry);
        if (industry) {
          const required = industry.modules
            .filter(m => m.required)
            .map(m => m.id);
          setSelectedIndustryModules(required);
        }
      }
    };
    
    if (open) {
      fetchCompanyProfile();
    }
  }, [open]);

  useEffect(() => {
    // Fetch linked frameworks
    const fetchFrameworks = async () => {
      const { data } = await supabase
        .from('selected_frameworks')
        .select('framework_id, framework_name, is_selected')
        .eq('is_selected', true);
      
      if (data) {
        setLinkedFrameworks(data.map(f => f.framework_id));
      }
    };
    
    if (open && step === 3) {
      fetchFrameworks();
    }
  }, [open, step]);

  const handleReset = () => {
    setStep(1);
    setSelectedModuleType(null);
    setSelectedIndustryModules([]);
    setAcceptedPrice(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleActivate = async () => {
    if (!selectedModuleType) return;
    
    setIsActivating(true);
    
    try {
      // In a real implementation, this would create the quality_modules record
      // and trigger the appropriate setup based on selections
      
      // For demo, we'll just show success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(
        isNorwegian 
          ? "Kvalitetssystem aktivert!" 
          : "Quality System activated!",
        {
          description: isNorwegian
            ? "Lara vil nå guide deg gjennom videre oppsett"
            : "Lara will now guide you through further setup"
        }
      );
      
      onActivated?.();
      handleClose();
    } catch (error) {
      toast.error(
        isNorwegian 
          ? "Kunne ikke aktivere kvalitetssystem" 
          : "Could not activate quality system"
      );
    } finally {
      setIsActivating(false);
    }
  };

  const toggleIndustryModule = (moduleId: string) => {
    setSelectedIndustryModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectedModule = selectedModuleType ? getModuleById(selectedModuleType) : null;
  const industryConfig = getIndustryById(detectedIndustry);
  
  const totalPrice = selectedModule?.price || 0;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Sparkles className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">
          {isNorwegian ? "Velg type kvalitetssystem" : "Select quality system type"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isNorwegian 
            ? "Basert på dine behov og virksomhetens størrelse" 
            : "Based on your needs and business size"}
        </p>
      </div>
      
      {/* Recommendation Banner */}
      {recommendation && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">
                {isNorwegian 
                  ? `Basert på din bransje${companyIndustry ? ` (${companyIndustry})` : ''}${employeeRange ? ` og størrelse (${employeeRange})` : ''} anbefaler vi:`
                  : `Based on your industry${companyIndustry ? ` (${companyIndustry})` : ''}${employeeRange ? ` and size (${employeeRange})` : ''} we recommend:`}
              </p>
              <p className="text-sm font-semibold mt-1">
                {getModuleById(recommendation.recommendedModule)?.[isNorwegian ? 'name' : 'nameEn']}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isNorwegian ? recommendation.reason : recommendation.reasonEn}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid gap-3">
        {qualityModules.map((module) => {
          const isRecommended = recommendation?.recommendedModule === module.id;
          
          return (
            <button
              key={module.id}
              onClick={() => setSelectedModuleType(module.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 relative",
                selectedModuleType === module.id 
                  ? "border-primary bg-primary/5" 
                  : isRecommended 
                    ? "border-primary/30 bg-primary/5"
                    : "border-border"
              )}
            >
              {isRecommended && (
                <div className="absolute -top-2 right-4">
                  <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                    <Star className="h-3 w-3" />
                    {isNorwegian ? "Anbefalt for deg" : "Recommended for you"}
                  </Badge>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={cn("p-2 rounded-lg", module.bgColor)}>
                  <module.icon className={cn("h-6 w-6", module.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {isNorwegian ? module.name : module.nameEn}
                    </h4>
                    {module.price === null ? (
                      <Badge variant="secondary">
                        {isNorwegian ? "Inkludert" : "Included"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        +{module.price} kr/{isNorwegian ? "mnd" : "mo"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isNorwegian ? module.description : module.descriptionEn}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isNorwegian ? module.targetAudience : module.targetAudienceEn}
                  </p>
                  {isRecommended && selectedModuleType !== module.id && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {module.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {isNorwegian ? feature : module.featuresEn[idx]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {selectedModuleType === module.id && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Building2 className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">
          {isNorwegian ? "Bransjetilpasning" : "Industry Adaptation"}
        </h3>
        {companyIndustry && (
          <p className="text-sm text-muted-foreground">
            {isNorwegian ? "Basert på bransje:" : "Based on industry:"}{" "}
            <span className="font-medium">{companyIndustry}</span>
          </p>
        )}
      </div>

      {industryConfig && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <industryConfig.icon className={cn("h-6 w-6", industryConfig.color)} />
            <div>
              <p className="font-medium">
                {isNorwegian ? industryConfig.name : industryConfig.nameEn}
              </p>
              <p className="text-xs text-muted-foreground">
                {isNorwegian 
                  ? "Anbefalte moduler for din bransje" 
                  : "Recommended modules for your industry"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {industryConfig.modules.map((module) => (
              <div
                key={module.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  selectedIndustryModules.includes(module.id)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <Checkbox
                  checked={selectedIndustryModules.includes(module.id)}
                  onCheckedChange={() => toggleIndustryModule(module.id)}
                  disabled={module.required}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {isNorwegian ? module.name : module.nameEn}
                    </span>
                    {module.required && (
                      <Badge variant="destructive" className="text-xs">
                        {isNorwegian ? "Påkrevd" : "Required"}
                      </Badge>
                    )}
                    {module.recommended && !module.required && (
                      <Badge variant="secondary" className="text-xs">
                        {isNorwegian ? "Anbefalt" : "Recommended"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isNorwegian ? module.description : module.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">
          {isNorwegian ? "Kobling til regelverk" : "Framework Linking"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isNorwegian 
            ? "Kvalitetssystemet kobles automatisk til dine aktive regelverk" 
            : "The quality system will automatically link to your active frameworks"}
        </p>
      </div>

      <div className="space-y-2">
        {linkedFrameworks.length > 0 ? (
          linkedFrameworks.map((fwId) => (
            <div key={fwId} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm capitalize">{fwId.replace(/-/g, ' ')}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm">
              {isNorwegian 
                ? "Ingen regelverk er aktivert ennå" 
                : "No frameworks are activated yet"}
            </p>
          </div>
        )}
      </div>

      {selectedModule?.frameworks && (
        <div className="mt-4 p-3 rounded-lg border border-dashed">
          <p className="text-xs text-muted-foreground mb-2">
            {isNorwegian 
              ? "Relevante rammeverk for valgt modul:" 
              : "Relevant frameworks for selected module:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedModule.frameworks.map((fw) => (
              <Badge key={fw} variant="outline" className="text-xs capitalize">
                {fw.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Sparkles className="h-12 w-12 mx-auto text-green-500 mb-3" />
        <h3 className="text-lg font-semibold">
          {isNorwegian ? "Oppsummering og aktivering" : "Summary and Activation"}
        </h3>
      </div>

      <div className="space-y-4 bg-muted p-4 rounded-xl">
        {selectedModule && (
          <div className="flex items-center gap-3">
            <selectedModule.icon className={cn("h-6 w-6", selectedModule.color)} />
            <div>
              <p className="font-medium">
                {isNorwegian ? selectedModule.name : selectedModule.nameEn}
              </p>
              <p className="text-xs text-muted-foreground">
                {isNorwegian ? selectedModule.description : selectedModule.descriptionEn}
              </p>
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">
            {isNorwegian ? "Inkluderte moduler:" : "Included modules:"}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedIndustryModules.map((modId) => {
              const mod = industryConfig?.modules.find(m => m.id === modId);
              return mod ? (
                <Badge key={modId} variant="secondary" className="text-xs">
                  {isNorwegian ? mod.name : mod.nameEn}
                </Badge>
              ) : null;
            })}
          </div>
        </div>

        <div className="border-t pt-3 flex items-center justify-between">
          <span className="font-medium">
            {isNorwegian ? "Månedlig kostnad:" : "Monthly cost:"}
          </span>
          <span className="text-xl font-bold">
            {totalPrice === 0 ? (
              <span className="text-green-600">
                {isNorwegian ? "Gratis" : "Free"}
              </span>
            ) : (
              `${totalPrice} kr`
            )}
          </span>
        </div>
      </div>

      {totalPrice > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg border">
          <Checkbox
            id="accept-price"
            checked={acceptedPrice}
            onCheckedChange={(checked) => setAcceptedPrice(checked === true)}
          />
          <label htmlFor="accept-price" className="text-sm cursor-pointer">
            {isNorwegian 
              ? `Jeg godtar månedlig tillegg på ${totalPrice} kr/mnd` 
              : `I accept the monthly addition of ${totalPrice} kr/month`}
          </label>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {isNorwegian 
          ? "Ved aktivering opprettes nye menyvalg, og Lara vil guide deg gjennom videre oppsett." 
          : "Upon activation, new menu items will be created, and Lara will guide you through further setup."}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isNorwegian ? "Aktiver Kvalitetssystem" : "Activate Quality System"}
          </DialogTitle>
          <DialogDescription>
            {isNorwegian 
              ? `Steg ${step} av 4` 
              : `Step ${step} of 4`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="py-2">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isNorwegian ? "Tilbake" : "Back"}
            </Button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedModuleType}
            >
              {isNorwegian ? "Neste" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleActivate}
              disabled={isActivating || (totalPrice > 0 && !acceptedPrice)}
            >
              {isActivating ? (
                <>{isNorwegian ? "Aktiverer..." : "Activating..."}</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {isNorwegian ? "Aktiver" : "Activate"}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
