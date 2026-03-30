import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { DeviceHeader } from "./DeviceHeader";
import { DeviceControlStatus } from "./DeviceControlStatus";
import { DeviceRiskFindings } from "./DeviceRiskFindings";
import { DeviceRiskTab } from "./DeviceRiskTab";
import { DeviceActionPlans } from "./DeviceActionPlans";
import { DeviceTechnicalStatus } from "./DeviceTechnicalStatus";
import { DeviceAutomation } from "./DeviceAutomation";
import { DeviceOverviewTab } from "./DeviceOverviewTab";

interface DeviceTrustProfileProps {
  asset: Record<string, any>;
}

export function DeviceTrustProfile({ asset }: DeviceTrustProfileProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [activeTab, setActiveTab] = useState("overview");
  const meta = (asset.metadata || {}) as Record<string, any>;

  // Compute trust score from controls
  const controls = getDeviceControls(meta, asset);
  const passCount = controls.filter(c => c.status === "pass").length;
  const partialCount = controls.filter(c => c.status === "warn").length;
  const totalControls = controls.length;
  const trustScore = Math.round(((passCount + partialCount * 0.5) / totalControls) * 100);

  const tabDefs = [
    { value: "overview", label: isNb ? "Oversikt" : "Overview" },
    { value: "controls", label: isNb ? "Kontroller" : "Controls" },
    { value: "risk", label: isNb ? "Risiko" : "Risk" },
    { value: "actions", label: isNb ? "Tiltak" : "Action Plans" },
    { value: "activity", label: isNb ? "Aktivitet" : "Activity" },
    { value: "technical", label: isNb ? "Teknisk status" : "Technical Status" },
  ];

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
      <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-1">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {isNb ? "Tilbake" : "Back"}
      </Button>

      <DeviceHeader asset={asset} meta={meta} trustScore={trustScore} controls={controls} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 overflow-x-auto">
          {tabDefs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DeviceOverviewTab asset={asset} meta={meta} controls={controls} trustScore={trustScore} />
        </TabsContent>

        <TabsContent value="controls" className="mt-6">
          <DeviceControlStatus controls={controls} />
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <DeviceRiskFindings controls={controls} meta={meta} asset={asset} />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <DeviceActionPlans controls={controls} meta={meta} totalControls={totalControls} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-sm text-muted-foreground italic p-8 text-center">
            {isNb ? "Aktivitetslogg kommer snart" : "Activity log coming soon"}
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6 space-y-4">
          <DeviceTechnicalStatus meta={meta} />
          <DeviceAutomation meta={meta} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Device control evaluation ─────────────────────────────────────

export interface DeviceControl {
  id: string;
  label: string;
  labelEn: string;
  status: "pass" | "fail" | "warn";
  category: "operations" | "identity" | "data_protection";
  recommendation: string;
  recommendationEn: string;
  isoRef: string;
  scoreImpact: number; // percentage points improvement if fixed
  fixEffort: string;
  fixEffortEn: string;
  serviceAvailable: boolean;
}

export function getDeviceControls(meta: Record<string, any>, asset: Record<string, any>): DeviceControl[] {
  const patchDays = meta.last_patch_date
    ? Math.floor((Date.now() - new Date(meta.last_patch_date).getTime()) / 86400000)
    : 999;

  return [
    {
      id: "encryption",
      label: "Diskkryptering aktivert",
      labelEn: "Disk encryption enabled",
      status: meta.encryption ? "pass" : "fail",
      category: "data_protection",
      recommendation: "Aktiver BitLocker, FileVault eller LUKS",
      recommendationEn: "Enable BitLocker, FileVault, or LUKS",
      isoRef: "A.8.1 / A.7.10",
      scoreImpact: 8,
      fixEffort: "1–2 timer",
      fixEffortEn: "1–2 hours",
      serviceAvailable: true,
    },
    {
      id: "edr",
      label: "Endpoint protection (EDR)",
      labelEn: "Endpoint protection (EDR)",
      status: meta.antivirus === "aktiv" || meta.antivirus === "active" ? "pass" : meta.antivirus === "utgått" ? "warn" : "fail",
      category: "operations",
      recommendation: "Installer EDR-løsning (CrowdStrike, Defender for Endpoint)",
      recommendationEn: "Install EDR solution (CrowdStrike, Defender for Endpoint)",
      isoRef: "A.8.7",
      scoreImpact: 10,
      fixEffort: "Abonnement",
      fixEffortEn: "Subscription",
      serviceAvailable: true,
    },
    {
      id: "mdm",
      label: "MDM / Endpoint management",
      labelEn: "MDM / Endpoint management",
      status: meta.mdm ? "pass" : "fail",
      category: "identity",
      recommendation: "Registrer enheten i Intune, Jamf eller tilsvarende",
      recommendationEn: "Enroll device in Intune, Jamf, or equivalent",
      isoRef: "A.8.1",
      scoreImpact: 8,
      fixEffort: "1 dag",
      fixEffortEn: "1 day",
      serviceAvailable: true,
    },
    {
      id: "patching",
      label: "OS oppdatert (< 30 dager)",
      labelEn: "OS patched (< 30 days)",
      status: patchDays <= 30 ? "pass" : patchDays <= 60 ? "warn" : "fail",
      category: "operations",
      recommendation: "Konfigurer automatisk oppdatering",
      recommendationEn: "Configure automatic updates",
      isoRef: "A.8.8",
      scoreImpact: 6,
      fixEffort: "30 min",
      fixEffortEn: "30 min",
      serviceAvailable: true,
    },
    {
      id: "backup",
      label: "Backup konfigurert",
      labelEn: "Backup configured",
      status: meta.backup ? "pass" : "fail",
      category: "data_protection",
      recommendation: "Sett opp automatisk backup til sky eller NAS",
      recommendationEn: "Set up automatic backup to cloud or NAS",
      isoRef: "A.8.13",
      scoreImpact: 7,
      fixEffort: "1 time",
      fixEffortEn: "1 hour",
      serviceAvailable: true,
    },
    {
      id: "location",
      label: "Fysisk plassering dokumentert",
      labelEn: "Physical location documented",
      status: meta.location ? "pass" : "fail",
      category: "operations",
      recommendation: "Registrer enhetens plassering",
      recommendationEn: "Register device location",
      isoRef: "A.7.9",
      scoreImpact: 3,
      fixEffort: "5 min",
      fixEffortEn: "5 min",
      serviceAvailable: false,
    },
    {
      id: "asset_manager",
      label: "Ansvarlig person tilordnet",
      labelEn: "Responsible person assigned",
      status: asset.asset_manager ? "pass" : "fail",
      category: "operations",
      recommendation: "Tilordne en ansvarlig person",
      recommendationEn: "Assign a responsible person",
      isoRef: "A.8.1",
      scoreImpact: 4,
      fixEffort: "5 min",
      fixEffortEn: "5 min",
      serviceAvailable: false,
    },
    {
      id: "lifecycle",
      label: "Livssyklusstatus definert",
      labelEn: "Lifecycle status defined",
      status: asset.lifecycle_status && asset.lifecycle_status !== "unknown" ? "pass" : "fail",
      category: "operations",
      recommendation: "Sett livssyklusstatus",
      recommendationEn: "Set lifecycle status",
      isoRef: "A.7.14",
      scoreImpact: 3,
      fixEffort: "5 min",
      fixEffortEn: "5 min",
      serviceAvailable: false,
    },
    {
      id: "registered",
      label: "Enhet registrert",
      labelEn: "Device registered",
      status: "pass", // always pass if we're viewing it
      category: "operations",
      recommendation: "",
      recommendationEn: "",
      isoRef: "A.8.1",
      scoreImpact: 0,
      fixEffort: "",
      fixEffortEn: "",
      serviceAvailable: false,
    },
    {
      id: "user_linked",
      label: "Bruker tilknyttet",
      labelEn: "User linked",
      status: asset.asset_manager ? "pass" : "fail",
      category: "identity",
      recommendation: "Koble enheten til en bruker",
      recommendationEn: "Link device to a user",
      isoRef: "A.8.1",
      scoreImpact: 3,
      fixEffort: "5 min",
      fixEffortEn: "5 min",
      serviceAvailable: false,
    },
    {
      id: "mfa",
      label: "MFA / tilgangskontroll",
      labelEn: "MFA / access control",
      status: meta.nis2_mfa_enabled ? "pass" : meta.mdm ? "warn" : "fail",
      category: "identity",
      recommendation: "Aktiver MFA for enhetstilgang",
      recommendationEn: "Enable MFA for device access",
      isoRef: "A.8.5",
      scoreImpact: 7,
      fixEffort: "30 min",
      fixEffortEn: "30 min",
      serviceAvailable: true,
    },
  ];
}
