import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { FileText, Plus, ExternalLink, Award, Calendar, CheckCircle2, AlertTriangle, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const demoPolicies = [
  { id: "1", name: "Personvernpolicy", version: "v3.1", updated: "2026-01-20", status: "published" },
  { id: "2", name: "Informasjonssikkerhetspolicy", version: "v2.0", updated: "2025-11-15", status: "published" },
  { id: "3", name: "Akseptabel bruk-policy", version: "v1.4", updated: "2025-09-01", status: "draft" },
  { id: "4", name: "Hendelseshåndteringspolicy", version: "v1.0", updated: "2026-02-05", status: "published" },
];

const certifications = [
  { id: "1", name: "ISO 27001:2022", issuer: "DNV GL", status: "valid" as const, expiry: "2027-03-15", scope: "Informasjonssikkerhetsstyring" },
  { id: "2", name: "ISO 9001:2015", issuer: "Bureau Veritas", status: "expiring" as const, expiry: "2025-06-01", scope: "Kvalitetsstyringssystem" },
  { id: "3", name: "SOC 2 Type II", issuer: "Deloitte", status: "valid" as const, expiry: "2025-09-01", scope: "Security, Availability, Confidentiality" },
];

const documents = [
  { id: "1", name: "Databehandleravtale (DPA)", type: "DPA", updated: "2026-03-10", status: "active" },
  { id: "2", name: "Risikovurdering 2025", type: "Rapport", updated: "2025-12-01", status: "active" },
  { id: "3", name: "Beredskapsplan", type: "Plan", updated: "2025-10-15", status: "draft" },
];

const getStatusBadge = (status: "valid" | "expiring" | "expired") => {
  switch (status) {
    case "valid":
      return <Badge className="bg-success/15 text-success border-success/30 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Gyldig</Badge>;
    case "expiring":
      return <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Utløper snart</Badge>;
    case "expired":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Utløpt</Badge>;
  }
};

const TrustCenterEvidence = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
          {isNb ? "Dokumentasjon & Evidens" : "Documentation & Evidence"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {isNb
            ? "Samlet oversikt over retningslinjer, sertifiseringer og dokumenter som underbygger organisasjonens compliance."
            : "Overview of policies, certifications and documents supporting your organization's compliance."}
        </p>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="policies">{isNb ? "Retningslinjer" : "Policies"}</TabsTrigger>
          <TabsTrigger value="certifications">{isNb ? "Sertifiseringer" : "Certifications"}</TabsTrigger>
          <TabsTrigger value="documents">{isNb ? "Dokumenter" : "Documents"}</TabsTrigger>
        </TabsList>

        {/* Policies */}
        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Organisasjonens retningslinjer og policyer." : "Organization policies and guidelines."}
            </p>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isNb ? "Ny policy" : "New policy"}
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
                      <p className="text-xs text-muted-foreground">{policy.version} · {isNb ? "Oppdatert" : "Updated"} {policy.updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={policy.status === "published" ? "default" : "secondary"} className="text-[10px]">
                      {policy.status === "published" ? (isNb ? "Publisert" : "Published") : (isNb ? "Utkast" : "Draft")}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Sertifiseringer, attester og godkjenninger." : "Certifications, attestations and approvals."}
            </p>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isNb ? "Legg til" : "Add"}
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
                    {isNb ? "Utløper" : "Expires"}: {cert.expiry}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Generelle dokumenter, avtaler og bevis." : "General documents, agreements and evidence."}
            </p>
            <Button size="sm" className="gap-1.5">
              <Upload className="h-4 w-4" />
              {isNb ? "Last opp" : "Upload"}
            </Button>
          </div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type} · {isNb ? "Oppdatert" : "Updated"} {doc.updated}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {doc.status === "active" ? (isNb ? "Aktiv" : "Active") : (isNb ? "Utkast" : "Draft")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
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

export default TrustCenterEvidence;
