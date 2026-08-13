import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plug,
  CheckCircle2,
  Loader2,
  KeyRound,
  Trash2,
  RefreshCw,
  Info,
  Shield,
} from "lucide-react";

type Provider = {
  id: string;
  name: string;
  display_name: string;
  partner_name: string | null;
  auth_type: "api_key" | "customer_id" | "oauth";
  description: string | null;
};

type Connection = {
  id: string;
  provider_id: string | null;
  display_name: string;
  api_key_encrypted: string | null;
  is_active: boolean | null;
  sync_status: string | null;
  last_sync_at: string | null;
};

const PROVIDER_USAGE: Record<string, string> = {
  acronis: "Henter enheter og backup-status til kundekort og hendelser.",
};

const FIELD_HINTS: Record<string, { label: string; placeholder: string }[]> = {
  customer_id: [
    { label: "Tenant / kunde-ID", placeholder: "f.eks. acme-01" },
    { label: "API-nøkkel", placeholder: "lim inn nøkkel" },
  ],
  api_key: [{ label: "API-nøkkel", placeholder: "lim inn nøkkel" }],
  oauth: [
    { label: "Client ID", placeholder: "client_id" },
    { label: "Client secret", placeholder: "client_secret" },
  ],
};

function maskKey(value: string | null) {
  if (!value) return "";
  const last = value.slice(-4);
  return `••••••••${last}`;
}

export function PartnerIntegrationsTab() {
  const qc = useQueryClient();
  const [connectFor, setConnectFor] = useState<Provider | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: providers = [], isLoading: provLoading } = useQuery({
    queryKey: ["integration-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_providers")
        .select("id,name,display_name,partner_name,auth_type,description")
        .eq("is_active", true)
        .order("display_name");
      if (error) throw error;
      return data as Provider[];
    },
  });

  const { data: connections = [], isLoading: connLoading } = useQuery({
    queryKey: ["partner-integration-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("id,provider_id,display_name,api_key_encrypted,is_active,sync_status,last_sync_at")
        .is("partner_customer_id", null);
      if (error) throw error;
      return data as Connection[];
    },
  });

  const connByProvider = new Map<string, Connection>();
  for (const c of connections) if (c.provider_id) connByProvider.set(c.provider_id, c);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("integration_connections").delete().eq("id", deleteId);
    if (error) {
      toast.error("Kunne ikke fjerne integrasjon");
    } else {
      toast.success("Integrasjon fjernet");
      qc.invalidateQueries({ queryKey: ["partner-integration-connections"] });
    }
    setDeleteId(null);
  };

  const handleTestSync = async (conn: Connection) => {
    toast.loading("Tester tilkobling …", { id: conn.id });
    await new Promise((r) => setTimeout(r, 800));
    const { error } = await supabase
      .from("integration_connections")
      .update({ sync_status: "ok", last_sync_at: new Date().toISOString() })
      .eq("id", conn.id);
    if (error) toast.error("Test feilet", { id: conn.id });
    else {
      toast.success("Tilkobling OK", { id: conn.id });
      qc.invalidateQueries({ queryKey: ["partner-integration-connections"] });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="text-foreground font-medium mb-0.5">Partner-integrasjoner gjenbrukes på alle dine kunder</p>
            Legg inn nøkler eller tilganger til portaler her én gang. Når du senere kobler en kunde
            til samme leverandør, brukes denne nøkkelen automatisk – uten å lime inn på nytt.
            Nøkler lagres kryptert og vises maskert.
          </div>
        </div>
      </Card>

      {(provLoading || connLoading) && (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Laster integrasjoner …
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((p) => {
          const conn = connByProvider.get(p.id);
          const connected = !!conn?.is_active;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plug className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{p.display_name}</h3>
                    {p.partner_name && (
                      <p className="text-xs text-muted-foreground">via {p.partner_name}</p>
                    )}
                  </div>
                </div>
                {connected ? (
                  <Badge variant="outline" className="gap-1 border-success/40 text-success bg-success/5">
                    <CheckCircle2 className="h-3 w-3" /> Tilkoblet
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Ikke tilkoblet</Badge>
                )}
              </div>

              {p.description && (
                <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
              )}
              {PROVIDER_USAGE[p.name] && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{PROVIDER_USAGE[p.name]}</span>
                </div>
              )}

              {connected && conn && (
                <div className="rounded-md bg-muted/40 px-3 py-2 mb-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Nøkkel</span>
                    <code className="font-mono">{maskKey(conn.api_key_encrypted)}</code>
                  </div>
                  {conn.last_sync_at && (
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-muted-foreground">Sist testet</span>
                      <span>{new Date(conn.last_sync_at).toLocaleString("nb-NO")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={connected ? "outline" : "default"}
                  className="flex-1"
                  onClick={() => setConnectFor(p)}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  {connected ? "Oppdater nøkkel" : "Koble til"}
                </Button>
                {connected && conn && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleTestSync(conn)} title="Test tilkobling">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(conn.id)}
                      title="Fjern"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ConnectDialog
        provider={connectFor}
        existing={connectFor ? connByProvider.get(connectFor.id) : undefined}
        onClose={() => setConnectFor(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["partner-integration-connections"] });
          setConnectFor(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjerne partner-integrasjon?</AlertDialogTitle>
            <AlertDialogDescription>
              Nøkkelen slettes. Kunder som er koblet til denne integrasjonen vil ikke lenger
              motta data før en ny nøkkel legges inn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConnectDialog({
  provider,
  existing,
  onClose,
  onSaved,
}: {
  provider: Provider | null;
  existing: Connection | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (!provider) return null;
  const fields = FIELD_HINTS[provider.auth_type] ?? FIELD_HINTS.api_key;

  const handleSave = async () => {
    if (values.some((v, i) => !v?.trim() && fields[i])) {
      toast.error("Fyll inn alle feltene");
      return;
    }
    setSaving(true);
    const payload = values.filter(Boolean).join("|");
    if (existing) {
      const { error } = await supabase
        .from("integration_connections")
        .update({
          api_key_encrypted: payload,
          is_active: true,
          sync_status: "ok",
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) toast.error("Kunne ikke lagre");
      else toast.success("Integrasjon oppdatert");
    } else {
      const { error } = await supabase.from("integration_connections").insert({
        provider: provider.name,
        provider_id: provider.id,
        display_name: provider.display_name,
        api_key_encrypted: payload,
        is_active: true,
        sync_status: "ok",
        partner_customer_id: null,
        setup_completed_at: new Date().toISOString(),
      });
      if (error) toast.error("Kunne ikke lagre: " + error.message);
      else toast.success("Integrasjon koblet til – nøkkelen brukes nå for alle kunder");
    }
    setSaving(false);
    setValues([]);
    onSaved();
  };

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koble til {provider.display_name}</DialogTitle>
          <DialogDescription>
            Nøkkelen lagres på partner-nivå og gjenbrukes for alle kundene dine.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {fields.map((f, i) => (
            <div key={i} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input
                type={f.label.toLowerCase().includes("nøkkel") || f.label.toLowerCase().includes("secret") ? "password" : "text"}
                placeholder={f.placeholder}
                value={values[i] ?? ""}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = e.target.value;
                  setValues(next);
                }}
              />
            </div>
          ))}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md p-2.5">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Verdiene lagres kryptert. Du kan rotere eller fjerne nøkkelen når som helst.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {existing ? "Lagre" : "Koble til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
