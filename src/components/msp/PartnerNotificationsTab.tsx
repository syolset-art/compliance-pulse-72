import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Info, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  PARTNER_NOTIFICATION_EVENTS,
  PARTNER_NOTIFICATIONS_DIGEST_KEY,
  PARTNER_NOTIFICATIONS_MASTER_KEY,
} from "@/lib/partnerNotificationEvents";

const LOCAL_KEY = "partner-notification-prefs-v1";

const defaultPrefs = (): Record<string, boolean> => {
  const base: Record<string, boolean> = {
    [PARTNER_NOTIFICATIONS_MASTER_KEY]: true,
    [PARTNER_NOTIFICATIONS_DIGEST_KEY]: false,
  };
  PARTNER_NOTIFICATION_EVENTS.forEach((e) => {
    base[e.key] = true;
  });
  return base;
};

export function PartnerNotificationsTab() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaultPrefs);

  // Last lagrede valg — fra databasen når brukeren er innlogget, ellers lokalt.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("notification_preferences")
          .select("notification_type, enabled")
          .eq("user_id", user.id)
          .like("notification_type", "partner.%");
        if (cancelled || !data) return;
        setPrefs((prev) => {
          const next = { ...prev };
          data.forEach((row: any) => {
            next[row.notification_type] = row.enabled;
          });
          return next;
        });
        return;
      }
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw && !cancelled) setPrefs({ ...defaultPrefs(), ...JSON.parse(raw) });
      } catch {
        /* noop */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const save = async (key: string, enabled: boolean) => {
    const next = { ...prefs, [key]: enabled };
    setPrefs(next);

    if (!user?.id) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      toast.success("Varslingsvalg lagret");
      return;
    }

    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .eq("notification_type", key)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("notification_preferences").update({ enabled }).eq("id", existing.id)
      : await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id, notification_type: key, enabled });

    if (error) {
      toast.error("Kunne ikke lagre varslingsvalget");
      setPrefs(prefs);
      return;
    }
    toast.success("Varslingsvalg lagret");
  };

  const masterOn = prefs[PARTNER_NOTIFICATIONS_MASTER_KEY];
  const email = user?.email;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Varsler på e-post</h2>
            <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              Varsler sendes til{" "}
              <span className="font-medium text-foreground">
                {email ?? "e-postadressen du er registrert med"}
              </span>
              . Vil du endre adressen, gjør du det i{" "}
              <Link to="/settings" className="underline underline-offset-2">
                profilen din
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-foreground">Send meg varsler</p>
            <p className="text-xs text-muted-foreground">
              Skru av for å bare se aktiviteter inne i Mynder.
            </p>
          </div>
          <Switch
            checked={masterOn}
            onCheckedChange={(v) => save(PARTNER_NOTIFICATIONS_MASTER_KEY, v)}
            aria-label="Send meg varsler"
          />
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hva vil du varsles om?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hendelsene under er de samme aktivitetene vi logger på kundene dine.
          </p>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {PARTNER_NOTIFICATION_EVENTS.map(({ key, label, description, Icon }) => (
            <div key={key} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={masterOn && prefs[key]}
                disabled={!masterOn}
                onCheckedChange={(v) => save(key, v)}
                aria-label={label}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-foreground">Daglig oppsummering</p>
            <p className="text-xs text-muted-foreground">
              Av: du får varsel straks noe skjer. På: én samlet e-post hver dag.
            </p>
          </div>
          <Switch
            checked={prefs[PARTNER_NOTIFICATIONS_DIGEST_KEY]}
            disabled={!masterOn}
            onCheckedChange={(v) => save(PARTNER_NOTIFICATIONS_DIGEST_KEY, v)}
            aria-label="Daglig oppsummering"
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Du får bare varsler for kunder du er kundeansvarlig eller driftspartner for — ikke hele
            porteføljen. Valgene gjelder deg som bruker.
          </span>
        </div>
      </Card>
    </div>
  );
}
