import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Network, Users, Plus, X, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type AccessLevel = "public" | "ecosystem" | "restricted";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: { id: string; display_name?: string | null; file_name?: string | null; visibility?: string | null } | null;
}

export const DocumentAccessDialog = ({ open, onOpenChange, document }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [level, setLevel] = useState<AccessLevel>("restricted");
  const [selected, setSelected] = useState<Record<string, { email: string; name?: string; connectionId?: string }>>({});
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");

  // Load network connections (accepted)
  const { data: connections = [] } = useQuery({
    queryKey: ["network-connections-for-access"],
    queryFn: async () => {
      const { data } = await supabase
        .from("network_connections")
        .select("id, organization_name, contact_person, contact_email, status")
        .order("organization_name", { ascending: true });
      return (data || []).filter((c: any) => !!c.contact_email);
    },
    enabled: open,
  });

  // Load existing grants
  const { data: grants = [], isLoading: grantsLoading } = useQuery({
    queryKey: ["document-grants", document?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("trust_document_grants")
        .select("id, recipient_email, recipient_name, recipient_connection_id, granted_at, revoked_at")
        .eq("document_id", document!.id)
        .is("revoked_at", null);
      return data || [];
    },
    enabled: open && !!document?.id,
  });

  // Hydrate state when dialog opens
  useEffect(() => {
    if (!open || !document) return;
    if (document.visibility === "published") {
      setLevel("public");
    } else if (document.visibility === "ecosystem") {
      setLevel("ecosystem");
    } else {
      setLevel("restricted");
    }
  }, [open, document?.id, document?.visibility]);

  useEffect(() => {
    if (!open) return;
    const map: typeof selected = {};
    for (const g of grants as any[]) {
      const key = g.recipient_email.toLowerCase();
      map[key] = { email: g.recipient_email, name: g.recipient_name, connectionId: g.recipient_connection_id };
    }
    setSelected(map);
  }, [grants, open]);

  const toggleConnection = (email: string, name?: string, connectionId?: string) => {
    const key = email.toLowerCase();
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { email, name, connectionId };
      return next;
    });
  };

  const addManual = () => {
    const email = manualEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(isNb ? "Ugyldig e-post" : "Invalid email");
      return;
    }
    setSelected((prev) => ({ ...prev, [email.toLowerCase()]: { email, name: manualName.trim() || undefined } }));
    setManualEmail("");
    setManualName("");
  };

  const removeRecipient = (key: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!document) return;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("No user");

      // Update visibility on vendor_documents
      const visibility = level === "public" ? "published" : level === "ecosystem" ? "ecosystem" : "hidden";
      const { error: updErr } = await supabase
        .from("vendor_documents")
        .update({ visibility })
        .eq("id", document.id);
      if (updErr) throw updErr;

      if (level !== "restricted") {
        // Revoke all current grants when not restricted
        await (supabase as any)
          .from("trust_document_grants")
          .update({ revoked_at: new Date().toISOString() })
          .eq("document_id", document.id)
          .is("revoked_at", null);
        return;
      }

      // Diff grants
      const currentEmails = new Set((grants as any[]).map((g) => g.recipient_email.toLowerCase()));
      const selectedEmails = new Set(Object.keys(selected));

      const toAdd = Object.entries(selected).filter(([k]) => !currentEmails.has(k));
      const toRevoke = (grants as any[]).filter((g) => !selectedEmails.has(g.recipient_email.toLowerCase()));

      if (toAdd.length > 0) {
        const rows = toAdd.map(([, v]) => ({
          document_id: document.id,
          owner_user_id: userId,
          granted_by: userId,
          recipient_email: v.email,
          recipient_name: v.name || null,
          recipient_connection_id: v.connectionId || null,
        }));
        const { error } = await (supabase as any).from("trust_document_grants").insert(rows);
        if (error) throw error;
      }

      if (toRevoke.length > 0) {
        const { error } = await (supabase as any)
          .from("trust_document_grants")
          .update({ revoked_at: new Date().toISOString() })
          .in("id", toRevoke.map((g) => g.id));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-grants"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      toast.success(isNb ? "Tilgang oppdatert" : "Access updated");
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(isNb ? "Kunne ikke oppdatere tilgang" : "Could not update access", { description: e?.message });
    },
  });

  const selectedCount = Object.keys(selected).length;
  const docName = document?.display_name || document?.file_name || "";

  const levelOptions: { value: AccessLevel; icon: any; title: string; desc: string }[] = useMemo(() => [
    { value: "public", icon: Globe, title: isNb ? "Offentlig" : "Public", desc: isNb ? "Synlig for alle på din offentlige Trust Profile." : "Visible to everyone on your public Trust Profile." },
    { value: "ecosystem", icon: Network, title: isNb ? "Økosystem" : "Ecosystem", desc: isNb ? "Kun innloggede kunder og partnere i ditt nettverk." : "Only signed-in customers and partners in your network." },
    { value: "restricted", icon: Users, title: isNb ? "Begrenset" : "Restricted", desc: isNb ? "Kun de mottakerne du velger fra listen under." : "Only the recipients you select from the list below." },
  ], [isNb]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{isNb ? "Tilgang" : "Access"} · {docName}</DialogTitle>
          <DialogDescription>
            {isNb ? "Velg hvem som skal kunne se dette dokumentet i din Trust Profile." : "Choose who can see this document on your Trust Profile."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto space-y-5 pr-1">
          <RadioGroup value={level} onValueChange={(v) => setLevel(v as AccessLevel)} className="space-y-2">
            {levelOptions.map((opt) => {
              const Icon = opt.icon;
              const active = level === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <Icon className={`h-4 w-4 mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {level === "restricted" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Mottakere" : "Recipients"} ({selectedCount})
                </Label>
                {selectedCount === 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    {isNb ? "Ingen mottakere valgt. Velg fra listen eller legg til e-post." : "No recipients selected. Pick from the list or add an email."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(selected).map(([key, v]) => (
                      <Badge key={key} variant="secondary" className="gap-1 pl-2 pr-1 py-1 font-normal">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{v.name ? `${v.name} · ${v.email}` : v.email}</span>
                        <button onClick={() => removeRecipient(key)} className="ml-0.5 rounded hover:bg-background/60 p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {connections.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {isNb ? "Fra ditt nettverk" : "From your network"}
                  </Label>
                  <ScrollArea className="h-40 rounded-md border">
                    <div className="p-1">
                      {connections.map((c: any) => {
                        const key = c.contact_email.toLowerCase();
                        const checked = !!selected[key];
                        return (
                          <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleConnection(c.contact_email, c.contact_person || c.organization_name, c.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{c.contact_person || c.organization_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.organization_name} · {c.contact_email}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Legg til e-post" : "Add by email"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={isNb ? "Navn (valgfritt)" : "Name (optional)"}
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="email"
                    placeholder="navn@firma.no"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManual()}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" size="icon" onClick={addManual}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || grantsLoading}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isNb ? "Lagre tilgang" : "Save access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentAccessDialog;
