import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Bot, MapPin, Tag, Building2, CheckCircle, XCircle, X, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AddDataProcessorDialog } from "./AddDataProcessorDialog";
import { PersonalDataCard } from "./PersonalDataCard";

interface DataHandlingTabProps {
  assetId: string;
}

export const DataHandlingTab = ({ assetId }: DataHandlingTabProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [addProcessorOpen, setAddProcessorOpen] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const { data: dataHandling } = useQuery({
    queryKey: ["system-data-handling", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_data_handling")
        .select("*")
        .eq("system_id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: processors } = useQuery({
    queryKey: ["asset-data-processors", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_processors")
        .select("*")
        .eq("asset_id", assetId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const upsertDataHandling = useCallback(async (updates: Record<string, unknown>) => {
    if (dataHandling?.id) {
      const { error } = await supabase
        .from("system_data_handling")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", dataHandling.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("system_data_handling")
        .insert({ system_id: assetId, ...updates });
      if (error) throw error;
    }
    queryClient.invalidateQueries({ queryKey: ["system-data-handling", assetId] });
  }, [dataHandling, assetId, queryClient]);

  const handleAiToggle = async (checked: boolean) => {
    try {
      await upsertDataHandling({ ai_usage: checked });
      toast.success(isNb ? "AI-bruk oppdatert" : "AI usage updated");
    } catch {
      toast.error(isNb ? "Kunne ikke oppdatere" : "Could not update");
    }
  };

  const handleAiDescriptionBlur = async (value: string) => {
    if (value === (dataHandling?.ai_usage_description || "")) return;
    try {
      await upsertDataHandling({ ai_usage_description: value || null });
      toast.success(isNb ? "Beskrivelse lagret" : "Description saved");
    } catch {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
    }
  };

  const addLocation = async () => {
    const val = newLocation.trim();
    if (!val) return;
    const current = dataHandling?.data_locations || [];
    if (current.includes(val)) { setNewLocation(""); return; }
    try {
      await upsertDataHandling({ data_locations: [...current, val] });
      setNewLocation("");
      toast.success(isNb ? "Lokasjon lagt til" : "Location added");
    } catch {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
    }
  };

  const removeLocation = async (loc: string) => {
    const current = dataHandling?.data_locations || [];
    try {
      await upsertDataHandling({ data_locations: current.filter((l: string) => l !== loc) });
      toast.success(isNb ? "Lokasjon fjernet" : "Location removed");
    } catch {
      toast.error(isNb ? "Kunne ikke fjerne" : "Could not remove");
    }
  };

  const addKeyword = async () => {
    const val = newKeyword.trim();
    if (!val) return;
    const current = dataHandling?.retention_keywords || [];
    if (current.includes(val)) { setNewKeyword(""); return; }
    try {
      await upsertDataHandling({ retention_keywords: [...current, val] });
      setNewKeyword("");
      toast.success(isNb ? "Nøkkelord lagt til" : "Keyword added");
    } catch {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
    }
  };

  const removeKeyword = async (kw: string) => {
    const current = dataHandling?.retention_keywords || [];
    try {
      await upsertDataHandling({ retention_keywords: current.filter((k: string) => k !== kw) });
      toast.success(isNb ? "Nøkkelord fjernet" : "Keyword removed");
    } catch {
      toast.error(isNb ? "Kunne ikke fjerne" : "Could not remove");
    }
  };

  const deleteProcessor = async (id: string) => {
    const { error } = await supabase.from("asset_data_processors").delete().eq("id", id);
    if (error) {
      toast.error(isNb ? "Kunne ikke slette" : "Could not delete");
      return;
    }
    toast.success(isNb ? "Databehandler slettet" : "Data processor deleted");
    queryClient.invalidateQueries({ queryKey: ["asset-data-processors", assetId] });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {isNb ? "AI-bruk" : "AI Usage"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{isNb ? "Bruker AI" : "Uses AI"}</Label>
              <Switch checked={dataHandling?.ai_usage || false} onCheckedChange={handleAiToggle} />
            </div>
            <Textarea
              placeholder={isNb ? "Beskriv hvordan AI brukes..." : "Describe how AI is used..."}
              defaultValue={dataHandling?.ai_usage_description || ""}
              onBlur={(e) => handleAiDescriptionBlur(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Data Locations → Datalagring og overføring */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {isNb ? "Datalagring og overføring" : "Data Storage and Transfer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder={isNb ? "F.eks. Norge, EU, AWS Frankfurt" : "E.g. Norway, EU, AWS Frankfurt"}
                onKeyDown={(e) => e.key === "Enter" && addLocation()}
              />
              <Button variant="outline" size="sm" onClick={addLocation}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {dataHandling?.data_locations && dataHandling.data_locations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dataHandling.data_locations.map((location: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="gap-1 cursor-pointer" onClick={() => removeLocation(location)}>
                    {location}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{isNb ? "Ingen lokasjoner registrert" : "No locations registered"}</p>
            )}
          </CardContent>
        </Card>

        {/* Personal Data Categories */}
        <PersonalDataCard assetId={assetId} />

        {/* Retention Keywords → Oppbevaring og sletting */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {isNb ? "Oppbevaring og sletting" : "Retention and Deletion"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={isNb ? "F.eks. 3 år, GDPR Art. 17" : "E.g. 3 years, GDPR Art. 17"}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button variant="outline" size="sm" onClick={addKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {dataHandling?.retention_keywords && dataHandling.retention_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dataHandling.retention_keywords.map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeKeyword(keyword)}>
                    {keyword}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{isNb ? "Ingen retningslinjer definert" : "No policies defined"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Processors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isNb ? "Databehandlere / Underleverandører" : "Data Processors / Subcontractors"}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddProcessorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isNb ? "Legg til" : "Add"}
          </Button>
        </CardHeader>
        <CardContent>
          {processors && processors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isNb ? "Leverandør" : "Vendor"}</TableHead>
                  <TableHead>{isNb ? "Formål" : "Purpose"}</TableHead>
                  <TableHead>{isNb ? "EU/EØS" : "EU/EEA"}</TableHead>
                  <TableHead>{isNb ? "Kilde" : "Source"}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processors.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.purpose || "-"}</TableCell>
                    <TableCell>
                      {p.eu_eos_compliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>{p.source || "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProcessor(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">{isNb ? "Ingen leverandører registrert" : "No vendors registered"}</p>
          )}
        </CardContent>
      </Card>

      <AddDataProcessorDialog open={addProcessorOpen} onOpenChange={setAddProcessorOpen} assetId={assetId} />
    </div>
  );
};
