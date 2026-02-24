import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrustCenterShared = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
          Shared Profiles
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Se og administrer Trust Profiler som er delt med deg fra leverandører og partnere.
        </p>
      </div>

      <Card variant="flat" className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Share2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ingen delte profiler</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Når leverandører deler sine Trust Profiler med deg, vil de vises her. Du kan også invitere leverandører til å dele.
          </p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Inviter leverandør
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

export default TrustCenterShared;
