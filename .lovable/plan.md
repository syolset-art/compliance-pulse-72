

# Remove Authentication Requirement

## Summary
Remove the login wall so the prototype can be freely accessed without requiring username/password. Auth code stays in the codebase but is bypassed.

## Changes

### 1. Remove AuthGuard from all routes (`src/App.tsx`)
- Unwrap every `<AuthGuard>` wrapper so all pages render directly without authentication checks
- Keep the `/auth` route available but not required
- Remove the `AuthGuard` import

### 2. Make AuthProvider non-blocking (`src/hooks/useAuth.tsx`)
- Set `loading` initial state to `false` so no loading spinner is ever shown
- Keep the provider functional for any components that call `useAuth()` -- they will just get `null` user/session values gracefully

### 3. Files preserved (no changes)
- `Auth.tsx`, `AuthGuard.tsx` remain in codebase for future re-activation

## Technical Details

**`src/App.tsx`** -- Remove `<AuthGuard>` from all ~20 routes:
```tsx
// Before
<Route path="/" element={<AuthGuard><Index /></AuthGuard>} />

// After
<Route path="/" element={<Index />} />
```

**`src/hooks/useAuth.tsx`** -- Change initial loading state:
```tsx
// Before
const [loading, setLoading] = useState(true);

// After
const [loading, setLoading] = useState(false);
```

