import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle2, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const frameworks = [
  { name: "GDPR", score: 72, status: "active" as const, lastReview: "2026-01-15" },
  { name: "ISO 27001", score: 58, status: "in-progress" as const, lastReview: "2025-12-01" },
  { name: "NIS2", score: 41, status: "in-progress" as const, lastReview: "2026-02-10" },
  { name: "SOC 2", score: 0, status: "planned" as const, lastReview: null },
];

const TrustCenterCompliance = () => {
  const isMobile = useIsMobile();

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

      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((fw) => (
          <Card key={fw.name}>
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
                {fw.lastReview && (
                  <p className="text-xs text-muted-foreground">
                    Siste gjennomgang: {fw.lastReview}
                  </p>
                )}
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

export default TrustCenterCompliance;
