

# Remove Authentication Requirement

## Summary
Remove the login wall so the prototype can be freely accessed without username/password. The auth page and code will remain but won't block access.

## Changes

### 1. Remove AuthGuard from all routes (`src/App.tsx`)
- Unwrap all `<AuthGuard>` wrappers from every route so pages render directly
- Keep the `/auth` route available but it won't be required

### 2. Make AuthProvider resilient (`src/hooks/useAuth.tsx`)
- Keep the provider in place (some components may reference `useAuth`) but make it never block rendering
- Return a mock/null user gracefully so downstream code doesn't break

### 3. Keep existing auth files
- `Auth.tsx`, `AuthGuard.tsx`, and `useAuth.tsx` remain in the codebase for future use but are effectively bypassed

## Technical Details

**`src/App.tsx`** -- Remove `<AuthGuard>` wrapper from every protected route:
```tsx
// Before
<Route path="/" element={<AuthGuard><Index /></AuthGuard>} />

// After
<Route path="/" element={<Index />} />
```

This applies to all ~20 protected routes.

**`src/hooks/useAuth.tsx`** -- Set `loading` to `false` immediately so no spinner is shown, and ensure components calling `useAuth()` get a stable response even without a real session.

