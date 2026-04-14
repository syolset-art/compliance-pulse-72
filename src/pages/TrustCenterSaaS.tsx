import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrustCenterSaaS = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
          SaaS / Product
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Opprett og administrer Trust Profiler for dine SaaS-produkter og tjenester som deles med kunder.
        </p>
      </div>

      <Card variant="flat" className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ingen produktprofiler ennå</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Opprett en Trust Profil for dine SaaS-produkter slik at kundene dine kan se compliance-status, datahåndtering og sertifiseringer.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Opprett produktprofil
          </Button>
          <Badge variant="secondary" className="mt-4 text-xs">Kommer</Badge>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">
          {content}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
        {content}
      </main>
    </div>
  );
};

export default TrustCenterSaaS;
