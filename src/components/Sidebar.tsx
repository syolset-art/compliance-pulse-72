import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Grid3x3, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  Settings,
  Shield,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Behandlingsprotokoller", href: "/protocols", icon: FileText },
  { name: "Systemer", href: "/systems", icon: Grid3x3 },
  { name: "Tjenesteområder", href: "/services", icon: Users },
  { name: "Avviksregister", href: "/deviations", icon: AlertTriangle },
  { name: "Mine oppgaver", href: "/tasks", icon: ClipboardList },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Mynder</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-4">
          <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              Administration
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-1">
          <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              Mynder innstillinger
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <Link
          to="/trust-profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Shield className="h-5 w-5" />
          Trust Profile
        </Link>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">MN</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Mynder</p>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <span>Bytt</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
