import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, Search, ArrowRight, Sparkles } from "lucide-react";
import {
  WIKI_ARTICLES, WIKI_CATEGORIES, searchWikiArticles, type WikiCategory,
} from "@/lib/wikiArticles";

export default function Wiki() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | WikiCategory>("all");

  const results = useMemo(() => {
    const byCategory = category === "all"
      ? WIKI_ARTICLES
      : WIKI_ARTICLES.filter((a) => a.category === category);
    return searchWikiArticles(query, byCategory);
  }, [query, category]);

  const grouped = useMemo(() => {
    return WIKI_CATEGORIES
      .map((c) => ({ ...c, articles: results.filter((a) => a.category === c.id) }))
      .filter((c) => c.articles.length > 0);
  }, [results]);

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pt-11 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-4xl mx-auto p-4 md:p-10 pt-8 md:pt-10 space-y-6">
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-muted-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              {isNb ? "Tilbake" : "Back"}
            </Button>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mynder Wiki</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNb
                    ? "Lær hvordan ting fungerer — fra scoringsmodellen til partner workspace og alle produktene."
                    : "Learn how things work — from the scoring model to the partner workspace and every product."}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isNb
                ? "Søk, f.eks. «score», «arbeidsområde» eller «provisjon»"
                : "Search, e.g. \"score\", \"work area\" or \"commission\""}
              className="pl-9 h-11"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {isNb ? "Alle" : "All"}
            </button>
            {WIKI_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {isNb ? c.labelNb : c.labelEn}
              </button>
            ))}
          </div>

          {results.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Sparkles className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {isNb
                    ? "Fant ingen artikler. Prøv et annet søkeord."
                    : "No articles found. Try another search term."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Articles grouped by category */}
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {isNb ? group.labelNb : group.labelEn}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.articles.length}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {group.articles.map((a) => (
                        <AccordionItem key={a.slug} value={a.slug} className="px-4 last:border-b-0">
                          <AccordionTrigger className="py-3 hover:no-underline text-left">
                            <div className="pr-3">
                              <p className="text-sm font-medium">{isNb ? a.titleNb : a.titleEn}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {isNb ? a.summaryNb : a.summaryEn}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-2.5">
                              {(isNb ? a.bodyNb : a.bodyEn).map((p, i) => (
                                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                                  {p}
                                </p>
                              ))}
                              {a.link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-1 gap-1.5"
                                  onClick={() => navigate(a.link!.path)}
                                >
                                  {isNb ? a.link.labelNb : a.link.labelEn}
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
