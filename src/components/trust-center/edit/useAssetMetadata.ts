import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAssetMetadata(assetId: string | undefined, currentMeta: Record<string, any>) {
  const qc = useQueryClient();

  const updatePath = useCallback(
    async (path: string[], value: any, opts?: { silent?: boolean }) => {
      if (!assetId) return;
      const next: any = JSON.parse(JSON.stringify(currentMeta || {}));
      let cursor = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (typeof cursor[k] !== "object" || cursor[k] === null) cursor[k] = {};
        cursor = cursor[k];
      }
      cursor[path[path.length - 1]] = value;
      const { error } = await supabase.from("assets").update({ metadata: next }).eq("id", assetId);
      if (error) {
        toast.error("Kunne ikke lagre");
        return;
      }
      qc.invalidateQueries({ queryKey: ["self-asset-edit"] });
      qc.invalidateQueries({ queryKey: ["asset-for-trust-eval"] });
      if (!opts?.silent) toast.success("Lagret");
    },
    [assetId, currentMeta, qc]
  );

  const confirmField = useCallback(
    async (fieldId: string, confirmed: boolean) => {
      const list: string[] = currentMeta?.confirmed_fields || [];
      const next = confirmed ? Array.from(new Set([...list, fieldId])) : list.filter((f) => f !== fieldId);
      await updatePath(["confirmed_fields"], next, { silent: true });
    },
    [currentMeta, updatePath]
  );

  const isConfirmed = (fieldId: string) => (currentMeta?.confirmed_fields || []).includes(fieldId);

  return { updatePath, confirmField, isConfirmed };
}
