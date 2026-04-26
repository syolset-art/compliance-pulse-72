import { useState, useEffect } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, Bell, Shield, User, CreditCard,
  Clock, Mail, AlertTriangle, FileText, CheckCircle2,
  Bot, Plug, ExternalLink, Sparkles, Zap, Settings2,
  ChevronRight, Copy, Eye, EyeOff, HelpCircle,
} from "lucide-react";
import { AIAutonomySection } from "@/components/settings/AIAutonomySection";

const NOTIFICATION_TYPES = [
  { key: "document_expiry", labelNb: "Dokumentutløp", labelEn: "Document expiry", descNb: "Varsling når dokumenter nærmer seg utløpsdato", descEn: "Alerts when documents approach expiry date", icon: FileText },
  { key: "compliance_updates", labelNb: "Etterlevelsesoppdateringer", labelEn: "Compliance updates", descNb: "Varsling om endringer i regelverk og krav", descEn: "Alerts about changes in regulations", icon: Shield },
  { key: "task_reminders", labelNb: "Oppgavepåminnelser", labelEn: "Task reminders", descNb: "Påminnelser om kommende og forfalt oppgaver", descEn: "Reminders about upcoming and overdue tasks", icon: Clock },
  { key: "deviation_alerts", labelNb: "Avviksvarsler", labelEn: "Deviation alerts", descNb: "Varsling når nye avvik rapporteres", descEn: "Alerts when new deviations are reported", icon: AlertTriangle },
  { key: "email_digest", labelNb: "E-postsammendrag", labelEn: "Email digest", descNb: "Ukentlig sammendrag på e-post", descEn: "Weekly summary by email", icon: Mail },
];

const AGENT_SERVICES = [
  {
    id: "compliance-agent",
    nameNb: "Etterlevelsesagent",
    nameEn: "Compliance Agent",
    descNb: "Automatiserer kravoppfølging, lager rapporter og oppdaterer kontrollstatus basert på regelverksendringer.",
    descEn: "Automates requirement tracking, generates reports and updates control status based on regulatory changes.",
    icon: Shield,
    color: "text-status-closed bg-status-closed/10 dark:bg-status-closed/30 dark:text-status-closed",
  },
  {
    id: "risk-agent",
    nameNb: "Risikoagent",
    nameEn: "Risk Agent",
    descNb: "Overvåker leverandører, analyserer trusler og gir kontinuerlige risikovurderinger med handlingsforslag.",
    descEn: "Monitors vendors, analyzes threats and provides continuous risk assessments with action proposals.",
    icon: Zap,
    color: "text-warning bg-warning/10 dark:bg-warning/30 dark:text-warning",
  },
  {
    id: "document-agent",
    nameNb: "Dokumentagent",
    nameEn: "Document Agent",
    descNb: "Klassifiserer og behandler innkommende dokumenter, oppdaterer utløpsdatoer og varsler om manglende dokumentasjon.",
    descEn: "Classifies and processes incoming documents, updates expiry dates and alerts about missing documentation.",
    icon: FileText,
    color: "text-primary bg-primary/10 dark:bg-primary/30 dark:text-primary",
  },
];

