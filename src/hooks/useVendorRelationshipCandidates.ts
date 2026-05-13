import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RelationshipCandidate {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  vendor: string | null;
  url: string | null;
  description: string | null;
  work_area_id: string | null;
  matchKind: "strong" | "possible";
  reason: string;
}

export interface VendorRelationshipCandidatesResult {
  strong: RelationshipCandidate[];
  possible: RelationshipCandidate[];
  isLoading: boolean;
}

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\s+(as|asa|inc|inc\.|corp|corporation|ltd|llc|gmbh|ab)\b/g, "")
    .trim();
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function useVendorRelationshipCandidates(opts: {
  enabled: boolean;
  vendorId: string | null;
  vendorName: string | null;
  vendorUrl?: string | null;
}): VendorRelationshipCandidatesResult {
  const { enabled, vendorId, vendorName, vendorUrl } = opts;
  const [state, setState] = useState<VendorRelationshipCandidatesResult>({
    strong: [],
    possible: [],
    isLoading: false,
  });

  useEffect(() => {
    if (!enabled || !vendorId || !vendorName) {
      setState({ strong: [], possible: [], isLoading: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true }));

    (async () => {
      const [{ data: assetsData }, { data: existingRels }] = await Promise.all([
        supabase
          .from("assets")
          .select("id, name, asset_type, category, vendor, url, description, work_area_id")
          .neq("asset_type", "vendor")
          .neq("asset_type", "sub_processor"),
        supabase
          .from("asset_relationships")
          .select("source_asset_id, target_asset_id")
          .or(`target_asset_id.eq.${vendorId},source_asset_id.eq.${vendorId}`),
      ]);

      if (cancelled) return;

      const linkedIds = new Set<string>();
      (existingRels || []).forEach((r: any) => {
        if (r.target_asset_id === vendorId) linkedIds.add(r.source_asset_id);
        if (r.source_asset_id === vendorId) linkedIds.add(r.target_asset_id);
      });

      const needle = normalize(vendorName);
      const vendorDomain = extractDomain(vendorUrl);
      const strong: RelationshipCandidate[] = [];
      const possible: RelationshipCandidate[] = [];

      (assetsData || []).forEach((a: any) => {
        if (!a.id || a.id === vendorId || linkedIds.has(a.id)) return;
        const aName = normalize(a.name);
        const aVendor = normalize(a.vendor);
        const aDesc = (a.description || "").toLowerCase();
        const aDomain = extractDomain(a.url);

        let kind: "strong" | "possible" | null = null;
        let reason = "";

        if (aVendor && aVendor === needle) {
          kind = "strong";
          reason = `Oppgitt leverandør: ${a.vendor}`;
        } else if (aName === needle) {
          kind = "strong";
          reason = "Navn matcher leverandør";
        } else if (vendorDomain && aDomain && aDomain === vendorDomain) {
          kind = "strong";
          reason = `Samme domene: ${aDomain}`;
        } else if (aVendor && (aVendor.includes(needle) || needle.includes(aVendor))) {
          kind = "possible";
          reason = `Leverandør-feltet ligner: ${a.vendor}`;
        } else if (aName.includes(needle) || needle.includes(aName)) {
          kind = "possible";
          reason = "Navn ligner";
        } else if (aDesc.includes(vendorName.toLowerCase())) {
          kind = "possible";
          reason = "Nevnt i beskrivelse";
        }

        if (!kind) return;
        const candidate: RelationshipCandidate = {
          id: a.id,
          name: a.name,
          asset_type: a.asset_type,
          category: a.category,
          vendor: a.vendor,
          url: a.url,
          description: a.description,
          work_area_id: a.work_area_id,
          matchKind: kind,
          reason,
        };
        if (kind === "strong") strong.push(candidate);
        else possible.push(candidate);
      });

      setState({ strong, possible, isLoading: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, vendorId, vendorName, vendorUrl]);

  return state;
}
