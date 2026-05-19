import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Users,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { CampaignWizardDialog, type CampaignDraft } from "@/components/msp/CampaignWizardDialog";

interface LaraProposal {
  id: string;
  customer: string;
  title: string;
  reason: string;
  channel: "email" | "phone";
  subject?: string;
  body: string;
}

const LARA_PROPOSALS: LaraProposal[] = [
  {
    id: "p1",
    customer: "Dintero AS",
    title: "Vennlig påminnelse – NIS2-tilbud",
    reason: "Truls åpnet tilbudet 7. mai, men har ikke svart på 8 dager.",
    channel: "email",
    subject: "Oppfølging: NIS2-klargjøring – tilbud sendt 4. mai",
    body:
      "Hei Truls,\n\nHåper alt vel. Jeg ville bare høre om du har hatt anledning til å se nærmere på tilbudet om NIS2-klargjøring jeg sendte 4. mai.\n\nSi gjerne fra om noe er uklart, eller om dere ønsker en kort gjennomgang før dere bestemmer dere.\n\nMvh\n[Ditt navn]",
  },
  {
    id: "p2",
    customer: "Catalystone Solutions",
    title: "Følg opp ISO 27001-tilbud på telefon",
    reason: "Tilbudet er over to uker gammelt. Påminnelse 7. mai uten respons.",
    channel: "phone",
    body:
      "Forslag til samtale:\n• Bekreft at de mottok tilbudet (180 000 kr, sendt 28. april).\n• Spør om budsjett og tidsplan stemmer.\n• Avklar om vi skal justere omfang eller pris.\n• Foreslå konkret oppstartsdato.",
  },
];

type Filter = "all" | "in" | "out" | "pending" | "accepted" | "rejected" | "campaigns";

interface SentCampaign {
  id: string;
  name: string;
  kind: "message" | "offer" | "reminder" | "claim";
  subject: string;
  body: string;
  sentAt: Date;
  recipients: {
    customerId: string;
    customerName: string;
    contactEmail?: string;
    status: "sent" | "opened" | "accepted" | "rejected";
  }[];
}
type ItemKind = "in" | "out";
type ItemStatus = "accepted" | "rejected" | "pending" | "message";

interface InboxItem {
  id: string;
  kind: ItemKind;
  status: ItemStatus;
  customer: string;
  title: string;
  meta: string;
  group: "today" | "earlier";
  unread?: boolean;
  laraSuggestion?: { text: string; cta: string; secondary?: string };
}

const ITEMS: InboxItem[] = [
  {
    id: "1",
    kind: "in",
    status: "accepted",
    customer: "Visma Software AS",
    title: "Tilbud akseptert",
    meta: "Penetrasjonstest · 85 000 kr · Oppstart 18. mai",
    group: "today",
    unread: true,
  },
  {
    id: "2",
    kind: "in",
    status: "message",
    customer: "Dintero AS",
    title: "Truls Andersen",
    meta: "Hei, har et spørsmål om NIS2-tilbudet du sendte i går…",
    group: "today",
    unread: true,
  },
  {
    id: "3",
    kind: "out",
    status: "pending",
    customer: "Dintero AS",
    title: "Tilbud sendt",
    meta: "NIS2-klargjøring · 112 500 kr · Sendt 4. mai (8 dager siden)",
    group: "earlier",
    laraSuggestion: {
      text: "Truls åpnet tilbudet 7. mai men har ikke svart. Vil du sende en vennlig påminnelse?",
      cta: "Send påminnelse",
      secondary: "Ikke nå",
    },
  },
  {
    id: "4",
    kind: "in",
    status: "rejected",
    customer: "Sparebank 1 Utvikling",
    title: "Tilbud avvist",
    meta: 'SOC 2-forberedelse · "Vi tar dette internt"',
    group: "earlier",
  },
  {
    id: "5",
    kind: "out",
    status: "pending",
    customer: "Catalystone Solutions",
    title: "Tilbud sendt",
    meta: "ISO 27001-klargjøring · 180 000 kr · Sendt 28. april (14 dager siden)",
    group: "earlier",
    laraSuggestion: {
      text: "Tilbudet er over to uker gammelt. Sendt påminnelse 7. mai uten respons.",
      cta: "Følg opp på telefon",
      secondary: "Avslutt",
    },
  },
];

