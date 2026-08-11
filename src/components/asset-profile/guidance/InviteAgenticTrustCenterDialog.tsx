import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import {
  Sparkles,
  RefreshCw,
  BellRing,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Upload,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorFrameworkAction } from "@/lib/vendorFrameworkSuggestions";
import {
  CONTACT_ROLE_LABEL,
  INTERVAL_LABEL,
  readTrustCenterState,
  trustCenterLink,
  writeTrustCenterState,
  type AgenticTrustCenterState,
  type TrustCenterContact,
  type TrustCenterContactRole,
  type TrustCenterInterval,
  type TrustCenterDeliveryMethod,
} from "@/lib/agenticTrustCenter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  vendorName: string;
  actions: VendorFrameworkAction[];
  contactPerson?: string | null;
  contactEmail?: string | null;
  onSaved: (state: AgenticTrustCenterState) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function InviteAgenticTrustCenterDialog({
  open,
  onOpenChange,
  assetId,
  vendorName,
  actions,
  contactPerson,
  contactEmail,
  onSaved,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const docActions = useMemo(() => actions.filter((a) => a.documentType), [actions]);

  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<TrustCenterContact[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [interval, setIntervalValue] = useState<TrustCenterInterval>("semiannual");
  const [deliveryMethod, setDeliveryMethod] = useState<TrustCenterDeliveryMethod>("manual");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const link = trustCenterLink(assetId);

  useEffect(() => {
    if (!open) return;
    const existing = readTrustCenterState(assetId);
    setStep(1);
    setCopied(false);
    setContacts(
      existing.contacts.length > 0
        ? existing.contacts
        : [
            {
              id: uid(),
              name: contactPerson ?? "",
              email: contactEmail ?? "",
              role: "owner" as TrustCenterContactRole,
            },
          ],
    );
    setSelectedDocs(
      existing.requestedDocumentTypes.length > 0
        ? existing.requestedDocumentTypes
        : docActions.map((a) => a.documentType!),
    );
    setIntervalValue(existing.interval);
    setDeliveryMethod(existing.deliveryMethod ?? "manual");
    const d = new Date();
    d.setDate(d.getDate() + 21);
    setDeadline(d.toISOString().slice(0, 10));
    setMessage(
      existing.message ??
        (isNb
          ? `Hei!\n\nVi setter opp en Agentisk Trust Profile for ${vendorName}. Der laster dere opp compliance-dokumentasjonen én gang, og Lara holder den oppdatert automatisk — vi slipper å purre, og dere slipper gjentatte skjemaer.`
          : `Hi!\n\nWe are setting up an Agentic Trust Profile for ${vendorName}. Upload your compliance documentation once, and Lara keeps it up to date automatically.`),
    );
  }, [open, assetId, contactPerson, contactEmail, docActions, vendorName, isNb]);

  const owner = contacts.find((c) => c.role === "owner");
  const canContinueContacts = !!owner && !!owner.email.trim() && !!owner.name.trim();

  const updateContact = (id: string, patch: Partial<TrustCenterContact>) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const toggleDoc = (type: string) =>
    setSelectedDocs((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );

  const handleSend = () => {
    const state: AgenticTrustCenterState = {
      status: "invited",
      contacts,
      requestedDocumentTypes: selectedDocs,
      interval,
      deliveryMethod,
      message,
      invitedAt: new Date().toISOString(),
      deliveredCount: 0,
      link,
    };
    writeTrustCenterState(assetId, state);
    onSaved(state);
    setStep(4);
    toast.success(
      isNb ? "Invitasjon sendt til leverandøren" : "Invitation sent to the vendor",
      {
        description: isNb
          ? `${contacts.length} kontaktperson(er) · ${selectedDocs.length} dokumenter · ${deliveryMethod === "mcp" ? "MCP planlagt" : "Manuell opplasting"}`
          : `${contacts.length} contact(s) · ${selectedDocs.length} documents · ${deliveryMethod === "mcp" ? "MCP planned" : "Manual upload"}`,
      },
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignorer */
    }
  };

  const benefit = (
    Icon: typeof ShieldCheck,
    titleNb: string,
    titleEn: string,
    bodyNb: string,
    bodyEn: string,
  ) => (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{isNb ? titleNb : titleEn}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {isNb ? bodyNb : bodyEn}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LaraAvatar size={22} />
            {isNb ? "Agentisk Trust Profile" : "Agentic Trust Profile"}
          </DialogTitle>
          <DialogDescription>
            {step === 4
              ? isNb
                ? `Invitasjonen er sendt til ${vendorName}.`
                : `The invitation has been sent to ${vendorName}.`
              : isNb
                ? `Steg ${step} av 3 — ${vendorName}`
                : `Step ${step} of 3 — ${vendorName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Steg 1 — hva leverandøren får */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[13px] leading-relaxed text-foreground">
              {isNb
                ? "Leverandøren får sitt eget rom for trust profile. Dokumentasjonen lastes opp én gang og holdes løpende oppdatert — dere slipper å purre hver gang dere trenger noe."
                : "The vendor gets their own trust profile room. Documentation is uploaded once and kept continuously up to date — no more chasing."}
            </div>

            <div className="space-y-3">
              {benefit(
                ShieldCheck,
                "Eget rom for leverandøren",
                "A dedicated vendor room",
                "Kontaktpersoner logger inn og laster opp dokumentasjon knyttet til konkrete krav.",
                "Contacts log in and upload documentation tied to specific requirements.",
              )}
              {benefit(
                Sparkles,
                "Lara ber om og validerer",
                "Lara requests and validates",
                "Lara sjekker at dokumentene dekker kravene og flagger avvik automatisk.",
                "Lara checks that documents cover the requirements and flags gaps automatically.",
              )}
              {benefit(
                BellRing,
                "Automatiske påminnelser",
                "Automatic reminders",
                "Varsler før utløp, slik at trust-profilen aldri blir utdatert.",
                "Alerts before expiry, so the trust profile never goes stale.",
              )}
              {benefit(
                RefreshCw,
                "Kontinuerlig oppdatert trust-profil",
                "Continuously updated trust profile",
                "Endringer hos leverandøren speiles rett inn i profilen og modenheten.",
                "Vendor changes flow straight into the profile and maturity score.",
              )}
            </div>
          </div>
        )}

        {/* Steg 2 — kontaktpersoner */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              {isNb
                ? "Trust centeret kobles til én eier hos leverandøren. Legg gjerne til flere brukere som kan bidra."
                : "The trust profile is linked to one owner at the vendor. Add more users who can contribute."}
            </p>

            {contacts.map((c, idx) => (
              <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {idx === 0
                      ? isNb
                        ? "Primærkontakt"
                        : "Primary contact"
                      : isNb
                        ? `Bruker ${idx + 1}`
                        : `User ${idx + 1}`}
                  </span>
                  {contacts.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground"
                      onClick={() => setContacts((prev) => prev.filter((x) => x.id !== c.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{isNb ? "Navn" : "Name"}</Label>
                    <Input
                      className="h-8 text-sm mt-1"
                      value={c.name}
                      onChange={(e) => updateContact(c.id, { name: e.target.value })}
                      placeholder={isNb ? "Navn" : "Name"}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isNb ? "E-post" : "Email"}</Label>
                    <Input
                      type="email"
                      className="h-8 text-sm mt-1"
                      value={c.email}
                      onChange={(e) => updateContact(c.id, { email: e.target.value })}
                      placeholder="navn@leverandor.no"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{isNb ? "Rolle" : "Role"}</Label>
                  <Select
                    value={c.role}
                    onValueChange={(v) => updateContact(c.id, { role: v as TrustCenterContactRole })}
                  >
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CONTACT_ROLE_LABEL) as TrustCenterContactRole[]).map((r) => (
                        <SelectItem key={r} value={r} className="text-sm">
                          {isNb ? CONTACT_ROLE_LABEL[r].nb : CONTACT_ROLE_LABEL[r].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() =>
                setContacts((prev) => [
                  ...prev,
                  { id: uid(), name: "", email: "", role: "contributor" },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {isNb ? "Legg til bruker" : "Add user"}
            </Button>

            {!canContinueContacts && (
              <p className="text-xs text-destructive">
                {isNb
                  ? "Navn og e-post på eieren må fylles ut."
                  : "The owner needs a name and an email."}
              </p>
            )}
          </div>
        )}

        {/* Steg 3 — dokumentasjon */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground">
                {isNb
                  ? "Velg leveringsmåte for dokumentasjon."
                  : "Choose how documentation should be delivered."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("manual")}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                    deliveryMethod === "manual"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-accent/30",
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-foreground">
                      {isNb ? "Manuell opplasting" : "Manual upload"}
                    </span>
                    {deliveryMethod === "manual" && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isNb
                      ? "Leverandøren laster opp dokumenter i trust profile-rommet."
                      : "The vendor uploads documents in the trust profile room."}
                  </p>
                </button>

                <div
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 opacity-75",
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-foreground">
                      {isNb ? "Koble til systemer via MCP" : "Connect systems via MCP"}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      V2
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isNb
                      ? "Lara henter dokumenter automatisk fra leverandørens systemer. Kommer snart."
                      : "Lara automatically pulls documents from the vendor's systems. Coming soon."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border divide-y divide-border">
              {docActions.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">
                  {isNb
                    ? "Ingen dokumenttyper er utledet ennå. Legg til et regelverk først."
                    : "No document types derived yet. Add a framework first."}
                </p>
              )}
              {docActions.map((a) => (
                <label
                  key={a.id}
                  className="flex items-start gap-2.5 p-2.5 cursor-pointer hover:bg-accent/30"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selectedDocs.includes(a.documentType!)}
                    onCheckedChange={() => toggleDoc(a.documentType!)}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-foreground">
                      {isNb ? a.titleNb : a.titleEn}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{a.requirement}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{isNb ? "Frist for første levering" : "First delivery deadline"}</Label>
                <Input
                  type="date"
                  className="h-8 text-sm mt-1"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{isNb ? "Oppdateringsintervall" : "Update interval"}</Label>
                <Select value={interval} onValueChange={(v) => setIntervalValue(v as TrustCenterInterval)}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(INTERVAL_LABEL) as TrustCenterInterval[]).map((i) => (
                      <SelectItem key={i} value={i} className="text-sm">
                        {isNb ? INTERVAL_LABEL[i].nb : INTERVAL_LABEL[i].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">{isNb ? "Melding til leverandøren" : "Message to the vendor"}</Label>
              <Textarea
                className="mt-1 text-sm min-h-[110px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Steg 4 — bekreftelse */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-[13px] leading-relaxed text-foreground">
              {isNb
                ? `Lara følger opp ${contacts.length} kontaktperson(er) og ${selectedDocs.length} dokumenter. Dere trenger ikke purre — påminnelser sendes automatisk ${
                    isNb ? INTERVAL_LABEL[interval].nb.toLowerCase() : ""
                  }.`
                : `Lara follows up ${contacts.length} contact(s) and ${selectedDocs.length} documents automatically.`}
            </div>
            <div>
              <Label className="text-xs">{isNb ? "Lenken leverandøren mottar" : "The link the vendor receives"}</Label>
              <div className="flex gap-2 mt-1">
                <Input readOnly value={link} className="h-8 text-xs" />
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={copyLink}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isNb
                ? "Trust profilen er foreløpig ikke offentlig. Snart kan leverandører publisere sin agentiske trust profil i et Trust Center."
                : "The trust profile is not public yet. Soon vendors will be able to publish their agentic trust profile in a Trust Center."}
            </p>
          </div>

        )}

        <DialogFooter className={cn("gap-2", step < 4 && "sm:justify-between")}>
          {step < 4 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
              >
                {step === 1 ? (isNb ? "Avbryt" : "Cancel") : isNb ? "Tilbake" : "Back"}
              </Button>
              {step < 3 ? (
                <Button
                  size="sm"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 2 && !canContinueContacts}
                >
                  {isNb ? "Neste" : "Next"}
                </Button>
              ) : (
                <Button size="sm" onClick={handleSend} disabled={selectedDocs.length === 0}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {isNb ? "Send invitasjon" : "Send invitation"}
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              {isNb ? "Ferdig" : "Done"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
