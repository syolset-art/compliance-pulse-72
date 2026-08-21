import { useNavigate } from "react-router-dom";
import { Truck, Eye, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACCESS_ROLES = [
  {
    icon: Truck,
    name: "Leverandøransvarlig",
    access: "Skrivetilgang",
    variant: "default" as const,
    desc: "Tredjepartsstyring, DPA-oppfølging og leverandørvurderinger",
  },
  {
    icon: Pencil,
    name: "Compliance-ansvarlig",
    access: "Skrivetilgang",
    variant: "default" as const,
    desc: "Kan endre krav, dokumentasjon og status på leverandører",
  },
  {
    icon: Eye,
    name: "Medlem",
    access: "Lesetilgang",
    variant: "secondary" as const,
    desc: "Se leverandørprofil, dokumenter og status",
  },
];

/** Skrivebeskyttet oversikt over hvem som har tilgang til leverandørmodulen. */
export function VendorAccessSettingsSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Oversikt over hvilke roller som har skrive- og lesetilgang til leverandørmodulen.
        Tilgang administreres sentralt i tilgangsstyringen.
      </p>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {ACCESS_ROLES.map((role) => (
            <div key={role.name} className="flex items-start gap-3 p-4">
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <role.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{role.name}</span>
                  <Badge variant={role.variant} className="text-[11px]">
                    {role.access}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{role.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/admin/access")}>
        <ExternalLink className="h-4 w-4" />
        Administrer tilgang
      </Button>
    </div>
  );
}
