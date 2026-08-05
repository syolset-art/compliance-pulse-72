import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  type: "own" | "partner";
  orgNumber?: string | null;
}

interface ActiveOrganizationContextType {
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  organizations: Organization[];
  loading: boolean;
  refetch: () => void;
  /** True when the active organization is an MSP customer the partner works on behalf of. */
  isCustomerContext: boolean;
  /** Enter an MSP customer's organization (partner working on behalf of the customer). */
  enterCustomerOrg: (org: { id: string; name: string; orgNumber?: string | null }) => void;
  /** Leave the customer context and return to the partner's own organization. */
  exitCustomerOrg: () => void;
}

const CUSTOMER_ORG_KEY = "activeCustomerOrg";

const ActiveOrganizationContext = createContext<ActiveOrganizationContextType>({
  activeOrg: null,
  setActiveOrg: () => {},
  organizations: [],
  loading: true,
  refetch: () => {},
  isCustomerContext: false,
  enterCustomerOrg: () => {},
  exitCustomerOrg: () => {},
});

export const useActiveOrganization = () => useContext(ActiveOrganizationContext);

function readStoredCustomerOrg(): Organization | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_ORG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.name) {
      return { id: parsed.id, name: parsed.name, type: "partner", orgNumber: parsed.orgNumber ?? null };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function ActiveOrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(() => readStoredCustomerOrg());
  const [customerOrg, setCustomerOrg] = useState<Organization | null>(() => readStoredCustomerOrg());
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("company_profile").select("id, name, org_number");

      const orgs: Organization[] = (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: "own" as const,
        orgNumber: c.org_number,
      }));

      setOrganizations(orgs);

      // A customer context always wins until the partner exits it.
      const stored = readStoredCustomerOrg();
      if (stored) {
        setCustomerOrg(stored);
        setActiveOrgState(stored);
        return;
      }

      const storedId = localStorage.getItem("activeOrgId");
      const restored = orgs.find((o) => o.id === storedId);
      if (restored) {
        setActiveOrgState(restored);
      } else if (orgs.length > 0) {
        setActiveOrgState(orgs[0]);
        localStorage.setItem("activeOrgId", orgs[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch organizations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const setActiveOrg = (org: Organization) => {
    if (org.type === "own") {
      localStorage.removeItem(CUSTOMER_ORG_KEY);
      setCustomerOrg(null);
    }
    setActiveOrgState(org);
    localStorage.setItem("activeOrgId", org.id);
  };

  const enterCustomerOrg = useCallback(
    (org: { id: string; name: string; orgNumber?: string | null }) => {
      const next: Organization = {
        id: org.id,
        name: org.name,
        type: "partner",
        orgNumber: org.orgNumber ?? null,
      };
      try {
        localStorage.setItem(CUSTOMER_ORG_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setCustomerOrg(next);
      setActiveOrgState(next);
    },
    [],
  );

  const exitCustomerOrg = useCallback(() => {
    localStorage.removeItem(CUSTOMER_ORG_KEY);
    setCustomerOrg(null);
    const storedId = localStorage.getItem("activeOrgId");
    const fallback = organizations.find((o) => o.id === storedId) ?? organizations[0] ?? null;
    setActiveOrgState(fallback);
  }, [organizations]);

  return (
    <ActiveOrganizationContext.Provider
      value={{
        activeOrg,
        setActiveOrg,
        organizations,
        loading,
        refetch: fetchOrganizations,
        isCustomerContext: !!customerOrg,
        enterCustomerOrg,
        exitCustomerOrg,
      }}
    >
      {children}
    </ActiveOrganizationContext.Provider>
  );
}
