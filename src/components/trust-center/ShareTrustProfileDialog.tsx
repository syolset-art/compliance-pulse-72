import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Link2,
  Mail,
  Copy,
  Check,
  Plus,
  Loader2,
  Eye,
  Trash2,
  Lock,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assetId: string;
}

type ExpiryOption = "7" | "30" | "90" | "never";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildShareUrl(token: string): string {
  return `${window.location.origin}/s/${token}`;
}

export function ShareTrustProfileDialog({ open, onOpenChange, assetId }: Props) {
  const qc = useQueryClient();
  const [expiry, setExpiry] = useState<ExpiryOption>("30");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Email tab state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: links, refetch } = useQuery({
    queryKey: ["trust-share-links", assetId],
    enabled: open && !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_share_links")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) {
      setPassword("");
      setRecipientEmail("");
      setRecipientName("");
      setPersonalMessage("");
      setCopiedId(null);
    }
  }, [open]);

  const expiryToTimestamp = (opt: ExpiryOption): string | null => {
    if (opt === "never") return null;
    const days = parseInt(opt, 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const createLink = async (opts?: { email?: string; name?: string; message?: string }) => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast.error("Du må være innlogget");
      return null;
    }
    const token = generateToken();
    const passwordHash = password ? await sha256Hex(password) : null;

    const { data, error } = await supabase
      .from("trust_share_links")
      .insert({
        asset_id: assetId,
        token,
        created_by: uid,
        expires_at: expiryToTimestamp(expiry),
        password_hash: passwordHash,
        recipient_email: opts?.email ?? null,
        recipient_name: opts?.name ?? null,
        personal_message: opts?.message ?? null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Kunne ikke opprette lenke: " + error.message);
      return null;
    }
    return data;
  };

  const handleGenerate = async () => {
    setCreating(true);
    const link = await createLink();
    setCreating(false);
    if (link) {
      toast.success("Lenke opprettet");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["trust-share-links", assetId] });
    }
  };

  const handleSendInvite = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Oppgi mottakerens e-post");
      return;
    }
    setSending(true);
    const link = await createLink({
      email: recipientEmail.trim(),
      name: recipientName.trim() || undefined,
      message: personalMessage.trim() || undefined,
    });
    setSending(false);
    if (link) {
      // Note: actual email sending would go via edge function.
      // For now we create the tracked link and inform the user.
      toast.success(`Invitasjon klar for ${recipientEmail}. Kopier lenken og send den til mottaker.`);
      setRecipientEmail("");
      setRecipientName("");
      setPersonalMessage("");
      qc.invalidateQueries({ queryKey: ["trust-share-links", assetId] });
    }
  };

  const handleCopy = async (token: string, id: string) => {
    await navigator.clipboard.writeText(buildShareUrl(token));
    setCopiedId(id);
    toast.success("Lenke kopiert");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase
      .from("trust_share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Kunne ikke trekke tilbake");
      return;
    }
    toast.success("Lenke trukket tilbake");
    refetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trust_share_links").delete().eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette");
      return;
    }
    refetch();
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" }) : "Aldri";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Del Trust Profile</DialogTitle>
          <DialogDescription>
            Del en privat, sporbar lenke med utvalgte kunder eller leverandører. Profilen er ikke offentlig indeksert.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="h-3.5 w-3.5" /> Privat lenke
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-3.5 w-3.5" /> Inviter via e-post
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Utløper etter</Label>
                <Select value={expiry} onValueChange={(v) => setExpiry(v as ExpiryOption)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dager</SelectItem>
                    <SelectItem value="30">30 dager</SelectItem>
                    <SelectItem value="90">90 dager</SelectItem>
                    <SelectItem value="never">Aldri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Passord (valgfritt)
                </Label>
                <Input
                  className="h-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="4–20 tegn"
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={creating} className="w-full gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generer ny lenke
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">E-post *</Label>
                <Input
                  type="email"
                  className="h-9"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="kunde@firma.no"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Navn (valgfritt)</Label>
                <Input
                  className="h-9"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ola Nordmann"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Personlig melding (valgfritt)</Label>
              <Textarea
                rows={3}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Hei, her er vår Trust Profile som dokumenterer vårt sikkerhets- og compliance-arbeid…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Utløper etter</Label>
                <Select value={expiry} onValueChange={(v) => setExpiry(v as ExpiryOption)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dager</SelectItem>
                    <SelectItem value="30">30 dager</SelectItem>
                    <SelectItem value="90">90 dager</SelectItem>
                    <SelectItem value="never">Aldri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Passord (valgfritt)
                </Label>
                <Input
                  className="h-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSendInvite} disabled={sending} className="w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Opprett invitasjon
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              E-post sendes ikke automatisk ennå — lenken opprettes med sporing, kopier den fra listen under og send selv.
            </p>
          </TabsContent>
        </Tabs>

        {/* Active links list */}
        <div className="space-y-2 border-t pt-4 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Aktive lenker</h3>
            <span className="text-xs text-muted-foreground">{links?.length ?? 0} totalt</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(!links || links.length === 0) && (
              <p className="text-xs text-muted-foreground py-4 text-center">Ingen delte lenker ennå.</p>
            )}
            {links?.map((link) => {
              const expired = link.expires_at && new Date(link.expires_at) < new Date();
              const revoked = !!link.revoked_at;
              const status = revoked ? "Trukket tilbake" : expired ? "Utløpt" : "Aktiv";
              const statusColor = revoked || expired ? "secondary" : "default";
              return (
                <div key={link.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={statusColor as any} className="text-[10px]">{status}</Badge>
                        {link.password_hash && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Lock className="h-2.5 w-2.5" /> Passord
                          </Badge>
                        )}
                        {link.recipient_email && (
                          <span className="text-xs text-muted-foreground truncate">
                            {link.recipient_email}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {link.view_count} visninger
                        </span>
                        <span>Utløper: {formatDate(link.expires_at)}</span>
                      </div>
                      <code className="text-[10px] text-muted-foreground/80 break-all block mt-1">
                        {buildShareUrl(link.token)}
                      </code>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => handleCopy(link.token, link.id)}
                        disabled={revoked || expired}
                      >
                        {copiedId === link.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      {!revoked && !expired && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-warning"
                          onClick={() => handleRevoke(link.id)}
                          title="Trekk tilbake"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive"
                        onClick={() => handleDelete(link.id)}
                        title="Slett"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareTrustProfileDialog;
