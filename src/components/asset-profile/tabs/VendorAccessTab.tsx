import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Shield, UserPlus, Info, Crown, ClipboardCheck, Truck, MonitorCog, Lock, Bot, User } from "lucide-react";
import { ROLE_LABELS, type AppRole } from "@/hooks/useUserRole";

interface AccessEntry {
  name: string;
  email: string;
  role: AppRole;
  level: "read" | "write";
}

const DEMO_ACCESS: AccessEntry[] = [
  { name: "Kari Nordmann", email: "kari@helse-vest.no", role: "compliance_ansvarlig", level: "write" },
  { name: "Ola Hansen", email: "ola@helse-vest.no", role: "vendor_manager", level: "write" },
  { name: "Per Johansen", email: "per@helse-vest.no", role: "it_manager", level: "write" },
  { name: "Lise Berg", email: "lise@helse-vest.no", role: "sikkerhetsansvarlig", level: "write" },
  { name: "Erik Dahl", email: "erik@helse-vest.no", role: "daglig_leder", level: "read" },
  { name: "Maria Solberg", email: "maria@helse-vest.no", role: "personvernombud", level: "read" },
  { name: "Thomas Vik", email: "thomas@helse-vest.no", role: "internal_auditor", level: "read" },
  { name: "Anna Strand", email: "anna@helse-vest.no", role: "ai_governance", level: "read" },
  { name: "Jonas Lie", email: "jonas@helse-vest.no", role: "operativ_bruker", level: "read" },
];

const ROLE_ICON_MAP: Partial<Record<AppRole, React.ReactNode>> = {
  compliance_ansvarlig: <ClipboardCheck className="h-3.5 w-3.5" />,
  vendor_manager: <Truck className="h-3.5 w-3.5" />,
  it_manager: <MonitorCog className="h-3.5 w-3.5" />,
  sikkerhetsansvarlig: <Lock className="h-3.5 w-3.5" />,
  daglig_leder: <Crown className="h-3.5 w-3.5" />,
  personvernombud: <Shield className="h-3.5 w-3.5" />,
  internal_auditor: <Eye className="h-3.5 w-3.5" />,
  ai_governance: <Bot className="h-3.5 w-3.5" />,
  operativ_bruker: <User className="h-3.5 w-3.5" />,
};

function AccessList({ entries, icon, emptyText }: { entries: AccessEntry[]; icon: React.ReactNode; emptyText: string }) {
  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground italic">{emptyText}</p>
      )}
      {entries.map((entry) => (
        <div key={entry.email} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-border/50">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {entry.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{entry.name}</div>
            <div className="text-xs text-muted-foreground truncate">{entry.email}</div>
          </div>
          <Badge variant="secondary" className="text-xs gap-1 shrink-0">
            {ROLE_ICON_MAP[entry.role] || icon}
            {ROLE_LABELS[entry.role]}
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface VendorAccessTabProps {
  assetId: string;
  assetName: string;
}

export function VendorAccessTab({ assetId, assetName }: VendorAccessTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const readers = DEMO_ACCESS.filter(e => e.level === "read");
  const writers = DEMO_ACCESS.filter(e => e.level === "write");

  return (
    <div className="space-y-5">
      {/* Info box */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isNb
            ? "Tilgangsnivåer styrer hvem som kan se og hvem som kan gjøre endringer på denne leverandøren. «Kan utføre» gir rettigheter til å redigere, opprette oppgaver, laste opp dokumenter og endre status."
            : "Access levels control who can view and who can make changes to this vendor. 'Can execute' grants rights to edit, create tasks, upload documents, and change status."}
        </p>
      </div>

      {/* Write access */}
      <Card variant="flat">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              {isNb ? "Kan utføre" : "Can execute"}
              <Badge variant="secondary" className="text-xs">{writers.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              {isNb ? "Legg til" : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isNb ? "Kan redigere, opprette oppgaver, laste opp dokumenter og endre status" : "Can edit, create tasks, upload documents, and change status"}
          </p>
        </CardHeader>
        <CardContent>
          <AccessList entries={writers} icon={<Pencil className="h-3.5 w-3.5" />} emptyText={isNb ? "Ingen med skrivetilgang" : "No write access"} />
        </CardContent>
      </Card>

      {/* Read access */}
      <Card variant="flat">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {isNb ? "Kan se" : "Can view"}
              <Badge variant="secondary" className="text-xs">{readers.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              {isNb ? "Legg til" : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isNb ? "Kan se leverandørprofil, dokumenter og status — men ikke gjøre endringer" : "Can view vendor profile, documents and status — but cannot make changes"}
          </p>
        </CardHeader>
        <CardContent>
          <AccessList entries={readers} icon={<Eye className="h-3.5 w-3.5" />} emptyText={isNb ? "Ingen med lesetilgang" : "No read access"} />
        </CardContent>
      </Card>
    </div>
  );
}
