

## Plan: Vis hjelp-ikonet på mobil

### Problem
`<TopBar />` rendres kun i desktop-visningen av `Sidebar` (linje 677). På mobil vises en egen header (linje 648-666) med logo, språkvelger, tema-toggle og hamburger-meny — men **hjelp-ikonet (?) mangler helt**.

### Løsning
Legg til hjelp-ikonet i den mobile headeren, ved siden av de eksisterende ikonene (språk, tema, hamburger).

### Teknisk endring

**`src/components/Sidebar.tsx` (linje 648-665)**

Legg til en HelpCircle-knapp i den mobile headeren:

```tsx
<div className="flex items-center gap-2">
  {/* Nytt: Hjelp-ikon for mobil */}
  <button
    onClick={() => window.dispatchEvent(new CustomEvent("open-page-help"))}
    className="p-2 hover:bg-accent rounded-lg"
  >
    <HelpCircle className="h-5 w-5 text-muted-foreground" />
  </button>
  <LanguageSwitcher />
  <ThemeToggle />
  <Sheet ...>
    ...
  </Sheet>
</div>
```

HelpCircle er allerede importert i filen. Ikonet bruker samme event (`open-page-help`) som TopBar, så alle eksisterende `usePageHelpListener`-hooks på sidene vil fungere som før.

