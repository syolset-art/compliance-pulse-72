import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PerformerRole } from "@/components/integration/PerformerSelectStep";

interface IntegrationPerformer {
  id: string;
  email: string;
  name: string | null;
  role: PerformerRole;
  organization_name: string | null;
  status: string;
  created_at: string;
  activated_at: string | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  performed_by_email: string | null;
  performed_by_name: string | null;
  performed_by_role: string | null;
  performed_by_organization: string | null;
  details: unknown;
  created_at: string;
}

interface CreatePerformerInput {
  email: string;
  name: string;
  role: PerformerRole;
  organization_name?: string;
  created_by?: string;
}

export function useIntegrationPerformers() {
  const [isLoading, setIsLoading] = useState(false);

  const createPerformer = useCallback(async (input: CreatePerformerInput): Promise<IntegrationPerformer | null> => {
    setIsLoading(true);
    try {
      // Generate a secure invite token
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from("integration_performers")
        .insert({
          email: input.email,
          name: input.name,
          role: input.role,
          organization_name: input.organization_name || null,
          invite_token: inviteToken,
          invite_expires_at: expiresAt.toISOString(),
          status: "invited",
          created_by: input.created_by || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Invitasjon sendt til ${input.email}`);
      return data as IntegrationPerformer;
    } catch (error) {
      console.error("Error creating performer:", error);
      toast.error("Kunne ikke opprette invitasjon");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logAuditEvent = useCallback(async (
    integrationId: string,
    action: string,
    performerId?: string,
    performerInfo?: {
      email: string;
      name: string;
      role: PerformerRole;
      organization?: string;
    },
    details?: Record<string, unknown>
  ) => {
    try {
      const insertData = {
        integration_id: integrationId,
        performer_id: performerId || null,
        action,
        performed_by_email: performerInfo?.email || null,
        performed_by_name: performerInfo?.name || null,
        performed_by_role: performerInfo?.role || null,
        performed_by_organization: performerInfo?.organization || null,
        details: details ? JSON.stringify(details) : null,
      };
      await supabase.from("integration_audit_log").insert(insertData as any);
    } catch (error) {
      console.error("Error logging audit event:", error);
    }
  }, []);

  const getAuditLog = useCallback(async (integrationId: string): Promise<AuditLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from("integration_audit_log")
        .select("*")
        .eq("integration_id", integrationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching audit log:", error);
      return [];
    }
  }, []);

  const updateIntegrationPerformer = useCallback(async (
    integrationId: string,
    performerId: string,
    performerRole: PerformerRole
  ) => {
    try {
      const { error } = await supabase
        .from("integration_connections")
        .update({
          setup_performer_id: performerId,
          performer_role: performerRole,
          setup_completed_at: new Date().toISOString(),
        })
        .eq("id", integrationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating integration performer:", error);
    }
  }, []);

  return {
    isLoading,
    createPerformer,
    logAuditEvent,
    getAuditLog,
    updateIntegrationPerformer,
  };
}