function statusBadge(s: ItemStatus) {
  const map: Record<ItemStatus, { label: string; cls: string }> = {
    accepted: { label: "Akseptert", cls: "bg-success/10 text-success border-success/30" },
    rejected: { label: "Avvist", cls: "bg-muted text-muted-foreground border-border" },
    pending: { label: "Venter", cls: "bg-warning/10 text-warning border-warning/30" },
    message: { label: "Melding", cls: "bg-primary/10 text-primary border-primary/30" },
  };
  const m = map[s];
  return (
    <Badge variant="outline" className={cn("text-[10px]", m.cls)}>
      {m.label}
    </Badge>
  );
}

function KindIcon({ kind, status, customer }: { kind: ItemKind; status: ItemStatus; customer: string }) {
  if (status === "message") {
    return (
      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
        {customer.charAt(0)}
      </div>
    );
  }
  let Icon = Clock;
  let cls = "bg-warning/10 text-warning";
  if (status === "accepted") { Icon = CheckCircle2; cls = "bg-success/10 text-success"; }
  else if (status === "rejected") { Icon = XCircle; cls = "bg-muted text-muted-foreground"; }
  return (
    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", cls)}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

export default function MSPMessages() {
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [proposalsOpen, setProposalsOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(LARA_PROPOSALS.map(p => [p.id, true]))
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ p1: true });
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(LARA_PROPOSALS.map(p => [p.id, p.body]))
  );
  const [campaigns, setCampaigns] = useState<SentCampaign[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<Record<string, boolean>>({});

  // Inbox-/varslingsinnstillinger (persistert lokalt for nå)
  const SETTINGS_KEY = "msp-messages-settings-v1";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inboxEmail, setInboxEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [forwardEnabled, setForwardEnabled] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      setInboxEmail(s.inboxEmail ?? "");
      setCcEmail(s.ccEmail ?? "");
      setReplyToEmail(s.replyToEmail ?? "");
      setForwardEnabled(s.forwardEnabled ?? true);
      setDailyDigest(s.dailyDigest ?? false);
    } catch {}
  }, []);

  const handleSaveSettings = () => {
    if (inboxEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inboxEmail)) {
      toast.error("Ugyldig mottaks-e-post");
      return;
    }
    if (ccEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
      toast.error("Ugyldig kopi-e-post");
      return;
    }
    if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
      toast.error("Ugyldig svar-til-e-post");
      return;
    }
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ inboxEmail, ccEmail, replyToEmail, forwardEnabled, dailyDigest }),
    );
    setSettingsOpen(false);
    toast.success("Innstillinger lagret", {
      description: inboxEmail ? `E-post sendes til ${inboxEmail}` : undefined,
    });
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleSendAll = () => {
    setProposalsOpen(false);
    toast.success(`${selectedCount} påminnelse${selectedCount === 1 ? "" : "r"} sendt`, {
      description: "Lara har lagt oppfølgingen i loggen.",
    });
  };

  const handleCampaignSend = (draft: CampaignDraft) => {
    const campaign: SentCampaign = {
      id: `camp-${Date.now()}`,
      name: draft.name,
      kind: draft.kind,
      subject: draft.subject,
      body: draft.body,
      sentAt: new Date(),
      recipients: draft.recipients.map((c) => ({
        customerId: c.id,
        customerName: c.name,
        contactEmail: c.contactEmail,
        status: "sent" as const,
      })),
    };
    setCampaigns((prev) => [campaign, ...prev]);
    setExpandedCampaign((prev) => ({ ...prev, [campaign.id]: false }));
    toast.success(`Kampanje sendt til ${draft.recipients.length} kunder`, {
      description: draft.name,
    });
  };

  const filtered = ITEMS.filter(i => {
    if (filter === "all") return true;
    if (filter === "in") return i.kind === "in";
    if (filter === "out") return i.kind === "out";
    if (filter === "pending") return i.status === "pending";
    if (filter === "accepted") return i.status === "accepted";
    if (filter === "rejected") return i.status === "rejected";
    if (filter === "campaigns") return false; // kampanjer rendres separat
    return true;
  });

  const today = filter === "campaigns" ? [] : filtered.filter(i => i.group === "today");
  const earlier = filter === "campaigns" ? [] : filtered.filter(i => i.group === "earlier");

  const stats = {
    pending: ITEMS.filter(i => i.status === "pending").length,
    accepted: ITEMS.filter(i => i.status === "accepted").length,
    rejected: ITEMS.filter(i => i.status === "rejected").length,
    unread: ITEMS.filter(i => i.unread).length,
  };

  const filters: { value: Filter; label: string; icon?: any; count: number }[] = [
    { value: "all", label: "Alle", count: ITEMS.length },
    { value: "in", label: "Innkommende", icon: ArrowDownLeft, count: ITEMS.filter(i => i.kind === "in").length },
    { value: "out", label: "Utgående", icon: ArrowUpRight, count: ITEMS.filter(i => i.kind === "out").length },
    { value: "pending", label: "Tilbud venter", count: stats.pending },
    { value: "accepted", label: "Akseptert", count: stats.accepted },
    { value: "rejected", label: "Avvist", count: stats.rejected },
    { value: "campaigns", label: "Kampanjer", icon: Megaphone, count: campaigns.length },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Innboks på tvers av kunder</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Tilbud, svar og meldinger fra alle dine kunder samlet på ett sted.
              </p>
              {inboxEmail && (
                <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Svar fra kunder videresendes til <span className="font-medium text-foreground">{inboxEmail}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-3.5 w-3.5" />
                Innstillinger
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
                <Megaphone className="h-3.5 w-3.5" />
                Ny kampanje
              </Button>
            </div>
          </div>

          {/* Lara banner */}
          {!dismissedBanner && (
            <Card className="p-4 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Lara har en anbefaling til deg</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Du har 2 tilbud som har ventet over en uke. Vil du sende påminnelser?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" className="h-8" onClick={() => setProposalsOpen(true)}>
                    Vis forslag
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDismissedBanner(true)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Ikke nå
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map(f => {
              const active = filter === f.value;
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "h-8 pl-3 pr-2 rounded-full border text-[12px] flex items-center gap-1.5 transition-colors",
                    active
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {f.label}
                  <span
                    className={cn(
                      "ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-medium tabular-nums flex items-center justify-center",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <Card className="overflow-hidden">
            {campaigns.length > 0 && (filter === "all" || filter === "campaigns" || filter === "out") && (
              <>
                <GroupHeader label="Kampanjer" />
                {campaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    expanded={!!expandedCampaign[c.id]}
                    onToggle={() =>
                      setExpandedCampaign((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                    }
                  />
                ))}
              </>
            )}
            {today.length > 0 && <GroupHeader label="I dag" />}
            {today.map(item => <Row key={item.id} item={item} />)}
            {earlier.length > 0 && <GroupHeader label="Tidligere" />}
            {earlier.map(item => <Row key={item.id} item={item} />)}
            {filter === "campaigns" && campaigns.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Ingen kampanjer sendt ennå. Klikk «Ny kampanje» for å starte.
              </div>
            )}
            {filter !== "campaigns" && filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Ingen meldinger i denne visningen.
              </div>
            )}
          </Card>
        </div>
      </main>

      <CampaignWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSend={handleCampaignSend}
      />

      <Dialog open={proposalsOpen} onOpenChange={setProposalsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <DialogTitle className="text-base">Laras forslag til oppfølging</DialogTitle>
            </div>
            <DialogDescription className="text-[13px]">
              Lara har laget utkast for {LARA_PROPOSALS.length} oppfølginger. Velg hvilke du vil sende, juster teksten, og send samlet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
            {LARA_PROPOSALS.map(p => {
              const isOpen = expanded[p.id];
              const isChecked = !!selected[p.id];
              const ChannelIcon = p.channel === "email" ? Mail : Phone;
              return (
                <Card key={p.id} className={cn("p-3 transition-colors", isChecked ? "border-primary/30" : "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) => setSelected(s => ({ ...s, [p.id]: !!v }))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">{p.title}</p>
                        <Badge variant="outline" className="text-[10px]">{p.customer}</Badge>
                      </div>
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-[12px] text-muted-foreground">
                          <span className="font-medium text-foreground">Hvorfor:</span> {p.reason}
                        </p>
                      </div>

                      {isOpen && (
                        <div className="mt-3 space-y-2">
                          {p.subject && (
                            <div className="text-[12px]">
                              <span className="text-muted-foreground">Emne: </span>
                              <span className="font-medium text-foreground">{p.subject}</span>
                            </div>
                          )}
                          <Textarea
                            value={drafts[p.id]}
                            onChange={(e) => setDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                            className="text-[12px] min-h-[140px] font-mono"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpanded(e => ({ ...e, [p.id]: !isOpen }))}
                        className="mt-2 text-[12px] text-primary hover:underline flex items-center gap-1"
                      >
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isOpen ? "Skjul utkast" : "Vis og rediger utkast"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <DialogFooter className="flex-row sm:justify-between items-center gap-2 border-t pt-3">
            <p className="text-[12px] text-muted-foreground">
              {selectedCount} av {LARA_PROPOSALS.length} valgt
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setProposalsOpen(false)}>
                Avbryt
              </Button>
              <Button size="sm" disabled={selectedCount === 0} onClick={handleSendAll}>
                Send {selectedCount > 0 ? `(${selectedCount})` : ""}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </div>
      <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</p>
    </Card>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-muted/40 border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
      {label}
    </div>
  );
}

function Row({ item }: { item: InboxItem }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => toast.info(item.title, { description: item.customer })}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <KindIcon kind={item.kind} status={item.status} customer={item.customer} />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{item.title}</span>
            <span className="text-muted-foreground"> · {item.customer}</span>
          </p>
          <p className="text-[12px] text-muted-foreground truncate">{item.meta}</p>
        </div>
        {statusBadge(item.status)}
      </button>
      {item.laraSuggestion && (
        <div className="flex items-start gap-2.5 px-4 py-2.5 bg-primary/5 border-t border-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[12px] text-foreground flex-1">
            <span className="font-medium">Lara foreslår:</span> {item.laraSuggestion.text}
          </p>
          <Button
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => toast.success(item.laraSuggestion!.cta, { description: item.customer })}
          >
            {item.laraSuggestion.cta}
          </Button>
          {item.laraSuggestion.secondary && (
            <button className="text-[12px] text-muted-foreground hover:text-foreground px-1 shrink-0">
              {item.laraSuggestion.secondary}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  expanded,
  onToggle,
}: {
  campaign: SentCampaign;
  expanded: boolean;
  onToggle: () => void;
}) {
  const kindLabel =
    campaign.kind === "offer" ? "Tilbud" : campaign.kind === "reminder" ? "Påminnelse" : "Melding";
  const sentLabel = campaign.sentAt.toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const respondedCount = campaign.recipients.filter(
    (r) => r.status === "accepted" || r.status === "rejected",
  ).length;
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Megaphone className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{campaign.name}</span>
            <span className="text-muted-foreground"> · {kindLabel} · sendt {sentLabel}</span>
          </p>
          <p className="text-[12px] text-muted-foreground truncate flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {campaign.recipients.length} mottaker{campaign.recipients.length === 1 ? "" : "e"}
            {" · "}
            {respondedCount} svar
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
          Kampanje
        </Badge>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="bg-muted/20 border-t border-border px-4 py-2 space-y-1">
          {campaign.recipients.map((r) => (
            <div
              key={r.customerId}
              className="flex items-center gap-2 text-[12px] text-foreground py-1"
            >
              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{r.customerName}</span>
              {r.contactEmail && (
                <span className="text-muted-foreground">· {r.contactEmail}</span>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "ml-auto text-[10px]",
                  r.status === "accepted"
                    ? "bg-success/10 text-success border-success/30"
                    : r.status === "rejected"
                      ? "bg-muted text-muted-foreground"
                      : r.status === "opened"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-warning/10 text-warning border-warning/30",
                )}
              >
                {r.status === "sent"
                  ? "Sendt"
                  : r.status === "opened"
                    ? "Åpnet"
                    : r.status === "accepted"
                      ? "Akseptert"
                      : "Avvist"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
