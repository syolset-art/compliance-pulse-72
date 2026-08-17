import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LegalDocType = "terms" | "partner" | "privacy" | "dpa";

export interface TermsVersion {
  id: string;
  version: string;
  effective_date: string;
  content_md: string;
  doc_type: LegalDocType;
  is_current?: boolean;
}

export interface TermsAcceptance {
  id: string;
  terms_version_id: string;
  context: string;
  context_ref: string | null;
  accepted_at: string;
  operator_role?: boolean;
}


export type TermsContext =
  | "module_activation"
  | "license_purchase"
  | "framework_activation"
  | "signup"
  | "settings";

/**
 * Loads the current legal documents (terms, privacy policy, DPA) plus the
 * signed-in user's acceptance history, and records new acceptances.
 *
 * `current` always refers to the terms-and-conditions document, so existing
 * callers (TermsGateDialog, TermsAcceptRow, purchase dialogs) are unaffected.
 */
export function useTerms() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TermsVersion[]>([]);
  const [acceptances, setAcceptances] = useState<TermsAcceptance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Henter både gjeldende og historiske versjoner, slik at akseptloggen
      // kan vise riktig dokument og versjon også for eldre aksepter.
      const { data: versions } = await supabase
        .from("terms_versions")
        .select("id, version, effective_date, content_md, doc_type, is_current")
        .order("effective_date", { ascending: false });

      setDocuments((versions ?? []) as TermsVersion[]);

      if (user?.id) {
        const { data: rows } = await supabase
          .from("terms_acceptances")
          .select("id, terms_version_id, context, context_ref, accepted_at, operator_role")
          .order("accepted_at", { ascending: false });
        setAcceptances((rows as TermsAcceptance[]) ?? []);
      } else {
        setAcceptances([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentByType = documents.reduce((acc, doc) => {
    if (doc.is_current && !acc[doc.doc_type]) acc[doc.doc_type] = doc;
    return acc;
  }, {} as Partial<Record<LegalDocType, TermsVersion>>);

  const versionById = documents.reduce((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {} as Record<string, TermsVersion>);

  const current = currentByType.terms ?? null;

  const hasAcceptedCurrent = Boolean(
    current && acceptances.some((a) => a.terms_version_id === current.id)
  );

  const currentAcceptedAt =
    current
      ? acceptances.find((a) => a.terms_version_id === current.id)?.accepted_at ?? null
      : null;

  const acceptedAtFor = useCallback(
    (versionId?: string | null) =>
      versionId
        ? acceptances.find((a) => a.terms_version_id === versionId)?.accepted_at ?? null
        : null,
    [acceptances]
  );

  const acceptTerms = useCallback(
    async (
      context: TermsContext,
      contextRef?: string,
      options?: { operatorRole?: boolean; operatorScope?: "customer" | "global" }
    ) => {
      if (!user?.id || !current) return false;
      const rows = [
        {
          user_id: user.id,
          terms_version_id: current.id,
          context,
          context_ref: contextRef ?? null,
          operator_role: options?.operatorRole ?? false,
        },
      ];
      // Global driftspartner-rolle: lagres som egen aksept uten context_ref
      // slik at den gjelder for alle kunder.
      if (options?.operatorRole && options.operatorScope === "global" && contextRef) {
        rows.push({
          user_id: user.id,
          terms_version_id: current.id,
          context,
          context_ref: null,
          operator_role: true,
        });
      }
      const { error } = await supabase.from("terms_acceptances").insert(rows);
      if (error) return false;
      await load();
      return true;
    },
    [user?.id, current, load]
  );


  return {
    current,
    currentByType,
    versionById,
    documents,
    acceptances,
    loading,
    hasAcceptedCurrent,
    currentAcceptedAt,
    acceptedAtFor,
    acceptTerms,
    refresh: load,
  };
}