export default function PersonalSettings() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("account");
  const [agentApiKey, setAgentApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectedAgents, setConnectedAgents] = useState<string[]>([]);
  const [connectingAgent, setConnectingAgent] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(() => setHelpOpen(true));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    // Load connected agents from localStorage
    const saved = localStorage.getItem("mynder-connected-agents");
    if (saved) setConnectedAgents(JSON.parse(saved));
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
    return pref ? pref.enabled : true;
  };

  const handleConnectAgent = async (agentId: string) => {
    setConnectingAgent(agentId);
    // Simulate connection
    await new Promise((r) => setTimeout(r, 1500));
    const updated = [...connectedAgents, agentId];
    setConnectedAgents(updated);
    localStorage.setItem("mynder-connected-agents", JSON.stringify(updated));
    setConnectingAgent(null);
    toast.success(isNb ? "Agent tilkoblet!" : "Agent connected!");
  };

  const handleDisconnectAgent = (agentId: string) => {
    const updated = connectedAgents.filter((id) => id !== agentId);
    setConnectedAgents(updated);
    localStorage.setItem("mynder-connected-agents", JSON.stringify(updated));
    toast.success(isNb ? "Agent frakoblet" : "Agent disconnected");
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

  const sections = [
    { id: "account", labelNb: "Konto", labelEn: "Account", icon: User },
    { id: "notifications", labelNb: "Varsler", labelEn: "Notifications", icon: Bell },
    { id: "agents", labelNb: "Agenter", labelEn: "Agents", icon: Bot },
    { id: "ai-autonomy", labelNb: "AI Autonomi", labelEn: "AI Autonomy", icon: Sparkles },
    { id: "membership", labelNb: "Medlemskap", labelEn: "Membership", icon: CreditCard },
    { id: "privacy", labelNb: "Personvern", labelEn: "Privacy", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 pt-11">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {isNb ? "Innstillinger" : "Settings"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isNb ? "Personlige innstillinger, varsler og tjenester" : "Personal settings, notifications and services"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="h-3.5 w-3.5" />
              {isNb ? "Hvordan fungerer dette?" : "How does this work?"}
            </Button>
          </div>

          {/* Section navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {isNb ? s.labelNb : s.labelEn}
              </button>
            ))}
          </div>

          {/* ── Account Info ── */}
          {activeSection === "account" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      {isNb ? "Kontoinformasjon" : "Account Information"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? "E-post" : "Email"}</p>
                      <p className="text-sm font-medium text-foreground">{user?.email || "–"}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? "Sist innlogget" : "Last signed in"}</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {lastSignIn}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? "Konto opprettet" : "Account created"}</p>
                      <p className="text-sm font-medium text-foreground">{createdAt}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? "Organisasjon" : "Organization"}</p>
                      <p className="text-sm font-medium text-foreground">{companyProfile?.name || "–"}</p>
                    </div>
                  </div>

                  {/* Roles */}
                  {userRoles.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? "Roller" : "Roles"}</p>
                        <div className="flex flex-wrap gap-2">
                          {userRoles.map((r: any) => (
                            <Badge key={r.role} variant={r.is_primary ? "default" : "secondary"} className="text-xs">
                              {roleLabels[r.role]?.[isNb ? "nb" : "en"] || r.role}
                              {r.is_primary && <CheckCircle2 className="h-3 w-3 ml-1" />}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeSection === "notifications" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
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

                  <div className="space-y-2">
                    {NOTIFICATION_TYPES.map((nt) => (
                      <div key={nt.key} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
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
            </div>
          )}

          {/* ── Agents ── */}
          {activeSection === "agents" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Intro */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-foreground">
                        {isNb ? "KI-agenter" : "AI Agents"}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isNb
                          ? "Koble til KI-agenter som kan utføre oppgaver på vegne av deg. Agenter kan automatisere etterlevelse, risikovurderinger og dokumentbehandling — og jobber kontinuerlig i bakgrunnen."
                          : "Connect AI agents that can perform tasks on your behalf. Agents can automate compliance, risk assessments and document processing — working continuously in the background."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Key for custom agents */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      {isNb ? "Egen agent-tilkobling" : "Custom agent connection"}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isNb
                      ? "Har du en egen KI-agent? Legg inn API-nøkkel og endepunkt for å koble den til Mynder."
                      : "Have your own AI agent? Add API key and endpoint to connect it to Mynder."}
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isNb ? "Agent API-nøkkel" : "Agent API key"}</Label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          placeholder="sk-agent-..."
                          value={agentApiKey}
                          onChange={(e) => setAgentApiKey(e.target.value)}
                          className="pr-20"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              navigator.clipboard.writeText(agentApiKey);
                              toast.success(isNb ? "Kopiert" : "Copied");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isNb ? "Endepunkt-URL" : "Endpoint URL"}</Label>
                      <Input placeholder="https://api.your-agent.com/v1" />
                    </div>
                    <Button size="sm" disabled={!agentApiKey} onClick={() => toast.success(isNb ? "Agent-tilkobling lagret" : "Agent connection saved")}>
                      <Plug className="h-4 w-4 mr-1.5" />
                      {isNb ? "Koble til" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Available agent services */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  {isNb ? "Tilgjengelige agenttjenester" : "Available agent services"}
                </h3>
                <div className="grid gap-3">
                  {AGENT_SERVICES.map((agent) => {
                    const isConnected = connectedAgents.includes(agent.id);
                    const isLoading = connectingAgent === agent.id;
                    return (
                      <Card key={agent.id} className={`transition-all ${isConnected ? "border-primary/30 bg-primary/[0.02]" : "hover:border-border/80"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${agent.color}`}>
                              <agent.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {isNb ? agent.nameNb : agent.nameEn}
                                </h4>
                                {isConnected && (
                                  <Badge className="bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed text-[13px] gap-0.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {isNb ? "Aktiv" : "Active"}
                                  </Badge>
                                )}
                                {!isConnected && (
                                  <Badge variant="outline" className="text-[13px]">
                                    {isNb ? "Kommer snart" : "Coming soon"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {isNb ? agent.descNb : agent.descEn}
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                {isConnected ? (
                                  <>
                                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleDisconnectAgent(agent.id)}>
                                      {isNb ? "Koble fra" : "Disconnect"}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-xs h-8">
                                      <Settings2 className="h-3.5 w-3.5 mr-1" />
                                      {isNb ? "Innstillinger" : "Settings"}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="text-xs h-8"
                                    disabled={isLoading}
                                    onClick={() => handleConnectAgent(agent.id)}
                                  >
                                    {isLoading ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        {isNb ? "Kobler til..." : "Connecting..."}
                                      </span>
                                    ) : (
                                      <>
                                        <Plug className="h-3.5 w-3.5 mr-1" />
                                        {isNb ? "Aktiver" : "Activate"}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Membership ── */}
          {activeSection === "membership" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
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
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{connectedAgents.length}</p>
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                        {isNb ? "Aktive agenter" : "Active agents"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{userRoles.length}</p>
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                        {isNb ? "Roller" : "Roles"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {notifPrefs.filter((p: any) => p.enabled).length || NOTIFICATION_TYPES.length}
                      </p>
                      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                        {isNb ? "Aktive varsler" : "Active alerts"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── AI Autonomy ── */}
          {activeSection === "ai-autonomy" && <AIAutonomySection isNb={isNb} />}

          {/* ── Privacy ── */}
          {activeSection === "privacy" && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      {isNb ? "Personvern" : "Privacy"}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">
                        {isNb ? "Dine data" : "Your data"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Vi lagrer kun data som er nødvendig for å levere tjenesten. All data behandles i henhold til GDPR og vår personvernerklæring."
                          : "We only store data necessary to deliver the service. All data is processed in accordance with GDPR and our privacy policy."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">
                        {isNb ? "Databehandlere" : "Data processors"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Plattformen bruker sikre europeiske skytjenester for lagring og behandling av data."
                          : "The platform uses secure European cloud services for data storage and processing."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {isNb ? "Betingelser og samtykke" : "Terms and consent"}
                        </p>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/terms-and-consent")}>
                          {isNb ? "Vis" : "View"}
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Se og administrer dine juridiske dokumenter og samtykkeinnstillinger."
                          : "View and manage your legal documents and consent settings."}
                      </p>
                    </div>

                    <Separator />

                    <div className="rounded-lg border border-destructive/20 p-4 space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        {isNb ? "Slett konto" : "Delete account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Ønsker du å slette kontoen din? Kontakt oss på support@mynder.io for å få kontoen slettet."
                          : "Want to delete your account? Contact us at support@mynder.io to have your account deleted."}
                      </p>
                      <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5">
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        {isNb ? "Kontakt support" : "Contact support"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Settings2}
        title={isNb ? "Personlige innstillinger" : "Personal Settings"}
        description={isNb
          ? "Her administrerer du din profil, varslingsinnstillinger og AI-agenter. Alt du trenger for å tilpasse plattformen til dine behov."
          : "Manage your profile, notification settings and AI agents. Everything you need to customize the platform."}
        itemsHeading={isNb ? "Nøkkelfunksjoner" : "Key features"}
        items={[
          {
            icon: User,
            title: isNb ? "Konto" : "Account",
            description: isNb
              ? "Se e-post, roller og sist innlogget tidspunkt"
              : "View email, roles and last sign-in time",
          },
          {
            icon: Bell,
            title: isNb ? "Varsler" : "Notifications",
            description: isNb
              ? "Styr hvilke varsler du mottar — dokumentutløp, etterlevelse, oppgaver og avvik"
              : "Control which notifications you receive",
          },
          {
            icon: Bot,
            title: isNb ? "AI-agenter" : "AI Agents",
            description: isNb
              ? "Koble til agenter som automatiserer oppgaver: Etterlevelsesagent (kravoppfølging), Risikoagent (trusselovervåking) og Dokumentagent (klassifisering og utløpsvarsler)"
              : "Connect agents that automate tasks: Compliance Agent, Risk Agent and Document Agent",
          },
          {
            icon: CreditCard,
            title: isNb ? "Medlemskap" : "Membership",
            description: isNb
              ? "Se abonnement, plan og aktive lisenser"
              : "View subscription, plan and active licenses",
          },
          {
            icon: Shield,
            title: isNb ? "Personvern" : "Privacy",
            description: isNb
              ? "GDPR-rettigheter, databehandlingsinformasjon og mulighet for datanedlasting eller sletting"
              : "GDPR rights, data handling info and options for data download or deletion",
          },
        ]}
        whyTitle={isNb ? "Hvorfor er dette viktig?" : "Why is this important?"}
        whyDescription={isNb
          ? "Selvbetjening og kontroll over egne innstillinger gir deg full oversikt over hvordan plattformen fungerer for deg. AI-agentene kan spare deg for timer med manuelt arbeid ved å automatisere kravoppfølging, risikovurdering og dokumenthåndtering."
          : "Self-service and control over your settings gives you full oversight of how the platform works for you. AI agents can save hours of manual work."}
        actions={[
          {
            icon: Bot,
            title: isNb ? "Gå til Agenter" : "Go to Agents",
            description: isNb ? "Koble til og administrer AI-agenter" : "Connect and manage AI agents",
            onClick: () => { setHelpOpen(false); setActiveSection("agents"); },
          },
          {
            icon: Bell,
            title: isNb ? "Endre varsler" : "Change notifications",
            description: isNb ? "Tilpass varslingsinnstillinger" : "Customize notification settings",
            onClick: () => { setHelpOpen(false); setActiveSection("notifications"); },
          },
          {
            icon: CreditCard,
            title: isNb ? "Se medlemskap" : "View membership",
            description: isNb ? "Se plan og abonnement" : "View plan and subscription",
            onClick: () => { setHelpOpen(false); setActiveSection("membership"); },
          },
        ]}
        laraSuggestions={[
          {
            label: isNb ? "Forklar agenttjenestene" : "Explain agent services",
            message: isNb
              ? "Forklar de tilgjengelige AI-agenttjenestene i Mynder — hva gjør Etterlevelsesagenten, Risikoagenten og Dokumentagenten?"
              : "Explain the available AI agent services in Mynder",
          },
          {
            label: isNb ? "Hjelp meg sette opp varsler" : "Help me set up notifications",
            message: isNb
              ? "Hjelp meg å konfigurere varslene mine optimalt — hvilke bør jeg ha på for best mulig compliance-oppfølging?"
              : "Help me configure my notifications optimally",
          },
          {
            label: isNb ? "Hva er min rolle?" : "What is my role?",
            message: isNb
              ? "Forklar hva min rolle i plattformen betyr og hvilke tilganger den gir meg"
              : "Explain what my role in the platform means and what access it gives me",
          },
        ]}
      />
    </div>
  );
}
