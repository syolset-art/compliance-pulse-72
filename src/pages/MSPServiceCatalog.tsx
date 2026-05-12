import { MSPServiceCatalogTab } from "@/components/msp/MSPServiceCatalogTab";

export default function MSPServiceCatalog() {
  return (
    <div className="container max-w-5xl mx-auto pt-16 pb-10 px-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Tjenestekatalog</h1>
        <p className="text-sm text-muted-foreground">
          Definer dine egne tjenester og se hvordan de treffer kontrollpunkter på tvers av regelverk.
        </p>
      </header>
      <MSPServiceCatalogTab />
    </div>
  );
}
