import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Shield,
  Save,
  Info,
  Plug,
  Trash2,
} from "lucide-react";
import { PartnerIntegrationsTab } from "@/components/msp/PartnerIntegrationsTab";
import { toast } from "sonner";
import { usePostActivationPrompt } from "@/hooks/usePostActivationPrompt";


const SETTINGS_KEY = "msp-messages-settings-v1";

interface ForwardSettings {
  inboxEmail: string;
  ccEmail: string;
  replyToEmail: string;
  forwardEnabled: boolean;
  dailyDigest: boolean;
}

const defaults: ForwardSettings = {
  inboxEmail: "",
  ccEmail: "",
  replyToEmail: "",
  forwardEnabled: true,
  dailyDigest: false,
};

import {
  PARTNER_TEAM,
  PARTNER_ROLE_DESC,
  PARTNER_MEMBER_DESC,
  PARTNER_ROLE_INDEPENDENCE_NOTE,
  PARTNER_ACCESS_LABEL,
  PARTNER_SCOPE_LABEL,
  describeMemberAccess,
  DEFAULT_ROLE_ACCESS,
  DEFAULT_ROLE_SCOPE,
  PARTNER_INVITE_ROLE_REQUIRED,
  PARTNER_ROLE_ACCESS_HINT,
  type PartnerTeamMember,
  type PartnerRole,
  type PartnerAccess,
  type PartnerScope,
} from "@/lib/partnerTeam";
type TeamMember = PartnerTeamMember;
const DEMO_TEAM = PARTNER_TEAM;

interface CustomerOption { id: string; name: string }

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

type InviteDraft = {
  name: string;
  email: string;
  roles: PartnerRole[];
  roleAccess: Record<PartnerRole, PartnerAccess>;
  roleScope: Record<PartnerRole, PartnerScope>;
  roleCustomerIds: Record<PartnerRole, string[]>;
};

const emptyInvite: InviteDraft = {
  name: "",
  email: "",
  roles: ["Kundeansvarlig"],
  roleAccess: { ...DEFAULT_ROLE_ACCESS },
  roleScope: { ...DEFAULT_ROLE_SCOPE },
  roleCustomerIds: { Kundeansvarlig: [], Driftspartner: [] },
};

