import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Search, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useAllVendorDeviations, useDeviationImpacts } from "@/hooks/useVendorDeviations";
import { deviationSourceLabel } from "@/lib/deviationImpact";

const criticalityBadge = (c?: string) => {
  switch (c) {
    case "critical": return <Badge variant="destructive">Kritisk</Badge>;
    case "high": return <Badge variant="destructive" className="bg-destructive/80">Høy</Badge>;
    case "medium": return <Badge className="bg-warning hover:bg-warning">Middels</Badge>;
    default: return <Badge variant="secondary">Lav</Badge>;
  }
};

export function VendorDeviationsOverview() {
  const [search, setSearch] = useState("");
  const { data: deviations = [], isLoading } = useAllVendorDeviations();
  const openDeviations = deviations.filter((d: any) => d.status !== "resolved");
  const { data: impacts = [] } = useDeviationImpacts(openDeviations.map((d: any) => d.id));

  const impactCount = useMemo(() => {
    const map = new Map<string, number>();
    impacts.filter((i: any) => i.status === "active").forEach((i: any) => {
      map.set(i.deviation_id, (map.get(i.deviation_id) || 0) + 1);
    });
    return map;
  }, [impacts]);

  const byVendor = useMemo(() => {
    const map = new Map<string, { name: string; open: number; total: number }>();
    deviations.forEach((d: any) => {
      const entry = map.get(d.asset_id) || { name: d.vendorName, open: 0, total: 0 };
      entry.total += 1;
      if (d.status !== "resolved") entry.open += 1;
      map.set(d.asset_id, entry);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [deviations]);

  const filtered = deviations.filter(
    (d: any) =>
      !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.vendorName?.toLowerCase().includes(search.toLowerCase()),
  );

  const vendorsWithOpen = byVendor.filter((v) => v.open > 0);
  const affectedRequirements = Array.from(impactCount.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Leverandører med åpne avvik</p>
            <p className="text-2xl font-semibold text-foreground">{vendorsWithOpen.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Åpne avvik</p>
            <p className="text-2xl font-semibold text-foreground">{openDeviations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Krav satt til ikke oppfylt</p>
            <p className="text-2xl font-semibold text-foreground">{affectedRequirements}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk på leverandør eller avvik"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster …</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Ingen avvik er registrert på leverandører.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leverandør</TableHead>
                <TableHead>Avvik</TableHead>
                <TableHead>Alvorlighet</TableHead>
                <TableHead>Kilde</TableHead>
                <TableHead>Berørte krav</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.vendorName}</TableCell>
                  <TableCell>
                    <span className="text-sm">{d.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.discovered_at ? format(new Date(d.discovered_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>{criticalityBadge(d.criticality)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {deviationSourceLabel(d.source, true)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.status !== "resolved" && (impactCount.get(d.id) || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {impactCount.get(d.id)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {d.status === "resolved" ? (
                      <Badge variant="secondary">Lukket</Badge>
                    ) : !d.confirmed_at ? (
                      <Badge variant="outline">Til bekreftelse</Badge>
                    ) : (
                      <Badge className="bg-warning hover:bg-warning">Åpent</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/assets/${d.asset_id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
