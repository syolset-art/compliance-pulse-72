import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Users, Factory, Hash, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaturityProgressCard } from "@/components/company/MaturityProgressCard";
import { BrregSuggestionBanner } from "@/components/company/BrregSuggestionBanner";
import { MilestoneTimeline } from "@/components/company/MilestoneTimeline";

interface CompanyProfile {
  id: string;
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  maturity: string | null;
  initial_maturity?: string | null;
}

const industryOptions = [
  { value: "energi", label: "Energi" },
  { value: "helse", label: "Helse" },
  { value: "finans", label: "Finans" },
  { value: "saas", label: "Tech / SaaS" },
  { value: "offentlig", label: "Offentlig sektor" },
  { value: "technology", label: "Teknologi" },
  { value: "healthcare", label: "Helsevesen" },
  { value: "finance", label: "Finans" },
  { value: "retail", label: "Handel" },
  { value: "manufacturing", label: "Produksjon" },
  { value: "education", label: "Utdanning" },
  { value: "consulting", label: "Konsulent" },
  { value: "energy", label: "Energi" },
  { value: "other", label: "Annet" },
];

const employeeOptions = [
  { value: "1-10", label: "1-10 ansatte" },
  { value: "11-50", label: "11-50 ansatte" },
  { value: "51-200", label: "51-200 ansatte" },
  { value: "201-500", label: "201-500 ansatte" },
  { value: "500-1000", label: "500-1000 ansatte" },
  { value: "501-1000", label: "501-1000 ansatte" },
  { value: "1000+", label: "Over 1000 ansatte" },
];

const maturityOptions = [
  { value: "beginner", label: "Nybegynner" },
  { value: "intermediate", label: "Under utvikling" },
  { value: "advanced", label: "Avansert" },
  { value: "starting", label: "I oppstartsfasen" },
  { value: "developing", label: "Under utvikling" },
  { value: "established", label: "Etablert" },
  { value: "mature", label: "Modent" },
];

export default function CompanySettings() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from("company_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error("Kunne ikke hente selskapsinformasjon");
    } else if (data) {
      setCompany(data);
      setEditedCompany(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editedCompany) return;
    
    setSaving(true);
    
    // If initial_maturity is not set, set it now to track progression
    const updateData: any = {
      name: editedCompany.name,
      industry: editedCompany.industry,
      employees: editedCompany.employees,
      maturity: editedCompany.maturity,
    };
    
    // Set initial_maturity on first save if not already set
    if (!company?.initial_maturity && editedCompany.maturity) {
      updateData.initial_maturity = editedCompany.maturity;
    }
    
    const { error } = await supabase
      .from("company_profile")
      .update(updateData)
      .eq("id", editedCompany.id);

    if (error) {
      toast.error("Kunne ikke lagre endringer");
    } else {
      setCompany({ ...editedCompany, initial_maturity: updateData.initial_maturity || company?.initial_maturity });
      setIsEditing(false);
      toast.success("Endringer lagret");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditedCompany(company);
    setIsEditing(false);
  };

  const handleApplyBrregSuggestion = (industry: string, employees: string) => {
    if (editedCompany) {
      const updated = {
        ...editedCompany,
        industry: industry || editedCompany.industry,
        employees: employees || editedCompany.employees,
      };
      setEditedCompany(updated);
      setIsEditing(true);
      toast.success("Forslag fra Brønnøysund lagt inn - husk å lagre!");
    }
  };

  const getIndustryLabel = (value: string) => 
    industryOptions.find(o => o.value === value)?.label || value;

  const getEmployeeLabel = (value: string) => 
    employeeOptions.find(o => o.value === value)?.label || value;

  const getMaturityLabel = (value: string) => 
    maturityOptions.find(o => o.value === value)?.label || value;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laster...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Selskapsinnstillinger</h1>
            <p className="text-muted-foreground">Administrer informasjon om din organisasjon</p>
          </div>
        </div>

        {/* Maturity Progress Card */}
        <MaturityProgressCard />

        {/* Brønnøysund Suggestion Banner */}
        {company?.org_number && (
          <BrregSuggestionBanner
            orgNumber={company.org_number}
            currentIndustry={company.industry}
            currentEmployees={company.employees}
            onApplySuggestion={handleApplyBrregSuggestion}
          />
        )}

        {/* Main Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{company?.name || "Ukjent selskap"}</CardTitle>
                <CardDescription>Grunnleggende selskapsinformasjon</CardDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rediger
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization Number - Read Only */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Organisasjonsnummer
                </Label>
                <div className="p-3 bg-muted rounded-md text-foreground font-mono">
                  {company?.org_number || "Ikke registrert"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hentet fra Brønnøysundregistrene
                </p>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Selskapsnavn
                </Label>
                {isEditing ? (
                  <Input
                    value={editedCompany?.name || ""}
                    onChange={(e) => setEditedCompany(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {company?.name || "Ikke registrert"}
                  </div>
                )}
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Factory className="h-4 w-4" />
                  Bransje
                </Label>
                {isEditing ? (
                  <Select
                    value={editedCompany?.industry || ""}
                    onValueChange={(value) => setEditedCompany(prev => prev ? {...prev, industry: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg bransje" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {company?.industry ? getIndustryLabel(company.industry) : "Ikke registrert"}
                  </div>
                )}
              </div>

              {/* Employees */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Antall ansatte
                </Label>
                {isEditing ? (
                  <Select
                    value={editedCompany?.employees || ""}
                    onValueChange={(value) => setEditedCompany(prev => prev ? {...prev, employees: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg antall" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {company?.employees ? getEmployeeLabel(company.employees) : "Ikke registrert"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Timeline */}
        <MilestoneTimeline />

        {/* Info Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tips:</strong> Selskapsinformasjonen brukes til å tilpasse Mynder til din organisasjon. 
              Jo mer nøyaktig informasjon, desto bedre kan vi hjelpe deg med compliance-arbeidet. Modenhetsnivået ditt øker automatisk 
              når du aktiverer regelverk, fullfører oppgaver og dokumenterer systemer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
