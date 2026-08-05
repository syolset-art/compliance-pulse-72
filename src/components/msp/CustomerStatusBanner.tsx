import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sparkles, ShieldCheck, Send, Archive, Mail, User, UserPlus, ExternalLink, Pencil, Check, X, Copy, Briefcase, Globe, Info } from "lucide-react";
import { COMPANY_ROLES } from "@/lib/mspCustomerConstants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { PARTNER_TEAM, getAccountManagerOverride, setAccountManagerOverride } from "@/lib/partnerTeam";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTerms } from "@/hooks/useTerms";

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
  if (c.onboarding_completed) return STATUS_MAP.claimed;
  if (c.status === "active") return STATUS_MAP.claimed;
  if (c.status === "onboarding") return STATUS_MAP.invited;
  return STATUS_MAP.draft;
}

function statusLabel(key: StatusKey): string {
  switch (key) {
    case "claimed": return "Aktiv kunde";
    case "invited": return "Onboarding";
    case "archived": return "Inaktiv kunde";
    case "draft": return "Utkast";
  }
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
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

  type Field = "name" | "email" | "role" | "url" | "description";
  const [editField, setEditField] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [urlErr, setUrlErr] = useState<string | null>(null);
  const [emailPopOpen, setEmailPopOpen] = useState(false);
  const [rolePopOpen, setRolePopOpen] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  /** Lokal ekko-verdi så lagrede felt vises umiddelbart, før refetch er ferdig. */
  const [local, setLocal] = useState<Partial<CustomerLike>>({});
  useEffect(() => setLocal({}), [customer.id]);
  const view: CustomerLike = { ...customer, ...local };

  const saveRoleValue = async (value: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("msp_customers")
      .update({ contact_company_role: value })
      .eq("id", customer.id);
    setSaving(false);
    setRolePopOpen(false);
    if (error) {
      toast.error("Kunne ikke lagre rolle", { description: error.message });
      return;
    }
    setLocal((s) => ({ ...s, contact_company_role: value }));
    toast.success(value ? "Rolle oppdatert" : "Rolle fjernet");
    onUpdate?.();
  };

  /** Når nettadressen lagres og beskrivelsen mangler: la Lara foreslå én. */
  const maybeGenerateDescription = async (website: string) => {
    if (view.business_description) return;
    setGeneratingDesc(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-company-description", {
        body: {
          companyName: customer.customer_name,
          industry: customer.industry || "",
          website,
          language: "nb",
        },
      });
      if (error || !data?.suggestion) throw error ?? new Error("Ingen beskrivelse");
      const suggestion = String(data.suggestion).slice(0, 500);
      const { error: saveError } = await supabase
        .from("msp_customers")
        .update({ business_description: suggestion })
        .eq("id", customer.id);
      if (saveError) throw saveError;
      setLocal((s) => ({ ...s, business_description: suggestion }));
      toast.success("Lara la til en beskrivelse", {
        description: "Klikk på blyanten for å justere teksten.",
      });
      onUpdate?.();
    } catch {
      toast("Fant ingen beskrivelse automatisk", {
        description: "Nettadressen er lagret — du kan skrive beskrivelsen selv.",
      });
    } finally {
      setGeneratingDesc(false);
    }
  };

  const startEdit = (f: Field) => {
    setEmailErr(null);
    setUrlErr(null);
    setDraft(
      f === "name" ? (view.contact_person || "") :
      f === "email" ? (view.contact_email || "") :
      f === "url" ? (view.url || "") :
      f === "description" ? (view.business_description || "") :
      (view.contact_company_role || "")
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
    const { data, error } = await supabase
      .from("msp_customers")
      .update(update as any)
      .eq("id", customer.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error("Kunne ikke lagre", { description: error.message });
      return;
    }
    if (!data) {
      toast.error("Kunne ikke lagre", { description: "Fant ikke kunden, eller du mangler tilgang." });
      return;
    }
    setLocal((s) => ({ ...s, ...update }));
    const savedField = editField;
    toast.success(
      savedField === "description" ? "Beskrivelse oppdatert" :
      savedField === "url" ? "Nettsted oppdatert" : "Kontakt oppdatert",
    );
    setEditField(null);
    onUpdate?.();
    if (savedField === "url" && value) void maybeGenerateDescription(value);
  };


  const maturityLevel =
    score >= 75 ? { label: "Høy", cls: "text-success" } :
    score >= 50 ? { label: "Moderat", cls: "text-warning" } :
                  { label: "Lav", cls: "text-destructive" };

  const hostname = (() => {
    if (!view.url) return null;
    try { return new URL(view.url).hostname; } catch { return view.url; }
  })();

  const statusIcon =
    status.key === "claimed" ? <ShieldCheck className="h-3 w-3" aria-hidden="true" /> :
    status.key === "invited" ? <Sparkles className="h-3 w-3" aria-hidden="true" /> :
    status.key === "archived" ? <Archive className="h-3 w-3" aria-hidden="true" /> :
    <Pencil className="h-3 w-3" aria-hidden="true" />;

  const statusBadgeCls =
    status.key === "claimed" ? "bg-success/10 text-success border-success/20" :
    status.key === "invited" ? "bg-warning/10 text-warning border-warning/20" :
    status.key === "archived" ? "bg-muted text-muted-foreground border-border" :
    "bg-primary/10 text-primary border-primary/20";

  const lastActivity = formatLongDate(customer.last_activity_at);

  const FieldRow = ({
    label,
    children,
    editButton,
  }: {
    label: string;
    children: React.ReactNode;
    editButton?: React.ReactNode;
  }) => (
    <div className="group flex items-start justify-between gap-2 py-2.5 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-foreground/60 font-medium">{label}</div>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
      {editButton && (
        <div className="shrink-0 pt-0.5">
          {editButton}
        </div>
      )}
    </div>
  );

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
        <div className="flex-1 px-5 py-4 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{customer.customer_name}</h1>
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 gap-1 font-medium", statusBadgeCls)}>
                  {statusIcon}
                  {statusLabel(status.key)}
                </Badge>
                {actionSlot}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/70">
                {customer.org_number && (
                  <span>Org.nr <span className="tabular-nums text-foreground font-medium">{customer.org_number}</span></span>
                )}
                {customer.industry && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>{customer.industry}</span>
                  </>
                )}
                {customer.employees && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>{customer.employees} ansatte</span>
                  </>
                )}
                {customer.active_frameworks && customer.active_frameworks.length > 0 && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>{customer.active_frameworks.length} regelverk</span>
                  </>
                )}
                {lastActivity && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>siste aktivitet {lastActivity}</span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:block text-right shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-foreground/60 font-medium">Modenhet</div>
              <div className={cn("text-2xl font-bold leading-none", maturityLevel.cls)}>
                {score}% <span className="text-sm font-semibold">{maturityLevel.label}</span>
              </div>
            </div>
          </div>

          {/* Two-column grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Om virksomheten */}
            <section>
              <h2 className="text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mb-1">Om virksomheten</h2>

              <FieldRow
                label="Nettsted"
                editButton={
                  editField !== "url" && (
                    <button onClick={() => startEdit("url")} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="Rediger nettsted">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )
                }
              >
                {editField === "url" ? (
                  <span className="inline-flex items-center gap-1 w-full">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => { setDraft(e.target.value); setUrlErr(null); }}
                      placeholder="f.eks. kunde.no"
                      className="h-7 text-xs px-2 py-1 flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }}
                    />
                    <button onClick={saveEdit} disabled={saving} className="p-1 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditField(null)} className="p-1 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3.5 w-3.5" /></button>
                    {urlErr && <span className="text-[10px] text-destructive ml-1">{urlErr}</span>}
                  </span>
                ) : hostname ? (
                  <span className="inline-flex items-center gap-1">
                    <a href={view.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {hostname} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex align-middle">
                            <Sparkles className="h-3 w-3 text-primary/70" aria-hidden="true" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">Kartlagt automatisk da kunden ble opprettet. Klikk på blyanten for å endre.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                ) : (
                  <button onClick={() => startEdit("url")} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                    <Globe className="h-3 w-3" aria-hidden="true" /> Legg til nettsted
                  </button>
                )}
              </FieldRow>

              <FieldRow
                label="Beskrivelse"
                editButton={
                  editField !== "description" && (
                    <button onClick={() => startEdit("description")} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="Rediger beskrivelse">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )
                }
              >
                {editField === "description" ? (
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
                      <span className="text-[10px] text-muted-foreground">{draft.length}/500</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditField(null)} className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded">Avbryt</button>
                        <button onClick={saveEdit} disabled={saving} className="text-[11px] font-medium text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded">Lagre</button>
                      </div>
                    </div>
                  </div>
                ) : generatingDesc ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 animate-pulse text-primary" aria-hidden="true" />
                    Lara henter beskrivelse fra nettstedet…
                  </span>
                ) : view.business_description ? (
                  <p className="leading-snug text-foreground/80">
                    {view.business_description}
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex align-middle ml-1">
                            <Sparkles className="h-3 w-3 text-primary/70" aria-hidden="true" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">Hentet fra offentlige registre og nettstedet. Klikk på blyanten for å justere manuelt.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                ) : (
                  <button onClick={() => startEdit("description")} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                    <Info className="h-3 w-3" aria-hidden="true" /> Legg til beskrivelse
                  </button>
                )}
              </FieldRow>
            </section>

            {/* Ansvar og kontakt */}
            <section>
              <h2 className="text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mb-1">Ansvar og kontakt</h2>

              <FieldRow
                label="Kontaktperson hos kunden"
                editButton={
                  !["name", "email"].includes(editField ?? "") && (
                    <button onClick={() => startEdit("name")} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="Rediger kontaktperson">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )
                }
              >
                <div className="space-y-1.5">
                  {/* Name + role */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {editField === "name" ? (
                      <span className="inline-flex items-center gap-1">
                        <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Navn"
                          className="h-7 text-xs w-44 px-2" maxLength={100}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }} />
                        <button onClick={saveEdit} disabled={saving} className="p-1 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditField(null)} className="p-1 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ) : customer.contact_person ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        <span>{customer.contact_person}</span>
                      </span>
                    ) : (
                      <button onClick={() => startEdit("name")} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <UserPlus className="h-3 w-3" aria-hidden="true" /> Legg til navn
                      </button>
                    )}

                    {/* Role */}
                    <Popover open={rolePopOpen} onOpenChange={setRolePopOpen}>
                      <PopoverTrigger asChild>
                        {customer.contact_company_role ? (
                          <button className="group inline-flex items-center gap-1 text-foreground/80 hover:bg-muted rounded px-1 -mx-1 text-xs" aria-label="Endre rolle">
                            <Briefcase className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <span>{customer.contact_company_role}</span>
                            <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs" aria-label="Sett rolle">
                            <Briefcase className="h-3 w-3" aria-hidden="true" />
                            <span className="italic">Rolle ikke satt</span>
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

                  {/* Email */}
                  {editField === "email" ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex flex-col">
                        <Input autoFocus type="email" value={draft} onChange={(e) => { setDraft(e.target.value); setEmailErr(null); }}
                          placeholder="kontakt@firma.no"
                          className={cn("h-7 text-xs w-56 px-2", emailErr && "border-destructive")} maxLength={255}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }} />
                        {emailErr && <span className="text-[10px] text-destructive mt-0.5">{emailErr}</span>}
                      </span>
                      <button onClick={saveEdit} disabled={saving} className="p-1 text-success hover:bg-success/10 rounded" aria-label="Lagre"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditField(null)} className="p-1 text-muted-foreground hover:bg-muted rounded" aria-label="Avbryt"><X className="h-3.5 w-3.5" /></button>
                    </span>
                  ) : customer.contact_email ? (
                    <span className="group inline-flex items-center gap-1">
                      <Popover open={emailPopOpen} onOpenChange={setEmailPopOpen}>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 text-primary hover:underline text-sm" aria-label="E-post-handlinger">
                            <Mail className="h-3 w-3" aria-hidden="true" />
                            <span className="truncate max-w-[200px]">{customer.contact_email}</span>
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
                    <button onClick={() => startEdit("email")} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                      <Mail className="h-3 w-3" aria-hidden="true" /> Legg til e-post
                    </button>
                  )}
                </div>
              </FieldRow>

              <FieldRow
                label="Kundeansvarlig hos oss"
                editButton={
                  <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                    <PopoverTrigger asChild>
                      <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="Endre ansvarlig">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1" align="start">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Velg partner-medlem</p>
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
                }
              >
                {accountManager ? (
                  <span className="inline-flex items-center gap-2 text-sm flex-wrap">
                    <InitialAvatar name={accountManager} />
                    <span>{accountManager}</span>
                    {isOperatorPartner && (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="gap-1 font-normal bg-primary/10 text-primary border-primary/20 text-[11px] cursor-help"
                            >
                              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                              Driftspartner
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-xs">
                            Kundeansvarlig er også driftsansvarlig og kan utføre compliance-arbeid
                            direkte i kundens egen virksomhetsprofil.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                ) : (
                  <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                        <UserPlus className="h-3 w-3" aria-hidden="true" /> Tildel ansvarlig
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1" align="start">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Velg partner-medlem</p>
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
              </FieldRow>
            </section>
          </div>

          {/* Footer note */}
          <div className="mt-3 text-xs text-foreground/50 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Nettsted og beskrivelse ble hentet automatisk da kunden ble lagt til. Rediger ved behov.</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
