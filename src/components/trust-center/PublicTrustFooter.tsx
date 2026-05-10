import { Shield, ShieldCheck, Lock } from "lucide-react";

export default function PublicTrustFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card/50 mt-12">
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <a
                href="https://mynder.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary dark:hover:text-accent transition-colors"
              >
                Mynder.no
              </a>
              <p className="text-xs text-muted-foreground">
                Trust Engine drives av Mynder — den europeiske standarden for digital tillit.
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="https://mynder.no/personvern" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-accent transition-colors">
              Personvern
            </a>
            <a href="https://mynder.no/vilkar" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-accent transition-colors">
              Vilkår
            </a>
            <a href="https://mynder.no/kontakt" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-accent transition-colors">
              Kontakt
            </a>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border/60">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Verifisert av Mynder
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary dark:text-accent" />
              Kryptert og signert av eier
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © {year} Mynder. Alle profiler er publisert frivillig av eieren.
          </p>
        </div>
      </div>
    </footer>
  );
}
