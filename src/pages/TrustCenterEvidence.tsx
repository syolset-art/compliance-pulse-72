import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, ExternalLink, Award, Calendar, CheckCircle2, AlertTriangle, Upload, FolderOpen, Loader2, Eye, EyeOff, Lock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddEvidenceDialog } from "@/components/trust-center/AddEvidenceDialog";
import { toast } from "sonner";

const policyTypes = ["policy", "privacy_policy", "acceptable_use", "incident_response", "security_policy", "data_protection_policy"];
const certTypes = ["certification"];

const docTypeLabel = (type: string, isNb: boolean): string => {
  const map: Record<string, [string, string]> = {
    policy: ["Retningslinje", "Policy"],
    privacy_policy: ["Personvernerklæring", "Privacy Policy"],
    acceptable_use: ["Akseptabel bruk", "Acceptable Use"],
    incident_response: ["Hendelseshåndtering", "Incident Response"],
    security_policy: ["Sikkerhetspolicy", "Security Policy"],
    data_protection_policy: ["Databeskyttelsespolicy", "Data Protection Policy"],
    certification: ["Sertifisering", "Certification"],
    agreement: ["Avtale", "Agreement"],
    report: ["Rapport", "Report"],
    evidence: ["Bevis", "Evidence"],
    other: ["Annet", "Other"],
  };
  const pair = map[type];
  if (pair) return isNb ? pair[0] : pair[1];
  return type;
};

