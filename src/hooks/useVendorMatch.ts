import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VendorMatchCandidate {
  id: string;
  name: string;
  logo_url: string | null;
  vendor_category: string | null;
  risk_score: number | null;
  tprm_status: string | null;
}

export interface VendorMatchResult {
  exact: VendorMatchCandidate | null;
  suggested: VendorMatchCandidate | null;
  parentKnown: string | null; // parent vendor name when no asset exists
  isLoading: boolean;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+(as|asa|inc|inc\.|corp|corporation|ltd|llc|gmbh|ab)\b/g, "").trim();
}

export function useVendorMatch(opts: {
  enabled: boolean;
  vendorName?: string | null;
  parentVendor?: string | null;
}): VendorMatchResult {
  const { enabled, vendorName, parentVendor } = opts;
  const [state, setState] = useState<VendorMatchResult>({
    exact: null,
    suggested: null,
    parentKnown: null,
    isLoading: false,
  });

  useEffect(() => {
    if (!enabled) return;
    const needles = [vendorName, parentVendor].filter(Boolean) as string[];
    if (needles.length === 0) {
      setState({ exact: null, suggested: null, parentKnown: null, isLoading: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true }));

    (async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, logo_url, vendor_category, risk_score, tprm_status")
        .eq("asset_type", "vendor")
        .limit(50);

      if (cancelled) return;
      if (error || !data) {
        setState({ exact: null, suggested: null, parentKnown: parentVendor ?? null, isLoading: false });
        return;
      }

      const normalizedNeedles = needles.map(normalize);
      let exact: VendorMatchCandidate | null = null;
      let suggested: VendorMatchCandidate | null = null;

      for (const v of data as VendorMatchCandidate[]) {
        const n = normalize(v.name);
        if (normalizedNeedles.some((needle) => n === needle)) {
          exact = v;
          break;
        }
        if (!suggested && normalizedNeedles.some((needle) => n.includes(needle) || needle.includes(n))) {
          suggested = v;
        }
      }

      const parentKnown =
        !exact && !suggested && parentVendor && parentVendor.trim().length > 0
          ? parentVendor
          : null;

      setState({ exact, suggested, parentKnown, isLoading: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, vendorName, parentVendor]);

  return state;
}
