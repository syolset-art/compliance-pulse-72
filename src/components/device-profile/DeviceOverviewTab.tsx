import { type DeviceControl } from "./DeviceTrustProfile";
import { DeviceControlStatus } from "./DeviceControlStatus";
import { DeviceRiskFindings } from "./DeviceRiskFindings";
import { DeviceActionPlans } from "./DeviceActionPlans";
import { DeviceTechnicalStatus } from "./DeviceTechnicalStatus";
import { DeviceAutomation } from "./DeviceAutomation";

interface DeviceOverviewTabProps {
  asset: Record<string, any>;
  meta: Record<string, any>;
  controls: DeviceControl[];
  trustScore: number;
}

export function DeviceOverviewTab({ asset, meta, controls, trustScore }: DeviceOverviewTabProps) {
  return (
    <div className="space-y-4">
      <DeviceControlStatus controls={controls} />
      <DeviceRiskFindings controls={controls} meta={meta} asset={asset} />
      <DeviceActionPlans controls={controls} meta={meta} totalControls={controls.length} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DeviceTechnicalStatus meta={meta} />
        <DeviceAutomation meta={meta} />
      </div>
    </div>
  );
}
