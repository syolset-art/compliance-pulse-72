import { useState } from "react";
import { Clock, Mail, X, RefreshCw, CheckCircle2, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PerformerRole } from "./PerformerSelectStep";

interface PendingInvite {
  email: string;
  name: string;
  organizationName?: string;
  role: PerformerRole;
  sentAt: Date;
}

interface IntegrationPendingStatusProps {
  integrationName: string;
  invite: PendingInvite;
  onSendReminder: () => void;
  onCancel: () => void;
  onIHaveKey: () => void;
}

const roleLabels: Record<PerformerRole, string> = {
  owner: "Eier",
  it_provider: "IT-leverandør",
  accountant: "Regnskapsfører",
  internal_it: "Intern IT-ansvarlig",
};

export function IntegrationPendingStatus({
  integrationName,
  invite,
  onSendReminder,
  onCancel,
  onIHaveKey,
}: IntegrationPendingStatusProps) {
  const [reminderSent, setReminderSent] = useState(false);

  const handleSendReminder = () => {
    onSendReminder();
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">Venter på {roleLabels[invite.role].toLowerCase()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invitasjon sendt til {invite.email}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">
            {invite.role === "it_provider" ? (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{integrationName}</p>
            <p className="text-sm text-muted-foreground">Status: Invitasjon sendt</p>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sendt til:</span>
            <span className="font-medium">{invite.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kontaktperson:</span>
            <span className="font-medium">{invite.name}</span>
          </div>
          {invite.organizationName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organisasjon:</span>
              <span className="font-medium">{invite.organizationName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rolle:</span>
            <span className="font-medium">{roleLabels[invite.role]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dato:</span>
            <span className="font-medium">{formatDate(invite.sentAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleSendReminder}
          disabled={reminderSent}
          className="w-full"
        >
          {reminderSent ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Sendt!
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Send påminnelse
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-2" />
          Kanseller
        </Button>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          Har du fått API-nøkkelen allerede?
        </p>
        <Button variant="link" className="px-0 h-auto mt-1" onClick={onIHaveKey}>
          Legg inn API-nøkkel selv →
        </Button>
      </div>
    </div>
  );
}
