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
      const { data } = await supabase.from("company_profile").select("id, name, org_number");

      const orgs: Organization[] = (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: "own" as const,
        orgNumber: c.org_number,
      }));

      setOrganizations(orgs);

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
    setActiveOrgState(org);
    localStorage.setItem("activeOrgId", org.id);
  };

  return (
    <ActiveOrganizationContext.Provider value={{ activeOrg, setActiveOrg, organizations, loading, refetch: fetchOrganizations }}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}
