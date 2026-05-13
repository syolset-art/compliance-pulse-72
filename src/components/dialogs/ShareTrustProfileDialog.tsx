import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus, Copy, Check, Share2, Building2, Globe, Trash2, Link2, Users,
} from "lucide-react";

type AccessType = "internal" | "external";

type AccessEntry = {
  id: string;
  email: string;
  type: AccessType;
  addedAt: string; // ISO
};

interface ShareTrustProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicUrl: string;
  /** Org email domain (e.g. "mynder.no") used to auto-classify recipients. */
  orgDomain?: string | null;
}

const emailSchema = z.string().trim().toLowerCase().email();

function classify(email: string, orgDomain?: string | null): AccessType {
  if (!orgDomain) return "external";
  const at = email.split("@")[1]?.toLowerCase().trim();
  return at && at === orgDomain.toLowerCase().trim() ? "internal" : "external";
}

function initials(email: string) {
  const local = email.split("@")[0] || email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() || "")
    .join("") || email[0]?.toUpperCase() || "?";
}

const STORAGE_PREFIX = "trust-profile-access:";

function loadAccess(key: string): AccessEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccess(key: string, list: AccessEntry[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export default function ShareTrustProfileDialog({
  open, onOpenChange, publicUrl, orgDomain,
}: ShareTrustProfileDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const storageKey = useMemo(() => publicUrl.replace(/^https?:\/\//, ""), [publicUrl]);

  const [access, setAccess] = useState<AccessEntry[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Load when opened
  useEffect(() => {
    if (open) {
      setAccess(loadAccess(storageKey));
      setEmailDraft("");
      setLinkCopied(false);
    }
  }, [open, storageKey]);

  const draftValid = emailSchema.safeParse(emailDraft).success;
  const detectedType: AccessType | null = draftValid ? classify(emailDraft, orgDomain) : null;
  const draftDuplicate = useMemo(() => {
    const e = emailDraft.trim().toLowerCase();
    return !!e && access.some(a => a.email === e);
  }, [emailDraft, access]);

  const addPerson = () => {
    const parsed = emailSchema.safeParse(emailDraft);
    if (!parsed.success) {
      toast.error(isNb ? "Ugyldig e-postadresse" : "Invalid email address");
      return;
    }
    if (access.some(a => a.email === parsed.data)) {
      toast.error(isNb ? "Personen har allerede tilgang" : "Person already has access");
      return;
    }
    const type = classify(parsed.data, orgDomain);
    const entry: AccessEntry = {
      id: crypto.randomUUID(),
      email: parsed.data,
      type,
      addedAt: new Date().toISOString(),
    };
    const next = [entry, ...access];
    setAccess(next);
    saveAccess(storageKey, next);
    setEmailDraft("");
    toast.success(
      isNb
        ? `Tilgang gitt til ${parsed.data} (${type === "internal" ? "intern" : "ekstern"})`
        : `Access granted to ${parsed.data} (${type})`
    );
  };

  const removePerson = (id: string) => {
    const next = access.filter(a => a.id !== id);
    setAccess(next);
    saveAccess(storageKey, next);
  };

  const updateType = (id: string, type: AccessType) => {
    const next = access.map(a => (a.id === id ? { ...a, type } : a));
    setAccess(next);
    saveAccess(storageKey, next);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      toast.success(isNb ? "Invitasjonslenke kopiert" : "Invite link copied");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error(isNb ? "Kunne ikke kopiere" : "Copy failed");
    }
  };

  const internalCount = access.filter(a => a.type === "internal").length;
  const externalCount = access.length - internalCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {isNb ? "Del Trust-profil" : "Share Trust profile"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isNb
              ? "Gi tilgang til personer på e-post og se hvem som allerede har tilgang."
              : "Grant access to people by email and see who already has access."}
          </DialogDescription>
        </DialogHeader>

        {/* Add people */}
        <div className="px-5 space-y-2">
          <Label htmlFor="share-email" className="text-xs font-medium text-muted-foreground">
            {isNb ? "Legg til personer" : "Add people"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="share-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={isNb ? "navn@firma.no" : "name@company.com"}
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draftValid && !draftDuplicate) {
                  e.preventDefault();
                  addPerson();
                }
              }}
              maxLength={255}
              className="flex-1"
            />
            <Select
              value={typeDraft}
              onValueChange={(v) => {
                setTypeDraft(v as AccessType);
                setTypeManuallyChosen(true);
              }}
            >
              <SelectTrigger className="w-[120px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {isNb ? "Intern" : "Internal"}
                  </span>
                </SelectItem>
                <SelectItem value="external">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    {isNb ? "Ekstern" : "External"}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              onClick={addPerson}
              disabled={!draftValid || draftDuplicate}
              aria-label={isNb ? "Gi tilgang" : "Grant access"}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {emailDraft && !draftValid && (
            <p className="text-xs text-destructive">{isNb ? "Ugyldig e-postadresse" : "Invalid email address"}</p>
          )}
          {draftDuplicate && (
            <p className="text-xs text-destructive">{isNb ? "Personen har allerede tilgang" : "Person already has access"}</p>
          )}
        </div>

        {/* Access list */}
        <div className="px-5 pt-5 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isNb ? "Personer med tilgang" : "People with access"}
            </Label>
            {access.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[10px]">
                  <Building2 className="h-3 w-3" aria-hidden="true" />
                  {internalCount}
                </Badge>
                <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[10px]">
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  {externalCount}
                </Badge>
              </div>
            )}
          </div>

          <ScrollArea className="max-h-[220px] -mx-1">
            <div className="px-1 space-y-1">
              {access.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {isNb ? "Ingen har fått tilgang ennå." : "No one has been granted access yet."}
                </div>
              ) : (
                access.map((a) => (
                  <div
                    key={a.id}
                    className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        a.type === "internal"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {initials(a.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {isNb ? "Lagt til " : "Added "}
                        {new Date(a.addedAt).toLocaleDateString(isNb ? "nb-NO" : "en-US", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <Select value={a.type} onValueChange={(v) => updateType(a.id, v as AccessType)}>
                      <SelectTrigger className="h-7 w-[110px] text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">{isNb ? "Intern" : "Internal"}</SelectItem>
                        <SelectItem value="external">{isNb ? "Ekstern" : "External"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerson(a.id)}
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={isNb ? `Fjern ${a.email}` : `Remove ${a.email}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Invite link */}
        <div className="px-5 pt-5 pb-5 mt-2 border-t border-border space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label htmlFor="invite-link" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isNb ? "Invitasjonslenke" : "Invite link"}
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {isNb ? "Alle med lenken kan se profilen" : "Anyone with the link can view"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="invite-link"
              readOnly
              value={publicUrl}
              className="font-mono text-xs bg-background"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="gap-2 shrink-0"
            >
              {linkCopied
                ? <Check className="h-4 w-4 text-success" aria-hidden="true" />
                : <Copy className="h-4 w-4" aria-hidden="true" />}
              {linkCopied ? (isNb ? "Kopiert" : "Copied") : (isNb ? "Kopier lenke" : "Copy link")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
