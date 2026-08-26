# PinBadge — gjenbrukbart kvalitetsmerke

Et lite, fylt rosett-ikon uten tekst som settes på regelverk og AI-agenter. Ved hover, tastaturfokus eller trykk (touch) åpnes en boks med tre faste opplysninger: kilde, sist verifisert og verifisert av.

## Oppførsel

- Komponenten regner aldri ut nivå selv — `level` mottas ferdig beregnet.
- Farger: menneske `#0F7A5A`, agent `#5EC4A0`, ingen `#8E8C85`. Er `drift` satt til true, overstyres fargen til `#E08A0B` uansett nivå.
- Ikonet er en fylt 12-takket rosett (viewBox `0 0 24 24`) med en «i» i flatens bakgrunnsfarge (ikke hardkodet hvit) — ingen kontur, hul midte eller ramme.
- Standard størrelse 19 px, minimum 16 px.

## Hover-boks

- Åpnes på hover og på tastaturfokus, lukkes ved blur/mouse leave.
- 330 px bred, plassert under merket og høyrejustert mot det.
- Tre linjer i fast rekkefølge, feltnavn inline i dempet tekst foran verdien:
  Kilde / Sist verifisert / Verifisert av.
- Verdier brytes over flere linjer ved behov — ingen truncate, ellipsis eller skjult overflyt.

## Tilgjengelighet

- `tabIndex={0}`, `role="button"`, synlig fokusring.
- `aria-label` beskriver tilstanden i ord, f.eks. «Pin for GDPR. Verifisert av menneske.» — farge er aldri eneste informasjonsbærer.
- Escape lukker boksen.

## Mobil

- På touch åpner trykk på merket samme boks; trykk utenfor lukker den.
- På detaljsider brukes en åpen variant der de tre feltene ligger synlig i stedet for bak et merke.

## Plassering i lister

Merket står til høyre i raden, etter navnet — aldri først, siden venstre kant leses som kontrollposisjon.

## Demo-side

Ny side med fire regelverk-rader som viser alle fire tilstandene (menneske, agent, drift, ingen), pluss et eksempel på den synlige detaljside-varianten.

## Teknisk

- Ny fil `src/components/pin/PinBadge.tsx` med `PinBadge` (merke + boks) og `PinDetails` (synlig felt-liste for detaljsider). Props: `level`, `drift`, `kilde`, `sistVerifisert`, `verifisertAv`, `size`, `label` (for aria-teksten).
- Inline SVG med de oppgitte polygon-punktene; `fill`/`stroke` = `currentColor`, `strokeWidth 1.4`, `strokeLinejoin="round"`. «i»-en tegnes med `circle` + `rect` og fyllfarge fra en `bgClassName`-prop (default flatens `bg-background`-token via `fill="hsl(var(--background))"`).
- De fire hex-fargene defineres som konstanter i komponenten (spesifisert merke-palett, ikke temafarger); resten av UI-et bruker semantiske tokens.
- Boksen er egen absolutt-posisjonert div (ikke Radix Tooltip) slik at hover, fokus og touch deler samme åpen-tilstand; lukking utenfor via `pointerdown`-lytter.
- Demo-side `src/pages/PinBadgeDemo.tsx` og rute `/pin-badge-demo` i `src/App.tsx`.
