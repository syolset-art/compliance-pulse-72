import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "msp-partner-branding-v1";

export interface PartnerBrandingOverrides {
  name?: string;
  orgNumber?: string;
  logoDataUrl?: string;
}

export interface PartnerBranding {
  name: string;
  orgNumber: string;
  logoDataUrl: string | null;
  isAutoName: boolean;
  isAutoOrg: boolean;
  isAutoLogo: boolean;
  autoName: string;
  autoOrgNumber: string;
}

const FALLBACK_NAME = "Dintero AS";
const FALLBACK_ORG = "";

function readOverrides(): PartnerBrandingOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PartnerBrandingOverrides;
  } catch {
    return {};
  }
}

function writeOverrides(o: PartnerBrandingOverrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  // Notify other hook instances in the same tab.
  window.dispatchEvent(new CustomEvent("msp-partner-branding-changed"));
}

/**
 * Henter partnerens merking til tilbud: navn, organisasjonsnummer og logo.
 * Auto-data kommer fra company_profile; brukerens overstyringer (inkl. logo)
 * lagres lokalt og vinner over auto-data.
 */
export function usePartnerBranding() {
  const { data: profile } = useQuery({
    queryKey: ["partner-branding-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("name, org_number")
        .limit(1)
        .maybeSingle();
      return (data ?? null) as { name: string | null; org_number: string | null } | null;
    },
  });

  const [overrides, setOverrides] = useState<PartnerBrandingOverrides>(() => readOverrides());

  useEffect(() => {
    const handler = () => setOverrides(readOverrides());
    window.addEventListener("storage", handler);
    window.addEventListener("msp-partner-branding-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("msp-partner-branding-changed", handler);
    };
  }, []);

  const autoName = profile?.name?.trim() || FALLBACK_NAME;
  const autoOrgNumber = profile?.org_number?.trim() || FALLBACK_ORG;

  const branding: PartnerBranding = {
    name: overrides.name?.trim() || autoName,
    orgNumber: overrides.orgNumber?.trim() || autoOrgNumber,
    logoDataUrl: overrides.logoDataUrl ?? null,
    isAutoName: !overrides.name,
    isAutoOrg: !overrides.orgNumber,
    isAutoLogo: !overrides.logoDataUrl,
    autoName,
    autoOrgNumber,
  };

  const save = useCallback((patch: PartnerBrandingOverrides) => {
    const next = { ...readOverrides(), ...patch };
    // Strip empty strings so auto-data tar over igjen
    (Object.keys(next) as (keyof PartnerBrandingOverrides)[]).forEach((k) => {
      const v = next[k];
      if (typeof v === "string" && v.trim() === "") delete next[k];
    });
    writeOverrides(next);
    setOverrides(next);
  }, []);

  const clearField = useCallback((field: keyof PartnerBrandingOverrides) => {
    const next = { ...readOverrides() };
    delete next[field];
    writeOverrides(next);
    setOverrides(next);
  }, []);

  return { branding, save, clearField };
}
