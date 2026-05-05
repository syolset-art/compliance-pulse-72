import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, Globe, Building2, ArrowRight, Loader2, User } from "lucide-react";

export default function TrustEngine() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data: results, isLoading } = useQuery({
    queryKey: ["trust-engine-search", query],
    queryFn: async () => {
      let q = supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
        .neq("publish_mode", "private")
        .not("publish_mode", "is", null)
        .order("name");
      if (query) {
        q = q.ilike("name", `%${query}%`);
      }
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: myAsset } = useQuery({
    queryKey: ["trust-engine-my-asset"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) return null;
      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const myAssetPublished = myAsset && myAsset.publish_mode && myAsset.publish_mode !== "private";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Mynder Trust Engine</h1>
              <p className="text-xs text-muted-foreground">Portable Trust</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm gap-1.5 border-primary/30 text-primary">
            <Globe className="h-3.5 w-3.5" />
            Open Database
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 px-6">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1.5">
            The New European Standard
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Mynder Trust Engine
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            En åpen database over verifiserte Trust Profiler. Søk blant organisasjoner og se deres
            etterlevelse, sikkerhetstiltak og transparensdata — alt på ett sted.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Søk etter organisasjon..."
                className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-base">
              Søk
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="pb-20 px-6">
        <div className="container max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-6">
                {results.length} organisasjon{results.length !== 1 ? "er" : ""} funnet
              </p>
              {results.map((asset) => (
                <Card
                  key={asset.id}
                  variant="luxury"
                  className="p-6 cursor-pointer hover:border-primary/30 transition-all group"
                  onClick={() => navigate(`/trust-engine/profile/${asset.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {asset.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] gap-1 border-success/30 text-success bg-success/5">
                            <Shield className="h-2.5 w-2.5" />
                            Publisert
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {asset.description || asset.category || "Organisasjon"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {asset.compliance_score != null && asset.compliance_score > 0 && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{asset.compliance_score}%</p>
                          <p className="text-xs text-muted-foreground">Trust Score</p>
                        </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-lg text-muted-foreground">Ingen organisasjoner funnet for «{query}»</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
