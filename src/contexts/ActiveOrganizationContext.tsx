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
}

const ActiveOrganizationContext = createContext<ActiveOrganizationContextType>({
  activeOrg: null,
  setActiveOrg: () => {},
  organizations: [],
  loading: true,
  refetch: () => {},
});

export const useActiveOrganization = () => useContext(ActiveOrganizationContext);

export function ActiveOrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, mspRes] = await Promise.all([
        supabase.from("company_profile").select("id, name, org_number"),
        supabase.from("msp_customers").select("id, customer_name, org_number"),
      ]);

      const ownOrgs: Organization[] = (companyRes.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: "own" as const,
        orgNumber: c.org_number,
      }));

      const partnerOrgs: Organization[] = (mspRes.data || []).map((m) => ({
        id: m.id,
        name: m.customer_name,
        type: "partner" as const,
        orgNumber: m.org_number,
      }));

      const all = [...ownOrgs, ...partnerOrgs];
      setOrganizations(all);

      // Restore from localStorage or default to first own org
      const storedId = localStorage.getItem("activeOrgId");
      const restored = all.find((o) => o.id === storedId);
      if (restored) {
        setActiveOrgState(restored);
      } else if (all.length > 0) {
        const defaultOrg = ownOrgs[0] || all[0];
        setActiveOrgState(defaultOrg);
        localStorage.setItem("activeOrgId", defaultOrg.id);
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
    setActiveOrgState(org);
    localStorage.setItem("activeOrgId", org.id);
  };

  return (
    <ActiveOrganizationContext.Provider value={{ activeOrg, setActiveOrg, organizations, loading, refetch: fetchOrganizations }}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}
