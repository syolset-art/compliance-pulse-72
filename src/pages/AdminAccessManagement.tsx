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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, UserPlus, Shield, Mail, Clock, CheckCircle2, Crown, Eye, Settings, Pencil,
  AlertTriangle, Bot, Leaf, ClipboardCheck, MonitorCog, GraduationCap, Truck, FileSearch,
  Lock, User, Trash2, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
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
  { id: "1", name: "Kari Nordmann", email: "kari@acme.no", roles: ["admin"], status: "active", lastSeen: "I dag" },
  { id: "2", name: "Synne Olsetten", email: "synne@acme.no", roles: ["compliance_officer", "internal_auditor"], status: "active", lastSeen: "I går" },
  { id: "3", name: "Sebastian Hernandez", email: "sebastian@acme.no", roles: ["ciso", "incident_manager"], status: "active", lastSeen: "3 dager siden" },
  { id: "4", name: "Ingrid Solvang", email: "ingrid@acme.no", roles: ["dpo"], status: "active", lastSeen: "I dag" },
  { id: "5", name: "Truls Kristoffersen", email: "truls@acme.no", roles: ["data_controller", "vendor_manager"], status: "active", lastSeen: "2 dager siden" },
  { id: "6", name: "Synnøve Olset", email: "synnove@acme.no", roles: ["it_manager"], status: "active", lastSeen: "I dag" },
  { id: "7", name: "Line Berg", email: "line@acme.no", roles: ["member"], status: "invited" },
];

