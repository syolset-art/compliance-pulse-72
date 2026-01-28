import { CheckCircle2, Mail, Key, RefreshCw, XCircle, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AuditLogEntry {
  id: string;
  action: "created" | "invite_sent" | "invite_accepted" | "api_key_added" | "synced" | "revoked" | "updated";
  performedByEmail: string;
  performedByName: string;
  performedByRole: string;
  performedByOrganization?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

interface IntegrationAuditLogProps {
  entries: AuditLogEntry[];
  integrationName: string;
}

const actionLabels: Record<AuditLogEntry["action"], string> = {
  created: "Integrasjon opprettet",
  invite_sent: "Invitasjon sendt",
  invite_accepted: "Invitasjon akseptert",
  api_key_added: "API-nøkkel lagt til",
  synced: "Synkronisering fullført",
  revoked: "Tilgang trukket tilbake",
  updated: "Integrasjon oppdatert",
};

const actionIcons: Record<AuditLogEntry["action"], typeof CheckCircle2> = {
  created: CheckCircle2,
  invite_sent: Mail,
  invite_accepted: User,
  api_key_added: Key,
  synced: RefreshCw,
  revoked: XCircle,
  updated: RefreshCw,
};

const roleLabels: Record<string, string> = {
  owner: "Eier",
  it_provider: "IT-leverandør",
  accountant: "Regnskapsfører",
  internal_it: "Intern IT-ansvarlig",
};

export function IntegrationAuditLog({ entries, integrationName }: IntegrationAuditLogProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p>Ingen aktivitet logget ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Revisjonslogg for {integrationName}</h3>
        <span className="text-xs text-muted-foreground">{entries.length} hendelser</span>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[17px] top-6 bottom-6 w-px bg-border" />

          <div className="space-y-4">
            {entries.map((entry, index) => {
              const Icon = actionIcons[entry.action];
              const isFirst = index === 0;
              const isLast = index === entries.length - 1;

              return (
                <div key={entry.id} className="relative flex gap-4">
                  <div
                    className={cn(
                      "relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                      entry.action === "revoked"
                        ? "bg-destructive/20"
                        : entry.action === "api_key_added" || entry.action === "synced"
                        ? "bg-green-500/20"
                        : "bg-primary/20"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        entry.action === "revoked"
                          ? "text-destructive"
                          : entry.action === "api_key_added" || entry.action === "synced"
                          ? "text-green-500"
                          : "text-primary"
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{actionLabels[entry.action]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Utført av:</span>
                        <span className="font-medium">{entry.performedByName}</span>
                        <span className="text-muted-foreground">({entry.performedByEmail})</span>
                      </div>
                      {entry.performedByOrganization && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Organisasjon:</span>
                          <span>{entry.performedByOrganization}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Rolle:</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {roleLabels[entry.performedByRole] || entry.performedByRole}
                        </span>
                      </div>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div className="pt-2 border-t border-border mt-2">
                          <p className="text-xs text-muted-foreground">
                            {JSON.stringify(entry.details)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
