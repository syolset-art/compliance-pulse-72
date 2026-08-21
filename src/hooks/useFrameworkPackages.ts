import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FrameworkPackageState } from "@/lib/frameworkTaskPackage";
import { EMPTY_PACKAGE_STATE } from "@/lib/frameworkTaskPackage";

export interface FrameworkPackageRow {
  id: string;
  msp_user_id: string;
  framework_id: string;
  framework_name: string | null;
  state: FrameworkPackageState;
  total_hours: number;
  total_price: number;
  is_active: boolean;
}

export type FrameworkPackageMap = Record<string, FrameworkPackageRow>;

export interface SavePackageInput {
  frameworkId: string;
  frameworkName: string;
  state: FrameworkPackageState;
  totalHours: number;
  totalPrice: number;
  isActive?: boolean;
}

const QUERY_KEY = ["msp-framework-packages"];

// Tabellen er ny og finnes ikke i autogenererte typer ennå.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as any).from("msp_framework_packages");

async function requireUserId(): Promise<string> {
  // Bruk bufret session (ingen nettverksrunde) — getUser() kan feile i
  // forhåndsvisningen selv om resten av appen er innlogget.
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("Ikke innlogget");
  return uid;
}

export function useFrameworkPackages() {
  const queryClient = useQueryClient();

  const { data: packages = {}, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FrameworkPackageMap> => {
      const uid = await requireUserId();
      const { data, error } = await table().select("*").eq("msp_user_id", uid);
      if (error) return {};
      const map: FrameworkPackageMap = {};
      for (const row of (data ?? []) as FrameworkPackageRow[]) {
        map[row.framework_id] = {
          ...row,
          state: (row.state as FrameworkPackageState) ?? { ...EMPTY_PACKAGE_STATE },
        };
      }
      return map;
    },
  });

  const upsert = async (input: SavePackageInput): Promise<FrameworkPackageRow> => {
    const uid = await requireUserId();
    const existing = packages[input.frameworkId];
    const payload = {
      msp_user_id: uid,
      framework_id: input.frameworkId,
      framework_name: input.frameworkName,
      state: input.state,
      total_hours: input.totalHours,
      total_price: input.totalPrice,
      is_active: input.isActive ?? existing?.is_active ?? true,
    };
    const { data, error } = await table()
      .upsert(payload, { onConflict: "msp_user_id,framework_id" })
      .select()
      .single();
    if (error) throw error;
    return data as FrameworkPackageRow;
  };

  const saveMutation = useMutation({
    mutationFn: upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Pakken er lagret");
    },
    onError: () => toast.error("Kunne ikke lagre pakken"),
  });

  const activeMutation = useMutation({
    mutationFn: async (args: {
      frameworkId: string;
      frameworkName: string;
      isActive: boolean;
      state?: FrameworkPackageState;
      totalHours?: number;
      totalPrice?: number;
    }) => {
      const existing = packages[args.frameworkId];
      return upsert({
        frameworkId: args.frameworkId,
        frameworkName: args.frameworkName,
        state: args.state ?? existing?.state ?? { ...EMPTY_PACKAGE_STATE },
        totalHours: args.totalHours ?? existing?.total_hours ?? 0,
        totalPrice: args.totalPrice ?? existing?.total_price ?? 0,
        isActive: args.isActive,
      });
    },
    onSuccess: (_row, args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(
        args.isActive
          ? `${args.frameworkName} er aktivert i salgsporteføljen`
          : `${args.frameworkName} er deaktivert`,
      );
    },
    onError: () => toast.error("Kunne ikke oppdatere status"),
  });

  return {
    packages,
    isLoading,
    savePackage: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    setActive: activeMutation.mutateAsync,
  };
}
