import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Building2, Sparkles, ShieldCheck, Send, Archive, Mail, User, UserPlus, ExternalLink, Shield, Pencil, Check, X, Copy, Briefcase, Globe, Info } from "lucide-react";
import { COMPANY_ROLES } from "@/lib/mspCustomerConstants";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { PARTNER_TEAM, getAccountManagerOverride, setAccountManagerOverride } from "@/lib/partnerTeam";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomerLike {
  id: string;
  customer_name: string;
  industry?: string | null;
  employees?: string | null;
  logo_url?: string | null;
  compliance_score?: number | null;
  active_frameworks?: string[] | null;
  status?: string | null;
  subscription_plan?: string | null;
  org_number?: string | null;
  url?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_company_role?: string | null;
  account_manager?: string | null;
  onboarding_completed?: boolean | null;
  last_activity_at?: string | null;
  business_description?: string | null;
}

type StatusKey = "draft" | "invited" | "claimed" | "archived";
interface StatusMeta {
  key: StatusKey;
  stripeLabel: string;
  stripeBg: string;
  stripeText: string;
  tone: "warning" | "primary" | "success" | "muted";
}
const STATUS_MAP: Record<StatusKey, StatusMeta> = {
  draft:    { key: "draft",    stripeLabel: "KUNDE · UTKAST",     stripeBg: "bg-vendor-draft",    stripeText: "text-vendor-draft-foreground",    tone: "primary" },
  invited:  { key: "invited",  stripeLabel: "KUNDE · ONBOARDING", stripeBg: "bg-vendor-invited",  stripeText: "text-vendor-invited-foreground",  tone: "warning" },
  claimed:  { key: "claimed",  stripeLabel: "KUNDE · AKTIV",      stripeBg: "bg-vendor-claimed",  stripeText: "text-vendor-claimed-foreground",  tone: "success" },
  archived: { key: "archived", stripeLabel: "KUNDE · INAKTIV",    stripeBg: "bg-vendor-archived", stripeText: "text-vendor-archived-foreground", tone: "muted" },
};

function deriveStatus(c: CustomerLike): StatusMeta {
  if (c.status === "inactive") return STATUS_MAP.archived;
  // Onboarding completed → kunden er claimet (aktiv), uavhengig av status-felt
  if (c.onboarding_completed) return STATUS_MAP.claimed;
  if (c.status === "active") return STATUS_MAP.claimed;
  if (c.status === "onboarding") return STATUS_MAP.invited;
  return STATUS_MAP.draft;
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}

function Donut({ score, tone }: { score: number; tone: StatusMeta["tone"] }) {
  const has = score > 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const strokeColor =
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.3)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        {has && (
          <circle cx="28" cy="28" r={radius} fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} />
        )}
      </svg>
      <span className={cn(
        "absolute text-[13px] font-bold tabular-nums leading-none",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "primary" && "text-primary",
        !has && "text-muted-foreground",
      )}>
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

function InitialAvatar({ name, color = "bg-primary/15 text-primary" }: { name: string; color?: string }) {
  const initials = name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold", color)}>
      {initials || "?"}
    </span>
  );
}

