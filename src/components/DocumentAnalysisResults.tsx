import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, Building2, FileText, Shield } from "lucide-react";

interface Supplier {
  name: string;
  type: string;
  dataProcessing: boolean;
  hasDPA?: boolean;
  certifications?: string[];
}

interface Contract {
  type: string;
  supplier: string;
  expiryDate?: string;
  status: string;
}

interface ComplianceGap {
  area: string;
  severity: "low" | "medium" | "high";
  description: string;
  recommendation: string;
}

interface DocumentAnalysis {
  suppliers: Supplier[];
  contracts: Contract[];
  complianceGaps: ComplianceGap[];
  summary: string;
}

interface Props {
  analysis: DocumentAnalysis;
  fileName: string;
}

export default function DocumentAnalysisResults({ analysis, fileName }: Props) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <XCircle className="w-4 h-4" />;
      case "medium": return <AlertTriangle className="w-4 h-4" />;
      case "low": return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Analyse av {fileName}</h3>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <Alert>
          <AlertDescription>{analysis.summary}</AlertDescription>
        </Alert>
      )}

      {/* Suppliers */}
      {analysis.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Leverandører/Systemer ({analysis.suppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.suppliers.map((supplier, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-accent/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{supplier.type}</p>
                    </div>
                    <div className="flex gap-1">
                      {supplier.dataProcessing && (
                        <Badge variant="outline" className="text-xs">Persondata</Badge>
                      )}
                      {supplier.hasDPA && (
                        <Badge variant="secondary" className="text-xs">DPA ✓</Badge>
                      )}
                    </div>
                  </div>
                  {supplier.certifications && supplier.certifications.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {supplier.certifications.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          🛡️ {cert}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts */}
      {analysis.contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Avtaler ({analysis.contracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.contracts.map((contract, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-accent/30 rounded">
                  <div>
                    <p className="text-sm font-medium">{contract.type}</p>
                    <p className="text-xs text-muted-foreground">{contract.supplier}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contract.expiryDate && (
                      <span className="text-xs text-muted-foreground">{contract.expiryDate}</span>
                    )}
                    <Badge variant={contract.status === "Active" ? "secondary" : "outline"} className="text-xs">
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Gaps */}
      {analysis.complianceGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Compliance-gap ({analysis.complianceGaps.length})
            </CardTitle>
            <CardDescription>Mangler og forbedringsområder identifisert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.complianceGaps.map((gap, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3 mb-2">
                    <Badge variant={getSeverityColor(gap.severity)} className="mt-0.5">
                      {getSeverityIcon(gap.severity)}
                      <span className="ml-1 capitalize">{gap.severity}</span>
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{gap.area}</p>
                      <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                    </div>
                  </div>
                  <div className="ml-[70px] p-2 bg-primary/5 rounded text-xs">
                    <p className="font-medium mb-1">💡 Anbefaling:</p>
                    <p className="text-muted-foreground">{gap.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
