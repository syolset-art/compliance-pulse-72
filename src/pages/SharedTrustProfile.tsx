import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicTrustCenterLayout from "@/components/trust-center/PublicTrustCenterLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, Lock } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "password"; hint?: string }
  | { kind: "error"; code: string; message: string }
  | { kind: "ok"; assetId: string };

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "Denne lenken finnes ikke.",
  expired: "Denne lenken har utløpt. Kontakt avsenderen for en ny.",
  revoked: "Tilgangen til denne lenken er trukket tilbake.",
  invalid_password: "Feil passord. Prøv igjen.",
  server_error: "Noe gikk galt. Prøv igjen senere.",
  invalid_token: "Ugyldig lenke.",
};

export default function SharedTrustProfile() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prevent search-engine indexing
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const validate = async (pwd?: string) => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("validate-trust-share-link", {
      body: { token, password: pwd },
    });
    setSubmitting(false);

    if (error) {
      setState({ kind: "error", code: "server_error", message: ERROR_MESSAGES.server_error });
      return;
    }
    if (data?.error === "password_required") {
      setState({ kind: "password" });
      return;
    }
    if (data?.error === "invalid_password") {
      setState({ kind: "password", hint: ERROR_MESSAGES.invalid_password });
      return;
    }
    if (data?.error) {
      setState({
        kind: "error",
        code: data.error,
        message: ERROR_MESSAGES[data.error] ?? "Ukjent feil",
      });
      return;
    }
    if (data?.ok && data.asset_id) {
      setState({ kind: "ok", assetId: data.asset_id });
    }
  };

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state.kind === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.kind === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-sm p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="mx-auto h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Passord kreves</h1>
            <p className="text-sm text-muted-foreground">
              Denne Trust Profile er beskyttet. Skriv inn passordet du fikk fra avsenderen.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validate(password);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Passord</Label>
              <Input
                id="pwd"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {state.hint && <p className="text-xs text-destructive">{state.hint}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !password}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Åpne profil"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-sm p-6 text-center space-y-3">
          <div className="mx-auto h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold">Tilgang ikke tilgjengelig</h1>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </Card>
      </div>
    );
  }

  return <PublicTrustCenterLayout assetId={state.assetId} />;
}
