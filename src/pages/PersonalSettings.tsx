import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, Shield, User, CreditCard,
  Clock, Mail, AlertTriangle, FileText, CheckCircle2,
} from "lucide-react";

const NOTIFICATION_TYPES = [
  { key: "document_expiry", labelNb: "Dokumentutløp", labelEn: "Document expiry", descNb: "Varsling når dokumenter nærmer seg utløpsdato", descEn: "Alerts when documents approach expiry date", icon: FileText },
  { key: "compliance_updates", labelNb: "Etterlevelsesoppdateringer", labelEn: "Compliance updates", descNb: "Varsling om endringer i regelverk og krav", descEn: "Alerts about changes in regulations", icon: Shield },
  { key: "task_reminders", labelNb: "Oppgavepåminnelser", labelEn: "Task reminders", descNb: "Påminnelser om kommende og forfalt oppgaver", descEn: "Reminders about upcoming and overdue tasks", icon: Clock },
  { key: "deviation_alerts", labelNb: "Avviksvarsler", labelEn: "Deviation alerts", descNb: "Varsling når nye avvik rapporteres", descEn: "Alerts when new deviations are reported", icon: AlertTriangle },
  { key: "email_digest", labelNb: "E-postsammendrag", labelEn: "Email digest", descNb: "Ukentlig sammendrag på e-post", descEn: "Weekly summary by email", icon: Mail },
];

export default function PersonalSettings() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
  }, []);

  // Fetch notification preferences
  const { data: notifPrefs = [] } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role, is_primary")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch company profile for membership info
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("company_profile").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ["company-subscription"],
    queryFn: async () => {
      if (!companyProfile?.id) return null;
      const { data } = await supabase
        .from("company_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("company_id", companyProfile.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!companyProfile?.id,
  });

  const toggleNotif = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      const existing = notifPrefs.find((p: any) => p.notification_type === type);
      if (existing) {
        await supabase
          .from("notification_preferences")
          .update({ enabled })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("notification_preferences")
          .insert({ user_id: user!.id, notification_type: type, enabled });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast.success(isNb ? "Varslingsinnstillinger oppdatert" : "Notification settings updated");
    },
  });

  const isNotifEnabled = (type: string) => {
    const pref = notifPrefs.find((p: any) => p.notification_type === type);
    return pref ? pref.enabled : true; // default enabled
  };

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString(isNb ? "nb-NO" : "en-GB", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "–";

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleString(isNb ? "nb-NO" : "en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "–";

  const roleLabels: Record<string, { nb: string; en: string }> = {
    admin: { nb: "Administrator", en: "Administrator" },
    user: { nb: "Bruker", en: "User" },
    moderator: { nb: "Moderator", en: "Moderator" },
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 pt-11">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isNb ? "Innstillinger" : "Settings"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isNb ? "Personlige innstillinger, varsler og kontoinformasjon" : "Personal settings, notifications and account info"}
              </p>
            </div>
          </div>

          {/* ── Account Info ── */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isNb ? "Kontoinformasjon" : "Account Information"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isNb ? "E-post" : "Email"}</p>
                  <p className="text-sm font-medium text-foreground">{user?.email || "–"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isNb ? "Sist innlogget" : "Last signed in"}</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {lastSignIn}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isNb ? "Konto opprettet" : "Account created"}</p>
                  <p className="text-sm font-medium text-foreground">{createdAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isNb ? "Organisasjon" : "Organization"}</p>
                  <p className="text-sm font-medium text-foreground">{companyProfile?.name || "–"}</p>
                </div>
              </div>

              {/* Roles */}
              {userRoles.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{isNb ? "Roller" : "Roles"}</p>
                    <div className="flex flex-wrap gap-2">
                      {userRoles.map((r: any) => (
                        <Badge key={r.role} variant={r.is_primary ? "default" : "secondary"} className="text-xs">
                          {roleLabels[r.role]?.[isNb ? "nb" : "en"] || r.role}
                          {r.is_primary && (
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Membership ── */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isNb ? "Medlemskap" : "Membership"}
                </h2>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(subscription as any)?.subscription_plans?.name || (isNb ? "Gratis" : "Free")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subscription?.current_period_end
                      ? `${isNb ? "Gyldig til" : "Valid until"} ${new Date(subscription.current_period_end).toLocaleDateString(isNb ? "nb-NO" : "en-GB")}`
                      : isNb ? "Ingen aktiv betalingsplan" : "No active payment plan"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/subscriptions")}>
                  {isNb ? "Se abonnement" : "View subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Notifications ── */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isNb ? "Varslingsinnstillinger" : "Notification Settings"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Velg hvilke varsler du ønsker å motta. Du kan endre dette når som helst."
                  : "Choose which notifications you want to receive. You can change this at any time."}
              </p>

              <div className="space-y-3">
                {NOTIFICATION_TYPES.map((nt) => (
                  <div key={nt.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <nt.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium cursor-pointer">
                          {isNb ? nt.labelNb : nt.labelEn}
                        </Label>
                        <p className="text-xs text-muted-foreground">{isNb ? nt.descNb : nt.descEn}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isNotifEnabled(nt.key)}
                      onCheckedChange={(checked) => toggleNotif.mutate({ type: nt.key, enabled: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Privacy ── */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isNb ? "Personvern" : "Privacy"}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {isNb ? "Dine data" : "Your data"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNb
                      ? "Vi lagrer kun data som er nødvendig for å levere tjenesten. All data behandles i henhold til GDPR og vår personvernerklæring."
                      : "We only store data necessary to deliver the service. All data is processed in accordance with GDPR and our privacy policy."}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {isNb ? "Databehandlere" : "Data processors"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNb
                      ? "Plattformen bruker sikre europeiske skytjenester for lagring og behandling av data."
                      : "The platform uses secure European cloud services for data storage and processing."}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {isNb ? "Slett konto" : "Delete account"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNb
                      ? "Ønsker du å slette kontoen din? Kontakt oss på support@mynder.io for å få kontoen slettet."
                      : "Want to delete your account? Contact us at support@mynder.io to have your account deleted."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
