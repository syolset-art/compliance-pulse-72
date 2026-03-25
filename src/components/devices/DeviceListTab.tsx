import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Monitor, Smartphone, Server, HardDrive, RefreshCw, Loader2, Laptop, Wifi, Printer, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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

/** ISO 27001 Annex A / PESB device categories */
const DEVICE_CATEGORIES = [
  { value: "all", label: "Alle typer" },
  { value: "workstation", label: "Arbeidsstasjon" },
  { value: "laptop", label: "Bærbar PC" },
  { value: "server", label: "Server" },
  { value: "mobile", label: "Mobilenhet" },
  { value: "network", label: "Nettverksutstyr" },
  { value: "storage", label: "Lagringsenhet (NAS/SAN)" },
  { value: "printer", label: "Skriver / MFP" },
  { value: "iot", label: "IoT / OT-enhet" },
  { value: "security", label: "Sikkerhetsutstyr" },
] as const;

const RISK_FILTERS = [
  { value: "all", label: "Alle risikonivåer" },
  { value: "high", label: "Høy" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Lav" },
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "Alle statuser" },
  { value: "protected", label: "Beskyttet" },
  { value: "warning", label: "Advarsel" },
  { value: "critical", label: "Kritisk" },
] as const;

const deviceTypeIcon = (type?: string) => {
  switch (type) {
    case "server": return <Server className="h-4 w-4 text-muted-foreground" />;
    case "mobile": return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    case "laptop": return <Laptop className="h-4 w-4 text-muted-foreground" />;
    case "storage":
    case "nas": return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    case "network": return <Wifi className="h-4 w-4 text-muted-foreground" />;
    case "printer": return <Printer className="h-4 w-4 text-muted-foreground" />;
    case "security": return <Shield className="h-4 w-4 text-muted-foreground" />;
    case "iot": return <Wifi className="h-4 w-4 text-muted-foreground" />;
    default: return <Monitor className="h-4 w-4 text-muted-foreground" />;
  }
};

const deviceTypeLabel = (type?: string) => {
  const cat = DEVICE_CATEGORIES.find(c => c.value === type);
  return cat ? cat.label : type || "Ukjent";
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

  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const meta = (device.metadata || {}) as Record<string, any>;
      const deviceType = meta.device_type || meta.type || "workstation";
      const status = meta.status || "unknown";

      const matchesName = !nameFilter || device.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = typeFilter === "all" || deviceType === typeFilter;
      const matchesRisk = riskFilter === "all" || device.risk_level === riskFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesName && matchesType && matchesRisk && matchesStatus;
    });
  }, [devices, nameFilter, typeFilter, riskFilter, statusFilter]);

  // Count devices per type for badge
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      const meta = (d.metadata || {}) as Record<string, any>;
      const dt = meta.device_type || meta.type || "workstation";
      counts[dt] = (counts[dt] || 0) + 1;
    });
    return counts;
  }, [devices]);

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
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Søk etter enhet..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="bg-muted/50 border-border"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-muted/50 border-border">
            <SelectValue placeholder="Enhetstype" />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <span className="flex items-center gap-2">
                  {cat.label}
                  {cat.value !== "all" && typeCounts[cat.value] ? (
                    <span className="text-xs text-muted-foreground">({typeCounts[cat.value]})</span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="bg-muted/50 border-border">
            <SelectValue placeholder="Risikonivå" />
          </SelectTrigger>
          <SelectContent>
            {RISK_FILTERS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-muted/50 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDevices.length} av {devices.length} {devices.length === 1 ? "enhet" : "enheter"}
          {(typeFilter !== "all" || riskFilter !== "all" || statusFilter !== "all" || nameFilter) && " (filtrert)"}
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
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Ingen enheter matcher valgte filtre
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => {
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
                    <TableCell className="text-sm">{deviceTypeLabel(deviceType)}</TableCell>
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