export function CustomerStatusBanner({ customer, actionSlot, onUpdate }: { customer: CustomerLike; actionSlot?: React.ReactNode; onUpdate?: () => void }) {
  const navigate = useNavigate();
  const status = deriveStatus(customer);
  const score = customer.compliance_score || 0;

  const [assignOpen, setAssignOpen] = useState(false);
  const [accountManager, setAccountManager] = useState<string | null>(
    customer.account_manager ?? getAccountManagerOverride(customer.id),
  );
  useEffect(() => {
    setAccountManager(customer.account_manager ?? getAccountManagerOverride(customer.id));
  }, [customer.id, customer.account_manager]);

  const handleAssign = async (name: string) => {
    const { error } = await supabase
      .from("msp_customers")
      .update({ account_manager: name })
      .eq("id", customer.id);
    if (error) {
      toast.error("Kunne ikke lagre ansvarlig");
      return;
    }
    setAccountManagerOverride(customer.id, name);
    setAccountManager(name);
    setAssignOpen(false);
    toast.success(`${name} er satt som ansvarlig`);
    onUpdate?.();
  };

  // Inline edit state for contact fields
  type Field = "name" | "email" | "role" | "url" | "description";
  const [editField, setEditField] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [urlErr, setUrlErr] = useState<string | null>(null);
  const [emailPopOpen, setEmailPopOpen] = useState(false);
  const [rolePopOpen, setRolePopOpen] = useState(false);

  const saveRoleValue = async (value: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("msp_customers")
      .update({ contact_company_role: value })
      .eq("id", customer.id);
    setSaving(false);
    setRolePopOpen(false);
    if (error) {
      toast.error("Kunne ikke lagre rolle");
      return;
    }
    toast.success(value ? "Rolle oppdatert" : "Rolle fjernet");
    onUpdate?.();
  };

  const startEdit = (f: Field) => {
    setEmailErr(null);
    setUrlErr(null);
    setDraft(
      f === "name" ? (customer.contact_person || "") :
      f === "email" ? (customer.contact_email || "") :
      f === "url" ? (customer.url || "") :
      f === "description" ? (customer.business_description || "") :
      (customer.contact_company_role || "")
    );
    setEditField(f);
  };

  const saveEdit = async () => {
    if (!editField) return;
    const trimmed = draft.trim();
    if (editField === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailErr("Ugyldig e-post");
      return;
    }
    if (editField === "url") {
      if (!trimmed) {
        setUrlErr("Nettadresse er påkrevd");
        return;
      }
      const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
      try {
        const u = new URL(candidate);
        // Krev gyldig hostname med minst ett punktum og en TLD på 2+ tegn
        if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname)) {
          setUrlErr("Ugyldig nettadresse (f.eks. kunde.no)");
          return;
        }
      } catch {
        setUrlErr("Ugyldig nettadresse (f.eks. kunde.no)");
        return;
      }
    }
    if (editField === "description" && trimmed.length > 500) {
      toast.error("Beskrivelsen kan være maks 500 tegn");
      return;
    }
    const value = editField === "url" && trimmed
      ? (trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
      : trimmed || null;
    const update: Record<string, string | null> =
      editField === "name" ? { contact_person: value } :
      editField === "email" ? { contact_email: value } :
      editField === "url" ? { url: value } :
      editField === "description" ? { business_description: value } :
      { contact_company_role: value };
    setSaving(true);
    const { error } = await supabase
      .from("msp_customers")
      .update(update as any)
      .eq("id", customer.id);
    setSaving(false);
    if (error) {
      toast.error("Kunne ikke lagre");
      return;
    }
    toast.success(editField === "description" ? "Beskrivelse oppdatert" : "Kontakt oppdatert");
    setEditField(null);
    onUpdate?.();
  };

  const maturityLabel =
    status.key === "claimed" ? "godkjent av kunden" :
    status.key === "invited" ? "under onboarding" :
    status.key === "draft"   ? "estimert av Lara" :
    "data fryst";

  const maturityLevel =
    score >= 75 ? { label: "Høy", cls: "bg-success/10 text-success border-success/20" } :
    score >= 50 ? { label: "Moderat", cls: "bg-warning/10 text-warning border-warning/20" } :
                  { label: "Lav", cls: "bg-destructive/10 text-destructive border-destructive/20" };

  const hostname = (() => {
    if (!customer.url) return null;
    try { return new URL(customer.url).hostname; } catch { return customer.url; }
  })();

  const renderContext = () => {
    if (status.key === "draft") {
      return null;
    }
    if (status.key === "invited") {
      return (
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
          <span className="text-xs text-foreground/80">Onboarding pågår — Lara fyller ut kundeprofilen.</span>
        </div>
      );
    }
    if (status.key === "claimed") {
      const last = formatLongDate(customer.last_activity_at);
      return (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" aria-hidden="true" />
          <span className="text-xs text-foreground/75">Aktiv kunde{last ? ` · siste aktivitet ${last}` : ""}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Inaktiv kunde — data fryst.</span>
      </div>
    );
  };

  return (
    <Card variant="flat" className="relative overflow-hidden p-0">
      <div className="flex items-stretch">
        {/* Vertical stripe */}
        <div className={cn("relative w-7 shrink-0", status.stripeBg)}>
          <span
            className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap", status.stripeText)}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 px-4 py-3 space-y-2 min-w-0">
          {/* Top row */}
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {customer.logo_url ? (
                <div className="h-9 w-9 rounded-md overflow-hidden border border-border bg-background">
                  <img src={customer.logo_url} alt={`${customer.customer_name} logo`} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{customer.customer_name}</h1>
                {customer.active_frameworks && customer.active_frameworks.length > 0 && (
                  <Badge variant="outline" className="text-xs px-2 py-0 gap-1">
                    <Shield className="h-3 w-3" aria-hidden="true" />
                    {customer.active_frameworks.length} regelverk
                  </Badge>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-foreground/75">
                {customer.industry && <span>{customer.industry}</span>}
                {customer.employees && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>{customer.employees} ansatte</span>
                  </>
                )}
                {customer.org_number && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span><span className="text-muted-foreground">Org.nr</span>{" "}<span className="tabular-nums text-foreground font-medium">{customer.org_number}</span></span>
                  </>
                )}
                {hostname && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <a href={customer.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {hostname}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </>
                )}
                {!customer.url && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    {editField === "url" ? (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        <Input
                          autoFocus
                          value={draft}
                          onChange={(e) => { setDraft(e.target.value); setUrlErr(null); }}
                          placeholder="f.eks. kunde.no"
                          className="h-6 text-xs px-1.5 py-0 w-48"
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }}
                        />
                        <button onClick={saveEdit} disabled={saving} className="p-0.5 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditField(null)} className="p-0.5 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3 w-3" /></button>
                        {urlErr && <span className="text-[11px] text-destructive ml-1">{urlErr}</span>}
                      </span>
                    ) : (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => startEdit("url")} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                              <Globe className="h-3 w-3" aria-hidden="true" /> Legg til nettside
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm">Vi bruker nettsiden til å hente informasjon om kundens varer og tjenester, og kan også finne personvernerklæringen derfra.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
              </div>

              {/* Virksomhetsbeskrivelse */}
              <div className="mt-1.5">
                {editField === "description" ? (
                  <div className="flex items-start gap-1.5">
                    <Info className="h-3 w-3 mt-1 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <Textarea
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                        placeholder="Kort beskrivelse av hva virksomheten driver med…"
                        rows={2}
                        className="text-xs min-h-[52px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                          if (e.key === "Escape") setEditField(null);
                        }}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{draft.length}/500 · ⌘+Enter for å lagre</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditField(null)} className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded">Avbryt</button>
                          <button onClick={saveEdit} disabled={saving} className="text-[11px] font-medium text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded">Lagre</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : customer.business_description ? (
                  <div className="group flex items-start gap-1.5 text-xs text-foreground/80">
                    <Info className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <p className="leading-snug flex-1 min-w-0">
                      {customer.business_description}
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex align-middle ml-1">
                              <Sparkles className="h-3 w-3 text-primary/70" aria-hidden="true" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">Hentet fra offentlige registre under onboarding. Klikk på blyanten for å justere manuelt.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                    <button
                      onClick={() => startEdit("description")}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground rounded shrink-0 transition-opacity"
                      aria-label="Rediger beskrivelse"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => startEdit("description")}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Info className="h-3 w-3" aria-hidden="true" />
                          Legg til beskrivelse av virksomheten
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">Hentes automatisk fra offentlige registre under onboarding. Kan justeres manuelt.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Maturity */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Modenhet</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn("mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0 text-xs font-semibold", maturityLevel.cls)}>
                        <LaraAvatar size={10} />
                        {maturityLevel.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p className="text-sm">Beregnet av Mynder fra trust score</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Donut score={score} tone={status.tone} />
            </div>

            {actionSlot && (
              <div className="shrink-0 self-start">
                {actionSlot}
              </div>
            )}
          </div>

          {/* Context banner — compact inline */}
          {renderContext()}

          {/* Footer: Kontakt hos kunde · Ansvarlig hos oss */}
          <div className="border-t border-border pt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
            <div className="flex items-center gap-x-2 gap-y-1 min-w-0 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-foreground/60 font-medium">Kontakt:</span>

              {/* Name */}
              {editField === "name" ? (
                <span className="inline-flex items-center gap-1">
                  <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Navn"
                    className="h-6 text-xs w-40 px-2" maxLength={100}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }} />
                  <button onClick={saveEdit} disabled={saving} className="p-0.5 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setEditField(null)} className="p-0.5 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3 w-3" /></button>
                </span>
              ) : customer.contact_person ? (
                <span className="group inline-flex items-center gap-1 text-foreground">
                  <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{customer.contact_person}</span>
                  <button onClick={() => startEdit("name")} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity" aria-label="Rediger navn">
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </span>
              ) : (
                <button onClick={() => startEdit("name")} className="inline-flex items-center gap-1 text-primary hover:underline">
                  <UserPlus className="h-3 w-3" aria-hidden="true" /> Legg til navn
                </button>
              )}

              <span className="text-muted-foreground/40" aria-hidden="true">·</span>

              {/* Email */}
              {editField === "email" ? (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex flex-col">
                    <Input autoFocus type="email" value={draft} onChange={(e) => { setDraft(e.target.value); setEmailErr(null); }}
                      placeholder="kontakt@firma.no"
                      className={cn("h-6 text-xs w-52 px-2", emailErr && "border-destructive")} maxLength={255}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }} />
                    {emailErr && <span className="text-[10px] text-destructive mt-0.5">{emailErr}</span>}
                  </span>
                  <button onClick={saveEdit} disabled={saving} className="p-0.5 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setEditField(null)} className="p-0.5 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3 w-3" /></button>
                </span>
              ) : customer.contact_email ? (
                <span className="group inline-flex items-center gap-1">
                  <Popover open={emailPopOpen} onOpenChange={setEmailPopOpen}>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center gap-1 text-primary hover:underline max-w-[220px]" aria-label="E-post-handlinger">
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate">{customer.contact_email}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1" align="start">
                      <a
                        href={`mailto:${customer.contact_email}?subject=${encodeURIComponent(`Vedrørende Trust Profile – ${customer.customer_name}`)}`}
                        onClick={() => setEmailPopOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
                      >
                        <Send className="h-3.5 w-3.5 text-primary" /> Send e-post
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(customer.contact_email!); toast.success("E-post kopiert"); setEmailPopOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm text-left"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Kopier adresse
                      </button>
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => startEdit("email")} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity" aria-label="Rediger e-post">
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </span>
              ) : (
                <button onClick={() => startEdit("email")} className="inline-flex items-center gap-1 rounded-md border border-dashed border-warning/50 bg-warning/5 px-1.5 py-0.5 text-warning hover:bg-warning/10">
                  <Mail className="h-3 w-3" aria-hidden="true" /> Legg til e-post
                </button>
              )}

              <span className="text-muted-foreground/40" aria-hidden="true">·</span>

              {/* Role */}
              <Popover open={rolePopOpen} onOpenChange={setRolePopOpen}>
                <PopoverTrigger asChild>
                  {customer.contact_company_role ? (
                    <button className="group inline-flex items-center gap-1 text-foreground/80 hover:bg-muted rounded px-1 -mx-1" aria-label="Endre rolle">
                      <Briefcase className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{customer.contact_company_role}</span>
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" aria-label="Sett rolle">
                      <Briefcase className="h-3 w-3" aria-hidden="true" />
                      <span className="italic">Ikke satt</span>
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1 max-h-72 overflow-auto" align="start">
                  {COMPANY_ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => saveRoleValue(r)}
                      disabled={saving}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm text-left",
                        customer.contact_company_role === r && "bg-muted font-medium"
                      )}
                    >
                      {customer.contact_company_role === r && <Check className="h-3.5 w-3.5 text-primary" />}
                      <span className={cn(customer.contact_company_role !== r && "pl-5")}>{r}</span>
                    </button>
                  ))}
                  {customer.contact_company_role && (
                    <>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={() => saveRoleValue(null)}
                        disabled={saving}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-sm text-left text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" /> Fjern rolle
                      </button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-foreground/60 font-medium">KUNDEKONTAKT:</span>
              {accountManager ? (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <span className="truncate">{accountManager}</span>
                  <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity"
                        aria-label="Endre ansvarlig"
                      >
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1" align="start">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Velg partner-medlem
                      </p>
                      <div className="max-h-64 overflow-auto">
                        {PARTNER_TEAM.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleAssign(m.name)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                          >
                            <InitialAvatar name={m.name} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-foreground truncate">{m.name}</span>
                              <span className="block text-xs text-muted-foreground truncate">{m.role}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </span>
              ) : (
                <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                    >
                      <UserPlus className="h-3 w-3" aria-hidden="true" /> Tildel
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1" align="start">
                    <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Velg partner-medlem
                    </p>
                    <div className="max-h-64 overflow-auto">
                      {PARTNER_TEAM.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleAssign(m.name)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                        >
                          <InitialAvatar name={m.name} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{m.name}</span>
                            <span className="block text-xs text-muted-foreground truncate">{m.role}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
