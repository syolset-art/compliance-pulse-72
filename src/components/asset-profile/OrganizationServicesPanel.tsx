import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Server, Globe, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OrganizationServicesPanelProps {
  organizationName: string;
  assetId: string;
}

export function OrganizationServicesPanel({ organizationName, assetId }: OrganizationServicesPanelProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"saas" | "service">("saas");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch service assets linked to this organization
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["org-services", assetId],
    queryFn: async () => {
      // Get relationships where this org is the source
      const { data: rels, error: relError } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", assetId)
        .eq("relationship_type", "service_of");
      if (relError) throw relError;
      if (!rels || rels.length === 0) return [];

      const ids = rels.map((r) => r.target_asset_id);
      const { data: assets, error } = await supabase
        .from("assets")
        .select("id, name, description, asset_type, publish_mode, compliance_score")
        .in("id", ids);
      if (error) throw error;
      return assets || [];
    },
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    // Create asset
    const { data: newAsset, error: assetError } = await supabase
      .from("assets")
      .insert({
        name: newName.trim(),
        asset_type: newType,
        description: newDesc.trim() || null,
        publish_mode: "private",
      })
      .select("id")
      .single();

    if (assetError) {
      toast.error(isNb ? "Kunne ikke opprette tjenesteprofil" : "Could not create service profile");
      setSaving(false);
      return;
    }

    // Create relationship
    const { error: relError } = await supabase.from("asset_relationships").insert({
      source_asset_id: assetId,
      target_asset_id: newAsset.id,
      relationship_type: "service_of",
      description: `Service of ${organizationName}`,
    });

    if (relError) {
      toast.error(isNb ? "Kunne ikke koble tjenesten" : "Could not link service");
      setSaving(false);
      return;
    }

    toast.success(isNb ? "Tjenesteprofil opprettet" : "Service profile created");
    queryClient.invalidateQueries({ queryKey: ["org-services", assetId] });
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
    setSaving(false);
  };

  const handleRemove = async (serviceId: string) => {
    const { error } = await supabase
      .from("asset_relationships")
      .delete()
      .eq("source_asset_id", assetId)
      .eq("target_asset_id", serviceId)
      .eq("relationship_type", "service_of");

    if (error) {
      toast.error(isNb ? "Kunne ikke fjerne" : "Could not remove");
      return;
    }
    toast.success(isNb ? "Tjeneste fjernet" : "Service removed");
    queryClient.invalidateQueries({ queryKey: ["org-services", assetId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">
            {isNb
              ? `Trust Profiler for produkter og tjenester under ${organizationName}`
              : `Trust Profiles for products and services under ${organizationName}`}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isNb ? "Ny tjenesteprofil" : "New service profile"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isNb ? "Opprett Service Trust Profile" : "Create Service Trust Profile"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{isNb ? "Navn" : "Name"}</Label>
                <Input
                  placeholder={isNb ? "F.eks. Mynder Platform" : "E.g. My Platform"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as "saas" | "service")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS Trust Profile</SelectItem>
                    <SelectItem value="service">Service Trust Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isNb ? "Beskrivelse" : "Description"}</Label>
                <Textarea
                  placeholder={isNb ? "Kort beskrivelse av produktet eller tjenesten" : "Brief description of the product or service"}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newName.trim() || saving}>
                {isNb ? "Opprett" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">
              {isNb ? "Ingen tjenesteprofiler ennå" : "No service profiles yet"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              {isNb
                ? "Opprett en Service Trust Profile for å dokumentere compliance for dine produkter og tjenester."
                : "Create a Service Trust Profile to document compliance for your products and services."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="group hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate(`/assets/${svc.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {svc.asset_type === "saas" ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <Server className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(svc.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={svc.asset_type === "saas" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {svc.asset_type === "saas" ? "SaaS" : "Service"}
                    </Badge>
                    <Badge
                      variant={svc.publish_mode === "public" ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {svc.publish_mode === "public"
                        ? isNb ? "Publisert" : "Published"
                        : isNb ? "Utkast" : "Draft"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    <ExternalLink className="h-3 w-3" />
                    {isNb ? "Åpne" : "Open"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
