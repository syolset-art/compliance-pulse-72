import { Sidebar } from "@/components/Sidebar";
import { MynderMeDashboard } from "@/components/mynder-me/MynderMeDashboard";

export default function MynderMe() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mynder Me</h1>
            <p className="text-muted-foreground mt-1">
              Personvern- og sikkerhetsappen for ansatte og kunders medarbeidere
            </p>
          </div>
          <MynderMeDashboard />
        </div>
      </main>
    </div>
  );
}
