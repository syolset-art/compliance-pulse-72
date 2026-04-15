import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificatesTabProps {
  assetId: string;
}

const DEMO_CERTIFICATES = [
  {
    id: "1",
    name: "ISO 27001:2022",
    issuer: "DNV GL",
    status: "valid" as const,
    issuedDate: "2024-03-15",
    expiryDate: "2027-03-15",
    scope: "Informasjonssikkerhetsstyring",
  },
  {
    id: "2",
    name: "ISO 9001:2015",
    issuer: "Bureau Veritas",
    status: "expiring" as const,
    issuedDate: "2022-06-01",
    expiryDate: "2025-06-01",
    scope: "Kvalitetsstyringssystem",
  },
  {
    id: "3",
    name: "SOC 2 Type II",
    issuer: "Deloitte",
    status: "valid" as const,
    issuedDate: "2024-09-01",
    expiryDate: "2025-09-01",
    scope: "Security, Availability, Confidentiality",
  },
];

export function CertificatesTab({ assetId }: CertificatesTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const getStatusBadge = (status: "valid" | "expiring" | "expired") => {
    switch (status) {
      case "valid":
        return (
          <Badge className="bg-success/15 text-success border-success/30 text-[13px] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {isNb ? "Gyldig" : "Valid"}
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px] gap-1">
            <AlertTriangle className="h-3 w-3" />
            {isNb ? "Utløper snart" : "Expiring soon"}
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[13px] gap-1">
            <AlertTriangle className="h-3 w-3" />
            {isNb ? "Utløpt" : "Expired"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {isNb ? "Sertifikater" : "Certificates"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isNb
              ? "Oversikt over sertifiseringer og attester"
              : "Overview of certifications and attestations"}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {isNb ? "Legg til sertifikat" : "Add certificate"}
        </Button>
      </div>

      <div className="grid gap-3">
        {DEMO_CERTIFICATES.map((cert) => (
          <Card key={cert.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cert.name}</p>
                    {getStatusBadge(cert.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                  <p className="text-xs text-muted-foreground">{cert.scope}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {isNb ? "Utløper" : "Expires"}: {cert.expiryDate}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
