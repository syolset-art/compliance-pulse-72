import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, UserPlus, Shield, Mail, Clock, CheckCircle2, Crown, Eye, Settings, Pencil,
  AlertTriangle, Bot, Leaf, ClipboardCheck, MonitorCog, GraduationCap, Truck, FileSearch,
  Lock, User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "deactivated";
  lastSeen?: string;
}

const ALL_ROLES = [
  { key: "admin", labelNb: "Administrator", labelEn: "Administrator", descNb: "Full tilgang til alle moduler og innstillinger", descEn: "Full access to all modules and settings", icon: Crown, alwaysActive: true },
  { key: "compliance_officer", labelNb: "Compliance-ansvarlig", labelEn: "Compliance Officer", descNb: "Ansvarlig for etterlevelse og rammeverk", descEn: "Responsible for compliance and frameworks", icon: Shield, alwaysActive: true },
  { key: "data_controller", labelNb: "Behandlingsansvarlig", labelEn: "Data Controller", descNb: "Ansvarlig for behandling av personopplysninger", descEn: "Responsible for processing of personal data", icon: Shield, alwaysActive: false },
  { key: "ciso", labelNb: "CISO / Sikkerhetsansvarlig", labelEn: "CISO / Security Officer", descNb: "Ansvarlig for informasjonssikkerhet", descEn: "Responsible for information security", icon: Shield, alwaysActive: false },
  { key: "dpo", labelNb: "DPO / Personvernkontakt", labelEn: "DPO / Privacy Contact", descNb: "Ansvarlig for personvern og GDPR", descEn: "Responsible for privacy and GDPR", icon: Eye, alwaysActive: false },
  { key: "it_manager", labelNb: "IT-ansvarlig", labelEn: "IT Manager", descNb: "Ansvarlig for IT-drift og systemer", descEn: "Responsible for IT operations and systems", icon: Settings, alwaysActive: false },
  { key: "risk_owner", labelNb: "Risikoeier", labelEn: "Risk Owner", descNb: "Eier og følger opp risikoer i risikoregisteret", descEn: "Owns and follows up risks in the risk register", icon: AlertTriangle, alwaysActive: false },
  { key: "internal_auditor", labelNb: "Internrevisor", labelEn: "Internal Auditor", descNb: "Utfører interne revisjoner og kontroller (ISO 27001 / SOC 2)", descEn: "Performs internal audits and controls (ISO 27001 / SOC 2)", icon: FileSearch, alwaysActive: false },
  { key: "ai_governance", labelNb: "AI Governance-ansvarlig", labelEn: "AI Governance Officer", descNb: "Styring av AI-systemer iht. AI Act", descEn: "AI system governance per AI Act", icon: Bot, alwaysActive: false },
  { key: "esg_officer", labelNb: "Bærekraftsansvarlig (ESG)", labelEn: "ESG Officer", descNb: "ESG-rapportering og CSRD-compliance", descEn: "ESG reporting and CSRD compliance", icon: Leaf, alwaysActive: false },
  { key: "incident_manager", labelNb: "Hendelsesansvarlig", labelEn: "Incident Manager", descNb: "Håndterer sikkerhets- og personvernhendelser (NIS2 72t-krav)", descEn: "Manages security & privacy incidents (NIS2 72h requirement)", icon: AlertTriangle, alwaysActive: false },
  { key: "system_owner", labelNb: "Systemeier", labelEn: "System Owner", descNb: "Ansvarlig for spesifikke systemer og assets", descEn: "Responsible for specific systems and assets", icon: MonitorCog, alwaysActive: false },
  { key: "training_officer", labelNb: "Opplæringsansvarlig", labelEn: "Training Officer", descNb: "Ansvarlig for sikkerhetsopplæring og bevisstgjøring", descEn: "Responsible for security training and awareness", icon: GraduationCap, alwaysActive: false },
  { key: "vendor_manager", labelNb: "Leverandøransvarlig", labelEn: "Vendor Manager", descNb: "Tredjepartsstyring, DPA-oppfølging og leverandørvurderinger", descEn: "Third-party management, DPA follow-up and vendor assessments", icon: Truck, alwaysActive: false },
  { key: "member", labelNb: "Medlem", labelEn: "Member", descNb: "Standard tilgang — alle brukere er medlem med mindre de tildeles en nøkkelrolle", descEn: "Default access — all users are members unless assigned a key role", icon: Eye, alwaysActive: true },
];

const DEMO_MEMBERS: TeamMember[] = [
  { id: "1", name: "Kari Nordmann", email: "kari@acme.no", role: "admin", status: "active", lastSeen: "I dag" },
  { id: "2", name: "Synne Olsetten", email: "synne@acme.no", role: "compliance_officer", status: "active", lastSeen: "I går" },
  { id: "3", name: "Sebastian Hernandez", email: "sebastian@acme.no", role: "ciso", status: "active", lastSeen: "3 dager siden" },
  { id: "4", name: "Samti Ahmed", email: "samti@acme.no", role: "dpo", status: "active", lastSeen: "I dag" },
  { id: "5", name: "Truls Kristoffersen", email: "truls@acme.no", role: "data_controller", status: "active", lastSeen: "2 dager siden" },
  { id: "6", name: "Synnøve Olset", email: "synnove@acme.no", role: "it_manager", status: "active", lastSeen: "I dag" },
  { id: "7", name: "Line Berg", email: "line@acme.no", role: "member", status: "invited" },
];

