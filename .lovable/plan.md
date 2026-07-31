## Problemet

Når partneren skriver inn en tjeneste, får de en liste med «Foreslåtte kontrollområder» uten noe signal om hvor sikkert treffet er. I ditt eget skjermbilde vises blant annet:

- `SOC 2 › Trust Service Criteria › Trust Service Criteria` (ingen reell kobling — bare gjentatt label)
- `ISO 27001 › overlapp › overlapp` (støy fra katalogen, ikke et krav)

ved siden av åpenbart riktige treff som `ISO 27001 › A.8.16 › Overvåking`. Alt ser likt ut, så brukeren kan ikke skille et sterkt treff fra støy — og da stoler de ikke på noe av det.

Årsaken er i `src/lib/serviceMappingSuggester.ts`: alle treff med `score > 0` returneres likestilt, og kontrollpunkter uten reelt innhold (label = frameworknavn, «overlapp») filtreres ikke bort.

## Løsning: tre grep

**1. Konfidensnivå i stedet for flat liste**

Del `score` i tre nivåer og vis dem visuelt:

| Nivå | Betydning | UI |
|---|---|---|
| Høy | Frasetreff eller flere nøkkelord | Grønn prikk + forhåndsvalgt |
| Middels | Ett tydelig nøkkelordtreff | Gul prikk + forhåndsvalgt |
| Lav | Svakt delstrengtreff | Grå prikk + **ikke** forhåndsvalgt, samlet under «Vis 4 svakere forslag» |

Kun høy/middels vises åpent. Det gjør listen kortere og signaliserer at systemet selv skiller skitt fra kanel.

**2. «Derfor foreslås dette» — synlig begrunnelse**

Hver rad får en liten begrunnelseslinje eller hover som viser hvilke ord i tjenestenavnet/beskrivelsen som traff kravet, f.eks. *Traff på: «overvåking», «SOC»*. `matchedTerms` finnes allerede i datamodellen, men brukes ikke i UI. Dette er det enkleste og sterkeste tillitsgrepet: brukeren ser resonnementet, ikke bare konklusjonen.

**3. Bekreftelsesstatus — forslag vs. bekreftet av deg**

Et forslag er ikke en sannhet før mennesket har sagt ja. Innfør to tilstander per kobling:
- **Foreslått av Lara** (ubekreftet) — dempet, med Sparkles-ikon
- **Bekreftet av deg** — normal vekt, uten AI-merking

Når brukeren huker av en rad, går den fra «foreslått» til «bekreftet». Toppen av boksen viser status i klartekst: *«3 bekreftet · 2 forslag til vurdering»*. Ved lagring merkes koblingene slik at kundevendte flater (tilbud, katalogeksport, `CustomerCatalogPreview`) kan vise kun bekreftede koblinger — aldri ubekreftede AI-gjetninger til sluttkunde.

## Rydding i datagrunnlaget

Uavhengig av UI må støyen bort, ellers undergraver den alt annet:
- Filtrer bort kontrollpunkter der `controlLabel` er identisk med frameworknavnet, eller der `controlId`/label er generiske ord som «overlapp».
- Krev minimum-score for i det hele tatt å vises (i dag holder det med ett svakt delstrengtreff på fire tegn).
- Fjern duplikater der samme krav treffes via flere nøkkelord.

## Teknisk

- `src/lib/serviceMappingSuggester.ts`: legg til `confidence: "high" | "medium" | "low"` i `ControlSuggestion`, terskler basert på eksisterende `score`, samt et støyfilter (`isMeaningfulControlPoint`) og en høyere minsteterskel.
- `src/components/msp/CustomServiceDialog.tsx`: ny radkomponent med konfidensprikk, begrunnelsestekst fra `matchedTerms`, gruppering høy/middels åpent + lav bak «Vis flere», statuslinje øverst, og forhåndsvalg kun av høy/middels.
- `ServiceMapping` utvides med `confirmed: boolean` (avhuking = bekreftet). Bakoverkompatibelt: eksisterende lagrede mappinger uten feltet behandles som bekreftet.
- Gjenbruk `AiMappingDisclosure` som «icon»-variant i headeren i stedet for lang forklarende tekst — minimal tekst, samme transparens.
- Ingen endringer i pris-, aktivitets- eller lagringslogikk utover det nye feltet.

## Utenfor omfang

- Ingen ny AI-modell eller edge function — matchingen forblir regelbasert og forutsigbar, noe som i seg selv er lettere å forklare og stole på.
- Kundevendt filtrering av ubekreftede koblinger forberedes i datamodellen, men rulles ut på kundeflatene som eget steg hvis du ønsker det.
