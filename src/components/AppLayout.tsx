import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isMobile && <TopBar />}
        <main className="flex-1 overflow-auto pt-16 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
