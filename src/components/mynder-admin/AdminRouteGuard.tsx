import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

const ALLOWED: AppRole[] = ["super_admin", "daglig_leder"];

export function isMynderAdmin(roles: AppRole[]) {
  return roles.some((r) => ALLOWED.includes(r));
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { allRoles, isLoading } = useUserRole();
  const { availableModes } = useWorkspaceMode();
  const navigate = useNavigate();

  if (isLoading) return null;

  if (!isMynderAdmin(allRoles) && !availableModes.includes("admin")) {

    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-64 pt-16 px-6 pb-12 flex items-center justify-center">
          <Card className="max-w-md p-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Begrenset tilgang</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Denne siden er forbeholdt ledelsen i Mynder (Daglig leder og Superbruker).
              </p>
            </div>
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              Tilbake til dashbord
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