export default function MSPPartnerSettings() {
  const { enabled: postActivationEnabled, setPreference: setPostActivationPreference } =
    usePostActivationPrompt();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "tilgangsstyring";
  const [form, setForm] = useState<ForwardSettings>(defaults);
  const [team, setTeam] = useState<TeamMember[]>(DEMO_TEAM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InviteDraft>(emptyInvite);
  const [inviteTerms, setInviteTerms] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  

  const updateMember = (id: string, patch: Partial<TeamMember>) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    toast.success("Tilgang oppdatert");
  };

  const removeMember = (member: TeamMember) => {
    setTeam((prev) => prev.filter((m) => m.id !== member.id));
    setMemberToRemove(null);
    toast.success(`${member.name} er fjernet fra teamet`);
  };

  const toggleMemberRole = (m: TeamMember, role: PartnerRole, on: boolean) => {
    const roles = on ? [...m.roles, role] : m.roles.filter((r) => r !== role);
    updateMember(m.id, { roles });
  };

  const memberScope = (m: TeamMember, role: PartnerRole): PartnerScope =>
    m.roleScope?.[role] ?? DEFAULT_ROLE_SCOPE[role];
  const memberCustomers = (m: TeamMember, role: PartnerRole): string[] =>
    m.roleCustomerIds?.[role] ?? [];

  const setMemberScope = (m: TeamMember, role: PartnerRole, scope: PartnerScope) => {
    updateMember(m.id, {
      roleScope: { ...DEFAULT_ROLE_SCOPE, ...m.roleScope, [role]: scope },
    });
  };

  const toggleMemberCustomer = (m: TeamMember, role: PartnerRole, customerId: string, on: boolean) => {
    const current = memberCustomers(m, role);
    const next = on ? [...current, customerId] : current.filter((id) => id !== customerId);
    setTeam((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? { ...x, roleCustomerIds: { ...x.roleCustomerIds, [role]: next } }
          : x,
      ),
    );
  };

  // Kundeliste til omfangsvelgeren for driftspartnere.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("msp_customers")
        .select("id, customer_name")
        .order("customer_name");
      if (cancelled || !data) return;
      setCustomers(data.map((c) => ({ id: c.id as string, name: c.customer_name as string })));
    })();
    return () => { cancelled = true; };
  }, []);

  // Normalize legacy "generelt" tab into "tilgangsstyring" so the Tilgangsstyring menu
  // always shows the user-management section.
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "generelt") {
      setSearchParams({ tab: "tilgangsstyring" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);


  const inviteValid =
    invite.name.trim().length > 0 &&
    isValidEmail(invite.email) &&
    invite.roles.length > 0 &&
    invite.roles.every(
      (r) => invite.roleScope[r] === "all" || invite.roleCustomerIds[r].length > 0,
    );

  const handleSendInvite = () => {
    if (!inviteValid) return;
    setInviteLoading(true);
    setTimeout(() => {
      setInviteLoading(false);
      setInviteOpen(false);
      const newMember: TeamMember = {
        id: `u${Date.now()}`,
        name: invite.name.trim(),
        email: invite.email.trim(),
        roles: invite.roles,
        roleAccess: invite.roleAccess,
        roleScope: invite.roleScope,
        roleCustomerIds: invite.roleCustomerIds,
        initials: invite.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
      };
      setTeam((prev) => [...prev, newMember]);
      toast.success(`Invitasjon sendt til ${invite.email}`, {
        description: describeMemberAccess(newMember),
      });
      setInvite(emptyInvite);
    }, 600);
  };



  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ForwardSettings>;
      setForm({ ...defaults, ...parsed });
    } catch {
      /* noop */
    }
  }, []);

  const update = <K extends keyof ForwardSettings>(key: K, value: ForwardSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (form.forwardEnabled && !form.inboxEmail) {
      toast.error("Legg inn en mottaks-e-post", {
        description: "Vi trenger en adresse å sende meldingene til.",
      });
      return;
    }
    if (form.inboxEmail && !isValidEmail(form.inboxEmail)) {
      toast.error("Ugyldig mottaks-e-post");
      return;
    }
    if (form.replyToEmail && !isValidEmail(form.replyToEmail)) {

      toast.error("Ugyldig svar-til-e-post");
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(form));
    toast.success("Innstillinger lagret", {
      description: form.forwardEnabled && form.inboxEmail
        ? `Alle nye meldinger sendes til ${form.inboxEmail}`
        : "E-postvideresending er av.",
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
          <div>
            <Link
              to="/msp-partner"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Tilbake til partner-dashbord
            </Link>
            <h1 className="text-2xl font-semibold text-foreground">
              {activeTab === "kommunikasjon"
                ? "Kommunikasjon"
                : activeTab === "integrasjoner"
                ? "Integrasjoner"
                : "Tilgangsstyring"}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              {activeTab === "kommunikasjon"
                ? "Styr hvordan meldinger fra kunder når deg og teamet ditt."
                : activeTab === "integrasjoner"
                ? "Koble Mynder til verktøyene dere allerede bruker."
                : "Legg til brukere, gi dem rolle som Kundeansvarlig eller Driftspartner, og styr om de har lese- eller skrivetilgang."}
            </p>


          </div>

          <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4">
            <TabsList className="h-10">
              <TabsTrigger value="tilgangsstyring" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Tilgangsstyring
              </TabsTrigger>
              <TabsTrigger value="kommunikasjon" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Kommunikasjon
              </TabsTrigger>
              <TabsTrigger value="integrasjoner" className="gap-1.5">
                <Plug className="h-3.5 w-3.5" /> Integrasjoner
              </TabsTrigger>
            </TabsList>


            <TabsContent value="tilgangsstyring" className="space-y-4">
              {/* 1. Team-tilgang */}
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Brukere med tilgang til partnerdelen</h2>
                      <p className="text-base text-muted-foreground mt-0.5">
                        Disse brukerne blir brukere i kundens organisasjon.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setInviteOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Inviter bruker
                  </Button>
                </div>

                <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/10 px-3.5 py-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80">{PARTNER_ROLE_INDEPENDENCE_NOTE}</p>
                </div>

                <div className="rounded-xl border border-border divide-y divide-border">
                  {team.map((m) => {
                    const isOps = m.roles.includes("Driftspartner");
                    return (
                      <div key={m.id} className="px-4 py-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex items-center gap-3 sm:w-[220px] shrink-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                              {m.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-medium text-foreground truncate">{m.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            {(["Kundeansvarlig", "Driftspartner"] as PartnerRole[]).map((role) => {
                              const on = m.roles.includes(role);
                              return (
                                <div
                                  key={role}
                                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                                    on ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"
                                  }`}
                                >
                                  <Switch
                                    checked={on}
                                    onCheckedChange={(v) => toggleMemberRole(m, role, v)}
                                    aria-label={`${role} for ${m.name}`}
                                  />
                                  <span
                                    className={`text-sm font-medium flex-1 min-w-[120px] ${
                                      on ? "text-foreground" : "text-muted-foreground"
                                    }`}
                                  >
                                    {role}
                                  </span>
                                  {on && (
                                    <Select
                                      value={m.roleAccess?.[role] ?? DEFAULT_ROLE_ACCESS[role]}
                                      onValueChange={(v) =>
                                        updateMember(m.id, {
                                          roleAccess: {
                                            ...DEFAULT_ROLE_ACCESS,
                                            ...m.roleAccess,
                                            [role]: v as PartnerAccess,
                                          },
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-[186px] text-sm bg-background">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="write">{PARTNER_ACCESS_LABEL.write}</SelectItem>
                                        <SelectItem value="read">{PARTNER_ACCESS_LABEL.read}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              );
                            })}


                            {isOps && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Driftspartner gjelder</span>
                                <Select
                                  value={m.scope}
                                  onValueChange={(v) => updateMember(m.id, { scope: v as PartnerScope })}
                                >
                                  <SelectTrigger className="h-8 w-[150px] text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">{PARTNER_SCOPE_LABEL.all}</SelectItem>
                                    <SelectItem value="selected">{PARTNER_SCOPE_LABEL.selected}</SelectItem>
                                  </SelectContent>
                                </Select>
                                {m.scope === "selected" && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 text-sm">
                                        {m.customerIds.length > 0
                                          ? `${m.customerIds.length} ${m.customerIds.length === 1 ? "kunde" : "kunder"}`
                                          : "Velg kunder"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-2" align="start">
                                      <p className="px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                                        Kunder {m.name.split(" ")[0]} kan jobbe hos
                                      </p>
                                      <div className="max-h-64 overflow-auto space-y-0.5">
                                        {customers.length === 0 && (
                                          <p className="px-2 py-2 text-sm text-muted-foreground">Ingen kunder ennå.</p>
                                        )}
                                        {customers.map((c) => (
                                          <label
                                            key={c.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                                          >
                                            <Checkbox
                                              checked={m.customerIds.includes(c.id)}
                                              onCheckedChange={(v) => toggleMemberCustomer(m, c.id, v === true)}
                                            />
                                            <span className="text-sm text-foreground truncate">{c.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                                {m.scope === "selected" && m.customerIds.length === 0 && (
                                  <span className="text-sm text-muted-foreground">Ingen kunder valgt ennå</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 sm:pt-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setMemberToRemove(m)}
                              aria-label={`Fjern ${m.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Kundeansvarlig:</span>{" "}
                    {PARTNER_ROLE_DESC.Kundeansvarlig}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Driftspartner:</span>{" "}
                    {PARTNER_ROLE_DESC.Driftspartner}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Tilgangsnivå (per rolle):</span>{" "}
                    «{PARTNER_ACCESS_LABEL.write}» = skrivetilgang · «{PARTNER_ACCESS_LABEL.read}» = ser, men endrer ikke.
                  </p>
                </div>




              </Card>



              {/* Etter aktivering */}
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Spør etter aktivering</p>
                    <p className="text-xs text-muted-foreground">
                      Vis dialog om å jobbe videre hos kunden når du har aktivert produkter eller
                      regelverk. Er den av, får du kun en varsling med snarvei.
                    </p>
                  </div>
                  <Switch
                    checked={postActivationEnabled}
                    onCheckedChange={setPostActivationPreference}
                    aria-label="Spør om å jobbe videre hos kunden etter aktivering"
                  />
                </div>
              </Card>


            </TabsContent>

            <TabsContent value="kommunikasjon" className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-foreground">Videresend meldinger til e-post</h2>
                    <p className="text-base text-muted-foreground mt-0.5">
                      Du får alt — kundesvar, aksepterte tilbud, påminnelser — rett i innboksen din. Slipp å
                      logge inn i Mynder for å holde deg oppdatert.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <div>
                      <p className="text-base font-medium text-foreground">
                        Videresend alle innkommende meldinger
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Skru av for å bare lese meldinger inne i Mynder.
                      </p>
                    </div>
                    <Switch
                      checked={form.forwardEnabled}
                      onCheckedChange={(v) => update("forwardEnabled", v)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="inbox" className="text-base">
                        Mottaks-e-post
                      </Label>
                      <Input
                        id="inbox"
                        type="email"
                        placeholder="navn@firma.no"
                        value={form.inboxEmail}
                        onChange={(e) => update("inboxEmail", e.target.value)}
                        disabled={!form.forwardEnabled}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alle nye meldinger sendes hit som e-post.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reply" className="text-base">
                        Svar-til <span className="text-muted-foreground font-normal">— valgfritt</span>
                      </Label>
                      <Input
                        id="reply"
                        type="email"
                        placeholder="salg@firma.no"
                        value={form.replyToEmail}
                        onChange={(e) => update("replyToEmail", e.target.value)}
                        disabled={!form.forwardEnabled}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border p-3 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Innstillingene gjelder for hele partner-organisasjonen og deles med alle meldingsfanene i
                      Mynder.
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="gap-1.5">
                      <Save className="h-4 w-4" /> Lagre innstillinger
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>




            <TabsContent value="integrasjoner">
              <PartnerIntegrationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>


      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Legg til bruker</DialogTitle>
            <DialogDescription>
              Den nye brukeren får tilgang til kundeportefølje, tilbud og meldinger så snart invitasjonen aksepteres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="inv-name" className="text-base">Navn</Label>
                <Input
                  id="inv-name"
                  placeholder="Ola Nordmann"
                  value={invite.name}
                  onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="inv-email" className="text-base">E-post</Label>
                <Input
                  id="inv-email"
                  type="email"
                  placeholder="navn@firma.no"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                />
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">Blir medlem</p>
                <p className="text-sm text-muted-foreground">{PARTNER_MEMBER_DESC}</p>
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-base">Roller (valgfritt)</Label>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {(["Kundeansvarlig", "Driftspartner"] as PartnerRole[]).map((role) => (
                    <div key={role} className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{role}</p>
                        <p className="text-sm text-muted-foreground">{PARTNER_ROLE_DESC[role]}</p>
                        {invite.roles.includes(role) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {PARTNER_ROLE_ACCESS_HINT[role][invite.roleAccess[role]]}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Switch
                          checked={invite.roles.includes(role)}
                          onCheckedChange={(v) =>
                            setInvite({
                              ...invite,
                              roles: v ? [...invite.roles, role] : invite.roles.filter((r) => r !== role),
                            })
                          }
                          aria-label={role}
                        />
                        {invite.roles.includes(role) && (
                          <Select
                            value={invite.roleAccess[role]}
                            onValueChange={(v) =>
                              setInvite({
                                ...invite,
                                roleAccess: { ...invite.roleAccess, [role]: v as PartnerAccess },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-[186px] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">{PARTNER_ACCESS_LABEL.read}</SelectItem>
                              <SelectItem value="write">{PARTNER_ACCESS_LABEL.write}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {invite.roles.includes("Driftspartner") && (
                <div className="space-y-3 col-span-2 rounded-lg border border-border p-3">
                  <div className="space-y-1.5">
                    <Label className="text-base">Omfang</Label>
                    <Select
                      value={invite.scope}
                      onValueChange={(v) => setInvite({ ...invite, scope: v as PartnerScope })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{PARTNER_SCOPE_LABEL.all}</SelectItem>
                        <SelectItem value="selected">{PARTNER_SCOPE_LABEL.selected}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {invite.scope === "selected" && (
                    <div className="max-h-48 overflow-auto rounded-lg border border-border p-1">
                      {customers.length === 0 && (
                        <p className="px-2 py-2 text-sm text-muted-foreground">Ingen kunder ennå.</p>
                      )}
                      {customers.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={invite.customerIds.includes(c.id)}
                            onCheckedChange={(v) =>
                              setInvite({
                                ...invite,
                                customerIds: v === true
                                  ? [...invite.customerIds, c.id]
                                  : invite.customerIds.filter((id) => id !== c.id),
                              })
                            }
                          />
                          <span className="text-sm text-foreground truncate">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Avbryt</Button>
            <Button onClick={handleSendInvite} disabled={!inviteValid || inviteLoading}>
              {inviteLoading ? "Sender..." : "Send invitasjon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fjern bruker?</DialogTitle>
            <DialogDescription>
              {memberToRemove && (
                <>
                  Er du sikker på at du vil fjerne <strong>{memberToRemove.name}</strong> fra partner-teamet? 
                  Brukeren mister umiddelbar tilgang til partnerdelen og kundene dere deler.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>Avbryt</Button>
            <Button
              variant="destructive"
              onClick={() => memberToRemove && removeMember(memberToRemove)}
              disabled={!memberToRemove}
            >
              Fjern bruker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
