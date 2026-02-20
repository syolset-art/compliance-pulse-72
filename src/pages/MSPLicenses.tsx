import { Sidebar } from "@/components/Sidebar";
import { MSPLicensesTab } from "@/components/msp/MSPLicensesTab";

export default function MSPLicenses() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lisenser</h1>
            <p className="text-muted-foreground mt-1">Administrer lisenser for dine kunder</p>
          </div>
          <MSPLicensesTab />
        </div>
      </main>
    </div>
  );
}
