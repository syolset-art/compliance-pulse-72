
# Kontekstuelle hjelpeikoner i `ManualDocumentationDialog`

Erstatter "Neste steg"-callouten med diskrete `HelpCircle`-ikoner ved siden av hver felt-label. Hjelpeteksten vises i Tooltip/Popover, slik at dialogen blir renere og brukeren får hjelp der de trenger det.

## Endringer i `src/components/dialogs/ManualDocumentationDialog.tsx`

**1. Ny liten hjelpekomponent (inline i filen):**
`FieldHelp({ children })` — `HelpCircle` (h-3.5) i `text-muted-foreground` som trigger for en Popover med kort forklaring (maks ~3 setninger).

**2. Status-feltet**
- Fjern "Neste steg: last opp dokumentasjon…"-callouten som vises under Select ved `implemented`.
- Legg hjelpeikon på Status-label: *"Ikke påbegynt → Pågår → Implementert → Verifisert. Kun Verifisert krever signert dokument fra uavhengig organ."*
- Behold Verifisert-info-callouten (den er handling-krevende, ikke bare veiledning).

**3. Kommentar-feltet**
- Hjelpeikon på Kommentar-label:  
  *"Beskriv kort hvordan dere oppfyller kravet i praksis — hvilke rutiner, systemer eller ansvar dere har på plass. Dette hjelper Lara å vurdere modenhet og gir revisor kontekst."*
- Oppdater placeholder til å være mer konkret: *"F.eks. 'Vi har databehandleravtale med alle underleverandører, gjennomgått årlig av DPO.'"*

**4. Last-opp-feltet**
- Hjelpeikon på "Last opp dokumentasjon"-label, med dynamisk innhold basert på `requirementId`:
  - **Hvorfor obligatorisk:** *"For status Implementert / Verifisert krever regelverket at kravet kan dokumenteres. Uten dokumentasjon regnes kravet som egenrapportert og gir lav bevisverdi."*
  - **Vanlig dokumentasjon for dette kravet:** liste hentet fra ny helper (se punkt 5).

**5. Ny helper: `src/lib/requirementDocumentationHints.ts`**
Eksporterer `getTypicalDocumentation(requirementId: string): { articles: string[]; typicalDocs: string[] }`.
- Slår opp mot eksisterende `requirementDataSourceMap.ts` / `regulatoryArticles.ts` for artikkelnummer.
- Har en enkel mapping fra artikkel-prefiks (f.eks. "Art. 28" → ["Databehandleravtale", "Underleverandøroversikt"], "Art. 32" → ["Sikkerhetspolicy", "Risikovurdering", "Testrapport"], etc.).
- Fallback: `["Policy", "Prosedyre", "Rutinebeskrivelse"]`.

Popover-innholdet rendres som:
```
Hvorfor obligatorisk: <forklaring>
Typisk dokumentasjon for Art. 28:
· Databehandleravtale
· Underleverandøroversikt
```

## Ikke inkludert
- Ingen endring i `FrameworkRequirementsList.tsx` — dialogen får `requirementId` fra props (allerede tilgjengelig).
- Ingen ny AI-kall; hint-mapping er statisk. Kan senere byttes ut med Lara-basert forslag.
- Ingen endring i statusvalgene eller uploader-oppførselen.
