import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Layers, Plus, Server, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrustCenterProducts = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Products & Services
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Opprett og administrer Trust Profiler for dine produkter og tjenester som deles med kunder.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Ny profil
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">SaaS Trust Profile</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              For skybaserte produkter og plattformer. Vis compliance, datahåndtering og oppetid.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Opprett SaaS-profil
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mb-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Service Trust Profile</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              For konsulenttjenester, driftstjenester og rådgivning. Dokumenter kompetanse og sertifiseringer.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Opprett tjenesteprofil
            </Button>
          </CardContent>
        </Card>
      </div>

      <Badge variant="secondary" className="mt-6 text-xs">Kommer snart – full funksjonalitet</Badge>
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

export default TrustCenterProducts;
