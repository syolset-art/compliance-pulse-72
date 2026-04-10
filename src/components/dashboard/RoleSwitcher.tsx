import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Crown, Shield, Lock, ClipboardCheck, Bot, User, LayoutGrid, AlertTriangle, FileSearch, Leaf, MonitorCog, GraduationCap, Truck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { DASHBOARD_LAYOUTS } from "@/lib/dashboardLayouts";

const ROLE_ICONS: Record<AppRole | 'all', React.ReactNode> = {
  daglig_leder: <Crown className="h-4 w-4" />,
  personvernombud: <Shield className="h-4 w-4" />,
  sikkerhetsansvarlig: <Lock className="h-4 w-4" />,
  compliance_ansvarlig: <ClipboardCheck className="h-4 w-4" />,
  ai_governance: <Bot className="h-4 w-4" />,
  operativ_bruker: <User className="h-4 w-4" />,
  risk_owner: <AlertTriangle className="h-4 w-4" />,
  internal_auditor: <FileSearch className="h-4 w-4" />,
  esg_officer: <Leaf className="h-4 w-4" />,
  incident_manager: <AlertTriangle className="h-4 w-4" />,
  system_owner: <MonitorCog className="h-4 w-4" />,
  training_officer: <GraduationCap className="h-4 w-4" />,
  vendor_manager: <Truck className="h-4 w-4" />,
  it_manager: <Settings className="h-4 w-4" />,
  all: <LayoutGrid className="h-4 w-4" />
};

interface RoleSwitcherProps {
  onViewChange?: (view: AppRole | 'all') => void;
  showAllOption?: boolean;
  className?: string;
}

export function RoleSwitcher({ onViewChange, showAllOption = true, className }: RoleSwitcherProps) {
  const { t } = useTranslation();
  const { primaryRole, allRoles, setPrimaryRole, isDemo } = useUserRole();
  const [activeView, setActiveView] = useState<AppRole | 'all'>(primaryRole);

  const handleViewChange = (view: AppRole | 'all') => {
    setActiveView(view);
    if (view !== 'all') {
      setPrimaryRole(view);
    }
    onViewChange?.(view);
  };

  // All available roles for switching
  const availableRoles: (AppRole | 'all')[] = showAllOption 
    ? [...Object.keys(DASHBOARD_LAYOUTS) as AppRole[], 'all']
    : Object.keys(DASHBOARD_LAYOUTS) as AppRole[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          {ROLE_ICONS[activeView]}
          <span className="ml-2 hidden sm:inline">
            {activeView === 'all' ? t("roles.all") : t(`roles.${activeView}`)}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          {isDemo && (
            <Badge variant="secondary" className="ml-2 text-xs">Demo</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          {t("roles.selectView")}
        </div>
        <DropdownMenuSeparator />
        
        {availableRoles.map((role) => {
          const isActive = activeView === role;
          const description = role === 'all' 
            ? t("roles.all")
            : t(`dashboardViews.${role}.description`);
          const isUserRole = role !== 'all' && allRoles.includes(role);
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleViewChange(role)}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className={`mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {ROLE_ICONS[role]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                    {role === 'all' ? t("roles.all") : t(`roles.${role}`)}
                  </span>
                  {isUserRole && (
                    <Badge variant="outline" className="text-xs">{t("roles.yourRole")}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary mt-0.5" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("roles.switchViewHelp")}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
