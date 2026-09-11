import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export const AGENT_NAV = [
  { href: "/agents", label: "Oversikt" },
  { href: "/agents/mapping", label: "Kartlegging" },
  { href: "/agents/all", label: "Alle agenter" },
  { href: "/agents/suggestions", label: "Forslag" },
  { href: "/agents/playbooks", label: "Playbook" },
];

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AgentsPageShell({ title, description, actions, children }: Props) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 pt-16 sm:p-6 sm:pt-20 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
              {AGENT_NAV.map((item) => {
                const active =
                  item.href === "/agents"
                    ? location.pathname === "/agents"
                    : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
