import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Connection {
  id: string;
  employee_token: string;
  connected_at: string;
  status: string;
  last_seen_at: string | null;
}

export function ConnectionsTab() {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("employee_connections")
        .select("*")
        .order("connected_at", { ascending: false });
      setConnections((data as Connection[]) || []);
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Tilkoblede enheter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Ansatte som har koblet Mynder Me-appen til virksomheten. Kun anonymiserte tokens vises — ingen persondata lagres.
        </p>
        <div className="space-y-3">
          {connections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm text-foreground">{conn.employee_token.substring(0, 12)}...{conn.employee_token.slice(-4)}</p>
                  <p className="text-xs text-muted-foreground">
                    Tilkoblet {format(new Date(conn.connected_at), "d. MMM yyyy", { locale: nb })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {conn.last_seen_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sist sett {format(new Date(conn.last_seen_at), "d. MMM HH:mm", { locale: nb })}
                  </span>
                )}
                <Badge variant={conn.status === "active" ? "default" : "secondary"}>
                  {conn.status === "active" ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Ingen tilkoblinger ennå.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
