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
import {
  Settings,
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Shield,
  CreditCard,
  ChevronRight,
  Save,
  Info,
  
  Layers,
  Plug,
  Receipt,
} from "lucide-react";
import { PartnerTaxCard } from "@/components/msp/PartnerTaxCard";
import { PartnerIntegrationsTab } from "@/components/msp/PartnerIntegrationsTab";
import {
  PARTNER_MODULES,
  getEnabledPartnerModules,
  setPartnerModuleEnabled,
  type PartnerModuleKey,
} from "@/lib/partnerModules";
import { toast } from "sonner";


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

import { PARTNER_TEAM, type PartnerTeamMember } from "@/lib/partnerTeam";
type TeamMember = PartnerTeamMember;
const DEMO_TEAM = PARTNER_TEAM;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function MSPPartnerSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "generelt";
  const [form, setForm] = useState<ForwardSettings>(defaults);
  const [team] = useState<TeamMember[]>(DEMO_TEAM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Partner-rådgiver" as TeamMember["role"] });
  const [inviteTerms, setInviteTerms] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [enabledModules, setEnabledModules] = useState<PartnerModuleKey[]>(() => getEnabledPartnerModules());

  const handleToggleModule = (key: PartnerModuleKey, enabled: boolean) => {
    setPartnerModuleEnabled(key, enabled);
    setEnabledModules(getEnabledPartnerModules());
    toast.success(enabled ? "Modul aktivert i Compliance-menyen" : "Modul fjernet fra Compliance-menyen");
  };

  const inviteValid = invite.name.trim().length > 0 && isValidEmail(invite.email);

  const handleSendInvite = () => {
    if (!inviteValid) return;
    setInviteLoading(true);
    setTimeout(() => {
      setInviteLoading(false);
      setInviteOpen(false);
      toast.success(`Invitasjon sendt til ${invite.email}`, {
        description: "Brukeren får tilgang så snart invitasjonen aksepteres.",
      });
      setInvite({ name: "", email: "", role: "Partner-rådgiver" });
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
            <h1 className="text-2xl font-semibold text-foreground">Innstillinger</h1>
            <p className="text-base text-muted-foreground mt-1">
              Administrer tilgang og varsler for partnerdelen av Mynder.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4">
            <TabsList className="h-10">
              <TabsTrigger value="generelt" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Generelt
              </TabsTrigger>
              <TabsTrigger value="integrasjoner" className="gap-1.5">
                <Plug className="h-3.5 w-3.5" /> Integrasjoner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generelt" className="space-y-4">
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
                        Disse brukerne kan se kundeporteføljen, sende tilbud og motta meldinger.
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

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-semibold text-foreground tabular-nums">{team.length}</span>
                  <span className="text-base text-muted-foreground">
                    {team.length === 1 ? "bruker" : "brukere"} har tilgang
                  </span>
                </div>

                <div className="rounded-xl border border-border divide-y divide-border">
                  {team.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          m.role === "Partner-admin"
                            ? "bg-primary/5 text-primary border-primary/30 text-xs"
                            : "text-xs"
                        }
                      >
                        <Shield className="h-3 w-3 mr-1" /> {m.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 2. E-postvideresending */}
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

              {/* 3. Andre moduler — aktivering for Compliance-menyen */}
              <Card className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Andre moduler</h2>
                    <p className="text-base text-muted-foreground mt-0.5">
                      Som partner ser du som standard kun Trust Center, Regelverk og Meldinger
                      under «Min organisasjon – Compliance og styring». Aktiver flere moduler her
                      hvis du også vil bruke dem på din egen virksomhet.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {PARTNER_MODULES.map((m) => {
                    const enabled = enabledModules.includes(m.key);
                    return (
                      <div
                        key={m.key}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{m.labelNb}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{m.descNb}</p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => handleToggleModule(m.key, v)}
                          aria-label={`Aktiver ${m.labelNb}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>

              <PartnerTaxCard />

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


              {/* 4. Lenke til fakturering */}
              <Card className="p-0 overflow-hidden">
                <Link
                  to="/msp-billing"
                  className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-foreground/70" />
                  </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-foreground">Fakturering og adresse</p>
                      <p className="text-base text-muted-foreground">
                        Faktura-e-post, EHF, organisasjonsnummer og betalingsmetode.
                      </p>
                    </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
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
              <div className="space-y-1.5 col-span-2">
                <Label className="text-base">Rolle</Label>
                <Select
                  value={invite.role}
                  onValueChange={(v) => setInvite({ ...invite, role: v as TeamMember["role"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner-rådgiver">Partner-rådgiver</SelectItem>
                    <SelectItem value="Partner-admin">Partner-admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
    </div>
  );
}