const getStatusBadge = (status: string | null, isNb: boolean) => {
  switch (status) {
    case "verified":
      return <Badge className="bg-success/15 text-success border-success/30 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />{isNb ? "Verifisert" : "Verified"}</Badge>;
    case "expiring":
      return <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />{isNb ? "Utløper snart" : "Expiring"}</Badge>;
    case "expired":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />{isNb ? "Utløpt" : "Expired"}</Badge>;
    case "pending":
      return <Badge variant="secondary" className="text-[10px]">{isNb ? "Venter" : "Pending"}</Badge>;
    case "draft":
      return <Badge variant="secondary" className="text-[10px]">{isNb ? "Utkast" : "Draft"}</Badge>;
    default:
      return status ? <Badge variant="outline" className="text-[10px]">{status}</Badge> : null;
  }
};
const getVisibilityIcon = (visibility: string | null) => {
  switch (visibility) {
    case "published":
      return <Eye className="h-3.5 w-3.5 text-success" />;
    case "hidden":
      return <Lock className="h-3.5 w-3.5 text-warning" />;
    default:
      return <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const seedDemoEvidence = async (assetId: string) => {
  const now = new Date();
  const demoRows = [
    // Policies
    { asset_id: assetId, document_type: "privacy_policy", file_name: "personvernpolicy-2024.pdf", file_path: "demo/personvernpolicy-2024.pdf", display_name: "Personvernpolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 90 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "security_policy", file_name: "infosec-policy-v3.pdf", file_path: "demo/infosec-policy-v3.pdf", display_name: "Informasjonssikkerhetspolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 120 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "acceptable_use", file_name: "akseptabel-bruk.pdf", file_path: "demo/akseptabel-bruk.pdf", display_name: "Akseptabel bruk-policy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 60 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "incident_response", file_name: "hendelsesplan-v2.pdf", file_path: "demo/hendelsesplan-v2.pdf", display_name: "Hendelseshåndteringsplan", status: "draft", visibility: "hidden", category: "policy", created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "data_protection_policy", file_name: "databeskyttelse-policy.pdf", file_path: "demo/databeskyttelse-policy.pdf", display_name: "Databeskyttelsespolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 200 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "policy", file_name: "generell-it-policy.pdf", file_path: "demo/generell-it-policy.pdf", display_name: "Generell IT-policy", status: "pending", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 7 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "iso27001-sertifikat.pdf", file_path: "demo/iso27001-sertifikat.pdf", display_name: "ISO 27001:2022", status: "verified", visibility: "published", category: "certification", expiry_date: new Date(now.getTime() + 300 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 180 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "soc2-type2-report.pdf", file_path: "demo/soc2-type2-report.pdf", display_name: "SOC 2 Type II", status: "verified", visibility: "published", category: "certification", expiry_date: new Date(now.getTime() + 180 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 150 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "cyber-essentials-plus.pdf", file_path: "demo/cyber-essentials-plus.pdf", display_name: "Cyber Essentials Plus", status: "expiring", visibility: "published", category: "certification", expiry_date: new Date(now.getTime() + 20 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 340 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "agreement", file_name: "databehandleravtale-2024.pdf", file_path: "demo/databehandleravtale-2024.pdf", display_name: "Databehandleravtale", status: "verified", visibility: "published", category: "document", created_at: new Date(now.getTime() - 45 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "report", file_name: "risikovurdering-q1.pdf", file_path: "demo/risikovurdering-q1.pdf", display_name: "Risikovurderingsrapport Q1 2025", status: "verified", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "evidence", file_name: "pentest-rapport-2025.pdf", file_path: "demo/pentest-rapport-2025.pdf", display_name: "Penetrasjonstestrapport", status: "pending", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "other", file_name: "beredskapsplan.pdf", file_path: "demo/beredskapsplan.pdf", display_name: "Beredskapsplan", status: "draft", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 5 * 86400000).toISOString() },
  ];
  const { error } = await supabase.from("vendor_documents").insert(demoRows);
  if (error) throw error;
};

const TrustCenterEvidence = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const { data: asset } = useQuery({
    queryKey: ["self-asset-evidence"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "self")
        .maybeSingle();
      return data;
    },
  });

  const { data: vendorDocs = [], isLoading } = useQuery({
    queryKey: ["vendor-documents-evidence", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, status, created_at, expiry_date, display_name, category, visibility")
        .eq("asset_id", asset!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const policies = vendorDocs.filter((d: any) => policyTypes.includes(d.document_type));
  const certifications = vendorDocs.filter((d: any) => certTypes.includes(d.document_type));
  const documents = vendorDocs.filter((d: any) => !policyTypes.includes(d.document_type) && !certTypes.includes(d.document_type));

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            {isNb ? "Dokumentasjon & Evidens" : "Documentation & Evidence"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {isNb
              ? "Samlet oversikt over retningslinjer, sertifiseringer og dokumenter som underbygger organisasjonens compliance."
              : "Overview of policies, certifications and documents supporting your organization's compliance."}
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {isNb ? "Legg til" : "Add"}
        </Button>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="policies">
            {isNb ? "Retningslinjer" : "Policies"}
            {policies.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{policies.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="certifications">
            {isNb ? "Sertifiseringer" : "Certifications"}
            {certifications.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{certifications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="documents">
            {isNb ? "Dokumenter" : "Documents"}
            {documents.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{documents.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Policies */}
            <TabsContent value="policies" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Organisasjonens retningslinjer og policyer." : "Organization policies and guidelines."}
              </p>
              {policies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{isNb ? "Ingen retningslinjer registrert ennå." : "No policies registered yet."}</p>
              ) : (
                <div className="space-y-3">
                  {policies.map((doc: any) => (
                    <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.display_name || doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {docTypeLabel(doc.document_type, isNb)} · {isNb ? "Opprettet" : "Created"} {new Date(doc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status, isNb)}
                          {getVisibilityIcon(doc.visibility)}
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Certifications */}
            <TabsContent value="certifications" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Sertifiseringer, attester og godkjenninger." : "Certifications, attestations and approvals."}
              </p>
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{isNb ? "Ingen sertifiseringer registrert ennå." : "No certifications registered yet."}</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert: any) => (
                    <Card key={cert.id}>
                      <CardContent className="flex items-start justify-between py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Award className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{cert.display_name || cert.file_name}</p>
                              {getStatusBadge(cert.status, isNb)}
                              {getVisibilityIcon(cert.visibility)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isNb ? "Opprettet" : "Created"} {new Date(cert.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {cert.expiry_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Calendar className="h-3 w-3" />
                            {isNb ? "Utløper" : "Expires"}: {new Date(cert.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Generelle dokumenter, avtaler og bevis." : "General documents, agreements and evidence."}
              </p>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{isNb ? "Ingen dokumenter registrert ennå." : "No documents registered yet."}</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.display_name || doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {docTypeLabel(doc.document_type, isNb)} · {isNb ? "Opprettet" : "Created"} {new Date(doc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status, isNb)}
                          {getVisibilityIcon(doc.visibility)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
      {asset?.id && <AddEvidenceDialog open={dialogOpen} onOpenChange={setDialogOpen} assetId={asset.id} />}
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
