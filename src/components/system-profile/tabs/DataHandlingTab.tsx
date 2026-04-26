import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Bot, FileText, MapPin, Tag, Building2, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataHandlingTabProps {
  systemId: string;
}

export const DataHandlingTab = ({ systemId }: DataHandlingTabProps) => {
  const { t } = useTranslation();

  const { data: dataHandling } = useQuery({
    queryKey: ["system-data-handling", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_data_handling")
        .select("*")
        .eq("system_id", systemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["system-vendors", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_vendors")
        .select("*")
        .eq("system_id", systemId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {t("trustProfile.aiUsage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={dataHandling?.ai_usage ? "default" : "secondary"}>
                {dataHandling?.ai_usage ? t("trustProfile.aiActive") : t("trustProfile.aiInactive")}
              </Badge>
              {dataHandling?.ai_usage_description && (
                <p className="text-sm text-muted-foreground">{dataHandling.ai_usage_description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("trustProfile.documents")}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("common.add")}
            </Button>
          </CardHeader>
          <CardContent>
            {dataHandling?.documents && dataHandling.documents.length > 0 ? (
              <div className="space-y-2">
                {dataHandling.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("trustProfile.noDocuments")}</p>
            )}
          </CardContent>
        </Card>

        {/* Data Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("trustProfile.dataLocations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataHandling?.data_locations && dataHandling.data_locations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dataHandling.data_locations.map((location, idx) => (
                  <Badge key={idx} variant="outline">{location}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("trustProfile.noDataLocations")}</p>
            )}
          </CardContent>
        </Card>

        {/* Retention Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t("trustProfile.retentionKeywords")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataHandling?.retention_keywords && dataHandling.retention_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dataHandling.retention_keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("trustProfile.noRetentionKeywords")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendors / Data Processors (TIA Table) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("trustProfile.vendors")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          {vendors && vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trustProfile.vendorName")}</TableHead>
                  <TableHead>{t("trustProfile.vendorPurpose")}</TableHead>
                  <TableHead>{t("trustProfile.euEos")}</TableHead>
                  <TableHead>{t("trustProfile.source")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.purpose || "-"}</TableCell>
                    <TableCell>
                      {vendor.eu_eos_compliant ? (
                        <CheckCircle className="h-4 w-4 text-status-closed" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>{vendor.source || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noVendors")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
