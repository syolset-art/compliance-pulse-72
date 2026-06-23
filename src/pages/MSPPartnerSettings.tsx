import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  ImageIcon,
  Layers,
  Plug,
} from "lucide-react";
import { PartnerIntegrationsTab } from "@/components/msp/PartnerIntegrationsTab";
import {
  PARTNER_MODULES,
  getEnabledPartnerModules,
  setPartnerModuleEnabled,
  type PartnerModuleKey,
} from "@/lib/partnerModules";
import { toast } from "sonner";
import { PartnerBrandingCard } from "@/components/msp/PartnerBrandingCard";

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

          <Tabs defaultValue="generelt" className="space-y-4">
            <TabsList className="h-10">
              <TabsTrigger value="generelt" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Generelt
              </TabsTrigger>
              <TabsTrigger value="tilbudsmerking" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Tilbudsmal
              </TabsTrigger>
              <TabsTrigger value="integrasjoner" className="gap-1.5">
                <Plug className="h-3.5 w-3.5" /> Integrasjoner
              </TabsTrigger>
            </TabsList>

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
