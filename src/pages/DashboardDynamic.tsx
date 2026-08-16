import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { DemoModuleSwitcher } from "@/components/dashboard-dynamic/DemoModuleSwitcher";
import {
  AssetsBlock,
  CoreBlock,
  EmptyStateBlock,
  FrameworksBlock,
  LaraGreetingBlock,
  MaturityBlock,
  TrustBlock,
  VendorsBlock,
  WorkQueueBlock,
  type BlockProps,
} from "@/components/dashboard-dynamic/DashboardBlocks";
import {
  DASHBOARD_DEMO_EVENT,
  clearDemoOverrides,
  getDemoOverrides,
  resolveActiveModules,
  toggleDemoModule,
  type DashboardModuleKey,
  type DemoOverrides,
} from "@/lib/dashboardModules";
import {
  getVisibleBlocks,
  type DashboardBlockKey,
  type OpenWorkMap,
} from "@/lib/dynamicDashboardRegistry";

const BLOCK_COMPONENTS: Record<DashboardBlockKey, (p: BlockProps) => JSX.Element> = {
  "lara-greeting": LaraGreetingBlock,
  maturity: MaturityBlock,
  "work-queue": WorkQueueBlock,
  frameworks: FrameworksBlock,
  trust: TrustBlock,
  vendors: VendorsBlock,
  core: CoreBlock,
  assets: AssetsBlock,
};

// Mengde åpent arbeid per blokk — styrer rekkefølgen på modulkortene.
const OPEN_WORK: OpenWorkMap = {
  frameworks: 12,
  vendors: 5,
  core: 11,
  assets: 7,
  trust: 1,
};

export default function DashboardDynamic() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const [overrides, setOverrides] = useState<DemoOverrides>(() => getDemoOverrides());

  useEffect(() => {
    const sync = () => setOverrides(getDemoOverrides());
    window.addEventListener(DASHBOARD_DEMO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DASHBOARD_DEMO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const active = useMemo(() => resolveActiveModules(overrides), [overrides]);
  const blocks = useMemo(() => getVisibleBlocks(active, OPEN_WORK), [active]);

  const fullWidth = blocks.filter((b) => b.fullWidth);
  const gridBlocks = blocks.filter((b) => !b.fullWidth);

  const handleToggle = (key: DashboardModuleKey, value: boolean) => {
    toggleDemoModule(key, value);
    setOverrides(getDemoOverrides());
  };

  const handleReset = () => {
    clearDemoOverrides();
    setOverrides({});
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="container mx-auto max-w-5xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNb ? "Dashbord" : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Bygges dynamisk av produktene dere har aktivert."
                : "Built dynamically from the products you have activated."}
            </p>
          </div>

          <DemoModuleSwitcher
            isNb={isNb}
            overrides={overrides}
            active={active}
            onToggle={handleToggle}
            onReset={handleReset}
          />

          {fullWidth.map((b) => {
            const Comp = BLOCK_COMPONENTS[b.key];
            return <Comp key={b.key} isNb={isNb} active={active} />;
          })}

          {active.size === 0 && <EmptyStateBlock isNb={isNb} />}

          {gridBlocks.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {gridBlocks.map((b) => {
                const Comp = BLOCK_COMPONENTS[b.key];
                return <Comp key={b.key} isNb={isNb} active={active} />;
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
