

# Plan: Credits-system med UI og abonnementskobling

## Konsept

Hvert abonnement inkluderer et visst antall credits per måned (f.eks. Basis = 100, Premium = 300). Credits brukes til AI-handlinger (Lara-analyse, dokumentklassifisering, risikovurdering) og premium-operasjoner. Brukeren ser alltid sin saldo og kan kjøpe ekstra credits.

## 1. Database: `company_credits`-tabell

Ny tabell som sporer credits-saldo og forbruk:

```sql
CREATE TABLE company_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  monthly_allowance integer NOT NULL DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  next_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  amount integer NOT NULL,          -- positiv = påfyll, negativ = forbruk
  balance_after integer NOT NULL,
  transaction_type text NOT NULL,   -- 'monthly_grant', 'usage', 'purchase', 'refund'
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

## 2. Credits per plan i `planConstants.ts`

Utvide `PlanDefinition` med `monthlyCredits`:

| Plan | Credits/mnd |
|---|---|
| Free | 10 |
| Basis | 100 |
| Premium | 300 |
| Enterprise | Ubegrenset |

## 3. Hook: `useCredits()`

Ny hook som henter saldo fra `company_credits`, eksponerer `balance`, `monthlyAllowance`, `percentUsed`, og en `deductCredits(amount, description)`-funksjon.

## 4. UI-komponenter

### A. Credits-indikator i sidebar/topbar
En liten progress-bar med "42/100 credits" under brukerens profil i sidebaren.

### B. Credits-seksjon på Abonnement-siden
Viser nåværende saldo, forbruksgraf, og "Kjøp ekstra credits"-knapp.

### C. Credits-advarsel
Toast/banner når brukeren har <20% credits igjen.

## 5. Filer

| Fil | Endring |
|---|---|
| Ny migrasjon | `company_credits` + `credit_transactions` tabeller |
| `src/lib/planConstants.ts` | Legg til `monthlyCredits` per plan |
| `src/hooks/useCredits.ts` | Ny hook for saldo og transaksjoner |
| `src/components/sidebar/CreditIndicator.tsx` | Ny komponent — credits progress bar |
| `src/components/Sidebar.tsx` | Vis CreditIndicator nederst |
| `src/pages/Subscriptions.tsx` | Legg til credits-seksjon |

