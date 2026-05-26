import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, ShieldCheck, Lock, CheckCircle2, Globe, Building2, ArrowRight, Loader2, User, Sparkles, Info, SearchX } from "lucide-react";
import PublicTrustFooter from "@/components/trust-center/PublicTrustFooter";
import CreateTrustProfileModal from "@/components/trust-center/CreateTrustProfileModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function TrustEngine() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open && searchParams.get("create")) {
      searchParams.delete("create");
      setSearchParams(searchParams, { replace: true });
    }
  };

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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm gap-1.5 border-primary/30 text-primary dark:border-accent/40 dark:text-accent">
              <Globe className="h-3.5 w-3.5" />
              {isNb ? "Portable Trust" : "Portable Trust"}
            </Badge>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 px-6">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 dark:bg-accent/15 dark:text-accent dark:border-accent/30 text-sm px-4 py-1.5">
            {isNb ? "Den nye europeiske standarden" : "The New European Standard"}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Mynder Trust Engine
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isNb
              ? "En åpen database over verifiserte Trust Profiler. Søk blant organisasjoner og se deres etterlevelse, sikkerhetstiltak og transparensdata — alt på ett sted."
              : "An open database of verified Trust Profiles. Search organizations and explore their compliance, security measures, and transparency data — all in one place."}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isNb ? "Søk etter organisasjon..." : "Search for an organization..."}
                className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-base">
              {isNb ? "Søk" : "Search"}
            </Button>
          </form>

          {/* Trust assurance row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              {isNb ? "Verifiserte profiler" : "Verified profiles"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-primary dark:text-accent" />
              {isNb ? "Kryptert og signert av eier" : "Encrypted and signed by the owner"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary dark:text-accent" />
              {isNb ? "Frivillig publisert av leverandøren" : "Voluntarily published by the vendor"}
            </span>
          </div>

          {/* Create your own CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="gap-2 rounded-xl"
            >
              <Sparkles className="h-4 w-4" />
              {isNb ? "Opprett din egen Trust Profile" : "Create your own Trust Profile"}
            </Button>
          </div>
        </div>
      </section>

      {/* Preview / forhåndsvisning av aktivert side */}
      <section className="px-6 pb-12">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb
                ? "Forhåndsvisning — slik ser siden ut når den er aktivert"
                : "Preview — how the page looks once activated"}
            </p>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {isNb ? "Kommer snart" : "Coming soon"}
            </Badge>
          </div>
          <Card variant="luxury" className="p-6 border-dashed bg-muted/20 space-y-5 pointer-events-none select-none opacity-90">
            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">{isNb ? "Filtre:" : "Filters:"}</span>
              <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-1">{isNb ? "Alle" : "All"}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 gap-1">
                <Globe className="h-3 w-3" /> {isNb ? "Land: Alle" : "Country: All"}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">SaaS</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">{isNb ? "Konsulent" : "Consultant"}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">ISO 27001</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">GDPR</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">{isNb ? "+ Flere" : "+ More"}</Badge>
            </div>

            {/* Country picker mockup */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary dark:text-accent font-medium">
                  <Globe className="h-3.5 w-3.5" /> {isNb ? "Alle land" : "All countries"}
                </div>
                {[
                  { c: "NO", nNb: "Norge", nEn: "Norway", x: 3 },
                  { c: "SE", nNb: "Sverige", nEn: "Sweden", x: 1 },
                  { c: "DK", nNb: "Danmark", nEn: "Denmark", x: 1 },
                  { c: "FI", nNb: "Finland", nEn: "Finland", x: 0 },
                  { c: "DE", nNb: "Tyskland", nEn: "Germany", x: 0 },
                  { c: "NL", nNb: "Nederland", nEn: "Netherlands", x: 0 },
                  { c: "ES", nNb: "Spania", nEn: "Spain", x: 0 },
                ].map((l) => (
                  <div key={l.c} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40 text-foreground">
                    <span className="text-[10px] font-semibold text-muted-foreground">{l.c}</span>
                    <span>{isNb ? l.nNb : l.nEn}</span>
                    <span className="text-muted-foreground">({l.x})</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {isNb
                ? "Filtrering på land, bransje og rammeverk aktiveres når flere Trust Profiler publiseres."
                : "Filtering by country, industry, and framework will be enabled as more Trust Profiles are published."}
            </p>
          </Card>
        </div>
      </section>

      {/* My Trust Profile shortcut */}
      {myAsset && (
        <section className="px-6 -mt-6 mb-2">
          <div className="container max-w-4xl mx-auto">
            <Card variant="luxury" className="p-5 border-primary/20 bg-primary/5 dark:border-accent/30 dark:bg-accent/10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary dark:text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary dark:text-accent">
                      {isNb ? "Min Trust Profile" : "My Trust Profile"}
                    </p>
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {myAsset.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {myAssetPublished
                        ? (isNb
                            ? "Publisert i Trust Engine — alt samlet i ditt Trust Center"
                            : "Published in Trust Engine — everything gathered in your Trust Center")
                        : (isNb ? "Ikke publisert ennå" : "Not published yet")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {myAssetPublished ? (
                    <Button
                      onClick={() => navigate(`/trust-engine/profile/${myAsset.id}`)}
                      className="gap-2"
                    >
                      {isNb ? "Åpne mitt Trust Center" : "Open my Trust Center"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate("/trust-center/profile")}
                      className="gap-2"
                    >
                      {isNb ? "Publiser Trust Profile" : "Publish Trust Profile"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Results */}
      <section className="pb-20 px-6">
        <div className="container max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isNb ? "Søker i Trust Engine..." : "Searching Trust Engine..."}
              </p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {query
                      ? (isNb
                          ? `Resultater for «${query}»`
                          : `Results for "${query}"`)
                      : (isNb
                          ? "Tilgjengelige Trust Profiler"
                          : "Available Trust Profiles")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isNb
                      ? `${results.length} organisasjon${results.length !== 1 ? "er" : ""} funnet`
                      : `${results.length} organization${results.length !== 1 ? "s" : ""} found`}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  {isNb ? "Verifisert" : "Verified"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground/80 inline-flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {isNb
                  ? "Alle organisasjoner her har selv valgt å publisere sin Trust Profile."
                  : "Every organization here has voluntarily chosen to publish its Trust Profile."}
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
                        <Building2 className="h-6 w-6 text-primary dark:text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {asset.description || asset.category || (isNb ? "Organisasjon" : "Organization")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {asset.compliance_score != null && asset.compliance_score > 0 && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary dark:text-accent">{asset.compliance_score}%</p>
                          <p className="text-xs text-muted-foreground">Trust Score</p>
                        </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary dark:group-hover:text-accent transition-colors" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : query ? (
            /* Active search with no results */
            <Card variant="luxury" className="p-10 text-center border-dashed">
              <SearchX className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isNb
                  ? `Ingen organisasjoner funnet for «${query}»`
                  : `No organizations found for "${query}"`}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {isNb
                  ? "Selskapet har ennå ikke publisert sin Trust Profile i Mynder Trust Engine. Du kan be dem om å opprette en, eller opprette din egen."
                  : "The company has not yet published its Trust Profile in Mynder Trust Engine. You can ask them to create one, or create your own."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setSearch(""); setQuery(""); }}
                  className="rounded-xl"
                >
                  {isNb ? "Tilbake til oversikt" : "Back to overview"}
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="gap-2 rounded-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  {isNb ? "Opprett Trust Profile" : "Create Trust Profile"}
                </Button>
              </div>
            </Card>
          ) : (
            /* No published profiles at all */
            <Card variant="luxury" className="p-10 text-center border-dashed">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isNb
                  ? "Ingen Trust Profiler publisert ennå"
                  : "No Trust Profiles published yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {isNb
                  ? "Det er ingen organisasjoner som har publisert sin Trust Profile i databasen ennå. Bli den første!"
                  : "There are no organizations that have published their Trust Profile in the database yet. Be the first!"}
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-2 rounded-xl"
              >
                <Sparkles className="h-4 w-4" />
                {isNb ? "Opprett din Trust Profile" : "Create your Trust Profile"}
              </Button>
            </Card>
          )}
        </div>
      </section>

      <PublicTrustFooter />
      <CreateTrustProfileModal open={createOpen} onOpenChange={handleCreateOpenChange} />
    </div>
  );
}
