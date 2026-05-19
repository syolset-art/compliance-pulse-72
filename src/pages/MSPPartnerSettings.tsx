import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Shield,
  CreditCard,
  ChevronRight,
  Save,
  Info,
} from "lucide-react";
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Partner-admin" | "Partner-rådgiver";
  initials: string;
}

// Demo-team. Erstattes med user_roles-spørring når invitasjonsflyt er på plass.
const DEMO_TEAM: TeamMember[] = [
  { id: "u1", name: "Truls Berg", email: "truls@dintero.no", role: "Partner-admin", initials: "TB" },
  { id: "u2", name: "Maja Solheim", email: "maja@dintero.no", role: "Partner-rådgiver", initials: "MS" },
  { id: "u3", name: "Erik Hansen", email: "erik@dintero.no", role: "Partner-rådgiver", initials: "EH" },
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function MSPPartnerSettings() {
  const [form, setForm] = useState<ForwardSettings>(defaults);
  const [team] = useState<TeamMember[]>(DEMO_TEAM);

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
    if (form.ccEmail && !isValidEmail(form.ccEmail)) {
      toast.error("Ugyldig kopi-e-post");
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
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Tilbake til partner-dashbord
            </Link>
            <h1 className="text-2xl font-semibold text-foreground">Innstillinger</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Administrer tilgang og varsler for partnerdelen av Mynder.
            </p>
          </div>

          {/* 1. Team-tilgang */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Brukere med tilgang til partnerdelen</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Disse brukerne kan se kundeporteføljen, sende tilbud og motta meldinger.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  toast.info("Invitasjonsflyt kommer", {
                    description: "Vi kobler dette mot rolleadministrasjon i neste iterasjon.",
                  })
                }
              >
                <UserPlus className="h-3.5 w-3.5" /> Inviter bruker
              </Button>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-semibold text-foreground tabular-nums">{team.length}</span>
              <span className="text-[13px] text-muted-foreground">
                {team.length === 1 ? "bruker" : "brukere"} har tilgang
              </span>
            </div>

            <div className="rounded-xl border border-border divide-y divide-border">
              {team.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[12px] font-medium text-foreground shrink-0">
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      m.role === "Partner-admin"
                        ? "bg-primary/5 text-primary border-primary/30 text-[10px]"
                        : "text-[10px]"
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
                <h2 className="text-sm font-semibold text-foreground">Videresend meldinger til e-post</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Du får alt — kundesvar, aksepterte tilbud, påminnelser — rett i innboksen din. Slipp å
                  logge inn i Mynder for å holde deg oppdatert.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    Videresend alle innkommende meldinger
                  </p>
                  <p className="text-[11px] text-muted-foreground">
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
                  <Label htmlFor="inbox" className="text-[12px]">
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
                  <p className="text-[11px] text-muted-foreground">
                    Alle nye meldinger sendes hit som e-post.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cc" className="text-[12px]">
                    Kopi (CC) <span className="text-muted-foreground font-normal">— valgfritt</span>
                  </Label>
                  <Input
                    id="cc"
                    type="email"
                    placeholder="team@firma.no"
                    value={form.ccEmail}
                    onChange={(e) => update("ccEmail", e.target.value)}
                    disabled={!form.forwardEnabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reply" className="text-[12px]">
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


              <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border p-3 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
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

          {/* 3. Lenke til fakturering */}
          <Card className="p-0 overflow-hidden">
            <Link
              to="/msp-billing"
              className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">Fakturering og adresse</p>
                <p className="text-[12px] text-muted-foreground">
                  Faktura-e-post, EHF, organisasjonsnummer og betalingsmetode.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
