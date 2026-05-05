import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Check, X, Loader2, Database, Building2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type ContactRole = "compliance" | "dpo" | "ciso";

interface CompanyProfileLike {
  name?: string | null;
  domain?: string | null;
  industry?: string | null;
  employees?: string | null;
  compliance_officer?: string | null;
  compliance_officer_email?: string | null;
  dpo_name?: string | null;
  dpo_email?: string | null;
  ciso_name?: string | null;
  ciso_email?: string | null;
}

interface Suggestion {
  name: string;
  email: string;
  source: "vendor" | "core" | "profile" | "ai";
  rationale?: string;
}

interface Props {
  role: ContactRole;
  currentName: string;
  currentEmail: string;
  companyProfile: CompanyProfileLike | null | undefined;
  onApply: (name: string, email: string) => void;
}

const roleLabels: Record<ContactRole, string> = {
  compliance: "compliance-kontakt",
  dpo: "personvernkontakt",
  ciso: "sikkerhetskontakt",
};

const sourceMeta: Record<Suggestion["source"], { label: string; icon: typeof Database; tone: string }> = {
  vendor: { label: "Hentet fra Leverandørmodulen", icon: Database, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  core: { label: "Hentet fra Core onboarding", icon: Building2, tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  profile: { label: "Hentet fra din profil", icon: UserCircle2, tone: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  ai: { label: "Foreslått av Lara", tone: "bg-primary/10 text-primary", icon: Sparkles },
};

export function LaraContactAssist({ role, currentName, currentEmail, companyProfile, onApply }: Props) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [searched, setSearched] = useState(false);

  const { data: selfAsset } = useQuery({
    queryKey: ["self-asset-lara-assist"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("contact_person, contact_email")
        .eq("asset_type", "self")
        .maybeSingle();
      return data;
    },
  });

  const findLocalSuggestion = (): Suggestion | null => {
    // 1. Vendor module — self-asset contact
    if (selfAsset?.contact_person && selfAsset?.contact_email) {
      return {
        name: selfAsset.contact_person,
        email: selfAsset.contact_email,
        source: "vendor",
        rationale: `Registrert som hovedkontakt for organisasjonen i Leverandørmodulen.`,
      };
    }
    // 2. Core onboarding — other roles in company_profile
    if (companyProfile) {
      const candidates: Array<{ n?: string | null; e?: string | null }> = [];
      if (role !== "compliance") candidates.push({ n: companyProfile.compliance_officer, e: companyProfile.compliance_officer_email });
      if (role !== "dpo") candidates.push({ n: companyProfile.dpo_name, e: companyProfile.dpo_email });
      if (role !== "ciso") candidates.push({ n: companyProfile.ciso_name, e: companyProfile.ciso_email });
      const hit = candidates.find((c) => c.n && c.e);
      if (hit) {
        return {
          name: hit.n!,
          email: hit.e!,
          source: "core",
          rationale: `Samme person er allerede registrert i en annen nøkkelrolle under Core onboarding.`,
        };
      }
    }
    // 3. User profile fallback
    if (user?.email) {
      const meta = (user.user_metadata || {}) as { full_name?: string; name?: string };
      const name = meta.full_name || meta.name || user.email.split("@")[0];
      return {
        name,
        email: user.email,
        source: "profile",
        rationale: `Basert på din innloggede brukerprofil. Endre om noen andre skal stå som ${roleLabels[role]}.`,
      };
    }
    return null;
  };

  const handleAsk = async () => {
    setDismissed(false);
    const local = findLocalSuggestion();
    setSearched(true);
    if (local) {
      setSuggestion(local);
      return;
    }
    // 4. AI fallback
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-key-contacts", {
        body: {
          role,
          companyName: companyProfile?.name || "",
          industry: companyProfile?.industry || "",
          employees: companyProfile?.employees || "",
          domain: companyProfile?.domain || "",
        },
      });
      if (error) throw error;
      if (data?.name && data?.email) {
        setSuggestion({ name: data.name, email: data.email, source: "ai", rationale: data.rationale });
      } else {
        toast.error("Lara fant ingen forslag. Prøv igjen senere.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke hente forslag fra Lara");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApply(suggestion.name, suggestion.email);
    toast.success("Lara fylte ut feltene");
    setSuggestion(null);
    setDismissed(true);
  };

  if (dismissed && !suggestion) return (
    <div className="pt-1">
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={() => { setDismissed(false); handleAsk(); }}>
        <Sparkles className="h-3 w-3" /> Spør Lara igjen
      </Button>
    </div>
  );

  if (suggestion) {
    const meta = sourceMeta[suggestion.source];
    const Icon = meta.icon;
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={`${meta.tone} gap-1 text-[11px] font-medium`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
        </div>
        <div className="text-sm space-y-0.5 pl-0.5">
          <div className="font-medium text-foreground">{suggestion.name}</div>
          <div className="text-muted-foreground text-[13px]">{suggestion.email}</div>
        </div>
        {suggestion.rationale && (
          <p className="text-[12px] text-muted-foreground italic pl-0.5 leading-relaxed">{suggestion.rationale}</p>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <Button type="button" size="sm" className="h-7 text-xs gap-1.5" onClick={handleApply}>
            <Check className="h-3.5 w-3.5" /> Bruk forslag
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => { setSuggestion(null); setDismissed(true); }}>
            <X className="h-3.5 w-3.5" /> Avvis
          </Button>
        </div>
      </div>
    );
  }

  // Idle CTA
  return (
    <div className="pt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
        onClick={handleAsk}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {loading
          ? "Lara tenker…"
          : currentName || currentEmail
            ? "Spør Lara om forslag"
            : "La Lara fylle ut"}
      </Button>
      {searched && !loading && !suggestion && (
        <span className="text-[11px] text-muted-foreground ml-2">
          Lara fant ingenting — fyll ut manuelt eller prøv igjen.
        </span>
      )}
    </div>
  );
}
