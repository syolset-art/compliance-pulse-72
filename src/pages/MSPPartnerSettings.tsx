import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const SEAT_PRICE_KR_PER_MONTH = 490;

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Partner-rådgiver" as TeamMember["role"] });
  const [inviteTerms, setInviteTerms] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const inviteValid = invite.name.trim().length > 0 && isValidEmail(invite.email);

  const handleSendInvite = () => {
    if (!inviteValid || !inviteTerms) return;
    setInviteLoading(true);
    setTimeout(() => {
      setInviteLoading(false);
      setInviteOpen(false);
      toast.success(`Invitasjon sendt til ${invite.email}`, {
        description: `Ny seat aktiveres ved aksept. Du faktureres ${SEAT_PRICE_KR_PER_MONTH} kr/mnd ekstra fra neste faktura.`,
      });
      setInvite({ name: "", email: "", role: "Partner-rådgiver" });
      setInviteTerms(false);
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
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Inviter bruker
              </Button>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-semibold text-foreground tabular-nums">{team.length}</span>
              <span className="text-[13px] text-muted-foreground">
                {team.length === 1 ? "bruker" : "brukere"} har tilgang
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Hver ekstra bruker koster <span className="font-medium text-foreground">{SEAT_PRICE_KR_PER_MONTH} kr/mnd</span> og legges på neste faktura. Du må godkjenne vilkårene før en ny invitasjon sendes.
            </p>


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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inviter ny bruker til partnerdelen</DialogTitle>
            <DialogDescription>
              Den nye brukeren får tilgang til kundeportefølje, tilbud og meldinger så snart invitasjonen aksepteres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Pris-boks – tydelig opp-front */}
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-foreground">Du legger til 1 ekstra bruker</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Faktureres månedlig, fra og med neste faktura.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    +{SEAT_PRICE_KR_PER_MONTH} kr
                  </p>
                  <p className="text-[10px] text-muted-foreground -mt-0.5">per måned</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="inv-name" className="text-[12px]">Navn</Label>
                <Input
                  id="inv-name"
                  placeholder="Ola Nordmann"
                  value={invite.name}
                  onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="inv-email" className="text-[12px]">E-post</Label>
                <Input
                  id="inv-email"
                  type="email"
                  placeholder="navn@firma.no"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[12px]">Rolle</Label>
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

            {/* Hva skjer */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-[12px] font-medium text-foreground">Slik fungerer det:</p>
              <ul className="space-y-1.5">
                {[
                  "Brukeren får e-post med invitasjonslenke.",
                  `Seat aktiveres ved aksept — ${SEAT_PRICE_KR_PER_MONTH} kr/mnd fra neste faktura.`,
                  "Fjern brukeren når som helst — fakturering stopper ved neste periode.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vilkår */}
            <div className="space-y-2">
              <Label className="text-[12px] font-medium">Vilkår for ekstra bruker</Label>
              <ScrollArea className="h-28 rounded-lg border bg-muted/30 p-3">
                <div className="text-[11px] text-muted-foreground space-y-2 pr-2">
                  <p>
                    Ved å invitere en ny bruker bekrefter du at partnerorganisasjonen aksepterer et månedlig
                    tillegg på {SEAT_PRICE_KR_PER_MONTH} kr per aktiv seat. Beløpet legges automatisk på neste
                    faktura og videreføres så lenge brukeren er aktiv.
                  </p>
                  <p>
                    Prisene kan reguleres årlig i samsvar med konsumprisindeksen per 31. desember. Endringer
                    varsles senest én måned før de trer i kraft.
                  </p>
                  <p>
                    Fjerning av brukere stopper fakturering ved utløp av inneværende periode — ingen refusjon
                    for delperioder.
                  </p>
                </div>
              </ScrollArea>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="invite-terms"
                  checked={inviteTerms}
                  onCheckedChange={(c) => setInviteTerms(c === true)}
                  className="mt-0.5"
                />
                <label htmlFor="invite-terms" className="text-[12px] cursor-pointer leading-snug">
                  Jeg bekrefter at jeg har fullmakt til å legge til en ekstra bruker og godkjenner det
                  månedlige tillegget på {SEAT_PRICE_KR_PER_MONTH} kr.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Avbryt</Button>
            <Button onClick={handleSendInvite} disabled={!inviteValid || !inviteTerms || inviteLoading}>
              {inviteLoading ? "Sender..." : "Send invitasjon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
