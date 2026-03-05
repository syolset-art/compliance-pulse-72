import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Server, Globe, Settings, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ServiceProfile {
  id: string;
  name: string;
  type: "saas" | "service";
  description: string;
  status: "draft" | "published";
  complianceScore: number;
}

const DEMO_SERVICES: ServiceProfile[] = [
  {
    id: "svc-1",
    name: "Mynder Platform",
    type: "saas",
    description: "Compliance- og styringsplattform for GDPR, ISO 27001 og NIS2",
    status: "published",
    complianceScore: 78,
  },
  {
    id: "svc-2",
    name: "Mynder Rådgivning",
    type: "service",
    description: "Rådgivningstjenester innen informasjonssikkerhet og personvern",
    status: "draft",
    complianceScore: 0,
  },
];

interface OrganizationServicesPanelProps {
  organizationName: string;
  assetId: string;
}

export function OrganizationServicesPanel({ organizationName, assetId }: OrganizationServicesPanelProps) {
  const [services, setServices] = useState<ServiceProfile[]>(DEMO_SERVICES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"saas" | "service">("saas");
  const [newDesc, setNewDesc] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    setServices((prev) => [
      ...prev,
      {
        id: `svc-${Date.now()}`,
        name: newName,
        type: newType,
        description: newDesc,
        status: "draft",
        complianceScore: 0,
      },
    ]);
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
  };

  const handleRemove = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">
            Trust Profiler for produkter og tjenester under {organizationName}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Ny tjenesteprofil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett Service Trust Profile</DialogTitle>
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
                    <SelectItem value="saas">SaaS Trust Profile</SelectItem>
                    <SelectItem value="service">Service Trust Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  placeholder="Kort beskrivelse av produktet eller tjenesten"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Opprett
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Ingen tjenesteprofiler ennå</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Opprett en Service Trust Profile for å dokumentere compliance for dine produkter og tjenester.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((svc) => (
            <Card key={svc.id} className="group hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {svc.type === "saas" ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <Server className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(svc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={svc.type === "saas" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {svc.type === "saas" ? "SaaS" : "Service"}
                    </Badge>
                    <Badge
                      variant={svc.status === "published" ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {svc.status === "published" ? "Publisert" : "Utkast"}
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
        </div>
      )}
    </div>
  );
}
