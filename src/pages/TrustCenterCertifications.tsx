import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Award, Plus, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const certifications = [
  { id: "1", name: "ISO 27001:2022", issuer: "DNV GL", status: "valid" as const, expiry: "2027-03-15", scope: "Informasjonssikkerhetsstyring" },
  { id: "2", name: "ISO 9001:2015", issuer: "Bureau Veritas", status: "expiring" as const, expiry: "2025-06-01", scope: "Kvalitetsstyringssystem" },
  { id: "3", name: "SOC 2 Type II", issuer: "Deloitte", status: "valid" as const, expiry: "2025-09-01", scope: "Security, Availability, Confidentiality" },
];

const TrustCenterCertifications = () => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: "valid" | "expiring" | "expired") => {
    switch (status) {
      case "valid":
        return <Badge className="bg-success/15 text-success border-success/30 text-[13px] gap-1"><CheckCircle2 className="h-3 w-3" />Gyldig</Badge>;
      case "expiring":
        return <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px] gap-1"><AlertTriangle className="h-3 w-3" />Utløper snart</Badge>;
      case "expired":
        return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[13px] gap-1"><AlertTriangle className="h-3 w-3" />Utløpt</Badge>;
    }
  };

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Sertifiseringer</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Oversikt over organisasjonens sertifiseringer, attester og godkjenninger.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Legg til
        </Button>
      </div>

      <div className="space-y-3">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="flex items-start justify-between py-4 px-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cert.name}</p>
                    {getStatusBadge(cert.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.scope}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3 w-3" />
                Utløper: {cert.expiry}
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

export default TrustCenterCertifications;