const AdminAccessManagement = () => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageRolesOpen, setManageRolesOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [members] = useState<TeamMember[]>(DEMO_MEMBERS);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    fetchActiveRoles();
  }, []);

  const fetchActiveRoles = async () => {
    const { data } = await supabase.from("company_profile").select("active_roles").limit(1).single();
    if (data?.active_roles && data.active_roles.length > 0) {
      setActiveRoles(data.active_roles);
    } else {
      // Default: activate the original roles
      const defaults = ["admin", "compliance_officer", "data_controller", "ciso", "dpo", "it_manager", "member"];
      setActiveRoles(defaults);
    }
  };

  const isRoleActive = (key: string) => {
    const role = ALL_ROLES.find(r => r.key === key);
    if (role?.alwaysActive) return true;
    return activeRoles.includes(key);
  };

  const toggleRole = async (key: string) => {
    const role = ALL_ROLES.find(r => r.key === key);
    if (role?.alwaysActive) return;

    const newRoles = activeRoles.includes(key)
      ? activeRoles.filter(r => r !== key)
      : [...activeRoles, key];
    
    setActiveRoles(newRoles);
  };

  const saveActiveRoles = async () => {
    setSavingRoles(true);
    // Ensure always-active roles are included
    const alwaysActiveKeys = ALL_ROLES.filter(r => r.alwaysActive).map(r => r.key);
    const finalRoles = [...new Set([...alwaysActiveKeys, ...activeRoles])];

    const { error } = await supabase
      .from("company_profile")
      .update({ active_roles: finalRoles })
      .not("id", "is", null);

    setSavingRoles(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre roller" : "Could not save roles");
    } else {
      toast.success(isNb ? "Roller oppdatert" : "Roles updated");
      setManageRolesOpen(false);
    }
  };

  const visibleRoles = ALL_ROLES.filter(r => isRoleActive(r.key));

  const getRoleDef = (key: string) => ALL_ROLES.find(r => r.key === key) || ALL_ROLES[ALL_ROLES.length - 1];

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error(isNb ? "E-post er påkrevd" : "Email is required");
      return;
    }
    toast.success(isNb ? `Invitasjon sendt til ${inviteEmail}` : `Invitation sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteName("");
    setInviteRole("member");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  {isNb ? "Tilganger" : "Access Management"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNb
                    ? "Inviter brukere og tilordne nøkkelroller i organisasjonen."
                    : "Invite users and assign key roles in your organization."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setManageRolesOpen(true)} className="gap-2">
                  <Settings className="h-4 w-4" />
                  {isNb ? "Administrer roller" : "Manage Roles"}
                </Button>
                <Button onClick={() => setInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {isNb ? "Inviter bruker" : "Invite user"}
                </Button>
              </div>
            </div>

            {/* Role overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {isNb ? "Aktive roller" : "Active Roles"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleRoles.map(role => {
                    const assigned = members.filter(m => m.role === role.key && m.status !== "deactivated");
                    const Icon = role.icon;
                    return (
                      <div
                        key={role.key}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{isNb ? role.labelNb : role.labelEn}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug">{isNb ? role.descNb : role.descEn}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {assigned.length > 0 ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {assigned.length} {isNb ? "tildelt" : "assigned"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                                {isNb ? "Ikke tildelt" : "Not assigned"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Team members */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isNb ? "Teammedlemmer" : "Team Members"}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{members.length} {isNb ? "brukere" : "users"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {members.map(member => {
                    const roleDef = getRoleDef(member.role);
                    return (
                      <div key={member.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                              {member.status === "invited" && (
                                <Badge variant="outline" className="text-[10px] gap-1 text-warning border-warning/30">
                                  <Clock className="h-2.5 w-2.5" />
                                  {isNb ? "Invitert" : "Invited"}
                                </Badge>
                              )}
                              {member.status === "active" && (
                                <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  {isNb ? "Aktiv" : "Active"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="secondary" className="text-[10px]">
                            {isNb ? roleDef.labelNb : roleDef.labelEn}
                          </Badge>
                          {member.lastSeen && (
                            <span className="text-[10px] text-muted-foreground hidden md:inline">
                              {member.lastSeen}
                            </span>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Management Access Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {isNb ? "Leverandørstyring" : "Vendor Management"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isNb
                        ? "Roller og tilganger knyttet til forvaltning av leverandører, DPA-oppfølging og tredjepartsrisiko."
                        : "Roles and access related to vendor management, DPA follow-up, and third-party risk."}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Write access roles */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {isNb ? "Kan utføre" : "Can execute"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      — {isNb ? "redigere, opprette oppgaver, laste opp dokumenter" : "edit, create tasks, upload documents"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { role: "vendor_manager", icon: Truck, nb: "Leverandøransvarlig", en: "Vendor Manager", descNb: "Tredjepartsstyring, DPA-oppfølging og leverandørvurderinger", descEn: "Third-party management, DPA follow-up and vendor assessments" },
                      { role: "compliance_officer", icon: ClipboardCheck, nb: "Compliance-ansvarlig", en: "Compliance Officer", descNb: "Ansvarlig for etterlevelse og rammeverk", descEn: "Responsible for compliance and frameworks" },
                      { role: "it_manager", icon: MonitorCog, nb: "IT-ansvarlig", en: "IT Manager", descNb: "Ansvarlig for IT-drift og systemer", descEn: "Responsible for IT operations and systems" },
                      { role: "ciso", icon: Lock, nb: "CISO / Sikkerhetsansvarlig", en: "CISO / Security Officer", descNb: "Ansvarlig for informasjonssikkerhet", descEn: "Responsible for information security" },
                    ].map(r => {
                      const Icon = r.icon;
                      const assigned = members.filter(m => m.role === r.role && m.status !== "deactivated");
                      return (
                        <div key={r.role} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded bg-primary/10">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{isNb ? r.nb : r.en}</p>
                              <p className="text-[11px] text-muted-foreground">{isNb ? r.descNb : r.descEn}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {assigned.length} {isNb ? "tildelt" : "assigned"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Read access roles */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {isNb ? "Kan se" : "Can view"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      — {isNb ? "se leverandørprofil, dokumenter og status" : "view vendor profile, documents, and status"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { role: "dpo", icon: Shield, nb: "DPO / Personvernkontakt", en: "DPO / Privacy Contact", descNb: "Ansvarlig for personvern og GDPR", descEn: "Responsible for privacy and GDPR" },
                      { role: "internal_auditor", icon: FileSearch, nb: "Internrevisor", en: "Internal Auditor", descNb: "Utfører interne revisjoner og kontroller", descEn: "Performs internal audits and controls" },
                      { role: "risk_owner", icon: AlertTriangle, nb: "Risikoeier", en: "Risk Owner", descNb: "Eier og følger opp risikoer i risikoregisteret", descEn: "Owns and follows up risks in the risk register" },
                      { role: "ai_governance", icon: Bot, nb: "AI Governance-ansvarlig", en: "AI Governance Officer", descNb: "Styring av AI-systemer iht. AI Act", descEn: "AI system governance per AI Act" },
                      { role: "member", icon: User, nb: "Medlem", en: "Member", descNb: "Standard lesetilgang til leverandørprofiler", descEn: "Default read access to vendor profiles" },
                    ].map(r => {
                      const Icon = r.icon;
                      const assigned = members.filter(m => m.role === r.role && m.status !== "deactivated");
                      return (
                        <div key={r.role} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded bg-muted">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{isNb ? r.nb : r.en}</p>
                              <p className="text-[11px] text-muted-foreground">{isNb ? r.descNb : r.descEn}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {assigned.length} {isNb ? "tildelt" : "assigned"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
        </main>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {isNb ? "Inviter bruker" : "Invite user"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Send en invitasjon til en ny bruker og tilordne en rolle."
                : "Send an invitation to a new user and assign a role."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{isNb ? "Navn" : "Name"}</label>
              <Input
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder={isNb ? "Fullt navn" : "Full name"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">E-post</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="bruker@firma.no"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{isNb ? "Rolle" : "Role"}</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleRoles.map(role => (
                    <SelectItem key={role.key} value={role.key}>
                      <div className="flex items-center gap-2">
                        <span>{isNb ? role.labelNb : role.labelEn}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {isNb
                  ? getRoleDef(inviteRole).descNb
                  : getRoleDef(inviteRole).descEn}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" />
              {isNb ? "Send invitasjon" : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles dialog */}
      <Dialog open={manageRolesOpen} onOpenChange={setManageRolesOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {isNb ? "Administrer roller" : "Manage Roles"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Aktiver eller deaktiver roller som er tilgjengelige i organisasjonen. Deaktiverte roller vises ikke ved invitasjon."
                : "Enable or disable roles available in your organization. Disabled roles won't appear during invitation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {ALL_ROLES.map(role => {
              const Icon = role.icon;
              const active = isRoleActive(role.key);
              return (
                <div
                  key={role.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    active ? "border-border bg-card" : "border-transparent bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{isNb ? role.labelNb : role.labelEn}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{isNb ? role.descNb : role.descEn}</p>
                    </div>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={() => toggleRole(role.key)}
                    disabled={role.alwaysActive}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageRolesOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={saveActiveRoles} disabled={savingRoles}>
              {savingRoles
                ? (isNb ? "Lagrer..." : "Saving...")
                : (isNb ? "Lagre endringer" : "Save changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminAccessManagement;
