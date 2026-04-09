import { Sidebar } from "@/components/Sidebar";
import { MSPInvoicesTab } from "@/components/msp/MSPInvoicesTab";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function MSPInvoices() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fakturaer</h1>
              <p className="text-muted-foreground mt-1">Oversikt over fakturaer og betalinger</p>
            </div>
            <Link to="/msp-billing">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Fakturainnstillinger
              </Button>
            </Link>
          </div>
          <MSPInvoicesTab />
        </div>
      </main>
    </div>
  );
}
