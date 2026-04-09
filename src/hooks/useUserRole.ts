import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 
  | 'daglig_leder'
  | 'personvernombud'
  | 'sikkerhetsansvarlig'
  | 'compliance_ansvarlig'
  | 'ai_governance'
  | 'operativ_bruker'
  | 'risk_owner'
  | 'internal_auditor'
  | 'esg_officer'
  | 'incident_manager'
  | 'system_owner'
  | 'training_officer'
  | 'vendor_manager';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  is_primary: boolean;
  created_at: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  daglig_leder: "Daglig leder",
  personvernombud: "Personvernombud (DPO)",
  sikkerhetsansvarlig: "Sikkerhetsansvarlig (CISO)",
  compliance_ansvarlig: "Compliance-ansvarlig",
  ai_governance: "AI Governance-ansvarlig",
  operativ_bruker: "Operativ bruker",
  risk_owner: "Risikoeier",
  internal_auditor: "Internrevisor",
  esg_officer: "Bærekraftsansvarlig (ESG)",
  incident_manager: "Hendelsesansvarlig",
  system_owner: "Systemeier",
  training_officer: "Opplæringsansvarlig",
  vendor_manager: "Leverandøransvarlig",
};

export const ROLE_ICONS: Record<AppRole, string> = {
  daglig_leder: "Crown",
  personvernombud: "Shield",
  sikkerhetsansvarlig: "Lock",
  compliance_ansvarlig: "ClipboardCheck",
  ai_governance: "Bot",
  operativ_bruker: "User",
  risk_owner: "AlertTriangle",
  internal_auditor: "FileSearch",
  esg_officer: "Leaf",
  incident_manager: "AlertTriangle",
  system_owner: "MonitorCog",
  training_officer: "GraduationCap",
  vendor_manager: "Truck",
};

export const ROLE_COLORS: Record<AppRole, string> = {
  daglig_leder: "text-amber-600",
  personvernombud: "text-blue-600",
  sikkerhetsansvarlig: "text-red-600",
  compliance_ansvarlig: "text-green-600",
  ai_governance: "text-purple-600",
  operativ_bruker: "text-gray-600",
  risk_owner: "text-orange-600",
  internal_auditor: "text-indigo-600",
  esg_officer: "text-emerald-600",
  incident_manager: "text-rose-600",
  system_owner: "text-cyan-600",
  training_officer: "text-teal-600",
  vendor_manager: "text-violet-600",
};

// Demo mode: Store selected role in localStorage when not authenticated
const DEMO_ROLE_KEY = 'mynder_demo_role';
const DEMO_ROLES_KEY = 'mynder_demo_roles';

function getDemoRole(): AppRole {
  if (typeof window === 'undefined') return 'compliance_ansvarlig';
  return (localStorage.getItem(DEMO_ROLE_KEY) as AppRole) || 'compliance_ansvarlig';
}

function setDemoRole(role: AppRole): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_ROLE_KEY, role);
  }
}

function getDemoRoles(): AppRole[] {
  if (typeof window === 'undefined') return ['compliance_ansvarlig'];
  const stored = localStorage.getItem(DEMO_ROLES_KEY);
  return stored ? JSON.parse(stored) : ['compliance_ansvarlig'];
}

function setDemoRoles(roles: AppRole[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_ROLES_KEY, JSON.stringify(roles));
  }
}

export function useUserRole() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const primaryRole = getDemoRole();
        const allRoles = getDemoRoles();
        return { primaryRole, allRoles, isDemo: true };
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const primaryRole = roles?.find(r => r.is_primary)?.role as AppRole || 
                         roles?.[0]?.role as AppRole || 
                         'compliance_ansvarlig';
      
      const allRoles = roles?.map(r => r.role as AppRole) || ['compliance_ansvarlig'];

      return { primaryRole, allRoles, isDemo: false };
    },
    staleTime: 1000 * 60 * 5,
  });

  const setPrimaryRole = useMutation({
    mutationFn: async (role: AppRole) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setDemoRole(role);
        const currentRoles = getDemoRoles();
        if (!currentRoles.includes(role)) {
          setDemoRoles([...currentRoles, role]);
        }
        return { role, isDemo: true };
      }

      await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', role)
        .single();

      if (existing) {
        await supabase
          .from('user_roles')
          .update({ is_primary: true })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role, is_primary: true });
      }

      return { role, isDemo: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    }
  });

  const addRole = useMutation({
    mutationFn: async (role: AppRole) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const currentRoles = getDemoRoles();
        if (!currentRoles.includes(role)) {
          setDemoRoles([...currentRoles, role]);
        }
        return { role, isDemo: true };
      }

      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role, is_primary: false });

      return { role, isDemo: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    }
  });

  return {
    primaryRole: data?.primaryRole || 'compliance_ansvarlig',
    allRoles: data?.allRoles || ['compliance_ansvarlig'],
    isDemo: data?.isDemo ?? true,
    isLoading,
    error,
    setPrimaryRole: setPrimaryRole.mutate,
    addRole: addRole.mutate,
    isPending: setPrimaryRole.isPending || addRole.isPending
  };
}
