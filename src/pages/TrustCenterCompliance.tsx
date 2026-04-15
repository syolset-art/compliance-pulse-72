import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle2, ShieldCheck, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";

interface FrameworkCompliance {
  name: string;
  frameworkId: string;
  category: string;
  score: number;
  status: "active" | "in-progress" | "planned";
  totalReqs: number;
  metReqs: number;
}

function getReqs(frameworkId: string) {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

function getDemoScore(frameworkId: string) {
  const reqs = getReqs(frameworkId);
  if (reqs.length === 0) return { score: 0, met: 0, total: 0 };
  let met = 0;
  reqs.forEach((req, i) => {
    const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 10;
    if (hash < 3) met++;
  });
  return { score: Math.round((met / reqs.length) * 100), met, total: reqs.length };
}

const TrustCenterCompliance = () => {
  const isMobile = useIsMobile();

  const { data: frameworks = [], isLoading } = useQuery({
    queryKey: ['trust-center-compliance-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('selected_frameworks')
        .select('*')
        .eq('is_selected', true)
        .order('framework_name');

      if (error) throw error;

      return (data || []).map((sf): FrameworkCompliance => {
        const { score, met, total } = getDemoScore(sf.framework_id);
        let status: FrameworkCompliance['status'] = 'planned';
        if (score >= 50) status = 'active';
        else if (score > 0 || total > 0) status = 'in-progress';

        return {
          name: sf.framework_name,
          frameworkId: sf.framework_id,
          category: sf.category,
          score,
          status,
          totalReqs: total,
          metReqs: met,
        };
      });
    },
  });

  const getStatusBadge = (status: "active" | "in-progress" | "planned") => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/15 text-success border-success/30 text-[13px] gap-1"><CheckCircle2 className="h-3 w-3" />Aktiv</Badge>;
      case "in-progress":
        return <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px] gap-1"><Clock className="h-3 w-3" />Pågår</Badge>;
      case "planned":
        return <Badge variant="secondary" className="text-[13px] gap-1"><AlertTriangle className="h-3 w-3" />Planlagt</Badge>;
    }
  };

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
          Compliance Status
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Oversikt over organisasjonens etterlevelse av aktive rammeverk og reguleringer.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : frameworks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          <p>Ingen regelverk er aktivert ennå.</p>
          <p className="text-xs mt-1">Gå til Regelverk for å aktivere rammeverk.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {frameworks.map((fw) => (
            <Card key={fw.frameworkId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{fw.name}</CardTitle>
                  {getStatusBadge(fw.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Etterlevelsesgrad</span>
                    <span className="font-medium">{fw.score}%</span>
                  </div>
                  <Progress value={fw.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {fw.metReqs} av {fw.totalReqs} krav oppfylt
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
    </div>
  );
};

export default TrustCenterCompliance;