const AdminAccessManagement = () => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageRolesOpen, setManageRolesOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["member"]);
  const [members, setMembers] = useState<TeamMember[]>(DEMO_MEMBERS);
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
    if (inviteRoles.length === 0) {
      toast.error(isNb ? "Velg minst én rolle" : "Select at least one role");
      return;
    }
    const newMember: TeamMember = {
      id: `inv-${Date.now()}`,
      name: inviteName || inviteEmail.split("@")[0],
      email: inviteEmail,
      roles: inviteRoles,
      status: "invited",
    };
    setMembers(prev => [...prev, newMember]);
    toast.success(isNb ? `Invitasjon sendt til ${inviteEmail}` : `Invitation sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteName("");
    setInviteRoles(["member"]);
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
                  {t("nav.accessManagement")}
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
                    const assigned = members.filter(m => m.roles.includes(role.key) && m.status !== "deactivated");
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
                          <p className="text-[13px] text-muted-foreground leading-snug">{isNb ? role.descNb : role.descEn}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {assigned.length > 0 ? (
                              <Badge variant="secondary" className="text-[13px]">
                                {assigned.length} {isNb ? "tildelt" : "assigned"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[13px] text-warning border-warning/30">
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
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {isNb ? "Teammedlemmer" : "Team Members"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="active" className="w-full">
                  <div className="px-5 pb-3">
                    <TabsList>
                      <TabsTrigger value="active" className="gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isNb ? "Aktive" : "Active"}
                        <Badge variant="secondary" className="ml-1 text-[12px]">
                          {members.filter(m => m.status === "active").length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="invited" className="gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {isNb ? "Inviterte" : "Invited"}
                        <Badge variant="secondary" className="ml-1 text-[12px]">
                          {members.filter(m => m.status === "invited").length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {(["active", "invited"] as const).map(tab => (
                    <TabsContent key={tab} value={tab} className="mt-0">
                      <div className="divide-y divide-border border-t border-border">
                        {members.filter(m => m.status === tab).length === 0 && (
                          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                            {tab === "invited"
                              ? (isNb ? "Ingen ventende invitasjoner." : "No pending invitations.")
                              : (isNb ? "Ingen aktive brukere." : "No active users.")}
                          </div>
                        )}
                        {members.filter(m => m.status === tab).map(member => (
                          <div key={member.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-foreground truncate block">{member.name}</span>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Role chips + multi-select popover */}
                              <div className="flex flex-wrap items-center gap-1.5 justify-end max-w-[420px]">
                                {member.roles.map(rk => {
                                  const def = getRoleDef(rk);
                                  const RIcon = def.icon;
                                  return (
                                    <Badge
                                      key={rk}
                                      variant="secondary"
                                      className="gap-1 text-[12px] font-medium pl-1.5 pr-2 py-0.5"
                                    >
                                      <RIcon className="h-3 w-3 text-primary" />
                                      {isNb ? def.labelNb : def.labelEn}
                                    </Badge>
                                  );
                                })}
                                {member.roles.length === 0 && (
                                  <span className="text-[12px] text-muted-foreground italic">
                                    {isNb ? "Ingen rolle" : "No role"}
                                  </span>
                                )}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[12px] text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/50"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      {isNb ? "Endre" : "Edit"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-72 p-2">
                                    <div className="px-2 py-1.5">
                                      <p className="text-xs font-semibold text-foreground">
                                        {isNb ? "Roller for" : "Roles for"} {member.name}
                                      </p>
                                      <p className="text-[12px] text-muted-foreground">
                                        {isNb ? "En bruker kan ha flere roller." : "A user can hold multiple roles."}
                                      </p>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto pt-1">
                                      {visibleRoles.map(r => {
                                        const checked = member.roles.includes(r.key);
                                        return (
                                          <label
                                            key={r.key}
                                            className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(v) => {
                                                const next = v
                                                  ? [...member.roles, r.key]
                                                  : member.roles.filter(x => x !== r.key);
                                                setMembers(prev => prev.map(m => m.id === member.id ? { ...m, roles: next } : m));
                                                if (v && r.key === "admin") {
                                                  toast.warning(
                                                    isNb
                                                      ? `${member.name} har nå Administrator — full tilgang.`
                                                      : `${member.name} is now Administrator — full access.`
                                                  );
                                                } else {
                                                  toast.success(
                                                    isNb
                                                      ? `Roller oppdatert for ${member.name}`
                                                      : `Roles updated for ${member.name}`
                                                  );
                                                }
                                              }}
                                              className="mt-0.5"
                                            />
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium leading-tight">
                                                {isNb ? r.labelNb : r.labelEn}
                                              </p>
                                              <p className="text-[12px] text-muted-foreground leading-snug">
                                                {isNb ? r.descNb : r.descEn}
                                              </p>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    aria-label={isNb ? "Slett bruker" : "Delete user"}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {isNb ? `Slett ${member.name}?` : `Delete ${member.name}?`}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {isNb
                                        ? `Brukeren mister umiddelbart tilgang til organisasjonen. Tildelte oppgaver og data beholdes, men må reallokeres. Dette kan ikke angres.`
                                        : `The user immediately loses access to the organization. Assigned tasks and data are retained but must be reassigned. This cannot be undone.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{isNb ? "Avbryt" : "Cancel"}</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => {
                                        setMembers(prev => prev.filter(m => m.id !== member.id));
                                        toast.success(
                                          isNb
                                            ? `${member.name} er fjernet fra organisasjonen`
                                            : `${member.name} has been removed from the organization`
                                        );
                                      }}
                                    >
                                      {isNb ? "Slett bruker" : "Delete user"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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
                    <span className="text-[13px] text-muted-foreground">
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
                      const assigned = members.filter(m => m.roles.includes(r.role) && m.status !== "deactivated");
                      return (
                        <div key={r.role} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded bg-primary/10">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{isNb ? r.nb : r.en}</p>
                              <p className="text-[13px] text-muted-foreground">{isNb ? r.descNb : r.descEn}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[13px] shrink-0">
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
                    <span className="text-[13px] text-muted-foreground">
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
                      const assigned = members.filter(m => m.roles.includes(r.role) && m.status !== "deactivated");
                      return (
                        <div key={r.role} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1 rounded bg-muted">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{isNb ? r.nb : r.en}</p>
                              <p className="text-[13px] text-muted-foreground">{isNb ? r.descNb : r.descEn}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[13px] shrink-0">
                            {assigned.length} {isNb ? "tildelt" : "assigned"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
              <label className="text-xs font-medium text-foreground">
                {isNb ? "Roller" : "Roles"}
                <span className="text-muted-foreground font-normal ml-1">
                  ({isNb ? "én eller flere" : "one or more"})
                </span>
              </label>
              <div className="max-h-56 overflow-y-auto rounded-md border border-border p-1">
                {visibleRoles.map(role => {
                  const checked = inviteRoles.includes(role.key);
                  return (
                    <label
                      key={role.key}
                      className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setInviteRoles(prev =>
                            v ? [...prev, role.key] : prev.filter(r => r !== role.key)
                          );
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{isNb ? role.labelNb : role.labelEn}</p>
                        <p className="text-[12px] text-muted-foreground leading-snug">{isNb ? role.descNb : role.descEn}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
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

      {/* Manage Roles side sheet */}
      <Sheet open={manageRolesOpen} onOpenChange={setManageRolesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {isNb ? "Administrer roller" : "Manage Roles"}
            </SheetTitle>
            <SheetDescription>
              {isNb
                ? "Aktiver eller deaktiver roller som er tilgjengelige i organisasjonen. Deaktiverte roller vises ikke ved invitasjon."
                : "Enable or disable roles available in your organization. Disabled roles won't appear during invitation."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
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
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{isNb ? role.labelNb : role.labelEn}</p>
                      <p className="text-[13px] text-muted-foreground leading-snug">{isNb ? role.descNb : role.descEn}</p>
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

          <SheetFooter className="px-6 py-4 border-t border-border bg-background">
            <Button variant="outline" onClick={() => setManageRolesOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={saveActiveRoles} disabled={savingRoles}>
              {savingRoles
                ? (isNb ? "Lagrer..." : "Saving...")
                : (isNb ? "Lagre endringer" : "Save changes")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </SidebarProvider>
  );
};

export default AdminAccessManagement;
