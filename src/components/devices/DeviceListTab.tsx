import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Monitor, Smartphone, Server, HardDrive, RefreshCw, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface DeviceAsset {
  id: string;
  name: string;
  asset_type: string;
  risk_level: string | null;
  lifecycle_status: string | null;
  last_synced_at: string | null;
  metadata: any;
  external_source_provider: string | null;
}

const deviceTypeIcon = (type?: string) => {
  switch (type) {
    case "server": return <Server className="h-4 w-4 text-muted-foreground" />;
    case "mobile": return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    case "storage":
    case "nas": return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    default: return <Monitor className="h-4 w-4 text-muted-foreground" />;
  }
};

const statusVariant = (status?: string): "default" | "destructive" | "warning" | "action" => {
  switch (status) {
    case "protected": return "action";
    case "warning": return "warning";
    case "critical": return "destructive";
    default: return "default";
  }
};

const statusLabel = (status?: string) => {
  switch (status) {
    case "protected": return "Beskyttet";
    case "warning": return "Advarsel";
    case "critical": return "Kritisk";
    default: return "Ukjent";
  }
};

interface DeviceListTabProps {
  devices: DeviceAsset[];
  onSyncAcronis?: () => void;
  isSyncing?: boolean;
  hasAcronisIntegration?: boolean;
}

export function DeviceListTab({ devices, onSyncAcronis, isSyncing, hasAcronisIntegration }: DeviceListTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <Monitor className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <h3 className="text-lg font-semibold">Ingen enheter registrert</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Koble til Acronis for å automatisk importere PC-er, servere og mobiltelefoner, eller legg til manuelt.
          </p>
        </div>
        {hasAcronisIntegration && onSyncAcronis && (
          <Button onClick={onSyncAcronis} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Synkroniser fra Acronis
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {devices.length} {devices.length === 1 ? "enhet" : "enheter"} registrert
        </p>
        {hasAcronisIntegration && onSyncAcronis && (
          <Button variant="outline" size="sm" onClick={onSyncAcronis} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Synkroniser
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enhet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sist sett</TableHead>
              <TableHead>Risiko</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const meta = (device.metadata || {}) as Record<string, any>;
              const deviceType = meta.device_type || meta.type || "workstation";
              const os = meta.os || "–";
              const hostname = meta.hostname || device.name;
              const status = meta.status || "unknown";
              const lastSeen = device.last_synced_at
                ? new Date(device.last_synced_at).toLocaleDateString("nb-NO")
                : "–";

              return (
                <TableRow
                  key={device.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/assets/${device.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {deviceTypeIcon(deviceType)}
                      <div>
                        <span className="font-medium">{device.name}</span>
                        {hostname !== device.name && (
                          <span className="block text-xs text-muted-foreground">{hostname}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{deviceType}</TableCell>
                  <TableCell className="text-sm">{os}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lastSeen}</TableCell>
                  <TableCell>
                    <Badge variant={device.risk_level === "high" ? "destructive" : device.risk_level === "medium" ? "warning" : "secondary"}>
                      {device.risk_level || "lav"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
