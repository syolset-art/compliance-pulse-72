import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { defaultTaxForLanguage, type PartnerTaxSettings } from "@/lib/partnerTax";

const STORAGE_KEY = "msp-partner-branding-v1";

export interface PartnerBrandingOverrides {
  name?: string;
  orgNumber?: string;
  domain?: string;
  logoDataUrl?: string;
  tagline?: string;
  tax?: Partial<PartnerTaxSettings>;
}

export interface PartnerBranding {
  name: string;
  orgNumber: string;
  domain: string;
  logoUrl: string | null;
  /** @deprecated use logoUrl */
  logoDataUrl: string | null;
  tagline: string;
  isAutoName: boolean;
  isAutoOrg: boolean;
  isAutoDomain: boolean;
  isAutoLogo: boolean;
  isAutoTagline: boolean;
  autoName: string;
  autoOrgNumber: string;
  autoDomain: string;
  autoLogoUrl: string | null;
  /** Standard mva/tax som brukes i tilbud og priskataloger. */
  tax: PartnerTaxSettings;
}

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
  window.dispatchEvent(new CustomEvent("msp-partner-branding-changed"));
}

/**
 * Henter partnerens merking til tilbud: navn, org.nr, webadresse og logo.
 * Auto-data kommer fra company_profile (navn, legal_name, org_number, domain)
 * og self-asset (logo_url). Brukerens overstyringer vinner over auto-data.
 */
export function usePartnerBranding() {
  const { data: profile } = useQuery({
    queryKey: ["partner-branding-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("name, legal_name, org_number, domain")
        .limit(1)
        .maybeSingle();
      return (data ?? null) as {
        name: string | null;
        legal_name: string | null;
        org_number: string | null;
        domain: string | null;
      } | null;
    },
  });

  const { data: selfAsset } = useQuery({
    queryKey: ["partner-branding-self-asset"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("logo_url")
        .eq("asset_type", "self")
        .maybeSingle();
      return (data ?? null) as { logo_url: string | null } | null;
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

  const autoName = (profile?.legal_name?.trim() || profile?.name?.trim() || "");
  const autoOrgNumber = profile?.org_number?.trim() || "";
  const autoDomain = profile?.domain?.trim() || "";
  const autoLogoUrl = selfAsset?.logo_url || null;

  const effectiveLogo = overrides.logoDataUrl || autoLogoUrl;

  const branding: PartnerBranding = {
    name: overrides.name?.trim() || autoName,
    orgNumber: overrides.orgNumber?.trim() || autoOrgNumber,
    domain: overrides.domain?.trim() || autoDomain,
    logoUrl: effectiveLogo,
    logoDataUrl: effectiveLogo,
    tagline: overrides.tagline?.trim() || "",
    isAutoName: !overrides.name,
    isAutoOrg: !overrides.orgNumber,
    isAutoDomain: !overrides.domain,
    isAutoLogo: !overrides.logoDataUrl,
    isAutoTagline: !overrides.tagline,
    autoName,
    autoOrgNumber,
    autoDomain,
    autoLogoUrl,
  };

  const save = useCallback((patch: PartnerBrandingOverrides) => {
    const next = { ...readOverrides(), ...patch };
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
