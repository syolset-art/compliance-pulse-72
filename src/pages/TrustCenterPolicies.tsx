import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const demoPolicies = [
  { id: "1", name: "Personvernpolicy", version: "v3.1", updated: "2026-01-20", status: "published" },
  { id: "2", name: "Informasjonssikkerhetspolicy", version: "v2.0", updated: "2025-11-15", status: "published" },
  { id: "3", name: "Akseptabel bruk-policy", version: "v1.4", updated: "2025-09-01", status: "draft" },
  { id: "4", name: "Hendelseshåndteringspolicy", version: "v1.0", updated: "2026-02-05", status: "published" },
];

const TrustCenterPolicies = () => {
  const isMobile = useIsMobile();

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Policies</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Administrer og publiser organisasjonens retningslinjer og policyer for ekstern deling.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Ny policy
        </Button>
      </div>

      <div className="space-y-3">
        {demoPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center justify-between py-4 px-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{policy.name}</p>
                  <p className="text-xs text-muted-foreground">{policy.version} · Oppdatert {policy.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={policy.status === "published" ? "default" : "secondary"} className="text-[10px]">
                  {policy.status === "published" ? "Publisert" : "Utkast"}
                </Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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

export default TrustCenterPolicies;
