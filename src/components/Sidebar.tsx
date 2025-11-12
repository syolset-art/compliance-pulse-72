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
  ChevronDown,
  Bot,
  Menu,
  X,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI-agent", href: "/ai-setup", icon: Bot, highlight: true },
  { name: "Behandlingsprotokoller", href: "/protocols", icon: FileText },
  { name: "Systemer", href: "/systems", icon: Grid3x3 },
  { name: "Tjenesteområder", href: "/services", icon: Users },
  { name: "Avviksregister", href: "/deviations", icon: AlertTriangle },
  { name: "Mine oppgaver", href: "/tasks", icon: ClipboardList },
  { name: "Bærekraft", href: "/sustainability", icon: Leaf, highlight: true },
  { name: "Åpenhetsloven", href: "/transparency", icon: FileText, highlight: true },
];

const SidebarContent = () => {
  const location = useLocation();

  return (
    <>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.highlight && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
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
    </>
  );
};

export function Sidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Mynder</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Menu className="h-6 w-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="flex h-full flex-col bg-card">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-16" /> {/* Spacer for fixed header */}
      </>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <SidebarContent />
    </div>
  );
}
