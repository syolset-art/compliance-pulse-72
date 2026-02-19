import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, Users } from "lucide-react";

const customerOrgs = [
  {
    name: "Helsereiser AS",
    contact: "Lars Hansen",
    role: "CEO",
    employees: 24,
    status: "active" as const,
    lastActivity: "for 6 timer siden",
    acceptedPolicies: ["Personvernerklæring", "Terms & Conditions"],
  },
  {
    name: "NordTech Solutions",
    contact: "Maria Johansen",
    role: "CTO",
    employees: 45,
    status: "active" as const,
    lastActivity: "for 2 dager siden",
    acceptedPolicies: ["Personvernerklæring"],
  },
  {
    name: "Fjordkraft Consulting",
    contact: "Erik Berg",
    role: "Daglig leder",
    employees: 12,
    status: "pending" as const,
    lastActivity: "for 5 dager siden",
    acceptedPolicies: [],
  },
];

export function CustomerOrganizationsTab() {
  return (
    <div className="space-y-4">
      {customerOrgs.map((org) => (
        <Card key={org.name}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{org.name}</h3>
                  <Badge variant={org.status === "active" ? "default" : "secondary"}>
                    {org.status === "active" ? "Aktiv" : "Venter"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{org.contact} ({org.role})</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org.employees} medarbeidere
                  </span>
                </div>
                {org.acceptedPolicies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {org.acceptedPolicies.map((p) => (
                      <span key={p} className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Siste aktivitet {org.lastActivity}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
