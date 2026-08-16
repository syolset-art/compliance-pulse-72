import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildHubDocuments, type HubDocument } from "@/lib/documentHub";
import { buildComplianceCoverage } from "@/lib/complianceDocumentCoverage";

/**
 * Henter alle dokumentkilder parallelt og normaliserer dem til hub-modellen.
 * `scoreDocIds` er dokumenter som dekker et krav i et aktivert regelverk.
 */
export function useDocumentHub() {
  const { data, isLoading } = useQuery({
    queryKey: ["document-hub"],
    queryFn: async () => {
      const [vendorDocs, frameworkDocs, workAreaDocs, uploadedDocs, assets, workAreas, frameworks, reqEvidence] =
        await Promise.all([
          supabase
            .from("vendor_documents")
            .select(
              "id, asset_id, display_name, file_name, document_type, status, valid_to, valid_from, reviewed_at, created_at, updated_at, uploaded_by, approved_by, external_url, available_on_request",
            ),
          supabase.from("framework_documents").select("*"),
          supabase.from("work_area_documents").select("*"),
          supabase.from("uploaded_documents").select("*"),
          supabase.from("assets").select("id, name, asset_type"),
          supabase.from("work_areas").select("id, name"),
          supabase
            .from("selected_frameworks")
            .select("framework_id, framework_name, is_selected")
            .eq("is_selected", true),
          supabase
            .from("requirement_evidence")
            .select("document_id, framework_id, requirement_id, coverage_ratio"),
        ]);

      const assetsById: Record<string, { name: string; asset_type: string }> = {};
      (assets.data || []).forEach((a: any) => {
        assetsById[a.id] = { name: a.name, asset_type: a.asset_type };
      });

      const workAreasById: Record<string, string> = {};
      (workAreas.data || []).forEach((w: any) => {
        workAreasById[w.id] = w.name;
      });

      const frameworkNames: Record<string, string> = {};
      (frameworks.data || []).forEach((f: any) => {
        frameworkNames[f.framework_id] = f.framework_name;
      });

      return {
        raw: {
          vendorDocs: vendorDocs.data || [],
          frameworkDocs: frameworkDocs.data || [],
          workAreaDocs: workAreaDocs.data || [],
          uploadedDocs: uploadedDocs.data || [],
          assetsById,
          workAreasById,
          frameworkNames,
          requirementEvidence: (reqEvidence.data || []) as any[],
        },
        frameworks: (frameworks.data || []) as any[],
        reqEvidence: (reqEvidence.data || []) as any[],
      };
    },
    staleTime: 1000 * 60,
  });

  const documents: HubDocument[] = useMemo(
    () => (data ? buildHubDocuments(data.raw) : []),
    [data],
  );

  const { scoreDocIds, coverage } = useMemo(() => {
    if (!data) return { scoreDocIds: new Set<string>(), coverage: null };
    const summary = buildComplianceCoverage(
      data.frameworks.map((f) => ({ framework_id: f.framework_id, framework_name: f.framework_name })),
      data.raw.vendorDocs as any,
    );
    const ids = new Set(summary.linkedDocIds);
    // Dokumenter som er koblet direkte til et krav i Regelverk teller også.
    data.reqEvidence.forEach((r) => ids.add(r.document_id));
    return { scoreDocIds: ids, coverage: summary };
  }, [data]);

  /** Regelverk som et gitt dokument bidrar til. */
  const frameworksForDoc = (docId: string): string[] => {
    const names: string[] = [];
    (data?.reqEvidence ?? [])
      .filter((r) => r.document_id === docId)
      .forEach((r) => {
        const name = data?.raw.frameworkNames[r.framework_id] || r.framework_id;
        if (!names.includes(name)) names.push(name);
      });
    if (!coverage) return names;
    coverage.frameworks.forEach((fw) => {
      if (fw.requirements.some((r) => r.doc?.id === docId)) names.push(fw.frameworkName);
    });
    return names;
  };

  /** Krav dokumentet dekker, på tvers av regelverk. */
  const requirementsForDoc = (docId: string): string[] => {
    const names = new Set<string>();
    (data?.reqEvidence ?? [])
      .filter((r) => r.document_id === docId)
      .forEach((r) => names.add(r.requirement_id));
    if (!coverage) return [...names];
    coverage.frameworks.forEach((fw) => {
      fw.requirements.forEach((r) => {
        if (r.doc?.id === docId) names.add(r.name);
      });
    });
    return [...names];
  };

  return {
    documents,
    scoreDocIds,
    activeFrameworks: (data?.frameworks ?? []) as { framework_id: string; framework_name: string }[],
    activeFrameworkCount: data?.frameworks.length ?? 0,
    frameworksForDoc,
    requirementsForDoc,
    isLoading,
  };
}
