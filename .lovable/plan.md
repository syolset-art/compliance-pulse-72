# Lesbare arkfaner på kundekortet i mobilvisning

De seks fanene på kundekortet (Veiledning fra Mynder, Tjenester og produkter, Meldinger, Dokumentasjon, Regelverk, Leveranser) ligger i dag i en horisontal rad som skroller. På en 375 px skjerm ser man bare de første to, og det finnes ingen visuell indikasjon på at det finnes flere.

## Hva som endres

- **Mobil (< sm):** fanene erstattes av en nedtrekksvelger som viser den aktive fanen med navn, og lister alle seks ved trykk. Prikk-varselet på «Veiledning fra Mynder» vises både i knappen og i listen.
- **Tablet/desktop (>= sm):** uendret utseende — samme rad med faner som i dag.
- Faneinnholdet, URL-synk og fanebytte fra handlingsmenyen fungerer som før.

## Teknisk

- Endres kun i `src/pages/MSPCustomerDetail.tsx`.
- Fanedefinisjonene (verdi, etikett, varselflagg) samles i én liste som brukes både av mobilvelgeren og `TabsList`, så det finnes ett sted å vedlikeholde.
- Mobilvelger: shadcn `Select` med `value={activeTab}` og `onValueChange={handleTabChange}`, synlig med `sm:hidden`; `nav`-elementet med `TabsList` får `hidden sm:block`.
- Ingen endringer i data, backend eller forretningslogikk.
