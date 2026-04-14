import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Server, Globe, Trash2, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TrustCenterProducts = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"saas" | "service">("saas");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Get the organization's self-asset
  const { data: selfAsset, isLoading: loadingSelf } = useQuery({
    queryKey: ["self-asset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch service assets linked to the self-asset
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["org-services", selfAsset?.id],
    enabled: !!selfAsset?.id,
    queryFn: async () => {
      const { data: rels, error: relError } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", selfAsset!.id)
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
    if (!newName.trim() || !selfAsset?.id) return;
    setSaving(true);

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
      toast.error("Kunne ikke opprette profil");
      setSaving(false);
      return;
    }

    const { error: relError } = await supabase.from("asset_relationships").insert({
      source_asset_id: selfAsset.id,
      target_asset_id: newAsset.id,
      relationship_type: "service_of",
      description: `Service of ${selfAsset.name}`,
    });

    if (relError) {
      toast.error("Kunne ikke koble tjenesten");
      setSaving(false);
      return;
    }

    toast.success("Trust Profile opprettet");
    queryClient.invalidateQueries({ queryKey: ["org-services", selfAsset.id] });
    setNewName("");
    setNewDesc("");
    setNewType("saas");
    setDialogOpen(false);
    setSaving(false);
  };

  const handleRemove = async (serviceId: string) => {
    if (!selfAsset?.id) return;
    const { error } = await supabase
      .from("asset_relationships")
      .delete()
      .eq("source_asset_id", selfAsset.id)
      .eq("target_asset_id", serviceId)
      .eq("relationship_type", "service_of");

    if (error) {
      toast.error("Kunne ikke fjerne");
      return;
    }
    toast.success("Tjeneste fjernet");
    queryClient.invalidateQueries({ queryKey: ["org-services", selfAsset.id] });
  };

  const isLoading = loadingSelf || loadingServices;

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Products & Services
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Opprett og administrer Trust Profiler for dine produkter og tjenester som deles med kunder.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Ny profil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett Trust Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  placeholder="F.eks. Mynder Platform"
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
                    <SelectItem value="saas">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        SaaS Trust Profile
                      </div>
                    </SelectItem>
                    <SelectItem value="service">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        Service Trust Profile
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newType === "saas"
                    ? "For skybaserte produkter og plattformer. Vis compliance, datahåndtering og oppetid."
                    : "For konsulenttjenester, driftstjenester og rådgivning. Dokumenter kompetanse og sertifiseringer."}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  placeholder="Kort beskrivelse av produktet eller tjenesten"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newName.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Oppretter...
                  </>
                ) : (
                  "Opprett profil"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">SaaS Trust Profile</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                For skybaserte produkter og plattformer. Vis compliance, datahåndtering og oppetid.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setNewType("saas");
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Opprett SaaS-profil
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mb-3">
                <Server className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Service Trust Profile</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                For konsulenttjenester, driftstjenester og rådgivning. Dokumenter kompetanse og sertifiseringer.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setNewType("service");
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Opprett tjenesteprofil
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="group hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate(`/trust-center/profile/${svc.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {svc.asset_type === "saas" ? (
                        <Globe className="h-5 w-5 text-primary" />
                      ) : (
                        <Server className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(svc.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
                      {svc.publish_mode === "public" ? "Publisert" : "Utkast"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    <ExternalLink className="h-3 w-3" />
                    Åpne
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new card */}
          <Card
            className="border-dashed cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Legg til ny profil</p>
            </CardContent>
          </Card>
        </div>
      )}
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

export default TrustCenterProducts;
