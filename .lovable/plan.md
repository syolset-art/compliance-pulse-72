

## Plan: Legg til Hult IT AS som MSP-partner

### Endring

Legg til en ny oppføring i `MSP_PARTNER_DIRECTORY` for **Hult IT AS**.

### `src/lib/securityServiceCatalog.ts`

Ny partner etter Crayon Cyber:

```ts
{
  id: "hult-it",
  name: "Hult IT AS",
  description: "Norsk IT-partner med fokus på drift, sikkerhet og compliance for små og mellomstore bedrifter. Tilbyr helhetlige managed services.",
  contactEmail: "post@hultit.no",
  website: "https://hultit.no",
  specialties: ["endpoint", "backup", "network", "compliance"],
}
```

### Filer

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Ny partner i `MSP_PARTNER_DIRECTORY` |

