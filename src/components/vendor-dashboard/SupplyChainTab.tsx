import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
}

interface Relationship {
  id: string;
  source_asset_id: string;
  target_asset_id: string;
  relationship_type: string;
  description: string | null;
}

interface SupplyChainTabProps {
  vendors: Asset[];
  allAssets: Asset[];
  relationships: Relationship[];
}

export function SupplyChainTab({ vendors, allAssets, relationships }: SupplyChainTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const assetMap = useMemo(() => {
    const m = new Map<string, Asset>();
    allAssets.forEach(a => m.set(a.id, a));
    return m;
  }, [allAssets]);

  // Build tree: for each vendor, find its connected assets
  const vendorTrees = useMemo(() => {
    return vendors.map(vendor => {
      const outgoing = relationships
        .filter(r => r.source_asset_id === vendor.id)
        .map(r => ({ ...r, asset: assetMap.get(r.target_asset_id) }))
        .filter(r => r.asset);

      const incoming = relationships
        .filter(r => r.target_asset_id === vendor.id)
        .map(r => ({ ...r, asset: assetMap.get(r.source_asset_id) }))
        .filter(r => r.asset);

      return { vendor, outgoing, incoming, total: outgoing.length + incoming.length };
    }).filter(t => t.total > 0);
  }, [vendors, relationships, assetMap]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("vendorDashboard.supplyChainDesc", "Visualize how your vendors connect to systems and sub-processors")}
      </p>

      {vendorTrees.length === 0 ? (
        <Card variant="flat" className="p-8 text-center">
          <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">
            {t("vendorDashboard.noRelationships", "No vendor relationships found")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("vendorDashboard.noRelationshipsDesc", "Add relationships between vendors and systems to see the supply chain")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {vendorTrees.map(({ vendor, outgoing, incoming }) => (
            <Card variant="flat" key={vendor.id} className="overflow-hidden">
              {/* Vendor header */}
              <div
                className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/assets/${vendor.id}`)}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{vendor.name}</p>
                  <p className="text-xs text-muted-foreground">{vendor.category || "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {outgoing.length + incoming.length} {t("vendorDashboard.connections", "connections")}
                </Badge>
              </div>

              {/* Connected assets */}
              <div className="p-3 space-y-1.5">
                {outgoing.map(({ id, asset, relationship_type }) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 pl-6 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/assets/${asset!.id}`)}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{asset!.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {relationship_type}
                    </Badge>
                  </div>
                ))}
                {incoming.map(({ id, asset, relationship_type }) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 pl-6 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/assets/${asset!.id}`)}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-primary rotate-180" />
                    <span className="text-sm text-foreground">{asset!.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {relationship_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
