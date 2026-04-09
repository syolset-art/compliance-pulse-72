import { Sidebar } from "@/components/Sidebar";
import { MSPLicensesTab } from "@/components/msp/MSPLicensesTab";
import { Button } from "@/components/ui/button";
import { MoreVertical, Database, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { seedDemoMSP, deleteDemoMSP } from "@/lib/demoSeedMSP";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function MSPLicenses() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
    queryClient.invalidateQueries({ queryKey: ["msp-licenses"] });
    queryClient.invalidateQueries({ queryKey: ["msp-purchases"] });
  };

  const handleSeed = async () => {
    try { await seedDemoMSP(); invalidate(); toast.success("Demo-data lastet inn"); }
    catch (e: any) { toast.error(e.message || "Kunne ikke laste demo-data"); }
  };

  const handleDelete = async () => {
    try { await deleteDemoMSP(); invalidate(); toast.success("Demo-data slettet"); }
    catch (e: any) { toast.error(e.message || "Kunne ikke slette demo-data"); }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lisenser</h1>
              <p className="text-muted-foreground mt-1">Administrer lisenser for dine kunder</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSeed}><Database className="h-4 w-4 mr-2" />Last inn demo-data</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Slett demo-data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <MSPLicensesTab />
        </div>
      </main>
    </div>
  );
}
