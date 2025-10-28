import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-4 text-xl text-foreground">Oops! Siden ble ikke funnet</p>
        <p className="mb-8 text-muted-foreground">
          Siden du leter etter eksisterer ikke eller har blitt flyttet.
        </p>
        <Button asChild>
          <a href="/" className="gap-2">
            <Home className="h-4 w-4" />
            Tilbake til Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
