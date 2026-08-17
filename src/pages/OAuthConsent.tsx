import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

interface OAuthClient {
  name?: string;
  client_id?: string;
}

interface AuthorizationDetails {
  client?: OAuthClient | null;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
}

interface OAuthApi {
  getAuthorizationDetails: (id: string) => Promise<{ data?: AuthorizationDetails | null; error?: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data?: { redirect_url?: string; redirect_to?: string } | null; error?: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data?: { redirect_url?: string; redirect_to?: string } | null; error?: { message: string } | null }>;
}

function oauthApi(): OAuthApi {
  const api = (supabase as any).auth.oauth;
  return {
    getAuthorizationDetails: (id: string) => api.getAuthorizationDetails(id),
    approveAuthorization: (id: string) => api.approveAuthorization(id),
    denyAuthorization: (id: string) => api.denyAuthorization(id),
  };
}

function validateNext(next: string): string | null {
  if (!next.startsWith("/")) return null;
  if (next.includes("://")) return null;
  return next;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        return setError("Missing authorization_id");
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = validateNext(window.location.pathname + window.location.search);
        window.location.href = next ? `/auth?next=${encodeURIComponent(next)}` : "/auth";
        return;
      }
      try {
        const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data ?? null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load authorization details");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauthApi().approveAuthorization(authorizationId)
        : await oauthApi().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message);
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError("No redirect returned by the authorization server.");
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Failed to process authorization decision");
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Authorization request failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading authorization request…</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const clientName = details.client?.name ?? "An external MCP client";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Connect {clientName} to Mynder
          </CardTitle>
          <CardDescription>
            {clientName} wants to use Mynder Core as you. The client will be able to read your vendors,
            compliance frameworks, and documentation status, and create activities on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {details.scopes && details.scopes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Requested scopes</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {details.scopes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Deny
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
