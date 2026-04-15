import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Monitor, Smartphone, Server, HardDrive } from "lucide-react";
import { NIS2AssessmentTab } from "@/components/devices/NIS2AssessmentTab";

const DEMO_DEVICES = [
  { id: "demo-1", name: "Dell Latitude 5540", asset_type: "hardware", metadata: { os: "Windows 11", hostname: "PC-ADMIN-01", status: "active", encryption: true, mdm: true, antivirus: true, location: "Oslo" } },
  { id: "demo-2", name: "MacBook Pro 14\"", asset_type: "hardware", metadata: { os: "macOS 14", hostname: "MAC-DEV-03", status: "active", encryption: true, mdm: false, antivirus: false, location: "Bergen" } },
  { id: "demo-3", name: "iPhone 15 Pro", asset_type: "hardware", metadata: { os: "iOS 17", hostname: "MOB-LEDER-01", status: "active", encryption: true, mdm: true, antivirus: false, location: "Oslo" } },
  { id: "demo-4", name: "Synology DS920+", asset_type: "hardware", metadata: { os: "DSM 7.2", hostname: "NAS-01", status: "active", encryption: false, mdm: false, antivirus: false, location: "Serverrom" } },
];

function getDeviceIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("iphone") || lower.includes("samsung") || lower.includes("mobil")) return Smartphone;
  if (lower.includes("server") || lower.includes("synology") || lower.includes("nas")) return Server;
  if (lower.includes("disk") || lower.includes("drive")) return HardDrive;
  return Monitor;
}

export default function MSPCustomerNIS2() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const { data: customer } = useQuery({
    queryKey: ["msp-customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!customerId,
  });

  // Try to find real hardware assets
  const { data: devices } = useQuery({
    queryKey: ["msp-customer-devices", customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "hardware")
        .limit(20);
      return data || [];
    },
  });

  const deviceList = (devices && devices.length > 0) ? devices : DEMO_DEVICES;
  const selectedDevice = deviceList.find((d: any) => d.id === selectedDeviceId);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        {/* Partner banner */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
          <div className="container max-w-7xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/msp-dashboard/${customerId}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake til kundeoversikt
            </Button>
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <Shield className="h-3.5 w-3.5" />
              NIS2-vurdering — {customer?.customer_name || "Kunde"}
            </Badge>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NIS2-kartlegging</h1>
            <p className="text-muted-foreground mt-1">Velg en enhet for å starte eller se NIS2-vurdering</p>
          </div>

          {!selectedDevice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deviceList.map((device: any) => {
                const DeviceIcon = getDeviceIcon(device.name);
                const meta = device.metadata || {};
                return (
                  <Card
                    key={device.id}
                    className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-primary/30"
                    onClick={() => setSelectedDeviceId(device.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <DeviceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{device.name}</h3>
                        {meta.os && <p className="text-xs text-muted-foreground">{meta.os}</p>}
                        {meta.hostname && <p className="text-xs text-muted-foreground font-mono">{meta.hostname}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meta.encryption && <Badge variant="secondary" className="text-[13px]">Kryptert</Badge>}
                          {meta.mdm && <Badge variant="secondary" className="text-[13px]">MDM</Badge>}
                          {meta.antivirus && <Badge variant="secondary" className="text-[13px]">Antivirus</Badge>}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDeviceId(null)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Tilbake til enhetsliste
              </Button>
              <NIS2AssessmentTab
                assetId={selectedDevice.id}
                metadata={(selectedDevice.metadata as Record<string, any>) || {}}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
